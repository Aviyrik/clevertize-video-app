import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Lightweight, accessible disclosure wrapper for secondary/optional Brief fields.
 * Exposes expanded state, non-color populated indicators, and optional controlled expansion.
 */
export default function OptionalFieldDisclosure({
  id,
  icon: Icon = null,
  title,
  description = '',
  isPopulated = false,
  populatedLabel = 'Added',
  emptyLabel = 'Optional · Not added',
  defaultExpanded = false,
  expanded,
  onToggleExpand,
  testId,
  children,
}) {
  const [localExpanded, setLocalExpanded] = useState(Boolean(defaultExpanded));
  const isExpanded = typeof expanded === 'boolean' ? expanded : localExpanded;

  const handleToggle = () => {
    const next = !isExpanded;
    if (typeof onToggleExpand === 'function') {
      onToggleExpand(next);
    } else {
      setLocalExpanded(next);
    }
  };

  const panelId = `${id || 'optional-section'}-panel`;

  return (
    <div
      data-testid={testId}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
      }}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        style={{
          width: '100%',
          padding: '11px 16px',
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {isExpanded ? (
            <ChevronDown size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
          ) : (
            <ChevronRight size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
          )}
          {Icon && (
            <Icon
              size={14}
              style={{ color: isPopulated ? 'var(--accent-primary)' : 'var(--text-tertiary)', flexShrink: 0 }}
              aria-hidden="true"
            />
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {title}
            </span>
            {description && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                {description}
              </span>
            )}
          </div>
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: isPopulated ? 600 : 500,
            padding: isPopulated ? '2px 8px' : '2px 6px',
            borderRadius: 12,
            backgroundColor: isPopulated ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
            color: isPopulated ? 'var(--accent-primary)' : 'var(--text-tertiary)',
            border: isPopulated ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {isPopulated ? `✓ ${populatedLabel}` : emptyLabel}
        </span>
      </button>

      {isExpanded && (
        <div
          id={panelId}
          style={{
            padding: '12px 16px 16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
