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
let lastAnthropicBody = null;

global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
  if (u.startsWith("https://api.anthropic.com")) {
    if (opts.body) {
      try { lastAnthropicBody = JSON.parse(opts.body); } catch (_) {}
    }
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

test("23. normalizeUserScript fast-path: already-structured valid Annex-A script is not rewritten", async () => {
  const { normalizeUserScript } = require("../engine/creative");

  const res = await normalizeUserScript({
    rawScript: GOOD_SCRIPT,
    businessName: "Sharma General Store",
    businessType: "Kirana / general store",
    town: "Indore",
    language: "Hindi",
    creativeStyle: "Storytelling",
  });

  assert.strictEqual(res.status, "success");
  assert.strictEqual(res.passedGate, true);
  assert.strictEqual(res.isAlreadyNormalized, true, "Must flag as already normalized without redundant AI rewrite");
  assert.strictEqual(res.scenes.length, 4);
  assert.ok(res.shotSpec, "Must compile shot specification for valid script");
  assert.strictEqual(res.shotSpec.shots.length, 4);
});

test("24. normalizeUserScript adapts plain-text user script into 4 scenes and preserves dialogue, claims, and CTA", async () => {
  const { normalizeUserScript } = require("../engine/creative");
  const rawUserText = `Come to Palasia Dental Clinic this week for free checkups!
Dr. Amit checks your teeth with painless digital scanner.
Get 50% discount on laser cleaning until Sunday.
Call 9876543210 or visit palasiadental.com now!`;

  const res = await normalizeUserScript({
    rawScript: rawUserText,
    businessName: "Palasia Dental Clinic",
    businessType: "Healthcare / Clinic",
    town: "Indore",
    language: "English",
    creativeStyle: "UGC / Creator-style",
    brief: "Dental checkup and cleaning offer",
  });

  assert.strictEqual(res.status, "success");
  assert.strictEqual(res.totalScenes, 4);
  assert.strictEqual(res.scenes.length, 4);
  assert.ok(res.character1, "Must establish Character 1");
  assert.ok(res.character2, "Must establish Character 2");
  assert.ok(res.setting, "Must establish continuous Setting");
  assert.ok(res.shotSpec, "Must compile shotSpec from normalized script");
  assert.strictEqual(res.shotSpec.shots.length, 4);

  // Verify dialogue and claims preservation
  const combinedText = res.scenes.join("\n");
  assert.ok(
    combinedText.includes("Palasia Dental Clinic") || combinedText.includes("Dental") || combinedText.includes("checkup"),
    "Must preserve brand and clinical offering"
  );
  assert.ok(
    res.scenes.every((s) => s.includes("Visual:") && s.includes("Audio / Dialogue / Voiceover:")),
    "Every scene must have visual and dialogue blocks"
  );
});

test("25. normalizeUserScript rejects empty or whitespace-only script content", async () => {
  const { normalizeUserScript } = require("../engine/creative");
  await assert.rejects(
    async () => {
      await normalizeUserScript({ rawScript: "   ", businessName: "Test Store" });
    },
    /Script content is required/i
  );
});

test("26. B-03: fallbackNormalizeScript handles short/one-line script safely without placeholder dialogue", async () => {
  const { normalizeUserScript } = require("../engine/creative");
  const shortScript = "Visit Apex Footwear on MG Road this weekend for 50% discount on sports shoes! Call 9876543210 today.";

  const res = await normalizeUserScript({
    rawScript: shortScript,
    businessName: "Apex Footwear",
    businessType: "Footwear & Shoes",
    town: "Indore",
    language: "English",
    creativeStyle: "UGC / Creator-style",
  });

  assert.strictEqual(res.status, "success");
  assert.strictEqual(res.scenes.length, 4);

  const fullText = res.scenes.join("\n");
  // Must NOT contain placeholder text like "Scene 2 action for Apex Footwear" or "narrative and dialogue"
  assert.ok(!fullText.includes("Scene 2 action"), "Must not invent placeholder 'Scene 2 action'");
  assert.ok(!fullText.includes("Scene 3 action"), "Must not invent placeholder 'Scene 3 action'");
  assert.ok(!fullText.includes("narrative and dialogue"), "Must not invent placeholder dialogue");

  // Must preserve user's real claims and CTA
  assert.ok(fullText.includes("Apex Footwear"), "Must preserve brand name");
  assert.ok(fullText.includes("50% discount") || fullText.includes("sports shoes"), "Must preserve product claim");
  assert.ok(fullText.includes("9876543210"), "Must preserve user CTA");

  // Middle beats without allocated dialogue must be visual action with natural ambient audio
  assert.ok(res.scenes[1].includes("(None - visual demonstration") || res.scenes[1].includes("natural room tone"), "Middle beat must be visual action");
});

test("27. B-03: normalizeUserScript rejects scripts too brief to infer creative details with clear actionable error", async () => {
  const { normalizeUserScript } = require("../engine/creative");
  await assert.rejects(
    async () => {
      await normalizeUserScript({ rawScript: "Buy shoes.", businessName: "Apex" });
    },
    /Script content is too brief/i
  );
});

test("28. Brand Tone Guidance: getBrandToneGuidance maps all 4 tones correctly and prompt.js injects BRAND_TONE", () => {
  const { getBrandToneGuidance, BRAND_TONE_GUIDANCE } = require("../engine/creative");
  const { buildUserContent } = require("../engine/prompt");

  assert.strictEqual(getBrandToneGuidance("Warm & Authentic"), BRAND_TONE_GUIDANCE.warm);
  assert.strictEqual(getBrandToneGuidance("Festive & Vibrant"), BRAND_TONE_GUIDANCE.festive);
  assert.strictEqual(getBrandToneGuidance("Premium & Elegant"), BRAND_TONE_GUIDANCE.premium);
  assert.strictEqual(getBrandToneGuidance("Direct & Problem-Solving"), BRAND_TONE_GUIDANCE.direct);

  // Case-insensitive / partial match checks
  assert.strictEqual(getBrandToneGuidance("luxury premium vibes"), BRAND_TONE_GUIDANCE.premium);
  assert.strictEqual(getBrandToneGuidance("celebration festive mood"), BRAND_TONE_GUIDANCE.festive);
  assert.strictEqual(getBrandToneGuidance("clear problem solving"), BRAND_TONE_GUIDANCE.direct);
  assert.strictEqual(getBrandToneGuidance(null), BRAND_TONE_GUIDANCE.warm);
  assert.strictEqual(getBrandToneGuidance(""), BRAND_TONE_GUIDANCE.warm);

  // Test buildUserContent in engine/prompt.js
  const testForm = {
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop",
    language: "English",
    brandTone: "Festive & Vibrant",
  };
  const mockFest = { moments: [], source: "test", checked: "today" };
  const promptArr = buildUserContent(testForm, mockFest, [], "2026-10-28", "TEST STAGE");
  const promptText = promptArr.map((p) => (typeof p === "string" ? p : p.text || "")).join("\n");
  assert.ok(promptText.includes("BRAND_TONE: Festive & Vibrant"), "prompt.js must contain BRAND_TONE");
  assert.ok(promptText.includes("reflect this personality"), "prompt.js must guide emotional tone and spoken cadence");
});

test("29. Brand Tone Wiring: Claude prompts in creative engine receive tone guidance", async () => {
  const {
    generateDirections,
    generateHooks,
    generatePlots,
    generateStoryWorld,
    generateSimpleAdPackages,
  } = require("../engine/creative");

  // 1. Directions
  anthropicQueue.push(J([{ id: "dir_1", title: "Festive Joy", description: "Joyful celebration", angle: "Festive", recommended: true }]));
  await generateDirections({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop",
    brandTone: "Festive & Vibrant",
  });
  assert.ok(lastAnthropicBody, "Anthropic request was captured");
  assert.ok(lastAnthropicBody.system.includes("Festive & Vibrant"), "Directions system prompt must include brand tone");
  const userContentDirections = lastAnthropicBody.messages?.[0]?.content || "";
  assert.ok(userContentDirections.includes("BRAND TONE: Festive & Vibrant"), "Directions content must contain brand tone");

  // 2. Hooks
  anthropicQueue.push(J([{ id: "hook_1", archetype: "Problem", hookLine: "Wait, out of sweets again?", visualAction: "Checking box", recommended: true }]));
  await generateHooks({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop",
    brandTone: "Premium & Elegant",
    language: "English",
  });
  assert.ok(lastAnthropicBody.system.includes("Premium & Elegant"), "Hooks system prompt must include premium brand tone");
  const userContentHooks = lastAnthropicBody.messages?.[0]?.content || "";
  assert.ok(userContentHooks.includes("BRAND TONE: Premium & Elegant"), "Hooks content must contain premium brand tone");

  // 3. Plots
  anthropicQueue.push(J([{ id: "plot_1", title: "Direct Solution", coreIdea: "Problem solved fast", hookBeat: "Need", conflictBeat: "Doubt", payoffBeat: "Relief", recommended: true }]));
  await generatePlots({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop",
    brandTone: "Direct & Problem-Solving",
    language: "English",
  });
  assert.ok(lastAnthropicBody.system.includes("Direct & Problem-Solving"), "Plots system prompt must include direct tone");
  const userContentPlots = lastAnthropicBody.messages?.[0]?.content || "";
  assert.ok(userContentPlots.includes("BRAND TONE: Direct & Problem-Solving"), "Plots content must contain direct tone");

  // 4. Story World
  anthropicQueue.push(J({
    format: "UGC / Creator-style",
    product: "Kanti Sweets Gift Box",
    setting: "Sweet shop",
    beats: [
      { beat: "HOOK", timing: "0-3s", title: "Hook", action: "Opens box", dialogue: "Check this out!" },
      { beat: "BUILD", timing: "3-8s", title: "Build", action: "Shows sweets", dialogue: "Look closely." },
      { beat: "TURN", timing: "8-14s", title: "Turn", action: "Tastes sweet", dialogue: "Incredible purity." },
      { beat: "PAYOFF", timing: "14-20s", title: "Payoff", action: "Smiles at camera", dialogue: "Order today." }
    ]
  }));
  await generateStoryWorld({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop",
    brandTone: "Warm & Authentic",
    language: "English",
  });
  assert.ok(lastAnthropicBody.system.includes("Warm & Authentic"), "Story world system prompt must include warm tone");
  const userContentStory = lastAnthropicBody.messages?.[0]?.content || "";
  assert.ok(userContentStory.includes("BRAND TONE: Warm & Authentic"), "Story world content must contain warm tone");

  // 5. Simple Ad Packages
  anthropicQueue.push(J({
    packages: [
      {
        id: "pkg_1",
        badge: "Highest Converting",
        angle: "Problem & Relief",
        title: "Purity First",
        hookHeadline: "Tired of artificial sweets?",
        narrativeSummary: "A story of authentic taste",
        callToAction: "Visit Kanti Sweets today!",
        setting: "Sweet shop counter",
        characters: { lead: "Host", customer: "Customer" },
        scenes: [
          { sceneNumber: 1, beat: "Hook", timing: "0-3s", visual: "Host reveals sweets", dialogue: "Lead: Look at this." },
          { sceneNumber: 2, beat: "Build", timing: "3-8s", visual: "Host plates sweets", dialogue: "Lead: Made with pure ghee." },
          { sceneNumber: 3, beat: "Turn", timing: "8-14s", visual: "Customer tastes sweet", dialogue: "Customer: Delicious!" },
          { sceneNumber: 4, beat: "Resolution", timing: "14-20s", visual: "Host packs box", dialogue: "Lead: Visit us today!" }
        ]
      },
      {
        id: "pkg_2",
        badge: "Most Trusted",
        angle: "Customer Story & Trust",
        title: "Family Tradition",
        hookHeadline: "Why do families trust us?",
        narrativeSummary: "Family tradition",
        callToAction: "Order today!",
        setting: "Sweet shop counter",
        characters: { lead: "Host", customer: "Customer" },
        scenes: [
          { sceneNumber: 1, beat: "Hook", timing: "0-3s", visual: "Host smiles", dialogue: "Lead: Welcome!" },
          { sceneNumber: 2, beat: "Build", timing: "3-8s", visual: "Shows sweets", dialogue: "Lead: Tradition." },
          { sceneNumber: 3, beat: "Turn", timing: "8-14s", visual: "Customer smiles", dialogue: "Customer: Best in town." },
          { sceneNumber: 4, beat: "Resolution", timing: "14-20s", visual: "Happy customer", dialogue: "Lead: Thank you!" }
        ]
      },
      {
        id: "pkg_3",
        badge: "Highest Urgency",
        angle: "Limited-Time Special Offer",
        title: "Festive Box",
        hookHeadline: "Festive offer is here!",
        narrativeSummary: "Special offer",
        callToAction: "Grab yours now!",
        setting: "Sweet shop counter",
        characters: { lead: "Host", customer: "Customer" },
        scenes: [
          { sceneNumber: 1, beat: "Hook", timing: "0-3s", visual: "Host shows box", dialogue: "Lead: Special offer!" },
          { sceneNumber: 2, beat: "Build", timing: "3-8s", visual: "Offers gift box", dialogue: "Lead: Limited boxes." },
          { sceneNumber: 3, beat: "Turn", timing: "8-14s", visual: "Customer receives box", dialogue: "Customer: Great deal!" },
          { sceneNumber: 4, beat: "Resolution", timing: "14-20s", visual: "Both wave", dialogue: "Lead: Order now!" }
        ]
      }
    ]
  }));
  await generateSimpleAdPackages({
    businessName: "Kanti Sweets",
    businessType: "Sweet Shop",
    brandTone: "Festive & Vibrant",
    language: "English",
  });
  assert.ok(lastAnthropicBody.system.includes("Festive & Vibrant"), "Simple packages system prompt must include festive tone");
  const userContentPackages = lastAnthropicBody.messages?.[0]?.content || "";
  assert.ok(userContentPackages.includes("BRAND TONE: Festive & Vibrant"), "Simple packages content must contain festive tone");
});

test("30. Production Format: Selected format dictates script normalization, Quality Gate, and neural video compiler directives", async () => {
  const { normalizeUserScript } = require("../engine/creative");
  const { compileShotPrompt } = require("../engine/compiler");
  const { runGate } = require("../engine/gate");

  // 1. Script Normalization receives format directive and sets shotSpec.format
  anthropicQueue.push(`@@HEADER@@
Business: Practo
Format: Product Demo
Lens: 1, Everyday Relatability
Hook: Script Hook
Moment: Everyday
@@CHARACTER1@@
Dr. Sharma (Doctor / Consultant) — 40s, friendly demeanour
@@CHARACTER2@@
Ramesh (Patient) — 30s, working professional
@@SETTING@@
A brightly lit, modern tele-consultation room with medical desk and laptop.
@@SCENE@@
SCENE 1 – HOOK: Instant Consult
Visual:
Same setting: Ramesh taps the Practo app on phone from bed. Dr. Sharma appears clearly on screen.
Animation Elements:
• Camera: smooth motivated push-in
• Text overlay: none
• UI element: none
• Transition: cut
• Motion graphics: none
Audio / Dialogue / Voiceover:
Ramesh: "102 fever and I do not have to leave bed!"
Sound Design:
Ambience: quiet room tone.
Editing Notes:
Scene duration: ~3s
@@SCENE@@
SCENE 2 – BUILD: Doctor Advice
Visual:
Same setting: Dr. Sharma consults with Ramesh over video call. They look at each other as they speak.
Animation Elements:
• Camera: two-shot split layout
• Text overlay: none
• UI element: none
• Transition: cut
• Motion graphics: none
Audio / Dialogue / Voiceover:
Dr. Sharma: "Rest up, your prescription is sent."
Sound Design:
Ambience: gentle room tone.
Editing Notes:
Scene duration: ~4s
@@SCENE@@
SCENE 3 – TURN: Medicine Delivery
Visual:
Same setting: Ramesh receives delivery notification. They look at each other as they speak.
Animation Elements:
• Camera: close-up on verified prescription
• Text overlay: none
• UI element: none
• Transition: cut
• Motion graphics: none
Audio / Dialogue / Voiceover:
Ramesh: "Medicines arriving in 60 minutes."
Sound Design:
Ambience: chime tone.
Editing Notes:
Scene duration: ~4s
@@SCENE@@
SCENE 4 – RESOLUTION: Relief
Visual:
Same setting: Ramesh smiles with relief, resting comfortably.
Animation Elements:
• Camera: medium wide hold
• Text overlay: none
• UI element: none
• Transition: cut
• Motion graphics: none
Audio / Dialogue / Voiceover:
Ramesh: "Practo saves the day."
Sound Design:
Ambience: warm chord.
Editing Notes:
Scene duration: ~4s
@@RECORD@@
{"format":"Product Demo","characters":"Dr. Sharma & Ramesh","setting":"Consultation room"}`);

  const normResult = await normalizeUserScript({
    rawScript: "102 fever. Consult doctor without leaving bed. Book online consultation with Practo.",
    businessName: "Practo",
    businessType: "Healthcare App",
    language: "English",
    creativeStyle: "Product Demo",
  });

  assert.strictEqual(normResult.status, "success");
  assert.strictEqual(normResult.shotSpec.format, "Product Demo");
  assert.ok(lastAnthropicBody.system.includes("FORMAT DIRECTIVE (Product Demo)"), "Normalization system prompt must include Product Demo directive");
  assert.ok(lastAnthropicBody.system.includes("Physical demonstration is central"), "Must enforce physical demonstration rules");

  // 2. Video Compiler: compileShotPrompt injects distinct staging for each format
  const mockShot = {
    framing: "Medium close-up",
    primaryAction: "Host unboxes the new product.",
    fullVisual: "Host unboxes the new product with tactile focus.",
    cameraMovement: "smooth slow push-in",
    dialogue: 'Host: "Check this out!"',
  };
  const mockStatic = {
    setting: "Modern studio space",
    characters: "Host | Guest",
    businessType: "Tech",
  };

  const demoPrompt = compileShotPrompt(mockShot, mockStatic, { format: "Product Demo" });
  assert.ok(demoPrompt.includes("PRODUCT DEMO STAGING: Physical product front-and-center"), "Demo format must inject product demo staging");

  const storyPrompt = compileShotPrompt(mockShot, mockStatic, { format: "Storytelling" });
  assert.ok(storyPrompt.includes("STRICT STORYTELLING CAM: Cinematic third-person perspective only"), "Storytelling format must inject storytelling camera directive");

  const comedyPrompt = compileShotPrompt(mockShot, mockStatic, { format: "Situational Comedy" });
  assert.ok(comedyPrompt.includes("COMEDIC TIMING & EXPRESSION"), "Comedy format must inject comedy timing directive");

  const ugcPrompt = compileShotPrompt(mockShot, mockStatic, { format: "UGC / Creator-style" });
  assert.ok(ugcPrompt.includes("UGC / CREATOR STAGING: Mobile-native vertical framing"), "UGC format must inject UGC staging directive");

  // 3. Quality Gate accepts all 4 canonical formats and legacy aliases
  const dummyScript = {
    header: { business: "Practo", format: "Product Demo", lens: "1", hook: "H", moment: "M" },
    character1: "Doctor Sharma — 40s, physician with white coat and stethoscope",
    character2: "Patient Ramesh — 30s, everyday professional in casual t-shirt",
    setting: "A clean, modern, well-lit medical clinic room with desk and examination bed.",
    scenes: [
      'SCENE 1 – HOOK: Opening\nVisual:\nSame setting: Doctor looks at patient.\nAnimation Elements:\n• Camera: eye-level medium\n• Text overlay: none\n• UI element: none\n• Transition: cut\n• Motion graphics: none\nAudio / Dialogue / Voiceover:\nDoctor: "Welcome."\nSound Design:\nQuiet room tone.\nEditing Notes:\n3s',
      'SCENE 2 – BUILD: Check\nVisual:\nSame setting: Doctor checks vitals. Doctor and patient look at each other.\nAnimation Elements:\n• Camera: close-up on monitor\n• Text overlay: none\n• UI element: none\n• Transition: cut\n• Motion graphics: none\nAudio / Dialogue / Voiceover:\nPatient: "All good?"\nSound Design:\nQuiet room tone.\nEditing Notes:\n4s',
      'SCENE 3 – TURN: Result\nVisual:\nSame setting: Doctor hands prescription. They look at each other.\nAnimation Elements:\n• Camera: two-shot profile\n• Text overlay: none\n• UI element: none\n• Transition: cut\n• Motion graphics: none\nAudio / Dialogue / Voiceover:\nDoctor: "Fully recovered."\nSound Design:\nQuiet room tone.\nEditing Notes:\n4s',
      'SCENE 4 – RESOLUTION: End\nVisual:\nSame setting: Both smile. They look at each other.\nAnimation Elements:\n• Camera: gentle pull back\n• Text overlay: none\n• UI element: none\n• Transition: cut\n• Motion graphics: none\nAudio / Dialogue / Voiceover:\nPatient: "Thank you!"\nSound Design:\nQuiet room tone.\nEditing Notes:\n4s',
    ],
    record: { hook_pattern: "H", tension: "T" },
  };

  const gateResult = runGate(dummyScript, { language: "English", businessName: "Practo" }, { approvedFormat: "Product Demo" });
  assert.strictEqual(gateResult.length, 0, `Product Demo script must pass gate cleanly without errors: ${gateResult.join(", ")}`);
});

test("31. Voiceover (VO) Script Detection & Flow: handles solo subject, detects VO lines, bypasses 2-actor lip-sync", async () => {
  const { detectScriptAudioMode, normalizeUserScript } = require("../engine/creative");
  const { compileShotPrompt } = require("../engine/compiler");
  const { runGate } = require("../engine/gate");

  // 1. Audio mode detector recognizes VO-led scripts across diverse phrasing
  const practoRawScript = `1 (0–3 sec) — HOOK
TEXT + VO: "102 fever. And the doctor wants me to GET UP?!"
2 (3–6 sec) — THE PROBLEM
VO: "Get dressed. Book a cab. Travel to a clinic? No chance!"
3 (6–9 sec) — THE REALISATION
VO: "Wait. I can consult a doctor without leaving my bed!"
4 (9–14 sec) — THE SOLUTION
VO: "Book an online consultation and talk to a doctor right from home."
5 (14–18 sec) — PAYOFF + CTA
VO: "Too sick to step out? Consult a doctor in 2 minutes on Practo."`;

  assert.strictEqual(detectScriptAudioMode(practoRawScript), "voiceover", "Must detect VO-led script from VO: and TEXT + VO: markers");
  assert.strictEqual(detectScriptAudioMode('Voiceover: "Welcome to the future of banking."'), "voiceover");
  assert.strictEqual(detectScriptAudioMode('Narrator: "In a world where..."'), "voiceover");
  assert.strictEqual(detectScriptAudioMode('Rahul: "Hey, what are you doing?"\\nSneha: "Just checking this out."'), "dialogue");

  // 2. Normalization with mock LLM response adhering to VO format
  anthropicQueue.push(`@@HEADER@@
Business: Practo
Format: Storytelling
Lens: 1, Everyday Relatability
Hook: 102 fever
Moment: Bedridden sick
@@CHARACTER1@@
Patient in Bed — 20s-30s, resting unwell in comfortable clothes
@@CHARACTER2@@
None — Solo Subject / Voiceover B-Roll
@@SETTING@@
A cozy, dimly lit bedroom with warm lighting and a bedside phone stand.
@@SCENE@@
SCENE 1 – HOOK: 102 Fever
Visual:
Same setting: Patient in bed checks thermometer with exhausted expression.
Animation Elements:
• Camera: intimate close-up
• Text overlay: none
• UI element: none
• Transition: cut
• Motion graphics: none
Audio / Dialogue / Voiceover:
VO: "102 fever. And the doctor wants me to GET UP?!"
Sound Design:
Ambience: muted room tone.
Editing Notes:
Scene duration: ~3s
@@SCENE@@
SCENE 2 – BUILD: Clinic Hassle
Visual:
Same setting: Patient groans and buries face into pillow, overwhelmed by clinic travel.
Animation Elements:
• Camera: medium shot
• Text overlay: none
• UI element: none
• Transition: cut
• Motion graphics: none
Audio / Dialogue / Voiceover:
VO: "Get dressed. Book a cab. Travel to a clinic? No chance!"
Sound Design:
Ambience: quiet room tone.
Editing Notes:
Scene duration: ~3s
@@SCENE@@
SCENE 3 – TURN: Bedside Doctor
Visual:
Same setting: Patient suddenly opens Practo app on phone with sudden relief.
Animation Elements:
• Camera: close-up on phone
• Text overlay: none
• UI element: none
• Transition: cut
• Motion graphics: none
Audio / Dialogue / Voiceover:
VO: "Wait. I can consult a doctor without leaving my bed!"
Sound Design:
Ambience: subtle uplifting chime.
Editing Notes:
Scene duration: ~3s
@@SCENE@@
SCENE 4 – RESOLUTION: Consult in 2 Mins
Visual:
Same setting: Patient smiles warmly in bed, holding phone up showing consultation confirmed.
Animation Elements:
• Camera: gentle pull back
• Text overlay: none
• UI element: none
• Transition: cut
• Motion graphics: none
Audio / Dialogue / Voiceover:
VO: "Too sick to step out? Consult a doctor in 2 minutes on Practo."
Sound Design:
Ambience: warm acoustic resolution.
Editing Notes:
Scene duration: ~4s
@@RECORD@@
{"format":"Storytelling","characters":"Patient in Bed (Solo)","setting":"Cozy bedroom","audioDeliveryMode":"voiceover"}`);

  const normResult = await normalizeUserScript({
    rawScript: practoRawScript,
    businessName: "Practo",
    businessType: "Healthcare App",
    language: "English",
    creativeStyle: "Storytelling",
  });

  assert.strictEqual(normResult.status, "success");
  assert.strictEqual(normResult.audioDeliveryMode, "voiceover", "audioDeliveryMode must be voiceover");
  assert.ok(normResult.character2.includes("None") || normResult.character2.includes("Solo"), "Character 2 must be None / Solo Subject");
  assert.ok(lastAnthropicBody.system.includes("VOICEOVER / SOLO SUBJECT MODE") || lastAnthropicBody.system.includes("VOICEOVER-LED"), "LLM system prompt must contain voiceover-led directive");

  // 3. Quality Gate passes cleanly for VO script without hallucinating 2-actor requirement
  const voScript = {
    header: { business: "Practo", format: "Storytelling", lens: "1", hook: "102 fever", moment: "Bedridden sick" },
    character1: normResult.character1,
    character2: normResult.character2,
    setting: normResult.setting,
    scenes: normResult.scenes,
    record: { hook_pattern: "102 fever", tension: "Too sick to travel" },
    audioDeliveryMode: normResult.audioDeliveryMode,
  };
  const voGateErrors = runGate(voScript, { language: "English", businessName: "Practo" }, { allowVo: true, audioDeliveryMode: "voiceover" });
  assert.strictEqual(voGateErrors.length, 0, `VO script must pass Quality Gate with zero errors: ${voGateErrors.join(", ")}`);

  // 4. Video Prompt Compiler directs non-lip-sync off-screen narration
  const voShot = {
    framing: "Close-up",
    primaryAction: "Patient checks thermometer and rubs forehead",
    fullVisual: "Patient checks thermometer and rubs forehead in cozy dimly lit bedroom",
    cameraMovement: "subtle slow push-in",
    dialogue: 'VO: "102 fever. And the doctor wants me to GET UP?!"',
  };
  const voStatic = {
    setting: "Cozy dimly lit bedroom",
    characters: "Patient in Bed",
    businessType: "Healthcare App",
  };
  const compiledVO = compileShotPrompt(voShot, voStatic, { format: "Storytelling", audioDeliveryMode: "voiceover" });
  assert.ok(compiledVO.includes("AUDIO & NARRATION: Off-screen Voiceover narration"), "Must indicate off-screen Voiceover narration");
  assert.ok(compiledVO.includes("The on-screen actor does NOT lip-sync or speak to camera"), "Actor must not lip-sync to VO lines");
});

test("32. Production Format & Language Intelligence: auto-detection, Conversational format, and Product Demo image reference", async () => {
  const { detectScriptLanguage, detectScriptFormat } = require("../engine/creative");
  const { compileShotPrompt } = require("../engine/compiler");

  // 1. Language auto-detection
  assert.strictEqual(detectScriptLanguage("102 fever. Consult doctor without leaving bed."), "English");
  assert.strictEqual(detectScriptLanguage("नमस्ते, आज हमारे पास खास दिवाली ऑफर है।"), "Hindi");
  assert.strictEqual(detectScriptLanguage("Ye phone online se sasta hai bhai, offer check karo!"), "Hinglish");
  assert.strictEqual(detectScriptLanguage("हा चहा खूप छान आहे, नक्की ट्राय करा."), "Marathi");
  assert.strictEqual(detectScriptLanguage("வணக்கம், எங்கள் சிறப்பு சலுகை இன்று கிடைக்கிறது."), "Tamil");

  // 2. Format auto-detection
  const demoScript = `Visual: Host unboxes the new SmartWatch and demonstrates the heart rate monitor on screen.
Visual: Close-up on product screen showing crisp health metrics and battery percentage.`;
  assert.strictEqual(detectScriptFormat(demoScript), "Product Demo", "Demonstration and unboxing must detect as Product Demo");

  const conversationalScript = `Ramesh: "Bhaiya, is this sweet fresh?"
Shopkeeper: "Subah 6 baje bani hai, ek piece chakh ke dekhiye!"`;
  assert.strictEqual(detectScriptFormat(conversationalScript), "Conversational / Dialogue", "Two-character banter must detect as Conversational / Dialogue");

  // 3. Compiler compiles Conversational and Product Demo with product image
  const demoShot = {
    framing: "Close-up",
    primaryAction: "Host holds up product box",
    fullVisual: "Host holds up product box showcasing shiny embossed logo",
    cameraMovement: "smooth slow push-in",
    dialogue: 'VO: "Available now across India."',
  };
  const demoStatic = {
    setting: "Modern studio space",
    characters: "Host",
    businessType: "Consumer Electronics",
  };
  const compiledDemoWithImage = compileShotPrompt(demoShot, demoStatic, {
    format: "Product Demo",
    productPhoto: { name: "smartwatch-retail-box.png" },
  });
  assert.ok(compiledDemoWithImage.includes("PRODUCT DEMO STAGING: Physical product front-and-center"), "Must inject product demo staging");
  assert.ok(compiledDemoWithImage.includes('PRODUCT VISUAL REFERENCE: Render physical product matching reference photo ("smartwatch-retail-box.png")'), "Must inject product reference image directive");

  const compiledConversational = compileShotPrompt(demoShot, demoStatic, {
    format: "Conversational / Dialogue",
  });
  assert.ok(compiledConversational.includes("CONVERSATIONAL DIALOGUE STAGING"), "Must inject conversational dialogue directive");
});

test("33. Upfront Duration & Dimension Control: 20s 5-scene Practo script preservation and aspect ratio compilation", async () => {
  const { normalizeUserScript } = require("../engine/creative");
  const { compileShotPrompt } = require("../engine/compiler");
  const { runGate } = require("../engine/gate");

  // 1. Practo 5-scene commercial pasted for 20s video
  const practo5Scene = `1 (0–3 sec) — HOOK
TEXT + VO: "102 fever. And the doctor wants me to GET UP?!"
2 (3–6 sec) — THE PROBLEM
VO: "Get dressed. Book a cab. Travel to a clinic? No chance!"
3 (6–9 sec) — THE REALISATION
VO: "Wait. I can consult a doctor without leaving my bed!"
4 (9–14 sec) — THE SOLUTION
VO: "Book an online consultation and talk to a doctor right from home."
5 (14–18 sec) — PAYOFF + CTA
VO: "Too sick to step out? Consult a doctor in 2 minutes on Practo."`;

  const normResult = await normalizeUserScript({
    rawScript: practo5Scene,
    businessName: "Practo",
    businessType: "Healthcare App",
    targetDuration: "20s",
    aspectRatio: "16:9",
  });

  assert.strictEqual(normResult.status, "success");
  assert.strictEqual(normResult.totalScenes, 5, "20s commercial with 5 input scenes must preserve all 5 scenes");
  assert.strictEqual(normResult.targetDuration, "20s");
  assert.strictEqual(normResult.aspectRatio, "16:9");

  // 2. Gate validation for 20s with 5 scenes
  const gateErrors = runGate(
    {
      header: { business: "Practo", format: "Storytelling", lens: "1", hook: "102 fever", moment: "Bedridden" },
      character1: normResult.character1,
      character2: normResult.character2,
      setting: normResult.setting,
      scenes: normResult.scenes,
      record: { hook_pattern: "102 fever", tension: "Too sick to travel" },
      audioDeliveryMode: "voiceover",
    },
    { language: "English", businessName: "Practo", targetDuration: "20s" },
    { allowVo: true, audioDeliveryMode: "voiceover", targetDuration: "20s", allowSceneCount: 5 }
  );
  assert.strictEqual(gateErrors.length, 0, `5-scene 20s script must pass gate without error: ${gateErrors.join(", ")}`);

  // 3. Aspect Ratio directives compiled into prompt
  const baseShot = {
    framing: "Medium shot",
    primaryAction: "Patient rests comfortably in bed",
    fullVisual: "Same setting: Patient rests comfortably in bed, smiling at smartphone screen",
    cameraMovement: "slow horizontal drift",
    dialogue: 'VO: "Consult in 2 minutes on Practo."',
  };
  const baseStatic = {
    setting: "Sunlit cozy modern bedroom",
    characters: "Patient in Bed",
    businessType: "Healthcare App",
  };

  const widescreenPrompt = compileShotPrompt(baseShot, baseStatic, { aspectRatio: "16:9" });
  assert.ok(widescreenPrompt.includes("WIDESCREEN 16:9 COMPOSITION"), "Must specify 16:9 widescreen");

  const squarePrompt = compileShotPrompt(baseShot, baseStatic, { aspectRatio: "1:1" });
  assert.ok(squarePrompt.includes("SQUARE 1:1 COMPOSITION"), "Must specify 1:1 square");

  const verticalPrompt = compileShotPrompt(baseShot, baseStatic, { aspectRatio: "9:16" });
  assert.ok(verticalPrompt.includes("VERTICAL 9:16 COMPOSITION"), "Must specify 9:16 vertical");
});

test("Simple Studio: Upfront Dimension & Duration controls, script-first flow, and category safety", async () => {
  // 1. generateSimpleAdPackages attaches duration and aspectRatio
  const packages = await creative.generateSimpleAdPackages({
    businessName: "Voxy AI",
    businessType: "AI App",
    brief: "AI companion that helps you practice conversational skills",
    language: "English",
    duration: "15s",
    aspectRatio: "16:9",
  });

  assert.strictEqual(packages.length, 3, "Must generate exactly 3 packages");
  for (const pkg of packages) {
    assert.strictEqual(pkg.duration, "15s", "Package must retain selected duration");
    assert.strictEqual(pkg.aspectRatio, "16:9", "Package must retain selected aspectRatio");
    assert.ok(pkg.fullScriptText, "Package must have fullScriptText compiled");
  }

  // 2. SimpleBusinessStudio.jsx component contract verification
  const studioFile = fs.readFileSync(path.join(__dirname, "../src/components/v2/SimpleBusinessStudio.jsx"), "utf8");

  // Verify category ReferenceError fix
  assert.ok(
    studioFile.includes("const category = categoryProp || businessType || 'Local Business'"),
    "SimpleBusinessStudio must define category in scope to prevent ReferenceError"
  );
  assert.ok(
    studioFile.includes("<SimpleAdPackagesLoader"),
    "SimpleBusinessStudio must render SimpleAdPackagesLoader"
  );
  assert.ok(
    studioFile.includes("category={category}"),
    "SimpleBusinessStudio must pass defined category to SimpleAdPackagesLoader"
  );

  // Verify Dimension & Duration controls exist
  assert.ok(studioFile.includes("DIMENSION_OPTIONS"), "DIMENSION_OPTIONS constant must be defined");
  assert.ok(studioFile.includes("DURATION_OPTIONS"), "DURATION_OPTIONS constant must be defined");
  assert.ok(studioFile.includes("'9:16'"), "9:16 aspect ratio option must be available");
  assert.ok(studioFile.includes("'16:9'"), "16:9 aspect ratio option must be available");
  assert.ok(studioFile.includes("'1:1'"), "1:1 aspect ratio option must be available");
  assert.ok(studioFile.includes("'15s'"), "15s duration option must be available");
  assert.ok(studioFile.includes("'20s'"), "20s duration option must be available");
  assert.ok(studioFile.includes("'30s'"), "30s duration option must be available");

  // Verify script-first CTA and copy
  assert.ok(studioFile.includes("Generate 3 Ad Scripts ➔"), "Step 1 button must say Generate 3 Ad Scripts ➔");
  assert.ok(studioFile.includes("Writing 3 Ad Scripts..."), "Step 1 loading state must say Writing 3 Ad Scripts...");
  assert.ok(studioFile.includes("Choose Your Ad Script"), "Step 2 header must say Choose Your Ad Script");
  assert.ok(studioFile.includes("Produce Video for Selected Script ➔"), "Step 2 button must say Produce Video for Selected Script ➔");
  assert.ok(studioFile.includes("Choose Script"), "Step 2 progress bar label must say Choose Script");
  assert.ok(studioFile.includes("Produce Video"), "Step 3 progress bar label must say Produce Video");

  // Verify duration and aspectRatio are sent in POST and onProduceVideo
  assert.ok(studioFile.includes("duration,"), "duration must be passed in simple-packages request");
  assert.ok(studioFile.includes("aspectRatio,"), "aspectRatio must be passed in simple-packages request");
});
