import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, StudentProfile
from apps.handbook.models import HandbookEntry
from apps.violations.models import Violation
from django.utils import timezone

def seed_data():
    print("Seeding initialization starting...")

    # 1. Create Admin & Officer
    admin_user, _ = User.objects.get_or_create(
        email='admin@dlsud.edu.ph',
        defaults={
            'username': 'admin_swafo',
            'full_name': 'System Administrator',
            'role': User.Role.ADMIN,
            'is_staff': True,
            'is_superuser': True
        }
    )
    admin_user.set_password('admin123')
    admin_user.save()

    officer_user, _ = User.objects.get_or_create(
        email='officer@dlsud.edu.ph',
        defaults={
            'username': 'officer_tim',
            'full_name': 'Timothy Officer',
            'role': User.Role.OFFICER,
            'is_staff': True
        }
    )
    officer_user.set_password('officer123')
    officer_user.save()

    # 2. Create Handbook Rules
    rules_data = [
        {
            'category': 'Dress Code',
            'rule_code': 'DC-01',
            'description': 'Improper uniform or attire within campus premises.',
            'p1': 'Warning', 'p2': 'Parental Consultation', 'p3': 'SDAO Referral'
        },
        {
            'category': 'ID Compliance',
            'rule_code': 'ID-01',
            'description': 'Failure to wear or display official student ID.',
            'p1': 'Warning', 'p2': '1-day Suspension', 'p3': 'Disciplinary Action'
        },
        {
            'category': 'Grooming',
            'rule_code': 'GR-01',
            'description': 'Haircut or hair color policy violation.',
            'p1': 'Warning / Correct to Natural', 'p2': 'Counseling', 'p3': 'SDAO Referral'
        }
    ]

    for r in rules_data:
        HandbookEntry.objects.get_or_create(
            rule_code=r['rule_code'],
            defaults={
                'category': r['category'],
                'description': r['description'],
                'penalty_1st': r['p1'],
                'penalty_2nd': r['p2'],
                'penalty_3rd': r['p3']
            }
        )

    # 3. Create Demo Students (9-digit IDs)
    students_data = [
        {'id': '202330396', 'name': 'Miguel De Castro', 'course': 'BS Computer Science'},
        {'id': '202210542', 'name': 'Shane Gomez', 'course': 'BS Information Technology'},
        {'id': '202111289', 'name': 'Mark Anthony', 'course': 'BS Architecture'},
        {'id': '202340123', 'name': 'Sarah Jane', 'course': 'AB Communication'},
        {'id': '202410001', 'name': 'First Year Demo', 'course': 'BS Engineering'}
    ]

    for s in students_data:
        user, _ = User.objects.get_or_create(
            email=f"{s['id']}@dlsud.edu.ph",
            defaults={
                'username': s['id'],
                'full_name': s['name'],
                'role': User.Role.STUDENT
            }
        )
        StudentProfile.objects.get_or_create(
            user=user,
            defaults={
                'student_number': s['id'],
                'course': s['course'],
                'year_level': int(s['id'][:4]) - 2020 # Dummy year logic
            }
        )

    print("Success: 5 Demo Students and 3 Handbook Rules have been seeded.")

if __name__ == '__main__':
    seed_data()
