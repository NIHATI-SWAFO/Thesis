"""
repair_demo_data: makes the existing case data consistent and demo-ready.

SAFE BY DESIGN
  * Dry run by default. Nothing is saved unless --apply is passed.
  * Runs inside one transaction. Any error undoes everything.
  * Never writes the fields the heatmap reads (location, location_name,
    latitude, longitude, timestamp, rule). It checks them before saving and
    cancels the run if anything differs.
  * Only renames students whose name ends in a number (generated test data).
    Team accounts are matched by student number. Every other real account
    is left untouched.

USAGE
  python manage.py repair_demo_data            # dry run, prints the plan
  python manage.py repair_demo_data --apply    # saves the changes
"""
import random
import re
from collections import Counter, defaultdict
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.users.models import Notification, StudentProfile, User
from apps.violations.consequence_engine import (
    evaluate_student_aggregate_standing,
    evaluate_violation_consequence,
)
from apps.violations.models import Appeal, Violation

# Team accounts used to demo the student portal: student number -> demo role
TEAM_ROLES = {
    '202330395': 'repeat',     # Timothy De Castro: repeat offender (Warning)
    '202330485': 'open',       # Nica Estelle Desacola: one open case (Review)
    '202180379': 'dismissed',  # Harlene Bautista: dismissed after an approved appeal (Compliant)
}

NUMBERED_NAME = re.compile(r'\s\d+$')   # e.g. "Dalisay Cardo 2"
CLEAN_FAKE_STUDENTS = 8                 # renamed test students left with no cases
SINGLE_CASE_STUDENTS = 10               # renamed test students with exactly one case
SEED = 2026                             # fixed seed: same result on every run

# Student number prefix by year level (matches the real accounts: 2023 = 3rd year)
YEAR_PREFIX = {1: '2025', 2: '2024', 3: '2023', 4: '2022'}

FIRST_NAMES = [
    'Adrian', 'Bea', 'Carlo', 'Danica', 'Enzo', 'Francine', 'Gian', 'Hannah', 'Ivan', 'Jasmine',
    'Kyle', 'Lara', 'Marco', 'Nicole', 'Paolo', 'Queenie', 'Rafael', 'Samantha', 'Tristan', 'Ysabel',
    'Andrea', 'Bryan', 'Camille', 'Darren', 'Erika', 'Franco', 'Gwen', 'Joshua', 'Kristine', 'Luis',
]
LAST_NAMES = [
    'Abad', 'Bernardo', 'Castillo', 'Dizon', 'Estrada', 'Fernandez', 'Galang', 'Hernandez', 'Ignacio', 'Jimenez',
    'Lacson', 'Manalo', 'Navarro', 'Ocampo', 'Panganiban', 'Quiambao', 'Rivera', 'Salazar', 'Tan', 'Uy',
    'Valdez', 'Yap', 'Zamora', 'Aquino', 'Belen', 'Cortez', 'Domingo', 'Evangelista', 'Flores', 'Gatchalian',
]

DISMISSAL_REASONS = [
    'Dismissed after review: the flagged detection was not confirmed by the officer at the gate.',
    'Dismissed after review: the wrong student was identified during recording.',
    'Dismissed after review: the student presented an approved uniform exemption.',
]

# Days after the incident at which each stage was last updated
UPDATED_OFFSET = {
    'OPEN': 0, 'AWAITING_DECISION': 3, 'DECISION_RENDERED': 5, 'CLOSED': 14, 'DISMISSED': 4,
}


def assess(case, prior):
    rule = case.rule
    return evaluate_violation_consequence(
        rule_code=rule.rule_code,
        rule_category=rule.category,
        rule_description=rule.description,
        rule_penalties={
            'penalty_1st': rule.penalty_1st, 'penalty_2nd': rule.penalty_2nd,
            'penalty_3rd': rule.penalty_3rd, 'penalty_4th': rule.penalty_4th,
            'penalty_5th': rule.penalty_5th,
        },
        prior_violations=prior,
    )


def heatmap_fingerprint():
    """Every field the heatmap and risk scoring read, for every case."""
    return sorted(
        Violation.objects.values_list(
            'id', 'location', 'location_name', 'latitude', 'longitude', 'timestamp', 'rule_id'
        )
    )


class Command(BaseCommand):
    help = 'Repairs case data so every status has consistent details (dry run unless --apply).'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Save the changes. Without it, nothing is saved.')

    def handle(self, *args, **opts):
        apply = opts['apply']
        self.R = random.Random(SEED)
        self.now = timezone.now()
        self.out = []

        with transaction.atomic():
            before = heatmap_fingerprint()
            before_locations = Counter(v[2] or v[1] for v in before)

            self.repair()

            after = heatmap_fingerprint()
            if after != before:
                transaction.set_rollback(True)
                self.stderr.write(self.style.ERROR('Heatmap fields changed. Run cancelled, nothing saved.'))
                return
            self.say(f'\nHeatmap check: PASSED ({len(after)} cases, {len(before_locations)} locations, '
                     f'location, coordinates, date and offense unchanged)')

            if not apply:
                transaction.set_rollback(True)

        self.stdout.write('\n'.join(self.out))
        if apply:
            self.stdout.write(self.style.SUCCESS('\nAPPLIED. Changes saved.'))
        else:
            self.stdout.write(self.style.WARNING('\nDRY RUN. Nothing was saved. Re-run with --apply to save.'))

    def say(self, line=''):
        self.out.append(line)

    # ------------------------------------------------------------------
    def repair(self):
        R = self.R
        officers = list(User.objects.filter(role='OFFICER', is_deleted=False).order_by('pk'))
        if not officers:
            raise SystemExit('No active officer accounts found. Nothing changed.')
        self.officer_cycle = 0
        self.officers = officers

        students = list(StudentProfile.objects.select_related('user').order_by('pk'))
        team = {s.student_number: s for s in students if s.student_number in TEAM_ROLES}
        fakes = [s for s in students if NUMBERED_NAME.search(s.user.full_name or '') and s.student_number not in TEAM_ROLES]
        protected = [s for s in students if s not in fakes and s.student_number not in TEAM_ROLES]

        self.say('=== STUDENTS ===')
        self.say(f'Total: {len(students)} | team: {len(team)} | real accounts left untouched: {len(protected)} | '
                 f'numbered test students to rename: {len(fakes)}')
        missing = [n for n in TEAM_ROLES if n not in team]
        if missing:
            self.say(f'WARNING: team accounts not found: {", ".join(missing)} (their demo roles are skipped)')

        # 1. Rename numbered test students -------------------------------------
        self.rename_fakes(fakes)

        # 2. Decide who owns each case ------------------------------------------
        cases = list(Violation.objects.select_related('rule', 'student').order_by('-timestamp', '-id'))
        protected_ids = {s.pk for s in protected}
        moved_from_real = [c for c in cases if c.student_id in protected_ids]
        if moved_from_real:
            self.say(f'Cases moved off real non-team accounts: {len(moved_from_real)}')

        owner = {}            # case id -> StudentProfile
        forced = {}           # case id -> forced status for team demo roles
        pool = []

        by_student = defaultdict(list)
        for c in cases:
            by_student[c.student_id].append(c)   # newest first

        team_cases = {}
        taken = set()
        for num, role in TEAM_ROLES.items():
            s = team.get(num)
            if not s:
                continue
            want = 4 if role == 'repeat' else 1
            own = by_student.get(s.pk, [])[:want]
            team_cases[num] = list(own)
            taken.update(c.id for c in own)

        rest = [c for c in cases if c.id not in taken]
        for num, role in TEAM_ROLES.items():
            if num not in team_cases:
                continue
            want = 4 if role == 'repeat' else 1
            while len(team_cases[num]) < want and rest:
                team_cases[num].append(rest.pop(0))   # newest available case
            chosen = sorted(team_cases[num], key=lambda c: c.timestamp)   # oldest first
            if role == 'repeat':
                plan = ['CLOSED', 'CLOSED', 'DECISION_RENDERED', 'OPEN_ASSIGNED'][-len(chosen):]
            elif role == 'open':
                plan = ['OPEN_ASSIGNED']
            else:
                plan = ['DISMISSED']
            for c, st in zip(chosen, plan):
                owner[c.id] = team[num]
                forced[c.id] = st
            team_cases[num] = chosen

        pool = [c for c in rest]
        active = fakes[:-CLEAN_FAKE_STUDENTS] if len(fakes) > CLEAN_FAKE_STUDENTS else fakes
        if not active:
            raise SystemExit('No numbered test students found. The data looks already repaired. Nothing changed.')
        # Single-case students: half get one of the newest cases (shows "Review"),
        # half get one of the oldest cases (shows "Compliant" once it is closed).
        singles = active[:SINGLE_CASE_STUDENTS] if len(active) > SINGLE_CASE_STUDENTS * 2 else []
        half = len(singles) // 2
        single_cases = pool[:half] + pool[len(pool) - (len(singles) - half):] if singles else []
        for s, c in zip(singles, single_cases):
            owner[c.id] = s
        others = active[len(singles):]
        shuffled = [c for c in pool if c.id not in owner]
        R.shuffle(shuffled)
        weights = [1 + (i % 9) for i in range(len(others))]
        for i, c in enumerate(shuffled):
            owner[c.id] = others[i] if i < len(others) else R.choices(others, weights=weights, k=1)[0]

        # 3. Status by age for the pool (newest first) ---------------------------
        n = len(pool)
        q_unclaimed = round(n * 0.08)
        q_invest = round(n * 0.10)
        q_mid = round(n * 0.22)
        q_awaiting = round(n * 0.08)

        # requires_director needs the owner's history, so compute owners' history first
        def history(case, statuses):
            stu = owner[case.id]
            earlier = [x for x in cases if owner[x.id] == stu and (x.timestamp, x.id) < (case.timestamp, case.id)]
            return [{'rule_code': x.rule.rule_code, 'category': x.rule.category,
                     'status': statuses.get(x.id, 'CLOSED')} for x in earlier]

        status = {}
        awaiting = 0
        for i, c in enumerate(pool):   # pool is newest first
            if i < q_unclaimed:
                status[c.id] = 'OPEN_UNCLAIMED'
            elif i < q_unclaimed + q_invest:
                status[c.id] = 'OPEN_ASSIGNED'
            elif i < q_unclaimed + q_invest + q_mid:
                if awaiting < q_awaiting and assess(c, history(c, {})).requires_director_decision:
                    status[c.id] = 'AWAITING_DECISION'
                    awaiting += 1
                else:
                    status[c.id] = 'DECISION_RENDERED'
            else:
                status[c.id] = 'DISMISSED' if (i % 7 == 3) else 'CLOSED'
        status.update(forced)
        plain = {k: ('OPEN' if v.startswith('OPEN') else v) for k, v in status.items()}

        # An AWAITING case must really need the Director once dismissals are known
        for c in pool:
            if status[c.id] == 'AWAITING_DECISION' and not assess(c, history(c, plain)).requires_director_decision:
                status[c.id] = plain[c.id] = 'DECISION_RENDERED'

        # 4. Write the non-heatmap fields ---------------------------------------
        for c in sorted(cases, key=lambda x: (x.timestamp, x.id)):   # oldest first
            st = status[c.id]
            final = plain[c.id]
            stu = owner[c.id]
            a = assess(c, history(c, plain))
            sanction = a.recommendation
            fields = {
                'student': stu,
                'status': final,
                'corrective_action': sanction[:255],
                'assigned_to': None if st == 'OPEN_UNCLAIMED' else self.next_officer(),
                'director_sanction': sanction[:255] if final in ('DECISION_RENDERED', 'CLOSED') else None,
                'director_remarks': self.remarks(final, c),
                'case_summary': f"[{c.rule.rule_code}] {c.rule.description[:80]} reported at "
                                f"{c.location_name or c.location}. Mandated action: {sanction}.",
                'updated_at': min(self.now, c.timestamp + timedelta(days=UPDATED_OFFSET[final])),
            }
            if c.officer_id is None:
                fields['officer'] = self.next_officer()
            Violation.objects.filter(pk=c.pk).update(**fields)

        # 5. Appeals, notifications, clearance ------------------------------------
        touched = set(s.pk for s in fakes) | set(s.pk for s in team.values())
        Appeal.objects.filter(violation__student_id__in=touched).delete()
        self.make_appeals(team, team_cases, pool, status)
        Notification.objects.filter(
            user__student_profile__pk__in=touched,
            notification_type__in=['VIOLATION', 'APPEAL_UPDATE', 'APPEAL_REPLY'],
        ).delete()
        self.make_notifications(team)
        for s in StudentProfile.objects.filter(pk__in=touched):
            hist = [{'rule_code': v.rule.rule_code, 'category': v.rule.category, 'status': v.status}
                    for v in s.violations.select_related('rule')]
            standing = evaluate_student_aggregate_standing(violations=hist, manual_clearance_hold=False)
            s.clearance_status = 'HOLD' if standing['clearance_impact'] == 'HOLD' else 'CLEARED'
            s.save(update_fields=['clearance_status'])

        self.report(students, team, protected, fakes)

    # ------------------------------------------------------------------
    def next_officer(self):
        o = self.officers[self.officer_cycle % len(self.officers)]
        self.officer_cycle += 1
        return o

    def remarks(self, final, case):
        if final == 'CLOSED':
            return 'Sanction served and verified by SWAFO. Case archived.'
        if final == 'DECISION_RENDERED':
            return 'Sanction rendered by the SWAFO Director. Awaiting completion by the student.'
        if final == 'DISMISSED':
            return DISMISSAL_REASONS[case.id % len(DISMISSAL_REASONS)]
        return None

    def rename_fakes(self, fakes):
        used_numbers = set(StudentProfile.objects.values_list('student_number', flat=True))
        used_emails = set(User.objects.values_list('email', flat=True))
        used_names = set(User.objects.values_list('full_name', flat=True))
        pairs = [(f, l) for i, f in enumerate(FIRST_NAMES) for j, l in enumerate(LAST_NAMES) if (i * 7 + j) % 11 == 0]
        self.R.shuffle(pairs)
        pairs = [p for p in pairs if f'{p[0]} {p[1]}' not in used_names]
        samples = []
        for s, (first, last) in zip(fakes, pairs):
            old_name, old_num = s.user.full_name, s.student_number
            year = s.year_level if s.year_level in YEAR_PREFIX else 3
            prefix = YEAR_PREFIX[year]
            while True:
                num = prefix + f'{self.R.randint(10000, 99999)}'
                if num not in used_numbers:
                    break
            used_numbers.add(num)
            base = f'{first[0]}{last[0]}{num[-4:]}'.lower()
            email, k = f'{base}@dlsud.edu.ph', 1
            while email in used_emails:
                email, k = f'{base}{k}@dlsud.edu.ph', k + 1
            used_emails.add(email)

            u = s.user
            if u.username == u.email:
                u.username = email
            u.full_name, u.first_name, u.last_name, u.email = f'{first} {last}', first, last, email
            u.save(update_fields=['full_name', 'first_name', 'last_name', 'email', 'username'])
            s.student_number = num
            s.year_level = year
            s.barcode_value = f'BARCODE-{num}'
            s.save(update_fields=['student_number', 'year_level', 'barcode_value'])
            if len(samples) < 5:
                samples.append(f'  {old_num} {old_name}  ->  {num} {first} {last} (Y{year})')
        if len(fakes) > len(pairs):
            raise SystemExit('Not enough unique names for all test students. Nothing changed.')
        self.say('Rename examples:')
        for line in samples:
            self.say(line)

    def make_appeals(self, team, team_cases, pool, status):
        made = []
        t = team.get('202330395')
        if t:
            rendered = [c for c in team_cases['202330395'] if status[c.id] == 'DECISION_RENDERED']
            if rendered:
                Appeal.objects.create(
                    violation=rendered[0], student=t, status='PENDING',
                    subject='Request to review the rendered sanction',
                    description='I was wearing the complete uniform that day but my ID lace was inside my bag. '
                                'I request a review of the sanction.')
                made.append('Timothy: PENDING')
        h = team.get('202180379')
        if h and team_cases.get('202180379'):
            Appeal.objects.create(
                violation=team_cases['202180379'][0], student=h, status='APPROVED',
                subject='Incorrect identification at the gate',
                description='The recorded student number is mine, but I was in class at the time of the incident.',
                reviewer_remarks='Appeal approved after verifying the class attendance record. Case dismissed.')
            made.append('Harlene: APPROVED')
        closed = [c for c in pool if status[c.id] == 'CLOSED']
        rendered = [c for c in pool if status[c.id] == 'DECISION_RENDERED']
        if closed:
            c = closed[0]
            Appeal.objects.create(
                violation=c, student=Violation.objects.get(pk=c.pk).student, status='REJECTED',
                subject='Request to remove the violation from my record',
                description='I did not know the policy applied on that day.',
                reviewer_remarks='Appeal rejected. The uniform schedule was announced and applies to all students.')
            made.append('test student: REJECTED')
        if rendered:
            c = rendered[0]
            Appeal.objects.create(
                violation=c, student=Violation.objects.get(pk=c.pk).student, status='PENDING',
                subject='Request for an alternative sanction',
                description='I request to render community service instead of the prescribed sanction.')
            made.append('test student: PENDING')
        self.say(f'\n=== APPEALS ===\n{len(made)} created: ' + ', '.join(made))

    def make_notifications(self, team):
        for s in team.values():
            for v in s.violations.select_related('rule').order_by('timestamp'):
                n = Notification.objects.create(
                    user=s.user, title=f'Incident Logged: [{v.rule.rule_code}]',
                    message=f'An incident was recorded on your institutional record: {v.rule.description[:80]}. '
                            f'Prescribed sanction: {v.corrective_action}.',
                    notification_type='VIOLATION', reference_id=v.id, is_read=v.status in ('CLOSED', 'DISMISSED'))
                Notification.objects.filter(pk=n.pk).update(created_at=v.timestamp)
            for a in s.appeals.exclude(status='PENDING'):
                Notification.objects.create(
                    user=s.user, title=f'Appeal Updated: {a.status}',
                    message=f'Your appeal regarding {a.violation.rule.rule_code} has been updated. '
                            f'Remarks: {a.reviewer_remarks or "No remarks provided."}',
                    notification_type='APPEAL_UPDATE', reference_id=a.id)

    def report(self, students, team, protected, fakes):
        qs = Violation.objects.all()
        self.say('\n=== CASES BY STATUS (after) ===')
        for st, cnt in Counter(qs.values_list('status', flat=True)).most_common():
            self.say(f'  {st:<18} {cnt}')
        unclaimed = qs.filter(status='OPEN', assigned_to__isnull=True).count()
        self.say(f'  (OPEN: {unclaimed} unclaimed, {qs.filter(status="OPEN").count() - unclaimed} under investigation)')

        bad = qs.filter(status__in=['DECISION_RENDERED', 'CLOSED'], director_sanction__isnull=True).count()
        bad += qs.filter(status__in=['AWAITING_DECISION', 'DECISION_RENDERED', 'CLOSED', 'DISMISSED'],
                         assigned_to__isnull=True).count()
        self.say(f'  Cases missing a sanction or officer for their status: {bad}')

        counts = Counter(qs.values_list('student_id', flat=True))
        fake_ids = [s.pk for s in fakes]
        dist = Counter(counts.get(pk, 0) for pk in fake_ids)
        self.say('\n=== TEST STUDENTS: cases per student ===')
        self.say('  ' + ', '.join(f'{k} case{"s" if k != 1 else ""}: {v}' for k, v in sorted(dist.items())))
        self.say(f'  Real non-team accounts with cases: {sum(1 for s in protected if counts.get(s.pk))}')

        labels = Counter()
        for s in StudentProfile.objects.all():
            active = s.violations.exclude(status='DISMISSED').count()
            pending = s.violations.exclude(status__in=['CLOSED', 'DISMISSED']).exists()
            labels['Warning' if active >= 2 else 'Review' if pending else 'Compliant'] += 1
        self.say('\n=== STUDENT RECORDS LABELS (all students) ===')
        self.say('  ' + ', '.join(f'{k}: {v}' for k, v in labels.most_common()))
        self.say(f'  Clearance on HOLD: {StudentProfile.objects.filter(clearance_status="HOLD").count()}')

        self.say('\n=== TEAM DEMO ACCOUNTS ===')
        for num, s in team.items():
            vs = list(s.violations.order_by('timestamp').values_list('status', flat=True))
            self.say(f'  {num} {s.user.full_name}: {", ".join(vs) or "no cases"}')
