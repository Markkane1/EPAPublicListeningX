"""Contracts for bounded post lists, counts, stats breakdowns, and list DTOs."""

from backend import database


def _extra_post(post_id, created_at, **overrides):
    row = {
        "id": post_id,
        "text": "Lahore smog advisory for contract tests.",
        "authorUsername": "contract_desk",
        "authorName": "Contract Desk",
        "authorVerified": False,
        "createdAt": created_at,
        "likes": 4,
        "retweets": 1,
        "replies": 0,
        "views": 80,
        "mediaUrls": [],
        "city": "Lahore",
        "city_detected": "Lahore",
        "topic": "AQI Measurement",
        "aqi": 410,
        "aqi_value": 410,
        "severity": "Hazardous",
        "sentiment": "Critical / Alarmed",
        "isNoise": False,
        "isVerified": True,
    }
    row.update(overrides)
    return row


class TestPostsListContract:
    def test_count_posts_matches_sqlite_count(self, seeded_db):
        with database.get_db() as conn:
            raw = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
        assert database.count_posts() == raw
        assert raw >= 3

    def test_count_posts_respects_city_filter(self, seeded_db):
        with database.get_db() as conn:
            raw = conn.execute(
                "SELECT COUNT(*) FROM posts WHERE city_detected = ?",
                ("Lahore",),
            ).fetchone()[0]
        assert database.count_posts(city="Lahore") == raw
        assert raw >= 1

    def test_date_filter_is_utc_calendar_day(self, seeded_db):
        database.save_posts_batch([_extra_post("post_unique_date", "1999-06-15T10:00:00Z")])
        rows = database.get_all_posts(date="1999-06-15")
        assert [p["id"] for p in rows] == ["post_unique_date"]
        assert database.count_posts(date="1999-06-15") == 1

    def test_time_of_day_uses_asia_karachi(self, seeded_db):
        database.save_posts_batch([
            _extra_post("post_night_1", "1999-06-15T20:00:00Z"),  # 01:00 Asia/Karachi
            _extra_post("post_afternoon_1", "1999-06-15T10:00:00Z"),  # 15:00 Asia/Karachi
        ])
        night_ids = {p["id"] for p in database.get_all_posts(date="1999-06-15", time_of_day="night")}
        afternoon_ids = {p["id"] for p in database.get_all_posts(date="1999-06-15", time_of_day="afternoon")}
        assert night_ids == {"post_night_1"}
        assert afternoon_ids == {"post_afternoon_1"}

    def test_media_and_verified_filters(self, seeded_db):
        database.save_posts_batch([
            _extra_post(
                "post_with_photo",
                "1999-06-17T10:00:00Z",
                mediaUrls=["https://pbs.twimg.com/media/contract.jpg"],
                authorVerified=False,
            ),
            _extra_post(
                "post_verified_text",
                "1999-06-17T11:00:00Z",
                mediaUrls=[],
                authorVerified=True,
            ),
        ])
        with_media = database.get_all_posts(date="1999-06-17", media="media")
        text_only = database.get_all_posts(date="1999-06-17", media="text")
        verified = database.get_all_posts(date="1999-06-17", verified=True)
        assert [p["id"] for p in with_media] == ["post_with_photo"]
        assert [p["id"] for p in text_only] == ["post_verified_text"]
        assert [p["id"] for p in verified] == ["post_verified_text"]
        assert all(p.get("authorVerified") for p in verified)

    def test_list_dto_omits_heavy_author_fields(self, seeded_db):
        post = database.get_all_posts(limit=1)[0]
        assert "authorBanner" not in post
        assert "authorDescription" not in post
        assert "authorFollowing" not in post
        assert "authorName" in post
        assert "text" in post

    def test_stats_include_archive_and_breakdowns(self, seeded_db):
        stats = database.get_db_stats()
        with database.get_db() as conn:
            raw = conn.execute("SELECT COUNT(*) FROM posts").fetchone()[0]
        assert stats["archiveTotalPosts"] == stats["totalPosts"] == raw
        assert raw >= 3
        assert "Lahore" in stats["cityCounts"]
        assert isinstance(stats["severityCounts"], dict)
        assert isinstance(stats["sentimentCounts"], dict)
        assert isinstance(stats["aqiBucketCounts"], dict)
        assert stats["aqiBucketCounts"].get("Hazardous (300+)", 0) >= 1
        assert isinstance(stats["dateCounts"], list)
        assert stats["peakAqi"] is None or isinstance(stats["peakAqi"], (int, float))
        assert stats["peakAqiCity"] is None or isinstance(stats["peakAqiCity"], str)
        assert set(stats["auditStatusCounts"]) >= {"KEPT", "DUPLICATE_MERGED", "REMOVED"}

    def test_stats_date_scopes_kpis_not_archive_total(self, seeded_db):
        database.save_posts_batch([_extra_post("post_unique_stats", "1999-06-16T09:00:00Z", aqi=321, aqi_value=321)])
        scoped = database.get_db_stats(date="1999-06-16")
        full = database.get_db_stats()
        assert scoped["totalPosts"] == 1
        assert scoped["archiveTotalPosts"] == full["archiveTotalPosts"]
        assert scoped["archiveTotalPosts"] >= 3
        assert scoped["peakAqi"] == 321
        assert any(item["date"] == "1999-06-16" for item in scoped["dateCounts"])
        assert any(item["date"] != "1999-06-16" for item in scoped["dateCounts"]) or full["archiveTotalPosts"] == 1

