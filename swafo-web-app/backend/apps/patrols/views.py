from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import PatrolSession
from .serializers import PatrolSessionSerializer

class PatrolSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = PatrolSession.objects.all().order_by('-start_time')
    serializer_class = PatrolSessionSerializer

    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        session = self.get_object()
        session.end_time = timezone.now()
        session.status = PatrolSession.Status.COMPLETED
        session.save()
        return Response(self.get_serializer(session).data)
