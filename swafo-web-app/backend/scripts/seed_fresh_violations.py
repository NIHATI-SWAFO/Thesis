import os
import sys
import django
from datetime import timedelta
import random

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from apps.violations.models import Violation
from apps.users.models import User, StudentProfile
from apps.handbook.models import HandbookEntry
from constants.locations import DLSUD_LOCATIONS

def run():
    now = timezone.now()
    print(f"Current time: {now}")

    # Ensure required references
    students = list(StudentProfile.objects.all())
    officers = list(User.objects.filter(role=User.Role.OFFICER, is_active=True))
    
    if not students:
        print("ERROR: No student profiles found!")
        return
    if not officers:
        print("ERROR: No officers found!")
        return

    # Find rules
    def get_rule(code, fallback_cat='Minor'):
        r = HandbookEntry.objects.filter(rule_code=code).first()
        if not r:
            r = HandbookEntry.objects.filter(category__icontains=fallback_cat).first()
        return r

    major_misconduct = get_rule('27.3.1.1', 'Major')
    major_dishonesty = get_rule('27.3.1.2', 'Major')
    minor_shouting   = get_rule('27.1.1.1', 'Minor')
    minor_loitering  = get_rule('27.1.1.2', 'Minor')
    traffic_parking  = get_rule('27.4.2.2.2', 'Traffic')
    traffic_helmet   = get_rule('27.4.2.2.3', 'Traffic')
    traffic_pickup   = get_rule('27.4.2.2.5', 'Traffic')

    new_incidents = [
        # ── 1. Doctor Fe Del Mundo Hall (Acute Major Hotspot TODAY!) ──
        {
            "location_name": "Doctor Fe Del Mundo Hall",
            "rule": major_misconduct,
            "description": "Unauthorized tampering and reconfiguration of laboratory network switch and terminal settings in Room 204.",
            "hours_ago": 2.5,
            "status": Violation.Status.OPEN,
            "case_summary": "Major laboratory misconduct: unauthorized network tampering.",
            "corrective_action": "Written reprimand and suspension of computer laboratory privileges.",
        },
        {
            "location_name": "Doctor Fe Del Mundo Hall",
            "rule": major_misconduct,
            "description": "Breach of safety protocols: unauthorized access into building electrical control sub-panel without faculty supervisor present.",
            "hours_ago": 5.0,
            "status": Violation.Status.OPEN,
            "case_summary": "Major safety violation: unauthorized panel access.",
            "corrective_action": "Disciplinary hearing before Student Welfare Committee.",
        },
        {
            "location_name": "Doctor Fe Del Mundo Hall",
            "rule": traffic_parking,
            "description": "Parked private vehicle across the wheelchair ramp and emergency exit pathway behind Fe Del Mundo Hall.",
            "hours_ago": 26.0, # yesterday
            "status": Violation.Status.AWAITING_DECISION,
            "case_summary": "Traffic violation: obstructing emergency access ramp.",
            "corrective_action": "Traffic fine Php 1,000 and vehicle record endorsement.",
        },
        {
            "location_name": "Doctor Fe Del Mundo Hall",
            "rule": major_dishonesty,
            "description": "Possession of unauthorized crib notes and mobile phone usage during mid-term laboratory assessment.",
            "hours_ago": 28.0, # yesterday
            "status": Violation.Status.OPEN,
            "case_summary": "Academic dishonesty during laboratory examination.",
            "corrective_action": "Referral to College Disciplinary Board.",
        },
        {
            "location_name": "Doctor Fe Del Mundo Hall",
            "rule": minor_shouting,
            "description": "Loud screaming and horseplay creating significant disturbance along the 2nd floor science faculty corridor.",
            "hours_ago": 52.0, # 2 days ago
            "status": Violation.Status.CLOSED,
            "case_summary": "Minor behavioral noise disturbance.",
            "corrective_action": "Formal written warning.",
        },

        # ── 2. Magdalo Gate (Active Gate Hotspot TODAY!) ──
        {
            "location_name": "Magdalo Gate",
            "rule": traffic_parking,
            "description": "Unattended motorcycle parked right within the ingress pedestrian turnstile lane, blocking incoming students.",
            "hours_ago": 1.5,
            "status": Violation.Status.OPEN,
            "case_summary": "Traffic violation: blocking pedestrian turnstile ingress.",
            "corrective_action": "Immediate towing warning and vehicle sticker demerit.",
        },
        {
            "location_name": "Magdalo Gate",
            "rule": major_misconduct,
            "description": "Aggressive confrontation and refusal to comply with security officer directives during mandatory ID bag inspection at gate.",
            "hours_ago": 4.0,
            "status": Violation.Status.OPEN,
            "case_summary": "Major misconduct: defiance toward security personnel.",
            "corrective_action": "Referral to SWAFO Director for formal sanction.",
        },
        {
            "location_name": "Magdalo Gate",
            "rule": traffic_helmet,
            "description": "Riding passenger on a motorcycle through Magdalo Gate vehicular lane without an approved safety helmet.",
            "hours_ago": 24.5, # yesterday
            "status": Violation.Status.AWAITING_DECISION,
            "case_summary": "Traffic violation: riding motorcycle without helmet.",
            "corrective_action": "Traffic citation Php 1,000.",
        },
        {
            "location_name": "Magdalo Gate",
            "rule": traffic_pickup,
            "description": "Repeated unauthorized pick-up and drop-off in designated yellow curb no-stopping zone outside gate.",
            "hours_ago": 48.0, # 2 days ago
            "status": Violation.Status.CLOSED,
            "case_summary": "Traffic violation: pick-up in no-stopping zone.",
            "corrective_action": "Written warning for first traffic offense.",
        },

        # ── 3. MTH Covered Court (Sports Complex Hotspot) ──
        {
            "location_name": "MTH Covered Court",
            "rule": major_misconduct,
            "description": "Graffiti and intentional scratch markings on newly resurfaced basketball court bleachers and storage lockers.",
            "hours_ago": 6.0,
            "status": Violation.Status.OPEN,
            "case_summary": "Major misconduct: vandalism of university sports facilities.",
            "corrective_action": "Restitution for property damage and disciplinary community service.",
        },
        {
            "location_name": "MTH Covered Court",
            "rule": minor_loitering,
            "description": "Unauthorized loitering and staying in covered court facility past 20:00 without approved activity permit.",
            "hours_ago": 27.0, # yesterday
            "status": Violation.Status.OPEN,
            "case_summary": "Minor rule violation: after-hours loitering.",
            "corrective_action": "Warning entry in student disciplinary log.",
        },
        {
            "location_name": "MTH Covered Court",
            "rule": minor_shouting,
            "description": "Refusal to yield court during scheduled varsity training and shouting disrespectful remarks at court custodian.",
            "hours_ago": 50.0, # 2 days ago
            "status": Violation.Status.CLOSED,
            "case_summary": "Minor behavioral infraction: disrespect to campus personnel.",
            "corrective_action": "Verbal reprimand followed by written acknowledgment.",
        },

        # ── 4. Mariano Alvarez Hall ──
        {
            "location_name": "Mariano Alvarez Hall",
            "rule": minor_loitering,
            "description": "Loitering and sitting on floor blocking designated emergency exit stairwell on 3rd floor.",
            "hours_ago": 23.0, # yesterday
            "status": Violation.Status.OPEN,
            "case_summary": "Obstruction of designated fire exit pathway.",
            "corrective_action": "Written warning.",
        },
        {
            "location_name": "Mariano Alvarez Hall",
            "rule": minor_shouting,
            "description": "Excessive noise and boombox playback in common hallway during ongoing preliminary examinations.",
            "hours_ago": 49.0, # 2 days ago
            "status": Violation.Status.CLOSED,
            "case_summary": "Minor noise violation during examination period.",
            "corrective_action": "Warning recorded in SWAFO portal.",
        },
    ]

    created_count = 0
    for idx, inc in enumerate(new_incidents):
        loc_coords = DLSUD_LOCATIONS.get(inc["location_name"], {})
        lat = loc_coords.get("lat")
        lng = loc_coords.get("lng")

        student = students[idx % len(students)]
        officer = officers[idx % len(officers)]
        calc_timestamp = now - timedelta(hours=inc["hours_ago"])

        v = Violation.objects.create(
            student=student,
            officer=officer,
            rule=inc["rule"],
            location=inc["location_name"],
            location_name=inc["location_name"],
            latitude=lat,
            longitude=lng,
            description=inc["description"],
            status=inc["status"],
            case_summary=inc["case_summary"],
            corrective_action=inc["corrective_action"],
        )

        # Update timestamp to bypass auto_now_add
        Violation.objects.filter(id=v.id).update(timestamp=calc_timestamp)
        created_count += 1
        print(f"[{created_count:2d}] Seeded {inc['location_name']:25} | Rule: {inc['rule'].rule_code:10} | Hours Ago: {inc['hours_ago']:4.1f}h")

    print(f"\nSuccessfully seeded {created_count} fresh violations!")

if __name__ == '__main__':
    run()
