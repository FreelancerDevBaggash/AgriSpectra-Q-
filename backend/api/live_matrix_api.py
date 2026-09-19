#!/usr/bin/env python3
"""
AgriSpectra-Q — Live Matrix REST API
======================================
Flask server that exposes the live spectral-anomaly engine over HTTP.

Endpoints:
  GET  /                                      — service info
  POST /api/analyse                           — trigger a live analysis run
  GET  /api/runs/<run_id>                     — run summary JSON
  GET  /api/runs/<run_id>/zones               — zone CSV index
  GET  /api/runs/<run_id>/spectral-evidence   — spectral evidence CSV index
  GET  /api/runs/<run_id>/inspection          — inspection budget CSV index
  GET  /api/runs/<run_id>/report              — download run_summary.json
  GET  /api/runs/<run_id>/files/<scene>/<fn>  — download individual output file

Usage:
  python backend/api/live_matrix_api.py       (runs on port 8765)
"""

import json
import subprocess
import sys
import tempfile
import threading
import uuid
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT    = Path(__file__).resolve().parents[2]        # project root
ENGINE  = ROOT / "backend" / "engine" / "live_matrix_engine.py"
OUT     = ROOT / "results" / "live_matrix"
RAW     = ROOT / "data" / "raw" / "enmap_three_scenes"
UPLOADS = ROOT / "results" / "uploads"
UPLOADS.mkdir(parents=True, exist_ok=True)

ALLOWED_SCENES    = {"scene_01_DT0000205230", "scene_02", "scene_03"}
ALLOWED_GEOTIFF_EXTS = {".tif", ".tiff", ".geotiff"}
MAX_UPLOAD_BYTES  = 2 * 1024 * 1024 * 1024   # 2 GB hard limit

# Static scene catalog — actual metadata from the three verified EnMAP scenes.
# scene_01 dimensions/valid_pixels/nodata verified from live engine output (AGRQ-LIVE-API-38a215bd).
# scene_02 and scene_03 values from docs/AgriSpectra-Q_—_Data_and_File_Schema.md §2.2.
SCENE_CATALOG = [
    {
        "scene_id":          "scene_01_DT0000205230",
        "label":             "Scene 01",
        "location":          "Al Ain Region, UAE",
        "dimensions":        [1152, 1214],
        "bands":             224,
        "resolution_m":      30,
        "crs":               "EPSG:32636",
        "valid_pixels":      1047911,
        "nodata_percentage": 25.07,
        "available":         (RAW / "scene_01_DT0000205230.TIF").exists(),
    },
    {
        "scene_id":          "scene_02",
        "label":             "Scene 02",
        "location":          "Arabian Gulf Coast",
        "dimensions":        [1210, 1244],
        "bands":             224,
        "resolution_m":      30,
        "crs":               "EPSG:32645",
        "valid_pixels":      1006261,
        "nodata_percentage": 33.15,
        "available":         (RAW / "scene_02.TIF").exists(),
    },
    {
        "scene_id":          "scene_03",
        "label":             "Scene 03",
        "location":          "Inland Desert Agriculture",
        "dimensions":        [1152, 1214],
        "bands":             224,
        "resolution_m":      30,
        "crs":               "EPSG:32636",
        "valid_pixels":      1047911,
        "nodata_percentage": 25.07,
        "available":         (RAW / "scene_03.TIF").exists(),
    },
]
ALLOWED_FILES  = {
    "zones.csv", "spectral_evidence.csv", "inspection_budget.csv",
    "risk_map.tif", "priority_map.tif", "zones.geojson",
    "scene_statistics.json", "metrics.json", "manifest.json",
}

# ── In-memory run registry ────────────────────────────────────────────────────
RUNS: dict[str, dict] = {}
LOCK = threading.Lock()

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from the Next.js dev server


# ── Helpers ───────────────────────────────────────────────────────────────────

def run_analysis(scene: str) -> dict:
    """Synchronously run the engine subprocess and return the run record."""
    run_id = f"AGRQ-LIVE-API-{uuid.uuid4().hex[:8]}"
    result = subprocess.run(
        [sys.executable, str(ENGINE), "--scene", scene, "--run-id", run_id],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr[-2000:])
    run_path = OUT / run_id
    record = {
        "run_id":  run_id,
        "scene":   scene,
        "path":    str(run_path),
        "status":  "completed",
        "mode":    "LIVE ANALYSIS",
        "scenes":  [scene],
    }
    with LOCK:
        RUNS[run_id] = record
    return record


def run_analysis_on_file(tif_path: Path, scene_name: str) -> dict:
    """Run the engine on an arbitrary GeoTIFF file and return the run record.

    The engine's process() function is imported directly (no subprocess) so that
    the uploaded file path is passed straight through without touching the SCENES
    dict in the engine module.
    """
    run_id  = f"AGRQ-UPLOAD-{uuid.uuid4().hex[:8]}"
    run_dir = OUT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    # Import the engine's process() function at call time to avoid circular issues
    import importlib.util, types
    spec = importlib.util.spec_from_file_location("live_matrix_engine", str(ENGINE))
    mod  = importlib.util.module_from_spec(spec)          # type: ignore[arg-type]
    spec.loader.exec_module(mod)                          # type: ignore[union-attr]

    import time as _time
    import json  as _json

    scene_stats = mod.process(scene_name, tif_path, run_dir)

    (run_dir / "run_summary.json").write_text(_json.dumps({
        "run_id":    run_id,
        "live":      True,
        "mode":      "LIVE ANALYSIS",
        "source":    "user_upload",
        "filename":  tif_path.name,
        "timestamp": _time.strftime("%Y-%m-%dT%H:%M:%SZ", _time.gmtime()),
        "scenes":    [scene_name],
        "scene_stats": [scene_stats],
        "limitations": [
            "Spectral wavelength metadata unavailable; band indices reported",
            "Unsupervised spectral anomaly proxy — no disease/pest labels",
            "Priority thresholds are scene-relative percentiles",
            "Not the frozen six-model benchmark",
        ],
    }, indent=2, default=float))

    record = {
        "run_id": run_id,
        "scene":  scene_name,
        "path":   str(run_dir),
        "status": "completed",
        "mode":   "LIVE ANALYSIS",
        "scenes": [scene_name],
    }
    with LOCK:
        RUNS[run_id] = record
    return record


def csv_index(run_id: str, filename: str):
    """Return a JSON index of per-scene CSV/file outputs for a given run."""
    run_path = OUT / run_id
    if not run_path.exists():
        return jsonify({"error": "run not found"}), 404
    files = []
    for scene_dir in sorted(p for p in run_path.iterdir() if p.is_dir()):
        target = scene_dir / filename
        if target.exists():
            files.append({
                "scene":    scene_dir.name,
                "path":     str(target),
                "download": f"/api/runs/{run_id}/files/{scene_dir.name}/{filename}",
            })
    return jsonify({"run_id": run_id, "live": True, "files": files})


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return jsonify({
        "service":        "AgriSpectra-Q Live Matrix API",
        "mode":           "LIVE ANALYSIS",
        "benchmark_note": "The frozen six-model benchmark is separate and pre-computed.",
        "endpoints": [
            "POST /api/analyse",
            "GET  /api/runs/<run_id>",
            "GET  /api/runs/<run_id>/zones",
            "GET  /api/runs/<run_id>/spectral-evidence",
            "GET  /api/runs/<run_id>/inspection",
            "GET  /api/runs/<run_id>/report",
            "GET  /api/runs/<run_id>/files/<scene>/<filename>",
        ],
    })


@app.get("/api/scenes")
def list_scenes():
    """Return the verified EnMAP scene catalog with live availability check."""
    return jsonify({"scenes": SCENE_CATALOG})


@app.post("/api/analyse")
def analyse():
    body  = request.get_json(silent=True) or {}
    scene = body.get("scene", "scene_01_DT0000205230")
    if scene not in ALLOWED_SCENES:
        return jsonify({"error": f"scene must be one of: {sorted(ALLOWED_SCENES)}"}), 400
    try:
        return jsonify(run_analysis(scene))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.post("/api/upload")
def upload():
    """Accept a user-uploaded GeoTIFF, run the live engine on it, and return run_id."""
    if "file" not in request.files:
        return jsonify({"error": "No file part in request. Use multipart/form-data with field name 'file'."}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename."}), 400

    ext = Path(f.filename).suffix.lower()
    if ext not in ALLOWED_GEOTIFF_EXTS:
        return jsonify({"error": f"Unsupported file type '{ext}'. Please upload a GeoTIFF (.tif / .tiff)."}), 400

    # Read all bytes to check size before saving
    data = f.read()
    if len(data) > MAX_UPLOAD_BYTES:
        return jsonify({"error": "File too large. Maximum allowed size is 2 GB."}), 413

    # Persist to uploads directory with a unique name
    uid  = uuid.uuid4().hex[:12]
    safe_stem = "".join(c if c.isalnum() or c in "-_." else "_" for c in Path(f.filename).stem)[:64]
    save_name = f"{uid}_{safe_stem}{ext}"
    save_path = UPLOADS / save_name
    save_path.write_bytes(data)

    # Use the original filename stem (sanitised) as the scene label inside the run
    scene_name = f"upload_{uid[:8]}"

    try:
        record = run_analysis_on_file(save_path, scene_name)
        return jsonify(record)
    except Exception as exc:
        # Keep the uploaded file for debugging but surface the error
        return jsonify({"error": str(exc)[-2000:]}), 500


@app.get("/api/runs/<rid>")
def get_run(rid: str):
    summary = OUT / rid / "run_summary.json"
    if not summary.exists():
        return jsonify({"error": "run not found"}), 404
    return app.response_class(summary.read_text(), mimetype="application/json")


@app.get("/api/runs/<rid>/zones")
def get_zones(rid: str):
    return csv_index(rid, "zones.csv")


@app.get("/api/runs/<rid>/spectral-evidence")
def get_evidence(rid: str):
    return csv_index(rid, "spectral_evidence.csv")


@app.get("/api/runs/<rid>/inspection")
def get_inspection(rid: str):
    return csv_index(rid, "inspection_budget.csv")


@app.get("/api/runs/<rid>/report")
def get_report(rid: str):
    summary = OUT / rid / "run_summary.json"
    if not summary.exists():
        return jsonify({"error": "run not found"}), 404
    return send_file(summary, mimetype="application/json", as_attachment=True,
                     download_name=f"{rid}_report.json")


@app.route("/api/runs/<rid>/files/<scene>/<filename>", methods=["GET", "HEAD"])
def get_file(rid: str, scene: str, filename: str):
    if filename not in ALLOWED_FILES:
        return jsonify({"error": "file not permitted"}), 400
    target = OUT / rid / scene / filename
    if not target.exists():
        return jsonify({"error": "file not found"}), 404
    if request.method == "HEAD":
        from flask import Response
        return Response(status=200, headers={"Content-Type": "application/octet-stream"})
    return send_file(target, as_attachment=True, download_name=filename)


@app.get("/api/upload/info")
def upload_info():
    """Return upload constraints for the frontend."""
    return jsonify({
        "max_bytes":       MAX_UPLOAD_BYTES,
        "max_mb":          MAX_UPLOAD_BYTES // (1024 * 1024),
        "allowed_extensions": sorted(ALLOWED_GEOTIFF_EXTS),
    })


# ── Entry-point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="AgriSpectra-Q API server")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()
    app.run(host=args.host, port=args.port, debug=args.debug)
