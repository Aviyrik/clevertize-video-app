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
  AlertCircle,
  Upload,
  Heart,
  PartyPopper,
  Crown,
  Target,
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
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80',
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

export const CATEGORY_AUDIENCES = {
  'Saree, Clothing & Apparel': [
    'Brides & wedding shopping families',
    'College students & young fashion lovers',
    'Working women looking for daily office wear',
    'Festival & celebration shoppers',
    'Budget-friendly family shoppers',
  ],
  'Jewellery & Accessories': [
    'Brides & wedding jewellery buyers',
    'Women looking for lightweight daily jewellery',
    'Gold & diamond investment buyers',
    'Gift buyers for birthdays & anniversaries',
    'Festive & traditional gold buyers',
  ],
  'Sweets, Bakery & Restaurant': [
    'Festival gift box & bulk sweet buyers',
    'Families & friends dining out on weekends',
    'Late-night dessert & sweet lovers',
    'Office lunch & evening snack crowds',
    'People looking for healthy or sugar-free treats',
  ],
  'Kirana, Grocery & Supermarket': [
    'Families buying monthly home groceries',
    'Working couples needing quick delivery',
    'Shoppers looking for weekly discounts & deals',
    'People buying fresh veggies & organic foods',
    'Everyday neighborhood walk-in customers',
  ],
  'Electronics, Mobile & Appliances': [
    'Students & youth buying new smartphones',
    'Gamers & tech gadget lovers',
    'Families buying TV, fridge & home appliances',
    'Festive offer & easy EMI shoppers',
    'Work-from-home pros needing laptop & tech gear',
  ],
  'Salon, Spa & Beauty': [
    'Brides & bridal makeover clients',
    'Working women for regular haircut & skin care',
    'Men looking for haircut & beard styling',
    'Weekend relaxation & massage seekers',
    'College students wanting trendy hair looks',
  ],
  'Healthcare, Clinic & Pharmacy': [
    'Parents looking for child health & baby care',
    'Senior citizens needing regular health checkups',
    'Patients looking for gentle, pain-free dental care',
    'Local families needing genuine medicines',
    'Working professionals booking full health checks',
  ],
  'Real Estate & Home Decor': [
    'First-time home buyers & young families',
    'Property investors & NRI buyers',
    'Homeowners looking for new interiors & furniture',
    'People looking for rental homes & flats',
    'Couples furnishing their new home',
  ],
  'Gym, Fitness & Yoga': [
    'Beginners looking to lose weight & get fit',
    'Desk workers fixing posture & back pain',
    'Youth training for muscle & body building',
    'Women looking for yoga & fitness sessions',
    'Seniors wanting to stay active & healthy',
  ],
  'Education, Coaching & Tuition': [
    'School students preparing for board exams',
    'Students preparing for exams like JEE, NEET & UPSC',
    'Parents looking for after-school tutoring',
    'College students learning tech & career skills',
    'Working professionals seeking career growth',
  ],
  'Automobile & Garage': [
    'Daily car & bike commuters needing service',
    'Car owners looking for wash, polish & detailing',
    'Cab & commercial drivers needing fast repairs',
    'Travelers getting vehicles checked before long trips',
    'Used car & bike buyers wanting a mechanic check',
  ],
  'Other Local Business': [
    'Neighborhood families & local residents',
    'Small business owners & local shops',
    'Customers looking for custom or handmade work',
    'First-time buyers looking for trusted local service',
    'Regular loyal customers',
  ],
};

export function getSuggestedAudiences(category) {
  if (category && CATEGORY_AUDIENCES[category]) {
    return CATEGORY_AUDIENCES[category];
  }
  const match = Object.keys(CATEGORY_AUDIENCES).find(
    (k) =>
      category &&
      (k.toLowerCase().includes(category.toLowerCase()) || category.toLowerCase().includes(k.toLowerCase()))
  );
  if (match) return CATEGORY_AUDIENCES[match];
  return CATEGORY_AUDIENCES['Other Local Business'];
}

const AUDIENCE_SUGGESTIONS = CATEGORY_AUDIENCES['Other Local Business'];

const BRAND_TONES = [
  { id: 'warm', label: 'Warm & Authentic', desc: 'Friendly, welcoming neighborhood trust', icon: Heart },
  { id: 'festive', label: 'Festive & Vibrant', desc: 'High-energy celebration & special offers', icon: PartyPopper },
  { id: 'premium', label: 'Premium & Elegant', desc: 'Refined craftsmanship & exclusivity', icon: Crown },
  { id: 'direct', label: 'Direct & Problem-Solving', desc: 'Clear, helpful, and value-focused', icon: Target },
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
  const [targetAudience, setTargetAudience] = useState(
    initialData.targetAudience || getSuggestedAudiences(initialData.businessType || CATEGORIES[0])[0]
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialData.websiteUrl || '');
  const [brandTone, setBrandTone] = useState(initialData.brandTone || 'Warm & Authentic');
  const [brandLogo, setBrandLogo] = useState(initialData.brandLogo || null);
  const [nameError, setNameError] = useState(false);
  const [townError, setTownError] = useState(false);
  const [audienceError, setAudienceError] = useState(false);

  const selectedCategoryCard =
    CATEGORY_CARDS.find((c) => c.label === businessType) || CATEGORY_CARDS[0];
  const currentAudienceSuggestions = getSuggestedAudiences(businessType);

  if (!isOpen) return null;

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!businessName.trim()) {
        setNameError(true);
        return false;
      }
      setNameError(false);
      return true;
    }
    if (currentStep === 2) {
      let valid = true;
      if (!town.trim()) {
        setTownError(true);
        valid = false;
      } else {
        setTownError(false);
      }
      if (!targetAudience.trim()) {
        setAudienceError(true);
        valid = false;
      } else {
        setAudienceError(false);
      }
      return valid;
    }
    // Step 3 has only optional fields (Tone is preselected, URL and Logo are optional)
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    if (step === 1) {
      // Auto-update audience if user hasn't explicitly customized it yet
      const suggestions = getSuggestedAudiences(businessType);
      const isDefaultOrPreset =
        !targetAudience ||
        targetAudience === 'Local families & everyday buyers' ||
        (!initialData.targetAudience &&
          Object.values(CATEGORY_AUDIENCES).some((list) => list.includes(targetAudience)));

      if (isDefaultOrPreset) {
        if (suggestions && suggestions[0]) {
          setTargetAudience(suggestions[0]);
        }
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleNextFromStep1 = handleNext;

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
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
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
              flex: 1,
              minHeight: 0,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontSize: 12, marginTop: 5 }}>
                  <AlertCircle size={13} />
                  <span>Please enter your business or brand name.</span>
                </div>
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
          <div
            style={{
              padding: '22px 26px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              flex: 1,
              minHeight: 0,
              maxHeight: 'calc(92vh - 145px)',
              overflowY: 'auto',
            }}
          >
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Where are your customers?
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Town slang, cultural references, and buyer demographics make your video ads authentic and relatable.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                City or Town <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={town}
                onChange={(e) => {
                  setTown(e.target.value);
                  if (townError) setTownError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNext();
                }}
                placeholder="e.g. Bangalore, Indore, Siliguri, Jaipur, Pune"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: `1.5px solid ${townError ? '#EF4444' : 'var(--border-default)'}`,
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              {townError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontSize: 12, marginTop: 5 }}>
                  <AlertCircle size={13} />
                  <span>Please enter your city or town so we can localize your video scripts.</span>
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Target Customers <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  Type freely or click personas below
                </span>
              </div>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => {
                  setTargetAudience(e.target.value);
                  if (audienceError) setAudienceError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNext();
                }}
                placeholder="e.g. Daily car & bike commuters, wedding shoppers, young families..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: `1.5px solid ${audienceError ? '#EF4444' : 'var(--border-default)'}`,
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  marginBottom: audienceError ? 5 : 10,
                }}
              />
              {audienceError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444', fontSize: 12, marginTop: 4, marginBottom: 10 }}>
                  <AlertCircle size={13} />
                  <span>Please enter or pick at least one target customer group.</span>
                </div>
              )}

              {/* Dynamic Suggestions for Selected Category */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        backgroundColor: 'var(--accent-subtle)',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Sparkles size={11} />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--accent-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Suggested for {selectedCategoryCard?.shortTitle || businessType}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    Click to apply or combine
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {currentAudienceSuggestions.map((sug, i) => {
                    const currentItems = targetAudience
                      .split(',')
                      .map((p) => p.trim())
                      .filter(Boolean);
                    const isSelected = currentItems.some(
                      (item) => item.toLowerCase() === sug.toLowerCase()
                    );
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (audienceError) setAudienceError(false);

                          if (isSelected) {
                            // Deselect / remove this chip from the list
                            const remaining = currentItems.filter(
                              (p) => p.toLowerCase() !== sug.toLowerCase()
                            );
                            setTargetAudience(remaining.join(', '));
                          } else {
                            // Combine with existing text present in the input box
                            if (currentItems.length === 0 || targetAudience === 'Local families & everyday buyers') {
                              setTargetAudience(sug);
                            } else {
                              setTargetAudience([...currentItems, sug].join(', '));
                            }
                          }
                        }}
                        style={{
                          fontSize: 11.5,
                          fontWeight: isSelected ? 600 : 500,
                          padding: '6px 12px',
                          borderRadius: 20,
                          backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.18)' : 'var(--bg-elevated)',
                          border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                        <span>{sug}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Brand Voice & Online Presence */}
        {step === 3 && (
          <div
            style={{
              padding: '22px 26px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              flex: 1,
              minHeight: 0,
              maxHeight: 'calc(92vh - 145px)',
              overflowY: 'auto',
            }}
          >
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
                  const Icon = t.icon;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setBrandTone(t.label)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-elevated)',
                        border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.22)' : 'rgba(255, 255, 255, 0.05)',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{t.label}</span>
                          {isSelected && <Check size={13} strokeWidth={2.5} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, lineHeight: 1.3 }}>
                          {t.desc}
                        </div>
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
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Brand Logo (Optional)
              </label>
              {brandLogo ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 12,
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={brandLogo}
                      alt="Logo"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        objectFit: 'cover',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: '#161922',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Brand logo attached
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        Appears on video end-cards & watermark
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-default)',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      Change
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
                    <button
                      type="button"
                      onClick={() => setBrandLogo(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '6px 8px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '18px 16px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1.5px dashed var(--border-default)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Upload size={18} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Upload brand logo or storefront photo
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    PNG, JPG, or WebP up to 5MB · Used for end-frame compositing & watermark
                  </div>
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
          <div
            style={{
              padding: '24px 26px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              flex: 1,
              minHeight: 0,
              maxHeight: 'calc(92vh - 145px)',
              overflowY: 'auto',
            }}
          >
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
            flexShrink: 0,
            backgroundColor: 'var(--bg-surface)',
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

          {step < 4 && (
            <button
              type="button"
              onClick={handleNext}
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
