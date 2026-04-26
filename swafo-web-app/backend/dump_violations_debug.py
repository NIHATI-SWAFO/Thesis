import os
import django
import json
import sys
from datetime import datetime

sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.violations.models import Violation
from apps.users.models import StudentProfile

def dump_data():
    violations = Violation.objects.all().select_related('student', 'student__user', 'rule')
    data = []
    for v in violations:
        data.append({
            "id": v.id,
            "student": v.student.user.full_name,
            "student_no": v.student.student_number,
            "rule": v.rule.rule_code,
            "category": v.rule.category,
            "status": v.status,
            "requires_director": "FOR SWAFO DIRECTOR DECISION" in str(v.case_summary or v.description) # Proxy check
        })
    
    print(json.dumps(data, indent=2))

if __name__ == "__main__":
    dump_data()
