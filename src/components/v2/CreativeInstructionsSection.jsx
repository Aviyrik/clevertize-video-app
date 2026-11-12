import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  CheckCircle2,
  Ban,
  Shield,
} from 'lucide-react';
import {
  normalizeClientGuardrails,
  guardrailsCount,
  addGuardrailInstruction,
  updateGuardrailInstruction,
  removeGuardrailInstruction,
} from '../../utils/guardrails.js';

/**
 * Compact, collapsible Creative Instructions (Do's & Don'ts) input block.
 * Intentionally secondary to the main Brief and collapsed by default.
 * Shared across Director Mode (Screen02Brief) and Simple Mode (SimpleBusinessStudio).
 */
export default function CreativeInstructionsSection({
  creativeGuardrails,
  onChange,
  draftInputs = null,
  onDraftChange = null,
  defaultExpanded = false,
  expanded,
  onToggleExpand = null,
}) {
  const hasDraftInput = Boolean(
    (draftInputs?.doText && String(draftInputs.doText).trim()) ||
    (draftInputs?.dontText && String(draftInputs.dontText).trim())
  );
  const [localExpanded, setLocalExpanded] = useState(Boolean(defaultExpanded));
  const isExpanded = typeof expanded === 'boolean' ? expanded : localExpanded;

  const setExpandedState = (next) => {
    if (typeof onToggleExpand === 'function') {
      onToggleExpand(next);
    } else {
      setLocalExpanded(next);
    }
  };

  React.useEffect(() => {
    if (hasDraftInput) {
      setExpandedState(true);
    }
  }, [hasDraftInput]);
  const [localDoText, setLocalDoText] = useState('');
  const [localDontText, setLocalDontText] = useState('');
  const [editingItem, setEditingItem] = useState(null); // { type: 'do'|'dont', id, text, priority }

  const isControlledDraft = Boolean(onDraftChange);
  const newDoText = isControlledDraft ? String(draftInputs?.doText ?? '') : localDoText;
  const newDontText = isControlledDraft ? String(draftInputs?.dontText ?? '') : localDontText;

  const setNewDoText = (val) => {
    if (isControlledDraft) {
      onDraftChange({ doText: val, dontText: newDontText });
    } else {
      setLocalDoText(val);
    }
  };

  const setNewDontText = (val) => {
    if (isControlledDraft) {
      onDraftChange({ doText: newDoText, dontText: val });
    } else {
      setLocalDontText(val);
    }
  };

  const normalized = normalizeClientGuardrails(creativeGuardrails);
  const { dosCount, dontsCount, total } = guardrailsCount(normalized);

  const emitChange = (next) => {
    if (typeof onChange === 'function') {
      onChange(next);
    }
  };

  const handleAddDo = () => {
    const clean = newDoText.trim();
    if (!clean) return;
    emitChange(addGuardrailInstruction(normalized, 'do', clean, 'critical'));
    setNewDoText('');
  };

  const handleAddDont = () => {
    const clean = newDontText.trim();
    if (!clean) return;
    emitChange(addGuardrailInstruction(normalized, 'dont', clean, 'critical'));
    setNewDontText('');
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const clean = editingItem.text.trim();
    if (!clean) {
      emitChange(removeGuardrailInstruction(normalized, editingItem.type, editingItem.id));
    } else {
      emitChange(
        updateGuardrailInstruction(normalized, editingItem.type, editingItem.id, {
          text: clean,
          priority: editingItem.priority,
        })
      );
    }
    setEditingItem(null);
  };

  const handleTogglePriority = (type, item) => {
    const nextPriority = item.priority === 'preference' ? 'critical' : 'preference';
    emitChange(updateGuardrailInstruction(normalized, type, item.id, { priority: nextPriority }));
  };

  const handleDelete = (type, id) => {
    if (editingItem && editingItem.id === id) setEditingItem(null);
    emitChange(removeGuardrailInstruction(normalized, type, id));
  };

  const renderGroup = ({
    type,
    title,
    hint,
    items,
    inputValue,
    setInputValue,
    onAdd,
    placeholder,
    accentColor,
    icon,
  }) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 14px',
        borderRadius: 10,
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon}
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            {title}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{hint}</span>
      </div>

      {/* Existing Instruction Rows */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item) => {
            const isEditing = editingItem && editingItem.id === item.id && editingItem.type === type;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 7,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editingItem.text}
                      onChange={(e) =>
                        setEditingItem((prev) => ({ ...prev, text: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEdit();
                        } else if (e.key === 'Escape') {
                          setEditingItem(null);
                        }
                      }}
                      autoFocus
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        borderRadius: 5,
                        border: '1px solid var(--accent-primary)',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      aria-label="Save instruction"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--success, #10b981)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      aria-label="Cancel edit"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: 'var(--text-primary)',
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.text}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleTogglePriority(type, item)}
                      title="Click to switch between Critical (enforced) and Preference (advisory)"
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 10,
                        border: `1px solid ${item.priority === 'preference' ? 'var(--border-default)' : `${accentColor}55`}`,
                        backgroundColor: item.priority === 'preference' ? 'transparent' : `${accentColor}15`,
                        color: item.priority === 'preference' ? 'var(--text-tertiary)' : accentColor,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        flexShrink: 0,
                      }}
                    >
                      {item.priority === 'preference' ? 'Preference' : 'Critical'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingItem({
                          type,
                          id: item.id,
                          text: item.text,
                          priority: item.priority,
                        })
                      }
                      aria-label="Edit instruction"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: 3,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Edit3 size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(type, item.id)}
                      aria-label="Remove instruction"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--error, #ef4444)',
                        cursor: 'pointer',
                        padding: 3,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Simple Add Row */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: 7,
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: 12,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!inputValue.trim()}
          style={{
            padding: '7px 12px',
            borderRadius: 7,
            border: '1px solid var(--border-default)',
            backgroundColor: inputValue.trim() ? 'var(--bg-surface)' : 'transparent',
            color: inputValue.trim() ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <Plus size={13} />
          <span>Add</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: `1px solid ${total > 0 ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-subtle)'}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Compact Collapsible Header */}
      <button
        type="button"
        onClick={() => setExpandedState(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="creative-instructions-panel"
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
          <Shield size={14} style={{ color: total > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Creative Instructions
          </span>
        </div>

        {/* Subtle active badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {total > 0 ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 12,
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            >
              ✓ {[
                dosCount > 0 ? `${dosCount} Do${dosCount > 1 ? "'s" : ''}` : null,
                dontsCount > 0 ? `${dontsCount} Don't${dontsCount > 1 ? 's' : ''}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          ) : hasDraftInput ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 12,
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#F59E0B',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              Draft text · click Add
            </span>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {isExpanded ? 'Optional · Open' : 'Optional · Not added'}
            </span>
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div
          id="creative-instructions-panel"
          style={{
            padding: '4px 16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 12,
          }}
        >
          {renderGroup({
            type: 'do',
            title: "A. Must Follow (Do's)",
            hint: 'Key offer, CTA, product benefit or visual requirement',
            items: normalized.dos,
            inputValue: newDoText,
            setInputValue: setNewDoText,
            onAdd: handleAddDo,
            placeholder: 'e.g. Mention festive 20% offer or BIS Hallmark purity',
            accentColor: '#10b981',
            icon: <CheckCircle2 size={14} style={{ color: '#10b981' }} />,
          })}

          {renderGroup({
            type: 'dont',
            title: "B. Must Avoid (Don'ts)",
            hint: 'Restricted phrases, competitor names or unwanted visuals',
            items: normalized.donts,
            inputValue: newDontText,
            setInputValue: setNewDontText,
            onAdd: handleAddDont,
            placeholder: 'e.g. Do not mention competitor brands or say "cheapest"',
            accentColor: '#ef4444',
            icon: <Ban size={14} style={{ color: '#ef4444' }} />,
          })}
        </div>
      )}
    </div>
  );
}
