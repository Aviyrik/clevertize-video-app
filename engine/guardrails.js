/**
 * engine/guardrails.js
 * Creative Guardrails (Do's & Don'ts): Core Data Model, Source-of-Truth Retrieval,
 * Prompt Formatting, and Reusable Output Validation.
 *
 * Original user instructions live in `project.creativeGuardrails` and are strictly
 * separated from AI-generated interpretations stored in `aiUnderstanding`.
 */

const crypto = require('crypto');

const EMPTY_GUARDRAILS = {
  dos: [],
  donts: [],
  version: 0,
  updatedAt: null,
};

function createGuardrailId(type = 'do') {
  const prefix = type === 'dont' ? 'gr_dont' : 'gr_do';
  return `${prefix}_${crypto.randomBytes(5).toString('hex')}`;
}

function normalizePriority(priority) {
  if (typeof priority === 'string' && priority.trim().toLowerCase() === 'preference') {
    return 'preference';
  }
  return 'critical';
}

function normalizeGuardrailList(items, type = 'do') {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set();
  const seenTexts = new Set();
  const out = [];

  for (const raw of items) {
    let id = '';
    let text = '';
    let priority = 'critical';

    if (typeof raw === 'string') {
      text = raw.trim();
    } else if (raw && typeof raw === 'object') {
      text = String(raw.text || raw.instruction || raw.rule || raw.label || '').trim();
      id = typeof raw.id === 'string' ? raw.id.trim() : '';
      priority = normalizePriority(raw.priority);
    }

    if (!text) continue;
    const textKey = `${text.toLowerCase()}::${priority}`;
    if (seenTexts.has(textKey)) continue;
    seenTexts.add(textKey);

    if (!id || seenIds.has(id)) {
      id = createGuardrailId(type);
    }
    seenIds.add(id);

    out.push({ id, text, priority });
  }

  return out;
}

function guardrailsSignature(g) {
  const dos = (g?.dos || []).map((i) => `${i.id || ''}:${i.priority || 'critical'}:${String(i.text || '').trim()}`);
  const donts = (g?.donts || []).map((i) => `${i.id || ''}:${i.priority || 'critical'}:${String(i.text || '').trim()}`);
  return JSON.stringify({ dos, donts });
}

function guardrailsContentSignature(g) {
  const dos = (g?.dos || []).map((i) => `${i.priority || 'critical'}:${String(i.text || '').trim()}`);
  const donts = (g?.donts || []).map((i) => `${i.priority || 'critical'}:${String(i.text || '').trim()}`);
  return JSON.stringify({ dos, donts });
}

function hashGuardrails(guardrails) {
  const normalized = normalizeCreativeGuardrails(guardrails);
  return crypto.createHash('sha256').update(guardrailsContentSignature(normalized)).digest('hex').slice(0, 16);
}

/**
 * Normalize a creativeGuardrails payload while maintaining stable IDs and versioning.
 * When `existing` is supplied and contents differ, version is automatically incremented.
 */
function normalizeCreativeGuardrails(raw, existing = null) {
  if (!raw || typeof raw !== 'object') {
    if (existing && typeof existing === 'object') {
      return {
        dos: normalizeGuardrailList(existing.dos, 'do'),
        donts: normalizeGuardrailList(existing.donts, 'dont'),
        version: Number(existing.version) || 0,
        updatedAt: existing.updatedAt || null,
      };
    }
    return { dos: [], donts: [], version: 0, updatedAt: null };
  }

  const dos = normalizeGuardrailList(raw.dos, 'do');
  const donts = normalizeGuardrailList(raw.donts, 'dont');
  const candidate = { dos, donts };
  const hasItems = dos.length > 0 || donts.length > 0;

  if (existing && typeof existing === 'object') {
    const normExisting = {
      dos: normalizeGuardrailList(existing.dos, 'do'),
      donts: normalizeGuardrailList(existing.donts, 'dont'),
      version: Number(existing.version) || 0,
      updatedAt: existing.updatedAt || null,
    };

    const changed = guardrailsContentSignature(candidate) !== guardrailsContentSignature(normExisting);
    if (changed) {
      const nextVersion = Math.max(normExisting.version + 1, Number(raw.version) || 0);
      return {
        dos,
        donts,
        version: nextVersion,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      dos,
      donts,
      version: Math.max(normExisting.version, Number(raw.version) || 0),
      updatedAt: normExisting.updatedAt || raw.updatedAt || null,
    };
  }

  const version = Number(raw.version) > 0 ? Number(raw.version) : (hasItems ? 1 : 0);
  const updatedAt = raw.updatedAt || (hasItems ? new Date().toISOString() : null);
  return { dos, donts, version, updatedAt };
}

function hasActiveGuardrails(guardrails) {
  if (!guardrails || typeof guardrails !== 'object') return false;
  return (Array.isArray(guardrails.dos) && guardrails.dos.length > 0) ||
         (Array.isArray(guardrails.donts) && guardrails.donts.length > 0);
}

/**
 * Safely merge modern structured creativeGuardrails with legacy constraints/avoid string arrays.
 */
function mergeGuardrailsWithLegacy(guardrails, constraints = [], avoid = []) {
  const base = normalizeCreativeGuardrails(guardrails);
  const dos = [...base.dos];
  const donts = [...base.donts];
  const existingDoTexts = new Set(dos.map((d) => d.text.toLowerCase()));
  const existingDontTexts = new Set(donts.map((d) => d.text.toLowerCase()));

  for (const c of Array.isArray(constraints) ? constraints : []) {
    const clean = String(c || '').trim();
    if (clean && !existingDoTexts.has(clean.toLowerCase())) {
      dos.push({ id: createGuardrailId('do'), text: clean, priority: 'critical' });
      existingDoTexts.add(clean.toLowerCase());
    }
  }

  for (const a of Array.isArray(avoid) ? avoid : []) {
    const clean = String(a || '').trim();
    if (clean && !existingDontTexts.has(clean.toLowerCase())) {
      donts.push({ id: createGuardrailId('dont'), text: clean, priority: 'critical' });
      existingDontTexts.add(clean.toLowerCase());
    }
  }

  return {
    dos,
    donts,
    version: base.version || ((dos.length || donts.length) ? 1 : 0),
    updatedAt: base.updatedAt || ((dos.length || donts.length) ? new Date().toISOString() : null),
  };
}

/**
 * Reliable Backend Source of Truth for retrieving a project's Creative Guardrails.
 * Verifies authenticated ownership before returning project-level guardrails.
 */
async function resolveProjectGuardrails({
  db,
  projectId,
  userId,
  fallbackGuardrails = null,
  constraints = [],
  avoid = [],
  requireOwnedProject = false,
} = {}) {
  let project = null;
  let sourceGuardrails = null;

  if (projectId && db) {
    if (!userId) {
      throw Object.assign(new Error('Authentication required for project guardrails.'), { status: 401 });
    }
    project = await db.getProjectById(projectId, userId);
    if (!project) {
      if (requireOwnedProject) {
        throw Object.assign(new Error('Project not found or not owned by authenticated user.'), { status: 403 });
      }
      if (typeof db.projectExists === 'function' && await db.projectExists(projectId)) {
        throw Object.assign(new Error('Project not found or not owned by authenticated user.'), { status: 403 });
      }
    } else {
      sourceGuardrails = project.creativeGuardrails || (project.creativeDNA && project.creativeDNA.creativeGuardrails) || null;
    }
  }

  const effective = sourceGuardrails && hasActiveGuardrails(sourceGuardrails)
    ? normalizeCreativeGuardrails(sourceGuardrails)
    : (fallbackGuardrails ? normalizeCreativeGuardrails(fallbackGuardrails) : normalizeCreativeGuardrails(sourceGuardrails));

  const merged = mergeGuardrailsWithLegacy(effective, constraints, avoid);
  return { guardrails: merged, project };
}

/**
 * Formats Creative Guardrails for LLM prompts cleanly without duplicating rules.
 */
function formatGuardrailsPromptBlock(guardrails, interpreted = null) {
  const norm = normalizeCreativeGuardrails(guardrails);
  if (!hasActiveGuardrails(norm) && !interpreted) return '';

  const lines = ['CREATIVE GUARDRAILS (USER-DEFINED MANDATES & RESTRICTIONS):'];

  if (norm.dos.length > 0) {
    lines.push('MUST FOLLOW (DOs):');
    norm.dos.forEach((d) => {
      const tag = d.priority === 'preference' ? '[PREFERENCE]' : '[CRITICAL MANDATORY]';
      lines.push(`- ${tag} ${d.text}`);
    });
  }

  if (norm.donts.length > 0) {
    lines.push('MUST AVOID (DON\'Ts):');
    norm.donts.forEach((d) => {
      const tag = d.priority === 'preference' ? '[PREFERENCE AVOID]' : '[CRITICAL PROHIBITION]';
      lines.push(`- ${tag} ${d.text}`);
    });
  }

  if (interpreted && Array.isArray(interpreted.conflicts) && interpreted.conflicts.length > 0) {
    lines.push('INTERPRETED CONFLICTS / NOTES:');
    interpreted.conflicts.forEach((c) => {
      lines.push(`- [CONFLICT: ${c.description}] ${c.resolution_hint || ''}`);
    });
  }

  return lines.join('\n');
}

const VISUAL_KEYWORD_RE = /\b(visual|visuals|scene|scenes|background|backdrop|color|colour|red|blue|green|yellow|black|white|purple|orange|outfit|clothes|clothing|wardrobe|camera|shot|frame|framing|close-up|closeup|logo|lighting|bright|dark|indoor|outdoor|smiling|hands?|table|counter|packaging|bottle|box|show\s+the|display)\b/i;

function isVisualGuardrail(text = '') {
  return VISUAL_KEYWORD_RE.test(String(text || ''));
}

const DIRECTIVE_PREFIX_RE = /^(?:strictly\s+)?(?:do\s+not|don't|never|avoid|must\s+not|should\s+not|prohibit|no|without)\s+(?:ever\s+)?(?:mention(?:ing)?|use|using|say(?:ing)?|include|including|show(?:ing)?|display(?:ing)?|feature|featuring|reference|referencing|talk(?:ing)?\s+about|make|making|claim(?:ing)?|put(?:ting)?|add(?:ing)?|have|having)?\s*/i;

const GENERIC_FILLER_TOKENS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'your', 'our', 'about', 'into',
  'like', 'such', 'any', 'all', 'must', 'should', 'always', 'mention', 'include',
  'feature', 'highlight', 'emphasize', 'ensure', 'keep', 'make', 'state', 'show',
  'clearly', 'explicitly', 'tone', 'style', 'message', 'talking', 'point', 'points',
  'brand', 'brands', 'product', 'products', 'service', 'services', 'offer', 'video',
  'film', 'scene', 'scenes', 'avoid', 'never', 'competitor', 'words', 'word', 'phrase',
  'phrases', 'claims', 'claim', 'visual', 'visuals', 'styles', 'restricted', 'topics',
  'unwanted', 'exaggerated', 'unverified', 'mandatory', 'required', 'approved',
  // Meta style/format/language/dialogue descriptors (enforced via prompt guidance, not literal text quotes)
  'dialogue', 'dialogues', 'voiceover', 'script', 'pacing', 'energy', 'vibe', 'mood',
  'natural', 'conversational', 'relatable', 'authentic', 'warm', 'friendly', 'upbeat',
  'vibrant', 'festive', 'crisp', 'short', 'punchy', 'simple', 'clear', 'clean', 'modern',
  'emotional', 'heartfelt', 'humorous', 'funny', 'witty', 'confident', 'respectful',
  'polite', 'casual', 'formal', 'energetic', 'positive', 'lighthearted',
  'hindi', 'english', 'hinglish', 'marathi', 'tamil', 'telugu', 'kannada', 'gujarati',
  'bengali', 'malayalam', 'punjabi',
]);

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts prohibited phrases and terms from a "Don't" instruction string.
 */
function extractProhibitedTargets(dontText = '', spineRule = null) {
  const raw = String(dontText || '').trim();
  if (!raw) return { phrases: [], terms: [] };

  const phrases = [];
  const terms = new Set();

  // 1. Explicitly quoted strings are high-signal prohibited phrases
  for (const m of raw.matchAll(/["“'`]([^"”'`]{2,80})["”'`]/g)) {
    const q = m[1].trim();
    if (q) phrases.push(q);
  }

  // 2. Spine-supplied forbidden terms if available
  if (spineRule && Array.isArray(spineRule.forbidden_terms)) {
    for (const ft of spineRule.forbidden_terms) {
      const cleanFt = String(ft || '').trim();
      if (cleanFt) {
        phrases.push(cleanFt);
        terms.add(cleanFt.toLowerCase());
      }
    }
  }

  // 3. Strip directive lead-ins ("Do not mention...", "Avoid...", etc.)
  let stripped = raw.replace(DIRECTIVE_PREFIX_RE, '').trim();
  // Remove leading "such as", "like", "any", "the"
  stripped = stripped.replace(/^(?:such\s+as|like|any|the)\s+/i, '').trim();
  // Remove trailing qualifiers like "in the ad", "in the video"
  stripped = stripped.replace(/\b(?:in\s+the\s+(?:video|ad|film|script|dialogue|scenes?)|during\s+the\s+video|at\s+all)\b\.?$/i, '').trim();

  if (stripped && stripped.length >= 2) {
    // Handle comma or "or" separated lists, e.g. "Tanishq or Kalyan" or "cheap, free"
    const subParts = stripped.split(/\s*(?:,|\/|\bor\b|\band\b)\s*/i).map((p) => p.replace(/^(?:any|the|a|an)\s+/i, '').trim()).filter(Boolean);
    for (const part of subParts) {
      if (part.length >= 2 && !GENERIC_FILLER_TOKENS.has(part.toLowerCase())) {
        phrases.push(part);
      }
    }
  }

  // 4. Meaningful single-word tokens inside stripped clause (handles e.g. "competitor BrandX" -> "brandx", "100% cure" -> "100%", "cure")
  const tokenSource = stripped || raw;
  const wordMatches = tokenSource.match(/[#₹$€£]?\d+(?:\.\d+)?%?|#[A-Za-z0-9]+|[A-Za-z\u0900-\u097F]{3,}/g) || [];
  for (const w of wordMatches) {
    const low = w.toLowerCase();
    if (!GENERIC_FILLER_TOKENS.has(low)) {
      terms.add(low);
    }
  }

  // Special common domain patterns when explicit phrasing targets category restrictions
  if (/\bcompetitors?\b/i.test(raw) && phrases.length === 0) {
    terms.add('competitor');
    terms.add('competitors');
  }
  if (/\bfree\b/i.test(stripped)) {
    terms.add('free');
  }
  if (/\b(?:discount|discounts)\b/i.test(stripped)) {
    terms.add('discount');
    terms.add('discounts');
  }
  if (/#\s*1|\bno\.?\s*1\b|\bnumber\s*(?:one|1)\b/i.test(raw)) {
    phrases.push('#1');
    phrases.push('No. 1');
    phrases.push('Number 1');
    phrases.push('Number one');
  }
  if (/100\s*%|guaranteed|cure/i.test(stripped)) {
    if (/100\s*%/.test(stripped)) phrases.push('100%');
    if (/guarantee/i.test(stripped)) terms.add('guaranteed');
    if (/cure/i.test(stripped)) terms.add('cure');
  }

  return {
    phrases: [...new Set(phrases)].filter((p) => !GENERIC_FILLER_TOKENS.has(p.toLowerCase())),
    terms: [...terms],
  };
}

function matchTargetInText(text, phrases = [], terms = []) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  for (const ph of phrases) {
    const clean = String(ph || '').trim();
    if (!clean || clean.length < 2) continue;
    const isAlphaNum = /^[A-Za-z0-9]+$/.test(clean);
    if (isAlphaNum) {
      const re = new RegExp(`\\b${escapeRegex(clean)}\\b`, 'i');
      const m = text.match(re);
      if (m) return m[0];
    } else {
      const idx = lower.indexOf(clean.toLowerCase());
      if (idx >= 0) return text.slice(idx, idx + clean.length);
    }
  }

  for (const t of terms) {
    const clean = String(t || '').trim();
    if (!clean || clean.length < 3) continue;
    const isAlphaNum = /^[A-Za-z0-9]+$/.test(clean);
    if (isAlphaNum) {
      const re = new RegExp(`\\b${escapeRegex(clean)}s?\\b`, 'i');
      const m = text.match(re);
      if (m) return m[0];
    } else if (lower.includes(clean.toLowerCase())) {
      return clean;
    }
  }

  return null;
}

/**
 * Evaluates whether a "Do" requirement is reflected in generated text/prompts.
 */
function checkDoSatisfaction(doItem, combinedText, visualPromptsText = '', spineRule = null) {
  const raw = String(doItem.text || '').trim();
  const isVisual = spineRule?.scope === 'visual' || isVisualGuardrail(raw);

  // Extract concrete literals (quoted strings, percentages, numbers, brand/offer words)
  const quoted = [...raw.matchAll(/["“'`]([^"”'`]{2,80})["”'`]/g)].map((m) => m[1].trim());
  const numbers = raw.match(/(?:₹|\$|#)?\d+(?:[.,]\d+)?%?/g) || [];

  const targetCorpus = isVisual && visualPromptsText
    ? `${combinedText}\n${visualPromptsText}`
    : combinedText;
  const targetLower = targetCorpus.toLowerCase();

  // Check spine keywords if supplied
  const keywords = new Set();
  if (spineRule && Array.isArray(spineRule.check_keywords)) {
    spineRule.check_keywords.forEach((k) => {
      if (k && String(k).trim().length >= 2) keywords.add(String(k).trim().toLowerCase());
    });
  }

  // Extract content tokens from user text
  const stripped = raw.replace(/^(?:must\s+|always\s+|please\s+)?(?:mention|include|highlight|emphasize|state|feature|show|add|use|keep|ensure)\s+(?:that\s+|the\s+)?/i, '').trim();
  const tokens = stripped.match(/[#₹$€£]?\d+(?:\.\d+)?%?|[A-Za-z0-9\u0900-\u097F]{3,}/g) || [];
  for (const tok of tokens) {
    const low = tok.toLowerCase();
    if (!GENERIC_FILLER_TOKENS.has(low)) {
      keywords.add(low);
    }
  }

  // Language directive check (e.g. "Keep natural Hindi dialogue")
  if (/\b(?:hindi|marathi)\b/i.test(raw) && !/[\u0900-\u097F]/.test(targetCorpus) && !targetLower.includes('hindi') && !targetLower.includes('marathi')) {
    return { satisfied: false, isVisual, reason: 'Expected Hindi/Marathi Devanagari content in script.' };
  }

  // Must match quoted strings & exact numbers if specified
  for (const q of quoted) {
    if (!targetLower.includes(q.toLowerCase())) {
      return { satisfied: false, isVisual, reason: `Required phrase "${q}" does not appear in output.` };
    }
  }
  for (const n of numbers) {
    if (!targetLower.includes(n.toLowerCase())) {
      return { satisfied: false, isVisual, reason: `Required value "${n}" does not appear in output.` };
    }
  }

  const kwList = [...keywords];
  if (kwList.length === 0) {
    return { satisfied: true, isVisual };
  }

  const hits = kwList.filter((k) => targetLower.includes(k));
  // If short phrase (1-2 keywords), require at least 1 hit; for longer sentences require >= 35% of meaningful keywords (min 1)
  const requiredHits = kwList.length <= 2 ? 1 : Math.max(1, Math.ceil(kwList.length * 0.35));
  if (hits.length >= requiredHits) {
    return { satisfied: true, isVisual, matchedTerms: hits };
  }

  return {
    satisfied: false,
    isVisual,
    reason: `Key requirement elements (${kwList.slice(0, 4).join(', ')}) were not reflected.`,
  };
}

/**
 * Reusable Guardrails Validator across generated stages (Directions, Hooks, Plots, Story, Script, Packages, Video Prompts).
 * Distinguishes automated text/prompt checks from visual human-review requirements.
 */
function validateOutputAgainstGuardrails({
  outputText = '',
  visualPromptText = '',
  stage = 'script',
  guardrails = null,
  interpretedGuardrails = null,
} = {}) {
  const norm = normalizeCreativeGuardrails(guardrails);
  const analysis = interpretedGuardrails || {};
  const hasRules = hasActiveGuardrails(norm);
  const hasAnalysisIssues =
    (Array.isArray(analysis.conflicts) && analysis.conflicts.length > 0) ||
    (Array.isArray(analysis.unsupported_claims) && analysis.unsupported_claims.length > 0);

  if (!hasRules && !hasAnalysisIssues) {
    return {
      stage,
      checkedAt: new Date().toISOString(),
      hasGuardrails: false,
      guardrailsVersion: norm.version || 0,
      overallStatus: 'compliant',
      hasCriticalViolation: false,
      automatedChecks: {
        passed: true,
        scope: 'text_and_prompt_metadata',
        criticalViolations: [],
        warnings: [],
        satisfiedDos: [],
        violatedDonts: [],
        conflicts: [],
        unsupportedClaims: [],
      },
      visualReviewRequired: [],
    };
  }

  const combinedText = String(outputText || '').trim();
  const combinedVisual = String(visualPromptText || '').trim();
  const fullCheckCorpus = combinedVisual ? `${combinedText}\n${combinedVisual}` : combinedText;

  const criticalViolations = [];
  const warnings = [];
  const satisfiedDos = [];
  const violatedDonts = [];
  const visualReviewRequired = [];

  const normDosMap = new Map((analysis.normalized_dos || []).map((x) => [x.id, x]));
  const normDontsMap = new Map((analysis.normalized_donts || []).map((x) => [x.id, x]));

  // 1. Validate Do's
  // During early ideation stages (directions/hooks/plots), missing a specific offer CTA might only become concrete in script stage;
  // therefore during script/simple-packages/render-scenes stages we enforce missing mandatory Dos strictly as critical violations if priority === 'critical',
  // while ideation stages flag them as warnings unless an explicit contradiction occurs.
  const strictMandatoryStage = ['script', 'rewrite', 'simple_packages', 'storyboard', 'video_prompt'].includes(stage);

  for (const doItem of norm.dos) {
    const spineRule = normDosMap.get(doItem.id) || null;
    const isVisual = spineRule?.scope === 'visual' || isVisualGuardrail(doItem.text);
    const check = checkDoSatisfaction(doItem, combinedText, combinedVisual, spineRule);

    if (isVisual) {
      visualReviewRequired.push({
        id: doItem.id,
        type: 'do',
        text: doItem.text,
        priority: doItem.priority,
        injectedIntoPrompt: Boolean(combinedVisual || combinedText),
        reason: 'Visual elements cannot be verified by text-only validation alone. Constraint was injected into generation prompts; verify visually after rendering.',
      });
    }

    if (check.satisfied) {
      satisfiedDos.push({ id: doItem.id, text: doItem.text, priority: doItem.priority });
    } else if (doItem.priority === 'critical' && strictMandatoryStage && !isVisual) {
      criticalViolations.push({
        id: doItem.id,
        type: 'missing_mandatory_do',
        ruleText: doItem.text,
        priority: 'critical',
        explanation: `Mandatory instruction "${doItem.text}" is missing or insufficiently reflected (${check.reason}).`,
      });
    } else if (doItem.priority === 'critical' && strictMandatoryStage && isVisual && combinedText.length > 0 && check.reason) {
      // Visual critical rule: check text/visual description; if absent from scene visual description warn clearly, and require human review
      warnings.push({
        id: doItem.id,
        type: 'visual_do_needs_review',
        ruleText: doItem.text,
        priority: doItem.priority,
        explanation: `Visual instruction "${doItem.text}" could not be confirmed in scene text (${check.reason}). Review generated scenes or video visuals.`,
      });
    } else {
      warnings.push({
        id: doItem.id,
        type: 'unconfirmed_preference_or_early_stage',
        ruleText: doItem.text,
        priority: doItem.priority,
        explanation: `Instruction "${doItem.text}" was not explicitly detected at stage "${stage}".`,
      });
    }
  }

  // 2. Validate Don'ts (Prohibited Content Checks)
  for (const dontItem of norm.donts) {
    const spineRule = normDontsMap.get(dontItem.id) || null;
    const isVisual = spineRule?.scope === 'visual' || isVisualGuardrail(dontItem.text);
    const { phrases, terms } = extractProhibitedTargets(dontItem.text, spineRule);

    if (isVisual) {
      visualReviewRequired.push({
        id: dontItem.id,
        type: 'dont',
        text: dontItem.text,
        priority: dontItem.priority,
        injectedIntoPrompt: Boolean(combinedVisual || combinedText),
        reason: 'Prohibited visual elements cannot be guaranteed absent by text-only validation alone. Negative constraint was passed into generation; verify rendered video frames manually.',
      });
    }

    // Check only the actual output text (avoid scanning the guardrail block if caller keeps them separate)
    const matched = matchTargetInText(fullCheckCorpus, phrases, terms);
    if (matched) {
      const violation = {
        id: dontItem.id,
        type: 'prohibited_content_detected',
        ruleText: dontItem.text,
        matchedFragment: matched,
        priority: dontItem.priority,
        explanation: `Output contains "${matched}", which violates your Must Avoid rule: "${dontItem.text}".`,
      };
      violatedDonts.push(violation);

      if (dontItem.priority === 'critical') {
        criticalViolations.push(violation);
      } else {
        warnings.push(violation);
      }
    }
  }

  const conflicts = Array.isArray(analysis.conflicts) ? analysis.conflicts : [];
  const unsupportedClaims = Array.isArray(analysis.unsupported_claims) ? analysis.unsupported_claims : [];

  for (const c of conflicts) {
    if (c.severity === 'critical') {
      criticalViolations.push({
        id: c.id || 'conflict',
        type: 'conflicting_guardrails',
        ruleText: c.description,
        priority: 'critical',
        explanation: `${c.description}${c.resolution_hint ? ` Suggestion: ${c.resolution_hint}` : ''}`,
      });
    } else {
      warnings.push({
        id: c.id || 'conflict',
        type: 'conflicting_guardrails',
        ruleText: c.description,
        priority: 'preference',
        explanation: `${c.description}${c.resolution_hint ? ` Suggestion: ${c.resolution_hint}` : ''}`,
      });
    }
  }

  for (const u of unsupportedClaims) {
    warnings.push({
      id: u.id || 'unsupported_claim',
      type: 'unsupported_claim',
      ruleText: u.text || u.claim,
      priority: 'preference',
      explanation: u.reason || `Claim "${u.text || u.claim}" is not verified in the submitted brief and requires confirmation.`,
    });
  }

  const hasCriticalViolation = criticalViolations.length > 0;
  const overallStatus = hasCriticalViolation
    ? 'violation'
    : (warnings.length > 0 || conflicts.length > 0 || unsupportedClaims.length > 0)
    ? 'compliant_with_warnings'
    : 'compliant';

  return {
    stage,
    checkedAt: new Date().toISOString(),
    hasGuardrails: hasRules,
    guardrailsVersion: norm.version || 0,
    overallStatus,
    hasCriticalViolation,
    automatedChecks: {
      passed: !hasCriticalViolation,
      scope: 'text_and_prompt_metadata',
      criticalViolations,
      warnings,
      satisfiedDos,
      violatedDonts,
      conflicts,
      unsupportedClaims,
    },
    visualReviewRequired,
  };
}

module.exports = {
  EMPTY_GUARDRAILS,
  createGuardrailId,
  normalizePriority,
  normalizeGuardrailList,
  normalizeCreativeGuardrails,
  guardrailsSignature,
  guardrailsContentSignature,
  hashGuardrails,
  hasActiveGuardrails,
  mergeGuardrailsWithLegacy,
  resolveProjectGuardrails,
  formatGuardrailsPromptBlock,
  isVisualGuardrail,
  extractProhibitedTargets,
  validateOutputAgainstGuardrails,
};
