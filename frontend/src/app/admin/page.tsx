'use client'

import { useEffect, useState, useCallback } from 'react'
import { PROD_API_BASE } from '@/lib/config'
import { Trash2, RefreshCw, ExternalLink, AlertTriangle, CheckCircle, Clock, HardDrive } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SceneInfo {
  scene:       string
  zones:       number
  seconds:     number
  source_file: string
  dims:        [number, number]
  crs:         string
}

interface RunInfo {
  run_id:        string
  status:        string
  timestamp:     string
  source:        string
  scenes:        SceneInfo[]
  disk_kb:       number
  dashboard_url: string
}

interface AdminData {
  runs:          RunInfo[]
  total_runs:    number
  total_disk_kb: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? 'agrq-admin-2026'

function statusBadge(status: string) {
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
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-100 text-surface-500 border border-surface-200">
      {status || 'unknown'}
    </span>
  )
}

function fmtDate(ts: string) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString() } catch { return ts }
}

function fmtDisk(kb: number) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [data,      setData]      = useState<AdminData | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<string | null>(null)  // run_id awaiting confirm
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${PROD_API_BASE}/api/admin/runs`, {
        headers: { 'X-Admin-Key': ADMIN_KEY },
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const deleteRun = async (runId: string) => {
    setDeleting(runId); setConfirmed(null)
    try {
      const res = await fetch(`${PROD_API_BASE}/api/admin/runs/${runId}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Key': ADMIN_KEY },
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      showToast(`Deleted ${runId}`, true)
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Delete failed', false)
    } finally {
      setDeleting(null)
    }
  }

  // ── Duplicate detection ────────────────────────────────────────────────────
  const dupSigs = new Set<string>()
  const sigCount: Record<string, number> = {}
  if (data) {
    for (const run of data.runs) {
      for (const sc of run.scenes) {
        const sig = `${sc.source_file}|${sc.dims.join('x')}`
        sigCount[sig] = (sigCount[sig] ?? 0) + 1
      }
    }
    for (const [sig, cnt] of Object.entries(sigCount)) {
      if (cnt > 1) dupSigs.add(sig)
    }
  }

  const isDuplicate = (run: RunInfo) =>
    run.scenes.some(sc => dupSigs.has(`${sc.source_file}|${sc.dims.join('x')}`))

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all
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
            <p className="text-sm text-surface-500 mt-0.5">AgriSpectra-Q · Production API</p>
          </div>
          <button onClick={load} disabled={loading}
            className="btn-outline inline-flex items-center gap-2 py-2 px-4 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats bar */}
        {data && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Runs',       value: data.total_runs },
              { label: 'Completed',        value: data.runs.filter(r => r.status === 'completed').length },
              { label: 'Total Disk',       value: fmtDisk(data.total_disk_kb) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-lg border border-surface-200 px-4 py-3 text-center">
                <div className="text-xl font-bold text-surface-900">{value}</div>
                <div className="text-xs text-surface-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Duplicate warning */}
        {dupSigs.size > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
            <span>
              <strong>{dupSigs.size} duplicate file{dupSigs.size > 1 ? 's' : ''}</strong> detected — same source uploaded multiple times.
              Duplicate runs are highlighted in orange. You can safely delete the older copies.
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Runs table */}
        {data && (
          <div className="space-y-3">
            {data.runs.map(run => {
              const dup   = isDuplicate(run)
              const sc    = run.scenes[0]
              const isDeleting = deleting === run.run_id
              const awaitConfirm = confirmed === run.run_id

              return (
                <div key={run.run_id}
                  className={`bg-white rounded-xl border transition-colors
                    ${dup ? 'border-amber-300 shadow-amber-50 shadow-sm' : 'border-surface-200'}
                  `}>

                  {/* Row header */}
                  <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                    {/* Run ID + status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-mono font-semibold text-surface-800">{run.run_id}</code>
                        {statusBadge(run.status)}
                        {dup && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            ⚠ duplicate
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-surface-400 mt-1 flex gap-3 flex-wrap">
                        <span>{fmtDate(run.timestamp)}</span>
                        <span className="inline-flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />{fmtDisk(run.disk_kb)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Dashboard link */}
                      {run.status === 'completed' && sc && (
                        <a
                          href={`https://www.agrispectra-q.cloud${run.dashboard_url}`}
                          target="_blank" rel="noopener noreferrer"
                          className="btn-outline inline-flex items-center gap-1.5 py-1.5 px-3 text-xs">
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </a>
                      )}

                      {/* Delete */}
                      {!awaitConfirm ? (
                        <button
                          onClick={() => setConfirmed(run.run_id)}
                          disabled={!!deleting}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600 font-medium">Sure?</span>
                          <button
                            onClick={() => deleteRun(run.run_id)}
                            disabled={isDeleting}
                            className="py-1 px-2.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                            {isDeleting ? '…' : 'Yes, delete'}
                          </button>
                          <button
                            onClick={() => setConfirmed(null)}
                            className="py-1 px-2.5 text-xs rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50">
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scene details */}
                  {run.scenes.length > 0 && (
                    <div className="border-t border-surface-100 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { l: 'Scene',      v: sc?.scene ?? '—' },
                        { l: 'Zones',      v: sc?.zones ?? '—' },
                        { l: 'Source file', v: (sc?.source_file ?? '—').slice(0, 38) + ((sc?.source_file?.length ?? 0) > 38 ? '…' : '') },
                        { l: 'Dimensions', v: sc ? `${sc.dims[0]} × ${sc.dims[1]}` : '—' },
                      ].map(({ l, v }) => (
                        <div key={l}>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-surface-400">{l}</div>
                          <div className="text-xs font-semibold text-surface-700 mt-0.5 truncate">{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {data?.runs.length === 0 && (
          <div className="text-center py-16 text-surface-400">No runs found.</div>
        )}
      </div>
    </div>
  )
}
