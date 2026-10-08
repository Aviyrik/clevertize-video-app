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
  const isHin = /hindi/i.test(language);
  const isHinglish = /hinglish/i.test(language);
  const isMar = /marathi/i.test(language);

  const langRule = isEng
    ? "STRICT: The film's canonical language is ENGLISH. Every hookLine MUST be written in natural, fluent conversational English. Absolutely NO Hindi, NO Devanagari script, NO regional Indian language words under any circumstances."
    : isHinglish
    ? "STRICT: The film's canonical language is HINGLISH. Write natural spoken Hinglish (conversational Hindi with everyday English loan words) in Devanagari script."
    : isHin
    ? "STRICT: The film's canonical language is HINDI. Spoken hookLine MUST be in authentic spoken Hindi in Devanagari script."
    : `STRICT: The film's canonical language is ${language}. Spoken hookLine MUST be in authentic spoken ${language}.`;

  const system = `You are a short-form video viral hook specialist for Instagram Reels and YouTube Shorts.
Generate 5 to 7 high-impact commercial opening hooks (first 3 seconds).
Each hook must span a distinct archetype:
- Verbal (provocative question or line)
- Visual (compelling physical movement / near-mishap / intriguing object)
- Curiosity (counter-intuitive knowledge)
- Problem / Relatable Crisis (everyday urgency)
- Creator / UGC (direct to camera insider tip)
- Demonstration (instant before-and-after action)

MANDATORY LANGUAGE ENFORCEMENT:
${langRule}
CRITICAL PRINCIPLE: Never infer output language from the brand name, product category, city, country, or cultural context. The film's explicit language setting (${language}) is the ONLY source of truth.

Provide:
- archetype (name of the hook style)
- hookLine: spoken line strictly in ${language} (${isEng ? "natural conversational English only" : "Devanagari script for Hindi/Hinglish/Marathi"})
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
CANONICAL FILM LANGUAGE: ${language}`;

  try {
    const raw = await callClaude({ system, content, maxTokens: 2000, thinking: false });
    let list = parseJSONBlock(raw);
    if (list && Array.isArray(list.hooks)) list = list.hooks;
    if (Array.isArray(list) && list.length) return list;
  } catch (e) {
    console.warn("[hooks] fallback:", e.message);
  }

  const getHookLine = (eng, hin, mar) => {
    if (isMar) return mar || hin;
    if (isHin || isHinglish) return hin;
    return eng; // English is the canonical default
  };

  return [
    {
      id: "hook_1",
      archetype: "Problem / Everyday Crisis",
      hookLine: getHookLine(
        "Wait, did you run out of this again?",
        "अरे, ये फिर से ख़त्म हो गया?!",
        "अरे, हे पुन्हा संपले की काय?!"
      ),
      visualAction: "A person checks an empty container or shelf with sudden realization and turns around in urgency.",
      angle: "Everyday household panic",
      recommended: true,
    },
    {
      id: "hook_2",
      archetype: "Curiosity / Counter-Intuitive",
      hookLine: getHookLine(
        "Most people get this completely wrong.",
        "ज्यादातर लोग यहाँ गलती करते हैं।",
        "बहुतेक लोक इथेच चूक करतात."
      ),
      visualAction: "The speaker holds up two contrasting items directly to the camera lens, gesturing emphatically.",
      angle: "Knowledge gap reveal",
      recommended: false,
    },
    {
      id: "hook_3",
      archetype: "Creator / UGC Secret",
      hookLine: getHookLine(
        "If you live in this area, you need to know this.",
        "अगर आप यहाँ रहते हैं, तो ये सीक्रेट जान लीजिए।",
        "जर तुम्ही या भागात राहता, तर हे गुपित नक्की जाणून घ्या."
      ),
      visualAction: "Creator leans in closely towards the phone camera with a knowing smile, pointing over their shoulder.",
      angle: "Insider recommendation",
      recommended: false,
    },
    {
      id: "hook_4",
      archetype: "Visual Action",
      hookLine: getHookLine(
        "Stop doing this right now!",
        "रुको, ये मत करना!",
        "थांबा, हे मुळीच करू नका!"
      ),
      visualAction: "Hands rush in to catch a slipping product just before it hits the counter, freezing the frame.",
      angle: "Immediate motion stop",
      recommended: false,
    },
    {
      id: "hook_5",
      archetype: "Demonstration / Proof",
      hookLine: getHookLine(
        "See the difference in literally three seconds.",
        "सिर्फ तीन सेकंड में असली फर्क देखिए।",
        "फक्त तीन सेकंदात खरा फरक बघा."
      ),
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

  const langRule = isEng
    ? "CANONICAL LANGUAGE DIRECTIVE: Output language is ENGLISH. Any character dialogue snippets or spoken examples MUST be in natural conversational English. Never output Hindi or Devanagari script."
    : `CANONICAL LANGUAGE DIRECTIVE: Output language is ${language}. Character dialogue snippets must be in ${language} (${/hindi|hinglish|marathi/i.test(language) ? "Devanagari script" : language}).`;

  const system = `You are a narrative screenwriter for commercial advertising.
Generate 3 distinct 4-scene narrative plot lines for a commercial video.
FORMAT INFLUENCE (${format}):
${formatGuidelines}

LANGUAGE RULE:
${langRule}
CRITICAL: Do NOT infer output language from brand, city, or culture. Spoken language is strictly ${language}.

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
CANONICAL FILM LANGUAGE: ${language}`;

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
async function generateStoryWorld({ businessName, businessType, town, brief, direction, hook, plot, format = "UGC / Creator-style", language = "English" }) {
  const isEng = !language || /eng/i.test(language);
  const isHin = /hindi/i.test(language);
  const isHinglish = /hinglish/i.test(language);
  const isMar = /marathi/i.test(language);

  const cleanFormat = format === "UGC / Creator" ? "UGC / Creator-style" : format;
  const isUGC = cleanFormat.includes("UGC");
  const isDemo = cleanFormat.includes("Demo");
  const isComedy = cleanFormat.includes("Comedy");

  const formatGuidelines = isUGC
    ? `FORMAT EXECUTION (UGC / CREATOR-STYLE):
- Direct-to-camera or creator point-of-view in authentic mobile framing.
- Fast hook within 2 seconds. The creator shares personal excitement, unboxing, or authentic trial.
- Conversational pacing, natural energy, relatable peer recommendation. Minimal cinematic exposition.`
    : isDemo
    ? `FORMAT EXECUTION (PRODUCT DEMO):
- Featured product is introduced immediately within the first 2-3 seconds.
- Hands-on tactile interaction, physical textures, sensory details, and unboxing/finish in clear focus.
- Visual demonstration leads over dialogue; clear, tangible commercial proof.`
    : isComedy
    ? `FORMAT EXECUTION (SITUATIONAL COMEDY):
- Humorous setup, playful escalation, witty misunderstanding, and funny punchline payoff.
- Exaggerated relatable reactions directly centered on the product or occasion.`
    : `FORMAT EXECUTION (STORYTELLING):
- Character-driven commercial narrative between two people.
- Relatable human dilemma or festive requirement solved naturally by the product.
- Warm emotional payoff and delightful brand resolution.`;

  const storyLangRule = isEng
    ? "CANONICAL FILM LANGUAGE DIRECTIVE: Output language is strictly ENGLISH. Spoken dialogue in beats MUST be written in natural conversational English. Absolutely NO Hindi or Devanagari script."
    : `CANONICAL FILM LANGUAGE DIRECTIVE: Output language is strictly ${language}. Spoken dialogue in beats MUST be written in authentic ${language} (${isHin || isHinglish || isMar ? "Devanagari script" : language}).`;

  const system = `You are a commercial film director shaping the concise story architecture (4 beats) and core anchors for a video commercial.

HARD CREATIVE CONSTRAINT — BRIEF ANCHORING (CRITICAL):
The user's brief is: "${brief || businessName}".
The business is: "${businessName} (${businessType || 'Local Business'})".
EVERY SINGLE STORY BEAT MUST DIRECTLY SHOWCASE AND PROGRESS THIS EXACT BRIEF AND PRODUCT.
- E.g. if the brief is "Show fresh pure desi ghee sweets being packed into premium festive gift hampers", ALL 4 beats must visibly showcase those exact sweets, packing, premium boxes, freshness, or festive gifting.
- DO NOT invent unrelated family drama, rituals, or random scenarios that wander away from the brief.

FORMAT CONSTRAINT (${cleanFormat}):
${formatGuidelines}

${storyLangRule}

STRICT BEAT CONSTRAINTS (NOT A SCREENPLAY):
Keep each beat concise, crisp, and scannable in under 10 seconds!
1. Exactly 4 story beats: HOOK, BUILD, TURN, PAYOFF.
2. For each beat:
   - "title": Short descriptive title (e.g. "Scene 1: The Direct Hook")
   - "action": Exactly 1 to 2 short sentences describing what happens (STRICT LIMIT: 20 to 30 words max).
   - "dialogue": Exactly 1 short spoken dialogue line in ${language} (maximum 8-12 words).
3. Compact World Anchors:
   - "leadCharacter": { "name": "Name", "role": "Role · Title" }
   - "supportingCharacter": { "name": "Name", "role": "Role · Title" }
   - "setting": Concise 1-sentence setting location.
   - "product": Concise featured product name extracted from the brief.

Return valid JSON between @@JSON@@ and @@END@@:
@@JSON@@
{
  "format": "${cleanFormat}",
  "formatReason": "Concise 1-sentence explanation of format fit.",
  "product": "Featured product/offering",
  "setting": "Concise setting description (1 sentence)",
  "location": {
    "name": "Short setting name (e.g. Packing Station / Living Room)",
    "details": "Concise setting description"
  },
  "character1": {
    "name": "Lead name",
    "role": "Role · Title",
    "appearance": "Short visual note"
  },
  "character2": {
    "name": "Supporting name",
    "role": "Role · Title",
    "appearance": "Short visual note"
  },
  "beats": [
    { "beat": "HOOK", "timing": "0-3s", "title": "Scene 1: Hook Title", "action": "1-2 short sentences (max 30 words).", "dialogue": "Short 1-line dialogue." },
    { "beat": "BUILD", "timing": "3-8s", "title": "Scene 2: Build Title", "action": "1-2 short sentences (max 30 words).", "dialogue": "Short 1-line dialogue." },
    { "beat": "TURN", "timing": "8-14s", "title": "Scene 3: Turn Title", "action": "1-2 short sentences (max 30 words).", "dialogue": "Short 1-line dialogue." },
    { "beat": "PAYOFF", "timing": "14-20s", "title": "Scene 4: Payoff Title", "action": "1-2 short sentences (max 30 words).", "dialogue": "Short 1-line dialogue." }
  ]
}
@@END@@`;

  const content = `BRAND: ${businessName} (${businessType})
TOWN: ${town || "Universal"}
BRIEF: ${brief || "Promote brand"}
DIRECTION: ${direction?.title || ""}
HOOK: ${hook?.hookLine || ""} — ${hook?.visualAction || ""}
PLOT: ${plot?.title || ""} — ${plot?.coreIdea || ""}
FORMAT: ${cleanFormat}
CANONICAL FILM LANGUAGE: ${language}`;

  try {
    const raw = await callClaude({ system, content, maxTokens: 2500, thinking: false });
    const parsed = parseJSONBlock(raw);
    if (parsed && Array.isArray(parsed.beats) && parsed.beats.length > 0) {
      const c1 = parsed.character1 || parsed.characters?.character1 || parsed.leadCharacter;
      const c2 = parsed.character2 || parsed.characters?.character2 || parsed.supportingCharacter;
      const rawLoc = parsed.location || parsed.setting;
      const settingStr = typeof rawLoc === "string" ? rawLoc : (rawLoc?.details || rawLoc?.name || `${businessName} setting`);
      const prodStr = parsed.product || brief || `${businessName} Special`;
      const beats = Array.isArray(parsed.beats) ? parsed.beats : [];

      return {
        format: cleanFormat || parsed.format || "Storytelling",
        formatReason: parsed.formatReason || "Selected format provides natural audience engagement.",
        product: prodStr,
        location: typeof parsed.location === "object" ? parsed.location : { name: "Featured Setting", details: settingStr },
        setting: settingStr,
        character1: typeof c1 === "object" ? c1 : { name: "Lead", role: "Host / Creator", appearance: String(c1 || "") },
        character2: typeof c2 === "object" ? c2 : { name: "Supporting", role: "Partner / Customer", appearance: String(c2 || "") },
        characters: {
          character1: typeof c1 === "string" ? c1 : `${c1?.name || "Lead"} (${c1?.role || "Host"})`,
          character2: typeof c2 === "string" ? c2 : `${c2?.name || "Supporting"} (${c2?.role || "Partner"})`,
        },
        beats,
      };
    }
  } catch (e) {
    console.warn("[storyWorld] fallback:", e.message);
  }

  const prodFallback = brief || `${businessName} Special`;
  const defaultBeats = isUGC
    ? [
        { beat: "HOOK", timing: "0-3s", title: "Scene 1: The Direct Hook", action: hook?.visualAction || `Lead speaks directly to camera, revealing ${prodFallback} with enthusiastic energy.`, dialogue: hook?.hookLine || (isEng ? "You won't believe what just arrived!" : (isHin || isHinglish ? "ये देखिए, क्या शानदार चीज़ मिली है!" : isMar ? "हे बघा, काय भारी गोष्ट मिळाली आहे!" : "Look at what just arrived!")) },
        { beat: "BUILD", timing: "3-8s", title: "Scene 2: Unboxing & Texture", action: `Close-up camera reveals the fresh texture, authentic quality, and premium packaging of ${prodFallback}.`, dialogue: isEng ? "Look at this pure, handcrafted finish up close." : (isHin || isHinglish ? "इसकी बनावट और शुद्धता पास से देखिए।" : isMar ? "याची शुद्धता आणि फिनिशिंग जवळून बघा." : "Look at this finish up close.") },
        { beat: "TURN", timing: "8-14s", title: "Scene 3: Proof & Convenience", action: `Lead highlights guaranteed quality standard and swift same-day ordering for ${businessName}.`, dialogue: isEng ? "Plus, guaranteed same-day delivery right to your door!" : (isHin || isHinglish ? "और उसी दिन आपके घर तक डिलीवरी भी!" : isMar ? "आणि त्याच दिवशी थेट घरपोच डिलिव्हरी सुद्धा!" : "And fast same-day delivery right to your door!") },
        { beat: "PAYOFF", timing: "14-20s", title: "Scene 4: Joyful Call to Action", action: `Lead presents the completed package with a delighted smile. Clean brand end-card transition.`, dialogue: isEng ? "Order yours today before festival stock sells out!" : (isHin || isHinglish ? "त्योहार का स्टॉक खत्म होने से पहले अभी आर्डर करें!" : isMar ? "सणाचा साठा संपण्यापूर्वी आजच ऑर्डर करा!" : "Order yours today before stock sells out!") },
      ]
    : isDemo
    ? [
        { beat: "HOOK", timing: "0-3s", title: "Scene 1: Product Reveal", action: hook?.visualAction || `Immediate high-definition focus on ${prodFallback}, opening with crisp tactile sound and visual clarity.`, dialogue: hook?.hookLine || (isEng ? "Here is genuine craftsmanship in action." : (isHin || isHinglish ? "ये है असली कारीगरी का कमाल।" : isMar ? "ही आहे अस्सल कारागिरीची कमाल." : "Here is genuine craftsmanship.")) },
        { beat: "BUILD", timing: "3-8s", title: "Scene 2: Sensory Demonstration", action: `Hands-on demonstration showing fresh ingredients, meticulous preparation, and exquisite detail.`, dialogue: isEng ? "Every single piece is prepared with 100% purity." : (isHin || isHinglish ? "हर एक पीस 100% शुद्धता से तैयार किया जाता है।" : isMar ? "प्रत्येक पीस 100% शुद्धतेने बनवला जातो." : "Prepared with 100% purity.") },
        { beat: "TURN", timing: "8-14s", title: "Scene 3: Premium Pack & Seal", action: `Customer counter seal stamped onto the premium gift box, confirming freshness guarantee.`, dialogue: isEng ? "Sealed fresh and ready for instant delivery." : (isHin || isHinglish ? "एकदम ताज़ा और तुरंत डिलीवरी के लिए तैयार।" : isMar ? "अगदी ताजे आणि त्वरित डिलिव्हरीसाठी सज्ज." : "Sealed fresh and ready.") },
        { beat: "PAYOFF", timing: "14-20s", title: "Scene 4: Finished Showcase", action: `The complete festive presentation displayed prominently with order link and contact info.`, dialogue: isEng ? "Experience the authentic standard of " + businessName + "." : (isHin || isHinglish ? businessName + " की शुद्धता का अनुभव खुद लें।" : isMar ? businessName + " च्या शुद्धतेचा स्वतः अनुभव घ्या." : "Experience the quality.") },
      ]
    : isComedy
    ? [
        { beat: "HOOK", timing: "0-3s", title: "Scene 1: The Sneak Attempt", action: hook?.visualAction || `Character sneakily attempts to hide a box of ${prodFallback} for themselves before anyone notices.`, dialogue: hook?.hookLine || (isEng ? "Nobody saw that... right?" : (isHin || isHinglish ? "किसी ने नहीं देखा ना...?" : isMar ? "कोणी पाहिलं नाही ना...?" : "Nobody saw that, right?")) },
        { beat: "BUILD", timing: "3-8s", title: "Scene 2: Caught in the Act", action: `Partner suddenly appears with arms crossed, catching them red-handed with the open box.`, dialogue: isEng ? "Were you really going to finish the whole box alone?" : (isHin || isHinglish ? "क्या पूरा डिब्बा अकेले ही चट करने का इरादा था?" : isMar ? "काय, एकट्यानेच पूर्ण डबा संपवणार होतास?" : "Were you going to finish it alone?") },
        { beat: "TURN", timing: "8-14s", title: "Scene 3: The Relief Reveal", action: `Counter partner smiles and pulls out a second fresh box, revealing there is plenty for both.`, dialogue: isEng ? "Don't worry, there's another fresh box right here!" : (isHin || isHinglish ? "चिंता मत करो, एक और ताज़ा डिब्बा यहाँ तैयार है!" : isMar ? "काळजी करू नकोस, दुसरा ताटा डबा इथे तयार आहे!" : "There is another box right here!") },
        { beat: "PAYOFF", timing: "14-20s", title: "Scene 4: Shared Delight", action: `Both joyfully share the treat, laughing together as the special festive offer appears.`, dialogue: isEng ? "Too good to share, but better together!" : (isHin || isHinglish ? "इतना स्वादिष्ट कि शेयर करना मुश्किल, पर साथ खाने में ही मज़ा है!" : isMar ? "शेअर करणे कठीण, पण एकत्र खाण्यातच खरी मजा!" : "Better together!") },
      ]
    : [
        { beat: "HOOK", timing: "0-3s", title: "Scene 1: The Urgent Need", action: hook?.visualAction || `Customer arrives looking for an exceptional festive gesture with ${prodFallback}.`, dialogue: hook?.hookLine || (isEng ? "Has this ever happened to you before?" : (isHin || isHinglish ? "क्या आपके साथ भी ऐसा होता है?" : isMar ? "तुमच्यासोबतही असं घडतं का?" : "Has this ever happened to you?")) },
        { beat: "BUILD", timing: "3-8s", title: "Scene 2: The Warm Recommendation", action: `Host presents the handcrafted collection, walking through the authentic quality details.`, dialogue: isEng ? "Look at this—this is made with pure, traditional care." : (isHin || isHinglish ? "यह देखिए—यह शुद्ध पारंपरिक तरीके से बना है।" : isMar ? "हे बघा—हे अस्सल पारंपरिक पद्धतीने बनवले आहे." : "Made with traditional care.") },
        { beat: "TURN", timing: "8-14s", title: "Scene 3: The Guarantee", action: `Customer inspects the pristine presentation and same-day delivery seal with visible delight.`, dialogue: isEng ? "This is exactly what makes our festive celebration special." : (isHin || isHinglish ? "यही तो हमारे त्योहार की शान बढ़ाएगा!" : isMar ? "यानेच तर आपल्या सणाची शोभा वाढेल!" : "This makes our celebration special.") },
        { beat: "PAYOFF", timing: "14-20s", title: "Scene 4: Heartfelt Payoff", action: `Both smile in shared confidence as customer leaves happily with the festive package.`, dialogue: isEng ? "From now on, I'm coming straight to " + businessName + "!" : (isHin || isHinglish ? "अब से हर बार सीधे " + businessName + " से ही लेंगे!" : isMar ? "आतापासून दर वेळी थेट " + businessName + " मधूनच घेणार!" : "I am coming straight here!") },
      ];

  return {
    format: cleanFormat,
    formatReason: "Selected format provides natural audience engagement.",
    product: prodFallback,
    setting: `A bright, welcoming storefront counter at ${businessName} in ${town || "the city"}, featuring neatly arranged merchandise displays and warm lighting.`,
    location: {
      name: `Authentic ${businessType} Counter`,
      details: `A bright, clean storefront counter at ${businessName} in ${town || "the city"}, with warm lighting and tidy displays.`,
    },
    character1: {
      name: isUGC ? "Pooja" : "Rohan",
      role: isUGC ? "Creator · Host" : "Store Lead · Owner",
      appearance: "Neat modern attire, warm energetic presence",
    },
    character2: {
      name: "Ananya",
      role: isUGC ? "Co-Creator · Partner" : "Customer · Friend",
      appearance: "Smart casual festive outfit, expressive smile",
    },
    characters: {
      character1: isUGC ? "Pooja (Creator / Host)" : "Rohan (Store Lead / Owner)",
      character2: isUGC ? "Ananya (Co-Creator / Partner)" : "Ananya (Customer / Friend)",
    },
    beats: defaultBeats,
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
  const rawFormat = creativeDNA?.format || creativeDNA?.story?.format || form.creativeStyle || "Storytelling";
  const format = /ugc|creator/i.test(rawFormat) ? "UGC" : /demo/i.test(rawFormat) ? "Product Demo" : /comedy/i.test(rawFormat) ? "Situational Comedy" : "Storytelling";
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
- Return ONLY the standard @@HEADER@@, @@CHARACTER1@@, @@CHARACTER2@@, @@SETTING@@, @@SCENE@@, and @@RECORD@@ markers. In @@HEADER@@, set Format: ${format}.`;

  const base = buildUserContent(form, fest, [], todayIST(), stageInst);
  const festName = creativeDNA?.direction?.festival?.name || form.occasion || "";
  const gateOpts = { scriptMode: form.scriptMode, previous: [], approvedFormat: format, festival: festName };

  let content = base, parsed, failures = [], attempts = 0;
  for (let i = 0; i <= 3; i++) {
    attempts++;
    if (i > 0) content = buildRepairContent(base, parsed.raw, failures);
    parsed = parseOutput(await callClaude({ system, content, thinking: false }));
    failures = runGate(parsed, form, gateOpts);
    console.log(`[synthesis] pass #${attempts}: ${failures.length ? `${failures.length} failing checks (${failures.map(f => (typeof f === "object" ? f.rule || f.message : f)).join(" | ")})` : "PASSED"}`);
    if (!failures.length) break;
  }

  if (failures.length) {
    console.warn(`[synthesis] Quality gate had ${failures.length} remaining check(s) after ${attempts} passes:`, failures);

    // Resilient auto-sanitization fallback if scenes were generated
    if (parsed && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
      // 1. Ensure visual starts with "Same setting:"
      parsed.scenes = parsed.scenes.map((sc) => {
        return sc.replace(/(Visual\s*:\s*)(?!same setting\b)/i, "$1Same setting: ");
      });

      // 2. Ensure header has format
      if (!parsed.header) parsed.header = {};
      if (!parsed.header.business) parsed.header.business = form.businessName;
      if (!parsed.header.format) parsed.header.format = format;
      if (!parsed.header.lens) parsed.header.lens = creativeDNA?.direction?.lens || "1, Everyday Relatability";
      if (!parsed.header.hook) parsed.header.hook = creativeDNA?.hook?.hookPattern || "Creator Hook";
      if (!parsed.header.moment) parsed.header.moment = festName || "Everyday";

      // 3. Fallback character/setting if empty
      if (!parsed.character1 && creativeDNA?.character1) {
        parsed.character1 = typeof creativeDNA.character1 === "string" ? creativeDNA.character1 : `${creativeDNA.character1.name} — ${creativeDNA.character1.role || ""}`;
      }
      if (!parsed.character2 && creativeDNA?.character2) {
        parsed.character2 = typeof creativeDNA.character2 === "string" ? creativeDNA.character2 : `${creativeDNA.character2.name} — ${creativeDNA.character2.role || ""}`;
      }
      if (!parsed.setting && creativeDNA?.location) {
        parsed.setting = `${creativeDNA.location.name}. ${creativeDNA.location.details || ""}`;
      }

      // Re-run gate check after sanitization
      const postSanitizeFailures = runGate(parsed, form, gateOpts);
      if (!postSanitizeFailures.length) {
        console.log(`[synthesis] Sanitization resolved all remaining quality gate checks!`);
        failures = [];
      } else {
        failures = postSanitizeFailures;
      }
    }

    // Only throw fatal 422 if no scenes could be produced at all
    if (!parsed || !parsed.scenes || parsed.scenes.length === 0) {
      const err = new Error("The script could not pass the quality gate after several passes. Ask for a change at this checkpoint, or go back a step.");
      err.status = 422;
      err.failures = failures;
      throw err;
    }
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
