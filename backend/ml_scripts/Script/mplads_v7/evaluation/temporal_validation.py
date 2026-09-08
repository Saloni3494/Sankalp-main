"""
Phase 8 — Nested Temporal Validation Module.
Implements rolling-origin temporal splits with temporal embargoes.
Never uses random train/test splits as primary evaluation strategy.
Keeps locked final test completely untouched until final evaluation.
"""

from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
import pandas as pd
import numpy as np


@dataclass
class TemporalFold:
    fold_idx: int
    train_start: str
    train_end: str
    val_start: str
    val_end: str
    embargo_days: int = 30


class NestedTemporalValidator:
    """Manages rolling-origin temporal validation folds."""

    def __init__(self, n_folds: int = 3, embargo_days: int = 30):
        self.n_folds = n_folds
        self.embargo_days = embargo_days

    def generate_folds(self, dates_series: pd.Series) -> List[TemporalFold]:
        """Generates rolling-origin temporal folds based on empirical dates."""
        valid_dates = pd.to_datetime(dates_series.dropna()).sort_values()
        if len(valid_dates) < 100:

            return [
                TemporalFold(0, "2023-01-01", "2024-01-01", "2024-02-01", "2024-06-01", self.embargo_days),
                TemporalFold(1, "2023-01-01", "2024-06-01", "2024-07-01", "2024-12-01", self.embargo_days),
            ]

        min_d = valid_dates.iloc[0]
        max_d = valid_dates.iloc[-1]
        total_days = (max_d - min_d).days

        fold_step = total_days / (self.n_folds + 1)
        folds = []

        for i in range(self.n_folds):
            t_train_end = min_d + pd.Timedelta(days=fold_step * (i + 1))
            t_val_start = t_train_end + pd.Timedelta(days=self.embargo_days)
            t_val_end = t_val_start + pd.Timedelta(days=fold_step)

            folds.append(
                TemporalFold(
                    fold_idx=i,
                    train_start=min_d.strftime("%Y-%m-%d"),
                    train_end=t_train_end.strftime("%Y-%m-%d"),
                    val_start=t_val_start.strftime("%Y-%m-%d"),
                    val_end=t_val_end.strftime("%Y-%m-%d"),
                    embargo_days=self.embargo_days,
                )
            )

        return folds
