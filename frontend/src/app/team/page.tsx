// Team page — spec §16 (Frontend Pages doc §16)
// Only verified information about Asia Alhammadi and Ebrahim Baggash.

import Image from 'next/image'
import Link from 'next/link'

const TEAM = [
  {
    id:      'asia',
    role:    'TEAM LEADER / PROJECT CREATOR',
    name:    'Asia Alhammadi',
    title:   'Team Leader · Project Creator · Backend & Scientific Systems Lead',
    photo:   '/Asia.jpeg',
    initials:'AA',
    bio:     'Conceived and led the development of AgriSpectra-Q — a hyperspectral crop-intelligence proof of concept built on real EnMAP satellite data. Asia is responsible for the project\'s overall architecture, scientific and technical direction, and the complete backend implementation, including the hyperspectral analysis pipeline, live geospatial processing engine, model integration, data processing, anomaly prioritisation, GeoTIFF/GeoJSON outputs and reproducible experiment infrastructure.',
  },
  {
    id:      'ebrahim',
    role:    'FRONTEND & UX ENGINEER',
    name:    'Ebrahim Baggash',
    title:   'Frontend Engineer · UX Designer · Product Experience Lead',
    photo:   '/Ebrahim.png',
    initials:'EB',
    bio:     'Designed and developed the AgriSpectra-Q frontend and user experience, transforming the underlying scientific and geospatial engine into a clear, intuitive, and presentation-ready product. Ebrahim is responsible for the interface architecture, interactive visualisation, map-based exploration, results presentation, and overall user experience. He also maintains and presents the project\'s GitHub repository, ensuring the implementation is organised, accessible, and ready for technical review.',
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
            The people behind AgriSpectra-Q — conception, science, engineering, and experience.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Team members */}
        {TEAM.map((member, idx) => (
          <section key={member.id}>
            <p className="section-label mb-4">{member.role}</p>
            <div className={`flex items-start gap-5 pb-8 ${idx < TEAM.length - 1 ? 'border-b border-surface-100' : ''}`}>
              {/* Photo */}
              <div className="w-20 h-20 rounded-full overflow-hidden border border-surface-200 flex-shrink-0 bg-surface-100">
                <Image
                  src={member.photo}
                  alt={member.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-surface-900 mb-0.5">{member.name}</h3>
                <p className="text-sm text-surface-500 mb-3">{member.title}</p>
                <p className="text-sm text-surface-600 leading-relaxed">{member.bio}</p>
              </div>
            </div>
          </section>
        ))}

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
