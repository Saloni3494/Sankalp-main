"""
Tests for Phase 2 — Canonical Data Model, Work-ID Parsing, and Lifecycle Reconstruction.
"""

import pytest
import pandas as pd
from mplads_v7.canonical.entities import (
    CanonicalWorkIdentity,
    ExtractionStatus,
    LifecycleStatus,
    WorkLifecycle,
)
from mplads_v7.canonical.work_id_parser import parse_work_id
from mplads_v7.canonical.lifecycle import LifecycleReconstructor, compute_date_difference_days
from mplads_v7.ingestion.adapters import UNAVAILABLE


def test_work_id_parser_exact():
    res = parse_work_id("WS/MP418/2024-2025/133409")
    assert res.normalized_work_id == "WS/MP418/2024-2025/133409"
    assert res.work_id_extraction_status == ExtractionStatus.EXACT
    assert res.work_id_extraction_confidence == 1.0


def test_work_id_parser_embedded():
    res = parse_work_id("WS/MP418/2024-2025/133409-Construction of roads")
    assert res.normalized_work_id == "WS/MP418/2024-2025/133409"
    assert res.work_id_extraction_status == ExtractionStatus.NORMALIZED
    assert res.work_id_extraction_confidence == 0.95


def test_work_id_parser_ambiguous():
    res = parse_work_id("WS/MP123/2024-2025/100 and WS/MP456/2024-2025/200", fallback_row_idx="ROW_1")
    assert res.work_id_extraction_status == ExtractionStatus.AMBIGUOUS
    assert "AMBIGUOUS" in res.normalized_work_id


def test_compute_date_difference_days():
    assert compute_date_difference_days("2024-01-01", "2024-01-11") == 10.0
    assert compute_date_difference_days(None, "2024-01-11") is None
    assert compute_date_difference_days("invalid", "2024-01-11") is None


def test_lifecycle_reconstruction():
    reconstructor = LifecycleReconstructor()

    # Mock datasets
    rec_df = pd.DataFrame([{
        "parliament_house": "LOK_SABHA",
        "work_name_raw": "WS/MP100/2024-2025/555-Road Work",
        "state": "Maharashtra",
        "constituency": "PUNE",
        "ida": "PUNE_IDA",
        "mp_name_raw": "Test MP",
        "elected_or_nominated": "Elected MP",
        "recommended_date": "2024-01-01",
        "recommended_amount": 500000.0,
        "sanction_date": "2024-01-15",
        "source_row_id": "REC_1",
        "source_file": "rec.csv",
        "dataset_type": "RECOMMENDED"
    }])

    comp_df = pd.DataFrame([{
        "parliament_house": "LOK_SABHA",
        "work_name_raw": "WS/MP100/2024-2025/555-Road Work",
        "state": "Maharashtra",
        "constituency": "PUNE",
        "ida": "PUNE_IDA",
        "mp_name_raw": "Test MP",
        "elected_or_nominated": "Elected MP",
        "completion_date": "2024-06-01",
        "disbursed_amount": 490000.0,
        "image_path": "img.jpg",
        "source_row_id": "COMP_1",
        "source_file": "comp.csv",
        "dataset_type": "COMPLETED"
    }])

    datasets = {
        "LOK_SABHA_RECOMMENDED": rec_df,
        "LOK_SABHA_COMPLETED": comp_df,
    }

    lifecycles = reconstructor.process_all_datasets(datasets)
    key = ("LOK_SABHA", "WS/MP100/2024-2025/555")
    assert key in lifecycles

    lc = lifecycles[key]
    assert lc.recommendation_status == LifecycleStatus.OBSERVED
    assert lc.sanction_status == LifecycleStatus.OBSERVED
    assert lc.completion_status == LifecycleStatus.OBSERVED
    assert lc.expenditure_status == LifecycleStatus.NOT_OBSERVED

    assert lc.recommendation_date == "2024-01-01"
    assert lc.sanction_date == "2024-01-15"
    assert lc.completion_date == "2024-06-01"
    assert lc.recommendation_to_sanction_days == 14.0
    assert lc.sanction_to_completion_days == 138.0


def test_has_image_value():
    from mplads_v7.feature_store.generators.work_features import has_image_value

    assert has_image_value("/downloads/work_123.pdf") == 1
    assert has_image_value("some_image.jpg") == 1
    assert has_image_value("downloads/abc/page_1.png") == 1
    assert has_image_value("") == 0
    assert has_image_value("   ") == 0
    assert has_image_value("NA") == 0
    assert has_image_value("N/A") == 0
    assert has_image_value(None) == 0
    assert has_image_value("NULL") == 0
    assert has_image_value("Not Available") == 0
    assert has_image_value("NONE") == 0

    # Test non-existent file path on disk returns 1 because cell contains valid path string
    non_existent_path = "/downloads/non_existent_file_9999.pdf"
    assert has_image_value(non_existent_path) == 1

