import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re

from test_pipeline_comprehensive import valid_posts

INDIAN_PUNJAB_CITIES = [
    'jalandhar', 'amritsar', 'ludhiana', 'bathinda', 'sangrur', 'patiala', 
    'firozpur', 'barnala', 'malerkotla', 'hoshiarpur', 'mohali', 'gurdaspur',
    'moga', 'kapurthala', 'fazilka', 'muktsar', 'mansa', 'rupnagar', 'tarn taran',
    'pathankot', 'chitti bein', 'satluj', 'sutlej', 'beas'
]

suspects = []

for p in valid_posts:
    text_lower = p.get('text', '').lower()
    
    # 1. Indian Punjab locations
    found_cities = [c for c in INDIAN_PUNJAB_CITIES if c in text_lower]
    
    # 2. Gurmukhi script
    has_gurmukhi = bool(re.search(r'[\u0a00-\u0a7f]', p.get('text', '')))
    
    # 3. Water pollution only (no air quality)
    is_water_only = ('river' in text_lower or 'water' in text_lower) and not any(k in text_lower for k in ['air', 'smog', 'aqi', 'smoke', 'pm2.5', 'pm10', 'respiratory'])
    
    if found_cities or has_gurmukhi or is_water_only:
        suspects.append((p.get('id'), p.get('authorUsername'), found_cities, has_gurmukhi, is_water_only, p.get('text')[:120].replace('\n', ' ')))

print(f"Total suspects found in kept posts: {len(suspects)}")
for s in suspects:
    print(f"ID {s[0]} @{s[1]} | Cities: {s[2]} | Gurmukhi: {s[3]} | WaterOnly: {s[4]}")
    print(f"   Text: {s[5]}")
