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

let base, server;
test.before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
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

  const res = await fetch(`${base}/api/research`, {
    method: "POST",
    headers: { "content-type": "application/json" },
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

