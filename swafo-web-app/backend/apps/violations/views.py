from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from collections import defaultdict
import math
from apps.users.models import StudentProfile
from apps.handbook.models import HandbookEntry
from django.db import models
from django.utils import timezone
from .models import Violation, Appeal
from .serializers import ViolationSerializer, AppealSerializer
try:
    from constants.locations import get_all_location_names, get_locations_by_category
except ImportError:
    def get_all_location_names(): return []
    def get_locations_by_category(): return {}

from apps.violations.consequence_engine import (
    evaluate_violation_consequence,
    evaluate_student_aggregate_standing,
)

class ViolationAssessmentView(APIView):
    permission_classes = [permissions.AllowAny]
    """
    Intelligent Logic: Checks student history and RECOMMENDS a penalty
    and institutional consequences based on the Handbook Sections 14, 26, 27.
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

            prior_list = [
                {
                    'rule_code': v.rule.rule_code,
                    'category': v.rule.category,
                    'status': v.status
                }
                for v in history
            ]
            rule_penalties = {
                'penalty_1st': rule.penalty_1st,
                'penalty_2nd': rule.penalty_2nd,
                'penalty_3rd': rule.penalty_3rd,
                'penalty_4th': rule.penalty_4th,
                'penalty_5th': rule.penalty_5th,
            }

            # Evaluate exact consequences under DLSU-D Student Handbook
            assessment = evaluate_violation_consequence(
                rule_code=rule.rule_code,
                rule_category=rule.category,
                rule_description=rule.description,
                rule_penalties=rule_penalties,
                prior_violations=prior_list
            )

            # Evaluate current standing and projected standing if this violation is logged
            current_standing = evaluate_student_aggregate_standing(
                violations=prior_list,
                manual_clearance_hold=(student.clearance_status == 'HOLD')
            )
            projected_history = prior_list + [{
                'rule_code': rule.rule_code,
                'category': rule.category,
                'status': 'OPEN'
            }]
            projected_standing = evaluate_student_aggregate_standing(
                violations=projected_history,
                manual_clearance_hold=(student.clearance_status == 'HOLD')
            )

            # Duplicate Detection Logic (within last 24 hours)
            from django.utils import timezone
            from datetime import timedelta
            day_threshold = timezone.now() - timedelta(hours=24)
            last_identical = Violation.objects.filter(student=student, rule=rule, timestamp__gte=day_threshold).order_by('-timestamp').first()

            return Response({
                "student_name": student.user.full_name,
                "rule_code": rule.rule_code,
                "rule_description": rule.description,
                "recommendation": assessment.recommendation,
                "instance_number": assessment.instance_number,
                "is_escalated": assessment.is_escalated,
                "escalation_reason": assessment.escalation_reason,
                "penalty_level": assessment.penalty_level,
                "requires_director_decision": assessment.requires_director_decision,
                "requires_sdb": assessment.requires_sdb,
                "mandatory_formation": assessment.mandatory_formation,
                "monetary_fine": assessment.monetary_fine,
                "vehicle_pass_cancelled": assessment.vehicle_pass_cancelled,
                "clearance_impact": assessment.clearance_impact,
                "clearance_reason": assessment.clearance_reason,
                "honors_eligibility": assessment.honors_eligibility,
                "honors_reason": assessment.honors_reason,
                "gmc_status": assessment.gmc_status,
                "gmc_reason": assessment.gmc_reason,
                "enters_formal_discipline_record": assessment.enters_formal_discipline_record,
                "current_standing": current_standing,
                "projected_standing": projected_standing,
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
        college = self.request.query_params.get('college')

        queryset = Violation.objects.all()

        if email:
            queryset = queryset.filter(student__user__email__iexact=email)
        if student_id:
            if str(student_id).isdigit():
                queryset = queryset.filter(models.Q(student__student_number=student_id) | models.Q(student__id=student_id))
            else:
                queryset = queryset.filter(student__student_number=student_id)
        if college:
            queryset = queryset.filter(student__course__iexact=college)

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
    Coordinates are resolved from DLSUD_LOCATIONS lookup when stored coords
    are missing or are the campus-center fallback.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from constants.locations import DLSUD_LOCATIONS, CAMPUS_CENTER

        CAMPUS_LAT = CAMPUS_CENTER['lat']
        CAMPUS_LNG = CAMPUS_CENTER['lng']
        CAMPUS_LAT_ROUNDED = round(CAMPUS_LAT, 4)
        CAMPUS_LNG_ROUNDED = round(CAMPUS_LNG, 4)

        violations = Violation.objects.select_related('rule', 'student')

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

        def resolve_coords(v):
            """Return (lat, lng) for a violation, looking up from DLSUD_LOCATIONS
               when the stored value is null or the campus-center fallback."""
            lat, lng = v.latitude, v.longitude
            # Treat None or exact campus-center as 'unknown'
            is_fallback = (
                lat is None or lng is None or
                (round(lat, 4) == CAMPUS_LAT_ROUNDED and round(lng, 4) == CAMPUS_LNG_ROUNDED)
            )
            if is_fallback:
                loc_key = v.location_name or v.location or ''
                # Try exact match first
                coords = DLSUD_LOCATIONS.get(loc_key)
                if not coords:
                    # Try case-insensitive partial match
                    loc_lower = loc_key.lower()
                    for name, c in DLSUD_LOCATIONS.items():
                        if loc_lower in name.lower() or name.lower() in loc_lower:
                            coords = c
                            break
                if coords:
                    lat, lng = coords['lat'], coords['lng']
                else:
                    # Still unknown — skip from heatmap (don't pollute campus center)
                    return None, None
            return lat, lng

        # ── Temporal Decay Parameter ─────────────────────────────────────────
        apply_decay = request.query_params.get('decay', 'false').lower() in ('true', '1', 'yes')
        now = timezone.now()
        SEVERITY_WEIGHTS = {
            'major': 30.0,
            'minor': 15.0,
            'traffic': 10.0,
            'general': 10.0,
        }
        LAMBDA_DECAY = 0.023  # 30-day half-life: ln(2) / 30 ≈ 0.0231

        # ── One GeoJSON feature per violation ──────────────────────────────
        features = []
        location_counts = defaultdict(lambda: {
            'lat': None,
            'lng': None,
            'count': 0,
            'recent_count': 0,
            'decay_score': 0.0,
            'name': '',
            'violations': []
        })

        for v in violations:
            lat, lng = resolve_coords(v)
            if lat is None:
                continue  # skip violations with no resolvable location

            cat_lower = (v.rule.category.lower() if v.rule and v.rule.category else 'minor')
            base_severity = 10.0
            for k, val in SEVERITY_WEIGHTS.items():
                if k in cat_lower:
                    base_severity = val
                    break

            days_elapsed = max(0, (now - v.timestamp).days)
            if apply_decay:
                weight = base_severity * math.exp(-LAMBDA_DECAY * days_elapsed)
            else:
                weight = 1.0

            key = v.location_name or v.location or 'Unknown'
            location_counts[key]['lat'] = lat
            location_counts[key]['lng'] = lng
            location_counts[key]['count'] += 1
            if days_elapsed <= 30:
                location_counts[key]['recent_count'] += 1
            location_counts[key]['decay_score'] += base_severity * math.exp(-LAMBDA_DECAY * days_elapsed)
            location_counts[key]['name'] = key
            location_counts[key]['violations'].append({
                'id': v.id,
                'rule_code': v.rule.rule_code if v.rule else '',
                'category': v.rule.category if v.rule else 'Unknown',
                'status': v.status,
                'timestamp': v.timestamp.strftime('%Y-%m-%d'),
                'days_elapsed': days_elapsed,
                'description': v.description[:100] if v.description else '',
            })

            features.append({
                "type": "Feature",
                "properties": {
                    "id":            v.id,
                    "location_name": key,
                    "category":      v.rule.category if v.rule else "Unknown",
                    "rule_code":     v.rule.rule_code if v.rule else "",
                    "status":        v.status,
                    "timestamp":     v.timestamp.strftime('%Y-%m-%d'),
                    "weight":        round(weight, 2),
                    "days_elapsed":  days_elapsed,
                    "decay_applied": apply_decay,
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat],  # [lng, lat] for Mapbox
                }
            })

        geojson = {"type": "FeatureCollection", "features": features}

        # ── Aggregated location_summary with resolved coords ─────────────────
        def get_risk_tier(score, is_decay):
            if is_decay:
                if score > 75: return 'Critical'
                if score >= 51: return 'High'
                if score >= 26: return 'Moderate'
                return 'Low'
            else:
                if score >= 21: return 'Critical'
                if score >= 11: return 'Very High'
                if score >= 7: return 'High'
                if score >= 4: return 'Moderate'
                return 'Low'

        location_summary = sorted(
            [{
                'name': d['name'],
                'lat': d['lat'],
                'lng': d['lng'],
                'count': d['count'],
                'recent_count': d['recent_count'],
                'decay_score': round(d['decay_score'], 1),
                'risk_score': round(d['decay_score'], 1) if apply_decay else d['count'],
                'risk_tier': get_risk_tier(d['decay_score'] if apply_decay else d['count'], apply_decay),
                'violations': sorted(d['violations'], key=lambda x: x['days_elapsed'])[:15],
            }
             for d in location_counts.values() if d['lat'] is not None],
            key=lambda x: -x['decay_score'] if apply_decay else -x['count']
        )

        return Response({
            'geojson':          geojson,
            'location_summary': location_summary,
            'total_violations': len(features),
            'decay_applied':    apply_decay,
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

class ViolationStatisticsView(APIView):
    """
    Returns aggregated statistics for the violation summary dashboard.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        today = timezone.localtime(timezone.now()).date()
        is_today = request.query_params.get('today', 'true').lower() == 'true'
        
        qs = Violation.objects.all()
        if is_today:
            qs = qs.filter(timestamp__date=today)
            
        uniform = qs.filter(rule__description__icontains='uniform').count()
        curfew = qs.filter(rule__description__icontains='curfew').count()
        id_pass = qs.filter(models.Q(rule__description__icontains='ID ') | models.Q(rule__description__icontains='identification') | models.Q(rule__description__icontains='id ')).count()
        smoking = qs.filter(rule__description__icontains='smok').count()
        
        total = uniform + curfew + id_pass + smoking
        
        return Response({
            "total_reports": total,
            "categories": {
                "uniform": uniform,
                "curfew": curfew,
                "id_pass": id_pass,
                "smoking": smoking
            }
        })

from rest_framework.exceptions import PermissionDenied
from rest_framework import permissions, authentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Q

class SafeJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None
        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None
        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except Exception:
            return None

class IsStudentOrDirector(permissions.BasePermission):
    def has_permission(self, request, view):
        return True

@method_decorator(csrf_exempt, name='dispatch')
class AppealListView(generics.ListCreateAPIView):
    authentication_classes = [SafeJWTAuthentication, authentication.SessionAuthentication]
    permission_classes = [permissions.AllowAny]
    serializer_class = AppealSerializer

    def get_queryset(self):
        qs = Appeal.objects.all().select_related('student__user', 'violation__rule')

        user = getattr(self.request, 'user', None)
        role = getattr(user, 'role', None) if user and user.is_authenticated else None

        student_id = self.request.query_params.get('student_id')
        email = self.request.query_params.get('email')
        status_filter = self.request.query_params.get('status')
        violation_id = self.request.query_params.get('violation_id') or self.request.query_params.get('violation')

        if email:
            qs = qs.filter(student__user__email__iexact=email)
        if student_id:
            if str(student_id).isdigit():
                qs = qs.filter(
                    Q(student__student_number=student_id) |
                    Q(student__id=student_id) |
                    Q(student__user__id=student_id)
                )
            else:
                qs = qs.filter(student__student_number=student_id)
        if violation_id:
            qs = qs.filter(violation_id=violation_id)

        # Restrict to own student appeals ONLY if explicitly authenticated as a STUDENT
        # and no specific student was queried.
        # Admins, Directors, and Officers see all appeals!
        if role == 'STUDENT' and not student_id and not email:
            student_profile = getattr(user, 'student_profile', None) or getattr(user, 'studentprofile', None)
            if student_profile:
                qs = qs.filter(student=student_profile)
            else:
                qs = qs.filter(student__user=user)

        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        student_profile = None

        if user and user.is_authenticated and getattr(user, 'role', None) == 'STUDENT':
            student_profile = getattr(user, 'student_profile', None) or getattr(user, 'studentprofile', None)

        violation = serializer.validated_data.get('violation')
        if not student_profile and violation and violation.student:
            student_profile = violation.student

        if not student_profile:
            student_profile = StudentProfile.objects.first()

        serializer.save(student=student_profile, status=Appeal.Status.PENDING)

@method_decorator(csrf_exempt, name='dispatch')
class AppealPendingListView(generics.ListAPIView):
    """
    Dedicated endpoint returning strictly PENDING appeals for Director Oversight widget.
    """
    authentication_classes = [SafeJWTAuthentication, authentication.SessionAuthentication]
    permission_classes = [permissions.AllowAny]
    serializer_class = AppealSerializer

    def get_queryset(self):
        return Appeal.objects.filter(status=Appeal.Status.PENDING).select_related(
            'student__user', 'violation__rule'
        ).order_by('-created_at')

@method_decorator(csrf_exempt, name='dispatch')
class AppealCreateView(generics.CreateAPIView):
    authentication_classes = [SafeJWTAuthentication, authentication.SessionAuthentication]
    permission_classes = [permissions.AllowAny]
    serializer_class = AppealSerializer

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        student_profile = None

        if user and user.is_authenticated and getattr(user, 'role', None) == 'STUDENT':
            student_profile = getattr(user, 'student_profile', None) or getattr(user, 'studentprofile', None)

        violation = serializer.validated_data.get('violation')
        if not student_profile and violation and violation.student:
            student_profile = violation.student

        if not student_profile:
            student_profile = StudentProfile.objects.first()

        serializer.save(student=student_profile, status=Appeal.Status.PENDING)


from apps.users.models import Notification
from .serializers import AppealSerializer, AppealUpdateSerializer

@method_decorator(csrf_exempt, name='dispatch')
class AppealUpdateView(generics.UpdateAPIView):
    queryset = Appeal.objects.all()
    serializer_class = AppealUpdateSerializer
    authentication_classes = [SafeJWTAuthentication, authentication.SessionAuthentication]
    permission_classes = [permissions.AllowAny]

    def perform_update(self, serializer):
        appeal = serializer.save()

        # Trigger notification to student
        notification_type = 'APPEAL_REPLY' if appeal.status == 'AWAITING_INFO' else 'APPEAL_UPDATE'
        try:
            if appeal.student and appeal.student.user:
                Notification.objects.create(
                    user=appeal.student.user,
                    title=f"Appeal Updated: {appeal.status}",
                    message=f"Your appeal regarding {appeal.violation.rule.rule_code} has been updated. Remarks: {appeal.reviewer_remarks or 'No remarks provided.'}",
                    notification_type=notification_type,
                    reference_id=appeal.id
                )
        except Exception:
            pass


