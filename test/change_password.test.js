// Signed-in password change from Account settings: POST /api/auth/change-password.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

// keep test users out of data/ — that folder is the app's real local database
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'clevercut-test-'));
process.env.DATABASE_URL = '';

const { app } = require('../server');
const db = require('../engine/db');

let server;
let base;

test.before(async () => {
  process.env.NODE_ENV = 'test';
  delete process.env.EMAIL_VERIFICATION_REQUIRED;
  await new Promise((r) => {
    server = app.listen(0, '127.0.0.1', () => {
      base = `http://127.0.0.1:${server.address().port}`;
      r();
    });
  });
});

test.after(async () => {
  if (server) await new Promise((r) => server.close(r));
});

const post = async (p, body, token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(base + p, { method: 'POST', headers, body: JSON.stringify(body || {}) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};

let n = 0;
const makeUserWithSessions = async (count = 2) => {
  n += 1;
  const user = await db.createUser({ email: `pw${n}@example.test`, password: 'old-password-1', name: 'Asha' });
  const tokens = [];
  for (let i = 0; i < count; i += 1) tokens.push(await db.createSession(user.id));
  return { user, tokens };
};

test('change-password requires a session', async () => {
  const r = await post('/api/auth/change-password', { currentPassword: 'x', newPassword: 'y' });
  assert.equal(r.status, 401);
});

test('wrong current password is rejected and the password is unchanged', async () => {
  const { user, tokens } = await makeUserWithSessions(1);
  const r = await post('/api/auth/change-password', { currentPassword: 'nope', newPassword: 'new-password-2' }, tokens[0]);
  assert.equal(r.status, 403);
  assert.equal(r.body.code, 'WRONG_PASSWORD');
  await assert.doesNotReject(db.authenticateUser({ email: user.email, password: 'old-password-1' }));
});

test('too-short and unchanged new passwords are rejected', async () => {
  const { tokens } = await makeUserWithSessions(1);
  const short = await post('/api/auth/change-password', { currentPassword: 'old-password-1', newPassword: '123' }, tokens[0]);
  assert.equal(short.status, 400);
  assert.equal(short.body.code, 'WEAK_PASSWORD');
  const same = await post('/api/auth/change-password', { currentPassword: 'old-password-1', newPassword: 'old-password-1' }, tokens[0]);
  assert.equal(same.status, 400);
  assert.equal(same.body.code, 'SAME_PASSWORD');
});

test('success: new password works, old one does not, this session stays and other sessions end', async () => {
  const { user, tokens: [mine, other] } = await makeUserWithSessions(2);
  const r = await post('/api/auth/change-password', { currentPassword: 'old-password-1', newPassword: 'new-password-2' }, mine);
  assert.equal(r.status, 200);
  assert.equal(r.body.success, true);

  await assert.doesNotReject(db.authenticateUser({ email: user.email, password: 'new-password-2' }));
  await assert.rejects(db.authenticateUser({ email: user.email, password: 'old-password-1' }));

  assert.ok(await db.getUserBySessionToken(mine), 'the session that changed the password stays signed in');
  assert.equal(await db.getUserBySessionToken(other), null, 'other devices are signed out');
});

test('Account settings wires the change-password form', () => {
  const src = fs.readFileSync(path.join(__dirname, '../src/components/v2/AccountModal.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  assert.ok(src.includes('data-testid="change-password-trigger"') && src.includes('data-testid="change-password-form"'));
  assert.ok(src.includes('autoComplete="current-password"') && src.includes('autoComplete="new-password"'));
  assert.ok(appSrc.includes("fetch('/api/auth/change-password'") && appSrc.includes('onChangePassword={handleChangePassword}'));
});
