// End-to-end checkpoint flow: real Express app, Anthropic + Magnific mocked at the fetch layer.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "adfilm-"));
process.env.ANTHROPIC_API_KEY = "test";
process.env.MAGNIFIC_API_KEY = "test";
process.env.FESTIVAL_LIVE = "off";

const GOOD = fs.readFileSync(path.join(__dirname, "fixtures/good-storytelling.txt"), "utf8");
const BAD = GOOD.replace('Sunita: "अरे, व्रत का साबूदाना ख़त्म!"', 'Sunita: "Arre, sabudana khatam!"');
const J = (o) => `@@JSON@@\n${JSON.stringify(o)}\n@@END@@`;
const DIRECTION = J({
  lens: "2, Everyday Moments",
  tensions: [
    { owner: "खाना बनाते वक़्त सामान ख़त्म", en: "Running out mid-cooking" },
    { owner: "ऑनलाइन सस्ता लगता है", en: "Online feels cheaper" },
    { owner: "ताज़ा माल का भरोसा", en: "Trust in fresh stock" },
  ],
  festival: { use: true, name: "Sharad Navratri", owner: "नवरात्रि वाली फ़िल्म", en: "Uses Navratri — 6 days away" },
});
const PLOT = J({ framing: "x", plots: [1, 2, 3].map((i) => ({ owner: `प्लॉट ${i}`, en: `Plot ${i}`, hook_pattern: "Everyday crisis", hook_library: "Annex C" })) });
const STORY = (format = "Storytelling") => J({
  format, format_owner: "कहानी", format_en: "Story", core_idea: "x",
  scenes: [1, 2, 3, 4].map((i) => ({ owner: `सीन ${i}`, en: `Scene ${i}` })),
  hook_owner: "अरे, साबूदाना ख़त्म!", hook_pattern: "Everyday crisis", hook_library: "Annex C", visual_world: "evening", ending: "doorway",
});

const realFetch = global.fetch;
const calls = { anthropic: [], magnificRun: [] };
let queue = [];
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
  if (u.startsWith("https://api.anthropic.com")) {
    calls.anthropic.push(JSON.parse(opts.body));
    return json({ content: [{ type: "thinking", thinking: "..." }, { type: "text", text: queue.shift() }], stop_reason: "end_turn" });
  }
  if (u.endsWith("/run")) { calls.magnificRun.push(JSON.parse(opts.body)); return json({ id: "run_1" }); }
  if (u.includes("redirect-to-localhost")) {
    return new Response(null, { status: 302, headers: { location: "http://localhost:3000/api/config" } });
  }
  if (u.includes("redirect-to-metadata")) {
    return new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest/meta-data/" } });
  }
  if (u.includes("redirect-to-private")) {
    return new Response(null, { status: 302, headers: { location: "http://192.168.1.1/admin" } });
  }
  if (u.includes("redirect-to-evil")) {
    return new Response(null, { status: 302, headers: { location: "https://evil-unapproved.com/hacked.mp4" } });
  }
  if (u.includes("redirect-to-approved")) {
    return new Response(null, { status: 302, headers: { location: "https://cdn.example.com/final-valid.mp4" } });
  }
  if (u.includes("cdn.example.com/")) {
    return new Response(Buffer.from("dummy video content"), {
      status: 200,
      headers: { "content-type": "video/mp4" },
    });
  }
  if (u.includes("/flows/runs/run_fail")) return json({ status: "FAILED", error: "Generation render timeout" });
  if (u.includes("/flows/runs/")) return json({ status: "COMPLETED", result: { video: "https://cdn.example.com/out.mp4" } });
  if (u.includes("api.magnific.com/v1/ai/flows/")) {
    return json({ inputs: [
      { id: "scenes_2", type: "list", required: true },
      { id: "character_1_2", required: true },
      { id: "character_2_2", required: true },
      { id: "setting_2", required: true },
      { id: "poduct", type: "image", required: true },
      { id: "images", type: "image", required: true },
    ] });
  }
  return realFetch(url, opts);
};

const { app, sessions, downloadTickets } = require("../server");
const db = require("../engine/db");
let base, server, testToken;
test.before(async () => {
  const u = await db.createUser({ email: "test-server@example.com", password: "password123", name: "Test Server" });
  testToken = await db.createSession(u.id);
  await new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); });
});
test.after(() => server.close());

const post = async (p, body, token = testToken) => {
  const headers = { "content-type": "application/json" };
  if (token) headers["authorization"] = `Bearer ${token}`;
  const r = await realFetch(base + p, { method: "POST", headers, body: JSON.stringify(body || {}) });
  return { status: r.status, body: await r.json() };
};
const lastUserText = () => calls.anthropic.at(-1).messages[0].content.at(-1).text;
const FORM = { businessName: "Sharma General Store", businessType: "Kirana / general store", town: "Indore", language: "Hindi", area: "Palasia", contact: "98xxxxxx10" };

test("missing required fields -> 400", async () => {
  const r = await post("/api/session", { businessName: "X" });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /Business type/);
});

let sid;
test("Checkpoint 1: direction returns 3 tensions + festival", async () => {
  queue = [DIRECTION];
  const r = await post("/api/session", FORM);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  sid = r.body.sessionId;
  assert.equal(r.body.stage, "direction");
  assert.equal(r.body.data.tensions.length, 3);
  assert.match(lastUserText(), /STAGE 1 → Checkpoint 1/);
  assert.match(calls.anthropic.at(-1).system, /Exactly 4 scenes/);
});

test("change at Checkpoint 1 revises the same stage with the owner's note", async () => {
  queue = [DIRECTION];
  const r = await post(`/api/session/${sid}/change`, { checkpoint: "direction", note: "focus on home delivery" });
  assert.equal(r.body.stage, "direction");
  assert.match(lastUserText(), /CHANGE at this checkpoint: "focus on home delivery"/);
});

test("Checkpoint 2: approving tension #2 runs plot stage with it", async () => {
  queue = [PLOT];
  const r = await post(`/api/session/${sid}/next`, { checkpoint: "direction", choice: 1 });
  assert.equal(r.body.stage, "plot");
  assert.equal(r.body.data.plots.length, 3);
  assert.match(lastUserText(), /customer tension: ऑनलाइन सस्ता लगता है/);
});

test("bad choice -> 400", async () => {
  const r = await post(`/api/session/${sid}/next`, { checkpoint: "plot", choice: 7 });
  assert.equal(r.status, 400);
});

test("Checkpoint 3: story with exactly 4 scenes; a 3-scene answer is retried", async () => {
  const bad3 = STORY().replace(/,\{"owner":"सीन 4","en":"Scene 4"\}/, "");
  queue = [bad3, STORY()];
  const r = await post(`/api/session/${sid}/next`, { checkpoint: "plot", choice: 0 });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.stage, "story");
  assert.equal(r.body.data.scenes.length, 4);
});

test("Checkpoint 4: script is repaired until it passes the gate", async () => {
  queue = [BAD, GOOD];
  const r = await post(`/api/session/${sid}/next`, { checkpoint: "story" });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.stage, "script");
  assert.equal(r.body.data.scenes.length, 4);
  assert.equal(r.body.data.meta.attempts, 2);
  assert.match(lastUserText(), /PREVIOUS OUTPUT/);
  assert.match(calls.anthropic.at(-2).messages[0].content.at(-1).text, /FESTIVE LOOK \(M13e\) — this film is set around Sharad Navratri: the SETTING must visibly include marigold garlands/);
  assert.match(calls.anthropic.at(-2).messages[0].content.at(-1).text, /SETTING LOOK \(M13-class\)/);
  assert.match(calls.anthropic.at(-2).messages[0].content.at(-1).text, /Checkpoint 3 approved — format: Storytelling/);
  assert.deepEqual(r.body.data.endFrame, { businessName: "Sharma General Store", address: "Palasia, Indore", contact: "98xxxxxx10", offer: "" });
});

test("approve saves the record once; run strips edit-only notes; download allowlist", async () => {
  assert.equal((await post(`/api/session/${sid}/approve`)).status, 200);
  await post(`/api/session/${sid}/approve`);
  const saved = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, "scripts.json"), "utf8"));
  assert.equal(saved.scripts.length, 1);
  assert.equal(saved.scripts[0].record.scenes, 4);

  const { parseOutput } = require("../engine/parse");
  const p = parseOutput(GOOD);
  const logo = { mime: "image/png", data: Buffer.from("logo").toString("base64") };
  const productPhoto = { mime: "image/jpeg", data: Buffer.from("prod").toString("base64") };
  // unauthenticated call must be rejected with 401 before any work starts
  const unauthRun = await post("/api/run", { scenes: p.scenes }, null);
  assert.equal(unauthRun.status, 401);

  // without the product photo: gracefully fallbacks to text/synthetic product without crashing
  const miss = await post("/api/run", { scenes: p.scenes, character1: p.character1, character2: p.character2, setting: p.setting, logo });
  assert.equal(miss.status, 200);
  assert.equal(miss.body.runId, "run_1");
  // with both: sent to the exact keys from the API
  const r = await post("/api/run", { scenes: p.scenes, character1: p.character1, character2: p.character2, setting: p.setting, logo, productPhoto });
  assert.equal(r.body.runId, "run_1");
  const sent = calls.magnificRun.at(-1).inputs;
  assert.deepEqual(Object.keys(sent).sort(), ["character_1_2", "character_2_2", "images", "poduct", "scenes_2", "setting_2"]);
  assert.match(sent.images, /^data:image\/png;base64,/);
  assert.match(sent.poduct, /^data:image\/jpeg;base64,/);
  assert.doesNotMatch(sent.scenes_2.join("\n"), /Music mood note|Editing Notes/);
  assert.ok(sent.scenes_2.every((x) => x.startsWith("SETTING — IDENTICAL IN EVERY SCENE")));
  // unauthenticated download must be rejected with 401
  const unauthDl = await realFetch(base + "/api/download?url=" + encodeURIComponent("https://cdn.example.com/out.mp4"));
  assert.equal(unauthDl.status, 401);

  // SSRF attempt on unapproved host rejected with 400
  const bad = await realFetch(base + "/api/download?url=" + encodeURIComponent("http://169.254.169.254/latest"), {
    headers: { authorization: `Bearer ${testToken}` },
  });
  assert.equal(bad.status, 400);

  // unauthenticated status check must be rejected with 401
  const unauthStatus = await realFetch(base + "/api/status/run_1");
  assert.equal(unauthStatus.status, 401);

  const s = await (await realFetch(base + "/api/status/run_1", { headers: { authorization: `Bearer ${testToken}` } })).json();
  assert.equal(s.videoUrl, "https://cdn.example.com/out.mp4");

  // owner can download their own video using Bearer token
  const ownerDl = await realFetch(base + "/api/download?url=" + encodeURIComponent(s.videoUrl), {
    headers: { authorization: `Bearer ${testToken}` },
  });
  assert.equal(ownerDl.status, 200);

  // long-lived tokens in query parameters are strictly rejected with 401
  const queryTokenAttempt = await realFetch(base + "/api/download?url=" + encodeURIComponent(s.videoUrl) + "&token=" + encodeURIComponent(testToken));
  assert.equal(queryTokenAttempt.status, 401);

  // owner requests short-lived single-purpose download ticket
  const ticketRes = await realFetch(base + "/api/download/ticket", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${testToken}` },
    body: JSON.stringify({ url: s.videoUrl }),
  });
  assert.equal(ticketRes.status, 200);
  const ticketData = await ticketRes.json();
  assert.ok(ticketData.ticket);

  // download succeeds using short-lived ticket
  const ticketDl = await realFetch(base + "/api/download?ticket=" + encodeURIComponent(ticketData.ticket));
  assert.equal(ticketDl.status, 200);
});

test("script that never passes -> 422 with failures; owner's plot kept", async () => {
  queue = [DIRECTION, PLOT, STORY("UGC"), GOOD, GOOD, GOOD, GOOD];
  const s2 = (await post("/api/session", FORM)).body.sessionId;
  await post(`/api/session/${s2}/next`, { checkpoint: "direction", choice: 0 });
  await post(`/api/session/${s2}/next`, { checkpoint: "plot", choice: 2 });
  const r = await post(`/api/session/${s2}/next`, { checkpoint: "story" });
  assert.equal(r.status, 422);
  assert.ok(r.body.failures.some((x) => /owner-approved format "UGC"/.test(x)));
  assert.ok(r.body.failures.some((x) => /repeats the previous script/.test(x)));
});

test("unknown session -> 404", async () => {
  const r = await post(`/api/session/nope/next`, { checkpoint: "direction", choice: 0 });
  assert.equal(r.status, 404);
});

test("plots with a differently named text field are normalised (no 'undefined')", async () => {
  const odd = J({ framing: "x", plots: [
    { plot: "Son walks in to buy a phone for his mother", hook_pattern: "Interval twist", hook_library: "TrueFan AI" },
    { text: "Daughter asks one question at the counter", hook_pattern: "Imagine", hook_library: "GoFaceless" },
    "Plain string plot",
  ] });
  queue = [DIRECTION, odd];
  const s3 = (await post("/api/session", FORM)).body.sessionId;
  const r = await post(`/api/session/${s3}/next`, { checkpoint: "direction", choice: 0 });
  assert.deepEqual(r.body.data.plots.map((p) => p.owner), ["Son walks in to buy a phone for his mother", "Daughter asks one question at the counter", "Plain string plot"]);
});

test("plots with no text at all are retried", async () => {
  const empty = J({ framing: "x", plots: [{ hook_pattern: "A", hook_library: "Annex C" }, { hook_pattern: "B", hook_library: "Annex C" }, { hook_pattern: "C", hook_library: "Annex C" }] });
  queue = [DIRECTION, empty, PLOT];
  const s4 = (await post("/api/session", FORM)).body.sessionId;
  const r = await post(`/api/session/${s4}/next`, { checkpoint: "direction", choice: 0 });
  assert.equal(r.body.data.plots[0].owner, "प्लॉट 1");
});

test("V2 Entry Point: /api/research/url validates input and returns structured extraction", async () => {
  // Unauthenticated request must return 401
  const unauth = await post("/api/research/url", { url: "https://example.com" }, null);
  assert.equal(unauth.status, 401);

  // Empty URL -> 400
  const badRes = await post("/api/research/url", { url: "" });
  assert.equal(badRes.status, 400);

  // SSRF Protection tests: blocked hosts
  const localRes = await post("/api/research/url", { url: "http://localhost:3000/api/config" });
  assert.equal(localRes.status, 400);
  assert.ok(/restricted|permitted/i.test(localRes.body.error));

  const ipRes = await post("/api/research/url", { url: "http://127.0.0.1/admin" });
  assert.equal(ipRes.status, 400);

  const metaRes = await post("/api/research/url", { url: "http://169.254.169.254/latest/meta-data/" });
  assert.equal(metaRes.status, 400);

  const privRes = await post("/api/research/url", { url: "http://192.168.1.1/router" });
  assert.equal(privRes.status, 400);

  // Valid URL -> structured result with fallback or success
  const res = await post("/api/research/url", {
    url: "https://indorekirana.example.com",
    businessName: "Indore Kirana Store",
    businessType: "Kirana, Grocery & Supermarket",
    town: "Indore",
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.brandName, "brandName must be returned");
  assert.ok(res.body.suggestedBrief, "suggestedBrief must be formulated");
  assert.ok(Array.isArray(res.body.products), "products must be an array");
});

test("V2 Entry Point: /api/research/url extracts domain brand and standard category without prior brand interference", async () => {
  const amazonRes = await post("/api/research/url", {
    url: "https://www.amazon.com",
  });
  assert.equal(amazonRes.status, 200);
  assert.equal(amazonRes.body.brandName, "Amazon", "Should extract Amazon from amazon.com");
  assert.ok(amazonRes.body.businessType, "businessType must be returned");
  assert.ok(amazonRes.body.category, "category alias must be returned");
  assert.equal(amazonRes.body.businessType, amazonRes.body.category);

  // Even if an unrelated stale brand name was passed, URL domain brand takes precedence for brandName
  const kalyanRes = await post("/api/research/url", {
    url: "https://www.kalyanjewellers.net",
  });
  assert.equal(kalyanRes.status, 200);
  assert.equal(kalyanRes.body.brandName, "Kalyan Jewellers");
  assert.equal(kalyanRes.body.businessType, "Jewellery & Accessories");
});

test("V2 Entry Point: /api/script/validate-and-import parses 4 scenes and runs quality gate", async () => {
  // Unauthenticated request must return 401
  const unauth = await post("/api/script/validate-and-import", { rawScript: "ANNEX A\nSCENE 1" }, null);
  assert.equal(unauth.status, 401);

  // Empty script -> 400
  const badRes = await post("/api/script/validate-and-import", { rawScript: "" });
  assert.equal(badRes.status, 400);

  // Valid script -> parses 4 scenes and returns gate verdict
  const validRes = await post("/api/script/validate-and-import", {
    rawScript: GOOD,
    businessName: "Palasia Kirana",
    businessType: "Kirana, Grocery & Supermarket",
    language: "Hindi",
    creativeStyle: "Storytelling",
  });
  assert.equal(validRes.status, 200);
  assert.equal(validRes.body.status, "success");
  assert.equal(validRes.body.scenes.length, 4, "Must parse exactly 4 scenes");
  assert.ok(typeof validRes.body.passedGate === "boolean", "passedGate must be a boolean");
  assert.ok(validRes.body.character1, "character1 must be extracted");
  assert.ok(validRes.body.character2, "character2 must be extracted");
  assert.ok(validRes.body.setting, "setting must be extracted");
});

test("Simple Studio / api/run: missing setting or character1 auto-resolves gracefully without preflight failure", async () => {
  // Simulates exact scenario from Practo / Simple Studio where user triggers render directly
  const res = await post("/api/run", {
    scenes: ["Scene 1: Hook", "Scene 2: Problem", "Scene 3: Climax", "Scene 4: CTA"],
    businessName: "Practo",
    businessType: "Healthcare, Clinic & Pharmacy",
    brief: "Book verified doctor appointments instantly",
  });

  assert.equal(res.status, 200, "Must succeed with HTTP 200 without pre-flight validation failure");
  assert.ok(res.body.runId, "Must return runId");

  const sent = calls.magnificRun.at(-1).inputs;
  assert.ok(sent.character_1_2, "Must send resolved character1");
  assert.ok(sent.setting_2, "Must send resolved setting");
});

test("Phase 1.1 Security: Legacy session endpoints require authentication and enforce session ownership", async () => {
  // 1. Unauthenticated requests to session endpoints are rejected with 401
  const unauthSession = await post("/api/session", FORM, null);
  assert.equal(unauthSession.status, 401);

  const unauthPipeline = await post("/api/pipeline/generate", FORM, null);
  assert.equal(unauthPipeline.status, 401);

  const unauthNext = await post("/api/session/dummy_session/next", { checkpoint: "direction", choice: 0 }, null);
  assert.equal(unauthNext.status, 401);

  const unauthChange = await post("/api/session/dummy_session/change", { checkpoint: "direction", note: "more drama" }, null);
  assert.equal(unauthChange.status, 401);

  const unauthApprove = await post("/api/session/dummy_session/approve", {}, null);
  assert.equal(unauthApprove.status, 401);

  // 2. Create User A and User B
  const userA = await db.createUser({ email: "userA@session-test.com", password: "password123", name: "User A" });
  const tokenA = await db.createSession(userA.id);

  const userB = await db.createUser({ email: "userB@session-test.com", password: "password123", name: "User B" });
  const tokenB = await db.createSession(userB.id);

  // User A creates a session
  queue = [DIRECTION];
  const createRes = await post("/api/session", FORM, tokenA);
  assert.equal(createRes.status, 200);
  const sessionAId = createRes.body.sessionId;
  assert.ok(sessionAId);

  // User B attempts to tamper with User A's session -> 403 Forbidden
  const tamperNext = await post(`/api/session/${sessionAId}/next`, { checkpoint: "direction", choice: 0 }, tokenB);
  assert.equal(tamperNext.status, 403);
  assert.match(tamperNext.body.error, /Access denied|Unauthorized/i);

  const tamperChange = await post(`/api/session/${sessionAId}/change`, { checkpoint: "direction", note: "tamper" }, tokenB);
  assert.equal(tamperChange.status, 403);
  assert.match(tamperChange.body.error, /Access denied|Unauthorized/i);

  const tamperApprove = await post(`/api/session/${sessionAId}/approve`, {}, tokenB);
  assert.equal(tamperApprove.status, 403);
  assert.match(tamperApprove.body.error, /Access denied|Unauthorized/i);

  // User A can legitimately interact with their own session
  queue = [PLOT];
  const userANext = await post(`/api/session/${sessionAId}/next`, { checkpoint: "direction", choice: 0 }, tokenA);
  assert.equal(userANext.status, 200);
  assert.equal(userANext.body.stage, "plot");

  // 3. Regression test: Session with missing userId metadata must be rejected
  const missingUserSessionId = "session_missing_user_metadata";
  sessions.set(missingUserSessionId, {
    id: missingUserSessionId,
    touched: Date.now(),
    form: FORM,
  });
  const orphanReq = await post(`/api/session/${missingUserSessionId}/next`, { checkpoint: "direction", choice: 0 }, tokenA);
  assert.equal(orphanReq.status, 403);
  assert.match(orphanReq.body.error, /Access denied|Unauthorized/i);
});

test("Phase 1.2 Security: Video downloads enforce ownership, ticket scopes, and host allowlist", async () => {
  // Create User A and User B
  const userA = await db.createUser({ email: "userA-dl@test.com", password: "password123", name: "User A DL" });
  const tokenA = await db.createSession(userA.id);

  const userB = await db.createUser({ email: "userB-dl@test.com", password: "password123", name: "User B DL" });
  const tokenB = await db.createSession(userB.id);

  // User A produces / registers a video project
  const userAVideoUrl = "https://cdn.example.com/user_a_commercial.mp4";
  await db.saveProject({
    title: "User A Ad Film",
    businessName: "User A Brand",
    videoUrl: userAVideoUrl,
    scenes: ["Scene 1", "Scene 2", "Scene 3", "Scene 4"],
  }, userA.id);

  // 1. Missing credentials: GET /api/download without auth and without ticket -> 401
  const noCredsRes = await realFetch(base + "/api/download?url=" + encodeURIComponent(userAVideoUrl));
  assert.equal(noCredsRes.status, 401);

  // 2. Invalid credentials: GET /api/download with fake ticket -> 401
  const fakeTicketRes = await realFetch(base + "/api/download?ticket=fake_invalid_ticket_xyz");
  assert.equal(fakeTicketRes.status, 401);

  // 3. Long-lived token in query parameters is strictly rejected -> 401
  const queryTokenAttempt = await realFetch(base + "/api/download?url=" + encodeURIComponent(userAVideoUrl) + "&token=" + encodeURIComponent(tokenA));
  assert.equal(queryTokenAttempt.status, 401);

  // 4. Cross-user access: User B attempts to generate download ticket for User A's video -> 403 Forbidden
  const userBTicketRes = await realFetch(base + "/api/download/ticket", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({ url: userAVideoUrl }),
  });
  assert.equal(userBTicketRes.status, 403);

  // 5. Cross-user access: User B attempts direct download of User A's video -> 403 Forbidden
  const userBTamper = await realFetch(base + "/api/download?url=" + encodeURIComponent(userAVideoUrl), {
    headers: { authorization: `Bearer ${tokenB}` },
  });
  assert.equal(userBTamper.status, 403);

  // 6. User A generates single-purpose download ticket -> 200 OK
  const userATicketRes = await realFetch(base + "/api/download/ticket", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ url: userAVideoUrl }),
  });
  assert.equal(userATicketRes.status, 200);
  const ticketData = await userATicketRes.json();
  assert.ok(ticketData.ticket);
  assert.ok(ticketData.expiresAt > Date.now());

  // 7. Valid download using the ticket -> 200 OK
  const validTicketDl = await realFetch(base + "/api/download?ticket=" + encodeURIComponent(ticketData.ticket));
  assert.equal(validTicketDl.status, 200);
  assert.ok(validTicketDl.headers.get("content-disposition")?.includes("attachment"));

  // 8. Ticket single-use verification: reusing the ticket -> 401
  const reuseTicketRes = await realFetch(base + "/api/download?ticket=" + encodeURIComponent(ticketData.ticket));
  assert.equal(reuseTicketRes.status, 401);

  // 9. Expired ticket verification
  const expiredTicketId = "dl_test_expired_ticket_123";
  downloadTickets.set(expiredTicketId, {
    userId: userA.id,
    videoUrl: userAVideoUrl,
    expiresAt: Date.now() - 5000, // expired 5 seconds ago
    used: false,
  });
  const expiredDlRes = await realFetch(base + "/api/download?ticket=" + encodeURIComponent(expiredTicketId));
  assert.equal(expiredDlRes.status, 401);

  // 10. Direct authenticated download via Bearer header -> 200 OK
  const userADirectDl = await realFetch(base + "/api/download?url=" + encodeURIComponent(userAVideoUrl), {
    headers: { authorization: `Bearer ${tokenA}` },
  });
  assert.equal(userADirectDl.status, 200);

  // 11. SSRF and unapproved hosts are rejected with 400
  const evilHosts = [
    "http://169.254.169.254/latest/meta-data/",
    "http://localhost:3000/api/config",
    "http://127.0.0.1:3000/api/projects",
    "https://evil-attacker.com/malicious.mp4",
    "https://cdn.example.com.attacker.com/fake.mp4",
  ];
  for (const evil of evilHosts) {
    const rTicket = await realFetch(base + "/api/download/ticket", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ url: evil }),
    });
    assert.equal(rTicket.status, 400, `Expected 400 on ticket request for unapproved host: ${evil}`);

    const rDl = await realFetch(base + "/api/download?url=" + encodeURIComponent(evil), {
      headers: { authorization: `Bearer ${tokenA}` },
    });
    assert.equal(rDl.status, 400, `Expected 400 on download for unapproved host: ${evil}`);
  }
});

test("Phase 1.3 Security: Video generation job ownership & status polling isolation", async () => {
  const user1 = await db.createUser({ email: "user1-run@test.com", password: "password123", name: "User 1 Run" });
  const token1 = await db.createSession(user1.id);

  const user2 = await db.createUser({ email: "user2-run@test.com", password: "password123", name: "User 2 Run" });
  const token2 = await db.createSession(user2.id);

  // 1. User 1 dispatches video generation job
  const runPayload = {
    scenes: ["Scene 1: Hook", "Scene 2: Problem", "Scene 3: Climax", "Scene 4: CTA"],
    businessName: "User 1 Brand",
    businessType: "Retail",
  };
  const runRes = await post("/api/run", runPayload, token1);
  assert.equal(runRes.status, 200);
  const runId = runRes.body.runId;
  assert.ok(runId);

  // Verify runId is persisted in database and associated with User 1
  const runRecord = await db.getVideoRun(runId);
  assert.ok(runRecord);
  assert.equal(runRecord.userId, user1.id);
  assert.equal(await db.userOwnsVideoRun(user1.id, runId), true);
  assert.equal(await db.userOwnsVideoRun(user2.id, runId), false);

  // 2. User 2 attempts to poll status of User 1's run -> 403 Forbidden
  const tamperPoll = await realFetch(base + `/api/status/${runId}`, {
    headers: { authorization: `Bearer ${token2}` },
  });
  assert.equal(tamperPoll.status, 403);
  const tamperData = await tamperPoll.json();
  assert.match(tamperData.error, /Access denied/i);

  // 3. User 2 polling an unknown run -> 404 Not Found
  const unknownPoll = await realFetch(base + `/api/status/unknown_run_999`, {
    headers: { authorization: `Bearer ${token2}` },
  });
  assert.equal(unknownPoll.status, 404);

  // 4. User 1 legitimately polls their own run -> 200 OK
  const ownerPoll = await realFetch(base + `/api/status/${runId}`, {
    headers: { authorization: `Bearer ${token1}` },
  });
  assert.equal(ownerPoll.status, 200);
  const ownerData = await ownerPoll.json();
  assert.equal(ownerData.videoUrl, "https://cdn.example.com/out.mp4");

  // 5. Video ownership is assigned to User 1 (run creator), NOT User 2
  assert.equal(await db.userOwnsVideoUrl(user1.id, ownerData.videoUrl), true);
  assert.equal(await db.userOwnsVideoUrl(user2.id, ownerData.videoUrl), false);

  // 6. Upstream failure handling: when Magnific run fails, status is returned cleanly without assigning video ownership
  await db.saveVideoRun("run_fail", user1.id, { status: "PENDING" });
  const failPoll = await realFetch(base + `/api/status/run_fail`, {
    headers: { authorization: `Bearer ${token1}` },
  });
  assert.equal(failPoll.status, 200);
  const failData = await failPoll.json();
  assert.equal(failData.status, "FAILED");
  assert.equal(Boolean(failData.videoUrl), false);
});

test("Phase 1.3 Security: Redirect-safe video downloads prevent SSRF redirect bypass", async () => {
  const user = await db.createUser({ email: "redirect-tester@test.com", password: "password123", name: "Redirect Tester" });
  const token = await db.createSession(user.id);

  // Register video URLs for user in database
  const redirectUrls = [
    { key: "localhost", url: "https://cdn.example.com/redirect-to-localhost" },
    { key: "metadata", url: "https://cdn.example.com/redirect-to-metadata" },
    { key: "private", url: "https://cdn.example.com/redirect-to-private" },
    { key: "evil", url: "https://cdn.example.com/redirect-to-evil" },
    { key: "approved", url: "https://cdn.example.com/redirect-to-approved" },
  ];

  for (const item of redirectUrls) {
    await db.saveProject({
      title: `Redirect Film ${item.key}`,
      businessName: "Safe Streamer",
      videoUrl: item.url,
      scenes: ["S1", "S2", "S3", "S4"],
    }, user.id);
  }

  // 1. Redirect to localhost must be rejected with 400
  const localRes = await realFetch(base + "/api/download?url=" + encodeURIComponent("https://cdn.example.com/redirect-to-localhost"), {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(localRes.status, 400);
  const localData = await localRes.json();
  assert.match(localData.error, /Redirect destination host not permitted/i);

  // 2. Redirect to cloud metadata IP (169.254.169.254) must be rejected with 400
  const metaRes = await realFetch(base + "/api/download?url=" + encodeURIComponent("https://cdn.example.com/redirect-to-metadata"), {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(metaRes.status, 400);
  const metaData = await metaRes.json();
  assert.match(metaData.error, /Redirect destination host not permitted/i);

  // 3. Redirect to private RFC1918 address (192.168.1.1) must be rejected with 400
  const privRes = await realFetch(base + "/api/download?url=" + encodeURIComponent("https://cdn.example.com/redirect-to-private"), {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(privRes.status, 400);
  const privData = await privRes.json();
  assert.match(privData.error, /Redirect destination host not permitted/i);

  // 4. Redirect to unapproved host (evil-unapproved.com) must be rejected with 400
  const evilRes = await realFetch(base + "/api/download?url=" + encodeURIComponent("https://cdn.example.com/redirect-to-evil"), {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(evilRes.status, 400);
  const evilData = await evilRes.json();
  assert.match(evilData.error, /Redirect destination host not permitted/i);

  // 5. Redirect to an approved host destination succeeds with 200 OK
  const approvedRes = await realFetch(base + "/api/download?url=" + encodeURIComponent("https://cdn.example.com/redirect-to-approved"), {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(approvedRes.status, 200);
  assert.ok(approvedRes.headers.get("content-disposition")?.includes("attachment"));
});



