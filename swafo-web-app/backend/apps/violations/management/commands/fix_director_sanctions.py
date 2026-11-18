"""
fix_director_sanctions: replaces the engine placeholder "FOR SWAFO DIRECTOR DECISION ..."
with a real Director sanction on cases that are already decided or closed.

SAFE BY DESIGN
  * Dry run by default. Nothing is saved unless --apply is passed.
  * Runs inside one transaction.
  * Only touches director_sanction on DECISION_RENDERED or CLOSED cases whose
    sanction is the placeholder. Nothing else is changed.

USAGE
  python manage.py fix_director_sanctions            # dry run
  python manage.py fix_director_sanctions --apply    # save
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.violations.models import Violation

PLACEHOLDER_PREFIX = 'FOR SWAFO DIRECTOR DECISION'
# Same wording as the Director's decision dropdown in Case Management
DIRECTOR_SANCTION = 'Sanction 2: Disciplinary Probation (1 Semester)'


class Command(BaseCommand):
    help = 'Replaces placeholder sanctions on decided/closed cases (dry run unless --apply).'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Save the changes.')

    def handle(self, *args, **opts):
        with transaction.atomic():
            qs = Violation.objects.filter(
                status__in=['DECISION_RENDERED', 'CLOSED'],
                director_sanction__istartswith=PLACEHOLDER_PREFIX,
            )
            count = qs.count()
            ids = list(qs.values_list('id', flat=True))
            qs.update(director_sanction=DIRECTOR_SANCTION)

            remaining = Violation.objects.filter(director_sanction__istartswith=PLACEHOLDER_PREFIX,
                                                 status__in=['DECISION_RENDERED', 'CLOSED']).count()
            self.stdout.write(f'Cases with a placeholder sanction: {count}')
            self.stdout.write(f'New sanction: {DIRECTOR_SANCTION}')
            self.stdout.write(f'Case IDs: {", ".join(map(str, ids)) or "none"}')
            self.stdout.write(f'Placeholders left after fix: {remaining}')
            if not opts['apply']:
                transaction.set_rollback(True)

        if opts['apply']:
            self.stdout.write(self.style.SUCCESS('APPLIED. Changes saved.'))
        else:
            self.stdout.write(self.style.WARNING('DRY RUN. Nothing was saved. Re-run with --apply to save.'))
