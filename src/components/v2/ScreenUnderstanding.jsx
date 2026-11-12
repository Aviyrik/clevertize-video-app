import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Edit3,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  HelpCircle,
  Info,
  Store,
  Target,
  Users,
  MessageSquare,
  Calendar,
  Lightbulb,
  FileText,
  AlertTriangle,
  X,
  Save,
  SlidersHorizontal,
} from 'lucide-react';

import HelpTooltip from './HelpTooltip.jsx';
import ContextualTipBanner from './ContextualTipBanner.jsx';
import { AiUnderstandingLoader } from './WorkflowLoadingScreen.jsx';
import { HELP_TOOLTIPS, CONTEXTUAL_TIPS } from '../../data/tourSteps.js';
import { shouldShowContextualTip } from '../../utils/onboarding.js';

export default function ScreenUnderstanding({
  understanding,
  onUpdateUnderstanding,
  onApproveAndContinue,
  onBackToBrief,
  onEditSettings,
  settingsContext = null,
  onRegenerate,
  onCancelAnalysis,
  isRegenerating = false,
  isSaving = false,
  originalBrief = '',
  businessName = '',
  businessType = '',
  town = '',
  isOutdated = false,
  error = '',
  userGuardrails = null,
  userEventContext = null,
  onboardingState = null,
  onDismissTip,
  attemptKey = 0,
}) {
  const [editingSection, setEditingSection] = useState(null);
  const [draftData, setDraftData] = useState(understanding || {});
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenNotes, setRegenNotes] = useState('');

  useEffect(() => {
    setDraftData(understanding || {});
  }, [understanding]);

  if (!draftData || !draftData.business_understanding) {
    if (isRegenerating) {
      return (
        <div style={{ maxWidth: 840, margin: '28px auto', padding: '0 20px' }}>
          <AiUnderstandingLoader
            key={`ai-u-init-${attemptKey}`}
            businessName={businessName}
            category={businessType}
            onRetry={() => onRegenerate && onRegenerate(undefined, true)}
            onCancel={onCancelAnalysis || onEditSettings || onBackToBrief}
            cancelLabel={onEditSettings ? 'Back to Settings' : 'Back to Brief'}
          />
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 840, margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <div
          role={error ? 'alert' : undefined}
          style={{
            padding: '36px 24px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: error && !isRegenerating ? 'rgba(255, 122, 107, 0.12)' : 'rgba(244, 244, 236, 0.06)',
              color: error && !isRegenerating ? 'var(--error, var(--cc-danger))' : 'var(--cc-emphasis)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {error && !isRegenerating ? <AlertCircle size={28} /> : <Sparkles size={28} />}
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
            {error
              ? 'Could Not Analyze Brief'
              : 'Ready to Analyze Brief'}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', maxWidth: 460 }}>
            {error
              ? error
              : 'Analyze your brief, settings, and instructions before generating ideas.'}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={onEditSettings || onBackToBrief}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {onEditSettings ? 'Back to Settings' : 'Back to Brief'}
            </button>
            <button
              type="button"
              onClick={() => onRegenerate && onRegenerate(error ? undefined : '')}
              style={{
                backgroundColor: 'var(--cc-action)',
                border: 'none',
                color: 'var(--cc-on-action)',
                borderRadius: 999,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {error ? 'Retry Analysis' : 'Generate Analysis'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = draftData.approval_status === 'approved' && !isOutdated;

  const handleSaveSection = (sectionKey, value) => {
    const updated = {
      ...draftData,
      [sectionKey]: value,
      approval_status: 'pending', // editing resets approval
    };
    setDraftData(updated);
    setEditingSection(null);
    if (onUpdateUnderstanding) onUpdateUnderstanding(updated);
  };

  const handleSaveAssumptions = (assumptions, missing) => {
    const updated = {
      ...draftData,
      assumptions: Array.isArray(assumptions) ? assumptions : [],
      missing_information: Array.isArray(missing) ? missing : [],
      approval_status: 'pending',
    };
    setDraftData(updated);
    setEditingSection(null);
    if (onUpdateUnderstanding) onUpdateUnderstanding(updated);
  };

  const handleConfirmRegenerate = () => {
    setShowRegenModal(false);
    if (onRegenerate) onRegenerate(regenNotes);
    setRegenNotes('');
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(244, 244, 236, 0.075)',
                color: 'var(--cc-emphasis)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span>AI Understanding</span>
                  <HelpTooltip
                    title={HELP_TOOLTIPS.understanding_review.title}
                    body={HELP_TOOLTIPS.understanding_review.body}
                    ariaLabel="Why review AI Understanding"
                  />
                </h1>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.005em',
                    padding: '3px 8px',
                    borderRadius: 12,
                    backgroundColor: isOutdated
                      ? 'rgba(255, 122, 107, 0.15)'
                      : isApproved
                      ? 'rgba(95, 212, 174, 0.15)'
                      : 'rgba(244, 244, 236, 0.075)',
                    color: isOutdated
                      ? 'var(--error, var(--cc-danger))'
                      : isApproved
                      ? 'var(--success, var(--cc-success))'
                      : 'var(--accent-primary, var(--cc-text-2))',
                  }}
                >
                  {isOutdated ? 'Outdated Context' : isApproved ? 'Approved' : 'Pending Review'}
                </span>
                {draftData.is_mock && (
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(242, 184, 75, 0.15)',
                      color: 'var(--warning, var(--cc-warning))',
                    }}
                    title="Spine running in structured offline/test mode"
                  >
                    Test/Offline Mode
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                Review or edit how CleverCut interpreted your brief before generating ideas.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowRegenModal(true)}
              disabled={isRegenerating || isSaving}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                borderRadius: 7,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <RotateCcw size={13} className={isRegenerating ? 'animate-spin' : ''} />
              <span>{isRegenerating ? 'Analyzing…' : 'Regenerate'}</span>
            </button>
          </div>
        </div>

        {/* Contextual Onboarding Tip (Auto-retires after user approves twice or dismisses) */}
        {shouldShowContextualTip('tip_ai_understanding', onboardingState) && (
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <ContextualTipBanner
              tipId={CONTEXTUAL_TIPS.tip_ai_understanding.id}
              title={CONTEXTUAL_TIPS.tip_ai_understanding.title}
              body={CONTEXTUAL_TIPS.tip_ai_understanding.body}
              onDismiss={onDismissTip}
            />
          </div>
        )}

        {/* Brand & Production Settings Context Strip */}
        {(() => {
          const activeSett = settingsContext || draftData.source_settings || null;
          return (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Store size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{businessName || 'Brand'}</span>
            <span>·</span>
            <span>{businessType || 'Business'}</span>
            {town && (
              <>
                <span>·</span>
                <span>{town}</span>
              </>
            )}
            <span>·</span>
            <span style={{ color: 'var(--text-tertiary)' }}>Version {draftData.version || 1}</span>
            {activeSett && (
              <>
                <span>·</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {[
                    activeSett.language,
                    activeSett.dimension || activeSett.aspectRatio,
                    activeSett.duration || activeSett.targetDuration,
                    activeSett.creativeStyle || activeSett.format,
                    activeSett.hasLogo ? 'Logo included' : 'No custom logo',
                  ].filter(Boolean).join(' · ')}
                </span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onBackToBrief}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cc-emphasis)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: 0,
              }}
            >
              <ArrowLeft size={13} />
              <span>Edit Original Brief</span>
            </button>

            {onEditSettings && (
              <button
                type="button"
                onClick={onEditSettings}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--cc-emphasis)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                }}
              >
                <SlidersHorizontal size={13} />
                <span>Edit Settings</span>
              </button>
            )}
          </div>
        </div>
          );
        })()}

        {/* Active Regeneration Progress (when refreshing an existing understanding) */}
        {isRegenerating && (
          <div style={{ marginTop: 14 }}>
            <AiUnderstandingLoader
              key={`ai-u-compact-${attemptKey}`}
              businessName={businessName}
              category={businessType}
              compact={true}
              onRetry={() => onRegenerate && onRegenerate(undefined, true)}
              onCancel={onCancelAnalysis || onEditSettings || onBackToBrief}
              cancelLabel={onEditSettings ? 'Back to Settings' : 'Back to Brief'}
            />
          </div>
        )}

        {/* Outdated Notice */}
        {isOutdated && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(255, 122, 107, 0.1)',
              border: '1px solid rgba(255, 122, 107, 0.3)',
              color: 'var(--error, var(--cc-danger))',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} />
              <span>
                Brief, instructions, or settings changed. Update before continuing.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRegenerate && onRegenerate('')}
              style={{
                backgroundColor: 'var(--error, var(--cc-danger))',
                border: 'none',
                color: '#1A0703',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Update Analysis
            </button>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div
            role="alert"
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(255, 122, 107, 0.1)',
              border: '1px solid rgba(255, 122, 107, 0.3)',
              color: 'var(--error, var(--cc-danger))',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => onRegenerate && onRegenerate(undefined, true)}
              style={{
                backgroundColor: 'var(--error, var(--cc-danger))',
                border: 'none',
                color: '#1A0703',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Sections Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* A. Business Understanding */}
        <SectionCard
          id="business_understanding"
          title="A. Business Understanding"
          icon={<Store size={16} style={{ color: 'var(--text-tertiary)' }} />}
          content={draftData.business_understanding}
          isEditing={editingSection === 'business_understanding'}
          onStartEdit={() => setEditingSection('business_understanding')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={(val) => handleSaveSection('business_understanding', val)}
        />

        {/* B. Campaign Objective */}
        <SectionCard
          id="campaign_objective"
          title="B. Campaign Objective"
          icon={<Target size={16} style={{ color: 'var(--text-tertiary)' }} />}
          content={draftData.campaign_objective}
          isEditing={editingSection === 'campaign_objective'}
          onStartEdit={() => setEditingSection('campaign_objective')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={(val) => handleSaveSection('campaign_objective', val)}
        />

        {/* C. Target Audience */}
        <SectionCard
          id="target_audience"
          title="C. Target Audience"
          icon={<Users size={16} style={{ color: 'var(--text-tertiary)' }} />}
          content={draftData.target_audience}
          isEditing={editingSection === 'target_audience'}
          onStartEdit={() => setEditingSection('target_audience')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={(val) => handleSaveSection('target_audience', val)}
        />

        {/* D. Core Communication */}
        <SectionCard
          id="core_communication"
          title="D. Core Communication"
          icon={<MessageSquare size={16} style={{ color: 'var(--text-tertiary)' }} />}
          content={draftData.core_communication}
          isEditing={editingSection === 'core_communication'}
          onStartEdit={() => setEditingSection('core_communication')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={(val) => handleSaveSection('core_communication', val)}
        />

        {/* E. Occasion & Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SectionCard
            id="occasion_context"
            title="E. Occasion & Context"
            icon={<Calendar size={16} style={{ color: 'var(--text-tertiary)' }} />}
            content={draftData.occasion_context}
            isEditing={editingSection === 'occasion_context'}
            onStartEdit={() => setEditingSection('occasion_context')}
            onCancelEdit={() => setEditingSection(null)}
            onSave={(val) => handleSaveSection('occasion_context', val)}
          />
          {userEventContext && (userEventContext.name || userEventContext.category || userEventContext.timing || userEventContext.additionalContext) && (
            <div
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-tertiary)', fontSize: 12 }}>User Event Input:</span>
              {userEventContext.name && <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{userEventContext.name}</span>}
              {userEventContext.category && <span>· {userEventContext.category}</span>}
              {userEventContext.timing && <span>· {userEventContext.timing}</span>}
              {userEventContext.creativeInfluence && (
                <span style={{ padding: '1px 7px', borderRadius: 10, backgroundColor: 'rgba(244, 244, 236, 0.06)', color: 'var(--cc-emphasis)', fontSize: 12, fontWeight: 600 }}>
                  Influence: {userEventContext.creativeInfluence}
                </span>
              )}
              {userEventContext.additionalContext && (
                <span style={{ color: 'var(--text-tertiary)' }}>— {userEventContext.additionalContext}</span>
              )}
            </div>
          )}
        </div>

        {/* F. Creative Guardrails — Creative Instructions Understanding */}
        <GuardrailsCard
          guardrails={draftData.creative_guardrails || { dos: [], donts: [] }}
          userGuardrails={userGuardrails}
          guardrailAnalysis={draftData.guardrail_analysis || null}
          onBackToBrief={onBackToBrief}
        />

        {/* G. Creative Opportunity */}
        <SectionCard
          id="creative_opportunity"
          title="G. Creative Opportunity"
          icon={<Lightbulb size={16} style={{ color: 'var(--text-tertiary)' }} />}
          content={draftData.creative_opportunity}
          isEditing={editingSection === 'creative_opportunity'}
          onStartEdit={() => setEditingSection('creative_opportunity')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={(val) => handleSaveSection('creative_opportunity', val)}
        />

        {/* H. Assumptions & Missing Information */}
        <AssumptionsCard
          verifiedFacts={draftData.verified_facts || []}
          assumptions={draftData.assumptions || []}
          missing={draftData.missing_information || []}
          isEditing={editingSection === 'assumptions'}
          onStartEdit={() => setEditingSection('assumptions')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={handleSaveAssumptions}
        />
      </div>

      {/* Persistent Approval Action Bar */}
      <div
        style={{
          position: 'sticky',
          bottom: 20,
          marginTop: 32,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: isApproved ? 'rgba(95, 212, 174, 0.15)' : 'rgba(244, 244, 236, 0.075)',
              color: isApproved ? 'var(--success)' : 'var(--cc-emphasis)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isApproved ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {isOutdated
                ? 'Inputs changed — update before continuing'
                : isApproved
                ? 'Approved'
                : 'Ready for Creative Ideas?'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {isOutdated
                ? 'Brief, instructions, or settings changed since approval.'
                : isApproved
                ? 'This approved version guides idea generation.'
                : 'Edit sections above, then approve to continue.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={onEditSettings || onBackToBrief}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              borderRadius: 8,
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {onEditSettings ? 'Back to Settings' : 'Back to Brief'}
          </button>

          <button
            type="button"
            onClick={() => onApproveAndContinue && onApproveAndContinue(draftData)}
            disabled={isSaving || isRegenerating || isOutdated}
            title={isOutdated ? 'Click Update Analysis above before approving changed inputs' : ''}
            style={{
              backgroundColor: 'var(--cc-action)',
              border: 'none',
              color: 'var(--cc-on-action)',
              borderRadius: 999,
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 600,
              cursor: isSaving || isOutdated ? 'not-allowed' : 'pointer',
              opacity: isOutdated ? 0.55 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
            }}
          >
            {isSaving ? (
              <span>Saving Approval…</span>
            ) : (
              <>
                <Check size={16} />
                <span>Approve & Continue</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Regeneration Modal */}
      {showRegenModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowRegenModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              maxWidth: 500,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RotateCcw size={18} style={{ color: 'var(--cc-emphasis)' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Regenerate AI Understanding
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRegenModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px' }}>
              Add any corrections or extra context to include:
            </p>

            <textarea
              rows={4}
              value={regenNotes}
              onChange={(e) => setRegenNotes(e.target.value)}
              placeholder="e.g. Focus more on our fast delivery guarantee, and clarify that the target audience is young families..."
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: 13,
                boxSizing: 'border-box',
                resize: 'vertical',
                outline: 'none',
                marginBottom: 16,
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowRegenModal(false)}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  borderRadius: 6,
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRegenerate}
                style={{
                  backgroundColor: 'var(--cc-action)',
                  border: 'none',
                  color: 'var(--cc-on-action)',
                  borderRadius: 999,
                  padding: '7px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <RotateCcw size={14} />
                <span>Regenerate Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reusable Section Card for Single Text Content
 */
function SectionCard({ id, title, icon, content, isEditing, onStartEdit, onCancelEdit, onSave, helper }) {
  const [val, setVal] = useState(content || '');

  useEffect(() => {
    setVal(content || '');
  }, [content]);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '16px 20px',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={onStartEdit}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 4,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--cc-emphasis)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>
        )}
      </div>

      {helper && !isEditing && (
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
          {helper}
        </div>
      )}

      {isEditing ? (
        <div>
          <textarea
            rows={4}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--cc-selected-line)',
              borderRadius: 8,
              padding: '10px 12px',
              color: 'var(--text-primary)',
              fontSize: 13,
              lineHeight: 1.5,
              boxSizing: 'border-box',
              resize: 'vertical',
              outline: 'none',
              marginBottom: 10,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onCancelEdit}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(val)}
              style={{
                backgroundColor: 'var(--cc-action)',
                border: 'none',
                color: 'var(--cc-on-action)',
                borderRadius: 999,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Save size={13} />
              <span>Save Section</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
          {content || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>None specified</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Creative Guardrails Card with Dos & Don'ts
 */
function GuardrailsCard({ guardrails, userGuardrails = null, guardrailAnalysis = null, onBackToBrief }) {
  const [showAiFallback, setShowAiFallback] = useState(false);

  const rawUserDos = Array.isArray(userGuardrails?.dos) ? userGuardrails.dos : [];
  const rawUserDonts = Array.isArray(userGuardrails?.donts) ? userGuardrails.donts : [];
  const hasUserInputs = rawUserDos.length > 0 || rawUserDonts.length > 0;

  const aiDos = Array.isArray(guardrails?.dos) ? guardrails.dos : [];
  const aiDonts = Array.isArray(guardrails?.donts) ? guardrails.donts : [];
  const normalizedRules = Array.isArray(guardrailAnalysis?.rules) ? guardrailAnalysis.rules : [];
  const interpretationSummary = guardrailAnalysis?.summary || '';

  const conflicts = Array.isArray(guardrailAnalysis?.conflicts) ? guardrailAnalysis.conflicts : [];
  const unsupportedClaims = Array.isArray(guardrailAnalysis?.unsupported_claims) ? guardrailAnalysis.unsupported_claims : [];
  const hasIssues = conflicts.length > 0 || unsupportedClaims.length > 0;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '16px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <ShieldCheck size={16} style={{ color: 'var(--text-tertiary)' }} />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            F. Creative Guardrails — Creative Instructions Understanding
          </h3>
        </div>
        {onBackToBrief && (
          <button
            type="button"
            onClick={onBackToBrief}
            title="Edit creative instructions on the Brief page"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'none',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              padding: '4px 10px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={12} />
            <span>Modify in Brief</span>
          </button>
        )}
      </div>

      {!hasUserInputs ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Calm empty state — no fake user entries or failure badges */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            No specific creative instructions provided. CleverCut will use your brief and brand context to guide creative development.
          </div>

          {(aiDos.length > 0 || aiDonts.length > 0) && (
            <div
              style={{
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'rgba(244, 244, 236, 0.02)',
                padding: '8px 12px',
              }}
            >
              <button
                type="button"
                onClick={() => setShowAiFallback((v) => !v)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}
              >
                <span>AI Interpretation — Brief-Derived Guidelines (Not user-entered)</span>
                <span style={{ fontSize: 12, color: 'var(--cc-emphasis)' }}>
                  {showAiFallback ? 'Hide' : 'View'}
                </span>
              </button>
              {showAiFallback && (
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                  {aiDos.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                        AI-Derived Focus Areas
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {aiDos.map((item, i) => (
                          <li key={i} style={{ marginBottom: 3 }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiDonts.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                        AI-Derived Safeguards
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {aiDonts.map((item, i) => (
                          <li key={i} style={{ marginBottom: 3 }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {hasIssues && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: 0 }}>
                Conflicts or Clarification Needed
              </div>
              {conflicts.map((c, idx) => (
                <div
                  key={c.id || idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 7,
                    backgroundColor: 'rgba(255, 122, 107, 0.09)',
                    border: '1px solid rgba(255, 122, 107, 0.25)',
                    fontSize: 12,
                    color: 'var(--cc-danger)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    <strong>Conflicting Instructions:</strong> {c.description}
                    {c.resolution_hint ? ` ${c.resolution_hint}` : ''}
                  </span>
                </div>
              ))}
              {unsupportedClaims.map((u, idx) => (
                <div
                  key={u.id || idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 7,
                    backgroundColor: 'rgba(242, 184, 75, 0.09)',
                    border: '1px solid rgba(242, 184, 75, 0.25)',
                    fontSize: 12,
                    color: 'var(--cc-warning)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    <strong>Unverified Claim Flagged:</strong> &ldquo;{u.text}&rdquo; — {u.reason}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 1. User-Provided Instructions (verbatim from Brief) */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                1. User-Provided Instructions (Original Brief Instructions)
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(244, 244, 236, 0.07)',
                  color: 'var(--cc-text-2)',
                }}
              >
                Entered by You
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div
                style={{
                  backgroundColor: 'rgba(95, 212, 174, 0.05)',
                  border: '1px solid rgba(95, 212, 174, 0.2)',
                  borderRadius: 7,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success, var(--cc-success))', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={13} />
                  <span>MUST FOLLOW (DO&apos;S)</span>
                </div>
                {rawUserDos.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {rawUserDos.map((d, i) => (
                      <li key={d.id || i} style={{ marginBottom: 3 }}>{d.text}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>None specified</div>
                )}
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 122, 107, 0.05)',
                  border: '1px solid rgba(255, 122, 107, 0.2)',
                  borderRadius: 7,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--error, var(--cc-danger))', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertCircle size={13} />
                  <span>MUST AVOID (DON&apos;TS)</span>
                </div>
                {rawUserDonts.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {rawUserDonts.map((d, i) => (
                      <li key={d.id || i} style={{ marginBottom: 3 }}>{d.text}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>None specified</div>
                )}
              </div>
            </div>
          </div>

          {/* 2. AI Interpretation */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(244, 244, 236, 0.025)',
              border: '1px solid rgba(244, 244, 236, 0.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                2. AI Interpretation — How CleverCut Will Apply These
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 999,
                  backgroundColor: 'rgba(244, 244, 236, 0.07)',
                  color: 'var(--cc-emphasis)',
                }}
              >
                AI Interpreted
              </span>
            </div>
            {interpretationSummary && (
              <p style={{ margin: '0 0 8px 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {interpretationSummary}
              </p>
            )}
            {normalizedRules.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {normalizedRules.map((r, i) => (
                  <li key={r.id || i} style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>
                      {r.type === 'dont' ? 'Avoid: ' : 'Include: '}
                    </span>
                    {r.normalized_rule || r.original_text}
                    {r.intent_category ? ` (${r.intent_category})` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {aiDos.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                      Applied Creative Requirements
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {aiDos.map((item, i) => (
                        <li key={i} style={{ marginBottom: 3 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiDonts.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                      Enforced Exclusions
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {aiDonts.map((item, i) => (
                        <li key={i} style={{ marginBottom: 3 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Conflicts or Clarification Needed */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: hasIssues ? 'rgba(255, 122, 107, 0.05)' : 'var(--bg-elevated)',
              border: hasIssues ? '1px solid rgba(255, 122, 107, 0.25)' : '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              3. Conflicts or Clarification Needed
            </div>
            {!hasIssues ? (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={13} style={{ color: 'var(--success, var(--cc-success))', flexShrink: 0 }} />
                <span>No conflicts or clarifications needed. Your instructions are clear and consistent.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {conflicts.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      backgroundColor: 'rgba(255, 122, 107, 0.09)',
                      border: '1px solid rgba(255, 122, 107, 0.25)',
                      fontSize: 12,
                      color: 'var(--cc-danger)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                    }}
                  >
                    <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      <strong>Conflicting Instructions:</strong> {c.description}
                      {c.resolution_hint ? ` ${c.resolution_hint}` : ''}
                    </span>
                  </div>
                ))}

                {unsupportedClaims.map((u, idx) => (
                  <div
                    key={u.id || idx}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      backgroundColor: 'rgba(242, 184, 75, 0.09)',
                      border: '1px solid rgba(242, 184, 75, 0.25)',
                      fontSize: 12,
                      color: 'var(--cc-warning)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                    }}
                  >
                    <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      <strong>Unverified Claim Flagged:</strong> &ldquo;{u.text}&rdquo; — {u.reason}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * H. Assumptions & Missing Information Card
 * Visually distinguishes unconfirmed inferences from facts.
 */
function AssumptionsCard({ verifiedFacts = [], assumptions = [], missing = [], isEditing, onStartEdit, onCancelEdit, onSave }) {
  const [assumpText, setAssumpText] = useState(assumptions.join('\n'));
  const [missingText, setMissingText] = useState(missing.join('\n'));

  useEffect(() => {
    setAssumpText(assumptions.join('\n'));
    setMissingText(missing.join('\n'));
  }, [assumptions, missing]);

  const handleSave = () => {
    const nextAssump = assumpText.split('\n').map((l) => l.trim()).filter(Boolean);
    const nextMissing = missingText.split('\n').map((l) => l.trim()).filter(Boolean);
    onSave(nextAssump, nextMissing);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '16px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HelpCircle size={16} style={{ color: 'var(--text-tertiary)' }} />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            H. Assumptions & Missing Information
          </h3>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={onStartEdit}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
        Confirmed user inputs are shown separately from AI inferences and missing details.
      </div>

      {!isEditing && Array.isArray(verifiedFacts) && verifiedFacts.length > 0 && (
        <div
          style={{
            marginBottom: 14,
            backgroundColor: 'rgba(95, 212, 174, 0.05)',
            border: '1px solid rgba(95, 212, 174, 0.2)',
            borderRadius: 8,
            padding: '10px 14px',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success, var(--cc-success))', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={13} />
            <span>VERIFIED USER INPUTS (CONFIRMED)</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {verifiedFacts.map((item, i) => (
              <li key={i} style={{ marginBottom: 3 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning, var(--cc-warning))', marginBottom: 4 }}>
              AI Inferred Assumptions (One per line):
            </div>
            <textarea
              rows={3}
              value={assumpText}
              onChange={(e) => setAssumpText(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                padding: '8px 10px',
                color: 'var(--text-primary)',
                fontSize: 12,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Missing Information / Follow-ups (One per line):
            </div>
            <textarea
              rows={3}
              value={missingText}
              onChange={(e) => setMissingText(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                padding: '8px 10px',
                color: 'var(--text-primary)',
                fontSize: 12,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={onCancelEdit}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                backgroundColor: 'var(--cc-action)',
                border: 'none',
                color: 'var(--cc-on-action)',
                borderRadius: 999,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save Details
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {/* Assumptions */}
          <div
            style={{
              backgroundColor: 'rgba(242, 184, 75, 0.05)',
              border: '1px solid rgba(242, 184, 75, 0.25)',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning, var(--cc-warning))', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={14} />
              <span>INFERRED ASSUMPTIONS</span>
            </div>
            {assumptions && assumptions.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {assumptions.map((item, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No unconfirmed assumptions made</div>
            )}
          </div>

          {/* Missing Information */}
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <HelpCircle size={14} />
              <span>MISSING INFORMATION</span>
            </div>
            {missing && missing.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {missing.map((item, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>All essential brief, brand, and production settings are provided</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
