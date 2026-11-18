"""
sync_clearance_from_handbook: reset every student's saved clearance to what the
handbook rules say about their violations, removing manual HOLDs and Director
overrides (for example, ones left over from testing).

  * Handbook says HOLD                  -> clearance_status HOLD
  * Handbook says CLEARED / CONDITIONAL / RESTRICTED -> clearance_status CLEARED
    (CONDITIONAL and RESTRICTED are calculated from violations, never stored)
  * clearance_override is cleared for everyone

Only clearance_status and clearance_override change. Violations, honors, GMC and
the heatmap are untouched.

SAFE BY DESIGN
  * Dry run by default. Nothing is saved unless --apply is passed.
  * Runs inside one transaction.

USAGE
  python manage.py sync_clearance_from_handbook
  python manage.py sync_clearance_from_handbook --apply
"""
from collections import Counter

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.users.models import StudentProfile
from apps.users.serializers import StudentProfileSerializer


class Command(BaseCommand):
    help = "Reset every student's clearance to the handbook result (removes manual HOLDs and overrides)."

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help="Save the changes (default is a dry run)")

    def handle(self, *args, **opts):
        apply = opts['apply']
        changes = []
        handbook_counts = Counter()

        for s in StudentProfile.objects.select_related('user').order_by('id'):
            handbook = StudentProfileSerializer(s).data['risk_standing']['handbook_clearance']
            handbook_counts[handbook] += 1
            status = 'HOLD' if handbook == 'HOLD' else 'CLEARED'
            if s.clearance_status != status or s.clearance_override:
                changes.append((s, status, handbook))

        self.stdout.write(f"== {'APPLY' if apply else 'DRY RUN (nothing saved)'}")
        self.stdout.write(f"Students: {sum(handbook_counts.values())} | handbook clearance: {dict(handbook_counts)}")
        self.stdout.write(f"To change: {len(changes)}")
        for s, status, handbook in changes:
            self.stdout.write(
                f"  {s.user.full_name} #{s.student_number}: "
                f"{s.clearance_status}{' +override' if s.clearance_override else ''} -> {status} (handbook {handbook})"
            )

        if not apply:
            self.stdout.write("Dry run only. Re-run with --apply to save.")
            return

        with transaction.atomic():
            for s, status, _ in changes:
                s.clearance_status = status
                s.clearance_override = False
                s.save(update_fields=['clearance_status', 'clearance_override'])

        self.stdout.write(self.style.SUCCESS(f"Done. {len(changes)} student(s) reset to the handbook clearance."))
