"""
Phase 3 — Temporal Information Boundary Module.
Enforces the ONLY approved feature access boundary:
    get_features(work_id, as_of_date, prediction_point)
Filters facts so that available_at <= T and event_time <= T.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional, Any, Tuple
import pandas as pd
import numpy as np

from mplads_v7.canonical.entities import WorkLifecycle, Payment


class PredictionPoint(str, Enum):
    A_RECOMMENDATION = "A_RECOMMENDATION"
    B_SANCTION = "B_SANCTION"
    C_EXECUTION_ONGOING = "C_EXECUTION_ONGOING"


@dataclass
class TemporalSnapshot:
    """
    Filtered snapshot of a WorkLifecycle containing ONLY information visible as of date T.
    """
    work_id: str
    parliament_house: str
    as_of_date: str
    prediction_point: PredictionPoint

    # Filtered metadata
    work_name_raw: str
    work_category: Optional[str]
    work_description: Optional[str]
    state: str
    constituency: str
    ida_name_raw: Optional[str]
    mp_name_raw: Optional[str]
    elected_or_nominated: str

    # Filtered lifecycle dates & amounts
    recommendation_date: Optional[str] = None
    sanction_date: Optional[str] = None
    completion_date: Optional[str] = None
    first_payment_date: Optional[str] = None
    last_payment_date: Optional[str] = None

    recommendation_amount: Optional[float] = None
    sanction_amount: Optional[float] = None
    disbursed_amount: Optional[float] = None
    current_expenditure: Optional[float] = None

    # Filtered payments up to as_of_date
    visible_payments: List[Payment] = None
    visible_image_paths: List[str] = None


class TemporalInformationBoundary:
    """
    Guarantees strict temporal isolation for feature calculation.
    """

    @staticmethod
    def create_snapshot(
        lifecycle: WorkLifecycle,
        as_of_date: str,
        prediction_point: PredictionPoint
    ) -> TemporalSnapshot:
        """
        Creates a time-bounded snapshot of work facts as-of as_of_date for prediction_point.
        """
        as_of_date_str = str(as_of_date)

        snapshot = TemporalSnapshot(
            work_id=lifecycle.identity.normalized_work_id,
            parliament_house=lifecycle.identity.parliament_house,
            as_of_date=as_of_date_str,
            prediction_point=prediction_point,
            work_name_raw=lifecycle.work_name_raw,
            work_category=lifecycle.work_category,
            work_description=lifecycle.work_description,
            state=lifecycle.state,
            constituency=lifecycle.constituency,
            ida_name_raw=lifecycle.ida_name_raw,
            mp_name_raw=lifecycle.mp_name_raw,
            elected_or_nominated=lifecycle.elected_or_nominated,
            visible_payments=[],
            visible_image_paths=[],
        )

        # 1. Recommendation facts
        if lifecycle.recommendation_date and lifecycle.recommendation_date <= as_of_date_str:
            snapshot.recommendation_date = lifecycle.recommendation_date
            snapshot.recommendation_amount = lifecycle.recommendation_amount

        # 2. Sanction facts (Visible only if point is B_SANCTION or C_EXECUTION_ONGOING and sanction_date <= as_of_date)
        if prediction_point in [PredictionPoint.B_SANCTION, PredictionPoint.C_EXECUTION_ONGOING]:
            if lifecycle.sanction_date and lifecycle.sanction_date <= as_of_date_str:
                snapshot.sanction_date = lifecycle.sanction_date
                snapshot.sanction_amount = lifecycle.sanction_amount

        # 3. Completion facts (Visible ONLY if point is C_EXECUTION_ONGOING and completion_date <= as_of_date)
        if prediction_point == PredictionPoint.C_EXECUTION_ONGOING:
            if lifecycle.completion_date and lifecycle.completion_date <= as_of_date_str:
                snapshot.completion_date = lifecycle.completion_date
                snapshot.disbursed_amount = lifecycle.disbursed_amount
                snapshot.visible_image_paths = list(lifecycle.image_paths) if lifecycle.image_paths else []

        # 4. Expenditure & Payment facts (Visible ONLY if point is C_EXECUTION_ONGOING and payment date <= as_of_date)
        if prediction_point == PredictionPoint.C_EXECUTION_ONGOING:
            vis_pmts = []
            exp_sum = 0.0
            first_p_date = None
            last_p_date = None

            for pmt in lifecycle.payments:
                if pmt.expenditure_date and pmt.expenditure_date <= as_of_date_str:
                    vis_pmts.append(pmt)
                    exp_sum += pmt.disbursed_amount
                    if first_p_date is None or pmt.expenditure_date < first_p_date:
                        first_p_date = pmt.expenditure_date
                    if last_p_date is None or pmt.expenditure_date > last_p_date:
                        last_p_date = pmt.expenditure_date

            snapshot.visible_payments = vis_pmts
            snapshot.current_expenditure = exp_sum if vis_pmts else None
            snapshot.first_payment_date = first_p_date
            snapshot.last_payment_date = last_p_date

        return snapshot
