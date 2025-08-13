import React, { useState } from 'react';
import Head from 'next/head';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ComplianceDashboard from '@/components/dashboard/ComplianceDashboard';
import STRCoPilotEnhanced from '@/components/str/STRCoPilotEnhanced';
import OnboardingWizardEnhanced from '@/components/onboarding/OnboardingWizardEnhanced';
import LandingPageEnhanced from '@/components/landing/LandingPageEnhanced';
import { mockQuery, mockStore, mockRootProps } from '@/data/seychellesComplianceMockData';

export default function SeychellesComplianceHub() {
  const [activeTab, setActiveTab] = useState('landing');
  const [notification, setNotification] = useState(null);

  const handleStartRegistration = () => {
    setActiveTab('onboarding');
  };

  const handleViewDashboard = () => {
    setActiveTab('dashboard');
  };

  const handleSTRDemo = () => {
    setActiveTab('str-copilot');
  };

  const handleOnboardingComplete = async (data) => {
    console.log('Onboarding completed:', data);
    setNotification({
      type: 'success',
      message: 'IBC Registration completed successfully!',
      details: ['FIU submission processed', 'Compliance verification complete', 'Welcome to Seychelles Compliance Hub']
    });
    setTimeout(() => {
      setActiveTab('dashboard');
    }, 2000);
  };

  const handleOnboardingSave = async (data) => {
    console.log('Saving onboarding draft:', data);
  };

  return (
    <>
      <Head>
        <title>Seychelles Compliance Hub - AI-Powered Regulatory Excellence</title>
        <meta name="description" content="Revolutionary AI-powered regulatory compliance platform engineered for Seychelles financial institutions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Tabs */}
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <TabsList className="glass-effect border border-white/20 p-2 rounded-2xl">
              <TabsTrigger 
                value="landing" 
                className="text-white data-[state=active]:bg-cyan-500/30 data-[state=active]:text-white rounded-xl px-4 py-2"
              >
                🏝️ Landing
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                className="text-white data-[state=active]:bg-cyan-500/30 data-[state=active]:text-white rounded-xl px-4 py-2"
              >
                📊 Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="onboarding" 
                className="text-white data-[state=active]:bg-cyan-500/30 data-[state=active]:text-white rounded-xl px-4 py-2"
              >
                👥 Onboarding
              </TabsTrigger>
              <TabsTrigger 
                value="str-copilot" 
                className="text-white data-[state=active]:bg-cyan-500/30 data-[state=active]:text-white rounded-xl px-4 py-2"
              >
                🧠 STR Co-Pilot
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="landing" className="mt-0">
            <LandingPageEnhanced
              onStartRegistration={handleStartRegistration}
              onViewDashboard={handleViewDashboard}
              onSTRDemo={handleSTRDemo}
            />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-0">
            <ComplianceDashboard
              stats={mockQuery.dashboardStats}
              riskAssessments={mockQuery.riskAssessments}
              criticalTasks={mockQuery.criticalTasks}
              user={mockStore.user}
            />
          </TabsContent>

          <TabsContent value="onboarding" className="mt-0">
            <OnboardingWizardEnhanced
              onComplete={handleOnboardingComplete}
              onSave={handleOnboardingSave}
            />
          </TabsContent>

          <TabsContent value="str-copilot" className="mt-0">
            <STRCoPilotEnhanced />
          </TabsContent>
        </Tabs>

        {/* Global Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md">
            <div className={`glass-heavy border-2 rounded-2xl p-6 ${
              notification.type === 'success' ? 'border-green-400/50' : 'border-red-400/50'
            }`}>
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
                <button
                  onClick={() => setNotification(null)}
                  className="text-white hover:bg-white/20 rounded-lg p-1 ml-4 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}