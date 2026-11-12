/**
 * src/utils/eventContext.js
 * Universal (ESM / Node CommonJS) helper for optional Occasion & Event Input.
 * Intentionally kept separate from creativeGuardrails (Do's & Don'ts).
 */

const EVENT_CATEGORIES = [
  { id: 'Festivals', label: 'Festivals' },
  { id: 'Occasions', label: 'Occasions' },
  { id: 'Sports & Events', label: 'Sports & Events' },
  { id: 'Other', label: 'Other' },
];

const CREATIVE_INFLUENCE_OPTIONS = [
  { id: 'Strongly', label: 'Strongly', hint: 'Central seasonal mood & setting' },
  { id: 'Subtly', label: 'Subtly', hint: 'Light context supporting the brief' },
  { id: 'Reference only', label: 'Reference only', hint: 'Brief timing cue or CTA mention' },
];

const CURATED_EVENT_SUGGESTIONS = {
  Festivals: [
    'Diwali',
    'Holi',
    'Navratri',
    'Durga Puja',
    'Eid',
    'Ganesh Chaturthi',
    'Onam',
    'Pongal',
    'Raksha Bandhan',
    'Christmas',
    'New Year',
  ],
  Occasions: [
    'Wedding Season',
    'Mother\'s Day',
    'Father\'s Day',
    'Valentine\'s Day',
    'Women\'s Day',
    'Back to School',
    'Summer Vacation',
    'Monsoon Season',
    'Anniversary Sale',
    'Weekend Special',
  ],
  'Sports & Events': [
    'Cricket Tournament Season',
    'Marathon / Fitness Run',
    'Local Cultural Fair / Expo',
    'Music & Food Festival',
    'Community Sports Day',
    'Business / Trade Summit',
  ],
  Other: [
    'Store Launch / Grand Opening',
    'Seasonal Clearance',
    'Local Community Celebration',
  ],
};

function createEmptyEventContext() {
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

function hasActiveClientEventContext(raw) {
  if (!raw || typeof raw !== 'object') return false;
  return Boolean(
    String(raw.name || '').trim() ||
    String(raw.timing || '').trim() ||
    String(raw.additionalContext || '').trim() ||
    String(raw.category || '').trim()
  );
}

function normalizeClientEventContext(raw) {
  if (!raw || typeof raw !== 'object') {
    return createEmptyEventContext();
  }
  const category = String(raw.category || '').trim();
  const name = String(raw.name || '').trim();
  const timing = String(raw.timing || '').trim();
  const additionalContext = String(raw.additionalContext || '').trim();
  const hasAny = Boolean(category || name || timing || additionalContext);
  if (!hasAny) {
    return {
      ...createEmptyEventContext(),
      version: Number(raw.version) || 0,
    };
  }

  let creativeInfluence = String(raw.creativeInfluence || '').trim();
  if (!creativeInfluence && name) {
    // Default to Subtly ONLY after user selects/enters an event
    creativeInfluence = 'Subtly';
  }

  return {
    category,
    name,
    timing,
    creativeInfluence,
    additionalContext,
    version: Math.max(Number(raw.version) || 0, 1),
    updatedAt: raw.updatedAt || null,
  };
}

function updateClientEventField(prevEvent, patch = {}) {
  const current = normalizeClientEventContext(prevEvent);
  const merged = {
    category: patch.category !== undefined ? String(patch.category || '') : current.category,
    name: patch.name !== undefined ? String(patch.name || '') : current.name,
    timing: patch.timing !== undefined ? String(patch.timing || '') : current.timing,
    creativeInfluence:
      patch.creativeInfluence !== undefined
        ? String(patch.creativeInfluence || '')
        : current.creativeInfluence,
    additionalContext:
      patch.additionalContext !== undefined
        ? String(patch.additionalContext || '')
        : current.additionalContext,
  };

  // Default creativeInfluence to 'Subtly' ONLY once an event name is chosen/entered
  const trimmedName = merged.name.trim();
  if (trimmedName && !merged.creativeInfluence) {
    merged.creativeInfluence = 'Subtly';
  }
  // If user clears the event name and didn't specify anything else, clear influence too
  if (!trimmedName && !merged.timing.trim() && !merged.additionalContext.trim() && !merged.category.trim()) {
    return {
      ...createEmptyEventContext(),
      version: current.version > 0 ? current.version + 1 : 0,
      updatedAt: new Date().toISOString(),
    };
  }
  if (!trimmedName && patch.name !== undefined) {
    merged.creativeInfluence = '';
  }

  const nextVer = Math.max(current.version || 0, 0) + 1;
  return {
    ...merged,
    version: nextVer,
    updatedAt: new Date().toISOString(),
  };
}

function searchEventSuggestions(query = '', category = '') {
  const q = String(query || '').trim().toLowerCase();
  const cat = String(category || '').trim();
  const pool = [];

  const categoriesToSearch =
    cat && CURATED_EVENT_SUGGESTIONS[cat] ? [cat] : Object.keys(CURATED_EVENT_SUGGESTIONS);

  for (const c of categoriesToSearch) {
    for (const item of CURATED_EVENT_SUGGESTIONS[c]) {
      if (!q || item.toLowerCase().includes(q) || c.toLowerCase().includes(q)) {
        pool.push({ category: c, name: item });
      }
    }
  }
  return pool;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EVENT_CATEGORIES,
    CREATIVE_INFLUENCE_OPTIONS,
    CURATED_EVENT_SUGGESTIONS,
    createEmptyEventContext,
    hasActiveClientEventContext,
    normalizeClientEventContext,
    updateClientEventField,
    searchEventSuggestions,
  };
}
