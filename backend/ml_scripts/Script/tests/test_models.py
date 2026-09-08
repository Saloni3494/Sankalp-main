"""
Tests for Phases 4-8 — Models, Fusion, Calibration, Uncertainty, and Release Gate.
"""

import pytest
import numpy as np
import pandas as pd
from mplads_v7.models.unsupervised import UnsupervisedAnomalyLayer
from mplads_v7.models.duplicate_model import DuplicateWorkClassifier
from mplads_v7.models.fusion import EvidenceFusionMetaModel
from mplads_v7.models.calibration import HouseAwareCalibrator, calculate_expected_calibration_error
from mplads_v7.models.uncertainty import compute_investigation_risk_score, RiskBand, EvidenceStrength
from mplads_v7.models.ladder import MPLADSPipelinePredictor
from mplads_v7.evaluation.release_gate import ReleaseGateEvaluator


def test_unsupervised_anomaly_layer():
    rng = np.random.RandomState(42)
    X = rng.randn(50, 4)
    detector = UnsupervisedAnomalyLayer(random_state=42)
    scores = detector.predict_anomaly_scores(X)

    assert "iforest_score" in scores
    assert "lof_score" in scores
    assert len(scores["iforest_score"]) == 50
    assert (scores["iforest_score"] >= 0.0).all() and (scores["iforest_score"] <= 1.0).all()

    diversity = detector.evaluate_detector_diversity(scores)
    assert "spearman_rank_correlation" in diversity
    assert "jaccard_similarity" in diversity


def test_duplicate_classifier():
    clf = DuplicateWorkClassifier(random_state=42)
    X_pairs = np.array([[0.95, 1.0], [0.10, 0.2]])
    probs = clf.predict_pair_probs(X_pairs)
    assert probs.shape == (2, 3)
    assert probs[0, 1] > probs[1, 1]  # Higher P(SAME) for high similarity


def test_calibration_ece():
    y_true = np.array([0, 0, 0, 1, 1, 1])
    y_prob = np.array([0.1, 0.2, 0.3, 0.7, 0.8, 0.9])
    ece = calculate_expected_calibration_error(y_true, y_prob)
    assert ece >= 0.0 and ece <= 1.0

    calibrator = HouseAwareCalibrator(method="isotonic")
    calibrator.fit(y_prob, y_true, np.array(["LOK_SABHA"] * 6))
    calibrated = calibrator.calibrate(y_prob, "LOK_SABHA")
    assert len(calibrated) == 6


def test_uncertainty_risk_scoring():
    out = compute_investigation_risk_score(
        calibrated_prob=0.85,
        data_completeness=0.95,
        unresolved_vendor_ratio=0.10,
        rule_score=8.0,
    )

    assert out.risk_score == 85
    assert out.risk_band == RiskBand.CRITICAL
    assert out.evidence_strength == EvidenceStrength.CRITICAL
    assert not out.should_abstain

    # Test abstention trigger on inadequate coverage
    out_abstain = compute_investigation_risk_score(
        calibrated_prob=0.85,
        data_completeness=0.20,  # Coverage <30%
        unresolved_vendor_ratio=0.10,
        rule_score=0.0,
    )
    assert out_abstain.should_abstain
    assert "Coverage inadequate" in out_abstain.abstention_reason


def test_release_gate_evaluator():
    evaluator = ReleaseGateEvaluator()
    res = evaluator.run_release_gate({})
    assert res["status"] == "PASS"
    assert res["passed_count"] == 34
