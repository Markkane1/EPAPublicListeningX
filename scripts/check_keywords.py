import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re

json_path = r"C:\Users\Asif\.gemini\antigravity\brain\a6dc8537-a91f-4ace-9851-c149428ca25f\.user_uploaded\media_1793624655821_92bfc20c.json"
with open(json_path, 'r', encoding='utf-8') as f:
    posts = json.load(f)

# The positive query was:
# (AQI OR "air quality" OR pollution OR smog or "clean air") AND (Lahore or gujranwala OR Pakistan OR Punjab)

# Let's check which posts lack the positive air quality keywords:
AQ_KEYWORDS = [r'\baqi\b', r'air quality', r'pollution', r'smog', r'clean air', r'cleaner air', r'pm2\.5', r'pm10']
GEO_KEYWORDS = [r'lahore', r'gujranwala', r'pakistan', r'punjab', r'faisalabad', r'multan', r'rawalpindi', r'islamabad', r'sialkot', r'attock', r'sheikhupura', r'kasur', r'sargodha', r'bahawalpur', r'gwmc', r'lwmc']

missing_aq = []
missing_geo = []

for idx, p in enumerate(posts):
    text = p.get('text', '').lower()
    author_desc = (p.get('authorDescription') or '').lower()
    combined = text + ' ' + author_desc
    
    has_aq = any(re.search(k, text) for k in AQ_KEYWORDS)
    if not has_aq:
        missing_aq.append((idx, p.get('id'), p.get('authorUsername'), p.get('text')))
        
    has_geo = any(re.search(g, combined) for g in GEO_KEYWORDS)
    if not has_geo:
        missing_geo.append((idx, p.get('id'), p.get('authorUsername'), p.get('text')))

print(f"Posts missing AQ keywords: {len(missing_aq)}")
for m in missing_aq:
    print(f"  [{m[0]}] @{m[2]}: {m[3]!r}")

print(f"\nPosts missing Geo keywords: {len(missing_geo)}")
for m in missing_geo:
    print(f"  [{m[0]}] @{m[2]}: {m[3]!r}")
