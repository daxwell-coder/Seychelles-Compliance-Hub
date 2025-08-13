import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Check if this is a browser extension error
    const isExtensionError = 
      error.message?.includes('extension') ||
      error.message?.includes('injected') ||
      error.message?.includes('binance') ||
      error.message?.includes('chrome-extension') ||
      error.stack?.includes('chrome-extension');

    if (isExtensionError) {
      console.warn('Browser extension error caught by boundary:', error.message);
      // Reset the error state after a brief delay for extension errors
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 100);
      return;
    }

    // Log other errors normally
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && !this.isExtensionError()) {
      // Fallback UI for real application errors
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
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏝️</div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px' }}>
              Seychelles Compliance Hub
            </h2>
            <p style={{ margin: '0 0 24px 0', opacity: 0.9 }}>
              Something went wrong. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '12px 24px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  isExtensionError() {
    const error = this.state.error;
    return error && (
      error.message?.includes('extension') ||
      error.message?.includes('injected') ||
      error.message?.includes('binance') ||
      error.message?.includes('chrome-extension') ||
      error.stack?.includes('chrome-extension')
    );
  }
}

export default ErrorBoundary;
