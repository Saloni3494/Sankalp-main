"""
Phase 3 / 5 — Ongoing Expenditure Trajectory Feature Generator.
Calculates expenditure pace, velocity, and acceleration using ONLY current ongoing historical data as of T.
FINAL expenditure MUST NOT enter ongoing-work predictions.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any
from mplads_v7.temporal.boundary import TemporalSnapshot
from mplads_v7.canonical.lifecycle import compute_date_difference_days


def generate_trajectory_features(snapshot: TemporalSnapshot) -> Dict[str, Any]:
    """Generates ongoing expenditure trajectory features."""
    feats: Dict[str, Any] = {}

    start_date = snapshot.sanction_date or snapshot.recommendation_date or snapshot.first_payment_date
    if not start_date or not snapshot.current_expenditure:
        feats["expenditure_per_day"] = 0.0
        feats["expenditure_velocity_change"] = 0.0
        feats["expenditure_pace_vs_sanction"] = 0.0
        return feats

    days_elapsed = compute_date_difference_days(start_date, snapshot.as_of_date)
    if days_elapsed is None or days_elapsed <= 0:
        days_elapsed = 1.0

    exp_total = snapshot.current_expenditure or 0.0
    exp_per_day = exp_total / days_elapsed
    feats["expenditure_per_day"] = float(exp_per_day)

    # Velocity change (acceleration between first half of timeline vs second half)
    pmts = snapshot.visible_payments or []
    if len(pmts) >= 2 and days_elapsed > 14:
        mid_date = pd.to_datetime(start_date) + pd.Timedelta(days=days_elapsed / 2.0)
        h1_exp = sum(p.disbursed_amount for p in pmts if p.expenditure_date and pd.to_datetime(p.expenditure_date) <= mid_date)
        h2_exp = exp_total - h1_exp

        v1 = h1_exp / (days_elapsed / 2.0)
        v2 = h2_exp / (days_elapsed / 2.0)
        feats["expenditure_velocity_change"] = float(v2 - v1)
    else:
        feats["expenditure_velocity_change"] = 0.0

    # Pace vs Sanction amount
    if snapshot.sanction_amount and snapshot.sanction_amount > 0:
        feats["expenditure_pace_vs_sanction"] = float(exp_total / snapshot.sanction_amount)
    else:
        feats["expenditure_pace_vs_sanction"] = 0.0

    return feats
