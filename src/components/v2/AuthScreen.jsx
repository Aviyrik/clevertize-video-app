import React, { useState, useEffect, useCallback } from 'react';
import {
  Clapperboard,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Info,
  Mail,
  Clock,
} from 'lucide-react';
import BrandMark from './BrandMark.jsx';
import AuthVideoShowcase from './AuthVideoShowcase.jsx';
import AuthClipWall from './AuthClipWall.jsx';
import LegalDocumentModal from './LegalDocumentModal.jsx';

/**
 * AuthScreen - SpaceX-inspired full-viewport authentication experience for CleverCut.
 *
 * Architecture:
 * 1. Background Video covers the ENTIRE viewport (position: fixed, inset: 0, full-bleed)
 *    with a darkened overlay so it doesn't distract or disturb the user.
 * 2. CleverCut brand logo sits independently in the upper-left corner of the viewport.
 * 3. Showcase editorial copy sits in the bottom-left corner to give editorial balance.
 * 4. A refined translucent glass authentication panel FLOATS over the video on the RIGHT side.
 * 5. Zero side-by-side card wrappers, zero outer rounded containers, zero split columns.
 */
export default function AuthScreen({
  onAuthSuccess,
  initialMode = 'signup', // 'signup' | 'signin' | 'login'
}) {
  const normalizeMode = (m) => (m === 'login' || m === 'signin' ? 'signin' : 'signup');
  const [mode, setMode] = useState(() => normalizeMode(initialMode));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [googleNotice, setGoogleNotice] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');

  // Background: the Coverr clip wall, or the bundled single video if Coverr can't be reached
  const [clipWallUnavailable, setClipWallUnavailable] = useState(false);
  const handleClipWallUnavailable = useCallback(() => setClipWallUnavailable(true), []);

  // Dedicated Verification-Pending Screen State
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState(''); // '' | 'sending' | 'sent' | 'error'
  const [resendMessage, setResendMessage] = useState('');

  // Keep mode in sync if initialMode prop changes (e.g. returning from email verification)
  useEffect(() => {
    setMode(normalizeMode(initialMode));
  }, [initialMode]);

  // Resend cooldown timer (60s)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail || resendCooldown > 0 || resendStatus === 'sending') return;
    setResendStatus('sending');
    setResendMessage('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingVerificationEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setResendStatus('sent');
        setResendMessage(data.message || 'A new verification link has been sent to your email.');
        setResendCooldown(60);
      } else {
        setResendStatus('error');
        setResendMessage(data.error || data.message || 'Failed to resend verification email.');
        if (data.retryAfter) {
          setResendCooldown(Number(data.retryAfter) || 60);
        }
      }
    } catch {
      setResendStatus('error');
      setResendMessage('Network error. Please check your connection and try again.');
    }
  };

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
      // Right password, unverified email: show the verification-pending screen (a link was just sent)
      if (res.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
        setNoticeMsg(data.error || 'Please verify your email address to log in.');
        setPendingVerificationEmail(data.email || email.trim());
        setResendCooldown(data.verificationSent ? 60 : 0);
        setResendStatus('');
        setResendMessage('');
        return;
      }
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      // Handle unverified signup response (replaces registration form with verification-pending screen)
      if (data.status === 'pending_verification') {
        setNoticeMsg(data.message || "We've sent a verification link to your email address. Verify your email to continue.");
        setPendingVerificationEmail(email.trim());
        setResendCooldown(60);
        setResendStatus('');
        setResendMessage('');
        return;
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
    setTimeout(() => setGoogleNotice(false), 4500);
  };

  // Emails a single-use reset link; the answer is the same whether or not the account exists
  const handleForgotPassword = async () => {
    setErrorMsg('');
    setNoticeMsg('');
    if (!email || !email.includes('@')) {
      setErrorMsg('Enter your email address above, then click "Forgot password?" again.');
      return;
    }
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send a reset link. Please try again.');
      setNoticeMsg(data.message);
    } catch (err) {
      setErrorMsg(err.message || 'Could not send a reset link. Please try again.');
    }
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
        backgroundColor: '#0A0A09',
        color: 'var(--cc-text-1)',
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
          max-width: 420px;
          margin-left: auto !important;
          margin-right: 0 !important;
          background-color: color-mix(in srgb, var(--cc-surface) 82%, transparent);
          backdrop-filter: blur(24px) saturate(140%);
          -webkit-backdrop-filter: blur(24px) saturate(140%);
          border: 1px solid var(--cc-line-2);
          border-radius: var(--cc-radius-lg);
          padding: 28px;
          box-sizing: border-box;
          box-shadow: var(--cc-shadow-modal), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .auth-panel-title {
          font-family: var(--cc-font-display);
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.025em;
          color: var(--cc-text-1);
          margin: 0 0 6px;
        }
        .auth-panel-subtitle {
          font-size: 14px;
          color: var(--cc-text-2);
          margin: 0;
          line-height: 1.45;
        }
        .auth-input::placeholder { color: var(--cc-text-4); }

        .auth-showcase-caption {
          position: fixed;
          bottom: clamp(48px, 8vh, 84px);
          left: clamp(32px, 3.8vw, 56px);
          z-index: 20;
          max-width: min(600px, calc(100vw - 560px));
          pointer-events: none;
          user-select: none;
        }
        .auth-showcase-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          font-size: 13px;
          font-weight: 500;
          color: var(--cc-text-2);
        }
        .auth-showcase-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: var(--cc-radius-pill);
          background-color: var(--cc-success);
        }
        .auth-showcase-headline {
          font-family: var(--cc-font-display);
          font-size: clamp(40px, 4.6vw, 68px);
          font-weight: 600;
          line-height: 1.02;
          letter-spacing: -0.035em;
          color: var(--cc-text-1);
          margin: 0 0 18px;
          text-wrap: balance;
        }
        .auth-showcase-sub {
          font-size: clamp(15px, 1.15vw, 17px);
          line-height: 1.5;
          color: var(--cc-text-2);
          margin: 0 0 22px;
          max-width: 460px;
        }
        .auth-showcase-audiences {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 0;
          padding: 0;
        }
        .auth-showcase-audiences li {
          padding: 6px 12px;
          border-radius: var(--cc-radius-pill);
          border: 1px solid var(--cc-line-3);
          background-color: color-mix(in srgb, var(--cc-bg) 55%, transparent);
          font-size: 12px;
          font-weight: 500;
          color: var(--cc-text-1);
        }

        .auth-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          font-size: 14px;
          border-radius: var(--cc-radius-sm);
          border: 1px solid var(--cc-line-2);
          background-color: var(--cc-raised);
          color: var(--cc-text-1);
          outline: none;
          transition: border-color var(--cc-dur-1) var(--cc-ease), box-shadow var(--cc-dur-1) var(--cc-ease), background-color var(--cc-dur-1) var(--cc-ease);
        }
        .auth-input:hover:not(:focus):not(:disabled) {
          border-color: var(--cc-line-3);
        }
        .auth-input:focus {
          border-color: var(--cc-focus);
          box-shadow: 0 0 0 3px var(--cc-action-tint);
        }

        .auth-btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: var(--cc-radius-pill);
          background-color: var(--cc-hover);
          border: 1px solid var(--cc-line-2);
          color: var(--cc-text-1);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color var(--cc-dur-1) var(--cc-ease), border-color var(--cc-dur-1) var(--cc-ease);
        }
        .auth-btn-google:hover {
          background-color: var(--cc-active);
          border-color: var(--cc-line-3);
        }
        .auth-btn-google:focus-visible,
        .auth-btn-primary:focus-visible {
          outline: 2px solid var(--cc-focus);
          outline-offset: 2px;
        }

        .auth-btn-primary {
          width: 100%;
          margin-top: 6px;
          padding: 14px 20px;
          border-radius: 999px;
          background: var(--cc-action);
          color: var(--cc-on-action);
          border: none;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, opacity 0.15s ease;
        }
        .auth-btn-primary:hover:not(:disabled) {
          background: var(--cc-action-hover);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
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
          .auth-showcase-caption {
            left: 32px !important;
            bottom: 32px !important;
            max-width: 360px !important;
          }
        }

        @media (max-width: 900px) {
          .auth-showcase-caption {
            display: none !important;
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

      {/* 1. FULL-SCREEN BACKGROUND: tilted wall of ad clips; the single bundled video is the fallback */}
      {clipWallUnavailable ? (
        <AuthVideoShowcase
          videoSrc="/videos/background-optimized.mp4"
          fallbackVideoSrc="/videos/background.mp4"
          posterSrc="/videos/background-poster.jpg"
        />
      ) : (
        <AuthClipWall onUnavailable={handleClipWallUnavailable} />
      )}

      {/* 2. INDEPENDENT CLEVERCUT LOGO: Floats in the top-left directly over full-screen video */}
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
        <BrandMark size={42} style={{ boxShadow: '0 8px 24px -2px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(244, 244, 236, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.06)' }} />
        <span
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.025em',
            color: '#FFFFFF',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.85)',
          }}
        >
          CleverCut
        </span>
      </div>

      {/* 3. SHOWCASE EDITORIAL CAPTION: Anchored in bottom-left over the background video */}
      <div className="auth-showcase-caption">
        <div className="auth-showcase-eyebrow">
          <span className="auth-showcase-eyebrow-dot" aria-hidden="true" />
          <span>End-to-end AI ad production</span>
        </div>

        <h2 className="auth-showcase-headline">From one brief to a finished commercial.</h2>

        <p className="auth-showcase-sub">
          Strategy, script, scenes and final film in one flow. Not a pile of clips to stitch together.
        </p>

        <ul className="auth-showcase-audiences" aria-label="Built for">
          <li>Growing businesses</li>
          <li>Enterprise brands</li>
          <li>Agencies</li>
        </ul>
      </div>

      {/* 4. FLOATING AUTHENTICATION PANEL: Anchored firmly on the RIGHT side of the viewport */}
      <div className="auth-floating-wrapper">
        <div className="auth-floating-panel">
          {/* Dedicated Verification-Pending Screen */}
          {pendingVerificationEmail ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(244, 244, 236, 0.2) 0%, rgba(244, 244, 236, 0.2) 100%)',
                  border: '1px solid rgba(244, 244, 236, 0.315)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.4)',
                }}
              >
                <Mail size={28} color="var(--cc-emphasis)" />
              </div>

              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                  color: '#FFFFFF',
                  margin: '0 0 8px',
                }}
              >
                Check your inbox
              </h1>

              <p
                style={{
                  fontSize: 13,
                  color: 'var(--cc-text-2)',
                  margin: '0 0 18px',
                  lineHeight: 1.5,
                }}
              >
                We've sent a verification link to your email address. Verify your email to continue.
              </p>

              {/* Non-editable email badge */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontWeight: 600,
                  color: 'var(--cc-text-1)',
                  fontSize: 13,
                  wordBreak: 'break-all',
                }}
              >
                <Mail size={15} color="var(--cc-emphasis)" style={{ flexShrink: 0 }} />
                <span>{pendingVerificationEmail}</span>
              </div>

              {/* Resend status message */}
              {resendMessage && (
                <div
                  style={{
                    backgroundColor: resendStatus === 'error' ? 'rgba(255, 122, 107, 0.12)' : 'rgba(95, 212, 174, 0.12)',
                    border: resendStatus === 'error' ? '1px solid rgba(255, 122, 107, 0.28)' : '1px solid rgba(95, 212, 174, 0.28)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 14,
                    color: resendStatus === 'error' ? '#FFA79C' : 'var(--cc-success)',
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  {resendMessage}
                </div>
              )}

              {/* Resend button with cooldown */}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || resendStatus === 'sending'}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  background: resendCooldown > 0 ? 'rgba(255, 255, 255, 0.05)' : 'var(--cc-action)',
                  color: resendCooldown > 0 ? 'var(--cc-text-2)' : 'var(--cc-on-action)',
                  border: resendCooldown > 0 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: resendCooldown > 0 || resendStatus === 'sending' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 14,
                  boxShadow: resendCooldown > 0 ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {resendStatus === 'sending' ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Sending...</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <Clock size={14} />
                    <span>Resend email in {resendCooldown}s</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Resend verification link</span>
                  </>
                )}
              </button>

              <p style={{ fontSize: 12, color: 'var(--cc-text-3)', margin: '0 0 18px', lineHeight: 1.5 }}>
                Verification links expire in 30 minutes. If you don't see the email, please check your Spam or Junk folder.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setPendingVerificationEmail('');
                    setResendMessage('');
                    setResendStatus('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--cc-text-2)',
                    fontSize: 12,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Use a different email address
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingVerificationEmail('');
                    setResendMessage('');
                    setResendStatus('');
                    switchMode('signin');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--cc-emphasis)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Already verified? Log In
                </button>
              </div>
            </div>
          ) : (
            <>
          {/* Header: Title & Subtitle */}
          <div style={{ marginBottom: 22 }}>
            <h1 className="auth-panel-title">
              {mode === 'signup' ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="auth-panel-subtitle">
              {mode === 'signup'
                ? 'One brief in. A finished commercial out.'
                : 'Log in to continue creating with CleverCut.'}
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
                backgroundColor: 'rgba(244, 244, 236, 0.05)',
                border: '1px solid rgba(244, 244, 236, 0.225)',
                borderRadius: 10,
                padding: '8px 12px',
                marginTop: 10,
                color: 'var(--cc-text-1)',
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
              color: 'var(--cc-text-3)',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--cc-line-2)' }} />
            <span>Or with email</span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--cc-line-2)' }} />
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(255, 122, 107, 0.12)',
                border: '1px solid rgba(255, 122, 107, 0.28)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                color: '#FFA79C',
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
                backgroundColor: 'rgba(244, 244, 236, 0.06)',
                border: '1px solid rgba(244, 244, 236, 0.252)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 14,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                color: 'var(--cc-text-1)',
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
                    color: 'var(--cc-text-1)',
                    marginBottom: 5,
                  }}
                >
                  Your name
                </label>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
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
                  color: 'var(--cc-text-1)',
                  marginBottom: 5,
                }}
              >
                Email address
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
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
                    color: 'var(--cc-text-1)',
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
                      color: 'var(--cc-emphasis)',
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
                  name="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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
                    color: 'var(--cc-text-2)',
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
                    accentColor: 'var(--cc-action)',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                />
                <label
                  htmlFor="rememberMe"
                  style={{
                    fontSize: 12,
                    color: 'var(--cc-text-2)',
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
              color: 'var(--cc-text-2)',
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
                    color: 'var(--cc-emphasis)',
                    fontWeight: 600,
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
                    color: 'var(--cc-emphasis)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Sign Up
                </button>
              </span>
            )}
          </div>

            </>
          )}

          {/* Terms and Privacy Policy Footnote */}
          <div
            style={{
              marginTop: 22,
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--cc-text-3)',
              lineHeight: 1.45,
            }}
          >
            By continuing, you agree to CleverCut's{' '}
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
                color: 'var(--cc-text-2)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--cc-emphasis)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--cc-text-2)';
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
                color: 'var(--cc-text-2)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--cc-emphasis)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--cc-text-2)';
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
  );
}
