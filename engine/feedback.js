// Feedback & Issue Reporting Engine
// Powered by FormSubmit with multipart/form-data attachment forwarding and validation.

const ALLOWED_CATEGORIES = [
  "Report a Bug",
  "AI Output Feedback",
  "Feature Request",
  "General Feedback",
];

const MAX_MESSAGE_LENGTH = 5000;
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per screenshot
const MAX_COMBINED_ATTACHMENTS_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB combined
const ALLOWED_MIME_TYPES = /^image\/(png|jpeg|jpg)$/i;

const DEFAULT_FORM_ENDPOINT = "https://formsubmit.co/viki@clevertize.com";
const FORMSUBMIT_TIMEOUT_MS = 15000; // 15 seconds

// In-memory rate limiting: 5 submissions per 60 seconds per user / IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

// Last sent submission memory store (for tests and inspection)
let lastSentFeedbackSubmission = null;

// Testing hook for custom/mocked fetch
let customFetch = null;

function getLastSentFeedbackEmail() {
  return lastSentFeedbackSubmission;
}

function getLastSentFeedbackSubmission() {
  return lastSentFeedbackSubmission;
}

function resetLastSentFeedbackEmail() {
  lastSentFeedbackSubmission = null;
}

function setCustomFetch(fn) {
  customFetch = fn;
}

function resetCustomFetch() {
  customFetch = null;
}

function checkRateLimit(key = "anonymous") {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldest = validTimestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    rateLimitMap.set(key, validTimestamps);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
  return { allowed: true, retryAfterSeconds: 0 };
}

function resetRateLimits() {
  rateLimitMap.clear();
}

/**
 * Resolve target FormSubmit endpoint
 */
function getFeedbackEndpoint() {
  if (process.env.FEEDBACK_FORM_ENDPOINT) {
    return process.env.FEEDBACK_FORM_ENDPOINT.trim();
  }
  const email = process.env.FEEDBACK_EMAIL_TO || "viki@clevertize.com";
  return `https://formsubmit.co/${email.trim()}`;
}

/**
 * Validate incoming feedback payload
 */
function validateFeedbackPayload(body = {}) {
  const category = (body.category || "").trim();
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new Error(
      `Invalid feedback category. Must be one of: ${ALLOWED_CATEGORIES.join(", ")}`
    );
  }

  const message = (body.message || "").trim();
  if (!message) {
    throw new Error("Message is required and cannot be empty.");
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message exceeds maximum limit of ${MAX_MESSAGE_LENGTH} characters.`);
  }

  const rawAttachments = Array.isArray(body.attachments) ? body.attachments : [];
  if (rawAttachments.length > MAX_ATTACHMENTS) {
    throw new Error(`Maximum of ${MAX_ATTACHMENTS} screenshot attachments allowed.`);
  }

  const validatedAttachments = [];
  let totalAttachmentBytes = 0;

  for (let i = 0; i < rawAttachments.length; i++) {
    const att = rawAttachments[i];
    if (!att || typeof att !== "object") {
      throw new Error(`Attachment #${i + 1} is invalid.`);
    }

    const name = (att.name || `screenshot_${i + 1}.png`).replace(/[^\w.-]/g, "_");
    const mime = (att.mime || "").toLowerCase();

    if (!ALLOWED_MIME_TYPES.test(mime)) {
      throw new Error(
        `Attachment "${name}" has unsupported file type (${mime || "unknown"}). Only PNG, JPG, and JPEG are supported.`
      );
    }

    let b64Data = att.data || "";
    // Strip data URL header if present (e.g. data:image/png;base64,...)
    if (b64Data.includes(";base64,")) {
      b64Data = b64Data.split(";base64,")[1];
    }

    if (!b64Data) {
      throw new Error(`Attachment "${name}" does not contain valid image data.`);
    }

    const byteLength = Buffer.byteLength(b64Data, "base64");
    if (byteLength > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error(
        `Attachment "${name}" is too large (${(byteLength / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 5 MB per screenshot.`
      );
    }

    totalAttachmentBytes += byteLength;
    if (totalAttachmentBytes > MAX_COMBINED_ATTACHMENTS_SIZE_BYTES) {
      throw new Error(
        `Total combined size of attachments (${(totalAttachmentBytes / (1024 * 1024)).toFixed(2)} MB) exceeds the 10 MB limit.`
      );
    }

    validatedAttachments.push({
      name,
      mime: mime === "image/jpg" ? "image/jpeg" : mime,
      data: b64Data,
      size: byteLength,
    });
  }

  return {
    category,
    message,
    attachments: validatedAttachments,
    context: body.context || {},
  };
}

/**
 * Format email text and structured metadata
 */
function formatFeedbackContent({ category, message, context = {}, user = {} }) {
  const userName = user.name || context.userName || "N/A";
  const userEmail = user.email || context.userEmail || "N/A";
  const brand = context.brandName || context.brand || "N/A";
  const project = context.projectName || context.project || "N/A";
  const projectId = context.projectId || "N/A";
  const appMode = context.appMode || context.applicationMode || "N/A";
  const workflowStage = context.workflowStage || context.stage || "N/A";
  const generationId = context.generationId || "N/A";
  const submissionDate = context.submissionDate || new Date().toISOString();

  const browser = context.browser || "N/A";
  const device = context.device || "N/A";
  const currentUrl = context.currentUrl || context.url || "N/A";

  const subjectProject = project !== "N/A" ? project : brand !== "N/A" ? brand : "General";
  const subject = `[CleverCut Feedback] [${category}] – ${subjectProject}`;

  const textBody = `Feedback Category: ${category}
User Name: ${userName}
User Email: ${userEmail}
Brand: ${brand}
Project: ${project}
Project ID: ${projectId}
Application Mode: ${appMode}
Workflow Stage: ${workflowStage}
Generation ID: ${generationId}
Submission Date: ${submissionDate}

User Message:

${message}

Technical Context:

Browser: ${browser}
Device: ${device}
Application URL or current page: ${currentUrl}
`;

  return {
    subject,
    textBody,
    userName,
    userEmail,
    brand,
    project,
    projectId,
    appMode,
    workflowStage,
    generationId,
    submissionDate,
    browser,
    device,
    currentUrl,
  };
}

/**
 * Construct multipart/form-data payload for FormSubmit
 */
function buildFeedbackFormData({ category, message, attachments = [], context = {}, user = {} }) {
  const meta = formatFeedbackContent({ category, message, context, user });
  const formData = new FormData();

  // FormSubmit special controls
  formData.append("_subject", meta.subject);
  if (meta.userEmail && meta.userEmail !== "N/A") {
    formData.append("_replyto", meta.userEmail);
  }
  formData.append("_captcha", "false");
  formData.append("_template", "table");

  // Structured application metadata fields
  formData.append("Feedback Category", category);
  formData.append("User Name", meta.userName);
  formData.append("User Email", meta.userEmail);
  formData.append("Brand", meta.brand);
  formData.append("Project", meta.project);
  formData.append("Project ID", meta.projectId);
  formData.append("Application Mode", meta.appMode);
  formData.append("Workflow Stage", meta.workflowStage);
  formData.append("Generation ID", meta.generationId);
  formData.append("Submission Date", meta.submissionDate);
  formData.append("User Message", message);
  formData.append("Browser", meta.browser);
  formData.append("Device", meta.device);
  formData.append("Current URL", meta.currentUrl);

  // Binary attachments
  for (let i = 0; i < attachments.length; i++) {
    const att = attachments[i];
    const buffer = Buffer.from(att.data, "base64");
    const blob = new Blob([buffer], { type: att.mime });
    const filename = att.name || `screenshot_${i + 1}.${att.mime.includes("png") ? "png" : "jpg"}`;
    formData.append("attachment", blob, filename);
  }

  return { formData, meta, subject: meta.subject, textBody: meta.textBody };
}

/**
 * Sanitize error message to prevent leaking any tokens or endpoints
 */
function sanitizeErrorMessage(errMsg = "") {
  let clean = String(errMsg || "");
  clean = clean.replace(/https?:\/\/[^\s]+/gi, (url) => {
    return url.includes("formsubmit.co") ? "https://formsubmit.co/[REDACTED]" : url;
  });
  clean = clean.replace(/authorization:\s*['"]?[^'"\s&]+['"]?/gi, "authorization:[REDACTED]");
  return clean;
}

/**
 * Forward feedback to FormSubmit via multipart/form-data
 */
async function sendFeedbackEmail({ category, message, attachments = [], context = {}, user = {} }) {
  // Allow test / simulation failure hook
  if (process.env.FEEDBACK_SIMULATE_FAILURE === "true") {
    throw new Error("Simulated feedback delivery failure.");
  }

  const endpoint = getFeedbackEndpoint();
  const { formData, meta, subject, textBody } = buildFeedbackFormData({
    category,
    message,
    attachments,
    context,
    user,
  });

  const fetchFn = customFetch || global.fetch;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FORMSUBMIT_TIMEOUT_MS);

  let response;
  try {
    response = await fetchFn(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
      signal: controller.signal,
    });
  } catch (netErr) {
    if (netErr.name === "AbortError") {
      throw new Error("FormSubmit delivery timed out after 15 seconds.");
    }
    throw new Error(`FormSubmit network failure: ${netErr.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`FormSubmit rejected submission with HTTP status ${response.status}`);
  }

  const responseText = await response.text();
  let responseData;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    // If FormSubmit responds with non-JSON text, verify it doesn't indicate failure
    if (responseText.toLowerCase().includes("error") || responseText.toLowerCase().includes("failed")) {
      throw new Error("FormSubmit submission failed to process.");
    }
    responseData = { success: true };
  }

  if (responseData.success === "false" || responseData.success === false) {
    throw new Error(responseData.message || "FormSubmit rejected submission.");
  }

  lastSentFeedbackSubmission = {
    endpoint,
    to: endpoint.split("/").pop() || "viki@clevertize.com",
    from: meta.userEmail || "viki@clevertize.com",
    subject,
    textBody,
    category,
    message,
    attachmentCount: attachments.length,
    attachments: attachments.map((a) => ({ filename: a.name, contentType: a.mime, size: a.size })),
    context,
    user: { name: user.name, email: user.email },
    timestamp: new Date().toISOString(),
    formSubmitResponse: responseData,
  };

  return {
    success: true,
    messageId: `fs_${Date.now()}`,
    endpoint,
  };
}

module.exports = {
  ALLOWED_CATEGORIES,
  MAX_MESSAGE_LENGTH,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_COMBINED_ATTACHMENTS_SIZE_BYTES,
  DEFAULT_FORM_ENDPOINT,
  getFeedbackEndpoint,
  validateFeedbackPayload,
  formatFeedbackContent,
  buildFeedbackFormData,
  setCustomFetch,
  resetCustomFetch,
  sanitizeErrorMessage,
  checkRateLimit,
  resetRateLimits,
  sendFeedbackEmail,
  sendFeedbackSubmission: sendFeedbackEmail,
  getLastSentFeedbackEmail,
  getLastSentFeedbackSubmission,
  resetLastSentFeedbackEmail,
};
