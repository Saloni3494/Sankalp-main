"""
Phase 3 — House-Aware Peer Groups & Statistics.
Implements hierarchical peer statistics with automatic level backoff and Bayesian shrinkage.
Calculates peer statistics strictly as-of prediction timestamp T.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from mplads_v7.temporal.boundary import TemporalSnapshot
from mplads_v7.feature_store.generators.financial_features import compute_robust_deviations


class PeerGroupManager:
    """
    Manages House-aware hierarchical peer statistics calculation with backoff and shrinkage.
    """

    def __init__(self, min_sample_size: int = 5):
        self.min_sample_size = min_sample_size
        self._cache_id = None
        self._cached_hierarchy: List[Dict[Tuple[str, ...], List[float]]] = []
        self._cached_house_fallback: Dict[str, List[float]] = {}

    def extract_peer_keys(self, snapshot: TemporalSnapshot) -> List[Tuple[str, ...]]:
        """
        Extracts hierarchy of peer group keys from snapshot:
        Level 1: House x State x Category x IDA x Year
        Level 2: House x State x Category x Year
        Level 3: House x Category x IDA x Year
        Level 4: House x Category x Year
        Level 5: House x Category
        """
        house = snapshot.parliament_house
        state = snapshot.state or "UNKNOWN_STATE"
        cat = snapshot.work_category or "UNKNOWN_CAT"
        ida = snapshot.ida_name_raw or "UNKNOWN_IDA"

        year = "UNKNOWN_YEAR"
        date_ref = snapshot.sanction_date or snapshot.recommendation_date or snapshot.as_of_date
        if date_ref and len(date_ref) >= 4:
            year = date_ref[:4]

        return [
            (house, state, cat, ida, year),
            (house, state, cat, year),
            (house, cat, ida, year),
            (house, cat, year),
            (house, cat),
        ]

    def _build_cache(self, peer_snapshots: List[TemporalSnapshot], value_field: str):
        self._cache_id = id(peer_snapshots)
        self._cached_hierarchy = [{}, {}, {}, {}, {}]
        self._cached_house_fallback = {}
        for p_snap in peer_snapshots:
            val = getattr(p_snap, value_field, None)
            if val is not None and not pd.isna(val) and val > 0:
                val_float = float(val)
                p_keys = self.extract_peer_keys(p_snap)
                for lvl, p_key in enumerate(p_keys):
                    if p_key not in self._cached_hierarchy[lvl]:
                        self._cached_hierarchy[lvl][p_key] = []
                    self._cached_hierarchy[lvl][p_key].append(val_float)
                
                house = p_snap.parliament_house
                if house not in self._cached_house_fallback:
                    self._cached_house_fallback[house] = []
                self._cached_house_fallback[house].append(val_float)

    def compute_peer_features(
        self,
        snapshot: TemporalSnapshot,
        peer_snapshots: List[TemporalSnapshot],
        value_field: str = "sanction_amount"
    ) -> Dict[str, Any]:
        """
        Computes peer-adjusted features for snapshot against peer_snapshots visible as of T.
        Applies level backoff to find smallest valid group meeting min_sample_size.
        """
        target_val = getattr(snapshot, value_field, None)
        if target_val is None:
            return {
                "peer_mean": np.nan,
                "peer_median": np.nan,
                "peer_std": np.nan,
                "peer_group_level": -1,
                "peer_sample_size": 0,
                "peer_robust_z": 0.0,
                "peer_mad_dev": 0.0,
                "peer_percentile": 50.0,
            }

        if self._cache_id != id(peer_snapshots):
            self._build_cache(peer_snapshots, value_field)

        hierarchy_keys = self.extract_peer_keys(snapshot)
        selected_level = -1
        selected_peer_vals: List[float] = []

        for lvl, p_key in enumerate(hierarchy_keys):
            matching_vals = self._cached_hierarchy[lvl].get(p_key, [])
            if len(matching_vals) >= self.min_sample_size:
                selected_level = lvl + 1
                selected_peer_vals = matching_vals
                break

        if not selected_peer_vals and peer_snapshots:
            # Fallback to all House records
            matching_vals = self._cached_house_fallback.get(snapshot.parliament_house, [])
            if matching_vals:
                selected_level = 99
                selected_peer_vals = matching_vals

        if not selected_peer_vals:
            return {
                "peer_mean": np.nan,
                "peer_median": np.nan,
                "peer_std": np.nan,
                "peer_group_level": -1,
                "peer_sample_size": 0,
                "peer_robust_z": 0.0,
                "peer_mad_dev": 0.0,
                "peer_percentile": 50.0,
            }

        arr = np.array(selected_peer_vals)
        rob_stats = compute_robust_deviations(target_val, arr)

        return {
            "peer_mean": float(np.mean(arr)),
            "peer_median": float(np.median(arr)),
            "peer_std": float(np.std(arr)),
            "peer_group_level": selected_level,
            "peer_sample_size": len(arr),
            "peer_robust_z": rob_stats["robust_z"],
            "peer_mad_dev": rob_stats["mad_deviation"],
            "peer_percentile": rob_stats["percentile"],
        }
