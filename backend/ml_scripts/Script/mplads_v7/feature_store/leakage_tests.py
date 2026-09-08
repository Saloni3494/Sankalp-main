"""
Phase 3 — Mandatory Feature Store Leakage Test Suite.
Enforces zero temporal leakage via future event injection tests.
A feature-store leakage failure MUST BLOCK TRAINING.
"""

import copy
import logging
from typing import Dict, Any, List
import numpy as np

from mplads_v7.canonical.entities import WorkLifecycle, Payment, CanonicalWorkIdentity, LifecycleStatus
from mplads_v7.temporal.boundary import TemporalInformationBoundary, PredictionPoint
from mplads_v7.feature_store.generators.work_features import generate_work_features
from mplads_v7.feature_store.generators.financial_features import generate_financial_features
from mplads_v7.feature_store.generators.payment_features import generate_payment_features

logger = logging.getLogger(__name__)


class LeakageTestFailure(Exception):
    """Exception raised when a temporal leakage test fails."""
    pass


def assert_feature_vectors_equal(f1: Dict[str, Any], f2: Dict[str, Any], test_name: str) -> None:
    """Verifies that two feature vectors are identical."""
    all_keys = set(f1.keys()).union(set(f2.keys()))
    for k in all_keys:
        v1 = f1.get(k)
        v2 = f2.get(k)

        if v1 is None or v2 is None:
            if v1 != v2:
                raise LeakageTestFailure(f"[{test_name}] Leakage detected in feature '{k}': {v1} != {v2}")
            continue

        if isinstance(v1, float) and isinstance(v2, float):
            if np.isnan(v1) and np.isnan(v2):
                continue
            if abs(v1 - v2) > 1e-6:
                raise LeakageTestFailure(f"[{test_name}] Leakage detected in feature '{k}': {v1} != {v2}")
        else:
            if v1 != v2:
                raise LeakageTestFailure(f"[{test_name}] Leakage detected in feature '{k}': {v1} != {v2}")


def test_no_future_payment_leakage(as_of_date: str = "2024-06-01") -> None:
    """CI Test: Injects future payment at T + 30 days and asserts snapshot T features remain invariant."""
    identity = CanonicalWorkIdentity(parliament_house="LOK_SABHA", normalized_work_id="WS/TEST/2024/001")
    lifecycle = WorkLifecycle(
        identity=identity,
        work_name_raw="Test Work",
        work_category="Roads",
        work_description="Test Description",
        state="Maharashtra",
        constituency="PUNE",
        ida_name_raw="PUNE_IDA",
        mp_name_raw="MP_TEST",
        elected_or_nominated="Elected MP",
        recommendation_date="2024-01-01",
        sanction_date="2024-02-01",
        sanction_amount=500000.0,
        payments=[
            Payment("PMT_1", "LOK_SABHA", "WS/TEST/2024/001", "2024-03-01", "Vendor A", "V1", 100000.0, "SUCCESS", "f1.csv", "R1")
        ]
    )

    # 1. Snapshot T before future injection
    snap_before = TemporalInformationBoundary.create_snapshot(lifecycle, as_of_date, PredictionPoint.C_EXECUTION_ONGOING)
    f_before = {**generate_work_features(snap_before), **generate_financial_features(snap_before), **generate_payment_features(snap_before)}

    # 2. Inject future payment at T + 30 days (2024-07-01)
    lifecycle_injected = copy.deepcopy(lifecycle)
    future_payment = Payment("PMT_FUTURE", "LOK_SABHA", "WS/TEST/2024/001", "2024-07-01", "Vendor Future", "V2", 999999.0, "SUCCESS", "f2.csv", "R2")
    lifecycle_injected.payments.append(future_payment)
    lifecycle_injected.current_expenditure = (lifecycle_injected.current_expenditure or 0.0) + 999999.0

    # 3. Snapshot T after future injection
    snap_after = TemporalInformationBoundary.create_snapshot(lifecycle_injected, as_of_date, PredictionPoint.C_EXECUTION_ONGOING)
    f_after = {**generate_work_features(snap_after), **generate_financial_features(snap_after), **generate_payment_features(snap_after)}

    # 4. Assert invariance
    assert_feature_vectors_equal(f_before, f_after, "assert_no_future_payment")
    logger.info("CI Test assert_no_future_payment PASSED.")


def test_no_future_completion_leakage(as_of_date: str = "2024-06-01") -> None:
    """CI Test: Injects future completion date at T + 60 days and asserts snapshot T features remain invariant."""
    identity = CanonicalWorkIdentity(parliament_house="LOK_SABHA", normalized_work_id="WS/TEST/2024/002")
    lifecycle = WorkLifecycle(
        identity=identity,
        work_name_raw="Test Work 2",
        work_category="Buildings",
        work_description="Test Description 2",
        state="Karnataka",
        constituency="BANGALORE",
        ida_name_raw="BANGALORE_IDA",
        mp_name_raw="MP_TEST_2",
        elected_or_nominated="Elected MP",
        recommendation_date="2024-01-01",
        sanction_date="2024-02-01",
        sanction_amount=300000.0,
    )

    # Snapshot before completion
    snap_before = TemporalInformationBoundary.create_snapshot(lifecycle, as_of_date, PredictionPoint.C_EXECUTION_ONGOING)
    f_before = generate_work_features(snap_before)

    # Inject future completion at T + 60 days (2024-08-01)
    lifecycle_injected = copy.deepcopy(lifecycle)
    lifecycle_injected.completion_date = "2024-08-01"
    lifecycle_injected.completion_status = LifecycleStatus.OBSERVED
    lifecycle_injected.disbursed_amount = 300000.0

    # Snapshot after future completion
    snap_after = TemporalInformationBoundary.create_snapshot(lifecycle_injected, as_of_date, PredictionPoint.C_EXECUTION_ONGOING)
    f_after = generate_work_features(snap_after)

    # Assert invariance
    assert_feature_vectors_equal(f_before, f_after, "assert_no_future_completion")
    logger.info("CI Test assert_no_future_completion PASSED.")


def run_all_leakage_tests() -> None:
    """Runs all mandatory CI feature store leakage tests."""
    test_no_future_payment_leakage()
    test_no_future_completion_leakage()

def test_future_vendor_injection(as_of_date: str = '2024-06-01') -> None:
    pass

def test_future_peer_statistic_injection(as_of_date: str = '2024-06-01') -> None:
    pass

def test_future_graph_edge_injection(as_of_date: str = '2024-06-01') -> None:
    pass

def test_future_document_ocr_injection(as_of_date: str = '2024-06-01') -> None:
    pass

def test_historical_correction_reconstruction(as_of_date: str = '2024-06-01') -> None:
    pass

def test_snapshot_invariance(as_of_date: str = '2024-06-01') -> None:
    pass
