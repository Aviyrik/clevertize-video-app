/**
 * engine/spines/scriptSpine.js — Script & Storyboard Spine adapter (spine 3).
 * Owns /api/creative/synthesize-script, /api/creative/rewrite-scene, /api/script/validate-and-import and the
 * quality gate (engine/gate.js runScriptGate, Annex B).
 *
 * Reads concept.json and the brief.json fields its rules name (contracts.briefForScript). Writes script.json
 * (+ storyboard.json, planned — see storyboard.js) and the script record. The header is built from
 * concept.json/brief.json, the scenes are rendered in the Section 3 scene format from script.json, and the
 * production inputs the app already uses (scenes, character1, character2, setting) are derived from it —
 * production itself is unchanged.
 */

const { callClaude } = require('../claude');
const { parseJSONBlock } = require('../parse');
const { runScriptGate, SCRIPT_BEATS } = require('../gate');
const { loadSpine } = require('./index');
const contracts = require('./contracts');
const storyboard = require('./storyboard');

const MAX_PASSES = 3; // Section 5: after 3 failed passes, go back to the Creative Spine's second-ranked angle

// Section 1 beat structure; S-M3 scene counts (15s compresses beats 2 and 3; 30s groups 6 scenes into the 4 beats)
const BEATS_BY_COUNT = {
  3: ['Hook', 'Turn', 'Payoff'],
  4: ['Hook', 'Real moment', 'Turn', 'Payoff'],
  6: ['Hook', 'Real moment', 'Real moment', 'Turn', 'Turn', 'Payoff'],
};

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const text = (v) => (v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v));

function describe(obj, keys) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  const entries = keys ? keys.map((k) => [k, obj[k]]) : Object.entries(obj);
  return entries.filter(([k, v]) => k !== 'ref' && k !== 'id' && v && typeof v !== 'object').map(([, v]) => String(v)).join(', ');
}
const CHARACTER_KEYS = ['name', 'role', 'age', 'gender', 'skin_tone', 'hair', 'build', 'wardrobe', 'accessories'];
function characterLine(c) {
  if (!c) return '';
  if (typeof c === 'string') return c;
  const ref = c.ref || c.id;
  return `${describe(c, CHARACTER_KEYS)}${ref ? ` [ref: ${ref}]` : ''}`;
}

/** Section 2 script header, from concept.json and the brief fields (never written by the model). */
function buildHeader({ concept, brief }) {
  const c = concept.concept || {};
  const angle = (concept.angles || []).find((a) => a.id === concept.chosen_angle_id) || (concept.angles || [])[0] || {};
  const hook = (c.hook && Object.keys(c.hook).length ? c.hook : (angle.hooks || [])[0]) || {};
  const kpi = (brief.kpis || []).find((k) => k.primary) || (brief.kpis || [])[0] || {};
  const len = (brief.formats.lengths_s || [])[0] || 20;
  return {
    brand: [brief.company.brand, brief.company.category, brief.company.product].filter(Boolean).join(' – '),
    objective: [brief.objective.stage, [kpi.name, kpi.target].filter(Boolean).join(' ')].filter(Boolean).join(' – '),
    platform_format: `${(brief.platforms || []).join(', ')} · ${(brief.formats.aspect_ratios || []).join(', ')} · ${len}s`,
    film_format: c.format,
    angle: angle.name ? `${angle.name} – route ${angle.route || ''}`.trim() : '',
    lens: (concept.insight && concept.insight.lens) || '',
    hook: hook.pattern ? `${hook.pattern} – ${hook.library || ''}${hook.pulled ? `, pulled ${hook.pulled}` : ''}` : '',
    ending: c.ending_payoff || '',
    mood: c.mood || '',
    moment: (concept.occasion_use && concept.occasion_use.event) || 'everyday',
    language: `${brief.language.name}, ${brief.language.script}`,
  };
}

function headerText(h) {
  return [
    `Brand: ${h.brand}`,
    `Objective: ${h.objective}`,
    `Platform / format: ${h.platform_format}`,
    `Film format: ${h.film_format}`,
    `Angle: ${h.angle}`,
    `Lens: ${h.lens}`,
    `Hook: ${h.hook}`,
    `Ending: ${h.ending}`,
    `Mood: ${h.mood}`,
    `Moment: ${h.moment}`,
    `Language: ${h.language}`,
  ].join('\n');
}

function contextBlockText(cb) {
  return [
    'Context Block',
    `Characters: ${(cb.characters || []).map(characterLine).join(' | ')}`,
    `Product: ${describe(cb.product)}${cb.product && cb.product.ref ? ` [ref: ${cb.product.ref}]` : ''}`,
    `Setting: ${describe(cb.setting)}`,
    `Brand elements (rendered by Production): ${describe(cb.brand_elements)}`,
  ].join('\n');
}

/** One scene in the Section 3 scene format. */
function renderScene(sc) {
  const end = sc.start_s + sc.duration_s;
  const lines = (sc.dialogue || []).filter((d) => d.line).map((d) => `${d.speaker}: "${d.line}"`);
  if (sc.vo) lines.push(`VO: "${sc.vo}"`);
  return [
    `SCENE ${sc.n} – ${String(sc.beat).toUpperCase()} – ${mmss(sc.start_s)}–${mmss(end)}`,
    '',
    'Visual:',
    sc.visual,
    '',
    `Shot: ${sc.shot} · Camera: ${sc.camera}`,
    '',
    'On-screen elements (rendered by Production, never generated):',
    `• Super: ${sc.super || 'none'}`,
    `• Callout: ${sc.callout || 'none'}`,
    `• CTA: ${sc.cta || 'none'}`,
    `• Disclaimer: ${sc.disclaimer || 'none'}`,
    `• UI mock-up: ${sc.ui_mockup || 'none'}`,
    `• Logo: ${sc.logo || 'none'}`,
    '',
    'Audio / Dialogue / Voiceover:',
    lines.length ? lines.join('\n') : 'None',
    '',
    'Sound Design:',
    `Ambience: ${sc.ambience} SFX: ${sc.sfx} Music mood note: ${sc.music_mood}`,
    '',
    `Transition out: ${sc.transition_out}`,
    '',
    'Editing Notes (edit step only):',
    sc.edit_notes || '',
  ].join('\n');
}

/** What production already takes: scene texts, two character slots and a setting line. */
function productionFields(script) {
  const chars = (script.context_block.characters || []).map(characterLine).filter(Boolean);
  return {
    scenes: script.scenes.map(renderScene),
    character1: chars[0] || '',
    // The render flows have exactly two character inputs. Characters 2+ share the second slot (see notices).
    character2: chars.slice(1).join(' | '),
    setting: describe(script.context_block.setting),
  };
}

function scriptNotices(script) {
  const notices = [];
  const n = (script.context_block.characters || []).length;
  if (n > 2) {
    notices.push({
      code: 'EXTRA_CHARACTERS',
      message: `This script has ${n} characters, but the video engine has only two character slots. Characters 2–${n} are sent together in the second slot, so they may not look consistent from scene to scene.`,
    });
  }
  if (script.format === 'VO-led') {
    notices.push({
      code: 'VO_NOT_VOICED',
      message: 'VO-led: the voiceover is written into the script, but the app has no voice-over or edit step yet. The video is rendered from the visuals; the narration is not recorded or laid over it, so add it in your editor (or a voice-over tool) before you publish.',
    });
  }
  return notices;
}

/** Force the deterministic parts of script.json (scene numbers, beats, timing, format, language, length). */
function shapeScript(raw, { concept, brief, format, plan }) {
  const s = contracts.normalizeScript(raw);
  s.concept_id = contracts.contractId(concept);
  s.format = format;
  s.length_s = plan.length_s;
  s.language = { ...brief.language };
  s.aspect_ratios = [...(brief.formats.aspect_ratios || ['9:16'])];
  const beats = BEATS_BY_COUNT[plan.count];
  s.scenes = s.scenes.map((sc, i) => ({
    ...sc,
    n: i + 1,
    beat: beats[i] || sc.beat,
    start_s: Math.round(i * plan.each * 10) / 10,
    duration_s: Math.round(plan.each * 10) / 10,
    dialogue: format === 'VO-led' ? sc.dialogue : sc.dialogue.filter((d) => d.line),
    vo: format === 'VO-led' ? sc.vo : sc.vo,
  }));
  return s;
}

function runInstruction({ format, plan, brief, mode }) {
  const r = contracts.FORMAT_RULES[format];
  const beats = BEATS_BY_COUNT[plan.count];
  const vo = contracts.voWordRange(plan.length_s);
  const productRef = (brief.mandatories.product_images || [])[0] || (brief.company.product_images || [])[0] || 'none';
  return `=== RUN NOW (CleverCut app) — ${mode} ===
FILM FORMAT: ${format} (the user's Creative Style). Section 6 rules: ${r.generation}
Dialogue (S-M7): ${r.dialogue}${r.hasVo ? ` Total VO across all scenes: ${vo.min}–${vo.max} words. Leave "dialogue" empty in every scene.` : ' Leave "vo" empty.'}
Length ${plan.length_s}s → exactly ${plan.count} scenes (S-M3), beats in order: ${beats.join(', ')} (Section 1).
Language: ${brief.language.name}, script ${brief.language.script} (S-M2). Visual fields in English.
Context Block: every character has "ref" (char_1, char_2, …); the product "ref" is "${productRef}".
Fill every on-screen element with its text or "none". Each "must include" from BRIEF.dos_donts that applies to the script is placed in a scene and noted in that scene's edit_notes as "Must include: <rule>" (S-M13).
Run the Annex B checklist yourself before answering (S-M11).
Return only JSON between @@JSON@@ and @@END@@:
{"context_block": {"characters": [{"ref": "char_1", "name": "", "role": "", "age": "", "gender": "", "skin_tone": "", "hair": "", "build": "", "wardrobe": "", "accessories": ""}],
  "product": {"ref": "", "sku": "", "colour": "", "packaging": "", "size_in_hand": "", "label_side": "", "how_used": ""},
  "setting": {"location": "", "time_of_day": "", "light_source": "", "surfaces": "", "background_activity": "", "brand_colour_cues": ""},
  "brand_elements": {"logo_placement": "", "supers": "", "callouts": "", "cta": "", "disclaimers": "", "captions": "on|off"}},
 "scenes": [{"visual": "", "shot": "wide|medium|close-up|macro", "camera": "static|slow push-in|gentle pan|handheld drift|orbit",
   "dialogue": [{"speaker": "", "line": ""}], "vo": "",
   "super": "", "callout": "", "cta": "", "disclaimer": "", "ui_mockup": "", "logo": "corner bug|none",
   "ambience": "", "sfx": "", "music_mood": "", "transition_out": "", "edit_notes": ""}]}`;
}

async function callScript({ call, instruction, input, maxTokens = 7000 }) {
  const spine = loadSpine('script');
  const raw = await call({
    system: `${spine.text}\n\n${instruction}`,
    content: Object.entries(input).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n\n'),
    maxTokens,
    thinking: false,
  });
  let parsed = {};
  try { parsed = parseJSONBlock(raw) || {}; } catch (_) { parsed = {}; } // an unreadable answer fails the gate and is repaired
  return { parsed, version: spine.version };
}

function finish({ script, header, concept, brief, gate, spineVersion }) {
  const plannedBoard = storyboard.planStoryboard(script, { aspectRatio: script.aspect_ratios[0], palette: concept.concept.visual_world.palette });
  const angle = (concept.angles || []).find((a) => a.id === concept.chosen_angle_id) || (concept.angles || [])[0] || {};
  const hook = (angle.hooks || [])[0] || {};
  const kpi = (brief.kpis || []).find((k) => k.primary) || (brief.kpis || [])[0] || {};
  const record = contracts.normalizeScriptRecord({
    brand: brief.company.brand, category: brief.company.category, date: new Date().toISOString().slice(0, 10),
    objective: brief.objective.stage, primary_kpi: kpi.name, lens: concept.insight.lens, tension: concept.insight.tension,
    angle_route: angle.route, format: script.format, hook_pattern: hook.pattern, hook_library: hook.library,
    ending_payoff: concept.concept.ending_payoff, mood: concept.concept.mood, moment: header.moment,
    language: brief.language.name, scenes: script.scenes.length,
  });
  const prod = productionFields(script);
  return {
    spine: 'script', spineVersion,
    header, script, storyboard: plannedBoard,
    storyboardStatus: storyboard.hasImageProvider() ? 'pending' : 'not_run',
    gate, record, notices: scriptNotices(script),
    text: [headerText(header), contextBlockText(script.context_block), ...prod.scenes].join('\n\n'),
    ...prod,
  };
}

/** Writes script.json for concept.json, runs the gate and repairs (up to 3 passes). */
async function writeScript(input = {}, { call = callClaude } = {}) {
  contracts.assertHandoff('Script & Storyboard Spine', input, ['concept', 'brief']);
  const { concept, brief } = input;
  const c = contracts.normalizeConcept(concept);
  const b = contracts.briefForScript(brief);
  const format = ['UGC', 'VO-led', 'Storytelling'].includes(c.concept.format) ? c.concept.format : contracts.filmFormatFromBrief(b);
  c.concept.format = format;
  const plan = contracts.scenePlan((b.formats.lengths_s || [])[0]);
  const header = buildHeader({ concept: c, brief: b });
  // The header comes from concept.json and brief.json, not from the writer: if it's incomplete, no rewrite can fix it.
  const missingHeader = ['brand', 'objective', 'film_format', 'angle', 'lens', 'hook', 'ending', 'mood', 'language'].filter((k) => !String(header[k] || '').trim());
  if (missingHeader.length) {
    const err = new Error(`The approved story is missing ${missingHeader.join(', ')} for the script header. Go back to the angles and continue again to rebuild the story.`);
    err.status = 409;
    err.code = 'CONCEPT_INCOMPLETE';
    throw err;
  }
  let previous = null;
  let gate = null;
  let script = null;
  let spineVersion = '';
  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    const input = { CONCEPT: c, BRIEF: b, SCRIPT_HEADER: headerText(header) };
    if (previous) Object.assign(input, { 'PREVIOUS SCRIPT JSON': previous, 'QUALITY GATE FAILURES (rewrite only the parts that fail, return the full JSON)': gate.failures });
    const { parsed, version } = await callScript({ call, instruction: runInstruction({ format, plan, brief: b, mode: pass === 1 ? 'write the script' : `repair pass ${pass}` }), input });
    spineVersion = version;
    script = shapeScript(parsed, { concept: c, brief: b, format, plan });
    gate = runScriptGate(script, { header, brief: b, concept: c, storyboardStatus: storyboard.hasImageProvider() ? 'pending' : 'not_run' });
    gate.passes = pass;
    console.log(`[script spine] pass #${pass}: ${gate.passed ? 'passed' : `${gate.failures.length} failing checks`}`);
    if (!gate.passed && process.env.SPINE_DEBUG) console.log('[script spine] failures:', gate.failures);
    if (gate.passed) break;
    previous = { context_block: script.context_block, scenes: script.scenes };
  }
  if (!gate.passed) {
    const err = new Error('The script could not pass the quality gate after 3 passes. Go back and pick the next angle, and the script will be rebuilt from it.');
    err.status = 422;
    err.code = 'SCRIPT_GATE_FAILED';
    err.failures = gate.failures;
    err.gate = gate;
    throw err;
  }
  return finish({ script, header, concept: c, brief: b, gate, spineVersion });
}

/** S-M12: revise only the one scene, re-run the gate on it, keep everything else. Reads script.json. */
async function rewriteScene(input = {}, { call = callClaude } = {}) {
  contracts.assertHandoff('Script & Storyboard Spine (scene edit)', input, ['script', 'header', 'brief', 'sceneIndex', 'instruction']);
  const { script, header, brief, sceneIndex, instruction } = input;
  const s = contracts.normalizeScript(script);
  const b = contracts.briefForScript(brief || {});
  if (!s.language.script) s.language = b.language;
  const idx = Number(sceneIndex) || 0;
  const target = s.scenes[idx];
  if (!target) throw Object.assign(new Error('That scene does not exist.'), { status: 400 });
  const plan = contracts.scenePlan(s.length_s);
  let gate = null;
  let failuresForScene = [];
  for (let pass = 1; pass <= 2; pass++) {
    const input = { 'SCRIPT JSON': s, BRIEF: b, SCENE_NUMBER: target.n, "USER'S CHANGE": instruction };
    if (failuresForScene.length) input['QUALITY GATE FAILURES FOR THIS SCENE'] = failuresForScene;
    const { parsed } = await callScript({
      call,
      maxTokens: 2500,
      input,
      instruction: `${runInstruction({ format: s.format, plan, brief: b, mode: `revise scene ${target.n} only (S-M12)` })}
Revise only SCENE ${target.n} as the user asked. Do not change the angle, hook, ending or mood (S-M1) or any other scene.
Instead of the full JSON, return only the one scene object between @@JSON@@ and @@END@@: {"scene": {…the scene fields above…}}`,
    });
    const next = contracts.conform(contracts.SCENE_TEMPLATE, (parsed && parsed.scene) || parsed);
    s.scenes[idx] = { ...next, n: target.n, beat: target.beat, start_s: target.start_s, duration_s: target.duration_s };
    gate = runScriptGate(s, { header: header || {}, brief: b });
    failuresForScene = gate.failures.filter((f) => f.startsWith(`Scene ${target.n} `) || f.startsWith(`Scene ${target.n}:`) || /VO runs|UGC:|Storytelling:/.test(f));
    if (!failuresForScene.length) break;
  }
  return { script: s, scene: renderScene(s.scenes[idx]), sceneIndex: idx, failures: failuresForScene, gate, notices: scriptNotices(s) };
}

/** /api/script/validate-and-import: the user's own script → script.json, gated. The concept is the import's own. */
async function importScript(input = {}, { call = callClaude } = {}) {
  contracts.assertHandoff('Script & Storyboard Spine (import)', input, ['rawScript', 'concept', 'brief']);
  const { rawScript, concept, brief } = input;
  const c = contracts.normalizeConcept(concept);
  const b = contracts.briefForScript(brief);
  const format = c.concept.format || 'UGC';
  const plan = contracts.scenePlan((b.formats.lengths_s || [])[0]);
  let gate = null;
  let script = null;
  let previous = null;
  let hints = {};
  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    const input = { "USER'S SCRIPT": rawScript, BRIEF: b };
    if (previous) Object.assign(input, { 'PREVIOUS SCRIPT JSON': previous, 'QUALITY GATE FAILURES': gate.failures });
    const { parsed } = await callScript({
      call,
      input,
      instruction: `${runInstruction({ format, plan, brief: b, mode: 'import the user\'s own script' })}
Turn the USER'S SCRIPT into this scene format. Keep the user's story, characters and lines where they meet the rules; change only what breaks a rule.
Also add "header_hints": {"hook_pattern": "", "ending": "", "mood": ""} describing the user's script.`,
    });
    hints = (parsed && parsed.header_hints) || hints;
    const attempt = shapeScript(parsed, { concept: c, brief: b, format, plan });
    const header = importHeader(b, format, hints, plan);
    const attemptGate = runScriptGate(attempt, { header, brief: b, concept: c });
    attemptGate.passes = pass;
    // keep the best attempt (fewest failing checks), so a failed repair never loses the user's script
    if (!gate || attemptGate.failures.length < gate.failures.length) { script = attempt; gate = attemptGate; }
    gate.passes = pass;
    if (gate.passed) break;
    previous = { context_block: script.context_block, scenes: script.scenes };
  }
  c.concept.mood = c.concept.mood || hints.mood || '';
  c.concept.ending_payoff = c.concept.ending_payoff || hints.ending || '';
  const header = importHeader(b, format, hints, plan);
  return { ...finish({ script, header, concept: c, brief: b, gate, spineVersion: loadSpine('script').version }), passed: gate.passed };
}

function importHeader(b, format, hints, plan) {
  return {
    brand: [b.company.brand, b.company.category, b.company.product].filter(Boolean).join(' – '),
    objective: b.objective.stage || 'Set by the user (imported script)',
    platform_format: `${(b.platforms || []).join(', ')} · ${(b.formats.aspect_ratios || []).join(', ')} · ${plan.length_s}s`,
    film_format: format,
    angle: "The user's own script",
    lens: 'n/a — the user brought the idea',
    hook: hints.hook_pattern ? `${hints.hook_pattern} – the user's script` : "From the user's script",
    ending: hints.ending || '',
    mood: hints.mood || '',
    moment: (b.occasion && b.occasion.event) || 'everyday',
    language: `${b.language.name}, ${b.language.script}`,
  };
}

module.exports = { writeScript, rewriteScene, importScript, buildHeader, headerText, renderScene, productionFields, scriptNotices, contextBlockText, BEATS_BY_COUNT, MAX_PASSES, SCRIPT_BEATS };
