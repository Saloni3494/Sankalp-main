"""
Phase 2 — Lifecycle Reconstruction Module.
Reconstructs work lifecycles across RECOMMENDED, SANCTIONED, COMPLETED, EXPENDITURE datasets.
Enforces non-negotiable status semantics: OBSERVED, NOT_OBSERVED, NOT_APPLICABLE, UNKNOWN_DUE_TO_COVERAGE.
Missing records are NEVER converted into negative events.
"""

from typing import Dict, List, Tuple, Optional
import pandas as pd
import numpy as np

from mplads_v7.canonical.entities import (
    WorkLifecycle,
    CanonicalWorkIdentity,
    Payment,
    LifecycleStatus,
)
from mplads_v7.canonical.work_id_parser import parse_work_id, ExtractionStatus
from mplads_v7.ingestion.adapters import UNAVAILABLE, UNKNOWN


def compute_date_difference_days(start_date: Optional[str], end_date: Optional[str]) -> Optional[float]:
    """Computes difference in days between ISO YYYY-MM-DD date strings (end_date - start_date)."""
    if not start_date or not end_date or pd.isna(start_date) or pd.isna(end_date):
        return None
    try:
        t_start = pd.to_datetime(start_date)
        t_end = pd.to_datetime(end_date)
        diff = (t_end - t_start).days
        return float(diff)
    except Exception:
        return None


class LifecycleReconstructor:
    """
    Reconstructs unified WorkLifecycle entities by linking records across datasets.
    Keyed strictly by (parliament_house, normalized_work_id).
    """

    def __init__(self):
        self.lifecycles: Dict[Tuple[str, str], WorkLifecycle] = {}

    def get_or_create(
        self,
        house: str,
        norm_work_id: str,
        work_name_raw: str,
        state: str,
        constituency: str,
        ida: Optional[str],
        mp_name: Optional[str],
        elected_or_nominated: str,
        category: Optional[str] = None,
        description: Optional[str] = None,
    ) -> WorkLifecycle:
        key = (house, norm_work_id)
        if key not in self.lifecycles:
            identity = CanonicalWorkIdentity(parliament_house=house, normalized_work_id=norm_work_id)
            self.lifecycles[key] = WorkLifecycle(
                identity=identity,
                work_name_raw=work_name_raw,
                work_category=category,
                work_description=description,
                state=state,
                constituency=constituency,
                ida_name_raw=ida,
                mp_name_raw=mp_name,
                elected_or_nominated=elected_or_nominated,
            )
        return self.lifecycles[key]

    def process_all_datasets(self, cleaned_datasets: Dict[str, pd.DataFrame]) -> Dict[Tuple[str, str], WorkLifecycle]:
        """
        Processes datasets in logical lifecycle order:
        RECOMMENDED -> SANCTIONED -> COMPLETED -> EXPENDITURE
        """
        # 1. Recommended
        for key in ["LOK_SABHA_RECOMMENDED", "RAJYA_SABHA_RECOMMENDED"]:
            if key in cleaned_datasets:
                self._process_recommended(cleaned_datasets[key])

        # 2. Sanctioned
        for key in ["LOK_SABHA_SANCTIONED", "RAJYA_SABHA_SANCTIONED"]:
            if key in cleaned_datasets:
                self._process_sanctioned(cleaned_datasets[key])

        # 3. Completed
        for key in ["LOK_SABHA_COMPLETED", "RAJYA_SABHA_COMPLETED"]:
            if key in cleaned_datasets:
                self._process_completed(cleaned_datasets[key])

        # 4. Expenditure
        for key in ["LOK_SABHA_EXPENDITURE", "RAJYA_SABHA_EXPENDITURE"]:
            if key in cleaned_datasets:
                self._process_expenditure(cleaned_datasets[key])

        # 5. Finalize duration calculations
        self._calculate_lifecycle_durations()

        return self.lifecycles

    def _process_recommended(self, df: pd.DataFrame) -> None:
        for idx, row in df.iterrows():
            house = row["parliament_house"]
            raw_work = row.get("work_name_raw") or row.get("work_description") or f"WORK_{idx}"
            parsed = parse_work_id(raw_work, fallback_row_idx=row["source_row_id"])

            lifecycle = self.get_or_create(
                house=house,
                norm_work_id=parsed.normalized_work_id,
                work_name_raw=str(raw_work),
                state=str(row.get("state", UNKNOWN)),
                constituency=str(row.get("constituency", UNAVAILABLE)),
                ida=row.get("ida"),
                mp_name=row.get("mp_name_raw"),
                elected_or_nominated=str(row.get("elected_or_nominated", UNKNOWN)),
                category=row.get("work_category"),
                description=row.get("work_description"),
            )

            lifecycle.recommendation_status = LifecycleStatus.OBSERVED
            rec_date = row.get("recommended_date")
            if rec_date and not pd.isna(rec_date):
                lifecycle.recommendation_date = str(rec_date)

            rec_amt = row.get("recommended_amount")
            if rec_amt is not None and not pd.isna(rec_amt):
                lifecycle.recommendation_amount = float(rec_amt)

            # Sanction date might be present in recommended dataset
            sanc_date = row.get("sanction_date")
            if sanc_date and not pd.isna(sanc_date):
                lifecycle.sanction_date = str(sanc_date)
                lifecycle.sanction_status = LifecycleStatus.OBSERVED

            lifecycle.source_records.append(row.to_dict())

    def _process_sanctioned(self, df: pd.DataFrame) -> None:
        for idx, row in df.iterrows():
            house = row["parliament_house"]
            raw_work = row.get("work_name_raw") or row.get("work_description") or f"WORK_{idx}"
            parsed = parse_work_id(raw_work, fallback_row_idx=row["source_row_id"])

            lifecycle = self.get_or_create(
                house=house,
                norm_work_id=parsed.normalized_work_id,
                work_name_raw=str(raw_work),
                state=str(row.get("state", UNKNOWN)),
                constituency=str(row.get("constituency", UNAVAILABLE)),
                ida=row.get("ida"),
                mp_name=row.get("mp_name_raw"),
                elected_or_nominated=str(row.get("elected_or_nominated", UNKNOWN)),
                category=row.get("work_category"),
                description=row.get("work_description"),
            )

            lifecycle.sanction_status = LifecycleStatus.OBSERVED

            rec_date = row.get("recommended_date")
            if rec_date and not pd.isna(rec_date):
                lifecycle.recommendation_date = str(rec_date)
                lifecycle.recommendation_status = LifecycleStatus.OBSERVED

            sanc_date = row.get("sanction_date")
            if sanc_date and not pd.isna(sanc_date):
                lifecycle.sanction_date = str(sanc_date)

            sanc_amt = row.get("sanction_amount")
            if sanc_amt is not None and not pd.isna(sanc_amt):
                lifecycle.sanction_amount = float(sanc_amt)

            lifecycle.source_records.append(row.to_dict())

    def _process_completed(self, df: pd.DataFrame) -> None:
        for idx, row in df.iterrows():
            house = row["parliament_house"]
            raw_work = row.get("work_name_raw") or row.get("work_description") or f"WORK_{idx}"
            parsed = parse_work_id(raw_work, fallback_row_idx=row["source_row_id"])

            lifecycle = self.get_or_create(
                house=house,
                norm_work_id=parsed.normalized_work_id,
                work_name_raw=str(raw_work),
                state=str(row.get("state", UNKNOWN)),
                constituency=str(row.get("constituency", UNAVAILABLE)),
                ida=row.get("ida"),
                mp_name=row.get("mp_name_raw"),
                elected_or_nominated=str(row.get("elected_or_nominated", UNKNOWN)),
                category=row.get("work_category"),
                description=row.get("work_description"),
            )

            lifecycle.completion_status = LifecycleStatus.OBSERVED
            comp_date = row.get("completion_date")
            if comp_date and not pd.isna(comp_date):
                lifecycle.completion_date = str(comp_date)

            disb_amt = row.get("disbursed_amount")
            if disb_amt is not None and not pd.isna(disb_amt):
                lifecycle.disbursed_amount = float(disb_amt)

            img = row.get("image_path")
            if img and not pd.isna(img):
                lifecycle.image_paths.append(str(img))

            lifecycle.source_records.append(row.to_dict())

    def _process_expenditure(self, df: pd.DataFrame) -> None:
        for idx, row in df.iterrows():
            house = row["parliament_house"]
            raw_work = row.get("work_id_raw") or row.get("work_name_raw") or f"WORK_{idx}"
            parsed = parse_work_id(raw_work, fallback_row_idx=row["source_row_id"])

            lifecycle = self.get_or_create(
                house=house,
                norm_work_id=parsed.normalized_work_id,
                work_name_raw=str(row.get("work_name_raw", raw_work)),
                state=str(row.get("state", UNKNOWN)),
                constituency=str(row.get("constituency", UNAVAILABLE)),
                ida=row.get("ida"),
                mp_name=row.get("mp_name_raw"),
                elected_or_nominated=str(row.get("elected_or_nominated", UNKNOWN)),
            )

            lifecycle.expenditure_status = LifecycleStatus.OBSERVED

            pmt_amt = row.get("disbursed_amount") or 0.0
            pmt_date = str(row.get("expenditure_date")) if row.get("expenditure_date") and not pd.isna(row.get("expenditure_date")) else None

            payment = Payment(
                payment_id=f"PMT_{row['source_row_id']}",
                parliament_house=house,
                normalized_work_id=parsed.normalized_work_id,
                expenditure_date=pmt_date,
                vendor_name_raw=str(row.get("vendor_name_raw", UNKNOWN)),
                canonical_vendor_id=None,
                disbursed_amount=float(pmt_amt),
                payment_status=str(row.get("payment_status", UNKNOWN)),
                source_file=str(row["source_file"]),
                source_row_id=str(row["source_row_id"]),
            )

            lifecycle.payments.append(payment)

            # Update expenditure sums & dates
            if lifecycle.current_expenditure is None:
                lifecycle.current_expenditure = 0.0
            lifecycle.current_expenditure += float(pmt_amt)

            if pmt_date:
                if lifecycle.first_payment_date is None or pmt_date < lifecycle.first_payment_date:
                    lifecycle.first_payment_date = pmt_date
                if lifecycle.last_payment_date is None or pmt_date > lifecycle.last_payment_date:
                    lifecycle.last_payment_date = pmt_date

            lifecycle.source_records.append(row.to_dict())

    def _calculate_lifecycle_durations(self) -> None:
        """Computes lifecycle duration gaps in days."""
        for lifecycle in self.lifecycles.values():
            lifecycle.recommendation_to_sanction_days = compute_date_difference_days(
                lifecycle.recommendation_date, lifecycle.sanction_date
            )
            lifecycle.sanction_to_completion_days = compute_date_difference_days(
                lifecycle.sanction_date, lifecycle.completion_date
            )
            lifecycle.sanction_to_first_payment_days = compute_date_difference_days(
                lifecycle.sanction_date, lifecycle.first_payment_date
            )
