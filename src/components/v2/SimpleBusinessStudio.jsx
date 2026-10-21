import React, { useState, useEffect } from 'react';
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

const QUICK_OFFER_TEMPLATES = [
  'Diwali 20% discount on all services and free consultation',
  'Special festive package with same-day delivery guaranteed',
  'Buy 1 Get 1 free celebration weekend deal',
  'First-time customer welcome offer: flat 15% off',
  'Monsoon protection and maintenance checkup',
];

export default function SimpleBusinessStudio({
  businessName = 'My Business',
  businessType = 'Local Business',
  town = '',
  initialBrief = '',
  initialLanguage = 'English',
  initialStyle = 'UGC / Creator-style',
  brandLogo = null,
  onSwitchToDirectorMode,
  onProduceVideo, // (packageData) => Promise<videoUrl>
  onSaveProject,
  isProducingVideo = false,
  producedVideoUrl = null,
  videoRunError = null,
}) {
  // 3 Steps:
  // 1: 'offer' (Input promotion details)
  // 2: 'choose' (Pick from 3 generated complete ad packages)
  // 3: 'produce' (Video production, player, download)
  const [step, setStep] = useState(1);

  // Step 1 Form state
  const [brief, setBrief] = useState(initialBrief || '');
  const [language, setLanguage] = useState(initialLanguage || 'English');
  const [creativeStyle, setCreativeStyle] = useState(initialStyle || 'UGC / Creator-style');
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
      const res = await fetch('/api/creative/simple-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          businessType,
          town,
          brief: brief.trim(),
          language,
          creativeStyle,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate ad packages.');
      }

      const data = await res.json();
      if (Array.isArray(data.packages) && data.packages.length > 0) {
        setPackages(data.packages);
        setSelectedPackageId(data.packages[0].id);
        setStep(2);
      } else {
        throw new Error('No ad packages were generated. Please try again.');
      }
    } catch (err) {
      console.error('[SimpleStudio] generation error:', err.message);
      setLoadError(err.message || 'Error creating video ads. Please try again.');
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const selectedPackage = packages.find((p) => p.id === selectedPackageId) || packages[0];

  const handleStartProduction = async () => {
    if (!selectedPackage) return;
    setStep(3);
    if (onProduceVideo) {
      onProduceVideo({
        ...selectedPackage,
        productPhoto,
        brief,
        language,
        creativeStyle,
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
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px 20px 60px' }}>
      {/* Top Bar: Mode Switcher & Active Business */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 14,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Store size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {businessName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {businessType} {town ? `· ${town}` : ''}
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            backgroundColor: 'var(--bg-elevated)',
            padding: '3px 4px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              backgroundColor: 'var(--accent-primary)',
              color: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            <Zap size={12} />
            <span>Simple Studio</span>
          </div>

          <button
            type="button"
            onClick={onSwitchToDirectorMode}
            title="Switch to Advanced 7-Stage Director Mode"
            style={{
              background: 'none',
              border: 'none',
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <Sliders size={12} />
            <span>Director Mode</span>
          </button>
        </div>
      </div>

      {/* 3-Step Progress Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { num: 1, label: 'Your Offer' },
          { num: 2, label: 'Pick Video Ad' },
          { num: 3, label: 'Generate Video' },
        ].map((s) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div
              key={s.num}
              onClick={() => {
                if (isDone) setStep(s.num);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 16px',
                borderRadius: 20,
                backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                border: isActive
                  ? '1px solid var(--accent-primary)'
                  : isDone
                  ? '1px solid var(--border-default)'
                  : '1px solid transparent',
                cursor: isDone ? 'pointer' : 'default',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: isActive
                    ? 'var(--accent-primary)'
                    : isDone
                    ? 'var(--success)'
                    : 'var(--bg-elevated)',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDone ? <Check size={12} /> : s.num}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive
                    ? 'var(--text-primary)'
                    : isDone
                    ? 'var(--text-secondary)'
                    : 'var(--text-tertiary)',
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          STEP 1: YOUR OFFER & PROMOTION
      ======================================================== */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
              Enter your deal, discount, or announcement. CleverCuts will turn it into 3 ready-to-run video ad concepts.
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
                {QUICK_OFFER_TEMPLATES.map((tpl, i) => (
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
                placeholder="e.g. Offering 20% off all brake and battery services this festival season. Free car wash included for all customers."
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
              {isLoadingPackages ? (
                <>
                  <RotateCcw size={15} className="spin" />
                  <span>Writing 3 Video Ads...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Create 3 Video Ads ➔</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 2: PICK YOUR AD (3 COMPLETE READY-TO-RUN ADS)
      ======================================================== */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 6 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              Choose Your Video Ad
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Select the creative angle that best fits your campaign. Each ad is ready to film.
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
              <span>Produce This Video Ad ➔</span>
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
              <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <RotateCcw size={36} className="spin" style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Filming Your Commercial with Magnific AI...
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 460, margin: 0, lineHeight: 1.5 }}>
                  Rendering high-definition broadcast scenes for "{selectedPackage?.title}". This usually takes around 60-90 seconds.
                </p>
              </div>
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
                  <a
                    href={producedVideoUrl}
                    download={`${(businessName || 'ad').replace(/\s+/g, '_')}_commercial.mp4`}
                    target="_blank"
                    rel="noopener noreferrer"
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
                      textDecoration: 'none',
                      boxShadow: '0 2px 10px var(--accent-glow)',
                    }}
                  >
                    <Download size={14} />
                    <span>Download Video (MP4)</span>
                  </a>

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
