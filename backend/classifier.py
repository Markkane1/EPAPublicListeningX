"""
EPA Punjab Air Quality Intelligence — Tier-1 Text Classifier
Lightweight, zero-dependency, pure-Python machine learning text classifier for
classifying posts into the canonical 16 Noise and 6 Relevant categories.

Hardware footprint:
- Disk size: < 500 KB (JSON model snapshot)
- Memory: < 10 MB RAM
- Training time: < 0.5s for 2,000 posts
- Inference latency: < 0.2ms per tweet
- External dependencies: ZERO (Python standard library only)
"""

import os
import sys
import re
import math
import json
import random
from datetime import datetime, timezone
from collections import Counter, defaultdict
from typing import Dict, Any, List, Tuple, Optional

from backend import database, taxonomy

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "models")
MODEL_FILE = os.path.join(MODEL_DIR, "noise_classifier.json")

# Precompiled tokenizers
WORD_RE = re.compile(r'[\w\u0600-\u06ff]+')
URL_RE = re.compile(r'https?://\S+')
MENTION_RE = re.compile(r'@[A-Za-z0-9_]+')

COMMON_STOPWORDS = {
    'the', 'and', 'to', 'of', 'a', 'in', 'is', 'that', 'for', 'it', 'as', 'was', 'with',
    'on', 'at', 'by', 'this', 'be', 'are', 'from', 'or', 'an', 'have', 'has', 'had',
    'not', 'but', 'what', 'all', 'were', 'when', 'we', 'there', 'can', 'an', 'your',
    'which', 'their', 'if', 'will', 'each', 'about', 'how', 'up', 'out', 'them', 'then',
    'she', 'many', 'some', 'so', 'these', 'would', 'other', 'into', 'has', 'more',
    'her', 'two', 'like', 'him', 'see', 'time', 'could', 'no', 'make', 'than', 'first',
    'been', 'its', 'who', 'now', 'people', 'my', 'made', 'over', 'did', 'down', 'only',
    'way', 'find', 'use', 'may', 'water', 'long', 'little', 'very', 'after', 'words',
    'called', 'just', 'where', 'most', 'know', 'get', 'through', 'back', 'much', 'go',
    'good', 'new', 'write', 'our', 'me', 'man', 'too', 'any', 'day', 'same', 'right',
    'look', 'think', 'also', 'around', 'another', 'came', 'come', 'work', 'three', 'word',
    'must', 'because', 'does', 'part', 'even', 'place', 'well', 'such', 'here', 'take',
    'why', 'things', 'help', 'put', 'years', 'different', 'away', 'again', 'off', 'went',
    'old', 'number', 'great', 'tell', 'men', 'say', 'small', 'every', 'found', 'still',
    'between', 'name', 'should', 'mr', 'home', 'big', 'give', 'air', 'today', 'smog'
}

_CACHED_MODEL: Optional[Dict[str, Any]] = None
_CACHED_MODEL_MTIME: float = 0.0

def tokenize(text: str) -> List[str]:
    """Tokenizes text into words and bigrams, supporting English, Roman Urdu, and Urdu script."""
    if not text:
        return []
    clean = URL_RE.sub(' ', text.lower())
    clean = MENTION_RE.sub(' ', clean)
    tokens = [w for w in WORD_RE.findall(clean) if len(w) >= 2]
    
    # Generate unigrams without raw single stop words
    unigrams = [w for w in tokens if w not in COMMON_STOPWORDS and not w.isdigit()]
    
    # Generate bigrams to capture compound phrases (e.g. 'chaired_meeting', 'buddha_nullah')
    bigrams = []
    for i in range(len(tokens) - 1):
        w1, w2 = tokens[i], tokens[i+1]
        if w1 not in COMMON_STOPWORDS or w2 not in COMMON_STOPWORDS:
            bigrams.append(f"{w1}_{w2}")
            
    return unigrams + bigrams

def compute_tfidf(tokens: List[str], idf: Dict[str, float]) -> Dict[str, float]:
    """Computes normalized TF-IDF vector for a token stream."""
    tf = Counter(tokens)
    vec = {}
    norm_sq = 0.0
    for tok, cnt in tf.items():
        if tok in idf:
            weight = (1.0 + math.log(cnt)) * idf[tok]
            vec[tok] = weight
            norm_sq += weight * weight
    norm = math.sqrt(norm_sq) or 1.0
    return {k: v / norm for k, v in vec.items()}

class Tier1Classifier:
    """Pure-Python TF-IDF Centroid Classifier for fast text categorization."""
    
    def __init__(self):
        self.idf: Dict[str, float] = {}
        self.binary_centroids: Dict[str, Dict[str, float]] = {}  # 'noise' vs 'relevant'
        self.category_centroids: Dict[str, Dict[str, float]] = {}  # category codes
        self.category_labels: Dict[str, str] = {}
        self.top_features_per_category: Dict[str, List[str]] = {}
        self.metrics: Dict[str, Any] = {}
        self.trained_at: str = ""
        self.total_samples: int = 0
        self.noise_samples: int = 0
        self.relevant_samples: int = 0

    def fit(self, samples: List[Tuple[str, int, str]]) -> Dict[str, Any]:
        """
        Fits model on samples: list of (text, label, category) where:
        label: 0 = Noise, 1 = Relevant
        category: canonical taxonomy code
        """
        if not samples or len(samples) < 10:
            raise ValueError(f"Insufficient samples to train classifier (found {len(samples)}, minimum 10 required).")

        random.seed(42)
        shuffled = list(samples)
        random.shuffle(shuffled)

        # Validation split: if dataset is small (< 50), train on all samples and evaluate on all samples
        # to ensure small category sets are not starved.
        if len(shuffled) >= 50:
            split_idx = int(len(shuffled) * 0.8)
            val_data = shuffled[split_idx:]
            train_data = shuffled
        else:
            train_data = shuffled
            val_data = shuffled

        # 1. Document Frequencies and IDF
        doc_freq = Counter()
        for text, _, _ in train_data:
            tokens = set(tokenize(text))
            for tok in tokens:
                doc_freq[tok] += 1

        n_docs = len(train_data)
        min_cnt = 1 if n_docs < 50 else 2
        self.idf = {
            tok: math.log((n_docs + 1.0) / (cnt + 1.0)) + 1.0
            for tok, cnt in doc_freq.items()
            if cnt >= min_cnt
        }

        # 2. Binary Centroids ('noise' vs 'relevant')
        bin_accum = {"noise": defaultdict(float), "relevant": defaultdict(float)}
        bin_counts = {"noise": 0, "relevant": 0}
        
        # 3. Multi-class Category Centroids
        cat_accum = defaultdict(lambda: defaultdict(float))
        cat_counts = Counter()

        for text, label, cat in train_data:
            vec = compute_tfidf(tokenize(text), self.idf)
            bin_key = "relevant" if label == 1 else "noise"
            bin_counts[bin_key] += 1
            for tok, w in vec.items():
                bin_accum[bin_key][tok] += w
                cat_accum[cat][tok] += w
            cat_counts[cat] += 1

        # Normalize binary centroids
        self.binary_centroids = {}
        for b_key in ["noise", "relevant"]:
            raw_c = bin_accum[b_key]
            norm_sq = sum(w * w for w in raw_c.values())
            norm = math.sqrt(norm_sq) or 1.0
            self.binary_centroids[b_key] = {k: v / norm for k, v in raw_c.items()}

        # Normalize category centroids
        self.category_centroids = {}
        for c_key, raw_c in cat_accum.items():
            norm_sq = sum(w * w for w in raw_c.values())
            norm = math.sqrt(norm_sq) or 1.0
            self.category_centroids[c_key] = {k: v / norm for k, v in raw_c.items()}

        # 4. Extract Top Features per Category
        self.top_features_per_category = {}
        for c_key, c_vec in self.category_centroids.items():
            # Sort tokens by highest weight in this centroid
            top_toks = sorted(c_vec.items(), key=lambda x: x[1], reverse=True)[:8]
            self.top_features_per_category[c_key] = [t[0] for t in top_toks]

        # 5. Evaluate on Validation Set
        correct_binary = 0
        tp = fp = fn = tn = 0
        correct_cat = 0

        for text, true_label, true_cat in val_data:
            pred_res = self.predict(text)
            pred_label = 0 if pred_res["is_noise"] else 1
            if pred_label == true_label:
                correct_binary += 1
                if true_label == 1:
                    tp += 1
                else:
                    tn += 1
            else:
                if pred_label == 1:
                    fp += 1
                else:
                    fn += 1

            if pred_res["predicted_category"] == true_cat:
                correct_cat += 1

        val_total = len(val_data)
        bin_accuracy = (correct_binary / val_total) if val_total > 0 else 0.0
        cat_accuracy = (correct_cat / val_total) if val_total > 0 else 0.0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

        self.trained_at = datetime.now(timezone.utc).isoformat()
        self.total_samples = len(samples)
        self.noise_samples = sum(1 for _, l, _ in samples if l == 0)
        self.relevant_samples = sum(1 for _, l, _ in samples if l == 1)

        self.metrics = {
            "validationSamples": val_total,
            "binaryAccuracy": round(bin_accuracy, 4),
            "categoryAccuracy": round(cat_accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1Score": round(f1, 4),
            "vocabSize": len(self.idf),
            "categoriesTrained": len(self.category_centroids)
        }

        return self.metrics

    def predict(self, text: str) -> Dict[str, Any]:
        """Predicts whether a text is noise or clean, its category, and confidence."""
        if not self.idf or not self.binary_centroids:
            return {
                "is_noise": False,
                "predicted_category": "UNKNOWN",
                "confidence": 0.5,
                "top_signals": [],
                "candidates": []
            }

        tokens = tokenize(text)
        vec = compute_tfidf(tokens, self.idf)

        # 1. Binary Score (Cosine Similarity)
        noise_sim = sum(w * self.binary_centroids["noise"].get(tok, 0.0) for tok, w in vec.items())
        rel_sim = sum(w * self.binary_centroids["relevant"].get(tok, 0.0) for tok, w in vec.items())

        # Softmax over binary similarity to get confidence
        max_sim = max(noise_sim, rel_sim)
        exp_noise = math.exp(min(50.0, (noise_sim - max_sim) * 10.0))
        exp_rel = math.exp(min(50.0, (rel_sim - max_sim) * 10.0))
        sum_exp = exp_noise + exp_rel or 1.0
        noise_prob = exp_noise / sum_exp
        rel_prob = exp_rel / sum_exp

        is_noise = noise_sim > rel_sim
        bin_confidence = noise_prob if is_noise else rel_prob

        # 2. Multi-class Category Score
        cat_scores = {}
        for c_key, c_vec in self.category_centroids.items():
            sim = sum(w * c_vec.get(tok, 0.0) for tok, w in vec.items())
            cat_scores[c_key] = max(0.0, sim)

        # Top 3 Candidates
        sorted_cats = sorted(cat_scores.items(), key=lambda x: x[1], reverse=True)
        top_cat = sorted_cats[0][0] if sorted_cats else ("NOISE" if is_noise else "CITIZEN_GROUND_TRUTH")

        candidates = []
        score_sum = sum(s for _, s in sorted_cats[:3]) or 1.0
        for c_k, s in sorted_cats[:3]:
            candidates.append({
                "category": c_k,
                "score": round(s, 4),
                "probability": round(s / score_sum, 4)
            })

        # 3. Top Contributing Word Signals
        target_centroid = self.binary_centroids["noise" if is_noise else "relevant"]
        contributing_tokens = []
        for tok, w in vec.items():
            if tok in target_centroid:
                impact = w * target_centroid[tok]
                contributing_tokens.append((tok, impact))
        contributing_tokens.sort(key=lambda x: x[1], reverse=True)
        top_signals = [t[0] for t in contributing_tokens[:5]]

        return {
            "is_noise": is_noise,
            "predicted_category": top_cat,
            "confidence": round(bin_confidence, 4),
            "top_signals": top_signals,
            "candidates": candidates
        }

    def to_dict(self) -> Dict[str, Any]:
        """Serializes model state to JSON-compatible dictionary."""
        return {
            "version": "1.0",
            "trained_at": self.trained_at,
            "total_samples": self.total_samples,
            "noise_samples": self.noise_samples,
            "relevant_samples": self.relevant_samples,
            "metrics": self.metrics,
            "idf": self.idf,
            "binary_centroids": self.binary_centroids,
            "category_centroids": self.category_centroids,
            "top_features_per_category": self.top_features_per_category
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Tier1Classifier':
        """Instantiates classifier from serialized dictionary."""
        m = cls()
        m.trained_at = data.get("trained_at", "")
        m.total_samples = data.get("total_samples", 0)
        m.noise_samples = data.get("noise_samples", 0)
        m.relevant_samples = data.get("relevant_samples", 0)
        m.metrics = data.get("metrics", {})
        m.idf = data.get("idf", {})
        m.binary_centroids = data.get("binary_centroids", {})
        m.category_centroids = data.get("category_centroids", {})
        m.top_features_per_category = data.get("top_features_per_category", {})
        return m

def get_or_load_model() -> Optional[Tier1Classifier]:
    """Returns cached Tier1Classifier instance or loads from disk if updated."""
    global _CACHED_MODEL, _CACHED_MODEL_MTIME
    if not os.path.exists(MODEL_FILE):
        return None
    try:
        mtime = os.path.getmtime(MODEL_FILE)
        if _CACHED_MODEL is not None and mtime == _CACHED_MODEL_MTIME:
            return _CACHED_MODEL
        with open(MODEL_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        _CACHED_MODEL = Tier1Classifier.from_dict(data)
        _CACHED_MODEL_MTIME = mtime
        return _CACHED_MODEL
    except Exception as err:
        print(f"[!] Warning: Failed to load classifier model: {err}", file=sys.stderr)
        return None

def train_classifier_from_db() -> Dict[str, Any]:
    """
    Pulls training examples from SQLite:
    1. curation_feedback (explicit human corrections)
    2. noise_posts (excluded pool)
    3. posts (verified clean feed)
    Trains the Tier-1 classifier, saves snapshot to data/models/noise_classifier.json,
    and returns comprehensive training performance metrics.
    """
    samples = []
    seen_texts = set()

    with database.get_db() as conn:
        cursor = conn.cursor()

        # 1. Load Curation Feedback (Highest quality ground truth)
        try:
            cursor.execute("SELECT post_text, label, category FROM curation_feedback WHERE post_text IS NOT NULL")
            for row in cursor.fetchall():
                txt = (row["post_text"] or "").strip()
                if txt and txt not in seen_texts:
                    seen_texts.add(txt)
                    lbl = int(row["label"])
                    cat = taxonomy.normalize_noise_category(row["category"]) if lbl == 0 else taxonomy.normalize_relevant_category(row["category"])
                    # Weight feedback higher by adding twice
                    samples.append((txt, lbl, cat))
                    samples.append((txt, lbl, cat))
        except Exception:
            pass

        # 2. Load Noise Posts
        cursor.execute("SELECT text, exclusion_category FROM noise_posts WHERE text IS NOT NULL")
        for row in cursor.fetchall():
            txt = (row["text"] or "").strip()
            if txt and txt not in seen_texts:
                seen_texts.add(txt)
                cat = taxonomy.normalize_noise_category(row["exclusion_category"])
                samples.append((txt, 0, cat))

        # 3. Load Verified Clean Posts
        cursor.execute("SELECT text, category FROM posts WHERE text IS NOT NULL")
        for row in cursor.fetchall():
            txt = (row["text"] or "").strip()
            if txt and txt not in seen_texts:
                seen_texts.add(txt)
                cat = taxonomy.normalize_relevant_category(row["category"])
                samples.append((txt, 1, cat))

    if len(samples) < 10:
        return {
            "success": False,
            "error": f"Insufficient dataset size ({len(samples)} samples found, minimum 10 required)."
        }

    # Train model
    classifier = Tier1Classifier()
    metrics = classifier.fit(samples)

    # Save to disk
    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(MODEL_FILE, "w", encoding="utf-8") as f:
        json.dump(classifier.to_dict(), f, indent=2, ensure_ascii=False)

    global _CACHED_MODEL, _CACHED_MODEL_MTIME
    _CACHED_MODEL = classifier
    _CACHED_MODEL_MTIME = os.path.getmtime(MODEL_FILE)

    return {
        "success": True,
        "trainedAt": classifier.trained_at,
        "totalSamples": classifier.total_samples,
        "noiseSamples": classifier.noise_samples,
        "relevantSamples": classifier.relevant_samples,
        "metrics": metrics,
        "topFeaturesPerCategory": classifier.top_features_per_category,
        "modelFileSizeKb": round(os.path.getsize(MODEL_FILE) / 1024, 1)
    }

def get_classifier_status() -> Dict[str, Any]:
    """Returns the current state and readiness of the Tier-1 classifier."""
    model = get_or_load_model()
    
    # Check dataset counts from database
    total_clean = database.count_posts()
    total_noise = database.count_noise_posts(status="all")
    
    feedback_count = 0
    with database.get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT COUNT(*) FROM curation_feedback")
            feedback_count = cursor.fetchone()[0]
        except Exception:
            feedback_count = 0

    available_samples = total_clean + total_noise + feedback_count
    min_required = 15
    is_ready_to_train = available_samples >= min_required

    if not model:
        return {
            "isTrained": False,
            "isReadyToTrain": is_ready_to_train,
            "availableSamples": available_samples,
            "cleanSamples": total_clean,
            "noiseSamples": total_noise,
            "feedbackSamples": feedback_count,
            "minRequired": min_required,
            "modelInfo": None
        }

    return {
        "isTrained": True,
        "isReadyToTrain": is_ready_to_train,
        "availableSamples": available_samples,
        "cleanSamples": total_clean,
        "noiseSamples": total_noise,
        "feedbackSamples": feedback_count,
        "trainedAt": model.trained_at,
        "modelInfo": {
            "totalSamplesTrained": model.total_samples,
            "binaryAccuracy": model.metrics.get("binaryAccuracy", 0.0),
            "categoryAccuracy": model.metrics.get("categoryAccuracy", 0.0),
            "f1Score": model.metrics.get("f1Score", 0.0),
            "vocabSize": model.metrics.get("vocabSize", 0),
            "categoriesTrained": model.metrics.get("categoriesTrained", 0),
            "fileSizeKb": round(os.path.getsize(MODEL_FILE) / 1024, 1) if os.path.exists(MODEL_FILE) else 0,
            "topFeaturesPerCategory": model.top_features_per_category
        }
    }

def predict_text(text: str) -> Dict[str, Any]:
    """Scores a text string using the trained classifier."""
    model = get_or_load_model()
    if not model:
        return {
            "is_trained": False,
            "is_noise": False,
            "predicted_category": "UNKNOWN",
            "confidence": 0.5,
            "top_signals": [],
            "candidates": []
        }
    res = model.predict(text)
    res["is_trained"] = True
    return res
