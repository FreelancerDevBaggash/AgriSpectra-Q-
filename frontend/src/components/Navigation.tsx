'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Satellite } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/project', label: 'Project' },
  { href: '/intelligence', label: 'Intelligence' },
  { href: '/results', label: 'Results' },
  { href: '/technology', label: 'Technology' },
]

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center group-hover:bg-primary-700 transition-colors">
              <Satellite className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-lg leading-none">AgriSpectra-Q</span>
              <span className="text-xs text-gray-500">Hyperspectral Intelligence</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/intelligence"
              className="ml-4 btn-primary py-2 px-4 text-sm"
            >
              Run Analysis
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/intelligence"
              className="block w-full text-center btn-primary mt-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              Run Analysis
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
