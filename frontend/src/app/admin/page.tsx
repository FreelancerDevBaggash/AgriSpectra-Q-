'use client'

import { useEffect, useState, useCallback } from 'react'
import { API_BASE, PROD_API_BASE } from '@/lib/config'
import {
  Trash2, RefreshCw, ExternalLink, AlertTriangle,
  CheckCircle, Clock, HardDrive, Download, FileText,
  Upload, LayoutList, ChevronDown, ChevronRight, Star, StarOff,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OutputFile {
  name:     string
  size_kb:  number
  download: string
}

interface SceneInfo {
  scene:        string
  zones:        number
  seconds:      number
  source_file:  string
  dims:         [number, number]
  crs:          string
  location:     string
  output_files: OutputFile[]
}

interface RunInfo {
  run_id:        string
  status:        string
  timestamp:     string
  source:        string
  is_upload:     boolean
  scenes:        SceneInfo[]
  disk_kb:       number
  dashboard_url: string
}

interface AdminData {
  runs:          RunInfo[]
  total_runs:    number
  total_disk_kb: number
}

// ── Demo Manager types ────────────────────────────────────────────────────────

interface DemoSceneMeta {
  run_id:       string
  scene:        string
  zones:        number
  seconds:      number
  location:     string
  dims:         number[]
  crs:          string
  valid_pixels: number
  nodata_pct:   number
  output_files: { name: string; size_kb: number }[]
  // editable meta
  label:    string
  desc:     string
  tags:     string[]
  f1_score: string
}

interface DemoData {
  active_run_id: string | null
  scenes:        DemoSceneMeta[]
}

interface LiveRunScene {
  scene:        string
  zones:        number
  seconds:      number
  location:     string
  dims:         number[]
  crs:          string
  valid_pixels: number
}

interface LiveRunInfo {
  run_id:       string
  status:       string
  timestamp:    string
  scenes:       LiveRunScene[]
  disk_kb:      number
  already_demo: boolean
}

// ── Config ────────────────────────────────────────────────────────────────────

const ADMIN_KEY   = process.env.NEXT_PUBLIC_ADMIN_KEY ?? 'agrq-admin-2026'
const HEADERS     = { 'X-Admin-Key': ADMIN_KEY, 'Content-Type': 'application/json' }
const PAGE_PASS   = process.env.NEXT_PUBLIC_ADMIN_PASS ?? 'agrispectra2026'
const SESSION_KEY = 'agrq_admin_auth'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(ts: string) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return ts }
}
function fmtDisk(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}
function fileIcon(name: string) {
  if (name.endsWith('.geojson')) return '🗺'
  if (name.endsWith('.csv'))    return '📊'
  if (name.endsWith('.json'))   return '📄'
  if (name.endsWith('.tif'))    return '🛰'
  return '📁'
}

// ── Login gate ────────────────────────────────────────────────────────────────

function LoginGate({ onAuth }: { onAuth: () => void }) {
  const [pw,  setPw]  = useState('')
  const [err, setErr] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pw === PAGE_PASS) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onAuth()
    } else {
      setErr(true)
      setPw('')
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-8 w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-surface-900">Admin Access</h1>
          <p className="text-sm text-surface-400 mt-1">AgriSpectra-Q · Run Manager</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1.5">Password</label>
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setErr(false) }}
              placeholder="Enter admin password"
              autoFocus
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors
                ${err ? 'border-red-300 bg-red-50' : 'border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100'}`}
            />
            {err && <p className="text-xs text-red-500 mt-1.5">Incorrect password</p>}
          </div>
          <button type="submit" className="w-full btn-primary py-2.5 text-sm font-semibold">
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle className="w-3 h-3" /> completed
    </span>
  )
  if (status === 'processing') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
      <Clock className="w-3 h-3 animate-spin" /> processing
    </span>
  )
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
      <AlertTriangle className="w-3 h-3" /> failed
    </span>
  )
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-surface-100 text-surface-500 border border-surface-200">{status || 'unknown'}</span>
}

async function dlFile(url: string, filename: string) {
  const res  = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── Run Card ──────────────────────────────────────────────────────────────────

function RunCard({ run, dup, onDelete }: { run: RunInfo; dup: boolean; onDelete: (id: string) => void }) {
  const [open,      setOpen]      = useState(false)
  const [confirm,   setConfirm]   = useState(false)
  const [dlLoading, setDlLoading] = useState<string | null>(null)
  const sc = run.scenes[0]

  const handleDownload = async (file: OutputFile) => {
    setDlLoading(file.name)
    try {
      await dlFile(`${PROD_API_BASE}${file.download}`, `${run.run_id}_${file.name}`)
    } catch (e) {
      alert(`Download failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setDlLoading(null)
    }
  }

  return (
    <div className={`bg-white rounded-xl border transition-all ${dup ? 'border-amber-300' : 'border-surface-200'}`}>
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <button onClick={() => setOpen(o => !o)} className="text-surface-400 hover:text-surface-700 flex-shrink-0">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <span className="flex-shrink-0 text-surface-400">
          {run.is_upload ? <Upload className="w-4 h-4 text-primary-500" /> : <LayoutList className="w-4 h-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-mono font-semibold text-surface-800">{run.run_id}</code>
            <StatusBadge status={run.status} />
            {run.is_upload && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                <Upload className="w-2.5 h-2.5" /> uploaded
              </span>
            )}
            {dup && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                ⚠ duplicate
              </span>
            )}
          </div>
          <div className="text-xs text-surface-400 mt-0.5 flex gap-3 flex-wrap items-center">
            <span>{fmtDate(run.timestamp)}</span>
            <span className="inline-flex items-center gap-1"><HardDrive className="w-3 h-3" />{fmtDisk(run.disk_kb)}</span>
            {sc && <span>{sc.zones} zones · {sc.seconds}s</span>}
            {sc?.location && (
              <span className="inline-flex items-center gap-1 text-surface-500">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                {sc.location}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {run.status === 'completed' && sc && (
            <a href={`https://www.agrispectra-q.cloud${run.dashboard_url}`}
              target="_blank" rel="noopener noreferrer"
              className="btn-outline inline-flex items-center gap-1.5 py-1.5 px-3 text-xs">
              <ExternalLink className="w-3.5 h-3.5" /> Dashboard
            </a>
          )}
          {!confirm ? (
            <button onClick={() => setConfirm(true)}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">Sure?</span>
              <button onClick={() => onDelete(run.run_id)}
                className="py-1 px-2.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700">Yes</button>
              <button onClick={() => setConfirm(false)}
                className="py-1 px-2.5 text-xs rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50">No</button>
            </div>
          )}
        </div>
      </div>

      {open && sc && (
        <div className="border-t border-surface-100 px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: 'Scene',       v: sc.scene },
              { l: 'Source file', v: sc.source_file.slice(0, 40) + (sc.source_file.length > 40 ? '…' : '') },
              { l: 'Dimensions',  v: sc.dims.length === 2 ? `${sc.dims[0]} × ${sc.dims[1]}` : '—' },
              { l: 'CRS',         v: sc.crs || '—' },
            ].map(({ l, v }) => (
              <div key={l} className="bg-surface-50 rounded-lg px-3 py-2">
                <div className="text-[10px] font-medium uppercase tracking-wider text-surface-400">{l}</div>
                <div className="text-xs font-semibold text-surface-700 mt-0.5 truncate" title={v}>{v}</div>
              </div>
            ))}
          </div>
          {sc.output_files.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-2">Output Files</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {sc.output_files.map(file => (
                  <div key={file.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-50 border border-surface-100 hover:border-primary-200 hover:bg-primary-50/20 transition-colors group">
                    <span className="text-base flex-shrink-0">{fileIcon(file.name)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-surface-700 truncate">{file.name}</div>
                      <div className="text-[10px] text-surface-400">{fmtDisk(file.size_kb)}</div>
                    </div>
                    <button onClick={() => handleDownload(file)} disabled={dlLoading === file.name}
                      className="flex-shrink-0 p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-40"
                      title={`Download ${file.name}`}>
                      {dlLoading === file.name
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Demo Scene Card ───────────────────────────────────────────────────────────

function DemoSceneCard({
  scene, onRemove, removing, onMetaSaved,
}: {
  scene: DemoSceneMeta
  onRemove: (runId: string, sceneName: string) => void
  removing: boolean
  onMetaSaved: () => void
}) {
  const [confirm,  setConfirm]  = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [label,    setLabel]    = useState(scene.label    || '')
  const [desc,     setDesc]     = useState(scene.desc     || '')
  const [tagsRaw,  setTagsRaw]  = useState((scene.tags || []).join(', '))
  const [f1,       setF1]       = useState(scene.f1_score || '')

  const handleSaveMeta = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/demo/meta`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          run_id:   scene.run_id,
          scene:    scene.scene,
          label:    label.trim(),
          desc:     desc.trim(),
          tags:     tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
          f1_score: f1.trim(),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`)
      setEditing(false)
      onMetaSaved()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden">
      {/* ── Header row ── */}
      <div className="px-5 py-4 flex flex-wrap items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
          <Star className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-800">{label || scene.scene}</span>
            <code className="text-[11px] font-mono text-surface-400">{scene.scene}</code>
            <span className="text-[11px] text-surface-300 font-mono">{scene.run_id}</span>
          </div>
          <div className="text-xs text-surface-500 mt-0.5 flex gap-3 flex-wrap items-center">
            {scene.location && (
              <span className="inline-flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                {scene.location}
              </span>
            )}
            <span>{scene.zones} zones</span>
            <span>{scene.seconds}s</span>
            {scene.dims.length === 2 && <span>{scene.dims[0]} × {scene.dims[1]} px</span>}
            {f1 && <span className="font-semibold text-emerald-700">F1 {f1}</span>}
          </div>
          {desc && <p className="text-xs text-surface-400 mt-1 truncate">{desc}</p>}
          {scene.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {scene.tags.map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 text-surface-500">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setEditing(e => !e)}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          {!confirm ? (
            <button onClick={() => setConfirm(true)} disabled={removing}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
              <StarOff className="w-3.5 h-3.5" /> Remove
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">Remove?</span>
              <button onClick={() => { setConfirm(false); onRemove(scene.run_id, scene.scene) }}
                className="py-1 px-2.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700">Yes</button>
              <button onClick={() => setConfirm(false)}
                className="py-1 px-2.5 text-xs rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50">No</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Inline meta editor ── */}
      {editing && (
        <div className="border-t border-surface-100 px-5 py-4 bg-surface-50 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400">Edit Scene Metadata</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Label</label>
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Sudan Scene 01"
                className="w-full px-3 py-2 text-xs rounded-lg border border-surface-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-100 outline-none bg-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">F1 Score</label>
              <input value={f1} onChange={e => setF1(e.target.value)} placeholder="e.g. 98.47%"
                className="w-full px-3 py-2 text-xs rounded-lg border border-surface-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-100 outline-none bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="Short description shown under the scene name..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-surface-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-100 outline-none bg-white resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Tags <span className="font-normal text-surface-400">(comma-separated)</span></label>
            <input value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} placeholder="e.g. Nile Agriculture, Irrigated, Sudan"
              className="w-full px-3 py-2 text-xs rounded-lg border border-surface-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-100 outline-none bg-white" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSaveMeta} disabled={saving}
              className="inline-flex items-center gap-1.5 py-1.5 px-4 text-xs font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 transition-colors">
              {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Save
            </button>
            <button onClick={() => setEditing(false)}
              className="py-1.5 px-3 text-xs rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-100">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Live Run Card (for promoting to demo) ─────────────────────────────────────

function LiveRunCard({
  run, onSetDemo, promoting,
}: { run: LiveRunInfo; onSetDemo: (runId: string, scenes: string[]) => void; promoting: boolean }) {
  const [open,    setOpen]    = useState(false)
  const [selScenes, setSelScenes] = useState<string[]>(run.scenes.map(s => s.scene))

  const toggle = (name: string) =>
    setSelScenes(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name])

  return (
    <div className={`bg-white rounded-xl border transition-all ${run.already_demo ? 'border-emerald-200' : 'border-surface-200'}`}>
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <button onClick={() => setOpen(o => !o)} className="text-surface-400 hover:text-surface-700 flex-shrink-0">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-mono font-semibold text-surface-800">{run.run_id}</code>
            <StatusBadge status={run.status} />
            {run.already_demo && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Star className="w-2.5 h-2.5" /> in demo
              </span>
            )}
          </div>
          <div className="text-xs text-surface-400 mt-0.5 flex gap-3 flex-wrap items-center">
            <span>{fmtDate(run.timestamp)}</span>
            <span className="inline-flex items-center gap-1"><HardDrive className="w-3 h-3" />{fmtDisk(run.disk_kb)}</span>
            <span>{run.scenes.length} scene{run.scenes.length !== 1 ? 's' : ''}</span>
            {run.scenes[0]?.location && (
              <span className="inline-flex items-center gap-1 text-surface-500">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                {run.scenes[0].location}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onSetDemo(run.run_id, selScenes)}
          disabled={promoting || selScenes.length === 0}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 flex-shrink-0">
          {promoting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
          Set as Demo
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-100 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-3">
            Select scenes to copy into demo:
          </p>
          <div className="space-y-2">
            {run.scenes.map(s => (
              <label key={s.scene}
                className="flex items-center gap-3 p-3 rounded-lg border border-surface-100 hover:border-primary-200 hover:bg-surface-50 cursor-pointer transition-colors">
                <input type="checkbox" checked={selScenes.includes(s.scene)}
                  onChange={() => toggle(s.scene)}
                  className="w-3.5 h-3.5 rounded accent-primary-600" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-surface-800">{s.scene}</span>
                    {s.location && <span className="text-xs text-surface-500">{s.location}</span>}
                  </div>
                  <div className="text-[10px] text-surface-400 mt-0.5 flex gap-2">
                    <span>{s.zones} zones</span>
                    <span>{s.seconds}s</span>
                    {s.dims.length === 2 && <span>{s.dims[0]} × {s.dims[1]} px</span>}
                    <span>{s.crs}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed,  setAuthed]  = useState(false)
  const [data,    setData]    = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null)
  const [tab,     setTab]     = useState<'uploads' | 'all' | 'demo'>('demo')

  // Demo Manager state
  const [demoData,    setDemoData]    = useState<DemoData | null>(null)
  const [liveRuns,    setLiveRuns]    = useState<LiveRunInfo[]>([])
  const [demoLoading, setDemoLoading] = useState(false)
  const [promoting,   setPromoting]   = useState<string | null>(null)
  const [removing,    setRemoving]    = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1') {
      setAuthed(true)
    }
  }, [])

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${PROD_API_BASE}/api/admin/runs`, { headers: HEADERS })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally { setLoading(false) }
  }, [])

  const loadDemo = useCallback(async () => {
    setDemoLoading(true)
    try {
      // Demo scenes from demo API
      const [dRes, lRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/demo`, { headers: HEADERS }),
        fetch(`${API_BASE}/api/admin/live-runs`, { headers: HEADERS }),
      ])
      if (dRes.ok)  setDemoData(await dRes.json())
      if (lRes.ok)  setLiveRuns((await lRes.json()).runs ?? [])
    } catch { /* ignore */ } finally {
      setDemoLoading(false)
    }
  }, [])

  useEffect(() => { if (authed) { load(); loadDemo() } }, [load, loadDemo, authed])

  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />

  const handleDelete = async (runId: string) => {
    try {
      const res = await fetch(`${PROD_API_BASE}/api/admin/runs/${runId}`, { method: 'DELETE', headers: HEADERS })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`)
      showToast(`Deleted ${runId}`, true)
      await load()
    } catch (e) { showToast(e instanceof Error ? e.message : 'Delete failed', false) }
  }

  const handleSetDemo = async (runId: string, scenes: string[]) => {
    setPromoting(runId)
    try {
      const res = await fetch(`${API_BASE}/api/admin/demo/set`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ run_id: runId, scenes }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
      showToast(`✅ ${scenes.length} scene(s) from ${runId} set as demo`, true)
      await loadDemo()
    } catch (e) { showToast(e instanceof Error ? e.message : 'Failed', false) }
    finally { setPromoting(null) }
  }

  const handleRemoveDemo = async (runId: string, scene: string) => {
    setRemoving(`${runId}/${scene}`)
    try {
      const res = await fetch(`${API_BASE}/api/admin/demo/${runId}/${scene}`, {
        method: 'DELETE', headers: HEADERS,
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
      showToast(`Removed ${scene} from demo`, true)
      await loadDemo()
    } catch (e) { showToast(e instanceof Error ? e.message : 'Failed', false) }
    finally { setRemoving(null) }
  }

  // Duplicate detection
  const dupSigs = new Set<string>()
  if (data) {
    const sigCount: Record<string, number> = {}
    for (const run of data.runs)
      for (const sc of run.scenes) {
        const sig = `${sc.source_file}|${sc.dims.join('x')}`
        sigCount[sig] = (sigCount[sig] ?? 0) + 1
      }
    for (const [sig, cnt] of Object.entries(sigCount)) if (cnt > 1) dupSigs.add(sig)
  }
  const isDup = (run: RunInfo) =>
    run.scenes.some(sc => dupSigs.has(`${sc.source_file}|${sc.dims.join('x')}`))

  const uploads  = data?.runs.filter(r => r.is_upload) ?? []
  const allRuns  = data?.runs                           ?? []
  const shown    = tab === 'uploads' ? uploads : allRuns
  const dupCount = allRuns.filter(isDup).length

  return (
    <div className="min-h-screen bg-surface-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white
          ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Run Manager</h1>
            <p className="text-sm text-surface-500 mt-0.5">AgriSpectra-Q · Admin</p>
          </div>
          <button onClick={() => { load(); loadDemo() }} disabled={loading || demoLoading}
            className="btn-outline inline-flex items-center gap-2 py-2 px-4 text-sm">
            <RefreshCw className={`w-4 h-4 ${(loading || demoLoading) ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Stats bar */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Runs',  value: data.total_runs,                                   icon: <LayoutList className="w-4 h-4" /> },
              { label: 'Uploaded',    value: uploads.length,                                     icon: <Upload className="w-4 h-4" /> },
              { label: 'Completed',   value: allRuns.filter(r => r.status === 'completed').length, icon: <CheckCircle className="w-4 h-4" /> },
              { label: 'Total Disk',  value: fmtDisk(data.total_disk_kb),                        icon: <HardDrive className="w-4 h-4" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white rounded-xl border border-surface-200 px-4 py-3 flex items-center gap-3">
                <span className="text-surface-400">{icon}</span>
                <div>
                  <div className="text-lg font-bold text-surface-900">{value}</div>
                  <div className="text-xs text-surface-400">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {dupCount > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
            <span><strong>{dupCount} run{dupCount > 1 ? 's' : ''}</strong> are duplicates — highlighted in orange. Safe to delete older copies.</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-100 border border-surface-200 rounded-lg p-1 mb-5 self-start w-fit overflow-x-auto">
          {([
            { id: 'demo',    label: `Demo Scenes (${demoData?.scenes.length ?? '…'})`,   icon: <Star className="w-3.5 h-3.5" /> },
            { id: 'uploads', label: `Uploaded (${uploads.length})`,                       icon: <Upload className="w-3.5 h-3.5" /> },
            { id: 'all',     label: `All Runs (${allRuns.length})`,                       icon: <LayoutList className="w-3.5 h-3.5" /> },
          ] as const).map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap
                ${tab === id ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-800'}`}>
              {icon}{label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {loading && !data && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}

        {/* ══ DEMO TAB ══════════════════════════════════════════════════════════ */}
        {tab === 'demo' && (
          <div className="space-y-6">

            {/* Current demo scenes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-emerald-600" /> Current Demo Scenes
                  </h2>
                  <p className="text-xs text-surface-400 mt-0.5">
                    These scenes are served live on <code className="bg-surface-100 px-1 rounded">/api/scenes</code> when judges click Run Analysis.
                    {demoData?.active_run_id && (
                      <> Active run: <code className="bg-surface-100 px-1 rounded">{demoData.active_run_id}</code></>
                    )}
                  </p>
                </div>
                {demoLoading && <RefreshCw className="w-4 h-4 animate-spin text-surface-400" />}
              </div>

              {demoData?.scenes.length === 0 && (
                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-surface-300 text-surface-400 text-sm">
                  No demo scenes configured. Promote a live run below.
                </div>
              )}
              <div className="space-y-2">
                {demoData?.scenes.map(s => (
                  <DemoSceneCard
                    key={`${s.run_id}/${s.scene}`}
                    scene={s}
                    onRemove={handleRemoveDemo}
                    removing={removing === `${s.run_id}/${s.scene}`}
                    onMetaSaved={loadDemo}
                  />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-surface-200" />

            {/* Live runs available to promote */}
            <div>
              <h2 className="text-sm font-semibold text-surface-900 flex items-center gap-2 mb-1">
                <LayoutList className="w-4 h-4 text-surface-400" /> Live Runs — Promote to Demo
              </h2>
              <p className="text-xs text-surface-400 mb-3">
                Select a run and tick which scenes to copy into <code className="bg-surface-100 px-1 rounded">demo_data/</code>. The demo API will serve them immediately.
              </p>

              {liveRuns.length === 0 && !demoLoading && (
                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-surface-300 text-surface-400 text-sm">
                  No live runs found in <code className="bg-surface-100 px-1 rounded">results/live_matrix/</code>.
                </div>
              )}
              <div className="space-y-2">
                {liveRuns.map(run => (
                  <LiveRunCard
                    key={run.run_id}
                    run={run}
                    onSetDemo={handleSetDemo}
                    promoting={promoting === run.run_id}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ UPLOADS / ALL RUNS TABS ═══════════════════════════════════════════ */}
        {(tab === 'uploads' || tab === 'all') && data && (
          <div className="space-y-3">
            {shown.length === 0 && (
              <div className="text-center py-12 text-surface-400 text-sm">
                {tab === 'uploads' ? 'No uploaded runs found.' : 'No runs found.'}
              </div>
            )}
            {shown.map(run => (
              <RunCard key={run.run_id} run={run} dup={isDup(run)} onDelete={handleDelete} />
            ))}
          </div>
        )}

        <div className="mt-8 flex items-start gap-2 text-xs text-surface-400">
          <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            <strong>Demo tab:</strong> manage which live results the demo API serves to visitors.
            Use <em>Set as Demo</em> to promote any run, <em>Remove</em> to unpublish a scene.
            Changes take effect immediately without restarting the server.
          </span>
        </div>
      </div>
    </div>
  )
}
