from rest_framework import serializers
from .models import PatrolSession

class PatrolSessionSerializer(serializers.ModelSerializer):
    officer_details = serializers.SerializerMethodField()
    
    class Meta:
        model = PatrolSession
        fields = [
            'id', 'officer', 'officer_details', 'location', 
            'start_time', 'end_time', 'status', 
            'checkpoints_data', 'photos_count'
        ]

    def get_officer_details(self, obj):
        if not obj.officer:
            return None
        return {
            "full_name": obj.officer.full_name or obj.officer.username,
            "email": obj.officer.email,
            "role": getattr(obj.officer, 'role', 'Institutional Officer')
        }
