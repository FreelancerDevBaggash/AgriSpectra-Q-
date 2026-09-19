/**
 * Shared UI components for AgriSpectra-Q
 */
import { AlertTriangle, RefreshCw } from 'lucide-react'

// ── LoadingSpinner ────────────────────────────────────────────────────────────

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  subMessage?: string
}

export function LoadingSpinner({ size = 'md', message, subMessage }: LoadingSpinnerProps) {
  const sizeClasses = { sm: 'w-6 h-6 border-2', md: 'w-10 h-10 border-4', lg: 'w-14 h-14 border-4' }
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
      {message && <p className="text-gray-600 font-medium">{message}</p>}
      {subMessage && <p className="text-gray-400 text-sm">{subMessage}</p>}
    </div>
  )
}

// ── FullPageLoader ────────────────────────────────────────────────────────────

export function FullPageLoader({ message = 'Loading…', subMessage }: { message?: string; subMessage?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner size="lg" message={message} subMessage={subMessage} />
    </div>
  )
}

// ── ErrorCard ─────────────────────────────────────────────────────────────────

interface ErrorCardProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorCard({ title = 'Something went wrong', message, onRetry }: ErrorCardProps) {
  return (
    <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      )}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  value: string | number
  label: string
  sub?: string
  icon?: React.ComponentType<{ className?: string }>
  iconColor?: string
  iconBg?: string
}

export function StatCard({ value, label, sub, icon: Icon, iconColor = 'text-primary-600', iconBg = 'bg-primary-50' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {Icon && (
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${iconBg} ${iconColor} mb-3`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

// ── PriorityBadge ─────────────────────────────────────────────────────────────

export function PriorityBadge({ category }: { category: string }) {
  const c = (category || '').toLowerCase()
  const classes = c.includes('high')
    ? 'bg-red-100 text-red-700'
    : c.includes('medium')
    ? 'bg-amber-100 text-amber-700'
    : c.includes('low')
    ? 'bg-green-100 text-green-700'
    : 'bg-blue-100 text-blue-700'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {category || 'Unknown'}
    </span>
  )
}

// ── ProgressBar ───────────────────────────────────────────────────────────────

export function ProgressBar({ value, max = 100, color = 'bg-primary-500' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="w-full h-2 rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  badge?: string
  badgeVariant?: 'live' | 'frozen' | 'default'
}

export function SectionHeader({ icon: Icon, title, subtitle, badge, badgeVariant = 'default' }: SectionHeaderProps) {
  const badgeClasses = badgeVariant === 'live'
    ? 'badge-live'
    : badgeVariant === 'frozen'
    ? 'badge-frozen'
    : 'bg-gray-100 text-gray-700'

  return (
    <div className="mb-8">
      {badge && (
        <span className={`badge ${badgeClasses} text-xs mb-3 inline-block`}>{badge}</span>
      )}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 flex items-center gap-3">
        {Icon && <Icon className="w-8 h-8 text-primary-600 flex-shrink-0" />}
        {title}
      </h1>
      {subtitle && <p className="text-lg text-gray-600 max-w-3xl">{subtitle}</p>}
    </div>
  )
}

// ── ScientificDisclaimer ──────────────────────────────────────────────────────

export function ScientificDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <span><strong>Decision support only.</strong> All priority zones require field verification. Not a disease or pest diagnosis.</span>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-4 bg-amber-50 border border-amber-300 rounded-xl p-5">
      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-amber-900">
        <p className="font-bold mb-1">Scientific Boundary Statement</p>
        <p>
          AgriSpectra-Q identifies <strong>spectral-anomaly priority candidates</strong> for field inspection.
          It does not diagnose disease, pests, or biological stress. All priority zones require{' '}
          <strong>independent field verification</strong>. The output is a decision-support signal, 
          not a confirmed agricultural diagnosis.
        </p>
      </div>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-6">{message}</p>
      {action}
    </div>
  )
}
