import Link from 'next/link'
import { ArrowRight, Satellite, MapPin, TrendingUp, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
              Hyperspectral Crop Intelligence for Smarter Field Inspection
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 text-balance">
              Transform real EnMAP Earth observation data into georeferenced spectral-priority zones 
              and actionable inspection intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/intelligence" 
                className="btn-primary bg-white text-primary-700 hover:bg-gray-100 inline-flex items-center gap-2"
              >
                Run Live Analysis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/results" 
                className="btn-outline border-white text-white hover:bg-white/10 inline-flex items-center gap-2"
              >
                Explore Results
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">
              DETECT → PRIORITISE → INSPECT → VERIFY
            </h2>
            <p className="section-subtitle mx-auto">
              A simple, evidence-led workflow for agricultural inspection teams
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Satellite,
                title: 'DETECT',
                description: 'Real EnMAP hyperspectral data (224 bands) captures spectral anomalies invisible to standard RGB imagery',
              },
              {
                icon: MapPin,
                title: 'PRIORITISE',
                description: 'AI-powered ranking converts raw spectral signals into georeferenced priority zones',
              },
              {
                icon: TrendingUp,
                title: 'INSPECT',
                description: 'Focus field resources on high-priority candidates first, optimizing time and budget',
              },
              {
                icon: Zap,
                title: 'VERIFY',
                description: 'Ground-truth findings and close the loop between remote sensing and field observation',
              },
            ].map((step, idx) => (
              <div 
                key={idx} 
                className="card text-center animate-slide-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Built for the Arab Region
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                AgriSpectra-Q addresses real agricultural challenges in water-scarce environments. 
                Using hyperspectral satellite data from EnMAP and the Arab Satellite 813, 
                we help farmers and agronomists detect crop stress early—before it's visible to the naked eye.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Real EnMAP data processing (224 spectral bands)',
                  'Geospatial priority maps and ranked zones',
                  'Spectral evidence and decision support',
                  'Water stress and anomaly detection',
                  'Inspection budget optimization',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/project" className="text-primary-600 font-medium inline-flex items-center gap-2 hover:gap-3 transition-all">
                Learn More About the Project
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 p-1">
                <div className="w-full h-full bg-white rounded-2xl p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-primary-600 mb-2">224</div>
                    <div className="text-lg text-gray-600 mb-4">Spectral Bands</div>
                    <div className="text-4xl font-bold text-secondary-600 mb-2">3</div>
                    <div className="text-lg text-gray-600 mb-4">EnMAP Scenes</div>
                    <div className="text-4xl font-bold text-accent-600 mb-2">96.4%</div>
                    <div className="text-lg text-gray-600">Mean F1 Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Hyperspectral Data into Action?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Run a live analysis on real EnMAP scenes and see spectral-priority zones in minutes.
          </p>
          <Link 
            href="/intelligence" 
            className="btn-primary bg-white text-primary-700 hover:bg-gray-100 inline-flex items-center gap-2"
          >
            Start Analysis Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Scientific Disclaimer */}
      <section className="py-12 bg-amber-50 border-t-4 border-amber-400">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold">
              ⚠
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 text-gray-900">Scientific Boundary Statement</h3>
              <p className="text-gray-700">
                AgriSpectra-Q identifies <strong>spectral-anomaly priority candidates</strong> for field inspection. 
                It does not diagnose disease, pests, or biological stress. 
                All priority zones require <strong>field verification</strong>. 
                The output is a decision-support signal, not a confirmed agricultural diagnosis.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
