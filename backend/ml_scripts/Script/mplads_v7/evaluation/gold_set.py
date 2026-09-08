"""
Phase 8 — Gold Set & Human Reviewer Agreement Module.
Manages Three Independent Evaluation Samples:
  - Sample 1: Representative (prevalence, FPR, false negatives)
  - Sample 2: Risk-Stratified (Precision@K, NDCG@K, calibration)
  - Sample 3: Known-Pattern Stress Set (structural edge cases - NEVER blended into headline precision)
Calculates Cohen's Kappa agreement between independent human reviewers.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass, field
from sklearn.metrics import cohen_kappa_score


@dataclass
class GoldSetRecord:
    work_id: str
    parliament_house: str
    sample_type: str  # SAMPLE_1_REPRESENTATIVE, SAMPLE_2_RISK_STRATIFIED, SAMPLE_3_KNOWN_PATTERN
    reviewer_1_label: str  # NORMAL, SUSPICIOUS_REVIEW, DATA_QUALITY, COMPLIANCE
    reviewer_2_label: str
    adjudicated_label: str
    agreed: bool
    inclusion_probability: float = 1.0


class GoldSetManager:
    """Manages creation and evaluation of Gold Set samples."""

    def __init__(self):
        self.records: List[GoldSetRecord] = []

    def add_record(self, record: GoldSetRecord) -> None:
        self.records.append(record)

    def calculate_cohens_kappa(self) -> float:
        """Calculates Cohen's Kappa score for human reviewer inter-annotator agreement."""
        if not self.records:
            return 1.0

        r1 = [rec.reviewer_1_label for rec in self.records]
        r2 = [rec.reviewer_2_label for rec in self.records]

        try:
            kappa = cohen_kappa_score(r1, r2)
            return float(kappa) if not np.isnan(kappa) else 1.0
        except Exception:
            return 1.0

    def get_sample(self, sample_type: str) -> List[GoldSetRecord]:
        """Returns records for specified gold sample type."""
        return [r for r in self.records if r.sample_type == sample_type]
