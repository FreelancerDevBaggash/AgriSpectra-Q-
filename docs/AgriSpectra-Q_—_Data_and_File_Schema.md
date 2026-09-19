# AgriSpectra-Q — Data and File Schema

**Document type:** Hyperspectral data, geospatial output, and frontend integration specification  
**Audience:** Remote-sensing data engineers, backend developers, frontend developers, and geospatial software architects  
**Status:** Based on verified EnMAP inputs and generated Live Matrix outputs

> The source of truth for an individual run is the actual generated file in that run directory. This document describes the verified current schema and explicitly marks conditional or unavailable fields.

## 1. Scope and Data Lifecycle

AgriSpectra-Q processes real georeferenced EnMAP hyperspectral GeoTIFF scenes and converts them into spectral-anomaly prioritisation products.

```text
INPUT
  → PREPROCESS
  → MODEL / SPECTRAL PROCESSING
  → LIVE MATRIX
  → RASTER OUTPUT
  → VECTOR ZONES
  → EVIDENCE
  → DECISION SUPPORT
```

The current Live Matrix is an unsupervised spectral-anomaly proxy. It is not a disease, pest, infected-field, or biological-severity classifier.

The frontend must consume the outputs in this order:

```text
DECISION → MAP → ZONE → EVIDENCE → TECHNICAL DETAILS
```

## 2. Input Raster Schema

### 2.1 Input type

The input is a real EnMAP hyperspectral GeoTIFF. Current processing uses Rasterio and reads the source in windows rather than unnecessarily loading the entire cube into memory.

| Property | Verified current value |
|---|---|
| Format | GeoTIFF, including the local EnMAP scene files used by the PoC. |
| Spectral bands | 224 bands. |
| Spatial resolution | Approximately 30 m. |
| NoData value | `-32768` in the inspected source scenes. |
| Georeferencing | Present in the current scenes. |
| CRS | Scene-specific; see the scene table below. |
| Processing strategy | Windowed reading. |
| Evaluation context | Spatially separated evaluation exists in the frozen benchmark. |

### 2.2 Current scene inventory

| Scene | Dimensions | Bands | Valid pixels | Total pixels | NoData | Resolution | CRS |
|---|---:|---:|---:|---:|---:|---:|---|
| Scene 1 | 1153 × 1198 | 224 | 1,028,176 | 1,381,294 | 25.56% | 30 m | EPSG:32753 |
| Scene 2 | 1210 × 1244 | 224 | 1,006,261 | 1,505,240 | 33.15% | 30 m | EPSG:32645 |
| Scene 3 | 1152 × 1214 | 224 | 1,047,911 | 1,398,528 | 25.07% | 30 m | EPSG:32636 |

The dimensions are represented as height × width in the scene statistics. The raster file properties are width × height. For example, Scene 3 has raster width 1214 and raster height 1152.

### 2.3 Band representation

The source raster contains 224 spectral bands. The current Live Matrix anomaly score is calculated over 32 selected bands from the available EnMAP bands. The current metrics file defines the score as:

```text
RMS standardized deviation over 32 actual EnMAP bands
```

The current live evidence artifact stores `band_index` and does not provide verified physical wavelength values. Do not create wavelength values by applying a generic sensor table. Wavelength display is conditional on the source metadata containing a valid wavelength mapping.

## 3. NoData and Valid-Pixel Handling

The source NoData value is `-32768`. The engine also rejects non-finite values. A pixel is treated as valid only when the required spectral values are finite and the NoData condition is not present.

The valid-pixel mask is used to:

- Exclude invalid pixels from spectral statistics.
- Exclude invalid pixels from anomaly scores.
- Exclude invalid pixels from priority masks.
- Calculate valid-pixel counts and NoData percentages.
- Define the eligible population for inspection-budget analysis.

Frontend code must treat NoData as unavailable data, not as a low-risk score. NoData pixels must be transparent or clearly masked on maps.

## 4. CRS, Resolution, and Georeferencing

### 4.1 CRS

The current scenes use different projected coordinate reference systems:

- Scene 1: `EPSG:32753`.
- Scene 2: `EPSG:32645`.
- Scene 3: `EPSG:32636`.

The frontend must read the CRS from the selected run. It must not assume that all scenes share one CRS.

### 4.2 Affine transform

The raster transform defines the relationship between row and column indices and projected coordinates. The current outputs preserve the source transform. A representative Scene 3 transform is:

```text
[30.0, 0.0, 546195.0,
 0.0, -30.0, 1977675.0,
 0.0, 0.0, 1.0]
```

The negative y-scale reflects the north-up raster orientation. Centroids and GeoJSON coordinates must be derived from this transform, never estimated from an image display.

### 4.3 Spatial resolution and area

The current resolution is approximately 30 m × 30 m. The generated zone area is represented in square metres as `approx_area_m2`. The current engine calculates this from pixel count and the source transform resolution.

The area is approximate because it is derived from raster pixels. It must not be presented as a surveyed field area.

### 4.4 Raster dimensions

Every output raster must preserve the source width and height. For the current live run:

| Scene | Risk-map width | Risk-map height | Priority-map width | Priority-map height |
|---|---:|---:|---:|---:|
| Scene 1 | 1198 | 1153 | 1198 | 1153 |
| Scene 2 | 1244 | 1210 | 1244 | 1210 |
| Scene 3 | 1214 | 1152 | 1214 | 1152 |

The frontend must validate that risk and priority map dimensions match before overlaying them.

## 5. Preprocessing and Spectral Processing

The current Live Matrix performs these verified operations:

1. Open the source GeoTIFF with Rasterio.
2. Read selected spectral bands using raster windows.
3. Identify finite, non-NoData pixels.
4. Estimate scene spectral reference statistics from valid input values.
5. Calculate a standardized spectral-deviation score over 32 selected bands.
6. Derive scene-relative priority thresholds.
7. Create a priority mask.
8. Extract connected components.
9. Remove very small components using the engine’s configured minimum component size.
10. Calculate zone statistics and geospatial coordinates.
11. Write raster, vector, CSV, and JSON outputs.

The exact generated schema must always be read from the corresponding output files. The frontend must not infer fields from a presumed schema when the run artifact is available.

## 6. Priority Thresholds

The current Live Matrix uses three scene-relative percentile thresholds:

- **P50:** lower boundary used in the scene’s low/medium prioritisation logic.
- **P80:** medium/high prioritisation boundary.
- **P95:** high-priority threshold used for the connected high-priority zones.

Current verified values are:

| Scene | P50 | P80 | P95 high-priority threshold | High-priority zones |
|---|---:|---:|---:|---:|
| Scene 1 | 0.7470 | 1.1317 | 1.8809 | 407 |
| Scene 2 | 0.6622 | 1.1688 | 1.7142 | 864 |
| Scene 3 | 0.6929 | 1.0800 | 1.6642 | 438 |

These are **spectral prioritisation thresholds**. They are not:

- Disease thresholds.
- Pest thresholds.
- Biological severity thresholds.
- Confirmed field-stress thresholds.

A frontend label should therefore say `P95 prioritisation threshold`, not `disease threshold` or `severity threshold`.

## 7. Output File Schema

Each live scene can contain the following files:

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

A run-level directory also contains `run_summary.json` when the complete multi-scene run is executed.

### 7.1 `risk_map.tif`

| Property | Verified current schema |
|---|---|
| Purpose | Georeferenced spectral-anomaly score raster. |
| Format | GeoTIFF. |
| Bands | One raster band. |
| Data type | `float32`. |
| NoData | `-9999.0` in generated outputs. |
| Dimensions | Same width and height as the source scene. |
| CRS | Same as the source scene. |
| Transform | Same source geotransform. |
| Units | Unitless standardized anomaly score; not a probability and not a biological severity unit. |
| Guaranteed or conditional | Guaranteed for a successful current Live Matrix run. |
| Frontend usage | Render as the continuous risk/anomaly layer with NoData transparent. |

The exact raster profile should be read from the generated file using a geospatial library. Do not assume that future engine versions will preserve every profile property without checking the manifest and raster metadata.

### 7.2 `priority_map.tif`

| Property | Verified current schema |
|---|---|
| Purpose | Integer priority-category raster. |
| Format | GeoTIFF. |
| Bands | One raster band. |
| Data type | `uint8`. |
| NoData/background | `0.0` in generated outputs. |
| Dimensions | Same width and height as the source scene. |
| CRS | Same as the source scene. |
| Transform | Same source geotransform. |
| Values | Current engine uses integer categories, with `0` as background/invalid and higher values for higher priority. Confirm the exact value mapping from the run implementation before presenting numeric legend labels. |
| Units | Categorical code; no physical unit. |
| Guaranteed or conditional | Guaranteed for a successful current Live Matrix run. |
| Frontend usage | Render as a categorical priority overlay with a legend and transparent background. |

The frontend should display human-readable category names such as `HIGH PRIORITY` only after using the run’s threshold and manifest information.

### 7.3 `zones.csv`

#### Purpose

A tabular representation of connected high-priority zones. It is the primary table for zone cards, ranking tables, filtering, and basic decision information.

#### Verified current columns

The current generated file contains these exact columns:

```text
zone_id
scene
pixel_count
approx_area_m2
centroid_x
centroid_y
mean_risk
max_risk
median_risk
high_priority_pixel_pct
priority_category
threshold_type
recommendation
priority_rank
```

Use the actual generated schema from the corresponding output file. Do not hard-code this list as a permanent contract without checking the run version.

| Field | Current meaning | Type / units |
|---|---|---|
| `zone_id` | Stable zone identifier within the generated run and scene. | String. |
| `scene` | Scene identifier. | String. |
| `pixel_count` | Number of pixels in the connected zone. | Integer, pixels. |
| `approx_area_m2` | Approximate zone area derived from raster pixels. | Float, square metres. |
| `centroid_x` | Projected x coordinate from the source transform. | Float, CRS units. |
| `centroid_y` | Projected y coordinate from the source transform. | Float, CRS units. |
| `mean_risk` | Mean anomaly score within the zone. | Float, unitless score. |
| `max_risk` | Maximum anomaly score within the zone. | Float, unitless score. |
| `median_risk` | Median anomaly score within the zone. | Float, unitless score. |
| `high_priority_pixel_pct` | Percentage of zone pixels in the high-priority mask. | Float, percent. |
| `priority_category` | Relative operational category. | String. |
| `threshold_type` | Threshold description used for the zone. | String. |
| `recommendation` | Operational action and caveat. | String. |
| `priority_rank` | Rank ordered by the generated zone score. | Integer, rank. |

The CSV does not contain polygon geometry. Use `zones.geojson` for geometry.

### 7.4 `zones.geojson`

| Property | Verified current schema |
|---|---|
| Purpose | Georeferenced vector representation of connected priority zones. |
| Format | GeoJSON FeatureCollection. |
| Geometry | Polygon in the current generated outputs. |
| Coordinates | Projected coordinates in the source scene CRS; the file includes CRS information in the current output. |
| Properties | Zone fields corresponding to the generated zone table, including zone ID, scene, risk statistics, area, category, recommendation, and rank. |
| Data type | JSON numbers, strings, arrays, and geometry objects. |
| Guaranteed or conditional | Conditional on valid CRS and source geotransform. Guaranteed for the current georeferenced scenes. |
| Frontend usage | Render vector boundaries and use feature selection to drive zone cards and evidence panels. |

The current GeoJSON root is a `FeatureCollection`. Each feature contains `type`, `geometry`, and `properties`. The current geometry type is `Polygon`; future runs must still be checked because geometry may change if the extraction implementation changes.

### 7.5 `spectral_evidence.csv`

#### Purpose

A machine-readable evidence table for the spectral signal associated with selected zones. It supports an evidence panel rather than a causal diagnosis.

#### Verified current columns

The current generated file contains:

```text
zone_id
priority_rank
band_index
observed_mean
reference_mean_32band_only
wavelength_status
```

Use the actual generated schema from the corresponding output file.

| Field | Current meaning | Type / units |
|---|---|---|
| `zone_id` | Zone associated with the evidence row. | String. |
| `priority_rank` | Zone rank copied into the evidence record. | Integer. |
| `band_index` | Source band position used by the evidence output. | Integer, band index. |
| `observed_mean` | Mean observed value for the zone and band. | Float, source raster units. |
| `reference_mean_32band_only` | Reference value where the current engine provides one for the selected 32-band representation. | Float or empty, source raster units. |
| `wavelength_status` | Metadata status for physical wavelength availability. | String. |

The current artifact explicitly indicates that wavelength metadata are unavailable in the live evidence output. Therefore the frontend should display `Band 1`, `Band 2`, and so on unless a future run supplies verified wavelength metadata. It must not invent nanometre values.

The evidence panel should use wording such as:

> Spectral anomaly evidence detected; field verification required.

It must not infer “fungal disease,” “pest infestation,” or another causal diagnosis from this file.

### 7.6 `inspection_budget.csv`

#### Purpose

A table showing the proxy-positive coverage obtained when selecting a fraction of valid pixels according to the generated ranking.

#### Verified current columns

```text
budget
valid_pixels
selected_pixels
proxy_positive_coverage
label
```

Use the actual generated schema from the corresponding output file.

| Field | Current meaning | Type / units |
|---|---|---|
| `budget` | Fraction of valid pixels selected for inspection. | Float, fraction from 0 to 1. |
| `valid_pixels` | Eligible valid-pixel population. | Integer, pixels. |
| `selected_pixels` | Number of pixels selected at the budget. | Integer, pixels. |
| `proxy_positive_coverage` | Fraction of proxy-positive pixels covered by the selected pixels. | Float, fraction from 0 to 1. |
| `label` | Interpretation label. | String. |

The label must remain `pixel-level proxy inspection coverage`. It must not be changed to “diseased fields detected.”

### 7.7 `scene_statistics.json`

#### Purpose

Scene-level metadata, quality statistics, thresholds, zone count, and processing time.

#### Verified current fields

The current generated file contains:

```text
scene
source
dimensions
bands
resolution_m
valid_pixels
total_pixels
nodata_percentage
crs
transform
thresholds
priority_zone_count
processing_seconds
status
```

Use the actual generated schema from the corresponding output file.

| Field | Meaning |
|---|---|
| `scene` | Scene identifier. |
| `source` | Source file path in the current local run; external deployments should use an object key or safe logical identifier. |
| `dimensions` | Height and width array. |
| `bands` | Number of source bands. |
| `resolution_m` | Approximate spatial resolution in metres. |
| `valid_pixels` | Number of valid pixels. |
| `total_pixels` | Total raster pixel count. |
| `nodata_percentage` | Percentage of pixels unavailable or invalid. |
| `crs` | Source CRS string. |
| `transform` | Affine geotransform array. |
| `thresholds` | Scene-relative prioritisation thresholds. |
| `priority_zone_count` | Number of extracted high-priority zones. |
| `processing_seconds` | Measured scene processing time. |
| `status` | Run interpretation, including spectral-anomaly-proxy wording. |

### 7.8 `metrics.json`

#### Purpose

Describe the engine and the score definition for the live run.

#### Verified current fields

The current generated file contains:

```text
engine
risk_definition
models
zone_count
```

Use the actual generated schema from the corresponding output file.

The current `models` field states that the live output is a spectral anomaly proxy and that the AgriSpectra-Q benchmark remains frozen separately. This distinction must be preserved in the frontend.

### 7.9 `manifest.json`

#### Purpose

Record run identity, source scene, live mode, leakage-control statement, CRS, and output names.

#### Verified current fields

The current generated manifest contains:

```text
run_id
scene
source
live
leakage_control
crs
outputs
```

Use the actual generated schema from the corresponding output file.

The manifest is the authoritative run-level provenance pointer. The frontend or API should verify that every listed output exists before marking a run complete.

### 7.10 `run_summary.json`

This file is generated at the run level for a multi-scene execution. It summarizes the run ID, live mode, scene statistics, and known limitations. It is not one of the per-scene output files but should be used by the dashboard for a multi-scene run overview.

## 8. Logical Relationship Between Files

A clicked zone should connect through the following chain:

```text
GeoJSON Feature
    ↓ properties.zone_id
Zone ID
    ↓ matching zones.csv:zone_id
Zone table record
    ↓ matching spectral_evidence.csv:zone_id
Spectral evidence rows
    ↓ recommendation from zones.csv
Operational recommendation
```

The same zone can also be located on the raster maps because the GeoJSON geometry and the GeoTIFF rasters share the source CRS and geotransform.

### 8.1 Illustrative relationship example

The following values are **illustrative examples of the relationship only**. They must not be copied as fixed production values:

```json
{
  "geojson_feature": {
    "properties": {
      "zone_id": "scene_03-Z0129",
      "priority_rank": 1
    }
  },
  "zones_csv_record": {
    "zone_id": "scene_03-Z0129",
    "priority_category": "HIGH PRIORITY",
    "mean_risk": 3.3913,
    "approx_area_m2": 328500.0
  },
  "spectral_evidence_rows": [
    {
      "zone_id": "scene_03-Z0129",
      "band_index": 1,
      "observed_mean": 0.123,
      "wavelength_status": "unavailable in current artifact"
    }
  ],
  "recommendation": "Field verification required."
}
```

In actual application code, use the generated values from the selected run. Match records by exact `zone_id`, not by row number or rank alone.

## 9. Frontend Consumption Rules

### 9.1 GeoTIFF → raster map

Use `risk_map.tif` for a continuous anomaly layer and `priority_map.tif` for categorical priority rendering. Read the CRS, transform, dimensions, and NoData from the file. Do not convert a GeoTIFF into a plain image and discard geospatial metadata.

NoData must be transparent or masked. The legend must identify the layer as an anomaly or priority proxy.

### 9.2 GeoJSON → vector zones

Use `zones.geojson` for zone boundaries and click selection. The map must render the geometry in the correct CRS or reproject it using a verified geospatial library.

Each selected feature should expose its `zone_id` and use that identifier to load the matching tabular and evidence records.

### 9.3 CSV → tables

Use `zones.csv` for ranked zone tables and zone cards. Use `spectral_evidence.csv` for evidence tables or charts. Use `inspection_budget.csv` for the budget chart and tabular inspection view.

The frontend should parse CSV headers from the actual file and display an unavailable state when an expected optional field is absent.

### 9.4 JSON → metadata

Use `scene_statistics.json` for scene metadata and measured processing information. Use `metrics.json` for engine and score definitions. Use `manifest.json` for provenance and output integrity. Use `run_summary.json` for multi-scene run status.

### 9.5 Evidence panel

A selected zone evidence panel should show:

- Zone ID.
- Priority rank.
- Priority category.
- Mean, maximum, and median risk.
- Approximate area.
- Centroid if available.
- Spectral evidence rows.
- Wavelength status.
- Recommendation.
- Field-verification caveat.

If physical wavelengths are not present, display band indices and say that wavelength metadata are unavailable. Do not substitute generic wavelength ranges.

## 10. Zone Representation and Geometry Integrity

A zone is a connected component extracted from the high-priority pixel mask. It is not automatically a farm field, disease patch, pest hotspot, or confirmed biological area.

For every zone, the frontend should maintain these relationships:

```text
zone_id
├── GeoJSON feature geometry
├── zones.csv tabular record
├── spectral_evidence.csv evidence rows
├── risk_map.tif values under the geometry
├── priority_map.tif category values under the geometry
└── recommendation and caveat
```

The current outputs use polygon geometries in GeoJSON. The geometry type is conditional on the extraction implementation and must be checked at runtime.

## 11. Geospatial Integrity Validation

Before accepting a run as complete, the backend or validation layer must check:

- CRS is present when geographic outputs are claimed.
- Risk-map CRS matches the source CRS.
- Priority-map CRS matches the source CRS.
- Raster transform is preserved.
- Raster width and height match source metadata.
- Risk and priority map dimensions match each other.
- GeoJSON coordinates are finite and valid.
- GeoJSON geometry is valid for the declared type.
- Zone centroids are inside or consistent with their zone geometry where applicable.
- `zone_id` values are unique within a scene run.
- Every GeoJSON feature has a matching `zones.csv` record.
- Every evidence row refers to an existing zone ID.
- The manifest lists every required output that exists.
- No output listed in the manifest is silently missing.
- No unlisted output is silently treated as part of the official result.

If the source raster is not georeferenced in a future run, geographic coordinates and GeoJSON should not be generated. The system must state that only pixel coordinates are available.

## 12. Data Lifecycle and Quality States

The backend should expose a run state only after the lifecycle is complete:

```text
INPUT
  → validate file and metadata
  → PREPROCESS
  → calculate spectral reference and valid mask
  → MODEL / SPECTRAL PROCESSING
  → calculate anomaly score
  → MATRIX
  → apply prioritisation thresholds
  → RASTER OUTPUT
  → write risk and priority GeoTIFF
  → VECTOR ZONES
  → write connected-zone GeoJSON and CSV
  → EVIDENCE
  → write spectral evidence and inspection-budget tables
  → DECISION SUPPORT
  → expose outputs to the frontend
```

A run should be marked successful only when required artifacts exist, are readable, and pass integrity checks.

## 13. What the Schema Does Not Claim

The files do not provide:

- Confirmed disease labels.
- Confirmed pest labels.
- Confirmed biological severity.
- Field polygons from an agricultural registry.
- Field inspection outcomes.
- Financial ROI.
- Temporal persistence.
- A statistically established AgriSpectra-Q advantage over HSI-RF.
- Physical wavelengths when the current evidence file reports wavelength metadata as unavailable.

The correct interpretation is:

> Real georeferenced spectral-anomaly prioritisation from EnMAP data. Field verification is required.

## Frontend data integration checklist

- [ ] Identify the selected run and scene before loading artifacts.
- [ ] Read the actual generated schema from each file rather than assuming future columns.
- [ ] Load `risk_map.tif` as a georeferenced continuous anomaly raster.
- [ ] Load `priority_map.tif` as a georeferenced categorical raster.
- [ ] Preserve and validate CRS, transform, width, height, band count, and NoData.
- [ ] Load `zones.geojson` as vector geometry only when the run provides valid georeferencing.
- [ ] Match every clicked GeoJSON feature to `zones.csv` by exact `zone_id`.
- [ ] Match spectral evidence to the selected zone by exact `zone_id`.
- [ ] Display approximate area in square metres and label it as approximate.
- [ ] Display projected centroids with the source CRS; do not call them latitude and longitude unless reprojected.
- [ ] Display band indices when physical wavelength metadata are unavailable.
- [ ] Render `inspection_budget.csv` as pixel-level proxy coverage, not disease-field recall.
- [ ] Use `scene_statistics.json` for measured metadata and processing time.
- [ ] Use `metrics.json` for the score definition and live-versus-frozen distinction.
- [ ] Use `manifest.json` to verify output completeness and provenance.
- [ ] Mask NoData and background values on maps.
- [ ] Show `HIGH PRIORITY` as an operational prioritisation category, not a disease severity label.
- [ ] Show the recommendation and the “field verification required” caveat together.
- [ ] Do not fabricate missing wavelengths, geometries, labels, or explanations.
- [ ] Do not combine Live Matrix outputs with Frozen Benchmark metrics without an explicit mode label.
- [ ] Do not mark a run completed when a required output is missing or fails validation.
