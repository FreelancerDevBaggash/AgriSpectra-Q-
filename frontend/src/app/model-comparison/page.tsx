'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'

// ── Frozen benchmark data — spec §14 / Results doc §14
// Source: docs/AgriSpectra-Q_—_UX_UI_Product_Specification.md

type MetricKey = 'f1' | 'pr' | 'roc'
type SortDir   = 'asc' | 'desc'

// Brier and ECE: lower is better — displayed separately from the bar-chart metrics
// brier/ece typed as number|null; null = not available in current frozen benchmark
const MODELS: Array<{ model: string; f1: number; pr: number; roc: number; brier: number | null; ece: number | null; highlight: boolean }> = [
  { model: 'AgriSpectra-Q',      f1: 96.40, pr: 99.47, roc: 99.87, brier: null, ece: 0.73, highlight: true  },
  { model: 'Adaptive Classical', f1: 96.34, pr: 99.47, roc: 99.86, brier: null, ece: null, highlight: false },
  { model: 'HSI-RF',             f1: 96.31, pr: 99.49, roc: 99.87, brier: null, ece: null, highlight: false },
  { model: '48-band XGBoost',    f1: 95.22, pr: 99.23, roc: 99.80, brier: null, ece: null, highlight: false },
  { model: 'Spectral XGBoost',   f1: 94.78, pr: 99.24, roc: 99.81, brier: null, ece: null, highlight: false },
  { model: 'Current Hybrid',     f1: 89.98, pr: 96.16, roc: 98.75, brier: null, ece: null, highlight: false },
]

const METRIC_LABELS: Record<MetricKey, string> = {
  f1:  'Mean F1',
  pr:  'PR-AUC',
  roc: 'ROC-AUC',
}

const METRIC_COLORS: Record<MetricKey, string> = {
  f1:  '#2090ff',
  pr:  '#22c55e',
  roc: '#a855f7',
}

function barColor(model: string, highlight: boolean, activeMetric: MetricKey) {
  if (highlight) return METRIC_COLORS[activeMetric]
  return '#cbd5e1'
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-surface-100">
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-semibold text-surface-900 w-14 text-right tabular-nums">{value.toFixed(2)}%</span>
    </div>
  )
}

export default function ModelComparisonPage() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('f1')
  const [sortKey, setSortKey]           = useState<MetricKey>('f1')
  const [sortDir, setSortDir]           = useState<SortDir>('desc')

  const sorted = [...MODELS].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey]
    return sortDir === 'desc' ? -diff : diff
  })

  function handleSort(key: MetricKey) {
    if (key === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const chartData = sorted.map(m => ({
    model:   m.model,
    value:   m[activeMetric],
    highlight: m.highlight,
  }))

  return (
    <div className="min-h-screen bg-surface-50">

      {/* Header */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-1 text-xs text-surface-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-surface-700 transition-colors">Home</Link>
            <span aria-hidden="true">›</span>
            <span className="text-surface-400">Science</span>
            <span aria-hidden="true">›</span>
            <span className="text-surface-600 font-medium">Model Comparison</span>
          </nav>

          <div className="flex items-center gap-2.5 mb-3">
            <span className="badge badge-frozen">FROZEN SCIENTIFIC BENCHMARK</span>
            <span className="badge bg-surface-100 text-surface-500 border border-surface-200">6 Models · 90 Runs</span>
          </div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Six-Model Comparison</h1>
          <p className="text-surface-500 max-w-2xl text-sm leading-relaxed">
            Side-by-side comparison of all six evaluated systems on 3 real EnMAP scenes × 5 seeds.
            Spatially separated splits, frozen test predictions.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Statistical caveat — must come first per spec §14 */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-surface-900 mb-1">Statistical interpretation</p>
            <p className="text-sm text-surface-600 leading-relaxed">
              AgriSpectra-Q has the highest numerical mean F1 (96.40%). However, its advantage over HSI-RF
              is only +0.0008 with a 95% bootstrap CI of [−0.0012, +0.0027] — which crosses zero.{' '}
              <strong className="text-surface-800">Statistical superiority is not established.</strong>
            </p>
          </div>
        </div>

        {/* Metric selector */}
        <div>
          <p className="section-label mb-3">METRIC</p>
          <div className="flex gap-2">
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map(k => (
              <button
                key={k}
                onClick={() => setActiveMetric(k)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  activeMetric === k
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white border-surface-200 text-surface-600 hover:border-primary-300 hover:text-primary-700'
                }`}
                style={activeMetric === k ? { backgroundColor: METRIC_COLORS[k], borderColor: METRIC_COLORS[k] } : {}}
              >
                {METRIC_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg border border-surface-200 p-5">
          <p className="text-xs font-bold text-surface-400 uppercase tracking-wide mb-1">
            {METRIC_LABELS[activeMetric]} — all six models
          </p>
          <figure>
            <figcaption className="sr-only">
              Bar chart comparing {METRIC_LABELS[activeMetric]} for six models. AgriSpectra-Q highlighted.
            </figcaption>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="model"
                  tick={{ fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={[88, 100]}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip formatter={(v: unknown) => [typeof v === 'number' ? `${v.toFixed(2)}%` : String(v ?? ''), METRIC_LABELS[activeMetric]] as [string, string]} />
                <ReferenceLine y={96.31} stroke="#94a3b8" strokeDasharray="4 2"
                  label={{ value: 'HSI-RF', fontSize: 10, fill: '#94a3b8', position: 'right' }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={barColor(entry.model, entry.highlight, activeMetric)}
                      opacity={entry.highlight ? 1 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-surface-500" aria-hidden="true">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: METRIC_COLORS[activeMetric] }} />
                AgriSpectra-Q
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-surface-300 inline-block" />
                Baselines
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 border-t border-dashed border-surface-400 inline-block" />
                HSI-RF baseline
              </span>
            </div>
          </figure>
        </div>

        {/* Sortable table */}
        <div className="bg-white rounded-lg border border-surface-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
            <div>
              <p className="section-label text-xs mb-0.5">TABLE 1</p>
              <h2 className="text-base font-semibold text-surface-900">Six-Model Benchmark — Click header to sort</h2>
            </div>
            <span className="chip">Mean over 5 seeds × 3 scenes</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                {(Object.keys(METRIC_LABELS) as MetricKey[]).map(k => (
                  <th key={k} className="w-40 cursor-pointer select-none" onClick={() => handleSort(k)}>
                    <span className="flex items-center gap-1">
                      {METRIC_LABELS[k]}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        className={`transition-transform ${sortKey === k && sortDir === 'asc' ? 'rotate-180' : ''} ${sortKey === k ? 'text-primary-600' : 'text-surface-300'}`}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </span>
                  </th>
                ))}
                <th className="w-24 text-left py-3 px-5 text-2xs font-bold text-surface-400 uppercase tracking-widest">
                  Brier <span className="text-surface-300 font-normal">↓</span>
                </th>
                <th className="w-24 text-left py-3 px-5 text-2xs font-bold text-surface-400 uppercase tracking-widest">
                  ECE <span className="text-surface-300 font-normal">↓</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(row => (
                <tr key={row.model} className={row.highlight ? '!bg-primary-50/40' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${row.highlight ? 'text-primary-800' : 'text-surface-800'}`}>
                        {row.model}
                      </span>
                      {row.highlight && (
                        <span className="badge bg-primary-100 text-primary-700 border border-primary-200 text-2xs py-0.5 px-2">Our System</span>
                      )}
                    </div>
                  </td>
                  <td><ScoreBar value={row.f1}  color={row.highlight ? METRIC_COLORS.f1  : '#94a3b8'} /></td>
                  <td><ScoreBar value={row.pr}  color={row.highlight ? METRIC_COLORS.pr  : '#94a3b8'} /></td>
                  <td><ScoreBar value={row.roc} color={row.highlight ? METRIC_COLORS.roc : '#94a3b8'} /></td>
                  <td className="text-sm tabular-nums text-surface-500 py-3.5 px-5">
                    {row.brier != null ? row.brier.toFixed(4) : <span className="text-surface-300">—</span>}
                  </td>
                  <td className="text-sm tabular-nums py-3.5 px-5">
                    {row.ece != null
                      ? <span className={row.highlight ? 'font-semibold text-spectral-700' : 'text-surface-500'}>{row.ece.toFixed(2)}%</span>
                      : <span className="text-surface-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-surface-100">
          <Link href="/research" className="btn-outline inline-flex items-center gap-2 text-sm">
            Research &amp; Validation
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
          <Link href="/intelligence" className="btn-primary inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Run Live Analysis
          </Link>
        </div>
      </div>
    </div>
  )
}
