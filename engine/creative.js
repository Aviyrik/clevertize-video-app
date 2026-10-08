// Clevertize Creative Intelligence Engine V2
// Houses Adaptive Research (Tier 0-3), Creative Direction, Hook Intelligence,
// Plot Generation, Story Architecture, Constraints, and Scene-Level AI Rewriting.

const { callClaude } = require("./claude");
const { buildSystem, buildUserContent, buildRepairContent, festivalOf, HOOKS_PULLED } = require("./prompt");
const { parseOutput, parseJSONBlock, dialogueOf, sceneForGeneration } = require("./parse");
const { runGate } = require("./gate");
const { compileShotSpecification } = require("./compiler");
const { getFestivals, todayIST } = require("./festivals");
const HOOKS = require("./hooks.json");

/**
 * 1. ADAPTIVE RESEARCH (Tiers 0 - 3)
 * Runs server-side. Determines public footprint tier and extracts compact insights.
 */
async function performAdaptiveResearch({ businessName, businessType, town, area, websiteUrl, brief }) {
  const brand = String(businessName || "").trim();
  const bType = String(businessType || "Retail Business").trim();
  const city = String(town || "").trim();
  const site = String(websiteUrl || "").trim();

  const system = `You are a strategic brand researcher and advertising creative director for Indian commercial video ads.
Your job is to analyze a business and output a concise, structured research summary for video creation.
Determine the public brand footprint tier:
- Tier 0: Unknown / very small micro-business (e.g. neighborhood kirana, local salon). Rely on category consumer psychology and local context. DO NOT invent fake facts.
- Tier 1: Small / local business with regional footprint or website.
- Tier 2: Established brand with recognizable products and clear customer segment.
- Tier 3: Major / national brand with extensive public advertising footprint.

Evaluate information gaps: If a critical creative driver (like audience target or post-ad action) is missing from the brief, formulate ONE high-value multiple choice question with 3-4 options + "Other".

Output strictly valid JSON between @@JSON@@ and @@END@@ markers:
@@JSON@@
{
  "tier": 0,
  "tierLabel": "Tier 0 — Local Neighborhood Business",
  "brandFootprint": "Brief description of brand presence",
  "audienceInsight": "1 crisp sentence on core buyer motivation or daily friction",
  "creativeOpportunity": "1 crisp sentence on how to stand out from typical category ads",
  "competitivePattern": "1 crisp sentence on what competitors usually do",
  "categoryTension": "1 crisp sentence on consumer hesitation or desire",
  "informationGap": {
    "question": "Single high-value question, or null if brief is already clear",
    "options": ["Option 1", "Option 2", "Option 3"],
    "rationale": "Why this question matters"
  },
  "sources": ["Category Intelligence", "Local Market Context"]
}
@@END@@`;

  const userPrompt = `BUSINESS NAME: ${brand}
CATEGORY / INDUSTRY: ${bType}
LOCATION: ${city || "Not specified"}${area ? `, ${area}` : ""}
WEBSITE: ${site || "None"}
USER BRIEF / GOAL: ${brief || "Create a high-converting commercial video"}`;

  try {
    const raw = await callClaude({
      system,
      content: userPrompt,
      maxTokens: 1500,
      thinking: false,
    });
    const parsed = parseJSONBlock(raw);
    return {
      tier: parsed.tier ?? 0,
      tierLabel: parsed.tierLabel || "Tier 0 — Category Context",
      brandFootprint: parsed.brandFootprint || `${brand} operating in ${bType}.`,
      audienceInsight: parsed.audienceInsight || "Customers seek trustworthy, high-quality local service with zero hassle.",
      creativeOpportunity: parsed.creativeOpportunity || "Focus on relatable everyday life rather than sterile corporate advertising.",
      competitivePattern: parsed.competitivePattern || "Competitors rely on generic discount announcements.",
      categoryTension: parsed.categoryTension || "Buyers hesitate when they cannot verify freshness or personalized care.",
      informationGap: parsed.informationGap && parsed.informationGap.question ? parsed.informationGap : null,
      sources: Array.isArray(parsed.sources) ? parsed.sources : ["Category Intelligence"],
    };
  } catch (err) {
    console.warn("[research] adaptive research fallback:", err.message);
    return {
      tier: 0,
      tierLabel: "Tier 0 — Category Context",
      brandFootprint: `${brand} in ${bType}.`,
      audienceInsight: "Customers look for reliability, genuine care, and authentic value.",
      creativeOpportunity: "Open with a relatable moment that stops the scroll in the first 3 seconds.",
      competitivePattern: "Most category ads push generic sales claims.",
      categoryTension: "Trust and quality assurance are the decisive factors for buyers.",
      informationGap: null,
      sources: ["Category Intelligence Seed"],
    };
  }
}

/**
 * 2. CREATIVE DIRECTION (3-5 Territories)
 */
async function generateDirections({ businessName, businessType, town, brief, research, festival }) {
  const system = `You are an executive creative director proposing 3 to 4 distinct creative territories for an Indian short-form commercial ad.
Each territory must be a clear, relatable strategic angle (e.g. "Everyday Frustration", "Unexpected Discovery", "The Secret Hack", "Relatable Household Chaos", "Cultural Pride").
Mark exactly one territory as recommended: true.

Output strictly valid JSON between @@JSON@@ and @@END@@:
@@JSON@@
[
  {
    "id": "dir_1",
    "title": "EVERYDAY FRUSTRATION",
    "description": "Turn a common customer problem into the story.",
    "angle": "Relatable friction that everyday consumers instantly recognize.",
    "recommended": true,
    "whyRecommended": "Strongest emotional hook for this category."
  },
  {
    "id": "dir_2",
    "title": "UNEXPECTED DISCOVERY",
    "description": "Start with a surprising moment that creates curiosity.",
    "angle": "Counter-intuitive reveal about what customers usually do.",
    "recommended": false
  },
  {
    "id": "dir_3",
    "title": "PRODUCT TRANSFORMATION",
    "description": "Show how the business changes a specific customer situation.",
    "angle": "Direct before-and-after contrast with emotional relief.",
    "recommended": false
  }
]
@@END@@`;

  const content = `BRAND: ${businessName} (${businessType})
TOWN: ${town || "Universal"}
BRIEF: ${brief || "Promote brand"}
AUDIENCE INSIGHT: ${research?.audienceInsight || "Everyday buyers"}
CREATIVE OPPORTUNITY: ${research?.creativeOpportunity || "Relatable problem-first story"}
UPCOMING OCCASION: ${festival?.name || "None"}`;

  try {
    const raw = await callClaude({ system, content, maxTokens: 1500, thinking: false });
    const list = parseJSONBlock(raw);
    if (Array.isArray(list) && list.length) return list;
  } catch (e) {
    console.warn("[directions] fallback:", e.message);
  }

  return [
    {
      id: "dir_1",
      title: "EVERYDAY RELATABLE MOMENT",
      description: "Center the film around a familiar daily friction that customers instantly recognize.",
      angle: "Authentic household or workplace reality with warm humor.",
      recommended: true,
      whyRecommended: "Highest audience retention for commercial video ads.",
    },
    {
      id: "dir_2",
      title: "UNEXPECTED DISCOVERY",
      description: "Open with a surprising realization that overturns common category misconceptions.",
      angle: "Curiosity-driven hook leading into the brand solution.",
      recommended: false,
    },
    {
      id: "dir_3",
      title: "THE LOCAL SECRET",
      description: "Position the business as the insider recommendation people share with friends.",
      angle: "Word-of-mouth trust and genuine community authority.",
      recommended: false,
    },
  ];
}

/**
 * 3. HOOK INTELLIGENCE (5-8 Multi-Archetype Hooks)
 */
async function generateHooks({ businessName, businessType, brief, direction, language = "English" }) {
  const isEng = !language || /eng/i.test(language);
  const system = `You are a short-form video viral hook specialist for Instagram Reels and YouTube Shorts.
Generate 5 to 7 high-impact commercial opening hooks (first 3 seconds).
Each hook must span a distinct archetype:
- Verbal (provocative question or line)
- Visual (compelling physical movement / near-mishap / intriguing object)
- Curiosity (counter-intuitive knowledge)
- Problem / Relatable Crisis (everyday urgency)
- Creator / UGC (direct to camera insider tip)
- Demonstration (instant before-and-after action)

Provide:
- archetype (name of the hook style)
- hookLine: spoken line in ${language} (${isEng ? "write natural spoken conversational English, NO Hindi" : "write in Devanagari script for Hindi/Hinglish/Marathi"})
- visualAction: vivid physical opening action in English (1-2 sentences)
- recommended: true for the top option

Return valid JSON between @@JSON@@ and @@END@@:
@@JSON@@
[
  {
    "id": "hook_1",
    "archetype": "Problem / Everyday Crisis",
    "hookLine": "...",
    "visualAction": "...",
    "angle": "Urgent household realization",
    "recommended": true
  }
]
@@END@@`;

  const content = `BRAND: ${businessName} (${businessType})
BRIEF: ${brief || "Promote brand"}
SELECTED CREATIVE DIRECTION: ${direction?.title || "Everyday Relatable"} — ${direction?.description || ""}
LANGUAGE: ${language}`;

  try {
    const raw = await callClaude({ system, content, maxTokens: 2000, thinking: false });
    let list = parseJSONBlock(raw);
    if (list && Array.isArray(list.hooks)) list = list.hooks;
    if (Array.isArray(list) && list.length) return list;
  } catch (e) {
    console.warn("[hooks] fallback:", e.message);
  }

  return [
    {
      id: "hook_1",
      archetype: "Problem / Everyday Crisis",
      hookLine: isEng ? "Wait, did you run out of this again?" : "अरे, ये फिर से ख़त्म हो गया?!",
      visualAction: "A person checks an empty container or shelf with sudden realization and turns around in urgency.",
      angle: "Everyday household panic",
      recommended: true,
    },
    {
      id: "hook_2",
      archetype: "Curiosity / Counter-Intuitive",
      hookLine: isEng ? "Most people get this completely wrong." : "ज्यादातर लोग यहाँ गलती करते हैं।",
      visualAction: "The speaker holds up two contrasting items directly to the camera lens, gesturing emphatically.",
      angle: "Knowledge gap reveal",
      recommended: false,
    },
    {
      id: "hook_3",
      archetype: "Creator / UGC Secret",
      hookLine: isEng ? "If you live in this area, you need to know this." : "अगर आप यहाँ रहते हैं, तो ये सीक्रेट जान लीजिए।",
      visualAction: "Creator leans in closely towards the phone camera with a knowing smile, pointing over their shoulder.",
      angle: "Insider recommendation",
      recommended: false,
    },
    {
      id: "hook_4",
      archetype: "Visual Action",
      hookLine: isEng ? "Stop doing this right now!" : "रुको, ये मत करना!",
      visualAction: "Hands rush in to catch a slipping product just before it hits the counter, freezing the frame.",
      angle: "Immediate motion stop",
      recommended: false,
    },
    {
      id: "hook_5",
      archetype: "Demonstration / Proof",
      hookLine: isEng ? "See the difference in literally three seconds." : "सिर्फ तीन सेकंड में असली फर्क देखिए।",
      visualAction: "Split screen action contrasting slow ordinary result with instant premium result.",
      angle: "Immediate visual proof",
      recommended: false,
    },
  ];
}

/**
 * 4. PLOT LINES (3-5 Structured Narrative Arcs)
 */
async function generatePlots({ businessName, businessType, brief, direction, hook, format = "Storytelling", language = "English" }) {
  const isEng = !language || /eng/i.test(language);
  const formatGuidelines = format === "UGC / Creator-style" || format === "UGC"
    ? "UGC / Creator format: conversational direct-to-camera or peer recommendation, instant hook in first 2 seconds, fast-paced authentic social energy."
    : format === "Product Demo"
    ? "Product Demo format: the product must be physically introduced early, tactile hands-on demonstration is central, fewer spoken lines, sensory proof."
    : format === "Situational Comedy" || format === "Comedy"
    ? "Situational Comedy format: clear humorous setup, comedic escalation, situational misunderstanding, exaggerated relatable reactions, and funny payoff."
    : "Storytelling format: dramatic character dilemma, genuine interpersonal relationship, emotional progression, and earned resolution.";

  const system = `You are a narrative screenwriter for commercial advertising.
Generate 3 distinct 4-scene narrative plot lines for a commercial video.
FORMAT INFLUENCE (${format}):
${formatGuidelines}

Each plot must have:
- title: punchy creative title
- coreIdea: 1-2 sentence narrative summary
- hookBeat: opening situation (1 short line)
- conflictBeat: how the tension deepens (1 short line)
- payoffBeat: how the brand/product resolves it delightfully (1 short line)
- recommended: boolean (mark the best one)

Return valid JSON between @@JSON@@ and @@END@@:
@@JSON@@
[
  {
    "id": "plot_1",
    "title": "THE TIMELY RESCUE",
    "coreIdea": "A customer runs into an urgent snag right before guests arrive, but finds the perfect local solution.",
    "hookBeat": "Urgent realization of missing item",
    "conflictBeat": "Other alternatives take too long or lack authenticity",
    "payoffBeat": "Quick, personal service with a warm reassuring smile",
    "recommended": true
  }
]
@@END@@`;

  const content = `BRAND: ${businessName} (${businessType})
BRIEF: ${brief || "Promote brand"}
DIRECTION: ${direction?.title || "Relatable Tension"}
CHOSEN HOOK: ${hook?.hookLine || ""} (${hook?.visualAction || ""})
LANGUAGE: ${language}`;

  try {
    const raw = await callClaude({ system, content, maxTokens: 2000, thinking: false });
    let list = parseJSONBlock(raw);
    if (list && Array.isArray(list.plots)) list = list.plots;
    if (Array.isArray(list) && list.length) return list;
  } catch (e) {
    console.warn("[plots] fallback:", e.message);
  }

  return [
    {
      id: "plot_1",
      title: "THE LAST-MINUTE RESCUE",
      coreIdea: "An everyday crisis is resolved instantly by the business's reliable, fresh personal service.",
      hookBeat: "Sudden realization of a missing essential item.",
      conflictBeat: "Generic online delivery is too slow and packaged products feel cold.",
      payoffBeat: "Walking into the shop where the owner solves it with personal attention.",
      recommended: true,
    },
    {
      id: "plot_2",
      title: "THE QUALITY COMPARISON",
      coreIdea: "A customer brings a disappointing ordinary item and discovers why authentic quality changes everything.",
      hookBeat: "Frustration with ordinary, disappointing quality.",
      conflictBeat: "Customer questions whether genuine craftsmanship still exists.",
      payoffBeat: "Direct touch-and-feel demonstration of the brand's superior standard.",
      recommended: false,
    },
    {
      id: "plot_3",
      title: "THE SMART RECOMMENDATION",
      coreIdea: "A seasoned regular customer introduces a skeptical newcomer to the neighbourhood's best-kept secret.",
      hookBeat: "Newcomer expresses doubt or confusion.",
      conflictBeat: "Regular customer demonstrates why they keep coming back.",
      payoffBeat: "Both share a delight moment over the perfect recommendation.",
      recommended: false,
    },
  ];
}

/**
 * 5. STORY & WORLD (Format, 4 Beats, Characters, Location)
 */
async function generateStoryWorld({ businessName, businessType, town, brief, direction, hook, plot, format = "Storytelling", language = "English" }) {
  const isEng = !language || /eng/i.test(language);
  const formatGuidelines = format === "UGC / Creator-style" || format === "UGC"
    ? "UGC / Creator format: conversational direct-to-camera, fast hook within 2s, peer recommendation, authentic mobile camera."
    : format === "Product Demo"
    ? "Product Demo format: the product must be physically introduced early, hands-on demonstration central, tactile textures, fewer spoken lines."
    : format === "Situational Comedy" || format === "Comedy"
    ? "Situational Comedy format: clear humorous setup, escalation, misunderstanding, witty banter, funny punchline payoff."
    : "Storytelling format: character-driven emotional dilemma, interpersonal relationship, emotional progression, earned resolution.";

  const system = `You are a film director setting up the visual world, 2 characters, and 4 story beats for a commercial film.
FORMAT INFLUENCE (${format}):
${formatGuidelines}

Requirements:
1. Exactly ONE single continuous location (Rule M13) — authentic Indian middle/upper-middle class setting.
2. Exactly TWO recurring characters with vivid appearance, clothing, and chemistry.
3. Exactly FOUR story beats: HOOK, BUILD, TURN, PAYOFF.
4. Format: ${format}.
5. Dialogue in beats: spoken in ${language} (${isEng ? "write natural spoken conversational English, NO Hindi" : "write in Devanagari script for Hindi/Hinglish/Marathi"}).

Return valid JSON between @@JSON@@ and @@END@@:
@@JSON@@
{
  "format": "${format}",
  "formatReason": "Two-character commercial chemistry provides natural, relatable persuasion.",
  "location": {
    "name": "Single Room Setting",
    "details": "Vivid description of room, lighting, counters, props, surfaces"
  },
  "character1": {
    "role": "Owner / Host",
    "name": "Ramesh",
    "age": 45,
    "appearance": "Warm wheatish skin, neat short hair, traditional modern attire",
    "personality": "Warm, trustworthy, quick with a smile"
  },
  "character2": {
    "role": "Customer / Neighbour",
    "name": "Sunita",
    "age": 36,
    "appearance": "Expressive eyes, tasteful cotton salwar or saree, cloth tote bag",
    "personality": "Practical, observant, speaks her mind"
  },
  "beats": [
    { "beat": "HOOK", "title": "Scene 1: The Hook", "action": "...", "dialogue": "..." },
    { "beat": "BUILD", "title": "Scene 2: The Build", "action": "...", "dialogue": "..." },
    { "beat": "TURN", "title": "Scene 3: The Turn", "action": "...", "dialogue": "..." },
    { "beat": "PAYOFF", "title": "Scene 4: The Payoff", "action": "...", "dialogue": "..." }
  ]
}
@@END@@`;

  const content = `BRAND: ${businessName} (${businessType})
TOWN: ${town || "Universal"}
BRIEF: ${brief || "Promote brand"}
DIRECTION: ${direction?.title || ""}
HOOK: ${hook?.hookLine || ""} — ${hook?.visualAction || ""}
PLOT: ${plot?.title || ""} — ${plot?.coreIdea || ""}
FORMAT: ${format}
LANGUAGE: ${language}`;

  try {
    const raw = await callClaude({ system, content, maxTokens: 2500, thinking: false });
    const parsed = parseJSONBlock(raw);
    if (parsed) {
      const c1 = parsed.characters?.character1 || parsed.character1;
      const c2 = parsed.characters?.character2 || parsed.character2;
      const rawLoc = parsed.location || parsed.setting;
      const settingStr = typeof rawLoc === "string" ? rawLoc : (rawLoc?.details || rawLoc?.name || "Store interior");
      return {
        format: format || parsed.format || "Storytelling",
        formatReason: parsed.formatReason || "Two-character commercial chemistry provides natural, relatable persuasion.",
        location: typeof parsed.location === "object" ? parsed.location : { name: "Single Room Setting", details: settingStr },
        setting: settingStr,
        characters: {
          character1: typeof c1 === "string" ? c1 : `${c1?.name || "Character 1"} (${c1?.role || "Owner"}) — ${c1?.appearance || ""}`,
          character2: typeof c2 === "string" ? c2 : `${c2?.name || "Character 2"} (${c2?.role || "Customer"}) — ${c2?.appearance || ""}`,
        },
        beats: Array.isArray(parsed.beats) ? parsed.beats : [],
      };
    }
  } catch (e) {
    console.warn("[storyWorld] fallback:", e.message);
  }

  return {
    format: format || "Storytelling",
    formatReason: "Two-character commercial chemistry provides natural, relatable persuasion.",
    location: {
      name: `Authentic ${businessType} Interior`,
      details: `A bright, clean storefront interior in ${town || "the city"}, featuring a polished service counter, neatly organized merchandise displays, warm ceiling lighting, and welcoming atmosphere.`,
    },
    setting: `A bright, clean storefront interior in ${town || "the city"}, featuring a polished service counter, neatly organized merchandise displays, warm ceiling lighting, and welcoming atmosphere.`,
    character1: {
      role: "Business Owner / Lead",
      name: "Rohan",
      age: 42,
      appearance: "Neat modern shirt, warm welcoming posture, knowledgeable presence",
      personality: "Helpful, energetic, proud of their craft",
    },
    character2: {
      role: "Customer",
      name: "Ananya",
      age: 32,
      appearance: "Smart casual Indian attire, expressive facial delivery, carrying a small bag",
      personality: "Smart shopper, values quality and genuine attention",
    },
    beats: [
      { beat: "HOOK", title: "Scene 1: Scroll-Stopping Hook", action: hook?.visualAction || "Customer hurries in looking for an urgent solution.", dialogue: hook?.hookLine || (isEng ? "Has this ever happened to you?" : "क्या आपके साथ भी ऐसा होता है?") },
      { beat: "BUILD", title: "Scene 2: Problem Deepens", action: "Customer explains their specific requirement at the counter.", dialogue: isEng ? "I need something genuine and completely reliable." : "मुझे बिलकुल सही और भरोसेमंद चीज़ चाहिए।" },
      { beat: "TURN", title: "Scene 3: Solution Revealed", action: "Owner presents the featured product with clear visual demonstration.", dialogue: isEng ? "Look at this—this is exactly what makes our craft special." : "यह देखिए, यही तो हमारी ख़ासियत है।" },
      { beat: "PAYOFF", title: "Scene 4: Delight & Call to Action", action: "Customer smiles in satisfaction, holding the product. Clean end card transition.", dialogue: isEng ? "From now on, I'm coming straight here every time!" : "अब से हर बार यहीं से लेंगे!" },
    ],
  };
}

/**
 * 6. SCRIPT SYNTHESIS (The Master Creative Synthesis Engine)
 * Takes all approved decisions, constraints, DNA, and synthesizes the canonical Production Script.
 * Runs Section 8 Quality Gate + auto-repair loop.
 */
async function synthesizeMasterScript({ form, creativeDNA, constraints = [], avoid = [], options = {} }) {
  const fest = await getFestivals();
  const system = buildSystem(form.scriptMode);
  const format = creativeDNA?.story?.format || form.creativeStyle || "Storytelling";
  const isEng = !form.language || /eng/i.test(form.language);

  const formatExecutionRules = format.includes("UGC")
    ? `FORMAT EXECUTION (UGC / CREATOR-STYLE):
- Conversational direct-to-camera delivery or authentic peer interaction.
- Fast scroll-stopping hook within 2 seconds.
- Natural handheld camera feel and high social energy.`
    : format.includes("Demo")
    ? `FORMAT EXECUTION (PRODUCT DEMO):
- Featured product MUST be introduced and in focus within the first 4 seconds.
- Physical demonstration is central: hands-on tactile interaction and sensory proof.
- Fewer spoken dialogue lines; visual demonstration leads the persuasion.`
    : format.includes("Comedy")
    ? `FORMAT EXECUTION (SITUATIONAL COMEDY):
- Humorous setup in Scene 1, comedic escalation in Scene 2, witty misunderstanding in Scene 3, and funny punchline in Scene 4.
- Exaggerated facial reactions and comedic timing.`
    : `FORMAT EXECUTION (STORYTELLING):
- Character-driven narrative tension between two characters.
- Natural eye-line contact, emotional dilemma, and heartwarming payoff.`;

  // Compile detailed instructions carrying all creative decisions into Claude
  const dnaInstructions = [
    `CREATIVE DNA & APPROVED USER DECISIONS (MANDATORY ENFORCEMENT):`,
    creativeDNA.direction ? `- Approved Direction: "${creativeDNA.direction.title}": ${creativeDNA.direction.description}` : null,
    creativeDNA.hook ? `- Approved Hook: Line: "${creativeDNA.hook.hookLine}" | Opening Action: "${creativeDNA.hook.visualAction}"` : null,
    creativeDNA.plot ? `- Approved Plot: "${creativeDNA.plot.title}": ${creativeDNA.plot.coreIdea} (Conflict: ${creativeDNA.plot.conflictBeat} -> Payoff: ${creativeDNA.plot.payoffBeat})` : null,
    `- Approved Format: ${format}`,
    creativeDNA.location ? `- Approved Single Location: ${creativeDNA.location.name} (${creativeDNA.location.details || ""})` : null,
    creativeDNA.character1 ? `- Character 1: ${typeof creativeDNA.character1 === "string" ? creativeDNA.character1 : creativeDNA.character1.name + " (" + (creativeDNA.character1.role || "") + ")"}` : null,
    creativeDNA.character2 ? `- Character 2: ${typeof creativeDNA.character2 === "string" ? creativeDNA.character2 : creativeDNA.character2.name + " (" + (creativeDNA.character2.role || "") + ")"}` : null,
    constraints.length ? `- MANDATORY INCLUSIONS (User constraints):\n${constraints.map((c) => `  * ${c}`).join("\n")}` : null,
    avoid.length ? `- MANDATORY EXCLUSIONS (Things to avoid):\n${avoid.map((a) => `  * ${a}`).join("\n")}` : null,
  ].filter(Boolean).join("\n");

  const stageInst = `STAGE 4 PRODUCTION SCRIPT SYNTHESIS:
Write the complete 4-scene broadcast script synthesizing the approved creative decisions below.
${dnaInstructions}

${formatExecutionRules}

Follow all Product Spine Section 8 rules:
- Exactly 4 scenes titled SCENE 1 – HOOK / SCENE 2 – BUILD / SCENE 3 – TURN / SCENE 4 – RESOLUTION.
- Scene 1 MUST open with the approved hook line and action.
- Every scene Visual MUST start with "Same setting:" maintaining the exact same continuous room (Rule M13).
- Exactly 2 characters throughout with consistent look and wardrobe.
- Maximum 2 spoken dialogue lines per character per scene.
- Dialogue language: ${form.language}. ${isEng ? "Spoken dialogue MUST be written in natural, fluent conversational English (NO Hindi, NO Devanagari script)." : "Spoken dialogue MUST be written fully in authentic Devanagari script (Rule M4)."}
- Vary camera shot size and movement across scenes (at least 3 different camera setups).
- When characters talk, they look at each other with natural eye contact.
- Return ONLY the standard @@HEADER@@, @@CHARACTER1@@, @@CHARACTER2@@, @@SETTING@@, @@SCENE@@, and @@RECORD@@ markers.`;

  const base = buildUserContent(form, fest, [], todayIST(), stageInst);
  const festName = creativeDNA?.direction?.festival?.name || form.occasion || "";
  const gateOpts = { scriptMode: form.scriptMode, previous: [], approvedFormat: format, festival: festName };

  let content = base, parsed, failures = [], attempts = 0;
  for (let i = 0; i <= 3; i++) {
    attempts++;
    if (i > 0) content = buildRepairContent(base, parsed.raw, failures);
    parsed = parseOutput(await callClaude({ system, content, thinking: false }));
    failures = runGate(parsed, form, gateOpts);
    console.log(`[synthesis] pass #${attempts}: ${failures.length ? `${failures.length} failing checks (${failures.map(f => f.rule).join(", ")})` : "PASSED"}`);
    if (!failures.length) break;
  }

  if (failures.length) {
    const err = new Error("The script could not pass the quality gate after several passes. Ask for a change at this checkpoint, or go back a step.");
    err.status = 422;
    err.failures = failures;
    throw err;
  }

  // Compile structured shot specifications
  const shotSpec = compileShotSpecification(parsed, form);
  if (shotSpec) {
    shotSpec.format = format;
  }

  return {
    script: parsed.raw,
    parsed,
    attempts,
    shotSpec,
    header: parsed.header,
    character1: parsed.character1,
    character2: parsed.character2,
    setting: parsed.setting,
    scenes: parsed.scenes,
    record: { ...parsed.record, business_name: form.businessName, business_type: form.businessType, town: form.town, date: todayIST(), format, scenes: parsed.scenes.length },
  };
}

/**
 * 7. SCENE-LEVEL AI REWRITER
 * Rewrites a single scene according to user instruction while preserving continuity.
 */
async function rewriteScene({ sceneText, sceneIndex, totalScenes, instruction, form, characters, setting }) {
  const isEng = !form?.language || /eng/i.test(form?.language);
  const system = `You are a precision scene script editor for a 4-scene commercial ad film.
Your task is to rewrite ONLY this specific scene based on the user's creative note (e.g. "make it funnier", "make dialogue shorter", "use Hinglish", "feature product earlier").

Rules:
- Keep the scene template structure (Visual:, Animation Elements:, Audio / Dialogue / Voiceover:, Sound Design:, Editing Notes:).
- Visual MUST start with "Same setting:" preserving the approved room: ${setting || "Same room"}.
- Keep characters consistent: ${characters || "Same characters"}.
- Maximum 2 spoken lines per character.
- Dialogue in ${form?.language || "English"} (${isEng ? "natural conversational English" : "Devanagari script if Hindi/Hinglish/Marathi"}).
- Output ONLY the revised scene starting with SCENE ${sceneIndex + 1} and ending with Editing Notes.`;

  const content = `ORIGINAL SCENE:
${sceneText}

USER REWRITE INSTRUCTION:
${instruction}

Rewrite this scene now:`;

  try {
    const text = await callClaude({ system, content, maxTokens: 1200, thinking: false });
    const clean = text.replace(/```[a-z]*\n?/gi, "").trim();
    if (clean.includes("Visual:") && clean.includes("Audio")) {
      return clean;
    }
  } catch (e) {
    console.error("[rewriteScene] error:", e.message);
  }

  throw new Error("Could not rewrite scene with the given instruction.");
}

module.exports = {
  performAdaptiveResearch,
  generateDirections,
  generateHooks,
  generatePlots,
  generateStoryWorld,
  synthesizeMasterScript,
  rewriteScene,
};
