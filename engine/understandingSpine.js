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
 * Check if an existing interpretation is outdated compared to the current brief.
 */
function isUnderstandingOutdated(understanding, currentBrief) {
  if (!understanding) return false;
  const currentHash = hashBrief(currentBrief);
  const recordedHash = understanding.source_brief_hash;
  if (!recordedHash) return false;
  return recordedHash !== currentHash;
}

/**
 * Factory for a clean, schema-compliant empty understanding object.
 */
function createEmptyUnderstanding(brief = '') {
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
    creative_opportunity: '',
    assumptions: [],
    missing_information: [],
    approval_status: 'pending',
    source_brief: String(brief || '').trim(),
    source_brief_hash: hashBrief(brief),
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
}) {
  const brandLabel = (businessName || 'Your Business').trim();
  const locationLabel = town ? ` in ${town}` : '';
  const cleanBrief = (brief || '').trim();

  return {
    business_understanding: `${brandLabel} operates as a ${businessType.toLowerCase() || 'business'}${locationLabel}, focusing on delivering quality products and services to their local and digital customer base.`,
    campaign_objective: cleanBrief
      ? `Promote the core offer: "${cleanBrief.slice(0, 120)}", driving customer awareness, engagement, and direct footfall/inquiries.`
      : `Drive immediate customer attention and engagement for ${brandLabel}.`,
    target_audience: `Consumers seeking trustworthy ${businessType.toLowerCase() || 'offerings'}${locationLabel} who value authentic quality, clear pricing, and reliable service.`,
    core_communication: cleanBrief
      ? `Highlight: "${cleanBrief.slice(0, 100)}" as the compelling, timely reason to choose ${brandLabel}.`
      : `Position ${brandLabel} as the preferred, trusted destination.`,
    occasion_context: occasion
      ? `Tied to ${occasion}, leveraging seasonal shopping energy and celebration context.`
      : `Standard promotional timing with immediate call-to-action relevance.`,
    creative_guardrails: {
      dos: [
        `Explicitly state ${brandLabel}'s name and core value proposition.`,
        'Keep messaging crisp, energetic, and relatable.',
        'Include a clear call-to-action inviting viewers to visit or inquire.',
      ],
      donts: [
        'Avoid making unverified statistical or medical claims.',
        'Do not overcomplicate the narrative or distract from the main offer.',
        'Avoid vague pricing statements without context.',
      ],
    },
    creative_opportunity: `Leverage relatable everyday moments that resonate emotionally while showcasing the direct benefits of choosing ${brandLabel}.`,
    assumptions: [
      `Assumed ${brandLabel} serves standard retail/consumer needs in its category.`,
      'Assumed current promotional window allows immediate booking/visiting.',
    ],
    missing_information: [
      'Specific promotional expiry dates (if time-sensitive discount applies).',
      'Target price point or specific bundle details if applicable.',
    ],
    approval_status: 'pending',
    source_brief: cleanBrief,
    source_brief_hash: hashBrief(cleanBrief),
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
Analyze the user's submitted creative brief, business profile, and campaign parameters.
Structure the information into a rigorous, professional creative understanding before Creative Idea Generation.

Strict Guidelines:
1. Do not fabricate business facts, product benefits, statistics, or customer claims not supported by the brief.
2. Clearly distinguish confirmed facts from assumptions.
3. Identify genuine missing information where user confirmation would improve outputs.
4. Preserve original instructions, tone restrictions, and brand guardrails.
5. Return ONLY a valid JSON object matching the required schema below. No markdown fences, no conversational preambles.

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
}) {
  return `Analyze this brief and produce the structured understanding:

Business Name: ${businessName || 'Not specified'}
Business Category: ${businessType || 'General Retail'}
Location: ${town || 'Not specified'}
Website: ${websiteUrl || 'None'}
Language: ${language}
Brand Tone: ${brandTone}
Occasion Context: ${occasion || 'Standard'}
Original Brief:
"""
${cleanBrief}
"""
${userCorrections ? `User corrections / refinement notes for this regeneration:\n"""\n${userCorrections}\n"""` : ''}
${previousUnderstanding ? `Previous interpretation was:\n${JSON.stringify(previousUnderstanding, null, 2)}` : ''}

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
  userCorrections = '',
  previousUnderstanding = null,
}) {
  const cleanBrief = String(brief || '').trim();
  if (!cleanBrief) {
    throw new Error('A creative brief is required to generate AI Understanding.');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const apiKey = process.env.ANTHROPIC_API_KEY;

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
    });
    return mock;
  }

  const system = TEMPORARY_SPINE_SYSTEM_PROMPT;
  const userPrompt = buildTemporarySpineUserPrompt({
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

    return {
      business_understanding: String(parsed.business_understanding || '').trim(),
      campaign_objective: String(parsed.campaign_objective || '').trim(),
      target_audience: String(parsed.target_audience || '').trim(),
      core_communication: String(parsed.core_communication || '').trim(),
      occasion_context: String(parsed.occasion_context || '').trim(),
      creative_guardrails: {
        dos: Array.isArray(parsed.creative_guardrails?.dos) ? parsed.creative_guardrails.dos : [],
        donts: Array.isArray(parsed.creative_guardrails?.donts) ? parsed.creative_guardrails.donts : [],
      },
      creative_opportunity: String(parsed.creative_opportunity || '').trim(),
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
      missing_information: Array.isArray(parsed.missing_information) ? parsed.missing_information : [],
      approval_status: 'pending',
      source_brief: cleanBrief,
      source_brief_hash: hashBrief(cleanBrief),
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
    });
    fallback.error_fallback = err.message;
    return fallback;
  }
}

module.exports = {
  generateAiUnderstanding,
  validateUnderstandingSchema,
  createEmptyUnderstanding,
  hashBrief,
  isUnderstandingOutdated,
  VALID_APPROVAL_STATUSES,
  TEMPORARY_SPINE_SYSTEM_PROMPT,
};
