import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

/**
 * Clean, lightweight contextual help icon (`?`) with hover + click/tap popover.
 * Automatically clamps horizontal position on small viewports and closes on Escape or outside click.
 */
export default function HelpTooltip({
  title,
  body,
  ariaLabel,
  align = 'auto', // 'auto' | 'left' | 'right' | 'center'
  size = 14,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolvedAlign, setResolvedAlign] = useState('center');
  const containerRef = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current);
  }, []);

  const updateAlignment = () => {
    if (align !== 'auto') {
      setResolvedAlign(align);
      return;
    }
    if (!containerRef.current || typeof window === 'undefined') {
      setResolvedAlign('center');
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const vw = window.innerWidth || 1024;
    if (rect.left < 160) setResolvedAlign('left');
    else if (vw - rect.right < 160) setResolvedAlign('right');
    else setResolvedAlign('center');
  };

  const openNow = () => {
    clearTimeout(closeTimerRef.current);
    updateAlignment();
    setIsOpen(true);
  };

  const scheduleClose = () => {
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setIsOpen(false), 140);
  };

  const popoverAlignStyle =
    resolvedAlign === 'left'
      ? { left: 0 }
      : resolvedAlign === 'right'
        ? { right: 0 }
        : { left: '50%', transform: 'translateX(-50%)' };

  return (
    <span
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-label={ariaLabel || title || 'More info'}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) setIsOpen(false);
          else openNow();
        }}
        style={{
          background: 'none',
          border: 'none',
          padding: 2,
          margin: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          color: isOpen ? 'var(--accent-primary)' : 'var(--text-tertiary)',
          cursor: 'pointer',
          transition: 'color 0.15s ease',
        }}
      >
        <HelpCircle size={size} />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            zIndex: 450,
            width: 260,
            maxWidth: 'min(260px, calc(100vw - 32px))',
            padding: '10px 12px',
            borderRadius: 10,
            backgroundColor: '#171A24',
            border: '1px solid var(--border-strong)',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.45)',
            textAlign: 'left',
            fontWeight: 400,
            textTransform: 'none',
            letterSpacing: 'normal',
            lineHeight: 1.45,
            ...popoverAlignStyle,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: title ? 4 : 0 }}>
            {title && (
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                {title}
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Dismiss help"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                padding: 0,
                cursor: 'pointer',
                display: 'inline-flex',
                flexShrink: 0,
              }}
            >
              <X size={12} />
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            {body}
          </div>
        </div>
      )}
    </span>
  );
}
