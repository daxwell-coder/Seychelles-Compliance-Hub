import { useState } from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function ExistingIBC() {
  const [formData, setFormData] = useState({
    companyName: '',
    registrationNumber: '',
    incorporationDate: '',
    currentAgent: '',
    businessActivity: '',
    complianceHistory: '',
    lastFilingDate: '',
    contactPerson: '',
    contactEmail: '',
    urgencyLevel: 'standard'
  });

  const [response, setResponse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/onboard-existing-ibc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setResponse(data);
        showNotification('✅ Existing IBC onboarding initiated successfully!', 'success');
      } else {
        throw new Error(data.error || 'Onboarding failed');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification(`❌ Error: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen relative text-white ${inter.className}`} style={{
      backgroundImage: 'url(/images/victoria_seychelles_hero_background.webp)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Clear overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/85 to-indigo-900/90"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/20 bg-black/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                🇸🇨 Seychelles Compliance Hub
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <a href="/" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/15 transition-all">
                New IBC
              </a>
              <span className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg">
                Existing IBC
              </span>
              <a href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/15 transition-all">
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 p-4 rounded-xl shadow-2xl z-50 backdrop-blur-md border ${
          notification.type === 'success' ? 'bg-green-600/90 border-green-400/50' : 
          notification.type === 'error' ? 'bg-red-600/90 border-red-400/50' : 'bg-blue-600/90 border-blue-400/50'
        }`}>
          <div className="flex items-center">
            <span className="text-sm font-medium text-white">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500/80 to-cyan-400/80 rounded-2xl mb-6 backdrop-blur-sm border border-white/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m4 0h1" />
            </svg>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 mb-6">
            Existing IBC Compliance
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto mb-8">
            Transform your existing IBC into a fully compliant, automated regulatory powerhouse
          </p>
          
          {/* Key Benefits Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-semibold text-lg text-blue-300 mb-2">Fast Migration</h3>
              <p className="text-gray-300 text-sm">3-7 day compliance transformation</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-4xl mb-3">🛡️</div>
              <h3 className="font-semibold text-lg text-green-300 mb-2">Risk Elimination</h3>
              <p className="text-gray-300 text-sm">Complete regulatory gap analysis</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-semibold text-lg text-purple-300 mb-2">AI Automation</h3>
              <p className="text-gray-300 text-sm">Ongoing compliance monitoring</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Column */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-6">
              Company Information
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="Your IBC Company Name Ltd."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    placeholder="e.g., 123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Incorporation Date *
                  </label>
                  <input
                    type="date"
                    name="incorporationDate"
                    value={formData.incorporationDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Current Registered Agent
                </label>
                <input
                  type="text"
                  name="currentAgent"
                  value={formData.currentAgent}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="Current registered agent or 'Unknown'"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Business Activity
                </label>
                <textarea
                  name="businessActivity"
                  value={formData.businessActivity}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm resize-none"
                  placeholder="Brief description of business activities..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Last Filing Date
                </label>
                <input
                  type="date"
                  name="lastFilingDate"
                  value={formData.lastFilingDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Service Urgency
                </label>
                <select
                  name="urgencyLevel"
                  value={formData.urgencyLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                >
                  <option value="standard" className="bg-slate-800">Standard (5-7 days)</option>
                  <option value="urgent" className="bg-slate-800">Urgent (3-5 days) - +50% fee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Compliance History Notes
                </label>
                <textarea
                  name="complianceHistory"
                  value={formData.complianceHistory}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm resize-none"
                  placeholder="Any known compliance issues, missed filings, or regulatory concerns..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Initiating Compliance Assessment...
                  </div>
                ) : (
                  'Start Compliance Onboarding'
                )}
              </button>
            </form>
          </div>

          {/* Information Column */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-300">
                What We'll Review
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 text-lg">•</span>
                  Historical compliance filing status and accuracy
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-3 text-lg">•</span>
                  Current beneficial ownership structure verification
                </li>
                <li className="flex items-start">
                  <span className="text-teal-400 mr-3 text-lg">•</span>
                  Outstanding regulatory obligations assessment
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  Registered agent verification and updates
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-3 text-lg">•</span>
                  AML/CFT compliance gap identification
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                Migration Services
              </h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-400 mr-3 text-lg">•</span>
                  Complete compliance gap analysis with prioritization
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-3 text-lg">•</span>
                  Automated filing catch-up service with penalties avoided
                </li>
                <li className="flex items-start">
                  <span className="text-teal-400 mr-3 text-lg">•</span>
                  AI-powered ongoing compliance automation setup
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-3 text-lg">•</span>
                  Real-time regulatory update notifications
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-3 text-lg">•</span>
                  Annual compliance health checks and optimization
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-300">
                Pricing Structure
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="font-medium text-gray-300">Base Onboarding:</span>
                  <span className="font-bold text-white text-lg">$750</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="font-medium text-gray-300">Ongoing Compliance:</span>
                  <span className="font-bold text-white text-lg">$150/month</span>
                </div>
                <div className="border-t border-white/20 pt-4 mt-4">
                  <div className="text-sm text-gray-400 space-y-2">
                    <div className="flex justify-between">
                      <span>• Urgent service:</span>
                      <span className="text-yellow-400 font-medium">+50% fee</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• High-risk cases:</span>
                      <span className="text-orange-400 font-medium">+30% fee</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Complex history:</span>
                      <span className="text-red-400 font-medium">+20% fee</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Response Display */}
        {response && (
          <div className="mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              Onboarding Assessment Complete
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-blue-300">Risk Assessment</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Risk Level:</span>
                      <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                        response.data.riskAssessment.riskLevel === 'high' ? 'bg-red-600/20 text-red-300 border border-red-500/30' :
                        response.data.riskAssessment.riskLevel === 'medium' ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30' :
                        'bg-green-600/20 text-green-300 border border-green-500/30'
                      }`}>
                        {response.data.riskAssessment.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Years Operating:</span>
                      <span className="font-semibold text-white">{response.data.riskAssessment.yearsOperating} years</span>
                    </div>
                    {response.data.riskAssessment.daysSinceLastFiling && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Days Since Last Filing:</span>
                        <span className={`font-semibold ${
                          response.data.riskAssessment.daysSinceLastFiling > 365 ? 'text-red-400' :
                          response.data.riskAssessment.daysSinceLastFiling > 180 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {response.data.riskAssessment.daysSinceLastFiling} days
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {response.data.riskAssessment.urgentIssues.length > 0 && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <h4 className="text-sm font-semibold text-red-400 mb-3">Urgent Issues Detected:</h4>
                      <ul className="space-y-2">
                        {response.data.riskAssessment.urgentIssues.map((issue, index) => (
                          <li key={index} className="text-sm text-red-300 flex items-start">
                            <span className="text-red-400 mr-2">⚠</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-green-300">Service Details</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Client ID:</span>
                      <span className="font-mono text-sm text-blue-300 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">{response.data.clientId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Timeline:</span>
                      <span className="font-semibold text-white">{response.data.estimatedTimeline}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Tasks Created:</span>
                      <span className="font-semibold text-white">{response.data.tasksCreated}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-3">Pricing Breakdown:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Onboarding Fee:</span>
                        <span className="font-semibold text-white">{response.data.pricing.onboardingFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Monthly Compliance:</span>
                        <span className="font-semibold text-white">{response.data.pricing.monthlyCompliance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4 text-blue-300">Next Steps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {response.data.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-gray-300 text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
