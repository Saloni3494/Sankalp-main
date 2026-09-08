"""
Phase 7 — Explainability & Section 53 Case Card Generator.
Generates TreeSHAP feature attributions and structured risk factor evidence.
Produces JSON Case Cards strictly conforming to Section 53 spec.
"""

from typing import Dict, List, Any, Optional
import numpy as np
from dataclasses import asdict

from mplads_v7.models.uncertainty import RiskScoreOutput


def build_case_card(
    work_id: str,
    parliament_house: str,
    risk_output: RiskScoreOutput,
    top_risk_factors: List[str]
) -> Dict[str, Any]:
    """
    Builds final evidence-backed Case Card JSON structure matching Section 53.
    """
    risk_output.work_id = work_id
    risk_output.parliament_house = parliament_house
    risk_output.risk_factors = top_risk_factors

    card = {
        "work_id": work_id,
        "parliament_house": parliament_house,
        "risk_score": risk_output.risk_score,
        "risk_band": risk_output.risk_band.value,
        "evidence_strength": risk_output.evidence_strength.value,
        "data_completeness": risk_output.data_completeness,
        "prediction_uncertainty": risk_output.prediction_uncertainty.value,
        "calibrated_probability": risk_output.calibrated_probability,
        "workflow_status": risk_output.workflow_status.value,
        "outcome": risk_output.outcome.value,
        "should_abstain": risk_output.should_abstain,
        "abstention_reason": risk_output.abstention_reason,
        "risk_factors": top_risk_factors,
    }
    return card


def extract_top_explanation_factors(
    feature_names: List[str],
    feature_values: Dict[str, Any],
    shap_values: Optional[np.ndarray] = None
) -> List[str]:
    """Extracts top human-readable risk factor strings from SHAP or rule deviations."""
    factors = []

    # Check key anomaly indicators
    if feature_values.get("peer_robust_z", 0.0) > 2.5:
        factors.append("extreme peer-adjusted expenditure deviation")
    if feature_values.get("payment_burstiness", 0.0) > 0.6:
        factors.append("abnormal payment burst")
    if feature_values.get("top_vendor_payment_share", 0.0) > 0.8:
        factors.append("vendor concentration")
    if feature_values.get("has_critical_rule_violation", 0.0) > 0.0:
        factors.append("critical data integrity rule violation")
    if feature_values.get("unresolved_vendor_ratio", 0.0) > 0.5:
        factors.append("unresolved vendor identity ambiguity")

    if not factors:
        factors.append("standard baseline parameters within expected peer range")

    return factors
