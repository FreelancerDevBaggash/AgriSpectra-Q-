#!/usr/bin/env python3
"""Reference catalog for independent corroboration results.

This layer is read-only with respect to anomaly outputs. It serves only
precomputed, provenance-bearing evidence and never creates a combined score.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

NOT_AVAILABLE = "Not Available"

REFERENCE_DEFINITIONS: dict[str, dict[str, Any]] = {
    "sentinel2_timeseries": {
        "id": "sentinel2_timeseries",
        "label": "Sentinel-2 — NDVI/NDRE time series",
        "short_label": "Sentinel-2 NDVI/NDRE",
        "provider": "Copernicus Sentinel-2 via Microsoft Planetary Computer",
        "evidence_type": "Independent vegetation-signal corroboration",
        "supports": "Persistent vegetation-index differences across nearby dates",
        "does_not_prove": "Pest, disease, or a specific agronomic cause",
        "required_outputs": ["NDVI", "NDRE", "acquisition dates", "CRS/alignment metadata"],
    },
    "landsat_quality_masked": {
        "id": "landsat_quality_masked",
        "label": "Landsat — QA-masked NDVI/NDMI",
        "short_label": "Landsat NDVI/NDMI",
        "provider": "USGS/NASA Landsat Collection 2 Level-2 via Microsoft Planetary Computer",
        "evidence_type": "Independent vegetation/moisture corroboration",
        "supports": "Spatially coincident vegetation or moisture signal after QA masking",
        "does_not_prove": "Pest, disease, or a specific agronomic cause",
        "required_outputs": ["NDVI", "NDMI", "QA mask", "CRS/alignment metadata"],
    },
    "esa_worldcover": {
        "id": "esa_worldcover",
        "label": "ESA WorldCover — cropland overlap",
        "short_label": "WorldCover Cropland",
        "provider": "ESA WorldCover 10 m",
        "evidence_type": "Independent land-cover context",
        "supports": "Whether selected zones overlap a cropland class",
        "does_not_prove": "Anomaly presence, pest, disease, or crop health",
        "required_outputs": ["class definition", "cropland overlap", "tile provenance", "CRS/alignment metadata"],
    },
    "reference_polygons": {
        "id": "reference_polygons",
        "label": "Independent interpreted polygons",
        "short_label": "Reference polygons",
        "provider": "Manual interpretation from high-resolution imagery",
        "evidence_type": "Independent visual reference",
        "supports": "Overlap with independently interpreted classes, if supplied",
        "does_not_prove": "Field-confirmed ground truth unless independently verified in field",
        "required_outputs": ["polygon source", "interpreter/date", "explicit CRS", "class definitions"],
    },
}


def _references_root(project_root: Path) -> Path:
    return project_root / "results" / "independent_references"


def _artifact_path(project_root: Path, run_id: str, scene: str, reference_id: str) -> Path:
    return _references_root(project_root) / run_id / scene / f"{reference_id}.json"


def _load_artifact(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except (OSError, json.JSONDecodeError):
        return None

def _artifact_is_available(data: dict[str, Any] | None) -> bool:
    if not data:
        return False
    result = data.get("result", data)
    if not isinstance(result, dict):
        return False

    # Format A — auto_independent_validation.py output:
    #   { "result": { "ndvi": { "status": "Available", ... }, "ndre": {...} } }
    metrics = [v for k, v in result.items() if k in ("ndvi", "ndre", "ndmi") and isinstance(v, dict)]
    if any(v.get("status") == "Available" for v in metrics):
        return True

    # Format B — legacy/fixture format:
    #   { "worldcover_item": "...", "zones": [...] }          ← esa_worldcover
    #   { "dates": [...], "n_dates": N, "ndvi_mean_diff": N } ← sentinel2 / landsat
    if bool(result.get("worldcover_item")):
        return True
    if isinstance(result.get("dates"), list) and len(result["dates"]) > 0:
        return True
    if isinstance(result.get("n_dates"), int) and result["n_dates"] > 0:
        return True

    # Format C — reference_polygons F1
    f1 = result.get("f1_score")
    return isinstance(f1, dict) and f1.get("status") == "Available"


def list_references(project_root: Path, run_id: str, scene: str) -> list[dict[str, Any]]:
    """Return dropdown-safe metadata; no evidence is marked available without an artifact."""
    out = []
    for ref_id, definition in REFERENCE_DEFINITIONS.items():
        artifact = _artifact_path(project_root, run_id, scene, ref_id)
        item = dict(definition)
        artifact_data = _load_artifact(artifact)
        item["available"] = _artifact_is_available(artifact_data)
        item["status"] = "Available" if item["available"] else NOT_AVAILABLE
        item["endpoint"] = f"/api/runs/{run_id}/independent-references/{ref_id}?scene={scene}"
        out.append(item)
    return out


def get_reference(project_root: Path, run_id: str, scene: str, reference_id: str) -> dict[str, Any]:
    definition = REFERENCE_DEFINITIONS.get(reference_id)
    if definition is None:
        return {"status": NOT_AVAILABLE, "reason": "Unknown independent reference."}
    artifact = _artifact_path(project_root, run_id, scene, reference_id)
    data = _load_artifact(artifact)
    if data is None:
        return {
            "status": NOT_AVAILABLE,
            "reference": dict(definition),
            "reason": "No precomputed, provenance-bearing result is available for this run and scene.",
            "run_id": run_id,
            "scene": scene,
        }
    return {
        "status": "Available",
        "reference": dict(definition),
        "run_id": run_id,
        "scene": scene,
        "artifact": str(artifact),
        "result": data,
    }
