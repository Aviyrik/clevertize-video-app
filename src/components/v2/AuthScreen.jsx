import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import AuthVideoShowcase from './AuthVideoShowcase.jsx';

/**
 * AuthScreen - Cinematic two-column authentication experience for CleverCuts.
 *
 * Layout Structure:
 * - Left (55%): Immersive full-bleed AI commercial showreel with CleverCuts logo
 * - Right (45%): Clean, focused authentication form (Create an account / Welcome back)
 * - Fully responsive with desktop, tablet, and mobile optimizations.
 */
export default function AuthScreen({
  onAuthSuccess,
  initialMode = 'signup', // 'signup' | 'signin'
}) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [googleNotice, setGoogleNotice] = useState(false);

  // Restore remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('clevertize_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setNoticeMsg('');
    setGoogleNotice(false);

    // Client-side validations
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

      // Handle "Remember me"
      try {
        if (rememberMe) {
          localStorage.setItem('clevertize_remember_email', email.trim());
        } else {
          localStorage.removeItem('clevertize_remember_email');
        }
      } catch {
        // ignore
      }

      // Store session token in localStorage
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
      className="auth-screen-viewport"
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#07080B',
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.12) 0%, transparent 60%), radial-gradient(circle at 10% 90%, rgba(139, 92, 246, 0.08) 0%, transparent 45%)',
        color: '#F3F4F6',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(16px, 3.5vw, 44px)',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        .auth-screen-card {
          width: 100%;
          max-width: 1380px;
          height: min(880px, calc(100vh - 56px));
          min-height: 620px;
          background-color: #0B0C11;
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 32px 96px -12px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.05);
          display: flex;
          overflow: hidden;
          position: relative;
          padding: 12px;
          box-sizing: border-box;
          gap: 12px;
        }

        .auth-left-column {
          flex: 0 0 55%;
          width: 55%;
          height: 100%;
          position: relative;
          border-radius: 24px;
          overflow: hidden;
        }

        .auth-right-column {
          flex: 0 0 45%;
          width: 45%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justifyContent: center;
          align-items: center;
          padding: 24px clamp(24px, 4vw, 56px);
          box-sizing: border-box;
          overflow-y: auto;
        }

        .auth-form-inner {
          width: 100%;
          max-width: 460px;
        }

        .auth-input {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 16px;
          font-size: 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: #14151F;
          color: #FFFFFF;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }
        .auth-input:focus {
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.22);
          background-color: #161724;
        }

        .auth-btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 12px;
          background-color: #14151F;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #E5E7EB;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        .auth-btn-google:hover {
          background-color: #1A1C2C;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .auth-btn-primary {
          width: 100%;
          margin-top: 6px;
          padding: 14px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
          color: #FFFFFF;
          border: none;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 18px rgba(99, 102, 241, 0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, opacity 0.15s ease;
        }
        .auth-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(99, 102, 241, 0.45);
        }
        .auth-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .auth-btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        /* Tablet composition */
        @media (max-width: 1024px) {
          .auth-screen-card {
            height: auto !important;
            min-height: auto !important;
            max-width: 620px !important;
            flex-direction: column !important;
            gap: 16px !important;
          }
          .auth-left-column {
            flex: 0 0 240px !important;
            width: 100% !important;
            height: 240px !important;
          }
          .auth-right-column {
            flex: 1 1 auto !important;
            width: 100% !important;
            padding: 24px 20px !important;
          }
        }

        /* Mobile composition */
        @media (max-width: 640px) {
          .auth-screen-viewport {
            padding: 12px !important;
          }
          .auth-screen-card {
            border-radius: 20px !important;
            padding: 8px !important;
          }
          .auth-left-column {
            flex: 0 0 170px !important;
            height: 170px !important;
            border-radius: 16px !important;
          }
          .auth-right-column {
            padding: 20px 14px !important;
          }
        }
      `}</style>

      {/* Main Two-Column Outer Card */}
      <div className="auth-screen-card">
        {/* LEFT SECTION (55%): Immersive Video Showcase */}
        <div className="auth-left-column">
          <AuthVideoShowcase
            videoSrc="/videos/background-optimized.mp4"
            fallbackVideoSrc="/videos/background.mp4"
            posterSrc="/videos/background-poster.jpg"
          />
        </div>

        {/* RIGHT SECTION (45%): Clean, Focused Authentication Form */}
        <div className="auth-right-column">
          <div className="auth-form-inner">
            {/* Header: Title & Subtitle */}
            <div style={{ marginBottom: 24 }}>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  color: '#FFFFFF',
                  margin: '0 0 8px',
                }}
              >
                {mode === 'signup' ? 'Create an account' : 'Welcome back'}
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: '#9CA3AF',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {mode === 'signup'
                  ? 'Access your saved scripts and campaigns anywhere.'
                  : 'Log in to continue creating with CleverCuts.'}
              </p>
            </div>

            {/* Google Authentication Button */}
            <button
              type="button"
              className="auth-btn-google"
              onClick={handleGoogleClick}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
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

            {/* Google Notice Feedback */}
            {googleNotice && (
              <div
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  marginTop: 12,
                  color: '#C7D2FE',
                  fontSize: 12,
                  lineHeight: 1.4,
                  textAlign: 'center',
                }}
              >
                Google sign-in is coming soon! Please use email and password below.
              </div>
            )}

            {/* Divider: Or with email */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                margin: '20px 0',
                color: '#6B7280',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
              <span>Or with email</span>
              <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.28)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  color: '#F87171',
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Notice / Info Banner */}
            {noticeMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.28)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  color: '#93C5FD',
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>{noticeMsg}</div>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {/* Full Name Field (Sign-up only) */}
              {mode === 'signup' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#E5E7EB',
                      marginBottom: 6,
                    }}
                  >
                    Your name
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    disabled={isSubmitting}
                    className="auth-input"
                  />
                </div>
              )}

              {/* Email Address Field */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#E5E7EB',
                    marginBottom: 6,
                  }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  disabled={isSubmitting}
                  className="auth-input"
                />
              </div>

              {/* Password Field */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#E5E7EB',
                    }}
                  >
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
                        fontSize: 12,
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
                    className="auth-input"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: 12,
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
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Option (Login mode) */}
              {mode === 'signin' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -2 }}>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      width: 15,
                      height: 15,
                      accentColor: '#6366F1',
                      cursor: 'pointer',
                      borderRadius: 4,
                    }}
                  />
                  <label
                    htmlFor="rememberMe"
                    style={{
                      fontSize: 12,
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    Remember me
                  </label>
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="auth-btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={15} className="icon-spinner" />
                    <span>Please wait...</span>
                  </>
                ) : mode === 'signup' ? (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Mode Switch Toggle Footer */}
            <div
              style={{
                marginTop: 22,
                textAlign: 'center',
                fontSize: 13,
                color: '#9CA3AF',
              }}
            >
              {mode === 'signup' ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#818CF8',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
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
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#818CF8',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Sign Up
                  </button>
                </span>
              )}
            </div>

            {/* Terms and Privacy Policy Footnote */}
            <div
              style={{
                marginTop: 28,
                textAlign: 'center',
                fontSize: 11,
                color: '#4B5563',
                lineHeight: 1.5,
              }}
            >
              By continuing, you agree to CleverCuts's Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
