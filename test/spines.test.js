// The three stage spines (Brief → Creative → Script & Storyboard): versioned prompt files, output contracts,
// handoff enforcement, the three Creative Style options end to end, the Annex B gate, production compatibility,
// the storyboard seam and the old-value mapping.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "clevercut-test-"));
process.env.ANTHROPIC_API_KEY = "test";
process.env.FESTIVAL_LIVE = "off";
// spine files are read from a temp copy so the "edit without a code change" test can change one
const SPINES_COPY = fs.mkdtempSync(path.join(os.tmpdir(), "clevercut-spines-"));
for (const n of ["brief", "creative", "script"]) fs.copyFileSync(path.join(__dirname, `../engine/spines/${n}.md`), path.join(SPINES_COPY, `${n}.md`));
process.env.SPINES_DIR = SPINES_COPY;

const answers = require("./helpers/spineAnswers");
const requests = [];
const realFetch = global.fetch;
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (u.startsWith("https://api.anthropic.com")) {
    const body = JSON.parse(opts.body);
    requests.push(body);
    return new Response(JSON.stringify({ content: [{ type: "text", text: answers.answer({ system: body.system }) }], stop_reason: "end_turn" }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (u.includes("api.magnific.com")) throw new Error("Magnific must not be called in these tests");
  return realFetch(url, opts);
};

const { loadSpine } = require("../engine/spines");
const C = require("../engine/spines/contracts");
const briefSpine = require("../engine/spines/briefSpine");
const creativeSpine = require("../engine/spines/creativeSpine");
const scriptSpine = require("../engine/spines/scriptSpine");
const storyboard = require("../engine/spines/storyboard");
const { runScriptGate } = require("../engine/gate");
const { extractSceneParts } = require("../engine/compiler");
const { sceneForGeneration, dialogueOf } = require("../engine/parse");
const clientStyle = require("../src/utils/creativeStyle.js");

const call = async (req) => { requests.push(req); return answers.answer(req); };
const FORM = { businessName: "Sharma General Store", businessType: "Kirana, Grocery & Supermarket", town: "Indore", area: "Palasia", language: "Hindi", aspectRatio: "9:16", duration: "20s", platform: "Instagram Reels / 9:16", brief: "RAW-USER-BRIEF-TEXT 30 minute delivery on WhatsApp", contact: "98xxxxxx10" };
async function chain(style, form = {}) {
  const inputs = briefSpine.buildBriefInputs({ form: { ...FORM, creativeStyle: style, ...form } });
  const { brief } = await briefSpine.runBriefSpine(inputs, { call, today: "2026-11-16" });
  const ins = await creativeSpine.runInsight({ brief }, { call });
  const an = await creativeSpine.runAngles({ brief, insight: ins.tensions[0].insight }, { call });
  const co = await creativeSpine.runConcept({ brief, insight: ins.tensions[0].insight, angle: an.angles[0], angles: an.angles }, { call });
  const out = await scriptSpine.writeScript({ concept: co.concept, brief: C.briefForScript(brief) }, { call });
  return { brief, ins, an, co, out };
}
const shape = (o) => (Array.isArray(o) ? (o.length && typeof o[0] === "object" ? [shape(o[0])] : []) : o && typeof o === "object" ? Object.fromEntries(Object.keys(o).map((k) => [k, shape(o[k])])) : typeof o);

test("each spine is its own versioned prompt file holding the document, and edits apply without a code change", () => {
  for (const [name, title, owns] of [["brief", "CleverCut — Brief Spine", "/api/creative/ai-understanding"], ["creative", "CleverCut — Creative Spine", "/api/creative/directions"], ["script", "CleverCut — Script & Storyboard (4-Grid) Spine", "/api/creative/synthesize-script"]]) {
    const sp = loadSpine(name);
    assert.equal(sp.version, "1.0.0");
    assert.equal(sp.title, title);
    assert.ok(sp.owns.includes(owns), `${name} owns ${owns}`);
    assert.ok(sp.text.includes("## Section 0 – Master instructions"), `${name} holds the document`);
  }
  assert.ok(loadSpine("script").text.includes("S-M7 – Dialogue. Crisp and short: each character speaks at most one line per scene, about 8 words"));
  const file = path.join(SPINES_COPY, "creative.md");
  const original = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, original.replace("version: 1.0.0", "version: 1.0.1").replace("C-M1 – Role.", "C-M1 – Role (edited)."));
  const later = new Date(Date.now() + 5000);
  fs.utimesSync(file, later, later);
  assert.equal(loadSpine("creative").version, "1.0.1");
  assert.ok(loadSpine("creative").text.includes("C-M1 – Role (edited)."));
  fs.writeFileSync(file, original);
  fs.utimesSync(file, new Date(Date.now() + 10000), new Date(Date.now() + 10000));
});

test("the three output contracts are exactly the documents' shapes; unknown keys are dropped", () => {
  const brief = C.normalizeBrief({ ...answers.brief, extra_field: 1, company: { brand: "X", secret: "y" } });
  assert.deepEqual(Object.keys(brief), ["date", "company", "business_problem", "objective", "kpis", "four_c", "smp", "rtbs", "platforms", "platform_constraints", "formats", "language", "mandatories", "dos_donts", "occasion", "user_idea", "polished_brief", "compliance_flags", "field_status"]);
  assert.equal(brief.company.secret, undefined);
  assert.deepEqual(Object.keys(brief.four_c), ["client", "competitors", "consumer", "category", "gap"]);
  const concept = C.normalizeConcept({ ...answers.concept, junk: true });
  assert.deepEqual(Object.keys(concept), ["brief_id", "insight", "angles", "chosen_angle_id", "ab_angle_id", "idea_source", "dos_donts_check", "occasion_use", "concept", "compliance_flags"]);
  assert.deepEqual(Object.keys(concept.concept), ["core_idea", "format", "beats", "hook", "ending_payoff", "mood", "visual_world"]);
  assert.deepEqual(Object.keys(C.SCENE_TEMPLATE), ["n", "beat", "start_s", "duration_s", "visual", "shot", "camera", "dialogue", "vo", "super", "callout", "cta", "disclaimer", "ui_mockup", "logo", "ambience", "sfx", "music_mood", "transition_out", "edit_notes"]);
  assert.deepEqual(Object.keys(C.normalizeStoryboard({})), ["frames", "locks"]);
  assert.deepEqual(Object.keys(C.normalizeScriptRecord({}).performance), ["vtr", "ctr", "cpa", "roas", "saves", "shares"]);
});

test("handoffs: Creative reads brief.json only; Script reads concept.json + the brief fields its rules name", async () => {
  await assert.rejects(() => creativeSpine.runInsight({ brief: answers.brief, rawBrief: "x" }, { call }), (e) => e.code === "HANDOFF_VIOLATION");
  await assert.rejects(() => scriptSpine.writeScript({ concept: answers.concept, brief: answers.brief, form: {} }, { call }), (e) => e.code === "HANDOFF_VIOLATION");
  const scriptBrief = C.briefForScript(answers.brief);
  assert.deepEqual(Object.keys(scriptBrief).sort(), [...C.SCRIPT_BRIEF_FIELDS].sort());
  for (const k of ["four_c", "smp", "polished_brief", "user_idea", "business_problem"]) assert.equal(scriptBrief[k], undefined, `${k} is not handed to the Script spine`);
  assert.deepEqual(Object.keys(scriptBrief.company), ["brand", "category", "product", "offer"]);

  requests.length = 0;
  const { brief } = await briefSpine.runBriefSpine(briefSpine.buildBriefInputs({ form: { ...FORM, creativeStyle: "Storytelling" } }), { call });
  assert.ok(requests.at(-1).content.includes("RAW-USER-BRIEF-TEXT"), "the Brief Spine reads the user's own text");
  requests.length = 0;
  await creativeSpine.runInsight({ brief: { ...brief, user_idea: "" } }, { call });
  const content = requests.at(-1).content;
  assert.ok(content.startsWith("BRIEF: {"), "the Creative Spine is handed brief.json only");
  assert.ok(!/BUSINESS_NAME|FIELDS \(Section 1\)|USER'S BRIEF TEXT/.test(content), "never the dashboard form");
});

test("brief.json: user facts win, the Creative Style is a binding Do, and Do's and Don'ts pass through unchanged", async () => {
  const inputs = briefSpine.buildBriefInputs({ form: { ...FORM, creativeStyle: "Product-focused", offer: "Free delivery" }, creativeGuardrails: { dos: [{ text: "Say the shop name twice", priority: "critical" }], donts: [{ text: "No competitor names", priority: "preference" }] } });
  const { brief } = await briefSpine.runBriefSpine(inputs, { call });
  assert.equal(brief.company.brand, "Sharma General Store");
  assert.equal(brief.company.city, "Palasia, Indore");
  assert.deepEqual(brief.language, { name: "Hindi", script: "Devanagari" });
  assert.deepEqual(brief.formats, { aspect_ratios: ["9:16"], lengths_s: [20] });
  assert.equal(brief.mandatories.offer, "Free delivery");
  assert.equal(C.filmFormatFromBrief(brief), "VO-led", "Product-focused maps to VO-led");
  assert.equal(brief.dos_donts.filter((d) => C.FILM_FORMAT_RULE_RE.test(d.rule)).length, 1, "the model can't add a second film-format rule");
  assert.ok(brief.dos_donts.some((d) => d.rule === "Say the shop name twice" && d.strength === "must" && d.type === "Must include"));
  assert.ok(brief.dos_donts.some((d) => d.rule === "No competitor names" && d.strength === "prefer" && d.type === "Must not include"));
  assert.equal(C.filmFormatFromBrief(briefSpine.withFilmFormat(brief, "Storytelling")), "Storytelling", "changing Creative Style swaps the rule");
});

for (const [style, format] of [["UGC / Creator-style", "UGC"], ["VO-led", "VO-led"], ["Storytelling", "Storytelling"]]) {
  test(`Creative Style "${style}" drives every spine and changes what gets written`, async () => {
    requests.length = 0;
    const { brief, an, co, out } = await chain(style, { language: format === "VO-led" ? "English" : "Hindi" });
    assert.equal(C.filmFormatFromBrief(brief), format);
    const prompts = requests.map((r) => r.system);
    assert.ok(prompts.some((p) => p.includes("— Checkpoint 3 – Angles") && p.includes(`FILM FORMAT (fixed by the user's Creative Style; brief.json "Film format" rule): ${format}.`)), "angles use the format");
    assert.ok(prompts.some((p) => p.includes("— Checkpoint 4 – Story & format") && p.includes(C.FORMAT_RULES[format].generation)), "concept uses the format's Section 6 rules");
    assert.ok(prompts.some((p) => p.includes("— write the script") && p.includes(`FILM FORMAT: ${format}`) && p.includes(C.FORMAT_RULES[format].dialogue)), "script uses the format's S-M7 rules");
    assert.ok(an.angles.every((a) => a.format === format));
    assert.equal(co.concept.concept.format, format);
    assert.equal(out.script.format, format);
    assert.equal(out.header.film_format, format);
    assert.equal(out.scenes.length, 4);
    assert.ok(out.gate.passed);
    if (format === "VO-led") {
      assert.ok(out.script.scenes.every((s) => !s.dialogue.length && s.vo), "VO only, no on-screen dialogue");
      assert.ok(out.notices.some((n) => n.code === "VO_NOT_VOICED"));
      assert.match(out.scenes[0], /\nVO: "/);
    }
    if (format === "UGC") assert.ok(out.script.scenes.some((s) => !s.dialogue.length), "one beat is B-roll");
    if (format === "Storytelling") {
      assert.ok(new Set(out.script.scenes.flatMap((s) => s.dialogue.map((d) => d.speaker))).size >= 2, "speakers rotate");
      assert.ok(out.notices.some((n) => n.code === "EXTRA_CHARACTERS"), "3 characters flagged, not dropped");
      assert.ok(out.character2.includes("Ravi") && out.character2.includes("Dadi"), "characters 2+ share the second render slot");
    }
  });
}

test("Annex B gate enforces S-M7 per format", () => {
  const base = JSON.parse(answers.scriptFor({ format: "Storytelling", script: "Latin" }).replace(/^@@JSON@@\n|\n@@END@@$/g, ""));
  const header = { brand: "a", objective: "a", platform_format: "a", film_format: "a", angle: "a", lens: "a", hook: "a", ending: "a", mood: "a", moment: "a", language: "a" };
  const brief = C.briefForScript({ ...answers.brief, language: { name: "English", script: "Latin" }, rtbs: [{ claim: "30-minute delivery", proof: "x" }] });
  const make = (format, mutate) => {
    const s = C.normalizeScript({ ...base, format, length_s: 20, language: { name: "English", script: "Latin" } });
    s.scenes = s.scenes.map((x, i) => ({ ...x, n: i + 1, beat: ["Hook", "Real moment", "Turn", "Payoff"][i] }));
    mutate(s);
    return runScriptGate(s, { header, brief });
  };
  assert.ok(make("Storytelling", () => {}).passed);
  assert.ok(make("Storytelling", (s) => { s.scenes[0].dialogue.push({ speaker: "Asha", line: "And again." }); }).failures.some((f) => /max 1 line per character per scene/.test(f)));
  assert.ok(make("Storytelling", (s) => { s.scenes[0].dialogue[0].line = "This line is far too long for a three second line ok"; }).failures.some((f) => /keep it to about 8/.test(f)));
  assert.ok(make("Storytelling", (s) => { s.scenes.forEach((x) => { x.dialogue = [{ speaker: "Asha", line: "Hi there." }]; }); }).failures.some((f) => /rotate speakers/.test(f)));
  assert.ok(make("UGC", (s) => { s.scenes.forEach((x) => { x.dialogue = [{ speaker: "Asha", line: "Hi there." }]; }); }).failures.some((f) => /at most 3/.test(f)));
  assert.ok(make("VO-led", () => {}).failures.some((f) => /people act but don't speak/.test(f)));
  assert.ok(make("Storytelling", (s) => { s.scenes.pop(); }).failures.some((f) => /a 20s film has 4/.test(f)));
  assert.ok(make("Storytelling", (s) => { s.scenes[1].transition_out = "cut"; }).failures.some((f) => /flat hard cut/.test(f)));
  assert.ok(make("Storytelling", (s) => { s.scenes[1].super = "one two three four five six seven"; }).failures.some((f) => /longer than 6 words/.test(f)));
  assert.ok(make("Storytelling", (s) => { s.scenes[1].visual = "Asha feels happy and relieved at the counter with the bottle in hand"; }).failures.some((f) => /emotion as direction/.test(f)));
  const g = make("Storytelling", () => {});
  assert.equal(g.checks.find((c) => c.id === "storyboard").status, "not_run");
  assert.equal(g.checks.find((c) => c.id === "ending_payoff").status, "self-check");
});

test("Section 3 scenes still feed the unchanged render path (visual, camera, dialogue; supers never generated)", () => {
  const sc = { n: 2, beat: "Real moment", start_s: 5, duration_s: 5, visual: "Asha tilts an empty oil bottle over the pan.", shot: "medium", camera: "slow push-in", dialogue: [{ speaker: "Asha", line: "तेल खत्म!" }], vo: "", super: "OIL RAN OUT", callout: "30-minute delivery", cta: "none", disclaimer: "none", ui_mockup: "none", logo: "none", ambience: "hum", sfx: "clink", music_mood: "Playful", transition_out: "match cut – the bottle", edit_notes: "Hold." };
  const text = scriptSpine.renderScene(sc);
  assert.match(text, /^SCENE 2 – REAL MOMENT – 0:05–0:10/);
  assert.deepEqual(extractSceneParts(text), { visual: "Asha tilts an empty oil bottle over the pan.", camera: "slow push-in", dialogue: 'Asha: "तेल खत्म!"' });
  assert.deepEqual(dialogueOf(text).lines, [{ speaker: "Asha", text: "तेल खत्म!" }]);
  const gen = sceneForGeneration(text, {});
  assert.ok(!gen.includes("OIL RAN OUT") && !gen.includes("30-minute delivery") && !gen.includes("Transition out"), "on-screen elements are rendered by Production, never sent to the video model");
});

test("storyboard seam: frames planned per scene with refs; drawn only when an image provider is registered", async () => {
  const { out } = await chain("Storytelling");
  assert.equal(out.storyboard.frames.length, 4);
  assert.deepEqual(out.storyboard.locks.character_refs, ["char_1", "char_2", "char_3"]);
  assert.equal(out.storyboard.frames[0].image_url, "");
  assert.equal(out.storyboardStatus, "not_run");
  storyboard.registerStoryboardImageProvider(async ({ prompt }) => ({ image_url: `https://img.test/${prompt.length}.png`, seed: "s1" }));
  const drawn = await storyboard.generateFrames(JSON.parse(JSON.stringify(out.storyboard)), out.script);
  assert.equal(drawn.status, "pass");
  assert.ok(drawn.storyboard.frames.every((f) => f.image_url.startsWith("https://img.test/")));
  storyboard.resetStoryboardImageProvider();
});

test("old Creative Style values map to the nearest of the three, the same way on server and client", () => {
  const cases = { "Product-focused": "VO-led", "Offer / Promotion": "UGC / Creator-style", "Product Demo": "VO-led", "Conversational / Dialogue": "Storytelling", "Situational Comedy": "Storytelling", "UGC / Creator-style": "UGC / Creator-style", "VO-led": "VO-led", Storytelling: "Storytelling", "": "UGC / Creator-style" };
  for (const [from, to] of Object.entries(cases)) {
    assert.equal(C.normalizeCreativeStyle(from), to, `server: ${from}`);
    assert.equal(clientStyle.normalizeCreativeStyle(from), to, `client: ${from}`);
  }
  assert.deepEqual(clientStyle.CREATIVE_STYLE_OPTIONS.map((o) => o.id), C.CREATIVE_STYLES);
});

// ---- API: brief → creative → script through the real routes ----
const { app } = require("../server");
const db = require("../engine/db");
let base, server, token;
test.before(async () => {
  const u = await db.createUser({ email: "spines@example.com", password: "password123", name: "Spine Tester" });
  token = await db.createSession(u.id);
  await new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); });
});
test.after(() => server && server.close());
const api = async (method, p, body) => {
  const r = await realFetch(base + p, { method, headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};

test("API: brief → creative → script end to end on one business, and an old story asks for a rebuild", async () => {
  const projId = `proj_spines_${Date.now()}`;
  await db.saveProject({ id: projId, businessName: FORM.businessName, businessType: FORM.businessType, town: FORM.town, brief: FORM.brief }, (await db.getUserBySessionToken(token)).id);
  process.env.MOCK_SPINE = "true";
  const und = await api("POST", "/api/creative/ai-understanding", { ...FORM, creativeStyle: "VO-led", projectId: projId });
  delete process.env.MOCK_SPINE;
  assert.equal(und.status, 200, JSON.stringify(und.body));
  const bj = und.body.understanding.brief_json;
  assert.ok(bj && bj.objective.stage && bj.smp, "Checkpoint 1 carries brief.json");
  assert.equal(C.filmFormatFromBrief(bj), "VO-led");
  assert.equal((await api("PUT", `/api/creative/ai-understanding/${projId}`, { understanding: und.body.understanding, approvalStatus: "approved" })).status, 200);

  const dirs = await api("POST", "/api/creative/directions", { ...FORM, creativeStyle: "VO-led", projectId: projId });
  assert.equal(dirs.status, 200, JSON.stringify(dirs.body));
  assert.equal(dirs.body.length, 3);
  assert.ok(dirs.body[0].insight && dirs.body[0].recommended && dirs.body[0].title);

  const hooks = await api("POST", "/api/creative/hooks", { ...FORM, format: "VO-led", direction: dirs.body[0], projectId: projId });
  assert.equal(hooks.status, 200);
  assert.ok(hooks.body.length >= 5 && hooks.body[0].angle && hooks.body[0].hookLine);

  const plots = await api("POST", "/api/creative/plots", { ...FORM, direction: dirs.body[0], projectId: projId });
  assert.equal(plots.status, 200);
  assert.ok(plots.body[0].framing);

  const story = await api("POST", "/api/creative/story", { ...FORM, format: "VO-led", direction: dirs.body[0], hook: hooks.body[0], projectId: projId });
  assert.equal(story.status, 200);
  assert.equal(story.body.concept.concept.format, "VO-led");
  assert.equal(story.body.concept.idea_source, "engine");

  const syn = await api("POST", "/api/creative/synthesize-script", { form: { ...FORM, creativeStyle: "VO-led", language: "English" }, creativeDNA: { story: story.body }, projectId: projId });
  assert.equal(syn.status, 200, JSON.stringify(syn.body.failures || syn.body));
  assert.equal(syn.body.script_json.format, "VO-led");
  assert.equal(syn.body.scenes.length, 4);
  assert.ok(syn.body.shotSpec && syn.body.shotSpec.shots.length === 4, "production still gets its shot spec");
  assert.ok(syn.body.notices.some((n) => n.code === "VO_NOT_VOICED"));
  assert.ok(syn.body.gate.passed && syn.body.storyboard_json.frames.length === 4);

  const rw = await api("POST", "/api/creative/rewrite-scene", { scriptJson: syn.body.script_json, scriptHeader: syn.body.header, sceneIndex: 1, instruction: "make it shorter", projectId: projId });
  assert.equal(rw.status, 200);
  assert.match(rw.body.scene, /^SCENE 2 – REAL MOMENT/);
  assert.equal(rw.body.script_json.scenes.length, 4);

  const old = await api("POST", "/api/creative/synthesize-script", { form: { ...FORM }, creativeDNA: { story: { format: "Storytelling", setting: "x" } }, projectId: projId });
  assert.equal(old.status, 409);
  assert.equal(old.body.code, "CONCEPT_MISSING");
});

test("API: an edit to the polished brief at Checkpoint 1 makes the Brief Spine rebuild brief.json before ideas", async () => {
  const userId = (await db.getUserBySessionToken(token)).id;
  const projId = `proj_spines_edit_${Date.now()}`;
  await db.saveProject({ id: projId, businessName: FORM.businessName, businessType: FORM.businessType, brief: FORM.brief }, userId);
  process.env.MOCK_SPINE = "true";
  const und = await api("POST", "/api/creative/ai-understanding", { ...FORM, creativeStyle: "Storytelling", projectId: projId });
  delete process.env.MOCK_SPINE;
  const edited = { ...und.body.understanding, core_communication: "Edited at the checkpoint" };
  await api("PUT", `/api/creative/ai-understanding/${projId}`, { understanding: edited, approvalStatus: "approved" });
  requests.length = 0;
  const dirs = await api("POST", "/api/creative/directions", { ...FORM, creativeStyle: "Storytelling", projectId: projId });
  assert.equal(dirs.status, 200);
  assert.ok(requests.some((r) => /You are running the Brief Spine above/.test(r.system) && JSON.stringify(r.messages || r.content).includes("Edited at the checkpoint")), "brief.json rebuilt from the edited polished brief");
  const saved = (await db.getProjectById(projId, userId)).aiUnderstanding;
  assert.ok(saved.brief_json && saved.brief_basis, "the rebuilt brief.json is saved on the project");
});
