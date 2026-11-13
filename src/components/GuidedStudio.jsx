import React, { useState, useEffect, useRef } from 'react';
import { downloadVideoWithTicket } from '../utils/downloadVideo.js';
import { PostGenerationFeedbackPrompt } from './v2/VideoRatingControls.jsx';
import {
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Edit3,
  X,
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
  Lock,
  Play,
  Volume2,
  Mic,
  MicOff,
  Store,
  Building2,
  Upload,
  Download,
  Share2,
  CheckCircle2,
  RotateCcw,
  FileText,
  FileCode2,
  Globe,
  Copy,
  Bookmark,
  Users,
  Gift,
  Smartphone,
  Truck,
  MessageCircle,
  Zap,
  House,
} from 'lucide-react';
import { getSuggestedAudiences } from './v2/BusinessOnboardingModal.jsx';
import { videoLogoOf, profileLogoOf, toImageFile } from '../utils/videoLogo.js';
import { isVideoLinkExpired } from '../utils/videoLink.js';
import { filterReachedChoices } from '../utils/choicesVisibility.js';
import VideoFormatFields from './v2/VideoFormatFields.jsx';
import OptionalFieldDisclosure from './v2/OptionalFieldDisclosure.jsx';
import HelpTooltip from './v2/HelpTooltip.jsx';
import ContextualTipBanner from './v2/ContextualTipBanner.jsx';
import { HELP_TOOLTIPS, CONTEXTUAL_TIPS } from '../data/tourSteps.js';
import { shouldShowContextualTip } from '../utils/onboarding.js';
import {
  BrandResearchLoader,
  IdeaGenerationLoader,
  HookGenerationLoader,
  StoryGenerationLoader,
  ScriptGenerationLoader,
} from './v2/WorkflowLoadingScreen.jsx';
import CreativeInstructionsSection from './v2/CreativeInstructionsSection.jsx';
import OccasionEventSection from './v2/OccasionEventSection.jsx';
import ProductPhotoSection from './v2/ProductPhotoSection.jsx';
import TargetAudienceSection from './v2/TargetAudienceSection.jsx';

/**
 * 6 STREAMLINED STAGES FOR GUIDED CREATIVE STUDIO
 */
export const STUDIO_STAGES = [
  { id: 'brief', num: '01', label: 'Brief' },
  { id: 'settings', num: '02', label: 'Settings' },
  { id: 'understanding', num: '03', label: 'Understanding' },
  { id: 'idea', num: '04', label: 'Ideas' },
  { id: 'opening', num: '05', label: 'Opening' },
  { id: 'script', num: '06', label: 'Script' },
  { id: 'video', num: '07', label: 'Video' },
];

/**
 * 1. LIGHTWEIGHT PROGRESS INDICATOR
 */
export function StudioProgressHeader({
  currentStage,
  completedStages = [],
  onNavigateStage,
}) {
  const currentIdx = STUDIO_STAGES.findIndex((s) => s.id === currentStage);
  const progressRef = useRef(null);

  // On narrow screens the bar scrolls sideways; keep the current stage in view
  useEffect(() => {
    const el = progressRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const current = el.querySelector('[data-current-stage="true"]');
    if (current) el.scrollLeft = Math.max(0, current.offsetLeft - (el.clientWidth - current.offsetWidth) / 2);
  }, [currentStage]);

  return (
    <div ref={progressRef} className="studio-progress" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      padding: '10px 16px',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      marginBottom: 20,
      flexWrap: 'wrap',
    }}>
      {STUDIO_STAGES.map((st, idx) => {
        const isCurrent = st.id === currentStage;
        const isCompleted = completedStages.includes(st.id) || idx < currentIdx;
        const isNavigable = isCompleted && !isCurrent;

        return (
          <React.Fragment key={st.id}>
            <button
              type="button"
              disabled={!isNavigable}
              data-current-stage={isCurrent ? 'true' : undefined}
              onClick={() => isNavigable && onNavigateStage(st.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 8px',
                borderRadius: 6,
                cursor: isNavigable ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: isCurrent ? 600 : isCompleted ? 600 : 500,
                color: isCurrent
                  ? 'var(--cc-emphasis)'
                  : isCompleted
                  ? 'var(--text-primary)'
                  : 'var(--text-tertiary)',
                backgroundColor: isCurrent ? 'var(--bg-active)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
              title={isNavigable ? `Back to ${st.label}` : st.label}
            >
              <span style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: isCurrent
                  ? 'var(--cc-action)'
                  : isCompleted
                  ? 'rgba(95, 212, 174, 0.15)'
                  : 'var(--bg-elevated)',
                color: isCurrent
                  ? 'var(--cc-on-action)'
                  : isCompleted
                  ? 'var(--success)'
                  : 'var(--text-tertiary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
              }}>
                {isCompleted && !isCurrent ? <Check size={10} strokeWidth={3} /> : st.num}
              </span>
              <span>{st.label}</span>
            </button>

            {idx < STUDIO_STAGES.length - 1 && (
              <span aria-hidden="true" style={{ color: 'var(--border-subtle)', fontSize: 12, flexShrink: 0 }}>→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * 2. YOUR CHOICES (Compact Persistent Strip)
 */
export function StudioChoicesBar({
  explicitChoices = {},
  currentStage = null,
  completedStages = [],
  onNavigateStage,
  hasStaleWarning,
  onApplyUpdate,
}) {
  const {
    style,
    language,
    duration,
    dimension,
    platform,
    idea,
    opening,
  } = explicitChoices || {};

  // Form list of active confirmed explicit choices
  const activeChoices = [];
  if (style) activeChoices.push({ type: 'style', label: style, stage: 'settings' });
  if (language) activeChoices.push({ type: 'language', label: language, stage: 'settings' });
  if (duration) activeChoices.push({ type: 'duration', label: duration, stage: 'settings' });
  if (dimension || platform) activeChoices.push({ type: 'dimension', label: dimension || platform, stage: 'settings' });
  if (idea) activeChoices.push({ type: 'idea', label: idea, prefix: 'Idea', stage: 'idea' });
  if (opening) activeChoices.push({ type: 'opening', label: opening, prefix: 'Opening', stage: 'opening' });

  // Never show a choice from a stage the user hasn't reached yet (e.g. specs carried over
  // from Simple Studio must not appear on Brief before the user has seen Settings).
  const visibleChoices = filterReachedChoices(activeChoices, currentStage, completedStages)
    // On Settings stage, avoid echoing back settings already visible in the controls unless stale update banner is active
    .filter((c) => !(currentStage === 'settings' && !hasStaleWarning && c.stage === 'settings'));

  // STRICT RULE: If zero explicit choices to display, hide the entire strip!
  if (visibleChoices.length === 0) return null;

  return (
    <div style={{
      padding: '4px 4px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)' }}>
          Choices:
        </span>

        {visibleChoices.map((item, idx) => (
          <React.Fragment key={item.type}>
            <button
              type="button"
              onClick={() => onNavigateStage && onNavigateStage(item.stage)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 4px',
                borderRadius: 4,
                background: 'none',
                border: 'none',
                fontSize: 12,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              title={`Edit ${item.prefix || item.type}`}
            >
              {item.prefix && <span style={{ color: 'var(--text-tertiary)' }}>{item.prefix}:</span>}
              <strong style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-primary)' }}>
                {item.label}
              </strong>
            </button>
            {idx < visibleChoices.length - 1 && (
              <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>·</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {hasStaleWarning && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--cc-emphasis)' }}>
          <AlertCircle size={13} />
          <span>Update script to apply changes</span>
          <button
            type="button"
            onClick={onApplyUpdate}
            style={{
              padding: '3px 9px',
              borderRadius: 999,
              backgroundColor: 'var(--cc-action)',
              color: 'var(--cc-on-action)',
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Update
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 3. SCREEN 01 — BUSINESS
 */
export function Screen01Business({
  userContext = {},
  updateUserContext,
  handleFileUpload,
  onContinue,
  BUSINESS_TYPES = [],
  autoEdit = false,
  onOpenUrlModal,
}) {
  const [hasInitialBrand, setHasInitialBrand] = useState(() => !autoEdit && Boolean(userContext.businessName?.trim()));
  const [isEditingExisting, setIsEditingExisting] = useState(() => autoEdit || !Boolean(userContext.businessName?.trim()));
  const [errorMsg, setErrorMsg] = useState('');

  // When businessName is cleared (e.g. via reset brand) or autoEdit is requested, immediately reveal input form
  React.useEffect(() => {
    if (!userContext.businessName?.trim() || autoEdit) {
      setHasInitialBrand(false);
      setIsEditingExisting(true);
    }
  }, [userContext.businessName, autoEdit]);

  // Show Current Brand card ONLY if brand existed on mount, user hasn't chosen to edit, and name is non-empty
  const showCurrentBrandCard = Boolean(hasInitialBrand && !isEditingExisting && userContext.businessName?.trim());

  const handleNext = () => {
    if (!userContext.businessName?.trim()) {
      setErrorMsg('Please enter your business or brand name.');
      return;
    }
    setErrorMsg('');
    onContinue();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & One Short Explanation */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            {userContext.businessName?.trim() ? `Brand Profile: ${userContext.businessName}` : 'Tell us about your business'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {userContext.businessName?.trim()
              ? 'Edit your brand profile below or continue to your brief.'
              : 'Used to tailor scripts and video ideas to your brand.'}
          </p>
        </div>

        {onOpenUrlModal && (
          <button
            type="button"
            onClick={onOpenUrlModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 13px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: 'rgba(244, 244, 236, 0.06)',
              border: '1px solid rgba(244, 244, 236, 0.315)',
              color: 'var(--cc-text-2)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Scan your store or website to auto-fill brand details"
          >
            <Globe size={14} />
            <span>Autofill from Website</span>
          </button>
        )}
      </div>

      {/* Existing Brand Profile Banner */}
      {showCurrentBrandCard && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 10,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {userContext.logo && (userContext.logo.previewUrl || userContext.logo.data) && (
              <img
                src={userContext.logo.previewUrl || `data:${userContext.logo.mime || 'image/png'};base64,${userContext.logo.data}`}
                alt="Brand Logo"
                style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'contain', backgroundColor: '#ffffff', padding: 2, border: '1px solid var(--border-subtle)', flexShrink: 0 }}
              />
            )}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                Current Brand
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                Using {userContext.businessName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {userContext.businessType}{userContext.town ? ` · ${userContext.town}` : ''}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingExisting(true)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            Edit brand
          </button>
        </div>
      )}

      {/* Main Form Fields */}
      {!showCurrentBrandCard && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {errorMsg && (
            <div style={{ color: 'var(--error)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Business Name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Business Name <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              value={userContext.businessName || ''}
              onChange={(e) => {
                updateUserContext('businessName', e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleNext();
                }
              }}
              placeholder="e.g. Royal Silks, Sharma Sweets, City Dental..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                fontSize: 14,
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Category
            </label>
            <select
              value={userContext.businessType || 'Retail Store'}
              onChange={(e) => updateUserContext('businessType', e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                fontSize: 13,
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)'
              }}
            >
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>

          {/* City / Location */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              City / Location <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={userContext.town || ''}
              onChange={(e) => updateUserContext('town', e.target.value)}
              placeholder="e.g. Siliguri or Bangalore"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                fontSize: 13,
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Website */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Website / Social Link <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <input
              type="url"
              value={userContext.websiteUrl || ''}
              onChange={(e) => updateUserContext('websiteUrl', e.target.value)}
              placeholder="e.g. https://mybrand.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                fontSize: 13,
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Brand Logo (Optional) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                <Building2 size={13} style={{ color: 'var(--cc-emphasis)' }} />
                <span>Brand Logo <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span></span>
              </label>
              {userContext.logo && (
                <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} />
                  Attached
                </span>
              )}
            </div>

            {userContext.logo ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'var(--bg-elevated)',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {(userContext.logo.previewUrl || userContext.logo.data) && (
                    <img
                      src={userContext.logo.previewUrl || `data:${userContext.logo.mime || 'image/png'};base64,${userContext.logo.data}`}
                      alt="Brand Logo"
                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'contain', backgroundColor: '#ffffff', padding: 2, border: '1px solid var(--border-subtle)' }}
                    />
                  )}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userContext.logo.name || 'Brand logo'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {userContext.productPhoto?.fromWebsite ? '✓ Attached from website' : 'Attached for video production'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <span>Replace</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && handleFileUpload) handleFileUpload(file, 'logo');
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => updateUserContext('logo', null)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--error)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3
                    }}
                  >
                    <Trash2 size={11} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px dashed var(--border-default)',
                color: 'var(--cc-emphasis)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}>
                <Upload size={13} />
                <span>Upload brand logo (Optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && handleFileUpload) handleFileUpload(file, 'logo');
                  }}
                />
              </label>
            )}
          </div>

        </div>
      )}

      {/* Primary CTA */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button
          type="button"
          onClick={handleNext}
          style={{
            padding: '12px 28px',
            borderRadius: 999,
            backgroundColor: 'var(--cc-action)',
            color: 'var(--cc-on-action)',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)'
          }}
        >
          <span>Continue</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * 4. SCREEN 02 — BRIEF
 */
export function Screen02Brief({
  userContext = {},
  updateUserContext,
  handleFileUpload,
  onContinue,
  onBack,
  isRecording,
  toggleRecording,
  briefSuggestions = [],
  researchData,
  isResearching,
  onOpenScriptModal,
  onOpenUrlModal,
  onEditBrand,
  guardrailDraftInputs = null,
  onGuardrailDraftChange = null,
  optionalExpanded = null,
  onOptionalExpandedChange = null,
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const [localOptionalExpanded, setLocalOptionalExpanded] = useState({
    inspiration: false,
    audience: false,
    instructions: false,
    occasion: false,
    productPhoto: false,
  });
  const optExpanded = optionalExpanded || localOptionalExpanded;
  const setOptSectionExpanded = (key, next) => {
    const updated = { ...optExpanded, [key]: next };
    if (typeof onOptionalExpandedChange === 'function') {
      onOptionalExpandedChange(updated);
    } else {
      setLocalOptionalExpanded(updated);
    }
  };

  const SUGGESTION_CHIPS = [
    { label: 'Offer', starter: 'Announce a special limited-time festive discount: ' },
    { label: 'Product', starter: 'Showcase our signature handcrafted collection: ' },
    { label: 'New idea', starter: 'Share a helpful insider secret about choosing quality: ' },
    { label: 'Customer problem', starter: 'Show how to avoid the frustration of poor fittings: ' },
    { label: 'Announcement', starter: 'Announce guaranteed same-day delivery for urgent orders: ' },
  ];

  const handleApplySuggestion = (starter) => {
    updateUserContext('brief', starter);
    if (errorMsg) setErrorMsg('');
  };

  const handleNext = () => {
    if (!userContext.brief?.trim()) {
      setErrorMsg('Please tell us what you want this video to say.');
      return;
    }
    setErrorMsg('');
    onContinue();
  };

  const charCount = (userContext.brief || '').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Active Brand Confirmation Banner */}
      {userContext.businessName && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(244, 244, 236, 0.075)',
                color: 'var(--cc-emphasis)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Store size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)' }}>
                  Creating Video For
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {userContext.businessName}
                </span>
                {userContext.businessType && (
                  <span
                    style={{
                      fontSize: 12,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {userContext.businessType}
                  </span>
                )}
                {userContext.town && (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>· {userContext.town}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                fontSize: 12,
                color: 'var(--cc-emphasis)',
                backgroundColor: 'rgba(244, 244, 236, 0.05)',
                border: '1px solid rgba(244, 244, 236, 0.225)',
                padding: '4px 10px',
                borderRadius: 6,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Sparkles size={12} />
              <span>Active Brand Context</span>
            </div>

          </div>
        </div>
      )}

      {/* Title & Short Explanation with Contextual Actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Your Video Brief</span>
            <HelpTooltip
              title={HELP_TOOLTIPS.brief_input.title}
              body={HELP_TOOLTIPS.brief_input.body}
              ariaLabel="Tips for writing your brief"
            />
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Describe what you want to promote or show in your own words.
          </p>
        </div>

        {(onOpenScriptModal || onOpenUrlModal) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {onOpenScriptModal && (
              <button
                type="button"
                onClick={onOpenScriptModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 13px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: 'rgba(95, 212, 174, 0.12)',
                  border: '1px solid rgba(95, 212, 174, 0.35)',
                  color: 'var(--cc-success)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Paste an existing script draft to auto-import scenes"
              >
                <FileCode2 size={14} />
                <span>Paste Script</span>
              </button>
            )}
            {onOpenUrlModal && (
              <button
                type="button"
                onClick={onOpenUrlModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 13px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: 'rgba(244, 244, 236, 0.06)',
                  border: '1px solid rgba(244, 244, 236, 0.315)',
                  color: 'var(--cc-text-2)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Scan your store or landing page to extract products & offers"
              >
                <Globe size={14} />
                <span>Scan URL</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hero Textarea Box */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {errorMsg && (
          <div style={{ color: 'var(--error)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <textarea
            className="brief-textarea"
            rows={5}
            value={userContext.brief || ''}
            onChange={(e) => {
              updateUserContext('brief', e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder={`e.g. Show fresh pure desi ghee sweets being packed into premium festive gift hampers. Mention same-day delivery for corporate orders.`}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              // bottom room so text never runs under the Dictate button
              padding: '14px 16px 52px',
              borderRadius: 8,
              border: '1px solid var(--border-default)',
              fontSize: 14,
              lineHeight: 1.5,
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              resize: 'vertical'
            }}
          />

          {/* Dictate Button */}
          <button className="brief-dictate-btn"
            type="button"
            onClick={toggleRecording}
            aria-label={isRecording ? 'Stop recording voice brief' : 'Dictate your brief using microphone'}
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 20,
              backgroundColor: isRecording ? 'rgba(255, 122, 107, 0.15)' : 'var(--bg-surface)',
              border: isRecording ? '1px solid var(--error)' : '1px solid var(--border-default)',
              color: isRecording ? 'var(--error)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title={isRecording ? 'Stop recording' : 'Dictate your brief'}
          >
            {isRecording ? <MicOff size={13} /> : <Mic size={13} />}
            <span>{isRecording ? 'Listening…' : 'Dictate'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-tertiary)' }}>
          <span>Be direct and natural — the AI shapes this into visual scenes.</span>
          <span>{charCount} characters</span>
        </div>

        {/* Small Collapsible Inspiration Starters (Optional) */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
          <button
            type="button"
            aria-expanded={Boolean(optExpanded.inspiration)}
            aria-controls="director-brief-inspiration-panel"
            onClick={() => setOptSectionExpanded('inspiration', !optExpanded.inspiration)}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {optExpanded.inspiration ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
            <Lightbulb size={12} style={{ color: 'var(--cc-emphasis)' }} aria-hidden="true" />
            <span>Need inspiration? Sample starters &amp; category ideas</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>(Optional)</span>
          </button>

          {optExpanded.inspiration && (
            <div id="director-brief-inspiration-panel" style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SUGGESTION_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplySuggestion(chip.starter)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Category Suggestions if available */}
              {Array.isArray(briefSuggestions) && briefSuggestions.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginBottom: 6 }}>
                    Ideas for your business category:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {briefSuggestions.slice(0, 3).map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          updateUserContext('brief', sug);
                          if (errorMsg) setErrorMsg('');
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '7px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Lightbulb size={12} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />{sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Optional Details Grouping (Collapsed by default) */}
      <div data-testid="brief-optional-details" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', padding: '2px 2px 0' }}>
          Optional Details
        </span>

        {/* Target Audience (Optional · Collapsed by default) */}
        <TargetAudienceSection
          id="director-target-audience"
          testId="target-audience-section"
          targetAudience={userContext.targetAudience || ''}
          businessType={userContext.businessType}
          onChange={(val) => updateUserContext('targetAudience', val)}
          expanded={Boolean(optExpanded.audience)}
          onToggleExpand={(next) => setOptSectionExpanded('audience', next)}
        />

            {/* Creative Instructions (Optional · Collapsed by default) */}
            <CreativeInstructionsSection
              creativeGuardrails={userContext.creativeGuardrails}
              onChange={(next) => updateUserContext('creativeGuardrails', next)}
              draftInputs={guardrailDraftInputs}
              onDraftChange={onGuardrailDraftChange}
              expanded={Boolean(optExpanded.instructions)}
              onToggleExpand={(next) => setOptSectionExpanded('instructions', next)}
            />

            {/* Occasion & Event (Optional · Collapsed by default) */}
            <OccasionEventSection
              eventContext={userContext.eventContext}
              onChange={(next) => updateUserContext('eventContext', next)}
              expanded={Boolean(optExpanded.occasion)}
              onToggleExpand={(next) => setOptSectionExpanded('occasion', next)}
            />

            {/* Product Photo (Optional · Collapsed by default) */}
            <ProductPhotoSection
              id="director-product-photo"
              testId="product-photo-section"
              productPhoto={userContext.productPhoto}
              onUploadFile={(file) => handleFileUpload && handleFileUpload(file, 'productPhoto')}
              onRemove={() => updateUserContext('productPhoto', null)}
              expanded={Boolean(optExpanded.productPhoto)}
              onToggleExpand={(next) => setOptSectionExpanded('productPhoto', next)}
            />
          </div>

      {/* Dynamic Background Research Status */}
      {isResearching && (
        <BrandResearchLoader
          businessName={businessName}
          category={userContext?.businessCategory}
          compact={true}
        />
      )}

      {researchData && !isResearching && (researchData.audienceInsight || researchData.creativeOpportunity) && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={11} style={{ color: 'var(--cc-emphasis)' }} />
            <span>Market Context (Background)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            {researchData.audienceInsight && (
              <div><strong>Audience:</strong> {researchData.audienceInsight}</div>
            )}
            {researchData.creativeOpportunity && (
              <div><strong>Opportunity:</strong> {researchData.creativeOpportunity}</div>
            )}
          </div>
        </div>
      )}

      {/* Inline Validation Message near Continue Bar */}
      {errorMsg && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: 'rgba(255, 122, 107, 0.1)',
            border: '1px solid rgba(255, 122, 107, 0.35)',
            color: 'var(--error, var(--cc-danger))',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="cc-production-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button
          type="button"
          onClick={onBack}
          className="cc-ghost-hover"
          style={{
            padding: '10px 16px',
            borderRadius: 999,
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          style={{
            padding: '12px 28px',
            borderRadius: 999,
            backgroundColor: 'var(--cc-action)',
            color: 'var(--cc-on-action)',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)'
          }}
        >
          <span>Continue</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * 5. SCREEN 03 — VIDEO SETTINGS
 */
export function Screen03Settings({
  userContext = {},
  updateUserContext,
  handleFileUpload,
  onLanguageChange,
  onStyleChange,
  onPlatformChange,
  onDimensionChange,
  onDurationChange,
  onContinue,
  onBack,
}) {
  const LANGUAGES = [
    'English', 'Hindi', 'Hinglish', 'Marathi',
    'Tamil', 'Telugu', 'Bengali', 'Gujarati',
    'Kannada', 'Malayalam', 'Punjabi'
  ];

  const DIMENSION_OPTIONS = [
    { id: '9:16', label: '9:16 Vertical', frameWidth: 11, frameHeight: 17 },
    { id: '16:9', label: '16:9 Landscape', frameWidth: 17, frameHeight: 11 },
    { id: '1:1', label: '1:1 Square', frameWidth: 14, frameHeight: 14 },
  ];

  const DURATION_OPTIONS = [
    { id: '15s', label: '15s' },
    { id: '20s', label: '20s', popular: true },
    { id: '30s', label: '30s' },
  ];

  const STYLES = [
    { id: 'Conversational / Dialogue', label: 'Conversational' },
    { id: 'UGC / Creator-style', label: 'UGC' },
    { id: 'Product Demo', label: 'Product Demo' },
    { id: 'Storytelling', label: 'Story' },
  ];

  const currentLang = userContext.language || 'English';
  const currentDuration = userContext.targetDuration || userContext.duration || '20s';
  const currentStyle = userContext.creativeStyle || 'UGC / Creator-style';
  const currentDimension = userContext.aspectRatio || userContext.dimension || (userContext.platform && userContext.platform.includes('16:9') ? '16:9' : userContext.platform && userContext.platform.includes('1:1') ? '1:1' : '9:16');

  const bType = String(userContext.businessType || '').toLowerCase();
  const isService = bType.includes('gym') || bType.includes('fitness') || bType.includes('salon') || bType.includes('beauty') || bType.includes('spa') || bType.includes('clinic') || bType.includes('dental') || bType.includes('health') || bType.includes('coaching') || bType.includes('tuition') || bType.includes('consult') || bType.includes('service') || bType.includes('agency') || bType.includes('interior') || bType.includes('repair');

  return (
    <div data-testid="director-settings-screen" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
        Video Settings
      </h1>

      {/* Compact Primary Settings Container */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}>
        {/* 1. Language Dropdown & 3. Video Length Segmented Control */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 16, alignItems: 'end' }}>
          <div>
            <label
              htmlFor="director-ad-language"
              style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginBottom: 7 }}
            >
              Language
            </label>
            <select
              id="director-ad-language"
              aria-label="Language"
              data-testid="director-language-select"
              value={currentLang}
              onChange={(e) => {
                const lang = e.target.value;
                if (onLanguageChange) onLanguageChange(lang);
                else updateUserContext('language', lang);
              }}
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {(LANGUAGES.includes(currentLang) ? LANGUAGES : [currentLang, ...LANGUAGES]).map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginBottom: 7 }}>
              Video Length
            </span>
            <div
              role="group"
              aria-label="Video Length"
              data-testid="director-duration-segmented"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                padding: 3,
                height: 38,
                boxSizing: 'border-box',
                borderRadius: 8,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                gap: 3,
              }}
            >
              {DURATION_OPTIONS.map((dur) => {
                const isSelected = currentDuration === dur.id;
                return (
                  <button
                    key={dur.id}
                    type="button"
                    aria-pressed={isSelected}
                    data-testid={`director-duration-option-${dur.id}`}
                    onClick={() => {
                      if (onDurationChange) onDurationChange(dur.id);
                      if (updateUserContext) {
                        updateUserContext('targetDuration', dur.id);
                        updateUserContext('duration', dur.id);
                      }
                    }}
                    style={{
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: isSelected ? 600 : 500,
                      backgroundColor: isSelected ? 'var(--cc-active)' : 'transparent',
                      color: isSelected ? 'var(--cc-text-1)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{dur.label}</span>
                    {dur.popular && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          opacity: isSelected ? 0.9 : 0.75,
                          color: isSelected ? '#ffffff' : 'var(--cc-emphasis)',
                        }}
                      >
                        Popular
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Video Dimension (3 compact options with aspect-ratio icon + label only) */}
        <div>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginBottom: 7 }}>
            Video Dimension
          </span>
          <div
            role="group"
            aria-label="Video Dimension"
            data-testid="director-dimension-group"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))',
              gap: 8,
            }}
          >
            {DIMENSION_OPTIONS.map((dim) => {
              const isSelected = currentDimension === dim.id;
              return (
                <button
                  key={dim.id}
                  type="button"
                  aria-pressed={isSelected}
                  data-testid={`director-dimension-option-${dim.id}`}
                  onClick={() => {
                    if (onDimensionChange) onDimensionChange(dim.id, dim.label);
                    if (onPlatformChange) onPlatformChange(dim.label, dim.id === '16:9' ? 'YouTube / 16:9' : dim.id === '1:1' ? 'Social Feed / 1:1' : 'Instagram Reels / 9:16');
                    if (updateUserContext) {
                      updateUserContext('aspectRatio', dim.id);
                      updateUserContext('dimension', dim.id);
                      updateUserContext('platform', dim.id === '16:9' ? 'YouTube / 16:9' : dim.id === '1:1' ? 'Social Feed / 1:1' : 'Instagram Reels / 9:16');
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                    border: isSelected ? '2px solid var(--cc-selected-line)' : '1px solid var(--border-subtle)',
                    boxShadow: isSelected ? '0 0 0 1px var(--cc-selected-line)' : 'none',
                    color: isSelected ? 'var(--cc-emphasis)' : 'var(--text-primary)',
                    fontSize: 12.5,
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: dim.frameWidth,
                        height: dim.frameHeight,
                        borderRadius: 2,
                        border: isSelected ? '1.5px solid var(--cc-selected-line)' : '1.5px solid var(--text-tertiary)',
                        backgroundColor: isSelected ? 'rgba(244, 244, 236, 0.09)' : 'transparent',
                        flexShrink: 0,
                      }}
                    />
                    <span>{dim.label}</span>
                  </span>
                  {isSelected && <Check size={13} strokeWidth={2.75} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Creative Style (4 compact tiles, style names only) */}
        <div>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginBottom: 7 }}>
            Creative Style
          </span>

          <div
            role="group"
            aria-label="Creative Style"
            data-testid="director-style-group"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))',
              gap: 8,
            }}
          >
            {STYLES.map((st) => {
              const isSelected = currentStyle === st.id ||
                (st.id.includes('UGC') && currentStyle.includes('UGC')) ||
                (st.id.includes('Comedy') && currentStyle.includes('Comedy'));

              return (
                <button
                  key={st.id}
                  type="button"
                  aria-pressed={isSelected}
                  data-testid={`director-style-option-${st.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => {
                    if (onStyleChange) onStyleChange(st.id, st.label);
                    else updateUserContext('creativeStyle', st.id);
                  }}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                    border: isSelected ? '2px solid var(--cc-selected-line)' : '1px solid var(--border-subtle)',
                    boxShadow: isSelected ? '0 0 0 1px var(--cc-selected-line)' : 'none',
                    borderRadius: 8,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    color: isSelected ? 'var(--cc-emphasis)' : 'var(--text-primary)',
                    fontSize: 12.5,
                    fontWeight: isSelected ? 600 : 500,
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{st.label}</span>
                  {isSelected && <Check size={13} strokeWidth={2.75} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Compact Two-Column Optional Assets: Product Photo & Logo Image */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
            Optional Assets
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 12 }}>
            {/* Product Photo (only for physical product businesses) */}
            {!isService && (
              <div data-testid="director-settings-product-asset" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Package size={12} aria-hidden="true" />
                  <span>Product Photo</span>
                </span>

                {userContext.productPhoto ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      {(userContext.productPhoto.previewUrl || userContext.productPhoto.data) && (
                        <img
                          src={userContext.productPhoto.previewUrl || `data:${userContext.productPhoto.mime || 'image/jpeg'};base64,${userContext.productPhoto.data}`}
                          alt="Product"
                          style={{ width: 28, height: 28, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }}
                        />
                      )}
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {userContext.productPhoto.name || 'Product photo'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <label style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Replace
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && handleFileUpload) handleFileUpload(file, 'productPhoto');
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => updateUserContext('productPhoto', null)}
                        aria-label="Remove product photo"
                        style={{ padding: '3px 6px', background: 'none', border: 'none', color: 'var(--error)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 11px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px dashed var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                  }}>
                    <Upload size={12} aria-hidden="true" />
                    <span>Upload product photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && handleFileUpload) handleFileUpload(file, 'productPhoto');
                      }}
                    />
                  </label>
                )}
              </div>
            )}

            {/* Logo Image (separate capability from Product Photo) */}
            {(() => {
              const logo = videoLogoOf(userContext);
              const profileLogo = profileLogoOf(userContext);
              const profileUnusable = userContext.videoLogo === undefined && !logo && Boolean(profileLogo);
              const canRestoreProfile = userContext.videoLogo === null && Boolean(toImageFile(profileLogo));
              const pickLogo = (e) => {
                const file = e.target.files?.[0];
                if (file && handleFileUpload) handleFileUpload(file, 'videoLogo');
              };
              return (
                <div data-testid="director-settings-logo-asset" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Building2 size={12} aria-hidden="true" />
                    <span>Logo Image</span>
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>· +5s outro</span>
                  </span>

                  {logo ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      backgroundColor: 'var(--bg-elevated)',
                      borderRadius: 8,
                      border: '1px solid var(--border-subtle)',
                      gap: 8,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <img
                          src={`data:${logo.mime};base64,${logo.data}`}
                          alt="Logo"
                          style={{ width: 28, height: 28, borderRadius: 5, objectFit: 'contain', backgroundColor: 'var(--bg-surface)', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {logo.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <label style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          Replace
                          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: 'none' }} onChange={pickLogo} />
                        </label>
                        <button
                          type="button"
                          onClick={() => updateUserContext('videoLogo', null)}
                          aria-label="Remove logo image"
                          style={{ padding: '3px 6px', background: 'none', border: 'none', color: 'var(--error)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '7px 11px',
                        borderRadius: 8,
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px dashed var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}>
                        <Upload size={12} aria-hidden="true" />
                        <span>Upload logo image</span>
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: 'none' }} onChange={pickLogo} />
                      </label>
                      {profileUnusable && (
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                          Profile logo unsupported — upload PNG, JPG or WebP.
                        </span>
                      )}
                      {canRestoreProfile && (
                        <button
                          type="button"
                          onClick={() => updateUserContext('videoLogo', undefined)}
                          style={{ padding: 0, background: 'none', border: 'none', color: 'var(--cc-emphasis)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Use my business profile logo
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="cc-production-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button
          type="button"
          onClick={onBack}
          className="cc-ghost-hover"
          style={{
            padding: '10px 16px',
            borderRadius: 999,
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          style={{
            padding: '12px 28px',
            borderRadius: 999,
            backgroundColor: 'var(--cc-action)',
            color: 'var(--cc-on-action)',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)'
          }}
        >
          <span>Continue</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * 6. SCREEN 04 — IDEA
 */
export function Screen04Idea({
  directionsList = [],
  selectedDirection = null,
  setSelectedDirection,
  customDirection = '',
  setCustomDirection,
  isLoadingDirections = false,
  onContinue,
  onBack,
  userContext = {},
  creativeDNA = {},
  briefData = {},
}) {
  const [showCustomIdeaInput, setShowCustomIdeaInput] = useState(Boolean(customDirection));

  const handleSelectIdea = (dir) => {
    setSelectedDirection(dir);
    setCustomDirection('');
    setShowCustomIdeaInput(false);
  };

  const activeIdea = selectedDirection || (customDirection ? { title: customDirection, description: customDirection } : directionsList[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Short Explanation */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Choose a Creative Idea</span>
          <HelpTooltip
            title={HELP_TOOLTIPS.idea_selection.title}
            body={HELP_TOOLTIPS.idea_selection.body}
            ariaLabel="Help choosing a creative direction"
          />
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          Pick a direction for your video or enter your own below.
        </p>
      </div>

      {/* Loading State */}
      {isLoadingDirections ? (
        <IdeaGenerationLoader
          businessName={userContext?.businessName}
          category={userContext?.businessCategory}
          objective={creativeDNA?.campaignObjective || briefData?.objective}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* ~3 Idea Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 12 }}>
            {directionsList.map((dir, idx) => {
              const isSelected = selectedDirection?.id === dir.id;
              const icons = [Gift, Smartphone, Truck, Lightbulb, Sparkles];
              const icon = icons[idx % icons.length];

              return (
                <div
                  key={dir.id || idx}
                  onClick={() => handleSelectIdea(dir)}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                    border: isSelected ? '2px solid var(--cc-selected-line)' : '1px solid var(--border-default)',
                    borderRadius: 10,
                    padding: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'var(--cc-hover)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{React.createElement(icon, { size: 16, 'aria-hidden': true })}</span>
                    {dir.recommended && (
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: 'rgba(244, 244, 236, 0.075)',
                        color: 'var(--cc-emphasis)',
                        letterSpacing: '0.04em'
                      }}>
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {dir.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {dir.description || dir.angle}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Discoverable Own Creative Idea Secondary Card */}
          <div style={{ marginTop: 4 }}>
            {!showCustomIdeaInput ? (
              <button
                type="button"
                onClick={() => setShowCustomIdeaInput(true)}
                data-testid="own-idea-card"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                  padding: '16px 20px',
                  borderRadius: 12,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 260px', minWidth: 0 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: 'rgba(244, 244, 236, 0.06)',
                      color: 'var(--cc-emphasis)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Lightbulb size={18} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Have your own creative idea?
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      Start with your own concept, story or creative direction. Let CleverCut help you develop it into an ad.
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--cc-emphasis)',
                    backgroundColor: 'rgba(244, 244, 236, 0.05)',
                    border: '1px solid rgba(244, 244, 236, 0.225)',
                    borderRadius: 8,
                    padding: '7px 14px',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Start with my idea &rarr;</span>
                </span>
              </button>
            ) : (
              <div
                data-testid="own-idea-input-panel"
                style={{
                  backgroundColor: customDirection.trim() ? 'rgba(244, 244, 236, 0.04)' : 'var(--bg-surface)',
                  border: customDirection.trim() ? '1.5px solid var(--cc-selected-line)' : '1px solid var(--border-default)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Lightbulb size={16} style={{ color: 'var(--cc-emphasis)' }} />
                    <label
                      htmlFor="own-creative-idea-input"
                      style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      Start with your own creative idea
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomIdeaInput(false);
                      setCustomDirection('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '2px 6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <X size={13} />
                    <span>Cancel</span>
                  </button>
                </div>
                <textarea
                  id="own-creative-idea-input"
                  rows={2}
                  value={customDirection}
                  onChange={(e) => {
                    setCustomDirection(e.target.value);
                    if (selectedDirection) setSelectedDirection(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && customDirection.trim()) {
                      e.preventDefault();
                      onContinue();
                    }
                  }}
                  placeholder="e.g. Show corporate managers scrambling for Diwali gifts until finding same-day hampers"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-default)',
                    fontSize: 13,
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.5,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="cc-production-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button
          type="button"
          onClick={onBack}
          className="cc-ghost-hover"
          style={{
            padding: '10px 16px',
            borderRadius: 999,
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          disabled={isLoadingDirections || (!selectedDirection && !customDirection?.trim())}
          onClick={onContinue}
          style={{
            padding: '12px 28px',
            borderRadius: 999,
            backgroundColor: 'var(--cc-action)',
            color: 'var(--cc-on-action)',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: isLoadingDirections ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)'
          }}
        >
          <span>Continue</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * 7. SCREEN 05 — OPENING
 */
export function Screen05Opening({
  hooksList = [],
  selectedHook = null,
  setSelectedHook,
  customHook = '',
  setCustomHook,
  isLoadingHooks = false,
  onContinue,
  onBack,
  userContext = {},
  selectedDirection = null,
}) {
  const [editingHookId, setEditingHookId] = useState(null);
  const [editLineText, setEditLineText] = useState('');
  const [showCustomHook, setShowCustomHook] = useState(Boolean(customHook));

  const handleSelectHook = (hk) => {
    setSelectedHook(hk);
    setCustomHook('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Short Explanation */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Choose an Opening
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          Pick the first 3 seconds for your video.
        </p>
      </div>

      {/* Loading State */}
      {isLoadingHooks ? (
        <HookGenerationLoader
          businessName={userContext?.businessName}
          ideaTitle={selectedDirection?.title}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 5-6 Visual Opening Options */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 10 }}>
            {hooksList.map((hk, idx) => {
              const isSelected = selectedHook?.id === hk.id;
              const isEditing = editingHookId === hk.id;
              const icons = [Smartphone, Gift, Eye, MessageCircle, Zap, Eye];
              const icon = icons[idx % icons.length];

              return (
                <div
                  key={hk.id || idx}
                  onClick={() => !isEditing && handleSelectHook(hk)}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                    border: isSelected ? '2px solid var(--cc-selected-line)' : '1px solid var(--border-default)',
                    borderRadius: 10,
                    padding: 14,
                    cursor: isEditing ? 'default' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ display: 'inline-flex', color: 'var(--text-tertiary)' }}>{React.createElement(icon, { size: 14, 'aria-hidden': true })}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--cc-emphasis)' }}>
                        {hk.archetype || hk.type || 'Opening'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {hk.recommended && (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '1px 5px', borderRadius: 4, backgroundColor: 'rgba(244, 244, 236, 0.075)', color: 'var(--cc-emphasis)' }}>
                          TOP PICK
                        </span>
                      )}
                      <button className="tap-target"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditing) {
                            const trimmed = editLineText.trim();
                            if (trimmed) {
                              hk.hookLine = trimmed;
                              if (selectedHook?.id === hk.id) {
                                setSelectedHook({ ...hk, hookLine: trimmed });
                              }
                            }
                            setEditingHookId(null);
                          } else {
                            setEditLineText(hk.hookLine || hk.text || '');
                            setEditingHookId(hk.id);
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--cc-emphasis)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        {isEditing ? 'Save' : '[Edit]'}
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <input
                      type="text"
                      value={editLineText}
                      onChange={(e) => setEditLineText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const trimmed = editLineText.trim();
                          if (trimmed) {
                            hk.hookLine = trimmed;
                            if (selectedHook?.id === hk.id) {
                              setSelectedHook({ ...hk, hookLine: trimmed });
                            }
                          }
                          setEditingHookId(null);
                        }
                      }}
                      style={{ padding: '6px 8px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                      "{hk.hookLine || hk.text}"
                    </div>
                  )}

                  {hk.visualAction && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {hk.visualAction}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Write my own opening */}
          <div>
            {!showCustomHook ? (
              <button
                type="button"
                onClick={() => setShowCustomHook(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--cc-emphasis)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>+ Write my own opening</span>
              </button>
            ) : (
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}>
                  Your opening line or action
                </label>
                <input
                  type="text"
                  value={customHook}
                  onChange={(e) => {
                    setCustomHook(e.target.value);
                    if (selectedHook) setSelectedHook(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customHook.trim()) {
                      e.preventDefault();
                      onContinue();
                    }
                  }}
                  placeholder="e.g. Wait, did you forget to order festive gift boxes again?!"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-default)',
                    fontSize: 12,
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="cc-production-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button
          type="button"
          onClick={onBack}
          className="cc-ghost-hover"
          style={{
            padding: '10px 16px',
            borderRadius: 999,
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          disabled={isLoadingHooks || (!selectedHook && !customHook?.trim())}
          onClick={onContinue}
          style={{
            padding: '12px 28px',
            borderRadius: 999,
            backgroundColor: 'var(--cc-action)',
            color: 'var(--cc-on-action)',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: isLoadingHooks ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)'
          }}
        >
          <span>Continue to Script</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * 8. SCREEN 06 — STORY
 */
export function Screen06Story({
  storyWorldData = null,
  setStoryWorldData,
  userContext = {},
  updateUserContext,
  handleFileUpload,
  isLoadingStory = false,
  constraintsList = [],
  setConstraintsList,
  avoidList = [],
  setAvoidList,
  onAddConstraint,
  onRemoveConstraint,
  onAddAvoid,
  onRemoveAvoid,
  onUpdateCharacters,
  onUpdateSetting,
  onUpdateProduct,
  onContinue,
  onBack,
  isBusy = false,
  elapsedTime = '00:00',
}) {
  const currentConstraints = Array.isArray(constraintsList) ? constraintsList : [];
  const currentAvoid = Array.isArray(avoidList) ? avoidList : [];

  const [editingCard, setEditingCard] = useState(null);
  const [editLeadName, setEditLeadName] = useState('');
  const [editLeadRole, setEditLeadRole] = useState('');
  const [editSuppName, setEditSuppName] = useState('');
  const [editSuppRole, setEditSuppRole] = useState('');
  const [editSettingName, setEditSettingName] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [isCustomizeExpanded, setIsCustomizeExpanded] = useState(() => (currentConstraints.length > 0 || currentAvoid.length > 0));
  const [newConstraint, setNewConstraint] = useState('');
  const [newAvoid, setNewAvoid] = useState('');

  const handleAddConstraint = (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    const next = [...currentConstraints, trimmed];
    if (typeof setConstraintsList === 'function') setConstraintsList(next);
    if (typeof onAddConstraint === 'function') onAddConstraint(trimmed);
    setNewConstraint('');
  };

  const handleRemoveConstraint = (idx) => {
    const next = currentConstraints.filter((_, i) => i !== idx);
    if (typeof setConstraintsList === 'function') setConstraintsList(next);
    if (typeof onRemoveConstraint === 'function') onRemoveConstraint(idx);
  };

  const handleAddAvoid = (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;
    const next = [...currentAvoid, trimmed];
    if (typeof setAvoidList === 'function') setAvoidList(next);
    if (typeof onAddAvoid === 'function') onAddAvoid(trimmed);
    setNewAvoid('');
  };

  const handleRemoveAvoid = (idx) => {
    const next = currentAvoid.filter((_, i) => i !== idx);
    if (typeof setAvoidList === 'function') setAvoidList(next);
    if (typeof onRemoveAvoid === 'function') onRemoveAvoid(idx);
  };

  const startEditLead = () => {
    const char = storyWorldData?.character1 || userContext.leadCharacter;
    let name = 'Lead';
    let role = 'Host';
    if (char && typeof char === 'object') {
      name = char.name || 'Lead';
      role = char.role || 'Host';
    } else if (typeof char === 'string') {
      const match = char.match(/^(.*?)(?:\s*\((.*?)\))?$/);
      if (match) {
        name = match[1]?.trim() || char;
        role = match[2]?.trim() || 'Host';
      }
    }
    setEditLeadName(name);
    setEditLeadRole(role);
    setEditingCard('lead');
  };

  const handleSaveLead = () => {
    const name = editLeadName.trim() || 'Lead';
    const role = editLeadRole.trim() || 'Host';
    const char1 = { name, role };
    if (typeof setStoryWorldData === 'function') {
      const next = { ...(storyWorldData || {}), character1: char1 };
      setStoryWorldData(next);
    }
    if (typeof updateUserContext === 'function') {
      updateUserContext('leadCharacter', `${name} (${role})`);
    }
    if (typeof onUpdateCharacters === 'function') {
      onUpdateCharacters(char1, storyWorldData?.character2);
    }
    setEditingCard(null);
  };

  const startEditSupp = () => {
    const char = storyWorldData?.character2 || userContext.supportingCharacter;
    let name = 'Supporting';
    let role = 'Partner';
    if (char && typeof char === 'object') {
      name = char.name || 'Supporting';
      role = char.role || 'Partner';
    } else if (typeof char === 'string') {
      const match = char.match(/^(.*?)(?:\s*\((.*?)\))?$/);
      if (match) {
        name = match[1]?.trim() || char;
        role = match[2]?.trim() || 'Partner';
      }
    }
    setEditSuppName(name);
    setEditSuppRole(role);
    setEditingCard('supp');
  };

  const handleSaveSupp = () => {
    const name = editSuppName.trim() || 'Supporting';
    const role = editSuppRole.trim() || 'Partner';
    const char2 = { name, role };
    if (typeof setStoryWorldData === 'function') {
      const next = { ...(storyWorldData || {}), character2: char2 };
      setStoryWorldData(next);
    }
    if (typeof updateUserContext === 'function') {
      updateUserContext('supportingCharacter', `${name} (${role})`);
    }
    if (typeof onUpdateCharacters === 'function') {
      onUpdateCharacters(storyWorldData?.character1, char2);
    }
    setEditingCard(null);
  };

  const startEditPlace = () => {
    const place = storyWorldData?.location?.name || storyWorldData?.setting || `${userContext.businessName || 'Store'} Setting`;
    setEditSettingName(place);
    setEditingCard('place');
  };

  const handleSavePlace = () => {
    const place = editSettingName.trim() || `${userContext.businessName || 'Store'} Setting`;
    if (typeof setStoryWorldData === 'function') {
      const next = {
        ...(storyWorldData || {}),
        setting: place,
        location: { ...(storyWorldData?.location || {}), name: place }
      };
      setStoryWorldData(next);
    }
    if (typeof updateUserContext === 'function') {
      updateUserContext('setting', place);
    }
    if (typeof onUpdateSetting === 'function') {
      onUpdateSetting(place);
    }
    setEditingCard(null);
  };

  const startEditProduct = () => {
    const prod = storyWorldData?.product || userContext.specialty || userContext.brief?.slice(0, 30) || 'Featured Product';
    setEditProductName(prod);
    setEditingCard('prod');
  };

  const handleSaveProduct = () => {
    const prod = editProductName.trim() || userContext.specialty || userContext.brief?.slice(0, 30) || 'Featured Product';
    if (typeof setStoryWorldData === 'function') {
      const next = { ...(storyWorldData || {}), product: prod };
      setStoryWorldData(next);
    }
    if (typeof updateUserContext === 'function') {
      updateUserContext('specialty', prod);
    }
    if (typeof onUpdateProduct === 'function') {
      onUpdateProduct(prod);
    }
    setEditingCard(null);
  };

  const handleProceed = () => {
    if (newConstraint.trim()) {
      handleAddConstraint(newConstraint.trim());
    }
    if (newAvoid.trim()) {
      handleAddAvoid(newAvoid.trim());
    }
    if (onContinue) onContinue();
  };

  const parseElapsedSeconds = (str) => {
    if (!str || typeof str !== 'string') return 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const elapsedSec = parseElapsedSeconds(elapsedTime);
  // Dynamically map active step according to real elapsed time:
  // Step 0: 0-7s (Structuring narrative arc)
  // Step 1: 8-16s (Writing spoken dialogue)
  // Step 2: 17-26s (Directing camera setups & scene blocking)
  // Step 3: 27s+ (Validating Section 8 Quality Gate)
  const activeStepIdx = elapsedSec < 8 ? 0 : elapsedSec < 17 ? 1 : elapsedSec < 27 ? 2 : 3;

  const [tipIdx, setTipIdx] = useState(0);

  const synthesisSteps = [
    { label: 'Structuring 4-scene narrative arc', desc: 'Hook → Build → Turn → Resolution beat flow' },
    { label: 'Writing spoken dialogue', desc: `Authentic conversational ${userContext.language || 'English'} without ad-speak` },
    { label: 'Directing camera setups & scene blocking', desc: 'Calibrating shot sizes, angles & actor continuity' },
    { label: 'Validating Section 8 Quality Gate', desc: 'Verifying hook retention, pace, and commercial broadcast standards' },
  ];

  const filmmakingTips = [
    'The first 3 seconds decide whether someone stops scrolling or keeps swiping.',
    'A clear emotional dilemma in Scene 2 makes the brand payoff in Scene 4 feel truly earned.',
    'Conversational colloquial lines convert 3x better than generic promotional claims.',
    'Varying camera angles across cuts keeps viewers visually engaged until the final CTA.',
    'Authentic local context creates instant familiarity and trust with your audience.'
  ];

  useEffect(() => {
    if (!isBusy) return;
    const tipTimer = setInterval(() => {
      setTipIdx((prev) => (prev + 1) % filmmakingTips.length);
    }, 5000);
    return () => clearInterval(tipTimer);
  }, [isBusy]);

  const beats = storyWorldData?.beats || [];
  const beatStages = [
    { key: 'START', label: 'START', color: 'var(--cc-text-2)' },
    { key: 'SHOW', label: 'SHOW', color: 'var(--cc-emphasis)' },
    { key: 'MOMENT', label: 'MOMENT', color: 'var(--cc-text-2)' },
    { key: 'END', label: 'END', color: 'var(--cc-success)' },
  ];

  const dur = parseInt(userContext.targetDuration, 10) || 20;

  if (isBusy) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 16,
        padding: '36px 28px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        maxWidth: 580,
        margin: '20px auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
      }}>
        {/* Animated Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--cc-selected-line)',
          boxShadow: '0 0 20px var(--accent-glow)'
        }}>
          <Sparkles size={30} className="icon-spinner" style={{ color: 'var(--cc-emphasis)' }} />
        </div>

        {/* Title & Subtitle */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Writing and polishing your script…
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            Directing 4 broadcast-ready scenes with spoken dialogue and camera setups for {userContext.businessName || 'your brand'}.
          </p>
        </div>

        {/* Stopwatch badge */}
        <div style={{
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'var(--cc-emphasis)',
          backgroundColor: 'var(--bg-elevated)',
          padding: '5px 14px',
          borderRadius: 20,
          border: '1px solid var(--border-subtle)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--cc-action)' }} />
          Elapsed: {elapsedTime || '00:00'}
        </div>

        {/* Dynamic Pipeline Steps */}
        <div style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          textAlign: 'left'
        }}>
          {synthesisSteps.map((s, idx) => {
            const isDone = activeStepIdx > idx;
            const isCurrent = activeStepIdx === idx;
            return (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                opacity: isDone ? 0.7 : isCurrent ? 1 : 0.4,
                transition: 'opacity 0.3s ease'
              }}>
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDone ? 'rgba(95, 212, 174, 0.15)' : isCurrent ? 'var(--bg-active)' : 'transparent',
                  border: isDone ? '1px solid var(--cc-success)' : isCurrent ? '1px solid var(--cc-selected-line)' : '1px solid var(--border-default)',
                  flexShrink: 0
                }}>
                  {isDone ? (
                    <CheckCircle2 size={13} style={{ color: 'var(--cc-success)' }} />
                  ) : isCurrent ? (
                    <RefreshCw size={11} className="icon-spinner" style={{ color: 'var(--cc-emphasis)' }} />
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>{idx + 1}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: isCurrent ? 600 : 600, color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Creative Filmmaking Tip */}
        <div style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'rgba(244, 244, 236, 0.03)',
          border: '1px solid rgba(244, 244, 236, 0.18)',
          borderRadius: 10,
          padding: '12px 14px',
          textAlign: 'left',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start'
        }}>
          <Lightbulb size={16} style={{ color: 'var(--cc-text-2)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, color: 'var(--cc-text-2)' }}>Filmmaking Tip: </span>
            {filmmakingTips[tipIdx]}
          </div>
        </div>

        {/* Dynamic Reassurance footer */}
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
          {elapsedSec < 28
            ? 'Directing broadcast scenes & running Section 8 quality checks (~25–35s)'
            : elapsedSec < 55
            ? 'Polishing scene blocking & conversational dialogue… almost ready!'
            : 'Finalizing broadcast quality gate verification… wrapping up!'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Short Explanation */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Here's your story: World & Narrative Arc
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          Define your continuous physical setting, characters, and 4-beat narrative flow before writing scene dialogue.
        </p>
      </div>

      {isLoadingStory ? (
        <StoryGenerationLoader
          businessName={userContext?.businessName}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Visual Four-Part Flow: START → SHOW → MOMENT → END */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={13} style={{ color: 'var(--cc-emphasis)' }} />
                <span>1. Narrative Progression (4 Beats)</span>
              </div>
              <span style={{ fontSize: 12, textTransform: 'none', color: 'var(--cc-emphasis)', fontWeight: 600 }}>
                {userContext.targetDuration || '20s'} Film
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {beatStages.map((st, idx) => {
                const b = beats[idx] || {};
                const timingLabel = b.timing || (
                  dur <= 15 ? ['0-2s', '2-6s', '6-11s', '11-15s'][idx] :
                  dur <= 20 ? ['0-3s', '3-8s', '8-14s', '14-20s'][idx] :
                  dur <= 30 ? ['0-4s', '4-12s', '12-22s', '22-30s'][idx] :
                  ['0-6s', '6-25s', '25-45s', '45-60s'][idx]
                ) || `Scene ${idx + 1}`;

                return (
                  <div
                    key={st.key}
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: 'var(--bg-surface)',
                        color: st.color,
                        fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        {st.label} ({timingLabel})
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>
                        0{idx + 1}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {b.title || `Part ${idx + 1}`}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      {b.action || 'Visual action unfolding here.'}
                    </div>

                    {b.dialogue && (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: 2, paddingTop: 4, borderTop: '1px dashed var(--border-subtle)' }}>
                        "{b.dialogue}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact Story World Anchors */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={13} style={{ color: 'var(--cc-emphasis)' }} />
                <span>2. People & Setting (Continuity Anchors)</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'none', fontWeight: 500 }}>
                Kept consistent across all scenes
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {/* Lead */}
              <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}><User size={12} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />Main person</span>
                  <button className="tap-target"
                    type="button"
                    onClick={() => {
                      if (editingCard === 'lead') {
                        handleSaveLead();
                      } else {
                        startEditLead();
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--cc-emphasis)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    {editingCard === 'lead' ? 'Save' : '[Edit]'}
                  </button>
                </div>
                {editingCard === 'lead' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                      type="text"
                      value={editLeadName}
                      onChange={(e) => setEditLeadName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveLead(); } }}
                      placeholder="Name"
                      style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                    <input
                      type="text"
                      value={editLeadRole}
                      onChange={(e) => setEditLeadRole(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveLead(); } }}
                      placeholder="Role"
                      style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {storyWorldData?.character1?.name ? `${storyWorldData.character1.name} · ${storyWorldData.character1.role || 'Host'}` : (typeof userContext.leadCharacter === 'string' && userContext.leadCharacter.trim() ? userContext.leadCharacter : 'Creator')}
                  </div>
                )}
              </div>

              {/* Supporting */}
              <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}><Users size={12} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />Other person</span>
                  <button className="tap-target"
                    type="button"
                    onClick={() => {
                      if (editingCard === 'supp') {
                        handleSaveSupp();
                      } else {
                        startEditSupp();
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--cc-emphasis)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    {editingCard === 'supp' ? 'Save' : '[Edit]'}
                  </button>
                </div>
                {editingCard === 'supp' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                      type="text"
                      value={editSuppName}
                      onChange={(e) => setEditSuppName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveSupp(); } }}
                      placeholder="Name"
                      style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                    <input
                      type="text"
                      value={editSuppRole}
                      onChange={(e) => setEditSuppRole(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveSupp(); } }}
                      placeholder="Role"
                      style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {storyWorldData?.character2?.name ? `${storyWorldData.character2.name} · ${storyWorldData.character2.role || 'Partner'}` : (typeof userContext.supportingCharacter === 'string' && userContext.supportingCharacter.trim() ? userContext.supportingCharacter : 'Partner')}
                  </div>
                )}
              </div>

              {/* Setting */}
              <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}><House size={12} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />Place</span>
                  <button className="tap-target"
                    type="button"
                    onClick={() => {
                      if (editingCard === 'place') {
                        handleSavePlace();
                      } else {
                        startEditPlace();
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--cc-emphasis)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    {editingCard === 'place' ? 'Save' : '[Edit]'}
                  </button>
                </div>
                {editingCard === 'place' ? (
                  <input
                    type="text"
                    value={editSettingName}
                    onChange={(e) => setEditSettingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSavePlace(); } }}
                    placeholder="Place / Location"
                    style={{ width: '100%', padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {storyWorldData?.location?.name || storyWorldData?.setting?.slice(0, 30) || `${userContext.businessName || 'Store'} Setting`}
                  </div>
                )}
              </div>

              {/* Product / Service Offering */}
              {(() => {
                const bType = String(userContext.businessType || '').toLowerCase();
                const isService = bType.includes('gym') || bType.includes('fitness') || bType.includes('salon') || bType.includes('beauty') || bType.includes('spa') || bType.includes('clinic') || bType.includes('dental') || bType.includes('health') || bType.includes('coaching') || bType.includes('tuition') || bType.includes('consult') || bType.includes('service') || bType.includes('agency') || bType.includes('interior') || bType.includes('repair');

                return (
                  <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}>
                          {isService ? 'Service Offering' : 'Featured Product'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingCard === 'prod') {
                            handleSaveProduct();
                          } else {
                            startEditProduct();
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--cc-emphasis)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        {editingCard === 'prod' ? 'Save' : '[Edit Text]'}
                      </button>
                    </div>
                    {editingCard === 'prod' ? (
                      <input
                        type="text"
                        value={editProductName}
                        onChange={(e) => setEditProductName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveProduct(); } }}
                        placeholder={isService ? "e.g. Group Fitness & Personal Training" : "Featured Product"}
                        style={{ width: '100%', padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    ) : (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {storyWorldData?.product || userContext.specialty || userContext.brief?.slice(0, 30) || (isService ? `${userContext.businessName || 'Business'} Service` : `${userContext.businessName || 'Store'} items`)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {isService ? 'Service experience showcased' : 'Product highlighted in scenes'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Hidden/Collapsible Customize */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setIsCustomizeExpanded(!isCustomizeExpanded)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'none',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={13} style={{ color: 'var(--cc-emphasis)' }} />
                <span>3. Story Constraints & Avoid Rules (Optional)</span>
                {(currentConstraints.length > 0 || currentAvoid.length > 0) && (
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 10,
                    backgroundColor: 'rgba(244, 244, 236, 0.075)',
                    color: 'var(--cc-emphasis)'
                  }}>
                    {currentConstraints.length + currentAvoid.length} active
                  </span>
                )}
              </div>
              {isCustomizeExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isCustomizeExpanded && (
              <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Things to include */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Things to include
                  </div>
                  {currentConstraints.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {currentConstraints.map((c, i) => (
                        <span key={i} style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, backgroundColor: 'rgba(244, 244, 236, 0.06)', color: 'var(--cc-emphasis)', border: '1px solid rgba(244, 244, 236, 0.225)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>{c}</span>
                          <X size={11} style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => handleRemoveConstraint(i)} />
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={newConstraint}
                      onChange={(e) => setNewConstraint(e.target.value)}
                      placeholder="e.g. mention WhatsApp order number"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid var(--border-default)',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddConstraint(newConstraint);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddConstraint(newConstraint)}
                      style={{
                        padding: '8px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 6,
                        border: '1px solid var(--border-default)',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Things to avoid */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Things to avoid
                  </div>
                  {currentAvoid.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {currentAvoid.map((a, i) => (
                        <span key={i} style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, backgroundColor: 'rgba(255, 122, 107, 0.1)', color: 'var(--cc-danger)', border: '1px solid rgba(255, 122, 107, 0.25)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>{a}</span>
                          <X size={11} style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => handleRemoveAvoid(i)} />
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={newAvoid}
                      onChange={(e) => setNewAvoid(e.target.value)}
                      placeholder="e.g. no loud shouting, no dance steps"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: '1px solid var(--border-default)',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAvoid(newAvoid);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddAvoid(newAvoid)}
                      style={{
                        padding: '8px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 6,
                        border: '1px solid var(--border-default)',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="cc-production-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button
          type="button"
          onClick={onBack}
          className="cc-ghost-hover"
          style={{
            padding: '10px 16px',
            borderRadius: 999,
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          disabled={isBusy || isLoadingStory}
          onClick={handleProceed}
          style={{
            padding: '12px 28px',
            borderRadius: 999,
            backgroundColor: 'var(--cc-action)',
            color: 'var(--cc-on-action)',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: isBusy || isLoadingStory ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)'
          }}
        >
          {isBusy && <RefreshCw size={14} className="icon-spinner" />}
          <span>{isBusy ? 'Writing and polishing your script…' : 'Lock Story & Write Script →'}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * 9. SCREEN 07 — SCRIPT
 */
export function Screen07Script({
  scenes = [],
  setScenes,
  setting = '',
  setSetting,
  character1 = '',
  character2 = '',
  onUpdateCharacters,
  onUpdateSetting,
  userContext = {},
  onApproveScript,
  onBack,
  onTryAnotherVersion,
  onOpenRewriteModal,
  isBusy = false,
  elapsedTime = '00:00',
  onSaveProject,
  isProjectSaved = false,
  isSavingProject = false,
  onOpenScriptModal,
  guardrailReport = null,
  onboardingState = null,
  onDismissTip,
  onBehaviorEvent,
  draftStatus = null,
  scriptSaveError = '',
  onRetrySave = null,
  onMarkUnsaved = null,
}) {
  const [editingSceneIdx, setEditingSceneIdx] = useState(null);
  const [editSceneText, setEditSceneText] = useState('');
  const [sceneDrafts, setSceneDrafts] = useState({});
  const [dirtyScenes, setDirtyScenes] = useState({});
  const [collapsedScenes, setCollapsedScenes] = useState({});
  const [activeSceneNavIdx, setActiveSceneNavIdx] = useState(0);
  const [localModified, setLocalModified] = useState(false);
  const [localSaveError, setLocalSaveError] = useState('');
  const sceneRefs = useRef({});

  // Sync active editor changes cleanly without losing keystrokes
  const commitSceneEdit = (targetIdx, nextText, closeEditor = false) => {
    if (targetIdx === null || targetIdx === undefined) return;
    if (scenes[targetIdx] !== undefined && scenes[targetIdx] !== nextText) {
      if (setScenes) {
        const updated = [...scenes];
        updated[targetIdx] = nextText;
        setScenes(updated);
      }
      setDirtyScenes((prev) => ({ ...prev, [targetIdx]: true }));
      setLocalModified(true);
      setLocalSaveError('');
      if (onMarkUnsaved) onMarkUnsaved();
    }
    setSceneDrafts((prev) => ({ ...prev, [targetIdx]: nextText }));
    if (closeEditor) {
      setEditingSceneIdx(null);
      if (onBehaviorEvent) onBehaviorEvent('editedScriptCount');
    }
  };

  // Apply a scene edit shortly after typing pauses (Save commits & closes the editor), so the draft
  // autosave keeps a long edit even if the tab closes or the user navigates to another scene
  useEffect(() => {
    if (editingSceneIdx === null || !setScenes) return;
    const timer = setTimeout(() => {
      if (scenes[editingSceneIdx] !== undefined && scenes[editingSceneIdx] !== editSceneText) {
        const updated = [...scenes];
        updated[editingSceneIdx] = editSceneText;
        setScenes(updated);
        setDirtyScenes((prev) => ({ ...prev, [editingSceneIdx]: true }));
        setLocalModified(true);
        setLocalSaveError('');
        if (onMarkUnsaved) onMarkUnsaved();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [editSceneText, editingSceneIdx]);

  useEffect(() => {
    if ((isProjectSaved || draftStatus?.state === 'saved') && !scriptSaveError && editingSceneIdx === null) {
      setLocalModified(false);
      setDirtyScenes({});
      setLocalSaveError('');
    } else if (draftStatus?.state === 'error' || scriptSaveError) {
      setLocalSaveError(scriptSaveError || 'Autosave could not reach the server. Retry saving to keep your edits.');
    }
  }, [draftStatus?.state, isProjectSaved, scriptSaveError]);
  const [isCopiedFull, setIsCopiedFull] = useState(false);
  const [isEditingContinuity, setIsEditingContinuity] = useState(false);
  const [editSettingVal, setEditSettingVal] = useState(setting || '');
  const [editChar1Val, setEditChar1Val] = useState(character1 || '');
  const [editChar2Val, setEditChar2Val] = useState(character2 || '');

  useEffect(() => {
    setEditSettingVal(setting || '');
  }, [setting]);

  useEffect(() => {
    setEditChar1Val(character1 || '');
    setEditChar2Val(character2 || '');
  }, [character1, character2]);

  const handleSaveContinuity = () => {
    if (onUpdateSetting && editSettingVal) onUpdateSetting(editSettingVal);
    if (onUpdateCharacters && (editChar1Val || editChar2Val)) {
      onUpdateCharacters(editChar1Val, editChar2Val);
    }
    setLocalModified(true);
    if (onMarkUnsaved) onMarkUnsaved();
    setIsEditingContinuity(false);
  };

  const handleOpenSceneEditor = (targetIdx, fallbackText) => {
    if (editingSceneIdx !== null && editingSceneIdx !== targetIdx) {
      commitSceneEdit(editingSceneIdx, editSceneText, false);
    }
    setCollapsedScenes((prev) => ({ ...prev, [targetIdx]: false }));
    setEditSceneText(sceneDrafts[targetIdx] ?? fallbackText);
    setEditingSceneIdx(targetIdx);
    setActiveSceneNavIdx(targetIdx);
  };

  const handleJumpToScene = (idx) => {
    setCollapsedScenes((prev) => ({ ...prev, [idx]: false }));
    setActiveSceneNavIdx(idx);
    const el = sceneRefs.current[idx];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (el && typeof el.focus === 'function') {
      try { el.focus({ preventScroll: true }); } catch {}
    }
  };

  const allCollapsed = scenes.length > 0 && scenes.every((_, idx) => Boolean(collapsedScenes[idx]));
  const toggleAllScenes = () => {
    const nextVal = !allCollapsed;
    const nextMap = {};
    scenes.forEach((_, idx) => { nextMap[idx] = nextVal; });
    setCollapsedScenes(nextMap);
  };

  const handleExplicitSave = async () => {
    if (editingSceneIdx !== null) {
      commitSceneEdit(editingSceneIdx, editSceneText, true);
    }
    setLocalSaveError('');
    if (typeof onRetrySave === 'function' && (localSaveError || scriptSaveError || draftStatus?.state === 'error')) {
      await onRetrySave();
      return;
    }
    if (!onSaveProject) return;
    await onSaveProject();
  };

  const hasPendingTyping = Boolean(
    editingSceneIdx !== null &&
    scenes[editingSceneIdx] !== undefined &&
    scenes[editingSceneIdx] !== editSceneText
  );
  const isScriptSaving = Boolean(isSavingProject || draftStatus?.state === 'saving');
  const resolvedSaveError = localSaveError || scriptSaveError || (draftStatus?.state === 'error' ? 'Save failed — check connection and retry.' : '');
  const hasUnsavedChanges = Boolean(localModified || hasPendingTyping || (!isProjectSaved && Object.keys(dirtyScenes).length > 0));

  const cleanStyle = (userContext.creativeStyle || 'UGC').includes('UGC') ? 'UGC' : (userContext.creativeStyle || '').includes('Demo') ? 'Product Demo' : (userContext.creativeStyle || '').includes('Comedy') ? 'Funny' : 'Story';
  const duration = userContext.targetDuration || userContext.duration || '30s';
  const dimension = userContext.aspectRatio || userContext.dimension || (userContext.platform && userContext.platform.includes('16:9') ? '16:9' : userContext.platform && userContext.platform.includes('1:1') ? '1:1' : '9:16');
  const dimensionLabel = dimension === '16:9' ? '16:9 Landscape' : dimension === '1:1' ? '1:1 Square' : '9:16 Vertical';
  const lang = userContext.language || 'English';

  const handleCopyEntireScript = async () => {
    if (!scenes || !scenes.length) return;
    const fullText = `COMMERCIAL SCRIPT: ${userContext.businessName || 'Business'}\nSTYLE: ${cleanStyle} | DURATION: ${duration} | DIMENSION: ${dimensionLabel} | LANGUAGE: ${lang}\n\n` +
      (setting ? `SETTING:\n${setting}\n\n` : '') +
      (character1 ? `CHARACTERS:\n${character1}\n${character2 || ''}\n\n` : '') +
      scenes.map((s, idx) => `=== SCENE ${idx + 1} ===\n${s}`).join('\n\n');

    try {
      await navigator.clipboard.writeText(fullText);
      setIsCopiedFull(true);
      setTimeout(() => setIsCopiedFull(false), 2500);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  if (!scenes || scenes.length === 0) {
    if (isBusy) {
      return (
        <ScriptGenerationLoader
          businessName={userContext?.businessName}
          elapsedTime={elapsedTime}
        />
      );
    }
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: '40px 24px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 12, textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, margin: '0 auto 16px', borderRadius: '50%', backgroundColor: 'rgba(255, 122, 107, 0.1)', color: 'var(--error, var(--cc-danger))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RotateCcw size={20} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          No Script Scenes Generated Yet
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
          The script generation encountered an issue or has not completed. You can try generating again or return to the opening hook.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                backgroundColor: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to Hook
            </button>
          )}
          {onTryAnotherVersion && (
            <button
              type="button"
              onClick={onTryAnotherVersion}
              style={{
                padding: '9px 20px',
                borderRadius: 999,
                backgroundColor: 'var(--cc-action)',
                border: 'none',
                color: 'var(--cc-on-action)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RotateCcw size={14} />
              <span>Retry Script Generation</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const parseSceneData = (rawText, idx) => {
    // Stage beat / dramatic role
    const beats = ['Hook / Pattern Interrupt', 'Problem & Relatability', 'Discovery & Climax', 'Call to Action & Offer'];
    const beatRole = beats[idx] || `Scene ${idx + 1}`;

    const getSection = (text, startRegex, nextRegexes) => {
      const startMatch = text.match(startRegex);
      if (!startMatch) return '';
      const startIdx = startMatch.index + startMatch[0].length;
      const remaining = text.slice(startIdx);
      let minEnd = remaining.length;
      for (const nextRegex of nextRegexes) {
        const nextMatch = remaining.match(nextRegex);
        if (nextMatch && nextMatch.index < minEnd) {
          minEnd = nextMatch.index;
        }
      }
      return remaining.slice(0, minEnd).trim();
    };

    const visualSection = getSection(
      rawText,
      /(?:^|\n)\s*(?:Visual|Action)\s*:\s*/i,
      [/(?:^|\n)\s*(?:Animation\s+Elements|Camera|Shot)\s*:\s*/i, /(?:^|\n)\s*(?:Audio\s*\/\s*Dialogue\s*\/\s*Voiceover|Audio\s*\/\s*Dialogue|Audio|Dialogue|Voiceover)\s*:\s*/i, /(?:^|\n)\s*(?:Sound\s+Design|Sound|SFX|Music)\s*:\s*/i, /(?:^|\n)\s*Editing\s+Notes/i]
    );

    const cameraSection = getSection(
      rawText,
      /(?:^|\n)\s*(?:Animation\s+Elements|Camera|Shot)\s*:\s*/i,
      [/(?:^|\n)\s*(?:Audio\s*\/\s*Dialogue\s*\/\s*Voiceover|Audio\s*\/\s*Dialogue|Audio|Dialogue|Voiceover)\s*:\s*/i, /(?:^|\n)\s*(?:Sound\s+Design|Sound|SFX|Music)\s*:\s*/i, /(?:^|\n)\s*Editing\s+Notes/i]
    );

    const dialogueSection = getSection(
      rawText,
      /(?:^|\n)\s*(?:Audio\s*\/\s*Dialogue\s*\/\s*Voiceover|Audio\s*\/\s*Dialogue|Audio|Dialogue|Voiceover)\s*:\s*/i,
      [/(?:^|\n)\s*(?:Sound\s+Design|Sound|SFX|Music)\s*:\s*/i, /(?:^|\n)\s*Editing\s+Notes/i]
    );

    const soundSection = getSection(
      rawText,
      /(?:^|\n)\s*(?:Sound\s+Design|Sound|SFX|Music)\s*:\s*/i,
      [/(?:^|\n)\s*Editing\s+Notes/i]
    );

    const defaultChar = cleanStyle === 'UGC' ? 'CREATOR' : 'ACTOR';

    const dialogues = [];
    if (dialogueSection) {
      const lines = dialogueSection.split('\n').map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (/^(?:none|n\/a|silent|music\s+only)$/i.test(line)) continue;
        const speakerMatch = line.match(/^([A-Za-z0-9\s._'-]+?)(?:\s*\([^)]*\))?\s*:\s*(.+)$/);
        if (speakerMatch) {
          let spk = speakerMatch[1].trim();
          let txt = speakerMatch[2].trim().replace(/^["']|["']$/g, '');
          if (/^(?:Audio|Voiceover|VO|Dialogue)$/i.test(spk)) spk = defaultChar;
          if (txt) {
            dialogues.push({ speaker: spk, text: txt });
            continue;
          }
        }
        const quotedMatch = line.match(/"([^"]+)"/);
        if (quotedMatch) {
          dialogues.push({ speaker: defaultChar, text: quotedMatch[1].trim() });
          continue;
        }
        dialogues.push({ speaker: defaultChar, text: line.replace(/^["']|["']$/g, '') });
      }
    }

    if (dialogues.length === 0) {
      const diaMatch = rawText.match(/(?:Dialogue|Dialogue \([^)]+\)|says):\s*"?([^"\n]+)"?/i) || rawText.match(/"([^"]+)"/);
      if (diaMatch) {
        const charMatch = rawText.match(/(?:^|\n)([A-Z][A-Z0-9\s_]{1,16})(?:\s*\([^)]*\))?:\s*"/m);
        dialogues.push({
          speaker: charMatch ? charMatch[1].trim() : defaultChar,
          text: diaMatch[1].trim()
        });
      }
    }

    let visualText = visualSection;
    if (!visualText) {
      const visMatch = rawText.match(/(?:Visual|Action):\s*([^\n]+)/i);
      visualText = visMatch ? visMatch[1].trim() : rawText.split('\n')[0].replace(/^SCENE\s*\d+[^:]*:\s*/i, '').trim();
    }

    let cameraText = '';
    if (cameraSection) {
      const camLine = cameraSection.match(/(?:^|\n)\s*Camera\s*:\s*([^\n]+)/i);
      cameraText = camLine ? camLine[1].trim() : cameraSection.split('\n')[0].trim();
    } else {
      const camMatch = rawText.match(/(?:Camera|Shot):\s*([^\n]+)/i);
      cameraText = camMatch ? camMatch[1].trim() : null;
    }

    let audioText = soundSection;
    if (!audioText) {
      const audioMatch = rawText.match(/(?:Audio|Sound|SFX|Music):\s*([^\n]+)/i);
      audioText = audioMatch ? audioMatch[1].trim() : null;
    }

    const primaryChar = dialogues.length > 0 ? dialogues[0].speaker : defaultChar;
    const primaryDialogue = dialogues.length > 0 ? dialogues.map((d) => `${d.speaker}: "${d.text}"`).join(' ') : null;

    return {
      title: `SCENE ${idx + 1}`,
      timing: idx === 0 ? '0–3s' : idx === 1 ? '3–8s' : idx === 2 ? '8–14s' : '14–20s',
      beatRole,
      character: primaryChar,
      visual: visualText,
      dialogue: primaryDialogue,
      dialogues,
      audio: audioText,
      camera: cameraText,
      raw: rawText
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Here's your script: Broadcast & Camera Direction</span>
            <HelpTooltip
              title={HELP_TOOLTIPS.script_editing.title}
              body={HELP_TOOLTIPS.script_editing.body}
              ariaLabel="Help editing scenes"
            />
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {onOpenScriptModal && (
            <button
              type="button"
              onClick={onOpenScriptModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: 'rgba(95, 212, 174, 0.12)',
                border: '1px solid rgba(95, 212, 174, 0.35)',
                color: 'var(--cc-success)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Import or paste an existing script"
            >
              <FileCode2 size={13} />
              <span>Paste Script</span>
            </button>
          )}

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 4,
            backgroundColor: 'rgba(95, 212, 174, 0.12)',
            color: 'var(--success)',
            fontSize: 12,
            fontWeight: 600,
          }}>
            <CheckCircle2 size={12} />
            <span>Section 8 Gate: Passed</span>
          </div>

          <div style={{
            padding: '4px 12px',
            borderRadius: 20,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--cc-emphasis)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span>{duration}</span>
            <span>·</span>
            <span>{dimensionLabel}</span>
            <span>·</span>
            <span>{cleanStyle}</span>
            <span>·</span>
            <span>{lang}</span>
          </div>
        </div>
      </div>

      {/* Behavior-aware Script Editing Tip (auto-retires once user edits a scene) */}
      {shouldShowContextualTip('tip_script_customize', onboardingState) && (
        <ContextualTipBanner
          tipId={CONTEXTUAL_TIPS.tip_script_customize.id}
          title={CONTEXTUAL_TIPS.tip_script_customize.title}
          body={CONTEXTUAL_TIPS.tip_script_customize.body}
          onDismiss={onDismissTip}
        />
      )}

      {/* Continuity Context Strip (Anchored from Story World) */}
      {(setting || character1 || editSettingVal || editChar1Val) && (
        isEditingContinuity ? (
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            fontSize: 12,
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.005em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={12} style={{ color: 'var(--cc-emphasis)' }} />
              <span>Edit Cast & Setting Continuity</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 3 }}><House size={12} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />PLACE / SETTING</label>
                <input
                  type="text"
                  value={editSettingVal}
                  onChange={(e) => setEditSettingVal(e.target.value)}
                  placeholder="e.g. Modern clinic consultation room"
                  style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 3 }}><User size={12} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />LEAD CHARACTER</label>
                <input
                  type="text"
                  value={editChar1Val}
                  onChange={(e) => setEditChar1Val(e.target.value)}
                  placeholder="e.g. Dr. Ananya (Doctor)"
                  style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 3 }}><Users size={12} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />SUPPORTING CHARACTER</label>
                <input
                  type="text"
                  value={editChar2Val}
                  onChange={(e) => setEditChar2Val(e.target.value)}
                  placeholder="e.g. Patient / Customer"
                  style={{ width: '100%', padding: '6px 10px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setIsEditingContinuity(false)}
                style={{ padding: '5px 12px', borderRadius: 6, background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveContinuity}
                style={{ padding: '5px 16px', borderRadius: 999, backgroundColor: 'var(--cc-action)', color: 'var(--cc-on-action)', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
              >
                Save Continuity
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
            fontSize: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px 12px', flexWrap: 'wrap', flex: '1 1 auto', minWidth: 0 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.005em', display: 'flex', alignItems: 'center', gap: 4, flexBasis: '100%' }}>
                <Lock size={12} style={{ color: 'var(--cc-emphasis)' }} />
                <span>Story Continuity:</span>
              </span>
              {(setting || editSettingVal) && (
                <span style={{ color: 'var(--text-secondary)', display: 'block', flex: '1 1 260px', minWidth: 0, lineHeight: 1.5 }}>
                  <span><House size={13} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />Place:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{setting || editSettingVal}</strong>
                </span>
              )}
              {(character1 || editChar1Val) && (
                <span style={{ color: 'var(--text-secondary)', display: 'block', flex: '1 1 260px', minWidth: 0, lineHeight: 1.5 }}>
                  <span><Users size={13} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />Cast:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{character1 || editChar1Val}</strong>
                  {(character2 || editChar2Val) && (
                    <>
                      <span style={{ color: 'var(--text-tertiary)' }}> & </span>
                      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{character2 || editChar2Val}</strong>
                    </>
                  )}
                </span>
              )}
            </div>
            {(onUpdateSetting || onUpdateCharacters) && (
              <button className="tap-target"
                type="button"
                onClick={() => {
                  setEditSettingVal(setting);
                  setEditChar1Val(character1);
                  setEditChar2Val(character2);
                  setIsEditingContinuity(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px 6px',
                  color: 'var(--cc-emphasis)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Edit setting or cast names directly"
              >
                <Edit3 size={11} />
                <span>Edit Cast & Setting</span>
              </button>
            )}
          </div>
        )
      )}

      {/* Creative Guardrails Compliance Notice (automated text check + visual human review boundary) */}
      {guardrailReport && (guardrailReport.hasCriticalViolation || (guardrailReport.automatedChecks?.warnings?.length > 0) || (guardrailReport.visualReviewRequired?.length > 0)) && (
        <div
          style={{
            backgroundColor: guardrailReport.hasCriticalViolation ? 'rgba(255, 122, 107, 0.08)' : 'rgba(244, 244, 236, 0.035)',
            border: `1px solid ${guardrailReport.hasCriticalViolation ? 'rgba(255, 122, 107, 0.3)' : 'rgba(244, 244, 236, 0.2)'}`,
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontWeight: 600, color: guardrailReport.hasCriticalViolation ? 'var(--cc-danger)' : 'var(--text-primary)' }}>
              {guardrailReport.hasCriticalViolation
                ? 'Creative Guardrail Alert — Critical Instruction Issue'
                : 'Creative Guardrails Checked (Text Verified · Visual Review Noted)'}
            </span>
            {guardrailReport.hasCriticalViolation && onTryAnotherVersion && (
              <button
                type="button"
                onClick={onTryAnotherVersion}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255, 122, 107, 0.4)',
                  backgroundColor: 'rgba(255, 122, 107, 0.15)',
                  color: 'var(--cc-danger)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Regenerate Compliant Script
              </button>
            )}
          </div>
          {(guardrailReport.automatedChecks?.criticalViolations || []).map((v, i) => (
            <div key={`cv_${i}`} style={{ color: 'var(--cc-danger)', fontSize: 12 }}>
              • {v.explanation}
            </div>
          ))}
          {(guardrailReport.automatedChecks?.warnings || []).slice(0, 3).map((w, i) => (
            <div key={`w_${i}`} style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              • Advisory: {w.explanation}
            </div>
          ))}
          {guardrailReport.visualReviewRequired && guardrailReport.visualReviewRequired.length > 0 && (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
              Visual Review Needed: {guardrailReport.visualReviewRequired.map((r) => r.text).join('; ')} (constraints injected into video prompts; verify rendered visuals manually).
            </div>
          )}
        </div>
      )}

      {/* Scene Overview & Navigation Strip + Save Status */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <nav
            aria-label="Scene navigation"
            data-testid="scene-nav-strip"
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginRight: 4 }}>
              Scenes ({scenes.length}):
            </span>
            {scenes.map((sceneText, idx) => {
              const parsed = parseSceneData(sceneText, idx);
              const isCurrent = activeSceneNavIdx === idx;
              const isEdited = Boolean(dirtyScenes[idx] || (editingSceneIdx === idx && hasPendingTyping));
              const shortBeat = (parsed.beatRole || '').split('/')[0].trim();
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleJumpToScene(idx)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Jump to Scene ${idx + 1}: ${parsed.beatRole} (${parsed.timing})${isEdited ? ', edited' : ''}`}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: 12,
                    fontWeight: isCurrent ? 600 : 600,
                    backgroundColor: isCurrent ? 'rgba(244, 244, 236, 0.08)' : 'var(--bg-elevated)',
                    border: `1px solid ${isCurrent ? 'var(--cc-emphasis)' : 'var(--border-subtle)'}`,
                    color: isCurrent ? 'var(--cc-emphasis)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span>S{idx + 1} · {shortBeat}</span>
                  <span style={{ opacity: 0.7, fontSize: 12 }}>{parsed.timing}</span>
                  {isEdited && (
                    <span
                      title="Modified scene"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: 'var(--cc-warning)',
                        display: 'inline-block',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Accessible Script Save Status Pill */}
            <div
              role={resolvedSaveError ? 'alert' : 'status'}
              aria-live="polite"
              data-testid="script-save-status"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: resolvedSaveError
                  ? 'rgba(255, 122, 107, 0.12)'
                  : isScriptSaving
                    ? 'var(--bg-elevated)'
                    : hasUnsavedChanges
                      ? 'rgba(242, 184, 75, 0.12)'
                      : 'rgba(95, 212, 174, 0.12)',
                border: '1px solid ' + (
                  resolvedSaveError
                    ? 'rgba(255, 122, 107, 0.35)'
                    : isScriptSaving
                      ? 'var(--border-subtle)'
                      : hasUnsavedChanges
                        ? 'rgba(242, 184, 75, 0.35)'
                        : 'rgba(95, 212, 174, 0.3)'
                ),
                color: resolvedSaveError
                  ? 'var(--cc-danger)'
                  : isScriptSaving
                    ? 'var(--text-secondary)'
                    : hasUnsavedChanges
                      ? 'var(--cc-warning)'
                      : 'var(--success)',
              }}
            >
              {resolvedSaveError ? (
                <>
                  <AlertCircle size={12} aria-hidden="true" />
                  <span>Save failed</span>
                  {(onSaveProject || onRetrySave) && (
                    <button
                      type="button"
                      data-testid="script-retry-save-btn"
                      onClick={handleExplicitSave}
                      style={{
                        marginLeft: 2,
                        padding: '1px 7px',
                        borderRadius: 6,
                        border: '1px solid rgba(255, 122, 107, 0.45)',
                        backgroundColor: 'rgba(255, 122, 107, 0.16)',
                        color: '#FFA79C',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Retry save
                    </button>
                  )}
                </>
              ) : isScriptSaving ? (
                <span>Saving…</span>
              ) : hasUnsavedChanges ? (
                <>
                  <span>Unsaved changes</span>
                  {onSaveProject && (
                    <button
                      type="button"
                      onClick={handleExplicitSave}
                      style={{
                        marginLeft: 2,
                        padding: '1px 7px',
                        borderRadius: 6,
                        border: '1px solid rgba(242, 184, 75, 0.45)',
                        backgroundColor: 'rgba(242, 184, 75, 0.16)',
                        color: 'var(--cc-emphasis)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Check size={12} aria-hidden="true" />
                  <span>Saved</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={toggleAllScenes}
              style={{
                background: 'none',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '4px 9px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {allCollapsed ? 'Expand all' : 'Collapse all'}
            </button>
          </div>
        </div>
      </div>

      {/* Visual Scene Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {scenes.map((sceneText, idx) => {
          const s = parseSceneData(sceneText, idx);
          const isEditing = editingSceneIdx === idx;
          const isCollapsed = Boolean(collapsedScenes[idx]) && !isEditing;
          const isSceneDirty = Boolean(dirtyScenes[idx] || (isEditing && hasPendingTyping));
          const summaryPreview = s.dialogues?.[0]?.text
            ? `${s.dialogues[0].speaker}: "${s.dialogues[0].text}"`
            : s.visual;

          return (
            <div
              key={idx}
              id={`script-scene-${idx}`}
              ref={(el) => { sceneRefs.current[idx] = el; }}
              tabIndex={-1}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: `1px solid ${activeSceneNavIdx === idx ? 'var(--cc-emphasis)' : 'var(--border-default)'}`,
                borderRadius: 10,
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                scrollMarginTop: 84,
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0, flex: '1 1 260px' }}>
                  <button
                    type="button"
                    aria-expanded={!isCollapsed}
                    aria-controls={`script-scene-body-${idx}`}
                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} Scene ${idx + 1}: ${s.beatRole}`}
                    onClick={() => {
                      setCollapsedScenes((prev) => ({ ...prev, [idx]: !isCollapsed }));
                      setActiveSceneNavIdx(idx);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px 4px',
                      marginLeft: -4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {isCollapsed ? (
                      <ChevronRight size={15} style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                    ) : (
                      <ChevronDown size={15} style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                    )}
                    <h2 style={{ margin: 0, fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 4, backgroundColor: 'rgba(244, 244, 236, 0.07)', color: 'var(--cc-emphasis)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {s.title} · {s.timing}
                    </h2>
                  </button>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}>
                    Purpose: {s.beatRole}
                  </span>
                  {isSceneDirty && (
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: 10,
                      backgroundColor: 'rgba(242, 184, 75, 0.14)',
                      color: 'var(--cc-warning)',
                      border: '1px solid rgba(242, 184, 75, 0.3)',
                    }}>
                      Edited
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    aria-label={`Improve Scene ${idx + 1} with AI`}
                    onClick={() => {
                      if (isEditing) commitSceneEdit(idx, editSceneText, false);
                      onOpenRewriteModal(idx, sceneDrafts[idx] ?? sceneText);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--cc-emphasis)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Sparkles size={11} aria-hidden="true" />
                    <span>Improve</span>
                  </button>

                  <button
                    type="button"
                    aria-label={isEditing ? `Save Scene ${idx + 1}` : `Edit Scene ${idx + 1}`}
                    onClick={() => {
                      if (isEditing) {
                        commitSceneEdit(idx, editSceneText, true);
                      } else {
                        handleOpenSceneEditor(idx, sceneText);
                      }
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      backgroundColor: isEditing ? 'var(--cc-active)' : 'var(--bg-elevated)',
                      border: isEditing ? 'none' : '1px solid var(--border-subtle)',
                      color: isEditing ? 'var(--cc-text-1)' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Edit3 size={11} aria-hidden="true" />
                    <span>{isEditing ? 'Save' : 'Edit'}</span>
                  </button>
                </div>
              </div>

              {isCollapsed && summaryPreview && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    paddingLeft: 22,
                  }}
                >
                  {summaryPreview}
                </div>
              )}

              {!isCollapsed && (
                <div id={`script-scene-body-${idx}`}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label htmlFor={`scene-editor-textarea-${idx}`} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Scene {idx + 1} Script Text
                      </label>
                      <textarea
                        id={`scene-editor-textarea-${idx}`}
                        rows={5}
                        value={editSceneText}
                        onChange={(e) => {
                          const nextVal = e.target.value;
                          setEditSceneText(nextVal);
                          setSceneDrafts((prev) => ({ ...prev, [idx]: nextVal }));
                        }}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            commitSceneEdit(idx, editSceneText, true);
                          }
                        }}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px', fontSize: 13, lineHeight: 1.5, borderRadius: 6, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                        Press Save or Ctrl+Enter to apply scene edits (auto-retained when switching between scenes).
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Visual Setup (Showing / Doing) */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <Camera size={14} style={{ color: 'var(--cc-emphasis)', marginTop: 3, flexShrink: 0 }} aria-hidden="true" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                            Showing / Doing
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {s.visual}
                            {s.camera && (
                              <span style={{ color: 'var(--text-tertiary)', fontSize: 12, marginLeft: 6 }}>
                                · Camera: {s.camera}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Spoken Dialogue Bubbles (Saying) */}
                      {s.dialogues && s.dialogues.length > 0 ? (
                        s.dialogues.map((d, dIdx) => (
                          <div
                            key={dIdx}
                            style={{
                              backgroundColor: 'var(--bg-elevated)',
                              padding: '10px 14px',
                              borderRadius: '0 8px 8px 0',
                              borderLeft: '3px solid var(--cc-selected-line)',
                              borderTop: '1px solid var(--border-subtle)',
                              borderRight: '1px solid var(--border-subtle)',
                              borderBottom: '1px solid var(--border-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                fontSize: 12,
                                fontWeight: 600,
                                letterSpacing: '0.005em',
                                color: 'var(--cc-emphasis)',
                                backgroundColor: 'rgba(244, 244, 236, 0.05)',
                                padding: '1px 6px',
                                borderRadius: 3
                              }}>
                                {d.speaker || s.character}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Saying (spoken dialogue)</span>
                            </div>
                            <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                              "{d.text}"
                            </div>
                          </div>
                        ))
                      ) : s.dialogue ? (
                        <div style={{
                          backgroundColor: 'var(--bg-elevated)',
                          padding: '10px 14px',
                          borderRadius: '0 8px 8px 0',
                          borderLeft: '3px solid var(--cc-selected-line)',
                          borderTop: '1px solid var(--border-subtle)',
                          borderRight: '1px solid var(--border-subtle)',
                          borderBottom: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontSize: 12,
                              fontWeight: 600,
                              letterSpacing: '0.005em',
                              color: 'var(--cc-emphasis)',
                              backgroundColor: 'rgba(244, 244, 236, 0.05)',
                              padding: '1px 6px',
                              borderRadius: 3
                            }}>
                              {s.character}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Saying (spoken dialogue)</span>
                          </div>
                          <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            "{s.dialogue}"
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: 'var(--text-tertiary)',
                          padding: '6px 10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: 6,
                          border: '1px dashed var(--border-subtle)'
                        }}>
                          <MessageSquare size={12} style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
                          <span>Saying: Visual action scene · No spoken dialogue</span>
                        </div>
                      )}

                      {/* Audio / SFX if present */}
                      {s.audio && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)', paddingLeft: 2 }}>
                          <Volume2 size={12} style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
                          <span>Audio / SFX: {s.audio}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation & Action Bar */}
      <div className="cc-production-bar production-bar--multi" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          className="cc-ghost-hover"
          style={{
            padding: '10px 16px',
            borderRadius: 999,
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          ← Back
        </button>

        <div className="production-bar-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCopyEntireScript}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              color: isCopiedFull ? 'var(--success)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isCopiedFull ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
            <span>{isCopiedFull ? 'Script Copied!' : 'Copy Script'}</span>
          </button>

          {onSaveProject && (
            <button
              type="button"
              disabled={isSavingProject || isProjectSaved}
              onClick={handleExplicitSave}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                fontSize: 12,
                fontWeight: 600,
                cursor: (isSavingProject || isProjectSaved) ? 'not-allowed' : 'pointer',
                opacity: isSavingProject ? 0.7 : 1,
                color: isProjectSaved ? 'var(--success)' : 'var(--cc-emphasis)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isSavingProject ? (
                <div style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : isProjectSaved ? (
                <Check size={13} style={{ color: 'var(--success)' }} />
              ) : (
                <Bookmark size={13} />
              )}
              <span>{isSavingProject ? 'Saving...' : isProjectSaved ? 'Saved to Library' : 'Save Script'}</span>
            </button>
          )}

          {onTryAnotherVersion && (
            <button
              type="button"
              disabled={isBusy}
              onClick={onTryAnotherVersion}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <RotateCcw size={13} />
              <span>Try another version</span>
            </button>
          )}

          <button
            type="button"
            className="production-bar-primary"
            disabled={isBusy || !scenes.length}
            onClick={onApproveScript}
            style={{
              padding: '12px 28px',
              borderRadius: 999,
              backgroundColor: 'var(--cc-action)',
              color: 'var(--cc-on-action)',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)'
            }}
          >
            <Sparkles size={16} />
            <span>Generate Video →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 10. SCREEN 08 — VIDEO (Make Video & Production Progress)
 */
export function Screen08Video({
  userContext = {},
  creativeDNA = {},
  scenes = [],
  onMakeVideo,
  onBack,
  isRendering = false,
  renderStatusText = '',
  elapsedTime = '00:00',
  videoUrl = null,
  onCreateAnother,
  onRegenerateVideo,
  onStartNewBrief,
  errorMessage = '',
  projectId = null,
  userId = null,
  onboardingState = null,
  onDismissTip,
}) {
  const [showVideoDetails, setShowVideoDetails] = useState(false);
  const [showScriptPreview, setShowScriptPreview] = useState(false);
  const [videoTipIdx, setVideoTipIdx] = useState(0);
  const [hasCopiedShare, setHasCopiedShare] = useState(false);
  // Older projects may hold an expired Magnific link: show that plainly instead of a broken player
  const [playbackFailed, setPlaybackFailed] = useState(false);
  useEffect(() => { setPlaybackFailed(false); }, [videoUrl]);
  const videoUnavailable = Boolean(videoUrl) && (playbackFailed || isVideoLinkExpired(videoUrl));

  const handleShareVideo = async () => {
    if (!videoUrl) return;
    const shareData = {
      title: `${userContext.businessName || 'Clevertize'} Commercial`,
      text: `Watch our commercial for ${userContext.businessName || 'our brand'} created with Clevertize!`,
      url: videoUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[share] navigator.share error:', err);
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(videoUrl);
      setHasCopiedShare(true);
      setTimeout(() => setHasCopiedShare(false), 2500);
    } catch (err) {
      console.warn('[share] clipboard error:', err);
    }
  };

  const videoProductionStages = [
    {
      title: 'Scene & Brand Calibration',
      desc: 'Locking characters, continuous store setting, and brand anchors',
      timeRange: '0–35s',
    },
    {
      title: 'Neural Keyframe Synthesis',
      desc: 'Generating visual anchors and camera framing for all 4 broadcast scenes',
      timeRange: '35–95s',
    },
    {
      title: 'Motion & Temporal Interpolation',
      desc: 'Synthesizing cinematic camera moves, eye contact, and character continuity',
      timeRange: '95–165s',
    },
    {
      title: 'Audio Mastering & Broadcast Assembly',
      desc: 'Synchronizing dialogue cadence, sound mix, and high-definition MP4 encoding',
      timeRange: '165s+',
    },
  ];

  const videoProductionTips = [
    'Character Continuity: Neural seed locks ensure actor faces, clothing, and shop details stay identical across every scene.',
    'First 3-Second Retention: Fast visual hooks and immediate context stop users from swiping past your ad on social feeds.',
    'Colloquial Realism: Conversational dialogue and eye contact make AI-generated commercials feel warm and natural.',
    'Mobile Audio Mastering: Spoken frequencies are enhanced to remain crystal clear even on noisy smartphone speakers.',
    'Continuous Setting: Using one consistent, well-lit store environment builds familiarity and long-term customer trust.',
    'Broadcast Bitrate: Frames are encoded for maximum resolution with ultra-fast streaming playback on WhatsApp & Instagram.'
  ];

  const parseSeconds = (str) => {
    if (!str || typeof str !== 'string') return 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const elapsedSec = parseSeconds(elapsedTime);
  const activeStageIdx = elapsedSec < 35 ? 0 : elapsedSec < 95 ? 1 : elapsedSec < 165 ? 2 : 3;

  useEffect(() => {
    if (!isRendering) return;
    const t = setInterval(() => {
      setVideoTipIdx((prev) => (prev + 1) % videoProductionTips.length);
    }, 6000);
    return () => clearInterval(t);
  }, [isRendering]);

  if (isRendering) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 16,
        padding: '36px 28px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        maxWidth: 620,
        margin: '20px auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Pulsing Cinematic Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--cc-selected-line)',
          boxShadow: '0 0 24px var(--accent-glow)'
        }}>
          <Film size={30} className="icon-spinner" style={{ color: 'var(--cc-emphasis)' }} />
        </div>

        {/* Title & Subtitle */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Producing your commercial…
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, maxWidth: 500 }}>
            {renderStatusText || `Rendering 4 broadcast-quality scenes for ${userContext.businessName || 'your business'} via neural production engine.`}
          </p>
        </div>

        {/* Time badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--cc-emphasis)',
            backgroundColor: 'var(--bg-elevated)',
            padding: '5px 14px',
            borderRadius: 20,
            border: '1px solid var(--border-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--cc-action)' }} />
            Elapsed: {elapsedTime || '00:00'}
          </div>

          <div style={{
            fontSize: 12,
            color: 'var(--text-tertiary)',
            backgroundColor: 'var(--bg-elevated)',
            padding: '5px 12px',
            borderRadius: 20,
            border: '1px solid var(--border-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5
          }}>
            <span>Typical render: ~2–4 mins</span>
          </div>
        </div>

        {/* Dynamic 4-Stage Production Pipeline */}
        <div style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          textAlign: 'left'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginBottom: -2 }}>
            Neural Video Pipeline
          </div>
          {videoProductionStages.map((s, idx) => {
            const isDone = activeStageIdx > idx;
            const isCurrent = activeStageIdx === idx;
            return (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                opacity: isDone ? 0.7 : isCurrent ? 1 : 0.4,
                transition: 'opacity 0.3s ease'
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDone ? 'rgba(95, 212, 174, 0.15)' : isCurrent ? 'var(--bg-active)' : 'transparent',
                  border: isDone ? '1px solid var(--cc-success)' : isCurrent ? '1px solid var(--cc-selected-line)' : '1px solid var(--border-default)',
                  flexShrink: 0
                }}>
                  {isDone ? (
                    <CheckCircle2 size={14} style={{ color: 'var(--cc-success)' }} />
                  ) : isCurrent ? (
                    <RefreshCw size={12} className="icon-spinner" style={{ color: 'var(--cc-emphasis)' }} />
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>{idx + 1}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: isCurrent ? 600 : 600, color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {s.title}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {s.timeRange}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1, lineHeight: 1.3 }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Production Formula Snippet */}
        <div style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: 12,
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clapperboard size={13} style={{ color: 'var(--cc-emphasis)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Rendering:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{userContext.businessName || 'Brand Film'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: 'var(--bg-active)', color: 'var(--cc-emphasis)', fontWeight: 600 }}>
              {userContext.creativeStyle || 'Storytelling'}
            </span>
            <span style={{ padding: '2px 8px', borderRadius: 12, backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
              {userContext.language || 'English'}
            </span>
          </div>
        </div>

        {/* Rotating Filmmaking & AI Insight Card */}
        <div style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: 'rgba(244, 244, 236, 0.03)',
          border: '1px solid rgba(244, 244, 236, 0.18)',
          borderRadius: 10,
          padding: '12px 14px',
          textAlign: 'left',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start'
        }}>
          <Lightbulb size={16} style={{ color: 'var(--cc-text-2)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 600, color: 'var(--cc-text-2)' }}>Filmmaking Insight: </span>
            {videoProductionTips[videoTipIdx]}
          </div>
        </div>

        {/* Read Script While You Wait (Collapsible Accordion) */}
        {scenes && scenes.length > 0 && (
          <div style={{ width: '100%', maxWidth: 520 }}>
            <button
              type="button"
              onClick={() => setShowScriptPreview(!showScriptPreview)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={13} style={{ color: 'var(--cc-emphasis)' }} />
                <span>Read the 4 approved scenes while video renders</span>
              </span>
              {showScriptPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showScriptPreview && (
              <div style={{
                marginTop: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                textAlign: 'left',
                maxHeight: 240,
                overflowY: 'auto',
                paddingRight: 4
              }}>
                {scenes.map((sc, i) => (
                  <div key={i} style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    fontSize: 12
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--cc-emphasis)', marginBottom: 2 }}>
                      Scene {i + 1}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.3, maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sc}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reassurance Footer */}
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 440, lineHeight: 1.4 }}>
          Keep this tab open — your video will play here when ready.
        </div>
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 16,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxWidth: 720,
        margin: '0 auto',
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <CheckCircle2 size={14} />
            <span>Production Complete</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Your video is ready!
          </h1>
        </div>

        {/* Video Player */}
        <div style={{
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#000000',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {videoUnavailable ? (
            <div style={{ padding: '48px 24px', maxWidth: 420, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={28} style={{ color: 'var(--warning, var(--cc-warning))' }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#ffffff' }}>This video's link has expired</div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.7)' }}>
                Videos made before permanent storage was added were kept on a temporary rendering link. Your script is still saved — generate the video again to get a copy that doesn't expire.
              </div>
            </div>
          ) : (
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              onError={() => setPlaybackFailed(true)}
              style={{ maxHeight: 480, width: '100%', objectFit: 'contain' }}
            />
          )}
        </div>

        {/* CTA Hierarchy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!videoUnavailable && shouldShowContextualTip('tip_create_another_video', onboardingState, { hasVideo: Boolean(videoUrl) }) && (
            <ContextualTipBanner
              tipId={CONTEXTUAL_TIPS.tip_create_another_video.id}
              title={CONTEXTUAL_TIPS.tip_create_another_video.title}
              body={CONTEXTUAL_TIPS.tip_create_another_video.body}
              onDismiss={onDismissTip}
            />
          )}
          {/* 1. Primary Action: Create another video */}
          <button
            type="button"
            onClick={onCreateAnother}
            data-testid="create-another-video-cta"
            style={{
              width: '100%',
              padding: '15px 20px',
              borderRadius: 999,
              backgroundColor: 'var(--cc-action)',
              border: 'none',
              color: 'var(--cc-on-action)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              textAlign: 'left',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 15, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Sparkles size={16} />
                <span>Create another video</span>
              </span>
              <span style={{ fontSize: 12, opacity: 0.9, fontWeight: 400 }}>
                Explore another creative direction using the same brief.
              </span>
            </div>
            <ArrowRight size={18} style={{ flexShrink: 0 }} />
          </button>

          {/* 2. Existing Video-Level Actions (Secondary) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.005em',
                color: 'var(--text-tertiary)',
              }}
            >
              Actions for this video
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={handleShareVideo}
                disabled={videoUnavailable}
                data-testid="share-video-btn"
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: videoUnavailable ? 'not-allowed' : 'pointer',
                  opacity: videoUnavailable ? 0.5 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                {hasCopiedShare ? (
                  <>
                    <Check size={14} style={{ color: 'var(--success)' }} />
                    <span style={{ color: 'var(--success)' }}>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span>Share Video</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onRegenerateVideo || onMakeVideo}
                data-testid="regenerate-video-btn"
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <RotateCcw size={14} />
                <span>Regenerate Video</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await downloadVideoWithTicket(videoUrl, `${userContext.businessName || 'clevertize'}-video.mp4`);
                  } catch (err) {
                    alert(err.message || 'Download failed');
                  }
                }}
                disabled={videoUnavailable}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  cursor: videoUnavailable ? 'not-allowed' : 'pointer',
                  opacity: videoUnavailable ? 0.5 : 1,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Download size={14} />
                <span>Download Video</span>
              </button>
            </div>
          </div>

          {/* Post-Generation Creative Rating Prompt (Subtle & Non-blocking) */}
          {!videoUnavailable && (
            <PostGenerationFeedbackPrompt
              videoUrl={videoUrl}
              projectId={projectId}
              userId={userId}
              brandId={userContext?.businessId}
            />
          )}

          {/* 3. Tertiary Action: Start a new brief */}
          {onStartNewBrief && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
              <button
                type="button"
                onClick={onStartNewBrief}
                data-testid="start-new-brief-link"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  fontSize: 12,
                  fontWeight: 500,
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Start a new brief
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Idle or Error State (when not rendering and no video generated yet)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          {errorMessage ? 'Video Generation Incomplete' : 'Ready to Generate Video'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          {errorMessage ? 'Review your script or retry below.' : 'Click Generate Video to start rendering.'}
        </p>
      </div>

      {errorMessage && (
        <div style={{ color: 'var(--error)', backgroundColor: 'rgba(255, 122, 107, 0.1)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--error)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="cc-production-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button
          type="button"
          onClick={onBack}
          className="cc-ghost-hover"
          style={{
            padding: '10px 16px',
            borderRadius: 999,
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          ← Back to Script
        </button>

        <button
          type="button"
          onClick={onMakeVideo}
          style={{
            padding: '14px 34px',
            borderRadius: 999,
            backgroundColor: 'var(--cc-action)',
            color: 'var(--cc-on-action)',
            border: 'none',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)'
          }}
        >
          <Sparkles size={16} />
          <span>{errorMessage ? 'Retry Video Generation' : 'Generate Video'}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
