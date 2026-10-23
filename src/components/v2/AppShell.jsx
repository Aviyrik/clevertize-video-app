import React, { useState } from 'react';
import {
  Clapperboard,
  Sparkles,
  FileCode2,
  Globe,
  Plus,
  Store,
  Settings2,
  Check,
  ChevronRight,
  Wifi,
  WifiOff,
  Film,
  Layers,
  ArrowRight,
  RotateCcw,
  FileText,
  Building2,
  User,
  LogIn,
  LogOut,
  Bookmark,
  Menu,
  X,
  ChevronsUpDown,
  Zap,
  Sliders,
} from 'lucide-react';
import { resolveLogoUrl, getInitials, getAvatarGradient } from './BusinessProfileView.jsx';

const STUDIO_STAGES = [
  { id: 'brief', num: '01', label: 'Brief' },
  { id: 'settings', num: '02', label: 'Settings' },
  { id: 'idea', num: '03', label: 'Idea' },
  { id: 'opening', num: '04', label: 'Opening' },
  { id: 'story', num: '05', label: 'Story' },
  { id: 'script', num: '06', label: 'Script' },
  { id: 'video', num: '07', label: 'Video' },
];

export default function AppShell({
  children,
  activeView = 'studio', // 'hub' | 'studio' | 'library' | 'business'
  onSelectView,
  currentStage = 'brief',
  completedStages = [],
  onNavigateStage,
  onStartNewFilm,
  businessName = '',
  businessType = '',
  town = '',
  brandLogo = null,
  activeBusiness = null,
  businesses = [],
  onSelectBusiness,
  onAddNewBusiness,
  onEditBrand,
  onOpenScriptModal,
  onOpenUrlModal,
  isOnline = true,
  hasStaleWarning = false,
  onApplyUpdate,
  currentUser = null,
  onOpenAuthModal,
  onOpenAccountModal,
  onLogout,
  onOpenOnboarding,
  projectCount = 0,
  studioMode = 'simple',
  onToggleStudioMode,
  onSetStudioMode,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false);
  const currentStageObj = STUDIO_STAGES.find((s) => s.id === currentStage) || STUDIO_STAGES[0];

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="app-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
          }}
        />
      )}

      {/* Translucent / Frosted Glass Left Navigation Sidebar */}
      <aside
        className={`app-sidebar-container ${mobileMenuOpen ? 'open' : ''}`}
        style={{
          width: 270,
          height: '100vh',
          position: 'sticky',
          top: 0,
          flexShrink: 0,
          backgroundColor: 'rgba(16, 18, 24, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 100,
          overflow: 'hidden',
        }}
      >
        {/* Sidebar Header & Brand Identity */}
        <div>
          <div
            style={{
              padding: '20px 20px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  backgroundColor: 'var(--accent-primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px var(--accent-glow)',
                }}
              >
                <Clapperboard size={18} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  CleverCut
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--accent-primary)',
                backgroundColor: 'var(--accent-subtle)',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              MVP
            </span>
          </div>

          {/* New Project Primary CTA */}
          <div style={{ padding: '16px 16px 12px' }}>
            <button
              type="button"
              onClick={onStartNewFilm}
              style={{
                width: '100%',
                backgroundColor: 'var(--accent-primary)',
                border: 'none',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 700,
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 12px var(--accent-glow)',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus size={16} />
              <span>New Film Project</span>
            </button>
          </div>

          {/* Current Business / Brand Card */}
          {(() => {
            const hasBusinesses = Array.isArray(businesses) && businesses.length > 0;
            const activeLogo = resolveLogoUrl(brandLogo || activeBusiness?.brandLogo || activeBusiness?.logo);

            if (!hasBusinesses) {
              return (
                <div style={{ padding: '0 16px 16px' }}>
                  <div
                    onClick={() => {
                      if (onAddNewBusiness) onAddNewBusiness();
                      else if (onOpenOnboarding) onOpenOnboarding();
                    }}
                    style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.08)',
                      border: '1.5px dashed var(--accent-primary)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)';
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: 'var(--accent-primary)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Plus size={16} />
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        Set Up Business
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        Click to add your business
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div style={{ padding: '0 16px 16px', position: 'relative' }}>
                <div
                  onClick={() => {
                    if (businesses && businesses.length > 1) {
                      setBusinessDropdownOpen((prev) => !prev);
                    } else if (onSelectView) {
                      onSelectView('businesses');
                    }
                  }}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 10,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
                    {activeLogo ? (
                      <img
                        src={activeLogo}
                        alt={businessName}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '1px solid var(--border-subtle)',
                          backgroundColor: '#151821',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: getAvatarGradient(businessName),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontSize: 12,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(businessName)}
                      </div>
                    )}
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {businessName || 'Configure Brand'}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-tertiary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {businessType || 'Retail Store'} {town ? `· ${town}` : ''}
                      </div>
                    </div>
                  </div>

                  {businesses && businesses.length > 1 ? (
                    <div
                      style={{
                        color: 'var(--text-tertiary)',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Switch Business"
                    >
                      <ChevronsUpDown size={15} />
                    </div>
                  ) : (
                    <div
                      style={{
                        color: 'var(--text-tertiary)',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="View Business Details"
                    >
                      <ChevronRight size={15} />
                    </div>
                  )}
                </div>

                {/* Multiple Businesses Floating Switcher Dropdown */}
                {businessDropdownOpen && businesses && businesses.length > 1 && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 998,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setBusinessDropdownOpen(false);
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% - 6px)',
                        left: 16,
                        right: 16,
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 10,
                        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
                        zIndex: 999,
                        padding: '8px 0',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--text-tertiary)',
                          padding: '4px 14px 6px',
                        }}
                      >
                        Switch Active Business ({businesses.length})
                      </div>

                      <div style={{ maxHeight: 210, overflowY: 'auto' }}>
                        {businesses.map((biz, idx) => {
                          const bName = biz.businessName || biz.name || 'Unnamed Business';
                          const bType = biz.businessType || biz.category || 'Retail Store';
                          const bLogo = resolveLogoUrl(biz.brandLogo || biz.logo);
                          const isCurrent = bName.trim().toLowerCase() === (businessName || '').trim().toLowerCase();

                          return (
                            <div
                              key={biz.id || idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectBusiness) onSelectBusiness(biz);
                                setBusinessDropdownOpen(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 14px',
                                cursor: 'pointer',
                                backgroundColor: isCurrent ? 'var(--bg-elevated)' : 'transparent',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
                                {bLogo ? (
                                  <img
                                    src={bLogo}
                                    alt={bName}
                                    style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: 26,
                                      height: 26,
                                      borderRadius: 6,
                                      background: getAvatarGradient(bName),
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#FFFFFF',
                                      fontSize: 10,
                                      fontWeight: 800,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {getInitials(bName)}
                                  </div>
                                )}
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      fontWeight: isCurrent ? 700 : 500,
                                      color: 'var(--text-primary)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {bName}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: 'var(--text-tertiary)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {bType}
                                  </div>
                                </div>
                              </div>

                              {isCurrent && (
                                <Check size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '6px 0 2px' }} />

                      {onAddNewBusiness && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setBusinessDropdownOpen(false);
                            onAddNewBusiness();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '7px 14px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--accent-primary)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Plus size={14} />
                          <span>Add Another Business</span>
                        </div>
                      )}

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setBusinessDropdownOpen(false);
                          if (onSelectView) onSelectView('businesses');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 14px',
                          fontSize: 12,
                          fontWeight: 500,
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Building2 size={14} />
                        <span>Manage All Businesses</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* Workspace Views Navigation */}
          <div style={{ padding: '0 12px 16px' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '4px 10px 8px',
              }}
            >
              Workspace Views
            </div>

            {/* Creative Studio Link (Unified with Creation Hub) */}
            <div
              onClick={() => {
                // If user is already on the Creation Hub screen (the 3 starting options), stay on the screen!
                if (activeView === 'hub' || activeView === 'home') {
                  setMobileMenuOpen(false);
                  return;
                }
                const hasActiveWork = Boolean(
                  currentStage &&
                  currentStage !== 'brief' &&
                  currentStage !== 'entry' &&
                  completedStages &&
                  completedStages.length > 0
                );
                onSelectView(hasActiveWork ? 'studio' : 'hub');
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: (activeView === 'studio' || activeView === 'home' || activeView === 'hub') ? 'var(--bg-active)' : 'transparent',
                color: (activeView === 'studio' || activeView === 'home' || activeView === 'hub') ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: (activeView === 'studio' || activeView === 'home' || activeView === 'hub') ? 700 : 500,
                marginBottom: 3,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Film size={16} style={{ color: (activeView === 'studio' || activeView === 'home' || activeView === 'hub') ? 'var(--accent-primary)' : 'inherit' }} />
                <span>Creative Studio</span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  backgroundColor: 'var(--bg-elevated)',
                  padding: '2px 7px',
                  borderRadius: 10,
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                }}
              >
                7 Stages
              </span>
            </div>

            {/* My Projects Link */}
            <div
              onClick={() => {
                onSelectView('projects');
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: (activeView === 'projects' || activeView === 'library') ? 'var(--bg-active)' : 'transparent',
                color: (activeView === 'projects' || activeView === 'library') ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: (activeView === 'projects' || activeView === 'library') ? 700 : 500,
                marginBottom: 3,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clapperboard size={16} style={{ color: (activeView === 'projects' || activeView === 'library') ? 'var(--accent-primary)' : 'inherit' }} />
                <span>My Projects</span>
              </div>
              <span
                title="Video Commercials & Script Library"
                style={{
                  fontSize: 10,
                  backgroundColor: projectCount > 0 ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-elevated)',
                  padding: '2px 7px',
                  borderRadius: 10,
                  color: projectCount > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  fontWeight: projectCount > 0 ? 700 : 500,
                }}
              >
                {projectCount > 0 ? `${projectCount} Videos` : '0 Videos'}
              </span>
            </div>

            {/* My Businesses Link */}
            <div
              onClick={() => {
                onSelectView('businesses');
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: (activeView === 'businesses' || activeView === 'business') ? 'var(--bg-active)' : 'transparent',
                color: (activeView === 'businesses' || activeView === 'business') ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: (activeView === 'businesses' || activeView === 'business') ? 700 : 500,
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={16} style={{ color: (activeView === 'businesses' || activeView === 'business') ? 'var(--accent-primary)' : 'inherit' }} />
                <span>My Businesses</span>
              </div>
              <span
                title="Business Profile & Context"
                style={{
                  fontSize: 10,
                  backgroundColor: 'var(--bg-elevated)',
                  padding: '2px 7px',
                  borderRadius: 10,
                  color: 'var(--text-tertiary)',
                  fontWeight: 600,
                }}
              >
                {businesses.length > 0 ? `${businesses.length}` : '0 Profiles'}
              </span>
            </div>
          </div>

          {/* Creation Hub & Production Pipeline & Script Library & Business Profile test aliases */}
          <div style={{ display: 'none' }}>Creation Hub Production Pipeline Script Library Business Profile</div>
        </div>

        {/* Sidebar Footer & Auth Account */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(11, 12, 16, 0.5)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* User Account / Login Trigger */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            {currentUser ? (
              <div
                onClick={onOpenAccountModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 8,
                  cursor: onOpenAccountModal ? 'pointer' : 'default',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (onOpenAccountModal) e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  if (onOpenAccountModal) e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Account Settings"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name || 'User'}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid var(--border-subtle)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-subtle)',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.name || currentUser.email}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentUser.email}
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                {/* onLogout action is placed inside AccountModal */}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: '7px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <LogIn size={13} style={{ color: 'var(--accent-primary)' }} />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>

          <div
            style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isOnline ? (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: 'var(--success)',
                    display: 'inline-block',
                  }}
                />
              ) : (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: 'var(--error)',
                    display: 'inline-block',
                  }}
                />
              )}
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
              v2.0-script-mvp
            </span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: 60,
            flexShrink: 0,
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(16, 18, 24, 0.75)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 90,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                padding: '6px 8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Toggle Menu"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
              {(activeView === 'projects' || activeView === 'library')
                ? 'My Projects'
                : (activeView === 'businesses' || activeView === 'business')
                ? 'My Businesses'
                : (activeView === 'home' || activeView === 'hub' || currentStage === 'entry')
                ? 'Creation Hub'
                : 'Creative Studio'}
            </span>
            <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {(activeView === 'projects' || activeView === 'library')
                ? 'Video Commercials & Projects'
                : (activeView === 'businesses' || activeView === 'business')
                ? 'Brand Profiles & Context'
                : (activeView === 'home' || activeView === 'hub' || currentStage === 'entry')
                ? 'Choose Entry Point'
                : studioMode === 'simple'
                ? 'Simple Studio · 3-Step Creation'
                : `Stage ${currentStageObj.num} · ${currentStageObj.label}`}
            </span>

            {/* Indicator 1: Pure indicator of active mode (shows current mode accurately, non-clickable) */}
            {activeView === 'studio' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  marginLeft: 10,
                  padding: '3px 10px',
                  borderRadius: 14,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: studioMode === 'simple' ? 'rgba(99, 102, 241, 0.14)' : 'rgba(234, 179, 8, 0.14)',
                  color: studioMode === 'simple' ? 'var(--accent-primary)' : '#eab308',
                  border: '1px solid ' + (studioMode === 'simple' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(234, 179, 8, 0.35)'),
                  cursor: 'default',
                  userSelect: 'none',
                }}
              >
                {studioMode === 'simple' ? <Zap size={11} /> : <Sliders size={11} />}
                <span>{studioMode === 'simple' ? 'Simple Studio' : 'Director Mode'}</span>
              </span>
            )}

            {hasStaleWarning && (
              <span
                style={{
                  fontSize: 11,
                  backgroundColor: 'var(--warning-subtle)',
                  color: 'var(--warning)',
                  border: '1px solid var(--warning)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontWeight: 600,
                  marginLeft: 8,
                }}
              >
                Downstream Refreshed
              </span>
            )}
          </div>

          {activeView === 'studio' && (
            <div className="desktop-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Box 2 Mode Switcher Toggle Pill (Fixed on Navbar Top Right) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: 3,
                  gap: 2,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (studioMode !== 'simple') {
                      if (onSetStudioMode) onSetStudioMode('simple');
                      else if (onToggleStudioMode) onToggleStudioMode();
                    }
                  }}
                  title="Switch to Simple Studio (3-Step Fast Video Ad Creation)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 11px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: studioMode === 'simple' ? 700 : 500,
                    backgroundColor: studioMode === 'simple' ? 'var(--accent-primary)' : 'transparent',
                    color: studioMode === 'simple' ? '#FFFFFF' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: studioMode === 'simple' ? 'default' : 'pointer',
                    boxShadow: studioMode === 'simple' ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Zap size={12} />
                  <span>Simple Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (studioMode === 'simple') {
                      if (onSetStudioMode) onSetStudioMode('advanced');
                      else if (onToggleStudioMode) onToggleStudioMode();
                    }
                  }}
                  title="Switch to Director Mode (7-Stage Full Film Control)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 11px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: studioMode !== 'simple' ? 700 : 500,
                    backgroundColor: studioMode !== 'simple' ? 'var(--accent-primary)' : 'transparent',
                    color: studioMode !== 'simple' ? '#FFFFFF' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: studioMode !== 'simple' ? 'default' : 'pointer',
                    boxShadow: studioMode !== 'simple' ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Sliders size={12} />
                  <span>Director Mode</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onStartNewFilm}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
                title="Restart from Stage 1 to make a new film"
              >
                <RotateCcw size={13} />
                <span>Restart Film</span>
              </button>
            </div>
          )}
        </header>

        {/* Dynamic Canvas Workspace */}
        <main
          style={{
            flex: 1,
            background: 'radial-gradient(circle at 50% 0%, #151824 0%, #0B0C10 70%)',
            minHeight: 'calc(100vh - 60px)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
