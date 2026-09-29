# AgriSpectra-Q — Backend

## Structure

```
backend/
├── api/
│   └── live_matrix_api.py      ← Flask REST API server (port 8765)
├── engine/
│   └── live_matrix_engine.py   ← Core spectral-anomaly processing engine
├── benchmark/
│   ├── final_six_benchmark.py          ← Frozen 6-model scientific benchmark
│   ├── advanced_decision_analysis.py   ← Decision intelligence layer
│   ├── decision_intelligence_validation.py
│   ├── generate_master_outputs.py
│   ├── add_live_lab.py
│   ├── create_required_tables.py
│   ├── make_cards.py
│   └── update_final_report.py
└── requirements.txt
```

## Quick Start

```bash
# 1. Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Place EnMAP GeoTIFF scenes in:
#    data/raw/enmap_three_scenes/
#      ├── scene_01_DT0000205230.TIF
#      ├── scene_02.TIF
#      └── scene_03.TIF

# 4. Start the API server
python backend/api/live_matrix_api.py
# → http://localhost:8765
```

## Engine (CLI)

```bash
# Process all three scenes
python backend/engine/live_matrix_engine.py --scene all

# Process a single scene
python backend/engine/live_matrix_engine.py --scene scene_01_DT0000205230

# Specify a run ID
python backend/engine/live_matrix_engine.py --scene scene_02 --run-id my-run-001
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/` | Service info |
| POST | `/api/analyse` | Start a live analysis run |
| GET  | `/api/runs/<run_id>` | Get run summary |
| GET  | `/api/runs/<run_id>/zones` | Zone CSV index |
| GET  | `/api/runs/<run_id>/spectral-evidence` | Spectral evidence CSV index |
| GET  | `/api/runs/<run_id>/inspection` | Inspection budget CSV index |
| GET  | `/api/runs/<run_id>/report` | Download full report JSON |
| GET  | `/api/runs/<run_id>/files/<scene>/<file>` | Download individual output file |
| GET  | `/api/runs/<run_id>/independent-references` | Independent reference catalog for a run |
| GET  | `/api/runs/<run_id>/independent-f1` | Strict F1 score vs. independent polygon references |

### POST /api/analyse

```json
{ "scene": "scene_01_DT0000205230" }
```

Valid scene values: `scene_01_DT0000205230`, `scene_02`, `scene_03`

### Independent Reference Validation

After analysis completes, two additional read-only endpoints become available:

- **`/api/runs/<run_id>/independent-references`** — returns a catalog of all
  independent geospatial references found for this run (Sentinel-2, Landsat,
  WorldCover polygons).
- **`/api/runs/<run_id>/independent-f1`** — computes a strict F1 score by
  comparing engine-classified polygons against independently sourced ground
  truth. Returns `null` if references are not yet available.

The validation is triggered automatically (non-blocking) at the end of each
analysis run. Raw artifacts land in:

```
results/independent_references/<run_id>/<upload_id>/
├── sentinel2_ndvi.json
├── landsat_ndvi.json
└── worldcover_polygons.geojson
```

## Output Files (per scene per run)

```
results/live_matrix/<run_id>/<scene>/
├── risk_map.tif              ← Georeferenced risk raster (float32)
├── priority_map.tif          ← Priority raster (uint8: 0-3)
├── zones.csv                 ← Ranked high-priority zone table
├── zones.geojson             ← GeoJSON zone boundaries
├── spectral_evidence.csv     ← Per-band spectral means for top-10 zones
├── inspection_budget.csv     ← Recall-vs-budget tradeoff table
├── scene_statistics.json     ← Scene metadata and thresholds
├── metrics.json              ← Engine metadata
└── manifest.json             ← Run provenance record
```

## Scientific Boundaries

> Output zones are **spectral-anomaly candidates** for field inspection.  
> They are **not** a disease diagnosis, pest diagnosis, or biological stress
> assessment. Field verification is required for all priority zones.

The benchmark results in `results/industrial_validation/` are **frozen** and
completely separate from the live analysis engine.
