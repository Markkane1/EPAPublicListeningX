import sys
import os
import json
import csv
import re
import argparse
from datetime import datetime, timezone
from collections import Counter

try:
    from backend import sentiment_engine
except ImportError:
    try:
        import sentiment_engine
    except ImportError:
        sentiment_engine = None

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

EXCLUDED_USERNAMES = {
    "delhipollution",
    "ani",
    "ani_news",
    "epccdpunjab",
    "epapunjab",
    "pscasafecities"
}

OFF_TOPIC_PATTERNS = [
    (r'\bcricket\b', "Cricket sports scheduling & matches"),
    (r'\bpcbmedia\b', "Pakistan Cricket Board media"),
    (r'\bchampions trophy\b', "Cricket Champions Trophy"),
    (r'\bbcci\b', "Indian cricket board banter"),
    (r'\bgadani\b', "Gadani maritime ship scrapping"),
    (r'\bship breaking\b', "Maritime ship breaking"),
    (r'\bship-breaking\b', "Maritime ship breaking"),
    (r'\bmaritime\b', "Maritime ship issues"),
    (r'\bship\b.*salvage', "Ship salvage discussions"),
    (r'\bbeach\b.*steel', "Beached vessel steel salvaging"),
    (r'\bsalvaged\b.*steel', "Beached vessel steel salvaging"),
    (r'\bpizza\b', "Food / Pizza chain discussions"),
    (r'\bcheezious\b', "Fast food restaurant discussion"),
    (r'\bkababjees\b', "Fast food restaurant discussion"),
    (r'\bwedding\b', "Personal wedding / fitness remarks"),
    (r'\barunachal\b', "Arunachal Pradesh / Brahmaputra dam controversy"),
    (r'\bbrahmaputra\b', "Brahmaputra dam controversy"),
    (r'\bshillong\b', "Northeast India state discussions"),
    (r'\bmanipur\b', "Manipur politics discussions"),
    (r'\bzog\b', "Online political flame wars"),
    (r'\bturkroach\b', "Online ethnic slurs"),
    (r'\binbred\b', "Online ethnic slurs"),
    (r'\biq in the world\b', "Online trolling query"),
    (r'\bamerica\b.*allegory', "Beached ship allegory commentary"),
]

INDIAN_DOMESTIC_PATTERNS = [
    (r'\bdelhi\b', "Delhi domestic pollution discourse"),
    (r'\bdehli\b', "Delhi domestic pollution discourse"),
    (r'\bncr\b', "National Capital Region (India)"),
    (r'\bharyana\b', "Haryana state (India)"),
    (r'\bnoida\b', "Noida (India)"),
    (r'\bgurugram\b', "Gurugram (India)"),
    (r'\bgurgaon\b', "Gurgaon (India)"),
    (r'\bcaqm\b', "Commission for Air Quality Management (India)"),
    (r'\bfaridkot\b', "Faridkot district (Indian Punjab)"),
    (r'\bludhiana\b', "Ludhiana (Indian Punjab)"),
    (r'\bchandigarh\b', "Chandigarh (India)"),
    (r'\bpatiala\b', "Patiala (Indian Punjab)"),
    (r'\bbathinda\b', "Bathinda (Indian Punjab)"),
    (r'\bjalandhar\b', "Jalandhar (Indian Punjab)"),
    (r'\baap punjab\b', "Aam Aadmi Party Punjab (India)"),
    (r'\baamaadmiparty\b', "Aam Aadmi Party (India)"),
    (r'\bbjp\b', "Bharatiya Janata Party politics"),
    (r'\bdiwali\b', "Diwali firecracker pollution debates"),
    (r'\bcrackers\b', "Diwali firecracker debates"),
    (r'\bbrahmos\b', "Indian missile banter"),
    (r'\brekha gov\b', "Indian local government praise/criticism"),
    (r'\bnarendramodi\b', "Indian Prime Minister political banter"),
    (r'\bcongress\b', "Indian Congress Party political banter"),
    (r'\bcm mann\b', "Chief Minister Bhagwant Mann (Punjab, India)"),
    (r'\bbhagwant mann\b', "Chief Minister Bhagwant Mann (Punjab, India)"),
    (r'\bbuddha nullah\b', "Buddha Nullah water pollution (Ludhiana, India)"),
    (r'\bchitti bein\b', "Chitti Bein river pollution (Indian Punjab)"),
    (r'\bsatluj\b', "Satluj river pollution movement (Indian Punjab)"),
    (r'\bcpcb\b', "Central Pollution Control Board (India)"),
    (r'\bkejriwal\b', "Arvind Kejriwal Delhi air pollution debates"),
]

AIR_QUALITY_PATTERNS = [
    r'\baqi\b', r'air quality', r'pollution', r'polluted', r'smog', r'clean air',
    r'cleaner air', r'pm2\.5', r'pm10', r'stubble burning', r'crop-fire', r'crop fire',
    r'crop residue', r'parali', r'smoke', r'respiratory', r'air index', r'haze',
    r'anti-smog', r'smog gun', r'environment', r'green lockdown', r'artificial rain',
    r'air burning', r'hazardous air', r'toxic air'
]
URDU_AQ_TERMS = ['سموگ', 'آلودہ', 'آلودگی', 'ہوا', 'ماحول']

PAK_GEO_PATTERNS = [
    r'\blahore\b', r'\bgujranwala\b', r'\bpakistan\b', r'\bpunjab\b', r'\bfaisalabad\b',
    r'\bmultan\b', r'\brawalpindi\b', r'\bislamabad\b', r'\bsialkot\b', r'\battock\b',
    r'\bsheikhupura\b', r'\bkasur\b', r'\bsargodha\b', r'\bbahawalpur\b', r'\bsahiwal\b',
    r'\bpeshawar\b', r'\bkarachi\b', r'\bgwmc\b', r'\blwmc\b', r'\bmaryam\b', r'\bshehbaz\b'
]
URDU_GEO_TERMS = ['لاہور', 'پنجاب', 'پاکستان', 'گوجرانوالہ', 'فیصل آباد', 'ملتان', 'راولپنڈی', 'اسلام آباد']

# ---------------------------------------------------------------------------
# Pre-compiled regular expressions for sub-millisecond per-post evaluation
# ---------------------------------------------------------------------------
COMPILED_OFF_TOPIC = [(re.compile(pat, re.IGNORECASE), desc) for pat, desc in OFF_TOPIC_PATTERNS]
COMPILED_INDIAN = [(re.compile(pat, re.IGNORECASE), desc) for pat, desc in INDIAN_DOMESTIC_PATTERNS]
COMPILED_AQ = [re.compile(pat, re.IGNORECASE) for pat in AIR_QUALITY_PATTERNS]
COMPILED_GEO = [re.compile(pat, re.IGNORECASE) for pat in PAK_GEO_PATTERNS]
GURMUKHI_REGEX = re.compile(r'[\u0a00-\u0a7f]')
NORM_REPLY_REGEX = re.compile(r'^(?:@\w+\s*)+')
NORM_URL_REGEX = re.compile(r'https?://\S+')
NORM_PUNCT_REGEX = re.compile(r'[^\w\s]')
NORM_SPACE_REGEX = re.compile(r'\s+')

COMMON_STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
    'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
    'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
    'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
    'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
    'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
    'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
    'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself',
    'yourselves', 'will', 'today', 'yesterday', 'tomorrow', 'also', 'people', 'many', 'much', 'like', 'news'
}

COMMON_PUNJAB_LOCALITIES = [
    'muridke', 'kasur', 'raiwind', 'okara', 'wazirabad', 'kamoke', 'changa manga',
    'kot lakhpat', 'gulberg', 'model town', 'dha', 'mall road', 'anarkali', 'shahdara',
    'johar town', 'mughalpura', 'cantt', 'wapda town', 'burewala', 'vehari', 'pakpattan',
    'jhang', 'chiniot', 'khanewal', 'muzaffargarh', 'dera ghazi khan', 'dg khan',
    'mianwali', 'bhakkar', 'khushab', 'chakwal', 'jhelum', 'gujrat', 'hafizabad',
    'nankana', 'nankana sahib', 'chunian', 'pattoki', 'lodhran', 'layyah', 'bahawalnagar',
    'toba tek singh', 'mandi bahauddin', 'narowal', 'attock', 'sharaqpur', 'sheikhupura'
]

COMMON_AIR_HEALTH_TERMS = [
    'dhund', 'ghutan', 'fog', 'foggy', 'throat', 'cough', 'coughing', 'chest', 'breathing',
    'breathe', 'suffocating', 'suffocation', 'allergy', 'masks', 'mask', 'haze', 'hazy',
    'visibility', 'air index', 'atmosphere', 'inversion', 'toxic', 'smoke', 'dust', 'burning eyes',
    'burning throat', 'eye irritation', 'smoggy', 'air quality', 'air crisis', 'pollution'
]

def extract_learning_candidates(post: dict, exclusion_category: str = "", exclusion_reason: str = "") -> list:
    """
    Deterministic Non-AI Learning Heuristic:
    Analyzes an excluded post's text, author, and exclusion diagnostic to propose
    explainable rule-learning candidates (author whitelist, new AQ keywords, new localities, exception patterns).
    """
    candidates = []
    text = (post.get('text') or '').strip()
    text_lower = text.lower()
    handle = (post.get('authorUsername') or '').lower().strip().replace('@', '')

    if handle:
        candidates.append({
            "rule_type": "author_whitelist",
            "rule_value": handle,
            "label": f"Trust Author: @{handle}",
            "description": f"Whitelist @{handle} as a trusted source (bypasses generic filter constraints)",
            "recommended": True
        })

    if exclusion_category == "NO_AIR_QUALITY_RELEVANCE" or "air quality" in exclusion_reason.lower():
        found_terms = set()
        for term in COMMON_AIR_HEALTH_TERMS:
            if re.search(r'\b' + re.escape(term) + r'\b', text_lower):
                found_terms.add(term)
                candidates.append({
                    "rule_type": "aq_keyword",
                    "rule_value": term,
                    "label": f"Learn AQ Term: \"{term}\"",
                    "description": f"Add '{term}' to the positive air quality vocabulary dictionary",
                    "recommended": True
                })

        clean_tokens = re.findall(r'\b[a-zA-Z]{4,}\b', text_lower)
        unseen_tokens = [w for w in clean_tokens if w not in COMMON_STOP_WORDS and w not in found_terms and w not in handle][:2]
        for token in unseen_tokens:
            candidates.append({
                "rule_type": "aq_keyword",
                "rule_value": token,
                "label": f"Candidate AQ Keyword: \"{token}\"",
                "description": f"Add word '{token}' from post to air quality dictionary",
                "recommended": False
            })

    if exclusion_category == "NO_GEOGRAPHIC_RELEVANCE" or "geographic" in exclusion_reason.lower():
        found_locs = set()
        for loc in COMMON_PUNJAB_LOCALITIES:
            if re.search(r'\b' + re.escape(loc) + r'\b', text_lower):
                found_locs.add(loc)
                candidates.append({
                    "rule_type": "geo_keyword",
                    "rule_value": loc.title(),
                    "label": f"Learn Punjab Locality: \"{loc.title()}\"",
                    "description": f"Add '{loc.title()}' to recognized Punjab target geography",
                    "recommended": True
                })

        capitalized = re.findall(r'\b[A-Z][a-z]{3,}\b', text)
        for cap in capitalized:
            cap_lower = cap.lower()
            if cap_lower not in COMMON_STOP_WORDS and cap_lower not in found_locs and cap_lower != handle:
                candidates.append({
                    "rule_type": "geo_keyword",
                    "rule_value": cap,
                    "label": f"Candidate Locality: \"{cap}\"",
                    "description": f"Register '{cap}' as a target locality in Punjab",
                    "recommended": False
                })

    if exclusion_category == "OFF_TOPIC" or "unrelated topic" in exclusion_reason.lower():
        matched_trigger = None
        for pat, desc in OFF_TOPIC_PATTERNS:
            m = re.search(pat, text_lower)
            if m:
                matched_trigger = m.group(0)
                break
        trigger_name = matched_trigger if matched_trigger else "off_topic"
        candidates.append({
            "rule_type": "off_topic_exception",
            "rule_value": f"{trigger_name}+smog",
            "label": f"Contextual Exception: \"{trigger_name} + smog\"",
            "description": f"Do not discard posts mentioning '{trigger_name}' when smog/AQI context is present",
            "recommended": True
        })

    if exclusion_category == "EXCLUDED_INDIAN_CONTEXT":
        candidates.append({
            "rule_type": "indian_exception",
            "rule_value": "cross_border_comparison",
            "label": "Allow Transboundary/Comparison Exception",
            "description": "Permit posts comparing Indian and Pakistani pollution when Pakistan/Lahore is referenced",
            "recommended": True
        })

    return candidates

def normalize_text_for_dedup(text: str) -> str:
    """Normalizes text by stripping replies, URLs, and punctuation to detect semantic duplicates."""
    t = NORM_REPLY_REGEX.sub('', text)
    t = NORM_URL_REGEX.sub('', t)
    t = NORM_PUNCT_REGEX.sub('', t)
    return NORM_SPACE_REGEX.sub(' ', t).strip().lower()

def enrich_post(p: dict) -> dict:
    """Enriches post with AQI metrics, severity class, city detection, category, and sentiment."""
    text = (p.get('text') or '').strip()
    text_lower = text.lower()
    
    cleaned_for_aqi = re.sub(r'@[A-Za-z0-9_]+', ' ', text)
    cleaned_for_aqi = re.sub(r'https?://\S+', ' ', cleaned_for_aqi)
    cleaned_lower = cleaned_for_aqi.lower()
    
    aqi_val = None
    matches = []
    for m in re.finditer(r'\baqi\b\s*(?:of|is|reached|crossed|at|around|hit|hitting)?\s*[:=-]?\s*\b([0-9]{2,3})\b', cleaned_lower):
        try:
            val = int(m.group(1))
            if 15 <= val <= 999:
                matches.append(val)
        except ValueError:
            pass
    for m2 in re.finditer(r'\b([0-9]{2,3})\s*(?:\+)?\s*\baqi\b', cleaned_lower):
        try:
            val = int(m2.group(1))
            if 15 <= val <= 999:
                matches.append(val)
        except ValueError:
            pass
    if matches:
        aqi_val = max(matches)
    if aqi_val:
        if aqi_val >= 301:
            severity = "Hazardous"
            severity_code = "hazardous"
        elif aqi_val >= 201:
            severity = "Very Unhealthy"
            severity_code = "very_unhealthy"
        elif aqi_val >= 151:
            severity = "Unhealthy"
            severity_code = "unhealthy"
        elif aqi_val >= 101:
            severity = "Unhealthy for Sensitive Groups"
            severity_code = "sensitive"
        elif aqi_val >= 51:
            severity = "Moderate"
            severity_code = "moderate"
        else:
            severity = "Good"
            severity_code = "good"
    else:
        if any(w in text_lower for w in ['hazardous', 'emergency', 'toxic', 'highest in world', 'deadly', 'chamber', 'alarm']):
            severity = "Severe / Hazardous Alert"
            severity_code = "hazardous"
        else:
            severity = "Unspecified"
            severity_code = "unspecified"

    city = "Punjab Region"
    if re.search(r'\blahore\b', text_lower) or 'لاہور' in text:
        city = "Lahore"
    elif re.search(r'\bgujranwala\b', text_lower) or 'گوجرانوالہ' in text:
        city = "Gujranwala"
    elif re.search(r'\bfaisalabad\b', text_lower) or 'فیصل آباد' in text:
        city = "Faisalabad"
    elif re.search(r'\bmultan\b', text_lower) or 'ملتان' in text:
        city = "Multan"
    elif re.search(r'\battock\b', text_lower):
        city = "Attock"
    elif re.search(r'\brawalpindi\b', text_lower) or 'راولپنڈی' in text:
        city = "Rawalpindi"
    elif re.search(r'\bislamabad\b', text_lower) or 'اسلام آباد' in text:
        city = "Islamabad"
    elif re.search(r'\bsialkot\b', text_lower):
        city = "Sialkot"

    if any(w in text_lower for w in ['advisory', 'masks', 'health', 'hospital', 'infection', 'breathe', 'children', 'eyes']):
        category = "Public Health Alert"
    elif any(w in text_lower for w in ['enforcement', 'squad', 'anti-smog gun', 'crackdown', 'fines', 'challan', 'arrest', 'buses', 'e-buses', 'suthra', 'inspection']):
        category = "Government & Enforcement Action"
    elif any(w in text_lower for w in ['nasa', 'satellite', 'ranking', 'tops', 'charts', 'readings', 'monitored', 'iqair', 'paqi']):
        category = "AQI Measurement & Satellite Data"
    elif any(w in text_lower for w in ['stubble', 'crop fire', 'parali', 'farmers', 'straw', 'burning']):
        category = "Agricultural Stubble Burning"
    else:
        category = "Citizen Outcry & Reaction"

    sentiment = "Informative / Neutral"
    sentiment_score = 0.0
    sentiment_engine_used = "vader"
    sentiment_confidence = 0.5
    emotion = "Neutral / Reporting"

    if sentiment_engine is not None:
        try:
            from backend import database
            configured_engine = database.get_settings().get('sentiment_engine', 'vader')
        except Exception:
            configured_engine = 'vader'
        s_res = sentiment_engine.analyze_text(text, engine=configured_engine)
        sentiment = s_res.get('sentiment', 'Informative / Neutral')
        sentiment_score = s_res.get('sentiment_score', 0.0)
        sentiment_engine_used = s_res.get('sentiment_engine', configured_engine)
        sentiment_confidence = s_res.get('sentiment_confidence', 0.5)
        emotion = s_res.get('emotion', 'Neutral / Reporting')
    else:
        if any(w in text_lower for w in ['hell', 'killing', 'burn', 'dying', 'villain', 'worst', 'disaster', 'suffocating', 'shame', 'choking']):
            sentiment = "Critical / Alarmed"
            emotion = "Outrage / Panic"
            sentiment_score = -0.75
        elif any(w in text_lower for w in ['alhamdulillah', 'mashallah', 'progress', 'cleaning', 'cleanest', 'solution', 'e-buses', 'commendable', 'milestone']):
            sentiment = "Positive / Solution-Oriented"
            emotion = "Constructive / Praise"
            sentiment_score = 0.70
        elif any(w in text_lower for w in ['concern', 'plea', 'wear masks', 'request', 'advise', 'stay safe', 'precaution']):
            sentiment = "Concerned"
            emotion = "High Concern"
            sentiment_score = -0.35
        else:
            sentiment = "Informative / Neutral"
            emotion = "Neutral / Reporting"
            sentiment_score = 0.0

    raw_media = p.get('mediaUrls') or []
    if isinstance(raw_media, str):
        media_list = [u.strip() for u in raw_media.split(';') if u.strip()]
    elif isinstance(raw_media, list):
        media_list = [u for u in raw_media if isinstance(u, str) and u.strip()]
    else:
        media_list = []

    likes = int(p.get('likes') or 0)
    retweets = int(p.get('retweets') or 0)
    replies = int(p.get('replies') or 0)
    quotes = int(p.get('quotes') or 0)
    views = int(p.get('views') or 0)
    engagement = likes + retweets * 2 + replies * 2 + quotes * 2

    enriched = dict(p)
    enriched.update({
        "clean_id": str(p.get('id', '')),
        "postUrl": p.get('postUrl') or f"https://x.com/{p.get('authorUsername')}/status/{p.get('id')}",
        "aqi_value": aqi_val,
        "severity": severity,
        "severity_code": severity_code,
        "city_detected": city,
        "category": category,
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "sentiment_engine": sentiment_engine_used,
        "sentiment_confidence": sentiment_confidence,
        "emotion": emotion,
        "mediaUrls": media_list,
        "has_media": len(media_list) > 0,
        "media_count": len(media_list),
        "total_engagement": engagement,
        "authorVerified": bool(p.get('authorVerified', False))
    })
    return enriched

def _as_count(value):
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0

def _media_urls(post):
    raw = post.get("mediaUrls")
    if raw is None:
        raw = post.get("media_urls") or []
    if isinstance(raw, str):
        stripped = raw.strip()
        if stripped.startswith("["):
            try:
                parsed = json.loads(stripped)
                raw = parsed if isinstance(parsed, list) else []
            except json.JSONDecodeError:
                raw = [part.strip() for part in raw.split(";") if part.strip()]
        else:
            raw = [part.strip() for part in raw.split(";") if part.strip()]
    if not isinstance(raw, list):
        return []
    return [item.strip() for item in raw if isinstance(item, str) and item.strip()]

def _merge_engagement(primary, incoming):
    """Keep the higher engagement counts and the union of media URLs."""
    merged = []
    seen = set()
    for url in _media_urls(primary) + _media_urls(incoming):
        if url not in seen:
            seen.add(url)
            merged.append(url)
    primary["mediaUrls"] = merged
    primary["media_count"] = len(merged)
    primary["has_media"] = bool(merged)
    for metric in ("likes", "retweets", "replies", "quotes", "views", "bookmarks"):
        primary[metric] = max(_as_count(primary.get(metric)), _as_count(incoming.get(metric)))
    primary["total_engagement"] = (
        _as_count(primary.get("likes"))
        + _as_count(primary.get("retweets")) * 2
        + _as_count(primary.get("replies")) * 2
        + _as_count(primary.get("quotes")) * 2
    )
    return primary

def process_dataset(raw_posts: list, learned_rules: dict = None, existing_posts: list = None, query_constraints: dict = None) -> tuple:
    """
    Processes raw posts list, applies filtering, deduplication against existing database posts,
    negative query restrictions, non-AI learned rules, and US EPA enrichment.
    Ensures identical restrictions are enforced on batch ingested posts and API-fetched posts alike.
    Returns (valid_posts, audit_log, noise_posts).
    """
    if learned_rules is None:
        learned_rules = {
            "aq_keywords": [],
            "geo_keywords": [],
            "author_whitelist": set(),
            "off_topic_exceptions": [],
            "indian_exceptions": []
        }

    learned_authors = set(a.lower().strip().replace('@', '') for a in learned_rules.get("author_whitelist", []))
    learned_aq_list = [k.strip().lower() for k in learned_rules.get("aq_keywords", []) if k.strip()]
    learned_geo_list = [k.strip().lower() for k in learned_rules.get("geo_keywords", []) if k.strip()]
    learned_exceptions = [e.strip().lower() for e in learned_rules.get("off_topic_exceptions", []) if e.strip()]
    has_indian_comparison_rule = any("comparison" in str(e).lower() or "cross_border" in str(e).lower() for e in learned_rules.get("indian_exceptions", []))

    # Initialize seen IDs and normalized text mapping from existing DB posts
    seen_ids = set()
    seen_normalized_texts = {}
    id_index = {}
    saved_ids = set()

    def queue_for_save(post):
        sid = str(post.get("id") or post.get("clean_id") or "").strip()
        if not sid or sid in saved_ids:
            return
        saved_ids.add(sid)
        valid_posts.append(post)

    if existing_posts:
        for ep in existing_posts:
            eid = str(ep.get('id') or ep.get('clean_id') or '').strip()
            if eid:
                seen_ids.add(eid)
                id_index[eid] = ep
            txt = ep.get('text') or ''
            norm = normalize_text_for_dedup(txt)
            if len(norm) > 15:
                seen_normalized_texts[norm] = ep

    # Integrate query constraints dynamically from active constraint profile
    active_excluded_authors = set(EXCLUDED_USERNAMES)
    active_indian_patterns = list(COMPILED_INDIAN)

    if query_constraints:
        for a in query_constraints.get('excluded_authors', []):
            clean_a = a.lower().strip().replace('@', '')
            if clean_a:
                active_excluded_authors.add(clean_a)
        for kw in query_constraints.get('excluded_keywords', []):
            kw_clean = kw.strip().lower()
            if kw_clean and not any(kw_clean in pat.lower() for pat, _ in INDIAN_DOMESTIC_PATTERNS):
                active_indian_patterns.append((re.compile(r'\b' + re.escape(kw_clean) + r'\b', re.IGNORECASE), f"Query negative exclusion (-{kw_clean})"))

    valid_posts = []
    audit_log = []
    noise_posts = []

    def record_noise(idx, pid, handle, text, category, reason, post_dict):
        raw_media = post_dict.get('mediaUrls') or []
        if isinstance(raw_media, str):
            media_list = [u.strip() for u in raw_media.split(';') if u.strip()]
        elif isinstance(raw_media, list):
            media_list = [u for u in raw_media if isinstance(u, str) and u.strip()]
        else:
            media_list = []

        audit_log.append({
            "index": idx,
            "id": pid,
            "author": handle,
            "status": "REMOVED",
            "category": category,
            "reason": reason,
            "text": text
        })

        noise_posts.append({
            "id": str(pid),
            "author_username": handle,
            "author_name": post_dict.get('authorName') or handle,
            "text": text,
            "created_at": post_dict.get('createdAt') or datetime.now(timezone.utc).isoformat(),
            "post_url": post_dict.get('postUrl') or f"https://x.com/{handle}/status/{pid}",
            "media_urls": media_list,
            "likes": int(post_dict.get('likes') or 0),
            "retweets": int(post_dict.get('retweets') or 0),
            "replies": int(post_dict.get('replies') or 0),
            "quotes": int(post_dict.get('quotes') or 0),
            "views": post_dict.get('views'),
            "author_avatar": post_dict.get('authorAvatar') or "",
            "author_verified": bool(post_dict.get('authorVerified')),
            "author_description": post_dict.get('authorDescription') or "",
            "exclusion_category": category,
            "exclusion_reason": reason,
            "raw_json": json.dumps(post_dict, ensure_ascii=False),
            "status": "EXCLUDED",
            "ingested_at": datetime.now(timezone.utc).isoformat()
        })

    for idx, p in enumerate(raw_posts):
        pid = str(p.get('id', ''))
        handle = (p.get('authorUsername') or '').lower().strip().replace('@', '')
        text = (p.get('text') or '').strip()
        text_lower = text.lower()
        author_bio = (p.get('authorDescription') or '').lower()

        is_trusted_author = handle in learned_authors

        # 1. Exact ID Deduplication (checks both batch and existing DB records)
        if pid and pid in seen_ids:
            primary = id_index.get(pid)
            if primary is not None:
                _merge_engagement(primary, p)
                queue_for_save(primary)
            audit_log.append({
                "index": idx,
                "id": pid,
                "author": handle,
                "status": "DUPLICATE_MERGED",
                "category": "DUPLICATE_ID",
                "reason": f"Duplicate post ID {pid} already indexed in system database",
                "text": text
            })
            continue

        # 2. Excluded Accounts
        if handle in active_excluded_authors and not is_trusted_author:
            record_noise(idx, pid, handle, text, "EXCLUDED_ACCOUNT",
                         f"Author @{handle} matches query negative constraint (-from:@{handle})", p)
            continue

        # 3. Gurmukhi Script Filter (Indian Punjab domestic discourse)
        if GURMUKHI_REGEX.search(text):
            record_noise(idx, pid, handle, text, "EXCLUDED_INDIAN_CONTEXT",
                         "Contains Gurmukhi script associated with Indian Punjab domestic affairs", p)
            continue

        # 4. Off-Topic Noise Filter
        off_topic_reason = None
        for pat_re, desc in COMPILED_OFF_TOPIC:
            if pat_re.search(text_lower):
                has_exception = False
                for exc in learned_exceptions:
                    parts = [pt.strip() for pt in exc.split('+') if pt.strip()]
                    if parts and all(pt in text_lower for pt in parts):
                        has_exception = True
                        break

                has_strong_aq = any(a.search(text_lower) for a in COMPILED_AQ)
                has_strong_geo = any(g.search(text_lower) for g in COMPILED_GEO)

                if is_trusted_author or has_exception or (has_strong_aq and has_strong_geo and "cricket" in text_lower and "smog" in text_lower):
                    off_topic_reason = None
                    break
                else:
                    off_topic_reason = desc
                    break

        if off_topic_reason:
            record_noise(idx, pid, handle, text, "OFF_TOPIC", f"Unrelated topic: {off_topic_reason}", p)
            continue

        # 5. Indian Domestic Context & Negative Keyword Filters
        indian_reason = None
        for pat_re, desc in active_indian_patterns:
            if pat_re.search(text_lower):
                has_pak_primary = any(re.search(g, text_lower) for g in ['lahore', 'pakistan', 'maryam nawaz', 'pakistani'])
                is_pure_indian_author = handle in [
                    'faridkotpolice', 'caqm_official', 'pb_khabarnama', 'drshamamohd', 
                    'rohini_sgh', 'archiesriva', 'rahul1979601', 'sharma_views', 'gss_views',
                    'navdeepdahiya55', 'kushanmitra', 'johnsmith28vu', 'nikku_aap', 'tejasvi_minhas', 'aappunjab'
                ]
                has_pure_indian_terms = any(k in text_lower for k in [
                    'caqm', 'faridkot', 'cm mann', 'bhagwant mann', 'buddha nullah', 
                    'brahmos', 'gurgaon', 'gurugram', 'jalandhar', 'sutlej', 'chitti bein'
                ])

                if has_indian_comparison_rule and has_pak_primary and not is_pure_indian_author:
                    indian_reason = None
                    break
                elif is_pure_indian_author or has_pure_indian_terms or not has_pak_primary:
                    indian_reason = desc
                    break

        if indian_reason and not is_trusted_author:
            record_noise(idx, pid, handle, text, "EXCLUDED_INDIAN_CONTEXT",
                         f"Matches negative query criteria: {indian_reason}", p)
            continue

        # 6. Positive Air Quality Relevance Constraint
        has_aq = (
            is_trusted_author or
            any(pat.search(text_lower) for pat in COMPILED_AQ) or
            any(t in text for t in URDU_AQ_TERMS) or
            any(re.search(r'\b' + re.escape(kw) + r'\b', text_lower) for kw in learned_aq_list)
        )
        if not has_aq:
            record_noise(idx, pid, handle, text, "NO_AIR_QUALITY_RELEVANCE",
                         "Does not contain positive air quality, smog, or pollution keywords", p)
            continue

        # 7. Positive Geographic Relevance Constraint
        has_geo = (
            is_trusted_author or
            any(pat.search(text_lower) for pat in COMPILED_GEO) or
            any(t in text for t in URDU_GEO_TERMS) or
            any(re.search(r'\b' + re.escape(kw) + r'\b', text_lower) for kw in learned_geo_list)
        )
        if not has_geo and any(pat in author_bio for pat in ['pakistan', 'lahore', 'punjab']):
            has_geo = True

        if not has_geo:
            record_noise(idx, pid, handle, text, "NO_GEOGRAPHIC_RELEVANCE",
                         "Does not relate geographically to Lahore, Pakistani Punjab, or Pakistan", p)
            continue

        # 8. Semantic Duplicate Merging (updates existing post metrics if duplicate text)
        norm_text = normalize_text_for_dedup(text)
        if len(norm_text) > 15 and norm_text in seen_normalized_texts:
            primary_post = seen_normalized_texts[norm_text]
            _merge_engagement(primary_post, p)
            queue_for_save(primary_post)

            primary_clean_id = primary_post.get('clean_id') or primary_post.get('id') or pid
            audit_log.append({
                "index": idx,
                "id": pid,
                "author": handle,
                "status": "DUPLICATE_MERGED",
                "category": "SEMANTIC_DUPLICATE",
                "reason": f"Consolidated into primary post ID {primary_clean_id} (identical text or promotional repost)",
                "text": text
            })
            continue

        # 9. Enrichment with AQI metric, severity, city detection, category, and sentiment analysis
        enriched = enrich_post(p)
        seen_ids.add(pid)
        if pid:
            id_index[pid] = enriched
        seen_normalized_texts[norm_text] = enriched
        queue_for_save(enriched)

        audit_log.append({
            "index": idx,
            "id": pid,
            "author": handle,
            "status": "KEPT",
            "category": "VERIFIED_VALID",
            "reason": f"Verified air quality post for {enriched['city_detected']} ({enriched['category']})",
            "text": text,
            "aqi_value": enriched['aqi_value'],
            "severity": enriched['severity'],
            "city": enriched['city_detected']
        })

    return valid_posts, audit_log, noise_posts

def run_pipeline(input_path: str, output_path: str, audit_path: str) -> dict:
    """Executes the full pipeline from input JSON to output JSON and audit log."""
    print(f"[*] Ingesting raw posts from: {input_path}")
    with open(input_path, 'r', encoding='utf-8') as f:
        raw_posts = json.load(f)

    total_ingested = len(raw_posts)
    print(f"[*] Total raw scraped posts ingested: {total_ingested}")

    valid_posts, audit_log, noise_posts = process_dataset(raw_posts)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(valid_posts, f, indent=2, ensure_ascii=False)
    print(f"[+] Cleaned posts saved to: {output_path} ({len(valid_posts)} items)")

    csv_path = os.path.splitext(output_path)[0] + ".csv"
    fieldnames = [
        'clean_id', 'postUrl', 'createdAt', 'authorUsername', 'authorName', 'authorVerified',
        'city_detected', 'aqi_value', 'severity', 'category', 'sentiment',
        'total_engagement', 'likes', 'retweets', 'replies', 'quotes', 'views',
        'has_media', 'media_count', 'mediaUrls', 'text'
    ]
    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for p in valid_posts:
            row = dict(p)
            if isinstance(row.get('mediaUrls'), list):
                row['mediaUrls'] = ' ; '.join(row['mediaUrls'])
            # Neutralize CSV formula injection (CWE-1236)
            for k, v in row.items():
                if isinstance(v, str) and v and v[0] in ('=', '+', '-', '@', '\t', '\r'):
                    row[k] = "'" + v
            writer.writerow(row)
    print(f"[+] Cleaned posts CSV saved to: {csv_path} ({len(valid_posts)} rows)")

    if audit_path:
        os.makedirs(os.path.dirname(os.path.abspath(audit_path)), exist_ok=True)
        with open(audit_path, 'w', encoding='utf-8') as f:
            json.dump(audit_log, f, indent=2, ensure_ascii=False)
        print(f"[+] Audit log saved to: {audit_path}")

    merged_count = sum(1 for a in audit_log if a['status'] == 'DUPLICATE_MERGED')
    removed_count = sum(1 for a in audit_log if a['status'] == 'REMOVED')
    aqi_values = [p['aqi_value'] for p in valid_posts if p['aqi_value']]
    peak_aqi = max(aqi_values) if aqi_values else None
    avg_aqi = round(sum(aqi_values) / len(aqi_values), 1) if aqi_values else None

    city_breakdown = Counter(p['city_detected'] for p in valid_posts)
    category_breakdown = Counter(p['category'] for p in valid_posts)
    removal_breakdown = Counter(a['category'] for a in audit_log if a['status'] == 'REMOVED')

    summary = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_ingested": total_ingested,
        "valid_clean_posts": len(valid_posts),
        "duplicates_merged": merged_count,
        "total_removed": removed_count,
        "peak_aqi": peak_aqi,
        "avg_aqi": avg_aqi,
        "city_breakdown": dict(city_breakdown),
        "category_breakdown": dict(category_breakdown),
        "removal_breakdown": dict(removal_breakdown)
    }

    print("\n" + "=" * 50)
    print("EPA PUNJAB SOCIAL LISTENING PIPELINE SUMMARY")
    print("=" * 50)
    print(f"Total Scraped Ingested : {total_ingested}")
    print(f"Verified Clean Posts   : {len(valid_posts)}")
    print(f"Duplicates Merged      : {merged_count}")
    print(f"Total Filtered Out     : {removed_count}")
    print(f"Peak Recorded AQI      : {peak_aqi}")
    print(f"Average Recorded AQI   : {avg_aqi}")
    print("\nRemoved Categories:")
    for cat, count in removal_breakdown.items():
        print(f"  - {cat}: {count}")
    print("\nClean Posts by City:")
    for city, count in city_breakdown.most_common():
        print(f"  - {city}: {count}")
    print("=" * 50 + "\n")

    return summary

def main():
    parser = argparse.ArgumentParser(description="EPA Punjab Social Listening Pipeline")
    parser.add_argument("--input", default="data/raw_scraped_posts.json", help="Path to raw scraped JSON file")
    parser.add_argument("--output", default="data/cleaned_epa_posts.json", help="Path to output cleaned JSON file")
    parser.add_argument("--audit", default="data/cleaning_audit.json", help="Path to output audit JSON file")
    args = parser.parse_args()

    run_pipeline(args.input, args.output, args.audit)

if __name__ == "__main__":
    main()
