import Link from 'next/link'

// ── Static data — sourced from docs/AgriSpectra-Q_—_UX_UI_Product_Specification.md §6.1
// and docs/AgriSpectra-Q_—_Frontend_Pages_and_UX_Flow.md §6

// Workflow strip — DETECT → PRIORITISE → INSPECT → VERIFY (spec §1, §6.1)
const WORKFLOW = [
  {
    step: '01',
    title: 'DETECT',
    desc: 'Real EnMAP L2A hyperspectral imagery — 224 spectral bands at 30 m resolution — captures spectral signals invisible to standard RGB cameras.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
      </svg>
    ),
  },
  {
    step: '02',
    title: 'PRIORITISE',
    desc: 'Spectral-anomaly scores are computed per pixel. Scene-relative percentile thresholds convert raw signals into ranked, georeferenced priority zones.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    step: '03',
    title: 'INSPECT',
    desc: 'Field teams receive a ranked list of spectral-priority zones — inspect the most anomalous areas first, optimising time and inspection budget.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    step: '04',
    title: 'VERIFY',
    desc: 'Ground-truth the spectral findings on-site. Close the loop between satellite observation and field-confirmed agronomic outcomes.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
]

// Capability strip — Real EnMAP data · Geospatial outputs · Evidence-led action (spec wireframe §6.1)
const CAPABILITIES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: 'Real EnMAP data',
    desc: 'Actual EnMAP L2A GeoTIFF scenes — 224 spectral bands, 30 m/px, UAE / Gulf region. No synthetic or simulated inputs.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
    title: 'Geospatial outputs',
    desc: 'Georeferenced risk rasters, priority maps, zone boundaries (GeoJSON), and inspection-budget analysis per run.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: 'Evidence-led action',
    desc: 'Ranked zone cards, spectral evidence per zone, and an inspection-budget chart guide field teams to the highest-priority areas first.',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="bg-surface-50">

      {/* ── Hero — single dark background, no layered noise ────────────────── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[0.06]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">

            {/* Mode badge — spec §3.2 */}
            <div className="flex flex-wrap items-center gap-2.5 mb-8 animate-fade-up">
              <span className="badge badge-live">
                <span className="dot-live" />
                Live Engine Active
              </span>
              <span className="badge bg-white/8 text-white/60 border border-white/10 text-xs">
                Arab Youth Space Hackathon 2026
              </span>
            </div>

            {/* Headline — plain white, no gradient text */}
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight mb-5 animate-fade-up delay-100">
              Hyperspectral intelligence{' '}
              <span className="text-white/80">for targeted inspection.</span>
            </h1>

            {/* Sub — spec §6.1 UX copy verbatim */}
            <p className="text-base text-white/60 max-w-2xl leading-relaxed mb-4 animate-fade-up delay-200">
              Find the areas that deserve attention first, understand the spectral evidence,
              and send field teams to verify the signal.
            </p>

            {/* Scientific boundary — spec §6.1 required, §3.3 */}
            <p className="text-sm text-white/35 max-w-xl mb-10 animate-fade-up delay-200">
              This system identifies spectral-anomaly priority candidates.
              It does not diagnose disease or pests.
            </p>

            {/* CTAs — primary sm size (enterprise standard), secondary ghost */}
            <div className="flex flex-col sm:flex-row gap-3 mb-16 animate-fade-up delay-300">
              <Link href="/intelligence" className="btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Run Live Analysis
              </Link>
              <Link href="/results" className="btn inline-flex items-center gap-2 px-5 py-2.5 text-sm border border-white/15 text-white/70 rounded-lg hover:bg-white/8 hover:text-white hover:border-white/25 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                Explore Results
              </Link>
            </div>

            {/* Workflow strip — spec §6.1 wireframe: DETECT → PRIORITISE → INSPECT → VERIFY */}
            <div className="flex flex-wrap items-center gap-2 animate-fade-up delay-400">
              {['DETECT', 'PRIORITISE', 'INSPECT', 'VERIFY'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/40 tracking-widest">{step}</span>
                  {i < 3 && <span className="text-white/15">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-surface-50 to-transparent" />
      </section>

      {/* ── Capability strip — spec §6.1 wireframe: Real EnMAP · Geospatial · Evidence-led */}
      <section className="py-16 bg-white border-t border-surface-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10">
            {CAPABILITIES.map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="text-surface-400 mt-0.5 flex-shrink-0">{icon}</div>
                <div>
                  <h3 className="font-semibold text-surface-900 text-sm mb-1">{title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Four-stage workflow — spec §6.1 wireframe */}
      <section className="py-20 bg-surface-50 border-t border-surface-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-3">HOW IT WORKS</p>
            <h2 className="section-title">Four steps from satellite to field</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-surface-100">
            {WORKFLOW.map(({ step, title, desc, icon }, i) => (
              <div key={step} className="px-6 py-6 lg:py-0 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold tabular-nums text-surface-300 font-mono">{step}</span>
                  <div className="text-surface-400">{icon}</div>
                </div>
                <h3 className="text-sm font-bold text-surface-900 mb-2 tracking-wide">{title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-white border-t border-surface-100">
        <div className="max-w-2xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="section-title mb-4">Ready to run a real analysis?</h2>
          <p className="section-subtitle mb-8 mx-auto">
            Select a real EnMAP scene, execute the live engine, and receive
            georeferenced spectral-priority zones in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/intelligence" className="btn-primary-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Run Live Analysis
            </Link>
            <Link href="/project" className="btn-outline text-sm">Learn about the project</Link>
          </div>
        </div>
      </section>

      {/* ── Scientific boundary — spec §6.1 required content, §10 UX copy ── */}
      <div className="bg-amber-50 border-t border-amber-200 py-5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 flex-shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-sm text-surface-600">
              <strong className="text-surface-800">Scientific boundary:</strong>{' '}
              AgriSpectra-Q prioritises spectral-anomaly candidates for field inspection.
              It does not diagnose disease or pests.{' '}
              <strong className="text-surface-800">Field verification is required.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
