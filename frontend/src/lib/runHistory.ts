/**
 * runHistory — persists recent analysis run IDs in localStorage.
 *
 * Each entry stores the minimal metadata needed to navigate back to the
 * Dashboard without re-running the analysis.
 *
 * Storage key: "agrispectra_runs"
 * Max entries: RUN_HISTORY_MAX (newest first)
 */

export interface RunHistoryEntry {
  run_id:    string
  scene:     string           // scene_id or "upload_xxxxxxxx" for uploads
  label:     string           // human-readable scene label or filename
  timestamp: string           // ISO 8601
  source:    'scene' | 'upload'
}

const STORAGE_KEY    = 'agrispectra_runs'
const RUN_HISTORY_MAX = 5

function isClient() {
  return typeof window !== 'undefined'
}

export function getRunHistory(): RunHistoryEntry[] {
  if (!isClient()) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as RunHistoryEntry[]
  } catch {
    return []
  }
}

export function saveRun(entry: RunHistoryEntry): void {
  if (!isClient()) return
  try {
    const existing = getRunHistory().filter(r => r.run_id !== entry.run_id)
    const updated  = [entry, ...existing].slice(0, RUN_HISTORY_MAX)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage may be full or blocked — fail silently
  }
}

export function clearRunHistory(): void {
  if (!isClient()) return
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}
