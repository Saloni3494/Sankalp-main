"""
Central config: expected filenames and column mappings for each MPLADS dataset type.
Column names below are taken EXACTLY from the real Lok Sabha CSV exports (Aug 2026 batch).
Add Rajya Sabha filenames once available -- update RS_FILENAMES if their names differ.
"""

import re

DELAY_NORM_DAYS = 365
UNDERUTILIZATION_THRESHOLD = 0.5  # spent < 50% of sanctioned = flagged
DUPLICATE_SIMILARITY_THRESHOLD = 0.75

WEIGHTS = {
    "missing_photo": 25,
    "high_value_missing_photo_bonus": 10,
    "is_delayed": 25,
    "is_duplicate_candidate": 25,
    "is_underutilized": 15,
    "ml_anomaly": 10,
    "impossible_dates": 30,
    "invalid_amounts": 30,
}

# Real filenames as exported from the portal (Lok Sabha). Update the RS dict once those land.
LS_FILENAMES = {
    "recommended": "Works_Recommended.csv",
    "sanctioned": "Works_Sanctioned.csv",
    "completed": "Works_Completed.csv",
    "expenditure": "Expenditure.csv",
    "allocation": "Allocated_Limit.csv",
    "calamity": "Calamity.csv",
}

RS_FILENAMES = {
    "recommended": "RS_Works_Recommended.csv",
    "sanctioned": "RS_Works_Sanctioned.csv",
    "completed": "RS_Works_Completed.csv",
    "expenditure": "RS_Expenditure.csv",
    "allocation": "RS_Allocated_Limit.csv",
    "calamity": "RS_Calamity.csv",
}

# The Work ID is embedded at the start of the "Work"/"WORK" column, e.g.
# "WS/MP418/2024-2025/133409-Construction of roads..." but some exports have a
# stray tab/space glued in, e.g. "WS/\t MP620/2024-2025/133166-...". We match loosely
# then strip all whitespace from the captured ID so both forms normalize identically.
WORK_ID_PATTERN = re.compile(r"^([A-Za-z]+\s*/\s*MP\s*\d+\s*/\s*\d{4}-\d{4}\s*/\s*\d+)")


def extract_work_id(work_field) -> str:
    """Pull the canonical Work ID out of the 'Work'/'WORK' column and normalize whitespace."""
    if not isinstance(work_field, str):
        return None
    m = WORK_ID_PATTERN.match(work_field.strip())
    if not m:
        return None
    return re.sub(r"\s+", "", m.group(1))


def normalize_work_id(work_id) -> str:
    """For datasets that already have a dedicated Work ID column (e.g. Expenditure) --
    just strip stray whitespace so it matches IDs extracted from the 'Work' column elsewhere."""
    if not isinstance(work_id, str):
        return None
    return re.sub(r"\s+", "", work_id.strip())


# Column name normalization map: raw CSV column -> canonical internal name.
# Covers both "Work category"/"Work Category" and "Work description"/"Work Description"
# variants seen across the different export files.
CANONICAL_COLUMNS = {
    "Sr. No.": "sr_no",
    "Work category": "work_category",
    "Work Category": "work_category",
    "WORK": "work_raw",
    "Work": "work_raw",
    "State": "state",
    "IDA": "ida",
    "Hon'ble Members of Parliament": "mp_name",
    "Hon'ble Members of Parliaments": "mp_name",
    "Constituency": "constituency",
    "Work description": "work_description",
    "Work Description": "work_description",
    "Recommended date": "recommended_date",
    "RECOMMENDED AMOUNT   ( ₹ )": "recommended_amount",
    "Sanction Date": "sanction_date",
    "Sanction Amount ( ₹ )": "sanction_amount",
    "Work Status": "work_status",
    "Image": "image",
    "Completion Date": "completion_date",
    "Amount Disbursed ( ₹ )": "amount_disbursed",
    "Allocated AMOUNT ( ₹ )": "allocated_amount",
    "Calamity Type": "calamity_type",
    "Calamity Name": "calamity_name",
    "Date of Consent": "consent_date",
    "Consent Amount ( ₹ )": "consent_amount",
    "Work ID": "work_id_raw",
    "Expenditure Date": "expenditure_date",
    "Vendor Name": "vendor_name",
    "Payment Status": "payment_status",
    "Fund Disbursed Amount ( ₹ )": "payment_amount",
}
