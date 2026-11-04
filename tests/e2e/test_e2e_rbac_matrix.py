import urllib.request
import urllib.error
import json
import time
import pytest

def http_get(url, token=None, retries=3):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method="GET")
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req) as resp:
                content = resp.read().decode("utf-8")
                return resp.status, json.loads(content) if content else {}
        except urllib.error.HTTPError as e:
            content = e.read().decode("utf-8")
            try:
                err_json = json.loads(content)
            except Exception:
                err_json = {"raw": content}
            return e.code, err_json
        except (ConnectionResetError, urllib.error.URLError, ConnectionAbortedError, ConnectionError) as e:
            if attempt == retries - 1:
                raise
            time.sleep(0.08)

def http_post(url, data=None, token=None, retries=3):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data or {}).encode("utf-8")
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=body, headers=headers, method="POST")
            with urllib.request.urlopen(req) as resp:
                content = resp.read().decode("utf-8")
                return resp.status, json.loads(content) if content else {}
        except urllib.error.HTTPError as e:
            content = e.read().decode("utf-8")
            try:
                err_json = json.loads(content)
            except Exception:
                err_json = {"raw": content}
            return e.code, err_json
        except (ConnectionResetError, urllib.error.URLError, ConnectionAbortedError, ConnectionError) as e:
            if attempt == retries - 1:
                raise
            time.sleep(0.08)

class TestE2ERBACMatrix:
    def test_anonymous_access_denied_401(self, ephemeral_server):
        base_url, _ = ephemeral_server
        protected_get_routes = [
            "/auth/me",
            "/posts",
            "/stats",
            "/noise",
            "/users",
            "/roles",
            "/permissions",
            "/settings",
            "/queries",
            "/learned-rules",
        ]
        for route in protected_get_routes:
            status, res = http_get(f"{base_url}{route}")
            assert status == 401, f"Expected 401 for anonymous on {route}, got {status}: {res}"

    def test_viewer_permission_boundaries(self, ephemeral_server, auth_tokens):
        base_url, _ = ephemeral_server
        token = auth_tokens["viewer"]

        # Allowed endpoints
        status, _ = http_get(f"{base_url}/posts", token=token)
        assert status == 200

        status, _ = http_get(f"{base_url}/stats", token=token)
        assert status == 200

        status, _ = http_get(f"{base_url}/auth/me", token=token)
        assert status == 200

        # Forbidden endpoints
        forbidden_endpoints = [
            "/noise",
            "/users",
            "/roles",
            "/settings",
            "/queries"
        ]
        for ep in forbidden_endpoints:
            status, res = http_get(f"{base_url}{ep}", token=token)
            assert status == 403, f"Expected 403 for viewer on {ep}, got {status}: {res}"

    def test_analyst_permission_boundaries(self, ephemeral_server, auth_tokens):
        base_url, _ = ephemeral_server
        token = auth_tokens["analyst"]

        # Allowed endpoints (Analyst has settings.view)
        status, _ = http_get(f"{base_url}/posts", token=token)
        assert status == 200

        status, _ = http_get(f"{base_url}/stats", token=token)
        assert status == 200

        status, _ = http_get(f"{base_url}/audit", token=token)
        assert status == 200

        status, _ = http_get(f"{base_url}/settings", token=token)
        assert status == 200

        # Forbidden endpoints (Analyst cannot view/manage users or roles, or edit settings)
        forbidden_get_endpoints = [
            "/users",
            "/roles"
        ]
        for ep in forbidden_get_endpoints:
            status, res = http_get(f"{base_url}{ep}", token=token)
            assert status == 403, f"Expected 403 for analyst on {ep}, got {status}: {res}"

        # Editing settings is forbidden for analyst
        status_post, _ = http_post(f"{base_url}/settings", data={"auto_enrich": "false"}, token=token)
        assert status_post == 403

    def test_auditor_permission_boundaries(self, ephemeral_server, auth_tokens):
        base_url, _ = ephemeral_server
        token = auth_tokens["auditor"]

        # Auditor can view posts, noise pool, learned rules, and settings
        status, _ = http_get(f"{base_url}/posts", token=token)
        assert status == 200

        status, _ = http_get(f"{base_url}/noise", token=token)
        assert status == 200

        status, _ = http_get(f"{base_url}/learned-rules", token=token)
        assert status == 200

        status, _ = http_get(f"{base_url}/settings", token=token)
        assert status == 200

        # Auditor cannot manage users or roles, or edit settings
        for ep in ["/users", "/roles"]:
            status, res = http_get(f"{base_url}{ep}", token=token)
            assert status == 403, f"Expected 403 for auditor on {ep}, got {status}: {res}"

        # Editing settings is forbidden for auditor
        status_post, _ = http_post(f"{base_url}/settings", data={"auto_enrich": "false"}, token=token)
        assert status_post == 403

    def test_super_admin_full_clearance(self, ephemeral_server, auth_tokens):
        base_url, _ = ephemeral_server
        token = auth_tokens["admin"]

        all_modules = [
            "/posts",
            "/stats",
            "/audit",
            "/noise",
            "/users",
            "/roles",
            "/permissions",
            "/settings",
            "/queries",
            "/learned-rules"
        ]
        for ep in all_modules:
            status, res = http_get(f"{base_url}{ep}", token=token)
            assert status == 200, f"Super admin should have access to {ep}, got {status}: {res}"

    def test_public_signup_disabled_403(self, ephemeral_server):
        base_url, _ = ephemeral_server
        status, res = http_post(f"{base_url}/auth/signup", data={
            "username": "random_applicant",
            "email": "applicant@test.com",
            "password": "Password123!"
        })
        assert status == 403
        assert res.get("code") == "REGISTRATION_DISABLED"
