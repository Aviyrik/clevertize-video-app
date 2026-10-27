const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "creative-test-"));
process.env.ANTHROPIC_API_KEY = "test";
process.env.MAGNIFIC_API_KEY = "test";
process.env.FESTIVAL_LIVE = "off";

const GOOD_SCRIPT = fs.readFileSync(path.join(__dirname, "fixtures/good-storytelling.txt"), "utf8");
const J = (o) => `@@JSON@@\n${JSON.stringify(o)}\n@@END@@`;

const realFetch = global.fetch;
let anthropicQueue = [];

global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
  if (u.startsWith("https://api.anthropic.com")) {
    const text = anthropicQueue.shift() || "{}";
    return json({ content: [{ type: "thinking", thinking: "..." }, { type: "text", text }], stop_reason: "end_turn" });
  }
  return realFetch(url, opts);
};

const { app } = require("../server");
const creative = require("../engine/creative");
const db = require("../engine/db");

let base, server, testToken;
test.before(async () => {
  const u = await db.createUser({ email: "creative-test@example.com", password: "password123", name: "Creative Tester" });
  testToken = await db.createSession(u.id);
  await new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); });
});
test.after(() => server.close());

test("1. performAdaptiveResearch returns structured footprint, insights, and gap question", async () => {
  anthropicQueue.push(J({
    tier: 1,
    tierLabel: "Tier 1 — Local Boutique",
    brandFootprint: "Local handcrafted jewellery store with active Instagram page",
    audienceInsight: "Young brides look for traditional craftsmanship without inflated gold making charges.",
    creativeOpportunity: "Highlight intimate family gifting moments rather than showroom pomp.",
    competitivePattern: "Big jewellers focus on celebrity bridal glamour.",
    categoryTension: "Doubt about authentic hallmarking in local stores.",
    informationGap: {
      question: "Who is the primary purchaser in this campaign?",
      options: ["Brides-to-be", "Parents gifting jewellery", "Working women buying everyday gold", "Other"],
      rationale: "Shapes the emotional dynamic between characters."
    },
    sources: ["Regional Market Analysis", "Public Footprint"]
  }));

  const res = await creative.performAdaptiveResearch({
    businessName: "Sri Meenakshi Jewellers",
    businessType: "Jewellery Showroom",
    town: "Madurai",
    websiteUrl: "https://meenakshijewellers.com",
    brief: "Showcase lightweight bridal jewellery collection"
  });

  assert.strictEqual(res.tier, 1);
  assert.match(res.tierLabel, /Tier 1/);
  assert.ok(res.audienceInsight.includes("Young brides"));
  assert.ok(res.informationGap);
  assert.strictEqual(res.informationGap.options.length, 4);
});

test("2. generateDirections returns 3-5 creative territories with exactly one recommended", async () => {
  anthropicQueue.push(J({
    directions: [
      { id: "dir-1", title: "The Family Heirloom Secret", concept: "A mother shares a secret about where the family gold comes from.", angle: "Emotional Heritage", recommended: true },
      { id: "dir-2", title: "Last Minute Wedding Panic", concept: "Bride notices missing matching earrings two hours before the muhurtham.", angle: "High Stakes Relatable", recommended: false },
      { id: "dir-3", title: "The Honest Goldsmith", concept: "Showcasing transparent hallmark testing and zero making charges.", angle: "Radical Transparency", recommended: false }
    ]
  }));

  const res = await creative.generateDirections({
    businessName: "Sri Meenakshi Jewellers",
    businessType: "Jewellery Showroom",
    town: "Madurai",
    brief: "Bridal jewellery",
    research: { audienceInsight: "Honest craftsmanship matters." }
  });

  assert.strictEqual(res.length, 3);
  assert.strictEqual(res[0].recommended, true);
  assert.strictEqual(res[1].recommended, false);
});

test("3. generateHooks returns multi-archetype hooks spanning Verbal, Visual, Curiosity, and Problem", async () => {
  anthropicQueue.push(J({
    hooks: [
      { id: "hook-1", type: "Problem", text: "शादी से दो घंटे पहले पता चला कि झुमके मैच नहीं कर रहे!", archetypes: ["Problem", "Relatable Panic"], recommended: true },
      { id: "hook-2", type: "Curiosity", text: "पुराने सुनार ये एक बात आपको कभी नहीं बताएंगे...", archetypes: ["Curiosity", "Insider"], recommended: false },
      { id: "hook-3", type: "Visual", text: "Camera swoops into a vintage velvet jewellery box opening with a satisfying click.", archetypes: ["Visual", "Sensory"], recommended: false },
      { id: "hook-4", type: "Verbal", text: "माँ, ये असली सोने का हार है या सिर्फ दिखाने के लिए?", archetypes: ["Verbal", "Dialogue"], recommended: false },
      { id: "hook-5", type: "Creator / UGC", text: "POV: You find bridal jewellery under ₹50,000 that looks like a royal heirloom.", archetypes: ["Creator / UGC"], recommended: false }
    ]
  }));

  const res = await creative.generateHooks({
    businessName: "Sri Meenakshi Jewellers",
    businessType: "Jewellery Showroom",
    brief: "Bridal collection",
    direction: { title: "The Family Heirloom Secret" }
  });

  assert.ok(res.length >= 5);
  assert.ok(res.some((h) => h.type === "Problem"));
  assert.ok(res.some((h) => h.type === "Visual"));
});

test("4. generatePlots returns structured plot cards with core idea, hook, conflict, and payoff", async () => {
  anthropicQueue.push(J({
    plots: [
      {
        id: "plot-1",
        title: "The Surprise Exchange",
        coreIdea: "A daughter surprises her mother with matching bangles.",
        hook: "Maa thinks the jewellery was too expensive until daughter shows the bill.",
        conflict: "Mother hesitates accepting what looks like luxury heirloom jewellery.",
        payoff: "Sri Meenakshi's transparent pricing makes family luxury affordable.",
        recommended: true
      },
      {
        id: "plot-2",
        title: "The Fitting Room Truth",
        coreIdea: "Two sisters comparing bridal sets.",
        hook: "Didi reveals she bought hers from Sri Meenakshi with zero hidden charges.",
        conflict: "Fear of getting cheated on making charges.",
        payoff: "Complete hallmarking guarantee and weight receipt.",
        recommended: false
      }
    ]
  }));

  const res = await creative.generatePlots({
    businessName: "Sri Meenakshi Jewellers",
    businessType: "Jewellery Showroom",
    brief: "Bridal collection",
    direction: { title: "The Family Heirloom Secret" },
    hook: { text: "शादी से दो घंटे पहले!" }
  });

  assert.strictEqual(res.length, 2);
  assert.ok(res[0].coreIdea);
  assert.ok(res[0].conflict);
  assert.ok(res[0].payoff);
});

test("5. generateStoryWorld establishes continuous setting, 2 characters, and 4 beats", async () => {
  anthropicQueue.push(J({
    format: "Storytelling",
    beats: [
      { beat: 1, name: "The Hook", description: "Mother examines bridal set anxiously in the living room" },
      { beat: 2, name: "The Friction", description: "Daughter hands over the invoice with a smile" },
      { beat: 3, name: "The Turn / Product", description: "Mother checks the 100% BIS hallmark seal" },
      { beat: 4, name: "The Payoff", description: "Warm hug and ready for wedding celebration" }
    ],
    characters: {
      character1: "Lakshmi (mother) — 52, female, traditional kanjivaram saree, warm maternal expression.",
      character2: "Ananya (daughter) — 24, female, pastel lehenga, modern confident smile."
    },
    setting: "A traditional South Indian living room in Madurai, morning sunlight streaming through wooden windows with brass lamp in background."
  }));

  const res = await creative.generateStoryWorld({
    businessName: "Sri Meenakshi Jewellers",
    businessType: "Jewellery Showroom",
    town: "Madurai",
    brief: "Bridal jewellery",
    direction: { title: "The Family Heirloom Secret" },
    hook: { text: "शादी से दो घंटे पहले!" },
    plot: { title: "The Surprise Exchange" }
  });

  assert.strictEqual(res.beats.length, 4);
  assert.ok(res.characters.character1.includes("Lakshmi"));
  assert.ok(res.setting.includes("Madurai"));
});

test("6. synthesizeMasterScript synthesizes script, validates quality gate, and compiles shot spec", async () => {
  anthropicQueue.push(GOOD_SCRIPT);

  const res = await creative.synthesizeMasterScript({
    form: {
      businessName: "Ramesh Kirana",
      businessType: "Kirana Store",
      town: "Indore",
      language: "Hindi",
      resolvedProduct: "Sabudana & Pooja Essentials"
    },
    creativeDNA: {
      direction: { title: "Everyday Frustration" },
      hook: { text: "अरे, व्रत का साबूदाना ख़त्म!" },
      plot: { title: "The Navratri Emergency" },
      format: "Storytelling"
    },
    constraints: ["Keep natural Hindi dialogue", "Must show fresh packaging"],
    avoid: ["No heavy corporate slogans"]
  });

  assert.ok(res.script);
  assert.ok(res.shotSpec);
  assert.strictEqual(res.scenes.length, 4);
  assert.ok(res.shotSpec.shots.length === 4);
  assert.ok(res.shotSpec.staticWorld.setting);
});

test("7. rewriteScene rewrites a targeted scene preserving continuous room and characters", async () => {
  const revisedScene = `SCENE 2 (0:04 - 0:08)
Visual: Same setting: Ramesh behind the wooden counter in Palasia, Indore. Sunita leans over the counter with an amused smile.
Animation Elements: Camera pulls in slightly to a medium close-up on Sunita, eye-line direct to Ramesh.
Audio / Dialogue / Voiceover:
Sunita: "रमेश जी, आज तो सारा साबूदाना ख़त्म ही मिलेगा क्या?"
Ramesh: "भाभी जी, नवरात्री का स्पेशल पैकेट अभी ताज़ा मँगवाया है!"
Sound Design: Rustle of clean plastic packet, soft afternoon shop ambience.
Editing Notes: Cut smoothly on packet handover.`;

  anthropicQueue.push(revisedScene);

  const res = await creative.rewriteScene({
    sceneText: `SCENE 2\nVisual: Same setting\nAudio:\nSunita: "Hello"\nRamesh: "Namaste"`,
    sceneIndex: 1,
    totalScenes: 4,
    instruction: "Make the dialogue playful and mention Navratri special packet",
    form: { language: "Hindi" },
    characters: "Ramesh and Sunita",
    setting: "A small neighbourhood kirana in Palasia, Indore"
  });

  assert.ok(res.includes("SCENE 2"));
  assert.ok(res.includes("Same setting"));
  assert.ok(res.includes("Sunita:"));
});

test("8. End-to-end API: /api/research endpoint handles request and returns JSON", async () => {
  anthropicQueue.push(J({
    tier: 2,
    tierLabel: "Tier 2 — Established Regional Brand",
    brandFootprint: "Established chain of organic cafes in Bangalore",
    audienceInsight: "Tech professionals want quick gut-friendly meals without sugar crashes.",
    creativeOpportunity: "Contrast midday post-lunch lethargy with high clean energy.",
    competitivePattern: "Focus on aesthetic plating pictures on social media.",
    categoryTension: "Fear that healthy food is bland or overpriced.",
    informationGap: null,
    sources: ["Brand Footprint Analysis"]
  }));

  // Unauthenticated request must be rejected with 401
  const unauthRes = await fetch(`${base}/api/research`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ businessName: "GreenRoot Organics", brief: "bowl" })
  });
  assert.strictEqual(unauthRes.status, 401);

  const res = await fetch(`${base}/api/research`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${testToken}`
    },
    body: JSON.stringify({
      businessName: "GreenRoot Organics",
      businessType: "Organic Cafe",
      town: "Bangalore",
      brief: "Launch cold-pressed energy bowls"
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.tier, 2);
  assert.ok(data.audienceInsight.includes("Tech professionals"));
});

test("9. generateHooks and generatePlots default to English and handle neutral language", async () => {
  // Test fallback returns English dialogue when no language or English is specified
  const hooks = await creative.generateHooks({
    businessName: "Urban Brew",
    businessType: "Coffee Shop",
    brief: "Promote cold brew",
    language: "English"
  });

  assert.ok(hooks.length >= 4);
  assert.strictEqual(hooks[0].hookLine, "Wait, did you run out of this again?");
  // Confirm NO Devanagari in English hook line
  assert.strictEqual(/[\u0900-\u097F]/.test(hooks[0].hookLine), false);

  const plots = await creative.generatePlots({
    businessName: "Urban Brew",
    businessType: "Coffee Shop",
    brief: "Promote cold brew",
    format: "Product Demo",
    language: "English"
  });

  assert.ok(plots.length >= 3);
  assert.strictEqual(plots[0].title, "THE LAST-MINUTE RESCUE");
});

test("10. synthesizeMasterScript sets shotSpec.format correctly based on chosen format", async () => {
  anthropicQueue.push(GOOD_SCRIPT);

  const res = await creative.synthesizeMasterScript({
    form: {
      businessName: "Ramesh Kirana",
      businessType: "Kirana Store",
      town: "Indore",
      language: "Hindi",
      resolvedProduct: "Sabudana & Pooja Essentials",
      duration: "15s",
      platform: "Instagram Reels / 9:16",
      creativeStyle: "Storytelling"
    },
    creativeDNA: {
      direction: { title: "Everyday Frustration" },
      hook: { hookLine: "अरे, व्रत का साबूदाना ख़त्म!", visualAction: "Looking at empty shelf" },
      plot: { title: "The Navratri Emergency", coreIdea: "Customer finds fresh sabudana", conflictBeat: "Late evening rush", payoffBeat: "Reliable store owner delivers" },
      story: { format: "Storytelling" },
    }
  });

  assert.strictEqual(res.shotSpec.format, "Storytelling");
  assert.strictEqual(res.record.format, "Storytelling");
});

test("11. Exact bug scenario: Kanti Sweets, Siliguri, festival brief without language defaults to English hooks", async () => {
  // Scenario from user: Brand Kanti Sweets, City Siliguri, Category Sweet Shop, festival brief.
  // When no language is selected: MUST default to English (zero Devanagari).
  const hooks = await creative.generateHooks({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop / Bakery / Mithai",
    brief: "Announce special festival gift boxes and same-day delivery for corporate orders",
    direction: { title: "Everyday Relatable" },
    // Notice: NO language passed (or undefined)
  });

  assert.ok(hooks.length >= 4);
  for (const h of hooks) {
    // Assert absolutely NO Devanagari script in the English fallback hook line
    assert.strictEqual(/[\u0900-\u097F]/.test(h.hookLine), false, `Expected English but found Devanagari in: ${h.hookLine}`);
  }
  assert.strictEqual(hooks[0].hookLine, "Wait, did you run out of this again?");
});

test("12. Canonical language selection generates Hindi, Hinglish, and Marathi hooks accordingly", async () => {
  // 1) Hindi
  const hindiHooks = await creative.generateHooks({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop / Bakery / Mithai",
    brief: "Announce special festival gift boxes and same-day delivery for corporate orders",
    language: "Hindi",
  });
  assert.strictEqual(hindiHooks[0].hookLine, "अरे, ये फिर से ख़त्म हो गया?!");
  assert.ok(/[\u0900-\u097F]/.test(hindiHooks[0].hookLine));

  // 2) Hinglish
  const hinglishHooks = await creative.generateHooks({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop / Bakery / Mithai",
    brief: "Announce special festival gift boxes and same-day delivery for corporate orders",
    language: "Hinglish",
  });
  assert.ok(/[\u0900-\u097F]/.test(hinglishHooks[0].hookLine));

  // 3) Marathi
  const marathiHooks = await creative.generateHooks({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop / Bakery / Mithai",
    brief: "Announce special festival gift boxes and same-day delivery for corporate orders",
    language: "Marathi",
  });
  assert.strictEqual(marathiHooks[0].hookLine, "अरे, हे पुन्हा संपले की काय?!");
  assert.ok(/[\u0900-\u097F]/.test(marathiHooks[0].hookLine));
});

test("13. Quality gate rejects Devanagari dialogue when film language is English", () => {
  const { runGate } = require("../engine/gate");
  const { parseOutput } = require("../engine/parse");

  // Script with Hindi dialogue when form says English
  const scriptWithHindi = GOOD_SCRIPT.replace("Sure Ramesh, give me five minutes.", "हाँ रमेश, मुझे पाँच मिनट दीजिए।");
  const parsed = parseOutput(scriptWithHindi);
  const fails = runGate(parsed, {
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop",
    town: "Indore",
    language: "English",
  });

  assert.ok(fails.some(f => f.includes("dialogue contains Devanagari script — film language is English")));
});

test("14. generateStoryWorld generates concise brief-anchored beats under 35 words", async () => {
  const brief = "Show fresh pure desi ghee sweets being packed into premium festive gift hampers";
  const ugcWorld = await creative.generateStoryWorld({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop / Bakery / Mithai",
    brief,
    format: "UGC / Creator-style",
    language: "English",
  });

  assert.strictEqual(ugcWorld.format, "UGC / Creator-style");
  assert.strictEqual(ugcWorld.beats.length, 4);
  assert.ok(ugcWorld.product.toLowerCase().includes("sweets") || ugcWorld.product.toLowerCase().includes("hampers"));

  // Check word counts of all beats (must be concise, not a screenplay)
  for (const beat of ugcWorld.beats) {
    const wordCount = beat.action.split(/\s+/).length;
    assert.ok(wordCount <= 35, `Beat action "${beat.action}" exceeds 35 words (count: ${wordCount})`);
    assert.ok(beat.timing, `Beat ${beat.beat} missing timing indicator`);
  }
});

test("15. Switching formats (UGC -> Demo -> Comedy -> Storytelling) produces distinct format-specific beats", async () => {
  const brief = "Show fresh pure desi ghee sweets being packed into premium festive gift hampers";

  const ugc = await creative.generateStoryWorld({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop",
    brief,
    format: "UGC / Creator-style",
    language: "English",
  });
  const demo = await creative.generateStoryWorld({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop",
    brief,
    format: "Product Demo",
    language: "English",
  });
  const comedy = await creative.generateStoryWorld({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop",
    brief,
    format: "Situational Comedy",
    language: "English",
  });

  // UGC focuses on direct-to-camera/creator
  assert.ok(ugc.beats[0].action.toLowerCase().includes("camera") || ugc.beats[0].action.toLowerCase().includes("lead"));
  // Product Demo focuses on sensory demonstration and unboxing
  assert.ok(demo.beats[1].action.toLowerCase().includes("demonstration") || demo.beats[0].action.toLowerCase().includes("focus"));
  // Comedy focuses on playful sneak/dilemma
  assert.ok(comedy.beats[0].action.toLowerCase().includes("sneak") || comedy.beats[1].action.toLowerCase().includes("caught"));
});



test("16. generateSimpleAdPackages produces 3 distinct ad packages with 4 scenes and Annex-A script text", async () => {
  const result = await creative.generateSimpleAdPackages({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop",
    town: "Indore",
    brief: "Flat 20% discount on fresh Kaju Katli for Diwali",
    language: "English",
    creativeStyle: "UGC / Creator-style",
  });

  assert.ok(Array.isArray(result), "Expected an array of packages");
  assert.strictEqual(result.length, 3, "Expected exactly 3 packages");

  // Verify first package (Problem & Relief)
  const p1 = result[0];
  assert.strictEqual(p1.id, "pkg_problem_relief");
  assert.ok(p1.title);
  assert.ok(p1.hook);
  assert.strictEqual(p1.scenes.length, 4, "Must have exactly 4 scenes");
  assert.ok(p1.fullScriptText.includes("SCENE 1"));
  assert.ok(p1.fullScriptText.includes("SCENE 4"));
  assert.ok(p1.fullScriptText.includes("Kanti Sweets"));

  // Verify package 2 (Customer Trust)
  const p2 = result[1];
  assert.strictEqual(p2.id, "pkg_customer_trust");
  assert.strictEqual(p2.scenes.length, 4);

  // Verify package 3 (Limited-Time Offer)
  const p3 = result[2];
  assert.strictEqual(p3.id, "pkg_festive_offer");
  assert.strictEqual(p3.scenes.length, 4);
});

test("17. /api/creative/simple-packages endpoint generates ad packages and validates brief", async () => {
  // Unauthenticated request must be rejected with 401
  const unauthRes = await fetch(`${base}/api/creative/simple-packages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ businessName: "Kanti Sweets", brief: "test" })
  });
  assert.strictEqual(unauthRes.status, 401);

  // Test validation error if brief missing (authenticated)
  const badRes = await fetch(`${base}/api/creative/simple-packages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${testToken}`
    },
    body: JSON.stringify({ businessName: "Kanti Sweets", brief: "" })
  });
  assert.strictEqual(badRes.status, 400);
  const badData = await badRes.json();
  assert.ok(badData.error.includes("Brief is required"));

  // Test successful generation
  const res = await fetch(`${base}/api/creative/simple-packages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${testToken}`
    },
    body: JSON.stringify({
      businessName: "Kanti Sweets",
      businessType: "Sweet Shop",
      town: "Indore",
      brief: "Diwali 20% discount",
      language: "English",
      creativeStyle: "UGC / Creator-style"
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.packages));
  assert.strictEqual(data.packages.length, 3);
  assert.strictEqual(data.packages[0].scenes.length, 4);
});


test("18. generateSimpleAdPackages grounds Jewellery brand in gold/hallmark and forbids service/consultation terms", async () => {
  const result = await creative.generateSimpleAdPackages({
    businessName: "Kalyan Jewellers",
    businessType: "Jewellery and Accessories",
    town: "Bangalore",
    brief: "Festive 0% making charges on 22K gold and diamond jewellery",
    language: "English",
    creativeStyle: "UGC / Creator-style",
  });

  assert.ok(Array.isArray(result));
  assert.strictEqual(result.length, 3);

  const allScriptText = result.map(p => p.fullScriptText + " " + p.hook + " " + p.title).join(" ").toLowerCase();

  // Must contain authentic jewellery terms
  assert.ok(
    allScriptText.includes("hallmark") || allScriptText.includes("gold") || allScriptText.includes("jewellery") || allScriptText.includes("diamond"),
    "Should contain authentic jewellery terms"
  );

  // Must NEVER contain service/mechanic/consultation terms
  assert.strictEqual(allScriptText.includes("free consultation"), false, "Must not contain 'free consultation'");
  assert.strictEqual(allScriptText.includes("bad service"), false, "Must not contain 'bad service'");
  assert.strictEqual(allScriptText.includes("technician"), false, "Must not contain 'technician'");
  assert.strictEqual(allScriptText.includes("repairs"), false, "Must not contain 'repairs'");
  assert.strictEqual(allScriptText.includes("maintenance"), false, "Must not contain 'maintenance'");
});

test("19. All 4 'How should it feel?' options (Product Demo, Funny, Story, UGC) are mapped end-to-end", async () => {
  // Test 1: Product Demo directions
  const demoDirs = await creative.generateDirections({
    businessName: "DJI Mic Mini TX",
    businessType: "Electronics",
    brief: "Ultra-compact wireless microphone for creators with crystal clear sound",
    format: "Product Demo",
  });
  assert.ok(Array.isArray(demoDirs) && demoDirs.length >= 3);
  const demoText = JSON.stringify(demoDirs).toLowerCase();
  assert.ok(demoText.includes("test") || demoText.includes("proof") || demoText.includes("tactile") || demoText.includes("showcase") || demoText.includes("demo"));

  // Test 2: Situational Comedy directions
  const comedyDirs = await creative.generateDirections({
    businessName: "DJI Mic Mini TX",
    businessType: "Electronics",
    brief: "Ultra-compact wireless microphone",
    format: "Situational Comedy",
  });
  assert.ok(Array.isArray(comedyDirs) && comedyDirs.length >= 3);
  const comedyText = JSON.stringify(comedyDirs).toLowerCase();
  assert.ok(comedyText.includes("misunderstanding") || comedyText.includes("struggle") || comedyText.includes("challenge") || comedyText.includes("humor") || comedyText.includes("comic"));

  // Test 3: Storytelling directions
  const storyDirs = await creative.generateDirections({
    businessName: "DJI Mic Mini TX",
    businessType: "Electronics",
    brief: "Ultra-compact wireless microphone",
    format: "Storytelling",
  });
  assert.ok(Array.isArray(storyDirs) && storyDirs.length >= 3);
  const storyText = JSON.stringify(storyDirs).toLowerCase();
  assert.ok(storyText.includes("assistance") || storyText.includes("secret") || storyText.includes("rescue") || storyText.includes("dilemma") || storyText.includes("bond"));

  // Test 4: UGC directions
  const ugcDirs = await creative.generateDirections({
    businessName: "DJI Mic Mini TX",
    businessType: "Electronics",
    brief: "Ultra-compact wireless microphone",
    format: "UGC / Creator-style",
  });
  assert.ok(Array.isArray(ugcDirs) && ugcDirs.length >= 3);
  const ugcText = JSON.stringify(ugcDirs).toLowerCase();
  assert.ok(ugcText.includes("creator") || ugcText.includes("moment") || ugcText.includes("discovery") || ugcText.includes("secret") || ugcText.includes("relatable"));

  // Test 5: gate.js allows Product Demo format and verifies formatMatches
  const { runGate, formatMatches } = require("../engine/gate");
  assert.strictEqual(formatMatches("Product Demo", "Product Demo"), true);
  assert.strictEqual(formatMatches("Product Demo", "Demo"), true);
  assert.strictEqual(formatMatches("Situational Comedy", "Comedy"), true);
  assert.strictEqual(formatMatches("UGC / Creator-style", "UGC"), true);

  const GOOD = fs.readFileSync(path.join(__dirname, "fixtures/good-storytelling.txt"), "utf8");
  const demoFixture = GOOD.replace("Format: Storytelling", "Format: Product Demo");
  const { parseOutput } = require("../engine/parse");
  const parsedDemo = parseOutput(demoFixture);
  const gateResult = runGate(parsedDemo, { businessName: "Sharma General Store", businessType: "Kirana / general store", town: "Indore", language: "Hindi" }, { approvedFormat: "Product Demo" });
  assert.strictEqual(gateResult.length, 0, "Product Demo should pass the quality gate cleanly");
});

test("20. Storytelling format enforces third-person cinematic perspective and bans selfie/vlog camera", async () => {
  const { sceneForGeneration } = require("../engine/parse");
  const { compileShotPrompt } = require("../engine/compiler");

  // Verify sceneForGeneration enforces 3rd person and bans selfie when format is Story
  const storyPrompt = sceneForGeneration("Visual: Same setting: Two characters speak.", {
    format: "Storytelling",
    setting: "Gym floor",
    character1: "Member",
    character2: "Trainer",
  });
  assert.ok(storyPrompt.includes("Objective third-person cinematic camera"), "Must specify third-person camera for Story");
  assert.ok(storyPrompt.includes("NOT hold phones"), "Must explicitly forbid holding phones for Story");

  // Verify compiler.js enforces storytelling camera
  const compiled = compileShotPrompt(
    { framing: "Medium shot", primaryAction: "A speaks to B.", fullVisual: "A speaks to B.", cameraMovement: "steady", dialogue: "None" },
    { setting: "Gym floor", characters: "Member | Trainer", style: "Storytelling" },
    { format: "Storytelling" }
  );
  assert.ok(compiled.includes("STRICT STORYTELLING CAM"), "Shot prompt compiler must include strict storytelling camera rule");
  assert.ok(compiled.includes("DO NOT hold smartphones"), "Shot prompt compiler must forbid holding smartphones");
});

test("21. Language Selection & Validation: Hinglish, Hindi, Kannada, Tamil, Telugu, and Fallback Preservation", async () => {
  const { validateHookLine, validateHooksList } = creative;

  // 1. Validator unit checks
  assert.strictEqual(validateHookLine("Wait, ये फिर से ख़त्म हो गया?!", "Hinglish").valid, true);
  assert.strictEqual(validateHookLine("Wait, did you run out of this again?", "Hinglish").valid, false); // pure english fails Hinglish
  assert.strictEqual(validateHookLine("ನೋಡಿ — ಇದು ಮತ್ತೆ ಮುಗಿದುಹೋಯ್ತಾ?!", "Hinglish").valid, false); // Kannada fails Hinglish
  assert.strictEqual(validateHookLine("ನೋಡಿ — ಇದು ಮತ್ತೆ ಮುಗಿದುಹೋಯ್ತಾ?!", "Kannada").valid, true);
  assert.strictEqual(validateHookLine("Wait, did you run out of this again?", "Kannada").valid, false);
  assert.strictEqual(validateHookLine("நில்லுங்கள் — இது மறுபடியும் தீர்ந்துவிட்டதா?!", "Tamil").valid, true);
  assert.strictEqual(validateHookLine("ఆగండి — ఇది మళ్లీ అయిపోయిందా?!", "Telugu").valid, true);
  assert.strictEqual(validateHookLine("Wait, did you run out of this again?", "English").valid, true);
  assert.strictEqual(validateHookLine("Wait, ये फिर से ख़त्म हो गया?!", "English").valid, false); // Devanagari fails English

  // 2. Practo located in Bangalore / India with Hinglish selected -> zero Kannada/Tamil/Telugu, pure Devanagari mixed
  const practoHinglish = await creative.generateHooks({
    businessName: "Practo",
    businessType: "Healthcare / Clinic",
    brief: "Consult top doctors online in 10 minutes",
    language: "Hinglish",
    direction: { town: "Bangalore, India", title: "Instant Doctor Consultation" }
  });
  assert.ok(practoHinglish.length >= 4);
  for (const h of practoHinglish) {
    const text = h.hookLine || h.text;
    assert.ok(/[\u0900-\u097F]/.test(text), `Expected Devanagari in Hinglish hook: ${text}`);
    assert.strictEqual(/[\u0C80-\u0CFF]/.test(text), false, `Kannada leaked into Hinglish hook: ${text}`);
    assert.strictEqual(/[\u0B80-\u0BFF]/.test(text), false, `Tamil leaked into Hinglish hook: ${text}`);
    assert.strictEqual(/[\u0C00-\u0C7F]/.test(text), false, `Telugu leaked into Hinglish hook: ${text}`);
  }

  // 3. Bengaluru-based brand with Hinglish selected: zero Kannada script
  const blrHinglish = await creative.generateHooks({
    businessName: "Bengaluru Fitness Club",
    businessType: "Gym / Fitness Center",
    brief: "Personal training sessions with diet coaching",
    language: "Hinglish",
    direction: { town: "Bengaluru, Karnataka" }
  });
  assert.ok(blrHinglish.length >= 4);
  for (const h of blrHinglish) {
    const text = h.hookLine || h.text;
    assert.strictEqual(/[\u0C80-\u0CFF]/.test(text), false, `Kannada script found in Bangalore Hinglish hook: ${text}`);
    assert.ok(/[\u0900-\u097F]/.test(text), `Devanagari expected in Hinglish hook: ${text}`);
  }

  // 4. Hindi selected: Devanagari output, zero Dravidian scripts
  const hindiHooks = await creative.generateHooks({
    businessName: "Practo",
    language: "Hindi"
  });
  assert.ok(hindiHooks.length >= 4);
  for (const h of hindiHooks) {
    const text = h.hookLine || h.text;
    assert.ok(/[\u0900-\u097F]/.test(text), `Expected Devanagari in Hindi hook: ${text}`);
    assert.strictEqual(/[\u0C80-\u0CFF]/.test(text), false);
    assert.strictEqual(/[\u0B80-\u0BFF]/.test(text), false);
    assert.strictEqual(/[\u0C00-\u0C7F]/.test(text), false);
  }

  // 5. Kannada selected: Kannada script output
  const kannadaHooks = await creative.generateHooks({
    businessName: "Practo",
    language: "Kannada"
  });
  assert.ok(kannadaHooks.length >= 4);
  assert.ok(/[\u0C80-\u0CFF]/.test(kannadaHooks[0].hookLine));

  // 6. Tamil selected: Tamil script output
  const tamilHooks = await creative.generateHooks({
    businessName: "Practo",
    language: "Tamil"
  });
  assert.ok(tamilHooks.length >= 4);
  assert.ok(/[\u0B80-\u0BFF]/.test(tamilHooks[0].hookLine));

  // 7. Telugu selected: Telugu script output
  const teluguHooks = await creative.generateHooks({
    businessName: "Practo",
    language: "Telugu"
  });
  assert.ok(teluguHooks.length >= 4);
  assert.ok(/[\u0C00-\u0C7F]/.test(teluguHooks[0].hookLine));

  // 8. Missing language value: defaults to English (no Indian scripts)
  const missingLangHooks = await creative.generateHooks({
    businessName: "Practo",
    brief: "Instant consult"
  });
  assert.ok(missingLangHooks.length >= 4);
  assert.strictEqual(/[\u0900-\u0D7F]/.test(missingLangHooks[0].hookLine), false);

  // 9. Retry behavior: invalid AI output triggers retry, successful on second attempt
  anthropicQueue.push(J({
    hooks: [
      { id: "h1", archetype: "Problem", hookLine: "ಇದು ತಪ್ಪು — ನೋಡಿ!", recommended: true }, // Invalid Kannada for Hinglish
      { id: "h2", archetype: "Curiosity", hookLine: "ಕೇವಲ 3 ಸೆಕೆಂಡುಗಳಲ್ಲಿ...", recommended: false }
    ]
  }));
  anthropicQueue.push(J({
    hooks: [
      { id: "h1", archetype: "Problem", hookLine: "Wait, डॉक्टर की अपॉइंटमेंट इतनी जल्दी?!", recommended: true }, // Valid Hinglish
      { id: "h2", archetype: "Curiosity", hookLine: "90% लोग डॉक्टर कंसल्टेशन में ये गलती करते हैं।", recommended: false },
      { id: "h3", archetype: "Creator / UGC", hookLine: "अगर आपको तुरंत प्रिस्क्रिप्शन चाहिए, तो ये तरीका जान लीजिए।", recommended: false },
      { id: "h4", archetype: "Visual", hookLine: "रुको, ये लक्षण इग्नोर मत करना!", recommended: false },
      { id: "h5", archetype: "Proof", hookLine: "सिर्फ 10 minutes में वेरीफाइड डॉक्टर से बात कीजिए।", recommended: false }
    ]
  }));
  const retrySuccess = await creative.generateHooks({
    businessName: "Practo",
    language: "Hinglish"
  });
  assert.ok(retrySuccess.length >= 4);
  assert.strictEqual(retrySuccess[0].hookLine, "Wait, डॉक्टर की अपॉइंटमेंट इतनी जल्दी?!");

  // 10. Retry exhaustion: all attempts invalid -> falls back safely to verified Hinglish fallback
  anthropicQueue.push(J({ hooks: [{ id: "bad1", hookLine: "ಕನ್ನಡ ವಾಕ್ಯ 1" }] }));
  anthropicQueue.push(J({ hooks: [{ id: "bad2", hookLine: "ಕನ್ನಡ ವಾಕ್ಯ 2" }] }));
  anthropicQueue.push(J({ hooks: [{ id: "bad3", hookLine: "ಕನ್ನಡ ವಾಕ್ಯ 3" }] }));
  const fallbackHooks = await creative.generateHooks({
    businessName: "Practo",
    language: "Hinglish"
  });
  assert.ok(fallbackHooks.length >= 4);
  assert.ok(/[\u0900-\u097F]/.test(fallbackHooks[0].hookLine));
  assert.strictEqual(/[\u0C80-\u0CFF]/.test(fallbackHooks[0].hookLine), false);

  // 11. Downstream preservation: generateDirections includes language
  const dirs = await creative.generateDirections({
    businessName: "Practo",
    language: "Hinglish"
  });
  assert.ok(Array.isArray(dirs) && dirs.length >= 3);

  // 12. Downstream preservation: Story World preserves language
  const storyWorld = await creative.generateStoryWorld({
    businessName: "Practo",
    language: "Hinglish",
    brief: "Consult doctor on phone"
  });
  assert.ok(storyWorld.beats.length === 4);
});

test("22. End-to-end API: /api/creative/directions and /api/creative/hooks preserve selected language", async () => {
  // Unauthenticated requests must be rejected with 401
  const unauthDir = await fetch(`${base}/api/creative/directions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ businessName: "Practo", brief: "test" })
  });
  assert.strictEqual(unauthDir.status, 401);

  const unauthHook = await fetch(`${base}/api/creative/hooks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ businessName: "Practo", brief: "test" })
  });
  assert.strictEqual(unauthHook.status, 401);

  // Test /api/creative/directions accepts and forwards language
  const dirRes = await fetch(`${base}/api/creative/directions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${testToken}`
    },
    body: JSON.stringify({
      businessName: "Practo",
      businessType: "Healthcare / Clinic",
      brief: "Consult top doctors online",
      language: "Hinglish"
    })
  });
  assert.strictEqual(dirRes.status, 200);
  const dirData = await dirRes.json();
  assert.ok(Array.isArray(dirData) && dirData.length >= 3);

  // Test /api/creative/hooks returns Hinglish hooks with zero Kannada
  const hookRes = await fetch(`${base}/api/creative/hooks`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${testToken}`
    },
    body: JSON.stringify({
      businessName: "Practo",
      businessType: "Healthcare / Clinic",
      brief: "Consult top doctors online",
      language: "Hinglish",
      direction: { town: "Bangalore, India", title: "Instant Doctor Consultation" }
    })
  });
  assert.strictEqual(hookRes.status, 200);
  const hookData = await hookRes.json();
  assert.ok(Array.isArray(hookData) && hookData.length >= 4);
  for (const h of hookData) {
    const text = h.hookLine || h.text;
    assert.ok(/[\u0900-\u097F]/.test(text));
    assert.strictEqual(/[\u0C80-\u0CFF]/.test(text), false);
  }
});
