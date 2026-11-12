import React, { useEffect } from 'react';
import { X, Zap, Sliders, CheckCircle2, AlertTriangle, Edit3, ArrowRight } from 'lucide-react';

/**
 * Confirmation & plain-language explanation modal when switching modes mid-project.
 * Clearly distinguishes saved items, pending unadded text, and any downstream items that won't transfer.
 */
export default function ModeSwitchModal({
  isOpen,
  targetMode = 'advanced', // 'simple' | 'advanced'
  savedItems = [],
  pendingItems = [],
  uncarriedItems = [],
  preservedItems = [], // fallback compatibility if savedItems not explicitly passed
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen || !onCancel) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const switchingToDirector = targetMode !== 'simple';
  const resolvedSaved = savedItems.length > 0 ? savedItems : preservedItems;

  return (
    <div
      data-testid="mode-switch-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-switch-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 10, 9, 0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) onCancel();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: 'min(90vh, 680px)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 14,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
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
                backgroundColor: switchingToDirector ? 'rgba(244, 244, 236, 0.07)' : 'rgba(244, 244, 236, 0.07)',
                color: switchingToDirector ? 'var(--cc-emphasis)' : 'var(--cc-emphasis)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {switchingToDirector ? <Sliders size={16} /> : <Zap size={16} />}
            </div>
            <h2 id="mode-switch-modal-title" style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {switchingToDirector ? 'Switch to Director Mode?' : 'Switch to Simple Mode?'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: 4,
              display: 'inline-flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {switchingToDirector
              ? 'Adds AI Understanding review, custom ideas, hooks, and scene editing.'
              : 'Uses a 3-step flow: offer details, 1 of 3 script picks, and video output.'}
          </p>

          {resolvedSaved.length > 0 && (
            <div
              data-testid="mode-switch-saved-items"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '11px 14px',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--success)', marginBottom: 7 }}>
                Carried over
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {resolvedSaved.map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-primary)' }}>
                    <CheckCircle2 size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingItems.length > 0 && (
            <div
              data-testid="mode-switch-pending-items"
              style={{
                backgroundColor: 'rgba(244, 244, 236, 0.04)',
                border: '1px solid rgba(244, 244, 236, 0.225)',
                borderRadius: 10,
                padding: '11px 14px',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--cc-emphasis)', marginBottom: 7 }}>
                Draft text preserved
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {pendingItems.map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-primary)' }}>
                    <Edit3 size={13} style={{ color: 'var(--cc-emphasis)', flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uncarriedItems.length > 0 && (
            <div
              data-testid="mode-switch-uncarried-items"
              style={{
                backgroundColor: 'rgba(242, 184, 75, 0.08)',
                border: '1px solid rgba(242, 184, 75, 0.3)',
                borderRadius: 10,
                padding: '11px 14px',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--cc-warning)', marginBottom: 7 }}>
                Not carried over
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {uncarriedItems.map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <AlertTriangle size={13} style={{ color: 'var(--cc-warning)', flexShrink: 0, marginTop: 2 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              backgroundColor: 'transparent',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-mode-switch-btn"
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: switchingToDirector ? 'var(--cc-action)' : 'var(--cc-action)',
              border: 'none',
              color: 'var(--cc-on-action)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{switchingToDirector ? 'Switch to Director Mode' : 'Switch to Simple Mode'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
