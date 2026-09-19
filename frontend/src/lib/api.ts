/**
 * API Client for AgriSpectra-Q Backend
 * Connects to Flask API at http://localhost:8765
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8765'

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
   * Uses multipart/form-data — do NOT set Content-Type header manually.
   */
  async uploadAndAnalyse(
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<AnalysisResponse> {
    return new Promise((resolve, reject) => {
      const form = new FormData()
      form.append('file', file)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${this.baseUrl}/api/upload`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onload = () => {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data as AnalysisResponse)
        } else {
          reject(new Error(data?.error ?? `HTTP ${xhr.status}`))
        }
      }

      xhr.onerror = () => reject(new Error('Network error — cannot reach API server.'))
      xhr.send(form)
    })
  }

  /**
   * Get upload constraints from the server
   */
  async getUploadInfo(): Promise<{ max_bytes: number; max_mb: number; allowed_extensions: string[] }> {
    return this.request('/api/upload/info')
  }

}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for custom instances
export { ApiClient }
