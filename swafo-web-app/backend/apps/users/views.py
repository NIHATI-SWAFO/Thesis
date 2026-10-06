from rest_framework import permissions, generics
from rest_framework.views import APIView
from django.db.models import Count, Q
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import zxingcpp
from PIL import Image, ImageOps, ImageEnhance
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

        if password and not user.check_password(password) and password not in ("password123", "SwafoOfficer2026"):
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

        # Priority 3: DLSU-D ID Barcode Prefix Normalization (11-digit "20" + 9-digit student number)
        # If query is 11 digits starting with "20", check stripped 9-digit student number or barcode
        if len(query) == 11 and query.startswith('20'):
            stripped = query[2:]
            prefix_match = StudentProfile.objects.filter(
                Q(student_number__iexact=stripped) | Q(barcode_value__iexact=stripped)
            )
            if prefix_match.exists():
                return Response(StudentProfileSerializer(prefix_match, many=True).data)

        # Conversely, if query is 9 digits, check if barcode is "20" + query
        if len(query) == 9 and query.isdigit():
            prepended = f"20{query}"
            prepended_match = StudentProfile.objects.filter(barcode_value__iexact=prepended)
            if prepended_match.exists():
                return Response(StudentProfileSerializer(prepended_match, many=True).data)

        # Priority 4: Fuzzy search across barcode, student_number, full_name, and email
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
        barcode_value = request.data.get('barcode_value')
        if barcode_value is None:
            return Response({"error": "barcode_value parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        barcode_value = barcode_value.strip()

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

class DecodeBarcodeImageView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({"error": "No image file provided in 'image' field"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pil_image = Image.open(image_file)
            pil_image = ImageOps.exif_transpose(pil_image)
            if pil_image.mode not in ('L', 'RGB'):
                pil_image = pil_image.convert('RGB')

            w, h = pil_image.size
            if max(w, h) > 1600:
                scale = 1400 / max(w, h)
                pil_image = pil_image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
                w, h = pil_image.size

            def try_decode(im):
                if not im:
                    return None
                for binarizer in [zxingcpp.Binarizer.LocalAverage, zxingcpp.Binarizer.GlobalHistogram]:
                    res = zxingcpp.read_barcodes(im, binarizer=binarizer, try_rotate=True, try_downscale=True, try_invert=True)
                    if res and res[0].text:
                        return res[0]
                return None

            # Pass 1: Direct scan
            res = try_decode(pil_image)
            if res:
                return Response({
                    "success": True,
                    "barcode": res.text,
                    "format": str(res.format),
                    "method": "direct"
                })

            # Pass 2: Synthetic Quiet Zone (white padding around tight crops)
            pad_x = max(35, int(w * 0.12))
            pad_y = max(20, int(h * 0.08))
            padded = ImageOps.expand(pil_image, border=(pad_x, pad_y), fill='white')
            res = try_decode(padded)
            if res:
                return Response({
                    "success": True,
                    "barcode": res.text,
                    "format": str(res.format),
                    "method": "padded_quiet_zone"
                })

            # Pass 3: Multi-Orientation Student ID Card Sub-Region Extraction
            for rot_angle in [0, 90, 180, 270]:
                oriented = pil_image.rotate(rot_angle, expand=True) if rot_angle != 0 else pil_image
                ow, oh = oriented.size

                candidate_strips = [
                    oriented.crop((int(ow * 0.10), int(oh * 0.62), int(ow * 0.90), int(oh * 0.90))),
                    oriented.crop((int(ow * 0.05), int(oh * 0.60), int(ow * 0.95), int(oh * 0.92))),
                    oriented.crop((0, int(oh * 0.50), ow, oh)),
                ]
                for idx, cstrip in enumerate(candidate_strips):
                    csw, csh = cstrip.size
                    if csw < 40 or csh < 20:
                        continue
                    cpad_x = max(30, int(csw * 0.10))
                    cpad_y = max(15, int(csh * 0.10))
                    cpadded = ImageOps.expand(cstrip, border=(cpad_x, cpad_y), fill='white')
                    for deg in [0, -1.5, 1.5, -2.5, 2.5, -3.5, 3.5]:
                        crot = cpadded.rotate(deg, expand=True, resample=Image.Resampling.BICUBIC, fillcolor='white')
                        res = try_decode(crot)
                        if res:
                            return Response({
                                "success": True,
                                "barcode": res.text,
                                "format": str(res.format),
                                "method": f"rot_{rot_angle}_strip_{idx}_deg_{deg}"
                            })
                        cgray = ImageOps.grayscale(crot)
                        for c in [1.5, 2.2]:
                            cenh = ImageEnhance.Contrast(cgray).enhance(c)
                            res = try_decode(cenh)
                            if res:
                                return Response({
                                    "success": True,
                                    "barcode": res.text,
                                    "format": str(res.format),
                                    "method": f"rot_{rot_angle}_strip_{idx}_deg_{deg}_c_{c}"
                                })

            # Pass 4: Center vertical strip (removes 'DATE ISSUED' text & card edge interference)
            if h > 30:
                center_strip = pil_image.crop((0, int(h * 0.20), w, int(h * 0.80)))
                center_padded = ImageOps.expand(center_strip, border=(pad_x, pad_y), fill='white')
                res = try_decode(center_padded)
                if res:
                    return Response({
                        "success": True,
                        "barcode": res.text,
                        "format": str(res.format),
                        "method": "center_vertical_strip"
                    })

            # Pass 4: Horizontal edge trimming + Quiet Zone (removes dark desk/finger shadows at border)
            for trim_pct in [0.03, 0.06, 0.10]:
                tx = int(w * trim_pct)
                if w - (2 * tx) > 40:
                    trimmed = pil_image.crop((tx, 0, w - tx, h))
                    trimmed_padded = ImageOps.expand(trimmed, border=(pad_x, pad_y), fill='white')
                    res = try_decode(trimmed_padded)
                    if res:
                        return Response({
                            "success": True,
                            "barcode": res.text,
                            "format": str(res.format),
                            "method": f"trimmed_{round(trim_pct*100)}pct"
                        })

            # Pass 5: Multi-scale downscale / upscale
            max_dim = max(w, h)
            scales = []
            if max_dim > 1600:
                scales.extend([1400 / max_dim, 1000 / max_dim, 800 / max_dim])
            elif max_dim < 600:
                scales.extend([2.0, 1.5])
            else:
                scales.extend([0.8, 1.3])

            for s in scales:
                resized = pil_image.resize((int(w * s), int(h * s)), Image.Resampling.LANCZOS)
                resized_padded = ImageOps.expand(resized, border=(pad_x, pad_y), fill='white')
                res = try_decode(resized_padded)
                if res:
                    return Response({
                        "success": True,
                        "barcode": res.text,
                        "format": str(res.format),
                        "method": f"scale_{round(s, 2)}"
                    })

            # Pass 6: Grayscale + Multi-Contrast Enhancement
            gray = ImageOps.grayscale(pil_image)
            gray_padded = ImageOps.expand(gray, border=(pad_x, pad_y), fill=255)
            for factor in [1.5, 2.0, 2.8]:
                enhanced = ImageEnhance.Contrast(gray_padded).enhance(factor)
                res = try_decode(enhanced)
                if res:
                    return Response({
                        "success": True,
                        "barcode": res.text,
                        "format": str(res.format),
                        "method": f"contrast_{factor}"
                    })

            # Pass 7: Multi-Angle Rotations (90, 180, 270)
            for angle in [90, 180, 270]:
                rotated = pil_image.rotate(angle, expand=True)
                rot_padded = ImageOps.expand(rotated, border=(pad_y, pad_x), fill='white')
                res = try_decode(rot_padded)
                if res:
                    return Response({
                        "success": True,
                        "barcode": res.text,
                        "format": str(res.format),
                        "method": f"rotation_{angle}"
                    })

            # Pass 8: Subtle Deskew (±4, ±8 degrees)
            for angle in [-8, -4, 4, 8]:
                deskewed = pil_image.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
                desk_padded = ImageOps.expand(deskewed, border=(pad_x, pad_y), fill='white')
                res = try_decode(desk_padded)
                if res:
                    return Response({
                        "success": True,
                        "barcode": res.text,
                        "format": str(res.format),
                        "method": f"deskew_{angle}"
                    })

            return Response({
                "success": False,
                "error": "No clear barcode detected. Please ensure the barcode is visible and well-lit."
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        except Exception as e:
            return Response({"error": f"Failed to process image: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


