const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { parseOutput, sceneForGeneration, dialogueOf } = require("../engine/parse");
const { runGate } = require("../engine/gate");
const {
  findVideoUrl,
  mapInputs,
  explicitInputs,
  validateMagnificRequest,
  sanitizePayloadForLogging,
  TRANSPARENT_PNG_FALLBACK,
} = require("../engine/magnific");
const { withDaysUntil } = require("../engine/festivals");
const { buildSystem, buildUserContent } = require("../engine/prompt");

const GOOD = fs.readFileSync(path.join(__dirname, "fixtures/good-storytelling.txt"), "utf8");
const FORM = {
  businessName: "Sharma General Store", businessType: "Kirana / general store", town: "Indore", language: "Hindi",
  area: "Palasia", specialty: "Fresh stock, home delivery in 20 minutes", offer: "", contact: "", ownerName: "Ramesh",
};

test("parses all parts of a good output", () => {
  const p = parseOutput(GOOD);
  assert.equal(p.header.format, "Storytelling");
  assert.equal(p.scenes.length, 4);
  assert.match(p.character1, /^Ramesh/);
  assert.equal(p.record.hook_pattern, "Everyday crisis");
  assert.equal(dialogueOf(p.scenes[2]).lines.length, 2);
});

test("good output passes the gate", () => {
  assert.deepEqual(runGate(parseOutput(GOOD), FORM), []);
});

test("gate catches Roman-letter Hindi, VO, invented price and superlatives", () => {
  const bad = GOOD
    .replace('Sunita: "अरे, व्रत का साबूदाना ख़त्म!"', 'Sunita: "Arre, vrat ka sabudana khatam!"')
    .replace('Ramesh: "आइए भाभी जी, ताज़ा साबूदाना आज ही आया है।"', 'VO: "सबसे सस्ता साबूदाना, सिर्फ़ ₹40 में"');
  const f = runGate(parseOutput(bad), FORM);
  assert.ok(f.some((x) => /Roman letters/.test(x)), "roman");
  assert.ok(f.some((x) => /VO-led is switched off/.test(x)), "vo");
  assert.ok(f.some((x) => /सबसे सस्ता/.test(x)), "superlative");
  assert.ok(f.some((x) => /Price/.test(x)), "price");
});

test("gate allows a price and 'free' the owner wrote", () => {
  const withOffer = GOOD.replace('Ramesh: "बस एक कॉल कीजिए, बीस मिनट में घर पर।"', 'Ramesh: "पूजा किट सिर्फ़ ₹199 में, डिलीवरी free।"');
  const f = runGate(parseOutput(withOffer), { ...FORM, offer: "Puja kit ₹199, free delivery" });
  assert.deepEqual(f.filter((x) => /Price|Claim/.test(x)), []);
});

test("gate catches structure problems", () => {
  const bad = GOOD.replace(/• Text overlay: none/, "• Text overlay: 'Fresh stock'").replace(/@@CHARACTER2@@[\s\S]*?@@SETTING@@/, "@@CHARACTER2@@\nNONE\n@@SETTING@@");
  const f = runGate(parseOutput(bad), FORM);
  assert.ok(f.some((x) => /Text overlay/.test(x)));
  assert.ok(f.some((x) => /CHARACTER2 is empty/.test(x)));
});

test("gate enforces 4 scenes, max 2 lines per character, no word cap, approved format", () => {
  const p = parseOutput(GOOD);
  const three = { ...p, scenes: p.scenes.slice(0, 3) };
  assert.ok(runGate(three, FORM).some((x) => /exactly 4/.test(x)));
  const twoLines = GOOD.replace('Sunita: "अरे, व्रत का साबूदाना ख़त्म!"', 'Sunita: "अरे, व्रत का साबूदाना ख़त्म!"\nSunita: "अब क्या करूँ?"');
  assert.deepEqual(runGate(parseOutput(twoLines), FORM), []);
  const threeLines = GOOD.replace('Sunita: "अरे, व्रत का साबूदाना ख़त्म!"', 'Sunita: "अरे!"\nSunita: "व्रत का साबूदाना ख़त्म!"\nSunita: "अब क्या करूँ?"');
  assert.ok(runGate(parseOutput(threeLines), FORM).some((x) => /max 2 per character/.test(x)));
  const long = GOOD.replace('Sunita: "अरे, व्रत का साबूदाना ख़त्म!"', 'Sunita: "अरे आज तो व्रत का साबूदाना भी पूरा का पूरा ख़त्म हो गया"');
  assert.deepEqual(runGate(parseOutput(long), FORM), []);
  assert.ok(runGate(p, FORM, { approvedFormat: "UGC" }).some((x) => /owner-approved format/.test(x)));
});

test("gate rejects two locations and multi-person characters", () => {
  const two = GOOD.replace(/@@SETTING@@\n[^\n]+/, "@@SETTING@@\nTwo locations. Location A (Scene 1): a modest Patna home sitting room, early evening, warm lamp. Location B (Scenes 2–4): a compact electronics shop with bright LED strips.");
  const f = runGate(parseOutput(two), FORM);
  assert.ok(f.some((x) => /more than one location/.test(x)));
  const pair = GOOD.replace("Sunita (customer) — 38", "Sunita and her son (customers) — 38");
  assert.ok(runGate(parseOutput(pair), FORM).some((x) => /more than one person/.test(x)));
});

test("Hinglish: English words must be Devanagari; owner-typed names may stay Roman", () => {
  const H = { ...FORM, language: "Hinglish", businessName: "Mamta Electronics", specialty: "Samsung and Redmi phones", offer: "" };
  const g = GOOD.replace('Ramesh: "आइए भाभी जी, ताज़ा साबूदाना आज ही आया है।"', 'Ramesh: "Mamta Electronics में Samsung का फ़ोन आया है।"');
  assert.deepEqual(runGate(parseOutput(g), H).filter((x) => /Roman/.test(x)), []);
  const bad = GOOD.replace('Ramesh: "आइए भाभी जी, ताज़ा साबूदाना आज ही आया है।"', 'Ramesh: "home delivery फ़्री है भाभी जी।"');
  assert.ok(runGate(parseOutput(bad), H).some((x) => /डिलीवरी/.test(x)));
});

test("gate keeps the setting continuous across scenes", () => {
  const noAnchor = GOOD.replace("Same setting: medium shot across the counter. ", "");
  assert.ok(runGate(parseOutput(noAnchor), FORM).some((x) => /Scene 2 Visual must start with "Same setting:"/.test(x)));
  const night = GOOD.replace("Same setting: close two-shot at the counter.", "Same setting: close two-shot at the counter, late at night.");
  assert.ok(runGate(parseOutput(night), FORM).some((x) => /time of day to "night"/.test(x)));
});

test("every scene sent to Magnific carries the identical setting and characters", () => {
  const p = parseOutput(GOOD);
  const sent = p.scenes.map((s) => sceneForGeneration(s, { setting: p.setting, character1: p.character1, character2: p.character2 }));
  const firstLine = (x) => x.split("\n")[0];
  assert.ok(sent.every((x) => firstLine(x) === firstLine(sent[0])));
  assert.match(sent[3], /^SETTING — IDENTICAL IN EVERY SCENE.*small neighbourhood kirana in Palasia/);
  assert.match(sent[3], /CHARACTERS — SAME LOOK AND CLOTHES IN EVERY SCENE: Ramesh \(owner\)/);
  assert.doesNotMatch(sent[0], /UIs needed/);
});

test("gate: dynamic camera and eye-line rules", () => {
  const same = GOOD.replace(/• Camera: [^\n]+/g, "• Camera: static medium shot");
  const f1 = runGate(parseOutput(same), FORM);
  assert.ok(f1.some((x) => /at least 3 different camera setups/.test(x)));
  assert.ok(f1.some((x) => /same camera setup/.test(x)));
  const noLook = GOOD.replace("He looks at Sunita as he turns the scale display towards her.", "He turns the scale display around.");
  assert.ok(runGate(parseOutput(noLook), FORM).some((x) => /Scene 2 has dialogue between the two characters/.test(x)));
  const stare = GOOD.replace("Sunita looks at Ramesh and nods.", "Sunita stares into the distance and nods.");
  assert.ok(runGate(parseOutput(stare), FORM).some((x) => /staring off/.test(x)));
});

test("generation text carries the eye-line and camera instructions", () => {
  const s = sceneForGeneration(parseOutput(GOOD).scenes[1], { setting: "x shop", character1: "A", character2: "B" });
  assert.match(s, /PERFORMANCE: lively, natural, upbeat acting/);
  assert.match(s, /When the characters speak to each other they look at each other/);
  assert.match(s, /CAMERA: follow this scene's camera direction/);
});

test("gate: middle-class look and festival decor in the setting", () => {
  const p = parseOutput(GOOD);
  const shabby = { ...p, setting: p.setting.replace("freshly painted walls", "dingy walls with peeling paint") };
  assert.ok(runGate(shabby, FORM).some((x) => /run-down/.test(x)));
  const lux = { ...p, setting: p.setting + " A crystal chandelier hangs over a marble counter." };
  assert.ok(runGate(lux, FORM).some((x) => /luxury/.test(x)));
  const noDecor = { ...p, setting: p.setting.replace("marigold garlands and a toran over the entrance with small brass lamps for Navratri, ", "") };
  assert.ok(runGate(noDecor, FORM).some((x) => /no Navratri .* decor/.test(x)));
  const diwali = runGate(noDecor, FORM, { festival: "Diwali" });
  assert.ok(diwali.some((x) => /no Diwali decor — add warm string\/fairy lights, lit clay diyas/.test(x)));
  const holiSet = { ...p, header: { ...p.header, moment: "everyday" }, setting: p.setting + " Bowls of gulal and pichkaris sit on the counter." };
  assert.deepEqual(runGate(holiSet, FORM, { festival: "Holi" }).filter((x) => /decor/.test(x)), []);
  assert.deepEqual(runGate({ ...p, header: { ...p.header, moment: "everyday" } }, FORM).filter((x) => /decor/.test(x)), []);
});

test("gate: story arc beats and no ad-speak", () => {
  const noBeats = GOOD.replace("SCENE 3 – TURN: Delivery promise", "SCENE 3 – Delivery promise");
  assert.ok(runGate(parseOutput(noBeats), FORM).some((x) => /Scene 3 title must be "SCENE 3 – TURN/.test(x)));
  const ad = GOOD.replace('Ramesh: "आइए भाभी जी, ताज़ा साबूदाना आज ही आया है।"', 'Ramesh: "हमारी दुकान पर पधारें, सर्वोत्तम गुणवत्ता।"');
  assert.ok(runGate(parseOutput(ad), FORM).some((x) => /ad-speak/.test(x)));
});

test("hook library puts Indian Instagram creator patterns first", () => {
  const t = buildUserContent(FORM, { source: "seed", checked: "x", moments: [] }, [], "2026-10-06", "X").at(-1).text;
  assert.ok(t.indexOf("Library: Indian Instagram creators") < t.indexOf("Library: TrueFan AI"));
  assert.match(t, /POV opener/);
  assert.match(buildSystem(), /M26 Viral, creator-native hook/);
  assert.match(buildSystem(), /Scene 3 TURN/);
  assert.match(buildSystem(), /M28 Energy and realism/);
  assert.match(buildSystem(), /M3 Tone\. Upbeat, fun/);
});

test("parseJSONBlock reads stage answers", () => {
  const { parseJSONBlock } = require("../engine/parse");
  assert.deepEqual(parseJSONBlock('noise @@JSON@@\n{"a": 1}\n@@END@@ tail'), { a: 1 });
  assert.deepEqual(parseJSONBlock('```json\n{"b": [2]}\n```'), { b: [2] });
});

test("gate enforces no-repeat against the previous record", () => {
  const prev = [{ hook_pattern: "Everyday crisis", tension: "something else" }];
  const f = runGate(parseOutput(GOOD), FORM, { previous: prev });
  assert.ok(f.some((x) => /repeats the previous/.test(x)));
});

test("romanized test mode flips the script check", () => {
  const f = runGate(parseOutput(GOOD), FORM, { scriptMode: "roman" });
  assert.ok(f.some((x) => /romanized test mode/.test(x)));
});

test("scene sent to Magnific has no music mood note or editing notes", () => {
  const s = sceneForGeneration(parseOutput(GOOD).scenes[0]);
  assert.doesNotMatch(s, /Music mood note/i);
  assert.doesNotMatch(s, /Editing Notes/i);
  assert.match(s, /SFX: two grains/);
});

test("findVideoUrl ignores images and waits for a finished status", () => {
  const running = { status: "running", steps: [{ output_url: "https://cdn.x.com/char.png" }, { output: "https://cdn.x.com/abc" }] };
  assert.equal(findVideoUrl(running, "running"), "");
  assert.equal(findVideoUrl({ result: { video: "https://cdn.x.com/final.mp4?sig=1" } }, "running"), "https://cdn.x.com/final.mp4?sig=1");
  assert.equal(findVideoUrl({ output: { video_url: "https://cdn.x.com/v/123" } }, "completed"), "https://cdn.x.com/v/123");
});

test("mapInputs reports required inputs it could not fill", () => {
  const spec = [
    { id: "a", label: "Scenes", type: "list", required: true },
    { id: "b", label: "Character 1", required: true },
    { id: "c", label: "Character 2", required: true },
    { id: "d", label: "Setting", required: true },
    { id: "e", label: "Product", type: "image", required: true },
  ];
  const r = mapInputs(spec, { scenes: ["s"], character1: "x", character2: "y", setting: "z", productDataUrl: null });
  assert.deepEqual(Object.keys(r.inputs), ["a", "b", "c", "d"]);
  assert.deepEqual(r.missing, ["Product"]);
});

test("mapInputs: product -> poduct, logo -> images, never swapped", () => {
  const spec = [
    { id: "scenes_2", label: "Scenes", type: "list", required: true },
    { id: "character_1_2", label: "Character 1", required: true },
    { id: "character_2_2", label: "Character 2", required: true },
    { id: "setting_2", label: "Setting", required: true },
    { id: "poduct", label: "produ", type: "image", required: true },
    { id: "images", label: "logo", type: "image", required: false },
  ];
  const base = { scenes: ["s"], character1: "x", character2: "y", setting: "z" };
  const both = mapInputs(spec, { ...base, productDataUrl: "data:P", logoDataUrl: "data:L" });
  assert.equal(both.inputs.poduct, "data:P");
  assert.equal(both.inputs.images, "data:L");
  assert.deepEqual(both.missing, []);
  const logoOnly = mapInputs(spec, { ...base, logoDataUrl: "data:L" });
  assert.equal(logoOnly.inputs.images, "data:L");
  assert.equal(logoOnly.inputs.poduct, undefined);
  assert.deepEqual(logoOnly.missing, ["produ"]);
  const unlabeled = mapInputs(spec.map((i) => ({ ...i, label: "" })), { ...base, productDataUrl: "data:P", logoDataUrl: "data:L" });
  assert.equal(unlabeled.inputs.images, "data:L");
  assert.equal(unlabeled.inputs.poduct, "data:P");
});

test("festival days_until is computed in code and window-limited", () => {
  const m = withDaysUntil([
    { name: "Past", start: "2026-09-01", end: "2026-09-02" },
    { name: "Ongoing", start: "2026-10-01", end: "2026-10-10" },
    { name: "Soon", start: "2026-10-20" },
    { name: "Far", start: "2026-12-25" },
  ], "2026-10-05");
  assert.deepEqual(m.map((x) => [x.name, x.days_until, x.ongoing]), [["Ongoing", 0, true], ["Soon", 15, false]]);
});

test("prompt fills the script rule and labels images", () => {
  assert.match(buildSystem("devanagari"), /EVERY spoken line is written fully in Devanagari/);
  assert.match(buildSystem(), /SPOKEN DIALOGUE only/);
  assert.match(buildSystem(), /plain, simple English \(the dashboard's language/);
  assert.match(buildSystem(), /Exactly 4 scenes/);
  assert.match(buildSystem(), /M18a Changes/);
  assert.match(buildSystem("roman"), /TEST MODE/);
  assert.doesNotMatch(buildSystem(), /\{\{SCRIPT_RULE\}\}/);
  const c = buildUserContent({ ...FORM, shopPhoto: { mime: "image/jpeg", data: "AAA" } }, { source: "seed", checked: "x", moments: [] }, [], "2026-10-05", "STAGE X");
  assert.match(c.at(-1).text, /STAGE X$/);
  assert.equal(c[0].type, "text"); assert.match(c[0].text, /SHOP PHOTO/);
  assert.equal(c[1].type, "image");
});

// =========================================================================
// SECTION 12 TEST SCENARIOS (A - K)
// =========================================================================

test("A: text-only brand + brief without product photo populates required product slot with fallback", () => {
  const inputs = explicitInputs({
    scenes: ["Scene 1", "Scene 2"],
    character1: "Priya",
    character2: "Rahul",
    setting: "Modern Kitchen",
    product: "Modular Kitchen Cabinets",
  });
  assert.ok(inputs.poduct, "poduct slot must be populated");
  assert.equal(inputs.poduct, TRANSPARENT_PNG_FALLBACK);
  assert.equal(inputs.character_1_2, "Priya");
  assert.equal(inputs.setting_2, "Modern Kitchen");
});

test("B: explicit product image uploaded populates product slot directly with image data URL", () => {
  const customDataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
  const inputs = explicitInputs({
    scenes: ["Scene 1"],
    character1: "Priya",
    character2: "Rahul",
    setting: "Kitchen",
    product: "Modular Kitchen",
    productDataUrl: customDataUrl,
  });
  assert.equal(inputs.poduct, customDataUrl);
});

test("C: brand with only service description populates product slot", () => {
  const inputs = explicitInputs({
    scenes: ["Scene 1"],
    character1: "Dr. Mehta",
    character2: "Patient",
    setting: "Dental Clinic",
    product: "Dental consultation and teeth whitening service",
  });
  assert.ok(inputs.poduct);
  assert.equal(inputs.poduct, TRANSPARENT_PNG_FALLBACK);
});

test("D: empty product with no fallback fails pre-flight validation immediately", () => {
  assert.throws(
    () => {
      validateMagnificRequest({
        scenes: ["Scene 1"],
        character1: "Priya",
        setting: "Store",
        product: "",
        productName: "",
        specialty: "",
        brief: "",
      });
    },
    /missing product or service information/
  );
});

test("E: preflight validation passes on valid payload before network calls", () => {
  const valid = validateMagnificRequest({
    scenes: ["Scene 1: Hook", "Scene 2: Build"],
    character1: "Priya, 30s homemaker",
    setting: "Bright contemporary Bangalore apartment kitchen",
    product: "Livspace modular kitchen solution",
  });
  assert.equal(valid, true);
});

test("F: payload logging redacts base64 images and displays clean summary", () => {
  const testPayload = {
    scenes_2: ["Scene 1", "Scene 2"],
    character_1_2: "Priya",
    setting_2: "Kitchen",
    poduct: TRANSPARENT_PNG_FALLBACK,
    images: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA==",
  };
  const sanitized = sanitizePayloadForLogging(testPayload);
  assert.equal(sanitized.character_1_2, "Priya");
  assert.match(sanitized.poduct, /^\[image\/png data URL \(\d+ KB\)\]$/);
  assert.match(sanitized.images, /^\[image\/png data URL \(\d+ KB\)\]$/);
  assert.match(sanitized.scenes_2, /^\[Array\(2\)/);
});

test("G: user-friendly error message generated when brief/product is unresolvable", () => {
  try {
    validateMagnificRequest(
      {
        scenes: ["Scene 1"],
        character1: "Priya",
        setting: "Kitchen",
        product: "",
      },
      { userFacing: true }
    );
    assert.fail("Should have thrown error");
  } catch (err) {
    assert.match(err.message, /We need a little more information before generating this video/);
    assert.doesNotMatch(err.message, /JSON|endpoint|poduct/i);
  }
});

test("H: preflight catches empty scenes or missing setting immediately", () => {
  assert.throws(
    () => {
      validateMagnificRequest({
        scenes: [],
        character1: "Priya",
        setting: "Kitchen",
        product: "Sweets",
      });
    },
    /scenes/
  );

  assert.throws(
    () => {
      validateMagnificRequest({
        scenes: ["Scene 1"],
        character1: "Priya",
        setting: "",
        product: "Sweets",
      });
    },
    /setting or location/
  );
});

test("I: buildUserContent without town marks brand as universal / location-independent", () => {
  const { buildUserContent } = require("../engine/prompt");
  const content = buildUserContent(
    {
      businessName: "Global Kitchens",
      businessType: "Modular Kitchen",
      town: "",
      language: "English",
    },
    { source: "seed", checked: "x", moments: [] },
    [],
    "2026-10-08",
    "direction"
  );
  const text = content.map((c) => c.text).join("\n");
  assert.match(text, /Universal brand/);
  assert.match(text, /video production does not depend on any specific city/);
});

test("J: buildUserContent with town provides optional contextual guide without force-fitting", () => {
  const { buildUserContent } = require("../engine/prompt");
  const content = buildUserContent(
    {
      businessName: "Kanti Sweets",
      businessType: "Sweet shop",
      town: "Bangalore",
      language: "Hindi",
    },
    { source: "seed", checked: "x", moments: [] },
    [],
    "2026-10-08",
    "direction"
  );
  const text = content.map((c) => c.text).join("\n");
  assert.match(text, /Bangalore/);
  assert.match(text, /DO NOT force-fit city names/);
});

