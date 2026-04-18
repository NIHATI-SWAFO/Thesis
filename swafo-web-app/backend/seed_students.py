import os
import django
import random

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile

User = get_user_model()

COLLEGES = {
    "College of Business Administration and Accountancy": ["BS Accountancy", "BS Business Administration", "BS Entrepreneurship"],
    "College of Criminal Justice Education": ["BS Criminology"],
    "College of Education": ["Bachelor of Elementary Education", "Bachelor of Secondary Education"],
    "College of Engineering, Architecture and Technology": ["BS Civil Engineering", "BS Electrical Engineering", "BS Architecture"],
    "College of Information and Computer Studies": ["BS Computer Science", "BS Information Technology", "BS Entertainment & Multimedia Computing"],
    "College of Liberal Arts and Communication": ["AB Communication", "AB Psychology", "AB Political Science"],
    "College of Science": ["BS Biology", "BS Psychology", "BS Chemistry"],
    "College of Tourism and Hospitality Management": ["BS Tourism Management", "BS Hospitality Management"]
}

def seed_students(n=50):
    print(f"Seeding {n} students...")
    
    current_count = StudentProfile.objects.count()
    
    for i in range(n):
        student_id = f"202{random.randint(100000, 999999)}"
        email = f"student_{student_id}@dlsud.edu.ph"
        
        # Ensure unique email/id
        if User.objects.filter(email=email).exists():
            continue
            
        full_names = [
            "Juan Dela Cruz", "Maria Clara", "Jose Rizal", "Andres Bonifacio", 
            "Emilio Aguinaldo", "Gabriela Silang", "Melchora Aquino", "Antonio Luna",
            "Miguel Malvar", "Apolinario Mabini", "Gregorio del Pilar", "Marcelo del Pilar"
        ]
        
        user = User.objects.create(
            username=email,
            email=email,
            full_name=random.choice(full_names) + f" {i}",
            role=User.Role.STUDENT
        )
        
        college = random.choice(list(COLLEGES.keys()))
        course = random.choice(COLLEGES[college])
        
        StudentProfile.objects.create(
            user=user,
            student_number=student_id,
            course=course,
            year_level=random.randint(1, 4),
            barcode_value=f"BARCODE-{student_id}"
        )

    print(f"Successfully seeded. Total students: {StudentProfile.objects.count()}")

if __name__ == "__main__":
    seed_students()
