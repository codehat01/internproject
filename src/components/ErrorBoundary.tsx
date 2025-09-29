import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ErrorBoundaryState } from '../types';
import { logSecurityEvent } from '../lib/security';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error for security monitoring
    logSecurityEvent('error_boundary_triggered', 'application', undefined, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    this.setState({
      hasError: true,
      error,
      errorInfo
    });

    // In production, send error to monitoring service
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const isDevelopment = import.meta.env.DEV;

  const handleReload = (): void => {
    window.location.reload();
  };

  const handleGoHome = (): void => {
    window.location.href = '/';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: 'var(--light-gray, #f8f9fa)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '40px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{
          color: 'var(--red, #dc3545)',
          marginBottom: '20px'
        }}>
          <AlertTriangle size={64} />
        </div>
        
        <h1 style={{
          color: 'var(--navy-blue, #0a1f44)',
          marginBottom: '16px',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          Something went wrong
        </h1>
        
        <p style={{
          color: 'var(--dark-gray, #6c757d)',
          marginBottom: '30px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          We apologize for the inconvenience. An unexpected error has occurred in the Police Attendance System.
        </p>

        {isDevelopment && (
          <details style={{
            marginBottom: '30px',
            textAlign: 'left',
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <summary style={{
              cursor: 'pointer',
              fontWeight: '600',
              marginBottom: '10px',
              color: 'var(--navy-blue, #0a1f44)'
            }}>
              Error Details (Development Mode)
            </summary>
            <pre style={{
              fontSize: '12px',
              color: '#dc3545',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0
            }}>
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        )}

        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={resetError}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--navy-blue, #0a1f44)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1a2f54';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--navy-blue, #0a1f44)';
            }}
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          
          <button
            onClick={handleReload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--golden, #d4af37)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#c19b26';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--golden, #d4af37)';
            }}
          >
            <RefreshCw size={18} />
            Reload Page
          </button>
          
          <button
            onClick={handleGoHome}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--dark-gray, #6c757d)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#5a6268';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--dark-gray, #6c757d)';
            }}
          >
            <Home size={18} />
            Go Home
          </button>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#856404'
        }}>
          <strong>Security Notice:</strong> This error has been logged for security monitoring. 
          If you believe this is a security-related issue, please contact your system administrator immediately.
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;