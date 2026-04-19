import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.violations.models import Violation

violations = Violation.objects.all()[:15]
print("--- VIOLATION DATA DIAGNOSTIC ---")
for v in violations:
    rule_desc = v.rule.description if v.rule else "NONE"
    print(f"ID: {v.id}")
    print(f"  Officer Remarks (v.description): {v.description}")
    print(f"  Handbook Rule (v.rule.description): {rule_desc}")
    print("-" * 30)
