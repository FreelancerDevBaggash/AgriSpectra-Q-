/**
 * API Client for AgriSpectra-Q Backend
 *
 * apiClient     → Demo API  (https://api.agrispectra-q.cloud)   default
 * prodApiClient → Prod API  (https://prod.agrispectra-q.cloud)  upload-only
 */

import { API_BASE, PROD_API_BASE } from './config'
const API_BASE_URL = API_BASE

// ── Upload types ─────────────────────────────────────────────────────────────

export interface UploadProgressEvent {
  /** 0–100 upload percentage (null when length is not computable) */
  uploadPct:   number | null
  /** Bytes transferred so far */
  loaded:      number
  /** Total bytes (0 if unknown) */
  total:       number
  /** Current transfer speed in bytes/s (rolling 2-second window) */
  speedBps:    number
  /** Estimated seconds remaining (Infinity when unknown) */
  etaSec:      number
}

export interface UploadHandle {
  /** Promise that resolves with the AnalysisResponse or rejects with an Error */
  promise: Promise<AnalysisResponse>
  /** Call this to cancel the in-flight XHR (upload phase only).
   *  For cancelling a processing run use apiClient.abortRun(runId). */
  abort:   () => void
}

export interface ApiError {
  error: string
  details?: Record<string, unknown>
}

export interface AnalysisRequest {
  scene: 'scene_01_DT0000205230' | 'scene_02' | 'scene_03'
}

export interface AnalysisResponse {
  run_id: string
  scene?: string
  path?: string
  status: 'completed' | 'failed' | 'processing'
  error?: string
}

export interface RunSummary {
  run_id: string
  mode: string   // backend sends "LIVE ANALYSIS" (with space) — keep as string for flexibility
  scenes: string[]
  timestamp?: string
  limitations?: string[]
}

export interface ZoneFile {
  scene: string
  path: string
  download: string
}

export interface ZonesResponse {
  run_id: string
  live: boolean
  files: ZoneFile[]
}

export interface Zone {
  zone_id: string
  scene: string
  rank: number
  priority_category: string
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

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unknown error occurred')
    }
  }

  /**
   * Get API service information
   */
  async getServiceInfo() {
    return this.request<{
      service: string
      mode: string
      benchmark_note: string
      endpoints: string[]
    }>('/')
  }

  /**
   * Start a live analysis
   */
  async runAnalysis(scene: string): Promise<AnalysisResponse> {
    return this.request<AnalysisResponse>('/api/analyse', {
      method: 'POST',
      body: JSON.stringify({ scene }),
    })
  }

  /**
   * Get run summary
   */
  async getRunSummary(runId: string): Promise<RunSummary> {
    return this.request<RunSummary>(`/api/runs/${runId}`)
  }

  /**
   * Get zones for a run
   */
  async getZones(runId: string): Promise<ZonesResponse> {
    return this.request<ZonesResponse>(`/api/runs/${runId}/zones`)
  }

  /**
   * Get spectral evidence for a run
   */
  async getSpectralEvidence(runId: string): Promise<ZonesResponse> {
    return this.request<ZonesResponse>(`/api/runs/${runId}/spectral-evidence`)
  }

  /**
   * Get inspection budget for a run
   */
  async getInspectionBudget(runId: string): Promise<ZonesResponse> {
    return this.request<ZonesResponse>(`/api/runs/${runId}/inspection`)
  }

  /**
   * Get report for a run
   */
  async getReport(runId: string): Promise<RunSummary> {
    return this.request<RunSummary>(`/api/runs/${runId}/report`)
  }

  /**
   * Get file URL for download
   */
  getFileUrl(runId: string, scene: string, filename: string): string {
    return `${this.baseUrl}/api/runs/${runId}/files/${scene}/${filename}`
  }

  /**
   * Upload a GeoTIFF file and run the live engine on it.
   * Returns an UploadHandle with both the result promise and an abort() method.
   *
   * abort() cancels the XHR during the upload phase.  If called after the upload
   * has completed but the engine is still processing, call abortRun(runId) instead.
   */
  uploadAndAnalyse(
    file: File,
    onProgress?: (evt: UploadProgressEvent) => void,
  ): UploadHandle {
    let xhrRef: XMLHttpRequest | null = null

    const promise = new Promise<AnalysisResponse>((resolve, reject) => {
      const form = new FormData()
      form.append('file', file)

      const xhr = new XMLHttpRequest()
      xhrRef = xhr
      xhr.open('POST', `${this.baseUrl}/api/upload`)
      xhr.timeout = 0   // no timeout — large files (400MB+) can take >30 min on slow connections

      // ── Speed tracking (rolling 2-second window) ───────────────────────────
      let lastLoaded  = 0
      let lastTime    = Date.now()
      let rollingBps  = 0

      xhr.upload.onprogress = (e) => {
        if (!onProgress) return
        const now     = Date.now()
        const dtMs    = now - lastTime
        const dBytes  = e.loaded - lastLoaded

        if (dtMs >= 200) {                        // update at most every 200 ms
          rollingBps = dBytes / (dtMs / 1000)
          lastLoaded = e.loaded
          lastTime   = now
        }

        const pct     = e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : null
        const etaSec  = (e.lengthComputable && rollingBps > 0)
          ? Math.round((e.total - e.loaded) / rollingBps)
          : Infinity

        onProgress({
          uploadPct: pct,
          loaded:    e.loaded,
          total:     e.lengthComputable ? e.total : 0,
          speedBps:  rollingBps,
          etaSec,
        })
      }

      xhr.onload = () => {
        xhrRef = null
        try {
          const data = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data as AnalysisResponse)
          } else {
            reject(new Error(data?.error ?? `HTTP ${xhr.status}`))
          }
        } catch {
          reject(new Error(`Invalid JSON response (HTTP ${xhr.status})`))
        }
      }

      xhr.onerror   = () => { xhrRef = null; reject(new Error('Network error — cannot reach API server. Check your connection and try again.')) }
      xhr.ontimeout = () => { xhrRef = null; reject(new Error('Upload timed out. Try again on a faster connection.')) }
      xhr.onabort   = () => { xhrRef = null; reject(new Error('UPLOAD_ABORTED')) }

      xhr.send(form)
    })

    return {
      promise,
      abort: () => { if (xhrRef) { xhrRef.abort(); xhrRef = null } },
    }
  }

  /**
   * Signal the backend to abort an in-progress processing run.
   * Use this after the upload is done but processing hasn't completed yet.
   */
  async abortRun(runId: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/upload/abort/${encodeURIComponent(runId)}`, {
      method: 'POST',
    }).catch(() => { /* best-effort */ })
  }

  /**
   * Get upload constraints from the server
   */
  async getUploadInfo(): Promise<{ max_bytes: number; max_mb: number; allowed_extensions: string[] }> {
    return this.request('/api/upload/info')
  }

  /**
   * Request generation of the Advanced Spectral Atlas for a completed run.
   * Only call this after canGenerateAtlas(run) returns true.
   * Returns immediately with status 'atlas_queued' — poll GET /atlas for readiness.
   */
  async requestAtlas(runId: string, title?: string): Promise<{ run_id: string; status: string; job_id?: string }> {
    return this.request(`/api/runs/${runId}/atlas`, {
      method: 'POST',
      body: JSON.stringify({ title, format: 'png' }),
    })
  }

  /**
   * Get the current atlas status and image URL for a run.
   * Returns null image_url until status is 'atlas_ready'.
   * Cache key must be run_id — never reuse an atlas image from a different run.
   */
  async getAtlas(runId: string): Promise<{
    run_id: string
    scene_id?: string
    status: 'not_generated' | 'queued' | 'generating' | 'ready' | 'failed'
    format?: string
    image_url: string | null
    download_url?: string | null
    crs?: string
    generated_at?: string
    panels?: string[]
    disclaimer?: string
  }> {
    return this.request(`/api/runs/${runId}/atlas`)
  }

  /**
   * Get the full list of artifacts for a run, with metadata and download URLs.
   * Prefer this over building download URLs manually.
   */
  async getArtifacts(runId: string): Promise<{
    run_id: string
    artifacts: Array<{
      name: string
      kind: string
      mime_type: string
      size_bytes?: number
      sha256?: string
      ready: boolean
      download_url: string
    }>
  }> {
    return this.request(`/api/runs/${runId}/artifacts`)
  }

}

// ── Planet Tanager API client ─────────────────────────────────────────────────
// These endpoints are proposed contracts — do NOT show as live features until
// the backend implements and tests them.

export class TanagerApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    try {
      const response = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('An unknown error occurred')
    }
  }

  /**
   * Initiate a new Tanager experiment run.
   * The HDF5 file must be provided through the approved secure ingestion workflow.
   * Never expose a raw Google Drive URL here.
   */
  async createRun(payload: { source_reference: string; title?: string }): Promise<{ run_id: string; status: string }> {
    return this.request('/api/tanager/runs', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  /**
   * Get the current status and provenance of a Tanager run.
   */
  async getRun(runId: string): Promise<{
    run_id: string
    status: string
    scene_id?: string
    crs?: string
    created_at?: string
    provenance?: Record<string, unknown>
    validation?: {
      geospatial_integrity: string
      independent_scene_validation: string
      cross_sensor_consistency: string
    }
  }> {
    return this.request(`/api/tanager/runs/${runId}`)
  }

  /**
   * Get all artifacts for a Tanager run.
   */
  async getArtifacts(runId: string): Promise<{ run_id: string; artifacts: Array<{ name: string; download_url: string }> }> {
    return this.request(`/api/tanager/runs/${runId}/artifacts`)
  }

  /**
   * Get corrected multipart zones for a Tanager run.
   */
  async getZones(runId: string): Promise<unknown> {
    return this.request(`/api/tanager/runs/${runId}/zones`)
  }

  /**
   * Get spectral evidence for a Tanager run.
   */
  async getEvidence(runId: string): Promise<unknown> {
    return this.request(`/api/tanager/runs/${runId}/evidence`)
  }

  /**
   * Get the validation status report for a Tanager run.
   * Always exposes BLOCKED states — these are never hidden.
   */
  async getValidation(runId: string): Promise<{
    geospatial_integrity: 'PASS' | 'FAIL' | 'PENDING'
    independent_scene_validation: 'BLOCKED' | 'PASS' | 'FAIL' | 'PENDING'
    cross_sensor_consistency: 'BLOCKED' | 'PASS' | 'FAIL' | 'PENDING'
    geospatial_metrics?: {
      zones_checked: number
      iou: number
      precision: number
      recall: number
      f1: number
      rasterize_back_false_positives: number
      rasterize_back_false_negatives: number
    }
  }> {
    return this.request(`/api/tanager/runs/${runId}/validation`)
  }

  /**
   * Get a specific file by name from a Tanager run.
   * Returns a URL — do not build file URLs manually.
   */
  getFileUrl(runId: string, filename: string): string {
    return `${this.baseUrl}/api/tanager/runs/${runId}/files/${encodeURIComponent(filename)}`
  }
}

// Demo API — 3 pre-loaded EnMAP scenes, ~0.8 s response (default)
export const apiClient = new ApiClient(API_BASE)

// Production API — upload-only, runs real engine on user's GeoTIFF
export const prodApiClient = new ApiClient(PROD_API_BASE)

// Tanager API client (proposed — not yet live)
export const tanagerApiClient = new TanagerApiClient(API_BASE)

// Export class for custom instances
export { ApiClient }
