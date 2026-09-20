'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, UploadProgressEvent, UploadHandle } from '@/lib/api'
import { saveRun, getRunHistory, RunHistoryEntry } from '@/lib/runHistory'
import { API_BASE } from '@/lib/config'

// ── Static fallback scene data — used when /api/scenes is unavailable
// Source: docs/AgriSpectra-Q_—_Data_and_File_Schema.md §2.2
const SCENES_FALLBACK = [
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
    available: true,
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
    available: true,
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
    available: true,
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

type SceneId = typeof SCENES_FALLBACK[number]['id']
type Status  = 'idle' | 'running' | 'done' | 'error'
type SceneEntry = typeof SCENES_FALLBACK[number]
type Mode = 'scene' | 'upload'

// ── Upload lifecycle stages ───────────────────────────────────────────────────
// idle        → file selected, nothing running
// uploading   → XHR in progress (upload progress bar)
// processing  → file received by server, engine running
// cancelling  → user pressed Cancel, waiting for server ack
// done        → analysis complete, about to redirect
// error       → failed for any reason
// cancelled   → user explicitly cancelled
type UploadStage = 'idle' | 'uploading' | 'processing' | 'cancelling' | 'done' | 'error' | 'cancelled'

// 2 GB client-side guard (mirrors server MAX_UPLOAD_BYTES)
const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024

// API_BASE imported from @/lib/config — single source of truth

// ── Backend status types ──────────────────────────────────────────────────────
type BackendState =
  | 'checking'          // initial fetch in flight
  | 'offline'           // cannot reach the API server at all
  | 'upload_only'       // production mode — no pre-loaded scenes, upload-only
  | 'scenes_missing'    // server reachable but TIF files not on disk
  | 'demo'              // demo API — pre-computed real results
  | 'ready'             // server reachable + all scenes present

export default function IntelligencePage() {
  const router = useRouter()
  const [mode, setMode]         = useState<Mode>('scene')
  const [scenes, setScenes]     = useState<SceneEntry[]>(SCENES_FALLBACK)
  const [selected, setSelected] = useState<SceneId>('scene_01_DT0000205230')
  const [status, setStatus]     = useState<Status>('idle')
  const [runId, setRunId]       = useState<string | null>(null)

  // Run history — loaded from localStorage for "Recent Runs" section
  const [recentRuns, setRecentRuns] = useState<RunHistoryEntry[]>([])
  useEffect(() => { setRecentRuns(getRunHistory()) }, [])

  // ── Backend + scene availability status ──────────────────────────────────────
  // Checks /api/status (scenes on disk) then falls back to /api/scenes.
  // Shows a clear banner so user knows exactly why a scene might not run.
  const [backendState, setBackendState] = useState<BackendState>('checking')
  const [missingScenes, setMissingScenes] = useState<string[]>([])

  useEffect(() => {
    fetch(`${API_BASE}/api/status`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { setBackendState('offline'); return }

        // Production upload-only mode
        if (data.mode === 'upload_only') {
          setBackendState('upload_only')
          return
        }

        // Demo mode (pre-computed results)
        if (data.mode === 'demo') {
          setBackendState(data.all_scenes_ready ? 'demo' : 'scenes_missing')
          return
        }

        // Full live mode — check which scenes are on disk
        const scenesOnDisk = data.scenes_on_disk as Array<{ scene_id: string; label: string; available: boolean }> | undefined
        if (!scenesOnDisk) { setBackendState('ready'); return }
        const missing = scenesOnDisk.filter(s => !s.available).map(s => s.label)
        setMissingScenes(missing)
        setBackendState(missing.length > 0 ? 'scenes_missing' : 'ready')
      })
      .catch(() => setBackendState('offline'))
  }, [])

  // Load live scene catalog; merge availability into static fallback
  useEffect(() => {
    fetch(`${API_BASE}/api/scenes`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.scenes?.length) return
        const updated = SCENES_FALLBACK.map(s => {
          const live = data.scenes.find((l: { scene_id: string; available: boolean }) => l.scene_id === s.id)
          return live ? { ...s, available: live.available } : s
        })
        setScenes(updated)
      })
      .catch(() => { /* silently use fallback */ })
  }, [])
  const [error, setError]       = useState<string | null>(null)
  const [elapsed, setElapsed]   = useState(0)
  const [step, setStep]         = useState(0)

  // ── Upload mode state ──────────────────────────────────────────────────────
  const [uploadFile, setUploadFile]         = useState<File | null>(null)
  const [uploadStage, setUploadStage]       = useState<UploadStage>('idle')
  const [uploadProgress, setUploadProgress] = useState<UploadProgressEvent | null>(null)
  const [uploadElapsed, setUploadElapsed]   = useState(0)
  const [uploadStep, setUploadStep]         = useState(0)
  const [uploadError, setUploadError]       = useState<string | null>(null)
  const [uploadRunId, setUploadRunId]       = useState<string | null>(null)
  const [isDragOver, setIsDragOver]         = useState(false)
  // activeHandleRef holds the UploadHandle returned by uploadAndAnalyse so we
  // can call abort() on it from anywhere (Cancel button, unmount, replace-file)
  const activeHandleRef   = useRef<UploadHandle | null>(null)
  // processingRunIdRef holds the run_id once the file is on the server so we
  // can call abortRun() during the processing phase
  const processingRunIdRef = useRef<string | null>(null)
  const fileInputRef       = useRef<HTMLInputElement>(null)
  const uploadTickRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const uploadStepRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const uploadRedirectRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scene = scenes.find(s => s.id === selected) ?? scenes[0]

  // Track running intervals + redirect timeout so they can be cleared on unmount
  // Prevents memory leak + state/navigation update on unmounted component
  const tickRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepTickRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      // Abort any in-flight upload/processing on unmount
      activeHandleRef.current?.abort()
      if (processingRunIdRef.current) apiClient.abortRun(processingRunIdRef.current)
      if (tickRef.current)            clearInterval(tickRef.current)
      if (stepTickRef.current)        clearInterval(stepTickRef.current)
      if (redirectTimerRef.current)   clearTimeout(redirectTimerRef.current)
      if (uploadTickRef.current)      clearInterval(uploadTickRef.current)
      if (uploadStepRef.current)      clearInterval(uploadStepRef.current)
      if (uploadRedirectRef.current)  clearTimeout(uploadRedirectRef.current)
    }
  }, [])

  // ── Upload internal timer helpers ──────────────────────────────────────────
  const clearUploadTimers = useCallback(() => {
    if (uploadTickRef.current)  { clearInterval(uploadTickRef.current);  uploadTickRef.current = null }
    if (uploadStepRef.current)  { clearInterval(uploadStepRef.current);  uploadStepRef.current = null }
  }, [])

  // ── File acceptance (validation) ───────────────────────────────────────────
  // If a run is active while a new file is dropped, cancel the active run first.
  const acceptFile = useCallback((f: File) => {
    // Cancel any active run before replacing the file
    if (activeHandleRef.current) {
      activeHandleRef.current.abort()
      activeHandleRef.current = null
    }
    if (processingRunIdRef.current) {
      apiClient.abortRun(processingRunIdRef.current)
      processingRunIdRef.current = null
    }
    clearUploadTimers()
    if (uploadRedirectRef.current) { clearTimeout(uploadRedirectRef.current); uploadRedirectRef.current = null }

    // Client-side guards
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['tif', 'tiff', 'geotiff'].includes(ext)) {
      setUploadError(`Unsupported file type ".${ext}". Please upload a GeoTIFF (.tif / .tiff).`)
      setUploadStage('error')
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      setUploadError(`File is too large (${(f.size / (1024 ** 3)).toFixed(1)} GB). Maximum allowed size is 2 GB.`)
      setUploadStage('error')
      return
    }
    if (f.size === 0) {
      setUploadError('File is empty.')
      setUploadStage('error')
      return
    }

    setUploadFile(f)
    setUploadStage('idle')
    setUploadError(null)
    setUploadProgress(null)
    setUploadStep(0)
    setUploadElapsed(0)
    setUploadRunId(null)
    // Reset the file input so the same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [clearUploadTimers])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) acceptFile(f)
  }, [acceptFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) acceptFile(f)
  }, [acceptFile])

  // ── Cancel handler (works during both upload and processing phases) ─────────
  const handleCancel = useCallback(async () => {
    setUploadStage('cancelling')
    // Phase A: cancel the XHR if still uploading
    if (activeHandleRef.current) {
      activeHandleRef.current.abort()
      activeHandleRef.current = null
    }
    // Phase B: tell the server to abort if processing has started
    if (processingRunIdRef.current) {
      await apiClient.abortRun(processingRunIdRef.current)
      processingRunIdRef.current = null
    }
    clearUploadTimers()
    setUploadStage('cancelled')
    setUploadProgress(null)
    setUploadStep(0)
    setUploadElapsed(0)
  }, [clearUploadTimers])

  // ── Main upload+run handler ─────────────────────────────────────────────────
  function handleUploadRun() {
    if (!uploadFile) return

    setUploadStage('uploading')
    setUploadError(null)
    setUploadProgress(null)
    setUploadElapsed(0)
    setUploadStep(0)
    setUploadRunId(null)
    processingRunIdRef.current = null

    // Elapsed timer — only runs during processing phase (not upload)
    const handle = apiClient.uploadAndAnalyse(uploadFile, (evt: UploadProgressEvent) => {
      setUploadProgress(evt)
      // Transition to processing once upload is 100%
      if (evt.uploadPct === 100) {
        setUploadStage('processing')
        // Start elapsed + step timers only NOW (processing phase)
        if (!uploadTickRef.current) {
          uploadTickRef.current = setInterval(() => setUploadElapsed(e => e + 1), 1000)
        }
        if (!uploadStepRef.current) {
          uploadStepRef.current = setInterval(
            () => setUploadStep(s => Math.min(s + 1, PIPELINE_STEPS.length - 1)),
            4500,
          )
        }
      }
    })

    activeHandleRef.current = handle

    handle.promise
      .then((result) => {
        activeHandleRef.current  = null
        processingRunIdRef.current = null
        clearUploadTimers()
        setUploadRunId(result.run_id)
        setUploadStage('done')
        const sceneId = result.scene ?? uploadFile.name.replace(/\.[^.]+$/, '')
        // Persist upload run so user can return to this analysis later
        saveRun({
          run_id:    result.run_id,
          scene:     sceneId,
          label:     uploadFile.name,
          timestamp: new Date().toISOString(),
          source:    'upload',
        })
        setRecentRuns(getRunHistory())
        uploadRedirectRef.current = setTimeout(
          () => router.push(`/dashboard?run_id=${result.run_id}&scene=${sceneId}`),
          1500,
        )
      })
      .catch((e: Error) => {
        activeHandleRef.current  = null
        processingRunIdRef.current = null
        clearUploadTimers()
        // Distinguish user-initiated cancel from real errors
        if (e.message === 'UPLOAD_ABORTED' || uploadStage === 'cancelling') {
          setUploadStage('cancelled')
          return
        }
        setUploadError(e.message)
        setUploadStage('error')
      })
  }

  async function handleRun() {
    setStatus('running'); setError(null); setElapsed(0); setStep(0)

    tickRef.current     = setInterval(() => setElapsed(e => e + 1), 1000)
    stepTickRef.current = setInterval(() => setStep(s => Math.min(s + 1, PIPELINE_STEPS.length - 1)), 3500)

    const clearAll = () => {
      if (tickRef.current)     { clearInterval(tickRef.current);     tickRef.current = null }
      if (stepTickRef.current) { clearInterval(stepTickRef.current); stepTickRef.current = null }
    }

    try {
      const res  = await fetch(`${API_BASE}/api/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: selected }),
      })
      const data = await res.json()
      clearAll()

      if (!res.ok) { setError(data.error || 'Analysis failed.'); setStatus('error'); return }
      setRunId(data.run_id); setStatus('done')
      // Persist run to localStorage so user can return to this analysis later
      const sceneEntry = scenes.find(s => s.id === selected)
      saveRun({
        run_id:    data.run_id,
        scene:     selected,
        label:     sceneEntry?.label ?? selected,
        timestamp: new Date().toISOString(),
        source:    'scene',
      })
      setRecentRuns(getRunHistory())
      redirectTimerRef.current = setTimeout(() => router.push(`/dashboard?run_id=${data.run_id}&scene=${selected}`), 1500)
    } catch {
      clearAll()
      setError('Cannot reach the analysis server. Please try again in a moment.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-surface-50">

      {/* Page header */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-surface-400 mb-4" aria-label="Breadcrumb">
            <a href="/" className="hover:text-surface-700 transition-colors">Home</a>
            <span aria-hidden="true">›</span>
            <span className="text-surface-600 font-medium">Intelligence</span>
          </nav>
          <div className="flex items-center gap-2.5 mb-3">
            {backendState === 'ready' && (
              <span className="badge badge-live"><span className="dot-live" />LIVE ENGINE ACTIVE</span>
            )}
            {backendState === 'demo' && (
              <span className="badge badge-live"><span className="dot-live" />DEMO — REAL RESULTS</span>
            )}
            {backendState === 'upload_only' && (
              <span className="badge bg-primary-50 text-primary-700 border border-primary-200">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block mr-1" aria-hidden="true" />
                UPLOAD-ONLY MODE
              </span>
            )}
            {backendState === 'checking' && (
              <span className="badge bg-surface-100 text-surface-500 border border-surface-200">
                <span className="w-1.5 h-1.5 rounded-full bg-surface-400 animate-pulse inline-block mr-1" aria-hidden="true" />
                Checking engine…
              </span>
            )}
            {(backendState === 'offline' || backendState === 'scenes_missing') && (
              <span className="badge bg-gold-100 text-gold-700 border border-gold-300">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-500 inline-block mr-1" aria-hidden="true" />
                {backendState === 'offline' ? 'ENGINE OFFLINE' : 'SCENES MISSING'}
              </span>
            )}
            <span className="badge badge-frozen">BENCHMARK RESULTS SEPARATE</span>
          </div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2">
            {backendState === 'upload_only' ? 'Upload Your GeoTIFF' : 'Run a Live Analysis'}
          </h1>
          <p className="text-surface-500 max-w-2xl text-sm leading-relaxed">
            {backendState === 'upload_only'
              ? 'This server runs in upload-only mode. Upload any multi-band GeoTIFF to analyse it with the live spectral-anomaly engine.'
              : 'Select one of the three verified EnMAP scenes below, or upload your own GeoTIFF. The engine returns ranked spectral-priority zones in under 60 seconds.'
            }
          </p>
        </div>
      </div>

      {/* ── Status banners — shown only when relevant ─────────────────────── */}

      {backendState === 'demo' && (
        <div className="bg-primary-50 border-b border-primary-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2.5 text-xs text-primary-700">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>
              <strong>Demo mode:</strong> These results were computed from real EnMAP GeoTIFF data and are served instantly for the hackathon demonstration.
              All zone data, spectral evidence, and inspection budgets are genuine engine outputs.
            </span>
          </div>
        </div>
      )}

      {backendState === 'upload_only' && (
        <div className="bg-primary-50 border-b border-primary-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2.5 text-xs text-primary-700">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>
              <strong>Upload-only mode:</strong> This server does not host pre-loaded scenes.
              Switch to the <strong>Upload GeoTIFF</strong> tab to analyse your own file.
            </span>
          </div>
        </div>
      )}

      {backendState === 'offline' && (
        <div className="bg-gold-50 border-b border-gold-200" role="alert">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-start gap-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-500 flex-shrink-0 mt-0.5" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/>
            </svg>
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-gold-800 mb-0.5">Analysis engine is starting up</p>
              <p className="text-gold-700">
                The server may be waking from sleep — this can take up to 30 seconds on free-tier hosting.
                Please wait a moment and then{' '}
                <button onClick={() => window.location.reload()} className="underline font-medium hover:text-gold-800">refresh the page</button>.
              </p>
            </div>
          </div>
        </div>
      )}

      {backendState === 'scenes_missing' && (
        <div className="bg-gold-50 border-b border-gold-200" role="alert">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-start gap-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-500 flex-shrink-0 mt-0.5" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/>
            </svg>
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-gold-800 mb-0.5">
                Scene files missing{missingScenes.length > 0 && `: ${missingScenes.join(', ')}`}
              </p>
              <p className="text-gold-700">
                Copy the TIF files to <code className="font-mono bg-gold-100 px-1 rounded">data/raw/enmap_three_scenes/</code> — or switch to <strong>Upload GeoTIFF</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Mode tab switcher ─────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-8 bg-surface-100 rounded-lg p-1 w-fit max-w-full overflow-x-auto" role="tablist" aria-label="Analysis input mode">
          <button
            role="tab"
            aria-selected={mode === 'scene'}
            onClick={() => setMode('scene')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              mode === 'scene'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Select EnMAP Scene
          </button>
          <button
            role="tab"
            aria-selected={mode === 'upload'}
            onClick={() => setMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              mode === 'upload'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload GeoTIFF
          </button>
        </div>

        {/* ══════════════════ SCENE SELECTION PANEL ══════════════════════════ */}
        {mode === 'scene' && (<>

        {/* Scene selector — spec §6.3: radio-style rows per spec §5.1 verified scene IDs */}
        <div className="mb-8">
          <p className="section-label mb-4" id="scene-selector-label">SELECT ENMAP SCENE</p>

          <div
            className="bg-white rounded-lg border border-surface-200 divide-y divide-surface-100 overflow-hidden"
            role="radiogroup"
            aria-labelledby="scene-selector-label"
          >
            {scenes.map(s => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected === s.id}
                disabled={s.available === false}
                onClick={() => s.available !== false && setSelected(s.id)}
                className={`w-full text-left px-5 py-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
                  s.available === false ? 'opacity-40 cursor-not-allowed' :
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
                      {s.available === false && (
                        <span className="text-2xs font-medium px-1.5 py-0.5 rounded bg-gold-100 text-gold-600">File unavailable</span>
                      )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i < step ? 'bg-primary-500' : i === step ? 'bg-primary-500 animate-pulse-glow' : 'bg-surface-200'}`} />
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
                className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-600 flex-shrink-0" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="text-primary-800 font-medium">Analysis complete —</span>
                <code className="code text-xs">{runId}</code>
                <span className="text-primary-600">Redirecting to dashboard…</span>
              </div>
            )}

            {/* Error — spec §6.4: "LIVE ANALYSIS FAILED — engine did not produce a valid result" */}
            {status === 'error' && error && (
              <div
                role="alert"
                className="flex items-start gap-3 bg-gold-50 border border-gold-200 rounded-lg px-4 py-3 text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gold-500 flex-shrink-0 mt-0.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <div>
                  <p className="font-semibold text-gold-800 mb-0.5">Live Analysis Failed</p>
                  <p className="text-gold-600 text-xs">The engine did not produce a valid result. {error}</p>
                  <button onClick={() => setStatus('idle')} className="mt-2 text-xs text-gold-700 underline font-medium">
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
        <div className="flex items-start gap-3 bg-gold-50 border border-gold-200 rounded-lg p-4 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-600 flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="text-gold-800">
            <strong>Scientific boundary:</strong>{' '}
            The result is a spectral-anomaly prioritisation signal and requires field verification.
            Output zones are inspection priority candidates — not confirmed disease or pest detections.
          </p>
        </div>

        </>)} {/* end scene mode */}

        {/* ══════════════════ UPLOAD PANEL ═══════════════════════════════════ */}
        {mode === 'upload' && (
          <div>

            {/* ── What happens to the uploaded file ─────────────────────────── */}
            <div className="flex items-start gap-3 bg-surface-50 border border-surface-200 rounded-lg p-4 mb-6 text-xs text-surface-600 leading-relaxed">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400 flex-shrink-0 mt-0.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <p className="font-semibold text-surface-700 mb-1">What happens when you upload a file?</p>
                <ol className="space-y-0.5 list-decimal list-inside text-surface-500">
                  <li>Your GeoTIFF is uploaded to the analysis server (streamed — max 2 GB)</li>
                  <li>The live engine runs the spectral-anomaly pipeline on your scene</li>
                  <li>Results (zones, maps, budget) are saved on the server under a unique run ID</li>
                  <li>You are redirected to the Dashboard to view and download all outputs</li>
                  <li>Your run ID is saved on this device — you can return to it via the Recent Analyses list below</li>
                </ol>
                <p className="mt-1.5 text-surface-400">
                  The uploaded file is stored temporarily on the server for processing.
                  Your original file is not returned — only the analysis outputs are accessible.
                </p>
              </div>
            </div>

            {/* ── Drop zone ─────────────────────────────────────────────────── */}
            {/* Disabled while a run is active; clicking it during a run shows a hint */}
            <div
              role="button"
              tabIndex={uploadStage === 'uploading' || uploadStage === 'processing' || uploadStage === 'cancelling' ? -1 : 0}
              aria-label="Drop zone — click or drag a GeoTIFF file here"
              aria-disabled={uploadStage === 'uploading' || uploadStage === 'processing' || uploadStage === 'cancelling'}
              onDragOver={(e) => {
                e.preventDefault()
                if (uploadStage !== 'uploading' && uploadStage !== 'processing' && uploadStage !== 'cancelling')
                  setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (uploadStage === 'uploading' || uploadStage === 'processing' || uploadStage === 'cancelling') return
                fileInputRef.current?.click()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (uploadStage === 'uploading' || uploadStage === 'processing' || uploadStage === 'cancelling') return
                  fileInputRef.current?.click()
                }
              }}
              className={`mb-6 rounded-xl border-2 border-dashed transition-all select-none
                flex flex-col items-center justify-center gap-3 py-14 px-6 text-center
                ${uploadStage === 'uploading' || uploadStage === 'processing' || uploadStage === 'cancelling'
                  ? 'cursor-not-allowed opacity-40 border-surface-200 bg-surface-50'
                  : isDragOver
                    ? 'cursor-copy border-primary-400 bg-primary-50'
                    : uploadFile
                      ? 'cursor-pointer border-primary-300 bg-primary-50 hover:border-primary-400'
                      : 'cursor-pointer border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".tif,.tiff,.geotiff"
                className="sr-only"
                onChange={handleFileInput}
                aria-hidden="true"
              />

              {uploadFile ? (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-surface-900">{uploadFile.name}</p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {uploadFile.size >= 1024 * 1024 * 1024
                        ? `${(uploadFile.size / (1024 ** 3)).toFixed(2)} GB`
                        : `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`
                      }
                      {uploadStage === 'idle' && ' — click to replace'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface-300" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-surface-700">
                      {isDragOver ? 'Drop it here' : 'Drag & drop or click to select'}
                    </p>
                    <p className="text-xs text-surface-400 mt-1">GeoTIFF only · .tif / .tiff · any number of bands · up to 2 GB</p>
                  </div>
                </>
              )}
            </div>

            {/* ── Ready row — file selected, nothing running ─────────────────── */}
            {uploadFile && uploadStage === 'idle' && (
              <div className="bg-white rounded-lg border border-surface-200 px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-1">Ready to Analyse</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-surface-900 text-sm">{uploadFile.name}</span>
                    <span className="text-surface-300">·</span>
                    <span className="text-xs text-surface-500">
                      {uploadFile.size >= 1024 * 1024 * 1024
                        ? `${(uploadFile.size / (1024 ** 3)).toFixed(2)} GB`
                        : `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUploadRun}
                  className="btn-primary flex-shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Run Analysis
                </button>
              </div>
            )}

            {/* ── Live status panel ─────────────────────────────────────────── */}
            <div aria-live="polite" aria-atomic="false">

              {/* UPLOADING */}
              {uploadStage === 'uploading' && (
                <div className="bg-white rounded-lg border border-surface-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-surface-800">Uploading file…</span>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="text-xs text-surface-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
                      aria-label="Cancel upload"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Cancel
                    </button>
                  </div>

                  {/* Metrics row */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3 text-xs text-surface-500 tabular-nums">
                    {uploadProgress && (
                      <>
                        <span>
                          {(uploadProgress.loaded / (1024 * 1024)).toFixed(1)} MB
                          {uploadProgress.total > 0 && ` / ${(uploadProgress.total / (1024 * 1024)).toFixed(1)} MB`}
                        </span>
                        {uploadProgress.speedBps > 0 && (
                          <span>
                            {uploadProgress.speedBps >= 1024 * 1024
                              ? `${(uploadProgress.speedBps / (1024 * 1024)).toFixed(1)} MB/s`
                              : `${(uploadProgress.speedBps / 1024).toFixed(0)} KB/s`}
                          </span>
                        )}
                        {uploadProgress.etaSec !== Infinity && uploadProgress.etaSec > 0 && (
                          <span>ETA {uploadProgress.etaSec < 60
                            ? `${uploadProgress.etaSec}s`
                            : `${Math.ceil(uploadProgress.etaSec / 60)}m`}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-surface-100 overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress?.uploadPct ?? 0}%` }}
                      role="progressbar"
                      aria-valuenow={uploadProgress?.uploadPct ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Upload progress"
                    />
                  </div>
                  <p className="text-xs text-surface-400 mt-2 text-right tabular-nums">
                    {uploadProgress?.uploadPct ?? 0}%
                  </p>
                </div>
              )}

              {/* PROCESSING */}
              {uploadStage === 'processing' && (
                <div className="bg-white rounded-lg border border-surface-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-sm font-semibold text-surface-800">Spectral analysis running…</span>
                      <span className="ml-2 text-xs text-surface-400 tabular-nums">{uploadElapsed}s elapsed</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="text-xs text-surface-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
                      aria-label="Cancel processing"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Cancel
                    </button>
                  </div>
                  {/* Indeterminate bar */}
                  <div
                    role="progressbar"
                    aria-label="Spectral analysis in progress"
                    className="relative h-1.5 rounded-full bg-surface-100 overflow-hidden mb-4"
                  >
                    <div className="absolute inset-y-0 left-0 w-full bg-primary-500 rounded-full animate-progress-bar" aria-hidden="true" />
                  </div>
                  {/* Pipeline steps */}
                  <p className="sr-only">{`Step ${uploadStep + 1} of ${PIPELINE_STEPS.length}: ${PIPELINE_STEPS[uploadStep]}`}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4" aria-hidden="true">
                    {PIPELINE_STEPS.map((s, i) => (
                      <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                        i < uploadStep ? 'text-primary-600 font-medium' :
                        i === uploadStep ? 'text-primary-700 font-semibold' :
                        'text-surface-400'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          i < uploadStep ? 'bg-primary-500' :
                          i === uploadStep ? 'bg-primary-500 animate-pulse-glow' :
                          'bg-surface-200'
                        }`} />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CANCELLING */}
              {uploadStage === 'cancelling' && (
                <div className="flex items-center gap-3 bg-surface-50 border border-surface-200 rounded-lg px-4 py-3 text-sm mb-6">
                  <span className="w-3.5 h-3.5 border-2 border-surface-300 border-t-surface-600 rounded-full animate-spin flex-shrink-0" aria-hidden="true" />
                  <span className="text-surface-600">Cancelling…</span>
                </div>
              )}

              {/* CANCELLED */}
              {uploadStage === 'cancelled' && (
                <div
                  role="status"
                  className="flex items-center justify-between bg-surface-50 border border-surface-200 rounded-lg px-4 py-3 text-sm mb-6"
                >
                  <div className="flex items-center gap-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400 flex-shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span className="text-surface-600">Upload cancelled.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setUploadStage('idle'); setUploadProgress(null) }}
                    className="text-xs text-primary-600 hover:underline font-medium"
                  >
                    Start over
                  </button>
                </div>
              )}

              {/* DONE */}
              {uploadStage === 'done' && uploadRunId && (
                <div
                  role="status"
                  className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 text-sm mb-6"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-600 flex-shrink-0" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-primary-800 font-medium">Analysis complete —</span>
                  <code className="code text-xs">{uploadRunId}</code>
                  <span className="text-primary-600 ml-auto text-xs">Redirecting…</span>
                </div>
              )}

              {/* ERROR */}
              {uploadStage === 'error' && uploadError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 bg-gold-50 border border-gold-200 rounded-lg px-4 py-3 text-sm mb-6"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gold-500 flex-shrink-0 mt-0.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gold-800 mb-0.5">Upload or Analysis Failed</p>
                    <p className="text-gold-600 text-xs break-words">{uploadError}</p>
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => { setUploadStage('idle'); setUploadError(null) }}
                        className="text-xs text-gold-700 underline font-medium"
                      >
                        Try again
                      </button>
                      <button
                        onClick={() => { setUploadFile(null); setUploadStage('idle'); setUploadError(null); setUploadProgress(null) }}
                        className="text-xs text-surface-500 underline"
                      >
                        Choose different file
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>{/* end aria-live */}

            {/* ── Flow hint ──────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-surface-400 mb-8">
              {['Upload GeoTIFF', 'Run Engine', 'Generate Results', 'Visualise', 'Download'].map((s, i, arr) => (
                <span key={s} className="flex items-center gap-2">
                  <span className="font-medium text-surface-500">{s}</span>
                  {i < arr.length - 1 && <span aria-hidden="true" className="text-surface-200">→</span>}
                </span>
              ))}
            </div>

            {/* ── Scientific boundary ─────────────────────────────────────────── */}
            <div className="flex items-start gap-3 bg-gold-50 border border-gold-200 rounded-lg p-4 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-600 flex-shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-gold-800">
                <strong>Scientific boundary:</strong>{' '}
                The result is a spectral-anomaly prioritisation signal and requires field verification.
                Output zones are inspection priority candidates — not confirmed disease or pest detections.
                The engine works on <strong>any multi-band GeoTIFF</strong>; results depend on scene quality.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════ RECENT RUNS ════════════════════════════════════ */}
        {/* Shown below both panels when there are saved runs in localStorage  */}
        {recentRuns.length > 0 && (
          <div className="mt-10 pt-8 border-t border-surface-100">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label">RECENT ANALYSES</p>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('agrispectra_runs')
                    setRecentRuns([])
                  }
                }}
                className="text-xs text-surface-400 hover:text-surface-600 transition-colors"
                aria-label="Clear run history"
              >
                Clear history
              </button>
            </div>
            <p className="text-xs text-surface-400 mb-4">
              These analyses were run on this device. Click any row to go directly to its Dashboard.
            </p>
            <div className="bg-white rounded-lg border border-surface-200 divide-y divide-surface-100 overflow-hidden">
              {recentRuns.map((run) => (
                <a
                  key={run.run_id}
                  href={`/dashboard?run_id=${run.run_id}&scene=${run.scene}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-50 transition-colors group"
                  aria-label={`Open dashboard for ${run.label}, run ${run.run_id}`}
                >
                  {/* Source icon */}
                  <div className="flex-shrink-0 text-surface-300 group-hover:text-primary-500 transition-colors">
                    {run.source === 'upload' ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"/>
                      </svg>
                    )}
                  </div>

                  {/* Run info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-surface-900 group-hover:text-primary-700 transition-colors truncate">
                        {run.label}
                      </span>
                      <span className="text-2xs font-medium px-1.5 py-0.5 rounded bg-surface-100 text-surface-500">
                        {run.source === 'upload' ? 'Upload' : 'EnMAP Scene'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-surface-400">
                      <code className="font-mono">{run.run_id}</code>
                      <span>·</span>
                      <time dateTime={run.timestamp}>
                        {new Date(run.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </time>
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-surface-300 group-hover:text-primary-500 transition-colors" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
