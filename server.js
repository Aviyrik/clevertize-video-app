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
const videoStore = require("./engine/videoStore");
const { extractSceneParts, compileShotSpecification, compileShotPrompt } = require("./engine/compiler");
const creative = require("./engine/creative");
const db = require("./engine/db");
const netguard = require("./engine/netguard"); // called as netguard.safeFetch so tests can point it at a local server
const { isDisallowedUrl } = netguard;
const feedback = require("./engine/feedback");
const emailService = require("./engine/email");
const understandingSpine = require("./engine/understandingSpine");
const guardrails = require("./engine/guardrails");
const guardrailsSpine = require("./engine/guardrailsSpine");
const eventContextUtil = require("./engine/eventContext");

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
app.use(express.static(path.join(__dirname, "dist"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith("index.html")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
  }
}));
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
  const durationVal = s(b.targetDuration || b.duration) || "20s";
  const aspectVal = s(b.aspectRatio || b.dimension) || (s(b.platform).includes("16:9") ? "16:9" : s(b.platform).includes("1:1") ? "1:1" : "9:16");
  const platformVal = s(b.platform) || (aspectVal === "16:9" ? "YouTube / 16:9" : aspectVal === "1:1" ? "Feed / 1:1" : "Instagram Reels / 9:16");
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
    duration: durationVal,
    targetDuration: durationVal,
    aspectRatio: aspectVal,
    dimension: aspectVal,
    platform: platformVal,
    creativeStyle: s(b.creativeStyle) || "UGC / Creator-style",
    brandTone: s(b.brandTone) || "Warm & Authentic",
    scriptMode: b.scriptMode === "roman" ? "roman" : "devanagari",
    product: s(b.product),
    productName: s(b.productName),
    brief: s(b.brief),
    creativeGuardrails: b.creativeGuardrails ? guardrails.normalizeCreativeGuardrails(b.creativeGuardrails) : null,
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
const MAX_SESSIONS_PER_USER = 10; // each session holds the form (and its photos) in memory
const sessions = new Map();

function openSession(form, fest, userId) {
  const now = Date.now();
  for (const [k, v] of sessions) if (now - v.touched > SESSION_TTL_MS) sessions.delete(k);
  const own = [...sessions.values()].filter((v) => v.userId === userId).sort((a, b) => a.touched - b.touched);
  for (const old of own.slice(0, Math.max(0, own.length - MAX_SESSIONS_PER_USER + 1))) sessions.delete(old.id);
  const s = {
    id: crypto.randomUUID(),
    userId,
    touched: now,
    form,
    fest,
    today: todayIST(),
    previous: store.previousFor(form.businessName, form.town),
    system: buildSystem(form.scriptMode),
  };
  sessions.set(s.id, s);
  return s;
}

function getSession(id, userId) {
  const now = Date.now();
  for (const [k, v] of sessions) if (now - v.touched > SESSION_TTL_MS) sessions.delete(k);
  const s = sessions.get(id);
  if (!s) throw Object.assign(new Error("This session has expired (or the server restarted). Please start again."), { status: 404 });
  if (!userId || !s.userId || s.userId !== userId) {
    throw Object.assign(new Error("Access denied. You do not own this session."), { status: 403 });
  }
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
  const gateOpts = { scriptMode: s.form.scriptMode, previous: s.previous, approvedFormat: s.story.out.format, festival: festivalOf(s), creativeGuardrails: s.form.creativeGuardrails || null };
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

// ---- Auth Middleware & Helpers (Phase 1 Security) ----

function extractToken(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  if (req.headers["x-session-token"]) {
    return String(req.headers["x-session-token"]).trim();
  }
  return null;
}

async function authRequired(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    const user = await db.getUserBySessionToken(token);
    if (!user) {
      return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
    }
    req.user = user;
    req.sessionToken = token;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message || "Authentication error." });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const user = await db.getUserBySessionToken(token);
      if (user) {
        req.user = user;
        req.sessionToken = token;
      }
    }
    next();
  } catch (err) {
    next();
  }
}

// start: validate form → Stage 1 → Checkpoint 1
app.post("/api/session", authRequired, async (req, res) => {
  try {
    const form = validateForm(req.body || {});
    if (req.body?.projectId) {
      const { guardrails: activeG } = await guardrails.resolveProjectGuardrails({
        db,
        projectId: req.body.projectId,
        userId: req.user.id,
        fallbackGuardrails: form.creativeGuardrails,
      });
      if (guardrails.hasActiveGuardrails(activeG)) form.creativeGuardrails = activeG;
    }
    const s = openSession(form, await getFestivals(), req.user.id);
    const out = await produce(s, "direction");
    res.json({ sessionId: s.id, ...out });
  } catch (e) { sendErr(res, e, "session"); }
});

// FAST SINGLE-CLICK PIPELINE (Phase 4):
// Runs Brand understanding → Direction → Plot → Story → Script Quality Gate → Shot Specs automatically
app.post("/api/pipeline/generate", authRequired, async (req, res) => {
  try {
    const form = validateForm(req.body || {});
    if (req.body?.projectId) {
      const { guardrails: activeG } = await guardrails.resolveProjectGuardrails({
        db,
        projectId: req.body.projectId,
        userId: req.user.id,
        fallbackGuardrails: form.creativeGuardrails,
      });
      if (guardrails.hasActiveGuardrails(activeG)) form.creativeGuardrails = activeG;
    }
    const s = openSession(form, await getFestivals(), req.user.id);

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
    const gateOpts = { scriptMode: s.form.scriptMode, previous: s.previous, approvedFormat: "Storytelling", festival: festivalOf(s), creativeGuardrails: form.creativeGuardrails || null };
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
app.post("/api/session/:id/next", authRequired, async (req, res) => {
  try {
    const s = getSession(req.params.id, req.user.id);
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
app.post("/api/session/:id/change", authRequired, async (req, res) => {
  try {
    const s = getSession(req.params.id, req.user.id);
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
app.post("/api/session/:id/approve", authRequired, (req, res) => {
  try {
    const s = getSession(req.params.id, req.user.id);
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
app.post("/api/research", authRequired, async (req, res) => {
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

const STANDARD_BUSINESS_CATEGORIES = [
  "Saree, Clothing & Apparel",
  "Jewellery & Accessories",
  "Sweets, Bakery & Restaurant",
  "Kirana, Grocery & Supermarket",
  "Electronics, Mobile & Appliances",
  "Salon, Spa & Beauty",
  "Healthcare, Clinic & Pharmacy",
  "Real Estate & Home Decor",
  "Gym, Fitness & Yoga",
  "Education, Coaching & Tuition",
  "Automobile & Garage",
  "Other Local Business",
];

function extractDomainBrand(urlStr) {
  try {
    const raw = urlStr.startsWith("http") ? urlStr : `https://${urlStr}`;
    let hostname = new URL(raw).hostname.toLowerCase();
    hostname = hostname.replace(/^www\./, "");
    const parts = hostname.split(".");
    let brandKey = parts[0];
    if (brandKey.length <= 2 && parts.length > 2) {
      brandKey = parts[1];
    }
    const KNOWN_BRANDS = {
      amazon: "Amazon",
      flipkart: "Flipkart",
      myntra: "Myntra",
      ajio: "Ajio",
      nykaa: "Nykaa",
      zomato: "Zomato",
      swiggy: "Swiggy",
      blinkit: "Blinkit",
      zepto: "Zepto",
      bigbasket: "BigBasket",
      tanishq: "Tanishq",
      kalyanjewellers: "Kalyan Jewellers",
      malabargoldanddiamonds: "Malabar Gold & Diamonds",
      tatacliq: "Tata CLiQ",
      reliancedigital: "Reliance Digital",
      croma: "Croma",
    };
    if (KNOWN_BRANDS[brandKey]) return KNOWN_BRANDS[brandKey];

    const words = brandKey.split(/[-_]/).filter(Boolean);
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  } catch {
    return "";
  }
}

function matchClosestCategory(catStr, defaultCat = "Other Local Business") {
  if (!catStr || typeof catStr !== "string") return defaultCat;
  const s = catStr.toLowerCase();
  if (s.includes("jewel") || s.includes("gold") || s.includes("diamond") || s.includes("ornament")) {
    return "Jewellery & Accessories";
  }
  if (s.includes("saree") || s.includes("cloth") || s.includes("apparel") || s.includes("fashion") || s.includes("wear") || s.includes("boutique") || s.includes("tailor")) {
    return "Saree, Clothing & Apparel";
  }
  if (s.includes("sweet") || s.includes("bakery") || s.includes("restaurant") || s.includes("food") || s.includes("cafe") || s.includes("mithai") || s.includes("dining")) {
    return "Sweets, Bakery & Restaurant";
  }
  if (s.includes("kirana") || s.includes("grocery") || s.includes("supermarket") || s.includes("fmcg") || s.includes("provision") || s.includes("mart") || s.includes("ecommerce") || s.includes("e-commerce") || s.includes("marketplace")) {
    return "Kirana, Grocery & Supermarket";
  }
  if (s.includes("electronic") || s.includes("mobile") || s.includes("appliance") || s.includes("gadget") || s.includes("phone")) {
    return "Electronics, Mobile & Appliances";
  }
  if (s.includes("salon") || s.includes("spa") || s.includes("beauty") || s.includes("parlour") || s.includes("hair") || s.includes("makeup") || s.includes("skin")) {
    return "Salon, Spa & Beauty";
  }
  if (s.includes("health") || s.includes("clinic") || s.includes("pharmacy") || s.includes("doctor") || s.includes("medical") || s.includes("hospital")) {
    return "Healthcare, Clinic & Pharmacy";
  }
  if (s.includes("real estate") || s.includes("home decor") || s.includes("interior") || s.includes("furniture") || s.includes("property")) {
    return "Real Estate & Home Decor";
  }
  if (s.includes("gym") || s.includes("fitness") || s.includes("yoga") || s.includes("workout")) {
    return "Gym, Fitness & Yoga";
  }
  if (s.includes("education") || s.includes("coaching") || s.includes("tuition") || s.includes("school") || s.includes("academy") || s.includes("class")) {
    return "Education, Coaching & Tuition";
  }
  if ((s.includes("auto") || s.includes("garage") || s.includes("bike") || s.includes("mechanic") || s.includes("repair") || /\b(cars?|vehicles?|motor)\b/i.test(s)) && !s.includes("care")) {
    return "Automobile & Garage";
  }
  const exact = STANDARD_BUSINESS_CATEGORIES.find((c) => c.toLowerCase() === s);
  if (exact) return exact;
  return defaultCat;
}

const SCRAPER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Clevertize-Bot/2.0";

// Identify an image by its magic bytes (content-type headers from scraped sites can't be trusted)
function sniffImageMime(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("latin1") === "GIF8") return "image/gif";
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  return null;
}

function resolveScrapedUrl(relative, base) {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

function isGenericScrapedIcon(url) {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes("favicon") ||
    lower.includes("logo") ||
    lower.includes("sprite") ||
    lower.includes("placeholder") ||
    lower.endsWith(".svg") ||
    lower.includes("1x1") ||
    lower.includes("spacer") ||
    lower.includes("share-icons")
  );
}

function extractProductImageFromHtml(html, pageUrl) {
  if (!html || typeof html !== "string") return null;

  // 1. Amazon specific high-res product image extraction
  if (/amazon\./i.test(pageUrl)) {
    const dynamicMatch =
      html.match(/data-a-dynamic-image=["']\{&quot;(https:\/\/[^&]*?media-amazon\.com\/images\/I\/[^&]*?)&quot;/i) ||
      html.match(/data-old-hires=["'](https:\/\/[^"']*?media-amazon\.com\/images\/I\/[^"']*)["']/i) ||
      html.match(/id=["']landingImage["'][^>]*src=["'](https:\/\/[^"']*?media-amazon\.com\/images\/I\/[^"']*)["']/i);
    if (dynamicMatch) {
      return dynamicMatch[1].replace(/\._[A-Za-z0-9_,]+_\./, ".");
    }
    const amazonImgMatch = html.match(/https:\/\/[^"'\s<>]*?media-amazon\.com\/images\/I\/[A-Za-z0-9+_-]+?\.(?:jpg|png|webp)/i);
    if (amazonImgMatch) {
      return amazonImgMatch[0].replace(/\._[A-Za-z0-9_,]+_\./, ".");
    }
  }

  // 2. Schema.org JSON-LD (Product.image)
  const ldMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of ldMatches) {
    try {
      const data = JSON.parse(match[1]);
      const checkItem = (item) => {
        if (!item) return null;
        if (item["@type"] === "Product" || item.image) {
          const img = item.image;
          if (typeof img === "string") return img;
          if (Array.isArray(img) && img.length > 0) return typeof img[0] === "string" ? img[0] : img[0]?.url;
          if (img && typeof img.url === "string") return img.url;
        }
        return null;
      };
      if (Array.isArray(data)) {
        for (const it of data) {
          const found = checkItem(it);
          if (found) return resolveScrapedUrl(found, pageUrl);
        }
      } else {
        const found = checkItem(data) || (data["@graph"] && data["@graph"].map(checkItem).find(Boolean));
        if (found) return resolveScrapedUrl(found, pageUrl);
      }
    } catch {}
  }

  // 3. OpenGraph og:image (Standard across Shopify, WooCommerce, Magento, etc.)
  const ogMatch =
    html.match(/<meta[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["']/i) ||
    html.match(/<meta[^>]*name=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["'](?:og:image|twitter:image)["']/i);
  if (ogMatch && ogMatch[1] && !isGenericScrapedIcon(ogMatch[1])) {
    return resolveScrapedUrl(ogMatch[1], pageUrl);
  }

  // 4. Product-specific img tags
  const productImgMatch =
    html.match(/<img[^>]*class=["'][^"']*(?:product|featured|main|primary)[^"']*["'][^>]*src=["']([^"']+)["']/i) ||
    html.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*(?:product|featured|main|primary)[^"']*["']/i);
  if (productImgMatch && productImgMatch[1] && !isGenericScrapedIcon(productImgMatch[1])) {
    return resolveScrapedUrl(productImgMatch[1], pageUrl);
  }

  // 5. Fallback og:image even if it was skipped
  if (ogMatch && ogMatch[1]) {
    return resolveScrapedUrl(ogMatch[1], pageUrl);
  }

  return null;
}

// 1B) URL Web Scraping & Structured Business Analysis (V2 Entry Point)
app.post("/api/research/url", authRequired, async (req, res) => {
  const { url, businessName, businessType, town } = req.body || {};
  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({ error: "Please enter a valid website URL." });
  }

  let targetUrl = url.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  // SSRF Protection: Block localhost, private subnets, cloud metadata
  const disallowed = isDisallowedUrl(targetUrl);
  if (disallowed) {
    return res.status(400).json({ error: disallowed });
  }

  const domainBrand = extractDomainBrand(targetUrl);

  let fetchedHtml = "";
  let fullFetchedHtml = "";
  let fetchSucceeded = false;
  let fetchError = null;

  try {
    // safeFetch re-checks the resolved IP and every redirect hop (SSRF), and caps the page size
    const response = await netguard.safeFetch(targetUrl, {
      timeoutMs: 8000,
      maxBytes: 5 * 1024 * 1024,
      truncate: true,
      headers: {
        "User-Agent": SCRAPER_UA,
        "Accept": "text/html,application/xhtml+xml,text/plain,*/*",
      },
    });

    if (response.ok) {
      const text = response.body.toString("utf8");
      fullFetchedHtml = text;
      fetchedHtml = text.slice(0, 60000);
      fetchSucceeded = true;
    } else {
      fetchError = `HTTP ${response.status} from target server`;
    }
  } catch (err) {
    // a restricted target (private/metadata address, directly or after a redirect) is refused outright
    if (err.code === "EBLOCKED") {
      return res.status(400).json({ error: err.redirected ? `Redirect destination rejected: ${err.message}` : err.message });
    }
    fetchError = err.message || "Network request failed";
  }

  // Extract meta tags from HTML
  let pageTitle = "";
  let metaDescription = "";
  let headings = [];

  if (fetchSucceeded && fetchedHtml) {
    const titleMatch = fetchedHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) pageTitle = titleMatch[1].replace(/\s+/g, " ").trim();

    const descMatch =
      fetchedHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
      fetchedHtml.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
      fetchedHtml.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    if (descMatch) metaDescription = descMatch[1].trim();

    const h1Matches = [...fetchedHtml.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
    headings = h1Matches.map((m) => m[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 3);
  }

  let productPhoto = null;
  let productImageUrl = null;

  if (fetchSucceeded && (fullFetchedHtml || fetchedHtml)) {
    productImageUrl = extractProductImageFromHtml(fullFetchedHtml || fetchedHtml, targetUrl);
    if (productImageUrl) {
      try {
        // The image URL comes from the scraped page, so it gets the same SSRF checks as the page itself
        const imgRes = await netguard.safeFetch(productImageUrl, {
          timeoutMs: 6000,
          maxBytes: 4.5 * 1024 * 1024,
          headers: { "User-Agent": SCRAPER_UA },
        });
        // Only hand back bytes that really are an image — never arbitrary responses
        const mime = imgRes.ok ? sniffImageMime(imgRes.body) : null;
        if (mime) {
          productPhoto = {
            name: "Product Photo",
            mime,
            data: imgRes.body.toString("base64"),
            previewUrl: productImageUrl,
            fromWebsite: true,
          };
        }
      } catch (e) {
        console.warn("[api/research/url] Failed to fetch image buffer for:", productImageUrl, e.message);
      }
    }
  }

  // Analyze the business with Claude AI or heuristic extractor
  try {
    const systemPrompt = `You are an AI brand and business researcher for commercial video advertising.
Given the WEBSITE URL, domain name, HTML title, meta description, and key headings from a company's website, extract structured information for a 15-30 second video commercial:
Output JSON between @@JSON@@ and @@END@@ markers:
@@JSON@@
{
  "brandName": "Extracted brand/company name (e.g. Amazon, Kalyan Jewellers, Shree Silk Sarees)",
  "businessType": "Closest business category from these exact options: Saree, Clothing & Apparel | Jewellery & Accessories | Sweets, Bakery & Restaurant | Kirana, Grocery & Supermarket | Electronics, Mobile & Appliances | Salon, Spa & Beauty | Healthcare, Clinic & Pharmacy | Real Estate & Home Decor | Gym, Fitness & Yoga | Education, Coaching & Tuition | Automobile & Garage | Other Local Business",
  "town": "City/town if detected, or empty string",
  "suggestedBrief": "Compelling 2-3 sentence creative video brief describing key products, target audience, and customer appeal",
  "products": ["Product/Service 1", "Product/Service 2"],
  "keyOffer": "USP or main value proposition detected",
  "brandTone": "Brand tone (e.g. Premium traditional, Relatable everyday, Trendy youth)",
  "pageTitle": "The page title"
}
@@END@@`;

    const promptContent = `WEBSITE URL: ${targetUrl}
DOMAIN BRAND: ${domainBrand || "Not detected"}
PAGE TITLE: ${pageTitle || "None"}
META DESCRIPTION: ${metaDescription || "None"}
HEADINGS: ${headings.join(" | ") || "None"}`;

    const raw = await callClaude({
      system: systemPrompt,
      content: promptContent,
      maxTokens: 1000,
      thinking: false,
    });

    const parsed = parseJSONBlock(raw);
    const extractedBrand =
      (parsed && parsed.brandName && parsed.brandName.trim()) ||
      domainBrand ||
      (pageTitle ? pageTitle.split(/[-–|]/)[0].trim() : "") ||
      (businessName && businessName.trim()) ||
      "My Business";

    const extractedCategory = matchClosestCategory(
      (parsed && (parsed.businessType || parsed.category)) || pageTitle || targetUrl,
      businessType || "Other Local Business"
    );

    return res.json({
      status: "success",
      url: targetUrl,
      fetchSucceeded: true,
      brandName: extractedBrand,
      businessType: extractedCategory,
      category: extractedCategory,
      town: (parsed && parsed.town) || town || "",
      suggestedBrief:
        (parsed && parsed.suggestedBrief) ||
        metaDescription ||
        `High-converting commercial showcasing the products and services of ${extractedBrand}`,
      products: Array.isArray(parsed && parsed.products) ? parsed.products : [pageTitle || "Featured Products"],
      keyOffer: (parsed && parsed.keyOffer) || "",
      brandTone: (parsed && parsed.brandTone) || "Relatable & Trustworthy",
      pageTitle,
      metaDescription,
      productImageUrl,
      productPhoto,
    });
  } catch (e) {
    console.warn("[api/research/url] Claude parsing or fetch fallback:", e.message);
    const fallbackBrand = domainBrand || (pageTitle ? pageTitle.split(/[-–|]/)[0].trim() : "") || (businessName && businessName.trim()) || "My Business";
    const fallbackCategory = matchClosestCategory(pageTitle || targetUrl, businessType || "Other Local Business");
    return res.json({
      status: fetchSucceeded ? "success" : "fallback",
      url: targetUrl,
      fetchSucceeded,
      message: fetchSucceeded ? "Extracted from website" : `Could not connect to ${targetUrl} directly (${fetchError || "Blocked by target server"}). Detected brand details below.`,
      brandName: fallbackBrand,
      businessType: fallbackCategory,
      category: fallbackCategory,
      town: town || "",
      suggestedBrief: metaDescription || `High-converting commercial showcasing the products, customer care, and value of ${fallbackBrand}.`,
      products: [pageTitle || "Featured Products"],
      keyOffer: "",
      brandTone: "Warm & Trustworthy",
      pageTitle,
      metaDescription,
      productImageUrl,
      productPhoto,
    });
  }
});

// 1C) Existing Script Import & Quality Gate Validation (V2 Entry Point)
app.post("/api/script/validate-and-import", authRequired, async (req, res) => {
  try {
    const { rawScript, businessName, businessType, town, language, creativeStyle, brief, brandTone, targetDuration, duration, aspectRatio, platform, projectId, creativeGuardrails: bodyGuardrails } = req.body || {};
    if (!rawScript || typeof rawScript !== "string" || !rawScript.trim()) {
      return res.status(400).json({ error: "Please enter or paste script text to validate." });
    }

    const { guardrails: activeGuardrails } = await guardrails.resolveProjectGuardrails({
      db,
      projectId,
      userId: req.user.id,
      fallbackGuardrails: bodyGuardrails,
    });

    // Inspect sliceLines for dialogue and visual separation during script normalization
    const sliceLines = (lines, start, end) => lines.slice(start, end);

    const result = await creative.normalizeUserScript({
      rawScript,
      businessName,
      businessType,
      town,
      language,
      creativeStyle,
      brief,
      brandTone,
      targetDuration: targetDuration || duration,
      aspectRatio,
      platform,
      creativeGuardrails: activeGuardrails,
    });

    return res.json(result);
  } catch (err) {
    console.error("[api/script/validate-and-import]", err.message);
    res.status(err.status || 500).json({ error: err.message || "Failed to validate script." });
  }
});

// 1D) Creative Guardrails (Project Do's & Don'ts Source of Truth Endpoints)
app.get("/api/projects/:id/guardrails", authRequired, async (req, res) => {
  try {
    const project = await db.getProjectById(req.params.id, req.user.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found or not owned by authenticated user." });
    }
    const creativeGuardrails = guardrails.normalizeCreativeGuardrails(project.creativeGuardrails);
    res.json({ ok: true, status: "success", creativeGuardrails });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Failed to retrieve Creative Guardrails." });
  }
});

app.put("/api/projects/:id/guardrails", authRequired, async (req, res) => {
  try {
    const existing = await db.getProjectById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: "Project not found or not owned by authenticated user." });
    }

    const incoming = req.body?.creativeGuardrails !== undefined ? req.body.creativeGuardrails : req.body;
    const normalized = guardrails.normalizeCreativeGuardrails(incoming, existing.creativeGuardrails);
    let updatedUnderstanding = existing.aiUnderstanding || (existing.creativeDNA && existing.creativeDNA.aiUnderstanding) || null;

    if (
      updatedUnderstanding &&
      understandingSpine.isUnderstandingOutdated(updatedUnderstanding, existing.brief || "", normalized)
    ) {
      updatedUnderstanding = {
        ...updatedUnderstanding,
        approval_status: "outdated",
      };
    }

    const saved = await db.saveProject(
      {
        ...existing,
        creativeGuardrails: normalized,
        aiUnderstanding: updatedUnderstanding,
      },
      req.user.id
    );

    res.json({
      ok: true,
      status: "success",
      creativeGuardrails: saved.creativeGuardrails,
      aiUnderstanding: saved.aiUnderstanding,
      project: saved,
    });
  } catch (err) {
    console.error("[put/api/projects/:id/guardrails]", err.message);
    res.status(err.status || 500).json({ error: err.message || "Failed to update Creative Guardrails." });
  }
});

// 1b) AI Understanding (Intermediate Brief Analysis & Polish)
app.post("/api/creative/ai-understanding", authRequired, async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      town,
      brief,
      language,
      brandTone,
      occasion,
      websiteUrl,
      creativeStyle,
      format,
      dimension,
      aspectRatio,
      duration,
      targetDuration,
      platform,
      hasLogo,
      videoLogo,
      brandLogo,
      logoDataUrl,
      logo,
      hasProductPhoto,
      productPhoto,
      settings: bodySettings,
      projectId,
      userCorrections,
      previousUnderstanding,
      creativeGuardrails: bodyGuardrails,
      eventContext: bodyEventContext,
    } = req.body || {};

    if (!brief || !String(brief).trim()) {
      return res.status(400).json({ error: "Creative brief is required to generate AI Understanding." });
    }

    // Resolve and sync Creative Guardrails from DB project / request
    let existingProject = null;
    if (projectId) {
      existingProject = await db.getProjectById(projectId, req.user.id);
      if (!existingProject && (await db.projectExists(projectId))) {
        return res.status(403).json({ error: "Project not found or not owned by authenticated user." });
      }
    }

    const activeGuardrails = bodyGuardrails !== undefined
      ? guardrails.normalizeCreativeGuardrails(bodyGuardrails, existingProject?.creativeGuardrails)
      : guardrails.normalizeCreativeGuardrails(existingProject?.creativeGuardrails);

    const activeEventContext = bodyEventContext !== undefined
      ? eventContextUtil.normalizeEventContext(bodyEventContext, existingProject?.eventContext)
      : eventContextUtil.normalizeEventContext(existingProject?.eventContext);
    const hasEvent = eventContextUtil.hasActiveEventContext(activeEventContext);

    const savedProjSettings = (existingProject && existingProject.creativeDNA && existingProject.creativeDNA.productionSettings) || {};
    const mergedSettings = understandingSpine.normalizeUnderstandingSettings({
      ...savedProjSettings,
      ...(bodySettings && typeof bodySettings === "object" ? bodySettings : {}),
      ...(language !== undefined ? { language } : {}),
      ...(creativeStyle !== undefined || format !== undefined ? { creativeStyle: creativeStyle || format } : {}),
      ...(dimension !== undefined || aspectRatio !== undefined ? { dimension: dimension || aspectRatio } : {}),
      ...(duration !== undefined || targetDuration !== undefined ? { duration: duration || targetDuration } : {}),
      ...(platform !== undefined ? { platform } : {}),
      ...(hasLogo !== undefined || videoLogo !== undefined || brandLogo !== undefined || logoDataUrl !== undefined || logo !== undefined
        ? { hasLogo: Boolean(hasLogo || videoLogo || brandLogo || logoDataUrl || logo) }
        : {}),
      ...(hasProductPhoto !== undefined || productPhoto !== undefined
        ? { hasProductPhoto: Boolean(hasProductPhoto || productPhoto) }
        : {}),
    });

    const understanding = await understandingSpine.generateAiUnderstanding({
      businessName,
      businessType,
      town,
      brief: String(brief).trim(),
      language: mergedSettings.language,
      brandTone: brandTone || "Warm & Authentic",
      occasion,
      websiteUrl,
      settings: mergedSettings,
      eventContext: hasEvent ? activeEventContext : null,
      userCorrections,
      previousUnderstanding,
      creativeGuardrails: activeGuardrails,
    });

    if (projectId && existingProject) {
      try {
        await db.saveProject(
          {
            ...existingProject,
            brief: String(brief).trim(),
            language: mergedSettings.language,
            creativeStyle: mergedSettings.creativeStyle,
            productionSettings: understanding.source_settings,
            creativeGuardrails: guardrails.hasActiveGuardrails(activeGuardrails) || bodyGuardrails !== undefined
              ? activeGuardrails
              : existingProject.creativeGuardrails,
            eventContext: hasEvent ? activeEventContext : null,
            aiUnderstanding: understanding,
          },
          req.user.id
        );
      } catch (err) {
        console.warn("[ai-understanding] project association warning:", err.message);
      }
    }

    res.json({
      ok: true,
      status: "success",
      understanding,
      creativeGuardrails: activeGuardrails,
      eventContext: hasEvent ? activeEventContext : null,
    });
  } catch (err) {
    console.error("[api/creative/ai-understanding]", err.message);
    res.status(err.status || 500).json({ error: err.message || "Failed to generate AI Understanding." });
  }
});

app.put("/api/creative/ai-understanding/:projectId", authRequired, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { understanding, approvalStatus } = req.body || {};

    if (!understanding || typeof understanding !== "object") {
      return res.status(400).json({ error: "Structured understanding object is required." });
    }

    const existing = await db.getProjectById(projectId, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: "Project not found or not owned by user." });
    }

    if (approvalStatus === "approved") {
      const activeBrief = existing.brief || understanding.source_brief || "";
      const activeGuardrails = existing.creativeGuardrails || null;
      const activeSettings = (existing.creativeDNA && existing.creativeDNA.productionSettings) || null;
      const activeEvent = existing.eventContext || null;
      if (understandingSpine.isUnderstandingOutdated(understanding, activeBrief, activeGuardrails, activeSettings, activeEvent)) {
        return res.status(409).json({
          error: "Cannot approve outdated AI Understanding. Please regenerate with your latest brief, guardrails, event context, and settings.",
          code: "UNDERSTANDING_OUTDATED",
        });
      }
    }

    const updated = {
      ...understanding,
      approval_status: approvalStatus === "approved" ? "approved" : understanding.approval_status || "pending",
      approved_at: approvalStatus === "approved" ? new Date().toISOString() : understanding.approved_at || null,
      updated_at: new Date().toISOString(),
    };

    const saved = await db.saveProject(
      {
        ...existing,
        aiUnderstanding: updated,
      },
      req.user.id
    );

    res.json({ ok: true, status: "success", understanding: updated, project: saved });
  } catch (err) {
    console.error("[api/creative/ai-understanding/:projectId]", err.message);
    res.status(500).json({ error: err.message || "Failed to update AI Understanding." });
  }
});

app.get("/api/creative/ai-understanding/:projectId", authRequired, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await db.getProjectById(projectId, req.user.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found or not owned by user." });
    }
    const understanding = project.aiUnderstanding || (project.creativeDNA && project.creativeDNA.aiUnderstanding) || null;
    res.json({ ok: true, status: "success", understanding });
  } catch (err) {
    console.error("[get/api/creative/ai-understanding/:projectId]", err.message);
    res.status(500).json({ error: err.message || "Failed to retrieve AI Understanding." });
  }
});

// 2) Creative Direction
app.post("/api/creative/directions", authRequired, async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      town,
      brief,
      research,
      festival,
      format,
      creativeStyle,
      language,
      dimension,
      aspectRatio,
      duration,
      targetDuration,
      hasLogo,
      videoLogo,
      brandLogo,
      logoDataUrl,
      brandTone,
      projectId,
      aiUnderstanding: clientSuppliedUnderstanding,
      creativeGuardrails: bodyGuardrails,
      eventContext: bodyEventContext,
    } = req.body || {};

    let verifiedUnderstanding = null;
    let activeGuardrails = null;
    let activeEventContext = null;

    // Point 3: Backend checks saved approval status and project ownership before allowing Creative Idea Generation
    // Do NOT trust client-supplied aiUnderstanding as proof of approval
    if (projectId) {
      const project = await db.getProjectById(projectId, req.user.id);
      if (!project) {
        return res.status(403).json({ error: "Project not found or not owned by authenticated user." });
      }
      activeGuardrails = guardrails.normalizeCreativeGuardrails(project.creativeGuardrails);
      activeEventContext = bodyEventContext !== undefined
        ? eventContextUtil.normalizeEventContext(bodyEventContext, project.eventContext)
        : eventContextUtil.normalizeEventContext(project.eventContext);
      const saved = project.aiUnderstanding || (project.creativeDNA && project.creativeDNA.aiUnderstanding) || null;
      if (saved) {
        const currentBrief = brief || project.brief || "";
        const fallbackSettings = (project.creativeDNA && project.creativeDNA.productionSettings) || saved.source_settings || {};
        const activeSettings = understandingSpine.normalizeUnderstandingSettings({
          ...fallbackSettings,
          ...(language !== undefined ? { language } : {}),
          ...(format !== undefined || creativeStyle !== undefined ? { creativeStyle: format || creativeStyle } : {}),
          ...(dimension !== undefined || aspectRatio !== undefined ? { dimension: dimension || aspectRatio } : {}),
          ...(duration !== undefined || targetDuration !== undefined ? { duration: duration || targetDuration } : {}),
          ...(hasLogo !== undefined || videoLogo !== undefined || brandLogo !== undefined || logoDataUrl !== undefined
            ? { hasLogo: Boolean(hasLogo || videoLogo || brandLogo || logoDataUrl) }
            : {}),
        });
        const isOutdated =
          understandingSpine.isUnderstandingOutdated(saved, currentBrief) ||
          understandingSpine.isUnderstandingOutdated(
            saved,
            currentBrief,
            activeGuardrails,
            activeSettings,
            eventContextUtil.hasActiveEventContext(activeEventContext) ? activeEventContext : null
          );
        if (isOutdated || saved.approval_status === "outdated") {
          console.warn("[directions] Project understanding is outdated compared to active brief, guardrails, event, or settings");
          return res.status(409).json({
            error: "AI Understanding is outdated because your brief, creative guardrails, event context, or settings changed. Please review and re-approve before generating ideas.",
            code: "UNDERSTANDING_OUTDATED",
          });
        }
        if (saved.approval_status === "approved" || saved.approval_status === "auto_approved") {
          verifiedUnderstanding = saved;
        } else {
          return res.status(409).json({
            error: "AI Understanding must be approved before generating creative ideas.",
            code: "UNDERSTANDING_NOT_APPROVED",
          });
        }
      }
    } else {
      activeGuardrails = guardrails.normalizeCreativeGuardrails(bodyGuardrails);
      activeEventContext = eventContextUtil.normalizeEventContext(bodyEventContext);
    }

    // Point 2: Ensure mock understanding data can never be used in production
    if (process.env.NODE_ENV === "production" && verifiedUnderstanding && verifiedUnderstanding.is_mock) {
      return res.status(400).json({ error: "Mock understanding data cannot be used in production." });
    }

    const result = await creative.generateDirections({
      businessName,
      businessType,
      town,
      brief,
      research,
      festival,
      language: language || "English",
      format: format || creativeStyle || "UGC / Creator-style",
      brandTone,
      aiUnderstanding: verifiedUnderstanding,
      creativeGuardrails: activeGuardrails,
      eventContext: eventContextUtil.hasActiveEventContext(activeEventContext) ? activeEventContext : null,
    });
    res.json(result);
  } catch (e) {
    console.error("[api/creative/directions]", e.message);
    res.status(e.status || 500).json({ error: e.message });
  }
});

// 3) Hook Intelligence
app.post("/api/creative/hooks", authRequired, async (req, res) => {
  try {
    const { businessName, businessType, brief, direction, language, format, creativeStyle, brandTone, projectId, creativeGuardrails: bodyGuardrails, eventContext: bodyEventContext } = req.body || {};
    const { guardrails: activeGuardrails } = await guardrails.resolveProjectGuardrails({
      db,
      projectId,
      userId: req.user.id,
      fallbackGuardrails: bodyGuardrails,
    });
    const { eventContext: activeEventContext, hasEvent } = await eventContextUtil.resolveProjectEventContext({
      db,
      projectId,
      userId: req.user.id,
      fallbackEventContext: bodyEventContext,
    });
    const result = await creative.generateHooks({
      businessName,
      businessType,
      brief,
      direction,
      language: language || "English",
      format: format || creativeStyle || "UGC / Creator-style",
      brandTone,
      creativeGuardrails: activeGuardrails,
      eventContext: hasEvent ? activeEventContext : null,
    });
    res.json(result);
  } catch (e) {
    console.error("[api/creative/hooks]", e.message);
    res.status(e.status || 500).json({ error: e.message });
  }
});

// 4) Plot Generation
app.post("/api/creative/plots", authRequired, async (req, res) => {
  try {
    const { businessName, businessType, brief, direction, hook, format, language, brandTone, projectId, creativeGuardrails: bodyGuardrails, eventContext: bodyEventContext } = req.body || {};
    const { guardrails: activeGuardrails } = await guardrails.resolveProjectGuardrails({
      db,
      projectId,
      userId: req.user.id,
      fallbackGuardrails: bodyGuardrails,
    });
    const { eventContext: activeEventContext, hasEvent } = await eventContextUtil.resolveProjectEventContext({
      db,
      projectId,
      userId: req.user.id,
      fallbackEventContext: bodyEventContext,
    });
    const result = await creative.generatePlots({
      businessName,
      businessType,
      brief,
      direction,
      hook,
      format: format || "Storytelling",
      language: language || "English",
      brandTone,
      creativeGuardrails: activeGuardrails,
      eventContext: hasEvent ? activeEventContext : null,
    });
    res.json(result);
  } catch (e) {
    console.error("[api/creative/plots]", e.message);
    res.status(e.status || 500).json({ error: e.message });
  }
});

// 5) Story Architecture & World Building
app.post("/api/creative/story", authRequired, async (req, res) => {
  try {
    const { businessName, businessType, town, brief, direction, hook, plot, format, language, brandTone, projectId, creativeGuardrails: bodyGuardrails, eventContext: bodyEventContext } = req.body || {};
    const { guardrails: activeGuardrails } = await guardrails.resolveProjectGuardrails({
      db,
      projectId,
      userId: req.user.id,
      fallbackGuardrails: bodyGuardrails,
    });
    const { eventContext: activeEventContext, hasEvent } = await eventContextUtil.resolveProjectEventContext({
      db,
      projectId,
      userId: req.user.id,
      fallbackEventContext: bodyEventContext,
    });
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
      brandTone,
      creativeGuardrails: activeGuardrails,
      eventContext: hasEvent ? activeEventContext : null,
    });
    res.json(result);
  } catch (e) {
    console.error("[api/creative/story]", e.message);
    res.status(e.status || 500).json({ error: e.message });
  }
});

// 6) Master Script Synthesis & Quality Gate
app.post("/api/creative/synthesize-script", authRequired, async (req, res) => {
  try {
    const { form, creativeDNA, constraints, avoid, projectId, creativeGuardrails: bodyGuardrails, eventContext: bodyEventContext } = req.body || {};
    if (!form || !form.businessName) throw Object.assign(new Error("Form data with businessName is required."), { status: 400 });
    const validated = validateForm(form);
    const { guardrails: activeGuardrails, project } = await guardrails.resolveProjectGuardrails({
      db,
      projectId,
      userId: req.user.id,
      fallbackGuardrails: bodyGuardrails,
      constraints,
      avoid,
    });
    const activeEventContext = bodyEventContext !== undefined
      ? eventContextUtil.normalizeEventContext(bodyEventContext, project?.eventContext)
      : eventContextUtil.normalizeEventContext(project?.eventContext);
    const hasEvent = eventContextUtil.hasActiveEventContext(activeEventContext);

    if (project && project.aiUnderstanding) {
      const savedSettings = (project.creativeDNA && project.creativeDNA.productionSettings) || null;
      const isOutdated = understandingSpine.isUnderstandingOutdated(
        project.aiUnderstanding,
        validated.brief || project.brief || "",
        activeGuardrails,
        savedSettings,
        hasEvent ? activeEventContext : null
      );
      if (isOutdated || project.aiUnderstanding.approval_status === "outdated") {
        return res.status(409).json({
          error: "AI Understanding is outdated because your brief, creative guardrails, event context, or settings changed. Please review and re-approve before generating script.",
          code: "UNDERSTANDING_OUTDATED",
        });
      }
      if (project.aiUnderstanding.approval_status !== "approved" && project.aiUnderstanding.approval_status !== "auto_approved") {
        return res.status(409).json({
          error: "AI Understanding must be approved before generating script.",
          code: "UNDERSTANDING_NOT_APPROVED",
        });
      }
    }

    const result = await creative.synthesizeMasterScript({
      form: validated,
      creativeDNA: creativeDNA || {},
      constraints: constraints || [],
      avoid: avoid || [],
      creativeGuardrails: activeGuardrails,
      eventContext: hasEvent ? activeEventContext : null,
    });
    res.json(result);
  } catch (e) {
    console.error("[api/creative/synthesize-script]", e.message);
    res.status(e.status || 500).json({ error: e.message, failures: e.failures || [] });
  }
});

// 7) Scene-Level AI Rewriter
app.post("/api/creative/rewrite-scene", authRequired, async (req, res) => {
  try {
    const { sceneText, sceneIndex, totalScenes, instruction, form, characters, setting, brandTone, projectId, creativeGuardrails: bodyGuardrails, eventContext: bodyEventContext } = req.body || {};
    if (!sceneText || !instruction) throw Object.assign(new Error("Scene text and instruction are required."), { status: 400 });
    const { guardrails: activeGuardrails } = await guardrails.resolveProjectGuardrails({
      db,
      projectId,
      userId: req.user.id,
      fallbackGuardrails: bodyGuardrails,
    });
    const { eventContext: activeEventContext, hasEvent } = await eventContextUtil.resolveProjectEventContext({
      db,
      projectId,
      userId: req.user.id,
      fallbackEventContext: bodyEventContext,
    });
    const rewritten = await creative.rewriteScene({
      sceneText,
      sceneIndex: Number(sceneIndex) || 0,
      totalScenes: Number(totalScenes) || 4,
      instruction,
      form,
      characters,
      setting,
      brandTone: brandTone || form?.brandTone,
      creativeGuardrails: activeGuardrails,
      eventContext: hasEvent ? activeEventContext : null,
    });
    const guardrailReport = guardrails.hasActiveGuardrails(activeGuardrails)
      ? guardrails.validateOutputAgainstGuardrails({
          outputText: rewritten,
          stage: "rewrite",
          guardrails: activeGuardrails,
        })
      : null;
    res.json({ scene: rewritten, guardrailReport });
  } catch (e) {
    console.error("[api/creative/rewrite-scene]", e.message);
    res.status(e.status || 500).json({ error: e.message });
  }
});

// ---- 2) start the Magnific flow ----
// 8) Simple Business Studio — 3 Ready-Made Ad Packages
app.post("/api/creative/simple-packages", authRequired, async (req, res) => {
  try {
    const {
      businessName,
      businessType,
      town,
      brief,
      targetAudience,
      language,
      creativeStyle,
      brandTone,
      duration,
      aspectRatio,
      dimension,
      hasLogo,
      brandLogo,
      logoDataUrl,
      projectId,
      aiUnderstanding: incomingUnderstanding,
      creativeGuardrails: bodyGuardrails,
      eventContext: bodyEventContext,
    } = req.body || {};
    if (!businessName || !businessName.trim()) {
      return res.status(400).json({ error: "businessName is required." });
    }
    if (!brief || !brief.trim()) {
      return res.status(400).json({ error: "Brief is required." });
    }

    // Load project with ownership check if projectId provided
    let existingProject = null;
    if (projectId) {
      existingProject = await db.getProjectById(projectId, req.user.id);
      if (!existingProject && (await db.projectExists(projectId))) {
        return res.status(403).json({ error: "Project not found or not owned by authenticated user." });
      }
    }

    const activeGuardrails = bodyGuardrails !== undefined
      ? guardrails.normalizeCreativeGuardrails(bodyGuardrails, existingProject?.creativeGuardrails)
      : guardrails.normalizeCreativeGuardrails(existingProject?.creativeGuardrails);

    const activeEventContext = bodyEventContext !== undefined
      ? eventContextUtil.normalizeEventContext(bodyEventContext, existingProject?.eventContext)
      : eventContextUtil.normalizeEventContext(existingProject?.eventContext);
    const hasEvent = eventContextUtil.hasActiveEventContext(activeEventContext);

    const simpleSettings = understandingSpine.normalizeUnderstandingSettings({
      language: language || "English",
      creativeStyle: creativeStyle || "UGC / Creator-style",
      dimension: aspectRatio || dimension || "9:16",
      duration: duration || "20s",
      hasLogo: Boolean(hasLogo || brandLogo || logoDataUrl),
    });

    // Simple Mode: AI Understanding executes internally on the backend and silently refreshes when brief, guardrails, event, or settings change
    let internalUnderstanding = (existingProject && existingProject.aiUnderstanding) || incomingUnderstanding || null;
    const understandingIsStale = internalUnderstanding
      ? understandingSpine.isUnderstandingOutdated(
          internalUnderstanding,
          brief.trim(),
          activeGuardrails,
          simpleSettings,
          hasEvent ? activeEventContext : null
        )
      : true;

    if (!internalUnderstanding || understandingIsStale) {
      try {
        internalUnderstanding = await understandingSpine.generateAiUnderstanding({
          businessName: businessName.trim(),
          businessType: businessType || "Local Business",
          town: town || "",
          brief: brief.trim(),
          language: simpleSettings.language,
          brandTone: brandTone || "Warm & Authentic",
          settings: simpleSettings,
          eventContext: hasEvent ? activeEventContext : null,
          creativeGuardrails: activeGuardrails,
        });
        // Point 4: Use distinct internal status 'auto_approved' rather than explicit user approval 'approved'
        internalUnderstanding.approval_status = "auto_approved";
        internalUnderstanding.approved_at = new Date().toISOString();
      } catch (err) {
        if (process.env.NODE_ENV === "production") {
          console.error("[simple-packages] AI understanding failed in production:", err.message);
          return res.status(500).json({ error: `AI Understanding failed: ${err.message}` });
        }
        console.warn("[simple-packages] Silent AI understanding warning:", err.message);
      }
    } else {
      internalUnderstanding.approval_status = "auto_approved";
    }

    // Point 2: Ensure mock understanding data can never silently be used in production
    if (process.env.NODE_ENV === "production" && internalUnderstanding && internalUnderstanding.is_mock) {
      return res.status(500).json({ error: "Mock understanding data cannot be used in production." });
    }

    // Save internally against the project if projectId provided
    if (projectId && existingProject && (internalUnderstanding || bodyGuardrails !== undefined || bodyEventContext !== undefined)) {
      try {
        await db.saveProject(
          {
            ...existingProject,
            brief: brief.trim(),
            language: simpleSettings.language,
            creativeStyle: simpleSettings.creativeStyle,
            productionSettings: simpleSettings,
            creativeGuardrails: activeGuardrails,
            eventContext: hasEvent ? activeEventContext : null,
            aiUnderstanding: internalUnderstanding || existingProject.aiUnderstanding,
          },
          req.user.id
        );
      } catch (err) {
        console.warn("[simple-packages] project save warning:", err.message);
      }
    }

    const packages = await creative.generateSimpleAdPackages({
      businessName: businessName.trim(),
      businessType: businessType || "Local Business",
      town: town || "",
      brief: brief || "",
      targetAudience: targetAudience || (internalUnderstanding && internalUnderstanding.target_audience) || "",
      language: language || "English",
      creativeStyle: creativeStyle || "UGC / Creator-style",
      brandTone,
      duration: duration || "20s",
      aspectRatio: aspectRatio || dimension || "9:16",
      hasLogo: Boolean(hasLogo || brandLogo || logoDataUrl),
      aiUnderstanding: internalUnderstanding,
      creativeGuardrails: activeGuardrails,
      eventContext: hasEvent ? activeEventContext : null,
    });
    res.json({
      status: "success",
      packages,
      aiUnderstanding: internalUnderstanding,
      creativeGuardrails: activeGuardrails,
      eventContext: hasEvent ? activeEventContext : null,
    });
  } catch (e) {
    console.error("[api/creative/simple-packages]", e.message);
    res.status(e.status || 500).json({ error: e.message });
  }
});
app.post("/api/run", authRequired, async (req, res) => {
  try {
    const {
      scenes,
      character1,
      character2,
      setting,
      productPhoto,
      logo,
      duration,
      aspectRatio,
      dimension,
      platform,
      shotSpec,
      product,
      productName,
      specialty,
      brief,
      businessType,
      businessName,
      projectId,
      creativeGuardrails: bodyGuardrails,
    } = req.body || {};
    if (!Array.isArray(scenes) || !scenes.length) throw new Error("No scenes to send.");

    const { guardrails: activeGuardrails } = await guardrails.resolveProjectGuardrails({
      db,
      projectId,
      userId: req.user.id,
      fallbackGuardrails: bodyGuardrails,
    });

    // Validate pre-prompt scenes against Creative Guardrails before invoking Magnific render
    const preRenderGuardrailReport = guardrails.hasActiveGuardrails(activeGuardrails)
      ? guardrails.validateOutputAgainstGuardrails({
          outputText: scenes.join("\n"),
          visualPromptText: scenes.join("\n"),
          stage: "video_prompt",
          guardrails: activeGuardrails,
        })
      : null;

    if (preRenderGuardrailReport && preRenderGuardrailReport.hasCriticalViolation) {
      return res.status(422).json({
        error: `Critical Creative Guardrail violation prevented video rendering: ${preRenderGuardrailReport.automatedChecks.criticalViolations.map((v) => v.explanation).join(" | ")}`,
        code: "GUARDRAIL_VIOLATION",
        guardrailReport: preRenderGuardrailReport,
        failures: preRenderGuardrailReport.automatedChecks.criticalViolations.map((v) => v.explanation),
      });
    }

    // 9:16 unless the owner picked 16:9 or 1:1; the Magnific flow itself is chosen server-side from this
    const platformRatio = typeof platform === "string" ? (platform.includes("16:9") ? "16:9" : platform.includes("1:1") ? "1:1" : null) : null;
    const ratio = aspectRatio || dimension || shotSpec?.project?.aspectRatio || platformRatio || "9:16";
    if (!magnific.ASPECT_RATIOS.includes(ratio)) throw Object.assign(new Error(`Unsupported aspect ratio "${ratio}" — use ${magnific.ASPECT_RATIOS.join(", ")}.`), { status: 400 });
    const img = productPhoto && productPhoto.data ? cleanImage(productPhoto, "Product photo") : null;
    const logoImg = logo && logo.data ? cleanImage(logo, "Logo") : null;

    // Intelligent auto-derivation of setting and characters if missing (e.g., Simple Studio or direct API)
    const bName = (businessName || shotSpec?.project?.businessName || "the business").trim();
    const bCat = (businessType || shotSpec?.project?.businessType || "store").trim();
    const resolvedSetting = (setting || "").trim() || `Modern, well-lit ${bCat} environment at ${bName}`;
    const resolvedChar1 = (character1 || "").trim() || `${bName} Specialist / Representative`;
    const resolvedChar2 = (character2 || "").trim() || "Customer";

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
      // Synchronize staticWorld with latest continuity fields from request (continuity edits MUST take effect)
      const effectiveStaticWorld = {
        setting: resolvedSetting,
        characters: [resolvedChar1, resolvedChar2].filter(Boolean).join(" | "),
        businessType: businessType || shotSpec.project?.businessType || bCat,
        style: shotSpec.project?.style || req.body?.creativeStyle || "UGC / Creator-style",
        creativeGuardrails: activeGuardrails,
      };

      processedScenes = shotSpec.shots.map((sh, idx) => {
        const currentSceneText = scenes[idx] || "";
        const parts = extractSceneParts(currentSceneText);
        // Synchronize shot with latest scene text so manual scene edits and AI rewrites are NEVER ignored
        const updatedShot = {
          ...sh,
          primaryAction: parts.visual ? (parts.visual.split(".")[0] ? parts.visual.split(".")[0].trim() + "." : parts.visual) : sh.primaryAction,
          fullVisual: parts.visual || sh.fullVisual,
          cameraMovement: (parts.camera && parts.camera !== "smooth subtle push-in") ? parts.camera : (sh.cameraMovement || parts.camera),
          dialogue: parts.dialogue !== "None" ? parts.dialogue : (sh.dialogue || "None"),
        };

        return compileShotPrompt(updatedShot, effectiveStaticWorld, {
          duration: duration || "15s",
          shotCount: scenes.length,
          aspectRatio: ratio,
          platform: platform,
          style: shotSpec.project?.style || req.body?.creativeStyle,
          format: shotSpec.format,
          creativeGuardrails: activeGuardrails,
        });
      });
    } else {
      // Robust fallback to continuous scene compilation
      processedScenes = scenes.map((sc) => sceneForGeneration(sc, {
        setting: resolvedSetting,
        character1: resolvedChar1,
        character2: resolvedChar2,
        duration: duration || "15s",
        aspectRatio: ratio,
        platform: platform,
        businessType: businessType || shotSpec?.project?.businessType || resolvedProduct,
        language: shotSpec?.project?.language || "English",
        creativeGuardrails: activeGuardrails,
      }));
    }

    const runId = await magnific.startRun({
      scenes: processedScenes,
      character1: resolvedChar1,
      character2: resolvedChar2,
      setting: resolvedSetting,
      product: resolvedProduct,
      productName: resolvedProduct,
      productDataUrl: img ? `data:${img.mime};base64,${img.data}` : null,
      logoDataUrl: logoImg ? `data:${logoImg.mime};base64,${logoImg.data}` : null,
      aspectRatio: ratio,
    });
    // Persist runId association with authenticated user immediately
    await db.saveVideoRun(runId, req.user.id, { status: "PENDING" });
    res.json({ runId, shotCount: processedScenes.length, guardrailReport: preRenderGuardrailReport });
  } catch (e) {
    console.error("[run]", e.message);
    res.status(e.status || 500).json({ error: e.message });
  }
});

// ---- 3) poll a run ----
const videoUrls = new Set(); // legacy fallback cache
const videoOwnership = new Map(); // videoUrl -> { userId, runId, createdAt }
const downloadTickets = new Map(); // ticketId -> { userId, videoUrl, expiresAt, used }
const DOWNLOAD_TICKET_TTL_MS = 60 * 1000; // 60 seconds

function cleanExpiredTickets() {
  const now = Date.now();
  for (const [k, v] of downloadTickets) {
    if (v.expiresAt <= now || v.used) {
      downloadTickets.delete(k);
    }
  }
}

// Hosts a finished video may be downloaded from. Magnific delivers renders from Freepik's CDN,
// pikaso.cdnpk.net (with an expiring token) — it was missing here, so every video not yet copied to
// permanent storage failed with "Unapproved or invalid video storage host".
// Permanent copies are only accepted inside our own Supabase Storage bucket (engine/videoStore.js).
// VIDEO_HOSTS_EXTRA=host1,host2 adds exact hostnames without a code change.
const APPROVED_VIDEO_HOSTS = ["cdn.example.com", "pikaso.cdnpk.net", "magnific.com", "magnific.ai", "storage.googleapis.com"];
const APPROVED_VIDEO_HOST_SUFFIXES = [".magnific.com", ".magnific.ai", ".cloudfront.net", ".amazonaws.com", ".storage.googleapis.com", ".googleusercontent.com"];

function isApprovedVideoHost(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const disallowed = isDisallowedUrl(urlString);
    if (disallowed) return false;
    const host = parsed.hostname.toLowerCase();
    const extra = String(process.env.VIDEO_HOSTS_EXTRA || "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
    return (
      APPROVED_VIDEO_HOSTS.includes(host) ||
      extra.includes(host) ||
      APPROVED_VIDEO_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix)) ||
      (videoStore.isStoredUrl(urlString) && host === videoStore.storageHost())
    );
  } catch {
    return false;
  }
}

// Copy a finished video to permanent storage once per run. Concurrent polls share one upload, and a run
// already archived (its record holds a stored URL) is never copied again, even after a restart.
// If storage isn't configured or the copy fails, the Magnific URL is used as before.
const archiving = new Map(); // runId -> Promise<string|null>
function permanentVideoUrl(runId, runRecord, sourceUrl) {
  if (videoStore.isStoredUrl(runRecord.videoUrl)) return Promise.resolve(runRecord.videoUrl);
  if (!videoStore.isConfigured()) return Promise.resolve(null);
  if (!archiving.has(runId)) {
    const job = videoStore.archiveVideo({ sourceUrl, userId: runRecord.userId, runId })
      .catch((e) => {
        console.error(`[archive] run ${runId}: ${e.message} — keeping the Magnific URL`);
        return null;
      })
      .finally(() => setTimeout(() => archiving.delete(runId), 60 * 1000).unref());
    archiving.set(runId, job);
  }
  return archiving.get(runId);
}

app.get("/api/status/:runId", authRequired, async (req, res) => {
  try {
    const runRecord = await db.getVideoRun(req.params.runId);
    if (!runRecord) {
      return res.status(404).json({ error: "Video generation run not found." });
    }
    if (runRecord.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied. You do not own this video generation task." });
    }

    const s = await magnific.runStatus(req.params.runId);
    if (s.videoUrl) {
      // Magnific's URL expires — hand back (and let the app save) the permanent copy when there is one
      const stored = await permanentVideoUrl(req.params.runId, runRecord, s.videoUrl);
      const videoUrl = stored || s.videoUrl;
      for (const url of new Set([s.videoUrl, videoUrl])) {
        videoUrls.add(url);
        videoOwnership.set(url, {
          userId: runRecord.userId,
          runId: req.params.runId,
          createdAt: Date.now(),
        });
      }
      await db.updateVideoRun(req.params.runId, { videoUrl, status: s.status });
      return res.json({ ...s, videoUrl, sourceVideoUrl: s.videoUrl, archived: Boolean(stored) });
    }
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Issue short-lived, single-purpose download ticket ----
app.post("/api/download/ticket", authRequired, async (req, res) => {
  cleanExpiredTickets();
  const url = String(req.body?.url || req.body?.videoUrl || "").trim();
  if (!url) return res.status(400).json({ error: "Missing video URL." });

  // 1. SSRF and approved video storage host check
  if (!isApprovedVideoHost(url)) {
    return res.status(400).json({ error: "Unapproved or invalid video storage host." });
  }

  // 2. Ownership verification: in-memory registry or database check
  const inMemoryRecord = videoOwnership.get(url);
  let isOwner = inMemoryRecord && inMemoryRecord.userId === req.user.id;
  if (!isOwner) {
    isOwner = await db.userOwnsVideoUrl(req.user.id, url);
  }

  if (!isOwner) {
    if (inMemoryRecord || (await db.isVideoUrlRegistered(url))) {
      return res.status(403).json({ error: "Access denied. You do not own this video." });
    }
    return res.status(404).json({ error: "Video not found or access denied." });
  }

  const ticketId = `dl_${crypto.randomBytes(24).toString("hex")}`;
  const expiresAt = Date.now() + DOWNLOAD_TICKET_TTL_MS;
  downloadTickets.set(ticketId, {
    userId: req.user.id,
    videoUrl: url,
    expiresAt,
    used: false,
  });

  res.json({
    success: true,
    ticket: ticketId,
    expiresAt,
    downloadUrl: `/api/download?ticket=${encodeURIComponent(ticketId)}`,
  });
});

async function fetchApprovedVideo(initialUrl, maxRedirects = 5) {
  let currentUrl = initialUrl;
  let hops = 0;

  while (hops <= maxRedirects) {
    if (!isApprovedVideoHost(currentUrl)) {
      throw Object.assign(
        new Error(`Redirect destination host not permitted: ${currentUrl}`),
        { status: 400 }
      );
    }

    const res = await fetch(currentUrl, {
      redirect: "manual",
    });

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      hops++;
      if (hops > maxRedirects) {
        throw Object.assign(new Error("Too many redirects during video download."), { status: 502 });
      }
      const location = res.headers.get("location");
      if (!location) {
        throw Object.assign(new Error("Redirect missing location header."), { status: 502 });
      }
      const nextUrl = new URL(location, currentUrl).toString();
      if (!isApprovedVideoHost(nextUrl)) {
        throw Object.assign(
          new Error(`Redirect destination host not permitted: ${nextUrl}`),
          { status: 400 }
        );
      }
      currentUrl = nextUrl;
      continue;
    }

    return res;
  }
}

// ---- 4) stream the finished video (user-isolated & host-allowlisted) ----
app.get("/api/download", async (req, res) => {
  cleanExpiredTickets();
  const ticketId = String(req.query.ticket || "").trim();
  const token = extractToken(req);

  let targetUrl = "";

  if (ticketId) {
    const ticketRecord = downloadTickets.get(ticketId);
    if (!ticketRecord) {
      return res.status(401).json({ error: "Invalid or expired download ticket." });
    }
    if (ticketRecord.expiresAt <= Date.now()) {
      downloadTickets.delete(ticketId);
      return res.status(401).json({ error: "Download ticket has expired." });
    }
    if (ticketRecord.used) {
      downloadTickets.delete(ticketId);
      return res.status(401).json({ error: "Download ticket has already been used." });
    }
    ticketRecord.used = true;
    targetUrl = ticketRecord.videoUrl;
  } else if (token) {
    const user = await db.getUserBySessionToken(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired session token." });
    }
    const url = String(req.query.url || "").trim();
    if (!url) return res.status(400).json({ error: "Missing video URL." });

    if (!isApprovedVideoHost(url)) {
      return res.status(400).json({ error: "Unapproved or invalid video storage host." });
    }

    const inMemoryRecord = videoOwnership.get(url);
    let isOwner = inMemoryRecord && inMemoryRecord.userId === user.id;
    if (!isOwner) {
      isOwner = await db.userOwnsVideoUrl(user.id, url);
    }

    if (!isOwner) {
      if (inMemoryRecord || (await db.isVideoUrlRegistered(url))) {
        return res.status(403).json({ error: "Access denied. You do not own this video." });
      }
      return res.status(404).json({ error: "Video not found or access denied." });
    }
    targetUrl = url;
  } else {
    return res.status(401).json({ error: "Authentication or valid download ticket required." });
  }

  if (!isApprovedVideoHost(targetUrl)) {
    return res.status(400).json({ error: "Unapproved or invalid video storage host." });
  }

  try {
    const r = await fetchApprovedVideo(targetUrl);
    if (!r.ok || !r.body) return res.status(502).json({ error: `Video fetch failed (HTTP ${r.status})` });
    res.setHeader("Content-Disposition", 'attachment; filename="commercial_video.mp4"');
    res.setHeader("Content-Type", r.headers.get("content-type") || "video/mp4");
    if (r.headers.get("content-length")) res.setHeader("Content-Length", r.headers.get("content-length"));
    Readable.fromWeb(r.body).pipe(res);
  } catch (e) {
    const statusCode = e.status || 500;
    res.status(statusCode).json({ error: e.message });
  }
});

// ---- small config probe for the UI ----
app.get("/api/config", (req, res) => {
  res.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    magnific: !!process.env.MAGNIFIC_API_KEY,
    hooksPulled: HOOKS_PULLED,
    database: db.isPostgresConfigured() ? "postgresql" : "file_store",
  });
});



// ---- Authentication Endpoints (Phase C) ----

app.post("/api/auth/signup", async (req, res) => {
  let createdUser = null;
  try {
    const { email, password, name, businessName, businessType, town } = req.body || {};
    
    // 1. Create user record (defaults to email_verified = false)
    const user = await db.createUser({ email, password, name });
    createdUser = user;

    // Optional default business
    if (businessName && String(businessName).trim()) {
      await db.saveBusiness({
        businessName,
        businessType: businessType || "Retail Store",
        town: town || "",
      }, user.id);
    }

    // 2. Generate email verification token (30-minute expiry, hash stored in DB)
    const tokenRecord = await db.createEmailVerificationToken(user.id);

    // 3. Construct verification link with configured APP_BASE_URL
    const baseUrl = emailService.getAppBaseUrl(req);
    const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(tokenRecord.rawToken)}`;

    // 4. Send verification email via Resend
    const emailResult = await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl,
    });

    if (!emailResult.success) {
      // Safe cleanup: delete the newly created unverified account and associated business/tokens
      try {
        await db.deleteUser(user.id);
      } catch (cleanupErr) {
        console.error("[signup-cleanup-error]", cleanupErr.message);
      }
      return res.status(502).json({
        error: "We could not send your verification email. Please check your email address and try again.",
        details: emailResult.error,
      });
    }

    // 5. Successful response without session token
    res.json({
      success: true,
      status: "pending_verification",
      email: user.email,
      message: "Please check your inbox to verify your email address.",
    });
  } catch (err) {
    if (createdUser && createdUser.id) {
      try {
        await db.deleteUser(createdUser.id);
      } catch (cleanupErr) {
        console.error("[signup-cleanup-error]", cleanupErr.message);
      }
    }
    res.status(400).json({ error: err.message || "Failed to create account." });
  }
});

// ---- Email Verification Endpoint ----
app.post("/api/auth/verify-email", async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token || typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        code: "TOKEN_REQUIRED",
        error: "Verification token is required.",
      });
    }

    const trimmedToken = token.trim();
    const verifiedUser = await db.markEmailAsVerified(trimmedToken);

    if (!verifiedUser) {
      return res.status(400).json({
        success: false,
        code: "TOKEN_INVALID",
        error: "This verification link is invalid or has already been used.",
      });
    }

    // Automatically create authenticated session upon successful email verification
    const sessionToken = await db.createSession(verifiedUser.id);
    const businesses = await db.getBusinessesForUser(verifiedUser.id);
    const projects = await db.getProjectsForUser(verifiedUser.id);

    return res.json({
      success: true,
      code: "VERIFIED_SUCCESS",
      message: "Your email has been verified successfully!",
      email: verifiedUser.email,
      user: verifiedUser,
      token: sessionToken,
      businesses,
      projects,
    });
  } catch (err) {
    const message = err.message || "";
    if (message.includes("has expired")) {
      return res.status(400).json({
        success: false,
        code: "TOKEN_EXPIRED",
        error: "This verification link has expired. Please request a new one.",
      });
    }
    if (message.includes("already been used")) {
      return res.status(400).json({
        success: false,
        code: "TOKEN_ALREADY_USED",
        error: "This verification link is invalid or has already been used.",
      });
    }
    if (message.includes("not found") || message.includes("not match") || message.includes("is required")) {
      return res.status(400).json({
        success: false,
        code: "TOKEN_INVALID",
        error: "This verification link is invalid or has already been used.",
      });
    }

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      error: "Unable to verify email at this moment. Please try again.",
    });
  }
});

// ---- Resend Email Verification Endpoint ----
app.post("/api/auth/resend-verification", async (req, res) => {
  try {
    let { email } = req.body || {};
    // An expired link can ask for a new one by its own token: the new link goes to that account's inbox,
    // and the email address is never revealed to whoever holds the old link
    const expiredToken = req.body && typeof req.body.token === "string" ? req.body.token.trim() : "";
    if (!email && expiredToken) {
      const tok = await db.getVerificationTokenByHash(db.hashVerificationToken(expiredToken));
      const owner = tok && (await db.findUserById(tok.userId));
      if (owner) email = owner.email;
    }
    if (!email || typeof email !== "string" || !email.trim() || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        code: "EMAIL_REQUIRED",
        error: "A valid email address is required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        error: "No account found with this email address.",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        code: "ALREADY_VERIFIED",
        message: "This email address is already verified. You can log in directly.",
      });
    }

    // Rate limiting / Cooldown check (60-second cooldown based on most recent token)
    const latestToken = await db.getLatestVerificationTokenForUser(user.id);
    if (latestToken && latestToken.createdAt) {
      const elapsedSec = (Date.now() - new Date(latestToken.createdAt).getTime()) / 1000;
      if (elapsedSec < 60) {
        const waitSec = Math.ceil(60 - elapsedSec);
        return res.status(429).json({
          success: false,
          code: "RATE_LIMITED",
          error: `Please wait ${waitSec} seconds before requesting another verification email.`,
          retryAfter: waitSec,
        });
      }
    }

    // Generate fresh token (invalidates previous unused tokens for this user)
    const tokenRecord = await db.createEmailVerificationToken(user.id);

    // Build verification URL with configured or inferred base URL
    const baseUrl = emailService.getAppBaseUrl(req);
    const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(tokenRecord.rawToken)}`;

    // Dispatch verification email via Resend
    const emailResult = await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl,
    });

    if (!emailResult.success) {
      return res.status(502).json({
        success: false,
        code: "DELIVERY_FAILED",
        error: "Failed to send verification email. Please try again shortly.",
        details: emailResult.error,
      });
    }

    return res.json({
      success: true,
      message: "A new verification link has been sent to your email address.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      error: "Unable to resend verification email at this moment. Please try again.",
    });
  }
});

// ---- Password reset ----
// 1) Request a link. Always the same answer, so it can't be used to find out who has an account.
const FORGOT_PASSWORD_MESSAGE = "If an account exists for that email, we've sent a link to reset your password. It expires in 30 minutes.";
app.post("/api/auth/forgot-password", async (req, res) => {
  const email = String((req.body && req.body.email) || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return res.status(400).json({ success: false, code: "EMAIL_REQUIRED", error: "Please enter your email address." });
  }
  try {
    const user = await db.findUserByEmail(email);
    if (user) {
      // one email a minute per account, so the endpoint can't be used to flood an inbox
      const latest = await db.getLatestPasswordResetTokenForUser(user.id);
      const recent = latest && latest.createdAt && Date.now() - new Date(latest.createdAt).getTime() < 60 * 1000;
      if (!recent) {
        const tokenRecord = await db.createPasswordResetToken(user.id);
        const resetUrl = `${emailService.getAppBaseUrl(req)}/reset-password?token=${encodeURIComponent(tokenRecord.rawToken)}`;
        const result = await emailService.sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
        if (!result.success) console.error("[forgot-password] email delivery failed:", result.error);
      }
    }
  } catch (err) {
    console.error("[forgot-password]", err.message);
  }
  res.json({ success: true, message: FORGOT_PASSWORD_MESSAGE });
});

// 2) The reset screen checks its link first, so an expired or used link says so before any typing
app.post("/api/auth/reset-password/check", async (req, res) => {
  const token = String((req.body && req.body.token) || "").trim();
  const state = token ? await db.checkPasswordResetToken(token) : "invalid";
  const codes = { valid: "TOKEN_VALID", expired: "TOKEN_EXPIRED", used: "TOKEN_ALREADY_USED", invalid: "TOKEN_INVALID" };
  res.json({ valid: state === "valid", code: codes[state] });
});

// 3) Set the new password. The token is consumed (works once), every other session is signed out,
//    and the user is signed in on this device — the link proved they own the inbox.
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const token = String((req.body && req.body.token) || "").trim();
    const password = (req.body && req.body.password) || "";
    const user = await db.resetPasswordWithToken(token, password);
    const sessionToken = await db.createSession(user.id);
    res.json({
      success: true,
      message: "Your password has been reset.",
      user,
      token: sessionToken,
      businesses: await db.getBusinessesForUser(user.id),
      projects: await db.getProjectsForUser(user.id),
    });
  } catch (err) {
    const status = err.code ? 400 : 500;
    res.status(status).json({ success: false, code: err.code || "SERVER_ERROR", error: err.code ? err.message : "Unable to reset your password right now. Please try again." });
  }
});

// Signed-in password change from Account settings. Other devices are signed out; this one stays in.
app.post("/api/auth/change-password", authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    await db.changePassword(req.user.id, currentPassword, newPassword, req.sessionToken);
    res.json({ success: true, message: "Password updated. Other devices have been signed out." });
  } catch (err) {
    const status = err.code === "WRONG_PASSWORD" ? 403 : err.code ? 400 : 500;
    res.status(status).json({
      success: false,
      code: err.code || "SERVER_ERROR",
      error: err.code ? err.message : "Unable to change your password right now. Please try again.",
    });
  }
});

// Login needs a verified email (including accounts made before verification existed) in production.
// EMAIL_VERIFICATION_REQUIRED=true|false overrides; local development defaults to off, so a machine
// without a Resend key can still log in to existing accounts.
function isEmailVerificationRequired() {
  const v = String(process.env.EMAIL_VERIFICATION_REQUIRED || "").trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  return process.env.NODE_ENV === "production";
}

// Email a fresh verification link, unless one was sent in the last 60 seconds (same cooldown as resend)
async function sendFreshVerificationLink(user, req) {
  const latest = await db.getLatestVerificationTokenForUser(user.id);
  if (latest && latest.createdAt && Date.now() - new Date(latest.createdAt).getTime() < 60 * 1000) return false;
  const tokenRecord = await db.createEmailVerificationToken(user.id);
  const verifyUrl = `${emailService.getAppBaseUrl(req)}/verify-email?token=${encodeURIComponent(tokenRecord.rawToken)}`;
  const result = await emailService.sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
  return Boolean(result.success);
}

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await db.authenticateUser({ email, password });
    // Correct password but unverified email: no session yet — send a link and ask the user to verify
    if (isEmailVerificationRequired() && !user.emailVerified) {
      let verificationSent = false;
      try {
        verificationSent = await sendFreshVerificationLink(user, req);
      } catch (e) {
        console.error("[login] could not send verification link:", e.message);
      }
      return res.status(403).json({
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
        verificationSent,
        error: "Please verify your email address to log in. We've sent a verification link to your inbox.",
      });
    }
    const token = await db.createSession(user.id);
    const businesses = await db.getBusinessesForUser(user.id);
    const projects = await db.getProjectsForUser(user.id);

    res.json({
      status: "success",
      user,
      token,
      businesses,
      projects,
    });
  } catch (err) {
    res.status(401).json({ error: err.message || "Login failed." });
  }
});

app.post("/api/auth/logout", authRequired, async (req, res) => {
  try {
    await db.deleteSession(req.sessionToken);
    res.json({ status: "success", message: "Logged out successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message || "Logout failed." });
  }
});

app.get("/api/auth/me", authRequired, async (req, res) => {
  try {
    const businesses = await db.getBusinessesForUser(req.user.id);
    const projects = await db.getProjectsForUser(req.user.id);
    res.json({
      status: "success",
      user: req.user,
      businesses,
      projects,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/auth/profile", authRequired, async (req, res) => {
  try {
    const { name, avatar } = req.body || {};
    const updated = await db.updateUserProfile(req.user.id, { name, avatar });
    res.json({ status: "success", user: updated });
  } catch (err) {
    console.error("[auth] Update profile error:", err);
    res.status(400).json({ error: err.message || "Failed to update profile." });
  }
});

app.put("/api/auth/profile", authRequired, async (req, res) => {
  try {
    const { name, avatar } = req.body || {};
    const updated = await db.updateUserProfile(req.user.id, { name, avatar });
    res.json({ status: "success", user: updated });
  } catch (err) {
    console.error("[auth] Update profile error:", err);
    res.status(400).json({ error: err.message || "Failed to update profile." });
  }
});

app.patch("/api/auth/onboarding", authRequired, async (req, res) => {
  try {
    const patch = req.body && typeof req.body === "object"
      ? (req.body.onboardingState && typeof req.body.onboardingState === "object" ? req.body.onboardingState : req.body)
      : {};
    const onboardingState = await db.updateUserOnboarding(req.user.id, patch);
    res.json({ status: "success", onboardingState });
  } catch (err) {
    console.error("[auth] Update onboarding state error:", err);
    res.status(400).json({ error: err.message || "Failed to update onboarding preferences." });
  }
});

app.delete("/api/auth/account", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const deleted = await db.deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ error: "User not found or already deleted." });
    }
    res.json({
      status: "success",
      message: "Account and all associated projects and brand profiles have been permanently deleted.",
    });
  } catch (err) {
    console.error("[auth] Delete account error:", err);
    res.status(500).json({ error: err.message || "Failed to delete account." });
  }
});

// ---- Business Profile Endpoints (Phase D) ----

app.get("/api/businesses", authRequired, async (req, res) => {
  try {
    const businesses = await db.getBusinessesForUser(req.user.id);
    res.json({ status: "success", businesses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/businesses", authRequired, async (req, res) => {
  try {
    const saved = await db.saveBusiness(req.body, req.user.id);
    res.json({ success: true, status: "success", business: saved });
  } catch (err) {
    const statusCode = err.status || 400;
    res.status(statusCode).json({ error: err.message || "Failed to save business profile." });
  }
});

app.get("/api/businesses/:id", authRequired, async (req, res) => {
  try {
    const b = await db.getBusinessById(req.params.id, req.user.id);
    if (!b) return res.status(404).json({ error: "Business profile not found." });
    res.json({ success: true, status: "success", business: b });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Project & Script Library Endpoints (Phase E) ----

app.get("/api/projects", authRequired, async (req, res) => {
  try {
    const projects = await db.getProjectsForUser(req.user.id);
    res.json({ success: true, status: "success", projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/projects", authRequired, async (req, res) => {
  try {
    const saved = await db.saveProject(req.body, req.user.id);
    res.json({ success: true, status: "success", project: saved });
  } catch (err) {
    const statusCode = err.status || 400;
    res.status(statusCode).json({ error: err.message || "Failed to save project." });
  }
});

app.get("/api/projects/:id", authRequired, async (req, res) => {
  try {
    const p = await db.getProjectById(req.params.id, req.user.id);
    if (!p) return res.status(404).json({ error: "Project not found." });
    res.json({ status: "success", project: p });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/projects/:id", authRequired, async (req, res) => {
  try {
    const ok = await db.deleteProject(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ error: "Project not found." });
    res.json({ status: "success", message: "Project deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/projects/bulk-delete", authRequired, async (req, res) => {
  try {
    const rawIds = req.body?.projectIds;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return res.status(400).json({ error: "projectIds must be a non-empty array of project IDs." });
    }
    const cleanIds = Array.from(
      new Set(
        rawIds
          .filter((id) => typeof id === "string" && id.trim().length > 0)
          .map((id) => id.trim())
      )
    );
    if (cleanIds.length === 0) {
      return res.status(400).json({ error: "projectIds must contain at least one valid project ID." });
    }
    if (cleanIds.length > 200) {
      return res.status(400).json({ error: "Cannot delete more than 200 projects in a single request." });
    }

    const { deletedIds, notDeletedIds } = await db.deleteProjects(cleanIds, req.user.id);
    if (deletedIds.length === 0) {
      return res.status(404).json({
        error: "No matching projects found.",
        deletedIds: [],
        notDeletedIds,
      });
    }

    const isPartial = notDeletedIds.length > 0;
    res.json({
      status: isPartial ? "partial" : "success",
      deletedIds,
      notDeletedIds,
      deletedCount: deletedIds.length,
      message: isPartial
        ? `Deleted ${deletedIds.length} ${deletedIds.length === 1 ? "project" : "projects"}; ${notDeletedIds.length} could not be deleted.`
        : `Deleted ${deletedIds.length} ${deletedIds.length === 1 ? "project" : "projects"}.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Feedback & Issue Reporting Endpoint ----
app.post("/api/feedback", authRequired, async (req, res) => {
  try {
    const limit = feedback.checkRateLimit(req.user?.id || req.ip);
    if (!limit.allowed) {
      return res.status(429).json({
        error: `Too many feedback submissions. Please wait ${limit.retryAfterSeconds} seconds before trying again.`,
      });
    }

    const validated = feedback.validateFeedbackPayload(req.body);

    const result = await feedback.sendFeedbackEmail({
      category: validated.category,
      message: validated.message,
      attachments: validated.attachments,
      context: validated.context,
      user: req.user,
    });

    res.json({
      success: true,
      message: "Thanks for helping us improve CleverCut! Your feedback has been sent to our team.",
      messageId: result.messageId,
    });
  } catch (err) {
    const safeError = feedback.sanitizeErrorMessage ? feedback.sanitizeErrorMessage(err.message) : err.message;
    console.error("[feedback-error]", safeError);
    const isClientError =
      err.message.includes("Invalid feedback category") ||
      err.message.includes("Message is required") ||
      err.message.includes("Message exceeds") ||
      err.message.includes("Attachment") ||
      err.message.includes("Total combined size") ||
      err.message.includes("Maximum of");
    const status = isClientError ? 400 : 500;
    res.status(status).json({
      error: isClientError ? err.message : "Unable to send your feedback right now. Please try again.",
    });
  }
});

// ---- Development-Only Test Email Endpoint ----
app.post("/api/dev/test-email", authRequired, async (req, res) => {
  // Available ONLY when NODE_ENV !== 'production'
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Endpoint not available in production environment." });
  }

  try {
    const { to } = req.body || {};
    if (!to || !emailService.isValidEmail(to)) {
      return res.status(400).json({ error: "Valid recipient email address is required." });
    }

    const html = emailService.renderTestEmailHtml(to);
    const text = emailService.renderTestEmailText(to);

    const result = await emailService.sendEmail({
      to,
      subject: "CleverCut – Transactional Email Delivery Test",
      html,
      text,
    });

    if (!result.success) {
      return res.status(502).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      id: result.id,
      message: "Test email dispatched successfully via Resend.",
      recipient: to.trim(),
    });
  } catch (err) {
    const safeError = emailService.sanitizeErrorMessage(err.message);
    res.status(500).json({ success: false, error: safeError });
  }
});

// Ensure API requests that fail to match any endpoint return JSON 404, NEVER HTML index.html
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global JSON error handler (prevents Express from ever sending HTML error pages)
app.use((err, req, res, next) => {
  console.error("[error-handler]", err.message);
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({ error: "Uploaded payload is too large. Please use a smaller product photo (under 5MB)." });
  }
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// SPA catch-all fallback for client routing
app.get("*", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`\n  Dashboard running -> http://localhost:${PORT}\n`));
}

module.exports = { app, validateForm, sessions, downloadTickets, feedback, emailService };