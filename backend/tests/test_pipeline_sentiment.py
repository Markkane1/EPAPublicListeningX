import unittest
import sys
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import pipeline


class TestPipelineSentiment(unittest.TestCase):

    def test_pipeline_enrichment(self):
        from backend import database
        database.save_settings({"sentiment_engine": "vader"})

        sample_posts = [
            {
                "id": "test_101",
                "text": "Lahore smog is toxic and choking us, complete tabahi emergency!",
                "author_username": "citizen_test",
                "author_name": "Lahore Citizen",
                "created_at": "2026-11-05T10:00:00Z",
                "likes": 10, "retweets": 2, "replies": 1
            },
            {
                "id": "test_102",
                "text": "EPA artificial rain and anti-smog crackdown is showing good progress, shabash in Lahore!",
                "author_username": "clean_air_punjab",
                "author_name": "Clean Air Supporter",
                "created_at": "2026-11-05T10:05:00Z",
                "likes": 25, "retweets": 5, "replies": 2
            }
        ]

        valid_posts, audit, noise = pipeline.process_dataset(sample_posts)
        self.assertEqual(len(valid_posts), 2)
        p1 = valid_posts[0]
        p2 = valid_posts[1]

        self.assertEqual(p1["sentiment"], "Critical / Alarmed")
        self.assertLessEqual(p1["sentiment_score"], -0.50)
        self.assertEqual(p1["sentiment_engine"], "vader")

        self.assertEqual(p2["sentiment"], "Positive / Solution-Oriented")
        self.assertGreaterEqual(p2["sentiment_score"], 0.25)
        self.assertEqual(p2["sentiment_engine"], "vader")


if __name__ == "__main__":
    unittest.main()
