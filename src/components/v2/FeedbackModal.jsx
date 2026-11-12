import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Bug,
  Sparkles,
  Lightbulb,
  MessageCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'Report a Bug',
    label: 'Report a Bug',
    icon: Bug,
    description: 'Something is broken or not working as expected',
    color: 'var(--cc-text-2)',
  },
  {
    id: 'AI Output Feedback',
    label: 'AI Output Feedback',
    icon: Sparkles,
    description: 'Issues with script, hook, or video quality',
    color: 'var(--cc-text-2)',
  },
  {
    id: 'Feature Request',
    label: 'Feature Request',
    icon: Lightbulb,
    description: 'An idea or tool you would love to see added',
    color: 'var(--cc-text-2)',
  },
  {
    id: 'General Feedback',
    label: 'General Feedback',
    icon: MessageCircle,
    description: 'Thoughts, praise, or general suggestions',
    color: 'var(--cc-text-2)',
  },
];

const MAX_MESSAGE_LENGTH = 3000;
const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per screenshot
const MAX_COMBINED_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB combined
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export default function FeedbackModal({
  isOpen,
  onClose,
  currentUser,
  activeBusiness,
  activeProject,
  activeProjectId,
  studioMode = 'simple',
  studioStage = 'brief',
  activeView = 'studio',
  generationId = null,
  getAuthHeaders = () => ({}),
}) {
  const [category, setCategory] = useState('Report a Bug');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showContextPreview, setShowContextPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const autoCloseTimerRef = useRef(null);

  // Clear auto-close timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, []);

  // Handle ESC key to close modal safely
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting]);

  if (!isOpen) return null;

  // Gather automatic context
  const gatheredContext = {
    userName: currentUser?.name || 'Anonymous User',
    userEmail: currentUser?.email || 'N/A',
    brandName: activeBusiness?.name || activeBusiness?.businessName || 'N/A',
    projectName:
      activeProject?.title ||
      activeProject?.product ||
      activeProject?.name ||
      (activeProjectId ? `Project ${activeProjectId}` : 'Untitled Project'),
    projectId: activeProjectId || activeProject?.id || 'N/A',
    appMode: (studioMode === 'director' || studioMode === 'advanced') ? 'Director Mode' : 'Simple Studio',
    workflowStage:
      activeView === 'studio'
        ? (studioMode === 'director' || studioMode === 'advanced')
          ? studioStage
          : 'Simple Studio - 3-Step Creation'
        : activeView,
    generationId: generationId || 'N/A',
    submissionDate: new Date().toISOString(),
    browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Browser',
    device:
      typeof window !== 'undefined'
        ? `${window.screen?.width || 0}x${window.screen?.height || 0} (${navigator?.platform || 'Unknown OS'})`
        : 'Unknown Device',
    currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
  };

  const handleModalClose = () => {
    if (isSubmitting) return;
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    // If successfully submitted, reset fields upon closing
    if (submitSuccess) {
      setMessage('');
      setAttachments([]);
      setCategory('Report a Bug');
      setSubmitSuccess(false);
    }
    setErrorMessage('');
    onClose();
  };

  const validateAndAddFiles = (files) => {
    setErrorMessage('');
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      setErrorMessage(`You can attach up to ${MAX_ATTACHMENTS} screenshots in total.`);
      return;
    }

    const currentTotalSize = attachments.reduce((sum, a) => sum + (a.size || 0), 0);
    const newFilesTotalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    if (currentTotalSize + newFilesTotalSize > MAX_COMBINED_SIZE_BYTES) {
      setErrorMessage(
        `Total combined size of screenshots (${((currentTotalSize + newFilesTotalSize) / (1024 * 1024)).toFixed(1)}MB) exceeds the 10MB limit.`
      );
      return;
    }

    const newAttachments = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check mime type
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        setErrorMessage(
          `"${file.name}" has an unsupported format. Please upload PNG, JPG, or JPEG screenshots.`
        );
        return;
      }

      // Check size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(
          `"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 5MB per screenshot.`
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64Data = dataUrl.split(';base64,')[1];
        setAttachments((prev) => [
          ...prev,
          {
            id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            mime: file.type || 'image/png',
            size: file.size,
            data: base64Data,
            previewUrl: dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    validateAndAddFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    validateAndAddFiles(files);
  };

  const handleRemoveAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setErrorMessage('Please describe your issue or suggestion before submitting.');
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setErrorMessage(`Message must be within ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        category,
        message: trimmedMessage,
        attachments: attachments.map((a) => ({
          name: a.name,
          mime: a.mime,
          data: a.data,
          size: a.size,
        })),
        context: gatheredContext,
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to send your feedback right now. Please try again.');
      }

      setSubmitSuccess(true);
      // Automatically close modal after 2.5 seconds, while allowing user to close sooner
      autoCloseTimerRef.current = setTimeout(() => {
        handleModalClose();
      }, 2500);
    } catch (err) {
      console.error('[Feedback error]', err);
      // Retain the user's message and attachments on failure so work is never lost!
      setErrorMessage(err.message || 'Unable to send your feedback right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) handleModalClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 14,
          border: '1px solid var(--border-default)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'var(--accent-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cc-emphasis)',
              }}
            >
              <MessageSquare size={19} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Feedback & Issue Reporting
              </h3>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 12,
                  color: 'var(--text-tertiary)',
                }}
              >
                Share an issue or suggestion.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {submitSuccess ? (
            /* Success State */
            <div
              style={{
                padding: '36px 16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(95, 212, 174, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--success)',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h4
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Thank You!
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                  maxWidth: '380px',
                }}
              >
                Your feedback has been sent.
              </p>
              <button
                type="button"
                onClick={handleModalClose}
                style={{
                  marginTop: 12,
                  padding: '9px 24px',
                  backgroundColor: 'var(--cc-action)',
                  color: 'var(--cc-on-action)',
                  border: 'none',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cc-action-hover)')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--cc-action)')
                }
              >
                Close
              </button>
            </div>
          ) : (
            /* Form Input State */
            <>
              {/* Error Banner */}
              {errorMessage && (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 122, 107, 0.12)',
                    border: '1px solid rgba(255, 122, 107, 0.3)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: 13,
                    color: '#FFA79C',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--error)' }} />
                  <span style={{ lineHeight: 1.4 }}>{errorMessage}</span>
                </div>
              )}

              {/* Category Selection */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.005em',
                    marginBottom: 8,
                  }}
                >
                  Feedback Category
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 8,
                  }}
                >
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    const IconComp = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        role="button"
                        tabIndex={0}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                          border: `1.5px solid ${isSelected ? 'var(--cc-emphasis)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'var(--bg-active)';
                            e.currentTarget.style.borderColor = 'var(--border-default)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          }
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            backgroundColor: 'var(--cc-hover)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: cat.color,
                            flexShrink: 0,
                          }}
                        >
                          <IconComp size={15} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: isSelected ? 600 : 600,
                              color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {cat.label}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Message Multiline Textarea */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <label
                    htmlFor="feedback-message"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.005em',
                    }}
                  >
                    Your Message <span style={{ color: 'var(--cc-emphasis)' }}>*</span>
                  </label>
                  <span
                    style={{
                      fontSize: 12,
                      color:
                        message.length > MAX_MESSAGE_LENGTH
                          ? 'var(--error)'
                          : 'var(--text-tertiary)',
                    }}
                  >
                    {message.length} / {MAX_MESSAGE_LENGTH}
                  </span>
                </div>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue or share your suggestion..."
                  rows={4}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    lineHeight: 1.5,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--cc-selected-line)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-default)')}
                />
              </div>

              {/* Screenshot Attachments */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.005em',
                    }}
                  >
                    Screenshots (Optional)
                  </label>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {attachments.length} / {MAX_ATTACHMENTS} attached (max 5MB each, 10MB total)
                  </span>
                </div>

                {/* Upload Drag/Click Zone */}
                {attachments.length < MAX_ATTACHMENTS && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    style={{
                      border: `1.5px dashed ${isDragging ? 'var(--cc-emphasis)' : 'var(--border-default)'}`,
                      backgroundColor: isDragging ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                      borderRadius: 8,
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Upload size={16} style={{ color: 'var(--cc-emphasis)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Click to attach screenshots or drag & drop (PNG, JPG, JPEG)
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                {/* Attachment Previews */}
                {attachments.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      marginTop: 10,
                    }}
                  >
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 6,
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                          <img
                            src={att.previewUrl}
                            alt={att.name}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 4,
                              objectFit: 'cover',
                              border: '1px solid var(--border-default)',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ overflow: 'hidden' }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '320px',
                              }}
                            >
                              {att.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                              {(att.size / 1024).toFixed(0)} KB
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-tertiary)',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                          title="Remove attachment"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Automatic Context Summary Disclosure */}
              <div
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  padding: '8px 12px',
                }}
              >
                <div
                  onClick={() => setShowContextPreview(!showContextPreview)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Info size={13} style={{ color: 'var(--cc-emphasis)' }} />
                    <span>
                      Automatic context included: <strong>{gatheredContext.brandName}</strong> ·{' '}
                      <strong>{gatheredContext.appMode}</strong>
                    </span>
                  </div>
                  {showContextPreview ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </div>

                {showContextPreview && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '4px 12px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-tertiary)' }}>User: </span>
                      {gatheredContext.userName}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)' }}>Email: </span>
                      {gatheredContext.userEmail}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)' }}>Project: </span>
                      {gatheredContext.projectName}
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)' }}>Stage: </span>
                      {gatheredContext.workflowStage}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Controls */}
        {!submitSuccess && (
          <div
            style={{
              padding: '14px 22px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={handleModalClose}
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !message.trim()}
              style={{
                padding: '8px 20px',
                backgroundColor:
                  isSubmitting || !message.trim()
                    ? 'rgba(244, 244, 236, 0.1)'
                    : 'var(--cc-action)',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--cc-on-action)',
                cursor: isSubmitting || !message.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && message.trim()) {
                  e.currentTarget.style.backgroundColor = 'var(--cc-action-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting && message.trim()) {
                  e.currentTarget.style.backgroundColor = 'var(--cc-action)';
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Feedback</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
