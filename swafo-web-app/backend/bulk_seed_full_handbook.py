import re
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.handbook.models import HandbookEntry

def parse_handbook(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    rules = []
    
    for line in lines:
        line = line.strip()
        if not line.startswith('|'): continue
        
        # Split by | and clean
        parts = [p.strip() for p in line.split('|')]
        # Parts will be ['', code, desc, p1, p2, p3, p4, p5, ''] for major
        # or ['', code, desc, ''] for minor
        
        if len(parts) < 3: continue
        
        code = parts[1]
        
        # Check if it's a valid code (27.x.x.x.x...)
        if not re.match(r'^27(\.\d+){2,}$', code):
            continue
            
        desc = parts[2]
        if desc.lower() in ['violation', 'offense', '---']: continue

        data = {
            "rule_code": code,
            "description": desc,
            "p1": None, "p2": None, "p3": None, "p4": None, "p5": None
        }

        # Determine Category & Penalties
        if code.startswith('27.1'):
            data["category"] = "Minor — Behavior" if "27.1.1" in code else "Minor — Clothing"
            data["p1"] = "Written warning"
            data["p2"] = "First minor offense"
            data["p3"] = "Second minor offense"
            data["p4"] = "Third minor offense (Major Escalation)"
        elif code.startswith('27.4'):
            if code.startswith('27.4.2'):
                data["category"] = "Traffic — Minor"
                data["p1"] = "Warning"
                data["p2"] = "Minor Offense + Php 1,000 fine"
                data["p3"] = "Commission of 2nd minor offense + Php 2,000 fine"
                data["p4"] = "Cancellation of vehicle pass + Commission of 3rd minor offense"
            else:
                data["category"] = "Traffic — Major"
                data["p1"] = "Major administrative sanction + Php 2,000 fine"
                data["p2"] = "Major offense + Cancellation of vehicle sticker for one Academic Year"
        elif code.startswith('27.3'):
            data["category"] = "Major — Misconduct" if "27.3.1" in code else "Major — Dishonesty" if "27.3.2" in code else "Major — Violent Acts"
            
            sanction_map = {
                "1": "Sanction 1: Probation (1 year)",
                "2": "Sanction 2: Suspension (3–5 school days)",
                "3": "Sanction 3: Suspension (6–12 school days)",
                "4": "Sanction 4: Non-readmission",
                "5": "Sanction 5: Exclusion",
                "6": "Sanction 6: Expulsion"
            }
            
            # Extract p1-p5 from parts[3:8]
            for i, p_key in enumerate(['p1', 'p2', 'p3', 'p4', 'p5']):
                if len(parts) > i + 3:
                    val = parts[i + 3]
                    if val and val != "---":
                        data[p_key] = sanction_map.get(val, val)

        rules.append(data)

    return rules

def seed_full_handbook():
    filepath = r'C:\Users\timde\Downloads\ThesisFiles\additional context\handbook_reference.md'
    all_rules = parse_handbook(filepath)
    
    print(f"📖 Found {len(all_rules)} rules in handbook_reference.md")
    
    updated_count = 0
    created_count = 0
    for item in all_rules:
        obj, created = HandbookEntry.objects.update_or_create(
            rule_code=item["rule_code"],
            defaults={
                "category": item.get("category", "Other"),
                "description": item["description"],
                "penalty_1st": item.get("p1"),
                "penalty_2nd": item.get("p2"),
                "penalty_3rd": item.get("p3"),
                "penalty_4th": item.get("p4"),
                "penalty_5th": item.get("p5"),
            }
        )
        if created: created_count += 1
        else: updated_count += 1
    
    print(f"✅ Successfully processed handbook: {created_count} created, {updated_count} updated.")

if __name__ == "__main__":
    seed_full_handbook()
