"""
Phase 3 — Integrity Rule Engine.
Evaluates deterministic data integrity rules and emits Evidence objects.
Rules produce EVIDENCE, NOT verdicts.
"""

from typing import Dict, List, Any, Optional
from mplads_v7.temporal.boundary import TemporalSnapshot
from mplads_v7.canonical.entities import Evidence


class IntegrityRuleEngine:
    """Evaluates integrity rules against temporal snapshots."""

    def evaluate_rules(self, snapshot: TemporalSnapshot) -> List[Evidence]:
        evidences: List[Evidence] = []

        # R001: Expenditure > Sanction
        sanc = snapshot.sanction_amount
        exp = snapshot.current_expenditure
        if sanc and exp and sanc > 0 and exp > sanc * 1.05:  # 5% buffer for floating point / minor variation
            evidences.append(
                Evidence(
                    rule_id="R001_EXPENDITURE_EXCEEDS_SANCTION",
                    triggered=True,
                    severity="HIGH",
                    evidence_family="RULE",
                    observed_values={"expenditure": exp, "sanction": sanc},
                    expected_relationship="expenditure <= sanction",
                    source_records=[snapshot.work_id],
                    description=f"Current expenditure ({exp:.2f}) exceeds sanction amount ({sanc:.2f})."
                )
            )

        # R002: Completion Date < Sanction Date
        rec_d = snapshot.recommendation_date
        sanc_d = snapshot.sanction_date
        comp_d = snapshot.completion_date

        if sanc_d and comp_d and comp_d < sanc_d:
            evidences.append(
                Evidence(
                    rule_id="R002_COMPLETION_BEFORE_SANCTION",
                    triggered=True,
                    severity="CRITICAL",
                    evidence_family="RULE",
                    observed_values={"completion_date": comp_d, "sanction_date": sanc_d},
                    expected_relationship="completion_date >= sanction_date",
                    source_records=[snapshot.work_id],
                    description=f"Completion date ({comp_d}) precedes sanction date ({sanc_d})."
                )
            )

        # R003: Sanction Date < Recommendation Date
        if rec_d and sanc_d and sanc_d < rec_d:
            evidences.append(
                Evidence(
                    rule_id="R003_SANCTION_BEFORE_RECOMMENDATION",
                    triggered=True,
                    severity="HIGH",
                    evidence_family="RULE",
                    observed_values={"sanction_date": sanc_d, "recommendation_date": rec_d},
                    expected_relationship="sanction_date >= recommendation_date",
                    source_records=[snapshot.work_id],
                    description=f"Sanction date ({sanc_d}) precedes recommendation date ({rec_d})."
                )
            )

        # R004: Negative Amount
        for amt_name, amt_val in [("recommendation", snapshot.recommendation_amount), ("sanction", snapshot.sanction_amount), ("expenditure", snapshot.current_expenditure)]:
            if amt_val is not None and amt_val < 0:
                evidences.append(
                    Evidence(
                        rule_id=f"R004_NEGATIVE_{amt_name.upper()}_AMOUNT",
                        triggered=True,
                        severity="CRITICAL",
                        evidence_family="RULE",
                        observed_values={f"{amt_name}_amount": amt_val},
                        expected_relationship=f"{amt_name}_amount >= 0",
                        source_records=[snapshot.work_id],
                        description=f"Negative {amt_name} amount detected: {amt_val}."
                    )
                )

        return evidences


def generate_rule_features(snapshot: TemporalSnapshot, engine: Optional[IntegrityRuleEngine] = None) -> Dict[str, Any]:
    """Generates summary rule features for feature vector."""
    if engine is None:
        engine = IntegrityRuleEngine()

    evidences = engine.evaluate_rules(snapshot)

    triggered_count = len(evidences)
    severity_weights = {"LOW": 1, "MODERATE": 2, "HIGH": 4, "CRITICAL": 8}
    rule_score = sum(severity_weights.get(e.severity, 1) for e in evidences)

    return {
        "rule_triggered_count": float(triggered_count),
        "integrity_rule_score": float(rule_score),
        "has_critical_rule_violation": 1.0 if any(e.severity == "CRITICAL" for e in evidences) else 0.0,
    }
