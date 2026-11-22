import Link from 'next/link'
import Image from 'next/image'

// ── Static data — sourced from docs/AgriSpectra-Q_—_UX_UI_Product_Specification.md §6.1
// and docs/integration-package/APPROVED_ENGLISH_COPY.md (approved copy)

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

// Capability strip
const CAPABILITIES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: 'Real EnMAP data',
    desc: 'Actual EnMAP L2A GeoTIFF scenes — 224 spectral bands, 30 m/px, Nile River region, Sudan. No synthetic or simulated inputs.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
    title: 'Geospatial outputs',
    desc: 'Georeferenced spectral-priority rasters, priority maps, zone boundaries (GeoJSON), and inspection-budget analysis per run.',
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

// Customer segments — market-entry hypothesis, NOT confirmed customers
// Source: docs/integration-package/APPROVED_ENGLISH_COPY.md — Target customer hypothesis
const CUSTOMER_SEGMENTS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    role: 'Buyer',
    title: 'Farm management companies',
    desc: 'Large-scale operators needing scalable inspection prioritisation across extensive farmland.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
    role: 'User',
    title: 'Agronomists & field teams',
    desc: 'On-the-ground inspection teams using ranked priority lists to allocate limited field time efficiently.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    role: 'Beneficiary',
    title: 'Agricultural consultancies',
    desc: 'Service firms providing evidence-based crop monitoring advice to multiple farming clients.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    role: 'Beneficiary',
    title: 'Government agricultural programmes',
    desc: 'Regional and national monitoring programmes requiring scalable, evidence-led inspection protocols.',
  },
]

// Decision output labels — approved definitions
// Source: docs/integration-package/APPROVED_ENGLISH_COPY.md — Decision labels
const DECISION_LABELS = [
  {
    label: 'INSPECT',
    color: 'bg-gold-100 text-gold-800 border-gold-300',
    dot: 'bg-gold-500',
    definition: 'Area ranked for field investigation under the current configuration and available spectral evidence.',
    caveat: 'Does not confirm disease or pests.',
  },
  {
    label: 'MONITOR',
    color: 'bg-teal-50 text-teal-800 border-teal-300',
    dot: 'bg-teal-500',
    definition: 'Area that may warrant continued observation rather than immediate field inspection.',
    caveat: 'Does not mean the crop is healthy.',
  },
  {
    label: 'ABSTAIN',
    color: 'bg-surface-100 text-surface-700 border-surface-300',
    dot: 'bg-surface-400',
    definition: 'Area where the available evidence is insufficient, ambiguous, or unreliable for a defensible prioritization decision.',
    caveat: 'Does not mean the area is free of agricultural problems.',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="bg-surface-50">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-gradient-hero">
        <Image
          src="/hero_photo.png"
          alt=""
          fill
          className="object-cover object-center opacity-55"
          priority
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[0.04]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">

            <div className="mb-7 animate-fade-up">
              <Image
                src="/logo_icon.png"
                alt="AgriSpectra-Q"
                width={72}
                height={72}
                className="w-16 h-16 object-contain drop-shadow-lg"
                priority
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 mb-8 animate-fade-up">
              <span className="badge bg-white/8 text-white/60 border border-white/10 text-xs">
                Arab Youth Space Hackathon 2026
              </span>
              <span className="badge bg-white/8 text-white/60 border border-white/10 text-xs">
                Real EnMAP · Nile River, Sudan
              </span>
            </div>

            {/* Headline — approved one-line value proposition */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight mb-5 animate-fade-up delay-100">
              Turn hyperspectral satellite data into{' '}
              <span className="text-white/80">field inspection priorities.</span>
            </h1>

            {/* Sub — approved English copy from integration package */}
            <p className="text-base text-white/65 max-w-2xl leading-relaxed mb-10 animate-fade-up delay-200">
              AgriSpectra-Q transforms hyperspectral satellite observations into spatially explicit inspection priorities,
              helping agricultural teams decide where field investigation may be most valuable — while identifying areas
              where the available evidence is insufficient for a defensible priority decision.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-16 animate-fade-up delay-300">
              <Link href="/intelligence" className="btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Run Live Analysis
              </Link>
              <Link href="/results" className="btn inline-flex items-center gap-2 px-5 py-2.5 text-sm border border-white/30 text-white/80 rounded-lg hover:bg-white/10 hover:text-white hover:border-white/60 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                See Benchmark Results
              </Link>
              <Link href="/tanager" className="btn inline-flex items-center gap-2 px-5 py-2.5 text-sm border border-white/30 text-white/80 rounded-lg hover:bg-white/10 hover:text-white hover:border-white/60 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                Tanager Experiment
              </Link>
            </div>

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

      {/* ── Problem statement — approved copy ─────────────────────────────── */}
      <section className="py-16 bg-white border-t border-surface-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-3">THE PROBLEM WE SOLVE</p>
          <h2 className="text-2xl font-bold text-surface-900 mb-5">Agricultural teams cannot inspect everywhere at once.</h2>
          <p className="text-surface-500 max-w-3xl leading-relaxed mb-6">
            Agricultural inspection teams face a resource-allocation challenge. Farms and agricultural landscapes can cover
            extensive areas, while field teams, time, and operational resources are limited. Inspecting every location with
            equal attention is often impractical.
          </p>
          <p className="text-surface-500 max-w-3xl leading-relaxed">
            The practical need is to distinguish areas that may deserve earlier field investigation, areas that may remain
            under observation, and areas where the available evidence is too limited or ambiguous to support a reliable
            prioritization decision.
          </p>
        </div>
      </section>

      {/* ── Static atlas preview — project example, not live run ─────────── */}
      {/* Source: docs/integration-package — ATLAS_FRONTEND_INTEGRATION_CONTRACT §Recommended display locations §1 */}
      <section className="py-16 bg-surface-50 border-t border-surface-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <p className="section-label mb-1">FOUR-PANEL SPECTRAL ATLAS</p>
              <h2 className="text-lg font-bold text-surface-900">Advanced spectral atlas</h2>
              <p className="text-xs text-surface-500 mt-1 leading-relaxed max-w-xl">
                Four synchronized views of relative spectral evidence and inspection priority.
              </p>
            </div>
            {/* PROJECT EXAMPLE badge — mandatory per integration contract */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest bg-gold-50 border border-gold-200 text-gold-800 flex-shrink-0">
              PROJECT EXAMPLE — RELATIVE PRIORITISATION ONLY
            </span>
          </div>

          <div className="bg-white border border-surface-200 rounded-lg overflow-hidden">
            <Image
              src="/atlas_preview.png"
              alt="AgriSpectra-Q Advanced Spectral Atlas — four-panel view showing spectral anomaly score, relative priority classes, threshold ambiguity proxy, and P95 high-priority footprint. Relative prioritisation only; field verification required."
              width={1120}
              height={800}
              className="w-full h-auto"
              unoptimized
            />
          </div>

          {/* Panel legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { n: 1, title: 'Spectral anomaly score',           sub: 'RMS standardized deviation' },
              { n: 2, title: 'Relative spectral-priority classes', sub: 'P50 / P80 / P95 thresholds' },
              { n: 3, title: 'Threshold ambiguity proxy',         sub: 'Not measurement uncertainty' },
              { n: 4, title: 'P95 high-priority footprint',       sub: 'Inspection candidate areas' },
            ].map(({ n, title, sub }) => (
              <div key={n} className="flex items-start gap-2 text-xs bg-surface-50 border border-surface-100 rounded px-3 py-2">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-100 text-primary-700 font-bold flex-shrink-0 mt-0.5">{n}</span>
                <div>
                  <span className="font-medium text-surface-800 block leading-tight">{title}</span>
                  <span className="text-surface-400">{sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Mandatory atlas caveat */}
          <div className="mt-3 flex items-start gap-2 text-xs text-surface-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-surface-400 flex-shrink-0 mt-0.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>
              <strong className="text-surface-600">DERIVED FROM ACTUAL RUN OUTPUTS · </strong>
              Relative prioritisation only; field verification required. Never implies disease, pest, or confirmed crop stress.
              Scene: <code className="bg-surface-100 px-1 rounded font-mono">scene_01_sudan_sample</code> · CRS: <code className="bg-surface-100 px-1 rounded font-mono">EPSG:32636</code>
            </span>
          </div>
        </div>
      </section>

      {/* ── Capability strip ──────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-surface-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-4">
            {CAPABILITIES.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white border border-surface-200 rounded-lg px-6 py-5">
                <div className="text-surface-400 mb-4">{icon}</div>
                <h3 className="font-semibold text-surface-900 text-sm mb-2">{title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Four-stage workflow ────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-t border-surface-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-3">HOW IT WORKS</p>
            <h2 className="section-title">Four steps from satellite to field</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {WORKFLOW.map(({ step, title, desc, icon }, i) => (
              <div key={step} className="flex lg:flex-col gap-4 lg:gap-0 items-start animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="bg-white border border-surface-200 rounded-lg p-5 flex-1 lg:flex-none w-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-50 border border-primary-200 text-[11px] font-bold text-primary-700 font-mono tabular-nums flex-shrink-0">
                      {step}
                    </span>
                    <div className="text-primary-400">{icon}</div>
                  </div>
                  <h3 className="text-sm font-bold text-surface-900 mb-2 tracking-wide">{title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:flex items-center self-stretch -mx-1.5 mt-7" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-surface-300 flex-shrink-0">
                      <path d="M2 6h8M7 2.5l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Decision output labels — INSPECT / MONITOR / ABSTAIN ──────────── */}
      <section className="py-16 bg-surface-50 border-t border-surface-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-3">WHAT THE SYSTEM OUTPUTS</p>
          <h2 className="text-xl font-bold text-surface-900 mb-2">Three inspection-prioritisation categories</h2>
          <p className="text-sm text-surface-500 mb-6 leading-relaxed">
            These are inspection-prioritisation categories, not disease classifications.
          </p>
          <div className="space-y-3">
            {DECISION_LABELS.map(({ label, color, dot, definition, caveat }) => (
              <div key={label} className={`flex items-start gap-4 bg-white border rounded-lg px-5 py-4 ${color}`}>
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${dot}`} />
                <div>
                  <span className="text-xs font-bold tracking-widest block mb-1">{label}</span>
                  <p className="text-sm leading-relaxed">{definition}</p>
                  <p className="text-xs mt-1 opacity-70 italic">{caveat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Customer segments ─────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-surface-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-3">WHO CAN BENEFIT</p>
          <h2 className="text-xl font-bold text-surface-900 mb-2">Initial target market hypothesis</h2>
          <p className="text-xs text-surface-400 mb-8 leading-relaxed max-w-2xl">
            Large farm management companies and agricultural consulting companies with existing agronomist or field-inspection teams.
            This is a market-entry hypothesis to validate through customer interviews and a field pilot — not a claim of an existing customer or partnership.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CUSTOMER_SEGMENTS.map(({ icon, role, title, desc }) => (
              <div key={title} className="bg-surface-50 border border-surface-200 rounded-lg px-5 py-5">
                <div className="text-surface-400 mb-3">{icon}</div>
                <span className="text-xs font-bold text-primary-600 tracking-widest uppercase block mb-1">{role}</span>
                <h3 className="text-sm font-semibold text-surface-900 mb-2">{title}</h3>
                <p className="text-xs text-surface-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-surface-50 border-t border-surface-100">
        <div className="max-w-2xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="section-title mb-4">Ready to run a real analysis?</h2>
          <p className="section-subtitle mb-8 mx-auto">
            Select a real EnMAP scene, execute the live engine, and receive
            georeferenced spectral-priority zones in 20–85 seconds depending on scene.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/intelligence" className="btn-primary-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Run Live Analysis
            </Link>
            <Link href="/project" className="btn-outline text-sm">Learn about the project</Link>
            <Link href="/tanager" className="btn-outline text-sm">Tanager Experiment</Link>
          </div>
        </div>
      </section>

      {/* ── Scientific boundary — mandatory global disclaimer ──────────────── */}
      <div className="bg-surface-50 border-t border-surface-100 py-5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-surface-400 flex-shrink-0 mt-0.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-xs text-surface-500 leading-relaxed">
              <strong className="text-surface-600">Scientific boundary:</strong>{' '}
              AgriSpectra-Q produces relative hyperspectral evidence for agricultural inspection prioritization.
              Its outputs are not confirmed crop diagnoses.
              Independent field observations and agronomic review are required before intervention.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
