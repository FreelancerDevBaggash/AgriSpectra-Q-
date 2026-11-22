/**
 * Type definitions for AgriSpectra-Q
 *
 * Includes:
 *  - Core EnMAP Live Matrix types
 *  - Frozen benchmark types
 *  - Advanced Spectral Atlas types (from integration package)
 *  - Planet Tanager experiment types
 */

export type SceneId = 'scene_01_DT0000205230' | 'scene_02' | 'scene_03'

export type RunMode = 'LIVE_ANALYSIS' | 'FROZEN_SCIENTIFIC_BENCHMARK'

export type PriorityCategory = 'HIGH PRIORITY' | 'MEDIUM PRIORITY' | 'LOW PRIORITY' | 'ABSTAIN / HUMAN REVIEW'

/**
 * Inspection-prioritisation decision labels.
 * These are NOT disease classifications.
 * INSPECT does not confirm disease or pests.
 * MONITOR does not mean the crop is healthy.
 * ABSTAIN does not mean the area is free of agricultural problems.
 */
export type InspectionDecision = 'INSPECT' | 'MONITOR' | 'ABSTAIN'

export type RunStatus = 'queued' | 'running' | 'completed' | 'failed'

/**
 * Full run lifecycle states — used by the Atlas integration contract.
 * Atlas is only shown in state `atlas_ready`.
 */
export type FullRunStatus =
  | 'created'
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'processing_failed'
  | 'artifacts_ready'
  | 'atlas_queued'
  | 'atlas_generating'
  | 'atlas_ready'
  | 'atlas_failed'
  | 'cancelled'

// ── Advanced Spectral Atlas ───────────────────────────────────────────────────

/**
 * Four panels produced by generate_spectral_atlas.py.
 * Each panel ID corresponds to a fixed visual interpretation.
 */
export type SpectralAtlasPanel =
  | 'anomaly_score'
  | 'priority_classes'
  | 'threshold_ambiguity_proxy'
  | 'p95_footprint'

/**
 * Human-readable panel titles — always use these in UI, never invent alternatives.
 * Source: deliverables/agrispectraq_integration_package/frontend/atlas_types.ts
 */
export const ATLAS_PANEL_TITLES: Record<SpectralAtlasPanel, string> = {
  anomaly_score:              'Spectral anomaly score — RMS standardized deviation',
  priority_classes:           'Relative spectral-priority classes',
  threshold_ambiguity_proxy:  'Threshold ambiguity proxy — not measurement uncertainty',
  p95_footprint:              'P95 high-priority footprint',
}

/**
 * Mandatory disclaimer — must appear alongside every atlas rendering.
 */
export const ATLAS_CAVEAT =
  'Relative prioritisation only; field verification required.' as const

/**
 * Atlas artifact descriptor returned by the API.
 */
export interface SpectralAtlasArtifact {
  png?: string
  pdf?: string
  generator?: string
  panels: 4
  interpretation: typeof ATLAS_CAVEAT
}

/**
 * Full atlas manifest — mirrors generate_spectral_atlas.py output manifest.
 */
export interface SpectralAtlasManifest {
  scene: string
  run_id?: string
  crs: string
  thresholds?: {
    p50?: number
    p80?: number
    p95?: number
  }
  panels: Array<{
    id: SpectralAtlasPanel
    title: string
    unit: string
    caveat: string
  }>
  source_artifacts: string[]
  generated_at?: string
}

/**
 * Run with atlas status — returned by GET /api/runs/{run_id}
 */
export interface RunWithAtlas {
  run_id: string
  scene_id: string
  status: FullRunStatus
  progress?: number
  crs?: string
  available_artifacts?: string[]
  atlas?: {
    status: 'not_generated' | 'queued' | 'generating' | 'ready' | 'failed'
    image_url?: string | null
    download_url?: string | null
    generated_at?: string
    panels?: SpectralAtlasPanel[]
    disclaimer?: string
    crs?: string
    scene_id?: string
  }
  warnings?: string[]
}

/**
 * Returns true only when all required analysis artifacts are present and
 * the run is in `artifacts_ready` state — matching canGenerateAtlas() contract.
 */
export function canGenerateAtlas(run: RunWithAtlas): boolean {
  if (run.status !== 'artifacts_ready') return false
  const REQUIRED = ['risk_map.tif', 'priority_map.tif', 'scene_statistics.json', 'manifest.json'] as const
  const available = new Set(run.available_artifacts ?? [])
  return REQUIRED.every(name => available.has(name))
}

// ── Planet Tanager Experiment ─────────────────────────────────────────────────

/**
 * Planet Tanager validation status.
 * Blocked states MUST be shown to the user — never hidden behind a drawer.
 */
export interface TanagerValidationStatus {
  geospatial_integrity:          'PASS' | 'FAIL' | 'PENDING'
  independent_scene_validation:  'BLOCKED' | 'PASS' | 'FAIL' | 'PENDING'
  cross_sensor_consistency:      'BLOCKED' | 'PASS' | 'FAIL' | 'PENDING'
}

/**
 * Tanager source provenance card data — read from TANAGER_HDF5_METADATA.json.
 */
export interface TanagerProvenanceCard {
  file_name: string
  sha256?: string
  file_size_bytes?: number
  provider?: string
  acquisition_metadata?: Record<string, unknown>
  source_bands: number
  valid_bands: number
  dimensions: [number, number, number]  // [bands, rows, cols]
  resolution_m?: number
  crs: string
  data_source_type: 'Google Drive supplied HDF5' | 'official source' | string
  processing_date?: string
  scene_id?: string
  valid_pixel_fraction?: number
}

/**
 * Tanager geospatial integrity result — from TANAGER_GEOSPATIAL_INTEGRITY_REPORT.md
 * and repair_metrics.json.
 * These values validate raster-to-vector representation ONLY — not agricultural accuracy.
 */
export interface TanagerGeospatialIntegrity {
  zones_checked: number
  source_high_priority_pixels: number
  filtered_vectorized_pixels: number
  rasterize_back_false_positives: number
  rasterize_back_false_negatives: number
  iou: number
  precision: number
  recall: number
  f1: number
  note: string
}

/**
 * Analysis track in the Tanager experiment.
 */
export type TanagerTrack =
  | 'baseline_anomaly'
  | 'trust_anomaly'
  | 'reference_ambiguity'
  | 'ambiguity_v2'
  | 'priority_classes'
  | 'corrected_multipart_zones'

/**
 * Human-readable tab labels for each Tanager track.
 */
export const TANAGER_TRACK_LABELS: Record<TanagerTrack, string> = {
  baseline_anomaly:         'Baseline anomaly',
  trust_anomaly:            'TRUST anomaly',
  reference_ambiguity:      'Reference ambiguity',
  ambiguity_v2:             'Ambiguity v2',
  priority_classes:         'Priority classes',
  corrected_multipart_zones:'Corrected multipart zones',
}

/**
 * Key artifact file names for the Tanager experiment — from deliverables/tanager_trust_final/.
 * Always read actual names from the manifest rather than hard-coding in UI.
 */
export const TANAGER_ARTIFACT_NAMES = {
  baseline_anomaly:         'baseline_anomaly_score.tif',
  trust_anomaly:            'trust_anomaly_score.tif',
  ambiguity_proxy:          'ambiguity_proxy.tif',
  ambiguity_v2:             'ambiguity_v2_rank_robust.tif',
  priority_classes:         'trust_priority_classes.tif',
  valid_pixel_mask:         'valid_pixel_mask.tif',
  zones_csv:                'zones.csv',
  zones_geojson:            'zones.geojson',
  zones_corrected:          'zones_corrected_exact_multipart.geojson',
  metadata:                 'TANAGER_HDF5_METADATA.json',
  repair_metrics:           'repair_metrics.json',
  integrity_report:         'TANAGER_GEOSPATIAL_INTEGRITY_REPORT.md',
  atlas:                    'tanager_advanced_atlas.png',
} as const

/**
 * Mandatory warning for every Tanager result card.
 */
export const TANAGER_RESULT_CAVEAT =
  'Priority designation is not a confirmed crop diagnosis. Field inspection and independent agronomic evidence are required before intervention.' as const

/**
 * Global mandatory disclaimer — applies to ALL outputs on all pages.
 */
export const GLOBAL_SCIENTIFIC_DISCLAIMER =
  'AgriSpectra-Q produces relative hyperspectral evidence for agricultural inspection prioritization. Its outputs are not confirmed crop diagnoses. Independent field observations and agronomic review are required before intervention.' as const

export interface Scene {
  id: SceneId
  name: string
  dimensions: [number, number]
  bands: number
  resolution: number
  crs: string
  validPixels?: number
  nodataPercentage?: number
}

export interface Zone {
  zone_id: string
  scene: string
  rank: number
  priority_category: PriorityCategory
  mean_risk: number
  max_risk: number
  median_risk: number
  pixel_count: number
  area_m2?: number
  centroid_x?: number
  centroid_y?: number
  high_priority_pct?: number
  threshold_type: string
  recommendation: string
}

export interface SpectralEvidence {
  zone_id: string
  band_index: number
  wavelength?: number
  observed_mean: number
  reference_mean?: number
  deviation?: number
  spectral_metric: string
}

export interface InspectionBudget {
  budget_fraction: number
  selected_pixels: number
  positive_recall: number
  coverage_percentage: number
}

export interface RunMetadata {
  run_id: string
  mode: RunMode
  timestamp: string
  scene: SceneId
  dimensions: [number, number]
  bands: number
  crs: string
  validPixels: number
  nodataPercentage: number
  processingTime: number
  highPriorityZones: number
}

export interface AnalysisResult {
  run_id: string
  status: RunStatus
  scene: SceneId
  zones: Zone[]
  metadata?: RunMetadata
  error?: string
}

export interface MapLayer {
  id: string
  type: 'raster' | 'vector' | 'geojson'
  source: string
  visible: boolean
  opacity: number
}

export interface ChartData {
  label: string
  value: number
  color?: string
}

export interface Coordinates {
  lng: number
  lat: number
}

export interface BoundingBox {
  west: number
  south: number
  east: number
  north: number
}

export interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Polygon' | 'Point'
    coordinates: number[][] | number[]
  }
  properties: Record<string, unknown>
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}
