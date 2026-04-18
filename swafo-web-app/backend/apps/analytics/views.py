from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Q, Avg, Sum, F, ExpressionWrapper, DurationField
from django.utils import timezone
from apps.violations.models import Violation
from apps.users.models import StudentProfile
from apps.patrols.models import PatrolSession
from apps.violations.serializers import ViolationSerializer

class OfficerDashboardAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            today = timezone.now().date()
            
            # 1. KPI Stats
            total_count = Violation.objects.count()
            closed_count = Violation.objects.filter(status='CLOSED').count()
            active_cases = total_count - closed_count
            resolved_cases = closed_count
            
            resolution_rate = (resolved_cases / total_count * 100) if total_count > 0 else 0
            
            repeat_offenders_count = StudentProfile.objects.annotate(
                v_count=Count('violations')
            ).filter(v_count__gt=1).count()

            # 2. Violations Over Time (Last 7 Days)
            # Grouping by Day of Week
            temporal_data = []
            days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
            for i in range(7):
                day_count = Violation.objects.filter(timestamp__week_day=(i+2)%7 or 7).count() # Django week_day is 1 (Sun) to 7 (Sat)
                temporal_data.append({"day": days[i], "value": day_count})

            # 3. Violations by Type (Top 4)
            violations_by_type = Violation.objects.values('rule__category').annotate(
                count=Count('id')
            ).order_by('-count')[:4]
            
            type_data = []
            for v in violations_by_type:
                pct = (v['count'] / total_count * 100) if total_count > 0 else 0
                type_data.append({"type": v['rule__category'], "count": v['count'], "percentage": round(pct, 1)})

            # 4. Violations by College
            # Using 'course' field as a proxy for College in this version
            college_data = Violation.objects.values('student__course').annotate(
                count=Count('id')
            ).order_by('-count')[:5]

            # 5. Case Status Distribution (Simplified to CLOSED vs PENDING)
            distribution = [
                {
                    "label": "CLOSED",
                    "percentage": round((closed_count / total_count * 100), 1) if total_count > 0 else 0,
                    "color": "#004d33" # Deep SWAFO Green
                },
                {
                    "label": "PENDING",
                    "percentage": round((active_cases / total_count * 100), 1) if total_count > 0 else 0,
                    "color": "#10b981" # Emerald
                }
            ]

            # 6. Recent Violations
            recent_violations = Violation.objects.all().order_by('-timestamp')[:5]
            recent_serializer = ViolationSerializer(recent_violations, many=True)

            # 7. Top Alerts (Most frequent violation types)
            top_violations = Violation.objects.values('rule__category', 'location').annotate(
                count=Count('id')
            ).order_by('-count')[:3]
            
            top_alerts = []
            for i, v in enumerate(top_violations):
                top_alerts.append({
                    "rank": f"0{i+1}",
                    "type": v['rule__category'],
                    "location": v['location'],
                    "status": "High Alert" if i == 0 else "Stable",
                    "statusColor": "bg-red-50 text-red-600 border-red-100" if i == 0 else "bg-emerald-50 text-emerald-600 border-emerald-100"
                })

            # 8. Patrol Stats
            total_patrols = PatrolSession.objects.count()
            total_photos = PatrolSession.objects.aggregate(total=Sum('photos_count'))['total'] or 0
            
            # Average duration in minutes
            durations = PatrolSession.objects.filter(end_time__isnull=False).annotate(
                duration=ExpressionWrapper(F('end_time') - F('start_time'), output_field=DurationField())
            ).aggregate(avg_dur=Avg('duration'))['avg_dur']
            
            avg_duration_mins = int(durations.total_seconds() / 60) if durations else 0

            return Response({
                # Dashboard Compat
                "stats": {
                    "violations_today": Violation.objects.filter(timestamp__date=today).count(),
                    "active_cases": active_cases,
                    "active_patrols": 4,
                    "repeat_offenders": repeat_offenders_count,
                },
                "violations_by_type": [
                    {"name": v['rule__category'], "count": v['count']} for v in violations_by_type
                ],
                "status_distribution": {
                    "total": total_count,
                    "breakdown": [
                        {"status": "CLOSED", "count": closed_count},
                        {"status": "PENDING", "count": active_cases}
                    ]
                },
                "recent_violations": recent_serializer.data,
                
                # Analytics Page Compat
                "kpis": [
                    { "label": 'TOTAL VIOLATIONS', "value": str(total_count), "trend": '+0%', "trendUp": True, "icon": 'warning' },
                    { "label": 'PENDING CASES', "value": str(active_cases), "trend": 'Stable', "trendUp": False, "icon": 'calendar' },
                    { "label": 'RESOLUTION RATE', "value": f"{round(resolution_rate, 1)}%", "trend": '+2.4%', "trendUp": True, "icon": 'verified' },
                    { "label": 'REPEAT OFFENDERS', "value": str(repeat_offenders_count), "trend": '-3%', "trendUp": False, "icon": 'people' }
                ],
                "temporal": temporal_data,
                "byType": type_data,
                "distribution": distribution,
                "byCollege": [{"name": c['student__course'], "count": c['count']} for c in college_data],
                "topAlerts": top_alerts,
                "patrol_stats": {
                    "total": f"{total_patrols:,}",
                    "photos": f"{total_photos / 1000:.1f}k" if total_photos >= 1000 else str(total_photos),
                    "duration": f"{avg_duration_mins}m"
                },
                "active_patrols": 4
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)
