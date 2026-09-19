# AgriSpectra-Q — UX/UI Product Specification

**Document type:** Product design, UX architecture, and scientific visualisation specification  
**Audience:** Product designers, frontend developers, dashboard developers, geospatial engineers, and scientific visualisation specialists  
**Product status:** Industrial-oriented proof of concept

## 1. Product Experience Principle

AgriSpectra-Q must be experienced as a **visual decision-support product**, not as a page full of specialised numerical scientific data.

The user should understand the operational result quickly:

> **Where should I inspect first, and why did the system flag this area?**

The primary UX rule is:

```text
SHOW THE DECISION FIRST.
SHOW THE VISUAL EVIDENCE SECOND.
SHOW THE SPECIALISED TECHNICAL DATA THIRD.
```

The product’s operational philosophy is:

```text
DETECT → PRIORITISE → INSPECT → VERIFY
```

The interface must describe the target as a **spectral anomaly** or **Spectral Anomaly Proxy**. It must not present a priority zone as confirmed disease, an infected field, or a pest detection.

## 2. Primary User Flow

```text
HOME
  → SELECT DATA
  → ANALYSE
  → PROCESSING
  → RESULTS
  → RISK MAP
  → HIGH-PRIORITY ZONES
  → WHY WAS THIS ZONE FLAGGED?
  → SPECTRAL EVIDENCE
  → INSPECT FIRST
  → REPORT
```

The primary call to action is:

```text
RUN LIVE ANALYSIS
```

The dashboard should prioritise actual maps, priority zones, ranked inspection areas, zone cards, evidence, and recommendations. Benchmark tables are supporting scientific content and must not be the visual centre of the application.

## 3. Product Navigation

### 3.1 Main navigation

```text
Home
Project
Intelligence
Results
Technology
Team
```

The navigation should remain visible on desktop and collapse into a compact menu on mobile. The current user should always be able to identify whether they are viewing a live run or the frozen scientific benchmark.

### 3.2 Persistent mode indicator

Every results-related page must display one of these labels:

```text
LIVE ANALYSIS
```

or:

```text
FROZEN SCIENTIFIC BENCHMARK
```

Live Analysis means that the Python Live Matrix engine has executed against an actual EnMAP GeoTIFF scene. Frozen Scientific Benchmark means a previously validated, read-only comparison of six models.

These modes must never be visually merged or described as the same experiment.

## 4. Visual and Interaction Direction

The visual language should resemble an operational inspection console rather than a research paper. The map and ranked zones should occupy the main visual area. Technical evidence should be accessible without overwhelming first-time users.

Recommended visual priorities are:

1. Clear decision card.
2. Large interactive map.
3. Ranked zone list.
4. Selected-zone evidence panel.
5. Technical details and downloads.

Use restrained colour semantics. Red must not mean disease. Use colours for operational priority:

| Category | Meaning | Suggested visual treatment |
|---|---|---|
| Low | Continue monitoring. | Muted blue or grey. |
| Medium | Include in the next inspection cycle. | Amber or gold. |
| High | Inspect this zone first. | Strong orange or red-orange, labelled `HIGH PRIORITY`. |
| Unavailable | No valid data or NoData. | Transparent, hatched, or neutral grey. |

The legend must state that the colours represent **spectral prioritisation**, not biological diagnosis.

## 5. Required Pages

The product must contain these pages:

1. Home.
2. Project.
3. Intelligence / Live Analysis.
4. Decision Dashboard.
5. Spectral Evidence.
6. Model Comparison.
7. Research & Validation.
8. Team.
9. Reports / Export.

## 6. Page Specifications and Wireframes

## 6.1 Home

### Purpose

Explain the product in one screen and guide the user toward a real analysis.

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Logo   Home  Project  Intelligence  Results  Technology Team │
├──────────────────────────────────────────────────────────────┤
│ Hyperspectral intelligence for inspection prioritisation      │
│                                                              │
│ Turn EnMAP observations into ranked spectral-priority zones. │
│                                                              │
│ [ RUN LIVE ANALYSIS ]       [ VIEW PROJECT ]                 │
│                                                              │
│ DETECT → PRIORITISE → INSPECT → VERIFY                       │
├──────────────────────────────────────────────────────────────┤
│ Real EnMAP data │ Georeferenced zones │ Evidence-led action  │
└──────────────────────────────────────────────────────────────┘
```

### Required content

The page must state that the system uses real EnMAP hyperspectral data and produces spectral-anomaly priority candidates. It must state that field verification is required.

### Mobile layout

Stack the headline, explanatory copy, primary CTA, workflow strip, and capability cards vertically. The primary CTA should remain visible without horizontal scrolling.

### UX copy

```text
Hyperspectral intelligence for targeted inspection.

Find the areas that deserve attention first, understand the spectral evidence, and send field teams to verify the signal.

This system identifies spectral-anomaly priority candidates. It does not diagnose disease or pests.
```

## 6.2 Project

### Purpose

Explain the problem, solution, data, and operational philosophy to a non-specialist stakeholder.

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Project                                                        │
├──────────────────────────────────────────────────────────────┤
│ THE PROBLEM                                                   │
│ Large areas are expensive to inspect uniformly.               │
├───────────────────────────────┬──────────────────────────────┤
│ THE SOLUTION                  │ THE WORKFLOW                  │
│ Spectral evidence → priority │ Detect → Prioritise →         │
│ zones → field verification   │ Inspect → Verify              │
├───────────────────────────────┴──────────────────────────────┤
│ What the system does not claim                               │
└──────────────────────────────────────────────────────────────┘
```

### Required content

Explain that the product transforms hyperspectral Earth Observation data into georeferenced inspection priorities. Make the scientific boundary prominent: priority is not confirmed disease, pest, or biological stress.

### Mobile layout

Use collapsible sections for problem, solution, data, and limitations. Keep the “What the system does not claim” section visible rather than burying it in a footer.

## 6.3 Intelligence / Live Analysis

### Purpose

Allow a user to select a real server-side EnMAP scene and execute the actual Python Live Matrix engine.

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Intelligence                         [LIVE ANALYSIS]         │
├──────────────────────────────────────────────────────────────┤
│ Scene                         Analysis                       │
│ [Scene 1 ▼]                  [Spectral Priority ▼]           │
│                                                              │
│ [ RUN LIVE ANALYSIS ]                                        │
├──────────────────────────────────────────────────────────────┤
│ Data quality preview                                         │
│ Dimensions │ Bands │ Resolution │ CRS │ Valid pixels         │
├──────────────────────────────────────────────────────────────┤
│ Run instructions and field-verification caveat               │
└──────────────────────────────────────────────────────────────┘
```

### Required controls

The page must allow the user to:

- Choose one of the three real server-side EnMAP scenes.
- Select a supported live analysis.
- Start the analysis.
- Observe processing status.
- Receive a unique experiment or run ID.
- View measured processing time after completion.
- Navigate to the results page.

The current verified API supports scene selection for `scene_01_DT0000205230`, `scene_02`, and `scene_03`. A model selector, arbitrary seed selector, and full-scene upload are not current verified capabilities of the live endpoint and must not be displayed as active controls unless implemented.

### Mobile layout

Use a single-column form. Keep the run button full width. Show metadata in a horizontally scrollable or stacked summary card.

## 6.4 Processing screen

### Purpose

Communicate that the system is executing actual computation rather than loading a static result.

### Required copy

```text
Analysing hyperspectral scene…

Reading valid spectral pixels
Calculating spectral anomaly evidence
Extracting priority zones
Generating geospatial outputs
```

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ LIVE ANALYSIS                                                │
├──────────────────────────────────────────────────────────────┤
│ Analysing hyperspectral scene…                               │
│                                                              │
│ [██████████████████░░░░░░░░]                                 │
│                                                              │
│ Run ID: AGRQ-LIVE-…                                          │
│ Scene: scene_03                                              │
│ Status: RUNNING                                              │
│                                                              │
│ Do not close this page while the analysis is running.         │
└──────────────────────────────────────────────────────────────┘
```

### Progress semantics

If stage-level progress is not available, show a truthful indeterminate progress state. Do not fabricate a percentage. After completion, display the actual measured processing time from `scene_statistics.json`.

### Error state

```text
LIVE ANALYSIS FAILED

The engine did not complete this run. No result should be treated as valid.

[VIEW ERROR DETAILS] [TRY AGAIN]
```

## 6.5 Decision Dashboard / Results

### Purpose

Answer the operational question immediately: where should the team inspect first?

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Results                    [LIVE ANALYSIS]  Run: AGRQ-LIVE…   │
├──────────────────────────────────────────────────────────────┤
│ SPECTRAL PRIORITY ANALYSIS COMPLETE                          │
│ High-priority zones: 438                                     │
│ Inspection focus: Top-ranked spectral-priority zones         │
│ Scene coverage: 1,047,911 valid pixels                       │
│ Processing time: 49.11 seconds                               │
├───────────────────────────────┬──────────────────────────────┤
│                               │ TOP PRIORITIES               │
│        INTERACTIVE MAP        │ 1  Zone …  HIGH PRIORITY     │
│        Risk / priority        │ 2  Zone …  HIGH PRIORITY     │
│        zone overlays          │ 3  Zone …  HIGH PRIORITY     │
│                               │ [VIEW ALL ZONES]             │
├───────────────────────────────┴──────────────────────────────┤
│ WHY WAS THIS ZONE FLAGGED?                                   │
│ Evidence summary │ Recommendation │ Technical details        │
└──────────────────────────────────────────────────────────────┘
```

### Top summary

Use actual values from the selected run:

```text
SPECTRAL PRIORITY ANALYSIS COMPLETE
High-priority zones: [actual value]
Inspection focus: [actual ranked zones]
Scene coverage: [actual valid-pixel value]
Processing time: [actual measured value]
```

Do not hard-code example values. If a field is unavailable, show `Unavailable in this run`.

### Mobile layout

Order the content as:

1. Decision summary.
2. Top zone card.
3. Map.
4. Remaining zones.
5. Why flagged.
6. Evidence.
7. Technical details.

The map should support a full-screen expansion. The zone card should remain accessible without requiring a desktop-width table.

## 6.6 Interactive map panel

### Required map functions

The map must support:

- Zoom.
- Pan.
- Legend.
- Zone overlay.
- Clickable zones.
- Selected-zone state.
- Tooltips.
- Layer toggle.
- Base map or satellite context where appropriate and legally available.
- NoData masking.
- CRS-aware rendering.

### Recommended layers

```text
Risk map
Priority map
High-priority zone boundaries
Selected zone
NoData mask
Optional base map
```

The risk raster is continuous. The priority raster is categorical. GeoJSON is the vector interaction layer. The frontend must not use a screenshot as the source of zone geometry.

### Selected-zone state

When a zone is clicked:

- Highlight its boundary.
- Dim unrelated zones.
- Open the zone card.
- Show the exact zone ID.
- Load the matching evidence rows.
- Show the recommendation.
- Show the field-verification caveat.

### Tooltip copy

```text
Zone: [actual zone ID]
Priority: HIGH PRIORITY
Rank: #[actual rank]
Area: [actual approximate area]
Mean spectral anomaly: [actual score]
Action: Inspect first
```

Do not use “disease level” or “pest probability” unless independent future field validation supports that claim.

## 6.7 High-priority zone list

### Zone card

Each card should contain:

```text
Priority Rank: #[actual]
Zone ID: [actual]
Priority: HIGH PRIORITY
Score: [actual mean/max/median risk]
Area: [actual approximate area]
Confidence: [only if actually available]
Evidence: [actual evidence summary]
Recommended Action: INSPECT FIRST
Caveat: Field verification required
```

The card must use `confidence` only when the selected run genuinely provides a confidence field. The current live `zones.csv` provides risk statistics and operational category, but confidence is not a verified zone column. In that case, display an evidence-status label rather than inventing a confidence value.

### Ranking behaviour

Sort according to the generated `priority_rank` or the actual documented ranking field. Do not re-rank zones in the frontend using an undocumented composite score.

## 6.8 Why Was This Zone Flagged?

### Purpose

Translate model output into understandable evidence without creating a causal agronomic explanation.

### Panel structure

```text
WHY WAS THIS ZONE FLAGGED?

Signal
A concentrated spectral-anomaly signal crossed the scene's
relative prioritisation threshold.

Spatial evidence
The selected pixels form a connected priority zone.

Spectral evidence
[Observed band-level evidence from spectral_evidence.csv]

Interpretation
Spectral-stress evidence detected. Underlying cause requires
field inspection.
```

The current evidence file contains band index, observed mean, a reference value where available, and wavelength status. The current artifact reports physical wavelengths as unavailable. Therefore the interface must use band indices unless verified metadata are added.

Never display:

```text
Fungal disease detected.
Pest infestation confirmed.
Infected field.
```

## 6.9 Spectral Evidence page

### Purpose

Provide technical spectral context after the operational decision is understood.

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Spectral Evidence                                            │
├──────────────────────────────────────────────────────────────┤
│ Selected zone: scene_03-Z0129   Rank: #1                     │
├───────────────────────────────┬──────────────────────────────┤
│                               │ Evidence summary             │
│    SPECTRAL SIGNATURE         │ Observed mean               │
│    observed / reference      │ Reference status             │
│    deviation if available     │ Wavelength status            │
│                               │                              │
├───────────────────────────────┴──────────────────────────────┤
│ Band-level evidence table                                    │
└──────────────────────────────────────────────────────────────┘
```

### Scientific visualisation requirements

When the underlying data support it, show:

- Spectral signature.
- Wavelength axis.
- Observed spectrum.
- Reference or normal spectrum.
- Deviation indicators.
- Band-level evidence table.

The current live evidence artifact does not verify physical wavelength metadata. The current UI should therefore label the x-axis as `Band index` or display a clear unavailable message. It must not display generic wavelengths.

If a future run provides actual wavelengths, use them directly from the run metadata and label the source clearly.

## 6.10 Model Comparison page

### Purpose

Present the controlled scientific reference without making it the centre of the operational dashboard.

### Mandatory label

```text
FROZEN SCIENTIFIC BENCHMARK
```

### Models

- HSI-RF.
- Spectral XGBoost.
- 48-band XGBoost.
- Adaptive Classical.
- Current Hybrid.
- AgriSpectra-Q.

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ Model Comparison                  FROZEN SCIENTIFIC BENCHMARK │
├──────────────────────────────────────────────────────────────┤
│ Mean F1 comparison chart                                    │
├──────────────────────────────────────────────────────────────┤
│ Model table: F1 │ PR-AUC │ ROC-AUC │ Brier │ ECE              │
├──────────────────────────────────────────────────────────────┤
│ Interpretation and statistical caveat                       │
└──────────────────────────────────────────────────────────────┘
```

### Scientific interpretation

AgriSpectra-Q has the highest numerical mean F1 at 0.963985. HSI-RF has the strongest PR-AUC and ROC-AUC. Adaptive Classical has the best Brier and ECE. The paired confidence interval for AgriSpectra-Q versus HSI-RF crosses zero. The page must not imply that AgriSpectra-Q has statistically established superiority.

The page must not show live performance unless the backend actually executes the selected model and labels the result as live.

## 6.11 Research & Validation page

### Purpose

Give expert users access to the scientific evidence and limitations after the operational result is clear.

### Required metrics

- Mean F1.
- PR-AUC.
- ROC-AUC.
- Brier.
- ECE.
- Paired bootstrap difference.
- Confidence interval.
- Scene-level and seed-level context where available.
- Limitations.

### Hierarchy

The page should begin with a concise interpretation card:

```text
Competitive numerical result.
Statistical superiority over HSI-RF not established.
```

The detailed tables and plots should follow. The page must explicitly state that the benchmark target is a Spectral Anomaly Proxy and not an independently labelled disease or pest outcome.

## 6.12 Project and Technology pages

The Project page explains the problem, workflow, data, and product boundary. The Technology page explains the processing engine, geospatial outputs, hybrid research layer, and the distinction between current and future architecture.

Do not make the quantum-inspired component the only headline. Present it as a research layer within a broader spectral decision-intelligence system.

## 6.13 Team page

The Team page should describe roles rather than invent names or organisations. Suggested role labels are:

- Hyperspectral remote-sensing science.
- Geospatial AI engineering.
- Scientific Python and ML.
- Product and dashboard engineering.
- Field-validation coordination.

If names, affiliations, or contact information are not available in the project data, show role-based placeholders or omit the field.

## 6.14 Reports / Export page

### Purpose

Allow users to download actual run products and reports.

### Export groups

```text
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

Reports
  generated report if available
```

The export page must show whether an item belongs to `LIVE ANALYSIS` or `FROZEN SCIENTIFIC BENCHMARK`. It must not label a live anomaly map as a disease map.

## 7. Processing, Loading, Empty, and Error States

### 7.1 Loading state

Use a clear stage message:

```text
Analysing hyperspectral scene…
Preparing valid-pixel mask…
Calculating spectral evidence…
Extracting priority zones…
Writing geospatial outputs…
```

Show an indeterminate state when a measured percentage is not available. Never fake progress.

### 7.2 Empty state: no zones

```text
No high-priority spectral zones were generated for this run.

This does not mean that the scene is biologically healthy. It means that no connected region crossed the configured spectral prioritisation threshold.
```

### 7.3 Empty state: no evidence

```text
Spectral evidence is unavailable for this zone.

Review the run manifest and scene metadata. Do not infer a causal explanation from the priority score alone.
```

### 7.4 NoData state

```text
No valid spectral data in this area.

This region is excluded from the current analysis and should not be interpreted as low priority.
```

### 7.5 API or engine error

```text
Analysis could not be completed.

The engine did not produce a valid result. Check the run details or try again with a supported scene.
```

### 7.6 Frozen benchmark unavailable

```text
The frozen benchmark reference is unavailable.

This does not affect the selected live analysis. Run status and live outputs remain separate.
```

## 8. Responsive Design

### 8.1 Desktop

Use a two-column results layout: a large map on the left and ranked zones on the right. Place the selected-zone evidence panel below the map and zone list or in a right-side drawer.

The model comparison and research pages may use wider tables, but tables should remain secondary to the interpretation cards.

### 8.2 Tablet

Use a map-first layout with a collapsible zone drawer. Keep the decision summary pinned above the map and allow the evidence panel to open as a bottom sheet.

### 8.3 Mobile

Use a single-column flow:

```text
Decision card
→ Top zone card
→ Map
→ Zone list
→ Why flagged
→ Evidence
→ Technical details
```

Use touch-friendly controls, minimum comfortable tap targets, horizontal scrolling only for dense expert tables, and full-screen map expansion. Avoid placing critical status information solely in hover tooltips.

## 9. Accessibility

The application must:

- Provide text labels for every icon-only map control.
- Ensure keyboard navigation for forms, zone lists, tabs, modals, and export controls.
- Use visible focus states.
- Provide non-colour labels for priority categories.
- Avoid relying on red/green alone.
- Use sufficient contrast for map overlays and text.
- Provide a text alternative for selected-zone evidence.
- Provide accessible table headers.
- Announce processing status changes to assistive technologies.
- Preserve readable font sizes on mobile.
- Ensure charts have a title, axis labels, and a text summary.

For colour semantics, pair every colour with a word such as `LOW`, `MEDIUM`, or `HIGH PRIORITY`.

## 10. UX Copy System

### Preferred terms

Use:

- Spectral anomaly.
- Spectral-priority zone.
- Inspection priority.
- Spectral evidence.
- Field verification required.
- Decision-support signal.
- Live analysis.
- Frozen scientific benchmark.
- Pixel-level proxy inspection coverage.

### Prohibited terms in the current product

Do not use:

- Confirmed disease.
- Infected field.
- Pest detected.
- Disease probability.
- Biological severity.
- Guaranteed crop failure.
- Proven ROI.
- Quantum advantage.

These terms may only be reconsidered if future independent field validation establishes the relevant claim and the product language is revised deliberately.

### Recommended action copy

```text
HIGH PRIORITY
Inspect this zone first.

MEDIUM PRIORITY
Include this zone in the next inspection cycle.

LOW PRIORITY
Continue monitoring.

UNCERTAIN SIGNAL
Signal detected, but confidence/evidence is insufficient for high-priority classification.

SPECTRAL EVIDENCE
Spectral-stress evidence detected. Prioritise field inspection to determine the underlying cause.

FIELD VERIFICATION
Field verification required.
```

## 11. Visual Evidence Rules

The interface must not make a zone appear important only because it is coloured red. Priority should be supported by visible data:

- Relative anomaly score.
- Connected spatial structure.
- Zone rank.
- Area and pixel count.
- Spectral evidence where available.
- Threshold type.
- Processing and data-quality context.

The evidence panel must distinguish measured values from interpretation. For example:

```text
Measured: mean_risk = [actual generated value]
Measured: priority_rank = [actual generated value]
Interpretation: spectral-anomaly priority candidate
Required action: field inspection and verification
```

## 12. Live and Frozen Data Presentation

### Live Analysis card

```text
LIVE ANALYSIS
Generated from a new execution of the Python Live Matrix engine.
Run ID: [actual]
Scene: [actual]
Processing time: [actual]
```

### Frozen Benchmark card

```text
FROZEN SCIENTIFIC BENCHMARK
Read-only scientific reference.
Not a live model execution.
Statistical superiority of AgriSpectra-Q over HSI-RF was not established.
```

The UI must not show a live run’s zone count beside frozen F1 metrics without two separate labels and explanatory context.

## 13. Reporting and Export UX

A report should begin with the operational decision and then explain the evidence. The report export should include:

1. Scene and run identity.
2. Overall priority summary.
3. Map or map references.
4. Ranked zones.
5. Selected-zone evidence.
6. Inspection-budget chart or table.
7. Technical metadata.
8. Limitations and field-verification caveat.

The report must not transform spectral anomaly into disease or pest language.

## 14. UX Acceptance criteria

- [ ] The Home page communicates inspection prioritisation within one screen.
- [ ] The primary CTA is labelled `RUN LIVE ANALYSIS`.
- [ ] The interface visibly distinguishes `LIVE ANALYSIS` from `FROZEN SCIENTIFIC BENCHMARK`.
- [ ] The results page shows the decision summary before technical benchmark tables.
- [ ] The results page displays an actual geospatial map.
- [ ] The map supports zoom, pan, legend, zone overlay, click selection, tooltip, and layer toggle.
- [ ] A clicked GeoJSON zone opens the matching zone record by exact `zone_id`.
- [ ] The zone card displays rank, ID, priority, score, area, evidence, and action.
- [ ] Confidence is displayed only when the selected artifact actually provides it.
- [ ] The interface explains why a zone was flagged without making unsupported causal claims.
- [ ] Spectral evidence is sourced from the selected run’s evidence output.
- [ ] Physical wavelengths are not invented when metadata are unavailable.
- [ ] The map legend explains that priority is spectral prioritisation, not disease severity.
- [ ] NoData is masked and not treated as low risk.
- [ ] Inspection-budget output is labelled pixel-level proxy coverage.
- [ ] The six-model comparison is labelled `FROZEN SCIENTIFIC BENCHMARK`.
- [ ] The UI does not imply live model performance when showing frozen metrics.
- [ ] Research metrics are available but do not dominate the operational dashboard.
- [ ] Loading states do not fabricate progress percentages.
- [ ] Error states clearly state that no valid result was produced.
- [ ] Empty states distinguish no zones from no valid data.
- [ ] Desktop, tablet, and mobile layouts preserve the decision-first order.
- [ ] Keyboard focus, text labels, contrast, and non-colour priority labels are implemented.
- [ ] The product never uses confirmed disease, infected field, or pest detected language without future independent validation.
- [ ] Every recommendation includes or links to `Field verification required`.
- [ ] Export controls provide actual generated files and identify their run mode.
- [ ] The UI never fabricates coordinates, wavelengths, confidence, evidence, or metrics.
