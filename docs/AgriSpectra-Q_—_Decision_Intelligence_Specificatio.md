# AgriSpectra-Q — Decision Intelligence Specification

**Document type:** Decision-intelligence, remote-sensing operations, and human-centred AI specification  
**Audience:** Product owners, agronomists, inspection teams, dashboard developers, geospatial engineers, and scientific reviewers  
**Status:** Industrial-oriented proof of concept

## 1. Purpose of the Decision-Intelligence Layer

AgriSpectra-Q is not designed merely to output specialised numerical data. It transforms complex hyperspectral information into clear, visual, and actionable decision support.

The most important product layer is the translation from a spectral signal to an inspection decision:

```text
DECISION
   ↓
VISUAL MAP
   ↓
PRIORITY ZONE
   ↓
WHY?
   ↓
SPECTRAL EVIDENCE
   ↓
TECHNICAL DETAILS
```

This distinction matters because different users need different depths of information. A non-specialist user should understand the core result within seconds. A field operator should know where to inspect first. A scientist should be able to drill down into the technical evidence. A developer should know exactly which outputs must exist to support the decision.

The system answers one operational question:

> **Where should the inspection team look first, and what spectral evidence caused the system to prioritise that zone?**

## 2. Decision Outputs

The Decision Intelligence layer produces or presents:

1. Risk and priority maps.
2. High-priority zones.
3. Zone ranking.
4. Inspection priority.
5. Spectral evidence.
6. Recommended action.
7. Inspection-budget analysis.
8. Technical drill-down.

These outputs are connected. A map is not sufficient without a zone identifier. A zone is not sufficient without evidence. Evidence is not sufficient without a recommended inspection action and a clear caveat.

## 3. Live Matrix Operating Model

The operational model is:

```text
DETECT → PRIORITISE → INSPECT → VERIFY
```

### 3.1 Detect

The system identifies spectral anomalies in real EnMAP hyperspectral imagery. The output is a spectral-anomaly score derived from valid spectral pixels. It is a signal for further attention, not a diagnosis.

### 3.2 Prioritise

The system converts the anomaly score into relative priority categories and ranks spatially connected zones. The Live Matrix uses scene-relative P50, P80, and P95 prioritisation thresholds. The P95 threshold is used for high-priority zone extraction in the current operational run.

### 3.3 Inspect

The ranked zones direct field resources toward locations that deserve attention first. The recommendation is to inspect the selected area and determine the underlying cause using field observations.

### 3.4 Verify

Field validation remains necessary. The current Live Matrix does not confirm crop disease, pest infestation, biological stress, or an infected field.

> **Field verification required.**

## 4. Scientific Boundary

Live Matrix results are spectral-anomaly prioritisation results. They are not confirmed:

- Crop disease.
- Pest infestation.
- Biological stress.
- Infected fields.

The correct terminology is:

- Spectral anomaly.
- Spectral-priority zone.
- Inspection priority.
- Spectral evidence.
- Decision-support signal.
- Field verification required.

The interface must not translate a high score into a causal claim. A high-priority zone means that its spectral signal deserves inspection under the current relative prioritisation rule.

## 5. Decision Hierarchy

The dashboard must follow five levels of information:

### Level 1 — ACTION

**What should I do?**

Example:

```text
INSPECT FIRST
```

### Level 2 — LOCATION

**Where?**

Example:

```text
Zone scene_03-Z0129
Priority rank #1
```

### Level 3 — REASON

**Why was this area selected?**

Example:

```text
A connected spatial region crossed the scene's relative high-priority threshold.
```

### Level 4 — EVIDENCE

**What spectral signal supports the priority?**

Example:

```text
Observed band-level deviation and anomaly-score statistics for the selected zone.
```

### Level 5 — TECHNICAL

**What model, metric, or processing rule produced it?**

Example:

```text
Windowed spectral anomaly Matrix; P95 prioritisation threshold; CRS and transform preserved.
```

This hierarchy prevents technical metrics from displacing the operational decision.

## 6. Decision Card

Every selected high-priority zone should have a decision card with this conceptual structure:

```text
HIGH PRIORITY
INSPECT FIRST

Zone [actual ID]
Priority Rank [actual rank]
Spectral Priority [actual category and score]
Area [actual approximate area]
Evidence [actual available evidence]

WHY FLAGGED?
[actual spectral evidence]

RECOMMENDED ACTION:
Prioritise field inspection.

FIELD VERIFICATION REQUIRED.
```

The current output files support zone ID, rank, category, risk statistics, approximate area, centroid where available, evidence references, and recommendation. The interface must not invent missing confidence, wavelength, or causal interpretation fields.

### 6.1 Confidence handling

Confidence must be shown only when the selected output actually provides a confidence measure with a documented meaning. The current live `zones.csv` contains risk statistics and priority fields, not a verified confidence field. Some frozen Decision Intelligence cards contain a `confidence` column, but those cards belong to the frozen analytical outputs and must not be silently presented as live confidence.

If confidence is unavailable, show:

```text
Confidence: Not available in this run
```

Do not replace unavailable confidence with the anomaly score.

## 7. Visual Decision Flow

The interface should guide the user through this path:

```text
RUN LIVE ANALYSIS
      ↓
ANALYSIS COMPLETE
      ↓
INSPECT FIRST: Zone [rank 1]
      ↓
OPEN MAP LOCATION
      ↓
VIEW ZONE EVIDENCE
      ↓
REVIEW RECOMMENDATION
      ↓
FIELD VERIFICATION
```

The screen should not begin with:

```text
F1 = 0.963985
ROC-AUC = 0.998665
Brier = 0.010909
```

Those numbers may be important to scientific users, but they are not the first operational decision.

## 8. Good versus Bad UI

### 8.1 Bad UI

```text
F1 = 0.963985
ROC-AUC = 0.998665
Brier = 0.010909
ECE = 0.007262

[large metric table]
[small map link]
```

This design forces the field operator to interpret research metrics before seeing the location or action. It does not answer the core product question.

### 8.2 Good UI

```text
12 high-priority spectral zones identified.

Inspect Zone #127 first.

Why: strongest available spectral deviation in the selected zone,
combined with connected high-priority spatial structure.

[OPEN ON MAP] [VIEW SPECTRAL EVIDENCE]

Technical evidence available below.
Field verification required.
```

The exact zone count and rank must come from the selected run. The wording “strongest available spectral deviation” must be used only when the evidence file supports that comparison.

## 9. Risk and Priority Maps

The map is the primary visual evidence layer. It should display:

- Continuous anomaly or risk score.
- Categorical priority map.
- High-priority zone boundaries.
- Selected-zone highlight.
- NoData mask.
- Legend.
- Scene and CRS metadata.

The map must visually resemble an operational decision tool rather than a research figure.

### 9.1 Map interaction

A user should be able to:

1. Zoom to the scene.
2. Pan across the scene.
3. Toggle risk and priority layers.
4. Toggle zone boundaries.
5. Click a zone.
6. See a selected-zone state.
7. Read a tooltip.
8. Open the complete decision card.
9. Jump to the corresponding evidence.
10. Download the selected zone or full result.

### 9.2 Colour semantics

Colour represents spectral prioritisation, not disease status.

| Visual category | Operational meaning | User-facing action |
|---|---|---|
| Low | Lower relative spectral priority. | Continue monitoring. |
| Medium | Intermediate relative priority. | Include in the next inspection cycle. |
| High | Higher relative spectral priority. | Inspect first. |
| NoData | No valid spectral data. | Do not interpret as low risk. |

Avoid the label `red = disease`. The legend must say:

```text
Relative spectral prioritisation
Not a biological severity scale
```

## 10. Zone Ranking

Zone ranking is the bridge between a map and an inspection schedule. It should be displayed as a ranked list beside or below the map.

Each row should show:

```text
Rank
Zone ID
Priority category
Score summary
Approximate area
Evidence status
Recommended action
```

The frontend must use the generated `priority_rank` or the documented run ranking. It must not invent a new composite score or silently reorder zones.

### 10.1 Selected-zone linkage

The selected zone must be linked through exact identifiers:

```text
Map geometry
   → GeoJSON feature properties.zone_id
   → zone table record
   → spectral evidence rows
   → recommendation
```

The map, ranking table, evidence panel, and recommendation must all refer to the same zone ID.

## 11. Why Was This Zone Flagged?

The “Why?” section should translate a technical signal into a careful operational explanation.

### 11.1 Required structure

```text
WHY WAS THIS ZONE FLAGGED?

Spatial reason:
A connected region crossed the configured relative high-priority threshold.

Spectral reason:
The selected region shows the available band-level anomaly evidence.

Evidence status:
Physical wavelength metadata [available / unavailable in this run].

Operational meaning:
This is an inspection-priority candidate.

Caveat:
Field verification required.
```

### 11.2 Spectral evidence dimensions

Where supported by the actual output files, the evidence drill-down may show:

- Strongest deviations.
- Wavelengths.
- Reference comparison.
- Anomaly magnitude.
- Spectral signature.

The current live evidence artifact contains `band_index`, `observed_mean`, `reference_mean_32band_only`, and `wavelength_status`. The current artifact reports physical wavelength metadata as unavailable. Therefore the current UI should show band indices and observed/reference values where available. It must not invent nanometre values.

### 11.3 Evidence interpretation

The evidence panel should distinguish between measured values and interpretation:

```text
Measured evidence:
[actual band-level values and score statistics]

Interpretation:
Spectral-anomaly evidence associated with a priority candidate.

Action:
Prioritise field inspection.
```

Do not use the panel to infer disease identity, pest identity, or a biological mechanism that was not independently measured.

## 12. Inspection-Budget Analysis

The inspection-budget question is:

> **If the team can inspect only 5%, 10%, 20%, 30%, or 50% of the candidate area, how much proxy anomaly recall is captured?**

These are **pixel-level proxy results**, not field inspection accuracy.

### 12.1 Known final results

| Inspection budget | HSI-RF proxy recall | AgriSpectra-Q proxy recall |
|---:|---:|---:|
| 5% | 24.49% | 24.49% |
| 10% | 49.19% | 49.19% |
| 20% | 92.33% | 92.22% |

At 30%, 50%, and 100%, the frozen summary reports full proxy recall for both methods, with declining precision as more pixels are selected. The exact displayed value must be read from the corresponding generated CSV.

The result does not show operational superiority for AgriSpectra-Q. At 20%, HSI-RF is slightly higher by the reported proxy recall. At 5% and 10%, the methods are equal in the frozen summary.

### 12.2 Budget visualisation

The dashboard should include:

- A budget selector or slider.
- A recall-versus-budget curve.
- A selected-budget summary card.
- A map overlay showing selected pixels or selected zones where available.
- A table containing budget, valid pixels, selected pixels, proxy recall, precision, and label.

Recommended summary copy:

```text
At a 10% inspection budget:
Proxy anomaly recall: 49.19%
Interpretation: pixel-level proxy result
Not field inspection accuracy
```

### 12.3 Budget caveat

The inspection budget is a decision-support proxy. It does not measure:

- Percentage of diseased fields found.
- Percentage of pests found.
- Agronomist agreement.
- Field-team travel efficiency.
- Economic value of intervention.

## 13. Error Disagreement and Complementarity

The final error-disagreement analysis reported:

- 29 Q-corrected RF errors.
- 23 RF-correct/Q-wrong cases.
- Net correction of +6.

These results should be described as **weak complementarity**, not proof that AgriSpectra-Q is superior.

The correct interpretation is:

> AgriSpectra-Q corrected some HSI-RF hard-decision errors, but HSI-RF was correct on other cases where AgriSpectra-Q was wrong. The net difference is small and scene-dependent.

### 13.1 UI presentation

The dashboard may show a compact comparison card:

```text
Error disagreement
Q-corrected RF errors: 29
RF-correct / Q-wrong cases: 23
Net correction: +6
Interpretation: weak, scene-dependent complementarity
```

This card belongs in the expert or research drill-down. It should not be presented as an operational guarantee.

## 14. Scientific Model Context

The frozen benchmark compares:

1. HSI-RF.
2. Spectral XGBoost.
3. 48-band XGBoost.
4. Adaptive Classical.
5. Current Hybrid.
6. AgriSpectra-Q.

AgriSpectra-Q achieved the highest numerical mean F1 at 0.963985, while HSI-RF achieved 0.963141. The confidence interval for their paired difference crosses zero. This means that the dashboard must describe AgriSpectra-Q as competitive and promising, not statistically proven superior.

The model metrics are technical context. They should be available in the technical drill-down and Research & Validation page, not placed above the action card on the first screen.

## 15. Uncertainty and Caveats

Uncertainty must be visible and close to the decision. It should not be hidden in a separate documentation page.

### 15.1 Required caveats

Use:

```text
This is a spectral-anomaly prioritisation signal.

The underlying cause is not determined by the current output.

Field verification required.
```

Where statistical results are shown:

```text
Numerical benchmark advantage observed.
Statistical superiority over HSI-RF not established.
```

Where wavelength information is unavailable:

```text
Physical wavelength metadata are unavailable in this run.
Evidence is shown by band index.
```

Where confidence is unavailable:

```text
Confidence is not available in this run.
```

### 15.2 NoData caveat

NoData is not low risk. A map region without valid spectral data must be visually masked and described as unavailable.

### 15.3 Live versus frozen caveat

Live Matrix output and frozen benchmark output must never be merged without explicit labels. The live result is a new spectral-anomaly prioritisation run. The frozen benchmark is a read-only scientific reference.

## 16. Operator Workflow

The field operator workflow should be short:

1. Open the Decision Dashboard.
2. Confirm the scene and live-run status.
3. Read the overall priority summary.
4. Open the top-ranked zone.
5. Inspect the map location.
6. Review the “Why flagged?” explanation.
7. Review available spectral evidence.
8. Record or schedule the field inspection.
9. Verify the observed condition in the field.
10. Feed the verified observation into a future validation workflow.

The dashboard must not require the operator to understand F1, ROC-AUC, calibration, or quantum-inspired features before taking the first operational step.

## 17. Expert Workflow

The scientific or technical user should be able to:

1. Inspect scene metadata and data quality.
2. Review thresholds and their percentile definitions.
3. View risk and priority rasters.
4. Filter and rank zones.
5. Inspect band-level evidence.
6. Review inspection-budget curves.
7. Compare frozen model metrics.
8. Review paired bootstrap results and limitations.
9. Download manifests and raw result tables.
10. Reproduce the analysis from the run ID and source artifacts.

The expert layer should add depth without changing the first-screen decision hierarchy.

## 18. Business Value

The current business value is **operational prioritisation**, not proven monetary ROI.

The system can potentially help an organisation move from uniform inspection toward ranked inspection candidates. The current evidence does not quantify financial savings or customer outcomes.

Possible future business metrics include:

- Inspection area reduced.
- Time saved.
- Scouting efficiency.
- Field-confirmed detection.
- Cost per validated intervention.
- Travel distance per validated finding.
- False-alarm burden.
- Missed-finding rate.

These metrics require an operational field pilot. No current financial number should be invented or displayed as measured ROI.

## 19. Accessibility and Human-Centred AI

Decision Intelligence must be understandable to users with different technical backgrounds.

The dashboard should:

- Use plain-language action labels.
- Pair colour with text.
- Keep “Field verification required” visible.
- Provide keyboard navigation.
- Provide accessible map controls.
- Provide text alternatives for charts.
- Avoid relying on hover alone.
- Use sufficient contrast.
- Distinguish NoData from low priority without colour alone.
- Allow users to access the technical evidence without making it mandatory for the first decision.

A screen-reader-friendly selected-zone state should announce:

```text
Zone [ID], rank [rank], high priority. Recommended action: inspect first. Field verification required.
```

## 20. Developer Output Contract

The decision layer requires these output families:

| Decision need | Required output |
|---|---|
| Map location | `risk_map.tif`, `priority_map.tif` |
| Zone geometry | `zones.geojson` |
| Zone ranking and card | `zones.csv` |
| Spectral explanation | `spectral_evidence.csv` |
| Inspection-budget chart | `inspection_budget.csv` |
| Scene context | `scene_statistics.json` |
| Engine and score definition | `metrics.json` |
| Provenance and completeness | `manifest.json` |

A developer must not mark the decision result complete if a required output is absent, unreadable, or inconsistent with the manifest.

## 21. Decision View Example

The following is an illustrative UI structure. Values marked `[actual]` must be populated from the selected run.

```text
┌──────────────────────────────────────────────────────────────┐
│ SPECTRAL PRIORITY ANALYSIS COMPLETE                          │
│ Scene: [actual scene]      Run: [actual run ID]              │
│                                                              │
│ HIGH PRIORITY — INSPECT FIRST                                │
│ Zone [actual ID]                                             │
│ Priority rank: #[actual rank]                                │
│ Area: [actual approximate area]                              │
│                                                              │
│ WHY FLAGGED?                                                 │
│ [actual available spectral evidence]                         │
│                                                              │
│ [OPEN ON MAP] [VIEW EVIDENCE] [EXPORT ZONE]                  │
│                                                              │
│ RECOMMENDED ACTION                                            │
│ Prioritise field inspection.                                 │
│ Field verification required.                                 │
└──────────────────────────────────────────────────────────────┘
```

This structure keeps the action visible even when technical detail is expanded below.

## 22. What the Decision Layer Must Not Do

It must not:

- Call a spectral anomaly a confirmed disease.
- Call a priority zone an infected field.
- Claim pest detection without independent labels.
- Display NoData as low risk.
- Invent wavelength values.
- Invent confidence values.
- Replace field verification with a dashboard score.
- Present a benchmark metric as live performance.
- Claim statistically established AgriSpectra-Q superiority over HSI-RF.
- Claim quantum advantage.
- Claim proven monetary ROI.
- Hide uncertainty or limitations.

## Decision Intelligence Acceptance Criteria

- [ ] The dashboard answers “Where should I inspect first?” within seconds.
- [ ] The first screen shows a decision before specialised scientific metrics.
- [ ] The visual map is the primary evidence surface.
- [ ] The map displays actual risk, priority, and zone products from the selected run.
- [ ] A selected zone is linked by exact ID to its geometry, table record, evidence, and recommendation.
- [ ] Zone cards show rank, priority, score, area, evidence, and recommended action.
- [ ] The action label `INSPECT FIRST` is used for high-priority candidates.
- [ ] Every operational recommendation includes `Field verification required`.
- [ ] The UI never labels spectral anomaly as confirmed disease, pest, biological stress, or infected field.
- [ ] P50, P80, and P95 are described as spectral prioritisation thresholds.
- [ ] The UI does not describe percentile thresholds as disease or pest thresholds.
- [ ] Spectral evidence shows actual available fields and marks wavelength metadata unavailable when necessary.
- [ ] The UI does not invent wavelengths, reference spectra, confidence, or causal interpretations.
- [ ] Inspection-budget charts are labelled pixel-level proxy results.
- [ ] The budget view supports 5%, 10%, 20%, 30%, and 50% selections where data exist.
- [ ] Budget results are not described as field inspection accuracy.
- [ ] The 29 Q-corrected errors and 23 RF-correct/Q-wrong cases are described as weak complementarity.
- [ ] The dashboard does not claim that the net correction of +6 proves AgriSpectra-Q superiority.
- [ ] Frozen benchmark metrics are visibly separated from live Matrix outputs.
- [ ] Technical metrics remain available for scientists but do not dominate the operator view.
- [ ] Uncertainty and caveats appear adjacent to the relevant decision.
- [ ] NoData is visually masked and never interpreted as low risk.
- [ ] Operator workflow supports map selection, evidence review, scheduling, and verification.
- [ ] Expert workflow supports technical drill-down, downloads, and reproducibility.
- [ ] Accessibility requirements are implemented for colour, keyboard, contrast, labels, and chart alternatives.
- [ ] The system exposes the required raster, vector, CSV, and JSON outputs.
- [ ] A result is not marked complete when a required artifact is missing or inconsistent.
- [ ] Current business value is described as operational prioritisation, not proven financial ROI.
