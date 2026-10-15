import React, { useState } from 'react';
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
  Tag,
  Film,
  CheckCircle2,
  Search,
} from 'lucide-react';

export default function ScriptLibraryView({
  projects = [],
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

  const filteredProjects = projects.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.businessName && p.businessName.toLowerCase().includes(q)) ||
      (p.brief && p.brief.toLowerCase().includes(q))
    );
  });

  const handleCopyScript = async (e, proj) => {
    e.stopPropagation();
    if (!proj.scenes || !proj.scenes.length) return;

    const fullScript = `TITLE: ${proj.title || 'Commercial Script'}\nBUSINESS: ${proj.businessName || 'Brand'}\n\n` +
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
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '36px 24px 60px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
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
            <FileText size={13} />
            <span>Project & Script History</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Projects
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Script Library & Screenplays — resume work on drafts, review approved scripts, or copy scenes.
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
          }}
        >
          <Plus size={16} />
          <span>New Script Project</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 24, position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-tertiary)' }} />
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
            padding: '50px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <FileText size={24} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {searchTerm ? 'No projects matching your search' : 'No saved scripts yet'}
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-secondary)', maxWidth: 440, marginInline: 'auto' }}>
            {searchTerm
              ? 'Try searching with different keywords or clear the search input.'
              : 'Start a new commercial from the Creation Hub to generate and save your first 4-scene script.'}
          </p>
          <button
            type="button"
            onClick={handleCreate}
            style={{
              backgroundColor: 'var(--accent-primary)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 700,
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Sparkles size={14} />
            <span>Create First Script</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 18 }}>
          {filteredProjects.map((proj) => {
            const hasScenes = proj.scenes && proj.scenes.length >= 4;
            const isApproved = proj.status === 'script_approved';
            const formattedDate = new Date(proj.updatedAt || proj.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

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
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: isApproved ? '#10B981' : 'var(--accent-primary)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isApproved ? 'Approved Script' : hasScenes ? 'Script Ready' : 'In Progress'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />
                        {formattedDate}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete project "${proj.title}"?`)) {
                          onDeleteProject(proj.id);
                        }
                      }}
                      title="Delete Project"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 4,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: '0 0 6px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {proj.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    <Store size={13} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontWeight: 600 }}>{proj.businessName || 'Business'}</span>
                    {proj.businessType && <span style={{ color: 'var(--text-tertiary)' }}>· {proj.businessType}</span>}
                  </div>

                  {proj.brief && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        margin: 0,
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
                </div>

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
                  {hasScenes && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyScript(e, proj)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedId === proj.id ? 'var(--success)' : 'var(--text-secondary)',
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
