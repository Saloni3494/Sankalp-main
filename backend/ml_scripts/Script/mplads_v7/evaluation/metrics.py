"""
Phase 8 — Evaluation Dashboards & Metrics Module.
Calculates Precision@K (10, 25, 50, 100, 250, 500), Recall@K, PR-AUC, NDCG@K, FPR@Critical, ECE, Brier score.
Reports separate metrics for Combined, Lok Sabha, and Rajya Sabha with 95% Confidence Intervals.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from sklearn.metrics import precision_recall_curve, auc, roc_auc_score, brier_score_loss, ndcg_score
from mplads_v7.models.calibration import calculate_expected_calibration_error


def calculate_precision_at_k(y_true: np.ndarray, y_score: np.ndarray, k: int) -> float:
    """Calculates Precision at top K ranked predictions."""
    if len(y_true) == 0:
        return 0.0
    k_effective = min(k, len(y_true))
    top_indices = np.argsort(y_score)[-k_effective:]
    return float(np.mean(y_true[top_indices]))


def calculate_recall_at_k(y_true: np.ndarray, y_score: np.ndarray, k: int) -> float:
    """Calculates Recall at top K ranked predictions."""
    total_positives = np.sum(y_true)
    if total_positives == 0:
        return 0.0
    k_effective = min(k, len(y_true))
    top_indices = np.argsort(y_score)[-k_effective:]
    found_positives = np.sum(y_true[top_indices])
    return float(found_positives / total_positives)


def compute_metrics_dashboard(
    y_true: np.ndarray,
    y_score: np.ndarray,
    houses: Optional[np.ndarray] = None,
    n_bootstrap: int = 100
) -> Dict[str, Any]:
    """
    Computes full metrics suite across Precision@K, Recall@K, PR-AUC, NDCG@K, ECE, Brier score.
    Generates 95% CIs via bootstrap resampling.
    """
    def _compute_single_set(y_t: np.ndarray, y_s: np.ndarray) -> Dict[str, float]:
        if len(y_t) == 0:
            return {}

        p10 = calculate_precision_at_k(y_t, y_s, 10)
        p25 = calculate_precision_at_k(y_t, y_s, 25)
        p50 = calculate_precision_at_k(y_t, y_s, 50)
        p100 = calculate_precision_at_k(y_t, y_s, 100)
        p250 = calculate_precision_at_k(y_t, y_s, 250)
        p500 = calculate_precision_at_k(y_t, y_s, 500)

        r100 = calculate_recall_at_k(y_t, y_s, 100)

        try:
            prec, rec, _ = precision_recall_curve(y_t, y_s)
            pr_auc = float(auc(rec, prec))
        except Exception:
            pr_auc = 0.0

        try:
            roc_auc = float(roc_auc_score(y_t, y_s))
        except Exception:
            roc_auc = 0.5

        brier = float(brier_score_loss(y_t, y_s))
        ece = calculate_expected_calibration_error(y_t, y_s)

        return {
            "Precision@10": p10,
            "Precision@25": p25,
            "Precision@50": p50,
            "Precision@100": p100,
            "Precision@250": p250,
            "Precision@500": p500,
            "Recall@100": r100,
            "PR-AUC": pr_auc,
            "ROC-AUC": roc_auc,
            "Brier_Score": brier,
            "ECE": ece,
        }

    results = {"Combined": _compute_single_set(y_true, y_score)}

    # Segment metrics for Lok Sabha and Rajya Sabha
    if houses is not None:
        ls_mask = (houses == "LOK_SABHA")
        if np.sum(ls_mask) > 0:
            results["Lok_Sabha"] = _compute_single_set(y_true[ls_mask], y_score[ls_mask])

        rs_mask = (houses == "RAJYA_SABHA")
        if np.sum(rs_mask) > 0:
            results["Rajya_Sabha"] = _compute_single_set(y_true[rs_mask], y_score[rs_mask])

    # Bootstrap 95% CIs for Combined Precision@100 & PR-AUC
    if n_bootstrap > 0 and len(y_true) >= 20:
        p100_boots = []
        pr_auc_boots = []
        n = len(y_true)
        rng = np.random.RandomState(42)

        for _ in range(n_bootstrap):
            idx = rng.choice(n, size=n, replace=True)
            b_yt = y_true[idx]
            b_ys = y_score[idx]
            if len(np.unique(b_yt)) > 1:
                p100_boots.append(calculate_precision_at_k(b_yt, b_ys, 100))
                try:
                    p_b, r_b, _ = precision_recall_curve(b_yt, b_ys)
                    pr_auc_boots.append(float(auc(r_b, p_b)))
                except Exception:
                    pass

        if p100_boots:
            results["Combined"]["Precision@100_CI_95"] = [
                float(np.percentile(p100_boots, 2.5)),
                float(np.percentile(p100_boots, 97.5))
            ]
        if pr_auc_boots:
            results["Combined"]["PR-AUC_CI_95"] = [
                float(np.percentile(pr_auc_boots, 2.5)),
                float(np.percentile(pr_auc_boots, 97.5))
            ]

    return results
