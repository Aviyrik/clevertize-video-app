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
function sceneForGeneration(scene, ctx = {}) {
  const body = scene
    .replace(/\n\s*Editing Notes[^\n]*:[\s\S]*$/i, "")
    .replace(/^.*Music mood note.*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const lock = [];
  if (ctx.setting) {
    lock.push(`SETTING — IDENTICAL IN EVERY SCENE (same place, same layout, same props, same colours, same light, same time of day; only the camera angle changes): ${ctx.setting.replace(/\s*UIs needed:\s*none\.?/i, "").trim()}`);
  }
  if (ctx.character1 || ctx.character2) {
    lock.push(`CHARACTERS — SAME LOOK AND CLOTHES IN EVERY SCENE: ${[ctx.character1, ctx.character2].filter(Boolean).join(" | ")}`);
  }
  if (ctx.businessType) {
    lock.push(`BUSINESS DOMAIN: Authentic setting and merchandise for ${ctx.businessType}. Props, environment, and character actions must believably belong to this business.`);
  }
  lock.push("PERFORMANCE: lively, natural, upbeat acting — real expressions and reactions (smiles, raised eyebrows, laughs, quick gestures), people move and behave like real neighbours, never stiff or posed. When the characters speak to each other they look at each other and keep natural eye contact; nobody stares into the distance or looks blankly past the other person (only a UGC owner speaking to the viewer looks into the lens).");
  lock.push("CAMERA: follow this scene's camera direction exactly (shot size, angle, movement) — smooth, motivated movement only, no whip pans or fast cuts.");
  if (ctx.duration) {
    const totalSec = parseInt(ctx.duration, 10) || 15;
    const perScene = (totalSec / 4).toFixed(1);
    lock.push(`PACING & DURATION: Total video target duration is ${ctx.duration} across 4 scenes (~${perScene}s per scene). Ensure fast, snappy pacing calibrated to ~${perScene} seconds.`);
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

  // If body is an array: match from first [ to last ]
  const arrayMatch = body.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {}
  }

  // If body is an object: match from first { to last }
  const objMatch = body.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {}
  }

  return JSON.parse(body);
}

module.exports = { parseOutput, dialogueOf, sceneForGeneration, parseJSONBlock };
