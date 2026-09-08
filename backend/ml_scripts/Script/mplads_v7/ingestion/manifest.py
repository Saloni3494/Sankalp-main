"""
Phase 1 — Ingestion Manifest & Hashing Module.
Maintains formal ingestion manifests, calculates file/schema hashes,
and attaches source provenance metadata to every ingested record.
Raw files remain strictly immutable.
"""

import os
import hashlib
import json
from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple, Optional
import pandas as pd


# Explicit Mapping of expected files to House and Logical Dataset
DATASET_MAP = {
    os.path.join("lok-sabha", "Allocated Limit for Honble MPs.csv"): ("LOK_SABHA", "ALLOCATION"),
    os.path.join("lok-sabha", "Amount consented for Calamity.csv"): ("LOK_SABHA", "CALAMITY"),
    os.path.join("lok-sabha", "Expenditure on Completed and On-going Works as on Date.csv"): ("LOK_SABHA", "EXPENDITURE"),
    os.path.join("lok-sabha", "Works Recommended.csv"): ("LOK_SABHA", "RECOMMENDED"),
    os.path.join("lok-sabha", "Works Sanctioned.csv"): ("LOK_SABHA", "SANCTIONED"),
    os.path.join("lok-sabha", "Works_Completed_UPDATED.csv"): ("LOK_SABHA", "COMPLETED"),
    os.path.join("rajya-sabha", "Allocated Limit for Honble MPs.csv"): ("RAJYA_SABHA", "ALLOCATION"),
    os.path.join("rajya-sabha", "Amount consented for Calamity.csv"): ("RAJYA_SABHA", "CALAMITY"),
    os.path.join("rajya-sabha", "Expenditure on Completed and On-going Works as on Date.csv"): ("RAJYA_SABHA", "EXPENDITURE"),
    os.path.join("rajya-sabha", "Works Completed_MAPPED.csv"): ("RAJYA_SABHA", "COMPLETED"),
    os.path.join("rajya-sabha", "Works Recommended.csv"): ("RAJYA_SABHA", "RECOMMENDED"),
    os.path.join("rajya-sabha", "Works Sanctioned.csv"): ("RAJYA_SABHA", "SANCTIONED"),
}


@dataclass
class IngestionManifestEntry:
    actual_filename: str
    house: str
    logical_dataset: str
    file_hash: str
    schema_hash: str
    row_count_raw: int
    row_count_clean: int
    ingestion_batch_id: str
    dataset_version: str


def compute_file_hash(filepath: str) -> str:
    """Computes SHA256 hash of immutable raw file."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def compute_schema_hash(df: pd.DataFrame) -> str:
    """Computes SHA256 hash of DataFrame column structure and types."""
    schema_repr = [(col, str(df[col].dtype)) for col in df.columns]
    schema_str = json.dumps(schema_repr, sort_keys=True)
    return hashlib.sha256(schema_str.encode("utf-8")).hexdigest()


class IngestionManifestManager:
    """Manages creation, validation, and storage of ingestion manifests."""

    def __init__(self, dataset_root: str, dataset_version: str = "7.0.0", batch_id: str = "BATCH_001"):
        self.dataset_root = os.path.abspath(dataset_root)
        self.dataset_version = dataset_version
        self.batch_id = batch_id
        self.entries: Dict[str, IngestionManifestEntry] = {}

    def register_file(
        self,
        rel_path: str,
        house: str,
        logical_dataset: str,
        df_raw: pd.DataFrame,
        df_clean: pd.DataFrame,
    ) -> IngestionManifestEntry:
        full_path = os.path.join(self.dataset_root, rel_path)
        file_hash = compute_file_hash(full_path)
        schema_hash = compute_schema_hash(df_raw)

        entry = IngestionManifestEntry(
            actual_filename=os.path.basename(rel_path),
            house=house,
            logical_dataset=logical_dataset,
            file_hash=file_hash,
            schema_hash=schema_hash,
            row_count_raw=len(df_raw),
            row_count_clean=len(df_clean),
            ingestion_batch_id=self.batch_id,
            dataset_version=self.dataset_version,
        )
        self.entries[rel_path] = entry
        return entry

    def attach_provenance(
        self,
        df: pd.DataFrame,
        rel_path: str,
        house: str,
        logical_dataset: str
    ) -> pd.DataFrame:
        """Attaches non-negotiable provenance columns to every record."""
        df = df.copy()
        df["source_file"] = os.path.basename(rel_path)
        df["source_row_id"] = [f"{os.path.basename(rel_path)}_ROW_{i}" for i in range(len(df))]
        df["parliament_house"] = house
        df["dataset_type"] = logical_dataset
        return df

    def export_manifest(self) -> List[Dict]:
        return [asdict(entry) for entry in self.entries.values()]
