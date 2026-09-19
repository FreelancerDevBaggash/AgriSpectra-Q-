import Link from 'next/link'
import {
  BarChart3, CheckCircle, TrendingUp, Award, ArrowRight,
  Satellite, Shield, Target, Layers
} from 'lucide-react'

// ── Static benchmark data (from results/industrial_validation) ──────────────

const BENCHMARK = [
  { model: 'AgriSpectra-Q',       f1: 96.40, pr_auc: 99.47, roc_auc: 99.87, highlight: true },
  { model: 'Adaptive Classical',  f1: 96.34, pr_auc: 99.47, roc_auc: 99.86, highlight: false },
  { model: 'HSI-RF',              f1: 96.31, pr_auc: 99.49, roc_auc: 99.87, highlight: false },
  { model: '48-band XGBoost',     f1: 95.22, pr_auc: 99.23, roc_auc: 99.80, highlight: false },
  { model: 'Spectral XGBoost',    f1: 94.78, pr_auc: 99.24, roc_auc: 99.81, highlight: false },
  { model: 'Current Hybrid',      f1: 89.98, pr_auc: 96.16, roc_auc: 98.75, highlight: false },
]

const PER_SCENE = [
  { scene: 'Scene 01 (DT0000205230)', f1: 98.47, precision: 98.23, recall: 98.73, roc_auc: 99.98 },
  { scene: 'Scene 02',                f1: 95.42, precision: 95.80, recall: 95.10, roc_auc: 99.83 },
  { scene: 'Scene 03',                f1: 95.30, precision: 94.81, recall: 95.83, roc_auc: 99.79 },
]

const VALIDATION_HIGHLIGHTS = [
  { label: 'Mean F1 Score',         value: '96.40%', sub: 'Across 3 scenes × 5 seeds' },
  { label: 'Mean PR-AUC',           value: '99.47%', sub: 'Precision-Recall curve' },
  { label: 'Mean ROC-AUC',          value: '99.87%', sub: 'Discrimination power' },
  { label: 'Calibrated ECE',        value: '0.73%',  sub: 'Expected calibration error' },
]

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = (value / max) * 100
  const color = value >= 96 ? 'bg-green-500' : value >= 93 ? 'bg-amber-500' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-14 text-right">{value.toFixed(2)}%</span>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-frozen text-xs">FROZEN SCIENTIFIC BENCHMARK</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Industrial Validation Results
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Reproducible benchmark results from the AgriSpectra-Q industrial validation study. 
            Six models evaluated across 3 EnMAP scenes with 5 random seeds each 
            (90 total runs). All metrics are averaged over seeds.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {VALIDATION_HIGHLIGHTS.map(({ label, value, sub }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <div className="text-3xl font-bold text-primary-600 mb-1">{value}</div>
              <div className="text-sm font-semibold text-gray-800">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Six-Model Benchmark Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Six-Model Benchmark (Table 1)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Model</th>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-64">Mean F1</th>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-64">PR-AUC</th>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-64">ROC-AUC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {BENCHMARK.map((row) => (
                  <tr
                    key={row.model}
                    className={`transition-colors ${row.highlight ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="py-4 px-5 font-medium text-gray-900 flex items-center gap-2">
                      {row.highlight && <Award className="w-4 h-4 text-primary-600" />}
                      {row.model}
                      {row.highlight && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-semibold ml-1">
                          Our System
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5"><ScoreBar value={row.f1} /></td>
                    <td className="py-4 px-5"><ScoreBar value={row.pr_auc} /></td>
                    <td className="py-4 px-5"><ScoreBar value={row.roc_auc} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Scene Results */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
            <Satellite className="w-5 h-5 text-secondary-600" />
            <h2 className="text-lg font-semibold text-gray-900">AgriSpectra-Q Per-Scene Results (Table 2)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Scene</th>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">F1</th>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Precision</th>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Recall</th>
                  <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">ROC-AUC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {PER_SCENE.map((row) => (
                  <tr key={row.scene} className="hover:bg-gray-50">
                    <td className="py-4 px-5 font-medium text-gray-900">{row.scene}</td>
                    <td className="py-4 px-5"><ScoreBar value={row.f1} /></td>
                    <td className="py-4 px-5"><ScoreBar value={row.precision} /></td>
                    <td className="py-4 px-5"><ScoreBar value={row.recall} /></td>
                    <td className="py-4 px-5"><ScoreBar value={row.roc_auc} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Validation Properties */}
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Shield,
              title: 'Reproducible Science',
              desc: '5 random seeds (11, 22, 33, 44, 55) ensure statistical stability. Results are averaged and bootstrapped for significance.',
              color: 'text-primary-600 bg-primary-50',
            },
            {
              icon: Target,
              title: 'Industrial Validation',
              desc: 'Designed for real field decision support: calibration, cost-sensitive routing, inspection-budget optimization, and ablation studies.',
              color: 'text-secondary-600 bg-secondary-50',
            },
            {
              icon: Layers,
              title: 'Real EnMAP Data',
              desc: '224-band hyperspectral imagery from actual EnMAP satellite passes. No simulated or synthetic data—only real spectral observations.',
              color: 'text-green-700 bg-green-50',
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${color} mb-4`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Key Findings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" /> Key Scientific Findings
          </h2>
          <div className="space-y-3">
            {[
              'AgriSpectra-Q achieves 96.40% mean F1 — top-ranked among all six evaluated systems.',
              'Scene 01 (DT0000205230) shows the strongest performance at 98.47% F1, reflecting high spectral contrast in the Al Ain oasis region.',
              'Calibration ECE of 0.73% after post-hoc scaling indicates well-calibrated probability estimates suitable for decision support.',
              'Inspection budget analysis shows 60% positive recall at 10% budget fraction — 6× better than random sampling.',
              'Ablation studies confirm that the quantum-enhanced component contributes +0.1% F1 uplift over classical baselines.',
              'All results are statistically significant with p < 0.05 under paired bootstrap resampling (n=10,000 replicates).',
            ].map((finding, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{finding}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Run a Live Analysis</h3>
            <p className="text-sm text-gray-600">Apply the AgriSpectra-Q engine to real EnMAP scenes and generate your own priority maps.</p>
          </div>
          <Link href="/intelligence" className="btn-primary inline-flex items-center gap-2 whitespace-nowrap">
            Start Live Analysis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
