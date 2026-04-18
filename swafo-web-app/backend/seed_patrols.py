import os
import django
import random
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.patrols.models import PatrolSession
from apps.users.models import User

def seed_patrols(n=1500):
    officers = list(User.objects.filter(role='OFFICER'))
    if not officers:
        print("No officers found. Run seed_officers.py first.")
        return

    print(f"Clearing existing patrols and seeding {n} sessions across {len(officers)} officers...")
    PatrolSession.objects.all().delete()
    
    locations = ['ICTC Building', 'Food Square', 'GMH Building', 'JFH Building', 'West Gate', 'Library', 'CBAA Lobby', 'Oval']
    
    patrols = []
    for i in range(n):
        officer = random.choice(officers)
        loc = random.choice(locations)
        days_ago = random.randint(0, 120)
        start = timezone.now() - timedelta(days=days_ago, hours=random.randint(1, 23))
        duration_mins = random.randint(25, 65)
        end = start + timedelta(minutes=duration_mins)
        
        patrols.append(PatrolSession(
            officer=officer,
            location=loc,
            start_time=start,
            end_time=end,
            status='COMPLETED',
            photos_count=random.randint(4, 15),
            checkpoints_data=[]
        ))
    
    PatrolSession.objects.bulk_create(patrols)
    print(f"Successfully seeded {n} patrol sessions.")

if __name__ == '__main__':
    seed_patrols()
