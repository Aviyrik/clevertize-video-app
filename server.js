const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json({ limit: "25mb" }));
app.use(express.static(path.join(__dirname, "dist")));
app.use(express.static(path.join(__dirname, "public")));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MAGNIFIC_API_KEY = process.env.MAGNIFIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const DEFAULT_FLOW_ID = process.env.MAGNIFIC_FLOW_ID || "0MQyTfWvQD";
const PORT = process.env.PORT || 3000;

// The flow's PRODUCT input key. IMPORTANT: verify this against your flow's
// "Use Flow as API" popup — the key may be "product", "product_2", "PRODUCT", etc.
// Override without editing code by setting MAGNIFIC_PRODUCT_INPUT in your env.
const PRODUCT_INPUT_NAME = process.env.MAGNIFIC_PRODUCT_INPUT || "product";

// ---- your exact scene template ----
const SCENE_TEMPLATE = `ANNEX A
SCENE [NUMBER] – [SCENE TITLE / PURPOSE]
Visual:
[Describe everything visible in the scene — subject, environment, camera framing, lighting, actions, props, mood, composition, movement]
Animation Elements:
[Camera movement / push-in / zoom / handheld simulation]
[notifications / cursor animations]
[Transitions / glitches / blur / distortion / lighting effects]
[Motion graphics / icons / CTA animations]
Audio / Dialogue / Voiceover:
"[Dialogue line 1 — in the target language, written in English letters]"
"[Dialogue line 2 — same]"
"[Dialogue line 3 — same]"
Voiceover delivery: clear and confident, no fumbling, stumbling or filler words; same voice, tone and energy maintained consistently across all scenes.
Sound Design / Music:
[Describe ambience, SFX, transitions, digital sounds, impacts, fades, etc.]
Editing Notes (Optional):
[Describe pacing, cut style, transitions, timing, rhythm, montage flow, speed ramps, etc.]`;

// duration → number of scenes
// 10s -> 3 scenes (~3.3s each)
// 15s -> 4 scenes (~3.7s each) -- fixed so 15s doesn't truncate to 10s!
// 20s -> 4 scenes (~5.0s each)
// 25s -> 5 scenes (~5.0s each, max scene cap M6 per Product Spine)
function scenesForDuration(duration) {
  if (duration === "10s") return 3;
  if (duration === "15s") return 4;
  if (duration === "20s") return 4;
  if (duration === "25s") return 5;
  return 4;
}

// Generate 3 distinct Hook choices from Claude based on Product Spine (Section 3 Insight Engine & Section 4 Hook Sources)
function buildHooksPrompt(f) {
  const brandPart = f.brandName ? `Brand / Business: "${f.brandName}"` : `Business: General / Local Business`;
  const briefPart = `Brief: ${f.brief}`;
  const langPart = `Language: ${f.language || "Hindi"}`;
  const goalPart = f.objective ? `Objective: ${f.objective}. CTA: ${f.cta || "Visit or order today"}` : "";
  const targetPart = f.targetCustomers ? `Target Customers: ${f.targetCustomers}` : "";

  return `You are the creative engine inside Clevertize AI Video Generator, adhering strictly to the "Product Spine" master architecture.

Task: Generate EXACTLY 3 distinct, high-converting Hook options for a short-form commercial ad (under 30s) based on the business brief.

=== INPUTS ===
${brandPart}
${briefPart}
${langPart}
Duration: ${f.duration || "15s"}
${goalPart}
${targetPart}

=== HOOK ARCHETYPES & INSIGHT LENSES (From Product Spine Section 3 & 4) ===
The 3 hooks MUST use 3 DIFFERENT archetypes from the following:
1. "Area / City Shoutout" (Local relevance, e.g. "Bangalore waalon, suno! / Indiranagar foodies, wait!")
2. "No / Stop Opener" or "Pattern Interrupt" (Stops the scroll instantly, e.g. "Ruko! Meethai lene se pehle yeh zaroor dekhna...")
3. "Myth-Buster / Interval Twist" (Challenging a common customer doubt, e.g. "Sab sochte hain online discount hamesha sasta hota hai, lekin...")
4. "Everyday Crisis / Counter Question" (Relatable relatable tension, e.g. "Ghar pe achanak mehmaan aa gaye aur sweet box empty?")
5. "Festival / Occasion FOMO" (Timely celebration tension, e.g. "Diwali gift pack abhi tak decide nahi kiya?")
6. "Price-Jugaad / Honest Value" (Direct value proposition without corporate fluff)

=== MASTER RULES FOR HOOKS ===
- Each hook must land in the FIRST 3 SECONDS without requiring on-screen text.
- Must have:
  1. A punchy spoken opening line in ${f.language} written in English letters (romanized transliteration, e.g. Hindi written in Roman script so AI voice engines read it accurately).
  2. A vivid physical visual opening action (Physical action only, no corporate clichés, no standing with folded hands).
  3. The hook archetype name and creative angle.
- Avoid category clichés: No generic "Grand opening", No "Best quality lowest price", No "One stop shop", No generic store pans.
- Claims must be honest and grounded in the brief.

=== JSON OUTPUT FORMAT ===
Respond ONLY with a valid JSON array of 3 hook objects, nothing else:
[
  {
    "id": "hook_1",
    "archetype": "Area / City Shoutout",
    "angle": "Local Neighborhood Connection",
    "hookLine": "[Punchy spoken line in ${f.language} written in English letters]",
    "visualAction": "[Vivid physical visual opening action in English, 1-2 sentences]"
  },
  {
    "id": "hook_2",
    "archetype": "No / Stop Opener",
    "angle": "Relatable Pattern Interrupt",
    "hookLine": "[Punchy spoken line in ${f.language} written in English letters]",
    "visualAction": "[Vivid physical visual opening action in English, 1-2 sentences]"
  },
  {
    "id": "hook_3",
    "archetype": "Everyday Crisis / Counter Question",
    "angle": "Relatable Moment & Urgent Need",
    "hookLine": "[Punchy spoken line in ${f.language} written in English letters]",
    "visualAction": "[Vivid physical visual opening action in English, 1-2 sentences]"
  }
]`;
}

function buildPrompt(f) {
  const n = scenesForDuration(f.duration);
  const perSceneSeconds = Math.round(parseInt(f.duration || "15") / n);

  // only include optional context that was actually provided
  const optional = [];
  if (f.brandName) optional.push(`Brand / shop name: ${f.brandName} — this is the USER'S OWN business. Refer to it by name naturally in the spoken dialogue (e.g. a character says the shop's name), so viewers hear whose ad this is. Do not show the name as on-screen text.`);
  if (f.productImageAttached) optional.push(`PRODUCT PHOTO ATTACHED: An image of the user's actual product is attached. Study it and write the product into the scenes — describe it accurately (its shape, packaging, colours, how it looks in hand) so the video features THIS product. Make it the hero of at least one scene. Describe it generically in wording (no brand text on packaging described as readable on screen), but keep its real visual appearance.`);
  if (f.shopPhotoAttached) optional.push(`SHOP PHOTO ATTACHED: An image of the user's actual shop/signboard is attached to this message. Study it and use what you see:
- Read the shop name from the signboard (if the user did not give a brand name above, use this name in the dialogue).
- Note the city/area if any address or location text is visible.
- Note what kind of business it is and what it sells.
- Take the real colours of the signage, walls and interior into the SETTING description and the scene visuals, so the video looks like this actual shop.
- Match the shop's character (traditional/modern, small/large, ornate/simple) in the setting.
Describe colours in words (e.g. "deep saffron and maroon signage"), never as hex codes. Do not reproduce any logo, and do not put the shop name on screen as text — it may only be spoken.`);
  if (f.cta) optional.push(`Call to action: ${f.cta}`);
  if (f.objective) optional.push(`Objective: ${f.objective}`);
  if (f.geo) optional.push(`Geography: ${f.geo}`);
  if (f.platform) optional.push(`Platform: ${f.platform}`);
  if (f.businessLocation) optional.push(`Business is located in: ${f.businessLocation}`);
  if (f.targetCustomers) optional.push(`Target customers: ${f.targetCustomers}`);
  if (f.websiteUrl && (f.siteText || (f.siteColors && f.siteColors.length))) {
    optional.push(`BRAND INTELLIGENCE (auto-extracted from the brand's website ${f.websiteUrl}):
${f.siteColors && f.siteColors.length ? `- Primary website colours (most used, hex): ${f.siteColors.join(", ")} — translate these into the colour palette of the setting, wardrobe, props and lighting (describe them as colours in words, e.g. "warm orange", not hex codes).` : ""}
${f.siteText ? `- Website content excerpt (infer the brand's tone of voice, what it sells, its personality and aesthetic from this, and let that shape the dialogue tone, casting and visual mood):\n${f.siteText}` : ""}
IMPORTANT: this brand intelligence shapes the CONTENT of the scripts (tone, palette, mood, casting, setting) only. It must NOT change the script structure, the template, the sections, or the output format in any way.`);
  } else if (f.websiteUrl) {
    optional.push(`Brand website: ${f.websiteUrl} (the site could not be read — do not invent details from it)`);
  }
  if (f.brandGuidelinesText) optional.push(`Brand guidelines (from uploaded document):\n${f.brandGuidelinesText}`);
  if (f.brandPdfAttached) optional.push(`Brand guidelines: see the attached PDF document — read it and follow its rules.`);

  // Hook anchoring if user selected a hook
  const hookBlock = f.selectedHook ? `
SELECTED HOOK ARCHETYPE: "${f.selectedHook.archetype || 'Creative Hook'}" (${f.selectedHook.angle || ''})
CHOSEN SPOKEN OPENING LINE: "${f.selectedHook.hookLine}"
CHOSEN OPENING ACTION: "${f.selectedHook.visualAction}"
IMPORTANT HOOK ANCHOR: Scene 1 MUST directly open with this exact spoken hook line and physical action, smoothly setting up the narrative arc for the remaining scenes.
` : '';

  const optionalBlock = optional.length
    ? `\nADDITIONAL CONTEXT (use all of it — let each item actively shape the scripts):\n${optional.join("\n")}\n`
    : "";

  return `You are the master creative director and script engine inside Clevertize AI Video Generator, implementing the "Product Spine" master architecture (Oct 2026 spec).
You write one production-ready AI commercial ad film for ${f.brandName || "the business"}, adhering strictly to the master instructions.

=== BRIEF ===
${f.brief}

Language: ${f.language}
Total video duration: ${f.duration} (EXACTLY ${n} scenes, ~${perSceneSeconds} seconds per scene)
Target output resolution: ${f.resolution || "1080p"}
Number of scenes: ${n}
${hookBlock}
${optionalBlock}

=== MASTER RULES FROM PRODUCT SPINE ===
M1-M3: Role & Tone — Warm, simple, local and trustworthy. Sounds like the neighbourhood, not a distant corporate brand.
M4: Spoken Dialogue — Dialogue is in ${f.language}. Spoken lines MUST be written in English letters (romanized transliteration, e.g. "Arre waah! Yeh Diwali gift box kitne ka hai?"), so text-to-speech & video generation engines pronounce it cleanly. Visual descriptions, camera and technical cues are in English.
M6: Scene Cap — Exactly ${n} scenes for this ${f.duration} film.
M8: Hard Bans in AI Generation —
  - NO on-screen text of any kind (no captions, no subtitles, no floating prices, no CTA text overlays).
  - NO generated phone UI or app mockups.
  - NO background music in the video generation prompts (Sound Design uses natural ambience and SFX only).
  - NO rapid or harsh cuts/transitions; keep all camera motions smooth and gentle.
M9: Visual Direction — Write physical actions only. One clear physical action per sentence. No vague emotional directions ("he feels proud") or cluttered backgrounds.
M10: Dialogue — Maximum 2 lines per character per scene. Rotate speakers across scenes. One speaker per moment.
M13: Real-looking World — Authentic, grounded setting matching a real Indian town/neighbourhood.
M20: Cliché Bans — No "grand opening" / "one stop shop" clichés. No shopkeeper with folded hands. No slow empty pans over shelves.

=== TASK 1 — character 1 ===
Write a single detailed visual description of the FIRST recurring character (appearance, age, skin tone, clothing, accessories, expression, vibe). WRITE THIS IN ENGLISH. Put it in "character1".

=== TASK 2 — character 2 ===
Write a single detailed visual description of the SECOND recurring character (appearance, age, skin tone, clothing, accessories, expression, vibe). If the story is lead-driven, make character 2 an authentic customer, family member, or staff member. WRITE THIS IN ENGLISH. Put it in "character2".

=== TASK 3 — setting ===
Write a single detailed visual description of the ENVIRONMENT/setting (location, lighting, mood, time of day, surfaces, props, background activity). WRITE THIS IN ENGLISH. Put it in "setting".

=== TASK 4 — scene scripts ===
Write EXACTLY ${n} scene scripts. The SAME character 1, character 2, and setting must appear consistently across all scenes. Each scene MUST follow this template exactly:

${SCENE_TEMPLATE}

=== TIMING & CALL TO ACTION ===
The total film duration is ${f.duration} across ${n} scenes, so each scene represents roughly ${perSceneSeconds} seconds of screen time.
In every scene's "Editing Notes" section, include: "Output resolution: ${f.resolution || "1080p"} | Scene duration: ~${perSceneSeconds}s".
${f.cta ? `The final scene's voiceover must naturally deliver this call to action, spoken in ${f.language} (romanized in English letters): ${f.cta}` : ""}

=== OUTPUT CONTRACT ===
Return your response using EXACTLY these marker lines, each on its own line, and nothing else (no JSON, no markdown, no preamble). Put the actual content between the markers:

@@CHARACTER1@@
<the character 1 description>
@@CHARACTER2@@
<the character 2 description>
@@SETTING@@
<the setting description>
@@SCENE@@
<full scene 1 block>
@@SCENE@@
<full scene 2 block>
(repeat @@SCENE@@ before each scene, exactly ${n} scenes total)`;
}

function stripFences(t) {
  return t.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function findVideoUrl(obj) {
  let found = "";
  const strong = (v) => /^https?:\/\/\S+\.(mp4|mov|webm|m3u8)(\?|$)/i.test(v);
  const weak = (v) => /^https?:\/\//.test(v) && /(video|render|cdn|pikaso|combiner|output)/i.test(v);
  const walk = (v, test) => {
    if (found) return;
    if (typeof v === "string") { if (test(v)) found = v; }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, test));
    else if (v && typeof v === "object") Object.values(v).forEach((x) => walk(x, test));
  };
  walk(obj, strong);
  if (!found) walk(obj, weak);
  return found;
}

// ---- website brand intelligence ----

// block internal/private addresses so users can't probe our network
function isSafeUrl(raw) {
  try {
    const u = new URL(raw.startsWith("http") ? raw : "https://" + raw);
    if (!/^https?:$/.test(u.protocol)) return null;
    const h = u.hostname.toLowerCase();
    if (
      h === "localhost" || h === "0.0.0.0" || h === "::1" ||
      /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^169\.254\./.test(h) ||
      h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".")
    ) return null;
    return u.href;
  } catch {
    return null;
  }
}

// pull the dominant brand colours out of CSS/style text
function extractColors(cssText) {
  const counts = {};
  const toHex6 = (h) => (h.length === 3 ? h.split("").map((c) => c + c).join("") : h);
  const add = (hex) => {
    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max - min < 24) return;            // skip greys
    if ((r + g + b) / 3 > 242) return;      // skip near-white
    if ((r + g + b) / 3 < 18) return;       // skip near-black
    const key = "#" + hex.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  };
  let m;
  const hexRe = /#([0-9a-f]{6}|[0-9a-f]{3})\b/gi;
  while ((m = hexRe.exec(cssText))) add(toHex6(m[1]));
  const rgbRe = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;
  while ((m = rgbRe.exec(cssText))) {
    add([m[1], m[2], m[3]].map((x) => Math.min(255, +x).toString(16).padStart(2, "0")).join(""));
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
}

// fetch a site's visible text + brand colours (from inline styles, linked CSS, theme-color)
async function fetchSite(rawUrl) {
  const url = isSafeUrl(rawUrl);
  if (!url) return { text: "", colors: [] };
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const html = await r.text();

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);

    // gather CSS: inline style blocks + style attrs + theme-color meta
    let css = (html.match(/<style[\s\S]*?<\/style>/gi) || []).join(" ");
    css += " " + (html.match(/style="[^"]*"/gi) || []).join(" ");
    const theme = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
    if (theme) css += " " + theme[1];

    // fetch up to 3 linked stylesheets (same guard, short timeout)
    const links = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)]
      .map((x) => x[1]).slice(0, 3);
    for (const href of links) {
      try {
        const abs = isSafeUrl(new URL(href, url).href);
        if (!abs) continue;
        const cr = await fetch(abs, { signal: AbortSignal.timeout(5000) });
        css += " " + (await cr.text()).slice(0, 200000);
      } catch { /* skip broken stylesheet */ }
    }

    return { text, colors: extractColors(css) };
  } catch {
    return { text: "", colors: [] };
  }
}

// extract readable text from an uploaded DOCX (a zip of XML)
async function docxToText(base64) {
  try {
    const AdmZip = require("adm-zip");
    const zip = new AdmZip(Buffer.from(base64, "base64"));
    const xml = zip.getEntry("word/document.xml")?.getData().toString("utf8") || "";
    return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 6000);
  } catch {
    return "";
  }
}

// 0) Generate 3 Hook options with Claude based on Product Spine
app.post("/api/hooks", async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is missing in .env");

    const f = { ...req.body };
    if (!f.brief || !f.brief.trim()) throw new Error("Brief is required to generate hooks.");

    const promptText = buildHooksPrompt(f);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2500,
        messages: [{ role: "user", content: [{ type: "text", text: promptText }] }],
      }),
    });

    const data = await r.json();
    if (data.error) throw new Error(data.error.message);

    const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const cleaned = stripFences(raw);
    let hooks = [];
    try {
      hooks = JSON.parse(cleaned);
    } catch (parseErr) {
      // Fallback regex extractor if Claude returned explanatory wrapper
      const match = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        hooks = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse hook options from model response.");
      }
    }

    if (!Array.isArray(hooks) || hooks.length === 0) {
      throw new Error("Model returned empty hooks array.");
    }

    res.json({ hooks });
  } catch (e) {
    console.error("[/api/hooks error]:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// 1) Generate the scripts + characters + setting with Claude
app.post("/api/generate", async (req, res) => {
  try {
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is missing in .env");

    const f = { ...req.body };

    // required fields
    if (!f.brief || !f.brief.trim()) throw new Error("Brief is required.");
    if (!f.language || !f.language.trim()) throw new Error("Language is required.");
    if (!f.duration) throw new Error("Duration is required.");

    // optional: analyse the brand's website (text + dominant colours)
    if (f.websiteUrl) {
      const site = await fetchSite(f.websiteUrl);
      f.siteText = site.text;
      f.siteColors = site.colors;
    }

    // optional: brand guidelines document
    const content = [];
    if (f.brandFile && f.brandFile.data) {
      if (f.brandFile.mime === "application/pdf") {
        // Claude reads PDFs natively
        content.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: f.brandFile.data },
        });
        f.brandPdfAttached = true;
      } else {
        const docText = await docxToText(f.brandFile.data);
        if (docText) f.brandGuidelinesText = docText;
      }
    }
    // optional: photo of the shop / signboard — Claude reads it directly
    if (f.shopPhoto && f.shopPhoto.data) {
      const mime = /^image\/(jpeg|png|gif|webp)$/.test(f.shopPhoto.mime || "") ? f.shopPhoto.mime : "image/jpeg";
      content.push({
        type: "image",
        source: { type: "base64", media_type: mime, data: f.shopPhoto.data },
      });
      f.shopPhotoAttached = true;
    }

    // optional: product photo — Claude sees the actual product
    if (f.productImage && f.productImage.data) {
      const mime = /^image\/(jpeg|png|gif|webp)$/.test(f.productImage.mime || "") ? f.productImage.mime : "image/jpeg";
      content.push({
        type: "image",
        source: { type: "base64", media_type: mime, data: f.productImage.data },
      });
      f.productImageAttached = true;
    }

    content.push({ type: "text", text: buildPrompt(f) });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        messages: [{ role: "user", content }],
      }),
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error.message);
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");

    const section = (marker, next) => {
      const start = text.indexOf(marker);
      if (start < 0) return "";
      const from = start + marker.length;
      const end = next ? text.indexOf(next, from) : -1;
      return (end >= 0 ? text.slice(from, end) : text.slice(from)).trim();
    };

    const character1 = section("@@CHARACTER1@@", "@@CHARACTER2@@");
    const character2 = section("@@CHARACTER2@@", "@@SETTING@@");
    const setting = section("@@SETTING@@", "@@SCENE@@");
    const scenes = text
      .split("@@SCENE@@")
      .slice(1)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!scenes.length) throw new Error("No scenes were generated. Raw start: " + text.slice(0, 200));

    res.json({ character1, character2, setting, scenes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- flow input discovery ----
// Magnific's input keys change whenever the flow is edited (we've seen brieff ->
// character_1 -> character_1_2 -> input_2d76...). Instead of hardcoding them, ask the
// flow what inputs it actually has and match our values onto them.
let flowSpecCache = null;

async function getFlowInputs(flowId) {
  if (flowSpecCache && flowSpecCache.id === flowId) return flowSpecCache.inputs;

  const r = await fetch(`https://api.magnific.com/v1/ai/flows/${flowId}`, {
    headers: { "x-magnific-api-key": MAGNIFIC_API_KEY },
    signal: AbortSignal.timeout(20000),
  });
  const raw = await r.text();
  let data;
  try { data = JSON.parse(raw); }
  catch { throw new Error(`Could not read flow spec (HTTP ${r.status}): ${raw.slice(0, 200)}`); }
  if (!r.ok || data.error) throw new Error(data.error?.message || `Flow spec HTTP ${r.status}`);

  const inputs = data.inputs || data.data?.inputs || [];
  if (!inputs.length) throw new Error("Flow spec returned no inputs");
  flowSpecCache = { id: flowId, inputs };
  console.log(`[flow] discovered inputs: ${inputs.map((i) => `${i.id || i.name} [${i.label || "-"}]`).join(", ")}`);
  return inputs;
}

function mapInputs(flowInputs, values) {
  const out = {};
  const used = new Set();

  const pick = (test) =>
    flowInputs.find((i) => {
      const key = String(i.id || i.name || "");
      if (used.has(key)) return false;
      const label = String(i.label || i.name || "").toLowerCase();
      return test(label, i);
    });

  const assign = (input, value) => {
    if (!input || value == null || value === "") return;
    const key = input.id || input.name;
    out[key] = value;
    used.add(key);
  };

  // scenes: the list-type input (or one labelled "scene")
  assign(pick((label, i) => label.includes("scene") || i.type === "list"), values.scenes);
  assign(pick((label) => label.includes("character") && /1|one/.test(label)), values.character1);
  assign(pick((label) => label.includes("character") && /2|two/.test(label)), values.character2);
  assign(pick((label) => /set|environment|location|scene.?setting/.test(label)), values.setting);

  // product: a labelled one, else any remaining image/media input
  if (values.productDataUrl) {
    let prod =
      pick((label) => label.includes("product")) ||
      pick((label, i) => /image|media|asset|creation/i.test(`${i.type || ""} ${i.kind || ""}`));

    // Last resort: if the node has an unhelpful label (e.g. a raw hash), take the first
    // remaining required input that we haven't filled yet.
    if (!prod) prod = pick((label, i) => i.required);

    assign(prod, values.productDataUrl);
  }

  const missing = flowInputs
    .filter((i) => i.required && out[i.id || i.name] === undefined)
    .map((i) => i.label || i.id || i.name);

  return { inputs: out, missing };
}

// 2) Start the Magnific flow — returns a run id instantly
app.post("/api/run", async (req, res) => {
  try {
    if (!MAGNIFIC_API_KEY) throw new Error("MAGNIFIC_API_KEY is missing in .env");
    const { scenes, character1, character2, setting, productImage } = req.body;
    const fid = DEFAULT_FLOW_ID;

    const productDataUrl = productImage && productImage.data
      ? `data:${productImage.mime || "image/jpeg"};base64,${productImage.data}`
      : null;

    let inputs;
    try {
      const flowInputs = await getFlowInputs(fid);
      const mapped = mapInputs(flowInputs, { scenes, character1, character2, setting, productDataUrl });
      inputs = mapped.inputs;
      if (mapped.missing.length) {
        throw new Error(
          `Your Magnific flow marks these inputs as required, but nothing was provided for them: ${mapped.missing.join(", ")}. ` +
          `If this is the product image node, either upload a product photo above, or open the flow in Magnific and make that input optional.`
        );
      }
      console.log(`[run] sending keys: ${Object.keys(inputs).join(", ")}`);
    } catch (e) {
      // if discovery fails, fall back to the last-known key names
      console.warn(`[run] input discovery failed (${e.message}) — using fallback names`);
      if (/requires inputs we couldn't fill/.test(e.message)) throw e;
      inputs = {
        scenes_2: scenes,
        character_1_2: character1,
        character_2_2: character2,
        setting_2: setting,
      };
      if (productDataUrl && PRODUCT_INPUT_NAME) inputs[PRODUCT_INPUT_NAME] = productDataUrl;
    }

    const r = await fetch(`https://api.magnific.com/v1/ai/flows/${fid}/run`, {
      method: "POST",
      headers: { "x-magnific-api-key": MAGNIFIC_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ inputs }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(typeof data === "object" ? JSON.stringify(data) : String(data));
    const runId =
      data.workflow_run_identifier ||
      data.id || data.run_id || data.runId || (data.data && data.data.id);
    if (!runId) throw new Error("No run id in Magnific response: " + JSON.stringify(data));
    res.json({ runId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3) Poll a run — called repeatedly by the browser
app.get("/api/status/:runId", async (req, res) => {
  try {
    const r = await fetch(`https://api.magnific.com/v1/ai/flows/runs/${req.params.runId}`, {
      headers: { "x-magnific-api-key": MAGNIFIC_API_KEY },
    });
    const data = await r.json();
    const status = data.status || data.state || "unknown";
    const videoUrl = findVideoUrl(data);
    const failed = /fail|error|cancel/i.test(String(status));
    res.json({ status, videoUrl, failed });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4) Stream the finished video so the browser can download it cleanly
app.get("/api/download", async (req, res) => {
  try {
    const r = await fetch(req.query.url);
    res.setHeader("Content-Disposition", 'attachment; filename="magnific-video.mp4"');
    res.setHeader("Content-Type", r.headers.get("content-type") || "video/mp4");
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// Catch-all route to serve Vite SPA on refresh or direct URL navigation
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => console.log(`
  Dashboard running -> http://localhost:${PORT}
`));