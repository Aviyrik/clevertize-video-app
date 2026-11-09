// Switching business starts a fresh film for the new business: nothing from the previous business's film
// (scripts, video, project id, logo, specialty) survives, the user is asked first if a film is in progress,
// and a render that is still running finishes into its own project instead of the new business's.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { businessContextOf, findProjectBusiness } = require("../src/utils/businessContext.js");
const { buildDraftProject } = require("../src/utils/drafts.js");

const appSrc = fs.readFileSync(path.join(__dirname, "../src/App.jsx"), "utf8");
const fnBody = (name) => {
  const start = appSrc.indexOf(`const ${name} = `);
  assert.ok(start >= 0, `${name} must exist`);
  const next = appSrc.indexOf("\n  const ", start + 10);
  return appSrc.slice(start, next);
};

const RELIANCE = { id: "biz_rel", name: "Reliance Digital", category: "Electronics Store", town: "Mumbai", specialty: "Smart TVs", logo: "/uploads/reliance.png", contact: "1800-xxx" };
const KANTI = { id: "biz_kanti", name: "Kanti Sweets", category: "Sweets, Bakery & Restaurant", town: "Bengaluru" };

test("businessContextOf loads every business field, carrying nothing over from the previous business", () => {
  const prev = { ...businessContextOf(RELIANCE), brandTone: "Bold" };
  const next = { ...prev, ...businessContextOf(KANTI, prev) };
  assert.strictEqual(next.businessId, "biz_kanti");
  assert.strictEqual(next.businessName, "Kanti Sweets");
  assert.strictEqual(next.businessType, "Sweets, Bakery & Restaurant");
  assert.strictEqual(next.specialty, "", "Reliance's specialty must not leak into Kanti's videos");
  assert.strictEqual(next.contact, "");
  assert.strictEqual(next.logo, null, "Reliance's logo must not stay on Kanti");
  assert.strictEqual(next.brandLogo, null);
  assert.strictEqual(next.brandTone, "Bold", "a business without its own tone keeps the user's tone");
  assert.strictEqual(businessContextOf({ ...KANTI, brandLogo: "/k.png" }).logo, "/k.png");
});

test("findProjectBusiness matches a project to its business by id, else by name", () => {
  const list = [RELIANCE, KANTI];
  assert.strictEqual(findProjectBusiness({ businessId: "biz_kanti", businessName: "Old name" }, list), KANTI);
  assert.strictEqual(findProjectBusiness({ businessName: " kanti sweets " }, list), KANTI);
  assert.strictEqual(findProjectBusiness({ businessName: "Unknown" }, list), null);
  assert.strictEqual(findProjectBusiness(null, list), null);
});

test("drafts record the business they belong to", () => {
  const d = buildDraftProject({ id: "p1", businessId: "biz_kanti", businessName: "Kanti Sweets", studio: "simple", simple: { step: 1, brief: "Diwali offer" } });
  assert.strictEqual(d.businessId, "biz_kanti");
  assert.ok(appSrc.includes("businessId: userContext.businessId || null,"), "the draft payload must carry businessId");
});

test("both business pickers use one shared handler", () => {
  const uses = appSrc.match(/onSelectBusiness=\{handleSelectBusiness\}/g) || [];
  assert.strictEqual(uses.length, 2, "sidebar and Businesses page must both use handleSelectBusiness");
  assert.ok(!/onSelectBusiness=\{\(biz\)/.test(appSrc), "no inline business-switch handlers may remain");
});

test("switching asks first when a film is in progress, using the new-film confirm modal", () => {
  const select = fnBody("handleSelectBusiness");
  assert.ok(select.includes("biz.id === userContext.businessId"), "re-selecting the active business does nothing");
  assert.ok(select.includes("if (hasActiveFilmWork()) {"), "must check for work in progress");
  assert.ok(select.includes("setPendingBusinessSwitch(biz);") && select.includes("setIsNewFilmConfirmOpen(true);"));
  assert.ok(select.includes("handleExecuteNewProject(false, { business: biz });"));

  const active = fnBody("hasActiveFilmWork");
  for (const sig of ["generatedScript", "videoUrl", "isRendering", "isBusy", "userContext.brief", "simpleDraftRef.current"]) {
    assert.ok(active.includes(sig), `work in progress must consider ${sig}`);
  }
  assert.ok(appSrc.includes("if (pendingBusinessSwitch) handleExecuteNewProject(false, { business: pendingBusinessSwitch });"), "confirm button performs the switch");
  assert.ok(appSrc.includes("const handleCancelNewFilm = () => {"), "cancel clears the pending switch");
});

test("a switch resets the whole creative pipeline and project identity, like a new film", () => {
  const exec = fnBody("handleExecuteNewProject");
  for (const reset of [
    "setBrandResetKey((prev) => prev + 1);",
    "studioSessionRef.current += 1;",
    "setActiveProjectId(null);",
    "currentSavingProjectIdRef.current = null;",
    "setScenes([]);",
    "setGeneratedScript(null);",
    "setVideoUrl('');",
    "setCreativeDNA({ direction: null, hook: null, plot: null, story: null });",
    "setSessionId(null);",
    "setShotSpec(null);",
    "setApprovedSummary([]);",
    "forgetDraft();",
  ]) {
    assert.ok(exec.includes(reset), `handleExecuteNewProject must run ${reset}`);
  }
  assert.ok(exec.includes("...businessContextOf(business, current)"), "the new business's profile replaces the old one");
  const confirm = fnBody("handleConfirmNewFilm");
  assert.ok(confirm.includes("await persistDraft(true)"), "the confirmation waits for the active draft to save before clearing the studio");
  assert.ok(confirm.indexOf("await persistDraft(true)") < confirm.indexOf("handleExecuteNewProject(false"), "the reset only runs after the save completes");
});

test("New Film opens the three-option hub while Restart Film reopens the selected entry", () => {
  const exec = fnBody("handleExecuteNewProject");
  assert.ok(exec.includes("setActiveAppView('hub')"), "a new film returns to the creation hub");
  assert.ok(exec.includes("destination === 'restart'"), "restart uses a separate destination");
  assert.ok(exec.includes("restartEntry === 'brief'"), "brief restarts at the brief stage");
  assert.ok(exec.includes("restartEntry === 'script'"), "script import can be restarted");
  assert.ok(exec.includes("restartEntry === 'url'"), "website scanning can be restarted");
  const shell = fs.readFileSync(path.join(__dirname, "../src/components/v2/AppShell.jsx"), "utf8");
  assert.ok(shell.includes("<span>Restart Film</span>"), "Restart Film remains available");
});

test("a render running at switch time is detached: it saves to its own project and leaves the new studio alone", () => {
  const poll = fnBody("pollRenderStatus");
  assert.ok(poll.includes("session = studioSessionRef.current"), "the render remembers the session it started in");
  assert.ok(poll.includes("const isLive = () => studioSessionRef.current === session;"));
  assert.ok(poll.includes("if (isLive() && activeRunIdRef.current !== runId) {"), "a detached render is not cancelled by the next one");
  assert.ok(/if \(live\) \{\s*stopTimer\(\);\s*setErrorMessage\(''\);\s*setVideoUrl\(data\.videoUrl\);/.test(poll), "video only shown in its own session");
  assert.ok(/if \(live\) \{\s*\/\/ From here on[^\n]*\n\s*setActiveProjectId\(projectId\);/.test(poll), "project id only adopted in its own session");
  assert.ok(poll.includes("if (isLive()) setActiveProjectId(savedData.project.id);"));
  assert.ok(poll.includes("if (!isLive()) return; // a detached render failed"));
  assert.ok(poll.includes("const completedProject = {"), "the finished video is still saved");

  // every render entry point passes the session it started in, and ignores errors after the studio moved on
  const sessionPasses = appSrc.match(/await pollRenderStatus\([^)]*\{ session \}\)/g) || [];
  assert.strictEqual(sessionPasses.length, 3);
  assert.ok((appSrc.match(/if \(studioSessionRef\.current !== session\) return;/g) || []).length >= 3);
});
