import { getBriefSuggestions } from '../../utils/categorySuggestions.js';
import { downloadVideoWithTicket } from '../../utils/downloadVideo.js';
import React, { useState, useEffect } from 'react';
import {
  SimpleAdPackagesLoader,
  SimpleVideoProductionLoader,
} from './WorkflowLoadingScreen.jsx';
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
  Upload,
  Trash2,
  Film,
  Layers,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sliders,
  ExternalLink,
  Share2,
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
  { id: 'UGC / Creator-style', label: 'Creator / UGC', desc: 'Friendly, relatable, high trust', icon: '📱', recommended: true },
  { id: 'Product Demo', label: 'Product Showcase', desc: 'Hands-on quality demonstration', icon: '✨' },
  { id: 'Situational Comedy', label: 'Humorous & Fun', desc: 'Playful situational sketch', icon: '😄' },
  { id: 'Storytelling', label: 'Heartwarming Story', desc: 'Warm customer connection', icon: '🎬' },
];

const DIMENSION_OPTIONS = [
  { id: '9:16', label: '9:16 Vertical', desc: 'Reels / Shorts / TikTok', icon: '📱' },
  { id: '16:9', label: '16:9 Landscape', desc: 'YouTube / TV / Desktop', icon: '🖥️' },
  { id: '1:1', label: '1:1 Square', desc: 'Social Feed / Posts', icon: '⏹️' },
];

const DURATION_OPTIONS = [
  { id: '15s', label: '15s Hook', desc: 'Fast punchy ad' },
  { id: '20s', label: '20s Standard', desc: 'Commercial pacing', recommended: true },
  { id: '30s', label: '30s Extended', desc: 'Full product story' },
];

// Dynamic category suggestions are loaded inside the component via getBriefSuggestions

export default function SimpleBusinessStudio({
  businessName = 'My Business',
  businessType = 'Local Business',
  category: categoryProp,
  town = '',
  initialBrief = '',
  initialLanguage = 'English',
  initialStyle = 'UGC / Creator-style',
  initialDuration = '20s',
  initialAspectRatio = '9:16',
  brandTone = 'Warm & Authentic',
  brandLogo = null,
  onSwitchToDirectorMode,
  onProduceVideo, // (packageData) => Promise<videoUrl>
  onSaveProject,
  onEditBrand,
  isProducingVideo = false,
  isSavingProject = false,
  isProjectSaved = false,
  producedVideoUrl = null,
  videoRunError = null,
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
  const [step, setStep] = useState(1);

  // Step 1 Form state
  const [brief, setBrief] = useState(initialBrief || '');
  const [language, setLanguage] = useState(initialLanguage || 'English');
  const [creativeStyle, setCreativeStyle] = useState(initialStyle || 'UGC / Creator-style');
  const [duration, setDuration] = useState(initialDuration || '30s');
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio || '9:16');
  const [productPhoto, setProductPhoto] = useState(null);
  const [charCount, setCharCount] = useState(brief.length);

  // Step 2 Packages state
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [expandedPackageId, setExpandedPackageId] = useState(null);
  const [loadError, setLoadError] = useState('');

  // Step 3 / Script copy state
  const [copiedScript, setCopiedScript] = useState(false);
  const [editableDialogue, setEditableDialogue] = useState({});

  useEffect(() => {
    setCharCount(brief.length);
  }, [brief]);

  const handleApplyTemplate = (tpl) => {
    setBrief(tpl);
  };

  const handlePhotoUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setProductPhoto({
        name: file.name,
        previewUrl: e.target.result,
        data: e.target.result.split(',')[1],
        mime: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGeneratePackages = async () => {
    if (!brief.trim()) {
      setLoadError('Please enter what you want to promote (e.g. a discount, offer, or service).');
      return;
    }

    setLoadError('');
    setIsLoadingPackages(true);

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
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate ad scripts.');
      }

      const data = await res.json();
      if (Array.isArray(data.packages) && data.packages.length > 0) {
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
                  fontWeight: isCurrent ? 700 : isCompleted ? 600 : 500,
                  color: isCurrent
                    ? 'var(--accent-primary)'
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
                  }}
                >
                  {isCompleted && !isCurrent ? <Check size={10} strokeWidth={3} /> : s.num}
                </span>
                <span>{s.label}</span>
              </button>
              {idx < 2 && (
                <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>›</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ACTIVE BRAND BANNER */}
      {businessName && (
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
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
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
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Creating Video For
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {businessName}
                </span>
                {businessType && (
                  <span
                    style={{
                      fontSize: 11,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {businessType}
                  </span>
                )}
                {town && (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>· {town}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--accent-primary)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: '4px 10px',
                borderRadius: 6,
                fontWeight: 700,
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

      {/* ========================================================
          STEP 1: YOUR OFFER & PROMOTION
      ======================================================== */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {isLoadingPackages ? (
            <SimpleAdPackagesLoader
              businessName={businessName}
              category={category}
              statusText="Writing 3 Ad Scripts..."
            />
          ) : (
            <>
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 14,
                  padding: 24,
                }}
              >
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              What would you like to promote?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Enter your deal, discount, or announcement. CleverCut will write 3 ready-to-produce commercial script concepts.
            </p>

            {/* Quick Inspiration Pills */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-tertiary)',
                  marginBottom: 8,
                }}
              >
                Quick Ideas for {businessName}:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {quickIdeas.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
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
            </div>

            {/* Textarea */}
            <div style={{ position: 'relative' }}>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder={dynamicPlaceholder}
                rows={4}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px',
                  borderRadius: 10,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: 6,
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                }}
              >
                {charCount} characters
              </div>
            </div>

            {/* Language & Style Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginTop: 18 }}>
              {/* Language */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-tertiary)',
                    marginBottom: 8,
                  }}
                >
                  Ad Language
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {POPULAR_LANGUAGES.map((lang) => {
                    const isSelected = language === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setLanguage(lang)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                        }}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Style */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-tertiary)',
                    marginBottom: 8,
                  }}
                >
                  Video Format
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {AD_STYLES.map((st) => {
                    const isSelected = creativeStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setCreativeStyle(st.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 8,
                          backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                          border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{st.icon}</span>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {st.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Video Dimension & Duration Selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginTop: 18 }}>
              {/* Video Dimension */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    Video Dimension
                  </label>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                    {aspectRatio === '16:9' ? 'Landscape (YouTube)' : aspectRatio === '1:1' ? 'Square (Feed)' : 'Vertical (Reels/Shorts)'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {DIMENSION_OPTIONS.map((dim) => {
                    const isSelected = aspectRatio === dim.id;
                    return (
                      <button
                        key={dim.id}
                        type="button"
                        onClick={() => setAspectRatio(dim.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          padding: '10px 6px',
                          borderRadius: 8,
                          backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                          border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{dim.icon}</span>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {dim.label}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                          {dim.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Video Length / Duration */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    Video Length
                  </label>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                    Target run-time
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {DURATION_OPTIONS.map((dur) => {
                    const isSelected = duration === dur.id;
                    return (
                      <button
                        key={dur.id}
                        type="button"
                        onClick={() => setDuration(dur.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          padding: '10px 6px',
                          borderRadius: 8,
                          backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                          border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          ⏱️ {dur.label}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                          {dur.desc}
                        </div>
                        {dur.recommended && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: isSelected ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                              backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                              padding: '1px 5px',
                              borderRadius: 4,
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

            {/* Optional Product Photo Upload */}
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Product or Store Photo <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>(Optional)</span>
                </label>
                {productPhoto && (
                  <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={12} />
                    Attached
                  </span>
                )}
              </div>

              {productPhoto ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={productPhoto.previewUrl}
                      alt="Product"
                      style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {productPhoto.name || 'Product photo'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductPhoto(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--error)',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px dashed var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Upload size={14} />
                  <span>Attach a photo of your product or storefront</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhotoUpload(f);
                    }}
                  />
                </label>
              )}
            </div>

            {loadError && (
              <div
                style={{
                  marginTop: 16,
                  padding: '10px 14px',
                  borderRadius: 8,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  fontSize: 12,
                }}
              >
                {loadError}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              disabled={isLoadingPackages || !brief.trim()}
              onClick={handleGeneratePackages}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 28px',
                borderRadius: 10,
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                cursor: isLoadingPackages || !brief.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoadingPackages || !brief.trim() ? 0.6 : 1,
                boxShadow: '0 4px 16px var(--accent-glow)',
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkles size={15} />
              <span>Generate 3 Ad Scripts ➔</span>
            </button>
          </div>
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
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              Choose Your Ad Script
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Select the script angle that best fits your campaign. Once chosen, CleverCut will film and produce the complete video ad.
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
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
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
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '3px 8px',
                          borderRadius: 4,
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'rgba(99, 102, 241, 0.15)',
                          color: isSelected ? '#FFFFFF' : 'var(--accent-primary)',
                        }}
                      >
                        {pkg.badge || `Ad Concept ${idx + 1}`}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                        {pkg.angle}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                        ⏱️ {pkg.duration || duration}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                        📐 {pkg.aspectRatio || aspectRatio}
                      </span>
                    </div>

                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: isSelected ? '6px solid var(--accent-primary)' : '2px solid var(--border-default)',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  </div>

                  {/* Title & Hook Headline */}
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
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
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: 2 }}>
                      Opening Hook (First 3 Seconds):
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                      "{pkg.hookHeadline}"
                    </div>
                  </div>

                  {/* Narrative Summary */}
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.45 }}>
                    {pkg.narrativeSummary}
                  </p>

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
                        color: 'var(--accent-primary)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>{isExpanded ? 'Hide Scene Details' : 'Preview All 4 Scenes'}</span>
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
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                Scene {sc.sceneNumber || sIdx + 1} · {sc.beat}
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{sc.timing}</span>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
                              🎬 {sc.visual}
                            </div>
                            {sc.dialogue && (
                              <div style={{ color: 'var(--accent-primary)', fontWeight: 600, fontStyle: 'italic' }}>
                                💬 {sc.dialogue}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
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
              <ArrowLeft size={14} />
              <span>Back to Offer</span>
            </button>

            <button
              type="button"
              onClick={handleStartProduction}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 28px',
                borderRadius: 10,
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px var(--accent-glow)',
              }}
            >
              <Play size={15} fill="#FFFFFF" />
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
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              padding: 24,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 700, fontSize: 14 }}>
                  <CheckCircle2 size={18} />
                  <span>Your Commercial Video Is Ready!</span>
                </div>

                {/* Video Player */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: 420,
                    borderRadius: 12,
                    overflow: 'hidden',
                    backgroundColor: '#000000',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  <video
                    src={producedVideoUrl}
                    controls
                    autoPlay
                    loop
                    style={{ width: '100%', display: 'block', maxHeight: 520, objectFit: 'contain' }}
                  />
                </div>

                {/* Video Actions */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
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
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 22px',
                      borderRadius: 8,
                      backgroundColor: 'var(--accent-primary)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px var(--accent-glow)',
                    }}
                  >
                    <Download size={14} />
                    <span>Download Video (MP4)</span>
                  </button>

                  {onSaveProject && (
                    <button
                      type="button"
                      onClick={() => onSaveProject(selectedPackage)}
                      disabled={isSavingProject}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 18px',
                        borderRadius: 8,
                        backgroundColor: isProjectSaved ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-elevated)',
                        border: `1px solid ${isProjectSaved ? 'var(--success)' : 'var(--border-default)'}`,
                        color: isProjectSaved ? 'var(--success)' : 'var(--text-primary)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: isSavingProject ? 'not-allowed' : 'pointer',
                        opacity: isSavingProject ? 0.7 : 1,
                      }}
                    >
                      {isProjectSaved ? <Check size={14} /> : <CheckCircle2 size={14} />}
                      <span>{isSavingProject ? 'Saving...' : isProjectSaved ? 'Saved to Library' : 'Save Project'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyScriptText}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 18px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
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
            ) : videoRunError ? (
              <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ color: '#EF4444', fontSize: 16, fontWeight: 700 }}>
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
                      borderRadius: 8,
                      backgroundColor: 'var(--accent-primary)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Retry Generation
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
                    Copy Script Text
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
                    borderRadius: 10,
                    backgroundColor: 'var(--accent-primary)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Click to Start Video Production
                </button>
              </div>
            )}
          </div>

          {/* Create Another Ad / Restart */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} />
              <span>Create Another Video Ad</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
