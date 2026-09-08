import os
import pickle
import pandas as pd
from typing import Dict, List, Any
import datetime

import sys
script_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ml_scripts', 'Script'))
if script_dir not in sys.path:
    sys.path.append(script_dir)

from mplads_v7.canonical.lifecycle import LifecycleReconstructor
from mplads_v7.temporal.boundary import TemporalInformationBoundary, PredictionPoint
from mplads_v7.training import extract_features, get_numeric_features

class M7InferenceService:
    _instance = None
    _predictor = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(M7InferenceService, cls).__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        # Load the latest fitted model artifact
        model_path = os.path.abspath(os.path.join(script_dir, "..", "mplads_v7_M7_v7.0.0.pkl"))
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model artifact not found at {model_path}")
        
        with open(model_path, 'rb') as f:
            self._predictor = pickle.load(f)
            
        print(f"[M7 Inference] Loaded model artifact: M7 v7.0.0 from {model_path}")

    def predict_batch(self, data_dir: str, as_of_date: str = None) -> pd.DataFrame:
        """
        Ingests raw datasets, reconstructs canonical lifecycles, and predicts risk.
        Returns a DataFrame mapping work_id to risk predictions.
        """
        from mplads_v7.ingestion.pipeline import ingest_all_datasets
        
        if as_of_date is None:
            as_of_date = datetime.datetime.now().strftime("%Y-%m-%d")

        print(f"[M7 Inference] Ingesting raw datasets from {data_dir}...")
        datasets, _ = ingest_all_datasets(data_dir)

        print(f"[M7 Inference] Reconstructing lifecycles for prediction...")
        reconstructor = LifecycleReconstructor()
        lifecycles = reconstructor.process_all_datasets(datasets)

        print(f"[M7 Inference] Creating Temporal Snapshots at {as_of_date}...")
        snapshots = []
        for lc in lifecycles.values():
            if lc.recommendation_date and lc.recommendation_date <= as_of_date:
                snap = TemporalInformationBoundary.create_snapshot(lc, as_of_date, PredictionPoint.C_EXECUTION_ONGOING)
                snapshots.append(snap)

        if not snapshots:
            return pd.DataFrame()

        print(f"[M7 Inference] Extracting temporal features for {len(snapshots)} snapshots...")
        X_df = extract_features(snapshots, snapshots)
        X_num = get_numeric_features(X_df)

        print(f"[M7 Inference] Scoring unsupervised anomaly base...")
        val_anomaly_scores = self._predictor.unsupervised_layer.predict_anomaly_scores(X_num)
        X_df['iforest_score'] = val_anomaly_scores['iforest_score']
        X_df['lof_score'] = val_anomaly_scores['lof_score']
        X_df['combined_max_score'] = val_anomaly_scores['combined_max_score']

        print(f"[M7 Inference] Scoring LightGBM fusion layer...")
        X_fusion = X_df.select_dtypes(include=['number']).fillna(0.0)
        fusion_probs = self._predictor.fusion_model.predict_raw_risk_scores(X_fusion)

        print(f"[M7 Inference] Applying Isotonic Calibration...")
        import numpy as np
        houses_array = np.array([snap.parliament_house.upper().replace(" ", "_") for snap in snapshots])
        
        calibrated_probs = np.zeros_like(fusion_probs)
        ls_mask = (houses_array == "LOK_SABHA")
        rs_mask = (houses_array == "RAJYA_SABHA")
        
        if ls_mask.any():
            calibrated_probs[ls_mask] = self._predictor.calibrator.calibrate(fusion_probs[ls_mask], "LOK_SABHA")
        if rs_mask.any():
            calibrated_probs[rs_mask] = self._predictor.calibrator.calibrate(fusion_probs[rs_mask], "RAJYA_SABHA")

        results = []
        for i, snap in enumerate(snapshots):
            prob = float(calibrated_probs[i])
            
            # Map probability to strict risk band
            if prob > 0.8:
                risk_band = "High"
            elif prob > 0.4:
                risk_band = "Medium"
            else:
                risk_band = "Low"

            evidence = []
            if prob > 0.8:
                evidence.append({"type": "Fusion", "description": "M7 MetaModel flags severe structural risk", "strength": "Strong"})
            if X_df.iloc[i].get('combined_max_score', 0) > 0.7:
                evidence.append({"type": "Anomaly", "description": "High multidimensional anomaly score detected", "strength": "Medium"})
            if X_df.iloc[i].get('amount_disbursed', 0) > X_df.iloc[i].get('sanction_amount', float('inf')):
                evidence.append({"type": "Financial", "description": "Expenditure exceeds sanction amount", "strength": "Critical"})

            # Convert 'LOK_SABHA' to 'Lok Sabha' to ensure perfect DB merge
            phouse_mapped = snap.parliament_house.replace("_", " ").title() if "_" in snap.parliament_house else snap.parliament_house

            res = {
                "parliament_house": phouse_mapped,
                "work_id": snap.work_id,
                "m7_risk_score": prob,
                "m7_risk_band": risk_band,
                "m7_evidence": evidence,
                "m7_model_version": "v7.0.0",
                "m7_abstention_status": "NONE",
                "m7_uncertainty": 0.05,
                "m7_data_completeness": getattr(snap, 'lifecycle', snap).data_completeness if hasattr(getattr(snap, 'lifecycle', snap), 'data_completeness') else 0.0
            }
            results.append(res)

        return pd.DataFrame(results)

# Global singleton
m7_service = M7InferenceService()
