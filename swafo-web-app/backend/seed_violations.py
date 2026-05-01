import os
import django
import random
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import StudentProfile
from apps.handbook.models import HandbookEntry
from apps.violations.models import Violation
from django.contrib.auth import get_user_model
from django.utils import timezone
from constants.locations import DLSUD_LOCATIONS, get_coordinates

def seed_violations():
    print("🗑️  Cleaning existing violations...")
    Violation.objects.all().delete()

    students = list(StudentProfile.objects.all())
    rules    = list(HandbookEntry.objects.all())
    User     = get_user_model()
    officers = list(User.objects.filter(role=User.Role.OFFICER))

    if len(students) < 5 or not rules or not officers:
        print("❌ Need students, handbook rules, and officers seeded first.")
        return

    now = timezone.now()

    # ── Hotspot distribution: real DLSUD building names with realistic weights ──
    # Higher weight = more violations recorded there
    hotspots = [
        # Location name (must match DLSUD_LOCATIONS key exactly)      weight
        ("ICTC Building",                      20),
        ("Julian Felipe Hall",                 15),
        ("Paulo Campos Hall",                  15),
        ("Mariano Alvarez Hall",               12),
        ("Magdalo Gate",                       10),
        ("University Food Square",              9),
        ("Aklatang Emilio Aguinaldo",           8),
        ("GMH Quadrangle",                      8),
        ("Rotunda (St. La Salle Marker)",        7),  # Not in DLSUD_LOCATIONS — skip, use Lumina-area
        ("Severino de las Alas Hall",           7),
        ("Felipe Calderon Hall",                6),
        ("University Clinic",                   6),
        ("Rizal Library",                       5),
        ("Vito Belarmino Hall",                 5),
        ("University Student Government",       4),
        ("Cafe Museo",                          4),
        ("Ladies Dormitory Complex",            4),
        ("Guest House",                         3),
        ("Botanical Garden Park",               3),
        ("Gate 3",                              3),
        ("Motor Pool",                          2),
        ("DLSU-D Grandstand",                   2),
        ("Santiago Alvarez Hall",               2),
        ("Ladislao Diwa Hall",                  2),
        ("Francisco Barzaga Hall",              2),
        ("Mariano Trias Hall",                  2),
        ("CTH Building A",                      2),
        ("Food Square Extension",               1),
        ("Museo De La Salle",                   1),
    ]

    # Filter to only locations that exist in DLSUD_LOCATIONS
    valid_hotspots = [(loc, w) for loc, w in hotspots if loc in DLSUD_LOCATIONS]
    location_names = [loc for loc, _ in valid_hotspots]
    weights        = [w   for _,   w in valid_hotspots]

    total_created = 0
    TARGET = 151

    print(f"🌱 Seeding {TARGET} violations across {len(valid_hotspots)} buildings...")

    for _ in range(TARGET):
        student  = random.choice(students)
        rule     = random.choice(rules)
        officer  = random.choice(officers)
        days_ago = random.randint(0, 60)
        ts       = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))

        loc_name = random.choices(location_names, weights=weights, k=1)[0]
        coords   = get_coordinates(loc_name)  # guaranteed real coords from DLSUD_LOCATIONS

        status = random.choices(
            ["OPEN", "AWAITING_DECISION", "DECISION_RENDERED", "CLOSED", "DISMISSED"],
            weights=[20, 20, 20, 30, 10], k=1
        )[0]

        v = Violation.objects.create(
            student=student,
            rule=rule,
            officer=officer,
            location=loc_name,
            location_name=loc_name,
            latitude=coords['lat'],
            longitude=coords['lng'],
            description=f"Recorded violation of {rule.rule_code} at {loc_name}.",
            status=status,
        )
        Violation.objects.filter(id=v.id).update(
            timestamp=ts,
            updated_at=ts + timedelta(hours=random.randint(1, 6)),
        )
        total_created += 1

    # ── Behavioral pattern injection for Apriori logic ─────────────────────────
    print("🧬 Injecting behavioral patterns...")
    pattern_pairs = [
        ("ICTC Building", "Julian Felipe Hall"),
        ("Paulo Campos Hall", "Mariano Alvarez Hall"),
        ("Magdalo Gate", "University Clinic"),
    ]
    for anchor, follow in pattern_pairs:
        if anchor not in DLSUD_LOCATIONS or follow not in DLSUD_LOCATIONS:
            continue
        a_coords = get_coordinates(anchor)
        f_coords = get_coordinates(follow)
        loitering = HandbookEntry.objects.filter(rule_code__icontains="27.1").first()
        uniform   = HandbookEntry.objects.filter(rule_code__icontains="27.1").last()
        if not loitering or not uniform:
            continue
        for i in range(5):
            student = students[i % len(students)]
            v1 = Violation.objects.create(
                student=student, rule=loitering, officer=random.choice(officers),
                location=anchor, location_name=anchor,
                latitude=a_coords['lat'], longitude=a_coords['lng'],
                status="CLOSED", description="Pattern A"
            )
            v2 = Violation.objects.create(
                student=student, rule=uniform, officer=random.choice(officers),
                location=follow, location_name=follow,
                latitude=f_coords['lat'], longitude=f_coords['lng'],
                status="CLOSED", description="Pattern B"
            )
            base = now - timedelta(days=random.randint(1, 45))
            Violation.objects.filter(id=v1.id).update(timestamp=base)
            Violation.objects.filter(id=v2.id).update(timestamp=base + timedelta(days=2))
            total_created += 2

    print(f"✅ Done! Created {total_created} violations with real building coordinates.")
    print("   Top hotspots seeded:")
    from collections import Counter
    counts = Counter(
        Violation.objects.values_list('location_name', flat=True)
    )
    for loc, cnt in counts.most_common(8):
        print(f"   {loc}: {cnt}")

if __name__ == "__main__":
    seed_violations()
