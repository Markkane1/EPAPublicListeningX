import os
import json
import pytest
from backend import service, database

class TestIngestionPipelineIntegration:
    def test_batch_ingest_from_data_file(self, temp_db, project_root):
        batch1_path = os.path.join(project_root, "data", "batch1.json")
        assert os.path.exists(batch1_path), "data/batch1.json must exist"

        with open(batch1_path, "r", encoding="utf-8") as f:
            raw_posts = json.load(f)

        assert len(raw_posts) > 0

        # Ingest batch
        res = service.ingest_raw_batch(raw_posts, mode="merge")
        assert res["success"] is True
        assert res["stats"]["totalIngested"] == len(raw_posts)
        # Because batch1 was already in seeded database, duplicates are logged
        assert res["stats"]["exactDuplicates"] > 0
        assert len(res["auditLog"]) > 0

    def test_new_posts_batch_ingest(self, temp_db):
        brand_new_batch = [
            {
                "id": "new_integ_post_001",
                "text": "Lahore air quality index hit 520 emergency smog levels today! Health department advises staying indoors.",
                "authorUsername": "punjab_clean_air_watch",
                "authorName": "Punjab Clean Air Watch",
                "authorVerified": True,
                "likes": 40,
                "retweets": 12,
                "replies": 3
            },
            {
                "id": "new_integ_post_002",
                "text": "Gujranwala administration seals 15 smoke-emitting industrial units under anti-smog regulations.",
                "authorUsername": "gujranwala_news_live",
                "authorName": "GWA News",
                "likes": 25,
                "retweets": 6,
                "replies": 1
            }
        ]

        res = service.ingest_raw_batch(brand_new_batch, mode="merge")
        assert res["success"] is True
        assert len(res["newlyAddedPosts"]) == 2
        assert res["stats"]["cleanCount"] == 2

        # Verify posts appear in database
        post1 = next((p for p in database.get_all_posts(search="emergency smog levels") if p["id"] == "new_integ_post_001"), None)
        assert post1 is not None
        assert post1["city_detected"] == "Lahore"
        assert "Hazardous" in post1["severity"]
        assert post1["severity_code"] == "hazardous"

    def test_idempotent_duplicate_reingestion(self, temp_db):
        sample_batch = [
            {
                "id": "integ_dup_101",
                "text": "Severe smog in Lahore city today AQI 390 hazardous alert.",
                "authorUsername": "lahore_monitor",
                "authorName": "Lahore Monitor",
                "likes": 15,
                "retweets": 4,
                "replies": 2
            }
        ]

        # First ingestion - new post
        res1 = service.ingest_raw_batch(sample_batch, mode="merge")
        assert res1["success"] is True
        assert len(res1["newlyAddedPosts"]) == 1
        initial_db_count = len(database.get_all_posts())

        # Second ingestion of same ID
        res2 = service.ingest_raw_batch(sample_batch, mode="merge")
        assert res2["success"] is True
        assert len(res2["newlyAddedPosts"]) == 0
        assert res2["stats"]["exactDuplicates"] == 1

        # Total DB count must NOT increase
        second_db_count = len(database.get_all_posts())
        assert second_db_count == initial_db_count

    def test_live_search_and_fetch_simulation(self, temp_db):
        res = service.execute_search_and_fetch(
            keyword="Lahore AQI",
            live_override=True,
            max_results=10,
            simulate_if_missing=True
        )
        assert res["success"] is False
        assert res["fetchedCount"] == 0
        assert res["mode"] == "x_api"
        assert res["isSimulated"] is False
        assert res["newPosts"] == []
        assert "stats" in res
