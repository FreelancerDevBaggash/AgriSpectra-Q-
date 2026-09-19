# AgriSpectra-Q — Project Overview

**Document type:** Technical product and implementation overview  
**Audience:** Frontend, backend, dashboard, geospatial, and ML developers  
**Project status:** Industrial-oriented proof of concept; promising but not yet field-validated or production-ready

> **Core operating philosophy:** DETECT → PRIORITISE → INSPECT → VERIFY

## 1. Executive Summary

AgriSpectra-Q is an industrial-oriented hyperspectral crop-intelligence and decision-support platform. It transforms real EnMAP Earth Observation data into spectral intelligence, crop-stress or anomaly evidence, georeferenced priority zones, inspection rankings, and decision-support information.

The product is not simply a pixel classifier. Its intended value is to help an inspection team decide **where to look first and what spectral evidence caused that location to be prioritised**.

The current project contains two clearly separated result families:

1. **Live Matrix:** a real, windowed, georeferenced spectral-anomaly analysis run directly on three EnMAP GeoTIFF scenes. It creates risk rasters, priority rasters, connected zones, zone tables, GeoJSON, spectral evidence tables, and inspection-budget outputs.
2. **Frozen Scientific Benchmark:** a locked comparison of six predictive systems evaluated on three real EnMAP scenes using spatially separated splits, five seeds, validation-only calibration, frozen test predictions, and paired bootstrap analysis.

The current evidence supports the following position:

> AgriSpectra-Q is competitive with HSI-RF and provides a promising hybrid research layer, but statistical superiority and operational superiority have not been established.

The output target is a **Spectral Anomaly Proxy**. It is not a confirmed disease, pest, infected-field, or biological-stress label.

## 2. Problem

Large agricultural areas are expensive and difficult to inspect uniformly. Earth Observation can reveal spectral changes, but a raw anomaly map does not by itself answer the operational questions that matter to a field team:

- Which locations should be inspected first?
- How much area can be inspected under a limited budget?
- Which zones have the strongest evidence?
- Is the signal spatially concentrated or isolated?
- What does the system know, and what remains uncertain?

AgriSpectra-Q is designed to convert complex hyperspectral observations into ranked inspection priorities rather than presenting only raw model scores.

## 3. Solution

The platform combines five capabilities:

1. **Hyperspectral ingestion:** Read real EnMAP L2A spectral imagery, including large GeoTIFF scenes, with NoData handling and windowed processing.
2. **Spectral intelligence:** Calculate anomaly-oriented evidence from the spectral signal and preserve scene georeferencing.
3. **Predictive benchmark:** Compare AgriSpectra-Q with strong classical baselines under a frozen spatial protocol.
4. **Decision intelligence:** Convert scores into relative priority categories, ranked zones, inspection-budget analysis, and operational recommendations.
5. **Evidence presentation:** Show the decision first, the visual evidence second, and technical details third.

The correct product language is **spectral anomaly**, **spectral-priority zone**, **spectral-stress evidence**, and **inspection priority**.

## 4. Who Uses It

The intended users are agricultural inspection teams, agronomists, farm and agribusiness analysts, Earth Observation analysts, agricultural consultants, irrigation and land-monitoring operators, government agricultural programmes, and geospatial AI engineers.

The current PoC does not claim adoption by any customer, measured financial return, field-team productivity improvement, or commercial deployment. Those claims require a separate operational pilot with field observations and cost accounting.

## 5. Core Product Question

The primary product question is:

> **Where should the inspection team look first, and what spectral evidence caused the system to prioritise that zone?**

A user should be able to select a real EnMAP scene, review a ranked list of zones, open a zone on a geospatial map, inspect its score and evidence, and decide whether to send a field team for verification.

## 6. End-to-End Workflow

```text
Real EnMAP hyperspectral EO
        ↓
Windowed spectral data engine
        ↓
Quality and NoData handling
        ↓
Noise-correction integration boundary where supported
        ↓
Spectral and spatial feature processing
        ↓
Classical and hybrid AI analysis
        ↓
Spectral anomaly or stress-proxy score
        ↓
Live Matrix
        ↓
Risk map and priority map
        ↓
Connected high-priority zones
        ↓
Spectral evidence and zone ranking
        ↓
Inspection-budget analysis
        ↓
Decision-support recommendation
        ↓
Field inspection
        ↓
Independent verification
```

The phrase “noise-correction module” must be implemented carefully. The supplied SAGE-QEC component is preserved as a fixed integration boundary according to its native mathematical logic. It is not presented as a direct reflectance correction unless a compatible input/output contract is explicitly verified.

## 7. Data

### 7.1 Source data

The project uses real EnMAP hyperspectral satellite data. The current processed scenes have 224 bands and approximately 30 m spatial resolution. The source data are GeoTIFF files with NoData values and valid geospatial metadata.

The live run used these three scenes:

| Scene | Dimensions | Bands | Valid pixels | NoData | Resolution | CRS | Processing time | High-priority zones |
|---|---:|---:|---:|---:|---:|---|---:|---:|
| Scene 1 | 1153 × 1198 | 224 | 1,028,176 | 25.56% | 30 m | EPSG:32753 | 37.14 s | 407 |
| Scene 2 | 1210 × 1244 | 224 | 1,006,261 | 33.15% | 30 m | EPSG:32645 | 111.41 s | 864 |
| Scene 3 | 1152 × 1214 | 224 | 1,047,911 | 25.07% | 30 m | EPSG:32636 | 49.11 s | 438 |

The total live processing time was approximately 197.66 seconds.

### 7.2 Live Matrix thresholds

The Live Matrix uses scene-relative percentile thresholds derived from the spectral-anomaly score:

| Scene | P50 | P80 | P95 high-priority threshold |
|---|---:|---:|---:|
| Scene 1 | 0.7470 | 1.1317 | 1.8809 |
| Scene 2 | 0.6622 | 1.1688 | 1.7142 |
| Scene 3 | 0.6929 | 1.0800 | 1.6642 |

These are **prioritisation thresholds**. They are not disease thresholds, pest thresholds, biological severity thresholds, or field-validation thresholds.

### 7.3 Benchmark protocol

The frozen benchmark used three real EnMAP scenes, five seeds—11, 22, 33, 44, and 55—and spatially separated train, validation, and test partitions. The evaluation retained frozen test predictions and used validation-only calibration. The primary paired comparison contained 15 scene-by-seed pairs and 20,000 paired bootstrap replicates.

The benchmark target is a scene-local spectral anomaly proxy. It is not an independently labelled disease, pest, field, or agronomic outcome.

### 7.4 Data requirements for future extensions

Future production-grade work should preserve raw spectral vectors or stable references to them, row and column coordinates, projected coordinates, scene and acquisition metadata, split identifiers, group identifiers, model scores, gate scores, and run-level provenance. This information is required for valid novelty, spatial coherence, selective routing, and reproducibility analysis.

## 8. AI/ML Architecture

### 8.1 Six-model benchmark

The final benchmark contains exactly six systems:

| Model | Role |
|---|---|
| HSI-RF | Strong full-spectrum classical reference using Random Forest features. |
| Spectral XGBoost | Spectral gradient-boosting baseline. |
| 48-band XGBoost | Fixed compact-band gradient-boosting baseline. |
| Adaptive Classical | Classical model using compact spectral, derivative, and quality features. |
| Current Hybrid | Earlier classical nonlinear hybrid reference. |
| AgriSpectra-Q | RF-first residual and quantum-inspired hybrid research model. |

### 8.2 Frozen benchmark results

| Model | Mean F1 | SD | Minimum scene F1 | PR-AUC | ROC-AUC | Brier | ECE |
|---|---:|---:|---:|---:|---:|---:|---:|
| AgriSpectra-Q | 0.963985 | 0.018169 | 0.953018 | 0.994732 | 0.998665 | 0.010909 | 0.007262 |
| Adaptive Classical | 0.963396 | 0.019926 | 0.950705 | 0.994684 | 0.998641 | 0.010522 | 0.006568 |
| HSI-RF | 0.963141 | 0.018734 | 0.949300 | 0.994945 | 0.998742 | 0.010811 | 0.007245 |
| 48-band XGBoost | 0.952233 | 0.028703 | 0.931943 | 0.992257 | 0.998001 | 0.012669 | 0.009084 |
| Spectral XGBoost | 0.947784 | 0.028212 | 0.928212 | 0.992399 | 0.998057 | 0.013144 | 0.009276 |
| Current Hybrid | 0.899766 | 0.069913 | 0.821282 | 0.961551 | 0.987517 | 0.027900 | 0.011791 |

AgriSpectra-Q has the highest numerical mean F1 and minimum-scene F1. However, its F1 difference relative to HSI-RF is only +0.0008447. The paired 95% bootstrap confidence interval is [-0.0012054, +0.0026803], which crosses zero. Therefore the system must not be described as statistically superior.

HSI-RF has the strongest PR-AUC and ROC-AUC. Adaptive Classical has the best Brier score and ECE. No artificial composite winner metric should be shown.

### 8.3 AgriSpectra-Q architecture

The current AgriSpectra-Q implementation is an RF-first residual architecture with grouped out-of-fold residual learning, compact spectral intelligence, Mahalanobis-oriented research components, and an adaptive residual gate. Its nonlinear feature map is implemented computationally in a quantum-inspired or hybrid quantum-classical form.

The system should be treated as a research layer around a strong classical reference. The product proposition must remain meaningful if the research layer is later simplified or replaced by a classical feature map.

## 9. Quantum Component

The project contains a hybrid quantum-classical research component. In the current implementation, this means quantum-inspired computational logic and nonlinear feature transformation. There is no quantum hardware result, quantum speedup result, or demonstrated quantum advantage.

The controlled residual-specific evidence did not demonstrate a statistically meaningful gain from the quantum-inspired transformation. The correct product wording is therefore:

> **Quantum-inspired feature transformation within a hybrid quantum-classical research layer.**

The quantum component should be presented as an innovation and research element, not as the sole product value proposition.

## 10. Live Matrix

The Live Matrix is the operational decision-intelligence layer. It reads actual EnMAP GeoTIFF scenes with memory-aware windowed processing and produces georeferenced outputs.

### 10.1 Live Matrix outputs

Each processed scene can contain:

| File | Meaning |
|---|---|
| `risk_map.tif` | Georeferenced spectral-anomaly score raster. |
| `priority_map.tif` | Integer priority-category raster using relative scene thresholds. |
| `zones.csv` | Machine-readable connected-zone table with risk, area, centroid, rank, and recommendation. |
| `zones.geojson` | Georeferenced connected-zone geometries when CRS and transform are available. |
| `spectral_evidence.csv` | Zone-level spectral evidence by band index. |
| `inspection_budget.csv` | Proxy coverage results for selected inspection fractions. |
| `scene_statistics.json` | Dimensions, bands, valid pixels, NoData, CRS, thresholds, zone count, and timing. |
| `metrics.json` | Run-level engine metadata and metric definitions. |
| `manifest.json` | Provenance, source path, run mode, and output list. |

### 10.2 Zone categories

The current categories are relative operational categories:

- **HIGH PRIORITY:** inspect this zone first.
- **MEDIUM PRIORITY:** include this zone in the next inspection cycle.
- **LOW PRIORITY:** continue monitoring.
- **ABSTAIN / HUMAN REVIEW:** use when confidence or evidence is insufficient for automated prioritisation.

The current live implementation extracts connected high-priority zones from the P95 priority mask and removes very small components using a minimum connected-component size. This is an operational screening rule, not a validated biological severity model.

### 10.3 Zone record

A zone card should expose:

```text
Zone ID
Scene
Priority rank
Priority category
Mean risk
Maximum risk
Median risk
Pixel count
Approximate area
Centroid coordinates
High-priority pixel percentage
Threshold type
Spectral evidence status
Recommendation
Caveat: field verification required
```

For example, the current live outputs include top-ranked zones in each scene. The exact values must always be read from the run-specific `zones.csv`; frontend code must not hard-code them.

## 11. Decision Intelligence

Decision Intelligence converts a score into an inspection action. It should not hide the evidence behind a single red or green colour.

The frontend should show, in this order:

1. The decision: “Inspect this zone first.”
2. The visual evidence: map location, priority overlay, and zone extent.
3. The technical evidence: score statistics, uncertainty where available, spectral evidence, and processing provenance.

### 11.1 Inspection budgets

The system supports inspection-budget analysis at fractions such as 5%, 10%, 20%, 30%, 50%, and 100%. The output is labelled **pixel-level proxy inspection coverage**. It must not be described as “percentage of diseased fields detected.”

In the frozen benchmark, at 5% and 10% inspection budgets, HSI-RF and AgriSpectra-Q both achieved approximately 24.49% and 49.19% proxy recall respectively. At 20%, HSI-RF achieved 92.33% and AgriSpectra-Q 92.22%. The current evidence does not demonstrate operational superiority for AgriSpectra-Q.

### 11.2 Recommendation engine

Recommendations must be generated from actual run outputs. Recommended language includes:

- “Inspect this zone first.”
- “Include this zone in the next inspection cycle.”
- “Continue monitoring.”
- “Spectral-stress evidence detected. Prioritise field inspection to determine the underlying cause.”
- “Signal detected, but confidence/evidence is insufficient for high-priority classification.”
- “Field verification required.”

The current system must not recommend pesticide application, fungicide application, irrigation changes, fertiliser changes, or crop removal because the current data do not support those causal decisions.

## 12. Outputs

### 12.1 User-facing outputs

The dashboard should display:

- Scene selector.
- Live or frozen mode badge.
- Risk map.
- Priority map.
- Zone overlays.
- Ranked zone cards.
- Inspection budget selector.
- Spectral evidence panel.
- Scene metadata and quality indicators.
- Processing-time status.
- Download links for CSV, GeoJSON, GeoTIFF, and JSON outputs.
- Clear caveats explaining that the target is a spectral anomaly proxy.

### 12.2 Backend run outputs

Each live run should be stored under a unique run ID, for example:

```text
AGRQ-LIVE-YYYYMMDD-HHMMSS-XXXXXX
```

The run directory should contain the scene-specific files listed in Section 10. The manifest should record timestamp, source scene, mode, thresholds, processing timings, CRS, dimensions, and output paths.

### 12.3 Current completed run

The completed three-scene live run is:

```text
AGRQ-LIVE-20260916-132530-587fc9
```

Its outputs are stored under `results/live_matrix/AGRQ-LIVE-20260916-132530-587fc9/`.

## 13. Current Scientific Evidence

The project has measured evidence for real EnMAP processing, a six-model comparison, spatially separated evaluation, validation-only calibration, paired bootstrap analysis, live georeferenced anomaly zones, and a reproducible output package.

The main predictive result is numerical rather than conclusive: AgriSpectra-Q has mean F1 of 0.963985, slightly above HSI-RF at 0.963141. The confidence interval for the paired difference crosses zero. HSI-RF remains the strongest classical reference for ranking metrics, and Adaptive Classical provides the strongest calibration metrics.

Decision-intelligence analysis also did not establish an operational advantage. AgriSpectra-Q corrected 29 hard-decision RF errors, while RF was correct and Q was wrong on 23 cases. The net correction is +6 cases across the paired frozen test observations. This indicates weak, scene-dependent complementarity, not a general industrial blind-spot detector.

The live Matrix is a separate unsupervised anomaly-prioritisation analysis. It provides actual georeferenced zones, but it does not replace the locked benchmark and does not provide field truth.

## 14. Scientific Boundaries

The system must never be described as detecting confirmed disease, confirmed pests, confirmed infected fields, confirmed biological stress, or field-level diagnosis.

The system must not claim proven financial ROI, statistically significant superiority over HSI-RF, quantum advantage, or field validation.

Correct terminology includes:

- Spectral anomaly.
- Spectral-priority zone.
- Spectral-stress evidence.
- Inspection priority.
- Decision-support signal.
- Field verification required.
- Spectral Anomaly Proxy.

The current live run cannot validate temporal persistence, causal agronomic interpretation, disease identity, pest identity, field-level outcome, or financial return.

## 15. Business Value

The immediate operational value is inspection prioritisation. Instead of inspecting a large area uniformly, an organisation can rank areas according to spectral evidence and allocate a limited inspection budget to the highest-priority candidates.

This is a potential operational value proposition, not a measured financial ROI. Actual business value requires field-team experiments that record area inspected, time spent, travel cost, confirmed findings, false alarms, missed findings, and the value of earlier intervention.

Potential future users include farms, agribusinesses, agricultural consultancies, irrigation operators, government programmes, and Earth Observation analytics providers. The current project does not claim that any of these organisations are customers.

## 16. Current Limitations

The current system has the following limitations:

- The target is a spectral anomaly proxy rather than an independent disease or pest label.
- The live Matrix uses scene-relative thresholds rather than validated biological thresholds.
- Complete field polygons and ground observations are unavailable.
- Temporal persistence is not validated.
- A blind fourth external scene is not available in the current evidence package.
- Raw-input robustness was not completed under the final industrial protocol.
- Exact selective-routing compute savings were not measured on a raw selective pipeline.
- The frozen prediction schema does not retain all pixel coordinates required for a direct unique-correction spatial map.
- Spectral wavelength metadata are not available in the current live evidence artifact; band-level evidence therefore uses band indices where applicable.
- Live Matrix results are not a new independent six-model benchmark and must not be mixed with the frozen benchmark.
- The dashboard prototype is not a production service. The API must be deployed behind a production WSGI server, authentication, logging, resource limits, and monitoring before production use.

## 17. Future Roadmap

### Phase 1: Reproducible raw-input validation

Preserve raw spectra, coordinates, group identifiers, wavelength metadata, and split assignments for every observation. Re-run the selective gate and inspection policy from raw input without using test correctness for tuning.

### Phase 2: External geographic validation

Freeze the full policy on the existing development data, then evaluate a blind fourth EnMAP scene. Do not use the blind scene for feature selection, threshold selection, gate training, or weight optimisation.

### Phase 3: Field validation

Collect field polygons, agronomist observations, and independent stress, disease, or pest labels where appropriate. Continue to report the current target as a spectral anomaly proxy until those labels are available.

### Phase 4: Temporal intelligence

Add aligned multi-date EnMAP or Sentinel-2 observations. Evaluate persistence, first appearance, trend, and temporal anomaly velocity without making temporal claims before alignment and validation are complete.

### Phase 5: Operational pilot

Measure inspection recall per hectare, inspection time, travel cost, false-alarm burden, missed findings, human-review rate, and operator agreement. Use these measurements to estimate relative decision utility and only then assess financial ROI.

### Phase 6: Production deployment

Add cloud-scale storage, asynchronous job execution, authentication, data governance, monitoring, drift detection, model versioning, audit logs, resource quotas, and a documented retraining policy.

## 18. Developer Orientation

### 18.1 Important project files

| Path | Purpose |
|---|---|
| `agrispectra_q_full.py` | Main modular pipeline and model architecture. |
| `live_matrix_engine.py` | Windowed Live Matrix engine for the three local EnMAP GeoTIFF scenes. |
| `live_matrix_api.py` | Flask API that invokes the live Python engine. |
| `results/live_matrix/` | Live run outputs. |
| `results/industrial_validation/` | Frozen benchmark and Decision Intelligence outputs. |
| `results/industrial_validation/dashboard/index.html` | Dashboard prototype with Analysis Lab UI. |
| `results/final_six_benchmark/predictions.json` | Frozen test predictions used for derivative analyses. |
| `AQEC_SAGE_QEC(1).py` | Supplied SAGE-QEC implementation, loaded without source modification. |
| `AgriSpectra-Q_COMPLETE_RESULTS_AND_IMAGES.pdf` | Consolidated human-readable PDF report. |

### 18.2 API orientation

The implemented API exposes these conceptual endpoints:

```text
POST /api/analyse
GET  /api/runs/{run_id}
GET  /api/runs/{run_id}/zones
GET  /api/runs/{run_id}/spectral-evidence
GET  /api/runs/{run_id}/inspection
GET  /api/runs/{run_id}/report
GET  /api/runs/{run_id}/files/{scene}/{filename}
```

`POST /api/analyse` accepts a server-side scene selection such as `scene_01_DT0000205230`, `scene_02`, or `scene_03`. It runs the actual windowed Python analysis and creates a new run ID. The API is a PoC development service and is not a production deployment.

### 18.3 Frontend rules

The frontend must display a visible mode distinction:

```text
LIVE ANALYSIS
FROZEN SCIENTIFIC BENCHMARK
```

It must never merge live anomaly-zone counts with frozen predictive metrics. It must never call a priority zone a diseased field or pest hotspot. All displayed values must come from the selected run or benchmark artifact, not hard-coded examples.

The primary screen should show the top decision and map context. Expert users should be able to expand the technical evidence, data-quality fields, model metrics, and file downloads.

### 18.4 Large-file handling

EnMAP scenes can be large. The backend should use windowed reads, streaming, chunking, and memory-aware operations. The primary PoC workflow should select one of the server-side scenes rather than requiring users to upload a full scene. An AOI or small subset upload can be supported as a secondary workflow after validation. Full-scene upload should be added only if storage and execution limits permit.

## 19. Key Terminology

| Term | Definition |
|---|---|
| EnMAP | Earth Observation hyperspectral satellite data source used by this PoC. |
| Hyperspectral | Imagery containing many narrow spectral bands per pixel. |
| Spectral anomaly | A measured departure from a reference spectral distribution. |
| Spectral Anomaly Proxy | The current target used for model and Live Matrix analysis. |
| Priority zone | A spatially connected area ranked for inspection using operational thresholds. |
| Risk score | A model or anomaly score used for prioritisation; not a disease probability. |
| NoData | Raster pixels that are unavailable or invalid for analysis. |
| CRS | Coordinate Reference System used to georeference raster and vector outputs. |
| Live Analysis | A new execution of the Python Matrix engine on actual source GeoTIFF data. |
| Frozen Benchmark | A previously validated experiment with frozen test predictions and locked comparisons. |
| Selective Risk | Error risk among accepted predictions at a stated coverage; current evidence is not a deployable guarantee. |
| VOI/PVOI | Value of Information or proxy Value of Information; current PVOI is not measured farm economics. |
| HSI-RF | Strong classical hyperspectral Random Forest reference model. |
| AgriSpectra-Q | RF-first hybrid quantum-inspired research model and decision-support layer. |
| SAGE-QEC | Supplied noise-correction model integrated at a fixed boundary without source modification. |

## 20. If You Remember Only Five Things

### 1. The product prioritises inspection; it does not diagnose disease.

AgriSpectra-Q converts real hyperspectral observations into spectral-anomaly evidence and ranked inspection zones. Every zone requires field verification.

### 2. The system has two different modes.

Live Matrix runs directly on real EnMAP GeoTIFF scenes and creates georeferenced operational outputs. The Frozen Scientific Benchmark contains the controlled six-model comparison. The two modes must remain visually and scientifically separate.

### 3. HSI-RF remains the strongest classical reference.

AgriSpectra-Q has the highest numerical mean F1, but its advantage over HSI-RF is extremely small and not statistically established. Do not present it as a proven superior model.

### 4. The quantum component is research-oriented.

Use “quantum-inspired feature transformation” or “hybrid quantum-classical research layer.” Do not claim quantum hardware advantage, speedup, or superiority.

### 5. The operational workflow is simple.

```text
DETECT → PRIORITISE → INSPECT → VERIFY
```

Show the decision first, the visual evidence second, and the specialised technical data third.
