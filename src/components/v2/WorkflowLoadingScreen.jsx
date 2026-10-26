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
  metadata = [], // Array of { label, value, icon }
  nextStep = '',
  compact = false,
  error = null,
  onRetry = null,
  onCancel = null,
  style = {},
}) {
  const [localSeconds, setLocalSeconds] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Auto stopwatch if external elapsedTime is not provided
  useEffect(() => {
    if (elapsedTime !== null) return;
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
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
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
            style={{
              fontSize: 11,
              color: 'var(--text-tertiary)',
              backgroundColor: 'var(--bg-elevated)',
              padding: '4px 11px',
              borderRadius: 20,
              border: '1px solid var(--border-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Clock size={11} />
            <span>Estimated: {estimatedDuration}</span>
          </div>
        )}
      </div>

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
      badgeLabel="Brand Intelligence"
      title="Researching your brand & market context…"
      subtitle={`Analyzing ${businessName || 'your business'} category dynamics, audience triggers, and creative opportunities.`}
      stages={[
        { title: 'Business Profile & Category Context', desc: 'Scanning category dynamics and consumer expectations' },
        { title: 'Audience Drivers & Pain Points', desc: 'Synthesizing customer dilemmas and emotional triggers' },
        { title: 'Strategic Recommendations', desc: 'Formulating commercial brief insights and hook angles' },
      ]}
      tips={[
        'Category Drivers: High-converting video ads address an explicit dilemma the customer faces every day.',
        'Tone Match: Aligning your video voice with the category expectation builds immediate customer trust.',
        'Audience Nuance: Understanding your core consumer age and motivation doubles viewer retention.',
        'Pattern Interrupt: The strongest commercials flip an everyday category expectation within 3 seconds.',
      ]}
      tipPrefix="Research Insight"
      estimatedDuration="~5–8s"
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
        category ? { label: 'Category', value: category, isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Refining your brief and unlocking creative concepts"
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
      badgeLabel="Creative Strategy Engine"
      title="Finding strong creative concepts…"
      subtitle={`Developing distinct narrative angles, character premises, and visual hooks for ${businessName || 'your brand'}.`}
      stages={[
        { title: 'Dilemma Framing', desc: 'Identifying everyday consumer tensions and relatable moments' },
        { title: 'Territory Blueprints', desc: 'Synthesizing 3 distinct creative concepts tailored to your brief' },
        { title: 'Hook & Tone Calibration', desc: 'Aligning visual premise with your campaign objective' },
      ]}
      tips={[
        'Dilemma Framing: Commercials that open with a relatable friction point outperform direct feature ads by 3.2x.',
        'Multi-Angle Testing: Exploring distinct story territories lets you test what resonates best with your audience.',
        'Core Hook: The best concepts state the human benefit within the first 5 seconds.',
        'Tone Consistency: Consistent tone between visual styling and spoken dialogue elevates brand credibility.',
      ]}
      tipPrefix="Strategy Insight"
      estimatedDuration="~6–10s"
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
        objective ? { label: 'Goal', value: objective, isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Pick your favorite concept and select an opening hook"
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
      badgeLabel="Social Retention Engine"
      title="Engineering high-converting opening hooks…"
      subtitle={`Generating scroll-stopping 0–3s visual patterns and dialogue openers for ${businessName || 'your brand'}.`}
      stages={[
        { title: '0–3s Pattern Interrupt', desc: 'Framing unexpected visual action to stop the social feed scroll' },
        { title: 'Multi-Archetype Synthesis', desc: 'Generating relatable questions, bold statements, and curiosity gaps' },
        { title: 'Pacing & Dialogue Tuning', desc: 'Calibrating speech cadence for instant retention' },
      ]}
      tips={[
        'The 3-Second Rule: Over 65% of viewers drop off before 3 seconds if there is no immediate pattern interrupt.',
        'Curiosity Gap: Openings that create an unanswered question hold attention through the commercial.',
        'Audio Cue: Combining an intriguing visual action with crisp spoken dialogue yields maximum watch time.',
        'Relatability: Opening with a recognizable everyday habit creates instant viewer buy-in.',
      ]}
      tipPrefix="Retention Insight"
      estimatedDuration="~5–9s"
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
        ideaTitle ? { label: 'Concept', value: ideaTitle, isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Choose your opening and preview the 4-part visual story"
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
      badgeLabel="Narrative Arc Builder"
      title="Building your 4-part visual story…"
      subtitle={`Designing scene progression, character continuity, and payoff for ${businessName || 'your brand'}.`}
      stages={[
        { title: 'Room & Setting Blueprint', desc: 'Designing consistent visual environment and character profiles' },
        { title: '4-Beat Dramatic Arc', desc: 'Structuring Start → Show → Moment → End narrative progression' },
        { title: 'Payoff & CTA Alignment', desc: 'Connecting the climax smoothly with your brand resolution' },
      ]}
      tips={[
        'Four-Beat Structure: Clear progression from hook to dilemma to resolution keeps viewers engaged to the end.',
        'Visual Continuity: Anchoring the story in a single recognizable setting grounds the video commercial.',
        'Emotional Climax: The moment of discovery must feel earned, making the call to action feel natural.',
        'Pacing: Scene transitions should maintain dynamic rhythm without jarring the viewer.',
      ]}
      tipPrefix="Filmmaking Insight"
      estimatedDuration="~6–10s"
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Review scene flow and customize spoken dialogue in the script editor"
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
      badgeLabel="Broadcast Scriptwriter & Quality Gate"
      title="Writing and polishing your script…"
      subtitle={`Directing 4 broadcast-ready scenes with spoken dialogue and camera setups for ${businessName || 'your brand'}.`}
      stages={[
        { title: 'Natural Dialogue Synthesis', desc: 'Drafting conversational speech with authentic phrasing' },
        { title: 'Cinematic Camera Direction', desc: 'Specifying framing, camera movement, and character action' },
        { title: 'Cadence & Timing Calibration', desc: 'Balancing spoken word count for natural 30–45s pacing' },
        { title: 'Brand Clarity Quality Gate', desc: 'Verifying offer clarity, CTA punch, and character continuity' },
      ]}
      tips={[
        'Dialogue Cadence: Spoken lines sound best when kept under 18 words per scene for natural breath and pacing.',
        'Camera Direction: Wide shots establish geography, medium close-ups create empathy, close-ups highlight the product.',
        'Clear CTA: The final 5 seconds should give one direct, unambiguous action for the customer to take.',
        'Visual Storytelling: Actions speak louder than adjectives—show the relief rather than just claiming it.',
      ]}
      tipPrefix="Scriptwriting Tip"
      elapsedTime={elapsedTime}
      estimatedDuration="~8–14s"
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
        { label: 'Format', value: '4 Broadcast Scenes', isPill: true },
      ].filter(Boolean)}
      nextStep="Review scene dialogue, edit lines, or generate your commercial video"
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
      badgeLabel="Brand Extractor"
      title="Scanning website & extracting brand assets…"
      subtitle={`Connecting to ${url || 'website'} to gather images, color palette, and business positioning.`}
      stages={[
        { title: 'Parsing Webpage Content', desc: 'Extracting headlines, product descriptions, and value propositions' },
        { title: 'Media & Asset Discovery', desc: 'Identifying high-res product photos, logo, and brand color palette' },
        { title: 'Commercial Brief Formulation', desc: 'Structuring brand strengths and category opportunities' },
      ]}
      tips={[
        'Automated Extraction: Pulling high-resolution visuals directly from your website saves manual upload time.',
        'Color Harmony: Matching brand colors ensures the generated commercial feels authentic to your landing page.',
        'Value Clarity: Extracting real customer testimonials provides great hook material for video scripts.',
      ]}
      tipPrefix="Extractor Insight"
      estimatedDuration="~6–12s"
      metadata={[
        url ? { label: 'Target URL', value: url.replace(/^https?:\/\//, '').slice(0, 32), isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Review extracted brand assets and proceed with commercial brief"
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
      badgeLabel="Ad Package Generator"
      title="Writing 3 ready-to-run video ad packages…"
      subtitle={`Crafting UGC, Story, and Direct Offer commercial scripts for ${businessName || 'your business'}.`}
      stages={[
        { title: 'Value Proposition Analysis', desc: 'Isolating key customer benefits, pricing, and social proof' },
        { title: '3-Format Script Synthesis', desc: 'Writing full UGC, Narrative Story, and Direct Offer commercial scripts' },
        { title: 'Visual Direction & Action Prompts', desc: 'Calibrating camera setups, dialogue lines, and call-to-actions' },
      ]}
      tips={[
        'Format Diversity: Testing UGC vs Story vs Direct Offer reveals which format delivers your lowest customer acquisition cost.',
        'UGC Authenticity: User-generated style builds trust quickly through authentic, unpolished phone-camera angles.',
        'Direct Offer Punch: Limited-time promotions and clear pricing drive immediate buying decisions.',
      ]}
      tipPrefix="Creative Strategy"
      estimatedDuration="~8–15s"
      metadata={[
        businessName ? { label: 'Business', value: businessName, isPill: true } : null,
        category ? { label: 'Category', value: category, isPill: true } : null,
      ].filter(Boolean)}
      nextStep="Choose your favorite ad package and produce your video with one click"
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
      badgeLabel="Neural Video Engine"
      title="Producing your commercial video…"
      subtitle={
        renderStatusText ||
        `Generating cinematic scenes, motion interpolation, and broadcast audio for ${businessName || 'your brand'}.`
      }
      stages={[
        { title: 'Scene & Brand Calibration', desc: 'Locking characters, store setting, and brand anchors', timeRange: '0–35s' },
        { title: 'Neural Keyframe Synthesis', desc: 'Generating visual anchors and camera framing for all 4 broadcast scenes', timeRange: '35–95s' },
        { title: 'Motion & Temporal Interpolation', desc: 'Synthesizing cinematic camera moves, eye contact, and character continuity', timeRange: '95–165s' },
        { title: 'Audio Mastering & Broadcast Assembly', desc: 'Synchronizing dialogue cadence, sound mix, and high-definition MP4 encoding', timeRange: '165s+' },
      ]}
      tips={[
        'Character Continuity: Neural seed locks ensure actor faces, clothing, and shop details stay identical across every scene.',
        'First 3-Second Retention: Fast visual hooks and immediate context stop users from swiping past your ad on social feeds.',
        'Colloquial Realism: Conversational dialogue and eye contact make AI-generated commercials feel warm and natural.',
        'Mobile Audio Mastering: Spoken frequencies are enhanced to remain crystal clear even on noisy smartphone speakers.',
        'Continuous Setting: Using one consistent, well-lit store environment builds familiarity and long-term customer trust.',
        'Broadcast Bitrate: Frames are encoded for maximum resolution with ultra-fast streaming playback on WhatsApp & Instagram.',
      ]}
      tipPrefix="Filmmaking Insight"
      elapsedTime={elapsedTime}
      estimatedDuration="~2–3 mins"
      metadata={[
        businessName ? { label: 'Brand', value: businessName, isPill: true } : null,
        { label: 'Quality', value: '1080p Broadcast MP4', isPill: true },
      ].filter(Boolean)}
      nextStep="Download MP4, share directly, or access under My Projects"
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
      badgeLabel="AI Scene Director"
      title={`Rewriting Scene ${sceneIndex} with AI…`}
      subtitle="Applying creative prompt instructions while maintaining storyline continuity."
      stages={[
        { title: 'Analyzing Scene Context', desc: 'Checking character actions and preceding scene beat' },
        { title: 'Applying Creative Instructions', desc: 'Modifying dialogue cadence, camera angle, and tone' },
        { title: 'Continuity Verification', desc: 'Confirming seamless transition into following scene' },
      ]}
      tips={[
        'Scene Flow: Keeping dialogue concise allows the visual action to breathe and captivates the viewer.',
        'Camera Polish: Changing camera shot angles between scenes keeps visual engagement high.',
      ]}
      tipPrefix="Director Note"
      estimatedDuration="~4–7s"
      nextStep="Review revised scene script and accept changes"
      compact={compact}
      style={style}
    />
  );
}

/**
 * 10. Auth & Session Boot Loader
 */
export function AuthSessionLoader({ style = {} }) {
  return (
    <WorkflowLoadingScreen
      icon={Sparkles}
      badgeLabel="Clevertize Creative Studio"
      title="Initializing Creative Studio…"
      subtitle="Verifying secure session and loading your brand workspace."
      stages={[
        { title: 'Security & Credentials Verification', desc: 'Validating active session token' },
        { title: 'Brand Workspace Loading', desc: 'Retrieving business profile, categories, and recent projects' },
        { title: 'Creative Engine Readiness', desc: 'Connecting to AI generation pipeline' },
      ]}
      tips={[
        'Clevertize Studio transforms your brand ideas into broadcast-ready video commercials in minutes.',
        'High-Converting Frameworks: Built on battle-tested advertising psychology and retention curves.',
      ]}
      tipPrefix="Welcome"
      estimatedDuration="~1–2s"
      nextStep="Opening your dashboard and video projects"
      compact={false}
      style={style}
    />
  );
}

