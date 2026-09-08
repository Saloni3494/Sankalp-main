"""
Phase 3 — Work & Lifecycle Feature Generator.
Calculates log1p monetary variables, lifecycle durations, status indicators, and images_available feature.
Respects temporal snapshot isolation.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any
from mplads_v7.temporal.boundary import TemporalSnapshot
from mplads_v7.canonical.lifecycle import compute_date_difference_days


def has_image_value(value: Any) -> int:
    """
    Evaluates whether an image cell contains a meaningful path/value (1) or is NA/empty/null/unavailable (0).
    Does NOT check whether the physical file exists on disk.
    """
    if value is None or pd.isna(value):
        return 0

    val_str = str(value).strip()
    if not val_str:
        return 0

    if val_str.upper() in {"NA", "N/A", "NONE", "NULL", "NOT AVAILABLE"}:
        return 0

    return 1


def generate_work_features(snapshot: TemporalSnapshot) -> Dict[str, Any]:
    """Generates Work and Lifecycle features from a TemporalSnapshot as-of T."""
    feats: Dict[str, Any] = {}

    rec_amt = snapshot.recommendation_amount
    sanc_amt = snapshot.sanction_amount
    exp_amt = snapshot.current_expenditure
    disb_amt = snapshot.disbursed_amount

    feats["log_recommended_amount"] = float(np.log1p(rec_amt)) if rec_amt and rec_amt > 0 else 0.0
    feats["log_sanction_amount"] = float(np.log1p(sanc_amt)) if sanc_amt and sanc_amt > 0 else 0.0
    feats["log_current_expenditure"] = float(np.log1p(exp_amt)) if exp_amt and exp_amt > 0 else 0.0
    feats["log_disbursed_amount"] = float(np.log1p(disb_amt)) if disb_amt and disb_amt > 0 else 0.0

    # Lifecycle duration days
    rec_to_sanc = compute_date_difference_days(snapshot.recommendation_date, snapshot.sanction_date)
    sanc_to_comp = compute_date_difference_days(snapshot.sanction_date, snapshot.completion_date)
    sanc_to_first_p = compute_date_difference_days(snapshot.sanction_date, snapshot.first_payment_date)

    feats["recommendation_to_sanction_days"] = rec_to_sanc if rec_to_sanc is not None else -1.0
    feats["sanction_to_completion_days"] = sanc_to_comp if sanc_to_comp is not None else -1.0
    feats["sanction_to_first_payment_days"] = sanc_to_first_p if sanc_to_first_p is not None else -1.0

    # Lifecycle presence indicators
    feats["has_recommendation"] = 1.0 if snapshot.recommendation_date else 0.0
    feats["has_sanction"] = 1.0 if snapshot.sanction_date else 0.0
    feats["has_completion"] = 1.0 if snapshot.completion_date else 0.0
    feats["has_expenditure"] = 1.0 if (snapshot.visible_payments and len(snapshot.visible_payments) > 0) else 0.0

    # New Feature: images_available (1 = valid path/value in Images, 0 = NA/empty/null/unavailable)
    img_paths = getattr(snapshot, "visible_image_paths", None) or []
    feats["images_available"] = 1.0 if any(has_image_value(img) == 1 for img in img_paths) else 0.0

    return feats
