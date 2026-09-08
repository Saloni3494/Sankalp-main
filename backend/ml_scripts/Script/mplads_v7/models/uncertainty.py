from typing import List
"""
Phase 7 — Uncertainty, Abstention & Investigation Risk Score Module.
Calculates Investigation Risk Score (0-100) and maps policy risk bands.
Implements time-aware conformal uncertainty & explicit policy abstention (INSUFFICIENT_EVIDENCE).
NEVER multiplies risk score by data completeness.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, Any, Tuple, Optional
import numpy as np


class RiskBand(str, Enum):
    VERY_LOW = "VERY_LOW"     # 0-19
    LOW = "LOW"               # 20-39
    MODERATE = "MODERATE"     # 40-59
    HIGH = "HIGH"             # 60-79
    CRITICAL = "CRITICAL"     # 80-100


class EvidenceStrength(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class PredictionUncertainty(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"


class WorkflowStatus(str, Enum):
    UNREVIEWED = "UNREVIEWED"
    REVIEWED = "REVIEWED"
    INVESTIGATION_OPEN = "INVESTIGATION_OPEN"
    INVESTIGATION_CLOSED = "INVESTIGATION_CLOSED"


class AdjudicationOutcome(str, Enum):
    UNKNOWN = "UNKNOWN"
    CLEARED = "CLEARED"
    INCONCLUSIVE = "INCONCLUSIVE"
    IRREGULARITY_CONFIRMED = "IRREGULARITY_CONFIRMED"


@dataclass
class RiskScoreOutput:
    work_id: str
    parliament_house: str
    risk_score: int                           # Integer 0-100
    risk_band: RiskBand
    evidence_strength: EvidenceStrength
    data_completeness: float                 # 0.0 to 1.0
    prediction_uncertainty: PredictionUncertainty
    calibrated_probability: Dict[str, Any]
    should_abstain: bool
    abstention_reason: Optional[str]
    workflow_status: WorkflowStatus = WorkflowStatus.UNREVIEWED
    outcome: AdjudicationOutcome = AdjudicationOutcome.UNKNOWN
    risk_factors: List[str] = None


from typing import List


def compute_investigation_risk_score(
    calibrated_prob: float,
    data_completeness: float,
    unresolved_vendor_ratio: float,
    rule_score: float,
    uncertainty_std: float = 0.05,
    policy_threshold_uncertainty: float = 0.25
) -> RiskScoreOutput:
    """
    Computes Investigation Risk Score ∈ [0, 100] and evaluates abstention criteria.
    Risk Score is derived directly from calibrated probability, NOT multiplied by completeness!
    """
    # 1. Scale probability [0.0, 1.0] to Risk Score [0, 100]
    prob_clean = float(np.clip(calibrated_prob, 0.0, 1.0))
    risk_score = int(round(prob_clean * 100.0))

    # 2. Risk Band Mapping
    if risk_score <= 19:
        band = RiskBand.VERY_LOW
    elif risk_score <= 39:
        band = RiskBand.LOW
    elif risk_score <= 59:
        band = RiskBand.MODERATE
    elif risk_score <= 79:
        band = RiskBand.HIGH
    else:
        band = RiskBand.CRITICAL

    # 3. Evidence Strength
    if rule_score >= 8 or prob_clean >= 0.75:
        evidence_strength = EvidenceStrength.CRITICAL
    elif rule_score >= 4 or prob_clean >= 0.50:
        evidence_strength = EvidenceStrength.HIGH
    elif rule_score >= 2 or prob_clean >= 0.25:
        evidence_strength = EvidenceStrength.MODERATE
    else:
        evidence_strength = EvidenceStrength.LOW

    # 4. Prediction Uncertainty
    if uncertainty_std > policy_threshold_uncertainty:
        uncertainty = PredictionUncertainty.HIGH
    elif uncertainty_std > 0.10:
        uncertainty = PredictionUncertainty.MODERATE
    else:
        uncertainty = PredictionUncertainty.LOW

    # 5. Abstention Evaluation
    should_abstain = False
    abstention_reason = None

    if data_completeness < 0.30:
        should_abstain = True
        abstention_reason = "INSUFFICIENT_EVIDENCE: Coverage inadequate (<30%)"
    elif unresolved_vendor_ratio > 0.70:
        should_abstain = True
        abstention_reason = "INSUFFICIENT_EVIDENCE: Vendor entity resolution unreliable (>70% unresolved)"
    elif uncertainty == PredictionUncertainty.HIGH:
        should_abstain = True
        abstention_reason = "INSUFFICIENT_EVIDENCE: Prediction uncertainty exceeds policy threshold"

    return RiskScoreOutput(
        work_id="",
        parliament_house="",
        risk_score=risk_score,
        risk_band=band,
        evidence_strength=evidence_strength,
        data_completeness=float(np.clip(data_completeness, 0.0, 1.0)),
        prediction_uncertainty=uncertainty,
        calibrated_probability={
            "target": "P(reaches SUSPICIOUS_REVIEW on adjudication)",
            "value": round(prob_clean, 4)
        },
        should_abstain=should_abstain,
        abstention_reason=abstention_reason,
        risk_factors=[]
    )
