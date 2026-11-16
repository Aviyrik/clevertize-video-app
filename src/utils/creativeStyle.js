// The three Creative Style options. Whichever the user picks drives the spines end to end (Creative Spine
// Section 6 format rules, Script & Storyboard Spine S-M7 dialogue rules). Descriptions are each format's
// "What it looks like" line from the Creative Spine's format table.
const CREATIVE_STYLE_OPTIONS = [
  { id: 'UGC / Creator-style', label: 'UGC / Creator-style', shortLabel: 'UGC', desc: 'A disclosed creator or the founder talks to camera, phone-propped framing.' },
  { id: 'VO-led', label: 'VO-led', shortLabel: 'VO-led', desc: "One voice over moments with the product; people act but don't speak." },
  { id: 'Storytelling', label: 'Storytelling', shortLabel: 'Story', desc: 'A small acted scene: problem, the brand solves it, a warm or witty ending.' },
];

// Saved projects and businesses may hold older values: map each to the nearest of the three
// (kept in step with engine/spines/contracts.js normalizeCreativeStyle).
const LEGACY_STYLE_MAP = [
  [/product[\s-]*focused|product demo|^demo\b|product-led|showcase/i, 'VO-led'],
  [/offer|promotion|promo|discount|sale/i, 'UGC / Creator-style'],
  [/conversational|dialogue|comedy|humou?r|funny|situational|drama|story/i, 'Storytelling'],
  [/\bvo\b|voice[\s-]?over|narrat|vo-led/i, 'VO-led'],
  [/ugc|creator|selfie|testimonial|founder/i, 'UGC / Creator-style'],
];

function normalizeCreativeStyle(value) {
  const v = String(value || '').trim();
  const ids = CREATIVE_STYLE_OPTIONS.map((o) => o.id);
  if (ids.includes(v)) return v;
  const exact = ids.find((id) => id.toLowerCase() === v.toLowerCase());
  if (exact) return exact;
  for (const [re, style] of LEGACY_STYLE_MAP) if (re.test(v)) return style;
  return 'UGC / Creator-style';
}

function creativeStyleShortLabel(value) {
  const id = normalizeCreativeStyle(value);
  return (CREATIVE_STYLE_OPTIONS.find((o) => o.id === id) || CREATIVE_STYLE_OPTIONS[0]).shortLabel;
}

// Support both CommonJS (Node.js test runner) and ES Modules (Vite)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CREATIVE_STYLE_OPTIONS, normalizeCreativeStyle, creativeStyleShortLabel, LEGACY_STYLE_MAP };
}
