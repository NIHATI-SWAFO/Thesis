import os
import django
import random

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile

User = get_user_model()

COLLEGES = [
    "College of Business Administration and Accountancy",
    "College of Criminal Justice Education",
    "College of Education",
    "College of Engineering, Architecture and Technology",
    "College of Information and Computer Studies",
    "College of Liberal Arts and Communication",
    "College of Science",
    "College of Tourism and Hospitality Management"
]

def seed_students(n=50):
    print("Clearing existing students (excluding authoritative accounts)...")
    # Don't delete authoritative accounts if they exist
    StudentProfile.objects.exclude(user__email="dtl0396@dlsud.edu.ph").delete()
    User.objects.filter(role='STUDENT').exclude(email="dtl0396@dlsud.edu.ph").delete()
    
    # --- 1. Create Authoritative Account (The User) ---
    print("Ensuring Authoritative Account (Timothy De Castro)...")
    me_user, created = User.objects.get_or_create(
        username="dtl0396@dlsud.edu.ph",
        email="dtl0396@dlsud.edu.ph",
        defaults={
            'full_name': "Timothy De Castro",
            'role': User.Role.STUDENT
        }
    )
    
    StudentProfile.objects.get_or_create(
        user=me_user,
        defaults={
            'student_number': "202330395",
            'course': "College of Information and Computer Studies",
            'year_level': 3,
            'barcode_value': "BARCODE-202330395"
        }
    )

    print(f"Seeding {n} additional random students...")
    
    for i in range(n):
        student_id = f"202{random.randint(100000, 999999)}"
        email = f"student_{student_id}@dlsud.edu.ph"
        
        full_names = [
            "Juan Dela Cruz", "Maria Clara", "Jose Rizal", "Andres Bonifacio", 
            "Emilio Aguinaldo", "Gabriela Silang", "Melchora Aquino", "Antonio Luna",
            "Miguel Malvar", "Apolinario Mabini", "Gregorio del Pilar", "Marcelo del Pilar",
            "Nica Desacola", "Rhine Castro", "Estelle Nica", "Dalisay Cardo"
        ]
        
        user = User.objects.create(
            username=email,
            email=email,
            full_name=random.choice(full_names) + f" {random.randint(1, 99)}",
            role=User.Role.STUDENT
        )
        
        college = random.choice(COLLEGES)
        
        StudentProfile.objects.create(
            user=user,
            student_number=student_id,
            course=college,
            year_level=random.randint(1, 4),
            barcode_value=f"BARCODE-{student_id}"
        )

    print(f"Successfully seeded. Total students: {StudentProfile.objects.count()}")

if __name__ == "__main__":
    seed_students()
