"""
Unsupervised ML anomaly detection: Isolation Forest on numeric features,
grouped by work_category (and house-aware, since Lok Sabha / Rajya Sabha
populations are never pooled for peer statistics -- see v7 doc principle).
No labels needed -- this is genuinely unsupervised, trains in seconds.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest


NUMERIC_FEATURES = ["amount_disbursed", "days_to_complete", "vendor_count", "payment_count"]


def flag_ml_anomalies(df: pd.DataFrame, contamination: float = 0.05) -> pd.DataFrame:
    df = df.copy()
    df["ml_anomaly"] = False
    df["ml_anomaly_score"] = np.nan

    features_present = [f for f in NUMERIC_FEATURES if f in df.columns]
    if not features_present:
        return df

    # Fill NaN peer-group keys with an explicit label -- groupby silently DROPS rows
    # with NaN keys otherwise, which would quietly lose works from scoring.
    group_cols = [c for c in ["work_category", "parliament_house"] if c in df.columns]
    for c in group_cols:
        df[c] = df[c].fillna("UNKNOWN")
    if not group_cols:
        group_cols = None

    def score_group(group_df: pd.DataFrame):
        """Returns (index, anomaly_flags, anomaly_scores) for one peer group -- never
        returns the full group frame, so grouping columns can't get silently dropped
        by pandas' groupby-apply column handling."""
        X = group_df[features_present].apply(pd.to_numeric, errors="coerce")
        X = X.fillna(X.median(numeric_only=True)).fillna(0)
        if len(group_df) < 10 or X.shape[1] == 0:
            return group_df.index, pd.Series(False, index=group_df.index), pd.Series(np.nan, index=group_df.index)
        model = IsolationForest(contamination=contamination, random_state=42)
        preds = model.fit_predict(X)
        scores = model.decision_function(X)
        return group_df.index, pd.Series(preds == -1, index=group_df.index), pd.Series(scores, index=group_df.index)

    if group_cols:
        groups = df.groupby(group_cols).groups  # dict of group-key -> index array, keys never dropped now (no NaN)
        for key, idx in groups.items():
            _, flags, scores = score_group(df.loc[idx])
            df.loc[idx, "ml_anomaly"] = flags
            df.loc[idx, "ml_anomaly_score"] = scores
    else:
        _, flags, scores = score_group(df)
        df["ml_anomaly"] = flags
        df["ml_anomaly_score"] = scores

    return df
