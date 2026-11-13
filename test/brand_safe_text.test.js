// The rendering provider's name must never reach the UI. The backend still uses it, so the
// frontend source is kept clean and any server text that names it is replaced before display.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { brandSafeMessage, mentionsProvider, GENERIC_RENDER_ERROR } = require('../src/utils/brandSafeText.js');

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  return d.isDirectory() ? walk(p) : [p];
});

test('frontend source never names the rendering provider (except the filter itself)', () => {
  const root = path.join(__dirname, '..');
  const files = [
    ...walk(path.join(root, 'src')),
    path.join(root, 'index.html'),
    path.join(root, 'public/index.html'),
  ].filter((f) => /\.(jsx?|css|html|json)$/.test(f) && !f.endsWith(path.join('utils', 'brandSafeText.js')));
  const offenders = files.filter((f) => /magnific/i.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(offenders.map((f) => path.relative(root, f)), []);
});

test('server messages that name the provider are replaced; others pass through', () => {
  assert.equal(brandSafeMessage('Magnific HTTP 502: {"error":"bad gateway"}'), GENERIC_RENDER_ERROR);
  assert.equal(brandSafeMessage('Magnific flow for 9:16, product=yes, logo=no is not configured'), GENERIC_RENDER_ERROR);
  assert.equal(brandSafeMessage('magnific: queued', 'Rendering…'), 'Rendering…');
  assert.equal(brandSafeMessage('Unsupported aspect ratio "4:5"'), 'Unsupported aspect ratio "4:5"');
  assert.equal(brandSafeMessage(''), '');
  assert.equal(mentionsProvider('Rendering on Freepik'), true);
});

test('every place that shows render errors or statuses goes through the filter', () => {
  const app = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  const download = fs.readFileSync(path.join(__dirname, '../src/utils/downloadVideo.js'), 'utf8');
  assert.ok(app.includes('setErrorMessageRaw(brandSafeMessage(str))'), 'central error setter filters');
  assert.ok(app.includes('brandSafeMessage(data.status,'), 'render progress status filters');
  assert.ok(download.includes('brandSafeMessage(data.error,'), 'download errors filter');
});
