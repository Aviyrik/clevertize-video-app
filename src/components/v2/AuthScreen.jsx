import React, { useState } from 'react';
import {
  Clapperboard,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Film,
  Camera,
  Layers,
  CheckCircle2,
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
  };

  return (
    <div
      className="auth-screen-container"
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#0B0C0F',
        color: '#F5F7FA',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* LEFT COLUMN: AUTHENTICATION FORM */}
      <div
        className="auth-form-column"
        style={{
          width: '100%',
          maxWidth: 520,
          flexShrink: 0,
          backgroundColor: '#101217',
          borderRight: '1px solid #1D212B',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '44px 48px',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div>
          {/* Logo & Product Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
              }}
            >
              <Clapperboard size={20} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#F5F7FA',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                }}
              >
                Clevertize
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#6366F1',
                }}
              >
                Script Intelligence
              </div>
            </div>
          </div>

          {/* Title & Subheading */}
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: '0 0 8px',
                color: '#F5F7FA',
                letterSpacing: '-0.02em',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              }}
            >
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: '#A6ACB8',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Turn your business ideas into videos that sell.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                padding: '11px 14px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                color: '#EF4444',
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Full Name Field (Register Mode Only) */}
            {mode === 'signup' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#F5F7FA',
                    marginBottom: 7,
                    letterSpacing: '0.01em',
                  }}
                >
                  Full name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ananya Roy"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    fontSize: 14,
                    borderRadius: 8,
                    border: '1px solid #252833',
                    backgroundColor: '#151820',
                    color: '#F5F7FA',
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
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
                  fontWeight: 700,
                  color: '#F5F7FA',
                  marginBottom: 7,
                  letterSpacing: '0.01em',
                }}
              >
                Email address
              </label>
              <input
                type="email"
                autoFocus={mode === 'signin'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 14px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '1px solid #252833',
                  backgroundColor: '#151820',
                  color: '#F5F7FA',
                  outline: 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#F5F7FA',
                  marginBottom: 7,
                  letterSpacing: '0.01em',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 42px 12px 14px',
                    fontSize: 14,
                    borderRadius: 8,
                    border: '1px solid #252833',
                    backgroundColor: '#151820',
                    color: '#F5F7FA',
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#737986',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Primary CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 6,
                backgroundColor: '#6366F1',
                border: 'none',
                borderRadius: 8,
                padding: '13px 20px',
                fontSize: 14,
                fontWeight: 700,
                color: '#FFFFFF',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 14px rgba(99, 102, 241, 0.35)',
                opacity: isSubmitting ? 0.75 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              {isSubmitting ? (
                <>
                  <Sparkles size={16} className="icon-spinner" />
                  <span>{mode === 'signup' ? 'Creating account...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create account' : 'Sign in'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Register and Sign In */}
          <div
            style={{
              marginTop: 24,
              textAlign: 'center',
              fontSize: 13,
              color: '#A6ACB8',
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
                    color: '#6366F1',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 13,
                    textDecoration: 'none',
                  }}
                >
                  Sign in
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
                    color: '#6366F1',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 13,
                    textDecoration: 'none',
                  }}
                >
                  Create one
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: '1px solid #1D212B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#737986',
          }}
        >
          <span>Clevertize Script Intelligence</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>v2.0</span>
        </div>
      </div>

      {/* RIGHT COLUMN: BRAND & CREATIVE PRODUCTION VISUAL PANEL */}
      <div
        className="auth-brand-column"
        style={{
          flex: 1,
          backgroundColor: '#0B0C0F',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 64px',
          overflow: 'hidden',
          background: `
            radial-gradient(circle at 85% 15%, rgba(99, 102, 241, 0.16) 0%, transparent 55%),
            radial-gradient(circle at 15% 85%, rgba(56, 189, 248, 0.08) 0%, transparent 50%),
            #0B0C0F
          `,
        }}
      >
        {/* Subtle Decorative Grid Pattern in Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }}
        />

        {/* Top Storyboard Production Blueprint Mock */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 640 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px',
              borderRadius: 20,
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#818CF8',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            <Film size={12} />
            <span>COMMERCIAL WORKSPACE PIPELINE</span>
          </div>

          {/* 4 Story Beats Timeline Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              { beat: '01', title: 'HOOK', timing: '0–3s', sub: 'Pattern interrupt' },
              { beat: '02', title: 'STORY', timing: '3–8s', sub: 'Relatability' },
              { beat: '03', title: 'REVEAL', timing: '8–14s', sub: 'Craft & Proof' },
              { beat: '04', title: 'OFFER', timing: '14–20s', sub: 'Direct CTA' },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(16, 18, 23, 0.75)',
                  backdropFilter: 'blur(12px)',
                  border: idx === 0 ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid #1D212B',
                  borderRadius: 10,
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {idx === 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'linear-gradient(90deg, #6366F1, #38BDF8)',
                    }}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: idx === 0 ? '#6366F1' : '#737986',
                      fontWeight: 800,
                    }}
                  >
                    BEAT {item.beat}
                  </span>
                  <span style={{ fontSize: 10, color: '#737986' }}>{item.timing}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F7FA' }}>{item.title}</div>
                <div style={{ fontSize: 11, color: '#A6ACB8' }}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Miniature Audio & Story Scrubber Bar */}
          <div
            style={{
              backgroundColor: 'rgba(16, 18, 23, 0.6)',
              border: '1px solid #1D212B',
              borderRadius: 8,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Camera size={14} style={{ color: '#6366F1' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#F5F7FA' }}>
                Multi-Scene Screenplay Engine
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 120,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#252833',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '65%',
                    height: '100%',
                    backgroundColor: '#6366F1',
                    borderRadius: 2,
                  }}
                />
              </div>
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#737986' }}>
                18-Pt Gate Passed
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Hero Pitch Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 580, marginTop: 40 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#6366F1',
              marginBottom: 10,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            FROM IDEA TO VIDEO
          </div>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#F5F7FA',
              margin: '0 0 12px',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            }}
          >
            Your next great video starts here.
          </h2>
          <p
            style={{
              fontSize: 15,
              color: '#A6ACB8',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Turn business briefs into compelling scripts and production-ready video concepts.
          </p>
        </div>
      </div>
    </div>
  );
}
