import React from 'react';
import { Users } from 'lucide-react';
import OptionalFieldDisclosure from './OptionalFieldDisclosure.jsx';
import HelpTooltip from './HelpTooltip.jsx';
import { HELP_TOOLTIPS } from '../../data/tourSteps.js';
import { getSuggestedAudiences } from './BusinessOnboardingModal.jsx';

/**
 * Shared Target Audience disclosure row used across Simple Studio and Director Mode.
 */
export default function TargetAudienceSection({
  id = 'target-audience',
  testId = 'target-audience-section',
  targetAudience = '',
  businessType = 'Retail Store',
  onChange,
  defaultExpanded = false,
  expanded,
  onToggleExpand = null,
}) {
  const cleanAudience = String(targetAudience || '').trim();
  const currentItems = cleanAudience
    ? cleanAudience.split(' · ').map((s) => s.trim()).filter(Boolean)
    : [];
  const suggestions = getSuggestedAudiences(businessType);

  return (
    <OptionalFieldDisclosure
      id={id}
      testId={testId}
      icon={Users}
      title="Target Audience"
      isPopulated={Boolean(cleanAudience)}
      populatedLabel={cleanAudience ? cleanAudience.slice(0, 28) : 'Added'}
      defaultExpanded={defaultExpanded}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <label
          htmlFor={`${id}-input`}
          style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}
        >
          Who is this video for? (Target Audience)
        </label>
        <HelpTooltip
          title={HELP_TOOLTIPS.brief_audience.title}
          body={HELP_TOOLTIPS.brief_audience.body}
          ariaLabel="Help with target audience"
        />
      </div>

      <input
        id={`${id}-input`}
        type="text"
        aria-label="Target audience for this video"
        value={targetAudience || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder="e.g. Festival gift buyers, young professionals, neighborhood families..."
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 12px',
          fontSize: 13,
          borderRadius: 8,
          border: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
      />

      {suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {suggestions.map((aud, aIdx) => {
            const isSelected = currentItems.some((s) => s.toLowerCase() === aud.toLowerCase());
            return (
              <button
                key={aIdx}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  if (!onChange) return;
                  if (isSelected) {
                    const next = currentItems.filter((s) => s.toLowerCase() !== aud.toLowerCase());
                    onChange(next.join(' · '));
                  } else {
                    onChange([...currentItems, aud].join(' · '));
                  }
                }}
                style={{
                  padding: '5px 11px',
                  borderRadius: 18,
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: isSelected ? 'rgba(244, 244, 236, 0.07)' : 'var(--bg-elevated)',
                  border: `1px solid ${isSelected ? 'var(--cc-emphasis)' : 'var(--border-subtle)'}`,
                  color: isSelected ? 'var(--cc-emphasis)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isSelected ? `✓ ${aud}` : `+ ${aud}`}
              </button>
            );
          })}
        </div>
      )}
    </OptionalFieldDisclosure>
  );
}
