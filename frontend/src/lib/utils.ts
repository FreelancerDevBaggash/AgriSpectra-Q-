/**
 * Merge Tailwind classes with proper precedence.
 * Usage: className={cn('base-class', condition && 'conditional-class')}
 */
export function cn(...inputs: (string | undefined | null | false | 0)[]): string {
  return inputs.filter(Boolean).join(' ')
}

/**
 * Format a number with specified decimal places
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals)
}

/**
 * Format area in square meters to hectares with appropriate unit
 */
export function formatArea(areaM2: number): string {
  if (areaM2 < 10000) {
    return `${formatNumber(areaM2, 0)} m²`
  }
  const hectares = areaM2 / 10000
  return `${formatNumber(hectares, 2)} ha`
}

/**
 * Get priority color based on category
 */
export function getPriorityColor(priority: string): string {
  const normalized = priority.toLowerCase()
  if (normalized.includes('high')) return 'text-red-700 bg-red-100'
  if (normalized.includes('medium')) return 'text-yellow-700 bg-yellow-100'
  if (normalized.includes('low')) return 'text-gray-700 bg-gray-100'
  return 'text-blue-700 bg-blue-100'
}

/**
 * Get risk level description
 */
export function getRiskLevel(risk: number): { level: string; color: string } {
  if (risk >= 2.0) return { level: 'Very High', color: 'text-red-700' }
  if (risk >= 1.5) return { level: 'High', color: 'text-orange-700' }
  if (risk >= 1.0) return { level: 'Moderate', color: 'text-yellow-700' }
  if (risk >= 0.5) return { level: 'Low', color: 'text-green-700' }
  return { level: 'Very Low', color: 'text-gray-700' }
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Generate color scale for heat maps
 */
export function getHeatmapColor(value: number, min: number, max: number): string {
  const normalized = (value - min) / (max - min)
  
  if (normalized < 0.2) return '#10b981' // green
  if (normalized < 0.4) return '#84cc16' // lime
  if (normalized < 0.6) return '#eab308' // yellow
  if (normalized < 0.8) return '#f97316' // orange
  return '#ef4444' // red
}

/**
 * Download file from URL
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Download failed:', error)
    throw error
  }
}

/**
 * Sleep utility for delays
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Parse CSV text to array of objects.
 * Numeric columns are automatically coerced to `number`; empty strings stay as `''`.
 * This is the canonical implementation — do NOT duplicate locally in pages.
 */
export function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',')
    const obj: Record<string, string | number> = {}
    headers.forEach((h, i) => {
      const v = values[i]?.trim() ?? ''
      obj[h] = v !== '' && !isNaN(Number(v)) ? Number(v) : v
    })
    return obj as unknown as T
  })
}
