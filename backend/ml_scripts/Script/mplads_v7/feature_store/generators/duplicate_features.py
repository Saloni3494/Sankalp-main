"""
Phase 3 / 5 — Duplicate Pair Feature Generator.
Calculates pairwise text, amount, temporal, and metadata similarity features.
Enforces Rule 18: Cross-House similarity alone is NOT labeled duplicate.
"""

from typing import Dict, Any, Optional
from difflib import SequenceMatcher
import numpy as np


def compute_duplicate_pair_features(work1: Dict[str, Any], work2: Dict[str, Any]) -> Dict[str, float]:
    """
    Computes pairwise feature vector between work1 and work2.
    Classes: SAME, DIFFERENT, AMBIGUOUS.
    """
    feats: Dict[str, float] = {}

    desc1 = str(work1.get("work_description") or work1.get("work_name_raw") or "").lower()
    desc2 = str(work2.get("work_description") or work2.get("work_name_raw") or "").lower()

    # Text description similarity
    text_sim = SequenceMatcher(None, desc1, desc2).ratio() if (desc1 and desc2) else 0.0
    feats["semantic_similarity"] = float(text_sim)

    # Metadata matching
    feats["same_house"] = 1.0 if work1.get("parliament_house") == work2.get("parliament_house") else 0.0
    feats["same_MP"] = 1.0 if (work1.get("mp_name_raw") and work1.get("mp_name_raw") == work2.get("mp_name_raw")) else 0.0
    feats["same_IDA"] = 1.0 if (work1.get("ida") and work1.get("ida") == work2.get("ida")) else 0.0
    feats["same_state"] = 1.0 if (work1.get("state") and work1.get("state") == work2.get("state")) else 0.0
    feats["same_category"] = 1.0 if (work1.get("work_category") and work1.get("work_category") == work2.get("work_category")) else 0.0

    # Amount similarity ratio: min(a1, a2) / max(a1, a2)
    a1 = float(work1.get("sanction_amount") or work1.get("recommended_amount") or 0.0)
    a2 = float(work2.get("sanction_amount") or work2.get("recommended_amount") or 0.0)
    if a1 > 0 and a2 > 0:
        feats["amount_similarity"] = float(min(a1, a2) / max(a1, a2))
    else:
        feats["amount_similarity"] = 0.0

    # Date distance
    d1 = work1.get("recommendation_date") or work1.get("sanction_date")
    d2 = work2.get("recommendation_date") or work2.get("sanction_date")
    if d1 and d2:
        try:
            days = abs((pd.to_datetime(d1) - pd.to_datetime(d2)).days)
            feats["date_distance_days"] = float(days)
        except Exception:
            feats["date_distance_days"] = -1.0
    else:
        feats["date_distance_days"] = -1.0

    # Cross-house similarity indicator
    feats["is_cross_house"] = 1.0 if feats["same_house"] == 0.0 else 0.0

    return feats


import pandas as pd
