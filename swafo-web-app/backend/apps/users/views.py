from rest_framework import permissions, generics
from rest_framework.views import APIView
from django.db.models import Count, Q
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import StudentProfile, User
from .serializers import StudentProfileSerializer, UserSerializer

class MockLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class StudentSearchView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({"error": "Search query is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Priority 1: Exact match on barcode_value
        exact_barcode = StudentProfile.objects.filter(barcode_value__iexact=query)
        if exact_barcode.exists():
            return Response(StudentProfileSerializer(exact_barcode, many=True).data)

        # Priority 2: Exact match on student_number
        exact_sn = StudentProfile.objects.filter(student_number__iexact=query)
        if exact_sn.exists():
            return Response(StudentProfileSerializer(exact_sn, many=True).data)

        # Priority 3: Fuzzy search across barcode, student_number, full_name, and email
        students = StudentProfile.objects.filter(
            Q(barcode_value__icontains=query) |
            Q(student_number__icontains=query) |
            Q(user__full_name__icontains=query) |
            Q(user__email__icontains=query)
        ).distinct()[:10]
        
        serializer = StudentProfileSerializer(students, many=True)
        return Response(serializer.data)

class UpdateBarcodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        student_number = request.data.get('student_number', '').strip()
        email = request.data.get('email', '').strip()
        barcode_value = request.data.get('barcode_value', '').strip()

        if not barcode_value:
            return Response({"error": "barcode_value is required"}, status=status.HTTP_400_BAD_REQUEST)

        student = None
        if student_number:
            student = StudentProfile.objects.filter(student_number=student_number).first()
        elif email:
            student = StudentProfile.objects.filter(user__email__iexact=email).first()

        if not student:
            return Response({"error": "Student record not found"}, status=status.HTTP_404_NOT_FOUND)

        student.barcode_value = barcode_value
        student.save()

        return Response({
            "success": True,
            "message": "Barcode successfully linked to student profile.",
            "student_number": student.student_number,
            "barcode_value": student.barcode_value,
            "profile": StudentProfileSerializer(student).data
        })

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
    serializer_class = StudentProfileSerializer

    def get_queryset(self):
        queryset = StudentProfile.objects.all().order_by('user__full_name')
        college = self.request.query_params.get('college')
        if college:
            queryset = queryset.filter(course__iexact=college)
        return queryset

class CollegeListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        colleges = (
            StudentProfile.objects
            .values_list('course', flat=True)
            .distinct()
            .order_by('course')
        )
        return Response({'colleges': [c for c in colleges if c]})

class UserListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

    def get_queryset(self):
        role = self.request.query_params.get('role')
        queryset = User.objects.all().order_by('full_name')
        if role:
            queryset = queryset.filter(role=role)
        return queryset
