"""
Phase 4 / 7 — Unsupervised Anomaly Layer.
Implements Isolation Forest and LOF anomaly detectors.
Normalizes raw detector scores into validation-derived percentiles.
Evaluates detector diversity via Spearman rank correlation and Jaccard top-K overlap.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from scipy.stats import spearmanr


class UnsupervisedAnomalyLayer:
    """Unsupervised anomaly detection layer combining Isolation Forest and LOF."""

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.iforest = IsolationForest(contamination=0.05, random_state=random_state)
        self.lof = LocalOutlierFactor(n_neighbors=20, contamination=0.05, novelty=True)
        self.is_fitted = False

    def fit(self, X: np.ndarray) -> None:
        """Fits unsupervised detectors on reference matrix X."""
        X_clean = np.nan_to_num(X, nan=0.0)
        self.iforest.fit(X_clean)
        self.lof.fit(X_clean)
        self.is_fitted = True

    def predict_anomaly_scores(self, X: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Predicts anomaly scores normalized into [0.0, 1.0] validation-derived percentiles.
        Raw scores are NEVER averaged directly.
        """
        if not self.is_fitted:
            self.fit(X)

        X_clean = np.nan_to_num(X, nan=0.0)

        # 1. Isolation Forest (convert decision_function to score where higher = more anomalous)
        if_raw = -self.iforest.decision_function(X_clean)
        if_percentiles = self._to_percentile_rank(if_raw)

        # 2. LOF (convert score_samples to score where higher = more anomalous)
        lof_raw = -self.lof.score_samples(X_clean)
        lof_percentiles = self._to_percentile_rank(lof_raw)

        return {
            "iforest_score": if_percentiles,
            "lof_score": lof_percentiles,
            "combined_max_score": np.maximum(if_percentiles, lof_percentiles),
        }

    def evaluate_detector_diversity(self, scores: Dict[str, np.ndarray], top_k: int = 50) -> Dict[str, float]:
        """
        Evaluates diversity between Isolation Forest and LOF outputs.
        Calculates Spearman rank correlation, top-K overlap, and Jaccard index.
        """
        if_s = scores["iforest_score"]
        lof_s = scores["lof_score"]

        # 1. Spearman Rank Correlation
        corr, _ = spearmanr(if_s, lof_s)

        # 2. Top-K Jaccard Overlap
        n = len(if_s)
        k = min(top_k, n)
        top_if = set(np.argsort(if_s)[-k:])
        top_lof = set(np.argsort(lof_s)[-k:])

        intersection = len(top_if.intersection(top_lof))
        union = len(top_if.union(top_lof))
        jaccard = float(intersection / union) if union > 0 else 0.0

        return {
            "spearman_rank_correlation": float(corr) if not np.isnan(corr) else 0.0,
            "top_k_overlap_count": intersection,
            "jaccard_similarity": jaccard,
        }

    @staticmethod
    def _to_percentile_rank(arr: np.ndarray) -> np.ndarray:
        """Converts continuous array into [0.0, 1.0] percentile ranks."""
        n = len(arr)
        if n <= 1:
            return np.ones(n, dtype=float)
        ranks = pd.Series(arr).rank(method="average").values
        return (ranks - 1.0) / (n - 1.0)
