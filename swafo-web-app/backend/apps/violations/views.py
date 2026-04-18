from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
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
                    recommendation = "Institutional Warning (Written)"
                elif current_total_minors == 2:
                    recommendation = "First Minor Offense on Record"
                elif current_total_minors == 3:
                    recommendation = "Second Minor Offense on Record"
                elif current_total_minors >= 4:
                    is_escalated = True
                    recommendation = "MAJOR OFFENSE ESCALATION (Section 27.3.1.43): "
                    
                    escalation_count = Violation.objects.filter(
                        student=student, 
                        corrective_action__icontains="27.3.1.43"
                    ).count()
                    
                    if escalation_count == 0: recommendation += "Sanction 1: Probation (1 year)"
                    elif escalation_count == 1: recommendation += "Sanction 2: Suspension (3–5 school days)"
                    elif escalation_count == 2: recommendation += "Sanction 3: Suspension (6–12 school days)"
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

            return Response({
                "student_name": student.user.full_name,
                "rule_code": rule.rule_code,
                "rule_description": rule.description,
                "instance_number": instance_number,
                "total_minor_count": total_minors,
                "recommendation": recommendation,
                "is_repeat_offender": rule_specific_count > 0,
                "is_escalated": is_escalated,
                "policy_notes": details
            })

        except StudentProfile.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except HandbookEntry.DoesNotExist:
            return Response({"error": "Handbook rule not found"}, status=status.HTTP_404_NOT_FOUND)

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
        if email:
            return Violation.objects.filter(student__user__email=email).order_by('-timestamp')
        return Violation.objects.all().order_by('-timestamp')
