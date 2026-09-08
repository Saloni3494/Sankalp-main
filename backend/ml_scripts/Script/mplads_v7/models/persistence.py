"""
Model Registry & Artifact Persistence Module.
Serializes trained model artifacts, calibrators, and metadata into artifacts/models/ and model_registry/.
Strictly satisfies Section 47 & Section 49 traceability requirements.
"""

import os
import json
import pickle
import logging
from dataclasses import dataclass, asdict
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

ARTIFACTS_DIR = os.path.abspath(os.path.join(".", "artifacts", "models"))
REGISTRY_DIR = os.path.abspath(os.path.join(".", "model_registry"))


@dataclass
class ModelRegistryMetadata:
    model_id: str
    model_version: str
    dataset_version: str
    feature_version: str
    code_version: str
    training_cutoff: str
    validation_period: str
    test_period: str
    random_seed: int
    hyperparameters: Dict[str, Any]
    calibration_version: str
    metrics: Dict[str, Any]
    artifact_path: str


def save_trained_model_pipeline(
    predictor_pipeline: Any,
    metadata: ModelRegistryMetadata,
    artifacts_dir: str = ARTIFACTS_DIR,
    registry_dir: str = REGISTRY_DIR
) -> Tuple[str, str]:
    """
    Saves trained predictor pipeline and records metadata entry in model registry.
    Returns (artifact_file_path, registry_json_path).
    """
    os.makedirs(artifacts_dir, exist_ok=True)
    os.makedirs(registry_dir, exist_ok=True)

    # 1. Serialize model pipeline object
    artifact_filename = f"{metadata.model_id}_v{metadata.model_version}.pkl"
    artifact_file_path = os.path.join(artifacts_dir, artifact_filename)
    metadata.artifact_path = artifact_file_path

    with open(artifact_file_path, "wb") as f:
        pickle.dump(predictor_pipeline, f)

    logger.info(f"Model pipeline artifact saved to: {artifact_file_path}")

    # 2. Update model registry JSON
    registry_json_path = os.path.join(registry_dir, "registry.json")
    registry_data = []

    if os.path.exists(registry_json_path):
        try:
            with open(registry_json_path, "r") as f:
                registry_data = json.load(f)
        except Exception:
            registry_data = []

    registry_data.append(asdict(metadata))

    with open(registry_json_path, "w") as f:
        json.dump(registry_data, f, indent=2)

    logger.info(f"Model registry updated at: {registry_json_path}")

    return artifact_file_path, registry_json_path


def load_trained_model_pipeline(artifact_file_path: str) -> Any:
    """Loads a serialized trained model pipeline object from file."""
    if not os.path.exists(artifact_file_path):
        raise FileNotFoundError(f"Model artifact not found at: {artifact_file_path}")

    with open(artifact_file_path, "rb") as f:
        predictor_pipeline = pickle.load(f)

    return predictor_pipeline
