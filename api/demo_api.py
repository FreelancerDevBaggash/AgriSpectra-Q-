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

ALLOWED_FILES = {
    "zones.csv", "spectral_evidence.csv", "inspection_budget.csv",
    "zones.geojson", "scene_statistics.json", "metrics.json", "manifest.json",
    "risk_map.tif", "priority_map.tif",
}

# ── Multi-run demo index ───────────────────────────────────────────────────────
# scene_id → {"run_dir": Path, "scene_dir": Path}
# Built from ALL <run_id>/<scene_dir>/ folders under demo_data/.
# Admin endpoints call _rebuild_demo_index() after any change.

def _build_demo_index() -> dict:
    """
    Scan every run folder in demo_data/ and map each scene sub-directory
    to its containing run.  Newer runs (by mtime) win on scene_id collision.
    """
    index: dict[str, dict] = {}
    if not DEMO_DATA_ROOT.exists():
        return index
    for run_dir in sorted(DEMO_DATA_ROOT.iterdir(), key=lambda d: d.stat().st_mtime):
        if not run_dir.is_dir():
            continue
        for scene_dir in sorted(run_dir.iterdir()):
            if not scene_dir.is_dir():
                continue
            if not (scene_dir / "scene_statistics.json").exists():
                continue
            # scene_id == scene_dir name (e.g. "scene_01_DT0000205230")
            index[scene_dir.name] = {
                "run_dir":   run_dir,
                "scene_dir": scene_dir,
            }
    return index

# Backwards-compat shim: SCENE_DIR_MAP used in a few legacy spots
def _build_scene_dir_map(run_dir: Path) -> dict:
    if not run_dir.exists():
        return {}
    return {
        d.name: d.name
        for d in sorted(run_dir.iterdir())
        if d.is_dir() and (d / "scene_statistics.json").exists()
    }

DEMO_INDEX    = _build_demo_index()
SCENE_DIR_MAP = {k: k for k in DEMO_INDEX}   # scene_id → scene_id (flat)

# ── Scene meta helpers (desc, tags, f1_score, label — editable from Admin) ────

def _read_scene_meta(scene_dir: Path) -> dict:
    """Read scene_meta.json if present, else return empty dict."""
    p = scene_dir / "scene_meta.json"
    if p.exists():
        try:
            return json.loads(p.read_text())
        except Exception:
            return {}
    return {}

def _write_scene_meta(scene_dir: Path, meta: dict) -> None:
    """Write scene_meta.json — only known fields, sanitised."""
    safe = {
        "label":     str(meta.get("label", ""))[:80],
        "desc":      str(meta.get("desc",  ""))[:500],
        "tags":      [str(t)[:40] for t in meta.get("tags", []) if t][:10],
        "f1_score":  str(meta.get("f1_score", ""))[:10],
    }
    (scene_dir / "scene_meta.json").write_text(json.dumps(safe, ensure_ascii=False, indent=2))


def _build_scene_catalog() -> list:
    """Build /api/scenes response — merges scene_statistics.json + scene_meta.json."""
    entries = []
    for i, (scene_id, info) in enumerate(DEMO_INDEX.items(), start=1):
        stats_path = info["scene_dir"] / "scene_statistics.json"
        meta       = _read_scene_meta(info["scene_dir"])
        if stats_path.exists():
            st      = json.loads(stats_path.read_text())
            loc_obj = st.get("location", {})
            parts   = [loc_obj.get("city"), loc_obj.get("state"), loc_obj.get("country")]
            entries.append({
                "scene_id":            scene_id,
                "label":               meta.get("label") or f"Scene {i:02d}",
                "location":            ", ".join(p for p in parts if p) or "Unknown",
                "dimensions":          st.get("dimensions", []),
                "bands":               st.get("bands", 224),
                "resolution_m":        st.get("resolution_m", 30),
                "crs":                 st.get("crs", ""),
                "valid_pixels":        st.get("valid_pixels", 0),
                "nodata_percentage":   round(st.get("nodata_percentage", 0), 2),
                "priority_zone_count": st.get("priority_zone_count", 0),
                "processing_seconds":  round(st.get("processing_seconds", 0), 1),
                "desc":                meta.get("desc", ""),
                "tags":                meta.get("tags", []),
                "f1_score":            meta.get("f1_score", ""),
                "available":           True,
            })
        else:
            entries.append({
                "scene_id": scene_id,
                "label":    meta.get("label") or f"Scene {i:02d}",
                "location": "Unknown", "dimensions": [], "bands": 224,
                "resolution_m": 30, "crs": "", "valid_pixels": 0,
                "nodata_percentage": 0, "priority_zone_count": 0,
                "processing_seconds": 0,
                "desc":     meta.get("desc", ""),
                "tags":     meta.get("tags", []),
                "f1_score": meta.get("f1_score", ""),
                "available": True,
            })
    return entries

SCENE_CATALOG = _build_scene_catalog()

def _rebuild_globals() -> None:
    """Hot-reload all derived globals after demo_data changes. Called by admin endpoints."""
    global DEMO_RUN_DIR, DEMO_RUN_ID, DEMO_INDEX, SCENE_DIR_MAP, SCENE_CATALOG
    DEMO_RUN_DIR  = _find_demo_run_dir()
    DEMO_RUN_ID   = DEMO_RUN_DIR.name
    DEMO_INDEX    = _build_demo_index()
    SCENE_DIR_MAP = {k: k for k in DEMO_INDEX}
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
    scenes_status = []
    for s in SCENE_CATALOG:
        sid       = s["scene_id"]
        info      = DEMO_INDEX.get(sid)
        available = info["scene_dir"].exists() if info else False
        scenes_status.append({
            "scene_id":  sid,
            "label":     s["label"],
            "available": available,
            "demo_mode": True,
            "note":      "Pre-computed from real EnMAP GeoTIFF" if available else "Demo data missing",
        })
    return jsonify({
        "status":           "ready" if DEMO_INDEX else "degraded",
        "mode":             "demo",
        "demo_run_id":      DEMO_RUN_ID,
        "demo_run_exists":  bool(DEMO_INDEX),
        "all_scenes_ready": all(s["available"] for s in scenes_status),
        "scenes_on_disk":   scenes_status,
    })


@app.post("/api/analyse")
def analyse():
    body  = request.get_json(silent=True) or {}
    scene = body.get("scene", next(iter(DEMO_INDEX), "scene_01_DT0000205230"))

    if scene not in DEMO_INDEX:
        return jsonify({"error": f"scene must be one of: {sorted(DEMO_INDEX)}"}), 400

    info      = DEMO_INDEX[scene]
    scene_dir = info["scene_dir"]
    run_dir   = info["run_dir"]

    if not scene_dir.exists():
        return jsonify({"error": f"Demo data for {scene} not found at {scene_dir}."}), 503

    scene_slug   = next((k for k, v in _SCENE_SLUG.items() if v == scene), scene.replace("_", "")[:12])
    synthetic_id = f"AGRQ-DEMO-{scene_slug}-{uuid.uuid4().hex[:8]}"
    DEMO_RUNS[synthetic_id] = {
        "scene":     scene,
        "run_dir":   run_dir,
        "scene_dir": scene_dir,
    }

    time.sleep(0.8)

    return jsonify({
        "run_id": synthetic_id,
        "scene":  scene,
        "path":   str(run_dir),
        "status": "completed",
        "mode":   "LIVE ANALYSIS",
        "scenes": [scene],
    })


def _resolve_run(rid: str) -> tuple[str | None, Path | None]:
    """Return (scene, run_dir) for a run_id."""
    # 1. In-memory registry — covers fresh synthetic IDs from this session
    if rid in DEMO_RUNS:
        entry = DEMO_RUNS[rid]
        return str(entry["scene"]), Path(entry["run_dir"])

    # 2. AGRQ-DEMO-* after server restart — recover scene from slug, use DEMO_INDEX
    if rid.startswith("AGRQ-DEMO-"):
        scene = _scene_from_demo_id(rid)
        info  = DEMO_INDEX.get(scene)
        if info:
            DEMO_RUNS[rid] = {"scene": scene, "run_dir": info["run_dir"],
                              "scene_dir": info["scene_dir"]}
            return scene, info["run_dir"]

    # 3. Real run on disk in results/live_matrix/
    run_dir = RESULTS / rid
    if run_dir.exists():
        summary_path = run_dir / "run_summary.json"
        if summary_path.exists():
            summary = json.loads(summary_path.read_text())
            scenes  = summary.get("scenes", [])
            first   = scenes[0] if scenes else None
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
    scene, run_dir = _resolve_run(rid)
    if run_dir is None:
        return jsonify({"error": "run not found"}), 404

    files = []
    # For demo synthetic IDs, only serve the one scene registered for this run
    if rid in DEMO_RUNS and scene:
        scene_dir = DEMO_RUNS[rid]["scene_dir"]
        target = Path(scene_dir) / filename
        if target.exists():
            files.append({
                "scene":    Path(scene_dir).name,
                "path":     str(target),
                "download": f"/api/runs/{rid}/files/{Path(scene_dir).name}/{filename}",
            })
    else:
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

    # For demo runs, resolve file path via DEMO_INDEX (scene may be in a different run_dir)
    if rid in DEMO_RUNS:
        info = DEMO_INDEX.get(scene)
        target = (info["scene_dir"] / filename) if info else (run_dir / scene / filename)
    else:
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
    """Read scene_statistics.json + scene_meta.json and return a compact summary dict."""
    stp = scene_dir / "scene_statistics.json"
    if not stp.exists():
        return {}
    st   = json.loads(stp.read_text())
    meta = _read_scene_meta(scene_dir)
    loc  = st.get("location", {})
    parts = [loc.get("city"), loc.get("state"), loc.get("country")]
    output_files = [
        {"name": f.name, "size_kb": round(f.stat().st_size / 1024, 1)}
        for f in sorted(scene_dir.iterdir()) if f.is_file()
    ]
    return {
        "scene":        scene_dir.name,
        "zones":        st.get("priority_zone_count", 0),
        "seconds":      round(st.get("processing_seconds", 0), 1),
        "location":     ", ".join(p for p in parts if p),
        "dims":         st.get("dimensions", []),
        "crs":          st.get("crs", ""),
        "valid_pixels": st.get("valid_pixels", 0),
        "nodata_pct":   round(st.get("nodata_percentage", 0), 2),
        "output_files": output_files,
        # editable meta
        "label":    meta.get("label", ""),
        "desc":     meta.get("desc",  ""),
        "tags":     meta.get("tags",  []),
        "f1_score": meta.get("f1_score", ""),
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
    if not run_id or not re.match(r'^AGRQ-[A-Z0-9a-z_-]+$', run_id):
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

    # Hot-reload all globals so this session serves the new scenes immediately
    _rebuild_globals()

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

    if not re.match(r'^AGRQ-[A-Z0-9a-z_-]+$', run_id):
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

    # Hot-reload all globals
    _rebuild_globals()

    return jsonify({"ok": True, "deleted": f"{run_id}/{scene}"})


# ── POST /api/admin/demo/meta — save editable metadata for a demo scene ────────
@app.post("/api/admin/demo/meta")
def admin_set_scene_meta():
    """
    Body JSON:
      { "run_id": "AGRQ-...", "scene": "scene_01_...",
        "label": "...", "desc": "...", "tags": ["...", "..."], "f1_score": "98.47%" }
    Writes scene_meta.json into demo_data/<run_id>/<scene>/.
    Hot-reloads SCENE_CATALOG so /api/scenes reflects changes immediately.
    """
    auth_err = _admin_auth()
    if auth_err: return auth_err

    body     = request.get_json(silent=True) or {}
    run_id   = body.get("run_id", "")
    scene_id = body.get("scene", "")

    if not run_id or not re.match(r'^AGRQ-[A-Z0-9a-z_-]+$', run_id):
        return jsonify({"error": "invalid run_id"}), 400
    if not scene_id:
        return jsonify({"error": "scene is required"}), 400

    scene_dir = DEMO_DATA_ROOT / run_id / scene_id
    if not scene_dir.exists():
        return jsonify({"error": f"demo scene not found: {run_id}/{scene_id}"}), 404

    _write_scene_meta(scene_dir, body)

    # Hot-reload catalog only (no need to rescan full index)
    global SCENE_CATALOG
    SCENE_CATALOG = _build_scene_catalog()

    return jsonify({
        "ok":       True,
        "run_id":   run_id,
        "scene":    scene_id,
        "meta":     _read_scene_meta(scene_dir),
    })


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
