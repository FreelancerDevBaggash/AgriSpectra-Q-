'use client'

/**
 * IndependentReferencePanel
 * ─────────────────────────
 * Corroborating evidence panel for a completed analysis run.
 * Strictly read-only with respect to anomaly outputs — never creates a
 * combined score or establishes field ground truth.
 *
 * Props:
 *   runId   – AGRQ-LIVE-API-* or AGRQ-UPLOAD-* run identifier
 *   scene   – resolved scene name (e.g. "upload_738ccb03")
 *   apiBase – optional API base URL; defaults to "" (same origin)
 */

import { useEffect, useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReferenceEntry {
  id: string
  label: string
  short_label?: string
  status: 'Available' | 'Not Available' | string
  provider?: string
  evidence_type?: string
  does_not_prove?: string
}

interface IndexStats {
  status: string
  scene_mean?: number
  zone_mean?: number
  difference?: number
  zone_below_scene_median_pct?: number
  zone_valid_pixels?: number
  scene_valid_pixels?: number
  reason?: string
}

interface ReferenceResult {
  // Sentinel-2 / Landsat
  ndvi?: IndexStats
  ndre?: IndexStats
  ndmi?: IndexStats
  date?: string
  cloud_cover?: number
  item_id?: string
  qa_mask?: string
  // WorldCover
  worldcover_item?: string
  zones?: number
  zones_majority_cropland_pct?: number
  zone_area_weighted_cropland_fraction?: number
  // Reference polygons wrapper
  f1_score?: {
    status: string
    f1?: number
    precision?: number
    recall?: number
    evaluated_polygons?: number
    positive_reference_polygons?: number
    negative_reference_polygons?: number
    confusion_matrix?: { tp: number; tn: number; fp: number; fn: number }
    overlap_threshold?: number
    note?: string
    reason?: string
  }
}

interface ReferencePayload {
  status: 'Available' | 'Not Available' | string
  reason?: string
  reference?: {
    label?: string
    short_label?: string
    provider?: string
    evidence_type?: string
    does_not_prove?: string
  }
  result?: ReferenceResult
}

interface Props {
  runId: string
  scene: string
  apiBase?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'Available') {
    return (
      <span className="inline-flex items-center gap-1 text-2xs font-semibold
                       text-teal-700 bg-teal-50 border border-teal-200 rounded px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" aria-hidden="true" />
        Available
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-2xs font-medium
                     text-surface-400 bg-surface-100 border border-surface-200 rounded px-2 py-0.5">
      Not Available
    </span>
  )
}

/** A single labelled metric row */
function MetricRow({ label, value, sub, highlight }: {
  label: string
  value: string | number | null | undefined
  sub?: string
  highlight?: 'warn' | 'good' | 'neutral'
}) {
  const valueColor =
    highlight === 'warn'    ? 'text-gold-700'    :
    highlight === 'good'    ? 'text-teal-700'    :
    'text-surface-900'

  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5
                    border-b border-surface-50 last:border-0">
      <span className="text-xs text-surface-500 leading-snug">{label}</span>
      <span className={`text-xs font-semibold tabular-nums text-right ${valueColor}`}>
        {value ?? '—'}
        {sub && <span className="ml-1 font-normal text-surface-400">{sub}</span>}
      </span>
    </div>
  )
}

/** Render one index block (NDVI / NDRE / NDMI) */
function IndexBlock({ name, stats }: { name: string; stats: IndexStats }) {
  if (stats.status !== 'Available') return null

  const diff = stats.difference ?? 0
  const pct = stats.scene_mean
    ? ((diff / Math.abs(stats.scene_mean)) * 100)
    : null

  const highlight: 'warn' | 'good' | 'neutral' =
    diff < -0.05 ? 'warn' : diff > 0.05 ? 'good' : 'neutral'

  return (
    <div className="bg-surface-50 border border-surface-100 rounded-lg px-3 py-2.5">
      <p className="text-2xs font-bold text-surface-400 uppercase tracking-widest mb-1.5">
        {name}
      </p>
      <MetricRow label="Scene average" value={stats.scene_mean?.toFixed(4)} />
      <MetricRow
        label="Zone average"
        value={
          stats.zone_mean != null
            ? `${stats.zone_mean.toFixed(4)}${pct != null ? ` (${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)` : ''}`
            : null
        }
        highlight={highlight}
      />
      {stats.zone_below_scene_median_pct != null && (
        <MetricRow
          label="Zone pixels below median"
          value={`${stats.zone_below_scene_median_pct.toFixed(1)}%`}
          highlight={stats.zone_below_scene_median_pct > 60 ? 'warn' : 'neutral'}
        />
      )}
    </div>
  )
}

/** Format ISO date to a short readable form */
function fmtDate(iso?: string) {
  if (!iso) return null
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return iso.slice(0, 10) }
}

// ── Result renderers — one per reference type ─────────────────────────────────

function Sentinel2Result({ result, meta }: { result: ReferenceResult; meta: ReferencePayload['reference'] }) {
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500">
        {meta?.provider && <span>{meta.provider}</span>}
        {result.date && (
          <>
            <span className="text-surface-200 hidden sm:inline" aria-hidden="true">|</span>
            <span>Acquisition: <strong className="text-surface-700">{fmtDate(result.date)}</strong></span>
          </>
        )}
        {result.cloud_cover != null && (
          <>
            <span className="text-surface-200 hidden sm:inline" aria-hidden="true">|</span>
            <span>Cloud cover: <strong className="text-surface-700">{result.cloud_cover.toFixed(1)}%</strong></span>
          </>
        )}
      </div>

      {/* Index blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {result.ndvi && <IndexBlock name="NDVI" stats={result.ndvi} />}
        {result.ndre && <IndexBlock name="NDRE" stats={result.ndre} />}
      </div>

      {meta?.does_not_prove && (
        <p className="text-2xs text-gold-700 bg-gold-50 border border-gold-200 rounded px-3 py-2">
          ⚠ Does not prove: {meta.does_not_prove}
        </p>
      )}
    </div>
  )
}

function LandsatResult({ result, meta }: { result: ReferenceResult; meta: ReferencePayload['reference'] }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500">
        {meta?.provider && <span>{meta.provider}</span>}
        {result.date && (
          <>
            <span className="text-surface-200 hidden sm:inline" aria-hidden="true">|</span>
            <span>Acquisition: <strong className="text-surface-700">{fmtDate(result.date)}</strong></span>
          </>
        )}
        {result.cloud_cover != null && (
          <>
            <span className="text-surface-200 hidden sm:inline" aria-hidden="true">|</span>
            <span>Cloud cover: <strong className="text-surface-700">{result.cloud_cover.toFixed(1)}%</strong></span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {result.ndvi && <IndexBlock name="NDVI" stats={result.ndvi} />}
        {result.ndmi && <IndexBlock name="NDMI" stats={result.ndmi} />}
      </div>

      {result.qa_mask && (
        <p className="text-2xs text-surface-400">QA mask: {result.qa_mask}</p>
      )}

      {meta?.does_not_prove && (
        <p className="text-2xs text-gold-700 bg-gold-50 border border-gold-200 rounded px-3 py-2">
          ⚠ Does not prove: {meta.does_not_prove}
        </p>
      )}
    </div>
  )
}

function WorldCoverResult({ result, meta }: { result: ReferenceResult; meta: ReferencePayload['reference'] }) {
  const cropPct = result.zone_area_weighted_cropland_fraction != null
    ? (result.zone_area_weighted_cropland_fraction * 100).toFixed(1)
    : null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500">
        {meta?.provider && <span>{meta.provider}</span>}
        {result.worldcover_item && (
          <>
            <span className="text-surface-200 hidden sm:inline" aria-hidden="true">|</span>
            <span className="font-mono">{result.worldcover_item}</span>
          </>
        )}
      </div>

      <div className="bg-surface-50 border border-surface-100 rounded-lg px-3 py-2.5">
        <p className="text-2xs font-bold text-surface-400 uppercase tracking-widest mb-1.5">
          Cropland Overlap
        </p>
        <MetricRow
          label="Zones analysed"
          value={result.zones ?? '—'}
        />
        <MetricRow
          label="Area-weighted cropland fraction"
          value={cropPct != null ? `${cropPct}%` : '—'}
          highlight={
            result.zone_area_weighted_cropland_fraction != null
              ? result.zone_area_weighted_cropland_fraction > 0.5 ? 'good' : 'neutral'
              : 'neutral'
          }
        />
        {result.zones_majority_cropland_pct != null && (
          <MetricRow
            label="Zones majority cropland"
            value={`${result.zones_majority_cropland_pct.toFixed(1)}%`}
          />
        )}
      </div>

      {meta?.does_not_prove && (
        <p className="text-2xs text-gold-700 bg-gold-50 border border-gold-200 rounded px-3 py-2">
          ⚠ Does not prove: {meta.does_not_prove}
        </p>
      )}
    </div>
  )
}

function ReferencePolygonsResult({ result, meta }: { result: ReferenceResult; meta: ReferencePayload['reference'] }) {
  const f1 = result.f1_score

  if (!f1 || f1.status !== 'Available') {
    return (
      <div className="text-xs text-surface-500 bg-surface-50 border border-surface-100 rounded-lg px-3 py-3">
        <strong className="text-surface-700">Not Available</strong>
        {f1?.reason ? ` — ${f1.reason}` : ' — No labelled reference polygons were provided.'}
      </div>
    )
  }

  const cm = f1.confusion_matrix

  return (
    <div className="space-y-3">
      {meta?.provider && (
        <p className="text-xs text-surface-500">{meta.provider}</p>
      )}

      {/* F1 headline */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { label: 'F1 Score',  value: f1.f1   != null ? f1.f1.toFixed(3)        : '—' },
          { label: 'Precision', value: f1.precision != null ? f1.precision.toFixed(3) : '—' },
          { label: 'Recall',    value: f1.recall    != null ? f1.recall.toFixed(3)    : '—' },
        ] as const).map(({ label, value }) => (
          <div key={label} className="bg-surface-50 border border-surface-100 rounded-lg
                                      px-3 py-2.5 text-center">
            <p className="text-base font-bold tabular-nums text-surface-900">{value}</p>
            <p className="text-2xs text-surface-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Confusion matrix */}
      {cm && (
        <div className="bg-surface-50 border border-surface-100 rounded-lg px-3 py-2.5">
          <p className="text-2xs font-bold text-surface-400 uppercase tracking-widest mb-2">
            Confusion Matrix
          </p>
          <div className="grid grid-cols-2 gap-1.5 max-w-[200px]">
            {([
              { label: 'TP', value: cm.tp, color: 'text-teal-700' },
              { label: 'FP', value: cm.fp, color: 'text-gold-700' },
              { label: 'FN', value: cm.fn, color: 'text-gold-700' },
              { label: 'TN', value: cm.tn, color: 'text-surface-600' },
            ] as const).map(({ label, value, color }) => (
              <div key={label} className="border border-surface-200 rounded px-2 py-1 text-center">
                <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
                <span className="ml-1 text-2xs text-surface-400">{label}</span>
              </div>
            ))}
          </div>
          <MetricRow label="Evaluated polygons" value={f1.evaluated_polygons} />
          {f1.overlap_threshold != null && (
            <MetricRow label="Overlap threshold" value={`${(f1.overlap_threshold * 100).toFixed(0)}%`} />
          )}
        </div>
      )}

      {f1.note && (
        <p className="text-2xs text-surface-400 leading-relaxed">{f1.note}</p>
      )}

      {meta?.does_not_prove && (
        <p className="text-2xs text-gold-700 bg-gold-50 border border-gold-200 rounded px-3 py-2">
          ⚠ Does not prove: {meta.does_not_prove}
        </p>
      )}
    </div>
  )
}

/** Route to the correct renderer based on the reference id */
function ResultBody({ refId, payload }: { refId: string; payload: ReferencePayload }) {
  const result = payload.result
  const meta   = payload.reference

  if (!result) return null

  if (refId === 'sentinel2_timeseries') return <Sentinel2Result result={result} meta={meta} />
  if (refId === 'landsat_quality_masked') return <LandsatResult result={result} meta={meta} />
  if (refId === 'esa_worldcover') return <WorldCoverResult result={result} meta={meta} />
  if (refId === 'reference_polygons') return <ReferencePolygonsResult result={result} meta={meta} />

  // Unknown type — graceful fallback: key/value list
  return (
    <div className="bg-surface-50 border border-surface-100 rounded-lg px-3 py-2.5">
      {Object.entries(result).slice(0, 12).map(([k, v]) => (
        <MetricRow key={k} label={k} value={typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')} />
      ))}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function IndependentReferencePanel({ runId, scene, apiBase = '' }: Props) {
  const [references, setReferences] = useState<ReferenceEntry[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [payload, setPayload] = useState<ReferencePayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [open, setOpen] = useState(true)

  // ── Load catalog whenever runId / scene changes ───────────────────────────
  useEffect(() => {
    if (!runId || !scene) { setCatalogError('run_id or scene is missing.'); return }
    setCatalogError(null)
    setPayload(null)
    setSelectedId('')
    setReferences([])

    fetch(`${apiBase}/api/runs/${encodeURIComponent(runId)}/independent-references?scene=${encodeURIComponent(scene)}`)
      .then(r => r.json())
      .then((data) => {
        const refs: ReferenceEntry[] = data.references ?? []
        setReferences(refs)
        if (refs.length > 0) setSelectedId(refs[0].id)
      })
      .catch((err) => setCatalogError(String(err)))
  }, [runId, scene, apiBase])

  // ── Auto-load when card selection changes ─────────────────────────────────
  const prevId = useRef<string>('')
  useEffect(() => {
    if (!selectedId || selectedId === prevId.current) return
    prevId.current = selectedId
    loadReference(selectedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  function loadReference(refId: string) {
    if (!runId || !scene || !refId) return
    setLoading(true)
    setPayload(null)
    fetch(`${apiBase}/api/runs/${encodeURIComponent(runId)}/independent-references/${encodeURIComponent(refId)}?scene=${encodeURIComponent(scene)}`)
      .then(r => r.json())
      .then(setPayload)
      .catch((err) => setPayload({ status: 'Not Available', reason: String(err) }))
      .finally(() => setLoading(false))
  }

  const isAvailable = payload?.status === 'Available'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section aria-labelledby="indref-title">

      {/* ── Accordion trigger ── */}
      <button
        type="button"
        id="indref-title"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-semibold text-surface-500
                   hover:text-surface-800 transition-colors py-2 w-full text-left"
        aria-expanded={open}
        aria-controls="indref-body"
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        INDEPENDENT REFERENCES
      </button>

      {open && (
        <div
          id="indref-body"
          className="border border-surface-200 rounded-lg bg-white p-4 sm:p-5 mt-1
                     animate-fade-up-sm space-y-4"
        >

          {/* ── Disclaimer ── */}
          <div className="flex items-start gap-3 bg-teal-50 border border-teal-200
                          rounded-lg px-3 py-2.5 text-xs text-teal-800">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="flex-shrink-0 mt-0.5 text-teal-600" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>
              <strong>Corroborating evidence only.</strong>{' '}
              These references are independent of the EnMAP anomaly output.
              They do not create a combined score or establish field ground truth.
            </p>
          </div>

          {/* ── Catalog error ── */}
          {catalogError && (
            <div className="flex items-start gap-3 bg-gold-50 border border-gold-200
                            rounded-lg px-3 py-2.5 text-xs text-gold-800">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                className="flex-shrink-0 mt-0.5 text-gold-600" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="min-w-0 break-words">Not Available — {catalogError}</p>
            </div>
          )}

          {/* ── Source selector cards ── */}
          {references.length > 0 && (
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
              role="group"
              aria-label="Select reference source"
            >
              {references.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`text-left rounded-lg border px-3 py-3 transition-all duration-150
                              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                              focus-visible:ring-offset-1 ${
                    selectedId === r.id
                      ? 'border-primary-400 bg-primary-50 shadow-sm'
                      : 'border-surface-200 bg-white hover:border-primary-300 hover:bg-primary-50/40'
                  }`}
                  aria-pressed={selectedId === r.id}
                >
                  <p className={`text-xs font-semibold leading-snug mb-2 line-clamp-2 ${
                    selectedId === r.id ? 'text-primary-800' : 'text-surface-900'
                  }`}>
                    {r.short_label ?? r.label}
                  </p>
                  <StatusBadge status={r.status} />
                </button>
              ))}
            </div>
          )}

          {/* ── Result block ── */}
          {!catalogError && (
            <div className="border-t border-surface-100 pt-4">

              {/* Loading skeleton */}
              {loading && (
                <div className="space-y-2 animate-pulse" aria-busy="true" aria-label="Loading reference data">
                  <div className="h-3 bg-surface-100 rounded w-1/2" />
                  <div className="h-16 bg-surface-50 border border-surface-100 rounded-lg" />
                  <div className="h-16 bg-surface-50 border border-surface-100 rounded-lg" />
                </div>
              )}

              {/* Not Available */}
              {!loading && payload !== null && !isAvailable && (
                <div className="flex items-start gap-3 bg-surface-50 border border-surface-200
                                rounded-lg px-3 py-3 text-xs text-surface-500">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    className="flex-shrink-0 mt-0.5 text-surface-400" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  <p className="min-w-0 break-words">
                    <strong className="text-surface-700">Not Available</strong>
                    {payload.reason
                      ? ` — ${payload.reason}`
                      : ' — No precomputed result is available for this run and scene.'}
                  </p>
                </div>
              )}

              {/* Available result */}
              {!loading && isAvailable && payload && selectedId && (
                <ResultBody refId={selectedId} payload={payload} />
              )}

              {/* Empty state — nothing selected yet */}
              {!loading && payload === null && !catalogError && references.length > 0 && (
                <p className="text-xs text-surface-400 text-center py-4">
                  Select a reference source above to view its result.
                </p>
              )}

            </div>
          )}

        </div>
      )}
    </section>
  )
}
