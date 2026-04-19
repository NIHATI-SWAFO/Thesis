import os
import django
import random
from django.utils import timezone
from datetime import timedelta, datetime, time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.patrols.models import PatrolSession
from apps.users.models import User

def seed_patrols():
    print("🗑️  Cleaning existing patrol data for fresh synchronization...")
    PatrolSession.objects.all().delete()
    
    officers = list(User.objects.filter(role='OFFICER'))
    if len(officers) < 3:
        print("Error: Need more officers seeded first.")
        return

    # 1. CREATE 4 ACTIVE PATROL SESSIONS (Matching UI Mockup)
    # Timothy De Castro (Senior Officer)
    timothy = User.objects.filter(email__icontains="dtl0396").first() or officers[0]
    harlene = officers[1]
    boy = officers[2]
    extra = random.choice(officers)

    active_sessions = [
        { "officer": timothy, "loc": "JFH Building - 1st Floor to 2nd Floor", "start": timezone.now() - timedelta(minutes=42) },
        { "officer": harlene, "loc": "East Campus Rotunda", "start": timezone.now() - timedelta(hours=1, minutes=12) },
        { "officer": boy, "loc": "Grandstand & Oval", "start": timezone.now() - timedelta(minutes=15) },
        { "officer": extra, "loc": "West Campus Cafeteria", "start": timezone.now() - timedelta(hours=2) },
    ]

    for s in active_sessions:
        PatrolSession.objects.create(
            officer=s['officer'],
            location=s['loc'],
            start_time=s['start'],
            status='ACTIVE', # Some models might not have status, but analytics uses end_time__isnull
            photos_count=random.randint(2, 5),
            checkpoints_data=[]
        )
    
    print("✅ Seeded 4 Active Patrol Sessions.")

    # 2. CREATE 1 COMPLETED SESSION TODAY
    completed_today = PatrolSession.objects.create(
        officer=harlene,
        location="JFH Kubo",
        start_time=timezone.now() - timedelta(hours=5),
        end_time=timezone.now() - timedelta(hours=1),
        status='COMPLETED',
        photos_count=12,
        checkpoints_data=[]
    )
    print("✅ Seeded 1 Completed Session for Today.")

    # 3. CREATE HISTORICAL DATA TO ACHIEVE 3.5h AVERAGE
    # We need some long patrols to bring the average up to 3.5h
    for i in range(5):
        start = timezone.now() - timedelta(days=random.randint(1, 5), hours=random.randint(8, 17))
        # 210 minutes = 3.5 hours
        end = start + timedelta(minutes=210 + random.randint(-15, 15))
        PatrolSession.objects.create(
            officer=random.choice(officers),
            location=random.choice(["Magdalo Gate", "ICTC Building", "Oval"]),
            start_time=start,
            end_time=end,
            status='COMPLETED',
            photos_count=random.randint(5, 20),
            checkpoints_data=[]
        )

    print(f"📊 Patrol metrics aligned: 4 Active, 1 Completed Today, ~3.5h Avg Duration.")

if __name__ == '__main__':
    seed_patrols()
