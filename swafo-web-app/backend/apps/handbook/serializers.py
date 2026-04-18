from rest_framework import serializers
from .models import HandbookEntry

class HandbookEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = HandbookEntry
        fields = '__all__'
