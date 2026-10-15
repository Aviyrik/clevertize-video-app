import React, { useState } from 'react';
import {
  X,
  Building2,
  Store,
  MapPin,
  Users,
  Globe,
  Image,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Volume2,
} from 'lucide-react';

const CATEGORIES = [
  'Kirana, Grocery & Supermarket',
  'Saree, Clothing & Apparel',
  'Jewellery & Accessories',
  'Sweets, Bakery & Restaurant',
  'Electronics, Mobile & Appliances',
  'Healthcare, Clinic & Pharmacy',
  'Salon, Spa & Beauty',
  'Education, Coaching & Tuition',
  'Real Estate & Home Decor',
  'Automobile & Garage',
  'Gym, Fitness & Yoga',
  'Other Local Business',
];

const AUDIENCE_SUGGESTIONS = [
  'Local families & everyday buyers',
  'Young professionals & students',
  'Bridal & wedding shoppers',
  'Festive gift buyers',
  'B2B & corporate clients',
];

const BRAND_TONES = [
  { id: 'warm', label: 'Warm & Authentic', desc: 'Friendly, welcoming neighborhood trust' },
  { id: 'festive', label: 'Festive & Vibrant', desc: 'High-energy celebration & special offers' },
  { id: 'premium', label: 'Premium & Elegant', desc: 'Refined craftsmanship & exclusivity' },
  { id: 'direct', label: 'Direct & Problem-Solving', desc: 'Clear, helpful, and value-focused' },
];

export default function BusinessOnboardingModal({
  isOpen,
  onClose,
  onComplete,
  initialData = {},
}) {
  // 4 Business-Only Steps:
  // Step 1: Business Identity
  // Step 2: Location & Customers
  // Step 3: Brand Voice & Online Presence
  // Step 4: Confirm & Launch
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState(initialData.businessName || '');
  const [businessType, setBusinessType] = useState(initialData.businessType || CATEGORIES[0]);
  const [town, setTown] = useState(initialData.town || '');
  const [targetAudience, setTargetAudience] = useState(initialData.targetAudience || 'Local families & everyday buyers');
  const [websiteUrl, setWebsiteUrl] = useState(initialData.websiteUrl || '');
  const [brandTone, setBrandTone] = useState(initialData.brandTone || 'Warm & Authentic');
  const [brandLogo, setBrandLogo] = useState(initialData.brandLogo || null);
  const [nameError, setNameError] = useState(false);

  if (!isOpen) return null;

  const handleNextFromStep1 = () => {
    if (!businessName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setStep(2);
  };

  const handleFinish = () => {
    onComplete({
      businessName: businessName.trim() || 'My Business',
      businessType,
      town: town.trim(),
      targetAudience: targetAudience.trim(),
      websiteUrl: websiteUrl.trim(),
      brandTone,
      brandLogo,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 18,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Progress Bar Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  backgroundColor: 'var(--accent-subtle)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Step {step} of 4
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {step === 1 && 'Business Identity'}
                {step === 2 && 'Location & Customers'}
                {step === 3 && 'Brand Voice & Online Presence'}
                {step === 4 && 'Confirm & Launch'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Close"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Dots / Bars */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: s <= step ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Business Identity */}
        {step === 1 && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Tell us about your business
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                CleverCuts uses your brand identity to write high-converting commercial scripts tailored to your market.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Business or Brand Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  if (nameError) setNameError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNextFromStep1();
                }}
                placeholder="e.g. Anand Sweets, Zari Silks, Dental Care Clinic"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: `1.5px solid ${nameError ? '#EF4444' : 'var(--border-default)'}`,
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              {nameError && (
                <span style={{ fontSize: 12, color: '#EF4444', marginTop: 4, display: 'block' }}>
                  Please enter your business or brand name.
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Business Category
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {CATEGORIES.map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Location & Customers */}
        {step === 2 && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Where are your customers?
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Town slang, cultural references, and buyer demographics make your video ads authentic and relatable.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                City or Town
              </label>
              <input
                type="text"
                autoFocus
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="e.g. Bangalore, Indore, Siliguri, Jaipur, Pune"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Target Customers
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Young professionals, Homemakers, Festive buyers"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  marginBottom: 8,
                }}
              />

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {AUDIENCE_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTargetAudience(sug)}
                    style={{
                      fontSize: 11,
                      padding: '4px 9px',
                      borderRadius: 14,
                      backgroundColor: targetAudience === sug ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-elevated)',
                      border: `1px solid ${targetAudience === sug ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      color: targetAudience === sug ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Brand Voice & Online Presence */}
        {step === 3 && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Brand Voice & Online Presence
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Define the personality of your brand so our scripts strike the right tone.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Brand Tone
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {BRAND_TONES.map((t) => {
                  const isSelected = brandTone === t.label;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setBrandTone(t.label)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-elevated)',
                        border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {t.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Website or Social Link (Optional)
              </label>
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://myshop.com or instagram.com/mybrand"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Optional Brand Asset */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Brand Logo (Optional)
              </label>
              {brandLogo ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={brandLogo} alt="Logo" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Brand logo attached</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBrandLogo(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: 12 }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 14px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px dashed var(--border-default)',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                }}>
                  <Image size={15} style={{ color: 'var(--accent-primary)' }} />
                  <span>Upload logo or storefront photo (optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setBrandLogo(ev.target.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Confirm & Launch */}
        {step === 4 && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ textAlign: 'center', padding: '6px 0 0' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Your Brand Profile is Set Up!
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, maxWidth: 420, margin: '0 auto', lineHeight: 1.5 }}>
                Your brand identity is saved. You won't have to enter this again. Now, choose how you'd like to create your first video.
              </p>
            </div>

            {/* Profile Summary Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {brandLogo ? (
                    <img src={brandLogo} alt="Logo" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        backgroundColor: 'var(--accent-subtle)',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      {businessName ? businessName[0].toUpperCase() : 'B'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {businessName || 'My Business'}
                    </div>
                    {town && (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} style={{ color: 'var(--accent-primary)' }} />
                        <span>{town}</span>
                      </div>
                    )}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    padding: '3px 8px',
                    borderRadius: 4,
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  {businessType}
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {targetAudience && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={12} style={{ color: 'var(--accent-primary)' }} />
                    <span>Audience: {targetAudience}</span>
                  </div>
                )}
                {brandTone && (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Volume2 size={12} />
                    <span>Tone: {brandTone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              style={{
                background: 'none',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={handleNextFromStep1}
              style={{
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                borderRadius: 8,
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 700,
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 10px var(--accent-glow)',
              }}
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          )}

          {step > 1 && step < 4 && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              style={{
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                borderRadius: 8,
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 700,
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 10px var(--accent-glow)',
              }}
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleFinish}
              style={{
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                borderRadius: 8,
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 700,
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 12px var(--accent-glow)',
              }}
            >
              <Sparkles size={14} />
              <span>Enter Creation Hub</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
