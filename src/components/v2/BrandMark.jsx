import React from 'react';

/**
 * CleverCut brand mark: the clapperboard on a graphite squircle.
 * The clapper stick (the part that snaps shut to mark a cut) is the only
 * signal-green element, which ties the mark to the product name.
 */
export default function BrandMark({ size = 32, radius, style = {}, title = 'CleverCut' }) {
  const r = radius ?? Math.round(size * 0.28);
  return (
    <span
      role="img"
      aria-label={title}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: '#161614',
        boxShadow: 'inset 0 0 0 1px rgba(244, 244, 236, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      <svg
        width={Math.round(size * 0.56)}
        height={Math.round(size * 0.56)}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" stroke="#F3F3EE" />
        <path
          d="M20.2 6 3 11l-.9-2.4c-.4-1.1.2-2.4 1.3-2.8l13.7-5c1.1-.4 2.4.2 2.8 1.3Z"
          stroke="#C5EF34"
        />
        <path d="m6.2 5.3 3.1 3.9M12.4 3l3.1 4" stroke="#C5EF34" />
      </svg>
    </span>
  );
}
