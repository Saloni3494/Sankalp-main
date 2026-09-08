"""
Tests for Phase 3 — Temporal Boundary and Mandatory Leakage Suite.
"""

import pytest
from mplads_v7.feature_store.leakage_tests import (
    test_no_future_payment_leakage,
    test_no_future_completion_leakage,
    run_all_leakage_tests,
)
from mplads_v7.feature_store.registry import registry, PredictionPoint


def test_leakage_future_payment():
    test_no_future_payment_leakage("2024-06-01")


def test_leakage_future_completion():
    test_no_future_completion_leakage("2024-06-01")


def test_run_all_leakage_tests():
    run_all_leakage_tests()


def test_feature_registry_lookup():
    feats = registry.list_features(prediction_point=PredictionPoint.A_RECOMMENDATION)
    assert len(feats) > 0
    for f in feats:
        assert PredictionPoint.A_RECOMMENDATION in f.valid_prediction_points
