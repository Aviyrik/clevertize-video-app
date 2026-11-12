import React from 'react';
import { Check } from 'lucide-react';
import HelpTooltip from './HelpTooltip.jsx';
import { HELP_TOOLTIPS } from '../../data/tourSteps.js';

export const VIDEO_DIMENSION_OPTIONS = [
  {
    id: '9:16',
    label: '9:16 Vertical',
    platformHint: 'Reels · Shorts · TikTok',
    frameWidth: 16,
    frameHeight: 26,
    recommended: true,
  },
  {
    id: '16:9',
    label: '16:9 Landscape',
    platformHint: 'YouTube · Website',
    frameWidth: 28,
    frameHeight: 16,
    recommended: false,
  },
  {
    id: '1:1',
    label: '1:1 Square',
    platformHint: 'Social Feed',
    frameWidth: 21,
    frameHeight: 21,
    recommended: false,
  },
];

export const VIDEO_DURATION_OPTIONS = [
  {
    id: '15s',
    label: '15s Hook',
    pacingNote: 'Quick single offer',
    beats: 4,
    recommended: false,
  },
  {
    id: '20s',
    label: '20s Standard',
    pacingNote: 'Balanced story & CTA',
    beats: 4,
    recommended: true,
  },
  {
    id: '30s',
    label: '30s Extended',
    pacingNote: 'Full story + demo',
    beats: 4,
    recommended: false,
  },
];

/**
 * Shared visual single-select Video Dimension & Length selectors used by both Simple & Director modes.
 */
export default function VideoFormatFields({
  aspectRatio = '9:16',
  duration = '20s',
  onSelectAspectRatio,
  onSelectDuration,
  dimensionHeading = 'Video Dimension',
  durationHeading = 'Video Length',
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(270px, 100%), 1fr))', gap: 18 }}>
      {/* Video Dimension (Single-Select with Proportional Frame Preview) */}
      <div>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.005em',
            color: 'var(--text-tertiary)',
            marginBottom: 10,
          }}
        >
          <span>{dimensionHeading}</span>
          <HelpTooltip
            title={HELP_TOOLTIPS.format_dimension.title}
            body={HELP_TOOLTIPS.format_dimension.body}
            ariaLabel="Video dimension help"
          />
        </label>

        <div role="group" aria-label={dimensionHeading} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {VIDEO_DIMENSION_OPTIONS.map((dim) => {
            const isSelected = aspectRatio === dim.id;
            return (
              <button
                key={dim.id}
                type="button"
                aria-pressed={isSelected}
                data-testid={`dimension-card-${dim.id}`}
                onClick={() => onSelectAspectRatio && onSelectAspectRatio(dim)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '12px 8px',
                  borderRadius: 10,
                  backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                  border: isSelected ? '2px solid var(--cc-selected-line)' : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 0 1px var(--cc-selected-line), 0 4px 12px rgba(244, 244, 236, 0.14)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {isSelected && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 15,
                      height: 15,
                      borderRadius: '50%',
                      backgroundColor: 'var(--cc-action)',
                      color: 'var(--cc-on-action)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={9} strokeWidth={3} />
                  </span>
                )}
                {/* Proportional visual wireframe preview */}
                <div
                  style={{
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: dim.frameWidth,
                      height: dim.frameHeight,
                      borderRadius: 3,
                      border: isSelected ? '2px solid var(--cc-selected-line)' : '1.5px solid var(--text-tertiary)',
                      backgroundColor: isSelected ? 'rgba(244, 244, 236, 0.09)' : 'rgba(255, 255, 255, 0.03)',
                      transition: 'all 0.15s ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'var(--cc-emphasis)' : 'var(--text-primary)' }}>
                  {dim.label}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-tertiary)', lineHeight: 1.25 }}>
                  {dim.platformHint}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Length / Duration */}
      <div>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.005em',
            color: 'var(--text-tertiary)',
            marginBottom: 10,
          }}
        >
          <span>{durationHeading}</span>
          <HelpTooltip
            title={HELP_TOOLTIPS.format_duration.title}
            body={HELP_TOOLTIPS.format_duration.body}
            ariaLabel="Video length help"
          />
        </label>

        <div role="group" aria-label={durationHeading} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {VIDEO_DURATION_OPTIONS.map((dur) => {
            const isSelected = duration === dur.id;
            return (
              <button
                key={dur.id}
                type="button"
                aria-pressed={isSelected}
                data-testid={`duration-card-${dur.id}`}
                onClick={() => onSelectDuration && onSelectDuration(dur)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '12px 8px',
                  borderRadius: 10,
                  backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                  border: isSelected ? '2px solid var(--cc-selected-line)' : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 0 1px var(--cc-selected-line), 0 4px 12px rgba(244, 244, 236, 0.14)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {isSelected && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 15,
                      height: 15,
                      borderRadius: '50%',
                      backgroundColor: 'var(--cc-action)',
                      color: 'var(--cc-on-action)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={9} strokeWidth={3} />
                  </span>
                )}
                <div style={{ fontSize: 12.5, fontWeight: 600, color: isSelected ? 'var(--cc-emphasis)' : 'var(--text-primary)' }}>
                  {dur.label}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-tertiary)', lineHeight: 1.25 }}>
                  {dur.pacingNote}
                </div>
                {dur.recommended && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--cc-emphasis)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Popular
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
