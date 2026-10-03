# AgriSpectra-Q

> **Hyperspectral crop-intelligence and decision-support platform**  
> Transforms real EnMAP Earth observation data into ranked field-inspection priorities.

[![Frontend](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](frontend/)
[![Backend](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](backend/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Overview

AgriSpectra-Q processes 224-band EnMAP hyperspectral GeoTIFF imagery through a windowed
spectral-anomaly engine, producing georeferenced priority zones that guide field inspection
teams — not a disease diagnostic, but an evidence-led decision-support signal.

**Two separate result modes:**

| Mode | Description |
|------|-------------|
| **Live Analysis** | Real-time spectral-anomaly engine on 3 EnMAP scenes via REST API |
| **Frozen Benchmark** | Pre-computed 6-model scientific validation (90 runs, 3 scenes, 5 seeds) |

---

## Project Structure

```
AgriSpectra-Q/
├── backend/                         ← Python backend
│   ├── api/
│   │   └── live_matrix_api.py       ← Flask REST server  (port 8765)
│   ├── engine/
│   │   └── live_matrix_engine.py    ← Spectral-anomaly core engine
│   ├── benchmark/                   ← Frozen 6-model validation scripts
│   └── requirements.txt
│
├── api/                             ← Deployable API entrypoints
│   ├── live_matrix_api.py           ← Production server (Docker/gunicorn)
│   ├── demo_api.py                  ← Hackathon demo server (pre-computed)
│   ├── production_api.py            ← VPS upload-only server
│   ├── independent_reference_catalog.py  ← Independent reference reader
│   ├── independent_validation_hook.py    ← Non-blocking validation trigger
│   ├── independent_f1.py                 ← Strict F1 vs. polygon references
│   ├── auto_independent_validation.py    ← Planetary Computer STAC query
│   └── requirements_independent_f1.txt  ← shapely + pyproj install list
│
├── frontend/                        ← Next.js 15 frontend
│   ├── src/app/
│   │   ├── page.tsx                 ← Home / landing
│   │   ├── intelligence/page.tsx    ← Scene selection + run trigger
│   │   ├── dashboard/page.tsx       ← Results, zones, risk charts
│   │   ├── results/page.tsx         ← Frozen benchmark results
│   │   ├── project/page.tsx         ← About the project
│   │   └── technology/page.tsx      ← System architecture
│   ├── src/components/
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   └── IndependentReferencePanel.tsx  ← Independent validation UI
│   └── src/lib/
│       ├── api.ts                   ← API client
│       ├── types.ts                 ← TypeScript types
│       └── utils.ts
│
├── data/
│   └── raw/enmap_three_scenes/      ← EnMAP GeoTIFF input files (not in repo)
│       ├── scene_01_DT0000205230.TIF
│       ├── scene_02.TIF
│       └── scene_03.TIF
│
├── results/
│   ├── live_matrix/                 ← Engine run outputs (auto-generated)
│   ├── industrial_validation/       ← Frozen benchmark results + figures
│   └── independent_references/      ← Independent validation artifacts (auto-generated)
│
├── legacy/                          ← Historical reference files (not deployed)
│
└── docs/                            ← Architecture & specification documents
```

---

## Quick Start

### Backend

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start API server
python backend/api/live_matrix_api.py
# → http://localhost:8765

# Or run the engine directly (CLI)
python backend/engine/live_matrix_engine.py --scene all
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8765
```

---

## Verified EnMAP Scenes

Three real EnMAP L2A scenes have been processed with the live engine:

| Scene | Location | CRS | Dimensions | Zones | Runtime |
|-------|----------|-----|-----------|-------|---------|
| **Sudan** (DT0000205230) | ad-Damer, River Nile State, Sudan | EPSG:32636 | 1152 × 1214 | 438 | 43.1 s |
| **China** | Karamay City, Xinjiang, China | EPSG:32645 | 1210 × 1244 | 864 | 85.2 s |
| **Russia** | Kamchatka Krai, Russia | EPSG:32658 | 1296 × 1322 | 63 | 20.1 s |

> **Data provenance:** EnMAP L2A data courtesy of the German Aerospace Center (DLR) / ESA.
> EnMAP data is freely available for scientific use at [enmap.org](https://www.enmap.org/).

---

## Notebook

A reproducible demo notebook is available at [`notebooks/AgriSpectra_Q_Demo.ipynb`](notebooks/AgriSpectra_Q_Demo.ipynb).

It demonstrates the full pipeline on the three verified scenes using pre-computed results
(no GeoTIFF files required). Run with **Restart Kernel → Run All**.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript 5.7, Tailwind CSS 3.4 |
| Charts | Recharts 2.15 |
| Maps | MapLibre GL 5 |
| Backend | Python 3.11, Flask 3.1.3 |
| Engine | Rasterio 1.4.3, NumPy 2.5.3, SciPy 1.18.1 |
| Benchmark | scikit-learn 1.9.1, XGBoost 3.4.1, pandas 2.2 |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/` | Service info |
| `POST` | `/api/analyse` | Start a live analysis run |
| `GET`  | `/api/runs/<run_id>` | Run summary |
| `GET`  | `/api/runs/<run_id>/zones` | Zone CSV index |
| `GET`  | `/api/runs/<run_id>/spectral-evidence` | Spectral evidence |
| `GET`  | `/api/runs/<run_id>/inspection` | Inspection budget |
| `GET`  | `/api/runs/<run_id>/report` | Download report JSON |
| `GET`  | `/api/runs/<run_id>/files/<scene>/<file>` | Individual output file |
| `GET`  | `/api/runs/<run_id>/independent-references` | Independent reference catalog |
| `GET`  | `/api/runs/<run_id>/independent-f1` | Strict F1 vs. independent references |

---

## Benchmark Results (Frozen)

| Model | Mean F1 | PR-AUC | ROC-AUC |
|-------|---------|--------|---------|
| **AgriSpectra-Q** | **96.40%** | **99.47%** | **99.87%** |
| Adaptive Classical | 96.34% | 99.47% | 99.86% |
| HSI-RF | 96.31% | 99.49% | 99.87% |
| 48-band XGBoost | 95.22% | 99.23% | 99.80% |
| Spectral XGBoost | 94.78% | 99.24% | 99.81% |
| Current Hybrid | 89.98% | 96.16% | 99.75% |

> ⚠️ AgriSpectra-Q's lead over HSI-RF is +0.0008 F1 (95% CI crosses zero).
> Statistical superiority is **not** established.

---

## Live Analysis Output (per scene)

```
results/live_matrix/<run_id>/<scene>/
├── risk_map.tif              ← Spectral-priority raster (float32)
├── priority_map.tif          ← Priority raster (uint8: 0-3)
├── zones.csv                 ← Ranked high-priority zone table
├── zones.geojson             ← GeoJSON zone boundaries
├── spectral_evidence.csv     ← Per-band spectral means (top-10 zones)
├── inspection_budget.csv     ← Recall-vs-budget tradeoff
├── scene_statistics.json     ← Scene metadata and thresholds
├── metrics.json              ← Engine metadata
└── manifest.json             ← Run provenance record
```

---

## Scientific Boundaries

> Output zones are **spectral-anomaly candidates** for field inspection.
> They are **not** a confirmed disease or pest diagnosis.
> All priority zones require independent field verification.

- No field-validated ground truth
- Priority thresholds are scene-relative percentiles
- Quantum component: quantum-inspired feature transformation only — no quantum hardware, no measured quantum advantage
- Benchmark advantage over HSI-RF is not statistically significant (95% CI crosses zero)

---

## Deployment

### Frontend → Vercel

```bash
# Push to GitHub, then import at vercel.com
git push origin main
```

Set `NEXT_PUBLIC_API_URL` environment variable in Vercel dashboard.

### Backend → Docker

```bash
docker build -t agrispectra-backend -f backend/Dockerfile .
docker run -p 8765:8765 agrispectra-backend
```

---

## Docs

Full architecture and specification documents are in [`docs/`](docs/):

- [`System Architecture`](docs/AgriSpectra-Q_—_System_Architecture.md)
- [`Backend API Specification`](docs/AgriSpectra-Q_—_Backend_API_Specification.md)
- [`Data and File Schema`](docs/AgriSpectra-Q_—_Data_and_File_Schema.md)
- [`Frontend Pages and UX Flow`](docs/AgriSpectra-Q_—_Frontend_Pages_and_UX_Flow.md)
- [`Scientific Guardrails`](docs/AgriSpectra-Q_—_Scientific_Guardrails.md)

---

## License

MIT — see [LICENSE](LICENSE)
