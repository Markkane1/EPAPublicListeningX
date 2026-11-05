import os
import re
import json
import sqlite3
import hashlib
import secrets
import hmac
from contextlib import contextmanager
from datetime import datetime, timezone, timedelta

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def _load_env():
    env_file = os.path.join(ROOT_DIR, ".env")
    if os.path.exists(env_file):
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k, v = k.strip(), v.strip().strip("'\"")
                        if k and k not in os.environ:
                            os.environ[k] = v
        except Exception:
            pass

_load_env()
DATA_DIR = os.path.join(ROOT_DIR, "data")
DB_PATH = os.environ.get("DB_PATH") or os.path.join(DATA_DIR, "epa_intelligence.db")

@contextmanager
def get_db():
    """Context manager that ensures the SQLite connection is committed and closed."""
    conn = sqlite3.connect(DB_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout=10000;")
    try:
        yield conn
    finally:
        conn.close()

DEFAULT_PERMISSIONS_DATA = [
    ("dashboard.view", "View Dashboard Overview", "Access real-time AQI stats, emergency alert cards, and air quality charts", "Dashboard"),
    ("posts.view", "View Posts Feed", "Browse, filter, and view verified clean air quality posts", "Posts Feed"),
    ("posts.search_x", "Live X API Search", "Execute live keyword search queries against X.com API", "Posts Feed"),
    ("posts.ingest", "Ingest Batch Posts", "Upload and process raw JSON or CSV datasets through the pipeline", "Posts Feed"),
    ("posts.export", "Export Posts Data", "Export verified posts and datasets to CSV or JSON formats", "Posts Feed"),
    ("posts.exclude", "Exclude Verified Post", "Manually remove false positives from verified feed to noise pool", "Posts Feed"),
    ("analytics.view", "View Analytics & Trends", "Analyze temporal AQI trends, district breakdowns, and viral leaderboards", "Analytics"),
    ("audit.view", "View Deduplication Audit", "Inspect pipeline duplicate merges, exact hash collisions, and audit logs", "Deduplication Audit"),
    ("noise.view", "View Noise Pool", "Inspect excluded noise posts, irrelevant chatter, and out-of-region traffic", "Noise & Learning Engine"),
    ("noise.manage", "Manage Noise & Rules", "Restore posts to verified feed and configure non-AI deterministic filter rules", "Noise & Learning Engine"),
    ("settings.view", "View System Settings", "View current system configurations, API status, and SQLite database health", "System Settings"),
    ("settings.manage", "Manage System Settings", "Configure X API credentials, switch sentiment engines, and edit search queries", "System Settings"),
    ("users.view", "View User Accounts", "View registered users, account profiles, and assigned roles", "User Management"),
    ("users.create", "Create User Accounts", "Register new system operator and analyst accounts", "User Management"),
    ("users.edit", "Edit User Accounts", "Update user profiles, change role assignments, and toggle account activation", "User Management"),
    ("users.delete", "Delete User Accounts", "Remove or permanently deactivate user accounts", "User Management"),
    ("roles.view", "View Roles & Permissions", "View defined roles, permission assignments, and access policies", "Role Management"),
    ("roles.create", "Create Custom Roles", "Define new customized roles and attach granular permissions", "Role Management"),
    ("roles.edit", "Edit Role Permissions", "Modify role names, descriptions, and update permission assignments", "Role Management"),
    ("roles.delete", "Delete Custom Roles", "Delete non-system custom roles from the registry", "Role Management"),
]

DEFAULT_ROLES_DATA = [
    {
        "name": "super_admin",
        "display_name": "Super Administrator",
        "description": "Unrestricted system-wide authority across all intelligence feeds, moderation actions, settings, user accounts, and role permissions.",
        "is_system": 1,
        "permissions": [p[0] for p in DEFAULT_PERMISSIONS_DATA]
    },
    {
        "name": "analyst",
        "display_name": "Environmental Analyst",
        "description": "Full access to dashboard intelligence, posts feed, deep analytics, deduplication audit, noise pool review, and data export. Read-only settings.",
        "is_system": 1,
        "permissions": [
            "dashboard.view",
            "posts.view",
            "posts.export",
            "analytics.view",
            "audit.view",
            "noise.view",
            "settings.view"
        ]
    },
    {
        "name": "auditor",
        "display_name": "Data Operator & Auditor",
        "description": "Operational access to view feeds, review audit trails, moderate noise, exclude/restore posts, and manage deterministic filtering rules.",
        "is_system": 1,
        "permissions": [
            "dashboard.view",
            "posts.view",
            "posts.export",
            "posts.exclude",
            "audit.view",
            "noise.view",
            "noise.manage",
            "settings.view"
        ]
    },
    {
        "name": "viewer",
        "display_name": "Read-Only Viewer",
        "description": "Restricted read-only observer access limited to dashboard summaries, posts feed, and general analytical charts.",
        "is_system": 1,
        "permissions": [
            "dashboard.view",
            "posts.view",
            "analytics.view"
        ]
    }
]

DEFAULT_USERS_DATA = [
    {
        "username": os.environ.get("DEFAULT_ADMIN_USERNAME", "admin"),
        "email": os.environ.get("DEFAULT_ADMIN_EMAIL", "admin@epa.punjab.gov.pk"),
        "password": os.environ.get("DEFAULT_ADMIN_PASSWORD", ""),
        "full_name": os.environ.get("DEFAULT_ADMIN_FULLNAME", "EPA Chief Administrator"),
        "role": "super_admin",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    },
    {
        "username": os.environ.get("DEFAULT_ANALYST_USERNAME", "analyst"),
        "email": os.environ.get("DEFAULT_ANALYST_EMAIL", "analyst@epa.punjab.gov.pk"),
        "password": os.environ.get("DEFAULT_ANALYST_PASSWORD", ""),
        "full_name": os.environ.get("DEFAULT_ANALYST_FULLNAME", "Dr. Ayesha Malik (Lead Analyst)"),
        "role": "analyst",
        "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"
    },
    {
        "username": os.environ.get("DEFAULT_AUDITOR_USERNAME", "auditor"),
        "email": os.environ.get("DEFAULT_AUDITOR_EMAIL", "auditor@epa.punjab.gov.pk"),
        "password": os.environ.get("DEFAULT_AUDITOR_PASSWORD", ""),
        "full_name": os.environ.get("DEFAULT_AUDITOR_FULLNAME", "Tariq Mehmood (Field Auditor)"),
        "role": "auditor",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    },
    {
        "username": os.environ.get("DEFAULT_VIEWER_USERNAME", "viewer"),
        "email": os.environ.get("DEFAULT_VIEWER_EMAIL", "viewer@epa.punjab.gov.pk"),
        "password": os.environ.get("DEFAULT_VIEWER_PASSWORD", ""),
        "full_name": os.environ.get("DEFAULT_VIEWER_FULLNAME", "Public Citizen / Observer"),
        "role": "viewer",
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
    }
]

PUBLISHED_PASSWORDS = frozenset({
    "EPAadmin2026!",
    "EPAanalyst2026!",
    "EPAauditor2026!",
    "EPAviewer2026!",
})

OFFICIAL_ACTIVE_QUERY = (
    '(AQI OR "air quality" OR pollution OR smog OR "clean air") '
    "(Lahore OR Gujranwala OR Faisalabad OR Multan OR Rawalpindi OR Islamabad OR Sialkot OR Punjab OR Pakistan) "
    "-Delhi -dehli -NCR -Haryana -Noida -Gurugram -India -india -india's "
    "-from:DelhiPollution -from:@ANI -from:@EPCCDpunjab -from:@EPAPunjab lang:en"
)

POST_LIST_DEFAULT_LIMIT = 100
POST_LIST_MAX_LIMIT = 200

BOOTSTRAP_CREDENTIALS_PATH = os.environ.get("EPA_BOOTSTRAP_CREDENTIALS_PATH") or os.path.join(DATA_DIR, "bootstrap-credentials.txt")

def _hash_password(password: str, salt: bytes = None) -> tuple:
    """Hashes password with PBKDF2-HMAC-SHA256 (100,000 rounds) using a cryptographically random salt."""
    if salt is None:
        salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return key.hex(), salt.hex()

def _verify_password(password: str, stored_hash_hex: str, salt_hex: str) -> bool:
    """Timing-safe verification of password against stored PBKDF2 hash."""
    try:
        salt = bytes.fromhex(salt_hex)
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(key.hex(), stored_hash_hex)
    except Exception:
        return False

def _password_is_rejected(password) -> bool:
    if password is None:
        return True
    value = str(password).strip()
    if not value:
        return True
    if "CHANGE_ME" in value:
        return True
    if value.startswith("YourSecure"):
        return True
    return value in PUBLISHED_PASSWORDS

def _append_bootstrap_credentials(username: str, password: str):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(BOOTSTRAP_CREDENTIALS_PATH, "a", encoding="utf-8") as handle:
        handle.write(f"username: {username}\n")
        handle.write(f"password: {password}\n")

def _resolve_seed_password(username: str, configured) -> str:
    if _password_is_rejected(configured):
        generated = secrets.token_urlsafe(18)
        _append_bootstrap_credentials(username, generated)
        return generated
    return str(configured)

def retire_published_passwords():
    """Rehash any user whose password is still a published credential."""
    retired = []
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, password_hash, salt FROM users")
        rows = cursor.fetchall()
        for row in rows:
            if not any(
                _verify_password(published, row["password_hash"], row["salt"])
                for published in PUBLISHED_PASSWORDS
            ):
                continue
            generated = secrets.token_urlsafe(18)
            pwd_hash, salt_hex = _hash_password(generated)
            cursor.execute(
                "UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?",
                (pwd_hash, salt_hex, now_iso, row["id"]),
            )
            cursor.execute("DELETE FROM auth_sessions WHERE user_id = ?", (row["id"],))
            _append_bootstrap_credentials(row["username"], generated)
            retired.append(row["username"])
        conn.commit()
    return retired

def _bounded_post_limit(limit):
    if limit is None:
        return POST_LIST_DEFAULT_LIMIT
    try:
        parsed = int(limit)
    except (TypeError, ValueError):
        return POST_LIST_DEFAULT_LIMIT
    if parsed < 0:
        return POST_LIST_DEFAULT_LIMIT
    if parsed > POST_LIST_MAX_LIMIT:
        return POST_LIST_MAX_LIMIT
    return parsed

def _is_safe_avatar_url(url: str) -> bool:
    """Validates that an avatar URL points to an allowed host only.
    Prevents SSRF and tracking pixel injection via avatar fields.
    """
    if not url or not isinstance(url, str):
        return True  # Empty/None is fine
    url = url.strip()
    # Allow relative paths, data URIs, and DiceBear (default avatar service)
    _ALLOWED_AVATAR_HOSTS = {
        "api.dicebear.com",
        "images.unsplash.com",
        "pbs.twimg.com",
        "abs.twimg.com",
        "avatars.githubusercontent.com",
        "lh3.googleusercontent.com",
    }
    if not url.startswith(("http://", "https://")):
        return True  # relative/data URI - allow
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        host = parsed.netloc.lower().split(":")[0]  # strip port
        return host in _ALLOWED_AVATAR_HOSTS
    except Exception:
        return False


def _replace_lowercase_or_query(cursor):
    """Upgrade a stored active query that still uses lowercase OR."""
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("SELECT id, query_text FROM query_versions WHERE is_active = 1")
    active = cursor.fetchone()
    if active and active["query_text"] and " or " in active["query_text"]:
        cursor.execute(
            "UPDATE query_versions SET query_text = ?, updated_at = ? WHERE id = ?",
            (OFFICIAL_ACTIVE_QUERY, now_iso, active["id"]),
        )
    cursor.execute("SELECT value FROM settings WHERE key = 'default_query'")
    setting = cursor.fetchone()
    if setting and setting["value"] and " or " in setting["value"]:
        cursor.execute(
            "UPDATE settings SET value = ? WHERE key = 'default_query'",
            (OFFICIAL_ACTIVE_QUERY,),
        )

def init_db():
    """Initializes SQLite tables and seeds initial dataset if empty."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                clean_id TEXT,
                type TEXT DEFAULT 'Post',
                post_url TEXT,
                text TEXT NOT NULL,
                created_at TEXT,
                language TEXT,
                likes INTEGER DEFAULT 0,
                retweets INTEGER DEFAULT 0,
                replies INTEGER DEFAULT 0,
                quotes INTEGER DEFAULT 0,
                bookmarks INTEGER DEFAULT 0,
                views INTEGER,
                author_name TEXT,
                author_username TEXT,
                author_followers INTEGER,
                author_following INTEGER,
                author_description TEXT,
                author_verified INTEGER DEFAULT 0,
                author_avatar TEXT,
                author_banner TEXT,
                media_urls TEXT,
                media_types TEXT,
                has_media INTEGER DEFAULT 0,
                media_count INTEGER DEFAULT 0,
                aqi_value INTEGER,
                severity TEXT,
                severity_code TEXT,
                city_detected TEXT,
                category TEXT,
                sentiment TEXT,
                sentiment_score REAL DEFAULT 0.0,
                sentiment_engine TEXT DEFAULT 'vader',
                sentiment_confidence REAL DEFAULT 0.5,
                emotion TEXT DEFAULT 'Neutral / Reporting',
                total_engagement INTEGER DEFAULT 0,
                source TEXT DEFAULT 'initial',
                ingested_at TEXT
            )
        """)

        for col_name, col_type in [
            ("sentiment_score", "REAL DEFAULT 0.0"),
            ("sentiment_engine", "TEXT DEFAULT 'vader'"),
            ("sentiment_confidence", "REAL DEFAULT 0.5"),
            ("emotion", "TEXT DEFAULT 'Neutral / Reporting'")
        ]:
            try:
                cursor.execute(f"ALTER TABLE posts ADD COLUMN {col_name} {col_type}")
            except sqlite3.OperationalError:
                pass

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_city ON posts(city_detected)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_created_desc ON posts(created_at DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_city_created ON posts(city_detected, created_at DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_severity_created ON posts(severity_code, created_at DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_category_created ON posts(category, created_at DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_engagement ON posts(total_engagement DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_aqi ON posts(aqi_value)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_severity ON posts(severity_code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_index INTEGER,
                post_id TEXT,
                author TEXT,
                status TEXT NOT NULL,
                category TEXT NOT NULL,
                reason TEXT NOT NULL,
                text TEXT,
                aqi_value INTEGER,
                severity TEXT,
                city TEXT,
                logged_at TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status)")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS noise_posts (
                id TEXT PRIMARY KEY,
                author_username TEXT,
                author_name TEXT,
                text TEXT NOT NULL,
                created_at TEXT,
                post_url TEXT,
                media_urls TEXT,
                likes INTEGER DEFAULT 0,
                retweets INTEGER DEFAULT 0,
                replies INTEGER DEFAULT 0,
                quotes INTEGER DEFAULT 0,
                views INTEGER,
                author_avatar TEXT,
                author_verified INTEGER DEFAULT 0,
                author_description TEXT,
                exclusion_category TEXT NOT NULL,
                exclusion_reason TEXT NOT NULL,
                raw_json TEXT,
                status TEXT DEFAULT 'EXCLUDED',
                ingested_at TEXT,
                restored_at TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_noise_category ON noise_posts(exclusion_category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_noise_status ON noise_posts(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_noise_created ON noise_posts(created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_noise_status_created ON noise_posts(status, created_at DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_noise_status_category ON noise_posts(status, exclusion_category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_noise_status_likes ON noise_posts(status, likes DESC)")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS learned_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rule_type TEXT NOT NULL,
                rule_value TEXT NOT NULL,
                description TEXT,
                source_post_id TEXT,
                hit_count INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_learned_rules_type ON learned_rules(rule_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_learned_rules_active ON learned_rules(is_active)")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS query_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version_tag TEXT NOT NULL,
                title TEXT NOT NULL,
                query_text TEXT NOT NULL,
                description TEXT,
                is_active INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_query_versions_active ON query_versions(is_active)")

        cursor.execute("SELECT COUNT(*) FROM query_versions")
        if cursor.fetchone()[0] == 0:
            now_iso = datetime.now(timezone.utc).isoformat()
            initial_versions = [
                (
                    "v1.0",
                    "Baseline Punjab Query",
                    '(AQI OR "air quality" OR pollution OR smog) (Lahore OR Pakistan OR Punjab) -Delhi -NCR -Haryana -Noida -Gurugram -India -from:DelhiPollution -from:@EPCCDpunjab -from:@EPAPunjab -from:@PSCAsafecities lang:en',
                    "Initial baseline query excluding Delhi domestic discourse and verified official accounts.",
                    0,
                    "2026-11-01T00:00:00Z",
                    "2026-11-01T00:00:00Z"
                ),
                (
                    "v1.1",
                    "Official EPA Punjab Search Constraints",
                    OFFICIAL_ACTIVE_QUERY,
                    "Standard production query: incorporates 'clean air', Gujranwala district, -ANI news, and case-insensitive negative Indian exclusions.",
                    1,
                    "2026-11-02T12:00:00Z",
                    now_iso
                ),
                (
                    "v1.2",
                    "Smog Emergency & Stubble Burning Monitor",
                    '(AQI OR smog OR "stubble burning" OR "crop residue" OR "clean air") (Lahore OR Gujranwala OR Faisalabad OR Multan OR Sialkot OR Punjab OR Pakistan) -Delhi -dehli -NCR -Haryana -Noida -Gurugram -India -india -from:DelhiPollution lang:en',
                    "Specialized agricultural residue fire and smog monitoring across core Punjab agricultural & industrial clusters.",
                    0,
                    "2026-11-03T10:00:00Z",
                    now_iso
                )
            ]
            cursor.executemany("""
                INSERT INTO query_versions (version_tag, title, query_text, description, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, initial_versions)

        cursor.execute("SELECT COUNT(*) FROM settings")
        if cursor.fetchone()[0] == 0:
            default_settings = {
                "data_source": os.environ.get("DATA_SOURCE", "file"),
                "x_bearer_token": os.environ.get("X_BEARER_TOKEN", ""),
                "x_api_key": os.environ.get("X_API_KEY", ""),
                "x_api_secret": os.environ.get("X_API_SECRET", ""),
                "x_api_endpoint": os.environ.get("X_API_ENDPOINT", "https://api.twitter.com/2/tweets/search/recent"),
                "default_query": OFFICIAL_ACTIVE_QUERY,
                "auto_enrich": os.environ.get("AUTO_ENRICH", "true"),
                "sentiment_engine": os.environ.get("SENTIMENT_ENGINE", "vader"),
                "turnstile_site_key": os.environ.get("TURNSTILE_SITE_KEY", "1x00000000000000000000AA"),
                "turnstile_secret_key": os.environ.get("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA"),
                "last_sync": datetime.now(timezone.utc).isoformat()
            }
            for k, v in default_settings.items():
                cursor.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (k, v))
        else:
            cursor.execute("SELECT value FROM settings WHERE key = 'sentiment_engine'")
            if not cursor.fetchone():
                cursor.execute("INSERT INTO settings (key, value) VALUES ('sentiment_engine', 'vader')")

        cursor.execute("SELECT COUNT(*) FROM posts")
        if cursor.fetchone()[0] == 0:
            cleaned_json_path = os.path.join(DATA_DIR, "cleaned_epa_posts.json")
            if os.path.exists(cleaned_json_path):
                try:
                    with open(cleaned_json_path, "r", encoding="utf-8") as f:
                        initial_posts = json.load(f)
                    save_posts_batch(initial_posts, source="initial", conn=conn)
                except Exception as e:
                    print(f"[!] Warning: Could not seed initial posts: {e}")

        cursor.execute("SELECT COUNT(*) FROM audit_logs")
        if cursor.fetchone()[0] == 0:
            audit_json_path = os.path.join(DATA_DIR, "cleaning_audit.json")
            if os.path.exists(audit_json_path):
                try:
                    with open(audit_json_path, "r", encoding="utf-8") as f:
                        initial_audit = json.load(f)
                    save_audit_logs_batch(initial_audit, conn=conn)
                except Exception as e:
                    print(f"[!] Warning: Could not seed initial audit log: {e}")

        cursor.execute("SELECT COUNT(*) FROM noise_posts")
        if cursor.fetchone()[0] == 0:
            raw_json_path = os.path.join(DATA_DIR, "raw_scraped_posts.json")
            if os.path.exists(raw_json_path):
                try:
                    import pipeline
                    with open(raw_json_path, "r", encoding="utf-8") as f:
                        raw_data = json.load(f)
                    _, _, initial_noise = pipeline.process_dataset(raw_data)
                    if initial_noise:
                        save_noise_posts_batch(initial_noise, conn=conn)
                except Exception as e:
                    print(f"[!] Warning: Could not seed initial noise posts: {e}")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                description TEXT,
                is_system INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name)")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                module TEXT NOT NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module)")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id INTEGER NOT NULL,
                permission_id INTEGER NOT NULL,
                PRIMARY KEY (role_id, permission_id),
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                full_name TEXT NOT NULL,
                avatar TEXT,
                role_id INTEGER NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (role_id) REFERENCES roles(id)
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id)")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS auth_sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                last_active_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON auth_sessions(user_id)")

        cursor.execute("SELECT COUNT(*) FROM permissions")
        if cursor.fetchone()[0] == 0:
            cursor.executemany("""
                INSERT INTO permissions (code, name, description, module)
                VALUES (?, ?, ?, ?)
            """, DEFAULT_PERMISSIONS_DATA)

        cursor.execute("SELECT COUNT(*) FROM roles")
        if cursor.fetchone()[0] == 0:
            now_iso = datetime.now(timezone.utc).isoformat()
            for r in DEFAULT_ROLES_DATA:
                cursor.execute("""
                    INSERT INTO roles (name, display_name, description, is_system, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (r["name"], r["display_name"], r["description"], r["is_system"], now_iso, now_iso))
                role_id = cursor.lastrowid
                
                for perm_code in r["permissions"]:
                    cursor.execute("SELECT id FROM permissions WHERE code = ?", (perm_code,))
                    perm_row = cursor.fetchone()
                    if perm_row:
                        cursor.execute("""
                            INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
                            VALUES (?, ?)
                        """, (role_id, perm_row["id"]))

        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            now_iso = datetime.now(timezone.utc).isoformat()
            for u in DEFAULT_USERS_DATA:
                cursor.execute("SELECT id FROM roles WHERE name = ?", (u["role"],))
                role_row = cursor.fetchone()
                if role_row:
                    password = _resolve_seed_password(u["username"], u.get("password"))
                    pwd_hash, salt_hex = _hash_password(password)
                    cursor.execute("""
                        INSERT INTO users (username, email, password_hash, salt, full_name, avatar, role_id, is_active, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                    """, (u["username"], u["email"], pwd_hash, salt_hex, u["full_name"], u["avatar"], role_row["id"], now_iso, now_iso))

        _replace_lowercase_or_query(cursor)
        conn.commit()
    retire_published_passwords()
    cleanup_expired_sessions_db()

def row_to_post_dict(row) -> dict:
    """Converts a SQLite row back to the exact JSON post structure expected by React."""
    media_raw = row["media_urls"]
    try:
        media_list = json.loads(media_raw) if media_raw else []
    except (ValueError, TypeError):
        media_list = [media_raw] if media_raw else []

    return {
        "id": row["id"],
        "clean_id": row["clean_id"] or row["id"],
        "type": row["type"] or "Post",
        "postUrl": row["post_url"] or f"https://x.com/{row['author_username']}/status/{row['id']}",
        "text": row["text"],
        "createdAt": row["created_at"],
        "language": row["language"],
        "likes": row["likes"] or 0,
        "retweets": row["retweets"] or 0,
        "replies": row["replies"] or 0,
        "quotes": row["quotes"] or 0,
        "bookmarks": row["bookmarks"] or 0,
        "views": row["views"],
        "authorName": row["author_name"],
        "authorUsername": row["author_username"],
        "authorFollowers": row["author_followers"],
        "authorFollowing": row["author_following"],
        "authorDescription": row["author_description"],
        "authorVerified": bool(row["author_verified"]),
        "authorAvatar": row["author_avatar"],
        "authorBanner": row["author_banner"],
        "mediaUrls": media_list,
        "mediaTypes": row["media_types"] or ("photo" if media_list else None),
        "has_media": bool(row["has_media"]),
        "media_count": row["media_count"] or len(media_list),
        "aqi_value": row["aqi_value"],
        "severity": row["severity"] or "Unspecified",
        "severity_code": row["severity_code"] or "unspecified",
        "city_detected": row["city_detected"] or "Punjab Region",
        "category": row["category"] or "Citizen Outcry & Reaction",
        "sentiment": row["sentiment"] or "Informative / Neutral",
        "sentiment_score": float(row["sentiment_score"]) if ("sentiment_score" in row.keys() and row["sentiment_score"] is not None) else 0.0,
        "sentiment_engine": row["sentiment_engine"] if ("sentiment_engine" in row.keys() and row["sentiment_engine"]) else "vader",
        "sentiment_confidence": float(row["sentiment_confidence"]) if ("sentiment_confidence" in row.keys() and row["sentiment_confidence"] is not None) else 0.5,
        "emotion": row["emotion"] if ("emotion" in row.keys() and row["emotion"]) else "Neutral / Reporting",
        "total_engagement": row["total_engagement"] or 0,
        "source": row["source"],
        "ingested_at": row["ingested_at"]
    }

def get_all_posts(search=None, city=None, severity=None, category=None, sort_by="newest", sort_order="desc", limit=None, offset=0):
    """Retrieves posts with optional search, filters, and comprehensive sorting."""
    query = "SELECT * FROM posts WHERE 1=1"
    params = []

    if search:
        s = f"%{search.strip().lower()}%"
        query += " AND (LOWER(text) LIKE ? OR LOWER(author_name) LIKE ? OR LOWER(author_username) LIKE ? OR LOWER(city_detected) LIKE ?)"
        params.extend([s, s, s, s])

    if city and city != "all":
        query += " AND city_detected = ?"
        params.append(city)

    if severity and severity != "all":
        query += " AND severity_code = ?"
        params.append(severity)

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)

    is_asc = str(sort_order).lower() == "asc"
    dir_sql = "ASC" if is_asc else "DESC"
    inv_dir_sql = "DESC" if is_asc else "ASC"

    if sort_by in ("engagement", "interactions"):
        query += f" ORDER BY total_engagement {dir_sql}, created_at DESC"
    elif sort_by in ("aqi", "aqi_desc"):
        query += f" ORDER BY CASE WHEN aqi_value IS NULL THEN 1 ELSE 0 END, aqi_value {dir_sql}, created_at DESC"
    elif sort_by == "aqi_asc":
        query += f" ORDER BY CASE WHEN aqi_value IS NULL THEN 1 ELSE 0 END, aqi_value ASC, created_at DESC"
    elif sort_by == "likes":
        query += f" ORDER BY likes {dir_sql}, created_at DESC"
    elif sort_by == "retweets":
        query += f" ORDER BY retweets {dir_sql}, created_at DESC"
    elif sort_by == "replies":
        query += f" ORDER BY replies {dir_sql}, created_at DESC"
    elif sort_by == "views":
        query += f" ORDER BY CASE WHEN views IS NULL THEN 0 ELSE views END {dir_sql}, created_at DESC"
    elif sort_by in ("followers", "influence", "reach"):
        query += f" ORDER BY CASE WHEN author_followers IS NULL THEN 0 ELSE author_followers END {dir_sql}, created_at DESC"
    elif sort_by in ("severity", "severity_desc"):
        query += f""" ORDER BY CASE severity_code
            WHEN 'hazardous' THEN 6
            WHEN 'very_unhealthy' THEN 5
            WHEN 'unhealthy' THEN 4
            WHEN 'sensitive' THEN 3
            WHEN 'moderate' THEN 2
            WHEN 'good' THEN 1
            ELSE 0 END {dir_sql}, created_at DESC"""
    elif sort_by == "sentiment_alarm":
        query += f" ORDER BY sentiment_score ASC, created_at DESC"
    elif sort_by == "sentiment_positive":
        query += f" ORDER BY sentiment_score DESC, created_at DESC"
    elif sort_by == "media_count":
        query += f" ORDER BY media_count {dir_sql}, created_at DESC"
    elif sort_by == "oldest":
        query += " ORDER BY created_at ASC"
    else:
        query += f" ORDER BY created_at {dir_sql}"

    bounded_limit = _bounded_post_limit(limit)
    safe_offset = offset if isinstance(offset, int) and offset > 0 else 0
    query += " LIMIT ? OFFSET ?"
    params.extend([bounded_limit, safe_offset])

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [row_to_post_dict(r) for r in rows]

def get_posts_for_dedup():
    """Every stored post, for duplicate merging. The public list cap does not apply."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM posts")
        return [row_to_post_dict(r) for r in cursor.fetchall()]

def save_posts_batch(posts_list, source="file", conn=None):
    """Saves a batch of post dictionaries into SQLite using INSERT OR REPLACE."""
    now_iso = datetime.now(timezone.utc).isoformat()
    insert_sql = """
        INSERT OR REPLACE INTO posts (
            id, clean_id, type, post_url, text, created_at, language,
            likes, retweets, replies, quotes, bookmarks, views,
            author_name, author_username, author_followers, author_following,
            author_description, author_verified, author_avatar, author_banner,
            media_urls, media_types, has_media, media_count,
            aqi_value, severity, severity_code, city_detected, category,
            sentiment, sentiment_score, sentiment_engine, sentiment_confidence, emotion,
            total_engagement, source, ingested_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?
        )
    """

    def _execute(c):
        for p in posts_list:
            pid = str(p.get("id") or p.get("clean_id") or "")
            if not pid:
                continue

            raw_media = p.get("mediaUrls") or []
            if isinstance(raw_media, list):
                media_str = json.dumps(raw_media)
            elif isinstance(raw_media, str):
                media_str = json.dumps([m.strip() for m in raw_media.split(";") if m.strip()])
            else:
                media_str = json.dumps([])

            likes = int(p.get("likes") or 0)
            retweets = int(p.get("retweets") or 0)
            replies = int(p.get("replies") or 0)
            quotes = int(p.get("quotes") or 0)
            engagement = p.get("total_engagement")
            if engagement is None:
                engagement = likes + (retweets * 2) + (replies * 2) + (quotes * 2)

            author_verified = 1 if p.get("authorVerified") else 0
            has_media = 1 if p.get("has_media") or len(raw_media) > 0 else 0
            media_count = p.get("media_count") or (len(raw_media) if isinstance(raw_media, list) else 0)

            c.execute(insert_sql, (
                pid,
                str(p.get("clean_id") or pid),
                p.get("type", "Post"),
                p.get("postUrl") or f"https://x.com/{p.get('authorUsername')}/status/{pid}",
                p.get("text", ""),
                p.get("createdAt") or now_iso,
                p.get("language"),
                likes,
                retweets,
                replies,
                quotes,
                int(p.get("bookmarks") or 0),
                p.get("views"),
                p.get("authorName") or "",
                p.get("authorUsername") or "",
                p.get("authorFollowers"),
                p.get("authorFollowing"),
                p.get("authorDescription"),
                author_verified,
                p.get("authorAvatar") or "",
                p.get("authorBanner"),
                media_str,
                p.get("mediaTypes") or ("photo" if has_media else None),
                has_media,
                media_count,
                p.get("aqi_value"),
                p.get("severity") or "Unspecified",
                p.get("severity_code") or "unspecified",
                p.get("city_detected") or "Punjab Region",
                p.get("category") or "Citizen Outcry & Reaction",
                p.get("sentiment") or "Informative / Neutral",
                float(p.get("sentiment_score") if p.get("sentiment_score") is not None else 0.0),
                p.get("sentiment_engine") or "vader",
                float(p.get("sentiment_confidence") if p.get("sentiment_confidence") is not None else 0.5),
                p.get("emotion") or "Neutral / Reporting",
                engagement,
                p.get("source") or source,
                p.get("ingested_at") or now_iso
            ))

    if conn is not None:
        cursor = conn.cursor()
        _execute(cursor)
        conn.commit()
    else:
        with get_db() as local_conn:
            cursor = local_conn.cursor()
            _execute(cursor)
            local_conn.commit()

def save_audit_logs_batch(audit_list, conn=None):
    """Saves a batch of audit log dictionaries into SQLite."""
    now_iso = datetime.now(timezone.utc).isoformat()
    insert_sql = """
        INSERT INTO audit_logs (
            item_index, post_id, author, status, category, reason, text,
            aqi_value, severity, city, logged_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    def _execute(c):
        for a in audit_list:
            c.execute(insert_sql, (
                a.get("index"),
                str(a.get("id") or ""),
                a.get("author") or "",
                a.get("status") or "UNKNOWN",
                a.get("category") or "GENERAL",
                a.get("reason") or "",
                a.get("text") or "",
                a.get("aqi_value"),
                a.get("severity"),
                a.get("city"),
                a.get("logged_at") or now_iso
            ))

    if conn is not None:
        cursor = conn.cursor()
        _execute(cursor)
        conn.commit()
    else:
        with get_db() as local_conn:
            cursor = local_conn.cursor()
            _execute(cursor)
            local_conn.commit()

def get_audit_logs(limit=1000, offset=0):
    """Retrieves audit logs in reverse-chronological order."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ? OFFSET ?", (limit, offset))
        rows = cursor.fetchall()
        return [
            {
                "id": r["id"],
                "index": r["item_index"],
                "postId": r["post_id"],
                "author": r["author"],
                "status": r["status"],
                "category": r["category"],
                "reason": r["reason"],
                "text": r["text"],
                "aqi_value": r["aqi_value"],
                "severity": r["severity"],
                "city": r["city"],
                "logged_at": r["logged_at"]
            }
            for r in rows
        ]

def get_settings():
    """Returns current settings dict."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings")
        rows = cursor.fetchall()
        return {r["key"]: r["value"] for r in rows}

def save_settings(new_settings: dict):
    """Updates settings in SQLite."""
    with get_db() as conn:
        cursor = conn.cursor()
        for k, v in new_settings.items():
            if v is not None:
                cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, str(v)))
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", 
                       ("last_sync", datetime.now(timezone.utc).isoformat()))
        conn.commit()
    return get_settings()

def reanalyze_all_posts_db(engine_name: str = "vader") -> dict:
    """
    Re-analyzes all posts currently stored in SQLite database using the designated engine.
    Updates sentiment, sentiment_score, sentiment_engine, sentiment_confidence, and emotion.
    Returns summary statistics.
    """
    from backend import sentiment_engine

    engine_clean = str(engine_name).lower().strip()
    if engine_clean not in ("transformer", "roberta", "local_transformer"):
        engine_clean = "vader"
    else:
        engine_clean = "transformer"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, text FROM posts")
        rows = cursor.fetchall()
        total_posts = len(rows)

        sentiment_counts = {
            "Critical / Alarmed": 0,
            "Concerned": 0,
            "Positive / Solution-Oriented": 0,
            "Informative / Neutral": 0
        }
        total_score = 0.0

        update_sql = """
            UPDATE posts
            SET sentiment = ?,
                sentiment_score = ?,
                sentiment_engine = ?,
                sentiment_confidence = ?,
                emotion = ?
            WHERE id = ?
        """

        updates = []
        texts = [r["text"] or "" for r in rows]
        pids = [r["id"] for r in rows]

        batch_results = sentiment_engine.analyze_batch(texts, engine=engine_clean, batch_size=32)

        for pid, res in zip(pids, batch_results):
            label = res["sentiment"]
            score = float(res["sentiment_score"])
            eng_used = res["sentiment_engine"]
            conf = float(res["sentiment_confidence"])
            emo = res["emotion"]

            sentiment_counts[label] = sentiment_counts.get(label, 0) + 1
            total_score += score

            updates.append((label, score, eng_used, conf, emo, pid))

        cursor.executemany(update_sql, updates)

        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('sentiment_engine', ?)", (engine_clean,))
        conn.commit()

        avg_score = round(total_score / total_posts, 4) if total_posts > 0 else 0.0

        return {
            "success": True,
            "engine": engine_clean,
            "totalReanalyzed": total_posts,
            "averageScore": avg_score,
            "distribution": sentiment_counts
        }

def save_noise_posts_batch(noise_list, conn=None):
    """Saves a batch of noise post dictionaries into SQLite using INSERT OR REPLACE."""
    now_iso = datetime.now(timezone.utc).isoformat()
    insert_sql = """
        INSERT OR REPLACE INTO noise_posts (
            id, author_username, author_name, text, created_at, post_url,
            media_urls, likes, retweets, replies, quotes, views,
            author_avatar, author_verified, author_description,
            exclusion_category, exclusion_reason, raw_json, status,
            ingested_at, restored_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?
        )
    """

    def _execute(c):
        for p in noise_list:
            pid = str(p.get("id") or "")
            if not pid:
                continue

            raw_media = p.get("media_urls") or p.get("mediaUrls") or []
            if isinstance(raw_media, list):
                media_str = json.dumps(raw_media)
            elif isinstance(raw_media, str):
                media_str = json.dumps([m.strip() for m in raw_media.split(";") if m.strip()])
            else:
                media_str = json.dumps([])

            raw_json_str = p.get("raw_json")
            if not raw_json_str:
                raw_json_str = json.dumps(p, ensure_ascii=False)

            c.execute(insert_sql, (
                pid,
                (p.get("author_username") or p.get("authorUsername") or "").strip().replace('@', ''),
                p.get("author_name") or p.get("authorName") or "",
                p.get("text") or "",
                p.get("created_at") or p.get("createdAt") or now_iso,
                p.get("post_url") or p.get("postUrl") or f"https://x.com/{p.get('authorUsername')}/status/{pid}",
                media_str,
                int(p.get("likes") or 0),
                int(p.get("retweets") or 0),
                int(p.get("replies") or 0),
                int(p.get("quotes") or 0),
                p.get("views"),
                p.get("author_avatar") or p.get("authorAvatar") or "",
                1 if p.get("author_verified") or p.get("authorVerified") else 0,
                p.get("author_description") or p.get("authorDescription") or "",
                p.get("exclusion_category") or p.get("exclusionCategory") or "OFF_TOPIC",
                p.get("exclusion_reason") or p.get("exclusionReason") or "Filtered as noise",
                raw_json_str,
                p.get("status") or "EXCLUDED",
                p.get("ingested_at") or now_iso,
                p.get("restored_at")
            ))

    if conn is not None:
        cursor = conn.cursor()
        _execute(cursor)
        conn.commit()
    else:
        with get_db() as local_conn:
            cursor = local_conn.cursor()
            _execute(cursor)
            local_conn.commit()

def get_noise_posts(search=None, category=None, status="EXCLUDED", sort_by="newest", sort_order="desc", limit=100, offset=0):
    """Retrieves noise posts with optional search, category filter, status, and comprehensive sorting (defaulting to latest posts first)."""
    query = "SELECT * FROM noise_posts WHERE 1=1"
    params = []

    if status and status != "all":
        query += " AND status = ?"
        params.append(status)

    if category and category != "all":
        query += " AND exclusion_category = ?"
        params.append(category)

    if search:
        s = f"%{search.strip().lower()}%"
        query += " AND (LOWER(text) LIKE ? OR LOWER(author_username) LIKE ? OR LOWER(author_name) LIKE ? OR LOWER(exclusion_reason) LIKE ?)"
        params.extend([s, s, s, s])

    is_asc = str(sort_order).lower() == "asc"
    dir_sql = "ASC" if is_asc else "DESC"

    if sort_by in ("engagement", "interactions"):
        query += f" ORDER BY (COALESCE(likes, 0) + COALESCE(retweets, 0) + COALESCE(replies, 0) + COALESCE(quotes, 0)) {dir_sql}, created_at DESC"
    elif sort_by == "likes":
        query += f" ORDER BY COALESCE(likes, 0) {dir_sql}, created_at DESC"
    elif sort_by == "retweets":
        query += f" ORDER BY COALESCE(retweets, 0) {dir_sql}, created_at DESC"
    elif sort_by == "replies":
        query += f" ORDER BY COALESCE(replies, 0) {dir_sql}, created_at DESC"
    elif sort_by == "views":
        query += f" ORDER BY COALESCE(views, 0) {dir_sql}, created_at DESC"
    elif sort_by in ("followers", "reach", "influence"):
        query += f" ORDER BY COALESCE(author_followers, 0) {dir_sql}, created_at DESC"
    elif sort_by == "verified":
        query += f" ORDER BY author_verified {dir_sql}, created_at DESC"
    elif sort_by == "oldest":
        query += " ORDER BY created_at ASC"
    elif sort_by in ("recently_ingested", "ingested"):
        query += f" ORDER BY ingested_at {dir_sql}, created_at DESC"
    else:  # 'newest' or default: sort by latest posts first!
        query += f" ORDER BY created_at {dir_sql}"

    if limit is not None:
        query += " LIMIT ? OFFSET ?"
        params.extend([limit, offset])

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            media_raw = r["media_urls"]
            try:
                media_list = json.loads(media_raw) if media_raw else []
            except (ValueError, TypeError):
                media_list = [media_raw] if media_raw else []

            result.append({
                "id": r["id"],
                "clean_id": r["id"],
                "authorUsername": r["author_username"],
                "authorName": r["author_name"],
                "text": r["text"],
                "createdAt": r["created_at"],
                "postUrl": r["post_url"],
                "mediaUrls": media_list,
                "likes": r["likes"] or 0,
                "retweets": r["retweets"] or 0,
                "replies": r["replies"] or 0,
                "quotes": r["quotes"] or 0,
                "views": r["views"],
                "authorAvatar": r["author_avatar"],
                "authorVerified": bool(r["author_verified"]),
                "authorDescription": r["author_description"],
                "exclusionCategory": r["exclusion_category"],
                "exclusionReason": r["exclusion_reason"],
                "status": r["status"],
                "ingestedAt": r["ingested_at"],
                "restoredAt": r["restored_at"]
            })
        return result

def get_noise_stats():
    """Returns summary counts of noise posts and category breakdown."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM noise_posts")
        total_noise = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM noise_posts WHERE status = 'EXCLUDED'")
        active_noise = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM noise_posts WHERE status = 'RESTORED'")
        restored_count = cursor.fetchone()[0]

        cursor.execute("SELECT exclusion_category, COUNT(*) as c FROM noise_posts GROUP BY exclusion_category ORDER BY c DESC")
        category_breakdown = {r["exclusion_category"]: r["c"] for r in cursor.fetchall()}

        cursor.execute("SELECT COUNT(*) FROM learned_rules WHERE is_active = 1")
        active_rules_count = cursor.fetchone()[0]

        return {
            "totalNoise": total_noise,
            "activeNoise": active_noise,
            "restoredCount": restored_count,
            "categoryBreakdown": category_breakdown,
            "activeRulesCount": active_rules_count
        }

def restore_noise_post(post_id: str, learned_rules_to_add: list = None):
    """
    Restores a post from noise_posts:
    1. Loads full post data from noise_posts.
    2. Runs enrich_post to calculate AQI, severity, city, sentiment, engagement.
    3. Saves enriched post into posts table.
    4. Updates noise_posts status to 'RESTORED'.
    5. Adds entry into audit_logs.
    6. Persists selected learned_rules into learned_rules table.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    import pipeline

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM noise_posts WHERE id = ?", (str(post_id),))
        row = cursor.fetchone()
        if not row:
            return {"success": False, "error": f"Post ID {post_id} not found in noise table."}

        raw_json_str = row["raw_json"]
        post_data = None
        if raw_json_str:
            try:
                post_data = json.loads(raw_json_str)
            except Exception:
                pass

        if not post_data:
            media_urls = []
            try:
                media_urls = json.loads(row["media_urls"]) if row["media_urls"] else []
            except Exception:
                pass
            post_data = {
                "id": row["id"],
                "authorUsername": row["author_username"],
                "authorName": row["author_name"],
                "text": row["text"],
                "createdAt": row["created_at"],
                "postUrl": row["post_url"],
                "mediaUrls": media_urls,
                "likes": row["likes"] or 0,
                "retweets": row["retweets"] or 0,
                "replies": row["replies"] or 0,
                "quotes": row["quotes"] or 0,
                "views": row["views"],
                "authorAvatar": row["author_avatar"],
                "authorVerified": bool(row["author_verified"]),
                "authorDescription": row["author_description"]
            }

        enriched = pipeline.enrich_post(post_data)
        enriched["source"] = "noise_restored"

        save_posts_batch([enriched], source="noise_restored", conn=conn)

        cursor.execute("UPDATE noise_posts SET status = 'RESTORED', restored_at = ? WHERE id = ?", (now_iso, str(post_id)))

        cursor.execute("""
            INSERT INTO audit_logs (
                item_index, post_id, author, status, category, reason, text,
                aqi_value, severity, city, logged_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            None,
            str(post_id),
            row["author_username"],
            "RESTORED_BY_USER",
            "MANUAL_VERIFIED",
            f"Restored by operator from Noise pool (originally: {row['exclusion_category']})",
            row["text"],
            enriched.get("aqi_value"),
            enriched.get("severity"),
            enriched.get("city_detected"),
            now_iso
        ))

        added_rules = []
        if learned_rules_to_add and isinstance(learned_rules_to_add, list):
            for rule in learned_rules_to_add:
                r_type = rule.get("rule_type") or rule.get("ruleType")
                r_val = rule.get("rule_value") or rule.get("ruleValue")
                r_desc = rule.get("description") or f"Learned from manual restoration of post {post_id}"
                if r_type and r_val:
                    rule_record = add_learned_rule(
                        rule_type=r_type,
                        rule_value=r_val,
                        source_post_id=str(post_id),
                        description=r_desc,
                        conn=conn
                    )
                    added_rules.append(rule_record)

        conn.commit()

        return {
            "success": True,
            "restoredPost": enriched,
            "learnedRulesAdded": added_rules,
            "message": f"Post {post_id} restored and {len(added_rules)} rule(s) learned."
        }

def exclude_post_as_noise(post_id: str, reason: str = None, category: str = "MANUAL_EXCLUDED", remove_associated_rules: bool = True):
    """
    Excludes a post (re-excludes a restored post or excludes any post from verified clean posts) and returns it to noise:
    1. Removes post from 'posts' table.
    2. Updates or inserts row in 'noise_posts' with status = 'EXCLUDED' and restored_at = NULL.
    3. Revokes any learned rules linked to source_post_id = post_id if remove_associated_rules is True.
    4. Logs entry in 'audit_logs'.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    pid = str(post_id).strip()

    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM noise_posts WHERE id = ?", (pid,))
        noise_row = cursor.fetchone()

        cursor.execute("SELECT * FROM posts WHERE id = ? OR clean_id = ?", (pid, pid))
        post_row = cursor.fetchone()

        cursor.execute("DELETE FROM posts WHERE id = ? OR clean_id = ?", (pid, pid))

        final_reason = reason or "Manually excluded as noise by operator"
        author_user = ""
        post_text = ""

        if noise_row:
            author_user = noise_row["author_username"] or ""
            post_text = noise_row["text"] or ""
            cursor.execute("""
                UPDATE noise_posts 
                SET status = 'EXCLUDED', restored_at = NULL, exclusion_reason = ?
                WHERE id = ?
            """, (final_reason, pid))
        elif post_row:
            author_user = post_row["author_username"] or ""
            post_text = post_row["text"] or ""
            cursor.execute("""
                INSERT OR REPLACE INTO noise_posts (
                    id, author_username, author_name, text, created_at, post_url,
                    media_urls, likes, retweets, replies, quotes, views,
                    author_avatar, author_verified, author_description,
                    exclusion_category, exclusion_reason, raw_json, status,
                    ingested_at, restored_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?,
                    ?, ?, ?, 'EXCLUDED',
                    ?, NULL
                )
            """, (
                pid,
                author_user,
                post_row["author_name"] or "",
                post_text,
                post_row["created_at"] or now_iso,
                post_row["post_url"] or f"https://x.com/{author_user}/status/{pid}",
                post_row["media_urls"] or "[]",
                post_row["likes"] or 0,
                post_row["retweets"] or 0,
                post_row["replies"] or 0,
                post_row["quotes"] or 0,
                post_row["views"],
                post_row["author_avatar"] or "",
                post_row["author_verified"] or 0,
                "",
                category,
                final_reason,
                json.dumps(dict(post_row), ensure_ascii=False) if post_row else "{}",
                now_iso
            ))

        removed_rules_count = 0
        if remove_associated_rules:
            cursor.execute("SELECT COUNT(*) FROM learned_rules WHERE source_post_id = ?", (pid,))
            removed_rules_count = cursor.fetchone()[0]
            cursor.execute("DELETE FROM learned_rules WHERE source_post_id = ?", (pid,))

        cursor.execute("""
            INSERT INTO audit_logs (
                item_index, post_id, author, status, category, reason, text, logged_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            None,
            pid,
            author_user,
            "RE_EXCLUDED_AS_NOISE",
            category,
            f"{final_reason} (reverted from verified feed; {removed_rules_count} associated rule(s) revoked)",
            post_text,
            now_iso
        ))

        conn.commit()

        return {
            "success": True,
            "postId": pid,
            "removedRulesCount": removed_rules_count,
            "message": f"Post {pid} successfully re-excluded as noise and removed from verified feed."
        }

def get_learned_rules():
    """Retrieves all non-AI learned rules."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM learned_rules ORDER BY id DESC")
        rows = cursor.fetchall()
        return [
            {
                "id": r["id"],
                "ruleType": r["rule_type"],
                "ruleValue": r["rule_value"],
                "description": r["description"],
                "sourcePostId": r["source_post_id"],
                "hitCount": r["hit_count"],
                "isActive": bool(r["is_active"]),
                "createdAt": r["created_at"]
            }
            for r in rows
        ]

def get_active_learned_rules():
    """Returns structured active learned rules for pipeline consumption."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM learned_rules WHERE is_active = 1")
        rows = cursor.fetchall()
        active = {
            "aq_keywords": [],
            "geo_keywords": [],
            "author_whitelist": set(),
            "off_topic_exceptions": [],
            "indian_exceptions": []
        }
        for r in rows:
            rtype = r["rule_type"]
            val = r["rule_value"].strip()
            if rtype == "aq_keyword":
                active["aq_keywords"].append(val)
            elif rtype == "geo_keyword":
                active["geo_keywords"].append(val)
            elif rtype == "author_whitelist":
                active["author_whitelist"].add(val.lower().replace('@', ''))
            elif rtype == "off_topic_exception":
                active["off_topic_exceptions"].append(val)
            elif rtype == "indian_exception":
                active["indian_exceptions"].append(val)
        return active

def add_learned_rule(rule_type: str, rule_value: str, source_post_id: str = None, description: str = None, conn=None):
    """Inserts or activates a non-AI learned rule."""
    now_iso = datetime.now(timezone.utc).isoformat()
    clean_val = str(rule_value).strip().lower().replace('@', '') if rule_type == 'author_whitelist' else str(rule_value).strip()

    def _execute(c):
        c.execute("SELECT id, is_active FROM learned_rules WHERE rule_type = ? AND LOWER(rule_value) = LOWER(?)", (rule_type, clean_val))
        existing = c.fetchone()
        if existing:
            c.execute("UPDATE learned_rules SET is_active = 1, hit_count = hit_count + 1 WHERE id = ?", (existing["id"],))
            return {
                "id": existing["id"],
                "ruleType": rule_type,
                "ruleValue": clean_val,
                "description": description,
                "sourcePostId": source_post_id,
                "isActive": True,
                "status": "re-activated"
            }
        else:
            c.execute("""
                INSERT INTO learned_rules (rule_type, rule_value, description, source_post_id, hit_count, is_active, created_at)
                VALUES (?, ?, ?, ?, 0, 1, ?)
            """, (rule_type, clean_val, description or f"Learned from {source_post_id}", source_post_id, now_iso))
            return {
                "id": c.lastrowid,
                "ruleType": rule_type,
                "ruleValue": clean_val,
                "description": description,
                "sourcePostId": source_post_id,
                "isActive": True,
                "status": "created"
            }

    if conn is not None:
        return _execute(conn.cursor())
    else:
        with get_db() as local_conn:
            res = _execute(local_conn.cursor())
            local_conn.commit()
            return res

def toggle_learned_rule(rule_id: int, is_active: bool):
    """Toggles active state of a learned rule."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE learned_rules SET is_active = ? WHERE id = ?", (1 if is_active else 0, rule_id))
        conn.commit()
        return {"success": True, "ruleId": rule_id, "isActive": bool(is_active)}

def delete_posts_except_ids(keep_ids):
    """Delete stored posts whose ids are not in the submitted batch."""
    keep = {str(item) for item in (keep_ids or []) if item is not None and str(item) != ""}
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM posts")
        stale = [row["id"] for row in cursor.fetchall() if row["id"] not in keep]
        for pid in stale:
            cursor.execute("DELETE FROM posts WHERE id = ?", (pid,))
        conn.commit()
        return len(stale)

def delete_learned_rule(rule_id: int):
    """Deletes a learned rule."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM learned_rules WHERE id = ?", (rule_id,))
        conn.commit()
        return {"success": True, "deletedId": rule_id}

def get_db_stats():
    """Calculates summary KPIs directly from the SQLite database."""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM posts")
        total_posts = cursor.fetchone()[0]

        cursor.execute("SELECT MAX(aqi_value) FROM posts WHERE aqi_value IS NOT NULL AND aqi_value > 0")
        max_aqi = cursor.fetchone()[0]

        cursor.execute("SELECT AVG(aqi_value) FROM posts WHERE aqi_value IS NOT NULL AND aqi_value > 0")
        avg_row = cursor.fetchone()[0]
        avg_aqi = round(float(avg_row), 1) if avg_row is not None else None

        cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE status = 'DUPLICATE_MERGED'")
        duplicates_merged = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE status = 'REMOVED'")
        noise_removed = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM noise_posts WHERE status = 'EXCLUDED'")
        active_noise_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM noise_posts WHERE status = 'RESTORED'")
        restored_posts_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM learned_rules WHERE is_active = 1")
        learned_rules_count = cursor.fetchone()[0]

        cursor.execute("SELECT city_detected, COUNT(*) as c FROM posts GROUP BY city_detected ORDER BY c DESC")
        city_counts = {r["city_detected"] or "Punjab Region": r["c"] for r in cursor.fetchall()}

        cursor.execute("SELECT category, COUNT(*) as c FROM posts GROUP BY category ORDER BY c DESC")
        category_counts = {r["category"] or "Other": r["c"] for r in cursor.fetchall()}

        return {
            "totalPosts": total_posts,
            "peakAqi": max_aqi,
            "avgAqi": avg_aqi,
            "duplicatesMerged": duplicates_merged,
            "noiseRemoved": noise_removed,
            "activeNoiseCount": active_noise_count,
            "restoredPostsCount": restored_posts_count,
            "learnedRulesCount": learned_rules_count,
            "cityCounts": city_counts,
            "categoryCounts": category_counts,
            "dbPath": "[protected]"
        }

def get_query_versions_db():
    """Returns all query versions sorted by is_active DESC, id DESC."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM query_versions ORDER BY is_active DESC, id DESC")
        rows = cursor.fetchall()
        return [
            {
                "id": r["id"],
                "versionTag": r["version_tag"],
                "title": r["title"],
                "queryText": r["query_text"],
                "description": r["description"] or "",
                "isActive": bool(r["is_active"]),
                "createdAt": r["created_at"],
                "updatedAt": r["updated_at"]
            }
            for r in rows
        ]

def get_active_query_version_db():
    """Returns the currently active query version or None."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM query_versions WHERE is_active = 1 LIMIT 1")
        row = cursor.fetchone()
        if not row:
            cursor.execute("SELECT * FROM query_versions ORDER BY id DESC LIMIT 1")
            row = cursor.fetchone()
        if row:
            return {
                "id": row["id"],
                "versionTag": row["version_tag"],
                "title": row["title"],
                "queryText": row["query_text"],
                "description": row["description"] or "",
                "isActive": bool(row["is_active"]),
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"]
            }
        return None

def create_query_version_db(version_tag: str, title: str, query_text: str, description: str = "", set_active: bool = False):
    """Creates a new query version, optionally activating it."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        if set_active:
            cursor.execute("UPDATE query_versions SET is_active = 0")

        cursor.execute("""
            INSERT INTO query_versions (version_tag, title, query_text, description, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (version_tag.strip(), title.strip(), query_text.strip(), description.strip(), 1 if set_active else 0, now_iso, now_iso))
        new_id = cursor.lastrowid

        if set_active:
            cursor.execute("UPDATE settings SET value = ? WHERE key = 'default_query'", (query_text.strip(),))
            _sync_query_file(query_text.strip())

        conn.commit()

        cursor.execute("SELECT * FROM query_versions WHERE id = ?", (new_id,))
        row = cursor.fetchone()
        return {
            "id": row["id"],
            "versionTag": row["version_tag"],
            "title": row["title"],
            "queryText": row["query_text"],
            "description": row["description"] or "",
            "isActive": bool(row["is_active"]),
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"]
        }

def set_active_query_version_db(query_id: int):
    """Sets the specified query version as active and syncs system settings."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT query_text FROM query_versions WHERE id = ?", (query_id,))
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"Query version with id {query_id} not found.")

        query_text = row["query_text"]
        cursor.execute("UPDATE query_versions SET is_active = 0")
        cursor.execute("UPDATE query_versions SET is_active = 1, updated_at = ? WHERE id = ?", (now_iso, query_id))
        cursor.execute("UPDATE settings SET value = ? WHERE key = 'default_query'", (query_text,))
        _sync_query_file(query_text)
        conn.commit()
        return {"success": True, "activeId": query_id, "queryText": query_text}

def update_query_version_db(query_id: int, version_tag: str = None, title: str = None, query_text: str = None, description: str = None):
    """Updates an existing query version."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM query_versions WHERE id = ?", (query_id,))
        existing = cursor.fetchone()
        if not existing:
            raise ValueError(f"Query version with id {query_id} not found.")

        new_tag = version_tag.strip() if version_tag is not None else existing["version_tag"]
        new_title = title.strip() if title is not None else existing["title"]
        new_query = query_text.strip() if query_text is not None else existing["query_text"]
        new_desc = description.strip() if description is not None else (existing["description"] or "")

        cursor.execute("""
            UPDATE query_versions
            SET version_tag = ?, title = ?, query_text = ?, description = ?, updated_at = ?
            WHERE id = ?
        """, (new_tag, new_title, new_query, new_desc, now_iso, query_id))

        if existing["is_active"] and query_text is not None:
            cursor.execute("UPDATE settings SET value = ? WHERE key = 'default_query'", (new_query,))
            _sync_query_file(new_query)

        conn.commit()
        return {
            "id": query_id,
            "versionTag": new_tag,
            "title": new_title,
            "queryText": new_query,
            "description": new_desc,
            "isActive": bool(existing["is_active"]),
            "updatedAt": now_iso
        }

def delete_query_version_db(query_id: int):
    """Deletes a query version. Refuses to delete the active version or the last remaining version."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT is_active FROM query_versions WHERE id = ?", (query_id,))
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"Query version with id {query_id} not found.")
        if row["is_active"]:
            raise ValueError("Cannot delete the currently active query version. Please activate another version first.")

        cursor.execute("SELECT COUNT(*) FROM query_versions")
        if cursor.fetchone()[0] <= 1:
            raise ValueError("Cannot delete the only remaining query version.")

        cursor.execute("DELETE FROM query_versions WHERE id = ?", (query_id,))
        conn.commit()
        return {"success": True, "deletedId": query_id}

def _sync_query_file(query_text: str):
    """Helper to keep Query.txt updated across root and scrapper directories."""
    targets = [
        os.path.join(ROOT_DIR, "Query.txt"),
        os.path.join(ROOT_DIR, "scrapper", "Query.txt"),
    ]
    for target in targets:
        try:
            with open(target, "w", encoding="utf-8") as f:
                f.write(query_text + "\n")
        except Exception:
            pass

def authenticate_user_db(username_or_email: str, password: str):
    """
    Authenticates a user by username or email.
    Returns (user_dict, None) on success, or (None, error_message) on failure.
    """
    identifier = (username_or_email or "").strip().lower()
    if not identifier:
        return None, "Username or email is required."
    if not password:
        return None, "Password is required."

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.username, u.email, u.password_hash, u.salt, u.full_name,
                   u.avatar, u.role_id, u.is_active, u.created_at, u.updated_at,
                   r.name as role_name, r.display_name as role_display_name, r.is_system as role_is_system
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE LOWER(u.username) = ? OR LOWER(u.email) = ?
        """, (identifier, identifier))
        user_row = cursor.fetchone()

        if not user_row:
            print(f"[SECURITY] Failed login attempt for identifier: {identifier[:3]}*** from authentication check")
            return None, "Invalid username or password."

        if not user_row["is_active"]:
            return None, "This account is inactive. Please contact your system administrator."

        if not _verify_password(password, user_row["password_hash"], user_row["salt"]):
            print(f"[SECURITY] Failed password verification for user: {user_row['username']}")
            return None, "Invalid username or password."

        cursor.execute("""
            SELECT p.code
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
        """, (user_row["role_id"],))
        permissions = [row["code"] for row in cursor.fetchall()]

        user_data = {
            "id": user_row["id"],
            "username": user_row["username"],
            "email": user_row["email"],
            "fullName": user_row["full_name"],
            "avatar": user_row["avatar"] or "",
            "roleId": user_row["role_id"],
            "role": {
                "id": user_row["role_id"],
                "name": user_row["role_name"],
                "displayName": user_row["role_display_name"],
                "isSystem": bool(user_row["role_is_system"])
            },
            "permissions": permissions,
            "isActive": bool(user_row["is_active"]),
            "createdAt": user_row["created_at"]
        }
        return user_data, None

def create_auth_session_db(user_id: int) -> str:
    """Creates a secure session token with 7-day expiration and stores in auth_sessions."""
    token = secrets.token_hex(32)
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    expires_iso = (now + timedelta(days=7)).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO auth_sessions (token, user_id, created_at, expires_at, last_active_at)
            VALUES (?, ?, ?, ?, ?)
        """, (token, user_id, now_iso, expires_iso, now_iso))
        conn.commit()

    return token

def validate_auth_token_db(token: str):
    """
    Validates an incoming bearer token.
    Returns the user dict with active permissions, or None if invalid or expired.
    """
    if not token or not isinstance(token, str):
        return None

    clean_token = token.strip()
    now_iso = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.token, s.user_id, s.expires_at,
                   u.id, u.username, u.email, u.full_name, u.avatar, u.role_id, u.is_active, u.created_at,
                   r.name as role_name, r.display_name as role_display_name, r.is_system as role_is_system
            FROM auth_sessions s
            JOIN users u ON s.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE s.token = ?
        """, (clean_token,))
        row = cursor.fetchone()

        if not row:
            return None

        if row["expires_at"] < now_iso:
            cursor.execute("DELETE FROM auth_sessions WHERE token = ?", (clean_token,))
            conn.commit()
            return None

        if not row["is_active"]:
            return None

        cursor.execute("UPDATE auth_sessions SET last_active_at = ? WHERE token = ?", (now_iso, clean_token))
        conn.commit()

        cursor.execute("""
            SELECT p.code
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
        """, (row["role_id"],))
        permissions = [p_row["code"] for p_row in cursor.fetchall()]

        return {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "fullName": row["full_name"],
            "avatar": row["avatar"] or "",
            "roleId": row["role_id"],
            "role": {
                "id": row["role_id"],
                "name": row["role_name"],
                "displayName": row["role_display_name"],
                "isSystem": bool(row["role_is_system"])
            },
            "permissions": permissions,
            "isActive": bool(row["is_active"]),
            "createdAt": row["created_at"]
        }

def delete_auth_session_db(token: str) -> bool:
    """Deletes an active session token (logout)."""
    if not token:
        return False
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM auth_sessions WHERE token = ?", (token.strip(),))
        conn.commit()
        return cursor.rowcount > 0

def cleanup_expired_sessions_db() -> int:
    """Purges all expired auth sessions from the database. Returns count of purged sessions."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM auth_sessions WHERE expires_at < ?", (now_iso,))
        purged = cursor.rowcount
        conn.commit()
        return purged

def get_users_list_db(search: str = None, role_id: int = None, is_active: int = None, limit: int = 100, offset: int = 0):
    """Retrieves paginated users list with joined role details."""
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT u.id, u.username, u.email, u.full_name, u.avatar, u.role_id, u.is_active,
                   u.created_at, u.updated_at,
                   r.name as role_name, r.display_name as role_display_name, r.is_system as role_is_system
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE 1=1
        """
        count_query = "SELECT COUNT(*) FROM users u WHERE 1=1"
        params = []
        count_params = []

        if search:
            s = f"%{search.strip().lower()}%"
            filter_sql = " AND (LOWER(u.username) LIKE ? OR LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ?)"
            query += filter_sql
            count_query += filter_sql
            params.extend([s, s, s])
            count_params.extend([s, s, s])

        if role_id is not None and str(role_id) != "all":
            query += " AND u.role_id = ?"
            count_query += " AND u.role_id = ?"
            params.append(int(role_id))
            count_params.append(int(role_id))

        if is_active is not None and str(is_active) != "all":
            active_val = 1 if str(is_active).lower() in ("1", "true") else 0
            query += " AND u.is_active = ?"
            count_query += " AND u.is_active = ?"
            params.append(active_val)
            count_params.append(active_val)

        query += " ORDER BY u.created_at DESC"
        if limit:
            query += " LIMIT ? OFFSET ?"
            params.extend([limit, offset])

        cursor.execute(count_query, count_params)
        total_count = cursor.fetchone()[0]

        cursor.execute(query, params)
        users = []
        for r in cursor.fetchall():
            users.append({
                "id": r["id"],
                "username": r["username"],
                "email": r["email"],
                "fullName": r["full_name"],
                "avatar": r["avatar"] or "",
                "roleId": r["role_id"],
                "role": {
                    "id": r["role_id"],
                    "name": r["role_name"],
                    "displayName": r["role_display_name"],
                    "isSystem": bool(r["role_is_system"])
                },
                "isActive": bool(r["is_active"]),
                "createdAt": r["created_at"],
                "updatedAt": r["updated_at"]
            })

        return {"users": users, "total": total_count}

def get_user_by_id_db(user_id: int):
    """Retrieves single user details with full permissions."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.username, u.email, u.full_name, u.avatar, u.role_id, u.is_active,
                   u.created_at, u.updated_at,
                   r.name as role_name, r.display_name as role_display_name, r.is_system as role_is_system
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        """, (user_id,))
        row = cursor.fetchone()
        if not row:
            return None

        cursor.execute("""
            SELECT p.id, p.code, p.name, p.module
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
        """, (row["role_id"],))
        perms = [dict(p) for p in cursor.fetchall()]

        return {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "fullName": row["full_name"],
            "avatar": row["avatar"] or "",
            "roleId": row["role_id"],
            "role": {
                "id": row["role_id"],
                "name": row["role_name"],
                "displayName": row["role_display_name"],
                "isSystem": bool(row["role_is_system"])
            },
            "permissions": perms,
            "permissionCodes": [p["code"] for p in perms],
            "isActive": bool(row["is_active"]),
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"]
        }

def _role_permission_codes(cursor, role_id):
    cursor.execute("""
        SELECT p.code
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
    """, (role_id,))
    return {row["code"] for row in cursor.fetchall()}

def _assert_can_assign_role(cursor, current_user_id, role_id):
    if current_user_id is None:
        raise ValueError("current_user_id is required.")
    cursor.execute("""
        SELECT u.id, r.name AS role_name, r.id AS role_id
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
    """, (int(current_user_id),))
    caller = cursor.fetchone()
    if not caller:
        raise ValueError("current_user_id does not match a user.")
    cursor.execute("SELECT id, name FROM roles WHERE id = ?", (int(role_id),))
    role = cursor.fetchone()
    if not role:
        raise ValueError(f"Role ID {role_id} does not exist.")
    if caller["role_name"] == "super_admin":
        return
    if role["name"] == "super_admin":
        raise ValueError("Only a Super Administrator can assign the Super Administrator role.")
    caller_codes = _role_permission_codes(cursor, caller["role_id"])
    target_codes = _role_permission_codes(cursor, role["id"])
    if not target_codes.issubset(caller_codes):
        raise ValueError("Cannot assign a role whose permissions exceed your own.")

def create_user_db(username: str, email: str, password: str, full_name: str, role_id: int = None, is_active: int = 1, avatar: str = None, current_user_id: int = None):
    """Creates a new user record after uniqueness and role validation."""
    if current_user_id is None:
        raise ValueError("current_user_id is required.")
    u_name = (username or "").strip().lower()
    u_email = (email or "").strip().lower()
    u_full = (full_name or "").strip()
    u_pass = password or ""

    if not u_name or len(u_name) < 3:
        raise ValueError("Username must be at least 3 characters long.")
    if len(u_name) > 64:
        raise ValueError("Username must not exceed 64 characters.")
    if not re.match(r"^[a-z0-9_.-]+$", u_name):
        raise ValueError("Username may only contain lowercase letters, digits, underscores, hyphens, and dots.")
    if not u_email or "@" not in u_email:
        raise ValueError("A valid email address is required.")
    if len(u_email) > 254:
        raise ValueError("Email address is too long.")
    if not u_pass or len(u_pass) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if len(u_pass) > 1024:
        raise ValueError("Password is too long.")
    if not u_full:
        u_full = u_name.capitalize()
    if len(u_full) > 128:
        raise ValueError("Full name must not exceed 128 characters.")

    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM users WHERE LOWER(username) = ?", (u_name,))
        if cursor.fetchone():
            raise ValueError(f"Username '{u_name}' is already taken.")

        cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (u_email,))
        if cursor.fetchone():
            raise ValueError(f"Email '{u_email}' is already registered.")

        if not role_id:
            cursor.execute("SELECT id FROM roles WHERE name = 'viewer'")
            row = cursor.fetchone()
            if row:
                role_id = row["id"]
            else:
                cursor.execute("SELECT id FROM roles ORDER BY id ASC LIMIT 1")
                role_id = cursor.fetchone()["id"]
        else:
            cursor.execute("SELECT id FROM roles WHERE id = ?", (role_id,))
            if not cursor.fetchone():
                raise ValueError(f"Role ID {role_id} does not exist.")

        _assert_can_assign_role(cursor, current_user_id, role_id)

        pwd_hash, salt_hex = _hash_password(u_pass)
        now_iso = datetime.now(timezone.utc).isoformat()
        raw_avatar = avatar or f"https://api.dicebear.com/7.x/initials/svg?seed={u_name}"
        if not _is_safe_avatar_url(raw_avatar):
            raw_avatar = f"https://api.dicebear.com/7.x/initials/svg?seed={u_name}"
        u_avatar = raw_avatar

        cursor.execute("""
            INSERT INTO users (username, email, password_hash, salt, full_name, avatar, role_id, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (u_name, u_email, pwd_hash, salt_hex, u_full, u_avatar, role_id, 1 if is_active else 0, now_iso, now_iso))
        new_id = cursor.lastrowid
        conn.commit()

        return get_user_by_id_db(new_id)

def update_user_db(user_id: int, full_name: str = None, email: str = None, role_id: int = None,
                   is_active: int = None, password: str = None, avatar: str = None, current_user_id: int = None,
                   current_session_token: str = None):
    """Updates an existing user record with safeguards for the last Super Administrator."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?", (user_id,))
        existing = cursor.fetchone()
        if not existing:
            raise ValueError(f"User with ID {user_id} not found.")

        if existing["role_name"] == "super_admin":
            cursor.execute("""
                SELECT COUNT(*) FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE r.name = 'super_admin' AND u.is_active = 1
            """)
            admin_count = cursor.fetchone()[0]

            if admin_count <= 1:
                if is_active is not None and not is_active:
                    raise ValueError("Cannot deactivate the only remaining active Super Administrator.")
                if role_id is not None:
                    cursor.execute("SELECT name FROM roles WHERE id = ?", (role_id,))
                    new_role_row = cursor.fetchone()
                    if new_role_row and new_role_row["name"] != "super_admin":
                        raise ValueError("Cannot demote the only remaining active Super Administrator.")

        if current_user_id:
            cursor.execute("SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?", (current_user_id,))
            cur_role = cursor.fetchone()
            cur_role_name = cur_role["name"] if cur_role else ""
            if existing["role_name"] == "super_admin" and cur_role_name != "super_admin":
                raise ValueError("Only a Super Administrator can modify another Super Administrator account.")
            if role_id is not None:
                cursor.execute("SELECT name FROM roles WHERE id = ?", (role_id,))
                target_role_row = cursor.fetchone()
                if target_role_row and target_role_row["name"] == "super_admin" and cur_role_name != "super_admin":
                    raise ValueError("Only a Super Administrator can assign the Super Administrator role.")

        if role_id is not None and int(role_id) != int(existing["role_id"]):
            _assert_can_assign_role(cursor, current_user_id, int(role_id))

        new_email = (email or "").strip().lower() if email is not None else existing["email"]
        if email is not None and new_email != existing["email"]:
            if not new_email or "@" not in new_email:
                raise ValueError("A valid email address is required.")
            cursor.execute("SELECT id FROM users WHERE LOWER(email) = ? AND id != ?", (new_email, user_id))
            if cursor.fetchone():
                raise ValueError(f"Email '{new_email}' is already in use by another account.")

        new_full = full_name.strip() if full_name is not None else existing["full_name"]
        new_role_id = int(role_id) if role_id is not None else existing["role_id"]
        new_active = (1 if is_active else 0) if is_active is not None else existing["is_active"]
        new_avatar = avatar if avatar is not None else existing["avatar"]
        now_iso = datetime.now(timezone.utc).isoformat()

        if password and password.strip():
            if len(password.strip()) < 8:
                raise ValueError("Password must be at least 8 characters long.")
            pwd_hash, salt_hex = _hash_password(password.strip())
            cursor.execute("""
                UPDATE users
                SET full_name = ?, email = ?, role_id = ?, is_active = ?, avatar = ?,
                    password_hash = ?, salt = ?, updated_at = ?
                WHERE id = ?
            """, (new_full, new_email, new_role_id, new_active, new_avatar, pwd_hash, salt_hex, now_iso, user_id))
            if current_session_token:
                cursor.execute(
                    "DELETE FROM auth_sessions WHERE user_id = ? AND token != ?",
                    (user_id, str(current_session_token)),
                )
            else:
                cursor.execute("DELETE FROM auth_sessions WHERE user_id = ?", (user_id,))
        else:
            cursor.execute("""
                UPDATE users
                SET full_name = ?, email = ?, role_id = ?, is_active = ?, avatar = ?, updated_at = ?
                WHERE id = ?
            """, (new_full, new_email, new_role_id, new_active, new_avatar, now_iso, user_id))

        conn.commit()
        return get_user_by_id_db(user_id)

def delete_user_db(user_id: int, current_user_id: int = None):
    """Deletes a user record after checking safety constraints."""
    if current_user_id and int(user_id) == int(current_user_id):
        raise ValueError("You cannot delete your own logged-in account.")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise ValueError(f"User with ID {user_id} not found.")

        if user["role_name"] == "super_admin":
            cursor.execute("""
                SELECT COUNT(*) FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE r.name = 'super_admin' AND u.is_active = 1
            """)
            admin_count = cursor.fetchone()[0]
            if admin_count <= 1:
                raise ValueError("Cannot delete the only remaining Super Administrator.")

            if current_user_id:
                cursor.execute("SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?", (current_user_id,))
                cur_role = cursor.fetchone()
                cur_role_name = cur_role["name"] if cur_role else ""
                if cur_role_name != "super_admin":
                    raise ValueError("Only a Super Administrator can delete a Super Administrator account.")

        cursor.execute("DELETE FROM auth_sessions WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()

        return {"success": True, "deletedId": user_id, "username": user["username"]}

def get_permissions_list_db():
    """Returns all available system permissions grouped by module."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, code, name, description, module FROM permissions ORDER BY module ASC, id ASC")
        rows = cursor.fetchall()

        by_module = {}
        all_perms = []
        for r in rows:
            item = {
                "id": r["id"],
                "code": r["code"],
                "name": r["name"],
                "description": r["description"] or "",
                "module": r["module"]
            }
            all_perms.append(item)
            by_module.setdefault(r["module"], []).append(item)

        return {"permissions": all_perms, "byModule": by_module}

def get_roles_list_db():
    """Returns all roles with user count and full permission lists."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, display_name, description, is_system, created_at, updated_at FROM roles ORDER BY id ASC")
        roles_rows = cursor.fetchall()

        roles = []
        for r in roles_rows:
            role_id = r["id"]
            cursor.execute("SELECT COUNT(*) FROM users WHERE role_id = ?", (role_id,))
            user_count = cursor.fetchone()[0]

            cursor.execute("""
                SELECT p.id, p.code, p.name, p.module, p.description
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ?
                ORDER BY p.module ASC, p.id ASC
            """, (role_id,))
            perms = [dict(p) for p in cursor.fetchall()]

            roles.append({
                "id": role_id,
                "name": r["name"],
                "displayName": r["display_name"],
                "description": r["description"] or "",
                "isSystem": bool(r["is_system"]),
                "userCount": user_count,
                "permissionCount": len(perms),
                "permissions": perms,
                "permissionCodes": [p["code"] for p in perms],
                "createdAt": r["created_at"],
                "updatedAt": r["updated_at"]
            })

        return roles

def get_role_by_id_db(role_id: int):
    """Retrieves single role by ID with permissions."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, display_name, description, is_system, created_at, updated_at FROM roles WHERE id = ?", (role_id,))
        r = cursor.fetchone()
        if not r:
            return None

        cursor.execute("SELECT COUNT(*) FROM users WHERE role_id = ?", (role_id,))
        user_count = cursor.fetchone()[0]

        cursor.execute("""
            SELECT p.id, p.code, p.name, p.module, p.description
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
            ORDER BY p.module ASC, p.id ASC
        """, (role_id,))
        perms = [dict(p) for p in cursor.fetchall()]

        return {
            "id": r["id"],
            "name": r["name"],
            "displayName": r["display_name"],
            "description": r["description"] or "",
            "isSystem": bool(r["is_system"]),
            "userCount": user_count,
            "permissionCount": len(perms),
            "permissions": perms,
            "permissionCodes": [p["code"] for p in perms],
            "createdAt": r["created_at"],
            "updatedAt": r["updated_at"]
        }

def create_role_db(name: str, display_name: str, description: str = None, permission_ids: list = None):
    """Creates a custom role and attaches granted permissions."""
    slug = (name or "").strip().lower().replace(" ", "_")
    d_name = (display_name or "").strip()

    if not slug or len(slug) < 2:
        raise ValueError("Role name identifier must be at least 2 characters long.")
    if not d_name:
        raise ValueError("Role display name is required.")

    now_iso = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM roles WHERE LOWER(name) = ?", (slug,))
        if cursor.fetchone():
            raise ValueError(f"A role with identifier '{slug}' already exists.")

        cursor.execute("""
            INSERT INTO roles (name, display_name, description, is_system, created_at, updated_at)
            VALUES (?, ?, ?, 0, ?, ?)
        """, (slug, d_name, (description or "").strip(), now_iso, now_iso))
        role_id = cursor.lastrowid

        if permission_ids and isinstance(permission_ids, list):
            for pid in permission_ids:
                cursor.execute("""
                    INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
                    VALUES (?, ?)
                """, (role_id, int(pid)))

        conn.commit()
        return get_role_by_id_db(role_id)

def update_role_db(role_id: int, display_name: str = None, description: str = None, permission_ids: list = None):
    """Updates role display properties and granted permissions."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM roles WHERE id = ?", (role_id,))
        role = cursor.fetchone()
        if not role:
            raise ValueError(f"Role with ID {role_id} not found.")

        now_iso = datetime.now(timezone.utc).isoformat()
        new_dname = display_name.strip() if display_name is not None else role["display_name"]
        new_desc = description.strip() if description is not None else (role["description"] or "")

        cursor.execute("""
            UPDATE roles
            SET display_name = ?, description = ?, updated_at = ?
            WHERE id = ?
        """, (new_dname, new_desc, now_iso, role_id))

        if permission_ids is not None and isinstance(permission_ids, list):
            if role["name"] == "super_admin":
                cursor.execute("SELECT id FROM permissions")
                all_ids = [row["id"] for row in cursor.fetchall()]
                permission_ids = all_ids

            cursor.execute("DELETE FROM role_permissions WHERE role_id = ?", (role_id,))
            for pid in permission_ids:
                cursor.execute("""
                    INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
                    VALUES (?, ?)
                """, (role_id, int(pid)))

        conn.commit()
        return get_role_by_id_db(role_id)

def delete_role_db(role_id: int):
    """Deletes a custom role after verifying no assigned users and not a system role."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM roles WHERE id = ?", (role_id,))
        role = cursor.fetchone()
        if not role:
            raise ValueError(f"Role with ID {role_id} not found.")

        if role["is_system"]:
            raise ValueError(f"Cannot delete built-in system role '{role['display_name']}'.")

        cursor.execute("SELECT COUNT(*) FROM users WHERE role_id = ?", (role_id,))
        assigned_count = cursor.fetchone()[0]
        if assigned_count > 0:
            raise ValueError(f"Cannot delete role '{role['display_name']}' because it is assigned to {assigned_count} user(s). Please reassign them first.")

        cursor.execute("DELETE FROM role_permissions WHERE role_id = ?", (role_id,))
        cursor.execute("DELETE FROM roles WHERE id = ?", (role_id,))
        conn.commit()
        return {"success": True, "deletedId": role_id, "name": role["name"]}

import urllib.request
import urllib.parse

_TURNSTILE_BYPASS_TOKENS = frozenset({
    "DEMO_BYPASS",
    "TEST_BYPASS",
    "XXXX.DUMMY.TOKEN.XXXX",
})
_TURNSTILE_DUMMY_SECRET = "1x0000000000000000000000000000000AA"

def _turnstile_secret_is_unusable(secret: str) -> bool:
    if not secret or not str(secret).strip():
        return True
    value = str(secret).strip()
    if "CHANGE_ME" in value or value.startswith("YourSecure"):
        return True
    return value == _TURNSTILE_DUMMY_SECRET

def verify_turnstile_token(token: str, remote_ip: str = None) -> tuple:
    """
    Validates a Cloudflare Turnstile token against the siteverify API.
    Returns (True, '') only when Cloudflare accepts the token, or when the
    configured test token matches exactly. Bypass literals never succeed.
    """
    if not token or not isinstance(token, str) or not token.strip():
        return False, "Cloudflare Turnstile token is missing. Please complete the security verification."

    clean_token = token.strip()
    if clean_token in _TURNSTILE_BYPASS_TOKENS:
        return False, "Turnstile verification failed."

    configured_test = os.environ.get("EPA_TURNSTILE_TEST_TOKEN", "").strip()
    if configured_test and configured_test not in _TURNSTILE_BYPASS_TOKENS and clean_token == configured_test:
        return True, ""

    settings = get_settings()
    turnstile_secret = (settings.get("turnstile_secret_key") or "").strip() or os.environ.get("TURNSTILE_SECRET_KEY", "").strip()
    if _turnstile_secret_is_unusable(turnstile_secret):
        return False, "Turnstile secret is not configured."

    url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    payload = {
        "secret": turnstile_secret,
        "response": clean_token
    }
    if remote_ip:
        payload["remoteip"] = remote_ip

    try:
        data = urllib.parse.urlencode(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST", headers={
            "User-Agent": "EPA-Punjab-AirQuality/2.0"
        })
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if body.get("success") is True:
                return True, ""
            err_codes = body.get("error-codes") or ["turnstile-validation-failed"]
            return False, f"Turnstile verification failed: {', '.join(str(code) for code in err_codes)}"
    except Exception as exc:
        return False, f"Turnstile verification failed: {exc}"
