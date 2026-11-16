/**
 * The app's addresses. Shared by the browser (address bar <-> view) and the server
 * (which answers unknown addresses with a real 404), so the two never disagree.
 *
 * Views: 'hub' (creation hub), 'studio', 'projects', 'businesses'. 'home', 'library' and
 * 'business' are older aliases still used in places.
 */

const VIEW_PATHS = {
  hub: '/',
  home: '/',
  studio: '/studio',
  projects: '/projects',
  library: '/projects',
  businesses: '/businesses',
  business: '/businesses',
};

// Screens opened from emailed links; handled by their own components
const LINK_PATHS = ['/verify-email', '/reset-password'];

const KNOWN_PATHS = ['/', '/studio', '/projects', '/businesses', ...LINK_PATHS];

function normalizePath(pathname) {
  const p = String(pathname || '/').split('?')[0].split('#')[0];
  if (p.length > 1 && p.endsWith('/')) return p.replace(/\/+$/, '') || '/';
  return p || '/';
}

function isKnownAppPath(pathname) {
  return KNOWN_PATHS.includes(normalizePath(pathname));
}

// Address for a view. The studio's entry step renders the hub, so it lives at '/'.
function pathForView(view, studioStage) {
  if (view === 'studio' && studioStage === 'entry') return '/';
  return VIEW_PATHS[view] || '/';
}

// View for an address (null for link screens and unknown addresses)
function viewForPath(pathname) {
  const p = normalizePath(pathname);
  if (p === '/') return 'hub';
  if (p === '/studio') return 'studio';
  if (p === '/projects') return 'projects';
  if (p === '/businesses') return 'businesses';
  return null;
}

// View to open on a fresh page load. A reload mid-film can't restore unsaved studio state,
// so /studio opens the hub (where Recent Projects resumes drafts) rather than an empty studio.
function initialViewForPath(pathname) {
  const v = viewForPath(pathname);
  return v === 'projects' || v === 'businesses' ? v : 'hub';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VIEW_PATHS, KNOWN_PATHS, normalizePath, isKnownAppPath, pathForView, viewForPath, initialViewForPath };
}
