// Password reset (forgot password → email → reset screen), email verification enforced at login,
// and recovery from an expired verification link. Emails go to a fake Resend client so the links in
// them can be followed; nothing is really sent.
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
const emailService = require('../engine/email');

let server;
let base;
let sent = [];

test.before(async () => {
  await new Promise((r) => {
    server = app.listen(0, '127.0.0.1', () => {
      base = `http://127.0.0.1:${server.address().port}`;
      r();
    });
  });
});

test.after(async () => {
  emailService.resetCustomResendClient();
  if (server) await new Promise((r) => server.close(r));
});

test.beforeEach(() => {
  sent = [];
  emailService.setCustomResendClient({
    emails: { send: async (payload) => { sent.push(payload); return { data: { id: `email_${sent.length}` } }; } },
  });
  process.env.APP_BASE_URL = 'https://clevercut.example';
  delete process.env.EMAIL_VERIFICATION_REQUIRED;
  process.env.NODE_ENV = 'test';
});

const post = async (p, body, headers = {}) => {
  const r = await fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body || {}) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const linkToken = (email, route) => {
  const m = String(email.text || '').match(new RegExp(`(https?://[^\\s]+)/${route}\\?token=([0-9a-f]+)`));
  return m ? { origin: m[1], token: m[2] } : null;
};
const makeUser = (email, { verified = false } = {}) => db.createUser({ email, password: 'old-password-1', name: 'Asha' }).then(async (u) => {
  if (verified) {
    const t = await db.createEmailVerificationToken(u.id);
    await db.markEmailAsVerified(t.rawToken);
  }
  return u;
});

test('forgot password: same answer for any email, one link per minute, never the password', async () => {
  await makeUser('reset-a@example.com', { verified: true });

  const unknown = await post('/api/auth/forgot-password', { email: 'nobody@example.com' });
  const known = await post('/api/auth/forgot-password', { email: 'reset-a@example.com' });
  assert.equal(unknown.status, 200);
  assert.equal(known.status, 200);
  assert.equal(unknown.body.message, known.body.message, 'no way to tell which emails have accounts');

  assert.equal(sent.length, 1, 'only the real account gets an email');
  assert.equal(sent[0].to, 'reset-a@example.com');
  assert.match(sent[0].subject, /reset/i);
  const link = linkToken(sent[0], 'reset-password');
  assert.ok(link, 'the email carries a reset link');
  assert.equal(link.origin, 'https://clevercut.example');
  assert.ok(!JSON.stringify(sent[0]).includes('old-password-1'), 'the password is never emailed');

  await post('/api/auth/forgot-password', { email: 'reset-a@example.com' });
  assert.equal(sent.length, 1, 'a second request within a minute sends nothing');

  assert.equal((await post('/api/auth/forgot-password', { email: '' })).status, 400);
});

test('reset links ignore X-Forwarded-Host (no reset poisoning)', async () => {
  await makeUser('reset-host@example.com', { verified: true });
  delete process.env.APP_BASE_URL;
  await post('/api/auth/forgot-password', { email: 'reset-host@example.com' }, { 'X-Forwarded-Host': 'evil.example' });
  const link = linkToken(sent[0], 'reset-password');
  assert.ok(link);
  assert.ok(!link.origin.includes('evil.example'), `link must not point at the forwarded host: ${link.origin}`);
  assert.ok(link.origin.includes('127.0.0.1'), 'falls back to the real Host header');
});

test('resetting: the link is checked, works exactly once, signs out old sessions and signs the user in', async () => {
  const user = await makeUser('reset-b@example.com', { verified: true });
  const oldSession = await db.createSession(user.id);
  await post('/api/auth/forgot-password', { email: 'reset-b@example.com' });
  const { token } = linkToken(sent[0], 'reset-password');

  assert.deepEqual((await post('/api/auth/reset-password/check', { token })).body, { valid: true, code: 'TOKEN_VALID' });

  const weak = await post('/api/auth/reset-password', { token, password: '123' });
  assert.equal(weak.status, 400);
  assert.equal(weak.body.code, 'WEAK_PASSWORD');
  assert.equal((await post('/api/auth/reset-password/check', { token })).body.valid, true, 'a rejected password does not use up the link');

  const done = await post('/api/auth/reset-password', { token, password: 'new-password-2' });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.ok(done.body.token, 'signed in on this device');
  assert.equal(done.body.user.email, 'reset-b@example.com');

  const me = await fetch(base + '/api/auth/me', { headers: { Authorization: `Bearer ${oldSession}` } });
  assert.equal(me.status, 401, 'sessions from before the reset are signed out');

  assert.equal((await post('/api/auth/login', { email: 'reset-b@example.com', password: 'old-password-1' })).status, 401);
  assert.equal((await post('/api/auth/login', { email: 'reset-b@example.com', password: 'new-password-2' })).status, 200);

  const again = await post('/api/auth/reset-password', { token, password: 'another-password-3' });
  assert.equal(again.status, 400);
  assert.equal(again.body.code, 'TOKEN_ALREADY_USED');
  assert.equal((await post('/api/auth/reset-password/check', { token })).body.code, 'TOKEN_ALREADY_USED');
});

test('reset tokens: expired and replaced links are refused; bogus tokens are invalid', async () => {
  const user = await makeUser('reset-c@example.com', { verified: true });
  const expired = await db.createPasswordResetToken(user.id, { expiresInMinutes: -1 });
  assert.equal((await post('/api/auth/reset-password', { token: expired.rawToken, password: 'new-password-2' })).body.code, 'TOKEN_EXPIRED');

  const first = await db.createPasswordResetToken(user.id);
  const second = await db.createPasswordResetToken(user.id);
  assert.equal((await post('/api/auth/reset-password/check', { token: first.rawToken })).body.code, 'TOKEN_ALREADY_USED', 'a newer link replaces older ones');
  assert.equal((await post('/api/auth/reset-password/check', { token: second.rawToken })).body.valid, true);

  assert.equal((await post('/api/auth/reset-password/check', { token: 'f'.repeat(64) })).body.code, 'TOKEN_INVALID');
  const stored = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, 'password_reset_tokens.json'), 'utf8'));
  assert.ok(stored.every((t) => !JSON.stringify(t).includes(second.rawToken)), 'only token hashes are stored');
  assert.equal((await post('/api/auth/reset-password/check', { token: stored[stored.length - 1].tokenHash })).body.code, 'TOKEN_INVALID', 'a stored hash is not a usable token');
});

test('a password reset also verifies the email (the link proves inbox ownership)', async () => {
  const user = await makeUser('reset-d@example.com');
  assert.equal((await db.findUserById(user.id)).emailVerified, false);
  const t = await db.createPasswordResetToken(user.id);
  await post('/api/auth/reset-password', { token: t.rawToken, password: 'new-password-2' });
  assert.equal((await db.findUserById(user.id)).emailVerified, true);
});

test('login requires a verified email when enforced, including accounts from before verification existed', async () => {
  await makeUser('legacy@example.com'); // never verified, like accounts created before verification was added

  process.env.EMAIL_VERIFICATION_REQUIRED = 'true';
  const blocked = await post('/api/auth/login', { email: 'legacy@example.com', password: 'old-password-1' });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.code, 'EMAIL_NOT_VERIFIED');
  assert.equal(blocked.body.verificationSent, true);
  assert.ok(!blocked.body.token, 'no session for an unverified account');
  assert.equal(sent.length, 1);
  const { token } = linkToken(sent[0], 'verify-email');

  const wrongPassword = await post('/api/auth/login', { email: 'legacy@example.com', password: 'wrong-password' });
  assert.equal(wrongPassword.status, 401, 'verification status is only revealed to someone with the right password');

  // a second login straight away does not send another email (60-second cooldown)
  await post('/api/auth/login', { email: 'legacy@example.com', password: 'old-password-1' });
  assert.equal(sent.length, 1);

  assert.equal((await post('/api/auth/verify-email', { token })).status, 200);
  assert.equal((await post('/api/auth/login', { email: 'legacy@example.com', password: 'old-password-1' })).status, 200);
});

test('verification enforcement: on in production, off for local development, overridable', async () => {
  await makeUser('dev-unverified@example.com');
  assert.equal((await post('/api/auth/login', { email: 'dev-unverified@example.com', password: 'old-password-1' })).status, 200, 'local development: not enforced');
  process.env.NODE_ENV = 'production';
  assert.equal((await post('/api/auth/login', { email: 'dev-unverified@example.com', password: 'old-password-1' })).status, 403, 'production: enforced');
  process.env.EMAIL_VERIFICATION_REQUIRED = 'false';
  assert.equal((await post('/api/auth/login', { email: 'dev-unverified@example.com', password: 'old-password-1' })).status, 200, 'explicitly turned off');
});

test('an expired verification link can ask for a new one without revealing the email address', async () => {
  const user = await makeUser('expired-link@example.com');
  const old = await db.createEmailVerificationToken(user.id, { expiresInMinutes: -1 });
  // a real expired link is over 30 minutes old: back-date it so the 60-second resend cooldown doesn't apply
  const file = path.join(process.env.DATA_DIR, 'email_verification_tokens.json');
  const tokens = JSON.parse(fs.readFileSync(file, 'utf8'));
  tokens.find((t) => t.id === old.id).createdAt = new Date(Date.now() - 31 * 60 * 1000).toISOString();
  fs.writeFileSync(file, JSON.stringify(tokens));
  const res = await post('/api/auth/verify-email', { token: old.rawToken });
  assert.equal(res.body.code, 'TOKEN_EXPIRED');

  const again = await post('/api/auth/resend-verification', { token: old.rawToken });
  assert.equal(again.status, 200, JSON.stringify(again.body));
  assert.ok(!JSON.stringify(again.body).includes('expired-link@example.com'), 'the address is not shown to whoever holds the old link');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'expired-link@example.com', 'the new link goes to the account owner');
  const { token } = linkToken(sent[0], 'verify-email');
  assert.equal((await post('/api/auth/verify-email', { token })).status, 200);

  // resend cooldown still applies
  const soon = await post('/api/auth/resend-verification', { email: 'expired-link@example.com' });
  assert.ok([400, 429].includes(soon.status), 'already verified now, or rate limited');
});

test('the login screens call the real reset endpoint, and /reset-password has its own screen', () => {
  const src = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
  for (const file of ['src/components/v2/AuthScreen.jsx', 'src/components/v2/AuthModal.jsx']) {
    const s = src(file);
    assert.ok(s.includes("fetch('/api/auth/forgot-password'"), `${file}: Forgot password sends a real request`);
    assert.ok(!s.includes('Password reset link sent to ${'), `${file}: no fake "link sent" message`);
    assert.ok(s.includes("data.code === 'EMAIL_NOT_VERIFIED'"), `${file}: an unverified login shows the verify-your-email view`);
  }
  const app = src('src/App.jsx');
  assert.ok(app.includes('<ResetPasswordScreen'), 'App renders the reset screen');
  assert.ok(app.includes("!window.location.pathname.startsWith('/reset-password')"), 'a reset link is not mistaken for a verification link');
  assert.ok(src('src/components/v2/EmailVerificationScreen.jsx').includes('Send me a new link'), 'expired verification links offer a new one');
});
