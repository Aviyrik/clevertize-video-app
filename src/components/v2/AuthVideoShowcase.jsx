import React, { useState, useEffect, useRef } from 'react';
import { Clapperboard } from 'lucide-react';

/**
 * AuthVideoShowcase - Cinematic full-screen AI commercial video background
 * for the CleverCuts authentication screen.
 *
 * Implements:
 * - Full-screen background video covering the entire viewport (position: fixed, inset: 0)
 * - Object-fit: cover, un-cropped, zero border radius, zero borders
 * - Multi-layer dark overlay:
 *   1. Solid tint layer to dim brightness, glare, and rapid motion so it doesn't disturb the user
 *   2. Directional gradient overlay (darker on right behind the auth form)
 *   3. Top & bottom vignettes for logo and edge contrast
 * - Autoplay, muted, loop, playsInline, preload="metadata"
 * - Graceful fallback to poster image on load error or prefers-reduced-motion
 * - Zero playback controls or audio
 */
export default function AuthVideoShowcase({
  videoSrc = '/videos/background-optimized.mp4',
  fallbackVideoSrc = '/videos/background.mp4',
  posterSrc = '/videos/background-poster.jpg',
  showLogo = false,
  className = '',
  style = {},
}) {
  const [hasError, setHasError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e) => setPrefersReducedMotion(e.matches);
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    } catch {
      // Fallback for environments without matchMedia
    }
  }, []);

  const handleVideoError = () => {
    // Graceful fallback to poster without breaking the authentication form
    setHasError(true);
  };

  return (
    <div
      className={`auth-video-showcase ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
        backgroundColor: '#05060A',
        pointerEvents: 'none',
        ...style,
      }}
    >
      {/* Background Video Element / Poster Fallback */}
      {!prefersReducedMotion && !hasError ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={posterSrc}
          onError={handleVideoError}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          {fallbackVideoSrc && <source src={fallbackVideoSrc} type="video/mp4" />}
        </video>
      ) : (
        <img
          src={posterSrc}
          alt="CleverCuts Showreel"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}

      {/* 1. Global Dimmer Overlay: Darkens overall video brightness so background motion doesn't distract */}
      <div
        className="auth-video-dimmer"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(5, 6, 11, 0.52)',
          pointerEvents: 'none',
        }}
      />

      {/* 2. Directional Gradient Overlay: Muted on left (~40%), deep dark on right behind the auth panel (~88%) */}
      <div
        className="auth-video-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(6, 7, 12, 0.35) 0%, rgba(6, 7, 12, 0.58) 45%, rgba(7, 8, 14, 0.88) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* 3. Top subtle vignette for logo legibility */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 160,
          background: 'linear-gradient(180deg, rgba(5, 6, 10, 0.65) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* 4. Bottom subtle vignette */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 140,
          background: 'linear-gradient(0deg, rgba(5, 6, 10, 0.65) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Optional Brand Badge if enabled directly */}
      {showLogo && (
        <div
          style={{
            position: 'absolute',
            top: 32,
            left: 40,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: 'rgba(99, 102, 241, 0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            }}
          >
            <Clapperboard size={20} />
          </div>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)',
            }}
          >
            CleverCuts
          </span>
        </div>
      )}
    </div>
  );
}
