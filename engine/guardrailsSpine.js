/**
 * engine/guardrailsSpine.js
 * Modular Adapter & Orchestration Layer for Creative Guardrails (Do's & Don'ts) Spine.
 *
 * SPINE OWNERSHIP BOUNDARY (Section 6):
 * Shubhiksha (AI Intelligence Team) owns the dedicated Do's & Don'ts Spine reasoning engine.
 * This module acts strictly as the modular backend adapter, schema validator, and fail-closed
 * production guard so the underlying Spine can be swapped or upgraded via `registerGuardrailsSpineProvider`
 * without altering application storage, API endpoints, or stage orchestration.
 */

const { callClaude } = require('./claude');
const {
  normalizeCreativeGuardrails,
  hasActiveGuardrails,
  extractProhibitedTargets,
  isVisualGuardrail,
} = require('./guardrails');

const SPINE_OWNER = 'Shubhiksha (AI Intelligence Team)';

let externalSpineProvider = null;

/**
 * Allows the AI Intelligence Team to plug in the production Do's & Don'ts Spine
 * at runtime/boot without changing storage, API routes, or orchestration code.
 */
function registerGuardrailsSpineProvider(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Guardrails Spine provider must be a function.');
  }
  externalSpineProvider = fn;
}

function resetGuardrailsSpineProvider() {
  externalSpineProvider = null;
}

// =========================================================================
// DEVELOPMENT-ONLY / TEMPORARY SPINE PROMPT PLACEHOLDER
// Owned by Shubhiksha (AI Intelligence Team). Do not treat as final approved Spine.
// =========================================================================
const TEMPORARY_GUARDRAILS_SPINE_PROMPT = `You are acting as a TEMPORARY development adapter for the CleverCut Creative Guardrails (Do's & Don'ts) Spine.
Analyze the user's submitted Creative Guardrails alongside the Business Profile and Brief.

Your tasks:
1. Interpret mandatory instructions (Must Follow / Do's) and restrictions (Must Avoid / Don'ts) while preserving the user's original intent and exact wording.
2. Distinguish 'critical' mandates from softer 'preference' guidelines.
3. Identify any contradictory instructions between Do's and Don'ts (or within the same list).
4. Identify unsupported factual or superlative claims (e.g., "#1", "100% guaranteed", "cures", unverified clinical/ranking claims) that are not verified in the brief.
5. Tag scope accurately ('dialogue' | 'visual' | 'claims' | 'tone' | 'general') and extract concrete check_keywords / forbidden_terms / visual_restrictions.
6. Return ONLY a valid JSON object matching the schema below.

Required JSON Schema:
{
  "normalized_dos": [
    {
      "id": "string",
      "original_text": "string",
      "interpreted_rule": "string",
      "priority": "critical | preference",
      "scope": "dialogue | visual | claims | tone | general",
      "check_keywords": ["string"]
    }
  ],
  "normalized_donts": [
    {
      "id": "string",
      "original_text": "string",
      "interpreted_rule": "string",
      "priority": "critical | preference",
      "scope": "dialogue | visual | claims | tone | general",
      "forbidden_terms": ["string"],
      "visual_restrictions": ["string"]
    }
  ],
  "conflicts": [
    {
      "id": "string",
      "item_a_id": "string",
      "item_b_id": "string",
      "description": "string",
      "severity": "critical | warning",
      "resolution_hint": "string"
    }
  ],
  "unsupported_claims": [
    {
      "id": "string",
      "source_id": "string",
      "text": "string",
      "claim_type": "superlative | medical | statistical | guarantee | comparison | unverified",
      "reason": "string",
      "requires_verification": true
    }
  ],
  "summary": "string"
}`;

function validateGuardrailsSpineSchema(data) {
  if (!data || typeof data !== 'object') return false;
  return Boolean(
    Array.isArray(data.normalized_dos) &&
    Array.isArray(data.normalized_donts) &&
    Array.isArray(data.conflicts) &&
    Array.isArray(data.unsupported_claims) &&
    typeof data.summary === 'string'
  );
}

const UNSUPPORTED_CLAIM_PATTERNS = [
  { re: /\b100\s*%/i, type: 'statistical', reason: 'Absolute 100% claim requires verified proof or substantiation in brief.' },
  { re: /#\s*1\b|\bno\.?\s*1\b|\bnumber\s*(?:one|1)\b/i, type: 'superlative', reason: 'Ranking claim (#1 / Number 1) requires third-party verification.' },
  { re: /\bbest\s+in\s+(?:the\s+)?(?:city|town|country|india|world)\b/i, type: 'superlative', reason: 'Unqualified geographic superlative claim is unverified.' },
  { re: /\bguarantee(?:d|s)?\b/i, type: 'guarantee', reason: 'Absolute guarantee claim requires explicit terms or proof.' },
  { re: /\b(?:cure|cures|miracle|clinically\s+proven|doctor\s+recommended)\b/i, type: 'medical', reason: 'Medical/clinical efficacy claim requires regulatory substantiation.' },
  { re: /\blowest\s+price|\bcheapest\b/i, type: 'comparison', reason: 'Market-wide price claim cannot be verified from brief alone.' },
];

const OPPOSITE_TOPIC_PAIRS = [
  { a: /\bfree\b/i, b: /\b(?:no|avoid|never|don't|do\s+not)\b.*\bfree\b|\bfree\b.*\b(?:avoid|never|prohibit)/i, topic: '"free" promotional claims' },
  { a: /\bguarantee|100\s*%|\bno\.?\s*1\b|#\s*1|\bcheapest\b|\bbest\b/i, b: /\b(?:exaggerated|unverified|guarantee|100\s*%|medical|false)\s*claims?\b/i, topic: 'strong/unverified promotional claims' },
  { a: /\bdiscount|\boffer\b|\bsale\b|\b\d+%\s*off\b/i, b: /\b(?:discount|discounts|price|pricing|sale|promo)\b/i, topic: 'discounts or pricing mentions' },
  { a: /\bcompetitor|versus|\bvs\b/i, b: /\bcompetitor/i, topic: 'competitor references' },
  { a: /\brobust|bright|flashy|loud|bold\b/i, b: /\bminimal|understated|quiet|no\s+flash/i, topic: 'visual or tonal intensity' },
];

/**
 * Deterministic development-only structural interpreter used strictly outside production
 * when Shubhiksha's dedicated Spine / Claude API is unavailable or MOCK_SPINE=true.
 */
function runDevPlaceholderGuardrailsSpine({
  creativeGuardrails,
  brief = '',
  businessName = '',
}) {
  const norm = normalizeCreativeGuardrails(creativeGuardrails);
  const briefLower = String(brief || '').toLowerCase();

  const normalized_dos = norm.dos.map((d) => {
    const isVis = isVisualGuardrail(d.text);
    const kws = (d.text.match(/[#₹$€£]?\d+(?:\.\d+)?%?|[A-Za-z0-9\u0900-\u097F]{4,}/g) || [])
      .map((w) => w.toLowerCase())
      .filter((w) => !['mention', 'include', 'always', 'must', 'ensure', 'feature', 'highlight', 'required', 'should'].includes(w));

    return {
      id: d.id,
      original_text: d.text,
      interpreted_rule: `Must preserve and reflect: ${d.text}`,
      priority: d.priority || 'critical',
      scope: isVis ? 'visual' : 'dialogue',
      check_keywords: [...new Set(kws)],
    };
  });

  const normalized_donts = norm.donts.map((d) => {
    const isVis = isVisualGuardrail(d.text);
    const { phrases, terms } = extractProhibitedTargets(d.text);
    return {
      id: d.id,
      original_text: d.text,
      interpreted_rule: `Strictly exclude: ${d.text}`,
      priority: d.priority || 'critical',
      scope: isVis ? 'visual' : 'dialogue',
      forbidden_terms: [...new Set([...phrases, ...terms])],
      visual_restrictions: isVis ? [d.text] : [],
    };
  });

  const conflicts = [];
  for (const doItem of norm.dos) {
    const doLow = doItem.text.toLowerCase();
    for (const dontItem of norm.donts) {
      const dontLow = dontItem.text.toLowerCase();
      const { phrases, terms } = extractProhibitedTargets(dontItem.text);
      let conflictedTopic = null;

      // Direct target phrase/term overlap
      for (const target of [...phrases, ...terms]) {
        if (target && target.length >= 3 && new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(doItem.text)) {
          conflictedTopic = `"${target}"`;
          break;
        }
      }

      // Semantic rule pair check
      if (!conflictedTopic) {
        for (const pair of OPPOSITE_TOPIC_PAIRS) {
          if (pair.a.test(doLow) && pair.b.test(dontLow)) {
            conflictedTopic = pair.topic;
            break;
          }
        }
      }

      if (conflictedTopic) {
        conflicts.push({
          id: `conflict_${doItem.id}_${dontItem.id}`,
          item_a_id: doItem.id,
          item_b_id: dontItem.id,
          description: `Conflict detected on ${conflictedTopic}: Must Follow ("${doItem.text}") contradicts Must Avoid ("${dontItem.text}").`,
          severity: (doItem.priority === 'critical' && dontItem.priority === 'critical') ? 'critical' : 'warning',
          resolution_hint: `Clarify whether ${conflictedTopic} should be included or strictly excluded.`,
        });
      }
    }
  }

  const unsupported_claims = [];
  for (const doItem of norm.dos) {
    for (const pat of UNSUPPORTED_CLAIM_PATTERNS) {
      const match = doItem.text.match(pat.re);
      if (match) {
        const presentInBrief = briefLower.includes(match[0].toLowerCase());
        if (!presentInBrief) {
          unsupported_claims.push({
            id: `claim_${doItem.id}_${unsupported_claims.length + 1}`,
            source_id: doItem.id,
            text: doItem.text,
            claim_type: pat.type,
            reason: pat.reason,
            requires_verification: true,
          });
        }
      }
    }
  }

  return {
    normalized_dos,
    normalized_donts,
    conflicts,
    unsupported_claims,
    summary: `Analyzed ${normalized_dos.length} Do(s) and ${normalized_donts.length} Don't(s)${businessName ? ` for ${businessName}` : ''}.${conflicts.length ? ` Detected ${conflicts.length} conflict(s).` : ''}${unsupported_claims.length ? ` Flagged ${unsupported_claims.length} unverified claim(s).` : ''}`,
    source_guardrails_version: norm.version,
    is_mock: true,
    is_placeholder_adapter: true,
    spine_provider: 'dev_placeholder_guardrails_spine',
    spine_owner: SPINE_OWNER,
  };
}

/**
 * Invoke Creative Guardrails Spine interpretation.
 * Production Safety: Never silently returns mock data in production.
 */
async function interpretGuardrails({
  creativeGuardrails,
  businessName = '',
  businessType = 'Local Business',
  town = '',
  brief = '',
  language = 'English',
} = {}) {
  const norm = normalizeCreativeGuardrails(creativeGuardrails);

  // Fast empty bypass for projects without guardrails (Section 4 & 10)
  if (!hasActiveGuardrails(norm)) {
    return {
      empty: true,
      normalized_dos: [],
      normalized_donts: [],
      conflicts: [],
      unsupported_claims: [],
      summary: 'No custom Creative Guardrails specified for this project.',
      source_guardrails_version: norm.version || 0,
      is_mock: false,
      is_placeholder_adapter: false,
      spine_provider: 'none_required',
      spine_owner: SPINE_OWNER,
    };
  }

  // 1. Custom external Spine provider (owned by Shubhiksha) takes precedence when plugged in
  if (typeof externalSpineProvider === 'function') {
    const extResult = await externalSpineProvider({
      creativeGuardrails: norm,
      businessName,
      businessType,
      town,
      brief,
      language,
    });
    if (!validateGuardrailsSpineSchema(extResult)) {
      throw new Error('External Creative Guardrails Spine output failed schema validation.');
    }
    return {
      ...extResult,
      source_guardrails_version: norm.version,
      is_mock: Boolean(extResult.is_mock),
      is_placeholder_adapter: false,
      spine_provider: extResult.spine_provider || 'shubhiksha_guardrails_spine',
      spine_owner: SPINE_OWNER,
    };
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (process.env.MOCK_SPINE === 'true') {
    if (isProduction) {
      throw new Error('MOCK_SPINE cannot be used for Creative Guardrails Spine in production.');
    }
    return runDevPlaceholderGuardrailsSpine({ creativeGuardrails: norm, brief, businessName });
  }

  if (!apiKey) {
    if (isProduction) {
      throw new Error('Creative Guardrails Spine unavailable in production: AI service is not configured.');
    }
    return runDevPlaceholderGuardrailsSpine({ creativeGuardrails: norm, brief, businessName });
  }

  const userPrompt = `Analyze the user's Creative Guardrails for this campaign:

Business Name: ${businessName || 'Not specified'}
Category: ${businessType || 'General'}
Location: ${town || 'Not specified'}
Language: ${language || 'English'}
Original Brief:
"""
${String(brief || '').trim() || '(No brief text provided yet)'}
"""

User Must Follow (Do's):
${norm.dos.length ? norm.dos.map((d) => `- [id=${d.id}] [priority=${d.priority}] ${d.text}`).join('\n') : '(None)'}

User Must Avoid (Don'ts):
${norm.donts.length ? norm.donts.map((d) => `- [id=${d.id}] [priority=${d.priority}] ${d.text}`).join('\n') : '(None)'}

Output ONLY the JSON object.`;

  try {
    const raw = await callClaude({
      system: TEMPORARY_GUARDRAILS_SPINE_PROMPT,
      content: userPrompt,
      maxTokens: 2000,
      thinking: false,
    });

    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('Creative Guardrails Spine returned invalid JSON format.');
    }
    const parsed = JSON.parse(match[0]);
    if (!validateGuardrailsSpineSchema(parsed)) {
      throw new Error('Creative Guardrails Spine output failed schema validation.');
    }

    // Merge deterministic structural safety net for conflicts/claims if LLM missed obvious exact conflicts
    const structuralCheck = runDevPlaceholderGuardrailsSpine({ creativeGuardrails: norm, brief, businessName });
    const mergedConflicts = [...parsed.conflicts];
    for (const sc of structuralCheck.conflicts) {
      if (!mergedConflicts.some((c) => c.item_a_id === sc.item_a_id && c.item_b_id === sc.item_b_id)) {
        mergedConflicts.push(sc);
      }
    }
    const mergedClaims = [...parsed.unsupported_claims];
    for (const uc of structuralCheck.unsupported_claims) {
      if (!mergedClaims.some((u) => u.source_id === uc.source_id && u.claim_type === uc.claim_type)) {
        mergedClaims.push(uc);
      }
    }

    return {
      ...parsed,
      conflicts: mergedConflicts,
      unsupported_claims: mergedClaims,
      source_guardrails_version: norm.version,
      is_mock: false,
      is_placeholder_adapter: true,
      spine_provider: 'anthropic_placeholder_adapter',
      spine_owner: SPINE_OWNER,
    };
  } catch (err) {
    if (isProduction) {
      console.error('[guardrailsSpine] Spine execution failed in production:', err.message);
      throw new Error(`Creative Guardrails Spine failed in production: ${err.message}`);
    }
    console.warn('[guardrailsSpine] Spine call failed in dev/test, using labelled dev placeholder:', err.message);
    const fallback = runDevPlaceholderGuardrailsSpine({ creativeGuardrails: norm, brief, businessName });
    fallback.error_fallback = err.message;
    return fallback;
  }
}

module.exports = {
  SPINE_OWNER,
  TEMPORARY_GUARDRAILS_SPINE_PROMPT,
  registerGuardrailsSpineProvider,
  resetGuardrailsSpineProvider,
  validateGuardrailsSpineSchema,
  interpretGuardrails,
  runDevPlaceholderGuardrailsSpine,
};
