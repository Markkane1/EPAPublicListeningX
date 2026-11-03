import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re

json_path = r"C:\Users\Asif\.gemini\antigravity\brain\a6dc8537-a91f-4ace-9851-c149428ca25f\.user_uploaded\media_1793624655821_92bfc20c.json"
with open(json_path, 'r', encoding='utf-8') as f:
    posts = json.load(f)

print(f"Total posts: {len(posts)}")

# Let's inspect all posts and categorize them
off_topic = []
indian_context = []
excluded_handles = []
urdu_script = []
duplicates = []
legit_air_quality = []

# Excluded handles: ANI, DelhiPollution, EPCCDpunjab, EPAPunjab, PSCAsafecities
EXCLUDED_USERNAMES = {"delhipollution", "ani", "epccdpunjab", "epapunjab", "pscasafecities"}

# Indian context keywords/locations:
INDIAN_TERMS = [
    r'\bdelhi\b', r'\bdehli\b', r'\bncr\b', r'\bharyana\b', r'\bnoida\b', r'\bgurugram\b', 
    r'\bindia\b', r'\bindian\b', r'\bindia\'s\b', r'\bcaqm\b', r'\bfaridkot\b', r'\bamritsar\b',
    r'\bludhiana\b', r'\bchandigarh\b', r'\bpatiala\b', r'\bjalandhar\b', r'\bbathinda\b',
    r'\baap punjab\b', r'\bhindustan\b'
]

# Off-topic patterns
OFF_TOPIC_TERMS = [
    r'cricket', r'pcbmedia', r'gadani', r'ship breaking', r'ship-breaking', r'maritime',
    r'arunachal', r'brahmaputra', r'pizza mafia', r'wedding', r'champions trophy', r'bcci'
]

# Urdu script detection (Arabic/Urdu unicode range \u0600-\u06FF)
def is_primarily_urdu(text):
    urdu_chars = len(re.findall(r'[\u0600-\u06FF]', text))
    latin_chars = len(re.findall(r'[a-zA-Z]', text))
    return urdu_chars > latin_chars and urdu_chars > 15

seen_texts = {}

for idx, p in enumerate(posts):
    pid = p.get('id')
    handle = (p.get('authorUsername') or '').lower().strip()
    text = (p.get('text') or '').strip()
    text_lower = text.lower()
    
    # 1. Excluded handle check
    if handle in EXCLUDED_USERNAMES:
        excluded_handles.append((idx, pid, handle, text[:80]))
        continue
        
    # 2. Urdu script check
    if is_primarily_urdu(text):
        urdu_script.append((idx, pid, handle, text[:80]))
        # We can note this, check if it relates to air quality
        
    # 3. Indian context check
    indian_matches = [t for t in INDIAN_TERMS if re.search(t, text_lower)]
    # Exception: if text says "Pakistan Punjab records 4.2 times more fire detections than Indian Punjab", does it belong to Pak air quality or Indian?
    # Query had: -Delhi -dehli -NCR -Haryana -Noida -Gurugram -India -india -india's
    if indian_matches:
        indian_context.append((idx, pid, handle, indian_matches, text[:100]))
        
    # 4. Off-topic check
    off_topic_matches = [t for t in OFF_TOPIC_TERMS if re.search(r'\b' + t + r'\b', text_lower)]
    if off_topic_matches:
        off_topic.append((idx, pid, handle, off_topic_matches, text[:100]))

print(f"Excluded handles: {len(excluded_handles)}")
for h in excluded_handles:
    print(f"  @{h[2]}: {h[3]}")

print(f"\nIndian context matches: {len(indian_context)}")
for ic in indian_context[:10]:
    print(f"  @{ic[2]} matched {ic[3]}: {ic[4]}")

print(f"\nOff topic matches: {len(off_topic)}")
for ot in off_topic:
    print(f"  @{ot[2]} matched {ot[3]}: {ot[4]}")

print(f"\nUrdu script posts: {len(urdu_script)}")
for u in urdu_script[:10]:
    print(f"  @{u[2]}: {u[3]}")
