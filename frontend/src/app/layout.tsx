import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'AgriSpectra-Q | Hyperspectral Crop Intelligence',
  description: 'Transform real EnMAP hyperspectral Earth observation data into georeferenced spectral-priority zones and actionable field inspection intelligence.',
  keywords: ['hyperspectral', 'agriculture', 'AI', 'remote sensing', 'crop monitoring', 'EnMAP', 'UAE', 'satellite imagery', 'quantum', 'Space42', 'GIQ'],
  authors: [{ name: 'AgriSpectra-Q Team' }],
  icons: {
    icon: '/logo_icon.png',
    apple: '/logo_icon.png',
    shortcut: '/logo_icon.png',
  },
  openGraph: {
    title: 'AgriSpectra-Q — Hyperspectral Crop Intelligence',
    description: 'AI-powered hyperspectral analysis platform for agricultural inspection prioritisation',
    type: 'website',
    images: [{ url: '/hero_photo.png', width: 1920, height: 640, alt: 'AgriSpectra-Q hyperspectral satellite analysis' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased bg-surface-50 text-surface-900`}>
        {/* Skip-to-content link — WCAG 2.4.1 Bypass Blocks */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Navigation />
        {/* pt accounts for fixed nav height */}
        <main id="main-content" className="min-h-screen pt-[var(--nav-height)]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
