// Team page — spec §16 (Frontend Pages doc §16)
// Only verified information about Asia Alhammadi and project roles.
// No invented biographies, credentials, affiliations, or team members.

import Link from 'next/link'

const VERIFIED_ROLES = [
  {
    id:    'hyperspectral',
    label: 'Hyperspectral Remote-Sensing Science',
    desc:  'Interpretation of EnMAP 224-band sensor output, band selection, spectral indexing, and anomaly proxy design.',
  },
  {
    id:    'geospatial-ai',
    label: 'Geospatial AI Engineering',
    desc:  'Georeferenced raster processing, zone extraction, GeoJSON pipeline, and decision-spatial output generation.',
  },
  {
    id:    'ml',
    label: 'Scientific Python and ML',
    desc:  'Scikit-learn and XGBoost model training, frozen benchmark evaluation, calibration, and paired bootstrap testing.',
  },
  {
    id:    'product',
    label: 'Product and Dashboard Engineering',
    desc:  'Next.js frontend, decision dashboard, interactive results views, and backend API integration.',
  },
  {
    id:    'field',
    label: 'Field-Validation Coordination',
    desc:  'Future role: liaison between spectral-priority outputs and on-site agronomic field inspection teams.',
    future: true,
  },
]

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Page header */}
      <div className="border-b border-surface-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-surface-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-surface-700 transition-colors">Home</Link>
            <span aria-hidden="true">›</span>
            <span className="text-surface-600 font-medium">Team</span>
          </nav>
          <p className="section-label mb-3">AGRISPECTRA-Q</p>
          <h1 className="text-3xl font-bold text-surface-900 mb-3">Team</h1>
          <p className="text-base text-surface-500 leading-relaxed max-w-xl">
            Only verified team information is displayed. Roles marked as future are not yet filled.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Verified team member */}
        <section>
          <p className="section-label mb-4">TEAM LEADER / PROJECT CREATOR</p>
          <div className="flex items-start gap-4 pb-6 border-b border-surface-100">
            {/* Avatar placeholder — no fabricated image */}
            <div className="w-14 h-14 rounded-full bg-surface-100 border border-surface-200 flex items-center justify-center text-surface-400 text-xl font-bold flex-shrink-0 select-none">
              AA
            </div>
            <div>
              <h3 className="text-lg font-bold text-surface-900">Asia Alhammadi</h3>
              <p className="text-sm text-surface-500 mb-2">Team leader · Project creator · Arab Youth Space Hackathon 2026</p>
              <p className="text-sm text-surface-600 leading-relaxed">
                Responsible for the conception, design, and delivery of AgriSpectra-Q — a hyperspectral crop
                intelligence proof of concept built on real EnMAP satellite data.
              </p>
            </div>
          </div>
        </section>

        {/* Project roles */}
        <section>
          <p className="section-label mb-4">VERIFIED PROJECT ROLES</p>
          <ul className="divide-y divide-surface-100">
            {VERIFIED_ROLES.map(role => (
              <li key={role.id} className="py-4 flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="sm:w-64 flex-shrink-0">
                  <span className="text-sm font-semibold text-surface-800">{role.label}</span>
                  {role.future && (
                    <span className="ml-2 text-2xs font-medium text-surface-400 uppercase tracking-wide border border-surface-200 rounded px-1.5 py-0.5 align-middle">
                      Future
                    </span>
                  )}
                </div>
                <p className="text-sm text-surface-500 leading-relaxed">{role.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Scientific boundary notice */}
        <section className="border-t border-surface-200 pt-6">
          <p className="text-xs text-surface-400 leading-relaxed">
            The current PoC has no field validation, no field-labelled disease or pest target,
            no blind fourth scene, no complete six-model LOSO evaluation, no proven quantum advantage,
            and no measured financial ROI. Team copy does not imply commercial deployment or operational readiness.
          </p>
        </section>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/intelligence" className="btn-primary inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Run Live Analysis
          </Link>
          <Link href="/project" className="btn-outline inline-flex items-center gap-2 text-sm">
            Project Overview
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
          <Link href="/technology" className="btn-outline inline-flex items-center gap-2 text-sm">
            Technology Stack
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>

      </div>
    </div>
  )
}
