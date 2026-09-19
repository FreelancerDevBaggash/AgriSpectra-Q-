#!/usr/bin/env python3
"""
AgriSpectra-Q — Production API (Upload-Only Mode)
==================================================
Accepts user-uploaded GeoTIFF files and runs the live spectral-anomaly engine.
Does NOT require the three pre-loaded EnMAP scenes to be present on the server.

This is the deploy target for free-tier or low-storage hosting (Railway, Render,
Fly.io, etc.) where the ~1.3 GB EnMAP TIF files cannot be stored.

Differences from api/live_matrix_api.py
---------------------------------------
- /api/analyse is REMOVED  (no pre-loaded scenes to analyse)
- /api/scenes  returns an empty list (no pre-loaded scenes)
- /api/status  reports "upload_only" mode
- /api/upload  is the primary entry-point — accepts any multi-band GeoTIFF
- All run result endpoints (/api/runs/*) are present and identical

Storage requirements
--------------------
  Docker image (python + GDAL):  ~550 MB
  Uploaded GeoTIFF (temp):        up to 2 GB (user-provided, deleted after run)
  Run outputs (per run):          ~1–5 MB (CSV + GeoJSON + JSON, no raster TIFs)
  Total with 5 recent runs:       ~575 MB   ← fits in 1 GB free tier

  Note: risk_map.tif and priority_map.tif outputs (~3.5 MB each) are disabled
  in this mode to preserve disk space.  All other outputs are produced normally.

Usage
-----
    python api/production_api.py            # port 8765
    python api/production_api.py --port $PORT
"""

import argparse
import json
import shutil
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT    = Path(__file__).resolve().parents[1]
ENGINE  = ROOT / "backend" / "engine" / "live_matrix_engine.py"
OUT     = ROOT / "results" / "live_matrix"
UPLOADS = ROOT / "results" / "uploads"
UPLOADS.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

ALLOWED_GEOTIFF_EXTS = {".tif", ".tiff", ".geotiff"}
MAX_UPLOAD_BYTES     = 2 * 1024 * 1024 * 1024   # 2 GB
STREAM_CHUNK         = 1 * 1024 * 1024           # 1 MB

ALLOWED_FILES = {
    "zones.csv", "spectral_evidence.csv", "inspection_budget.csv",
    "zones.geojson", "scene_statistics.json", "metrics.json", "manifest.json",
    # raster TIFs intentionally omitted in production to save disk
}

# ── In-memory run registry ────────────────────────────────────────────────────
RUNS:   dict[str, dict]            = {}
ABORTS: dict[str, threading.Event] = {}
LOCK = threading.Lock()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES
CORS(app)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _stream_to_disk(file_storage, dest: Path) -> int:
    written = 0
    with dest.open("wb") as fh:
        while True:
            chunk = file_storage.stream.read(STREAM_CHUNK)
            if not chunk:
                break
            written += len(chunk)
            if written > MAX_UPLOAD_BYTES:
                fh.close()
                dest.unlink(missing_ok=True)
                raise ValueError(f"File exceeds {MAX_UPLOAD_BYTES // (1024**3)} GB limit.")
            fh.write(chunk)
    return written


def run_analysis_on_file(tif_path: Path, scene_name: str, abort_event: threading.Event) -> dict:
    """Run the engine on an uploaded GeoTIFF and return the run record."""
    import importlib.util

    if abort_event.is_set():
        raise RuntimeError("Aborted before processing started.")

    run_id  = f"AGRQ-UPLOAD-{uuid.uuid4().hex[:8]}"
    run_dir = OUT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    with LOCK:
        RUNS[run_id] = {
            "run_id": run_id,
            "scene":  scene_name,
            "path":   str(run_dir),
            "status": "processing",
            "mode":   "LIVE ANALYSIS",
            "scenes": [scene_name],
        }
        ABORTS[run_id] = abort_event

    try:
        spec = importlib.util.spec_from_file_location("live_matrix_engine", str(ENGINE))
        mod  = importlib.util.module_from_spec(spec)          # type: ignore[arg-type]
        spec.loader.exec_module(mod)                          # type: ignore[union-attr]

        if abort_event.is_set():
            raise RuntimeError("Aborted before engine started.")

        scene_stats = mod.process(scene_name, tif_path, run_dir)

        if abort_event.is_set():
            raise RuntimeError("Aborted after engine finished.")

        # ── Remove large raster outputs to save disk on free tier ──
        for large_file in ["risk_map.tif", "priority_map.tif"]:
            p = run_dir / scene_name / large_file
            if p.exists():
                p.unlink()

        # ── Delete the uploaded source file (no longer needed) ──
        tif_path.unlink(missing_ok=True)

        (run_dir / "run_summary.json").write_text(json.dumps({
            "run_id":      run_id,
            "live":        True,
            "mode":        "LIVE ANALYSIS",
            "source":      "user_upload",
            "filename":    tif_path.name,
            "timestamp":   time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "scenes":      [scene_name],
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

    except Exception:
        with LOCK:
            RUNS.pop(run_id, None)
            ABORTS.pop(run_id, None)
        shutil.rmtree(run_dir, ignore_errors=True)
        tif_path.unlink(missing_ok=True)
        raise


def csv_index(run_id: str, filename: str):
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
        "service": "AgriSpectra-Q Production API (Upload-Only)",
        "mode":    "UPLOAD ONLY — no pre-loaded EnMAP scenes",
        "note":    "Upload your own GeoTIFF via POST /api/upload",
        "endpoints": [
            "POST /api/upload",
            "GET  /api/status",
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
    """No pre-loaded scenes in production mode."""
    return jsonify({
        "scenes": [],
        "note": "This server runs in upload-only mode. No pre-loaded EnMAP scenes are available. Use POST /api/upload to analyse your own GeoTIFF.",
    })


@app.get("/api/status")
def status():
    return jsonify({
        "status":      "ready",
        "mode":        "upload_only",
        "engine_ok":   ENGINE.exists(),
        "uploads_dir": str(UPLOADS),
        "results_dir": str(OUT),
        "note":        "No pre-loaded EnMAP scenes. Upload your own GeoTIFF to run an analysis.",
    })


@app.post("/api/analyse")
def analyse():
    """Disabled in production upload-only mode."""
    return jsonify({
        "error": (
            "Pre-loaded scene analysis is not available on this server. "
            "This server runs in upload-only mode. "
            "Upload your own GeoTIFF via POST /api/upload."
        ),
        "upload_endpoint": "/api/upload",
    }), 503


@app.post("/api/upload")
def upload():
    """Accept a user-uploaded GeoTIFF, run the live engine, return run_id."""
    if "file" not in request.files:
        return jsonify({"error": "No file part. Use multipart/form-data with field name 'file'."}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename."}), 400

    ext = Path(f.filename).suffix.lower()
    if ext not in ALLOWED_GEOTIFF_EXTS:
        return jsonify({"error": f"Unsupported file type '{ext}'. Please upload a GeoTIFF (.tif / .tiff)."}), 400

    uid       = uuid.uuid4().hex[:12]
    safe_stem = "".join(c if c.isalnum() or c in "-_." else "_" for c in Path(f.filename).stem)[:64]
    save_name = f"{uid}_{safe_stem}{ext}"
    save_path = UPLOADS / save_name

    try:
        bytes_written = _stream_to_disk(f, save_path)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 413
    except Exception as exc:
        save_path.unlink(missing_ok=True)
        return jsonify({"error": f"Failed to save file: {exc}"}), 500

    if bytes_written == 0:
        save_path.unlink(missing_ok=True)
        return jsonify({"error": "Uploaded file is empty."}), 400

    scene_name  = f"upload_{uid[:8]}"
    abort_event = threading.Event()

    try:
        record = run_analysis_on_file(save_path, scene_name, abort_event)
        return jsonify(record)
    except RuntimeError as exc:
        msg = str(exc)
        if "Aborted" in msg:
            return jsonify({"error": "Run was cancelled.", "aborted": True}), 409
        return jsonify({"error": msg[-2000:]}), 500
    except Exception as exc:
        return jsonify({"error": str(exc)[-2000:]}), 500


@app.post("/api/upload/abort/<run_id>")
def abort_run(run_id: str):
    with LOCK:
        event = ABORTS.get(run_id)
    if event is None:
        return jsonify({"error": "run not found or already finished"}), 404
    event.set()
    return jsonify({"run_id": run_id, "aborted": True})


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
    return send_file(summary, mimetype="application/json",
                     as_attachment=True, download_name=f"{rid}_report.json")


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
    return jsonify({
        "max_bytes":          MAX_UPLOAD_BYTES,
        "max_mb":             MAX_UPLOAD_BYTES // (1024 * 1024),
        "allowed_extensions": sorted(ALLOWED_GEOTIFF_EXTS),
        "mode":               "upload_only",
        "raster_outputs":     False,
        "note":               "risk_map.tif and priority_map.tif are not produced in upload-only mode to save disk space.",
    })


# ── Entry-point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="AgriSpectra-Q Production API (Upload-Only)")
    ap.add_argument("--host",  default="0.0.0.0")
    ap.add_argument("--port",  type=int, default=8765)
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()

    print(f"\n✓  AgriSpectra-Q Production API (Upload-Only)")
    print(f"   Mode:    upload-only (no pre-loaded EnMAP scenes)")
    print(f"   Engine:  {'found' if ENGINE.exists() else 'NOT FOUND — check backend/engine/live_matrix_engine.py'}")
    print(f"   Uploads: {UPLOADS}")
    print(f"   Results: {OUT}\n")

    app.run(host=args.host, port=args.port, debug=args.debug)
