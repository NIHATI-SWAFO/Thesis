import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.violations.models import Violation
from django.utils import timezone

print(f"Total Violations: {Violation.objects.count()}")
print(f"Statuses in DB: {set(Violation.objects.values_list('status', flat=True))}")
print(f"Violations Today: {Violation.objects.filter(timestamp__date=timezone.now().date()).count()}")
