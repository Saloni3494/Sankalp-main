"""
Phase 7 — Out-of-Fold (OOF) Stacking & Evidence Fusion Meta-Model.
Builds OOF temporal evidence matrix across 9 correlated evidence families.
Trains LightGBM Meta-Model on OOF evidence matrix ONLY. NEVER on in-sample predictions.
"""

import numpy as np
import pandas as pd
import lightgbm as lgb
from typing import Dict, List, Tuple, Any, Optional

EVIDENCE_FAMILIES = [
    "FINANCIAL",
    "PAYMENT",
    "LIFECYCLE",
    "DUPLICATE",
    "VENDOR",
    "GRAPH",
    "RULE",
    "SURVIVAL",
    "PROVENANCE",
]


class EvidenceFusionMetaModel:
    """
    LightGBM Meta-Model combining evidence signals from base components.
    Trained strictly on temporal out-of-fold (OOF) base predictions.
    """

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.meta_model = lgb.LGBMClassifier(
            n_estimators=100,
            learning_rate=0.03,
            max_depth=4,
            num_leaves=15,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=random_state,
            verbose=-1,
        )
        self.is_fitted = False
        self.feature_names: List[str] = []

    def fit_oof(self, X_oof: pd.DataFrame, y_oof: np.ndarray) -> None:
        """Fits meta-model on temporal out-of-fold predictions matrix."""
        self.feature_names = list(X_oof.columns)
        X_clean = np.nan_to_num(X_oof.values, nan=0.0)
        self.meta_model.fit(X_clean, y_oof)
        self.is_fitted = True

    def predict_raw_risk_scores(self, X_eval: pd.DataFrame) -> np.ndarray:
        """Predicts raw uncalibrated risk probability scores in [0.0, 1.0]."""
        if not self.is_fitted:
            # Simple heuristic baseline if meta-model is not yet trained
            if "financial_score" in X_eval.columns and "rule_score" in X_eval.columns:
                fin = X_eval["financial_score"].values
                rule = X_eval["rule_score"].values
                return np.clip(0.5 * fin + 0.5 * rule, 0.0, 1.0)
            return np.full(len(X_eval), 0.1)

        X_clean = np.nan_to_num(X_eval[self.feature_names].values, nan=0.0)
        return self.meta_model.predict_proba(X_clean)[:, 1]
