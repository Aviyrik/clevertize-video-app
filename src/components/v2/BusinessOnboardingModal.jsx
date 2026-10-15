import React, { useState } from 'react';
import { X, Building2, Store, MapPin, Users, Globe, Image, CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

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
  'Other Local Business',
];

const INTENDED_USES = [
  { id: 'instagram', label: 'Instagram Reels & Stories', desc: 'Fast-paced, hook-led 15s commercial' },
  { id: 'whatsapp', label: 'WhatsApp Status & Customer Broadcasts', desc: 'Direct, personal recommendation' },
  { id: 'ads', label: 'Paid Meta / YouTube Ads', desc: 'High-conversion offer & problem-solution arc' },
];

export default function BusinessOnboardingModal({
  isOpen,
  onClose,
  onComplete,
  initialData = {},
}) {
  const [step, setStep] = useState(1); // 1: Use Case, 2: Business Info, 3: Audience & Town, 4: Online presence, 5: Review
  const [intendedUse, setIntendedUse] = useState(initialData.intendedUse || 'instagram');
  const [businessName, setBusinessName] = useState(initialData.businessName || '');
  const [businessType, setBusinessType] = useState(initialData.businessType || CATEGORIES[0]);
  const [town, setTown] = useState(initialData.town || '');
  const [targetAudience, setTargetAudience] = useState(initialData.targetAudience || 'Local families & everyday buyers');
  const [websiteUrl, setWebsiteUrl] = useState(initialData.websiteUrl || '');
  const [brandTone, setBrandTone] = useState(initialData.brandTone || 'Warm, authentic & trustworthy');
  const [brandLogo, setBrandLogo] = useState(initialData.brandLogo || null);

  if (!isOpen) return null;

  const handleFinish = () => {
    onComplete({
      intendedUse,
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
                {step === 1 && 'Welcome & Video Goal'}
                {step === 2 && 'Business Identity'}
                {step === 3 && 'Location & Customers'}
                {step === 4 && 'Confirm & Launch'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Dots */}
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

        {/* Step 1: Intended Use */}
        {step === 1 && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                What kind of video are you creating?
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                This tunes dialogue pacing, hook length, and camera styling.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {INTENDED_USES.map((u) => {
                const isSelected = intendedUse === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => setIntendedUse(u.id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 10,
                      backgroundColor: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{u.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{u.desc}</div>
                    </div>
                    {isSelected && <CheckCircle2 size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Business Info */}
        {step === 2 && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Tell us about your business
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                Our creative intelligence uses this to craft authentic industry dialogue and settings.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Business or Brand Name *
              </label>
              <input
                type="text"
                autoFocus
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Anand Sweets & Namkeen"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Category
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
              >
                {CATEGORIES.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Location & Audience */}
        {step === 3 && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Where are your customers?
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                Local references, town slang, and regional relatability dramatically improve viewer retention.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                City or Town (Optional)
              </label>
              <input
                type="text"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="e.g. Indore, Ahmedabad, Jaipur, Pune"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Target Audience
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
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Website or Social Link (Optional)
              </label>
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://myshop.com or instagram.com/myshop"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Optional Brand Asset */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Brand Logo or Product Photo (Optional)
              </label>
              {brandLogo ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={brandLogo} alt="Logo" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Brand image attached</span>
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

        {/* Step 4: Review & Complete */}
        {step === 4 && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
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
                Ready to create on Clevertize!
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, maxWidth: 400, margin: '0 auto' }}>
                Your business profile is configured. You can now launch any of the 3 creation pathways.
              </p>
            </div>

            {/* Profile Summary Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 10,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {brandLogo && (
                    <img src={brandLogo} alt="Logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                  )}
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {businessName || 'My Business'}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {businessType}
                </span>
              </div>
              {town && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} style={{ color: 'var(--accent-primary)' }} />
                  <span>{town}</span>
                </div>
              )}
              {targetAudience && (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={12} />
                  <span>Audience: {targetAudience}</span>
                </div>
              )}
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

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 2 && !businessName.trim()) {
                  setBusinessName('My Business');
                }
                setStep(step + 1);
              }}
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
          ) : (
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
