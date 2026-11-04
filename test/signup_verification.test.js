// Automated Tests for CleverCut Signup Email Verification Flow (Stage 1)
// Verifies user creation (unverified), token hashing, Resend dispatch, response structure,
// session absence, rollback on delivery failure, and duplicate email protection.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { app } = require('../server');
const db = require('../engine/db');
const emailService = require('../engine/email');

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
  emailService.resetCustomResendClient();
  if (server) await new Promise((r) => server.close(r));
});

test.beforeEach(() => {
  emailService.resetCustomResendClient();
  process.env.APP_BASE_URL = 'http://localhost:3000';
  process.env.AUTH_EMAIL_FROM = 'onboarding@resend.dev';
});

async function postSignup(body) {
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, body: data };
}

test('Signup Flow: Successful signup creates unverified user and generates hashed token', async () => {
  let dispatchedPayload = null;
  emailService.setCustomResendClient({
    emails: {
      send: async (payload) => {
        dispatchedPayload = payload;
        return { data: { id: 'msg_signup_test_123' }, error: null };
      },
    },
  });

  const email = `signup-unverified-${Date.now()}@example.com`;
  const { status, body } = await postSignup({
    email,
    password: 'Password123!',
    name: 'New Filmmaker',
    businessName: 'Filmmaker Studios',
    businessType: 'Production',
  });

  // 1. Check API response
  assert.strictEqual(status, 200);
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.status, 'pending_verification');
  assert.strictEqual(body.email, email);
  assert.strictEqual(body.token, undefined, 'Signup must NEVER return a session token');
  assert.match(body.message, /check your inbox/i);

  // 2. Check user record in database
  const user = await db.findUserByEmail(email);
  assert.ok(user, 'User must exist in database');
  assert.strictEqual(user.emailVerified, false, 'User must be created with emailVerified = false');
  assert.strictEqual(user.emailVerifiedAt, null, 'emailVerifiedAt must be null');

  // 3. Check verification token in database
  const activeToken = await db.getActiveVerificationTokenForUser(user.id);
  assert.ok(activeToken, 'Active verification token must exist');
  assert.ok(activeToken.tokenHash, 'Token hash must be present');
  assert.strictEqual(activeToken.usedAt, null, 'Token must be unused');
  assert.ok(new Date(activeToken.expiresAt) > new Date(), 'Expiry must be in future');

  // 4. Check email delivery was dispatched via Resend
  assert.ok(dispatchedPayload, 'Email must have been dispatched');
  assert.strictEqual(dispatchedPayload.to, email);
  assert.strictEqual(dispatchedPayload.subject, 'Verify your CleverCut email address');
  assert.ok(dispatchedPayload.html.includes('Verify your email address'), 'HTML must include heading');
  assert.ok(dispatchedPayload.html.includes('Verify Email'), 'HTML must include button');
  assert.ok(dispatchedPayload.html.includes('30 minutes'), 'HTML must include 30-minute expiry notice');
  assert.ok(dispatchedPayload.text.includes('Verify your email address'), 'Plain text must include heading');

  // Verify raw token is contained in link, but only hash was saved in DB
  const verifyLinkMatch = dispatchedPayload.text.match(/http:\/\/localhost:3000\/verify-email\?token=([a-f0-9]+)/);
  assert.ok(verifyLinkMatch, 'Email must contain verification URL with raw token');
  const rawTokenInEmail = verifyLinkMatch[1];
  assert.strictEqual(
    db.hashVerificationToken(rawTokenInEmail),
    activeToken.tokenHash,
    'Hash of raw token in email must match tokenHash in DB'
  );
  assert.notStrictEqual(rawTokenInEmail, activeToken.tokenHash, 'Raw token must never equal tokenHash');

  // Cleanup
  await db.deleteUser(user.id);
});

test('Signup Flow: Signup does not create any session record', async () => {
  emailService.setCustomResendClient({
    emails: {
      send: async () => ({ data: { id: 'msg_no_session_123' }, error: null }),
    },
  });

  const email = `no-session-${Date.now()}@example.com`;
  const { body } = await postSignup({
    email,
    password: 'Password123!',
    name: 'No Session Tester',
  });

  assert.strictEqual(body.token, undefined);

  const user = await db.findUserByEmail(email);
  assert.ok(user);

  // Attempting to query session with any dummy or undefined token should return null
  assert.strictEqual(await db.getUserBySessionToken('undefined'), null);
  assert.strictEqual(await db.getUserBySessionToken(''), null);

  await db.deleteUser(user.id);
});

test('Signup Flow: Email delivery rejection safely cleans up newly created user and tokens', async () => {
  // Provider rejection mock
  emailService.setCustomResendClient({
    emails: {
      send: async () => ({
        data: null,
        error: { message: 'Domain verification required on Resend', name: 'validation_error' },
      }),
    },
  });

  const email = `fail-delivery-${Date.now()}@example.com`;
  const { status, body } = await postSignup({
    email,
    password: 'Password123!',
    name: 'Failed Delivery User',
  });

  // Must return 502 error and informative message
  assert.strictEqual(status, 502);
  assert.match(body.error, /could not send your verification email/i);
  assert.match(body.details, /Domain verification required/i);

  // User must NOT be left orphaned in the database
  const userInDb = await db.findUserByEmail(email);
  assert.strictEqual(userInDb, null, 'Unverified user must be deleted if verification email fails');
});

test('Signup Flow: Existing user accounts are protected and cannot be overwritten', async () => {
  emailService.setCustomResendClient({
    emails: {
      send: async () => ({ data: { id: 'msg_existing_user' }, error: null }),
    },
  });

  const email = `existing-user-${Date.now()}@example.com`;
  // First signup succeeds
  const first = await postSignup({
    email,
    password: 'Password123!',
    name: 'Original User',
  });
  assert.strictEqual(first.status, 200);

  const originalUser = await db.findUserByEmail(email);
  assert.ok(originalUser);

  // Second signup with same email must fail with 400
  const second = await postSignup({
    email,
    password: 'DifferentPassword123!',
    name: 'Attacker Impersonator',
  });
  assert.strictEqual(second.status, 400);
  assert.match(second.body.error, /already exists/i);

  // Original user record must remain completely intact
  const verifiedAfter = await db.findUserByEmail(email);
  assert.strictEqual(verifiedAfter.id, originalUser.id);
  assert.strictEqual(verifiedAfter.name, 'Original User');

  await db.deleteUser(originalUser.id);
});

test('Signup Flow: Frontend AuthScreen and AuthModal handle pending_verification without session storage', () => {
  const authScreenCode = fs.readFileSync(path.join(__dirname, '../src/components/v2/AuthScreen.jsx'), 'utf8');
  const authModalCode = fs.readFileSync(path.join(__dirname, '../src/components/v2/AuthModal.jsx'), 'utf8');

  // Verify AuthScreen checks data.status === 'pending_verification'
  assert.ok(
    authScreenCode.includes("data.status === 'pending_verification'"),
    "AuthScreen must check data.status === 'pending_verification'"
  );
  assert.ok(
    authScreenCode.includes('setNoticeMsg(data.message'),
    'AuthScreen must set noticeMsg on pending_verification'
  );

  // Verify AuthModal checks data.status === 'pending_verification'
  assert.ok(
    authModalCode.includes("data.status === 'pending_verification'"),
    "AuthModal must check data.status === 'pending_verification'"
  );
  assert.ok(
    authModalCode.includes('setNoticeMsg(data.message'),
    'AuthModal must set noticeMsg on pending_verification'
  );
});
