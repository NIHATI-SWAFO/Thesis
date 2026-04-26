from rest_framework import serializers
from .models import Violation
from apps.users.serializers import StudentProfileSerializer
from apps.handbook.serializers import HandbookEntrySerializer
try:
    from constants.locations import get_coordinates
except ImportError:
    def get_coordinates(name): return {"lat": 14.3228, "lng": 120.9600}

class ViolationSerializer(serializers.ModelSerializer):
    student_details = StudentProfileSerializer(source='student', read_only=True)
    rule_details = HandbookEntrySerializer(source='rule', read_only=True)
    
    prescribed_sanction = serializers.SerializerMethodField()
    requires_director_decision = serializers.SerializerMethodField()
    officer_name = serializers.SerializerMethodField()
    assigned_to_details = serializers.SerializerMethodField()

    def get_requires_director_decision(self, obj):
        sanction = self.get_prescribed_sanction(obj)
        return "FOR SWAFO DIRECTOR DECISION" in str(sanction)

    def get_prescribed_sanction(self, obj):
        if not obj.rule:
            return "Pending Review"
            
        # --- 1. TRAFFIC OFFENSE LOGIC (Section 27.4) ---
        if obj.rule.category.strip().startswith("Traffic"):
            traffic_history = Violation.objects.filter(
                student=obj.student, 
                rule__category=obj.rule.category,
                timestamp__lte=obj.timestamp
            )
            traffic_instance = traffic_history.count()
            
            if "Minor" in obj.rule.category:
                if traffic_instance == 1: return "Warning"
                if traffic_instance == 2: return "Minor Offense + Php 1,000 fine (Escalate to Section 27.1 record)"
                if traffic_instance == 3: return "Commission of 2nd minor offense + Php 2,000 fine"
                return "Cancellation of vehicle pass + Commission of 3rd minor offense (Major Risk)"
            else: # Major Traffic
                if traffic_instance == 1: 
                    return "Major administrative sanction + Php 2,000 fine"
                
                # 2nd Major Traffic formally becomes a 'Major Offense' on the student's record
                # CROSS-CHECK: Does the student have OTHER existing major offenses?
                std_majors_count = Violation.objects.filter(
                    student=obj.student, 
                    rule__category__startswith="Major",
                    timestamp__lt=obj.timestamp
                ).count()
                
                if std_majors_count > 0:
                    return "FOR SWAFO DIRECTOR DECISION (Section 27.3.5 - Different Nature: Major Traffic + Existing Disciplinary Major)"
                
                return "Major offense + Cancellation of vehicle sticker for 1 Academic Year"

        # --- 2. MINOR OFFENSE LOGIC (Section 27.1) ---
        if obj.rule.category.strip().startswith("Minor"):
            # Protocol: Rule 27.3.1.39 (Habitual Minor - Same Rule Code)
            same_rule_count = Violation.objects.filter(
                student=obj.student,
                rule=obj.rule,
                timestamp__lte=obj.timestamp
            ).count()
            
            if same_rule_count >= 3:
                return "MAJOR ESCALATION: 27.3.1.39 (Habitual Minor Offense)"

            # TALLY: Standard Minors + Escalated Traffic Minors (Instance 2+)
            std_minor_count = Violation.objects.filter(
                student=obj.student,
                rule__category__startswith="Minor",
                timestamp__lte=obj.timestamp
            ).count()
            
            escalated_traffic_count = Violation.objects.filter(
                student=obj.student,
                rule__category="Traffic — Minor",
                timestamp__lte=obj.timestamp
            ).count()
            
            total_minor_count = std_minor_count + max(0, escalated_traffic_count - 1)

            if total_minor_count >= 3:
                return "MAJOR ESCALATION: 27.3.1.43 (Third Minor Offense - Sanction 1)"

            if total_minor_count == 1: return obj.rule.penalty_1st or "Written Warning"
            if total_minor_count == 2: return obj.rule.penalty_2nd or "First Minor Offense"
            return obj.rule.penalty_3rd or "Second Minor Offense"

        # --- 3. MAJOR OFFENSE LOGIC (Section 27.3) ---
        if obj.rule.category.strip().startswith("Major"):
            # TALLY: Standard Majors + Escalated Traffic Majors (Instance 2+)
            std_majors = Violation.objects.filter(
                student=obj.student,
                rule__category__startswith="Major",
                timestamp__lt=obj.timestamp
            ).order_by('timestamp')
            
            escalated_traffic_majors_count = max(0, Violation.objects.filter(
                student=obj.student,
                rule__category="Traffic — Major",
                timestamp__lt=obj.timestamp
            ).count() - 1)

            # Check for "Different Nature" (Section 27.3.5)
            has_history = std_majors.exists() or escalated_traffic_majors_count > 0
            
            if not has_history:
                # 1st Major ever recorded
                return obj.rule.penalty_1st or "Sanction 1: Probation (1 year)"
            
            # Check if the ONLY history is the exact same rule
            only_same_rule = std_majors.filter(rule=obj.rule).count() == std_majors.count() and escalated_traffic_majors_count == 0
            
            if not only_same_rule:
                return "FOR SWAFO DIRECTOR DECISION (Section 27.3.5 - Different Nature)"
            
            # Same rule repeating
            count = std_majors.count() + 1
            if count == 1: return obj.rule.penalty_1st
            if count == 2: return obj.rule.penalty_2nd
            if count == 3: return obj.rule.penalty_3rd
            if count == 4: return obj.rule.penalty_4th
            return obj.rule.penalty_5th or obj.rule.penalty_4th or "Sanction 4: Non-readmission"

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
            'location', 'location_name', 'latitude', 'longitude',
            'description', 'evidence_url', 'status', 
            'case_summary', 'corrective_action', 'prescribed_sanction', 
            'requires_director_decision', 'director_sanction', 'director_remarks', 'timestamp'
        ]
        read_only_fields = ['id', 'officer', 'timestamp', 'latitude', 'longitude']

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

        # Auto-populate coordinates from location_name lookup table
        location_name = validated_data.get('location_name', '') or validated_data.get('location', '')
        if location_name:
            if not validated_data.get('location_name'):
                validated_data['location_name'] = location_name
            coords = get_coordinates(location_name)
            validated_data['latitude']  = coords['lat']
            validated_data['longitude'] = coords['lng']
            
        return super().create(validated_data)
