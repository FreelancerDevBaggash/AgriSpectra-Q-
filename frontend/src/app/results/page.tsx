import Link from 'next/link'

// ── Data — sourced from docs/AgriSpectra-Q_—_UX_UI_Product_Specification.md §6.10, §6.11
// All values are frozen scientific benchmark results

const BENCHMARK = [
  { model: 'AgriSpectra-Q',                  f1: 96.40, pr: 99.47, roc: 99.87, highlight: true  },
  { model: 'Adaptive Classical',             f1: 96.34, pr: 99.47, roc: 99.86, highlight: false },
  { model: 'HSI-RF',                         f1: 96.31, pr: 99.49, roc: 99.87, highlight: false },
  { model: '48-band Gradient Boosting',      f1: 95.22, pr: 99.23, roc: 99.80, highlight: false },
  { model: 'Spectral XGBoost',               f1: 94.78, pr: 99.24, roc: 99.81, highlight: false },
  { model: 'Current Hybrid',                 f1: 89.98, pr: 96.16, roc: 98.75, highlight: false },
]

const PER_SCENE = [
  { scene: 'Scene 01 — Sudan (DT0000192416)',   f1: 98.47, p: 98.23, r: 98.73, roc: 99.98 },
  { scene: 'Scene 02 — China (DT0000174684)',   f1: 95.42, p: 95.80, r: 95.10, roc: 99.83 },
  { scene: 'Scene 03 — Russia (DT0000203347)',  f1: 95.30, p: 94.81, r: 95.83, roc: 99.79 },
]

// Key findings — frozen benchmark results
const FINDINGS = [
  'AgriSpectra-Q has the highest numerical mean F1 (96.40%) among all six evaluated systems.',
  'Statistical superiority over HSI-RF was not established — paired bootstrap 95% CI [−0.0012, +0.0027] crosses zero. This comparison applies to AgriSpectra-Q vs HSI-RF only.',
  'Calibration ECE of 0.73% after post-hoc calibration — well-calibrated anomaly scores for the spectral-anomaly proxy target.',
  'At 10% inspection budget, the system achieves ~49% positive recall — ~5× better than random sampling.',
  'Ablation studies confirm the quantum-inspired component provides measurable contribution (no quantum hardware used).',
]

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = (value / max) * 100
  const color = value >= 96 ? 'bg-primary-500' : value >= 93 ? 'bg-gold-500' : 'bg-gold-400'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-surface-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-surface-900 w-14 text-right tabular-nums">{value.toFixed(2)}%</span>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-surface-50">

      {/* Header */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-surface-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-surface-700 transition-colors">Home</Link>
            <span aria-hidden="true">›</span>
            <span className="text-surface-600 font-medium">Benchmark Results</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="badge badge-frozen">FROZEN SCIENTIFIC BENCHMARK</span>
            <span className="badge bg-surface-100 text-surface-500 border border-surface-200">90 Runs · 6 Models · 3 Scenes</span>
          </div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Benchmark Results</h1>
          <p className="text-surface-500 max-w-2xl text-sm leading-relaxed">
            Six models evaluated across 3 real EnMAP scenes with 5 random seeds each.
            These are frozen scientific results — not live analysis outputs.
            For a live run, go to{' '}
            <Link href="/intelligence" className="text-primary-600 hover:underline">Intelligence → Run Analysis</Link>.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Interpretation — flat, no unnecessary card box */}
        <div>
          <p className="text-xs font-bold text-surface-400 uppercase tracking-wide mb-4">SCIENTIFIC INTERPRETATION</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-5 border-b border-surface-100">
            <div className="flex items-start gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-500 flex-shrink-0 mt-0.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              <div>
                <p className="text-sm font-semibold text-surface-900 mb-0.5">Competitive numerical result</p>
                <p className="text-xs text-surface-500">AgriSpectra-Q has the highest mean F1 (96.40%) among all six evaluated systems.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-500 flex-shrink-0 mt-0.5" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
              <div>
                <p className="text-sm font-semibold text-surface-900 mb-0.5">Statistical superiority over HSI-RF not established</p>
                <p className="text-xs text-surface-500">Bootstrap 95% CI [−0.0012, +0.0027] crosses zero. Not statistically significant.</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-surface-400 mt-3">
            Benchmark target is a Spectral Anomaly Proxy — not independently labelled disease or pest outcome.
          </p>
        </div>

        {/* KPI row — stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8 border-b border-surface-100">
          {[
            { val: '96.40%', lbl: 'Mean F1',       sub: '3 scenes × 5 seeds',  accent: 'text-primary-700' },
            { val: '99.47%', lbl: 'PR-AUC',         sub: 'Precision-Recall',    accent: 'text-primary-700' },
            { val: '99.87%', lbl: 'ROC-AUC',        sub: 'Discrimination',      accent: 'text-primary-700' },
            { val: '0.73%',  lbl: 'Calibrated ECE', sub: 'Prob. calibration',   accent: 'text-teal-700'    },
          ].map(({ val, lbl, sub, accent }) => (
            <div key={lbl} className="bg-white border border-surface-200 rounded-lg px-5 py-4">
              <div className={`text-3xl font-extrabold tabular-nums mb-1 ${accent}`}>{val}</div>
              <div className="text-sm font-semibold text-surface-800">{lbl}</div>
              <div className="text-xs text-surface-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Six-model benchmark table — spec §6.10 models list */}
        <div className="bg-white rounded-lg border border-surface-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="section-label text-xs mb-0.5">TABLE 1</p>
              <h2 className="text-base font-semibold text-surface-900">Six-Model Benchmark</h2>
            </div>
            <span className="chip hidden sm:inline-flex">Mean over 5 seeds × 3 scenes</span>
          </div>
          <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th className="w-56">Mean F1</th>
                <th className="w-56">PR-AUC</th>
                <th className="w-56">ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARK.map(row => (
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
                  <td><ScoreBar value={row.f1} /></td>
                  <td><ScoreBar value={row.pr} /></td>
                  <td><ScoreBar value={row.roc} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Per-scene results */}
        <div className="bg-white rounded-lg border border-surface-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100">
            <p className="section-label text-xs mb-0.5">TABLE 2</p>
            <h2 className="text-base font-semibold text-surface-900">AgriSpectra-Q — Per-Scene Results</h2>
          </div>
          <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scene</th>
                <th className="w-44">F1</th>
                <th className="w-44">Precision</th>
                <th className="w-44">Recall</th>
                <th className="w-44">ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {PER_SCENE.map(row => (
                <tr key={row.scene}>
                  <td className="font-medium text-surface-900 text-sm">{row.scene}</td>
                  <td><ScoreBar value={row.f1} /></td>
                  <td><ScoreBar value={row.p} /></td>
                  <td><ScoreBar value={row.r} /></td>
                  <td><ScoreBar value={row.roc} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Key findings — spec §6.11 detailed tables follow interpretation */}
        <div>
          <p className="section-label mb-2">KEY FINDINGS</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-5">What the Benchmark Tells Us</h2>
          <div className="space-y-3">
            {FINDINGS.map((f, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-500 flex-shrink-0 mt-0.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p className="text-surface-600 leading-relaxed">{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Validation methodology */}
        <div className="border-t border-surface-100 pt-8">
          <p className="section-label mb-5">VALIDATION METHODOLOGY</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                label: '5 Random Seeds',
                sub: '11, 22, 33, 44, 55',
                desc: 'Statistical stability across initialisation variance',
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400" aria-hidden="true">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/><path d="M12 6v6l4 2"/>
                  </svg>
                ),
              },
              {
                label: '3 Real EnMAP Scenes',
                sub: 'Sudan, China and Russia',
                desc: 'No simulated data — all results on actual EO imagery',
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                ),
              },
              {
                label: 'Paired Bootstrap',
                sub: 'n = 10,000 replicates',
                desc: 'Rigorous significance testing for model comparisons',
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400" aria-hidden="true">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                ),
              },
            ].map(({ label, sub, desc, icon }) => (
              <div key={label} className="bg-white border border-surface-200 rounded-lg px-5 py-4">
                <div className="mb-3">{icon}</div>
                <div className="font-semibold text-surface-900 text-sm mb-0.5">{label}</div>
                <div className="text-xs font-medium text-primary-600 mb-2">{sub}</div>
                <p className="text-xs text-surface-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-surface-100 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-surface-900 text-sm mb-1">Run a live spectral-priority analysis</h3>
            <p className="text-xs text-surface-500">Apply the live engine to real EnMAP scenes and generate georeferenced priority zones.</p>
          </div>
          <Link href="/intelligence" className="btn-primary whitespace-nowrap flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Run Live Analysis
          </Link>
        </div>
      </div>
    </div>
  )
}
