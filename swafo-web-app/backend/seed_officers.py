import os
import django
import random

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

ALL_OFFICERS = [
    # Designated Patrol Officers
    ("Erica Aclag", "erica.aclag@dlsud.edu.ph"),
    ("Rex Ceballos", "rex.ceballos@dlsud.edu.ph"),
    ("Juan Miguel Diamante", "juanmiguel.diamante@dlsud.edu.ph"),
    ("Ervin Doroteo", "ervin.doroteo@dlsud.edu.ph"),
    ("Michael Nicart", "michael.nicart@dlsud.edu.ph"),
    ("Mhycel Omaña", "mhycel.omana@dlsud.edu.ph"),
    ("Loren Peñano", "loren.penano@dlsud.edu.ph"),
    ("Rainger Dela Cruz", "rainger.delacruz@dlsud.edu.ph"),
    # Staff Officers
    ("Officer Timothy", "officer@dlsud.edu.ph"),
    ("Officer Timothy De Guzman", "officer1@dlsud.edu.ph"),
    ("Officer Maria Santos", "officer2@dlsud.edu.ph"),
    ("Officer Ricardo Reyes", "officer3@dlsud.edu.ph"),
    ("Officer Elena Garcia", "officer4@dlsud.edu.ph"),
    ("Officer Julian Cruz", "officer5@dlsud.edu.ph"),
    ("Officer Sofia Villanueva", "officer6@dlsud.edu.ph"),
    ("Officer Mateo Ramos", "officer7@dlsud.edu.ph"),
    ("Officer Isabella Luna", "officer8@dlsud.edu.ph"),
    ("Officer Gabriel Castro", "officer9@dlsud.edu.ph"),
    ("Officer Beatrice Mendoza", "officer10@dlsud.edu.ph"),
]

def seed_officers():
    print("Seeding SWAFO Officer accounts...")
    
    password = "password123"
    
    for name, email in ALL_OFFICERS:
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'full_name': name,
                'role': User.Role.OFFICER,
                'is_active': True,
            }
        )
        user.role = User.Role.OFFICER
        user.full_name = name
        user.is_active = True
        user.set_password(password)
        user.save()
        action = "Created" if created else "Updated"
        print(f"{action}: {name} ({email})")

    print("\nSuccessfully seeded officers!")
    print(f"Default Password for all: {password}")

if __name__ == "__main__":
    seed_officers()
