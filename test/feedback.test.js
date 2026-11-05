// Comprehensive tests for CleverCut Simple Feedback & Issue Reporting Feature
// Powered by FormSubmit integration with multipart/form-data attachments and proxy forwarding.

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

// keep test users out of data/ — that folder is the app's real local database
process.env.DATA_DIR = fs.mkdtempSync(path.join(require("os").tmpdir(), "clevercut-test-"));

const {
  validateFeedbackPayload,
  formatFeedbackContent,
  buildFeedbackFormData,
  getFeedbackEndpoint,
  setCustomFetch,
  resetCustomFetch,
  sanitizeErrorMessage,
  sendFeedbackEmail,
  checkRateLimit,
  resetRateLimits,
  getLastSentFeedbackSubmission,
  resetLastSentFeedbackEmail,
  ALLOWED_CATEGORIES,
  MAX_MESSAGE_LENGTH,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_COMBINED_ATTACHMENTS_SIZE_BYTES,
  DEFAULT_FORM_ENDPOINT,
} = require("../engine/feedback");

const { app } = require("../server");
const db = require("../engine/db");

let server, baseUrl, testToken, testUser;

// Small valid 1x1 PNG base64 for test attachments
const VALID_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const VALID_JPG_B64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

test.before(async () => {
  const uniqueEmail = `formsubmit-tester-${Date.now()}@example.com`;
  testUser = await db.createUser({
    email: uniqueEmail,
    password: "Password123!",
    name: "FormSubmit Tester",
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
  if (server) await new Promise((r) => server.close(r));
});

test.beforeEach(() => {
  resetRateLimits();
  resetLastSentFeedbackEmail();
  resetCustomFetch();
  delete process.env.FEEDBACK_SIMULATE_FAILURE;
  delete process.env.FEEDBACK_FORM_ENDPOINT;
  delete process.env.FEEDBACK_EMAIL_TO;
  process.env.NODE_ENV = "test";
});

// Helper for HTTP requests
const postFeedback = async (body, token = testToken) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}/api/feedback`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
};

// 1. Default FormSubmit endpoint resolution
test("Requirement 1 & 2: Default FormSubmit receiving endpoint is https://formsubmit.co/viki@clevertize.com", () => {
  assert.equal(getFeedbackEndpoint(), "https://formsubmit.co/viki@clevertize.com");

  process.env.FEEDBACK_EMAIL_TO = "support@clevertize.com";
  assert.equal(getFeedbackEndpoint(), "https://formsubmit.co/support@clevertize.com");

  process.env.FEEDBACK_FORM_ENDPOINT = "https://formsubmit.co/custom@example.com";
  assert.equal(getFeedbackEndpoint(), "https://formsubmit.co/custom@example.com");
});

// 2. Successful FormSubmit delivery with mocked fetch
test("Requirement 2: Successful FormSubmit delivery via backend proxy with 200 OK", async () => {
  let interceptedUrl = null;
  let interceptedHeaders = null;
  let interceptedBody = null;

  setCustomFetch(async (url, opts) => {
    interceptedUrl = url;
    interceptedHeaders = opts.headers;
    interceptedBody = opts.body;
    return new Response(JSON.stringify({ success: "true", message: "The form was submitted successfully." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  const payload = {
    category: "General Feedback",
    message: "The application is performing smoothly.",
    attachments: [],
    context: {
      brandName: "Acme Silk",
      projectName: "Diwali 20s Film",
      projectId: "proj_diwali_99",
      appMode: "Simple Studio",
      workflowStage: "Simple Studio - 3-Step Creation",
      browser: "Chrome 122",
      device: "1920x1080 Windows",
      currentUrl: "https://clevercut.tv/studio",
    },
  };

  const res = await postFeedback(payload);
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.match(res.body.message, /Thanks for helping us improve CleverCut/);

  assert.equal(interceptedUrl, "https://formsubmit.co/viki@clevertize.com");
  assert.equal(interceptedHeaders.Accept, "application/json");
  assert.ok(interceptedBody instanceof FormData);
  assert.equal(interceptedBody.get("_subject"), "[CleverCut Feedback] [General Feedback] – Diwali 20s Film");
  assert.equal(interceptedBody.get("Feedback Category"), "General Feedback");
  assert.equal(interceptedBody.get("Project ID"), "proj_diwali_99");
  assert.equal(interceptedBody.get("Application Mode"), "Simple Studio");
  assert.equal(interceptedBody.get("_captcha"), "false");
});

// 3. All four feedback categories supported
test("Requirement 4: All 4 feedback categories are supported and formatted correctly", async () => {
  const categories = ["Report a Bug", "AI Output Feedback", "Feature Request", "General Feedback"];

  for (const cat of categories) {
    let capturedSubject = null;
    setCustomFetch(async (url, opts) => {
      capturedSubject = opts.body.get("_subject");
      return new Response(JSON.stringify({ success: "true" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const res = await postFeedback({
      category: cat,
      message: `Testing category ${cat}`,
      context: { projectName: "Test Film" },
    });

    assert.equal(res.status, 200, `Category ${cat} should succeed`);
    assert.equal(capturedSubject, `[CleverCut Feedback] [${cat}] – Test Film`);
  }
});

// 4. Single screenshot attachment binary forwarding
test("Requirement 3: Single screenshot is appended as a binary attachment in multipart/form-data", async () => {
  let attachedFiles = [];

  setCustomFetch(async (url, opts) => {
    attachedFiles = opts.body.getAll("attachment");
    return new Response(JSON.stringify({ success: "true" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  const payload = {
    category: "Report a Bug",
    message: "Scene 2 failed to generate audio.",
    attachments: [
      {
        name: "bug_scene.png",
        mime: "image/png",
        data: VALID_PNG_B64,
      },
    ],
    context: {
      brandName: "Practo",
      projectName: "Doctor App 15s",
    },
  };

  const res = await postFeedback(payload);
  assert.equal(res.status, 200);
  assert.equal(attachedFiles.length, 1);
  assert.equal(attachedFiles[0].name, "bug_scene.png");
  assert.equal(attachedFiles[0].type, "image/png");
});

// 5. Multiple screenshot attachments
test("Requirement 3: Multiple screenshot attachments (up to 5) are forwarded in multipart payload", async () => {
  let attachedFiles = [];

  setCustomFetch(async (url, opts) => {
    attachedFiles = opts.body.getAll("attachment");
    return new Response(JSON.stringify({ success: "true" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  const payload = {
    category: "AI Output Feedback",
    message: "Comparing outputs across 3 scenes.",
    attachments: [
      { name: "shot1.png", mime: "image/png", data: VALID_PNG_B64 },
      { name: "shot2.jpg", mime: "image/jpeg", data: VALID_JPG_B64 },
      { name: "shot3.png", mime: "image/png", data: VALID_PNG_B64 },
    ],
  };

  const res = await postFeedback(payload);
  assert.equal(res.status, 200);
  assert.equal(attachedFiles.length, 3);
  assert.equal(attachedFiles[0].name, "shot1.png");
  assert.equal(attachedFiles[1].name, "shot2.jpg");
  assert.equal(attachedFiles[2].name, "shot3.png");
});

// 6. Combined attachment size exceeding 10 MB rejected
test("Requirement 3: Combined attachment size exceeding 10 MB is rejected with clear 400 error", async () => {
  // Create 3 attachments of 4 MB each (total = 12 MB > 10 MB)
  const chunk4MB = Buffer.alloc(4 * 1024 * 1024, "b").toString("base64");

  const payload = {
    category: "Report a Bug",
    message: "Testing oversized combined attachments.",
    attachments: [
      { name: "part1.png", mime: "image/png", data: chunk4MB },
      { name: "part2.png", mime: "image/png", data: chunk4MB },
      { name: "part3.png", mime: "image/png", data: chunk4MB },
    ],
  };

  const res = await postFeedback(payload);
  assert.equal(res.status, 400);
  assert.match(res.body.error, /exceeds the 10 MB limit/i);
});

// 7. Individual screenshot size exceeding 5 MB rejected
test("Requirement 3: Individual screenshot exceeding 5 MB is rejected", async () => {
  const hugeChunk = Buffer.alloc(5.2 * 1024 * 1024, "x").toString("base64");

  const payload = {
    category: "Report a Bug",
    message: "One huge screenshot.",
    attachments: [{ name: "huge.png", mime: "image/png", data: hugeChunk }],
  };

  const res = await postFeedback(payload);
  assert.equal(res.status, 400);
  assert.match(res.body.error, /is too large/i);
  assert.match(res.body.error, /5 MB/);
});

// 8. Unsupported attachment file type rejected
test("Requirement 3: Unsupported file types (PDF, SVG, EXE) are rejected", async () => {
  const payload = {
    category: "Report a Bug",
    message: "Attaching pdf.",
    attachments: [{ name: "doc.pdf", mime: "application/pdf", data: "ZHVtbXk=" }],
  };

  const res = await postFeedback(payload);
  assert.equal(res.status, 400);
  assert.match(res.body.error, /unsupported file type/i);
});

// 9. Missing message rejected
test("Requirement 4: Empty message is rejected with 400", async () => {
  const res = await postFeedback({ category: "General Feedback", message: "   " });
  assert.equal(res.status, 400);
  assert.match(res.body.error, /Message is required/);
});

// 10. FormSubmit rejection (e.g. 403 or 422 HTTP status)
test("Requirement 2: FormSubmit HTTP rejection returns 500 without false success", async () => {
  setCustomFetch(async () => {
    return new Response(JSON.stringify({ error: "Invalid form target" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  });

  const res = await postFeedback({ category: "Report a Bug", message: "Testing 403 response." });
  assert.equal(res.status, 500);
  assert.equal(res.body.error, "Unable to send your feedback right now. Please try again.");
});

// 11. FormSubmit HTTP 200 with success="false"
test("Requirement 2: FormSubmit HTTP 200 with success=false does NOT return false success", async () => {
  setCustomFetch(async () => {
    return new Response(JSON.stringify({ success: "false", message: "Form submission limit reached" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  const res = await postFeedback({ category: "Report a Bug", message: "Testing failure inside 200." });
  assert.equal(res.status, 500);
  assert.equal(res.body.error, "Unable to send your feedback right now. Please try again.");
});

// 12. FormSubmit network timeout
test("Requirement 6: FormSubmit network timeout is caught and handled safely", async () => {
  setCustomFetch(async () => {
    const err = new Error("The operation was aborted");
    err.name = "AbortError";
    throw err;
  });

  const res = await postFeedback({ category: "Report a Bug", message: "Testing timeout response." });
  assert.equal(res.status, 500);
  assert.equal(res.body.error, "Unable to send your feedback right now. Please try again.");
});

// 13. Rate limiting enforcement
test("Requirement 6: Rate limit blocks spam submissions after 5 requests", async () => {
  setCustomFetch(async () => new Response(JSON.stringify({ success: "true" }), { status: 200 }));

  for (let i = 0; i < 5; i++) {
    const res = await postFeedback({ category: "General Feedback", message: `Msg #${i + 1}` });
    assert.equal(res.status, 200);
  }

  const blocked = await postFeedback({ category: "General Feedback", message: "Msg #6" });
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.error, /Too many feedback submissions/);
});

// 14. Unauthenticated submission blocked
test("Requirement 6: Unauthenticated request is rejected with 401", async () => {
  const res = await postFeedback({ category: "General Feedback", message: "No token" }, null);
  assert.equal(res.status, 401);
  assert.match(res.body.error, /Authentication required/);
});

// 15. Verify render.yaml contains FormSubmit and no obsolete SMTP keys
test("Requirement 1 & 7: render.yaml contains FEEDBACK_FORM_ENDPOINT and no SMTP variables", () => {
  const renderYamlPath = path.join(__dirname, "../render.yaml");
  const yaml = fs.readFileSync(renderYamlPath, "utf8");

  assert.ok(yaml.includes("FEEDBACK_FORM_ENDPOINT"), "render.yaml specifies FEEDBACK_FORM_ENDPOINT");
  assert.ok(yaml.includes("https://formsubmit.co/viki@clevertize.com"), "render.yaml points to activated endpoint");
  assert.ok(!yaml.includes("SMTP_HOST"), "render.yaml has no SMTP_HOST");
  assert.ok(!yaml.includes("SMTP_PORT"), "render.yaml has no SMTP_PORT");
  assert.ok(!yaml.includes("SMTP_USER"), "render.yaml has no SMTP_USER");
  assert.ok(!yaml.includes("SMTP_PASS"), "render.yaml has no SMTP_PASS");
});
