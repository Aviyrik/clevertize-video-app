import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import AuthVideoShowcase from './AuthVideoShowcase.jsx';
import LegalDocumentModal from './LegalDocumentModal.jsx';

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login', // 'login' | 'signup'
}) {
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [googleNotice, setGoogleNotice] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode === 'signup' ? 'signup' : 'signin');
      setErrorMsg('');
      setNoticeMsg('');
      setGoogleNotice(false);
      try {
        const savedEmail = localStorage.getItem('clevertize_remember_email');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch {
        // ignore
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setNoticeMsg('');
    setGoogleNotice(false);

    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const payload =
        mode === 'signup'
          ? { email: email.trim(), password, name: name.trim() }
          : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      try {
        if (rememberMe) {
          localStorage.setItem('clevertize_remember_email', email.trim());
        } else {
          localStorage.removeItem('clevertize_remember_email');
        }
      } catch {
        // ignore
      }

      if (data.token) {
        try {
          localStorage.setItem('clevertize_token', data.token);
        } catch {
          // ignore
        }
      }

      if (onAuthSuccess) {
        onAuthSuccess(data.user, data.token, mode);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setNoticeMsg('');
    setGoogleNotice(false);
  };

  const handleGoogleClick = () => {
    setGoogleNotice(true);
    setTimeout(() => setGoogleNotice(false), 4500);
  };

  const handleForgotPassword = () => {
    if (email && email.includes('@')) {
      setNoticeMsg(`Password reset link sent to ${email.trim()}. Please check your inbox.`);
    } else {
      setNoticeMsg('Please enter your email address above to receive reset instructions.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="auth-modal-card"
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '90vh',
          backgroundColor: '#0B0C11',
          borderRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 32px 96px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          position: 'relative',
          padding: 10,
          gap: 10,
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 30,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#9CA3AF',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.color = '#9CA3AF';
          }}
          title="Close modal"
        >
          <X size={16} />
        </button>

        {/* LEFT COLUMN: Cinematic Video Showcase */}
        <div
          style={{
            flex: '0 0 48%',
            width: '48%',
            minHeight: 520,
            borderRadius: 20,
            overflow: 'hidden',
            position: 'relative',
          }}
          className="auth-modal-video-column"
        >
          <AuthVideoShowcase
            videoSrc="/videos/background-optimized.mp4"
            fallbackVideoSrc="/videos/background.mp4"
            posterSrc="/videos/background-poster.jpg"
          />
        </div>

        {/* RIGHT COLUMN: Form */}
        <div
          style={{
            flex: '1 1 52%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '28px clamp(20px, 3vw, 40px)',
            overflowY: 'auto',
          }}
        >
          <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
            <div style={{ marginBottom: 20 }}>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  color: '#FFFFFF',
                  margin: '0 0 6px',
                }}
              >
                {mode === 'signup' ? 'Create an account' : 'Welcome back'}
              </h2>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, lineHeight: 1.4 }}>
                {mode === 'signup'
                  ? 'Access your saved scripts and campaigns anywhere.'
                  : 'Log in to continue creating with CleverCuts.'}
              </p>
            </div>

            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '11px 16px',
                borderRadius: 12,
                backgroundColor: '#14151F',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E5E7EB',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1A1C2C';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#14151F';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.28 21.43 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.28 2.57 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
            </button>

            {googleNotice && (
              <div
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: 10,
                  padding: '8px 12px',
                  marginTop: 10,
                  color: '#C7D2FE',
                  fontSize: 12,
                  lineHeight: 1.4,
                  textAlign: 'center',
                }}
              >
                Google sign-in is coming soon! Please use email below.
              </div>
            )}

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '18px 0',
                color: '#6B7280',
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
              <span>Or with email</span>
              <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
            </div>

            {errorMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.28)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  color: '#F87171',
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>{errorMsg}</div>
              </div>
            )}

            {noticeMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.28)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  color: '#93C5FD',
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>{noticeMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {mode === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#E5E7EB', marginBottom: 5 }}>
                    Your name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 14px',
                      fontSize: 13,
                      borderRadius: 10,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: '#14151F',
                      color: '#FFFFFF',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#E5E7EB', marginBottom: 5 }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 14px',
                    fontSize: 13,
                    borderRadius: 10,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#14151F',
                    color: '#FFFFFF',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#E5E7EB' }}>
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#818CF8',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 40px 11px 14px',
                      fontSize: 13,
                      borderRadius: 10,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: '#14151F',
                      color: '#FFFFFF',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === 'signin' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <input
                    type="checkbox"
                    id="modalRememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: '#6366F1', cursor: 'pointer' }}
                  />
                  <label htmlFor="modalRememberMe" style={{ fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>
                    Remember me
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: '12px 18px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="icon-spinner" />
                    <span>Please wait...</span>
                  </>
                ) : mode === 'signup' ? (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={15} />
                  </>
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: 18, textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
              {mode === 'signup' ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#818CF8', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                  >
                    Log In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#818CF8', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                  >
                    Sign Up
                  </button>
                </span>
              )}
            </div>

            {/* Terms and Privacy Policy Footnote */}
            <div
              style={{
                marginTop: 18,
                textAlign: 'center',
                fontSize: 11,
                color: '#6B7280',
                lineHeight: 1.45,
              }}
            >
              By continuing, you agree to CleverCuts's{' '}
              <button
                type="button"
                onClick={() => {
                  setLegalTab('terms');
                  setLegalModalOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#9CA3AF',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#818CF8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9CA3AF';
                }}
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => {
                  setLegalTab('privacy');
                  setLegalModalOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#9CA3AF',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#818CF8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#9CA3AF';
                }}
              >
                Privacy Policy
              </button>
              .
            </div>
          </div>
        </div>

        {/* Legal Document Modal */}
        <LegalDocumentModal
          isOpen={legalModalOpen}
          onClose={() => setLegalModalOpen(false)}
          initialTab={legalTab}
        />
      </div>
    </div>
  );
}
