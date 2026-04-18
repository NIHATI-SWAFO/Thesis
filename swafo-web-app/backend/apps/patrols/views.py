from rest_framework import generics, permissions
from .models import PatrolSession
from .serializers import PatrolSessionSerializer

class PatrolSessionListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = PatrolSession.objects.all().order_by('-start_time')
    serializer_class = PatrolSessionSerializer
