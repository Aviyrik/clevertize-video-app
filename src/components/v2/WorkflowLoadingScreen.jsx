import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Clock,
  Film,
  Clapperboard,
} from 'lucide-react';

/**
 * Reusable Workflow Loading Screen
 * Modeled after the production-grade video generation loading screen,
 * providing rich context, step-by-step progress, elapsed timer, rotating tips,
 * and next-step preview across all AI and research workflows.
 */
export default function WorkflowLoadingScreen({
  icon: Icon = Sparkles,
  badgeLabel = 'AI Engine',
  title = 'Processing…',
  subtitle = 'Working on your creative assets…',
  stages = [],
  activeStageIndex = null, // If null, auto-progresses based on elapsed time & stage count
  tips = [],
  tipPrefix = 'Strategy Insight',
  elapsedTime = null, // If null, counts up automatically
  estimatedDuration = '~5–10s',
  expectedRangeSec = null, // Optional [minSec, maxSec] to detect when operation exceeds initial estimate
  stallRecoveryAfterSec = 40, // Show non-blocking retry/return actions when exceeded
  metadata = [], // Array of { label, value, icon }
  nextStep = '',
  compact = false,
  error = null,
  onRetry = null,
  onCancel = null,
  cancelLabel = 'Go Back',
  style = {},
}) {
  const [localSeconds, setLocalSeconds] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Auto stopwatch if external elapsedTime is not provided
  useEffect(() => {
    if (elapsedTime !== null) return;
    setLocalSeconds(0);
    const interval = setInterval(() => {
      setLocalSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [elapsedTime]);

  // Format mm:ss
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const displayTime = elapsedTime || formatTime(localSeconds);
  const hasExceededEstimate = Boolean(
    Array.isArray(expectedRangeSec) &&
    expectedRangeSec[1] > 0 &&
    localSeconds > expectedRangeSec[1]
  );
  const isPotentiallyStalled = Boolean(
    (onRetry || onCancel) &&
    localSeconds >= (Array.isArray(expectedRangeSec) && expectedRangeSec[1] ? Math.max(stallRecoveryAfterSec, expectedRangeSec[1] + 10) : stallRecoveryAfterSec)
  );

  // Compute active stage index dynamically if not explicitly passed
  let resolvedStageIdx = activeStageIndex;
  if (resolvedStageIdx === null && stages.length > 0) {
    // Pace through stages smoothly based on elapsed time (e.g., ~3.5s per stage)
    const stageDurationSec = 3.5;
    const computed = Math.floor(localSeconds / stageDurationSec);
    resolvedStageIdx = Math.min(computed, stages.length - 1);
  }

  // Rotate tips every 5.5 seconds
  useEffect(() => {
    if (!tips || tips.length <= 1) return;
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5500);
    return () => clearInterval(tipInterval);
  }, [tips]);

  // If there's an error state
  if (error) {
    return (
      <div
        role="alert"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--error)',
          borderRadius: 14,
          padding: compact ? '24px 20px' : '36px 28px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          maxWidth: compact ? '100%' : 580,
          margin: compact ? '0' : '20px auto',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.1)',
          ...style,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: 'var(--error-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--error)',
          }}
        >
          <AlertCircle size={26} style={{ color: 'var(--error)' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Operation Incomplete
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, maxWidth: 460 }}>
            {error}
          </p>
        </div>
        {(onRetry || onCancel) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {cancelLabel}
              </button>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  backgroundColor: 'var(--accent-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 10px var(--accent-glow)',
                }}
              >
                <RefreshCw size={14} />
                <span>Try Again</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  const currentStageObj = stages && stages.length > 0 ? stages[resolvedStageIdx] : null;
  const politeAnnouncement = isPotentiallyStalled
    ? `${title} Taking longer than expected. You can wait, retry, or go back.`
    : hasExceededEstimate
      ? `${title} Taking longer than usual — still working.`
      : currentStageObj
        ? `${title} ${currentStageObj.title}`
        : title;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 16,
        padding: compact ? '24px 20px' : '36px 28px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? 16 : 20,
        maxWidth: compact ? '100%' : 600,
        margin: compact ? '0' : '20px auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Polite screen-reader summary only on stage/threshold transitions (never on 1s timer ticks) */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {politeAnnouncement}
      </span>
      {/* Animated Pulsing Icon Avatar */}
      <div
        style={{
          width: compact ? 52 : 62,
          height: compact ? 52 : 62,
          borderRadius: '50%',
          backgroundColor: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--accent-primary)',
          boxShadow: '0 0 24px var(--accent-glow)',
          flexShrink: 0,
        }}
      >
        <Icon size={compact ? 24 : 28} className="icon-spinner" style={{ color: 'var(--accent-primary)' }} />
      </div>

      {/* Title & Subtitle */}
      <div style={{ maxWidth: 520 }}>
        {badgeLabel && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--accent-primary)',
              marginBottom: 6,
            }}
          >
            {badgeLabel}
          </div>
        )}
        <h2
          style={{
            fontSize: compact ? 17 : 20,
            fontWeight: 700,
            margin: '0 0 6px',
            color: 'var(--text-primary)',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Badges: Elapsed Time + Estimated Duration */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--accent-primary)',
            backgroundColor: 'var(--bg-elevated)',
            padding: '4px 12px',
            borderRadius: 20,
            border: '1px solid var(--border-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
            }}
          />
          Elapsed: {displayTime}
        </div>

        {estimatedDuration && (
          <div
            data-testid="workflow-estimate-badge"
            style={{
              fontSize: 11,
              color: hasExceededEstimate ? '#F59E0B' : 'var(--text-tertiary)',
              backgroundColor: hasExceededEstimate ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-elevated)',
              padding: '4px 11px',
              borderRadius: 20,
              border: `1px solid ${hasExceededEstimate ? 'rgba(245, 158, 11, 0.35)' : 'var(--border-subtle)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Clock size={11} />
            <span>
              {hasExceededEstimate
                ? 'Taking longer than usual — still working…'
                : `Estimated: ${estimatedDuration}`}
            </span>
          </div>
        )}
      </div>

      {/* Recovery Controls when an operation takes noticeably longer than expected */}
      {isPotentiallyStalled && (onRetry || onCancel) && (
        <div
          data-testid="workflow-stall-recovery"
          style={{
            width: '100%',
            maxWidth: 500,
            padding: '10px 14px',
            borderRadius: 10,
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
            Taking longer than expected. You can wait, retry, or go back.
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {cancelLabel}
              </button>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                style={{
                  padding: '5px 11px',
                  borderRadius: 6,
                  backgroundColor: 'var(--accent-primary)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <RefreshCw size={11} />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Multi-Step Pipeline Indicator */}
      {stages && stages.length > 0 && (
        <div
          style={{
            width: '100%',
            maxWidth: 500,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: compact ? '12px 14px' : '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-tertiary)',
              marginBottom: -2,
            }}
          >
            Workflow Stages
          </div>
          {stages.map((stg, idx) => {
            const isDone = resolvedStageIdx > idx;
            const isCurrent = resolvedStageIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  opacity: isDone ? 0.7 : isCurrent ? 1 : 0.4,
                  transition: 'opacity 0.3s ease',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDone
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isCurrent
                      ? 'var(--bg-active)'
                      : 'transparent',
                    border: isDone
                      ? '1px solid #10B981'
                      : isCurrent
                      ? '1px solid var(--accent-primary)'
                      : '1px solid var(--border-default)',
                    flexShrink: 0,
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={13} style={{ color: '#10B981' }} />
                  ) : isCurrent ? (
                    <RefreshCw size={11} className="icon-spinner" style={{ color: 'var(--accent-primary)' }} />
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--text-tertiary)',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {idx + 1}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: isCurrent ? 700 : 600,
                      color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                    }}
                  >
                    <span>{stg.title || stg.label || stg}</span>
                    {stg.timeRange && (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--text-tertiary)',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {stg.timeRange}
                      </span>
                    )}
                  </div>
                  {stg.desc && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-tertiary)',
                        marginTop: 1,
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {stg.desc}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contextual Brand Metadata Strip */}
      {metadata && metadata.length > 0 && (
        <div
          style={{
            width: '100%',
            maxWidth: 500,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 6,
            fontSize: 11,
          }}
        >
          {metadata.map((item, mIdx) => (
            <div key={mIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {item.label && <span style={{ color: 'var(--text-tertiary)' }}>{item.label}:</span>}
              <span
                style={{
                  fontWeight: 600,
                  color: item.color || 'var(--text-primary)',
                  padding: item.isPill ? '1px 8px' : '0',
                  borderRadius: item.isPill ? 12 : 0,
                  backgroundColor: item.isPill ? 'var(--bg-surface)' : 'transparent',
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Rotating Tips & Insights Card */}
      {tips && tips.length > 0 && (
        <div
          style={{
            width: '100%',
            maxWidth: 500,
            backgroundColor: 'rgba(59, 130, 246, 0.06)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 10,
            padding: '10px 14px',
            textAlign: 'left',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <Lightbulb size={15} style={{ color: '#3B82F6', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <span style={{ fontWeight: 700, color: '#3B82F6' }}>{tipPrefix}: </span>
            {tips[tipIndex]}
          </div>
        </div>
      )}

      {/* Next Step Preview */}
      {nextStep && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>What happens next:</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{nextStep}</span>
          <ArrowRight size={12} />
        </div>
      )}
    </div>
  );
}

/**
 * 1. Brand & Category Research Loader
 */
export function BrandResearchLoader({ businessName, category, compact = false, style = {} }) {
  return (
    <WorkflowLoadingScreen
      icon={Sparkles}
      badgeLabel=""
      title="Researching your brand…"
      subtitle={`Analyzing ${businessName || 'your business'} category and audience cues.`}
      stages={[
        { title: 'Business & Category Context', desc: 'Scanning category expectations' },
        { title: 'Audience Drivers', desc: 'Identifying key buyer hooks' },
        { title: 'Strategy Insights', desc: 'Drafting brief recommendations' },
      ]}
      tips={[
        'Ads that address an everyday customer dilemma retain viewers longer.',
        'Matching brand tone to your category builds immediate trust.',
      ]}
      tipPrefix="Tip"
      estimatedDuration="~5–8s"
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
        category ? { label: 'Category', value: category, isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Refine brief and unlock creative concepts"
      compact={compact}
      style={style}
    />
  );
}

/**
 * 2. Creative Idea Generation Loader
 */
export function IdeaGenerationLoader({ businessName, category, objective, compact = false, style = {} }) {
  return (
    <WorkflowLoadingScreen
      icon={Sparkles}
      badgeLabel=""
      title="Generating creative ideas…"
      subtitle={`Building distinct story angles for ${businessName || 'your brand'}.`}
      stages={[
        { title: 'Framing Buyer Hooks', desc: 'Identifying relatable everyday moments' },
        { title: 'Drafting 3 Concepts', desc: 'Tailoring distinct directions to your brief' },
        { title: 'Aligning Tone & Goal', desc: 'Matching premise to campaign goal' },
      ]}
      tips={[
        'Starting with a relatable problem grabs attention faster than feature lists.',
        'State the key customer benefit within the first 5 seconds.',
      ]}
      tipPrefix="Tip"
      estimatedDuration="~6–10s"
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
        objective ? { label: 'Goal', value: objective, isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Pick a concept or write your own"
      compact={compact}
      style={style}
    />
  );
}

/**
 * 3. Opening Hook Generation Loader
 */
export function HookGenerationLoader({ businessName, ideaTitle, compact = false, style = {} }) {
  return (
    <WorkflowLoadingScreen
      icon={Sparkles}
      badgeLabel=""
      title="Creating opening hooks…"
      subtitle={`Drafting 0–3s visual openers for ${businessName || 'your brand'}.`}
      stages={[
        { title: '0–3s Pattern Interrupts', desc: 'Framing scroll-stopping visual openings' },
        { title: 'Multiple Hook Styles', desc: 'Questions, bold claims, and curiosity gaps' },
        { title: 'Pacing Calibration', desc: 'Tuning speech rhythm for quick retention' },
      ]}
      tips={[
        'The first 3 seconds determine whether viewers keep watching.',
        'Opening with a familiar habit earns instant viewer buy-in.',
      ]}
      tipPrefix="Tip"
      estimatedDuration="~5–9s"
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
        ideaTitle ? { label: 'Concept', value: ideaTitle, isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Choose an opening hook"
      compact={compact}
      style={style}
    />
  );
}

/**
 * 4. Story World Generation Loader
 */
export function StoryGenerationLoader({ businessName, hookText, compact = false, style = {} }) {
  return (
    <WorkflowLoadingScreen
      icon={Sparkles}
      badgeLabel=""
      title="Building story structure…"
      subtitle={`Designing setting, cast, and 4-scene flow for ${businessName || 'your brand'}.`}
      stages={[
        { title: 'Setting & Cast', desc: 'Defining consistent environment and characters' },
        { title: '4-Beat Story Arc', desc: 'Structuring Start → Show → Moment → End' },
        { title: 'Payoff & CTA', desc: 'Connecting story resolution to your offer' },
      ]}
      tips={[
        'One continuous setting prevents distracting background jumps between shots.',
      ]}
      tipPrefix="Tip"
      estimatedDuration="~6–10s"
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Review story and edit dialogue"
      compact={compact}
      style={style}
    />
  );
}

/**
 * 5. Script Generation Loader
 */
export function ScriptGenerationLoader({ businessName, elapsedTime, compact = false, style = {} }) {
  return (
    <WorkflowLoadingScreen
      icon={Sparkles}
      badgeLabel=""
      title="Writing and polishing your script…"
      subtitle={`Drafting 4 scenes with spoken dialogue and camera shots for ${businessName || 'your brand'}.`}
      stages={[
        { title: 'Dialogue Synthesis', desc: 'Writing natural spoken lines' },
        { title: 'Camera Direction', desc: 'Specifying framing and character action' },
        { title: 'Pacing & Continuity Check', desc: 'Balancing timing and offer clarity' },
      ]}
      tips={[
        'Short spoken lines sound most natural and pace cleanly inside each shot.',
        'Keep the final 5 seconds focused on one clear call to action.',
      ]}
      tipPrefix="Tip"
      elapsedTime={elapsedTime}
      estimatedDuration="~8–14s"
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
        { label: 'Format', value: '4 Scenes', isPill: true },
      ].filter(Boolean)}
      nextStep="Review or edit scenes before generating video"
      compact={compact}
      style={style}
    />
  );
}

/**
 * 6. URL Research / Web Scanner Loader
 */
export function UrlScannerLoader({ url, compact = true, style = {} }) {
  return (
    <WorkflowLoadingScreen
      icon={Sparkles}
      badgeLabel=""
      title="Scanning website…"
      subtitle={`Extracting brand details and images from ${url || 'your website'}.`}
      stages={[
        { title: 'Reading Page Content', desc: 'Extracting headlines and offerings' },
        { title: 'Finding Product Photos', desc: 'Detecting product images and brand cues' },
        { title: 'Drafting Brief', desc: 'Building your editable campaign summary' },
      ]}
      tips={[
        'Review and refine any extracted text or photo before continuing.',
      ]}
      tipPrefix="Tip"
      estimatedDuration="~6–12s"
      metadata={[
        url ? { label: 'URL', value: url.replace(/^https?:\/\//, '').slice(0, 32), isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Review extracted details and edit brief"
      compact={compact}
      style={style}
    />
  );
}

/**
 * 7. Simple Business Studio 3-Ad Packages Loader
 */
export function SimpleAdPackagesLoader({ businessName, category, compact = false, style = {} }) {
  return (
    <WorkflowLoadingScreen
      icon={Sparkles}
      badgeLabel=""
      title="Writing 3 script options…"
      subtitle={`Creating UGC, Story, and Direct Offer scripts for ${businessName || 'your business'}.`}
      stages={[
        { title: 'Analyzing Brief', desc: 'Extracting offer, audience, and tone' },
        { title: 'Writing 3 Concepts', desc: 'Generating distinct hooks and scenes' },
        { title: 'Polishing Prompts', desc: 'Preparing dialogue and camera direction' },
      ]}
      tips={[
        'You can preview all scenes in each option before starting video rendering.',
      ]}
      tipPrefix="Tip"
      estimatedDuration="~8–15s"
      metadata={[
        businessName ? { label: 'Business', value: businessName, isPill: true } : null,
        category ? { label: 'Category', value: category, isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Pick a script option to generate your video"
      compact={compact}
      style={style}
    />
  );
}

/**
 * 8. Simple Business Studio Video Production Loader
 */
export function SimpleVideoProductionLoader({
  businessName,
  elapsedTime,
  renderStatusText,
  compact = false,
  style = {},
}) {
  return (
    <WorkflowLoadingScreen
      icon={Film}
      badgeLabel=""
      title="Producing your video…"
      subtitle={
        renderStatusText ||
        `Rendering scenes and audio for ${businessName || 'your brand'}.`
      }
      stages={[
        { title: 'Scene & Cast Setup', desc: 'Locking characters, setting, and brand assets', timeRange: '0–35s' },
        { title: 'Keyframe Generation', desc: 'Creating visual frames for all scenes', timeRange: '35–95s' },
        { title: 'Motion Synthesis', desc: 'Rendering camera movement and continuity', timeRange: '95–165s' },
        { title: 'Audio & Final Assembly', desc: 'Syncing audio and encoding MP4', timeRange: '165s+' },
      ]}
      tips={[
        'Keep this tab open — playback starts automatically once rendering finishes.',
        'Finished videos also save automatically under My Projects.',
      ]}
      tipPrefix="Note"
      elapsedTime={elapsedTime}
      estimatedDuration="~2–3 mins"
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
        { label: 'Quality', value: '1080p MP4', isPill: true },
      ].filter(Boolean)}
      nextStep="Watch, share, or download MP4"
      compact={compact}
      style={style}
    />
  );
}

/**
 * 9. AI Scene Rewrite Loader
 */
export function SceneRewriteLoader({ sceneIndex = 1, compact = true, style = {} }) {
  return (
    <WorkflowLoadingScreen
      icon={Sparkles}
      badgeLabel=""
      title={`Improving Scene ${sceneIndex}…`}
      subtitle="Applying your instructions while keeping story continuity."
      stages={[
        { title: 'Checking Context', desc: 'Reading surrounding scenes and cast' },
        { title: 'Rewriting Scene', desc: 'Updating dialogue and camera action' },
        { title: 'Continuity Check', desc: 'Matching setting and character transitions' },
      ]}
      tips={[
        'Varying shot framing between scenes keeps viewer attention high.',
      ]}
      tipPrefix="Tip"
      estimatedDuration="~4–7s"
      nextStep="Review updated scene and accept or cancel"
      compact={compact}
      style={style}
    />
  );
}

/**
 * 10. Auth & Session Boot Loader (Simple Logo Loading Animation)
 */
export function AuthSessionLoader({ style = {} }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        userSelect: 'none',
        ...style,
      }}
    >
      <style>{`
        @keyframes cleverPulseGlow {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 32px -4px rgba(99, 102, 241, 0.45), 0 0 24px rgba(99, 102, 241, 0.25);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 12px 40px 0 rgba(99, 102, 241, 0.7), 0 0 36px rgba(129, 140, 248, 0.5);
          }
        }
        @keyframes cleverShimmerBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>

      {/* CleverCut Squircle Brand Mark with Breathing Animation */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 60%, #312E81 100%)',
          border: '1px solid rgba(199, 210, 254, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          animation: 'cleverPulseGlow 2.4s ease-in-out infinite',
        }}
      >
        <Clapperboard size={26} color="#FFFFFF" strokeWidth={2.2} />
      </div>

      {/* Brand Name & Sleek Progress Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: '#FFFFFF',
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          CleverCut
        </span>

        {/* Minimal indeterminate loading track */}
        <div
          style={{
            width: 80,
            height: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '50%',
              background: 'linear-gradient(90deg, transparent, #6366F1, transparent)',
              borderRadius: 2,
              animation: 'cleverShimmerBar 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 11. Script Verification & Quality Gate Loader
 */
export function ScriptVerificationLoader({
  businessName,
  compact = true,
  onRetry = null,
  onCancel = null,
  error = null,
  style = {},
}) {
  return (
    <WorkflowLoadingScreen
      icon={Film}
      badgeLabel=""
      title="Verifying Script…"
      subtitle={`Checking continuity and camera formatting for ${businessName || 'your video'}.`}
      stages={[
        { title: 'Parsing Scene Beats', desc: 'Reading Hook, Build, Turn, and Resolution beats', timeRange: '0–8s' },
        { title: 'Section 8 Quality Gate', desc: 'Checking single setting, cast continuity, and framing', timeRange: '8–22s' },
        { title: 'Structuring Video Shots', desc: 'Separating dialogue and camera motion', timeRange: '22s+' },
      ]}
      tips={[
        'Keeping one consistent setting prevents background shifts between shots.',
        'Section 8 Quality Gate keeps cast and dialogue pacing consistent.',
      ]}
      tipPrefix="Tip"
      estimatedDuration="~15–35s"
      expectedRangeSec={[15, 35]}
      stallRecoveryAfterSec={45}
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
        { label: 'Checks', value: '18 Rules', isPill: true },
      ].filter(Boolean)}
      nextStep="Review extracted cast, setting, and shots"
      compact={compact}
      error={error}
      onRetry={onRetry}
      onCancel={onCancel}
      cancelLabel="Back to Script Input"
      style={style}
    />
  );
}

/**
 * 12. AI Understanding / Strategy Analysis Loader
 */
export function AiUnderstandingLoader({
  businessName,
  category,
  onRetry = null,
  onCancel = null,
  cancelLabel = 'Back to Settings',
  error = null,
  compact = false,
  style = {},
}) {
  return (
    <WorkflowLoadingScreen
      icon={Sparkles}
      badgeLabel=""
      title="Analyzing Brief & Settings…"
      subtitle={`Reviewing offer, audience, format, and rules for ${businessName || 'your business'}.`}
      stages={[
        { title: 'Reading Brief & Brand', desc: 'Extracting offer, buyer focus, and occasion context', timeRange: '0–6s' },
        { title: 'Checking Settings & Rules', desc: 'Aligning language, format, and Creative Instructions', timeRange: '6–16s' },
        { title: 'Preparing Strategy Summary', desc: 'Formatting editable points for approval', timeRange: '16s+' },
      ]}
      tips={[
        'Edits on the next screen immediately guide Creative Ideas and Scripts.',
      ]}
      tipPrefix="Tip"
      estimatedDuration="~10–25s"
      expectedRangeSec={[10, 25]}
      stallRecoveryAfterSec={35}
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
        category ? { label: 'Category', value: category, isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Review and approve before generating ideas"
      compact={compact}
      error={error}
      onRetry={onRetry}
      onCancel={onCancel}
      cancelLabel={cancelLabel}
      style={style}
    />
  );
}


