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
    
    class Meta:
        model = StudentProfile
        fields = ['id', 'student_number', 'user_details', 'course', 'year_level', 'violation_count', 'is_repeat_offender', 'has_pending_violations']

    def get_violation_count(self, obj):
        return obj.violations.count()

    def get_is_repeat_offender(self, obj):
        # Strict Institutional Standard: Non-Compliant if 2+ total violations
        return obj.violations.count() >= 2
    
    def get_has_pending_violations(self, obj):
        return obj.violations.exclude(status='RESOLVED').exists()
