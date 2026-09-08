"""
Phase 1 — Ingestion Pipeline Orchestrator.
Loads all 12 CSV datasets, executes quality gates, applies house adapters,
creates ingestion manifest, attaches provenance metadata, and returns clean datasets.
"""

import os
import logging
from typing import Dict, List, Tuple
import pandas as pd

from mplads_v7.ingestion.manifest import IngestionManifestManager, DATASET_MAP
from mplads_v7.ingestion.quality_gates import run_quality_gates, QualityGateError
from mplads_v7.ingestion.adapters import get_adapter

logger = logging.getLogger(__name__)

# Required columns per logical dataset
REQUIRED_COLS_MAP = {
    "ALLOCATION": ["State", "Hon'ble Members of Parliament"], # handled flexibly for Parliaments vs Parliament
    "CALAMITY": ["Calamity Type", "Calamity Name", "Hon'ble Members of Parliament"],
    "EXPENDITURE": ["State", "Work", "IDA", "Hon'ble Members of Parliament"],
    "RECOMMENDED": ["State", "IDA", "Hon'ble Members of Parliament"],
    "SANCTIONED": ["State", "IDA", "Hon'ble Members of Parliament"],
    "COMPLETED": ["State", "IDA", "Hon'ble Members of Parliament"],
}

# Date columns per logical dataset
DATE_COLS_MAP = {
    "ALLOCATION": [],
    "CALAMITY": ["Date of Consent"],
    "EXPENDITURE": ["Expenditure Date"],
    "RECOMMENDED": ["Recommended date", "Sanction Date"],
    "SANCTIONED": ["Recommended date", "Sanction Date"],
    "COMPLETED": ["Completion Date"],
}

# Amount columns per logical dataset
AMOUNT_COLS_MAP = {
    "ALLOCATION": ["Allocated AMOUNT ( ₹ )"],
    "CALAMITY": ["Consent Amount ( ₹ )"],
    "EXPENDITURE": ["Fund Disbursed Amount ( ₹ )"],
    "RECOMMENDED": ["RECOMMENDED AMOUNT   ( ₹ )"],
    "SANCTIONED": ["Sanction Amount ( ₹ )"],
    "COMPLETED": ["Amount Disbursed ( ₹ )"],
}


def ingest_all_datasets(
    dataset_root: str,
    dataset_version: str = "7.0.0",
    batch_id: str = "BATCH_001"
) -> Tuple[Dict[str, pd.DataFrame], List[Dict]]:
    """
    Ingests, cleans, adapts, and registers all 12 raw CSV datasets.
    Returns (dict_of_cleaned_dataframes, manifest_list).
    """
    dataset_root = os.path.abspath(dataset_root)
    manifest_mgr = IngestionManifestManager(dataset_root, dataset_version, batch_id)
    cleaned_datasets: Dict[str, pd.DataFrame] = {}

    logger.info(f"Starting Phase 1 Ingestion across 12 CSV files from: {dataset_root}")

    for rel_path, (house, logical_dataset) in DATASET_MAP.items():
        full_path = os.path.join(dataset_root, rel_path)
        if not os.path.exists(full_path):
            raise QualityGateError(f"Missing mandatory raw CSV file: {full_path}")

        df_raw = pd.read_csv(full_path)
        dataset_key = f"{house}_{logical_dataset}"

        # Adjust required columns check for Allocation file column variation
        required_cols = list(REQUIRED_COLS_MAP.get(logical_dataset, []))
        if logical_dataset == "ALLOCATION" and "Hon'ble Members of Parliaments" in df_raw.columns:
            required_cols = ["State", "Hon'ble Members of Parliaments"]

        date_cols = DATE_COLS_MAP.get(logical_dataset, [])
        amount_cols = AMOUNT_COLS_MAP.get(logical_dataset, [])

        # 1. Run quality gates (Schema check, Grand Total removal, date & amount parsing)
        df_clean, stats = run_quality_gates(
            df_raw=df_raw,
            house=house,
            logical_dataset=logical_dataset,
            required_cols=required_cols,
            date_cols=date_cols,
            amount_cols=amount_cols,
            dataset_name=dataset_key,
        )

        # 2. Apply house-specific adapter
        adapter = get_adapter(house)
        df_adapted = adapter.adapt(df_clean, logical_dataset)

        # 3. Attach source provenance columns
        df_adapted = manifest_mgr.attach_provenance(df_adapted, rel_path, house, logical_dataset)

        # 4. Register in manifest
        manifest_mgr.register_file(
            rel_path=rel_path,
            house=house,
            logical_dataset=logical_dataset,
            df_raw=df_raw,
            df_clean=df_adapted,
        )

        cleaned_datasets[dataset_key] = df_adapted

    manifest_list = manifest_mgr.export_manifest()
    logger.info(f"Phase 1 Ingestion Complete. Registered {len(manifest_list)} source files.")
    return cleaned_datasets, manifest_list
