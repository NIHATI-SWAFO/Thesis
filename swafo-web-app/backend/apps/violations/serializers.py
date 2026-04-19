from rest_framework import serializers
from .models import Violation
from apps.users.serializers import StudentProfileSerializer
from apps.handbook.serializers import HandbookEntrySerializer

class ViolationSerializer(serializers.ModelSerializer):
    student_details = StudentProfileSerializer(source='student', read_only=True)
    rule_details = HandbookEntrySerializer(source='rule', read_only=True)
    
    prescribed_sanction = serializers.SerializerMethodField()
    officer_name = serializers.SerializerMethodField()
    assigned_to_details = serializers.SerializerMethodField()

    def get_prescribed_sanction(self, obj):
        if not obj.rule:
            return "Pending Review"
            
        # 1. MINOR OFFENSE ESCALATION LOGIC (Category starts with 'Minor')
        if obj.rule.category.strip().startswith("Minor"):
            # We count all violations in the SAME CATEGORY for minor offenses
            count = Violation.objects.filter(
                student=obj.student,
                rule__category=obj.rule.category,
                timestamp__lte=obj.timestamp
            ).count()
            
            if count == 1: return "Written Warning (Institutional Advice issued)"
            if count == 2: return "First Minor Offense (Official Case Indexing + Formal Warning)"
            if count == 3: return "Second Minor Offense (Parental/Guardian Notification required)"
            
            # 4th Minor and beyond = Major Escalation
            escalation_level = count - 3
            if escalation_level == 1: return "MAJOR ESCALATION: Sanction 1 (Probation - 1 Year)"
            if escalation_level == 2: return "MAJOR ESCALATION: Sanction 2 (Suspension - 3-5 school days)"
            if escalation_level == 3: return "MAJOR ESCALATION: Sanction 3 (Suspension - 6-12 school days)"
            return "CRITICAL ESCALATION: Sanction 4 (Non-readmission recommended)"
            
        # 2. MAJOR OFFENSE LOGIC (Specific Rule Frequency)
        # Major offenses NEVER have written warnings. They start at Sanction 1 or 2.
        specific_count = Violation.objects.filter(
            student=obj.student,
            rule=obj.rule,
            timestamp__lte=obj.timestamp
        ).count()

        if specific_count == 1: return obj.rule.penalty_1st or "Sanction 1: Probation (1 year)"
        if specific_count == 2: return obj.rule.penalty_2nd or "Sanction 2: Suspension (3–5 school days)"
        if specific_count == 3: return obj.rule.penalty_3rd or "Sanction 3: Suspension (6–12 school days)"
        if specific_count == 4: return obj.rule.penalty_4th or "Sanction 4: Non-readmission"
        return obj.rule.penalty_5th or "Sanction 5: Exclusion"

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
            'location', 'description', 'evidence_url', 'status', 
            'case_summary', 'corrective_action', 'prescribed_sanction', 'timestamp'
        ]
        read_only_fields = ['id', 'officer', 'timestamp']

    def create(self, validated_data):
        request = self.context.get('request')
        officer_email = request.data.get('officer_email')
        
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
            
        return super().create(validated_data)
