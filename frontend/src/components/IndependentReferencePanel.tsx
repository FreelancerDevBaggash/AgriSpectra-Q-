'use client'

/**
 * IndependentReferencePanel
 * ─────────────────────────
 * Corroborating evidence panel for a completed analysis run.
 * Strictly read-only with respect to anomaly outputs — never creates a
 * combined score or establishes field ground truth.
 *
 * Data shape from get_reference():
 *   { status, reference, result: <full artifact JSON> }
 *
 * The artifact JSON written by auto_independent_validation.py has the shape:
 *   { run_id, scene, selected, result: { item_id, ndvi, ndre, … } }
 *
 * So the actual index data lives at  payload.result.result.*
 * We normalise this with extractInner() before rendering.
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

/** Normalised inner result — extracted from either result or result.result */
interface InnerResult {
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
  // Reference polygons
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
  // allow additional keys
  [key: string]: unknown
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
  // The full artifact JSON — actual data may be one level deeper at result.result
  result?: InnerResult & { result?: InnerResult }
}

interface Props {
  runId: string
  scene: string
  apiBase?: string
}

// ── Data normalisation ────────────────────────────────────────────────────────

/**
 * auto_independent_validation.py stores artifacts as:
 *   { run_id, scene, selected, result: { item_id, ndvi, … } }
 *
 * get_reference() wraps that whole file under payload.result, so the index
 * data ends up at payload.result.result.*
 *
 * This helper returns the deepest layer that actually contains the data.
 */
function extractInner(raw: ReferencePayload['result']): InnerResult | null {
  if (!raw) return null
  // If there is a nested result object that contains index data, prefer it
  const nested = raw.result
  if (nested && typeof nested === 'object') {
    // Has any index key at the nested level → use nested
    if (nested.ndvi || nested.ndre || nested.ndmi || nested.worldcover_item || nested.f1_score) {
      return nested as InnerResult
    }
  }
  // Otherwise the data is at the top level (legacy / fixture format)
  return raw as InnerResult
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'Available') {
    return (
      <span className="inline-flex items-center gap-1 text-2xs font-semibold
                       text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" aria-hidden="true" />
        Available
      </span>
    )
  }
  return (
    <span className="inline-flex items-center text-2xs font-medium
                     text-surface-400 bg-surface-100 border border-surface-200 rounded-full px-2 py-0.5">
      Not available
    </span>
  )
}

/** Format ISO date string to short human-readable form */
function fmtDate(iso?: string | null) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

/** Single key → value row inside an info block */
function Row({
  label, value, highlight,
}: {
  label: string
  value: string | number | null | undefined
  highlight?: 'warn' | 'good'
}) {
  const valClass =
    highlight === 'warn' ? 'text-gold-700 font-semibold' :
    highlight === 'good' ? 'text-teal-700 font-semibold' :
    'text-surface-900 font-semibold'

  return (
    <div className="flex items-center justify-between py-1.5
                    border-b border-surface-100 last:border-0 gap-4">
      <span className="text-xs text-surface-500 shrink-0">{label}</span>
      <span className={`text-xs tabular-nums text-right ${valClass}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

/** Compact section card: title + rows */
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-surface-200 bg-white overflow-hidden">
      <div className="px-3 py-2 bg-surface-50 border-b border-surface-100">
        <p className="text-2xs font-bold text-surface-500 uppercase tracking-widest">{title}</p>
      </div>
      <div className="px-3 py-1">{children}</div>
    </div>
  )
}

// ── Index block (NDVI / NDRE / NDMI) ─────────────────────────────────────────

function IndexBlock({ name, stats }: { name: string; stats: IndexStats }) {
  if (stats.status !== 'Available') {
    return (
      <InfoCard title={name}>
        <Row label="Status" value="Not available" />
        {stats.reason && <Row label="Reason" value={stats.reason} />}
      </InfoCard>
    )
  }

  const diff = stats.difference ?? 0
  const pct  = stats.scene_mean
    ? (diff / Math.abs(stats.scene_mean)) * 100
    : null

  const zoneValueStr =
    stats.zone_mean != null
      ? `${stats.zone_mean.toFixed(4)}${pct != null ? `  (${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)` : ''}`
      : null

  const highlight: 'warn' | 'good' | undefined =
    diff < -0.05 ? 'warn' : diff > 0.05 ? 'good' : undefined

  return (
    <InfoCard title={name}>
      <Row label="Scene average" value={stats.scene_mean?.toFixed(4)} />
      <Row label="Zone average"  value={zoneValueStr}  highlight={highlight} />
      {stats.zone_below_scene_median_pct != null && (
        <Row
          label="Zone pixels below median"
          value={`${stats.zone_below_scene_median_pct.toFixed(1)}%`}
          highlight={stats.zone_below_scene_median_pct > 60 ? 'warn' : undefined}
        />
      )}
    </InfoCard>
  )
}

// ── Per-source result renderers ───────────────────────────────────────────────

function MetaBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs
                    text-surface-500 mb-3">
      {children}
    </div>
  )
}

function Sep() {
  return <span className="text-surface-200 hidden sm:inline" aria-hidden="true">|</span>
}

function CautionNote({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 mt-3 bg-gold-50 border border-gold-200
                    rounded-lg px-3 py-2 text-2xs text-gold-800">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-gold-600"
        aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>Does not prove: {text}</span>
    </div>
  )
}

function Sentinel2Result({ inner, meta }: { inner: InnerResult; meta: ReferencePayload['reference'] }) {
  return (
    <div>
      <MetaBar>
        {meta?.provider && <span>{meta.provider}</span>}
        {inner.date && <><Sep /><span>Acquired: <strong className="text-surface-700">{fmtDate(inner.date)}</strong></span></>}
        {inner.cloud_cover != null && <><Sep /><span>Cloud: <strong className="text-surface-700">{(inner.cloud_cover as number).toFixed(1)}%</strong></span></>}
      </MetaBar>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {inner.ndvi && <IndexBlock name="NDVI" stats={inner.ndvi} />}
        {inner.ndre && <IndexBlock name="NDRE" stats={inner.ndre} />}
      </div>
      {meta?.does_not_prove && <CautionNote text={meta.does_not_prove} />}
    </div>
  )
}

function LandsatResult({ inner, meta }: { inner: InnerResult; meta: ReferencePayload['reference'] }) {
  return (
    <div>
      <MetaBar>
        {meta?.provider && <span>{meta.provider}</span>}
        {inner.date && <><Sep /><span>Acquired: <strong className="text-surface-700">{fmtDate(inner.date)}</strong></span></>}
        {inner.cloud_cover != null && <><Sep /><span>Cloud: <strong className="text-surface-700">{(inner.cloud_cover as number).toFixed(1)}%</strong></span></>}
      </MetaBar>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {inner.ndvi && <IndexBlock name="NDVI" stats={inner.ndvi} />}
        {inner.ndmi && <IndexBlock name="NDMI" stats={inner.ndmi} />}
      </div>
      {inner.qa_mask && (
        <p className="text-2xs text-surface-400 mt-2">QA mask: {inner.qa_mask as string}</p>
      )}
      {meta?.does_not_prove && <CautionNote text={meta.does_not_prove} />}
    </div>
  )
}

function WorldCoverResult({ inner, meta }: { inner: InnerResult; meta: ReferencePayload['reference'] }) {
  const frac = inner.zone_area_weighted_cropland_fraction as number | undefined
  const cropPct = frac != null ? `${(frac * 100).toFixed(1)}%` : null

  return (
    <div>
      <MetaBar>
        {meta?.provider && <span>{meta.provider}</span>}
        {inner.worldcover_item && <><Sep /><code className="font-mono text-2xs">{inner.worldcover_item as string}</code></>}
      </MetaBar>
      <InfoCard title="Cropland Overlap">
        <Row label="Zones analysed" value={inner.zones as number | undefined} />
        <Row
          label="Area-weighted cropland fraction"
          value={cropPct}
          highlight={frac != null ? (frac > 0.5 ? 'good' : undefined) : undefined}
        />
        {(inner.zones_majority_cropland_pct as number | undefined) != null && (
          <Row
            label="Zones majority cropland"
            value={`${(inner.zones_majority_cropland_pct as number).toFixed(1)}%`}
          />
        )}
      </InfoCard>
      {meta?.does_not_prove && <CautionNote text={meta.does_not_prove} />}
    </div>
  )
}

function ReferencePolygonsResult({ inner, meta }: { inner: InnerResult; meta: ReferencePayload['reference'] }) {
  const f1 = inner.f1_score

  if (!f1 || f1.status !== 'Available') {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-3 text-xs text-surface-500">
        <strong className="text-surface-700">Not Available</strong>
        {f1?.reason
          ? ` — ${f1.reason}`
          : ' — No labelled reference polygons were provided for this run.'}
      </div>
    )
  }

  const cm = f1.confusion_matrix

  return (
    <div>
      {meta?.provider && <p className="text-xs text-surface-500 mb-3">{meta.provider}</p>}

      {/* F1 / Precision / Recall headline */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'F1 Score',  v: f1.f1        },
          { label: 'Precision', v: f1.precision  },
          { label: 'Recall',    v: f1.recall     },
        ].map(({ label, v }) => (
          <div key={label}
            className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-3 text-center">
            <p className="text-lg font-bold tabular-nums text-surface-900 leading-none">
              {v != null ? v.toFixed(3) : '—'}
            </p>
            <p className="text-2xs text-surface-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Confusion matrix */}
      {cm && (
        <InfoCard title="Confusion Matrix">
          <div className="grid grid-cols-2 gap-2 py-2 max-w-[180px]">
            {[
              { k: 'TP', v: cm.tp, color: 'text-teal-700' },
              { k: 'FP', v: cm.fp, color: 'text-gold-700' },
              { k: 'FN', v: cm.fn, color: 'text-gold-700' },
              { k: 'TN', v: cm.tn, color: 'text-surface-600' },
            ].map(({ k, v, color }) => (
              <div key={k}
                className="border border-surface-200 rounded-lg py-2 text-center">
                <span className={`text-sm font-bold tabular-nums ${color}`}>{v}</span>
                <span className="ml-1 text-2xs text-surface-400">{k}</span>
              </div>
            ))}
          </div>
          <Row label="Evaluated polygons" value={f1.evaluated_polygons} />
          {f1.overlap_threshold != null && (
            <Row label="Overlap threshold"
              value={`${(f1.overlap_threshold * 100).toFixed(0)}%`} />
          )}
        </InfoCard>
      )}

      {f1.note && (
        <p className="text-2xs text-surface-400 leading-relaxed mt-2">{f1.note}</p>
      )}
      {meta?.does_not_prove && <CautionNote text={meta.does_not_prove} />}
    </div>
  )
}

/** Routes to the correct renderer by reference ID */
function ResultBody({
  refId, payload,
}: { refId: string; payload: ReferencePayload }) {
  const inner = extractInner(payload.result)
  const meta  = payload.reference

  if (!inner) return null

  if (refId === 'sentinel2_timeseries')   return <Sentinel2Result   inner={inner} meta={meta} />
  if (refId === 'landsat_quality_masked') return <LandsatResult     inner={inner} meta={meta} />
  if (refId === 'esa_worldcover')         return <WorldCoverResult  inner={inner} meta={meta} />
  if (refId === 'reference_polygons')     return <ReferencePolygonsResult inner={inner} meta={meta} />

  // Unknown type — generic key/value fallback
  return (
    <InfoCard title="Result">
      {Object.entries(inner).slice(0, 12).map(([k, v]) => (
        <Row key={k} label={k}
          value={typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')} />
      ))}
    </InfoCard>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function IndependentReferencePanel({ runId, scene, apiBase = '' }: Props) {
  const [references, setReferences] = useState<ReferenceEntry[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [payload,    setPayload]    = useState<ReferencePayload | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [catalogErr, setCatalogErr] = useState<string | null>(null)
  const [open,       setOpen]       = useState(true)

  // ── Fetch catalog ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!runId || !scene) { setCatalogErr('run_id or scene is missing.'); return }
    setCatalogErr(null); setPayload(null); setSelectedId(''); setReferences([])

    fetch(`${apiBase}/api/runs/${encodeURIComponent(runId)}/independent-references?scene=${encodeURIComponent(scene)}`)
      .then(r => r.json())
      .then(data => {
        const refs: ReferenceEntry[] = data.references ?? []
        setReferences(refs)
        if (refs.length > 0) setSelectedId(refs[0].id)
      })
      .catch(err => setCatalogErr(String(err)))
  }, [runId, scene, apiBase])

  // ── Auto-load on card selection ───────────────────────────────────────────
  const prevId = useRef<string>('')
  useEffect(() => {
    if (!selectedId || selectedId === prevId.current) return
    prevId.current = selectedId
    loadReference(selectedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  function loadReference(refId: string) {
    if (!runId || !scene || !refId) return
    setLoading(true); setPayload(null)
    fetch(`${apiBase}/api/runs/${encodeURIComponent(runId)}/independent-references/${encodeURIComponent(refId)}?scene=${encodeURIComponent(scene)}`)
      .then(r => r.json())
      .then(setPayload)
      .catch(err => setPayload({ status: 'Not Available', reason: String(err) }))
      .finally(() => setLoading(false))
  }

  const isAvailable = payload?.status === 'Available'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section aria-labelledby="indref-title">

      {/* Accordion trigger */}
      <button
        type="button"
        id="indref-title"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-semibold text-surface-500
                   hover:text-surface-800 transition-colors py-2 w-full text-left"
        aria-expanded={open}
        aria-controls="indref-body"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          aria-hidden="true">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        INDEPENDENT REFERENCES
      </button>

      {open && (
        <div id="indref-body"
          className="border border-surface-200 rounded-lg bg-white p-4 sm:p-5 mt-1
                     animate-fade-up-sm space-y-4">

          {/* Disclaimer */}
          <div className="flex items-start gap-3 bg-teal-50 border border-teal-200
                          rounded-lg px-3 py-2.5 text-xs text-teal-800">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="shrink-0 mt-0.5 text-teal-600" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>
              <strong>Corroborating evidence only.</strong>{' '}
              These references are independent of the EnMAP anomaly output.
              They do not create a combined score or establish field ground truth.
            </p>
          </div>

          {/* Catalog error */}
          {catalogErr && (
            <div className="flex items-start gap-2 bg-gold-50 border border-gold-200
                            rounded-lg px-3 py-2.5 text-xs text-gold-800">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                className="shrink-0 mt-0.5 text-gold-600" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="break-words">Not Available — {catalogErr}</p>
            </div>
          )}

          {/* Source selector cards */}
          {references.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
              role="group" aria-label="Select reference source">
              {references.map(r => {
                const active = selectedId === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`text-left rounded-xl border px-3 py-3 transition-all duration-150
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                                focus-visible:ring-offset-1 ${
                      active
                        ? 'border-primary-400 bg-primary-50 shadow-sm ring-1 ring-primary-200'
                        : 'border-surface-200 bg-white hover:border-primary-300 hover:bg-primary-50/40'
                    }`}
                    aria-pressed={active}
                  >
                    <p className={`text-xs font-semibold leading-snug mb-2.5 line-clamp-2 ${
                      active ? 'text-primary-800' : 'text-surface-800'
                    }`}>
                      {r.short_label ?? r.label}
                    </p>
                    <StatusBadge status={r.status} />
                  </button>
                )
              })}
            </div>
          )}

          {/* Result area */}
          {!catalogErr && (
            <div className="border-t border-surface-100 pt-4">

              {/* Skeleton loader */}
              {loading && (
                <div className="space-y-2 animate-pulse" aria-busy="true"
                  aria-label="Loading reference data">
                  <div className="h-3 bg-surface-100 rounded w-2/5" />
                  <div className="h-20 bg-surface-50 border border-surface-100 rounded-lg" />
                  <div className="h-20 bg-surface-50 border border-surface-100 rounded-lg" />
                </div>
              )}

              {/* Not Available */}
              {!loading && payload !== null && !isAvailable && (
                <div className="flex items-start gap-2 bg-surface-50 border border-surface-200
                                rounded-lg px-3 py-3 text-xs text-surface-500">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    className="shrink-0 mt-0.5 text-surface-400" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                  <p className="break-words">
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

              {/* Prompt when nothing selected yet */}
              {!loading && payload === null && !catalogErr && references.length > 0 && (
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
