import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-surface-900 text-surface-300 border-t border-surface-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="font-bold text-white text-base tracking-tight">
                  AgriSpectra<span className="text-primary-400">-Q</span>
                </div>
                <div className="text-xs text-surface-500">Hyperspectral Crop Intelligence</div>
              </div>
            </div>
            <p className="text-sm text-surface-400 leading-relaxed mb-5 max-w-sm">
              Transforming real EnMAP hyperspectral satellite data into ranked inspection priorities 
              for agricultural field teams across the Arab region.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="badge badge-live text-xs">
                <span className="dot-live" /> Live Engine
              </span>
              <span className="badge badge-quantum text-xs">Quantum-Inspired</span>
              <span className="badge bg-surface-700 text-surface-300 border border-surface-600 text-xs">Arab Youth Space Hackathon 2026</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-4">Navigation</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/',             label: 'Home' },
                { href: '/project',      label: 'About Project' },
                { href: '/intelligence', label: 'Run Analysis' },
                { href: '/results',      label: 'Results' },
                { href: '/technology',   label: 'Technology' },
                { href: '/dashboard',    label: 'Dashboard' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-surface-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-4">Resources</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: 'https://spaceacademy-hackathons.space.gov.ae', label: 'Hackathon 2026' },
                { href: 'https://www.enmap.org', label: 'EnMAP Mission' },
                { href: 'https://space.gov.ae', label: 'UAE Space Agency' },
                { href: 'https://space42.ai', label: 'Space42 / GIQ' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-surface-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    {label}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-surface-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-500">
            © {year} AgriSpectra-Q. Built for the Arab Youth Space Hackathon 2026.
          </p>
          <p className="text-xs text-surface-600">
            Spectral-anomaly priority candidates only — all zones require field verification.
          </p>
        </div>
      </div>
    </footer>
  )
}
