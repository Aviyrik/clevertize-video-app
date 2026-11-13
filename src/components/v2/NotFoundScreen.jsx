import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import BrandMark from './BrandMark.jsx';

/**
 * Shown for addresses the app doesn't know (the server also answers them with a 404 status).
 * Works signed in or out: "Go to CleverCut" leads to the hub, or the log-in screen when signed out.
 */
export default function NotFoundScreen({ onGoHome }) {
  return (
    <main
      data-testid="not-found-screen"
      className="cc-keylight"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--cc-bg)',
        color: 'var(--cc-text-1)',
        fontFamily: 'var(--cc-font-text)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: '24px 16px',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 1080, width: '100%', margin: '0 auto' }}>
        <BrandMark size={32} />
        <span style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 600, fontSize: 16 }}>CleverCut</span>
      </header>

      <section
        aria-labelledby="not-found-title"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 14,
          maxWidth: 440,
          margin: '0 auto',
          padding: '40px 0',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--cc-radius-md)',
            backgroundColor: 'var(--cc-raised)',
            border: '1px solid var(--cc-line-2)',
            color: 'var(--cc-text-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Compass size={24} />
        </div>
        <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 13, color: 'var(--cc-text-3)' }}>Error 404</span>
        <h1
          id="not-found-title"
          style={{ margin: 0, fontFamily: 'var(--cc-font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}
        >
          Page not found
        </h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--cc-text-2)' }}>
          This page doesn&rsquo;t exist or may have moved. Check the address, or head back to your studio.
        </p>
        <button
          type="button"
          className="cc-btn cc-btn--primary cc-btn--lg"
          onClick={onGoHome}
          style={{ marginTop: 10 }}
        >
          <span>Go to CleverCut</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </section>
    </main>
  );
}
