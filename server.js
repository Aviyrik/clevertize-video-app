const express = require("express");
const path = require("path");
const { Readable } = require("stream");
require("dotenv").config();

const { callClaude } = require("./engine/claude");
const crypto = require("crypto");
const { buildSystem, buildUserContent, stageInstruction, buildRepairContent, festivalOf, HOOKS_PULLED } = require("./engine/prompt");
const { parseOutput, sceneForGeneration, parseJSONBlock } = require("./engine/parse");
const { runGate } = require("./engine/gate");
const { getFestivals, todayIST } = require("./engine/festivals");
const store = require("./engine/store");
const magnific = require("./engine/magnific");
const { compileShotSpecification, compileShotPrompt } = require("./engine/compiler");
const creative = require("./engine/creative");

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_REPAIRS = 3; // Section 8: up to 3 fix passes; the owner's chosen plot is never swapped

// ---- optional password (set DASHBOARD_PASSWORD before putting this on the internet) ----
app.use((req, res, next) => {
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw) return next();
  const [, b64] = (req.headers.authorization || "").split(" ");
  const pass = b64 ? Buffer.from(b64, "base64").toString().split(":").slice(1).join(":") : "";
  if (pass === pw) return next();
  res.set("WWW-Authenticate", 'Basic realm="Ad film dashboard"').status(401).send("Password required");
});

app.use(express.json({ limit: "25mb" }));
app.use(express.static(path.join(__dirname, "dist")));
app.use(express.static(path.join(__dirname, "public")));

// ---- form validation ----
const IMG_MIME = /^image\/(jpeg|png|gif|webp)$/;
const MAX_IMAGE_B64 = 6.5 * 1024 * 1024; // ~4.9 MB decoded; Anthropic's limit is 5 MB per image

function cleanImage(img, label) {
  if (!img || !img.data) return null;
  if (!IMG_MIME.test(img.mime || "")) throw new Error(`${label}: use a JPG, PNG or WebP image.`);
  if (img.data.length > MAX_IMAGE_B64) throw new Error(`${label} is too large — please use a smaller photo.`);
  return { mime: img.mime, data: img.data };
}

function resolveProduct(f) {
  const clean = (val) => (typeof val === "string" ? val.trim() : "");
  if (clean(f.product)) return clean(f.product);
  if (clean(f.productName)) return clean(f.productName);
  if (clean(f.specialty)) return clean(f.specialty);
  if (clean(f.offer)) return clean(f.offer);
  if (clean(f.brief)) {
    // Extract concise product/service from brief (first sentence or up to 60 chars)
    const match = clean(f.brief).split(/[.\n;]/)[0].trim();
    if (match) return match.slice(0, 80);
  }
  if (clean(f.businessType)) return clean(f.businessType);
  if (clean(f.businessName)) return `${clean(f.businessName)} offering`;
  return "featured product";
}

function validateForm(b) {
  const s = (x) => (typeof x === "string" ? x.trim() : "");
  const f = {
    businessName: s(b.businessName),
    businessType: s(b.businessType),
    town: s(b.town),
    language: s(b.language) || "English",
    area: s(b.area),
    specialty: s(b.specialty),
    offer: s(b.offer),
    occasion: s(b.occasion),
    contact: s(b.contact),
    ownerName: s(b.ownerName),
    duration: s(b.duration) || "15s",
    platform: s(b.platform) || "Instagram Reels / 9:16",
    creativeStyle: s(b.creativeStyle) || "UGC / Creator-style",
    scriptMode: b.scriptMode === "roman" ? "roman" : "devanagari",
    product: s(b.product),
    productName: s(b.productName),
    brief: s(b.brief),
  };
  const missing = [["businessName", "Business name"], ["businessType", "Business type"]]
    .filter(([k]) => !f[k]).map(([, l]) => l);
  if (missing.length) throw Object.assign(new Error(`Please fill in: ${missing.join(", ")}`), { status: 400 });
  f.shopPhoto = cleanImage(b.shopPhoto, "Shop photo");
  f.productPhoto = cleanImage(b.productPhoto, "Product photo");
  f.logo = cleanImage(b.logo, "Brand logo");

  // Ensure resolved product is attached
  f.resolvedProduct = resolveProduct(f);
  return f;
}

// end frame is composited after generation (M11) — built from the form, never generated
function endFrame(f) {
  return {
    businessName: f.businessName,
    address: [f.area, f.town].filter(Boolean).join(", "),
    contact: f.contact || "",
    offer: f.offer || "",
  };
}

// ---- 1) checkpoint sessions (Product Spine v2: 4 owner checkpoints) ----
// Stage 1 → Checkpoint 1 Direction → Stage 2 → Checkpoint 2 Plot line → Stage 3 → Checkpoint 3 Story & format
// → Stage 4 script + quality gate → Checkpoint 4 Script (approve → record saved → send to Magnific).
const STAGES = ["direction", "plot", "story", "script"];
const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
const sessions = new Map();

function getSession(id) {
  const now = Date.now();
  for (const [k, v] of sessions) if (now - v.touched > SESSION_TTL_MS) sessions.delete(k);
  const s = sessions.get(id);
  if (!s) throw Object.assign(new Error("This session has expired (or the server restarted). Please start again."), { status: 404 });
  s.touched = now;
  return s;
}

function clearAfter(s, stage) {
  for (const st of STAGES.slice(STAGES.indexOf(stage) + 1)) delete s[st];
}

// The model sometimes names the text field differently ("plot", "text", "en"…) or returns plain strings.
// Normalise every option to { owner: "<text>", ... } so the dashboard never shows "undefined".
const TEXT_KEYS = ["owner", "en", "text", "plot", "plot_line", "line", "tension", "description", "summary", "idea", "title", "scene"];
function textOf(x) {
  if (typeof x === "string") return x.trim();
  if (!x || typeof x !== "object") return "";
  for (const k of TEXT_KEYS) if (typeof x[k] === "string" && x[k].trim()) return x[k].trim();
  const any = Object.entries(x).find(([k, v]) => typeof v === "string" && v.trim() && !/hook|library|lens/i.test(k));
  return any ? any[1].trim() : "";
}
function normaliseList(list, label) {
  const out = list.map((x) => ({ ...(typeof x === "object" && x ? x : {}), owner: textOf(x) }));
  if (out.some((x) => !x.owner)) throw new Error(`a ${label} came back without any text`);
  return out;
}

function checkStage(stage, out) {
  const need = (cond, msg) => { if (!cond) throw new Error(msg); };
  if (stage === "direction") {
    need(Array.isArray(out.tensions) && out.tensions.length, "no tensions");
    need(out.festival && typeof out.festival === "object", "no festival decision");
    out.tensions = normaliseList(out.tensions.slice(0, 3), "tension");
    out.festival.owner = textOf(out.festival) || (out.festival.use ? `Uses ${out.festival.name}` : "Everyday film — no festival");
  } else if (stage === "plot") {
    need(Array.isArray(out.plots) && out.plots.length, "no plots");
    out.plots = normaliseList(out.plots.slice(0, 3), "plot");
  } else if (stage === "story") {
    need(Array.isArray(out.scenes) && out.scenes.length === 4, "story must have exactly 4 scenes");
    out.scenes = normaliseList(out.scenes, "scene");
    out.format_owner = out.format_owner || out.format_reason || "";
    const fm = String(out.format || "").toLowerCase();
    need(/^(ugc|storytelling)/.test(fm), `format must be UGC or Storytelling, got "${out.format}"`);
    out.format = fm.startsWith("ugc") ? "UGC" : "Storytelling";
  }
  return out;
}

async function runJSONStage(s, stage, change) {
  const content = buildUserContent(s.form, s.fest, s.previous, s.today, stageInstruction(stage, s, change));
  let lastErr;
  for (let i = 0; i < 2; i++) {
    const text = await callClaude({ system: s.system, content, maxTokens: 8000, thinking: false });
    try { return checkStage(stage, parseJSONBlock(text)); }
    catch (e) { lastErr = e; console.warn(`[${stage}] unreadable answer (${e.message}) — retrying`); }
  }
  throw new Error(`Could not read the ${stage} answer from the engine: ${lastErr.message}`);
}

async function runScript(s, change) {
  const base = buildUserContent(s.form, s.fest, s.previous, s.today, stageInstruction("script", s, change));
  const gateOpts = { scriptMode: s.form.scriptMode, previous: s.previous, approvedFormat: s.story.out.format, festival: festivalOf(s) };
  let content = base, parsed, failures = [], attempts = 0;
  for (let i = 0; i <= MAX_REPAIRS; i++) {
    attempts++;
    if (i > 0) content = buildRepairContent(base, parsed.raw, failures);
    parsed = parseOutput(await callClaude({ system: s.system, content, thinking: false }));
    failures = runGate(parsed, s.form, gateOpts);
    console.log(`[script] pass #${attempts}: ${failures.length ? `${failures.length} failing checks` : "passed"}`);
    if (!failures.length) break;
  }
  return { parsed, failures, attempts };
}

function scriptPayload(s) {
  const p = s.script.parsed;
  return {
    header: p.header,
    character1: p.character1,
    character2: p.character2,
    setting: p.setting,
    scenes: p.scenes,
    record: s.script.record,
    endFrame: endFrame(s.form),
    meta: {
      attempts: s.script.attempts,
      festivalSource: s.fest.source,
      hooksPulled: HOOKS_PULLED,
      previousScripts: s.previous.length,
    },
  };
}

async function produce(s, stage, change) {
  const t0 = Date.now();
  if (stage === "script") {
    const r = await runScript(s, change);
    if (r.failures.length) {
      const err = new Error("The script could not pass the quality gate after several passes. Ask for a change at this checkpoint, or go back a step.");
      err.status = 422; err.failures = r.failures;
      throw err;
    }
    const p = r.parsed;
    s.script = {
      parsed: p,
      attempts: r.attempts,
      record: { ...p.record, business_name: s.form.businessName, business_type: s.form.businessType, town: s.form.town, date: s.today, format: s.story.out.format, scenes: p.scenes.length },
    };
    return { stage, seconds: Math.round((Date.now() - t0) / 1000), data: scriptPayload(s) };
  }
  s[stage] = { out: await runJSONStage(s, stage, change), choice: null };
  return { stage, seconds: Math.round((Date.now() - t0) / 1000), data: s[stage].out };
}

const sendErr = (res, e, tag) => {
  console.error(`[${tag}]`, e.message);
  res.status(e.status || 500).json({ error: e.message, failures: e.failures });
};

// start: validate form → Stage 1 → Checkpoint 1
app.post("/api/session", async (req, res) => {
  try {
    const form = validateForm(req.body || {});
    const fest = await getFestivals();
    const s = {
      id: crypto.randomUUID(),
      touched: Date.now(),
      form,
      fest,
      today: todayIST(),
      previous: store.previousFor(form.businessName, form.town),
      system: buildSystem(form.scriptMode),
    };
    sessions.set(s.id, s);
    const out = await produce(s, "direction");
    res.json({ sessionId: s.id, ...out });
  } catch (e) { sendErr(res, e, "session"); }
});

// FAST SINGLE-CLICK PIPELINE (Phase 4):
// Runs Brand understanding → Direction → Plot → Story → Script Quality Gate → Shot Specs automatically
app.post("/api/pipeline/generate", async (req, res) => {
  try {
    const form = validateForm(req.body || {});
    const fest = await getFestivals();
    const s = {
      id: crypto.randomUUID(),
      touched: Date.now(),
      form,
      fest,
      today: todayIST(),
      previous: store.previousFor(form.businessName, form.town),
      system: buildSystem(form.scriptMode),
    };
    sessions.set(s.id, s);

    // Pre-flight check: ensure required creative parameters and product context can be satisfied
    magnific.validateMagnificRequest(
      {
        scenes: ["Pre-flight check placeholder scene"],
        product: form.resolvedProduct,
        productDataUrl: form.productPhoto ? `data:${form.productPhoto.mime};base64,${form.productPhoto.data}` : null,
        setting: form.area || form.town || "Single Room Studio",
        character1: form.ownerName || form.businessName || "Lead Speaker",
      },
      { userFacing: true }
    );

    // Fast Direct Production Script & Section 8 Quality Gate (Single-Pass Execution ~35-45s)
    console.log(`[pipeline:${s.id}] Fast single-pass creative intelligence & script generation...`);
    const stageInst = "Pick the best customer tension and viral hook pattern for this business, and write the complete 4-scene film following all Product Spine rules. Return ONLY the OUTPUT markers.";
    const base = buildUserContent(s.form, s.fest, s.previous, s.today, stageInst);
    const gateOpts = { scriptMode: s.form.scriptMode, previous: s.previous, approvedFormat: "Storytelling", festival: festivalOf(s) };
    let content = base, parsed, failures = [], attempts = 0;
    for (let i = 0; i <= MAX_REPAIRS; i++) {
      attempts++;
      if (i > 0) content = buildRepairContent(base, parsed.raw, failures);
      parsed = parseOutput(await callClaude({ system: s.system, content, thinking: false }));
      failures = runGate(parsed, s.form, gateOpts);
      console.log(`[pipeline:${s.id}] pass #${attempts}: ${failures.length ? `${failures.length} failing checks` : "passed"}`);
      if (!failures.length) break;
    }

    if (failures.length) {
      const err = new Error("The script could not pass the quality gate after several passes. Ask for a change at this checkpoint, or go back a step.");
      err.status = 422; err.failures = failures;
      throw err;
    }

    s.script = {
      parsed,
      attempts,
      record: { ...parsed.record, business_name: s.form.businessName, business_type: s.form.businessType, town: s.form.town, date: s.today, format: parsed.record?.format || "Storytelling", scenes: parsed.scenes.length },
    };
    const scriptRes = { data: scriptPayload(s) };

    // Automatically record approved script
    store.save(s.form.businessName, s.form.town, s.script.record, s.script.parsed.header);
    s.script.saved = true;

    // 5. Compile structured Shot Specifications (Separating STATIC WORLD from MOTION)
    const shotSpec = compileShotSpecification(s.script.parsed, form);

    res.json({
      sessionId: s.id,
      script: scriptRes.data,
      shotSpec,
      header: s.script.parsed.header,
      character1: s.script.parsed.character1,
      character2: s.script.parsed.character2,
      setting: s.script.parsed.setting,
      scenes: s.script.parsed.scenes,
      endFrame: endFrame(s.form),
      record: s.script.record,
      product: form.resolvedProduct,
      productName: form.resolvedProduct,
    });
  } catch (e) {
    sendErr(res, e, "pipeline:generate");
  }
});

// approve a checkpoint (with the chosen option) → run the next stage
app.post("/api/session/:id/next", async (req, res) => {
  try {
    const s = getSession(req.params.id);
    const { checkpoint, choice } = req.body || {};
    const idx = Number(choice);
    if (checkpoint === "direction" || checkpoint === "plot") {
      const list = checkpoint === "direction" ? s.direction?.out.tensions : s.plot?.out.plots;
      if (!list) throw Object.assign(new Error("That checkpoint isn't ready yet."), { status: 400 });
      if (!Number.isInteger(idx) || idx < 0 || idx >= list.length) throw Object.assign(new Error("Pick one of the options."), { status: 400 });
      s[checkpoint].choice = idx;
      clearAfter(s, checkpoint);
      return res.json(await produce(s, checkpoint === "direction" ? "plot" : "story"));
    }
    if (checkpoint === "story") {
      if (!s.story) throw Object.assign(new Error("That checkpoint isn't ready yet."), { status: 400 });
      s.story.approved = true;
      clearAfter(s, "story");
      return res.json(await produce(s, "script"));
    }
    throw Object.assign(new Error(`Unknown checkpoint "${checkpoint}"`), { status: 400 });
  } catch (e) { sendErr(res, e, "next"); }
});

// owner asks for a change at a checkpoint → revise that stage (M18a), later stages are cleared
app.post("/api/session/:id/change", async (req, res) => {
  try {
    const s = getSession(req.params.id);
    const { checkpoint } = req.body || {};
    const note = String(req.body?.note || "").trim();
    if (!STAGES.includes(checkpoint)) throw Object.assign(new Error(`Unknown checkpoint "${checkpoint}"`), { status: 400 });
    if (!note) throw Object.assign(new Error("Write what you'd like changed."), { status: 400 });
    if (!s[checkpoint] && !(checkpoint === "script" && s.story?.approved)) throw Object.assign(new Error("That checkpoint isn't ready yet."), { status: 400 });
    const previous = checkpoint === "script" ? s.script?.parsed.raw || "(no passing script yet)" : JSON.stringify(s[checkpoint].out);
    clearAfter(s, checkpoint);
    if (s[checkpoint] && checkpoint !== "script") { s[checkpoint].choice = null; s[checkpoint].approved = false; }
    res.json(await produce(s, checkpoint, { note, previous }));
  } catch (e) { sendErr(res, e, "change"); }
});

// Checkpoint 4 approved → save the script record for next time (M19)
app.post("/api/session/:id/approve", (req, res) => {
  try {
    const s = getSession(req.params.id);
    if (!s.script) throw Object.assign(new Error("No approved script yet."), { status: 400 });
    if (!s.script.saved) {
      store.save(s.form.businessName, s.form.town, s.script.record, s.script.parsed.header);
      s.script.saved = true;
    }
    res.json({ ok: true });
  } catch (e) { sendErr(res, e, "approve"); }
});

// ---- Creative Intelligence Workspace V2 Endpoints ----

// 1) Adaptive Research (Tiers 0-3)
app.post("/api/research", async (req, res) => {
  try {
    const { businessName, businessType, town, area, websiteUrl, brief } = req.body || {};
    const result = await creative.performAdaptiveResearch({
      businessName,
      businessType,
      town,
      area,
      websiteUrl,
      brief,
    });
    res.json(result);
  } catch (e) {
    console.error("[api/research]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// 2) Creative Direction
app.post("/api/creative/directions", async (req, res) => {
  try {
    const { businessName, businessType, town, brief, research, festival } = req.body || {};
    const result = await creative.generateDirections({
      businessName,
      businessType,
      town,
      brief,
      research,
      festival,
    });
    res.json(result);
  } catch (e) {
    console.error("[api/creative/directions]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// 3) Hook Intelligence
app.post("/api/creative/hooks", async (req, res) => {
  try {
    const { businessName, businessType, brief, direction, language } = req.body || {};
    const result = await creative.generateHooks({
      businessName,
      businessType,
      brief,
      direction,
      language: language || "English",
    });
    res.json(result);
  } catch (e) {
    console.error("[api/creative/hooks]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// 4) Plot Generation
app.post("/api/creative/plots", async (req, res) => {
  try {
    const { businessName, businessType, brief, direction, hook, format, language } = req.body || {};
    const result = await creative.generatePlots({
      businessName,
      businessType,
      brief,
      direction,
      hook,
      format: format || "Storytelling",
      language: language || "English",
    });
    res.json(result);
  } catch (e) {
    console.error("[api/creative/plots]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// 5) Story Architecture & World Building
app.post("/api/creative/story", async (req, res) => {
  try {
    const { businessName, businessType, town, brief, direction, hook, plot, format, language } = req.body || {};
    const result = await creative.generateStoryWorld({
      businessName,
      businessType,
      town,
      brief,
      direction,
      hook,
      plot,
      format: format || "Storytelling",
      language: language || "English",
    });
    res.json(result);
  } catch (e) {
    console.error("[api/creative/story]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// 6) Master Script Synthesis & Quality Gate
app.post("/api/creative/synthesize-script", async (req, res) => {
  try {
    const { form, creativeDNA, constraints, avoid } = req.body || {};
    if (!form || !form.businessName) throw Object.assign(new Error("Form data with businessName is required."), { status: 400 });
    const validated = validateForm(form);
    const result = await creative.synthesizeMasterScript({
      form: validated,
      creativeDNA: creativeDNA || {},
      constraints: constraints || [],
      avoid: avoid || [],
    });
    res.json(result);
  } catch (e) {
    console.error("[api/creative/synthesize-script]", e.message);
    res.status(e.status || 500).json({ error: e.message });
  }
});

// 7) Scene-Level AI Rewriter
app.post("/api/creative/rewrite-scene", async (req, res) => {
  try {
    const { sceneText, sceneIndex, totalScenes, instruction, form, characters, setting } = req.body || {};
    if (!sceneText || !instruction) throw Object.assign(new Error("Scene text and instruction are required."), { status: 400 });
    const rewritten = await creative.rewriteScene({
      sceneText,
      sceneIndex: Number(sceneIndex) || 0,
      totalScenes: Number(totalScenes) || 4,
      instruction,
      form,
      characters,
      setting,
    });
    res.json({ scene: rewritten });
  } catch (e) {
    console.error("[api/creative/rewrite-scene]", e.message);
    res.status(e.status || 500).json({ error: e.message });
  }
});

// ---- 2) start the Magnific flow ----
app.post("/api/run", async (req, res) => {
  try {
    const {
      scenes,
      character1,
      character2,
      setting,
      productPhoto,
      logo,
      duration,
      shotSpec,
      product,
      productName,
      specialty,
      brief,
      businessType,
      businessName,
    } = req.body || {};
    if (!Array.isArray(scenes) || !scenes.length) throw new Error("No scenes to send.");
    const img = productPhoto && productPhoto.data ? cleanImage(productPhoto, "Product photo") : null;
    const logoImg = logo && logo.data ? cleanImage(logo, "Logo") : null;

    // Resolve product text representation
    const resolvedProduct = resolveProduct({
      product,
      productName,
      specialty,
      brief,
      businessType: businessType || shotSpec?.project?.businessType || shotSpec?.project?.productOrService,
      businessName: businessName || shotSpec?.project?.businessName,
    });

    // Use structured shot spec prompt compilation if available (Separating STATIC WORLD from MOTION)
    let processedScenes;
    if (shotSpec && Array.isArray(shotSpec.shots) && shotSpec.shots.length === scenes.length) {
      processedScenes = shotSpec.shots.map((sh) =>
        compileShotPrompt(sh, shotSpec.staticWorld || { setting, characters: [character1, character2].filter(Boolean).join(" | "), businessType: businessType || shotSpec.project?.businessType }, {
          duration: duration || "15s",
          shotCount: scenes.length,
        })
      );
    } else {
      // Robust fallback to continuous scene compilation
      processedScenes = scenes.map((sc) => sceneForGeneration(sc, { setting, character1, character2, duration, businessType: businessType || shotSpec?.project?.businessType || resolvedProduct }));
    }

    const runId = await magnific.startRun({
      scenes: processedScenes,
      character1,
      character2,
      setting,
      product: resolvedProduct,
      productName: resolvedProduct,
      productDataUrl: img ? `data:${img.mime};base64,${img.data}` : null,
      logoDataUrl: logoImg ? `data:${logoImg.mime};base64,${logoImg.data}` : null,
    });
    res.json({ runId, shotCount: processedScenes.length });
  } catch (e) {
    console.error("[run]", e.message);
    res.status(e.status || 500).json({ error: e.message });
  }
});

// ---- 3) poll a run ----
const videoUrls = new Set(); // only URLs Magnific gave us can be downloaded through /api/download
app.get("/api/status/:runId", async (req, res) => {
  try {
    const s = await magnific.runStatus(req.params.runId);
    if (s.videoUrl) videoUrls.add(s.videoUrl);
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- 4) stream the finished video ----
app.get("/api/download", async (req, res) => {
  const url = String(req.query.url || "");
  if (!videoUrls.has(url)) return res.status(400).send("Unknown video URL");
  try {
    const r = await fetch(url);
    if (!r.ok || !r.body) return res.status(502).send(`Video fetch failed (HTTP ${r.status})`);
    res.setHeader("Content-Disposition", 'attachment; filename="ad-film.mp4"');
    res.setHeader("Content-Type", r.headers.get("content-type") || "video/mp4");
    if (r.headers.get("content-length")) res.setHeader("Content-Length", r.headers.get("content-length"));
    Readable.fromWeb(r.body).pipe(res);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ---- small config probe for the UI ----
app.get("/api/config", (req, res) => {
  res.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    magnific: !!process.env.MAGNIFIC_API_KEY,
    hooksPulled: HOOKS_PULLED,
  });
});

// SPA catch-all fallback for client routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`\n  Dashboard running -> http://localhost:${PORT}\n`));
}

module.exports = { app, validateForm };