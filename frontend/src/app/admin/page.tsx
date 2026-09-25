'use client'

import { useEffect, useState, useCallback } from 'react'
import { PROD_API_BASE } from '@/lib/config'
import {
  Trash2, RefreshCw, ExternalLink, AlertTriangle,
  CheckCircle, Clock, HardDrive, Download, FileText,
  Upload, LayoutList, ChevronDown, ChevronRight,
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

// ── Config ────────────────────────────────────────────────────────────────────

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? 'agrq-admin-2026'
const HEADERS   = { 'X-Admin-Key': ADMIN_KEY }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(ts: string) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' }) } catch { return ts }
}
function fmtDisk(kb: number) {
  return kb >= 1024 ? `${(kb/1024).toFixed(1)} MB` : `${kb} KB`
}
function fileIcon(name: string) {
  if (name.endsWith('.geojson')) return '🗺'
  if (name.endsWith('.csv'))    return '📊'
  if (name.endsWith('.json'))   return '📄'
  if (name.endsWith('.tif'))    return '🛰'
  return '📁'
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
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-surface-100 text-surface-500 border border-surface-200">{status||'unknown'}</span>
}

// ── Download helper (cross-origin safe) ───────────────────────────────────────

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

function RunCard({
  run, dup, onDelete,
}: {
  run: RunInfo
  dup: boolean
  onDelete: (id: string) => void
}) {
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

      {/* ── Header row ── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">

        {/* Expand toggle */}
        <button onClick={() => setOpen(o => !o)} className="text-surface-400 hover:text-surface-700 flex-shrink-0">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Type icon */}
        <span className="flex-shrink-0 text-surface-400">
          {run.is_upload ? <Upload className="w-4 h-4 text-primary-500" /> : <LayoutList className="w-4 h-4" />}
        </span>

        {/* ID + badges */}
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
          <div className="text-xs text-surface-400 mt-0.5 flex gap-3 flex-wrap">
            <span>{fmtDate(run.timestamp)}</span>
            <span className="inline-flex items-center gap-1">
              <HardDrive className="w-3 h-3" />{fmtDisk(run.disk_kb)}
            </span>
            {sc && <span>{sc.zones} zones · {sc.seconds}s</span>}
          </div>
        </div>

        {/* Actions */}
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
                className="py-1 px-2.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700">
                Yes
              </button>
              <button onClick={() => setConfirm(false)}
                className="py-1 px-2.5 text-xs rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50">
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Expanded: scene detail + output files ── */}
      {open && sc && (
        <div className="border-t border-surface-100 px-5 py-4 space-y-4">

          {/* Scene meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: 'Scene',      v: sc.scene },
              { l: 'Source file', v: sc.source_file.slice(0,40) + (sc.source_file.length > 40 ? '…' : '') },
              { l: 'Dimensions', v: sc.dims.length === 2 ? `${sc.dims[0]} × ${sc.dims[1]}` : '—' },
              { l: 'CRS',        v: sc.crs || '—' },
            ].map(({ l, v }) => (
              <div key={l} className="bg-surface-50 rounded-lg px-3 py-2">
                <div className="text-[10px] font-medium uppercase tracking-wider text-surface-400">{l}</div>
                <div className="text-xs font-semibold text-surface-700 mt-0.5 truncate" title={v}>{v}</div>
              </div>
            ))}
          </div>

          {/* Output files */}
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
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={dlLoading === file.name}
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [data,    setData]    = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null)
  const [tab,     setTab]     = useState<'uploads' | 'all'>('uploads')

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

  useEffect(() => { load() }, [load])

  const handleDelete = async (runId: string) => {
    try {
      const res = await fetch(`${PROD_API_BASE}/api/admin/runs/${runId}`, { method: 'DELETE', headers: HEADERS })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`)
      showToast(`Deleted ${runId}`, true)
      await load()
    } catch (e) { showToast(e instanceof Error ? e.message : 'Delete failed', false) }
  }

  // ── Duplicate detection ────────────────────────────────────────────────────
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

  const uploads = data?.runs.filter(r => r.is_upload)  ?? []
  const allRuns = data?.runs                            ?? []
  const shown   = tab === 'uploads' ? uploads : allRuns
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
            <p className="text-sm text-surface-500 mt-0.5">AgriSpectra-Q · Production API · <code className="text-xs bg-surface-100 px-1 rounded">{PROD_API_BASE}</code></p>
          </div>
          <button onClick={load} disabled={loading}
            className="btn-outline inline-flex items-center gap-2 py-2 px-4 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Stats bar */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Runs',   value: data.total_runs,                                        icon: <LayoutList className="w-4 h-4" /> },
              { label: 'Uploaded',     value: uploads.length,                                          icon: <Upload className="w-4 h-4" /> },
              { label: 'Completed',    value: allRuns.filter(r => r.status==='completed').length,      icon: <CheckCircle className="w-4 h-4" /> },
              { label: 'Total Disk',   value: fmtDisk(data.total_disk_kb),                             icon: <HardDrive className="w-4 h-4" /> },
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

        {/* Duplicate warning */}
        {dupCount > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
            <span>
              <strong>{dupCount} run{dupCount>1?'s':''}</strong> are duplicates of the same uploaded file — highlighted in orange. Safe to delete older copies.
            </span>
          </div>
        )}

        {/* Tabs */}
        {data && (
          <div className="flex gap-1 bg-surface-100 border border-surface-200 rounded-lg p-1 mb-5 self-start w-fit">
            {([
              { id: 'uploads', label: `Uploaded Files (${uploads.length})`, icon: <Upload className="w-3.5 h-3.5" /> },
              { id: 'all',     label: `All Runs (${allRuns.length})`,        icon: <LayoutList className="w-3.5 h-3.5" /> },
            ] as const).map(({ id, label, icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
                  ${tab===id ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-800'}`}>
                {icon}{label}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Run cards */}
        {data && (
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

        {/* Help note */}
        <div className="mt-8 flex items-start gap-2 text-xs text-surface-400">
          <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>Click the arrow (▶) on any run to expand and see output files. Use the download button next to each file to save it locally. Deleted runs are permanently removed from the server.</span>
        </div>
      </div>
    </div>
  )
}
