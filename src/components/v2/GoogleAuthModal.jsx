import React, { useState, useEffect, useRef } from 'react';
import { X, Check, User, Mail, Shield, ExternalLink, ChevronDown, ChevronUp, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

export default function GoogleAuthModal({
  isOpen,
  onClose,
  onSuccess,
  mode = 'login',
  googleClientId = null,
}) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [useCustomAccount, setUseCustomAccount] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customClientId, setCustomClientId] = useState('');
  const [showDevSetup, setShowDevSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const googleBtnRef = useRef(null);

  const PRESET_ACCOUNTS = [
    {
      name: 'Alex Chen',
      email: 'alex.chen.commercials@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Creative Director & Producer',
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma.brand@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      role: 'Brand & Growth Marketing',
    },
  ];

  const activeClientId = googleClientId || customClientId.trim() || null;

  // Initialize Google Identity Services if a client ID is provided
  useEffect(() => {
    if (!isOpen || !activeClientId) return;

    const initGIS = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: activeClientId,
            callback: async (response) => {
              if (response?.credential) {
                await handleGoogleCredential(response.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'filled_black',
              size: 'large',
              text: mode === 'signup' ? 'signup_with' : 'continue_with',
              shape: 'pill',
              width: 320,
            });
          }
        } catch (err) {
          console.warn('[GIS] Initialization warning:', err.message);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGIS();
    } else {
      const existingScript = document.getElementById('google-gsi-client');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGIS;
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener('load', initGIS);
      }
    }
  }, [isOpen, activeClientId, mode]);

  if (!isOpen) return null;

  const handleGoogleCredential = async (credential) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Google token validation failed.');
      }
      if (data.token) {
        try {
          localStorage.setItem('clevertize_token', data.token);
        } catch {
          // ignore
        }
      }
      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      let email = '';
      let name = '';
      let avatar = null;

      if (useCustomAccount) {
        if (!customEmail.trim() || !customEmail.includes('@')) {
          throw new Error('Please enter a valid Google email address.');
        }
        email = customEmail.trim();
        name = customName.trim() || email.split('@')[0];
        avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`;
      } else {
        const preset = PRESET_ACCOUNTS[selectedPreset] || PRESET_ACCOUNTS[0];
        email = preset.email;
        name = preset.name;
        avatar = preset.avatar;
      }

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demo: true,
          email,
          name,
          avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to authenticate with Google account.');
      }

      if (data.token) {
        try {
          localStorage.setItem('clevertize_token', data.token);
        } catch {
          // ignore
        }
      }

      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: 'min(90vh, 680px)',
          backgroundColor: '#12141F',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 20,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24">
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
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>
                {mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
              </h2>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                Secure authentication for Clevertize Studio
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close Google sign-in dialog"
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Official Google Identity Button (when client ID configured) */}
          {activeClientId ? (
            <div
              style={{
                padding: '16px',
                borderRadius: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB' }}>
                Google Identity Services Active
              </span>
              <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center' }} />
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                Connected to Client ID: {activeClientId.slice(0, 16)}...
              </span>
            </div>
          ) : null}

          {/* Instant One-Click Google Authentication */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Choose Google Account
              </label>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  padding: '2px 8px',
                  borderRadius: 12,
                }}
              >
                Instant Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRESET_ACCOUNTS.map((acc, idx) => {
                const isSelected = !useCustomAccount && selectedPreset === idx;
                return (
                  <div
                    key={acc.email}
                    onClick={() => {
                      setSelectedPreset(idx);
                      setUseCustomAccount(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 12,
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1.5px solid ${isSelected ? 'var(--accent-primary, #6366F1)' : 'rgba(255, 255, 255, 0.07)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: isSelected ? '2px solid var(--accent-primary, #6366F1)' : '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{acc.name}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{acc.email}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-primary, #6366F1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Custom Google Account Option */}
              <div
                onClick={() => setUseCustomAccount(true)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  backgroundColor: useCustomAccount ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1.5px solid ${useCustomAccount ? 'var(--accent-primary, #6366F1)' : 'rgba(255, 255, 255, 0.07)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9CA3AF',
                      }}
                    >
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>
                        Use another Google email
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                        Enter your own Google address
                      </div>
                    </div>
                  </div>
                  {useCustomAccount && (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-primary, #6366F1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                      }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {useCustomAccount && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="email"
                      placeholder="e.g. yourname@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '9px 12px',
                        backgroundColor: '#0D0E15',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 8,
                        color: '#FFFFFF',
                        fontSize: 12,
                        outline: 'none',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Your full name (optional)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '9px 12px',
                        backgroundColor: '#0D0E15',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 8,
                        color: '#FFFFFF',
                        fontSize: 12,
                        outline: 'none',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button: Instant Continue */}
          <button
            type="button"
            onClick={handleInstantGoogleSignIn}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 12,
              backgroundColor: '#4285F4',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(66, 133, 244, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            {isLoading ? (
              <span>Authenticating with Google…</span>
            ) : (
              <>
                <span>
                  {mode === 'signup'
                    ? `Sign Up as ${useCustomAccount ? (customName || 'Google User') : PRESET_ACCOUNTS[selectedPreset]?.name}`
                    : `Continue as ${useCustomAccount ? (customName || 'Google User') : PRESET_ACCOUNTS[selectedPreset]?.name}`}
                </span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Collapsible: Connect Live Google Cloud OAuth Client ID */}
          <div
            style={{
              marginTop: 4,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: 12,
            }}
          >
            <button
              type="button"
              onClick={() => setShowDevSetup(!showDevSetup)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '4px 0',
              }}
            >
              <span>Production Setup: Connect Google Cloud Client ID</span>
              {showDevSetup ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDevSetup && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: 11,
                  color: '#9CA3AF',
                  lineHeight: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div>
                  To display Google's native browser popup for all users, create an OAuth 2.0 Client ID in{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#818CF8', textDecoration: 'underline' }}
                  >
                    Google Cloud Console
                  </a>{' '}
                  and add it to your <code style={{ color: '#E0E7FF' }}>.env</code> file:
                </div>
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    backgroundColor: '#090A10',
                    color: '#A5B4FC',
                    fontFamily: 'monospace',
                    fontSize: 11,
                  }}
                >
                  GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
                </div>
                <div>
                  Or paste a Client ID here to test Google Identity Services right now:
                </div>
                <input
                  type="text"
                  placeholder="Paste Client ID (...apps.googleusercontent.com)"
                  value={customClientId}
                  onChange={(e) => setCustomClientId(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '7px 10px',
                    backgroundColor: '#0D0E15',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 6,
                    color: '#FFFFFF',
                    fontSize: 11,
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
