// Automated Tests for CleverCut Email Verification Processing & UI
// Verifies backend endpoint POST /api/auth/verify-email, token consumption,
// concurrency safety, expiry handling, session absence, and frontend UI states.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { app } = require('../server');
const db = require('../engine/db');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) await new Promise((r) => server.close(r));
});

async function postVerify(body) {
  const res = await fetch(`${baseUrl}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, body: data };
}

test('Verification Processing: Valid token successfully verifies user email and sets timestamp', async () => {
  const email = `verify-success-${Date.now()}@example.com`;
  const user = await db.createUser({
    email,
    password: 'Password123!',
    name: 'Verified User',
  });

  assert.strictEqual(user.emailVerified, false);
  assert.strictEqual(user.emailVerifiedAt, null);

  const tokenObj = await db.createEmailVerificationToken(user.id);
  assert.ok(tokenObj.rawToken);

  // Send raw token to /api/auth/verify-email
  const { status, body } = await postVerify({ token: tokenObj.rawToken });

  assert.strictEqual(status, 200);
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.email, email);
  assert.match(body.message, /verified successfully/i);
  assert.strictEqual(body.token, undefined, 'Verification must NOT return a session token');

  // Verify DB state
  const updated = await db.findUserById(user.id);
  assert.strictEqual(updated.emailVerified, true);
  assert.ok(updated.emailVerifiedAt, 'emailVerifiedAt must be populated');

  // Verify token in DB is marked as used
  const usedToken = await db.getVerificationTokenByHash(tokenObj.tokenHash);
  assert.ok(usedToken.usedAt, 'Token usedAt must be populated in DB');

  // Active token query must now return null
  const activeAfter = await db.getActiveVerificationTokenForUser(user.id);
  assert.strictEqual(activeAfter, null);

  await db.deleteUser(user.id);
});

test('Verification Processing: Verification does not create any authenticated session', async () => {
  const email = `verify-no-session-${Date.now()}@example.com`;
  const user = await db.createUser({
    email,
    password: 'Password123!',
    name: 'No Session User',
  });

  const tokenObj = await db.createEmailVerificationToken(user.id);
  const { body } = await postVerify({ token: tokenObj.rawToken });

  assert.strictEqual(body.token, undefined);

  // Confirm no session exists for user
  const fs = require('fs');
  if (fs.existsSync('data/sessions.json')) {
    const sessions = JSON.parse(fs.readFileSync('data/sessions.json', 'utf8'));
    const userSessions = sessions.filter((s) => s.userId === user.id);
    assert.strictEqual(userSessions.length, 0, 'No session should be created by verification');
  }

  await db.deleteUser(user.id);
});

test('Verification Processing: Expired token is rejected with TOKEN_EXPIRED', async () => {
  const email = `verify-expired-${Date.now()}@example.com`;
  const user = await db.createUser({
    email,
    password: 'Password123!',
    name: 'Expired Token User',
  });

  const tokenObj = await db.createEmailVerificationToken(user.id, { expiresInMinutes: -10 });

  const { status, body } = await postVerify({ token: tokenObj.rawToken });

  assert.strictEqual(status, 400);
  assert.strictEqual(body.success, false);
  assert.strictEqual(body.code, 'TOKEN_EXPIRED');
  assert.match(body.error, /has expired/i);

  // User must remain unverified
  const checkUser = await db.findUserById(user.id);
  assert.strictEqual(checkUser.emailVerified, false);

  await db.deleteUser(user.id);
});

test('Verification Processing: Invalid or missing token is rejected with TOKEN_INVALID or TOKEN_REQUIRED', async () => {
  // 1. Missing token
  const res1 = await postVerify({});
  assert.strictEqual(res1.status, 400);
  assert.strictEqual(res1.body.code, 'TOKEN_REQUIRED');

  // 2. Empty string token
  const res2 = await postVerify({ token: '   ' });
  assert.strictEqual(res2.status, 400);
  assert.strictEqual(res2.body.code, 'TOKEN_REQUIRED');

  // 3. Completely bogus token
  const res3 = await postVerify({ token: 'nonexistent_token_hex_999999999' });
  assert.strictEqual(res3.status, 400);
  assert.strictEqual(res3.body.code, 'TOKEN_INVALID');
  assert.match(res3.body.error, /invalid or has already been used/i);
});

test('Verification Processing: Reused token is rejected with TOKEN_ALREADY_USED', async () => {
  const email = `verify-reused-${Date.now()}@example.com`;
  const user = await db.createUser({
    email,
    password: 'Password123!',
    name: 'Reused Token User',
  });

  const tokenObj = await db.createEmailVerificationToken(user.id);

  // First verification succeeds
  const res1 = await postVerify({ token: tokenObj.rawToken });
  assert.strictEqual(res1.status, 200);
  assert.strictEqual(res1.body.success, true);

  // Second verification with same token fails
  const res2 = await postVerify({ token: tokenObj.rawToken });
  assert.strictEqual(res2.status, 400);
  assert.strictEqual(res2.body.code, 'TOKEN_ALREADY_USED');
  assert.match(res2.body.error, /invalid or has already been used/i);

  // User state remains verified and uncorrupted
  const checkUser = await db.findUserById(user.id);
  assert.strictEqual(checkUser.emailVerified, true);

  await db.deleteUser(user.id);
});

test('Verification Processing: Concurrent requests cannot reuse a token', async () => {
  const email = `verify-concurrent-${Date.now()}@example.com`;
  const user = await db.createUser({
    email,
    password: 'Password123!',
    name: 'Concurrent User',
  });

  const tokenObj = await db.createEmailVerificationToken(user.id);

  // Fire 2 concurrent requests with the identical token
  const [resA, resB] = await Promise.all([
    postVerify({ token: tokenObj.rawToken }),
    postVerify({ token: tokenObj.rawToken }),
  ]);

  const statuses = [resA.status, resB.status].sort();
  // Exactly one must succeed with 200, one must fail with 400
  assert.deepStrictEqual(statuses, [200, 400]);

  const success = resA.status === 200 ? resA : resB;
  const failure = resA.status === 400 ? resA : resB;

  assert.strictEqual(success.body.success, true);
  assert.strictEqual(failure.body.success, false);
  assert.strictEqual(failure.body.code, 'TOKEN_ALREADY_USED');

  await db.deleteUser(user.id);
});

test('Verification Processing: Already verified account state is preserved across repeated requests', async () => {
  const email = `verify-already-${Date.now()}@example.com`;
  const user = await db.createUser({
    email,
    password: 'Password123!',
    name: 'Already Verified User',
  });

  const tokenObj = await db.createEmailVerificationToken(user.id);
  await postVerify({ token: tokenObj.rawToken });

  const firstState = await db.findUserById(user.id);
  assert.strictEqual(firstState.emailVerified, true);
  const firstVerifiedAt = firstState.emailVerifiedAt;

  // Try verifying again with same token
  const retryRes = await postVerify({ token: tokenObj.rawToken });
  assert.strictEqual(retryRes.status, 400);

  // Verify timestamp and verified flag did not get corrupted
  const secondState = await db.findUserById(user.id);
  assert.strictEqual(secondState.emailVerified, true);
  assert.strictEqual(secondState.emailVerifiedAt, firstVerifiedAt);

  await db.deleteUser(user.id);
});

test('Verification UI: EmailVerificationScreen component covers all required states and security rules', () => {
  const code = fs.readFileSync(
    path.join(__dirname, '../src/components/v2/EmailVerificationScreen.jsx'),
    'utf8'
  );

  // 1. Loading state
  assert.ok(code.includes('Verifying your email address...'), 'Must render loading message');

  // 2. Success state
  assert.ok(code.includes('Your email has been verified successfully!'), 'Must render success message');
  assert.ok(code.includes('Return to Login'), 'Must provide Return to Login action');

  // 3. Expired link state
  assert.ok(code.includes('This verification link has expired. Please request a new one.'), 'Must render expired link message');

  // 4. Invalid link state
  assert.ok(code.includes('This verification link is invalid or has already been used.'), 'Must render invalid link message');

  // 5. Network / server error state with retry
  assert.ok(code.includes('Retry Verification'), 'Must provide retry button on network error');

  // 6. Security: Immediately clears token from browser address bar using replaceState
  assert.ok(code.includes('window.history.replaceState'), 'Must call window.history.replaceState to sanitize URL');
  assert.ok(code.includes('url.searchParams.delete(\'token\')'), 'Must strip token from URL parameters');

  // 7. Security: Does not store raw token in localStorage or sessionStorage
  assert.ok(!code.includes("localStorage.setItem('clevertize_verification_token'"), 'Must NOT store token in localStorage');
  assert.ok(!code.includes("sessionStorage.setItem('clevertize_verification_token'"), 'Must NOT store token in sessionStorage');

  // 8. Security: Prevents duplicate API calls on re-renders
  assert.ok(code.includes('hasExecutedRef.current'), 'Must use ref guard to prevent duplicate API executions');
});

test('Verification Navigation: App.jsx captures verification route and direct URL navigation', () => {
  const appCode = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');

  // App imports EmailVerificationScreen
  assert.ok(
    appCode.includes("import EmailVerificationScreen from './components/v2/EmailVerificationScreen.jsx'"),
    'App.jsx must import EmailVerificationScreen'
  );

  // Checks URL pathname and token query param on mount
  assert.ok(
    appCode.includes("window.location.pathname.startsWith('/verify-email')"),
    'App.jsx must inspect pathname for /verify-email'
  );
  assert.ok(
    appCode.includes("new URLSearchParams(window.location.search).has('token')"),
    'App.jsx must inspect search params for token'
  );

  // Renders EmailVerificationScreen on verification route
  assert.ok(
    appCode.includes('<EmailVerificationScreen'),
    'App.jsx must render EmailVerificationScreen'
  );

  // Returns to login cleanly
  assert.ok(
    appCode.includes('handleReturnFromVerification'),
    'App.jsx must handle return from verification'
  );
});
