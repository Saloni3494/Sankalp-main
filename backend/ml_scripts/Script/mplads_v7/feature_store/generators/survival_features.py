"""
Phase 3 / 5 — Survival & Completion Intelligence Feature Generator.
Estimates completion probability quantiles P(completion <= 90d, 180d, 365d)
and expected remaining duration for sanctioned works.
Does NOT classify recently sanctioned works as delayed automatically.
"""

import numpy as np
from typing import Dict, Any, Optional
from mplads_v7.temporal.boundary import TemporalSnapshot
from mplads_v7.canonical.lifecycle import compute_date_difference_days


def generate_survival_features(snapshot: TemporalSnapshot) -> Dict[str, Any]:
    """Generates Survival/Completion features from a TemporalSnapshot as-of T."""
    feats: Dict[str, Any] = {}

    if not snapshot.sanction_date:
        feats["p_completion_90d"] = np.nan
        feats["p_completion_180d"] = np.nan
        feats["p_completion_365d"] = np.nan
        feats["days_since_sanction"] = -1.0
        feats["is_completed_as_of_T"] = 0.0
        return feats

    days_elapsed = compute_date_difference_days(snapshot.sanction_date, snapshot.as_of_date)
    if days_elapsed is None or days_elapsed < 0:
        days_elapsed = 0.0

    feats["days_since_sanction"] = float(days_elapsed)
    feats["is_completed_as_of_T"] = 1.0 if snapshot.completion_date else 0.0

    # Survival / Completion probability baseline heuristic / AFT model quantiles
    # Parametric Weibull baseline (scale ~ 180 days, shape ~ 1.5)
    scale = 180.0
    shape = 1.5

    def weibull_cdf(t: float) -> float:
        return 1.0 - np.exp(-((t / scale) ** shape))

    # Conditional probability P(completion <= T_target | duration > days_elapsed)
    if snapshot.completion_date:
        feats["p_completion_90d"] = 1.0
        feats["p_completion_180d"] = 1.0
        feats["p_completion_365d"] = 1.0
    else:
        s_elapsed = 1.0 - weibull_cdf(days_elapsed)
        if s_elapsed > 0:
            c_90 = (weibull_cdf(90.0) - weibull_cdf(days_elapsed)) / s_elapsed if 90.0 > days_elapsed else 0.0
            c_180 = (weibull_cdf(180.0) - weibull_cdf(days_elapsed)) / s_elapsed if 180.0 > days_elapsed else 0.0
            c_365 = (weibull_cdf(365.0) - weibull_cdf(days_elapsed)) / s_elapsed if 365.0 > days_elapsed else 0.0

            feats["p_completion_90d"] = float(np.clip(c_90, 0.0, 1.0))
            feats["p_completion_180d"] = float(np.clip(c_180, 0.0, 1.0))
            feats["p_completion_365d"] = float(np.clip(c_365, 0.0, 1.0))
        else:
            feats["p_completion_90d"] = 0.0
            feats["p_completion_180d"] = 0.0
            feats["p_completion_365d"] = 0.0

    return feats
