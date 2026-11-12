import React, { useEffect, useRef, useState } from 'react';
import { LOGIN_CLIPS, COVERR_URL } from '../../data/loginClips.js';

/**
 * AuthClipWall - full-screen login background: a tilted wall of portrait ad clips,
 * one per kind of business, that drifts slowly behind the auth panel.
 *
 * - Clips are Coverr stock footage hotlinked from Coverr's CDN (see src/data/loginClips.js).
 * - A clip only loads and plays while its card is on screen; off-screen cards pause.
 * - On phones and with prefers-reduced-motion, cards show still frames and nothing drifts.
 * - If Coverr can't be reached, onUnavailable() lets the screen fall back to the bundled video.
 */

const COLUMNS = 7;
const ROWS = 5;

// Spread the 12 clips so neighbours (across and down) are never the same clip.
const clipFor = (col, row) => LOGIN_CLIPS[(col * 5 + row * 3) % LOGIN_CLIPS.length];

function useStillMode() {
  const query = '(prefers-reduced-motion: reduce), (max-width: 640px)';
  const [still, setStill] = useState(() => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    let mq;
    try {
      mq = window.matchMedia(query);
    } catch {
      return undefined;
    }
    const onChange = (e) => setStill(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return still;
}

function ClipCard({ clip, still }) {
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false); // src attached once, on first sight
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (still || failed) return undefined;
    const el = frameRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setLoaded(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [still, failed]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (visible) {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      v.pause();
    }
  }, [visible, loaded]);

  const showVideo = !still && !failed && loaded;

  return (
    <figure className="clip-card">
      <figcaption className="clip-card__caption">
        <span className="clip-card__label">{clip.label}</span>
        <span className="clip-card__meta">{clip.meta}</span>
      </figcaption>
      <div className="clip-card__frame" ref={frameRef}>
        <img className="clip-card__media" src={clip.poster} alt="" loading="lazy" decoding="async" draggable={false} />
        {showVideo && (
          <video
            ref={videoRef}
            className="clip-card__media clip-card__video"
            src={clip.src}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </figure>
  );
}

export default function AuthClipWall({ onUnavailable }) {
  const still = useStillMode();

  // One cheap probe: if Coverr's CDN can't serve a still frame, hand back to the fallback video.
  useEffect(() => {
    if (!onUnavailable || !LOGIN_CLIPS.length) return undefined;
    let cancelled = false;
    const probe = new Image();
    probe.onerror = () => {
      if (!cancelled) onUnavailable();
    };
    probe.src = LOGIN_CLIPS[0].poster;
    return () => {
      cancelled = true;
    };
  }, [onUnavailable]);

  const columns = Array.from({ length: COLUMNS }, (_, col) =>
    Array.from({ length: ROWS }, (_, row) => clipFor(col, row)),
  );

  return (
    <>
      <style>{`
        .clip-wall {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background-color: var(--cc-bg);
          pointer-events: none;
          user-select: none;
        }
        .clip-wall__grid {
          position: absolute;
          top: 50%;
          left: 50%;
          display: grid;
          grid-template-columns: repeat(${COLUMNS}, var(--clip-w));
          gap: 0 var(--clip-gap);
          --clip-w: clamp(150px, 13.5vw, 210px);
          --clip-gap: clamp(20px, 2.2vw, 36px);
          transform: translate(-50%, -50%) rotate(-8deg);
        }
        .clip-wall__col {
          display: flex;
          flex-direction: column;
          gap: var(--clip-gap);
          animation: clip-drift 70s var(--cc-ease) infinite alternate;
        }
        .clip-wall__col:nth-child(even) {
          margin-top: calc(var(--clip-w) * 0.75);
          animation-direction: alternate-reverse;
        }
        @keyframes clip-drift {
          from { transform: translateY(-4%); }
          to { transform: translateY(4%); }
        }
        .clip-card {
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .clip-card__caption {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-left: 2px;
        }
        .clip-card__label {
          font-family: var(--cc-font-text);
          font-size: 13px;
          font-weight: 500;
          color: var(--cc-text-2);
        }
        .clip-card__meta {
          font-family: var(--cc-font-mono);
          font-size: 12px;
          color: var(--cc-text-4);
          letter-spacing: 0.01em;
        }
        .clip-card__frame {
          position: relative;
          aspect-ratio: 2 / 3;
          border-radius: var(--cc-radius-md);
          overflow: hidden;
          background-color: var(--cc-raised);
          box-shadow: inset 0 0 0 1px var(--cc-line-1);
        }
        .clip-card__media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.62) saturate(0.85);
        }
        .clip-card__video {
          animation: clip-fade var(--cc-dur-4) var(--cc-ease-out) both;
        }
        @keyframes clip-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Shading: keeps the copy (bottom-left), logo (top-left) and form (right) readable */
        .clip-wall__shade {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(0deg, color-mix(in srgb, var(--cc-bg) 92%, transparent) 0%, transparent 55%),
            linear-gradient(180deg, color-mix(in srgb, var(--cc-bg) 70%, transparent) 0%, transparent 22%),
            linear-gradient(90deg,
              color-mix(in srgb, var(--cc-bg) 60%, transparent) 0%,
              color-mix(in srgb, var(--cc-bg) 35%, transparent) 45%,
              color-mix(in srgb, var(--cc-bg) 75%, transparent) 100%),
            color-mix(in srgb, var(--cc-bg) 30%, transparent);
        }

        .clip-wall__credit {
          position: fixed;
          right: 20px;
          bottom: 14px;
          z-index: 20;
          font-size: 12px;
          color: var(--cc-text-4);
          text-decoration: none;
          pointer-events: auto;
          transition: color var(--cc-dur-1) var(--cc-ease);
        }
        .clip-wall__credit:hover { color: var(--cc-text-2); }
        .clip-wall__credit:focus-visible {
          outline: 2px solid var(--cc-focus);
          outline-offset: 2px;
          border-radius: var(--cc-radius-xs);
        }

        @media (prefers-reduced-motion: reduce), (max-width: 640px) {
          .clip-wall__col { animation: none; }
        }
        @media (max-width: 640px) {
          .clip-wall__credit { right: 0; left: 0; text-align: center; bottom: 8px; }
        }
      `}</style>

      <div className="clip-wall" aria-hidden="true">
        <div className="clip-wall__grid">
          {columns.map((clips, col) => (
            <div className="clip-wall__col" key={col}>
              {clips.map((clip, row) => (
                <ClipCard key={`${col}-${row}`} clip={clip} still={still} />
              ))}
            </div>
          ))}
        </div>
        <div className="clip-wall__shade" />
      </div>

      <a className="clip-wall__credit" href={COVERR_URL} target="_blank" rel="noopener noreferrer">
        Background videos from Coverr
      </a>
    </>
  );
}
