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
  scene: string
  path: string
  status: 'completed' | 'failed'
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

}

// Demo API — 3 pre-loaded EnMAP scenes, ~0.8 s response (default)
export const apiClient = new ApiClient(API_BASE)

// Production API — upload-only, runs real engine on user's GeoTIFF
export const prodApiClient = new ApiClient(PROD_API_BASE)

// Export class for custom instances
export { ApiClient }
