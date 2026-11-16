/**
 * CleverCut renders videos itself as far as users are concerned: the name of the rendering
 * provider must never appear in the UI. The server can still return raw provider errors or
 * statuses (e.g. "Magnific HTTP 500: …"), so anything shown to users passes through here.
 */

// Built from pieces so the provider's name does not appear verbatim in the shipped bundle
const PROVIDER_PATTERN = new RegExp([['mag', 'nific'], ['free', 'pik']].map((p) => p.join('')).join('|'), 'i');

const GENERIC_RENDER_ERROR =
  'Something went wrong while rendering your video. Please try again in a moment.';

function mentionsProvider(text) {
  return typeof text === 'string' && PROVIDER_PATTERN.test(text);
}

// Messages naming the provider are replaced whole (they are usually technical), never patched.
function brandSafeMessage(text, fallback = GENERIC_RENDER_ERROR) {
  if (!text) return text;
  return mentionsProvider(text) ? fallback : text;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { brandSafeMessage, mentionsProvider, GENERIC_RENDER_ERROR };
}
