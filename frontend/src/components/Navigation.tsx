'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'

// ── Primary nav — max 5 items for cognitive clarity (Miller's Law)
// Dashboard is intentionally excluded: it requires a run_id to render.
// It is only reachable via the Intelligence → Run flow redirect.
const PRIMARY_NAV = [
  { href: '/',              label: 'Home'         },
  { href: '/project',       label: 'Project'      },
  { href: '/intelligence',  label: 'Intelligence' },
  { href: '/results',       label: 'Results'      },
  { href: '/team',          label: 'Team'         },
]

// ── Science dropdown — groups technical pages under one entry
// Reduces cognitive load: user doesn't need to know the difference
// between "Models", "Research", and "Technology" upfront.
const SCIENCE_LINKS = [
  { href: '/model-comparison', label: 'Model Comparison',   desc: 'Benchmark across 6 evaluated models'     },
  { href: '/research',         label: 'Research & Evidence', desc: 'Protocol, limitations, scientific basis'  },
  { href: '/technology',       label: 'Technology Stack',    desc: 'Architecture, quantum layer, pipeline'    },
]

// ── Mobile nav — flat list of all destinations
const MOBILE_NAV = [
  ...PRIMARY_NAV,
  ...SCIENCE_LINKS.map(l => ({ href: l.href, label: l.label })),
]

export default function Navigation() {
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [scienceOpen, setScienceOpen] = useState(false)
  const [scrolled, setScrolled]       = useState(false)
  const pathname  = usePathname()
  const router    = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setScienceOpen(false)
  }, [pathname])

  // Close dropdown on outside click
  useEffect(() => {
    if (!scienceOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setScienceOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [scienceOpen])

  // Close dropdown on Escape
  useEffect(() => {
    if (!scienceOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setScienceOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [scienceOpen])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href)

  const isScienceActive = SCIENCE_LINKS.some(l => pathname?.startsWith(l.href))

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
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0" aria-label="AgriSpectra-Q — Home">
          <div className="relative w-9 h-9 flex-shrink-0">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 group-hover:from-primary-400 group-hover:to-primary-600 transition-all duration-200 shadow-glow-blue opacity-80 group-hover:opacity-100" />
            <div className="relative flex items-center justify-center w-full h-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden="true">
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
        <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
          {PRIMARY_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                isActive(href)
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              {label}
              {isActive(href) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" aria-hidden="true" />
              )}
            </Link>
          ))}

          {/* Science dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setScienceOpen(o => !o)}
              aria-expanded={scienceOpen}
              aria-haspopup="true"
              aria-label="Science and technology pages"
              className={`relative flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                isScienceActive
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
              }`}
            >
              Science
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${scienceOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
              {isScienceActive && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500" aria-hidden="true" />
              )}
            </button>

            {scienceOpen && (
              <div
                role="menu"
                aria-label="Science navigation"
                className="absolute top-full right-0 mt-1 w-72 bg-white border border-surface-200 rounded-lg shadow-panel overflow-hidden animate-fade-up-sm"
              >
                {SCIENCE_LINKS.map(({ href, label, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    role="menuitem"
                    aria-current={isActive(href) ? 'page' : undefined}
                    className={`flex flex-col px-4 py-3 transition-colors border-b border-surface-50 last:border-0 ${
                      isActive(href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'hover:bg-surface-50 text-surface-700 hover:text-surface-900'
                    }`}
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-surface-400 mt-0.5">{desc}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right CTA — single Run Analysis button only, no duplicate indicator */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/intelligence"
            className="btn-primary text-sm gap-1.5"
            aria-label="Run a live spectral analysis"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Run Analysis
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-surface-600 hover:bg-surface-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="md:hidden absolute top-full inset-x-0 bg-white border-b border-surface-200 shadow-panel animate-fade-up-sm"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-0.5">
            {MOBILE_NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
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
