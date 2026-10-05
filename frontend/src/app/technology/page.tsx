import Link from 'next/link'

const TECH_STACK = [
  {
    layer: 'Frontend',
    items: [
      { name: 'Next.js 15',      desc: 'React framework with server-side rendering' },
      { name: 'React 19',        desc: 'UI component library' },
      { name: 'TypeScript 5.7',  desc: 'End-to-end type safety' },
      { name: 'Tailwind CSS',    desc: 'Responsive design system' },
      { name: 'Recharts',        desc: 'Risk & budget visualisation charts' },
      { name: 'MapLibre GL',     desc: 'Interactive georeferenced zone maps' },
    ],
  },
  {
    layer: 'Backend API',
    items: [
      { name: 'Python 3.11+', desc: 'Core runtime for analysis engine and API' },
      { name: 'Flask 3.0',    desc: 'Lightweight REST API server' },
    ],
  },
  {
    layer: 'Processing Engine',
    items: [
      { name: 'Rasterio',  desc: 'Georeferenced GeoTIFF reading with windowed streaming' },
      { name: 'NumPy',     desc: 'Vectorised spectral band arithmetic' },
      { name: 'SciPy',     desc: 'Connected-component zone detection' },
    ],
  },
  {
    layer: 'Scientific Benchmark',
    items: [
      { name: 'scikit-learn', desc: 'Random Forest, calibration, cross-validation' },
      { name: 'XGBoost',      desc: 'Gradient-boosted tree models on spectral features' },
      { name: 'pandas',       desc: 'Data manipulation and result tables' },
      { name: 'matplotlib',   desc: 'Scientific figures and benchmark charts' },
    ],
  },
  {
    layer: 'Data',
    items: [
      { name: 'EnMAP GeoTIFF', desc: '224-band hyperspectral L2A scenes at 30 m/px resolution' },
      { name: 'GeoJSON',       desc: 'Georeferenced zone boundaries with coordinate metadata' },
    ],
  },
  {
    layer: 'Deployment',
    items: [
      { name: 'Vercel',  desc: 'Frontend — global edge network, automatic HTTPS' },
      { name: 'Ubuntu VPS + nginx', desc: 'Backend — dedicated server with SSL certificates' },
      { name: 'Docker',  desc: 'Containerised engine for reproducible builds' },
    ],
  },
]

const ARCHITECTURE_STEPS = [
  { step: '1', title: 'Select an EnMAP scene',              detail: 'Choose from three pre-loaded hyperspectral scenes captured over agricultural zones in Sudan, China and Russia' },
  { step: '2', title: 'Live analysis engine activates',      detail: 'Two-pass spectral anomaly detection runs across all 224 bands of the selected scene' },
  { step: '3', title: 'Spectral-anomaly raster computed',    detail: 'Per-pixel RMS spectral deviation scores identify scene-relative spectral anomalies across the full scene' },
  { step: '4', title: 'Priority zones extracted',            detail: 'High-risk connected regions are ranked by severity, area, and spectral confidence' },
  { step: '5', title: 'Georeferenced outputs generated',     detail: 'Zone boundaries, spectral evidence, and inspection budget are exported with full coordinate metadata' },
  { step: '6', title: 'Interactive dashboard rendered',      detail: 'Zones, risk maps, spectral charts, and budget recommendations are displayed in real time' },
]

const SCIENTIFIC_DESIGN = [
  { title: 'No Label Leakage',      desc: 'The live engine uses only unsupervised spectral anomaly statistics. No disease labels, no test-set data, no ground truth.' },
  { title: 'Frozen Benchmark',      desc: 'The six-model scientific validation is completely separate from the live engine. Benchmark results are pre-computed and immutable.' },
  { title: 'Scene-Relative Thresholds', desc: 'Priority thresholds are percentile-based within each scene. They are not absolute disease severity levels.' },
  { title: 'Reproducible Runs',     desc: 'Every run writes a manifest.json with the run ID, source path, CRS, and leakage-control statement.' },
  { title: 'Windowed Streaming',    desc: 'Full GeoTIFF scenes are processed block-by-block with constant memory footprint regardless of scene size.' },
  { title: 'Honest Uncertainty',    desc: 'The system explicitly reports limitations: wavelength metadata unavailable, proxy labels only, thresholds are relative.' },
]

export default function TechnologyPage() {
  return (
    <div className="min-h-screen bg-surface-50">

      {/* Header */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-surface-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-surface-700 transition-colors">Home</Link>
            <span aria-hidden="true">›</span>
            <span className="text-surface-400">Science</span>
            <span aria-hidden="true">›</span>
            <span className="text-surface-600 font-medium">Technology Stack</span>
          </nav>
          <p className="section-label mb-3">TECHNOLOGY</p>
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Technology Stack</h1>
          <p className="text-surface-500 max-w-2xl text-sm leading-relaxed">
            A full-stack hyperspectral intelligence platform built on open-source geospatial
            science, a lean Python backend, and a modern Next.js frontend.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* Architecture Flow — numbered list with connector */}
        <section>
          <p className="section-label mb-2">REQUEST LIFECYCLE</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-5">End-to-End Flow</h2>
          <div className="space-y-0 divide-y divide-surface-100 border-t border-b border-surface-100">
            {ARCHITECTURE_STEPS.map(({ step, title, detail }) => (
              <div key={step} className="flex gap-5 py-4">
                <span className="text-xs font-bold text-surface-300 font-mono mt-0.5 w-5 flex-shrink-0">{step}</span>
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 mb-0.5">{title}</h3>
                  <p className="text-xs text-surface-500 leading-relaxed font-mono">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack — clean table per layer, no colored card wrappers */}
        <section>
          <p className="section-label mb-2">FULL TECHNOLOGY STACK</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-5">Dependencies by Layer</h2>
          <div className="bg-white rounded-lg border border-surface-200 overflow-hidden divide-y divide-surface-100">
            {TECH_STACK.map(({ layer, items }) => (
              <div key={layer} className="px-5 py-4">
                <p className="text-xs font-bold text-surface-400 uppercase tracking-wide mb-3">{layer}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  {items.map(({ name, desc }) => (
                    <div key={name} className="flex gap-3">
                      <span className="font-semibold text-surface-900 text-sm w-36 flex-shrink-0">{name}</span>
                      <span className="text-sm text-surface-500 leading-snug">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Scientific Design Principles — list, no icon-in-bubble cards */}
        <section>
          <p className="section-label mb-2">SCIENTIFIC DESIGN</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-5">Design Principles</h2>
          <div className="space-y-0 divide-y divide-surface-100 border-t border-b border-surface-100">
            {SCIENTIFIC_DESIGN.map(({ title, desc }) => (
              <div key={title} className="flex gap-4 py-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-500 flex-shrink-0 mt-0.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 mb-0.5">{title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

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
          <Link href="/project" className="btn-outline inline-flex items-center gap-2 text-sm">
            About the Project
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>

      </div>
    </div>
  )
}
