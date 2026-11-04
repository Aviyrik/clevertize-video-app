/**
 * Video Feedback & Creative Rating (Phase 1: UI Data Structure & Storage)
 *
 * Prepares the canonical feedback data structure and browser-level local persistence
 * for rating completed video projects (Like / Dislike).
 */

export const DISLIKE_REASONS = [
  'Visuals or AI-generated scenes',
  'Script or dialogue',
  'Voiceover or audio',
  'Characters or consistency',
  'Product or brand representation',
  'Creative concept or storytelling',
  'Something else',
];

const RATINGS_STORAGE_KEY = 'clevercut_video_ratings';
const DISMISSED_PROMPTS_KEY = 'clevercut_rating_prompts_dismissed';

/**
 * Checks whether a project is eligible for video feedback / creative rating.
 *
 * Rules:
 * - Only projects with a successfully generated final video are eligible.
 * - Draft projects must not show rating controls.
 * - Incomplete projects must not show rating controls.
 * - Projects with scripts or storyboards but no final video must not show rating controls.
 * - Failed or cancelled generations must not show rating controls.
 */
export function isProjectEligibleForRating(project) {
  if (!project || typeof project !== 'object') return false;

  const url = project.videoUrl;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return false;
  }

  const status = (project.status || '').toLowerCase().trim();
  if (
    status === 'draft' ||
    status === 'incomplete' ||
    status === 'failed' ||
    status === 'cancelled' ||
    status === 'rendering' ||
    status === 'pending'
  ) {
    return false;
  }

  return true;
}

/**
 * Prepares a consistent feedback object matching the Phase 1 specification.
 */
export function createFeedbackPayload({
  userId = null,
  brandId = null,
  projectId = null,
  generationId = null,
  rating = null,
  reasons = [],
  comment = '',
  existingCreatedAt = null,
}) {
  const now = new Date().toISOString();
  return {
    user_id: userId ? String(userId) : null,
    brand_id: brandId ? String(brandId) : null,
    project_id: projectId ? String(projectId) : null,
    generation_id: generationId ? String(generationId) : null,
    rating: rating === 'like' || rating === 'dislike' ? rating : null,
    reasons: Array.isArray(reasons) ? [...reasons] : [],
    comment: typeof comment === 'string' ? comment.trim() : '',
    created_at: existingCreatedAt || now,
    updated_at: now,
  };
}

/**
 * Safe local storage reader for all ratings
 */
export function getStoredRatings() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(RATINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('[videoFeedback] Failed to parse stored ratings:', err);
    return {};
  }
}

/**
 * Retrieve the rating for a specific project by projectId or videoUrl
 */
export function getRatingForProject(projectId, videoUrl) {
  const ratings = getStoredRatings();
  if (projectId && ratings[projectId]) {
    return ratings[projectId];
  }
  if (videoUrl && ratings[videoUrl]) {
    return ratings[videoUrl];
  }
  return null;
}

/**
 * Save rating locally. Dispatches a window event so all mounted components
 * update their state synchronously.
 */
export function saveStoredRating(payload, videoUrl = null) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const ratings = getStoredRatings();
    const key = payload.project_id || videoUrl;
    if (!key) return;

    // Check if an existing rating exists to preserve created_at
    const existing = ratings[key] || (videoUrl ? ratings[videoUrl] : null);
    const finalPayload = {
      ...payload,
      created_at: existing?.created_at || payload.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    ratings[key] = finalPayload;
    if (payload.project_id && videoUrl && payload.project_id !== videoUrl) {
      ratings[videoUrl] = finalPayload;
    }

    window.localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));

    // Dispatch global event for instant UI synchronization
    window.dispatchEvent(
      new CustomEvent('clevercut:rating-changed', {
        detail: { projectId: payload.project_id, videoUrl, payload: finalPayload },
      })
    );
  } catch (err) {
    console.warn('[videoFeedback] Failed to save rating:', err);
  }
}

/**
 * Remove rating locally.
 */
export function removeStoredRating(projectId, videoUrl = null) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const ratings = getStoredRatings();
    let removed = false;
    if (projectId && ratings[projectId]) {
      delete ratings[projectId];
      removed = true;
    }
    if (videoUrl && ratings[videoUrl]) {
      delete ratings[videoUrl];
      removed = true;
    }
    if (removed) {
      window.localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));
      window.dispatchEvent(
        new CustomEvent('clevercut:rating-changed', {
          detail: { projectId, videoUrl, payload: null },
        })
      );
    }
  } catch (err) {
    console.warn('[videoFeedback] Failed to remove rating:', err);
  }
}

/**
 * Dismiss post-generation rating prompt for a project
 */
export function dismissRatingPrompt(projectId, videoUrl = null) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(DISMISSED_PROMPTS_KEY);
    const set = raw ? JSON.parse(raw) : {};
    if (projectId) set[projectId] = true;
    if (videoUrl) set[videoUrl] = true;
    window.localStorage.setItem(DISMISSED_PROMPTS_KEY, JSON.stringify(set));
  } catch (err) {
    console.warn('[videoFeedback] Failed to dismiss prompt:', err);
  }
}

/**
 * Check if the prompt was dismissed
 */
export function isRatingPromptDismissed(projectId, videoUrl = null) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const raw = window.localStorage.getItem(DISMISSED_PROMPTS_KEY);
    const set = raw ? JSON.parse(raw) : {};
    return Boolean((projectId && set[projectId]) || (videoUrl && set[videoUrl]));
  } catch {
    return false;
  }
}
