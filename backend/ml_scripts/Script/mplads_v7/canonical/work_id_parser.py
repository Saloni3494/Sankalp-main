"""
Phase 2 — Versioned Work-ID Parser.
Extracts normalized Work IDs from text strings or dedicated columns.
Outputs extraction status: EXACT, NORMALIZED, AMBIGUOUS, UNRESOLVED, MISSING.
NEVER force-matches ambiguous Work IDs.
"""

import re
from dataclasses import dataclass
from typing import Optional, Tuple
from mplads_v7.canonical.entities import ExtractionStatus

PARSER_VERSION = "7.0.0"

# Pattern matching standard MPLADS Work IDs:
# e.g. WS/MP418/2024-2025/133409 or WS/ MP620/2024-2025/133166 or WS_MP345_2024-2025_134143
WORK_ID_REGEX = re.compile(
    r"\b(WS\s*[\/\_\-]\s*MP\s*\d{1,6}\s*[\/\_\-]\s*\d{4}\s*[\/\_\-]\s*\d{4}\s*[\/\_\-]\s*\d{3,10})\b",
    re.IGNORECASE
)

# Secondary pattern for simpler ID structures e.g., WS/MP123/123456
WORK_ID_ALT_REGEX = re.compile(
    r"\b(WS\s*[\/\_\-]\s*MP\s*\d{1,6}\s*[\/\_\-]\s*\d{3,10})\b",
    re.IGNORECASE
)


@dataclass
class WorkIDExtractionResult:
    raw_work_identifier: Optional[str]
    normalized_work_id: str
    work_id_parser_version: str
    work_id_extraction_status: ExtractionStatus
    work_id_extraction_confidence: float


def parse_work_id(raw_text: Optional[str], fallback_row_idx: str = "") -> WorkIDExtractionResult:
    """
    Parses raw work text or ID string into a normalized Work ID representation.
    """
    if not raw_text or str(raw_text).strip().lower() in ["nan", "none", "", "n/a", "null"]:
        return WorkIDExtractionResult(
            raw_work_identifier=raw_text,
            normalized_work_id=f"SYNTH_UNRESOLVED_{fallback_row_idx}",
            work_id_parser_version=PARSER_VERSION,
            work_id_extraction_status=ExtractionStatus.MISSING,
            work_id_extraction_confidence=0.0,
        )

    clean_text = str(raw_text).strip()

    # Search for primary pattern
    matches = WORK_ID_REGEX.findall(clean_text)
    if len(matches) == 1:
        raw_match = matches[0]
        # Normalize whitespace and separators to canonical format WS/MPXXX/YYYY-YYYY/ZZZZZZ
        norm = re.sub(r"\s+", "", raw_match).upper()
        norm = norm.replace("_", "/").replace("-", "/")
        # Ensure year portion is YYYY-YYYY
        parts = norm.split("/")
        if len(parts) >= 4:
            norm_id = f"{parts[0]}/{parts[1]}/{parts[2]}-{parts[3]}/{parts[4]}"
        else:
            norm_id = norm

        status = ExtractionStatus.EXACT if clean_text == raw_match else ExtractionStatus.NORMALIZED
        confidence = 1.0 if status == ExtractionStatus.EXACT else 0.95

        return WorkIDExtractionResult(
            raw_work_identifier=clean_text,
            normalized_work_id=norm_id,
            work_id_parser_version=PARSER_VERSION,
            work_id_extraction_status=status,
            work_id_extraction_confidence=confidence,
        )

    elif len(matches) > 1:
        # Multiple matches = AMBIGUOUS. Never force-match!
        return WorkIDExtractionResult(
            raw_work_identifier=clean_text,
            normalized_work_id=f"AMBIGUOUS_{fallback_row_idx}",
            work_id_parser_version=PARSER_VERSION,
            work_id_extraction_status=ExtractionStatus.AMBIGUOUS,
            work_id_extraction_confidence=0.3,
        )

    # Search for secondary pattern
    alt_matches = WORK_ID_ALT_REGEX.findall(clean_text)
    if len(alt_matches) == 1:
        raw_match = alt_matches[0]
        norm = re.sub(r"\s+", "", raw_match).upper().replace("_", "/").replace("-", "/")
        return WorkIDExtractionResult(
            raw_work_identifier=clean_text,
            normalized_work_id=norm,
            work_id_parser_version=PARSER_VERSION,
            work_id_extraction_status=ExtractionStatus.NORMALIZED,
            work_id_extraction_confidence=0.85,
        )

    # Fallback to hash of cleaned title string to prevent loss of records, tagged UNRESOLVED
    # Strictly marked UNRESOLVED status with confidence 0.5
    clean_title_hash = f"UNRESOLVED_{hashlib_short(clean_text)}"
    return WorkIDExtractionResult(
        raw_work_identifier=clean_text,
        normalized_work_id=clean_title_hash,
        work_id_parser_version=PARSER_VERSION,
        work_id_extraction_status=ExtractionStatus.UNRESOLVED,
        work_id_extraction_confidence=0.5,
    )


def hashlib_short(text: str) -> str:
    import hashlib
    return hashlib.md5(text.encode("utf-8")).hexdigest()[:12].upper()
