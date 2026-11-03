import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
from collections import Counter
import re

json_path = r"C:\Users\Asif\.gemini\antigravity\brain\a6dc8537-a91f-4ace-9851-c149428ca25f\.user_uploaded\media_1793624655821_92bfc20c.json"
with open(json_path, 'r', encoding='utf-8') as f:
    posts = json.load(f)

print(f"Total posts loaded: {len(posts)}")

# 1. Exact text duplicates
text_counts = Counter(p.get('text', '').strip() for p in posts)
dup_texts = {t: c for t, c in text_counts.items() if c > 1}
print(f"\nExact duplicate text occurrences: {len(dup_texts)}")
for t, c in dup_texts.items():
    print(f"Count {c}: {t[:100]}...")
    matching = [p for p in posts if p.get('text', '').strip() == t]
    for m in matching:
        print(f"   -> ID: {m.get('id')} by @{m.get('authorUsername')} at {m.get('createdAt')}")

# 2. Near-duplicate / URL-normalized text check
def normalize_text(text):
    # remove urls, punctuation, lowercase
    t = re.sub(r'https?://\S+', '', text)
    t = re.sub(r'[@#]\S+', '', t)
    t = re.sub(r'\s+', ' ', t).strip().lower()
    return t

norm_counts = Counter(normalize_text(p.get('text', '')) for p in posts)
near_dups = {t: c for t, c in norm_counts.items() if c > 1 and len(t) > 20}
print(f"\nNear-duplicate text occurrences (normalized): {len(near_dups)}")
for t, c in list(near_dups.items())[:10]:
    print(f"Count {c}: {t[:100]}...")

# 3. Check negative keywords / accounts from Query
# Query: (AQI OR "air quality" OR pollution OR smog or "clean air") (Lahore or gujranwala OR Pakistan OR Punjab) -Delhi -dehli -NCR -Haryana -Noida -Gurugram -India -india -india's -from:DelhiPollution -from:@ANI -from:@EPCCDpunjab -from:@EPAPunjab lang:en until:2026-11-02 since:2026-11-01
neg_keywords = ["delhi", "dehli", "ncr", "haryana", "noida", "gurugram", "india", "india's", "indian"]
neg_accounts = ["delhipollution", "ani", "epccdpunjab", "epapunjab", "pscasafecities"]

has_neg_kw = []
has_neg_acc = []

for i, p in enumerate(posts):
    text_lower = p.get('text', '').lower()
    uname_lower = (p.get('authorUsername') or '').lower()
    
    found_kw = [k for k in neg_keywords if re.search(r'\b' + re.escape(k) + r'\b', text_lower)]
    if found_kw:
        has_neg_kw.append((i, p.get('id'), p.get('authorUsername'), found_kw, p.get('text')[:120]))
        
    found_acc = [a for a in neg_accounts if a in uname_lower]
    if found_acc:
        has_neg_acc.append((i, p.get('id'), p.get('authorUsername'), found_acc))

print(f"\nPosts matching negative keywords: {len(has_neg_kw)}")
for item in has_neg_kw[:10]:
    print(f"  ID {item[1]} by @{item[2]} matched {item[3]}: {item[4]}")

print(f"\nPosts matching negative accounts: {len(has_neg_acc)}")
for item in has_neg_acc:
    print(f"  ID {item[1]} by @{item[2]} matched {item[3]}")
