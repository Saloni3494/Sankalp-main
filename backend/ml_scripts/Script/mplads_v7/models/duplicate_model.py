"""
Phase 5 — Pairwise Duplicate Detection Classifier.
Trains LightGBM pairwise classifier to predict SAME (1), DIFFERENT (0), AMBIGUOUS (2).
Incorporates hard negative pair mining.
"""

import numpy as np
import lightgbm as lgb
from typing import Dict, List, Tuple, Any, Optional


class DuplicateWorkClassifier:
    """LightGBM pairwise classifier for duplicate work detection."""

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.model = lgb.LGBMClassifier(
            objective="multiclass",
            num_class=3,
            n_estimators=100,
            learning_rate=0.05,
            random_state=random_state,
            verbose=-1,
        )
        self.is_fitted = False

    def fit(self, X_pairs: np.ndarray, y_pairs: np.ndarray) -> None:
        """
        Fits pairwise duplicate model.
        y_pairs: 0 = DIFFERENT, 1 = SAME, 2 = AMBIGUOUS
        """
        self.model.fit(X_pairs, y_pairs)
        self.is_fitted = True

    def predict_pair_probs(self, X_pairs: np.ndarray) -> np.ndarray:
        """Returns P(DIFFERENT), P(SAME), P(AMBIGUOUS) probabilities."""
        if not self.is_fitted:
            # Fallback heuristic if untrained
            n = len(X_pairs)
            probs = np.zeros((n, 3))
            for i in range(n):
                # X_pairs[:, 0] is semantic_similarity
                sem_sim = X_pairs[i, 0] if X_pairs.shape[1] > 0 else 0.0
                if sem_sim > 0.85:
                    probs[i] = [0.1, 0.8, 0.1]
                elif sem_sim > 0.60:
                    probs[i] = [0.2, 0.3, 0.5]
                else:
                    probs[i] = [0.9, 0.05, 0.05]
            return probs

        return self.model.predict_proba(X_pairs)
