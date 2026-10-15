from rest_framework import serializers
from .models import Violation, Appeal
from apps.users.serializers import StudentProfileSerializer
from apps.handbook.serializers import HandbookEntrySerializer
try:
    from constants.locations import DLSUD_LOCATIONS, get_coordinates
except ImportError:
    DLSUD_LOCATIONS = {}
    def get_coordinates(name): return {"lat": 14.3228, "lng": 120.9600}

def resolve_building_coords(location_name: str):
    """Resolve lat/lng from DLSUD_LOCATIONS, with fuzzy fallback.
    Returns (lat, lng, normalized_name) or (None, None, location_name) if not found."""
    if not location_name:
        return None, None, location_name
    # 1. Exact match
    coords = DLSUD_LOCATIONS.get(location_name)
    if coords:
        return coords['lat'], coords['lng'], location_name
    # 2. Case-insensitive partial match
    loc_lower = location_name.lower()
    for name, c in DLSUD_LOCATIONS.items():
        if loc_lower in name.lower() or name.lower() in loc_lower:
            return c['lat'], c['lng'], name
    return None, None, location_name

class AppealSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    violation_code = serializers.CharField(source='violation.rule.rule_code', read_only=True)
    reference_id = serializers.SerializerMethodField()
    student_number = serializers.CharField(source='student.student_number', read_only=True)

    def get_reference_id(self, obj):
        if obj.violation_id:
            return f"#CS-{str(obj.violation_id).zfill(5)}"
        return f"#APP-{obj.id}"

    class Meta:
        model = Appeal
        fields = [
            'id', 'violation', 'violation_code', 'reference_id',
            'student', 'student_number', 'student_name', 
            'subject', 'description', 'reviewer_remarks', 
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['student', 'status', 'reviewer_remarks', 'created_at', 'updated_at']

class AppealUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appeal
        fields = ['status', 'reviewer_remarks']

class ViolationSerializer(serializers.ModelSerializer):
    student_details = StudentProfileSerializer(source='student', read_only=True)
    rule_details = HandbookEntrySerializer(source='rule', read_only=True)
    
    prescribed_sanction = serializers.SerializerMethodField()
    requires_director_decision = serializers.SerializerMethodField()
    officer_name = serializers.SerializerMethodField()
    assigned_to_details = serializers.SerializerMethodField()
    clearance_impact = serializers.SerializerMethodField()
    honors_eligibility = serializers.SerializerMethodField()
    gmc_status = serializers.SerializerMethodField()
    mandatory_formation = serializers.SerializerMethodField()

    def _get_consequence_assessment(self, obj):
        if not hasattr(obj, '_cached_consequence'):
            if not obj.rule:
                obj._cached_consequence = None
                return None

            from apps.violations.consequence_engine import evaluate_violation_consequence

            prior_qs = Violation.objects.filter(
                student=obj.student,
                timestamp__lt=obj.timestamp
            ).select_related('rule')

            prior_list = [
                {
                    'rule_code': v.rule.rule_code if v.rule else '',
                    'category': v.rule.category if v.rule else '',
                    'status': v.status
                }
                for v in prior_qs
            ]
            rule_penalties = {
                'penalty_1st': obj.rule.penalty_1st,
                'penalty_2nd': obj.rule.penalty_2nd,
                'penalty_3rd': obj.rule.penalty_3rd,
                'penalty_4th': obj.rule.penalty_4th,
                'penalty_5th': obj.rule.penalty_5th,
            }
            obj._cached_consequence = evaluate_violation_consequence(
                rule_code=obj.rule.rule_code,
                rule_category=obj.rule.category,
                rule_description=obj.rule.description,
                rule_penalties=rule_penalties,
                prior_violations=prior_list
            )
        return obj._cached_consequence

    def get_prescribed_sanction(self, obj):
        assessment = self._get_consequence_assessment(obj)
        return assessment.recommendation if assessment else "Pending Review"

    def get_requires_director_decision(self, obj):
        assessment = self._get_consequence_assessment(obj)
        return assessment.requires_director_decision if assessment else False

    def get_clearance_impact(self, obj):
        assessment = self._get_consequence_assessment(obj)
        return assessment.clearance_impact if assessment else "CLEARED"

    def get_honors_eligibility(self, obj):
        assessment = self._get_consequence_assessment(obj)
        return assessment.honors_eligibility if assessment else "ELIGIBLE"

    def get_gmc_status(self, obj):
        assessment = self._get_consequence_assessment(obj)
        return assessment.gmc_status if assessment else "AVAILABLE"

    def get_mandatory_formation(self, obj):
        assessment = self._get_consequence_assessment(obj)
        return assessment.mandatory_formation if assessment else False

    def get_officer_name(self, obj):
        if obj.officer:
            return obj.officer.full_name or obj.officer.email
        return "Institutional Authority"

    def get_assigned_to_details(self, obj):
        if obj.assigned_to:
            return {
                "id": obj.assigned_to.id,
                "email": obj.assigned_to.email,
                "full_name": obj.assigned_to.full_name
            }
        return None

    class Meta:
        model = Violation
        fields = [
            'id', 'student', 'student_details', 'officer', 'officer_name', 
            'assigned_to', 'assigned_to_details', 'rule', 'rule_details', 
            'location', 'location_name', 'latitude', 'longitude',
            'description', 'evidence_url', 'status', 
            'case_summary', 'corrective_action', 'prescribed_sanction', 
            'requires_director_decision', 'clearance_impact', 'honors_eligibility', 'gmc_status', 'mandatory_formation',
            'director_sanction', 'director_remarks', 'timestamp'
        ]
        read_only_fields = ['id', 'officer', 'timestamp']

    def create(self, validated_data):
        request = self.context.get('request')
        officer_email = request.data.get('officer_email') if request else None

        # Priority 1: Use explicitly passed officer email (for demo/mock login)
        if officer_email:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                validated_data['officer'] = User.objects.get(email=officer_email)
            except User.DoesNotExist:
                pass

        # Priority 2: Use session user if still not set
        if not validated_data.get('officer') and request and request.user.is_authenticated:
            validated_data['officer'] = request.user

        # Auto-generate concise case_summary if omitted
        if not validated_data.get('case_summary'):
            rule_entry = validated_data.get('rule')
            loc = validated_data.get('location') or 'Campus'
            action = validated_data.get('corrective_action') or 'Pending Review'
            if rule_entry:
                validated_data['case_summary'] = f"[{rule_entry.rule_code}] {rule_entry.description[:80]} reported at {loc}. Mandated action: {action}."

        # ── Auto-geocode: resolve real building coordinates from location name ────
        loc_name = validated_data.get('location_name') or validated_data.get('location', '')
        lat, lng, resolved_name = resolve_building_coords(loc_name)
        if lat is not None:
            validated_data['latitude']      = lat
            validated_data['longitude']     = lng
            validated_data['location_name'] = resolved_name
            if not validated_data.get('location'):
                validated_data['location'] = resolved_name
        else:
            validated_data['location_name'] = loc_name

        instance = super().create(validated_data)

        # Synchronize Student clearance if high escalation occurred
        try:
            student = instance.student
            prior_list = [
                {
                    'rule_code': v.rule.rule_code if v.rule else '',
                    'category': v.rule.category if v.rule else '',
                    'status': v.status
                }
                for v in student.violations.select_related('rule').all()
            ]
            from apps.violations.consequence_engine import evaluate_student_aggregate_standing
            standing = evaluate_student_aggregate_standing(
                violations=prior_list,
                manual_clearance_hold=(student.clearance_status == 'HOLD')
            )
            if standing['clearance_impact'] == 'HOLD' and student.clearance_status != 'HOLD':
                student.clearance_status = 'HOLD'
                student.save(update_fields=['clearance_status'])

            # Automated Notification to the student
            from apps.users.models import Notification
            Notification.objects.create(
                user=student.user,
                title=f"Incident Logged: [{instance.rule.rule_code}]",
                message=f"An incident was recorded on your institutional record: {instance.rule.description[:80]}. Prescribed sanction: {instance.corrective_action}. Institutional clearance: {standing['clearance_impact']}.",
                notification_type='VIOLATION',
                reference_id=instance.id
            )
        except Exception as e:
            print(f"Post-violation synchronization notice: {e}")

        return instance
