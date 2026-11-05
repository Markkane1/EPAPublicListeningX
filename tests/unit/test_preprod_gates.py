import json
import os
import ssl
import urllib.request

import pytest

import pipeline
from backend import database, service, x_api_client
from tests.conftest import (
    ROOT_DIR,
    TEST_ADMIN_PASSWORD,
    TEST_ANALYST_PASSWORD,
)

PUBLISHED = (
    ("admin", "EPAadmin2026!"),
    ("analyst", "EPAanalyst2026!"),
    ("auditor", "EPAauditor2026!"),
    ("viewer", "EPAviewer2026!"),
)


def _post_ids():
    with database.get_db() as conn:
        return {row["id"] for row in conn.execute("SELECT id FROM posts")}


class TestPreprodGates:
    def test_published_passwords_fail_on_seeded_db(self, temp_db):
        for username, password in PUBLISHED:
            user, _err = database.authenticate_user_db(username, password)
            assert user is None

    def test_fresh_init_does_not_keep_published_seed_password(self, monkeypatch, tmp_path):
        db_path = str(tmp_path / "fresh.db")
        monkeypatch.setattr(database, "DB_PATH", db_path)
        monkeypatch.setattr(database, "BOOTSTRAP_CREDENTIALS_PATH", str(tmp_path / "bootstrap.txt"))
        monkeypatch.setitem(database.DEFAULT_USERS_DATA[0], "password", "EPAadmin2026!")
        database.init_db()
        user, _err = database.authenticate_user_db("admin", "EPAadmin2026!")
        assert user is None

    def test_retire_published_passwords_invalidates_hash_and_sessions(self, temp_db, monkeypatch, tmp_path):
        monkeypatch.setattr(database, "BOOTSTRAP_CREDENTIALS_PATH", str(tmp_path / "bootstrap.txt"))
        admin, _err = database.authenticate_user_db("admin", TEST_ADMIN_PASSWORD)
        assert admin is not None
        pwd_hash, salt = database._hash_password("EPAadmin2026!")
        with database.get_db() as conn:
            conn.execute(
                "UPDATE users SET password_hash = ?, salt = ? WHERE id = ?",
                (pwd_hash, salt, admin["id"]),
            )
            conn.commit()
        token = database.create_auth_session_db(admin["id"])
        retired = database.retire_published_passwords()
        assert "admin" in retired
        user, _err = database.authenticate_user_db("admin", "EPAadmin2026!")
        assert user is None
        assert database.validate_auth_token_db(token) is None
        written = (tmp_path / "bootstrap.txt").read_text(encoding="utf-8")
        assert "username: admin" in written
        assert "password:" in written

    def test_bypass_tokens_fail(self, temp_db):
        for token in ("DEMO_BYPASS", "TEST_BYPASS", "XXXX.DUMMY.TOKEN.XXXX"):
            ok, _msg = database.verify_turnstile_token(token)
            assert ok is False

    def test_turnstile_timeout_returns_false(self, temp_db, monkeypatch):
        database.save_settings({"turnstile_secret_key": "unit-test-real-turnstile-secret"})
        calls = {"n": 0}

        def boom(*_args, **_kwargs):
            calls["n"] += 1
            raise TimeoutError("timed out")

        monkeypatch.setattr(urllib.request, "urlopen", boom)
        ok, _msg = database.verify_turnstile_token("cloudflare-live-token")
        assert calls["n"] == 1
        assert ok is False

    def test_password_change_drops_other_session(self, temp_db):
        admin, _err = database.authenticate_user_db("admin", TEST_ADMIN_PASSWORD)
        current = database.create_auth_session_db(admin["id"])
        other = database.create_auth_session_db(admin["id"])
        database.update_user_db(
            admin["id"],
            password="RotatedUnitPass#2026",
            current_user_id=admin["id"],
            current_session_token=current,
        )
        assert database.validate_auth_token_db(current) is not None
        assert database.validate_auth_token_db(other) is None

    def test_analyst_cannot_create_super_admin(self, temp_db):
        analyst, _err = database.authenticate_user_db("analyst", TEST_ANALYST_PASSWORD)
        roles = database.get_roles_list_db()
        super_role = next(role for role in roles if role["name"] == "super_admin")
        with pytest.raises(ValueError):
            database.create_user_db(
                username="rogue_admin",
                email="rogue.admin@epa.punjab.gov.pk",
                password="RogueAdmin#2026",
                full_name="Rogue Admin",
                role_id=super_role["id"],
                current_user_id=analyst["id"],
            )

    def test_missing_bearer_and_x_api_error_insert_nothing(self, temp_db, monkeypatch):
        def explode(*_args, **_kwargs):
            raise AssertionError("generate_mock_live_search must not run")

        monkeypatch.setattr(x_api_client, "generate_mock_live_search", explode)
        before = database.get_db_stats()["totalPosts"]
        missing = service.execute_search_and_fetch(
            keyword="Lahore",
            live_override=True,
            simulate_if_missing=True,
        )
        assert missing["success"] is False
        assert missing["isSimulated"] is False
        assert missing["fetchedCount"] == 0
        assert database.get_db_stats()["totalPosts"] == before

        database.save_settings({
            "x_bearer_token": "unit-bearer",
            "x_api_endpoint": "https://api.twitter.com/2/tweets/search/recent",
        })

        def fail_search(*_args, **_kwargs):
            raise x_api_client.XApiError("upstream down")

        monkeypatch.setattr(x_api_client, "search_recent_tweets", fail_search)
        failed = service.execute_search_and_fetch(
            keyword="Lahore",
            live_override=True,
            simulate_if_missing=True,
        )
        assert failed["success"] is False
        assert failed["fetchedCount"] == 0
        assert database.get_db_stats()["totalPosts"] == before

    def test_replace_mode_leaves_only_batch_ids(self, temp_db):
        batch = [{
            "id": "replace_only_1",
            "text": "Lahore smog air quality is hazardous across the city today",
            "authorUsername": "citizen_replace",
        }]
        res = service.ingest_raw_batch(batch, mode="replace")
        assert res["success"] is True
        assert _post_ids() == {"replace_only_1"}

    def test_duplicate_keeps_higher_likes_and_both_media(self, temp_db):
        first = {
            "id": "dup_media_1",
            "text": "Lahore smog is choking the city today please stay indoors",
            "authorUsername": "citizen_dup",
            "likes": 3,
            "mediaUrls": ["https://pbs.twimg.com/media/low.jpg"],
        }
        second = {
            "id": "dup_media_1",
            "text": "Lahore smog is choking the city today please stay indoors",
            "authorUsername": "citizen_dup",
            "likes": 40,
            "mediaUrls": ["https://pbs.twimg.com/media/high.jpg"],
        }
        service.ingest_raw_batch([first], mode="merge")
        service.ingest_raw_batch([second], mode="merge")
        with database.get_db() as conn:
            row = conn.execute(
                "SELECT likes, media_urls FROM posts WHERE id = ?",
                ("dup_media_1",),
            ).fetchone()
        assert row["likes"] == 40
        media = json.loads(row["media_urls"])
        assert "https://pbs.twimg.com/media/low.jpg" in media
        assert "https://pbs.twimg.com/media/high.jpg" in media

    def test_gujranwala_aap_smog_is_kept(self):
        valid, _audit, noise = pipeline.process_dataset([{
            "id": "aq1",
            "text": "Gujranwala mein aap smog dekho",
            "authorUsername": "citizen1",
        }])
        assert any(post.get("id") == "aq1" for post in valid)
        assert not any(post.get("id") == "aq1" for post in noise)

    def test_query_file_uses_uppercase_or(self):
        text = open(os.path.join(ROOT_DIR, "Query.txt"), encoding="utf-8").read()
        assert " OR " in text
        assert "smog" in text
        assert "Lahore" in text
        assert "Gujranwala" in text

    def test_keyword_query_keeps_official_groups(self, temp_db):
        active = database.get_active_query_version_db()["queryText"]
        built = service.build_effective_api_query("kiln", active)
        assert "air quality" in built
        assert "Lahore" in built
        assert "Gujranwala" in built
        assert "(kiln)" in built

    def test_tls_defaults_stay_verified(self):
        import backend.sentiment_engine  # noqa: F401
        assert ssl._create_default_https_context is ssl.create_default_context
        source = open(
            os.path.join(ROOT_DIR, "backend", "x_api_client.py"),
            encoding="utf-8",
        ).read()
        assert "CERT_NONE" not in source

    def test_official_x_api_url(self):
        assert x_api_client.is_official_x_api_url("http://127.0.0.1/") is False
        assert x_api_client.is_official_x_api_url(
            "https://api.twitter.com/2/tweets/search/recent"
        ) is True

    def test_get_all_posts_without_small_limit_is_capped(self, temp_db):
        extra = [
            {
                "id": f"cap_post_{index}",
                "text": f"cap row {index}",
                "authorUsername": "cap_user",
                "createdAt": "2026-12-01T00:00:00Z",
                "likes": 1,
            }
            for index in range(250)
        ]
        database.save_posts_batch(extra)
        with database.get_db() as conn:
            total = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
        assert total >= 250
        assert len(database.get_all_posts()) <= 200
        assert len(database.get_all_posts(limit=100000)) == 200

    def test_stats_without_aqi_are_not_placeholders(self, temp_db):
        with database.get_db() as conn:
            conn.execute("UPDATE posts SET aqi_value = NULL")
            conn.commit()
        stats = database.get_db_stats()
        assert stats["peakAqi"] is None
        assert stats["avgAqi"] is None
        assert stats["peakAqi"] != 606
        assert stats["avgAqi"] != 361.1
