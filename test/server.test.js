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

const { app } = require("../server");
let base, server;
test.before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
test.after(() => server.close());

const post = async (p, body) => {
  const r = await realFetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) });
  return { status: r.status, body: await r.json() };
};
const lastUserText = () => calls.anthropic.at(-1).messages[0].content.at(-1).text;
const FORM = { businessName: "Sharma General Store", businessType: "Kirana / general store", town: "Indore", language: "Hindi", area: "Palasia", contact: "98xxxxxx10" };

test("missing required fields -> 400", async () => {
  const r = await post("/api/session", { businessName: "X" });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /Business type, Town/);
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
  // without the product photo: clear error that says what was received
  const miss = await post("/api/run", { scenes: p.scenes, character1: p.character1, character2: p.character2, setting: p.setting, logo });
  assert.equal(miss.status, 500);
  assert.match(miss.body.error, /required, but nothing was provided for them: poduct\. What the dashboard received from the form: product photo NO, logo yes/);
  // with both: sent to the exact keys from the API
  const r = await post("/api/run", { scenes: p.scenes, character1: p.character1, character2: p.character2, setting: p.setting, logo, productPhoto });
  assert.equal(r.body.runId, "run_1");
  const sent = calls.magnificRun[0].inputs;
  assert.deepEqual(Object.keys(sent).sort(), ["character_1_2", "character_2_2", "images", "poduct", "scenes_2", "setting_2"]);
  assert.match(sent.images, /^data:image\/png;base64,/);
  assert.match(sent.poduct, /^data:image\/jpeg;base64,/);
  assert.doesNotMatch(sent.scenes_2.join("\n"), /Music mood note|Editing Notes/);
  assert.ok(sent.scenes_2.every((x) => x.startsWith("SETTING — IDENTICAL IN EVERY SCENE")));
  const bad = await realFetch(base + "/api/download?url=" + encodeURIComponent("http://169.254.169.254/latest"));
  assert.equal(bad.status, 400);
  const s = await (await realFetch(base + "/api/status/run_1")).json();
  assert.equal(s.videoUrl, "https://cdn.example.com/out.mp4");
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
