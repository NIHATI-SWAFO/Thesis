import os
import django
import random
import math
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile
from apps.handbook.models import HandbookEntry
from apps.violations.models import Violation
from constants.locations import DLSUD_LOCATIONS, get_coordinates

def seed_temporal_data():
    print("[CLEANUP] Cleaning existing violations to generate clean benchmark data...")
    Violation.objects.all().delete()

    User = get_user_model()
    officers = list(User.objects.filter(role=User.Role.OFFICER, is_deleted=False))
    if not officers:
        officers = list(User.objects.filter(role=User.Role.OFFICER))

    major_rules = list(HandbookEntry.objects.filter(category__icontains='major'))
    minor_rules = list(HandbookEntry.objects.filter(category__icontains='minor'))
    all_rules = list(HandbookEntry.objects.all())

    students = list(StudentProfile.objects.select_related('user').all())

    if len(students) < 5 or not all_rules or not officers:
        print("❌ Prerequisites not met. Please ensure students, rules, and officers are seeded.")
        return

    # Specific benchmark students
    timothy = StudentProfile.objects.filter(user__email="dtl0396@dlsud.edu.ph").first() or students[0]
    maria = StudentProfile.objects.filter(user__email="student_202963120@dlsud.edu.ph").first() or students[1]
    juan = StudentProfile.objects.filter(user__email="student_202762053@dlsud.edu.ph").first() or students[2]
    other_students = [s for s in students if s.id not in (timothy.id, maria.id, juan.id)]

    now = timezone.now()
    created_count = 0

    print("[1/3] Seeding Curated Student Comparison Scenarios...")

    # ──────────────────────────────────────────────────────────────────────────
    # STUDENT 1: Maria Clara — "Active Acute Violator"
    # 4 violations, ALL within the past 2–4 days, all OPEN
    # Expected: Count = 4 | Risk Score = ~80+ (CRITICAL RISK)
    # ──────────────────────────────────────────────────────────────────────────
    maria_locs = ["Julian Felipe Hall", "Julian Felipe Hall", "Paulo Campos Hall", "Julian Felipe Hall"]
    for i, loc in enumerate(maria_locs):
        rule = major_rules[i % len(major_rules)] if i < 2 else minor_rules[i % len(minor_rules)]
        coords = get_coordinates(loc)
        days_ago = 1 + (i * 0.8)
        ts = now - timedelta(days=days_ago, hours=2)
        v = Violation.objects.create(
            student=maria,
            rule=rule,
            officer=random.choice(officers),
            location=loc,
            location_name=loc,
            latitude=coords['lat'],
            longitude=coords['lng'],
            description=f"Fresh active infraction: {rule.rule_code} at {loc}.",
            status="OPEN"
        )
        Violation.objects.filter(id=v.id).update(timestamp=ts, updated_at=ts)
        created_count += 1

    # ──────────────────────────────────────────────────────────────────────────
    # STUDENT 2: Juan Dela Cruz — "Reformed / Decayed Violator"
    # Exactly 4 violations (IDENTICAL COUNT TO MARIA!), but 85–110 days ago, all CLOSED
    # Expected: Count = 4 | Risk Score = ~2 (LOW RISK / Good Standing / Cleared)
    # ──────────────────────────────────────────────────────────────────────────
    juan_locs = ["ICTC Building", "ICTC Building", "Severino de las Alas Hall", "ICTC Building"]
    for i, loc in enumerate(juan_locs):
        rule = major_rules[i % len(major_rules)] if i < 2 else minor_rules[i % len(minor_rules)]
        coords = get_coordinates(loc)
        days_ago = 85 + (i * 8)
        ts = now - timedelta(days=days_ago, hours=3)
        v = Violation.objects.create(
            student=juan,
            rule=rule,
            officer=random.choice(officers),
            location=loc,
            location_name=loc,
            latitude=coords['lat'],
            longitude=coords['lng'],
            description=f"Past semester resolved infraction: {rule.rule_code} at {loc}.",
            status="CLOSED"
        )
        Violation.objects.filter(id=v.id).update(timestamp=ts, updated_at=ts)
        created_count += 1

    # ──────────────────────────────────────────────────────────────────────────
    # STUDENT 3: Timothy De Castro — "The Current User"
    # 2 violations: 1 Minor 2 days ago (OPEN) + 1 Minor 12 days ago (AWAITING_DECISION)
    # Expected: Count = 2 | Risk Score = ~32 (MODERATE RISK)
    # ──────────────────────────────────────────────────────────────────────────
    timothy_configs = [
        ("Paulo Campos Hall", minor_rules[0], 2, "OPEN"),
        ("Julian Felipe Hall", minor_rules[1] if len(minor_rules) > 1 else minor_rules[0], 12, "AWAITING_DECISION")
    ]
    for loc, rule, days_ago, st in timothy_configs:
        coords = get_coordinates(loc)
        ts = now - timedelta(days=days_ago, hours=1)
        v = Violation.objects.create(
            student=timothy,
            rule=rule,
            officer=random.choice(officers),
            location=loc,
            location_name=loc,
            latitude=coords['lat'],
            longitude=coords['lng'],
            description=f"Student account test violation: {rule.rule_code} at {loc}.",
            status=st
        )
        Violation.objects.filter(id=v.id).update(timestamp=ts, updated_at=ts)
        created_count += 1

    print("[2/3] Seeding Curated Building Comparison Scenarios...")

    # ──────────────────────────────────────────────────────────────────────────
    # BUILDING A: Julian Felipe Hall — "The Recent Acute Hotspot"
    # 12 violations, ALL within the past 1–3 days
    # Expected:
    #   - All-Time Rank: Moderate volume (14 total with students)
    #   - Recent (Decayed) Rank: #1 CRITICAL HOTSPOT (~90+ score)
    # ──────────────────────────────────────────────────────────────────────────
    jfh_coords = get_coordinates("Julian Felipe Hall")
    for i in range(11):
        rule = random.choice(major_rules if i % 2 == 0 else minor_rules)
        student = random.choice(other_students)
        days_ago = random.uniform(0.2, 2.8)
        ts = now - timedelta(days=days_ago, hours=random.randint(0, 12))
        v = Violation.objects.create(
            student=student,
            rule=rule,
            officer=random.choice(officers),
            location="Julian Felipe Hall",
            location_name="Julian Felipe Hall",
            latitude=jfh_coords['lat'],
            longitude=jfh_coords['lng'],
            description=f"Recent hotspot incident: {rule.rule_code} at Julian Felipe Hall.",
            status=random.choice(["OPEN", "OPEN", "AWAITING_DECISION", "DECISION_RENDERED"])
        )
        Violation.objects.filter(id=v.id).update(timestamp=ts, updated_at=ts)
        created_count += 1

    # ──────────────────────────────────────────────────────────────────────────
    # BUILDING B: ICTC Building — "The Historical Cold Giant"
    # 24 violations, ALL between 75 and 115 days ago (old semester)
    # Expected:
    #   - All-Time Rank: #1 BY FAR (27 total count!)
    #   - Recent (Decayed) Rank: DROPS TO LOW RISK (~4–8 score!)
    # ──────────────────────────────────────────────────────────────────────────
    ictc_coords = get_coordinates("ICTC Building")
    for i in range(24):
        rule = random.choice(major_rules if i % 3 == 0 else minor_rules)
        student = random.choice(other_students)
        days_ago = random.uniform(75, 115)
        ts = now - timedelta(days=days_ago, hours=random.randint(0, 12))
        v = Violation.objects.create(
            student=student,
            rule=rule,
            officer=random.choice(officers),
            location="ICTC Building",
            location_name="ICTC Building",
            latitude=ictc_coords['lat'],
            longitude=ictc_coords['lng'],
            description=f"Old archived incident: {rule.rule_code} at ICTC Building.",
            status="CLOSED"
        )
        Violation.objects.filter(id=v.id).update(timestamp=ts, updated_at=ts)
        created_count += 1

    # ──────────────────────────────────────────────────────────────────────────
    # BUILDING C: Paulo Campos Hall — "Steady Persistent Hotspot"
    # 14 violations: 7 old (60–90 days ago) + 7 brand new (past 2–4 days)
    # Expected: High in Both All-Time AND Recent
    # ──────────────────────────────────────────────────────────────────────────
    pch_coords = get_coordinates("Paulo Campos Hall")
    for i in range(12):
        rule = random.choice(all_rules)
        student = random.choice(other_students)
        is_recent = (i % 2 == 0)
        days_ago = random.uniform(1, 4) if is_recent else random.uniform(60, 90)
        ts = now - timedelta(days=days_ago, hours=random.randint(0, 12))
        v = Violation.objects.create(
            student=student,
            rule=rule,
            officer=random.choice(officers),
            location="Paulo Campos Hall",
            location_name="Paulo Campos Hall",
            latitude=pch_coords['lat'],
            longitude=pch_coords['lng'],
            description=f"Persistent pattern: {rule.rule_code} at Paulo Campos Hall.",
            status="OPEN" if is_recent else "CLOSED"
        )
        Violation.objects.filter(id=v.id).update(timestamp=ts, updated_at=ts)
        created_count += 1

    # ──────────────────────────────────────────────────────────────────────────
    # BUILDING D: Magdalo Gate — "Moderate Emerging Gate Hotspot"
    # 7 violations in the last 4 to 9 days
    # ──────────────────────────────────────────────────────────────────────────
    mg_coords = get_coordinates("Magdalo Gate")
    for i in range(7):
        rule = random.choice(minor_rules)
        student = random.choice(other_students)
        days_ago = random.uniform(4, 9)
        ts = now - timedelta(days=days_ago, hours=random.randint(0, 12))
        v = Violation.objects.create(
            student=student,
            rule=rule,
            officer=random.choice(officers),
            location="Magdalo Gate",
            location_name="Magdalo Gate",
            latitude=mg_coords['lat'],
            longitude=mg_coords['lng'],
            description=f"Entry compliance issue: {rule.rule_code} at Magdalo Gate.",
            status=random.choice(["OPEN", "DECISION_RENDERED", "CLOSED"])
        )
        Violation.objects.filter(id=v.id).update(timestamp=ts, updated_at=ts)
        created_count += 1

    print("[3/3] Seeding Realistic Ambient Campus Violations...")
    ambient_buildings = [
        ("University Food Square", 8),
        ("Aklatang Emilio Aguinaldo", 7),
        ("Severino de las Alas Hall", 6),
        ("Mariano Alvarez Hall", 6),
        ("GMH Quadrangle", 5),
        ("Felipe Calderon Hall", 5),
        ("University Clinic", 4),
        ("Rizal Library", 4),
        ("Vito Belarmino Hall", 4),
        ("Ladies Dormitory Complex", 3),
        ("Gate 3", 3),
        ("Botanical Garden Park", 2),
        ("DLSU-D Grandstand", 2),
        ("Santiago Alvarez Hall", 2),
        ("CTH Building A", 2),
    ]

    for bldg_name, count in ambient_buildings:
        if bldg_name not in DLSUD_LOCATIONS:
            continue
        coords = get_coordinates(bldg_name)
        for _ in range(count):
            rule = random.choice(all_rules)
            student = random.choice(other_students)
            # Ambient violations distributed over past 90 days
            days_ago = random.uniform(2, 90)
            ts = now - timedelta(days=days_ago, hours=random.randint(0, 23))
            v = Violation.objects.create(
                student=student,
                rule=rule,
                officer=random.choice(officers),
                location=bldg_name,
                location_name=bldg_name,
                latitude=coords['lat'],
                longitude=coords['lng'],
                description=f"Campus report: {rule.rule_code} at {bldg_name}.",
                status=random.choice(["OPEN", "AWAITING_DECISION", "DECISION_RENDERED", "CLOSED", "DISMISSED"])
            )
            Violation.objects.filter(id=v.id).update(timestamp=ts, updated_at=ts)
            created_count += 1

    print(f"\n[SUCCESS] Seeded {created_count} violations designed for Temporal Decay testing.")
    print("=" * 65)
    print("[BENCHMARK SUMMARY] RESULTS FOR TESTING TEMPORAL DECAY:")
    print("=" * 65)
    print(f"1. Maria Clara ({maria.user.email}):")
    print(f"   - Violations: 4 (All from last 2-4 days, OPEN)")
    print(f"   - Expected: CRITICAL RISK / High Warning")
    print(f"2. Juan Dela Cruz ({juan.user.email}):")
    print(f"   - Violations: 4 (SAME COUNT AS MARIA! All 85-110 days ago, CLOSED)")
    print(f"   - Expected: LOW RISK / Good Standing / Cleared")
    print(f"3. Timothy De Castro ({timothy.user.email}):")
    print(f"   - Violations: 2 (1 fresh 2d ago + 1 12d ago)")
    print(f"   - Expected: MODERATE RISK")
    print("-" * 65)
    print("[CAMPUS HOTSPOTS]")
    print("   - Julian Felipe Hall: ~14 count (All from past 1-3 days) -> #1 RECENT CRITICAL HOTSPOT")
    print("   - ICTC Building:      ~27 count (All 75-115 days ago)    -> #1 ALL-TIME VOLUME, drops to LOW on Recent")
    print("   - Paulo Campos Hall:  ~15 count (Mixed fresh + old)      -> Consistent High in both modes")
    print("=" * 65)

if __name__ == '__main__':
    seed_temporal_data()
