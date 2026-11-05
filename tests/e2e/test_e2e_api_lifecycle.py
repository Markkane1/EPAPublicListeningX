import urllib.request
import urllib.error
import json
import pytest
from tests.conftest import TEST_ADMIN_PASSWORD, TEST_TURNSTILE_TOKEN

def http_json(url, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
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

class TestE2EApiLifecycle:
    def test_full_user_and_role_management_lifecycle(self, ephemeral_server):
        base_url, _ = ephemeral_server

        # 1. Admin Login
        status, login_res = http_json(f"{base_url}/auth/login", method="POST", data={
            "username": "admin",
            "password": TEST_ADMIN_PASSWORD,
            "turnstileToken": TEST_TURNSTILE_TOKEN
        })
        assert status == 200
        admin_token = login_res["token"]
        admin_user = login_res["user"]
        assert len(admin_user["permissions"]) == 20

        # 2. Check /api/auth/me
        status, me_res = http_json(f"{base_url}/auth/me", token=admin_token)
        assert status == 200
        assert me_res["username"] == "admin"
        assert len(me_res["permissions"]) == 20

        # 3. Create Custom Role with limited permissions
        status, perms_res = http_json(f"{base_url}/permissions", token=admin_token)
        assert status == 200
        perm_ids = [p["id"] for p in perms_res["permissions"][:2]] # first 2 permissions

        role_payload = {
            "name": "e2e_district_officer",
            "displayName": "District Field Officer",
            "description": "Custom role created during E2E verification test",
            "permissionIds": perm_ids
        }
        status, created_role = http_json(f"{base_url}/roles", method="POST", data=role_payload, token=admin_token)
        assert status == 201
        custom_role_id = created_role["id"]
        assert created_role["permissionCount"] == 2

        # 4. Create User assigned to the custom role
        user_payload = {
            "username": "e2e_officer_kamran",
            "email": "kamran.officer@epa.punjab.gov.pk",
            "password": "KamranPass2026!",
            "fullName": "Kamran Khan",
            "roleId": custom_role_id,
            "isActive": True
        }
        status, created_user = http_json(f"{base_url}/users", method="POST", data=user_payload, token=admin_token)
        assert status == 201
        kamran_id = created_user["id"]
        assert created_user["roleId"] == custom_role_id

        # 5. Login as the newly created officer
        status, kamran_login = http_json(f"{base_url}/auth/login", method="POST", data={
            "username": "e2e_officer_kamran",
            "password": "KamranPass2026!",
            "turnstileToken": TEST_TURNSTILE_TOKEN
        })
        assert status == 200
        kamran_token = kamran_login["token"]
        assert len(kamran_login["user"]["permissions"]) == 2

        # 6. Officer attempts to access protected admin endpoint (/api/settings) -> 403 Forbidden
        status, forbidden_res = http_json(f"{base_url}/settings", token=kamran_token)
        assert status == 403
        assert forbidden_res.get("code") == "FORBIDDEN"

        # 7. Admin updates officer's full name
        status, updated_user = http_json(f"{base_url}/users/{kamran_id}", method="PUT", data={
            "fullName": "Senior District Officer Kamran Khan"
        }, token=admin_token)
        assert status == 200
        assert updated_user["fullName"] == "Senior District Officer Kamran Khan"

        # 8. Admin deactivates officer account
        status, deact_user = http_json(f"{base_url}/users/{kamran_id}", method="PUT", data={
            "isActive": False
        }, token=admin_token)
        assert status == 200
        assert deact_user["isActive"] is False

        # Verify deactivated user cannot log in
        status, bad_login = http_json(f"{base_url}/auth/login", method="POST", data={
            "username": "e2e_officer_kamran",
            "password": "KamranPass2026!",
            "turnstileToken": TEST_TURNSTILE_TOKEN
        })
        assert status == 400

        # 9. Admin deletes officer account
        status, del_usr = http_json(f"{base_url}/users/{kamran_id}", method="DELETE", token=admin_token)
        assert status == 200
        assert del_usr["success"] is True

        # 10. Admin deletes custom role
        status, del_role = http_json(f"{base_url}/roles/{custom_role_id}", method="DELETE", token=admin_token)
        assert status == 200
        assert del_role["success"] is True

        # 11. Admin logs out
        status, logout_res = http_json(f"{base_url}/auth/logout", method="POST", token=admin_token)
        assert status == 200
        assert logout_res["success"] is True

        # 12. Subsequent calls with revoked token return 401 Unauthorized
        status, after_logout = http_json(f"{base_url}/auth/me", token=admin_token)
        assert status == 401
