'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { ArrowLeft, AlertTriangle, RefreshCw, Download, FlaskConical } from 'lucide-react'
import { parseCSV } from '@/lib/utils'
import { API_BASE } from '@/lib/config'

// ── Types ────────────────────────────────────────────────────────────────────
// Data source: spectral_evidence.csv — spec §11 (Frontend Pages doc §11)

interface EvidenceRow {
  zone_id: string
  band_index: number
  observed_mean: number
  reference_mean?: number              // not in engine output (kept for forward compat)
  reference_mean_32band_only?: number  // actual CSV column name from engine
  deviation?: number
  wavelength_nm?: number
  wavelength_status?: string
}

interface ZoneRecord {
  zone_id: string
  rank: number
  priority_category: string
  mean_risk: number
  max_risk: number
  pixel_count: number
  recommendation: string
  threshold_type?: string
}

// API_BASE imported from @/lib/config — single source of truth

function priorityColor(cat: string) {
  const c = (cat || '').toLowerCase()
  if (c.includes('high'))   return 'text-red-700 bg-red-50'
  if (c.includes('medium')) return 'text-amber-700 bg-amber-50'
  if (c.includes('low'))    return 'text-green-700 bg-green-50'
  return 'text-blue-700 bg-blue-50'
}

// ── Main Component ────────────────────────────────────────────────────────────

function SpectralEvidenceContent() {
  const searchParams  = useSearchParams()
  const router        = useRouter()

  const runId    = searchParams.get('run_id')  ?? ''
  const scene    = searchParams.get('scene')   ?? 'scene_01_DT0000205230'
  const initZone = searchParams.get('zone_id') ?? ''

  const [allEvidence, setAllEvidence] = useState<EvidenceRow[]>([])
  const [allZones,    setAllZones]    = useState<ZoneRecord[]>([])
  const [selectedZone, setSelectedZone] = useState<string>(initZone)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!runId) {
      setError('No run ID provided. Return to Intelligence and run an analysis first.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      // Fetch spectral evidence CSV
      const evRes = await fetch(
        `${API_BASE}/api/runs/${runId}/files/${scene}/spectral_evidence.csv`
      )
      if (!evRes.ok) throw new Error('Spectral evidence artifact not found for this run.')
      const evText = await evRes.text()
      const rows   = parseCSV<EvidenceRow>(evText)
      setAllEvidence(rows)

      // Fetch zones CSV to get rank / priority / recommendation
      const zonesRes = await fetch(`${API_BASE}/api/runs/${runId}/zones`)
      if (zonesRes.ok) {
        const zonesData = await zonesRes.json()
        const sceneFile = zonesData.files?.find(
          (f: { scene: string; download: string }) => f.scene === scene
        )
        if (sceneFile) {
          const csvRes = await fetch(`${API_BASE}${sceneFile.download}`)
          if (csvRes.ok) {
            const zones = parseCSV<ZoneRecord>(await csvRes.text())
            setAllZones(zones)
            // Default selection: first zone if none specified — use functional updater to avoid stale closure
            setSelectedZone(prev => (prev || (zones.length > 0 ? zones[0].zone_id : '')))
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error loading evidence.')
    } finally {
      setLoading(false)
    }
  // selectedZone intentionally excluded — changing selected zone must not trigger a reload
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, scene])

  useEffect(() => { load() }, [load])

  const zoneIds     = [...new Set(allEvidence.map(r => r.zone_id))].sort()

  // Filter out NoData / non-finite rows before any rendering.
  // observed_mean can be NaN (nanmean over empty mask) or '' (CSV empty field).
  // reference_mean_32band_only is '' for non-32-band-aligned bands — treat as absent.
  const zoneEvidence = allEvidence.filter(r =>
    r.zone_id === selectedZone &&
    typeof r.observed_mean === 'number' &&
    isFinite(r.observed_mean)
  )
  const zoneRecord   = allZones.find(z => z.zone_id === selectedZone) ?? null

  // Chart data — band index + deviation bars.
  // reference_mean_32band_only is the actual engine column; fall back to reference_mean for future compat.
  // Only include reference value when it is a finite number — empty CSV fields parse as '' and must be omitted.
  const chartData = zoneEvidence.map(r => {
    const rawRef = r.reference_mean_32band_only ?? r.reference_mean
    const ref = typeof rawRef === 'number' && isFinite(rawRef) ? rawRef : undefined
    return {
      band:      r.band_index,
      observed:  r.observed_mean,
      reference: ref,
      deviation: typeof r.deviation === 'number' && isFinite(r.deviation) ? r.deviation : undefined,
    }
  })

  // ── Error State ──
  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-md w-full border border-red-200 rounded-lg p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-surface-900 mb-2">Evidence Unavailable</h2>
        <p className="text-surface-600 text-sm mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.back()}
            className="btn-outline inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={load}
            className="btn-primary inline-flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    </div>
  )

  // ── Loading State ──
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-surface-600 text-sm">
          Loading evidence for Zone {selectedZone || '…'}
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">

      {/* Page header */}
      <div className="border-b border-surface-200 bg-white sticky top-[var(--nav-height)] z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 transition-colors"
              aria-label="Go back to dashboard">
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-surface-900">Why Was This Zone Flagged?</h1>
                <FlaskConical className="w-4 h-4 text-spectral-600" />
              </div>
              <p className="text-xs text-surface-500 font-mono">Run: {runId} · Scene: {scene}</p>
            </div>
          </div>
          <a
            href={`${API_BASE}/api/runs/${runId}/files/${scene}/spectral_evidence.csv`}
            download
            className="btn-outline text-sm inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <Download className="w-4 h-4" /> Download Evidence CSV
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Zone selector + identity */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <label htmlFor="zone-select" className="block text-xs font-medium text-surface-500 uppercase tracking-wide mb-1">
              Select Zone
            </label>
            <select
              id="zone-select"
              value={selectedZone}
              onChange={e => setSelectedZone(e.target.value)}
              className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-300"
              aria-label="Select a zone to view its spectral evidence"
            >
              {zoneIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
          </div>
          {zoneRecord && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${priorityColor(zoneRecord.priority_category)}`}>
                {zoneRecord.priority_category}
              </span>
              <span className="text-surface-500">Rank <strong className="text-surface-900">#{zoneRecord.rank}</strong></span>
              <span className="text-surface-500">Mean risk <strong className="text-surface-900">{zoneRecord.mean_risk?.toFixed(3)}</strong></span>
              <span className="text-surface-500">Pixels <strong className="text-surface-900">{zoneRecord.pixel_count}</strong></span>
            </div>
          )}
        </div>

        {zoneEvidence.length === 0 ? (
          /* Empty state — spec §11 */
          <div className="border border-surface-200 rounded-lg p-10 text-center">
            <p className="text-surface-500 text-sm">Spectral evidence is unavailable for this zone.</p>
            <p className="text-surface-400 text-xs mt-1">No physical wavelength or band-level evidence should be inferred.</p>
          </div>
        ) : (
          <>
            {/* Spectral signature chart — two series: observed / reference */}
            <section>
              <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wide mb-1">
                Spectral Signature — Observed vs Reference
              </h2>
              <div className="border border-surface-200 rounded-lg p-4 bg-surface-50">
                <figure>
                  <figcaption className="text-xs text-surface-400 mb-4">
                    Grouped bar chart comparing observed mean (blue) vs reference mean (grey) per band index
                    (32-band representation). Physical wavelengths are not verified in the current artifact —
                    band indices only. Positive deviation indicates stronger signal than scene baseline.
                  </figcaption>
                  {/* Screen-reader summary — top deviation bands */}
                  {chartData.length > 0 && (
                    <p className="sr-only">
                      {`Spectral signature for zone ${selectedZone}. ${chartData.length} bands. `
                       + `Highest observed mean at band ${[...chartData].sort((a, b) => b.observed - a.observed)[0]?.band}.`}
                    </p>
                  )}
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="band" tick={{ fontSize: 10 }} label={{ value: 'Band index', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v: unknown, name: unknown) => [typeof v === 'number' ? v.toFixed(5) : String(v ?? ''), String(name ?? '')] as [string, string]}
                        labelFormatter={l => `Band ${l}`}
                      />
                      <ReferenceLine y={0} stroke="#94a3b8" />
                      <Bar dataKey="observed"  name="Observed mean"  fill="#3b82f6" radius={[2,2,0,0]} />
                      <Bar dataKey="reference" name="Reference mean" fill="#d1d5db" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-surface-500" aria-hidden="true">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Observed mean
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-surface-300 inline-block" /> Reference mean
                    </span>
                  </div>
                </figure>
              </div>
            </section>

            {/* Band-level evidence table */}
            <section>
              <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wide mb-3">
                Band-Level Evidence
              </h2>
              <div className="overflow-x-auto border border-surface-200 rounded-lg -mx-4 sm:mx-0">
                <table className="w-full text-sm min-w-[560px]">
                  <thead className="bg-surface-50 border-b border-surface-200">
                    <tr>
                      {['Band index', 'Observed mean', 'Reference mean', 'Deviation', 'Wavelength status'].map(h => (
                        <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-surface-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {zoneEvidence.map((row, i) => (
                      <tr key={i} className="hover:bg-surface-50 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-surface-700">{row.band_index}</td>
                        <td className="py-2.5 px-4 font-mono text-surface-900">{row.observed_mean.toFixed(5)}</td>
                        <td className="py-2.5 px-4 font-mono text-surface-600">
                          {(() => {
                            const raw = row.reference_mean_32band_only ?? row.reference_mean
                            const ref = typeof raw === 'number' && isFinite(raw) ? raw : null
                            return ref !== null ? ref.toFixed(5) : '—'
                          })()}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          {(() => {
                            const raw = row.reference_mean_32band_only ?? row.reference_mean
                            const ref = typeof raw === 'number' && isFinite(raw) ? raw : null
                            const devRaw = typeof row.deviation === 'number' && isFinite(row.deviation)
                              ? row.deviation
                              : ref !== null ? row.observed_mean - ref : null
                            if (devRaw === null) return <span className="text-surface-500">—</span>
                            return (
                              <span className={devRaw > 0 ? 'text-red-600' : devRaw < 0 ? 'text-blue-600' : 'text-surface-500'}>
                                {(devRaw > 0 ? '+' : '') + devRaw.toFixed(5)}
                              </span>
                            )
                          })()}
                        </td>
                        <td className="py-2.5 px-4 text-surface-500 text-xs">{row.wavelength_status ?? 'Not verified'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* Interpretation + recommendation */}
        {zoneRecord && (
          <section className="border-t border-surface-200 pt-6 space-y-3">
            <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wide">Interpretation</h2>
            <p className="text-sm text-surface-700 leading-relaxed">
              <strong className="text-surface-900">Spectral-priority candidate.</strong>{' '}
              {zoneRecord.recommendation || 'Zone exhibits spectral anomaly relative to the scene baseline.'}
            </p>
            <p className="text-xs text-surface-500">
              The underlying cause is not determined by the current analysis. Field verification required.
            </p>
          </section>
        )}

        {/* Scientific caveat — always visible */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-xs leading-relaxed">
            <strong>Field verification required.</strong> Spectral evidence available for this priority candidate.
            The underlying cause is not determined by the current analysis.
            Physical wavelength axis is not verified in the current artifact — band indices only.
          </p>
        </div>

      </div>
    </div>
  )
}

export default function SpectralEvidencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    }>
      <SpectralEvidenceContent />
    </Suspense>
  )
}
