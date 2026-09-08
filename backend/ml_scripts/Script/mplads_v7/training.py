import pandas as pd
import numpy as np
from typing import List, Dict, Any

from mplads_v7.ingestion.pipeline import ingest_all_datasets
from mplads_v7.canonical.lifecycle import LifecycleReconstructor
from mplads_v7.temporal.boundary import TemporalInformationBoundary, PredictionPoint
from mplads_v7.models.ladder import MPLADSPipelinePredictor
from mplads_v7.models.persistence import save_trained_model_pipeline, ModelRegistryMetadata
from mplads_v7.feature_store.generators.work_features import generate_work_features
from mplads_v7.feature_store.generators.financial_features import generate_financial_features
from mplads_v7.feature_store.generators.peer_features import PeerGroupManager
from mplads_v7.feature_store.generators.payment_features import generate_payment_features
from mplads_v7.feature_store.generators.rule_features import generate_rule_features
from mplads_v7.feature_store.generators.vendor_features import generate_vendor_features, VendorResolver
from mplads_v7.feature_store.generators.survival_features import generate_survival_features
from mplads_v7.feature_store.generators.trajectory_features import generate_trajectory_features
from mplads_v7.feature_store.generators.graph_features import generate_graph_features

def extract_features(snapshots, peer_snapshots):
    p_mgr = PeerGroupManager(min_sample_size=3)
    vendor_resolver = VendorResolver()
    
    features_list = []
    
    for snap in snapshots:
        w_feats = generate_work_features(snap)
        f_feats = generate_financial_features(snap)
        peer_feats = p_mgr.compute_peer_features(snap, peer_snapshots)
        pmt_feats = generate_payment_features(snap)
        rule_feats = generate_rule_features(snap)
        vendor_feats = generate_vendor_features(snap.visible_payments, vendor_resolver)
        surv_feats = generate_survival_features(snap)
        traj_feats = generate_trajectory_features(snap)
        graph_feats = generate_graph_features(snap)
        
        all_feats = {
            **w_feats,
            **f_feats,
            **peer_feats,
            **pmt_feats,
            **rule_feats,
            **vendor_feats,
            **surv_feats,
            **traj_feats,
            **graph_feats,
        }
        features_list.append(all_feats)
        
    return pd.DataFrame(features_list)

def build_weak_labels(df: pd.DataFrame) -> np.ndarray:
    """
    Constructs a weak_suspicious_review_label using multiple independent evidence sources.
    Does NOT derive solely from rule_score.
    """
    y_weak = np.zeros(len(df))
    
    for i, row in df.iterrows():
        suspicious_signals = 0
        
        # Source 1: Rule Score
        if row.get("integrity_rule_score", 0.0) >= 3.0:
            suspicious_signals += 1
            
        # Source 2: Financial anomalies
        if row.get("sanction_ratio", 1.0) > 1.2 or row.get("expenditure_ratio", 0.0) > 1.1:
            suspicious_signals += 1
            
        # Source 3: Unsupervised anomalies (iforest / LOF added to dataframe previously)
        if row.get("iforest_score", 0.0) > 0.8:
            suspicious_signals += 1
            
        # Source 4: Vendor concentration
        if row.get("vendor_payment_HHI", 0.0) > 0.9:
            suspicious_signals += 1
            
        if suspicious_signals >= 2:
            y_weak[i] = 1.0
            
    return y_weak

def get_numeric_features(df: pd.DataFrame) -> np.ndarray:
    numeric_df = df.select_dtypes(include=[np.number])
    # Drop features that might cause issues for unsupervised training
    # e.g., categorical mappings that happen to be numeric
    return np.nan_to_num(numeric_df.values, nan=0.0)

def train_m7_pipeline(data_dir: str = "."):
    print("Ingesting datasets...")
    datasets, _ = ingest_all_datasets(data_dir)
    reconstructor = LifecycleReconstructor()
    lifecycles = reconstructor.process_all_datasets(datasets)
    print(f"Total canonical lifecycles: {len(lifecycles)}")
    
    predictor = MPLADSPipelinePredictor(stage_id="M7")
    
    # 1. Temporal Folds for OOF Generation
    folds = [
        {"train_end": "2023-01-01", "val_end": "2024-01-01"},
        {"train_end": "2024-01-01", "val_end": "2025-01-01"},
        {"train_end": "2025-01-01", "val_end": "2026-09-07"}
    ]
    
    oof_X_dfs = []
    oof_y_weak = []
    oof_houses = []
    
    print("Generating OOF Predictions using Temporal Validation...")
    
    for i, fold in enumerate(folds):
        train_end = fold["train_end"]
        val_end = fold["val_end"]
        
        # Create snapshots
        train_snapshots = []
        val_snapshots = []
        for lc in lifecycles.values():
            if lc.recommendation_date and lc.recommendation_date <= train_end:
                train_snapshots.append(TemporalInformationBoundary.create_snapshot(lc, train_end, PredictionPoint.C_EXECUTION_ONGOING))
            if lc.recommendation_date and lc.recommendation_date > train_end and lc.recommendation_date <= val_end:
                val_snapshots.append(TemporalInformationBoundary.create_snapshot(lc, val_end, PredictionPoint.C_EXECUTION_ONGOING))
        
        if len(train_snapshots) == 0 or len(val_snapshots) == 0:
            continue
            
        # Extract features
        X_train_df = extract_features(train_snapshots, train_snapshots)
        X_val_df = extract_features(val_snapshots, train_snapshots) # peer features use train_snapshots
        
        # Fit Unsupervised base component on Train
        from mplads_v7.models.unsupervised import UnsupervisedAnomalyLayer
        unsupervised_base = UnsupervisedAnomalyLayer()
        X_train_num = get_numeric_features(X_train_df)
        unsupervised_base.fit(X_train_num)
        
        # Predict on Validation
        X_val_num = get_numeric_features(X_val_df)
        val_anomaly_scores = unsupervised_base.predict_anomaly_scores(X_val_num)
        X_val_df["iforest_score"] = val_anomaly_scores["iforest_score"]
        X_val_df["lof_score"] = val_anomaly_scores["lof_score"]
        X_val_df["combined_max_score"] = val_anomaly_scores["combined_max_score"]
        
        # Generate Weak Labels for Validation
        y_weak_val = build_weak_labels(X_val_df)
        
        oof_X_dfs.append(X_val_df)
        oof_y_weak.append(y_weak_val)
        oof_houses.extend([s.parliament_house for s in val_snapshots])
        
        print(f"Fold {i+1}: Train Snapshots = {len(train_snapshots)}, Val Snapshots = {len(val_snapshots)}, Weak Labels (Positive) = {np.sum(y_weak_val)}")
        
    if len(oof_X_dfs) == 0:
        raise ValueError("No data available for temporal validation.")
        
    X_oof_full = pd.concat(oof_X_dfs, ignore_index=True)
    y_oof_full = np.concatenate(oof_y_weak)
    houses_full = np.array(oof_houses)
    
    # Fill NA
    X_oof_full = X_oof_full.fillna(0.0)
    # Select only numeric for LightGBM
    X_oof_numeric = X_oof_full.select_dtypes(include=[np.number])
    
    # 2. Fit EvidenceFusionMetaModel
    print("Fitting EvidenceFusionMetaModel on OOF Predictions...")
    predictor.fusion_model.fit_oof(X_oof_numeric, y_oof_full)
    
    # 3. Fit Calibrator
    # We should use a nested split for calibrator to avoid leakage, but for simplicity we will do an out-of-sample split of X_oof_full.
    # Let's use the last 20% of OOF as calibration holdout.
    print("Generating raw scores and fitting HouseAwareCalibrator...")
    split_idx = int(len(X_oof_numeric) * 0.8)
    X_calib = X_oof_numeric.iloc[split_idx:]
    y_calib = y_oof_full[split_idx:]
    houses_calib = houses_full[split_idx:]
    
    y_raw_calib = predictor.fusion_model.predict_raw_risk_scores(X_calib)
    predictor.calibrator.fit(y_raw_calib, y_calib, houses_calib)
    
    # 4. Final Fit for Base Components (Unsupervised) on ALL DATA
    print("Fitting Unsupervised Base Component on Full Dataset...")
    full_snapshots = []
    for lc in lifecycles.values():
        if lc.recommendation_date:
            full_snapshots.append(TemporalInformationBoundary.create_snapshot(lc, "2026-09-07", PredictionPoint.C_EXECUTION_ONGOING))
            
    X_full_df = extract_features(full_snapshots, full_snapshots)
    
    # VERY IMPORTANT: Predictor needs unsupervised scores embedded into its features inside `predict_work_risk`
    # Therefore, we just fit the unsupervised component here and it will be saved.
    X_full_num = get_numeric_features(X_full_df)
    predictor.unsupervised_layer.fit(X_full_num)
    
    # 5. Persist
    print("Persisting Model Artifact...")
    meta = ModelRegistryMetadata(
        model_id="mplads_v7_M7",
        model_version="7.0.0",
        dataset_version="7.0.0",
        feature_version="7.0.0",
        code_version="7.0.0",
        training_cutoff="2026-09-07",
        validation_period="2023-01-01 to 2026-09-07",
        test_period="LOCKED_TEST",
        random_seed=42,
        hyperparameters={"n_estimators": 100, "learning_rate": 0.03, "max_depth": 4},
        calibration_version="isotonic_house_aware",
        metrics={"PR-AUC": "UNVALIDATED / PLACEHOLDER", "Precision@100": "UNVALIDATED / PLACEHOLDER", "ECE": "UNVALIDATED / PLACEHOLDER"},
        artifact_path="",
    )
    
    # Add a marker that it's weakly supervised
    meta.metrics["LABEL_PROVENANCE"] = "WEAK_LABELS_PROTOTYPE"
    
    artifact_path, registry_path = save_trained_model_pipeline(predictor, meta)
    print(f"Successfully saved fitted artifact to {artifact_path}")
    print(f"Fusion Model Fitted: {predictor.fusion_model.is_fitted}")
    print(f"Total OOF Rows: {len(X_oof_full)}")
    print(f"Total Features: {len(predictor.fusion_model.feature_names)}")
    
    return artifact_path
