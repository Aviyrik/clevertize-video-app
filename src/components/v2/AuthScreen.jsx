import React, { useState, useEffect } from 'react';
import {
  Clapperboard,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import AuthVideoShowcase from './AuthVideoShowcase.jsx';

/**
 * AuthScreen - SpaceX-inspired full-viewport authentication experience for CleverCuts.
 *
 * Architecture:
 * 1. Background Video covers the ENTIRE viewport (position: fixed, inset: 0, full-bleed)
 *    with a dark overlay so it doesn't distract or disturb the user.
 * 2. CleverCuts brand logo sits independently in the upper-left corner of the viewport.
 * 3. A refined translucent glass authentication panel FLOATS over the video on the RIGHT side.
 * 4. Zero side-by-side card wrappers, zero outer rounded containers, zero split columns.
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
        onAuthSuccess({
          token: data.token,
          user: data.user,
          business: data.business,
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = () => {
    setGoogleNotice(true);
  };

  const handleForgotPassword = () => {
    setNoticeMsg('Password reset instructions will be sent to your email address if an account exists.');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setNoticeMsg('');
    setGoogleNotice(false);
  };

  return (
    <div
      className="auth-screen-viewport"
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
        backgroundColor: '#05060A',
        color: '#F3F4F6',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        .auth-floating-wrapper {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          width: 100%;
          display: flex !important;
          justify-content: flex-end !important;
          align-items: center !important;
          padding: 40px clamp(24px, 5vw, 64px) !important;
          box-sizing: border-box !important;
        }

        .auth-floating-panel {
          width: 100%;
          max-width: 430px;
          margin-left: auto !important;
          margin-right: 0 !important;
          background-color: rgba(13, 14, 22, 0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.10);
          border-radius: 20px;
          padding: 30px 32px;
          box-sizing: border-box;
          box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(255, 255, 255, 0.06);
        }

        .auth-input {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 16px;
          font-size: 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(20, 21, 31, 0.85);
          color: #FFFFFF;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }
        .auth-input:focus {
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.22);
          background-color: rgba(22, 23, 36, 0.95);
        }

        .auth-btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 12px;
          background-color: rgba(20, 21, 31, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #E5E7EB;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        .auth-btn-google:hover {
          background-color: rgba(26, 28, 44, 0.95);
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

        /* Tablet responsive composition */
        @media (max-width: 1024px) {
          .auth-floating-wrapper {
            padding: 36px 32px !important;
            justify-content: flex-end !important;
          }
          .auth-floating-panel {
            max-width: 400px !important;
            padding: 26px 28px !important;
            margin-left: auto !important;
            margin-right: 0 !important;
          }
          .auth-independent-logo {
            top: 28px !important;
            left: 32px !important;
          }
        }

        /* Mobile responsive composition */
        @media (max-width: 640px) {
          .auth-screen-viewport {
            overflow-y: auto !important;
          }
          .auth-independent-logo {
            top: 20px !important;
            left: 20px !important;
          }
          .auth-floating-wrapper {
            justify-content: center !important;
            align-items: center !important;
            padding: 76px 16px 28px 16px !important;
            min-height: 100vh !important;
          }
          .auth-floating-panel {
            max-width: 100% !important;
            padding: 24px 20px !important;
            border-radius: 18px !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
        }
      `}</style>

      {/* 1. FULL-SCREEN BACKGROUND VIDEO: Covers entire viewport with dark overlay */}
      <AuthVideoShowcase
        videoSrc="/videos/background-optimized.mp4"
        fallbackVideoSrc="/videos/background.mp4"
        posterSrc="/videos/background-poster.jpg"
      />

      {/* 2. INDEPENDENT CLEVERCUTS LOGO: Floats in the top-left directly over full-screen video */}
      <div
        className="auth-independent-logo"
        style={{
          position: 'fixed',
          top: 32,
          left: 40,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textDecoration: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: 'rgba(99, 102, 241, 0.25)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          <Clapperboard size={20} />
        </div>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)',
          }}
        >
          CleverCuts
        </span>
      </div>

      {/* 3. FLOATING AUTHENTICATION PANEL: Anchored firmly on the RIGHT side of the viewport */}
      <div
        className="auth-floating-wrapper"
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '40px clamp(24px, 5vw, 64px)',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="auth-floating-panel"
          style={{
            width: '100%',
            maxWidth: 430,
            marginLeft: 'auto',
            marginRight: 0,
            backgroundColor: 'rgba(13, 14, 22, 0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            borderRadius: 20,
            padding: '30px 32px',
            boxSizing: 'border-box',
            boxShadow: '0 24px 60px -10px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Header: Title & Subtitle */}
          <div style={{ marginBottom: 22 }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: '#FFFFFF',
                margin: '0 0 6px',
              }}
            >
              {mode === 'signup' ? 'Create an account' : 'Welcome back'}
            </h1>
            <p
              style={{
                fontSize: 13,
                color: '#9CA3AF',
                margin: 0,
                lineHeight: 1.45,
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
                padding: '8px 12px',
                marginTop: 10,
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
              gap: 12,
              margin: '18px 0',
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
                marginBottom: 14,
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

          {/* Notice Banner */}
          {noticeMsg && (
            <div
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.28)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 14,
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Full Name Field (Sign-up only) */}
            {mode === 'signup' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#E5E7EB',
                    marginBottom: 5,
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
                  marginBottom: 5,
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
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
              marginTop: 20,
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
              marginTop: 22,
              textAlign: 'center',
              fontSize: 11,
              color: '#6B7280',
              lineHeight: 1.45,
            }}
          >
            By continuing, you agree to CleverCuts's Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
