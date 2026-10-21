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
const db = require("./engine/db");

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

function isDisallowedUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "Only HTTP and HTTPS protocols are permitted.";
    }
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
      return "Access to local or private hostnames is restricted.";
    }
    // Check IPv4 addresses
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, o1, o2, o3, o4] = ipv4Match.map(Number);
      if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) return "Invalid IP address.";
      if (o1 === 0 || o1 === 127) return "Access to loopback/local IP addresses is restricted.";
      if (o1 === 10) return "Access to private 10.x.x.x addresses is restricted.";
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return "Access to private 172.16-31.x.x addresses is restricted.";
      if (o1 === 192 && o2 === 168) return "Access to private 192.168.x.x addresses is restricted.";
      if (o1 === 169 && o2 === 254) return "Access to cloud metadata / link-local addresses is restricted.";
    }
    // Check IPv6 loopback and link-local
    if (host === "::1" || host === "[::1]" || host.startsWith("fe80:") || host.startsWith("fc00:") || host.startsWith("fd00:")) {
      return "Access to local or private IPv6 addresses is restricted.";
    }
    return null;
  } catch (err) {
    return "Invalid URL format.";
  }
}

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
  if (s.includes("auto") || s.includes("garage") || s.includes("car") || s.includes("bike") || s.includes("mechanic") || s.includes("repair")) {
    return "Automobile & Garage";
  }
  const exact = STANDARD_BUSINESS_CATEGORIES.find((c) => c.toLowerCase() === s);
  if (exact) return exact;
  return defaultCat;
}

// 1B) URL Web Scraping & Structured Business Analysis (V2 Entry Point)
app.post("/api/research/url", async (req, res) => {
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
  let fetchSucceeded = false;
  let fetchError = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await global.fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Clevertize-Bot/2.0",
        "Accept": "text/html,application/xhtml+xml,text/plain,*/*",
      },
    });
    clearTimeout(timeout);

    if (response && response.ok) {
      const text = await response.text();
      fetchedHtml = text.slice(0, 60000);
      fetchSucceeded = true;
    } else {
      fetchError = `HTTP ${response ? response.status : "unknown"} from target server`;
    }
  } catch (err) {
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
    });
  }
});

// 1C) Existing Script Import & Quality Gate Validation (V2 Entry Point)
app.post("/api/script/validate-and-import", async (req, res) => {
  try {
    const { rawScript, businessName, businessType, language, creativeStyle } = req.body || {};
    if (!rawScript || typeof rawScript !== "string" || !rawScript.trim()) {
      return res.status(400).json({ error: "Please enter or paste script text to validate." });
    }

    const brand = String(businessName || "My Business").trim();
    const bType = String(businessType || "Retail Business").trim();
    const lang = String(language || "English").trim();
    const style = String(creativeStyle || "UGC / Creator-style").trim();

    // 1. Parse or segment into 4 scenes
    let parsed = parseOutput(rawScript);
    let sceneTexts = [];

    if (parsed.scenes && parsed.scenes.length >= 4) {
      sceneTexts = parsed.scenes.slice(0, 4);
    } else {
      // Split on common scene demarcators: "Scene 1", "SCENE 1", "ANNEX A", "\n\n\n", or 4 paragraph chunks
      const chunks = rawScript
        .split(/(?:ANNEX\s+A|SCENE\s+[1-4]|Scene\s+[1-4]|---|\n\s*\n\s*\n)/i)
        .map((s) => s.trim())
        .filter(Boolean);

      if (chunks.length >= 4) {
        sceneTexts = chunks.slice(0, 4).map((c, idx) => `ANNEX A\nSCENE ${idx + 1}\n${c}`);
      } else {
        // Divide script into 4 structured narrative beats
        const lines = rawScript.split("\n").map((l) => l.trim()).filter(Boolean);
        const perScene = Math.max(1, Math.ceil(lines.length / 4));
        const beats = ["Scene 1 · Hook", "Scene 2 · Build", "Scene 3 · Turn", "Scene 4 · Resolution"];
        sceneTexts = [0, 1, 2, 3].map((i) => {
          const slice = lines.slice(i * perScene, (i + 1) * perScene).join("\n") || `Scene ${i + 1} action and dialogue`;
          return `ANNEX A\n${beats[i]}\nVisual:\nBalanced medium shot in steady room lighting.\nAnimation Elements:\nCamera: smooth motivated push-in.\nText overlay: none\nUI element: none\nTransition: cut\nMotion graphics: none\nAudio / Dialogue / Voiceover:\n${slice}\nSound Design:\nNatural ambient room tone.\nEditing Notes:\nScene duration: ~4s | Output: 1080p`;
        });
      }
    }

    // 2. Extract or infer characters & setting
    const char1 = parsed.character1 || `${brand} Representative — confident, friendly, relatable presentation`;
    const char2 = parsed.character2 || `Customer — relatable everyday buyer seeking authentic quality`;
    const setting = parsed.setting || `Clean, inviting shop / studio space with warm natural lighting and clear product display`;

    // 3. Construct synthetic full script for gate check if needed
    let fullScriptText = rawScript;
    let gateParsed = parsed;
    if (!parsed.header || !parsed.header.business || !parsed.character1 || !parsed.character2 || !parsed.setting) {
      fullScriptText = `@@HEADER@@\nBusiness: ${brand}\nFormat: ${style}\nLens: 2, Everyday Moments\nHook: Relatable Hook\nMoment: Everyday\n\n@@CHARACTER1@@\n${char1}\n\n@@CHARACTER2@@\n${char2}\n\n@@SETTING@@\n${setting}\n\n` +
        sceneTexts.map((s) => `@@SCENE@@\n${s}`).join("\n\n") +
        `\n\n@@RECORD@@\n{"format":"${style}","characters":"${char1} & ${char2}","setting":"${setting}"}`;
      gateParsed = parseOutput(fullScriptText);
    }

    // 4. Run Section 8 Quality Gate
    const mockForm = {
      businessName: brand,
      businessType: bType,
      language: lang,
      creativeStyle: style,
      scriptMode: lang === "Hindi" ? "devanagari" : "devanagari",
      product: brand,
    };

    let fails = [];
    try {
      fails = runGate(gateParsed, mockForm, {
        scriptMode: lang === "Hindi" ? "devanagari" : "devanagari",
        approvedFormat: style,
      }) || [];
    } catch (gErr) {
      console.warn("[runGate check warn]", gErr.message);
      fails = [gErr.message];
    }

    const passedGate = Array.isArray(fails) && fails.length === 0;

    return res.json({
      status: "success",
      passedGate,
      gatePassed: passedGate,
      failures: fails,
      scenes: sceneTexts,
      character1: char1,
      character2: char2,
      setting: setting,
      fullScriptText,
      totalScenes: sceneTexts.length,
    });
  } catch (err) {
    console.error("[api/script/validate-and-import]", err.message);
    res.status(500).json({ error: err.message || "Failed to validate script." });
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
    res.status(e.status || 500).json({ error: e.message, failures: e.failures || [] });
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
// 8) Simple Business Studio — 3 Ready-Made Ad Packages
app.post("/api/creative/simple-packages", async (req, res) => {
  try {
    const { businessName, businessType, town, brief, targetAudience, language, creativeStyle } = req.body || {};
    if (!businessName || !businessName.trim()) {
      return res.status(400).json({ error: "businessName is required." });
    }
    if (!brief || !brief.trim()) {
      return res.status(400).json({ error: "Brief is required." });
    }
    const packages = await creative.generateSimpleAdPackages({
      businessName: businessName.trim(),
      businessType: businessType || "Local Business",
      town: town || "",
      brief: brief || "",
      targetAudience: targetAudience || "",
      language: language || "English",
      creativeStyle: creativeStyle || "UGC / Creator-style",
    });
    res.json({ status: "success", packages });
  } catch (e) {
    console.error("[api/creative/simple-packages]", e.message);
    res.status(500).json({ error: e.message });
  }
});
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
      processedScenes = scenes.map((sc) => sceneForGeneration(sc, {
        setting,
        character1,
        character2,
        duration,
        businessType: businessType || shotSpec?.project?.businessType || resolvedProduct,
        language: shotSpec?.project?.language || "English",
      }));
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
    database: db.isPostgresConfigured() ? "postgresql" : "file_store",
  });
});

// ---- Auth Middleware & Helpers (Phase C & E) ----

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

// ---- Authentication Endpoints (Phase C) ----

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name, businessName, businessType, town } = req.body || {};
    const user = await db.createUser({ email, password, name });
    const token = await db.createSession(user.id);

    let defaultBusiness = null;
    if (businessName && String(businessName).trim()) {
      defaultBusiness = await db.saveBusiness({
        businessName,
        businessType: businessType || "Retail Store",
        town: town || "",
      }, user.id);
    }

    res.json({
      status: "success",
      user,
      token,
      business: defaultBusiness,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await db.authenticateUser({ email, password });
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
    res.status(400).json({ error: err.message || "Failed to save business profile." });
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
    res.status(400).json({ error: err.message || "Failed to save project." });
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

module.exports = { app, validateForm };