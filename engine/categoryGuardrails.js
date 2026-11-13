/**
 * engine/categoryGuardrails.js
 * Category compliance guardrails (spec: "Category Guardrails for Local Performance Ads", Oct 29, 2026).
 *
 * The rules themselves live in engine/rules/categoryGuardrails.json (data, not prompt text), so they can be
 * updated without a code change; the file is re-read whenever it changes on disk.
 *
 * Every film runs the universal module first, then its category module. When two rules conflict the stricter
 * one wins: a claim is only allowed when every module that mentions it allows it. All of this sits on top of
 * the Product Spine v2 rules (M1-M27), which engine/gate.js keeps enforcing.
 *
 * Flow: buildComplianceContext() once per request (as soon as the business type is known, i.e. at the brief)
 * -> formatPromptBlock() into every text generation prompt -> formatRenderBlock() into every video-model prompt
 * -> scanScript() / gateFailures() on every generated script -> humanReviewFor() before the end frame.
 */

const fs = require("fs");
const path = require("path");

const RULES_FILE = process.env.CATEGORY_RULES_FILE || path.join(__dirname, "rules", "categoryGuardrails.json");

let cache = { mtimeMs: -1, data: null };
const compiled = new WeakMap(); // rule entry -> { patterns: RegExp[], excepts: RegExp[] }

function loadRules() {
  let mtimeMs = 0;
  try { mtimeMs = fs.statSync(RULES_FILE).mtimeMs; } catch (_) { /* fall through to the read error */ }
  if (cache.data && mtimeMs === cache.mtimeMs) return cache.data;
  const data = JSON.parse(fs.readFileSync(RULES_FILE, "utf8"));
  cache = { mtimeMs, data };
  return data;
}

// ---------- text normalisation & matching (Roman + Devanagari) ----------

const NUKTA = /़/g;
function normText(s) {
  return String(s == null ? "" : s)
    .normalize("NFC")
    .replace(NUKTA, "")
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966))
    .replace(/[‘’`]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase();
}

const WORD = "\\p{L}\\p{M}\\p{N}";
function termRegex(term) {
  const t = normText(term).trim();
  if (!t) return null;
  const body = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "[\\s\\-]+");
  const before = /^[\p{L}\p{N}]/u.test(t) ? `(?<![${WORD}])` : "";
  const after = /[\p{L}\p{N}\p{M}]$/u.test(t) ? `(?![${WORD}])` : "";
  return new RegExp(`${before}${body}${after}`, "giu");
}

function sourceRegex(src) {
  return new RegExp(String(src).normalize("NFC").replace(NUKTA, ""), "giu");
}

function compileEntry(entry) {
  let c = compiled.get(entry);
  if (!c) {
    c = {
      patterns: [
        ...(entry.terms || []).map(termRegex),
        ...(entry.regex || []).map(sourceRegex),
      ].filter(Boolean),
      excepts: (entry.except || []).map(termRegex).filter(Boolean),
    };
    compiled.set(entry, c);
  }
  return c;
}

// Every match of an entry in a text, in pattern order (one allowed match must not hide a disallowed one)
function allMatches(entry, normalizedText) {
  const { patterns, excepts } = compileEntry(entry);
  let text = normalizedText;
  for (const ex of excepts) { ex.lastIndex = 0; text = text.replace(ex, (m) => " ".repeat(m.length)); }
  const out = [];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      if (m[0].trim()) out.push(m[0].trim());
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return out;
}

function containsTerm(haystackNorm, needle) {
  const re = termRegex(needle);
  if (!re) return false;
  re.lastIndex = 0;
  return re.test(haystackNorm);
}

// ---------- business type -> category ----------

function resolveCategory(businessType, input = {}) {
  const rules = loadRules();
  const raw = String(businessType || "").trim();
  const key = Object.keys(rules.business_type_map).find((k) => k.toLowerCase() === raw.toLowerCase());
  const entry = key ? rules.business_type_map[key] : null;
  const ownerPick = typeof input.category === "string" ? input.category.trim() : "";
  const scopePick = typeof input.scope === "string" ? input.scope.trim() : "";

  if (entry && entry.category) {
    let categoryId = entry.category;
    let status = "clean";
    if (Array.isArray(entry.scope_choice)) {
      status = "needs_scope";
      if (scopePick && entry.scope_choice.includes(scopePick) && rules.categories[scopePick]) {
        categoryId = scopePick;
        status = "scope_selected";
      }
    }
    return {
      status,
      businessType: raw,
      categoryId,
      scopeChoice: entry.scope_choice || null,
      flag: status === "needs_scope" ? entry.flag || null : null,
      suggested: null,
    };
  }

  // Not mapped (listed as unmapped, or a custom business type): never guess. The owner may pick a category.
  if (ownerPick && rules.categories[ownerPick]) {
    return { status: "owner_selected", businessType: raw, categoryId: ownerPick, scopeChoice: null, flag: null, suggested: entry ? entry.suggested || null : null };
  }
  return {
    status: "unmapped",
    businessType: raw,
    categoryId: null,
    scopeChoice: null,
    flag: entry ? entry.flag : `"${raw || "(blank)"}" is not a known business type, so no category module was loaded. Only the universal rules apply until the owner picks a category.`,
    suggested: entry ? entry.suggested || null : null,
  };
}

// ---------- proof fields ----------

function proofFieldsFor(modules) {
  const out = [];
  for (const m of modules) for (const f of m.proof_fields || []) out.push({ ...f, module: m.id });
  return out;
}

function sanitizeProof(raw, fields) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const f of fields) {
    const v = raw[f.id];
    if (v == null) continue;
    if (f.kind === "confirm") {
      if (v === true || v === "true" || v === "yes") out[f.id] = true;
    } else if (f.kind === "multi") {
      const allowed = new Set((f.options || []).map((o) => o.value));
      const list = (Array.isArray(v) ? v : [v]).map(String).filter((x) => allowed.has(x));
      if (list.length) out[f.id] = [...new Set(list)];
    } else if (f.kind === "select") {
      const allowed = new Set((f.options || []).map((o) => o.value));
      if (allowed.has(String(v))) out[f.id] = String(v);
    } else {
      const s = String(v).replace(/\s+/g, " ").trim().slice(0, 300);
      if (s) out[f.id] = s;
    }
  }
  return out;
}

function isFilled(v) {
  if (v === true) return true;
  if (Array.isArray(v)) return v.length > 0;
  return typeof v === "string" && v.trim().length > 0;
}

// "field" -> the field is filled; "field:option" -> the select equals / the multi includes option
function requirementMet(req, proof) {
  const [field, option] = String(req).split(":");
  const v = proof[field];
  if (!option) return isFilled(v);
  return Array.isArray(v) ? v.includes(option) : v === option;
}

// ---------- mood ----------

function resolveMood(category, { brandTone = "", mood = "", offer = "", festivalText = "" } = {}) {
  const rules = loadRules();
  const label = (id) => (rules.moods[id] && rules.moods[id].label) || id || "";
  const requested = (mood && rules.moods[mood] ? mood : null) ||
    rules.brand_tone_to_mood[String(brandTone || "").trim().toLowerCase()] || null;
  if (!category) {
    return { id: requested, label: requested ? label(requested) : null, requested, requestedTone: brandTone || null, enforced: false, allowed: [], reason: null };
  }
  const fest = normText(festivalText);
  const available = (category.allowed_moods || []).filter((m) => {
    if (m.requires === "offer") return Boolean(String(offer || "").trim());
    if (m.requires === "festival") {
      if (!fest.trim()) return false;
      return !m.festival_terms || m.festival_terms.some((t) => containsTerm(fest, t));
    }
    return true;
  }).map((m) => m.mood);
  const forbidden = new Set(category.forbidden_moods || []);
  const ok = requested && available.includes(requested) && !forbidden.has(requested);
  const id = ok ? requested : category.default_mood;
  return {
    id,
    label: label(id),
    requested,
    requestedTone: brandTone || null,
    enforced: !ok,
    allowed: (category.allowed_moods || []).map((m) => ({ id: m.mood, label: label(m.mood), note: m.note || null, available: available.includes(m.mood) })),
    forbidden: [...forbidden].map(label),
    reason: ok
      ? null
      : requested
        ? `${label(requested)} is not allowed for ${category.name} here, so the category default (${label(id)}) is used.`
        : `${category.name} films use the category default mood (${label(id)}).`,
    note: category.mood_note || null,
  };
}

// ---------- context ----------

/**
 * input: { businessType, categoryCompliance: { category, scope, proof }, brandTone, mood, offer, specialty, brief,
 *          product, productName, occasion, festival, hasPhotos }
 */
function buildComplianceContext(input = {}) {
  const rules = loadRules();
  const cc = (input.categoryCompliance && typeof input.categoryCompliance === "object") ? input.categoryCompliance : {};
  const mapping = resolveCategory(input.businessType, cc);
  const category = mapping.categoryId ? rules.categories[mapping.categoryId] : null;
  const modules = [rules.universal, ...(category ? [category] : [])];
  const fields = proofFieldsFor(modules);
  const proof = sanitizeProof(cc.proof, fields);
  const proofText = fields.filter((f) => f.kind === "text" && proof[f.id]).map((f) => proof[f.id]).join(" \n ");
  const ownerText = [input.offer, input.specialty, input.brief, input.product, input.productName, proofText]
    .filter((x) => typeof x === "string" && x.trim()).join(" \n ");
  const festivalText = [input.occasion, input.festival].filter(Boolean).join(" ");
  const mood = resolveMood(category, { brandTone: input.brandTone, mood: input.mood, offer: input.offer, festivalText });

  const blockers = [];
  for (const m of modules) {
    for (const b of m.generation_blockers || []) {
      if (!(b.requires || []).every((r) => requirementMet(r, proof))) blockers.push({ id: b.id, module: m.id, message: b.message });
    }
  }

  const endFrameLines = fields
    .filter((f) => f.end_frame && isFilled(proof[f.id]))
    .map((f) => `${f.end_frame_label || f.label}: ${proof[f.id]}`);

  return {
    version: rules.version,
    source: rules.source,
    businessType: mapping.businessType,
    mapping,
    category,
    categoryId: category ? category.id : null,
    categoryName: category ? category.name : null,
    riskTier: category ? category.risk_tier : null,
    modules,
    proofFields: fields,
    proof,
    hasPhotos: Boolean(input.hasPhotos),
    formTextNorm: normText(ownerText),
    offer: String(input.offer || ""),
    festivalText,
    mood,
    effectiveBrandTone: mood.enforced && mood.label ? mood.label : (input.brandTone || null),
    blockers,
    endFrameLines,
  };
}

function isComplianceContext(x) {
  return Boolean(x && typeof x === "object" && Array.isArray(x.modules) && x.mapping);
}

function assertCanGenerate(ctx) {
  if (!isComplianceContext(ctx) || !ctx.blockers.length) return;
  const err = new Error(ctx.blockers.map((b) => b.message).join(" "));
  err.status = 422;
  err.code = "COMPLIANCE_BLOCKED";
  err.blockers = ctx.blockers;
  throw err;
}

// ---------- prompt blocks ----------

const MAX_TERMS_IN_PROMPT = 8;
function entryLine(e) {
  const examples = (e.terms || []).filter((t) => /[a-z]/i.test(t)).slice(0, MAX_TERMS_IN_PROMPT);
  const hindi = (e.terms || []).filter((t) => /[ऀ-ॿ]/.test(t)).slice(0, 4);
  const ex = [...examples, ...hindi].map((t) => `"${t}"`).join(", ");
  return `${e.label}${ex ? ` (e.g. ${ex})` : ""}`;
}

function gatedLine(e, ctx) {
  const reqs = [...(e.requires || []), ...(e.requires_term_in ? [e.requires_term_in] : [])];
  const fieldLabel = (id) => {
    const f = ctx.proofFields.find((x) => x.id === id.split(":")[0]);
    if (!f) return id;
    const opt = id.includes(":") ? (f.options || []).find((o) => o.value === id.split(":")[1]) : null;
    return opt ? `${f.label}: ${opt.label}` : f.label;
  };
  const met = (e.requires || []).every((r) => requirementMet(r, ctx.proof)) &&
    (!e.requires_term_in || isFilled(ctx.proof[e.requires_term_in]));
  const state = reqs.length
    ? (met
      ? `ON FILE (${reqs.map(fieldLabel).join("; ")}${e.requires_term_in ? ` = "${ctx.proof[e.requires_term_in]}" - use only those exact words` : ""})`
      : `NOT ON FILE (${reqs.map(fieldLabel).join("; ")}) -> do NOT make this claim`)
    : "only if the owner's form says it -> otherwise do NOT make this claim";
  return `${entryLine(e)}: ${state}`;
}

/** The rules every text-generation stage gets (brief, angles, hooks, plots, story, script, rewrite). */
function formatPromptBlock(ctx, stage = "script") {
  if (!isComplianceContext(ctx)) return "";
  const rules = loadRules();
  const c = ctx.category;
  const lines = [];
  lines.push(`=== CATEGORY COMPLIANCE GUARDRAILS (rules v${ctx.version}; source: ${ctx.source}) ===`);
  lines.push(`Stage: ${stage}. ${rules.precedence}`);
  if (c) {
    lines.push(`Category module: ${c.name} | risk tier: ${c.risk_tier} | human review: ${c.human_review_rule.label}${c.approach ? ` | ${c.approach}` : ""}`);
  } else {
    lines.push(`Category module: NONE - ${ctx.mapping.flag || "business type not mapped"} Universal rules only.`);
  }

  lines.push("", "UNIVERSAL RULES (apply first):");
  for (const r of rules.universal.rules) lines.push(`${r.id}. ${r.text}`);
  lines.push("Universal claims that need proof:");
  for (const e of rules.universal.claims_gated) lines.push(`- ${gatedLine(e, ctx)}`);

  if (c) {
    lines.push("", `CATEGORY CLAIMS - ${c.name}:`);
    for (const a of c.claims_allowed || []) lines.push(`- Allowed: ${a}`);
    for (const e of c.claims_gated || []) lines.push(`- Gated: ${gatedLine(e, ctx)}`);
  }

  const autoWords = ctx.modules.flatMap((m) => m.auto_reject_words || []);
  const autoVisuals = ctx.modules.flatMap((m) => m.auto_reject_visuals || []);
  lines.push("", "AUTO-REJECT - never write these in dialogue, voiceover or visuals (Roman or Devanagari):");
  for (const e of autoWords) lines.push(`- ${entryLine(e)}${e.unless_in_form ? " - unless the owner's form states it" : ""}`);
  lines.push("AUTO-REJECT - never show:");
  for (const e of autoVisuals) lines.push(`- ${entryLine(e)}`);

  if (c) {
    if ((c.visual_rules || []).length) { lines.push("", "VISUAL & GENERATION RULES:"); c.visual_rules.forEach((v) => lines.push(`- ${v}`)); }
    if ((c.ai_weaknesses || []).length) { lines.push("AI-GENERATION WEAK SPOTS (write around them):"); c.ai_weaknesses.forEach((v) => lines.push(`- ${v}`)); }
    if ((c.safety_visuals || []).length) { lines.push("SAFETY VISUALS REQUIRED WHERE RELEVANT (write them into the Visual):"); c.safety_visuals.forEach((s) => lines.push(`- ${s.label}`)); }
    lines.push("", "CRAFT:");
    lines.push(`- Human truths to draw on: ${(c.human_truths || []).join(" | ")}`);
    lines.push(`- Preferred hooks: ${(c.hook_preferences || []).join(" | ")}`);
    if ((c.endings || []).length) lines.push(`- Endings: ${c.endings.join(" | ")}`);
    if (c.format_note) lines.push(`- Format: ${c.format_note}`);
    lines.push(`- Do: ${(c.do || []).join(" ")}`);
    lines.push(`- Don't: ${(c.dont || []).join(" ")}`);
    lines.push("", `MOOD (enforced by the category): ${ctx.mood.label}. Allowed: ${ctx.mood.allowed.map((m) => `${m.label}${m.note ? ` (${m.note})` : ""}`).join("; ")}.${ctx.mood.forbidden && ctx.mood.forbidden.length ? ` Never: ${ctx.mood.forbidden.join(", ")}.` : ""}${ctx.mood.note ? ` ${ctx.mood.note}` : ""}${ctx.mood.reason ? ` (${ctx.mood.reason})` : ""}`);
    if (c.regulatory_notes) lines.push(`REGULATORY NOTE (working summary, not legal advice): ${c.regulatory_notes}`);
  }
  if (ctx.endFrameLines.length) {
    lines.push("", `END FRAME: the system adds ${ctx.endFrameLines.map((l) => `"${l}"`).join(", ")} to the end frame (M11). Never write, invent or alter registration or licence numbers in the script.`);
  }
  lines.push("=== END CATEGORY COMPLIANCE GUARDRAILS ===");
  return lines.join("\n");
}

/** The compact visual / AI-generation rules that must reach the video model's prompt for every shot. */
function formatRenderBlock(ctx) {
  if (!isComplianceContext(ctx)) return "";
  const rules = loadRules();
  const u = rules.universal.rules.filter((r) => ["U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "U20"].includes(r.id));
  const c = ctx.category;
  const lines = [`COMPLIANCE - VISUAL & AI-GENERATION RULES${c ? ` (${c.name})` : ""}:`];
  for (const r of u) lines.push(`- ${r.text}`);
  if (c) {
    for (const v of c.visual_rules || []) lines.push(`- ${v}`);
    for (const v of c.ai_weaknesses || []) lines.push(`- ${v}`);
    for (const s of c.safety_visuals || []) lines.push(`- Show: ${s.label}.`);
  }
  const never = ctx.modules.flatMap((m) => m.auto_reject_visuals || []).map((e) => e.label);
  lines.push(`- Never show: ${never.join("; ")}.`);
  lines.push(`- Mood: ${ctx.mood.label || "as briefed"}.`);
  return lines.join("\n");
}

// ---------- script segmentation ----------

const VO_SPEAKER = /^(?:text\s*[+&]\s*)?(?:vo|v\.o\.|v\/o|voiceover|voice[\s-]over|narrator|narration|off[\s-]screen|audio)$/i;
const END_CARD = /\b(outro|logo|end[\s-]?card|end frame)\b/i;

function sectionText(scene, label, nextLabels) {
  const re = new RegExp(`${label}\\s*:([\\s\\S]*?)(?:\\n\\s*(?:${nextLabels.join("|")})\\s*[:(]|$)`, "i");
  const m = scene.match(re);
  return m ? m[1].trim() : null;
}

function speakerLines(block) {
  const out = [];
  for (const raw of String(block || "").split("\n")) {
    const line = raw.trim().replace(/^[-•*]\s*/, "");
    if (!line || /^\(?none\)?\.?$/i.test(line)) continue;
    const m = line.match(/^([^:"“”]{1,60}?)\s*:\s*(.+)$/);
    if (m) {
      const speaker = m[1].replace(/[[\]*]/g, "").trim();
      out.push({ field: VO_SPEAKER.test(speaker) ? "voiceover" : "dialogue", text: m[2].replace(/^["“]|["”]$/g, "").trim(), speaker });
    } else {
      out.push({ field: "dialogue", text: line, speaker: null });
    }
  }
  return out;
}

function segmentsOfAnnexScene(scene, n) {
  const segs = [];
  const title = (String(scene).split("\n").find((l) => l.trim()) || "").trim();
  const endCard = END_CARD.test(title);
  const visual = sectionText(scene, "Visual", ["Audio\\s*\\/\\s*Dialogue\\s*\\/\\s*Voiceover", "Sound Design", "Editing Notes"]);
  const audio = sectionText(scene, "Audio\\s*\\/\\s*Dialogue\\s*\\/\\s*Voiceover", ["Sound Design", "Editing Notes"]);
  if (visual == null && audio == null) {
    // Free-form or simple scene text: labelled lines are speech, everything else is visual
    for (const raw of String(scene).split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const m = line.match(/^(?:dialogue|audio|vo|voiceover|narration)\s*:\s*(.+)$/i);
      const sp = line.match(/^([^:"“”]{1,40}?)\s*:\s*["“](.+?)["”]\s*$/);
      if (m) segs.push(...speakerLines(m[1]).map((s) => ({ ...s, field: /^(vo|voiceover|narration)/i.test(line) ? "voiceover" : s.field, scene: n, endCard })));
      else if (sp) segs.push({ field: VO_SPEAKER.test(sp[1].trim()) ? "voiceover" : "dialogue", text: sp[2], scene: n, endCard });
      else segs.push({ field: "visual", text: line.replace(/^visual\s*:\s*/i, ""), scene: n, endCard });
    }
    return segs;
  }
  if (title) segs.push({ field: "visual", text: title, scene: n, endCard });
  if (visual) segs.push({ field: "visual", text: visual, scene: n, endCard });
  for (const s of speakerLines(audio)) segs.push({ ...s, scene: n, endCard });
  return segs;
}

/**
 * Accepts an Annex-A parsed script ({ setting, character1, character2, scenes: [string] }), a Simple Studio
 * package ({ setting, characters, hookHeadline, callToAction, scenes: [{ visual, dialogue }] }), or an array of
 * scene strings, and returns [{ field: dialogue|voiceover|visual, scene, text, endCard }].
 */
function extractSegments(script) {
  if (!script) return [];
  if (typeof script === "string") return segmentsOfAnnexScene(script, null);
  if (Array.isArray(script)) {
    return script.flatMap((sc, i) => (typeof sc === "string" ? segmentsOfAnnexScene(sc, i + 1) : extractSegments({ scenes: [sc] }).map((s) => ({ ...s, scene: i + 1 }))));
  }
  const segs = [];
  for (const k of ["setting", "character1", "character2"]) {
    if (typeof script[k] === "string" && script[k].trim()) segs.push({ field: "visual", text: script[k], scene: null, part: k });
  }
  if (script.characters && typeof script.characters === "object") {
    for (const v of Object.values(script.characters)) if (typeof v === "string" && v.trim()) segs.push({ field: "visual", text: v, scene: null, part: "character" });
  }
  for (const k of ["hookHeadline", "callToAction"]) {
    if (typeof script[k] === "string" && script[k].trim()) segs.push({ field: "dialogue", text: script[k], scene: null, part: k });
  }
  (script.scenes || []).forEach((sc, i) => {
    if (typeof sc === "string") { segs.push(...segmentsOfAnnexScene(sc, i + 1)); return; }
    if (!sc || typeof sc !== "object") return;
    const endCard = END_CARD.test(`${sc.beat || ""} ${sc.title || ""}`);
    for (const k of ["visual", "action", "title"]) if (typeof sc[k] === "string" && sc[k].trim()) segs.push({ field: "visual", text: sc[k], scene: i + 1, endCard });
    for (const k of ["dialogue", "audio", "voiceover"]) {
      if (typeof sc[k] === "string" && sc[k].trim()) {
        for (const s of speakerLines(sc[k])) segs.push({ ...s, field: k === "voiceover" ? "voiceover" : s.field, scene: i + 1, endCard });
      }
    }
  });
  return segs;
}

// ---------- scanning ----------

function entryKind(list) {
  return list === "claims_gated" ? "gated" : "auto_reject";
}

function allowedByOwner(entry, match, ctx) {
  const matchNorm = normText(match);
  if (entry.unless_in_form && containsTerm(ctx.formTextNorm, matchNorm)) return true;
  if (entry.unless_form_mentions && entry.unless_form_mentions.some((t) => containsTerm(ctx.formTextNorm, t))) return true;
  const hasReq = (entry.requires && entry.requires.length) || entry.requires_term_in;
  if (!hasReq) return false;
  const reqOk = (entry.requires || []).every((r) => requirementMet(r, ctx.proof));
  const termOk = !entry.requires_term_in || containsTerm(normText(ctx.proof[entry.requires_term_in] || ""), matchNorm);
  return reqOk && termOk;
}

function entryApplies(entry, ctx) {
  if (entry.when_proof) {
    for (const [k, v] of Object.entries(entry.when_proof)) if (!requirementMet(`${k}:${v}`, ctx.proof)) return false;
  }
  if (entry.requires_photos && ctx.hasPhotos) return false;
  return true;
}

function scanWithModules(modules, segments, ctx) {
  const violations = [];
  const alsoLoad = new Set();
  for (const m of modules) {
    for (const list of ["claims_gated", "auto_reject_words", "auto_reject_visuals"]) {
      for (const entry of m[list] || []) {
        if (!entryApplies(entry, ctx)) continue;
        const fields = list === "auto_reject_visuals" ? ["visual"] : ["dialogue", "voiceover", "visual"];
        const seen = new Set();
        for (const seg of segments) {
          if (!fields.includes(seg.field)) continue;
          if (entry.skip_end_card && seg.endCard) continue;
          const matches = allMatches(entry, normText(seg.text));
          if (!matches.length) continue;
          const match = matches.find((mt) => !allowedByOwner(entry, mt, ctx));
          if (entry.also_load_when_used && matches.some((mt) => allowedByOwner(entry, mt, ctx))) alsoLoad.add(entry.also_load_when_used);
          if (!match) continue;
          const key = `${seg.scene}|${seg.field}`;
          if (seen.has(key)) continue;
          seen.add(key);
          violations.push({
            id: entry.id,
            rule: entry.rule || null,
            module: m.id,
            moduleName: m.name,
            kind: entryKind(list),
            check: entry.check || (list === "claims_gated" ? "gated" : "auto_reject"),
            label: entry.label,
            field: seg.field,
            scene: seg.scene,
            match,
            requires: [...(entry.requires || []), ...(entry.requires_term_in ? [entry.requires_term_in] : [])],
            ownerCanUnlock: Boolean(entry.unless_in_form || (entry.requires && entry.requires.length) || entry.requires_term_in),
          });
        }
      }
    }
  }
  return { violations, alsoLoad };
}

function safetyGaps(modules, segments) {
  const visualAll = normText(segments.filter((s) => s.field === "visual").map((s) => s.text).join("\n"));
  const gaps = [];
  for (const m of modules) {
    for (const sv of m.safety_visuals || []) {
      const triggered = sv.when.some((t) => containsTerm(visualAll, t));
      if (triggered && !sv.require.some((t) => containsTerm(visualAll, t))) {
        gaps.push({ id: sv.id, module: m.id, moduleName: m.name, label: sv.label, check: "safety", kind: "safety", requireAny: sv.require });
      }
    }
  }
  return gaps;
}

/** Deterministic scan of dialogue, voiceover and visual fields against every loaded module. */
function scanScript(ctx, script) {
  if (!isComplianceContext(ctx)) return { violations: [], safety: [], extraModules: [], segments: [] };
  const rules = loadRules();
  const segments = extractSegments(script);
  const first = scanWithModules(ctx.modules, segments, ctx);
  let violations = first.violations;
  const extraModules = [];
  for (const id of first.alsoLoad) {
    const extra = rules.categories[id];
    if (!extra || ctx.modules.some((m) => m.id === id)) continue;
    extraModules.push(extra);
    violations = violations.concat(scanWithModules([extra], segments, ctx).violations);
  }
  const safety = safetyGaps([...ctx.modules, ...extraModules], segments);
  return { violations, safety, extraModules: extraModules.map((m) => ({ id: m.id, name: m.name, risk_tier: m.risk_tier })), segments };
}

function proofLabel(ctx, req) {
  const [id, option] = String(req).split(":");
  const f = ctx.proofFields.find((x) => x.id === id);
  if (!f) return req;
  const opt = option ? (f.options || []).find((o) => o.value === option) : null;
  return opt ? `${f.label}: ${opt.label}` : f.label;
}

function describeViolation(ctx, v) {
  const where = `${v.scene ? `Scene ${v.scene} ` : ""}${v.field}`;
  const fix = v.kind === "gated" || v.ownerCanUnlock
    ? (v.requires.length ? `Remove it unless the owner adds "${v.requires.map((r) => proofLabel(ctx, r)).join('" and "')}".` : "Remove it - the owner's form does not state it.")
    : "Remove it.";
  return `Compliance (${v.moduleName}${v.rule ? `, ${v.rule}` : ""}): ${v.label} - "${v.match}" in ${where}. ${fix}`;
}

/** Failure strings for the quality gate's repair loop (empty = compliant). */
function gateFailures(ctx, script) {
  if (!isComplianceContext(ctx)) return [];
  const { violations, safety } = scanScript(ctx, script);
  return [
    ...violations.map((v) => describeViolation(ctx, v)),
    ...safety.map((g) => `Compliance (${g.moduleName}): safety visual missing - ${g.label}. Write it into the Visual (e.g. ${g.requireAny.slice(0, 2).map((x) => `"${x}"`).join(" or ")}).`),
  ];
}

// ---------- human review ----------

function textHasAny(textNorm, terms) {
  return (terms || []).some((t) => containsTerm(textNorm, t));
}

function humanReviewFor(ctx, script, { extraModules = [], reviewer = null } = {}) {
  if (!isComplianceContext(ctx)) return { required: false, reasons: [] };
  const rules = loadRules();
  const segments = extractSegments(script);
  const scriptNorm = normText(segments.map((s) => s.text).join("\n"));
  const reasons = [];
  const mods = [ctx.category, ...extraModules.map((m) => rules.categories[m.id] || m)].filter(Boolean);
  let required = false;
  for (const m of mods) {
    const rule = m.human_review_rule || { when: "never" };
    const d = rule.detect || null;
    let detected = false;
    if (d) {
      detected = textHasAny(scriptNorm, d.terms) || (d.regex || []).some((src) => sourceRegex(src).test(scriptNorm));
      if (!detected && d.form_fields && d.form_fields.length) detected = textHasAny(ctx.formTextNorm, d.terms);
      if (!detected && (d.form_nonempty || []).includes("offer")) detected = Boolean(ctx.offer.trim());
    }
    if (rule.when === "always") {
      required = true;
      reasons.push(rule.reason || `${m.name} is a High-tier category.`);
      if (detected && rule.detect_label) reasons.push(`${rule.detect_label} (${m.name}: review "${rule.label}").`);
    } else if (rule.when === "if_detected" && detected) {
      required = true;
      reasons.push(`${rule.reason} (${m.name}: review "${rule.label}").`);
    }
  }
  if (extraModules.length) reasons.push(`Medical treatment mentioned: ${extraModules.map((m) => m.name).join(", ")} rules also applied.`);
  if (reviewer && reviewer.status === "reviewed" && reviewer.verdict === "fail") {
    required = true;
    reasons.push("The compliance reviewer pass found rule breaks.");
  }
  return {
    required,
    tier: ctx.riskTier,
    rule: ctx.category ? ctx.category.human_review_rule.label : null,
    reasons: [...new Set(reasons)],
    stage: "before_end_frame",
  };
}

// ---------- quality gate checklist (Section 8, added alongside Annex B) ----------

function runQualityChecklist(ctx, scan, review) {
  const rules = loadRules();
  const v = scan.violations || [];
  const gated = v.filter((x) => x.kind === "gated");
  const auto = v.filter((x) => x.kind === "auto_reject" && x.check !== "ai_weakness");
  const ai = v.filter((x) => x.check === "ai_weakness");
  const proofGated = v.filter((x) => x.requires && x.requires.length);
  const det = (list) => list.map((x) => `${x.label}: "${x.match}"${x.scene ? ` (Scene ${x.scene} ${x.field})` : ` (${x.field})`}`);
  const status = {
    module_loaded: ctx.category
      ? { status: gated.length ? "fail" : "pass", details: gated.length ? det(gated) : [`${ctx.category.name} module loaded (${ctx.mapping.status}).`] }
      : { status: "warn", details: [ctx.mapping.flag || "No category module mapped - universal rules only."] },
    no_auto_reject: { status: auto.length ? "fail" : "pass", details: det(auto) },
    gated_claims_proof: { status: proofGated.length ? "fail" : "pass", details: det(proofGated) },
    safety_visuals: { status: (scan.safety || []).length ? "fail" : "pass", details: (scan.safety || []).map((g) => g.label) },
    ai_weakness: { status: ai.length ? "fail" : "pass", details: det(ai) },
    mood_allowed: {
      status: "pass",
      details: [ctx.mood.id ? `Mood: ${ctx.mood.label}${ctx.mood.enforced ? ` (enforced; ${ctx.mood.reason})` : ""}.` : "No category mood rule."],
    },
    high_tier_review: review.required
      ? { status: "flag", details: [`Flagged for human review before the end frame: ${review.reasons.join(" ")}`] }
      : { status: "pass", details: ["Human review not required for this film."] },
  };
  return rules.quality_gate.checklist.map((item) => ({ ...item, ...status[item.id] }));
}

/** Full compliance report for a generated script (attached to API responses and shown to the owner). */
function buildComplianceReport(ctx, script, { reviewer = null, stage = "script" } = {}) {
  if (!isComplianceContext(ctx)) return null;
  const rules = loadRules();
  const scan = scanScript(ctx, script);
  // A package's opening hook repeats Scene 1's line: keep one finding per rule + words, preferring the scene's
  const sceneKeys = new Set(scan.violations.filter((v) => v.scene).map((v) => `${v.id}|${normText(v.match)}`));
  scan.violations = scan.violations.filter((v) => v.scene || !sceneKeys.has(`${v.id}|${normText(v.match)}`));
  const review = humanReviewFor(ctx, script, { extraModules: scan.extraModules, reviewer });
  const checklist = runQualityChecklist(ctx, scan, review);
  const reviewerRejects = reviewer && reviewer.status === "reviewed" ? (reviewer.violations || []).filter((x) => x.severity === "reject") : [];
  const passed = !scan.violations.length && !scan.safety.length && !reviewerRejects.length;
  const tableRow = rules.quality_gate.table.find((r) => r.category === ctx.categoryId) || null;
  return {
    stage,
    version: ctx.version,
    checkedAt: new Date().toISOString(),
    businessType: ctx.businessType,
    mapping: ctx.mapping,
    category: ctx.categoryId ? { id: ctx.categoryId, name: ctx.categoryName, riskTier: ctx.riskTier } : null,
    qualityGateRow: tableRow,
    mood: { id: ctx.mood.id, label: ctx.mood.label, enforced: ctx.mood.enforced, reason: ctx.mood.reason },
    passed,
    violations: scan.violations.map((x) => ({ ...x, message: describeViolation(ctx, x) })),
    safetyGaps: scan.safety,
    extraModules: scan.extraModules,
    reviewer: reviewer || null,
    humanReview: review,
    checklist,
    endFrameLines: ctx.endFrameLines,
  };
}

// ---------- idea stages (directions, hooks, plots, story) ----------

function stringLeaves(value, out = [], depth = 0) {
  if (depth > 6 || value == null) return out;
  if (typeof value === "string") { if (value.trim()) out.push(value); return out; }
  if (Array.isArray(value)) { value.forEach((v) => stringLeaves(v, out, depth + 1)); return out; }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) if (!/^(id|guardrailReport|compliance)$/.test(k)) stringLeaves(v, out, depth + 1);
  }
  return out;
}

/** Scan an idea (any JSON) as both spoken and visual text; returns de-duplicated violations. */
function scanIdea(ctx, value) {
  if (!isComplianceContext(ctx)) return [];
  const texts = stringLeaves(value);
  const segments = texts.flatMap((t) => [{ field: "dialogue", text: t, scene: null }, { field: "visual", text: t, scene: null }]);
  const { violations } = scanWithModules(ctx.modules, segments, ctx);
  const seen = new Set();
  return violations.filter((v) => { const k = `${v.id}|${normText(v.match)}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .map((v) => ({ id: v.id, rule: v.rule, label: v.label, match: v.match, module: v.moduleName, message: describeViolation(ctx, { ...v, field: "idea", scene: null }) }));
}

/** Adds `compliance: { violations }` to each idea object (arrays) or to the result object. */
function annotateIdeas(ctx, result) {
  if (!isComplianceContext(ctx) || !result) return result;
  const tag = (item) => (item && typeof item === "object" && !Array.isArray(item) ? { ...item, compliance: { categoryId: ctx.categoryId, violations: scanIdea(ctx, item) } } : item);
  return Array.isArray(result) ? result.map(tag) : tag(result);
}

/** Public description of the module for the brief form (no regexes). */
function describeForClient(ctx) {
  const rules = loadRules();
  const c = ctx.category;
  const fieldOut = (f) => ({ id: f.id, label: f.label, kind: f.kind, options: f.options || null, placeholder: f.placeholder || null, unlocks: f.unlocks || null, required: Boolean(f.required), module: f.module });
  return {
    version: ctx.version,
    source: ctx.source,
    businessType: ctx.businessType,
    mapping: ctx.mapping,
    category: c ? { id: c.id, name: c.name, riskTier: c.risk_tier, humanReview: c.human_review_rule.label, defaultMood: rules.moods[c.default_mood].label } : null,
    scopeOptions: ctx.mapping.scopeChoice ? ctx.mapping.scopeChoice.map((id) => ({ id, name: rules.categories[id].name })) : null,
    categoryOptions: Object.values(rules.categories).map((m) => ({ id: m.id, name: m.name })),
    proofFields: ctx.proofFields.map(fieldOut),
    mood: ctx.mood,
    blockers: ctx.blockers,
  };
}

module.exports = {
  RULES_FILE,
  loadRules,
  normText,
  resolveCategory,
  resolveMood,
  buildComplianceContext,
  isComplianceContext,
  assertCanGenerate,
  formatPromptBlock,
  formatRenderBlock,
  extractSegments,
  scanScript,
  gateFailures,
  humanReviewFor,
  runQualityChecklist,
  buildComplianceReport,
  describeForClient,
  describeViolation,
  scanIdea,
  annotateIdeas,
};
