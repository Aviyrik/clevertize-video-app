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
  Check,
  Compass,
  ChevronRight,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

const sectionHeadingStyle = {
  margin: 0,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.005em',
  color: 'var(--cc-text-3)',
};

const cardStyle = {
  padding: '12px 14px',
  borderRadius: 'var(--cc-radius-md)',
  backgroundColor: 'var(--cc-raised)',
  border: '1px solid var(--cc-line-1)',
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export default function AccountModal({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onDeleteAccount,
  onUpdateProfile,
  onChangePassword,
  onOpenProjects,
  onOpenBusinesses,
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
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordFields, setPasswordFields] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const fileInputRef = useRef(null);
  const passwordTriggerRef = useRef(null);
  const currentPasswordRef = useRef(null);
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

  const resetPasswordForm = () => {
    setShowPasswordForm(false);
    setPasswordFields({ current: '', next: '', confirm: '' });
    setPasswordError('');
    setShowPasswords(false);
  };

  // The trigger button is re-mounted when the form closes, so focus it after that render
  const restorePasswordFocusRef = useRef(false);
  useEffect(() => {
    if (!showPasswordForm && restorePasswordFocusRef.current) {
      restorePasswordFocusRef.current = false;
      try { passwordTriggerRef.current?.focus(); } catch {}
    }
  }, [showPasswordForm]);

  const handleCancelPasswordForm = () => {
    if (isSavingPassword) return;
    restorePasswordFocusRef.current = true;
    resetPasswordForm();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showConfirm) {
          handleCancelDeleteConfirm();
        } else if (showPasswordForm) {
          handleCancelPasswordForm();
        } else if (!isDeleting) {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, showConfirm, showPasswordForm, isDeleting, isSavingPassword]);

  if (!isOpen || !currentUser) return null;

  const handleClose = () => {
    if (isDeleting || isSavingPassword) return;
    setShowConfirm(false);
    setConfirmInput('');
    setErrorMsg('');
    setSuccessMsg('');
    resetPasswordForm();
    onClose();
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    const { current, next, confirm } = passwordFields;
    if (!current) return setPasswordError('Enter your current password.');
    if (next.length < 6) return setPasswordError('New password must be at least 6 characters.');
    if (next === current) return setPasswordError('Choose a password different from your current one.');
    if (next !== confirm) return setPasswordError('The new passwords don’t match.');
    if (!onChangePassword) return;

    setPasswordError('');
    setIsSavingPassword(true);
    try {
      await onChangePassword({ currentPassword: current, newPassword: next });
      restorePasswordFocusRef.current = true;
      resetPasswordForm();
      setSuccessMsg('Password updated. Other devices have been signed out.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Unable to change your password right now.');
      if (err.code === 'WRONG_PASSWORD') {
        setTimeout(() => { try { currentPasswordRef.current?.select(); } catch {} }, 10);
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const passwordInputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    height: 36,
    backgroundColor: 'var(--cc-surface)',
    border: '1px solid var(--cc-line-2)',
    borderRadius: 'var(--cc-radius-sm)',
    padding: '0 12px',
    fontSize: 13,
    color: 'var(--cc-text-1)',
    fontFamily: 'var(--cc-font-text)',
  };

  const passwordLabelStyle = { fontSize: 12, fontWeight: 500, color: 'var(--cc-text-2)' };

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
          setSuccessMsg('Profile picture updated.');
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

  const goTo = (navigate) => () => {
    handleClose();
    navigate();
  };

  const memberSince = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  const detailLineStyle = {
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  };

  const inlineLinkStyle = {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    transition: 'color var(--cc-dur-1) var(--cc-ease)',
  };

  const StatLink = ({ icon: Icon, label, onClick }) => {
    const content = (
      <>
        <Icon size={12} aria-hidden="true" />
        <span>{label}</span>
        {onClick && <ChevronRight size={12} aria-hidden="true" />}
      </>
    );
    if (!onClick) {
      return <span style={{ ...detailLineStyle, color: 'var(--cc-text-2)' }}>{content}</span>;
    }
    return (
      <button
        type="button"
        onClick={goTo(onClick)}
        style={{ ...inlineLinkStyle, color: 'var(--cc-text-2)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cc-text-1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cc-text-2)'; }}
      >
        {content}
      </button>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-settings-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 10, 9, 0.8)',
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
          backgroundColor: 'var(--cc-surface)',
          border: '1px solid var(--cc-line-2)',
          borderRadius: 'var(--cc-radius-lg)',
          boxShadow: 'var(--cc-shadow-modal)',
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
            borderBottom: '1px solid var(--cc-line-1)',
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
                borderRadius: 'var(--cc-radius-sm)',
                backgroundColor: 'var(--cc-tint)',
                color: 'var(--cc-emphasis)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={16} aria-hidden="true" />
            </div>
            <div>
              <h2 id="account-settings-title" style={{ margin: 0, fontFamily: 'var(--cc-font-display)', fontSize: 16, fontWeight: 600, color: 'var(--cc-text-1)' }}>
                Account settings
              </h2>
              <span style={{ fontSize: 12, color: 'var(--cc-text-3)' }}>
                Manage your profile and sign-in
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
              color: 'var(--cc-text-3)',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              padding: 6,
              borderRadius: 'var(--cc-radius-xs)',
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
                borderRadius: 'var(--cc-radius-sm)',
                backgroundColor: 'var(--cc-danger-tint)',
                color: 'var(--cc-danger)',
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
                borderRadius: 'var(--cc-radius-sm)',
                backgroundColor: 'var(--cc-success-tint)',
                color: 'var(--cc-success)',
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

          {/* Section 1: Personal information */}
          <section aria-labelledby="account-profile-heading" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 id="account-profile-heading" style={sectionHeadingStyle}>
              Personal information
            </h3>
            <div style={{ ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Avatar Upload Button (keyboard-accessible) */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={avatar ? 'Change profile picture' : 'Upload profile picture'}
                  title={`${avatar ? 'Change' : 'Upload'} profile picture (JPG, PNG or WebP, up to 5MB)`}
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
                        border: '2px solid var(--cc-selected-line)',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 68,
                        height: 68,
                        borderRadius: '50%',
                        backgroundColor: 'var(--cc-tint)',
                        color: 'var(--cc-emphasis)',
                        fontFamily: 'var(--cc-font-display)',
                        fontSize: 24,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed var(--cc-line-2)',
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
                      backgroundColor: 'var(--cc-active)',
                      color: 'var(--cc-text-1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--cc-raised)',
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

              {/* User details, photo removal and quick links */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  style={{
                    fontFamily: 'var(--cc-font-display)',
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--cc-text-1)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUser.name || 'CleverCut creator'}
                </div>
                <div style={{ ...detailLineStyle, color: 'var(--cc-text-2)' }}>
                  <Mail size={12} style={{ flexShrink: 0 }} aria-hidden="true" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.email}</span>
                </div>
                <div style={{ ...detailLineStyle, color: 'var(--cc-text-3)' }}>
                  <Calendar size={12} aria-hidden="true" />
                  <span>Joined {memberSince}</span>
                  {avatar && (
                    <>
                      <span aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        aria-label="Remove profile picture"
                        style={{
                          ...inlineLinkStyle,
                          color: 'var(--cc-text-3)',
                          textDecoration: 'underline',
                          textUnderlineOffset: 2,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cc-danger)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cc-text-3)'; }}
                      >
                        Remove photo
                      </button>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
                  <StatLink
                    icon={Film}
                    label={plural(projectCount, 'saved project', 'saved projects')}
                    onClick={onOpenProjects}
                  />
                  <StatLink
                    icon={Building2}
                    label={plural(businessCount, 'brand profile', 'brand profiles')}
                    onClick={onOpenBusinesses}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Product tour */}
          {(onReplayTour || (hasPausedTour && onResumeTour)) && (
            <section aria-labelledby="account-preferences-heading" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 id="account-preferences-heading" style={sectionHeadingStyle}>
                Product tour
              </h3>
              <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--cc-text-3)' }}>
                  A short walkthrough of the studio.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {hasPausedTour && onResumeTour && (
                    <button
                      type="button"
                      className="cc-btn cc-btn--secondary cc-btn--sm"
                      data-testid="account-resume-tour-btn"
                      aria-label={`Resume product tour from step ${pausedTourStep + 1} of ${totalTourSteps}`}
                      onClick={() => {
                        handleClose();
                        onResumeTour();
                      }}
                    >
                      <Compass size={13} aria-hidden="true" />
                      <span>Resume tour (step {pausedTourStep + 1}/{totalTourSteps})</span>
                    </button>
                  )}

                  {onReplayTour && (
                    <button
                      type="button"
                      className="cc-btn cc-btn--ghost cc-btn--sm"
                      data-testid="account-replay-tour-btn"
                      aria-label="Replay guided tour from step 1"
                      onClick={() => {
                        handleClose();
                        onReplayTour();
                      }}
                    >
                      <Compass size={13} aria-hidden="true" />
                      <span>Replay tour</span>
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Section 3: Security & session */}
          <section aria-labelledby="account-auth-heading" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 id="account-auth-heading" style={sectionHeadingStyle}>
              Security &amp; session
            </h3>
            <div style={{ ...cardStyle, padding: 0 }}>
            {onChangePassword && (
              <div data-testid="account-password-row" style={{ padding: '12px 14px', borderBottom: '1px solid var(--cc-line-1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cc-text-1)' }}>
                      Password
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--cc-text-3)', marginTop: 2 }}>
                      Changing it signs you out on your other devices.
                    </div>
                  </div>
                  {!showPasswordForm && (
                    <button
                      ref={passwordTriggerRef}
                      type="button"
                      className="cc-btn cc-btn--secondary cc-btn--sm"
                      data-testid="change-password-trigger"
                      aria-expanded={showPasswordForm}
                      aria-controls="change-password-form"
                      onClick={() => {
                        setSuccessMsg('');
                        setShowPasswordForm(true);
                        setTimeout(() => { try { currentPasswordRef.current?.focus(); } catch {} }, 20);
                      }}
                    >
                      <KeyRound size={13} aria-hidden="true" />
                      <span>Change password</span>
                    </button>
                  )}
                </div>

                {showPasswordForm && (
                  <form
                    id="change-password-form"
                    data-testid="change-password-form"
                    onSubmit={handleSubmitPassword}
                    noValidate
                    style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}
                  >
                    {/* Lets password managers link the new password to this account */}
                    <input type="text" name="username" autoComplete="username" value={currentUser.email || ''} readOnly hidden />

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={passwordLabelStyle}>Current password</span>
                      <input
                        ref={currentPasswordRef}
                        type={showPasswords ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={passwordFields.current}
                        onChange={(e) => setPasswordFields((p) => ({ ...p, current: e.target.value }))}
                        disabled={isSavingPassword}
                        style={passwordInputStyle}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={passwordLabelStyle}>New password</span>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        value={passwordFields.next}
                        onChange={(e) => setPasswordFields((p) => ({ ...p, next: e.target.value }))}
                        disabled={isSavingPassword}
                        style={passwordInputStyle}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={passwordLabelStyle}>Confirm new password</span>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={passwordFields.confirm}
                        onChange={(e) => setPasswordFields((p) => ({ ...p, confirm: e.target.value }))}
                        disabled={isSavingPassword}
                        style={passwordInputStyle}
                      />
                    </label>

                    {passwordError && (
                      <div role="alert" data-testid="change-password-error" style={{ fontSize: 12, color: 'var(--cc-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={13} aria-hidden="true" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setShowPasswords((v) => !v)}
                        aria-pressed={showPasswords}
                        style={{ ...inlineLinkStyle, color: 'var(--cc-text-3)' }}
                      >
                        {showPasswords ? <EyeOff size={13} aria-hidden="true" /> : <Eye size={13} aria-hidden="true" />}
                        <span>{showPasswords ? 'Hide passwords' : 'Show passwords'}</span>
                      </button>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="cc-btn cc-btn--ghost cc-btn--sm"
                          onClick={handleCancelPasswordForm}
                          disabled={isSavingPassword}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="cc-btn cc-btn--secondary cc-btn--sm"
                          data-testid="change-password-submit"
                          disabled={isSavingPassword}
                        >
                          {isSavingPassword ? (
                            <>
                              <RefreshCw size={12} className="icon-spinner" aria-hidden="true" />
                              <span>Updating…</span>
                            </>
                          ) : (
                            <span>Update password</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cc-text-1)' }}>
                  Active session
                </div>
                <div style={{ fontSize: 12, color: 'var(--cc-text-3)', marginTop: 2 }}>
                  Sign out of this browser. Projects and brands stay saved.
                </div>
              </div>
              <button
                type="button"
                className="cc-btn cc-btn--secondary cc-btn--sm"
                aria-label="Sign out of CleverCut"
                onClick={() => {
                  handleClose();
                  if (onLogout) onLogout();
                }}
              >
                <LogOut size={13} aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
            </div>
          </section>

          {/* Section 4: Danger zone — permanent and irreversible actions */}
          <section
            aria-labelledby="danger-zone-heading"
            data-testid="account-danger-zone"
            style={{
              padding: 14,
              borderRadius: 'var(--cc-radius-md)',
              backgroundColor: 'rgba(255, 122, 107, 0.04)',
              border: '1px solid rgba(255, 122, 107, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} style={{ color: 'var(--cc-danger)' }} aria-hidden="true" />
              <h3 id="danger-zone-heading" style={{ ...sectionHeadingStyle, color: 'var(--cc-danger)' }}>
                Danger zone
              </h3>
            </div>

            {!showConfirm ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: '1 1 220px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cc-text-1)' }}>
                    Delete account
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--cc-text-2)', marginTop: 2, lineHeight: 1.45 }}>
                    Permanently erases your CleverCut profile, all brand profiles, saved scripts, and generated videos. This cannot be undone.
                  </div>
                </div>

                <button
                  ref={deleteTriggerRef}
                  type="button"
                  className="cc-btn cc-btn--danger cc-btn--sm"
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
                  style={{ flexShrink: 0 }}
                >
                  <Trash2 size={13} aria-hidden="true" />
                  <span>Delete account…</span>
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
                  borderRadius: 'var(--cc-radius-sm)',
                  backgroundColor: 'var(--cc-danger-tint)',
                  border: '1px solid rgba(255, 122, 107, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div>
                  <div id="delete-account-confirm-title" style={{ fontSize: 13, fontWeight: 600, color: 'var(--cc-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} aria-hidden="true" />
                    <span>Confirm permanent account deletion</span>
                  </div>
                  <div id="delete-account-confirm-desc" style={{ fontSize: 12, color: 'var(--cc-text-2)', marginTop: 4, lineHeight: 1.45 }}>
                    This will sign you out and permanently remove {plural(projectCount, 'project', 'projects')} and {plural(businessCount, 'brand profile', 'brand profiles')}.
                  </div>
                </div>

                <label htmlFor="account-delete-confirm-input" style={{ fontSize: 12, fontWeight: 600, color: 'var(--cc-danger)' }}>
                  To confirm, type <strong>DELETE</strong> below:
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
                    backgroundColor: 'var(--cc-raised)',
                    border: '1px solid var(--cc-line-2)',
                    borderRadius: 'var(--cc-radius-xs)',
                    padding: '7px 10px',
                    fontSize: 12,
                    color: 'var(--cc-text-1)',
                    fontFamily: 'var(--cc-font-mono)',
                    outline: 'none',
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="cc-btn cc-btn--secondary cc-btn--sm"
                    data-testid="delete-account-cancel-btn"
                    onClick={handleCancelDeleteConfirm}
                    disabled={isDeleting}
                  >
                    Keep my account
                  </button>

                  <button
                    type="button"
                    className="cc-btn cc-btn--sm"
                    data-testid="delete-account-confirm-btn"
                    onClick={handleConfirmDelete}
                    disabled={confirmInput.trim().toUpperCase() !== 'DELETE' || isDeleting}
                    style={{ backgroundColor: 'var(--cc-danger)', color: 'var(--cc-bg)', fontWeight: 600 }}
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw size={12} className="icon-spinner" aria-hidden="true" />
                        <span>Deleting…</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={12} aria-hidden="true" />
                        <span>Delete account permanently</span>
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
            borderTop: '1px solid var(--cc-line-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            className="cc-btn cc-btn--primary cc-btn--sm"
            onClick={handleClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
