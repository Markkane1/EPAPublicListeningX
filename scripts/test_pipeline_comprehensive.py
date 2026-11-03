import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re

json_path = r"C:\Users\Asif\.gemini\antigravity\brain\a6dc8537-a91f-4ace-9851-c149428ca25f\.user_uploaded\media_1793624655821_92bfc20c.json"
with open(json_path, 'r', encoding='utf-8') as f:
    posts = json.load(f)

# Excluded handles from query
EXCLUDED_HANDLES = {
    "delhipollution", "ani", "epccdpunjab", "epapunjab", "pscasafecities"
}

# Off topic indicators
OFF_TOPIC_PATTERNS = [
    r'\bcricket\b', r'\bpcbmedia\b', r'\bchampions trophy\b', r'\bbcci\b',
    r'\bgadani\b', r'\bship breaking\b', r'\bship-breaking\b', r'\bmaritime\b',
    r'\bship\b.*salvage', r'\bbeach\b.*steel', r'\bsalvaged\b',
    r'\bpizza\b', r'\bcheezious\b', r'\bkababjees\b',
    r'\bwedding\b',
    r'\barunachal\b', r'\bbrahmaputra\b', r'\bshillong\b', r'\bmanipur\b',
    r'\bzog\b', r'\bturkroach\b', r'\binbred\b', r'\biq in the world\b',
    r'\bamerica\b.*allegory',
]

# Indian domestic air pollution / politics exclusions
# (derived from query negative terms: -Delhi -dehli -NCR -Haryana -Noida -Gurugram -India -india -india's)
INDIAN_DOMESTIC_PATTERNS = [
    r'\bdelhi\b', r'\bdehli\b', r'\bncr\b', r'\bharyana\b', r'\bnoida\b', r'\bgurugram\b',
    r'\bcaqm\b', r'\bfaridkot\b', r'\bludhiana\b', r'\bchandigarh\b', r'\bpatiala\b',
    r'\bbathinda\b', r'\baap punjab\b', r'\bbjp\b', r'\bdiwali\b', r'\bcrackers\b',
    r'\bbrahmos\b', r'\brekha gov\b', r'\bnarendramodi\b', r'\bcongress\b',
    r'\bcm mann\b', r'\bbhagwant mann\b', r'\bbuddha nullah\b', r'\bkejriwal\b'
]

# Positive Air Quality Core Terms
AIR_QUALITY_PATTERNS = [
    r'\baqi\b', r'air quality', r'pollution', r'polluted', r'smog', r'clean air',
    r'cleaner air', r'pm2\.5', r'pm10', r'stubble burning', r'crop-fire', r'crop fire',
    r'crop residue', r'parali', r'smoke', r'respiratory', r'air index', r'haze',
    r'anti-smog', r'smog gun', r'environment', r'green lockdown', r'artificial rain',
    r'air burning', r'hazardous air', r'toxic air'
]
URDU_AQ_TERMS = ['سموگ', 'آلودہ', 'آلودگی', 'ہوا', 'ماحول']

# Target geographic entities
PAK_GEO_PATTERNS = [
    r'lahore', r'gujranwala', r'pakistan', r'punjab', r'faisalabad', r'multan',
    r'rawalpindi', r'islamabad', r'sialkot', r'attock', r'sheikhupura', r'kasur',
    r'sargodha', r'bahawalpur', r'sahiwal', r'peshawar', r'karachi', r'gwmc', r'lwmc',
    r'maryam', r'shehbaz'
]
URDU_GEO_TERMS = ['لاہور', 'پنجاب', 'پاکستان', 'گوجرانوالہ', 'فیصل آباد', 'ملتان', 'راولپنڈی', 'اسلام آباد']

def normalize_text_for_dedup(text):
    # Remove leading mentions like @MaryamNSharif, @MoonisElahi, etc.
    t = re.sub(r'^(?:@\w+\s*)+', '', text)
    # Remove URLs
    t = re.sub(r'https?://\S+', '', t)
    # Remove punctuation & extra spaces
    t = re.sub(r'[^\w\s]', '', t)
    t = re.sub(r'\s+', ' ', t).strip().lower()
    return t

audit_log = []
valid_posts = []
seen_normalized_texts = {}
seen_ids = set()

for idx, p in enumerate(posts):
    pid = str(p.get('id', ''))
    handle = (p.get('authorUsername') or '').lower().strip()
    text = (p.get('text') or '').strip()
    text_lower = text.lower()
    author_bio = (p.get('authorDescription') or '').lower()

    # 1. Exact ID duplicate
    if pid in seen_ids:
        audit_log.append({
            "index": idx,
            "id": pid,
            "author": handle,
            "status": "REMOVED",
            "category": "DUPLICATE_ID",
            "reason": f"Duplicate post ID {pid}",
            "text": text
        })
        continue

    # 2. Excluded accounts
    if handle in EXCLUDED_HANDLES:
        audit_log.append({
            "index": idx,
            "id": pid,
            "author": handle,
            "status": "REMOVED",
            "category": "EXCLUDED_ACCOUNT",
            "reason": f"Account @{handle} matches query negative filter (-from:@{handle})",
            "text": text
        })
        continue

    # 3. Off-topic filter
    is_off_topic = False
    for pat in OFF_TOPIC_PATTERNS:
        if re.search(pat, text_lower):
            audit_log.append({
                "index": idx,
                "id": pid,
                "author": handle,
                "status": "REMOVED",
                "category": "OFF_TOPIC",
                "reason": f"Off-topic content matching pattern: {pat}",
                "text": text
            })
            is_off_topic = True
            break
    if is_off_topic:
        continue

    # 4. Indian domestic context filter
    is_indian = False
    for pat in INDIAN_DOMESTIC_PATTERNS:
        if re.search(pat, text_lower):
            # Check if this post is actually about Pakistan / Lahore
            # (e.g. Pakistani user comparing Lahore AQI to Delhi, or Dawn report comparing Pak Punjab fires to Indian Punjab)
            has_pak_primary = any(re.search(g, text_lower) for g in ['lahore', 'pakistan', 'maryam nawaz', 'pakistani'])
            is_pure_indian_author = handle in [
                'faridkotpolice', 'caqm_official', 'pb_khabarnama', 'drshamamohd', 
                'rohini_sgh', 'archiesriva', 'rahul1979601', 'sharma_views', 'gss_views',
                'navdeepdahiya55', 'kushanmitra', 'johnsmith28vu'
            ]
            
            if is_pure_indian_author or not has_pak_primary or any(k in text_lower for k in ['caqm', 'faridkot', 'cm mann', 'bhagwant mann', 'buddha nullah', 'brahmos']):
                audit_log.append({
                    "index": idx,
                    "id": pid,
                    "author": handle,
                    "status": "REMOVED",
                    "category": "EXCLUDED_INDIAN_CONTEXT",
                    "reason": f"Matches Indian domestic exclusion criteria: {pat}",
                    "text": text
                })
                is_indian = True
                break
    if is_indian:
        continue

    # 5. Air Quality & Smog relevance
    has_aq = any(re.search(pat, text_lower) for pat in AIR_QUALITY_PATTERNS) or any(t in text for t in URDU_AQ_TERMS)
    if not has_aq:
        audit_log.append({
            "index": idx,
            "id": pid,
            "author": handle,
            "status": "REMOVED",
            "category": "NO_AIR_QUALITY_RELEVANCE",
            "reason": "Post does not contain keywords relating to AQI, air quality, smog, or environmental pollution",
            "text": text
        })
        continue

    # 6. Geographic relevance
    has_geo = any(re.search(pat, text_lower) for pat in PAK_GEO_PATTERNS) or any(t in text for t in URDU_GEO_TERMS)
    if not has_geo and any(pat in author_bio for pat in ['pakistan', 'lahore', 'punjab']):
        has_geo = True

    if not has_geo:
        audit_log.append({
            "index": idx,
            "id": pid,
            "author": handle,
            "status": "REMOVED",
            "category": "NO_GEOGRAPHIC_RELEVANCE",
            "reason": "Post does not mention Lahore, Punjab, or Pakistani locations",
            "text": text
        })
        continue

    # 7. Semantic / Near-duplicate detection
    norm_text = normalize_text_for_dedup(text)
    if len(norm_text) > 15 and norm_text in seen_normalized_texts:
        primary_post = seen_normalized_texts[norm_text]
        # Merge media URLs if new post has any
        existing_media = set(primary_post.get('mediaUrls') or [])
        new_media = set(p.get('mediaUrls') or [])
        merged_media = list(existing_media.union(new_media))
        primary_post['mediaUrls'] = merged_media
        
        # Merge likes / retweets if newer has more
        for metric in ['likes', 'retweets', 'replies', 'quotes', 'views']:
            primary_post[metric] = max(primary_post.get(metric) or 0, p.get(metric) or 0)
            
        audit_log.append({
            "index": idx,
            "id": pid,
            "author": handle,
            "status": "DUPLICATE_MERGED",
            "category": "SEMANTIC_DUPLICATE",
            "reason": f"Merged into primary post {primary_post['id']} (identical content or spam variant)",
            "text": text
        })
        continue

    # If all checks pass, record this post as clean and verified!
    seen_ids.add(pid)
    seen_normalized_texts[norm_text] = p
    
    # Enrichment
    # Extract AQI if present
    aqi_match = re.search(r'\baqi\b\s*(?:of|is|reached|crossed|at|around)?\s*[:=-]?\s*([0-9]{2,4})', text_lower)
    aqi_val = int(aqi_match.group(1)) if aqi_match else None
    if not aqi_val:
        # Check other patterns like "619 — Hazardous" or "500+ AQI"
        alt_aqi = re.search(r'([0-9]{2,4})\s*(?:\+)?\s*\baqi\b', text_lower)
        if alt_aqi:
            aqi_val = int(alt_aqi.group(1))

    # Determine Severity
    if aqi_val:
        if aqi_val >= 301:
            severity = "Hazardous"
            severity_class = "severity-hazardous"
        elif aqi_val >= 201:
            severity = "Very Unhealthy"
            severity_class = "severity-very-unhealthy"
        elif aqi_val >= 151:
            severity = "Unhealthy"
            severity_class = "severity-unhealthy"
        elif aqi_val >= 101:
            severity = "Unhealthy for Sensitive Groups"
            severity_class = "severity-sensitive"
        elif aqi_val >= 51:
            severity = "Moderate"
            severity_class = "severity-moderate"
        else:
            severity = "Good"
            severity_class = "severity-good"
    else:
        # Check if text describes hazardous / emergency / toxic
        if any(w in text_lower for w in ['hazardous', 'emergency', 'toxic', 'highest in world', 'deadly', 'chamber']):
            severity = "Severe / Hazardous Alert"
            severity_class = "severity-hazardous"
        else:
            severity = "Not Specified"
            severity_class = "severity-unspecified"

    # Detect primary city
    city = "Punjab Region"
    if 'lahore' in text_lower or 'لاہور' in text:
        city = "Lahore"
    elif 'gujranwala' in text_lower or 'گوجرانوالہ' in text:
        city = "Gujranwala"
    elif 'faisalabad' in text_lower or 'فیصل آباد' in text:
        city = "Faisalabad"
    elif 'multan' in text_lower or 'ملتان' in text:
        city = "Multan"
    elif 'attock' in text_lower:
        city = "Attock"
    elif 'rawalpindi' in text_lower or 'راولپنڈی' in text:
        city = "Rawalpindi"
    elif 'islamabad' in text_lower or 'اسلام آباد' in text:
        city = "Islamabad"
    elif 'sialkot' in text_lower:
        city = "Sialkot"

    # Category classification
    if any(w in text_lower for w in ['advisory', 'masks', 'health', 'hospital', 'infection', 'breathe', 'children', 'eyes']):
        category = "Public Health Alert"
    elif any(w in text_lower for w in ['enforcement', 'squad', 'anti-smog gun', 'crackdown', 'fines', 'challan', 'arrest', 'buses', 'e-buses', 'suthra']):
        category = "Government & Enforcement Action"
    elif any(w in text_lower for w in ['nasa', 'satellite', 'aqi', 'recorded', 'ranking', 'tops', 'weather', 'charts', 'readings']):
        category = "AQI Measurement & Satellite Data"
    elif any(w in text_lower for w in ['stubble', 'crop fire', 'parali', 'farmers', 'smoke']):
        category = "Agricultural Stubble Burning"
    else:
        category = "Citizen Outcry & Reaction"

    # Sentiment classification
    if any(w in text_lower for w in ['hell', 'killing', 'burn', 'dying', 'villain', 'worst', 'disaster', 'suffocating', 'shame']):
        sentiment = "Critical / Alarmed"
    elif any(w in text_lower for w in ['alhamdulillah', 'mashallah', 'progress', 'cleaning', 'cleanest', 'solution', 'e-buses']):
        sentiment = "Positive / Proactive"
    elif any(w in text_lower for w in ['concern', 'plea', 'wear masks', 'request', 'advise', 'stay safe']):
        sentiment = "Concerned"
    else:
        sentiment = "Informative / Neutral"

    enriched_post = dict(p)
    enriched_post.update({
        "clean_id": pid,
        "aqi_value": aqi_val,
        "severity": severity,
        "severity_class": severity_class,
        "city_detected": city,
        "category": category,
        "sentiment": sentiment,
        "has_media": bool(p.get('mediaUrls') and len(p.get('mediaUrls')) > 0),
        "media_count": len(p.get('mediaUrls') or [])
    })
    valid_posts.append(enriched_post)

    audit_log.append({
        "index": idx,
        "id": pid,
        "author": handle,
        "status": "KEPT",
        "category": "VERIFIED_VALID",
        "reason": f"Valid Pakistani air quality post for {city} ({category})",
        "text": text,
        "aqi_value": aqi_val,
        "severity": severity,
        "city": city
    })

print(f"\n==========================================")
print(f"PIPELINE TEST EXECUTION RESULTS:")
print(f"Total Raw Ingested: {len(posts)}")
print(f"Total Kept / Active Clean Posts: {len(valid_posts)}")
print(f"Duplicates Merged: {sum(1 for a in audit_log if a['status'] == 'DUPLICATE_MERGED')}")
print(f"Total Filtered Out: {sum(1 for a in audit_log if a['status'] == 'REMOVED')}")
print(f"==========================================")

# Breakdown of removed by category
rem_cats = {}
for a in audit_log:
    if a['status'] == 'REMOVED':
        rem_cats[a['category']] = rem_cats.get(a['category'], 0) + 1
print("\nRemoved Category Breakdown:")
for c, count in rem_cats.items():
    print(f"  - {c}: {count}")

# Cities breakdown
city_counts = {}
for p in valid_posts:
    c = p['city_detected']
    city_counts[c] = city_counts.get(c, 0) + 1
print("\nActive Posts by City:")
for c, count in sorted(city_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  - {c}: {count}")

# AQI stats
aqi_vals = [p['aqi_value'] for p in valid_posts if p['aqi_value']]
if aqi_vals:
    print(f"\nAQI Metrics:")
    print(f"  - Posts with specific AQI values: {len(aqi_vals)}")
    print(f"  - Peak AQI: {max(aqi_vals)}")
    print(f"  - Min AQI: {min(aqi_vals)}")
    print(f"  - Average AQI: {round(sum(aqi_vals)/len(aqi_vals), 1)}")
