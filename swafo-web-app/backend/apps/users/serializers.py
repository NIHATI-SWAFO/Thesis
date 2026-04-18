from rest_framework import serializers
from .models import User, StudentProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role']

class StudentProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = StudentProfile
        fields = ['id', 'student_number', 'user_details', 'course', 'year_level']
