import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Film,
} from 'lucide-react';

/**
 * EmailVerificationScreen
 * Handles verification link processing for `/verify-email?token=...`
 * Features states: loading, success, expired, invalid, and network error with retry.
 */
export default function EmailVerificationScreen({ onReturnToLogin, onVerificationSuccess }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'expired' | 'invalid' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [authData, setAuthData] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Keep token purely in memory in a ref; never write to localStorage or sessionStorage
  const [newLinkStatus, setNewLinkStatus] = useState(''); // '' | 'sending' | 'sent' | 'error'
  const [newLinkMessage, setNewLinkMessage] = useState('');
  const tokenRef = useRef(null);
  const hasExecutedRef = useRef(false);

  // Extract token and immediately sanitize browser URL on mount
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const queryToken = url.searchParams.get('token');
      if (queryToken && queryToken.trim()) {
        tokenRef.current = queryToken.trim();
        // Remove token from browser address bar immediately without page reload
        url.searchParams.delete('token');
        const cleanPath = url.pathname + (url.search ? url.search : '');
        window.history.replaceState({}, document.title, cleanPath || '/');
      }
    } catch {
      // ignore URL parsing errors
    }

    if (!tokenRef.current) {
      setStatus('invalid');
      setErrorMessage('This verification link is invalid or has already been used.');
      return;
    }

    // Prevent duplicate API calls on double-render (React StrictMode)
    if (!hasExecutedRef.current) {
      hasExecutedRef.current = true;
      executeVerification(tokenRef.current);
    }
  }, []);

  const executeVerification = async (rawToken) => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: rawToken }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setStatus('success');
        setVerifiedEmail(data.email || (data.user && data.user.email) || '');
        if (data.token) {
          setAuthData(data);
          // Seamless transition directly into user workspace if handler provided
          if (typeof onVerificationSuccess === 'function') {
            setTimeout(() => {
              onVerificationSuccess(data);
            }, 1200);
          }
        }
      } else {
        const code = data.code || '';
        if (code === 'TOKEN_EXPIRED') {
          setStatus('expired');
          setErrorMessage(data.error || 'This verification link has expired. Please request a new one.');
        } else if (code === 'TOKEN_ALREADY_USED' || code === 'TOKEN_INVALID' || code === 'TOKEN_REQUIRED') {
          setStatus('invalid');
          setErrorMessage(data.error || 'This verification link is invalid or has already been used.');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Unable to verify email at this moment. Please try again.');
        }
      }
    } catch {
      setStatus('error');
      setErrorMessage('A network error occurred. Please check your internet connection and try again.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleManualContinue = () => {
    if (authData && typeof onVerificationSuccess === 'function') {
      onVerificationSuccess(authData);
    } else if (typeof onReturnToLogin === 'function') {
      onReturnToLogin('signin');
    }
  };

  // Expired link: ask for a new one by this link's own token. The new link goes to the account's inbox,
  // so this screen never needs (or shows) the email address.
  const handleRequestNewLink = async () => {
    if (!tokenRef.current || newLinkStatus === 'sending') return;
    setNewLinkStatus('sending');
    setNewLinkMessage('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenRef.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setNewLinkStatus('sent');
        setNewLinkMessage(data.message || 'A new verification link has been sent to your email address.');
      } else if (data.code === 'ALREADY_VERIFIED') {
        setNewLinkStatus('sent');
        setNewLinkMessage(data.message || 'This email address is already verified. You can log in directly.');
      } else {
        setNewLinkStatus('error');
        setNewLinkMessage(data.error || data.message || 'Could not send a new link. Please sign in to request one.');
      }
    } catch {
      setNewLinkStatus('error');
      setNewLinkMessage('Could not send a new link. Please check your connection and try again.');
    }
  };

  const handleNavigateToLogin = () => {
    if (typeof onReturnToLogin === 'function') {
      onReturnToLogin('signin');
    }
  };

  const handleRetry = () => {
    if (!tokenRef.current) {
      setStatus('invalid');
      setErrorMessage('This verification link is invalid or has already been used.');
      return;
    }
    setIsRetrying(true);
    executeVerification(tokenRef.current);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#121211',
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(244, 244, 236, 0.15), transparent)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        color: 'var(--cc-text-1)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--cc-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
          }}
        >
          <Film size={22} color="#FFFFFF" />
        </div>
        <span
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: '#FFFFFF',
          }}
        >
          CleverCut
        </span>
      </div>

      {/* Main Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          backgroundColor: '#191917',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: '36px 32px',
          boxSizing: 'border-box',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* State 1: Loading */}
        {status === 'loading' && (
          <div>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(244, 244, 236, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Loader2 size={32} color="var(--cc-emphasis)" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 10px', color: '#FFFFFF' }}>
              Verifying your email address...
            </h2>
            <p style={{ fontSize: 14, color: 'var(--cc-text-2)', margin: 0, lineHeight: 1.6 }}>
              Please wait while we confirm your credentials and activate your CleverCut account.
            </p>
          </div>
        )}

        {/* State 2: Success */}
        {status === 'success' && (
          <div>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(95, 212, 174, 0.12)',
                border: '1px solid rgba(95, 212, 174, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle2 size={34} color="var(--cc-success)" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 10px', color: '#FFFFFF' }}>
              Your email has been verified successfully!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--cc-text-2)', margin: '0 0 24px', lineHeight: 1.6 }}>
              {verifiedEmail ? (
                <>Your email <strong>{verifiedEmail}</strong> is now verified.</>
              ) : (
                'Your CleverCut account is now fully active.'
              )}{' '}
              {authData?.token
                ? 'Welcome to CleverCut! Opening your creative workspace...'
                : 'You can now sign in to start creating commercial videos.'}
            </p>
            <button
              onClick={handleManualContinue}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: 'var(--cc-action)',
                color: 'var(--cc-on-action)',
                border: 'none',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                transition: 'opacity 0.2s',
              }}
            >
              <span>{authData?.token ? 'Enter Workspace' : 'Go to Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* State 3: Expired link */}
        {status === 'expired' && (
          <div>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(242, 184, 75, 0.12)',
                border: '1px solid rgba(242, 184, 75, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Clock size={32} color="var(--cc-warning)" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 10px', color: '#FFFFFF' }}>
              Verification link expired
            </h2>
            <p style={{ fontSize: 14, color: 'var(--cc-text-2)', margin: '0 0 24px', lineHeight: 1.6 }}>
              This verification link has expired. Verification links are valid for 30 minutes. Please sign in or request a new verification link.
            </p>
            {newLinkMessage && (
              <p style={{ fontSize: 13, color: newLinkStatus === 'error' ? '#FFA79C' : 'var(--cc-success)', margin: '0 0 16px', lineHeight: 1.5 }}>
                {newLinkMessage}
              </p>
            )}
            {newLinkStatus !== 'sent' && (
              <button
                onClick={handleRequestNewLink}
                disabled={newLinkStatus === 'sending'}
                style={{ width: '100%', padding: '12px', marginBottom: 10, borderRadius: 999, border: 'none', backgroundColor: 'var(--cc-action)', color: 'var(--cc-on-action)', fontSize: 14, fontWeight: 600, cursor: newLinkStatus === 'sending' ? 'wait' : 'pointer', opacity: newLinkStatus === 'sending' ? 0.7 : 1 }}
              >
                {newLinkStatus === 'sending' ? 'Sending…' : 'Send me a new link'}
              </button>
            )}
            <button
              onClick={handleNavigateToLogin}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: 'var(--cc-hover)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to Sign In
            </button>
          </div>
        )}

        {/* State 4: Invalid link */}
        {status === 'invalid' && (
          <div>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(255, 122, 107, 0.12)',
                border: '1px solid rgba(255, 122, 107, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <ShieldAlert size={32} color="var(--cc-danger)" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 10px', color: '#FFFFFF' }}>
              Invalid or Used Link
            </h2>
            <p style={{ fontSize: 14, color: 'var(--cc-text-2)', margin: '0 0 24px', lineHeight: 1.6 }}>
              {errorMessage || 'This verification link is invalid or has already been used.'}
            </p>
            <button
              onClick={handleNavigateToLogin}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: 'var(--cc-hover)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to Sign In
            </button>
          </div>
        )}

        {/* State 5: Network/Server error */}
        {status === 'error' && (
          <div>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(255, 122, 107, 0.12)',
                border: '1px solid rgba(255, 122, 107, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <AlertCircle size={32} color="var(--cc-danger)" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 10px', color: '#FFFFFF' }}>
              Verification Failed
            </h2>
            <p style={{ fontSize: 14, color: 'var(--cc-text-2)', margin: '0 0 24px', lineHeight: 1.6 }}>
              {errorMessage || 'Unable to verify email at this moment. Please check your connection and try again.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'var(--cc-action)',
                  color: 'var(--cc-on-action)',
                  border: 'none',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isRetrying ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: isRetrying ? 0.7 : 1,
                }}
              >
                <RefreshCw size={15} className={isRetrying ? 'animate-spin' : ''} />
                <span>{isRetrying ? 'Retrying...' : 'Retry Verification'}</span>
              </button>
              <button
                onClick={onReturnToLogin}
                style={{
                  width: '100%',
                  padding: '11px 20px',
                  background: 'transparent',
                  color: 'var(--cc-text-2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Return to Login
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 24, fontSize: 12, color: 'var(--cc-text-3)', textAlign: 'center' }}>
        &copy; {new Date().getFullYear()} CleverCut Video Intelligence Platform
      </div>
    </div>
  );
}
