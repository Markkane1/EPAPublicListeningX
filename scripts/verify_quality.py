import sys
sys.stdout.reconfigure(encoding='utf-8')
from test_pipeline_comprehensive import valid_posts, audit_log

print("=== CHECKING SAMPLE OF KEPT POSTS ===")
for p in valid_posts[:15]:
    print(f"[{p['city_detected']} | AQI: {p['aqi_value']} | {p['category']}] @{p['authorUsername']}: {p['text'][:90].replace(chr(10), ' ')}")

print("\n=== CHECKING LAST 15 KEPT POSTS ===")
for p in valid_posts[-15:]:
    print(f"[{p['city_detected']} | AQI: {p['aqi_value']} | {p['category']}] @{p['authorUsername']}: {p['text'][:90].replace(chr(10), ' ')}")

print("\n=== VERIFYING ALL 55 REMOVED POSTS ===")
for a in audit_log:
    if a['status'] == 'REMOVED':
        print(f"[{a['category']}] @{a['author']}: {a['text'][:85].replace(chr(10), ' ')}")
