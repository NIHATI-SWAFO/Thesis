from rest_framework import permissions, generics
from rest_framework.views import APIView
from django.db.models import Count
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import StudentProfile, User
from .serializers import StudentProfileSerializer, UserSerializer

class MockLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = (request.data.get('email') or request.data.get('username') or '').strip()
        password = request.data.get('password')
        if not identifier:
            return Response({"error": "Email or ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = (
            User.objects.filter(email__iexact=identifier).first() or
            User.objects.filter(username__iexact=identifier).first() or
            User.objects.filter(full_name__iexact=identifier).first()
        )
        
        if not user:
            return Response({"error": "User account not found"}, status=status.HTTP_404_NOT_FOUND)

        if password and not user.check_password(password):
            return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })

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
    serializer_class = StudentProfileSerializer

    def get_queryset(self):
        queryset = StudentProfile.objects.all().order_by('user__full_name')
        college = self.request.query_params.get('college')
        if college:
            queryset = queryset.filter(course__iexact=college)
        return queryset

class StudentProfileDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer

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

class UserListView(generics.ListCreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

    def get_queryset(self):
        role = self.request.query_params.get('role')
        queryset = User.objects.all().order_by('full_name')
        if role:
            queryset = queryset.filter(role__iexact=role)
        return queryset

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = UserSerializer

from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = self.request.user
        email = self.request.query_params.get('email')
        if email:
            return Notification.objects.filter(user__email__iexact=email).order_by('-created_at')
        if user and user.is_authenticated:
            return Notification.objects.filter(user=user).order_by('-created_at')
        return Notification.objects.all().order_by('-created_at')

class NotificationUpdateView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Notification.objects.all()

