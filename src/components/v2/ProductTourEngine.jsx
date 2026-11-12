import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, ArrowLeft, X, Check, RotateCcw, Pause } from 'lucide-react';

/**
 * Config-driven interactive product tour with spotlight cutout and viewport-aware tooltip placement.
 * Gracefully skips steps whose DOM targets are not currently rendered so workflows are never blocked.
 */
export default function ProductTourEngine({
  isOpen = false,
  steps = [],
  currentIndex = 0,
  onStepChange,
  onComplete,
  onSkip,
  onPause,
  onRestart,
  onStepAction,
}) {
  const [targetRect, setTargetRect] = useState(null);
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 720,
  });
  const previousFocusRef = useRef(null);
  const suppressFocusRestoreRef = useRef(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      suppressFocusRestoreRef.current = false;
      previousFocusRef.current = typeof document !== 'undefined' ? document.activeElement : null;
      const t = setTimeout(() => {
        if (tooltipRef.current && typeof tooltipRef.current.focus === 'function') {
          try { tooltipRef.current.focus(); } catch {}
        }
      }, 25);
      return () => clearTimeout(t);
    } else if (!suppressFocusRestoreRef.current && previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      try { previousFocusRef.current.focus(); } catch {}
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  const findNextAvailableIndex = useCallback(
    (startIdx, dir = 1) => {
      if (typeof document === 'undefined' || !Array.isArray(steps) || steps.length === 0) return -1;
      let i = startIdx;
      while (i >= 0 && i < steps.length) {
        const st = steps[i];
        const el = st?.targetSelector ? document.querySelector(st.targetSelector) : null;
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) return i;
        }
        i += dir;
      }
      return -1;
    },
    [steps]
  );

  const activeStep = steps[currentIndex] || null;

  const measureTarget = useCallback(() => {
    if (!isOpen || !activeStep || typeof document === 'undefined') {
      setTargetRect(null);
      return;
    }

    setViewport({
      w: window.innerWidth || 1280,
      h: window.innerHeight || 720,
    });

    const el = activeStep.targetSelector ? document.querySelector(activeStep.targetSelector) : null;
    if (!el) {
      const nextIdx = findNextAvailableIndex(currentIndex + 1, 1);
      if (nextIdx >= 0 && onStepChange) {
        onStepChange(nextIdx);
      } else if (onComplete) {
        onComplete();
      }
      return;
    }

    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      const nextIdx = findNextAvailableIndex(currentIndex + 1, 1);
      if (nextIdx >= 0 && onStepChange) {
        onStepChange(nextIdx);
      } else if (onComplete) {
        onComplete();
      }
      return;
    }

    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 720;
    const pad = 8;
    const top = Math.max(2, r.top - pad);
    const left = Math.max(2, r.left - pad);
    const right = Math.min(vw - 2, r.right + pad);
    const bottom = Math.min(vh - 2, r.bottom + pad);

    setTargetRect({
      top,
      left,
      width: Math.max(24, right - left),
      height: Math.max(24, bottom - top),
    });
  }, [isOpen, activeStep, currentIndex, findNextAvailableIndex, onStepChange, onComplete]);

  useEffect(() => {
    if (!isOpen || !activeStep || typeof document === 'undefined') return;
    const el = activeStep.targetSelector ? document.querySelector(activeStep.targetSelector) : null;
    if (el && typeof el.scrollIntoView === 'function') {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      } catch {
        // ignore in non-browser JSDOM environments
      }
    }
    measureTarget();
    const timer1 = setTimeout(measureTarget, 90);
    const timer2 = setTimeout(measureTarget, 240);
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [isOpen, currentIndex, activeStep, measureTarget]);

  const handleNext = useCallback(() => {
    const nextIdx = findNextAvailableIndex(currentIndex + 1, 1);
    if (nextIdx >= 0 && onStepChange) {
      onStepChange(nextIdx);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, findNextAvailableIndex, onStepChange, onComplete]);

  const handleBack = useCallback(() => {
    const prevIdx = findNextAvailableIndex(currentIndex - 1, -1);
    if (prevIdx >= 0 && onStepChange) {
      onStepChange(prevIdx);
    }
  }, [currentIndex, findNextAvailableIndex, onStepChange]);

  const handleExitPause = useCallback(() => {
    if (onPause) onPause(currentIndex);
    else if (onSkip) onSkip(currentIndex);
  }, [currentIndex, onPause, onSkip]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleExitPause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleExitPause, handleNext, handleBack]);

  if (!isOpen || !activeStep) return null;

  const isLast = findNextAvailableIndex(currentIndex + 1, 1) < 0;
  const hasPrev = findNextAvailableIndex(currentIndex - 1, -1) >= 0;

  // Smart tooltip positioning around spotlight rect
  const cardWidth = Math.min(355, viewport.w - 24);
  const estimatedHeight = 235;
  let cardTop = Math.max(16, (viewport.h - estimatedHeight) / 2);
  let cardLeft = Math.max(12, (viewport.w - cardWidth) / 2);

  if (targetRect) {
    const spaceBelow = viewport.h - (targetRect.top + targetRect.height);
    const spaceAbove = targetRect.top;
    const spaceRight = viewport.w - (targetRect.left + targetRect.width);
    const pref = activeStep.placement || 'bottom';

    if (pref === 'right' && spaceRight >= cardWidth + 24 && viewport.w > 680) {
      cardLeft = targetRect.left + targetRect.width + 14;
      cardTop = Math.min(Math.max(14, targetRect.top), viewport.h - estimatedHeight - 14);
    } else if ((pref === 'bottom' && spaceBelow >= estimatedHeight + 18) || (pref === 'top' && spaceAbove < estimatedHeight + 18 && spaceBelow >= spaceAbove)) {
      cardTop = Math.min(viewport.h - estimatedHeight - 14, targetRect.top + targetRect.height + 12);
      cardLeft = Math.min(Math.max(12, targetRect.left + targetRect.width / 2 - cardWidth / 2), viewport.w - cardWidth - 12);
    } else {
      cardTop = Math.max(14, targetRect.top - estimatedHeight - 12);
      cardLeft = Math.min(Math.max(12, targetRect.left + targetRect.width / 2 - cardWidth / 2), viewport.w - cardWidth - 12);
    }
  }

  const blurClipPath = targetRect
    ? `polygon(evenodd, 0px 0px, ${viewport.w}px 0px, ${viewport.w}px ${viewport.h}px, 0px ${viewport.h}px, 0px 0px, ${targetRect.left}px ${targetRect.top}px, ${targetRect.left}px ${targetRect.top + targetRect.height}px, ${targetRect.left + targetRect.width}px ${targetRect.top + targetRect.height}px, ${targetRect.left + targetRect.width}px ${targetRect.top}px, ${targetRect.left}px ${targetRect.top}px)`
    : undefined;

  return (
    <div
      data-testid="product-tour-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Product tour step ${currentIndex + 1} of ${steps.length}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9995,
        pointerEvents: 'auto',
      }}
    >
      {/* Subtle blur outside the spotlight cutout so the focused target remains 100% sharp */}
      <div
        data-testid="product-tour-blur-layer"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backdropFilter: 'blur(2.5px)',
          WebkitBackdropFilter: 'blur(2.5px)',
          clipPath: blurClipPath,
          WebkitClipPath: blurClipPath,
        }}
      />

      {/* High-contrast dark backdrop (~85%) with rounded SVG cutout around highlighted target */}
      <svg
        data-testid="product-tour-dim-overlay"
        width="100%"
        height="100%"
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
      >
        <defs>
          <mask id="clevercut-tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(4, 6, 12, 0.85)"
          mask="url(#clevercut-tour-spotlight-mask)"
        />
      </svg>

      {/* Prominent 2px accent spotlight ring + soft outer glow */}
      {targetRect && (
        <div
          data-testid="product-tour-spotlight-ring"
          style={{
            position: 'fixed',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            borderRadius: 12,
            border: '2px solid var(--accent-primary)',
            boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.25), 0 0 26px rgba(99, 102, 241, 0.45)',
            pointerEvents: 'none',
            transition: 'all 0.18s ease-out',
          }}
        />
      )}

      {/* Interactive Tooltip Card */}
      <div
        ref={tooltipRef}
        tabIndex={-1}
        data-testid={`tour-tooltip-${activeStep.id}`}
        style={{
          position: 'fixed',
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid rgba(99, 102, 241, 0.42)',
          borderRadius: 14,
          padding: '16px 18px',
          boxShadow: '0 24px 56px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          zIndex: 9996,
          outline: 'none',
        }}
      >
        {/* Polite assistive technology announcement on step change */}
        <span
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {`Step ${currentIndex + 1} of ${steps.length}: ${activeStep.title}. ${activeStep.description}`}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span
            data-testid="tour-step-counter"
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--accent-primary)',
              backgroundColor: 'rgba(99, 102, 241, 0.14)',
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            Step {currentIndex + 1} of {steps.length}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {currentIndex > 0 && (
              <button
                type="button"
                data-testid="tour-restart-btn"
                aria-label="Restart tour from Step 1"
                onClick={() => {
                  if (onRestart) onRestart();
                  else if (onStepChange) onStepChange(0);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: 2,
                }}
              >
                <RotateCcw size={11} aria-hidden="true" />
                <span>Restart</span>
              </button>
            )}
            <button
              type="button"
              data-testid="tour-skip-btn"
              aria-label="Pause and exit tour (resume later from your current step)"
              onClick={handleExitPause}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: 2,
              }}
            >
              <Pause size={11} aria-hidden="true" />
              <span>Pause</span>
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div>
          <h3 style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
            {activeStep.title}
          </h3>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {activeStep.description}
          </p>
        </div>

        {activeStep.action && onStepAction && (
          <div>
            <button
              type="button"
              data-testid={`tour-action-${activeStep.id}`}
              onClick={() => {
                suppressFocusRestoreRef.current = true;
                onStepAction(activeStep.action, currentIndex);
              }}
              style={{
                padding: '6px 11px',
                borderRadius: 7,
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: 'var(--accent-primary)',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>{activeStep.action.label}</span>
              <ArrowRight size={12} aria-hidden="true" />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 4 }}>
          <div>
            {hasPrev && (
              <button
                type="button"
                data-testid="tour-back-btn"
                aria-label="Previous tour step"
                onClick={handleBack}
                style={{
                  padding: '6px 11px',
                  borderRadius: 7,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ArrowLeft size={12} aria-hidden="true" />
                <span>Previous</span>
              </button>
            )}
          </div>

          <button
            type="button"
            data-testid="tour-next-btn"
            aria-label={isLast ? 'Finish guided tour' : 'Next tour step'}
            onClick={handleNext}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              backgroundColor: 'var(--accent-primary)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isLast ? (
              <>
                <Check size={13} aria-hidden="true" />
                <span>Done</span>
              </>
            ) : (
              <>
                <span>Next</span>
                <ArrowRight size={13} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
