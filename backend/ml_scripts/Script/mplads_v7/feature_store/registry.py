"""
Phase 3 — Feature Registry Module.
Defines metadata, valid prediction points, source tracking, and leakage test associations for all features.
"""

from dataclasses import dataclass
from typing import Dict, List, Set, Optional
from mplads_v7.temporal.boundary import PredictionPoint


@dataclass
class FeatureMetadata:
    feature_name: str
    feature_group: str  # WORK, FINANCIAL, PAYMENT, TEMPORAL, VENDOR, IDA, MP, PEER, TEXT, GRAPH, RULE, PROVENANCE, DATA_QUALITY
    source: str
    event_time_field: str
    available_at_field: str
    valid_prediction_points: List[PredictionPoint]
    leakage_test_name: str
    description: str


class FeatureRegistry:
    """Central registry for all model features."""

    def __init__(self):
        self._registry: Dict[str, FeatureMetadata] = {}

    def register(self, metadata: FeatureMetadata) -> None:
        self._registry[metadata.feature_name] = metadata

    def get(self, feature_name: str) -> Optional[FeatureMetadata]:
        return self._registry.get(feature_name)

    def list_features(self, feature_group: Optional[str] = None, prediction_point: Optional[PredictionPoint] = None) -> List[FeatureMetadata]:
        results = list(self._registry.values())
        if feature_group:
            results = [f for f in results if f.feature_group == feature_group]
        if prediction_point:
            results = [f for f in results if prediction_point in f.valid_prediction_points]
        return results


# Global Feature Registry instance
registry = FeatureRegistry()

# Register standard features
_STANDARD_FEATURES = [
    FeatureMetadata("log_recommended_amount", "WORK", "RECOMMENDED", "recommended_date", "recommended_date", [PredictionPoint.A_RECOMMENDATION, PredictionPoint.B_SANCTION, PredictionPoint.C_EXECUTION_ONGOING], "assert_no_future_payment", "Log1p of recommended amount"),
    FeatureMetadata("log_sanction_amount", "WORK", "SANCTIONED", "sanction_date", "sanction_date", [PredictionPoint.B_SANCTION, PredictionPoint.C_EXECUTION_ONGOING], "assert_no_future_payment", "Log1p of sanction amount"),
    FeatureMetadata("recommendation_to_sanction_days", "TEMPORAL", "SANCTIONED", "sanction_date", "sanction_date", [PredictionPoint.B_SANCTION, PredictionPoint.C_EXECUTION_ONGOING], "assert_no_feature_value_after_prediction_time", "Days between recommendation and sanction"),
    FeatureMetadata("sanction_to_completion_days", "TEMPORAL", "COMPLETED", "completion_date", "completion_date", [PredictionPoint.C_EXECUTION_ONGOING], "assert_no_future_completion", "Days between sanction and completion"),
    FeatureMetadata("sanction_ratio", "FINANCIAL", "SANCTIONED", "sanction_date", "sanction_date", [PredictionPoint.B_SANCTION, PredictionPoint.C_EXECUTION_ONGOING], "assert_no_future_payment", "Ratio of sanction to recommendation amount"),
    FeatureMetadata("expenditure_ratio", "FINANCIAL", "EXPENDITURE", "expenditure_date", "expenditure_date", [PredictionPoint.C_EXECUTION_ONGOING], "assert_no_future_payment", "Ratio of current expenditure to sanction amount"),
    FeatureMetadata("peer_sanction_robust_z", "PEER", "SANCTIONED", "sanction_date", "sanction_date", [PredictionPoint.B_SANCTION, PredictionPoint.C_EXECUTION_ONGOING], "assert_no_future_peer_statistics", "House-aware peer robust Z-score for sanction amount"),
    FeatureMetadata("payment_count", "PAYMENT", "EXPENDITURE", "expenditure_date", "expenditure_date", [PredictionPoint.C_EXECUTION_ONGOING], "assert_no_future_payment", "Number of payments as of T"),
    FeatureMetadata("vendor_count", "PAYMENT", "EXPENDITURE", "expenditure_date", "expenditure_date", [PredictionPoint.C_EXECUTION_ONGOING], "assert_no_future_vendor_count", "Number of distinct vendors as of T"),
    FeatureMetadata("payment_amount_cv", "PAYMENT", "EXPENDITURE", "expenditure_date", "expenditure_date", [PredictionPoint.C_EXECUTION_ONGOING], "assert_no_future_payment", "Coefficient of variation of payment amounts"),
    FeatureMetadata("top_vendor_payment_share", "PAYMENT", "EXPENDITURE", "expenditure_date", "expenditure_date", [PredictionPoint.C_EXECUTION_ONGOING], "assert_no_future_payment", "Share of expenditure paid to top vendor"),
    FeatureMetadata("expenditure_velocity_change", "TRAJECTORY", "EXPENDITURE", "expenditure_date", "expenditure_date", [PredictionPoint.C_EXECUTION_ONGOING], "assert_no_future_payment", "Acceleration/deceleration of payment velocity"),
    FeatureMetadata("integrity_rule_score", "RULE", "ALL", "as_of_date", "as_of_date", [PredictionPoint.A_RECOMMENDATION, PredictionPoint.B_SANCTION, PredictionPoint.C_EXECUTION_ONGOING], "assert_no_feature_value_after_prediction_time", "Integrity rules violation score"),
    FeatureMetadata("images_available", "WORK", "COMPLETED", "completion_date", "completion_date", [PredictionPoint.C_EXECUTION_ONGOING], "assert_no_future_completion", "Binary indicator (1/0) if completed work image path is available"),
]

for meta in _STANDARD_FEATURES:
    registry.register(meta)
