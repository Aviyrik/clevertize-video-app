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
} from 'lucide-react';

export default function ScreenUnderstanding({
  understanding,
  onUpdateUnderstanding,
  onApproveAndContinue,
  onBackToBrief,
  onRegenerate,
  isRegenerating = false,
  isSaving = false,
  originalBrief = '',
  businessName = '',
  businessType = '',
  town = '',
  isOutdated = false,
  error = '',
}) {
  const [editingSection, setEditingSection] = useState(null);
  const [draftData, setDraftData] = useState(understanding || {});
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenNotes, setRegenNotes] = useState('');

  useEffect(() => {
    if (understanding) {
      setDraftData(understanding);
    }
  }, [understanding]);

  if (!draftData || (!draftData.business_understanding && !isRegenerating)) {
    return (
      <div style={{ maxWidth: 840, margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <div
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
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={28} />
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            Analyzing Your Creative Brief…
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', maxWidth: 460 }}>
            Our AI Understanding engine is structuring your business proposition, audience insights, and guardrails.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              onClick={onBackToBrief}
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
              Back to Brief
            </button>
            <button
              type="button"
              onClick={() => onRegenerate && onRegenerate('')}
              style={{
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Generate Analysis
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

  const handleSaveGuardrails = (dos, donts) => {
    const updated = {
      ...draftData,
      creative_guardrails: {
        dos: Array.isArray(dos) ? dos : [],
        donts: Array.isArray(donts) ? donts : [],
      },
      approval_status: 'pending',
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
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  AI Understanding & Strategy
                </h1>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '3px 8px',
                    borderRadius: 12,
                    backgroundColor: isOutdated
                      ? 'rgba(239, 68, 68, 0.15)'
                      : isApproved
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(99, 102, 241, 0.15)',
                    color: isOutdated
                      ? 'var(--error, #ef4444)'
                      : isApproved
                      ? 'var(--success, #10b981)'
                      : 'var(--accent-primary, #6366f1)',
                  }}
                >
                  {isOutdated ? 'Outdated Brief' : isApproved ? 'Approved' : 'Pending Review'}
                </span>
                {draftData.is_mock && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: 'var(--warning, #f59e0b)',
                    }}
                    title="Spine running in structured offline/test mode"
                  >
                    Test/Offline Mode
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                Review, refine, and approve how CleverCut interpreted your brief before generating creative ideas.
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

        {/* Brand Context Strip */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Store size={14} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{businessName || 'Brand'}</span>
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
          </div>

          <button
            type="button"
            onClick={onBackToBrief}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
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
        </div>

        {/* Outdated Notice */}
        {isOutdated && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--error, #ef4444)',
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
                Your original brief changed after approval. Please review the updated interpretation and re-approve.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRegenerate && onRegenerate('')}
              style={{
                backgroundColor: 'var(--error, #ef4444)',
                border: 'none',
                color: '#fff',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
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
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--error, #ef4444)',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Sections Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* A. Business Understanding */}
        <SectionCard
          id="business_understanding"
          title="A. Business Understanding"
          icon={<Store size={16} style={{ color: 'var(--accent-primary)' }} />}
          content={draftData.business_understanding}
          isEditing={editingSection === 'business_understanding'}
          onStartEdit={() => setEditingSection('business_understanding')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={(val) => handleSaveSection('business_understanding', val)}
          helper="What CleverCut understood about your business, positioning, and offerings."
        />

        {/* B. Campaign Objective */}
        <SectionCard
          id="campaign_objective"
          title="B. Campaign Objective"
          icon={<Target size={16} style={{ color: '#10B981' }} />}
          content={draftData.campaign_objective}
          isEditing={editingSection === 'campaign_objective'}
          onStartEdit={() => setEditingSection('campaign_objective')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={(val) => handleSaveSection('campaign_objective', val)}
          helper="Primary outcome and measurable intent of this film campaign."
        />

        {/* C. Target Audience */}
        <SectionCard
          id="target_audience"
          title="C. Target Audience"
          icon={<Users size={16} style={{ color: '#38BDF8' }} />}
          content={draftData.target_audience}
          isEditing={editingSection === 'target_audience'}
          onStartEdit={() => setEditingSection('target_audience')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={(val) => handleSaveSection('target_audience', val)}
          helper="Who this film is speaking to, their motivations, and lifestyle context."
        />

        {/* D. Core Communication */}
        <SectionCard
          id="core_communication"
          title="D. Core Communication"
          icon={<MessageSquare size={16} style={{ color: '#F59E0B' }} />}
          content={draftData.core_communication}
          isEditing={editingSection === 'core_communication'}
          onStartEdit={() => setEditingSection('core_communication')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={(val) => handleSaveSection('core_communication', val)}
          helper="The single key takeaway and message the viewer must remember."
        />

        {/* E. Occasion & Context */}
        <SectionCard
          id="occasion_context"
          title="E. Occasion & Context"
          icon={<Calendar size={16} style={{ color: '#EC4899' }} />}
          content={draftData.occasion_context}
          isEditing={editingSection === 'occasion_context'}
          onStartEdit={() => setEditingSection('occasion_context')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={(val) => handleSaveSection('occasion_context', val)}
          helper="Festivals, seasonal events, or timing context relevant to the ad."
        />

        {/* F. Creative Guardrails (Dos & Don'ts) */}
        <GuardrailsCard
          guardrails={draftData.creative_guardrails || { dos: [], donts: [] }}
          isEditing={editingSection === 'creative_guardrails'}
          onStartEdit={() => setEditingSection('creative_guardrails')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={handleSaveGuardrails}
        />

        {/* G. Creative Opportunity */}
        <SectionCard
          id="creative_opportunity"
          title="G. Creative Opportunity"
          icon={<Lightbulb size={16} style={{ color: '#FACC15' }} />}
          content={draftData.creative_opportunity}
          isEditing={editingSection === 'creative_opportunity'}
          onStartEdit={() => setEditingSection('creative_opportunity')}
          onCancelEdit={() => setEditingSection(null)}
          onSave={(val) => handleSaveSection('creative_opportunity', val)}
          helper="Angles, emotional triggers, or unique narrative opportunities identified from the brief."
        />

        {/* H. Assumptions & Missing Information */}
        <AssumptionsCard
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
              backgroundColor: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              color: isApproved ? 'var(--success)' : 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isApproved ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {isApproved ? 'Interpretation Approved' : 'Ready to proceed to Creative Ideas?'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {isApproved
                ? 'Only this approved interpretation will guide creative idea generation.'
                : 'Review above sections or make edits, then approve to unlock Idea Generation.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={onBackToBrief}
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
            Back to Brief
          </button>

          <button
            type="button"
            onClick={() => onApproveAndContinue && onApproveAndContinue(draftData)}
            disabled={isSaving || isRegenerating}
            style={{
              backgroundColor: 'var(--accent-primary)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: 8,
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 700,
              cursor: isSaving ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 10px var(--accent-glow)',
            }}
          >
            {isSaving ? (
              <span>Saving Approval…</span>
            ) : (
              <>
                <Check size={16} />
                <span>Approve & Continue to Ideas</span>
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
                <RotateCcw size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
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
              Provide any specific corrections or additional context you want the AI Understanding engine to incorporate.
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
                  backgroundColor: 'var(--accent-primary)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 6,
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
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
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
              e.currentTarget.style.color = 'var(--accent-primary)';
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
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>
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
              border: '1px solid var(--accent-primary)',
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
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                borderRadius: 6,
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
function GuardrailsCard({ guardrails, isEditing, onStartEdit, onCancelEdit, onSave }) {
  const [dosText, setDosText] = useState((guardrails.dos || []).join('\n'));
  const [dontsText, setDontsText] = useState((guardrails.donts || []).join('\n'));

  useEffect(() => {
    setDosText((guardrails.dos || []).join('\n'));
    setDontsText((guardrails.donts || []).join('\n'));
  }, [guardrails]);

  const handleSave = () => {
    const dos = dosText.split('\n').map((l) => l.trim()).filter(Boolean);
    const donts = dontsText.split('\n').map((l) => l.trim()).filter(Boolean);
    onSave(dos, donts);
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
          <ShieldCheck size={16} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            F. Creative Guardrails
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

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success, #10b981)', marginBottom: 4 }}>
              Mandatory Elements / Dos (One per line):
            </div>
            <textarea
              rows={3}
              value={dosText}
              onChange={(e) => setDosText(e.target.value)}
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
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--error, #ef4444)', marginBottom: 4 }}>
              Strict Restrictions / Don'ts (One per line):
            </div>
            <textarea
              rows={3}
              value={dontsText}
              onChange={(e) => setDontsText(e.target.value)}
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
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                borderRadius: 6,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save Guardrails
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {/* Dos */}
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success, #10b981)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} />
              <span>MUST INCLUDE (DOS)</span>
            </div>
            {guardrails.dos && guardrails.dos.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {guardrails.dos.map((item, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No mandatory inclusions specified</div>
            )}
          </div>

          {/* Don'ts */}
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--error, #ef4444)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14} />
              <span>AVOID / RESTRICTIONS (DON'TS)</span>
            </div>
            {guardrails.donts && guardrails.donts.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {guardrails.donts.map((item, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No specific restrictions specified</div>
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
function AssumptionsCard({ assumptions = [], missing = [], isEditing, onStartEdit, onCancelEdit, onSave }) {
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
          <HelpCircle size={16} style={{ color: 'var(--warning, #f59e0b)' }} />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
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

      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
        CleverCut clearly separates verified facts from inferences. Please verify these assumptions before proceeding.
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning, #f59e0b)', marginBottom: 4 }}>
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
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                borderRadius: 6,
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
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning, #f59e0b)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
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
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
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
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Brief includes all necessary details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
