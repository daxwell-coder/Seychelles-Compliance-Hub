import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

const LandingPageEnhanced = ({ onStartRegistration, onViewDashboard, onSTRDemo }) => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [registrationData, setRegistrationData] = useState({
    companyName: '',
    incorporatorName: '',
    incorporatorEmail: '',
    businessActivity: '',
    authorizedCapital: '1000 USD',
    incorporatorAddress: '',
    incorporatorPhone: '',
    incorporatorNationality: ''
  });

  const handleIBCRegistration = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setNotification({
        type: 'success',
        message: `IBC Registration initiated! Registration number: REG${Date.now()}`,
        details: ['Application submitted successfully', 'FIU compliance check initiated', 'Confirmation email sent']
      });
      setShowRegistrationForm(false);
      setRegistrationData({
        companyName: '',
        incorporatorName: '',
        incorporatorEmail: '',
        businessActivity: '',
        authorizedCapital: '1000 USD',
        incorporatorAddress: '',
        incorporatorPhone: '',
        incorporatorNationality: ''
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Registration failed. Please try again.',
        details: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="paradise-gradient-bg min-h-screen relative overflow-hidden">
      {/* Floating Decorative Elements */}
      <div className="fixed top-10 right-10 w-48 h-48 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-full floating-animation" />
      <div className="fixed bottom-15 left-15 w-36 h-36 bg-gradient-to-br from-blue-400/8 to-transparent rounded-full floating-animation" style={{ animationDelay: '2s' }} />
      <div className="fixed top-60 left-5 w-24 h-24 bg-gradient-to-br from-purple-400/6 to-transparent rounded-full floating-animation" style={{ animationDelay: '4s' }} />

      {/* Hero Section */}
      <section className="relative z-40 min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-5xl w-full">
          {/* Company Logo/Brand */}
          <div className="flex items-center justify-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-2xl">
              <span className="text-white font-bold text-2xl">🇸🇨</span>
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white">
                Seychelles Compliance Hub
              </h1>
              <p className="text-cyan-200 font-medium">
                AI-Powered Regulatory Excellence
              </p>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
            Revolutionary AI-Powered
            <br />
            <span className="text-paradise bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl">
              Compliance Platform
            </span>
          </h1>
          
          <p className="text-xl text-cyan-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            Engineered for Seychelles financial institutions with advanced AI semantic analysis, 
            comprehensive risk assessment, and automated regulatory monitoring.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button 
              onClick={() => setShowRegistrationForm(true)}
              disabled={isLoading}
              className="paradise-button text-lg px-8 py-4 shadow-2xl transform hover:scale-110 transition-all duration-300"
            >
              {isLoading ? 'Processing...' : 'Start IBC Registration →'}
            </Button>
            
            <Button 
              onClick={onViewDashboard}
              className="glass-effect hover:bg-white/20 text-white font-semibold text-lg px-8 py-4 border border-white/30 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Compliance Certifications */}
      <section className="relative z-40 max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-8">
          International Standards Certified
        </h2>
        
        <p className="text-xl text-cyan-100 mb-12 max-w-4xl mx-auto leading-relaxed">
          Our platform exceeds international compliance standards including FATF Recommendations, EU Anti-Money 
          Laundering Directives, GDPR data protection, and UN Office on Drugs and Crime (UNODC) goAML specifications.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
          {[
            { icon: '🏛️', text: 'FSA Seychelles' },
            { icon: '🛡️', text: 'FIU Seychelles' },
            { icon: '🌐', text: 'ICA Standards' },
            { icon: '💰', text: 'AML/CFT' },
            { icon: '🔐', text: 'GDPR' },
            { icon: '📊', text: 'ISO 27001' }
          ].map((badge, idx) => (
            <Card key={idx} className="glass-card border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">{badge.icon}</div>
                <span className="text-white font-semibold text-sm">{badge.text}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-40 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-8">
            AI-Powered Regulatory Intelligence
          </h2>
          <p className="text-xl text-cyan-100 max-w-4xl mx-auto leading-relaxed">
            Advanced semantic analysis and machine learning algorithms delivering 95%+ accuracy in regulatory risk classification
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: '🧠', 
              title: 'STR Co-Pilot',
              desc: 'AI-powered Suspicious Transaction Report assistant with natural language processing and automated risk scoring',
              action: onSTRDemo
            },
            { 
              icon: '⚡', 
              title: 'Real-Time Monitoring',
              desc: 'Continuous regulatory landscape monitoring with instant alerts and compliance impact analysis',
              action: onViewDashboard
            },
            { 
              icon: '🎯', 
              title: 'IBC Registration MVP',
              desc: 'Complete 5-step onboarding wizard for International Business Company registration with revenue generation capability',
              action: () => setShowRegistrationForm(true)
            }
          ].map((feature, idx) => (
            <Card key={idx} className="glass-card border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer group">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-cyan-100 leading-relaxed mb-6">
                  {feature.desc}
                </p>
                <Button 
                  onClick={feature.action}
                  disabled={isLoading}
                  className="paradise-button group-hover:scale-105 transition-all duration-300"
                >
                  {isLoading ? 'Loading...' : 
                   (feature.title.includes('Registration') ? 'Start Registration →' : 
                    feature.title.includes('STR') ? 'Try STR Co-Pilot →' : 'View Dashboard →')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-40 max-w-6xl mx-auto px-6 py-12 border-t border-white/20 text-center">
        <p className="text-cyan-200">
          © 2025 Seychelles Compliance Hub. Regulatory excellence through artificial intelligence.
        </p>
      </footer>

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="glass-heavy border-white/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white">
                IBC Registration
              </h2>
              <Button
                variant="ghost"
                onClick={() => setShowRegistrationForm(false)}
                className="text-white hover:bg-white/20 text-2xl p-2"
              >
                ✕
              </Button>
            </div>
            
            <form onSubmit={handleIBCRegistration} className="p-6">
              <div className="grid gap-6">
                <div>
                  <label className="block text-cyan-100 font-medium mb-2">
                    Company Name *
                  </label>
                  <Input
                    className="seychelles-input"
                    required
                    value={registrationData.companyName}
                    onChange={(e) => setRegistrationData({...registrationData, companyName: e.target.value})}
                    placeholder="Enter company name"
                  />
                </div>
                
                <div>
                  <label className="block text-cyan-100 font-medium mb-2">
                    Incorporator Name *
                  </label>
                  <Input
                    className="seychelles-input"
                    required
                    value={registrationData.incorporatorName}
                    onChange={(e) => setRegistrationData({...registrationData, incorporatorName: e.target.value})}
                    placeholder="Full name of incorporator"
                  />
                </div>
                
                <div>
                  <label className="block text-cyan-100 font-medium mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    className="seychelles-input"
                    required
                    value={registrationData.incorporatorEmail}
                    onChange={(e) => setRegistrationData({...registrationData, incorporatorEmail: e.target.value})}
                    placeholder="contact@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-cyan-100 font-medium mb-2">
                    Business Activity *
                  </label>
                  <Textarea
                    className="seychelles-input min-h-[100px]"
                    required
                    value={registrationData.businessActivity}
                    onChange={(e) => setRegistrationData({...registrationData, businessActivity: e.target.value})}
                    placeholder="Describe the intended business activities"
                  />
                </div>
                
                <div>
                  <label className="block text-cyan-100 font-medium mb-2">
                    Authorized Capital
                  </label>
                  <Input
                    className="seychelles-input"
                    value={registrationData.authorizedCapital}
                    onChange={(e) => setRegistrationData({...registrationData, authorizedCapital: e.target.value})}
                    placeholder="1000 USD"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 justify-end mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRegistrationForm(false)}
                  className="glass-effect border-white/20 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="paradise-button disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Start Registration'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Notification System */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 max-w-md">
          <Card className={`glass-heavy border-2 ${
            notification.type === 'success' ? 'border-green-400/50' : 'border-red-400/50'
          }`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-white mb-2">
                    {notification.message}
                  </p>
                  {notification.details && notification.details.length > 0 && (
                    <ul className="text-sm text-cyan-100 space-y-1">
                      {notification.details.map((detail, idx) => (
                        <li key={idx}>• {detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setNotification(null)}
                  className="text-white hover:bg-white/20 text-lg p-1 ml-4"
                >
                  ✕
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LandingPageEnhanced;