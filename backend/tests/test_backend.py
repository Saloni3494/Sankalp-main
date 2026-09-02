import pytest
import pandas as pd
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from pipeline.ingest import load_combined
from pipeline.reconcile import build_master_table
from pipeline.rules import flag_delay, flag_impossible_dates, flag_ongoing_utilization_trajectory
from api import app
from db.database import Base, engine, SessionLocal
from db.models import Work, InvestigationStatus, InvestigationOutcome
from pipeline import run_pipeline

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_api_works_endpoint():
    response = client.get("/works")
    # Will be 200, but empty if no pipeline ran
    assert response.status_code == 200
    assert "results" in response.json()

def test_api_investigation_workflow():
    db = SessionLocal()
    # Insert a dummy work
    w = Work(work_id="TEST-1", parliament_house="Lok Sabha", risk_score=50)
    db.add(w)
    db.commit()
    db.close()
    
    # Review
    res = client.post("/investigations/TEST-1/review", 
                      json={"status": "INVESTIGATION_OPEN", "outcome": "UNKNOWN/NONE"},
                      headers={"X-API-Key": "sankalp-admin-key"})
    assert res.status_code == 200
    
    # Verify
    db = SessionLocal()
    w = db.query(Work).filter(Work.work_id == "TEST-1").first()
    assert w.investigation_status == InvestigationStatus.INVESTIGATION_OPEN
    db.close()

def test_future_injection_leakage():
    # Test temporal leakage prevention
    today = pd.Timestamp.today()
    future = today + pd.Timedelta(days=10)
    past = today - pd.Timedelta(days=10)
    
    datasets = {
        "completed": pd.DataFrame({
            "parliament_house": ["Lok Sabha", "Lok Sabha"],
            "work_id": ["W1", "W2"],
            "completion_date": [past, future],
            "available_at": [past, future]
        })
    }
    
    # Prediction time is today. The future work should be filtered out!
    master = build_master_table(datasets, prediction_time=today)
    
    assert "W1" in master["work_id"].values
    assert "W2" not in master["work_id"].values
    
def test_house_isolation_and_reconciliation():
    # Test cross-house contamination prevention
    datasets = {
        "completed": pd.DataFrame({
            "parliament_house": ["Lok Sabha", "Rajya Sabha"],
            "work_id": ["W1", "W1"],
            "completion_date": ["2020-01-01", "2020-01-01"],
            "available_at": [pd.NaT, pd.NaT]
        }),
        "expenditure": pd.DataFrame({
            "parliament_house": ["Lok Sabha"],
            "work_id": ["W1"],
            "payment_amount": [1000],
            "available_at": [pd.NaT]
        })
    }
    
    master = build_master_table(datasets)
    ls_work = master[(master["parliament_house"] == "Lok Sabha") & (master["work_id"] == "W1")].iloc[0]
    rs_work = master[(master["parliament_house"] == "Rajya Sabha") & (master["work_id"] == "W1")].iloc[0]
    
    assert ls_work["total_paid"] == 1000
    # RS should NOT have Lok Sabha's expenditure!
    assert pd.isna(rs_work["total_paid"])

def test_impossible_dates_rule():
    df = pd.DataFrame({
        "sanction_date": ["2024-01-01", "2024-01-01"],
        "completion_date": ["2023-01-01", "2024-02-01"],  # First is impossible (completed before sanction)
        "recommended_date": ["2023-12-01", "2023-12-01"]
    })
    res = flag_impossible_dates(df)
    assert res["impossible_dates"].iloc[0] == True
    assert res["impossible_dates"].iloc[1] == False
