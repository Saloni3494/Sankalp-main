"""
Risk scoring: weighted composite of all evidence signals, with an
explicit evidence breakdown per work (never a black-box number).
"""

import pandas as pd
from .config import WEIGHTS


def compute_risk_scores(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    def score_row(row):
        score = 0
        evidence = []

        if row.get("missing_photo") is True:
            score += WEIGHTS["missing_photo"]
            evidence.append("Missing photo evidence for a completed work")
            if row.get("high_value_missing_photo") is True:
                score += WEIGHTS["high_value_missing_photo_bonus"]
                evidence.append("High disbursement value with no photo proof")

        if row.get("is_delayed") is True:
            score += WEIGHTS["is_delayed"]
            evidence.append(f"Exceeded 1-year completion norm ({row.get('days_to_complete')} days)")

        if row.get("is_duplicate_candidate") is True or row.get("is_semantic_duplicate") is True:
            score += WEIGHTS["is_duplicate_candidate"]
            evidence.append("Matches another work on description/MP/amount/date")

        if row.get("is_underutilized") is True:
            score += WEIGHTS["is_underutilized"]
            evidence.append(f"Only {round((row.get('utilization_ratio') or 0) * 100)}% of sanctioned amount utilized")

        if row.get("ml_anomaly") is True:
            score += WEIGHTS["ml_anomaly"]
            evidence.append("Flagged as statistical outlier vs peer group (Isolation Forest)")

        if row.get("impossible_dates") is True:
            score += WEIGHTS["impossible_dates"]
            evidence.append("Impossible dates detected (e.g. completion before sanction)")

        if row.get("invalid_amounts") is True:
            score += WEIGHTS["invalid_amounts"]
            evidence.append("Invalid amount relationships detected (e.g. negative or disbursed > sanctioned)")

        return pd.Series({
            "risk_score": min(score, 100),
            "evidence": evidence,
            "evidence_count": len(evidence),
        })

    scored = df.apply(score_row, axis=1)
    df = pd.concat([df, scored], axis=1)

    # data completeness: how many of the core fields we needed were actually available
    core_fields = ["missing_photo", "is_delayed", "is_duplicate_candidate", "is_underutilized", "ml_anomaly", "impossible_dates", "invalid_amounts"]
    df["data_completeness"] = df[core_fields].notna().mean(axis=1)

    return df.sort_values("risk_score", ascending=False).reset_index(drop=True)
