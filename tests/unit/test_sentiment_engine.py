import pytest
from backend import sentiment_engine

class TestSentimentEngine:
    def test_vader_initialization(self):
        analyzer = sentiment_engine._get_vader_analyzer()
        assert analyzer is not None
        # Verify custom lexicon entries are present
        assert "tabahi" in analyzer.lexicon
        assert "zehrili" in analyzer.lexicon
        assert "alhamdulillah" in analyzer.lexicon
        assert analyzer.lexicon["tabahi"] < 0
        assert analyzer.lexicon["alhamdulillah"] > 0

    def test_english_critical_sentiment(self):
        text = "The air in Lahore is lethal and toxic! Smog is suffocating us, emergency disaster!"
        res = sentiment_engine.analyze_with_vader(text)
        assert res["sentiment"] == "Critical / Alarmed"
        assert res["emotion"] == "Outrage / Panic"
        assert res["sentiment_score"] <= -0.50
        assert res["sentiment_engine"] == "vader"
        assert 0.0 <= res["sentiment_confidence"] <= 1.0

    def test_english_positive_sentiment(self):
        text = "Clean air initiative in Punjab has brought relief. Fresh air and improved conditions, commendable progress!"
        res = sentiment_engine.analyze_with_vader(text)
        assert res["sentiment"] == "Positive / Solution-Oriented"
        assert res["emotion"] == "Constructive / Praise"
        assert res["sentiment_score"] >= 0.25

    def test_english_neutral_sentiment(self):
        text = "Lahore air quality index reported at 150 on Wednesday morning by the monitoring station."
        res = sentiment_engine.analyze_with_vader(text)
        assert res["sentiment"] in ("Informative / Neutral", "Concerned")
        assert -0.50 < res["sentiment_score"] < 0.25

    def test_roman_urdu_critical_sentiment(self):
        text = "Bohot tabahi ho chuki hai, zehrili hawa aur ghutan se saans lena mushkil ho gaya hai, azaab hai!"
        res = sentiment_engine.analyze_with_vader(text)
        assert res["sentiment"] == "Critical / Alarmed"
        assert res["sentiment_score"] < -0.30

    def test_roman_urdu_positive_sentiment(self):
        text = "Mashallah suthra punjab program se hawa behtar hui hai, shabash maryam nawaz!"
        res = sentiment_engine.analyze_with_vader(text)
        assert res["sentiment"] == "Positive / Solution-Oriented"
        assert res["sentiment_score"] > 0.20

    def test_urdu_script_sentiment(self):
        critical_urdu = "لاہور میں فضائی آلودگی خطرناک حد تک پہنچ چکی ہے اور دم گھٹ رہا ہے، شدید عذاب ہے۔"
        res = sentiment_engine.analyze_with_vader(critical_urdu)
        assert res["sentiment_score"] < 0

        positive_urdu = "شکر ہے حکومت کے اچھے اقدامات سے اب ہوا صاف اور بہتر ہو رہی ہے، شاباش۔"
        res_pos = sentiment_engine.analyze_with_vader(positive_urdu)
        assert res_pos["sentiment_score"] > 0

    @pytest.mark.parametrize("empty_input", ["", "   ", "\n\t", None])
    def test_empty_or_whitespace_input(self, empty_input):
        res = sentiment_engine.analyze_with_vader(empty_input)
        assert res["sentiment"] == "Informative / Neutral"
        assert res["sentiment_score"] == 0.0
        assert res["emotion"] == "Neutral / Reporting"
        assert res["sentiment_confidence"] == 0.5
        assert res["scores"]["compound"] == 0.0

    def test_numeric_and_special_character_input(self):
        res_nums = sentiment_engine.analyze_with_vader("12345 67890 2026")
        assert res_nums["sentiment_score"] == 0.0

        res_symbols = sentiment_engine.analyze_with_vader("!@#$%^&*() _+ - = [] {} ; :")
        assert res_symbols["sentiment_score"] == 0.0

    def test_very_long_text(self):
        repeated_text = "Smog crisis in Punjab " * 500
        res = sentiment_engine.analyze_with_vader(repeated_text)
        assert isinstance(res["sentiment_score"], float)
        assert res["sentiment"] in ("Critical / Alarmed", "Concerned")

    def test_transformer_availability_contract(self):
        available, msg = sentiment_engine.is_transformer_available()
        assert isinstance(available, bool)
        assert isinstance(msg, str)
        assert len(msg) > 0
