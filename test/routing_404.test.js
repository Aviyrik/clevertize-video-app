// Addresses, 404s, missing files, absolute share-image URLs and expired-session handling.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'clevercut-test-'));
process.env.DATABASE_URL = '';

const routes = require('../src/utils/appRoutes.js');
const { app } = require('../server');

const DIST_INDEX = path.join(__dirname, '..', 'dist', 'index.html');
let server;
let base;
let createdDist = false;

test.before(async () => {
  // The server serves the built shell; make a minimal one if the app hasn't been built
  if (!fs.existsSync(DIST_INDEX)) {
    fs.mkdirSync(path.dirname(DIST_INDEX), { recursive: true });
    fs.writeFileSync(DIST_INDEX, '<!doctype html><html><head><meta property="og:image" content="/og-image.png" /></head><body><div id="root"></div></body></html>');
    createdDist = true;
  }
  delete process.env.APP_BASE_URL;
  await new Promise((r) => {
    server = app.listen(0, '127.0.0.1', () => {
      base = `http://127.0.0.1:${server.address().port}`;
      r();
    });
  });
});

test.after(async () => {
  if (server) await new Promise((r) => server.close(r));
  if (createdDist) fs.unlinkSync(DIST_INDEX);
});

const get = async (p, headers = {}) => {
  const r = await fetch(base + p, { headers });
  return { status: r.status, type: r.headers.get('content-type') || '', body: await r.text() };
};

test('appRoutes: views and addresses map both ways', () => {
  assert.equal(routes.pathForView('hub'), '/');
  assert.equal(routes.pathForView('home'), '/');
  assert.equal(routes.pathForView('studio', 'brief'), '/studio');
  assert.equal(routes.pathForView('studio', 'entry'), '/', 'the studio entry step is the hub');
  assert.equal(routes.pathForView('library'), '/projects');
  assert.equal(routes.pathForView('business'), '/businesses');
  assert.equal(routes.viewForPath('/projects/'), 'projects');
  assert.equal(routes.viewForPath('/verify-email'), null);
  assert.equal(routes.initialViewForPath('/studio'), 'hub', 'a reload mid-film opens the hub, not an empty studio');
  assert.equal(routes.initialViewForPath('/businesses'), 'businesses');
  assert.ok(routes.isKnownAppPath('/reset-password?token=x'));
  assert.ok(!routes.isKnownAppPath('/pricing'));
});

test('known addresses get the app with 200; unknown ones get it with a real 404', async () => {
  for (const p of ['/', '/studio', '/projects', '/businesses', '/verify-email', '/reset-password']) {
    const r = await get(p);
    assert.equal(r.status, 200, p);
    assert.match(r.type, /text\/html/, p);
    assert.match(r.body, /id="root"/, p);
  }
  const missing = await get('/some-page-that-does-not-exist');
  assert.equal(missing.status, 404);
  assert.match(missing.body, /id="root"/, 'the app still loads and shows Page not found');
});

test('"/" is the built app, never the legacy public/index.html page', async () => {
  const r = await get('/');
  assert.doesNotMatch(r.body, /Send to|Render video<\/button>/);
  assert.match(r.body, /id="root"/);
});

test('missing files are a plain 404, never the app page', async () => {
  for (const p of ['/robots.txt', '/favicon.ico', '/videos/missing.mp4', '/assets/nope.js']) {
    const r = await get(p);
    assert.equal(r.status, 404, p);
    assert.match(r.type, /text\/plain/, p);
  }
});

test('unknown API calls stay JSON 404s', async () => {
  const r = await get('/api/nope');
  assert.equal(r.status, 404);
  assert.match(r.type, /application\/json/);
});

test('share image URLs are absolute (link previews need them)', async () => {
  // Without APP_BASE_URL the request's own host is used (fetch can't override Host, so use the server's)
  const r = await get('/');
  assert.ok(r.body.includes(`content="${base}/og-image.png"`), 'og:image uses the request host');
  assert.doesNotMatch(r.body, /content="\/og-image\.png"/);
  process.env.APP_BASE_URL = 'https://app.clevercut.example/';
  try {
    const r2 = await get('/projects');
    assert.match(r2.body, /content="https:\/\/app\.clevercut\.example\/og-image\.png"/);
  } finally {
    delete process.env.APP_BASE_URL;
  }
});

test('App wires addresses, Page not found and expired-session sign-out', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  const authSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AuthScreen.jsx'), 'utf8');
  assert.ok(appSrc.includes("window.addEventListener('popstate', onPopState)"), 'Back/Forward handled');
  assert.ok(appSrc.includes('window.history.pushState({ view: activeAppView }'), 'view changes add history entries');
  assert.ok(appSrc.includes('<NotFoundScreen onGoHome={handleLeaveNotFound} />'), 'unknown addresses show Page not found');
  assert.ok(appSrc.includes("new CustomEvent('clevercut:session-expired')"), '401s on signed-in calls are detected');
  assert.ok(appSrc.includes('notice={sessionNotice}') && authSrc.includes('data-testid="auth-notice"'), 'log-in screen explains why');
});
