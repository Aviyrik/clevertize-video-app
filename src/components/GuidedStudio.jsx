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
  RotateCcw
} from 'lucide-react';

/**
 * 8 STAGES DEFINITION FOR GUIDED CREATIVE STUDIO
 */
export const STUDIO_STAGES = [
  { id: 'business', num: '01', label: 'Business' },
  { id: 'brief', num: '02', label: 'Brief' },
  { id: 'settings', num: '03', label: 'Settings' },
  { id: 'idea', num: '04', label: 'Idea' },
  { id: 'opening', num: '05', label: 'Opening' },
  { id: 'story', num: '06', label: 'Story' },
  { id: 'script', num: '07', label: 'Script' },
  { id: 'video', num: '08', label: 'Video' },
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

  return (
    <div style={{
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
                fontWeight: isCurrent ? 700 : isCompleted ? 600 : 500,
                color: isCurrent
                  ? 'var(--accent-primary)'
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
                  ? 'var(--accent-primary)'
                  : isCompleted
                  ? 'rgba(34, 197, 94, 0.15)'
                  : 'var(--bg-elevated)',
                color: isCurrent
                  ? '#ffffff'
                  : isCompleted
                  ? 'var(--success)'
                  : 'var(--text-tertiary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 800,
              }}>
                {isCompleted && !isCurrent ? <Check size={10} strokeWidth={3} /> : st.num}
              </span>
              <span>{st.label}</span>
            </button>

            {idx < STUDIO_STAGES.length - 1 && (
              <span style={{ color: 'var(--border-subtle)', fontSize: 12 }}>→</span>
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
  onNavigateStage,
  hasStaleWarning,
  onApplyUpdate,
}) {
  const {
    style,
    language,
    duration,
    platform,
    idea,
    opening,
  } = explicitChoices || {};

  // Form list of active confirmed explicit choices
  const activeChoices = [];
  if (style) activeChoices.push({ type: 'style', label: style, stage: 'settings' });
  if (language) activeChoices.push({ type: 'language', label: language, stage: 'settings' });
  if (duration) activeChoices.push({ type: 'duration', label: duration, stage: 'settings' });
  if (platform) activeChoices.push({ type: 'platform', label: platform, stage: 'settings' });
  if (idea) activeChoices.push({ type: 'idea', label: idea, prefix: 'Idea', stage: 'idea' });
  if (opening) activeChoices.push({ type: 'opening', label: opening, prefix: 'Opening', stage: 'opening' });

  // STRICT RULE: If zero explicit choices, hide the entire strip!
  if (activeChoices.length === 0) return null;

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      padding: '8px 12px',
      marginBottom: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Layers size={12} />
          <span>Your Choices:</span>
        </span>

        {activeChoices.map((item, idx) => (
          <React.Fragment key={item.type}>
            <button
              type="button"
              onClick={() => onNavigateStage && onNavigateStage(item.stage)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 6,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: 11,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={`Click to edit ${item.prefix || item.type}`}
            >
              {item.prefix && <span style={{ color: 'var(--text-tertiary)' }}>{item.prefix}:</span>}
              <strong style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </strong>
            </button>
            {idx < activeChoices.length - 1 && (
              <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>·</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {hasStaleWarning && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#eab308' }}>
          <AlertCircle size={13} />
          <span>Changing this will update the video.</span>
          <button
            type="button"
            onClick={onApplyUpdate}
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: 11,
              fontWeight: 700,
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
}) {
  const [hasInitialBrand, setHasInitialBrand] = useState(() => Boolean(userContext.businessName?.trim()));
  const [isEditingExisting, setIsEditingExisting] = useState(() => !Boolean(userContext.businessName?.trim()));
  const [showOptionalFields, setShowOptionalFields] = useState(
    Boolean(userContext.specialty || userContext.offer)
  );
  const [errorMsg, setErrorMsg] = useState('');

  // When businessName is cleared (e.g. via reset brand), immediately reveal fresh input form
  React.useEffect(() => {
    if (!userContext.businessName?.trim()) {
      setHasInitialBrand(false);
      setIsEditingExisting(true);
    }
  }, [userContext.businessName]);

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
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Tell us about your business
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          We'll use this to understand your market and craft relevant commercial ideas.
        </p>
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
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 2 }}>
              Current Brand
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Using {userContext.businessName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {userContext.businessType}{userContext.town ? ` · ${userContext.town}` : ''}
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
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
              placeholder="e.g. Kanti Sweets"
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              City / Location <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Website / Social Link <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <input
              type="url"
              value={userContext.websiteUrl || ''}
              onChange={(e) => updateUserContext('websiteUrl', e.target.value)}
              placeholder="e.g. https://kantisweets.com"
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

          {/* Optional: Add product or offer toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: 0
              }}
            >
              {showOptionalFields ? <ChevronUp size={14} /> : <Plus size={14} />}
              <span>{showOptionalFields ? 'Hide product or offer' : 'Add product or offer (optional)'}</span>
            </button>

            {showOptionalFields && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 4 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Featured Product / Service
                  </label>
                  <input
                    type="text"
                    value={userContext.specialty || ''}
                    onChange={(e) => updateUserContext('specialty', e.target.value)}
                    placeholder="e.g. Pure Desi Ghee Festive Hampers"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--border-default)',
                      fontSize: 12,
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Special Offer / Promotion
                  </label>
                  <input
                    type="text"
                    value={userContext.offer || ''}
                    onChange={(e) => updateUserContext('offer', e.target.value)}
                    placeholder="e.g. Flat 15% discount on corporate pre-orders"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--border-default)',
                      fontSize: 12,
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>
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
            borderRadius: 8,
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 10px var(--accent-glow)'
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
}) {
  const [errorMsg, setErrorMsg] = useState('');

  const SUGGESTION_CHIPS = [
    { label: '🎁 Offer', starter: 'Announce a special limited-time festive discount: ' },
    { label: '📦 Product', starter: 'Showcase our signature handcrafted collection: ' },
    { label: '💡 New idea', starter: 'Share a helpful insider secret about choosing quality: ' },
    { label: '😩 Customer problem', starter: 'Show how to avoid the frustration of poor fittings: ' },
    { label: '📣 Announcement', starter: 'Announce guaranteed same-day delivery for urgent orders: ' },
  ];

  const handleApplySuggestion = (starter) => {
    const current = userContext.brief || '';
    if (!current.trim()) {
      updateUserContext('brief', starter);
    } else {
      updateUserContext('brief', `${current.trim()} — ${starter}`);
    }
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
      {/* Title & Short Explanation */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          What do you want this video to say?
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          Tell us what you want to promote, explain, announce or show. Write it in your own words.
        </p>
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
            rows={5}
            value={userContext.brief || ''}
            onChange={(e) => {
              updateUserContext('brief', e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder={`e.g. Show fresh pure desi ghee sweets being packed into premium festive gift hampers. Mention same-day delivery for corporate orders.`}
            style={{
              width: '100%',
              padding: '14px 16px',
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
          <button
            type="button"
            onClick={toggleRecording}
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 20,
              backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-surface)',
              border: isRecording ? '1px solid var(--error)' : '1px solid var(--border-default)',
              color: isRecording ? 'var(--error)' : 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title={isRecording ? 'Stop recording' : 'Dictate your brief'}
          >
            {isRecording ? <MicOff size={13} /> : <Mic size={13} />}
            <span>{isRecording ? 'Listening…' : 'Dictate'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)' }}>
          <span>Be direct and natural — the AI shapes this into visual scenes.</span>
          <span>{charCount} characters</span>
        </div>

        {/* Small Visual Suggestion Cards */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            Need inspiration? Try starting with:
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySuggestion(chip.starter)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 11,
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
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 6 }}>
                Ideas for your business category:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {briefSuggestions.slice(0, 3).map((sug, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => updateUserContext('brief', sug)}
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
                    💡 {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Image Upload (Optional) */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={15} style={{ color: 'var(--accent-primary)' }} />
              <span>Product Image (Optional)</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Upload a clear photo of your product or packaging so the video features your exact item.
            </p>
          </div>
          {userContext.productPhoto && (
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 12,
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              color: 'var(--success)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              <CheckCircle2 size={12} />
              Attached
            </span>
          )}
        </div>

        {userContext.productPhoto ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            padding: '10px 14px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {(userContext.productPhoto.previewUrl || userContext.productPhoto.data) && (
                <img
                  src={userContext.productPhoto.previewUrl || `data:${userContext.productPhoto.mime || 'image/jpeg'};base64,${userContext.productPhoto.data}`}
                  alt="Product preview"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    objectFit: 'cover',
                    border: '1px solid var(--border-subtle)'
                  }}
                />
              )}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userContext.productPhoto.name || 'Product photo'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  Ready for video production
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{
                padding: '6px 12px',
                borderRadius: 6,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <Upload size={12} />
                <span>Change</span>
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
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--error)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '18px 16px',
            borderRadius: 8,
            border: '2px dashed var(--border-default)',
            backgroundColor: 'var(--bg-elevated)',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
            textAlign: 'center'
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-subtle)'
            }}>
              <Upload size={14} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                Click to upload product photo (Optional)
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                PNG, JPG or WEBP · up to 10MB
              </div>
            </div>
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

      {/* Subtle Background Research Status Strip */}
      {isResearching && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 8,
          backgroundColor: 'var(--bg-surface)',
          border: '1px dashed var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          color: 'var(--text-secondary)'
        }}>
          <Sparkles size={13} className="icon-spinner" style={{ color: 'var(--accent-primary)' }} />
          <span>Looking into your brand and category in the background…</span>
        </div>
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
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={11} style={{ color: 'var(--accent-primary)' }} />
            <span>Market Context (Background)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
            {researchData.audienceInsight && (
              <div><strong>Audience:</strong> {researchData.audienceInsight}</div>
            )}
            {researchData.creativeOpportunity && (
              <div><strong>Opportunity:</strong> {researchData.creativeOpportunity}</div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
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
            borderRadius: 8,
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 10px var(--accent-glow)'
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
  onDurationChange,
  onContinue,
  onBack,
}) {
  const LANGUAGES = [
    'English', 'Hindi', 'Hinglish', 'Marathi',
    'Tamil', 'Telugu', 'Bengali', 'Gujarati',
    'Kannada', 'Malayalam', 'Punjabi'
  ];

  const PLATFORMS = [
    { id: 'Instagram Reels / 9:16', label: 'Instagram' },
    { id: 'YouTube Shorts / 9:16', label: 'YouTube' },
    { id: 'Facebook Video / 9:16', label: 'Facebook' },
    { id: 'WhatsApp Status / 9:16', label: 'WhatsApp' },
    { id: 'Other / 9:16', label: 'Other' },
  ];

  const DURATIONS = ['15s', '20s', '30s'];

  const STYLES = [
    {
      id: 'UGC / Creator-style',
      label: 'UGC',
      icon: '📱',
      tagline: 'Feels like a real person made it.',
      detail: 'Direct-to-camera, creator rhythm & natural mobile energy',
      recommended: true,
    },
    {
      id: 'Storytelling',
      label: 'Story',
      icon: '🎬',
      tagline: 'A short story with people.',
      detail: '2-character relatable dilemma & emotional payoff',
      recommended: false,
    },
    {
      id: 'Product Demo',
      label: 'Product Demo',
      icon: '📦',
      tagline: 'Show the product in action.',
      detail: 'Hands-on tactile textures & clear visual proof',
      recommended: false,
    },
    {
      id: 'Situational Comedy',
      label: 'Funny',
      icon: '😄',
      tagline: 'Setup, funny moment, payoff.',
      detail: 'Witty relatable problem, playful banter & comic punchline',
      recommended: false,
    },
  ];

  const currentLang = userContext.language || 'English';
  const currentDuration = userContext.targetDuration || '20s';
  const currentStyle = userContext.creativeStyle || 'UGC / Creator-style';
  const currentPlatform = userContext.platform || 'Instagram Reels / 9:16';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Title & Short Explanation */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          How should we make the video?
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          Set your language, platform, duration, and the creative feeling for the film.
        </p>
      </div>

      {/* Settings Container */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
      }}>
        {/* 1. Language */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
            1. Language
          </label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {LANGUAGES.map((lang) => {
              const isSelected = currentLang === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    if (onLanguageChange) onLanguageChange(lang);
                    else updateUserContext('language', lang);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Platform & Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {/* Platform */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
              2. Platform
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PLATFORMS.map((plat) => {
                const isSelected = currentPlatform === plat.id;
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => {
                      if (onPlatformChange) onPlatformChange(plat.label, plat.id);
                      else updateUserContext('platform', plat.id);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    {plat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
              3. Duration
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {DURATIONS.map((dur) => {
                const isSelected = currentDuration === dur;
                return (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => {
                      if (onDurationChange) onDurationChange(dur);
                      else updateUserContext('targetDuration', dur);
                    }}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    {dur}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Style ("How should it feel?") */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
              4. How should it feel?
            </label>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              Sets the story architecture and pacing
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {STYLES.map((st) => {
              const isSelected = currentStyle === st.id ||
                (st.id.includes('UGC') && currentStyle.includes('UGC')) ||
                (st.id.includes('Comedy') && currentStyle.includes('Comedy'));

              return (
                <div
                  key={st.id}
                  onClick={() => {
                    if (onStyleChange) onStyleChange(st.id, st.label);
                    else updateUserContext('creativeStyle', st.id);
                  }}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                    borderRadius: 10,
                    padding: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    position: 'relative',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{st.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {st.label}
                      </span>
                    </div>
                    {st.recommended && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--accent-primary)',
                        letterSpacing: '0.04em'
                      }}>
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    "{st.tagline}"
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
                    {st.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Product Image Asset (Optional) */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={13} style={{ color: 'var(--accent-primary)' }} />
              <span>5. Product Asset (Optional)</span>
            </label>
            {userContext.productPhoto && (
              <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} />
                Attached
              </span>
            )}
          </div>

          {userContext.productPhoto ? (
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
                {(userContext.productPhoto.previewUrl || userContext.productPhoto.data) && (
                  <img
                    src={userContext.productPhoto.previewUrl || `data:${userContext.productPhoto.mime || 'image/jpeg'};base64,${userContext.productPhoto.data}`}
                    alt="Product"
                    style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border-subtle)' }}
                  />
                )}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userContext.productPhoto.name || 'Product photo'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                    Attached for video production
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Upload size={11} />
                  <span>Change</span>
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
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--error)',
                    fontSize: 11,
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
              color: 'var(--accent-primary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'border-color 0.15s ease'
            }}>
              <Upload size={13} />
              <span>Upload product photo (Optional)</span>
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
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
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
            borderRadius: 8,
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 10px var(--accent-glow)'
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
}) {
  const [showCustomIdeaInput, setShowCustomIdeaInput] = useState(Boolean(customDirection));

  const handleSelectIdea = (dir) => {
    setSelectedDirection(dir);
    setCustomDirection('');
  };

  const activeIdea = selectedDirection || (customDirection ? { title: customDirection, description: customDirection } : directionsList[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Short Explanation */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Let's find the idea
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          Here are a few ways we could tell your story. Pick the one that fits your brand best.
        </p>
      </div>

      {/* Loading State */}
      {isLoadingDirections ? (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px dashed var(--accent-primary)',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}>
          <Sparkles size={24} className="icon-spinner" style={{ color: 'var(--accent-primary)' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Finding a few strong ideas…
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Exploring creative angles tailored to your brief.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* ~3 Idea Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {directionsList.map((dir, idx) => {
              const isSelected = selectedDirection?.id === dir.id;
              const icons = ['🎁', '📱', '🚚', '💡', '✨'];
              const icon = icons[idx % icons.length];

              return (
                <div
                  key={dir.id || idx}
                  onClick={() => handleSelectIdea(dir)}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    {dir.recommended && (
                      <span style={{
                        fontSize: 9,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--accent-primary)',
                        letterSpacing: '0.04em'
                      }}>
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {dir.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {dir.description || dir.angle}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Idea */}
          <div>
            {!showCustomIdeaInput ? (
              <button
                type="button"
                onClick={() => setShowCustomIdeaInput(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Plus size={14} />
                <span>+ I have my own idea</span>
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
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>
                  Tell us your idea
                </label>
                <input
                  type="text"
                  value={customDirection}
                  onChange={(e) => {
                    setCustomDirection(e.target.value);
                    if (selectedDirection) setSelectedDirection(null);
                  }}
                  placeholder="e.g. Show corporate managers scrambling for Diwali gifts until finding same-day hampers"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-default)',
                    fontSize: 12,
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
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
            borderRadius: 8,
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: isLoadingDirections ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 10px var(--accent-glow)'
          }}
        >
          <span>Use this idea</span>
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
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          How should we start?
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          The first few seconds matter. Pick an opening that feels right for your film.
        </p>
      </div>

      {/* Loading State */}
      {isLoadingHooks ? (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px dashed var(--accent-primary)',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}>
          <Sparkles size={24} className="icon-spinner" style={{ color: 'var(--accent-primary)' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Finding the best ways to start…
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Generating high-converting openings tuned to your style and audience.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 5-6 Visual Opening Options */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            {hooksList.map((hk, idx) => {
              const isSelected = selectedHook?.id === hk.id;
              const isEditing = editingHookId === hk.id;
              const icons = ['📱', '🎁', '😮', '💬', '⚡', '👀'];
              const icon = icons[idx % icons.length];

              return (
                <div
                  key={hk.id || idx}
                  onClick={() => !isEditing && handleSelectHook(hk)}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
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
                      <span>{icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-primary)' }}>
                        {hk.archetype || hk.type || 'Opening'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {hk.recommended && (
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 4, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)' }}>
                          TOP PICK
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditing) {
                            hk.hookLine = editLineText;
                            setEditingHookId(null);
                          } else {
                            setEditLineText(hk.hookLine || hk.text || '');
                            setEditingHookId(hk.id);
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
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
                      style={{ padding: '6px 8px', fontSize: 12, borderRadius: 4, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                    />
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
                      "{hk.hookLine || hk.text}"
                    </div>
                  )}

                  {hk.visualAction && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
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
                  color: 'var(--accent-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Plus size={14} />
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
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>
                  Your opening line or action
                </label>
                <input
                  type="text"
                  value={customHook}
                  onChange={(e) => {
                    setCustomHook(e.target.value);
                    if (selectedHook) setSelectedHook(null);
                  }}
                  placeholder="e.g. Wait, did you forget to order festive gift boxes again?!"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border-default)',
                    fontSize: 12,
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
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
            borderRadius: 8,
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: isLoadingHooks ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 10px var(--accent-glow)'
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
 * 8. SCREEN 06 — STORY
 */
export function Screen06Story({
  storyWorldData = null,
  setStoryWorldData,
  userContext = {},
  updateUserContext,
  isLoadingStory = false,
  constraintsList = [],
  setConstraintsList,
  avoidList = [],
  setAvoidList,
  onContinue,
  onBack,
  isBusy = false,
}) {
  const [editingCard, setEditingCard] = useState(null);
  const [editLeadName, setEditLeadName] = useState('');
  const [editLeadRole, setEditLeadRole] = useState('');
  const [editSuppName, setEditSuppName] = useState('');
  const [editSuppRole, setEditSuppRole] = useState('');
  const [editSettingName, setEditSettingName] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [isCustomizeExpanded, setIsCustomizeExpanded] = useState(false);
  const [newConstraint, setNewConstraint] = useState('');
  const [newAvoid, setNewAvoid] = useState('');

  const beats = storyWorldData?.beats || [];
  const beatStages = [
    { key: 'START', label: 'START', color: '#3b82f6' },
    { key: 'SHOW', label: 'SHOW', color: '#8b5cf6' },
    { key: 'MOMENT', label: 'MOMENT', color: '#ec4899' },
    { key: 'END', label: 'END', color: '#10b981' },
  ];

  const dur = parseInt(userContext.targetDuration, 10) || 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Short Explanation */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Here's your story
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          This is how the video will unfold from the first second to the final call to action.
        </p>
      </div>

      {isLoadingStory ? (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px dashed var(--accent-primary)',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12
        }}>
          <Sparkles size={24} className="icon-spinner" style={{ color: 'var(--accent-primary)' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Building your story…
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Arranging visual flow and pacing around your brief.
          </div>
        </div>
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
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Your Story Flow</span>
              <span style={{ fontSize: 10, textTransform: 'none', color: 'var(--accent-primary)', fontWeight: 600 }}>
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
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 4,
                        backgroundColor: 'var(--bg-surface)',
                        color: st.color,
                        fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        {st.label} ({timingLabel})
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>
                        0{idx + 1}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {b.title || `Part ${idx + 1}`}
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      {b.action || 'Visual action unfolding here.'}
                    </div>

                    {b.dialogue && (
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: 2, paddingTop: 4, borderTop: '1px dashed var(--border-subtle)' }}>
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
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
              People & Setting
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {/* Lead */}
              <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)' }}>👩 Main person</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingCard === 'lead') {
                        setStoryWorldData((prev) => ({
                          ...prev,
                          character1: { ...prev?.character1, name: editLeadName || 'Lead', role: editLeadRole || 'Host' }
                        }));
                        setEditingCard(null);
                      } else {
                        setEditLeadName(storyWorldData?.character1?.name || 'Lead');
                        setEditLeadRole(storyWorldData?.character1?.role || 'Host');
                        setEditingCard('lead');
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    {editingCard === 'lead' ? 'Save' : '[Edit]'}
                  </button>
                </div>
                {editingCard === 'lead' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input type="text" value={editLeadName} onChange={(e) => setEditLeadName(e.target.value)} placeholder="Name" style={{ padding: '3px 6px', fontSize: 11 }} />
                    <input type="text" value={editLeadRole} onChange={(e) => setEditLeadRole(e.target.value)} placeholder="Role" style={{ padding: '3px 6px', fontSize: 11 }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {storyWorldData?.character1?.name ? `${storyWorldData.character1.name} · ${storyWorldData.character1.role || 'Host'}` : (userContext.leadCharacter || 'Creator')}
                  </div>
                )}
              </div>

              {/* Supporting */}
              <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)' }}>👨 Other person</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingCard === 'supp') {
                        setStoryWorldData((prev) => ({
                          ...prev,
                          character2: { ...prev?.character2, name: editSuppName || 'Supporting', role: editSuppRole || 'Partner' }
                        }));
                        setEditingCard(null);
                      } else {
                        setEditSuppName(storyWorldData?.character2?.name || 'Supporting');
                        setEditSuppRole(storyWorldData?.character2?.role || 'Partner');
                        setEditingCard('supp');
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    {editingCard === 'supp' ? 'Save' : '[Edit]'}
                  </button>
                </div>
                {editingCard === 'supp' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input type="text" value={editSuppName} onChange={(e) => setEditSuppName(e.target.value)} placeholder="Name" style={{ padding: '3px 6px', fontSize: 11 }} />
                    <input type="text" value={editSuppRole} onChange={(e) => setEditSuppRole(e.target.value)} placeholder="Role" style={{ padding: '3px 6px', fontSize: 11 }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {storyWorldData?.character2?.name ? `${storyWorldData.character2.name} · ${storyWorldData.character2.role || 'Partner'}` : (userContext.supportingCharacter || 'Customer')}
                  </div>
                )}
              </div>

              {/* Setting */}
              <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)' }}>🏠 Place</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingCard === 'place') {
                        setStoryWorldData((prev) => ({
                          ...prev,
                          setting: editSettingName,
                          location: { ...(prev?.location || {}), name: editSettingName }
                        }));
                        setEditingCard(null);
                      } else {
                        setEditSettingName(storyWorldData?.location?.name || storyWorldData?.setting || 'Store Setting');
                        setEditingCard('place');
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    {editingCard === 'place' ? 'Save' : '[Edit]'}
                  </button>
                </div>
                {editingCard === 'place' ? (
                  <input type="text" value={editSettingName} onChange={(e) => setEditSettingName(e.target.value)} style={{ width: '100%', padding: '3px 6px', fontSize: 11 }} />
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {storyWorldData?.location?.name || storyWorldData?.setting?.slice(0, 30) || `${userContext.businessName || 'Store'} Setting`}
                  </div>
                )}
              </div>

              {/* Product */}
              <div style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)' }}>🎁 Product</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingCard === 'prod') {
                        setStoryWorldData((prev) => ({ ...prev, product: editProductName }));
                        setEditingCard(null);
                      } else {
                        setEditProductName(storyWorldData?.product || userContext.brief?.slice(0, 30) || 'Featured Product');
                        setEditingCard('prod');
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 10, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    {editingCard === 'prod' ? 'Save' : '[Edit]'}
                  </button>
                </div>
                {editingCard === 'prod' ? (
                  <input type="text" value={editProductName} onChange={(e) => setEditProductName(e.target.value)} style={{ width: '100%', padding: '3px 6px', fontSize: 11 }} />
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {storyWorldData?.product || userContext.brief?.slice(0, 30) || `${userContext.businessName} items`}
                  </div>
                )}
              </div>
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
              <span>Customize details (Optional)</span>
              {isCustomizeExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isCustomizeExpanded && (
              <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Things to include */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Things to include
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
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
                      value={newConstraint}
                      onChange={(e) => setNewConstraint(e.target.value)}
                      placeholder="e.g. mention WhatsApp order number"
                      style={{ flex: 1, padding: '6px 8px', fontSize: 11 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newConstraint.trim()) {
                          setConstraintsList([...constraintsList, newConstraint.trim()]);
                          setNewConstraint('');
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newConstraint.trim()) {
                          setConstraintsList([...constraintsList, newConstraint.trim()]);
                          setNewConstraint('');
                        }
                      }}
                      style={{ padding: '6px 12px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-default)', cursor: 'pointer' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Things to avoid */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Things to avoid
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
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
                      value={newAvoid}
                      onChange={(e) => setNewAvoid(e.target.value)}
                      placeholder="e.g. no loud shouting, no dance steps"
                      style={{ flex: 1, padding: '6px 8px', fontSize: 11 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newAvoid.trim()) {
                          setAvoidList([...avoidList, newAvoid.trim()]);
                          setNewAvoid('');
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newAvoid.trim()) {
                          setAvoidList([...avoidList, newAvoid.trim()]);
                          setNewAvoid('');
                        }
                      }}
                      style={{ padding: '6px 12px', fontSize: 11, borderRadius: 4, border: '1px solid var(--border-default)', cursor: 'pointer' }}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
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
          onClick={onContinue}
          style={{
            padding: '12px 28px',
            borderRadius: 8,
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: isBusy || isLoadingStory ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 10px var(--accent-glow)'
          }}
        >
          {isBusy && <RefreshCw size={14} className="icon-spinner" />}
          <span>{isBusy ? 'Writing and polishing your script…' : 'Continue to Script →'}</span>
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
  character1 = '',
  character2 = '',
  userContext = {},
  onApproveScript,
  onBack,
  onTryAnotherVersion,
  onOpenRewriteModal,
  isBusy = false,
}) {
  const [editingSceneIdx, setEditingSceneIdx] = useState(null);
  const [editSceneText, setEditSceneText] = useState('');

  const cleanStyle = (userContext.creativeStyle || 'UGC').includes('UGC') ? 'UGC' : (userContext.creativeStyle || 'Story').includes('Demo') ? 'Product Demo' : 'Story';
  const duration = userContext.targetDuration || '20s';
  const platform = (userContext.platform || 'Instagram').split('/')[0].trim();
  const lang = userContext.language || 'English';

  const parseSceneData = (rawText, idx) => {
    // Extract dialogue and visual
    const diaMatch = rawText.match(/(?:Dialogue|Dialogue \([^)]+\)|says):\s*"?([^"\n]+)"?/i) || rawText.match(/"([^"]+)"/);
    const visMatch = rawText.match(/(?:Visual|Action):\s*([^\n]+)/i);

    return {
      title: `SCENE ${idx + 1}`,
      timing: idx === 0 ? '0–3s' : idx === 1 ? '3–8s' : idx === 2 ? '8–14s' : '14–20s',
      visual: visMatch ? visMatch[1].trim() : rawText.split('\n')[0].replace(/^SCENE\s*\d+[^:]*:\s*/i, '').trim(),
      dialogue: diaMatch ? diaMatch[1].trim() : null,
      raw: rawText
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title & Badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Here's your script
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Review the 4 scenes before we make the video.
          </p>
        </div>

        <div style={{
          padding: '4px 12px',
          borderRadius: 20,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span>{duration}</span>
          <span>·</span>
          <span>{platform}</span>
          <span>·</span>
          <span>{cleanStyle}</span>
          <span>·</span>
          <span>{lang}</span>
        </div>
      </div>

      {/* 4 Visual Scene Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {scenes.map((sceneText, idx) => {
          const s = parseSceneData(sceneText, idx);
          const isEditing = editingSceneIdx === idx;

          return (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: 'var(--accent-primary)',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    {s.title} · {s.timing}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => onOpenRewriteModal(idx, sceneText)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--accent-primary)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Sparkles size={11} />
                    <span>Improve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isEditing) {
                        const updated = [...scenes];
                        updated[idx] = editSceneText;
                        setScenes(updated);
                        setEditingSceneIdx(null);
                      } else {
                        setEditSceneText(sceneText);
                        setEditingSceneIdx(idx);
                      }
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {isEditing ? 'Save' : 'Edit'}
                  </button>
                </div>
              </div>

              {isEditing ? (
                <textarea
                  rows={4}
                  value={editSceneText}
                  onChange={(e) => setEditSceneText(e.target.value)}
                  style={{ width: '100%', padding: '8px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {s.visual}
                  </div>
                  {s.dialogue && (
                    <div style={{
                      backgroundColor: 'var(--bg-elevated)',
                      padding: '8px 12px',
                      borderRadius: 6,
                      borderLeft: '3px solid var(--accent-primary)',
                      fontSize: 12,
                      fontStyle: 'italic',
                      color: 'var(--text-primary)'
                    }}>
                      "{s.dialogue}"
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          ← Back
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            disabled={isBusy || !scenes.length}
            onClick={onApproveScript}
            style={{
              padding: '12px 28px',
              borderRadius: 8,
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 10px var(--accent-glow)'
            }}
          >
            <span>Looks good →</span>
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
  errorMessage = '',
}) {
  const [showVideoDetails, setShowVideoDetails] = useState(false);

  // Friendly rendering progress stages
  const renderStages = [
    'Preparing your video…',
    'Creating scenes…',
    'Putting everything together…',
    'Finishing your video…',
  ];

  if (isRendering) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 16,
        padding: 40,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        maxWidth: 600,
        margin: '20px auto',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--accent-primary)'
        }}>
          <Sparkles size={28} className="icon-spinner" style={{ color: 'var(--accent-primary)' }} />
        </div>

        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Making your video…
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {renderStatusText || 'Creating scenes and assembling final broadcast cut…'}
          </p>
        </div>

        <div style={{
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'var(--accent-primary)',
          backgroundColor: 'var(--bg-elevated)',
          padding: '4px 12px',
          borderRadius: 20,
          border: '1px solid var(--border-subtle)'
        }}>
          Elapsed: {elapsedTime}
        </div>

        <div style={{ width: '100%', maxWidth: 360, marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>
            Please keep this window open while the video renders.
          </div>
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
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <CheckCircle2 size={14} />
            <span>Production Complete</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
            Your video is ready!
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Watch the finished video below. Download or share directly.
          </p>
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
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            style={{ maxHeight: 480, width: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            onClick={onCreateAnother}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            Create Another Video
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={videoUrl}
              download={`${userContext.businessName || 'clevertize'}-video.mp4`}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px var(--accent-glow)'
              }}
            >
              <Download size={14} />
              <span>Download Video</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Pre-Production Review State
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
          Ready to make your video?
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          Review your creative choices before we create the final video.
        </p>
      </div>

      {errorMessage && (
        <div style={{ color: 'var(--error)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--error)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={15} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Summary Checklist */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ color: 'var(--success)', marginTop: 2 }}>✓</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>BUSINESS</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{userContext.businessName || 'Your Business'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ color: 'var(--success)', marginTop: 2 }}>✓</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>IDEA</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{creativeDNA?.direction?.title || 'Selected Idea'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ color: 'var(--success)', marginTop: 2 }}>✓</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>OPENING</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{creativeDNA?.hook?.archetype || 'Approved Opening'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ color: 'var(--success)', marginTop: 2 }}>✓</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>SCRIPT</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{scenes.length} Scenes Ready</div>
            </div>
          </div>
        </div>

        {/* Collapsible Video Details */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => setShowVideoDetails(!showVideoDetails)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: 0
            }}
          >
            <span>{showVideoDetails ? 'Hide video details' : 'Show video details'}</span>
            {showVideoDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showVideoDetails && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <div><strong>Language:</strong> {userContext.language || 'English'}</div>
              <div><strong>Platform:</strong> {userContext.platform || 'Instagram Reels'}</div>
              <div><strong>Target Duration:</strong> {userContext.targetDuration || '20s'}</div>
              <div><strong>Style:</strong> {userContext.creativeStyle || 'UGC / Creator'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
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
            borderRadius: 10,
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            border: 'none',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px var(--accent-glow)'
          }}
        >
          <span>Make Video</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
