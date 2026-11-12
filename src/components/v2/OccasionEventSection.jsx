import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Search,
  X,
} from 'lucide-react';
import {
  EVENT_CATEGORIES,
  CREATIVE_INFLUENCE_OPTIONS,
  createEmptyEventContext,
  hasActiveClientEventContext,
  normalizeClientEventContext,
  updateClientEventField,
  searchEventSuggestions,
} from '../../utils/eventContext.js';

/**
 * Compact, collapsible Occasion & Event input block.
 * Secondary & optional on Brief page — collapsed by default with zero preselected events.
 * Stored independently from Creative Guardrails (Do's & Don'ts).
 */
export default function OccasionEventSection({
  eventContext,
  onChange,
  defaultExpanded = false,
  expanded,
  onToggleExpand = null,
}) {
  const [localExpanded, setLocalExpanded] = useState(Boolean(defaultExpanded));
  const isExpanded = typeof expanded === 'boolean' ? expanded : localExpanded;

  const handleToggleExpand = () => {
    const next = !isExpanded;
    if (typeof onToggleExpand === 'function') {
      onToggleExpand(next);
    } else {
      setLocalExpanded(next);
    }
  };
  const [showDropdown, setShowDropdown] = useState(false);

  const normalized = normalizeClientEventContext(eventContext);
  const isActive = hasActiveClientEventContext(normalized);
  const hasEventName = Boolean(normalized.name && normalized.name.trim());

  const suggestions = searchEventSuggestions(normalized.name, normalized.category).slice(0, 8);

  const emitChange = (next) => {
    if (typeof onChange === 'function') {
      onChange(next);
    }
  };

  const handleFieldChange = (patch) => {
    emitChange(updateClientEventField(normalized, patch));
  };

  const handleSelectSuggestion = (item) => {
    emitChange(
      updateClientEventField(normalized, {
        category: item.category,
        name: item.name,
        creativeInfluence: normalized.creativeInfluence || 'Subtly',
      })
    );
    setShowDropdown(false);
  };

  const handleClear = () => {
    const prevVer = normalized.version || 0;
    emitChange({
      ...createEmptyEventContext(),
      version: prevVer > 0 ? prevVer + 1 : 0,
      updatedAt: null,
    });
    setShowDropdown(false);
  };

  return (
    <div
      data-testid="occasion-event-section"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        overflow: 'visible',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Compact Collapsible Header */}
      <button
        type="button"
        onClick={handleToggleExpand}
        aria-expanded={isExpanded}
        aria-controls="occasion-event-panel"
        style={{
          width: '100%',
          padding: '11px 16px',
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {isExpanded ? (
            <ChevronDown size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          ) : (
            <ChevronRight size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          )}
          <Calendar size={14} style={{ color: isActive ? 'var(--cc-emphasis)' : 'var(--text-tertiary)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Occasion &amp; Event
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isActive ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 12,
                backgroundColor: 'rgba(244, 244, 236, 0.06)',
                color: 'var(--cc-emphasis)',
                border: '1px solid rgba(244, 244, 236, 0.225)',
                maxWidth: 190,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              ✓ {hasEventName ? normalized.name : (normalized.timing || 'Event details added')}
              {hasEventName && normalized.creativeInfluence ? ` · ${normalized.creativeInfluence}` : ''}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {isExpanded ? 'Optional · Open' : 'Optional · Not added'}
            </span>
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div
          id="occasion-event-panel"
          style={{
            padding: '12px 16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Creating this campaign around a festival, occasion or special event?
          </p>
          {/* 1. Event Category */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Event category <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(Optional)</span>
              </label>
              {isActive && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: 0,
                  }}
                >
                  <X size={11} />
                  <span>Clear event</span>
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EVENT_CATEGORIES.map((cat) => {
                const selected = normalized.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleFieldChange({ category: selected ? '' : cat.id })}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: selected ? 600 : 500,
                      backgroundColor: selected ? 'rgba(244, 244, 236, 0.07)' : 'var(--bg-elevated)',
                      border: selected ? '1px solid var(--cc-selected-line)' : '1px solid var(--border-subtle)',
                      color: selected ? 'var(--cc-emphasis)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Event Name (Searchable or Custom Entry) & 3. Event Timing */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <label
                htmlFor="occasion-event-name-input"
                style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}
              >
                Event name <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(Search or enter custom)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="occasion-event-name-input"
                  type="text"
                  value={normalized.name}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  onChange={(e) => {
                    handleFieldChange({ name: e.target.value });
                    setShowDropdown(true);
                  }}
                  placeholder="e.g. Diwali, Wedding Season, Local Marathon"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '7px 10px 7px 30px',
                    borderRadius: 7,
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
              </div>

              {showDropdown && suggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                    zIndex: 50,
                    maxHeight: 180,
                    overflowY: 'auto',
                  }}
                >
                  {suggestions.map((item) => (
                    <button
                      key={`${item.category}-${item.name}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(item);
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 12,
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span>{item.name}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{item.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="occasion-event-timing-input"
                style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}
              >
                Event timing <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(Optional)</span>
              </label>
              <input
                id="occasion-event-timing-input"
                type="text"
                value={normalized.timing}
                onChange={(e) => handleFieldChange({ timing: e.target.value })}
                placeholder="e.g. This weekend, next month, festive week"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '7px 10px',
                  borderRadius: 7,
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* 4. Creative Influence */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Creative influence{' '}
              <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>
                {hasEventName ? '(How strongly it guides the story)' : '(Select an event above first)'}
              </span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 6 }}>
              {CREATIVE_INFLUENCE_OPTIONS.map((opt) => {
                const selected = normalized.creativeInfluence === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!hasEventName}
                    onClick={() => handleFieldChange({ creativeInfluence: opt.id })}
                    style={{
                      padding: '7px 10px',
                      borderRadius: 7,
                      textAlign: 'left',
                      backgroundColor: selected ? 'rgba(244, 244, 236, 0.07)' : 'var(--bg-elevated)',
                      border: selected ? '1px solid var(--cc-selected-line)' : '1px solid var(--border-subtle)',
                      color: !hasEventName ? 'var(--text-tertiary)' : selected ? 'var(--cc-emphasis)' : 'var(--text-primary)',
                      cursor: hasEventName ? 'pointer' : 'not-allowed',
                      opacity: hasEventName ? 1 : 0.6,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 1 }}>{opt.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Additional Context */}
          <div>
            <label
              htmlFor="occasion-event-context-input"
              style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}
            >
              Additional context <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(Optional)</span>
            </label>
            <textarea
              id="occasion-event-context-input"
              rows={2}
              value={normalized.additionalContext}
              onChange={(e) => handleFieldChange({ additionalContext: e.target.value })}
              placeholder="e.g. Customers usually shop for family gifts 3–4 days ahead; keep focus on our new collection."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '7px 10px',
                borderRadius: 7,
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: 12,
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.45,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
