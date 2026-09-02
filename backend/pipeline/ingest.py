"""
Ingestion layer: load raw CSVs, normalize columns, tag parliament_house,
extract canonical Work IDs. Designed to work even if some files are missing --
downstream modules degrade gracefully rather than crashing.
"""

import pandas as pd
from pathlib import Path
from .config import CANONICAL_COLUMNS, extract_work_id, normalize_work_id, LS_FILENAMES, RS_FILENAMES

RAW_DIR = Path(__file__).parent.parent / "data" / "raw"


def _load_csv(filename: str, house: str) -> pd.DataFrame | None:
    path = RAW_DIR / filename
    if not path.exists():
        print(f"[ingest] WARNING: {filename} not found, skipping ({house})")
        return None
    df = pd.read_csv(path, encoding="utf-8-sig", low_memory=False)
    df = df.rename(columns={c: CANONICAL_COLUMNS.get(c, c) for c in df.columns})
    df["parliament_house"] = house
    df["source_file"] = filename
    return df


def _remove_grand_total(df: pd.DataFrame) -> pd.DataFrame:
    """Drop the 'Grand Total' summary row that MPLADS exports always include,
    identifiable by the 'sr_no' (Sr. No.) column containing that text."""
    if df is None or "sr_no" not in df.columns:
        return df
    mask = df["sr_no"].astype(str).str.contains("Grand Total", case=False, na=False)
    return df[~mask].reset_index(drop=True)


def load_all(house: str = "Lok Sabha") -> dict:
    """Load all six dataset types for a given house using the real portal filenames."""
    filenames = LS_FILENAMES if house == "Lok Sabha" else RS_FILENAMES

    datasets = {key: _load_csv(fname, house) for key, fname in filenames.items()}

    for key, df in datasets.items():
        if df is None:
            continue
        df = _remove_grand_total(df)

        if "work_id_raw" in df.columns:
            # Expenditure file has a dedicated Work ID column -- prefer it over
            # trying to regex-extract an ID out of the plain-text 'Work' description column
            df["work_id"] = df["work_id_raw"].apply(normalize_work_id)
        elif "work_raw" in df.columns:
            df["work_id"] = df["work_raw"].apply(extract_work_id)

        # Temporal provenance
        date_col_map = {
            "completed": "completion_date",
            "sanctioned": "sanction_date",
            "recommended": "recommended_date",
            "expenditure": "expenditure_date",
            "calamity": "consent_date"
        }
        
        date_col = date_col_map.get(key)
        if date_col and date_col in df.columns:
            df["event_time"] = pd.to_datetime(df[date_col], errors="coerce", dayfirst=False)
            df["available_at"] = df["event_time"]  # Assume available immediately upon event
        else:
            df["event_time"] = pd.NaT
            df["available_at"] = pd.NaT

        datasets[key] = df

    return datasets


def load_combined(houses: list[str] = ("Lok Sabha", "Rajya Sabha")) -> dict:
    """Load and concatenate across houses. Missing houses are skipped with a warning."""
    combined = {k: [] for k in ["recommended", "sanctioned", "completed", "expenditure", "allocation", "calamity"]}
    for house in houses:
        house_data = load_all(house)
        for key, df in house_data.items():
            if df is not None:
                combined[key].append(df)

    result = {}
    for key, frames in combined.items():
        result[key] = pd.concat(frames, ignore_index=True) if frames else None
    return result
