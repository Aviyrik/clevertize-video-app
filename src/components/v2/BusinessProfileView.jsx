import React from 'react';
import {
  Store,
  MapPin,
  Users,
  Globe,
  Check,
  Plus,
  Building2,
  Sparkles,
  Edit3,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export function resolveLogoUrl(logo) {
  if (!logo) return null;
  if (typeof logo === 'string') return logo;
  if (logo.previewUrl) return logo.previewUrl;
  if (logo.data) return `data:${logo.mime || 'image/png'};base64,${logo.data}`;
  return null;
}

export function getInitials(name) {
  if (!name) return 'B';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getAvatarGradient(name) {
  const gradients = [
    'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
    'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
    'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
  ];
  if (!name) return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

export default function BusinessProfileView({
  businesses = [],
  activeBusiness = {},
  onSelectBusiness,
  onEditBusiness,
  onAddNewBusiness,
  onSaveBusiness,
}) {
  // Use user businesses list, or fallback to active business if available
  const displayBusinesses =
    businesses && businesses.length > 0
      ? businesses
      : activeBusiness && (activeBusiness.businessName || activeBusiness.name)
      ? [activeBusiness]
      : [];

  const activeName = (activeBusiness?.businessName || activeBusiness?.name || '').trim().toLowerCase();

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '36px 24px 60px' }}>
      {/* Breadcrumb & Section Header */}
      <div style={{ marginBottom: 30 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 8,
          }}
        >
          <Building2 size={13} />
          <span>Brand Context</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Businesses
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Business Profiles & Brand Context — manage store details, logos, and target customer context used across all creative directions and video scripts.
        </p>
      </div>

      {/* Grid of Business Cards + Add Another Business Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {displayBusinesses.map((biz, idx) => {
          const bName = biz.businessName || biz.name || 'Unnamed Business';
          const bType = biz.businessType || biz.category || 'Retail Store';
          const bTown = biz.town || '';
          const bAudience = biz.targetAudience || '';
          const bTone = biz.brandTone || 'Warm & Authentic';
          const bUrl = biz.websiteUrl || '';
          const logoSrc = resolveLogoUrl(biz.brandLogo || biz.logo);
          const isActive =
            (activeBusiness?.id && biz.id === activeBusiness.id) ||
            bName.trim().toLowerCase() === activeName;

          return (
            <div
              key={biz.id || idx}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: isActive ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-default)',
                borderRadius: 14,
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
                boxShadow: isActive ? '0 8px 24px rgba(99, 102, 241, 0.16)' : '0 4px 16px rgba(0, 0, 0, 0.15)',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Top Row: Avatar & Brand Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                  {/* Business Logo / Avatar */}
                  <div style={{ flexShrink: 0 }}>
                    {logoSrc ? (
                      <img
                        src={logoSrc}
                        alt={bName}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          objectFit: 'cover',
                          border: '1.5px solid var(--border-subtle)',
                          backgroundColor: '#151821',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          background: getAvatarGradient(bName),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontSize: 20,
                          fontWeight: 800,
                          letterSpacing: '-0.02em',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        {getInitials(bName)}
                      </div>
                    )}
                  </div>

                  {/* Brand Title & Badges */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 17,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                        }}
                        title={bName}
                      >
                        {bName}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 11,
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontWeight: 600,
                        }}
                      >
                        {bType}
                      </span>
                      {isActive && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: 'var(--accent-primary)',
                            backgroundColor: 'rgba(99, 102, 241, 0.12)',
                            border: '1px solid var(--accent-primary)',
                            padding: '2px 7px',
                            borderRadius: 10,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          ★ Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata Details */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    fontSize: 12,
                  }}
                >
                  {/* Location */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                    <MapPin size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {bTown || 'City / Town not specified'}
                    </span>
                  </div>

                  {/* Brand Tone */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                    <Sparkles size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {bTone}
                    </span>
                  </div>

                  {/* Website */}
                  {bUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Globe size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                      <a
                        href={bUrl.startsWith('http') ? bUrl : `https://${bUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: 'var(--accent-primary)',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span>{bUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-subtle)',
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => onEditBusiness && onEditBusiness(biz)}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 7,
                    padding: '7px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                >
                  <Edit3 size={13} />
                  <span>Edit Details</span>
                </button>

                {isActive ? (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Active in Studio</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectBusiness && onSelectBusiness(biz)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid var(--accent-primary)',
                      borderRadius: 7,
                      padding: '7px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--accent-primary)';
                    }}
                  >
                    <Check size={13} />
                    <span>Set Active</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Beside the added businesses: Add Another Business Card */}
        <div
          onClick={onAddNewBusiness}
          style={{
            minHeight: 250,
            border: '2px dashed var(--border-default)',
            borderRadius: 14,
            backgroundColor: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.14)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.18)',
            }}
          >
            <Plus size={24} />
          </div>
          <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            Add Another Business
          </h4>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5, maxWidth: 220 }}>
            Set up a new brand profile with guided creation & logo upload.
          </p>
        </div>
      </div>
    </div>
  );
}
