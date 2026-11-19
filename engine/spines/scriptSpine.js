/**
 * engine/spines/scriptSpine.js — Script & Storyboard Spine adapter (spine 3).
 * Owns /api/creative/synthesize-script, /api/creative/rewrite-scene, /api/script/validate-and-import and the
 * quality gate (engine/gate.js runScriptGate, Annex B).
 *
 * Reads concept.json and the brief.json fields its rules name (contracts.briefForScript). Writes script.json,
 * storyboard.json (written frame descriptions and the consistency locks — see storyboard.js) and the script
 * record. The header is built from concept.json/brief.json, the scenes are rendered in the Section 3 scene format
 * from script.json, and the production inputs (scenes, character1, character2, setting) are derived from it:
 * one Context Block character per render character input.
 */

const { callClaude } = require('../claude');
const { parseJSONBlock } = require('../parse');
const { runScriptGate, SCRIPT_BEATS } = require('../gate');
const { loadSpine } = require('./index');
const contracts = require('./contracts');
const storyboard = require('./storyboard');

const { describe, characterLine, settingLine } = storyboard;

const MAX_PASSES = 3; // Section 5: after 3 failed passes, go back to the Creative Spine's second-ranked angle

// Section 1 beat structure; S-M3 scene counts (15s compresses beats 2 and 3; 30s groups 6 scenes into the 4 beats)
const BEATS_BY_COUNT = {
  3: ['Hook', 'Turn', 'Payoff'],
  4: ['Hook', 'Real moment', 'Turn', 'Payoff'],
  6: ['Hook', 'Real moment', 'Real moment', 'Turn', 'Turn', 'Payoff'],
};

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

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
    `Setting: ${settingLine(cb.setting)}`,
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
    'On-screen elements (supers, callouts, CTA, disclaimer and logo rendered by Production; in-scene writing and phone UI may be AI-generated):',
    `• Super: ${sc.super || 'none'}`,
    `• Callout: ${sc.callout || 'none'}`,
    `• CTA: ${sc.cta || 'none'}`,
    `• Disclaimer: ${sc.disclaimer || 'none'}`,
    `• UI / in-scene text: ${sc.ui_mockup || 'none'}`,
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

/** What production takes: scene texts, the two characters (one per render character input) and the setting. */
function productionFields(script) {
  // The gate has already held the Context Block to exactly two characters; each maps to its own input.
  const chars = (script.context_block.characters || []).slice(0, 2).map(characterLine);
  return {
    scenes: script.scenes.map(renderScene),
    character1: chars[0] || '',
    character2: chars[1] || '',
    setting: settingLine(script.context_block.setting),
  };
}

function scriptNotices(script, { flaggedFrames = [] } = {}) {
  const notices = [];
  if (flaggedFrames.length) {
    notices.push({
      code: 'FRAMES_FLAGGED',
      message: `Some frame descriptions still need a look after two rewrites: ${flaggedFrames.join(' ')} Edit those frames, or change the scene and write it again.`,
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
  // Speakers and visuals name the people, not their Context Block refs ("char_1 stands at the counter"): the render
  // prompt and the voice read names, and a ref there reads as a stranger.
  const byRef = new Map((s.context_block.characters || [])
    .filter((c) => c && typeof c === 'object' && c.ref && c.name)
    .map((c) => [String(c.ref).trim().toLowerCase(), String(c.name).trim()]));
  const named = (text) => (byRef.size ? String(text || '').replace(/\bchar_\d\b/gi, (r) => byRef.get(r.toLowerCase()) || r) : text);
  s.scenes = s.scenes.map((sc, i) => ({
    ...sc,
    n: i + 1,
    beat: beats[i] || sc.beat,
    // S-M3: per scene 5 seconds only
    start_s: i * contracts.SCENE_SECONDS,
    duration_s: contracts.SCENE_SECONDS,
    visual: named(sc.visual),
    dialogue: (format === 'VO-led' ? sc.dialogue : sc.dialogue.filter((d) => d.line)).map((d) => ({ ...d, speaker: named(d.speaker) })),
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
TWO CHARACTERS (the app's production rule): ${contracts.TWO_CHARACTERS_RULE} context_block.characters has exactly two entries, "char_1" and "char_2"${format === 'UGC' ? ' (in UGC the creator is char_1)' : ''}. Only they speak${r.hasVo ? ' (the VO is off-screen and is not a character)' : ''}, and every visual and frame shows only them.
Context Block: each character has "ref" ("char_1", "char_2"); the product "ref" is "${productRef}". Give the product's colour, packaging and label side. Refs are for the Context Block: speakers and visuals use each character's name.
Fill every on-screen element with its text or "none". Each "must include" from BRIEF.dos_donts that applies to the script is placed in a scene and noted in that scene's edit_notes as "Must include: <rule>" (S-M13).
UI / in-scene text ("ui_mockup", S-M5): the AI renders any writing or phone, app or website screen the scene needs — a chat or message, an order or payment screen, a handwritten note or checklist, a sign, packaging copy. Show it in the Visual if the story needs it, and give its exact words here, each piece in double quotes and where it appears (for example: Phone screen, WhatsApp chat: "1 box kaju katli please" / reply "Delivered in 30 min"). Keep each piece short (12 words at most) and legible, in ${brief.language.name} (${brief.language.script} script), and use only figures from BRIEF.rtbs and the offer. Write "none" if the scene shows no writing. Supers, callouts, CTA, disclaimer and the logo stay Production's: never ask the model to draw a logo or a caption over the picture.
Storyboard (Section 4): in "frames", one note per scene — camera_angle; composition (foreground, middle and background, where the subject sits, safe zones kept clear); subject (who is in frame by their Context Block name and what they are doing: present tense, physical details, one action per sentence); product (where it is, which side faces camera, how it's held or used — or "not in frame"). The app adds the aspect ratio, shot, camera move, the Context Block descriptions word for word, the setting and light, the scene's in-scene text word for word, the placeholders and the line. Never ask for a logo inside a frame.
Run the Annex B checklist yourself before answering (S-M11).
Return only JSON between @@JSON@@ and @@END@@:
{"context_block": {"characters": [{"ref": "char_1", "name": "", "role": "", "age": "", "gender": "", "skin_tone": "", "hair": "", "build": "", "wardrobe": "", "accessories": ""}, {"ref": "char_2", "name": "", "role": "", "age": "", "gender": "", "skin_tone": "", "hair": "", "build": "", "wardrobe": "", "accessories": ""}],
  "product": {"ref": "", "sku": "", "colour": "", "packaging": "", "size_in_hand": "", "label_side": "", "how_used": ""},
  "setting": {"location": "", "time_of_day": "", "light_source": "", "surfaces": "", "background_activity": "", "brand_colour_cues": ""},
  "brand_elements": {"logo_placement": "", "supers": "", "callouts": "", "cta": "", "disclaimers": "", "captions": "on|off"}},
 "scenes": [{"visual": "", "shot": "wide|medium|close-up|macro", "camera": "static|slow push-in|gentle pan|handheld drift|orbit",
   "dialogue": [{"speaker": "", "line": ""}], "vo": "",
   "super": "", "callout": "", "cta": "", "disclaimer": "", "ui_mockup": "", "logo": "corner bug|none",
   "ambience": "", "sfx": "", "music_mood": "", "transition_out": "", "edit_notes": ""}],
 "frames": [{"scene": 1, "camera_angle": "", "composition": "", "subject": "", "product": ""}]}`;
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

/** storyboard.json for a script: the writer's frame notes + the Context Block, with the locks (Section 4). */
function boardFor(script, frameNotes, concept, brief) {
  const vw = (concept && concept.concept && concept.concept.visual_world) || {};
  return storyboard.buildStoryboard(script, frameNotes, {
    aspectRatio: script.aspect_ratios[0] || '9:16',
    style: [script.format, concept && concept.concept && concept.concept.mood, vw.light, vw.time].filter(Boolean).join(' · '),
    palette: vw.palette ? [vw.palette] : [],
    // the reference images the user actually uploaded (the app takes a product photo; there are no character uploads)
    referenceImages: (brief.mandatories && brief.mandatories.product_images) || [],
  });
}

// ---------- Section 5: "Rewrite only the parts that fail, then run the full checklist again." ----------
/** The scenes (and frames) named in the gate failures, and whether the Context Block itself failed. */
function failingParts(failures) {
  const scenes = new Set();
  let contextBlock = false;
  for (const f of failures || []) {
    const m = String(f).match(/^(Scene|Frame) (\d+)\b/);
    if (m) scenes.add(Number(m[2]));
    if (/^Context Block|^Consistency locks/.test(f)) contextBlock = true;
  }
  return { scenes: [...scenes].sort((a, b) => a - b), contextBlock };
}
/** Merge a repair answer (only the parts it rewrote) into the previous script: scenes by "n", frames by "scene". */
function mergeRepair(prev, parsed, count) {
  const p = parsed && typeof parsed === 'object' ? parsed : {};
  const scenes = prev.scenes.map((s) => ({ ...s }));
  const got = Array.isArray(p.scenes) ? p.scenes.filter((s) => s && typeof s === 'object') : [];
  if (got.length === count && got.every((s) => !s.n)) got.forEach((s, i) => { scenes[i] = s; }); // a full answer after all
  else got.forEach((s) => { const n = Number(s.n); if (n >= 1 && n <= count) scenes[n - 1] = { ...scenes[n - 1], ...s }; });
  const frames = Array.from({ length: count }, (_, i) => (prev.frames || []).find((f) => f && Number(f.scene) === i + 1) || (prev.frames || [])[i] || { scene: i + 1 });
  for (const f of Array.isArray(p.frames) ? p.frames : []) {
    const n = Number(f && f.scene);
    if (n >= 1 && n <= count) frames[n - 1] = { ...frames[n - 1], ...f, scene: n };
  }
  const cb = p.context_block && typeof p.context_block === 'object' && Object.keys(p.context_block).length ? p.context_block : prev.context_block;
  return { context_block: cb, scenes, frames };
}
function repairInstruction(failures) {
  const parts = failingParts(failures);
  return `REPAIR (Section 5: rewrite only the parts that fail, then the full checklist runs again). PREVIOUS SCRIPT JSON is the script so far; QUALITY GATE FAILURES says what fails.
Rewrite only ${parts.scenes.length ? `scene${parts.scenes.length > 1 ? 's' : ''} ${parts.scenes.join(', ')}` : 'the scenes these failures need'} (a failure that isn't about one scene — VO length, who speaks where, a disclaimer, a must-include — may need others; change as few as you can)${parts.contextBlock ? ', and the Context Block' : ''}.
Return only those parts between @@JSON@@ and @@END@@: {"scenes": [each rewritten scene with its "n" and all its fields], "frames": [the frame note for each rewritten scene, with its "scene"]${parts.contextBlock ? ', "context_block": {…}' : ''}}. Everything you leave out stays as it is.`;
}

// What a shop owner sees when the script still fails after three tries: one plain sentence per kind of problem,
// no rule codes or checklist names (the detailed reasons go to the server log).
const PLAIN_PROBLEMS = {
  header: 'Some details of the story you approved were missing.',
  context_block: 'The description of the two people, the product or the place wasn’t complete.',
  visual: 'Some scenes weren’t described clearly enough to film.',
  on_screen: 'Some of the words that go on screen were missing or too long.',
  in_scene_text: 'A phone screen, sign or note in a scene didn’t have its exact words written out.',
  dialogue: 'Some spoken lines were too long, or one person had too many lines.',
  two_characters: 'The story kept bringing in a third person — every film has exactly two people.',
  language: 'Some lines weren’t in the language you chose.',
  sound: 'Some scenes were missing their sound notes.',
  transitions: 'Some scenes didn’t lead smoothly into the next one.',
  edit_notes: 'Some editing notes weren’t written the right way.',
  scene_count: 'The number of scenes or the length of the voiceover didn’t fit the length you chose.',
  mood: 'The mood wasn’t kept the same through the film.',
  brochure: 'Some lines sounded like an advert brochure instead of real people talking.',
  claims: 'A claim or a required line of small print didn’t match your brief.',
  safety: 'Something in the script isn’t allowed in an ad (for example, a fake customer review).',
  frames: 'Some storyboard pictures weren’t described clearly enough.',
  dos_donts: 'One of your do’s and don’ts wasn’t followed.',
};
function plainProblems(gate) {
  const ids = [...new Set((gate.checks || []).filter((ch) => ch.status === 'fail').map((ch) => ch.id))];
  const list = ids.map((id) => PLAIN_PROBLEMS[id]).filter(Boolean);
  return list.length ? list : ['Some parts of the script didn’t pass our checks.'];
}
const GATE_FAILED_MESSAGE = 'We couldn’t get this script right after three tries. Nothing is lost — your brief, idea and opening are all saved. Press “Retry Script Generation” to write it again, or “Back to Hook” to choose a different opening and we’ll write a new script from it.';

/** Section 4: a frame still failing after two rewrites is flagged to the user rather than blocking the script. */
function flagFrames(gate) {
  const failing = gate.checks.filter((ch) => ch.status === 'fail');
  if (gate.passed || !failing.length || !failing.every((ch) => ch.id === 'frames')) return { gate, flaggedFrames: [] };
  const flaggedFrames = failing.flatMap((ch) => ch.details);
  return { gate: { ...gate, passed: true, failures: [], flagged: flaggedFrames }, flaggedFrames };
}

function finish({ script, frameNotes, header, concept, brief, gate, spineVersion, flaggedFrames = [] }) {
  const board = boardFor(script, frameNotes, concept, brief);
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
    header, script, storyboard: board,
    gate, record, notices: scriptNotices(script, { flaggedFrames }),
    text: [headerText(header), contextBlockText(script.context_block), ...prod.scenes].join('\n\n'),
    ...prod,
  };
}

/** Writes script.json + the frame descriptions for concept.json, runs the gate and repairs (up to 3 passes). */
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
  let frameNotes = [];
  let spineVersion = '';
  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    const input = { CONCEPT: c, BRIEF: b, SCRIPT_HEADER: headerText(header) };
    let instruction = runInstruction({ format, plan, brief: b, mode: pass === 1 ? 'write the script' : `repair pass ${pass}` });
    if (previous) {
      Object.assign(input, { 'PREVIOUS SCRIPT JSON': previous, 'QUALITY GATE FAILURES': gate.failures });
      instruction = `${instruction}\n${repairInstruction(gate.failures)}`;
    }
    const { parsed, version } = await callScript({ call, instruction, input, maxTokens: previous ? 5000 : 7000 });
    spineVersion = version;
    // pass 1 is the whole script; a repair pass brings only what it rewrote, merged into the previous script
    const raw = previous ? mergeRepair(previous, parsed, plan.count) : parsed;
    script = shapeScript(raw, { concept: c, brief: b, format, plan });
    frameNotes = Array.isArray(raw.frames) ? raw.frames : [];
    gate = runScriptGate(script, { header, brief: b, concept: c, storyboard: boardFor(script, frameNotes, c, b) });
    gate.passes = pass;
    console.log(`[script spine] pass #${pass}: ${gate.passed ? 'passed' : `${gate.failures.length} failing checks`}`);
    if (!gate.passed && process.env.SPINE_DEBUG) {
      console.log('[script spine] failures:', gate.failures);
      // the text behind each scene/frame failure, to tell a real problem from a misread
      const board = boardFor(script, frameNotes, c, b);
      for (const n of failingParts(gate.failures).scenes) {
        const sc = script.scenes[n - 1] || {};
        const fr = board.frames[n - 1] || {};
        console.log(`[script spine] scene ${n} visual: ${sc.visual} || frame: ${fr.composition} || subject: ${fr.subject} || product: ${fr.product} || edit notes: ${sc.edit_notes}`);
      }
    }
    if (gate.passed) break;
    previous = { context_block: script.context_block, scenes: script.scenes, frames: frameNotes };
  }
  const flagged = flagFrames(gate);
  gate = flagged.gate;
  if (!gate.passed) {
    const err = new Error(GATE_FAILED_MESSAGE);
    err.status = 422;
    err.code = 'SCRIPT_GATE_FAILED';
    err.failures = plainProblems(gate); // what the user sees
    err.details = gate.failures; // what the checks found, for the server log
    err.gate = gate;
    throw err;
  }
  return finish({ script, frameNotes, header, concept: c, brief: b, gate, spineVersion, flaggedFrames: flagged.flaggedFrames });
}

/** S-M12: revise only the one scene (and its frame), re-run the gate on it, keep everything else. Reads script.json. */
async function rewriteScene(input = {}, { call = callClaude } = {}) {
  contracts.assertHandoff('Script & Storyboard Spine (scene edit)', input, ['script', 'header', 'brief', 'sceneIndex', 'instruction', 'storyboard']);
  const { script, header, brief, sceneIndex, instruction } = input;
  const s = contracts.normalizeScript(script);
  const b = contracts.briefForScript(brief || {});
  if (!s.language.script) s.language = b.language;
  const idx = Number(sceneIndex) || 0;
  const target = s.scenes[idx];
  if (!target) throw Object.assign(new Error('That scene does not exist.'), { status: 400 });
  const plan = contracts.scenePlan(s.length_s);
  const aspect = s.aspect_ratios[0] || '9:16';
  // the other frames stay as they are; without a storyboard (an older script) they're written from the scenes alone
  let board = input.storyboard && Array.isArray(input.storyboard.frames) && input.storyboard.frames.length === s.scenes.length
    ? contracts.normalizeStoryboard(input.storyboard)
    : storyboard.buildStoryboard(s, [], { aspectRatio: aspect });
  let gate = null;
  let failuresForScene = [];
  const mine = (f) => [`Scene ${target.n} `, `Scene ${target.n}:`, `Frame ${target.n} `, `Frame ${target.n}:`].some((p) => f.startsWith(p)) || /VO runs|UGC:|Storytelling:/.test(f);
  for (let pass = 1; pass <= 2; pass++) {
    const input = { 'SCRIPT JSON': s, BRIEF: b, SCENE_NUMBER: target.n, "USER'S CHANGE": instruction };
    if (failuresForScene.length) input['QUALITY GATE FAILURES FOR THIS SCENE'] = failuresForScene;
    const { parsed } = await callScript({
      call,
      maxTokens: 3000,
      input,
      instruction: `${runInstruction({ format: s.format, plan, brief: b, mode: `revise scene ${target.n} only (S-M12)` })}
Revise only SCENE ${target.n} and its frame as the user asked. Do not change the angle, hook, ending or mood (S-M1), the Context Block or any other scene.
Instead of the full JSON, return only this between @@JSON@@ and @@END@@: {"scene": {…the scene fields above…}, "frame": {"camera_angle": "", "composition": "", "subject": "", "product": ""}}`,
    });
    const next = contracts.conform(contracts.SCENE_TEMPLATE, (parsed && parsed.scene) || parsed);
    s.scenes[idx] = { ...next, n: target.n, beat: target.beat, start_s: target.start_s, duration_s: target.duration_s };
    const frames = [...board.frames];
    frames[idx] = storyboard.buildFrame(s.scenes[idx], (parsed && parsed.frame) || {}, s.context_block, aspect);
    board = contracts.normalizeStoryboard({ ...board, frames });
    gate = runScriptGate(s, { header: header || {}, brief: b, storyboard: board });
    failuresForScene = gate.failures.filter(mine);
    if (!failuresForScene.length) break;
  }
  return { script: s, scene: renderScene(s.scenes[idx]), sceneIndex: idx, frame: board.frames[idx], storyboard: board, failures: failuresForScene, gate, notices: scriptNotices(s) };
}

/** /api/script/validate-and-import: the user's own script → script.json + frames, gated. The concept is the import's own. */
async function importScript(input = {}, { call = callClaude } = {}) {
  contracts.assertHandoff('Script & Storyboard Spine (import)', input, ['rawScript', 'concept', 'brief']);
  const { rawScript, concept, brief } = input;
  const c = contracts.normalizeConcept(concept);
  const b = contracts.briefForScript(brief);
  const format = c.concept.format || 'UGC';
  const plan = contracts.scenePlan((b.formats.lengths_s || [])[0]);
  let gate = null;
  let script = null;
  let frameNotes = [];
  let previous = null;
  let hints = {};
  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    const input = { "USER'S SCRIPT": rawScript, BRIEF: b };
    if (previous) Object.assign(input, { 'PREVIOUS SCRIPT JSON': previous, 'QUALITY GATE FAILURES': gate.failures });
    const { parsed } = await callScript({
      call,
      input,
      instruction: `${runInstruction({ format, plan, brief: b, mode: 'import the user\'s own script' })}
Turn the USER'S SCRIPT into this scene format. Keep the user's story, characters and lines where they meet the rules; change only what breaks a rule (a third person in the user's script becomes one of the two characters or leaves the scene).
Also add "header_hints": {"hook_pattern": "", "ending": "", "mood": ""} describing the user's script.`,
    });
    hints = (parsed && parsed.header_hints) || hints;
    const attempt = shapeScript(parsed, { concept: c, brief: b, format, plan });
    const attemptNotes = Array.isArray(parsed.frames) ? parsed.frames : [];
    const header = importHeader(b, format, hints, plan);
    const attemptGate = runScriptGate(attempt, { header, brief: b, concept: c, storyboard: boardFor(attempt, attemptNotes, c, b) });
    attemptGate.passes = pass;
    // keep the best attempt (fewest failing checks), so a failed repair never loses the user's script
    if (!gate || attemptGate.failures.length < gate.failures.length) { script = attempt; frameNotes = attemptNotes; gate = attemptGate; }
    gate.passes = pass;
    if (gate.passed) break;
    previous = { context_block: script.context_block, scenes: script.scenes, frames: frameNotes };
  }
  const flagged = flagFrames(gate);
  gate = flagged.gate;
  c.concept.mood = c.concept.mood || hints.mood || '';
  c.concept.ending_payoff = c.concept.ending_payoff || hints.ending || '';
  const header = importHeader(b, format, hints, plan);
  return { ...finish({ script, frameNotes, header, concept: c, brief: b, gate, spineVersion: loadSpine('script').version, flaggedFrames: flagged.flaggedFrames }), passed: gate.passed };
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

module.exports = { writeScript, rewriteScene, importScript, buildHeader, headerText, renderScene, productionFields, scriptNotices, contextBlockText, boardFor, plainProblems, PLAIN_PROBLEMS, GATE_FAILED_MESSAGE, BEATS_BY_COUNT, MAX_PASSES, SCRIPT_BEATS };
