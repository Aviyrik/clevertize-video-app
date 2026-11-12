/**
 * Onboarding, product tour, and behavior-responsive contextual guidance state.
 * Compatible with Vite (ESM interop) and Node.js test runner / backend (CommonJS).
 */

const ONBOARDING_VERSION = 1;

const DEFAULT_BEHAVIORS = {
  briefSubmittedCount: 0,
  simpleRunsCount: 0,
  directorRunsCount: 0,
  modeSwitchCount: 0,
  editedScriptCount: 0,
  createdAnotherCount: 0,
  aiUnderstandingApprovedCount: 0,
  scriptStudioVisitedCount: 0,
  videoOutputVisitedCount: 0,
};

function createDefaultOnboardingState() {
  return {
    version: ONBOARDING_VERSION,
    welcomeSeen: false,
    tourCompleted: false,
    tourSkipped: false,
    tourPaused: false,
    lastTourStep: 0,
    preferredMode: null, // 'simple' | 'advanced' | null
    modeChosenCount: 0,
    dismissedTips: [],
    seenAnnouncements: [],
    behaviors: { ...DEFAULT_BEHAVIORS },
    updatedAt: null,
  };
}

function toSafeCount(val) {
  const num = Number(val);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

function normalizeOnboardingState(raw) {
  const base = createDefaultOnboardingState();
  if (!raw || typeof raw !== 'object') return base;

  const rawBehaviors = raw.behaviors && typeof raw.behaviors === 'object' ? raw.behaviors : {};
  const behaviors = {};
  Object.keys(DEFAULT_BEHAVIORS).forEach((k) => {
    behaviors[k] = toSafeCount(rawBehaviors[k]);
  });

  const preferredMode =
    raw.preferredMode === 'simple' || raw.preferredMode === 'advanced'
      ? raw.preferredMode
      : null;

  return {
    version: typeof raw.version === 'number' ? raw.version : ONBOARDING_VERSION,
    welcomeSeen: Boolean(raw.welcomeSeen),
    tourCompleted: Boolean(raw.tourCompleted),
    tourSkipped: Boolean(raw.tourSkipped),
    tourPaused: Boolean(raw.tourPaused),
    lastTourStep: toSafeCount(raw.lastTourStep),
    preferredMode,
    modeChosenCount: toSafeCount(raw.modeChosenCount),
    dismissedTips: Array.from(
      new Set((Array.isArray(raw.dismissedTips) ? raw.dismissedTips : []).map((x) => String(x || '').trim()).filter(Boolean))
    ),
    seenAnnouncements: Array.from(
      new Set((Array.isArray(raw.seenAnnouncements) ? raw.seenAnnouncements : []).map((x) => String(x || '').trim()).filter(Boolean))
    ),
    behaviors,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
  };
}

function mergeOnboardingState(current, patch) {
  const normCurrent = normalizeOnboardingState(current);
  if (!patch || typeof patch !== 'object') return normCurrent;

  const mergedBehaviors = { ...normCurrent.behaviors };
  if (patch.behaviors && typeof patch.behaviors === 'object') {
    Object.keys(DEFAULT_BEHAVIORS).forEach((k) => {
      if (patch.behaviors[k] !== undefined) {
        mergedBehaviors[k] = Math.max(mergedBehaviors[k] || 0, toSafeCount(patch.behaviors[k]));
      }
    });
  }

  const dismissedTips = patch.dismissedTips !== undefined
    ? Array.from(new Set([...(normCurrent.dismissedTips || []), ...(Array.isArray(patch.dismissedTips) ? patch.dismissedTips : [])]))
    : normCurrent.dismissedTips;

  const seenAnnouncements = patch.seenAnnouncements !== undefined
    ? Array.from(new Set([...(normCurrent.seenAnnouncements || []), ...(Array.isArray(patch.seenAnnouncements) ? patch.seenAnnouncements : [])]))
    : normCurrent.seenAnnouncements;

  return normalizeOnboardingState({
    ...normCurrent,
    ...patch,
    // Monotonic latches: once seen/completed/skipped, stale snapshots must never revert them
    welcomeSeen: Boolean(normCurrent.welcomeSeen || patch.welcomeSeen),
    tourCompleted: Boolean(normCurrent.tourCompleted || patch.tourCompleted),
    tourSkipped: Boolean(normCurrent.tourSkipped || patch.tourSkipped),
    tourPaused: patch.tourCompleted
      ? false
      : (patch.tourPaused !== undefined ? Boolean(patch.tourPaused) : Boolean(normCurrent.tourPaused)),
    lastTourStep: patch.lastTourStep !== undefined
      ? toSafeCount(patch.lastTourStep)
      : (normCurrent.lastTourStep || 0),
    modeChosenCount: Math.max(normCurrent.modeChosenCount || 0, toSafeCount(patch.modeChosenCount)),
    dismissedTips,
    seenAnnouncements,
    behaviors: mergedBehaviors,
    updatedAt: new Date().toISOString(),
  });
}

function recordBehaviorSignal(state, signalName, incrementBy = 1) {
  const norm = normalizeOnboardingState(state);
  if (!signalName || !Object.prototype.hasOwnProperty.call(DEFAULT_BEHAVIORS, signalName)) {
    return norm;
  }
  return {
    ...norm,
    behaviors: {
      ...norm.behaviors,
      [signalName]: toSafeCount(norm.behaviors[signalName]) + Math.max(1, toSafeCount(incrementBy)),
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Behavioral & dismissal gating for contextual tips.
 * Prevents showing guidance for capabilities the user has dismissed or clearly already mastered.
 */
function shouldShowContextualTip(tipId, state, context = {}) {
  if (!tipId) return false;
  const norm = normalizeOnboardingState(state);
  if (norm.dismissedTips.includes(tipId)) return false;

  const b = norm.behaviors || DEFAULT_BEHAVIORS;

  switch (tipId) {
    case 'tip_try_director':
      // Only show in Simple Mode if user hasn't explored switching or Director runs yet
      if (context.studioMode && context.studioMode !== 'simple') return false;
      if (b.modeSwitchCount > 0 || b.directorRunsCount > 0) return false;
      return true;

    case 'tip_ai_understanding':
      // Retire automatically once user has approved AI Understanding at least twice
      if (b.aiUnderstandingApprovedCount >= 2) return false;
      return true;

    case 'tip_script_customize':
      // Retire once the user has already edited a script scene themselves
      if (b.editedScriptCount >= 1) return false;
      return true;

    case 'tip_create_another_video':
      // Show only on completed video output until dismissed or used
      if (context.hasVideo === false) return false;
      if (b.createdAnotherCount >= 1) return false;
      return true;

    default:
      return true;
  }
}

function shouldAutoTriggerWelcome(state, {
  isAuthenticated = false,
  isAuthChecking = false,
  isOnboardingModalOpen = false,
  isAuthModalOpen = false,
  businessCount = 0,
  isTourActive = false,
} = {}) {
  if (!isAuthenticated || isAuthChecking) return false;
  if (isOnboardingModalOpen || isAuthModalOpen || isTourActive) return false;
  // Wait for initial business setup before showing the product welcome tour
  if (businessCount < 1) return false;
  const norm = normalizeOnboardingState(state);
  if (norm.welcomeSeen || norm.tourCompleted || norm.tourSkipped) return false;
  return true;
}

function onboardingStorageKey(userId) {
  return userId ? `clevertize_onboarding_${userId}` : 'clevertize_onboarding_guest';
}

function loadLocalOnboardingState(userId) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(onboardingStorageKey(userId));
    if (!raw) return null;
    return normalizeOnboardingState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function saveLocalOnboardingState(userId, state) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(onboardingStorageKey(userId), JSON.stringify(normalizeOnboardingState(state)));
  } catch {
    // ignore storage quota failures
  }
}

function hasResumableTourProgress(state, totalSteps = 5) {
  const norm = normalizeOnboardingState(state);
  if (!norm.tourPaused) return false;
  if (norm.lastTourStep < 0 || norm.lastTourStep >= totalSteps) return false;
  return true;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ONBOARDING_VERSION,
    DEFAULT_BEHAVIORS,
    createDefaultOnboardingState,
    normalizeOnboardingState,
    mergeOnboardingState,
    recordBehaviorSignal,
    shouldShowContextualTip,
    shouldAutoTriggerWelcome,
    hasResumableTourProgress,
    onboardingStorageKey,
    loadLocalOnboardingState,
    saveLocalOnboardingState,
  };
}
