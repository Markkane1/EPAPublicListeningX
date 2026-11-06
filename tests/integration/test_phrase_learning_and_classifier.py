import pytest
import json
from backend import service, database, taxonomy, classifier
import pipeline

class TestPhraseLearningAndClassifierIntegration:
    def test_phrase_candidate_extraction_for_exclusion(self):
        # 1. Bureaucratic phrase detection
        text_pr = "Minister chaired high level meeting in Lahore to review departmental progress"
        cands_pr = service.extract_exclusion_candidates_service(text=text_pr, category="GOVT_BUREAUCRATIC_PR")
        assert len(cands_pr) > 0
        assert any("chaired" in c["phrase"].lower() for c in cands_pr)

        # 2. Indian water dispute phrase detection
        text_water = "Protest held at Buddha Nullah regarding chemical pollution"
        cands_water = service.extract_exclusion_candidates_service(text=text_water, category="INDIAN_WATER_DISPUTES")
        assert len(cands_water) > 0
        assert any("buddha nullah" in c["phrase"].lower() for c in cands_water)

        # 3. Commercial ad detection
        text_ad = "Special winter discount on HEPA air purifier order on WhatsApp"
        cands_ad = service.extract_exclusion_candidates_service(text=text_ad, category="COMMERCIAL_SPAM_AND_ADS")
        assert len(cands_ad) > 0
        assert any("air purifier" in c["phrase"].lower() or "whatsapp" in c["phrase"].lower() for c in cands_ad)

    def test_exclude_with_phrase_patterns_does_not_block_author(self, seeded_db):
        posts = database.get_all_posts(limit=10)
        target = posts[0]
        target_id = target["id"]
        target_author = target["authorUsername"]

        # Exclude post with phrase pattern "chaired review meeting"
        res = service.exclude_post_service(
            post_id=target_id,
            reason="Official ceremonial protocol without field data",
            category="GOVT_BUREAUCRATIC_PR",
            phrase_patterns=["chaired review meeting"],
            confidence=1.0,
            remove_associated_rules=True
        )
        assert res["success"] is True
        assert len(res["learnedPhraseRules"]) == 1

        # Verify active rules has negative_phrase
        active_rules = database.get_active_learned_rules()
        assert "chaired review meeting" in active_rules["negative_phrases"]
        # Verify author is NOT in author whitelist or excluded
        assert target_author.lower() not in active_rules["author_whitelist"]

        # Verify curation_feedback table was populated
        with database.get_db() as conn:
            c = conn.cursor()
            c.execute("SELECT * FROM curation_feedback WHERE post_id = ?", (str(target_id),))
            feedback_row = c.fetchone()
            assert feedback_row is not None
            assert feedback_row["label"] == 0
            assert feedback_row["category"] == "GOVT_BUREAUCRATIC_PR"
            tokens = json.loads(feedback_row["trigger_tokens"])
            assert "chaired review meeting" in tokens

    def test_pipeline_negative_phrase_filtering_with_metric_safeguards(self):
        learned = {
            "negative_phrases": ["chaired review meeting"]
        }

        # Post 1: Pure PR without metrics -> Should be filtered out to noise
        post_pr = {
            "id": "mock_pr_001",
            "authorUsername": "punjab_info_dept",
            "text": "Secretary chaired review meeting to discuss departmental strategy in Lahore."
        }

        # Post 2: Same author with phrase BUT includes factory closure and fine amount -> Safeguard keeps it!
        post_action = {
            "id": "mock_action_002",
            "authorUsername": "punjab_info_dept",
            "text": "Secretary chaired review meeting and EPA squad sealed 3 illegal factories, fined 150,000 PKR in Sheikhupura, AQI was 430."
        }

        kept, audit, noise = pipeline.process_dataset([post_pr, post_action], learned_rules=learned)

        assert any(n["id"] == "mock_pr_001" for n in noise)
        pr_noise_item = next(n for n in noise if n["id"] == "mock_pr_001")
        assert pr_noise_item["exclusion_category"] == "GOVT_BUREAUCRATIC_PR"
        assert "chaired review meeting" in pr_noise_item["exclusion_reason"]

        assert any(k["id"] == "mock_action_002" for k in kept)
        kept_item = next(k for k in kept if k["id"] == "mock_action_002")
        assert kept_item["clean_id"] == "mock_action_002"

    def test_classifier_training_and_inference_lifecycle(self, seeded_db):
        # 1. Check status
        status = service.get_classifier_status_service()
        assert status["isReadyToTrain"] is True

        # 2. Train classifier
        train_res = service.train_classifier_service()
        assert train_res["success"] is True
        assert train_res["totalSamples"] > 0
        assert "binaryAccuracy" in train_res["metrics"]

        # 3. Predict on unseen text
        pred_noise = service.predict_classifier_service(text="Secretary chaired meeting with delegation regarding awards")
        assert pred_noise["is_trained"] is True
        assert pred_noise["predicted_category"] != ""

        pred_clean = service.predict_classifier_service(text="Hazardous smog in Lahore today, throat is burning, AQI 480")
        assert pred_clean["is_trained"] is True
        assert pred_clean["confidence"] > 0.4
