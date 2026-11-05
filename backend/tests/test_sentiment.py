import unittest
import sys
import os

# Ensure backend package is in path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend import sentiment_engine


class TestSentimentEngine(unittest.TestCase):

    def test_status_and_lexicon(self):
        status = sentiment_engine.get_sentiment_status()
        self.assertTrue(status["vaderAvailable"])
        self.assertGreater(status["lexiconSize"], 7000)
        self.assertGreater(status["regionalTermsCount"], 100)

    def test_critical_alarmed_english(self):
        text = "Lahore smog is toxic emergency, kids are choking and suffocating in this gas chamber!"
        res = sentiment_engine.analyze_with_vader(text)
        self.assertEqual(res["sentiment"], "Critical / Alarmed")
        self.assertLessEqual(res["sentiment_score"], -0.50)
        self.assertEqual(res["emotion"], "Outrage / Panic")

    def test_critical_alarmed_roman_urdu(self):
        text = "Lahore me boht shadeed dhuan hai, haalat azaab aur tabahi ban chuki hai, saans lena zehr hai"
        res = sentiment_engine.analyze_with_vader(text)
        self.assertEqual(res["sentiment"], "Critical / Alarmed")
        self.assertLessEqual(res["sentiment_score"], -0.50)
        self.assertEqual(res["emotion"], "Outrage / Panic")

    def test_critical_alarmed_urdu_script(self):
        text = "لاہور میں شدید دھواں اور زہریلی فضا، سانس لینا عذاب بن گیا"
        res = sentiment_engine.analyze_with_vader(text)
        self.assertEqual(res["sentiment"], "Critical / Alarmed")
        self.assertLessEqual(res["sentiment_score"], -0.50)

    def test_positive_solution_oriented(self):
        text = "EPA anti-smog crackdown and electric buses are commendable progress, clean air initiative shabash!"
        res = sentiment_engine.analyze_with_vader(text)
        self.assertEqual(res["sentiment"], "Positive / Solution-Oriented")
        self.assertGreaterEqual(res["sentiment_score"], 0.25)
        self.assertEqual(res["emotion"], "Constructive / Praise")

    def test_concerned_advisory(self):
        text = "Traffic is slow due to mild smog and dust"
        res = sentiment_engine.analyze_with_vader(text)
        self.assertEqual(res["sentiment"], "Concerned")
        self.assertLessEqual(res["sentiment_score"], -0.15)
        self.assertGreater(res["sentiment_score"], -0.50)
        self.assertEqual(res["emotion"], "High Concern")

    def test_informative_neutral(self):
        text = "Punjab EPA published the weekly ambient air monitoring report for Lahore district on Wednesday."
        res = sentiment_engine.analyze_with_vader(text)
        self.assertEqual(res["sentiment"], "Informative / Neutral")
        self.assertEqual(res["emotion"], "Neutral / Reporting")

    def test_batch_analysis(self):
        texts = [
            "Lahore smog is toxic and lethal",
            "Great work by EPA on clean air progress",
            "Air quality index reported at 210"
        ]
        results = sentiment_engine.analyze_batch(texts, engine="vader")
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]["sentiment"], "Critical / Alarmed")
        self.assertEqual(results[1]["sentiment"], "Positive / Solution-Oriented")
        self.assertEqual(results[2]["sentiment"], "Informative / Neutral")

    def test_standalone_without_nltk(self):
        """Simulate an environment where NLTK is completely absent."""
        standalone = sentiment_engine.StandaloneVaderAnalyzer()
        self.assertGreater(len(standalone.lexicon), 7000)
        scores = standalone.polarity_scores("Lahore smog is toxic zehreela emergency")
        self.assertLess(scores["compound"], -0.5)
        self.assertGreater(scores["neg"], 0.5)


if __name__ == "__main__":
    unittest.main()
