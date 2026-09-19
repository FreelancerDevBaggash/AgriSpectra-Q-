import Link from 'next/link'
import {
  Satellite, MapPin, CheckCircle, ArrowRight, AlertTriangle,
  Layers, TrendingUp, Zap, FlaskConical, Users, Globe
} from 'lucide-react'

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
  { name: 'HIGH PRIORITY',         color: 'bg-red-100 text-red-700 border-red-200',    desc: 'Inspect this zone first.' },
  { name: 'MEDIUM PRIORITY',       color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'Include in the next inspection cycle.' },
  { name: 'LOW PRIORITY',          color: 'bg-green-100 text-green-700 border-green-200', desc: 'Continue monitoring.' },
  { name: 'ABSTAIN / HUMAN REVIEW', color: 'bg-blue-100 text-blue-700 border-blue-200',  desc: 'Insufficient confidence for automated prioritisation.' },
]

const ROADMAP = [
  { phase: '1', title: 'Raw-Input Validation',     desc: 'Preserve raw spectra, coordinates, and wavelength metadata. Re-run from raw input without test correctness.' },
  { phase: '2', title: 'External Geographic Validation', desc: 'Evaluate a blind fourth EnMAP scene frozen from the development process.' },
  { phase: '3', title: 'Field Validation',           desc: 'Collect field polygons and agronomist labels to replace spectral-proxy with biological truth.' },
  { phase: '4', title: 'Temporal Intelligence',      desc: 'Multi-date analysis for persistence, trend, and temporal anomaly velocity.' },
  { phase: '5', title: 'Operational Pilot',          desc: 'Measure inspection recall, travel cost, false-alarm burden, and relative decision utility.' },
  { phase: '6', title: 'Production Deployment',      desc: 'Cloud-scale storage, async jobs, auth, monitoring, drift detection, and versioning.' },
]

export default function ProjectPage() {
  return (
    <div className="min-h-screen bg-surface-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-primary-700 to-primary-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About AgriSpectra-Q</h1>
          <p className="text-xl text-primary-100 max-w-3xl leading-relaxed">
            An industrial-oriented hyperspectral crop-intelligence and decision-support platform. 
            Transforms real EnMAP Earth observation data into ranked inspection priorities — 
            not a disease diagnostic, but an evidence-led decision-support signal.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">

        {/* Core Philosophy */}
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-6 flex items-center gap-2">
            <Satellite className="w-6 h-6 text-primary-600" /> Core Operating Philosophy
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {WORKFLOW.map((w, i) => (
              <div key={i} className="bg-white rounded-xl border border-surface-200 p-5 relative">
                <div className="absolute -top-3 left-5 bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  Step {i + 1}
                </div>
                <h3 className="text-lg font-bold text-primary-700 mt-2 mb-2">{w.step}</h3>
                <p className="text-sm text-surface-600 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Two Modes */}
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-6 flex items-center gap-2">
            <Layers className="w-6 h-6 text-spectral-600" /> Two Separate Result Modes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border-2 border-green-300 p-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> LIVE ANALYSIS
              </div>
              <h3 className="text-lg font-bold text-surface-900 mb-2">Live Matrix</h3>
              <p className="text-sm text-surface-600 mb-4 leading-relaxed">
                A real-time, windowed, georeferenced spectral-anomaly analysis run directly on 
                three EnMAP GeoTIFF scenes. Creates risk rasters, priority rasters, connected zones, 
                GeoJSON, spectral evidence, and inspection-budget outputs.
              </p>
              <ul className="space-y-1 text-xs text-surface-600">
                {['Risk map (GeoTIFF)', 'Priority map (GeoTIFF)', 'Zone table (CSV + GeoJSON)', 'Spectral evidence (CSV)', 'Inspection budget (CSV)'].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl border-2 border-blue-300 p-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
                FROZEN SCIENTIFIC BENCHMARK
              </div>
              <h3 className="text-lg font-bold text-surface-900 mb-2">Industrial Validation Study</h3>
              <p className="text-sm text-surface-600 mb-4 leading-relaxed">
                A locked six-model comparison evaluated on 3 EnMAP scenes using spatially separated 
                train/validation/test splits, 5 random seeds, frozen test predictions, and 
                paired bootstrap analysis (n = 10,000 replicates).
              </p>
              <ul className="space-y-1 text-xs text-surface-600">
                {['6 models × 3 scenes × 5 seeds = 90 runs', 'F1, PR-AUC, ROC-AUC, ECE metrics', 'Calibrated probability estimates', 'Inspection budget analysis', 'Ablation study (quantum component)'].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-blue-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Live Scene Table */}
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6 text-green-600" /> EnMAP Scenes Processed
          </h2>
          <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200">
                    {['Scene', 'Dimensions', 'Valid Pixels', 'NoData %', 'CRS', 'Proc. Time', 'HP Zones'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-surface-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {LIVE_SCENES.map((s, i) => (
                    <tr key={i} className="hover:bg-surface-50">
                      <td className="py-3 px-4 font-medium text-surface-900">{s.scene}</td>
                      <td className="py-3 px-4 text-surface-600 font-mono text-xs">{s.dims}</td>
                      <td className="py-3 px-4 text-surface-600">{s.valid.toLocaleString()}</td>
                      <td className="py-3 px-4 text-surface-600">{s.nodata}</td>
                      <td className="py-3 px-4 text-surface-600 font-mono text-xs">{s.crs}</td>
                      <td className="py-3 px-4 text-surface-600">{s.time}</td>
                      <td className="py-3 px-4 font-semibold text-primary-700">{s.zones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-surface-400 mt-2">Total live processing time: ~197.66 s. Run ID: <code className="font-mono">AGRQ-LIVE-20260916-132530-587fc9</code></p>
        </section>

        {/* Zone Categories */}
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-600" /> Priority Zone Categories
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {ZONE_CATEGORIES.map(({ name, color, desc }) => (
              <div key={name} className={`rounded-xl border p-4 ${color}`}>
                <div className="font-bold text-sm mb-1">{name}</div>
                <div className="text-sm opacity-80">{desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-surface-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <strong>Important:</strong> Zone categories are scene-relative percentile thresholds for operational screening. 
            They are not validated biological severity levels.
          </div>
        </section>

        {/* AI Architecture Summary */}
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-6 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-quantum-600" /> AI Architecture
          </h2>
          <div className="bg-white rounded-xl border border-surface-200 p-6 space-y-5">
            <div>
              <h3 className="font-semibold text-surface-900 mb-2">AgriSpectra-Q Model</h3>
              <p className="text-sm text-surface-600 leading-relaxed">
                RF-first residual architecture with grouped out-of-fold residual learning, compact spectral 
                intelligence, Mahalanobis-oriented research components, and an adaptive residual gate. 
                The nonlinear feature map uses quantum-inspired computational logic within a hybrid 
                quantum-classical research layer.
              </p>
            </div>
            <div className="border-t border-surface-100 pt-5">
              <h3 className="font-semibold text-surface-900 mb-3">Quantum Component Clarity</h3>
              <div className="bg-quantum-50 border border-quantum-200 rounded-lg p-4 text-sm text-quantum-800">
                <strong>Correct framing:</strong> "Quantum-inspired feature transformation within a hybrid 
                quantum-classical research layer." No quantum hardware result, no quantum speedup, 
                no demonstrated quantum advantage.
              </div>
            </div>
            <div className="border-t border-surface-100 pt-5">
              <h3 className="font-semibold text-surface-900 mb-2">Statistical Position</h3>
              <p className="text-sm text-surface-600 leading-relaxed">
                AgriSpectra-Q achieves the highest numerical mean F1 (0.963985) among all six evaluated systems. 
                However, its advantage over HSI-RF is only +0.0008447 with a 95% CI of [–0.0012, +0.0027], 
                which crosses zero. Statistical superiority is therefore <em>not</em> established.
              </p>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-600" /> Future Roadmap
          </h2>
          <div className="space-y-3">
            {ROADMAP.map(({ phase, title, desc }) => (
              <div key={phase} className="bg-white rounded-xl border border-surface-200 p-5 flex gap-4">
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {phase}
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 text-sm mb-0.5">Phase {phase}: {title}</h3>
                  <p className="text-sm text-surface-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Who Uses It */}
        <section>
          <h2 className="text-2xl font-bold text-surface-900 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-spectral-600" /> Intended Users
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Agricultural Inspection Teams', 'Agronomists & Field Analysts',
              'Farm & Agribusiness Analysts', 'Earth Observation Analysts',
              'Irrigation & Land Monitoring Operators', 'Government Agricultural Programmes',
              'Agricultural Consultancies', 'Geospatial AI Engineers',
            ].map(user => (
              <div key={user} className="bg-white rounded-lg border border-surface-200 px-4 py-3 text-sm text-surface-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {user}
              </div>
            ))}
          </div>
        </section>

        {/* Scientific disclaimer */}
        <div className="flex items-start gap-4 bg-amber-50 border border-amber-300 rounded-xl p-6">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-surface-900 mb-2">Scientific Boundaries</h3>
            <p className="text-sm text-surface-700 leading-relaxed">
              AgriSpectra-Q identifies <strong>spectral-anomaly priority candidates</strong> for field inspection. 
              It does not diagnose disease, pests, or biological stress. It does not claim field validation, 
              measured financial ROI, statistically significant superiority over HSI-RF, or quantum advantage. 
              All priority zones require <strong>independent field verification</strong>.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/intelligence" className="btn-primary inline-flex items-center gap-2">
            <Zap className="w-4 h-4" /> Run Live Analysis
          </Link>
          <Link href="/results" className="btn-outline inline-flex items-center gap-2">
            View Benchmark Results <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/technology" className="btn-outline inline-flex items-center gap-2">
            Technology Stack <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
