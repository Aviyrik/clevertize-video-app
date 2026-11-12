import React from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';

/**
 * Lightweight, non-blocking, dismissible contextual feature tip banner.
 */
export default function ContextualTipBanner({
  tipId,
  title,
  body,
  actionLabel,
  onAction,
  onDismiss,
}) {
  if (!title && !body) return null;

  return (
    <div
      data-testid={tipId ? `contextual-tip-${tipId}` : 'contextual-tip'}
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        padding: '10px 14px',
        borderRadius: 10,
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.24)',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: '1 1 240px', minWidth: 0 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: 'rgba(99, 102, 241, 0.16)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          <Sparkles size={13} />
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.45 }}>
          {title && (
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: body ? 1 : 0 }}>
              {title}
            </div>
          )}
          {body && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 11.5 }}>
              {body}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 6,
              backgroundColor: 'rgba(99, 102, 241, 0.16)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: 'var(--accent-primary)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{actionLabel}</span>
            <ArrowRight size={12} />
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={() => onDismiss(tipId)}
            aria-label="Dismiss tip"
            title="Dismiss tip"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
