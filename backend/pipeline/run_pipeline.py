"""
Orchestrates the full pipeline: ingest -> reconcile -> rules -> duplicate -> anomaly -> risk score.
Run directly: python -m pipeline.run_pipeline
Produces DB records for the API to serve.
"""

import json
import pandas as pd
from pathlib import Path
from datetime import datetime

from . import ingest, reconcile, rules, duplicate, anomaly, risk_score
from db.database import SessionLocal, engine, Base
from db import crud

# Create tables
Base.metadata.create_all(bind=engine)

def run(houses=("Lok Sabha", "Rajya Sabha"), prediction_time: pd.Timestamp = None):
    print(f"[1/7] Ingesting data... (prediction_time={prediction_time})")
    datasets = ingest.load_combined(houses=houses)
    for k, v in datasets.items():
        print(f"    {k}: {'MISSING' if v is None else f'{len(v)} rows'}")

    print("[2/7] Reconciling lifecycle...")
    master = reconcile.build_master_table(datasets, prediction_time=prediction_time)

    print("[3/7] Applying rule-based flags...")
    master = rules.apply_all_rules(master, prediction_time=prediction_time)
    
    completed_keys = set(zip(master["parliament_house"], master["work_id"]))
    ongoing = rules.flag_ongoing_utilization_trajectory(
        datasets.get("sanctioned"), datasets.get("expenditure"), completed_keys
    )
    ongoing_full = None
    if not ongoing.empty:
        # Merge the trajectory info into master for any works that are sanctioned but not completed
        sanctioned_df = datasets.get("sanctioned")
        ongoing_full = sanctioned_df.merge(ongoing, on=["parliament_house", "work_id"])
        ongoing_full["lifecycle_coverage"] = "ONGOING"
        ongoing_full["risk_score"] = 0
        ongoing_full["missing_photo"] = False
        ongoing_full["is_delayed"] = False

    print("[4/7] Running duplicate detection...")
    master = duplicate.flag_rule_based_duplicates(master)
    master = duplicate.flag_semantic_duplicates(master)

    print("[5/7] Running ML anomaly detection...")
    master = anomaly.flag_ml_anomalies(master)

    print("[6/7] Computing risk scores...")
    master = risk_score.compute_risk_scores(master)

    print("[7/7] Saving to database...")
    db = SessionLocal()
    try:
        # Convert datetime columns properly
        for col in master.select_dtypes(include=['datetime64[ns]']).columns:
            master[col] = master[col].astype(str).replace('NaT', None)
            
        if ongoing_full is not None and not ongoing_full.empty:
            for col in ongoing_full.select_dtypes(include=['datetime64[ns]']).columns:
                ongoing_full[col] = ongoing_full[col].astype(str).replace('NaT', None)
            master = pd.concat([master, ongoing_full], ignore_index=True)
            
        # Serialize lists to JSON strings for SQLite compatibility
        if 'evidence' in master.columns:
            master['evidence'] = master['evidence'].apply(lambda x: json.dumps(x) if isinstance(x, list) else x)
            
        # Add missing SQLAlchemy columns
        master["investigation_status"] = "UNREVIEWED"
        master["investigation_outcome"] = "UNKNOWN_NONE"
        master["updated_at"] = None
            
        # Drop duplicates if any
        master = master.drop_duplicates(subset=["parliament_house", "work_id"])
        
        # Save works
        master.to_sql("works", con=engine, if_exists="replace", index=True, index_label="id")
        
        # Save expenditure details
        exp = datasets.get("expenditure")
        if exp is not None and not exp.empty:
            for col in exp.select_dtypes(include=['datetime64[ns]']).columns:
                exp[col] = exp[col].astype(str).replace('NaT', None)
            exp.to_sql("payments", con=engine, if_exists="replace", index=True, index_label="id")
        
        summary = {
            "total_works": len(master),
            "flagged_works": int((master["risk_score"] > 0).sum()) if "risk_score" in master else 0,
            "high_risk_works": int((master["risk_score"] >= 50).sum()) if "risk_score" in master else 0,
            "missing_photo_count": int(master["missing_photo"].sum()) if "missing_photo" in master else None,
            "delayed_count": int((master["is_delayed"] == True).sum()) if "is_delayed" in master else None,
            "duplicate_count": int(master["is_duplicate_candidate"].sum()) if "is_duplicate_candidate" in master else None,
            "underutilized_count": int((master["is_underutilized"] == True).sum()) if "is_underutilized" in master else None,
        }
        print(f"\nDone. {len(master)} works scored and saved to DB.")
        print(f"Summary: {summary}")
    finally:
        db.close()
        
    return master

if __name__ == "__main__":
    run()
