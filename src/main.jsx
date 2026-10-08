import React from 'react';
import ReactDOM from 'react-dom/client';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import './index.css';
import App from './App.jsx';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global React Error Caught:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('clevertize_user_context');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0b0c0f',
          color: '#f5f7fa',
          padding: 24,
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: 480,
            width: '100%',
            backgroundColor: '#161922',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 12,
            padding: 28,
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px', color: '#f87171' }}>
              Creative Workspace Error
            </h2>
            <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5, margin: '0 0 18px' }}>
              {this.state.error?.message || 'An unexpected error occurred while rendering the workspace.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  backgroundColor: '#262a36',
                  color: '#d1d5db',
                  border: '1px solid #374151',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset & Start Fresh
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
