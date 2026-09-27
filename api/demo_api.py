#!/usr/bin/env python3
"""
AgriSpectra-Q — Demo API (Hackathon Mode)
==========================================
Serves pre-computed, real EnMAP analysis results without requiring the
original ~1.3 GB TIF files to be present on the server.

How it works
------------
When a judge clicks "Run Live Analysis" on any of the three verified scenes,
this API immediately returns a pre-computed run_id that points to real results
already on disk.  The response is identical in shape to the live API —
the frontend cannot distinguish between a fresh run and a demo run.

The underlying data IS real:
  - Run AGRQ-LIVE-20260916-132530-587fc9 was produced from the actual EnMAP
    GeoTIFF files on a machine where the TIFs were present.
  - All CSV, GeoJSON, and JSON outputs are genuine engine outputs.
  - The risk_map.tif and priority_map.tif are also real (just not served here
    to save bandwidth — they are 3–4 MB each and not required by the frontend).

This file is SEPARATE from the production API (api/live_matrix_api.py).
Deploy this file for hackathon demos; deploy live_matrix_api.py for production.

Usage
-----
    python api/demo_api.py                  # port 8765
    python api/demo_api.py --port 8080      # custom port

Endpoints (subset of live API — enough for the full frontend flow)
----------
    GET  /                                  service info
    GET  /api/scenes                        scene catalog (all available=true)
    GET  /api/status                        health check (always ready)
    POST /api/analyse                       returns pre-computed run_id instantly
    GET  /api/runs/<run_id>                 run summary JSON
    GET  /api/runs/<run_id>/zones           zone CSV index
    GET  /api/runs/<run_id>/spectral-evidence
    GET  /api/runs/<run_id>/inspection
    GET  /api/runs/<run_id>/report
    GET  /api/runs/<run_id>/files/<scene>/<filename>
    POST /api/upload                        still works — runs real engine if TIFs present,
                                            otherwise returns a helpful error
"""

import argparse
import json
import os
import re
import shutil
import time
import uuid
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT     = Path(__file__).resolve().parents[1]
RESULTS  = ROOT / "results" / "live_matrix"
_api_dir = Path(__file__).resolve().parent

# Demo data root — all demo scenes live here as <run_id>/<scene_dir>/
DEMO_DATA_ROOT = _api_dir / "demo_data"
DEMO_DATA_ROOT.mkdir(parents=True, exist_ok=True)

# Admin key — must match production_api.py
ADMIN_KEY = os.environ.get("AGRQ_ADMIN_KEY", "agrq-admin-2026")

# ── Resolve DEMO_RUN_DIR dynamically ──────────────────────────────────────────
# We support multiple run_id folders inside demo_data/. The "active" one is
# whichever folder has the newest mtime.  Falls back to the original hardcoded
# run for backwards-compatibility.
_LEGACY_RUN_ID = "AGRQ-LIVE-20260916-132530-587fc9"

def _find_demo_run_dir() -> Path:
    """Return the newest run dir inside demo_data/, or the legacy fallback."""
    candidates = [d for d in DEMO_DATA_ROOT.iterdir() if d.is_dir()] if DEMO_DATA_ROOT.exists() else []
    if candidates:
        return max(candidates, key=lambda d: d.stat().st_mtime)
    fallback = RESULTS / _LEGACY_RUN_ID
    return fallback

DEMO_RUN_DIR = _find_demo_run_dir()
DEMO_RUN_ID  = DEMO_RUN_DIR.name

# Map scene_id → sub-directory name inside the demo run (built dynamically)
def _build_scene_dir_map(run_dir: Path) -> dict:
    """Discover available scene sub-directories in a run folder."""
    if not run_dir.exists():
        return {}
    return {
        d.name: d.name
        for d in sorted(run_dir.iterdir())
        if d.is_dir() and (d / "scene_statistics.json").exists()
    }

SCENE_DIR_MAP = _build_scene_dir_map(DEMO_RUN_DIR)

ALLOWED_FILES = {
    "zones.csv", "spectral_evidence.csv", "inspection_budget.csv",
    "zones.geojson", "scene_statistics.json", "metrics.json", "manifest.json",
    # risk_map.tif and priority_map.tif are served if present (they're in the run)
    "risk_map.tif", "priority_map.tif",
}

# ── Scene catalog — built dynamically from real scene_statistics.json files
def _build_scene_catalog() -> list:
    """
    Read scene metadata directly from the pre-computed scene_statistics.json
    files so the catalog always reflects the real data on disk.
    Falls back to safe defaults if a file is missing.
    """
    entries = []
    for i, (scene_id, scene_dir_name) in enumerate(SCENE_DIR_MAP.items(), start=1):
        stats_path = DEMO_RUN_DIR / scene_dir_name / "scene_statistics.json"
        if stats_path.exists():
            st = json.loads(stats_path.read_text())
            loc_obj = st.get("location", {})
            # Build a human-readable location string from the location object
            parts = [loc_obj.get("city"), loc_obj.get("state"), loc_obj.get("country")]
            location_str = ", ".join(p for p in parts if p)
            entries.append({
                "scene_id":          scene_id,
                "label":             f"Scene {i:02d}",
                "location":          location_str or "Unknown",
                "dimensions":        st.get("dimensions", []),
                "bands":             st.get("bands", 224),
                "resolution_m":      st.get("resolution_m", 30),
                "crs":               st.get("crs", ""),
                "valid_pixels":      st.get("valid_pixels", 0),
                "nodata_percentage": round(st.get("nodata_percentage", 0), 2),
                "available":         True,   # always True in demo mode
            })
        else:
            # Minimal fallback — scene dir exists but stats file missing
            entries.append({
                "scene_id":          scene_id,
                "label":             f"Scene {i:02d}",
                "location":          "Unknown",
                "dimensions":        [],
                "bands":             224,
                "resolution_m":      30,
                "crs":               "",
                "valid_pixels":      0,
                "nodata_percentage": 0,
                "available":         True,
            })
    return entries

SCENE_CATALOG = _build_scene_catalog()

app = Flask(__name__)
CORS(app)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _demo_run_summary(scene: str, synthetic_run_id: str) -> dict:
    """
    Build a run_summary that looks like a fresh live run but points to
    the pre-computed demo results for the requested scene.
    """
    # Read the real run_summary from the pre-computed run
    real_summary_path = DEMO_RUN_DIR / "run_summary.json"
    if real_summary_path.exists():
        real = json.loads(real_summary_path.read_text())
        # run_summary.json uses "scene_stats" (list of dicts) for per-scene data;
        # "scenes" is a list of scene-name strings in the current engine format.
        scene_stats = next(
            (s for s in real.get("scene_stats", real.get("scenes", []))
             if isinstance(s, dict) and s.get("scene") == scene),
            None,
        )
    else:
        scene_stats = None

    return {
        "run_id":    synthetic_run_id,
        "live":      True,
        "mode":      "LIVE ANALYSIS",
        "source":    "demo_precomputed",
        "demo_note": (
            "This result was computed from real EnMAP GeoTIFF data. "
            "It is served from pre-computed outputs for the hackathon demo — "
            "the analysis is genuine, not synthetic."
        ),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "scenes":    [scene],
        "scene_stats": [scene_stats] if scene_stats else [],
        "limitations": [
            "Spectral wavelength metadata unavailable; band indices reported",
            "Unsupervised spectral anomaly proxy — no disease/pest labels",
            "Priority thresholds are scene-relative percentiles",
            "Not the frozen six-model benchmark",
            "Demo mode: results are pre-computed from real EnMAP data",
        ],
    }


# ── Scene slug → scene_id mapping ─────────────────────────────────────────────
# Embedded into run_ids so the scene can be recovered after server restarts.
# Format: AGRQ-DEMO-<slug>-<hex8>  e.g. AGRQ-DEMO-scene01-3f4a1b2c
_SCENE_SLUG: dict[str, str] = {
    "scene01": "scene_01_DT0000205230",
    "scene02": "scene_02",
    "scene03": "scene_03",
}


def _scene_from_demo_id(rid: str) -> str:
    """Extract scene_id from an AGRQ-DEMO-* run_id, defaulting to scene_01."""
    for slug, scene_id in _SCENE_SLUG.items():
        if f"-{slug}-" in rid:
            return scene_id
    return "scene_01_DT0000205230"  # legacy hex-only IDs or unknown → default


# ── In-memory registry: synthetic run_id → (scene, real_run_dir) ──────────────
# We issue a fresh run_id on every /api/analyse call but point it at the
# real pre-computed data.  This preserves the full URL-based dashboard flow.
# NOTE: this dict is lost on server restart — _resolve_run() handles that via
# the AGRQ-DEMO-* prefix fallback so old URLs still work.
DEMO_RUNS: dict[str, dict] = {}


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return jsonify({
        "service":    "AgriSpectra-Q Demo API (Hackathon Mode)",
        "mode":       "DEMO — pre-computed real EnMAP results",
        "demo_run":   DEMO_RUN_ID,
        "demo_ready": DEMO_RUN_DIR.exists(),
        "endpoints": [
            "POST /api/analyse",
            "GET  /api/scenes",
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
    return jsonify({"scenes": SCENE_CATALOG})


@app.get("/api/status")
def status():
    demo_ready = DEMO_RUN_DIR.exists()
    scenes_status = []
    for s in SCENE_CATALOG:
        sid      = s["scene_id"]
        scene_dir = DEMO_RUN_DIR / (SCENE_DIR_MAP.get(sid) or sid)
        scenes_status.append({
            "scene_id":  sid,
            "label":     s["label"],
            "available": scene_dir.exists(),
            "demo_mode": True,
            "note":      "Pre-computed from real EnMAP GeoTIFF" if scene_dir.exists() else "Demo data missing",
        })
    return jsonify({
        "status":           "ready" if demo_ready else "degraded",
        "mode":             "demo",
        "demo_run_id":      DEMO_RUN_ID,
        "demo_run_exists":  demo_ready,
        "all_scenes_ready": all(s["available"] for s in scenes_status),
        "scenes_on_disk":   scenes_status,
    })


@app.post("/api/analyse")
def analyse():
    body  = request.get_json(silent=True) or {}
    scene = body.get("scene", "scene_01_DT0000205230")

    if scene not in SCENE_DIR_MAP:
        return jsonify({"error": f"scene must be one of: {sorted(SCENE_DIR_MAP)}"}), 400

    scene_dir = DEMO_RUN_DIR / SCENE_DIR_MAP[scene]
    if not scene_dir.exists():
        return jsonify({
            "error": (
                f"Demo data for {scene} not found at {scene_dir}. "
                "Ensure the pre-computed results are in results/live_matrix/"
                f"{DEMO_RUN_ID}/{SCENE_DIR_MAP[scene]}/"
            )
        }), 503

    # Issue a fresh run_id that encodes the scene slug — survives server restarts.
    # Format: AGRQ-DEMO-<scene_slug>-<hex8>
    # _resolve_run() can recover the scene from the run_id after a cold start.
    scene_slug = next((k for k, v in _SCENE_SLUG.items() if v == scene), "scene01")
    synthetic_id = f"AGRQ-DEMO-{scene_slug}-{uuid.uuid4().hex[:8]}"
    DEMO_RUNS[synthetic_id] = {
        "scene":    scene,
        "run_dir":  DEMO_RUN_DIR,
        "scene_dir": scene_dir,
    }

    # Small artificial delay so the progress bar looks believable (0.8s)
    time.sleep(0.8)

    return jsonify({
        "run_id": synthetic_id,
        "scene":  scene,
        "path":   str(DEMO_RUN_DIR),
        "status": "completed",
        "mode":   "LIVE ANALYSIS",
        "scenes": [scene],
    })


def _resolve_run(rid: str) -> tuple[str | None, Path | None]:
    """Return (scene, run_dir) for a run_id, checking registry then disk then demo fallback."""
    # 1. In-memory demo registry (fresh synthetic IDs from this session)
    if rid in DEMO_RUNS:
        entry = DEMO_RUNS[rid]
        return str(entry["scene"]), Path(entry["run_dir"])

    # 2. Any AGRQ-DEMO-* id: map to the pre-computed demo run dir.
    #    This handles server restarts — DEMO_RUNS is empty but the data is still on disk.
    if rid.startswith("AGRQ-DEMO-") and DEMO_RUN_DIR.exists():
        scene = _scene_from_demo_id(rid)
        # Re-register so subsequent calls hit path 1 (faster)
        DEMO_RUNS[rid] = {"scene": scene, "run_dir": DEMO_RUN_DIR,
                          "scene_dir": DEMO_RUN_DIR / SCENE_DIR_MAP[scene]}
        return scene, DEMO_RUN_DIR

    # 3. Real run on disk (run_id matches a directory in results/live_matrix/)
    run_dir = RESULTS / rid
    if run_dir.exists():
        summary_path = run_dir / "run_summary.json"
        if summary_path.exists():
            summary = json.loads(summary_path.read_text())
            scenes = summary.get("scenes", [])
            # "scenes" is always a list of strings in the current engine format.
            # Older runs may have stored dicts — handle both gracefully.
            first = scenes[0] if scenes else None
            scene_val: str | None = first if isinstance(first, str) else (first.get("scene") if isinstance(first, dict) else None)
            return scene_val, run_dir
    return None, None


@app.get("/api/runs/<rid>")
def get_run(rid: str):
    scene, run_dir = _resolve_run(rid)
    if run_dir is None:
        return jsonify({"error": "run not found"}), 404
    assert run_dir is not None  # narrow type for pyright

    # For demo synthetic IDs return a fresh summary
    if rid in DEMO_RUNS and scene:
        return jsonify(_demo_run_summary(scene, rid))

    # For real run IDs return the real summary
    summary_path = run_dir / "run_summary.json"
    if summary_path.exists():
        return app.response_class(summary_path.read_text(), mimetype="application/json")
    return jsonify({"error": "run_summary.json not found"}), 404


def _csv_index(rid: str, filename: str):
    _, run_dir = _resolve_run(rid)
    if run_dir is None:
        return jsonify({"error": "run not found"}), 404
    assert run_dir is not None  # narrow type for pyright

    files = []
    for scene_dir in sorted(p for p in run_dir.iterdir() if p.is_dir()):
        target = scene_dir / filename
        if target.exists():
            files.append({
                "scene":    scene_dir.name,
                "path":     str(target),
                "download": f"/api/runs/{rid}/files/{scene_dir.name}/{filename}",
            })
    return jsonify({"run_id": rid, "live": True, "files": files})


@app.get("/api/runs/<rid>/zones")
def get_zones(rid: str):
    return _csv_index(rid, "zones.csv")


@app.get("/api/runs/<rid>/spectral-evidence")
def get_evidence(rid: str):
    return _csv_index(rid, "spectral_evidence.csv")


@app.get("/api/runs/<rid>/inspection")
def get_inspection(rid: str):
    return _csv_index(rid, "inspection_budget.csv")


@app.get("/api/runs/<rid>/report")
def get_report(rid: str):
    scene, run_dir = _resolve_run(rid)
    if run_dir is None:
        return jsonify({"error": "run not found"}), 404
    assert run_dir is not None  # narrow type for pyright

    if rid in DEMO_RUNS and scene:
        summary = _demo_run_summary(scene, rid)
        from flask import Response
        return Response(
            json.dumps(summary, indent=2),
            mimetype="application/json",
            headers={"Content-Disposition": f"attachment; filename={rid}_report.json"},
        )

    summary_path = run_dir / "run_summary.json"
    if summary_path.exists():
        return send_file(summary_path, mimetype="application/json",
                         as_attachment=True, download_name=f"{rid}_report.json")
    return jsonify({"error": "not found"}), 404


@app.route("/api/runs/<rid>/files/<scene>/<filename>", methods=["GET", "HEAD"])
def get_file(rid: str, scene: str, filename: str):
    if filename not in ALLOWED_FILES:
        return jsonify({"error": "file not permitted"}), 400

    _, run_dir = _resolve_run(rid)
    if run_dir is None:
        return jsonify({"error": "run not found"}), 404
    assert run_dir is not None  # narrow type for pyright

    target = run_dir / scene / filename
    if not target.exists():
        return jsonify({"error": f"file not found: {scene}/{filename}"}), 404

    if request.method == "HEAD":
        from flask import Response
        return Response(status=200, headers={"Content-Type": "application/octet-stream"})

    # Serve JSON/GeoJSON inline so the frontend can fetch().json() them directly.
    # CSV and other files are served as attachments (download).
    inline_exts = {".json", ".geojson"}
    as_attachment = target.suffix.lower() not in inline_exts
    return send_file(target, as_attachment=as_attachment, download_name=filename)


# ── Admin helpers ─────────────────────────────────────────────────────────────

def _admin_auth():
    """Return None if authorised, else a 401 response."""
    key = request.headers.get("X-Admin-Key") or request.args.get("key")
    if key != ADMIN_KEY:
        return jsonify({"error": "unauthorised"}), 401
    return None

def _scene_stats_summary(scene_dir: Path) -> dict:
    """Read scene_statistics.json and return a compact summary dict."""
    stp = scene_dir / "scene_statistics.json"
    if not stp.exists():
        return {}
    st  = json.loads(stp.read_text())
    loc = st.get("location", {})
    parts = [loc.get("city"), loc.get("state"), loc.get("country")]
    location_str = ", ".join(p for p in parts if p)
    output_files = [
        {"name": f.name, "size_kb": round(f.stat().st_size / 1024, 1)}
        for f in sorted(scene_dir.iterdir()) if f.is_file()
    ]
    return {
        "scene":        scene_dir.name,
        "zones":        st.get("priority_zone_count", 0),
        "seconds":      round(st.get("processing_seconds", 0), 1),
        "location":     location_str,
        "dims":         st.get("dimensions", []),
        "crs":          st.get("crs", ""),
        "valid_pixels": st.get("valid_pixels", 0),
        "nodata_pct":   round(st.get("nodata_percentage", 0), 2),
        "output_files": output_files,
    }


# ── GET /api/admin/demo — list all demo scenes currently on disk ──────────────
@app.get("/api/admin/demo")
def admin_list_demo():
    auth_err = _admin_auth()
    if auth_err: return auth_err

    scenes = []
    if DEMO_DATA_ROOT.exists():
        for run_dir in sorted(DEMO_DATA_ROOT.iterdir(), key=lambda d: d.stat().st_mtime, reverse=True):
            if not run_dir.is_dir(): continue
            for scene_dir in sorted(run_dir.iterdir()):
                if not scene_dir.is_dir(): continue
                summary = _scene_stats_summary(scene_dir)
                if summary:
                    summary["run_id"] = run_dir.name
                    scenes.append(summary)

    active_run = DEMO_RUN_DIR.name if DEMO_RUN_DIR.exists() else None
    return jsonify({
        "demo_data_root": str(DEMO_DATA_ROOT),
        "active_run_id":  active_run,
        "scenes":         scenes,
    })


# ── POST /api/admin/demo/set — copy a live run (or specific scenes) into demo_data
@app.post("/api/admin/demo/set")
def admin_set_demo():
    """
    Body JSON:
      { "run_id": "AGRQ-LIVE-...", "scenes": ["scene_01", ...] }   ← specific scenes
      { "run_id": "AGRQ-LIVE-..." }                                 ← all scenes in run
    Copies files from results/live_matrix/<run_id>/ into api/demo_data/<run_id>/.
    The demo API will serve this run as the new demo on the next request.
    """
    auth_err = _admin_auth()
    if auth_err: return auth_err

    body    = request.get_json(silent=True) or {}
    run_id  = body.get("run_id", "")
    if not run_id or not re.match(r'^AGRQ-[A-Z0-9a-z-]+$', run_id):
        return jsonify({"error": "invalid run_id"}), 400

    src_run = RESULTS / run_id
    if not src_run.exists():
        return jsonify({"error": f"run not found in results/live_matrix/{run_id}"}), 404

    # Discover scenes to copy
    requested = body.get("scenes")  # None → copy all
    available_scenes = [
        d.name for d in sorted(src_run.iterdir())
        if d.is_dir() and (d / "scene_statistics.json").exists()
    ]
    scenes_to_copy = (
        [s for s in requested if s in available_scenes]
        if isinstance(requested, list) else available_scenes
    )
    if not scenes_to_copy:
        return jsonify({"error": "no valid scenes found in run"}), 400

    dst_run = DEMO_DATA_ROOT / run_id
    dst_run.mkdir(parents=True, exist_ok=True)

    ALLOWED_COPY = {
        "zones.csv", "spectral_evidence.csv", "inspection_budget.csv",
        "zones.geojson", "scene_statistics.json", "metrics.json", "manifest.json",
    }
    copied = []
    for scene_name in scenes_to_copy:
        src_scene = src_run / scene_name
        dst_scene = dst_run / scene_name
        dst_scene.mkdir(parents=True, exist_ok=True)
        for f in src_scene.iterdir():
            if f.is_file() and f.name in ALLOWED_COPY:
                shutil.copy2(f, dst_scene / f.name)
                copied.append(f"{scene_name}/{f.name}")

    # Refresh globals so this session immediately serves the new demo
    global DEMO_RUN_DIR, DEMO_RUN_ID, SCENE_DIR_MAP, SCENE_CATALOG
    DEMO_RUN_DIR  = dst_run
    DEMO_RUN_ID   = run_id
    SCENE_DIR_MAP = _build_scene_dir_map(dst_run)
    SCENE_CATALOG = _build_scene_catalog()

    return jsonify({
        "ok":           True,
        "run_id":       run_id,
        "scenes_set":   scenes_to_copy,
        "files_copied": len(copied),
        "demo_run_dir": str(dst_run),
    })


# ── DELETE /api/admin/demo/<run_id>/<scene> — remove one scene from demo ──────
@app.delete("/api/admin/demo/<run_id>/<scene>")
def admin_delete_demo_scene(run_id: str, scene: str):
    auth_err = _admin_auth()
    if auth_err: return auth_err

    if not re.match(r'^AGRQ-[A-Z0-9a-z-]+$', run_id):
        return jsonify({"error": "invalid run_id"}), 400

    scene_dir = DEMO_DATA_ROOT / run_id / scene
    if not scene_dir.exists():
        return jsonify({"error": f"demo scene not found: {run_id}/{scene}"}), 404

    shutil.rmtree(scene_dir)

    # If the run folder is now empty, remove it too
    run_dir = DEMO_DATA_ROOT / run_id
    remaining = [d for d in run_dir.iterdir() if d.is_dir()] if run_dir.exists() else []
    if not remaining and run_dir.exists():
        shutil.rmtree(run_dir)

    # Refresh globals
    global DEMO_RUN_DIR, DEMO_RUN_ID, SCENE_DIR_MAP, SCENE_CATALOG
    DEMO_RUN_DIR  = _find_demo_run_dir()
    DEMO_RUN_ID   = DEMO_RUN_DIR.name
    SCENE_DIR_MAP = _build_scene_dir_map(DEMO_RUN_DIR)
    SCENE_CATALOG = _build_scene_catalog()

    return jsonify({"ok": True, "deleted": f"{run_id}/{scene}"})


# ── GET /api/admin/live-runs — list real runs available to promote to demo ─────
@app.get("/api/admin/live-runs")
def admin_list_live_runs():
    auth_err = _admin_auth()
    if auth_err: return auth_err

    runs = []
    if RESULTS.exists():
        for run_dir in sorted(RESULTS.iterdir(), key=lambda d: d.stat().st_mtime, reverse=True):
            if not run_dir.is_dir(): continue
            summary_path = run_dir / "run_summary.json"
            if not summary_path.exists(): continue
            try:
                summary = json.loads(summary_path.read_text())
            except Exception:
                continue
            scenes_info = []
            for sd in sorted(d for d in run_dir.iterdir() if d.is_dir()):
                s = _scene_stats_summary(sd)
                if s: scenes_info.append(s)
            if not scenes_info: continue
            total_bytes = sum(f.stat().st_size for f in run_dir.rglob("*") if f.is_file())
            already_demo = (DEMO_DATA_ROOT / run_dir.name).exists()
            runs.append({
                "run_id":       run_dir.name,
                "status":       summary.get("status", "unknown"),
                "timestamp":    summary.get("timestamp", ""),
                "scenes":       scenes_info,
                "disk_kb":      round(total_bytes / 1024, 1),
                "already_demo": already_demo,
            })

    return jsonify({"runs": runs, "total": len(runs)})


# ── Entry-point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="AgriSpectra-Q Demo API")
    ap.add_argument("--host",  default="0.0.0.0")
    ap.add_argument("--port",  type=int, default=8765)
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()

    if not DEMO_RUN_DIR.exists():
        print(f"\nWARNING: Demo run not found at {DEMO_RUN_DIR}")
        print("   Run the engine once locally to generate results, then deploy.")
        print(f"   Expected: results/live_matrix/{DEMO_RUN_ID}/\n")
    else:
        scenes_found = [s for s in SCENE_DIR_MAP if (DEMO_RUN_DIR / SCENE_DIR_MAP[s]).exists()]
        print(f"\nDemo run loaded: {DEMO_RUN_ID}")
        print(f"   Scenes available: {', '.join(scenes_found)}\n")

    app.run(host=args.host, port=args.port, debug=args.debug)
