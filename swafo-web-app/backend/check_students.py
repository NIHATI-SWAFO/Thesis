import os
import django
import sys

sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.violations.models import Violation

def check_students():
    for name in ['Chloe', 'Gabriel']:
        print(f"--- Checking {name} ---")
        vs = Violation.objects.filter(student__user__first_name__icontains=name)
        print(f"Count: {vs.count()}")
        for v in vs:
            print(f"ID: {v.id}, Student: {v.student.user.full_name}, Status: {v.status}, Summary: {v.case_summary}")

if __name__ == "__main__":
    check_students()
