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
let briefSpineDelayMs = 0; // set by a test to make the Brief Spine answer slow, as the live model is
const realFetch = global.fetch;
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (u.startsWith("https://api.anthropic.com")) {
    const body = JSON.parse(opts.body);
    requests.push(body);
    if (briefSpineDelayMs && /You are running the Brief Spine above/.test(body.system)) await new Promise((r) => setTimeout(r, briefSpineDelayMs));
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
  for (const [name, title, owns, version] of [["brief", "CleverCut — Brief Spine", "/api/creative/ai-understanding", "1.0.0"], ["creative", "CleverCut — Creative Spine", "/api/creative/directions", "1.0.0"], ["script", "CleverCut — Script & Storyboard Spine", "/api/creative/synthesize-script", "2.1.0"]]) {
    const sp = loadSpine(name);
    assert.equal(sp.version, version);
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
    if (format === "Storytelling") assert.ok(new Set(out.script.scenes.flatMap((s) => s.dialogue.map((d) => d.speaker))).size >= 2, "speakers rotate");
    // two characters, one per render character input; every scene exactly 5s; one frame description per scene
    assert.equal(out.script.context_block.characters.length, 2);
    assert.ok(out.character1.startsWith("Asha") && out.character2.startsWith("Ravi") && !out.character2.includes("|"), "one character per slot, nothing packed");
    assert.ok(out.script.scenes.every((s, i) => s.duration_s === 5 && s.start_s === i * 5));
    assert.equal(out.storyboard.frames.length, 4);
    assert.ok(!out.notices.some((n) => n.code === "EXTRA_CHARACTERS"));
    assert.ok(prompts.some((p) => p.includes("— write the script") && p.includes(C.TWO_CHARACTERS_RULE)), "the script writer gets the two-character rule");
    assert.ok(prompts.some((p) => p.includes("— Checkpoint 3 – Angles") && p.includes(C.TWO_CHARACTERS_RULE)), "the angles get it too");
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
    return runScriptGate(s, { header, brief, storyboard: storyboard.buildStoryboard(s, base.frames) });
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
  assert.equal(g.checks.find((c) => c.id === "frames").status, "pass", "the frame check runs on the descriptions");
  assert.ok(!g.checks.some((c) => c.status === "not_run"), "no storyboard 'not run' state");
  assert.equal(g.checks.find((c) => c.id === "ending_payoff").status, "self-check");

  // two characters: a third in the Context Block, a third speaker or a third person in a visual fails the gate
  assert.ok(make("Storytelling", (s) => { s.context_block.characters.push({ ref: "char_3", name: "Dadi", role: "grandmother", age: "70", gender: "female", wardrobe: "white saree" }); }).failures.some((f) => /3 characters — every film has exactly two/.test(f)));
  assert.ok(make("Storytelling", (s) => { s.scenes[1].dialogue = [{ speaker: "Dadi", line: "Where is the oil?" }]; }).failures.some((f) => /"Dadi" speaks but isn't one of the two characters/.test(f)));
  assert.ok(make("Storytelling", (s) => { s.scenes[3].visual = "Asha pours the oil into the pan while her husband sets the table beside her."; }).failures.some((f) => /Scene 4 features a third person \("husband"\) — rewrite the visual with only Asha and Ravi/.test(f)));
  assert.ok(make("Storytelling", (s) => { s.scenes[0].visual = "Asha stirs the pan at the stove. Shoppers pass by in the blurred background of the window."; }).passed, "background activity is not a featured person");
  assert.ok(make("Storytelling", (s) => { s.scenes[0].visual = "Asha stirs the pan at the stove with a steel ladle. No other person is in the frame."; }).passed, "a sentence ruling people out names nobody");
  // found live: "Anonymous hands only — not Priya or Ravi" stacked the boxes — a third person's hands doing the action
  assert.ok(make("Storytelling", (s) => { s.scenes[2].visual = "Anonymous hands only — not Asha or Ravi, no face visible. The hands stack two sealed boxes on the counter."; }).failures.some((f) => /Scene 3 features a third person \("anonymous hands"\)/.test(f)));
  assert.ok(!storyboard.mentions("Anonymous hands only — not Asha or Ravi.", { name: "Asha" }), "a character ruled out of the frame isn't in it");
  assert.ok(make("Storytelling", (s) => { s.scenes[2].visual = "Two hands, no character named, tie a red ribbon around the sealed box on the counter."; }).failures.some((f) => /Scene 3 shows hands that belong to neither character — make them Asha's or Ravi's/.test(f)));
  assert.ok(make("Storytelling", (s) => { s.scenes[2].visual = "Ravi sets the box down at the kitchen door. His hands tie a red ribbon around the sealed box."; }).passed, "a character's own hands are fine");
  // found live: "Ravi's hands only, no face visible" — the "no" is about the face, the hands are Ravi's
  assert.ok(make("Storytelling", (s) => { s.scenes[2].visual = "Close-up — Ravi's hands only, no face visible. Ravi ties a red ribbon around the sealed box at the kitchen door."; }).passed);
  assert.ok(make("Storytelling", (s) => { s.scenes[2].visual = "Ravi folds the lid of the box closed at the door. He lifts the sealed box with both hands and passes it to Asha."; }).passed, "\"he … with both hands\" names whose hands they are");
  assert.ok(make("Storytelling", (s) => { s.scenes[2].visual = "Asha's hands pack the sweets into the box on the counter. Ravi's hands lift the second box onto the stack. Both pairs of hands leave the frame."; }).passed, "\"both pairs of hands\" refers back to hands already named");
  // S-M9: a note about what isn't generated isn't a generation instruction; "generate with a zoom effect" is
  assert.ok(make("Storytelling", (s) => { s.scenes[3].edit_notes = "Hold 1s. The super is rendered by Production and is not in the generated frame."; }).passed);
  assert.ok(make("Storytelling", (s) => { s.scenes[3].edit_notes = "Generate with a zoom effect on the bottle."; }).failures.some((f) => /Scene 4 Editing Notes contain generation instructions/.test(f)));
  // the other character's Context Block line can name this one ("Asha's neighbour") — only the writer's note says who is in frame
  assert.ok(make("Storytelling", (s) => { s.context_block.characters[1].role = "Asha's neighbourhood delivery boy"; }).passed);
  assert.ok(make("Storytelling", (s) => { s.context_block.product.packaging = "white box with the brand logo on the top face"; }).passed, "the product's own packaging logo isn't a logo asked for in the frame");
  assert.ok(make("Storytelling", (s) => { s.context_block.characters = s.context_block.characters.slice(0, 1); }).failures.some((f) => /1 character — every film has exactly two/.test(f)));
  // found live: a UGC writer made the second character "voice on phone … not seen on screen"
  assert.ok(make("Storytelling", (s) => { s.context_block.characters[1].wardrobe = "Not seen on screen — voice only"; }).failures.some((f) => /character 2 \(Ravi\) is never seen — both characters appear on screen/.test(f)));
  // S-M5 (spine 2.1.0): writing and phone/app screens may be generated, spelled out word for word in "UI / in-scene text"
  const phoneVisual = "Asha looks at her phone as the order screen lights up on the steel counter.";
  assert.ok(make("Storytelling", (s) => { s.scenes[0].visual = phoneVisual; }).failures.some((f) => /Scene 1 shows a screen or writing — give its exact words in "UI \/ in-scene text"/.test(f)), "a screen with no words given fails");
  const spelled = make("Storytelling", (s) => { s.scenes[0].visual = phoneVisual; s.scenes[0].ui_mockup = 'Phone order screen: "Order placed" / "Arriving in 30 min"'; });
  assert.ok(spelled.passed, spelled.failures.join(" | "));
  assert.ok(make("Storytelling", (s) => { s.scenes[0].ui_mockup = 'Shop sign: "Fresh oil, fresh atta, fresh dal, every single evening, right here in Palasia, open till late"'; }).failures.some((f) => /too long to read in a 5-second scene/.test(f)));
  assert.ok(make("Storytelling", (s) => { s.scenes[0].ui_mockup = 'Poster: "Flat 50% off today"'; }).failures.some((f) => /shows "50%", which isn't in the brief's offer or proof points/.test(f)), "a figure the brief doesn't back");
  assert.ok(make("Storytelling", (s) => { s.scenes[0].ui_mockup = 'Phone screen: "तेल खत्म"'; }).failures.some((f) => /in-scene text "तेल खत्म" is not in English/.test(f)), "in the brief's language");
  assert.ok(make("Storytelling", (s) => { s.scenes[0].ui_mockup = "Phone screen showing the order"; }).failures.some((f) => /doesn't give the exact words/.test(f)), "vague in-scene text");
  assert.ok(make("Storytelling", (s) => { s.scenes[0].ui_mockup = 'The brand logo glowing on the shop sign: "Sharma Store"'; }).failures.some((f) => /asks the model to draw a logo/.test(f)), "logos stay banned");
  assert.ok(make("Storytelling", (s) => { s.scenes[0].visual = "Asha tilts the empty bottle over the pan while a caption appears across the bottom of the frame."; }).failures.some((f) => /asks for a caption or headline over the picture/.test(f)), "supers and captions stay Production's");

  // Don'ts: the user's own are word-checked; the Brief Spine's brand/category sentences are the writer's self-check
  // (found live: "no health claims about sweet products" failed every Kanti Sweets script for saying "sweet").
  const withDonts = (dos_donts) => {
    const s = C.normalizeScript({ ...base, format: "Storytelling", length_s: 20, language: { name: "English", script: "Latin" } });
    s.scenes = s.scenes.map((x, i) => ({ ...x, n: i + 1, beat: ["Hook", "Real moment", "Turn", "Payoff"][i] }));
    s.scenes[0].visual = `${s.scenes[0].visual} A box of sweets from DiamondPlaza sits on the counter.`;
    return runScriptGate(s, { header, brief: { ...brief, dos_donts }, storyboard: storyboard.buildStoryboard(s, base.frames) });
  };
  const category = { rule: "Do not make specific health, nutrition or weight claims about sweet products", type: "Must not include", strength: "must", source: "category", applies_to: ["script"] };
  const userDont = { rule: "Do not mention DiamondPlaza", type: "Must not include", strength: "must", source: "user", applies_to: ["script"] };
  const judged = withDonts([category]);
  assert.ok(judged.passed, judged.failures.join(" | "));
  assert.equal(judged.checks.find((c) => c.id === "dos_donts_judged").status, "self-check");
  assert.ok(withDonts([category, userDont]).failures.some((f) => /Don't broken: "Do not mention DiamondPlaza"/.test(f)), "the user's own Don't is still enforced");

  // VO-led: "about 40–50 words for 20s" — 52 is about right, 60 is not
  const voScript = (n) => make("VO-led", (s) => {
    const per = [Math.ceil(n / 4), Math.ceil(n / 4), Math.ceil(n / 4), n - 3 * Math.ceil(n / 4)];
    s.scenes.forEach((x, i) => { x.dialogue = []; x.vo = Array.from({ length: per[i] }, (_, k) => `word${k}`).join(" "); });
  });
  assert.ok(!voScript(52).failures.some((f) => /VO runs/.test(f)), "52 words is about 40–50");
  assert.ok(voScript(60).failures.some((f) => /VO runs 60 words/.test(f)));
  assert.ok(voScript(30).failures.some((f) => /VO runs 30 words/.test(f)));
});

test("Section 3 scenes still feed the unchanged render path (visual, camera, dialogue; supers never generated)", () => {
  const sc = { n: 2, beat: "Real moment", start_s: 5, duration_s: 5, visual: "Asha tilts an empty oil bottle over the pan.", shot: "medium", camera: "slow push-in", dialogue: [{ speaker: "Asha", line: "तेल खत्म!" }], vo: "", super: "OIL RAN OUT", callout: "30-minute delivery", cta: "none", disclaimer: "none", ui_mockup: "none", logo: "none", ambience: "hum", sfx: "clink", music_mood: "Playful", transition_out: "match cut – the bottle", edit_notes: "Hold." };
  const text = scriptSpine.renderScene(sc);
  assert.match(text, /^SCENE 2 – REAL MOMENT – 0:05–0:10/);
  assert.deepEqual(extractSceneParts(text), { visual: "Asha tilts an empty oil bottle over the pan.", camera: "slow push-in", dialogue: 'Asha: "तेल खत्म!"' });
  assert.deepEqual(dialogueOf(text).lines, [{ speaker: "Asha", text: "तेल खत्म!" }]);
  const gen = sceneForGeneration(text, {});
  assert.ok(!gen.includes("OIL RAN OUT") && !gen.includes("30-minute delivery") && !gen.includes("Transition out"), "on-screen elements are rendered by Production, never sent to the video model");
  // S-M5 (spine 2.1.0): in-scene writing and phone UI the AI draws reach the video model word for word
  const withUi = scriptSpine.renderScene({ ...sc, ui_mockup: 'Phone screen, WhatsApp chat: "Bhaiya, one bottle of oil please"' });
  assert.match(withUi, /• UI \/ in-scene text: Phone screen, WhatsApp chat: "Bhaiya, one bottle of oil please"/);
  assert.match(withUi, /On-screen elements \(supers, callouts, CTA, disclaimer and logo rendered by Production; in-scene writing and phone UI may be AI-generated\):/);
  const genUi = sceneForGeneration(withUi, {});
  assert.ok(genUi.includes('IN-SCENE TEXT — render exactly these words') && genUi.includes('"Bhaiya, one bottle of oil please"') && !genUi.includes("OIL RAN OUT"));
  const { compileShotSpecification, compileShotPrompt } = require("../engine/compiler");
  const spec = compileShotSpecification({ scenes: [withUi], setting: "kitchen", character1: "Asha", character2: "Ravi" }, { aspectRatio: "9:16" });
  assert.equal(spec.shots[0].inSceneText, 'Phone screen, WhatsApp chat: "Bhaiya, one bottle of oil please"');
  assert.match(compileShotPrompt(spec.shots[0], spec.staticWorld, { shotCount: 4, sceneIndex: 1 }), /IN-SCENE TEXT \(render exactly these words[^)]*\): Phone screen, WhatsApp chat: "Bhaiya, one bottle of oil please"/);
});

test("storyboard: one written frame description per scene (Section 4), no images; text locks feed production", async () => {
  const { out } = await chain("Storytelling");
  const sb = out.storyboard;
  assert.deepEqual(Object.keys(sb.frames[0]), ["scene", "frame", "composition", "subject", "product", "setting_light", "placeholders", "line", "approved"]);
  assert.deepEqual(Object.keys(sb.locks), ["characters", "product", "reference_images", "style", "palette"]);
  assert.equal(sb.frames.length, 4);
  assert.ok(!JSON.stringify(sb).includes("image_url"), "no images");
  assert.equal(new Set(sb.frames.map((f) => f.setting_light)).size, 1, "the same setting and light in every frame");
  assert.ok(sb.frames[0].frame.startsWith("9:16 · medium shot"));
  const ravi = scriptSpine.productionFields(out.script).character2;
  assert.ok(sb.frames[2].subject.includes(ravi), "a character in frame is described exactly as in the Context Block");
  assert.match(sb.frames[0].placeholders, /Super "Oil ran out\?" — lower third/);
  assert.equal(sb.frames[1].product, "Not in frame.");
  assert.equal(sb.locks.characters.length, 2);
  assert.ok(sb.locks.product.includes("golden"));
  assert.ok(typeof storyboard.registerStoryboardImageProvider === "undefined", "the image provider seam is gone");

  // the frame check runs on the descriptions (spine 2.1.0): in-scene writing is spelled out word for word, logos never
  assert.ok(sb.frames[1].composition.includes(`${storyboard.IN_SCENE_MARK} ${out.script.scenes[1].ui_mockup}`), "the frame carries the scene's in-scene text word for word");
  const header = { brand: "a", objective: "a", platform_format: "a", film_format: "a", angle: "a", lens: "a", hook: "a", ending: "a", mood: "a", moment: "a", language: "a" };
  const hiBrief = C.briefForScript({ ...answers.brief, language: { name: "Hindi", script: "Devanagari" } });
  const withScreen = JSON.parse(JSON.stringify(sb));
  withScreen.frames[1].composition = `Asha holds the phone up; the screen shows the WhatsApp chat in close-up for the viewer. ${storyboard.IN_SCENE_MARK} ${out.script.scenes[1].ui_mockup}`;
  assert.ok(!runScriptGate(out.script, { header, brief: hiBrief, storyboard: withScreen }).failures.some((f) => /^Frame 2/.test(f)), "a chat screen with its words spelled out is fine");
  const vague = JSON.parse(JSON.stringify(out.script));
  vague.scenes[2].ui_mockup = "none";
  const vagueBoard = JSON.parse(JSON.stringify(sb));
  vagueBoard.frames[2].composition = "Ravi holds up his phone; the screen shows the order confirmation for the viewer to read.";
  assert.ok(runScriptGate(vague, { header, brief: hiBrief, storyboard: vagueBoard }).failures.some((f) => /Frame 3 shows a screen or writing without its exact words/.test(f)));
  const logo = JSON.parse(JSON.stringify(sb));
  logo.frames[0].composition = "Asha stands centre-frame at the stove; the shop logo is printed across the wall behind her.";
  assert.ok(runScriptGate(out.script, { header, brief: hiBrief, storyboard: logo }).failures.some((f) => /Frame 1 asks for a logo inside the frame/.test(f)));
});

test("render prompts: every scene exactly 5s, the same static world in each, the frame description, no generated logo outro", () => {
  const { compileShotPrompt } = require("../engine/compiler");
  const sw = { setting: "small home kitchen, evening, tube light", characters: "Asha, home cook | Ravi, delivery boy", product: "Groundnut oil 1L, golden", look: "Storytelling · Light humour", palette: "turmeric yellow" };
  const frame = { frame: "9:16 · medium shot · eye level · camera: static", composition: "Asha centre-frame at the stove.", subject: "Asha tilts the bottle.", product: "Groundnut oil 1L — in her hand", placeholders: 'Super "Oil ran out?" — lower third' };
  const prompts = [0, 1, 2, 3].map((i) => compileShotPrompt({ shotNumber: i + 1, beat: i === 3 ? "OUTRO & LOGO" : "HOOK", framing: "Medium", primaryAction: "x.", fullVisual: "x.", cameraMovement: "static", dialogue: "None", frame }, sw, { shotCount: 4, sceneIndex: i, duration: "20s" }));
  const staticLine = (p) => p.split("\n\n").find((l) => l.startsWith("STATIC WORLD"));
  assert.equal(new Set(prompts.map(staticLine)).size, 1, "the static world is word for word the same in every scene");
  assert.ok(prompts.every((p) => /This scene is exactly 5 seconds/.test(p) && /the film is 20s of generated video, and the end frame is added afterwards/.test(p)));
  assert.ok(prompts[0].includes("STORYBOARD FRAME: Frame: 9:16 · medium shot") && !prompts[0].includes("Oil ran out?"), "the frame goes in, the placeholders (text) never do");
  assert.ok(!prompts.some((p) => /LOGO END-CARD|logo presentation/i.test(p)), "the video model is never asked to draw a logo outro");
  assert.ok(prompts[0].includes("the only two people featured in this film"));
  // a composition sentence about where a super sits stays in the storyboard but never reaches the video model
  const withSuper = compileShotPrompt({ shotNumber: 1, beat: "HOOK", framing: "Medium", primaryAction: "x.", fullVisual: "x.", cameraMovement: "static", dialogue: "None", frame: { ...frame, composition: "Asha centre-frame at the stove. Super 'Shaadi season. Two days.' sits in the upper-third safe zone." } }, sw, { shotCount: 4, sceneIndex: 0 });
  assert.ok(withSuper.includes("Composition: Asha centre-frame at the stove.") && !/Shaadi season/.test(withSuper));
});

test("Section 5: a repair pass rewrites only the failing scene and frame; the rest of the script is kept", async () => {
  const full = JSON.parse(answers.scriptFor({ format: "Storytelling", script: "Devanagari" }).replace(/^@@JSON@@\n|\n@@END@@$/g, ""));
  full.scenes[1].super = "one two three four five six seven eight"; // fails: super longer than 6 words
  const fixed = { ...full.scenes[1], n: 2, super: "Oil on its way" };
  const seen = [];
  const call = async (req) => {
    seen.push(req);
    if (/— write the script ===/.test(req.system)) return answers.J(full);
    return answers.J({ scenes: [fixed], frames: [{ scene: 2, camera_angle: "eye level", composition: "Asha stands centre-frame at the counter; the window sits behind her; the lower third stays clear.", subject: "Asha taps a message on her phone.", product: "not in frame" }] });
  };
  const concept = { ...answers.concept, insight: { lens: "2, Everyday Moments", tension: "The oil runs out mid-tadka" }, angles: answers.angles.angles.slice(0, 1), chosen_angle_id: "a1" };
  const brief = C.normalizeBrief({ ...answers.brief, company: { brand: "Sharma General Store", category: "Kirana" }, language: { name: "Hindi", script: "Devanagari" }, formats: { aspect_ratios: ["9:16"], lengths_s: [20] }, platforms: ["Meta Reels"], dos_donts: [C.filmFormatRule("Storytelling")] });
  const out = await scriptSpine.writeScript({ concept, brief: C.briefForScript(brief) }, { call });
  assert.ok(out.gate.passed, (out.gate.failures || []).join(" | "));
  assert.equal(seen.length, 2);
  assert.match(seen[1].system, /REPAIR \(Section 5: rewrite only the parts that fail/);
  assert.match(seen[1].system, /Rewrite only scene 2\b/);
  assert.equal(out.script.scenes[1].super, "Oil on its way");
  assert.equal(out.script.scenes[0].visual, full.scenes[0].visual, "scenes that passed are kept as they were");
  assert.equal(out.storyboard.frames.length, 4);
});

test("after three failed passes the user gets plain words and two ways forward, never rule codes", async () => {
  const full = JSON.parse(answers.scriptFor({ format: "Storytelling", script: "Devanagari" }).replace(/^@@JSON@@\n|\n@@END@@$/g, ""));
  full.scenes[1].super = "one two three four five six seven eight"; // fails every pass
  full.scenes[2].visual = "Ravi hands the bottle to Asha while her husband watches from the doorway of the kitchen.";
  const call = async () => answers.J(full);
  const concept = { ...answers.concept, insight: { lens: "2, Everyday Moments", tension: "The oil runs out mid-tadka" }, angles: answers.angles.angles.slice(0, 1), chosen_angle_id: "a1" };
  const brief = C.normalizeBrief({ ...answers.brief, company: { brand: "Sharma General Store", category: "Kirana" }, language: { name: "Hindi", script: "Devanagari" }, formats: { aspect_ratios: ["9:16"], lengths_s: [20] }, platforms: ["Meta Reels"], dos_donts: [C.filmFormatRule("Storytelling")] });
  await assert.rejects(() => scriptSpine.writeScript({ concept, brief: C.briefForScript(brief) }, { call }), (e) => {
    assert.equal(e.code, "SCRIPT_GATE_FAILED");
    assert.equal(e.status, 422);
    assert.equal(e.message, scriptSpine.GATE_FAILED_MESSAGE);
    assert.match(e.message, /Retry Script Generation/);
    assert.match(e.message, /Back to Hook/);
    for (const text of [e.message, ...e.failures]) {
      assert.doesNotMatch(text, /\b[SCB]-M\d|Annex|Section \d|quality gate|Context Block|brief\.\w+|pick the next angle/i, `no internal terms: ${text}`);
    }
    assert.ok(e.failures.includes(scriptSpine.PLAIN_PROBLEMS.on_screen));
    assert.ok(e.failures.includes(scriptSpine.PLAIN_PROBLEMS.two_characters));
    assert.ok(e.details.some((d) => /super is longer than 6 words/.test(d)), "the specifics stay available for the log");
    return true;
  });
});

// Found live (Kanti Sweets): the Brief Spine wrote guidance into mandatories.disclaimers, and the gate looked for that
// whole sentence in the script, so no repair pass could ever pass it.
const GHEE_GUIDANCE = "If 'pure desi ghee' is used as an on-screen super or VO claim, add: 'Made with desi ghee' — omit 'pure' unless the brand holds a verifiable quality certification.";

test("disclaimers hold the words to show; guidance about a disclaimer becomes a category rule", () => {
  const saved = [
    GHEE_GUIDANCE,
    "Ad disclosure: 'Paid promotion' or 'Ad' label required (Meta / ASCI)",
    "Any 'pure ghee' or 'no preservatives' claims require FSSAI label substantiation before use",
    "Offer validity and terms to be added by client before publishing.",
    "FSSAI licence number to be shown if any food-quality claim is made.",
  ];
  const literal = ["T&C apply", "Made with desi ghee", "Do not drink and drive", "If symptoms persist, consult your doctor", "Use only as directed", "Prescription required", "Mutual fund investments are subject to market risks, read all scheme related documents carefully.", "Claims based on internal lab tests"];
  for (const t of saved) assert.ok(C.isDisclaimerGuidance(t), `guidance: ${t}`);
  for (const t of literal) assert.ok(!C.isDisclaimerGuidance(t), `words to show: ${t}`);
  assert.equal(C.disclaimerWordsIn(GHEE_GUIDANCE), "Made with desi ghee");
  assert.equal(C.disclaimerWordsIn(GHEE_GUIDANCE.replace(/'/g, "‘").replace(/‘ /g, "’ ")), "Made with desi ghee", "curly quotes too");

  const b = C.normalizeBrief({ mandatories: { disclaimers: [GHEE_GUIDANCE, saved[3], "T&C apply"] }, dos_donts: [] });
  assert.deepEqual(b.mandatories.disclaimers, ["Made with desi ghee", "T&C apply"]);
  assert.deepEqual(b.dos_donts.map((d) => [d.rule, d.type, d.strength, d.source, d.applies_to.join(",")]), [
    [GHEE_GUIDANCE, "Legal / category", "must", "category", "script,video"],
    [saved[3], "Legal / category", "must", "category", "script,video"],
  ]);
  assert.deepEqual(C.normalizeBrief(b), b, "normalising again changes nothing");
  assert.match(briefSpine.RUN_BRIEF, /disclaimers: only the exact words the viewer must read on screen/, "the Brief Spine is told so at the source");
});

test("the gate matches disclaimer words, never guidance: a saved brief with guidance can still pass", () => {
  const base = JSON.parse(answers.scriptFor({ format: "Storytelling", script: "Latin" }).replace(/^@@JSON@@\n|\n@@END@@$/g, ""));
  const header = { brand: "a", objective: "a", platform_format: "a", film_format: "a", angle: "a", lens: "a", hook: "a", ending: "a", mood: "a", moment: "a", language: "a" };
  const make = (brief, disclaimer) => {
    const s = C.normalizeScript({ ...base, format: "Storytelling", length_s: 20, language: { name: "English", script: "Latin" } });
    s.scenes = s.scenes.map((x, i) => ({ ...x, n: i + 1, beat: ["Hook", "Real moment", "Turn", "Payoff"][i], disclaimer: i === 3 ? disclaimer : "none" }));
    return runScriptGate(s, { header, brief, storyboard: storyboard.buildStoryboard(s, base.frames) });
  };
  const briefFields = { ...answers.brief, language: { name: "English", script: "Latin" }, rtbs: [{ claim: "30-minute delivery", proof: "x" }] };
  // as saved before the fix: not normalised, guidance sitting in mandatories.disclaimers
  const raw = { ...C.briefForScript(briefFields), mandatories: { ...C.briefForScript(briefFields).mandatories, disclaimers: [GHEE_GUIDANCE] } };
  const withWords = make(raw, "Made with desi ghee");
  assert.ok(withWords.passed, withWords.failures.join(" | "));
  assert.equal(withWords.checks.find((c) => c.id === "disclaimer_guidance").status, "self-check");
  assert.deepEqual(make(raw, "none").failures.filter((f) => /disclaimer/i.test(f)), ['Required disclaimer missing: "Made with desi ghee".']);
  // the same brief as the spines now hand it over: words in disclaimers, guidance as a judged category rule
  const normal = C.briefForScript({ ...briefFields, mandatories: { disclaimers: [GHEE_GUIDANCE] } });
  assert.deepEqual(normal.mandatories.disclaimers, ["Made with desi ghee"]);
  const passes = make(normal, "Made with desi ghee");
  assert.ok(passes.passed, passes.failures.join(" | "));
  assert.ok(passes.checks.find((c) => c.id === "dos_donts_judged").details.includes(GHEE_GUIDANCE), "the condition is the writer's self-check, not a must-include");
});

test("the concept names its two people first time: the cast is in the answer's shape, and a missing one doesn't cost a call", async () => {
  const b = C.normalizeBrief({ ...answers.brief, dos_donts: [C.filmFormatRule("Storytelling")] });
  const angle = answers.angles.angles[0];
  const asked = [];
  const run = (answer) => creativeSpine.runConcept({ brief: b, insight: answers.insight.tensions ? answers.insight.tensions[0].insight : {}, angle, angles: [angle] }, { call: async (req) => { asked.push(req); return answers.J(answer); } });
  await run(answers.concept);
  assert.equal(asked.length, 1, "no correction pass");
  assert.match(asked[0].system, /\{"cast": \["", ""\], "dos_donts_check"/, "the shape asked for starts with cast");
  assert.match(asked[0].system, /one key Section 12 doesn't list, "cast"/);

  asked.length = 0;
  const { cast, ...noCast } = answers.concept;
  const res = await run(noCast);
  assert.equal(asked.length, 1, "no cast in the answer: checked against the chosen angle's two people, no second call");
  assert.ok(res.concept.concept.beats.length);
  assert.ok(cast.length === 2);

  asked.length = 0;
  const third = { ...noCast, concept: { ...noCast.concept, beats: [...noCast.concept.beats.slice(0, 3), "Her neighbour Meena walks in and joins them."] } };
  await assert.rejects(() => run(third), (e) => e.code === "TWO_CHARACTERS");
  assert.equal(asked.length, 2, "a third person is still caught and asked about once");
});

test("a script pass isn't lost to unescaped quotes or to characters written as char_1 / char_2", async () => {
  const { parseJSONBlock } = require("../engine/parse");
  // found live (Kanti Sweets): quoted speech left unescaped lost a whole 6k-token first pass
  assert.deepEqual(parseJSONBlock('@@JSON@@\n{"scenes": [{"line": "Maker: "You can\'t taste the ghee through the packaging.""\n}], "n": 1}\n@@END@@'),
    { scenes: [{ line: "Maker: \"You can't taste the ghee through the packaging.\"" }], n: 1 });
  assert.deepEqual(parseJSONBlock('{"a": "She says "wait", then "go"", "b": [1, "x \\"y\\" z", true]}'), { a: 'She says "wait", then "go"', b: [1, 'x "y" z', true] });

  // found live: the second pass wrote speakers and visuals as char_1 / char_2, and the gate read them as strangers
  const full = JSON.parse(answers.scriptFor({ format: "Storytelling", script: "Devanagari" }).replace(/^@@JSON@@\n|\n@@END@@$/g, ""));
  const [c1, c2] = full.context_block.characters;
  const asRefs = (t) => String(t || "").split(c1.name).join(c1.ref).split(c2.name).join(c2.ref);
  full.scenes = full.scenes.map((sc) => ({ ...sc, visual: asRefs(sc.visual), dialogue: (sc.dialogue || []).map((d) => ({ ...d, speaker: asRefs(d.speaker) })) }));
  assert.ok(full.scenes.some((sc) => sc.dialogue.some((d) => d.speaker === c1.ref)), "the answer uses refs");
  const asked = [];
  const concept = { ...answers.concept, insight: { lens: "2, Everyday Moments", tension: "The oil runs out mid-tadka" }, angles: answers.angles.angles.slice(0, 1), chosen_angle_id: "a1" };
  const brief = C.normalizeBrief({ ...answers.brief, company: { brand: "Sharma General Store", category: "Kirana" }, language: { name: "Hindi", script: "Devanagari" }, formats: { aspect_ratios: ["9:16"], lengths_s: [20] }, platforms: ["Meta Reels"], dos_donts: [C.filmFormatRule("Storytelling")] });
  const out = await scriptSpine.writeScript({ concept, brief: C.briefForScript(brief) }, { call: async (req) => { asked.push(req); return answers.J(full); } });
  assert.equal(asked.length, 1, "passes on the first pass");
  assert.ok(out.script.scenes.every((sc) => !/\bchar_\d\b/.test(sc.visual) && sc.dialogue.every((d) => !/\bchar_\d\b/.test(d.speaker))), "names, not refs, reach the render prompt");
  assert.ok(out.script.scenes.some((sc) => sc.dialogue.some((d) => d.speaker === c1.name)));
  assert.match(asked[0].system, /Refs are for the Context Block: speakers and visuals use each character's name/);
});

test("scene plan: the length sets the scene count; the logo end frame is added on top, never a scene", () => {
  const creative = require("../engine/creative");
  for (const [d, n] of [["15s", 3], ["20s", 4], ["30s", 6]]) {
    for (const hasLogo of [false, true]) {
      const plan = creative.computeScenePlan({ duration: d, hasLogo });
      assert.equal(plan.totalScenes, n, `${d} logo=${hasLogo}`);
      assert.equal(plan.totalSeconds, n * 5);
      assert.equal(plan.perSceneSec, 5);
      assert.equal(plan.endFrame, hasLogo, "a logo still brings the end frame");
      assert.ok(!plan.beats.some((b) => /outro/i.test(b.beat)));
    }
    assert.equal(C.scenePlan(parseInt(d, 10)).count, n);
    assert.equal(C.scenePlan(parseInt(d, 10)).each, 5);
  }
  const { sceneForGeneration } = require("../engine/parse");
  const gen = sceneForGeneration("SCENE 1 – HOOK – 0:00–0:05\n\nVisual:\nAsha tilts the bottle.", { duration: "30s", sceneIndex: 0, sceneCount: 6 });
  assert.match(gen, /This scene is exactly 5 seconds \(scene 1 of 6; 30s of generated video in all/);
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
  assert.equal(und.body.understanding.brief_json, undefined, "Checkpoint 1 doesn't wait for brief.json (Section 7 comes after it)");
  assert.equal((await api("PUT", `/api/creative/ai-understanding/${projId}`, { understanding: und.body.understanding, approvalStatus: "approved" })).status, 200);

  const dirs = await api("POST", "/api/creative/directions", { ...FORM, creativeStyle: "VO-led", projectId: projId });
  assert.equal(dirs.status, 200, JSON.stringify(dirs.body));
  assert.equal(dirs.body.length, 3);
  assert.ok(dirs.body[0].insight && dirs.body[0].recommended && dirs.body[0].title);
  const bj = (await db.getProjectById(projId, (await db.getUserBySessionToken(token)).id)).aiUnderstanding.brief_json;
  assert.ok(bj && bj.objective.stage && bj.smp, "brief.json is on the project once the Creative Spine has read it");
  assert.equal(C.filmFormatFromBrief(bj), "VO-led");

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

test("API: Understanding doesn't wait for brief.json; Ideas uses the one started at Checkpoint 1, and a draft save keeps it", async () => {
  const userId = (await db.getUserBySessionToken(token)).id;
  const projId = `proj_spines_bg_${Date.now()}`;
  await db.saveProject({ id: projId, businessName: FORM.businessName, businessType: FORM.businessType, brief: FORM.brief }, userId);
  briefSpineDelayMs = 600;
  try {
    requests.length = 0;
    process.env.MOCK_SPINE = "true";
    const t0 = Date.now();
    const und = await api("POST", "/api/creative/ai-understanding", { ...FORM, creativeStyle: "UGC / Creator-style", projectId: projId });
    const understandingMs = Date.now() - t0;
    delete process.env.MOCK_SPINE;
    assert.equal(und.status, 200);
    assert.ok(understandingMs < briefSpineDelayMs, `Understanding returned in ${understandingMs}ms, before the Brief Spine answered`);
    assert.equal((await api("PUT", `/api/creative/ai-understanding/${projId}`, { understanding: und.body.understanding, approvalStatus: "approved" })).status, 200);
    const dirs = await api("POST", "/api/creative/directions", { ...FORM, creativeStyle: "UGC / Creator-style", projectId: projId });
    assert.equal(dirs.status, 200, JSON.stringify(dirs.body));
    const briefCalls = requests.filter((r) => /You are running the Brief Spine above/.test(r.system));
    assert.equal(briefCalls.length, 1, "Ideas waited for the brief.json already being built instead of starting another");
    const saved = (await db.getProjectById(projId, userId)).aiUnderstanding;
    assert.ok(saved.brief_json && saved.brief_json.smp && saved.brief_basis);

    // the studio's draft autosave sends the understanding without brief.json; the stored one stays
    await db.saveProject({ id: projId, businessName: FORM.businessName, businessType: FORM.businessType, brief: FORM.brief, aiUnderstanding: { ...und.body.understanding, approval_status: "approved" } }, userId);
    const afterDraft = (await db.getProjectById(projId, userId)).aiUnderstanding;
    assert.deepEqual(afterDraft.brief_json, saved.brief_json);
    assert.equal(afterDraft.brief_basis, saved.brief_basis);
  } finally {
    briefSpineDelayMs = 0;
  }
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
