"""
reset_student_account: give one student account a clean slate, as if logging in
for the first time, without changing the heatmap or patrol data.

WHAT IT DOES
  * Moves each of the student's violations (with its appeals and the related
    notifications) to a different demo student (an account nobody has ever
    logged into, not a team account), fewest violations first.
    Only the `student` link changes, through QuerySet.update(), so location,
    coordinates, timestamp, rule, status and updated_at stay exactly the same.
    The heatmap, campus map, patrol risk scores and totals are unchanged.
  * Resets the account: no barcode, ID not confirmed (the registration prompt
    shows again), clearance CLEARED, risk score 0. The student number is kept.

SAFE BY DESIGN
  * Dry run by default. Nothing is saved unless --apply is passed.
  * Runs inside one transaction. Any error undoes everything.
  * Checks before committing that every violation's heatmap fields are
    unchanged and that the total violation count is the same.

USAGE
  python manage.py reset_student_account --email dtl0396@dlsud.edu.ph
  python manage.py reset_student_account --email dtl0396@dlsud.edu.ph --apply
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Count

from apps.users.models import Notification, StudentProfile
from apps.violations.models import Appeal, Violation

# Team demo accounts (same as repair_demo_data.TEAM_ROLES): never used as recipients
TEAM_STUDENT_NUMBERS = ('202330395', '202330485', '202180379')

HEATMAP_FIELDS = ('location', 'location_name', 'latitude', 'longitude', 'timestamp', 'rule_id', 'status')


class Command(BaseCommand):
    help = "Give a student account a clean slate (violations moved to demo students, barcode unlinked)."

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help="Email of the student account to reset")
        parser.add_argument('--apply', action='store_true', help="Save the changes (default is a dry run)")

    def handle(self, *args, **opts):
        email = opts['email'].strip()
        apply = opts['apply']

        try:
            target = StudentProfile.objects.select_related('user').get(user__email__iexact=email)
        except StudentProfile.DoesNotExist:
            raise CommandError(f"No student account with email {email}")

        violations = list(Violation.objects.filter(student=target).order_by('id'))

        # Demo students only: accounts nobody has ever logged into (no last_login),
        # not ID-confirmed, and not a team demo account. Fewest violations first;
        # each gets at most one moved case.
        recipients = list(
            StudentProfile.objects.exclude(id=target.id)
            .exclude(student_number__in=TEAM_STUDENT_NUMBERS)
            .filter(user__is_active=True, user__last_login__isnull=True, is_id_confirmed=False)
            .annotate(n=Count('violations'))
            .order_by('n', 'id')[:len(violations)]
        )
        if len(recipients) < len(violations):
            raise CommandError(
                f"Need {len(violations)} demo students, found {len(recipients)}. Nothing changed."
            )

        mode = "APPLY" if apply else "DRY RUN (nothing saved)"
        self.stdout.write(f"== {mode}")
        self.stdout.write(
            f"Account: {target.user.full_name} <{target.user.email}> #{target.student_number} | "
            f"barcode={target.barcode_value!r} confirmed={target.is_id_confirmed} clearance={target.clearance_status}"
        )
        self.stdout.write(f"Violations to move: {len(violations)} (site total {Violation.objects.count()})")
        for v, r in zip(violations, recipients):
            n_appeals = Appeal.objects.filter(violation=v).count()
            self.stdout.write(
                f"  #{v.id} {v.rule.rule_code} {v.status} @ {v.location} -> "
                f"{r.user.full_name} #{r.student_number} ({n_appeals} appeal(s))"
            )

        if not apply:
            self.stdout.write("Dry run only. Re-run with --apply to save.")
            return

        before_total = Violation.objects.count()
        before = {v.id: tuple(getattr(v, f) for f in HEATMAP_FIELDS) for v in violations}

        with transaction.atomic():
            for v, r in zip(violations, recipients):
                Violation.objects.filter(id=v.id).update(student=r)
                Appeal.objects.filter(violation_id=v.id).update(student=r)
                Notification.objects.filter(user=target.user, reference_id=v.id).update(user=r.user)

            target.barcode_value = None
            target.is_id_confirmed = False
            target.clearance_status = 'CLEARED'
            target.risk_score = 0.0
            target.save(update_fields=['barcode_value', 'is_id_confirmed', 'clearance_status', 'risk_score'])

            # Safety checks: heatmap fields and totals must be identical
            for v in Violation.objects.filter(id__in=before):
                if tuple(getattr(v, f) for f in HEATMAP_FIELDS) != before[v.id]:
                    raise CommandError(f"Violation #{v.id} heatmap fields changed. Rolled back, nothing saved.")
            if Violation.objects.count() != before_total:
                raise CommandError("Violation total changed. Rolled back, nothing saved.")
            if Violation.objects.filter(student=target).exists():
                raise CommandError("Account still has violations. Rolled back, nothing saved.")

        self.stdout.write(self.style.SUCCESS(
            f"Done. {len(violations)} violation(s) moved, account reset. "
            f"Site total still {Violation.objects.count()}."
        ))
