/**
 * Client & shared utility helpers for Creative Guardrails (Do's & Don'ts).
 * Maintains stable instruction IDs, clean version increments, and stale checks.
 */

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

export function normalizeClientSettings(raw = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const language = String(src.language || 'English').trim();
  const creativeStyle = String(src.creativeStyle || src.format || 'UGC / Creator-style').trim();
  const platform = String(src.platform || '').trim();
  const rawDim = String(src.dimension || src.aspectRatio || '').trim();
  const dimension = rawDim || (
    platform.includes('16:9') ? '16:9' : platform.includes('1:1') ? '1:1' : '9:16'
  );
  const duration = String(src.duration || src.targetDuration || '20s').trim();
  const hasLogo = Boolean(
    src.hasLogo === true ||
    src.videoLogo ||
    src.brandLogo ||
    src.logoDataUrl ||
    src.logo
  );
  return { language, creativeStyle, dimension, duration, hasLogo };
}

export function isUnderstandingOutdatedClient(understanding, currentBrief, currentGuardrails, currentSettings = null, currentEventContext = undefined) {
  if (!understanding) return false;
  if (understanding.approval_status === 'outdated') return true;
  if (String(understanding.source_brief || '').trim() !== String(currentBrief || '').trim()) {
    return true;
  }
  const g = normalizeClientGuardrails(currentGuardrails);
  const recVer = typeof understanding.source_guardrails_version === 'number'
    ? understanding.source_guardrails_version
    : null;
  if (recVer !== null) {
    if ((g.version || 0) !== recVer) return true;
  } else if (g.dos.length > 0 || g.donts.length > 0) {
    return true;
  }

  if (currentSettings && understanding.source_settings && typeof understanding.source_settings === 'object') {
    const cur = normalizeClientSettings(currentSettings);
    const rec = understanding.source_settings;
    if (
      String(rec.language || '') !== cur.language ||
      String(rec.creativeStyle || '') !== cur.creativeStyle ||
      String(rec.dimension || '') !== cur.dimension ||
      String(rec.duration || '') !== cur.duration ||
      Boolean(rec.hasLogo) !== cur.hasLogo
    ) {
      return true;
    }
  }

  if (currentEventContext !== undefined) {
    const recEvt = understanding.source_event && typeof understanding.source_event === 'object' ? understanding.source_event : null;
    const curEvtRaw = currentEventContext && typeof currentEventContext === 'object' ? currentEventContext : null;
    const normStr = (e) => {
      if (!e) return '';
      const cat = String(e.category || '').trim();
      const name = String(e.name || '').trim();
      const tim = String(e.timing || '').trim();
      const inf = String(e.creativeInfluence || '').trim();
      const ctx = String(e.additionalContext || '').trim();
      if (!cat && !name && !tim && !ctx) return '';
      return JSON.stringify({ cat, name, tim, inf, ctx });
    };
    const recSig = normStr(recEvt);
    const curSig = normStr(curEvtRaw);
    if (recSig !== curSig) {
      return true;
    }
  }
  return false;
}
