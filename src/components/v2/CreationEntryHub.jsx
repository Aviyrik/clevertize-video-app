import React from 'react';
import {
  Sparkles,
  FileCode2,
  Globe,
  ArrowRight,
  Film,
  Store,
  CheckCircle2,
  Layers,
  Clapperboard,
  Zap,
  FileText,
  Clock,
} from 'lucide-react';

export default function CreationEntryHub({
  onStartBrief,
  onOpenScriptModal,
  onOpenUrlModal,
  businessName = '',
  businessType = '',
  town = '',
  hasActiveScript = false,
  onContinueActiveProject,
  recentProjects = [],
  onOpenProject,
  currentUser = null,
  onNavigateProjects,
  onEditBrand,
}) {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(24px, 4vw, 44px) clamp(14px, 3vw, 24px) 60px', width: '100%', boxSizing: 'border-box' }}>
      {/* Welcome Banner */}
      <div style={{ marginBottom: 18 }}>
        <h1
          style={{
            fontSize: 'clamp(30px, 4vw, 40px)',
            fontWeight: 600,
            margin: '0 0 6px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.028em',
            lineHeight: 1.08,
          }}
        >
          Create a New Video Ad
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
            maxWidth: 520,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Pick a starting point.
        </p>
      </div>

      {/* Active Brand Context Banner OR Setup Prompt */}
      {businessName ? (
        <div
          data-tour="hub-brand-card"
          style={{
            backgroundColor: 'transparent',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '10px 0',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: 'var(--cc-hover)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Store size={17} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-tertiary)' }}>
                Active Brand:
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {businessName}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  fontWeight: 400,
                }}
              >
                {businessType || 'Retail Store'}
              </span>
              {town && (
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>· {town}</span>
              )}
            </div>
          </div>
          {onEditBrand && (
            <button
              type="button"
              onClick={onEditBrand}
              className="cc-btn cc-btn--ghost cc-btn--sm"
            >
              Edit Details
            </button>
          )}
        </div>
      ) : (
        <div
          data-tour="hub-brand-card"
          style={{
            backgroundColor: 'rgba(244, 244, 236, 0.03)',
            border: '1px dashed var(--border-strong)',
            borderRadius: 14,
            padding: '12px 18px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                backgroundColor: 'var(--cc-hover)',
                color: 'var(--cc-text-1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Store size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                No Business Profile Set Up
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Add your business details to tailor ads to your brand.
              </div>
            </div>
          </div>
          {onEditBrand && (
            <button
              type="button"
              onClick={onEditBrand}
              className="cc-btn cc-btn--secondary cc-btn--sm"
            >
              + Set Up Business
            </button>
          )}
        </div>
      )}

      {/* The Three Creation Entry Points (Exclusive Starting Points) */}
      {/* Entry Point 1: Start with a Brief (Hero / Recommended) */}
      <div
        data-tour="hub-entry-brief"
        data-testid="hub-card-brief"
        className="cc-enter"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
          backgroundColor: 'var(--cc-surface)',
          backgroundImage: 'var(--cc-sheen)',
          border: '1px solid var(--border-default)',
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 14,
        }}
      >
        <div style={{ padding: '28px 28px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-tertiary)' }}>★ Recommended</span>
          <h3 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Start with a Brief
          </h3>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.55, maxWidth: 380 }}>
            Describe your offer and let AI draft hooks and scripts.
          </p>
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={onStartBrief}
              className="cc-btn cc-btn--primary cc-btn--lg"
            >
              <span>Start with Brief</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Visual: the path ahead, as a slate over warm footage light */}
        <div
          aria-hidden="true"
          className="hub-hero-visual"
          style={{
            position: 'relative',
            minHeight: 210,
            background:
              'radial-gradient(60% 75% at 70% 30%, rgba(242, 184, 75, 0.30), transparent 62%), radial-gradient(55% 60% at 15% 90%, rgba(141, 184, 255, 0.10), transparent 60%), linear-gradient(160deg, #2A2621 0%, #121110 100%)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, transparent 0 63px, rgba(255,255,255,0.025) 63px 64px)' }} />
          <div style={{ position: 'absolute', left: 20, right: 20, bottom: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Write brief', 'Pick mode', 'Generate scripts'].map((label, i) => (
              <div
                key={label}
                className="cc-glass--flat"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 12,
                  backgroundColor: 'rgba(18, 18, 16, 0.42)',
                  WebkitBackdropFilter: 'blur(12px)',
                  backdropFilter: 'blur(12px)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.88)',
                }}
              >
                <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>0{i + 1}</span>
                {label}
              </div>
            ))}
          </div>
          <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            Next step: Write brief → pick mode → generate scripts.
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
          gap: 14,
          marginBottom: 44,
        }}
      >
        {/* Entry Point 2: Start with an Existing Script */}
        <button
          type="button"
          data-testid="hub-card-script"
          onClick={onOpenScriptModal}
          className="cc-hoverable"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            textAlign: 'left',
            padding: '16px 18px',
            borderRadius: 14,
            backgroundColor: 'var(--cc-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <span style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'var(--cc-hover)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileCode2 size={18} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 600, letterSpacing: '-0.005em' }}>Start with an Existing Script</span>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Paste a script for continuity checks and rendering.
            </span>
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
              Next step: Paste script → check quality → produce or edit scenes.
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', flexShrink: 0 }}>
            <span className="hub-card-action-label">Import Script</span>
            <ArrowRight size={15} />
          </span>
        </button>

        {/* Entry Point 3: Start with a Website URL */}
        <button
          type="button"
          data-testid="hub-card-url"
          onClick={onOpenUrlModal}
          className="cc-hoverable"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            textAlign: 'left',
            padding: '16px 18px',
            borderRadius: 14,
            backgroundColor: 'var(--cc-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <span style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'var(--cc-hover)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Globe size={18} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 600, letterSpacing: '-0.005em' }}>Start with a Website URL</span>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Pull brand details and offerings straight from your website.
            </span>
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
              Next step: Scan URL → review brief → pick mode.
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', flexShrink: 0 }}>
            <span className="hub-card-action-label">Scan Website</span>
            <ArrowRight size={15} />
          </span>
        </button>
      </div>

      {/* Recent Projects Section */}
      {recentProjects && recentProjects.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Recent Projects
              </h2>
              <span
                style={{
                  fontSize: 12.5,
                  fontFamily: 'var(--cc-font-mono)',
                  color: 'var(--text-tertiary)',
                  fontWeight: 500,
                }}
              >
                {recentProjects.length}
              </span>
            </div>

            {onNavigateProjects && (
              <button
                type="button"
                onClick={onNavigateProjects}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                }}
              >
                <span>View All Projects</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
              gap: 16,
            }}
          >
            {recentProjects.slice(0, 3).map((proj) => (
              <div
                key={proj.id}
                onClick={() => onOpenProject && onOpenProject(proj)}
                style={{
                  backgroundColor: 'var(--cc-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  gap: 12,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.005em',
                        color: 'var(--text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: proj.status === 'script_ready' ? 'var(--success)' : 'var(--warning)' }} />
                      {proj.status === 'script_ready' ? 'Script Ready' : 'In Progress'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {proj.scenes?.length || 4} Scenes
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {proj.title || 'Commercial Project'}
                  </h4>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {proj.businessName || 'Business'} {proj.town ? `· ${proj.town}` : ''}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span>Resume in Studio</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Production Highlights Footer */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              18-Point Continuity Gate
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Setting and dialogue consistency checks
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Indian Regional Dialects
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Devanagari script support
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Magnific GPU Rendering
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Character-consistent video output
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
