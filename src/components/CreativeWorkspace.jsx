import React, { useState } from 'react';
import {
  Sparkles,
  Check,
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
  Layers,
  Camera,
  Quote,
  ShieldCheck,
  Clapperboard,
  RefreshCw,
  Film,
  MessageSquare,
  Smile,
  Package,
  Eye,
  AlertCircle,
  HelpCircle,
  User,
  MapPin,
  Lock
} from 'lucide-react';

/**
 * 1. RESEARCH INSIGHTS BANNER (V3: Lightweight & Condensed)
 */
export function ResearchInsightsBanner({
  researchData,
  isResearching,
  dismissed,
  onDismiss,
  selectedGapOption,
  setSelectedGapOption,
  customGapAnswer,
  setCustomGapAnswer
}) {
  if (dismissed) return null;

  if (isResearching) {
    return (
      <div style={{
        padding: '10px 14px',
        borderRadius: 8,
        backgroundColor: 'var(--bg-surface)',
        border: '1px dashed var(--accent-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
      }}>
        <Sparkles size={15} className="icon-spinner" style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Researching the brand & category…</strong> Analyzing audience footprint in the background.
        </div>
      </div>
    );
  }

  if (!researchData) return null;

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid rgba(99, 102, 241, 0.3)',
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 16,
      boxShadow: '0 2px 12px rgba(99, 102, 241, 0.05)',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={15} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            Research Complete
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--accent-primary)',
            border: '1px solid var(--border-subtle)'
          }}>
            {researchData.tierLabel || `Tier ${researchData.tier ?? 0}`}
          </span>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2 }}
          title="Dismiss insights"
        >
          <X size={15} />
        </button>
      </div>

      {/* Condensed 2-column cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: researchData.informationGap ? 10 : 0 }}>
        {researchData.audienceInsight && (
          <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 6, padding: '8px 10px', border: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', fontSize: 10, display: 'block', marginBottom: 2 }}>
              Audience Insight
            </span>
            {researchData.audienceInsight}
          </div>
        )}
        {researchData.creativeOpportunity && (
          <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 6, padding: '8px 10px', border: '1px solid var(--border-subtle)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', fontSize: 10, display: 'block', marginBottom: 2 }}>
              Creative Opportunity
            </span>
            {researchData.creativeOpportunity}
          </div>
        )}
      </div>

      {/* Single High-Value Gap Question */}
      {researchData.informationGap?.question && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            {researchData.informationGap.question}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {researchData.informationGap.options?.map((opt, idx) => {
              const isSelected = selectedGapOption === opt;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedGapOption(opt)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: 11,
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 2. YOUR CREATIVE PLAN (V3: Compact Chips beneath Stage Stepper)
 */
export function CreativeDNABar({ creativeDNA, canonicalFormat, onEditPanel }) {
  const { direction, hook, plot, story } = creativeDNA || {};
  const activeFormat = canonicalFormat || creativeDNA?.format || story?.format || 'UGC / Creator-style';
  const formatLabel = activeFormat === 'UGC / Creator-style' || activeFormat === 'UGC'
    ? 'UGC / Creator'
    : activeFormat === 'Situational Comedy' || activeFormat === 'Comedy'
    ? 'Comedy'
    : activeFormat;

  const hasAny = Boolean(direction || hook || plot || story || canonicalFormat || creativeDNA?.format);
  if (!hasAny) return null;

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      padding: '8px 12px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Layers size={11} />
        <span>Your Creative Plan:</span>
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {direction && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '2px 8px',
            borderRadius: 6,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-primary)'
          }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Dir:</span>
            <strong style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {direction.title}
            </strong>
            <button
              type="button"
              onClick={() => onEditPanel('direction')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontSize: 10, fontWeight: 700 }}
              title="Edit Direction"
            >
              Edit
            </button>
          </div>
        )}

        {hook && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '2px 8px',
            borderRadius: 6,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-primary)'
          }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Hook:</span>
            <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {hook.archetype || hook.hookLine || 'Hook'}
            </span>
            <button
              type="button"
              onClick={() => onEditPanel('hook')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontSize: 10, fontWeight: 700 }}
              title="Edit Hook"
            >
              Edit
            </button>
          </div>
        )}

        {plot && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '2px 8px',
            borderRadius: 6,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-primary)'
          }}>
            <span style={{ color: 'var(--text-tertiary)' }}>Plot:</span>
            <strong style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {plot.title}
            </strong>
            <button
              type="button"
              onClick={() => onEditPanel('plot')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontSize: 10, fontWeight: 700 }}
              title="Edit Plot"
            >
              Edit
            </button>
          </div>
        )}

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 8px',
          borderRadius: 6,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          fontSize: 11,
          color: 'var(--text-primary)'
        }}>
          <span style={{ color: 'var(--text-tertiary)' }}>Format:</span>
          <strong style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--accent-primary)' }}>
            {formatLabel}
          </strong>
          <button
            type="button"
            onClick={() => onEditPanel('story')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: 0, fontSize: 10, fontWeight: 700 }}
            title="Edit Video Format & Story"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. PROGRESSIVE STEPPER HEADER (01 Direction → 02 Hook → 03 Plot → 04 Story & Format → 05 Script)
 */
function CreativeProgressiveStepper({
  currentStage,
  completedStages,
  onNavigateStage
}) {
  const STAGES = [
    { id: 'direction', num: '01', label: 'Direction' },
    { id: 'hook', num: '02', label: 'Hook' },
    { id: 'plot', num: '03', label: 'Plot' },
    { id: 'story', num: '04', label: 'Story & Format' },
    { id: 'script', num: '05', label: 'Script Review' },
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      overflowX: 'auto',
      paddingBottom: 4,
      marginBottom: 10,
    }}>
      {STAGES.map((st, idx) => {
        const isCurrent = currentStage === st.id;
        const isCompleted = completedStages.includes(st.id);
        const canClick = isCompleted || isCurrent;

        return (
          <React.Fragment key={st.id}>
            <button
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onNavigateStage(st.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                border: isCurrent ? '1px solid var(--accent-primary)' : '1px solid transparent',
                backgroundColor: isCurrent
                  ? 'var(--bg-active)'
                  : isCompleted
                  ? 'var(--bg-elevated)'
                  : 'transparent',
                color: isCurrent
                  ? 'var(--accent-primary)'
                  : isCompleted
                  ? 'var(--text-primary)'
                  : 'var(--text-tertiary)',
                opacity: canClick ? 1 : 0.45,
                cursor: canClick ? 'pointer' : 'not-allowed',
                fontSize: 12,
                fontWeight: isCurrent ? 700 : 500,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {isCompleted && !isCurrent ? (
                <Check size={12} style={{ color: 'var(--success)' }} />
              ) : (
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  opacity: 0.75
                }}>
                  {st.num}
                </span>
              )}
              <span>{st.label}</span>
            </button>

            {idx < STAGES.length - 1 && (
              <span style={{ color: 'var(--border-default)', fontSize: 11, userSelect: 'none' }}>
                →
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * 4. LOADING SKELETON
 */
function CreativeLoadingState({ message }) {
  return (
    <div style={{
      padding: '36px 20px',
      textAlign: 'center',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
    }}>
      <Sparkles size={24} className="icon-spinner" style={{ color: 'var(--accent-primary)' }} />
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
        {message}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 360 }}>
        Synthesizing high-retention commercial patterns specifically for your audience…
      </div>
    </div>
  );
}

/**
 * 5. MAIN CREATIVE WORKSPACE (ONE CREATIVE DECISION AT A TIME)
 */
export function CreativePanelsWorkspace({
  creativePanel = 'direction',
  setCreativePanel,
  // Directions
  directionsList = [],
  selectedDirection = null,
  setSelectedDirection,
  customDirection = '',
  setCustomDirection,
  isLoadingDirections = false,
  onLoadDirections,
  // Hooks
  hooksList = [],
  selectedHook = null,
  setSelectedHook,
  customHook = '',
  setCustomHook,
  isLoadingHooks = false,
  onLoadHooks,
  // Plots
  plotsList = [],
  selectedPlot = null,
  setSelectedPlot,
  customPlot = '',
  setCustomPlot,
  isLoadingPlots = false,
  onLoadPlots,
  // Story World & Format
  storyWorldData = null,
  setStoryWorldData,
  isLoadingStory = false,
  onLoadStory,
  // Constraints
  constraintsList = [],
  setConstraintsList,
  avoidList = [],
  setAvoidList,
  newConstraintInput = '',
  setNewConstraintInput,
  newAvoidInput = '',
  setNewAvoidInput,
  // Production / Brand Options
  userContext = {},
  updateUserContext,
  // Actions
  onSynthesizeMasterScript,
  isBusy = false,
  onBackToBrief,
  onBackToPreferences,
  onLanguageChange,
  onFormatChange,
}) {
  const [isConstraintsExpanded, setIsConstraintsExpanded] = useState(false);
  const [downstreamWarning, setDownstreamWarning] = useState(false);
  const [previousDirectionId, setPreviousDirectionId] = useState(selectedDirection?.id);

  // Inline editing state for Compact World Anchors (Lead, Supporting, Setting, Product)
  const [editingCard, setEditingCard] = useState(null);
  const [editLeadName, setEditLeadName] = useState('');
  const [editLeadRole, setEditLeadRole] = useState('');
  const [editSuppName, setEditSuppName] = useState('');
  const [editSuppRole, setEditSuppRole] = useState('');
  const [editSettingName, setEditSettingName] = useState('');
  const [editProductName, setEditProductName] = useState('');

  // Manage completed stages
  const completedStages = [];
  if (selectedDirection || customDirection) completedStages.push('direction');
  if (selectedHook || customHook) completedStages.push('hook');
  if (selectedPlot || customPlot) completedStages.push('plot');
  if (storyWorldData) completedStages.push('story');

  // Handle stage change from stepper
  const handleNavigateStage = (stageId) => {
    setCreativePanel(stageId);
  };

  // Helper when advancing from Direction to Hook
  const handleProceedToHook = () => {
    if (downstreamWarning) {
      // Invalidate downstream
      onLoadHooks?.(true);
      setDownstreamWarning(false);
    } else if (!hooksList.length) {
      onLoadHooks?.(false);
    }
    setCreativePanel('hook');
  };

  // Helper when advancing from Hook to Plot
  const handleProceedToPlot = () => {
    if (!plotsList.length) {
      onLoadPlots?.(false);
    }
    setCreativePanel('plot');
  };

  // Helper when advancing from Plot to Story
  const handleProceedToStory = () => {
    if (!storyWorldData) {
      onLoadStory?.(false);
    }
    setCreativePanel('story');
  };

  // Detect backward edit on Direction
  const handleSelectDirection = (dir) => {
    setSelectedDirection(dir);
    if (completedStages.includes('hook') && dir.id !== previousDirectionId) {
      setDownstreamWarning(true);
    }
  };

  // Format presets for Stage 4
  const FORMAT_PRESETS = [
    {
      id: 'UGC / Creator-style',
      label: 'UGC / Creator',
      icon: Camera,
      tagline: 'Direct-to-camera, fast hook & authentic mobile energy',
    },
    {
      id: 'Storytelling',
      label: 'Storytelling',
      icon: Clapperboard,
      tagline: '2-character emotional dilemma & relatable narrative arc',
    },
    {
      id: 'Product Demo',
      label: 'Product Demo',
      icon: Package,
      tagline: 'Product in focus within 4s, tactile sensory proof',
    },
    {
      id: 'Situational Comedy',
      label: 'Comedy',
      icon: Smile,
      tagline: 'Humorous setup, comic escalation & punchline payoff',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. Progressive Stepper Header */}
      <CreativeProgressiveStepper
        currentStage={creativePanel}
        completedStages={completedStages}
        onNavigateStage={handleNavigateStage}
      />

      {/* Downstream Invalidation Notice */}
      {downstreamWarning && (
        <div style={{
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-primary)' }}>
            <AlertCircle size={15} style={{ color: '#eab308' }} />
            <span>Changing this territory will update downstream hooks, plot, and story options.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onLoadHooks?.(true);
              setDownstreamWarning(false);
              setCreativePanel('hook');
            }}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Update Downstream
          </button>
        </div>
      )}

      {/* ========================================================
          STAGE 1: DIRECTION (3 Visual Cards)
          ======================================================== */}
      {creativePanel === 'direction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 2px', color: 'var(--text-primary)' }}>
              Choose Creative Direction
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              The strategic territory and customer tension for your video.
            </p>
          </div>

          {isLoadingDirections || (!directionsList?.length && !customDirection) ? (
            <CreativeLoadingState message="Finding strong creative territories…" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {(directionsList || []).map((dir, idx) => {
                const isSelected = selectedDirection?.id === dir.id || (!selectedDirection && dir.recommended);
                return (
                  <div
                    key={dir.id || idx}
                    onClick={() => handleSelectDirection(dir)}
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                      borderRadius: 10,
                      padding: 16,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      position: 'relative',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--text-tertiary)',
                          fontFamily: "'JetBrains Mono', monospace"
                        }}>
                          0{idx + 1}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {dir.title}
                        </span>
                      </div>

                      {dir.recommended && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          backgroundColor: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--accent-primary)',
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>
                          Recommended
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, flex: 1 }}>
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

          {/* Custom Direction Override */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              + Create my own direction
            </div>
            <input
              type="text"
              value={customDirection}
              onChange={(e) => setCustomDirection(e.target.value)}
              placeholder="e.g. Focus on small kitchen storage, or highlight zero hidden charges"
              style={{ width: '100%', padding: '8px 12px', fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button
              type="button"
              onClick={onBackToPreferences || onBackToBrief}
              style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: 12, cursor: 'pointer' }}
            >
              {onBackToPreferences ? 'Back to Preferences' : 'Back to Brief'}
            </button>
            <button
              type="button"
              onClick={handleProceedToHook}
              style={{ padding: '8px 20px', borderRadius: 6, backgroundColor: 'var(--accent-primary)', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>Continue to Hook</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STAGE 2: HOOK (5-8 Multi-Archetype Cards)
          ======================================================== */}
      {creativePanel === 'hook' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 2px', color: 'var(--text-primary)' }}>
              Scroll-Stopping Hook
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              Opening 3-second moment across multi-archetype viral styles.
            </p>
          </div>

          {isLoadingHooks || (!hooksList?.length && !customHook) ? (
            <CreativeLoadingState message="Finding scroll-stopping hooks…" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
              {(hooksList || []).map((h, idx) => {
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
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--accent-primary)',
                      }}>
                        {h.archetype || 'Viral Hook'}
                      </span>
                      {h.recommended && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          backgroundColor: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--accent-primary)',
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>
                          Recommended
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      "{h.hookLine || h.text}"
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      <strong>Opening Action:</strong> {h.visualAction || h.visual}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Hook Override */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              + Add custom hook
            </div>
            <input
              type="text"
              value={customHook}
              onChange={(e) => setCustomHook(e.target.value)}
              placeholder="e.g. Write your own opening hook line..."
              style={{ width: '100%', padding: '8px 12px', fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setCreativePanel('direction')}
              style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: 12, cursor: 'pointer' }}
            >
              ← Back to Direction
            </button>
            <button
              type="button"
              onClick={handleProceedToPlot}
              style={{ padding: '8px 20px', borderRadius: 6, backgroundColor: 'var(--accent-primary)', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>Continue to Plot</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STAGE 3: PLOT (3 Miniature Story Strips)
          ======================================================== */}
      {creativePanel === 'plot' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 2px', color: 'var(--text-primary)' }}>
              Select Narrative Plot Line
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              3 structured story arcs resolving the customer friction.
            </p>
          </div>

          {isLoadingPlots || (!plotsList?.length && !customPlot) ? (
            <CreativeLoadingState message="Building story options…" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {(plotsList || []).map((p, idx) => {
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p.title}
                      </span>
                      {p.recommended && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          backgroundColor: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--accent-primary)',
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>
                          Recommended
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {p.coreIdea}
                    </div>

                    {/* Miniature 3-Frame Story Strip */}
                    <div style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderRadius: 6,
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--accent-primary)' }}>01 Hook:</strong> {p.hookBeat || 'Opening tension'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--warning)' }}>02 Conflict:</strong> {p.conflictBeat || 'Problem deepens'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--success)' }}>03 Payoff:</strong> {p.payoffBeat || 'Delightful resolution'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Plot Override */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              + Add custom plot
            </div>
            <input
              type="text"
              value={customPlot}
              onChange={(e) => setCustomPlot(e.target.value)}
              placeholder="e.g. A skeptic friend visits and gets convinced by a quick live comparison"
              style={{ width: '100%', padding: '8px 12px', fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setCreativePanel('hook')}
              style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: 12, cursor: 'pointer' }}
            >
              ← Back to Hook
            </button>
            <button
              type="button"
              onClick={handleProceedToStory}
              style={{ padding: '8px 20px', borderRadius: 6, backgroundColor: 'var(--accent-primary)', color: '#ffffff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>Continue to Story & Format</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STAGE 4: STORY & FORMAT (Visual Format Tiles + 4 Beats)
          ======================================================== */}
      {creativePanel === 'story' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 2px', color: 'var(--text-primary)' }}>
              Story & Format Architecture
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              Select your video format and review the 4 story beats before continuing to the script.
            </p>
          </div>

          {isLoadingStory ? (
            <CreativeLoadingState message="Shaping the story & format…" />
          ) : (
            <>
              {/* Decision A: Visual Format Tiles */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>1. Video Format</span>
                  <span style={{ fontSize: 10, color: 'var(--accent-primary)', textTransform: 'none', fontWeight: 600 }}>
                    Changes regenerate downstream beats
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  {FORMAT_PRESETS.map((fmt) => {
                    const currentFmt = userContext.creativeStyle || storyWorldData?.format || 'UGC / Creator-style';
                    const isSelected = currentFmt === fmt.id || (fmt.id.includes('UGC') && currentFmt.includes('UGC')) || (fmt.id.includes('Comedy') && currentFmt.includes('Comedy'));
                    const Icon = fmt.icon;
                    return (
                      <div
                        key={fmt.id}
                        onClick={() => {
                          const targetFmt = fmt.id;
                          updateUserContext('creativeStyle', targetFmt);
                          setStoryWorldData((prev) => (prev ? { ...prev, format: targetFmt } : { format: targetFmt }));
                          if (onFormatChange) {
                            onFormatChange(targetFmt);
                          } else {
                            onLoadStory?.(true, null, targetFmt);
                          }
                        }}
                        style={{
                          backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                          borderRadius: 8,
                          padding: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {fmt.label}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.3, marginTop: 2 }}>
                            {fmt.tagline}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Decision B: Compact World Anchors (Lead, Supporting, Setting, Product) */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  2. Story World Anchors
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  {/* Lead Card */}
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>👩</span>
                        <span>Lead</span>
                      </span>
                      {editingCard === 'lead' ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => {
                              const newLead = { ...storyWorldData?.character1, name: editLeadName || 'Lead', role: editLeadRole || 'Customer' };
                              setStoryWorldData((prev) => ({ ...prev, character1: newLead }));
                              updateUserContext('leadCharacter', `${newLead.name} (${newLead.role})`);
                              setEditingCard(null);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                          >
                            Save
                          </button>
                          <span style={{ color: 'var(--border-default)', fontSize: 10 }}>|</span>
                          <button
                            type="button"
                            onClick={() => setEditingCard(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 10, cursor: 'pointer', padding: 0 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const c1 = storyWorldData?.character1;
                            setEditLeadName(typeof c1 === 'object' ? c1.name : (userContext.leadCharacter?.split('—')[0]?.split('(')[0]?.trim() || (userContext.creativeStyle?.includes('UGC') ? 'Pooja' : 'Rohan')));
                            setEditLeadRole(typeof c1 === 'object' ? (c1.role || 'Host') : 'Customer');
                            setEditingCard('lead');
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                          [Edit]
                        </button>
                      )}
                    </div>
                    {editingCard === 'lead' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                        <input
                          type="text"
                          value={editLeadName}
                          onChange={(e) => setEditLeadName(e.target.value)}
                          placeholder="Name"
                          style={{ padding: '3px 6px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-default)' }}
                        />
                        <input
                          type="text"
                          value={editLeadRole}
                          onChange={(e) => setEditLeadRole(e.target.value)}
                          placeholder="Role (e.g. Customer, Creator)"
                          style={{ padding: '3px 6px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-default)' }}
                        />
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {typeof storyWorldData?.character1 === 'object' && storyWorldData.character1.name
                          ? `${storyWorldData.character1.name} · ${storyWorldData.character1.role || 'Host'}`
                          : (userContext.leadCharacter || (userContext.creativeStyle?.includes('UGC') ? 'Pooja · Creator' : 'Rohan · Store Lead'))}
                      </div>
                    )}
                  </div>

                  {/* Supporting Card */}
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>👨</span>
                        <span>Supporting</span>
                      </span>
                      {editingCard === 'supporting' ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => {
                              const newSupp = { ...storyWorldData?.character2, name: editSuppName || 'Supporting', role: editSuppRole || 'Partner' };
                              setStoryWorldData((prev) => ({ ...prev, character2: newSupp }));
                              updateUserContext('supportingCharacter', `${newSupp.name} (${newSupp.role})`);
                              setEditingCard(null);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                          >
                            Save
                          </button>
                          <span style={{ color: 'var(--border-default)', fontSize: 10 }}>|</span>
                          <button
                            type="button"
                            onClick={() => setEditingCard(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 10, cursor: 'pointer', padding: 0 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const c2 = storyWorldData?.character2;
                            setEditSuppName(typeof c2 === 'object' ? c2.name : (userContext.supportingCharacter?.split('—')[0]?.split('(')[0]?.trim() || 'Ananya'));
                            setEditSuppRole(typeof c2 === 'object' ? (c2.role || 'Customer') : 'Customer');
                            setEditingCard('supporting');
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                          [Edit]
                        </button>
                      )}
                    </div>
                    {editingCard === 'supporting' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                        <input
                          type="text"
                          value={editSuppName}
                          onChange={(e) => setEditSuppName(e.target.value)}
                          placeholder="Name"
                          style={{ padding: '3px 6px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-default)' }}
                        />
                        <input
                          type="text"
                          value={editSuppRole}
                          onChange={(e) => setEditSuppRole(e.target.value)}
                          placeholder="Role (e.g. Partner, Friend)"
                          style={{ padding: '3px 6px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-default)' }}
                        />
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {typeof storyWorldData?.character2 === 'object' && storyWorldData.character2.name
                          ? `${storyWorldData.character2.name} · ${storyWorldData.character2.role || 'Partner'}`
                          : (userContext.supportingCharacter || 'Ananya · Family member')}
                      </div>
                    )}
                  </div>

                  {/* Setting Card */}
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>🏠</span>
                        <span>Setting</span>
                      </span>
                      {editingCard === 'setting' ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => {
                              const newLoc = editSettingName || 'Store Setting';
                              setStoryWorldData((prev) => ({
                                ...prev,
                                setting: newLoc,
                                location: { ...(prev?.location || {}), name: newLoc, details: newLoc }
                              }));
                              updateUserContext('environment', newLoc);
                              setEditingCard(null);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                          >
                            Save
                          </button>
                          <span style={{ color: 'var(--border-default)', fontSize: 10 }}>|</span>
                          <button
                            type="button"
                            onClick={() => setEditingCard(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 10, cursor: 'pointer', padding: 0 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const curSetting = storyWorldData?.location?.name || storyWorldData?.setting || userContext.environment || 'Store Setting';
                            setEditSettingName(curSetting);
                            setEditingCard('setting');
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                          [Edit]
                        </button>
                      )}
                    </div>
                    {editingCard === 'setting' ? (
                      <div style={{ marginTop: 2 }}>
                        <input
                          type="text"
                          value={editSettingName}
                          onChange={(e) => setEditSettingName(e.target.value)}
                          placeholder="Setting (e.g. Home kitchen, Store counter)"
                          style={{ width: '100%', padding: '3px 6px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-default)' }}
                        />
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {storyWorldData?.location?.name || (typeof storyWorldData?.setting === 'string' ? storyWorldData.setting.slice(0, 32) : '') || userContext.environment?.slice(0, 32) || `${userContext.businessName || 'Store'} setting`}
                      </div>
                    )}
                  </div>

                  {/* Product Card */}
                  <div style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>📦</span>
                        <span>Product</span>
                      </span>
                      {editingCard === 'product' ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => {
                              const newProd = editProductName || 'Featured Product';
                              setStoryWorldData((prev) => ({ ...prev, product: newProd }));
                              setEditingCard(null);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                          >
                            Save
                          </button>
                          <span style={{ color: 'var(--border-default)', fontSize: 10 }}>|</span>
                          <button
                            type="button"
                            onClick={() => setEditingCard(null)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 10, cursor: 'pointer', padding: 0 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditProductName(storyWorldData?.product || userContext.brief?.slice(0, 40) || `${userContext.businessName} items`);
                            setEditingCard('product');
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                          [Edit]
                        </button>
                      )}
                    </div>
                    {editingCard === 'product' ? (
                      <div style={{ marginTop: 2 }}>
                        <input
                          type="text"
                          value={editProductName}
                          onChange={(e) => setEditProductName(e.target.value)}
                          placeholder="Product (e.g. Festive sweet boxes)"
                          style={{ width: '100%', padding: '3px 6px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-default)' }}
                        />
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {storyWorldData?.product || userContext.brief?.slice(0, 32) || `${userContext.businessName || 'Brand'} offering`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Decision C: 4 Story Beats Preview */}
              {storyWorldData?.beats && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>3. 4 Story Beats Architecture</span>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'none' }}>
                      Target: {userContext.targetDuration || '20s'} Film
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                    {storyWorldData.beats.map((b, idx) => {
                      const dur = parseInt(userContext.targetDuration, 10) || 20;
                      const timingLabel = b.timing || (
                        dur <= 15 ? ['0-2s', '2-6s', '6-11s', '11-15s'][idx] :
                        dur <= 20 ? ['0-3s', '3-8s', '8-14s', '14-20s'][idx] :
                        dur <= 30 ? ['0-4s', '4-12s', '12-22s', '22-30s'][idx] :
                        ['0-6s', '6-25s', '25-45s', '45-60s'][idx]
                      ) || `Scene ${idx + 1}`;

                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 8,
                            padding: 12,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: 'var(--accent-primary)',
                              fontFamily: "'JetBrains Mono', monospace",
                              letterSpacing: '0.04em'
                            }}>
                              {b.beat || `BEAT ${idx + 1}`} ({timingLabel})
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>
                              0{idx + 1}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {b.title || `Scene ${idx + 1}`}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                            {b.action}
                          </div>
                          {b.dialogue && (
                            <div style={{
                              fontSize: 10,
                              color: 'var(--text-tertiary)',
                              fontStyle: 'italic',
                              marginTop: 2,
                              paddingTop: 4,
                              borderTop: '1px dashed var(--border-subtle)'
                            }}>
                              "{b.dialogue}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Collapsible Creative Constraints */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setIsConstraintsExpanded(!isConstraintsExpanded)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={14} style={{ color: 'var(--accent-primary)' }} />
                <span>Customize / Creative Constraints (Optional)</span>
              </div>
              {isConstraintsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isConstraintsExpanded && (
              <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Language Selector */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Spoken Dialogue Language
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['English', 'Hindi', 'Hinglish', 'Marathi', 'Tamil', 'Telugu', 'Gujarati', 'Bengali'].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          if (onLanguageChange) onLanguageChange(lang);
                          else updateUserContext('language', lang);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          fontSize: 11,
                          backgroundColor: userContext.language === lang ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                          color: userContext.language === lang ? '#ffffff' : 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer'
                        }}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Things to Include */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Things I want to include
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    {constraintsList.map((c, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {c}
                        <X size={10} style={{ cursor: 'pointer' }} onClick={() => setConstraintsList(constraintsList.filter((_, idx) => idx !== i))} />
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      value={newConstraintInput}
                      onChange={(e) => setNewConstraintInput(e.target.value)}
                      placeholder="e.g. mention festive 20% discount"
                      style={{ flex: 1, padding: '6px 10px', fontSize: 11 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newConstraintInput.trim()) {
                          setConstraintsList([...constraintsList, newConstraintInput.trim()]);
                          setNewConstraintInput('');
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newConstraintInput.trim()) {
                          setConstraintsList([...constraintsList, newConstraintInput.trim()]);
                          setNewConstraintInput('');
                        }
                      }}
                      style={{ padding: '6px 12px', fontSize: 11, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Things to Avoid */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Things to avoid
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    {avoidList.map((a, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {a}
                        <X size={10} style={{ cursor: 'pointer' }} onClick={() => setAvoidList(avoidList.filter((_, idx) => idx !== i))} />
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      value={newAvoidInput}
                      onChange={(e) => setNewAvoidInput(e.target.value)}
                      placeholder="e.g. do not show competitor names, no dance sequences"
                      style={{ flex: 1, padding: '6px 10px', fontSize: 11 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newAvoidInput.trim()) {
                          setAvoidList([...avoidList, newAvoidInput.trim()]);
                          setNewAvoidInput('');
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newAvoidInput.trim()) {
                          setAvoidList([...avoidList, newAvoidInput.trim()]);
                          setNewAvoidInput('');
                        }
                      }}
                      style={{ padding: '6px 12px', fontSize: 11, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setCreativePanel('plot')}
              style={{ padding: '8px 16px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', fontSize: 12, cursor: 'pointer' }}
            >
              ← Back to Plot
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={onSynthesizeMasterScript}
              style={{
                padding: '10px 24px',
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
              {isBusy && <RefreshCw size={14} className="icon-spinner" />}
              <span>{isBusy ? 'Creating Broadcast Script…' : 'Continue to Script →'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 6. SCENE-LEVEL AI REWRITE MODAL
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
          Give the AI a creative note to rewrite only Scene {sceneIndex + 1}. Room and character continuity stay locked.
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
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && instruction.trim() && !isRewriting) {
              e.preventDefault();
              onApplyRewrite(instruction);
            }
          }}
          placeholder="e.g. Make Ramesh tease Sunita about running out of groceries again..."
          style={{ width: '100%', padding: '10px 12px', fontSize: 13, marginBottom: 16, borderRadius: 6, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
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
 * 7. PRODUCTION SHOT SPECIFICATION VIEW (IN SCRIPT REVIEW)
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
