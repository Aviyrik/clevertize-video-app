import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Clock, ShieldAlert, Loader2, Film, Eye, EyeOff, KeyRound } from 'lucide-react';

/**
 * ResetPasswordScreen
 * Handles the emailed link `/reset-password?token=...`: checks the link first, then lets the user choose a
 * new password. The link works once and expires after 30 minutes; an expired or used link can ask for a
 * new one here. On success the user is signed in (the server signs out every other session).
 */
export default function ResetPasswordScreen({ onResetSuccess, onReturnToLogin }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'form' | 'saving' | 'done' | 'expired' | 'used' | 'invalid' | 'error'
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [email, setEmail] = useState('');
  const [newLinkMessage, setNewLinkMessage] = useState('');
  const [isSendingLink, setIsSendingLink] = useState(false);

  // Token kept in memory only; it is removed from the address bar straight away
  const tokenRef = useRef(null);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const queryToken = url.searchParams.get('token');
      if (queryToken && queryToken.trim()) {
        tokenRef.current = queryToken.trim();
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.pathname + (url.search || ''));
      }
    } catch {
      // ignore URL parsing errors
    }
    if (!tokenRef.current) {
      setStatus('invalid');
      return;
    }
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/reset-password/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenRef.current }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.valid) setStatus('form');
        else setStatus(data.code === 'TOKEN_EXPIRED' ? 'expired' : data.code === 'TOKEN_ALREADY_USED' ? 'used' : 'invalid');
      } catch {
        setStatus('error');
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirm) {
      setFormError('The two passwords don\'t match.');
      return;
    }
    setStatus('saving');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenRef.current, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus('done');
        try {
          localStorage.setItem('clevertize_token', data.token);
        } catch {
          // ignore
        }
        setTimeout(() => onResetSuccess && onResetSuccess(data), 1200);
        return;
      }
      if (data.code === 'TOKEN_EXPIRED') setStatus('expired');
      else if (data.code === 'TOKEN_ALREADY_USED') setStatus('used');
      else if (data.code === 'TOKEN_INVALID') setStatus('invalid');
      else {
        setStatus('form');
        setFormError(data.error || 'Unable to reset your password right now. Please try again.');
      }
    } catch {
      setStatus('form');
      setFormError('Network error. Please check your connection and try again.');
    }
  };

  // Expired or used link: send a fresh one (same answer whether or not the account exists)
  const handleSendNewLink = async (e) => {
    e.preventDefault();
    setNewLinkMessage('');
    if (!email.includes('@')) {
      setNewLinkMessage('Please enter the email address you sign in with.');
      return;
    }
    setIsSendingLink(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      setNewLinkMessage(data.message || data.error || 'Please try again.');
    } catch {
      setNewLinkMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSendingLink(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundColor: '#121211',
    color: 'var(--cc-text-1)',
    fontSize: 14,
    boxSizing: 'border-box',
  };
  const primaryButton = {
    width: '100%',
    padding: '12px',
    borderRadius: 999,
    border: 'none',
    backgroundColor: 'var(--cc-action)',
    color: 'var(--cc-on-action)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  };
  const linkButton = { background: 'none', border: 'none', color: 'var(--cc-emphasis)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginTop: 16 };

  const linkProblem = {
    expired: { icon: <Clock size={32} color="var(--cc-warning)" />, title: 'Reset link expired', text: 'Password reset links are valid for 30 minutes. Enter your email to get a new one.' },
    used: { icon: <ShieldAlert size={32} color="var(--cc-warning)" />, title: 'Reset link already used', text: 'Each reset link works once. If you still need to change your password, request a new link.' },
    invalid: { icon: <ShieldAlert size={32} color="#FFA79C" />, title: 'Invalid reset link', text: 'This password reset link is not valid. Request a new link below.' },
    error: { icon: <ShieldAlert size={32} color="#FFA79C" />, title: 'Something went wrong', text: 'We could not check your reset link. Please try again, or request a new link.' },
  }[status];

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
          }}
        >
          <Film size={22} color="#FFFFFF" />
        </div>
        <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em', color: '#FFFFFF' }}>CleverCut</span>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#191917',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: '32px 28px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        {status === 'checking' && (
          <div>
            <Loader2 size={28} color="var(--cc-emphasis)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 14, color: 'var(--cc-text-2)', marginTop: 14 }}>Checking your reset link…</p>
          </div>
        )}

        {(status === 'form' || status === 'saving') && (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <KeyRound size={30} color="var(--cc-emphasis)" />
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: '10px 0 6px', color: '#FFFFFF' }}>Choose a new password</h2>
              <p style={{ fontSize: 13, color: 'var(--cc-text-2)', margin: 0 }}>You'll be signed out on every other device.</p>
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--cc-text-1)', marginBottom: 6 }}>New password</label>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="new-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={inputStyle}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--cc-text-2)', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--cc-text-1)', marginBottom: 6 }}>Confirm new password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirm-password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type it again"
              style={{ ...inputStyle, marginBottom: 14 }}
            />
            {formError && <p style={{ fontSize: 13, color: '#FFA79C', margin: '0 0 12px' }}>{formError}</p>}
            <button type="submit" disabled={status === 'saving'} style={{ ...primaryButton, opacity: status === 'saving' ? 0.7 : 1 }}>
              {status === 'saving' ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        )}

        {status === 'done' && (
          <div>
            <CheckCircle2 size={32} color="var(--cc-success)" />
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '10px 0 6px', color: '#FFFFFF' }}>Password updated</h2>
            <p style={{ fontSize: 14, color: 'var(--cc-text-2)', margin: 0 }}>Signing you in…</p>
          </div>
        )}

        {linkProblem && (
          <div>
            {linkProblem.icon}
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: '10px 0 8px', color: '#FFFFFF' }}>{linkProblem.title}</h2>
            <p style={{ fontSize: 14, color: 'var(--cc-text-2)', margin: '0 0 20px', lineHeight: 1.6 }}>{linkProblem.text}</p>
            <form onSubmit={handleSendNewLink} style={{ textAlign: 'left' }}>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                style={{ ...inputStyle, marginBottom: 10 }}
              />
              <button type="submit" disabled={isSendingLink} style={{ ...primaryButton, opacity: isSendingLink ? 0.7 : 1 }}>
                {isSendingLink ? 'Sending…' : 'Send me a new link'}
              </button>
            </form>
            {newLinkMessage && <p style={{ fontSize: 13, color: 'var(--cc-text-2)', margin: '12px 0 0', lineHeight: 1.5 }}>{newLinkMessage}</p>}
          </div>
        )}

        {status !== 'done' && status !== 'saving' && (
          <button type="button" onClick={() => onReturnToLogin && onReturnToLogin('signin')} style={linkButton}>
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
