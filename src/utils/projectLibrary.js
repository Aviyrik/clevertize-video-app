const { isVideoLinkExpired } = require('./videoLink.js');
const { isDraft, isRenderingDraft } = require('./drafts.js');

const STAGE_LABELS = {
  brief: 'Brief',
  settings: 'Settings',
  understanding: 'AI Review',
  idea: 'Ideas',
  opening: 'Opening',
  story: 'Story',
  script: 'Script',
  video: 'Video',
};

function resolveStageLabel(proj = {}) {
  const stage = (proj.creativeDNA && proj.creativeDNA.draft && proj.creativeDNA.draft.currentStage) || proj.currentStage || '';
  if (!stage) return '';
  return STAGE_LABELS[stage] || stage;
}

/**
 * Classifies a project into an honest lifecycle group using only existing persisted fields.
 * Never invents statuses or failure states absent from existing project data.
 */
function classifyProjectStatus(proj = {}, unplayableIds = {}) {
  const hasScenes = Array.isArray(proj.scenes) && proj.scenes.length > 0;
  const hasVideo = Boolean(proj.videoUrl);
  const videoExpired = hasVideo && isVideoLinkExpired(proj.videoUrl);
  const unplayable = hasVideo && Boolean(unplayableIds && unplayableIds[proj.id]);
  const rendering = !hasVideo && isRenderingDraft(proj);
  const inProgressDraft = !hasVideo && isDraft(proj);
  const stageHint = resolveStageLabel(proj);

  if (hasVideo && (videoExpired || unplayable)) {
    return {
      group: 'attention',
      label: videoExpired ? 'Needs Attention · Link Expired' : 'Needs Attention · Video Unavailable',
      shortLabel: 'Needs Attention',
      hasScenes,
      hasVideo,
      videoExpired,
      unplayable,
      inProgress: false,
      rendering: false,
      stageHint,
    };
  }

  if (hasVideo) {
    return {
      group: 'completed',
      label: 'Completed · Video Ready',
      shortLabel: 'Completed',
      hasScenes,
      hasVideo,
      videoExpired: false,
      unplayable: false,
      inProgress: false,
      rendering: false,
      stageHint,
    };
  }

  if (rendering) {
    return {
      group: 'in_progress',
      label: 'In Progress · Rendering',
      shortLabel: 'In Progress',
      hasScenes,
      hasVideo: false,
      videoExpired: false,
      unplayable: false,
      inProgress: true,
      rendering: true,
      stageHint,
    };
  }

  if (hasScenes && !inProgressDraft) {
    return {
      group: 'in_progress',
      label: 'In Progress · Script Ready',
      shortLabel: 'In Progress',
      hasScenes,
      hasVideo: false,
      videoExpired: false,
      unplayable: false,
      inProgress: true,
      rendering: false,
      stageHint: stageHint || 'Script',
    };
  }

  return {
    group: 'in_progress',
    label: stageHint ? `In Progress · ${stageHint}` : 'In Progress · Draft',
    shortLabel: 'In Progress',
    hasScenes,
    hasVideo: false,
    videoExpired: false,
    unplayable: false,
    inProgress: true,
    rendering: false,
    stageHint,
  };
}

function computeProjectFilterCounts(projects = [], unplayableIds = {}) {
  const counts = { all: 0, in_progress: 0, completed: 0, attention: 0 };
  for (const p of projects || []) {
    if (!p) continue;
    counts.all += 1;
    const cls = classifyProjectStatus(p, unplayableIds);
    if (cls.group === 'completed') counts.completed += 1;
    else if (cls.group === 'attention') counts.attention += 1;
    else counts.in_progress += 1;
  }
  return counts;
}

function formatProjectUpdatedAt(rawDate, nowMs = Date.now()) {
  if (!rawDate) return 'Updated recently';
  const dateObj = new Date(rawDate);
  if (Number.isNaN(dateObj.getTime())) return 'Updated recently';

  const now = new Date(nowMs);
  const sameDay =
    dateObj.getFullYear() === now.getFullYear() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getDate() === now.getDate();

  const timePart = dateObj.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (sameDay) {
    return `Today, ${timePart}`;
  }

  const datePart = dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
  return `${datePart}, ${timePart}`;
}

const PROJECTS_PAGE_SIZE = 24;

function parseProjectTimestamp(raw) {
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? 0 : ms;
}

function sortProjects(projects = [], sortBy = 'updated') {
  const list = [...(projects || []).filter(Boolean)];
  return list.sort((a, b) => {
    const aMs = sortBy === 'created'
      ? parseProjectTimestamp(a.createdAt || a.updatedAt)
      : parseProjectTimestamp(a.updatedAt || a.createdAt);
    const bMs = sortBy === 'created'
      ? parseProjectTimestamp(b.createdAt || b.updatedAt)
      : parseProjectTimestamp(b.updatedAt || b.createdAt);
    return bMs - aMs;
  });
}

function groupProjectsByBusiness(projects = [], businesses = []) {
  const bizMap = new Map();
  for (const biz of businesses || []) {
    if (biz && biz.id) {
      bizMap.set(biz.id, biz);
    }
  }

  const groupMap = new Map();
  const otherProjects = [];

  for (const proj of projects || []) {
    if (!proj) continue;
    const biz = proj.businessId ? bizMap.get(proj.businessId) : null;
    if (biz) {
      if (!groupMap.has(biz.id)) {
        groupMap.set(biz.id, {
          key: biz.id,
          name: biz.businessName || biz.name || 'Business',
          business: biz,
          isOther: false,
          projects: [],
        });
      }
      groupMap.get(biz.id).projects.push(proj);
    } else {
      otherProjects.push(proj);
    }
  }

  const namedGroups = Array.from(groupMap.values()).sort((a, b) => {
    if (b.projects.length !== a.projects.length) return b.projects.length - a.projects.length;
    return a.name.localeCompare(b.name);
  });

  if (otherProjects.length > 0) {
    namedGroups.push({
      key: '__other__',
      name: 'Other Projects',
      business: null,
      isOther: true,
      projects: otherProjects,
    });
  }

  return namedGroups;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PROJECTS_PAGE_SIZE,
    classifyProjectStatus,
    computeProjectFilterCounts,
    formatProjectUpdatedAt,
    resolveStageLabel,
    sortProjects,
    groupProjectsByBusiness,
  };
}
