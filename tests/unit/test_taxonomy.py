import pytest
from backend import taxonomy

class TestTaxonomy:
    def test_all_16_noise_categories_exist(self):
        expected_noise_codes = {
            "GOVT_BUREAUCRATIC_PR",
            "FOREIGN_AGENCY_DOMESTIC",
            "INDIAN_DOMESTIC_GOVERNANCE",
            "GURMUKHI_SCRIPT_DOMESTIC",
            "INDIAN_FIRECRACKER_DEBATES",
            "INDIAN_WATER_DISPUTES",
            "METAPHORICAL_OR_SARCASTIC",
            "BENIGN_WEATHER_FOG",
            "SPORTS_AND_ENTERTAINMENT",
            "COMMERCIAL_SPAM_AND_ADS",
            "LIFESTYLE_AND_FOOD",
            "MARITIME_AND_SALVAGE",
            "ONLINE_TROLLING_AND_FLAME_WARS",
            "UNRELATED_GEOPOLITICS",
            "NO_AIR_QUALITY_RELEVANCE",
            "NO_GEOGRAPHIC_RELEVANCE",
        }
        actual_codes = set(taxonomy.NOISE_TAXONOMY.keys())
        assert actual_codes == expected_noise_codes
        assert len(actual_codes) == 16

    def test_all_6_relevant_categories_exist(self):
        expected_relevant_codes = {
            "CITIZEN_GROUND_TRUTH",
            "OFFICIAL_ENFORCEMENT",
            "MEASUREMENT_AQI_DATA",
            "PUBLIC_HEALTH_ADVISORY",
            "AGRICULTURAL_STUBBLE_BURNING",
            "CROSS_BORDER_INSIGHT",
        }
        actual_codes = set(taxonomy.RELEVANT_TAXONOMY.keys())
        assert actual_codes == expected_relevant_codes
        assert len(actual_codes) == 6

    def test_taxonomy_fields_completeness(self):
        for code, info in taxonomy.NOISE_TAXONOMY.items():
            assert "label" in info and len(info["label"]) > 0
            assert "description" in info and len(info["description"]) > 0
            assert "group" in info and len(info["group"]) > 0
            assert "icon" in info and len(info["icon"]) > 0

        for code, info in taxonomy.RELEVANT_TAXONOMY.items():
            assert "label" in info and len(info["label"]) > 0
            assert "description" in info and len(info["description"]) > 0
            assert "icon" in info and len(info["icon"]) > 0

    def test_legacy_category_normalization(self):
        assert taxonomy.normalize_noise_category("OFF_TOPIC") == "SPORTS_AND_ENTERTAINMENT"
        assert taxonomy.normalize_noise_category("EXCLUDED_INDIAN_CONTEXT") == "FOREIGN_AGENCY_DOMESTIC"
        assert taxonomy.normalize_noise_category("EXCLUDED_ACCOUNT") == "GOVT_BUREAUCRATIC_PR"
        assert taxonomy.normalize_noise_category("MANUAL_EXCLUDED") == "GOVT_BUREAUCRATIC_PR"
        assert taxonomy.normalize_noise_category("NO_AIR_QUALITY_RELEVANCE") == "NO_AIR_QUALITY_RELEVANCE"

        assert taxonomy.normalize_relevant_category("Citizen Outcry & Reaction") == "CITIZEN_GROUND_TRUTH"
        assert taxonomy.normalize_relevant_category("Government & Enforcement Action") == "OFFICIAL_ENFORCEMENT"
        assert taxonomy.normalize_relevant_category("AQI Measurement & Satellite Data") == "MEASUREMENT_AQI_DATA"

    def test_taxonomy_dto_structure(self):
        dto = taxonomy.get_taxonomy_dto()
        assert "noiseCategories" in dto
        assert "noiseGroups" in dto
        assert "relevantCategories" in dto
        assert len(dto["noiseCategories"]) == 16
        assert len(dto["relevantCategories"]) == 6
        assert len(dto["noiseGroups"]) == 5
