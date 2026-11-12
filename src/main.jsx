import React from 'react';
import ReactDOM from 'react-dom/client';
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
          backgroundColor: 'var(--cc-bg)',
          color: 'var(--cc-text-1)',
          padding: 24,
          fontFamily: 'var(--cc-font-text)'
        }}>
          <div style={{
            maxWidth: 480,
            width: '100%',
            backgroundColor: 'var(--cc-surface)',
            border: '1px solid var(--cc-line-2)',
            borderRadius: 20,
            padding: 28,
            textAlign: 'center',
            boxShadow: 'var(--cc-shadow-modal)'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 10px', color: 'var(--cc-text-1)', fontFamily: 'var(--cc-font-display)', letterSpacing: '-0.015em' }}>
              Creative Workspace Error
            </h2>
            <p style={{ fontSize: 14, color: 'var(--cc-text-2)', lineHeight: 1.5, margin: '0 0 18px' }}>
              {this.state.error?.message || 'An unexpected error occurred while rendering the workspace.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  backgroundColor: 'var(--cc-action)',
                  color: 'var(--cc-on-action)',
                  border: 'none',
                  fontSize: 13.5,
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
                  padding: '10px 18px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: 'var(--cc-text-1)',
                  border: '1px solid var(--cc-line-2)',
                  fontSize: 13.5,
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
