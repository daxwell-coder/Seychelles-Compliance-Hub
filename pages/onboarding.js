import React, { useEffect, useState } from 'react';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import ErrorBoundary from '../components/ErrorBoundary';

export default function OnboardingPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side and handle extension conflicts
    setIsClient(true);
    
    // Add error boundary for extension conflicts
    const handleError = (event) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('extension') || 
           event.error.message.includes('injected') ||
           event.error.message.includes('binance'))) {
        console.warn('Browser extension conflict detected, continuing safely...');
        event.preventDefault();
        return true;
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  const handleOnboardingComplete = async (data) => {
    console.log('Onboarding completed:', data);
    
    // Here we would normally submit to our Google Cloud Functions
    try {
      // Example API call to our deployed backend
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Submission successful:', result);
        // Could redirect to dashboard or show success message
      } else {
        console.error('Submission failed:', response.statusText);
      }
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const handleSave = async (data) => {
    console.log('Saving draft:', data);
    // Save as draft functionality
  };

  // Prevent rendering until client-side to avoid hydration issues with extensions
  if (!isClient) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #8b5cf6 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          color: 'white',
          fontSize: '18px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '16px', fontSize: '48px' }}>🇸🇨</div>
          <div>Loading Seychelles Compliance Hub...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ 
        isolation: 'isolate',  // Isolate from extension interference
        position: 'relative',
        zIndex: 1
      }}>
        <OnboardingWizard 
          onComplete={handleOnboardingComplete}
          onSave={handleSave}
        />
      </div>
    </ErrorBoundary>
  );
}
