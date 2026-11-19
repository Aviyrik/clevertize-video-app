/**
 * engine/understandingSpine.js
 * Dedicated AI Understanding Spine Adapter & Orchestration Layer.
 *
 * NOTE ON ARCHITECTURE & OWNERSHIP (Point 1):
 * This file serves exclusively as the backend adapter and contract orchestrator.
 * It manages input/output normalization, schema validation, outdated brief hashing,
 * and project persistence bindings.
 *
 * The actual reasoning instructions, creative strategy rules, and prompt engineering
 * below are a TEMPORARY placeholder intelligence implementation that will be
 * directly replaced by the dedicated Spine produced by the AI Intelligence team.
 */

const { callClaude } = require('./claude');
const crypto = require('crypto');
const {
  normalizeCreativeGuardrails,
  hashGuardrails,
  hasActiveGuardrails,
  guardrailsContentSignature,
} = require('./guardrails');
const { normalizeCreativeStyle } = require('./spines/contracts');
const {
  normalizeEventContext,
  hasActiveEventContext,
  hashEventContext,
  formatEventPromptBlock,
} = require('./eventContext');
const guardrailsSpine = require('./guardrailsSpine');

/**
 * Valid approval statuses distinguishing user approval vs system/auto approval.
 */
const VALID_APPROVAL_STATUSES = [
  'pending',
  'approved',         // Explicit Director Mode user approval
  'auto_approved',    // Simple Mode silent backend approval
  'system_approved',  // Alias for internal automated approval
  'outdated',         // Brief modified after prior approval
];

/**
 * Standard schema validator ensuring strict compliance with Section 6 contract.
 */
function validateUnderstandingSchema(data) {
  if (!data || typeof data !== 'object') return false;
  return Boolean(
    typeof data.business_understanding === 'string' &&
    typeof data.campaign_objective === 'string' &&
    typeof data.target_audience === 'string' &&
    typeof data.core_communication === 'string' &&
    typeof data.occasion_context === 'string' &&
    data.creative_guardrails &&
    Array.isArray(data.creative_guardrails.dos) &&
    Array.isArray(data.creative_guardrails.donts) &&
    typeof data.creative_opportunity === 'string' &&
    Array.isArray(data.assumptions) &&
    Array.isArray(data.missing_information)
  );
}

/**
 * Hash utility for brief change detection (outdated state detection).
 */
function hashBrief(brief = '') {
  return crypto.createHash('sha256').update(String(brief || '').trim()).digest('hex').slice(0, 16);
}

/**
 * Normalize production settings context so Brief + Settings + Guardrails form
 * a single deterministic source snapshot for AI Understanding & stale checks.
 */
function normalizeUnderstandingSettings(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const language = String(src.language || 'English').trim();
  const creativeStyle = String(src.creativeStyle || src.format || 'UGC / Creator-style').trim();
  const platform = String(src.platform || '').trim();
  // Same precedence as the client's getCurrentProductionSettings: the Settings screen sets aspectRatio and
  // targetDuration (with dimension and duration), and a draft can carry an older duration beside a newer target.
  const rawDim = String(src.aspectRatio || src.dimension || '').trim();
  const dimension = rawDim || (
    platform.includes('16:9') ? '16:9' : platform.includes('1:1') ? '1:1' : '9:16'
  );
  const duration = String(src.targetDuration || src.duration || '20s').trim();
  const hasLogo = Boolean(
    src.hasLogo === true ||
    src.videoLogo ||
    src.brandLogo ||
    src.logoDataUrl ||
    src.logo
  );
  const hasProductPhoto = Boolean(src.hasProductPhoto || src.productPhoto);
  return {
    language,
    creativeStyle,
    dimension,
    duration,
    hasLogo,
    hasProductPhoto,
    platform,
  };
}

const SETTINGS_FINGERPRINT_FIELDS = ['language', 'creativeStyle', 'dimension', 'duration', 'hasLogo'];

/**
 * The production settings an AI Understanding is made from: only what the user picks on the Settings screen
 * (language, style, dimension, duration) and whether a logo is uploaded. The style goes through the legacy-label
 * mapping, so an older stored label and today's name for the same choice are not a change.
 */
function settingsFingerprint(settings = {}) {
  const n = normalizeUnderstandingSettings(settings);
  return {
    language: n.language,
    creativeStyle: normalizeCreativeStyle(n.creativeStyle),
    dimension: n.dimension,
    duration: n.duration,
    hasLogo: n.hasLogo,
  };
}

/**
 * Deterministic hash of campaign production settings (language, dimension, duration, style, logo).
 */
function hashSettings(settings = {}) {
  return crypto.createHash('sha256').update(JSON.stringify(settingsFingerprint(settings))).digest('hex').slice(0, 16);
}

/**
 * Which inputs differ from the ones this interpretation was made from: [] when it's current. Each reason names the
 * part, the value stored with the understanding and the value now, so the outdated banner (and the server log) can
 * say what actually changed.
 */
function explainUnderstandingOutdated(
  understanding,
  currentBrief,
  currentGuardrails = null,
  currentSettings = null,
  currentEventContext = undefined
) {
  // Only what the user edits counts: brief text, Do's and Don'ts content, the Settings screen's choices, an uploaded
  // logo, the occasion they typed. Never a counter, a date, a version number or the stored status label.
  const reasons = [];
  if (!understanding) return reasons;
  const recordedHash = understanding.source_brief_hash;
  if (recordedHash && recordedHash !== hashBrief(currentBrief)) {
    reasons.push({ part: 'brief', stored: String(understanding.source_brief || '').trim(), current: String(currentBrief || '').trim() });
  }

  if (currentGuardrails !== null && currentGuardrails !== undefined) {
    // By content. The version is a counter: it moves on an add-then-remove, or when a save re-normalises the list.
    const norm = normalizeCreativeGuardrails(currentGuardrails);
    const changed = understanding.source_guardrails_hash
      ? understanding.source_guardrails_hash !== hashGuardrails(norm)
      : hasActiveGuardrails(norm); // made before there were any Do's and Don'ts
    if (changed) {
      reasons.push({ part: 'guardrails', stored: understanding.source_guardrails_signature || null, current: guardrailsContentSignature(norm) });
    }
  }

  if (currentSettings !== null && currentSettings !== undefined) {
    const cur = settingsFingerprint(currentSettings);
    if (understanding.source_settings && typeof understanding.source_settings === 'object') {
      const rec = settingsFingerprint(understanding.source_settings);
      for (const k of SETTINGS_FINGERPRINT_FIELDS) {
        if (rec[k] !== cur[k]) reasons.push({ part: `settings.${k}`, stored: rec[k], current: cur[k] });
      }
    } else if (understanding.source_settings_hash && understanding.source_settings_hash !== hashSettings(currentSettings)) {
      reasons.push({ part: 'settings', stored: understanding.source_settings_hash, current: cur });
    }
  }

  if (currentEventContext !== undefined) {
    if (understanding.source_event_hash && understanding.source_event_hash !== hashEventContext(currentEventContext)) {
      reasons.push({ part: 'event', stored: understanding.source_event || null, current: currentEventContext || null });
    }
  }

  return reasons;
}

const SETTING_NAMES = { language: 'language', creativeStyle: 'creative style', dimension: 'video size', duration: 'duration', hasLogo: 'logo' };

/** One plain sentence for the outdated notice: "Your duration changed (20s → 15s)." */
function describeOutdatedReasons(reasons = []) {
  const bits = [];
  for (const r of reasons) {
    if (r.part === 'brief') bits.push('your brief');
    else if (r.part === 'guardrails') bits.push("your Do's and Don'ts");
    else if (r.part === 'event') bits.push('the occasion');
    else if (r.part === 'settings.hasLogo') bits.push(r.current ? 'a logo was added' : 'the logo was removed');
    else if (r.part.startsWith('settings.')) bits.push(`${SETTING_NAMES[r.part.slice(9)]} (${r.stored} → ${r.current})`);
    else if (r.part === 'settings') bits.push('your settings');
  }
  const uniq = [...new Set(bits)];
  return uniq.length ? `Changed since this version was made: ${uniq.join(', ')}.` : '';
}

/**
 * Check if an existing interpretation is outdated compared to the current brief,
 * Creative Guardrails content, and/or Production Settings.
 */
function isUnderstandingOutdated(understanding, currentBrief, currentGuardrails = null, currentSettings = null, currentEventContext = undefined) {
  if (!understanding) return false;
  if (understanding.approval_status === 'outdated') return true;
  return explainUnderstandingOutdated(understanding, currentBrief, currentGuardrails, currentSettings, currentEventContext).length > 0;
}

/**
 * The approval status that holds for the inputs as they are now. An approval made from these exact inputs stands;
 * one made from different inputs is outdated. A stored "outdated" is checked again rather than trusted, so an
 * approval that a save marked outdated by mistake (or whose inputs were changed back) counts as approved again.
 */
function reconcileApproval(understanding, currentBrief, currentGuardrails = null, currentSettings = null, currentEventContext = undefined) {
  if (!understanding || typeof understanding !== 'object') return understanding;
  const status = understanding.approval_status;
  const reasons = explainUnderstandingOutdated(understanding, currentBrief, currentGuardrails, currentSettings, currentEventContext);
  if (reasons.length) {
    return status === 'approved' || status === 'auto_approved' ? { ...understanding, approval_status: 'outdated' } : understanding;
  }
  if (status === 'outdated') return { ...understanding, approval_status: understanding.approved_at ? 'approved' : 'pending' };
  return understanding;
}

function buildVerifiedFacts({
  businessName = '',
  businessType = '',
  town = '',
  websiteUrl = '',
  occasion = '',
  eventContext = null,
  brief = '',
  settings = {},
}) {
  const s = normalizeUnderstandingSettings(settings);
  const ec = normalizeEventContext(eventContext);
  const hasEvent = hasActiveEventContext(ec);
  const facts = [];
  if (businessName) {
    facts.push(`Business: ${String(businessName).trim()}${businessType ? ` (${String(businessType).trim()})` : ''}${town ? ` in ${String(town).trim()}` : ''}`);
  }
  facts.push(`Production Specs: ${s.language}, ${s.duration} duration, ${s.dimension} aspect ratio, ${s.creativeStyle} format`);
  facts.push(`Brand Logo: ${s.hasLogo ? 'Logo provided for video branding' : 'No custom logo selected (text branding only)'}`);
  if (s.hasProductPhoto) {
    facts.push('Product Visual Reference: Product photo uploaded by user');
  }
  if (hasEvent) {
    const parts = [
      ec.name || ec.category,
      ec.timing || null,
      ec.creativeInfluence ? `Influence: ${ec.creativeInfluence}` : null,
    ].filter(Boolean);
    facts.push(`Occasion & Event: ${parts.join(' · ')}`);
  } else if (occasion && String(occasion).trim()) {
    facts.push(`Occasion: ${String(occasion).trim()}`);
  }
  if (websiteUrl && String(websiteUrl).trim()) {
    facts.push(`Website Reference: ${String(websiteUrl).trim()}`);
  }
  if (brief && String(brief).trim()) {
    facts.push('Campaign Brief: Provided by user');
  }
  return facts;
}

/**
 * Filter out false-positive missing_information entries that refer to details
 * already supplied in Settings, Brief, or Business Profile.
 */
function sanitizeMissingInformation(items, { businessName = '', town = '', occasion = '', settings = {}, cleanBrief = '' } = {}) {
  if (!Array.isArray(items)) return [];
  const s = normalizeUnderstandingSettings(settings);
  const blockedPatterns = [
    /\b(video\s+)?language\b/i,
    /\baspect\s+ratio\b|\bdimension(s)?\b|\bformat\s*(ratio|9:16|16:9|1:1)?\b/i,
    /\b(video\s+)?(duration|length|runtime)\b|\bhow\s+long\b/i,
    /\bcreative\s+(style|format)\b|\bad\s+(style|format)\b/i,
    /\b(brand\s+|video\s+)?logo(\s+availability)?\b/i,
    /\btarget\s+platform\b|\bplatform\s+(selection|choice)\b/i,
  ];
  if (businessName && String(businessName).trim()) {
    blockedPatterns.push(/\bbusiness\s+name\b|\bbrand\s+name\b/i);
  }
  if (town && String(town).trim()) {
    blockedPatterns.push(/\blocation\b|\bcity\b|\btown\b|\baddress\b/i);
  }
  if (occasion && String(occasion).trim()) {
    blockedPatterns.push(/\boccasion\b|\bfestival\b|\bevent\s+context\b/i);
  }
  if (cleanBrief && /\b(off|discount|%|rs\.?|₹|\$\d+|price|free|sale)\b/i.test(cleanBrief)) {
    // Do not claim the offer itself is missing when pricing/discount is already written in the brief
    blockedPatterns.push(/^missing offer details$/i);
  }

  return items
    .map((x) => String(x || '').trim())
    .filter(Boolean)
    .filter((entry) => !blockedPatterns.some((rx) => rx.test(entry)));
}

/**
 * Factory for a clean, schema-compliant empty understanding object.
 */
function createEmptyUnderstanding(brief = '') {
  const defaultSettings = normalizeUnderstandingSettings({});
  return {
    business_understanding: '',
    campaign_objective: '',
    target_audience: '',
    core_communication: '',
    occasion_context: '',
    creative_guardrails: {
      dos: [],
      donts: [],
    },
    has_user_guardrails: false,
    creative_opportunity: '',
    verified_facts: [],
    assumptions: [],
    missing_information: [],
    approval_status: 'pending',
    source_brief: String(brief || '').trim(),
    source_brief_hash: hashBrief(brief),
    source_guardrails_version: 0,
    source_guardrails_hash: hashGuardrails(null),
    source_guardrails_signature: guardrailsContentSignature(normalizeCreativeGuardrails(null)),
    source_settings: defaultSettings,
    source_settings_hash: hashSettings(defaultSettings),
    source_event: null,
    source_event_hash: hashEventContext(null),
    version: 1,
    is_mock: false,
    generated_at: new Date().toISOString(),
    approved_at: null,
  };
}

/**
 * Generate structured fallback/mock data conforming to schema.
 * STRICTLY restricted to development/testing environments (Point 2).
 */
function generateLabelledMockUnderstanding({
  businessName = 'The Brand',
  businessType = 'Local Business',
  town = '',
  brief = '',
  occasion = '',
  websiteUrl = '',
  creativeGuardrails = null,
  guardrailAnalysis = null,
  settings = null,
  eventContext = null,
}) {
  const brandLabel = (businessName || 'Your Business').trim();
  const locationLabel = town ? ` in ${town}` : '';
  const cleanBrief = (brief || '').trim();
  const normGuardrails = normalizeCreativeGuardrails(creativeGuardrails);
  const normSettings = normalizeUnderstandingSettings(settings || {});
  const normEvent = normalizeEventContext(eventContext);
  const hasEvent = hasActiveEventContext(normEvent);
  const effectiveOccasionLabel = hasEvent ? (normEvent.name || normEvent.category) : String(occasion || '').trim();
  const userDos = normGuardrails.dos.map((d) => d.text);
  const userDonts = normGuardrails.donts.map((d) => d.text);

  const hasSpecificTiming =
    /\b(valid|until|till|weekend|today|this month|ends|limited|diwali|holi|navratri|eid|christmas|new year|summer|monsoon)\b/i.test(cleanBrief) ||
    Boolean(effectiveOccasionLabel) ||
    Boolean(normEvent.timing);
  const hasSpecificOfferOrProduct = /\b(%|off|discount|free|flat|rs|₹|\$|starter|combo|collection|plan|service|book|order|menu)\b/i.test(cleanBrief);

  const missingItems = [];
  if (!hasSpecificTiming && /\b(discount|offer|sale|off|%)\b/i.test(cleanBrief)) {
    missingItems.push('Offer validity window is not mentioned — matters for deciding whether to add an urgency deadline on the end-card CTA.');
  }
  if (!hasSpecificOfferOrProduct && cleanBrief.length < 40) {
    missingItems.push('Specific signature product or offer detail is brief — matters so scenes can highlight a concrete hero visual and clear value proposition.');
  }

  let occasionSummary = `No specific seasonal event or occasion specified; focus cleanly on everyday brand value in a ${normSettings.dimension} format.`;
  if (hasEvent) {
    const inf = normEvent.creativeInfluence || 'Subtly';
    const timingNote = normEvent.timing ? ` (${normEvent.timing})` : '';
    const noteTail = normEvent.additionalContext ? ` ${normEvent.additionalContext}` : '';
    occasionSummary =
      inf === 'Strongly'
        ? `Anchored strongly around ${effectiveOccasionLabel}${timingNote}, using festive/event energy to elevate the core product offer without inventing unverified event dates or sponsorships.${noteTail}`
        : inf === 'Reference only'
        ? `Mentions ${effectiveOccasionLabel}${timingNote} lightly as contextual timing reference only, keeping the main ad narrative focused on the product brief.${noteTail}`
        : `Interprets ${effectiveOccasionLabel}${timingNote} subtly as warm seasonal backdrop supporting the brand’s core proposition without forcing it as the central premise.${noteTail}`;
  } else if (effectiveOccasionLabel) {
    occasionSummary = `Tied to ${effectiveOccasionLabel}, aligning pacing and mood for seasonal relevance.`;
  }

  return {
    business_understanding: `${brandLabel} operates as a ${businessType.toLowerCase() || 'business'}${locationLabel}, delivering trusted products and services in a ${normSettings.creativeStyle} presentation tailored for ${normSettings.language} viewers.`,
    campaign_objective: cleanBrief
      ? `Promote the core offer: "${cleanBrief.slice(0, 120)}" in a ${normSettings.duration} (${normSettings.dimension}) ${normSettings.creativeStyle} ad, driving immediate viewer interest and inquiries.`
      : `Drive customer attention and inquiries for ${brandLabel} in a ${normSettings.duration} (${normSettings.dimension}) format.`,
    target_audience: `${normSettings.language}-speaking consumers seeking trustworthy ${businessType.toLowerCase() || 'offerings'}${locationLabel} who respond to authentic ${normSettings.creativeStyle} storytelling.`,
    core_communication: cleanBrief
      ? `Highlight: "${cleanBrief.slice(0, 100)}" as the primary, actionable reason to choose ${brandLabel}.`
      : `Position ${brandLabel} as the preferred, trusted destination.`,
    occasion_context: occasionSummary,
    creative_guardrails: {
      dos: userDos.length > 0
        ? userDos
        : [
            `Explicitly state ${brandLabel}'s name and core value proposition.`,
            `Structure pacing tightly for a ${normSettings.duration} ${normSettings.creativeStyle} cut.`,
            normSettings.hasLogo
              ? 'Feature the provided brand logo cleanly in the closing frame.'
              : 'Include a clear on-screen brand name and call-to-action.',
          ],
      donts: userDonts.length > 0
        ? userDonts
        : [
            'Avoid making unverified statistical or medical claims.',
            `Do not overcrowd dialogue beyond what fits comfortably in ${normSettings.duration}.`,
            'Avoid vague pricing statements without context.',
          ],
    },
    guardrail_analysis: guardrailAnalysis || null,
    has_user_guardrails: Boolean(hasActiveGuardrails(normGuardrails)),
    creative_opportunity: `Use a ${normSettings.duration} ${normSettings.creativeStyle} visual arc framed for ${normSettings.dimension} in ${normSettings.language}, grounded in everyday relatable moments for ${brandLabel}.`,
    verified_facts: buildVerifiedFacts({
      businessName,
      businessType,
      town,
      websiteUrl,
      occasion,
      eventContext: hasEvent ? normEvent : null,
      brief: cleanBrief,
      settings: normSettings,
    }),
    assumptions: [
      `Inferred that ${brandLabel} serves standard retail/consumer needs in its category (not explicitly detailed in brief).`,
      `Inferred that visual scenes can follow standard ${normSettings.creativeStyle} tropes in ${normSettings.language}.`,
    ],
    missing_information: sanitizeMissingInformation(missingItems, {
      businessName,
      town,
      occasion: effectiveOccasionLabel,
      settings: normSettings,
      cleanBrief,
    }),
    approval_status: 'pending',
    source_brief: cleanBrief,
    source_brief_hash: hashBrief(cleanBrief),
    source_guardrails_version: normGuardrails.version || 0,
    source_guardrails_hash: hashGuardrails(normGuardrails),
    source_guardrails_signature: guardrailsContentSignature(normGuardrails),
    source_settings: normSettings,
    source_settings_hash: hashSettings(normSettings),
    source_event: hasEvent ? normEvent : null,
    source_event_hash: hashEventContext(hasEvent ? normEvent : null),
    version: 1,
    is_mock: true, // Clearly labelled mock data
    spine_provider: 'mock_understanding_fallback',
    generated_at: new Date().toISOString(),
    approved_at: null,
  };
}

// =========================================================================
// TEMPORARY AI INTELLIGENCE PLACEHOLDER (Point 1)
// Owned by AI Intelligence team. Will be replaced by dedicated Spine.
// =========================================================================
const TEMPORARY_SPINE_SYSTEM_PROMPT = `You are the CleverCut AI Understanding Spine, a creative strategy intelligence engine.
Analyze the user's submitted creative brief, business profile, Creative Guardrails, AND confirmed production settings (language, video dimension/aspect ratio, video duration, creative format/style, logo availability).
Structure the complete campaign context into a rigorous, professional creative understanding before Creative Idea Generation.

Strict Guidelines:
1. Do not fabricate business facts, product benefits, customer claims, or invent settings/production preferences not supplied by the user.
2. Clearly distinguish verified user-provided facts (from Brief, Business Profile, and Production Settings) from AI inferences ("assumptions").
3. NEVER mark information as missing if it is already available in the Brief, Production Settings (language, aspect ratio/dimension, video length/duration, creative format/style, logo availability), saved project, or business profile.
4. Distinguish genuinely missing critical information from optional details that are unnecessary — do not treat optional fields (e.g., website or optional logo) as mandatory or missing.
5. Whenever an entry is listed in "missing_information", explain WHY it matters for making an accurate ad rather than listing a bare label. If the Brief, Settings, and Profile give enough context to generate strong ideas, return an empty array [] for "missing_information".
6. Preserve original instructions, tone restrictions, and brand guardrails verbatim.
7. Return ONLY a valid JSON object matching the required schema below. No markdown fences, no conversational preambles.

Required JSON Structure:
{
  "business_understanding": "string",
  "campaign_objective": "string",
  "target_audience": "string",
  "core_communication": "string",
  "occasion_context": "string",
  "creative_guardrails": {
    "dos": ["string"],
    "donts": ["string"]
  },
  "creative_opportunity": "string",
  "assumptions": ["string"],
  "missing_information": ["string"]
}`;

function buildTemporarySpineUserPrompt({
  businessName,
  businessType,
  town,
  websiteUrl,
  language,
  brandTone,
  occasion,
  cleanBrief,
  userCorrections,
  previousUnderstanding,
  creativeGuardrails,
  guardrailAnalysis,
  settings,
  eventContext,
}) {
  const norm = normalizeCreativeGuardrails(creativeGuardrails);
  const s = normalizeUnderstandingSettings(settings || { language });
  const ec = normalizeEventContext(eventContext);
  const hasEvent = hasActiveEventContext(ec);
  const eventBlock = hasEvent ? `\n\n${formatEventPromptBlock(ec)}` : '';
  const hasG = hasActiveGuardrails(norm);
  const gText = hasG
    ? `\nUser-Defined Creative Guardrails (Must preserve intent cleanly):\nMust Follow (Do's): ${norm.dos.map((d) => `[${d.priority}] ${d.text}`).join(' | ') || 'None'}\nMust Avoid (Don'ts): ${norm.donts.map((d) => `[${d.priority}] ${d.text}`).join(' | ') || 'None'}`
    : '';
  const conflictText = guardrailAnalysis && Array.isArray(guardrailAnalysis.conflicts) && guardrailAnalysis.conflicts.length
    ? `\nDetected Guardrail Conflicts: ${guardrailAnalysis.conflicts.map((c) => c.description).join(' | ')}`
    : '';

  return `Analyze this complete campaign context and produce the structured understanding:

=== VERIFIED BUSINESS PROFILE ===
Business Name: ${businessName || 'Not specified'}
Business Category: ${businessType || 'General Retail'}
Location: ${town || 'Not specified'}
Website (optional): ${websiteUrl || 'Not provided (optional)'}
Brand Tone: ${brandTone}${(!hasEvent && occasion) ? `\nOccasion Context (optional): ${occasion}` : ''}

=== VERIFIED PRODUCTION SETTINGS (ALREADY CONFIRMED — DO NOT FLAG AS MISSING) ===
Selected Language: ${s.language}
Video Dimension / Aspect Ratio: ${s.dimension}
Video Duration: ${s.duration}
Creative Style / Format: ${s.creativeStyle}
Brand Logo Availability: ${s.hasLogo ? 'Brand logo provided' : 'No custom logo selected (use brand name typography)'}
Product Visual Reference: ${s.hasProductPhoto ? 'Product reference image provided' : 'None uploaded (optional)'}

=== ORIGINAL CREATIVE BRIEF ===
"""
${cleanBrief}
"""${eventBlock}${gText}${conflictText}
${userCorrections ? `User corrections / refinement notes for this regeneration:\n"""\n${userCorrections}\n"""` : ''}
${previousUnderstanding ? `Previous interpretation was:\n${JSON.stringify(previousUnderstanding, null, 2)}` : ''}

Important: If no Occasion & Event context was supplied above, do NOT invent an event or festival — set occasion_context cleanly as general promotional timing. Never invent event dates, fixtures, results, or sponsorships.
Output ONLY the JSON object.`;
}

/**
 * Execute AI Understanding Spine.
 * Point 2: In production (NODE_ENV === 'production'), mock fallback is strictly forbidden.
 */
async function generateAiUnderstanding({
  businessName = '',
  businessType = 'Local Business',
  town = '',
  brief = '',
  language = 'English',
  brandTone = 'Warm & Authentic',
  occasion = '',
  websiteUrl = '',
  creativeStyle = 'UGC / Creator-style',
  format = '',
  dimension = '',
  aspectRatio = '',
  duration = '',
  targetDuration = '',
  platform = '',
  hasLogo = false,
  videoLogo = null,
  brandLogo = null,
  logoDataUrl = null,
  logo = null,
  hasProductPhoto = false,
  productPhoto = null,
  settings = null,
  eventContext = null,
  userCorrections = '',
  previousUnderstanding = null,
  creativeGuardrails = null,
}) {
  const cleanBrief = String(brief || '').trim();
  if (!cleanBrief) {
    throw new Error('A creative brief is required to generate AI Understanding.');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const normGuardrails = normalizeCreativeGuardrails(creativeGuardrails);
  const normEvent = normalizeEventContext(eventContext);
  const hasEvent = hasActiveEventContext(normEvent);
  const normSettings = normalizeUnderstandingSettings(
    settings || {
      language,
      creativeStyle: creativeStyle || format,
      dimension: dimension || aspectRatio,
      duration: duration || targetDuration,
      platform,
      hasLogo,
      videoLogo,
      brandLogo,
      logoDataUrl,
      logo,
      hasProductPhoto,
      productPhoto,
    }
  );

  // Interpret Creative Guardrails through Shubhiksha's modular Guardrails Spine adapter
  let guardrailAnalysis = null;
  if (hasActiveGuardrails(normGuardrails)) {
    guardrailAnalysis = await guardrailsSpine.interpretGuardrails({
      creativeGuardrails: normGuardrails,
      businessName,
      businessType,
      town,
      brief: cleanBrief,
      language: normSettings.language,
    });
  }

  // Point 2: Guard against mock fallback in production
  if (!apiKey) {
    if (isProduction) {
      throw new Error('AI Understanding service unavailable in production: ANTHROPIC_API_KEY is not configured.');
    }
    const mock = generateLabelledMockUnderstanding({
      businessName,
      businessType,
      town,
      brief: cleanBrief,
      occasion,
      websiteUrl,
      creativeGuardrails: normGuardrails,
      guardrailAnalysis,
      settings: normSettings,
      eventContext: hasEvent ? normEvent : null,
    });
    if (userCorrections && previousUnderstanding) {
      mock.version = (previousUnderstanding.version || 1) + 1;
      mock.user_notes = userCorrections;
    }
    return mock;
  }

  if (process.env.MOCK_SPINE === 'true') {
    if (isProduction) {
      throw new Error('MOCK_SPINE is strictly disabled in production.');
    }
    const mock = generateLabelledMockUnderstanding({
      businessName,
      businessType,
      town,
      brief: cleanBrief,
      occasion,
      websiteUrl,
      creativeGuardrails: normGuardrails,
      guardrailAnalysis,
      settings: normSettings,
      eventContext: hasEvent ? normEvent : null,
    });
    // numbered like the live spine's versions, so a regenerate reads as a new version in test mode too
    if (previousUnderstanding) mock.version = (previousUnderstanding.version || 1) + 1;
    if (userCorrections) mock.user_notes = userCorrections;
    return mock;
  }

  const system = TEMPORARY_SPINE_SYSTEM_PROMPT;
  const userPrompt = buildTemporarySpineUserPrompt({
    businessName,
    businessType,
    town,
    websiteUrl,
    language: normSettings.language,
    brandTone,
    occasion,
    cleanBrief,
    userCorrections,
    previousUnderstanding,
    creativeGuardrails: normGuardrails,
    guardrailAnalysis,
    settings: normSettings,
    eventContext: hasEvent ? normEvent : null,
  });

  try {
    const raw = await callClaude({
      system,
      content: userPrompt,
      maxTokens: 2500,
      thinking: false,
    });

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI Understanding Spine returned invalid JSON format.');
    const parsed = JSON.parse(match[0]);

    if (!validateUnderstandingSchema(parsed)) {
      throw new Error('AI Understanding Spine output failed schema validation.');
    }

    const version = previousUnderstanding ? (previousUnderstanding.version || 1) + 1 : 1;

    // Preserve any user-authored guardrails cleanly without losing them if model omitted one
    const aiDos = Array.isArray(parsed.creative_guardrails?.dos) ? parsed.creative_guardrails.dos : [];
    const aiDonts = Array.isArray(parsed.creative_guardrails?.donts) ? parsed.creative_guardrails.donts : [];
    const mergedDos = [...normGuardrails.dos.map((d) => d.text), ...aiDos.filter((x) => !normGuardrails.dos.some((d) => d.text.toLowerCase() === String(x).toLowerCase()))];
    const mergedDonts = [...normGuardrails.donts.map((d) => d.text), ...aiDonts.filter((x) => !normGuardrails.donts.some((d) => d.text.toLowerCase() === String(x).toLowerCase()))];

    return {
      business_understanding: String(parsed.business_understanding || '').trim(),
      campaign_objective: String(parsed.campaign_objective || '').trim(),
      target_audience: String(parsed.target_audience || '').trim(),
      core_communication: String(parsed.core_communication || '').trim(),
      occasion_context: String(parsed.occasion_context || '').trim(),
      creative_guardrails: {
        dos: mergedDos,
        donts: mergedDonts,
      },
      guardrail_analysis: guardrailAnalysis || null,
      has_user_guardrails: Boolean(hasActiveGuardrails(normGuardrails)),
      creative_opportunity: String(parsed.creative_opportunity || '').trim(),
      verified_facts: buildVerifiedFacts({
        businessName,
        businessType,
        town,
        websiteUrl,
        occasion,
        eventContext: hasEvent ? normEvent : null,
        brief: cleanBrief,
        settings: normSettings,
      }),
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
      missing_information: sanitizeMissingInformation(
        Array.isArray(parsed.missing_information) ? parsed.missing_information : [],
        { businessName, town, occasion: hasEvent ? (normEvent.name || normEvent.category) : occasion, settings: normSettings, cleanBrief }
      ),
      approval_status: 'pending',
      source_brief: cleanBrief,
      source_brief_hash: hashBrief(cleanBrief),
      source_guardrails_version: normGuardrails.version || 0,
      source_guardrails_hash: hashGuardrails(normGuardrails),
      source_guardrails_signature: guardrailsContentSignature(normGuardrails),
      source_settings: normSettings,
      source_settings_hash: hashSettings(normSettings),
      source_event: hasEvent ? normEvent : null,
      source_event_hash: hashEventContext(hasEvent ? normEvent : null),
      version,
      is_mock: false,
      spine_provider: 'anthropic_claude',
      generated_at: new Date().toISOString(),
      approved_at: null,
      user_notes: userCorrections || undefined,
    };
  } catch (err) {
    // Point 2: If the actual AI service fails in production, do NOT mask it with mock data
    if (isProduction) {
      console.error('[understandingSpine] Spine generation failed in production:', err.message);
      throw new Error(`AI Understanding Spine failed in production: ${err.message}. Downstream generation aborted.`);
    }

    console.warn('[understandingSpine] Spine generation error in dev/test, using clearly-labelled fallback:', err.message);
    const fallback = generateLabelledMockUnderstanding({
      businessName,
      businessType,
      town,
      brief: cleanBrief,
      occasion,
      websiteUrl,
      creativeGuardrails: normGuardrails,
      guardrailAnalysis,
      settings: normSettings,
      eventContext: hasEvent ? normEvent : null,
    });
    fallback.error_fallback = err.message;
    return fallback;
  }
}

module.exports = {
  generateAiUnderstanding,
  validateUnderstandingSchema,
  createEmptyUnderstanding,
  normalizeUnderstandingSettings,
  hashBrief,
  hashSettings,
  isUnderstandingOutdated,
  explainUnderstandingOutdated,
  describeOutdatedReasons,
  reconcileApproval,
  settingsFingerprint,
  SETTINGS_FINGERPRINT_FIELDS,
  sanitizeMissingInformation,
  buildVerifiedFacts,
  VALID_APPROVAL_STATUSES,
  TEMPORARY_SPINE_SYSTEM_PROMPT,
};
