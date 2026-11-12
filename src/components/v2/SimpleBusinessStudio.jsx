import { getBriefSuggestions } from '../../utils/categorySuggestions.js';
import { downloadVideoWithTicket } from '../../utils/downloadVideo.js';
import { PostGenerationFeedbackPrompt } from './VideoRatingControls.jsx';
import React, { useState, useEffect } from 'react';
import {
  SimpleAdPackagesLoader,
  SimpleVideoProductionLoader,
} from './WorkflowLoadingScreen.jsx';
import CreativeInstructionsSection from './CreativeInstructionsSection.jsx';
import OccasionEventSection from './OccasionEventSection.jsx';
import ProductPhotoSection from './ProductPhotoSection.jsx';
import TargetAudienceSection from './TargetAudienceSection.jsx';
import HelpTooltip from './HelpTooltip.jsx';
import ContextualTipBanner from './ContextualTipBanner.jsx';
import { HELP_TOOLTIPS, CONTEXTUAL_TIPS } from '../../data/tourSteps.js';
import { shouldShowContextualTip } from '../../utils/onboarding.js';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Play,
  Download,
  Copy,
  Check,
  RotateCcw,
  Store,
  Film,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MessageSquare,
  Sliders,
  ExternalLink,
  Share2,
  FileCode2,
  Globe,
  Mic,
  MicOff,
  Timer,
  Ratio,
  Clapperboard,
  MessageCircle,
} from 'lucide-react';

const POPULAR_LANGUAGES = [
  'English',
  'Hindi',
  'Hinglish',
  'Marathi',
  'Kannada',
  'Tamil',
  'Telugu',
  'Gujarati',
  'Bengali',
  'Punjabi',
];

const AD_STYLES = [
  { id: 'UGC / Creator-style', label: 'UGC', shortLabel: 'UGC', desc: 'A creator speaks naturally about your product.' },
  { id: 'Product Demo', label: 'Product Demo', shortLabel: 'Product Demo', desc: 'Show your product in action.' },
  { id: 'Situational Comedy', label: 'Humorous & Fun', shortLabel: 'Funny', desc: 'Use humour and playful situations.' },
  { id: 'Storytelling', label: 'Story', shortLabel: 'Story', desc: 'Build an emotional connection through storytelling.' },
];

function formatStyleShortLabel(style = '') {
  const s = String(style || '');
  if (s.includes('UGC')) return 'UGC';
  if (s.includes('Demo')) return 'Product Demo';
  if (s.includes('Comedy') || s.includes('Funny')) return 'Funny';
  if (s.includes('Conversational')) return 'Conversational';
  if (s.includes('Story')) return 'Story';
  return s || 'UGC';
}

const SIMPLE_DIMENSION_OPTIONS = [
  { id: '9:16', label: '9:16 Vertical', hint: 'Best for Reels, Shorts & TikTok.', frameWidth: 10, frameHeight: 16 },
  { id: '16:9', label: '16:9 Landscape', hint: 'Best for YouTube & websites.', frameWidth: 16, frameHeight: 10 },
  { id: '1:1', label: '1:1 Square', hint: 'Suitable for social feeds.', frameWidth: 13, frameHeight: 13 },
];

const SIMPLE_DURATION_OPTIONS = ['15s', '20s', '30s'];

// Dynamic category suggestions are loaded inside the component via getBriefSuggestions

export default function SimpleBusinessStudio({
  businessName = 'My Business',
  businessType = 'Local Business',
  category: categoryProp,
  town = '',
  initialBrief = '',
  initialTargetAudience = '',
  initialLanguage = 'English',
  initialStyle = 'UGC / Creator-style',
  initialDuration = '20s',
  initialAspectRatio = '9:16',
  brandTone = 'Warm & Authentic',
  brandLogo = null,
  productPhoto: controlledProductPhoto,
  onUploadProductPhoto = null,
  onRemoveProductPhoto = null,
  onSwitchToDirectorMode,
  onProduceVideo, // (packageData) => Promise<videoUrl>
  onSaveProject,
  onEditBrand,
  onStartNewBrief,
  onOpenScriptModal = null,
  onOpenUrlModal = null,
  isRecording = false,
  onToggleRecording = null,
  dictatedBriefSync = null,
  isProducingVideo = false,
  isSavingProject = false,
  isProjectSaved = false,
  producedVideoUrl = null,
  videoRunError = null,
  initialDraft = null, // a saved draft's Simple Studio state, when resuming it from My Projects
  onDraftChange, // (state, { flush }) => void — lets the app autosave this flow as a draft
  projectId = null,
  userId = null,
  onboardingState = null,
  onDismissTip,
  onBehaviorEvent,
}) {
  const category = categoryProp || businessType || 'Local Business';

  // Dynamic Category & Brand-Specific Suggestions
  const categoryContext = getBriefSuggestions(category, businessName, town);
  const quickIdeas = (categoryContext && Array.isArray(categoryContext.suggestions) && categoryContext.suggestions.length > 0)
    ? categoryContext.suggestions
    : [
        `Highlight special festive offers and hallmark quality at ${businessName}`,
        `Create a relatable story celebrating happy patrons at ${businessName}`,
        `Show why customers across ${town || 'the city'} recommend ${businessName}`,
        `Announce exclusive limited-time celebratory discounts`,
      ];
  const dynamicPlaceholder = categoryContext?.placeholder || `e.g. Tell us what you want to promote for ${businessName} (e.g., special festive discounts, new collections, hallmark purity...)`;

  // 3 Steps:
  // 1: 'offer' (Input promotion details)
  // 2: 'choose' (Pick from 3 generated complete ad scripts)
  // 3: 'produce' (Video production, player, download)
  const draft = initialDraft || {};
  const [step, setStep] = useState(draft.step || 1);

  // Step 1 Form state
  const [brief, setBrief] = useState(draft.brief ?? (initialBrief || ''));
  const [targetAudience, setTargetAudience] = useState(draft.targetAudience ?? (initialTargetAudience || ''));
  const [language, setLanguage] = useState(draft.language || initialLanguage || 'English');
  const [creativeStyle, setCreativeStyle] = useState(draft.creativeStyle || initialStyle || 'UGC / Creator-style');
  const [duration, setDuration] = useState(draft.duration || initialDuration || '20s');
  const [aspectRatio, setAspectRatio] = useState(draft.aspectRatio || initialAspectRatio || '9:16');
  const [videoSettingsExpanded, setVideoSettingsExpanded] = useState(true);
  const isControlledPhoto = controlledProductPhoto !== undefined;
  const [localProductPhoto, setLocalProductPhoto] = useState(() => {
    if (draft.productPhoto && (draft.productPhoto.data || draft.productPhoto.previewUrl)) {
      return {
        ...draft.productPhoto,
        previewUrl: draft.productPhoto.previewUrl || `data:${draft.productPhoto.mime || 'image/jpeg'};base64,${draft.productPhoto.data}`,
      };
    }
    return null;
  });
  const productPhoto = isControlledPhoto ? controlledProductPhoto : localProductPhoto;
  const [charCount, setCharCount] = useState(brief.length);

  // Step 2 Packages state
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [packages, setPackages] = useState(Array.isArray(draft.packages) ? draft.packages : []);
  const [selectedPackageId, setSelectedPackageId] = useState(draft.selectedPackageId ?? null);
  const [aiUnderstanding, setAiUnderstanding] = useState(draft.aiUnderstanding || null);
  const [creativeGuardrails, setCreativeGuardrails] = useState(draft.creativeGuardrails || null);
  const [guardrailDraftInputs, setGuardrailDraftInputs] = useState(
    draft.guardrailDraftInputs || { doText: '', dontText: '' }
  );
  const [eventContext, setEventContext] = useState(draft.eventContext || null);
  const [expandedPackageId, setExpandedPackageId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [briefOptionalExpanded, setBriefOptionalExpanded] = useState(
    draft.briefOptionalExpanded || { inspiration: false, audience: false, instructions: false, occasion: false, productPhoto: false }
  );

  // Step 3 / Script copy & share state
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [editableDialogue, setEditableDialogue] = useState({});

  useEffect(() => {
    setCharCount(brief.length);
  }, [brief]);

  useEffect(() => {
    if (dictatedBriefSync && typeof dictatedBriefSync.text === 'string' && dictatedBriefSync.seq > 0) {
      setBrief(dictatedBriefSync.text);
    }
  }, [dictatedBriefSync?.seq]);

  // Report this flow's state so the app can autosave it as a draft (it debounces; step changes save at once)
  const draftState = () => ({ step, brief, targetAudience, language, creativeStyle, duration, aspectRatio, productPhoto, packages, selectedPackageId, aiUnderstanding, creativeGuardrails, guardrailDraftInputs, eventContext, briefOptionalExpanded });
  useEffect(() => {
    if (onDraftChange) onDraftChange(draftState(), { flush: false });
  }, [step, brief, targetAudience, language, creativeStyle, duration, aspectRatio, productPhoto, packages, selectedPackageId, aiUnderstanding, creativeGuardrails, guardrailDraftInputs, eventContext, briefOptionalExpanded]);

  const handleApplyTemplate = (tpl) => {
    setBrief(tpl);
  };

  const handlePhotoUpload = (file) => {
    if (!file || (file.type && !file.type.startsWith('image/'))) return;
    if (typeof onUploadProductPhoto === 'function') {
      onUploadProductPhoto(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setLocalProductPhoto({
        name: file.name,
        previewUrl: e.target.result,
        data: e.target.result.split(',')[1],
        mime: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = () => {
    if (typeof onRemoveProductPhoto === 'function') {
      onRemoveProductPhoto();
    } else {
      setLocalProductPhoto(null);
    }
  };

  const handleGeneratePackages = async () => {
    if (!brief.trim()) {
      setLoadError('Please enter what you want to promote (e.g. a discount, offer, or service).');
      return;
    }

    setLoadError('');
    setIsLoadingPackages(true);
    if (onDraftChange) onDraftChange(draftState(), { flush: true }); // brief submitted: save it now

    try {
      const token = localStorage.getItem('clevertize_token');
      const res = await fetch('/api/creative/simple-packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          businessName,
          businessType: category,
          town,
          brief: brief.trim(),
          language,
          creativeStyle,
          brandTone,
          duration,
          aspectRatio,
          hasLogo: Boolean(brandLogo),
          hasProductPhoto: Boolean(productPhoto),
          projectId,
          aiUnderstanding,
          creativeGuardrails,
          eventContext,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate ad scripts.');
      }

      const data = await res.json();
      if (Array.isArray(data.packages) && data.packages.length > 0) {
        if (data.aiUnderstanding) {
          setAiUnderstanding(data.aiUnderstanding);
        }
        if (data.creativeGuardrails) {
          setCreativeGuardrails(data.creativeGuardrails);
        }
        if (data.eventContext !== undefined) {
          setEventContext(data.eventContext);
        }
        setPackages(data.packages);
        setSelectedPackageId(data.packages[0].id);
        setStep(2);
      } else {
        throw new Error('No ad scripts were generated. Please try again.');
      }
    } catch (err) {
      console.error('[SimpleStudio] generation error:', err.message);
      setLoadError(err.message || 'Error creating ad scripts. Please try again.');
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const selectedPackage = packages.find((p) => p.id === selectedPackageId) || packages[0];

  const handleStartProduction = async () => {
    if (!selectedPackage) return;
    setStep(3);
    if (onProduceVideo) {
      const derivedSetting = (
        selectedPackage.setting ||
        `Modern, well-lit ${category || 'business'} environment at ${businessName || 'the store'}`
      ).trim();

      const derivedChar1 = (
        selectedPackage.character1 ||
        selectedPackage.characters?.lead ||
        selectedPackage.characters?.character1 ||
        (typeof selectedPackage.characters === 'string' ? selectedPackage.characters : '') ||
        `${businessName || 'Store'} Specialist / Host`
      ).trim();

      const derivedChar2 = (
        selectedPackage.character2 ||
        selectedPackage.characters?.customer ||
        selectedPackage.characters?.character2 ||
        'Customer'
      ).trim();

      onProduceVideo({
        ...selectedPackage,
        setting: derivedSetting,
        character1: derivedChar1,
        character2: derivedChar2,
        productPhoto,
        brief,
        language,
        creativeStyle,
        duration: selectedPackage.duration || duration,
        aspectRatio: selectedPackage.aspectRatio || aspectRatio,
        dimension: selectedPackage.aspectRatio || aspectRatio,
        creativeGuardrails,
        platform: (selectedPackage.aspectRatio || aspectRatio) === '16:9' ? 'YouTube / 16:9' : (selectedPackage.aspectRatio || aspectRatio) === '1:1' ? 'Feed / 1:1' : 'Instagram Reels / 9:16',
      });
    }
  };

  const handleCopyScriptText = () => {
    if (!selectedPackage?.fullScriptText) return;
    navigator.clipboard.writeText(selectedPackage.fullScriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div style={{ maxWidth: 860, margin: '16px auto 0', width: '100%', padding: '0 20px 80px' }}>
      {/* 3-STEP GUIDED PROGRESS HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px 16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        {[
          { num: '01', stepNum: 1, label: 'Your Offer' },
          { num: '02', stepNum: 2, label: 'Choose Script' },
          { num: '03', stepNum: 3, label: 'Produce Video' },
        ].map((s, idx) => {
          const isCurrent = step === s.stepNum;
          const isCompleted = step > s.stepNum;
          const isNavigable = isCompleted && !isCurrent;

          return (
            <React.Fragment key={s.stepNum}>
              <button
                type="button"
                disabled={!isNavigable}
                onClick={() => isNavigable && setStep(s.stepNum)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 6,
                  cursor: isNavigable ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
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
                title={isNavigable ? `Back to ${s.label}` : s.label}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: isCurrent
                      ? 'var(--cc-action)'
                      : isCompleted
                      ? 'rgba(95, 212, 174, 0.15)'
                      : 'var(--bg-elevated)',
                    color: isCurrent
                      ? '#ffffff'
                      : isCompleted
                      ? 'var(--success)'
                      : 'var(--text-tertiary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11.5,
                    fontWeight: 600,
                  }}
                >
                  {isCompleted && !isCurrent ? <Check size={10} strokeWidth={3} /> : s.num}
                </span>
                <span>{s.label}</span>
              </button>
              {idx < 2 && (
                <span style={{ color: 'var(--text-tertiary)', fontSize: 11.5 }}>›</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* COMPACT CAMPAIGN IDENTITY */}
      {businessName && (
        <div
          data-testid="simple-campaign-identity"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            padding: '2px 2px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
            <Store size={14} style={{ color: 'var(--cc-emphasis)', flexShrink: 0 }} aria-hidden="true" />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
              {businessName}
            </span>
            {businessType && (
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                · {businessType}
              </span>
            )}
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-tertiary)',
                paddingLeft: 4,
              }}
            >
              Active brand
            </span>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 1: WHAT ARE YOU PROMOTING?
      ======================================================== */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {isLoadingPackages ? (
            <SimpleAdPackagesLoader
              businessName={businessName}
              category={category}
              statusText="Writing 3 Ad Scripts..."
            />
          ) : (
            <>
              <div
                data-testid="simple-brief-screen"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 14,
                  padding: '22px 24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>What are you promoting?</span>
                    <HelpTooltip
                      title={HELP_TOOLTIPS.brief_input.title}
                      body={HELP_TOOLTIPS.brief_input.body}
                      ariaLabel="Help with promotion brief"
                    />
                  </h2>

                  {(onOpenScriptModal || onOpenUrlModal) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {onOpenScriptModal && (
                        <button
                          type="button"
                          onClick={onOpenScriptModal}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '5px 10px',
                            borderRadius: 7,
                            fontSize: 12,
                            fontWeight: 500,
                            backgroundColor: 'transparent',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title="Paste an existing script draft to auto-import scenes"
                        >
                          <FileCode2 size={13} aria-hidden="true" />
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
                            gap: 5,
                            padding: '5px 10px',
                            borderRadius: 7,
                            fontSize: 12,
                            fontWeight: 500,
                            backgroundColor: 'transparent',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          title="Scan your store or landing page to extract products & offers"
                        >
                          <Globe size={13} aria-hidden="true" />
                          <span>Scan URL</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Brief Textarea */}
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={brief}
                    onChange={(e) => {
                      setBrief(e.target.value);
                      if (loadError) setLoadError('');
                    }}
                    placeholder={dynamicPlaceholder}
                    rows={4}
                    aria-label="What are you promoting?"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '14px',
                      borderRadius: 10,
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      lineHeight: 1.55,
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />

                  {onToggleRecording && (
                    <button
                      type="button"
                      onClick={() => onToggleRecording(brief)}
                      aria-label={isRecording ? 'Stop recording voice brief' : 'Dictate your brief using microphone'}
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 10,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 10px',
                        borderRadius: 16,
                        backgroundColor: isRecording ? 'rgba(255, 122, 107, 0.14)' : 'var(--bg-surface)',
                        border: isRecording ? '1px solid var(--error)' : '1px solid var(--border-subtle)',
                        color: isRecording ? 'var(--error)' : 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                      title={isRecording ? 'Stop recording' : 'Dictate your brief'}
                    >
                      {isRecording ? <MicOff size={12} aria-hidden="true" /> : <Mic size={12} aria-hidden="true" />}
                      <span>{isRecording ? 'Listening…' : 'Dictate'}</span>
                    </button>
                  )}
                </div>

                {/* Calm Utility Row: Expandable Sample Ideas + Character Count */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    aria-expanded={Boolean(briefOptionalExpanded.inspiration)}
                    aria-controls="simple-brief-inspiration-panel"
                    onClick={() => setBriefOptionalExpanded((prev) => ({ ...prev, inspiration: !prev.inspiration }))}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '2px 0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {briefOptionalExpanded.inspiration ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
                    <Sparkles size={12} style={{ color: 'var(--cc-emphasis)' }} aria-hidden="true" />
                    <span>Sample ideas</span>
                  </button>

                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {charCount} characters
                  </span>
                </div>

                {briefOptionalExpanded.inspiration && (
                  <div id="simple-brief-inspiration-panel" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {quickIdeas.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 18,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--text-primary)';
                          e.currentTarget.style.borderColor = 'var(--cc-selected-line)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        }}
                      >
                        + {tpl}
                      </button>
                    ))}
                  </div>
                )}

                {loadError && (
                  <div
                    role="alert"
                    style={{
                      marginTop: 14,
                      padding: '10px 14px',
                      borderRadius: 8,
                      backgroundColor: 'rgba(255, 122, 107, 0.1)',
                      border: '1px solid rgba(255, 122, 107, 0.3)',
                      color: 'var(--cc-danger)',
                      fontSize: 12,
                    }}
                  >
                    {loadError}
                  </div>
                )}
              </div>

              {/* C. Video Settings (Expanded by default; manually collapsible with summary) */}
              <div
                data-testid="simple-video-settings-section"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  data-testid="simple-video-settings-toggle"
                  aria-expanded={videoSettingsExpanded}
                  aria-controls="simple-video-settings-panel"
                  onClick={() => setVideoSettingsExpanded((prev) => !prev)}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {videoSettingsExpanded ? (
                      <ChevronDown size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
                    )}
                    <Sliders size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} aria-hidden="true" />
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Video Settings
                    </span>
                  </div>

                  {!videoSettingsExpanded && (
                    <span
                      data-testid="simple-video-settings-summary"
                      style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}
                    >
                      {`${language} · ${formatStyleShortLabel(creativeStyle)} · ${aspectRatio} · ${duration}`}
                    </span>
                  )}
                </button>

                {videoSettingsExpanded && (
                  <div
                    id="simple-video-settings-panel"
                    style={{
                      padding: '18px 20px 20px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 20,
                    }}
                  >
                    {/* Row 1: Guided Language Select + Segmented Duration */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
                        gap: 18,
                        alignItems: 'start',
                      }}
                    >
                      {/* 1. Language Dropdown */}
                      <div>
                        <label
                          htmlFor="simple-ad-language"
                          style={{
                            display: 'block',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: 3,
                          }}
                        >
                          What language should your video use?
                        </label>
                        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                          Choose the language for spoken dialogue.
                        </p>
                        <select
                          id="simple-ad-language"
                          aria-label="What language should your video use?"
                          data-testid="simple-language-select"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
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
                          {(POPULAR_LANGUAGES.includes(language)
                            ? POPULAR_LANGUAGES
                            : [language, ...POPULAR_LANGUAGES]
                          ).map((lang) => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 4. Duration (Horizontal Segmented Control) */}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                          How long should your video be?
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                          Short videos suit quick offers; longer videos allow more storytelling.
                        </p>
                        <div
                          role="group"
                          aria-label="How long should your video be?"
                          data-testid="simple-duration-segmented"
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
                          {SIMPLE_DURATION_OPTIONS.map((dur) => {
                            const isSelected = duration === dur;
                            return (
                              <button
                                key={dur}
                                type="button"
                                aria-pressed={isSelected}
                                data-testid={`simple-duration-option-${dur}`}
                                onClick={() => setDuration(dur)}
                                style={{
                                  border: 'none',
                                  borderRadius: 6,
                                  fontSize: 12.5,
                                  fontWeight: isSelected ? 600 : 500,
                                  backgroundColor: isSelected ? 'var(--cc-active)' : 'transparent',
                                  color: isSelected ? 'var(--cc-text-1)' : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {dur}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 3. Video Dimension (3 compact guided options) */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                        Where will you share your video?
                      </div>
                      <p style={{ margin: '0 0 9px', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                        Choose a format that fits your platform.
                      </p>
                      <div
                        role="group"
                        aria-label="Where will you share your video?"
                        data-testid="simple-dimension-group"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(min(170px, 100%), 1fr))',
                          gap: 8,
                        }}
                      >
                        {SIMPLE_DIMENSION_OPTIONS.map((dim) => {
                          const isSelected = aspectRatio === dim.id;
                          return (
                            <button
                              key={dim.id}
                              type="button"
                              aria-pressed={isSelected}
                              data-testid={`simple-dimension-option-${dim.id}`}
                              onClick={() => setAspectRatio(dim.id)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: 4,
                                padding: '10px 12px',
                                borderRadius: 8,
                                backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                                border: isSelected ? '1.5px solid var(--cc-selected-line)' : '1px solid var(--border-subtle)',
                                color: isSelected ? 'var(--cc-emphasis)' : 'var(--text-primary)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                                  <span
                                    aria-hidden="true"
                                    style={{
                                      width: dim.frameWidth,
                                      height: dim.frameHeight,
                                      borderRadius: 2,
                                      border: isSelected ? '1.5px solid var(--cc-selected-line)' : '1.5px solid var(--text-tertiary)',
                                      backgroundColor: isSelected ? 'rgba(244, 244, 236, 0.08)' : 'transparent',
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span style={{ fontSize: 12.5, fontWeight: isSelected ? 600 : 600 }}>
                                    {dim.label}
                                  </span>
                                </div>
                                {isSelected && <Check size={13} strokeWidth={2.75} aria-hidden="true" />}
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.35 }}>
                                {dim.hint}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Creative Style (All 4 visible compact tiles with plain-language cues) */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                        What style would you like?
                      </div>
                      <p style={{ margin: '0 0 9px', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                        Choose how your product or offer should be presented.
                      </p>
                      <div
                        role="group"
                        aria-label="Creative Style"
                        data-testid="simple-style-group"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(min(185px, 100%), 1fr))',
                          gap: 8,
                        }}
                      >
                        {AD_STYLES.map((st) => {
                          const isSelected = creativeStyle === st.id;
                          return (
                            <button
                              key={st.id}
                              type="button"
                              aria-pressed={isSelected}
                              data-testid={`simple-style-option-${st.shortLabel.toLowerCase().replace(/\s+/g, '-')}`}
                              onClick={() => setCreativeStyle(st.id)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                                gap: 4,
                                padding: '10px 12px',
                                borderRadius: 8,
                                backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                                border: isSelected ? '1.5px solid var(--cc-selected-line)' : '1px solid var(--border-subtle)',
                                color: isSelected ? 'var(--cc-emphasis)' : 'var(--text-primary)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 6 }}>
                                <span style={{ fontSize: 12.5, fontWeight: isSelected ? 600 : 600 }}>
                                  {st.label}
                                </span>
                                {isSelected && <Check size={13} strokeWidth={2.75} aria-hidden="true" />}
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.35 }}>
                                {st.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* D. Optional Details Grouping */}
              <div data-testid="brief-optional-details" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', padding: '2px 2px 0' }}>
                  Optional Details
                </span>

                <TargetAudienceSection
                  id="simple-target-audience"
                  testId="target-audience-section"
                  targetAudience={targetAudience}
                  businessType={businessType}
                  onChange={setTargetAudience}
                  expanded={Boolean(briefOptionalExpanded.audience)}
                  onToggleExpand={(next) => setBriefOptionalExpanded((prev) => ({ ...prev, audience: next }))}
                />

                <CreativeInstructionsSection
                  creativeGuardrails={creativeGuardrails}
                  onChange={setCreativeGuardrails}
                  draftInputs={guardrailDraftInputs}
                  onDraftChange={setGuardrailDraftInputs}
                  expanded={Boolean(briefOptionalExpanded.instructions)}
                  onToggleExpand={(next) => setBriefOptionalExpanded((prev) => ({ ...prev, instructions: next }))}
                />

                <OccasionEventSection
                  eventContext={eventContext}
                  onChange={setEventContext}
                  expanded={Boolean(briefOptionalExpanded.occasion)}
                  onToggleExpand={(next) => setBriefOptionalExpanded((prev) => ({ ...prev, occasion: next }))}
                />

                <ProductPhotoSection
                  id="simple-product-photo"
                  testId="product-photo-section"
                  productPhoto={productPhoto}
                  onUploadFile={handlePhotoUpload}
                  onRemove={handlePhotoRemove}
                  expanded={Boolean(briefOptionalExpanded.productPhoto)}
                  onToggleExpand={(next) => setBriefOptionalExpanded((prev) => ({ ...prev, productPhoto: next }))}
                />
              </div>

              {/* E. Dominant Primary Action */}
              <div className="cc-sticky-action" style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                <button
                  type="button"
                  disabled={isLoadingPackages || !brief.trim()}
                  onClick={handleGeneratePackages}
                  className="cc-btn cc-btn--primary cc-btn--lg"
                  style={{
                    padding: '0 26px',
                    cursor: isLoadingPackages || !brief.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: isLoadingPackages || !brief.trim() ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 32px rgba(0,0,0,0.45)',
                  }}
                >
                  <Sparkles size={15} aria-hidden="true" />
                  <span>Generate 3 Ad Scripts ➔</span>
                </button>
              </div>

              {shouldShowContextualTip('tip_try_director', onboardingState, { studioMode: 'simple' }) && (
                <ContextualTipBanner
                  tipId={CONTEXTUAL_TIPS.tip_try_director.id}
                  title={CONTEXTUAL_TIPS.tip_try_director.title}
                  body={CONTEXTUAL_TIPS.tip_try_director.body}
                  actionLabel={onSwitchToDirectorMode ? CONTEXTUAL_TIPS.tip_try_director.actionLabel : undefined}
                  onAction={onSwitchToDirectorMode}
                  onDismiss={onDismissTip}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================
          STEP 2: CHOOSE YOUR AD SCRIPT
      ======================================================== */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              Choose Your Ad Script
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Pick a script below to generate your video.
            </p>
          </div>

          {/* 3 Packages Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {packages.map((pkg, idx) => {
              const isSelected = selectedPackageId === pkg.id;
              const isExpanded = expandedPackageId === pkg.id;

              return (
                <div
                  key={pkg.id || idx}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                    border: isSelected ? '2px solid var(--cc-selected-line)' : '1px solid var(--border-default)',
                    borderRadius: 14,
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                  }}
                >
                  {/* Top Bar: Badge & Angle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          letterSpacing: '0.005em',
                          padding: '3px 8px',
                          borderRadius: 4,
                          backgroundColor: isSelected ? 'rgba(244, 244, 236, 0.1)' : 'rgba(244, 244, 236, 0.075)',
                          color: isSelected ? 'var(--cc-text-1)' : 'var(--cc-emphasis)',
                        }}
                      >
                        {pkg.badge || `Ad Concept ${idx + 1}`}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                        {pkg.angle}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                        <Timer size={12} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />{pkg.duration || duration}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                        <Ratio size={12} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />{pkg.aspectRatio || aspectRatio}
                      </span>
                    </div>

                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: isSelected ? '6px solid var(--cc-selected-line)' : '2px solid var(--border-default)',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>

                  {/* Title & Hook Headline */}
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                    {pkg.title}
                  </h3>

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--cc-emphasis)', marginBottom: 2 }}>
                      Opening Hook
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                      "{pkg.hookHeadline}"
                    </div>
                  </div>

                  {/* Narrative Summary */}
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.45 }}>
                    {pkg.narrativeSummary}
                  </p>

                  {pkg.guardrailReport && (pkg.guardrailReport.hasCriticalViolation || (pkg.guardrailReport.visualReviewRequired?.length > 0)) && (
                    <div
                      style={{
                        marginBottom: 10,
                        padding: '7px 10px',
                        borderRadius: 7,
                        fontSize: 12,
                        backgroundColor: pkg.guardrailReport.hasCriticalViolation ? 'rgba(255, 122, 107, 0.08)' : 'rgba(244, 244, 236, 0.04)',
                        border: `1px solid ${pkg.guardrailReport.hasCriticalViolation ? 'rgba(255, 122, 107, 0.25)' : 'rgba(244, 244, 236, 0.2)'}`,
                        color: pkg.guardrailReport.hasCriticalViolation ? 'var(--cc-danger)' : 'var(--text-secondary)',
                      }}
                    >
                      {pkg.guardrailReport.hasCriticalViolation
                        ? `Guardrail alert: ${pkg.guardrailReport.automatedChecks.criticalViolations.map((v) => v.explanation).join(' | ')}`
                        : `Visual instructions passed into generation (${pkg.guardrailReport.visualReviewRequired.length} item(s) need manual visual check after render).`}
                    </div>
                  )}

                  {/* Expand / Collapse 4 Scenes */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPackageId(isExpanded ? null : pkg.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--cc-emphasis)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>{isExpanded ? 'Hide Scenes' : 'Preview Scenes'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && Array.isArray(pkg.scenes) && (
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pkg.scenes.map((sc, sIdx) => (
                          <div
                            key={sIdx}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 8,
                              backgroundColor: 'var(--bg-elevated)',
                              fontSize: 12,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                Scene {sc.sceneNumber || sIdx + 1} · {sc.beat}
                              </span>
                              <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{sc.timing}</span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                              <Clapperboard size={12} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />{sc.visual}
                            </div>
                            {sc.dialogue && (
                              <div style={{ color: 'var(--cc-emphasis)', fontWeight: 600, fontStyle: 'italic' }}>
                                <MessageCircle size={12} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 5, opacity: 0.8 }} />{sc.dialogue}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="cc-production-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="cc-ghost-hover"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 999,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleStartProduction}
              className="cc-btn cc-btn--primary cc-btn--lg"
              style={{ padding: '0 24px' }}
            >
              <Play size={15} fill="currentColor" />
              <span>Produce Video for Selected Script ➔</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 3: VIDEO PRODUCTION & PLAYER
      ======================================================== */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              backgroundColor: producedVideoUrl && !isProducingVideo ? 'transparent' : 'var(--bg-surface)',
              border: producedVideoUrl && !isProducingVideo ? '1px solid transparent' : '1px solid var(--border-subtle)',
              borderRadius: 20,
              padding: producedVideoUrl && !isProducingVideo ? '8px 0' : 24,
              textAlign: 'center',
            }}
          >
            {isProducingVideo ? (
              <SimpleVideoProductionLoader
                businessName={businessName}
                renderStatusText={`Rendering broadcast scenes for "${selectedPackage?.title}". Synchronizing camera angles, character continuity, and audio mastering.`}
              />
            ) : producedVideoUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <div className="cc-enter" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', fontWeight: 600, fontSize: 24, letterSpacing: '-0.02em', fontFamily: 'var(--cc-font-display)' }}>
                  <CheckCircle2 size={22} style={{ color: 'var(--success)' }} />
                  <span>Your video is ready!</span>
                </div>

                {/* Video Player */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: 720,
                    borderRadius: 20,
                    overflow: 'hidden',
                    backgroundColor: '#000000',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
                  }}
                >
                  <video
                    src={producedVideoUrl}
                    controls
                    autoPlay
                    loop
                    style={{ width: '100%', display: 'block', maxHeight: '72vh', objectFit: 'contain' }}
                  />
                </div>

                {/* 3-Tier CTA Hierarchy for Completed Video */}
                <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {shouldShowContextualTip('tip_create_another_video', onboardingState, { hasVideo: Boolean(producedVideoUrl) }) && (
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
                    onClick={() => {
                      if (onBehaviorEvent) onBehaviorEvent('createdAnotherCount');
                      handleGeneratePackages();
                    }}
                    disabled={isLoadingPackages}
                    data-testid="simple-create-another-video-cta"
                    className="cc-btn cc-btn--primary cc-btn--lg"
                    style={{
                      width: '100%',
                      height: 'auto',
                      padding: '12px 14px 12px 22px',
                      borderRadius: 999,
                      cursor: isLoadingPackages ? 'wait' : 'pointer',
                      justifyContent: 'space-between',
                      gap: 12,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <Sparkles size={15} />
                        <span>Create another video</span>
                      </span>
                      <span style={{ fontSize: 12.5, opacity: 0.75, fontWeight: 500 }}>
                        Explore another creative direction using the same brief.
                      </span>
                    </div>
                    <span style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(11, 13, 2, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ArrowRight size={17} />
                    </span>
                  </button>

                  {/* 2. Existing Video-Level Actions (Secondary) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
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
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!producedVideoUrl) return;
                          const shareData = {
                            title: `${businessName || 'CleverCut'} Commercial`,
                            text: `Watch our commercial video for ${businessName || 'our brand'}!`,
                            url: producedVideoUrl,
                          };
                          if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                            try {
                              await navigator.share(shareData);
                              return;
                            } catch (err) {
                              if (err.name === 'AbortError') return;
                            }
                          }
                          try {
                            await navigator.clipboard.writeText(producedVideoUrl);
                            setCopiedShareLink(true);
                            setTimeout(() => setCopiedShareLink(false), 2500);
                          } catch {}
                        }}
                        style={{
                          flex: '1 1 130px',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 7,
                          padding: '10px 14px',
                          borderRadius: 999,
                          backgroundColor: 'rgba(255, 255, 255, 0.07)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {copiedShareLink ? (
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
                        onClick={handleStartProduction}
                        style={{
                          flex: '1 1 130px',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 7,
                          padding: '10px 14px',
                          borderRadius: 999,
                          backgroundColor: 'rgba(255, 255, 255, 0.07)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <RotateCcw size={14} />
                        <span>Regenerate Video</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await downloadVideoWithTicket(producedVideoUrl, `${(businessName || 'ad').replace(/\s+/g, '_')}_commercial.mp4`);
                          } catch (err) {
                            alert(err.message || 'Download failed');
                          }
                        }}
                        style={{
                          flex: '1 1 130px',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 7,
                          padding: '10px 14px',
                          borderRadius: 999,
                          backgroundColor: 'rgba(255, 255, 255, 0.07)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Download size={14} />
                        <span>Download Video</span>
                      </button>

                      {onSaveProject && (
                        <button
                          type="button"
                          onClick={() => onSaveProject(selectedPackage)}
                          disabled={isSavingProject}
                          style={{
                            flex: '1 1 130px',
                          whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '10px 14px',
                            borderRadius: 999,
                            backgroundColor: 'rgba(255, 255, 255, 0.07)',
                            border: '1px solid var(--border-subtle)',
                            color: isProjectSaved ? 'var(--success)' : 'var(--text-primary)',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: isSavingProject ? 'not-allowed' : 'pointer',
                            opacity: isSavingProject ? 0.7 : 1,
                          }}
                        >
                          {isProjectSaved ? <Check size={14} /> : <CheckCircle2 size={14} />}
                          <span>{isSavingProject ? 'Saving…' : isProjectSaved ? 'Saved' : 'Save Project'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleCopyScriptText}
                        style={{
                          flex: '1 1 130px',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 7,
                          padding: '10px 14px',
                          borderRadius: 999,
                          backgroundColor: 'rgba(255, 255, 255, 0.07)',
                          border: '1px solid var(--border-subtle)',
                          color: copiedScript ? 'var(--success)' : 'var(--text-primary)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {copiedScript ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedScript ? 'Script Copied!' : 'Copy Script'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Post-Generation Creative Rating Prompt (Subtle & Non-blocking) */}
                <PostGenerationFeedbackPrompt
                  videoUrl={producedVideoUrl}
                  projectId={projectId}
                  userId={userId}
                />
              </div>
            ) : videoRunError ? (
              <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ color: 'var(--cc-danger)', fontSize: 16, fontWeight: 600 }}>
                  Video Generation Notice
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 440, margin: 0 }}>
                  {videoRunError}
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleStartProduction()}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 999,
                      backgroundColor: 'var(--cc-action)',
                      border: 'none',
                      color: 'var(--cc-on-action)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyScriptText}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Copy Script
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '30px 20px' }}>
                <button
                  type="button"
                  onClick={handleStartProduction}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 999,
                    backgroundColor: 'var(--cc-action)',
                    border: 'none',
                    color: 'var(--cc-on-action)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Click to Start Video Production
                </button>
              </div>
            )}
          </div>

          {/* Footer Navigation & Tertiary New Brief Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                background: 'none',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={13} />
              <span>Back to Ad Choices</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setBrief('');
                setCreativeGuardrails(null);
                setGuardrailDraftInputs({ doText: '', dontText: '' });
                setEventContext(null);
                setAiUnderstanding(null);
                setPackages([]);
                setSelectedPackageId(null);
                if (onStartNewBrief) onStartNewBrief();
              }}
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
        </div>
      )}
    </div>
  );
}
