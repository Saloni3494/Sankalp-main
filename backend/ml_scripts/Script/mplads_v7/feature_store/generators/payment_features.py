"""
Phase 3 — Payment Intelligence Feature Generator.
Calculates payment interarrival statistics, burstiness, concentration (HHI, top vendor share),
and temporal rolling windows (7d, 30d, 90d) as-of prediction timestamp T.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any
from mplads_v7.temporal.boundary import TemporalSnapshot
from mplads_v7.canonical.entities import Payment


def generate_payment_features(snapshot: TemporalSnapshot) -> Dict[str, Any]:
    """Generates Payment Intelligence features from snapshot as-of T."""
    feats: Dict[str, Any] = {}

    pmts = snapshot.visible_payments or []
    pmt_count = len(pmts)
    feats["payment_count"] = float(pmt_count)

    if pmt_count == 0:
        feats["vendor_count"] = 0.0
        feats["payment_frequency"] = 0.0
        feats["mean_interarrival_time"] = -1.0
        feats["std_interarrival_time"] = -1.0
        feats["payment_burstiness"] = 0.0
        feats["payment_amount_mean"] = 0.0
        feats["payment_amount_std"] = 0.0
        feats["payment_amount_cv"] = 0.0
        feats["largest_payment_share"] = 0.0
        feats["top_vendor_payment_share"] = 0.0
        feats["vendor_payment_HHI"] = 0.0
        feats["payments_last_7d"] = 0.0
        feats["payments_last_30d"] = 0.0
        feats["payments_last_90d"] = 0.0
        feats["amount_last_7d"] = 0.0
        feats["amount_last_30d"] = 0.0
        feats["amount_last_90d"] = 0.0
        return feats

    # Vendors & Amounts
    vendors = [p.vendor_name_raw for p in pmts if p.vendor_name_raw]
    unique_vendors = set(vendors)
    feats["vendor_count"] = float(len(unique_vendors))

    amounts = np.array([p.disbursed_amount for p in pmts])
    total_amt = np.sum(amounts)

    mean_amt = float(np.mean(amounts))
    std_amt = float(np.std(amounts)) if len(amounts) > 1 else 0.0
    cv_amt = float(std_amt / mean_amt) if mean_amt > 0 else 0.0

    feats["payment_amount_mean"] = mean_amt
    feats["payment_amount_std"] = std_amt
    feats["payment_amount_cv"] = cv_amt
    feats["largest_payment_share"] = float(np.max(amounts) / total_amt) if total_amt > 0 else 0.0

    # Vendor concentration (HHI)
    vendor_sums: Dict[str, float] = {}
    for p in pmts:
        v = p.vendor_name_raw or "UNKNOWN"
        vendor_sums[v] = vendor_sums.get(v, 0.0) + p.disbursed_amount

    if total_amt > 0:
        shares = [amt / total_amt for amt in vendor_sums.values()]
        feats["top_vendor_payment_share"] = float(max(shares))
        feats["vendor_payment_HHI"] = float(sum(s ** 2 for s in shares))
    else:
        feats["top_vendor_payment_share"] = 0.0
        feats["vendor_payment_HHI"] = 0.0

    # Interarrival statistics
    valid_dates = sorted([pd.to_datetime(p.expenditure_date) for p in pmts if p.expenditure_date])
    if len(valid_dates) > 1:
        diffs = [(valid_dates[i] - valid_dates[i-1]).days for i in range(1, len(valid_dates))]
        mean_diff = float(np.mean(diffs))
        std_diff = float(np.std(diffs))
        # Burstiness parameter r = (std - mean) / (std + mean)
        burstiness = float((std_diff - mean_diff) / (std_diff + mean_diff)) if (std_diff + mean_diff) > 0 else 0.0
        feats["mean_interarrival_time"] = mean_diff
        feats["std_interarrival_time"] = std_diff
        feats["payment_burstiness"] = burstiness
    else:
        feats["mean_interarrival_time"] = -1.0
        feats["std_interarrival_time"] = -1.0
        feats["payment_burstiness"] = 0.0

    # Rolling windows as-of snapshot.as_of_date
    t_as_of = pd.to_datetime(snapshot.as_of_date)
    p_7d = 0.0
    p_30d = 0.0
    p_90d = 0.0
    a_7d = 0.0
    a_30d = 0.0
    a_90d = 0.0

    for p in pmts:
        if p.expenditure_date:
            t_pmt = pd.to_datetime(p.expenditure_date)
            days_ago = (t_as_of - t_pmt).days
            if 0 <= days_ago <= 7:
                p_7d += 1.0
                a_7d += p.disbursed_amount
            if 0 <= days_ago <= 30:
                p_30d += 1.0
                a_30d += p.disbursed_amount
            if 0 <= days_ago <= 90:
                p_90d += 1.0
                a_90d += p.disbursed_amount

    feats["payments_last_7d"] = p_7d
    feats["payments_last_30d"] = p_30d
    feats["payments_last_90d"] = p_90d
    feats["amount_last_7d"] = a_7d
    feats["amount_last_30d"] = a_30d
    feats["amount_last_90d"] = a_90d

    return feats
