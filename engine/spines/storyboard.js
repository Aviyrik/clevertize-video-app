/**
 * engine/spines/storyboard.js — the 4-grid storyboard as written frame descriptions (Script & Storyboard Spine,
 * Section 4). No storyboard images are generated: each scene gets one frame description covering frame,
 * composition, subject, product, setting and light, on-screen placeholders and the line.
 *
 * The writer (the script call) supplies the parts that need judgement for each scene: camera angle, composition,
 * what the people in frame are doing, and where the product is. Everything else is filled here from script.json,
 * so it can't drift between frames: the Context Block descriptions word for word, the same setting and light in
 * every frame, placeholder positions inside the safe zones, and the dialogue or VO line.
 *
 * The consistency locks are text plus the reference images the user actually uploaded (character descriptions,
 * product description, style and palette notes); Production puts them into every scene prompt sent to Magnific.
 */

const contracts = require('./contracts');

const clean = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());
const isNone = (s) => /^\s*(none|n\/a|-|not in frame\.?|no product\.?)?\s*$/i.test(clean(s));

function describe(obj, keys) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  const entries = keys ? keys.map((k) => [k, obj[k]]) : Object.entries(obj);
  return entries.filter(([k, v]) => k !== 'ref' && k !== 'id' && v && typeof v !== 'object').map(([, v]) => String(v)).join(', ');
}

const CHARACTER_KEYS = ['name', 'role', 'age', 'gender', 'skin_tone', 'hair', 'build', 'wardrobe', 'accessories'];
const PRODUCT_KEYS = ['sku', 'colour', 'packaging', 'size_in_hand', 'label_side', 'how_used'];
const SETTING_KEYS = ['location', 'time_of_day', 'light_source', 'surfaces', 'background_activity', 'brand_colour_cues'];

/** One Context Block character, one line (Section 2), with its reference ID. */
function characterLine(c) {
  if (!c) return '';
  if (typeof c === 'string') return c;
  const ref = c.ref || c.id;
  return `${describe(c, CHARACTER_KEYS)}${ref ? ` [ref: ${ref}]` : ''}`;
}
function productLine(p) {
  if (!p) return '';
  if (typeof p === 'string') return p;
  const text = describe(p, PRODUCT_KEYS) || describe(p);
  return `${text}${p.ref && p.ref !== 'none' ? ` [ref: ${p.ref}]` : ''}`;
}
/** The setting as one line — the same words in every frame and every scene prompt, so the room doesn't change. */
function settingLine(s) {
  if (!s) return '';
  if (typeof s === 'string') return s;
  return describe(s, SETTING_KEYS) || describe(s);
}

// Section 3 on-screen elements → where each placeholder sits, inside the platform safe zones (rendered by Production)
const PLACEHOLDERS = [
  ['super', 'Super', 'lower third, above the caption safe zone'],
  ['callout', 'Callout', 'upper third, right side'],
  ['cta', 'CTA', 'lower third, centred'],
  ['disclaimer', 'Disclaimer', 'small, bottom band above the platform UI'],
  ['ui_mockup', 'UI mock-up', 'composited centre-frame by Production'],
  ['logo', 'Logo', 'top-right corner bug'],
];

/**
 * Does this text name this character (by name, or by a role word)? By default a sentence that rules people out
 * ("anonymous hands — not Priya or Ravi") doesn't count; { ruleOut: false } reads every sentence as written
 * (for "Ravi's hands only, no face visible", where the "no" is about the face).
 */
function mentions(text, c, { ruleOut = true } = {}) {
  const sentences = clean(text).split(/(?<=[.!?;])\s+/);
  const t = (ruleOut ? sentences.filter((s) => !/\b(not|no|never|without|nor)\b/i.test(s)) : sentences).join(' ').toLowerCase();
  if (!t || !c) return false;
  const o = typeof c === 'object' ? c : { name: String(c) };
  const names = [o.name, ...(String(o.role || '').split(/[\s,]+/))].map((x) => clean(x).toLowerCase()).filter((x) => x.length >= 3);
  return names.some((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(t));
}

/** One frame description (Section 4) for a scene, from the writer's note for it and the Context Block. */
function buildFrame(sc, note, cb, aspectRatio) {
  const n = note || {};
  const chars = (cb.characters || []).slice(0, 2);
  const subjectNote = clean(n.subject);
  const inFrame = chars.filter((c) => mentions(subjectNote || sc.visual, c));
  const productNote = clean(n.product);
  const lines = (sc.dialogue || []).filter((d) => clean(d.line)).map((d) => `${d.speaker}: "${d.line}"`);
  if (clean(sc.vo)) lines.push(`VO: "${sc.vo}"`);
  const placed = PLACEHOLDERS.filter(([k]) => !isNone(sc[k])).map(([k, label, where]) => `${label} "${clean(sc[k])}" — ${where}`);
  return {
    scene: sc.n,
    frame: `${aspectRatio} · ${clean(sc.shot) || 'medium'} shot · ${clean(n.camera_angle) || 'eye level'} · camera: ${clean(sc.camera) || 'static'}`,
    composition: clean(n.composition),
    subject: inFrame.length
      ? `${subjectNote || clean(sc.visual)} As in the Context Block: ${inFrame.map(characterLine).join(' | ')}.`
      : (subjectNote || 'No people in frame.'),
    product: isNone(productNote) ? 'Not in frame.' : `${productLine(cb.product)} — ${productNote}`,
    setting_light: settingLine(cb.setting),
    placeholders: placed.length ? placed.join('; ') : 'None in this frame.',
    line: lines.length ? lines.join(' ') : 'No line.',
    approved: false, // approved at Checkpoint 4 (the user approves the script and storyboard together)
  };
}

/** storyboard.json (Section 7) from script.json and the writer's frame notes. */
function buildStoryboard(script, frameNotes = [], { aspectRatio = '9:16', style = '', palette = [], referenceImages = [] } = {}) {
  const cb = script.context_block || {};
  const notes = Array.isArray(frameNotes) ? frameNotes : [];
  const frames = (script.scenes || []).map((sc, i) => buildFrame(sc, notes.find((f) => f && Number(f.scene) === sc.n) || notes[i], cb, aspectRatio));
  return contracts.normalizeStoryboard({
    frames,
    locks: {
      characters: (cb.characters || []).slice(0, 2).map(characterLine).filter(Boolean),
      product: productLine(cb.product),
      reference_images: (referenceImages || []).filter(Boolean),
      style: clean(style),
      palette: (Array.isArray(palette) ? palette : [palette]).map(clean).filter(Boolean),
    },
  });
}

/**
 * The parts of a frame that go into the scene prompt sent to Magnific. Placeholders never go in, and neither does any
 * composition sentence about where a super, callout, CTA or logo sits: text and logos are rendered by Production, and
 * naming them to the video model invites it to draw them (S-M5).
 */
const PLACEHOLDER_TALK = /\b(super|supers|callout|cta|caption|captions|logo|placeholder|placeholders|disclaimer|overlay|text|title)\b/i;
function framePromptText(f) {
  if (!f) return '';
  const composition = String(f.composition || '').split(/(?<=[.;!?])\s+/).filter((s) => s && !PLACEHOLDER_TALK.test(s)).join(' ');
  return [
    f.frame && `Frame: ${f.frame}.`,
    composition && `Composition: ${composition}`,
    f.subject && `Subject: ${f.subject}`,
    f.product && f.product !== 'Not in frame.' && `Product: ${f.product}`,
  ].filter(Boolean).join(' ');
}

module.exports = { buildStoryboard, buildFrame, framePromptText, describe, characterLine, productLine, settingLine, mentions, PLACEHOLDERS, CHARACTER_KEYS, PRODUCT_KEYS, SETTING_KEYS };
