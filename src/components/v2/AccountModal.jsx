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
} from 'lucide-react';

export default function AccountModal({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onDeleteAccount,
  onUpdateProfile,
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

  useEffect(() => {
    if (currentUser?.avatar !== undefined) {
      setAvatar(currentUser.avatar || null);
    }
  }, [currentUser?.avatar]);

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
          maxWidth: 490,
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
              <User size={16} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Account Settings
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                CleverCut Profile & Preferences
              </span>
            </div>
          </div>

          <button
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
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
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
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* User Profile & Avatar Card */}
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
              {/* Avatar with Upload Badge */}
              <div
                style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to change profile picture"
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

                {/* Camera Overlay Icon Badge */}
                <div
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
                  }}
                  title="Upload profile picture"
                >
                  <Camera size={12} />
                </div>

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
                <span>{avatar ? 'Change Profile Picture' : 'Upload Profile Picture'}</span>
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

          {/* Subtle Compact Delete Account Row */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 16,
              marginTop: 4,
            }}
          >
            {!showConfirm ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Delete Account
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    Permanently delete your profile and saved videos.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-default)',
                    color: '#EF4444',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                    e.currentTarget.style.borderColor = '#EF4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}
                >
                  <Trash2 size={12} />
                  <span>Delete Account…</span>
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: '#EF4444' }}>
                  To confirm, type <strong style={{ color: '#F87171' }}>DELETE</strong> below:
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="Type DELETE"
                    disabled={isDeleting}
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontFamily: "'JetBrains Mono', monospace",
                      outline: 'none',
                    }}
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirm(false);
                      setConfirmInput('');
                    }}
                    disabled={isDeleting}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={confirmInput.trim().toUpperCase() !== 'DELETE' || isDeleting}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      backgroundColor: confirmInput.trim().toUpperCase() === 'DELETE' ? '#DC2626' : 'rgba(220, 38, 38, 0.4)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: confirmInput.trim().toUpperCase() === 'DELETE' && !isDeleting ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw size={11} className="icon-spinner" />
                        <span>Deleting…</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={11} />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: Logout */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => {
              handleClose();
              if (onLogout) onLogout();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 8px',
              borderRadius: 6,
              transition: 'color 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#EF4444';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '8px 18px',
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
