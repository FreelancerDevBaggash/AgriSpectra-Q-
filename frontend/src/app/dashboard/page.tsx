'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  MapPin, AlertTriangle, CheckCircle, Download, RefreshCw,
  BarChart3, List, ArrowLeft, Satellite, TrendingUp, Layers
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

// ── Types ────────────────────────────────────────────────────────────────────

interface Zone {
  zone_id: string
  rank: number
  priority_category: string
  mean_risk: number
  max_risk: number
  pixel_count: number
  recommendation: string
  threshold_type?: string
  high_priority_pct?: number
  area_m2?: number
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

// ── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8765'

function priorityColor(cat: string) {
  if (!cat) return 'bg-gray-100 text-gray-700'
  const c = cat.toLowerCase()
  if (c.includes('high')) return 'bg-red-100 text-red-700'
  if (c.includes('medium')) return 'bg-amber-100 text-amber-700'
  if (c.includes('low')) return 'bg-green-100 text-green-700'
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

function parseCSV<T>(text: string): T[] {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',')
    const obj: Record<string, string | number> = {}
    headers.forEach((h, i) => {
      const v = values[i]?.trim() ?? ''
      obj[h] = isNaN(Number(v)) || v === '' ? v : Number(v)
    })
    return obj as unknown as T
  })
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'zones' | 'budget' | 'chart'>('zones')

  const load = useCallback(async () => {
    if (!runId) { setError('No run ID provided. Run an analysis first.'); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const [summaryRes, zonesRes, budgetRes] = await Promise.all([
        fetch(`${API_BASE}/api/runs/${runId}`),
        fetch(`${API_BASE}/api/runs/${runId}/zones`),
        fetch(`${API_BASE}/api/runs/${runId}/inspection`),
      ])

      if (!summaryRes.ok) throw new Error('Run not found. The backend may be offline.')
      setSummary(await summaryRes.json())

      if (zonesRes.ok) {
        const zonesData = await zonesRes.json()
        const sceneFile = zonesData.files?.find((f: { scene: string; download: string }) => f.scene === scene)
        if (sceneFile) {
          const csvRes = await fetch(`${API_BASE}${sceneFile.download}`)
          if (csvRes.ok) setZones(parseCSV<Zone>(await csvRes.text()))
        }
      }

      if (budgetRes.ok) {
        const budgetData = await budgetRes.json()
        const sceneFile = budgetData.files?.find((f: { scene: string; download: string }) => f.scene === scene)
        if (sceneFile) {
          const csvRes = await fetch(`${API_BASE}${sceneFile.download}`)
          if (csvRes.ok) setBudget(parseCSV<InspectionBudget>(await csvRes.text()))
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [runId, scene])

  useEffect(() => { load() }, [load])

  const highCount = zones.filter(z => z.priority_category?.toLowerCase().includes('high')).length
  const medCount = zones.filter(z => z.priority_category?.toLowerCase().includes('medium')).length
  const avgRisk = zones.length ? (zones.reduce((a, z) => a + (z.mean_risk || 0), 0) / zones.length).toFixed(2) : '—'

  // ── Error State ──
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Dashboard Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/intelligence')} className="btn-outline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> New Analysis
          </button>
          <button onClick={load} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    </div>
  )

  // ── Loading State ──
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading analysis results…</p>
        <p className="text-gray-400 text-sm mt-1">Fetching zones and inspection data</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/intelligence')}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-gray-900">Analysis Dashboard</h1>
                  <span className="badge badge-live text-xs inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> LIVE
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono">Run: {runId} · Scene: {scene}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="btn-outline py-2 px-4 text-sm inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <a
                href={`${API_BASE}/api/runs/${runId}/report`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-2 px-4 text-sm inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Layers, label: 'Total Zones', value: zones.length, sub: 'detected', color: 'text-primary-600', bg: 'bg-primary-50' },
            { icon: AlertTriangle, label: 'High Priority', value: highCount, sub: 'zones', color: 'text-red-600', bg: 'bg-red-50' },
            { icon: TrendingUp, label: 'Medium Priority', value: medCount, sub: 'zones', color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: BarChart3, label: 'Avg Risk Score', value: avgRisk, sub: 'σ units', color: 'text-secondary-600', bg: 'bg-secondary-50' },
          ].map(({ icon: Icon, label, value, sub, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bg} ${color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm font-medium text-gray-700">{label}</div>
              <div className="text-xs text-gray-400">{sub}</div>
            </div>
          ))}
        </div>

        {/* Run Metadata */}
        {summary && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-gray-500">Run Mode:</span>
              <span className="font-medium text-gray-800">{summary.mode}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">Scenes:</span>
              <span className="font-medium text-gray-800">{summary.scenes?.join(', ')}</span>
              {summary.timestamp && <>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">Time:</span>
                <span className="font-medium text-gray-800">{new Date(summary.timestamp).toLocaleString()}</span>
              </>}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 w-fit">
          {([
            { id: 'zones', label: 'Priority Zones', icon: MapPin },
            { id: 'chart', label: 'Risk Chart', icon: BarChart3 },
            { id: 'budget', label: 'Inspection Budget', icon: List },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'zones' && (
          <div className="space-y-3">
            {zones.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No zones found for this scene.</p>
              </div>
            ) : (
              zones.map((zone, idx) => (
                <div
                  key={zone.zone_id || idx}
                  className={`bg-white rounded-xl border-l-4 border border-gray-200 ${priorityBorder(zone.priority_category)} p-5 flex flex-col sm:flex-row sm:items-center gap-4`}
                >
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600">
                      #{zone.rank ?? idx + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{zone.zone_id}</h3>
                      <span className={`badge text-xs ${priorityColor(zone.priority_category)}`}>
                        {zone.priority_category || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 leading-relaxed">{zone.recommendation || 'No recommendation available.'}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Mean Risk: <strong className="text-gray-800">{typeof zone.mean_risk === 'number' ? zone.mean_risk.toFixed(3) : '—'}</strong></span>
                      <span>Max Risk: <strong className="text-gray-800">{typeof zone.max_risk === 'number' ? zone.max_risk.toFixed(3) : '—'}</strong></span>
                      <span>Pixels: <strong className="text-gray-800">{zone.pixel_count ?? '—'}</strong></span>
                      {zone.area_m2 != null && (
                        <span>Area: <strong className="text-gray-800">{(zone.area_m2 / 10000).toFixed(2)} ha</strong></span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div
                      className="w-4 h-12 rounded-full"
                      style={{ background: riskBarColor(zone.mean_risk) }}
                      title={`Risk: ${zone.mean_risk}`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" /> Zone Risk Scores (Top 20)
            </h3>
            {zones.length === 0 ? (
              <div className="text-center text-gray-400 py-16">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={zones.slice(0, 20)} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="zone_id"
                    tick={{ fontSize: 10 }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(4), 'Mean Risk']}
                    labelClassName="font-mono text-xs"
                  />
                  <Bar dataKey="mean_risk" radius={[4, 4, 0, 0]}>
                    {zones.slice(0, 20).map((z, i) => (
                      <Cell key={i} fill={riskBarColor(z.mean_risk)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <List className="w-5 h-5 text-primary-600" /> Inspection Budget Allocation
            </h3>
            {budget.length === 0 ? (
              <div className="text-center text-gray-400 py-16">No budget data available</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Budget %</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Selected Pixels</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Positive Recall</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Coverage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {budget.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900">{typeof row.budget_fraction === 'number' ? `${(row.budget_fraction * 100).toFixed(0)}%` : '—'}</td>
                          <td className="py-3 px-4 text-gray-600">{row.selected_pixels ?? '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-primary-500"
                                  style={{ width: `${Math.min(100, (row.positive_recall ?? 0) * 100)}%` }}
                                />
                              </div>
                              <span className="text-gray-700 text-xs w-10 text-right">
                                {typeof row.positive_recall === 'number' ? `${(row.positive_recall * 100).toFixed(1)}%` : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {typeof row.coverage_percentage === 'number' ? `${row.coverage_percentage.toFixed(1)}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ResponsiveContainer width="100%" height={200} className="mt-6">
                  <BarChart data={budget} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="budget_fraction" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Recall']} />
                    <Bar dataKey="positive_recall" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        )}

        {/* Scientific note */}
        <div className="mt-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800">
            <strong>Decision Support Only:</strong> Priority zones require field verification.
            Spectral-anomaly scores are not a confirmed disease or pest diagnosis.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
