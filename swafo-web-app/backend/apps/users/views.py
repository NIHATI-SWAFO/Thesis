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
        
        # Auto-provision known officers and directors if missing from deployed DB
        if not user:
            roster = {
                "erica.aclag@dlsud.edu.ph": "Erica Aclag",
                "rex.ceballos@dlsud.edu.ph": "Rex Ceballos",
                "juanmiguel.diamante@dlsud.edu.ph": "Juan Miguel Diamante",
                "ervin.doroteo@dlsud.edu.ph": "Ervin Doroteo",
                "michael.nicart@dlsud.edu.ph": "Michael Nicart",
                "mhycel.omana@dlsud.edu.ph": "Mhycel Omaña",
                "loren.penano@dlsud.edu.ph": "Loren Peñano",
                "rainger.delacruz@dlsud.edu.ph": "Rainger Dela Cruz",
                "officer@dlsud.edu.ph": "Officer Timothy",
                "officer1@dlsud.edu.ph": "Officer Timothy De Guzman",
                "officer2@dlsud.edu.ph": "Officer Maria Santos",
                "officer3@dlsud.edu.ph": "Officer Ricardo Reyes",
                "officer4@dlsud.edu.ph": "Officer Elena Garcia",
                "officer5@dlsud.edu.ph": "Officer Julian Cruz",
                "officer6@dlsud.edu.ph": "Officer Sofia Villanueva",
                "officer7@dlsud.edu.ph": "Officer Mateo Ramos",
                "officer8@dlsud.edu.ph": "Officer Isabella Luna",
                "officer9@dlsud.edu.ph": "Officer Gabriel Castro",
                "officer10@dlsud.edu.ph": "Officer Beatrice Mendoza",
                "admin@dlsud.edu.ph": "Director Ruel Elias",
            }
            target_email = identifier.lower()
            name = roster.get(target_email)
            if not name:
                for em, nm in roster.items():
                    if nm.lower() == identifier.lower():
                        target_email = em
                        name = nm
                        break
            
            if name or target_email.endswith('@dlsud.edu.ph') or 'officer' in target_email or 'admin' in target_email:
                officer_name = name or identifier.split('@')[0].replace('.', ' ').title()
                role = User.Role.ADMIN if (target_email == "admin@dlsud.edu.ph" or 'admin' in target_email) else User.Role.OFFICER
                user, _ = User.objects.get_or_create(
                    email__iexact=target_email,
                    defaults={
                        'username': target_email,
                        'email': target_email,
                        'full_name': officer_name,
                        'role': role,
                        'is_active': True,
                    }
                )
                user.role = role
                user.full_name = officer_name
                user.is_active = True
                user.set_password(password or "password123")
                user.save()

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

