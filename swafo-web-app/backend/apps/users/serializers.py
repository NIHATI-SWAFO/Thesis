import math
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import User, StudentProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role']


class StudentProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    violation_count = serializers.SerializerMethodField()
    is_repeat_offender = serializers.SerializerMethodField()
    has_pending_violations = serializers.SerializerMethodField()
    risk_score = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'student_number', 'user_details', 'course', 'year_level',
            'violation_count', 'is_repeat_offender', 'has_pending_violations',
            'clearance_status', 'risk_score',
        ]

    # ─── Basic Counts ──────────────────────────────────────────────
    def get_violation_count(self, obj):
        return obj.violations.count()

    def get_is_repeat_offender(self, obj):
        # Strict Institutional Standard: Non-Compliant if 2+ total violations
        return obj.violations.count() >= 2

    def get_has_pending_violations(self, obj):
        # Terminal states are CLOSED and DISMISSED — anything else is still active
        return obj.violations.exclude(status__in=['CLOSED', 'DISMISSED']).exists()

    # ─── Temporal Decay Risk Score ─────────────────────────────────
    #
    # PURPOSE:
    #   Gives the Director a single number (0–100) that answers:
    #   "How behaviorally risky is this student RIGHT NOW?"
    #
    # WHY TEMPORAL DECAY?
    #   A student who committed 3 violations last week is more concerning
    #   than one who committed 3 violations six months ago.
    #   Raw violation counts hide this critical recency dimension.
    #
    # FORMULA (per violation):
    #   weight = severity_base × e^(−λ × days_since)
    #
    #   - severity_base: Major = 30, Minor = 15, General = 10
    #   - λ (decay rate): 0.023 → half-life ≈ 30 days
    #     (a violation loses ~50% of its risk contribution after 30 days)
    #   - Unresolved violations get a 1.5× multiplier (still an active threat)
    #
    # FINAL SCORE:
    #   Sum of all per-violation weights, capped at 100.
    #
    # INTERPRETATION FOR THE DIRECTOR:
    #   0–25  → LOW risk    (green)  - Student is behaviorally stable
    #   26–50 → MODERATE    (amber)  - Emerging pattern, monitor closely
    #   51–75 → HIGH risk   (orange) - Active concern, intervention needed
    #   76–100→ CRITICAL    (red)    - Escalation / hold recommended
    #
    DECAY_RATE = 0.023          # λ — gives ~30-day half-life
    SEVERITY_WEIGHTS = {
        'major': 30,
        'minor': 15,
    }
    DEFAULT_SEVERITY_WEIGHT = 10
    UNRESOLVED_MULTIPLIER = 1.5
    MAX_SCORE = 100

    def get_risk_score(self, obj):
        now = timezone.now()
        total = 0.0

        for v in obj.violations.select_related('rule').all():
            # 1. Determine severity from the handbook rule category
            category = (v.rule.category or '').lower()
            if 'major' in category:
                base = self.SEVERITY_WEIGHTS['major']
            elif 'minor' in category:
                base = self.SEVERITY_WEIGHTS['minor']
            else:
                base = self.DEFAULT_SEVERITY_WEIGHT

            # 2. Calculate days elapsed since the violation
            days_since = max((now - v.timestamp).total_seconds() / 86400, 0)

            # 3. Apply exponential decay: recent = high weight, old = low weight
            decayed = base * math.exp(-self.DECAY_RATE * days_since)

            # 4. Non-terminal violations are an active concern — boost weight
            #    Terminal states: CLOSED, DISMISSED (case fully resolved or dropped)
            if v.status not in ('CLOSED', 'DISMISSED'):
                decayed *= self.UNRESOLVED_MULTIPLIER

            total += decayed

        return round(min(total, self.MAX_SCORE), 1)
