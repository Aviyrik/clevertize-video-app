import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Check, X, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import {
  DISLIKE_REASONS,
  createFeedbackPayload,
  getRatingForProject,
  saveStoredRating,
  removeStoredRating,
  dismissRatingPrompt,
  isRatingPromptDismissed,
  isProjectEligibleForRating,
} from '../../utils/videoFeedback.js';

/**
 * 1. Project Card Rating Controls (for My Projects / ScriptLibraryView)
 * Compact Like / Dislike buttons with inline/popover feedback for Dislike.
 */
export function ProjectRatingBar({
  project,
  userId = null,
  brandId = null,
  generationId = null,
  style = {},
}) {
  if (!isProjectEligibleForRating(project)) {
    return null;
  }

  const projectId = project?.id || null;
  const videoUrl = project?.videoUrl || null;

  const [ratingData, setRatingData] = useState(() => getRatingForProject(projectId, videoUrl));
  const [showDislikeForm, setShowDislikeForm] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState(() => ratingData?.reasons || []);
  const [comment, setComment] = useState(() => ratingData?.comment || '');

  // Synchronize across open components via global event
  useEffect(() => {
    const handleRatingChanged = (e) => {
      const detail = e.detail;
      if (
        (projectId && detail?.projectId === projectId) ||
        (videoUrl && detail?.videoUrl === videoUrl)
      ) {
        setRatingData(detail.payload);
        if (detail.payload?.rating === 'dislike') {
          setSelectedReasons(detail.payload.reasons || []);
          setComment(detail.payload.comment || '');
        }
      }
    };

    window.addEventListener('clevercut:rating-changed', handleRatingChanged);
    return () => window.removeEventListener('clevercut:rating-changed', handleRatingChanged);
  }, [projectId, videoUrl]);

  const currentRating = ratingData?.rating || null;

  const handleLike = (e) => {
    e?.stopPropagation();
    setShowDislikeForm(false);
    if (currentRating === 'like') {
      // Toggle off
      removeStoredRating(projectId, videoUrl);
      setRatingData(null);
    } else {
      const payload = createFeedbackPayload({
        userId,
        brandId: brandId || project?.businessId || null,
        projectId,
        generationId: generationId || project?.runId || null,
        rating: 'like',
        reasons: [],
        comment: '',
        existingCreatedAt: ratingData?.created_at,
      });
      saveStoredRating(payload, videoUrl);
      setRatingData(payload);
    }
  };

  const handleDislikeClick = (e) => {
    e?.stopPropagation();
    if (currentRating === 'dislike' && !showDislikeForm) {
      // Re-open form to view/edit reasons
      setShowDislikeForm(true);
      return;
    }

    if (currentRating === 'dislike' && showDislikeForm) {
      // Close form
      setShowDislikeForm(false);
      return;
    }

    // Set dislike immediately
    const payload = createFeedbackPayload({
      userId,
      brandId: brandId || project?.businessId || null,
      projectId,
      generationId: generationId || project?.runId || null,
      rating: 'dislike',
      reasons: selectedReasons,
      comment: comment,
      existingCreatedAt: ratingData?.created_at,
    });
    saveStoredRating(payload, videoUrl);
    setRatingData(payload);
    setShowDislikeForm(true);
  };

  const toggleReason = (reason) => {
    setSelectedReasons((prev) => {
      const exists = prev.includes(reason);
      const next = exists ? prev.filter((r) => r !== reason) : [...prev, reason];
      // Auto-save updated reasons
      const payload = createFeedbackPayload({
        userId,
        brandId: brandId || project?.businessId || null,
        projectId,
        generationId: generationId || project?.runId || null,
        rating: 'dislike',
        reasons: next,
        comment: comment,
        existingCreatedAt: ratingData?.created_at,
      });
      saveStoredRating(payload, videoUrl);
      setRatingData(payload);
      return next;
    });
  };

  const handleCommentChange = (e) => {
    const val = e.target.value;
    setComment(val);
    const payload = createFeedbackPayload({
      userId,
      brandId: brandId || project?.businessId || null,
      projectId,
      generationId: generationId || project?.runId || null,
      rating: 'dislike',
      reasons: selectedReasons,
      comment: val,
      existingCreatedAt: ratingData?.created_at,
    });
    saveStoredRating(payload, videoUrl);
    setRatingData(payload);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        marginTop: 10,
        paddingTop: 10,
        borderTop: '1px solid var(--border-subtle)',
        fontSize: 12,
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-tertiary)',
            fontWeight: 500,
          }}
        >
          Rate output:
        </span>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLike}
            title={currentRating === 'like' ? 'Liked (click to remove)' : 'Like this video'}
            aria-label="Like video"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border:
                currentRating === 'like'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid var(--border-subtle)',
              backgroundColor:
                currentRating === 'like' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)',
              color: currentRating === 'like' ? '#10B981' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <ThumbsUp
              size={12}
              fill={currentRating === 'like' ? '#10B981' : 'none'}
              strokeWidth={currentRating === 'like' ? 2.5 : 2}
            />
            <span>Like</span>
          </button>

          {/* Dislike Button */}
          <button
            type="button"
            onClick={handleDislikeClick}
            title={currentRating === 'dislike' ? 'Disliked (click to edit or remove)' : 'Dislike this video'}
            aria-label="Dislike video"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border:
                currentRating === 'dislike'
                  ? '1px solid rgba(239, 68, 68, 0.4)'
                  : '1px solid var(--border-subtle)',
              backgroundColor:
                currentRating === 'dislike' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-elevated)',
              color: currentRating === 'dislike' ? '#EF4444' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            <ThumbsDown
              size={12}
              fill={currentRating === 'dislike' ? '#EF4444' : 'none'}
              strokeWidth={currentRating === 'dislike' ? 2.5 : 2}
            />
            <span>Dislike</span>
          </button>
        </div>
      </div>

      {/* Dislike Optional Feedback Drawer */}
      {showDislikeForm && currentRating === 'dislike' && (
        <div
          style={{
            marginTop: 10,
            padding: 12,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
              What didn't you like about this video?
            </span>
            <button
              type="button"
              onClick={() => setShowDislikeForm(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: 2,
              }}
              title="Close feedback form"
            >
              <X size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {DISLIKE_REASONS.map((reason) => {
              const isSelected = selectedReasons.includes(reason);
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => toggleReason(reason)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isSelected
                      ? '1px solid rgba(239, 68, 68, 0.5)'
                      : '1px solid var(--border-subtle)',
                    backgroundColor: isSelected
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'var(--bg-surface)',
                    color: isSelected ? '#F87171' : 'var(--text-secondary)',
                    transition: 'all 0.1s ease',
                  }}
                >
                  {reason}
                </button>
              );
            })}
          </div>

          <textarea
            value={comment}
            onChange={handleCommentChange}
            placeholder="Tell us what could have been better..."
            rows={2}
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 11,
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 6,
              fontSize: 10,
              color: 'var(--text-tertiary)',
            }}
          >
            <span>Feedback saved locally</span>
            <button
              type="button"
              onClick={() => setShowDislikeForm(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                fontSize: 10,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 2. Post-Generation Feedback Prompt
 * Non-blocking, subtle banner displayed under newly generated videos in Studio.
 */
export function PostGenerationFeedbackPrompt({
  projectId = null,
  videoUrl = null,
  userId = null,
  brandId = null,
  generationId = null,
  style = {},
}) {
  if (!videoUrl) return null;

  const [ratingData, setRatingData] = useState(() => getRatingForProject(projectId, videoUrl));
  const [isDismissed, setIsDismissed] = useState(() => isRatingPromptDismissed(projectId, videoUrl));
  const [showDislikeDrawer, setShowDislikeDrawer] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState(() => ratingData?.reasons || []);
  const [comment, setComment] = useState(() => ratingData?.comment || '');

  // Synchronize across open components via global event
  useEffect(() => {
    const handleRatingChanged = (e) => {
      const detail = e.detail;
      if (
        (projectId && detail?.projectId === projectId) ||
        (videoUrl && detail?.videoUrl === videoUrl)
      ) {
        setRatingData(detail.payload);
        if (detail.payload?.rating === 'dislike') {
          setSelectedReasons(detail.payload.reasons || []);
          setComment(detail.payload.comment || '');
        }
      }
    };

    window.addEventListener('clevercut:rating-changed', handleRatingChanged);
    return () => window.removeEventListener('clevercut:rating-changed', handleRatingChanged);
  }, [projectId, videoUrl]);

  if (isDismissed) return null;

  const currentRating = ratingData?.rating || null;

  const handleDismiss = () => {
    dismissRatingPrompt(projectId, videoUrl);
    setIsDismissed(true);
  };

  const handleLike = () => {
    setShowDislikeDrawer(false);
    const payload = createFeedbackPayload({
      userId,
      brandId,
      projectId,
      generationId,
      rating: 'like',
      reasons: [],
      comment: '',
      existingCreatedAt: ratingData?.created_at,
    });
    saveStoredRating(payload, videoUrl);
    setRatingData(payload);
  };

  const handleDislike = () => {
    const payload = createFeedbackPayload({
      userId,
      brandId,
      projectId,
      generationId,
      rating: 'dislike',
      reasons: selectedReasons,
      comment: comment,
      existingCreatedAt: ratingData?.created_at,
    });
    saveStoredRating(payload, videoUrl);
    setRatingData(payload);
    setShowDislikeDrawer(true);
  };

  const toggleReason = (reason) => {
    setSelectedReasons((prev) => {
      const exists = prev.includes(reason);
      const next = exists ? prev.filter((r) => r !== reason) : [...prev, reason];
      const payload = createFeedbackPayload({
        userId,
        brandId,
        projectId,
        generationId,
        rating: 'dislike',
        reasons: next,
        comment: comment,
        existingCreatedAt: ratingData?.created_at,
      });
      saveStoredRating(payload, videoUrl);
      setRatingData(payload);
      return next;
    });
  };

  const handleCommentChange = (e) => {
    const val = e.target.value;
    setComment(val);
    const payload = createFeedbackPayload({
      userId,
      brandId,
      projectId,
      generationId,
      rating: 'dislike',
      reasons: selectedReasons,
      comment: val,
      existingCreatedAt: ratingData?.created_at,
    });
    saveStoredRating(payload, videoUrl);
    setRatingData(payload);
  };

  return (
    <div
      style={{
        margin: '18px 0 10px',
        padding: '14px 18px',
        borderRadius: 10,
        backgroundColor: 'rgba(26, 29, 38, 0.85)',
        border: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>How did we do?</span>
            {currentRating && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: 4,
                  backgroundColor:
                    currentRating === 'like'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                  color: currentRating === 'like' ? '#10B981' : '#F87171',
                }}
              >
                {currentRating === 'like' ? 'Liked' : 'Disliked'}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              margin: '3px 0 0',
              lineHeight: 1.4,
            }}
          >
            Your feedback helps CleverCut create better videos.
          </p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          {/* Like */}
          <button
            type="button"
            onClick={handleLike}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border:
                currentRating === 'like'
                  ? '1px solid rgba(16, 185, 129, 0.5)'
                  : '1px solid var(--border-default)',
              backgroundColor:
                currentRating === 'like' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)',
              color: currentRating === 'like' ? '#10B981' : 'var(--text-primary)',
              transition: 'all 0.15s ease',
            }}
          >
            <ThumbsUp
              size={14}
              fill={currentRating === 'like' ? '#10B981' : 'none'}
              strokeWidth={currentRating === 'like' ? 2.5 : 2}
            />
            <span>Like</span>
          </button>

          {/* Dislike */}
          <button
            type="button"
            onClick={handleDislike}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border:
                currentRating === 'dislike'
                  ? '1px solid rgba(239, 68, 68, 0.5)'
                  : '1px solid var(--border-default)',
              backgroundColor:
                currentRating === 'dislike' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-elevated)',
              color: currentRating === 'dislike' ? '#EF4444' : 'var(--text-primary)',
              transition: 'all 0.15s ease',
            }}
          >
            <ThumbsDown
              size={14}
              fill={currentRating === 'dislike' ? '#EF4444' : 'none'}
              strokeWidth={currentRating === 'dislike' ? 2.5 : 2}
            />
            <span>Dislike</span>
          </button>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={handleDismiss}
            title="Dismiss rating prompt"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 4,
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Dislike Detail Drawer */}
      {showDislikeDrawer && currentRating === 'dislike' && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              What didn't you like about this video?
            </span>
            <button
              type="button"
              onClick={() => setShowDislikeDrawer(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: 2,
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {DISLIKE_REASONS.map((reason) => {
              const isSelected = selectedReasons.includes(reason);
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => toggleReason(reason)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isSelected
                      ? '1px solid rgba(239, 68, 68, 0.5)'
                      : '1px solid var(--border-subtle)',
                    backgroundColor: isSelected
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'var(--bg-elevated)',
                    color: isSelected ? '#F87171' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {reason}
                </button>
              );
            })}
          </div>

          <textarea
            value={comment}
            onChange={handleCommentChange}
            placeholder="Tell us what could have been better..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px 10px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
              fontSize: 11,
              color: 'var(--text-tertiary)',
            }}
          >
            <span>Saved locally (Phase 1)</span>
            <button
              type="button"
              onClick={() => setShowDislikeDrawer(false)}
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 5,
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
