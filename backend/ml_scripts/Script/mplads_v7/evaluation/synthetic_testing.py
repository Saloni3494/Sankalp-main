"""
Phase 8 — Synthetic Adversarial Stress Testing Module.
Generates subtle perturbations (cost inflation, payment burst, vendor substitution) to test robustness.
Synthetic cases MUST NEVER become real fraud labels.
"""

import copy
from typing import Dict, List, Any
from mplads_v7.temporal.boundary import TemporalSnapshot


def perturb_snapshot_cost_inflation(snapshot: TemporalSnapshot, inflation_pct: float = 0.05) -> TemporalSnapshot:
    """Generates subtle cost inflation perturbation (e.g., 9.8L -> 10.2L)."""
    perturbed = copy.deepcopy(snapshot)
    if perturbed.sanction_amount:
        perturbed.sanction_amount *= (1.0 + inflation_pct)
    if perturbed.current_expenditure:
        perturbed.current_expenditure *= (1.0 + inflation_pct)
    return perturbed


def run_synthetic_stress_suite(snapshot: TemporalSnapshot, predictor: Any) -> Dict[str, Any]:
    """Runs adversarial perturbation suite and measures prediction stability."""
    original_card = predictor.predict_work_risk(snapshot, [snapshot])
    orig_score = original_card["risk_score"]

    # Perturbation 1: Subtle 5% cost inflation
    p1_snap = perturb_snapshot_cost_inflation(snapshot, 0.05)
    p1_card = predictor.predict_work_risk(p1_snap, [p1_snap])
    p1_score = p1_card["risk_score"]

    diff = abs(p1_score - orig_score)
    is_stable = diff <= 15  # Score should not jump wildly on subtle 5% change

    return {
        "original_risk_score": orig_score,
        "perturbed_risk_score": p1_score,
        "score_delta": diff,
        "is_robustly_stable": is_stable,
    }
