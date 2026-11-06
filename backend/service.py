import os
import re
import sys
import json
from datetime import datetime, timezone

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend import database
from backend import x_api_client
from backend import taxonomy
from backend import classifier
import pipeline

def initialize_service():
    """Initializes SQLite database and seeds default data if needed."""
    database.init_db()

def get_current_settings():
    """Retrieves settings with ALL sensitive fields removed/masked for client presentation.
    Raw API keys, secrets, and bearer tokens are NEVER returned to the client.
    """
    settings = database.get_settings()
    token = settings.get("x_bearer_token", "")
    api_key = settings.get("x_api_key", "")
    api_secret = settings.get("x_api_secret", "")
    turnstile_site_key = settings.get("turnstile_site_key", "1x00000000000000000000AA")
    turnstile_secret_key = settings.get("turnstile_secret_key", "")

    # Build a safe response dict - copy only non-sensitive keys
    _SENSITIVE_KEYS = {"x_bearer_token", "x_api_key", "x_api_secret", "turnstile_secret_key"}
    safe_settings = {k: v for k, v in settings.items() if k not in _SENSITIVE_KEYS}

    # Expose presence flags (boolean) but never the raw values
    safe_settings["has_bearer_token"] = bool(token.strip())
    safe_settings["has_api_key"] = bool(api_key.strip())
    safe_settings["has_api_secret"] = bool(api_secret.strip())
    safe_settings["turnstile_site_key"] = turnstile_site_key  # site key is public
    safe_settings["has_turnstile_secret"] = bool(turnstile_secret_key.strip())

    # Provide a safely-masked bearer token preview (first 4, last 4 chars)
    if token.strip():
        if len(token) > 10:
            safe_settings["x_bearer_token_masked"] = f"{token[:4]}...{token[-4:]}"
        else:
            safe_settings["x_bearer_token_masked"] = "****"
    else:
        safe_settings["x_bearer_token_masked"] = ""

    stats = database.get_db_stats()
    safe_settings["total_posts_in_db"] = stats["totalPosts"]
    return safe_settings

def update_settings(new_settings: dict):
    """Updates settings in the database."""
    api_key = new_settings.get("x_api_key", "").strip()
    api_secret = new_settings.get("x_api_secret", "").strip()
    bearer_token = new_settings.get("x_bearer_token", "").strip()

    if api_key and api_secret and not bearer_token:
        try:
            exchanged_token = x_api_client.get_bearer_token_from_credentials(api_key, api_secret)
            new_settings["x_bearer_token"] = exchanged_token
        except Exception as e:
            print(f"[!] Warning: OAuth2 client_credentials token exchange failed: {e}")

    endpoint = new_settings.get("x_api_endpoint")
    if isinstance(endpoint, str) and endpoint.strip() and not x_api_client.is_official_x_api_url(endpoint):
        raise ValueError("X API endpoint must use https and host api.twitter.com or api.x.com.")

    updated = database.save_settings(new_settings)
    return get_current_settings()

def test_x_credentials(bearer_token: str = None, api_key: str = None, api_secret: str = None):
    """Verifies X API credentials."""
    if not bearer_token:
        settings = database.get_settings()
        bearer_token = settings.get("x_bearer_token", "").strip()

    if not bearer_token and api_key and api_secret:
        try:
            bearer_token = x_api_client.get_bearer_token_from_credentials(api_key, api_secret)
        except Exception as e:
            return {"success": False, "message": f"OAuth token exchange failed: {str(e)}"}

    if not bearer_token:
        return {"success": False, "message": "No Bearer Token provided. Please enter a valid token."}

    settings = database.get_settings()
    endpoint = settings.get("x_api_endpoint", x_api_client.DEFAULT_ENDPOINT)
    return x_api_client.test_connection(bearer_token, endpoint_url=endpoint)

def parse_query_constraints(query_text: str) -> dict:
    """Extracts negative exclusions and account filters from an active search query string."""
    if not query_text:
        return {"excluded_authors": [], "excluded_keywords": [], "negatives": []}
    tokens = query_text.split()
    negatives = [tok for tok in tokens if tok.startswith('-')]
    excluded_authors = []
    excluded_keywords = []
    for tok in negatives:
        clean = tok.lstrip('-').replace('"', '').replace("'", "").strip()
        if clean.lower().startswith('from:'):
            handle = clean.split(':', 1)[1].lstrip('@').lower().strip()
            if handle:
                excluded_authors.append(handle)
        else:
            if clean:
                excluded_keywords.append(clean.lower())
    return {
        "excluded_authors": excluded_authors,
        "excluded_keywords": excluded_keywords,
        "negatives": negatives
    }

def build_effective_api_query(keyword: str, active_query_text: str) -> str:
    """
    Constructs the effective query string for X API v2.
    A keyword is added in front of the active query's parenthesized groups and negatives.
    """
    kw = (keyword or "").strip()
    base = active_query_text.strip() if active_query_text else ""
    if not kw:
        if not base:
            base = "Lahore smog"
        if "-is:retweet" not in base:
            base += " -is:retweet"
        if "lang:en" not in base:
            base += " lang:en"
        return base

    groups = re.findall(r"\([^)]*\)", base)
    constraints = parse_query_constraints(base)
    parts = [f"({kw})"]
    parts.extend(groups)
    if constraints["negatives"]:
        parts.append(" ".join(constraints["negatives"]))
    if "lang:en" not in kw:
        parts.append("lang:en")
    parts.append("-is:retweet")
    return " ".join(part for part in parts if part)

def _search_failure(message: str, query_str: str = "") -> dict:
    return {
        "success": False,
        "mode": "x_api",
        "isSimulated": False,
        "error": message,
        "queryUsed": query_str,
        "fetchedCount": 0,
        "verifiedCount": 0,
        "newPosts": [],
        "noisePosts": [],
        "allPosts": [],
        "auditLog": [],
        "stats": database.get_db_stats(),
    }

def format_noise_post_for_client(p: dict) -> dict:
    """Formats a noise post ensuring uniform camelCase and snake_case properties for frontend and API consumers."""
    pid = str(p.get('id') or p.get('clean_id') or '')
    media_raw = p.get('media_urls') or p.get('mediaUrls') or []
    if isinstance(media_raw, str):
        try:
            import json
            media_list = json.loads(media_raw)
        except Exception:
            media_list = [media_raw] if media_raw else []
    else:
        media_list = media_raw or []

    author_username = (p.get('author_username') or p.get('authorUsername') or '').replace('@', '').strip()
    exclusion_cat = p.get('exclusion_category') or p.get('exclusionCategory') or 'OFF_TOPIC'
    exclusion_rsn = p.get('exclusion_reason') or p.get('exclusionReason') or 'Filtered as noise'
    created_val = p.get('created_at') or p.get('createdAt')

    return {
        'id': pid,
        'clean_id': pid,
        'authorUsername': author_username,
        'author_username': author_username,
        'authorName': p.get('author_name') or p.get('authorName') or '',
        'author_name': p.get('author_name') or p.get('authorName') or '',
        'text': p.get('text') or '',
        'createdAt': created_val,
        'created_at': created_val,
        'postUrl': p.get('post_url') or p.get('postUrl') or (f'https://x.com/{author_username}/status/{pid}' if author_username and pid else None),
        'mediaUrls': media_list,
        'media_urls': media_list,
        'likes': int(p.get('likes') or 0),
        'retweets': int(p.get('retweets') or 0),
        'replies': int(p.get('replies') or 0),
        'quotes': int(p.get('quotes') or 0),
        'views': p.get('views'),
        'authorAvatar': p.get('author_avatar') or p.get('authorAvatar') or '',
        'authorVerified': bool(p.get('author_verified') or p.get('authorVerified')),
        'authorDescription': p.get('author_description') or p.get('authorDescription') or '',
        'exclusionCategory': exclusion_cat,
        'exclusion_category': exclusion_cat,
        'exclusionReason': exclusion_rsn,
        'exclusion_reason': exclusion_rsn,
        'status': p.get('status') or 'EXCLUDED',
        'ingestedAt': p.get('ingested_at') or p.get('ingestedAt'),
    }

def execute_search_and_fetch(keyword: str, live_override: bool = False, max_results: int = 25, simulate_if_missing: bool = True):
    """
    Executes search and applies the full pipeline to API-fetched posts:
    - If in live X API mode: queries X API endpoint with active negative constraints,
      transforms response, runs full pipeline deduplication (against existing DB posts),
      negative exclusions, Indian domestic checks, off-topic filtering, AQ & Geo relevance,
      and sentiment enrichment. Excluded posts are stored in noise_posts.
    - If in file ingestion mode: searches existing local DB posts and returns matches.
    """
    settings = database.get_settings()
    data_source = settings.get("data_source", "file")
    bearer_token = settings.get("x_bearer_token", "").strip()
    endpoint = settings.get("x_api_endpoint", x_api_client.DEFAULT_ENDPOINT)

    active_query_obj = database.get_active_query_version_db()
    active_query_text = active_query_obj.get("queryText", "") if active_query_obj else ""
    query_constraints = parse_query_constraints(active_query_text)

    is_live_mode = (data_source == "x_api" or live_override is True)

    if is_live_mode:
        query_str = build_effective_api_query(keyword, active_query_text)
        if not bearer_token:
            return _search_failure(
                "X API Bearer Token is not configured. Please enter your credentials in Settings.",
                query_str,
            )
        try:
            api_resp = x_api_client.search_recent_tweets(
                query=query_str,
                bearer_token=bearer_token,
                max_results=max_results,
                endpoint_url=endpoint
            )
            raw_posts = x_api_client.transform_x_response(api_resp)
        except x_api_client.XApiError as err:
            return _search_failure(str(err), query_str)
        is_simulated = False

        # Load existing posts from database so deduplication and duplicate merging apply to API-fetched posts!
        existing_posts = database.get_posts_for_dedup()
        learned_rules = database.get_active_learned_rules()

        valid_posts, audit_log, noise_posts = pipeline.process_dataset(
            raw_posts,
            learned_rules=learned_rules,
            existing_posts=existing_posts,
            query_constraints=query_constraints
        )

        if valid_posts:
            database.save_posts_batch(valid_posts, source="x_api")
        if noise_posts:
            database.save_noise_posts_batch(noise_posts)
        if audit_log:
            database.save_audit_logs_batch(audit_log)

        stats = database.get_db_stats()

        return {
            "success": True,
            "mode": "x_api",
            "isSimulated": is_simulated,
            "queryUsed": query_str,
            "fetchedCount": len(raw_posts),
            "verifiedCount": len(valid_posts),
            "exactDuplicates": len([a for a in audit_log if a.get("category") == "DUPLICATE_ID"]),
            "semanticDuplicates": len([a for a in audit_log if a.get("category") == "SEMANTIC_DUPLICATE"]),
            "duplicatesMerged": len([a for a in audit_log if a.get("status") == "DUPLICATE_MERGED"]),
            "noiseRemoved": len(noise_posts),
            "newPosts": valid_posts,
            "noisePosts": [format_noise_post_for_client(np) for np in noise_posts],
        "noiseExcluded": len(noise_posts),
            "allPosts": [],
            "auditLog": audit_log,
            "stats": stats
        }
    else:
        posts = database.get_all_posts(search=keyword, limit=50)
        stats = database.get_db_stats()
        return {
            "success": True,
            "mode": "file",
            "isSimulated": False,
            "fetchedCount": len(posts),
            "verifiedCount": len(posts),
            "newPosts": posts,
            "noisePosts": [],
            "allPosts": [],
            "auditLog": [],
            "stats": stats
        }

def ingest_raw_batch(raw_posts: list, mode: str = "merge"):
    """
    Ingests a raw batch of posts (from drag-and-drop file or API payload),
    runs pipeline filtering and enrichment with active learned rules, and persists to SQLite.
    """
    active_query_obj = database.get_active_query_version_db()
    active_query_text = active_query_obj.get("queryText", "") if active_query_obj else ""
    query_constraints = parse_query_constraints(active_query_text)

    learned_rules = database.get_active_learned_rules()
    existing_posts = database.get_posts_for_dedup() if mode == "merge" else []

    valid_posts, audit_log, noise_posts = pipeline.process_dataset(
        raw_posts,
        learned_rules=learned_rules,
        existing_posts=existing_posts,
        query_constraints=query_constraints
    )

    if valid_posts:
        database.save_posts_batch(valid_posts, source="file")
    if noise_posts:
        database.save_noise_posts_batch(noise_posts)
    if audit_log:
        database.save_audit_logs_batch(audit_log)
    if mode != "merge":
        submitted_ids = [str(item.get("id")) for item in (raw_posts or []) if isinstance(item, dict) and item.get("id")]
        database.delete_posts_except_ids(submitted_ids)

    kept_ids = {str(entry.get("id")) for entry in audit_log if entry.get("status") == "KEPT"}
    newly_added = [
        post for post in valid_posts
        if str(post.get("id") or post.get("clean_id") or "") in kept_ids
    ]

    stats = database.get_db_stats()

    return {
        "success": True,
        "mode": mode,
        "cleanPosts": [],
        "newlyAddedPosts": newly_added,
        "noisePosts": [format_noise_post_for_client(np) for np in noise_posts],
        "noiseExcluded": len(noise_posts),
        "auditLog": audit_log,
        "stats": {
            "totalIngested": len(raw_posts),
            "cleanCount": len(newly_added),
            "exactDuplicates": len([a for a in audit_log if a.get("category") == "DUPLICATE_ID"]),
            "semanticDuplicates": len([a for a in audit_log if a.get("category") == "SEMANTIC_DUPLICATE"]),
            "duplicatesMerged": len([a for a in audit_log if a.get("status") == "DUPLICATE_MERGED"]),
            "removedCount": len(noise_posts),
        }
    }

def get_all_posts_service(search=None, city=None, severity=None, category=None, sort_by="newest", sort_order="desc", limit=None, offset=0, date=None, time_of_day=None, media=None, verified=None):
    """Returns posts from DB."""
    return database.get_all_posts(
        search=search, city=city, severity=severity, category=category, sort_by=sort_by,
        sort_order=sort_order, limit=limit, offset=offset, date=date, time_of_day=time_of_day,
        media=media, verified=verified,
    )

def get_posts_page_service(search=None, city=None, severity=None, category=None, sort_by="newest", sort_order="desc", limit=None, offset=0, date=None, time_of_day=None, media=None, verified=None):
    bounded = database._bounded_post_limit(limit)
    safe_offset = offset if isinstance(offset, int) and offset > 0 else 0
    filters = dict(
        search=search, city=city, severity=severity, category=category,
        date=date, time_of_day=time_of_day, media=media, verified=verified,
    )
    items = database.get_all_posts(
        sort_by=sort_by, sort_order=sort_order, limit=bounded, offset=safe_offset, **filters
    )
    total = database.count_posts(**filters)
    return {"items": items, "total": total, "limit": bounded, "offset": safe_offset}

def get_all_audit_logs_service(limit=50, offset=0, status=None, search=None):
    """Returns audit log entries from DB."""
    return database.get_audit_logs(limit=limit, offset=offset, status=status, search=search)

def get_audit_page_service(limit=50, offset=0, status=None, search=None):
    try:
        bounded = max(0, int(limit))
    except (TypeError, ValueError):
        bounded = 50
    bounded = min(bounded, 500)
    safe_offset = offset if isinstance(offset, int) and offset > 0 else 0
    items = database.get_audit_logs(limit=bounded, offset=safe_offset, status=status, search=search)
    total = database.count_audit_logs(status=status, search=search)
    return {"items": items, "total": total, "limit": bounded, "offset": safe_offset}

def get_noise_posts_service(search=None, category=None, status="EXCLUDED", sort_by="newest", sort_order="desc", limit=250, offset=0):
    """Returns noise posts from DB with sorting support (defaults to newest/latest)."""
    return database.get_noise_posts(
        search=search,
        category=category,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset
    )

def get_noise_page_service(search=None, category=None, status="EXCLUDED", sort_by="newest", sort_order="desc", limit=100, offset=0):
    try:
        bounded = max(0, int(limit))
    except (TypeError, ValueError):
        bounded = 100
    bounded = min(bounded, 500)
    safe_offset = offset if isinstance(offset, int) and offset > 0 else 0
    items = database.get_noise_posts(
        search=search, category=category, status=status,
        sort_by=sort_by, sort_order=sort_order, limit=bounded, offset=safe_offset,
    )
    total = database.count_noise_posts(search=search, category=category, status=status)
    return {"items": items, "total": total, "limit": bounded, "offset": safe_offset}

def get_noise_stats_service():
    """Returns summary metrics and breakdown of noise posts."""
    return database.get_noise_stats()

def restore_noise_post_service(post_id: str, learned_rules: list = None):
    """
    Restores an excluded post to verified clean posts and registers non-AI learned rules.
    """
    return database.restore_noise_post(post_id=post_id, learned_rules_to_add=learned_rules)

def exclude_post_service(post_id: str, reason: str = None, category: str = "GOVT_BUREAUCRATIC_PR",
                         phrase_patterns: list = None, confidence: float = 1.0,
                         curator_user_id: int = None, remove_associated_rules: bool = True):
    """
    Re-excludes a previously restored post or excludes any post from verified clean posts.
    Allows learning phrase patterns without blocking author handles.
    """
    return database.exclude_post_as_noise(
        post_id=post_id,
        reason=reason,
        category=category,
        phrase_patterns=phrase_patterns,
        confidence=confidence,
        curator_user_id=curator_user_id,
        remove_associated_rules=remove_associated_rules
    )

def extract_candidates_service(post_id: str = None, text: str = "", author: str = "", category: str = "", reason: str = ""):
    """
    Deterministic Non-AI Learning Heuristic Service:
    Returns candidate rule proposals for user confirmation.
    """
    if post_id:
        with database.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM noise_posts WHERE id = ?", (str(post_id),))
            row = cursor.fetchone()
            if row:
                text = row["text"]
                author = row["author_username"]
                category = row["exclusion_category"]
                reason = row["exclusion_reason"]

    post_dict = {
        "text": text,
        "authorUsername": author
    }
    return pipeline.extract_learning_candidates(post=post_dict, exclusion_category=category, exclusion_reason=reason)

def extract_exclusion_candidates_service(post_id: str = None, text: str = "", category: str = ""):
    """
    Returns candidate phrase patterns detected in a post when excluding it,
    allowing operator to learn negative phrases without blocking authors.
    """
    if post_id and not text:
        with database.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM posts WHERE id = ? OR clean_id = ?", (str(post_id), str(post_id)))
            row = cursor.fetchone()
            if not row:
                cursor.execute("SELECT * FROM noise_posts WHERE id = ?", (str(post_id),))
                row = cursor.fetchone()
            if row:
                text = row["text"]

    return pipeline.extract_exclusion_phrase_candidates(text=text, category=category)

def get_taxonomy_service():
    """Returns canonical 16 noise and 6 relevant categories DTO."""
    return taxonomy.get_taxonomy_dto()

def get_classifier_status_service():
    """Returns Tier-1 classifier state, metrics, and dataset readiness."""
    return classifier.get_classifier_status()

def train_classifier_service():
    """Triggers training of Tier-1 text classifier using SQLite dataset."""
    return classifier.train_classifier_from_db()

def predict_classifier_service(text: str = ""):
    """Scores a text string with the Tier-1 classifier."""
    return classifier.predict_text(text)

def get_learned_rules_service():
    """Returns all non-AI learned rules."""
    return database.get_learned_rules()

def add_learned_rule_service(rule_type: str, rule_value: str, description: str = None):
    """Manually adds a learned rule."""
    return database.add_learned_rule(rule_type, rule_value, source_post_id="manual_entry", description=description)

def toggle_learned_rule_service(rule_id: int, is_active: bool):
    """Toggles active status of a learned rule."""
    return database.toggle_learned_rule(rule_id, is_active)

def delete_learned_rule_service(rule_id: int):
    """Deletes a learned rule."""
    return database.delete_learned_rule(rule_id)

def get_query_versions_service():
    """Retrieves all query versions from SQLite."""
    return database.get_query_versions_db()

def get_active_query_service():
    """Retrieves the active query version."""
    return database.get_active_query_version_db()

def save_query_version_service(data: dict):
    """Saves a new query version in the system."""
    version_tag = data.get("version_tag") or data.get("versionTag") or "v1.x"
    title = data.get("title") or "Custom Query"
    query_text = data.get("query_text") or data.get("queryText") or ""
    description = data.get("description") or ""
    set_active = bool(data.get("set_active") or data.get("setActive", False))

    if not query_text.strip():
        raise ValueError("Query text cannot be empty.")

    return database.create_query_version_db(
        version_tag=version_tag,
        title=title,
        query_text=query_text,
        description=description,
        set_active=set_active
    )

def activate_query_version_service(query_id: int):
    """Activates a query version as the system default."""
    return database.set_active_query_version_db(query_id)

def update_query_version_service(data: dict):
    """Updates an existing query version."""
    query_id = int(data.get("id") or 0)
    version_tag = data.get("version_tag") or data.get("versionTag")
    title = data.get("title")
    query_text = data.get("query_text") or data.get("queryText")
    description = data.get("description")

    return database.update_query_version_db(
        query_id=query_id,
        version_tag=version_tag,
        title=title,
        query_text=query_text,
        description=description
    )

def delete_query_version_service(query_id: int):
    """Deletes a query version."""
    return database.delete_query_version_db(query_id)

def auth_login_service(username_or_email: str, password: str, turnstile_token: str = None, remote_ip: str = None):
    """Handles user login with Cloudflare Turnstile verification and session generation."""
    ok, err_msg = database.verify_turnstile_token(turnstile_token, remote_ip)
    if not ok:
        raise ValueError(err_msg)

    user, err = database.authenticate_user_db(username_or_email, password)
    if not user:
        raise ValueError(err or "Invalid credentials.")

    token = database.create_auth_session_db(user["id"])
    return {
        "success": True,
        "token": token,
        "user": user
    }

def auth_signup_service(username: str, email: str, password: str, full_name: str = None,
                        turnstile_token: str = None, remote_ip: str = None):
    """Registers a new user with Cloudflare Turnstile verification, defaulting to 'viewer' role."""
    ok, err_msg = database.verify_turnstile_token(turnstile_token, remote_ip)
    if not ok:
        raise ValueError(err_msg)

    new_user = database.create_user_db(
        username=username,
        email=email,
        password=password,
        full_name=full_name
    )

    token = database.create_auth_session_db(new_user["id"])
    return {
        "success": True,
        "token": token,
        "user": new_user
    }

def auth_logout_service(token: str):
    """Invalidates active user session."""
    database.delete_auth_session_db(token)
    return {"success": True, "message": "Successfully logged out."}

def auth_me_service(token: str):
    """Retrieves authenticated user profile and active permissions from session token."""
    user = database.validate_auth_token_db(token)
    if not user:
        raise ValueError("Invalid or expired session. Please log in again.")
    return user

def get_users_service(search: str = None, role_id: int = None, is_active: int = None, limit: int = 100, offset: int = 0):
    """Retrieves paginated user list."""
    return database.get_users_list_db(search=search, role_id=role_id, is_active=is_active, limit=limit, offset=offset)

def get_user_service(user_id: int):
    """Retrieves single user profile."""
    user = database.get_user_by_id_db(user_id)
    if not user:
        raise ValueError(f"User with ID {user_id} not found.")
    return user

def create_user_service(data: dict, current_user_id: int = None):
    """Creates a new user record."""
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    full_name = data.get("fullName") or data.get("full_name")
    role_id = data.get("roleId") or data.get("role_id")
    is_active = data.get("isActive", True)
    avatar = data.get("avatar")

    return database.create_user_db(
        username=username,
        email=email,
        password=password,
        full_name=full_name,
        role_id=role_id,
        is_active=is_active,
        avatar=avatar,
        current_user_id=current_user_id
    )

def update_user_service(user_id: int, data: dict, current_user_id: int = None, current_session_token: str = None):
    """Updates an existing user record."""
    full_name = data.get("fullName") or data.get("full_name")
    email = data.get("email")
    role_id = data.get("roleId") or data.get("role_id")
    is_active = data.get("isActive") if "isActive" in data else data.get("is_active")
    password = data.get("password")
    avatar = data.get("avatar")

    return database.update_user_db(
        user_id=user_id,
        full_name=full_name,
        email=email,
        role_id=role_id,
        is_active=is_active,
        password=password,
        avatar=avatar,
        current_user_id=current_user_id,
        current_session_token=current_session_token
    )

def delete_user_service(user_id: int, current_user_id: int = None):
    """Deletes user record."""
    return database.delete_user_db(user_id=user_id, current_user_id=current_user_id)

def get_roles_service():
    """Retrieves all roles with permission sets and assigned user counts."""
    return database.get_roles_list_db()

def get_role_service(role_id: int):
    """Retrieves single role by ID."""
    role = database.get_role_by_id_db(role_id)
    if not role:
        raise ValueError(f"Role with ID {role_id} not found.")
    return role

def create_role_service(data: dict, current_user_id: int = None):
    """Creates a custom role."""
    name = data.get("name")
    display_name = data.get("displayName") or data.get("display_name")
    description = data.get("description")
    permission_ids = data.get("permissionIds") or data.get("permission_ids") or []

    return database.create_role_db(
        name=name,
        display_name=display_name,
        description=description,
        permission_ids=permission_ids,
        current_user_id=current_user_id,
    )

def update_role_service(role_id: int, data: dict, current_user_id: int = None):
    """Updates role metadata and permission assignments."""
    display_name = data.get("displayName") or data.get("display_name")
    description = data.get("description")
    permission_ids = data.get("permissionIds") if "permissionIds" in data else data.get("permission_ids")

    return database.update_role_db(
        role_id=role_id,
        display_name=display_name,
        description=description,
        permission_ids=permission_ids,
        current_user_id=current_user_id,
    )

def delete_role_service(role_id: int):
    """Deletes custom role."""
    return database.delete_role_db(role_id=role_id)

def get_permissions_service():
    """Retrieves all system permissions grouped by functional module."""
    return database.get_permissions_list_db()
