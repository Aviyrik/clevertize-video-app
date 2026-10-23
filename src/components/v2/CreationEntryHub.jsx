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
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '36px 24px 60px' }}>
      {/* Welcome Banner */}
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            margin: '0 0 8px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
          }}
        >
          Create a New Video Ad
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            maxWidth: 520,
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          Choose how you'd like to create your video ad.
        </p>
      </div>

      {/* Active Brand Context Banner OR Setup Prompt */}
      {businessName ? (
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Store size={17} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
                Active Brand:
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {businessName}
              </span>
              <span
                style={{
                  fontSize: 11,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
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
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              Edit Details
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'rgba(99, 102, 241, 0.06)',
            border: '1.5px dashed var(--accent-primary)',
            borderRadius: 10,
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
                backgroundColor: 'var(--accent-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Store size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                No Business Profile Set Up
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Set up your business profile first to generate tailored ads with your brand context and offerings.
              </div>
            </div>
          </div>
          {onEditBrand && (
            <button
              type="button"
              onClick={onEditBrand}
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 7,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              + Set Up Business
            </button>
          )}
        </div>
      )}

      {/* The Three Creation Entry Points Grid (Exclusive Starting Points) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 36,
        }}
      >
        {/* Entry Point 1: Start with a Brief (Hero / Recommended) */}
        <div
          onClick={onStartBrief}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '2px solid var(--accent-primary)',
            borderRadius: 14,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 6px 24px rgba(99, 102, 241, 0.18)',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(99, 102, 241, 0.28)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(99, 102, 241, 0.18)';
          }}
        >
          {/* Recommended Badge */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              backgroundColor: 'var(--accent-primary)',
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '3px 8px',
              borderRadius: 12,
            }}
          >
            ★ Recommended
          </div>

          <div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Sparkles size={22} />
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 4,
              }}
            >
              Guided Creation
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Start with a Brief
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Describe what you want to promote. Our AI drafts high-converting hooks and a complete video script.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              <span style={{ fontSize: 11, backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                ✨ No script needed
              </span>
              <span style={{ fontSize: 11, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-tertiary)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                ⚡ ~2 mins
              </span>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div
              style={{
                width: '100%',
                backgroundColor: 'var(--accent-primary)',
                color: '#FFFFFF',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 10px var(--accent-glow)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Start with Brief</span>
              <ArrowRight size={15} />
            </div>
          </div>
        </div>

        {/* Entry Point 2: Start with an Existing Script */}
        <div
          onClick={onOpenScriptModal}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 14,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#10B981';
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 26px rgba(16, 185, 129, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
          }}
        >
          <div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <FileCode2 size={22} />
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#10B981',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 4,
              }}
            >
              Fast Track
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Start with an Existing Script
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Have your script written? Paste your text to run quality checks and jump straight to video rendering.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              <span style={{ fontSize: 11, backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#34D399', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                ⚡ Direct to Stage 7
              </span>
              <span style={{ fontSize: 11, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-tertiary)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                📋 Paste script
              </span>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div
              style={{
                width: '100%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                color: '#34D399',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <span>Import Script</span>
              <ArrowRight size={15} />
            </div>
          </div>
        </div>

        {/* Entry Point 3: Start with a Website URL */}
        <div
          onClick={onOpenUrlModal}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 14,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#38BDF8';
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 26px rgba(56, 189, 248, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
          }}
        >
          <div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Globe size={22} />
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#38BDF8',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 4,
              }}
            >
              Automated Intelligence
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Start with a Website URL
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Enter your store website or product page. We'll automatically pull your brand details and offerings.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              <span style={{ fontSize: 11, backgroundColor: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                🌐 Store & catalog links
              </span>
              <span style={{ fontSize: 11, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-tertiary)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                🔍 Auto-extract
              </span>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div
              style={{
                width: '100%',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38BDF8',
                color: '#60A5FA',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <span>Scan Website</span>
              <ArrowRight size={15} />
            </div>
          </div>
        </div>
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
              <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Recent Projects
              </h2>
              <span
                style={{
                  fontSize: 11,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  padding: '2px 8px',
                  borderRadius: 10,
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
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
                  color: 'var(--accent-primary)',
                  fontSize: 13,
                  fontWeight: 600,
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {recentProjects.slice(0, 3).map((proj) => (
              <div
                key={proj.id}
                onClick={() => onOpenProject && onOpenProject(proj)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  padding: '16px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  gap: 12,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
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
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: proj.status === 'script_ready' ? 'var(--success)' : 'var(--accent-primary)',
                        backgroundColor: proj.status === 'script_ready' ? 'rgba(16, 185, 129, 0.12)' : 'var(--accent-subtle)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {proj.status === 'script_ready' ? 'Script Ready' : 'In Progress'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {proj.scenes?.length || 4} Scenes
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              18-Point Continuity Gate
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Single location & dialogue pacing verification.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Indian Regional Dialects
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Devanagari script support & natural spoken phrasing.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Magnific GPU Rendering
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Photorealistic character anchoring & video generation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
