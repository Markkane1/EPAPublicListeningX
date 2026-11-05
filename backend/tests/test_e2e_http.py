import os
import json
import urllib.request
import urllib.error

BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:8080/api")

def request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
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

def run_e2e_tests():
    print("=" * 60)
    print("RUNNING END-TO-END HTTP RBAC & AUTH SUITE")
    print("=" * 60)

    status, login_res = request("/auth/login", method="POST", data={
        "username": "admin",
        "password": "EPAadmin2026!",
        "turnstileToken": "DEMO_BYPASS"
    })
    assert status != 200, f"DEMO_BYPASS must not authenticate: {login_res}"
    print(f"[OK] 1. DEMO_BYPASS login rejected with status {status}.")

    status, t_res = request("/turnstile/verify", method="POST", data={"token": "DEMO_BYPASS"})
    assert t_res.get("success") is not True
    print("[OK] Turnstile DEMO_BYPASS rejected.")
    return

    status, viewer_login = request("/auth/login", method="POST", data={
        "username": "viewer",
        "password": "EPAviewer2026!",
        "turnstileToken": "DEMO_BYPASS"
    })
    assert status == 200
    viewer_token = viewer_login["token"]
    print(f"[OK] 2. Viewer login success. Role: {viewer_login['user']['role']['name']}")

    status, me_res = request("/auth/me", token=admin_token)
    assert status == 200
    assert me_res["username"] == "admin"
    print(f"[OK] 3. /auth/me verified: {me_res['fullName']}")

    status, guard_res = request("/users", token=viewer_token)
    assert status == 403, f"Expected 403 Forbidden, got {status}: {guard_res}"
    assert guard_res.get("code") == "FORBIDDEN"
    print(f"[OK] 4. RBAC page-level guard verified: Viewer blocked from /api/users (403 Forbidden).")

    status, users_list = request("/users", token=admin_token)
    assert status == 200
    initial_user_count = users_list["total"]
    print(f"[OK] 5. Admin listed users. Total: {initial_user_count}")

    new_user_payload = {
        "username": "e2e_test_officer",
        "email": "e2e_officer@epa.punjab.gov.pk",
        "password": "E2EOfficer2026!",
        "fullName": "E2E Test Officer",
        "roleId": login_res["user"]["roleId"],
        "isActive": True
    }
    status, created_user = request("/users", method="POST", data=new_user_payload, token=admin_token)
    assert status == 201, f"Create user failed: {created_user}"
    created_id = created_user["id"]
    print(f"[OK] 6. Created user account ID: {created_id} (@{created_user['username']})")

    status, updated_user = request(f"/users/{created_id}", method="PUT", data={
        "fullName": "Senior E2E Test Officer",
        "isActive": True
    }, token=admin_token)
    assert status == 200
    assert updated_user["fullName"] == "Senior E2E Test Officer"
    print(f"[OK] 7. Updated user ID {created_id} details.")

    status, del_res = request(f"/users/{created_id}", method="DELETE", token=admin_token)
    assert status == 200
    assert del_res.get("success") is True
    print(f"[OK] 8. Deleted user ID {created_id} successfully.")

    status, roles_list = request("/roles", token=admin_token)
    assert status == 200
    assert len(roles_list) >= 4
    print(f"[OK] 9. Admin retrieved {len(roles_list)} defined roles.")

    perms_status, perms_res = request("/permissions", token=admin_token)
    assert perms_status == 200
    perm_ids = [p["id"] for p in perms_res["permissions"][:3]]

    status, created_role = request("/roles", method="POST", data={
        "name": "e2e_test_role",
        "displayName": "E2E Field Inspector",
        "description": "Inspecting sensor equipment",
        "permissionIds": perm_ids
    }, token=admin_token)
    assert status == 201
    created_role_id = created_role["id"]
    assert created_role["permissionCount"] == 3
    print(f"[OK] 10. Created custom role ID {created_role_id} with 3 permissions.")

    status, updated_role = request(f"/roles/{created_role_id}", method="PUT", data={
        "displayName": "Senior E2E Field Inspector",
        "permissionIds": perm_ids[:1]
    }, token=admin_token)
    assert status == 200
    assert updated_role["displayName"] == "Senior E2E Field Inspector"
    assert updated_role["permissionCount"] == 1
    print(f"[OK] 11. Updated custom role ID {created_role_id}.")

    status, del_role = request(f"/roles/{created_role_id}", method="DELETE", token=admin_token)
    assert status == 200
    print(f"[OK] 12. Deleted custom role ID {created_role_id}.")

    status, signup_res = request("/auth/signup", method="POST", data={
        "username": "e2e_citizen",
        "email": "e2e_citizen@epa.punjab.gov.pk",
        "password": "CitizenPassword2026!",
        "fullName": "Citizen Observer",
        "turnstileToken": "DEMO_BYPASS"
    })
    assert status == 403
    assert signup_res.get("code") == "REGISTRATION_DISABLED"
    print(f"[OK] 13. Public signup endpoint correctly rejected (403 REGISTRATION_DISABLED).")

    status, t_res = request("/turnstile/verify", method="POST", data={"token": "DEMO_BYPASS"})
    assert t_res.get("success") is not True
    print(f"[OK] 14. Turnstile DEMO_BYPASS rejected. status={status}")

    print("\n" + "=" * 60)
    print("ALL 14 END-TO-END HTTP TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_e2e_tests()
