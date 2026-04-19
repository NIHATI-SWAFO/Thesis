import os
import django
import random
from datetime import datetime, timedelta

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import StudentProfile
from apps.handbook.models import HandbookEntry
from apps.violations.models import Violation

from django.utils import timezone
from datetime import datetime, time

def seed_violations():
    print("🗑️  Cleaning existing violation data for fresh demonstration...")
    Violation.objects.all().delete()
    
    students = list(StudentProfile.objects.all())
    rules = list(HandbookEntry.objects.all())
    from django.contrib.auth import get_user_model
    User = get_user_model()
    officers = list(User.objects.filter(role=User.Role.OFFICER))
    
    if len(students) < 5 or not rules or not officers:
        print("Error: Need more students, handbook rules, and officers seeded first.")
        return

    # Dates: April 18, 19, 20 (Year 2026 based on system time)
    dates = [
        datetime(2026, 4, 18),
        datetime(2026, 4, 19),
        datetime(2026, 4, 20)
    ]

    locations = ["Rotunda (St. La Salle Marker)", "JFH Building", "CICS Lobby", "West Parking", "Main Cafeteria", "Lumina Bridge", "Oval"]
    
    total_created = 0
    for target_date in dates:
        print(f"📅 Seeding 5 violations for {target_date.date()}...")
        for i in range(5):
            student = random.choice(students)
            rule = random.choice(rules)
            
            # Create the violation
            v = Violation.objects.create(
                student=student,
                rule=rule,
                officer=random.choice(officers),
                location=random.choice(locations),
                description=f"Institutional record for {rule.rule_code} - Campus monitoring log.",
                status="RESOLVED" if random.random() > 0.3 else "PENDING"
            )
            
            # Backdate the timestamp (Bypassing auto_now_add)
            aware_datetime = timezone.make_aware(datetime.combine(target_date, time(random.randint(8, 17), random.randint(0, 59))))
            Violation.objects.filter(id=v.id).update(timestamp=aware_datetime)
            total_created += 1

    print(f"✅ Successfully seeded {total_created} violations across 3 target days.")

if __name__ == "__main__":
    seed_violations()
