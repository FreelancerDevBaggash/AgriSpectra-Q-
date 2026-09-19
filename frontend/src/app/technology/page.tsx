import Link from 'next/link'

const TECH_STACK = [
  {
    layer: 'Frontend',
    items: [
      { name: 'Next.js 15.1',    desc: 'React framework — App Router, SSR, code splitting' },
      { name: 'React 19',        desc: 'UI component library' },
      { name: 'TypeScript 5.7',  desc: 'End-to-end type safety' },
      { name: 'Tailwind CSS 3.4',desc: 'Utility-first styling, responsive design' },
      { name: 'Recharts 2.15',   desc: 'Risk & budget visualisation charts' },
      { name: 'MapLibre GL 5',   desc: 'Interactive georeferenced zone maps' },
      { name: 'Lucide React',    desc: 'Consistent icon system' },
    ],
  },
  {
    layer: 'Backend API',
    items: [
      { name: 'Python 3.11+', desc: 'Core runtime for engine and API' },
      { name: 'Flask 3.0',    desc: 'Lightweight REST API server (port 8765)' },
      { name: 'flask-cors',   desc: 'Cross-origin request support for frontend dev' },
    ],
  },
  {
    layer: 'Processing Engine',
    items: [
      { name: 'Rasterio 1.3',  desc: 'Georeferenced GeoTIFF I/O with windowed streaming' },
      { name: 'NumPy 1.26',    desc: 'Vectorised spectral band arithmetic' },
      { name: 'SciPy 1.13',   desc: 'Connected-component labelling (ndimage)' },
    ],
  },
  {
    layer: 'Scientific Benchmark',
    items: [
      { name: 'scikit-learn 1.4', desc: 'Random Forest, calibration, cross-validation' },
      { name: 'XGBoost 2.0',     desc: 'Gradient-boosted tree models (48-band, spectral)' },
      { name: 'pandas 2.2',      desc: 'Data manipulation and result tables' },
      { name: 'matplotlib 3.8',  desc: 'Scientific figures and benchmark charts' },
    ],
  },
  {
    layer: 'Data & Storage',
    items: [
      { name: 'EnMAP GeoTIFF', desc: '224-band hyperspectral L2A scenes, 30 m/px resolution' },
      { name: 'GeoJSON',       desc: 'Georeferenced zone boundaries with CRS metadata' },
      { name: 'CSV',           desc: 'Zone tables, spectral evidence, inspection budgets' },
      { name: 'JSON',          desc: 'Run summaries, manifests, scene statistics' },
    ],
  },
  {
    layer: 'DevOps & Deploy',
    items: [
      { name: 'Git / GitHub',     desc: 'Version control and CI/CD trigger' },
      { name: 'Vercel',           desc: 'Frontend deployment (Next.js first-class)' },
      { name: 'Docker',           desc: 'Containerised backend deployment' },
      { name: 'Railway / Render', desc: 'Backend cloud hosting options' },
    ],
  },
]

const ARCHITECTURE_STEPS = [
  { step: '1', title: 'User selects EnMAP scene',           detail: 'Frontend sends POST /api/analyse with scene ID' },
  { step: '2', title: 'Flask API dispatches engine',         detail: 'Spawns live_matrix_engine.py subprocess with unique run ID' },
  { step: '3', title: 'Engine runs two-pass streaming analysis', detail: 'Pass 1: online mean/variance over 32 bands. Pass 2: RMS spectral deviation risk raster' },
  { step: '4', title: 'Priority zones extracted',            detail: 'Connected components above 95th percentile → ranked zone table + GeoTIFF + GeoJSON' },
  { step: '5', title: 'Results written to disk',             detail: 'results/live_matrix/<run_id>/<scene>/ — all outputs are immutable per run' },
  { step: '6', title: 'Dashboard fetches and renders',       detail: 'Frontend polls /api/runs/<run_id>/* and renders zones, charts, budget table' },
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

        {/* Directory Layout */}
        <section>
          <p className="section-label mb-2">PROJECT STRUCTURE</p>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Directory Layout</h2>
          <div className="bg-surface-900 text-surface-100 rounded-lg p-5 font-mono text-xs leading-relaxed overflow-x-auto">
            <pre>{`AgriSpectra-Q/
├── backend/
│   ├── api/
│   │   └── live_matrix_api.py       ← Flask REST server (port 8765)
│   ├── engine/
│   │   └── live_matrix_engine.py    ← Spectral-anomaly core engine
│   ├── benchmark/
│   │   ├── final_six_benchmark.py   ← Frozen 6-model validation
│   │   └── ...                      ← Analysis & reporting scripts
│   └── requirements.txt
│
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx                 ← Home / landing
│   │   ├── intelligence/page.tsx    ← Scene selection + run trigger
│   │   ├── dashboard/page.tsx       ← Results, zones, charts
│   │   ├── results/page.tsx         ← Frozen benchmark results
│   │   ├── project/page.tsx         ← About the project
│   │   └── technology/page.tsx      ← This page
│   ├── src/components/
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   └── src/lib/
│       ├── api.ts                   ← API client
│       ├── types.ts                 ← TypeScript types
│       └── utils.ts                 ← Helpers
│
├── data/
│   └── raw/enmap_three_scenes/
│       ├── scene_01_DT0000205230.TIF
│       ├── scene_02.TIF
│       └── scene_03.TIF
│
├── results/
│   ├── live_matrix/                 ← Engine run outputs
│   └── industrial_validation/       ← Frozen benchmark results
│
└── docs/                            ← Architecture & spec documents`}</pre>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-spectral-500 flex-shrink-0 mt-0.5">
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
