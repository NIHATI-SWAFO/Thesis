from rest_framework import permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import StudentProfile
from .serializers import StudentProfileSerializer

class StudentSearchView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        student_id = request.query_params.get('id', None)
        if not student_id:
            return Response({"error": "Student ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            student = StudentProfile.objects.get(student_number=student_id)
            serializer = StudentProfileSerializer(student)
            return Response(serializer.data)
        except StudentProfile.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

class ProfileByEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    """
    PROTOTYPE SHORTCUT: Retrieves the student record using the MSAL email.
    Note: To be transitioned to JWT token-based verification in production.
    """
    def get(self, request):
        email = request.query_params.get('email', None)
        if not email:
            return Response({"error": "Email parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            student = StudentProfile.objects.get(user__email=email)
            serializer = StudentProfileSerializer(student)
            return Response(serializer.data)
        except StudentProfile.DoesNotExist:
            return Response({"error": "No student record found for this email"}, status=status.HTTP_404_NOT_FOUND)

class StudentListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = StudentProfile.objects.all().order_by('user__full_name')
    serializer_class = StudentProfileSerializer
