"""
Phase 2 — Canonical Data Model Entities.
Defines canonical dataclasses for WORK, MP, IDA, VENDOR, PAYMENT, STATE, CONSTITUENCY, CALAMITY, EVIDENCE.
Enforces canonical work identity: (parliament_house, normalized_work_id).
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from enum import Enum


class ExtractionStatus(str, Enum):
    EXACT = "EXACT"
    NORMALIZED = "NORMALIZED"
    AMBIGUOUS = "AMBIGUOUS"
    UNRESOLVED = "UNRESOLVED"
    MISSING = "MISSING"


class LifecycleStatus(str, Enum):
    OBSERVED = "OBSERVED"
    NOT_OBSERVED = "NOT_OBSERVED"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    UNKNOWN_DUE_TO_COVERAGE = "UNKNOWN_DUE_TO_COVERAGE"


@dataclass
class CanonicalWorkIdentity:
    parliament_house: str
    normalized_work_id: str

    def __str__(self) -> str:
        return f"{self.parliament_house}:{self.normalized_work_id}"


@dataclass
class MP:
    mp_id: str
    mp_name_raw: str
    mp_name_normalized: str
    mp_term_raw: Optional[str]
    elected_or_nominated: str
    parliament_house: str
    source_files: List[str] = field(default_factory=list)


@dataclass
class IDA:
    ida_id: str
    ida_name_raw: str
    ida_name_normalized: str
    state: str
    parliament_house: str


@dataclass
class Vendor:
    canonical_vendor_id: str
    raw_vendor_name: str
    normalized_vendor_name: str
    resolution_confidence: float
    resolution_method: str
    resolution_timestamp: str


@dataclass
class Payment:
    payment_id: str
    parliament_house: str
    normalized_work_id: str
    expenditure_date: Optional[str]
    vendor_name_raw: str
    canonical_vendor_id: Optional[str]
    disbursed_amount: float
    payment_status: str
    source_file: str
    source_row_id: str


@dataclass
class CalamityConsent:
    calamity_id: str
    parliament_house: str
    calamity_type: str
    calamity_name: str
    mp_name_raw: str
    consent_date: Optional[str]
    consent_amount: float
    source_file: str


@dataclass
class WorkLifecycle:
    identity: CanonicalWorkIdentity
    work_name_raw: str
    work_category: Optional[str]
    work_description: Optional[str]
    state: str
    constituency: str  # "UNAVAILABLE" for Rajya Sabha
    ida_name_raw: Optional[str]
    mp_name_raw: Optional[str]
    elected_or_nominated: str

    # Status indicators for lifecycle stages
    recommendation_status: LifecycleStatus = LifecycleStatus.NOT_OBSERVED
    sanction_status: LifecycleStatus = LifecycleStatus.NOT_OBSERVED
    completion_status: LifecycleStatus = LifecycleStatus.NOT_OBSERVED
    expenditure_status: LifecycleStatus = LifecycleStatus.NOT_OBSERVED

    # Dates
    recommendation_date: Optional[str] = None
    sanction_date: Optional[str] = None
    completion_date: Optional[str] = None
    first_payment_date: Optional[str] = None
    last_payment_date: Optional[str] = None

    # Amounts
    recommendation_amount: Optional[float] = None
    sanction_amount: Optional[float] = None
    disbursed_amount: Optional[float] = None
    current_expenditure: Optional[float] = None

    # Durations in days
    recommendation_to_sanction_days: Optional[float] = None
    sanction_to_completion_days: Optional[float] = None
    sanction_to_first_payment_days: Optional[float] = None

    # Payments & Vendors list
    payments: List[Payment] = field(default_factory=list)
    image_paths: List[str] = field(default_factory=list)
    source_records: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class Evidence:
    rule_id: str
    triggered: bool
    severity: str  # LOW, MODERATE, HIGH, CRITICAL
    evidence_family: str
    observed_values: Dict[str, Any]
    expected_relationship: str
    source_records: List[str]
    description: str
