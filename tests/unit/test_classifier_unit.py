import pytest
import os
import json
from backend import classifier

class TestTier1ClassifierUnit:
    def test_tokenize_clean_and_bigrams(self):
        tokens = classifier.tokenize("Secretary chaired high level review meeting in Lahore! https://t.co/abc @epapunjab")
        assert "chaired" in tokens
        assert "meeting" in tokens
        assert "lahore" in tokens
        assert "chaired_meeting" in tokens or "level_review" in tokens
        # Verify URL and mention removed
        assert not any("http" in t for t in tokens)
        assert not any("@" in t for t in tokens)

    def test_fit_and_predict_synthetic(self):
        clf = classifier.Tier1Classifier()
        train_samples = [
            ("Secretary chaired high level review meeting in Lahore to assess progress", 0, "GOVT_BUREAUCRATIC_PR"),
            ("Director General convened a meeting with delegation regarding protocol", 0, "GOVT_BUREAUCRATIC_PR"),
            ("Buddha Nullah water pollution controversy discussed in Indian Punjab", 0, "INDIAN_WATER_DISPUTES"),
            ("Ludhiana nullah pollution causing severe public health issues in India", 0, "INDIAN_WATER_DISPUTES"),
            ("Flat 30% discount on HEPA air purifiers order on WhatsApp today", 0, "COMMERCIAL_SPAM_AND_ADS"),
            ("Best air purifier discount available in stock DM for price", 0, "COMMERCIAL_SPAM_AND_ADS"),
            ("Lahore AQI crossed 520 today, children cannot breathe and eyes are burning", 1, "CITIZEN_GROUND_TRUTH"),
            ("Throat is burning and zero visibility at Mall Road Lahore due to severe smog", 1, "CITIZEN_GROUND_TRUTH"),
            ("EPA squad sealed 5 illegal brick kilns running without zig-zag in Sheikhupura", 1, "OFFICIAL_ENFORCEMENT"),
            ("Anti-smog inspection squad demolished 3 polluting industrial units and fined 200,000", 1, "OFFICIAL_ENFORCEMENT"),
            ("Hospital emergency wards flooded with respiratory patients as smog worsens", 1, "PUBLIC_HEALTH_ADVISORY"),
            ("Doctors issue urgent public health advisory to wear N95 masks outdoors", 1, "PUBLIC_HEALTH_ADVISORY"),
        ]

        metrics = clf.fit(train_samples)
        assert metrics["vocabSize"] > 0
        assert metrics["categoriesTrained"] >= 4

        # Test predict on PR post
        res_pr = clf.predict("The commissioner chaired a meeting with officials to review progress")
        assert res_pr["is_noise"] is True
        assert res_pr["predicted_category"] == "GOVT_BUREAUCRATIC_PR"
        assert res_pr["confidence"] >= 0.5
        assert len(res_pr["top_signals"]) > 0

        # Test predict on Citizen post
        res_cit = clf.predict("Air quality is toxic and my eyes are burning in Lahore")
        assert res_cit["is_noise"] is False
        assert res_cit["predicted_category"] in ("CITIZEN_GROUND_TRUTH", "PUBLIC_HEALTH_ADVISORY")
        assert res_cit["confidence"] >= 0.5

    def test_serialization_roundtrip(self):
        clf = classifier.Tier1Classifier()
        samples = [
            ("Meeting chaired by secretary regarding protocol", 0, "GOVT_BUREAUCRATIC_PR"),
            ("Delegation called on minister today", 0, "GOVT_BUREAUCRATIC_PR"),
            ("Air quality index crossed 450 in Lahore", 1, "MEASUREMENT_AQI_DATA"),
            ("Severe smog warning issued for citizens", 1, "PUBLIC_HEALTH_ADVISORY"),
            ("Order air purifier with flat discount", 0, "COMMERCIAL_SPAM_AND_ADS"),
            ("Factory sealed by enforcement squad in Gujranwala", 1, "OFFICIAL_ENFORCEMENT"),
            ("Review meeting held regarding progress", 0, "GOVT_BUREAUCRATIC_PR"),
            ("Eyes burning due to smoke and haze", 1, "CITIZEN_GROUND_TRUTH"),
            ("Gadani ship breaking steel salvage", 0, "MARITIME_AND_SALVAGE"),
            ("Cricket match scheduled in Lahore stadium", 0, "SPORTS_AND_ENTERTAINMENT"),
        ]
        clf.fit(samples)
        serialized = clf.to_dict()

        restored = classifier.Tier1Classifier.from_dict(serialized)
        test_text = "Secretary chaired review meeting"
        assert clf.predict(test_text) == restored.predict(test_text)

    def test_get_classifier_status_structure(self, seeded_db):
        status = classifier.get_classifier_status()
        assert "isTrained" in status
        assert "isReadyToTrain" in status
        assert "availableSamples" in status
        assert status["availableSamples"] > 0

    def test_train_from_db_and_predict(self, seeded_db):
        res = classifier.train_classifier_from_db()
        assert res["success"] is True
        assert res["totalSamples"] > 50
        assert "metrics" in res
        assert os.path.exists(classifier.MODEL_FILE)

        status_after = classifier.get_classifier_status()
        assert status_after["isTrained"] is True
        assert status_after["modelInfo"] is not None

        # Predict using module level function
        pred = classifier.predict_text("Secretary chaired a meeting to discuss progress")
        assert pred["is_trained"] is True
        assert "predicted_category" in pred
        assert "confidence" in pred
        assert "top_signals" in pred
