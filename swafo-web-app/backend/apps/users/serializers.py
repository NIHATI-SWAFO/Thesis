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
    risk_standing = serializers.SerializerMethodField()
    needs_id_confirmation = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'student_number', 'user_details', 'course', 'year_level',
            'violation_count', 'is_repeat_offender', 'has_pending_violations',
            'clearance_status', 'clearance_override', 'risk_standing', 'barcode_value',
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
        # Strict Institutional Standard: Non-Compliant if 2+ violations.
        # Dismissed cases are not counted, since the student was cleared of them.
        return obj.violations.exclude(status='DISMISSED').count() >= 2

    def get_has_pending_violations(self, obj):
        # Terminal states are CLOSED and DISMISSED — anything else is still active
        return obj.violations.exclude(status__in=['CLOSED', 'DISMISSED']).exists()

    def get_risk_standing(self, obj):
        from apps.violations.consequence_engine import evaluate_student_aggregate_standing

        is_manual_hold = (obj.clearance_status == 'HOLD')
        
        violations_list = [
            {
                'rule_code': v.rule.rule_code if v.rule else '',
                'category': v.rule.category if v.rule else '',
                'status': v.status
            }
            for v in obj.violations.select_related('rule').all()
        ]

        # Handbook standing from violations alone; the Director's manual HOLD and
        # override are applied to clearance only, further below.
        standing_info = evaluate_student_aggregate_standing(
            violations=violations_list,
            manual_clearance_hold=False
        )

        tier = standing_info['tier']
        standing = standing_info['standing']
        color = standing_info['color']
        clearance_impact = standing_info['clearance_impact']
        honors_eligibility = standing_info['honors_eligibility']
        gmc_status = standing_info['gmc_status']
        consequence_summary = standing_info['consequence_summary']
        handbook_citation = standing_info['handbook_citation']

        # What the handbook alone says about clearance (before any Director action)
        handbook_clearance = clearance_impact

        # Director HOLD: only the clearance changes; honors and GMC follow the handbook.
        if is_manual_hold and clearance_impact != 'HOLD':
            clearance_impact = 'HOLD'
            consequence_summary = f"{consequence_summary} Clearance placed on HOLD by the SWAFO Director."

        # Director override: the SWAFO Director cleared the student, lifting a
        # handbook HOLD, RESTRICTED or CONDITIONAL clearance. Only the clearance
        # changes; honors and GMC still follow the handbook.
        director_override = bool(
            obj.clearance_override and obj.clearance_status == 'CLEARED' and clearance_impact != 'CLEARED'
        )
        if director_override:
            clearance_impact = 'CLEARED'
            consequence_summary = f"{consequence_summary} Clearance granted by the SWAFO Director."

        return {
            'director_override': director_override,
            'handbook_clearance': handbook_clearance,
            'tier': tier,
            'standing': standing,
            'clearance_impact': clearance_impact,
            'honors_eligibility': honors_eligibility,
            'gmc_status': gmc_status,
            'handbook_citation': handbook_citation,
            'consequence_summary': consequence_summary,
            'color': color,
            'requires_formation': standing_info.get('requires_formation', False),
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


