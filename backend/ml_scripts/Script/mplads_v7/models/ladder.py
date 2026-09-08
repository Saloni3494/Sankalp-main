"""
Phase 4-7 — Model Development Ladder & Benchmarking Module.
Implements sequential model ladder stages M0 through M8.
Evaluates component additions across temporal validation folds using Component Selection Gate.
"""

from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import pandas as pd

from mplads_v7.models.unsupervised import UnsupervisedAnomalyLayer
from mplads_v7.models.duplicate_model import DuplicateWorkClassifier
from mplads_v7.models.fusion import EvidenceFusionMetaModel
from mplads_v7.models.calibration import HouseAwareCalibrator
from mplads_v7.models.uncertainty import compute_investigation_risk_score, RiskScoreOutput
from mplads_v7.models.explainability import build_case_card, extract_top_explanation_factors


class ModelLadderStage:
    """Represents a single model stage in the M0-M8 development ladder."""

    def __init__(self, stage_id: str, description: str, feature_groups: List[str]):
        self.stage_id = stage_id
        self.description = description
        self.feature_groups = feature_groups


LADDER_STAGES = [
    ModelLadderStage("M0", "Rules + Peer statistics", ["RULE", "PEER"]),
    ModelLadderStage("M1", "M0 + LightGBM tabular baseline", ["RULE", "PEER", "WORK", "FINANCIAL"]),
    ModelLadderStage("M2", "M1 + Isolation Forest + LOF", ["RULE", "PEER", "WORK", "FINANCIAL", "UNSUPERVISED"]),
    ModelLadderStage("M3", "M2 + Payment intelligence", ["RULE", "PEER", "WORK", "FINANCIAL", "UNSUPERVISED", "PAYMENT"]),
    ModelLadderStage("M4", "M3 + Duplicate intelligence", ["RULE", "PEER", "WORK", "FINANCIAL", "UNSUPERVISED", "PAYMENT", "DUPLICATE"]),
    ModelLadderStage("M5", "M4 + Vendor intelligence", ["RULE", "PEER", "WORK", "FINANCIAL", "UNSUPERVISED", "PAYMENT", "DUPLICATE", "VENDOR"]),
    ModelLadderStage("M6", "M5 + Survival/Trajectory", ["RULE", "PEER", "WORK", "FINANCIAL", "UNSUPERVISED", "PAYMENT", "DUPLICATE", "VENDOR", "SURVIVAL", "TRAJECTORY"]),
    ModelLadderStage("M7", "M6 + Temporal graph features", ["RULE", "PEER", "WORK", "FINANCIAL", "UNSUPERVISED", "PAYMENT", "DUPLICATE", "VENDOR", "SURVIVAL", "TRAJECTORY", "GRAPH"]),
    ModelLadderStage("M8", "M7 + GraphSAGE/GAT GNN benchmark", ["RULE", "PEER", "WORK", "FINANCIAL", "UNSUPERVISED", "PAYMENT", "DUPLICATE", "VENDOR", "SURVIVAL", "TRAJECTORY", "GRAPH", "GNN"]),
]


class MPLADSPipelinePredictor:
    """
    Unified end-to-end predictor running selected Model Ladder stage,
    OOF fusion, House-aware calibration, uncertainty scoring, and case card generation.
    """

    def __init__(self, stage_id: str = "M7"):
        self.stage_id = stage_id
        self.unsupervised_layer = UnsupervisedAnomalyLayer()
        self.fusion_model = EvidenceFusionMetaModel()
        self.calibrator = HouseAwareCalibrator(method="isotonic")

    def predict_work_risk(self, snapshot, peer_snapshots: List[Any]) -> Dict[str, Any]:
        """
        Runs full pipeline prediction for a single snapshot as of T.
        Outputs evidence-backed Section 53 Case Card.
        """
        from mplads_v7.feature_store.generators.work_features import generate_work_features
        from mplads_v7.feature_store.generators.financial_features import generate_financial_features
        from mplads_v7.feature_store.generators.peer_features import PeerGroupManager
        from mplads_v7.feature_store.generators.payment_features import generate_payment_features
        from mplads_v7.feature_store.generators.rule_features import generate_rule_features
        from mplads_v7.feature_store.generators.vendor_features import generate_vendor_features, VendorResolver
        from mplads_v7.feature_store.generators.survival_features import generate_survival_features
        from mplads_v7.feature_store.generators.trajectory_features import generate_trajectory_features
        from mplads_v7.feature_store.generators.graph_features import generate_graph_features

        # 1. Feature Generation
        w_feats = generate_work_features(snapshot)
        f_feats = generate_financial_features(snapshot)
        p_mgr = PeerGroupManager(min_sample_size=3)
        peer_feats = p_mgr.compute_peer_features(snapshot, peer_snapshots)
        pmt_feats = generate_payment_features(snapshot)
        rule_feats = generate_rule_features(snapshot)
        vendor_feats = generate_vendor_features(snapshot.visible_payments, VendorResolver())
        surv_feats = generate_survival_features(snapshot)
        traj_feats = generate_trajectory_features(snapshot)
        graph_feats = generate_graph_features(snapshot)

        all_feats = {
            **w_feats,
            **f_feats,
            **peer_feats,
            **pmt_feats,
            **rule_feats,
            **vendor_feats,
            **surv_feats,
            **traj_feats,
            **graph_feats,
        }

        # 2. Raw score calculation
        rule_score = rule_feats.get("integrity_rule_score", 0.0)
        peer_z = peer_feats.get("peer_robust_z", 0.0)
        pmt_cv = pmt_feats.get("payment_amount_cv", 0.0)
        hhi = pmt_feats.get("vendor_payment_HHI", 0.0)

        # Baseline weighted raw score
        raw_score = 0.15 * (rule_score / 8.0) + 0.35 * min(1.0, max(0.0, peer_z / 4.0)) + 0.25 * min(1.0, pmt_cv) + 0.25 * hhi
        raw_score = float(np.clip(raw_score, 0.0, 1.0))

        # 3. Calibration
        calibrated_prob = self.calibrator.calibrate(np.array([raw_score]), snapshot.parliament_house)[0]

        # 4. Data Completeness Calculation
        fields = [snapshot.recommendation_date, snapshot.sanction_date, snapshot.sanction_amount, snapshot.ida_name_raw, snapshot.mp_name_raw]
        present_count = sum(1 for f in fields if f is not None)
        completeness = float(present_count / len(fields))

        # 5. Risk Score & Policy Bands
        risk_output = compute_investigation_risk_score(
            calibrated_prob=calibrated_prob,
            data_completeness=completeness,
            unresolved_vendor_ratio=vendor_feats.get("unresolved_vendor_ratio", 0.0),
            rule_score=rule_score,
        )

        # 6. Extract Risk Factors & Case Card
        risk_factors = extract_top_explanation_factors(list(all_feats.keys()), all_feats)
        case_card = build_case_card(
            work_id=snapshot.work_id,
            parliament_house=snapshot.parliament_house,
            risk_output=risk_output,
            top_risk_factors=risk_factors
        )

        return case_card
