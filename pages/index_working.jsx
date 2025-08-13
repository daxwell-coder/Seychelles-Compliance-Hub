import Head from 'next/head'

export default function Home() {
  const backgroundStyle = {
    background: `linear-gradient(135deg, 
      rgba(6, 182, 212, 0.95) 0%, 
      rgba(14, 165, 233, 0.9) 25%,
      rgba(59, 130, 246, 0.85) 50%,
      rgba(99, 102, 241, 0.9) 75%,
      rgba(139, 92, 246, 0.95) 100%), 
      url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="ocean" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2306b6d4"/><stop offset="50%" stop-color="%230ea5e9"/><stop offset="100%" stop-color="%233b82f6"/></linearGradient><radialGradient id="sun" cx="50%" cy="30%"><stop offset="0%" stop-color="%23fbbf24"/><stop offset="100%" stop-color="%23f59e0b"/></radialGradient></defs><rect width="1200" height="800" fill="url(%23ocean)"/><circle cx="200" cy="150" r="80" fill="url(%23sun)" opacity="0.9"/><path d="M0,400 Q300,200 600,380 T1200,400 L1200,800 L0,800 Z" fill="%23f0f9ff" fill-opacity="0.1"/><path d="M0,600 Q200,520 400,600 T800,580 L800,800 L0,800 Z" fill="%2322c55e" fill-opacity="0.15"/><path d="M200,650 Q300,630 400,650 Q500,670 600,650 Q700,630 800,650 L800,800 L200,800 Z" fill="%23065f46" fill-opacity="0.1"/></svg>')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    minHeight: '100vh'
  }

  return (
    <div style={backgroundStyle}>
      <Head>
        <title>Seychelles Compliance Hub - AI-Powered Regulatory Excellence</title>
        <meta name="description" content="Revolutionary AI-powered regulatory compliance platform engineered for Seychelles financial institutions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <section className="relative z-40 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
            Revolutionary AI-Powered
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              Compliance Platform
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-cyan-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            Engineered for Seychelles financial institutions with advanced AI semantic analysis, 
            comprehensive risk assessment, and automated regulatory monitoring.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-semibold rounded-2xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-2xl">
              Start Your Compliance Journey
            </button>
            
            <button className="px-12 py-5 bg-white/20 backdrop-blur-sm text-white text-lg font-semibold rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300">
              View Live Demo
            </button>
          </div>
        </div>
      </section>

      <section className="relative z-40 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-white text-center mb-16">
            Three-Portal Professional System
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "🧠 STR Co-Pilot",
                desc: "AI-powered Suspicious Transaction Report assistant with natural language processing and automated risk scoring.",
                href: "/str-copilot"
              },
              {
                title: "⚡ Real-Time Monitoring", 
                desc: "Continuous regulatory landscape monitoring with instant alerts and compliance impact analysis.",
                href: "/dashboard"
              },
              {
                title: "🎯 IBC Registration",
                desc: "Complete 5-step onboarding wizard for International Business Company registration with revenue generation capability.",
                href: "/onboarding"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-cyan-100 mb-6 leading-relaxed">{feature.desc}</p>
                <a
                  href={feature.href}
                  className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
                >
                  Learn More →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-40 py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-12">
            International Standards Certified
          </h2>
          
          <div className="flex flex-wrap justify-center gap-6">
            {['🏛️ FSA Seychelles', '🛡️ FIU Seychelles', '🌐 ICA Standards', '💰 AML/CFT', '🔐 GDPR', '📊 ISO 27001'].map((badge, idx) => (
              <div key={idx} className="bg-white/15 backdrop-blur-md rounded-2xl px-8 py-4 border border-white/20">
                <span className="text-white font-semibold text-lg">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-40 py-12 px-6 border-t border-white/20">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-cyan-100">
            © 2025 Seychelles Compliance Hub. Regulatory excellence through artificial intelligence.
          </p>
        </div>
      </footer>
    </div>
  )
}
