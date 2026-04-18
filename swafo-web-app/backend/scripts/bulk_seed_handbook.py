import re
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.handbook.models import HandbookEntry

def parse_markdown_to_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    rules = []
    
    # 1. Parse Minor Behavior (27.1.1)
    minor_behavior_pattern = re.compile(r'\| (27\.1\.1\.\d+) \| (.*?) \|')
    matches = minor_behavior_pattern.findall(content)
    for code, desc in matches:
        rules.append({
            "rule_code": code,
            "category": "Minor — Behavior",
            "description": desc,
            "p1": "Written warning", "p2": "First minor offense", "p3": "Second minor offense", "p4": "Third minor offense (Major Escalation)"
        })

    # 2. Parse Prohibited Clothing (27.1.2)
    clothing_pattern = re.compile(r'\| (27\.1\.2\.\d+) \| (.*?) \|')
    matches = clothing_pattern.findall(content)
    for code, desc in matches:
        rules.append({
            "rule_code": code,
            "category": "Minor — Clothing",
            "description": desc,
            "p1": "Written warning", "p2": "First minor offense", "p3": "Second minor offense", "p4": "Third minor offense (Major Escalation)"
        })
    
    # 3. Parse Major Misconduct (27.3.1)
    # Pattern: | 27.3.1.x | Offense | 1st | 2nd | 3rd | 4th | 5th |
    major_pattern = re.compile(r'\| (27\.3\.[1234]\.\d+) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \|')
    matches = major_pattern.findall(content)
    
    sanction_map = {
        "1": "Probation (1 year)",
        "2": "Suspension (3–5 school days)",
        "3": "Suspension (6–12 school days)",
        "4": "Non-readmission",
        "5": "Exclusion",
        "6": "Expulsion"
    }

    for code, desc, p1, p2, p3, p4, p5 in matches:
        rules.append({
            "rule_code": code,
            "category": "Major — " + ("Misconduct" if "27.3.1" in code else "Dishonesty" if "27.3.2" in code else "Violent Acts" if "27.3.3" in code else "Other"),
            "description": desc.strip(),
            "p1": sanction_map.get(p1.strip(), p1.strip()),
            "p2": sanction_map.get(p2.strip(), p2.strip()),
            "p3": sanction_map.get(p3.strip(), p3.strip()),
            "p4": sanction_map.get(p4.strip(), p4.strip()),
            "p5": sanction_map.get(p5.strip(), p5.strip()),
        })

    return rules

def seed_full_handbook():
    print("🗑️  Cleaning existing handbook data...")
    HandbookEntry.objects.all().delete()
    
    filepath = r'C:\Users\timde\Downloads\Thesis Files\additional context\handbook_reference.md'
    all_rules = parse_markdown_to_data(filepath)
    
    print(f"📖 Found {len(all_rules)} rules in handbook_reference.md")
    
    for item in all_rules:
        HandbookEntry.objects.create(
            rule_code=item["rule_code"],
            category=item["category"],
            description=item["description"],
            penalty_1st=item["p1"],
            penalty_2nd=item["p2"],
            penalty_3rd=item["p3"],
            penalty_4th=item["p4"],
            penalty_5th=item["p5"],
        )
    
    print(f"✅ Successfully seeded {len(all_rules)} institutional rules.")

if __name__ == "__main__":
    seed_full_handbook()
