import Link from 'next/link'

// ── Research & Validation page — spec §15
// Exposes the scientific protocol, evidence, and current limitations.
// All values are frozen benchmark results — FROZEN SCIENTIFIC BENCHMARK label mandatory.

const EVIDENCE_ITEMS = [
  {
    label: '3 EnMAP scenes',
    sub: 'Sudan, China and Russia — real EO data, no simulation',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  },
  {
    label: '224 spectral bands',
    sub: 'Full hyperspectral L2A sensor output per scene',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  },
  {
    label: '5 random seeds',
    sub: 'Seeds 11, 22, 33, 44, 55 — statistical stability',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400" aria-hidden="true"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/><path d="M12 6v6l4 2"/></svg>,
  },
  {
    label: 'Spatially separated',
    sub: 'Train/validation/test splits prevent leakage',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  },
  {
    label: '90 total runs',
    sub: '6 models × 3 scenes × 5 seeds',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400" aria-hidden="true"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  },
  {
    label: '10,000 bootstrap reps',
    sub: 'Paired bootstrap for significance testing',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>,
  },
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
  { step: '7', title: 'Calibration',                desc: 'Post-hoc isotonic regression calibration. Expected Calibration Error (ECE) reported before and after calibration.' },
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
          <div className="flex flex-wrap items-center gap-2 mb-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {EVIDENCE_ITEMS.map(({ label, sub, icon }) => (
              <div key={label} className="bg-white border border-surface-200 rounded-lg px-5 py-4">
                <div className="mb-3">{icon}</div>
                <div className="text-sm font-bold text-surface-900 mb-1">{label}</div>
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
              <div key={metric} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 sm:px-5 py-3.5">
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
                  className="text-gold-500 flex-shrink-0 mt-0.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm text-surface-600 leading-relaxed">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scientific boundary — spec §15 mandatory wording */}
        <div className="flex items-start gap-3 bg-gold-50 border border-gold-200 rounded-lg p-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-gold-600 flex-shrink-0 mt-0.5">
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

        {/* ── Planet Tanager Experiment — independent track ── */}
        <section>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <p className="section-label">PLANET TANAGER</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 border border-purple-300 text-xs font-bold text-purple-800 tracking-wide">
              PLANET TANAGER — SCIENTIFIC EXPERIMENT
            </span>
          </div>
          <h2 className="text-lg font-semibold text-surface-900 mb-3">Separate Scientific Experiment Track</h2>
          <p className="text-sm text-surface-500 mb-5 leading-relaxed max-w-2xl">
            This experiment processes a real Planet Tanager hyperspectral HDF5 scene and evaluates a reproducible
            workflow for relative spectral-anomaly prioritisation, ambiguity analysis, and geospatial integrity.
            The output is a research and inspection-prioritisation signal, not an agricultural diagnosis.
          </p>

          {/* Tanager validation status — MUST NOT be hidden */}
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Geospatial integrity', status: 'PASS',    color: 'bg-green-50 border-green-300 text-green-800' },
              { label: 'Independent scene validation', status: 'BLOCKED', color: 'bg-gold-50 border-gold-300 text-gold-800' },
              { label: 'Cross-sensor consistency',    status: 'BLOCKED', color: 'bg-gold-50 border-gold-300 text-gold-800' },
            ].map(({ label, status, color }) => (
              <div key={label} className={`border rounded-lg p-4 ${color}`}>
                <div className="text-xs font-bold tracking-widest mb-1">{status}</div>
                <div className="text-xs font-medium">{label}</div>
              </div>
            ))}
          </div>

          {/* Geospatial integrity metrics */}
          <div className="bg-white border border-surface-200 rounded-lg p-5 mb-5">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">
              Geospatial integrity result — corrected 128-zone output
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
              {[
                { label: 'Zones checked',   value: '128' },
                { label: 'False positives', value: '0'   },
                { label: 'False negatives', value: '0'   },
                { label: 'IoU / F1 / Precision / Recall', value: '1.0' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xl font-bold text-surface-900 tabular-nums">{value}</div>
                  <div className="text-xs text-surface-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-surface-400 italic leading-relaxed">
              These metrics validate raster-to-vector representation for the tested scene.
              They are not agricultural ground-truth accuracy.
            </p>
          </div>

          {/* Tanager scene metadata */}
          <div className="bg-white border border-surface-200 rounded-lg p-5 mb-5">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Scene provenance</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-xs">
              {[
                { k: 'Scene ID',       v: '20250501_143138_87_4001' },
                { k: 'Dimensions',     v: '426 × 752 × 784' },
                { k: 'CRS',            v: 'EPSG:32721' },
                { k: 'Good bands',     v: '352 / 426' },
                { k: 'Valid pixels',   v: '71.67%' },
                { k: 'Source',         v: 'Google Drive supplied HDF5' },
              ].map(({ k, v }) => (
                <div key={k}>
                  <span className="text-surface-400">{k} </span>
                  <strong className="text-surface-700 font-mono">{v}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 bg-gold-50 border border-gold-200 rounded-lg p-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold-600 flex-shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-xs text-surface-600 leading-relaxed">
              Planet Tanager results are a separate experiment track. Geospatial integrity metrics validate
              raster-to-vector representation for the tested scene — they are not agricultural ground-truth accuracy.
              Independent-scene and cross-sensor validations remain blocked until distinct documented data are available.
            </p>
          </div>

          <div className="mt-4">
            <Link href="/tanager" className="btn-outline inline-flex items-center gap-2 text-sm">
              View full Tanager experiment
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>
        </section>

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
          <Link href="/tanager" className="btn-outline inline-flex items-center gap-2 text-sm">
            Tanager Experiment
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
