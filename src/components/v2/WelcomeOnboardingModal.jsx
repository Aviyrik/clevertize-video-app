import React, { useEffect } from 'react';
import { Clapperboard, Sparkles, ArrowRight } from 'lucide-react';

/**
 * Non-intrusive welcome dialog introduced once for first-time users after initial setup.
 */
export default function WelcomeOnboardingModal({
  isOpen,
  onStartTour,
  onSkip,
}) {
  useEffect(() => {
    if (!isOpen || !onSkip) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onSkip]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="welcome-onboarding-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-clevercut-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 10, 9, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 9990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          padding: '28px 26px 24px',
          boxShadow: '0 24px 54px rgba(0, 0, 0, 0.55)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            backgroundColor: 'rgba(244, 244, 236, 0.08)',
            border: '1px solid rgba(244, 244, 236, 0.315)',
            color: 'var(--cc-emphasis)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Clapperboard size={26} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 id="welcome-clevercut-title" style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Welcome to CleverCut
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Take a quick tour to see how creating and managing video ads works.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 6 }}>
          <button
            type="button"
            data-testid="welcome-start-tour-btn"
            onClick={onStartTour}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 999,
              backgroundColor: 'var(--cc-action)',
              border: 'none',
              color: 'var(--cc-on-action)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
            }}
          >
            <Sparkles size={15} />
            <span>Start Tour</span>
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            data-testid="welcome-skip-tour-btn"
            onClick={onSkip}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: 8,
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
}
