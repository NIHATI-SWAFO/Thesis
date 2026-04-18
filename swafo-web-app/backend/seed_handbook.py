import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.handbook.models import HandbookEntry

def seed_handbook():
    print("🗑️  Cleaning existing handbook data...")
    HandbookEntry.objects.all().delete()

    HANDBOOK_DATA = [
        # --- MINOR OFFENSES (27.1.1) ---
        {"rule_code": "27.1.1.1", "category": "Minor — Behavior", "description": "Unnecessary shouting inside university buildings, hallways, or corridors", "p1": "Written warning", "p2": "1st Minor", "p3": "2nd Minor", "p4": "3rd Minor (Major Escalation)"},
        {"rule_code": "27.1.1.2", "category": "Minor — Behavior", "description": "Loitering along hallways or corridors", "p1": "Written warning", "p2": "1st Minor", "p3": "2nd Minor", "p4": "3rd Minor (Major Escalation)"},
        {"rule_code": "27.1.1.3", "category": "Minor — Behavior", "description": "Sitting on tables, stairs, veranda, and railings", "p1": "Written warning", "p2": "1st Minor", "p3": "2nd Minor", "p4": "3rd Minor (Major Escalation)"},
        
        # --- CLOTHING (27.1.2) ---
        {"rule_code": "27.1.2.1", "category": "Minor — Clothing", "description": "See-through clothes without proper inner garments", "p1": "Written warning", "p2": "1st Minor", "p3": "2nd Minor", "p4": "3rd Minor (Major Escalation)"},
        {"rule_code": "27.1.2.2", "category": "Minor — Clothing", "description": "Ripped jeans exposing skin 3 inches above the knee", "p1": "Written warning", "p2": "1st Minor", "p3": "2nd Minor", "p4": "3rd Minor (Major Escalation)"},
        {"rule_code": "27.1.2.11", "category": "Minor — Clothing", "description": "All kinds of slippers (except during heavy rains or injuries)", "p1": "Written warning", "p2": "1st Minor", "p3": "2nd Minor", "p4": "3rd Minor (Major Escalation)"},

        # --- MAJOR OFFENSES: MISCONDUCT (27.3.1) ---
        {"rule_code": "27.3.1.1", "category": "Major — Misconduct", "description": "Unauthorized changing of computer setup and default network setup", "p1": "1 (Probation)", "p2": "2 (Susp 3-5d)", "p3": "2 (Susp 3-5d)", "p4": "3 (Susp 6-12d)", "p5": "4 (Non-readmission)"},
        {"rule_code": "27.3.1.17", "category": "Major — Misconduct", "description": "Selling of prohibited and/or regulated drugs", "p1": "5 (Exclusion)", "p2": "5 (Exclusion)", "p3": "5 (Exclusion)", "p4": "5 (Exclusion)", "p5": "5 (Exclusion)"},
        {"rule_code": "27.3.1.20", "category": "Major — Misconduct", "description": "Acts of gross disrespect (in words or deeds) which insult or subject to ridicule any member of faculty, admin, or students", "p1": "2 (Susp 3-5d)", "p2": "3 (Susp 6-12d)", "p3": "4 (Non-readmission)"},
        {"rule_code": "27.3.1.21", "category": "Major — Misconduct", "description": "Unjust vexation, discrimination, bullying, and cyberbullying", "p1": "2 (Susp 3-5d)", "p2": "3 (Susp 6-12d)", "p3": "4 (Non-readmission)"},
        {"rule_code": "27.3.1.26", "category": "Major — Misconduct", "description": "Forging or falsifying any official university document or record", "p1": "3 (Susp 6-12d)", "p2": "4 (Non-readmission)"},
        {"rule_code": "27.3.1.39", "category": "Major — Misconduct", "description": "Habitual commission of minor offenses (of the same nature)", "p1": "2 (Susp 3-5d)", "p2": "3 (Susp 6-12d)", "p3": "4 (Non-readmission)"},
        {"rule_code": "27.3.1.43", "category": "Major — Misconduct", "description": "Commission of third minor offense (Escalation trigger)", "p1": "1 (Probation)", "p2": "2 (Susp 3-5d)", "p3": "3 (Susp 6-12d)", "p4": "4 (Non-readmission)"},

        # --- MAJOR OFFENSES: DISHONESTY (27.3.2) ---
        {"rule_code": "27.3.2.3", "category": "Major — Dishonesty", "description": "Using someone else's ID card or COR; lending ID card or COR", "p1": "1 (Probation)", "p2": "2 (Susp 3-5d)", "p3": "3 (Susp 6-12d)", "p4": "4 (Non-readmission)"},
        {"rule_code": "27.3.2.7", "category": "Major — Dishonesty", "description": "Cheating in any form", "p1": "3 (Susp 6-12d)", "p2": "4 (Non-readmission)"},
        {"rule_code": "27.3.2.8", "category": "Major — Dishonesty", "description": "Plagiarism", "p1": "3 (Susp 6-12d)", "p2": "4 (Non-readmission)"},

        # --- VIOLENT ACTS (27.3.3) ---
        {"rule_code": "27.3.3.5", "category": "Major — Violent Acts", "description": "Brawls and/or physically attacking or assaulting any person", "p1": "3 (Susp 6-12d)", "p2": "4 (Non-readmission)"},
    ]

    for item in HANDBOOK_DATA:
        HandbookEntry.objects.create(
            rule_code=item["rule_code"],
            category=item["category"],
            description=item["description"],
            penalty_1st=item.get("p1"),
            penalty_2nd=item.get("p2"),
            penalty_3rd=item.get("p3"),
            penalty_4th=item.get("p4"),
            penalty_5th=item.get("p5"),
        )
    
    print(f"✅ Successfully seeded {len(HANDBOOK_DATA)} institutional rules.")

if __name__ == "__main__":
    seed_handbook()
