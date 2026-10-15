import React, { useState } from 'react';
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
} from 'lucide-react';

export default function AccountModal({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onDeleteAccount,
  projectCount = 0,
  businessCount = 0,
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !currentUser) return null;

  const handleClose = () => {
    if (isDeleting) return;
    setShowConfirm(false);
    setConfirmInput('');
    setErrorMsg('');
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
          maxWidth: 480,
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
                CleverCuts Profile
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
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
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
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

          {/* User Profile Card */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                fontSize: 20,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentUser.name || 'CleverCuts Creator'}
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

          {/* Danger Zone: Delete Account */}
          <div
            style={{
              borderRadius: 12,
              border: '1px solid rgba(239, 68, 68, 0.25)',
              backgroundColor: 'rgba(239, 68, 68, 0.04)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444' }}>
              <AlertTriangle size={16} />
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Danger Zone
              </span>
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Delete Account
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Permanently delete your account, saved brand profiles, and all commercial scripts and videos. This action cannot be reversed.
              </p>
            </div>

            {!showConfirm ? (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 14px',
                  borderRadius: 6,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                <Trash2 size={13} />
                <span>Delete Account…</span>
              </button>
            ) : (
              <div
                style={{
                  padding: 14,
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: '#EF4444' }}>
                  To confirm, type <strong style={{ color: '#F87171' }}>DELETE</strong> below:
                </div>

                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Type DELETE"
                  disabled={isDeleting}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    fontFamily: "'JetBrains Mono', monospace",
                    outline: 'none',
                  }}
                  autoFocus
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirm(false);
                      setConfirmInput('');
                    }}
                    disabled={isDeleting}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 6,
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
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
                      padding: '7px 14px',
                      borderRadius: 6,
                      backgroundColor: confirmInput.trim().toUpperCase() === 'DELETE' ? '#DC2626' : 'rgba(220, 38, 38, 0.4)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: confirmInput.trim().toUpperCase() === 'DELETE' && !isDeleting ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: confirmInput.trim().toUpperCase() === 'DELETE' ? '0 2px 8px rgba(220, 38, 38, 0.35)' : 'none',
                    }}
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw size={13} className="icon-spinner" />
                        <span>Deleting…</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={13} />
                        <span>Permanently Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(11, 12, 16, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            onClick={() => {
              handleClose();
              onLogout();
            }}
            disabled={isDeleting}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px',
              borderRadius: 6,
            }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            style={{
              padding: '7px 16px',
              borderRadius: 6,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
