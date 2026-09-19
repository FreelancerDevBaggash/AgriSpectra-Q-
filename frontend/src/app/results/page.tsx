import Link from 'next/link'

// ── Data — sourced from docs/AgriSpectra-Q_—_UX_UI_Product_Specification.md §6.10, §6.11
// All values are frozen scientific benchmark results

const BENCHMARK = [
  { model: 'AgriSpectra-Q',      f1: 96.40, pr: 99.47, roc: 99.87, highlight: true  },
  { model: 'Adaptive Classical', f1: 96.34, pr: 99.47, roc: 99.86, highlight: false },
  { model: 'HSI-RF',             f1: 96.31, pr: 99.49, roc: 99.87, highlight: false },
  { model: '48-band XGBoost',    f1: 95.22, pr: 99.23, roc: 99.80, highlight: false },
  { model: 'Spectral XGBoost',   f1: 94.78, pr: 99.24, roc: 99.81, highlight: false },
  { model: 'Current Hybrid',     f1: 89.98, pr: 96.16, roc: 98.75, highlight: false },
]

const PER_SCENE = [
  { scene: 'Scene 01 (DT0000205230)', f1: 98.47, p: 98.23, r: 98.73, roc: 99.98 },
  { scene: 'Scene 02',                f1: 95.42, p: 95.80, r: 95.10, roc: 99.83 },
  { scene: 'Scene 03',                f1: 95.30, p: 94.81, r: 95.83, roc: 99.79 },
]

// Key findings — spec §6.11 required metrics
const FINDINGS = [
  'AgriSpectra-Q achieves 96.40% mean F1 — highest numerical result among all six evaluated systems.',
  'Scene 01 (DT0000205230) delivers 98.47% F1, reflecting high spectral contrast in the Al Ain oasis region.',
  'Calibration ECE of 0.73% after post-hoc scaling — well-calibrated probabilities for decision support.',
  'At 10% inspection budget, the system achieves ~49% positive recall — ~5× better than random sampling.',
  'Ablation studies confirm the quantum-inspired component provides measurable contribution.',
  'Paired bootstrap CI [−0.0012, +0.0027] vs HSI-RF at n=10,000 replicates.',
]

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = (value / max) * 100
  const color = value >= 96 ? 'bg-spectral-500' : value >= 93 ? 'bg-amber-500' : 'bg-red-400'
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

      {/* Header — spec §6.10: FROZEN SCIENTIFIC BENCHMARK label mandatory */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-surface-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-surface-700 transition-colors">Home</Link>
            <span aria-hidden="true">›</span>
            <span className="text-surface-600 font-medium">Results</span>
          </nav>
          <div className="flex items-center gap-2.5 mb-3">
            {/* spec §3.2: FROZEN SCIENTIFIC BENCHMARK badge */}
            <span className="badge badge-frozen">FROZEN SCIENTIFIC BENCHMARK</span>
            <span className="badge bg-surface-100 text-surface-500 border border-surface-200">90 Total Runs</span>
          </div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Industrial Validation Results</h1>
          <p className="text-surface-500 max-w-2xl text-sm leading-relaxed">
            Six models evaluated across 3 real EnMAP scenes with 5 random seeds each.
            Spatially separated splits, frozen test predictions, and paired bootstrap significance testing.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Interpretation — flat, no unnecessary card box */}
        <div>
          <p className="text-xs font-bold text-surface-400 uppercase tracking-wide mb-4">SCIENTIFIC INTERPRETATION</p>
          <div className="grid sm:grid-cols-2 gap-5 pb-5 border-b border-surface-100">
            <div className="flex items-start gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-spectral-500 flex-shrink-0 mt-0.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              <div>
                <p className="text-sm font-semibold text-surface-900 mb-0.5">Competitive numerical result</p>
                <p className="text-xs text-surface-500">AgriSpectra-Q has the highest mean F1 (96.40%) among all six evaluated systems.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
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

        {/* KPI row — flat numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6 pb-8 border-b border-surface-100">
          {[
            { val: '96.40%', lbl: 'Mean F1',       sub: '3 scenes × 5 seeds'  },
            { val: '99.47%', lbl: 'PR-AUC',         sub: 'Precision-Recall'    },
            { val: '99.87%', lbl: 'ROC-AUC',        sub: 'Discrimination'      },
            { val: '0.73%',  lbl: 'Calibrated ECE', sub: 'Prob. calibration'   },
          ].map(({ val, lbl, sub }) => (
            <div key={lbl}>
              <div className="text-3xl font-extrabold text-surface-900 tabular-nums mb-1">{val}</div>
              <div className="text-sm font-semibold text-surface-700">{lbl}</div>
              <div className="text-xs text-surface-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Six-model benchmark table — spec §6.10 models list */}
        <div className="bg-white rounded-lg border border-surface-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
            <div>
              <p className="section-label text-xs mb-0.5">TABLE 1</p>
              <h2 className="text-base font-semibold text-surface-900">Six-Model Benchmark</h2>
            </div>
            <span className="chip">Mean over 5 seeds × 3 scenes</span>
          </div>
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

        {/* Per-scene results */}
        <div className="bg-white rounded-lg border border-surface-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100">
            <p className="section-label text-xs mb-0.5">TABLE 2</p>
            <h2 className="text-base font-semibold text-surface-900">AgriSpectra-Q — Per-Scene Results</h2>
          </div>
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

        {/* Key findings — spec §6.11 detailed tables follow interpretation */}
        <div>
          <p className="section-label mb-2">KEY FINDINGS</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-5">What the Benchmark Tells Us</h2>
          <div className="space-y-3">
            {FINDINGS.map((f, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-spectral-500 flex-shrink-0 mt-0.5">
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
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: '5 Random Seeds',      sub: '11, 22, 33, 44, 55',   desc: 'Statistical stability across initialisation variance' },
              { label: '3 Real EnMAP Scenes', sub: 'UAE & Gulf region',     desc: 'No simulated data — all results on actual EO imagery' },
              { label: 'Paired Bootstrap',    sub: 'n = 10,000 replicates', desc: 'Rigorous significance testing for model comparisons' },
            ].map(({ label, sub, desc }) => (
              <div key={label}>
                <div className="font-semibold text-surface-900 text-sm mb-0.5">{label}</div>
                <div className="text-xs font-medium text-primary-600 mb-1">{sub}</div>
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
