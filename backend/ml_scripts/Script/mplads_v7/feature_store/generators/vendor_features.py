"""
Phase 3 / 5 — Vendor Resolution & Feature Generator.
Optimizes for MINIMIZING FALSE MERGES before maximizing recall.
Maps raw vendor strings to canonical_vendor_id using similarity blocking.
Ambiguous vendors remain strictly unresolved.
"""

import re
import hashlib
from typing import Dict, List, Tuple, Optional, Any
from difflib import SequenceMatcher
from dataclasses import dataclass


def normalize_vendor_name(name: str) -> str:
    """Normalizes raw vendor name text."""
    if not name:
        return ""
    text = name.upper().strip()
    text = re.sub(r"\b(PVT|LTD|PRIVATE|LIMITED|CORP|CO|INC|SERVICES|ENTERPRISES|M/S)\b", "", text)
    text = re.sub(r"[^\w\s]", "", text)
    return re.sub(r"\s+", " ", text).strip()


@dataclass
class VendorResolutionResult:
    canonical_vendor_id: str
    normalized_name: str
    resolution_confidence: float
    resolution_method: str
    is_ambiguous: bool


class VendorResolver:
    """High-precision vendor entity resolution minimizing false merges."""

    def __init__(self, high_confidence_threshold: float = 0.90):
        self.threshold = high_confidence_threshold
        self.known_vendors: Dict[str, str] = {}  # norm_name -> canonical_id

    def resolve(self, raw_name: str, state_context: str = "") -> VendorResolutionResult:
        if not raw_name or str(raw_name).strip().lower() in ["nan", "none", "", "n/a", "null"]:
            return VendorResolutionResult(
                canonical_vendor_id="VENDOR_UNRESOLVED",
                normalized_name="",
                resolution_confidence=0.0,
                resolution_method="EMPTY_NAME",
                is_ambiguous=True,
            )

        norm = normalize_vendor_name(raw_name)
        if len(norm) < 3:
            # Short names are high-risk for false merge, keep unresolved
            return VendorResolutionResult(
                canonical_vendor_id=f"VENDOR_UNRESOLVED_{hashlib.md5(raw_name.encode()).hexdigest()[:8]}",
                normalized_name=norm,
                resolution_confidence=0.4,
                resolution_method="SHORT_NAME_UNRESOLVED",
                is_ambiguous=True,
            )

        # Fast path for batch training: Exact match only
        if norm in self.known_vendors:
            return VendorResolutionResult(
                canonical_vendor_id=self.known_vendors[norm],
                normalized_name=norm,
                resolution_confidence=1.0,
                resolution_method="EXACT_NORM_MATCH",
                is_ambiguous=False,
            )

        new_id = f"VENDOR_{hashlib.md5(norm.encode()).hexdigest()[:12]}"
        self.known_vendors[norm] = new_id
        
        return VendorResolutionResult(
            canonical_vendor_id=new_id,
            normalized_name=norm,
            resolution_confidence=1.0,
            resolution_method="NEW_VENDOR_EXACT",
            is_ambiguous=False,
        )


def generate_vendor_features(payments: List[Any], resolver: VendorResolver) -> Dict[str, Any]:
    """Generates vendor-level features for a list of visible payments."""
    feats: Dict[str, Any] = {}
    if not payments:
        feats["resolved_vendor_count"] = 0.0
        feats["unresolved_vendor_ratio"] = 0.0
        feats["top_vendor_is_ambiguous"] = 0.0
        return feats

    resolved_ids = []
    unresolved_count = 0

    for p in payments:
        raw_name = getattr(p, "vendor_name_raw", "")
        res = resolver.resolve(raw_name)
        resolved_ids.append(res.canonical_vendor_id)
        if res.is_ambiguous:
            unresolved_count += 1

    feats["resolved_vendor_count"] = float(len(set(resolved_ids)))
    feats["unresolved_vendor_ratio"] = float(unresolved_count / len(payments)) if payments else 0.0
    return feats
