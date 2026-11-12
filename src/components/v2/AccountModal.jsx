import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  Film,
  Building2,
  AlertTriangle,
  Trash2,
  LogOut,
  RefreshCw,
  Camera,
  Upload,
  Check,
  MessageSquare,
  Compass,
} from 'lucide-react';

export default function AccountModal({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onDeleteAccount,
  onUpdateProfile,
  onOpenFeedback,
  onReplayTour,
  onResumeTour,
  hasPausedTour = false,
  pausedTourStep = 0,
  totalTourSteps = 5,
  projectCount = 0,
  businessCount = 0,
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [avatar, setAvatar] = useState(currentUser?.avatar || null);
  const fileInputRef = useRef(null);
  const previousFocusRef = useRef(null);
  const closeButtonRef = useRef(null);
  const deleteTriggerRef = useRef(null);
  const deleteInputRef = useRef(null);

  useEffect(() => {
    if (currentUser?.avatar !== undefined) {
      setAvatar(currentUser.avatar || null);
    }
  }, [currentUser?.avatar]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = typeof document !== 'undefined' ? document.activeElement : null;
      const timer = setTimeout(() => {
        if (closeButtonRef.current && typeof closeButtonRef.current.focus === 'function') {
          try { closeButtonRef.current.focus(); } catch {}
        }
      }, 20);
      return () => clearTimeout(timer);
    } else if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      try { previousFocusRef.current.focus(); } catch {}
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  const handleCancelDeleteConfirm = () => {
    if (isDeleting) return;
    setShowConfirm(false);
    setConfirmInput('');
    setTimeout(() => {
      if (deleteTriggerRef.current && typeof deleteTriggerRef.current.focus === 'function') {
        try { deleteTriggerRef.current.focus(); } catch {}
      }
    }, 10);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showConfirm) {
          handleCancelDeleteConfirm();
        } else if (!isDeleting) {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, showConfirm, isDeleting]);

  if (!isOpen || !currentUser) return null;

  const handleClose = () => {
    if (isDeleting) return;
    setShowConfirm(false);
    setConfirmInput('');
    setErrorMsg('');
    setSuccessMsg('');
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (confirmInput.trim().toUpperCase() !== 'DELETE') return;
    setIsDeleting(true);
    setErrorMsg('');

    try {
      await onDeleteAccount();
      handleClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Profile photo must be less than 5MB.');
      return;
    }

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setAvatar(dataUrl);
      if (onUpdateProfile) {
        try {
          await onUpdateProfile({ avatar: dataUrl });
          setSuccessMsg('Profile picture updated successfully!');
          setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
          setErrorMsg('Failed to save profile picture.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onUpdateProfile) {
      try {
        await onUpdateProfile({ avatar: null });
        setSuccessMsg('Profile picture removed.');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        setErrorMsg('Failed to update profile.');
      }
    }
  };

  const memberSince = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-settings-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          maxHeight: 'min(90vh, 720px)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
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
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={16} aria-hidden="true" />
            </div>
            <div>
              <h2 id="account-settings-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Account Settings
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                Profile, authentication, tour &amp; data controls
              </span>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            aria-label="Close account settings"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
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

        {/* Content Body */}
        <div
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {errorMsg && (
            <div
              role="alert"
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              aria-live="polite"
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10B981',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Check size={16} aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Personal & Account Information */}
          <section aria-labelledby="account-profile-heading" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 id="account-profile-heading" style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
              Personal Information
            </h3>
          <div
            style={{
              padding: 18,
              borderRadius: 12,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Avatar Upload Button (keyboard-accessible) */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={avatar ? 'Change profile picture' : 'Upload profile picture'}
                  title="Click to change profile picture"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    borderRadius: '50%',
                    display: 'block',
                  }}
                >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={currentUser.name || 'Profile'}
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--accent-primary)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)',
                      fontSize: 24,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed var(--border-default)',
                    }}
                  >
                    {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                  </div>
                )}

                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                    border: '2px solid var(--bg-surface)',
                    pointerEvents: 'none',
                  }}
                >
                  <Camera size={12} />
                </div>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* User Details & Photo Actions */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUser.name || 'CleverCut Creator'}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <Mail size={12} style={{ flexShrink: 0 }} />
                  <span>{currentUser.email}</span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Calendar size={11} />
                  <span>Joined {memberSince}</span>
                </div>
              </div>
            </div>

            {/* Profile Picture Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingTop: 12,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                <Upload size={13} />
                <span>{avatar ? 'Replace Photo' : 'Upload Photo'}</span>
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-tertiary)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#EF4444';
                    e.currentTarget.style.color = '#EF4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-tertiary)';
                  }}
                >
                  <Trash2 size={12} />
                  <span>Remove</span>
                </button>
              )}

              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                JPG, PNG, or WebP up to 5MB
              </span>
            </div>
          </div>

          {/* Usage Stats Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Film size={16} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {projectCount}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Saved Projects</div>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={16} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {businessCount}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Brand Profiles</div>
              </div>
            </div>
          </div>
          </section>

          {/* Section 2: Preferences & Guidance */}
          {(onReplayTour || onResumeTour || onOpenFeedback) && (
            <section aria-labelledby="account-preferences-heading" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 id="account-preferences-heading" style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
                Preferences &amp; Walkthrough
              </h3>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {hasPausedTour && onResumeTour && (
                  <button
                    type="button"
                    data-testid="account-resume-tour-btn"
                    aria-label={`Resume product tour from Step ${pausedTourStep + 1} of ${totalTourSteps}`}
                    onClick={() => {
                      handleClose();
                      onResumeTour();
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      backgroundColor: 'rgba(99, 102, 241, 0.14)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      color: 'var(--accent-primary)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Compass size={13} aria-hidden="true" />
                    <span>Resume Tour (Step {pausedTourStep + 1}/{totalTourSteps})</span>
                  </button>
                )}

                {onReplayTour && (
                  <button
                    type="button"
                    data-testid="account-replay-tour-btn"
                    aria-label="Replay Guided Tour from Step 1"
                    onClick={() => {
                      handleClose();
                      onReplayTour();
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Compass size={13} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                    <span>Replay Tour</span>
                  </button>
                )}

                {onOpenFeedback && (
                  <button
                    type="button"
                    aria-label="Send Feedback"
                    onClick={() => {
                      handleClose();
                      onOpenFeedback();
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <MessageSquare size={13} style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
                    <span>Send Feedback</span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Section 3: Authentication & Session */}
          <section aria-labelledby="account-auth-heading" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 id="account-auth-heading" style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
              Security &amp; Session
            </h3>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Active Session
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  Sign out of this browser. Projects and brands stay saved.
                </div>
              </div>
              <button
                type="button"
                aria-label="Sign out of CleverCut"
                onClick={() => {
                  handleClose();
                  if (onLogout) onLogout();
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <LogOut size={13} aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          </section>

          {/* Section 4: Danger Zone — Permanent & Irreversible Actions */}
          <section
            aria-labelledby="danger-zone-heading"
            data-testid="account-danger-zone"
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: 'rgba(239, 68, 68, 0.04)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} style={{ color: '#EF4444' }} aria-hidden="true" />
              <h3 id="danger-zone-heading" style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#EF4444' }}>
                Danger Zone · Permanent &amp; Irreversible
              </h3>
            </div>

            {!showConfirm ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: '1 1 220px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Delete Account Permanently
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.45 }}>
                    Permanently erases your CleverCut profile, all brand profiles, saved scripts, and generated videos. This cannot be undone.
                  </div>
                </div>

                <button
                  ref={deleteTriggerRef}
                  type="button"
                  data-testid="delete-account-trigger"
                  aria-expanded={showConfirm}
                  aria-label="Delete account permanently — opens confirmation"
                  onClick={() => {
                    setShowConfirm(true);
                    setTimeout(() => {
                      if (deleteInputRef.current && typeof deleteInputRef.current.focus === 'function') {
                        try { deleteInputRef.current.focus(); } catch {}
                      }
                    }, 20);
                  }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 7,
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    color: '#EF4444',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={13} aria-hidden="true" />
                  <span>Delete Account…</span>
                </button>
              </div>
            ) : (
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-account-confirm-title"
                aria-describedby="delete-account-confirm-desc"
                data-testid="delete-account-confirm-panel"
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div>
                  <div id="delete-account-confirm-title" style={{ fontSize: 12.5, fontWeight: 800, color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} aria-hidden="true" />
                    <span>Confirm permanent account deletion</span>
                  </div>
                  <div id="delete-account-confirm-desc" style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
                    This irreversible action will immediately sign you out and permanently remove all {projectCount} project(s) and {businessCount} brand profile(s).
                  </div>
                </div>

                <label htmlFor="account-delete-confirm-input" style={{ fontSize: 11.5, fontWeight: 600, color: '#FCA5A5' }}>
                  To confirm permanent deletion, type <strong>DELETE</strong> below:
                </label>

                <input
                  id="account-delete-confirm-input"
                  ref={deleteInputRef}
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  disabled={isDeleting}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 6,
                    padding: '7px 10px',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    fontFamily: "'JetBrains Mono', monospace",
                    outline: 'none',
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    data-testid="delete-account-cancel-btn"
                    onClick={handleCancelDeleteConfirm}
                    disabled={isDeleting}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancel &amp; Keep Account
                  </button>

                  <button
                    type="button"
                    data-testid="delete-account-confirm-btn"
                    onClick={handleConfirmDelete}
                    disabled={confirmInput.trim().toUpperCase() !== 'DELETE' || isDeleting}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 6,
                      backgroundColor: confirmInput.trim().toUpperCase() === 'DELETE' ? '#DC2626' : 'rgba(220, 38, 38, 0.35)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: confirmInput.trim().toUpperCase() === 'DELETE' && !isDeleting ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw size={12} className="icon-spinner" aria-hidden="true" />
                        <span>Deleting…</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={12} aria-hidden="true" />
                        <span>Permanently Delete Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              backgroundColor: 'var(--accent-primary)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
