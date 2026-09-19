import Link from 'next/link'
import { Github, Mail, Satellite } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center">
                <Satellite className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-white text-lg">AgriSpectra-Q</div>
                <div className="text-sm text-gray-400">Hyperspectral Crop Intelligence</div>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              Transform real EnMAP Earth observation data into actionable agricultural insights 
              using AI-powered geospatial intelligence.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:info@agrispectra-q.com"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/project" className="hover:text-white transition-colors">
                  About Project
                </Link>
              </li>
              <li>
                <Link href="/intelligence" className="hover:text-white transition-colors">
                  Run Analysis
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-white transition-colors">
                  View Results
                </Link>
              </li>
              <li>
                <Link href="/technology" className="hover:text-white transition-colors">
                  Technology
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://spaceacademy-hackathons.space.gov.ae" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Hackathon 2026
                </a>
              </li>
              <li>
                <a 
                  href="https://www.enmap.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  EnMAP Mission
                </a>
              </li>
              <li>
                <a 
                  href="https://space.gov.ae" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  UAE Space Agency
                </a>
              </li>
              <li>
                <a 
                  href="https://space42.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Space42 GIQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} AgriSpectra-Q. Built for Arab Youth Space Hackathon 2026.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-400">
                Made with 💚 for sustainable agriculture in the Arab region
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
