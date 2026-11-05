import sys
import os
import json
import re
import time
import gzip
import threading
import urllib.parse
import http.server
import socketserver

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(ROOT_DIR, "dashboard", "dist")
PORTAL_DIR = os.path.join(ROOT_DIR, "portal")
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend import database
from backend import service

PORT = int(os.environ.get("PORT", 8080))
# Respect HOST env var; default to loopback only. Never bind to "" implicitly.
HOST = os.environ.get("HOST", "127.0.0.1")

# ---------------------------------------------------------------------------
# Allowed origins for CORS.  Restrict to the actual frontend origin(s).
# In development this defaults to localhost; set CORS_ORIGIN env var in prod.
# ---------------------------------------------------------------------------
_ALLOWED_ORIGINS = {
    f"http://localhost:{PORT}",
    f"http://127.0.0.1:{PORT}",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}
_custom_origin = os.environ.get("CORS_ORIGIN")
if _custom_origin:
    for orig in _custom_origin.split(","):
        if orig.strip():
            _ALLOWED_ORIGINS.add(orig.strip().rstrip("/"))

_DEFAULT_CORS_ORIGIN = _custom_origin.split(",")[0].strip() if _custom_origin else f"http://localhost:{PORT}"

# ---------------------------------------------------------------------------
# Request body size cap: 16 MB. Supports raw scraped batches while guarding DoS.
# ---------------------------------------------------------------------------
MAX_REQUEST_BODY_BYTES = 16 * 1024 * 1024  # 16 MB

# ---------------------------------------------------------------------------
# Rate limiter for sensitive endpoints (login / signup / turnstile verify).
# Sliding-window in-memory counter per IP address.
# ---------------------------------------------------------------------------
_rate_lock = threading.Lock()
_rate_buckets: dict[str, list] = {}   # ip -> [timestamps]
RATE_WINDOW_SECONDS = int(os.environ.get("RATE_LIMIT_WINDOW", 60))
RATE_MAX_REQUESTS = int(os.environ.get("RATE_LIMIT_LOGIN_MAX", 30))


def _is_rate_limited(ip: str) -> bool:
    """Returns True if the IP has exceeded the allowed auth request rate."""
    now = time.monotonic()
    with _rate_lock:
        timestamps = _rate_buckets.get(ip, [])
        # Drop entries outside the window
        timestamps = [t for t in timestamps if now - t < RATE_WINDOW_SECONDS]
        if len(timestamps) >= RATE_MAX_REQUESTS:
            _rate_buckets[ip] = timestamps
            return True
        timestamps.append(now)
        _rate_buckets[ip] = timestamps
        return False


if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


class SPAServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        serve_dir = DIST_DIR if os.path.exists(DIST_DIR) else (PORTAL_DIR if os.path.exists(PORTAL_DIR) else ROOT_DIR)
        super().__init__(*args, directory=serve_dir, **kwargs)

    # -----------------------------------------------------------------------
    # CORS helpers
    # -----------------------------------------------------------------------
    def _get_request_origin(self) -> str:
        return self.headers.get("Origin", "")

    def _set_cors_headers(self):
        """Emit CORS headers, restricting to the configured allowed origin."""
        request_origin = self._get_request_origin()
        # If the requesting origin matches our allowed origin, reflect it.
        # Otherwise emit the allowed origin so browsers reject the request.
        if request_origin and request_origin.rstrip("/") in _ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", request_origin)
            self.send_header("Vary", "Origin")
        else:
            self.send_header("Access-Control-Allow-Origin", _DEFAULT_CORS_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Credentials", "true")

    def _set_security_headers(self):
        """Emit HTTP security headers for all responses, including static files."""
        if getattr(self, "_security_headers_sent", False):
            return
        self._security_headers_sent = True
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("X-XSS-Protection", "1; mode=block")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Permissions-Policy", "geolocation=(), camera=(), microphone=()")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; "
            "style-src 'self' 'unsafe-inline' https:; "
            "img-src 'self' data: https: blob:; "
            "media-src 'self' https: data: blob:; "
            "connect-src 'self' https:; "
            "frame-src 'self' https://challenges.cloudflare.com https://platform.twitter.com; "
            "frame-ancestors 'none'; "
            "font-src 'self' https: data:; "
            "object-src 'none'; "
            "base-uri 'self';"
        )

    def end_headers(self):
        self._set_security_headers()
        super().end_headers()

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self._set_cors_headers()
        self._set_security_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

    _GZIP_STATIC_EXT = {".js", ".css", ".html", ".json", ".svg", ".mjs"}

    def _send_gzip_static(self, path):
        ext = os.path.splitext(path)[1].lower()
        if ext not in self._GZIP_STATIC_EXT:
            return False
        accept = (self.headers.get("Accept-Encoding") or "").lower()
        if "gzip" not in accept:
            return False
        try:
            size = os.path.getsize(path)
        except OSError:
            return False
        if size < 1024:
            return False
        try:
            with open(path, "rb") as handle:
                raw = handle.read()
        except OSError:
            return False
        compressed = gzip.compress(raw, compresslevel=6)
        self.send_response(200)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Encoding", "gzip")
        self.send_header("Vary", "Accept-Encoding")
        self.send_header("Content-Length", str(len(compressed)))
        self._set_cors_headers()
        self._set_security_headers()
        self.end_headers()
        self.wfile.write(compressed)
        self.wfile.flush()
        return True

    def send_json(self, data, status=200):
        """Helper to send a JSON response with CORS and security headers."""
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        accept = (self.headers.get("Accept-Encoding") or "").lower()
        use_gzip = "gzip" in accept and len(payload) >= 1024
        if use_gzip:
            payload = gzip.compress(payload, compresslevel=6)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._set_cors_headers()
        self._set_security_headers()
        if use_gzip:
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Vary", "Accept-Encoding")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)
        self.wfile.flush()

    def _get_bearer_token(self):
        """Extracts Bearer token from Authorization header ONLY.
        Token-in-query-param is intentionally rejected: tokens in URLs are
        logged by proxies and appear in browser history.
        """
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header[7:].strip()
        return None

    def _get_authenticated_user(self):
        """Validates bearer token and returns user dictionary or None."""
        token = self._get_bearer_token()
        if not token:
            return None
        return database.validate_auth_token_db(token)

    def _check_permission(self, permission_code: str):
        """
        Validates that request comes from an authenticated user with the required permission.
        Returns (user, None) if authorized, or (None, (error_dict, status_code)) if unauthorized.
        """
        user = self._get_authenticated_user()
        if not user:
            return None, ({"error": "Authentication required. Please provide a valid Bearer token.", "code": "UNAUTHORIZED"}, 401)

        if user.get("role", {}).get("name") == "super_admin":
            return user, None

        user_perms = user.get("permissions", [])
        if permission_code not in user_perms:
            return None, ({
                "error": f"Permission denied. Required permission: '{permission_code}'.",
                "code": "FORBIDDEN",
                "requiredPermission": permission_code
            }, 403)

        return user, None

    def _trusted_proxies(self):
        raw = os.environ.get("TRUSTED_PROXIES", "")
        return {item.strip() for item in raw.split(",") if item.strip()}

    def _get_client_ip(self) -> str:
        """Rate-limit on the peer address unless that peer is a trusted proxy."""
        peer = self.client_address[0] if getattr(self, "client_address", None) else "127.0.0.1"
        if peer in self._trusted_proxies():
            xff = self.headers.get("X-Forwarded-For", "")
            if xff:
                return xff.split(",")[0].strip()
        return peer

    def _parse_json_body(self):
        """Parses request JSON body with an enforced size cap."""
        raw_len = self.headers.get('Content-Length')
        if raw_len is None:
            return {}
        content_length = int(raw_len)
        if content_length <= 0:
            return {}
        if content_length > MAX_REQUEST_BODY_BYTES:
            raise ValueError(f"Request body too large ({content_length} bytes). Maximum is {MAX_REQUEST_BODY_BYTES} bytes.")
        raw_body = self.rfile.read(content_length).decode('utf-8')
        return json.loads(raw_body)

    def address_string(self):
        """Prevent slow reverse DNS lookups on every incoming request."""
        return self.client_address[0] if getattr(self, "client_address", None) else "127.0.0.1"

    # -----------------------------------------------------------------------
    # Suppress verbose request logging in production
    # -----------------------------------------------------------------------
    def log_message(self, fmt, *args):
        # Only log errors/warnings. A failed write must not abort the response:
        # send_response logs before it writes the status line, and a closed
        # console was dropping every 4xx login reply.
        try:
            if args and len(args) >= 2:
                code = str(args[1]) if len(args) > 1 else ""
                if code.startswith(("4", "5")):
                    super().log_message(fmt, *args)
        except Exception:
            return

    # -----------------------------------------------------------------------
    # GET handler
    # -----------------------------------------------------------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)

        if path.startswith('/api/'):
            try:
                if path == '/api/health':
                    self.send_json({"status": "ok"})
                    return

                # --- Auth endpoints ---
                if path == '/api/auth/turnstile-key':
                    site_key = database.turnstile_site_key_for_request(
                        self.headers.get("Host", ""),
                        self.headers.get("Origin", ""),
                    )
                    self.send_json({"siteKey": site_key})
                    return

                elif path == '/api/auth/me':
                    token = self._get_bearer_token()
                    if not token:
                        self.send_json({"error": "No authorization token provided.", "code": "UNAUTHORIZED"}, status=401)
                        return
                    try:
                        me = service.auth_me_service(token)
                        self.send_json(me)
                    except ValueError as ve:
                        self.send_json({"error": str(ve), "code": "UNAUTHORIZED"}, status=401)
                    return

                # --- User management (requires auth + permission) ---
                elif path == '/api/users':
                    user, err_resp = self._check_permission("users.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    search = qs.get('search', [None])[0]
                    role_id = qs.get('roleId', [None])[0]
                    is_active = qs.get('isActive', [None])[0]
                    limit = int(qs.get('limit')[0]) if 'limit' in qs else 100
                    offset = int(qs.get('offset')[0]) if 'offset' in qs else 0
                    users = service.get_users_service(search=search, role_id=role_id, is_active=is_active, limit=limit, offset=offset)
                    self.send_json(users)
                    return

                elif re.match(r'^/api/users/(\d+)$', path):
                    user, err_resp = self._check_permission("users.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    user_id = int(re.match(r'^/api/users/(\d+)$', path).group(1))
                    u = service.get_user_service(user_id)
                    self.send_json(u)
                    return

                # --- Role management (requires auth + permission) ---
                elif path == '/api/roles':
                    user, err_resp = self._check_permission("roles.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    roles = service.get_roles_service()
                    self.send_json(roles)
                    return

                elif re.match(r'^/api/roles/(\d+)$', path):
                    user, err_resp = self._check_permission("roles.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    role_id = int(re.match(r'^/api/roles/(\d+)$', path).group(1))
                    r = service.get_role_service(role_id)
                    self.send_json(r)
                    return

                elif path == '/api/permissions':
                    user, err_resp = self._check_permission("roles.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    perms = service.get_permissions_service()
                    self.send_json(perms)
                    return

                # --- Settings (requires auth + settings.view) ---
                elif path == '/api/settings':
                    user, err_resp = self._check_permission("settings.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    self.send_json(service.get_current_settings())
                    return

                # --- Posts feed (requires auth + posts.view) ---
                elif path == '/api/posts':
                    user, err_resp = self._check_permission("posts.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    search = qs.get('search', [None])[0]
                    city = qs.get('city', [None])[0]
                    severity = qs.get('severity', [None])[0]
                    category = qs.get('category', [None])[0]
                    sort_by = qs.get('sortBy', ['newest'])[0]
                    sort_order = qs.get('order', [qs.get('sortOrder', ['desc'])[0]])[0]
                    limit = int(qs.get('limit')[0]) if 'limit' in qs else None
                    offset = int(qs.get('offset')[0]) if 'offset' in qs else 0
                    date = qs.get('date', [None])[0]
                    time_of_day = qs.get('timeOfDay', [None])[0]
                    media = qs.get('media', [None])[0]
                    verified = qs.get('verified', [None])[0]
                    page = service.get_posts_page_service(
                        search=search, city=city, severity=severity, category=category, sort_by=sort_by,
                        sort_order=sort_order, limit=limit, offset=offset, date=date,
                        time_of_day=time_of_day, media=media, verified=verified,
                    )
                    self.send_json(page)
                    return

                # --- Audit log (requires auth + audit.view) ---
                elif path == '/api/audit':
                    user, err_resp = self._check_permission("audit.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    limit = int(qs.get('limit', [50])[0]) if 'limit' in qs else 50
                    offset = int(qs.get('offset')[0]) if 'offset' in qs else 0
                    status = qs.get('status', [None])[0]
                    search = qs.get('search', [None])[0]
                    logs = service.get_audit_page_service(limit=limit, offset=offset, status=status, search=search)
                    self.send_json(logs)
                    return

                # --- Stats (requires auth + dashboard.view) ---
                elif path == '/api/stats':
                    user, err_resp = self._check_permission("dashboard.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    date = qs.get('date', [None])[0]
                    time_of_day = qs.get('timeOfDay', [None])[0]
                    stats = database.get_db_stats(date=date, time_of_day=time_of_day)
                    self.send_json(stats)
                    return

                # --- Noise pool (requires auth + noise.view) ---
                elif path == '/api/noise':
                    user, err_resp = self._check_permission("noise.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    search = qs.get('search', [None])[0]
                    category = qs.get('category', [None])[0]
                    status = qs.get('status', ['EXCLUDED'])[0]
                    limit = int(qs.get('limit')[0]) if 'limit' in qs else 100
                    offset = int(qs.get('offset')[0]) if 'offset' in qs else 0
                    sort_by = qs.get('sortBy', ['newest'])[0]
                    sort_order = qs.get('sortOrder', [qs.get('order', ['desc'])[0]])[0]
                    noise_page = service.get_noise_page_service(
                        search=search, category=category, status=status,
                        sort_by=sort_by, sort_order=sort_order,
                        limit=limit, offset=offset
                    )
                    self.send_json(noise_page)
                    return

                elif path == '/api/noise/stats':
                    user, err_resp = self._check_permission("noise.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    stats = service.get_noise_stats_service()
                    self.send_json(stats)
                    return

                # --- Learned rules (requires auth + noise.manage) ---
                elif path == '/api/learned-rules':
                    user, err_resp = self._check_permission("noise.manage")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    rules = service.get_learned_rules_service()
                    self.send_json(rules)
                    return

                # --- Sentiment status (requires auth + settings.view) ---
                elif path == '/api/sentiment/status':
                    user, err_resp = self._check_permission("settings.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    from backend import sentiment_engine
                    settings = database.get_settings()
                    is_trans, trans_msg = sentiment_engine.is_transformer_available()
                    self.send_json({
                        "activeEngine": settings.get("sentiment_engine", "vader"),
                        "transformerAvailable": is_trans,
                        "transformerStatus": trans_msg,
                        "vaderAvailable": True
                    })
                    return

                # --- Query versions (requires auth + settings.view) ---
                elif path == '/api/queries':
                    user, err_resp = self._check_permission("settings.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    versions = service.get_query_versions_service()
                    self.send_json(versions)
                    return

                elif path == '/api/queries/active':
                    user, err_resp = self._check_permission("settings.view")
                    if err_resp:
                        self.send_json(err_resp[0], status=err_resp[1])
                        return
                    active = service.get_active_query_service()
                    self.send_json(active)
                    return

                else:
                    self.send_json({"error": f"API endpoint not found: {path}"}, status=404)
                    return
            except ValueError as ve:
                self.send_json({"error": str(ve), "success": False}, status=400)
                return
            except Exception:
                # Do NOT expose internal exception details to callers
                self.send_json({"error": "An internal server error occurred.", "success": False}, status=500)
                return

        translated = self.translate_path(self.path)
        if not os.path.exists(translated) and not os.path.splitext(self.path)[1]:
            self.path = '/index.html'
            translated = self.translate_path(self.path)
        if self._send_gzip_static(translated):
            return
        return super().do_GET()

    # -----------------------------------------------------------------------
    # POST handler
    # -----------------------------------------------------------------------
    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if not path.startswith('/api/'):
            self.send_json({"error": "Method not allowed for static assets"}, status=405)
            return

        try:
            body = self._parse_json_body()
        except ValueError as ve:
            self.send_json({"error": str(ve)}, status=413 if "too large" in str(ve) else 400)
            return
        except Exception:
            self.send_json({"error": "Invalid JSON payload."}, status=400)
            return

        try:
            client_ip = self._get_client_ip()

            # ----- Rate-limited auth endpoints -----
            if path == '/api/auth/login':
                if _is_rate_limited(client_ip):
                    self.send_json({"error": "Too many login attempts. Please wait and try again.", "code": "RATE_LIMITED"}, status=429)
                    return
                username = body.get('username') or body.get('email')
                password = body.get('password')
                turnstile_token = body.get('turnstileToken') or body.get('turnstile_token')
                res = service.auth_login_service(username, password, turnstile_token=turnstile_token, remote_ip=client_ip)
                self.send_json(res)

            elif path == '/api/auth/signup':
                self.send_json({
                    "error": "Public registration is disabled. User accounts must be created by an administrator in User Management.",
                    "code": "REGISTRATION_DISABLED"
                }, status=403)
                return

            elif path == '/api/auth/logout':
                token = self._get_bearer_token()
                res = service.auth_logout_service(token)
                self.send_json(res)

            elif path == '/api/turnstile/verify':
                if _is_rate_limited(client_ip):
                    self.send_json({"success": False, "message": "Too many verification attempts."}, status=429)
                    return
                token = body.get('token')
                ok, msg = database.verify_turnstile_token(token, client_ip)
                self.send_json({"success": ok, "message": msg})

            # ----- User management (requires auth + permission) -----
            elif path == '/api/users':
                user, err_resp = self._check_permission("users.create")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                res = service.create_user_service(body, current_user_id=user["id"])
                self.send_json(res, status=201)

            elif re.match(r'^/api/users/(\d+)/update$', path) or re.match(r'^/api/users/(\d+)$', path):
                user, err_resp = self._check_permission("users.edit")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                m = re.match(r'^/api/users/(\d+)', path)
                target_user_id = int(m.group(1))
                res = service.update_user_service(
                    target_user_id,
                    body,
                    current_user_id=user["id"],
                    current_session_token=self._get_bearer_token(),
                )
                self.send_json(res)

            elif re.match(r'^/api/users/(\d+)/delete$', path):
                user, err_resp = self._check_permission("users.delete")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                target_user_id = int(re.match(r'^/api/users/(\d+)/delete$', path).group(1))
                res = service.delete_user_service(target_user_id, current_user_id=user["id"])
                self.send_json(res)

            # ----- Role management (requires auth + permission) -----
            elif path == '/api/roles':
                user, err_resp = self._check_permission("roles.create")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                res = service.create_role_service(body, current_user_id=user["id"])
                self.send_json(res, status=201)

            elif re.match(r'^/api/roles/(\d+)/update$', path) or re.match(r'^/api/roles/(\d+)$', path):
                user, err_resp = self._check_permission("roles.edit")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                m = re.match(r'^/api/roles/(\d+)', path)
                target_role_id = int(m.group(1))
                res = service.update_role_service(target_role_id, body, current_user_id=user["id"])
                self.send_json(res)

            elif re.match(r'^/api/roles/(\d+)/delete$', path):
                user, err_resp = self._check_permission("roles.delete")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                target_role_id = int(re.match(r'^/api/roles/(\d+)/delete$', path).group(1))
                res = service.delete_role_service(target_role_id)
                self.send_json(res)

            # ----- Settings management (requires auth + settings.manage) -----
            elif path == '/api/settings':
                user, err_resp = self._check_permission("settings.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                updated = service.update_settings(body)
                self.send_json(updated)

            # ----- X API credential management (requires auth + settings.manage) -----
            elif path == '/api/x/test-connection':
                user, err_resp = self._check_permission("settings.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                bearer_token = body.get('bearerToken')
                api_key = body.get('apiKey')
                api_secret = body.get('apiSecret')
                res = service.test_x_credentials(bearer_token, api_key, api_secret)
                self.send_json(res)

            # ----- Live X search (requires auth + posts.search_x) -----
            elif path == '/api/x/search':
                user, err_resp = self._check_permission("posts.search_x")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                keyword = body.get('keyword', '')
                live_override = bool(body.get('liveOverride', False))
                max_results = int(body.get('maxResults', 25))
                simulate_if_missing = bool(body.get('simulateIfMissing', True))
                res = service.execute_search_and_fetch(
                    keyword=keyword,
                    live_override=live_override,
                    max_results=max_results,
                    simulate_if_missing=simulate_if_missing
                )
                self.send_json(res)

            # ----- Batch ingest (requires auth + posts.ingest) -----
            elif path == '/api/ingest':
                user, err_resp = self._check_permission("posts.ingest")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                posts_batch = body.get('posts', [])
                mode = body.get('mode', 'merge')
                res = service.ingest_raw_batch(posts_batch, mode=mode)
                self.send_json(res)

            # ----- Noise management (requires auth + noise.manage) -----
            elif path == '/api/noise/restore':
                user, err_resp = self._check_permission("noise.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                post_id = body.get('postId')
                learned_rules = body.get('learnedRules', [])
                res = service.restore_noise_post_service(post_id, learned_rules=learned_rules)
                self.send_json(res)

            elif path == '/api/noise/exclude' or path == '/api/posts/exclude':
                user, err_resp = self._check_permission("posts.exclude")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                post_id = body.get('postId')
                reason = body.get('reason')
                category = body.get('category', 'MANUAL_EXCLUDED')
                remove_rules = bool(body.get('removeAssociatedRules', True))
                res = service.exclude_post_service(
                    post_id=post_id,
                    reason=reason,
                    category=category,
                    remove_associated_rules=remove_rules
                )
                self.send_json(res)

            elif path == '/api/noise/candidates':
                user, err_resp = self._check_permission("noise.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                post_id = body.get('postId')
                text = body.get('text', '')
                author = body.get('author', '')
                category = body.get('category', '')
                reason = body.get('reason', '')
                candidates = service.extract_candidates_service(
                    post_id=post_id, text=text, author=author, category=category, reason=reason
                )
                self.send_json(candidates)

            # ----- Learned rules (requires auth + noise.manage) -----
            elif path == '/api/learned-rules':
                user, err_resp = self._check_permission("noise.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                rule_type = body.get('ruleType')
                rule_value = body.get('ruleValue')
                description = body.get('description')
                res = service.add_learned_rule_service(rule_type, rule_value, description=description)
                self.send_json(res)

            elif path == '/api/learned-rules/toggle':
                user, err_resp = self._check_permission("noise.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                rule_id = int(body.get('id', 0))
                is_active = bool(body.get('isActive', True))
                res = service.toggle_learned_rule_service(rule_id, is_active)
                self.send_json(res)

            elif path == '/api/learned-rules/delete':
                user, err_resp = self._check_permission("noise.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                rule_id = int(body.get('id', 0))
                res = service.delete_learned_rule_service(rule_id)
                self.send_json(res)

            # ----- Sentiment engine (requires auth + settings.manage) -----
            elif path == '/api/sentiment/engine':
                user, err_resp = self._check_permission("settings.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                engine = body.get('engine', 'vader')
                database.save_settings({"sentiment_engine": engine})
                self.send_json({"success": True, "activeEngine": engine})

            elif path == '/api/sentiment/reanalyze':
                user, err_resp = self._check_permission("settings.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                engine = body.get('engine') or database.get_settings().get('sentiment_engine', 'vader')
                res = database.reanalyze_all_posts_db(engine)
                self.send_json(res)

            # ----- Query versions (requires auth + settings.manage) -----
            elif path == '/api/queries':
                user, err_resp = self._check_permission("settings.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                res = service.save_query_version_service(body)
                self.send_json(res)

            elif path == '/api/queries/activate':
                user, err_resp = self._check_permission("settings.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                query_id = int(body.get('id', 0))
                res = service.activate_query_version_service(query_id)
                self.send_json(res)

            elif path == '/api/queries/update':
                user, err_resp = self._check_permission("settings.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                res = service.update_query_version_service(body)
                self.send_json(res)

            elif path == '/api/queries/delete':
                user, err_resp = self._check_permission("settings.manage")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                query_id = int(body.get('id', 0))
                res = service.delete_query_version_service(query_id)
                self.send_json(res)

            else:
                self.send_json({"error": f"Unknown POST endpoint: {path}"}, status=404)
        except ValueError as ve:
            self.send_json({"error": str(ve), "success": False}, status=400)
        except Exception:
            # Do NOT expose internal exception details to callers
            self.send_json({"error": "An internal server error occurred.", "success": False}, status=500)

    # -----------------------------------------------------------------------
    # PUT handler
    # -----------------------------------------------------------------------
    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if not path.startswith('/api/'):
            self.send_json({"error": "Method not allowed"}, status=405)
            return

        try:
            body = self._parse_json_body()
        except ValueError as ve:
            self.send_json({"error": str(ve)}, status=413 if "too large" in str(ve) else 400)
            return
        except Exception:
            self.send_json({"error": "Invalid JSON payload."}, status=400)
            return

        try:
            m_user = re.match(r'^/api/users/(\d+)$', path)
            if m_user:
                user, err_resp = self._check_permission("users.edit")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                user_id = int(m_user.group(1))
                res = service.update_user_service(
                    user_id,
                    body,
                    current_user_id=user["id"],
                    current_session_token=self._get_bearer_token(),
                )
                self.send_json(res)
                return

            m_role = re.match(r'^/api/roles/(\d+)$', path)
            if m_role:
                user, err_resp = self._check_permission("roles.edit")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                role_id = int(m_role.group(1))
                res = service.update_role_service(role_id, body, current_user_id=user["id"])
                self.send_json(res)
                return

            self.send_json({"error": f"Endpoint not found: {path}"}, status=404)
        except ValueError as ve:
            self.send_json({"error": str(ve), "success": False}, status=400)
        except Exception:
            self.send_json({"error": "An internal server error occurred.", "success": False}, status=500)

    # -----------------------------------------------------------------------
    # DELETE handler
    # -----------------------------------------------------------------------
    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if not path.startswith('/api/'):
            self.send_json({"error": "Method not allowed"}, status=405)
            return

        try:
            m_user = re.match(r'^/api/users/(\d+)$', path)
            if m_user:
                user, err_resp = self._check_permission("users.delete")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                user_id = int(m_user.group(1))
                res = service.delete_user_service(user_id, current_user_id=user["id"])
                self.send_json(res)
                return

            m_role = re.match(r'^/api/roles/(\d+)$', path)
            if m_role:
                user, err_resp = self._check_permission("roles.delete")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                role_id = int(m_role.group(1))
                res = service.delete_role_service(role_id)
                self.send_json(res)
                return

            self.send_json({"error": f"Endpoint not found: {path}"}, status=404)
        except ValueError as ve:
            self.send_json({"error": str(ve), "success": False}, status=400)
        except Exception:
            self.send_json({"error": "An internal server error occurred.", "success": False}, status=500)


def main():
    service.initialize_service()
    target_dir = DIST_DIR if os.path.exists(DIST_DIR) else ROOT_DIR
    url = f"http://{HOST}:{PORT}/"
    print("=" * 65)
    print("EPA Punjab Social Listening Server (RBAC & Auth Enabled)")
    print("=" * 65)
    print(f"[*] Serving production build from: {target_dir}")
    print(f"[*] Access portal URL: {url}")
    print(f"[*] REST API available at: {url}api/")
    print("[*] Press Ctrl+C to stop the server.")
    print("=" * 65)

    if sys.platform != "win32":
        socketserver.ThreadingTCPServer.allow_reuse_address = True
    # Bind to the configured HOST (default: 127.0.0.1) — never bind to all
    # interfaces unless HOST is explicitly set to 0.0.0.0 in the environment.
    server = socketserver.ThreadingTCPServer((HOST, PORT), SPAServerHandler)
    server.daemon_threads = True
    while True:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\n[*] Server stopped.")
            break
        except Exception as e:
            print(f"[!] Server exception: {e}")


if __name__ == "__main__":
    main()
