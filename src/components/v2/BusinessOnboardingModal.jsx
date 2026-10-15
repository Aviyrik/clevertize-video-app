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
  Shirt,
  ShoppingBag,
  Gem,
  UtensilsCrossed,
  Smartphone,
  Scissors,
  HeartPulse,
  Home,
  GraduationCap,
  Dumbbell,
  Car,
  Check,
} from 'lucide-react';

const CATEGORY_CARDS = [
  {
    id: 'clothing',
    label: 'Saree, Clothing & Apparel',
    shortTitle: 'Fashion & Apparel',
    subtitle: 'Sarees, boutiques, ethnic & modern wear',
    icon: Shirt,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.3) 0%, rgba(136, 19, 55, 0.5) 100%)',
    accentColor: '#F43F5E',
  },
  {
    id: 'jewellery',
    label: 'Jewellery & Accessories',
    shortTitle: 'Jewellery & Luxury',
    subtitle: 'Gold, silver, diamonds & bridal ornaments',
    icon: Gem,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(161, 98, 7, 0.5) 100%)',
    accentColor: '#EAB308',
  },
  {
    id: 'sweets',
    label: 'Sweets, Bakery & Restaurant',
    shortTitle: 'Sweets, Bakery & Food',
    subtitle: 'Mithai, bakeries, cafes & restaurants',
    icon: UtensilsCrossed,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(154, 52, 18, 0.5) 100%)',
    accentColor: '#F97316',
  },
  {
    id: 'grocery',
    label: 'Kirana, Grocery & Supermarket',
    shortTitle: 'Kirana & Supermarket',
    subtitle: 'Daily essentials, FMCG & grocery provisions',
    icon: ShoppingBag,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(6, 95, 70, 0.5) 100%)',
    accentColor: '#10B981',
  },
  {
    id: 'electronics',
    label: 'Electronics, Mobile & Appliances',
    shortTitle: 'Electronics & Gadgets',
    subtitle: 'Smartphones, home appliances & gadgets',
    icon: Smartphone,
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(30, 58, 138, 0.5) 100%)',
    accentColor: '#3B82F6',
  },
  {
    id: 'salon',
    label: 'Salon, Spa & Beauty',
    shortTitle: 'Salon, Spa & Beauty',
    subtitle: 'Hair salons, makeup, skincare & wellness',
    icon: Scissors,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(157, 23, 77, 0.5) 100%)',
    accentColor: '#EC4899',
  },
  {
    id: 'healthcare',
    label: 'Healthcare, Clinic & Pharmacy',
    shortTitle: 'Healthcare & Clinic',
    subtitle: 'Doctors, dental, diagnostics & pharmacy',
    icon: HeartPulse,
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(20, 184, 166, 0.3) 0%, rgba(15, 118, 110, 0.5) 100%)',
    accentColor: '#14B8A6',
  },
  {
    id: 'realestate',
    label: 'Real Estate & Home Decor',
    shortTitle: 'Real Estate & Decor',
    subtitle: 'Properties, interior design & furniture',
    icon: Home,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(107, 33, 168, 0.5) 100%)',
    accentColor: '#A855F7',
  },
  {
    id: 'fitness',
    label: 'Gym, Fitness & Yoga',
    shortTitle: 'Gym & Fitness',
    subtitle: 'Workout centers, yoga studios & training',
    icon: Dumbbell,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(153, 27, 27, 0.5) 100%)',
    accentColor: '#EF4444',
  },
  {
    id: 'education',
    label: 'Education, Coaching & Tuition',
    shortTitle: 'Education & Coaching',
    subtitle: 'Tuitions, coaching classes & academies',
    icon: GraduationCap,
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(49, 46, 129, 0.5) 100%)',
    accentColor: '#6366F1',
  },
  {
    id: 'automobile',
    label: 'Automobile & Garage',
    shortTitle: 'Automobile & Garage',
    subtitle: 'Car & bike service, repairs & detailing',
    icon: Car,
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(100, 116, 139, 0.3) 0%, rgba(51, 65, 85, 0.5) 100%)',
    accentColor: '#64748B',
  },
  {
    id: 'other',
    label: 'Other Local Business',
    shortTitle: 'Other / Custom Business',
    subtitle: 'Specialized local services & crafts',
    icon: Store,
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(88, 28, 135, 0.5) 100%)',
    accentColor: '#9333EA',
  },
];

const CATEGORIES = CATEGORY_CARDS.map((c) => c.label);

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
  const [customCategory, setCustomCategory] = useState(
    initialData.businessType && !CATEGORY_CARDS.some((c) => c.label === initialData.businessType)
      ? initialData.businessType
      : ''
  );
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
    const finalCategory =
      businessType === 'Other Local Business' && customCategory.trim()
        ? customCategory.trim()
        : businessType;

    onComplete({
      businessName: businessName.trim() || 'My Business',
      businessType: finalCategory,
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
          maxWidth: 680,
          maxHeight: '92vh',
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
          <div
            style={{
              padding: '22px 26px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              maxHeight: 'calc(92vh - 145px)',
              overflowY: 'auto',
            }}
          >
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Tell us about your business
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                CleverCuts uses your brand identity to write high-converting commercial scripts tailored to your market.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
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
                placeholder="e.g. Anand Sweets, Zari Silks, Dental Care Clinic, Urban Kicks"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px',
                  fontSize: 14,
                  borderRadius: 10,
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
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Business Category <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  Pick your business category to guide industry scripts
                </span>
              </div>

              {/* Category Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                  gap: 10,
                  maxHeight: 330,
                  overflowY: 'auto',
                  paddingRight: 4,
                  paddingBottom: 2,
                }}
              >
                {CATEGORY_CARDS.map((cat) => {
                  const isSelected = businessType === cat.label;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setBusinessType(cat.label)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'left',
                        backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.12)' : 'var(--bg-elevated)',
                        border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        boxShadow: isSelected
                          ? '0 0 0 1px var(--accent-primary), 0 8px 20px rgba(124, 58, 237, 0.18)'
                          : 'none',
                        borderRadius: 12,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        padding: 0,
                        position: 'relative',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      {/* Visual Header */}
                      <div
                        style={{
                          position: 'relative',
                          height: 70,
                          width: '100%',
                          backgroundColor: '#151821',
                          background: cat.gradient,
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={cat.image}
                          alt={cat.shortTitle}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: isSelected ? 'brightness(1.05)' : 'brightness(0.72)',
                            transition: 'all 0.2s ease',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(to top, rgba(11, 12, 15, 0.95) 0%, rgba(11, 12, 15, 0.35) 60%, rgba(11, 12, 15, 0.15) 100%)',
                          }}
                        />

                        {/* Icon Badge */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 7,
                            left: 9,
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            backgroundColor: isSelected ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.18)',
                            backdropFilter: 'blur(6px)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                          }}
                        >
                          <Icon size={14} />
                        </div>

                        {/* Selected Check Badge */}
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 7,
                              right: 7,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              backgroundColor: 'var(--accent-primary)',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px var(--accent-glow)',
                            }}
                          >
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Card Details */}
                      <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column' }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.25,
                          }}
                        >
                          {cat.shortTitle}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'var(--text-tertiary)',
                            marginTop: 3,
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {cat.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Category Input if "Other Local Business" is selected */}
              {businessType === 'Other Local Business' && (
                <div style={{ marginTop: 10, animation: 'fadeIn 0.2s ease' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 5,
                    }}
                  >
                    Specify your business type (optional):
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Pet Care & Vet Clinic, Wedding Photography, Interior Design..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '9px 12px',
                      fontSize: 13,
                      borderRadius: 8,
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
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
