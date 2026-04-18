import os
import django
import random

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

OFFICER_NAMES = [
    "Officer Timothy De Guzman",
    "Officer Maria Santos",
    "Officer Ricardo Reyes",
    "Officer Elena Garcia",
    "Officer Julian Cruz",
    "Officer Sofia Villanueva",
    "Officer Mateo Ramos",
    "Officer Isabella Luna",
    "Officer Gabriel Castro",
    "Officer Beatrice Mendoza"
]

def seed_officers():
    print("Seeding 10 SWAFO Officer accounts...")
    
    password = "SwafoOfficer2026"
    
    for i, name in enumerate(OFFICER_NAMES):
        email = f"officer{i+1}@dlsud.edu.ph"
        
        if User.objects.filter(email=email).exists():
            print(f"Skipping {email} (Already exists)")
            continue
            
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            full_name=name,
            role=User.Role.OFFICER
        )
        print(f"Created: {name} ({email})")

    print("\nSuccessfully seeded officers!")
    print(f"Default Password for all: {password}")

if __name__ == "__main__":
    seed_officers()
