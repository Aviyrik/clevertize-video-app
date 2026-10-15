import React, { useState } from 'react';
import {
  Clapperboard,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Video,
  Film,
} from 'lucide-react';

export default function AuthScreen({
  onAuthSuccess,
  initialMode = 'signup', // 'signup' | 'signin'
}) {
  const [mode, setMode] = useState(initialMode); // 'signup' | 'signin'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [googleNotice, setGoogleNotice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

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
      const payload = mode === 'signup'
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

      // Store session token in localStorage
      if (data.token) {
        try {
          localStorage.setItem('clevertize_token', data.token);
        } catch {}
      }

      onAuthSuccess(data.user, data.token, mode);
    } catch (err) {
      setErrorMsg(err.message || 'Network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setGoogleNotice(false);
  };

  const handleGoogleClick = () => {
    setGoogleNotice(true);
    setTimeout(() => setGoogleNotice(false), 4500);
  };

  return (
    <div
      className="auth-consumer-viewport"
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#090A0E',
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.12) 0%, transparent 55%), radial-gradient(circle at 10% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 45%)',
        color: '#F3F4F6',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {/* Centered Modern Container Card */}
      <div
        className="auth-consumer-card"
        style={{
          width: '100%',
          maxWidth: 1040,
          minHeight: 640,
          backgroundColor: '#0F1016',
          borderRadius: 28,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 80px -12px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.06)',
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* LEFT COLUMN: VISUAL BRAND & CONSUMER JOURNEY PANEL */}
        <div
          className="auth-left-brand-panel"
          style={{
            flex: '1 1 50%',
            margin: 12,
            borderRadius: 22,
            background: 'radial-gradient(circle at 25% 25%, #6366F1 0%, #4338CA 45%, #181534 95%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '40px 38px',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Decorative Glow Circles */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: -40,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Top Brand Header */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <Clapperboard size={20} />
              </div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                }}
              >
                clevertize
              </span>
            </div>
          </div>

          {/* Middle Value Proposition */}
          <div style={{ position: 'relative', zIndex: 2, margin: '48px 0 32px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 9999,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 20,
              }}
            >
              <span>✨ Create Commercials to Sell</span>
            </div>

            <h2
              style={{
                fontSize: 32,
                fontWeight: 800,
                lineHeight: 1.25,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
                margin: '0 0 14px',
              }}
            >
              {mode === 'signup' ? 'Start your Journey' : 'Welcome back to Clevertize'}
            </h2>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: 'rgba(255, 255, 255, 0.82)',
                margin: 0,
                maxWidth: 380,
              }}
            >
              Turn your business ideas and products into high-converting video ad scripts in minutes.
            </p>
          </div>

          {/* Bottom Stepper Journey Pills (Matching References 2 & 5) */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* Step 1: Active Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 14,
                backgroundColor: mode === 'signup' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.18)',
                color: mode === 'signup' ? '#0F1016' : '#FFFFFF',
                boxShadow: mode === 'signup' ? '0 8px 24px rgba(0, 0, 0, 0.25)' : 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: mode === 'signup' ? '#4F46E5' : 'rgba(255, 255, 255, 0.3)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
                {mode === 'signup' ? 'Register your account' : 'Sign in to workspace'}
              </span>
            </div>

            {/* Step 2: Inactive Frosted Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 14,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>
                Tell us about your business & offer
              </span>
            </div>

            {/* Step 3: Inactive Frosted Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 14,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>
                Generate customer-converting ad films
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONSUMER FORM PANEL */}
        <div
          className="auth-right-form-panel"
          style={{
            flex: '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '52px 48px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ maxWidth: 400, width: '100%', margin: '0 auto' }}>
            {/* Form Title & Subtitle */}
            <div style={{ marginBottom: 28 }}>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
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
                  : 'Please enter your details to sign in to your account.'}
              </p>
            </div>

            {/* Social Google Login Button (Matching References) */}
            <button
              type="button"
              onClick={handleGoogleClick}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '12px 18px',
                borderRadius: 14,
                backgroundColor: '#161722',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E5E7EB',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
                marginBottom: 20,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1E1F2E';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#161722';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
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

            {googleNotice && (
              <div
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  marginBottom: 16,
                  color: '#C7D2FE',
                  fontSize: 12,
                  lineHeight: 1.4,
                  textAlign: 'center',
                }}
              >
                Google sign-in is coming soon! Please sign up with your email below.
              </div>
            )}

            {/* Friendly "Or" Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 24,
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
                  borderRadius: 12,
                  padding: '11px 14px',
                  marginBottom: 20,
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

            {/* The Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Full Name Field (Register Mode Only) */}
              {mode === 'signup' && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#E5E7EB',
                      marginBottom: 7,
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
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '13px 16px',
                      fontSize: 14,
                      borderRadius: 14,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: '#161722',
                      color: '#FFFFFF',
                      outline: 'none',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6366F1';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
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
                    marginBottom: 7,
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
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '13px 16px',
                    fontSize: 14,
                    borderRadius: 14,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#161722',
                    color: '#FFFFFF',
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366F1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Password Field */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
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
                    <span
                      style={{
                        fontSize: 12,
                        color: '#818CF8',
                        cursor: 'pointer',
                      }}
                      onClick={() => alert('To reset your password, please contact support or register with your email.')}
                    >
                      Forgot password?
                    </span>
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
                      padding: '13px 44px 13px 16px',
                      fontSize: 14,
                      borderRadius: 14,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: '#161722',
                      color: '#FFFFFF',
                      outline: 'none',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6366F1';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
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
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Comfortable High-Contrast Action Button (Matching References) */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '14px 20px',
                  borderRadius: 14,
                  backgroundColor: '#FFFFFF',
                  color: '#0F1016',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 255, 255, 0.15)';
                  }
                }}
              >
                {isSubmitting ? (
                  <span>Please wait...</span>
                ) : mode === 'signup' ? (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Mode Switch Toggle Footer */}
            <div
              style={{
                marginTop: 24,
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

            {/* Privacy footnote */}
            <div
              style={{
                marginTop: 36,
                textAlign: 'center',
                fontSize: 11,
                color: '#4B5563',
                lineHeight: 1.4,
              }}
            >
              By continuing, you agree to Clevertize's Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
