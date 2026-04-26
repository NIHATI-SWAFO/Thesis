"""
seed_violations — Generate realistic campus violation data for thesis defense.

Usage:
    python manage.py seed_violations              # 150 violations (default)
    python manage.py seed_violations --count 300  # custom count
    python manage.py seed_violations --clear      # wipe all existing violations first
"""

import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.violations.models import Violation
from apps.handbook.models import HandbookEntry
from apps.users.models import User, StudentProfile
from constants.locations import DLSUD_LOCATIONS, get_coordinates

# ── Location weights — uses EXACT keys from DLSUD_LOCATIONS ──────────────────
# Higher weight = more violations generated at that location.
LOCATION_WEIGHTS = {
    # Gates — high traffic, dress code checks
    "Gate 3":                                   10,
    "Magdalo Gate":                              8,

    # Academic buildings — moderate traffic
    "CTH Building A":                            3,
    "CTH Building B":                            3,
    "ICTC Building":                             8,
    "Julian Felipe Hall":                        5,
    "Felipe Calderon Hall":                      3,
    "Francisco Barzaga Hall":                    3,
    "Severino de las Alas Hall":                 4,
    "Ladislao Diwa Hall":                        3,
    "Mariano Trias Hall":                        3,
    "Santiago Alvarez Hall":                     3,
    "Mariano Alvarez Hall":                      3,
    "Paulo Campos Hall":                         3,
    "Doctor Fe Del Mundo Hall":                  3,
    "Doña Marcela Agoncillo Hall":               3,
    "Gregoria De Jesus Hall":                    2,
    "Vito Belarmino Hall":                       2,

    # High school
    "DLSU-D High School":                        5,
    "High School Annex Building":                2,
    "Basic Education Covered Court":             3,

    # Facilities & landmarks
    "Botanical Garden Park":                     2,
    "DLSU-D Grandstand":                         3,
    "GMH Quadrangle":                            4,
    "Guest House":                               1,
    "Ladies Dormitory Complex":                  3,
    "Motor Pool":                                4,
    "Residencia La Salle":                       3,
    "University Student Government":             3,
    "Ugnayang La Salle":                         2,

    # Libraries & cultural
    "Aklatang Emilio Aguinaldo":                 3,
    "Museo De La Salle":                         2,
    "Rizal Library":                             4,

    # Chapel
    "Antonio and Victoria Cojuanco Memorial Chapel of Our Lady of the Holy Rosary": 1,

    # Food
    "University Food Square":                   10,
    "Food Square Extension":                     5,
    "Cafe Museo":                                3,

    # Parking
    "DLSU-D Faculty/Staff Parking":              3,
    "DLSU-D Student/Faculty/Staff Parking":      4,
    "High School Parking":                       2,

    # Health
    "University Clinic":                         2,

    # Covered courts
    "MTH Covered Court":                         5,
}

# ── Rule category → preferred locations (uses exact keys) ────────────────────
CATEGORY_LOCATION_AFFINITY = {
    "Clothing": [
        "Gate 3", "Magdalo Gate", "University Food Square",
        "ICTC Building", "Julian Felipe Hall", "GMH Quadrangle",
    ],
    "Behavior": [
        "University Food Square", "Food Square Extension", "GMH Quadrangle",
        "MTH Covered Court", "DLSU-D Grandstand", "DLSU-D High School",
    ],
    "Misconduct": [
        "ICTC Building", "University Food Square", "MTH Covered Court",
        "DLSU-D Grandstand", "DLSU-D High School",
    ],
    "Dishonesty": [
        "ICTC Building", "Rizal Library", "Aklatang Emilio Aguinaldo",
        "Severino de las Alas Hall", "Paulo Campos Hall",
    ],
    "Violent": [
        "University Food Square", "MTH Covered Court",
        "DLSU-D Grandstand", "GMH Quadrangle",
    ],
    "Traffic": [
        "Gate 3", "Magdalo Gate", "Motor Pool",
        "DLSU-D Faculty/Staff Parking", "DLSU-D Student/Faculty/Staff Parking",
        "High School Parking",
    ],
}

STATUS_WEIGHTS = {'OPEN': 40, 'DECISION_RENDERED': 35, 'CLOSED': 25}

DESCRIPTIONS = {
    "Clothing": [
        "Student observed wearing non-compliant attire during regular school hours.",
        "Dress code violation detected at entry checkpoint.",
        "Improper uniform observed during morning inspection.",
        "Student wearing prohibited clothing items inside campus.",
        "Non-regulation footwear observed in academic building.",
    ],
    "Behavior": [
        "Student caught loitering in restricted area during class hours.",
        "Disruptive behavior reported in common area.",
        "Unnecessary noise reported near classrooms.",
        "Student sitting on prohibited surfaces in hallway.",
        "Use of inappropriate language within campus premises.",
    ],
    "Misconduct": [
        "Unauthorized use of campus facilities after hours.",
        "Failure to comply with officer's directive during patrol.",
        "Unauthorized gathering in restricted zone.",
        "Student found in prohibited area without valid pass.",
    ],
    "Dishonesty": [
        "Unauthorized materials found during examination period.",
        "Suspected plagiarism reported by faculty member.",
        "Falsification of campus documents detected.",
        "Student presenting invalid ID at checkpoint.",
    ],
    "Violent": [
        "Physical altercation reported between students.",
        "Threatening behavior observed in common area.",
        "Aggressive conduct during university event.",
    ],
    "Traffic": [
        "Unauthorized parking in designated area.",
        "Speeding within campus road limits.",
        "Failure to follow traffic signage at campus intersection.",
        "Driving against traffic flow on campus road.",
    ],
}


def get_category_key(category_name):
    lower = category_name.lower()
    if 'clothing' in lower:    return 'Clothing'
    if 'behavior' in lower:    return 'Behavior'
    if 'misconduct' in lower:  return 'Misconduct'
    if 'dishonesty' in lower:  return 'Dishonesty'
    if 'violent' in lower:     return 'Violent'
    if 'traffic' in lower:     return 'Traffic'
    return 'Behavior'


class Command(BaseCommand):
    help = 'Generate realistic campus violation seed data for thesis defense.'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=150, help='Number of violations (default 150)')
        parser.add_argument('--clear', action='store_true', help='Delete ALL existing violations first')

    def handle(self, *args, **options):
        count = options['count']

        if options['clear']:
            deleted, _ = Violation.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'🗑  Deleted {deleted} existing violations.'))

        rules    = list(HandbookEntry.objects.all())
        students = list(StudentProfile.objects.all())
        officers = list(User.objects.filter(role='OFFICER'))

        if not rules:
            return self.stdout.write(self.style.ERROR('❌ No handbook rules. Run handbook seeder first.'))
        if not students:
            return self.stdout.write(self.style.ERROR('❌ No students. Create student accounts first.'))
        if not officers:
            return self.stdout.write(self.style.ERROR('❌ No officers. Create officer accounts first.'))

        # Validate all seed locations exist in master DLSUD_LOCATIONS
        bad_keys = [k for k in LOCATION_WEIGHTS if k not in DLSUD_LOCATIONS]
        if bad_keys:
            self.stdout.write(self.style.ERROR(f'❌ These keys are NOT in DLSUD_LOCATIONS: {bad_keys}'))
            return

        loc_names   = list(LOCATION_WEIGHTS.keys())
        loc_weights = [LOCATION_WEIGHTS[n] for n in loc_names]
        statuses       = list(STATUS_WEIGHTS.keys())
        status_weights = [STATUS_WEIGHTS[s] for s in statuses]

        now       = timezone.now()
        created   = 0
        loc_dist  = {}

        for _ in range(count):
            rule    = random.choice(rules)
            cat_key = get_category_key(rule.category)

            # 70% affinity location, 30% weighted random
            if cat_key in CATEGORY_LOCATION_AFFINITY and random.random() < 0.7:
                location_name = random.choice(CATEGORY_LOCATION_AFFINITY[cat_key])
            else:
                location_name = random.choices(loc_names, weights=loc_weights, k=1)[0]

            coords = DLSUD_LOCATIONS.get(location_name)
            if not coords:
                self.stdout.write(self.style.WARNING(f'⚠️  Skipped unknown location: {location_name}'))
                continue

            # Date in last 60 days, weekday-biased
            days_ago   = random.randint(0, 60)
            candidate  = now - timedelta(days=days_ago)
            if candidate.weekday() >= 5 and random.random() < 0.8:
                days_ago += (7 - candidate.weekday())
                candidate = now - timedelta(days=days_ago)

            hour = random.randint(7, 17)
            ts   = candidate.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))

            # ±5m GPS jitter so points at same building don't perfectly overlap
            lat_jitter = random.uniform(-0.00005, 0.00005)
            lng_jitter = random.uniform(-0.00005, 0.00005)

            desc_options = DESCRIPTIONS.get(cat_key, DESCRIPTIONS['Behavior'])

            Violation.objects.create(
                student        = random.choice(students),
                officer        = random.choice(officers),
                rule           = rule,
                location       = location_name,
                location_name  = location_name,
                latitude       = coords['lat'] + lat_jitter,
                longitude      = coords['lng'] + lng_jitter,
                description    = random.choice(desc_options),
                status         = random.choices(statuses, weights=status_weights, k=1)[0],
                corrective_action = f"Standard corrective action for {rule.rule_code}",
                timestamp      = ts,
            )

            loc_dist[location_name] = loc_dist.get(location_name, 0) + 1
            created += 1

        self.stdout.write(self.style.SUCCESS(f'\n✅ Created {created} violations across {len(loc_dist)} locations.\n'))
        self.stdout.write('📊 Distribution:')
        for loc, cnt in sorted(loc_dist.items(), key=lambda x: -x[1])[:20]:
            bar = '█' * min(cnt, 40)
            self.stdout.write(f'  {cnt:3d}  {bar}  {loc}')
        if len(loc_dist) > 20:
            remaining = sum(v for _, v in sorted(loc_dist.items(), key=lambda x: -x[1])[20:])
            self.stdout.write(f'  ... +{len(loc_dist) - 20} more locations ({remaining} violations)')
        self.stdout.write(f'\n🗺  Heatmap ready at /campus-map')
