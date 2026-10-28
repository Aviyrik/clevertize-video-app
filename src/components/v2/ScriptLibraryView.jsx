import React, { useState } from 'react';
import { downloadVideoWithTicket } from '../../utils/downloadVideo.js';
import {
  FileText,
  Clock,
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Store,
  Film,
  CheckCircle2,
  Search,
  Download,
  Play,
  ChevronDown,
  ChevronUp,
  Video,
  Languages,
  Sparkle,
} from 'lucide-react';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366F1, #8B5CF6)',
  'linear-gradient(135deg, #EC4899, #F43F5E)',
  'linear-gradient(135deg, #10B981, #059669)',
  'linear-gradient(135deg, #F59E0B, #D97706)',
  'linear-gradient(135deg, #3B82F6, #1D4ED8)',
  'linear-gradient(135deg, #8B5CF6, #6D28D9)',
];

function getAvatarGradient(name = '') {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name = '') {
  if (!name) return 'B';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function resolveLogoUrl(rawLogo) {
  if (!rawLogo) return null;
  if (typeof rawLogo === 'string' && (rawLogo.startsWith('data:') || rawLogo.startsWith('http') || rawLogo.startsWith('/'))) {
    return rawLogo;
  }
  if (typeof rawLogo === 'object' && rawLogo.dataUrl) {
    return rawLogo.dataUrl;
  }
  return null;
}

export default function ScriptLibraryView({
  projects = [],
  businesses = [],
  currentProjectId,
  onOpenProject,
  onStartNewProject,
  onNewProject,
  onDeleteProject,
  currentUser,
  onSignIn,
}) {
  const handleCreate = onNewProject || onStartNewProject;
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [expandedScriptIds, setExpandedScriptIds] = useState({});

  const toggleExpandScript = (e, id) => {
    e.stopPropagation();
    setExpandedScriptIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProjects = (projects || []).filter((p) => {
    if (!p) return false;
    if (!searchTerm || !searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const title = (p.title || '').toLowerCase();
    const biz = (p.businessName || '').toLowerCase();
    const brief = (p.brief || '').toLowerCase();
    const style = (p.creativeStyle || '').toLowerCase();
    const town = (p.town || '').toLowerCase();
    const lang = (p.language || '').toLowerCase();
    const url = (p.videoUrl || '').toLowerCase();
    return (
      title.includes(q) ||
      biz.includes(q) ||
      brief.includes(q) ||
      style.includes(q) ||
      town.includes(q) ||
      lang.includes(q) ||
      url.includes(q)
    );
  });

  const handleCopyScript = async (e, proj) => {
    e.stopPropagation();
    if (!proj.scenes || !proj.scenes.length) return;

    const fullScript =
      `TITLE: ${proj.title || 'Commercial Script'}\n` +
      `BUSINESS: ${proj.businessName || 'Brand'}\n` +
      (proj.businessType ? `CATEGORY: ${proj.businessType}\n` : '') +
      (proj.videoUrl ? `VIDEO URL: ${proj.videoUrl}\n` : '') +
      `\n` +
      proj.scenes.map((s, idx) => `--- SCENE ${idx + 1} ---\n${s}`).join('\n\n');

    try {
      await navigator.clipboard.writeText(fullScript);
      setCopiedId(proj.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 60px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
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
            <Video size={13} />
            <span>Video Commercials & Campaigns</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            My Projects
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Video Commercials & Script Library — review past projects, download generated videos, or copy scenes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          style={{
            backgroundColor: 'var(--accent-primary)',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 10px var(--accent-glow)',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={16} />
          <span>New Video Project</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 28, position: 'relative' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-tertiary)' }}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by project title, business, or keywords…"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px 14px 10px 40px',
            fontSize: 13,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-default)',
            borderRadius: 14,
            padding: '54px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Film size={26} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
            {searchTerm ? 'No projects matching your search' : 'No video projects yet'}
          </h3>
          <p
            style={{
              margin: '0 0 22px',
              fontSize: 13,
              color: 'var(--text-secondary)',
              maxWidth: 460,
              marginInline: 'auto',
              lineHeight: 1.5,
            }}
          >
            {searchTerm
              ? 'Try searching with different keywords or clear the search input.'
              : 'Start generating your first AI video commercial in Creative Studio to build your collection.'}
          </p>
          <button
            type="button"
            onClick={handleCreate}
            style={{
              backgroundColor: 'var(--accent-primary)',
              border: 'none',
              borderRadius: 8,
              padding: '11px 22px',
              fontSize: 13,
              fontWeight: 700,
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 10px var(--accent-glow)',
            }}
          >
            <Sparkles size={15} />
            <span>Create Video Project</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: 20,
          }}
        >
          {filteredProjects.map((proj) => {
            const hasScenes = proj.scenes && proj.scenes.length >= 4;
            const hasVideo = Boolean(proj.videoUrl);
            const isExpanded = Boolean(expandedScriptIds[proj.id]);

            // Match business logo
            const matchedBiz = (businesses || []).find(
              (b) =>
                (proj.businessId && b.id === proj.businessId) ||
                (b.businessName && proj.businessName && b.businessName.trim().toLowerCase() === proj.businessName.trim().toLowerCase()) ||
                (b.name && proj.businessName && b.name.trim().toLowerCase() === proj.businessName.trim().toLowerCase())
            );
            const bizLogo = resolveLogoUrl(proj.brandLogo || proj.logo || matchedBiz?.brandLogo || matchedBiz?.logo);
            const bizName = proj.businessName || matchedBiz?.businessName || matchedBiz?.name || 'Brand';
            const bizType = proj.businessType || matchedBiz?.businessType || matchedBiz?.category || '';

            const rawDate = proj.updatedAt || proj.createdAt;
            const dateObj = rawDate ? new Date(rawDate) : new Date();
            const formattedDate = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recently';

            return (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 12,
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div>
                  {/* Business Badge & Date & Actions Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                      {bizLogo ? (
                        <img
                          src={bizLogo}
                          alt={bizName}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            objectFit: 'cover',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: '#151821',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: getAvatarGradient(bizName),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            fontSize: 12,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(bizName)}
                        </div>
                      )}

                      <div style={{ overflow: 'hidden' }}>
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
                          {bizName}
                        </div>
                        {bizType && (
                          <div
                            style={{
                              fontSize: 10,
                              color: 'var(--text-tertiary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {bizType} {proj.town ? `· ${proj.town}` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--text-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <Clock size={11} />
                        {formattedDate}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete project "${proj.title}"?`)) {
                            onDeleteProject(proj.id);
                          }
                        }}
                        title="Delete Project"
                        aria-label={`Delete project ${proj.title || ''}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          cursor: 'pointer',
                          padding: 4,
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#EF4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Project Title */}
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: '0 0 8px',
                      lineHeight: 1.3,
                    }}
                  >
                    {proj.title || `${bizName} Commercial Video`}
                  </h3>

                  {/* Status & Attributes Tags */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {hasVideo ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        <Film size={11} />
                        Video Ready
                      </span>
                    ) : hasScenes ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--accent-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          textTransform: 'uppercase',
                        }}
                      >
                        <CheckCircle2 size={11} />
                        Script Ready
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--text-tertiary)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Draft
                      </span>
                    )}

                    {proj.creativeStyle && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 4,
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {proj.creativeStyle}
                      </span>
                    )}

                    {proj.language && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 4,
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {proj.language}
                      </span>
                    )}
                  </div>

                  {/* Video Section (if generated) with Download Button */}
                  {hasVideo && (
                    <div
                      style={{
                        margin: '12px 0',
                        padding: '12px 14px',
                        borderRadius: 8,
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#10B981',
                            flexShrink: 0,
                          }}
                        >
                          <Play size={15} fill="#10B981" />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            Generated Commercial
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                            Ready to download & share
                          </div>
                        </div>
                      </div>

                      <a
                        href="#"
                        download={`${(proj.title || 'commercial_video').replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            await downloadVideoWithTicket(
                              proj.videoUrl,
                              `${(proj.title || 'commercial_video').replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`
                            );
                          } catch (err) {
                            alert(err.message || 'Download failed');
                          }
                        }}
                        aria-label={`Download generated video for ${proj.title || 'project'}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 12px',
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                          transition: 'background 0.15s ease',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#059669';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#10B981';
                        }}
                      >
                        <Download size={13} />
                        <span>Download Video</span>
                      </a>
                    </div>
                  )}

                  {/* Brief / Objective Snippet */}
                  {proj.brief && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        margin: '0 0 12px',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {proj.brief}
                    </p>
                  )}

                  {/* Expandable Script Scenes Drawer */}
                  {hasScenes && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={(e) => toggleExpandScript(e, proj.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 0',
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                        }}
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        <span>{isExpanded ? 'Hide Script Details' : `View Script (${proj.scenes.length} Scenes)`}</span>
                      </button>

                      {isExpanded && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: '10px 12px',
                            backgroundColor: 'var(--bg-elevated)',
                            borderRadius: 8,
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            border: '1px solid var(--border-subtle)',
                            maxHeight: 180,
                            overflowY: 'auto',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {proj.scenes.map((sceneText, sIdx) => (
                            <div
                              key={sIdx}
                              style={{
                                marginBottom: sIdx === proj.scenes.length - 1 ? 0 : 8,
                                paddingBottom: sIdx === proj.scenes.length - 1 ? 0 : 8,
                                borderBottom: sIdx === proj.scenes.length - 1 ? 'none' : '1px dashed var(--border-subtle)',
                              }}
                            >
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                                Scene {sIdx + 1}:
                              </div>
                              <div style={{ whiteSpace: 'pre-wrap' }}>{sceneText}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls: Copy Script & Open in Studio */}
                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {hasScenes ? (
                    <button
                      type="button"
                      onClick={(e) => handleCopyScript(e, proj)}
                      aria-label={`Copy 4-scene script for ${proj.title || 'project'}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedId === proj.id ? '#10B981' : 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: 0,
                      }}
                    >
                      {copiedId === proj.id ? (
                        <>
                          <Check size={13} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy 4 Scenes</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Draft</div>
                  )}

                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginLeft: 'auto',
                    }}
                  >
                    <span>Open in Studio</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
