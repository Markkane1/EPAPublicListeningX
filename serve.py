import sys
import os
import json
import re
import urllib.parse
import http.server
import socketserver

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(ROOT_DIR, "dashboard", "dist")
PORT = 8080

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend import database
from backend import service

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

class SPAServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        serve_dir = DIST_DIR if os.path.exists(DIST_DIR) else ROOT_DIR
        super().__init__(*args, directory=serve_dir, **kwargs)

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self._set_cors_headers()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def send_json(self, data, status=200):
        """Helper to send a JSON response with CORS headers."""
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._set_cors_headers()
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _get_bearer_token(self):
        """Extracts Bearer token from Authorization header or 'token' query param."""
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header[7:].strip()
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        token_param = qs.get("token")
        if token_param:
            return token_param[0].strip()
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

    def _parse_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            raw_body = self.rfile.read(content_length).decode('utf-8')
            return json.loads(raw_body)
        return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)

        if path.startswith('/api/'):
            try:
                if path == '/api/auth/me':
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

                elif path == '/api/settings':
                    self.send_json(service.get_current_settings())
                    return

                elif path == '/api/posts':
                    search = qs.get('search', [None])[0]
                    city = qs.get('city', [None])[0]
                    severity = qs.get('severity', [None])[0]
                    category = qs.get('category', [None])[0]
                    sort_by = qs.get('sortBy', ['newest'])[0]
                    sort_order = qs.get('order', [qs.get('sortOrder', ['desc'])[0]])[0]
                    limit = int(qs.get('limit')[0]) if 'limit' in qs else None
                    offset = int(qs.get('offset')[0]) if 'offset' in qs else 0
                    posts = service.get_all_posts_service(
                        search=search, city=city, severity=severity, category=category, sort_by=sort_by,
                        sort_order=sort_order, limit=limit, offset=offset
                    )
                    self.send_json(posts)
                    return

                elif path == '/api/audit':
                    limit = int(qs.get('limit', [1000])[0]) if 'limit' in qs else 1000
                    logs = service.get_all_audit_logs_service(limit=limit)
                    self.send_json(logs)
                    return

                elif path == '/api/stats':
                    stats = database.get_db_stats()
                    self.send_json(stats)
                    return

                elif path == '/api/noise':
                    search = qs.get('search', [None])[0]
                    category = qs.get('category', [None])[0]
                    status = qs.get('status', ['EXCLUDED'])[0]
                    limit = int(qs.get('limit')[0]) if 'limit' in qs else 100
                    offset = int(qs.get('offset')[0]) if 'offset' in qs else 0
                    noise_posts = service.get_noise_posts_service(
                        search=search, category=category, status=status, limit=limit, offset=offset
                    )
                    self.send_json(noise_posts)
                    return

                elif path == '/api/noise/stats':
                    stats = service.get_noise_stats_service()
                    self.send_json(stats)
                    return

                elif path == '/api/learned-rules':
                    rules = service.get_learned_rules_service()
                    self.send_json(rules)
                    return

                elif path == '/api/sentiment/status':
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

                elif path == '/api/queries':
                    versions = service.get_query_versions_service()
                    self.send_json(versions)
                    return

                elif path == '/api/queries/active':
                    active = service.get_active_query_service()
                    self.send_json(active)
                    return

                else:
                    self.send_json({"error": f"API endpoint not found: {path}"}, status=404)
                    return
            except ValueError as ve:
                self.send_json({"error": str(ve), "success": False}, status=400)
                return
            except Exception as e:
                self.send_json({"error": str(e), "success": False}, status=500)
                return

        translated = self.translate_path(self.path)
        if not os.path.exists(translated) and not os.path.splitext(self.path)[1]:
            self.path = '/index.html'
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if not path.startswith('/api/'):
            self.send_json({"error": "Method not allowed for static assets"}, status=405)
            return

        try:
            body = self._parse_json_body()
        except Exception as e:
            self.send_json({"error": f"Invalid JSON payload: {str(e)}"}, status=400)
            return

        try:
            client_ip = self.client_address[0] if hasattr(self, 'client_address') and self.client_address else "127.0.0.1"

            if path == '/api/auth/login':
                username = body.get('username') or body.get('email')
                password = body.get('password')
                turnstile_token = body.get('turnstileToken') or body.get('turnstile_token')
                res = service.auth_login_service(username, password, turnstile_token=turnstile_token, remote_ip=client_ip)
                self.send_json(res)

            elif path == '/api/auth/signup':
                username = body.get('username')
                email = body.get('email')
                password = body.get('password')
                full_name = body.get('fullName') or body.get('full_name')
                turnstile_token = body.get('turnstileToken') or body.get('turnstile_token')
                res = service.auth_signup_service(username, email, password, full_name=full_name, turnstile_token=turnstile_token, remote_ip=client_ip)
                self.send_json(res)

            elif path == '/api/auth/logout':
                token = self._get_bearer_token()
                res = service.auth_logout_service(token)
                self.send_json(res)

            elif path == '/api/turnstile/verify':
                token = body.get('token')
                ok, msg = database.verify_turnstile_token(token, client_ip)
                self.send_json({"success": ok, "message": msg})

            elif path == '/api/users':
                user, err_resp = self._check_permission("users.create")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                res = service.create_user_service(body)
                self.send_json(res, status=201)

            elif re.match(r'^/api/users/(\d+)/update$', path) or re.match(r'^/api/users/(\d+)$', path):
                user, err_resp = self._check_permission("users.edit")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                m = re.match(r'^/api/users/(\d+)', path)
                target_user_id = int(m.group(1))
                res = service.update_user_service(target_user_id, body, current_user_id=user["id"])
                self.send_json(res)

            elif re.match(r'^/api/users/(\d+)/delete$', path):
                user, err_resp = self._check_permission("users.delete")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                target_user_id = int(re.match(r'^/api/users/(\d+)/delete$', path).group(1))
                res = service.delete_user_service(target_user_id, current_user_id=user["id"])
                self.send_json(res)

            elif path == '/api/roles':
                user, err_resp = self._check_permission("roles.create")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                res = service.create_role_service(body)
                self.send_json(res, status=201)

            elif re.match(r'^/api/roles/(\d+)/update$', path) or re.match(r'^/api/roles/(\d+)$', path):
                user, err_resp = self._check_permission("roles.edit")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                m = re.match(r'^/api/roles/(\d+)', path)
                target_role_id = int(m.group(1))
                res = service.update_role_service(target_role_id, body)
                self.send_json(res)

            elif re.match(r'^/api/roles/(\d+)/delete$', path):
                user, err_resp = self._check_permission("roles.delete")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                target_role_id = int(re.match(r'^/api/roles/(\d+)/delete$', path).group(1))
                res = service.delete_role_service(target_role_id)
                self.send_json(res)

            elif path == '/api/settings':
                updated = service.update_settings(body)
                self.send_json(updated)

            elif path == '/api/x/test-connection':
                bearer_token = body.get('bearerToken')
                api_key = body.get('apiKey')
                api_secret = body.get('apiSecret')
                res = service.test_x_credentials(bearer_token, api_key, api_secret)
                self.send_json(res)

            elif path == '/api/x/search':
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

            elif path == '/api/ingest':
                posts_batch = body.get('posts', [])
                mode = body.get('mode', 'merge')
                res = service.ingest_raw_batch(posts_batch, mode=mode)
                self.send_json(res)

            elif path == '/api/noise/restore':
                post_id = body.get('postId')
                learned_rules = body.get('learnedRules', [])
                res = service.restore_noise_post_service(post_id, learned_rules=learned_rules)
                self.send_json(res)

            elif path == '/api/noise/exclude' or path == '/api/posts/exclude':
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
                post_id = body.get('postId')
                text = body.get('text', '')
                author = body.get('author', '')
                category = body.get('category', '')
                reason = body.get('reason', '')
                candidates = service.extract_candidates_service(
                    post_id=post_id, text=text, author=author, category=category, reason=reason
                )
                self.send_json(candidates)

            elif path == '/api/learned-rules':
                rule_type = body.get('ruleType')
                rule_value = body.get('ruleValue')
                description = body.get('description')
                res = service.add_learned_rule_service(rule_type, rule_value, description=description)
                self.send_json(res)

            elif path == '/api/learned-rules/toggle':
                rule_id = int(body.get('id', 0))
                is_active = bool(body.get('isActive', True))
                res = service.toggle_learned_rule_service(rule_id, is_active)
                self.send_json(res)

            elif path == '/api/learned-rules/delete':
                rule_id = int(body.get('id', 0))
                res = service.delete_learned_rule_service(rule_id)
                self.send_json(res)

            elif path == '/api/sentiment/engine':
                engine = body.get('engine', 'vader')
                database.save_settings({"sentiment_engine": engine})
                self.send_json({"success": True, "activeEngine": engine})

            elif path == '/api/sentiment/reanalyze':
                engine = body.get('engine') or database.get_settings().get('sentiment_engine', 'vader')
                res = database.reanalyze_all_posts_db(engine)
                self.send_json(res)

            elif path == '/api/queries':
                res = service.save_query_version_service(body)
                self.send_json(res)

            elif path == '/api/queries/activate':
                query_id = int(body.get('id', 0))
                res = service.activate_query_version_service(query_id)
                self.send_json(res)

            elif path == '/api/queries/update':
                res = service.update_query_version_service(body)
                self.send_json(res)

            elif path == '/api/queries/delete':
                query_id = int(body.get('id', 0))
                res = service.delete_query_version_service(query_id)
                self.send_json(res)

            else:
                self.send_json({"error": f"Unknown POST endpoint: {path}"}, status=404)
        except ValueError as ve:
            self.send_json({"error": str(ve), "success": False}, status=400)
        except Exception as e:
            self.send_json({"error": str(e), "success": False}, status=500)

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if not path.startswith('/api/'):
            self.send_json({"error": "Method not allowed"}, status=405)
            return

        try:
            body = self._parse_json_body()
        except Exception as e:
            self.send_json({"error": f"Invalid JSON payload: {str(e)}"}, status=400)
            return

        try:
            m_user = re.match(r'^/api/users/(\d+)$', path)
            if m_user:
                user, err_resp = self._check_permission("users.edit")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                user_id = int(m_user.group(1))
                res = service.update_user_service(user_id, body, current_user_id=user["id"])
                self.send_json(res)
                return

            m_role = re.match(r'^/api/roles/(\d+)$', path)
            if m_role:
                user, err_resp = self._check_permission("roles.edit")
                if err_resp:
                    self.send_json(err_resp[0], status=err_resp[1])
                    return
                role_id = int(m_role.group(1))
                res = service.update_role_service(role_id, body)
                self.send_json(res)
                return

            self.send_json({"error": f"Endpoint not found: {path}"}, status=404)
        except ValueError as ve:
            self.send_json({"error": str(ve), "success": False}, status=400)
        except Exception as e:
            self.send_json({"error": str(e), "success": False}, status=500)

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
        except Exception as e:
            self.send_json({"error": str(e), "success": False}, status=500)

def main():
    service.initialize_service()
    target_dir = DIST_DIR if os.path.exists(DIST_DIR) else ROOT_DIR
    url = f"http://localhost:{PORT}/"
    print("=" * 65)
    print("EPA Punjab Social Listening Server (RBAC & Auth Enabled)")
    print("=" * 65)
    print(f"[*] Serving production build from: {target_dir}")
    print(f"[*] Access portal URL: {url}")
    print(f"[*] REST API available at: {url}api/")
    print(f"[*] Local SQLite DB: {database.DB_PATH}")
    print("[*] Press Ctrl+C to stop the server.")
    print("=" * 65)

    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), SPAServerHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[*] Server stopped.")

if __name__ == "__main__":
    main()
