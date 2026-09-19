'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/',            label: 'Home' },
  { href: '/project',     label: 'Project' },
  { href: '/intelligence',label: 'Intelligence' },
  { href: '/results',     label: 'Results' },
  { href: '/technology',  label: 'Technology' },
]

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href)

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-surface-200/80 shadow-sm'
          : 'bg-white/70 backdrop-blur-sm border-b border-transparent'
      }`}
      style={{ height: 'var(--nav-height)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          {/* SVG Satellite icon */}
          <div className="relative w-9 h-9 flex-shrink-0">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 group-hover:from-primary-400 group-hover:to-primary-600 transition-all duration-200 shadow-glow-blue opacity-80 group-hover:opacity-100" />
            <div className="relative flex items-center justify-center w-full h-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-surface-900 text-base tracking-tight group-hover:text-primary-700 transition-colors">
              AgriSpectra<span className="text-primary-600">-Q</span>
            </span>
            <span className="text-2xs text-surface-400 font-medium tracking-wide mt-0.5">Hyperspectral Intelligence</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                isActive(href)
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              {label}
              {isActive(href) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-spectral-50 border border-spectral-200">
            <span className="w-1.5 h-1.5 rounded-full bg-spectral-500 animate-pulse-glow" />
            <span className="text-xs font-semibold text-spectral-700">LIVE ENGINE</span>
          </div>
          <Link href="/intelligence" className="btn-primary text-sm gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Run Analysis
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 rounded-xl text-surface-600 hover:bg-surface-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full inset-x-0 bg-white border-b border-surface-200 shadow-panel animate-fade-up-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-0.5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive(href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-surface-700 hover:bg-surface-100'
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 pb-1">
              <Link
                href="/intelligence"
                onClick={() => setMobileOpen(false)}
                className="btn-primary w-full justify-center"
              >
                Run Live Analysis
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
