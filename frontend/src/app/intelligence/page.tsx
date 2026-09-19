'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Scene data — sourced from docs/AgriSpectra-Q_—_UX_UI_Product_Specification.md §6.3
// and docs/AgriSpectra-Q_—_Frontend_Pages_and_UX_Flow.md §8
// Only the three verified server-side scene IDs are presented (spec §5.1)

const SCENES = [
  {
    id: 'scene_01_DT0000205230' as const,
    label: 'Scene 01',
    code: 'DT0000205230',
    location: 'Al Ain Region, UAE',
    dims: '1,153 × 1,198 px',
    bands: 224,
    res: '30 m/px',
    crs: 'EPSG:32753',
    validPixels: '1,028,176',
    time: '~37 s',
    zones: 407,
    desc: 'Agricultural oasis zone with irrigated date palms and vegetables. High spectral contrast. Strongest benchmark performance.',
    tags: ['Water Stress', 'Date Palm', 'Irrigated'],
    f1: '98.47%',
  },
  {
    id: 'scene_02' as const,
    label: 'Scene 02',
    code: 'COASTAL-AGR',
    location: 'Arabian Gulf Coast',
    dims: '1,210 × 1,244 px',
    bands: 224,
    res: '30 m/px',
    crs: 'EPSG:32645',
    validPixels: '1,006,261',
    time: '~111 s',
    zones: 864,
    desc: 'Coastal agricultural zones with salinity gradients. Salt-stress spectral signatures and mixed land cover.',
    tags: ['Salinity', 'Coastal', 'Mixed Cover'],
    f1: '95.42%',
  },
  {
    id: 'scene_03' as const,
    label: 'Scene 03',
    code: 'INLAND-DESERT',
    location: 'Inland Desert Agriculture',
    dims: '1,152 × 1,214 px',
    bands: 224,
    res: '30 m/px',
    crs: 'EPSG:32636',
    validPixels: '1,047,911',
    time: '~49 s',
    zones: 438,
    desc: 'Desert-edge farming plots with mixed land cover and high bare soil contrast. Challenging scene for anomaly detection.',
    tags: ['Desert Edge', 'Bare Soil', 'Arid'],
    f1: '95.30%',
  },
]

// Processing steps — spec §6.4 required copy
const PIPELINE_STEPS = [
  'Reading valid spectral pixels',
  'Applying NoData mask',
  'Calculating spectral anomaly evidence',
  'Extracting priority zones',
  'Generating geospatial outputs',
  'Writing zone boundaries (GeoJSON)',
  'Building inspection-budget analysis',
  'Finalising run output',
]

type SceneId = typeof SCENES[number]['id']
type Status  = 'idle' | 'running' | 'done' | 'error'

export default function IntelligencePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<SceneId>('scene_01_DT0000205230')
  const [status, setStatus]     = useState<Status>('idle')
  const [runId, setRunId]       = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [elapsed, setElapsed]   = useState(0)
  const [step, setStep]         = useState(0)

  const scene = SCENES.find(s => s.id === selected)!

  async function handleRun() {
    setStatus('running'); setError(null); setElapsed(0); setStep(0)

    const tick     = setInterval(() => setElapsed(e => e + 1), 1000)
    const stepTick = setInterval(() => setStep(s => Math.min(s + 1, PIPELINE_STEPS.length - 1)), 3500)

    try {
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8765'}/api/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: selected }),
      })
      const data = await res.json()
      clearInterval(tick); clearInterval(stepTick)

      if (!res.ok) { setError(data.error || 'Analysis failed.'); setStatus('error'); return }
      setRunId(data.run_id); setStatus('done')
      setTimeout(() => router.push(`/dashboard?run_id=${data.run_id}&scene=${selected}`), 1500)
    } catch {
      clearInterval(tick); clearInterval(stepTick)
      setError('Cannot reach API server. Ensure the backend is running on port 8765.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-surface-50">

      {/* Page header — spec §6.3: LIVE ANALYSIS mode badge */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-surface-400 mb-4" aria-label="Breadcrumb">
            <a href="/" className="hover:text-surface-700 transition-colors">Home</a>
            <span aria-hidden="true">›</span>
            <span className="text-surface-600 font-medium">Intelligence</span>
          </nav>
          <div className="flex items-center gap-2.5 mb-3">
            {/* spec §3.2: LIVE ANALYSIS badge */}
            <span className="badge badge-live">
              <span className="dot-live" />
              LIVE ANALYSIS
            </span>
            <span className="badge badge-frozen">FROZEN BENCHMARK SEPARATE</span>
          </div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2">
            Hyperspectral Scene Intelligence
          </h1>
          <p className="text-surface-500 max-w-2xl text-sm leading-relaxed">
            {/* spec §6.3 scientific wording */}
            Run a real spectral-anomaly prioritisation analysis.
            Select one of the three verified EnMAP scenes and execute the live engine.
            The result is a decision-support signal and requires field verification.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Scene selector — spec §6.3: radio-style rows per spec §5.1 verified scene IDs */}
        <div className="mb-8">
          <p className="section-label mb-4" id="scene-selector-label">SELECT ENMAP SCENE</p>

          <div
            className="bg-white rounded-lg border border-surface-200 divide-y divide-surface-100 overflow-hidden"
            role="radiogroup"
            aria-labelledby="scene-selector-label"
          >
            {SCENES.map(s => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected === s.id}
                onClick={() => setSelected(s.id)}
                className={`w-full text-left px-5 py-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
                  selected === s.id ? 'bg-primary-50' : 'hover:bg-surface-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Radio indicator */}
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 transition-all ${
                    selected === s.id ? 'border-primary-600 bg-primary-600' : 'border-surface-300'
                  }`} aria-hidden="true">
                    {selected === s.id && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>

                  {/* Scene info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-semibold text-surface-900 text-sm">{s.label}</span>
                      <span className="code text-xs">{s.code}</span>
                      <span className="text-xs text-surface-400" aria-hidden="true">—</span>
                      <span className="text-xs text-surface-500">{s.location}</span>
                    </div>
                    <p className="text-xs text-surface-500 leading-relaxed mb-2">{s.desc}</p>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {s.tags.map(t => (
                        <span key={t} className="text-2xs font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-600">{t}</span>
                      ))}
                    </div>
                    {/* Mobile-only metadata row — visible below sm breakpoint */}
                    <div className="flex sm:hidden items-center gap-4 text-xs text-surface-500 mt-1">
                      <span><strong className="text-surface-800">{s.f1}</strong> F1</span>
                      <span><strong className="text-surface-800">{s.zones}</strong> zones</span>
                      <span><strong className="text-surface-800">{s.time}</strong></span>
                    </div>
                  </div>

                  {/* Scene metadata — desktop only */}
                  <div className="hidden sm:flex items-center gap-8 flex-shrink-0 text-right">
                    <div>
                      <div className="text-sm font-bold text-surface-900 tabular-nums">{s.f1}</div>
                      <div className="text-2xs text-surface-400">F1 Score</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-surface-900">{s.zones}</div>
                      <div className="text-2xs text-surface-400">HP Zones</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-surface-900">{s.time}</div>
                      <div className="text-2xs text-surface-400">Proc. Time</div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Analysis and model selectors — spec §6.3 required controls */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Analysis selector */}
          <div>
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-widest mb-1.5">Analysis</p>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-200 rounded-lg text-sm text-surface-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-surface-400"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Spectral Priority / Live Matrix
            </div>
          </div>
          {/* Model selector — spec §6.3: "must be disabled or informational" for current endpoint */}
          <div>
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-widest mb-1.5">
              Engine
              <span className="ml-1.5 text-2xs font-normal text-surface-400 normal-case tracking-normal">(current supported engine)</span>
            </p>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-400 cursor-not-allowed" aria-disabled="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-surface-300"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              AgriSpectra-Q Live Matrix Engine
            </div>
          </div>
        </div>

        {/* Run panel */}
        <div className="bg-white rounded-lg border border-surface-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-1">Ready to Analyse</p>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-surface-900">{scene.label}</h3>
                <span className="text-surface-300">—</span>
                <span className="text-sm text-surface-500">{scene.location}</span>
              </div>
            </div>
            {/* spec §6.3: disable duplicate submission */}
            <button
              type="button"
              onClick={handleRun}
              disabled={status === 'running' || status === 'done'}
              className="btn-primary flex-shrink-0"
            >
              {status === 'running' ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Analysing… {elapsed}s
                </>
              ) : status === 'done' ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Redirecting…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Run Live Analysis
                </>
              )}
            </button>
          </div>

          {/* Pipeline progress — spec §6.4 processing state */}
          {/* aria-live="polite" announces state changes to screen readers — spec §26 */}
          <div aria-live="polite" aria-atomic="false">
            {status === 'running' && (
              <div>
                {/* spec §6.4: "indeterminate progress when no measured percentage" */}
                <div
                  role="progressbar"
                  aria-label="Spectral analysis in progress — indeterminate"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="relative h-1 rounded-full bg-surface-100 overflow-hidden mb-4"
                >
                  <div className="absolute inset-y-0 left-0 w-full bg-primary-500 rounded-full animate-progress-bar" aria-hidden="true" />
                </div>
                {/* spec §6.4 required copy — current step announced via aria-live */}
                <p className="sr-only">
                  {`Computing spectral-anomaly prioritisation. Step ${step + 1} of ${PIPELINE_STEPS.length}: ${PIPELINE_STEPS[step]}`}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4" aria-hidden="true">
                  {PIPELINE_STEPS.slice(0, 8).map((s, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-300 ${i <= step ? 'text-primary-700 font-medium' : 'text-surface-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i < step ? 'bg-spectral-500' : i === step ? 'bg-primary-500 animate-pulse-glow' : 'bg-surface-200'}`} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success */}
            {status === 'done' && runId && (
              <div
                role="status"
                className="flex items-center gap-3 bg-spectral-50 border border-spectral-200 rounded-lg px-4 py-3 text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-spectral-600 flex-shrink-0" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-spectral-800 font-medium">Analysis complete —</span>
                <code className="code text-xs">{runId}</code>
                <span className="text-spectral-600">Redirecting to dashboard…</span>
              </div>
            )}

            {/* Error — spec §6.4: "LIVE ANALYSIS FAILED — engine did not produce a valid result" */}
            {status === 'error' && error && (
              <div
                role="alert"
                className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <div>
                  <p className="font-semibold text-red-800 mb-0.5">Live Analysis Failed</p>
                  <p className="text-red-600 text-xs">The engine did not produce a valid result. {error}</p>
                  <button onClick={() => setStatus('idle')} className="mt-2 text-xs text-red-700 underline font-medium">
                    Return to scene selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data-quality preview — spec §6.3 wireframe: Dimensions | Bands | Resolution | CRS | Valid pixels */}
        <div className="border-t border-surface-100 pt-6 mb-8">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-4">DATA QUALITY PREVIEW — {scene.label}</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-8 gap-y-4">
            {[
              { v: scene.dims,        l: 'Dimensions'   },
              { v: `${scene.bands}`,  l: 'Spectral Bands'},
              { v: scene.res,         l: 'Resolution'   },
              { v: scene.crs,         l: 'CRS'          },
              { v: scene.validPixels, l: 'Valid Pixels'  },
            ].map(({ v, l }) => (
              <div key={l}>
                <div className="text-sm font-semibold text-surface-900 tabular-nums">{v}</div>
                <div className="text-xs text-surface-400 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scientific boundary — spec §6.3 scientific wording + §10 */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="text-amber-800">
            <strong>Scientific boundary:</strong>{' '}
            The result is a spectral-anomaly prioritisation signal and requires field verification.
            Output zones are inspection priority candidates — not confirmed disease or pest detections.
          </p>
        </div>
      </div>
    </div>
  )
}
