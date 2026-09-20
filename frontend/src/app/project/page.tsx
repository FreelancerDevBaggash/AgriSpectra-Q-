import Link from 'next/link'

const WORKFLOW = [
  { step: 'DETECT',     desc: 'Real EnMAP L2A hyperspectral GeoTIFF data (224 bands, 30 m/px) is ingested with memory-aware windowed processing and NoData handling.' },
  { step: 'PRIORITISE', desc: 'Spectral anomaly scores are computed, then scene-relative percentile thresholds generate a risk raster and a ranked priority map.' },
  { step: 'INSPECT',    desc: 'Connected high-priority zones are extracted, ranked, and converted to georeferenced zone cards with inspection recommendations.' },
  { step: 'VERIFY',     desc: 'Field teams receive ranked zone cards with spectral evidence. All findings require independent ground-truth verification.' },
]

const LIVE_SCENES = [
  { scene: 'Scene 01 (DT0000205230)', dims: '1,153 × 1,198', valid: '1,028,176', nodata: '25.56%', crs: 'EPSG:32753', time: '37.14 s', zones: 407 },
  { scene: 'Scene 02',                dims: '1,210 × 1,244', valid: '1,006,261', nodata: '33.15%', crs: 'EPSG:32645', time: '111.41 s', zones: 864 },
  { scene: 'Scene 03',                dims: '1,152 × 1,214', valid: '1,047,911', nodata: '25.07%', crs: 'EPSG:32636', time: '49.11 s', zones: 438 },
]

const ZONE_CATEGORIES = [
  { name: 'HIGH PRIORITY',          dot: 'bg-gold-500',    desc: 'Inspect this zone first.' },
  { name: 'MEDIUM PRIORITY',        dot: 'bg-teal-500',    desc: 'Include in the next inspection cycle.' },
  { name: 'LOW PRIORITY',           dot: 'bg-primary-500', desc: 'Continue monitoring.' },
  { name: 'ABSTAIN / HUMAN REVIEW', dot: 'bg-surface-400', desc: 'Insufficient confidence for automated prioritisation.' },
]

const ROADMAP = [
  { phase: '1', title: 'Raw-Input Validation',          desc: 'Preserve raw spectra, coordinates, and wavelength metadata. Re-run from raw input without test correctness.' },
  { phase: '2', title: 'External Geographic Validation', desc: 'Evaluate a blind fourth EnMAP scene frozen from the development process.' },
  { phase: '3', title: 'Field Validation',               desc: 'Collect field polygons and agronomist labels to replace spectral-proxy with biological truth.' },
  { phase: '4', title: 'Temporal Intelligence',          desc: 'Multi-date analysis for persistence, trend, and temporal anomaly velocity.' },
  { phase: '5', title: 'Operational Pilot',              desc: 'Measure inspection recall, travel cost, false-alarm burden, and relative decision utility.' },
  { phase: '6', title: 'Production Deployment',          desc: 'Cloud-scale storage, async jobs, auth, monitoring, drift detection, and versioning.' },
]

export default function ProjectPage() {
  return (
    <div className="min-h-screen bg-surface-50">

      {/* Header */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-surface-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-surface-700 transition-colors">Home</Link>
            <span aria-hidden="true">›</span>
            <span className="text-surface-600 font-medium">Project</span>
          </nav>
          <p className="section-label mb-3">ABOUT THE PROJECT</p>
          <h1 className="text-3xl font-bold text-surface-900 mb-3">AgriSpectra-Q</h1>
          <p className="text-surface-500 max-w-2xl text-sm leading-relaxed">
            An industrial-oriented hyperspectral crop-intelligence and decision-support platform. 
            Transforms real EnMAP Earth observation data into ranked inspection priorities — 
            not a disease diagnostic, but an evidence-led decision-support signal.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* Core Philosophy — numbered list, no colored card boxes */}
        <section>
          <p className="section-label mb-2">CORE OPERATING PHILOSOPHY</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-6">Four-Step Workflow</h2>
          <div className="space-y-0 divide-y divide-surface-100 border-t border-b border-surface-100">
            {WORKFLOW.map((w, i) => (
              <div key={i} className="flex gap-5 py-4">
                <span className="text-xs font-bold text-surface-300 font-mono mt-0.5 w-5 flex-shrink-0 tabular-nums">0{i + 1}</span>
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 mb-1 tracking-wide">{w.step}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{w.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Two Modes — side-by-side, minimal borders */}
        <section>
          <p className="section-label mb-2">RESULT MODES</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-6">Two Separate Result Modes</h2>
          <div className="grid md:grid-cols-2 gap-6">

            <div className="bg-white rounded-lg border border-surface-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 animate-pulse-glow" />
                <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Live Analysis</span>
              </div>
              <h3 className="font-semibold text-surface-900 mb-2">Live Matrix</h3>
              <p className="text-sm text-surface-500 mb-4 leading-relaxed">
                A real-time, windowed, georeferenced spectral-anomaly analysis run directly on 
                three EnMAP GeoTIFF scenes. Creates risk rasters, priority rasters, connected zones, 
                GeoJSON, spectral evidence, and inspection-budget outputs.
              </p>
              <div className="space-y-1.5">
                {['Risk map (GeoTIFF)', 'Priority map (GeoTIFF)', 'Zone table (CSV + GeoJSON)', 'Spectral evidence (CSV)', 'Inspection budget (CSV)'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-surface-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-500 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-surface-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Frozen Benchmark</span>
              </div>
              <h3 className="font-semibold text-surface-900 mb-2">Industrial Validation Study</h3>
              <p className="text-sm text-surface-500 mb-4 leading-relaxed">
                A locked six-model comparison evaluated on 3 EnMAP scenes using spatially separated 
                train/validation/test splits, 5 random seeds, frozen test predictions, and 
                paired bootstrap analysis (n = 10,000 replicates).
              </p>
              <div className="space-y-1.5">
                {['6 models × 3 scenes × 5 seeds = 90 runs', 'F1, PR-AUC, ROC-AUC, ECE metrics', 'Calibrated probability estimates', 'Inspection budget analysis', 'Ablation study (quantum component)'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-surface-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-500 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Live Scene Table */}
        <section>
          <p className="section-label mb-2">ENMAP DATA</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Scenes Processed</h2>
          <div className="bg-white rounded-lg border border-surface-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100">
                    {['Scene', 'Dimensions', 'Valid Pixels', 'NoData %', 'CRS', 'Proc. Time', 'HP Zones'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-surface-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {LIVE_SCENES.map((s, i) => (
                    <tr key={i} className="hover:bg-surface-50">
                      <td className="py-3 px-4 font-medium text-surface-900 text-sm">{s.scene}</td>
                      <td className="py-3 px-4 text-surface-500 font-mono text-xs">{s.dims}</td>
                      <td className="py-3 px-4 text-surface-500 text-sm">{s.valid}</td>
                      <td className="py-3 px-4 text-surface-500 text-sm">{s.nodata}</td>
                      <td className="py-3 px-4 text-surface-500 font-mono text-xs">{s.crs}</td>
                      <td className="py-3 px-4 text-surface-500 text-sm">{s.time}</td>
                      <td className="py-3 px-4 font-semibold text-primary-700 text-sm">{s.zones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-surface-400 mt-2">Total live processing time: ~197.66 s · Run ID: <code className="font-mono">AGRQ-LIVE-20260916-132530-587fc9</code></p>
        </section>

        {/* Zone Categories — flat list with color dots */}
        <section>
          <p className="section-label mb-2">PRIORITY SYSTEM</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Priority Zone Categories</h2>
          <div className="space-y-0 divide-y divide-surface-100 border-t border-b border-surface-100">
            {ZONE_CATEGORIES.map(({ name, dot, desc }) => (
              <div key={name} className="flex items-center gap-4 py-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
                <span className="text-xs font-semibold text-surface-800 w-44 flex-shrink-0">{name}</span>
                <span className="text-sm text-surface-500">{desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-surface-400 mt-3">
            Zone categories are scene-relative percentile thresholds for operational screening. They are not validated biological severity levels.
          </p>
        </section>

        {/* AI Architecture */}
        <section>
          <p className="section-label mb-2">AI ARCHITECTURE</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">AgriSpectra-Q Model</h2>
          <div className="bg-white rounded-lg border border-surface-200 p-5 space-y-4">
            <p className="text-sm text-surface-600 leading-relaxed">
              RF-first residual architecture with grouped out-of-fold residual learning, compact spectral 
              intelligence, Mahalanobis-oriented research components, and an adaptive residual gate. 
              The nonlinear feature map uses quantum-inspired computational logic within a hybrid 
              quantum-classical research layer.
            </p>
            <div className="border-t border-surface-100 pt-4">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Quantum Component Clarity</p>
              <p className="text-sm text-surface-600 leading-relaxed bg-surface-50 rounded-lg p-3">
                <strong className="text-surface-800">Correct framing:</strong>{' '}
                "Quantum-inspired feature transformation within a hybrid quantum-classical research layer."
                No quantum hardware result, no quantum speedup, no demonstrated quantum advantage.
              </p>
            </div>
            <div className="border-t border-surface-100 pt-4">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Statistical Position</p>
              <p className="text-sm text-surface-600 leading-relaxed">
                AgriSpectra-Q achieves the highest numerical mean F1 (0.963985) among all six evaluated systems. 
                However, its advantage over HSI-RF is only +0.0008447 with a 95% CI of [–0.0012, +0.0027], 
                which crosses zero. Statistical superiority is therefore <em>not</em> established.
              </p>
            </div>
          </div>
        </section>

        {/* Roadmap — numbered list, no card boxes */}
        <section>
          <p className="section-label mb-2">FUTURE DEVELOPMENT</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-5">Roadmap</h2>
          <div className="space-y-0 divide-y divide-surface-100 border-t border-b border-surface-100">
            {ROADMAP.map(({ phase, title, desc }) => (
              <div key={phase} className="flex gap-5 py-4">
                <span className="text-xs font-bold text-surface-300 font-mono mt-0.5 w-5 flex-shrink-0">{phase}</span>
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 mb-0.5">Phase {phase}: {title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Intended Users — inline tags */}
        <section>
          <p className="section-label mb-2">TARGET AUDIENCE</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Intended Users</h2>
          <div className="flex flex-wrap gap-2">
            {[
              'Agricultural Inspection Teams', 'Agronomists & Field Analysts',
              'Farm & Agribusiness Analysts',  'Earth Observation Analysts',
              'Irrigation & Land Monitoring Operators', 'Government Agricultural Programmes',
              'Agricultural Consultancies', 'Geospatial AI Engineers',
            ].map(user => (
              <span key={user} className="text-sm text-surface-700 bg-surface-100 px-3 py-1.5 rounded-lg">
                {user}
              </span>
            ))}
          </div>
        </section>

        {/* Scientific disclaimer */}
        <div className="flex items-start gap-3 bg-gold-50 border border-gold-200 rounded-lg p-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-600 flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-surface-900 mb-1">Scientific Boundaries</p>
            <p className="text-sm text-surface-600 leading-relaxed">
              AgriSpectra-Q identifies <strong className="text-surface-800">spectral-anomaly priority candidates</strong> for field inspection. 
              It does not diagnose disease, pests, or biological stress. It does not claim field validation, 
              measured financial ROI, statistically significant superiority over HSI-RF, or quantum advantage. 
              All priority zones require <strong className="text-surface-800">independent field verification</strong>.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/intelligence" className="btn-primary inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Run Live Analysis
          </Link>
          <Link href="/results" className="btn-outline inline-flex items-center gap-2 text-sm">
            Benchmark Results
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
          <Link href="/technology" className="btn-outline inline-flex items-center gap-2 text-sm">
            Technology Stack
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
