import React, { useState, useEffect, useRef } from 'react';
import { Clapperboard } from 'lucide-react';

/**
 * AuthVideoShowcase - Cinematic full-bleed AI commercial showreel showcase
 * for the CleverCuts authentication screen.
 *
 * Implements:
 * - 16:9 full-bleed video loop with object-fit: cover
 * - Smooth fallback to poster image on load error or reduced motion
 * - Restrained dark gradient overlay ensuring logo readability
 * - Zero sound / playback controls
 */
export default function AuthVideoShowcase({
  videoSrc = '/videos/background-optimized.mp4',
  fallbackVideoSrc = '/videos/background.mp4',
  posterSrc = '/videos/background-poster.jpg',
  className = '',
  style = {},
}) {
  const [hasError, setHasError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Respect user's motion preferences
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e) => setPrefersReducedMotion(e.matches);
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    } catch {
      // Fallback for older browsers
    }
  }, []);

  const handleVideoError = () => {
    // Graceful fallback to poster without breaking the form
    setHasError(true);
  };

  return (
    <div
      className={`auth-video-showcase ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#07080B',
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

      {/* Subtle Cinematic Dark Gradient Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(7, 8, 12, 0.45) 0%, rgba(7, 8, 12, 0.08) 35%, rgba(7, 8, 12, 0.15) 65%, rgba(7, 8, 12, 0.6) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* CleverCuts Brand Identity in Upper-Left Corner */}
      <div
        style={{
          position: 'absolute',
          top: 28,
          left: 28,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
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
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)',
          }}
        >
          CleverCuts
        </span>
      </div>
    </div>
  );
}
