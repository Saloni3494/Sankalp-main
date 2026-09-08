"""
Phase 3 — Financial Intelligence Feature Generator.
Calculates financial ratios with explicit missing denominator handling,
and robust deviation metrics (MAD, IQR, robust Z).
Enforces Rule 15: Missing denominators are NEVER replaced with zero.
"""

import numpy as np
from typing import Dict, Any, Optional, Tuple
from mplads_v7.temporal.boundary import TemporalSnapshot

DENOMINATOR_UNAVAILABLE = "DENOMINATOR_UNAVAILABLE"


def calculate_safe_ratio(numerator: Optional[float], denominator: Optional[float]) -> Tuple[Optional[float], Optional[str]]:
    """Calculates ratio. Returns (ratio, missing_reason)."""
    if denominator is None or pd.isna(denominator) or denominator == 0.0:
        return None, DENOMINATOR_UNAVAILABLE
    if numerator is None or pd.isna(numerator):
        return None, "NUMERATOR_UNAVAILABLE"
    return float(numerator) / float(denominator), None


import pandas as pd
from typing import Tuple


def generate_financial_features(snapshot: TemporalSnapshot) -> Dict[str, Any]:
    """Generates Financial features from a TemporalSnapshot."""
    feats: Dict[str, Any] = {}

    rec_amt = snapshot.recommendation_amount
    sanc_amt = snapshot.sanction_amount
    exp_amt = snapshot.current_expenditure
    disb_amt = snapshot.disbursed_amount
    pmt_count = len(snapshot.visible_payments) if snapshot.visible_payments else 0

    # 1. Sanction / Recommendation ratio
    r_sanc_rec, reason_sanc_rec = calculate_safe_ratio(sanc_amt, rec_amt)
    feats["sanction_ratio"] = r_sanc_rec if r_sanc_rec is not None else np.nan
    feats["sanction_ratio_missing_reason"] = reason_sanc_rec or "NONE"

    # 2. Disbursed / Sanction ratio
    r_disb_sanc, reason_disb_sanc = calculate_safe_ratio(disb_amt, sanc_amt)
    feats["disbursed_ratio"] = r_disb_sanc if r_disb_sanc is not None else np.nan
    feats["disbursed_ratio_missing_reason"] = reason_disb_sanc or "NONE"

    # 3. Expenditure / Sanction ratio
    r_exp_sanc, reason_exp_sanc = calculate_safe_ratio(exp_amt, sanc_amt)
    feats["expenditure_ratio"] = r_exp_sanc if r_exp_sanc is not None else np.nan
    feats["expenditure_ratio_missing_reason"] = reason_exp_sanc or "NONE"

    # 4. Expenditure / Payment count ratio
    r_amt_pmt, reason_amt_pmt = calculate_safe_ratio(exp_amt, pmt_count if pmt_count > 0 else None)
    feats["amount_per_payment"] = r_amt_pmt if r_amt_pmt is not None else np.nan
    feats["amount_per_payment_missing_reason"] = reason_amt_pmt or "NONE"

    return feats


def compute_robust_deviations(value: float, peer_values: np.ndarray) -> Dict[str, float]:
    """Computes median, MAD, IQR, robust Z-score against peer values."""
    if peer_values is None or len(peer_values) < 3:
        return {"robust_z": 0.0, "mad_deviation": 0.0, "iqr_deviation": 0.0, "percentile": 50.0}

    arr = np.sort(peer_values[~np.isnan(peer_values)])
    if len(arr) < 3:
        return {"robust_z": 0.0, "mad_deviation": 0.0, "iqr_deviation": 0.0, "percentile": 50.0}

    median = np.median(arr)
    mad = np.median(np.abs(arr - median))
    q25, q75 = np.percentile(arr, [25, 75])
    iqr = q75 - q25

    # Robust Z using MAD (scaled by 1.4826 for normal distribution)
    mad_scaled = 1.4826 * mad
    robust_z = (value - median) / mad_scaled if mad_scaled > 0 else 0.0

    mad_dev = (value - median) / mad if mad > 0 else 0.0
    iqr_dev = (value - median) / iqr if iqr > 0 else 0.0
    percentile = float(np.searchsorted(arr, value) / len(arr) * 100.0)

    return {
        "robust_z": float(robust_z),
        "mad_deviation": float(mad_dev),
        "iqr_deviation": float(iqr_dev),
        "percentile": float(percentile),
    }
