import React from 'react';
import {
  Zap,
  Sliders,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  FileCode2,
  Globe,
} from 'lucide-react';

/**
 * Post-Brief / Post-URL / Post-Script Mode Selection Screen.
 * Makes both Simple Mode and Director Mode equally visible while keeping
 * Simple Mode recommended for most brief-led campaigns and Director Mode
 * highlighted when importing/editing a full script.
 */
export default function ModeSelectionScreen({
  entrySource = 'brief', // 'brief' | 'url' | 'script'
  briefText = '',
  businessName = '',
  preferredMode = null,
  onSelectMode, // ('simple' | 'advanced') => void
  onBack,
}) {
  const isScriptEntry = entrySource === 'script';
  const isUrlEntry = entrySource === 'url';

  const simpleCardRecommended = !isScriptEntry;
  const directorCardRecommended = isScriptEntry;

  const simpleSteps = isScriptEntry
    ? ['Verified Script', 'Quick Produce', 'Video Output']
    : ['Settings & Offer', 'Pick 1 of 3 Scripts', 'Video Output'];

  const directorSteps = isScriptEntry
    ? ['Script Studio', 'Edit & Improve', 'Video Output']
    : ['Settings', 'AI Check', 'Ideas', 'Hook', 'Script', 'Video'];

  return (
    <div
      data-testid="mode-selection-screen"
      style={{
        maxWidth: 920,
        margin: '24px auto 0',
        padding: '0 20px 80px',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Choose Your Workflow
        </h1>
        <p style={{ margin: '0 auto', maxWidth: 520, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {isScriptEntry
            ? 'Your script is verified. Produce now or edit scenes first.'
            : isUrlEntry
              ? 'Your website details are ready. Switch modes anytime without losing progress.'
              : 'Your brief and settings stay synced if you switch later.'}
        </p>
      </div>

      {/* Preserved Context Pill */}
      {(briefText || businessName) && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.005em',
                color: 'var(--cc-emphasis)',
                flexShrink: 0,
              }}
            >
              {isScriptEntry ? 'Active Brand:' : 'Saved Brief:'}
            </span>
            <span
              style={{
                fontSize: 12.5,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {briefText ? briefText : businessName}
            </span>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                background: 'none',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={12} />
              <span>{isScriptEntry ? 'Edit Imported Script' : 'Edit Brief'}</span>
            </button>
          )}
        </div>
      )}

      {/* Two Visually Distinct Mode Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
          gap: 18,
          alignItems: 'stretch',
        }}
      >
        {/* SIMPLE MODE CARD */}
        <div
          data-testid="mode-card-simple"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: simpleCardRecommended
              ? '2px solid var(--cc-selected-line)'
              : '1px solid var(--border-default)',
            borderRadius: 14,
            padding: '22px 22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 18,
            boxShadow: simpleCardRecommended
              ? '0 8px 28px rgba(0, 0, 0, 0.16)'
              : '0 4px 18px rgba(0, 0, 0, 0.2)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: 'rgba(244, 244, 236, 0.07)',
                  color: 'var(--cc-emphasis)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={20} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {preferredMode === 'simple' && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 12,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Last Used
                  </span>
                )}
                {simpleCardRecommended && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.005em',
                      padding: '3px 9px',
                      borderRadius: 12,
                      backgroundColor: 'rgba(244, 244, 236, 0.08)',
                      color: 'var(--cc-text-1)',
                    }}
                  >
                    Recommended
                  </span>
                )}
              </div>
            </div>

            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 600, color: 'var(--text-primary)' }}>
                Simple Mode
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {isScriptEntry
                  ? 'Render straight from your verified script with minimal steps.'
                  : 'Fastest guided path from brief to finished video.'}
              </p>
            </div>

            {/* Workflow Visual Preview */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                3 Steps
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {simpleSteps.map((step, i) => (
                  <React.Fragment key={step}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {step}
                    </span>
                    {i < simpleSteps.length - 1 && (
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Key bullets */}
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(isScriptEntry
                ? [
                    'Skips manual scene editing',
                    'Renders straight from verified script',
                  ]
                : [
                    'Fewer decisions to get started quickly',
                    'Generates 3 ready-to-produce script options',
                  ]).map((pt) => (
                <li key={pt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  <Check size={14} style={{ color: 'var(--cc-emphasis)', flexShrink: 0 }} />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            data-testid="start-simple-mode-btn"
            onClick={() => onSelectMode && onSelectMode('simple')}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              backgroundColor: simpleCardRecommended ? 'var(--cc-action)' : 'var(--bg-elevated)',
              border: simpleCardRecommended ? 'none' : '1px solid var(--border-default)',
              color: simpleCardRecommended ? 'var(--cc-on-action)' : 'var(--text-primary)',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: simpleCardRecommended ? '0 4px 14px var(--accent-glow)' : 'none',
            }}
          >
            <span>Start with Simple Mode</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* DIRECTOR MODE CARD */}
        <div
          data-testid="mode-card-director"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: directorCardRecommended
              ? '2px solid var(--cc-selected-line)'
              : '1px solid var(--border-default)',
            borderRadius: 14,
            padding: '22px 22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 18,
            boxShadow: directorCardRecommended
              ? '0 8px 28px rgba(0, 0, 0, 0.14)'
              : '0 4px 18px rgba(0, 0, 0, 0.2)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: 'rgba(244, 244, 236, 0.07)',
                  color: 'var(--cc-emphasis)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sliders size={20} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {preferredMode === 'advanced' && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 12,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Last Used
                  </span>
                )}
                {directorCardRecommended ? (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.005em',
                      padding: '3px 9px',
                      borderRadius: 12,
                      backgroundColor: 'rgba(244, 244, 236, 0.08)',
                      color: 'var(--cc-text-1)',
                    }}
                  >
                    Best for Scripts
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.005em',
                      padding: '3px 9px',
                      borderRadius: 12,
                      backgroundColor: 'rgba(244, 244, 236, 0.07)',
                      border: '1px solid rgba(244, 244, 236, 0.27)',
                      color: 'var(--cc-emphasis)',
                    }}
                  >
                    Full Creative Control
                  </span>
                )}
              </div>
            </div>

            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 600, color: 'var(--text-primary)' }}>
                Director Mode
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {isScriptEntry
                  ? 'Edit scenes, characters, and continuity before rendering.'
                  : 'Full step-by-step control over strategy, ideas, hooks, and scenes.'}
              </p>
            </div>

            {/* Workflow Visual Preview */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                {isScriptEntry ? 'Scene Editor' : '7 Stages'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                {directorSteps.map((step, i) => (
                  <React.Fragment key={step}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '3px 7px',
                        borderRadius: 6,
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {step}
                    </span>
                    {i < directorSteps.length - 1 && (
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Key bullets */}
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(isScriptEntry
                ? [
                    'Edit dialogue and visual actions per scene',
                    'Customize cast names & setting continuity',
                  ]
                : [
                    'Review AI strategy & customize creative directions',
                    'Edit every opening hook and scene script',
                  ]).map((pt) => (
                <li key={pt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  <Check size={14} style={{ color: 'var(--cc-emphasis)', flexShrink: 0 }} />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            data-testid="start-director-mode-btn"
            onClick={() => onSelectMode && onSelectMode('advanced')}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              backgroundColor: directorCardRecommended ? 'var(--cc-action)' : 'var(--bg-elevated)',
              border: directorCardRecommended ? 'none' : '1px solid rgba(244, 244, 236, 0.405)',
              color: directorCardRecommended ? 'var(--cc-on-action)' : 'var(--cc-text-1)',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span>Start with Director Mode</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Footer note */}
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
        You can switch between Simple Mode and Director Mode at any time using the top bar switcher.
      </div>
    </div>
  );
}
