// My Projects history: every generated video keeps its own project (no id reuse), editing a saved
// project still updates it in place, and expired Magnific links are recognised.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { newProjectId, projectIdForRender, projectIdForVideoUrl, hasProjectForVideo } = require("../src/utils/projectIds.js");
const { videoLinkExpiry, isVideoLinkExpired } = require("../src/utils/videoLink.js");

test("three renders in one session get three different projects", () => {
  let projects = [];
  let activeProjectId = null;
  const ids = [];
  for (const n of [1, 2, 3]) {
    const id = projectIdForRender(activeProjectId, projects); // decided when the render starts
    projects = [{ id, videoUrl: `https://cdn.example.com/video-${n}.mp4` }, ...projects];
    activeProjectId = id; // set after the video finishes, as App.jsx does
    ids.push(id);
  }
  assert.equal(new Set(ids).size, 3, "no render reuses an earlier video's id");
  assert.equal(projects.length, 3);
});

test("rendering an opened script-only project gives it its first video; one with a video gets a new project", () => {
  const projects = [{ id: "proj_script", videoUrl: null }, { id: "proj_video", videoUrl: "https://cdn.example.com/a.mp4" }];
  assert.equal(projectIdForRender("proj_script", projects), "proj_script");
  const fresh = projectIdForRender("proj_video", projects);
  assert.notEqual(fresh, "proj_video");
  assert.match(fresh, /^proj_\d+_[a-z0-9]+$/);
  assert.notEqual(projectIdForRender("proj_missing", projects), "proj_missing", "unknown active id is never reused");
  assert.notEqual(projectIdForRender(null, projects), null);
});

test("new ids are unique and fallback ids are stable per video", () => {
  const many = new Set(Array.from({ length: 2000 }, () => newProjectId()));
  assert.equal(many.size, 2000);
  const a = projectIdForVideoUrl("https://cdn.example.com/a.mp4");
  assert.equal(a, projectIdForVideoUrl("https://cdn.example.com/a.mp4"), "same video, same id on every render");
  assert.notEqual(a, projectIdForVideoUrl("https://cdn.example.com/b.mp4"));
  assert.notEqual(a, "current_active_video");
});

test("dedupe matches the video itself, so a new video is never blocked by the active project id", () => {
  const projects = [{ id: "proj_1", videoUrl: "https://cdn.example.com/1.mp4" }];
  assert.equal(hasProjectForVideo(projects, "https://cdn.example.com/1.mp4"), true, "same video twice is a genuine duplicate");
  assert.equal(hasProjectForVideo(projects, "https://cdn.example.com/2.mp4"), false, "a new video is not");
  assert.equal(hasProjectForVideo(projects, ""), false);
});

test("App.jsx no longer reuses the active project id or a hardcoded id for new videos", () => {
  const app = fs.readFileSync(path.join(__dirname, "../src/App.jsx"), "utf8");
  assert.ok(!app.includes("'current_active_video'"), "hardcoded fallback id removed");
  assert.ok(!/activeProjectId \|\| `proj_\$\{Date\.now\(\)\}`/.test(app), "no 'activeProjectId || proj_<time>' for completed videos");
  assert.ok(!/alreadySaved = prev\.some\(\(p\) => p\.videoUrl === videoUrl \|\| \(activeProjectId/.test(app), "dedupe no longer matches the active project id");
  assert.ok(app.includes("projectIdForRender(activeProjectId, userProjects)"), "render target decided when the render starts");
});

test("expired Magnific links are recognised; permanent copies never expire", () => {
  const past = Math.floor(Date.parse("2026-10-01T00:00:00Z") / 1000);
  const future = Math.floor(Date.parse("2027-10-01T00:00:00Z") / 1000);
  const now = Date.parse("2026-11-03T00:00:00Z");
  const expired = `https://ai-statics.example.com/video/out.mp4?token=exp=${past}~hmac=abc123`;
  assert.equal(videoLinkExpiry(expired).getTime(), past * 1000);
  assert.equal(isVideoLinkExpired(expired, now), true);
  assert.equal(isVideoLinkExpired(`https://ai-statics.example.com/v.mp4?token=exp%3D${past}%7Ehmac%3Dabc`, now), true, "URL-encoded token");
  assert.equal(isVideoLinkExpired(`https://ai-statics.example.com/v.mp4?token=exp=${future}~hmac=abc`, now), false);
  const stored = "https://abc.supabase.co/storage/v1/object/public/videos/usr_1/run_1-0123456789abcdef.mp4";
  assert.equal(videoLinkExpiry(stored), null);
  assert.equal(isVideoLinkExpired(stored, Date.parse("2099-01-01")), false, "a stored copy still plays long after the Magnific link would have expired");
});
