import React, { useState, useEffect, useMemo } from 'react';
import { downloadVideoWithTicket } from '../../utils/downloadVideo.js';
import { isVideoLinkExpired } from '../../utils/videoLink.js';
import { isDraft, isRenderingDraft } from '../../utils/drafts.js';
import {
  PROJECTS_PAGE_SIZE,
  classifyProjectStatus,
  computeProjectFilterCounts,
  formatProjectUpdatedAt,
  sortProjects,
  groupProjectsByBusiness,
} from '../../utils/projectLibrary.js';
import { ProjectRatingBar } from './VideoRatingControls.jsx';
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
  AlertTriangle,
  Search,
  Download,
  Play,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Video,
  Languages,
  Sparkle,
  X,
} from 'lucide-react';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #2B2B27, #2B2B27)',
  'linear-gradient(135deg, #2B2B27, #21211E)',
  'linear-gradient(135deg, #2B2B27, #2B2B27)',
  'linear-gradient(135deg, #2B2B27, #21211E)',
  'linear-gradient(135deg, #2B2B27, #2B2B27)',
  'linear-gradient(135deg, #2B2B27, #21211E)',
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
  onBulkDeleteProjects = null,
  currentUser,
  onSignIn,
  isLoadingProjects = false,
}) {
  const handleCreate = onNewProject || onStartNewProject;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'in_progress' | 'completed' | 'attention'
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'business'
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'created'
  const [visibleLimit, setVisibleLimit] = useState(PROJECTS_PAGE_SIZE);
  const [groupLimits, setGroupLimits] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState(null);

  const [copiedId, setCopiedId] = useState(null);
  const [expandedScriptIds, setExpandedScriptIds] = useState({});
  // the card whose video is playing inline, and videos that failed to load
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [unplayableIds, setUnplayableIds] = useState({});

  // Clear selection state when switching user sessions
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedIds([]);
    setShowBulkConfirm(false);
    setBulkFeedback(null);
  }, [currentUser?.id]);

  // Reset pagination when search/filter/sort/view changes
  useEffect(() => {
    setVisibleLimit(PROJECTS_PAGE_SIZE);
    setGroupLimits({});
  }, [searchTerm, statusFilter, sortBy, viewMode]);

  // Close confirmation dialog on Escape when not deleting
  useEffect(() => {
    if (!showBulkConfirm) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape' && !isBulkDeleting) {
        setShowBulkConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showBulkConfirm, isBulkDeleting]);

  const toggleExpandScript = (e, id) => {
    e.stopPropagation();
    setExpandedScriptIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filterCounts = computeProjectFilterCounts(projects, unplayableIds);

  const filteredProjects = useMemo(() => {
    const filtered = (projects || []).filter((p) => {
      if (!p) return false;
      const statusInfo = classifyProjectStatus(p, unplayableIds);
      if (statusFilter !== 'all' && statusInfo.group !== statusFilter) return false;
      if (!searchTerm || !searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      const title = (p.title || '').toLowerCase();
      const biz = (p.businessName || '').toLowerCase();
      const brief = (p.brief || '').toLowerCase();
      const style = (p.creativeStyle || '').toLowerCase();
      const town = (p.town || '').toLowerCase();
      const lang = (p.language || '').toLowerCase();
      const url = (p.videoUrl || '').toLowerCase();
      const statusLabel = statusInfo.label.toLowerCase();
      return (
        title.includes(q) ||
        biz.includes(q) ||
        brief.includes(q) ||
        style.includes(q) ||
        town.includes(q) ||
        lang.includes(q) ||
        url.includes(q) ||
        statusLabel.includes(q)
      );
    });
    return sortProjects(filtered, sortBy);
  }, [projects, unplayableIds, statusFilter, searchTerm, sortBy]);

  // Prune selections that are no longer in the active filtered result set
  useEffect(() => {
    const validSet = new Set(filteredProjects.map((p) => p.id));
    setSelectedIds((prev) => {
      const next = prev.filter((id) => validSet.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredProjects]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allFilteredSelected = filteredProjects.length > 0 && selectedIds.length === filteredProjects.length;

  const businessGroups = useMemo(
    () => (viewMode === 'business' ? groupProjectsByBusiness(filteredProjects, businesses) : []),
    [viewMode, filteredProjects, businesses]
  );

  const visibleProjects = useMemo(
    () => filteredProjects.slice(0, visibleLimit),
    [filteredProjects, visibleLimit]
  );

  const toggleProjectSelection = (projId) => {
    setSelectedIds((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  };

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProjects.map((p) => p.id));
    }
  };

  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
    setShowBulkConfirm(false);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0 || isBulkDeleting) return;
    setIsBulkDeleting(true);
    setBulkFeedback(null);
    const targetIds = [...selectedIds];
    try {
      let result = null;
      if (typeof onBulkDeleteProjects === 'function') {
        result = await onBulkDeleteProjects(targetIds);
      } else if (typeof onDeleteProject === 'function') {
        for (const id of targetIds) {
          await onDeleteProject(id);
        }
        result = { deletedIds: targetIds, notDeletedIds: [] };
      }

      const deletedIds = Array.isArray(result?.deletedIds) ? result.deletedIds : [];
      const notDeletedIds = Array.isArray(result?.notDeletedIds) ? result.notDeletedIds : [];
      const errMsg = result?.error || '';

      setShowBulkConfirm(false);
      if (errMsg && deletedIds.length === 0) {
        setBulkFeedback({ type: 'error', text: errMsg });
      } else if (notDeletedIds.length > 0) {
        setSelectedIds(notDeletedIds);
        setBulkFeedback({
          type: 'warning',
          text: `Deleted ${deletedIds.length} ${deletedIds.length === 1 ? 'project' : 'projects'}. ${notDeletedIds.length} could not be deleted.`,
        });
      } else {
        setIsSelectionMode(false);
        setSelectedIds([]);
        setBulkFeedback({
          type: 'success',
          text: `Deleted ${deletedIds.length} ${deletedIds.length === 1 ? 'project' : 'projects'}.`,
        });
      }
    } finally {
      setIsBulkDeleting(false);
    }
  };

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
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            My Projects
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Script Library &amp; finished videos — resume drafts, copy scenes, or download.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          style={{
            backgroundColor: 'var(--cc-action)',
            border: 'none',
            borderRadius: 999,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--cc-on-action)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={16} />
          <span>New Video Project</span>
        </button>
      </div>

      {/* Search & Status Filters Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-tertiary)' }}
            aria-hidden="true"
          />
          <input
            type="text"
            aria-label="Search projects"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by title, business, or status…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: searchTerm ? '10px 38px 10px 40px' : '10px 14px 10px 40px',
              fontSize: 13,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              color: 'var(--text-primary)',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: 10,
                top: 9,
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: 4,
                display: 'inline-flex',
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div
            role="group"
            aria-label="Filter projects by status"
            data-testid="project-status-filters"
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
          >
            {[
              { id: 'all', label: 'All Projects', count: filterCounts.all },
              { id: 'in_progress', label: 'In Progress', count: filterCounts.in_progress },
              { id: 'completed', label: 'Completed', count: filterCounts.completed },
              ...(filterCounts.attention > 0
                ? [{ id: 'attention', label: 'Needs Attention', count: filterCounts.attention }]
                : []),
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={isSelected}
                  data-testid={`project-filter-${tab.id}`}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 16,
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 600,
                    backgroundColor: isSelected ? 'var(--cc-active)' : 'var(--bg-elevated)',
                    color: isSelected ? 'var(--cc-text-1)' : 'var(--text-secondary)',
                    border: `1px solid ${isSelected ? 'var(--cc-emphasis)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: 10,
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.22)' : 'var(--bg-surface)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-tertiary)',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Switch, Sort & Subtle Select Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div
              role="group"
              aria-label="Project view"
              data-testid="projects-view-switch"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 2,
                borderRadius: 8,
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                gap: 2,
              }}
            >
              {[
                { id: 'all', label: 'All Projects' },
                { id: 'business', label: 'By Business' },
              ].map((opt) => {
                const active = viewMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={active}
                    data-testid={`projects-view-${opt.id}`}
                    onClick={() => setViewMode(opt.id)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 12,
                      fontWeight: active ? 600 : 500,
                      backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <select
              aria-label="Sort projects"
              data-testid="projects-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                height: 31,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <option value="updated">Recently Updated</option>
              <option value="created">Recently Created</option>
            </select>

            {filteredProjects.length > 0 && (
              <button
                type="button"
                aria-pressed={isSelectionMode}
                data-testid="projects-select-mode-btn"
                onClick={() => {
                  if (isSelectionMode) handleExitSelectionMode();
                  else {
                    setIsSelectionMode(true);
                    setBulkFeedback(null);
                  }
                }}
                style={{
                  padding: '5px 12px',
                  height: 31,
                  borderRadius: 8,
                  border: isSelectionMode ? '1px solid var(--cc-selected-line)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelectionMode ? 'rgba(244, 244, 236, 0.07)' : 'var(--bg-elevated)',
                  color: isSelectionMode ? 'var(--cc-emphasis)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isSelectionMode ? 'Done' : 'Select'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Operation Result / Partial Failure Banner */}
      {bulkFeedback && (
        <div
          role={bulkFeedback.type === 'error' ? 'alert' : 'status'}
          data-testid="bulk-delete-feedback"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 12.5,
            fontWeight: 500,
            backgroundColor:
              bulkFeedback.type === 'error'
                ? 'rgba(255, 122, 107, 0.12)'
                : bulkFeedback.type === 'warning'
                  ? 'rgba(242, 184, 75, 0.12)'
                  : 'rgba(95, 212, 174, 0.12)',
            border:
              bulkFeedback.type === 'error'
                ? '1px solid rgba(255, 122, 107, 0.35)'
                : bulkFeedback.type === 'warning'
                  ? '1px solid rgba(242, 184, 75, 0.35)'
                  : '1px solid rgba(95, 212, 174, 0.35)',
            color:
              bulkFeedback.type === 'error'
                ? '#FFA79C'
                : bulkFeedback.type === 'warning'
                  ? 'var(--cc-emphasis)'
                  : 'var(--cc-success)',
          }}
        >
          <span>{bulkFeedback.text}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setBulkFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Sticky Bulk Action Bar */}
      {isSelectionMode && (
        <div
          role="region"
          aria-label="Bulk project actions"
          data-testid="bulk-action-bar"
          style={{
            position: 'sticky',
            top: 12,
            zIndex: 40,
            marginBottom: 18,
            padding: '10px 16px',
            borderRadius: 10,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span
            aria-live="polite"
            data-testid="bulk-selected-count"
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
          >
            {selectedIds.length} {selectedIds.length === 1 ? 'project' : 'projects'} selected
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              data-testid="bulk-select-all-btn"
              onClick={handleToggleSelectAll}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {allFilteredSelected ? 'Deselect All' : 'Select All'}
            </button>

            <button
              type="button"
              data-testid="bulk-cancel-btn"
              onClick={handleExitSelectionMode}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={selectedIds.length === 0 || isBulkDeleting}
              data-testid="bulk-delete-open-btn"
              onClick={() => setShowBulkConfirm(true)}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                border: 'none',
                backgroundColor: 'var(--cc-danger)',
                color: '#1A0703',
                fontSize: 12,
                fontWeight: 600,
                cursor: selectedIds.length === 0 || isBulkDeleting ? 'not-allowed' : 'pointer',
                opacity: selectedIds.length === 0 || isBulkDeleting ? 0.45 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Trash2 size={13} aria-hidden="true" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading State / Empty State / Project Cards Grid */}
      {isLoadingProjects && projects.length === 0 ? (
        <div
          role="status"
          aria-live="polite"
          data-testid="projects-loading-state"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 14,
            padding: '44px 24px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 13,
          }}
        >
          Loading your saved projects and drafts…
        </div>
      ) : filteredProjects.length === 0 ? (
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
          <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
            {searchTerm || statusFilter !== 'all' ? 'No matching projects found' : 'No video projects yet'}
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
            {searchTerm || statusFilter !== 'all'
              ? 'Try clearing your search or filters.'
              : 'Create your first video project to build your library.'}
          </p>
          {(searchTerm || statusFilter !== 'all') ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              Reset filters
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              style={{
                backgroundColor: 'var(--cc-action)',
                border: 'none',
                borderRadius: 999,
                padding: '11px 22px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--cc-on-action)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
              }}
            >
              <Sparkles size={15} />
              <span>Create Video Project</span>
            </button>
          )}
        </div>
      ) : (() => {
        const renderProjectCard = (proj) => {
          const statusInfo = classifyProjectStatus(proj, unplayableIds);
          const { hasScenes, hasVideo, videoExpired, inProgress, rendering, group } = statusInfo;
          const canPlay = hasVideo && !videoExpired && !unplayableIds[proj.id];
          const isPlaying = canPlay && playingVideoId === proj.id;
          const togglePlay = (e) => {
            e.stopPropagation();
              if (canPlay) setPlayingVideoId(isPlaying ? null : proj.id);
          };
          const isExpanded = Boolean(expandedScriptIds[proj.id]);
          const isSelected = isSelectionMode && selectedSet.has(proj.id);

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
          const projectLabel = proj.title || `${bizName} Commercial Video`;
          const formattedDate = formatProjectUpdatedAt(proj.updatedAt || proj.createdAt);

          const isCompleted = group === 'completed';
          const isAttention = group === 'attention';
          const baseBorder = isSelected
            ? '1.5px solid var(--cc-selected-line)'
            : '1px solid var(--border-subtle)';
          // Poster tone: a warm, per-project light so the library reads like footage, not forms
          const posterHue = Array.from(projectLabel).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
          const posterGlow = ['rgba(242, 184, 75, 0.34)', 'rgba(255, 122, 107, 0.26)', 'rgba(141, 184, 255, 0.22)', 'rgba(95, 212, 174, 0.20)'][posterHue % 4];

          return (
            <div
              key={proj.id}
              data-testid={`project-card-${proj.id}`}
              onClick={() => {
                if (isSelectionMode) {
                  toggleProjectSelection(proj.id);
                } else {
                  onOpenProject(proj);
                }
              }}
              style={{
                backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                border: baseBorder,
                borderRadius: 16,
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, transform 0.2s ease',
                backgroundImage: 'var(--cc-sheen)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isSelected ? 'var(--cc-selected-line)' : 'var(--border-subtle)';
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
                    {isSelectionMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        data-testid={`project-select-checkbox-${proj.id}`}
                        aria-label={`Select ${projectLabel}`}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleProjectSelection(proj.id)}
                        style={{
                          width: 17,
                          height: 17,
                          accentColor: 'var(--cc-emphasis)',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />
                    )}
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
                            backgroundColor: '#21211E',
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
                            fontWeight: 600,
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
                            fontWeight: 600,
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
                              fontSize: 11.5,
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
                          fontSize: 11.5,
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
                          e.currentTarget.style.color = 'var(--cc-danger)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Project Title & Brief Snippet */}
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: '0 0 8px',
                      lineHeight: 1.3,
                    }}
                  >
                    {projectLabel}
                  </h3>

                  {/* Status & Attributes Tags (non-color icon + explicit text label) */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {isCompleted ? (
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 500,
                          padding: '2px 0',
                          borderRadius: 4,
                          backgroundColor: 'transparent',
                          color: 'var(--cc-success)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Film size={11} aria-hidden="true" />
                        <span>{statusInfo.label}</span>
                      </span>
                    ) : isAttention ? (
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 500,
                          padding: '2px 0',
                          borderRadius: 4,
                          backgroundColor: 'transparent',
                          color: 'var(--cc-warning)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <AlertTriangle size={11} aria-hidden="true" />
                        <span>{statusInfo.label}</span>
                      </span>
                    ) : (
                      <span
                        title={rendering ? 'Your video was still rendering — open to pick it up' : 'Open to continue where you left off'}
                        style={{
                          fontSize: 12.5,
                          fontWeight: 500,
                          padding: '2px 0',
                          borderRadius: 4,
                          backgroundColor: 'transparent',
                          color: 'var(--cc-warning)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Clock size={11} aria-hidden="true" />
                        <span>{statusInfo.label}</span>
                      </span>
                    )}

                    {proj.creativeStyle && (
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 999,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {proj.creativeStyle}
                      </span>
                    )}

                    {proj.language && (
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 999,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {proj.language}
                      </span>
                    )}
                  </div>

                  {/* Video Section (if generated) with Download Button */}
                  {hasVideo && (
                    <>
                    <div
                      onClick={(e) => e.stopPropagation()} // the video area plays the video; it never opens the project
                      style={{
                        margin: '12px 0',
                        padding: '14px',
                        minHeight: 150,
                        borderRadius: 12,
                        position: 'relative',
                        overflow: 'hidden',
                        background: `radial-gradient(70% 90% at 72% 28%, ${posterGlow}, transparent 62%), linear-gradient(160deg, #26231F 0%, #121110 100%)`,
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <div
                        role={canPlay ? 'button' : undefined}
                        tabIndex={canPlay ? 0 : undefined}
                        aria-label={canPlay ? (isPlaying ? `Hide video for ${proj.title || 'project'}` : `Play video for ${proj.title || 'project'}`) : undefined}
                        onClick={togglePlay}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            togglePlay(e);
                          }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: canPlay ? 'pointer' : 'default' }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.92)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0A0A09',
                            flexShrink: 0,
                            boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                          }}
                        >
                          <Play size={15} fill="#0A0A09" style={{ marginLeft: 2 }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>
                            Generated Commercial
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.72)' }}>
                            {videoExpired
                              ? 'Link expired — open the project and generate the video again'
                              : unplayableIds[proj.id]
                                ? 'This video can\x27t be played right now — its link may have expired'
                                : isPlaying ? 'Playing — click to hide' : 'Click to play · ready to download & share'}
                          </div>
                        </div>
                      </div>

                      {!videoExpired && (
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
                          backgroundColor: 'rgba(18, 18, 16, 0.4)',
                          WebkitBackdropFilter: 'blur(14px)',
                          backdropFilter: 'blur(14px)',
                          color: '#FFFFFF',
                          borderRadius: 999,
                          fontSize: 12.5,
                          fontWeight: 500,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
                          transition: 'background 0.15s ease',
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(18, 18, 16, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(18, 18, 16, 0.4)';
                        }}
                      >
                        <Download size={13} />
                        <span>Download Video</span>
                      </a>
                      )}
                    </div>

                    {isPlaying && (
                      <div onClick={(e) => e.stopPropagation()} style={{ margin: '-4px 0 12px', borderRadius: 8, overflow: 'hidden', backgroundColor: '#000000' }}>
                        <video
                          src={proj.videoUrl}
                          controls
                          autoPlay
                          playsInline
                          onError={() => {
                            setUnplayableIds((prev) => ({ ...prev, [proj.id]: true }));
                            setPlayingVideoId(null);
                          }}
                          style={{ width: '100%', maxHeight: 360, display: 'block', objectFit: 'contain' }}
                        />
                      </div>
                    )}
                    </>
                  )}

                  {/* Creative Video Rating (Like / Dislike) — only for completed projects */}
                  {hasVideo && !videoExpired && (
                    <ProjectRatingBar
                      project={proj}
                      userId={currentUser?.id}
                      brandId={proj.businessId}
                      generationId={proj.runId}
                    />
                  )}

                  {/* Brief / Campaign Description */}
                  <p
                    style={{
                      fontSize: 12,
                      color: proj.brief ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                      fontStyle: proj.brief ? 'normal' : 'italic',
                      margin: '0 0 12px',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {proj.brief || 'No brief summary saved yet'}
                  </p>

                  {/* Expandable Script Scenes Drawer */}
                  {hasScenes && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Hide' : 'View'} script (${proj.scenes.length} scenes) for ${projectLabel}`}
                        onClick={(e) => toggleExpandScript(e, proj.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          fontSize: 12,
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
                            fontSize: 12,
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
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
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
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  {hasScenes ? (() => {
                    const copyStyle = {
                      background: 'none',
                      border: 'none',
                      color: copiedId === proj.id ? 'var(--cc-success)' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                    };
                    const copyLabel = copiedId === proj.id
                      ? 'Copied'
                      : (proj.scenes.length === 4 ? 'Copy 4 Scenes' : `Copy ${proj.scenes.length} Scenes`);
                    const copyInner = (
                      <>
                        {copiedId === proj.id ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                        <span>{copyLabel}</span>
                      </>
                    );
                    return proj.scenes.length === 4 ? (
                      <button
                        type="button"
                        onClick={(e) => handleCopyScript(e, proj)}
                        aria-label={`Copy 4-scene script for ${projectLabel}`}
                        style={copyStyle}
                      >
                        {copyInner}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleCopyScript(e, proj)}
                        aria-label={`Copy ${proj.scenes.length}-scene script for ${projectLabel}`}
                        style={copyStyle}
                      >
                        {copyInner}
                      </button>
                    );
                  })() : (
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {statusInfo.stageHint ? `Last step: ${statusInfo.stageHint}` : 'No script generated yet'}
                    </span>
                  )}

                  <button
                    type="button"
                    aria-label={`${inProgress ? 'Resume' : 'Open'} ${projectLabel} in Studio`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelectionMode) {
                        toggleProjectSelection(proj.id);
                      } else {
                        onOpenProject(proj);
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px 6px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--cc-emphasis)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginLeft: 'auto',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{inProgress && !rendering ? 'Resume in Studio' : 'Open in Studio'}</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          };

          if (viewMode === 'business') {
            return (
              <div data-testid="projects-by-business-view" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {businessGroups.map((grp) => {
                  const isCollapsed = Boolean(collapsedGroups[grp.key]);
                  const grpLimit = groupLimits[grp.key] || PROJECTS_PAGE_SIZE;
                  const visibleGroupProjects = grp.projects.slice(0, grpLimit);
                  const hasMoreInGroup = visibleGroupProjects.length < grp.projects.length;
                  const grpLogo = resolveLogoUrl(grp.business?.brandLogo || grp.business?.logo);

                  return (
                    <section
                      key={grp.key}
                      data-testid={`business-group-${grp.key}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                      }}
                    >
                      <button
                        type="button"
                        aria-expanded={!isCollapsed}
                        data-testid={`business-group-toggle-${grp.key}`}
                        onClick={() =>
                          setCollapsedGroups((prev) => ({ ...prev, [grp.key]: !prev[grp.key] }))
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 10,
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          {isCollapsed ? (
                            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
                          )}
                          {grpLogo ? (
                            <img
                              src={grpLogo}
                              alt=""
                              style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <div
                              aria-hidden="true"
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                background: grp.isOther ? 'var(--bg-elevated)' : getAvatarGradient(grp.name),
                                color: grp.isOther ? 'var(--text-secondary)' : '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11.5,
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              {grp.isOther ? '—' : getInitials(grp.name)}
                            </div>
                          )}
                          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {grp.name}
                          </span>
                          <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                            — {grp.projects.length} {grp.projects.length === 1 ? 'project' : 'projects'}
                          </span>
                        </div>
                      </button>

                      {!isCollapsed && (
                        <>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(min(330px, 100%), 1fr))',
                              gap: 20,
                            }}
                          >
                            {visibleGroupProjects.map(renderProjectCard)}
                          </div>

                          {hasMoreInGroup && (
                            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
                              <button
                                type="button"
                                data-testid={`business-group-load-more-${grp.key}`}
                                onClick={() =>
                                  setGroupLimits((prev) => ({
                                    ...prev,
                                    [grp.key]: grpLimit + PROJECTS_PAGE_SIZE,
                                  }))
                                }
                                style={{
                                  padding: '8px 18px',
                                  borderRadius: 8,
                                  border: '1px solid var(--border-default)',
                                  backgroundColor: 'var(--bg-elevated)',
                                  color: 'var(--text-primary)',
                                  fontSize: 12.5,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Show more in {grp.name} ({grp.projects.length - visibleGroupProjects.length} remaining)
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </section>
                  );
                })}
              </div>
            );
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div
                data-testid="projects-all-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(330px, 100%), 1fr))',
                  gap: 20,
                }}
              >
                {visibleProjects.map(renderProjectCard)}
              </div>

              {(filteredProjects.length > PROJECTS_PAGE_SIZE || visibleProjects.length < filteredProjects.length) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    paddingTop: 6,
                  }}
                >
                  <span data-testid="projects-pagination-summary" style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                    Showing {visibleProjects.length} of {filteredProjects.length} projects
                  </span>

                  {visibleProjects.length < filteredProjects.length && (
                    <button
                      type="button"
                      data-testid="projects-load-more-btn"
                      onClick={() => setVisibleLimit((prev) => prev + PROJECTS_PAGE_SIZE)}
                      style={{
                        padding: '9px 20px',
                        borderRadius: 8,
                        border: '1px solid var(--border-default)',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Load More ({Math.min(PROJECTS_PAGE_SIZE, filteredProjects.length - visibleProjects.length)} more)
                    </button>
                  )}
                </div>
              )}
            </div>
          );
      })()}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-delete-dialog-title"
          data-testid="bulk-delete-modal"
          onClick={() => {
            if (!isBulkDeleting) setShowBulkConfirm(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              maxWidth: 440,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h2
              id="bulk-delete-dialog-title"
              style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}
            >
              Delete {selectedIds.length} {selectedIds.length === 1 ? 'project' : 'projects'}?
            </h2>
            <p style={{ margin: '0 0 22px', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              This will permanently delete the selected projects and their associated generated content. Business profiles will not be affected.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                disabled={isBulkDeleting}
                data-testid="bulk-delete-cancel-btn"
                onClick={() => setShowBulkConfirm(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isBulkDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                data-testid="bulk-delete-confirm-btn"
                onClick={handleConfirmBulkDelete}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--cc-danger)',
                  color: '#1A0703',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isBulkDeleting ? 'wait' : 'pointer',
                  opacity: isBulkDeleting ? 0.7 : 1,
                }}
              >
                {isBulkDeleting ? 'Deleting…' : 'Delete Projects'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
