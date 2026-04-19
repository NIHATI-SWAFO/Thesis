from rest_framework import permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import StudentProfile
from .serializers import StudentProfileSerializer

class StudentSearchView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        query = request.query_params.get('q', None)
        if not query:
            return Response({"error": "Search query is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if it's an ID search or Name search
        if query.isdigit() and len(query) >= 5:
            # Likely a student ID
            students = StudentProfile.objects.filter(student_number__icontains=query)
        else:
            # Likely a name search
            students = StudentProfile.objects.filter(user__full_name__icontains=query)
            
        serializer = StudentProfileSerializer(students, many=True)
        return Response(serializer.data)

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
            student = StudentProfile.objects.get(user__email__iexact=email)
            serializer = StudentProfileSerializer(student)
            return Response(serializer.data)
        except StudentProfile.DoesNotExist:
            return Response({"error": "No student record found for this email"}, status=status.HTTP_404_NOT_FOUND)

class StudentListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = StudentProfile.objects.all().order_by('user__full_name')
    serializer_class = StudentProfileSerializer
