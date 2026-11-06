import unittest
from backend import database
from backend import service


class TestAuthGating(unittest.TestCase):
    def setUp(self):
        database.init_db()

    def test_missing_token_rejected_on_protected_endpoints(self):
        # Verify that get_db_stats or service level auth checks work
        # and invalid token raises ValueError
        with self.assertRaises(ValueError):
            service.auth_me_service("invalid-nonexistent-token-12345")

    def test_unauthenticated_session_cannot_access_profile(self):
        with self.assertRaises(ValueError):
            service.auth_me_service("")


if __name__ == '__main__':
    unittest.main()
