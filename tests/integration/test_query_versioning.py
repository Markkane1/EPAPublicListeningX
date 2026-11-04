import pytest
from backend import service, database

class TestQueryVersioningIntegration:
    def test_query_version_lifecycle_and_settings_sync(self, temp_db):
        # 1. Retrieve initial versions
        initial_versions = service.get_query_versions_service()
        assert len(initial_versions) >= 3
        baseline_id = next(q["id"] for q in initial_versions if q["isActive"])

        # 2. Create new query version
        new_version_data = {
            "versionTag": "v2.0-test",
            "title": "Industrial Air Quality Surveillance Query",
            "queryText": '(AQI OR smog OR industrial) (Lahore OR Gujranwala) -Delhi lang:en',
            "description": "Integration test custom query version",
            "setActive": False
        }
        created = service.save_query_version_service(new_version_data)
        assert created["versionTag"] == "v2.0-test"
        assert created["isActive"] is False
        new_qid = created["id"]

        # 3. Activate the new version
        act_res = service.activate_query_version_service(new_qid)
        assert act_res["success"] is True

        # Verify active version in DB
        active = service.get_active_query_service()
        assert active["id"] == new_qid
        assert active["queryText"] == new_version_data["queryText"]

        # Verify settings synchronized
        settings = database.get_settings()
        assert settings["default_query"] == new_version_data["queryText"]

        # 4. Update query version
        updated = service.update_query_version_service({
            "id": new_qid,
            "title": "Updated Industrial Air Quality Query",
            "queryText": '(AQI OR smog OR industrial OR brick) (Lahore OR Gujranwala) -Delhi lang:en'
        })
        assert updated["title"] == "Updated Industrial Air Quality Query"
        assert "brick" in updated["queryText"]

        # 5. Active query deletion blocked
        with pytest.raises(ValueError, match="currently active"):
            service.delete_query_version_service(new_qid)

        # 6. Reactivate baseline version, then delete custom version
        service.activate_query_version_service(baseline_id)
        del_res = service.delete_query_version_service(new_qid)
        assert del_res["success"] is True

        versions_after = service.get_query_versions_service()
        assert not any(q["id"] == new_qid for q in versions_after)

    def test_empty_query_rejected(self, temp_db):
        with pytest.raises(ValueError, match="cannot be empty"):
            service.save_query_version_service({
                "versionTag": "v_bad",
                "title": "Bad Query",
                "queryText": "   "
            })
