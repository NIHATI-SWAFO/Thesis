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
            
            # Fetch all history for reference
            history = Violation.objects.filter(student=student).order_by('timestamp')
            history_data = ViolationSerializer(history, many=True).data
            
            recommendation = ""
            is_escalated = False

            # --- 1. MINOR OFFENSE LOGIC ---
            if rule.category.strip().startswith("Minor"):
                same_rule_count = Violation.objects.filter(student=student, rule=rule).count()
                if same_rule_count >= 2: # This would be the 3rd+ instance
                    recommendation = "MAJOR ESCALATION: 27.3.1.39 (Habitual Minor Offense)"
                    is_escalated = True
                else:
                    total_minors = Violation.objects.filter(student=student, rule__category__startswith="Minor").count()
                    if total_minors >= 2: # This would be the 3rd+ total minor
                        recommendation = "MAJOR ESCALATION: 27.3.1.43 (Third Minor Offense - Sanction 1)"
                        is_escalated = True
                    else:
                        current_minor_count = total_minors + 1
                        if current_minor_count == 1: recommendation = rule.penalty_1st or "Written Warning"
                        elif current_minor_count == 2: recommendation = rule.penalty_2nd or "First Minor Offense"
                        else: recommendation = rule.penalty_3rd or "Second Minor Offense"

            # --- 2. MAJOR OFFENSE LOGIC ---
            else:
                prev_majors = Violation.objects.filter(student=student, rule__category__startswith="Major")
                
                if not prev_majors.exists():
                    # 1st Major ever
                    recommendation = rule.penalty_1st or "Sanction 1: Probation (1 year)"
                else:
                    # Check for "Different Nature" (Section 27.3.5)
                    different_nature_exists = prev_majors.exclude(rule=rule).exists()
                    
                    if different_nature_exists:
                        recommendation = "REFER TO SWAFO DIRECTOR (Section 27.3.5 - Different Nature)"
                    else:
                        # Same rule repeating
                        count = prev_majors.count() + 1
                        if count == 1: recommendation = rule.penalty_1st
                        elif count == 2: recommendation = rule.penalty_2nd
                        elif count == 3: recommendation = rule.penalty_3rd
                        elif count == 4: recommendation = rule.penalty_4th
                        else: recommendation = rule.penalty_5th or rule.penalty_4th or "Sanction 4: Non-readmission"

            # --- 3. Duplicate Detection Logic ---
            from django.utils import timezone
            from datetime import timedelta
            day_threshold = timezone.now() - timedelta(hours=24)
            last_identical = Violation.objects.filter(student=student, rule=rule, timestamp__gte=day_threshold).order_by('-timestamp').first()
            
            # Instance number for the UI (SAME RULE ONLY)
            same_rule_count = Violation.objects.filter(student=student, rule=rule).count()
            instance_number = same_rule_count + 1

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
