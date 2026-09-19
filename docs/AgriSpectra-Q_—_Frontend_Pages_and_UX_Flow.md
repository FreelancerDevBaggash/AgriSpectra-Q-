# AgriSpectra-Q — Frontend Pages and UX Flow

**Document type:** Frontend architecture, information architecture, geospatial dashboard, and UX implementation blueprint  
**Audience:** Frontend developers, product designers, geospatial UI engineers, backend integrators, and scientific visualisation specialists  
**Project status:** Industrial-oriented proof of concept

## 1. Product Experience

AgriSpectra-Q must feel like a serious industrial geospatial-intelligence platform. It must not feel like a university research webpage or a page of disconnected scientific tables.

The website must communicate decisions visually:

```text
DECISION
  → MAP
  → PRIORITY ZONE
  → WHY FLAGGED?
  → SPECTRAL EVIDENCE
  → TECHNICAL DETAILS
```

The first screen should answer the operational question quickly:

> **Where should I inspect first?**

The next layer should answer:

> **Why did the system flag this area?**

The product target is a **Spectral Anomaly Proxy**. The frontend must not describe a spectral-priority zone as confirmed disease, an infected field, or a pest hotspot.

## 2. Main Navigation

The primary navigation is:

```text
Home
Project
Intelligence
Results
Technology
Team
```

The primary call to action is:

```text
RUN LIVE ANALYSIS
```

The navigation should remain visible on desktop and collapse into a compact accessible menu on smaller screens. The current page should always expose whether the user is viewing a new live run or a read-only frozen benchmark.

## 3. Global UX Rules

### 3.1 Decision-first hierarchy

Every result view must follow this order:

1. **Decision:** What should the user do?
2. **Map:** Where is the relevant location?
3. **Priority zone:** Which spatial unit is ranked?
4. **Why flagged:** What caused the prioritisation?
5. **Spectral evidence:** What signal is available?
6. **Technical details:** What engine, metric, threshold, and metadata support it?

The frontend must not make the user read F1, ROC-AUC, Brier, or ECE values before seeing a map and ranked inspection candidate.

### 3.2 Live and frozen mode badges

Every experiment and results view must show one of:

```text
LIVE ANALYSIS
```

or:

```text
FROZEN SCIENTIFIC BENCHMARK
```

`LIVE ANALYSIS` means that the backend executed the Python Live Matrix engine against an actual supported EnMAP scene. `FROZEN SCIENTIFIC BENCHMARK` means previously generated scientific reference results.

The frontend must never merge a live zone count with frozen benchmark metrics without explicit labels.

### 3.3 Scientific language

Use:

- Spectral anomaly.
- Spectral-priority zone.
- Inspection priority.
- Spectral evidence.
- Field verification required.
- Decision-support signal.
- Proxy recall.
- Pixel-level proxy analysis.

Do not use:

- Disease detected.
- Infected field.
- Pest detected.
- Confirmed crop disease.
- Biological diagnosis.
- Proven ROI.
- Quantum advantage.

## 4. Ideal User Journey

The ideal journey is:

1. Land on Home.
2. Understand the problem in less than 10 seconds.
3. Click `RUN LIVE ANALYSIS`.
4. Select a real EnMAP scene.
5. Run actual analysis.
6. See the generated map.
7. Click a high-priority zone.
8. See why it was flagged.
9. See available spectral evidence.
10. See the inspection recommendation.
11. Explore the frozen model benchmark.
12. Review scientific limitations.
13. Download the actual result files.

The journey should remain understandable on mobile and should not require a user to understand the model architecture before reaching the decision.

## 5. Current Data and Integration Boundary

### 5.1 Current live inputs

The Live Matrix uses real server-side EnMAP GeoTIFF scenes. The current processed scenes contain 224 bands and approximately 30 m spatial resolution. The scenes are georeferenced and contain NoData values.

The currently supported server-side scene identifiers are:

```text
scene_01_DT0000205230
scene_02
scene_03
```

The frontend must populate scene metadata from the backend or actual generated files. It must not invent dimensions, CRS, valid-pixel counts, or processing times.

### 5.2 Current live outputs

The frontend may consume these files when they exist in the selected run:

```text
risk_map.tif
priority_map.tif
zones.csv
zones.geojson
spectral_evidence.csv
inspection_budget.csv
scene_statistics.json
metrics.json
manifest.json
```

The backend must expose actual generated files. A download control should be disabled or labelled unavailable when the corresponding artifact does not exist.

### 5.3 Current API boundary

The verified live endpoint is:

```text
POST /api/analyse
```

It accepts a supported scene selection and executes the real Python Live Matrix engine. The current API also exposes run and artifact routes described in the backend specification. Model selection, arbitrary uploads, and a fully asynchronous experiment registry are not verified as current live API features. The frontend must not display these controls as active unless the backend implements them.

## 6. Page 1 — Home

### Purpose

Explain the product in one glance and move the user toward a real live analysis.

### User

All users, including first-time stakeholders, inspection operators, scientists, and technical reviewers.

### Key question

What is AgriSpectra-Q and what can I do next?

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ AgriSpectra-Q   Home  Project  Intelligence  Results         │
│                 Technology  Team                             │
├──────────────────────────────────────────────────────────────┤
│ Hyperspectral Crop Intelligence for Earlier, Smarter         │
│ Field Inspection                                             │
│                                                              │
│ Transform real hyperspectral observations into               │
│ georeferenced spectral-priority zones and inspection         │
│ intelligence.                                                 │
│                                                              │
│ [ RUN LIVE ANALYSIS ]       [ EXPLORE RESULTS ]              │
├──────────────────────────────┬───────────────────────────────┤
│ DETECT → PRIORITISE          │ Actual project map or         │
│ → INSPECT → VERIFY           │ approved result visual        │
├──────────────────────────────┴───────────────────────────────┤
│ Real EnMAP data │ Geospatial outputs │ Evidence-led action   │
└──────────────────────────────────────────────────────────────┘
```

### Components

- Product logo and navigation.
- Hero heading.
- One-sentence product positioning.
- `RUN LIVE ANALYSIS` primary CTA.
- `EXPLORE RESULTS` secondary CTA.
- Actual project map or approved geospatial image where available.
- Four-stage workflow strip.
- Scientific boundary statement.

### Data source

Static product copy plus an approved actual project map or result image. Do not use generic AI stock imagery or fabricated map screenshots.

### Interactions

- Primary CTA opens Intelligence.
- Secondary CTA opens Results.
- Map preview opens the selected result view only if it is clearly labelled as a frozen demonstration or project example.

### Backend endpoint needed

No endpoint is required for the initial static Home view. If the hero preview is dynamic, it must use a real artifact route and display its mode label.

### Empty state

```text
Project visual preview unavailable.
Explore a live scene to generate a real map.
```

### Loading state

Use a lightweight skeleton only for a dynamic preview. Do not show a fake map loading into a fabricated result.

### Error state

```text
Project preview unavailable.
The live analysis remains available from Intelligence.
```

### Scientific wording

```text
AgriSpectra-Q prioritises spectral-anomaly candidates for field inspection.
It does not diagnose disease or pests.
```

### Mobile layout

Stack the hero copy, CTAs, workflow strip, and map preview vertically. Keep `RUN LIVE ANALYSIS` full width and visible without scrolling through technical material.

## 7. Page 2 — Project

### Purpose

Explain the problem, solution, data, workflow, users, potential impact, and limitations.

### User

Stakeholders, product reviewers, scientific users, potential operators, and developers who need project context before using the dashboard.

### Key question

Why does this product exist, and what does it claim?

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Project                                                        │
├──────────────────────────────────────────────────────────────┤
│ THE PROBLEM                                                   │
│ Large areas are expensive to inspect uniformly.               │
├──────────────────────┬──────────────────────┬────────────────┤
│ WHY HYPERSPECTRAL?   │ WHY ENMAP?           │ WHO USES IT?   │
│ Many narrow bands    │ Real EO source       │ Inspection and  │
│ expose spectral      │ used by this PoC     │ geospatial teams│
├──────────────────────┴──────────────────────┴────────────────┤
│ DETECT → PRIORITISE → INSPECT → VERIFY                       │
├──────────────────────────────────────────────────────────────┤
│ LIMITATIONS AND FIELD-VERIFICATION BOUNDARY                  │
└──────────────────────────────────────────────────────────────┘
```

### Components

- Problem statement.
- Solution statement.
- Why hyperspectral data.
- Why real EnMAP data.
- Workflow timeline.
- Intended users.
- Potential operational value.
- Limitations card.
- Scientific boundary card.

### Data source

Project overview and current scientific results. Display only verified facts: three real EnMAP scenes, 224 processed bands, spatially separated evaluation, five seeds in the frozen benchmark, and the absence of field validation.

### Interactions

- Expand workflow stages.
- Open the Intelligence page.
- Open Research & Validation.
- Open Technology for architecture details.

### Backend endpoint needed

No endpoint is required for static project content. If scene statistics are shown dynamically, use the scene metadata endpoint or selected run artifacts.

### Empty state

```text
Project metadata are unavailable.
Use the documented project files for the current verified scope.
```

### Loading state

Static content should not require a loading screen. Dynamic scene cards may use skeleton placeholders.

### Error state

```text
Project data could not be loaded.
The product description remains available, but dynamic evidence is unavailable.
```

### Scientific wording

Use:

```text
The platform transforms hyperspectral observations into spectral-priority candidates for inspection.
Field verification is required.
```

Do not write that the platform detects disease or pests.

### Mobile layout

Use stacked content cards. Keep the workflow and limitations near the top rather than placing them after a long technical description.

## 8. Page 3 — Intelligence / Live Analysis

### Purpose

Provide the core interactive entry point for a real backend execution.

### User

Inspection operators, analysts, scientists, and demo reviewers who need to run a supported EnMAP analysis.

### Key question

Can I run a real analysis on a supported scene now?

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Intelligence                                      LIVE       │
│                                                   ANALYSIS    │
├──────────────────────────────────────────────────────────────┤
│ Scene selector                                               │
│ [ Scene 03 ▼ ]                                               │
│                                                              │
│ Analysis                                                     │
│ [ Spectral Priority / Live Matrix ▼ ]                        │
│                                                              │
│ Model                                                        │
│ [ Current supported engine ▼ ]                               │
│                                                              │
│ [ RUN LIVE ANALYSIS ]                                        │
├──────────────────────────────────────────────────────────────┤
│ Scene metadata preview                                       │
│ Dimensions │ Bands │ Resolution │ CRS │ Valid pixels         │
└──────────────────────────────────────────────────────────────┘
```

### Important control rule

The current backend verifies server-side scene selection and the Live Matrix analysis. It does not verify arbitrary model selection through the current `/api/analyse` request. Therefore, a model selector must be either:

- A disabled or informational control showing the current supported engine, or
- Enabled only after the backend accepts and records the selected model.

The same rule applies to arbitrary parameters, optional seeds, and uploads.

### Components

- Scene selector.
- Analysis selector.
- Model or engine label.
- Run button.
- Data-quality preview.
- Mode badge.
- Input caveat.
- Run history link if implemented.

### Data source

Actual server-side scene catalog or a controlled list populated from the backend. The selected scene’s metadata should come from actual GeoTIFF metadata or a verified catalog response.

### Interactions

- Select a real scene.
- Review dimensions, bands, resolution, CRS, and valid-pixel availability.
- Start the live run.
- Disable duplicate submission.
- Transition to Processing.
- Preserve the run ID after creation.

### Backend endpoint needed

Current:

```text
POST /api/analyse
```

Recommended future endpoints:

```text
GET /api/scenes
POST /api/experiments/run
GET /api/experiments/{id}
```

Future routes must be labelled as proposed until implemented.

### Empty state

```text
No supported EnMAP scenes are available.
Live analysis cannot start until a real scene is available.
```

### Loading state

```text
Loading supported EnMAP scenes…
```

Do not display a scene as selectable when its source file is unavailable.

### Error state

```text
The scene catalog could not be loaded.
No live run was started.
```

### Scientific wording

```text
Run a real spectral-anomaly prioritisation analysis.
The result is a decision-support signal and requires field verification.
```

### Mobile layout

Use a single-column form with full-width controls. Keep the run button sticky or immediately visible. Show scene metadata in stacked cards.

## 9. Page 4 — Processing State

Although Processing is part of the Intelligence flow, it must have a dedicated state and route or modal state so the user can see that the backend is doing real work.

### Purpose

Communicate actual execution without fake progress.

### User

Any user waiting for a live run to complete.

### Key question

Is the engine running, and what is happening now?

### Wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ LIVE ANALYSIS                                                │
├──────────────────────────────────────────────────────────────┤
│ Analysing hyperspectral scene…                               │
│                                                              │
│ [ indeterminate progress indicator ]                         │
│                                                              │
│ Run ID: [actual]
│ Scene: [actual]
│ Status: RUNNING                                              │
│                                                              │
│ Reading valid spectral pixels                                │
│ Calculating anomaly and priority information                 │
│ Extracting high-priority zones                               │
│ Writing geospatial outputs                                   │
└──────────────────────────────────────────────────────────────┘
```

### Components

- Run ID.
- Scene ID.
- Status.
- Actual stage message where available.
- Indeterminate progress when no measured percentage exists.
- Cancel or leave-page warning only if supported.

### Data source

API response and actual subprocess status. The frontend must not infer completion from elapsed time.

### Interactions

- Poll a verified status endpoint if available.
- For the current synchronous endpoint, wait for the actual response.
- Navigate to results only after output validation.
- Show actual failure details when the engine fails.

### Backend endpoint needed

Current synchronous path:

```text
POST /api/analyse
```

Future asynchronous path:

```text
POST /api/experiments/run
GET /api/experiments/{id}
```

### Empty state

Not applicable while a run is active. If no run ID exists, return the user to Intelligence.

### Loading state

The processing state itself is the loading state. It must be truthful and must not contain a fabricated percentage.

### Error state

```text
LIVE ANALYSIS FAILED
The engine did not produce a valid result.
[VIEW ACTUAL ERROR] [RETURN TO INTELLIGENCE]
```

### Scientific wording

```text
The engine is computing a spectral-anomaly prioritisation signal from real EnMAP data.
```

## 10. Page 5 — Decision Dashboard

### Purpose

Provide the strongest visual page and answer “Where should I inspect first?” immediately.

### User

Field operators, inspection coordinators, analysts, and decision-makers.

### Key question

Which zone should receive the first inspection, and why?

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Results / Decision Dashboard     [LIVE ANALYSIS]             │
├──────────────────────────────────────────────────────────────┤
│ WHERE SHOULD I INSPECT FIRST?                                │
│                                                              │
│ High-priority zones: [actual]                                │
│ Top inspection focus: Zone [actual]                          │
│ Valid-pixel coverage: [actual]                               │
│ Processing time: [actual]                                    │
├──────────────────────────────────┬───────────────────────────┤
│                                  │ RANKED ZONES              │
│          INTERACTIVE MAP         │ 1  Zone [actual]          │
│          Risk / priority layers │    HIGH PRIORITY          │
│          Zone overlays          │    INSPECT FIRST           │
│                                  │ 2  Zone [actual]          │
│                                  │ 3  Zone [actual]          │
├──────────────────────────────────┴───────────────────────────┤
│ WHY WAS THIS ZONE FLAGGED?                                   │
│ Evidence │ Recommendation │ Technical details                │
├──────────────────────────────────────────────────────────────┤
│ INSPECTION BUDGET                                             │
└──────────────────────────────────────────────────────────────┘
```

### Components

- Overall decision summary.
- Interactive risk and priority map.
- High-priority zone count.
- Ranked zone list.
- Selected-zone card.
- Why-flagged evidence panel.
- Inspection-budget chart.
- Download controls.
- Run metadata drawer.

### Data source

- `risk_map.tif` for continuous map values.
- `priority_map.tif` for categorical priority.
- `zones.geojson` for zone geometry.
- `zones.csv` for ranking and zone statistics.
- `scene_statistics.json` for scene metadata and processing time.
- `manifest.json` for run completeness.
- `inspection_budget.csv` for budget analysis.

### Interactions

- Zoom and pan.
- Toggle risk, priority, zone, and NoData layers.
- Click a zone.
- Highlight the selected zone.
- Dim unrelated zones.
- Zoom the map to the selected zone.
- Open evidence.
- Open the recommendation.
- Download actual files.

### Backend endpoint needed

Current artifact routes:

```text
GET /api/runs/{run_id}
GET /api/runs/{run_id}/zones
GET /api/runs/{run_id}/spectral-evidence
GET /api/runs/{run_id}/inspection
GET /api/runs/{run_id}/files/{scene}/{filename}
```

A structured results endpoint is proposed:

```text
GET /api/results/{id}
```

### Empty state

```text
No high-priority spectral zones were generated for this run.
This does not indicate biological health. It means that no connected region crossed the configured relative threshold.
```

### Loading state

```text
Loading geospatial outputs and ranked zones…
```

Render the decision summary only after the actual metadata are available.

### Error state

```text
The decision dashboard could not load a complete result.
One or more required artifacts are missing or invalid.
```

### Scientific wording

```text
High-priority spectral zones
Inspect first
Spectral anomaly prioritisation
Field verification required
```

Do not use `diseased areas`, `pest hotspots`, or `healthy areas`.

### Mobile layout

Use this order:

1. Decision summary.
2. Top-ranked zone card.
3. Full-screen map.
4. Ranked zone list.
5. Why flagged.
6. Evidence.
7. Technical details.
8. Downloads.

## 11. Page 6 — Why Flagged? / Spectral Evidence

### Purpose

Provide a dedicated evidence view that explains the selected zone without claiming a causal diagnosis.

### User

Scientists, agronomists, analysts, and operators who need to understand why a zone was prioritised.

### Key question

What spectral evidence supports this priority?

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ WHY WAS THIS ZONE FLAGGED?                                   │
│ Zone: [actual]       Rank: #[actual]                         │
├──────────────────────────────┬───────────────────────────────┤
│ SPECTRAL SIGNATURE            │ EVIDENCE SUMMARY              │
│ Observed / reference if      │ Mean risk                      │
│ available                    │ Threshold type                 │
│                              │ Wavelength status               │
├──────────────────────────────┴───────────────────────────────┤
│ Band-level evidence table                                   │
│ Band index │ Observed mean │ Reference │ Deviation status    │
├──────────────────────────────────────────────────────────────┤
│ Interpretation: spectral-priority candidate                  │
│ Field verification required                                  │
└──────────────────────────────────────────────────────────────┘
```

### Components

- Zone identity.
- Rank and priority category.
- Spectral signature chart when supported by actual data.
- Wavelength axis only when verified wavelength metadata exist.
- Observed spectrum.
- Reference spectrum where available.
- Deviation indicators where available.
- Anomaly magnitude.
- Evidence table.
- Interpretation and caveat.

### Data source

`spectral_evidence.csv`, selected zone record from `zones.csv`, and actual run metadata.

The current live evidence artifact contains band index, observed mean, reference mean for the 32-band representation where available, and wavelength status. Physical wavelengths are not verified in the current artifact.

### Interactions

- Change selected zone.
- Hover a band or chart point.
- Expand technical evidence.
- Return to the map.
- Download evidence CSV.

### Backend endpoint needed

Current:

```text
GET /api/runs/{run_id}/spectral-evidence
GET /api/runs/{run_id}/files/{scene}/spectral_evidence.csv
```

Proposed parsed route:

```text
GET /api/results/{id}/evidence
```

### Empty state

```text
Spectral evidence is unavailable for this zone.
No physical wavelength or band-level evidence should be inferred.
```

### Loading state

```text
Loading evidence for Zone [actual ID]…
```

### Error state

```text
Evidence could not be loaded.
The zone remains a priority candidate, but technical evidence is unavailable in this view.
```

### Scientific wording

```text
Spectral evidence available for this priority candidate.
The underlying cause is not determined by the current analysis.
Field verification required.
```

### Mobile layout

Show the zone summary first, then a horizontally scrollable evidence table or a compact evidence card. Allow the chart to expand full-screen. Do not hide the caveat below a long table.

## 12. Page 7 — Results

### Purpose

Provide a complete run-oriented view of scenes, maps, zones, priorities, and downloadable outputs.

### User

Analysts, technical reviewers, operators, and users who need to revisit or export a completed run.

### Key question

What did this run produce, and which artifacts can I download?

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Results             [LIVE ANALYSIS / FROZEN BENCHMARK]        │
├──────────────────────────────────────────────────────────────┤
│ Run ID │ Scene │ Status │ Time │ Mode                        │
├──────────────────────────────────────────────────────────────┤
│ Map outputs                                                  │
│ [Risk map] [Priority map] [Zone overlay]                    │
├──────────────────────────────────────────────────────────────┤
│ Ranked zones and inspection priorities                       │
├──────────────────────────────────────────────────────────────┤
│ Download actual outputs                                      │
│ GeoJSON │ CSV │ Raster │ Report                              │
└──────────────────────────────────────────────────────────────┘
```

### Components

- Run summary.
- Scene selector for multi-scene runs.
- Map previews.
- Zone table.
- Inspection-priority table.
- Evidence access.
- Artifact download list.
- Manifest and technical metadata.

### Data source

`run_summary.json`, `scene_statistics.json`, `manifest.json`, and generated artifacts.

### Interactions

- Switch scenes.
- Open the Decision Dashboard.
- Download GeoJSON only if `zones.geojson` exists.
- Download CSV only if the selected CSV exists.
- Download rasters only if valid GeoTIFF outputs exist.
- Download a report only where the backend actually provides one.

### Backend endpoint needed

Current run and file routes. A structured results endpoint is proposed.

### Empty state

```text
No completed runs are available.
Run a supported EnMAP analysis from Intelligence.
```

### Loading state

```text
Loading run artifacts…
```

### Error state

```text
This run is incomplete.
The manifest or one or more required artifacts could not be validated.
```

### Scientific wording

```text
Actual outputs from the selected run
Spectral-anomaly prioritisation products
Field verification required
```

### Mobile layout

Use a run-summary card followed by collapsible artifact groups. Keep map and top-zone access above the full file table.

## 13. Page 8 — Technology

### Purpose

Explain the system architecture and the role of each computational layer without overstating the quantum component.

### User

Technical stakeholders, developers, scientific reviewers, and architecture evaluators.

### Key question

How does the system transform EnMAP data into decision support?

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Technology                                                   │
├──────────────────────────────────────────────────────────────┤
│ EnMAP                                                        │
│   ↓                                                          │
│ Spectral Engine                                              │
│   ↓                                                          │
│ Noise-Correction Integration                                 │
│   ↓                                                          │
│ AI / Model Processing                                        │
│   ↓                                                          │
│ Hybrid Quantum-Classical Research Layer                      │
│   ↓                                                          │
│ Live Matrix                                                  │
│   ↓                                                          │
│ Decision Intelligence                                        │
├──────────────────────────────────────────────────────────────┤
│ Current implementation │ Future production architecture      │
└──────────────────────────────────────────────────────────────┘
```

### Components

- Architecture diagram.
- Data flow explanation.
- Windowed raster processing explanation.
- Geospatial output explanation.
- Noise-correction boundary.
- Quantum-inspired research layer.
- Live Matrix explanation.
- Current versus future architecture comparison.

### Data source

`01_PROJECT_OVERVIEW.md`, `02_SYSTEM_ARCHITECTURE.md`, `04_DATA_AND_FILE_SCHEMA.md`, and actual source files.

### Interactions

- Expand a layer.
- Open data schema.
- Open API specification.
- Show current or future badge.

### Backend endpoint needed

No endpoint is required for static architecture content. Dynamic engine status must come from actual backend health or run data.

### Empty state

```text
Technical detail unavailable.
The scientific engine remains the source of truth.
```

### Loading state

Not required for static content. Use a skeleton only for dynamic health information.

### Error state

```text
Architecture status could not be loaded.
Static technical documentation remains available.
```

### Scientific wording

Use:

```text
Quantum-inspired hybrid computational research layer
```

Do not use `quantum advantage`, `quantum supremacy`, or `quantum speedup`.

### Mobile layout

Use a vertical architecture timeline with expandable cards. Avoid forcing the full diagram into a tiny horizontal canvas.

## 14. Page 9 — Model Comparison

### Purpose

Present the frozen six-model benchmark as a scientific reference.

### User

Scientists, ML reviewers, technical stakeholders, and decision-makers who need comparative context.

### Key question

How did the candidate compare with the selected baselines under the frozen protocol?

### Mandatory label

```text
FROZEN SCIENTIFIC BENCHMARK
```

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Model Comparison             FROZEN SCIENTIFIC BENCHMARK      │
├──────────────────────────────────────────────────────────────┤
│ Mean F1 chart                                                │
├──────────────────────────────────────────────────────────────┤
│ Model       F1       PR-AUC   ROC-AUC   Brier   ECE           │
│ HSI-RF      ...      ...      ...       ...     ...           │
│ ...                                                          │
├──────────────────────────────────────────────────────────────┤
│ Interpretation and paired-bootstrap limitation               │
└──────────────────────────────────────────────────────────────┘
```

### Components

- Six-model comparison chart.
- Metric table.
- Mode badge.
- Statistical interpretation card.
- Link to Research & Validation.

### Models

- HSI-RF.
- Spectral XGBoost.
- 48-band XGBoost.
- Adaptive Classical.
- Current Hybrid.
- AgriSpectra-Q.

### Data source

Frozen benchmark artifacts such as `final_6_model_benchmark.csv`, `main_metrics.csv`, and the paired bootstrap JSON. Use the verified artifact selected by the backend or static benchmark data package.

### Interactions

- Sort by metric.
- Open model details where supported.
- Open statistical comparison.
- Download benchmark table.

### Backend endpoint needed

Proposed read-only route:

```text
GET /api/benchmark/frozen
```

Do not expose it as a live experiment endpoint.

### Empty state

```text
Frozen benchmark data are unavailable.
No comparative claim should be displayed.
```

### Loading state

```text
Loading frozen benchmark reference…
```

### Error state

```text
The benchmark reference could not be loaded.
This does not affect a separate live analysis.
```

### Scientific wording

Use:

```text
AgriSpectra-Q has the highest numerical mean F1 in the final benchmark.
Statistical superiority over HSI-RF was not established.
```

### Mobile layout

Use metric cards for the selected model and horizontally scrollable comparison tables for expert users. Keep the statistical limitation above the full table.

## 15. Page 10 — Research & Validation

### Purpose

Expose the scientific protocol, validation evidence, and current limitations.

### User

Scientists, ML evaluators, technical reviewers, and advanced stakeholders.

### Key question

What evidence supports the current PoC, and what remains unvalidated?

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Research & Validation                                       │
├──────────────────────────────────────────────────────────────┤
│ Evidence summary                                             │
│ 3 EnMAP scenes │ 224 bands │ 5 seeds │ spatial evaluation    │
├──────────────────────────────────────────────────────────────┤
│ Six-model benchmark │ paired bootstrap │ calibration         │
│ error analysis │ decision intelligence                       │
├──────────────────────────────────────────────────────────────┤
│ Limitations                                                   │
│ no field validation │ no field labels │ no blind fourth scene │
│ no complete six-model LOSO │ no quantum advantage │ no ROI    │
└──────────────────────────────────────────────────────────────┘
```

### Components

- Dataset summary.
- Three-scene overview.
- 224-band statement.
- Spatial evaluation statement.
- Five-seed statement.
- Six-model benchmark.
- Paired bootstrap.
- Calibration metrics.
- Error analysis.
- Decision-intelligence results.
- Limitations panel.

### Data source

Frozen scientific benchmark manifests, metrics CSVs, paired bootstrap JSON, calibration files, error analysis, and industrial validation report.

### Interactions

- Expand protocol details.
- View metric charts.
- Open limitations.
- Download scientific tables.

### Backend endpoint needed

A read-only benchmark and validation route is proposed. Static local artifacts may be used when clearly labelled as frozen reference data.

### Empty state

```text
Validation evidence is unavailable.
Do not display unsupported model or generalisation claims.
```

### Loading state

```text
Loading validation artifacts…
```

### Error state

```text
Some validation artifacts could not be loaded.
The unavailable evidence has been excluded from the current view.
```

### Scientific wording

The page must state:

```text
The current PoC has no field validation, no field-labelled disease/pest target,
no blind fourth scene, no complete six-model LOSO evaluation, no proven quantum
advantage, and no measured financial ROI.
```

### Mobile layout

Use collapsible evidence sections. Put the limitations panel near the top rather than after all charts.

## 16. Page 11 — Team

### Purpose

Present only verified team information and role context.

### User

Stakeholders, reviewers, collaborators, and prospective project users.

### Key question

Who is responsible for the project and which roles are represented?

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Team                                                         │
├──────────────────────────────────────────────────────────────┤
│ Asia Alhammadi                                               │
│ Team leader / project creator                                 │
│                                                              │
│ Verified project roles                                       │
│ Hyperspectral science │ Geospatial AI │ ML │ Product         │
├──────────────────────────────────────────────────────────────┤
│ Future collaboration and field-validation roles               │
└──────────────────────────────────────────────────────────────┘
```

### Components

- Asia Alhammadi.
- Verified role: team leader / project creator.
- Role-based capability cards.
- Clearly labelled future or unfilled roles.

### Data source

Project materials supplied in the current workspace. Do not invent biographies, credentials, affiliations, customers, or team members.

### Interactions

- Open project overview.
- Open contact or collaboration route only if implemented and verified.

### Backend endpoint needed

No endpoint required for verified static role information.

### Empty state

```text
Additional team information is not available in the verified project materials.
```

### Loading state

Not required for static verified content.

### Error state

```text
Team information could not be loaded.
Only verified role information may be displayed.
```

### Scientific wording

Do not imply field validation or commercial deployment through team copy.

### Mobile layout

Use a single-column role card. Keep placeholders explicitly labelled as placeholders.

## 17. Page 12 — Reports / Export

The required navigation lists Results as a main item. Reports and Export should be available from Results or as a clearly linked subview.

### Purpose

Allow the user to download actual files produced by a selected run.

### User

Operators, analysts, reviewers, and developers who need reproducible artifacts.

### Key question

Which actual files did this run produce?

### Components

```text
Run identity
Scene identity
Mode badge

Maps
  risk_map.tif
  priority_map.tif

Zones
  zones.geojson
  zones.csv

Evidence
  spectral_evidence.csv

Inspection
  inspection_budget.csv

Metadata
  scene_statistics.json
  metrics.json
  manifest.json

Report
  only if the backend actually provides it
```

### Data source

Actual artifact routes and manifest.

### Interactions

- Download an artifact.
- Show unavailable status for a missing artifact.
- Copy run ID.
- Open the selected artifact in its relevant viewer.

### Backend endpoint needed

```text
GET /api/runs/{run_id}/files/{scene}/{filename}
```

### Empty state

```text
No downloadable artifacts are available for this run.
```

### Loading state

```text
Checking generated artifacts…
```

### Error state

```text
The requested artifact is unavailable or failed integrity checks.
```

### Scientific wording

```text
Actual generated output
Frozen reference output
Unavailable in this run
```

The interface must never create a download link to a fabricated or missing file.

## 18. Map Interaction Specification

### 18.1 Required functions

The map must support:

- Zoom.
- Pan.
- Layer control.
- Zone selection.
- Hover.
- Tooltip.
- Legend.
- NoData masking.
- Selected-zone state.
- CRS-aware rendering.
- Optional satellite or base map context where appropriate.

### 18.2 Layer stack

Recommended layer order:

```text
Base map, if available
Risk map
Priority map
Zone boundaries
Selected zone
NoData mask
```

### 18.3 Zone interaction

The required interaction is:

```text
click → highlight → evidence panel
```

When a zone is selected:

1. Highlight its GeoJSON geometry.
2. Zoom the map to its bounds.
3. Dim unrelated zones.
4. Show the exact `zone_id`.
5. Load the corresponding `zones.csv` record.
6. Load the corresponding `spectral_evidence.csv` rows.
7. Show the recommendation.
8. Show `Field verification required`.

### 18.4 Tooltip

Use actual values:

```text
Zone: [actual zone ID]
Rank: #[actual]
Priority: HIGH PRIORITY
Area: [actual approximate area]
Score: [actual risk statistic]
Action: INSPECT FIRST
```

Do not label the value as disease probability or pest probability.

## 19. Zone Card Specification

```text
HIGH PRIORITY
INSPECT FIRST

Zone ID: [actual]
Priority rank: #[actual]
Priority score: [actual score]
Area: [actual approximate area]
Evidence: [actual evidence status]
Recommended action: Prioritise field inspection.
Caveat: Field verification required.
```

Confidence may be displayed only if the selected artifact includes a confidence field with a documented meaning. Otherwise show:

```text
Confidence: Not available in this run
```

## 20. Inspection Budget Component

The Decision Dashboard may include an inspection-budget component using actual `inspection_budget.csv` data.

### Display

- Budget selector: 5%, 10%, 20%, 30%, 50%.
- Proxy recall curve.
- Selected-pixel count.
- Valid-pixel count.
- Proxy coverage label.
- Selected-zone or selected-pixel map overlay where supported.

### Scientific label

```text
Pixel-level proxy inspection coverage
```

Do not label the chart `disease recall`, `pest recall`, or `field inspection accuracy`.

If data are unavailable for the selected run, disable the chart and state that the analysis is unavailable.

## 21. Technical Details Drawer

Technical details should be expandable rather than dominant.

Show:

- Scene dimensions.
- Band count.
- Resolution.
- CRS.
- Valid pixels.
- NoData percentage.
- Thresholds.
- Engine name.
- Processing time.
- Run ID.
- Output list.
- Mode.
- Limitations.

The drawer should explain P50, P80, and P95 as relative spectral prioritisation thresholds. It must not call them disease or pest thresholds.

## 22. Technology Architecture View

The technology page should show:

```text
EnMAP
  → Spectral Engine
  → Noise-Correction Integration
  → AI
  → Hybrid Quantum-Classical Research Layer
  → Live Matrix
  → Decision Intelligence
```

The wording for the quantum layer must remain honest:

```text
Quantum-inspired hybrid computational research layer.
Quantum advantage has not been established.
```

The frontend must not imply that quantum hardware executed the current pipeline unless such execution is explicitly verified.

## 23. Loading, Empty, and Error States

### 23.1 Loading

Use truthful stage messages:

```text
Loading scene metadata…
Analysing hyperspectral scene…
Reading valid spectral pixels…
Calculating spectral anomaly evidence…
Extracting priority zones…
Loading generated map and evidence files…
```

Do not show fabricated progress percentages.

### 23.2 No scenes

```text
No supported real EnMAP scenes are available.
Live analysis is disabled until a valid scene is available.
```

### 23.3 No zones

```text
No high-priority spectral zones were generated.
This is not a biological health determination.
```

### 23.4 No evidence

```text
Evidence is unavailable for this zone in the selected run.
Do not infer a causal explanation from the priority score alone.
```

### 23.5 Backend unavailable

```text
LIVE ANALYSIS UNAVAILABLE

The backend is not reachable. No new computation was executed.
You may view a clearly labelled frozen result if one is available.
```

### 23.6 Frozen fallback

Use exactly:

```text
FROZEN DEMONSTRATION RESULT
```

Add:

```text
This view displays a previously generated result for demonstration only.
It is not a new live analysis.
```

## 24. Mobile UX

The core result must remain understandable on mobile.

### Mobile result order

```text
Decision summary
→ Top zone card
→ Map
→ Ranked zones
→ Why flagged?
→ Spectral evidence
→ Technical details
→ Downloads
```

### Mobile interaction rules

- Use touch-friendly buttons.
- Support full-screen map expansion.
- Avoid hover-only information.
- Provide accessible tooltips or tap details.
- Keep the selected-zone state visible.
- Use collapsible technical panels.
- Avoid wide scientific tables on the first screen.
- Ensure the `RUN LIVE ANALYSIS` CTA remains easy to reach.

## 25. Visual Design Principles

The visual design should use:

- A clean professional background.
- Scientific but modern typography.
- High-quality geospatial visuals.
- Minimal clutter.
- Strong information hierarchy.
- Restrained colour usage.
- Maps as major visual elements.
- Cards, charts, evidence panels, timelines, and zone lists.

Avoid:

- Decorative sci-fi imagery.
- Excessive neon or quantum clichés.
- Generic AI stock imagery.
- Unverified satellite screenshots used as live maps.
- Large metric tables as the hero element.
- Red labels that imply disease.

Use actual project images and maps whenever possible.

## 26. Accessibility

The frontend must:

- Provide keyboard navigation for navigation, forms, tabs, zone lists, modals, and downloads.
- Show visible focus states.
- Pair priority colours with words.
- Use sufficient contrast.
- Provide text alternatives for charts.
- Announce processing-state changes to assistive technologies.
- Avoid relying on hover alone.
- Make NoData distinct from low priority without colour alone.
- Use readable mobile text sizes.
- Provide an accessible selected-zone summary.

A screen reader should be able to announce:

```text
Zone [ID], rank [rank], high priority. Recommended action: inspect first. Field verification required.
```

## 27. Scientific Boundaries in the Frontend

The frontend must not claim:

- Disease detection.
- Pest detection.
- Infected fields.
- Field-confirmed stress.
- Complete six-model LOSO superiority.
- Proven quantum advantage.
- Financial ROI.
- Global generalisation.
- Validated temporal monitoring.

The frontend should state:

```text
The current product identifies spectral-anomaly priority candidates from real EnMAP data.
Field verification is required.
```

## 28. Frontend Implementation Checklist

- [ ] Main navigation contains Home, Project, Intelligence, Results, Technology, and Team.
- [ ] The primary CTA is labelled `RUN LIVE ANALYSIS`.
- [ ] Home communicates the product within 10 seconds.
- [ ] Home does not claim disease or pest detection.
- [ ] Intelligence allows selection of real supported EnMAP scenes.
- [ ] Model and analysis controls are enabled only when the backend actually supports them.
- [ ] A live run calls the real backend and Python engine.
- [ ] Processing states are truthful and do not fabricate progress percentages.
- [ ] Run ID, scene, status, timestamp, and processing time come from actual run data.
- [ ] Decision Dashboard shows the decision before technical metrics.
- [ ] The map uses actual risk and priority GeoTIFF outputs.
- [ ] The map uses actual GeoJSON zone geometry.
- [ ] CRS, transform, dimensions, and NoData are preserved.
- [ ] Map controls include zoom, pan, layers, zone selection, hover, tooltip, and legend.
- [ ] Clicking a zone zooms to it and opens the evidence panel.
- [ ] GeoJSON, `zones.csv`, and `spectral_evidence.csv` are matched by exact `zone_id`.
- [ ] Zone cards show priority, rank, score, area, evidence, and recommendation.
- [ ] Confidence appears only if actually available and documented.
- [ ] Why-flagged copy distinguishes measured evidence from interpretation.
- [ ] Wavelengths are shown only when verified metadata exist.
- [ ] No synthetic spectral curves are displayed.
- [ ] Inspection budgets are labelled pixel-level proxy metrics.
- [ ] Results page provides only actual available downloads.
- [ ] Technology page describes the quantum component as research logic without quantum advantage claims.
- [ ] Model Comparison is labelled `FROZEN SCIENTIFIC BENCHMARK`.
- [ ] Six benchmark models are shown with the correct metric context.
- [ ] The F1 difference and crossing confidence interval are explained honestly.
- [ ] Research & Validation shows three scenes, 224 bands, spatial evaluation, five seeds, bootstrap, calibration, error analysis, and limitations where artifacts exist.
- [ ] Research limitations include no field validation, no field labels, no blind fourth scene, no complete six-model LOSO, no proven quantum advantage, and no financial ROI.
- [ ] Team page displays only verified information about Asia Alhammadi and supplied project roles.
- [ ] Missing team information is labelled as a placeholder or omitted.
- [ ] Loading, empty, and error states are implemented for every data-dependent page.
- [ ] Backend-unavailable content is labelled `FROZEN DEMONSTRATION RESULT`.
- [ ] The frontend never fabricates zones, scores, metrics, spectral curves, processing times, or experiment results.
- [ ] Mobile preserves the decision-first hierarchy.
- [ ] Accessibility covers keyboard navigation, focus, contrast, text alternatives, and non-colour labels.
- [ ] All user-visible scientific wording follows the project guardrails.
