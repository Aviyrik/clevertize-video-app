/**
 * CLEVERTIZE V2 — STUDIO REDUCER & CENTRALIZED STATE MANAGEMENT
 * Milestone 2B: Pure, zero-dependency state reducer with atomic invalidation
 * and stale async network response protection.
 *
 * Compatible with Node.js test runner (CommonJS) and Vite frontend (ESM).
 */

const STAGE_ORDER = [
  'business', // Stage 1
  'brief',    // Stage 2
  'settings', // Stage 3
  'idea',     // Stage 4
  'opening',  // Stage 5
  'story',    // Stage 6
  'script',   // Stage 7
  'video',    // Stage 8
];

const STAGE_NUMBER_MAP = {
  business: 1,
  brief: 2,
  settings: 3,
  idea: 4,
  opening: 5,
  story: 6,
  script: 7,
  video: 8,
};

const StudioActionTypes = {
  SET_STAGE: 'SET_STAGE',
  MARK_STAGE_COMPLETE: 'MARK_STAGE_COMPLETE',
  REWIND_STAGES: 'REWIND_STAGES',
  SET_COMPLETED_STAGES: 'SET_COMPLETED_STAGES',
  SET_EXPLICIT_CHOICE: 'SET_EXPLICIT_CHOICE',
  SET_EXPLICIT_CHOICES: 'SET_EXPLICIT_CHOICES',
  SET_BRIEF: 'SET_BRIEF',
  SET_PRODUCT_IMAGE: 'SET_PRODUCT_IMAGE',
  SET_DIRECTIONS: 'SET_DIRECTIONS',
  SELECT_DIRECTION: 'SELECT_DIRECTION',
  SET_CUSTOM_DIRECTION: 'SET_CUSTOM_DIRECTION',
  SET_HOOKS: 'SET_HOOKS',
  SELECT_HOOK: 'SELECT_HOOK',
  SET_CUSTOM_HOOK: 'SET_CUSTOM_HOOK',
  SET_STORY_WORLD: 'SET_STORY_WORLD',
  UPDATE_STORY_WORLD: 'UPDATE_STORY_WORLD',
  SET_CONSTRAINTS: 'SET_CONSTRAINTS',
  ADD_CONSTRAINT: 'ADD_CONSTRAINT',
  REMOVE_CONSTRAINT: 'REMOVE_CONSTRAINT',
  SET_AVOID_DETAILS: 'SET_AVOID_DETAILS',
  ADD_AVOID_DETAIL: 'ADD_AVOID_DETAIL',
  REMOVE_AVOID_DETAIL: 'REMOVE_AVOID_DETAIL',
  SET_GENERATED_SCRIPT: 'SET_GENERATED_SCRIPT',
  SET_SCENES: 'SET_SCENES',
  UPDATE_SCENE: 'UPDATE_SCENE',
  SET_ACTIVE_SCENE_INDEX: 'SET_ACTIVE_SCENE_INDEX',
  SET_VIDEO_STATUS: 'SET_VIDEO_STATUS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_STALE_WARNING: 'SET_STALE_WARNING',
  INVALIDATE_DOWNSTREAM: 'INVALIDATE_DOWNSTREAM',
  RESET_STUDIO: 'RESET_STUDIO',
};

function createInitialStudioState(overrides = {}) {
  const initialStage = overrides.currentStage || 'business';
  return {
    // Stage navigation
    currentStage: initialStage,
    stageNumber: STAGE_NUMBER_MAP[initialStage] || 1,
    completedStages: overrides.completedStages || [],
    hasStaleWarning: false,
    requestSequence: 0, // Monotonic counter: increments on invalidation / reset

    // Explicit user selections (V4: defaults are never implicit choices)
    explicitChoices: {
      style: null,
      language: null,
      platform: null,
      duration: null,
      idea: null,
      opening: null,
      ...(overrides.explicitChoices || {}),
    },

    // Stage 2: Brief & Assets
    brief: overrides.brief || '',
    productImage: overrides.productImage || null,
    productImageName: overrides.productImageName || null,

    // Stage 4: Directions / Ideas
    directionsList: overrides.directionsList || [],
    selectedDirection: overrides.selectedDirection || null,
    customDirection: overrides.customDirection || '',

    // Stage 5: Hooks / Openings
    hooksList: overrides.hooksList || [],
    selectedHook: overrides.selectedHook || null,
    customHook: overrides.customHook || '',

    // Stage 6: Story World & Narrative DNA
    storyWorldData: overrides.storyWorldData || null,
    customConstraints: overrides.customConstraints || [],
    customAvoidDetails: overrides.customAvoidDetails || [],

    // Stage 7: Script Synthesis & Scenes
    generatedScript: overrides.generatedScript || null,
    scenes: overrides.scenes || [],
    activeSceneIndex: 0,

    // Stage 8: Video Generation
    videoStatus: 'idle', // 'idle' | 'rendering' | 'completed' | 'error'
    videoUrl: '',
    downloadUrl: '',
    shareStatus: '',

    // Scoped async loading flags
    loading: {
      directions: false,
      hooks: false,
      storyWorld: false,
      synthesis: false,
      video: false,
      research: false,
      ...(overrides.loading || {}),
    },

    // Scoped error messages
    errors: {
      directions: null,
      hooks: null,
      storyWorld: null,
      synthesis: null,
      video: null,
      general: null,
      ...(overrides.errors || {}),
    },
  };
}

const initialStudioState = createInitialStudioState();

/**
 * Checks whether an async response's sequenceId is stale compared to the current state.
 */
function isStaleResponse(state, sequenceId) {
  if (typeof sequenceId !== 'number') return false;
  return sequenceId < state.requestSequence;
}

/**
 * Central studio reducer function
 */
function studioReducer(state, action) {
  if (!action || !action.type) return state;

  // Stale async response rejection: discard responses initiated before recent invalidation/reset
  if (
    action.payload &&
    typeof action.payload.sequenceId === 'number' &&
    isStaleResponse(state, action.payload.sequenceId)
  ) {
    return state;
  }

  switch (action.type) {
    case StudioActionTypes.SET_STAGE: {
      const stage = action.payload.stage;
      if (!STAGE_ORDER.includes(stage)) return state;
      return {
        ...state,
        currentStage: stage,
        stageNumber: STAGE_NUMBER_MAP[stage] || 1,
      };
    }

    case StudioActionTypes.MARK_STAGE_COMPLETE: {
      const stageId = action.payload.stageId;
      if (!stageId || state.completedStages.includes(stageId)) return state;
      return {
        ...state,
        completedStages: [...state.completedStages, stageId],
      };
    }

    case StudioActionTypes.REWIND_STAGES: {
      const allowedStages = action.payload.allowedStages || [];
      return {
        ...state,
        completedStages: state.completedStages.filter((s) => allowedStages.includes(s)),
      };
    }

    case StudioActionTypes.SET_COMPLETED_STAGES: {
      return {
        ...state,
        completedStages: Array.isArray(action.payload.completedStages)
          ? action.payload.completedStages
          : state.completedStages,
      };
    }

    case StudioActionTypes.SET_EXPLICIT_CHOICE: {
      const { key, value } = action.payload;
      if (!key) return state;
      return {
        ...state,
        explicitChoices: {
          ...state.explicitChoices,
          [key]: value,
        },
      };
    }

    case StudioActionTypes.SET_EXPLICIT_CHOICES: {
      return {
        ...state,
        explicitChoices: {
          style: null,
          language: null,
          platform: null,
          duration: null,
          idea: null,
          opening: null,
          ...(action.payload.explicitChoices || {}),
        },
      };
    }

    case StudioActionTypes.SET_BRIEF: {
      return {
        ...state,
        brief: action.payload.brief || '',
      };
    }

    case StudioActionTypes.SET_PRODUCT_IMAGE: {
      return {
        ...state,
        productImage: action.payload.image || null,
        productImageName: action.payload.name || null,
      };
    }

    case StudioActionTypes.SET_DIRECTIONS: {
      return {
        ...state,
        directionsList: action.payload.directionsList || [],
        loading: { ...state.loading, directions: false },
        errors: { ...state.errors, directions: null },
      };
    }

    case StudioActionTypes.SELECT_DIRECTION: {
      const dir = action.payload.direction || null;
      return {
        ...state,
        selectedDirection: dir,
        explicitChoices: {
          ...state.explicitChoices,
          idea: dir ? (dir.title || dir.heading || dir.tension || null) : null,
        },
      };
    }

    case StudioActionTypes.SET_CUSTOM_DIRECTION: {
      return {
        ...state,
        customDirection: action.payload.customDirection || '',
      };
    }

    case StudioActionTypes.SET_HOOKS: {
      return {
        ...state,
        hooksList: action.payload.hooksList || [],
        loading: { ...state.loading, hooks: false },
        errors: { ...state.errors, hooks: null },
      };
    }

    case StudioActionTypes.SELECT_HOOK: {
      const hook = action.payload.hook || null;
      return {
        ...state,
        selectedHook: hook,
        explicitChoices: {
          ...state.explicitChoices,
          opening: hook ? (hook.hookLine || hook.title || null) : null,
        },
      };
    }

    case StudioActionTypes.SET_CUSTOM_HOOK: {
      return {
        ...state,
        customHook: action.payload.customHook || '',
      };
    }

    case StudioActionTypes.SET_STORY_WORLD: {
      return {
        ...state,
        storyWorldData: action.payload.storyWorldData || null,
        loading: { ...state.loading, storyWorld: false },
        errors: { ...state.errors, storyWorld: null },
      };
    }

    case StudioActionTypes.UPDATE_STORY_WORLD: {
      return {
        ...state,
        storyWorldData: {
          ...(state.storyWorldData || {}),
          ...(action.payload.patch || {}),
        },
      };
    }

    case StudioActionTypes.SET_CONSTRAINTS: {
      return {
        ...state,
        customConstraints: action.payload.constraints || [],
      };
    }

    case StudioActionTypes.ADD_CONSTRAINT: {
      const val = (action.payload.constraint || '').trim();
      if (!val || state.customConstraints.includes(val)) return state;
      return {
        ...state,
        customConstraints: [...state.customConstraints, val],
      };
    }

    case StudioActionTypes.REMOVE_CONSTRAINT: {
      const index = action.payload.index;
      return {
        ...state,
        customConstraints: state.customConstraints.filter((_, idx) => idx !== index),
      };
    }

    case StudioActionTypes.SET_AVOID_DETAILS: {
      return {
        ...state,
        customAvoidDetails: action.payload.avoidDetails || [],
      };
    }

    case StudioActionTypes.ADD_AVOID_DETAIL: {
      const val = (action.payload.avoidDetail || '').trim();
      if (!val || state.customAvoidDetails.includes(val)) return state;
      return {
        ...state,
        customAvoidDetails: [...state.customAvoidDetails, val],
      };
    }

    case StudioActionTypes.REMOVE_AVOID_DETAIL: {
      const index = action.payload.index;
      return {
        ...state,
        customAvoidDetails: state.customAvoidDetails.filter((_, idx) => idx !== index),
      };
    }

    case StudioActionTypes.SET_GENERATED_SCRIPT: {
      const script = action.payload.script || null;
      const scriptScenes = Array.isArray(action.payload.scenes)
        ? action.payload.scenes
        : script && Array.isArray(script.scenes)
          ? script.scenes
          : state.scenes;

      return {
        ...state,
        generatedScript: script,
        scenes: scriptScenes,
        loading: { ...state.loading, synthesis: false },
        errors: { ...state.errors, synthesis: null },
      };
    }

    case StudioActionTypes.SET_SCENES: {
      return {
        ...state,
        scenes: action.payload.scenes || [],
      };
    }

    case StudioActionTypes.UPDATE_SCENE: {
      const { index, scene } = action.payload;
      const nextScenes = [...state.scenes];
      nextScenes[index] = scene;
      return {
        ...state,
        scenes: nextScenes,
      };
    }

    case StudioActionTypes.SET_ACTIVE_SCENE_INDEX: {
      return {
        ...state,
        activeSceneIndex: action.payload.index || 0,
      };
    }

    case StudioActionTypes.SET_VIDEO_STATUS: {
      return {
        ...state,
        videoStatus: action.payload.status || 'idle',
        videoUrl: action.payload.videoUrl !== undefined ? action.payload.videoUrl : state.videoUrl,
        downloadUrl: action.payload.downloadUrl !== undefined ? action.payload.downloadUrl : state.downloadUrl,
        shareStatus: action.payload.shareStatus !== undefined ? action.payload.shareStatus : state.shareStatus,
        loading: { ...state.loading, video: action.payload.status === 'rendering' },
        errors: {
          ...state.errors,
          video: action.payload.status === 'error' ? (action.payload.error || 'Video render failed') : null,
        },
      };
    }

    case StudioActionTypes.SET_LOADING: {
      const { key, isLoading } = action.payload;
      return {
        ...state,
        loading: {
          ...state.loading,
          [key]: Boolean(isLoading),
        },
      };
    }

    case StudioActionTypes.SET_ERROR: {
      const { key, error } = action.payload;
      return {
        ...state,
        errors: {
          ...state.errors,
          [key]: error || null,
        },
      };
    }

    case StudioActionTypes.CLEAR_ERROR: {
      const key = action.payload.key;
      return {
        ...state,
        errors: {
          ...state.errors,
          [key]: null,
        },
      };
    }

    case StudioActionTypes.SET_STALE_WARNING: {
      return {
        ...state,
        hasStaleWarning: Boolean(action.payload.hasStaleWarning),
      };
    }

    /**
     * Centralized Downstream Invalidation Cascade
     */
    case StudioActionTypes.INVALIDATE_DOWNSTREAM: {
      const fromStage = action.payload.fromStage || 'settings';
      const hadDownstream = Boolean(
        state.directionsList.length > 0 ||
        state.selectedDirection ||
        state.hooksList.length > 0 ||
        state.selectedHook ||
        state.storyWorldData ||
        state.scenes.length > 0 ||
        state.generatedScript
      );

      const nextSequence = state.requestSequence + 1;

      if (fromStage === 'settings' || fromStage === 'language' || fromStage === 'style') {
        const nextChoices = { ...state.explicitChoices };
        delete nextChoices.idea;
        delete nextChoices.opening;

        return {
          ...state,
          requestSequence: nextSequence,
          directionsList: [],
          selectedDirection: null,
          customDirection: '',
          hooksList: [],
          selectedHook: null,
          customHook: '',
          storyWorldData: null,
          generatedScript: null,
          scenes: [],
          activeSceneIndex: 0,
          videoStatus: 'idle',
          videoUrl: '',
          downloadUrl: '',
          explicitChoices: nextChoices,
          completedStages: state.completedStages.filter((s) => ['business', 'brief', 'settings'].includes(s)),
          hasStaleWarning: hadDownstream,
        };
      }

      if (fromStage === 'idea') {
        const nextChoices = { ...state.explicitChoices };
        delete nextChoices.opening;

        return {
          ...state,
          requestSequence: nextSequence,
          hooksList: [],
          selectedHook: null,
          customHook: '',
          storyWorldData: null,
          generatedScript: null,
          scenes: [],
          activeSceneIndex: 0,
          videoStatus: 'idle',
          videoUrl: '',
          downloadUrl: '',
          explicitChoices: nextChoices,
          completedStages: state.completedStages.filter((s) => ['business', 'brief', 'settings', 'idea'].includes(s)),
          hasStaleWarning: Boolean(state.scenes.length > 0 || state.generatedScript),
        };
      }

      if (fromStage === 'opening') {
        return {
          ...state,
          requestSequence: nextSequence,
          storyWorldData: null,
          generatedScript: null,
          scenes: [],
          activeSceneIndex: 0,
          videoStatus: 'idle',
          videoUrl: '',
          downloadUrl: '',
          completedStages: state.completedStages.filter((s) =>
            ['business', 'brief', 'settings', 'idea', 'opening'].includes(s)
          ),
          hasStaleWarning: Boolean(state.scenes.length > 0 || state.generatedScript),
        };
      }

      if (fromStage === 'story') {
        return {
          ...state,
          requestSequence: nextSequence,
          generatedScript: null,
          scenes: [],
          activeSceneIndex: 0,
          videoStatus: 'idle',
          videoUrl: '',
          downloadUrl: '',
          completedStages: state.completedStages.filter((s) =>
            ['business', 'brief', 'settings', 'idea', 'opening', 'story'].includes(s)
          ),
          hasStaleWarning: Boolean(state.scenes.length > 0 || state.generatedScript),
        };
      }

      if (fromStage === 'script') {
        return {
          ...state,
          requestSequence: nextSequence,
          videoStatus: 'idle',
          videoUrl: '',
          downloadUrl: '',
          completedStages: state.completedStages.filter((s) =>
            ['business', 'brief', 'settings', 'idea', 'opening', 'story', 'script'].includes(s)
          ),
          hasStaleWarning: false,
        };
      }

      return state;
    }

    /**
     * Predictable Atomic New Film Reset
     * Restarts film workflow without leaking downstream film artifacts.
     */
    case StudioActionTypes.RESET_STUDIO: {
      const initialStage = action.payload?.initialStage || 'business';
      const initialCompleted = action.payload?.preserveBrand ? ['business'] : [];
      return {
        ...createInitialStudioState({
          currentStage: initialStage,
          completedStages: initialCompleted,
        }),
        requestSequence: state.requestSequence + 1,
      };
    }

    default:
      return state;
  }
}

// Support both CommonJS (Node.js test runner) and ES Modules (Vite)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STAGE_ORDER,
    STAGE_NUMBER_MAP,
    StudioActionTypes,
    createInitialStudioState,
    initialStudioState,
    isStaleResponse,
    studioReducer,
  };
}
