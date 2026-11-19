/**
 * Client & shared utility helpers for Creative Guardrails (Do's & Don'ts).
 * Maintains stable instruction IDs, clean version increments, and stale checks.
 */
import { normalizeCreativeStyle } from './creativeStyle.js';

export const EMPTY_CREATIVE_GUARDRAILS = {
  dos: [],
  donts: [],
  version: 0,
  updatedAt: null,
};

export function createClientGuardrailId(type = 'do') {
  const prefix = type === 'dont' ? 'gr_dont' : 'gr_do';
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeClientGuardrails(raw) {
  if (!raw || typeof raw !== 'object') {
    return { dos: [], donts: [], version: 0, updatedAt: null };
  }
  const normList = (arr, type) =>
    (Array.isArray(arr) ? arr : [])
      .map((item) => {
        if (typeof item === 'string') {
          const text = item.trim();
          return text ? { id: createClientGuardrailId(type), text, priority: 'critical' } : null;
        }
        if (item && typeof item === 'object') {
          const text = String(item.text || '').trim();
          if (!text) return null;
          return {
            id: item.id || createClientGuardrailId(type),
            text,
            priority: item.priority === 'preference' ? 'preference' : 'critical',
          };
        }
        return null;
      })
      .filter(Boolean);

  const dos = normList(raw.dos, 'do');
  const donts = normList(raw.donts, 'dont');
  const version = Number(raw.version) > 0 ? Number(raw.version) : (dos.length || donts.length ? 1 : 0);

  return {
    dos,
    donts,
    version,
    updatedAt: raw.updatedAt || null,
  };
}

export function guardrailsCount(guardrails) {
  const g = normalizeClientGuardrails(guardrails);
  return {
    dosCount: g.dos.length,
    dontsCount: g.donts.length,
    total: g.dos.length + g.donts.length,
  };
}

export function addGuardrailInstruction(guardrails, type, text, priority = 'critical') {
  const clean = String(text || '').trim();
  if (!clean) return normalizeClientGuardrails(guardrails);
  const current = normalizeClientGuardrails(guardrails);
  const key = type === 'dont' ? 'donts' : 'dos';
  const nextItem = {
    id: createClientGuardrailId(type === 'dont' ? 'dont' : 'do'),
    text: clean,
    priority: priority === 'preference' ? 'preference' : 'critical',
  };
  return {
    ...current,
    [key]: [...current[key], nextItem],
    version: Math.max(current.version || 0, 0) + 1,
    updatedAt: new Date().toISOString(),
  };
}

export function updateGuardrailInstruction(guardrails, type, id, updates = {}) {
  const current = normalizeClientGuardrails(guardrails);
  const key = type === 'dont' ? 'donts' : 'dos';
  let changed = false;
  const nextList = current[key].map((item) => {
    if (item.id !== id) return item;
    const nextText = updates.text !== undefined ? String(updates.text).trim() : item.text;
    const nextPriority = updates.priority !== undefined
      ? (updates.priority === 'preference' ? 'preference' : 'critical')
      : item.priority;
    if (!nextText) {
      changed = true;
      return null;
    }
    if (nextText !== item.text || nextPriority !== item.priority) {
      changed = true;
    }
    return { ...item, text: nextText, priority: nextPriority };
  }).filter(Boolean);

  if (!changed) return current;
  return {
    ...current,
    [key]: nextList,
    version: Math.max(current.version || 0, 0) + 1,
    updatedAt: new Date().toISOString(),
  };
}

export function removeGuardrailInstruction(guardrails, type, id) {
  const current = normalizeClientGuardrails(guardrails);
  const key = type === 'dont' ? 'donts' : 'dos';
  const nextList = current[key].filter((item) => item.id !== id);
  if (nextList.length === current[key].length) return current;
  return {
    ...current,
    [key]: nextList,
    version: Math.max(current.version || 0, 0) + 1,
    updatedAt: new Date().toISOString(),
  };
}

// The production settings an AI Understanding is made from, read the same way as the server's settingsFingerprint
// (engine/understandingSpine.js) and the studio's getCurrentProductionSettings: aspectRatio and targetDuration first,
// the style through the legacy-label mapping.
export function normalizeClientSettings(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const language = String(src.language || 'English').trim();
  const creativeStyle = normalizeCreativeStyle(String(src.creativeStyle || src.format || 'UGC / Creator-style').trim());
  const platform = String(src.platform || '').trim();
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
  return { language, creativeStyle, dimension, duration, hasLogo };
}

const SETTINGS_FIELDS = ['language', 'creativeStyle', 'dimension', 'duration', 'hasLogo'];

// Do's and Don'ts by content, exactly as engine/guardrails.js guardrailsContentSignature reads them (ids and the
// version counter left out).
export function guardrailsContentSignatureClient(raw) {
  const list = (items) => {
    const seen = new Set();
    const out = [];
    for (const item of Array.isArray(items) ? items : []) {
      let text = '';
      let priority = 'critical';
      if (typeof item === 'string') text = item.trim();
      else if (item && typeof item === 'object') {
        text = String(item.text || item.instruction || item.rule || item.label || '').trim();
        priority = typeof item.priority === 'string' && item.priority.trim().toLowerCase() === 'preference' ? 'preference' : 'critical';
      }
      if (!text) continue;
      const key = `${text.toLowerCase()}::${priority}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(`${priority}:${text}`);
    }
    return out;
  };
  const g = raw && typeof raw === 'object' ? raw : {};
  return JSON.stringify({ dos: list(g.dos), donts: list(g.donts) });
}

// An occasion by content, as engine/eventContext.js eventContentSignature reads its normalised form.
const EVENT_CATEGORY_IDS = ['Festivals', 'Occasions', 'Sports & Events', 'Other'];
function eventSignatureClient(raw) {
  if (!raw || typeof raw !== 'object') return '';
  const name = String(raw.name || '').trim();
  const timing = String(raw.timing || '').trim();
  const additionalContext = String(raw.additionalContext || '').trim();
  const rawCategory = String(raw.category || '').trim();
  if (!name && !timing && !additionalContext && !rawCategory) return '';
  const category = rawCategory ? (EVENT_CATEGORY_IDS.find((c) => c.toLowerCase() === rawCategory.toLowerCase()) || 'Other') : '';
  const inf = String(raw.creativeInfluence || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const creativeInfluence = inf === 'strongly' || inf === 'strong' ? 'Strongly'
    : inf === 'subtly' || inf === 'subtle' ? 'Subtly'
    : inf === 'reference_only' || inf === 'reference' ? 'Reference only'
    : name ? 'Subtly' : '';
  return JSON.stringify({ category, name, timing, creativeInfluence, additionalContext });
}

/**
 * Which inputs differ from the ones this AI Understanding was made from ([] when it is current). Only what the user
 * edits counts: brief text, Do's and Don'ts content, the Settings screen's choices, an uploaded logo, the occasion.
 * Never a version counter, a date or the stored status label. Mirrors engine/understandingSpine.js.
 */
export function explainUnderstandingOutdatedClient(understanding, currentBrief, currentGuardrails, currentSettings = null, currentEventContext = undefined) {
  const reasons = [];
  if (!understanding) return reasons;
  const storedBrief = String(understanding.source_brief || '').trim();
  const brief = String(currentBrief || '').trim();
  if (storedBrief !== brief) reasons.push({ part: 'brief', stored: storedBrief, current: brief });

  if (typeof understanding.source_guardrails_signature === 'string') {
    const cur = guardrailsContentSignatureClient(currentGuardrails);
    if (cur !== understanding.source_guardrails_signature) {
      reasons.push({ part: 'guardrails', stored: understanding.source_guardrails_signature, current: cur });
    }
  } else {
    // made before the content was recorded: the version is all there is to go on
    const g = normalizeClientGuardrails(currentGuardrails);
    const recVer = typeof understanding.source_guardrails_version === 'number' ? understanding.source_guardrails_version : null;
    if (recVer !== null ? (g.version || 0) !== recVer : g.dos.length > 0 || g.donts.length > 0) {
      reasons.push({ part: 'guardrails', stored: recVer, current: g.version || 0 });
    }
  }

  if (currentSettings && understanding.source_settings && typeof understanding.source_settings === 'object') {
    const cur = normalizeClientSettings(currentSettings);
    const rec = normalizeClientSettings(understanding.source_settings);
    for (const k of SETTINGS_FIELDS) {
      if (rec[k] !== cur[k]) reasons.push({ part: `settings.${k}`, stored: rec[k], current: cur[k] });
    }
  }

  if (currentEventContext !== undefined) {
    const stored = eventSignatureClient(understanding.source_event);
    const cur = eventSignatureClient(currentEventContext);
    if (stored !== cur) reasons.push({ part: 'event', stored: understanding.source_event || null, current: currentEventContext || null });
  }
  return reasons;
}

export function isUnderstandingOutdatedClient(understanding, currentBrief, currentGuardrails, currentSettings = null, currentEventContext = undefined) {
  return explainUnderstandingOutdatedClient(understanding, currentBrief, currentGuardrails, currentSettings, currentEventContext).length > 0;
}

const SETTING_NAMES = { language: 'language', creativeStyle: 'creative style', dimension: 'video size', duration: 'duration', hasLogo: 'logo' };

/** One plain sentence for the outdated notice, e.g. "Changed since this version was made: duration (20s → 15s)." */
export function describeOutdatedReasons(reasons = []) {
  const bits = [];
  for (const r of reasons || []) {
    if (r.part === 'brief') bits.push('your brief');
    else if (r.part === 'guardrails') bits.push("your Do's and Don'ts");
    else if (r.part === 'event') bits.push('the occasion');
    else if (r.part === 'settings.hasLogo') bits.push(r.current ? 'a logo was added' : 'the logo was removed');
    else if (String(r.part).startsWith('settings.')) bits.push(`${SETTING_NAMES[r.part.slice(9)] || r.part.slice(9)} (${r.stored} → ${r.current})`);
    else if (r.part === 'settings') bits.push('your settings');
  }
  const uniq = [...new Set(bits)];
  return uniq.length ? `Changed since this version was made: ${uniq.join(', ')}.` : '';
}

/**
 * What the Understanding screen shows: 'outdated' when the inputs changed since this version was made, 'approved'
 * when the user approved this version (a stored "outdated" whose inputs match again counts, as on the server's
 * reconcileApproval), otherwise 'pending'.
 */
export function understandingApprovalState(understanding, currentBrief, currentGuardrails, currentSettings = null, currentEventContext = undefined) {
  if (!understanding) return { status: 'pending', reasons: [] };
  const reasons = explainUnderstandingOutdatedClient(understanding, currentBrief, currentGuardrails, currentSettings, currentEventContext);
  if (reasons.length) return { status: 'outdated', reasons };
  const s = understanding.approval_status;
  const approved = s === 'approved' || s === 'auto_approved' || (s === 'outdated' && Boolean(understanding.approved_at));
  return { status: approved ? 'approved' : 'pending', reasons };
}
