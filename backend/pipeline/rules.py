"""
Rule-based detection modules: compliance, delay, utilization.
Each returns the master DataFrame with new boolean/flag columns added.
"""

import pandas as pd
from .config import DELAY_NORM_DAYS, UNDERUTILIZATION_THRESHOLD


def flag_missing_photo(df: pd.DataFrame) -> pd.DataFrame:
    """Flag completed works with no photo evidence. Weight higher if disbursement is high."""
    df = df.copy()
    df["missing_photo"] = df["image"].isna() | (df["image"].astype(str).str.strip().isin(["", "N/A", "NaN"]))

    if "amount_disbursed" in df.columns:
        amounts = pd.to_numeric(df["amount_disbursed"], errors="coerce")
        p75 = amounts.quantile(0.75)
        df["high_value_missing_photo"] = df["missing_photo"] & (amounts >= p75)
    else:
        df["high_value_missing_photo"] = False

    return df


def flag_delay(df: pd.DataFrame, prediction_time: pd.Timestamp = None) -> pd.DataFrame:
    """
    Flag works that breached the DELAY_NORM_DAYS (default 365) norm.
    Handles both: (a) completed late, (b) not yet completed and already overdue.
    Requires sanction_date; if missing, is_delayed is set to None (unknown), never False.
    """
    df = df.copy()
    completion_dt = pd.to_datetime(df.get("completion_date"), errors="coerce", dayfirst=False)
    sanction_dt = pd.to_datetime(df.get("sanction_date"), errors="coerce")

    has_sanction = sanction_dt.notna()
    days_to_complete = (completion_dt - sanction_dt).dt.days

    is_delayed = pd.Series(None, index=df.index, dtype="object")
    # Case A: has both dates -> straightforward
    completed_case = has_sanction & completion_dt.notna()
    is_delayed.loc[completed_case] = days_to_complete.loc[completed_case] > DELAY_NORM_DAYS

    # Case B: has sanction date, no completion date recorded (still ongoing) -> check age
    ongoing_case = has_sanction & completion_dt.isna()
    today = prediction_time if prediction_time is not None else pd.Timestamp.today()
    age_days = (today - sanction_dt).dt.days
    is_delayed.loc[ongoing_case] = age_days.loc[ongoing_case] > DELAY_NORM_DAYS

    # Case C: no sanction date at all -> unknown, NOT False
    df["is_delayed"] = is_delayed
    df["days_to_complete"] = days_to_complete
    return df


def flag_underutilization(df: pd.DataFrame) -> pd.DataFrame:
    """
    Flag COMPLETED works where disbursed amount is far below sanctioned amount.
    Note: this deliberately only applies to completed works, where full payment is
    expected by definition -- a completed work below the threshold is a genuinely
    unusual signal. Ongoing (not-yet-completed) works are NOT flagged here, since
    partial disbursement on an in-progress work is normal, not a red flag
    (see flag_ongoing_utilization_trajectory for the correctly-scoped version of that check).
    """
    df = df.copy()
    if "sanction_amount" not in df.columns:
        df["is_underutilized"] = None
        return df

    sanction_amt = pd.to_numeric(df["sanction_amount"], errors="coerce")
    disbursed_amt = pd.to_numeric(df.get("amount_disbursed"), errors="coerce")

    ratio = disbursed_amt / sanction_amt
    df["utilization_ratio"] = ratio
    df["is_underutilized"] = (sanction_amt.notna()) & (ratio < UNDERUTILIZATION_THRESHOLD)
    return df


def flag_ongoing_utilization_trajectory(sanctioned_df: pd.DataFrame, expenditure_df: pd.DataFrame, completed_work_keys: set) -> pd.DataFrame:
    """
    Separate, correctly-scoped check: among SANCTIONED works that are NOT yet completed,
    compute current spend-to-sanction ratio as an informational trajectory metric only --
    never labeled as an anomaly/red flag by itself, per the v7 principle of not treating
    an in-progress work's partial spending as suspicious.
    """
    if sanctioned_df is None or expenditure_df is None or sanctioned_df.empty:
        return pd.DataFrame()

    ongoing = sanctioned_df[~sanctioned_df.apply(lambda r: (r["parliament_house"], r["work_id"]) in completed_work_keys, axis=1)].copy()
    if ongoing.empty:
        return pd.DataFrame()
        
    exp = expenditure_df.copy()
    exp["payment_amount"] = pd.to_numeric(exp["payment_amount"], errors="coerce").fillna(0)
    spend = exp.groupby(["parliament_house", "work_id"])["payment_amount"].sum().rename("current_spend")
    ongoing = ongoing.merge(spend, on=["parliament_house", "work_id"], how="left")
    ongoing["current_spend"] = ongoing["current_spend"].fillna(0)

    sanction_amt = pd.to_numeric(ongoing["sanction_amount"], errors="coerce")
    ongoing["spend_trajectory_ratio"] = ongoing["current_spend"] / sanction_amt
    # NOT flagged as an anomaly -- informational only, for the dashboard's "in progress" view
    return ongoing[["parliament_house", "work_id", "sanction_amount", "current_spend", "spend_trajectory_ratio"]]

def flag_impossible_dates(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    impossible = pd.Series(False, index=df.index)
    
    if "sanction_date" in df.columns and "completion_date" in df.columns:
        sanc = pd.to_datetime(df["sanction_date"], errors="coerce")
        comp = pd.to_datetime(df["completion_date"], errors="coerce", dayfirst=False)
        impossible = impossible | (comp < sanc)
        
    if "sanction_date" in df.columns and "recommended_date" in df.columns:
        sanc = pd.to_datetime(df["sanction_date"], errors="coerce")
        rec = pd.to_datetime(df["recommended_date"], errors="coerce")
        impossible = impossible | (sanc < rec)
        
    df["impossible_dates"] = impossible.fillna(False)
    return df

def flag_invalid_amounts(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    sanc = pd.to_numeric(df.get("sanction_amount"), errors="coerce").fillna(0)
    disb = pd.to_numeric(df.get("amount_disbursed"), errors="coerce").fillna(0)
    
    invalid = (sanc < 0) | (disb < 0) | (disb > sanc * 1.5) # Allow some overhead, but not ridiculous
    df["invalid_amounts"] = invalid
    return df

def apply_all_rules(df: pd.DataFrame, prediction_time: pd.Timestamp = None) -> pd.DataFrame:
    df = flag_missing_photo(df)
    df = flag_delay(df, prediction_time=prediction_time)
    df = flag_underutilization(df)
    df = flag_impossible_dates(df)
    df = flag_invalid_amounts(df)
    return df
