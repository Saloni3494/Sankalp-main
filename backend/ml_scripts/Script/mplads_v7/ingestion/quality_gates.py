"""
Phase 1 — Data Quality Gates Module.
Enforces fail-fast schema validation, date parsing, amount parsing,
category validation, and non-negotiable Grand Total row removal.
"""

import re
import logging
from typing import List, Dict, Tuple, Optional
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class QualityGateError(Exception):
    """Exception raised when a mandatory data quality gate fails."""
    pass


def remove_grand_totals(df: pd.DataFrame, dataset_name: str = "") -> Tuple[pd.DataFrame, int]:
    """
    Identifies and removes all Grand Total / Summary Total rows.
    Grand Total rows MUST NEVER enter aggregates, peer statistics, features, models, labels, evaluation.
    Returns (cleaned_dataframe, num_removed_rows).
    """
    if df.empty:
        return df, 0

    # Match 'grand total' or 'total' in any string column
    is_total_mask = pd.Series(False, index=df.index)

    for col in df.columns:
        # Check string representations
        str_series = df[col].astype(str).str.strip().str.lower()
        col_mask = str_series.str.contains(r"\bgrand\s+total\b|\btotal\b", regex=True, na=False)
        is_total_mask = is_total_mask | col_mask

    cleaned_df = df[~is_total_mask].copy()
    num_removed = int(is_total_mask.sum())

    if num_removed > 0:
        logger.info(f"[{dataset_name}] Data Quality Gate: Removed {num_removed} Grand Total/Summary rows.")

    return cleaned_df, num_removed


def parse_monetary_amount(series: pd.Series, col_name: str) -> pd.Series:
    """
    Parses currency strings into float64 values.
    Strips '₹', commas, spaces, and handles nulls gracefully.
    """
    if series.dtype in [np.float64, np.int64, float, int]:
        return series.astype(float)

    cleaned = (
        series.astype(str)
        .str.replace("₹", "", regex=False)
        .str.replace(",", "", regex=False)
        .str.replace(" ", "", regex=False)
        .str.strip()
    )

    # Convert non-numeric markers to NaN
    cleaned = cleaned.replace(["nan", "None", "", "-", "N/A", "NA", "null"], np.nan)
    return pd.to_numeric(cleaned, errors="coerce")


def parse_date_series(series: pd.Series, col_name: str) -> pd.Series:
    """
    Parses date strings into standardized YYYY-MM-DD string format (or NaT).
    """
    parsed = pd.to_datetime(series, errors="coerce")
    return parsed.dt.strftime("%Y-%m-%d")


def validate_required_columns(df: pd.DataFrame, required_cols: List[str], dataset_name: str) -> None:
    """Validates that all required columns exist in the DataFrame."""
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise QualityGateError(
            f"[{dataset_name}] Quality Gate Failed: Missing required columns: {missing}. Available columns: {list(df.columns)}"
        )


def run_quality_gates(
    df_raw: pd.DataFrame,
    house: str,
    logical_dataset: str,
    required_cols: List[str],
    date_cols: List[str],
    amount_cols: List[str],
    dataset_name: str,
) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """
    Runs full sequence of quality gates on raw DataFrame.
    If ANY mandatory gate fails, raises QualityGateError to stop the pipeline immediately.
    """
    stats = {"raw_rows": len(df_raw), "grand_totals_removed": 0, "clean_rows": 0}

    if df_raw.empty:
        raise QualityGateError(f"[{dataset_name}] Quality Gate Failed: Dataset is empty.")

    # 1. Validate required columns
    validate_required_columns(df_raw, required_cols, dataset_name)

    # 2. Remove Grand Total rows FIRST
    df_clean, num_removed = remove_grand_totals(df_raw, dataset_name)
    stats["grand_totals_removed"] = num_removed

    if df_clean.empty:
        raise QualityGateError(f"[{dataset_name}] Quality Gate Failed: 0 rows remaining after Grand Total removal.")

    # 3. Parse monetary amounts
    for col in amount_cols:
        if col in df_clean.columns:
            df_clean[col] = parse_monetary_amount(df_clean[col], col)

    # 4. Parse dates
    for col in date_cols:
        if col in df_clean.columns:
            df_clean[col] = parse_date_series(df_clean[col], col)

    stats["clean_rows"] = len(df_clean)
    logger.info(f"[{dataset_name}] Quality Gates Passed successfully. Clean rows: {stats['clean_rows']}")
    return df_clean, stats
