import json
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy.dialects.sqlite import insert as sqlite_upsert
from sqlalchemy.dialects.postgresql import insert as pg_upsert
from .models import Work, Payment, ParliamentHouse, InvestigationStatus, InvestigationOutcome

def upsert_works(db: Session, works_df: pd.DataFrame):
    if works_df.empty:
        return
        
    records = works_df.to_dict(orient="records")
    for r in records:
        # Convert pandas NaN/NaT to None
        for k, v in r.items():
            if pd.isna(v):
                r[k] = None
                
    # We will just do simple get-or-create/update to be DB agnostic
    for r in records:
        work = db.query(Work).filter(
            Work.parliament_house == r.get("parliament_house"),
            Work.work_id == r.get("work_id")
        ).first()
        
        if not work:
            work = Work(
                parliament_house=r.get("parliament_house"),
                work_id=r.get("work_id")
            )
            db.add(work)
            
        work.work_category = r.get("work_category")
        work.state = r.get("state")
        work.ida = r.get("ida")
        work.mp_name = r.get("mp_name")
        work.constituency = r.get("constituency")
        work.work_description = r.get("work_description")
        work.recommended_date = r.get("recommended_date")
        work.sanction_date = r.get("sanction_date")
        work.completion_date = r.get("completion_date")
        work.sanction_amount = r.get("sanction_amount")
        work.amount_disbursed = r.get("amount_disbursed")
        work.lifecycle_coverage = r.get("lifecycle_coverage")
        work.missing_photo = r.get("missing_photo")
        work.vendor_count = r.get("vendor_count", 0)
        work.payment_count = r.get("payment_count", 0)
        work.risk_score = r.get("risk_score", 0)
        
        # handle evidence which could be a list
        evidence = r.get("evidence", [])
        if isinstance(evidence, str):
            try:
                evidence = json.loads(evidence)
            except:
                evidence = []
        work.evidence = evidence
        work.evidence_count = r.get("evidence_count", 0)
        work.data_completeness = r.get("data_completeness", 0)
        work.event_time = r.get("event_time")
        work.available_at = r.get("available_at")
        
    db.commit()

def upsert_payments(db: Session, payments_df: pd.DataFrame):
    if payments_df.empty:
        return
        
    records = payments_df.to_dict(orient="records")
    for r in records:
        for k, v in r.items():
            if pd.isna(v):
                r[k] = None
                
        payment = Payment(
            parliament_house=r.get("parliament_house"),
            work_id=r.get("work_id"),
            vendor_name=r.get("vendor_name"),
            payment_amount=r.get("payment_amount"),
            payment_date=r.get("expenditure_date"),
            event_time=r.get("event_time"),
            available_at=r.get("available_at"),
        )
        db.add(payment)
    db.commit()
