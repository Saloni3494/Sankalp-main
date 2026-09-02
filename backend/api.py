"""
FastAPI backend for MPLADS Sentinel.
"""
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from sqlalchemy import func

from db.database import get_db, engine, Base
from db.models import Work, Payment, InvestigationStatus, InvestigationOutcome
from schemas import ReviewRequest

# Ensure DB is created
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MPLADS Sentinel API")

# Security: Remove CORS "*" and specify local dev origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    # Very simple static key for hackathon/prototype protection of sensitive endpoints
    if api_key != "sankalp-admin-key":
        raise HTTPException(status_code=403, detail="Invalid or missing API Key")
    return api_key

@app.get("/")
def root():
    return {"status": "ok", "service": "MPLADS Sentinel API"}

@app.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total = db.query(Work).count()
    if total == 0:
        raise HTTPException(status_code=503, detail="Database empty. Run the pipeline first.")
    
    flagged = db.query(Work).filter(Work.risk_score > 0).count()
    high_risk = db.query(Work).filter(Work.risk_score >= 50).count()
    
    amount_at_risk = db.query(func.sum(Work.amount_disbursed)).filter(Work.risk_score >= 50).scalar() or 0
    missing_photo = db.query(Work).filter(Work.missing_photo == True).count()
    
    ls_count = db.query(Work).filter(Work.parliament_house == "Lok Sabha").count()
    rs_count = db.query(Work).filter(Work.parliament_house == "Rajya Sabha").count()
    
    return {
        "total_works": total,
        "flagged_works": flagged,
        "high_risk_works": high_risk,
        "total_amount_at_risk": amount_at_risk,
        "missing_photo_count": missing_photo,
        "by_house": {
            "Lok Sabha": {"count": ls_count},
            "Rajya Sabha": {"count": rs_count}
        }
    }

@app.get("/works")
def get_works(
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    min_risk: float = Query(0, ge=0, le=100),
    house: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    flagged_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(Work)
    
    if min_risk > 0:
        query = query.filter(Work.risk_score >= min_risk)
    if flagged_only:
        query = query.filter(Work.risk_score > 0)
    if house:
        query = query.filter(Work.parliament_house == house)
    if state:
        query = query.filter(Work.state == state)
        
    total = query.count()
    works = query.order_by(Work.risk_score.desc()).offset(offset).limit(limit).all()
    
    # Convert to dict to match old frontend contract
    results = []
    for w in works:
        results.append({
            "work_id": w.work_id,
            "parliament_house": w.parliament_house,
            "work_category": w.work_category,
            "state": w.state,
            "ida": w.ida,
            "mp_name": w.mp_name,
            "constituency": w.constituency,
            "work_description": w.work_description,
            "risk_score": w.risk_score,
            "evidence": w.evidence,
            "amount_disbursed": w.amount_disbursed,
            "sanction_amount": w.sanction_amount,
            "missing_photo": w.missing_photo,
            "investigation_status": w.investigation_status,
        })

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "results": results,
    }

@app.get("/works/{work_id}")
def get_work(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Work).filter(Work.work_id == work_id)
    if house:
        query = query.filter(Work.parliament_house == house)
    
    work = query.first()
    if not work:
        raise HTTPException(status_code=404, detail=f"Work {work_id} not found")
        
    return {
        "work_id": work.work_id,
        "parliament_house": work.parliament_house,
        "work_category": work.work_category,
        "state": work.state,
        "ida": work.ida,
        "mp_name": work.mp_name,
        "constituency": work.constituency,
        "work_description": work.work_description,
        "risk_score": work.risk_score,
        "evidence": work.evidence,
        "amount_disbursed": work.amount_disbursed,
        "sanction_amount": work.sanction_amount,
        "completion_date": work.completion_date,
        "missing_photo": work.missing_photo,
        "investigation_status": work.investigation_status.value if work.investigation_status else None,
        "investigation_outcome": work.investigation_outcome.value if work.investigation_outcome else None,
        "vendor_count": work.vendor_count,
        "payment_count": work.payment_count,
        "data_completeness": work.data_completeness,
        "lifecycle_coverage": work.lifecycle_coverage
    }

# New Endpoints required by V7 Spec

@app.get("/works/{work_id}/lifecycle")
def get_work_lifecycle(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Work).filter(Work.work_id == work_id)
    if house: query = query.filter(Work.parliament_house == house)
    w = query.first()
    if not w: raise HTTPException(404)
    return {
        "recommended_date": w.recommended_date,
        "sanction_date": w.sanction_date,
        "completion_date": w.completion_date,
        "lifecycle_coverage": w.lifecycle_coverage
    }

@app.get("/works/{work_id}/payments")
def get_work_payments(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Payment).filter(Payment.work_id == work_id)
    if house: query = query.filter(Payment.parliament_house == house)
    payments = query.all()
    return [{"vendor_name": p.vendor_name, "payment_amount": p.payment_amount, "payment_date": p.payment_date} for p in payments]

@app.get("/works/{work_id}/vendors")
def get_work_vendors(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Payment.vendor_name, func.sum(Payment.payment_amount).label("total")).filter(Payment.work_id == work_id)
    if house: query = query.filter(Payment.parliament_house == house)
    vendors = query.group_by(Payment.vendor_name).all()
    return [{"vendor_name": v[0], "total_paid": v[1]} for v in vendors if v[0]]

@app.get("/works/{work_id}/evidence")
def get_work_evidence(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Work).filter(Work.work_id == work_id)
    if house: query = query.filter(Work.parliament_house == house)
    w = query.first()
    if not w: raise HTTPException(404)
    return {"evidence": w.evidence, "evidence_count": w.evidence_count, "data_completeness": w.data_completeness}

@app.post("/investigations/{work_id}/review")
def review_work(work_id: str, req: ReviewRequest, house: Optional[str] = None, db: Session = Depends(get_db), api_key: str = Depends(get_api_key)):
    query = db.query(Work).filter(Work.work_id == work_id)
    if house: query = query.filter(Work.parliament_house == house)
    w = query.first()
    if not w: raise HTTPException(404)
    
    try:
        w.investigation_status = InvestigationStatus(req.status)
        w.investigation_outcome = InvestigationOutcome(req.outcome)
        db.commit()
    except ValueError:
        raise HTTPException(400, "Invalid status or outcome")
        
    return {"status": "success", "work_id": w.work_id, "investigation_status": w.investigation_status}

@app.get("/risk/works/{work_id}")
def get_risk_work(work_id: str, house: Optional[str] = None, db: Session = Depends(get_db)):
    return get_work_evidence(work_id, house, db)

@app.get("/analytics/states")
def get_analytics_states(db: Session = Depends(get_db)):
    query = db.query(Work.state, func.count(Work.id), func.avg(Work.risk_score)).group_by(Work.state).all()
    return [{"state": r[0], "count": r[1], "avg_risk": r[2]} for r in query if r[0]]

@app.post("/pipeline/run")
def rerun_pipeline(api_key: str = Depends(get_api_key)):
    """Re-run the pipeline with authentication."""
    from pipeline.run_pipeline import run
    try:
        # We can pass an optional prediction_time here if requested by frontend, but for now it uses today if None.
        master = run()
        return {"status": "ok", "total_works": len(master)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
