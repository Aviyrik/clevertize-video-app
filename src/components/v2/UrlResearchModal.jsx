import React, { useState } from 'react';
import { UrlScannerLoader } from './WorkflowLoadingScreen.jsx';
import {
  X,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Store,
  FileText,
  MapPin,
  Tag,
  ExternalLink,
} from 'lucide-react';

export const STANDARD_BUSINESS_CATEGORIES = [
  'Saree, Clothing & Apparel',
  'Jewellery & Accessories',
  'Sweets, Bakery & Restaurant',
  'Kirana, Grocery & Supermarket',
  'Electronics, Mobile & Appliances',
  'Salon, Spa & Beauty',
  'Healthcare, Clinic & Pharmacy',
  'Real Estate & Home Decor',
  'Gym, Fitness & Yoga',
  'Education, Coaching & Tuition',
  'Automobile & Garage',
  'Other Local Business',
];

const URL_PRESETS = [
  {
    name: 'Saree Boutique',
    url: 'https://shreesilksarees.in',
    sampleBrand: 'Shree Silk & Sarees',
    category: 'Saree, Clothing & Apparel',
  },
  {
    name: 'Neighborhood Kirana',
    url: 'https://palasiakirana.com',
    sampleBrand: 'Palasia Kirana Store',
    category: 'Kirana, Grocery & Supermarket',
  },
  {
    name: 'Artisan Jewellery',
    url: 'https://ratnamjewellers.com',
    sampleBrand: 'Ratnam Jewellers',
    category: 'Jewellery & Accessories',
  },
];

export default function UrlResearchModal({
  isOpen,
  onClose,
  onApplyUrlData,
  initialUrl = '',
  businessName = '',
  businessType = '',
  town = '',
}) {
  const [urlInput, setUrlInput] = useState(initialUrl || '');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Editable draft states after scan
  const isDefaultKanti = (businessName || '').trim().toLowerCase() === 'kanti sweets';
  const [draftBrand, setDraftBrand] = useState(isDefaultKanti ? '' : (businessName || ''));
  const [draftCategory, setDraftCategory] = useState(businessType || STANDARD_BUSINESS_CATEGORIES[0]);
  const [draftTown, setDraftTown] = useState(town || '');
  const [draftBrief, setDraftBrief] = useState('');
  const [draftProductPhoto, setDraftProductPhoto] = useState(null);

  // Reset/sync draft states whenever modal opens or initial props change
  React.useEffect(() => {
    if (isOpen) {
      setUrlInput(initialUrl || '');
      const isKanti = (businessName || '').trim().toLowerCase() === 'kanti sweets';
      setDraftBrand(isKanti ? '' : (businessName || ''));
      setDraftCategory(businessType || STANDARD_BUSINESS_CATEGORIES[0]);
      setDraftTown(town || '');
      setScanResult(null);
      setErrorMsg('');
      setDraftBrief('');
      setDraftProductPhoto(null);
    }
  }, [isOpen, initialUrl, businessName, businessType, town]);

  if (!isOpen) return null;

  const handleSelectPreset = (p) => {
    setUrlInput(p.url);
    setDraftBrand(p.sampleBrand);
    setDraftCategory(p.category);
    setScanResult(null);
    setErrorMsg('');
  };

  const handleAnalyzeUrl = async () => {
    if (!urlInput.trim()) {
      setErrorMsg('Please enter a website URL to scan.');
      return;
    }

    setIsScanning(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('clevertize_token');
      const res = await fetch('/api/research/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          url: urlInput.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to scan website.');
      }

      const data = await res.json();
      setScanResult(data);
      if (data.brandName) setDraftBrand(data.brandName);
      if (data.businessType || data.category) setDraftCategory(data.businessType || data.category);
      if (data.town) setDraftTown(data.town);
      if (data.suggestedBrief) setDraftBrief(data.suggestedBrief);
      if (data.productPhoto) setDraftProductPhoto(data.productPhoto);
      else setDraftProductPhoto(null);
    } catch (err) {
      console.warn('[research/url] error:', err.message);
      // Honest fallback based on domain name
      let cleanUrl = urlInput.trim().replace(/^https?:\/\/(www\.)?/, '').split(/[\/.]/)[0];
      cleanUrl = cleanUrl ? cleanUrl.charAt(0).toUpperCase() + cleanUrl.slice(1) : 'My Brand';
      setScanResult({
        status: 'fallback',
        url: urlInput.trim(),
        fetchSucceeded: false,
        message: `Could not connect to URL directly (${err.message}). You can edit the detected details below.`,
        brandName: cleanUrl,
        businessType: draftCategory || STANDARD_BUSINESS_CATEGORIES[0],
        suggestedBrief: `High-converting commercial showcasing the authentic quality and customer care of our brand.`,
      });
      setDraftBrand(cleanUrl);
      setDraftBrief(`High-converting commercial showcasing the authentic quality and customer care of our brand.`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleProceed = () => {
    onApplyUrlData({
      websiteUrl: urlInput.trim(),
      businessName: draftBrand.trim(),
      businessType: draftCategory.trim(),
      town: draftTown.trim(),
      brief: draftBrief.trim(),
      productPhoto: draftProductPhoto,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-elevated)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Start with a Website URL
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                Scan your website, store page, or catalog to extract offerings and generate a video brief.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Or test with sample store:
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {URL_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 6,
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Sparkles size={12} style={{ color: 'var(--accent-primary)' }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Website or Store URL
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="e.g. https://mybusiness.com or myshop.in"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: 14,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAnalyzeUrl();
                }}
              />
              <button
                type="button"
                onClick={handleAnalyzeUrl}
                disabled={isScanning || !urlInput.trim()}
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: isScanning || !urlInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: isScanning || !urlInput.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {isScanning ? (
                  <>
                    <RotateCcw size={14} className="spin" />
                    <span>Scanning…</span>
                  </>
                ) : (
                  <>
                    <Globe size={14} />
                    <span>Scan Website</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              style={{
                backgroundColor: 'var(--error-subtle)',
                border: '1px solid var(--error)',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--error)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Detailed Scanning Progress */}
          {isScanning && (
            <div style={{ marginTop: 8 }}>
              <UrlScannerLoader url={urlInput} compact={true} />
            </div>
          )}

          {/* Extracted Details & Review Section */}
          {scanResult && (
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {/* Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {scanResult.fetchSucceeded ? (
                  <>
                    <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>
                      Successfully Extracted from Website
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning)' }}>
                      {scanResult.message || 'Direct fetch unavailable — review extracted inputs below'}
                    </span>
                  </>
                )}
              </div>

              {/* Editable Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={draftBrand}
                    onChange={(e) => setDraftBrand(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: 13,
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 6,
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Business Category
                  </label>
                  <select
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: 13,
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 6,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {!STANDARD_BUSINESS_CATEGORIES.includes(draftCategory) && draftCategory && (
                      <option value={draftCategory}>{draftCategory}</option>
                    )}
                    {STANDARD_BUSINESS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scraped Real Product Photo Preview */}
              {draftProductPhoto && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                    <img
                      src={draftProductPhoto.previewUrl || `data:${draftProductPhoto.mime || 'image/jpeg'};base64,${draftProductPhoto.data}`}
                      alt="Detected Product"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        objectFit: 'cover',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: '#0F1117',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Detected Product Photo</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                          Scraped from URL
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Directly attached — will appear automatically in your commercial story world.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftProductPhoto(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      fontSize: 11,
                      textDecoration: 'underline',
                      flexShrink: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Drafted Creative Brief (Extracted from Offerings)
                </label>
                <textarea
                  value={draftBrief}
                  onChange={(e) => setDraftBrief(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 13,
                    lineHeight: 1.5,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 6,
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-elevated)',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleProceed}
            disabled={!draftBrand.trim() && !draftBrief.trim()}
            style={{
              backgroundColor: 'var(--accent-primary)',
              border: 'none',
              borderRadius: 6,
              padding: '9px 20px',
              fontSize: 13,
              fontWeight: 700,
              color: '#FFFFFF',
              cursor: !draftBrand.trim() && !draftBrief.trim() ? 'not-allowed' : 'pointer',
              opacity: !draftBrand.trim() && !draftBrief.trim() ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 10px var(--accent-glow)',
            }}
          >
            <span>Proceed to Studio with Brief</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
