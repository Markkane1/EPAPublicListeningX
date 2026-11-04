import pytest
import pipeline
from backend import database

class TestWhiteboxBoundaries:
    @pytest.mark.parametrize("text,expected_aqi,expected_code", [
        ("AQI 14 is very low", None, "unspecified"), # Below 15 cutoff
        ("AQI 15 clean air", 15, "good"),
        ("AQI 50 border good", 50, "good"),
        ("AQI 51 moderate", 51, "moderate"),
        ("AQI 100 moderate max", 100, "moderate"),
        ("AQI 101 sensitive", 101, "sensitive"),
        ("AQI 150 sensitive max", 150, "sensitive"),
        ("AQI 151 unhealthy", 151, "unhealthy"),
        ("AQI 200 unhealthy max", 200, "unhealthy"),
        ("AQI 201 very unhealthy", 201, "very_unhealthy"),
        ("AQI 300 very unhealthy max", 300, "very_unhealthy"),
        ("AQI 301 hazardous min", 301, "hazardous"),
        ("AQI 650 extreme peak", 650, "hazardous"),
        ("AQI 999 max cutoff", 999, "hazardous"),
        ("AQI 1000 out of bounds", None, "unspecified"), # Above 999 cutoff
    ])
    def test_aqi_ladder_boundary_conditions(self, text, expected_aqi, expected_code):
        enr = pipeline.enrich_post({"id": "boundary_t", "text": text})
        assert enr["aqi_value"] == expected_aqi
        assert enr["severity_code"] == expected_code

    def test_malformed_post_payload_resilience(self):
        # Post with None text, None author, empty dicts
        malformed = {
            "id": None,
            "text": None,
            "authorUsername": None,
            "likes": None,
            "retweets": None,
            "mediaUrls": None
        }
        enr = pipeline.enrich_post(malformed)
        assert enr["text"] == "" or enr["text"] is None
        assert enr["total_engagement"] == 0
        assert enr["mediaUrls"] == []
        assert enr["has_media"] is False

    def test_sort_injection_defense(self, seeded_db):
        # Passing malicious sort_by must not execute SQL injection or crash
        posts = database.get_all_posts(sort_by="likes; DROP TABLE posts; --", sort_order="desc")
        assert isinstance(posts, list)
        # Database table should still exist
        assert len(database.get_all_posts()) >= 3

    def test_invalid_pagination_boundaries(self, seeded_db):
        # Negative limit or offset should be safely handled
        p1 = database.get_all_posts(limit=0, offset=0)
        assert isinstance(p1, list)

        # Huge limit
        pHuge = database.get_all_posts(limit=100000, offset=0)
        assert len(pHuge) >= 3

    def test_whitespace_and_unicode_fuzzing(self):
        fuzz_strings = [
            "\x00\x01\x02\x03",
            "🚀🔥🌪️💨😷⚠️",
            "   \r\n\t\v\f   ",
            "العربية / اردو / فارسی",
            "A" * 10000, # Large buffer
        ]
        for s in fuzz_strings:
            res = pipeline.enrich_post({"id": "fuzz", "text": s})
            assert "sentiment" in res
            assert "city_detected" in res
            assert "severity" in res
