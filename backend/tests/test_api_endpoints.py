import sys
import os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend import database
from backend import service

def run_tests():
    print("=== Running Backend RBAC & Auth Test Suite ===")
    database.init_db()

    res = service.auth_login_service("admin", "EPAadmin2026!", turnstile_token="DEMO_BYPASS")
    assert res["success"] is True
    admin_token = res["token"]
    admin_user = res["user"]
    assert admin_user["username"] == "admin"
    assert admin_user["role"]["name"] == "super_admin"
    assert len(admin_user["permissions"]) >= 19
    print("[PASS] 1. Admin login successful with full permissions.")

    try:
        service.auth_login_service("admin", "WrongPassword123!")
        assert False, "Should have thrown ValueError"
    except ValueError as e:
        print(f"[PASS] 2. Invalid password rejected: {e}")

    analyst_res = service.auth_login_service("analyst", "EPAanalyst2026!", turnstile_token="DEMO_BYPASS")
    assert analyst_res["user"]["role"]["name"] == "analyst"
    assert "users.view" not in analyst_res["user"]["permissions"]
    assert "dashboard.view" in analyst_res["user"]["permissions"]
    print("[PASS] 3. Analyst login has restricted permissions.")

    viewer_res = service.auth_login_service("viewer", "EPAviewer2026!", turnstile_token="DEMO_BYPASS")
    assert viewer_res["user"]["role"]["name"] == "viewer"
    assert "settings.view" not in viewer_res["user"]["permissions"]
    assert "dashboard.view" in viewer_res["user"]["permissions"]
    print("[PASS] 4. Viewer login verified (Read-only subset).")

    test_username = "test_signup_user"
    with database.get_db() as conn:
        conn.execute("DELETE FROM users WHERE username = ?", (test_username,))
        conn.commit()

    signup_res = service.auth_signup_service(
        username=test_username,
        email="test_signup@epa.punjab.gov.pk",
        password="TestPassword123!",
        full_name="Registered Test Citizen",
        turnstile_token="DEMO_BYPASS"
    )
    assert signup_res["success"] is True
    assert signup_res["user"]["username"] == test_username
    assert signup_res["user"]["role"]["name"] == "viewer"
    print("[PASS] 5. Signup created user and assigned default 'viewer' role.")

    me = service.auth_me_service(signup_res["token"])
    assert me["username"] == test_username
    print("[PASS] 6. auth_me verified for newly registered user.")

    new_user_data = {
        "username": "new_operator",
        "email": "operator@epa.punjab.gov.pk",
        "password": "OperatorPass123!",
        "fullName": "New Operations Officer",
        "roleId": analyst_res["user"]["roleId"]
    }
    with database.get_db() as conn:
        conn.execute("DELETE FROM users WHERE username = ?", (new_user_data["username"],))
        conn.commit()

    created_user = service.create_user_service(new_user_data)
    assert created_user["username"] == "new_operator"
    print(f"[PASS] 7. User CRUD - Create User ID: {created_user['id']}")

    updated_user = service.update_user_service(created_user["id"], {"fullName": "Senior Operations Officer"}, current_user_id=admin_user["id"])
    assert updated_user["fullName"] == "Senior Operations Officer"
    print("[PASS] 8. User CRUD - Update User successfully.")

    del_res = service.delete_user_service(created_user["id"], current_user_id=admin_user["id"])
    assert del_res["success"] is True
    print("[PASS] 9. User CRUD - Delete User successfully.")

    perms = service.get_permissions_service()["permissions"]
    perm_ids = [p["id"] for p in perms[:4]]
    custom_role = service.create_role_service({
        "name": "custom_monitor",
        "displayName": "Regional Air Monitor",
        "description": "Custom role for district level monitors",
        "permissionIds": perm_ids
    })
    assert custom_role["name"] == "custom_monitor"
    assert custom_role["permissionCount"] == 4
    print(f"[PASS] 10. Role CRUD - Created custom role with 4 permissions.")

    updated_role = service.update_role_service(custom_role["id"], {
        "displayName": "Senior Regional Air Monitor",
        "permissionIds": perm_ids[:2]
    })
    assert updated_role["displayName"] == "Senior Regional Air Monitor"
    assert updated_role["permissionCount"] == 2
    print("[PASS] 11. Role CRUD - Updated role name and permissions.")

    del_role_res = service.delete_role_service(custom_role["id"])
    assert del_role_res["success"] is True
    print("[PASS] 12. Role CRUD - Deleted custom role.")

    try:
        service.delete_role_service(admin_user["roleId"])
        assert False, "Should not delete system role"
    except ValueError as ve:
        print(f"[PASS] 13. System role deletion prevented: {ve}")

    print("\n>>> ALL BACKEND RBAC & AUTH TESTS PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    run_tests()
