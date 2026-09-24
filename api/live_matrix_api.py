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
ROOT    = Path(__file__).resolve().parents[1]        # project root (api/ is one level deep)
ENGINE  = ROOT / "backend" / "engine" / "live_matrix_engine.py"
OUT     = ROOT / "results" / "live_matrix"
RAW     = ROOT / "data" / "raw" / "enmap_three_scenes"
UPLOADS = ROOT / "results" / "uploads"
UPLOADS.mkdir(parents=True, exist_ok=True)

ALLOWED_SCENES       = {"scene_01_DT0000205230", "scene_02", "scene_03"}
ALLOWED_GEOTIFF_EXTS = {".tif", ".tiff", ".geotiff"}
MAX_UPLOAD_BYTES     = 2 * 1024 * 1024 * 1024   # 2 GB hard limit
STREAM_CHUNK         = 1 * 1024 * 1024           # 1 MB streaming chunk

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
# Stores run records keyed by run_id.
# Upload runs also store an "abort" Event so the processing thread can be
# signalled to stop before it finishes.
RUNS:    dict[str, dict]            = {}
ABORTS:  dict[str, threading.Event] = {}   # run_id → abort event
LOCK = threading.Lock()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES  # Flask hard limit
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
        "run_id":    run_id,
        "scene":     scene,
        "path":      str(run_path),
        "status":    "completed",
        "mode":      "LIVE ANALYSIS",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "scenes":    [scene],
    }
    with LOCK:
        RUNS[run_id] = record
    return record


def _stream_to_disk(file_storage, dest: Path) -> int:
    """Stream werkzeug FileStorage to dest in STREAM_CHUNK chunks.
    Returns total bytes written. Raises ValueError if MAX_UPLOAD_BYTES exceeded."""
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
    """Run the engine on an arbitrary GeoTIFF file and return the run record.

    abort_event: caller sets this to request early termination.  The engine itself
    does not poll it (it is a pure-Python CPU job), but we check it *before*
    starting and clean up the run directory if set mid-flight.
    """
    import importlib.util
    import time as _time
    import json as _json

    if abort_event.is_set():
        raise RuntimeError("Aborted before processing started.")

    run_id  = f"AGRQ-UPLOAD-{uuid.uuid4().hex[:8]}"
    run_dir = OUT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    # Register the run as "processing" immediately so /api/upload/status can report it
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
        # Load engine module dynamically so arbitrary file paths work
        spec = importlib.util.spec_from_file_location("live_matrix_engine", str(ENGINE))
        mod  = importlib.util.module_from_spec(spec)          # type: ignore[arg-type]
        spec.loader.exec_module(mod)                          # type: ignore[union-attr]

        if abort_event.is_set():
            raise RuntimeError("Aborted before engine started.")

        scene_stats = mod.process(scene_name, tif_path, run_dir)

        if abort_event.is_set():
            raise RuntimeError("Aborted after engine finished (race).")

        (run_dir / "run_summary.json").write_text(_json.dumps({
            "run_id":      run_id,
            "live":        True,
            "mode":        "LIVE ANALYSIS",
            "source":      "user_upload",
            "filename":    tif_path.name,
            "timestamp":   _time.strftime("%Y-%m-%dT%H:%M:%SZ", _time.gmtime()),
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
        # Clean up the partial run directory on any failure / abort
        with LOCK:
            RUNS.pop(run_id, None)
            ABORTS.pop(run_id, None)
        shutil.rmtree(run_dir, ignore_errors=True)
        raise


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


@app.get("/api/status")
def status():
    """Return a concise health summary: which scenes are on disk, engine path, upload dir."""
    scenes_status = []
    for s in SCENE_CATALOG:
        sid  = s["scene_id"]
        path = RAW / (sid + ".TIF")
        scenes_status.append({
            "scene_id":  sid,
            "label":     s["label"],
            "available": path.exists(),
            "path":      str(path),
            "size_mb":   round(path.stat().st_size / (1024 * 1024), 1) if path.exists() else None,
        })
    engine_ok = ENGINE.exists()
    all_available = all(s["available"] for s in scenes_status)
    return jsonify({
        "status":           "ready" if (engine_ok and all_available) else "degraded",
        "engine_ok":        engine_ok,
        "scenes_on_disk":   scenes_status,
        "all_scenes_ready": all_available,
        "raw_data_dir":     str(RAW),
        "uploads_dir":      str(UPLOADS),
        "results_dir":      str(OUT),
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


@app.post("/api/upload")
def upload():
    """Accept a user-uploaded GeoTIFF (streamed), run the live engine, return run_id."""
    if "file" not in request.files:
        return jsonify({"error": "No file part in request. Use multipart/form-data with field name 'file'."}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename."}), 400

    ext = Path(f.filename).suffix.lower()
    if ext not in ALLOWED_GEOTIFF_EXTS:
        return jsonify({"error": f"Unsupported file type '{ext}'. Please upload a GeoTIFF (.tif / .tiff)."}), 400

    # Save the file using streaming (no full read into RAM)
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
    """Signal an in-progress upload-run to stop as soon as possible."""
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
        "max_bytes":          MAX_UPLOAD_BYTES,
        "max_mb":             MAX_UPLOAD_BYTES // (1024 * 1024),
        "allowed_extensions": sorted(ALLOWED_GEOTIFF_EXTS),
        "stream_chunk_bytes": STREAM_CHUNK,
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
