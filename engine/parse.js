// Parses the engine's @@MARKER@@ output into structured parts.

const MARKERS = ["@@HEADER@@", "@@CHARACTER1@@", "@@CHARACTER2@@", "@@SETTING@@", "@@SCENE@@", "@@RECORD@@"];

function section(text, marker) {
  const start = text.indexOf(marker);
  if (start < 0) return "";
  const from = start + marker.length;
  let end = text.length;
  for (const m of MARKERS) {
    const i = text.indexOf(m, from);
    if (i >= 0 && i < end) end = i;
  }
  return text.slice(from, end).trim();
}

function parseHeader(h) {
  const get = (label) => {
    const m = h.match(new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, "im"));
    return m ? m[1].trim() : "";
  };
  return { business: get("Business"), format: get("Format"), lens: get("Lens"), hook: get("Hook"), moment: get("Moment") };
}

function parseRecord(raw) {
  if (!raw) return null;
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// split one scene's Audio section into { speaker, text } lines
function dialogueOf(scene) {
  const m = scene.match(/Audio\s*\/\s*Dialogue\s*\/\s*Voiceover\s*:([\s\S]*?)(?:\n\s*Sound Design\s*:|$)/i);
  if (!m) return { found: false, lines: [], stray: [] };
  const lines = [], stray = [];
  for (const raw of m[1].split("\n")) {
    const line = raw.trim();
    if (!line || /^\(?none\)?\.?$/i.test(line) || /^none\b/i.test(line)) continue;
    const d = line.match(/^([^:"“”]{1,60}?)\s*:\s*["“](.+?)["”]\s*$/);
    if (d) lines.push({ speaker: d[1].replace(/[\[\]*]/g, "").trim(), text: d[2].trim() });
    else if (/["“”]/.test(line)) stray.push(line);
  }
  return { found: true, lines, stray };
}

function parseOutput(text) {
  const clean = String(text || "").replace(/```[a-z]*\n?/gi, "");
  const headerRaw = section(clean, "@@HEADER@@");
  const scenes = clean.split("@@SCENE@@").slice(1).map((s) => {
    const cut = s.indexOf("@@RECORD@@");
    return (cut >= 0 ? s.slice(0, cut) : s).trim();
  }).filter(Boolean);

  return {
    raw: clean,
    headerRaw,
    header: parseHeader(headerRaw),
    character1: section(clean, "@@CHARACTER1@@"),
    character2: section(clean, "@@CHARACTER2@@"),
    setting: section(clean, "@@SETTING@@"),
    scenes,
    record: parseRecord(section(clean, "@@RECORD@@")),
  };
}

// The text sent to Magnific: drop the edit-step-only parts (music mood note, Editing Notes)
// so the video model never sees music or edit instructions.
// Video models generate each scene on its own and "forget" the room between scenes, so every scene
// sent to Magnific carries the SAME setting (and the two characters) word for word.
// Section 3 "• UI / in-scene text:" — the exact words of any writing or phone/app screen the AI draws in the scene
// (S-M5, spine 2.1.0). "" when the scene has none.
function inSceneTextOf(scene) {
  const m = String(scene || "").match(/^\s*•\s*UI\s*\/\s*in-scene text:\s*(.+)$/im);
  const v = m ? m[1].trim() : "";
  return /^(none|n\/a|-)?\.?$/i.test(v) ? "" : v;
}

function sceneForGeneration(scene, ctx = {}) {
  const inSceneText = inSceneTextOf(scene);
  const body = scene
    .replace(/\n\s*Editing Notes[^\n]*:[\s\S]*$/i, "")
    // Section 3 scenes (Script & Storyboard Spine): supers, callouts, CTA, disclaimers and logo are rendered by
    // Production, never generated (S-M5); the transition is an edit-step cue. In-scene writing and phone UI are
    // generated: they come back below, word for word.
    .replace(/\n\s*On-screen elements[^\n]*:[\s\S]*?(?=\n\s*Audio\s*\/\s*Dialogue)/i, "")
    .replace(/^\s*Transition out:.*$/gim, "")
    .replace(/^.*Music mood note.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const lock = [];
  if (ctx.setting) {
    lock.push(`SETTING — IDENTICAL IN EVERY SCENE (same place, same layout, same props, same colours, same light, same time of day; only the camera angle changes): ${ctx.setting.replace(/\s*UIs needed:\s*none\.?/i, "").trim()}`);
  }
  if (ctx.character1 || ctx.character2) {
    lock.push(`CHARACTERS — SAME LOOK AND CLOTHES IN EVERY SCENE: ${[ctx.character1, ctx.character2].filter(Boolean).join(" | ")}. These are the only two people featured in this film; nobody else acts or is framed as a subject.`);
  }
  if (ctx.businessType) {
    lock.push(`BUSINESS DOMAIN: Authentic setting and merchandise for ${ctx.businessType}. Props, environment, and character actions must believably belong to this business.`);
  }
    const isStoryFmt = /story/i.test(ctx.format || ctx.style || ctx.creativeStyle || "");
  if (isStoryFmt) {
    lock.push("STAGING & CAMERA: Objective third-person cinematic camera observing the scene. Characters interact with each other and look at each other. They do NOT hold phones, do NOT film selfies, and do NOT talk into a smartphone camera.");
  }
  lock.push("PERFORMANCE: lively, natural, upbeat acting — real expressions and reactions (smiles, raised eyebrows, laughs, quick gestures), people move and behave like real neighbours, never stiff or posed. When the characters speak to each other they look at each other and keep natural eye contact; nobody stares into the distance or looks blankly past the other person" + (isStoryFmt ? "." : " (only a UGC owner speaking to the viewer looks into the lens)."));
  lock.push("CAMERA: follow this scene's camera direction exactly (shot size, angle, movement) — smooth, motivated movement only, no whip pans or fast cuts.");
  if (inSceneText) {
    lock.push(`IN-SCENE TEXT — render exactly these words where the scene shows them, short and legible, nothing added (no logo): ${inSceneText}`);
  }
  if (ctx.duration || ctx.sceneCount) {
    // every scene is exactly 5 seconds; the end frame is added after generation and is not part of any scene
    const count = Number(ctx.sceneCount) || Math.max(1, Math.round((parseInt(ctx.duration, 10) || 20) / 5));
    const which = Number.isInteger(ctx.sceneIndex) ? `scene ${ctx.sceneIndex + 1} of ${count}` : `one of ${count} scenes`;
    lock.push(`PACING & DURATION: This scene is exactly 5 seconds (${which}; ${count * 5}s of generated video in all, with the end frame added afterwards). Fast, snappy pacing.`);
  }
  if (ctx.aspectRatio || ctx.dimension || ctx.platform) {
    const ar = ctx.aspectRatio || ctx.dimension || (String(ctx.platform).includes("16:9") ? "16:9" : String(ctx.platform).includes("1:1") ? "1:1" : "9:16");
    const framingDirective = ar === "16:9"
      ? "WIDESCREEN 16:9 COMPOSITION: Cinematic landscape horizontal framing. Wide horizontal depth with comfortable two-shot or medium wide staging, ample room context, and natural lateral camera tracking."
      : ar === "1:1"
      ? "SQUARE 1:1 COMPOSITION: Balanced square composition with centered subject framing, equal headroom and side margins, optimized for social feed grids."
      : "VERTICAL 9:16 COMPOSITION: Mobile-native vertical framing. Subject/character fills primary vertical 9:16 viewing area with clear head-and-chest or waist-up visibility.";
    lock.push(framingDirective);
  }
  if (ctx.language) {
    lock.push(`LANGUAGE & SPOKEN DELIVERY: Dialogue is in ${ctx.language}. Actors mouth, deliver, and express authentic spoken dialogue delivery matching ${ctx.language}.`);
  }
  if (ctx.creativeGuardrails) {
    const { hasActiveGuardrails, formatGuardrailsPromptBlock } = require("./guardrails");
    if (hasActiveGuardrails(ctx.creativeGuardrails)) {
      lock.push(formatGuardrailsPromptBlock(ctx.creativeGuardrails));
    }
  }
  return `${lock.join("\n")}\n\n${body}`;
}

// Stage 1–3 answers: JSON between @@JSON@@ and @@END@@ (supports objects and arrays).
function parseJSONBlock(text) {
  const t = String(text || "");
  const m = t.match(/@@JSON@@([\s\S]*?)(?:@@END@@|$)/);
  let body = (m ? m[1] : t).replace(/```[a-z]*\n?/gi, "").trim();

  // Try direct parse first
  try {
    return JSON.parse(body);
  } catch {}

  // The answer is an object or an array, whichever opens first (an array inside a broken object is not the answer)
  const arrayMatch = body.match(/\[[\s\S]*\]/);
  const objMatch = body.match(/\{[\s\S]*\}/);
  const candidates = [arrayMatch, objMatch].filter(Boolean).sort((a, b) => a.index - b.index).map((x) => x[0]);
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {}
    // quoted speech left unescaped inside a string ("line": "Maker: "You can't…"") loses the whole answer
    try {
      return JSON.parse(escapeStrayQuotes(c));
    } catch {}
  }

  return JSON.parse(body);
}

/**
 * Escape the quotes a model left unescaped inside a JSON string. Inside a string, a quote ends it only when what
 * follows is JSON structure (":" , "}" or "]", or a comma before the next key or value); any other quote is part of
 * the text. Raw line breaks inside a string are escaped too. Used only when strict parsing has already failed.
 */
function escapeStrayQuotes(json) {
  const s = String(json);
  const nextNonSpace = (from) => { let j = from; while (j < s.length && /\s/.test(s[j])) j++; return j; };
  let out = "";
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!inStr) { if (ch === '"') inStr = true; out += ch; continue; }
    if (ch === "\\") { out += ch + (s[i + 1] || ""); i++; continue; }
    if (ch === "\n" || ch === "\r") { out += ch === "\n" ? "\\n" : ""; continue; }
    if (ch !== '"') { out += ch; continue; }
    const j = nextNonSpace(i + 1);
    const next = s[j];
    let closes = next === undefined || next === ":" || next === "}" || next === "]";
    if (next === ",") { const k = nextNonSpace(j + 1); closes = k >= s.length || /^(?:["{[\]}]|-?\d|true\b|false\b|null\b)/.test(s.slice(k, k + 6)); }
    if (closes) { inStr = false; out += ch; } else out += '\\"';
  }
  return out;
}

module.exports = { parseOutput, dialogueOf, sceneForGeneration, inSceneTextOf, parseJSONBlock };
