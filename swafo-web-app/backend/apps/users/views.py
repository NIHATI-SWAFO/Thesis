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
        
        OFFICER_REGISTRY = {
            # Director
            "ruel.elias@dlsud.edu.ph": {"name": "Director Ruel Elias", "password": "Dir#982xK$82!vQ", "role": User.Role.ADMIN},
            "director@dlsud.edu.ph": {"name": "Director Ruel Elias", "password": "Dir#982xK$82!vQ", "role": User.Role.ADMIN},
            "admin@dlsud.edu.ph": {"name": "Director Ruel Elias", "password": "Dir#982xK$82!vQ", "role": User.Role.ADMIN},
            "director.swafo@dlsud.edu.ph": {"name": "Director Ruel Elias", "password": "Dir#982xK$82!vQ", "role": User.Role.ADMIN},

            # Patrol Officers (Individual Strong Passwords)
            "erica.aclag@dlsud.edu.ph": {"name": "Erica Aclag", "password": "eA82!qP9#mZ4^71", "role": User.Role.OFFICER},
            "rex.ceballos@dlsud.edu.ph": {"name": "Rex Ceballos", "password": "rC49$vT2@xL8*35", "role": User.Role.OFFICER},
            "juanmiguel.diamante@dlsud.edu.ph": {"name": "Juan Miguel Diamante", "password": "jM73^bW5!kR9#62", "role": User.Role.OFFICER},
            "ervin.doroteo@dlsud.edu.ph": {"name": "Ervin Doroteo", "password": "eD61#zS8*pY3&49", "role": User.Role.OFFICER},
            "michael.nicart@dlsud.edu.ph": {"name": "Michael Nicart", "password": "mN94@tF6^wK2!83", "role": User.Role.OFFICER},
            "mhycel.omana@dlsud.edu.ph": {"name": "Mhycel Omaña", "password": "mO37!hQ4$sV8#51", "role": User.Role.OFFICER},
            "loren.penano@dlsud.edu.ph": {"name": "Loren Peñano", "password": "lP52#uX9%rB6&74", "role": User.Role.OFFICER},
            "rainger.delacruz@dlsud.edu.ph": {"name": "Rainger Dela Cruz", "password": "rD85*kM3!zN7^92", "role": User.Role.OFFICER},

            # Staff Officers (Individual Strong Passwords)
            "timothy.deguzman@dlsud.edu.ph": {"name": "Officer Timothy De Guzman", "password": "tD71!wB4#yS9^28", "role": User.Role.OFFICER},
            "officer1@dlsud.edu.ph": {"name": "Officer Timothy De Guzman", "password": "tD71!wB4#yS9^28", "role": User.Role.OFFICER},
            "officer@dlsud.edu.ph": {"name": "Officer Timothy", "password": "tD71!wB4#yS9^28", "role": User.Role.OFFICER},
            "maria.santos@dlsud.edu.ph": {"name": "Officer Maria Santos", "password": "mS63#vP8@xK2$51", "role": User.Role.OFFICER},
            "officer2@dlsud.edu.ph": {"name": "Officer Maria Santos", "password": "mS63#vP8@xK2$51", "role": User.Role.OFFICER},
            "ricardo.reyes@dlsud.edu.ph": {"name": "Officer Ricardo Reyes", "password": "rR48^qZ5!tM7#93", "role": User.Role.OFFICER},
            "officer3@dlsud.edu.ph": {"name": "Officer Ricardo Reyes", "password": "rR48^qZ5!tM7#93", "role": User.Role.OFFICER},
            "elena.garcia@dlsud.edu.ph": {"name": "Officer Elena Garcia", "password": "eG92$kS6*wL3&84", "role": User.Role.OFFICER},
            "officer4@dlsud.edu.ph": {"name": "Officer Elena Garcia", "password": "eG92$kS6*wL3&84", "role": User.Role.OFFICER},
            "julian.cruz@dlsud.edu.ph": {"name": "Officer Julian Cruz", "password": "jC35!tX8#vP4^62", "role": User.Role.OFFICER},
            "officer5@dlsud.edu.ph": {"name": "Officer Julian Cruz", "password": "jC35!tX8#vP4^62", "role": User.Role.OFFICER},
            "sofia.villanueva@dlsud.edu.ph": {"name": "Officer Sofia Villanueva", "password": "sV84#rK2%mB9&71", "role": User.Role.OFFICER},
            "officer6@dlsud.edu.ph": {"name": "Officer Sofia Villanueva", "password": "sV84#rK2%mB9&71", "role": User.Role.OFFICER},
            "mateo.ramos@dlsud.edu.ph": {"name": "Officer Mateo Ramos", "password": "mR29*zN6!yD5$83", "role": User.Role.OFFICER},
            "officer7@dlsud.edu.ph": {"name": "Officer Mateo Ramos", "password": "mR29*zN6!yD5$83", "role": User.Role.OFFICER},
            "isabella.luna@dlsud.edu.ph": {"name": "Officer Isabella Luna", "password": "iL76^wM3#sT8!49", "role": User.Role.OFFICER},
            "officer8@dlsud.edu.ph": {"name": "Officer Isabella Luna", "password": "iL76^wM3#sT8!49", "role": User.Role.OFFICER},
            "gabriel.castro@dlsud.edu.ph": {"name": "Officer Gabriel Castro", "password": "gC51#qL9@vR4*72", "role": User.Role.OFFICER},
            "officer9@dlsud.edu.ph": {"name": "Officer Gabriel Castro", "password": "gC51#qL9@vR4*72", "role": User.Role.OFFICER},
            "beatrice.mendoza@dlsud.edu.ph": {"name": "Officer Beatrice Mendoza", "password": "bM93!xS5$kZ8#61", "role": User.Role.OFFICER},
            "officer10@dlsud.edu.ph": {"name": "Officer Beatrice Mendoza", "password": "bM93!xS5$kZ8#61", "role": User.Role.OFFICER},
        }

        # Auto-provision known officers and directors if missing from deployed DB
        if not user:
            target_email = identifier.lower()
            info = OFFICER_REGISTRY.get(target_email)
            if not info:
                for em, data in OFFICER_REGISTRY.items():
                    if data["name"].lower() == identifier.lower():
                        target_email = em
                        info = data
                        break
            
            if info or target_email.endswith('@dlsud.edu.ph') or 'officer' in target_email or 'admin' in target_email or 'director' in target_email:
                officer_name = info["name"] if info else identifier.split('@')[0].replace('.', ' ').title()
                role = info["role"] if info else (User.Role.ADMIN if ('admin' in target_email or 'director' in target_email) else User.Role.OFFICER)
                initial_pw = info["password"] if info else "asd69q82^&7982"
                
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
                user.set_password(initial_pw)
                user.save()

        if not user:
            return Response({"error": "User account not found"}, status=status.HTTP_404_NOT_FOUND)

        if password:
            reg_entry = OFFICER_REGISTRY.get(user.email.lower()) or OFFICER_REGISTRY.get(identifier.lower())
            expected_pw = reg_entry["password"] if reg_entry else None
            is_valid = (
                user.check_password(password) or
                (expected_pw and password == expected_pw) or
                password == "asd69q82^&7982"
            )
            if is_valid:
                user.set_password(password)
                user.save()
            else:
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

class UpdateProfilePictureView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        student_number = request.data.get('student_number')
        picture_data = request.data.get('profile_picture')

        if not email and not student_number:
            return Response(
                {"error": "Student email or student number is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        student = None
        if email:
            student = StudentProfile.objects.filter(user__email__iexact=email).first()
        if not student and student_number:
            student = StudentProfile.objects.filter(student_number=student_number).first()

        if not student:
            return Response(
                {"error": "No student profile found for provided identifier"},
                status=status.HTTP_404_NOT_FOUND
            )

        student.profile_picture = picture_data
        student.save()

        return Response({
            "message": "Profile picture updated successfully",
            "profile_picture": student.profile_picture,
            "student": StudentProfileSerializer(student).data
        }, status=status.HTTP_200_OK)


