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
import threading
import uuid
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT    = Path(__file__).resolve().parents[2]        # project root
ENGINE  = ROOT / "backend" / "engine" / "live_matrix_engine.py"
OUT     = ROOT / "results" / "live_matrix"

ALLOWED_SCENES = {"scene_01_DT0000205230", "scene_02", "scene_03"}
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


@app.get("/api/runs/<rid>/files/<scene>/<filename>")
def get_file(rid: str, scene: str, filename: str):
    if filename not in ALLOWED_FILES:
        return jsonify({"error": "file not permitted"}), 400
    target = OUT / rid / scene / filename
    if not target.exists():
        return jsonify({"error": "file not found"}), 404
    return send_file(target, as_attachment=False)


# ── Entry-point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="AgriSpectra-Q API server")
    ap.add_argument("--host", default="0.0.0.0")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()
    app.run(host=args.host, port=args.port, debug=args.debug)
