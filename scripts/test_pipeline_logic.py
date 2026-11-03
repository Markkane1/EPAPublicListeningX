import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re

json_path = r"C:\Users\Asif\.gemini\antigravity\brain\a6dc8537-a91f-4ace-9851-c149428ca25f\.user_uploaded\media_1793624655821_92bfc20c.json"
with open(json_path, 'r', encoding='utf-8') as f:
    posts = json.load(f)

# Excluded handles from query
EXCLUDED_HANDLES = {"delhipollution", "ani", "epccdpunjab", "epapunjab", "pscasafecities"}

# Off topic indicators
OFF_TOPIC_PATTERNS = [
    r'\bcricket\b', r'\bpcbmedia\b', r'\bchampions trophy\b', r'\bbcci\b',
    r'\bgadani\b', r'\bship breaking\b', r'\bship-breaking\b', r'\bmaritime\b',
    r'\bpizza\b', r'\bcheezious\b', r'\bkababjees\b',
    r'\bwedding\b',
    r'\barunachal\b', r'\bbrahmaputra\b', r'\bshillong\b', r'\bmanipur\b',
    r'\bzog\b', r'\bturkroach\b', r'\binbred\b',
    r'\bamerica\b.*allegory', r'salvaged.*steel',
]

# Pure Indian domestic air pollution / politics (excluded by -Delhi -dehli -NCR -Haryana -Noida -Gurugram -India -india -india's)
INDIAN_EXCLUSIVE_PATTERNS = [
    r'\bdelhi\b', r'\bdehli\b', r'\bncr\b', r'\bharyana\b', r'\bnoida\b', r'\bgurugram\b',
    r'\bcaqm\b', r'\bfaridkot\b', r'\bludhiana\b', r'\bchandigarh\b', r'\bpatiala\b',
    r'\bbathinda\b', r'\baap punjab\b', r'\bbjp\b', r'\bdiwali\b', r'\bcrackers\b',
    r'\bbrahmos\b', r'\brekha gov\b', r'\bnarendramodi\b', r'\bcongress\b'
]

# Air quality core topics (positive query keywords)
AIR_QUALITY_PATTERNS = [
    r'\baqi\b', r'air quality', r'pollution', r'polluted', r'smog', r'clean air',
    r'cleaner air', r'pm2\.5', r'pm10', r'stubble burning', r'crop-fire', r'crop fire',
    r'crop residue', r'parali', r'smoke', r'respiratory', r'air index', r'haze',
    r'anti-smog', r'smog gun', r'environment', r'green lockdown', r'artificial rain',
    r'air burning', r'hazardous air', r'toxic air'
]

# Urdu script air quality terms
URDU_AQ_TERMS = ['سموگ', 'آلودہ', 'آلودگی', 'ہوا', 'ماحول']

# Target geographic entities (Pakistan / Punjab)
PAK_GEO_PATTERNS = [
    r'lahore', r'gujranwala', r'pakistan', r'punjab', r'faisalabad', r'multan',
    r'rawalpindi', r'islamabad', r'sialkot', r'attock', r'sheikhupura', r'kasur',
    r'sargodha', r'bahawalpur', r'sahiwal', r'peshawar', r'karachi', r'gwmc', r'lwmc',
    r'maryam', r'shehbaz'
]

kept = []
removed = []

for idx, p in enumerate(posts):
    pid = p.get('id')
    handle = (p.get('authorUsername') or '').lower().strip()
    text = (p.get('text') or '').strip()
    text_lower = text.lower()
    
    # Check 1: Excluded accounts
    if handle in EXCLUDED_HANDLES:
        removed.append((idx, pid, handle, "EXCLUDED_ACCOUNT", f"Author @{handle} is explicitly in exclusion list", text))
        continue

    # Check 2: Off-topic spam
    is_off_topic = False
    for pat in OFF_TOPIC_PATTERNS:
        if re.search(pat, text_lower):
            removed.append((idx, pid, handle, "OFF_TOPIC", f"Matches off-topic pattern '{pat}'", text))
            is_off_topic = True
            break
    if is_off_topic:
        continue

    # Check 3: Indian domestic pollution/politics exclusion (-Delhi -NCR -Haryana -India etc.)
    # Exception: Tweets from Pakistani perspective discussing transboundary smog affecting Lahore (e.g. "Lahore smog affected by stubble burning in Indian Punjab")
    # But if it's strictly Indian local news (CAQM, Delhi AQI, Faridkot police, AAP/BJP blame game)
    is_indian = False
    for pat in INDIAN_EXCLUSIVE_PATTERNS:
        if re.search(pat, text_lower):
            # Check if this is a Pakistani tweet that merely mentions Delhi or Indian Punjab in comparison (e.g. "Lahore AQI vs Delhi" or "NASA satellite fires in Indian Punjab")
            has_pak_context = any(re.search(g, text_lower) for g in ['lahore', 'pakistan', 'maryam', 'nasa', 'dw report', 'dawn'])
            is_pure_indian_author = handle in ['faridkotpolice', 'caqm_official', 'pb_khabarnama', 'drshamamohd', 'rohini_sgh', 'archiesriva', 'rahul1979601', 'sharma_views', 'gss_views']
            
            if is_pure_indian_author or ('delhi' in text_lower and not has_pak_context) or 'caqm' in text_lower or 'faridkot' in text_lower or 'brahmos' in text_lower:
                removed.append((idx, pid, handle, "EXCLUDED_INDIAN_CONTEXT", f"Matches Indian domestic exclusion pattern '{pat}'", text))
                is_indian = True
                break
    if is_indian:
        continue

    # Check 4: Must have Air Quality / Smog relevance
    has_aq = any(re.search(pat, text_lower) for pat in AIR_QUALITY_PATTERNS) or any(term in text for term in URDU_AQ_TERMS)
    if not has_aq:
        removed.append((idx, pid, handle, "NO_AIR_QUALITY_RELEVANCE", "Does not mention AQI, air quality, smog, or pollution", text))
        continue

    # Check 5: Geographic relevance to Pakistan / Punjab
    has_geo = any(re.search(pat, text_lower) for pat in PAK_GEO_PATTERNS) or any(term in text for term in ['لاہور', 'پنجاب', 'پاکستان'])
    author_bio = (p.get('authorDescription') or '').lower()
    if not has_geo and any(pat in author_bio for pat in ['pakistan', 'lahore', 'punjab']):
        has_geo = True

    if not has_geo:
        removed.append((idx, pid, handle, "NO_GEOGRAPHIC_RELEVANCE", "No mention of Lahore, Punjab, Pakistan, or Pakistani cities", text))
        continue

    kept.append((idx, pid, handle, text))

print(f"Total processed: {len(posts)}")
print(f"Kept: {len(kept)}")
print(f"Removed: {len(removed)}")

print("\n--- SUMMARY OF REMOVAL REASONS ---")
reasons = {}
for r in removed:
    reasons[r[3]] = reasons.get(r[3], 0) + 1
for k, v in reasons.items():
    print(f"  {k}: {v}")

print("\n--- SAMPLE REMOVED POSTS ---")
for r in removed[:12]:
    print(f"[{r[3]}] @{r[2]}: {r[5][:90]!r}")
