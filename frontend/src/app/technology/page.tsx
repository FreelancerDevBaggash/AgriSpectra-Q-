import Link from 'next/link'
import {
  Cpu, Database, Globe, Layers, ArrowRight, CheckCircle,
  Satellite, Code2, Server, Zap, FlaskConical, GitBranch
} from 'lucide-react'

const TECH_STACK = [
  {
    layer: 'Frontend',
    icon: Globe,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    items: [
      { name: 'Next.js 15.1',    desc: 'React framework — App Router, SSR, code splitting' },
      { name: 'React 19',         desc: 'UI component library' },
      { name: 'TypeScript 5.7',   desc: 'End-to-end type safety' },
      { name: 'Tailwind CSS 3.4', desc: 'Utility-first styling, responsive design' },
      { name: 'Recharts 2.15',    desc: 'Risk & budget visualisation charts' },
      { name: 'MapLibre GL 5',    desc: 'Interactive georeferenced zone maps' },
      { name: 'Lucide React',     desc: 'Consistent icon system' },
    ],
  },
  {
    layer: 'Backend API',
    icon: Server,
    color: 'text-green-700 bg-green-50 border-green-200',
    items: [
      { name: 'Python 3.11+',  desc: 'Core runtime for engine and API' },
      { name: 'Flask 3.0',     desc: 'Lightweight REST API server (port 8765)' },
      { name: 'flask-cors',    desc: 'Cross-origin request support for frontend dev' },
    ],
  },
  {
    layer: 'Processing Engine',
    icon: Cpu,
    color: 'text-quantum-700 bg-quantum-50 border-quantum-200',
    items: [
      { name: 'Rasterio 1.3',   desc: 'Georeferenced GeoTIFF I/O with windowed streaming' },
      { name: 'NumPy 1.26',     desc: 'Vectorised spectral band arithmetic' },
      { name: 'SciPy 1.13',     desc: 'Connected-component labelling (ndimage)' },
    ],
  },
  {
    layer: 'Scientific Benchmark',
    icon: FlaskConical,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    items: [
      { name: 'scikit-learn 1.4', desc: 'Random Forest, calibration, cross-validation' },
      { name: 'XGBoost 2.0',      desc: 'Gradient-boosted tree models (48-band, spectral)' },
      { name: 'pandas 2.2',       desc: 'Data manipulation and result tables' },
      { name: 'matplotlib 3.8',   desc: 'Scientific figures and benchmark charts' },
    ],
  },
  {
    layer: 'Data & Storage',
    icon: Database,
    color: 'text-red-700 bg-red-50 border-red-200',
    items: [
      { name: 'EnMAP GeoTIFF', desc: '224-band hyperspectral L2A scenes, 30 m/px resolution' },
      { name: 'GeoJSON',       desc: 'Georeferenced zone boundaries with CRS metadata' },
      { name: 'CSV',           desc: 'Zone tables, spectral evidence, inspection budgets' },
      { name: 'JSON',          desc: 'Run summaries, manifests, scene statistics' },
    ],
  },
  {
    layer: 'DevOps & Deploy',
    icon: GitBranch,
    color: 'text-surface-700 bg-surface-50 border-surface-200',
    items: [
      { name: 'Git / GitHub',  desc: 'Version control and CI/CD trigger' },
      { name: 'Vercel',        desc: 'Frontend deployment (Next.js first-class)' },
      { name: 'Docker',        desc: 'Containerised backend deployment' },
      { name: 'Railway / Render', desc: 'Backend cloud hosting options' },
    ],
  },
]

const ARCHITECTURE_STEPS = [
  {
    step: '1',
    title: 'User selects EnMAP scene',
    detail: 'Frontend sends POST /api/analyse with scene ID',
    color: 'bg-blue-600',
  },
  {
    step: '2',
    title: 'Flask API dispatches engine',
    detail: 'Spawns live_matrix_engine.py subprocess with unique run ID',
    color: 'bg-quantum-600',
  },
  {
    step: '3',
    title: 'Engine runs two-pass streaming analysis',
    detail: 'Pass 1: online mean/variance over 32 bands. Pass 2: RMS spectral deviation risk raster',
    color: 'bg-quantum-600',
  },
  {
    step: '4',
    title: 'Priority zones extracted',
    detail: 'Connected components above 95th percentile → ranked zone table + GeoTIFF + GeoJSON',
    color: 'bg-amber-600',
  },
  {
    step: '5',
    title: 'Results written to disk',
    detail: 'results/live_matrix/<run_id>/<scene>/ — all outputs are immutable per run',
    color: 'bg-green-600',
  },
  {
    step: '6',
    title: 'Dashboard fetches and renders',
    detail: 'Frontend polls /api/runs/<run_id>/* and renders zones, charts, budget table',
    color: 'bg-blue-600',
  },
]

const SCIENTIFIC_DESIGN = [
  {
    title: 'No Label Leakage',
    desc: 'The live engine uses only unsupervised spectral anomaly statistics. No disease labels, no test-set data, no ground truth.',
  },
  {
    title: 'Frozen Benchmark',
    desc: 'The six-model scientific validation is completely separate from the live engine. Benchmark results are pre-computed and immutable.',
  },
  {
    title: 'Scene-Relative Thresholds',
    desc: 'Priority thresholds are percentile-based within each scene. They are not absolute disease severity levels.',
  },
  {
    title: 'Reproducible Runs',
    desc: 'Every run writes a manifest.json with the run ID, source path, CRS, and leakage-control statement.',
  },
  {
    title: 'Windowed Streaming',
    desc: 'Full GeoTIFF scenes are processed block-by-block with constant memory footprint regardless of scene size.',
  },
  {
    title: 'Honest Uncertainty',
    desc: 'The system explicitly reports limitations: wavelength metadata unavailable, proxy labels only, thresholds are relative.',
  },
]

export default function TechnologyPage() {
  return (
    <div className="min-h-screen bg-surface-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-surface-900 via-quantum-950 to-surface-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-3">
            <Cpu className="w-8 h-8 text-quantum-300" />
            <span className="text-quantum-300 font-medium text-sm uppercase tracking-widest">Technology</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">System Architecture</h1>
          <p className="text-xl text-quantum-100/80 max-w-3xl leading-relaxed">
            A full-stack hyperspectral intelligence platform built on open-source geospatial
            science, a lean Python backend, and a modern Next.js frontend.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">

        {/* Architecture Flow */}
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-quantum-600" /> Request Lifecycle
          </h2>
          <div className="relative">
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {ARCHITECTURE_STEPS.map(({ step, title, detail, color }) => (
                <div key={step} className="flex gap-5 items-start relative">
                  <div className={`w-10 h-10 rounded-full ${color} text-white font-bold text-sm flex items-center justify-center flex-shrink-0 z-10`}>
                    {step}
                  </div>
                  <div className="bg-white rounded-xl border border-surface-200 p-4 flex-1">
                    <h3 className="font-semibold text-surface-900 text-sm mb-0.5">{title}</h3>
                    <p className="text-xs text-surface-500 leading-relaxed">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Directory Layout */}
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-6 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-primary-600" /> Project Directory Structure
          </h2>
          <div className="bg-gray-900 text-gray-100 rounded-xl p-6 font-mono text-sm leading-relaxed overflow-x-auto">
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

        {/* Tech Stack */}
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-6 flex items-center gap-2">
            <Layers className="w-6 h-6 text-spectral-600" /> Full Technology Stack
          </h2>
          <div className="space-y-5">
            {TECH_STACK.map(({ layer, icon: Icon, color, items }) => (
              <div key={layer} className={`rounded-xl border p-5 ${color}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5" />
                  <h3 className="font-bold text-sm uppercase tracking-wide">{layer}</h3>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {items.map(({ name, desc }) => (
                    <div key={name} className="bg-white rounded-lg border border-white/60 px-3 py-2 shadow-sm">
                      <div className="font-semibold text-surface-900 text-sm">{name}</div>
                      <div className="text-xs text-surface-500 leading-snug mt-0.5">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Scientific Design Principles */}
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-6 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-amber-600" /> Scientific Design Principles
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {SCIENTIFIC_DESIGN.map(({ title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-surface-200 p-5">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <h3 className="font-semibold text-surface-900 text-sm">{title}</h3>
                </div>
                <p className="text-xs text-surface-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Link href="/intelligence" className="btn-primary inline-flex items-center gap-2">
            <Zap className="w-4 h-4" /> Run Live Analysis
          </Link>
          <Link href="/results" className="btn-outline inline-flex items-center gap-2">
            Benchmark Results <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/project" className="btn-outline inline-flex items-center gap-2">
            About the Project <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  )
}
