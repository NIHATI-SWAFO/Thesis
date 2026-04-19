from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from apps.users.models import StudentProfile
from apps.handbook.models import HandbookEntry
from .models import Violation
from .serializers import ViolationSerializer

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
            
            # --- 1. Rule-Specific Frequency ---
            rule_specific_count = Violation.objects.filter(student=student, rule=rule).count()
            instance_number = rule_specific_count + 1
            
            # --- 2. Global Minor Offense Count (Escalation Logic) ---
            total_minors = Violation.objects.filter(
                student=student, 
                rule__rule_code__startswith='27.1'
            ).count()
            
            is_escalated = False
            recommendation = ""
            details = []

            if rule.rule_code.startswith('27.1'):
                # MINOR LOGIC (Section 27.1 and 27.3.1.43)
                current_total_minors = total_minors + 1
                
                if current_total_minors == 1:
                    recommendation = "Written Warning (Institutional Advice issued)"
                elif current_total_minors == 2:
                    recommendation = "First Minor Offense (Official Case Indexing + Formal Warning)"
                elif current_total_minors == 3:
                    recommendation = "Second Minor Offense (Parental/Guardian Notification required)"
                elif current_total_minors >= 4:
                    is_escalated = True
                    recommendation = "MAJOR OFFENSE ESCALATION (Section 27.3.1.43): "
                    
                    # Escalation level is based on how many minor offenses have passed the 3-offense threshold
                    # 4th total minor = Level 1 (Probation)
                    # 5th total minor = Level 2 (Suspension 3-5)
                    # 6th total minor = Level 3 (Suspension 6-12)
                    escalation_level = current_total_minors - 3
                    
                    if escalation_level == 1: recommendation += "Sanction 1: Probation (1 year)"
                    elif escalation_level == 2: recommendation += "Sanction 2: Suspension (3–5 school days)"
                    elif escalation_level == 3: recommendation += "Sanction 3: Suspension (6–12 school days)"
                    else: recommendation += "Sanction 4: Non-readmission"

            else:
                # MAJOR LOGIC (27.3.x)
                if instance_number == 1: recommendation = rule.penalty_1st
                elif instance_number == 2: recommendation = rule.penalty_2nd
                elif instance_number == 3: recommendation = rule.penalty_3rd
                elif instance_number == 4: recommendation = rule.penalty_4th
                else: recommendation = rule.penalty_5th
                
                different_majors_count = Violation.objects.filter(
                    student=student, 
                    rule__rule_code__startswith='27.3'
                ).exclude(rule=rule).count()
                
                if different_majors_count > 0:
                    details.append("Note: Student has prior major offenses of a DIFFERENT nature. Final sanction per Section 27.3.5 is at the discretion of the SWAFO Director.")

            # --- 3. Duplicate Detection Logic (24-Hour Temporal Window) ---
            from django.utils import timezone
            from datetime import timedelta
            
            day_threshold = timezone.now() - timedelta(hours=24)
            last_identical = Violation.objects.filter(
                student=student, 
                rule=rule,
                timestamp__gte=day_threshold
            ).order_by('-timestamp').first()
            
            is_duplicate = last_identical is not None
            
            duplicate_info = None
            if is_duplicate:
                duplicate_info = {
                    "timestamp": last_identical.timestamp,
                    "location": last_identical.location,
                    "description": last_identical.description,
                    "officer_name": last_identical.officer.full_name if last_identical.officer else "Institutional Authority",
                    "id": last_identical.id
                }

            return Response({
                "student_name": student.user.full_name,
                "rule_code": rule.rule_code,
                "rule_description": rule.description,
                "instance_number": instance_number,
                "total_minor_count": total_minors,
                "recommendation": recommendation,
                "is_repeat_offender": rule_specific_count > 0,
                "is_duplicate": is_duplicate,
                "previous_incident": duplicate_info,
                "is_escalated": is_escalated,
                "policy_notes": details
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
            violation.status = 'UNDER_REVIEW'
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
