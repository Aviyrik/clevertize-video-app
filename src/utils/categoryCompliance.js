// Category compliance guardrails on the client: the owner's proof fields, the category pick for business types
// that don't map cleanly, and the human-review sign-off before render. The rules themselves live on the server
// (engine/rules/categoryGuardrails.json) and reach the brief form through GET /api/compliance/category.

// What travels in every generation / render request: { category, scope, proof }
function normalizeCategoryCompliance(value) {
  const v = value && typeof value === 'object' ? value : {};
  const proof = v.proof && typeof v.proof === 'object' ? v.proof : {};
  const cleanProof = {};
  for (const [k, val] of Object.entries(proof)) {
    if (val === true) cleanProof[k] = true;
    else if (Array.isArray(val)) { if (val.length) cleanProof[k] = val.map(String); }
    else if (typeof val === 'string') { if (val.trim()) cleanProof[k] = val; } // kept as typed (the server trims)
  }
  return {
    category: typeof v.category === 'string' ? v.category : '',
    scope: typeof v.scope === 'string' ? v.scope : '',
    proof: cleanProof,
  };
}

function isProofFilled(v) {
  if (v === true) return true;
  if (Array.isArray(v)) return v.length > 0;
  return typeof v === 'string' && v.trim().length > 0;
}

// Required proof fields that are still empty (e.g. the RERA number for a property ad)
function missingRequiredProof(fields, value) {
  const proof = normalizeCategoryCompliance(value).proof;
  return (fields || []).filter((f) => f.required && !isProofFilled(proof[f.id]));
}

function setProofValue(value, fieldId, fieldValue) {
  const base = normalizeCategoryCompliance(value);
  return { ...base, proof: { ...base.proof, [fieldId]: fieldValue } };
}

function toggleMultiOption(value, fieldId, option) {
  const base = normalizeCategoryCompliance(value);
  const current = Array.isArray(base.proof[fieldId]) ? base.proof[fieldId] : [];
  const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
  return { ...base, proof: { ...base.proof, [fieldId]: next } };
}

function complianceQuery(businessType, value) {
  const v = normalizeCategoryCompliance(value);
  const params = new URLSearchParams();
  params.set('businessType', String(businessType || ''));
  if (v.category) params.set('category', v.category);
  if (v.scope) params.set('scope', v.scope);
  return `/api/compliance/category?${params.toString()}`;
}

// Text shown in the sign-off prompt when the server answers HUMAN_REVIEW_REQUIRED (High-tier or flagged films)
function humanReviewPrompt(review) {
  const reasons = (review && Array.isArray(review.reasons) ? review.reasons : []).filter(Boolean);
  return [
    'Human review required before the end frame is added.',
    '',
    ...reasons.map((r) => `• ${r}`),
    '',
    'Confirm that a person has reviewed this script against the category rules and approves it for rendering.',
  ].join('\n');
}

// Support both CommonJS (Node.js test runner) and ES Modules (Vite)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeCategoryCompliance,
    isProofFilled,
    missingRequiredProof,
    setProofValue,
    toggleMultiOption,
    complianceQuery,
    humanReviewPrompt,
  };
}
