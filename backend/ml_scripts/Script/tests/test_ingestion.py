"""
Tests for Phase 1 — Ingestion, Quality Gates, and Adapters.
"""

import os
import pytest
import pandas as pd
from mplads_v7.ingestion.manifest import IngestionManifestManager, compute_file_hash
from mplads_v7.ingestion.quality_gates import remove_grand_totals, parse_monetary_amount, parse_date_series, run_quality_gates, QualityGateError
from mplads_v7.ingestion.adapters import LokSabhaAdapter, RajyaSabhaAdapter, UNAVAILABLE
from mplads_v7.ingestion.pipeline import ingest_all_datasets


def test_remove_grand_totals():
    data = {
        "Sr. No.": [1, 2, "Grand Total"],
        "State": ["Bihar", "Punjab", "Total"],
        "Work": ["Road construct", "School room", "Grand Total Summary"],
        "Amount": [1000, 2000, 3000]
    }
    df = pd.DataFrame(data)
    clean_df, removed = remove_grand_totals(df, "TEST")
    assert removed == 1
    assert len(clean_df) == 2
    assert "Grand Total" not in clean_df["Sr. No."].values


def test_parse_monetary_amount():
    s = pd.Series(["₹ 1,50,000", "50000.50", "N/A", "-", None])
    parsed = parse_monetary_amount(s, "amount")
    assert parsed[0] == 150000.0
    assert parsed[1] == 50000.50
    assert pd.isna(parsed[2])
    assert pd.isna(parsed[3])


def test_rajya_sabha_constituency_adapter():
    data = {
        "Work category": ["Normal/Others"],
        "WORK": ["Test Work"],
        "State": ["Delhi"],
        "IDA": ["DELHI_IDA"],
        "Hon'ble Members of Parliament": ["Test MP"],
        "Elected/Nominated": ["Nominated MP"],
        "Work description": ["Desc"],
        "Recommended date": ["2024-01-01"],
        "RECOMMENDED AMOUNT   ( ₹ )": [100000.0],
        "Sanction Date": ["2024-02-01"]
    }
    df = pd.DataFrame(data)
    adapter = RajyaSabhaAdapter()
    adapted_df = adapter.adapt(df, "RECOMMENDED")
    assert "constituency" in adapted_df.columns
    assert adapted_df["constituency"].iloc[0] == UNAVAILABLE


def test_ingest_all_datasets(tmp_path):
    dataset_root = "."
    cleaned_datasets, manifest = ingest_all_datasets(dataset_root)
    assert len(manifest) == 12
    assert len(cleaned_datasets) == 12
    
    rs_rec = cleaned_datasets["RAJYA_SABHA_RECOMMENDED"]
    assert (rs_rec["constituency"] == UNAVAILABLE).all()
    assert "source_file" in rs_rec.columns
    assert "source_row_id" in rs_rec.columns
    assert "parliament_house" in rs_rec.columns
    assert "dataset_type" in rs_rec.columns
