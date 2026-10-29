// Per-video logo for rendering. The logo chosen on the Settings screen for this video is what gets
// rendered; the business-profile logo only prefills it.
//   userContext.videoLogo === undefined -> not decided for this video yet: use the profile logo
//   userContext.videoLogo === null      -> removed for this video: render without a logo
//   userContext.videoLogo === { ... }   -> uploaded for this video

// The server (and Anthropic) accept only these image types
const RENDERABLE_MIME = /^image\/(jpeg|png|webp|gif)$/;

// Normalise a stored logo to { name, mime, data }, or null when it holds no usable image.
// Business onboarding stores a data-URL string; uploads store { name, mime, data, previewUrl };
// a profile saved to Postgres can come back as that object serialised to JSON text.
function toImageFile(value, name = 'Brand logo') {
  if (!value) return null;
  if (typeof value === 'string') {
    if (value.trim().startsWith('{')) {
      try { return toImageFile(JSON.parse(value), name); } catch { return null; }
    }
    const m = value.match(/^data:([^;,]+);base64,(.+)$/);
    return m && RENDERABLE_MIME.test(m[1]) ? { name, mime: m[1], data: m[2] } : null;
  }
  if (typeof value === 'object' && typeof value.data === 'string' && value.data && RENDERABLE_MIME.test(value.mime || '')) {
    return { name: value.name || name, mime: value.mime, data: value.data };
  }
  return null;
}

function profileLogoOf(ctx) {
  return (ctx && (ctx.logo || ctx.brandLogo)) || null;
}

function videoLogoOf(ctx) {
  if (!ctx) return null;
  if (ctx.videoLogo !== undefined) return toImageFile(ctx.videoLogo);
  return toImageFile(profileLogoOf(ctx));
}

// Request-body shape for /api/run and the script pipeline: { mime, data } or null
function videoLogoPayload(ctx) {
  const logo = videoLogoOf(ctx);
  return logo ? { mime: logo.mime, data: logo.data } : null;
}

// Support both CommonJS (Node.js test runner) and ES Modules (Vite)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { toImageFile, profileLogoOf, videoLogoOf, videoLogoPayload };
}
