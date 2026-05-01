from rest_framework import serializers
from .models import PatrolSession

class PatrolSessionSerializer(serializers.ModelSerializer):
    officer_details = serializers.SerializerMethodField()
    duration_display = serializers.SerializerMethodField()
    
    class Meta:
        model = PatrolSession
        fields = [
            'id', 'officer', 'officer_details', 'location',
            'start_time', 'end_time', 'status',
            'checkpoints_data', 'photos_count',
            'trail_coordinates', 'distance_km', 'duration_display',
            'shift_type', 'notes', 'violations_count',
        ]

    def get_duration_display(self, obj):
        if obj.start_time and obj.end_time:
            diff = obj.end_time - obj.start_time
            minutes = int(diff.total_seconds() // 60)
            if minutes == 0:
                return "<1m"
            return f"{minutes}m"
        return "--"

    def get_officer_details(self, obj):
        if not obj.officer:
            return None
        return {
            "full_name": obj.officer.full_name or obj.officer.username,
            "email": obj.officer.email,
            "role": getattr(obj.officer, 'role', 'Institutional Officer')
        }
