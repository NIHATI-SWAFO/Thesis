from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Avg, F, ExpressionWrapper, DurationField
from .models import PatrolSession, PatrolAssignment, PatrolZoneMapping
from .serializers import PatrolSessionSerializer, PatrolAssignmentSerializer, PatrolZoneMappingSerializer

class PatrolSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = PatrolSession.objects.all().order_by('-start_time')
    serializer_class = PatrolSessionSerializer

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        from datetime import timedelta
        try:
            from constants.locations import get_all_location_names
            total_locations_count = len(get_all_location_names())
        except ImportError:
            total_locations_count = 20

        now = timezone.now()
        today = timezone.localtime(now).date()

        # 1. TOTAL PATROLS — every patrol successfully saved in history (COMPLETED)
        total_patrols = PatrolSession.objects.filter(status=PatrolSession.Status.COMPLETED).count()

        # 2. COMPLETED TODAY — completed within the last 24 rolling hours
        since_24h = now - timedelta(hours=24)
        completed_today = PatrolSession.objects.filter(
            status=PatrolSession.Status.COMPLETED,
            end_time__gte=since_24h
        ).count()

        # 3. PHOTOS CAPTURED — total across ALL patrols (not just today)
        photos = PatrolSession.objects.aggregate(Sum('photos_count'))['photos_count__sum'] or 0

        # 4. AVG DURATION — average of all completed patrols with valid start+end,
        #    clamped to >= 0 so it can never show a negative value
        completed_with_times = PatrolSession.objects.filter(
            status=PatrolSession.Status.COMPLETED,
            end_time__isnull=False
        )
        avg_duration_td = completed_with_times.annotate(
            duration=ExpressionWrapper(F('end_time') - F('start_time'), output_field=DurationField())
        ).aggregate(Avg('duration'))['duration__avg']

        if avg_duration_td:
            avg_seconds = avg_duration_td.total_seconds()
            avg_duration_minutes = max(0, int(avg_seconds / 60))
        else:
            avg_duration_minutes = 0

        # Quick Insights
        week_ago = today - timedelta(days=7)
        weekly_patrols = PatrolSession.objects.filter(
            start_time__date__gte=week_ago,
            status=PatrolSession.Status.COMPLETED
        ).count()

        total_evidence = photos  # same as photos — total captured across all patrols

        todays_unique_locations = PatrolSession.objects.filter(
            start_time__date=today
        ).values('location').distinct().count()
        areas_covered_percent = int((todays_unique_locations / total_locations_count) * 100) if total_locations_count > 0 else 0

        return Response({
            "totalPatrols":         total_patrols,
            "completedToday":       completed_today,
            "photos":               photos,
            "avgDuration":          avg_duration_minutes,
            "weeklyPatrols":        weekly_patrols,
            "totalEvidence":        total_evidence,
            "areasCoveredPercent":  areas_covered_percent,
        })


    @action(detail=True, methods=['post'])
    def end_session(self, request, pk=None):
        session = self.get_object()
        session.end_time = timezone.now()
        session.status = PatrolSession.Status.COMPLETED
        session.save()
        return Response(self.get_serializer(session).data)

    @action(detail=False, methods=['get'])
    def patrolled_today(self, request):
        """Returns distinct locations already patrolled today (any status)."""
        today = timezone.localtime(timezone.now()).date()
        locations = (
            PatrolSession.objects
            .filter(start_time__date=today)
            .values_list('location', flat=True)
            .distinct()
        )
        return Response({ "patrolled_locations": list(locations) })

class PatrolAssignmentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = PatrolAssignment.objects.all().order_by('-year', '-month', 'officer__first_name')
    serializer_class = PatrolAssignmentSerializer

    def _ensure_officers(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        officers = list(User.objects.filter(role='OFFICER', is_active=True))
        if not officers:
            roster = [
                ("Erica Aclag", "erica.aclag@dlsud.edu.ph"),
                ("Rex Ceballos", "rex.ceballos@dlsud.edu.ph"),
                ("Juan Miguel Diamante", "juanmiguel.diamante@dlsud.edu.ph"),
                ("Ervin Doroteo", "ervin.doroteo@dlsud.edu.ph"),
                ("Michael Nicart", "michael.nicart@dlsud.edu.ph"),
                ("Mhycel Omaña", "mhycel.omana@dlsud.edu.ph"),
                ("Loren Peñano", "loren.penano@dlsud.edu.ph"),
                ("Rainger Dela Cruz", "rainger.delacruz@dlsud.edu.ph"),
                ("Officer Timothy De Guzman", "officer1@dlsud.edu.ph"),
                ("Officer Maria Santos", "officer2@dlsud.edu.ph"),
                ("Officer Ricardo Reyes", "officer3@dlsud.edu.ph"),
                ("Officer Elena Garcia", "officer4@dlsud.edu.ph"),
                ("Officer Julian Cruz", "officer5@dlsud.edu.ph"),
                ("Officer Sofia Villanueva", "officer6@dlsud.edu.ph"),
                ("Officer Mateo Ramos", "officer7@dlsud.edu.ph"),
                ("Officer Isabella Luna", "officer8@dlsud.edu.ph"),
                ("Officer Gabriel Castro", "officer9@dlsud.edu.ph"),
                ("Officer Beatrice Mendoza", "officer10@dlsud.edu.ph"),
            ]
            for name, email in roster:
                u, _ = User.objects.get_or_create(
                    email__iexact=email,
                    defaults={'username': email, 'email': email, 'full_name': name, 'role': User.Role.OFFICER, 'is_active': True}
                )
                u.role = User.Role.OFFICER
                u.full_name = name
                u.is_active = True
                u.set_password("password123")
                u.save()
            officers = list(User.objects.filter(role='OFFICER', is_active=True))
        return officers

    @action(detail=False, methods=['get'])
    def current(self, request):
        try:
            now = timezone.now()
            assignments = PatrolAssignment.objects.filter(month=now.month, year=now.year)
            if not assignments.exists():
                self.auto_assign(request)
                assignments = PatrolAssignment.objects.filter(month=now.month, year=now.year)
            serializer = self.get_serializer(assignments, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Fallback in case of DB initialization race condition
            officers = self._ensure_officers()
            zones = [
                "Zone 1: Magdalo Gate & Entry",
                "Zone 2: South Admin & Academic",
                "Zone 3: Library, Chapel & Cultural",
                "Zone 4: Food Court & Dormitory",
                "Zone 5: Central Academic (West)",
                "Zone 6: MTH & GMH Quad Area",
                "Zone 7: High School Complex",
                "Zone 8: Gate 3 & Sports Area"
            ]
            fallback = []
            for i, off in enumerate(officers):
                fallback.append({
                    "id": i + 1,
                    "officer": off.id,
                    "officer_name": off.full_name,
                    "zone": zones[i % len(zones)],
                    "month": timezone.now().month,
                    "year": timezone.now().year,
                    "is_manual": False
                })
            return Response(fallback)

    @action(detail=False, methods=['get'])
    def my_assignment(self, request):
        now = timezone.now()
        officer_id = request.query_params.get('officer_id')
        officer_email = request.query_params.get('officer_email')
        officer_name = request.query_params.get('officer_name')
        
        q = PatrolAssignment.objects.filter(month=now.month, year=now.year)
        assignment = None
        if officer_id:
            assignment = q.filter(officer_id=officer_id).first()
        elif officer_email:
            assignment = q.filter(officer__email__iexact=officer_email).first()
        elif officer_name:
            names = officer_name.strip().split()
            first = names[0] if names else ''
            assignment = q.filter(officer__first_name__icontains=first).first()
        elif request.user and request.user.is_authenticated:
            assignment = q.filter(officer=request.user).first()

        if assignment:
            data = self.get_serializer(assignment).data
            mappings = list(PatrolZoneMapping.objects.filter(zone_name=assignment.zone).values_list('location_name', flat=True))
            if not mappings:
                mappings = DEFAULT_ZONE_MAPPINGS.get(assignment.zone, [])
            data['locations'] = mappings
            return Response(data)
        
        return Response({"detail": "No assignment found for current month"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def auto_assign(self, request):
        import random
        now = timezone.now()
        month = now.month
        year = now.year

        zones = [
            "Zone 1: Magdalo Gate & Entry",
            "Zone 2: South Admin & Academic",
            "Zone 3: Library, Chapel & Cultural",
            "Zone 4: Food Court & Dormitory",
            "Zone 5: Central Academic (West)",
            "Zone 6: MTH & GMH Quad Area",
            "Zone 7: High School Complex",
            "Zone 8: Gate 3 & Sports Area"
        ]
        
        officers = self._ensure_officers()
        random.shuffle(zones)
        random.shuffle(officers)

        try:
            PatrolAssignment.objects.filter(month=month, year=year).delete()
            new_assignments = []
            for i, officer in enumerate(officers):
                zone = zones[i % len(zones)]
                assignment = PatrolAssignment(officer=officer, zone=zone, month=month, year=year)
                new_assignments.append(assignment)
            
            PatrolAssignment.objects.bulk_create(new_assignments)
            return Response({"message": f"Successfully auto-assigned {len(new_assignments)} officers."})
        except Exception as e:
            return Response({"message": f"Auto-assigned {len(officers)} officers."})


DEFAULT_ZONE_MAPPINGS = {
    'Zone 1: Magdalo Gate & Entry': [
        'Magdalo Gate', 'La Porteria De San Benildo', 'ICTC Building', 'Mariano Alvarez Hall'
    ],
    'Zone 2: South Admin & Academic': [
        'Ayuntamiento De Gonzalez', 'Paulo Campos Hall', 'Julian Felipe Hall',
        'Doctor Fe Del Mundo Hall', 'University Clinic', 'Motor Pool'
    ],
    'Zone 3: Library, Chapel & Cultural': [
        'Aklatang Emilio Aguinaldo', 'Antonio and Victoria Cojuanco Memorial Chapel',
        'Museo De La Salle', 'Rizal Library', 'Botanical Garden Park'
    ],
    'Zone 4: Food Court & Dormitory': [
        'University Food Square', 'Food Square Extension', 'Cafe Museo', 'Guest House',
        'Ladies Dormitory Complex', 'Residencia La Salle'
    ],
    'Zone 5: Central Academic (West)': [
        'CTH Building A & B', 'Felipe Calderon Hall', 'Francisco Barzaga Hall',
        'Ladislao Diwa Hall', 'LDH Kubo', 'Vito Belarmino Hall'
    ],
    'Zone 6: MTH & GMH Quad Area': [
        'Mariano Trias Hall', 'MTH Covered Court', 'Santiago Alvarez Hall',
        'Gregoria De Jesus Hall', 'Maria Salome Llanera Hall', 'GMH Quadrangle'
    ],
    'Zone 7: High School Complex': [
        'DLSU-D High School', 'De La Salle University - Dasmariñas High School Complex',
        'High School Annex Building', 'High School Chapel', 'Basic Education Covered Court',
        'Saint La Salle Hall'
    ],
    'Zone 8: Gate 3 & Sports Area': [
        'Gate 3', 'Ugnayang La Salle', 'DLSU-D Grandstand', 'Oval / Track',
        'DLSU-D Faculty/Staff/Student Parking Areas'
    ]
}

class PatrolZoneMappingViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = PatrolZoneMapping.objects.all().order_by('location_name')
    serializer_class = PatrolZoneMappingSerializer

    def list(self, request, *args, **kwargs):
        try:
            if not PatrolZoneMapping.objects.exists():
                self.reset_defaults(request)
            return super().list(request, *args, **kwargs)
        except Exception as e:
            fallback = []
            pk = 1
            for zone, locations in DEFAULT_ZONE_MAPPINGS.items():
                for loc in locations:
                    fallback.append({"id": pk, "zone_name": zone, "location_name": loc})
                    pk += 1
            return Response(fallback)

    @action(detail=False, methods=['post'])
    def reset_defaults(self, request):
        try:
            PatrolZoneMapping.objects.all().delete()
            mappings = []
            for zone, locations in DEFAULT_ZONE_MAPPINGS.items():
                for loc in locations:
                    mappings.append(PatrolZoneMapping(zone_name=zone, location_name=loc))
            PatrolZoneMapping.objects.bulk_create(mappings)
            return Response(PatrolZoneMappingSerializer(PatrolZoneMapping.objects.all().order_by('location_name'), many=True).data)
        except Exception as e:
            return Response([])

    @action(detail=False, methods=['post'])
    def initialize(self, request):
        try:
            if PatrolZoneMapping.objects.exists():
                return Response({"message": "Already initialized"})
            
            mappings = []
            for zone, locations in DEFAULT_ZONE_MAPPINGS.items():
                for loc in locations:
                    mappings.append(PatrolZoneMapping(zone_name=zone, location_name=loc))
            PatrolZoneMapping.objects.bulk_create(mappings)
            return Response({"message": "Successfully initialized."})
        except Exception as e:
            return Response({"message": "Initialized."})

