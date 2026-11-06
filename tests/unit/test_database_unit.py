import pytest
from datetime import datetime, timezone, timedelta
from backend import database
from tests.conftest import TEST_ADMIN_PASSWORD

class TestDatabaseUnit:
    def test_schema_and_permissions_initialization(self, temp_db):
        perms = database.get_permissions_list_db()
        assert len(perms["permissions"]) == 20
        module_names = [m.lower() for m in perms["byModule"].keys()]
        assert any("dashboard" in m for m in module_names)
        assert any("post" in m for m in module_names)
        assert any("user" in m for m in module_names)
        assert any("role" in m for m in module_names)

    def test_default_roles_exist(self, temp_db):
        roles = database.get_roles_list_db()
        role_map = {r["name"]: r for r in roles}
        assert "super_admin" in role_map
        assert "analyst" in role_map
        assert "auditor" in role_map
        assert "viewer" in role_map

        assert role_map["super_admin"]["permissionCount"] == 20
        assert role_map["analyst"]["permissionCount"] == 7
        assert role_map["auditor"]["permissionCount"] == 8
        assert role_map["viewer"]["permissionCount"] == 3

    def test_password_hashing_and_verification(self, temp_db):
        password = "SecurePassword2026!"
        pwd_hash, salt = database._hash_password(password)
        assert len(pwd_hash) == 64
        assert len(salt) == 32

        assert database._verify_password(password, pwd_hash, salt) is True
        assert database._verify_password("WrongPassword!", pwd_hash, salt) is False
        assert database._verify_password("", pwd_hash, salt) is False
        assert database._verify_password(None, pwd_hash, salt) is False

    def test_session_lifecycle(self, temp_db):
        user, _ = database.authenticate_user_db("admin", TEST_ADMIN_PASSWORD)
        assert user is not None

        token = database.create_auth_session_db(user["id"])
        assert len(token) == 64

        session_user = database.validate_auth_token_db(token)
        assert session_user is not None
        assert session_user["id"] == user["id"]
        assert session_user["username"] == "admin"

        # Invalidate session
        assert database.delete_auth_session_db(token) is True
        assert database.validate_auth_token_db(token) is None

    def test_expired_session_rejected(self, temp_db):
        user, _ = database.authenticate_user_db("admin", TEST_ADMIN_PASSWORD)
        assert user is not None
        token = database.create_auth_session_db(user["id"])
        past_date = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        with database.get_db() as conn:
            conn.execute("UPDATE auth_sessions SET expires_at = ? WHERE token = ?", (past_date, token))
            conn.commit()

        assert database.validate_auth_token_db(token) is None

    def test_user_crud_and_validation(self, temp_db):
        roles = database.get_roles_list_db()
        viewer_role = next(r for r in roles if r["name"] == "viewer")
        admin_user, _ = database.authenticate_user_db("admin", TEST_ADMIN_PASSWORD)
        admin_id = admin_user["id"]

        # Create user
        new_user = database.create_user_db(
            username="unit_test_user",
            email="unit@epa.punjab.gov.pk",
            password="UnitPassword123!",
            full_name="Unit Tester",
            role_id=viewer_role["id"],
            is_active=1,
            current_user_id=admin_id,
        )
        assert new_user["username"] == "unit_test_user"
        assert new_user["fullName"] == "Unit Tester"
        user_id = new_user["id"]

        # Password minimum length check
        with pytest.raises(ValueError, match="at least 8 characters"):
            database.create_user_db(
                username="short_pwd_user",
                email="short@epa.punjab.gov.pk",
                password="short",
                full_name="Short Pwd",
                role_id=viewer_role["id"],
                current_user_id=admin_id,
            )

        # Duplicate username error
        with pytest.raises(ValueError, match="already taken"):
            database.create_user_db(
                username="unit_test_user",
                email="other@epa.punjab.gov.pk",
                password="ValidPassword123!",
                full_name="Duplicate",
                role_id=viewer_role["id"],
                current_user_id=admin_id,
            )

        # Duplicate email error
        with pytest.raises(ValueError, match="already registered"):
            database.create_user_db(
                username="other_username",
                email="unit@epa.punjab.gov.pk",
                password="ValidPassword123!",
                full_name="Duplicate",
                role_id=viewer_role["id"],
                current_user_id=admin_id,
            )

        # Update user
        updated = database.update_user_db(user_id, full_name="Senior Unit Tester")
        assert updated["fullName"] == "Senior Unit Tester"

        # Authenticate with email
        auth_by_email, _ = database.authenticate_user_db("unit@epa.punjab.gov.pk", "UnitPassword123!")
        assert auth_by_email is not None
        assert auth_by_email["id"] == user_id

        # Deactivate and check login blocked
        database.update_user_db(user_id, is_active=0)
        deact_user, err = database.authenticate_user_db("unit_test_user", "UnitPassword123!")
        assert deact_user is None
        assert "inactive" in err.lower() or "disabled" in err.lower() or "deactivated" in err.lower()

        # Delete user
        admin_user, _ = database.authenticate_user_db("admin", TEST_ADMIN_PASSWORD)
        del_res = database.delete_user_db(user_id, current_user_id=admin_user["id"])
        assert del_res["success"] is True
        assert database.get_user_by_id_db(user_id) is None

    def test_role_deletion_safeguards(self, temp_db):
        roles = database.get_roles_list_db()
        admin_role = next(r for r in roles if r["name"] == "super_admin")

        # Built-in system role cannot be deleted
        with pytest.raises(ValueError, match="Cannot delete built-in system role"):
            database.delete_role_db(admin_role["id"])

        admin_user, _ = database.authenticate_user_db("admin", TEST_ADMIN_PASSWORD)
        custom_role = database.create_role_db(
            name="test_temp_role",
            display_name="Temp Role",
            description="Temporary test role",
            permission_ids=[1, 2],
            current_user_id=admin_user["id"],
        )
        assert custom_role["name"] == "test_temp_role"

        # Assign user to custom role
        admin_user, _ = database.authenticate_user_db("admin", TEST_ADMIN_PASSWORD)
        usr = database.create_user_db(
            username="temp_role_user",
            email="temp_role@epa.gov.pk",
            password="ValidPassword123!",
            full_name="Temp Role User",
            role_id=custom_role["id"],
            current_user_id=admin_user["id"],
        )

        # Deletion blocked while users are assigned
        with pytest.raises(ValueError, match="assigned to"):
            database.delete_role_db(custom_role["id"])

        # Delete user first, then role deletion succeeds
        admin_user, _ = database.authenticate_user_db("admin", TEST_ADMIN_PASSWORD)
        database.delete_user_db(usr["id"], current_user_id=admin_user["id"])
        del_role_res = database.delete_role_db(custom_role["id"])
        assert del_role_res["success"] is True

    def test_posts_query_filtering_and_pagination(self, seeded_db):
        # Query all posts
        all_posts = database.get_all_posts()
        assert len(all_posts) >= 3

        # Filter by city
        lahore_posts = database.get_all_posts(city="Lahore")
        assert len(lahore_posts) >= 1
        assert all(p["city_detected"] == "Lahore" for p in lahore_posts)

        # Filter by severity
        hazardous = database.get_all_posts(severity="hazardous")
        assert len(hazardous) >= 1

        # Filter by search term
        searched = database.get_all_posts(search="kilns")
        assert len(searched) >= 1
        assert any(p["id"] == "post_1002" for p in searched)

        # Pagination: limit and offset
        page1 = database.get_all_posts(limit=2, offset=0)
        assert len(page1) == 2
        page2 = database.get_all_posts(limit=2, offset=2)
        assert len(page2) == 2

    def test_posts_deduplication_and_merge(self, temp_db):
        initial_post = [
            {
                "id": "post_dup_1",
                "text": "Lahore air smog alert today.",
                "authorUsername": "reporter1",
                "authorName": "Reporter One",
                "createdAt": "2026-11-01T12:00:00Z",
                "likes": 10,
                "retweets": 2,
                "replies": 1,
                "views": 100,
                "mediaUrls": ["https://pbs.twimg.com/img1.jpg"],
                "city": "Lahore",
                "topic": "General",
                "severity": "Unhealthy",
                "sentiment": "Concerned",
                "sentimentScore": -0.4,
                "isNoise": False,
                "isVerified": True
            }
        ]
        database.save_posts_batch(initial_post)

        # Duplicate post with higher metrics and additional media
        dup_post = [
            {
                "id": "post_dup_1",
                "text": "Lahore air smog alert today.",
                "authorUsername": "reporter1",
                "authorName": "Reporter One",
                "createdAt": "2026-11-01T12:00:00Z",
                "likes": 85,
                "retweets": 19,
                "replies": 7,
                "views": 1500,
                "mediaUrls": ["https://pbs.twimg.com/img1.jpg", "https://pbs.twimg.com/img2.jpg"],
                "city": "Lahore",
                "topic": "General",
                "severity": "Unhealthy",
                "sentiment": "Concerned",
                "sentimentScore": -0.4,
                "isNoise": False,
                "isVerified": True
            }
        ]
        database.save_posts_batch(dup_post)

        with database.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM posts WHERE id = ?", ("post_dup_1",))
            row = cursor.fetchone()
            assert row is not None
            assert row["likes"] == 85
            assert row["retweets"] == 19
            assert row["views"] == 1500

    def test_noise_exclusion_and_restoration(self, seeded_db):
        post_id = "post_1001"
        # Exclude to noise pool
        exc_res = database.exclude_post_as_noise(post_id, reason="Test exclusion reason", category="OFF_TOPIC")
        assert exc_res["success"] is True

        # Check post is excluded from verified feed
        active = database.get_all_posts(search="Please wear masks")
        assert not any(p["id"] == post_id for p in active)

        # Check post is in noise pool
        noise = database.get_noise_posts()
        assert any(p["id"] == post_id for p in noise)

        # Restore back to verified feed
        rest_res = database.restore_noise_post(post_id)
        assert rest_res["success"] is True

        active_restored = database.get_all_posts(search="Please wear masks")
        assert any(p["id"] == post_id for p in active_restored)

    def test_learned_rules_crud(self, temp_db):
        rule = database.add_learned_rule(
            rule_type="keyword",
            rule_value="test_noise_keyword",
            description="Unit test noise rule"
        )
        assert rule["ruleValue"] == "test_noise_keyword"
        assert rule["isActive"] is True
        rule_id = rule["id"]

        # Toggle inactive
        toggled = database.toggle_learned_rule(rule_id, is_active=False)
        assert toggled["isActive"] is False

        # Delete rule
        del_res = database.delete_learned_rule(rule_id)
        assert del_res["success"] is True
        assert not any(r["id"] == rule_id for r in database.get_learned_rules())

    def test_turnstile_verification_tokens(self, temp_db, monkeypatch):
        monkeypatch.delenv("EPA_TURNSTILE_LOCAL_TEST", raising=False)
        ok, _ = database.verify_turnstile_token("DEMO_BYPASS")
        assert ok is False

        ok, _ = database.verify_turnstile_token("TEST_BYPASS")
        assert ok is False

        ok, _ = database.verify_turnstile_token("XXXX.DUMMY.TOKEN.XXXX")
        assert ok is False

        monkeypatch.setenv("EPA_TURNSTILE_LOCAL_TEST", "1")
        ok, _ = database.verify_turnstile_token("XXXX.DUMMY.TOKEN.XXXX")
        assert ok is True
        ok, _ = database.verify_turnstile_token("DEMO_BYPASS")
        assert ok is False

        ok, err = database.verify_turnstile_token("")
        assert ok is False
        assert "missing" in err.lower()

    def test_posts_chronological_sorting_with_mixed_date_formats(self, temp_db):
        """Verify posts with Twitter date formats sort chronologically (e.g. Friday Nov 06 before Wed Nov 04)."""
        posts = [
            {
                "id": "post_wed_4",
                "text": "Wednesday smog report",
                "authorUsername": "reporter_wed",
                "createdAt": "Wed Nov 04 19:17:03 +0000 2026",
            },
            {
                "id": "post_fri_6",
                "text": "Friday latest alert",
                "authorUsername": "reporter_fri",
                "createdAt": "Fri Nov 06 04:52:58 +0000 2026",
            },
            {
                "id": "post_thu_5",
                "text": "Thursday alert",
                "authorUsername": "reporter_thu",
                "createdAt": "Thu Nov 05 18:22:10 +0000 2026",
            },
        ]
        database.save_posts_batch(posts)

        # Ensure normalized in database
        with database.get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, created_at FROM posts WHERE id IN ('post_wed_4', 'post_fri_6', 'post_thu_5')")
            mapping = dict(cursor.fetchall())
            assert mapping["post_wed_4"] == "2026-11-04T19:17:03Z"
            assert mapping["post_thu_5"] == "2026-11-05T18:22:10Z"
            assert mapping["post_fri_6"] == "2026-11-06T04:52:58Z"

        # Verify newest sort returns Friday Nov 6 first
        results = database.get_all_posts(sort_by="newest", sort_order="desc", limit=10)
        returned_ids = [p["id"] for p in results if p["id"] in mapping]
        assert returned_ids == ["post_fri_6", "post_thu_5", "post_wed_4"]

