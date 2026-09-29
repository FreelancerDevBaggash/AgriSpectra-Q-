#!/usr/bin/env python3
"""Strict F1 evaluation against explicitly labelled independent polygons.

This module never labels polygons from imagery or indices. A reference GeoJSON
must contain an explicit ``reference_label`` (or ``label``) per polygon, with
values that map unambiguously to anomaly/normal. The unit of evaluation is the
reference polygon; a model prediction is positive when at least the configured
fraction of that polygon overlaps an EnMAP anomaly zone.
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any

try:
    from shapely.geometry import shape
    from shapely.ops import transform as shape_transform
    from pyproj import Transformer
except Exception:  # pragma: no cover
    shape = shape_transform = Transformer = None

NOT_AVAILABLE = "Not Available"
POSITIVE = {"1", "true", "yes", "positive", "anomaly", "anomalous", "stress", "affected"}
NEGATIVE = {"0", "false", "no", "negative", "normal", "non_anomaly", "non-anomaly", "unaffected"}


def _label(props: dict[str, Any]) -> tuple[int | None, str | None]:
    key = next((k for k in ("reference_label", "label", "is_anomaly") if k in props), None)
    if key is None:
        return None, None
    raw = props[key]
    token = str(raw).strip().lower()
    if token in POSITIVE:
        return 1, key
    if token in NEGATIVE:
        return 0, key
    return None, key


def calculate_f1(model_zones: dict, reference: dict, overlap_threshold: float = 0.10) -> dict[str, Any]:
    """Return a strict binary F1 report or Not Available.

    ``overlap_threshold`` is the fraction of each reference polygon covered by
    model anomaly zones. It is reported in the output and is not used by the
    model or its thresholds.
    """
    if shape is None or Transformer is None:
        return {"status": NOT_AVAILABLE, "reason": "Shapely/pyproj are required for polygon evaluation."}
    if reference.get("type") != "FeatureCollection" or model_zones.get("type") != "FeatureCollection":
        return {"status": NOT_AVAILABLE, "reason": "Both inputs must be GeoJSON FeatureCollections."}
    declared = reference.get("crs")
    if not declared:
        return {"status": NOT_AVAILABLE, "reason": "Reference polygons must declare an explicit CRS."}
    ref_geoms = []
    labels = []
    missing = 0
    for f in reference.get("features", []):
        y, key = _label(f.get("properties", {}))
        if y is None:
            missing += 1
            continue
        try:
            g = shape(f["geometry"])
            if str(declared).upper() not in ("EPSG:4326", "URN:OGC:DEF:CRS:OGC:1.3:CRS84"):
                g = shape_transform(Transformer.from_crs(str(declared), "EPSG:4326", always_xy=True).transform, g)
            if not g.is_empty and g.area > 0:
                ref_geoms.append(g); labels.append(y)
        except Exception:
            missing += 1
    if missing or not ref_geoms:
        return {"status": NOT_AVAILABLE, "reason": "Every evaluated reference polygon needs an explicit binary anomaly label.", "unlabelled_polygons": missing}
    anomaly_geoms = []
    for f in model_zones.get("features", []):
        try:
            g = shape(f["geometry"])
            if not g.is_empty and g.area > 0: anomaly_geoms.append(g)
        except Exception:
            continue
    if not anomaly_geoms:
        return {"status": NOT_AVAILABLE, "reason": "No model anomaly polygons are available."}
    predictions = []
    overlaps = []
    for g in ref_geoms:
        frac = sum(g.intersection(a).area for a in anomaly_geoms) / g.area
        frac = min(1.0, frac)
        overlaps.append(frac)
        predictions.append(1 if frac >= overlap_threshold else 0)
    tp=sum(y==1 and p==1 for y,p in zip(labels,predictions)); tn=sum(y==0 and p==0 for y,p in zip(labels,predictions)); fp=sum(y==0 and p==1 for y,p in zip(labels,predictions)); fn=sum(y==1 and p==0 for y,p in zip(labels,predictions))
    precision=tp/(tp+fp) if tp+fp else None
    recall=tp/(tp+fn) if tp+fn else None
    f1=(2*precision*recall/(precision+recall)) if precision is not None and recall is not None and precision+recall else None
    if f1 is None:
        return {"status": NOT_AVAILABLE, "reason": "F1 is undefined because the reference contains only one evaluable class.", "confusion_matrix":{"tp":tp,"tn":tn,"fp":fp,"fn":fn}, "evaluated_polygons":len(labels)}
    return {"status":"Available", "metric":"binary F1", "unit":"reference polygon", "reference_label_field":"reference_label/label/is_anomaly", "overlap_threshold":overlap_threshold, "evaluated_polygons":len(labels), "positive_reference_polygons":sum(labels), "negative_reference_polygons":len(labels)-sum(labels), "confusion_matrix":{"tp":tp,"tn":tn,"fp":fp,"fn":fn}, "precision":precision, "recall":recall, "f1":f1, "note":"F1 is computed against explicitly labelled independent polygons only; it is not computed from NDVI, NDRE, NDMI, WorldCover, or model proxy labels."}


def evaluate_files(model_zones_path: Path, reference_path: Path, output_path: Path, overlap_threshold: float = 0.10) -> dict:
    model=json.loads(model_zones_path.read_text(encoding="utf-8")); ref=json.loads(reference_path.read_text(encoding="utf-8")); result=calculate_f1(model,ref,overlap_threshold)
    payload={"independent_only":True,"model_zones":str(model_zones_path),"reference_polygons":str(reference_path),"result":result}
    output_path.parent.mkdir(parents=True,exist_ok=True); output_path.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8"); return payload
