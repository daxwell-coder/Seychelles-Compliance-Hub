// Seychelles Compliance Hub - Main App Component
// All styles are inline for maximum compatibility
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Global error handler for browser extension conflicts
    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error;
      if (error && (
        error.message?.includes('extension') ||
        error.message?.includes('injected') ||
        error.message?.includes('binance') ||
        error.message?.includes('chrome-extension') ||
        error.stack?.includes('chrome-extension')
      )) {
        console.warn('Browser extension interference detected and handled:', error.message);
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && (
        event.reason.message.includes('extension') ||
        event.reason.message.includes('injected')
      )) {
        console.warn('Extension-related promise rejection handled:', event.reason.message);
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <div style={{ isolation: 'isolate' }}>
      <Component {...pageProps} />
    </div>
  );
}