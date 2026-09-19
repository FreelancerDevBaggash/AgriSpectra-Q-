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
  openGraph: {
    title: 'AgriSpectra-Q — Hyperspectral Crop Intelligence',
    description: 'AI-powered hyperspectral analysis platform for agricultural inspection prioritisation',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased bg-surface-50 text-surface-900`}>
        <Navigation />
        {/* pt accounts for fixed nav height */}
        <main className="min-h-screen pt-[var(--nav-height)]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
