from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from collections import defaultdict
from apps.users.models import StudentProfile
from apps.handbook.models import HandbookEntry
from .models import Violation
from .serializers import ViolationSerializer
try:
    from constants.locations import get_all_location_names, get_locations_by_category
except ImportError:
    def get_all_location_names(): return []
    def get_locations_by_category(): return {}

class ViolationAssessmentView(APIView):
    permission_classes = [permissions.AllowAny]
    """
    Intelligent Logic: Checks student history and RECOMMENDS a penalty
    based on the frequency of the offense in the Handbook Section 27.
    """
    def get(self, request):
        student_id = request.query_params.get('student_id')
        rule_code = request.query_params.get('rule_code')

        if not student_id or not rule_code:
            return Response({"error": "student_id and rule_code are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = StudentProfile.objects.get(student_number=student_id)
            rule = HandbookEntry.objects.get(rule_code=rule_code)
            
            # Fetch all history for reference
            history = Violation.objects.filter(student=student).order_by('timestamp')
            history_data = ViolationSerializer(history, many=True).data
            
            recommendation = ""
            is_escalated = False

            # --- 1. TRAFFIC OFFENSE LOGIC (Section 27.4) ---
            if rule.category.strip().startswith("Traffic"):
                # Traffic violations stack by TYPE (Minor or Major), not just same rule code
                traffic_history = Violation.objects.filter(student=student, rule__category=rule.category)
                traffic_instance = traffic_history.count() + 1
                instance_number = traffic_instance # Update for UI
                
                if "Minor" in rule.category:
                    if traffic_instance == 1: recommendation = "Warning"
                    elif traffic_instance == 2: recommendation = "Minor Offense + Php 1,000 fine (Escalate to Section 27.1 record)"
                    elif traffic_instance == 3: recommendation = "Commission of 2nd minor offense + Php 2,000 fine"
                    else: recommendation = "Cancellation of vehicle pass + Commission of 3rd minor offense (Major Risk)"
                else: # Major Traffic
                    if traffic_instance == 1:
                        recommendation = "Major administrative sanction + Php 2,000 fine"
                    else:
                        # 2nd Major Traffic formally becomes a 'Major Offense' on the student's record
                        # CROSS-CHECK: Does the student have OTHER existing major offenses?
                        std_majors_count = Violation.objects.filter(student=student, rule__category__startswith="Major").count()
                        if std_majors_count > 0:
                            recommendation = "REFER TO SWAFO DIRECTOR (Section 27.3.5 - Different Nature: Traffic Major + Existing Disciplinary Major)"
                        else:
                            recommendation = "Major offense + Cancellation of vehicle sticker for 1 Academic Year"

            # --- 2. MINOR OFFENSE LOGIC (Standard Section 27.1) ---
            elif rule.category.strip().startswith("Minor"):
                same_rule_count = Violation.objects.filter(student=student, rule=rule).count()
                if same_rule_count >= 2: # This would be the 3rd+ instance
                    recommendation = "MAJOR ESCALATION: 27.3.1.39 (Habitual Minor Offense)"
                    is_escalated = True
                else:
                    # TALLY: Standard Minors + Escalated Traffic Minors (Instance 2+)
                    std_minors = Violation.objects.filter(student=student, rule__category__startswith="Minor").count()
                    escalated_traffic = Violation.objects.filter(student=student, rule__category="Traffic — Minor").count()
                    total_minors = std_minors + max(0, escalated_traffic - 1)
                    
                    if total_minors >= 2: # This would be the 3rd+ total minor
                        recommendation = "MAJOR ESCALATION: 27.3.1.43 (Third Minor Offense - Sanction 1)"
                        is_escalated = True
                    else:
                        current_minor_count = total_minors + 1
                        if current_minor_count == 1: recommendation = rule.penalty_1st or "Written Warning"
                        elif current_minor_count == 2: recommendation = rule.penalty_2nd or "First Minor Offense"
                        else: recommendation = rule.penalty_3rd or "Second Minor Offense"

                # Instance number for the UI (SAME RULE ONLY)
                instance_number = same_rule_count + 1

            # --- 3. MAJOR OFFENSE LOGIC (Standard Section 27.3) ---
            else:
                # TALLY: Standard Majors + Escalated Traffic Majors (Instance 2+)
                std_majors = Violation.objects.filter(student=student, rule__category__startswith="Major")
                escalated_traffic_majors_count = max(0, Violation.objects.filter(student=student, rule__category="Traffic — Major").count() - 1)
                
                # Check for "Different Nature" (Section 27.3.5)
                # If they have ANY escalated traffic major OR any other standard major, it's different nature
                has_history = std_majors.exists() or escalated_traffic_majors_count > 0
                
                if not has_history:
                    # 1st Major ever
                    recommendation = rule.penalty_1st or "Sanction 1: Probation (1 year)"
                else:
                    # Check if the ONLY history is the exact same rule
                    only_same_rule = std_majors.filter(rule=rule).count() == std_majors.count() and escalated_traffic_majors_count == 0
                    
                    if not only_same_rule:
                        recommendation = "REFER TO SWAFO DIRECTOR (Section 27.3.5 - Different Nature)"
                    else:
                        # Same rule repeating
                        count = std_majors.count() + 1
                        if count == 1: recommendation = rule.penalty_1st
                        elif count == 2: recommendation = rule.penalty_2nd
                        elif count == 3: recommendation = rule.penalty_3rd
                        elif count == 4: recommendation = rule.penalty_4th
                        else: recommendation = rule.penalty_5th or rule.penalty_4th or "Sanction 4: Non-readmission"
                
                # Instance number for the UI (SAME RULE ONLY)
                instance_number = std_majors.filter(rule=rule).count() + 1

            # --- 4. Duplicate Detection Logic ---
            from django.utils import timezone
            from datetime import timedelta
            day_threshold = timezone.now() - timedelta(hours=24)
            last_identical = Violation.objects.filter(student=student, rule=rule, timestamp__gte=day_threshold).order_by('-timestamp').first()

            return Response({
                "student_name": student.user.full_name,
                "rule_code": rule.rule_code,
                "rule_description": rule.description,
                "recommendation": recommendation,
                "instance_number": instance_number,
                "is_escalated": is_escalated,
                "is_duplicate": last_identical is not None,
                "history": history_data,
                "previous_incident": {
                    "timestamp": last_identical.timestamp,
                    "location": last_identical.location,
                    "id": last_identical.id
                } if last_identical else None
            })

        except StudentProfile.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except HandbookEntry.DoesNotExist:
            return Response({"error": "Handbook rule not found"}, status=status.HTTP_404_NOT_FOUND)

@method_decorator(csrf_exempt, name='dispatch')
class ViolationCreateView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    """
    Core Case Logging API: Persists the infraction and sanction recommendation.
    """
    queryset = Violation.objects.all()
    serializer_class = ViolationSerializer

class ViolationListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ViolationSerializer

    def get_queryset(self):
        email = self.request.query_params.get('email')
        student_id = self.request.query_params.get('student_id')
        
        queryset = Violation.objects.all()
        
        if email:
            queryset = queryset.filter(student__user__email__iexact=email)
        if student_id:
            queryset = queryset.filter(student__student_number=student_id)
            
        return queryset.order_by('-timestamp')

@method_decorator(csrf_exempt, name='dispatch')
class ViolationUpdateStatusView(generics.UpdateAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = Violation.objects.all()
    serializer_class = ViolationSerializer
    lookup_field = 'id'

@method_decorator(csrf_exempt, name='dispatch')
class ViolationAssignView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def patch(self, request, id):
        try:
            violation = Violation.objects.get(id=id)
            email = request.data.get('email')
            
            if not email:
                return Response({"error": "No officer identifier provided"}, status=status.HTTP_400_BAD_REQUEST)
            
            from django.contrib.auth import get_user_model
            User = get_user_model()
            officer = User.objects.get(email=email)
            
            violation.assigned_to = officer
            # Keep status as OPEN during investigation phase
            violation.save()
            
            return Response({
                "success": True, 
                "assigned_to": officer.email,
                "status": violation.status
            })
        except Violation.DoesNotExist:
            return Response({"error": "Violation not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HeatmapView(APIView):
    """
    Returns violation data for Mapbox heatmap + cluster layers.

    GPS-READY ARCHITECTURE:
        GeoJSON returns ONE feature per violation (not aggregated).
        Mapbox clusters them client-side — works identically whether
        violations come from named-location lookup OR real GPS coordinates.

    Query params (all optional):
        date_from  — YYYY-MM-DD
        date_to    — YYYY-MM-DD
        category   — minor / major / traffic

    Returns:
        geojson          — GeoJSON FeatureCollection, one Point per violation
        location_summary — [{name, lat, lng, count}] aggregated for stats chips
        total_violations — int
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        violations = Violation.objects.exclude(latitude=None).exclude(longitude=None) \
                                      .select_related('rule', 'student')

        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')
        category  = request.query_params.get('category', '').lower()

        if date_from:
            violations = violations.filter(timestamp__date__gte=date_from)
        if date_to:
            violations = violations.filter(timestamp__date__lte=date_to)
        if category == 'minor':
            violations = violations.filter(rule__category__icontains='minor')
        elif category == 'major':
            violations = violations.filter(rule__category__icontains='major')
        elif category == 'traffic':
            violations = violations.filter(rule__category__icontains='traffic')

        # ── One GeoJSON feature per violation ──────────────────────────────
        # ⚠️ Mapbox coordinate order: [lng, lat] — NOT [lat, lng]
        # Mapbox clusters these client-side via clusterRadius.
        # Works with exact named-location coords today, and real GPS tomorrow.
        features = []
        for v in violations:
            features.append({
                "type": "Feature",
                "properties": {
                    "id":            v.id,
                    "location_name": v.location_name or v.location or "Unknown",
                    "category":      v.rule.category if v.rule else "Unknown",
                    "rule_code":     v.rule.rule_code if v.rule else "",
                    "status":        v.status,
                    "timestamp":     v.timestamp.strftime('%Y-%m-%d'),
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [v.longitude, v.latitude],  # [lng, lat] for Mapbox
                }
            })

        geojson = {"type": "FeatureCollection", "features": features}

        # ── Aggregated location_summary for stats chips ─────────────────────
        location_counts = defaultdict(lambda: {'lat': 0.0, 'lng': 0.0, 'count': 0, 'name': ''})
        for v in violations:
            key = v.location_name or v.location or 'Unknown'
            location_counts[key]['lat']    = v.latitude
            location_counts[key]['lng']    = v.longitude
            location_counts[key]['count'] += 1
            location_counts[key]['name']   = key

        location_summary = sorted(
            [{'name': d['name'], 'lat': d['lat'], 'lng': d['lng'], 'count': d['count']}
             for d in location_counts.values()],
            key=lambda x: -x['count']
        )

        return Response({
            'geojson':          geojson,
            'location_summary': location_summary,
            'total_violations': len(features),
        })


class LocationsView(APIView):
    """
    Returns all DLSU-D patrol location names for the violation form dropdown.
    Supports flat list or grouped by category.

    Query params:
        grouped=true  — returns {"locations": {"Category": ["name1", ...]}}
        grouped=false — returns {"locations": ["name1", ...]}
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        grouped = request.query_params.get('grouped', 'false').lower() == 'true'
        if grouped:
            return Response({'locations': get_locations_by_category()})
        return Response({'locations': get_all_location_names()})
