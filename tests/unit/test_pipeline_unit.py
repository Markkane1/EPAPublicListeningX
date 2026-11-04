import pytest
import pipeline

class TestPipelineUnit:
    def test_normalize_text_for_dedup(self):
        text1 = "@some_user Hey Check this out https://t.co/xyz123 AQI in Lahore is 450!!"
        norm1 = pipeline.normalize_text_for_dedup(text1)
        assert "aqi in lahore is 450" in norm1
        assert "https" not in norm1
        assert "@" not in norm1

    def test_enrich_post_aqi_extraction(self):
        # 1. Hazardous (301+)
        p1 = {"id": "1", "text": "Smog crisis: AQI of 480 recorded in Lahore today!"}
        enr1 = pipeline.enrich_post(p1)
        assert enr1["aqi_value"] == 480
        assert enr1["severity"] == "Hazardous"
        assert enr1["city_detected"] == "Lahore"

        # 2. Very Unhealthy (201 - 300)
        p2 = {"id": "2", "text": "Rawalpindi air quality index: AQI 240 reported."}
        enr2 = pipeline.enrich_post(p2)
        assert enr2["aqi_value"] == 240
        assert enr2["severity"] == "Very Unhealthy"
        assert enr2["city_detected"] == "Rawalpindi"

        # 3. Moderate (51 - 100)
        p3 = {"id": "3", "text": "Islamabad air clean today, 65 AQI measured."}
        enr3 = pipeline.enrich_post(p3)
        assert enr3["aqi_value"] == 65
        assert enr3["severity"] == "Moderate"
        assert enr3["city_detected"] == "Islamabad"

    def test_enrich_post_city_detection(self):
        cities_to_test = [
            ("Smog covers Gujranwala city today.", "Gujranwala"),
            ("Faisalabad textile sector emissions alert.", "Faisalabad"),
            ("Multan visibility reduced due to dust and smoke.", "Multan"),
            ("Attock district reports clean air.", "Attock"),
            ("Sialkot leather export hub smog update.", "Sialkot"),
            ("پنجاب کے شہر لاہور میں آلودگی۔", "Lahore"),
            ("Air quality across the province is dropping.", "Punjab Region"),
        ]
        for text, expected_city in cities_to_test:
            enr = pipeline.enrich_post({"id": "t", "text": text})
            assert enr["city_detected"] == expected_city

    def test_enrich_post_category_classification(self):
        # Health alert
        h_post = pipeline.enrich_post({"id": "1", "text": "Health advisory: hospital wards full of children with breathing infection."})
        assert h_post["category"] == "Public Health Alert"

        # Government action
        g_post = pipeline.enrich_post({"id": "2", "text": "EPA anti-smog gun squad enforcement crackdown with heavy fines."})
        assert g_post["category"] == "Government & Enforcement Action"

        # Satellite & AQI
        s_post = pipeline.enrich_post({"id": "3", "text": "IQAir ranking tops charts with satellite NASA data."})
        assert s_post["category"] == "AQI Measurement & Satellite Data"

        # Stubble burning
        f_post = pipeline.enrich_post({"id": "4", "text": "Farmers burning parali crop residue and stubble across the fields."})
        assert f_post["category"] == "Agricultural Stubble Burning"

    def test_enrich_post_engagement_calculation(self):
        p = {
            "id": "eng_1",
            "text": "Lahore air smog",
            "likes": 100,
            "retweets": 25,
            "replies": 10,
            "quotes": 5
        }
        enr = pipeline.enrich_post(p)
        # Weighted engagement formula: likes + 2*retweets + 2*replies + 2*quotes
        assert enr["total_engagement"] == 180

    def test_process_dataset_filtering_reasons(self):
        raw_test_batch = [
            # 1. Valid post - kept
            {
                "id": "valid_1",
                "text": "AQI in Lahore reaches 450 hazardous levels today. Please wear masks! #LahoreSmog",
                "authorUsername": "valid_citizen"
            },
            # 2. Excluded handle - removed
            {
                "id": "exc_handle",
                "text": "Air quality monitoring update in Lahore.",
                "authorUsername": "delhipollution"
            },
            # 3. Off-topic - cricket
            {
                "id": "off_cricket",
                "text": "Pakistan Cricket team match in Lahore stadium postponed.",
                "authorUsername": "sports_fan"
            },
            # 4. Off-topic - fast food
            {
                "id": "off_food",
                "text": "Cheezious pizza deal in Lahore tonight is amazing!",
                "authorUsername": "foodie_lahore"
            },
            # 5. Indian domestic context without Pak relevance
            {
                "id": "ind_context",
                "text": "Delhi pollution CAQM meeting held with Haryana and Noida officials.",
                "authorUsername": "delhi_reporter"
            },
            # 6. No air quality relevance
            {
                "id": "no_aq",
                "text": "Meeting my friends in Lahore for shopping and tea.",
                "authorUsername": "lahore_shopper"
            },
            # 7. No geographic relevance
            {
                "id": "no_geo",
                "text": "Air quality is poor and smog is suffocating everywhere in town.",
                "authorUsername": "generic_user"
            }
        ]

        clean_posts, removed_posts, audit_logs = pipeline.process_dataset(raw_test_batch)

        assert len(clean_posts) == 1
        assert clean_posts[0]["id"] == "valid_1"

        removed_reasons = {r["id"]: r["category"] for r in removed_posts}
        assert removed_reasons["exc_handle"] == "EXCLUDED_ACCOUNT"
        assert removed_reasons["off_cricket"] == "OFF_TOPIC"
        assert removed_reasons["off_food"] == "OFF_TOPIC"
        assert removed_reasons["ind_context"] == "EXCLUDED_INDIAN_CONTEXT"
        assert removed_reasons["no_aq"] == "NO_AIR_QUALITY_RELEVANCE"
        assert removed_reasons["no_geo"] == "NO_GEOGRAPHIC_RELEVANCE"

    def test_process_dataset_deduplication(self):
        batch_with_duplicates = [
            {
                "id": "dup_1",
                "text": "Smog crisis in Lahore: AQI 420 reported today.",
                "authorUsername": "user_a",
                "likes": 10,
                "retweets": 2
            },
            {
                "id": "dup_2",  # near duplicate text
                "text": "Smog crisis in Lahore: AQI 420 reported today.",
                "authorUsername": "user_b",
                "likes": 50,
                "retweets": 15
            }
        ]
        clean_posts, removed_posts, audit_logs = pipeline.process_dataset(batch_with_duplicates)
        # Should merge semantic duplicates into one
        assert len(clean_posts) == 1
        merged = clean_posts[0]
        # Engagement should be consolidated
        assert merged["likes"] == 50
        assert merged["retweets"] == 15

    def test_extract_learning_candidates(self):
        post = {
            "id": "test_post_learn",
            "text": "Visibility is low and haze in Muridke is causing throat cough.",
            "authorUsername": "muridke_voice"
        }
        # Candidate generation for NO_AIR_QUALITY_RELEVANCE
        candidates_aq = pipeline.extract_learning_candidates(
            post, exclusion_category="NO_AIR_QUALITY_RELEVANCE", exclusion_reason="No air quality terms"
        )
        assert len(candidates_aq) > 0
        assert any(c["rule_type"] == "author_whitelist" and c["rule_value"] == "muridke_voice" for c in candidates_aq)
        assert any(c["rule_type"] == "aq_keyword" for c in candidates_aq)

        # Candidate generation for NO_GEOGRAPHIC_RELEVANCE
        candidates_geo = pipeline.extract_learning_candidates(
            post, exclusion_category="NO_GEOGRAPHIC_RELEVANCE", exclusion_reason="No geographic relevance"
        )
        assert any(c["rule_type"] == "geo_keyword" and "Muridke" in c["rule_value"] for c in candidates_geo)
