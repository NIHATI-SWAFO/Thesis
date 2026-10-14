import math
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import User, StudentProfile, Notification, PasswordResetToken, PasswordResetRequest, SecurityAuditLog


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'username', 'officer_badge', 'must_change_password', 'is_active', 'last_login', 'date_joined']


class StudentProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    violation_count = serializers.SerializerMethodField()
    is_repeat_offender = serializers.SerializerMethodField()
    has_pending_violations = serializers.SerializerMethodField()
    risk_score = serializers.SerializerMethodField()
    risk_standing = serializers.SerializerMethodField()
    needs_id_confirmation = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'student_number', 'user_details', 'course', 'year_level',
            'violation_count', 'is_repeat_offender', 'has_pending_violations',
            'clearance_status', 'risk_score', 'risk_standing', 'barcode_value',
            'is_id_confirmed', 'needs_id_confirmation', 'profile_picture',
        ]

    def get_needs_id_confirmation(self, obj):
        if obj.is_id_confirmed:
            return False
        if obj.barcode_value and str(obj.barcode_value).strip():
            return False
        import re
        if obj.user and obj.user.email and re.search(r'\b(20\d{7})\b|\b(\d{9})\b', obj.user.email):
            return False
        return True

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
            category = (v.rule.category or '').lower() if v.rule else ''
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

            # 4. Active/unresolved violations NEVER decay below their full penalty weight
            #    The student has an unsettled case requiring SWAFO attendance.
            if v.status not in ('CLOSED', 'DISMISSED'):
                decayed = max(base * self.UNRESOLVED_MULTIPLIER, decayed * self.UNRESOLVED_MULTIPLIER)

            total += decayed

        return round(min(total, self.MAX_SCORE), 1)

    def get_risk_standing(self, obj):
        score = self.get_risk_score(obj)
        has_pending = self.get_has_pending_violations(obj)
        total_vios = obj.violations.count()
        major_count = obj.violations.filter(rule__category__icontains='major').count()
        is_manual_hold = (obj.clearance_status == 'HOLD')

        # ── Tier 1: Disciplinary Probation (Section 27.3.5) ──
        # Triggers on: Manual clearance HOLD, Score > 75, 8+ total violations, or 3+ major offenses
        if is_manual_hold or score > 75 or total_vios >= 8 or major_count >= 3:
            tier = 'CRITICAL'
            standing = 'Disciplinary Probation'
            clearance_impact = 'HOLD'
            honors_eligibility = 'FORFEITED'
            gmc_status = 'DENIED'
            handbook_citation = 'Section 27.3.5'
            consequence_summary = (
                f'Institutional Clearance placed on HOLD (§14) blocking enrollment and graduation. '
                f'Honors forfeited; {total_vios} infractions on record. Referred to SWAFO Director '
                f'and Student Discipline Board (§27.3.5).'
            )
            color = 'rose'

        # ── Tier 2: Disciplinary Warning (Section 26.4) ──
        # Triggers on: Score > 50, 5–7 total violations, or 2 major offenses
        elif score > 50 or total_vios >= 5 or major_count >= 2:
            tier = 'HIGH'
            standing = 'Disciplinary Warning'
            clearance_impact = 'RESTRICTED'
            honors_eligibility = 'DISQUALIFIED'
            gmc_status = 'WITHHELD'
            handbook_citation = 'Section 26.4'
            consequence_summary = (
                f'Disqualified from Dean\'s List and Latin Honors ({total_vios} violations on record). '
                f'Clearance restricted; Good Moral Certificate withheld. '
                f'Mandatory attendance in SWAFO Restorative Formation Program (§26.4).'
            )
            color = 'orange'

        # ── Tier 3: Under Review (Section 27.1) ──
        # Triggers on: Score > 25, 2–4 total violations, 1 major offense, or any unresolved pending violation
        elif score > 25 or total_vios >= 2 or major_count >= 1 or has_pending:
            tier = 'MODERATE'
            standing = 'Under Review'
            clearance_impact = 'CONDITIONAL'
            honors_eligibility = 'UNDER_REVIEW'
            gmc_status = 'DEFERRED'
            handbook_citation = 'Section 27.1'
            consequence_summary = (
                f'Conditional clearance. Honors subject to end-of-semester conduct review '
                f'({total_vios} violation{"s" if total_vios != 1 else ""}, {"active pending case" if has_pending else "resolved"}). '
                f'Good Moral Certificate deferred pending resolution of active obligations (§27.1).'
            )
            color = 'amber'

        # ── Tier 4: Good Standing (Section 14) ──
        # Only for clean students (<= 1 resolved minor violation, 0 pending, score <= 25)
        else:
            tier = 'LOW'
            standing = 'Good Standing'
            clearance_impact = 'CLEARED'
            honors_eligibility = 'ELIGIBLE'
            gmc_status = 'AVAILABLE'
            handbook_citation = 'Section 14'
            consequence_summary = (
                'Unrestricted institutional clearance (§14). Eligible for Dean\'s List '
                'and Latin Honors; unconditional Good Moral Certificate (GMC) issuance.'
            )
            color = 'emerald'

        return {
            'tier': tier,
            'standing': standing,
            'score': score,
            'clearance_impact': clearance_impact,
            'honors_eligibility': honors_eligibility,
            'gmc_status': gmc_status,
            'handbook_citation': handbook_citation,
            'consequence_summary': consequence_summary,
            'color': color,
        }


from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'reference_id', 'is_read', 'created_at']


class PasswordResetRequestSerializer(serializers.ModelSerializer):
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)

    class Meta:
        model = PasswordResetRequest
        fields = [
            'id', 'officer_name', 'officer_email', 'officer_id',
            'status', 'rejection_reason', 'requested_at', 'reviewed_at',
            'reviewed_by', 'reviewed_by_name'
        ]


class SecurityAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True)
    target_name = serializers.CharField(source='target_user.full_name', read_only=True)

    class Meta:
        model = SecurityAuditLog
        fields = [
            'id', 'action', 'actor', 'actor_name', 'target_user', 'target_name',
            'ip_address', 'details', 'timestamp'
        ]


class OfficerAccountSerializer(serializers.ModelSerializer):
    is_currently_online = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role', 'officer_badge',
            'is_active', 'must_change_password', 'last_login', 'date_joined',
            'last_seen', 'is_currently_online'
        ]

    def get_is_currently_online(self, obj):
        # Online only if the officer has an open session AND sent activity within the last 5 minutes
        from datetime import timedelta
        from django.utils import timezone
        if not obj.is_online or not obj.last_seen:
            return False
        return timezone.now() - obj.last_seen <= timedelta(minutes=5)


