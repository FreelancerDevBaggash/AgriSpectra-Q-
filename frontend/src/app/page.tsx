import Link from 'next/link'

// ── Static data ───────────────────────────────────────────────────────────────

const STATS = [
  { value: '224',   label: 'Spectral Bands',  sub: 'EnMAP hyperspectral' },
  { value: '96.4%', label: 'Mean F1 Score',   sub: '3 scenes × 5 seeds' },
  { value: '3',     label: 'Real EO Scenes',  sub: 'UAE / Gulf region' },
  { value: '1,709', label: 'Priority Zones',  sub: 'Georeferenced output' },
]

const WORKFLOW = [
  {
    step: '01',
    title: 'DETECT',
    desc: 'Real EnMAP L2A hyperspectral imagery — 224 spectral bands at 30 m resolution — captures anomalies invisible to standard RGB cameras.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    ),
    color: 'from-primary-500/10 to-primary-600/5 border-primary-200',
    accent: 'text-primary-600',
  },
  {
    step: '02',
    title: 'PRIORITISE',
    desc: 'AI-powered spectral analysis scores every pixel. Scene-relative thresholds convert raw signals into ranked, georeferenced priority zones.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    color: 'from-quantum-500/10 to-quantum-600/5 border-quantum-200',
    accent: 'text-quantum-600',
  },
  {
    step: '03',
    title: 'INSPECT',
    desc: 'Field teams receive a ranked list of high-priority zones — inspect the most anomalous areas first, optimising time and inspection budget.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    color: 'from-spectral-500/10 to-spectral-600/5 border-spectral-200',
    accent: 'text-spectral-600',
  },
  {
    step: '04',
    title: 'VERIFY',
    desc: 'Ground-truth the spectral findings on-site. Close the loop between satellite observation and field-confirmed agronomic outcomes.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    color: 'from-amber-500/10 to-amber-600/5 border-amber-200',
    accent: 'text-amber-600',
  },
]

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: 'Real EnMAP Data',
    desc: 'Processing actual EnMAP L2A GeoTIFF scenes — not synthetic, not simulated. Three scenes covering UAE agricultural regions with full geospatial metadata.',
    tag: 'Real EO',
    tagColor: 'bg-primary-50 text-primary-700',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'Quantum-Inspired Hybrid',
    desc: 'RF-first residual architecture with quantum-inspired feature transformation. Research-grade innovation layer on top of proven classical ML.',
    tag: 'Research',
    tagColor: 'bg-quantum-50 text-quantum-700',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
    title: 'Decision Intelligence',
    desc: 'Not just classification — full decision support. Ranked zone cards, spectral evidence, inspection budget analysis, and actionable field recommendations.',
    tag: 'Decision AI',
    tagColor: 'bg-spectral-50 text-spectral-700',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: 'Scientific Rigour',
    desc: '6-model benchmark, 3 scenes, 5 random seeds, spatially separated splits, frozen predictions, paired bootstrap significance testing.',
    tag: 'Validated',
    tagColor: 'bg-amber-50 text-amber-700',
  },
]

// ── Helper: Floating satellite SVG ───────────────────────────────────────────

function SatelliteGraphic() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Orbit ring */}
      <div className="absolute w-64 h-64 rounded-full border border-primary-400/20 border-dashed animate-spin-slow" />
      <div className="absolute w-44 h-44 rounded-full border border-primary-400/15 border-dashed animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '12s' }} />

      {/* Central orb */}
      <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary-400/20 to-primary-700/30 border border-primary-400/30 flex items-center justify-center animate-float shadow-glow-blue">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-blue">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Orbiting dots */}
      {[0, 120, 240].map((deg, i) => (
        <div key={i} className="absolute w-64 h-64 flex items-start justify-center" style={{ transform: `rotate(${deg}deg)`, animationDelay: `${i * 0.8}s` }}>
          <div className={`w-3 h-3 -mt-1.5 rounded-full shadow-glow-blue ${i === 0 ? 'bg-primary-400' : i === 1 ? 'bg-spectral-400' : 'bg-quantum-400'}`} />
        </div>
      ))}

      {/* Spectral bands label */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <div className="text-4xl font-bold text-white/90 tabular-nums">224</div>
        <div className="text-xs text-primary-200 font-medium">Spectral Bands</div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="bg-surface-50">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-hero">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-gradient-radial from-primary-600/20 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <div>
              {/* Eyebrow */}
              <div className="flex flex-wrap items-center gap-3 mb-8 animate-fade-up">
                <span className="badge badge-live">
                  <span className="dot-live" />
                  Live Engine Active
                </span>
                <span className="badge badge-quantum">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                  Hybrid Quantum-Classical
                </span>
                <span className="badge bg-surface-700/40 text-white/70 border border-white/10">
                  Arab Youth Space Hackathon 2026
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6 animate-fade-up delay-100">
                Where Should You{' '}
                <span className="text-gradient-blue relative">
                  Inspect First?
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 to-transparent rounded-full" />
                </span>
              </h1>

              {/* Sub */}
              <p className="text-lg text-primary-100/80 max-w-xl leading-relaxed mb-10 animate-fade-up delay-200">
                AgriSpectra-Q transforms real EnMAP hyperspectral satellite data into ranked 
                inspection priorities — telling field teams{' '}
                <em className="text-white/90 not-italic font-medium">exactly where spectral anomalies are concentrated</em>,
                saving water, time, and crops across the Arab region.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-up delay-300">
                <Link href="/intelligence" className="btn-primary-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Run Live Analysis
                </Link>
                <Link href="/results" className="btn inline-flex items-center gap-2 px-7 py-3.5 text-base border border-white/20 text-white/80 rounded-xl hover:bg-white/10 hover:text-white transition-all">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                  View Results
                </Link>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-up delay-400">
                {STATS.map(({ value, label, sub }) => (
                  <div key={label} className="card-glass p-4 text-center">
                    <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
                    <div className="text-xs font-semibold text-white/70 mt-0.5">{label}</div>
                    <div className="text-2xs text-white/40 mt-0.5">{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — graphic */}
            <div className="hidden lg:flex items-center justify-center animate-fade-in delay-500">
              <div className="w-80 h-80">
                <SatelliteGraphic />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-surface-50 to-transparent" />
      </section>

      {/* ── Problem Statement ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="section-label mb-4">THE CHALLENGE</p>
          <h2 className="section-title mb-6">
            Large Agricultural Areas Are{' '}
            <span className="text-gradient-blue">Impossible to Inspect Uniformly</span>
          </h2>
          <p className="section-subtitle mx-auto max-w-2xl">
            In the Arab region, water scarcity and arid conditions mean every hectare of farmland counts. 
            Yet inspection teams waste time and budget walking fields without knowing <strong>where the problem actually is</strong>.
            AgriSpectra-Q solves this with hyperspectral intelligence.
          </p>
        </div>
      </section>

      {/* ── Workflow ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-t border-b border-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="section-label mb-3">HOW IT WORKS</p>
            <h2 className="section-title">DETECT → PRIORITISE → INSPECT → VERIFY</h2>
            <p className="section-subtitle mx-auto max-w-2xl mt-3">
              A simple, evidence-led four-step workflow for agricultural inspection teams
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {WORKFLOW.map(({ step, title, desc, icon, color, accent }, i) => (
              <div
                key={step}
                className={`relative bg-gradient-to-br ${color} rounded-2xl border p-6 animate-fade-up`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs font-bold tabular-nums ${accent} opacity-60`}>{step}</span>
                  <div className="flex-1 h-px bg-current opacity-10" />
                  <div className={`${accent} opacity-80`}>{icon}</div>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${accent}`}>{title}</h3>
                <p className="text-sm text-surface-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left column */}
            <div>
              <p className="section-label mb-3">CAPABILITIES</p>
              <h2 className="section-title mb-4">
                Built for the Arab Region&apos;s Agricultural Challenges
              </h2>
              <p className="section-subtitle mb-8">
                AgriSpectra-Q is designed specifically for water-scarce agricultural environments. 
                Using real EnMAP data and hybrid quantum-classical AI, we give inspection teams 
                an unfair advantage in finding problems before they become crop losses.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  '224-band hyperspectral processing',
                  'Georeferenced priority maps',
                  'Spectral anomaly evidence',
                  'Inspection budget optimisation',
                  'Quantum-inspired AI layer',
                  'Reproducible science (6 models)',
                  'Real-time live analysis engine',
                  'GeoTIFF + GeoJSON outputs',
                ].map((feat) => (
                  <div key={feat} className="flex items-start gap-2 text-sm text-surface-700">
                    <svg className="w-4 h-4 text-spectral-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feat}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — feature cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {FEATURES.map(({ icon, title, desc, tag, tagColor }) => (
                <div key={title} className="card p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-surface-600">
                      {icon}
                    </div>
                    <span className={`text-2xs font-bold px-2 py-1 rounded-full ${tagColor}`}>{tag}</span>
                  </div>
                  <h3 className="font-bold text-surface-900 text-sm">{title}</h3>
                  <p className="text-xs text-surface-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact numbers ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-primary-900 via-surface-900 to-primary-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-primary-300 mb-4">SCIENTIFIC RESULTS</p>
              <h2 className="text-4xl font-extrabold text-white mb-5 leading-tight">
                Top-Ranked Performance Across All Evaluated Systems
              </h2>
              <p className="text-primary-200/70 leading-relaxed mb-8">
                AgriSpectra-Q achieved the highest numerical mean F1 score in the six-model industrial benchmark, 
                evaluated across 3 real EnMAP scenes and 5 random seeds — 90 total benchmark runs.
              </p>
              <Link href="/results" className="btn-white inline-flex">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                View Full Benchmark Results
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: '96.40%', label: 'Mean F1 Score',    sub: 'Across 3 scenes × 5 seeds' },
                { val: '99.47%', label: 'PR-AUC',           sub: 'Precision-Recall' },
                { val: '99.87%', label: 'ROC-AUC',          sub: 'Discrimination power' },
                { val: '0.73%',  label: 'Calibrated ECE',   sub: 'Well-calibrated probabilities' },
              ].map(({ val, label, sub }) => (
                <div key={label} className="card-glass p-6 rounded-2xl">
                  <div className="text-3xl font-extrabold text-white tabular-nums mb-1">{val}</div>
                  <div className="text-sm font-semibold text-primary-200">{label}</div>
                  <div className="text-xs text-primary-400 mt-1">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-3">GET STARTED</p>
          <h2 className="section-title mb-4">
            Ready to Turn Satellite Data into Field Action?
          </h2>
          <p className="section-subtitle mb-10 mx-auto max-w-xl">
            Select a real EnMAP scene, run the live analysis engine, and receive 
            georeferenced priority zones in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/intelligence" className="btn-primary-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start Live Analysis
            </Link>
            <Link href="/project" className="btn-outline text-base">
              Learn About the Project
            </Link>
          </div>
        </div>
      </section>

      {/* ── Scientific boundary ───────────────────────────────────────────────── */}
      <section className="bg-amber-50 border-t border-amber-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <p className="font-bold text-surface-900 mb-1">Scientific Boundary Statement</p>
              <p className="text-sm text-surface-600">
                AgriSpectra-Q identifies <strong>spectral-anomaly priority candidates</strong> for field inspection.
                It does not diagnose disease, pests, or biological stress.
                All priority zones require <strong>independent field verification</strong>.
                Output is a decision-support signal, not a confirmed agronomic diagnosis.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
