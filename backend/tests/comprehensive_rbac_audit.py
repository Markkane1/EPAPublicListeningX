#!/usr/bin/env python3
"""
Exhaustive RBAC & Authentication End-to-End Verification Audit
=============================================================
Tests:
1. Database Schema, Permissions, Password Hashes, Role-Permission mappings
2. Authentication (Login, Signup, Logout, Auth Me, Inactive accounts, Password checks)
3. Role CRUD (List, Create, Update, Assign Permissions, Delete safeguards)
4. User CRUD (List, Create, Update, Reassign Role, Password Reset, Status Toggle, Delete safeguards)
5. End-to-End API Permission Gates across all 4 roles (Super Admin, Analyst, Auditor, Viewer)
6. Cloudflare Turnstile token validation
"""

import sys
import os
import json
import urllib.request
import urllib.error

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend import database
from backend import service

BASE_URL = "http://localhost:8080/api"

def http_req(path, method="GET", data=None, token=None):
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


def run_comprehensive_audit():
    print("=" * 70)
    print("  EXHAUSTIVE RBAC & AUTHENTICATION END-TO-END AUDIT SUITE")
    print("=" * 70)
    audit_results = []

    def check(name, condition, detail=""):
        if condition:
            print(f" [PASS] {name}")
            audit_results.append((name, True, detail))
        else:
            print(f" [FAIL] {name} - {detail}")
            audit_results.append((name, False, detail))
            raise AssertionError(f"Audit failure on: {name}. {detail}")

    # =========================================================================
    # SECTION 1: DATABASE INTEGRITY & SEED AUDIT
    # =========================================================================
    print("\n--- 1. DATABASE REPOSITORY & SCHEMA VERIFICATION ---")
    database.init_db()

    # 1.1 Permissions
    perms_data = database.get_permissions_list_db()
    total_perms = len(perms_data["permissions"])
    check("Permissions Table Initialized", total_perms == 20, f"Found {total_perms}/20 permissions")
    
    modules = list(perms_data["byModule"].keys())
    check("Permission Modules Configured", len(modules) == 8, f"Modules: {', '.join(modules)}")

    # 1.2 Roles
    roles = database.get_roles_list_db()
    role_map = {r["name"]: r for r in roles}
    check("System Roles Present", all(k in role_map for k in ["super_admin", "analyst", "auditor", "viewer"]), "Missing core roles")
    check("Super Admin has all 20 permissions", role_map["super_admin"]["permissionCount"] == 20, f"Count: {role_map['super_admin']['permissionCount']}")
    check("Analyst has 7 permissions", role_map["analyst"]["permissionCount"] == 7, f"Count: {role_map['analyst']['permissionCount']}")
    check("Auditor has 8 permissions", role_map["auditor"]["permissionCount"] == 8, f"Count: {role_map['auditor']['permissionCount']}")
    check("Viewer has 3 permissions", role_map["viewer"]["permissionCount"] == 3, f"Count: {role_map['viewer']['permissionCount']}")

    # 1.3 Users & Password Hashing
    with database.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT username, password_hash, salt FROM users WHERE username = 'admin'")
        admin_db_user = cursor.fetchone()
        check("Passwords Use PBKDF2 Hashing (No Plaintext)", len(admin_db_user["password_hash"]) == 64 and len(admin_db_user["salt"]) == 32, "Invalid hash length")

    # =========================================================================
    # SECTION 2: AUTHENTICATION & SESSION LIFECYCLE
    # =========================================================================
    print("\n--- 2. AUTHENTICATION & SESSION VERIFICATION ---")

    # 2.1 Super Admin Login
    status, admin_auth = http_req("/auth/login", method="POST", data={
        "username": "admin",
        "password": "EPAadmin2026!",
        "turnstileToken": "DEMO_BYPASS"
    })
    check("Super Admin HTTP Login", status == 200 and "token" in admin_auth, f"Status: {status}")
    admin_token = admin_auth["token"]

    # 2.2 Analyst Login
    status, analyst_auth = http_req("/auth/login", method="POST", data={
        "username": "analyst",
        "password": "EPAanalyst2026!",
        "turnstileToken": "DEMO_BYPASS"
    })
    check("Analyst HTTP Login", status == 200 and analyst_auth["user"]["role"]["name"] == "analyst", f"Status: {status}")
    analyst_token = analyst_auth["token"]

    # 2.3 Auditor Login
    status, auditor_auth = http_req("/auth/login", method="POST", data={
        "username": "auditor",
        "password": "EPAauditor2026!",
        "turnstileToken": "DEMO_BYPASS"
    })
    check("Auditor HTTP Login", status == 200 and auditor_auth["user"]["role"]["name"] == "auditor", f"Status: {status}")
    auditor_token = auditor_auth["token"]

    # 2.4 Viewer Login
    status, viewer_auth = http_req("/auth/login", method="POST", data={
        "username": "viewer",
        "password": "EPAviewer2026!",
        "turnstileToken": "DEMO_BYPASS"
    })
    check("Viewer HTTP Login", status == 200 and viewer_auth["user"]["role"]["name"] == "viewer", f"Status: {status}")
    viewer_token = viewer_auth["token"]

    # 2.5 Wrong Password Rejection
    status, bad_auth = http_req("/auth/login", method="POST", data={
        "username": "admin",
        "password": "IncorrectPassword999!",
        "turnstileToken": "DEMO_BYPASS"
    })
    check("Wrong Password Rejected (400)", status == 400, f"Got status {status}")

    # 2.6 Missing / Bad Turnstile Token Rejection
    status, no_turnstile = http_req("/auth/login", method="POST", data={
        "username": "admin",
        "password": "EPAadmin2026!",
        "turnstileToken": ""
    })
    # If turnstileToken is empty string or None without bypass, it should be rejected
    check("Missing Turnstile Token Rejected", status in (400, 422), f"Got status {status}")

    # 2.7 /api/auth/me Verification
    status, me_data = http_req("/auth/me", token=admin_token)
    check("/api/auth/me returns valid profile with permissions", status == 200 and len(me_data["permissions"]) == 20, f"Status: {status}")

    # =========================================================================
    # SECTION 3: ROLE CRUD & PERMISSION ASSIGNMENT AUDIT
    # =========================================================================
    print("\n--- 3. ROLE MANAGEMENT & PERMISSION ASSIGNMENTS ---")

    # 3.1 List Roles
    status, roles_list = http_req("/roles", token=admin_token)
    check("Admin Can List Roles", status == 200 and len(roles_list) >= 4, f"Status {status}")

    # 3.2 Create Custom Role with specific permissions
    selected_perm_ids = [perms_data["permissions"][0]["id"], perms_data["permissions"][1]["id"]] # dashboard.view, posts.view
    status, new_role = http_req("/roles", method="POST", data={
        "name": "audit_field_supervisor",
        "displayName": "Audit Field Supervisor",
        "description": "Supervisor for local district air samplers",
        "permissionIds": selected_perm_ids
    }, token=admin_token)
    check("Create Custom Role with Granted Permissions", status == 201 and new_role["permissionCount"] == 2, f"Status {status}")
    custom_role_id = new_role["id"]

    # 3.3 Update Custom Role (add another permission)
    updated_perm_ids = selected_perm_ids + [perms_data["permissions"][2]["id"]] # add posts.search_x
    status, updated_role = http_req(f"/roles/{custom_role_id}", method="PUT", data={
        "displayName": "Senior Audit Field Supervisor",
        "description": "Updated supervisor description",
        "permissionIds": updated_perm_ids
    }, token=admin_token)
    check("Update Custom Role & Reassign Permissions", status == 200 and updated_role["permissionCount"] == 3 and updated_role["displayName"] == "Senior Audit Field Supervisor", f"Status {status}")

    # 3.4 Prevent Deleting System Roles
    status, del_sys = http_req(f"/roles/{role_map['super_admin']['id']}", method="DELETE", token=admin_token)
    check("System Role Protected from Deletion (400)", status == 400, f"Status {status}: {del_sys}")

    # =========================================================================
    # SECTION 4: USER CRUD & ROLE ASSIGNMENT AUDIT
    # =========================================================================
    print("\n--- 4. USER MANAGEMENT & ROLE ASSIGNMENTS ---")

    # 4.1 Admin Creates User with custom role
    status, created_usr = http_req("/users", method="POST", data={
        "username": "audit_supervisor_ali",
        "fullName": "Ali Raza",
        "email": "ali.raza@epa.punjab.gov.pk",
        "password": "AliSupervisor2026!",
        "roleId": custom_role_id,
        "isActive": True
    }, token=admin_token)
    check("Create User & Assign Custom Role", status == 201 and created_usr["roleId"] == custom_role_id, f"Status {status}")
    ali_id = created_usr["id"]

    # 4.2 Prevent Deleting Role With Assigned Users
    status, del_role_blocked = http_req(f"/roles/{custom_role_id}", method="DELETE", token=admin_token)
    check("Role With Assigned Users Cannot Be Deleted (400)", status == 400, f"Status {status}: {del_role_blocked}")

    # 4.3 Log In As New User and Verify Assigned Role & Permissions
    status, ali_login = http_req("/auth/login", method="POST", data={
        "username": "audit_supervisor_ali",
        "password": "AliSupervisor2026!",
        "turnstileToken": "DEMO_BYPASS"
    })
    check("New User Can Login and Has Exactly 3 Permissions", status == 200 and len(ali_login["user"]["permissions"]) == 3, f"Permissions: {len(ali_login.get('user', {}).get('permissions', []))}")
    ali_token = ali_login["token"]

    # 4.4 Reassign User to 'analyst' Role
    status, updated_usr = http_req(f"/users/{ali_id}", method="PUT", data={
        "roleId": role_map["analyst"]["id"],
        "fullName": "Ali Raza (Promoted Analyst)"
    }, token=admin_token)
    check("Reassign User Role to Analyst", status == 200 and updated_usr["roleId"] == role_map["analyst"]["id"], f"Status {status}")

    # 4.5 Reset Password and Verify New Credentials
    status, pwd_reset = http_req(f"/users/{ali_id}", method="PUT", data={
        "password": "NewSecretPassword2026!"
    }, token=admin_token)
    check("Admin Can Reset User Password", status == 200, f"Status {status}")

    status, new_pwd_login = http_req("/auth/login", method="POST", data={
        "username": "audit_supervisor_ali",
        "password": "NewSecretPassword2026!",
        "turnstileToken": "DEMO_BYPASS"
    })
    check("User Logs in with New Password and Has Analyst Permissions (7)", status == 200 and len(new_pwd_login["user"]["permissions"]) == 7, f"Status {status}")

    # 4.6 Toggle Account Active / Inactive
    status, deact_res = http_req(f"/users/{ali_id}", method="PUT", data={
        "isActive": False
    }, token=admin_token)
    check("Deactivate User Account", status == 200 and deact_res["isActive"] is False, f"Status {status}")

    status, inactive_login = http_req("/auth/login", method="POST", data={
        "username": "audit_supervisor_ali",
        "password": "NewSecretPassword2026!",
        "turnstileToken": "DEMO_BYPASS"
    })
    check("Disabled Account Forbidden from Login (400)", status == 400, f"Status {status}: {inactive_login}")

    # 4.7 Safeguard: Self-deletion Prevention
    status, self_del = http_req(f"/users/{admin_auth['user']['id']}", method="DELETE", token=admin_token)
    check("Admin Cannot Delete Own Account (400)", status == 400, f"Status {status}: {self_del}")

    # 4.8 Delete User Account
    status, del_ali = http_req(f"/users/{ali_id}", method="DELETE", token=admin_token)
    check("Delete Inactive User Account", status == 200 and del_ali["success"] is True, f"Status {status}")

    # 4.9 Now Delete Custom Role (now that 0 users are assigned)
    status, del_role_ok = http_req(f"/roles/{custom_role_id}", method="DELETE", token=admin_token)
    check("Custom Role Deleted Successfully After User Reassignment", status == 200 and del_role_ok["success"] is True, f"Status {status}")

    # =========================================================================
    # SECTION 5: PAGE & API-LEVEL PERMISSION GATE AUDIT
    # =========================================================================
    print("\n--- 5. PAGE & ENDPOINT PERMISSION GATES AUDIT ---")

    # 5.1 Unauthenticated Request Blocked
    status, unauth_req = http_req("/users")
    check("Unauthenticated Request Rejected (401 Unauthorized)", status == 401, f"Status {status}")

    # 5.2 Viewer attempting User Management
    status, viewer_users = http_req("/users", token=viewer_token)
    check("Viewer Blocked from User Management (403 Forbidden)", status == 403, f"Status {status}")

    # 5.3 Viewer attempting Role Management
    status, viewer_roles = http_req("/roles", token=viewer_token)
    check("Viewer Blocked from Role Management (403 Forbidden)", status == 403, f"Status {status}")

    # 5.4 Analyst attempting User Management
    status, analyst_users = http_req("/users", token=analyst_token)
    check("Analyst Blocked from User Management (403 Forbidden)", status == 403, f"Status {status}")

    # 5.5 Analyst accessing Posts Feed (Granted)
    status, analyst_posts = http_req("/posts?limit=5", token=analyst_token)
    check("Analyst Can Access Posts Feed (200 OK)", status == 200 and isinstance(analyst_posts, list), f"Status {status}")

    # 5.6 Auditor accessing Noise Posts (Granted)
    status, auditor_noise = http_req("/noise?limit=5", token=auditor_token)
    check("Auditor Can Access Noise Pool (200 OK)", status == 200 and isinstance(auditor_noise, list), f"Status {status}")

    # 5.7 Super Admin accessing everything
    status, admin_users = http_req("/users", token=admin_token)
    status2, admin_roles = http_req("/roles", token=admin_token)
    check("Super Admin Has Full Clearance across all modules (200 OK)", status == 200 and status2 == 200, f"Statuses {status}, {status2}")

    # =========================================================================
    # SECTION 6: PUBLIC SIGNUP & TURNSTILE AUDIT
    # =========================================================================
    print("\n--- 6. PUBLIC SIGNUP & TURNSTILE CAPTCHA AUDIT ---")
    test_signup_user = "audit_citizen_fatima"
    # Ensure clean state
    with database.get_db() as conn:
        conn.execute("DELETE FROM users WHERE username = ?", (test_signup_user,))
        conn.commit()

    status, signup_data = http_req("/auth/signup", method="POST", data={
        "username": test_signup_user,
        "email": "fatima.citizen@epa.punjab.gov.pk",
        "password": "FatimaCitizen2026!",
        "fullName": "Fatima Noor",
        "turnstileToken": "DEMO_BYPASS"
    })
    check("Public Registration with Turnstile Verification", status == 200 and signup_data["success"] is True, f"Status {status}")
    check("New Signup Automatically Defaults to 'viewer' Role", signup_data["user"]["role"]["name"] == "viewer", f"Role: {signup_data['user']['role']['name']}")
    
    # Cleanup signup test user
    http_req(f"/users/{signup_data['user']['id']}", method="DELETE", token=admin_token)

    # Logout verification
    status, logout_res = http_req("/auth/logout", method="POST", token=admin_token)
    check("Session Logout Invalidates Token", status == 200 and logout_res["success"] is True, f"Status {status}")

    status, after_logout = http_req("/auth/me", token=admin_token)
    check("Revoked Token Rejected on Subsequent Requests (401)", status == 401, f"Status {status}")

    print("\n" + "=" * 70)
    print(f"  AUDIT COMPLETE: {len(audit_results)} CHECKS EVALUATED — ALL PASSED (100%)")
    print("=" * 70)

if __name__ == "__main__":
    run_comprehensive_audit()
