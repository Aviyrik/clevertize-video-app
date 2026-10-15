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
}) {
  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '36px 24px 60px' }}>
      {/* Welcome Banner */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'var(--accent-subtle)',
            border: '1px solid var(--accent-glow)',
            borderRadius: 20,
            padding: '5px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--accent-primary)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          <Clapperboard size={14} />
          Clevertize Script Intelligence V2
        </div>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 800,
            margin: '0 0 12px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
          }}
        >
          How would you like to create your commercial?
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
            maxWidth: 620,
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Move from an idea, existing script, or store link to an authentic 4-scene video ad with AI visual continuity and quality verification.
        </p>
      </div>

      {/* Existing Project Continuity Banner (if brand exists) */}
      {businessName && (
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Store size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                  }}
                >
                  {businessType || 'Retail Store'}
                </span>
                {town && (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>· {town}</span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                Brand profile saved. You can start a new film or continue where you left off.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onContinueActiveProject}
            style={{
              backgroundColor: 'var(--bg-active)',
              border: '1px solid var(--border-strong)',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>Open Studio for {businessName}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* The Three Creation Entry Points Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 20,
          marginBottom: 36,
        }}
      >
        {/* Entry Point 1: Start with a Brief */}
        <div
          onClick={onStartBrief}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
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
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
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
                marginBottom: 6,
              }}
            >
              Guided Workflow
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Start with a Brief
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Describe your business, offer, or customer story. Our creative engine drafts ranked consumer tensions, creator hooks, and a 4-scene video script.
            </p>
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)' }}>
              Launch Studio Flow
            </span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Entry Point 2: Start with an Existing Script */}
        <div
          onClick={onOpenScriptModal}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#10B981';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
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
                marginBottom: 6,
              }}
            >
              Fast Track
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Start with an Existing Script
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Already have a script or concept? Paste your 4 scenes. We'll run the 18-point Section 8 Quality Gate and take you straight to Script Studio ready for video.
            </p>
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>
              Import & Validate Script
            </span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Entry Point 3: Start with a Website URL */}
        <div
          onClick={onOpenUrlModal}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#38BDF8';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
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
                marginBottom: 6,
              }}
            >
              Automated Intelligence
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              Start with a Website URL
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Enter your store website, business page, or catalog link. We'll extract your brand identity, featured offerings, and value proposition automatically.
            </p>
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#38BDF8' }}>
              Scan & Analyze Website
            </span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowRight size={14} />
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
          paddingTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <CheckCircle2 size={16} style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              18-Point Continuity Gate
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Guarantees single location, dialogue limits, and zero on-screen text clutter.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <CheckCircle2 size={16} style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Indian Regional Dialects
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Devanagari script support for Hindi and accurate local spoken phrasing.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <CheckCircle2 size={16} style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Magnific GPU Rendering
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Character anchoring and photorealistic cinematic video generation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
