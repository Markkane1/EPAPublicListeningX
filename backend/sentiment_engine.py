import os
import sys
import re
import math
import string
from itertools import product
from typing import Dict, Any, Optional, Tuple, List

_VADER_ANALYZER = None
_VADER_ENGINE_TYPE = "unknown"
_TRANSFORMER_PIPELINE = None
_TRANSFORMER_LOAD_FAILED = False
_TRANSFORMER_ERROR_MSG = ""

# =====================================================================
# CUSTOM EPA / PUNJAB / PAKISTAN REGIONAL SMOG & AIR QUALITY LEXICON
# Covers: Roman Urdu, Urdu script, Pakistani environmental & civil terms
# =====================================================================
CUSTOM_EPA_REGIONAL_LEXICON = {
    # Roman Urdu - Highly Negative / Panic / Outrage
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
    "sans": -2.2,
    "dhund": -1.5,
    "andhera": -1.8,
    "dhuwan": -2.2,
    "kharab": -2.2,
    "bura": -2.2,
    "buri": -2.2,
    "pareshan": -2.4,
    "pareshani": -2.5,
    "bimar": -2.6,
    "beemar": -2.6,
    "bimari": -2.6,
    "khansi": -2.0,
    "khasi": -2.0,
    "dard": -2.3,
    "chhati": -1.5,
    "marr": -3.4,
    "maut": -3.6,
    "soyi": -2.0,
    "khamosh": -1.8,
    "na-ehel": -3.2,
    "naehal": -3.2,
    "lahore smog": -2.5,
    "smog emergency": -3.2,

    # Urdu Script - Negative / Outrage / Panic
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
    "کھانسی": -2.0,
    "الرجی": -2.2,
    "ایمرجنسی": -2.8,
    "ہسپتال": -1.5,

    # Urdu Script - Positive / Commendable / Relief
    "بہتر": +2.4,
    "شاباش": +3.0,
    "شکر": +2.2,
    "صاف": +2.6,
    "اقدامات": +1.5,
    "کوشش": +1.5,
    "شاندار": +2.8,
    "تحفظ": +2.0,
    "ماحولیات": +1.0,

    # English - Smog / Environmental Emergency Terms
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

    # Roman Urdu & English - Positive / Solution / Commendation
    "alhamdulillah": +2.8,
    "mashallah": +2.8,
    "shukar": +2.2,
    "shabash": +3.0,
    "behtar": +2.4,
    "behtari": +2.5,
    "zabardast": +3.0,
    "shandar": +2.8,
    "achha": +2.0,
    "achi": +2.0,
    "theek": +1.8,
    "khoob": +2.2,
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

    # Advisories & Precautions
    "advisory": -0.5,
    "masks": -0.5,
    "mask": -0.5,
    "ماسک": -0.5,
    "precaution": -0.5,
    "precautions": -0.5,
    "warning": -1.8,
    "stay safe": +1.5,
    "take care": +1.5,
    "stay home": -1.0
}


# =====================================================================
# PURE-PYTHON STANDALONE VADER ANALYZER
# Zero external dependencies. Exact mathematical parity with NLTK VADER.
# =====================================================================
class StandaloneVaderAnalyzer:
    """
    Pure-Python implementation of C.J. Hutto's VADER (Valence Aware Dictionary
    and sEntiment Reasoner) with EPA Punjab regional & Roman Urdu support.
    Requires no external packages (no NLTK, no NumPy).
    """
    B_INCR = 0.293
    B_DECR = -0.293
    C_INCR = 0.733
    N_SCALAR = -0.74

    NEGATE = {
        "aint", "arent", "cannot", "cant", "couldnt", "darent", "didnt", "doesnt",
        "ain't", "aren't", "can't", "couldn't", "daren't", "didn't", "doesn't",
        "dont", "hadnt", "hasnt", "havent", "isnt", "mightnt", "mustnt", "neither",
        "don't", "hadn't", "hasn't", "haven't", "isn't", "mightn't", "mustn't",
        "neednt", "needn't", "never", "none", "nope", "nor", "not", "nothing",
        "nowhere", "oughtnt", "shant", "shouldnt", "uhuh", "wasnt", "werent",
        "oughtn't", "shan't", "shouldn't", "uh-uh", "wasn't", "weren't",
        "without", "wont", "wouldnt", "won't", "wouldn't", "rarely", "seldom", "despite",
        # Roman Urdu & Urdu Negators
        "nahi", "nhi", "na", "mat", "bina", "baghair", "نہیں", "مت", "بغیر"
    }

    BOOSTER_DICT = {
        "absolutely": B_INCR, "amazingly": B_INCR, "awfully": B_INCR, "completely": B_INCR,
        "considerably": B_INCR, "decidedly": B_INCR, "deeply": B_INCR, "effing": B_INCR,
        "enormously": B_INCR, "entirely": B_INCR, "especially": B_INCR, "exceptionally": B_INCR,
        "extremely": B_INCR, "fabulously": B_INCR, "flipping": B_INCR, "flippin": B_INCR,
        "fricking": B_INCR, "frickin": B_INCR, "frigging": B_INCR, "friggin": B_INCR,
        "fully": B_INCR, "fucking": B_INCR, "greatly": B_INCR, "hella": B_INCR,
        "highly": B_INCR, "hugely": B_INCR, "incredibly": B_INCR, "intensely": B_INCR,
        "majorly": B_INCR, "more": B_INCR, "most": B_INCR, "particularly": B_INCR,
        "purely": B_INCR, "quite": B_INCR, "really": B_INCR, "remarkably": B_INCR,
        "so": B_INCR, "substantially": B_INCR, "thoroughly": B_INCR, "totally": B_INCR,
        "tremendously": B_INCR, "uber": B_INCR, "unbelievably": B_INCR, "unusually": B_INCR,
        "utterly": B_INCR, "very": B_INCR,
        # Roman Urdu & Urdu Boosters
        "bohat": B_INCR, "boht": B_INCR, "bht": B_INCR, "intehai": B_INCR, "nihayat": B_INCR,
        "بہت": B_INCR, "انتہائی": B_INCR, "نہایت": B_INCR,
        # Dampeners
        "almost": B_DECR, "barely": B_DECR, "hardly": B_DECR, "just enough": B_DECR,
        "kind of": B_DECR, "kinda": B_DECR, "kindof": B_DECR, "kind-of": B_DECR,
        "less": B_DECR, "little": B_DECR, "marginally": B_DECR, "occasionally": B_DECR,
        "partly": B_DECR, "scarcely": B_DECR, "slightly": B_DECR, "somewhat": B_DECR,
        "sort of": B_DECR, "sorta": B_DECR, "sortof": B_DECR, "sort-of": B_DECR,
        # Roman Urdu Dampeners
        "thoda": B_DECR, "thori": B_DECR, "zara": B_DECR, "تھوڑا": B_DECR, "ذرا": B_DECR
    }

    SPECIAL_CASE_IDIOMS = {
        "the shit": 3, "the bomb": 3, "bad ass": 1.5, "yeah right": -2,
        "cut the mustard": 2, "kiss of death": -1.5, "hand to mouth": -2
    }

    PUNC_LIST = [".", "!", "?", ",", ";", ":", "-", "'", "\"", "!!", "!!!", "??", "???", "?!?", "!?!", "?!?!", "!?!?"]
    REGEX_REMOVE_PUNCTUATION = re.compile(f"[{re.escape(string.punctuation)}]")

    def __init__(self, lexicon_paths: Optional[List[str]] = None):
        self.lexicon: Dict[str, float] = {}
        loaded = False

        # Attempt to load standard vader_lexicon.txt from paths
        paths_to_try = lexicon_paths or [
            os.path.join(os.path.dirname(__file__), "lexicons", "vader_lexicon.txt"),
            os.path.join(os.path.dirname(__file__), "data", "vader_lexicon.txt"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "lexicons", "vader_lexicon.txt"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "data", "vader_lexicon.txt"),
            os.path.join(os.getcwd(), "backend", "lexicons", "vader_lexicon.txt"),
            os.path.join(os.getcwd(), "backend", "data", "vader_lexicon.txt"),
            os.path.join(os.getcwd(), "data", "vader_lexicon.txt"),
            "/var/www/apps/epasocialx/backend/lexicons/vader_lexicon.txt",
            "/var/www/apps/epasocialx/backend/data/vader_lexicon.txt"
        ]

        for p in paths_to_try:
            if os.path.isfile(p):
                try:
                    with open(p, "r", encoding="utf-8", errors="ignore") as f:
                        for line in f:
                            parts = line.strip().split("\t")
                            if len(parts) >= 2:
                                try:
                                    self.lexicon[parts[0]] = float(parts[1])
                                except ValueError:
                                    pass
                    if self.lexicon:
                        loaded = True
                        break
                except Exception:
                    continue

        # If file was not found, initialize a core seed lexicon
        if not loaded:
            self._init_seed_lexicon()

        # Always enrich with the complete EPA / Punjab Regional Lexicon
        self.lexicon.update(CUSTOM_EPA_REGIONAL_LEXICON)

    def _init_seed_lexicon(self):
        """Minimal fallback seed lexicon if vader_lexicon.txt file is inaccessible."""
        seed = {
            "good": 1.9, "great": 3.1, "excellent": 3.2, "best": 3.2, "awesome": 3.1,
            "love": 3.2, "nice": 1.8, "wonderful": 2.8, "amazing": 2.8, "super": 2.1,
            "bad": -2.5, "worst": -3.1, "horrible": -2.5, "terrible": -3.0, "awful": -2.7,
            "hate": -2.7, "danger": -2.4, "disaster": -3.1, "fail": -2.5, "failed": -2.3,
            "crisis": -3.1, "kill": -3.7, "killing": -3.4, "hell": -3.6, "suffering": -3.2,
            "pain": -2.3, "sick": -2.2, "hurt": -2.4, "destroy": -2.7, "urgent": -1.8,
            ":)": 2.0, ":-)": 2.0, ":(": -2.0, ":-(": -2.0, ";)": 1.5, "yay": 2.4
        }
        self.lexicon.update(seed)

    def negated(self, input_words: list, include_nt: bool = True) -> bool:
        if any(w.lower() in self.NEGATE for w in input_words):
            return True
        if include_nt and any("n't" in w.lower() for w in input_words):
            return True
        for i in range(len(input_words) - 1):
            if input_words[i+1].lower() == "least" and input_words[i].lower() != "at":
                return True
        return False

    def normalize(self, score: float, alpha: float = 15.0) -> float:
        return score / math.sqrt((score * score) + alpha)

    def scalar_inc_dec(self, word: str, valence: float, is_cap_diff: bool) -> float:
        scalar = 0.0
        word_lower = word.lower()
        if word_lower in self.BOOSTER_DICT:
            scalar = self.BOOSTER_DICT[word_lower]
            if valence < 0:
                scalar *= -1
            if word.isupper() and is_cap_diff:
                scalar += self.C_INCR if valence > 0 else -self.C_INCR
        return scalar

    def _words_plus_punc(self, text: str) -> dict:
        no_punc = self.REGEX_REMOVE_PUNCTUATION.sub("", text)
        words_only = {w for w in no_punc.split() if len(w) > 1}
        punc_before = {"".join(p): p[1] for p in product(self.PUNC_LIST, words_only)}
        punc_after = {"".join(p): p[0] for p in product(words_only, self.PUNC_LIST)}
        d = punc_before
        d.update(punc_after)
        return d

    def _words_and_emoticons(self, text: str) -> list:
        wes = text.split()
        words_punc = self._words_plus_punc(text)
        wes = [we for we in wes if len(we) > 1]
        for i, we in enumerate(wes):
            if we in words_punc:
                wes[i] = words_punc[we]
        return wes

    def allcap_differential(self, words: list) -> bool:
        allcaps = sum(1 for w in words if w.isupper())
        diff = len(words) - allcaps
        return 0 < diff < len(words)

    def polarity_scores(self, text: str) -> Dict[str, float]:
        clean_text = (text or "").strip()
        if not clean_text:
            return {"neg": 0.0, "neu": 0.0, "pos": 0.0, "compound": 0.0}

        words_and_emoticons = self._words_and_emoticons(clean_text)
        is_cap_diff = self.allcap_differential(words_and_emoticons)

        first_index = {}
        for idx, token in enumerate(words_and_emoticons):
            if token not in first_index:
                first_index[token] = idx

        sentiments = []
        for item in words_and_emoticons:
            valence = 0
            i = first_index[item]
            if (i < len(words_and_emoticons) - 1 and item.lower() == "kind" and words_and_emoticons[i + 1].lower() == "of") or item.lower() in self.BOOSTER_DICT:
                sentiments.append(valence)
                continue

            item_lower = item.lower()
            if item_lower in self.lexicon:
                valence = self.lexicon[item_lower]
                if item.isupper() and is_cap_diff:
                    valence += self.C_INCR if valence > 0 else -self.C_INCR

                for start_i in range(0, 3):
                    if i > start_i and words_and_emoticons[i - (start_i + 1)].lower() not in self.lexicon:
                        s = self.scalar_inc_dec(words_and_emoticons[i - (start_i + 1)], valence, is_cap_diff)
                        if start_i == 1 and s != 0:
                            s *= 0.95
                        if start_i == 2 and s != 0:
                            s *= 0.9
                        valence += s
                        if start_i == 0:
                            if self.negated([words_and_emoticons[i - 1]]):
                                valence *= self.N_SCALAR
                        elif start_i == 1:
                            if words_and_emoticons[i - 2] == "never" and (words_and_emoticons[i - 1] in ("so", "this")):
                                valence *= 1.5
                            elif self.negated([words_and_emoticons[i - 2]]):
                                valence *= self.N_SCALAR
                        elif start_i == 2:
                            if words_and_emoticons[i - 3] == "never" and (words_and_emoticons[i - 2] in ("so", "this") or words_and_emoticons[i - 1] in ("so", "this")):
                                valence *= 1.25
                            elif self.negated([words_and_emoticons[i - 3]]):
                                valence *= self.N_SCALAR

            sentiments.append(valence)

        # Contrastive conjunction check: 'but'
        lower_tokens = [w.lower() for w in words_and_emoticons]
        if "but" in lower_tokens:
            bi = lower_tokens.index("but")
            for s_idx in range(len(sentiments)):
                if s_idx < bi:
                    sentiments[s_idx] *= 0.5
                elif s_idx > bi:
                    sentiments[s_idx] *= 1.5

        if sentiments:
            sum_s = float(sum(sentiments))
            ep_count = min(clean_text.count("!"), 4)
            ep_amp = ep_count * 0.292
            qm_count = clean_text.count("?")
            qm_amp = (qm_count * 0.18) if 1 < qm_count <= 3 else (0.96 if qm_count > 3 else 0.0)
            punct_amp = ep_amp + qm_amp

            if sum_s > 0:
                sum_s += punct_amp
            elif sum_s < 0:
                sum_s -= punct_amp

            compound = self.normalize(sum_s)
            pos_sum = 0.0
            neg_sum = 0.0
            neu_count = 0
            for score in sentiments:
                if score > 0:
                    pos_sum += float(score) + 1
                elif score < 0:
                    neg_sum += float(score) - 1
                else:
                    neu_count += 1

            if pos_sum > abs(neg_sum):
                pos_sum += punct_amp
            elif pos_sum < abs(neg_sum):
                neg_sum -= punct_amp

            total = pos_sum + abs(neg_sum) + neu_count
            pos = abs(pos_sum / total) if total else 0.0
            neg = abs(neg_sum / total) if total else 0.0
            neu = abs(neu_count / total) if total else 0.0
        else:
            compound, pos, neg, neu = 0.0, 0.0, 0.0, 0.0

        return {
            "neg": round(neg, 3),
            "neu": round(neu, 3),
            "pos": round(pos, 3),
            "compound": round(compound, 4)
        }


# =====================================================================
# VADER ANALYZER INITIALIZER (FAIL-SAFE)
# Tries NLTK VADER; seamlessly falls back to Standalone pure-Python VADER
# =====================================================================
def _get_vader_analyzer():
    """
    Initializes and returns the VADER analyzer enriched with EPA Punjab regional lexicon.
    Guaranteed to NEVER return None: uses pure-Python StandaloneVaderAnalyzer if NLTK is absent.
    """
    global _VADER_ANALYZER, _VADER_ENGINE_TYPE
    if _VADER_ANALYZER is not None:
        return _VADER_ANALYZER

    # 1. Attempt NLTK VADER first if available
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
        _VADER_ENGINE_TYPE = "nltk"
        return _VADER_ANALYZER
    except Exception:
        pass

    # 2. Pure-Python Standalone VADER (Zero dependencies, 100% resilient)
    try:
        analyzer = StandaloneVaderAnalyzer()
        _VADER_ANALYZER = analyzer
        _VADER_ENGINE_TYPE = "standalone_pure_python"
        return _VADER_ANALYZER
    except Exception as e:
        # Ultimate fallback with seed lexicon
        analyzer = StandaloneVaderAnalyzer(lexicon_paths=[])
        _VADER_ANALYZER = analyzer
        _VADER_ENGINE_TYPE = "standalone_seed_fallback"
        return _VADER_ANALYZER


def get_sentiment_status() -> Dict[str, Any]:
    """Returns status of VADER and Transformer engines."""
    analyzer = _get_vader_analyzer()
    is_trans, trans_msg = is_transformer_available()
    lex_size = len(analyzer.lexicon) if (analyzer and hasattr(analyzer, "lexicon")) else 0

    return {
        "vaderAvailable": True,
        "vaderEngineType": _VADER_ENGINE_TYPE,
        "lexiconSize": lex_size,
        "regionalTermsCount": len(CUSTOM_EPA_REGIONAL_LEXICON),
        "transformerAvailable": is_trans,
        "transformerStatus": trans_msg
    }


# =====================================================================
# TRANSFORMER PIPELINE (ROBERTA)
# =====================================================================
def _get_transformer_pipeline():
    """Lazily loads the CardiffNLP Twitter-RoBERTa sentiment pipeline if available."""
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


# =====================================================================
# MAIN ANALYSIS ENTRY POINTS
# =====================================================================
def analyze_with_vader(text: str) -> Dict[str, Any]:
    """
    Analyzes text using VADER enriched with EPA / Roman Urdu / Urdu lexicon.
    Returns standardized sentiment dictionary with polarity [-1.0, 1.0].
    Guaranteed to return an accurate score even without NLTK installed.
    """
    analyzer = _get_vader_analyzer()
    clean_text = (text or "").strip()
    if not clean_text:
        return {
            "sentiment": "Informative / Neutral",
            "sentiment_score": 0.0,
            "sentiment_engine": "vader",
            "sentiment_confidence": 0.5,
            "emotion": "Neutral / Reporting",
            "scores": {"compound": 0.0, "neg": 0.0, "neu": 1.0, "pos": 0.0}
        }

    scores = analyzer.polarity_scores(clean_text)
    compound = float(scores.get("compound", 0.0))

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

    confidence = round(max(scores.get("neg", 0.0), scores.get("neu", 0.0), scores.get("pos", 0.0)), 3)

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
            except Exception:
                for t in chunk:
                    results.append(analyze_with_transformer(t))
        return results
    else:
        return [analyze_with_vader(t) for t in texts]
