import pytest
from backend import database, service

class TestStatsAndAnalyticsIntegration:
    def test_dashboard_stats_aggregation(self, seeded_db):
        stats = database.get_db_stats()

        assert "total_posts" in stats or "totalPosts" in stats
        total = stats.get("total_posts", stats.get("totalPosts", 0))
        assert total >= 3

        # AQI metrics
        peak = stats.get("peak_aqi", stats.get("peakAqi", 0))
        avg = stats.get("avg_aqi", stats.get("avgAqi", 0.0))
        assert peak >= 450
        assert avg > 0

        # City breakdown
        cities = stats.get("cities") or stats.get("city_distribution") or {}
        assert isinstance(cities, (dict, list))

        # Sentiment breakdown
        sentiments = stats.get("sentiments") or stats.get("sentiment_distribution") or {}
        assert isinstance(sentiments, (dict, list))

    def test_sentiment_reanalyze_all_posts(self, seeded_db):
        res = database.reanalyze_all_posts_db(engine_name="vader")
        assert res["success"] is True
        assert res["totalReanalyzed"] >= 3
        assert res["engine"] == "vader"

        # Verify posts in DB now have updated sentiment_engine
        posts = database.get_all_posts(limit=10)
        for p in posts:
            assert p["sentiment_engine"] == "vader"
            assert isinstance(p["sentiment_score"], float)
