"""
Reconciliation: link each work across Recommended -> Sanctioned -> Completed -> Expenditure
via work_id. Missing links are tracked explicitly as a lifecycle_coverage field --
NEVER silently treated as "did not happen".
"""

import pandas as pd


def build_master_table(datasets: dict, prediction_time: pd.Timestamp = None) -> pd.DataFrame:
    """
    Build one row per Work ID (from Completed, since that's our primary analysis population),
    with lifecycle coverage flags showing whether it also appears in Recommended/Sanctioned,
    and aggregated expenditure/vendor info where available.
    Filters out any data available after prediction_time to prevent leakage.
    """
    def filter_future(df):
        if df is None or prediction_time is None or "available_at" not in df.columns:
            return df
        return df[df["available_at"].isna() | (df["available_at"] <= prediction_time)]

    completed = filter_future(datasets.get("completed"))
    if completed is None or completed.empty:
        raise ValueError("Works Completed dataset is required as the base population")

    master = completed.copy()

    # --- Sanctioned lookup: bring in sanction_date / sanction_amount if the file exists ---
    sanctioned = filter_future(datasets.get("sanctioned"))
    if sanctioned is not None and "work_id" in sanctioned.columns and "parliament_house" in sanctioned.columns:
        sanc_cols = [c for c in ["parliament_house", "work_id", "sanction_date", "sanction_amount"] if c in sanctioned.columns]
        master = master.merge(
            sanctioned[sanc_cols].drop_duplicates(subset=["parliament_house", "work_id"]),
            on=["parliament_house", "work_id"], how="left", suffixes=("", "_sanc")
        )
        sanc_keys = set(zip(sanctioned["parliament_house"], sanctioned["work_id"]))
        master["in_sanctioned"] = master.apply(lambda r: (r["parliament_house"], r["work_id"]) in sanc_keys, axis=1)
    else:
        master["sanction_date"] = pd.NaT
        master["sanction_amount"] = None
        master["in_sanctioned"] = False

    # --- Recommended lookup: just coverage check (used to distinguish real gap vs data-export gap) ---
    recommended = filter_future(datasets.get("recommended"))
    if recommended is not None and "work_id" in recommended.columns and "parliament_house" in recommended.columns:
        rec_keys = set(zip(recommended["parliament_house"], recommended["work_id"]))
        master["in_recommended"] = master.apply(lambda r: (r["parliament_house"], r["work_id"]) in rec_keys, axis=1)
    else:
        master["in_recommended"] = None  # unknown, since file not supplied

    # --- Expenditure aggregation: vendor count, payment count, total paid ---
    expenditure = filter_future(datasets.get("expenditure"))
    if expenditure is not None and "work_id" in expenditure.columns and "parliament_house" in expenditure.columns:
        if "payment_amount" in expenditure.columns:
            expenditure["payment_amount"] = pd.to_numeric(expenditure["payment_amount"], errors="coerce").fillna(0)
        agg = expenditure.groupby(["parliament_house", "work_id"]).agg(
            vendor_count=("vendor_name", "nunique") if "vendor_name" in expenditure.columns else ("work_id", "size"),
            payment_count=("work_id", "size"),
            total_paid=("payment_amount", "sum") if "payment_amount" in expenditure.columns else ("work_id", "size"),
        ).reset_index()
        master = master.merge(agg, on=["parliament_house", "work_id"], how="left")
    else:
        master["vendor_count"] = None
        master["payment_count"] = None
        master["total_paid"] = None

    # --- Lifecycle coverage classification (never Boolean-collapsed to "fraud") ---
    def coverage_label(row):
        if row.get("in_sanctioned") is True:
            return "OBSERVED"
        if row.get("in_recommended") is True:
            return "MISSING_SANCTION_BUT_IN_RECOMMENDED"  # likely export-window gap, not fraud
        if row.get("in_recommended") is False:
            return "MISSING_FROM_ALL_UPSTREAM"  # worth a closer (but not accusatory) look
        return "UNKNOWN_DUE_TO_COVERAGE"  # recommended file wasn't even supplied

    master["lifecycle_coverage"] = master.apply(coverage_label, axis=1)

    return master
