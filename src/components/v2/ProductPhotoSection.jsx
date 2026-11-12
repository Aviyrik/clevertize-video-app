import React from 'react';
import { Package, Upload, Trash2 } from 'lucide-react';
import OptionalFieldDisclosure from './OptionalFieldDisclosure.jsx';

export const PRODUCT_PHOTO_COPY = {
  title: 'Product Photo',
  description: 'Upload a photo of your product or packaging to help guide the generated scenes.',
  uploadCta: 'Upload product photo',
  formatsHint: 'PNG, JPG or WEBP · up to 10MB',
};

/**
 * Shared Product Photo upload, preview, replacement, and removal disclosure block.
 * Used identically inside Optional Details across Simple Studio and Director Mode.
 */
export default function ProductPhotoSection({
  id = 'product-photo',
  testId = 'product-photo-section',
  productPhoto = null,
  onUploadFile = null,
  onRemove = null,
  defaultExpanded = false,
  expanded,
  onToggleExpand = null,
}) {
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) return;
    if (typeof onUploadFile === 'function') {
      onUploadFile(file);
    }
  };

  const handleRemoveClick = () => {
    if (typeof onRemove === 'function') {
      onRemove();
    }
  };

  const previewSrc =
    productPhoto?.previewUrl ||
    (productPhoto?.data
      ? `data:${productPhoto.mime || 'image/jpeg'};base64,${productPhoto.data}`
      : '');

  return (
    <OptionalFieldDisclosure
      id={id}
      testId={testId}
      icon={Package}
      title={PRODUCT_PHOTO_COPY.title}
      isPopulated={Boolean(productPhoto)}
      populatedLabel={
        productPhoto?.name
          ? productPhoto.name.slice(0, 22)
          : 'Added'
      }
      defaultExpanded={defaultExpanded}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
    >
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
        {PRODUCT_PHOTO_COPY.description}
      </p>
      {productPhoto ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            padding: '10px 14px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {previewSrc && (
              <img
                src={previewSrc}
                alt="Product preview"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 6,
                  objectFit: 'cover',
                  border: '1px solid var(--border-subtle)',
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  maxWidth: 260,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {productPhoto.name || 'Product photo'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                {productPhoto.fromWebsite
                  ? '✓ Attached from website'
                  : 'Ready for video production'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <label
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Upload size={12} aria-hidden="true" />
              <span>Replace</span>
              <input
                type="file"
                accept="image/*"
                aria-label="Replace product photo"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
            </label>

            <button
              type="button"
              onClick={handleRemoveClick}
              aria-label="Remove product photo"
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--error)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Trash2 size={12} aria-hidden="true" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '16px',
            borderRadius: 8,
            border: '2px dashed var(--border-default)',
            backgroundColor: 'var(--bg-elevated)',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Upload size={14} aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              {PRODUCT_PHOTO_COPY.uploadCta}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {PRODUCT_PHOTO_COPY.formatsHint}
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            aria-label={PRODUCT_PHOTO_COPY.uploadCta}
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />
        </label>
      )}
    </OptionalFieldDisclosure>
  );
}
