import os
import django
import random
from datetime import datetime, timezone

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import StudentProfile
from apps.handbook.models import HandbookEntry
from apps.violations.models import Violation
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, time

def seed_violations():
    print("🗑️  Cleaning existing violation data for fresh demonstration...")
    Violation.objects.all().delete()
    
    students = list(StudentProfile.objects.all())
    rules = list(HandbookEntry.objects.all())
    User = get_user_model()
    officers = list(User.objects.filter(role=User.Role.OFFICER))
    director = User.objects.filter(role=User.Role.ADMIN).first()
    
    if len(students) < 5 or not rules or not officers:
        print("Error: Need more students, handbook rules, and officers seeded first.")
        return

    # 1. Seed Violations (30-day window)
    locations = ["Rotunda (St. La Salle Marker)", "JFH Building", "CICS Lobby", "West Parking", "Main Cafeteria", "Lumina Bridge", "Oval"]
    
    total_created = 0
    now = timezone.now()
    
    # Create 40-50 random violations spread over 30 days
    for _ in range(45):
        student = random.choice(students)
        rule = random.choice(rules)
        days_ago = random.randint(0, 30)
        target_date = now - timezone.timedelta(days=days_ago)
        
        status = random.choice(["CLOSED", "AWAITING_DECISION", "OPEN", "DECISION_RENDERED"])
        v = Violation.objects.create(
            student=student,
            rule=rule,
            officer=random.choice(officers),
            location=random.choice(locations),
            description=f"Institutional record for {rule.rule_code}.",
            status=status
        )
        # Backdate
        Violation.objects.filter(id=v.id).update(
            timestamp=target_date,
            updated_at=target_date + timezone.timedelta(hours=random.randint(1, 4))
        )
        total_created += 1

    # 2. Inject Specific Behavioral Patterns (for Apriori detection)
    # Pattern: Loitering (Minor) -> Proper Uniform (Minor)
    loitering_rule = HandbookEntry.objects.filter(rule_code__icontains="27.1").first()
    uniform_rule = HandbookEntry.objects.filter(rule_code__icontains="27.1").last()
    
    if loitering_rule and uniform_rule:
        print("🧬 Injecting behavioral patterns for Apriori logic...")
        for i in range(5): # 5 students following this pattern
            student = students[i % len(students)]
            # First Loitering
            v1 = Violation.objects.create(
                student=student, rule=loitering_rule, officer=random.choice(officers),
                location="Oval", status="CLOSED", description="Sequence Part A"
            )
            # Then Uniform (2 days later)
            v2 = Violation.objects.create(
                student=student, rule=uniform_rule, officer=random.choice(officers),
                location="CICS Lobby", status="CLOSED", description="Sequence Part B"
            )
            Violation.objects.filter(id=v1.id).update(timestamp=now - timezone.timedelta(days=10))
            Violation.objects.filter(id=v2.id).update(timestamp=now - timezone.timedelta(days=8))
            total_created += 2

    print(f"✅ Successfully seeded {total_created} violations with behavioral patterns.")


    print(f"✅ Successfully seeded {total_created} violations and updated student oversight data.")

if __name__ == "__main__":
    seed_violations()
