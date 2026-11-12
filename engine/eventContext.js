/**
 * engine/eventContext.js
 * Modular Occasion & Event Context Model, Normalization, Hashing, DB Resolution, and Prompt Formatting.
 *
 * Kept intentionally separate from `creativeGuardrails` (Do's & Don'ts) so campaign
 * occasion/event context has its own optional lifecycle and influence controls.
 */

const crypto = require('crypto');

const VALID_EVENT_CATEGORIES = ['Festivals', 'Occasions', 'Sports & Events', 'Other'];

const VALID_INFLUENCES = {
  strongly: 'Strongly',
  subtly: 'Subtly',
  reference_only: 'Reference only',
};

function normalizeCategory(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const match = VALID_EVENT_CATEGORIES.find((c) => c.toLowerCase() === s.toLowerCase());
  return match || 'Other';
}

function normalizeInfluence(raw, hasEventNameOrDetails = false) {
  const s = String(raw || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (s === 'strongly' || s === 'strong') return 'Strongly';
  if (s === 'subtly' || s === 'subtle') return 'Subtly';
  if (s === 'reference_only' || s === 'reference') return 'Reference only';
  return hasEventNameOrDetails ? 'Subtly' : '';
}

function eventContentSignature(ec) {
  if (!ec || typeof ec !== 'object') return 'EMPTY';
  return JSON.stringify({
    category: String(ec.category || '').trim(),
    name: String(ec.name || '').trim(),
    timing: String(ec.timing || '').trim(),
    creativeInfluence: String(ec.creativeInfluence || '').trim(),
    additionalContext: String(ec.additionalContext || '').trim(),
  });
}

function hasActiveEventContext(raw) {
  if (!raw || typeof raw !== 'object') return false;
  return Boolean(
    String(raw.name || '').trim() ||
    String(raw.timing || '').trim() ||
    String(raw.additionalContext || '').trim() ||
    String(raw.category || '').trim()
  );
}

/**
 * Normalize an incoming eventContext payload while maintaining stable versioning.
 * Never invents or prefills an event when inputs are empty.
 */
function normalizeEventContext(raw, existing = null) {
  if (!raw || typeof raw !== 'object') {
    if (existing && typeof existing === 'object' && hasActiveEventContext(existing)) {
      return normalizeEventContext(existing, null);
    }
    return {
      category: '',
      name: '',
      timing: '',
      creativeInfluence: '',
      additionalContext: '',
      version: 0,
      updatedAt: null,
    };
  }

  const name = String(raw.name || '').trim();
  const timing = String(raw.timing || '').trim();
  const additionalContext = String(raw.additionalContext || '').trim();
  const rawCategory = String(raw.category || '').trim();
  const hasAnyContent = Boolean(name || timing || additionalContext || rawCategory);

  if (!hasAnyContent) {
    const prevVersion = existing && typeof existing === 'object' ? Number(existing.version) || 0 : 0;
    return {
      category: '',
      name: '',
      timing: '',
      creativeInfluence: '',
      additionalContext: '',
      version: prevVersion > 0 && hasActiveEventContext(existing) ? prevVersion + 1 : 0,
      updatedAt: null,
    };
  }

  const category = rawCategory ? normalizeCategory(rawCategory) : '';
  const hasEvent = Boolean(name);
  const creativeInfluence = normalizeInfluence(raw.creativeInfluence, hasEvent);

  const candidate = {
    category,
    name,
    timing,
    creativeInfluence,
    additionalContext,
  };

  if (existing && typeof existing === 'object') {
    const prevNorm = {
      category: String(existing.category || '').trim(),
      name: String(existing.name || '').trim(),
      timing: String(existing.timing || '').trim(),
      creativeInfluence: String(existing.creativeInfluence || '').trim(),
      additionalContext: String(existing.additionalContext || '').trim(),
    };
    const changed = eventContentSignature(candidate) !== eventContentSignature(prevNorm);
    const prevVer = Number(existing.version) || 0;
    return {
      ...candidate,
      version: changed ? Math.max(prevVer + 1, Number(raw.version) || 1) : Math.max(prevVer, Number(raw.version) || 1),
      updatedAt: changed ? new Date().toISOString() : (existing.updatedAt || new Date().toISOString()),
    };
  }

  return {
    ...candidate,
    version: Math.max(Number(raw.version) || 0, 1),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function hashEventContext(raw) {
  const norm = normalizeEventContext(raw);
  if (!hasActiveEventContext(norm)) {
    return crypto.createHash('sha256').update('NO_EVENT_CONTEXT').digest('hex').slice(0, 16);
  }
  return crypto.createHash('sha256').update(eventContentSignature(norm)).digest('hex').slice(0, 16);
}

/**
 * Resolve active event context from DB project (if owned by user) and/or request payload.
 */
async function resolveProjectEventContext({ db, projectId, userId, fallbackEventContext = null }) {
  let project = null;
  if (projectId && db && typeof db.getProjectById === 'function' && userId) {
    project = await db.getProjectById(projectId, userId);
  }
  const dbEvent = (project && project.eventContext) || null;
  const resolved = fallbackEventContext !== undefined && fallbackEventContext !== null
    ? normalizeEventContext(fallbackEventContext, dbEvent)
    : normalizeEventContext(dbEvent);

  return {
    eventContext: resolved,
    hasEvent: hasActiveEventContext(resolved),
    project,
  };
}

/**
 * Build modular prompt block ONLY when user provided an event/occasion.
 * Enforces influence calibration and prohibits fabricated dates/fixtures/sponsorships.
 */
function formatEventPromptBlock(raw) {
  const ec = normalizeEventContext(raw);
  if (!hasActiveEventContext(ec)) return '';

  const influence = ec.creativeInfluence || 'Subtly';
  const influenceRule =
    influence === 'Strongly'
      ? 'INFLUENCE LEVEL — STRONGLY: Weave this occasion/event meaningfully into the narrative setting, visual mood, and timely appeal, while keeping the business value and brief clear.'
      : influence === 'Reference only'
      ? 'INFLUENCE LEVEL — REFERENCE ONLY: Treat this event strictly as understated background timing awareness (e.g., a subtle seasonal cue or closing CTA reference). Keep the main story centered completely on the product/brand brief.'
      : 'INFLUENCE LEVEL — SUBTLY: Interpret the event relevance lightly to add warm seasonal context without making the event the campaign’s forced central hero idea unless the brief itself centers on it.';

  const lines = [
    'OPTIONAL OCCASION & EVENT CONTEXT (User-Provided):',
    ec.category ? `- Category: ${ec.category}` : null,
    ec.name ? `- Event / Occasion: ${ec.name}` : null,
    ec.timing ? `- Timing Note: ${ec.timing}` : null,
    `- Requested Creative Influence: ${influence}`,
    ec.additionalContext ? `- User Event Notes: ${ec.additionalContext}` : null,
    `- ${influenceRule}`,
    '- FACTUAL INTEGRITY RULE: Do NOT invent or assume specific event dates, countdown days, match schedules/fixtures, scores/results, official sponsorships, venue names, or factual affiliations that were not explicitly stated by the user above.',
  ].filter(Boolean);

  return lines.join('\n');
}

module.exports = {
  VALID_EVENT_CATEGORIES,
  VALID_INFLUENCES,
  normalizeCategory,
  normalizeInfluence,
  normalizeEventContext,
  hasActiveEventContext,
  hashEventContext,
  resolveProjectEventContext,
  formatEventPromptBlock,
};
