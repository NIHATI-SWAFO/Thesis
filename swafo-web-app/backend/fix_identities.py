
import os
import django
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import StudentProfile
from django.contrib.auth import get_user_model

User = get_user_model()

def fix_names():
    first_names = ["Timothy", "Bianca", "Ruel", "Angelica", "Miguel", "Sofia", "Gabriel", "Isabella", "Nathaniel", "Chloe"]
    last_names = ["De Castro", "Reyes", "Elias", "Santos", "Cruz", "Bautista", "Garcia", "Mendoza", "Villanueva", "Lim"]
    
    students = StudentProfile.objects.all()
    print(f"👤 Found {students.count()} students. Injecting identities...")
    
    used_names = set()
    
    for student in students:
        user = student.user
        
        # Pick a random name that hasn't been used yet if possible
        name_combo = (random.choice(first_names), random.choice(last_names))
        while name_combo in used_names and len(used_names) < 50:
            name_combo = (random.choice(first_names), random.choice(last_names))
        
        used_names.add(name_combo)
        
        user.first_name = name_combo[0]
        user.last_name = name_combo[1]
        user.save()
        print(f"✅ Updated: {user.username} -> {user.first_name} {user.last_name}")

if __name__ == "__main__":
    fix_names()
