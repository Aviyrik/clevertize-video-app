import React from 'react';
import { AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react';

/**
 * Compact summary of a category compliance report (engine/categoryGuardrails.js buildComplianceReport):
 * rule breaks the scanner or reviewer found, and whether the film needs human review before the end frame.
 * Renders nothing when the report is clean and no review is needed.
 */
export default function ComplianceReportNotice({ report, testId = 'compliance-report', maxItems = 4 }) {
  if (!report) return null;
  const violations = report.violations || [];
  const gaps = report.safetyGaps || [];
  const reviewerItems = report.reviewer && report.reviewer.status === 'reviewed' ? (report.reviewer.violations || []) : [];
  const review = report.humanReview || {};
  const problems = [
    ...violations.map((v) => v.message),
    ...gaps.map((g) => `Safety visual missing: ${g.label}.`),
    ...reviewerItems.filter((v) => v.severity === 'reject').map((v) => `Reviewer: "${v.quote}" — ${v.why}`),
  ];
  const notes = reviewerItems.filter((v) => v.severity === 'review').map((v) => `Check: "${v.quote}" — ${v.why}`);
  if (!problems.length && !review.required && !notes.length) return null;

  const bad = problems.length > 0;
  return (
    <div
      data-testid={testId}
      role={bad ? 'alert' : 'status'}
      style={{
        marginBottom: 10,
        padding: '8px 10px',
        borderRadius: 'var(--cc-radius-xs)',
        border: `1px solid ${bad ? 'var(--cc-danger)' : 'var(--cc-line-2)'}`,
        backgroundColor: 'var(--cc-raised)',
        fontSize: 12,
        color: 'var(--cc-text-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: bad ? 'var(--cc-danger)' : 'var(--cc-text-1)' }}>
        {bad ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} style={{ color: 'var(--cc-success)' }} />}
        {bad
          ? `Category rules: ${problems.length} issue${problems.length === 1 ? '' : 's'} — this script won't render until they're fixed`
          : `Category rules passed${report.category ? ` (${report.category.name})` : ''}`}
      </span>
      {problems.slice(0, maxItems).map((p, i) => <span key={`p${i}`}>• {p}</span>)}
      {problems.length > maxItems && <span>• …and {problems.length - maxItems} more</span>}
      {notes.slice(0, 2).map((n, i) => <span key={`n${i}`} style={{ color: 'var(--cc-text-3)' }}>• {n}</span>)}
      {review.required && (
        <span data-testid={`${testId}-human-review`} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: 'var(--cc-warning)' }}>
          <UserCheck size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Human review before the end frame: {(review.reasons || []).join(' ')}</span>
        </span>
      )}
    </div>
  );
}
