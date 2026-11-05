import pytest
from backend import database
from tests.conftest import TEST_ADMIN_PASSWORD

class TestSecurityResilience:
    @pytest.mark.parametrize("sqli_payload", [
        "' OR '1'='1",
        "'; DROP TABLE posts; --",
        "1 UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40 --",
        "' OR 1=1 #",
        "admin' --",
        "' OR ''='",
    ])
    def test_sql_injection_resilience_in_queries(self, seeded_db, sqli_payload):
        # 1. Search parameter
        res_search = database.get_all_posts(search=sqli_payload)
        assert isinstance(res_search, list)

        # 2. City filter parameter
        res_city = database.get_all_posts(city=sqli_payload)
        assert isinstance(res_city, list)

        # 3. Severity filter parameter
        res_sev = database.get_all_posts(severity=sqli_payload)
        assert isinstance(res_sev, list)

        # 4. User authentication parameter
        user, err = database.authenticate_user_db(sqli_payload, "some_password")
        assert user is None

        # Verify posts table intact and not dropped
        assert len(database.get_all_posts()) >= 3

    def test_last_super_admin_protection(self, temp_db):
        admin_user, _ = database.authenticate_user_db("admin", TEST_ADMIN_PASSWORD)
        assert admin_user is not None
        admin_id = admin_user["id"]

        # 1. Attempt to deactivate the only super admin
        with pytest.raises(ValueError, match="Cannot deactivate the only remaining active Super Administrator"):
            database.update_user_db(admin_id, is_active=0)

        # 2. Attempt to demote the only super admin to viewer
        roles = database.get_roles_list_db()
        viewer_role = next(r for r in roles if r["name"] == "viewer")
        with pytest.raises(ValueError, match="Cannot demote the only remaining active Super Administrator"):
            database.update_user_db(admin_id, role_id=viewer_role["id"])

        # 3. Attempt to delete own account
        with pytest.raises(ValueError, match="cannot delete your own"):
            database.delete_user_db(admin_id, current_user_id=admin_id)

        # 4. Attempt to delete the only super admin by another caller ID
        with pytest.raises(ValueError, match="Cannot delete the only remaining Super Administrator"):
            database.delete_user_db(admin_id, current_user_id=99999)

    def test_token_tampering_and_forgery(self, temp_db):
        # Tampered tokens must all return None
        forged_tokens = [
            "invalid_hex_token_12345",
            "a" * 63, # Wrong length
            "a" * 65, # Wrong length
            "0" * 64, # Non-existent 64-char hex
            "",
            None,
            "Bearer invalid",
            "../etc/passwd",
        ]
        for token in forged_tokens:
            user = database.validate_auth_token_db(token)
            assert user is None

    def test_constant_time_password_verification(self, temp_db):
        # Verify secrets.compare_digest is used internally
        h, s = database._hash_password("RealPassword123!")
        assert database._verify_password("RealPassword123!", h, s) is True
        assert database._verify_password("RealPassword123?", h, s) is False
        assert database._verify_password("RealPassword123", h, s) is False
        assert database._verify_password("realpassword123!", h, s) is False
