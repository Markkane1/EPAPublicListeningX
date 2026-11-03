import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
from collections import Counter
import re

# Load the test logic
from test_pipeline_logic import kept, posts

kept_posts = [posts[k[0]] for k in kept]
print(f"Kept posts count: {len(kept_posts)}")

# 1. Exact text duplicate
exact_text = Counter(p.get('text', '').strip() for p in kept_posts)
print(f"Unique exact texts: {len(exact_text)}")
for t, c in exact_text.items():
    if c > 1:
        matches = [p for p in kept_posts if p.get('text', '').strip() == t]
        print(f"Exact Duplicate (x{c}): {t[:70]}...")
        for m in matches:
            print(f"   ID: {m.get('id')} by @{m.get('authorUsername')}")

# 2. Near duplicates: same author + high text similarity or same core text
def clean_for_sim(text):
    t = re.sub(r'https?://\S+', '', text)
    t = re.sub(r'[^\w\s]', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip().lower()
    return t

author_groups = {}
for p in kept_posts:
    handle = (p.get('authorUsername') or '').lower()
    author_groups.setdefault(handle, []).append(p)

print("\n--- SAME AUTHOR REPEATED POSTS ---")
for handle, plist in author_groups.items():
    if len(plist) > 1:
        print(f"\nAuthor @{handle} has {len(plist)} posts:")
        for p in plist:
            print(f"  [{p.get('id')}] ({p.get('createdAt')}) {p.get('text')[:90].replace(chr(10), ' ')}")
