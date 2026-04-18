from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Q
from django.utils import timezone
from apps.violations.models import Violation
from apps.users.models import StudentProfile
from apps.violations.serializers import ViolationSerializer

class OfficerDashboardAPIView(APIView):
    permission_classes = [permissions.AllowAny] # For demo simplicity

    def get(self, request):
        today = timezone.now().date()
        
        # 1. KPI Stats
        violations_today = Violation.objects.filter(timestamp__date=today).count()
        active_cases = Violation.objects.filter(Q(status='OPEN') | Q(status='UNDER_REVIEW')).count()
        
        # Repeat Offenders: Students with more than 1 violation
        repeat_offenders_count = StudentProfile.objects.annotate(
            violation_count=Count('violations')
        ).filter(violation_count__gt=1).count()
        
        # Active Patrols (Mocked for now as patrols app is empty)
        active_patrols = 4 

        # 2. Violations by Type (Top 5 Categories)
        violations_by_type = Violation.objects.values('rule__category').annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        # 3. Case Status Distribution
        status_distribution = Violation.objects.values('status').annotate(
            count=Count('id')
        )
        total_violations = Violation.objects.count()

        # 4. Recent Violations
        recent_violations = Violation.objects.all().order_by('-timestamp')[:5]
        recent_serializer = ViolationSerializer(recent_violations, many=True)

        return Response({
            "stats": {
                "violations_today": violations_today,
                "active_cases": active_cases,
                "active_patrols": active_patrols,
                "repeat_offenders": repeat_offenders_count,
            },
            "violations_by_type": [
                {"name": v['rule__category'], "count": v['count']} for v in violations_by_type
            ],
            "status_distribution": {
                "total": total_violations,
                "breakdown": [
                    {"status": s['status'], "count": s['count']} for s in status_distribution
                ]
            },
            "recent_violations": recent_serializer.data
        })
