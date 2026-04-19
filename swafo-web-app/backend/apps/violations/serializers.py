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
            
        # 1. MINOR OFFENSE LOGIC
        if obj.rule.category.strip().startswith("Minor"):
            # Protocol: Rule 27.3.1.39 (Habitual Minor - Same Rule Code)
            same_rule_count = Violation.objects.filter(
                student=obj.student,
                rule=obj.rule,
                timestamp__lte=obj.timestamp
            ).count()
            
            if same_rule_count >= 3:
                return "MAJOR ESCALATION: 27.3.1.39 (Habitual Minor Offense)"

            # Protocol: Rule 27.3.1.43 (Third Minor - Any Minor Rule)
            total_minor_count = Violation.objects.filter(
                student=obj.student,
                rule__category__startswith="Minor",
                timestamp__lte=obj.timestamp
            ).count()

            if total_minor_count >= 3:
                return "MAJOR ESCALATION: 27.3.1.43 (Third Minor Offense - Sanction 1)"

            if total_minor_count == 1: return obj.rule.penalty_1st or "Written Warning"
            if total_minor_count == 2: return obj.rule.penalty_2nd or "First Minor Offense"
            return obj.rule.penalty_3rd or "Second Minor Offense"

        # 2. MAJOR OFFENSE LOGIC
        if obj.rule.category.strip().startswith("Major"):
            # Check for violations with the EXACT SAME rule code
            same_rule_violations = Violation.objects.filter(
                student=obj.student,
                rule=obj.rule,
                timestamp__lt=obj.timestamp
            ).order_by('timestamp')
            
            if same_rule_violations.exists():
                # YES path: Same rule code exists -> Follow that rule's sanction table
                count = same_rule_violations.count() + 1
                if count == 1: return obj.rule.penalty_1st
                if count == 2: return obj.rule.penalty_2nd
                if count == 3: return obj.rule.penalty_3rd
                if count == 4: return obj.rule.penalty_4th
                return obj.rule.penalty_5th or obj.rule.penalty_4th or "Sanction 4: Non-readmission"

            # NO path: No previous violation with this rule code exists.
            # But does the student have ANY OTHER major offenses?
            other_majors = Violation.objects.filter(
                student=obj.student,
                rule__category__startswith="Major",
                timestamp__lt=obj.timestamp
            ).exclude(rule=obj.rule)

            if other_majors.exists():
                # Section 27.3.5 - Different nature major offense detected
                return "FOR SWAFO DIRECTOR DECISION (Section 27.3.5 - Different Nature)"
            
            # 1st Major offense ever recorded
            return obj.rule.penalty_1st or "Sanction 1: Probation (1 year)"

        return "Standard Advisory Issued"

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
