/**
 * engine/spines/creativeSpine.js — Creative Spine adapter (spine 2).
 * Owns /api/creative/directions (Checkpoint 2 – Insight), /plots (Section 4 – Framing),
 * /hooks (Checkpoint 3 – Angles, each with 2 hooks) and /story (Checkpoint 4 – Story & format → concept.json).
 *
 * Reads brief.json and nothing else (plus its own earlier checkpoint picks). The rules come from
 * engine/spines/creative.md; this file maps the stages onto the app's screens and enforces the contract.
 * The film format is not scored here: it is the user's Creative Style, carried in brief.json's binding
 * "Film format" rule, and it changes what every stage writes.
 */

const { callClaude } = require('../claude');
const { parseJSONBlock } = require('../parse');
const { loadSpine } = require('./index');
const contracts = require('./contracts');
const HOOKS = require('../hooks.json');

// C-M4: hooks come only from the two fixed libraries (Section 3), with Annex 1 (in creative.md) as the fallback.
const HOOK_LIBRARIES = ['TrueFan AI', 'GoFaceless'];
function hookLibraryText() {
  const lines = [`HOOK LIBRARY (cached pull of the fixed library pages, pulled ${HOOKS.pulled}). Patterns only — never copy a line (C-M7).`];
  for (const lib of HOOKS.libraries.filter((l) => HOOK_LIBRARIES.includes(l.id))) {
    lines.push(`Library: ${lib.id}`);
    for (const p of lib.patterns.filter((x) => x.usable)) lines.push(`- ${p.category ? `[${p.category}] ` : ''}${p.name}: ${p.structure}${p.rule ? ` RULE: ${p.rule}` : ''}`);
  }
  lines.push('Fallback: Annex 1 – Starter hook patterns (in the spine).');
  return lines.join('\n');
}

function formatBlock(format) {
  const r = contracts.FORMAT_RULES[format];
  return `FILM FORMAT (fixed by the user's Creative Style; brief.json "Film format" rule): ${format}.
What it looks like: ${r.looks_like}
Rules for AI generation (Section 6): ${r.generation}
Do not score or change the format (C-M8: the format is chosen first — here, by the user).`;
}

// One retry when the answer can't be read; no canned fallback ideas (C-M2: every idea traces back to the brief).
async function runStage({ stage, instruction, input, call, maxTokens = 5000, isUsable = (p) => Boolean(p && typeof p === 'object' && Object.keys(p).length) }) {
  const spine = loadSpine('creative');
  const req = {
    system: `${spine.text}\n\n=== RUN NOW (CleverCut app) — ${stage} ===\n${instruction}`,
    content: Object.entries(input).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n\n'),
    maxTokens,
    thinking: false,
  };
  let parsed = null;
  for (let attempt = 0; attempt < 2 && !isUsable(parsed); attempt++) {
    try { parsed = parseJSONBlock(await call(req)); } catch (e) {
      if (e.configMissing) throw e;
      parsed = null;
    }
  }
  return { parsed, version: spine.version };
}

// 'correction': the app's Creative Guardrails check (Do's and Don'ts from brief.json) asking for one repair pass
const ALLOWED = ['brief', 'insight', 'framings', 'angle', 'angles', 'locked', 'correction'];
const withCorrection = (input, correction) => (correction ? { ...input, 'GUARDRAIL CORRECTION (brief.dos_donts were broken; fix and answer again)': correction } : input);

// ---------- Two characters (the app's production rule, not in the spine document) ----------
const TWO_CHARACTERS_BLOCK = `TWO CHARACTERS (the app's production rule): ${contracts.TWO_CHARACTERS_RULE} Build every idea around exactly two people and name them in "cast" (role and a few words each).${'' /* the video flows have two character inputs */}`;
const castOf = (x) => (Array.isArray(x && x.cast) ? x.cast.map((c) => String(c || '').trim()).filter(Boolean) : []);
/** Why an angle or concept breaks the two-character rule ([] when it doesn't). */
function twoCharacterProblems(label, cast, texts) {
  if (cast.length !== 2) return [`${label} names ${cast.length} ${cast.length === 1 ? 'person' : 'people'} in "cast" — it must be exactly two.`];
  const extra = contracts.extraPeople(texts.filter(Boolean).join('. '), cast, { individualsOnly: true });
  return extra.length ? [`${label} features a third person (${extra.join(', ')}) — rebuild it around the two in "cast".`] : [];
}
const angleTexts = (a) => [a.plot, ...((a.hooks || []).flatMap((h) => [h && h.visual, h && h.payoff]))];

// ---------- Checkpoint 2 – Insight (Section 1) ----------

async function runInsight(input = {}, { call = callClaude } = {}) {
  contracts.assertHandoff('Creative Spine (insight)', input, ALLOWED);
  const { brief, locked = false, correction = null } = input;
  const b = contracts.briefForCreative(brief);
  const format = contracts.filmFormatFromBrief(b);
  const { parsed, version } = await runStage({
    stage: 'Checkpoint 2 – Insight',
    call,
    instruction: `Read BRIEF (brief.json; C-M13: never the raw user text). Pick the insight lens (Section 1 scoring), run Prompt A (lens scan), Prompt C (human truth) and Prompt D (tension pick).
${formatBlock(format)}
The app shows Checkpoint 2 itself. Return only JSON between @@JSON@@ and @@END@@:
{"lens": "#, name", "lens_scan": {"list_1_name": "", "list_1": [], "list_2_name": "", "list_2": []},
 "tensions": [{"tension": "", "everyday_example": "", "human_truth": "", "fear": "", "desire": "", "confidence": "High|Med|Low"}]}
"tensions" is the top 3, highest first (the first is recommended). Never show raw scores.`,
    input: withCorrection({ BRIEF: b }, correction),
  });
  const p = parsed || {};
  const tensions = (Array.isArray(p.tensions) ? p.tensions : []).slice(0, 3).filter((t) => t && t.tension);
  if (!tensions.length) throw new Error('The Creative Spine returned no customer tensions.');
  return {
    spineVersion: version,
    lens: String(p.lens || ''),
    lens_scan: p.lens_scan || null,
    tensions: tensions.map((t, i) => ({
      id: `tension_${i + 1}`,
      recommended: i === 0,
      confidence: t.confidence || '',
      everyday_example: String(t.everyday_example || ''),
      insight: contracts.conform(contracts.CONCEPT_TEMPLATE.insight, { lens: p.lens, tension: t.tension, fear: t.fear, desire: t.desire, human_truth: t.human_truth, locked }),
    })),
  };
}

/** Cards for the Ideas screen (title / description / recommended). */
function insightCards(result) {
  return result.tensions.map((t) => ({
    id: t.id,
    title: t.insight.tension,
    description: [t.everyday_example, t.insight.human_truth && `Human truth: ${t.insight.human_truth}`].filter(Boolean).join(' — '),
    angle: result.lens,
    recommended: t.recommended,
    confidence: t.confidence,
    lens: result.lens,
    insight: t.insight,
    spine: 'creative', checkpoint: 2,
  }));
}

// ---------- Section 4 – Framing ----------

async function runFraming(input = {}, { call = callClaude } = {}) {
  contracts.assertHandoff('Creative Spine (framing)', input, ALLOWED);
  const { brief, insight } = input;
  const b = contracts.briefForCreative(brief);
  const ins = contracts.conform(contracts.CONCEPT_TEMPLATE.insight, insight);
  const { parsed, version } = await runStage({
    stage: 'Section 4 – Framing',
    call,
    instruction: `Run Section 4 (Framing) for INSIGHT, using BRIEF only. Return only JSON between @@JSON@@ and @@END@@:
{"framings": [{"framing": "two lines", "why": "one line"}]} — the top 2 of the 3 you write, best first.`,
    input: { BRIEF: b, INSIGHT: ins },
    maxTokens: 2000,
  });
  const framings = (parsed && Array.isArray(parsed.framings) ? parsed.framings : []).slice(0, 2).filter((x) => x && x.framing);
  if (!framings.length) throw new Error('The Creative Spine returned no framings.');
  return { spineVersion: version, framings: framings.map((x) => ({ framing: String(x.framing), why: String(x.why || '') })) };
}

function framingCards(result) {
  return result.framings.map((f, i) => ({ id: `framing_${i + 1}`, title: f.framing.split('\n')[0], description: f.framing, coreIdea: f.framing, recommended: i === 0, framing: f.framing, why: f.why, spine: 'creative', section: 4 }));
}

// ---------- Checkpoint 3 – Angles (Sections 2, 3, 5, 8, 9, 10) ----------

async function runAngles(input = {}, { call = callClaude } = {}) {
  contracts.assertHandoff('Creative Spine (angles)', input, ALLOWED);
  const { brief, insight, framings = null, correction = null } = input;
  const b = contracts.briefForCreative(brief);
  const format = contracts.filmFormatFromBrief(b);
  const ins = contracts.conform(contracts.CONCEPT_TEMPLATE.insight, insight);
  const ask = (twoCharacterCorrection) => runStage({
    stage: 'Checkpoint 3 – Angles',
    call,
    maxTokens: 7000,
    instruction: `Using INSIGHT, FRAMINGS, the routes (Section 2) and the HOOK LIBRARY (Section 3), run Section 5 and write 5–10 angles for BRIEF.
${formatBlock(format)}
${TWO_CHARACTERS_BLOCK} Never propose a plot with a third person.
Every angle uses this format. Run Prompt B (cliché check), C-M11 safety, C-M14 Do's and Don'ts, C-M15 occasion, then score with Section 8.
Hooks are written in brief.language and its script. Record the pattern, the library and the date pulled.
Return only JSON between @@JSON@@ and @@END@@:
{"angles": [{"id": "a1", "name": "", "route": "", "cast": ["", ""], "plot": "one line that opens with a hook pattern and closes on its payoff",
  "hooks": [{"pattern": "", "library": "", "pulled": "YYYY-MM-DD", "line": "", "visual": "", "super": "", "payoff": ""}, {"pattern": "", "library": "", "pulled": "", "line": "", "visual": "", "super": "", "payoff": ""}],
  "format": "${format}", "mood": "", "rationale": "one line linking it to the primary KPI", "score": 0.0, "confidence": "High|Med|Low"}]}
Best first. Never show raw scores to the user (the app shows the confidence label only).`,
    input: withCorrection({
      BRIEF: b, INSIGHT: ins, FRAMINGS: framings || 'none — write the framings internally (Section 4) first', 'HOOK LIBRARY': hookLibraryText(),
      ...(twoCharacterCorrection ? { 'TWO-CHARACTER CORRECTION (these angles broke the rule; answer again with every angle built around two people)': twoCharacterCorrection } : {}),
    }, correction),
  });
  const keep = (parsed) => {
    const list = (parsed && Array.isArray(parsed.angles) ? parsed.angles : []).filter((a) => a && a.name).slice(0, 10);
    const problems = [];
    const ok = list.filter((a) => { const p = twoCharacterProblems(`Angle "${a.name}"`, castOf(a), angleTexts(a)); problems.push(...p); return !p.length; });
    return { list, ok, problems };
  };
  let { parsed, version } = await ask(null);
  let got = keep(parsed);
  if (got.problems.length) console.log('[creative spine] angles dropped for the two-character rule:', got.problems);
  // A three-person plot is never proposed: those angles are dropped. The stage is asked again (another full,
  // ~75s call) only when fewer than three good angles are left to choose from.
  if (got.problems.length && got.ok.length < 3) {
    const again = keep((await ask(got.problems)).parsed);
    if (again.problems.length) console.log('[creative spine] angles dropped on the second ask:', again.problems);
    if (again.ok.length > got.ok.length) got = again;
  }
  if (!got.list.length) throw new Error('The Creative Spine returned no angles.');
  if (!got.ok.length) throw Object.assign(new Error('Every angle had more than two people in it. Try again, or change the idea so it plays out between two people.'), { status: 422, code: 'TWO_CHARACTERS' });
  const angles = got.ok.map((a, i) => ({
    ...contracts.conform(contracts.CONCEPT_TEMPLATE.angles[0], { ...a, id: a.id || `a${i + 1}` }),
    format,
    cast: castOf(a),
    mood: String(a.mood || ''),
    rationale: String(a.rationale || ''),
  }));
  return { spineVersion: version, format, insight: ins, angles };
}

/** Cards for the Opening screen (archetype / hookLine / visualAction): one card per angle, its first hook. */
function angleCards(result) {
  return result.angles.map((a, i) => {
    const h = a.hooks[0] || {};
    return {
      id: a.id,
      archetype: `${a.name}${h.pattern ? ` · ${h.pattern}` : ''}`,
      type: a.route,
      hookLine: h.line || a.plot,
      text: h.line || a.plot,
      visualAction: [h.visual, h.payoff && `Ending: ${h.payoff}`].filter(Boolean).join(' — '),
      recommended: i === 0,
      confidence: a.confidence,
      angle: a,
      insight: result.insight,
      format: result.format,
      spine: 'creative', checkpoint: 3,
    };
  });
}

// ---------- Checkpoint 4 – Story & format → concept.json (Sections 6, 7, 9, 10, 12) ----------

async function runConcept(input = {}, { call = callClaude, ideaSource = 'engine' } = {}) {
  contracts.assertHandoff('Creative Spine (concept)', input, ALLOWED);
  const { brief, insight, angle, angles = [] } = input;
  const b = contracts.briefForCreative(brief);
  const format = contracts.filmFormatFromBrief(b);
  const ins = contracts.conform(contracts.CONCEPT_TEMPLATE.insight, insight);
  const chosen = contracts.conform(contracts.CONCEPT_TEMPLATE.angles[0], angle);
  if (!chosen.name && !chosen.hooks.length) throw new Error('Pick an angle first.');
  const angleCast = castOf(angle);
  const ask = (twoCharacterCorrection) => runStage({
    stage: 'Checkpoint 4 – Story & format',
    call,
    instruction: `Build the concept for CHOSEN_ANGLE (Sections 7, 9 and 10) from BRIEF and INSIGHT.
${formatBlock(format)}
${TWO_CHARACTERS_BLOCK}${angleCast.length === 2 ? ' Keep the two people in CHOSEN_ANGLE_CAST.' : ''} The core idea, beats and ending play out between them only.
Lock the ending to the hook (Section 10). Use the length in brief.formats.lengths_s for the beats (Section 7).
Check brief.dos_donts (C-M14) and record the result in dos_donts_check; record how any occasion is used (occasion_use).
Return exactly concept.json (Section 12) between @@JSON@@ and @@END@@, with concept.format "${format}", plus one more top-level key "cast": ["", ""] (the app reads it to check the two-character rule).`,
    input: {
      BRIEF: b, INSIGHT: ins, CHOSEN_ANGLE: chosen,
      ...(angleCast.length === 2 ? { CHOSEN_ANGLE_CAST: angleCast } : {}),
      ...(twoCharacterCorrection ? { 'TWO-CHARACTER CORRECTION (answer again with the story built around two people)': twoCharacterCorrection } : {}),
    },
  });
  const conceptProblems = (p) => {
    const c = (p && p.concept) || {};
    return twoCharacterProblems('The concept', castOf(p), [c.core_idea, ...(Array.isArray(c.beats) ? c.beats : []), c.ending_payoff, c.hook && c.hook.visual]);
  };
  let { parsed, version } = await ask(null);
  let problems = conceptProblems(parsed);
  if (problems.length) {
    console.log('[creative spine] concept asked again for the two-character rule:', problems);
    const again = await ask(problems);
    parsed = again.parsed;
    version = again.version;
    problems = conceptProblems(parsed);
  }
  if (problems.length) throw Object.assign(new Error(`The story couldn't be kept to two characters: ${problems.join(' ')} Go back and pick another opening.`), { status: 422, code: 'TWO_CHARACTERS' });
  const raw = parsed || {};
  const concept = contracts.normalizeConcept({
    ...raw,
    brief_id: contracts.contractId(b),
    insight: ins,
    angles: (Array.isArray(angles) && angles.length ? angles : [chosen]),
    chosen_angle_id: chosen.id || 'a1',
    idea_source: ideaSource,
    concept: { ...(raw.concept || {}), format, hook: (raw.concept && raw.concept.hook && Object.keys(raw.concept.hook).length) ? raw.concept.hook : (chosen.hooks[0] || {}) },
  });
  if (!concept.concept.beats.length) throw new Error('The Creative Spine returned a concept without beats.');
  return { spineVersion: version, concept };
}

/** /story response: concept.json plus the few fields the studio already reads. */
function storyResponse(result, creativeStyle) {
  const c = result.concept.concept;
  return {
    concept: result.concept,
    format: creativeStyle,
    filmFormat: c.format,
    core_idea: c.core_idea,
    coreIdea: c.core_idea,
    beats: c.beats,
    mood: c.mood,
    ending: c.ending_payoff,
    setting: c.visual_world.setting,
    visualWorld: c.visual_world,
    spine: 'creative', checkpoint: 4, spineVersion: result.spineVersion,
  };
}

module.exports = { runInsight, insightCards, runFraming, framingCards, runAngles, angleCards, runConcept, storyResponse, hookLibraryText, HOOK_LIBRARIES };
