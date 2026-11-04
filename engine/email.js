// Outbound Transactional Email Service
// Powered by official Resend Node.js SDK
// Strict security: Never exposes credentials, sanitizes errors, and enforces request timeouts.

const { Resend } = require('resend');

const DEFAULT_SENDER = 'onboarding@resend.dev';
const EMAIL_TIMEOUT_MS = 15000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Testing hook for injecting mock Resend client
let customResendClient = null;

function setCustomResendClient(client) {
  customResendClient = client;
}

function resetCustomResendClient() {
  customResendClient = null;
}

function getSenderAddress() {
  const from = process.env.AUTH_EMAIL_FROM ? process.env.AUTH_EMAIL_FROM.trim() : '';
  return from || DEFAULT_SENDER;
}

function getResendClient() {
  if (customResendClient) {
    return customResendClient;
  }
  const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : null;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function sanitizeErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') return 'Email delivery error';
  // Redact Resend API keys or other potential token-like secrets
  return msg.replace(/re_[a-zA-Z0-9_]+/g, 're_***');
}

function withTimeout(promise, ms = EMAIL_TIMEOUT_MS) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Email delivery timed out after ${Math.round(ms / 1000)} seconds.`);
      err.code = 'ETIMEDOUT';
      reject(err);
    }, ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise,
  ]);
}

/**
 * Send an outbound transactional email using Resend
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text body
 * @returns {Promise<{ success: boolean, id?: string, error?: string }>}
 */
async function sendEmail({ to, subject, html, text }) {
  // Validate recipient format
  if (!to || !isValidEmail(to)) {
    return { success: false, error: 'Invalid recipient email address' };
  }

  // Validate subject
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return { success: false, error: 'Email subject is required' };
  }

  // Validate body content
  const hasHtml = Boolean(html && typeof html === 'string' && html.trim());
  const hasText = Boolean(text && typeof text === 'string' && text.trim());
  if (!hasHtml && !hasText) {
    return { success: false, error: 'Email body content (html or text) is required' };
  }

  const client = getResendClient();
  if (!client) {
    return { success: false, error: 'RESEND_API_KEY is not configured' };
  }

  const from = getSenderAddress();
  const recipient = to.trim();

  try {
    const payload = {
      from,
      to: recipient,
      subject: subject.trim(),
    };
    if (hasHtml) payload.html = html.trim();
    if (hasText) payload.text = text.trim();

    const response = await withTimeout(client.emails.send(payload), EMAIL_TIMEOUT_MS);

    // Resend SDK convention: { data, error }
    if (response && response.error) {
      const providerError = sanitizeErrorMessage(
        response.error.message || response.error.name || 'Resend rejected the request'
      );
      return { success: false, error: providerError };
    }

    if (response && response.data && response.data.id) {
      return { success: true, id: response.data.id };
    }

    return { success: false, error: 'Resend did not return a valid delivery ID' };
  } catch (err) {
    const safeError = sanitizeErrorMessage(err.message || 'Email delivery failed');
    return { success: false, error: safeError };
  }
}

/**
 * Renders a CleverCut-branded HTML email for dev test delivery
 */
function renderTestEmailHtml(recipient) {
  const safeRecipient = String(recipient || '').replace(/[&<>"']/g, '');
  const timestamp = new Date().toUTCString();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CleverCut Transactional Email Test</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #f3f4f6;
      margin: 0;
      padding: 32px 16px;
    }
    .wrapper {
      max-width: 540px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid #1f293d;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px 0;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #9ca3af;
      margin: 0 0 16px 0;
    }
    .meta-box {
      background: #0b0f19;
      border: 1px solid #1f2937;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 4px 0;
      border-bottom: 1px solid #172033;
    }
    .meta-row:last-child {
      border-bottom: none;
    }
    .meta-label {
      color: #6b7280;
      font-weight: 500;
    }
    .meta-value {
      color: #e5e7eb;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .footer {
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      margin-top: 28px;
      border-top: 1px solid #1f2937;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="badge">CleverCut System</div>
    <h1>Transactional Email Delivery Active</h1>
    <p>This is a test notification confirming that outbound transactional email delivery via <strong>Resend</strong> is configured and functional.</p>
    
    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">Recipient:</span>
        <span class="meta-value">${safeRecipient}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Provider:</span>
        <span class="meta-value">Resend Node.js SDK</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Status:</span>
        <span class="meta-value" style="color: #34d399;">Connected</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Timestamp:</span>
        <span class="meta-value">${timestamp}</span>
      </div>
    </div>

    <p style="font-size: 13px; color: #6b7280;">
      You received this because a verified CleverCut administrator triggered a test delivery from the application environment.
    </p>

    <div class="footer">
      &copy; ${new Date().getFullYear()} CleverCut Video Intelligence Platform. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getAppBaseUrl(req) {
  if (process.env.APP_BASE_URL && process.env.APP_BASE_URL.trim()) {
    return process.env.APP_BASE_URL.trim().replace(/\/+$/, '');
  }
  if (req) {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    return `${proto}://${host}`;
  }
  return 'http://localhost:3000';
}

/**
 * Plain-text fallback for test email
 */
function renderTestEmailText(recipient) {
  return [
    'CleverCut – Transactional Email Delivery Test',
    '============================================',
    '',
    'This is a test notification confirming that outbound transactional email delivery via Resend is configured and functional.',
    '',
    `Recipient: ${recipient}`,
    'Provider: Resend Node.js SDK',
    'Status: Connected & Verified',
    `Timestamp: ${new Date().toUTCString()}`,
    '',
    'You received this because a verified CleverCut administrator triggered a test delivery from the application environment.',
    '',
    `© ${new Date().getFullYear()} CleverCut Video Intelligence Platform. All rights reserved.`,
  ].join('\n');
}

/**
 * Renders professional CleverCut-branded HTML email for email verification
 */
function renderVerificationEmailHtml({ name, verifyUrl, expiresInMinutes = 30 }) {
  const safeName = escapeHtml(name || 'there');
  const safeUrl = escapeHtml(verifyUrl || '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your CleverCut email address</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: #f3f4f6;
      margin: 0;
      padding: 32px 16px;
    }
    .wrapper {
      max-width: 540px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid #1f293d;
      border-radius: 12px;
      padding: 36px 32px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .brand-title {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.02em;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 14px 0;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #9ca3af;
      margin: 0 0 16px 0;
    }
    .btn-container {
      margin: 28px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background: #4f46e5;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      padding: 13px 32px;
      border-radius: 8px;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
    }
    .notice-box {
      background: #0b0f19;
      border: 1px solid #1f2937;
      border-radius: 8px;
      padding: 14px 16px;
      margin: 24px 0;
      font-size: 13px;
      color: #cbd5e1;
    }
    .link-fallback {
      font-size: 12px;
      color: #6b7280;
      word-break: break-all;
      margin-top: 20px;
      line-height: 1.5;
    }
    .link-fallback a {
      color: #818cf8;
      text-decoration: underline;
    }
    .footer {
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      margin-top: 32px;
      border-top: 1px solid #1f2937;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="brand-title">🎬 CleverCut</div>
    <div class="badge">Account Verification</div>
    <h1>Verify your email address</h1>
    <p>Hi ${safeName},</p>
    <p>Thank you for joining CleverCut! To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
    
    <div class="btn-container">
      <a href="${safeUrl}" class="btn" target="_blank" rel="noopener noreferrer">Verify Email</a>
    </div>

    <div class="notice-box">
      ⏱️ <strong>This link expires in ${expiresInMinutes} minutes.</strong> Verification is required to activate and protect your account.
    </div>

    <p style="font-size: 13px; color: #9ca3af;">
      If you did not create a CleverCut account, no further action is needed — you can safely ignore this email.
    </p>

    <div class="link-fallback">
      Button not working? Copy and paste this link into your browser:<br>
      <a href="${safeUrl}">${safeUrl}</a>
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} CleverCut Video Intelligence Platform. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Renders plain-text fallback for email verification
 */
function renderVerificationEmailText({ name, verifyUrl, expiresInMinutes = 30 }) {
  return [
    'CleverCut – Verify your email address',
    '=====================================',
    '',
    `Hi ${name || 'there'},`,
    '',
    'Thank you for joining CleverCut! To complete your registration and activate your account, please verify your email address using the link below:',
    '',
    verifyUrl,
    '',
    `This verification link expires in ${expiresInMinutes} minutes. Verification is required to activate and protect your account.`,
    '',
    'If you did not create a CleverCut account, you can safely ignore this email.',
    '',
    `© ${new Date().getFullYear()} CleverCut Video Intelligence Platform. All rights reserved.`,
  ].join('\n');
}

/**
 * Sends a branded email verification message via Resend
 */
async function sendVerificationEmail({ to, name, verifyUrl }) {
  const html = renderVerificationEmailHtml({ name, verifyUrl, expiresInMinutes: 30 });
  const text = renderVerificationEmailText({ name, verifyUrl, expiresInMinutes: 30 });
  return sendEmail({
    to,
    subject: 'Verify your CleverCut email address',
    html,
    text,
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  getAppBaseUrl,
  isValidEmail,
  getSenderAddress,
  sanitizeErrorMessage,
  renderTestEmailHtml,
  renderTestEmailText,
  renderVerificationEmailHtml,
  renderVerificationEmailText,
  escapeHtml,
  setCustomResendClient,
  resetCustomResendClient,
  DEFAULT_SENDER,
  EMAIL_TIMEOUT_MS,
};
