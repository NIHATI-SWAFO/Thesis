from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Q, Avg, Sum, F, ExpressionWrapper, DurationField, Max
from django.utils import timezone
from apps.violations.models import Violation
from apps.users.models import StudentProfile
from apps.patrols.models import PatrolSession
from apps.violations.serializers import ViolationSerializer

class AdminDashboardAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            # Use local time for correct date matching (Asia/Manila)
            local_now = timezone.localtime(timezone.now())
            today = local_now.date()
            now = local_now # For trend calculations
            total_count = Violation.objects.count()
            closed_count = Violation.objects.filter(status__in=['CLOSED', 'DISMISSED']).count()
            active_cases = total_count - closed_count

            # 1. Hotspots (Aggregation by Location)
            hotspots = Violation.objects.values('location').annotate(
                count=Count('id')
            ).order_by('-count')[:5]

            # 2. Officer Activity
            officer_activity = Violation.objects.values('officer__first_name', 'officer__last_name', 'officer__username').annotate(
                count=Count('id')
            ).order_by('-count')[:5]

            # 3. Temporal Trends (Dynamic Range)
            range_type = request.query_params.get('range', 'week')
            days_count = 30 if range_type == 'month' else 7
            
            temporal_data = []
            day_names = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
            
            # Efficiently fetch data with a 6-day lookback for accurate SMA
            window = 7
            lookback_days = window - 1
            total_days_to_fetch = days_count + lookback_days
            
            start_date = local_now.date() - timezone.timedelta(days=total_days_to_fetch - 1)
            violations_by_date = {}
            vs = Violation.objects.filter(timestamp__date__gte=start_date, timestamp__date__lte=local_now.date()).values('timestamp__date').annotate(count=Count('id'))
            for v in vs:
                violations_by_date[v['timestamp__date']] = v['count']

            counts_window = []
            sma_history = []
            
            for i in range(total_days_to_fetch - 1, -1, -1):
                target_date = local_now.date() - timezone.timedelta(days=i)
                day_count = violations_by_date.get(target_date, 0)
                
                counts_window.append(day_count)
                if len(counts_window) > window:
                    counts_window.pop(0)
                
                sma_value = round(sum(counts_window) / len(counts_window), 2)
                sma_history.append(sma_value)
                
                if i < days_count:
                    day_label = day_names[target_date.weekday()]
                    date_num = target_date.strftime('%d')
                    display_label = f"{date_num} {day_label}" if (range_type == 'week' or i % 5 == 0) else ""
                    short_label = target_date.strftime('%b %d')
                    full_date = target_date.strftime('%A, %B %d')

                    temporal_data.append({
                        "day": display_label,
                        "short_label": short_label,
                        "full_date": full_date,
                        "value": day_count,
                        "ma": sma_value,
                        "is_weekday": target_date.weekday() < 6,
                        "date": target_date.isoformat()
                    })

            # Spike Detection: flag days where count > 1.5x SMA
            for d in temporal_data:
                if d['ma'] > 0 and d['value'] > 1.5 * d['ma']:
                    d['is_spike'] = True
                    d['spike_ratio'] = round(d['value'] / d['ma'], 2)
                else:
                    d['is_spike'] = False

            # Seasonality Trend Detection (Comparing last 7 days vs previous 7 days)
            if len(sma_history) >= 14:
                previous_week_avg = sum(sma_history[-14:-7]) / 7
                current_week_avg = sum(sma_history[-7:]) / 7
                if previous_week_avg > 0:
                    ma_change = ((current_week_avg - previous_week_avg) / previous_week_avg) * 100
                else:
                    ma_change = 0
            else:
                ma_change = 0

            if ma_change > 10:
                seasonality_direction = "RISING"
            elif ma_change < -10:
                seasonality_direction = "DECLINING"
            else:
                seasonality_direction = "STABLE"

            seasonality_trend = {
                "direction": seasonality_direction,
                "change": round(abs(ma_change), 1),
                "label": f"{seasonality_direction} {'↑' if seasonality_direction == 'RISING' else '↓' if seasonality_direction == 'DECLINING' else '→'} {round(abs(ma_change), 1)}% RECENT TREND"
            }

            # 4. Policy Breakdown (Handbook Classification)
            # Minor vs Major (Misconduct/Dishonesty/Violent Acts) vs Traffic
            policy_breakdown = Violation.objects.values('rule__category').annotate(
                count=Count('id')
            ).order_by('-count')

            # 5. Section 27.3.5 - Different Nature Major Offense Detection
            # Use the proven Audit Logic to find priority students
            active_vs = Violation.objects.filter(status__in=['OPEN', 'AWAITING_DECISION', 'DECISION_RENDERED']).select_related('student', 'student__user', 'rule')
            priority_students_map = {}
            
            for v in active_vs:
                # Use the serializer to check priority status (this is the source of truth)
                serializer = ViolationSerializer(v)
                if serializer.data.get('requires_director_decision'):
                    s_id = v.student.student_number
                    if s_id not in priority_students_map:
                        priority_students_map[s_id] = {
                            "name": v.student.user.full_name or f"{v.student.user.first_name} {v.student.user.last_name}",
                            "id": s_id,
                            "college": v.student.course,
                            "latest_date": v.timestamp,
                            "distinct_rules": 2 # Flagged
                        }
                    elif v.timestamp > priority_students_map[s_id]["latest_date"]:
                        priority_students_map[s_id]["latest_date"] = v.timestamp

            different_nature_students = list(priority_students_map.values())[:5]
            pending_decision_count = len(priority_students_map)

            # 6. Real Patrol Data
            active_patrols_count = PatrolSession.objects.filter(end_time__isnull=True).count()

            # 7. Hotspots and Temporal (Already in logic)
            
            # 8. College Distribution
            by_college = Violation.objects.values('student__course').annotate(
                count=Count('id')
            ).order_by('-count')

            # 9. Recent Violations
            recent_violations = Violation.objects.all().order_by('-timestamp')[:10]
            recent_serializer = ViolationSerializer(recent_violations, many=True)

            # 10. Risk Score Leaderboard (Top 10)
            # Use the StudentProfileSerializer to get the risk score for all students with violations
            students_with_violations = StudentProfile.objects.annotate(v_count=Count('violations')).filter(v_count__gt=0)
            leaderboard = []
            from apps.users.serializers import StudentProfileSerializer
            for s in students_with_violations:
                s_ser = StudentProfileSerializer(s)
                leaderboard.append({
                    "name": s.user.full_name,
                    "id": s.student_number,
                    "score": s_ser.data.get('risk_score', 0),
                    "college": s.course
                })
            leaderboard = sorted(leaderboard, key=lambda x: x['score'], reverse=True)[:10]

            # 11. Institutional Resolution Speed (Avg hours to CLOSE)
            resolved_cases_with_time = Violation.objects.filter(status='CLOSED').annotate(
                duration=ExpressionWrapper(F('updated_at') - F('timestamp'), output_field=DurationField())
            ).filter(duration__gt=timezone.timedelta(seconds=1))
            
            avg_duration = resolved_cases_with_time.aggregate(avg_dur=Avg('duration'))['avg_dur']
            avg_resolution_hours = round(avg_duration.total_seconds() / 3600, 1) if avg_duration else 0

            # 12. Recidivism Pattern Detection (Simplified Apriori)
            # Find common pairs using specific rule descriptions
            repeaters = StudentProfile.objects.annotate(v_count=Count('violations')).filter(v_count__gt=1)
            patterns_map = {}
            for s in repeaters:
                v_list = list(s.violations.select_related('rule').order_by('timestamp'))
                for i in range(len(v_list) - 1):
                    key = (
                        v_list[i].rule.description,
                        v_list[i].rule.category,
                        v_list[i+1].rule.description,
                        v_list[i+1].rule.category,
                    )
                    patterns_map[key] = patterns_map.get(key, 0) + 1

            patterns = []
            for (desc_a, cat_a, desc_b, cat_b), count in patterns_map.items():
                count_a = Violation.objects.filter(rule__description=desc_a).count()
                confidence = round((count / count_a * 100), 1) if count_a > 0 else 0
                if confidence > 10:
                    patterns.append({
                        "from": desc_a,
                        "from_category": cat_a,
                        "to": desc_b,
                        "to_category": cat_b,
                        "confidence": confidence,
                        "count": count
                    })
            patterns = sorted(patterns, key=lambda x: x['confidence'], reverse=True)[:5]

            # 13. Comparative Trends (vs Previous Period)
            prev_start = now - timezone.timedelta(days=days_count * 2)
            prev_end = now - timezone.timedelta(days=days_count)
            prev_period_violations = Violation.objects.filter(timestamp__range=[prev_start, prev_end])
            prev_total = prev_period_violations.count()
            
            total_trend = round(((total_count - prev_total) / prev_total * 100), 1) if prev_total > 0 else 0
            
            # Resolution Trend
            prev_res = prev_period_violations.filter(status__in=['CLOSED', 'DISMISSED']).annotate(
                duration=ExpressionWrapper(F('updated_at') - F('timestamp'), output_field=DurationField())
            ).aggregate(avg_dur=Avg('duration'))['avg_dur']
            
            prev_avg_hours = round(prev_res.total_seconds() / 3600, 1) if prev_res else 0
            res_trend = round(((avg_resolution_hours - prev_avg_hours) / prev_avg_hours * 100), 1) if prev_avg_hours > 0 else 0

            # 14. Live Pulse Feed
            live_pulse = []
            for v in Violation.objects.all().order_by('-timestamp')[:3]:
                live_pulse.append({
                    "id": f"VIO-{v.id}",
                    "type": v.rule.category,
                    "location": v.location,
                    "time": v.timestamp.strftime("%I:%M %p")
                })

            # 1. KPIs
            total_count = Violation.objects.count()
            closed_count = Violation.objects.filter(status__in=['CLOSED', 'DISMISSED', 'DECISION_RENDERED']).count()
            active_status_count = Violation.objects.filter(status__in=['OPEN', 'AWAITING_DECISION']).count()

            return Response({
                "status_distribution": {
                    "total": total_count,
                    "breakdown": [
                        {"status": "CLOSED", "count": closed_count},
                        {"status": "AWAITING_DECISION", "count": Violation.objects.filter(status='AWAITING_DECISION').count()},
                        {"status": "OPEN", "count": Violation.objects.filter(status='OPEN').count()}
                    ]
                },
                "stats": {
                    "active_cases": active_status_count,
                    "repeat_offenders": StudentProfile.objects.annotate(v_count=Count('violations')).filter(v_count__gt=1).count(),
                    "active_patrols": active_patrols_count,
                    "violations_today": Violation.objects.filter(timestamp__date=today).count(),
                    "pending_director_decisions": pending_decision_count,
                    "avg_resolution_hours": avg_resolution_hours,
                    "total_trend": total_trend,
                    "resolution_trend": res_trend
                },
                "risk_leaderboard": leaderboard,
                "live_pulse": live_pulse,

                "kpis": [
                    {"label": "TOTAL VIOLATIONS", "value": str(total_count), "trend": f"{'+' if total_trend > 0 else ''}{total_trend}%", "trendUp": total_trend > 0, "icon": "warning"},
                    {"label": "ACTIVE CASES", "value": str(active_status_count), "trend": "Ongoing", "trendUp": False, "icon": "calendar"},
                    {"label": "CLOSED CASES", "value": str(closed_count), "trend": f"{round(closed_count/total_count*100, 1) if total_count > 0 else 0}%", "trendUp": True, "icon": "verified"},
                    {"label": "REPEAT OFFENDERS", "value": str(StudentProfile.objects.annotate(v_count=Count('violations')).filter(v_count__gt=1).count()), "trend": "Monitored", "trendUp": False, "icon": "people"},
                ],

                "policy_breakdown": [
                    {"name": p['rule__category'], "count": p['count']} for p in policy_breakdown
                ],
                "byType": [
                    {
                        "type": p['rule__category'], 
                        "count": p['count'], 
                        "percentage": round((p['count'] / total_count * 100), 1) if total_count > 0 else 0
                    } for p in policy_breakdown
                ],
                "director_alert_queue": [
                    {
                        "name": s['name'],
                        "id": s['id'],
                        "distinct_rules": s['distinct_rules'],
                        "college": s['college'],
                        "date": s['latest_date'].strftime("%b %d, %Y") if s['latest_date'] else "N/A"
                    } for s in different_nature_students
                ],
                "hotspots": [
                    {"name": h['location'], "count": h['count'], "trend": "up" if h['count'] > 5 else "stable"} for h in hotspots
                ],
                "officer_activity": [
                    {
                        "name": f"{o['officer__first_name']} {o['officer__last_name']}".strip() or o['officer__username'],
                        "reports": o['count'],
                        "id": f"OFF-{o['officer__username'][:3].upper()}",
                        "status": "Active"
                    } for o in officer_activity
                ],
                "temporal": temporal_data,
                "seasonality_trend": seasonality_trend,
                "distribution": [
                    {
                        "label": "CLOSED",
                        "percentage": round((closed_count / total_count * 100), 1) if total_count > 0 else 0,
                        "color": "#004d33"
                    },
                    {
                        "label": "ONGOING",
                        "percentage": round((active_status_count / total_count * 100), 1) if total_count > 0 else 0,
                        "color": "#10b981"
                    }
                ],
                "byCollege": [
                    {"name": c['student__course'] or "General", "count": c['count']} for c in by_college
                ],
                "recidivism_patterns": patterns,
                "recent_violations": recent_serializer.data
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class OfficerDashboardAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            # Use the configured timezone (Asia/Manila) for local date matching
            local_now = timezone.localtime(timezone.now())
            today = local_now.date()
            
            # 1. KPI Stats
            total_count = Violation.objects.count()
            # RESOLVED now includes DECISION_RENDERED for dashboard workload purposes
            closed_count = Violation.objects.filter(status__in=['CLOSED', 'DISMISSED', 'DECISION_RENDERED']).count()
            active_cases = Violation.objects.filter(status__in=['OPEN', 'AWAITING_DECISION']).count()
            resolved_cases = closed_count
            
            resolution_rate = (resolved_cases / total_count * 100) if total_count > 0 else 0
            
            # Personalized Stats
            officer_email = request.query_params.get('email', None)
            my_cases_count = 0
            if officer_email:
                my_cases_count = Violation.objects.filter(
                    assigned_to__email__iexact=officer_email,
                    status__in=['OPEN', 'AWAITING_DECISION']
                ).count()

            repeat_offenders_count = StudentProfile.objects.annotate(
                v_count=Count('violations')
            ).filter(v_count__gt=1).count()

            # 2. Violations Over Time (Rolling Last 7 Days)
            temporal_data = []
            day_names = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
            
            start_date = local_now.date() - timezone.timedelta(days=6)
            violations_by_date = {}
            vs = Violation.objects.filter(timestamp__date__gte=start_date, timestamp__date__lte=local_now.date()).values('timestamp__date').annotate(count=Count('id'))
            for v in vs:
                violations_by_date[v['timestamp__date']] = v['count']
            
            for i in range(6, -1, -1): # From 6 days ago to today
                target_date = local_now.date() - timezone.timedelta(days=i)
                day_label = day_names[target_date.weekday()]
                
                day_count = violations_by_date.get(target_date, 0)
                
                temporal_data.append({"day": day_label, "value": day_count})

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
                    "color": "#004d33"
                },
                {
                    "label": "ACTIVE",
                    "percentage": round((active_cases / total_count * 100), 1) if total_count > 0 else 0,
                    "color": "#10b981"
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
            active_patrols_count = PatrolSession.objects.filter(end_time__isnull=True).count()
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
                    "active_patrols": active_patrols_count,
                    "my_workload": my_cases_count,
                    "repeat_offenders": repeat_offenders_count,
                },
                "violations_by_type": [
                    {"name": v['rule__category'], "count": v['count']} for v in violations_by_type
                ],
                "status_distribution": {
                    "total": total_count,
                    "breakdown": [
                        {"status": "CLOSED", "count": closed_count},
                        {"status": "ACTIVE", "count": active_cases}
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
                "active_patrols": active_patrols_count
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)
