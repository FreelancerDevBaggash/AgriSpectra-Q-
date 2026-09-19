'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SCENES = [
  {
    id: 'scene_01_DT0000205230' as const,
    label: 'Scene 01',
    code: 'DT0000205230',
    location: 'Al Ain Region, UAE',
    dims: '1,153 × 1,198 px',
    bands: 224,
    res: '30 m/px',
    time: '~37 s',
    zones: 407,
    desc: 'Agricultural oasis zone with irrigated date palms and vegetables. High spectral contrast. Strongest benchmark performance (F1 98.5%).',
    tags: ['Water Stress', 'Date Palm', 'Irrigated'],
    color: 'primary',
    gradient: 'from-primary-500/20 to-primary-600/5',
    border: 'border-primary-200 hover:border-primary-400',
    selectedBorder: 'border-primary-500 ring-2 ring-primary-500/20',
    tagBg: 'bg-primary-50 text-primary-700',
    iconBg: 'bg-primary-100 text-primary-600',
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
    time: '~111 s',
    zones: 864,
    desc: 'Coastal agricultural zones with salinity gradients. Ideal for salt-stress spectral signatures and mixed land cover.',
    tags: ['Salinity', 'Coastal', 'Mixed Cover'],
    color: 'spectral',
    gradient: 'from-spectral-500/20 to-spectral-600/5',
    border: 'border-spectral-200 hover:border-spectral-400',
    selectedBorder: 'border-spectral-500 ring-2 ring-spectral-500/20',
    tagBg: 'bg-spectral-50 text-spectral-700',
    iconBg: 'bg-spectral-100 text-spectral-600',
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
    time: '~49 s',
    zones: 438,
    desc: 'Desert-edge farming plots with mixed land cover and high bare soil contrast. Challenging scene for anomaly detection.',
    tags: ['Desert Edge', 'Bare Soil', 'Arid'],
    color: 'amber',
    gradient: 'from-amber-500/20 to-amber-600/5',
    border: 'border-amber-200 hover:border-amber-400',
    selectedBorder: 'border-amber-500 ring-2 ring-amber-500/20',
    tagBg: 'bg-amber-50 text-amber-700',
    iconBg: 'bg-amber-100 text-amber-600',
    f1: '95.30%',
  },
]

type SceneId = typeof SCENES[number]['id']
type Status  = 'idle' | 'running' | 'done' | 'error'

const PIPELINE_STEPS = [
  'Loading 224 spectral bands',
  'Applying NoData mask',
  'Computing spectral indices',
  'Running anomaly detection',
  'Applying percentile thresholds',
  'Extracting priority zones',
  'Generating GeoJSON output',
  'Building inspection report',
]

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

    const tick = setInterval(() => setElapsed(e => e + 1), 1000)
    const stepTick = setInterval(() => setStep(s => Math.min(s + 1, PIPELINE_STEPS.length - 1)), 3500)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8765'}/api/analyse`, {
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

      {/* Page header */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="badge badge-live">
              <span className="dot-live" />
              LIVE ANALYSIS ENGINE
            </span>
            <span className="badge badge-frozen">FROZEN BENCHMARK SEPARATE</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-surface-900 mb-3">
            Hyperspectral Scene Intelligence
          </h1>
          <p className="text-surface-500 max-w-2xl">
            Select a real EnMAP scene and run a full spectral-priority analysis. 
            The engine processes 224 spectral bands and returns georeferenced risk zones, 
            ranked inspection candidates, and actionable field recommendations.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Scene picker */}
        <div className="mb-8">
          <p className="section-label mb-5">SELECT ENMAP SCENE</p>
          <div className="grid md:grid-cols-3 gap-4">
            {SCENES.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelected(s.id)}
                className={`text-left rounded-2xl border-2 bg-gradient-to-br ${s.gradient} p-5 transition-all focus:outline-none ${
                  selected === s.id ? s.selectedBorder : s.border
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  {selected === s.id && (
                    <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                </div>

                <div className="mb-1">
                  <span className="text-base font-bold text-surface-900">{s.label}</span>
                  <span className="ml-2 code">{s.code}</span>
                </div>
                <p className="text-xs text-surface-500 flex items-center gap-1 mb-3">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {s.location}
                </p>
                <p className="text-xs text-surface-600 mb-3 leading-relaxed">{s.desc}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {s.tags.map(t => (
                    <span key={t} className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${s.tagBg}`}>{t}</span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-surface-200/60">
                  <div className="text-center">
                    <div className="text-sm font-bold text-surface-800">{s.f1}</div>
                    <div className="text-2xs text-surface-400">F1 Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-surface-800">{s.zones}</div>
                    <div className="text-2xs text-surface-400">HP Zones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-surface-800">{s.time}</div>
                    <div className="text-2xs text-surface-400">Proc. Time</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Analysis panel */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-1">Ready to Analyse</p>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-surface-900">{scene.label}</h3>
                <span className="text-surface-400">—</span>
                <span className="text-sm text-surface-500">{scene.location}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRun}
              disabled={status === 'running' || status === 'done'}
              className="btn-primary-lg flex-shrink-0"
            >
              {status === 'running' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Analysing… {elapsed}s
                </>
              ) : status === 'done' ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Redirecting…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Run Live Analysis
                </>
              )}
            </button>
          </div>

          {/* Pipeline progress */}
          {status === 'running' && (
            <div>
              <div className="relative h-1.5 rounded-full bg-surface-100 overflow-hidden mb-4">
                <div className="absolute inset-y-0 left-0 w-full bg-primary-500 rounded-full animate-progress-bar" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PIPELINE_STEPS.slice(0, 8).map((s, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-300 ${i <= step ? 'text-primary-600 font-medium' : 'text-surface-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i < step ? 'bg-spectral-500' : i === step ? 'bg-primary-500 animate-pulse-glow' : 'bg-surface-300'}`} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success */}
          {status === 'done' && runId && (
            <div className="flex items-center gap-3 bg-spectral-50 border border-spectral-200 rounded-xl px-4 py-3 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-spectral-600 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
              <span className="text-spectral-800 font-medium">Analysis complete —</span>
              <code className="code text-xs">{runId}</code>
              <span className="text-spectral-600">Redirecting to dashboard…</span>
            </div>
          )}

          {/* Error */}
          {status === 'error' && error && (
            <div className="flex items-start gap-3 bg-risk-50 border border-risk-200 rounded-xl px-4 py-3 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-risk-600 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <div>
                <p className="font-semibold text-risk-800 mb-0.5">Analysis Error</p>
                <p className="text-risk-600">{error}</p>
                <button onClick={() => setStatus('idle')} className="mt-2 text-xs text-risk-700 underline font-medium">
                  Reset and try again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { v: '224', l: 'Spectral Bands',   s: 'EnMAP L2A per scene' },
            { v: '8+',  l: 'Spectral Indices', s: 'NDVI, NDWI, EVI, PRI…' },
            { v: 'P95', l: 'HP Threshold',     s: 'Scene-relative percentile' },
            { v: '<60s', l: 'Analysis Time',   s: 'Per scene (live)' },
          ].map(({ v, l, s }) => (
            <div key={l} className="stat-card text-center items-center">
              <div className="stat-value text-2xl text-primary-700">{v}</div>
              <div className="stat-label text-xs">{l}</div>
              <div className="stat-sub">{s}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 flex-shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p className="text-amber-800">
            <strong>Scientific Boundary:</strong> Output zones are spectral-anomaly inspection candidates.
            They do not constitute a disease or pest diagnosis. All priorities require field verification.
          </p>
        </div>
      </div>
    </div>
  )
}
