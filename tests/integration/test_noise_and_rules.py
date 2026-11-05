import pytest
from backend import service, database

class TestNoiseAndRulesIntegration:
    def test_complete_noise_curation_lifecycle(self, seeded_db):
        # 1. Start with an existing verified post in the seeded DB
        active_posts = database.get_all_posts()
        target_post = active_posts[0]
        target_id = target_post["id"]
        target_text = target_post["text"]
        target_author = target_post["authorUsername"]

        # 2. Exclude post to noise pool
        exc_res = service.exclude_post_service(
            post_id=target_id,
            reason="Operator determined post was out of scope",
            category="MANUAL_EXCLUDED",
            remove_associated_rules=True
        )
        assert exc_res["success"] is True

        # Check post is removed from verified clean posts
        needle = " ".join(target_text.split()[:6])
        current_active = database.get_all_posts(search=needle)
        assert not any(p["id"] == target_id for p in current_active)

        # Check post is in noise posts
        noise_posts = database.get_noise_posts()
        noise_entry = next((n for n in noise_posts if n["id"] == target_id), None)
        assert noise_entry is not None
        assert noise_entry["status"] == "EXCLUDED"

        # 3. Extract candidate rules from the excluded post
        candidates = service.extract_candidates_service(
            post_id=target_id,
            text=target_text,
            author=target_author,
            category="MANUAL_EXCLUDED",
            reason="Operator determined post was out of scope"
        )
        assert isinstance(candidates, list)
        assert len(candidates) > 0
        # Author candidate should be proposed
        assert any(c["rule_type"] == "author_whitelist" for c in candidates)

        # 4. Add a learned rule
        new_rule_res = service.add_learned_rule_service(
            rule_type="author_whitelist",
            rule_value=target_author,
            description=f"Auto-learned trust rule for @{target_author}"
        )
        assert new_rule_res["ruleValue"] == target_author
        assert new_rule_res["isActive"] is True
        rule_id = new_rule_res["id"]

        # Verify active rules in database includes the new rule
        active_rules = database.get_active_learned_rules()
        assert target_author.lower() in [a.lower() for a in active_rules["author_whitelist"]]

        # 5. Restore the excluded post back to feed
        restore_res = service.restore_noise_post_service(
            post_id=target_id,
            learned_rules=[{"rule_type": "author_whitelist", "rule_value": target_author}]
        )
        assert restore_res["success"] is True

        # Verify post is back in verified posts
        restored_active = database.get_all_posts(search=needle)
        assert any(p["id"] == target_id for p in restored_active)

        # 6. Toggle and delete learned rule
        toggle_res = service.toggle_learned_rule_service(rule_id, is_active=False)
        assert toggle_res["isActive"] is False

        del_res = service.delete_learned_rule_service(rule_id)
        assert del_res["success"] is True
        assert not any(r["id"] == rule_id for r in database.get_learned_rules())
