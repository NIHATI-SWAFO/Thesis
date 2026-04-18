from rest_framework import serializers
from .models import PatrolSession

class PatrolSessionSerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    officer_email = serializers.EmailField(source='officer.email', read_only=True)
    
    class Meta:
        model = PatrolSession
        fields = [
            'id', 'officer', 'officer_name', 'officer_email', 'location', 
            'start_time', 'end_time', 'status', 
            'checkpoints_data', 'photos_count'
        ]
