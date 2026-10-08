import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Edit3,
  X,
  Plus,
  Trash2,
  Lightbulb,
  Tag,
  Store,
  Layers,
  HelpCircle,
  Camera,
  Quote,
  ShieldCheck,
  Clapperboard,
  RefreshCw,
  Film
} from 'lucide-react';

/**
 * 1. RESEARCH INSIGHTS BANNER
 * Compact "Here's what we found" card with Footprint Tier, Audience Insight,
 * Creative Opportunity, Competitive Pattern, and Smart Gap Question.
 */
export function ResearchInsightsBanner({
  researchData,
  isResearching,
  dismissed,
  onDismiss,
  onApplyInsights,
  selectedGapOption,
  setSelectedGapOption,
  customGapAnswer,
  setCustomGapAnswer
}) {
  if (dismissed) return null;

  if (isResearching) {
    return (
      <div style={{
        padding: '12px 16px',
        borderRadius: 8,
        backgroundColor: 'var(--bg-surface)',
        border: '1px dashed var(--accent-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        animation: 'pulse 2s infinite'
      }}>
        <Sparkles size={16} className="icon-spinner" style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>AI Creative Director:</strong> Analyzing public brand footprint and category opportunities in the background…
        </div>
      </div>
    );
  }

  if (!researchData) return null;

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid rgba(99, 102, 241, 0.35)',
      borderRadius: 12,
      padding: '18px 20px',
      marginBottom: 20,
      boxShadow: '0 4px 18px rgba(99, 102, 241, 0.08)',
      position: 'relative'
    }}>
      {/* Header with Tier badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: 'var(--accent-subtle)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Here’s what we found
            </span>
            <span style={{
              marginLeft: 8,
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-subtle)'
            }}>
              {researchData.tierLabel || `Tier ${researchData.tier ?? 0}`}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}
          title="Dismiss insights"
        >
          <X size={16} />
        </button>
      </div>

      {/* 3 Core Insights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 4 }}>
            🎯 Audience Insight
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {researchData.audienceInsight}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--success)', marginBottom: 4 }}>
            💡 Creative Opportunity
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {researchData.creativeOpportunity}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: 12, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4 }}>
            ⚡ Competitive Pattern
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {researchData.competitivePattern}
          </div>
        </div>
      </div>

      {/* Single Smart Gap Question if present */}
      {researchData.informationGap && researchData.informationGap.question && (
        <div style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px dashed var(--accent-primary)',
          borderRadius: 8,
          padding: 12,
          marginBottom: 14
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            ❓ {researchData.informationGap.question}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {(researchData.informationGap.options || []).map((opt, oIdx) => {
              const isSelected = selectedGapOption === opt;
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => setSelectedGapOption(opt)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {opt}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedGapOption('Other')}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: selectedGapOption === 'Other' ? 700 : 500,
                backgroundColor: selectedGapOption === 'Other' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                color: selectedGapOption === 'Other' ? '#ffffff' : 'var(--text-secondary)',
                border: selectedGapOption === 'Other' ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                cursor: 'pointer'
              }}
            >
              Other
            </button>
          </div>
          {selectedGapOption === 'Other' && (
            <input
              type="text"
              value={customGapAnswer}
              onChange={(e) => setCustomGapAnswer(e.target.value)}
              placeholder="Specify your target audience or primary goal..."
              style={{ width: '100%', marginTop: 8, padding: '6px 10px', fontSize: 12 }}
            />
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            backgroundColor: 'transparent',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            cursor: 'pointer'
          }}
        >
          Ignore
        </button>
        <button
          type="button"
          onClick={onApplyInsights}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 1px 4px var(--accent-glow)'
          }}
        >
          <Check size={12} />
          <span>Use These Insights</span>
        </button>
      </div>
    </div>
  );
}

/**
 * 2. CREATIVE DNA BAR
 * Persistent compact widget tracking approved choices with [Edit] triggers.
 */
export function CreativeDNABar({ creativeDNA, onEditPanel }) {
  const { direction, hook, plot, story, constraints } = creativeDNA;
  const hasAnyDNA = direction || hook || plot || story;

  if (!hasAnyDNA) return null;

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 10,
      padding: '10px 14px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Layers size={12} />
          <span>Creative DNA:</span>
        </span>

        {/* Direction Chip */}
        {direction && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            borderRadius: 6,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-primary)'
          }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Direction:</span>
            <strong style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {direction.title}
            </strong>
            <button
              type="button"
              onClick={() => onEditPanel('direction')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontSize: 10, fontWeight: 700 }}
            >
              Edit
            </button>
          </div>
        )}

        {/* Hook Chip */}
        {hook && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            borderRadius: 6,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-primary)'
          }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Hook:</span>
            <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
              "{hook.hookLine || hook.visualAction}"
            </span>
            <button
              type="button"
              onClick={() => onEditPanel('hook')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontSize: 10, fontWeight: 700 }}
            >
              Edit
            </button>
          </div>
        )}

        {/* Plot Chip */}
        {plot && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            borderRadius: 6,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-primary)'
          }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Plot:</span>
            <strong style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {plot.title}
            </strong>
            <button
              type="button"
              onClick={() => onEditPanel('plot')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontSize: 10, fontWeight: 700 }}
            >
              Edit
            </button>
          </div>
        )}

        {/* Format & World Chip */}
        {story && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            borderRadius: 6,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-primary)'
          }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Format:</span>
            <strong style={{ fontWeight: 600 }}>
              {story.format || 'Storytelling'}
            </strong>
            <button
              type="button"
              onClick={() => onEditPanel('story')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontSize: 10, fontWeight: 700 }}
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 3. PROGRESSIVE CREATIVE PANELS (STEP 3 WORKSPACE)
 * Direction -> Hook -> Plot -> Story/World -> Constraints & Production
 */
export function CreativePanelsWorkspace({
  creativePanel,
  setCreativePanel,
  // Directions
  directionsList,
  selectedDirection,
  setSelectedDirection,
  customDirection,
  setCustomDirection,
  isLoadingDirections,
  // Hooks
  hooksList,
  selectedHook,
  setSelectedHook,
  customHook,
  setCustomHook,
  isLoadingHooks,
  // Plots
  plotsList,
  selectedPlot,
  setSelectedPlot,
  customPlot,
  setCustomPlot,
  isLoadingPlots,
  // Story World
  storyWorldData,
  setStoryWorldData,
  isLoadingStory,
  // Constraints
  constraintsList,
  setConstraintsList,
  avoidList,
  setAvoidList,
  newConstraintInput,
  setNewConstraintInput,
  newAvoidInput,
  setNewAvoidInput,
  // Production options
  userContext,
  updateUserContext,
  handleFileUpload,
  PLATFORM_PRESETS,
  // Actions
  onSynthesizeMasterScript,
  isBusy,
  onBackToBrief
}) {
  const PANELS = [
    { id: 'direction', label: '1. Direction', icon: Lightbulb },
    { id: 'hook', label: '2. Hook', icon: Sparkles },
    { id: 'plot', label: '3. Plot Line', icon: Film },
    { id: 'story', label: '4. Story & World', icon: Store },
    { id: 'constraints', label: '5. Production', icon: Layers },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Fast Path Banner */}
      <div style={{
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid var(--accent-primary)',
        borderRadius: 10,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <Sparkles size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              AI Creative Director Fast Path (~30s)
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Best-in-class strategic direction, hook, and plot are pre-recommended. Synthesize now or customize below.
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => onSynthesizeMasterScript()}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: isBusy ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 8px var(--accent-glow)'
          }}
        >
          <Sparkles size={14} />
          <span>Synthesize Script (Recommended Choices)</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Progressive Panel Tabs */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', borderBottom: '1px solid var(--border-default)', paddingBottom: 6 }}>
        {PANELS.map((p) => {
          const isActive = creativePanel === p.id;
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setCreativePanel(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 6,
                border: 'none',
                backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          PANEL 1: CREATIVE DIRECTION (3-5 Territories)
          ======================================================== */}
      {creativePanel === 'direction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
              Creative Direction Territories
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Based on your brief and research, these are the strongest commercial angles for your video.
            </p>
          </div>

          {isLoadingDirections ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              Formulating strategic territories…
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {directionsList.map((dir, idx) => {
                const isSelected = selectedDirection?.id === dir.id || (!selectedDirection && dir.recommended);
                return (
                  <div
                    key={dir.id || idx}
                    onClick={() => setSelectedDirection(dir)}
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                      borderRadius: 10,
                      padding: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)' }}>
                        0{idx + 1}
                      </span>
                      {dir.recommended && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          backgroundColor: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--accent-primary)',
                          padding: '2px 8px',
                          borderRadius: 4
                        }}>
                          Recommended
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {dir.title}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>
                      {dir.description || dir.concept}
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                      Angle: {dir.angle}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Manual Direction Override */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              + Add My Own Creative Direction / Note
            </div>
            <input
              type="text"
              value={customDirection}
              onChange={(e) => setCustomDirection(e.target.value)}
              placeholder='e.g. Make this about small kitchens, not pricing... or Use a more humorous angle'
              style={{ width: '100%', padding: '8px 12px', fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <button
              type="button"
              onClick={onBackToBrief}
              style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: 12, cursor: 'pointer' }}
            >
              Back to Brief
            </button>
            <button
              type="button"
              onClick={() => setCreativePanel('hook')}
              style={{ padding: '8px 20px', borderRadius: 6, backgroundColor: 'var(--accent-primary)', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>Next: Hook Intelligence</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          PANEL 2: HOOK INTELLIGENCE (5-8 Multi-Archetype Hooks)
          ======================================================== */}
      {creativePanel === 'hook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
              Opening Hook Intelligence (First 3 Seconds)
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              The hook stops the scroll on Instagram Reels and YouTube Shorts. Select the opening line and physical action.
            </p>
          </div>

          {isLoadingHooks ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              Formulating scroll-stopping viral hooks…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {hooksList.map((h, idx) => {
                const isSelected = selectedHook?.id === h.id || (!selectedHook && h.recommended);
                return (
                  <div
                    key={h.id || idx}
                    onClick={() => setSelectedHook(h)}
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                      borderRadius: 10,
                      padding: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--accent-primary)',
                          padding: '2px 8px',
                          borderRadius: 4
                        }}>
                          {h.archetype || h.type || 'Hook'}
                        </span>
                        {h.recommended && (
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: 4 }}>
                            Recommended
                          </span>
                        )}
                      </div>
                      <div style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: isSelected ? '5px solid var(--accent-primary)' : '2px solid var(--border-default)',
                        backgroundColor: '#ffffff'
                      }} />
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      "{h.hookLine || h.text}"
                    </div>

                    {h.visualAction && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <Camera size={13} style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent-primary)' }} />
                        <span>Action: {h.visualAction}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Hook */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              + Add Custom Opening Hook
            </div>
            <input
              type="text"
              value={customHook}
              onChange={(e) => setCustomHook(e.target.value)}
              placeholder="e.g. Write your custom first spoken line or visual gag..."
              style={{ width: '100%', padding: '8px 12px', fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setCreativePanel('direction')}
              style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: 12, cursor: 'pointer' }}
            >
              Back to Direction
            </button>
            <button
              type="button"
              onClick={() => setCreativePanel('plot')}
              style={{ padding: '8px 20px', borderRadius: 6, backgroundColor: 'var(--accent-primary)', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>Next: Plot Line</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          PANEL 3: PLOT LINE (3-5 Narrative Arcs)
          ======================================================== */}
      {creativePanel === 'plot' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
              Narrative Plot Lines
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Each plot connects the hook to a relatable conflict and satisfying commercial resolution.
            </p>
          </div>

          {isLoadingPlots ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              Formulating structured 4-scene narrative arcs…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {plotsList.map((p, idx) => {
                const isSelected = selectedPlot?.id === p.id || (!selectedPlot && p.recommended);
                return (
                  <div
                    key={p.id || idx}
                    onClick={() => setSelectedPlot(p)}
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                      borderRadius: 10,
                      padding: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {p.title}
                        </span>
                        {p.recommended && (
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: 4 }}>
                            Recommended
                          </span>
                        )}
                      </div>
                      <div style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: isSelected ? '5px solid var(--accent-primary)' : '2px solid var(--border-default)',
                        backgroundColor: '#ffffff'
                      }} />
                    </div>

                    <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      <strong>Core Idea:</strong> {p.coreIdea}
                    </div>

                    {/* Beats preview */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                      <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: 6 }}>
                        <strong>Conflict:</strong> {p.conflictBeat || p.conflict || 'Relatable friction'}
                      </div>
                      <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: 6 }}>
                        <strong>Payoff:</strong> {p.payoffBeat || p.payoff || 'Earned brand relief'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Plot */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              + Add Custom Plot Arc
            </div>
            <input
              type="text"
              value={customPlot}
              onChange={(e) => setCustomPlot(e.target.value)}
              placeholder="e.g. Two friends argue over where to eat until one shows the secret..."
              style={{ width: '100%', padding: '8px 12px', fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setCreativePanel('hook')}
              style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: 12, cursor: 'pointer' }}
            >
              Back to Hook
            </button>
            <button
              type="button"
              onClick={() => setCreativePanel('story')}
              style={{ padding: '8px 20px', borderRadius: 6, backgroundColor: 'var(--accent-primary)', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>Next: Story & World</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          PANEL 4: STORY & WORLD (Format, Beats, Characters, Location)
          ======================================================== */}
      {creativePanel === 'story' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
              Story Format & Visual World
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Locks 1 continuous room (Rule M13) and 2 characters for high AI video stability.
            </p>
          </div>

          {/* Format Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Storytelling Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
              {['Storytelling', 'UGC / Creator-style', 'Product Demo', 'Situational Comedy'].map((fmt) => {
                const isSelected = (storyWorldData?.format || userContext.creativeStyle) === fmt;
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => {
                      updateUserContext('creativeStyle', fmt);
                      if (storyWorldData) setStoryWorldData({ ...storyWorldData, format: fmt });
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {fmt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single Continuous Location Card */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Store size={16} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Locked Single Room Setting (Rule M13)
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
              All 4 scenes share the same room layout and lighting so video generative models maintain continuous physical consistency.
            </p>
            <textarea
              rows={2}
              value={storyWorldData?.setting || userContext.environment || `A bright, clean ${userContext.businessType || 'store'} interior in ${userContext.town || 'the city'} with warm lighting and wooden service counters.`}
              onChange={(e) => {
                updateUserContext('environment', e.target.value);
                if (storyWorldData) setStoryWorldData({ ...storyWorldData, setting: e.target.value });
              }}
              style={{ width: '100%', padding: '8px 12px', fontSize: 12 }}
            />
          </div>

          {/* 4 Beats Preview */}
          {storyWorldData?.beats && Array.isArray(storyWorldData.beats) && (
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                4-Beat Narrative Choreography
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                {storyWorldData.beats.map((b, bIdx) => (
                  <div key={bIdx} style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 6, padding: '8px 10px', fontSize: 11 }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 2 }}>
                      Beat 0{bIdx + 1}: {b.beat || b.name || `Scene ${bIdx + 1}`}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {b.action || b.description || b.dialogue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setCreativePanel('plot')}
              style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: 12, cursor: 'pointer' }}
            >
              Back to Plot
            </button>
            <button
              type="button"
              onClick={() => setCreativePanel('constraints')}
              style={{ padding: '8px 20px', borderRadius: 6, backgroundColor: 'var(--accent-primary)', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>Next: Constraints & Production</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          PANEL 5: CONSTRAINTS & PRODUCTION OPTIONS
          ======================================================== */}
      {creativePanel === 'constraints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
              Creative Constraints & Production Settings
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Specify strict guardrails for what must appear or be avoided in the script.
            </p>
          </div>

          {/* Constraints Lists: "Things I want" & "Things to avoid" */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {/* Things I want */}
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', marginBottom: 8 }}>
                ✓ Things I Want in the Video
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {constraintsList.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      color: 'var(--success)',
                      fontSize: 11
                    }}
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => setConstraintsList(constraintsList.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={newConstraintInput}
                  onChange={(e) => setNewConstraintInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newConstraintInput.trim()) {
                      e.preventDefault();
                      setConstraintsList([...constraintsList, newConstraintInput.trim()]);
                      setNewConstraintInput('');
                    }
                  }}
                  placeholder="e.g. Show fresh packaging, mention 100% pure"
                  style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newConstraintInput.trim()) {
                      setConstraintsList([...constraintsList, newConstraintInput.trim()]);
                      setNewConstraintInput('');
                    }
                  }}
                  style={{ padding: '6px 12px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: 12, cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Things to avoid */}
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--error)', marginBottom: 8 }}>
                ✕ Things to Avoid
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {avoidList.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--error)',
                      fontSize: 11
                    }}
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => setAvoidList(avoidList.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={newAvoidInput}
                  onChange={(e) => setNewAvoidInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newAvoidInput.trim()) {
                      e.preventDefault();
                      setAvoidList([...avoidList, newAvoidInput.trim()]);
                      setNewAvoidInput('');
                    }
                  }}
                  placeholder="e.g. No corporate jargon, don't mention price"
                  style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newAvoidInput.trim()) {
                      setAvoidList([...avoidList, newAvoidInput.trim()]);
                      setNewAvoidInput('');
                    }
                  }}
                  style={{ padding: '6px 12px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: 12, cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Platform & Duration */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Platform
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {PLATFORM_PRESETS.slice(0, 4).map((p) => {
                    const isSelected = (userContext.platform || 'Instagram Reels / 9:16') === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => updateUserContext('platform', p.id)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: isSelected ? 700 : 500,
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Duration
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {['10s', '15s', '20s', '25s'].map((d) => {
                    const isSelected = (userContext.duration || '15s') === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateUserContext('duration', d)}
                        style={{
                          padding: '6px 4px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: isSelected ? 700 : 500,
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Master Synthesis Trigger */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 12 }}>
            <button
              type="button"
              onClick={() => setCreativePanel('story')}
              style={{ padding: '10px 16px', borderRadius: 8, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: 13, cursor: 'pointer' }}
            >
              Back to Story
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => onSynthesizeMasterScript()}
              style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: isBusy ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
              }}
            >
              <Sparkles size={18} />
              <span>Synthesize Master Script & Review</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 4. SCENE-LEVEL AI REWRITE MODAL
 * Targeted precision scene rewriting with single room & character locking.
 */
export function SceneAIRewriteModal({
  isOpen,
  onClose,
  sceneIndex,
  currentSceneText,
  onApplyRewrite,
  isRewriting
}) {
  const [instruction, setInstruction] = useState('');

  if (!isOpen) return null;

  const PRESETS = [
    { label: '⚡ Make this funnier', prompt: 'Make the dialogue witty and situational, with playful comedic timing.' },
    { label: '✂️ Shorter dialogue', prompt: 'Cut the dialogue down to punchy one-liners. Let physical action drive the moment.' },
    { label: '🗣️ Use Hinglish', prompt: 'Adapt spoken lines into natural conversational urban Hinglish.' },
    { label: '📦 Feature product earlier', prompt: 'Introduce the product interaction right away in the first action beat.' },
    { label: '🎭 More tension', prompt: 'Raise the stakes and urgency of the customer problem.' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          maxWidth: 540,
          width: '100%',
          padding: 24,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              AI Scene Rewriter · Scene 0{sceneIndex + 1}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
          Give the AI a creative note to rewrite only Scene {sceneIndex + 1}. Room and character continuity will stay strictly locked.
        </p>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInstruction(p.prompt)}
              style={{
                fontSize: 11,
                padding: '4px 8px',
                borderRadius: 4,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g. Make Ramesh tease Sunita about running out of groceries again..."
          style={{ width: '100%', padding: '10px 12px', fontSize: 13, marginBottom: 16 }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isRewriting}
            style={{ padding: '8px 14px', borderRadius: 6, backgroundColor: 'transparent', border: '1px solid var(--border-default)', fontSize: 12, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isRewriting || !instruction.trim()}
            onClick={() => onApplyRewrite(instruction)}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: isRewriting || !instruction.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {isRewriting && <RefreshCw size={13} className="icon-spinner" />}
            <span>{isRewriting ? 'Rewriting Scene…' : 'Rewrite Scene'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 5. PRODUCTION SHOT SPECIFICATION VIEW (IN SCRIPT REVIEW)
 * Renders technical breakdown (Static World vs Motion Vectors) for engineers & DPs.
 */
export function ProductionShotSpecView({ shotSpec, scenes }) {
  if (!shotSpec || !shotSpec.shots) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
        Shot Specification compiling with neural video frames…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Static World Lock Card */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', marginBottom: 6 }}>
          🔒 Static World Constraints (Rule M13)
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>Setting:</strong> {shotSpec.staticWorld?.setting || 'Locked Single Room'}<br />
          <strong>Characters:</strong> {shotSpec.staticWorld?.characters || 'Locked Casting'}
        </div>
      </div>

      {/* 4 Shots Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shotSpec.shots.map((sh, idx) => (
          <div key={idx} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                Shot 0{idx + 1} Specification
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {sh.shotSize || 'Medium'}
                </span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {sh.cameraMotion || 'Slow push'}
                </span>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
              <strong>Visual Action:</strong> {sh.action}
            </div>

            {sh.dialogueCue && (
              <div style={{ fontSize: 12, color: 'var(--text-primary)', backgroundColor: 'var(--bg-elevated)', padding: '6px 10px', borderRadius: 6 }}>
                <strong>Spoken Acting Cue:</strong> "{sh.dialogueCue}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
