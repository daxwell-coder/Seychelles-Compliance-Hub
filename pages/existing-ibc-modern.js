import { useState } from 'react';
import { Inter } from 'next/font/google';
import Head from 'next/head';

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
    <>
      <Head>
        <title>Existing IBC Compliance Onboarding - Seychelles Compliance Hub</title>
        <meta name="description" content="Professional compliance services for existing Seychelles IBCs" />
        <link rel="stylesheet" href="/victoria-modern-building.css" />
      </Head>
      
      <div className={`victoria-modern-bg ${inter.className}`}>
        {/* Navigation */}
        <nav className="modern-nav">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  🇸🇨 Seychelles Compliance Hub
                </h1>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <a href="/" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200">
                  New IBC
                </a>
                <span className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg">
                  Existing IBC
                </span>
                <a href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200">
                  Dashboard
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Notification */}
        {notification && (
          <div className={`fixed top-20 right-4 p-4 rounded-xl shadow-2xl z-50 glass-card animate-fade-in-up ${
            notification.type === 'success' ? 'border-green-400/30' : 
            notification.type === 'error' ? 'border-red-400/30' : 'border-blue-400/30'
          }`}>
            <div className="flex items-center">
              <span className="text-sm font-medium text-white">{notification.message}</span>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="glass-card inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m4 0h1" />
              </svg>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 mb-6 leading-tight">
              Existing IBC
              <br />
              <span className="text-4xl md:text-5xl">Compliance Onboarding</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed">
              Transform your existing IBC into a fully compliant, automated regulatory powerhouse with our 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-semibold"> AI-powered compliance migration</span> services.
            </p>
            
            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="glass-card p-6 text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold text-lg text-blue-300 mb-2">Fast Migration</h3>
                <p className="text-gray-300 text-sm">3-7 day compliance transformation</p>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-3xl mb-3">🛡️</div>
                <h3 className="font-semibold text-lg text-green-300 mb-2">Risk Elimination</h3>
                <p className="text-gray-300 text-sm">Complete regulatory gap analysis</p>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="font-semibold text-lg text-purple-300 mb-2">AI Automation</h3>
                <p className="text-gray-300 text-sm">Ongoing compliance monitoring</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Column */}
            <div className="glass-card-strong p-8 animate-fade-in-up">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Company Information
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 modern-input"
                    placeholder="Your IBC Company Name Ltd."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 modern-input"
                      placeholder="e.g., 123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Incorporation Date *
                    </label>
                    <input
                      type="date"
                      name="incorporationDate"
                      value={formData.incorporationDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 modern-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Current Registered Agent
                  </label>
                  <input
                    type="text"
                    name="currentAgent"
                    value={formData.currentAgent}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 modern-input"
                    placeholder="Current registered agent or 'Unknown'"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Business Activity
                  </label>
                  <textarea
                    name="businessActivity"
                    value={formData.businessActivity}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 modern-input resize-none"
                    placeholder="Brief description of business activities..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Last Filing Date
                  </label>
                  <input
                    type="date"
                    name="lastFilingDate"
                    value={formData.lastFilingDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 modern-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 modern-input"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 modern-input"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Service Urgency
                  </label>
                  <select
                    name="urgencyLevel"
                    value={formData.urgencyLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 modern-input"
                  >
                    <option value="standard" className="bg-slate-800">Standard (5-7 days)</option>
                    <option value="urgent" className="bg-slate-800">Urgent (3-5 days) - +50% fee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Compliance History Notes
                  </label>
                  <textarea
                    name="complianceHistory"
                    value={formData.complianceHistory}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 modern-input resize-none"
                    placeholder="Any known compliance issues, missed filings, or regulatory concerns..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 modern-btn-primary font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Initiating Compliance Assessment...
                    </div>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      Start Compliance Onboarding
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Information Column */}
            <div className="space-y-6 animate-fade-in-up">
              <div className="glass-card p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-300">
                    What We'll Review
                  </h3>
                </div>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
                    Historical compliance filing status and accuracy
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 mr-3 flex-shrink-0"></div>
                    Current beneficial ownership structure verification
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-teal-400 mt-2 mr-3 flex-shrink-0"></div>
                    Outstanding regulatory obligations assessment
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-2 mr-3 flex-shrink-0"></div>
                    Registered agent verification and updates
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 mr-3 flex-shrink-0"></div>
                    AML/CFT compliance gap identification
                  </li>
                </ul>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                    Migration Services
                  </h3>
                </div>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-2 mr-3 flex-shrink-0"></div>
                    Complete compliance gap analysis with prioritization
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 mr-3 flex-shrink-0"></div>
                    Automated filing catch-up service with penalties avoided
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-teal-400 mt-2 mr-3 flex-shrink-0"></div>
                    AI-powered ongoing compliance automation setup
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 mr-3 flex-shrink-0"></div>
                    Real-time regulatory update notifications
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 mr-3 flex-shrink-0"></div>
                    Annual compliance health checks and optimization
                  </li>
                </ul>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-300">
                    Pricing Structure
                  </h3>
                </div>
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
            <div className="mt-12 glass-card-strong p-8 animate-fade-in-up">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                  Onboarding Assessment Complete
                </h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 text-blue-300 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Risk Assessment
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Risk Level:</span>
                        <span className={`font-semibold px-3 py-1 rounded-full text-sm status-badge ${
                          response.data.riskAssessment.riskLevel === 'high' ? 'status-high' :
                          response.data.riskAssessment.riskLevel === 'medium' ? 'status-medium' :
                          'status-low'
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
                        <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          Urgent Issues Detected
                        </h4>
                        <ul className="space-y-2">
                          {response.data.riskAssessment.urgentIssues.map((issue, index) => (
                            <li key={index} className="text-sm text-red-300 flex items-start">
                              <span className="text-red-400 mr-2">•</span>
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 text-green-300 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Service Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Client ID:</span>
                        <span className="font-mono text-sm text-blue-300 bg-blue-500/10 px-2 py-1 rounded">{response.data.clientId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Estimated Timeline:</span>
                        <span className="font-semibold text-white">{response.data.estimatedTimeline}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Tasks Created:</span>
                        <span className="font-semibold text-white">{response.data.tasksCreated}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 glass-card p-4">
                      <h4 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Pricing Breakdown
                      </h4>
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
              
              <div className="mt-8 glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-300 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Next Steps
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {response.data.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-start glass-card p-4">
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
    </>
  );
}
