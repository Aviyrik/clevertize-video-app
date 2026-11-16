// Phone layout: the components are styled inline, so phone behaviour lives in index.css rules that
// target class hooks on the components. These checks keep the hooks and rules from drifting apart.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const css = read('src/index.css');
const src = {
  shell: read('src/components/v2/AppShell.jsx'),
  guided: read('src/components/GuidedStudio.jsx'),
  simple: read('src/components/v2/SimpleBusinessStudio.jsx'),
  hub: read('src/components/v2/CreationEntryHub.jsx'),
  business: read('src/components/v2/BusinessOnboardingModal.jsx'),
  script: read('src/components/v2/ExistingScriptModal.jsx'),
  url: read('src/components/v2/UrlResearchModal.jsx'),
  feedback: read('src/components/v2/FeedbackModal.jsx'),
  tour: read('src/components/v2/ProductTourEngine.jsx'),
};

test('every phone class hook used in index.css exists on a component', () => {
  const hooks = {
    'header-crumb-parent': src.shell,
    'header-crumb-current': src.shell,
    'header-draft-status': src.shell,
    'studio-progress': src.guided + src.simple,
    'studio-progress--compact': src.simple,
    'production-bar--multi': src.guided,
    'production-bar-actions': src.guided,
    'production-bar-primary': src.guided,
    'hub-hero-visual': src.hub,
    'hub-card-action-label': src.hub,
    'category-card-grid': src.business,
    'category-card-visual': src.business,
    'script-modal-stepper': src.script,
    'url-scan-row': src.url,
    'brief-textarea': src.guided + src.simple,
    'brief-dictate-btn': src.guided + src.simple,
    'tap-target': src.guided + src.shell,
  };
  for (const [hook, code] of Object.entries(hooks)) {
    assert.ok(css.includes(`.${hook}`), `index.css styles .${hook}`);
    assert.ok(code.includes(hook), `a component carries the ${hook} class`);
  }
});

test('fields are 16px on phones so iOS Safari does not zoom on focus', () => {
  const phone = css.slice(css.indexOf('@media (max-width: 768px)'));
  assert.match(phone, /textarea,\s*select\s*\{\s*font-size: 16px !important;/);
});

test('no grid forces a fixed column wider than a small phone', () => {
  const files = ['src/App.jsx', 'src/components/GuidedStudio.jsx', 'src/components/CreativeWorkspace.jsx',
    ...fs.readdirSync(path.join(__dirname, '../src/components/v2')).filter((f) => f.endsWith('.jsx')).map((f) => `src/components/v2/${f}`)];
  for (const f of files) {
    const bad = read(f).match(/minmax\((2[2-9]\d|[3-9]\d\d)px,/g);
    assert.equal(bad, null, `${f} should wrap wide minimums as minmax(min(Npx, 100%), …)`);
  }
  assert.ok(src.feedback.includes("repeat(2, minmax(0, 1fr))"), 'Feedback categories cannot push past the dialog');
});

test('text is never below the 12px minimum', () => {
  for (const [name, code] of Object.entries(src)) {
    assert.ok(!/fontSize: 11(\.5)?\b/.test(code), `${name} has no 11/11.5px text`);
  }
});

test('tour shows a centred card when the step target is off-screen (closed mobile drawer)', () => {
  assert.ok(src.tour.includes('r.right <= 0 || r.left >= vw || r.bottom <= 0 || r.top >= vh'));
});

test('Scan URL keeps a single primary (green) action at a time', () => {
  assert.ok(src.url.includes("backgroundColor: scanResult ? 'var(--bg-elevated)' : 'var(--cc-action)'"));
  assert.ok(src.url.includes("backgroundColor: scanResult ? 'var(--cc-action)' : 'var(--bg-surface)'"));
});
