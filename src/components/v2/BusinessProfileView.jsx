import React, { useState } from 'react';
import { Store, MapPin, Users, Globe, Check, Plus, Building2, Save, Sparkles } from 'lucide-react';

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

export default function BusinessProfileView({
  businesses = [],
  activeBusiness = {},
  onSaveBusiness,
  onSelectBusiness,
  onAddNewBusiness,
}) {
  const [name, setName] = useState(activeBusiness.businessName || '');
  const [type, setType] = useState(activeBusiness.businessType || CATEGORIES[0]);
  const [town, setTown] = useState(activeBusiness.town || '');
  const [targetAudience, setTargetAudience] = useState(activeBusiness.targetAudience || '');
  const [websiteUrl, setWebsiteUrl] = useState(activeBusiness.websiteUrl || '');
  const [brandTone, setBrandTone] = useState(activeBusiness.brandTone || 'Warm, authentic & trustworthy');
  const [hasSaved, setHasSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSaveBusiness({
        id: activeBusiness.id,
        businessName: name.trim(),
        businessType: type,
        town: town.trim(),
        targetAudience: targetAudience.trim(),
        websiteUrl: websiteUrl.trim(),
        brandTone,
      });
      setHasSaved(true);
      setTimeout(() => setHasSaved(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNew = () => {
    if (onAddNewBusiness) {
      onAddNewBusiness();
    } else {
      setName('');
      setType(CATEGORIES[0]);
      setTown('');
      setTargetAudience('');
      setWebsiteUrl('');
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '36px 24px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 6,
            }}
          >
            <Building2 size={13} />
            <span>Brand Context</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Businesses
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Business Profiles & Brand Context — manage store details and audience persona used across all creative directions and scripts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddNew}
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={15} style={{ color: 'var(--accent-primary)' }} />
          <span>Add Another Business</span>
        </button>
      </div>

      {/* Multiple Businesses Selector (if more than 1) */}
      {businesses.length > 1 && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, marginBottom: 20 }}>
          {businesses.map((b) => {
            const isSelected = (activeBusiness.id && b.id === activeBusiness.id) || b.businessName === name;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onSelectBusiness(b);
                  setName(b.businessName || '');
                  setType(b.businessType || CATEGORIES[0]);
                  setTown(b.town || '');
                  setTargetAudience(b.targetAudience || '');
                  setWebsiteUrl(b.websiteUrl || '');
                  setBrandTone(b.brandTone || 'Warm, authentic & trustworthy');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                  border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Store size={14} style={{ color: isSelected ? 'var(--accent-primary)' : 'inherit' }} />
                <span>{b.businessName}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Form */}
      <form
        onSubmit={handleSave}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 14,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Business Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Indore Kirana Store"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                fontSize: 13,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Industry Category
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                fontSize: 13,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                color: 'var(--text-primary)',
              }}
            >
              {CATEGORIES.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              City / Town
            </label>
            <input
              type="text"
              value={town}
              onChange={(e) => setTown(e.target.value)}
              placeholder="e.g. Indore, Madhya Pradesh"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                fontSize: 13,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Website or Catalog Link
            </label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="e.g. https://mybusiness.com"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                fontSize: 13,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            Target Audience Persona
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g. Local homemakers, everyday neighborhood shoppers, festival celebrators"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px',
              fontSize: 13,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            Brand Tone & Personality
          </label>
          <input
            type="text"
            value={brandTone}
            onChange={(e) => setBrandTone(e.target.value)}
            placeholder="e.g. Relatable everyday, warm humor, trusted neighborhood staple"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px',
              fontSize: 13,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
          {hasSaved && (
            <span style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={14} />
              <span>Business Profile Saved!</span>
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            style={{
              backgroundColor: 'var(--accent-primary)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 13,
              fontWeight: 700,
              color: '#FFFFFF',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 10px var(--accent-glow)',
            }}
          >
            <Save size={14} />
            <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
