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
  result?: Record<string, unknown>
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
      <span className="badge badge-teal text-2xs py-0.5 px-2 inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" aria-hidden="true" />
        Available
      </span>
    )
  }
  return (
    <span className="badge bg-surface-100 text-surface-400 border border-surface-200 text-2xs py-0.5 px-2">
      Not Available
    </span>
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

  // ── Auto-load when selection changes ─────────────────────────────────────
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
  const meta = payload?.reference

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section aria-labelledby="indref-title">

      {/* ── Accordion trigger — identical pattern to "TECHNICAL DETAILS" ── */}
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
          className="border border-surface-200 rounded-lg bg-white p-4 sm:p-5 mt-1 animate-fade-up-sm space-y-4"
        >

          {/* ── Disclaimer ── */}
          <div className="flex items-start gap-3 bg-teal-50 border border-teal-200
                          rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-xs text-teal-800">
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="flex-shrink-0 mt-0.5 text-teal-600" aria-hidden="true"
            >
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
                            rounded-lg px-3 py-2.5 sm:px-4 text-xs text-gold-800">
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
                className="flex-shrink-0 mt-0.5 text-gold-600" aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="min-w-0 break-words">Not Available — {catalogError}</p>
            </div>
          )}

          {/* ── 4-source grid — mobile: 2 cols, sm+: 4 cols ── */}
          {references.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {references.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`text-left rounded-lg border px-3 py-2.5 transition-all
                              duration-150 focus:outline-none focus-visible:ring-2
                              focus-visible:ring-primary-500 focus-visible:ring-offset-1 ${
                    selectedId === r.id
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-surface-200 bg-white hover:border-primary-300 hover:bg-primary-50/40'
                  }`}
                  aria-pressed={selectedId === r.id}
                >
                  {/* Label — 2 lines max, then ellipsis */}
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

          {/* ── Selector row + Refresh button ── */}
          {!catalogError && (
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">

              {/* Select — full width on mobile, flex-1 on sm+ */}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <label
                  htmlFor="indref-select"
                  className="section-label text-2xs"
                >
                  Reference source
                </label>
                <select
                  id="indref-select"
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  disabled={references.length === 0}
                  className="input text-sm min-w-0 w-full"
                >
                  {references.length === 0
                    ? <option>Loading…</option>
                    : references.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.short_label ?? r.label} — {r.status}
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Button — full width on mobile, auto on sm+ */}
              <button
                type="button"
                onClick={() => loadReference(selectedId)}
                disabled={!selectedId || loading}
                className="btn-outline py-2 px-4 text-sm w-full sm:w-auto
                           inline-flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                {loading ? (
                  <>
                    <span
                      className="w-3 h-3 border-2 border-surface-300 border-t-surface-600
                                 rounded-full animate-spin flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span>Loading…</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
                    >
                      <polyline points="1 4 1 10 7 10"/>
                      <path d="M3.51 15a9 9 0 1 0 .49-3.09"/>
                    </svg>
                    <span>View reference</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── Result block — shown after a reference is selected ── */}
          {!catalogError && (payload !== null || loading) && (
            <div className="border-t border-surface-100 pt-4 space-y-3">

              {/* Meta bar — same "Run metadata" inline pattern with flex-wrap */}
              {isAvailable && meta && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500 min-w-0">
                  {meta.label && (
                    <span className="font-semibold text-surface-700 truncate">{meta.label}</span>
                  )}
                  {meta.provider && (
                    <>
                      <span className="text-surface-200 hidden sm:inline" aria-hidden="true">|</span>
                      <span className="truncate">{meta.provider}</span>
                    </>
                  )}
                  {meta.evidence_type && (
                    <>
                      <span className="text-surface-200 hidden sm:inline" aria-hidden="true">|</span>
                      <span className="truncate">{meta.evidence_type}</span>
                    </>
                  )}
                  {meta.does_not_prove && (
                    <>
                      <span className="text-surface-200 hidden sm:inline" aria-hidden="true">|</span>
                      <span className="text-gold-700 truncate">
                        Does not prove: {meta.does_not_prove}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Not-available notice */}
              {!loading && !isAvailable && payload !== null && (
                <div className="flex items-start gap-3 bg-surface-50 border border-surface-200
                                rounded-lg px-3 py-2.5 sm:px-4 text-xs text-surface-500">
                  <svg
                    width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    className="flex-shrink-0 mt-0.5 text-surface-400" aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                  <p className="min-w-0 break-words">
                    <strong className="text-surface-700">Not Available</strong>
                    {payload.reason
                      ? ` — ${payload.reason}`
                      : ' — No verified result is available for this run and scene.'}
                  </p>
                </div>
              )}

              {/* JSON result — scrollable both axes on small screens */}
              {isAvailable && payload?.result && (
                <div className="table-responsive -mx-4 sm:mx-0 px-4 sm:px-0">
                  <pre
                    className="code text-xs leading-relaxed whitespace-pre max-h-72
                               overflow-auto p-3 sm:p-4 rounded-lg bg-surface-50
                               border border-surface-100 min-w-0"
                    tabIndex={0}
                    aria-label="Reference result JSON"
                  >
                    {JSON.stringify(payload.result, null, 2)}
                  </pre>
                </div>
              )}

            </div>
          )}

        </div>
      )}
    </section>
  )
}
