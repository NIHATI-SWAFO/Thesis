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

def seed_violations():
    print("Seeding sample violations for history demonstration...")
    
    students = list(StudentProfile.objects.all())
    rules = list(HandbookEntry.objects.all())
    
    if not students or not rules:
        print("Error: Need students and handbook rules seeded first.")
        return

    # Pick 10 random students to have violations
    target_students = random.sample(students, 10)
    
    for student in target_students:
        # Give each student 1-3 violations
        num_v = random.randint(1, 4)
        for i in range(num_v):
            rule = random.choice(rules)
            
            # Generate a date in the past 30 days
            days_ago = random.randint(1, 30)
            timestamp = datetime.now() - timedelta(days=days_ago)
            
            Violation.objects.create(
                student=student,
                rule=rule,
                location=random.choice(["JFH Building", "CICS Lobby", "Main Gate", "West Campus"]),
                description=f"Sample recorded violation for {rule.rule_code}. (Seeded for demo)",
                corrective_action="Written Warning" if i == 0 else "First Minor Offense on Record",
                status="CLOSED" if random.random() > 0.3 else "OPEN",
                timestamp=timestamp
            )

    print(f"Successfully seeded violations for {len(target_students)} students.")

if __name__ == "__main__":
    seed_violations()
