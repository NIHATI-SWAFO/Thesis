import json

with open('master_system_snapshot.json', 'r') as f:
    data = json.load(f)

for item in data:
    if item['model'] == 'violations.violation':
        if 'updated_at' not in item['fields']:
            # Use the timestamp as updated_at if it exists, otherwise use a default
            item['fields']['updated_at'] = item['fields'].get('timestamp', '2026-04-20T00:00:00Z')

with open('master_system_snapshot.json', 'w') as f:
    json.dump(data, f, indent=2)

print("✅ Updated master_system_snapshot.json with updated_at fields.")
