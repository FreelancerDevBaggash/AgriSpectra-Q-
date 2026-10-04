#!/usr/bin/env python3
"""
AgriSpectra-Q — Sample Input Validator
=======================================
Validates the committed sample .tif files and checks that
results/sample_demo/ contains corresponding engine outputs.

Usage
-----
    python scripts/validate_sample_inputs.py

Exit code 0 = all checks passed.
Exit code 1 = one or more checks failed.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

EXPECTED_SAMPLES = [
    {
        "file":      "data/sample_input/scene_01_sudan_sample.tif",
        "metadata":  "metadata/scene_01_sudan.json",
        "bands":     224,
        "crs":       "EPSG:32636",
        "min_width": 200,
        "min_height": 200,
    },
    {
        "file":      "data/sample_input/scene_03_russia_sample.tif",
        "metadata":  "metadata/scene_03_russia.json",
        "bands":     224,
        "crs":       "EPSG:32658",
        "min_width": 200,
        "min_height": 200,
    },
]

EXPECTED_METADATA = [
    "metadata/scene_01_sudan.json",
    "metadata/scene_02_china.json",
    "metadata/scene_03_russia.json",
]

EXPECTED_LIVE_RUNS = [
    ("results/live_matrix/AGRQ-LIVE-API-bd454893", "upload_0af7d3e7"),  # Sudan
    ("results/live_matrix/AGRQ-LIVE-API-4c6010c5", "upload_f3b95c9c"),  # China
    ("results/live_matrix/AGRQ-LIVE-API-64988fb3", "upload_05b712ec"),  # Russia
]

REQUIRED_RUN_FILES = [
    "zones.csv", "zones.geojson", "spectral_evidence.csv",
    "inspection_budget.csv", "scene_statistics.json",
    "metrics.json", "manifest.json",
]

PASS = "\033[92m✅\033[0m"
FAIL = "\033[91m❌\033[0m"
WARN = "\033[93m⚠️ \033[0m"

failures = 0


def check(condition: bool, label: str, detail: str = "") -> None:
    global failures
    if condition:
        print(f"  {PASS} {label}")
    else:
        print(f"  {FAIL} {label}" + (f"\n      {detail}" if detail else ""))
        failures += 1


def warn(label: str, detail: str = "") -> None:
    print(f"  {WARN} {label}" + (f"\n      {detail}" if detail else ""))


# ── 1. Root-level required files ─────────────────────────────────────────────
print("\n[1] Root-level required files")
check((ROOT / "README.md").stat().st_size > 500, "README.md exists and non-trivial")
check((ROOT / "requirements.txt").stat().st_size > 100, "requirements.txt exists with content")
check(any((ROOT / "notebooks").glob("*.ipynb")), "At least one .ipynb in notebooks/")
check((ROOT / "LICENSE").exists(), "LICENSE file present")

# ── 2. Sample input .tif files ────────────────────────────────────────────────
print("\n[2] Sample input GeoTIFF files")
try:
    import rasterio
    for s in EXPECTED_SAMPLES:
        p = ROOT / s["file"]
        check(p.exists(), f"{s['file']} exists",
              f"Run scripts to generate: see data/sample_input/README.md")
        if p.exists():
            with rasterio.open(p) as ds:
                check(ds.count == s["bands"],
                      f"  {p.name}: {ds.count} bands == {s['bands']}",
                      f"Got {ds.count}, expected {s['bands']}")
                check(str(ds.crs) == s["crs"],
                      f"  {p.name}: CRS == {s['crs']}",
                      f"Got {ds.crs}")
                check(ds.width >= s["min_width"] and ds.height >= s["min_height"],
                      f"  {p.name}: size {ds.width}x{ds.height} >= {s['min_width']}x{s['min_height']}")
                # Valid pixel check
                b1 = ds.read(1)
                import numpy as np
                valid = (b1 != np.int16(-32768)).sum()
                total = b1.size
                check(valid > total * 0.5,
                      f"  {p.name}: {valid}/{total} valid pixels ({100*valid/total:.0f}%)",
                      "Less than 50% valid pixels — check window selection")
except ImportError:
    warn("rasterio not available — skipping .tif validation",
         "Install with: pip install rasterio")

# ── 3. Metadata JSON files ────────────────────────────────────────────────────
print("\n[3] Metadata JSON files")
for mf in EXPECTED_METADATA:
    p = ROOT / mf
    check(p.exists(), f"{mf} exists")
    if p.exists():
        try:
            d = json.loads(p.read_text())
            check("scene_id"         in d, f"  {mf}: has scene_id")
            check("acquisition_date" in d, f"  {mf}: has acquisition_date")
            check("crs"              in d, f"  {mf}: has crs")
            check("licence"          in d, f"  {mf}: has licence")
            check("full_scene_stats" in d, f"  {mf}: has full_scene_stats")
        except json.JSONDecodeError as e:
            check(False, f"  {mf}: valid JSON", str(e))

# ── 4. Live engine results (3 canonical server runs) ─────────────────────────
print("\n[4] Live engine results — 3 canonical runs")
for run_path, scene_dir in EXPECTED_LIVE_RUNS:
    run = ROOT / run_path
    check(run.exists(), f"{run_path}/ exists")
    check((run / "run_summary.json").exists(), f"  run_summary.json")
    scene = run / scene_dir
    check(scene.exists(), f"  {scene_dir}/ exists")
    if scene.exists():
        for fname in REQUIRED_RUN_FILES:
            check((scene / fname).exists(), f"  {fname}")

# ── 5. Sample demo results ────────────────────────────────────────────────────
print("\n[5] Sample demo results")
demo_dir = ROOT / "results" / "sample_demo"
sample_runs = list(demo_dir.glob("AGRQ-SAMPLE-*")) if demo_dir.exists() else []
check(len(sample_runs) > 0, f"results/sample_demo/ contains at least one AGRQ-SAMPLE-* run",
      "Run: python scripts/validate_sample_inputs.py after running the engine on sample inputs")
if sample_runs:
    latest = max(sample_runs, key=lambda p: p.name)
    check((latest / "run_summary.json").exists(), f"  {latest.name}/run_summary.json")
    for s in EXPECTED_SAMPLES:
        scene_name = Path(s["file"]).stem
        check((latest / scene_name).exists(), f"  {latest.name}/{scene_name}/")

# ── 6. example_output.png ─────────────────────────────────────────────────────
print("\n[6] Example output")
check((ROOT / "results" / "example_output.png").exists(), "results/example_output.png committed")

# ── Summary ───────────────────────────────────────────────────────────────────
print(f"\n{'─'*50}")
if failures == 0:
    print(f"{PASS} All checks passed — repository is submission-ready.")
else:
    print(f"{FAIL} {failures} check(s) failed — fix before submitting.")

sys.exit(0 if failures == 0 else 1)
