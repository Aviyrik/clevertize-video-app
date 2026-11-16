/**
 * engine/spines/briefSpine.js — Brief Spine adapter (spine 1).
 * Owns /api/research (Sections 2–3), /api/research/url (Section 1b scraper), /api/creative/ai-understanding
 * (Checkpoint 1 + brief.json), /api/projects/:id/guardrails (Section 1d) and the festival/event context
 * (Sections 4.4–4.5). Output: brief.json (Section 7) — the only thing the Creative Spine receives.
 *
 * Builds on the existing modules rather than duplicating them (they belong to the AI Intelligence team):
 *   - understandingSpine.js produces the polished brief the user approves at Checkpoint 1 (Section 5b);
 *   - guardrailsSpine.js interprets the Do's and Don'ts (Section 1d) — read here, never re-implemented.
 * The rules come from engine/spines/brief.md; this file only maps the app's inputs and enforces the contract.
 */

const { callClaude } = require('../claude');
const { parseJSONBlock } = require('../parse');
const { loadSpine } = require('./index');
const contracts = require('./contracts');

const clean = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());

// The dashboard's platform choice → platform names the brief uses
function platformsOf(platform) {
  const p = clean(platform);
  if (!p) return ['Meta Reels', 'YouTube Shorts']; // 1c default
  if (/multi/i.test(p)) return ['Meta Reels', 'YouTube Shorts'];
  const name = p.split('/')[0].trim();
  return [name || p];
}

// B-M5 + S-M2: Hindi/Marathi (and Hinglish, as the app writes it) in Devanagari, other Indian languages in their
// own script, Roman only when the brand voice is Roman (the app's "roman" test mode) or the language is English.
function languageOf(language, scriptMode) {
  const name = clean(language) || 'English';
  const l = name.toLowerCase();
  let script = 'Latin';
  if (/hindi|hinglish|marathi/.test(l)) script = scriptMode === 'roman' ? 'Latin' : 'Devanagari';
  else if (/tamil/.test(l)) script = 'Tamil';
  else if (/telugu/.test(l)) script = 'Telugu';
  else if (/kannada/.test(l)) script = 'Kannada';
  else if (/malayalam/.test(l)) script = 'Malayalam';
  else if (/bengali|bangla/.test(l)) script = 'Bengali';
  else if (/gujarati/.test(l)) script = 'Gujarati';
  else if (/punjabi/.test(l)) script = 'Gurmukhi';
  return { name, script };
}

function lengthOf(duration) {
  const n = parseInt(clean(duration), 10);
  return [15, 20, 30].includes(n) ? n : 20; // 1c default 20s
}

/**
 * Section 1: map what the app already collects onto the spine's fields, and tag each prefilled / unknown.
 * No new form fields: anything the form doesn't collect is left for the spine to infer (B-M6, Section 5b).
 */
function buildBriefInputs({ form = {}, understanding = null, creativeGuardrails = null, guardrailAnalysis = null, eventContext = null, festivals = null, research = null, previousCampaigns = [] } = {}) {
  const f = form || {};
  const style = contracts.normalizeCreativeStyle(f.creativeStyle);
  const format = contracts.filmFormatOf(style);
  const aspect = clean(f.aspectRatio || f.dimension) || (/16:9/.test(f.platform || '') ? '16:9' : /1:1/.test(f.platform || '') ? '1:1' : '9:16');
  const hasLogo = Boolean(f.hasLogo || (f.logo && (f.logo.data || typeof f.logo === 'string')) || f.videoLogo || f.brandLogo);
  const hasProductPhoto = Boolean(f.hasProductPhoto || (f.productPhoto && f.productPhoto.data));
  const fields = {
    BRAND_NAME: clean(f.businessName),
    CATEGORY: clean(f.businessType),
    CITY: [clean(f.area), clean(f.town)].filter(Boolean).join(', '),
    CONTACT: clean(f.contact),
    URL: clean(f.websiteUrl),
    LOGO: hasLogo ? 'provided' : '',
    BRAND_TONE: clean(f.brandTone),
    AUDIENCE: clean(f.targetAudience),
    PRODUCT: clean(f.productName || f.product || f.specialty),
    OFFER: clean(f.offer),
    PRODUCT_IMAGES: hasProductPhoto ? 'product photo attached' : '',
    BUSINESS_PROBLEM: '',
    OBJECTIVE: '',
    PLATFORMS: clean(f.platform),
    FORMATS: `${aspect}, ${lengthOf(f.targetDuration || f.duration)}s`,
    LANGUAGE: clean(f.language) || 'English',
    OCCASION: clean(f.occasion) || (eventContext && (eventContext.name || eventContext.category)) || '',
    PREVIOUS_CAMPAIGNS: previousCampaigns && previousCampaigns.length ? `${previousCampaigns.length} previous script record(s)` : '',
  };
  const field_status = {};
  for (const [k, v] of Object.entries(fields)) field_status[k] = v ? 'prefilled' : 'unknown';
  // 1c defaults that the spine fills itself
  if (!fields.PLATFORMS) field_status.PLATFORMS = 'inferred';
  if (!fields.LANGUAGE) field_status.LANGUAGE = 'inferred';

  // 1d: the user's Do's and Don'ts (already interpreted by guardrailsSpine) + the Creative Style as a binding "must"
  const userDos = [];
  const g = creativeGuardrails && typeof creativeGuardrails === 'object' ? creativeGuardrails : { dos: [], donts: [] };
  for (const d of g.dos || []) userDos.push({ rule: clean(d.text), type: 'Must include', strength: d.priority === 'preference' ? 'prefer' : 'must', source: 'user', applies_to: ['idea', 'script', 'video'] });
  for (const d of g.donts || []) userDos.push({ rule: clean(d.text), type: 'Must not include', strength: d.priority === 'preference' ? 'prefer' : 'must', source: 'user', applies_to: ['idea', 'script', 'video'] });
  userDos.push(contracts.filmFormatRule(format));

  const forced = {
    company: {
      brand: fields.BRAND_NAME, category: fields.CATEGORY, city: fields.CITY, url: fields.URL,
      contact: fields.CONTACT, logo: fields.LOGO, tone: fields.BRAND_TONE, offer: fields.OFFER,
      ...(fields.PRODUCT ? { product: fields.PRODUCT } : {}),
      product_images: hasProductPhoto ? ['product_photo'] : [],
    },
    platforms: platformsOf(f.platform),
    formats: { aspect_ratios: [aspect], lengths_s: [lengthOf(f.targetDuration || f.duration)] },
    language: languageOf(f.language, f.scriptMode),
    mandatories: { logo: hasLogo, product_images: hasProductPhoto ? ['product_photo'] : [], offer: fields.OFFER, cta: clean(f.callToAction || f.cta || '') || (fields.CONTACT ? `Call ${fields.CONTACT}` : '') },
    dos_donts: userDos.filter((d) => d.rule),
    // The user's own event (Occasion & Event section): kept as given; its influence level and notes go in "fit"
    occasion: eventContext && (eventContext.name || eventContext.category)
      ? {
          event: clean(eventContext.name || eventContext.category),
          date: clean(eventContext.timing || eventContext.date || ''),
          fit: [eventContext.creativeInfluence && `The user asked for this event to shape the film: ${clean(eventContext.creativeInfluence)}.`, clean(eventContext.additionalContext)].filter(Boolean).join(' '),
        }
      : null,
  };

  return {
    film_format: format,
    creative_style: style,
    fields,
    field_status,
    forced,
    user_brief_text: clean(f.brief),
    polished_brief_from_checkpoint: understanding || null,
    guardrail_analysis: guardrailAnalysis || null,
    event_context: eventContext || null,
    festival_calendar: festivals && Array.isArray(festivals.moments) ? festivals.moments.slice(0, 20) : [],
    research: research || null,
    previous_campaigns: (previousCampaigns || []).slice(-3),
  };
}

const RUN_BRIEF = `=== RUN NOW (CleverCut app) ===
You are running the Brief Spine above for one film inside the CleverCut app.
- The app has already collected Section 1 from the dashboard form and the business profile (FIELDS, tagged in FIELD_STATUS). The app shows Checkpoint 1 itself, so do not ask questions: infer what is unknown from what is given, mark it "inferred" in field_status, and list it in polished_brief.assumptions.
- POLISHED_BRIEF_FROM_CHECKPOINT is the polished brief the user sees and approves at Checkpoint 1 (Section 5b). Keep brief.json consistent with it.
- This run has no live web access. Use only RESEARCH (the research step's Sections 2–3 output), the URL research already in FIELDS, and the other inputs. Never invent statistics, ratings, ad counts or benchmarks: write "no benchmark found", suggest a starting target and mark it for learning, or leave the field empty. Every external fact carries {source, date, confidence}.
- FESTIVAL_CALENDAR is the app's festival and commerce calendar for the next 45 days; score moments with Section 4.5. If EVENT_CONTEXT is set, the user chose that event.
- Keep every item in DOS_DONTS unchanged (B-M13), including the "Film format" rule. You may add brand or category items (B-M11) with source "brand" or "category".
- If the brief is off-limits under B-M12, return only {"off_limits": "<one polite sentence>"}.
Run Sections 4, 4.5, 5 and 5b, then return exactly brief.json (Section 7) between @@JSON@@ and @@END@@, and nothing else.`;

function mergeDosDonts(forcedList, llmList) {
  const out = [...forcedList];
  const seen = new Set(out.map((d) => d.rule.toLowerCase()));
  for (const d of llmList || []) {
    if (!d || !d.rule || seen.has(String(d.rule).toLowerCase())) continue;
    if (d.source === 'user' || contracts.FILM_FORMAT_RULE_RE.test(d.rule)) continue; // user items come only from the user
    seen.add(String(d.rule).toLowerCase());
    out.push(d);
  }
  return out;
}

/** Overlay the user's own facts on the spine's output (Section 5b: where they disagree, the user's words win). */
function applyForced(brief, inputs, today) {
  const b = contracts.normalizeBrief(brief);
  const fc = inputs.forced;
  b.date = today;
  for (const [k, v] of Object.entries(fc.company)) if (v !== '' && !(Array.isArray(v) && !v.length && k !== 'product_images')) b.company[k] = v;
  b.company.product_images = fc.company.product_images;
  b.platforms = fc.platforms;
  b.formats = fc.formats;
  b.language = fc.language;
  b.mandatories = { ...b.mandatories, ...fc.mandatories, disclaimers: b.mandatories.disclaimers };
  b.dos_donts = contracts.normalizeBrief({ dos_donts: mergeDosDonts(fc.dos_donts, b.dos_donts) }).dos_donts;
  if (fc.occasion) b.occasion = { ...b.occasion, event: fc.occasion.event, date: fc.occasion.date || b.occasion.date, fit: [fc.occasion.fit, b.occasion.fit].filter(Boolean).join(' ') };
  b.field_status = { ...b.field_status, ...inputs.field_status };
  return contracts.normalizeBrief(b);
}

function offLimitsError(message) {
  const err = new Error(message || 'This brief is outside what CleverCut can make an ad for.');
  err.status = 422;
  err.code = 'BRIEF_OFF_LIMITS';
  return err;
}

/** Runs the Brief Spine and returns brief.json. */
async function runBriefSpine(inputs, { call = callClaude, today } = {}) {
  const spine = loadSpine('brief');
  const date = today || new Date().toISOString().slice(0, 10);
  const content = [
    `TODAY: ${date}`,
    `FIELDS (Section 1): ${JSON.stringify(inputs.fields)}`,
    `FIELD_STATUS: ${JSON.stringify(inputs.field_status)}`,
    `USER'S BRIEF TEXT: """${inputs.user_brief_text}"""`,
    `POLISHED_BRIEF_FROM_CHECKPOINT: ${JSON.stringify(inputs.polished_brief_from_checkpoint || null)}`,
    `DOS_DONTS (Section 1d): ${JSON.stringify(inputs.forced.dos_donts)}`,
    `GUARDRAIL_ANALYSIS: ${JSON.stringify(inputs.guardrail_analysis || null)}`,
    `EVENT_CONTEXT: ${JSON.stringify(inputs.event_context || null)}`,
    `FESTIVAL_CALENDAR: ${JSON.stringify(inputs.festival_calendar)}`,
    `RESEARCH (Sections 2–3): ${JSON.stringify(inputs.research || null)}`,
    `PREVIOUS_CAMPAIGNS: ${JSON.stringify(inputs.previous_campaigns)}`,
    `DELIVERABLES: platforms ${JSON.stringify(inputs.forced.platforms)}, formats ${JSON.stringify(inputs.forced.formats)}, language ${JSON.stringify(inputs.forced.language)}`,
  ].join('\n\n');
  // Section 5 requires one objective; the polished brief one SMP. An answer without them is retried once, then
  // treated as a model failure (the caller falls back or reports it) rather than passed downstream incomplete.
  const usable = (p) => p && (p.off_limits || (p.objective && p.objective.stage && p.smp));
  let parsed = null;
  for (let attempt = 0; attempt < 2 && !usable(parsed); attempt++) {
    const raw = await call({ system: `${spine.text}\n\n${RUN_BRIEF}`, content, maxTokens: 6000, thinking: false });
    try { parsed = parseJSONBlock(raw); } catch (_) { parsed = null; }
  }
  if (!usable(parsed)) throw new Error('The Brief Spine did not return a complete brief.json (objective and SMP).');
  if (parsed && parsed.off_limits) throw offLimitsError(String(parsed.off_limits));
  const brief = applyForced(parsed || {}, inputs, date);
  return { brief, spineVersion: spine.version };
}

/** brief.json from the inputs alone, when the model can't be reached (non-production only, like the mock understanding). */
function fallbackBrief(inputs, { today } = {}) {
  const date = today || new Date().toISOString().slice(0, 10);
  const pb = inputs.polished_brief_from_checkpoint || {};
  return applyForced({
    business_problem: inputs.user_brief_text,
    objective: { stage: 'Conversion', statement: pb.campaign_objective || '' },
    kpis: [{ name: 'CTR', target: '', primary: true, benchmark: { range: 'no benchmark found', source: '', date: '', confidence: 'Low' } }],
    four_c: { consumer: { persona: { description: inputs.fields.AUDIENCE || pb.target_audience || '' } }, gap: pb.creative_opportunity || '' },
    smp: pb.core_communication || '',
    polished_brief: { problem: inputs.user_brief_text, human_problem: '', think_feel_do: [], assumptions: pb.assumptions || [] },
  }, inputs, date);
}

// ---------- Sections 2–3: research (/api/research) ----------

const RUN_RESEARCH = `=== RUN NOW (CleverCut app) ===
Run Section 2 (Prompt R1 – Company scan) and Section 3 (Prompt R2 – Competitor scan) of the Brief Spine above for the company in FIELDS.
This run has no live web access: use only what you reliably know about this brand and category and what FIELDS give. Never invent statistics, ratings, ad counts or reviews. Mark every item with {source, date, confidence}; when you are not sure, say "unknown" and use confidence "Low". Use competitor work only to find the gap; never copy lines.
Then list the required Section 1 fields still unknown, and at most one question for the most important one (B-M6: never ask what the inputs already answer).
Return only JSON between @@JSON@@ and @@END@@:
{"company_scan": {"positioning": "", "range": "", "hero_product": "", "price_position": "", "assets": [], "proof": [], "past_messaging": [], "voice": "", "praise": [], "complaints": [], "sources": [{"fact": "", "source": "", "date": "", "confidence": "High|Med|Low"}]},
 "competitors": [{"name": "", "direct": true, "positioning": "", "active_ads": null, "formats": [], "hooks": [], "messages": [], "tone_and_look": "", "complaints": [], "white_space": "", "source": "", "confidence": "High|Med|Low"}],
 "white_space": "", "unknown_required_fields": [],
 "question": {"field": "", "question": "", "options": [], "rationale": ""} }`;

async function runResearch({ form = {}, call = callClaude } = {}) {
  const spine = loadSpine('brief');
  const inputs = buildBriefInputs({ form });
  const raw = await call({
    system: `${spine.text}\n\n${RUN_RESEARCH}`,
    content: `FIELDS (Section 1): ${JSON.stringify(inputs.fields)}\nFIELD_STATUS: ${JSON.stringify(inputs.field_status)}\nUSER'S BRIEF TEXT: """${inputs.user_brief_text}"""`,
    maxTokens: 3000,
    thinking: false,
  });
  const r = parseJSONBlock(raw) || {};
  const scan = r.company_scan || {};
  const comps = Array.isArray(r.competitors) ? r.competitors.slice(0, 7) : [];
  const q = r.question && r.question.question ? r.question : null;
  return {
    spine: 'brief',
    company_scan: scan,
    competitors: comps,
    white_space: r.white_space || '',
    unknown_required_fields: Array.isArray(r.unknown_required_fields) ? r.unknown_required_fields : [],
    // fields the research panel already shows
    tier: comps.length ? 1 : 0,
    tierLabel: 'Company & competitor scan (Brief Spine, Sections 2–3)',
    brandFootprint: scan.positioning || '',
    audienceInsight: [...(scan.praise || []).slice(0, 1), ...(scan.complaints || []).slice(0, 1)].join(' · '),
    creativeOpportunity: r.white_space || '',
    competitivePattern: comps.map((c) => `${c.name}: ${(c.messages || [])[0] || c.positioning || ''}`).filter(Boolean).slice(0, 3).join(' | '),
    categoryTension: (scan.complaints || [])[0] || '',
    informationGap: q ? { question: q.question, options: Array.isArray(q.options) ? q.options.slice(0, 4) : [], rationale: q.rationale || '' } : null,
    sources: (scan.sources || []).map((s) => s.source).filter(Boolean).slice(0, 6),
  };
}

/** The user changed Creative Style after the brief was built: swap the binding "Film format" rule (B-M9). */
function withFilmFormat(brief, creativeStyle) {
  const b = contracts.normalizeBrief(brief);
  if (!creativeStyle) return b;
  const format = contracts.filmFormatOf(creativeStyle);
  if (contracts.filmFormatFromBrief(b) === format && b.dos_donts.some((d) => contracts.FILM_FORMAT_RULE_RE.test(d.rule))) return b;
  b.dos_donts = [contracts.filmFormatRule(format), ...b.dos_donts.filter((d) => !contracts.FILM_FORMAT_RULE_RE.test(d.rule))];
  return b;
}

module.exports = { buildBriefInputs, runBriefSpine, fallbackBrief, applyForced, runResearch, withFilmFormat, languageOf, platformsOf, offLimitsError, RUN_BRIEF, RUN_RESEARCH };
