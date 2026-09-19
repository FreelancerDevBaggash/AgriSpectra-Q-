'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Satellite, Play, AlertTriangle, CheckCircle, Clock, MapPin, Layers, Zap } from 'lucide-react'

const SCENES = [
  {
    id: 'scene_01_DT0000205230' as const,
    name: 'Scene 01 — DT0000205230',
    location: 'Al Ain Region, UAE',
    dimensions: '1000 × 800 px',
    bands: 224,
    resolution: '30 m/px',
    description: 'Agricultural fields in the Al Ain oasis region. Rich diversity of irrigated crops including date palms and vegetables.',
    tags: ['Water Stress', 'Date Palm', 'Irrigated Crops'],
    color: 'primary',
  },
  {
    id: 'scene_02' as const,
    name: 'Scene 02',
    location: 'Arabian Gulf Coastal Area',
    dimensions: '1000 × 800 px',
    bands: 224,
    resolution: '30 m/px',
    description: 'Coastal agricultural zones with salinity gradients. Ideal for detecting salt-stress spectral signatures.',
    tags: ['Salinity', 'Coastal', 'Stress Detection'],
    color: 'secondary',
  },
  {
    id: 'scene_03' as const,
    name: 'Scene 03',
    location: 'Inland Desert Agriculture',
    dimensions: '1000 × 800 px',
    bands: 224,
    resolution: '30 m/px',
    description: 'Desert-edge farming plots with mixed land cover. High contrast between vegetated and bare soil areas.',
    tags: ['Desert Edge', 'Mixed Land Cover', 'Bare Soil'],
    color: 'accent',
  },
]

type SceneId = typeof SCENES[number]['id']
type AnalysisStatus = 'idle' | 'running' | 'done' | 'error'

export default function IntelligencePage() {
  const router = useRouter()
  const [selectedScene, setSelectedScene] = useState<SceneId>('scene_01_DT0000205230')
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [runId, setRunId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  async function handleRunAnalysis() {
    setStatus('running')
    setErrorMsg(null)
    setElapsed(0)

    const interval = setInterval(() => setElapsed(s => s + 1), 1000)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8765'}/api/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: selectedScene }),
      })

      const data = await res.json()
      clearInterval(interval)

      if (!res.ok) {
        setErrorMsg(data.error || 'Analysis failed. Please try again.')
        setStatus('error')
        return
      }

      setRunId(data.run_id)
      setStatus('done')
      setTimeout(() => router.push(`/dashboard?run_id=${data.run_id}&scene=${selectedScene}`), 1200)
    } catch {
      clearInterval(interval)
      setErrorMsg('Cannot connect to backend. Ensure the API is running on port 8765.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="badge badge-live inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              LIVE ANALYSIS
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Hyperspectral Scene Intelligence
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Select an EnMAP scene and run a full spectral-priority analysis. The engine processes 
            224 hyperspectral bands and returns georeferenced risk zones, ranked inspection candidates, 
            and actionable field recommendations.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Scene Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-600" />
            Select EnMAP Scene
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {SCENES.map((scene) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => setSelectedScene(scene.id)}
                className={`text-left rounded-xl border-2 p-5 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  selectedScene === scene.id
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                    <Satellite className="w-5 h-5" />
                  </div>
                  {selectedScene === scene.id && (
                    <CheckCircle className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{scene.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" /> {scene.location}
                </p>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">{scene.description}</p>
                <div className="flex flex-wrap gap-1">
                  {scene.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs text-gray-500">
                  <div><span className="font-medium text-gray-700">{scene.bands}</span> bands</div>
                  <div><span className="font-medium text-gray-700">{scene.resolution}</span></div>
                  <div><span className="font-medium text-gray-700">{scene.dimensions}</span></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Run Panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Ready to Analyse</h3>
              <p className="text-sm text-gray-500">
                Selected: <span className="font-medium text-gray-800">{SCENES.find(s => s.id === selectedScene)?.name}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={status === 'running' || status === 'done'}
              className="btn-primary inline-flex items-center gap-2 whitespace-nowrap"
            >
              {status === 'running' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analysing… {elapsed}s
                </>
              ) : status === 'done' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Redirecting…
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Live Analysis
                </>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          {status === 'running' && (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full animate-progress-indeterminate" />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-gray-400">
                {['Loading Bands', 'Computing Indices', 'Generating Zones', 'Building Report'].map((step, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary-400" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success */}
          {status === 'done' && runId && (
            <div className="mt-4 flex items-center gap-3 text-green-700 bg-green-50 rounded-lg px-4 py-3 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Analysis complete — Run ID: <code className="font-mono">{runId}</code>. Redirecting to dashboard…</span>
            </div>
          )}

          {/* Error */}
          {status === 'error' && errorMsg && (
            <div className="mt-4 flex items-start gap-3 text-red-700 bg-red-50 rounded-lg px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Analysis Error</p>
                <p className="mt-0.5 text-red-600">{errorMsg}</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-2 text-red-700 underline text-xs"
                >
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Satellite, label: 'Spectral Bands', value: '224', sub: 'EnMAP hyperspectral' },
            { icon: Layers, label: 'Analysis Indices', value: '8+', sub: 'NDVI, EVI, NDWI…' },
            { icon: MapPin, label: 'Priority Zones', value: 'Live', sub: 'Georeferenced output' },
            { icon: Clock, label: 'Analysis Time', value: '~30s', sub: 'Per scene' },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-50 text-primary-600 mb-2">
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs font-medium text-gray-700">{label}</div>
              <div className="text-xs text-gray-400">{sub}</div>
            </div>
          ))}
        </div>

        {/* Scientific Disclaimer */}
        <div className="mt-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800">
            <strong>Scientific Boundary:</strong> Output zones are spectral-anomaly candidates for field inspection.
            They do not constitute a biological disease or pest diagnosis. Field verification is required for all priorities.
          </p>
        </div>
      </div>
    </div>
  )
}
