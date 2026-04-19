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
    from django.contrib.auth import get_user_model
    User = get_user_model()
    officers = list(User.objects.filter(role=User.Role.OFFICER))
    
    if not students or not rules or not officers:
        print("Error: Need students, handbook rules, and officers seeded first.")
        return

    # --- 1. ALWAYS give violations to the Authoritative Account (Timothy De Castro) ---
    me_student = StudentProfile.objects.filter(user__email="dtl0396@dlsud.edu.ph").first()
    if me_student:
        print(f"Assigning Authoritative Violations to: {me_student.user.full_name}")
        for i in range(3):
            rule = random.choice(rules)
            Violation.objects.create(
                student=me_student,
                rule=rule,
                officer=random.choice(officers),
                location="CICS Lobby",
                description=f"Demonstration incident log for handbook section {rule.rule_code}.",
                corrective_action=None,
                status="OPEN" if i == 0 else "RESOLVED",
            )

    # --- 2. Pick 10 random students to have violations ---
    target_students = random.sample(students, 10)
    
    for student in target_students:
        if student.user.email == "dtl0396@dlsud.edu.ph": continue # Skip if already handled above
        # Give each student 1-4 violations
        num_v = random.randint(1, 4)
        for i in range(num_v):
            rule = random.choice(rules)
            
            # 50% chance of being today for the first violation to show in dashboard
            if i == 0 and random.random() > 0.5:
                timestamp = datetime.now()
            else:
                days_ago = random.randint(1, 30)
                timestamp = datetime.now() - timedelta(days=days_ago)
            
            Violation.objects.create(
                student=student,
                rule=rule,
                officer=random.choice(officers),
                location=random.choice(["JFH Building", "CICS Lobby", "Main Gate", "West Campus", "Grandstand", "SWAO Office"]),
                description=f"Automated incident log for handbook section {rule.rule_code}.",
                corrective_action=None,
                status="RESOLVED" if random.random() > 0.3 else "OPEN",
            )
            # Note: We don't manually set timestamp here because auto_now_add=True handles it,
            # but if you want custom dates for demo, the model needs to be modified or 
            # objects.filter().update() used after creation.

    print(f"Successfully seeded violations for {len(target_students)} students.")

if __name__ == "__main__":
    seed_violations()
