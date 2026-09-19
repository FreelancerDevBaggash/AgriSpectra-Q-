import Link from 'next/link'

// ── Research & Validation page — spec §15
// Exposes the scientific protocol, evidence, and current limitations.
// All values are frozen benchmark results — FROZEN SCIENTIFIC BENCHMARK label mandatory.

const EVIDENCE_ITEMS = [
  { label: '3 EnMAP scenes',        sub: 'UAE & Gulf region — real EO data, no simulation' },
  { label: '224 spectral bands',     sub: 'Full hyperspectral L2A sensor output per scene' },
  { label: '5 random seeds',         sub: 'Seeds 11, 22, 33, 44, 55 — statistical stability' },
  { label: 'Spatially separated',    sub: 'Train/validation/test splits prevent leakage' },
  { label: '90 total runs',          sub: '6 models × 3 scenes × 5 seeds' },
  { label: '10,000 bootstrap reps',  sub: 'Paired bootstrap for significance testing' },
]

const BENCHMARK_METRICS = [
  { metric: 'Mean F1',           value: '96.40%', note: 'Highest among six evaluated systems' },
  { metric: 'PR-AUC',            value: '99.47%', note: 'Precision-recall area under curve' },
  { metric: 'ROC-AUC',           value: '99.87%', note: 'Discrimination performance' },
  { metric: 'Calibrated ECE',    value: '0.73%',  note: 'After post-hoc scaling — well-calibrated' },
  { metric: 'Inspection recall', value: '~49%',   note: 'At 10% budget — ~5× better than random' },
  { metric: 'Bootstrap CI vs HSI-RF', value: '[−0.0012, +0.0027]', note: 'Crosses zero — superiority not established' },
]

const LIMITATIONS = [
  'No field validation — no field-labelled disease or pest target exists.',
  'No blind fourth EnMAP scene — all scenes were used during development.',
  'No complete six-model LOSO evaluation — leave-one-scene-out not yet verified.',
  'Benchmark target is a Spectral Anomaly Proxy — not an independently labelled biological outcome.',
  'No proven quantum advantage — the quantum-inspired layer provides measurable contribution but no quantum hardware was used.',
  'No measured financial ROI — inspection cost savings are not verified against operational baselines.',
  'Wavelength metadata unavailable in GeoTIFF — band indices reported, physical wavelengths not verified.',
  'Priority thresholds are scene-relative percentiles — not absolute disease severity levels.',
  'Processing time varies per scene — not suitable for real-time operational use without further optimisation.',
]

const PROTOCOL_STEPS = [
  { step: '1', title: 'Scene preparation',         desc: 'Three real EnMAP L2A GeoTIFF scenes. Windowed streaming with constant memory footprint. NoData masking.' },
  { step: '2', title: 'Spectral anomaly proxy',     desc: 'RMS standardised deviation over 32 evenly-spaced bands. Scene-relative percentile thresholds (P50/P80/P95). Unsupervised — no disease labels.' },
  { step: '3', title: 'Spatial evaluation splits',  desc: 'Spatially separated train/validation/test split per scene. No pixel-level leakage between splits.' },
  { step: '4', title: 'Five random seeds',          desc: 'Seeds 11, 22, 33, 44, 55 per model per scene. 90 total evaluation runs. Mean and std computed per metric.' },
  { step: '5', title: 'Frozen test predictions',    desc: 'Test-set predictions locked before analysis. No post-hoc adjustment of thresholds or model parameters.' },
  { step: '6', title: 'Paired bootstrap',           desc: 'n = 10,000 replicates. 95% confidence interval for pairwise difference vs HSI-RF. CI reported verbatim.' },
  { step: '7', title: 'Calibration',                desc: 'Post-hoc Platt scaling. Expected Calibration Error (ECE) reported before and after calibration.' },
  { step: '8', title: 'Ablation study',             desc: 'Quantum-inspired component isolated. Measurable contribution confirmed on Scene 01. Not a quantum hardware claim.' },
]

export default function ResearchPage() {
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
            <span className="text-surface-600 font-medium">Research &amp; Evidence</span>
          </nav>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="badge badge-frozen">FROZEN SCIENTIFIC BENCHMARK</span>
          </div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Research &amp; Evidence</h1>
          <p className="text-surface-500 max-w-2xl text-sm leading-relaxed">
            Scientific protocol, validation evidence, and current limitations of the AgriSpectra-Q industrial PoC.
            All results are frozen — no live run affects these figures.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* Evidence summary */}
        <section>
          <p className="section-label mb-2">DATASET &amp; EVALUATION EVIDENCE</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-5">What Evidence Exists</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {EVIDENCE_ITEMS.map(({ label, sub }) => (
              <div key={label} className="bg-white border border-surface-200 rounded-lg px-4 py-3">
                <div className="text-sm font-bold text-surface-900 mb-0.5">{label}</div>
                <div className="text-xs text-surface-500 leading-relaxed">{sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Benchmark metrics */}
        <section>
          <p className="section-label mb-2">BENCHMARK METRICS</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Key Numerical Results</h2>
          <div className="bg-white rounded-lg border border-surface-200 overflow-hidden divide-y divide-surface-100">
            {BENCHMARK_METRICS.map(({ metric, value, note }) => (
              <div key={metric} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-5 py-3.5">
                <span className="text-sm font-semibold text-surface-800 sm:w-48 flex-shrink-0">{metric}</span>
                <span className="text-sm font-bold text-primary-700 tabular-nums sm:w-36">{value}</span>
                <span className="text-xs text-surface-500 leading-relaxed">{note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Validation protocol */}
        <section>
          <p className="section-label mb-2">VALIDATION PROTOCOL</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-5">Eight-Step Scientific Protocol</h2>
          <div className="space-y-0 divide-y divide-surface-100 border-t border-b border-surface-100">
            {PROTOCOL_STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex gap-5 py-4">
                <span className="text-xs font-bold text-surface-300 font-mono mt-0.5 w-5 flex-shrink-0">{step}</span>
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 mb-0.5">{title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Limitations — must appear prominently per spec §15 */}
        <section>
          <p className="section-label mb-2">CURRENT LIMITATIONS</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">What This PoC Does Not Provide</h2>
          <div className="bg-white rounded-lg border border-surface-200 divide-y divide-surface-100">
            {LIMITATIONS.map((l, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm text-surface-600 leading-relaxed">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scientific boundary — spec §15 mandatory wording */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-amber-600 flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="text-sm text-surface-600 leading-relaxed">
            <strong className="text-surface-900">The current PoC has no field validation, no field-labelled disease or pest target,
            no blind fourth scene, no complete six-model LOSO evaluation, no proven quantum advantage,
            and no measured financial ROI.</strong>{' '}
            All priority zones require independent field verification.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/model-comparison" className="btn-outline inline-flex items-center gap-2 text-sm">
            Model Comparison
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
          <Link href="/results" className="btn-outline inline-flex items-center gap-2 text-sm">
            Benchmark Results
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
