#!/usr/bin/env python3
"""
AgriSpectra-Q — Live Matrix Engine
===================================
Windowed, georeferenced spectral-anomaly analysis on real EnMAP GeoTIFF scenes.
Produces risk rasters, priority rasters, connected zones, GeoJSON, spectral
evidence, and inspection-budget outputs.

Scientific boundary: output zones are spectral-anomaly candidates for field
inspection.  They are NOT a disease or pest diagnosis.
"""

import argparse
import csv
import json
import time
import uuid
from pathlib import Path

import numpy as np
import rasterio
from rasterio.features import shapes
from rasterio.transform import xy
from scipy import ndimage

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]          # project root
RAW  = ROOT / "data" / "raw" / "enmap_three_scenes"
OUT  = ROOT / "results" / "live_matrix"

SCENES = {
    "scene_01_DT0000205230": RAW / "scene_01_DT0000205230.TIF",
    "scene_02":               RAW / "scene_02.TIF",
    "scene_03":               RAW / "scene_03.TIF",
}

# 32 evenly-spaced band indices across 224 EnMAP bands
BANDS = np.linspace(0, 223, 32, dtype=int)


# ── Helpers ───────────────────────────────────────────────────────────────────

def csvwrite(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        return
    keys: list[str] = []
    for row in rows:
        for k in row:
            if k not in keys:
                keys.append(k)
    with path.open("w", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=keys)
        writer.writeheader()
        writer.writerows(rows)


# ── Core processing ───────────────────────────────────────────────────────────

def process(name: str, path: Path, run_dir: Path) -> dict:
    t0 = time.perf_counter()
    out_dir = run_dir / name
    out_dir.mkdir(parents=True, exist_ok=True)

    with rasterio.open(path) as ds:
        H, W, C = ds.height, ds.width, ds.count
        nodata    = ds.nodata
        transform = ds.transform
        crs       = str(ds.crs)

        # ── Pass 1: online mean/variance over 32 bands ──
        n    = 0
        mean = np.zeros(len(BANDS), float)
        M2   = np.zeros(len(BANDS), float)
        valid_count = 0

        for _, win in ds.block_windows(1):
            a  = ds.read(indexes=(BANDS + 1).tolist(), window=win).astype("float32")
            ok = np.all(np.isfinite(a), axis=0)
            if nodata is not None:
                ok &= a[0] != nodata
            x = a[:, ok].T
            valid_count += x.shape[0]
            if len(x):
                nb  = len(x)
                d   = x.mean(0) - mean
                n2  = n + nb
                mean += d * nb / n2
                M2   += ((x - mean) ** 2).sum(0) + (d ** 2) * n * nb / n2
                n    = n2

        std = np.sqrt(np.maximum(M2 / max(n - 1, 1), 1e-6))

        # ── Pass 2: RMS standardised spectral deviation (risk) ──
        risk  = np.full((H, W), np.nan, np.float32)
        valid = np.zeros((H, W), bool)

        for _, win in ds.block_windows(1):
            a  = ds.read(indexes=(BANDS + 1).tolist(), window=win).astype("float32")
            ok = np.all(np.isfinite(a), axis=0)
            if nodata is not None:
                ok &= a[0] != nodata
            z  = np.sqrt(np.mean(((a - mean[:, None, None]) / std[:, None, None]) ** 2, axis=0))
            rr, cc = int(win.row_off), int(win.col_off)
            h,  w  = z.shape
            risk[rr:rr+h, cc:cc+w][ok]  = z[ok]
            valid[rr:rr+h, cc:cc+w]     = ok

        vals = risk[valid]
        q95  = float(np.quantile(vals, 0.95))
        q80  = float(np.quantile(vals, 0.80))
        q50  = float(np.quantile(vals, 0.50))

        # Relative operational priority raster (scene-percentile thresholds)
        pri = np.zeros((H, W), np.uint8)
        pri[valid & (risk >= q50)] = 1
        pri[valid & (risk >= q80)] = 2
        pri[valid & (risk >= q95)] = 3

        hi      = pri == 3
        lab, nz = ndimage.label(hi, structure=np.ones((3, 3), int))

        # ── Build zone list ──
        zones: list[dict] = []
        for zid in range(1, nz + 1):
            ys, xs = np.where(lab == zid)
            npx    = len(xs)
            if npx < 9:
                continue
            rv      = risk[ys, xs]
            cx, cy  = xy(transform, float(ys.mean()), float(xs.mean()))
            zones.append({
                "zone_id":                 f"{name}-Z{len(zones)+1:04d}",
                "scene":                   name,
                "pixel_count":             int(npx),
                "approx_area_m2":          float(npx * abs(transform.a * transform.e)),
                "centroid_x":              float(cx),
                "centroid_y":              float(cy),
                "mean_risk":               float(rv.mean()),
                "max_risk":                float(rv.max()),
                "median_risk":             float(np.median(rv)),
                "high_priority_pixel_pct": 100.0,
                "priority_category":       "HIGH PRIORITY",
                "threshold_type":          "95th percentile prioritisation threshold",
                "recommendation":          (
                    "Spectral-stress evidence detected. Prioritise field inspection "
                    "to determine the underlying cause. Field verification required."
                ),
            })

        zones.sort(key=lambda z: z["mean_risk"], reverse=True)
        for i, z in enumerate(zones, 1):
            z["priority_rank"] = i

        # ── Raster outputs ──
        profile = ds.profile.copy()
        profile.update(count=1, dtype="float32", nodata=-9999, compress="deflate")
        with rasterio.open(out_dir / "risk_map.tif", "w", **profile) as o:
            o.write(np.nan_to_num(risk, nan=-9999).astype("float32"), 1)

        profile.update(dtype="uint8", nodata=0)
        with rasterio.open(out_dir / "priority_map.tif", "w", **profile) as o:
            o.write(pri, 1)

        # ── GeoJSON ──
        features = []
        for zid in range(1, nz + 1):
            mask = lab == zid
            ys, xs = np.where(mask)
            if len(xs) < 9:
                continue
            geom = None
            for g, _ in shapes(mask.astype(np.uint8), mask=mask, transform=transform):
                geom = g
            if geom is not None:
                match = next(
                    (z for z in zones
                     if z["pixel_count"] == len(xs)
                     and abs(z["centroid_x"] - xy(transform, float(ys.mean()), float(xs.mean()))[0]) < 1e-3),
                    None,
                )
                if match:
                    features.append({"type": "Feature", "geometry": geom, "properties": match})

        (out_dir / "zones.geojson").write_text(json.dumps({
            "type": "FeatureCollection",
            "crs": {"type": "name", "properties": {"name": crs}},
            "features": features,
        }, default=float))

        csvwrite(out_dir / "zones.csv", zones)

        # ── Spectral evidence (top-10 zones) ──
        evidence: list[dict] = []
        for z in zones[:10]:
            zid  = z["zone_id"]
            rank = z["priority_rank"]
            idx  = next((i for i, x in enumerate(zones) if x["zone_id"] == zid), 0) + 1
            ys, xs = np.where(lab == idx)
            if len(xs):
                y0, y1 = ys.min(), ys.max() + 1
                x0, x1 = xs.min(), xs.max() + 1
                a   = ds.read(window=rasterio.windows.Window(x0, y0, x1 - x0, y1 - y0)).astype("float32")
                m   = (lab[y0:y1, x0:x1] == idx) & np.all(np.isfinite(a), axis=0)
                spec = np.nanmean(np.where(m[None, :, :], a, np.nan), axis=(1, 2))
                for b, val in enumerate(spec, 1):
                    ref = float(mean[list(BANDS).index(min(BANDS, key=lambda q: abs(q - (b - 1))))]) \
                        if (b - 1) in BANDS else None
                    evidence.append({
                        "zone_id":                      zid,
                        "priority_rank":                rank,
                        "band_index":                   b,
                        "observed_mean":                float(val),
                        "reference_mean_32band_only":   ref,
                        "wavelength_status":            "unavailable in GeoTIFF; band index reported",
                    })

        csvwrite(out_dir / "spectral_evidence.csv", evidence)

        # ── Inspection budget ──
        budget_rows = []
        for b in [0.05, 0.10, 0.20, 0.30, 0.50, 1.0]:
            k   = max(1, int(valid_count * b))
            sel = np.argsort(vals)[-k:]
            budget_rows.append({
                "budget_fraction":         b,
                "valid_pixels":            valid_count,
                "selected_pixels":         k,
                "positive_recall":         float(np.sum(vals[sel] >= q95) / max(1, np.sum(vals >= q95))),
                "coverage_percentage":     round(b * 100, 0),
                "label":                   "pixel-level proxy inspection coverage",
            })
        csvwrite(out_dir / "inspection_budget.csv", budget_rows)

        # ── Scene statistics & manifests ──
        elapsed = time.perf_counter() - t0
        scene_stats = {
            "scene":              name,
            "source":             str(path),
            "dimensions":         [H, W],
            "bands":              C,
            "resolution_m":       30.0,
            "valid_pixels":       valid_count,
            "total_pixels":       H * W,
            "nodata_percentage":  float(100 * (1 - valid_count / (H * W))),
            "crs":                crs,
            "transform":          list(transform),
            "thresholds":         {"low_medium_q50": q50, "medium_high_q80": q80, "high_priority_q95": q95},
            "priority_zone_count": len(zones),
            "processing_seconds": elapsed,
            "status":             "LIVE ANALYSIS — spectral anomaly proxy, not disease label",
        }
        (out_dir / "scene_statistics.json").write_text(json.dumps(scene_stats, indent=2, default=float))
        (out_dir / "metrics.json").write_text(json.dumps({
            "engine":          "windowed spectral anomaly matrix",
            "risk_definition": "RMS standardised deviation over 32 actual EnMAP bands",
            "models":          "spectral anomaly proxy; AgriSpectra-Q benchmark is frozen separately",
            "zone_count":      len(zones),
        }, indent=2))
        (out_dir / "manifest.json").write_text(json.dumps({
            "run_id":           run_dir.name,
            "scene":            name,
            "source":           str(path),
            "live":             True,
            "leakage_control":  "no labels; relative thresholds from full-scene unsupervised anomaly reference",
            "crs":              crs,
            "outputs":          [
                "risk_map.tif", "priority_map.tif", "zones.geojson", "zones.csv",
                "spectral_evidence.csv", "inspection_budget.csv",
                "scene_statistics.json", "metrics.json",
            ],
        }, indent=2))

        return scene_stats


# ── CLI entry-point ───────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(description="AgriSpectra-Q Live Matrix Engine")
    ap.add_argument("--scene",  choices=list(SCENES) + ["all"], default="all",
                    help="Scene to process (default: all)")
    ap.add_argument("--run-id", default=None, help="Optional run ID override")
    args = ap.parse_args()

    run_id  = args.run_id or f"AGRQ-LIVE-{time.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
    run_dir = OUT / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    scene_names = list(SCENES) if args.scene == "all" else [args.scene]
    stats = [process(name, SCENES[name], run_dir) for name in scene_names]

    (run_dir / "run_summary.json").write_text(json.dumps({
        "run_id": run_id,
        "live":   True,
        "mode":   "LIVE ANALYSIS",
        "scenes": stats,
        "limitations": [
            "Spectral wavelength metadata unavailable; band indices reported",
            "Unsupervised spectral anomaly proxy — no disease/pest labels",
            "Priority thresholds are scene-relative percentiles",
            "Not the frozen six-model benchmark",
        ],
    }, indent=2, default=float))

    print(json.dumps({
        "run_id":  run_id,
        "path":    str(run_dir),
        "scenes":  len(stats),
        "seconds": sum(x["processing_seconds"] for x in stats),
    }, indent=2))


if __name__ == "__main__":
    main()
