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
    print("Clearing existing students for a fresh start...")
    StudentProfile.objects.all().delete()
    User.objects.filter(role='STUDENT').delete()
    
    print(f"Seeding {n} students with official DLSU-D Colleges...")
    
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
