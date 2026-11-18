/**
 * engine/spines/contracts.js
 * The three handoff contracts, exactly as the spine documents specify them:
 *   brief.json      — Brief Spine, Section 7
 *   concept.json    — Creative Spine, Section 12
 *   script.json + storyboard.json (+ script record) — Script & Storyboard Spine, Section 7
 *
 * conform() keeps only the keys a contract defines (unknown keys are dropped at every level) and coerces types,
 * so no stage can pass along fields the next stage isn't given. The handoff pickers below are the only way a
 * stage receives the previous stage's output.
 */

const crypto = require('crypto');

const ANY = Symbol('any'); // a value whose shape the contract leaves open ("persona": {}, characters: [])

// ---------- templates (shapes copied from the documents) ----------

const BRIEF_TEMPLATE = {
  date: '',
  company: {
    brand: '', category: '', city: '', url: '', contact: '', logo: '',
    tone: '', product: '', price: '', value_prop: '', features: [''],
    product_images: [''], brand_style: { colours: [''], fonts: [''] }, offer: '',
  },
  business_problem: '',
  objective: { stage: '', statement: '' },
  kpis: [{ name: '', target: '', primary: true, benchmark: { range: '', source: '', date: '', confidence: '' } }],
  four_c: {
    client: { positioning: '', assets: [''], proof: [''], past_messaging: [''], voice: '' },
    competitors: [{ name: '', positioning: '', active_ads: 0, formats: [''], hooks: [''], messages: [''], complaints: [''], source: '' }],
    consumer: { persona: {}, jobs: [''], triggers: [''], fears: [''], desires: [''], objections: [''], moments: [''], own_words: [''] },
    category: { norms: [''], cliches: [''], trends: [''], regulation: [''], moment: '' },
    gap: '',
  },
  smp: '',
  rtbs: [{ claim: '', proof: '' }],
  platforms: [''],
  platform_constraints: {},
  formats: { aspect_ratios: [''], lengths_s: [0] },
  language: { name: '', script: '' },
  mandatories: { logo: true, product_images: [''], offer: '', cta: '', disclaimers: [''] },
  dos_donts: [{ rule: '', type: '', strength: '', source: '', applies_to: [''] }],
  occasion: { event: '', date: '', score: 0, fit: '', dos: [''], donts: [''] },
  user_idea: '',
  polished_brief: { problem: '', human_problem: '', think_feel_do: [''], assumptions: [''] },
  compliance_flags: [ANY],
  field_status: {},
};

const HOOK_TEMPLATE = { pattern: '', library: '', pulled: '', line: '', visual: '', super: '', payoff: '' };

const CONCEPT_TEMPLATE = {
  brief_id: '',
  insight: { lens: '', tension: '', fear: '', desire: '', human_truth: '', locked: false },
  angles: [{ id: '', name: '', route: '', plot: '', score: 0, confidence: '', hooks: [HOOK_TEMPLATE] }],
  chosen_angle_id: '',
  ab_angle_id: null,
  idea_source: '',
  dos_donts_check: [{ rule: '', status: '' }],
  occasion_use: { event: '', how_shown: '', donts: [''] },
  concept: {
    core_idea: '', format: '', beats: [''], hook: {}, ending_payoff: '', mood: '',
    visual_world: { time: '', light: '', palette: '', setting: '' },
  },
  compliance_flags: [ANY],
};

const SCENE_TEMPLATE = {
  n: 0, beat: '', start_s: 0, duration_s: 0, visual: '', shot: '', camera: '',
  dialogue: [{ speaker: '', line: '' }], vo: '',
  super: '', callout: '', cta: '', disclaimer: '', ui_mockup: '', logo: '',
  ambience: '', sfx: '', music_mood: '', transition_out: '', edit_notes: '',
};

const SCRIPT_TEMPLATE = {
  concept_id: '', format: '', length_s: 0, language: { name: '', script: '' }, aspect_ratios: [''],
  context_block: { characters: [ANY], product: {}, setting: {}, brand_elements: {} },
  scenes: [SCENE_TEMPLATE],
};

// Section 4 / Section 7: written frame descriptions, no images; locks are text plus the reference images the user uploaded
const STORYBOARD_TEMPLATE = {
  frames: [{ scene: 0, frame: '', composition: '', subject: '', product: '', setting_light: '', placeholders: '', line: '', approved: true }],
  locks: { characters: [''], product: '', reference_images: [''], style: '', palette: [''] },
};

const SCRIPT_RECORD_TEMPLATE = {
  brand: '', category: '', date: '', objective: '', primary_kpi: '',
  lens: '', tension: '', angle_route: '', format: '', hook_pattern: '', hook_library: '',
  ending_payoff: '', mood: '', moment: '', language: '', scenes: 0,
  performance: { vtr: null, ctr: null, cpa: null, roas: null, saves: null, shares: null },
};

// ---------- conform ----------

const MAX_STR = 4000;
function plainJson(v, depth = 0) {
  if (depth > 6 || v == null) return v == null ? v : undefined;
  if (typeof v === 'string') return v.slice(0, MAX_STR);
  if (typeof v === 'number' || typeof v === 'boolean') return Number.isFinite(v) || typeof v === 'boolean' ? v : undefined;
  if (Array.isArray(v)) return v.slice(0, 50).map((x) => plainJson(x, depth + 1)).filter((x) => x !== undefined);
  if (typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v).slice(0, 60)) { const c = plainJson(x, depth + 1); if (c !== undefined) out[k] = c; }
    return out;
  }
  return undefined;
}

function conform(template, value) {
  if (template === ANY) return plainJson(value) ?? null;
  if (template === null) return value == null || value === '' ? null : String(value).slice(0, MAX_STR);
  if (Array.isArray(template)) {
    const list = Array.isArray(value) ? value : (value == null || value === '' ? [] : [value]);
    return list.slice(0, 50).map((x) => conform(template[0], x)).filter((x) => x !== '' && x !== undefined);
  }
  if (typeof template === 'object') {
    if (!Object.keys(template).length) return value && typeof value === 'object' && !Array.isArray(value) ? plainJson(value) : {};
    const src = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const out = {};
    for (const [k, t] of Object.entries(template)) out[k] = conform(t, src[k]);
    return out;
  }
  if (typeof template === 'number') { const n = Number(value); return Number.isFinite(n) ? n : 0; }
  if (typeof template === 'boolean') return value === undefined ? template : value === true || value === 'true';
  return value == null ? '' : (typeof value === 'object' ? JSON.stringify(value) : String(value)).slice(0, MAX_STR);
}

const oneOf = (v, list, dflt = '') => (list.includes(v) ? v : (list.find((x) => x.toLowerCase() === String(v || '').toLowerCase()) || dflt));

function normalizeBrief(raw) {
  const b = conform(BRIEF_TEMPLATE, raw);
  b.objective.stage = oneOf(b.objective.stage, ['Awareness', 'Consideration', 'Conversion', 'Retention', 'Launch'], '');
  for (const k of b.kpis) k.benchmark.confidence = oneOf(k.benchmark.confidence, ['High', 'Med', 'Low'], '');
  for (const d of b.dos_donts) {
    d.strength = oneOf(d.strength, ['must', 'prefer'], 'must');
    d.source = oneOf(d.source, ['user', 'brand', 'category'], 'user');
    if (!d.applies_to.length) d.applies_to = ['idea', 'script', 'video'];
  }
  b.dos_donts = b.dos_donts.filter((d) => d.rule);
  return b;
}

function normalizeConcept(raw) {
  const c = conform(CONCEPT_TEMPLATE, raw);
  c.idea_source = oneOf(c.idea_source, ['engine', 'user_selected', 'user_submitted'], 'engine');
  c.concept.format = oneOf(c.concept.format, ['UGC', 'VO-led', 'Storytelling', 'Demo', 'Founder'], c.concept.format);
  for (const a of c.angles) a.confidence = oneOf(a.confidence, ['High', 'Med', 'Low'], '');
  for (const d of c.dos_donts_check) d.status = oneOf(d.status, ['met', 'broken', 'n/a'], 'n/a');
  return c;
}

const normalizeScript = (raw) => conform(SCRIPT_TEMPLATE, raw);
const normalizeStoryboard = (raw) => conform(STORYBOARD_TEMPLATE, raw);
const normalizeScriptRecord = (raw) => conform(SCRIPT_RECORD_TEMPLATE, raw);

const contractId = (obj) => crypto.createHash('sha1').update(JSON.stringify(obj || {})).digest('hex').slice(0, 12);

// ---------- handoffs ----------

// Creative Spine: brief.json and nothing else (C-M13: ideas come from the polished brief and its fields).
function briefForCreative(brief) {
  return normalizeBrief(brief);
}

// Script & Storyboard Spine: concept.json plus the brief.json fields its rules name — language (S-M2),
// lengths (S-M3), platform and aspect ratios (header), rtbs/offer/mandatories/disclaimers (S-M10),
// dos_donts (S-M13), occasion (Do's and don'ts and occasion), objective + KPI and brand/category/product
// (script header), compliance flags (B-M11: attached for downstream spines). Never four_c, smp, polished
// brief, user_idea or the raw user text.
const SCRIPT_BRIEF_FIELDS = ['company', 'objective', 'kpis', 'platforms', 'platform_constraints', 'formats', 'language', 'mandatories', 'rtbs', 'dos_donts', 'occasion', 'compliance_flags'];
const SCRIPT_COMPANY_FIELDS = ['brand', 'category', 'product', 'offer'];
function briefForScript(brief) {
  const b = normalizeBrief(brief);
  const out = {};
  for (const k of SCRIPT_BRIEF_FIELDS) out[k] = b[k];
  out.company = Object.fromEntries(SCRIPT_COMPANY_FIELDS.map((k) => [k, b.company[k]]));
  return out;
}

/** Throws when a stage function is handed an input it isn't allowed to read (handoff enforcement). */
function assertHandoff(stage, input, allowed) {
  const extra = Object.keys(input || {}).filter((k) => !allowed.includes(k) && input[k] !== undefined);
  if (extra.length) {
    const err = new Error(`${stage} may only read ${allowed.join(', ')}; it was handed ${extra.join(', ')}.`);
    err.code = 'HANDOFF_VIOLATION';
    throw err;
  }
}

// ---------- the three Creative Style options and their format rules ----------

// Dashboard values. Whichever one is picked drives every spine (Creative Spine Section 6, S-M7).
const CREATIVE_STYLES = ['UGC / Creator-style', 'VO-led', 'Storytelling'];
const STYLE_TO_FORMAT = { 'UGC / Creator-style': 'UGC', 'VO-led': 'VO-led', Storytelling: 'Storytelling' };

// Old saved values → the nearest of the three, so saved projects and businesses still open and generate.
const LEGACY_STYLE_MAP = [
  [/product[\s-]*focused|product demo|^demo\b|product-led|showcase/i, 'VO-led'],
  [/offer|promotion|promo|discount|sale/i, 'UGC / Creator-style'],
  [/conversational|dialogue|comedy|humou?r|funny|situational|drama|story/i, 'Storytelling'],
  [/\bvo\b|voice[\s-]?over|narrat|vo-led/i, 'VO-led'],
  [/ugc|creator|selfie|testimonial|founder/i, 'UGC / Creator-style'],
];

function normalizeCreativeStyle(value) {
  const v = String(value || '').trim();
  if (CREATIVE_STYLES.includes(v)) return v;
  const exact = CREATIVE_STYLES.find((s) => s.toLowerCase() === v.toLowerCase());
  if (exact) return exact;
  for (const [re, style] of LEGACY_STYLE_MAP) if (re.test(v)) return style;
  return 'UGC / Creator-style';
}

const filmFormatOf = (style) => STYLE_TO_FORMAT[normalizeCreativeStyle(style)];

// Creative Spine Section 6 (rules for AI generation) + Script Spine S-M7 (dialogue), per format.
const FORMAT_RULES = {
  UGC: {
    format: 'UGC',
    looks_like: 'A disclosed creator or the founder talks to camera, phone-propped framing.',
    generation: 'The speaker talks in at most 3 of the 4 beats, one short line each; the other beat is B-roll. Never a "customer" giving a review. Disclosed as an ad.',
    dialogue: 'Each character speaks at most one line per scene, about 8 words (3 seconds) or fewer. One speaker per moment. In UGC films the speaker talks in at most 3 of the 4 scenes.',
    hasVo: false, speakerSceneCap: true,
  },
  'VO-led': {
    format: 'VO-led',
    looks_like: "One voice over moments with the product; people act but don't speak.",
    generation: 'One crisp VO line per scene, about 40–50 words for 20s. VO generated in one pass. No mouths moving to dialogue.',
    dialogue: 'VO-led films run about 40–50 words for 20s. Speaker is "VO"; no character speaks on screen.',
    hasVo: true, speakerSceneCap: false,
  },
  Storytelling: {
    format: 'Storytelling',
    looks_like: 'A small acted scene: problem, the brand solves it, a warm or witty ending.',
    generation: 'Exact Context Block. Hook in the first 3s. One short line per character per scene, rotated.',
    dialogue: 'Each character speaks at most one line per scene, about 8 words (3 seconds) or fewer. One speaker per moment; no one talks over another. Rotate speakers across scenes.',
    hasVo: false, speakerSceneCap: false,
  },
};

// The user's Creative Style is a mandatory user instruction, so the Brief Spine records it in dos_donts
// (B-M13: captured, tagged, passed downstream unchanged) — brief.json has no other field for the film format.
const FILM_FORMAT_RULE_RE = /^Film format:\s*(UGC|VO-led|Storytelling)\b/i;
function filmFormatRule(format) {
  return {
    rule: `Film format: ${format} (the user's Creative Style choice). ${FORMAT_RULES[format].generation}`,
    type: 'Must include', strength: 'must', source: 'user', applies_to: ['idea', 'script', 'video'],
  };
}
function filmFormatFromBrief(brief) {
  const hit = ((brief && brief.dos_donts) || []).find((d) => d && FILM_FORMAT_RULE_RE.test(d.rule || ''));
  if (!hit) return 'UGC';
  const f = hit.rule.match(FILM_FORMAT_RULE_RE)[1];
  return f.toLowerCase() === 'vo-led' ? 'VO-led' : f.toLowerCase() === 'ugc' ? 'UGC' : 'Storytelling';
}

// S-M3: every scene is exactly 5 seconds, so the length sets the scene count and nothing else (15s → 3, 20s → 4,
// 30s → 6). The CTA/logo end frame is added on top by Production after generation and isn't counted.
const SCENE_SECONDS = 5;
function scenePlan(lengthS) {
  const len = [15, 20, 30].includes(Number(lengthS)) ? Number(lengthS) : 20;
  return { length_s: len, count: len / SCENE_SECONDS, each: SCENE_SECONDS };
}

// ---------- Two characters ----------
// The app's production rule (the render flows have exactly two character inputs, and a third person is where
// renders drift). It isn't in the spine documents, so the app adds it to the Creative and Script stages' run
// instructions and checks it in code: the Creative Spine names its cast, the gate fails a third featured person.
const TWO_CHARACTERS_RULE = 'Exactly two characters. Every film has two characters, both seen on screen, and the story plays out between them (not one on screen and one only a voice, a call or a message). No third featured person appears in any scene: nobody else acts, speaks or is framed as a subject. Any background activity stays unnamed, small and out of focus.';

// Words for people. One that appears in a visual or plot but in neither character's description is a third featured
// person. Sentences about the background are skipped (the Context Block allows background activity).
const PEOPLE_WORDS = [
  'mother', 'father', 'mom', 'mum', 'mummy', 'dad', 'daddy', 'husband', 'wife', 'son', 'daughter', 'brother', 'sister',
  'grandmother', 'grandfather', 'grandma', 'grandpa', 'granny', 'aunt', 'aunty', 'auntie', 'uncle', 'cousin', 'niece', 'nephew',
  'dadi', 'nani', 'dada', 'didi', 'bhaiya', 'bhabhi', 'chacha', 'chachi', 'mami', 'mausi', 'bua',
  'friend', 'friends', 'neighbour', 'neighbor', 'neighbours', 'neighbors', 'colleague', 'colleagues', 'boss',
  'customer', 'customers', 'shopkeeper', 'cashier', 'waiter', 'waitress', 'chef', 'guest', 'guests', 'stranger', 'passenger',
  'child', 'children', 'kid', 'kids', 'baby', 'toddler', 'boy', 'girl', 'man', 'woman', 'lady', 'gentleman',
  'rider', 'driver', 'doctor', 'nurse', 'teacher', 'student', 'salesman', 'saleswoman', 'salesperson', 'staff', 'owner', 'manager',
  'priest', 'mechanic', 'technician', 'assistant', 'helper', 'maid', 'receptionist', 'crowd', 'couple', 'people',
];
const PEOPLE_RE = new RegExp(`\\b(${PEOPLE_WORDS.join('|')})\\b`, 'gi');
const BACKGROUND_RE = /\b(background|blurred|out of focus|soft focus|distant|far behind|passers?-?by)\b/i;
// "No other person is in the frame", "zero people in frame": a sentence that rules people out names nobody
const NEGATED_RE = /\b(no|not|never|without|zero|nobody|none|no-one)\b/i;
// Group words: in a concept or plot they usually describe the setting or the audience ("a room full of guests",
// "people who…"), so the Creative stage checks only specific individuals; a scene's visual checks them all.
const GROUP_WORDS = new Set(['people', 'crowd', 'couple', 'guests', 'customers', 'friends', 'children', 'kids', 'neighbours', 'neighbors', 'colleagues']);

/** What each character can be called: its own words, plus the generic words its gender and age allow. */
function castTerms(characters) {
  return (characters || []).map((c) => {
    const o = c && typeof c === 'object' ? c : { description: String(c || '') };
    const own = Object.values(o).filter((v) => typeof v === 'string').join(' ').toLowerCase();
    const extra = [];
    if (/\b(female|woman|girl|lady|she|her)\b/.test(own)) extra.push('woman', 'lady', 'girl');
    if (/\b(male|man|boy|gentleman|he|him)\b/.test(own)) extra.push('man', 'gentleman', 'boy');
    const age = parseInt(String(o.age || (own.match(/\b(\d{1,2})\b/) || [])[1] || ''), 10);
    if (age && age < 15) extra.push('child', 'kid', 'boy', 'girl');
    return `${own} ${extra.join(' ')}`;
  });
}

// Hands that belong to nobody in the cast ("anonymous hands only — not Priya or Ravi") are a third person doing the
// action, whatever the sentence rules out.
const ANONYMOUS_HANDS_RE = /\b(anonymous|unnamed|unidentified|faceless|someone's|somebody's|a stranger's|staff)\s+(pair of\s+)?hands?\b|\b(a|another) pair of hands\b|\bhands of (an? )?(anonymous|unnamed|unidentified|stranger)\b/i;

/** People named in text who are neither of the two characters (lowercase words, deduplicated). */
function extraPeople(text, characters, { individualsOnly = false } = {}) {
  const terms = castTerms(characters).join(' ');
  const found = new Set();
  const hands = String(text || '').match(ANONYMOUS_HANDS_RE);
  if (hands) found.add(hands[0].toLowerCase());
  for (const sentence of String(text || '').split(/(?<=[.!?;])\s+/)) {
    if (BACKGROUND_RE.test(sentence) || NEGATED_RE.test(sentence)) continue;
    for (const m of sentence.matchAll(PEOPLE_RE)) {
      const w = m[1].toLowerCase();
      if (individualsOnly && GROUP_WORDS.has(w)) continue;
      if (!new RegExp(`\\b${w}\\b`).test(terms)) found.add(w);
    }
  }
  return [...found];
}

// VO word range: about 40–50 words for 20s, scaled to the film length
function voWordRange(lengthS) {
  const len = Number(lengthS) || 20;
  return { min: Math.round((40 / 20) * len), max: Math.round((50 / 20) * len) };
}

module.exports = {
  ANY,
  BRIEF_TEMPLATE, CONCEPT_TEMPLATE, SCRIPT_TEMPLATE, SCENE_TEMPLATE, STORYBOARD_TEMPLATE, SCRIPT_RECORD_TEMPLATE, HOOK_TEMPLATE,
  conform, normalizeBrief, normalizeConcept, normalizeScript, normalizeStoryboard, normalizeScriptRecord, contractId,
  briefForCreative, briefForScript, assertHandoff, SCRIPT_BRIEF_FIELDS,
  CREATIVE_STYLES, normalizeCreativeStyle, filmFormatOf, FORMAT_RULES, filmFormatRule, filmFormatFromBrief, FILM_FORMAT_RULE_RE,
  scenePlan, voWordRange, SCENE_SECONDS,
  TWO_CHARACTERS_RULE, extraPeople, castTerms,
};
