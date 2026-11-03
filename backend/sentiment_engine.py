import os
import sys
import re
import json
import ssl
from typing import Dict, Any, Optional, Tuple

try:
    ssl._create_default_https_context = ssl._create_unverified_context
except Exception:
    pass

_VADER_ANALYZER = None
_TRANSFORMER_PIPELINE = None
_TRANSFORMER_LOAD_FAILED = False
_TRANSFORMER_ERROR_MSG = ""

CUSTOM_EPA_REGIONAL_LEXICON = {
    "tabahi": -3.6,
    "barbaad": -3.5,
    "barbaadi": -3.5,
    "ghutan": -3.5,
    "dam": -3.0,
    "zehr": -3.6,
    "zehreela": -3.6,
    "zehrili": -3.6,
    "zehreeli": -3.6,
    "mushkil": -2.2,
    "qatal": -3.8,
    "qatl": -3.8,
    "lanat": -3.5,
    "sharam": -3.0,
    "sharmnak": -3.4,
    "sharm": -3.0,
    "zulm": -3.5,
    "nakam": -2.8,
    "nakami": -2.8,
    "badtreen": -3.7,
    "bebas": -3.0,
    "bebasi": -3.0,
    "azab": -3.7,
    "azaab": -3.7,
    "saans": -2.2,
    "dhund": -1.5,
    "andhera": -1.8,
    "dhuwan": -2.2,
    "kharab": -2.2,
    "pareshan": -2.4,
    "pareshani": -2.5,
    "bimar": -2.6,
    "beemar": -2.6,
    "bimari": -2.6,
    "khansi": -2.0,
    "dard": -2.3,
    "marr": -3.4,
    "maut": -3.6,
    "soyi": -2.0,
    "khamosh": -1.8,
    "na-ehel": -3.2,
    "naehal": -3.2,

    "تباہی": -3.6,
    "بربادی": -3.5,
    "گھٹن": -3.5,
    "زہریلی": -3.6,
    "زہر": -3.6,
    "عذاب": -3.7,
    "لعنت": -3.5,
    "شرمناک": -3.4,
    "بیمار": -2.6,
    "بیماری": -2.6,
    "دم": -3.0,
    "خطرناک": -3.3,
    "آلودہ": -2.5,
    "آلودگی": -2.2,
    "دھواں": -2.2,
    "پریشان": -2.4,
    "نااہل": -3.2,
    "ناکام": -2.8,
    "موت": -3.6,
    "بہتر": +2.4,
    "شاباش": +3.0,
    "شکر": +2.2,
    "صاف": +2.6,
    "اقدامات": +1.5,
    "کوشش": +1.5,

    "hazardous": -3.6,
    "toxic": -3.5,
    "unbreathable": -3.6,
    "suffocating": -3.5,
    "choking": -3.4,
    "poisonous": -3.5,
    "lethal": -3.7,
    "emergency": -2.8,
    "catastrophe": -3.6,
    "apocalypse": -3.8,
    "chamber": -3.2,
    "unhealthy": -2.5,
    "smog": -1.8,
    "smoggy": -1.8,
    "polluted": -2.2,
    "pollution": -2.0,
    "stubble": -1.5,
    "parali": -1.5,
    "crop-fire": -2.2,
    "infection": -2.4,
    "irritation": -2.2,
    "burning eyes": -2.8,
    "throat irritation": -2.6,
    "respiratory": -2.0,

    "alhamdulillah": +2.8,
    "mashallah": +2.8,
    "shukar": +2.2,
    "shabash": +3.0,
    "behtar": +2.4,
    "behtari": +2.5,
    "zabardast": +3.0,
    "taraqqi": +2.5,
    "safai": +2.5,
    "saaf": +2.6,
    "cleanest": +3.2,
    "cleaner": +2.4,
    "clean": +2.2,
    "clean air": +2.8,
    "fresh air": +3.0,
    "solution": +2.4,
    "solutions": +2.4,
    "progress": +2.6,
    "commendable": +2.8,
    "milestone": +2.6,
    "e-buses": +2.2,
    "electric buses": +2.2,
    "anti-smog": +1.8,
    "crackdown": +1.6,
    "artificial rain": +2.0,
    "cloud seeding": +2.0,
    "green lockdown": +1.6,
    "smog gun": +1.6,
    "suthra": +2.5,
    "initiative": +1.8,
    "relief": +2.5,
    "safe": +2.2,
    "protect": +2.0,
    "improving": +2.2,
    "improved": +2.4,

    "advisory": -0.5,
    "masks": -0.5,
    "mask": -0.5,
    "precaution": -0.5,
    "precautions": -0.5,
    "warning": -1.8,
    "stay safe": +1.5,
    "take care": +1.5,
    "stay home": -1.0
}

def _get_vader_analyzer():
    """Initializes and returns the VADER analyzer with EPA/Punjab regional additions."""
    global _VADER_ANALYZER
    if _VADER_ANALYZER is None:
        try:
            import nltk
            try:
                from nltk.sentiment.vader import SentimentIntensityAnalyzer
            except LookupError:
                nltk.download("vader_lexicon", quiet=True)
                from nltk.sentiment.vader import SentimentIntensityAnalyzer

            analyzer = SentimentIntensityAnalyzer()
            analyzer.lexicon.update(CUSTOM_EPA_REGIONAL_LEXICON)
            _VADER_ANALYZER = analyzer
        except Exception as e:
            print(f"[!] Warning: Failed to load VADER analyzer: {e}")
            return None
    return _VADER_ANALYZER

def _get_transformer_pipeline():
    """Lazily loads the CardiffNLP Twitter-RoBERTa sentiment pipeline."""
    global _TRANSFORMER_PIPELINE, _TRANSFORMER_LOAD_FAILED, _TRANSFORMER_ERROR_MSG
    if _TRANSFORMER_LOAD_FAILED:
        return None
    if _TRANSFORMER_PIPELINE is None:
        try:
            from transformers import pipeline as hf_pipeline
            model_id = "cardiffnlp/twitter-roberta-base-sentiment-latest"
            _TRANSFORMER_PIPELINE = hf_pipeline(
                "sentiment-analysis",
                model=model_id,
                tokenizer=model_id,
                top_k=None,
                truncation=True,
                max_length=512,
                device=-1
            )
        except Exception as e:
            _TRANSFORMER_LOAD_FAILED = True
            _TRANSFORMER_ERROR_MSG = str(e)
            print(f"[!] Warning: Could not initialize RoBERTa Transformer pipeline ({e}). Will fallback to VADER.")
            return None
    return _TRANSFORMER_PIPELINE

def is_transformer_available() -> Tuple[bool, str]:
    """Checks whether the transformer dependencies and pipeline can be loaded."""
    global _TRANSFORMER_LOAD_FAILED, _TRANSFORMER_ERROR_MSG
    if _TRANSFORMER_LOAD_FAILED:
        return False, _TRANSFORMER_ERROR_MSG
    try:
        import torch
        import transformers
        return True, "Transformers and PyTorch are installed and ready."
    except ImportError as e:
        return False, f"Missing dependencies: {e}"

def analyze_with_vader(text: str) -> Dict[str, Any]:
    """
    Analyzes text using VADER enriched with EPA / Roman Urdu / Urdu lexicon.
    Returns standardized sentiment dictionary with polarity [-1.0, 1.0].
    """
    analyzer = _get_vader_analyzer()
    clean_text = (text or "").strip()
    if not analyzer or not clean_text:
        return {
            "sentiment": "Informative / Neutral",
            "sentiment_score": 0.0,
            "sentiment_engine": "vader",
            "sentiment_confidence": 0.5,
            "emotion": "Neutral / Reporting",
            "scores": {"compound": 0.0, "neg": 0.0, "neu": 1.0, "pos": 0.0}
        }

    scores = analyzer.polarity_scores(clean_text)
    compound = float(scores["compound"])

    if compound <= -0.50:
        sentiment = "Critical / Alarmed"
        emotion = "Outrage / Panic"
    elif compound <= -0.15:
        sentiment = "Concerned"
        emotion = "High Concern"
    elif compound >= 0.25:
        sentiment = "Positive / Solution-Oriented"
        emotion = "Constructive / Praise"
    else:
        sentiment = "Informative / Neutral"
        emotion = "Neutral / Reporting"

    confidence = round(max(scores["neg"], scores["neu"], scores["pos"]), 3)

    return {
        "sentiment": sentiment,
        "sentiment_score": round(compound, 4),
        "sentiment_engine": "vader",
        "sentiment_confidence": confidence,
        "emotion": emotion,
        "scores": scores
    }

def analyze_with_transformer(text: str) -> Dict[str, Any]:
    """
    Analyzes text using local CardiffNLP Twitter-RoBERTa transformer.
    Returns standardized sentiment dictionary with polarity [-1.0, 1.0].
    """
    pipe = _get_transformer_pipeline()
    clean_text = (text or "").strip()

    if not pipe or not clean_text:
        res = analyze_with_vader(text)
        res["sentiment_engine"] = "vader (transformer fallback)"
        return res

    try:
        raw_results = pipe(clean_text, truncation=True, max_length=512)[0]
        score_map = {item["label"].lower(): float(item["score"]) for item in raw_results}

        p_neg = score_map.get("negative", 0.0)
        p_neu = score_map.get("neutral", 0.0)
        p_pos = score_map.get("positive", 0.0)

        polarity = p_pos - p_neg

        if p_neg >= 0.60 or polarity <= -0.45:
            sentiment = "Critical / Alarmed"
            emotion = "Outrage / Panic"
        elif p_neg >= 0.35 or polarity <= -0.15:
            sentiment = "Concerned"
            emotion = "High Concern"
        elif p_pos >= 0.40 or polarity >= 0.25:
            sentiment = "Positive / Solution-Oriented"
            emotion = "Constructive / Praise"
        else:
            sentiment = "Informative / Neutral"
            emotion = "Neutral / Reporting"

        confidence = round(max(p_neg, p_neu, p_pos), 3)

        return {
            "sentiment": sentiment,
            "sentiment_score": round(polarity, 4),
            "sentiment_engine": "transformer (roberta)",
            "sentiment_confidence": confidence,
            "emotion": emotion,
            "scores": score_map
        }
    except Exception as e:
        print(f"[!] RoBERTa inference exception ({e}), falling back to VADER.")
        res = analyze_with_vader(text)
        res["sentiment_engine"] = "vader (inference fallback)"
        return res

def analyze_text(text: str, engine: str = "vader") -> Dict[str, Any]:
    """Dispatches text analysis to the specified sentiment engine ('vader' or 'transformer')."""
    if str(engine).lower().strip() in ("transformer", "roberta", "local_transformer"):
        return analyze_with_transformer(text)
    return analyze_with_vader(text)

def analyze_batch(texts: list, engine: str = "vader", batch_size: int = 32) -> list:
    """Batch-analyzes a list of text strings with high throughput."""
    engine_clean = str(engine).lower().strip()
    if engine_clean in ("transformer", "roberta", "local_transformer"):
        pipe = _get_transformer_pipeline()
        if not pipe:
            return [analyze_with_vader(t) for t in texts]

        results = []
        truncated_texts = [(t or "")[:512] for t in texts]
        for i in range(0, len(truncated_texts), batch_size):
            chunk = truncated_texts[i:i + batch_size]
            try:
                raw_chunk = pipe(chunk, truncation=True, max_length=512)
                for item_results in raw_chunk:
                    score_map = {item["label"].lower(): float(item["score"]) for item in item_results}
                    p_neg = score_map.get("negative", 0.0)
                    p_neu = score_map.get("neutral", 0.0)
                    p_pos = score_map.get("positive", 0.0)
                    polarity = p_pos - p_neg

                    if p_neg >= 0.60 or polarity <= -0.45:
                        sentiment = "Critical / Alarmed"
                        emotion = "Outrage / Panic"
                    elif p_neg >= 0.35 or polarity <= -0.15:
                        sentiment = "Concerned"
                        emotion = "High Concern"
                    elif p_pos >= 0.40 or polarity >= 0.25:
                        sentiment = "Positive / Solution-Oriented"
                        emotion = "Constructive / Praise"
                    else:
                        sentiment = "Informative / Neutral"
                        emotion = "Neutral / Reporting"

                    results.append({
                        "sentiment": sentiment,
                        "sentiment_score": round(polarity, 4),
                        "sentiment_engine": "transformer (roberta)",
                        "sentiment_confidence": round(max(p_neg, p_neu, p_pos), 3),
                        "emotion": emotion,
                        "scores": score_map
                    })
            except Exception as e:
                for t in chunk:
                    results.append(analyze_with_transformer(t))
        return results
    else:
        return [analyze_with_vader(t) for t in texts]
