'use client'

import { useEffect, useState, useCallback, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  MapPin, AlertTriangle, Download, RefreshCw,
  BarChart3, List, ArrowLeft, ExternalLink, Map as MapIcon, Layers
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import Map, { Source, Layer, Popup, NavigationControl, type MapRef, type MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { parseCSV } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

interface Zone {
  zone_id: string
  rank?: number             // display alias — may not exist in CSV
  priority_rank?: number    // actual CSV column name from engine
  priority_category: string
  mean_risk: number
  max_risk: number
  pixel_count: number
  recommendation: string
  threshold_type?: string
  high_priority_pct?: number
  area_m2?: number          // frontend alias
  approx_area_m2?: number   // actual CSV column name from engine
}

interface InspectionBudget {
  budget_fraction: number
  selected_pixels: number
  positive_recall: number
  coverage_percentage?: number
}

interface RunSummary {
  run_id: string
  mode: string
  scenes: string[]
  timestamp?: string
  limitations?: string[]
}

interface SceneStatistics {
  scene: string
  dimensions: [number, number]
  bands: number
  resolution_m: number
  valid_pixels: number
  total_pixels: number
  nodata_percentage: number
  crs: string
  processing_seconds: number
  priority_zone_count: number
  thresholds: {
    low_medium_q50: number
    medium_high_q80: number
    high_priority_q95: number
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://agrispectra-q-production-7bd0.up.railway.app'

function priorityColor(cat: string) {
  if (!cat) return 'bg-surface-100 text-surface-700'
  const c = cat.toLowerCase()
  if (c.includes('high')) return 'bg-red-100 text-risk-700'
  if (c.includes('medium')) return 'bg-amber-100 text-amber-700'
  if (c.includes('low')) return 'bg-green-100 text-spectral-700'
  return 'bg-blue-100 text-blue-700'
}

function priorityBorder(cat: string) {
  const c = (cat || '').toLowerCase()
  if (c.includes('high')) return 'border-l-red-500'
  if (c.includes('medium')) return 'border-l-amber-500'
  if (c.includes('low')) return 'border-l-green-500'
  return 'border-l-blue-500'
}

function riskBarColor(val: number) {
  if (val >= 2) return '#ef4444'
  if (val >= 1.5) return '#f97316'
  if (val >= 1) return '#eab308'
  return '#22c55e'
}

// ── Main Component ────────────────────────────────────────────────────────────

function DashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const runId = searchParams.get('run_id') ?? ''
  const scene = searchParams.get('scene') ?? 'scene_01_DT0000205230'

  const [summary, setSummary] = useState<RunSummary | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [budget, setBudget] = useState<InspectionBudget[]>([])
  const [sceneStats, setSceneStats] = useState<SceneStatistics | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geojson, setGeojson] = useState<any | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null)
  const [popupInfo, setPopupInfo] = useState<{ lng: number; lat: number; zone: Zone } | null>(null)
  const mapRef = useRef<MapRef>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'zones' | 'budget' | 'chart' | 'map'>('zones')
  const [techOpen, setTechOpen] = useState(false)
  // frozen: true means the backend was unreachable — we are showing a frozen demo fallback (spec §23.6)
  const [frozen, setFrozen] = useState(false)

  const load = useCallback(async () => {
    if (!runId) { setError('No run ID provided. Run an analysis first.'); setLoading(false); return }
    setLoading(true); setError(null); setFrozen(false)
    try {
      const [summaryRes, zonesRes, budgetRes] = await Promise.all([
        fetch(`${API_BASE}/api/runs/${runId}`),
        fetch(`${API_BASE}/api/runs/${runId}/zones`),
        fetch(`${API_BASE}/api/runs/${runId}/inspection`),
      ])

      if (!summaryRes.ok) throw new Error('Run not found. The backend may be offline.')
      // ── Backward compat: old run_summary.json may lack `mode` and `timestamp`
      const rawSummary = await summaryRes.json()
      setSummary({
        ...rawSummary,
        mode: rawSummary.mode ?? rawSummary.benchmark_note ?? 'LIVE ANALYSIS',
        timestamp: rawSummary.timestamp ?? rawSummary.created_at ?? undefined,
      })

      if (zonesRes.ok) {
        const zonesData = await zonesRes.json()
        const sceneFile = zonesData.files?.find((f: { scene: string; download: string }) => f.scene === scene)
        if (sceneFile) {
          const csvRes = await fetch(`${API_BASE}${sceneFile.download}`)
          if (csvRes.ok) setZones(parseCSV<Zone>(await csvRes.text()))

          // Fetch scene_statistics.json
          const statsRes = await fetch(`${API_BASE}/api/runs/${runId}/files/${scene}/scene_statistics.json`)
          if (statsRes.ok) setSceneStats(await statsRes.json())

          // Fetch zones.geojson for the interactive map
          const geoRes = await fetch(`${API_BASE}/api/runs/${runId}/files/${scene}/zones.geojson`)
          if (geoRes.ok) setGeojson(await geoRes.json())
        }
      }

      if (budgetRes.ok) {
        const budgetData = await budgetRes.json()
        const sceneFile = budgetData.files?.find((f: { scene: string; download: string }) => f.scene === scene)
        if (sceneFile) {
          const csvRes = await fetch(`${API_BASE}${sceneFile.download}`)
          if (csvRes.ok) {
            // ── Backward compat shim: old CSV uses `budget` / `proxy_positive_coverage`
            // New engine writes: `budget_fraction` / `positive_recall` / `coverage_percentage`
            const raw = parseCSV<Record<string, number>>(await csvRes.text())
            const normalised: InspectionBudget[] = raw.map(row => ({
              budget_fraction:    row.budget_fraction   ?? row.budget,
              selected_pixels:    row.selected_pixels,
              positive_recall:    row.positive_recall   ?? row.proxy_positive_coverage,
              coverage_percentage: row.coverage_percentage,
            }))
            setBudget(normalised)
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error occurred'
      // Detect network / CORS / fetch failures — backend unreachable → frozen fallback (spec §23.5–23.6)
      const isNetworkError = e instanceof TypeError || msg.toLowerCase().includes('offline') || msg.toLowerCase().includes('fetch')
      if (isNetworkError) {
        setFrozen(true)
        setError(null)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [runId, scene])

  useEffect(() => { load() }, [load])

  // Auto-fit map to GeoJSON bounds.
  // Runs when geojson loads OR when the map tab is first activated (map mounts lazily).
  // Uses a short rAF delay to ensure MapLibre has mounted before fitBounds is called.
  useEffect(() => {
    if (!geojson || activeTab !== 'map') return
    const id = requestAnimationFrame(() => {
      if (!mapRef.current) return
      const allCoords: number[][] = []
      for (const feat of (geojson.features ?? [])) {
        const geom = feat.geometry
        if (!geom) continue
        const flatten = (coords: unknown): void => {
          if (typeof (coords as number[])[0] === 'number') { allCoords.push(coords as number[]); return }
          for (const c of (coords as unknown[])) flatten(c)
        }
        flatten(geom.coordinates)
      }
      if (allCoords.length === 0) return
      // Filter to valid WGS-84 ranges — UTM coords (>360) must not reach fitBounds
      const valid = allCoords.filter(c =>
        c[0] >= -180 && c[0] <= 180 && c[1] >= -90 && c[1] <= 90
      )
      if (valid.length === 0) return
      const lngs = valid.map(c => c[0])
      const lats = valid.map(c => c[1])
      mapRef.current.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 40, duration: 600 }
      )
    })
    return () => cancelAnimationFrame(id)
  }, [geojson, activeTab])

  const highCount = zones.filter(z => z.priority_category?.toLowerCase().includes('high')).length
  const medCount = zones.filter(z => z.priority_category?.toLowerCase().includes('medium')).length
  const avgRisk = zones.length ? (zones.reduce((a, z) => a + (z.mean_risk || 0), 0) / zones.length).toFixed(2) : '—'

  // ── Frozen Fallback State — spec §23.5 + §23.6 ──
  if (frozen) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg border border-surface-200 p-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100 border border-surface-300 text-xs font-semibold text-surface-600 mb-5">
          <span className="w-2 h-2 rounded-full bg-surface-400" aria-hidden="true" />
          FROZEN DEMONSTRATION RESULT
        </div>
        <h2 className="text-lg font-semibold text-surface-900 mb-2">Live Analysis Unavailable</h2>
        <p className="text-surface-500 text-sm mb-1">
          The backend is not reachable. No new computation was executed.
        </p>
        <p className="text-surface-400 text-xs mb-6">
          This view displays a previously generated result for demonstration only. It is not a new live analysis.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/intelligence')} className="btn-outline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> New Analysis
          </button>
          <button onClick={load} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Retry
          </button>
        </div>
      </div>
    </div>
  )

  // ── Error State ──
  if (error) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-surface-900 mb-2">Dashboard Error</h2>
        <p className="text-surface-600 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/intelligence')} className="btn-outline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> New Analysis
          </button>
          <button onClick={load} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Retry
          </button>
        </div>
      </div>
    </div>
  )

  // ── Loading State ──
  if (loading) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center" role="status" aria-label="Loading analysis results">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" aria-hidden="true" />
        <p className="text-surface-600 font-medium">Loading analysis results…</p>
        <p className="text-surface-400 text-sm mt-1">Fetching zones and inspection data</p>
      </div>
    </div>
  )

  // Top zone for the "inspect first" decision summary
  const topZone = zones.length > 0 ? zones[0] : null

  return (
    <div className="min-h-screen bg-white">

      {/* ── Page Header — sticky below fixed nav ── */}
      <div className="bg-white border-b border-surface-200 sticky top-[var(--nav-height)] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-surface-400 mb-2" aria-label="Breadcrumb">
            <a href="/intelligence" className="hover:text-surface-700 transition-colors">Intelligence</a>
            <span aria-hidden="true">›</span>
            <span className="text-surface-600 font-medium">Dashboard</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/intelligence')}
                className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 transition-colors"
                aria-label="Back to Intelligence — select a new scene"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-surface-900">Decision Dashboard</h1>
                  <span className="badge badge-live text-xs inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true" /> LIVE ANALYSIS
                  </span>
                </div>
                <p className="text-xs text-surface-500 font-mono">Run: {runId} · Scene: {scene}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} className="btn-outline py-2 px-4 text-sm inline-flex items-center gap-2" aria-label="Refresh dashboard data">
                <RefreshCw className="w-4 h-4" aria-hidden="true" /> Refresh
              </button>
              <a
                href={`/export?run_id=${runId}&scene=${scene}`}
                className="btn-primary py-2 px-4 text-sm inline-flex items-center gap-2"
                aria-label="Export all run artifacts"
              >
                <Download className="w-4 h-4" aria-hidden="true" /> Export All
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── 1. DECISION SUMMARY — must come first per spec §6.5 / §10 ── */}
        <section>
          <p className="section-label mb-4">WHERE SHOULD I INSPECT FIRST?</p>
          {zones.length === 0 ? (
            <p className="text-sm text-surface-500">
              No high-priority spectral zones were generated for this run.
              This does not indicate biological health. It means that no connected region crossed
              the configured relative threshold.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 pb-6 border-b border-surface-100">
              {[
                { label: 'High-priority zones',  value: highCount,                                              unit: '' },
                { label: 'Top inspection focus', value: topZone?.zone_id ?? '—',                               unit: '' },
                { label: 'Total spectral zones', value: zones.length,                                          unit: '' },
                { label: 'Avg anomaly score',    value: avgRisk,                                               unit: 'σ' },
                { label: 'Scene coverage',       value: sceneStats ? sceneStats.valid_pixels.toLocaleString() : '—', unit: ' px' },
                { label: 'Processing time',      value: sceneStats ? sceneStats.processing_seconds.toFixed(1) : '—', unit: ' s' },
              ].map(({ label, value, unit }) => (
                <div key={label}>
                  <div className="text-xl font-bold text-surface-900 tabular-nums">{value}{unit}</div>
                  <div className="text-xs text-surface-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Run metadata — compact inline, below decision */}
        {summary && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500 -mt-4 pb-4 border-b border-surface-100">
            <span>Run mode: <strong className="text-surface-700">{summary.mode}</strong></span>
            <span className="text-surface-200">|</span>
            <span>Scenes: <strong className="text-surface-700">{summary.scenes?.map((s: unknown) => typeof s === 'string' ? s : (s as Record<string, unknown>)?.scene ?? '').join(', ')}</strong></span>
            {summary.timestamp && (
              <>
                <span className="text-surface-200">|</span>
                <span>Time: <strong className="text-surface-700">{new Date(summary.timestamp).toLocaleString()}</strong></span>
              </>
            )}
          </div>
        )}

        {/* ── 2. GEOSPATIAL OUTPUTS — download links to actual files ── */}
        <section>
          <p className="section-label mb-4">GEOSPATIAL OUTPUTS</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              {
                label: 'Zone Boundaries',
                sub:   'GeoJSON · georeferenced polygons',
                href:  `${API_BASE}/api/runs/${runId}/zones`,
                icon:  (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ),
              },
              {
                label: 'Inspection Budget',
                sub:   'CSV · recall vs budget fraction',
                href:  `${API_BASE}/api/runs/${runId}/inspection`,
                icon:  (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                ),
              },
              {
                label: 'Full Run Report',
                sub:   'JSON · run summary & metadata',
                href:  `${API_BASE}/api/runs/${runId}/report`,
                icon:  (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                ),
              },
            ].map(({ label, sub, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-white border border-surface-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/30 transition-colors group"
              >
                <span className="text-surface-400 group-hover:text-primary-600 transition-colors flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-surface-800 group-hover:text-primary-700 transition-colors">{label}</div>
                  <div className="text-xs text-surface-400">{sub}</div>
                </div>
                <Download className="w-3.5 h-3.5 text-surface-300 group-hover:text-primary-500 transition-colors ml-auto flex-shrink-0" aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        {/* ── 3. RANKED ZONES ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="section-label">RANKED SPECTRAL-PRIORITY ZONES</p>
            <div className="flex gap-1 bg-surface-50 border border-surface-200 rounded-lg p-0.5">
              {([
                { id: 'zones',  label: 'Zones',   icon: MapPin    },
                { id: 'map',    label: 'Map',     icon: MapIcon   },
                { id: 'chart',  label: 'Chart',   icon: BarChart3 },
                { id: 'budget', label: 'Budget',  icon: List      },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    activeTab === id
                      ? 'bg-white border border-surface-200 text-surface-900 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Zones tab */}
          {activeTab === 'zones' && (
            <div className="space-y-2">
              {zones.length === 0 ? (
                <div className="border border-surface-200 rounded-lg p-10 text-center text-surface-400 text-sm">
                  No spectral-priority zones found for this scene.
                </div>
              ) : zones.map((zone, idx) => (
                <div
                  key={zone.zone_id || idx}
                  className={`border-l-4 border border-surface-200 ${priorityBorder(zone.priority_category)} rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 bg-white`}
                >
                  <div
                    className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-sm font-bold text-surface-600 flex-shrink-0"
                    aria-label={`Rank ${zone.priority_rank ?? zone.rank ?? idx + 1}`}
                  >
                    <span aria-hidden="true">{zone.priority_rank ?? zone.rank ?? idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-surface-900 text-sm font-mono">{zone.zone_id}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityColor(zone.priority_category)}`}>
                        {zone.priority_category || 'Unknown'}
                      </span>
                      {(zone.priority_category || '').toLowerCase().includes('high') && (
                        <span className="text-xs text-red-600 font-medium">INSPECT FIRST</span>
                      )}
                    </div>
                    <p className="text-xs text-surface-600 leading-relaxed">{zone.recommendation || 'Spectral anomaly relative to scene baseline. Field verification required.'}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-surface-500 mt-1.5">
                      <span>Mean risk <strong className="text-surface-800">{typeof zone.mean_risk === 'number' ? zone.mean_risk.toFixed(3) : '—'}</strong></span>
                      <span>Max risk <strong className="text-surface-800">{typeof zone.max_risk === 'number' ? zone.max_risk.toFixed(3) : '—'}</strong></span>
                      <span>Pixels <strong className="text-surface-800">{zone.pixel_count ?? '—'}</strong></span>
                      {(zone.approx_area_m2 ?? zone.area_m2) != null && (
                        <span>Area <strong className="text-surface-800">{((zone.approx_area_m2 ?? zone.area_m2)! / 10000).toFixed(2)} ha</strong></span>
                      )}
                    </div>
                  </div>
                  <a
                    href={`/spectral-evidence?run_id=${runId}&scene=${scene}&zone_id=${encodeURIComponent(zone.zone_id)}`}
                    className="text-xs text-primary-600 hover:underline inline-flex items-center gap-1 flex-shrink-0"
                    aria-label={`View spectral evidence for zone ${zone.zone_id}`}
                  >
                    Evidence <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Chart tab */}
          {activeTab === 'chart' && (
            <div className="border border-surface-200 rounded-lg p-5 bg-white">
              {zones.length === 0 ? (
                <div className="text-center text-surface-400 py-16 text-sm">No data available</div>
              ) : (
                <figure>
                  <figcaption className="text-xs text-surface-500 mb-4">
                    Mean spectral-anomaly score — top 20 ranked zones (σ units above scene baseline).
                    Higher bars indicate stronger spectral deviation from the scene reference.
                  </figcaption>
                  {/* Screen-reader summary of top 3 zones */}
                  <p className="sr-only">
                    {`Bar chart showing mean risk scores. Top zone: ${zones[0]?.zone_id} with score ${zones[0]?.mean_risk?.toFixed(4) ?? '—'}. `
                     + (zones[1] ? `Second: ${zones[1].zone_id} score ${zones[1].mean_risk?.toFixed(4)}.` : '')
                     + (zones[2] ? ` Third: ${zones[2].zone_id} score ${zones[2].mean_risk?.toFixed(4)}.` : '')
                     + ` ${zones.length} zones total.`}
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={zones.slice(0, 20)} margin={{ top: 8, right: 16, left: 0, bottom: 56 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="zone_id" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: unknown) => [typeof v === 'number' ? v.toFixed(4) : String(v ?? ''), 'Mean risk'] as [string, string]} labelClassName="font-mono text-xs" />
                      <Bar dataKey="mean_risk" radius={[3, 3, 0, 0]}>
                        {zones.slice(0, 20).map((z, i) => (
                          <Cell key={i} fill={riskBarColor(z.mean_risk)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </figure>
              )}
            </div>
          )}

          {/* Budget tab */}
          {activeTab === 'budget' && (
            <div className="border border-surface-200 rounded-lg p-5 bg-white">
              <h3 className="text-sm font-semibold text-surface-800 mb-1">Pixel-Level Proxy Inspection Coverage</h3>
              <p className="text-xs text-surface-500 mb-4">
                At a given inspection budget fraction, what share of high-anomaly pixels are captured?
                This is a proxy recall metric — not disease recall or field inspection accuracy.
              </p>
              {budget.length === 0 ? (
                <div className="text-center text-surface-400 py-10 text-sm">
                  Inspection budget data unavailable for this run.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto mb-5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-100">
                          {['Budget', 'Selected pixels', 'Proxy recall', 'Coverage'].map(h => (
                            <th key={h} className="text-left py-2 px-3 text-xs font-medium text-surface-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-50">
                        {budget.map((row, i) => (
                          <tr key={i} className="hover:bg-surface-50 transition-colors">
                            <td className="py-2 px-3 font-medium text-surface-900">{typeof row.budget_fraction === 'number' ? `${(row.budget_fraction * 100).toFixed(0)}%` : '—'}</td>
                            <td className="py-2 px-3 text-surface-600">{row.selected_pixels ?? '—'}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-surface-100">
                                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(100, (row.positive_recall ?? 0) * 100)}%` }} />
                                </div>
                                <span className="text-surface-700 text-xs w-10 text-right">
                                  {typeof row.positive_recall === 'number' ? `${(row.positive_recall * 100).toFixed(1)}%` : '—'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-surface-600">
                              {typeof row.coverage_percentage === 'number' ? `${row.coverage_percentage.toFixed(1)}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <figure>
                    <figcaption className="sr-only">
                      Bar chart showing pixel-level proxy recall at each inspection budget fraction.
                      This is a proxy metric — not disease recall or field inspection accuracy.
                    </figcaption>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={budget} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="budget_fraction" tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                        <Tooltip formatter={(v: unknown) => [typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : String(v ?? ''), 'Proxy recall'] as [string, string]} />
                        <Bar dataKey="positive_recall" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </figure>
                </>
              )}
            </div>
          )}

          {/* Map tab — interactive MapLibre zone map */}
          {activeTab === 'map' && (
            <div className="border border-surface-200 rounded-lg overflow-hidden bg-surface-900" style={{ height: 480 }}>
              {!geojson ? (
                <div className="h-full flex items-center justify-center text-surface-400 text-sm">
                  <div className="text-center">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Zone geometry unavailable for this run.</p>
                    <p className="text-xs mt-1 opacity-60">zones.geojson was not produced or could not be loaded.</p>
                  </div>
                </div>
              ) : (
                <Map
                  ref={mapRef}
                  mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                  initialViewState={{ longitude: 54.4, latitude: 24.5, zoom: 8 }}
                  style={{ width: '100%', height: '100%' }}
                  interactiveLayerIds={['zones-fill']}
                  onMouseMove={(e: MapLayerMouseEvent) => {
                    const feat = e.features?.[0]
                    setHoveredZoneId(feat ? (feat.properties?.zone_id ?? null) : null)
                  }}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onClick={(e: MapLayerMouseEvent) => {
                    const feat = e.features?.[0]
                    if (!feat) { setSelectedZoneId(null); setPopupInfo(null); return }
                    const zoneId: string = feat.properties?.zone_id ?? ''
                    setSelectedZoneId(zoneId)
                    const matched = zones.find(z => z.zone_id === zoneId) ?? null
                    if (matched && e.lngLat) {
                      setPopupInfo({ lng: e.lngLat.lng, lat: e.lngLat.lat, zone: matched })
                      // Zoom to clicked zone bounds
                      if (feat.geometry?.type === 'Polygon' && mapRef.current) {
                        const coords = (feat.geometry as { type: string; coordinates: number[][][] }).coordinates[0]
                        const lngs = coords.map((c: number[]) => c[0])
                        const lats = coords.map((c: number[]) => c[1])
                        mapRef.current.fitBounds(
                          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
                          { padding: 80, duration: 600 }
                        )
                      }
                    }
                  }}
                >
                  <NavigationControl position="top-right" />

                  <Source id="zones" type="geojson" data={geojson}>
                    {/* Fill — colour by selection/hover */}
                    <Layer
                      id="zones-fill"
                      type="fill"
                      paint={{
                        'fill-color': [
                          'case',
                          ['==', ['get', 'zone_id'], selectedZoneId ?? ''], '#2090ff',
                          ['==', ['get', 'zone_id'], hoveredZoneId ?? ''],  '#f97316',
                          '#ef4444',
                        ],
                        'fill-opacity': [
                          'case',
                          ['==', ['get', 'zone_id'], selectedZoneId ?? ''], 0.75,
                          ['==', ['get', 'zone_id'], hoveredZoneId ?? ''],  0.65,
                          0.45,
                        ],
                      }}
                    />
                    {/* Outline */}
                    <Layer
                      id="zones-outline"
                      type="line"
                      paint={{
                        'line-color': [
                          'case',
                          ['==', ['get', 'zone_id'], selectedZoneId ?? ''], '#60b0ff',
                          '#ff6060',
                        ],
                        'line-width': [
                          'case',
                          ['==', ['get', 'zone_id'], selectedZoneId ?? ''], 2,
                          1,
                        ],
                      }}
                    />
                  </Source>

                  {/* Popup on selected zone */}
                  {popupInfo && (
                    <Popup
                      longitude={popupInfo.lng}
                      latitude={popupInfo.lat}
                      closeOnClick={false}
                      onClose={() => setPopupInfo(null)}
                      className="text-xs"
                      maxWidth="240px"
                    >
                      <div className="p-1 space-y-1">
                        <p className="font-bold text-surface-900 font-mono text-xs">{popupInfo.zone.zone_id}</p>
                        <p className="text-red-700 font-semibold text-xs">{popupInfo.zone.priority_category}</p>
                        <p className="text-surface-600 text-xs">Rank <strong>#{popupInfo.zone.priority_rank ?? popupInfo.zone.rank ?? '—'}</strong></p>
                        <p className="text-surface-600 text-xs">Score <strong>{typeof popupInfo.zone.mean_risk === 'number' ? popupInfo.zone.mean_risk.toFixed(3) : '—'} σ</strong></p>
                        {(popupInfo.zone.approx_area_m2 ?? popupInfo.zone.area_m2) != null && (
                          <p className="text-surface-600 text-xs">Area <strong>{((popupInfo.zone.approx_area_m2 ?? popupInfo.zone.area_m2)! / 10000).toFixed(2)} ha</strong></p>
                        )}
                        <p className="text-amber-700 text-2xs font-medium">Field verification required</p>
                        <a
                          href={`/spectral-evidence?run_id=${runId}&scene=${scene}&zone_id=${encodeURIComponent(popupInfo.zone.zone_id)}`}
                          className="text-primary-600 underline text-xs block mt-1"
                        >
                          View spectral evidence →
                        </a>
                      </div>
                    </Popup>
                  )}
                </Map>
              )}

              {/* Map legend */}
              {geojson && (
                <div className="absolute bottom-3 left-3 bg-surface-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white space-y-1 pointer-events-none">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> Selected zone</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" /> Hovered zone</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> High-priority zone</div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── 4. TECHNICAL DETAILS DRAWER — spec §21 ── */}
        <section>
          <button
            type="button"
            onClick={() => setTechOpen(o => !o)}
            className="flex items-center gap-2 text-xs font-semibold text-surface-500 hover:text-surface-800 transition-colors py-2"
            aria-expanded={techOpen}
            aria-controls="tech-drawer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={`transition-transform duration-200 ${techOpen ? 'rotate-90' : ''}`} aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            TECHNICAL DETAILS
          </button>

          {techOpen && (
            <div
              id="tech-drawer"
              className="border border-surface-200 rounded-lg bg-white p-5 mt-1 animate-fade-up-sm"
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-4 text-xs">

                {/* Run identity */}
                <div>
                  <p className="font-bold text-surface-400 uppercase tracking-widest mb-2">Run</p>
                  <div className="space-y-1">
                    <div><span className="text-surface-400">Run ID </span><code className="code">{runId}</code></div>
                    <div><span className="text-surface-400">Scene </span><code className="code">{scene}</code></div>
                    <div><span className="text-surface-400">Mode </span><strong className="text-surface-700">{summary?.mode ?? '—'}</strong></div>
                    {summary?.timestamp && (
                      <div><span className="text-surface-400">Timestamp </span><strong className="text-surface-700">{new Date(summary.timestamp).toLocaleString()}</strong></div>
                    )}
                  </div>
                </div>

                {/* Scene metadata */}
                {sceneStats && (
                  <div>
                    <p className="font-bold text-surface-400 uppercase tracking-widest mb-2">Scene</p>
                    <div className="space-y-1">
                      <div><span className="text-surface-400">Dimensions </span><strong className="text-surface-700">{sceneStats.dimensions?.[0]} × {sceneStats.dimensions?.[1]} px</strong></div>
                      <div><span className="text-surface-400">Bands </span><strong className="text-surface-700">{sceneStats.bands}</strong></div>
                      <div><span className="text-surface-400">Resolution </span><strong className="text-surface-700">{sceneStats.resolution_m} m/px</strong></div>
                      <div><span className="text-surface-400">CRS </span><code className="code">{sceneStats.crs}</code></div>
                      <div><span className="text-surface-400">Valid pixels </span><strong className="text-surface-700">{sceneStats.valid_pixels?.toLocaleString()}</strong></div>
                      <div><span className="text-surface-400">NoData </span><strong className="text-surface-700">{sceneStats.nodata_percentage?.toFixed(2)}%</strong></div>
                      <div><span className="text-surface-400">Proc. time </span><strong className="text-surface-700">{sceneStats.processing_seconds?.toFixed(2)} s</strong></div>
                    </div>
                  </div>
                )}

                {/* Thresholds */}
                {sceneStats?.thresholds && (
                  <div>
                    <p className="font-bold text-surface-400 uppercase tracking-widest mb-2">Thresholds</p>
                    <div className="space-y-1">
                      <div><span className="text-surface-400">P50 (low/medium) </span><strong className="text-surface-700">{sceneStats.thresholds.low_medium_q50?.toFixed(4)}</strong></div>
                      <div><span className="text-surface-400">P80 (medium/high) </span><strong className="text-surface-700">{sceneStats.thresholds.medium_high_q80?.toFixed(4)}</strong></div>
                      <div><span className="text-surface-400">P95 (high priority) </span><strong className="text-surface-700">{sceneStats.thresholds.high_priority_q95?.toFixed(4)}</strong></div>
                    </div>
                    <p className="text-surface-400 mt-2 leading-relaxed">
                      Scene-relative percentile thresholds — not absolute disease severity levels.
                    </p>
                  </div>
                )}

                {/* Engine */}
                <div>
                  <p className="font-bold text-surface-400 uppercase tracking-widest mb-2">Engine</p>
                  <div className="space-y-1">
                    <div><span className="text-surface-400">Name </span><strong className="text-surface-700">Windowed Spectral Anomaly Matrix</strong></div>
                    <div><span className="text-surface-400">Bands used </span><strong className="text-surface-700">32 of 224 (evenly spaced)</strong></div>
                    <div><span className="text-surface-400">Risk metric </span><strong className="text-surface-700">RMS standardised deviation (σ)</strong></div>
                  </div>
                </div>

                {/* Limitations */}
                {summary?.limitations && summary.limitations.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="font-bold text-surface-400 uppercase tracking-widest mb-2">Limitations</p>
                    <ul className="space-y-0.5">
                      {summary.limitations.map((l, i) => (
                        <li key={i} className="flex items-start gap-2 text-surface-500">
                          <span className="text-surface-300 flex-shrink-0 mt-0.5">—</span>
                          {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── 5. SCIENTIFIC CAVEAT — always visible ── */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-xs leading-relaxed">
            <strong>Field verification required.</strong> High-priority spectral zones are spectral-anomaly prioritisation
            signals — not confirmed disease, pest, or biological diagnoses. Do not act on this output without
            on-site agronomic inspection.
          </p>
        </div>

      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
