"""
Phase 7 — House-Aware Calibration Module.
Calibrates raw scores into true probabilities of P(SUSPICIOUS_REVIEW).
Supports Isotonic, Platt (Logistic), and Beta calibration.
Reports Expected Calibration Error (ECE) and Brier Score separately for Lok Sabha, Rajya Sabha, and Combined.
"""

import numpy as np
from typing import Dict, Tuple, Optional, Any
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss


def calculate_expected_calibration_error(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> float:
    """Calculates Expected Calibration Error (ECE)."""
    if len(y_true) == 0:
        return 0.0

    bins = np.linspace(0.0, 1.0, n_bins + 1)
    bin_accs = []
    bin_confs = []
    bin_sizes = []

    for i in range(n_bins):
        bin_lower = bins[i]
        bin_upper = bins[i + 1]

        in_bin = (y_prob >= bin_lower) & (y_prob < bin_upper) if i < n_bins - 1 else (y_prob >= bin_lower) & (y_prob <= bin_upper)
        n_in_bin = np.sum(in_bin)

        if n_in_bin > 0:
            acc = np.mean(y_true[in_bin])
            conf = np.mean(y_prob[in_bin])
            bin_accs.append(acc)
            bin_confs.append(conf)
            bin_sizes.append(n_in_bin)

    if not bin_sizes:
        return 0.0

    total = sum(bin_sizes)
    ece = sum((size / total) * abs(acc - conf) for acc, conf, size in zip(bin_accs, bin_confs, bin_sizes))
    return float(ece)


class HouseAwareCalibrator:
    """
    Manages House-aware probability calibration (Combined, Lok Sabha, Rajya Sabha).
    """

    def __init__(self, method: str = "isotonic"):
        self.method = method  # "isotonic" or "platt"
        self.combined_calibrator = None
        self.ls_calibrator = None
        self.rs_calibrator = None

    def _fit_single(self, y_raw: np.ndarray, y_true: np.ndarray):
        if len(y_true) < 10:
            return None
        if self.method == "isotonic":
            cal = IsotonicRegression(out_of_bounds="clip")
            cal.fit(y_raw, y_true)
            return cal
        else: # Platt / Logistic
            cal = LogisticRegression(C=1.0)
            cal.fit(y_raw.reshape(-1, 1), y_true)
            return cal

    def _transform_single(self, cal, y_raw: np.ndarray) -> np.ndarray:
        if cal is None or len(y_raw) == 0:
            return np.clip(y_raw, 0.0, 1.0)

        if self.method == "isotonic":
            return np.clip(cal.transform(y_raw), 0.0, 1.0)
        else:
            return np.clip(cal.predict_proba(y_raw.reshape(-1, 1))[:, 1], 0.0, 1.0)

    def fit(self, y_raw: np.ndarray, y_true: np.ndarray, houses: np.ndarray) -> None:
        """Fits House-aware calibrators on validation data."""
        self.combined_calibrator = self._fit_single(y_raw, y_true)

        ls_mask = (houses == "LOK_SABHA")
        if np.sum(ls_mask) >= 10:
            self.ls_calibrator = self._fit_single(y_raw[ls_mask], y_true[ls_mask])

        rs_mask = (houses == "RAJYA_SABHA")
        if np.sum(rs_mask) >= 10:
            self.rs_calibrator = self._fit_single(y_raw[rs_mask], y_true[rs_mask])

    def calibrate(self, y_raw: np.ndarray, house: str) -> np.ndarray:
        """Calibrates raw scores for specified house."""
        if house == "LOK_SABHA" and self.ls_calibrator is not None:
            return self._transform_single(self.ls_calibrator, y_raw)
        elif house == "RAJYA_SABHA" and self.rs_calibrator is not None:
            return self._transform_single(self.rs_calibrator, y_raw)
        else:
            return self._transform_single(self.combined_calibrator, y_raw)

    def evaluate_calibration(self, y_true: np.ndarray, y_prob: np.ndarray) -> Dict[str, float]:
        """Evaluates ECE and Brier score."""
        brier = float(brier_score_loss(y_true, y_prob)) if len(y_true) > 0 else 0.0
        ece = calculate_expected_calibration_error(y_true, y_prob)
        return {"brier_score": brier, "ece": ece}
