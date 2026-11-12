
// Unfinished videos are saved as drafts: ordinary projects with status 'in_progress' and a snapshot of the
// creation flow in creativeDNA.draft, so My Projects can resume them where the user left off — including a
// render that was still running (draft.render.runId), which is polled again instead of being re-rendered.

// Short, readable title fragment from a brief: cuts on a word boundary and marks the cut.
function briefSnippet(brief, max = 30) {
  const text = String(brief || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = (lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : text.slice(0, max)).replace(/[\s,.;:–—-]+$/, '');
  return `${base}…`;
}

const DRAFT_STATUS = 'in_progress';

// Simple Studio's three steps, as stage names for projects.current_stage
const SIMPLE_STEP_STAGES = { 1: 'brief', 2: 'script', 3: 'video' };
const SIMPLE_STAGE_STEPS = { brief: 1, script: 2, video: 3 };

// Product photos are kept in a draft only up to this size (base64 chars), so autosaves stay light
const MAX_DRAFT_PHOTO_CHARS = 3 * 1024 * 1024;

function draftOf(project) {
  return (project && project.creativeDNA && project.creativeDNA.draft) || null;
}

// A draft is an unfinished video: no video yet, and saved in progress (or carrying a flow snapshot)
function isDraft(project) {
  return Boolean(project) && !project.videoUrl && (project.status === DRAFT_STATUS || Boolean(draftOf(project)));
}

function isRenderingDraft(project) {
  const draft = draftOf(project);
  return isDraft(project) && Boolean(draft && draft.render && draft.render.runId);
}

// My Projects order: drafts first (most recently touched first), then everything else in its existing order
function sortProjectsForLibrary(projects) {
  const time = (p) => Date.parse((p && (p.updatedAt || p.createdAt)) || 0) || 0;
  return (projects || [])
    .map((p, i) => ({ p, i, draft: isDraft(p) }))
    .sort((a, b) => {
      if (a.draft !== b.draft) return a.draft ? -1 : 1;
      return a.draft ? time(b.p) - time(a.p) : a.i - b.i;
    })
    .map((x) => x.p);
}

// Where opening a project should take the user: null for anything that isn't a resumable draft
function resumeTargetOf(project) {
  const draft = draftOf(project);
  if (!draft || (project && project.videoUrl)) return null;
  const studio = draft.studio === 'simple' ? 'simple' : 'guided';
  const stage = draft.currentStage || project.currentStage || 'brief';
  return {
    studio,
    stage,
    simpleStep: studio === 'simple' ? (SIMPLE_STAGE_STEPS[stage] || 1) : null,
    runId: (draft.render && draft.render.runId) || null,
  };
}

// Keep a product photo in the draft only when it is small enough; never its blob preview URL
function draftPhoto(photo) {
  if (!photo || typeof photo.data !== 'string' || photo.data.length > MAX_DRAFT_PHOTO_CHARS) return null;
  return { name: photo.name || 'Product photo', mime: photo.mime, data: photo.data };
}

// The /api/projects payload for a draft save.
// simple: Simple Studio's state { step, brief, language, creativeStyle, duration, aspectRatio, productPhoto, packages, selectedPackageId }
// guided: { currentStage, completedStages, context, stages, scenes, character1, character2, setting, shotSpec }
// render: { runId, startedAt } while a render is running
function buildDraftProject({ id, businessId = null, businessName = '', businessType = '', town = '', brandContext = null, studio, simple = null, guided = null, render = null }) {
  const isSimple = studio === 'simple';
  // Simple Studio's produce step only means something while a render runs; otherwise resume on script choice
  const simpleStep = isSimple && simple ? (simple.step === 3 && !(render && render.runId) ? 2 : (simple.step || 1)) : 1;
  const currentStage = isSimple ? (SIMPLE_STEP_STAGES[simpleStep] || 'brief') : ((guided && guided.currentStage) || 'brief');
  const completedStages = isSimple
    ? ['brief', 'script', 'video'].slice(0, simpleStep - 1)
    : ((guided && guided.completedStages) || []);
  const brief = String((isSimple ? simple && simple.brief : guided && guided.context && guided.context.brief) || '').trim();
  const selectedPackage = isSimple && simple && Array.isArray(simple.packages)
    ? simple.packages.find((p) => p && p.id === simple.selectedPackageId) || null
    : null;

  const draft = {
    studio: isSimple ? 'simple' : 'guided',
    currentStage,
    savedAt: new Date().toISOString(),
    simple: isSimple && simple ? { ...simple, step: simpleStep, productPhoto: draftPhoto(simple.productPhoto) } : null,
    guided: !isSimple && guided
      ? {
          ...guided,
          context: guided.context
            ? {
                ...guided.context,
                productPhoto: draftPhoto(guided.context.productPhoto),
                // per-video logo: a removal (null) is kept; "not decided" (undefined) is left out
                ...(guided.context.videoLogo === undefined ? {} : { videoLogo: guided.context.videoLogo && draftPhoto(guided.context.videoLogo) }),
              }
            : null,
        }
      : null,
    render: render && render.runId ? { runId: render.runId, startedAt: render.startedAt || new Date().toISOString() } : null,
  };

  return {
    id,
    title: `${businessName || 'Brand'} - ${brief ? briefSnippet(brief, 30) : 'New video'}`,
    businessId,
    businessName,
    businessType,
    town,
    brief,
    status: DRAFT_STATUS,
    currentStage,
    completedStages,
    scenes: isSimple ? (selectedPackage && Array.isArray(selectedPackage.scenes) ? selectedPackage.scenes : []) : ((guided && guided.scenes) || []),
    character1: (isSimple ? selectedPackage && selectedPackage.character1 : guided && guided.character1) || '',
    character2: (isSimple ? selectedPackage && selectedPackage.character2 : guided && guided.character2) || '',
    setting: (isSimple ? selectedPackage && selectedPackage.setting : guided && guided.setting) || '',
    shotSpec: (!isSimple && guided && guided.shotSpec) || null,
    stages: (!isSimple && guided && guided.stages) || null,
    aiUnderstanding: (!isSimple && guided && guided.aiUnderstanding) || null,
    creativeGuardrails: isSimple ? ((simple && simple.creativeGuardrails) || null) : ((guided && guided.creativeGuardrails) || null),
    eventContext: isSimple ? ((simple && simple.eventContext) || null) : ((guided && guided.eventContext) || null),
    creativeDNA: { draft },
    brandContext,
  };
}

// Support both CommonJS (Node.js test runner) and ES Modules (Vite)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DRAFT_STATUS,
    draftOf,
    isDraft,
    isRenderingDraft,
    sortProjectsForLibrary,
    resumeTargetOf,
    buildDraftProject,
    briefSnippet,
  };
}
