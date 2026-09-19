import Link from 'next/link'

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

const FINDINGS = [
  'AgriSpectra-Q achieves 96.40% mean F1 — highest numerical result among all six evaluated systems.',
  'Scene 01 (DT0000205230) delivers 98.47% F1, reflecting high spectral contrast in the Al Ain oasis region.',
  'Calibration ECE of 0.73% after post-hoc scaling — well-calibrated probabilities for reliable decision support.',
  'At 10% inspection budget, the system achieves ~49% positive recall — ~5× better than random sampling.',
  'Ablation studies confirm the quantum-inspired component provides measurable contribution to the hybrid architecture.',
  'Paired bootstrap confidence interval [−0.0012, +0.0027] vs HSI-RF — competitive result at n=10,000 replicates.',
]

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = (value / max) * 100
  const color = value >= 96 ? 'bg-spectral-500' : value >= 93 ? 'bg-amber-500' : 'bg-risk-400'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-surface-100">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-surface-900 w-14 text-right tabular-nums">{value.toFixed(2)}%</span>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-surface-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-surface-900 via-primary-950 to-surface-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="badge badge-frozen">FROZEN SCIENTIFIC BENCHMARK</span>
            <span className="badge bg-surface-700/60 text-surface-300 border border-surface-600">90 Total Runs</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Industrial Validation Results</h1>
          <p className="text-primary-200/70 max-w-2xl">
            Six models evaluated across 3 real EnMAP scenes with 5 random seeds each.
            Spatially separated splits, frozen test predictions, and paired bootstrap significance testing.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { val: '96.40%', lbl: 'Mean F1',      sub: '3 scenes × 5 seeds',  color: 'text-primary-700',  bg: 'bg-primary-50'  },
            { val: '99.47%', lbl: 'PR-AUC',        sub: 'Precision-Recall',    color: 'text-spectral-700', bg: 'bg-spectral-50' },
            { val: '99.87%', lbl: 'ROC-AUC',       sub: 'Discrimination',      color: 'text-quantum-700',  bg: 'bg-quantum-50'  },
            { val: '0.73%',  lbl: 'Calibrated ECE',sub: 'Prob. calibration',   color: 'text-amber-700',    bg: 'bg-amber-50'    },
          ].map(({ val, lbl, sub, color, bg }) => (
            <div key={lbl} className={`rounded-2xl border border-surface-200 p-5 text-center ${bg}`}>
              <div className={`text-3xl font-extrabold ${color} tabular-nums mb-1`}>{val}</div>
              <div className="text-sm font-semibold text-surface-800">{lbl}</div>
              <div className="text-xs text-surface-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Six-model benchmark */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <div>
              <p className="section-label">TABLE 1</p>
              <h2 className="text-lg font-bold text-surface-900">Six-Model Benchmark</h2>
            </div>
            <span className="chip">Mean over 5 seeds × 3 scenes</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Model</th>
                <th className="w-60">Mean F1</th>
                <th className="w-60">PR-AUC</th>
                <th className="w-60">ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARK.map(row => (
                <tr key={row.model} className={row.highlight ? '!bg-primary-50/60' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      {row.highlight && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-600 flex-shrink-0">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      )}
                      <span className={`font-semibold ${row.highlight ? 'text-primary-800' : 'text-surface-800'}`}>
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

        {/* Per-scene */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100">
            <p className="section-label">TABLE 2</p>
            <h2 className="text-lg font-bold text-surface-900">AgriSpectra-Q — Per-Scene Results</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Scene</th>
                <th className="w-52">F1</th>
                <th className="w-52">Precision</th>
                <th className="w-52">Recall</th>
                <th className="w-52">ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {PER_SCENE.map(row => (
                <tr key={row.scene}>
                  <td className="font-medium text-surface-900">{row.scene}</td>
                  <td><ScoreBar value={row.f1} /></td>
                  <td><ScoreBar value={row.p} /></td>
                  <td><ScoreBar value={row.r} /></td>
                  <td><ScoreBar value={row.roc} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Key findings */}
        <div className="card p-6">
          <p className="section-label mb-3">KEY SCIENTIFIC FINDINGS</p>
          <h2 className="text-lg font-bold text-surface-900 mb-5">What the Benchmark Tells Us</h2>
          <div className="space-y-3">
            {FINDINGS.map((f, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-spectral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-spectral-600">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="text-surface-700 leading-relaxed">{f}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Validation properties */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: '5 Random Seeds',        sub: '11, 22, 33, 44, 55',      icon: '🎲', desc: 'Statistical stability across initialisation variance' },
            { label: '3 Real EnMAP Scenes',   sub: 'UAE & Gulf region',        icon: '🛰️', desc: 'No simulated data — all results on actual EO imagery' },
            { label: 'Paired Bootstrap',      sub: 'n = 10,000 replicates',    icon: '📊', desc: 'Rigorous significance testing for model comparisons' },
          ].map(({ label, sub, icon, desc }) => (
            <div key={label} className="card p-5">
              <div className="text-3xl mb-3">{icon}</div>
              <div className="font-bold text-surface-900 mb-0.5">{label}</div>
              <div className="text-xs font-medium text-primary-600 mb-2">{sub}</div>
              <p className="text-xs text-surface-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-surface-900 mb-1">Run Your Own Live Analysis</h3>
            <p className="text-sm text-surface-600">Apply the AgriSpectra-Q engine to real EnMAP scenes and generate live priority maps.</p>
          </div>
          <Link href="/intelligence" className="btn-primary whitespace-nowrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start Live Analysis
          </Link>
        </div>
      </div>
    </div>
  )
}
