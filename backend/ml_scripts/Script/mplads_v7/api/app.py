"""
Phase 9 — Production FastAPI Backend Application.
Preserves existing frontend contract and exposes endpoints for works, lifecycle, payments, vendors, risk, and evidence case cards.
"""

from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from mplads_v7.ingestion.pipeline import ingest_all_datasets
from mplads_v7.canonical.lifecycle import LifecycleReconstructor
from mplads_v7.temporal.boundary import TemporalInformationBoundary, PredictionPoint
from mplads_v7.models.ladder import MPLADSPipelinePredictor

app = FastAPI(
    title="MPLADS v7 Dual-House Investigation Prioritization API",
    description="Backend API for MPLADS investigation risk scoring, evidence cards, and lifecycle tracking.",
    version="7.0.0",
)

# Global lazy-loaded state
_DATASETS = None
_LIFECYCLE_STORE = None
_PREDICTOR = None


def get_pipeline_state():
    global _DATASETS, _LIFECYCLE_STORE, _PREDICTOR
    if _LIFECYCLE_STORE is None:
        cleaned_datasets, _ = ingest_all_datasets(".")
        reconstructor = LifecycleReconstructor()
        _LIFECYCLE_STORE = reconstructor.process_all_datasets(cleaned_datasets)
        _PREDICTOR = MPLADSPipelinePredictor(stage_id="M7")
    return _LIFECYCLE_STORE, _PREDICTOR


@app.get("/")
def read_root():
    return {
        "service": "MPLADS v7 Dual-House Investigation Prioritization API",
        "status": "OPERATIONAL",
        "version": "7.0.0"
    }


@app.get("/works")
def list_works(
    house: Optional[str] = Query(None, description="LOK_SABHA or RAJYA_SABHA"),
    limit: int = Query(50, ge=1, le=500)
):
    lifecycles, _ = get_pipeline_state()
    results = []

    for (h, norm_id), lc in lifecycles.items():
        if house and h != house:
            continue
        results.append({
            "work_id": norm_id,
            "parliament_house": h,
            "work_name": lc.work_name_raw,
            "state": lc.state,
            "constituency": lc.constituency,
            "sanction_amount": lc.sanction_amount,
            "current_expenditure": lc.current_expenditure,
            "completion_date": lc.completion_date,
        })
        if len(results) >= limit:
            break

    return {"count": len(results), "works": results}


@app.get("/risk/summary")
def get_risk_summary():
    lifecycles, _ = get_pipeline_state()
    total_works = len(lifecycles)
    ls_count = sum(1 for (h, _) in lifecycles.keys() if h == "LOK_SABHA")
    rs_count = sum(1 for (h, _) in lifecycles.keys() if h == "RAJYA_SABHA")

    return {
        "pipeline_version": "7.0.0",
        "total_canonical_works": total_works,
        "lok_sabha_works": ls_count,
        "rajya_sabha_works": rs_count,
        "status": "OPERATIONAL",
    }


# Helper for resolving house and work_id
def resolve_key(house_param: str, id_param: str) -> tuple[str, str]:
    lifecycles, _ = get_pipeline_state()
    h_upper = house_param.upper()
    if h_upper in ["LOK_SABHA", "RAJYA_SABHA"]:
        if (h_upper, id_param) in lifecycles:
            return h_upper, id_param

    # Fallback if house_param was actually part of the work_id prefix (e.g. WS/MP...)
    full_id = f"{house_param}/{id_param}"
    for candidate_house in ["LOK_SABHA", "RAJYA_SABHA"]:
        if (candidate_house, full_id) in lifecycles:
            return candidate_house, full_id

    return h_upper, id_param


@app.get("/works/{house}/{id:path}/lifecycle")
def get_work_lifecycle(house: str, id: str):
    lifecycles, _ = get_pipeline_state()
    h_res, id_res = resolve_key(house, id)
    key = (h_res, id_res)
    if key not in lifecycles:
        raise HTTPException(status_code=404, detail=f"Work {id_res} in {h_res} not found.")

    lc = lifecycles[key]
    return {
        "work_id": lc.identity.normalized_work_id,
        "parliament_house": lc.identity.parliament_house,
        "recommendation_status": lc.recommendation_status.value,
        "sanction_status": lc.sanction_status.value,
        "completion_status": lc.completion_status.value,
        "expenditure_status": lc.expenditure_status.value,
        "recommendation_to_sanction_days": lc.recommendation_to_sanction_days,
        "sanction_to_completion_days": lc.sanction_to_completion_days,
        "sanction_to_first_payment_days": lc.sanction_to_first_payment_days,
    }


@app.get("/works/{house}/{id:path}/payments")
def get_work_payments(house: str, id: str):
    lifecycles, _ = get_pipeline_state()
    h_res, id_res = resolve_key(house, id)
    key = (h_res, id_res)
    if key not in lifecycles:
        raise HTTPException(status_code=404, detail=f"Work {id_res} in {h_res} not found.")

    lc = lifecycles[key]
    return {
        "work_id": lc.identity.normalized_work_id,
        "payment_count": len(lc.payments),
        "payments": [
            {
                "payment_id": p.payment_id,
                "expenditure_date": p.expenditure_date,
                "vendor_name_raw": p.vendor_name_raw,
                "disbursed_amount": p.disbursed_amount,
                "payment_status": p.payment_status,
            }
            for p in lc.payments
        ]
    }


@app.get("/works/{house}/{id:path}/vendors")
def get_work_vendors(house: str, id: str):
    lifecycles, _ = get_pipeline_state()
    h_res, id_res = resolve_key(house, id)
    key = (h_res, id_res)
    if key not in lifecycles:
        raise HTTPException(status_code=404, detail=f"Work {id_res} in {h_res} not found.")

    lc = lifecycles[key]
    vendors = set(p.vendor_name_raw for p in lc.payments if p.vendor_name_raw)
    return {
        "work_id": lc.identity.normalized_work_id,
        "vendor_count": len(vendors),
        "vendors": list(vendors)
    }


@app.get("/risk/works/{id:path}")
@app.get("/works/{house}/{id:path}/evidence")
@app.get("/works/{house}/{id:path}/explanations")
def get_risk_case_card_by_house(house: str, id: str, as_of_date: str = Query("2026-09-07")):
    lifecycles, predictor = get_pipeline_state()
    h_res, id_res = resolve_key(house, id)
    key = (h_res, id_res)
    if key not in lifecycles:
        raise HTTPException(status_code=404, detail=f"Work {id_res} in {h_res} not found.")

    lc = lifecycles[key]
    snap = TemporalInformationBoundary.create_snapshot(lc, as_of_date, PredictionPoint.C_EXECUTION_ONGOING)

    peer_snaps = [
        TemporalInformationBoundary.create_snapshot(other_lc, as_of_date, PredictionPoint.C_EXECUTION_ONGOING)
        for other_lc in list(lifecycles.values())[:100]
    ]

    case_card = predictor.predict_work_risk(snap, peer_snaps)
    return case_card


@app.get("/works/{id:path}/evidence")
@app.get("/works/{id:path}/explanations")
def get_risk_case_card(id: str, house: str = Query("LOK_SABHA"), as_of_date: str = Query("2026-09-07")):
    return get_risk_case_card_by_house(house=house, id=id, as_of_date=as_of_date)


@app.get("/works/{house}/{id:path}")
def get_work_by_id(house: str, id: str):
    lifecycles, _ = get_pipeline_state()
    h_res, id_res = resolve_key(house, id)
    key = (h_res, id_res)
    if key not in lifecycles:
        raise HTTPException(status_code=404, detail=f"Work {id_res} in {h_res} not found.")

    lc = lifecycles[key]
    return {
        "work_id": lc.identity.normalized_work_id,
        "parliament_house": lc.identity.parliament_house,
        "work_name": lc.work_name_raw,
        "work_category": lc.work_category,
        "work_description": lc.work_description,
        "state": lc.state,
        "constituency": lc.constituency,
        "ida_name_raw": lc.ida_name_raw,
        "mp_name_raw": lc.mp_name_raw,
        "elected_or_nominated": lc.elected_or_nominated,
        "recommendation_date": lc.recommendation_date,
        "sanction_date": lc.sanction_date,
        "completion_date": lc.completion_date,
        "recommendation_amount": lc.recommendation_amount,
        "sanction_amount": lc.sanction_amount,
        "disbursed_amount": lc.disbursed_amount,
        "current_expenditure": lc.current_expenditure,
    }
