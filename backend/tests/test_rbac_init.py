import sys
import os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend import database

database.init_db()

roles = database.get_roles_list_db()
print(f"Total Roles: {len(roles)}")
for r in roles:
    print(f" - Role: {r['name']} ({r['displayName']}), perms: {r['permissionCount']}, users: {r['userCount']}")

users = database.get_users_list_db()
print(f"Total Users: {users['total']}")
for u in users['users']:
    print(f" - User: {u['username']} ({u['fullName']}), role: {u['role']['name']}")

perms = database.get_permissions_list_db()
print(f"Total Permissions: {len(perms['permissions'])}")

user, err = database.authenticate_user_db("admin", "EPAadmin2026!")
assert user is not None, f"Auth failed: {err}"
print(f"Auth OK: {user['fullName']} ({len(user['permissions'])} perms)")

token = database.create_auth_session_db(user['id'])
val_user = database.validate_auth_token_db(token)
assert val_user is not None, "Session validation failed"
print(f"Session OK: {val_user['username']} token: {token[:8]}...")

ok, msg = database.verify_turnstile_token("DEMO_BYPASS")
assert not ok, f"Turnstile bypass must fail: {msg}"
print(f"Turnstile bypass rejected: {msg}")
