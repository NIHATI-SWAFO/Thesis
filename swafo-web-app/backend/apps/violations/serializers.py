from rest_framework import serializers
from .models import Violation
from apps.users.serializers import StudentProfileSerializer
from apps.handbook.serializers import HandbookEntrySerializer

class ViolationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Violation
        fields = [
            'id', 'student', 'officer', 'rule', 'location', 
            'description', 'evidence_url', 'status', 
            'case_summary', 'corrective_action', 'timestamp'
        ]
        read_only_fields = ['id', 'officer', 'timestamp']

    def create(self, validated_data):
        # Automatically assign officer if not provided (fallback to first superuser for demo if needed)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['officer'] = request.user
        return super().create(validated_data)
