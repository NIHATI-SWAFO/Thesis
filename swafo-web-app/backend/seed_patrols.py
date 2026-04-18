import os
import django
import random
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.patrols.models import PatrolSession
from apps.users.models import User

def seed_patrols():
    officer = User.objects.filter(role='OFFICER').first()
    if not officer:
        print("No officer found to assign patrols to.")
        return

    locations = ['ICTC Building', 'Food Square', 'GMH Building', 'JFH Building', 'West Gate', 'Library']
    
    for i in range(15):
        loc = random.choice(locations)
        days_ago = random.randint(0, 30)
        start = timezone.now() - timedelta(days=days_ago, hours=random.randint(1, 23))
        end = start + timedelta(minutes=random.randint(30, 90))
        
        PatrolSession.objects.create(
            officer=officer,
            location=loc,
            start_time=start,
            end_time=end,
            status='COMPLETED',
            photos_count=random.randint(2, 12),
            checkpoints_data=[
                {"name": "Entrance", "time": (start + timedelta(minutes=5)).strftime("%H:%M"), "status": "secure", "note": "All clear"},
                {"name": "Hallway", "time": (start + timedelta(minutes=15)).strftime("%H:%M"), "status": "secure", "note": "Lights on"},
                {"name": "Exit", "time": (start + timedelta(minutes=25)).strftime("%H:%M"), "status": "secure", "note": "Locked"}
            ]
        )
    print(f"Seeded 15 patrol sessions for {officer.full_name}")

if __name__ == '__main__':
    seed_patrols()
