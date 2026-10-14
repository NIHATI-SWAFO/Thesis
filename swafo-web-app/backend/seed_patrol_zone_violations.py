import os
import django
import random
from datetime import timedelta
from collections import defaultdict

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile
from apps.handbook.models import HandbookEntry
from apps.violations.models import Violation
from apps.patrols.models import PatrolAssignment, PatrolZoneMapping
from constants.locations import DLSUD_LOCATIONS, get_coordinates

def seed_patrol_zone_violations():
    print("[CLEANUP] Clearing existing violations to seed clean 10-per-building patrol dataset...")
    Violation.objects.all().delete()

    User = get_user_model()
    officers = list(User.objects.filter(role=User.Role.OFFICER, is_deleted=False))
    if not officers:
        officers = list(User.objects.filter(role=User.Role.OFFICER))

    students = list(StudentProfile.objects.select_related('user').all())
    major_rules = list(HandbookEntry.objects.filter(category__icontains='major'))
    minor_rules = list(HandbookEntry.objects.filter(category__icontains='minor'))
    all_rules = list(HandbookEntry.objects.all())

    if not students or not all_rules or not officers:
        print("[ERROR] Required students, handbook entries, or officers missing.")
        return

    # Map zones to their locations from PatrolZoneMapping
    zone_locations = defaultdict(list)
    for m in PatrolZoneMapping.objects.all():
        zone_locations[m.zone_name].append(m.location_name)

    now = timezone.now()
    total_seeded = 0

    print(f"[INFO] Seeding 10 violations per building across all {len(zone_locations)} officer patrol zones...")

    # For each zone, seed 10 violations for each building with contrasting temporal profiles
    for zone_name, buildings in zone_locations.items():
        print(f" -> Seeding {zone_name} ({len(buildings)} buildings)...")
        
        for bldg_idx, bldg_name in enumerate(buildings):
            coords = get_coordinates(bldg_name)
            if coords['lat'] is None:
                continue

            # Determine temporal profile for this building:
            # Building 0: Acute Recent Hotspot (1 to 3 days ago)
            # Building 1: Old Decayed Area (75 to 110 days ago)
            # Building 2: Half-Life Decayed Area (25 to 35 days ago)
            # Building 3+: Mixed Ongoing (5 to 60 days ago)
            if bldg_idx == 0:
                profile_type = "ACUTE_RECENT"
            elif bldg_idx == 1:
                profile_type = "OLD_DECAYED"
            elif bldg_idx == 2:
                profile_type = "HALF_LIFE"
            else:
                profile_type = "MIXED"

            for v_idx in range(10):
                student = random.choice(students)
                rule = random.choice(major_rules if v_idx % 2 == 0 else minor_rules)
                officer = random.choice(officers)

                if profile_type == "ACUTE_RECENT":
                    days_ago = random.uniform(0.3, 2.8)
                    status = random.choice(["OPEN", "OPEN", "AWAITING_DECISION", "DECISION_RENDERED"])
                elif profile_type == "OLD_DECAYED":
                    days_ago = random.uniform(75, 110)
                    status = "CLOSED"
                elif profile_type == "HALF_LIFE":
                    days_ago = random.uniform(25, 35)
                    status = random.choice(["DECISION_RENDERED", "CLOSED", "OPEN"])
                else:
                    days_ago = random.uniform(5, 55)
                    status = random.choice(["OPEN", "AWAITING_DECISION", "DECISION_RENDERED", "CLOSED"])

                ts = now - timedelta(days=days_ago, hours=random.randint(0, 12), minutes=random.randint(0, 59))

                v = Violation.objects.create(
                    student=student,
                    rule=rule,
                    officer=officer,
                    location=bldg_name,
                    location_name=bldg_name,
                    latitude=coords['lat'],
                    longitude=coords['lng'],
                    description=f"Patrol observation ({profile_type}): {rule.rule_code} at {bldg_name}.",
                    status=status
                )
                Violation.objects.filter(id=v.id).update(timestamp=ts, updated_at=ts)
                total_seeded += 1

    print("\n" + "=" * 70)
    print(f"[SUCCESS] Total violations created: {total_seeded}")
    print("=" * 70)
    print("Each building in every officer's assigned zone now has EXACTLY 10 violations.")
    print("When an officer tests their patrol screen:")
    print(" - 'ALL-TIME VOLUME': Every building in their zone shows count = 10.")
    print(" - 'RECENT (TEMPORAL DECAY)':")
    print("     Building 1 -> CRITICAL RED HOTSPOT (All 10 from past 1-3 days)")
    print("     Building 2 -> LOW RISK GREEN (All 10 from 75-110 days ago, decayed)")
    print("     Building 3 -> MODERATE AMBER (All 10 from ~30 days ago, 1 half-life)")
    print("=" * 70)

if __name__ == '__main__':
    seed_patrol_zone_violations()
