// In-progress drafts: what gets saved at each stage, where reopening one resumes, the render run id that
// lets a closed tab's render be picked up again, and how My Projects orders and labels drafts.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { buildDraftProject, resumeTargetOf, isDraft, isRenderingDraft, sortProjectsForLibrary, draftOf } = require("../src/utils/drafts.js");

const BRAND = { businessName: "Sharma Sweets", businessType: "Sweets, Bakery & Restaurant", town: "Indore" };
const PKG = { id: "pkg_2", title: "Festive", scenes: ["s1", "s2", "s3", "s4"], character1: "Owner", character2: "Customer", setting: "Shop" };

test("a Simple Studio draft records its stage and resumes on it", () => {
  const brief = buildDraftProject({ ...BRAND, id: "proj_d1", studio: "simple", simple: { step: 1, brief: "Diwali sweets offer", packages: [] } });
  assert.equal(brief.status, "in_progress");
  assert.equal(brief.currentStage, "brief");
  assert.deepEqual(brief.completedStages, []);
  assert.equal(brief.brief, "Diwali sweets offer");
  assert.deepEqual(resumeTargetOf(brief), { studio: "simple", stage: "brief", simpleStep: 1, runId: null });

  const scripts = buildDraftProject({ ...BRAND, id: "proj_d1", studio: "simple", simple: { step: 2, brief: "Diwali sweets offer", packages: [{ id: "pkg_1" }, PKG], selectedPackageId: "pkg_2" } });
  assert.equal(scripts.currentStage, "script");
  assert.deepEqual(scripts.completedStages, ["brief"]);
  assert.deepEqual(scripts.scenes, PKG.scenes, "the chosen script is saved");
  assert.equal(draftOf(scripts).simple.selectedPackageId, "pkg_2");
  assert.equal(resumeTargetOf(scripts).simpleStep, 2);
});

test("a render in flight is stored with its run id; without a run the produce step resumes on script choice", () => {
  const rendering = buildDraftProject({ ...BRAND, id: "proj_d2", studio: "simple", simple: { step: 3, brief: "x", packages: [PKG], selectedPackageId: "pkg_2" }, render: { runId: "run_abc", startedAt: "2026-11-04T10:00:00.000Z" } });
  assert.equal(rendering.currentStage, "video");
  assert.deepEqual(draftOf(rendering).render, { runId: "run_abc", startedAt: "2026-11-04T10:00:00.000Z" });
  assert.equal(resumeTargetOf(rendering).runId, "run_abc", "reopening polls this run instead of starting a new one");
  assert.equal(isRenderingDraft(rendering), true);

  const notStarted = buildDraftProject({ ...BRAND, id: "proj_d2", studio: "simple", simple: { step: 3, brief: "x", packages: [PKG], selectedPackageId: "pkg_2" } });
  assert.equal(notStarted.currentStage, "script");
  assert.equal(resumeTargetOf(notStarted).runId, null);
});

test("a Guided Studio draft keeps its stage, choices and script edits", () => {
  const edited = ["SCENE 1 — edited by the owner", "s2", "s3", "s4"];
  const guided = buildDraftProject({
    ...BRAND,
    id: "proj_g1",
    studio: "guided",
    guided: {
      currentStage: "script",
      completedStages: ["brief", "settings", "idea"],
      context: { brief: "Wedding season", platform: "Instagram Reels / 9:16", productPhoto: { name: "p.jpg", mime: "image/jpeg", data: "AAAA", previewUrl: "blob:x" } },
      stages: { selectedDirection: { title: "Trust" }, completedStages: ["brief", "settings", "idea"] },
      scenes: edited,
      character1: "Asha",
      character2: "Ravi",
      setting: "Sweet shop",
    },
  });
  assert.equal(guided.currentStage, "script");
  assert.deepEqual(guided.completedStages, ["brief", "settings", "idea"]);
  assert.deepEqual(guided.scenes, edited);
  assert.equal(guided.brief, "Wedding season");
  assert.deepEqual(draftOf(guided).guided.context.productPhoto, { name: "p.jpg", mime: "image/jpeg", data: "AAAA" }, "no blob preview URL is stored");
  assert.deepEqual(resumeTargetOf(guided), { studio: "guided", stage: "script", simpleStep: null, runId: null });
});

test("large product photos are left out of drafts", () => {
  const big = { name: "big.jpg", mime: "image/jpeg", data: "A".repeat(3 * 1024 * 1024 + 1) };
  const d = buildDraftProject({ ...BRAND, id: "p", studio: "simple", simple: { step: 1, brief: "x", productPhoto: big } });
  assert.equal(draftOf(d).simple.productPhoto, null);
});

test("finished videos are never drafts, and only drafts resume", () => {
  const draft = buildDraftProject({ ...BRAND, id: "p1", studio: "simple", simple: { step: 1, brief: "x" } });
  const finished = { ...draft, status: "video_ready", videoUrl: "https://cdn.example.com/v.mp4" };
  assert.equal(isDraft(draft), true);
  assert.equal(isDraft(finished), false);
  assert.equal(resumeTargetOf(finished), null);
  assert.equal(resumeTargetOf({ id: "old", status: "script_ready", scenes: ["a"] }), null, "older saved scripts open as before");
});

test("My Projects lists drafts first (newest first), then everything else in its usual order", () => {
  const v1 = { id: "v1", videoUrl: "https://x/1.mp4", status: "video_ready", updatedAt: "2026-11-04T12:00:00Z" };
  const s1 = { id: "s1", status: "script_ready", scenes: ["a"], updatedAt: "2026-11-01T00:00:00Z" };
  const d1 = { id: "d1", status: "in_progress", updatedAt: "2026-11-02T00:00:00Z" };
  const d2 = { id: "d2", status: "in_progress", updatedAt: "2026-11-03T00:00:00Z" };
  assert.deepEqual(sortProjectsForLibrary([v1, d1, s1, d2]).map((p) => p.id), ["d2", "d1", "v1", "s1"]);
});

test("App and Simple Studio are wired for autosave and resume", () => {
  const app = fs.readFileSync(path.join(__dirname, "../src/App.jsx"), "utf8");
  const simple = fs.readFileSync(path.join(__dirname, "../src/components/v2/SimpleBusinessStudio.jsx"), "utf8");
  assert.ok(!app.includes("simple-studio-${brandResetKey}-${activeProjectId"), "Simple Studio no longer reloads whenever activeProjectId changes");
  assert.ok(app.includes("onDraftChange={handleSimpleDraftChange}"), "Simple Studio reports its state for autosave");
  assert.ok(app.includes("pollRenderStatus(runId, { projectId, immediate: true })"), "a resumed render polls its existing run, under the draft's id");
  assert.ok(app.includes("if (resume && resume.runId) resumeRender("), "opening a rendering draft resumes the render");
  assert.ok(app.includes("sortProjectsForLibrary("), "My Projects lists drafts first");
  assert.ok(simple.includes("initialDraft"), "Simple Studio can start from a saved draft");
});
