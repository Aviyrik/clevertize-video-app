// Category compliance guardrails (spec: "Category Guardrails for Local Performance Ads", Oct 29, 2026):
// structured modules as data, business-type mapping, rules at every stage and in render prompts, proof fields,
// RERA block, mood enforcement, Devanagari + Roman scanner, the separate reviewer pass, human review, checklist.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "clevercut-test-"));
process.env.ANTHROPIC_API_KEY = "test";
process.env.FESTIVAL_LIVE = "off";
// rules are read from a temp copy so the hot-reload test can edit it without touching the real file
const RULES_COPY = path.join(process.env.DATA_DIR, "categoryGuardrails.json");
fs.copyFileSync(path.join(__dirname, "../engine/rules/categoryGuardrails.json"), RULES_COPY);
process.env.CATEGORY_RULES_FILE = RULES_COPY;

const realFetch = global.fetch;
const anthropic = { queue: [], bodies: [] };
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  if (u.startsWith("https://api.anthropic.com")) {
    anthropic.bodies.push(JSON.parse(opts.body));
    const text = anthropic.queue.length ? anthropic.queue.shift() : "{}";
    return new Response(JSON.stringify({ content: [{ type: "text", text }], stop_reason: "end_turn" }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (u.includes("api.magnific.com")) throw new Error("Magnific must not be called in these tests");
  return realFetch(url, opts);
};

const cg = require("../engine/categoryGuardrails");
const reviewer = require("../engine/complianceReviewer");
const { runGate } = require("../engine/gate");
const { compileShotPrompt } = require("../engine/compiler");
const { sceneForGeneration } = require("../engine/parse");
const { buildUserContent } = require("../engine/prompt");
const creative = require("../engine/creative");
const understandingSpine = require("../engine/understandingSpine");
const client = require("../src/utils/categoryCompliance.js");

const J = (o) => `@@JSON@@\n${JSON.stringify(o)}\n@@END@@`;
const scene = (n, visual, lines) => `SCENE ${n} – HOOK: Test\nVisual: Same setting: ${visual}\nAnimation Elements:\n• Camera: medium shot\n• Text overlay: none\n• UI element: none\n• Transition: cut\n• Motion graphics: none\nAudio / Dialogue / Voiceover:\n${lines.join("\n")}\nSound Design: shop ambience\nEditing Notes: hold`;
const ctxFor = (businessType, extra = {}) => cg.buildComplianceContext({ businessType, ...extra });
const ids = (report) => report.violations.map((v) => v.id);

const REQUIRED_FIELDS = ["claims_allowed", "claims_gated", "auto_reject_words", "auto_reject_visuals", "allowed_moods", "human_truths", "hook_preferences", "risk_tier", "default_mood", "proof_fields", "human_review_rule"];

test("rules are data: a universal module plus all 11 category modules with every required field", () => {
  const rules = cg.loadRules();
  assert.equal(rules.version, "2026-10-29");
  assert.equal(rules.universal.rules.length, 20, "universal rules 1-20");
  const names = Object.values(rules.categories).map((c) => c.name);
  for (const want of ["Fashion & Apparel", "Jewellery & Luxury", "Sweet, Bakery & Food", "Kirana & Supermarket", "Electronics & Gadgets", "Salon, Spa & Beauty", "Healthcare & Clinic", "Real Estate & Decor", "Gym & Fitness", "Education & Coaching", "Automobile & Garage"]) {
    assert.ok(names.some((n) => n.startsWith(want)), `module for ${want}`);
  }
  for (const c of Object.values(rules.categories)) {
    for (const f of REQUIRED_FIELDS) assert.ok(c[f] !== undefined, `${c.id}.${f}`);
    assert.ok(["low", "medium", "high"].includes(c.risk_tier), `${c.id} tier`);
    assert.ok(rules.moods[c.default_mood], `${c.id} default mood`);
  }
  // quality gate table (Section 8) matches the modules
  for (const row of rules.quality_gate.table) {
    const m = rules.categories[row.category];
    assert.ok(m, row.category);
    assert.equal(m.risk_tier, row.risk_tier.toLowerCase(), `${row.category} tier`);
    assert.equal(rules.moods[m.default_mood].label, row.default_mood, `${row.category} default mood`);
  }
  assert.deepEqual(rules.quality_gate.checklist.map((c) => c.id), ["module_loaded", "no_auto_reject", "gated_claims_proof", "safety_visuals", "ai_weakness", "mood_allowed", "high_tier_review"]);
});

test("every business type the app offers is mapped to a module or explicitly flagged (never guessed)", () => {
  const rules = cg.loadRules();
  const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
  const listFrom = (src, start) => {
    const i = src.indexOf(start);
    const block = src.slice(i, src.indexOf("];", i));
    return [...block.matchAll(/["']([^"'\n]{3,60})["'],?\s*(?:\n|$)/g)].map((m) => m[1]);
  };
  const types = new Set([
    ...listFrom(read("server.js"), "const STANDARD_BUSINESS_CATEGORIES = ["),
    ...listFrom(read("src/App.jsx"), "const BUSINESS_TYPE_PRESETS = ["),
    ...listFrom(read("src/components/v2/UrlResearchModal.jsx"), "export const STANDARD_BUSINESS_CATEGORIES = ["),
    ...[...read("src/components/v2/BusinessOnboardingModal.jsx").matchAll(/^\s{4}label: '([^']+)',$/gm)].map((m) => m[1]).filter((l) => !/&\s*$/.test(l)),
  ]);
  assert.ok(types.size >= 30, `collected ${types.size} business types`);
  for (const t of types) {
    const entry = Object.entries(rules.business_type_map).find(([k]) => k.toLowerCase() === t.toLowerCase());
    assert.ok(entry, `"${t}" is in business_type_map`);
    const m = cg.resolveCategory(t);
    if (entry[1].category) assert.ok(["clean", "needs_scope"].includes(m.status), `${t}: ${m.status}`);
    else assert.ok(m.status === "unmapped" && m.flag, `${t} is flagged, not guessed`);
  }
  assert.equal(cg.resolveCategory("Healthcare, Clinic & Pharmacy").categoryId, "healthcare");
  assert.equal(cg.resolveCategory("Pet Care, Clinic & Pet Shop").status, "unmapped", "vet care is not human healthcare");
  // a custom type stays unmapped until the owner picks; the pick is honoured only for unmapped types
  assert.equal(cg.resolveCategory("My Saree Corner").status, "unmapped");
  assert.equal(cg.resolveCategory("My Saree Corner", { category: "fashion" }).categoryId, "fashion");
  assert.equal(cg.resolveCategory("Healthcare, Clinic & Pharmacy", { category: "fashion" }).categoryId, "healthcare", "owner can't switch a mapped type to a weaker module");
  // real estate & decor: property rules (RERA) unless the owner says decor only
  assert.equal(cg.resolveCategory("Real Estate & Home Decor").categoryId, "real_estate");
  assert.equal(cg.resolveCategory("Real Estate & Home Decor", { scope: "home_decor" }).categoryId, "home_decor");
});

test("scanner reads dialogue, voiceover and visual fields in Devanagari and Roman (गारंटी / guarantee, गोरा / gora, 100%)", () => {
  const salon = ctxFor("Salon, Spa & Beauty");
  const r = cg.buildComplianceReport(salon, {
    setting: "A neighbourhood salon with two chairs and a mirror",
    scenes: [
      scene(1, "Priya looks at Meena in the mirror", ['Priya: "इस फेशियल से आप गोरी हो जाओगी, गारंटी है!"']),
      scene(2, "Meena smiles at Priya; before and after split screen", ['VO: "Gora rang, 100% guaranteed results."']),
    ],
  });
  const hits = r.violations.map((v) => `${v.id}|${v.field}|${cg.normText(v.match)}`);
  assert.ok(hits.some((h) => h.startsWith("S-fairness|dialogue|गोरी")), hits.join("\n"));
  assert.ok(hits.some((h) => h.startsWith("S-results|dialogue|गारंटी")), hits.join("\n"));
  assert.ok(hits.some((h) => h.startsWith("S-fairness|voiceover|gora")), hits.join("\n"));
  assert.ok(hits.some((h) => h.startsWith("S-results|voiceover|guaranteed")), hits.join("\n"));
  assert.ok(hits.some((h) => h.startsWith("U1-numbers|voiceover|100%")), hits.join("\n"));
  assert.ok(hits.some((h) => h.startsWith("S-before-after|visual|")), hits.join("\n"));
  assert.equal(r.passed, false);
  // nukta and Devanagari digits are normalised: "फ़्री" == "फ्री", "१००%" == "100%"
  const hc = ctxFor("Healthcare, Clinic & Pharmacy");
  assert.ok(ids(cg.buildComplianceReport(hc, { scenes: [scene(1, "x", ['Dr: "१००% इलाज"'])] })).includes("H-outcomes"));
  // a clean line passes; "all the best" is not a superlative claim
  const clean = cg.buildComplianceReport(ctxFor("Kirana, Grocery & Supermarket"), { scenes: [scene(1, "Bhaiya hands Sunita a bag of dal across the counter, looks at her", ['Bhaiya: "वही वाला दाल, आपके लिए। All the best!"'])] });
  assert.deepEqual(ids(clean), [], JSON.stringify(clean.violations));
});

test("claims gated on a proof field are only allowed when that field is filled", () => {
  const script = { scenes: [scene(1, "The jeweller shows the hallmark with a magnifier, looks at the father", ['Jeweller: "ये 22 कैरेट, हॉलमार्क वाला है।"'])] };
  const without = cg.buildComplianceReport(ctxFor("Jewellery & Accessories"), script);
  assert.ok(ids(without).includes("J-purity"));
  assert.equal(without.checklist.find((c) => c.id === "gated_claims_proof").status, "fail");
  const withProof = cg.buildComplianceReport(ctxFor("Jewellery & Accessories", { categoryCompliance: { proof: { bis_hallmark: true } } }), script);
  assert.ok(!ids(withProof).includes("J-purity"));
  // multi-select proof: only the ticked claim is unlocked
  const sweets = { scenes: [scene(1, "Halwai with gloves packs kalakand into a box", ['Halwai: "देसी घी की मिठाई, बिना प्रिज़र्वेटिव।"'])] };
  const ghee = ctxFor("Sweets, Bakery & Restaurant", { categoryCompliance: { proof: { food_claims: ["pure_ghee"] } } });
  assert.deepEqual(ids(cg.buildComplianceReport(ghee, sweets)), ["D-preservatives"]);
  // requires_term_in: the fabric word must be one the owner listed
  const saree = { scenes: [scene(1, "Asha holds up a cotton saree for Meena", ['Asha: "ये pure cotton है, और ये khadi।"'])] };
  const fashion = ctxFor("Saree, Clothing & Apparel", { categoryCompliance: { proof: { fabric_claims: "pure cotton" } } });
  const fv = cg.buildComplianceReport(fashion, saree).violations.filter((v) => v.id === "F-fabric").map((v) => cg.normText(v.match));
  assert.deepEqual(fv, ["khadi"]);
  // client helper flags the empty required proof
  assert.deepEqual(client.missingRequiredProof([{ id: "rera_no", required: true }], { proof: {} }).map((f) => f.id), ["rera_no"]);
});

test("property ads never generate without a RERA number; the number goes in the end frame", () => {
  const noRera = ctxFor("Real Estate & Home Decor");
  assert.throws(() => cg.assertCanGenerate(noRera), (e) => e.status === 422 && e.code === "COMPLIANCE_BLOCKED" && /RERA/.test(e.message));
  assert.doesNotThrow(() => cg.assertCanGenerate(ctxFor("Real Estate & Home Decor", { categoryCompliance: { scope: "home_decor" } })));
  const withRera = ctxFor("Real Estate, Builder & Interior Designer", { categoryCompliance: { proof: { rera_no: "P52100054321" } } });
  assert.doesNotThrow(() => cg.assertCanGenerate(withRera));
  assert.deepEqual(withRera.endFrameLines, ["RERA No.: P52100054321"]);
  assert.match(cg.formatPromptBlock(withRera), /RERA No\.: P52100054321/);
});

test("default mood is enforced per category; Healthcare is calm-reassuring only", () => {
  for (const tone of ["Festive & Vibrant", "Warm & Authentic", "Direct & Problem-Solving"]) {
    const m = ctxFor("Healthcare, Clinic & Pharmacy", { brandTone: tone }).mood;
    assert.equal(m.id, "calm_reassuring", tone);
  }
  assert.equal(ctxFor("Healthcare, Clinic & Pharmacy", { brandTone: "Festive & Vibrant" }).effectiveBrandTone, "Calm-reassuring");
  // jewellery: festive-bright only in the Dhanteras/Diwali window
  assert.equal(ctxFor("Jewellery & Accessories", { brandTone: "Festive & Vibrant" }).mood.id, "warm_emotional");
  assert.equal(ctxFor("Jewellery & Accessories", { brandTone: "Festive & Vibrant", occasion: "Dhanteras" }).mood.id, "festive_bright");
  assert.equal(ctxFor("Gym, Fitness & Yoga").mood.id, "confident_energetic");
  assert.equal(ctxFor("Saree, Clothing & Apparel", { brandTone: "Festive & Vibrant" }).mood.enforced, false);
});

test("human review: High-tier always; Medium tier on its trigger; flagged before the end frame", () => {
  const plain = { scenes: [scene(1, "The owner talks to a customer at the counter", ['Owner: "आइए, बैठिए।"'])] };
  for (const t of ["Healthcare, Clinic & Pharmacy", "Jewellery & Accessories", "Education, Coaching & Tuition"]) {
    const r = cg.buildComplianceReport(ctxFor(t), plain);
    assert.equal(r.humanReview.required, true, t);
    assert.equal(r.humanReview.stage, "before_end_frame");
    assert.equal(r.checklist.find((c) => c.id === "high_tier_review").status, "flag");
  }
  assert.equal(cg.buildComplianceReport(ctxFor("Real Estate & Home Decor", { categoryCompliance: { proof: { rera_no: "X1" } } }), plain).humanReview.required, true);
  const edu = cg.buildComplianceReport(ctxFor("Education, Coaching & Tuition"), { scenes: [scene(1, "x", ['Sir: "इस साल 12 बच्चों ने पास किया।"'])] });
  assert.ok(edu.humanReview.reasons.some((r) => /Result claim/.test(r)), edu.humanReview.reasons.join(" "));
  assert.equal(cg.buildComplianceReport(ctxFor("Sweets, Bakery & Restaurant"), plain).humanReview.required, false);
  assert.equal(cg.buildComplianceReport(ctxFor("Electronics, Mobile & Appliances"), plain).humanReview.required, false);
  assert.equal(cg.buildComplianceReport(ctxFor("Electronics, Mobile & Appliances", { offer: "No-cost EMI on all phones" }), plain).humanReview.required, true, "If EMI offer");
  assert.equal(cg.buildComplianceReport(ctxFor("Gym, Fitness & Yoga", { offer: "Joining fee waived" }), plain).humanReview.required, true, "If offer");
});

test("quality-gate checklist: safety visuals and AI-weakness rules are explicit checks", () => {
  const auto = cg.buildComplianceReport(ctxFor("Automobile & Garage"), { scenes: [scene(1, "Raju rides the scooter out of the garage and waves at Sunil", ['Raju: "चलो!"'])] });
  const byId = Object.fromEntries(auto.checklist.map((c) => [c.id, c.status]));
  assert.equal(byId.safety_visuals, "fail", "rider without a helmet in the Visual");
  const fixed = cg.buildComplianceReport(ctxFor("Automobile & Garage"), { scenes: [scene(1, "Raju, wearing a helmet, rides the scooter slowly out of the garage", ['Raju: "चलो!"'])] });
  assert.equal(fixed.checklist.find((c) => c.id === "safety_visuals").status, "pass");
  const ai = cg.buildComplianceReport(ctxFor("Kirana, Grocery & Supermarket"), { scenes: [scene(1, "Close-up of fingers counting notes; the price tag on the shelf", ['Bhaiya: "लीजिए।"'])] });
  assert.equal(ai.checklist.find((c) => c.id === "ai_weakness").status, "fail");
  // the owner's logo end card is not a "logo in a generated scene"
  const endCard = cg.buildComplianceReport(ctxFor("Kirana, Grocery & Supermarket"), { scenes: ["SCENE 4 – OUTRO: Logo end card\nVisual: The brand logo on the end card\nAudio / Dialogue / Voiceover:\nNone"] });
  assert.equal(endCard.checklist.find((c) => c.id === "ai_weakness").status, "pass");
});

test("the quality gate fails a script that breaks category rules, so the repair loop fixes it", () => {
  const form = { businessName: "Sharma Sweets", ownerName: "", language: "Hindi", offer: "", specialty: "", complianceContext: ctxFor("Sweets, Bakery & Restaurant", { categoryCompliance: { proof: { veg_status: "veg" } } }) };
  const parsed = { header: { business: "x", format: "Storytelling", lens: "1", hook: "x", moment: "x" }, character1: "", character2: "", setting: "", scenes: [scene(1, "An egg tart beside the kaju katli", ['Halwai: "दूसरे नकली खोया डालते हैं।"'])], record: {} };
  const fails = runGate(parsed, form, {});
  assert.ok(fails.some((f) => /Compliance \(Sweet, Bakery & Food\): Adulteration dig/.test(f)), fails.join("\n"));
  assert.ok(fails.some((f) => /Egg or meat in a veg-shop film/.test(f)), fails.join("\n"));
});

test("rules reach every text stage prompt (brief, angles, hooks, plots, story, script, rewrite, packages, import)", async () => {
  const compliance = ctxFor("Jewellery & Accessories", { brandTone: "Festive & Vibrant" });
  const MARK = "=== CATEGORY COMPLIANCE GUARDRAILS";
  const lastPrompt = () => { const b = anthropic.bodies.at(-1); return `${typeof b.system === "string" ? b.system : JSON.stringify(b.system)}\n${typeof b.messages[0].content === "string" ? b.messages[0].content : JSON.stringify(b.messages[0].content)}`; };
  const base = { businessName: "Gupta Jewellers", businessType: "Jewellery & Accessories", brief: "Dhanteras collection", brandTone: "Festive & Vibrant", compliance };

  await understandingSpine.generateAiUnderstanding({ ...base, town: "Indore", language: "Hindi" }).catch(() => {});
  assert.ok(lastPrompt().includes(MARK), "brief / AI understanding");
  for (const [name, fn] of [
    ["directions", () => creative.generateDirections({ ...base, town: "Indore" })],
    ["hooks", () => creative.generateHooks({ ...base, direction: { title: "x" } })],
    ["plots", () => creative.generatePlots({ ...base, direction: { title: "x" }, hook: { hookLine: "x" } })],
    ["story", () => creative.generateStoryWorld({ ...base, direction: { title: "x" }, hook: { hookLine: "x" }, plot: { title: "x" } })],
    ["rewrite", () => creative.rewriteScene({ ...base, sceneText: scene(1, "x", ['A: "b"']), sceneIndex: 0, totalScenes: 4, instruction: "shorter", form: { language: "Hindi" } })],
    ["packages", () => creative.generateSimpleAdPackages({ ...base })],
    ["import", () => creative.normalizeUserScript({ ...base, rawScript: "Scene 1: a shop. Owner: hello" })],
  ]) {
    const before = anthropic.bodies.length;
    await fn().catch(() => {});
    assert.ok(anthropic.bodies.length > before, `${name} called the model`);
    const p = anthropic.bodies.slice(before).map((b) => JSON.stringify(b)).join("\n");
    assert.ok(p.includes(MARK), `${name} prompt carries the module`);
    assert.ok(p.includes("MOOD (enforced by the category): Warm-emotional"), `${name} carries the enforced mood`);
  }
  // script stage (pipeline + guided synthesis) goes through buildUserContent
  const content = buildUserContent({ businessName: "Gupta Jewellers", businessType: "Jewellery & Accessories", language: "Hindi", brandTone: "Warm-emotional", complianceContext: compliance }, { moments: [], source: "test" }, [], "2026-11-13", "write");
  assert.ok(content.at(-1).text.includes(MARK));
  assert.ok(content.at(-1).text.includes("Jewellery & Luxury"));
});

test("visual and AI-generation rules reach the render prompts sent to the video model", () => {
  const compliance = ctxFor("Automobile & Garage");
  const shot = { shotNumber: 1, framing: "Medium shot in vertical frame", primaryAction: "Raju starts the scooter.", fullVisual: "Raju starts the scooter.", cameraMovement: "static", dialogue: "None" };
  const prompt = compileShotPrompt(shot, { setting: "garage", characters: "Raju | Sunil", productPhoto: { name: "scooter.jpg" } }, { compliance, shotCount: 4 });
  assert.match(prompt, /COMPLIANCE - VISUAL & AI-GENERATION RULES \(Automobile & Garage\)/);
  assert.match(prompt, /No legible text, logos, brand packaging or price tags/);
  assert.match(prompt, /Helmets for rider and pillion/);
  assert.match(prompt, /no legible label text, logos or brand packaging/, "product reference no longer asks for brand packaging");
  const fallback = sceneForGeneration(scene(1, "Raju starts the scooter", ['Raju: "चलो"']), { setting: "garage", compliance });
  assert.match(fallback, /Avoid close-ups of fingers doing fine work/);
  assert.match(fallback, /Wheels, body shape and plates glitch/);
});

test("compliance reviewer: a separate pass that sees only the script and the category module", async () => {
  const compliance = ctxFor("Healthcare, Clinic & Pharmacy", { brief: "SECRET-BRIEF-TEXT", offer: "SECRET-OFFER" });
  const script = { setting: "A calm clinic waiting area", scenes: [scene(1, "The receptionist smiles at the father", ['Doctor: "हमारे डॉक्टर सबसे भरोसेमंद हैं, पक्का आराम मिलेगा।"'])] };
  let seen = null;
  const call = async (req) => {
    seen = req;
    return J({ verdict: "fail", violations: [{ rule: "U2", severity: "reject", scene: 1, field: "dialogue", quote: "पक्का आराम मिलेगा", why: "outcome promise", fix: "talk about availability" }, { rule: "H", severity: "review", scene: 1, field: "dialogue", quote: "हमारे डॉक्टर", why: "doctor persona", fix: "" }], mood_ok: true });
  };
  const r = await reviewer.reviewScript({ ctx: compliance, script, call });
  assert.equal(r.status, "reviewed");
  assert.equal(r.verdict, "fail");
  assert.equal(r.violations.length, 2);
  assert.ok(!JSON.stringify(seen).includes("SECRET-BRIEF-TEXT") && !JSON.stringify(seen).includes("SECRET-OFFER"), "reviewer never sees the brief or form");
  assert.ok(seen.content.includes("CATEGORY MODULE:") && seen.content.includes("SCRIPT TO REVIEW:") && seen.content.includes("पक्का आराम"));
  assert.notEqual(seen.system, undefined);
  assert.deepEqual(reviewer.reviewerFailures(r).length, 1, "only rejects go back to the writer");
  const report = cg.buildComplianceReport(compliance, script, { reviewer: r });
  assert.equal(report.passed, false);
  assert.ok(report.humanReview.reasons.some((x) => /reviewer/.test(x)));
  // fails soft and can be switched off
  assert.equal((await reviewer.reviewScript({ ctx: compliance, script, call: async () => "not json" })).status, "unavailable");
  process.env.COMPLIANCE_REVIEWER = "off";
  assert.equal((await reviewer.reviewScript({ ctx: compliance, script, call })).status, "skipped");
  delete process.env.COMPLIANCE_REVIEWER;
});

test("ideas from angle stages are annotated with their own compliance findings", () => {
  const out = cg.annotateIdeas(ctxFor("Gym, Fitness & Yoga"), [{ title: "Lose 10 kg in 30 days" }, { title: "Breathless on the stairs" }]);
  assert.ok(out[0].compliance.violations.some((v) => v.id === "G-weight-promise"));
  assert.deepEqual(out[1].compliance.violations, []);
});

test("rules can be updated in the data file without a code change", () => {
  const before = cg.buildComplianceReport(ctxFor("Kirana, Grocery & Supermarket"), { scenes: [scene(1, "x", ['Bhaiya: "Mega sale wala bhaiya"'])] });
  assert.deepEqual(ids(before), []);
  const data = JSON.parse(fs.readFileSync(RULES_COPY, "utf8"));
  data.categories.kirana.auto_reject_words.push({ id: "K-test", label: "Test term", terms: ["mega sale"] });
  fs.writeFileSync(RULES_COPY, JSON.stringify(data));
  const later = new Date(Date.now() + 5000);
  fs.utimesSync(RULES_COPY, later, later);
  const after = cg.buildComplianceReport(ctxFor("Kirana, Grocery & Supermarket"), { scenes: [scene(1, "x", ['Bhaiya: "Mega sale wala bhaiya"'])] });
  assert.deepEqual(ids(after), ["K-test"]);
  fs.copyFileSync(path.join(__dirname, "../engine/rules/categoryGuardrails.json"), RULES_COPY);
  const restored = new Date(Date.now() + 10000);
  fs.utimesSync(RULES_COPY, restored, restored);
});

// ---- API: rules endpoint, RERA block, render gate (Magnific is never reached) ----
const { app } = require("../server");
const db = require("../engine/db");
let base, server, token;
test.before(async () => {
  const u = await db.createUser({ email: "category-rules@example.com", password: "password123", name: "Rules Tester" });
  token = await db.createSession(u.id);
  await new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); });
});
test.after(() => server && server.close());
const post = async (p, body) => {
  const r = await realFetch(base + p, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};

test("API: the brief form gets the module, proof fields and mapping flags", async () => {
  const r = await realFetch(`${base}/api/compliance/category?businessType=${encodeURIComponent("Real Estate & Home Decor")}`);
  const body = await r.json();
  assert.equal(body.category.id, "real_estate");
  assert.ok(body.proofFields.some((f) => f.id === "rera_no" && f.required));
  assert.ok(body.scopeOptions.some((o) => o.id === "home_decor"));
  const pet = await (await realFetch(`${base}/api/compliance/category?businessType=${encodeURIComponent("Pet Care, Clinic & Pet Shop")}`)).json();
  assert.equal(pet.category, null);
  assert.equal(pet.mapping.status, "unmapped");
  assert.ok(pet.categoryOptions.length >= 11);
});

test("API: a property ad without a RERA number is refused at the brief and at render", async () => {
  const brief = await post("/api/creative/simple-packages", { businessName: "Sky Homes", businessType: "Real Estate & Home Decor", brief: "2BHK flats near the bus stand" });
  assert.equal(brief.status, 422);
  assert.match(brief.body.error, /RERA/);
  const run = await post("/api/run", { scenes: ["Scene 1"], businessName: "Sky Homes", businessType: "Real Estate & Home Decor" });
  assert.equal(run.status, 422);
  assert.match(run.body.error, /RERA/);
});

test("API: render refuses a script that breaks the rules, and asks for human review on High-tier films", async () => {
  const bad = await post("/api/run", {
    businessName: "Gupta Jewellers", businessType: "Jewellery & Accessories",
    setting: "A town jeweller", character1: "Ramesh", character2: "Sunita",
    scenes: [scene(1, "Ramesh opens the vault; stacks of notes", ['Ramesh: "Gold always goes up — best investment!"'])],
  });
  assert.equal(bad.status, 422);
  assert.equal(bad.body.code, "COMPLIANCE_VIOLATION");
  assert.ok(bad.body.failures.some((f) => /Investment/.test(f)));
  const ok = await post("/api/run", {
    businessName: "Gupta Jewellers", businessType: "Jewellery & Accessories",
    setting: "A town jeweller with glass counters", character1: "Ramesh", character2: "Sunita",
    scenes: [scene(1, "Ramesh shows Sunita a simple pair of earrings on a velvet tray", ['Sunita: "पहली सैलरी से, अम्मा के लिए।"'])],
  });
  assert.equal(ok.status, 409);
  assert.equal(ok.body.code, "HUMAN_REVIEW_REQUIRED");
  assert.equal(ok.body.humanReview.stage, "before_end_frame");
  // re-scan endpoint used after a scene rewrite
  const scan = await post("/api/compliance/scan", { businessType: "Gym, Fitness & Yoga", scenes: [scene(1, "x", ['Coach: "10 kg in 30 days!"'])] });
  assert.equal(scan.status, 200);
  assert.ok(scan.body.compliance.violations.some((v) => v.id === "G-weight-promise"));
});

test("client wiring: proof fields on both briefs, sent with every request, and sign-off before render", () => {
  const read = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
  const app = read("src/App.jsx");
  assert.ok((app.match(/categoryCompliance: userContext\.categoryCompliance \|\| null,/g) || []).length >= 9, "brief, understanding, ideas, script, rewrite, session payload and draft");
  assert.equal((app.match(/categoryCompliance: overrideParams\?\.categoryCompliance \|\| userContext\.categoryCompliance \|\| null,/g) || []).length, 3, "all three render payloads");
  assert.equal((app.match(/startRenderRun\(runPayload, /g) || []).length, 3, "every render goes through the human-review sign-off");
  assert.ok(app.includes("HUMAN_REVIEW_REQUIRED") && app.includes("humanReview: { confirmed: true"));
  assert.ok(read("src/components/GuidedStudio.jsx").includes("<CategoryComplianceSection"));
  assert.ok(read("src/components/GuidedStudio.jsx").includes('<ComplianceReportNotice report={complianceReport}'));
  const simple = read("src/components/v2/SimpleBusinessStudio.jsx");
  assert.ok(simple.includes("<CategoryComplianceSection") && simple.includes("categoryCompliance,\n") || simple.includes("categoryCompliance,\r\n"));
  assert.ok(read("src/components/v2/ExistingScriptModal.jsx").includes("categoryCompliance,"));
  assert.match(client.humanReviewPrompt({ reasons: ["Healthcare is High tier."] }), /Healthcare is High tier\./);
  assert.deepEqual(client.normalizeCategoryCompliance({ category: "fashion", proof: { a: "", b: true, c: ["x"], d: false } }), { category: "fashion", scope: "", proof: { b: true, c: ["x"] } });
});
