import React from 'react';
import './App.css';
import OnboardingWizard from './components/OnboardingWizard';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <OnboardingWizard />
      </ErrorBoundary>
    </div>
  );
}

export default App;