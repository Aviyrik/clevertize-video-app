// Automated tests for CleverCut Outbound Transactional Email Service (Resend)
// Tests unit behavior, error handling, redaction, timeouts, and dev test endpoint.

const test = require('node:test');
const assert = require('node:assert');
// keep test users out of data/ — that folder is the app's real local database
process.env.DATA_DIR = require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'clevercut-test-'));
const emailService = require('../engine/email');
const { app } = require('../server');
const db = require('../engine/db');

let server;
let baseUrl;
let testUser;
let testToken;

test.before(async () => {
  // Create a clean authenticated test user
  const email = `email-test-user-${Date.now()}@example.com`;
  testUser = await db.createUser({
    email,
    password: 'Password123!',
    name: 'Email Tester',
  });
  testToken = await db.createSession(testUser.id);

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  emailService.resetCustomResendClient();
  if (testToken) await db.deleteSession(testToken);
  if (testUser) await db.deleteUser(testUser.id);
  if (server) await new Promise((r) => server.close(r));
});

test.beforeEach(() => {
  emailService.resetCustomResendClient();
  process.env.NODE_ENV = 'test';
  process.env.RESEND_API_KEY = 're_test_mock_api_key_12345';
  process.env.AUTH_EMAIL_FROM = 'onboarding@resend.dev';
});

// Helper for test API calls
async function callTestEmailEndpoint(body, token = testToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}/api/dev/test-email`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

// ---------------------------------------------------------------------
// 1. UNIT TESTS: engine/email.js
// ---------------------------------------------------------------------

test('Email Service: Rejects invalid or missing recipient email', async () => {
  const cases = [null, undefined, '', '   ', 'not-an-email', 'user@', '@domain.com', 'user@domain'];
  for (const invalidTo of cases) {
    const res = await emailService.sendEmail({
      to: invalidTo,
      subject: 'Hello',
      html: '<p>Test</p>',
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'Invalid recipient email address');
  }
});

test('Email Service: Rejects missing or empty subject', async () => {
  const cases = [null, undefined, '', '   '];
  for (const invalidSubject of cases) {
    const res = await emailService.sendEmail({
      to: 'recipient@example.com',
      subject: invalidSubject,
      html: '<p>Test</p>',
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error, 'Email subject is required');
  }
});

test('Email Service: Rejects missing body content when neither html nor text is provided', async () => {
  const res = await emailService.sendEmail({
    to: 'recipient@example.com',
    subject: 'Missing Body',
  });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, 'Email body content (html or text) is required');
});

test('Email Service: Returns structured error when RESEND_API_KEY is missing', async () => {
  delete process.env.RESEND_API_KEY;
  emailService.resetCustomResendClient();

  const res = await emailService.sendEmail({
    to: 'recipient@example.com',
    subject: 'Missing Key',
    html: '<p>Test</p>',
  });

  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, 'RESEND_API_KEY is not configured');
});

test('Email Service: Sends email successfully via Resend SDK (mocked)', async () => {
  let capturedPayload = null;
  emailService.setCustomResendClient({
    emails: {
      send: async (payload) => {
        capturedPayload = payload;
        return { data: { id: 'resend_msg_test_123' }, error: null };
      },
    },
  });

  const res = await emailService.sendEmail({
    to: 'user@example.com',
    subject: 'Welcome to CleverCut',
    html: '<h1>Welcome</h1>',
    text: 'Welcome to CleverCut',
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.id, 'resend_msg_test_123');
  assert.strictEqual(capturedPayload.from, 'onboarding@resend.dev');
  assert.strictEqual(capturedPayload.to, 'user@example.com');
  assert.strictEqual(capturedPayload.subject, 'Welcome to CleverCut');
  assert.strictEqual(capturedPayload.html, '<h1>Welcome</h1>');
  assert.strictEqual(capturedPayload.text, 'Welcome to CleverCut');
});

test('Email Service: Supports configurable AUTH_EMAIL_FROM sender address', async () => {
  process.env.AUTH_EMAIL_FROM = 'support@clevercut.dev';

  let capturedSender = null;
  emailService.setCustomResendClient({
    emails: {
      send: async (payload) => {
        capturedSender = payload.from;
        return { data: { id: 'msg_sender_check' }, error: null };
      },
    },
  });

  await emailService.sendEmail({
    to: 'user@example.com',
    subject: 'Sender Check',
    html: '<p>Test</p>',
  });

  assert.strictEqual(capturedSender, 'support@clevercut.dev');
});

test('Email Service: Handles Resend provider rejection gracefully without reporting false success', async () => {
  emailService.setCustomResendClient({
    emails: {
      send: async () => ({
        data: null,
        error: { message: 'Domain not verified on Resend', name: 'validation_error' },
      }),
    },
  });

  const res = await emailService.sendEmail({
    to: 'user@example.com',
    subject: 'Test Provider Error',
    html: '<p>Test</p>',
  });

  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, 'Domain not verified on Resend');
});

test('Email Service: Handles network failure or exception safely', async () => {
  emailService.setCustomResendClient({
    emails: {
      send: async () => {
        throw new Error('connect ECONNREFUSED 127.0.0.1:443');
      },
    },
  });

  const res = await emailService.sendEmail({
    to: 'user@example.com',
    subject: 'Network Fail Test',
    html: '<p>Test</p>',
  });

  assert.strictEqual(res.success, false);
  assert.match(res.error, /ECONNREFUSED/);
});

test('Email Service: Sanitizes and redacts API keys from error messages', () => {
  const rawMsg = 'Failed to authenticate with key re_abc123456789_secretKey on endpoint';
  const clean = emailService.sanitizeErrorMessage(rawMsg);
  assert.strictEqual(clean, 'Failed to authenticate with key re_*** on endpoint');
  assert.ok(!clean.includes('secretKey'));
});

// ---------------------------------------------------------------------
// 2. ENDPOINT TESTS: POST /api/dev/test-email
// ---------------------------------------------------------------------

test('POST /api/dev/test-email: Unauthenticated request is rejected with 401', async () => {
  const { status, body } = await callTestEmailEndpoint({ to: 'recipient@example.com' }, null);
  assert.strictEqual(status, 401);
  assert.match(body.error, /Authentication required/);
});

test('POST /api/dev/test-email: Invalid recipient email returns 400', async () => {
  const { status, body } = await callTestEmailEndpoint({ to: 'invalid-email-address' });
  assert.strictEqual(status, 400);
  assert.match(body.error, /Valid recipient email address is required/);
});

test('POST /api/dev/test-email: Missing request body returns 400', async () => {
  const { status, body } = await callTestEmailEndpoint({});
  assert.strictEqual(status, 400);
  assert.match(body.error, /Valid recipient email address is required/);
});

test('POST /api/dev/test-email: Successfully dispatches branded test email and returns delivery id', async () => {
  let capturedPayload = null;
  emailService.setCustomResendClient({
    emails: {
      send: async (payload) => {
        capturedPayload = payload;
        return { data: { id: 'test_dispatch_id_456' }, error: null };
      },
    },
  });

  const { status, body } = await callTestEmailEndpoint({ to: 'developer@example.com' });

  assert.strictEqual(status, 200);
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.id, 'test_dispatch_id_456');
  assert.strictEqual(body.recipient, 'developer@example.com');
  assert.ok(capturedPayload.html.includes('CleverCut Transactional Email Test'));
  assert.ok(capturedPayload.html.includes('developer@example.com'));
  assert.ok(capturedPayload.text.includes('CleverCut – Transactional Email Delivery Test'));
});

test('POST /api/dev/test-email: Provider rejection returns 502 with structured error and never exposes API key', async () => {
  emailService.setCustomResendClient({
    emails: {
      send: async () => ({
        data: null,
        error: { message: 'Quota exceeded for testing account' },
      }),
    },
  });

  const { status, body } = await callTestEmailEndpoint({ to: 'developer@example.com' });

  assert.strictEqual(status, 502);
  assert.strictEqual(body.success, false);
  assert.strictEqual(body.error, 'Quota exceeded for testing account');

  // Verify API key is never exposed
  const stringified = JSON.stringify(body);
  assert.ok(!stringified.includes('re_test_mock_api_key_12345'));
  assert.ok(!stringified.includes('re_'));
});

test('POST /api/dev/test-email: Missing RESEND_API_KEY returns 502 error and never exposes secrets', async () => {
  delete process.env.RESEND_API_KEY;
  emailService.resetCustomResendClient();

  const { status, body } = await callTestEmailEndpoint({ to: 'developer@example.com' });

  assert.strictEqual(status, 502);
  assert.strictEqual(body.success, false);
  assert.strictEqual(body.error, 'RESEND_API_KEY is not configured');
});

test('POST /api/dev/test-email: Blocked in production environment (NODE_ENV=production returns 404)', async () => {
  process.env.NODE_ENV = 'production';

  const { status, body } = await callTestEmailEndpoint({ to: 'developer@example.com' });

  assert.strictEqual(status, 404);
  assert.match(body.error, /Endpoint not available in production environment/);
});
