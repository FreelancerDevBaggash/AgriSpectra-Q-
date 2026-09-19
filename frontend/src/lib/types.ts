/**
 * Type definitions for AgriSpectra-Q
 */

export type SceneId = 'scene_01_DT0000205230' | 'scene_02' | 'scene_03'

export type RunMode = 'LIVE_ANALYSIS' | 'FROZEN_SCIENTIFIC_BENCHMARK'

export type PriorityCategory = 'HIGH PRIORITY' | 'MEDIUM PRIORITY' | 'LOW PRIORITY' | 'ABSTAIN / HUMAN REVIEW'

export type RunStatus = 'queued' | 'running' | 'completed' | 'failed'

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
