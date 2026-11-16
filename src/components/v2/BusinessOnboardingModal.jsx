import React, { useState, useEffect, useRef } from 'react';
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
    gradient: 'linear-gradient(135deg, rgba(244, 244, 236, 0.07) 0%, rgba(244, 244, 236, 0.02) 100%)',
    accentColor: 'var(--cc-danger)',
  },
  {
    id: 'jewellery',
    label: 'Jewellery & Accessories',
    shortTitle: 'Jewellery & Luxury',
    subtitle: 'Gold, silver, diamonds & bridal ornaments',
    icon: Gem,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(244, 244, 236, 0.07) 0%, rgba(244, 244, 236, 0.02) 100%)',
    accentColor: 'var(--cc-emphasis)',
  },
  {
    id: 'sweets',
    label: 'Sweets, Bakery & Restaurant',
    shortTitle: 'Sweets, Bakery & Food',
    subtitle: 'Mithai, bakeries, cafes & restaurants',
    icon: UtensilsCrossed,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(244, 244, 236, 0.07) 0%, rgba(244, 244, 236, 0.02) 100%)',
    accentColor: 'var(--cc-text-2)',
  },
  {
    id: 'grocery',
    label: 'Kirana, Grocery & Supermarket',
    shortTitle: 'Kirana & Supermarket',
    subtitle: 'Daily essentials, FMCG & grocery provisions',
    icon: ShoppingBag,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(244, 244, 236, 0.07) 0%, rgba(244, 244, 236, 0.02) 100%)',
    accentColor: 'var(--cc-success)',
  },
  {
    id: 'electronics',
    label: 'Electronics, Mobile & Appliances',
    shortTitle: 'Electronics & Gadgets',
    subtitle: 'Smartphones, home appliances & gadgets',
    icon: Smartphone,
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(244, 244, 236, 0.07) 0%, rgba(244, 244, 236, 0.02) 100%)',
    accentColor: 'var(--cc-text-2)',
  },
  {
    id: 'salon',
    label: 'Salon, Spa & Beauty',
    shortTitle: 'Salon, Spa & Beauty',
    subtitle: 'Hair salons, makeup, skincare & wellness',
    icon: Scissors,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(244, 244, 236, 0.07) 0%, rgba(244, 244, 236, 0.02) 100%)',
    accentColor: 'var(--cc-text-2)',
  },
  {
    id: 'healthcare',
    label: 'Healthcare, Clinic & Pharmacy',
    shortTitle: 'Healthcare & Clinic',
    subtitle: 'Doctors, dental, diagnostics & pharmacy',
    icon: HeartPulse,
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(244, 244, 236, 0.07) 0%, rgba(244, 244, 236, 0.02) 100%)',
    accentColor: 'var(--cc-success)',
  },
  {
    id: 'realestate',
    label: 'Real Estate & Home Decor',
    shortTitle: 'Real Estate & Decor',
    subtitle: 'Properties, interior design & furniture',
    icon: Home,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(244, 244, 236, 0.07) 0%, rgba(244, 244, 236, 0.02) 100%)',
    accentColor: 'var(--cc-emphasis)',
  },
  {
    id: 'fitness',
    label: 'Gym, Fitness & Yoga',
    shortTitle: 'Gym & Fitness',
    subtitle: 'Workout centers, yoga studios & training',
    icon: Dumbbell,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(244, 244, 236, 0.07) 0%, rgba(244, 244, 236, 0.02) 100%)',
    accentColor: 'var(--cc-danger)',
  },
  {
    id: 'education',
    label: 'Education, Coaching & Tuition',
    shortTitle: 'Education & Coaching',
    subtitle: 'Tuitions, coaching classes & academies',
    icon: GraduationCap,
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(244, 244, 236, 0.07) 0%, rgba(244, 244, 236, 0.02) 100%)',
    accentColor: 'var(--cc-emphasis)',
  },
  {
    id: 'automobile',
    label: 'Automobile & Garage',
    shortTitle: 'Automobile & Garage',
    subtitle: 'Car & bike service, repairs & detailing',
    icon: Car,
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(244, 244, 236, 0.07) 0%, rgba(244, 244, 236, 0.02) 100%)',
    accentColor: 'var(--cc-text-2)',
  },
  {
    id: 'other',
    label: 'Other Local Business',
    shortTitle: 'Other / Custom Business',
    subtitle: 'Specialized local services & crafts',
    icon: Store,
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80',
    gradient: 'linear-gradient(135deg, rgba(244, 244, 236, 0.07) 0%, rgba(244, 244, 236, 0.02) 100%)',
    accentColor: 'var(--cc-emphasis)',
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
  if (!initialData) initialData = {};

  // 4 Business-Only Steps:
  // Step 1: Business Identity
  // Step 2: Location & Customers
  // Step 3: Brand Voice & Online Presence
  // Step 4: Confirm & Launch
  const [step, setStep] = useState(1);
  const rawBusinessName = (initialData.businessName || initialData.name || '').trim();
  const initialBusinessName = rawBusinessName.toLowerCase() === 'kanti sweets' ? '' : rawBusinessName;
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [businessType, setBusinessType] = useState(initialData.businessType || initialData.category || '');
  const [customCategory, setCustomCategory] = useState(
    initialData.businessType && !CATEGORY_CARDS.some((c) => c.label === initialData.businessType)
      ? initialData.businessType
      : ''
  );
  const [town, setTown] = useState(initialData.town || '');
  const [targetAudience, setTargetAudience] = useState(
    initialData.targetAudience || ''
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialData.websiteUrl || '');
  const [brandTone, setBrandTone] = useState(initialData.brandTone || 'Warm & Authentic');
  const [brandLogo, setBrandLogo] = useState(initialData.brandLogo || initialData.logo || null);
  const [nameError, setNameError] = useState(false);
  const [townError, setTownError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const previousFocusRef = useRef(null);
  const nameInputRef = useRef(null);
  const townInputRef = useRef(null);

  const selectedCategoryCard =
    CATEGORY_CARDS.find((c) => c.label === businessType) || CATEGORY_CARDS[0];
  const currentAudienceSuggestions = getSuggestedAudiences(businessType);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = typeof document !== 'undefined' ? document.activeElement : null;
      setStep(1);
      setShowDiscardConfirm(false);
    } else if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      try { previousFocusRef.current.focus(); } catch {}
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const data = initialData || {};
      const raw = (data.businessName || data.name || '').trim();
      const isKanti = raw.toLowerCase() === 'kanti sweets';
      setBusinessName(isKanti ? '' : raw);
      setBusinessType(data.businessType || data.category || '');
      setCustomCategory(
        data.businessType && !CATEGORY_CARDS.some((c) => c.label === data.businessType)
          ? data.businessType
          : ''
      );
      setTown(data.town || '');
      setTargetAudience(
        data.targetAudience || ''
      );
      setWebsiteUrl(data.websiteUrl || '');
      setBrandTone(data.brandTone || 'Warm & Authentic');
      setBrandLogo(data.brandLogo || data.logo || null);
      setNameError(false);
      setTownError(false);
      setCategoryError(false);
    }
  }, [isOpen, initialData]);

  const hasUnsavedChanges = Boolean(
    isOpen && (
      step > 1 ||
      businessName.trim() !== initialBusinessName ||
      businessType !== (initialData.businessType || initialData.category || '') ||
      town.trim() !== String(initialData.town || '').trim() ||
      websiteUrl.trim() !== String(initialData.websiteUrl || '').trim() ||
      brandTone !== (initialData.brandTone || 'Warm & Authentic') ||
      brandLogo !== (initialData.brandLogo || initialData.logo || null)
    )
  );

  const handleRequestClose = () => {
    if (hasUnsavedChanges && !showDiscardConfirm) {
      setShowDiscardConfirm(true);
      return;
    }
    setShowDiscardConfirm(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else {
          handleRequestClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, showDiscardConfirm, hasUnsavedChanges]);

  if (!isOpen) return null;

  const STEP_META = [
    { num: 1, short: 'Identity', title: 'Business Identity', req: 'Required: Name & Category' },
    { num: 2, short: 'Location', title: 'Location & Online Presence', req: 'Required: City / Town' },
    { num: 3, short: 'Voice', title: 'Brand Voice & Personality', req: 'Optional preferences' },
    { num: 4, short: 'Confirm', title: 'Confirm & Save', req: 'Review & save' },
  ];
  const activeStepMeta = STEP_META[step - 1] || STEP_META[0];

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      let valid = true;
      if (!businessName.trim()) {
        setNameError(true);
        valid = false;
        if (nameInputRef.current) nameInputRef.current.focus();
      } else {
        setNameError(false);
      }
      if (!businessType && !customCategory.trim()) {
        setCategoryError(true);
        valid = false;
      } else {
        setCategoryError(false);
      }
      return valid;
    }
    if (currentStep === 2) {
      if (!town.trim()) {
        setTownError(true);
        if (townInputRef.current) townInputRef.current.focus();
        return false;
      }
      setTownError(false);
      return true;
    }
    // Step 3 and 4 have only optional fields
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleNextFromStep1 = handleNext;

  const handleFinish = () => {
    const finalCategory =
      businessType === 'Other Local Business' && customCategory.trim()
        ? customCategory.trim()
        : businessType;

    onComplete({
      id: initialData.id || undefined,
      businessName: businessName.trim() || 'My Business',
      name: businessName.trim() || 'My Business',
      businessType: finalCategory,
      category: finalCategory,
      town: town.trim(),
      targetAudience: targetAudience.trim(),
      websiteUrl: websiteUrl.trim(),
      brandTone,
      brandLogo,
      logo: brandLogo,
    });
    setStep(1);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-onboarding-step-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 10, 9, 0.85)',
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
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--cc-emphasis)',
                  backgroundColor: 'var(--accent-subtle)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.005em',
                }}
              >
                Step {step} of 4
              </span>
              <span id="business-onboarding-step-title" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                {step === 1 && 'Business Identity'}
                {step === 2 && 'Location & Online Presence'}
                {step === 3 && 'Brand Voice & Personality'}
                {step === 4 && 'Confirm & Save'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                · {activeStepMeta.req}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRequestClose}
              title="Close"
              aria-label="Close setup modal"
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

          {/* Semantic 4-Step Progress Indicator (text + status icons, not color alone) */}
          <div
            role="progressbar"
            aria-label="Business setup progress"
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuenow={step}
            aria-valuetext={`Step ${step} of 4: ${activeStepMeta.title}`}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}
          >
            {STEP_META.map((item) => {
              const isDone = item.num < step;
              const isCurrent = item.num === step;
              return (
                <div key={item.num} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isDone || isCurrent ? 'var(--cc-action)' : 'var(--bg-elevated)',
                      opacity: isDone ? 0.65 : 1,
                      transition: 'background-color 0.2s',
                    }}
                  />
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: isCurrent ? 600 : 500,
                      color: isCurrent ? 'var(--cc-emphasis)' : isDone ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {isDone && <Check size={10} strokeWidth={3} aria-hidden="true" />}
                    <span>{item.num}. {item.short}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {showDiscardConfirm && (
            <div
              role="alertdialog"
              aria-label="Confirm discarding unsaved business setup"
              style={{
                marginTop: 12,
                padding: '9px 12px',
                borderRadius: 8,
                backgroundColor: 'rgba(242, 184, 75, 0.1)',
                border: '1px solid rgba(242, 184, 75, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                You have unsaved business setup details. Discard changes?
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    onClose();
                  }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    backgroundColor: 'var(--cc-danger)',
                    border: 'none',
                    color: '#1A0703',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Discard &amp; Close
                </button>
              </div>
            </div>
          )}
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
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Tell us about your business
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Add your brand name, optional logo, and category.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {/* Logo Upload Dropzone / Avatar */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Logo <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-tertiary)' }}>(optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  {brandLogo ? (
                    <div style={{ position: 'relative', width: 50, height: 50 }}>
                      <img
                        src={brandLogo}
                        alt="Logo"
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 10,
                          objectFit: 'cover',
                          border: '1.5px solid var(--cc-selected-line)',
                          backgroundColor: '#21211E',
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBrandLogo(null);
                        }}
                        title="Remove Logo"
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          backgroundColor: 'var(--cc-danger)',
                          color: '#1A0703',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 10,
                        border: '1.5px dashed var(--border-default)',
                        backgroundColor: 'var(--bg-elevated)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--cc-selected-line)';
                        e.currentTarget.style.color = 'var(--cc-emphasis)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.color = 'var(--text-tertiary)';
                      }}
                      title="Upload business logo"
                    >
                      <Upload size={16} />
                      <span style={{ fontSize: 12, fontWeight: 600, marginTop: 2, }}>Logo</span>
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

              {/* Business Name Input */}
              <div style={{ flex: 1 }}>
                <label htmlFor="onboarding-business-name" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Business or Brand Name <span style={{ color: 'var(--cc-danger)' }}>*</span>
                </label>
                <input
                  id="onboarding-business-name"
                  ref={nameInputRef}
                  type="text"
                  autoFocus
                  aria-required="true"
                  aria-invalid={nameError}
                  aria-describedby={nameError ? 'onboarding-name-error' : undefined}
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
                    border: `1.5px solid ${nameError ? 'var(--cc-danger)' : 'var(--border-default)'}`,
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
                {nameError && (
                  <div id="onboarding-name-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cc-danger)', fontSize: 12, marginTop: 5 }}>
                    <AlertCircle size={13} aria-hidden="true" />
                    <span>Please enter your business or brand name.</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Business Category <span style={{ color: 'var(--cc-danger)' }}>*</span>
                </label>
              </div>

              {/* Category Cards Grid */}
              <div
                role="group"
                aria-label="Business Category"
                className="category-card-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))',
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
                      aria-pressed={isSelected}
                      onClick={() => {
                        setBusinessType(cat.label);
                        if (categoryError) setCategoryError(false);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'left',
                        backgroundColor: isSelected ? 'rgba(244, 244, 236, 0.06)' : 'var(--bg-elevated)',
                        border: isSelected ? '1.5px solid var(--cc-selected-line)' : '1px solid var(--border-subtle)',
                        boxShadow: isSelected
                          ? '0 0 0 1px var(--cc-selected-line), 0 8px 20px rgba(244, 244, 236, 0.18)'
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
                        className="category-card-visual"
                        style={{
                          position: 'relative',
                          height: 70,
                          width: '100%',
                          backgroundColor: '#21211E',
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
                              'linear-gradient(to top, rgba(18, 18, 17, 0.95) 0%, rgba(18, 18, 17, 0.35) 60%, rgba(18, 18, 17, 0.15) 100%)',
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
                            backgroundColor: isSelected ? 'var(--cc-active)' : 'rgba(255, 255, 255, 0.18)',
                            backdropFilter: 'blur(6px)',
                            color: 'var(--cc-text-1)',
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
                              backgroundColor: 'var(--cc-action)',
                              color: 'var(--cc-on-action)',
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
                            fontWeight: 600,
                            color: isSelected ? 'var(--cc-emphasis)' : 'var(--text-primary)',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.25,
                          }}
                        >
                          {cat.shortTitle}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
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
                      fontSize: 12,
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
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      if (categoryError) setCategoryError(false);
                    }}
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

              {/* Category Validation Error */}
              {categoryError && (
                <div id="onboarding-category-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cc-danger)', fontSize: 12, marginTop: 10 }}>
                  <AlertCircle size={13} aria-hidden="true" />
                  <span>Please select a business category to guide your video scripts.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Location & Online Presence */}
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
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Where is your business located?
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Used for local references and store context.
              </p>
            </div>

            <div>
              <label htmlFor="onboarding-town" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                City or Town <span style={{ color: 'var(--cc-danger)' }}>*</span>
              </label>
              <input
                id="onboarding-town"
                ref={townInputRef}
                type="text"
                autoFocus
                aria-required="true"
                aria-invalid={townError}
                aria-describedby={townError ? 'onboarding-town-error' : undefined}
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
                  border: `1.5px solid ${townError ? 'var(--cc-danger)' : 'var(--border-default)'}`,
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              {townError && (
                <div id="onboarding-town-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cc-danger)', fontSize: 12, marginTop: 5 }}>
                  <AlertCircle size={13} aria-hidden="true" />
                  <span>Please enter your city or town so we can localize your video scripts.</span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="onboarding-website" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                Website or Social Link (Optional)
              </label>
              <input
                id="onboarding-website"
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://myshop.com or instagram.com/mybrand"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '11px 14px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
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
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Brand Voice & Personality
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Choose your brand tone and optional logo.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Brand Tone
              </label>
              <div role="group" aria-label="Brand Tone" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))', gap: 10 }}>
                {BRAND_TONES.map((t) => {
                  const isSelected = brandTone === t.label;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setBrandTone(t.label)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        backgroundColor: isSelected ? 'rgba(244, 244, 236, 0.06)' : 'var(--bg-elevated)',
                        border: `1.5px solid ${isSelected ? 'var(--cc-emphasis)' : 'var(--border-default)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        aria-hidden="true"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          backgroundColor: isSelected ? 'rgba(244, 244, 236, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          color: isSelected ? 'var(--cc-emphasis)' : 'var(--text-secondary)',
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
                            fontWeight: 600,
                            color: isSelected ? 'var(--cc-emphasis)' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{t.label}</span>
                          {isSelected && <Check size={13} strokeWidth={2.5} style={{ color: 'var(--cc-emphasis)', flexShrink: 0 }} aria-hidden="true" />}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2, lineHeight: 1.3 }}>
                          {t.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>



            {/* Optional Brand Asset */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
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
                        backgroundColor: '#21211E',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        Brand logo attached
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
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
                    e.currentTarget.style.borderColor = 'var(--cc-selected-line)';
                    e.currentTarget.style.backgroundColor = 'rgba(244, 244, 236, 0.02)';
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
                      color: 'var(--cc-emphasis)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Upload size={18} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Upload brand logo or storefront photo
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
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
                  backgroundColor: 'rgba(95, 212, 174, 0.15)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                Your Brand Profile is Ready!
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, maxWidth: 420, margin: '0 auto', lineHeight: 1.5 }}>
                Save your profile to start creating videos.
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
                        color: 'var(--cc-emphasis)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {businessName ? businessName[0].toUpperCase() : 'B'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {businessName || 'My Business'}
                    </div>
                    {town && (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} style={{ color: 'var(--cc-emphasis)' }} />
                        <span>{town}</span>
                      </div>
                    )}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 12,
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
                {websiteUrl && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Globe size={12} style={{ color: 'var(--cc-emphasis)' }} />
                    <span>{websiteUrl}</span>
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
                backgroundColor: 'var(--cc-action)',
                border: 'none',
                borderRadius: 999,
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--cc-on-action)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
              }}
            >
              <span>Continue</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={handleFinish}
              style={{
                backgroundColor: 'var(--cc-action)',
                border: 'none',
                borderRadius: 999,
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--cc-on-action)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
              }}
            >
              <Check size={16} />
              <span>Save</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
