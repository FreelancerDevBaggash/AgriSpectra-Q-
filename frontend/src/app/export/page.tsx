'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Download, CheckCircle, XCircle, Loader2,
  FileJson, FileText, Map, BarChart3, AlertTriangle,
  Package, RefreshCw,
} from 'lucide-react'
import { API_BASE } from '@/lib/config'

// ── Reports / Export page — spec §6.14 + §17
// Displays actual generated artifacts for a run and allows individual + bulk download.
// Must identify each artifact as LIVE ANALYSIS.
// Must not create download links to missing files.

// ─── File-type metadata ───────────────────────────────────────────────────────
type ArtifactEntry = {
  key:   string
  label: string
  sub:   string
  ext:   string
}

const ARTIFACT_GROUPS: { group: string; files: ArtifactEntry[] }[] = [
  {
    group: 'Maps',
    files: [
      { key: 'risk_map.tif',     label: 'Risk Map',     sub: 'Float32 continuous spectral-anomaly score raster',   ext: 'GeoTIFF' },
      { key: 'priority_map.tif', label: 'Priority Map', sub: 'Uint8 categorical priority raster (1–4 classes)',    ext: 'GeoTIFF' },
    ],
  },
  {
    group: 'Zones',
    files: [
      { key: 'zones.geojson', label: 'Zone Boundaries', sub: 'Georeferenced priority zone polygons',              ext: 'GeoJSON' },
      { key: 'zones.csv',     label: 'Zone Table',      sub: 'Ranked zones — scores, areas, recommendations',     ext: 'CSV' },
    ],
  },
  {
    group: 'Evidence',
    files: [
      { key: 'spectral_evidence.csv', label: 'Spectral Evidence', sub: 'Band-level observed mean per zone',       ext: 'CSV' },
    ],
  },
  {
    group: 'Inspection',
    files: [
      { key: 'inspection_budget.csv', label: 'Inspection Budget', sub: 'Proxy recall at budget fractions 5–100%', ext: 'CSV' },
    ],
  },
  {
    group: 'Metadata',
    files: [
      { key: 'scene_statistics.json', label: 'Scene Statistics', sub: 'Dimensions, CRS, valid pixels, thresholds, timing', ext: 'JSON' },
      { key: 'metrics.json',          label: 'Engine Metrics',   sub: 'Risk definition and zone count',                    ext: 'JSON' },
      { key: 'manifest.json',         label: 'Run Manifest',     sub: 'Run identity, leakage-control, and output list',    ext: 'JSON' },
    ],
  },
]

// Icon by extension
function ExtIcon({ ext, className = 'w-4 h-4' }: { ext: string; className?: string }) {
  if (ext === 'GeoTIFF') return <Map className={className} aria-hidden="true" />
  if (ext === 'GeoJSON') return <Map className={className} aria-hidden="true" />
  if (ext === 'CSV')     return <BarChart3 className={className} aria-hidden="true" />
  return <FileJson className={className} aria-hidden="true" />
}

// Extension badge colours
function extBadgeClass(ext: string): string {
  if (ext === 'GeoTIFF') return 'bg-violet-50 text-violet-700 border-violet-200'
  if (ext === 'GeoJSON') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (ext === 'CSV')     return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return 'bg-surface-100 text-surface-600 border-surface-200'
}

// ─── Download helpers ─────────────────────────────────────────────────────────

/** Fetch-then-blob download — works across origins and avoids anchor-download CORS issues. */
async function downloadBlob(url: string, filename: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revoke so the browser has time to initiate the download
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000)
}

// ─── Per-file status ──────────────────────────────────────────────────────────
type DlState = 'idle' | 'downloading' | 'done' | 'error'

interface ArtifactStatus {
  key:       string
  available: boolean
  url:       string
  dlState:   DlState
}

// ─── Main content ─────────────────────────────────────────────────────────────
function ExportContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const runId = searchParams.get('run_id') ?? ''
  const scene = searchParams.get('scene') ?? 'scene_01_DT0000205230'

  const [statuses,  setStatuses]  = useState<ArtifactStatus[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [runMode,   setRunMode]   = useState<string>('LIVE ANALYSIS')
  const [timestamp, setTimestamp] = useState<string | null>(null)
  const [bulkState, setBulkState] = useState<'idle' | 'running' | 'done'>('idle')
  const bulkAbort = useRef(false)

  // ── Helper: update a single file's dlState ──
  const setDlState = useCallback((key: string, dlState: DlState) => {
    setStatuses(prev => prev.map(s => s.key === key ? { ...s, dlState } : s))
  }, [])

  // ── Check artifact availability ──
  const check = useCallback(async () => {
    if (!runId) { setError('No run ID provided. Run an analysis first.'); setLoading(false); return }
    setLoading(true); setError(null)

    try {
      // Load run summary for mode + timestamp
      const summaryRes = await fetch(`${API_BASE}/api/runs/${runId}`)
      if (summaryRes.ok) {
        const s = await summaryRes.json()
        if (s.mode)      setRunMode(s.mode)
        if (s.timestamp) setTimestamp(s.timestamp)
      }

      // HEAD-check each artifact (treat non-200 as unavailable)
      const allFiles = ARTIFACT_GROUPS.flatMap(g => g.files)
      const checks = await Promise.all(
        allFiles.map(async f => {
          const url = `${API_BASE}/api/runs/${runId}/files/${scene}/${f.key}`
          try {
            const r = await fetch(url, { method: 'HEAD' })
            return { key: f.key, available: r.ok, url, dlState: 'idle' as DlState }
          } catch {
            return { key: f.key, available: false, url, dlState: 'idle' as DlState }
          }
        })
      )
      setStatuses(checks)
    } catch {
      setError('Could not check artifact availability. The backend may be offline.')
    } finally {
      setLoading(false)
    }
  }, [runId, scene])

  useEffect(() => { check() }, [check])

  // ── Single file download ──
  const handleDownload = useCallback(async (st: ArtifactStatus, label: string, key: string) => {
    if (!st.available || st.dlState === 'downloading') return
    setDlState(key, 'downloading')
    try {
      await downloadBlob(st.url, `${runId}_${scene}_${key}`)
      setDlState(key, 'done')
    } catch {
      setDlState(key, 'error')
    }
  }, [runId, scene, setDlState])

  // ── Bulk download — sequential to avoid overwhelming the browser ──
  const handleDownloadAll = useCallback(async () => {
    if (bulkState === 'running') return
    setBulkState('running')
    bulkAbort.current = false

    const available = statuses.filter(s => s.available)
    for (const st of available) {
      if (bulkAbort.current) break
      setDlState(st.key, 'downloading')
      try {
        await downloadBlob(st.url, `${runId}_${scene}_${st.key}`)
        setDlState(st.key, 'done')
      } catch {
        setDlState(st.key, 'error')
      }
      // Small gap between downloads to avoid browser throttling
      await new Promise(r => setTimeout(r, 400))
    }

    // Also download report
    if (!bulkAbort.current) {
      try {
        await downloadBlob(`${API_BASE}/api/runs/${runId}/report`, `${runId}_report.json`)
      } catch { /* non-fatal */ }
    }

    setBulkState('done')
  }, [bulkState, statuses, runId, scene, setDlState])

  const availableCount = statuses.filter(s => s.available).length
  const downloadedCount = statuses.filter(s => s.dlState === 'done').length

  // ── Empty state ──
  if (!runId) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <FileText className="w-12 h-12 text-surface-300 mx-auto" />
        <p className="text-surface-600 text-sm">No run ID provided.</p>
        <Link href="/intelligence" className="btn-primary inline-flex items-center gap-2 text-sm">
          Run Live Analysis
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-surface-400 mb-4" aria-label="Breadcrumb">
            <Link href="/dashboard" className="hover:text-surface-700 transition-colors">Dashboard</Link>
            <span aria-hidden="true">›</span>
            <span className="text-surface-600 font-medium">Export</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="badge badge-live">
                  <span className="dot-live" aria-hidden="true" />
                  {runMode}
                </span>
                {!loading && (
                  <span className="text-xs text-surface-400 tabular-nums">
                    {availableCount} of {statuses.length} artifact{statuses.length !== 1 ? 's' : ''} available
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-surface-900 mb-1">Run Artifacts</h1>
              <p className="text-xs text-surface-500 font-mono">
                {runId} · {scene}
                {timestamp && ` · ${new Date(timestamp).toLocaleString()}`}
              </p>
            </div>

            {/* Actions row */}
            <div className="flex flex-wrap items-center gap-2 self-start">
              <button
                onClick={() => router.back()}
                className="btn-outline inline-flex items-center gap-2 text-sm"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Back
              </button>
              <button
                onClick={check}
                disabled={loading}
                className="btn-outline inline-flex items-center gap-2 text-sm"
                aria-label="Re-check artifact availability"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                Refresh
              </button>
              {!loading && availableCount > 0 && (
                <button
                  onClick={handleDownloadAll}
                  disabled={bulkState === 'running'}
                  className="btn-primary inline-flex items-center gap-2 text-sm"
                  aria-label={`Download all ${availableCount} available artifacts`}
                >
                  {bulkState === 'running' ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Package className="w-4 h-4" aria-hidden="true" />
                  )}
                  {bulkState === 'running'
                    ? `Downloading… ${downloadedCount}/${availableCount}`
                    : bulkState === 'done'
                    ? 'Downloaded ✓'
                    : `Download All (${availableCount})`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-start gap-3">
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-6">
            {ARTIFACT_GROUPS.map(({ group }) => (
              <section key={group} aria-label={`Loading ${group} artifacts`}>
                <div className="h-4 w-16 bg-surface-200 rounded animate-pulse mb-3" />
                <div className="bg-white rounded-lg border border-surface-200 divide-y divide-surface-100 overflow-hidden">
                  {[1, 2].map(i => (
                    <div key={i} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-4 h-4 rounded-full bg-surface-200 animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-32 bg-surface-200 rounded animate-pulse" />
                        <div className="h-2.5 w-52 bg-surface-100 rounded animate-pulse" />
                      </div>
                      <div className="h-7 w-24 bg-surface-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (

          /* ── Artifact groups ── */
          ARTIFACT_GROUPS.map(({ group, files }) => {
            const groupStatuses = files.map(f => statuses.find(s => s.key === f.key))
            const anyAvailable  = groupStatuses.some(s => s?.available)

            return (
              <section key={group}>
                <div className="flex items-center justify-between mb-3">
                  <p className="section-label">{group.toUpperCase()}</p>
                  {anyAvailable && (
                    <span className="text-xs text-surface-400">
                      {groupStatuses.filter(s => s?.available).length}/{files.length} available
                    </span>
                  )}
                </div>

                <div className="bg-white rounded-lg border border-surface-200 divide-y divide-surface-100 overflow-hidden">
                  {files.map((f, i) => {
                    const st        = groupStatuses[i]
                    const available = st?.available ?? false
                    const dlState   = st?.dlState ?? 'idle'

                    return (
                      <div
                        key={f.key}
                        className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                          available ? 'hover:bg-surface-50/60' : 'opacity-50'
                        }`}
                      >
                        {/* Availability indicator */}
                        <div className="flex-shrink-0">
                          {available
                            ? <CheckCircle className="w-4 h-4 text-emerald-500" aria-label="Available" />
                            : <XCircle    className="w-4 h-4 text-surface-300"  aria-label="Unavailable" />
                          }
                        </div>

                        {/* File icon */}
                        <div className={`flex-shrink-0 p-2 rounded-lg border ${
                          available ? 'bg-surface-50 border-surface-200 text-surface-500' : 'bg-surface-50 border-surface-100 text-surface-300'
                        }`}>
                          <ExtIcon ext={f.ext} className="w-4 h-4" />
                        </div>

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-surface-900">{f.label}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold border ${extBadgeClass(f.ext)}`}>
                              {f.ext}
                            </span>
                            <code className="text-2xs text-surface-400 font-mono bg-surface-50 border border-surface-200 px-1.5 py-0.5 rounded">
                              {f.key}
                            </code>
                          </div>
                          <p className="text-xs text-surface-500 leading-relaxed">{f.sub}</p>
                        </div>

                        {/* Download button or status */}
                        {available ? (
                          <button
                            onClick={() => handleDownload(st!, f.label, f.key)}
                            disabled={dlState === 'downloading'}
                            className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border font-medium transition-colors ${
                              dlState === 'done'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-default'
                                : dlState === 'error'
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : dlState === 'downloading'
                                ? 'bg-surface-50 border-surface-200 text-surface-500 cursor-wait'
                                : 'btn-outline'
                            }`}
                            aria-label={`Download ${f.label} (${f.ext})`}
                          >
                            {dlState === 'downloading' ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Downloading…</>
                            ) : dlState === 'done' ? (
                              <><CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Downloaded</>
                            ) : dlState === 'error' ? (
                              <><XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Retry</>
                            ) : (
                              <><Download className="w-3.5 h-3.5" aria-hidden="true" /> Download</>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-surface-400 flex-shrink-0 italic">Not in this run</span>
                        )}
                      </div>
                    )
                  })}

                  {!anyAvailable && (
                    <div className="px-5 py-4 text-xs text-surface-400 italic text-center">
                      No {group.toLowerCase()} artifacts were produced for this run.
                    </div>
                  )}
                </div>
              </section>
            )
          })
        )}

        {/* ── Full Run Report — separate endpoint ── */}
        {!loading && (
          <section>
            <p className="section-label mb-3">REPORT</p>
            <div className="bg-white rounded-lg border border-surface-200 overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50/60 transition-colors">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                <div className="flex-shrink-0 p-2 rounded-lg border bg-surface-50 border-surface-200 text-surface-500">
                  <FileJson className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-surface-900">Full Run Report</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold border ${extBadgeClass('JSON')}`}>
                      JSON
                    </span>
                    <code className="text-2xs text-surface-400 font-mono bg-surface-50 border border-surface-200 px-1.5 py-0.5 rounded">
                      run_summary.json
                    </code>
                  </div>
                  <p className="text-xs text-surface-500 leading-relaxed">
                    Run identity, mode, scene statistics, engine parameters, and limitations
                  </p>
                </div>
                <button
                  onClick={() => downloadBlob(`${API_BASE}/api/runs/${runId}/report`, `${runId}_report.json`).catch(() => null)}
                  className="btn-outline flex-shrink-0 inline-flex items-center gap-1.5 text-xs py-1.5 px-3"
                  aria-label="Download full run report JSON"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  Download
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Scientific caveat ── */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-amber-800 leading-relaxed">
            These are outputs of a <strong>Live Analysis</strong> run —
            spectral-anomaly prioritisation products only.
            They do <strong>not</strong> constitute a disease map, pest map, or biological diagnosis.
            All zones require <strong>field verification</strong> by a qualified agronomist before any action is taken.
          </p>
        </div>

      </div>
    </div>
  )
}

export default function ExportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" aria-label="Loading" />
      </div>
    }>
      <ExportContent />
    </Suspense>
  )
}
