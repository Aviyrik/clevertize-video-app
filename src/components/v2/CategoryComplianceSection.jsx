import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  normalizeCategoryCompliance,
  isProofFilled,
  missingRequiredProof,
  setProofValue,
  toggleMultiOption,
  complianceQuery,
} from '../../utils/categoryCompliance.js';

const TIER_LABEL = { high: 'High risk', medium: 'Medium risk', low: 'Low risk' };

const fieldStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 'var(--cc-radius-xs)',
  border: '1px solid var(--cc-line-2)',
  backgroundColor: 'var(--cc-raised)',
  color: 'var(--cc-text-1)',
  fontSize: 13,
  fontFamily: 'var(--cc-font-text)',
  outline: 'none',
  boxSizing: 'border-box',
};
const labelStyle = { fontSize: 12, fontWeight: 500, color: 'var(--cc-text-2)' };
const hintStyle = { fontSize: 12, color: 'var(--cc-text-3)' };

/**
 * Category rules for this film (spec: "Category Guardrails for Local Performance Ads").
 * Shows which category module the business type loads, lets the owner pick one when the type doesn't map
 * cleanly (never guessed), the property-vs-decor scope, and the per-category proof fields. A claim gated on a
 * proof field is only allowed when that field is filled.
 * Shared by Director Mode (Screen02Brief) and Simple Mode (SimpleBusinessStudio).
 */
export default function CategoryComplianceSection({ businessType, value, onChange, testId = 'category-compliance-section' }) {
  const current = normalizeCategoryCompliance(value);
  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const query = complianceQuery(businessType, current);

  useEffect(() => {
    let cancelled = false;
    setLoadError('');
    fetch(query)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => { if (!cancelled) setInfo(data); })
      .catch(() => { if (!cancelled) setLoadError('Category rules could not be loaded. The server still applies them.'); });
    return () => { cancelled = true; };
  }, [query]);

  const fields = (info && info.proofFields) || [];
  const missing = missingRequiredProof(fields, current);
  const mapping = (info && info.mapping) || null;
  const unmapped = mapping && mapping.status === 'unmapped';
  const needsScope = mapping && (mapping.status === 'needs_scope' || mapping.status === 'scope_selected');
  const attention = missing.length > 0 || unmapped || (mapping && mapping.status === 'needs_scope');

  useEffect(() => { if (attention) setExpanded(true); }, [attention]);

  const emit = (next) => { if (typeof onChange === 'function') onChange(normalizeCategoryCompliance(next)); };
  const filledCount = fields.filter((f) => isProofFilled(current.proof[f.id])).length;
  const category = info && info.category;

  const summary = category
    ? `${category.name} · ${TIER_LABEL[category.riskTier] || category.riskTier}`
    : info ? 'Universal rules only' : 'Loading…';

  return (
    <div
      data-testid={testId}
      style={{
        backgroundColor: 'var(--cc-surface)',
        border: `1px solid ${attention ? 'var(--cc-line-3)' : 'var(--cc-line-1)'}`,
        borderRadius: 'var(--cc-radius-sm)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`${testId}-panel`}
        style={{
          width: '100%', padding: '11px 16px', background: 'none', border: 'none', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {expanded ? <ChevronDown size={15} style={{ color: 'var(--cc-text-3)', flexShrink: 0 }} /> : <ChevronRight size={15} style={{ color: 'var(--cc-text-3)', flexShrink: 0 }} />}
          <ShieldCheck size={14} style={{ color: 'var(--cc-text-2)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cc-text-1)' }}>Category rules &amp; proof</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: attention ? 'var(--cc-warning)' : 'var(--cc-text-3)', flexShrink: 0 }}>
          {attention && <AlertTriangle size={13} />}
          {missing.length ? 'Required proof missing' : unmapped ? 'Pick a category' : summary}
          {!attention && fields.length > 0 ? ` · ${filledCount}/${fields.length} proof` : ''}
        </span>
      </button>

      {expanded && (
        <div id={`${testId}-panel`} style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loadError && <span style={hintStyle}>{loadError}</span>}

          {category && (
            <span style={hintStyle}>
              {category.name} · {TIER_LABEL[category.riskTier] || category.riskTier} · Human review: {category.humanReview}
              {category.defaultMood ? ` · Default mood: ${category.defaultMood}${info.mood && Array.isArray(info.mood.allowed) && info.mood.allowed.length === 1 ? ' only' : ''}` : ''}
            </span>
          )}

          {mapping && mapping.flag && (
            <span data-testid={`${testId}-flag`} style={{ ...hintStyle, color: 'var(--cc-warning)', display: 'flex', gap: 6 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{mapping.flag}</span>
            </span>
          )}

          {(unmapped || mapping?.status === 'owner_selected') && info && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={labelStyle}>Which category rules apply to this business?</span>
              <select
                data-testid={`${testId}-category`}
                value={current.category}
                onChange={(e) => emit({ ...current, category: e.target.value, proof: {} })}
                style={fieldStyle}
              >
                <option value="">None of these — universal rules only</option>
                {(info.categoryOptions || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{mapping.suggested === c.id ? ' (closest)' : ''}</option>
                ))}
              </select>
            </label>
          )}

          {needsScope && info && info.scopeOptions && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={labelStyle}>What is this film about?</span>
              <select
                data-testid={`${testId}-scope`}
                value={current.scope || info.scopeOptions[0].id}
                onChange={(e) => emit({ ...current, scope: e.target.value })}
                style={fieldStyle}
              >
                {info.scopeOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.id === 'real_estate' ? 'Property (RERA number required)' : 'Decor only'}</option>
                ))}
              </select>
            </label>
          )}

          {fields.length > 0 && (
            <span style={hintStyle}>
              Claims that need proof stay out of the script until the matching field is filled.
            </span>
          )}

          {fields.map((f) => {
            const val = current.proof[f.id];
            const isMissing = f.required && !isProofFilled(val);
            const title = (
              <span style={{ ...labelStyle, color: isMissing ? 'var(--cc-warning)' : labelStyle.color }}>
                {f.label}{isMissing ? ' — required' : ''}
              </span>
            );
            if (f.kind === 'confirm') {
              return (
                <label key={f.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    data-testid={`proof-${f.id}`}
                    checked={val === true}
                    onChange={(e) => emit(setProofValue(current, f.id, e.target.checked))}
                    style={{ marginTop: 2, accentColor: 'var(--cc-text-1)' }}
                  />
                  {title}
                </label>
              );
            }
            if (f.kind === 'select') {
              return (
                <label key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {title}
                  <select data-testid={`proof-${f.id}`} value={val || ''} onChange={(e) => emit(setProofValue(current, f.id, e.target.value))} style={fieldStyle}>
                    <option value="">Not stated</option>
                    {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
              );
            }
            if (f.kind === 'multi') {
              const list = Array.isArray(val) ? val : [];
              return (
                <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {title}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
                    {(f.options || []).map((o) => (
                      <label key={o.value} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--cc-text-2)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          data-testid={`proof-${f.id}-${o.value}`}
                          checked={list.includes(o.value)}
                          onChange={() => emit(toggleMultiOption(current, f.id, o.value))}
                          style={{ accentColor: 'var(--cc-text-1)' }}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <label key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {title}
                <input
                  type="text"
                  data-testid={`proof-${f.id}`}
                  value={typeof val === 'string' ? val : ''}
                  placeholder={f.placeholder || ''}
                  maxLength={300}
                  onChange={(e) => emit(setProofValue(current, f.id, e.target.value))}
                  style={{ ...fieldStyle, borderColor: isMissing ? 'var(--cc-warning)' : 'var(--cc-line-2)' }}
                />
                {f.unlocks && <span style={hintStyle}>Unlocks: {f.unlocks}</span>}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
