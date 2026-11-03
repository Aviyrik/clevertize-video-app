// Project IDs for My Projects. The server upserts on id, so reusing an id overwrites that project:
// right when editing a saved project, wrong for a newly generated video (it erased video history).

function newProjectId() {
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
  return `proj_${Date.now()}_${rand}`;
}

// Which project a render that is starting now will be saved under:
// - the project being edited, if it holds no video yet (its script gets its first video);
// - otherwise a brand-new project, so an earlier video is never overwritten.
// An active id we can't find in the list is treated as "may hold a video" — new id, never overwrite.
function projectIdForRender(activeProjectId, projects) {
  if (activeProjectId) {
    const active = (projects || []).find((p) => p && p.id === activeProjectId);
    if (active && !active.videoUrl) return activeProjectId;
  }
  return newProjectId();
}

// Stable id for a video known only by its URL (the in-session My Projects fallback entry):
// unique per video and the same on every render — never a shared literal.
function projectIdForVideoUrl(url) {
  let h = 0x811c9dc5;
  for (const ch of String(url || '')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `proj_video_${h.toString(36)}`;
}

// A finished video is already in My Projects when some project holds that exact video URL.
// (Matching on the active project id instead blocked new videos and caused the overwrite.)
function hasProjectForVideo(projects, videoUrl) {
  return Boolean(videoUrl) && (projects || []).some((p) => p && p.videoUrl === videoUrl);
}

// Support both CommonJS (Node.js test runner) and ES Modules (Vite)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { newProjectId, projectIdForRender, projectIdForVideoUrl, hasProjectForVideo };
}
