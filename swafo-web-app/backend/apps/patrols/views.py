from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Avg, F, ExpressionWrapper, DurationField
from .models import PatrolSession
from .serializers import PatrolSessionSerializer

class PatrolSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = PatrolSession.objects.all().order_by('-start_time')
    serializer_class = PatrolSessionSerializer

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        from datetime import timedelta
        try:
            from constants.locations import get_all_location_names
            total_locations_count = len(get_all_location_names())
        except ImportError:
            total_locations_count = 20

        now = timezone.now()
        today = timezone.localtime(now).date()

        # 1. TOTAL PATROLS — every patrol ever saved in history (any status)
        total_patrols = PatrolSession.objects.count()

        # 2. COMPLETED TODAY — completed within the last 24 rolling hours
        since_24h = now - timedelta(hours=24)
        completed_today = PatrolSession.objects.filter(
            status=PatrolSession.Status.COMPLETED,
            end_time__gte=since_24h
        ).count()

        # 3. PHOTOS CAPTURED — total across ALL patrols (not just today)
        photos = PatrolSession.objects.aggregate(Sum('photos_count'))['photos_count__sum'] or 0

        # 4. AVG DURATION — average of all completed patrols with valid start+end,
        #    clamped to >= 0 so it can never show a negative value
        completed_with_times = PatrolSession.objects.filter(
            status=PatrolSession.Status.COMPLETED,
            end_time__isnull=False
        )
        avg_duration_td = completed_with_times.annotate(
            duration=ExpressionWrapper(F('end_time') - F('start_time'), output_field=DurationField())
        ).aggregate(Avg('duration'))['duration__avg']

        if avg_duration_td:
            avg_seconds = avg_duration_td.total_seconds()
            avg_duration_minutes = max(0, int(avg_seconds / 60))
        else:
            avg_duration_minutes = 0

        # Quick Insights
        week_ago = today - timedelta(days=7)
        weekly_patrols = PatrolSession.objects.filter(
            start_time__date__gte=week_ago,
            status=PatrolSession.Status.COMPLETED
        ).count()

        total_evidence = photos  # same as photos — total captured across all patrols

        todays_unique_locations = PatrolSession.objects.filter(
            start_time__date=today
        ).values('location').distinct().count()
        areas_covered_percent = int((todays_unique_locations / total_locations_count) * 100) if total_locations_count > 0 else 0

        return Response({
            "totalPatrols":         total_patrols,
            "completedToday":       completed_today,
            "photos":               photos,
            "avgDuration":          avg_duration_minutes,
            "weeklyPatrols":        weekly_patrols,
            "totalEvidence":        total_evidence,
            "areasCoveredPercent":  areas_covered_percent,
        })


    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        session = self.get_object()
        session.end_time = timezone.now()
        session.status = PatrolSession.Status.COMPLETED
        session.save()
        return Response(self.get_serializer(session).data)

    @action(detail=False, methods=['get'])
    def patrolled_today(self, request):
        """Returns distinct locations already patrolled today (any status)."""
        today = timezone.localtime(timezone.now()).date()
        locations = (
            PatrolSession.objects
            .filter(start_time__date=today)
            .values_list('location', flat=True)
            .distinct()
        )
        return Response({ "patrolled_locations": list(locations) })
