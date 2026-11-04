import time
import pytest
import pipeline
from backend import service, database

class TestIngestionStress:
    def test_high_volume_pipeline_enrichment_and_filtering(self):
        """
        Stress test the NLP enrichment and dataset processing pipeline with 300 posts
        varying across cities, AQI patterns, duplicates, and noise keywords.
        """
        cities = ["Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", "Multan", "Bahawalpur", "Sialkot", "Sargodha"]
        topics = ["smog", "crop burning", "industrial emissions", "traffic haze", "green lockdown"]

        raw_posts = []
        for i in range(300):
            city = cities[i % len(cities)]
            topic = topics[i % len(topics)]
            aqi_val = 150 + (i % 350)
            text = f"Urgent smog update from {city}! Severe {topic} reported today with AQI reaching {aqi_val}. https://news.example.com/{i} #SavePunjab"
            raw_posts.append({
                "id": f"stress_raw_{i}",
                "text": text,
                "likes": (i * 7) % 500,
                "retweets": (i * 3) % 200,
                "replies": (i * 2) % 100,
                "quotes": i % 50,
                "created_at": "2026-11-04T12:30:00Z",
                "authorUsername": f"punjab_citizen_{i}",
                "authorName": f"Citizen {i}",
                "authorVerified": (i % 10 == 0)
            })

        # Add 50 intentional duplicates to test deduplication stress
        for i in range(50):
            raw_posts.append({
                "id": f"stress_raw_dup_{i}",
                "text": raw_posts[i]["text"],
                "likes": 10,
                "retweets": 5,
                "replies": 2,
                "quotes": 1,
                "created_at": "2026-11-04T12:35:00Z",
                "authorUsername": f"punjab_citizen_dup_{i}",
                "authorName": f"Duplicate Citizen {i}",
                "authorVerified": False
            })

        start_time = time.time()
        # Process dataset through pipeline
        valid_posts, audit_log, noise_posts = pipeline.process_dataset(raw_posts)
        elapsed = time.time() - start_time

        # Processing 350 posts through pipeline with deduplication should finish well under 3 seconds
        assert elapsed < 3.0, f"Processing took too long: {elapsed:.2f}s"
        assert len(valid_posts) > 0
        assert len(valid_posts) <= 300  # Duplicates properly filtered or merged

        # Verify enriched fields on output posts
        for p in valid_posts:
            assert "city_detected" in p
            assert "sentiment" in p
            assert "sentiment_score" in p
            assert "aqi_value" in p
            assert "total_engagement" in p

    def test_high_volume_batch_service_ingestion(self, temp_db):
        """
        Stress test service layer batch ingestion and database persistence with 200 clean posts.
        """
        batch = [
            {
                "id": f"service_stress_{i}",
                "text": f"Air Quality Monitoring Post #{i} in Faisalabad, AQI level is {200 + (i % 200)}.",
                "authorUsername": f"env_monitor_{i}",
                "authorName": f"Monitor {i}",
                "authorVerified": False,
                "likes": i,
                "retweets": i * 2,
                "replies": 0,
                "quotes": 0,
                "createdAt": "2026-11-04T13:00:00Z"
            }
            for i in range(200)
        ]

        t0 = time.time()
        res = service.ingest_raw_batch(batch, mode="merge")
        write_time = time.time() - t0

        assert res.get("success") is True
        assert res["stats"]["totalIngested"] == 200
        # Database batch insert for 200 items with WAL should take under 2.5 seconds
        assert write_time < 2.5, f"Database write took too long: {write_time:.2f}s"

        # Verify query retrieval
        posts = database.get_all_posts(city="Faisalabad", limit=300)
        assert len(posts) >= 200
