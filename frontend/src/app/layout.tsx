import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgriSpectra-Q | Hyperspectral Crop Intelligence',
  description: 'Transform hyperspectral Earth observation data into actionable agricultural insights using AI-powered geospatial intelligence.',
  keywords: ['hyperspectral', 'agriculture', 'AI', 'remote sensing', 'crop monitoring', 'EnMAP', 'UAE', 'satellite imagery'],
  authors: [{ name: 'AgriSpectra-Q Team' }],
  openGraph: {
    title: 'AgriSpectra-Q - Hyperspectral Crop Intelligence',
    description: 'AI-powered platform for hyperspectral agricultural analysis',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
