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
async function generateDirections({ businessName, businessType, town, brief, research, festival, language = "English", format = "UGC / Creator-style" }) {
  const cleanFormat = String(format || "").trim();
  const isDemo = /demo/i.test(cleanFormat);
  const isComedy = /comedy|funny/i.test(cleanFormat);
  const isStory = /story/i.test(cleanFormat) && !isDemo;
  const isUGC = /ugc|creator/i.test(cleanFormat) || (!isDemo && !isComedy && !isStory);

  const langLower = String(language || "English").toLowerCase().trim();
  const isEng = !language || (langLower.includes("eng") && !langLower.includes("hinglish"));
  const isHinglish = langLower.includes("hinglish");

  const langRule = isEng
    ? "CANONICAL FILM LANGUAGE: English. Ideas, titles, and angles must be written in English. Do NOT impose regional Indian language stereotypes."
    : isHinglish
    ? "CANONICAL FILM LANGUAGE: Hinglish. Creative territories and concepts should resonate with modern, bilingual Indian audiences using conversational Hinglish culture. NEVER default to Kannada, Tamil, Telugu, or an unrelated regional language based on brand headquarters city."
    : `CANONICAL FILM LANGUAGE: ${language}. Creative territories and concepts should authentically reflect ${language} cultural context. Never infer or substitute a different regional language based on the brand's corporate headquarters city or location.`;

  const formatDirectionPrompt = isDemo
    ? `MANDATORY CREATIVE FORMAT: PRODUCT DEMO ("Show the product in action")
Sets story architecture and pacing: Hands-on tactile textures & clear visual proof.
CRITICAL CONSTRAINT: Every creative territory proposed MUST be a tangible, hands-on product demonstration, live stress test, or clear visual proof concept.
- Showcase the physical product being unboxed, handled, tested, or demonstrated in action.
- DO NOT propose fictional character drama, lifestyle vlogging stories, or unrelated skits.
- Suggested territory types: "Live Stress Test", "Side-by-Side Proof", "Tactile Macro Showcase", "Instant Before & After", "2-Second Setup Challenge".`
    : isComedy
    ? `MANDATORY CREATIVE FORMAT: SITUATIONAL COMEDY ("Setup, funny moment, payoff")
Sets story architecture and pacing: Witty relatable problem, playful banter & comic punchline.
CRITICAL CONSTRAINT: Every creative territory proposed MUST be a humorous, witty situation or relatable comic struggle.
- Focus on witty misunderstandings, playful banter, comic escalation, and funny payoffs where the product saves the day.
- Suggested territory types: "The Relatable Misunderstanding", "The Over-Complicated Struggle", "The Humorous Rivalry", "The Playful Bluff".`
    : isStory
    ? `MANDATORY CREATIVE FORMAT: STORYTELLING ("A short story with people")
Sets story architecture and pacing: 2-character relatable dilemma & emotional payoff.
CRITICAL CONSTRAINT: Every creative territory proposed MUST be an emotional or relatable human dilemma between two people.
- Focus on authentic interpersonal relationships, a real emotional tension, and a warm, earned resolution.
- THIRD-PERSON CINEMATIC CAMERA ONLY: Absolutely NO direct-to-camera, NO vlog, NO selfie-style, NO creator talking into a phone.
- Suggested territory types: "The Hesitant First Step", "The Unspoken Dilemma", "The Timely Encouragement", "The Breakthrough Moment", "The Generational Bond".`
    : `MANDATORY CREATIVE FORMAT: UGC / CREATOR-STYLE ("Feels like a real person made it")
Sets story architecture and pacing: Direct-to-camera, creator rhythm & natural mobile energy.
CRITICAL CONSTRAINT: Every creative territory proposed MUST feel authentic, creator-led, and native to mobile feeds.
- Focus on candid creator point-of-view, insider recommendations, relatable creator frustrations, or honest real-talk advice.
- Suggested territory types: "The Real-Talk Truth", "The Secret Hack", "Creator Reality Check", "The Daily Driver Test".`;

  const system = `You are an executive creative director proposing 3 to 4 distinct creative territories for an Indian short-form commercial ad.
Each territory must strictly honour the chosen creative format below:
${formatDirectionPrompt}

LANGUAGE AND CULTURAL CONTEXT:
${langRule}
CRITICAL PRINCIPLE: The film's explicit canonical language (${language}) is the ONLY source of truth. Never assume or infer a different regional language (such as Kannada, Tamil, or Telugu) from the brand name, corporate headquarters, or business location (e.g. Bangalore, Mumbai, Chennai).

Mark exactly one territory as recommended: true.

Output strictly valid JSON between @@JSON@@ and @@END@@:
@@JSON@@
[
  {
    "id": "dir_1",
    "title": "TERRITORY TITLE",
    "description": "Short explanation of the concept.",
    "angle": "Specific strategic angle.",
    "recommended": true,
    "whyRecommended": "Why this territory is best suited for this brand and format."
  }
]
@@END@@`;

  const content = `BRAND: ${businessName} (${businessType})
TOWN: ${town || "Universal (Pan-India National)"}
BRIEF: ${brief || "Promote brand"}
CHOSEN CREATIVE FORMAT: ${cleanFormat || "UGC / Creator-style"}
CANONICAL FILM LANGUAGE: ${language}
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

  if (isDemo) {
    return [
      {
        id: "dir_1",
        title: "LIVE STRESS TEST",
        description: "Put the product to the ultimate real-world test with undeniable visual proof.",
        angle: "High-stakes performance demonstration under challenging real conditions.",
        recommended: true,
        whyRecommended: "Highest commercial conversion for product-focused demonstrations.",
      },
      {
        id: "dir_2",
        title: "SIDE-BY-SIDE PROOF",
        description: "Direct before-and-after comparison showing the stark contrast in action.",
        angle: "Immediate visual and sensory difference in the first 3 seconds.",
        recommended: false,
      },
      {
        id: "dir_3",
        title: "TACTILE MACRO SHOWCASE",
        description: "Hands-on close-up highlighting tactile build, craftsmanship, and ease of use.",
        angle: "Sensory product textures and instant tactile appeal.",
        recommended: false,
      },
    ];
  }

  if (isComedy) {
    return [
      {
        id: "dir_1",
        title: "THE RELATABLE MISUNDERSTANDING",
        description: "A funny everyday miscommunication that gets playfully escalated until the product saves the day.",
        angle: "Relatable comic timing and witty banter.",
        recommended: true,
        whyRecommended: "Strongest humorous engagement and viral shareability.",
      },
      {
        id: "dir_2",
        title: "THE OVER-COMPLICATED STRUGGLE",
        description: "Doing things the hard, awkward old way backfires hilariously next to the smart solution.",
        angle: "Comic contrast between unnecessary complexity and easy relief.",
        recommended: false,
      },
      {
        id: "dir_3",
        title: "THE PLAYFUL CHALLENGE",
        description: "A lighthearted bet or tease between two characters with an unexpected punchline.",
        angle: "Playful character banter and witty resolution.",
        recommended: false,
      },
    ];
  }

  if (isStory) {
    return [
      {
        id: "dir_1",
        title: "THE UNEXPECTED ASSISTANCE",
        description: "A heartfelt everyday dilemma resolved through an authentic interpersonal bond.",
        angle: "Emotional relief and relatable family or friendship connection.",
        recommended: true,
        whyRecommended: "Deep emotional resonance that builds lasting brand goodwill.",
      },
      {
        id: "dir_2",
        title: "THE SHARED SECRET",
        description: "Two characters navigate a small daily crisis together with warmth and mutual discovery.",
        angle: "Intimate character dynamic and shared joy.",
        recommended: false,
      },
      {
        id: "dir_3",
        title: "THE QUIET RESCUE",
        description: "A high-stakes everyday moment where the product arrives just in time to turn worry into joy.",
        angle: "Dramatic tension with a satisfying emotional payoff.",
        recommended: false,
      },
    ];
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
 * Validates a single hook line against the chosen canonical language.
 * Enforces correct script and checks for incompatible regional languages.
 * For Hinglish:
 * - Strictly forbids Dravidian scripts (Kannada, Tamil, Telugu, Malayalam) and other non-Devanagari scripts (Bengali, Gujarati, Gurmukhi).
 * - Requires Devanagari script (Rule M4).
 * - Forbids South Indian transliterated colloquial tokens.
 */
function validateHookLine(line, language = "English") {
  if (!line || typeof line !== "string" || !line.trim()) {
    return { valid: false, reason: "Empty hook line" };
  }
  const clean = line.trim();
  const langLower = String(language || "English").toLowerCase().trim();

  const KANNADA = /[\u0C80-\u0CFF]/;
  const TELUGU = /[\u0C00-\u0C7F]/;
  const TAMIL = /[\u0B80-\u0BFF]/;
  const MALAYALAM = /[\u0D00-\u0D7F]/;
  const BENGALI = /[\u0980-\u09FF]/;
  const GUJARATI = /[\u0A80-\u0AFF]/;
  const GURMUKHI = /[\u0A00-\u0A7F]/;
  const DEVANAGARI = /[\u0900-\u097F]/;
  const LATIN = /[a-zA-Z]/;

  // English: Latin only, absolutely NO Indic scripts
  if (langLower.includes("eng") && !langLower.includes("hinglish")) {
    if (DEVANAGARI.test(clean) || KANNADA.test(clean) || TELUGU.test(clean) || TAMIL.test(clean) || MALAYALAM.test(clean) || BENGALI.test(clean) || GUJARATI.test(clean) || GURMUKHI.test(clean)) {
      return { valid: false, reason: `English hook contains Indic script: "${clean.slice(0, 40)}"` };
    }
    if (!LATIN.test(clean)) {
      return { valid: false, reason: `English hook has no Latin characters: "${clean.slice(0, 40)}"` };
    }
    return { valid: true };
  }

  // Hinglish: Devanagari + English loanwords (M4), strictly NO Dravidian or other regional scripts
  if (langLower.includes("hinglish")) {
    if (KANNADA.test(clean)) {
      return { valid: false, reason: `Hinglish hook contains Kannada script: "${clean.slice(0, 40)}"` };
    }
    if (TAMIL.test(clean) || TELUGU.test(clean) || MALAYALAM.test(clean) || BENGALI.test(clean) || GUJARATI.test(clean) || GURMUKHI.test(clean)) {
      return { valid: false, reason: `Hinglish hook contains incompatible regional script: "${clean.slice(0, 40)}"` };
    }
    if (!DEVANAGARI.test(clean)) {
      return { valid: false, reason: `Hinglish hook missing Devanagari script (Rule M4): "${clean.slice(0, 40)}"` };
    }
    // Semantic / content check: forbid regional Dravidian romanized tokens if injected
    if (/\b(namma|macha|illi|hege|idu|illa|gothilla|vanakkam|ungana|machan|anna|thambi)\b/i.test(clean)) {
      return { valid: false, reason: `Hinglish hook contains regional Dravidian tokens: "${clean.slice(0, 40)}"` };
    }
    return { valid: true };
  }

  // Hindi: Devanagari script, NO regional non-Devanagari scripts
  if (langLower === "hindi") {
    if (KANNADA.test(clean) || TAMIL.test(clean) || TELUGU.test(clean) || MALAYALAM.test(clean) || BENGALI.test(clean) || GUJARATI.test(clean) || GURMUKHI.test(clean)) {
      return { valid: false, reason: `Hindi hook contains non-Devanagari Indic script: "${clean.slice(0, 40)}"` };
    }
    if (!DEVANAGARI.test(clean)) {
      return { valid: false, reason: `Hindi hook missing Devanagari script: "${clean.slice(0, 40)}"` };
    }
    return { valid: true };
  }

  // Kannada: Kannada script required, NO Devanagari or other scripts
  if (langLower === "kannada") {
    if (!KANNADA.test(clean)) {
      return { valid: false, reason: `Kannada hook missing Kannada script: "${clean.slice(0, 40)}"` };
    }
    if (DEVANAGARI.test(clean) || TAMIL.test(clean) || TELUGU.test(clean)) {
      return { valid: false, reason: `Kannada hook contains incompatible script: "${clean.slice(0, 40)}"` };
    }
    return { valid: true };
  }

  // Tamil: Tamil script required
  if (langLower === "tamil") {
    if (!TAMIL.test(clean)) {
      return { valid: false, reason: `Tamil hook missing Tamil script: "${clean.slice(0, 40)}"` };
    }
    if (DEVANAGARI.test(clean) || KANNADA.test(clean) || TELUGU.test(clean)) {
      return { valid: false, reason: `Tamil hook contains incompatible script: "${clean.slice(0, 40)}"` };
    }
    return { valid: true };
  }

  // Telugu: Telugu script required
  if (langLower === "telugu") {
    if (!TELUGU.test(clean)) {
      return { valid: false, reason: `Telugu hook missing Telugu script: "${clean.slice(0, 40)}"` };
    }
    if (DEVANAGARI.test(clean) || KANNADA.test(clean) || TAMIL.test(clean)) {
      return { valid: false, reason: `Telugu hook contains incompatible script: "${clean.slice(0, 40)}"` };
    }
    return { valid: true };
  }

  // Marathi: Devanagari script required
  if (langLower === "marathi") {
    if (!DEVANAGARI.test(clean) || KANNADA.test(clean) || TAMIL.test(clean) || TELUGU.test(clean)) {
      return { valid: false, reason: `Marathi hook invalid script: "${clean.slice(0, 40)}"` };
    }
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Validates an entire list of generated hooks against the chosen language.
 */
function validateHooksList(hooks, language = "English") {
  if (!Array.isArray(hooks) || hooks.length === 0) {
    return { valid: false, error: "Empty or invalid hooks array" };
  }
  const failures = [];
  for (let i = 0; i < hooks.length; i++) {
    const h = hooks[i];
    const line = (h && (h.hookLine || h.text || h.hook || "")) || "";
    const res = validateHookLine(line, language);
    if (!res.valid) {
      failures.push(`Hook #${i + 1}: ${res.reason}`);
    }
  }
  if (failures.length > 0) {
    return { valid: false, error: failures.join("; "), failures };
  }
  return { valid: true };
}

/**
 * 3. HOOK INTELLIGENCE (5-8 Multi-Archetype Hooks)
 */
async function generateHooks(params = {}) {
  const { businessName, businessType, brief, direction, format = "UGC / Creator-style" } = params;
  const rawLang = params.language;
  const isExplicit = rawLang !== undefined && rawLang !== null && String(rawLang).trim() !== "";
  const language = isExplicit ? String(rawLang).trim() : "English";
  const langLower = String(language || "English").toLowerCase().trim();
  const isEng = !language || (langLower.includes("eng") && !langLower.includes("hinglish"));
  const isHin = langLower === "hindi";
  const isHinglish = langLower.includes("hinglish");
  const isMar = langLower === "marathi";
  const isKan = langLower === "kannada";
  const isTam = langLower === "tamil";
  const isTel = langLower === "telugu";
  const isGuj = langLower === "gujarati";
  const isBen = langLower === "bengali";
  const isMal = langLower === "malayalam";
  const isPun = langLower === "punjabi";

  const cleanFormat = String(format || "").trim();
  const isDemo = /demo/i.test(cleanFormat);
  const isComedy = /comedy|funny/i.test(cleanFormat);
  const isStory = /story/i.test(cleanFormat) && !isDemo;
  const isUGC = /ugc|creator/i.test(cleanFormat) || (!isDemo && !isComedy && !isStory);

  const formatHookRule = isDemo
    ? `FORMAT HOOK RULE (PRODUCT DEMO):
Hooks MUST focus on instant physical demonstration, visual proof, sensory action, or immediate before-and-after contrast in the first 3 seconds (e.g. tactile hands-on action, instant audio comparison, physical demonstration test). Make the Demonstration and Visual archetypes top priorities.`
    : isComedy
    ? `FORMAT HOOK RULE (SITUATIONAL COMEDY):
Hooks MUST be funny, witty, playful, or paradoxical with a comical opening situation, humorous question, or playful dilemma.`
    : isStory
    ? `FORMAT HOOK RULE (STORYTELLING):
Hooks MUST establish an intriguing interpersonal dilemma, relatable emotional moment, or human conflict between two people.`
    : `FORMAT HOOK RULE (UGC / CREATOR-STYLE):
Hooks MUST sound like a viral Indian mobile creator speaking directly to the viewer with authentic high-energy mobile intimacy ("Stop scrolling if you...", "The truth about...", "My honest test").`;

  let langRule = "";
  if (isEng) {
    langRule = "STRICT: The film's canonical language is ENGLISH. Every hookLine MUST be written in natural, fluent conversational English. Absolutely NO Hindi, NO Devanagari script, NO regional Indian language words or scripts under any circumstances.";
  } else if (isHinglish) {
    langRule = `STRICT: The film's canonical language is HINGLISH.
- Spoken hookLine MUST be natural conversational Hindi mixed with everyday English loan words (e.g. clinic, line, doctor, phone, app, wait, busy), written fully in Devanagari script (Rule M4).
- HARD PROHIBITION: You must NEVER output in Kannada (ಕನ್ನಡ), Tamil (தமிழ்), Telugu (తెలుగు), Malayalam (മലയാളം), or any South Indian language or script, regardless of the brand name, corporate headquarters (e.g. Bangalore/Bengaluru), or business location. The user selected HINGLISH, so the language MUST be conversational Hinglish in Devanagari script.`;
  } else if (isHin) {
    langRule = `STRICT: The film's canonical language is HINDI.
- Spoken hookLine MUST be authentic spoken Hindi written in Devanagari script.
- HARD PROHIBITION: Do NOT output in Kannada, Tamil, Telugu, English, or any other language regardless of brand location.`;
  } else if (isKan) {
    langRule = `STRICT: The film's canonical language is KANNADA.
- Spoken hookLine MUST be authentic spoken Kannada written in Kannada script (ಕನ್ನಡ ಲಿಪಿ).
- HARD PROHIBITION: Do NOT output in Hindi, Devanagari, Tamil, or Telugu.`;
  } else if (isTam) {
    langRule = `STRICT: The film's canonical language is TAMIL.
- Spoken hookLine MUST be authentic spoken Tamil written in Tamil script (தமிழ்).
- HARD PROHIBITION: Do NOT output in Hindi, Devanagari, or other regional languages.`;
  } else if (isTel) {
    langRule = `STRICT: The film's canonical language is TELUGU.
- Spoken hookLine MUST be authentic spoken Telugu written in Telugu script (తెలుగు).
- HARD PROHIBITION: Do NOT output in Hindi, Devanagari, or other regional languages.`;
  } else if (isMar) {
    langRule = `STRICT: The film's canonical language is MARATHI.
- Spoken hookLine MUST be authentic spoken Marathi written in Devanagari script.`;
  } else if (isGuj) {
    langRule = `STRICT: The film's canonical language is GUJARATI.
- Spoken hookLine MUST be authentic spoken Gujarati written in Gujarati script (ગુજરાતી).`;
  } else if (isBen) {
    langRule = `STRICT: The film's canonical language is BENGALI.
- Spoken hookLine MUST be authentic spoken Bengali written in Bengali script (বাংলা).`;
  } else if (isMal) {
    langRule = `STRICT: The film's canonical language is MALAYALAM.
- Spoken hookLine MUST be authentic spoken Malayalam written in Malayalam script (മലയാളം).`;
  } else if (isPun) {
    langRule = `STRICT: The film's canonical language is PUNJABI.
- Spoken hookLine MUST be authentic spoken Punjabi written in Gurmukhi script (ਗੁਰਮੁਖੀ).`;
  } else {
    langRule = `STRICT: The film's canonical language is ${language}. Spoken hookLine MUST be in authentic spoken ${language}.`;
  }

  const system = `You are a short-form video viral hook specialist for Instagram Reels and YouTube Shorts.
Generate 5 to 7 high-impact commercial opening hooks (first 3 seconds).
Each hook must span a distinct archetype:
- Verbal (provocative question or line)
- Visual (compelling physical movement / near-mishap / intriguing object)
- Curiosity (counter-intuitive knowledge)
- Problem / Relatable Crisis (everyday urgency)
- Creator / UGC (direct to camera insider tip)
- Demonstration (instant before-and-after action)

FORMAT ENFORCEMENT (${cleanFormat}):
${formatHookRule}

MANDATORY LANGUAGE ENFORCEMENT:
${langRule}
CRITICAL PRINCIPLE: Never infer output language from the brand name, product category, city, country, corporate headquarters, or cultural context. The film's explicit language setting (${language}) is the ONLY source of truth.

Provide:
- archetype (name of the hook style)
- hookLine: spoken line strictly in ${language} (${isEng ? "natural conversational English only" : isHinglish || isHin || isMar ? "Devanagari script" : isKan ? "Kannada script (ಕನ್ನಡ)" : isTam ? "Tamil script (தமிழ்)" : isTel ? "Telugu script (తెలుగు)" : `${language} script`})
- visualAction: vivid physical opening action in English (1-2 sentences)
- recommended: true for the top option

Return valid JSON between @@JSON@@ and @@END@@:
@@JSON@@
[
  {
    "id": "hook_1",
    "archetype": "Demonstration",
    "hookLine": "...",
    "visualAction": "...",
    "angle": "Instant physical demonstration",
    "recommended": true
  }
]
@@END@@`;

  const content = `BRAND: ${businessName} (${businessType})
BRIEF: ${brief || "Promote brand"}
CHOSEN FORMAT: ${cleanFormat}
SELECTED CREATIVE DIRECTION: ${direction?.title || "Everyday Relatable"} — ${direction?.description || ""}
CANONICAL FILM LANGUAGE: ${language}
LOCATION: ${direction?.town || "Pan-India / Universal"}`;

  const MAX_RETRIES = 2;
  let lastFailureReason = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const retryCorrection = attempt > 0 && lastFailureReason
      ? `\n\nCRITICAL RETRY CORRECTION (Attempt ${attempt + 1}):
Your previous output was REJECTED because: ${lastFailureReason}.
You MUST generate spoken hooks strictly complying with ${language}.
Under NO circumstances output Kannada (ಕನ್ನಡ), Tamil (தமிழ்), Telugu (తెలుగు), or any other language when ${language} is requested.`
      : "";

    try {
      const raw = await callClaude({
        system: system + retryCorrection,
        content: content + (attempt > 0 ? `\n\n(Retry ${attempt}: strictly adhere to ${language})` : ""),
        maxTokens: 2000,
        thinking: false,
      });
      let list = parseJSONBlock(raw);
      if (list && Array.isArray(list.hooks)) list = list.hooks;
      if (Array.isArray(list) && list.length > 0) {
        list = list.map((h, i) => ({
          ...h,
          id: h.id || `hook_${i + 1}`,
          hookLine: h.hookLine || h.text || h.hook || "",
          text: h.text || h.hookLine || h.hook || "",
          archetype: h.archetype || h.type || "Problem",
          type: h.type || (h.archetype ? h.archetype.split("/")[0].trim() : "Problem"),
        }));

        if (!isExplicit) {
          return list;
        }

        const val = validateHooksList(list, language);
        if (val.valid) {
          return list;
        }
        lastFailureReason = val.error;
        console.warn(`[hooks] attempt ${attempt + 1} validation failure for language "${language}": ${val.error}`);
      } else {
        lastFailureReason = "Unparseable or empty hooks list";
      }
    } catch (e) {
      console.warn(`[hooks] attempt ${attempt + 1} call error:`, e.message);
      lastFailureReason = e.message;
    }
  }

  console.warn(`[hooks] retries exhausted for language "${language}". Utilizing verified language-appropriate fallback.`);

  const getHookLine = (eng, hin, hing, mar, kan, tam, tel) => {
    if (isKan) return kan || eng;
    if (isTam) return tam || eng;
    if (isTel) return tel || eng;
    if (isMar) return mar || hin;
    if (isHinglish) return hing || hin;
    if (isHin) return hin;
    return eng; // English is the canonical default
  };

  return [
    {
      id: "hook_1",
      archetype: "Problem / Everyday Crisis",
      type: "Problem",
      hookLine: getHookLine(
        "Wait, did you run out of this again?",
        "अरे, ये फिर से ख़त्म हो गया?!",
        "Wait, ये फिर से ख़त्म हो गया?!",
        "अरे, हे पुन्हा संपले की काय?!",
        "ನೋಡಿ — ಇದು ಮತ್ತೆ ಮುಗಿದುಹೋಯ್ತಾ?!",
        "நில்லுங்கள் — இது மறுபடியும் தீர்ந்துவிட்டதா?!",
        "ఆగండి — ఇది మళ్లీ అయిపోయిందా?!"
      ),
      text: getHookLine(
        "Wait, did you run out of this again?",
        "अरे, ये फिर से ख़त्म हो गया?!",
        "Wait, ये फिर से ख़त्म हो गया?!",
        "अरे, हे पुन्हा संपले की काय?!",
        "ನೋಡಿ — ಇದು ಮತ್ತೆ ಮುಗಿದುಹೋಯ್ತಾ?!",
        "நில்லுங்கள் — இது மறுபடியும் தீர்ந்துவிட்டதா?!",
        "ఆగండి — ఇది మళ్లీ అయಿపోయిందా?!"
      ),
      visualAction: "A person checks an empty container or shelf with sudden realization and turns around in urgency.",
      angle: "Everyday household panic",
      recommended: true,
    },
    {
      id: "hook_2",
      archetype: "Curiosity / Counter-Intuitive",
      type: "Curiosity",
      hookLine: getHookLine(
        "Most people get this completely wrong.",
        "ज्यादातर लोग यहाँ गलती करते हैं।",
        "90% लोग यहाँ सबसे बड़ी गलती करते हैं।",
        "बहुतेक लोक इथेच चूक करतात.",
        "ಹೆಚ್ಚಿನ ಜನರು ಇಲ್ಲಿಯೇ ತಪ್ಪು ಮಾಡುತ್ತಾರೆ.",
        "பெரும்பாலான மக்கள் இங்குதான் தவறு செய்கிறார்கள்.",
        "చాలా మంది ఇక్కడే పొరపాటు చేస్తారు."
      ),
      text: getHookLine(
        "Most people get this completely wrong.",
        "ज्यादातर लोग यहाँ गलती करते हैं।",
        "90% लोग यहाँ सबसे बड़ी गलती करते हैं।",
        "बहुतेक लोक इथेच चूक करतात.",
        "ಹೆಚ್ಚಿನ ಜನರು ಇಲ್ಲಿಯೇ ತಪ್ಪು ಮಾಡುತ್ತಾರೆ.",
        "பெரும்பாலான மக்கள் இங்குதான் தவறு செய்கிறார்கள்.",
        "చాలా మంది ఇక్కడే పొరపాటు చేస్తారు."
      ),
      visualAction: isStory
        ? "A newcomer pauses hesitantly inside the entrance, taking in the energetic room before making eye contact with the lead trainer."
        : "The speaker holds up two contrasting items directly to the camera lens, gesturing emphatically.",
      angle: "Knowledge gap reveal",
      recommended: false,
    },
    {
      id: "hook_3",
      archetype: isStory ? "Relatable Dilemma" : "Creator / UGC Secret",
      type: isStory ? "Relatable Dilemma" : "Creator / UGC",
      hookLine: getHookLine(
        isStory ? "I almost walked away today, but then this happened." : "If you live in this area, you need to know this.",
        isStory ? "मैं आज बस वापस लौटने ही वाली थी, पर फिर कुछ ऐसा हुआ।" : "अगर आप यहाँ रहते हैं, तो ये बात जान लीजिए।",
        isStory ? "मैं आज बस वापस जाने ही वाली थी, पर फिर ये टर्न आया।" : "अगर आप इस एरिया में रहते हैं, तो ये सीक्रेट जान लीजिए।",
        isStory ? "मी आज मागे फिरणारच होते, पण मग असं काही घडलं." : "जर तुम्ही या भागात राहता, तर हे गुपित नक्की जाणून घ्या.",
        isStory ? "ನಾನು ಇಂದು ಹಿಂತಿರುಗಲಿದ್ದೆ, ಆದರೆ ನಂತರ ಹೀಗಾಯಿತು." : "ನೀವು ಇಲ್ಲೇ ವಾಸಿಸುತ್ತಿದ್ದರೆ, ಈ ವಿಷಯ ನಿಮಗೆ ತಿಳಿದಿರಬೇಕು.",
        isStory ? "நான் இன்று திரும்பிச் செல்லவிருந்தேன், ஆனால் பிறகு இது நடந்தது." : "நீங்கள் இங்கே வசிக்கிறீர்கள் என்றால், இந்த ரகசியம் உங்களுக்குத் தெரிய வேண்டும்.",
        isStory ? "నేను ఈరోజు వెనుదిరగబోయాను, కానీ తర్వాత ఇది జరిగింది." : "మీరు ఇక్కడే ఉంటున్నట్లయితే, ఈ విషయం మీకు తప్పక తెలియాలి."
      ),
      text: getHookLine(
        isStory ? "I almost walked away today, but then this happened." : "If you live in this area, you need to know this.",
        isStory ? "मैं आज बस वापस लौटने ही वाली थी, पर फिर कुछ ऐसा हुआ।" : "अगर आप यहाँ रहते हैं, तो ये बात जान लीजिए।",
        isStory ? "मैं आज बस वापस जाने ही वाली थी, पर फिर ये टर्न आया।" : "अगर आप इस एरिया में रहते हैं, तो ये सीक्रेट जान लीजिए।",
        isStory ? "मी आज मागे फिरणारच होते, पण मग असं काही घडलं." : "जर तुम्ही या भागात राहता, तर हे गुपित नक्की जाणून घ्या.",
        isStory ? "ನಾನು ಇಂದು ಹಿಂತಿರುಗಲಿದ್ದೆ, ಆದರೆ ನಂತರ ಹೀಗಾಯಿತು." : "ನೀವು ಇಲ್ಲೇ ವಾಸಿಸುತ್ತಿದ್ದರೆ, ಈ ವಿಷಯ ನಿಮಗೆ ತಿಳಿದಿರಬೇಕು.",
        isStory ? "நான் இன்று திரும்பிச் செல்லவிருந்தேன், ஆனால் பிறகு இது நடந்தது." : "நீங்கள் இங்கே வசிக்கிறீர்கள் என்றால், இந்த ரகசியம் உங்களுக்குத் தெரிய வேண்டும்.",
        isStory ? "నేను ఈరోజు వెనుదిరగబోయాను, కానీ తర్వాత ఇది జరిగింది." : "మీరు ఇక్కడే ఉంటున్నట్లయితే, ఈ విషయం మీకు తప్పక తెలియాలి."
      ),
      visualAction: isStory
        ? "Two characters interact on the gym floor — one encouraging the other through an initial hesitation with warm reassurance."
        : "Creator leans in closely towards the phone camera with a knowing smile, pointing over their shoulder.",
      angle: "Insider recommendation",
      recommended: false,
    },
    {
      id: "hook_4",
      archetype: "Visual Action",
      type: "Visual",
      hookLine: getHookLine(
        "Stop doing this right now!",
        "रुको, ये गलती मत करना!",
        "रुको, ये गलती मत करना!",
        "थांबा, ही चूक मुळीच करू नका!",
        "ನಿಲ್ಲಿಸಿ, ಈ ತಪ್ಪು ಮಾಡಬೇಡಿ!",
        "நில்லுங்கள், இந்த தவறை செய்யாதீர்கள்!",
        "ఆగండి, ఈ తప్పు చేయకండి!"
      ),
      text: getHookLine(
        "Stop doing this right now!",
        "रुको, ये गलती मत करना!",
        "रुको, ये गलती मत करना!",
        "थांबा, ही चूक मुळीच करू नका!",
        "ನಿಲ್ಲಿಸಿ, ಈ ತಪ್ಪು ಮಾಡಬೇಡಿ!",
        "நில்லுங்கள், இந்த தவறை செய்யாதீர்கள்!",
        "ఆగండి, ఈ తప్పు చేయకండి!"
      ),
      visualAction: "Hands rush in to catch a slipping product just before it hits the counter, freezing the frame.",
      angle: "Immediate motion stop",
      recommended: false,
    },
    {
      id: "hook_5",
      archetype: "Demonstration / Proof",
      type: "Demonstration",
      hookLine: getHookLine(
        "See the difference in literally three seconds.",
        "सिर्फ तीन सेकंड में असली फर्क देखिए।",
        "सिर्फ 3 seconds में असली फर्क देखिए।",
        "फक्त तीन सेकंदात खरा फरक बघा.",
        "ಕೇವಲ 3 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ನಿಜವಾದ ವ್ಯತ್ಯಾಸ ನೋಡಿ.",
        "வெறும் 3 வினாடிகளில் உண்மையான வித்தியாசத்தைப் பாருங்கள்.",
        "కేవలం 3 సెకన్లలో అసలైన తేడాను చూడండి."
      ),
      text: getHookLine(
        "See the difference in literally three seconds.",
        "सिर्फ तीन सेकंड में असली फर्क देखिए।",
        "सिर्फ 3 seconds में असली फर्क देखिए।",
        "फक्त तीन सेकंदात खरा फरक बघा.",
        "ಕೇವಲ 3 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ನಿಜವಾದ ವ್ಯತ್ಯಾಸ ನೋಡಿ.",
        "வெறும் 3 வினாடிகளில் உண்மையான வித்தியாசத்தைப் பாருங்கள்.",
        "కేవలం 3 సెకన్లలో అసలైన తేడాను చూడండి."
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
- Character-driven commercial narrative between two people (e.g. newcomer & trainer, customer & shopkeeper).
- THIRD-PERSON CINEMATIC CAMERA ONLY.
- HARD PROHIBITION: The characters must NEVER hold a phone, NEVER film themselves in selfie mode, and NEVER address the viewer like a vlogger or influencer.
- Staging: Both characters interact in the physical setting, making natural eye contact with each other, not looking into the camera lens.
- Relatable human dilemma or emotional hesitation solved naturally by the service or brand.
- Warm emotional payoff and delightful brand resolution.`;

  const storyLangRule = isEng
    ? "CANONICAL FILM LANGUAGE DIRECTIVE: Output language is strictly ENGLISH. Spoken dialogue in beats MUST be written in natural conversational English. Absolutely NO Hindi or Devanagari script."
    : isHinglish
    ? "CANONICAL FILM LANGUAGE DIRECTIVE: Output language is strictly HINGLISH. Spoken dialogue in beats MUST be written in natural conversational Hinglish in Devanagari script. Under NO circumstances output in Kannada, Tamil, Telugu, or any other regional language."
    : `CANONICAL FILM LANGUAGE DIRECTIVE: Output language is strictly ${language}. Spoken dialogue in beats MUST be written in authentic ${language} (${isHin || isMar ? "Devanagari script" : `${language} script`}).`;

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
        character1: typeof c1 === "object" ? c1 : { name: "Lead", role: cleanFormat.includes("Story") ? "Customer / Member" : cleanFormat.includes("Demo") ? "Demonstrator" : "Host / Creator", appearance: String(c1 || "") },
        character2: typeof c2 === "object" ? c2 : { name: "Supporting", role: cleanFormat.includes("Story") ? "Trainer / Specialist" : "Partner / Customer", appearance: String(c2 || "") },
        characters: {
          character1: typeof c1 === "string" ? c1 : `${c1?.name || "Lead"} (${c1?.role || (cleanFormat.includes("Story") ? "Customer" : "Host")})`,
          character2: typeof c2 === "string" ? c2 : `${c2?.name || "Supporting"} (${c2?.role || (cleanFormat.includes("Story") ? "Trainer" : "Partner")})`,
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

function sanitizeParsedScript(parsed, form, format, creativeDNA, festName) {
  if (!parsed) return parsed;
  if (!parsed.header) parsed.header = {};
  if (!parsed.header.business) parsed.header.business = form.businessName;
  if (!parsed.header.format) parsed.header.format = format;
  if (!parsed.header.lens) parsed.header.lens = creativeDNA?.direction?.lens || "1, Everyday Relatability";
  if (!parsed.header.hook) parsed.header.hook = creativeDNA?.hook?.hookPattern || "Creator Hook";
  if (!parsed.header.moment) parsed.header.moment = festName || "Everyday";

  if (!parsed.character1 && creativeDNA?.character1) {
    parsed.character1 = typeof creativeDNA.character1 === "string" ? creativeDNA.character1 : `${creativeDNA.character1.name} — ${creativeDNA.character1.role || ""}`;
  }
  if (!parsed.character2 && creativeDNA?.character2) {
    parsed.character2 = typeof creativeDNA.character2 === "string" ? creativeDNA.character2 : `${creativeDNA.character2.name} — ${creativeDNA.character2.role || ""}`;
  }
  if (!parsed.setting && creativeDNA?.location) {
    parsed.setting = `${creativeDNA.location.name}. ${creativeDNA.location.details || ""}`;
  }

  if (!Array.isArray(parsed.scenes)) return parsed;

  const char1Name = (parsed.character1 || "").split(/\s[—–-]\s|,|—/)[0].replace(/\(.*?\)/g, "").trim();
  const char2Name = (parsed.character2 || "").split(/\s[—–-]\s|,|—/)[0].replace(/\(.*?\)/g, "").trim();

  parsed.scenes = parsed.scenes.map((sc) => {
    let updated = sc;

    // 1. Ensure visual starts with "Same setting:" (Rule M13b)
    updated = updated.replace(/(Visual\s*:\s*)(?!same setting\b)/i, "$1Same setting: ");

    // 2. Fix M13d: if visual describes characters or dialogue is present, ensure eye contact / looking at each other is stated
    const visualMatch = updated.match(/(Visual\s*:\s*)([\s\S]*?)(?=\n\s*(?:Animation Elements|Sound Design|Dialogue|Audio|Editing Notes)\s*:|$)/i);
    if (visualMatch) {
      const visualBody = visualMatch[2];
      const hasLookAt = /\b(looks?|looking|glances?|glancing|smiles?|smiling|nods?|nodding)\s+(up\s+)?(at|towards|to)\b|\b(turns?|turning)\s+(to|towards)\b|\b(faces?|facing)\b|\beye contact\b|\bmeets? (his|her|their) (eyes|gaze)\b|\bover-the-shoulder\b/i.test(visualBody);
      
      const hasDialogue = /Audio\s*\/\s*Dialogue\s*\/\s*Voiceover\s*:[\s\S]*?[A-Za-z0-9\u0900-\u097F]+\s*:\s*["“][^"”]+["”]/i.test(updated);

      if (hasDialogue && !hasLookAt) {
        const eyePhrase = (char1Name && char2Name)
          ? `${char1Name} and ${char2Name} look at each other as they speak.`
          : `They look at each other as they speak.`;
        const cleanBody = visualBody.trim().replace(/\.?$/, `.`);
        const fixedBody = `${cleanBody} ${eyePhrase}`;
        updated = updated.replace(visualMatch[0], `${visualMatch[1]}${fixedBody}\n`);
      }
    }

    return updated;
  });

  return parsed;
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
- Natural handheld camera feel and high social energy.
- CRITICAL SECTION 6 RULE: The owner/creator speaks in AT MOST 3 of the 4 scenes. Exactly ONE scene (e.g. Scene 2 or Scene 3) must be visual B-roll (showing hands handling or packaging product, counter, or shop atmosphere) with ambient sound or dialogue from Character 2 only. The owner MUST NOT speak in all 4 scenes.`
    : format.includes("Demo")
    ? `FORMAT EXECUTION (PRODUCT DEMO):
- Featured product MUST be introduced and in focus within the first 4 seconds.
- Physical demonstration is central: hands-on tactile interaction and sensory proof.
- Fewer spoken dialogue lines; visual demonstration leads the persuasion.`
    : format.includes("Comedy")
    ? `FORMAT EXECUTION (SITUATIONAL COMEDY):
- Humorous setup in Scene 1, comedic escalation in Scene 2, witty misunderstanding in Scene 3, and funny punchline in Scene 4.
- Exaggerated facial reactions and comedic timing.`
    : `FORMAT EXECUTION (STORYTELLING / NARRATIVE FILM):
- Character-driven narrative tension between two characters in the room (e.g. newcomer & trainer/expert, customer & shop owner).
- THIRD-PERSON CINEMATIC CAMERA: Shot by an invisible cinematic camera observing the room.
- HARD PROHIBITION: Characters must NEVER hold a smartphone, NEVER record in front-facing selfie mode, and NEVER address the viewer as a social media vlogger.
- Eye-line: Both characters must look at, face, and engage with EACH OTHER, not the camera lens.
- Natural emotional dilemma and heartwarming, confidence-building payoff.`;

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
- Every scene Visual MUST start with "Same setting:" maintaining the exact same continuous room (Rule M13b).
- Exactly 2 characters throughout with consistent look and wardrobe.
- Maximum 2 spoken dialogue lines per character per scene.
- Dialogue language: ${form.language}. ${isEng ? "Spoken dialogue MUST be written in natural, fluent conversational English (NO Hindi, NO Devanagari script)." : /hindi|hinglish|marathi/i.test(form.language) ? "Spoken dialogue MUST be written fully in authentic Devanagari script (Rule M4)." : `Spoken dialogue MUST be written in authentic ${form.language} script.`}
- CAMERA SETUP VARIETY (Rule M13c): Use at least 3 distinct camera setups across scenes with motivated camera motion, no two consecutive scenes identical.
- EYE-LINE RULE (Rule M13d): In EVERY scene where two characters talk or interact, the Visual description MUST explicitly state that they look at each other, face each other, or make eye contact (e.g. "Ramesh looks at Sunita as he speaks", "Sunita turns to face Ramesh"). Never omit eye contact when both characters are in the scene or speaking, and never have characters stare into distance or look away.
${format.includes("Demo") ? "- PRODUCT DEMO SPEAKER RULE: Visual demonstration leads. Dialogue is concise and demonstrator-led; single presenter or dual interaction allowed without artificial conversational filler." : format.includes("UGC") ? "- UGC SPEAKER RULE (Section 6): The owner speaks in AT MOST 3 of the 4 scenes (one scene is B-roll or dialogue from character 2 only)." : "- Rotate speakers so dialogue doesn't come exclusively from one character (Rule M10)."}
- Return ONLY the standard @@HEADER@@, @@CHARACTER1@@, @@CHARACTER2@@, @@SETTING@@, @@SCENE@@, and @@RECORD@@ markers. In @@HEADER@@, set Format: ${format}.`;

  const base = buildUserContent(form, fest, [], todayIST(), stageInst);
  const festName = creativeDNA?.direction?.festival?.name || form.occasion || "";
  const gateOpts = { scriptMode: form.scriptMode, previous: [], approvedFormat: format, festival: festName };

  let content = base, parsed, failures = [], attempts = 0;
  for (let i = 0; i <= 3; i++) {
    attempts++;
    if (i > 0) content = buildRepairContent(base, parsed.raw, failures);
    parsed = parseOutput(await callClaude({ system, content, maxTokens: 4000, thinking: false }));
    parsed = sanitizeParsedScript(parsed, form, format, creativeDNA, festName);
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
- Dialogue in ${form?.language || "English"} (${isEng ? "natural conversational English" : /hindi|hinglish|marathi/i.test(form?.language) ? "Devanagari script if Hindi/Hinglish/Marathi" : `authentic ${form?.language} script`}).
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

/**
 * Helper to compile 4 structured scenes into Annex-A script text for video generation.
 */
function compileSimpleScriptText(pkg, businessName) {
  const scenes = pkg.scenes || [];
  const s1 = scenes[0] || {};
  const s2 = scenes[1] || {};
  const s3 = scenes[2] || {};
  const s4 = scenes[3] || {};

  return `ANNEX A
SCENE 1 – HOOK
Visual:
${s1.visual || `Hero opening featuring ${businessName} with clear front-and-center framing.`}
Animation Elements:
Camera: steady medium push-in
Text overlay: none
UI element: none
Transition: cut
Motion graphics: none
Audio / Dialogue / Voiceover:
${s1.dialogue || `${pkg.hookHeadline || "Check this out!"}`}
Sound Design:
Crisp ambient room tone, tactile Foley.
Editing Notes:
Scene duration: ~3s | Output: 1080p

ANNEX A
SCENE 2 – BUILD
Visual:
Same setting: ${s2.visual || `Demonstrating the active service and craftsmanship at ${businessName}.`}
Animation Elements:
Camera: medium two-shot with subtle horizontal pan
Text overlay: none
UI element: none
Transition: cut
Motion graphics: none
Audio / Dialogue / Voiceover:
${s2.dialogue || "Look at the authentic attention to detail."}
Sound Design:
Subtle acoustic Foley, hands-on activity.
Editing Notes:
Scene duration: ~4s | Output: 1080p

ANNEX A
SCENE 3 – TURN
Visual:
Same setting: ${s3.visual || `Customer reaction and positive confirmation of quality at ${businessName}.`}
Animation Elements:
Camera: close medium shot focusing on genuine reaction
Text overlay: none
UI element: none
Transition: cut
Motion graphics: none
Audio / Dialogue / Voiceover:
${s3.dialogue || "This is exactly what I was hoping for."}
Sound Design:
Reassuring ambient warmth, positive chime.
Editing Notes:
Scene duration: ~4s | Output: 1080p

ANNEX A
SCENE 4 – RESOLUTION
Visual:
Same setting: ${s4.visual || `Delighted wrap-up with final brand presentation for ${businessName}.`}
Animation Elements:
Camera: gentle pull-out to hold
Text overlay: none
UI element: none
Transition: cut
Motion graphics: none
Audio / Dialogue / Voiceover:
${s4.dialogue || `${pkg.callToAction || `Visit ${businessName} today!`}`}
Sound Design:
Upbeat melodic finish, clear resonant hold.
Editing Notes:
Scene duration: ~4s | Output: 1080p`;
}

/**
 * Normalizes an Ad Package to guarantee setting, character1, character2,
 * hook, and fullScriptText are non-empty for downstream video generation.
 */
function normalizeSimpleAdPackage(pkg, brand, bType) {
  const char1 = (
    pkg.character1 ||
    pkg.characters?.lead ||
    pkg.characters?.character1 ||
    (typeof pkg.characters === "string" ? pkg.characters : "") ||
    `${brand || "Store"} Specialist / Host`
  ).trim();
  const char2 = (
    pkg.character2 ||
    pkg.characters?.customer ||
    pkg.characters?.character2 ||
    "Customer"
  ).trim();
  const pkgSetting = (
    pkg.setting ||
    `Modern, well-lit ${bType || "store"} environment at ${brand || "the store"}`
  ).trim();

  return {
    ...pkg,
    character1: char1,
    character2: char2,
    characters: pkg.characters || { lead: char1, customer: char2 },
    setting: pkgSetting,
    hook: pkg.hook || pkg.hookHeadline || "",
    hookHeadline: pkg.hookHeadline || pkg.hook || "",
    fullScriptText: pkg.fullScriptText || compileSimpleScriptText(pkg, brand),
  };
}

/**
 * Curated fallback ad packages for instant recovery when offline or LLM limit reached.
 */
function getFallbackAdPackages({ businessName, businessType = "Local Business", town = "", brief = "", language = "English" }) {
  const isEng = !language || /eng/i.test(language);
  const isHin = language && /hin/i.test(language);
  const isMar = language && /mar/i.test(language);
  const offer = brief || `${businessType} Special`;
  const city = town ? ` in ${town}` : "";
  const catLower = `${businessType} ${brief}`.toLowerCase();

  const isJewellery = /jewel|gold|diamond|ornament|silver|gem/i.test(catLower);
  const isSweets = /sweet|mithai|bakery|cake|dessert/i.test(catLower);
  const isFashion = /saree|apparel|clothing|fashion|boutique|dress|garment|textile/i.test(catLower);

  if (isJewellery) {
    return [
      {
        id: "pkg_problem_relief",
        badge: "Highest Converting",
        angle: "Problem & Relief",
        title: "Hallmark Purity, Zero Guesswork",
        hookHeadline: isEng
          ? "Worried about gold purity and high making charges? Look closely at this."
          : isHin
          ? "सोने की शुद्धता और भारी मेकिंग चार्ज की चिंता? ये देखिए!"
          : "सोन्याच्या शुद्धतेची आणि मेकिंग चार्जेसची काळजी? हे नक्की बघा!",
        narrativeSummary: `Addresses common customer doubts on gold purity and making charges by spotlighting ${businessName}'s 100% BIS Hallmarked jewellery and transparent pricing.`,
        callToAction: isEng
          ? `Visit ${businessName}${city} today to explore the new collection!`
          : isHin
          ? `आज ही ${businessName} आइए और नया कलेक्शन देखिए!`
          : `आजच ${businessName} ला भेट द्या आणि नवीन डिझाईन्स बघा!`,
        setting: `Elegant plush showroom counter at ${businessName}${city} with gold and diamond display trays under warm spotlight.`,
        characters: { lead: "Jewellery Specialist", customer: "Customer" },
        scenes: [
          {
            sceneNumber: 1,
            beat: "Hook",
            timing: "0-3s",
            visual: `Lead holds an exquisite BIS 916 gold ornament under spotlight at the ${businessName} showroom counter.`,
            dialogue: isEng
              ? `Lead: "Worried about gold purity and high making charges? Look closely at this."`
              : isHin
              ? `Lead: "सोने की शुद्धता और भारी मेकिंग चार्ज की चिंता? ये देखिए!"`
              : `Lead: "सोन्याच्या शुद्धतेची आणि मेकिंग चार्जेसची काळजी? हे नक्की बघा!"`,
          },
          {
            sceneNumber: 2,
            beat: "Build",
            timing: "3-8s",
            visual: `Lead presents the piece to customer, pointing to the laser-engraved 916 BIS Hallmark stamp and transparent tag for ${offer}.`,
            dialogue: isEng
              ? `Lead: "At ${businessName}, every single design is 100% BIS Hallmarked with crystal-clear making charges."`
              : isHin
              ? `Lead: "${businessName} में हर गहना 100% BIS हॉलमार्क शुद्धता और पारदर्शी मेकिंग चार्ज के साथ आता है।" `
              : `Lead: "${businessName} मध्ये प्रत्येक दागिन्यावर १००% BIS हॉलमार्क आणि पारदर्शी घडणावळ मिळते."`,
          },
          {
            sceneNumber: 3,
            beat: "Turn",
            timing: "8-14s",
            visual: `Customer tries on the jewellery in front of the showroom mirror with delight and confidence.`,
            dialogue: isEng
              ? `Customer: "The craftsmanship is stunning, and the pricing is completely honest!"`
              : isHin
              ? `Customer: "कारीगरी भी लाजवाब है और कीमत भी पूरी तरह सच्ची!"`
              : `Customer: "डिझाइन अप्रतिम आहे आणि खात्रीशीर भाव मिळाला!"`,
          },
          {
            sceneNumber: 4,
            beat: "Resolution",
            timing: "14-20s",
            visual: `Lead places the jewellery into a luxury velvet presentation box as store location and contact details appear.`,
            dialogue: isEng
              ? `Lead: "Visit ${businessName}${city} today—celebrate every milestone with timeless gold!"`
              : isHin
              ? `Lead: "आज ही ${businessName} पधारिए—अपने हर पल को सोने सा चमकाइए!"`
              : `Lead: "आजच ${businessName} ला भेट द्या—आनंद साजरा करा!"`,
          },
        ],
      },
      {
        id: "pkg_customer_trust",
        badge: "Most Trusted",
        angle: "Customer Story & Trust",
        title: "The Milestone Heirloom",
        hookHeadline: isEng
          ? `Why do families across town trust ${businessName} for every milestone?`
          : isHin
          ? `शादी और त्योहारों के लिए शहर का भरोसा ${businessName} पर ही क्यों है?`
          : `प्रत्येक शुभकार्यासाठी सगळे ${businessName} वरच विश्वास का ठेवतात?`,
        narrativeSummary: `A loyal family shares why ${businessName} is their lifelong choice for wedding jewellery and gold exchange.`,
        callToAction: isEng
          ? `Step into ${businessName}${city} and find your family's next heirloom!`
          : isHin
          ? `आज ही ${businessName} आइए और अपनी पसंद का गहना चुनिए!`
          : `आजच ${businessName} ला भेट द्या!`,
        setting: `Warm bridal lounge inside ${businessName}${city} with velvet seating and sparkling necklace sets.`,
        characters: { lead: "Showroom Stylist", customer: "Delighted Bride / Customer" },
        scenes: [
          {
            sceneNumber: 1,
            beat: "Hook",
            timing: "0-3s",
            visual: `Customer admires a handcrafted bridal necklace set in front of an ornate showroom mirror.`,
            dialogue: isEng
              ? `Customer: "Why do families across town trust ${businessName} for every milestone? Here is why."`
              : isHin
              ? `Customer: "शादी और त्योहारों के लिए सब ${businessName} पर ही भरोसा क्यों करते हैं? वजह साफ है।" `
              : `Customer: "प्रत्येक शुभकार्यासाठी सगळे ${businessName} वरच का विश्वास ठेवतात? कारण अगदी स्पष्ट आहे."`,
          },
          {
            sceneNumber: 2,
            beat: "Build",
            timing: "3-8s",
            visual: `Lead displays certified uncut diamond and antique gold designs, presenting the authenticity certificate.`,
            dialogue: isEng
              ? `Lead: "Generations of families trust us for guaranteed purity, lifetime exchange, and handcrafted perfection."`
              : isHin
              ? `Lead: "सालों से परिवारों का भरोसा है हमारी शुद्धता, लाइफटाइम एक्सचेंज और बेमिसाल कारीगरी पर।" `
              : `Lead: "अनेक वर्षांचा विश्वास—१००% शुद्धता, लाइफटाइम एक्सचेंज आणि सुंदर कारागिरी."`,
          },
          {
            sceneNumber: 3,
            beat: "Turn",
            timing: "8-14s",
            visual: `Customer's eyes light up as the full bridal set catches the light, glowing with happiness.`,
            dialogue: isEng
              ? `Customer: "Every single piece feels like a royal heirloom!"`
              : isHin
              ? `Customer: "हर एक गहना सच में शाही विरासत जैसा लगता है!"`
              : `Customer: "प्रत्येक दागिना अगदी राजेशाही वाटतो!"`,
          },
          {
            sceneNumber: 4,
            beat: "Resolution",
            timing: "14-20s",
            visual: `Lead hands over the branded luxury gift bag and authenticity certificate with a warm smile.`,
            dialogue: isEng
              ? `Lead: "Step into ${businessName}${city} today—we make every milestone unforgettable!"`
              : isHin
              ? `Lead: "आज ही ${businessName} पधारिए—अपनी खुशियों को खास बनाइए!"`
              : `Lead: "आजच ${businessName} ला भेट द्या!"`,
          },
        ],
      },
      {
        id: "pkg_festive_offer",
        badge: "Highest Urgency",
        angle: "Limited-Time Special Offer",
        title: "Festive Gold & Diamond Celebration",
        hookHeadline: isEng
          ? `Stop scrolling—our biggest festive jewellery celebration at ${businessName} is on!`
          : isHin
          ? `रुकिए! ${businessName} का सबसे बड़ा फेस्टिव ज्वेलरी ऑफर शुरू हो चुका है!`
          : `थांबा! ${businessName} चा सर्वात मोठा फेस्टिव्ह ज्वेलरी ऑफर आला आहे!`,
        narrativeSummary: `High-energy festive promotion spotlighting ${offer} with special making charge benefits and gold exchange bonus.`,
        callToAction: isEng
          ? `Visit ${businessName}${city} this week—festive offer valid while collections last!`
          : isHin
          ? `आज ही ${businessName} पधारिए—ऑफर सीमित समय के लिए!`
          : `आजच ${businessName} ला भेट द्या!`,
        setting: `Festive-decorated showroom counter at ${businessName}${city} adorned with marigold garlands and brass lamps.`,
        characters: { lead: "Store Host", customer: "Delighted Shopper" },
        scenes: [
          {
            sceneNumber: 1,
            beat: "Hook",
            timing: "0-3s",
            visual: `Host steps into frame with festive elegance, showcasing a sparkling gold necklace against a velvet backdrop.`,
            dialogue: isEng
              ? `Lead: "Stop scrolling—our biggest festive celebration at ${businessName} is here!"`
              : isHin
              ? `Lead: "रुकिए! ${businessName} का सबसे बड़ा फेस्टिव ऑफर आ गया है!"`
              : `Lead: "थांबा! ${businessName} चा सर्वात मोठा सणासुदीचा ऑफर आला आहे!"`,
          },
          {
            sceneNumber: 2,
            beat: "Build",
            timing: "3-8s",
            visual: `Host showcases ${offer} highlighting special festive tags with discounted making charges and gold bonus.`,
            dialogue: isEng
              ? `Lead: "Celebrate this season with ${offer}—special making charges and guaranteed exchange bonus!"`
              : isHin
              ? `Lead: "इस त्योहारी सीज़न में पाइए ${offer}—मेकिंग चार्ज पर विशेष छूट और शानदार उपहार!"`
              : `Lead: "या सणात मिळवा ${offer}—घडणावळीवर भरघोस सवलत आणि खास भेटवस्तू!"`,
          },
          {
            sceneNumber: 3,
            beat: "Turn",
            timing: "8-14s",
            visual: `Delighted customer receives complimentary festive gift box alongside their jewellery purchase.`,
            dialogue: isEng
              ? `Customer: "Unbeatable designs, zero hassle, and the best festive deal in town!"`
              : isHin
              ? `Customer: "खूबसूरत डिज़ाइन्स और शहर का सबसे बेहतरीन फेस्टिव ऑफर!"`
              : `Customer: "अप्रतिम डिझाइन आणि सणाचा सर्वात मोठा फायदा!"`,
          },
          {
            sceneNumber: 4,
            beat: "Resolution",
            timing: "14-20s",
            visual: `Customer and host smile together as showroom address, festive offer dates, and contact details appear clearly.`,
            dialogue: isEng
              ? `Lead: "Visit ${businessName}${city} today—limited-time festive celebration!"`
              : isHin
              ? `Lead: "आज ही ${businessName} पधारिए—ऑफर सीमित समय के लिए!"`
              : `Lead: "आजच ${businessName} ला भेट द्या!"`,
          },
        ],
      },
    ].map((pkg) => normalizeSimpleAdPackage(pkg, businessName, businessType));
  }

  if (isSweets) {
    return [
      {
        id: "pkg_problem_relief",
        badge: "Highest Converting",
        angle: "Problem & Relief",
        title: "Pure Desi Ghee, Zero Compromise",
        hookHeadline: isEng
          ? "Tired of questionable ingredients in festival sweets? Taste the difference here."
          : isHin
          ? "सस्ती मिलावट वाली मिठाइयों से परेशान हैं? असली स्वाद यहाँ देखिए!"
          : "मिठायांमध्ये भेसळीची भीती वाटते? अस्सल चव इथे अनुभवा!",
        narrativeSummary: `Highlights ${businessName}'s 100% pure desi ghee preparation and daily fresh authenticity.`,
        callToAction: isEng
          ? `Visit ${businessName}${city} today for pure festive sweetness!`
          : isHin
          ? `आज ही ${businessName} आइए और शुद्ध देसी घी की मिठाइयां पाइए!`
          : `आजच ${businessName} ला भेट द्या!`,
        setting: `Gleaming sweet shop counter at ${businessName}${city} filled with traditional brass platters of fresh sweets.`,
        characters: { lead: "Sweet Maker / Host", customer: "Customer" },
        scenes: [
          {
            sceneNumber: 1,
            beat: "Hook",
            timing: "0-3s",
            visual: `Lead breaks open a fresh, golden sweet under warm lighting showing rich texture and pure desi ghee.`,
            dialogue: isEng
              ? `Lead: "Tired of questionable ingredients in festival sweets? Taste the difference here."`
              : isHin
              ? `Lead: "सस्ती मिलावट वाली मिठाइयों से परेशान हैं? असली स्वाद यहाँ देखिए!"`
              : `Lead: "मिठायांमध्ये भेसळीची भीती वाटते? अस्सल चव इथे अनुभवा!"`,
          },
          {
            sceneNumber: 2,
            beat: "Build",
            timing: "3-8s",
            visual: `Lead presents a fresh platter of ${offer} made with pure saffron, pistachio, and fresh milk.`,
            dialogue: isEng
              ? `Lead: "At ${businessName}, every batch is made fresh daily using 100% pure desi ghee and time-honored recipes."`
              : isHin
              ? `Lead: "${businessName} में हर मिठाई बनती है 100% शुद्ध देसी घी और ताज़ा मेवों से।" `
              : `Lead: "${businessName} मध्ये प्रत्येक गोड पदार्थ १००% शुद्ध तूप आणि ताज्या घटकांपासून बनतो."`,
          },
          {
            sceneNumber: 3,
            beat: "Turn",
            timing: "8-14s",
            visual: `Customer takes a bite, closing their eyes in authentic delight at the melt-in-mouth taste.`,
            dialogue: isEng
              ? `Customer: "Melt-in-mouth perfection! You can taste the genuine purity immediately."`
              : isHin
              ? `Customer: "मुंह में घुलने वाला स्वाद! असली शुद्धता का स्वाद साफ पता चलता है।" `
              : `Customer: "अतिशय चविष्ट! अस्सल तुपाची चव लगेच समजते."`,
          },
          {
            sceneNumber: 4,
            beat: "Resolution",
            timing: "14-20s",
            visual: `Lead packs an elegant festive gift box with royal ribbon as store location flashes on screen.`,
            dialogue: isEng
              ? `Lead: "Visit ${businessName}${city} today—sweeten every celebration with pure joy!"`
              : isHin
              ? `Lead: "आज ही ${businessName} आइए—अपनी खुशियों में शुद्ध मिठास घोलिए!"`
              : `Lead: "आजच ${businessName} ला भेट द्या!"`,
          },
        ],
      },
      {
        id: "pkg_customer_trust",
        badge: "Most Trusted",
        angle: "Customer Story & Trust",
        title: "The Neighborhood Tradition",
        hookHeadline: isEng
          ? `Why is ${businessName} the first choice for every family celebration?`
          : isHin
          ? `हर त्योहार पर पूरा शहर ${businessName} की मिठाई ही क्यों पसंद करता है?`
          : `प्रत्येक सणासाठी सगळे ${businessName} चेच नाव का घेतात?`,
        narrativeSummary: `A loyal family shares why ${businessName} has been their trusted sweet shop for decades.`,
        callToAction: isEng
          ? `Pick up your festive favorites at ${businessName}${city} today!`
          : isHin
          ? `आज ही ${businessName} आइए और त्योहार की मिठास ले जाइए!`
          : `आजच ${businessName} ला भेट द्या!`,
        setting: `Bustling, welcoming sweet shop counter at ${businessName}${city}.`,
        characters: { lead: "Store Host", customer: "Delighted Customer" },
        scenes: [
          {
            sceneNumber: 1,
            beat: "Hook",
            timing: "0-3s",
            visual: `Customer stands by the festive sweet counter pointing enthusiastically to the display.`,
            dialogue: isEng
              ? `Customer: "Why is ${businessName} the first choice for every family celebration?"`
              : isHin
              ? `Customer: "हर त्योहार पर पूरा शहर ${businessName} की मिठाई ही क्यों पसंद करता है?" `
              : `Customer: "प्रत्येक सणासाठी सगळे ${businessName} चेच नाव का घेतात?"`,
          },
          {
            sceneNumber: 2,
            beat: "Build",
            timing: "3-8s",
            visual: `Lead arranges festive assorted gift hampers featuring ${offer} with ornate gold boxes.`,
            dialogue: isEng
              ? `Lead: "Decades of trust, zero compromise on hygiene, and the authentic taste of tradition."`
              : isHin
              ? `Lead: "सालों का अटूट विश्वास, पूरी सफाई और वही पुराना प्रामाणिक स्वाद।" `
              : `Lead: "वर्षानुवर्षांचा विश्वास, उत्तम स्वच्छता आणि पारंपारिक चव."`,
          },
          {
            sceneNumber: 3,
            beat: "Turn",
            timing: "8-14s",
            visual: `Customer picks up festive hampers with a huge smile, nodding with satisfaction.`,
            dialogue: isEng
              ? `Customer: "Our guests always rave about these sweets—they never settle for anything else!"`
              : isHin
              ? `Customer: "हमारे मेहमान हमेशा यहाँ की मिठाई की तारीफ करते हैं!"`
              : `Customer: "आमच्याकडे सणाला फक्त इथलीच मिठाई येते!"`,
          },
          {
            sceneNumber: 4,
            beat: "Resolution",
            timing: "14-20s",
            visual: `Host hands over beautifully wrapped gift hampers with festive greeting card and shop address.`,
            dialogue: isEng
              ? `Lead: "Visit ${businessName}${city} today and take home the sweetness of celebration!"`
              : isHin
              ? `Lead: "आज ही ${businessName} आइए और खुशियों के डिब्बे घर ले जाइए!"`
              : `Lead: "आजच ${businessName} ला भेट द्या!"`,
          },
        ],
      },
      {
        id: "pkg_festive_offer",
        badge: "Highest Urgency",
        angle: "Limited-Time Special Offer",
        title: "Festive Sweet Box Special",
        hookHeadline: isEng
          ? `Stop scrolling—our festive sweet pre-orders at ${businessName} are officially live!`
          : isHin
          ? `रुकिए! ${businessName} की फेस्टिव मिठाई बुकिंग शुरू हो चुकी है!`
          : `थांबा! ${businessName} ची सणासुदीची खास ऑफर सुरू झाली आहे!`,
        narrativeSummary: `High-energy festive ad spotlighting ${offer} with special festive pre-order pricing.`,
        callToAction: isEng
          ? `Pre-order or visit ${businessName}${city} today before festive slots sell out!`
          : isHin
          ? `आज ही ${businessName} आइए या प्री-ऑर्डर कीजिए!`
          : `आजच ${businessName} ला भेट द्या!`,
        setting: `Festive-decorated sweet shop storefront at ${businessName}${city}.`,
        characters: { lead: "Store Host", customer: "Happy Shopper" },
        scenes: [
          {
            sceneNumber: 1,
            beat: "Hook",
            timing: "0-3s",
            visual: `Host holds up a premium festive gift hamper filled with assorted sweets and dry fruits.`,
            dialogue: isEng
              ? `Lead: "Stop scrolling—our biggest festive sweet celebration at ${businessName} is here!"`
              : isHin
              ? `Lead: "रुकिए! ${businessName} का सबसे बड़ा फेस्टिव स्वीट ऑफर आ गया है!"`
              : `Lead: "थांबा! ${businessName} चा सर्वात मोठा फेस्टिव्ह ऑफर आला आहे!"`,
          },
          {
            sceneNumber: 2,
            beat: "Build",
            timing: "3-8s",
            visual: `Host shows ${offer} with festive savings tag and elegant packaging.`,
            dialogue: isEng
              ? `Lead: "Get your special ${offer} box this week with exclusive festive savings!"`
              : isHin
              ? `Lead: "इस हफ्ते पाइए खास ${offer} स्पेशल फेस्टिव डिस्काउंट के साथ!"`
              : `Lead: "या आठवड्यात मिळवा ${offer} खास सवलतीत!"`,
          },
          {
            sceneNumber: 3,
            beat: "Turn",
            timing: "8-14s",
            visual: `Customer smiles warmly with packed festive boxes in hand, delighted with the packaging and freshness.`,
            dialogue: isEng
              ? `Customer: "Pure quality, gorgeous gift packaging, and unbeatable taste!"`
              : isHin
              ? `Customer: "शुद्ध क्वालिटी, खूबसूरत पैकिंग और शानदार स्वाद!"`
              : `Customer: "उत्कृष्ट दर्जा आणि सुंदर पॅकिंग!"`,
          },
          {
            sceneNumber: 4,
            beat: "Resolution",
            timing: "14-20s",
            visual: `Host and customer wave with festive cheer as shop location and phone number flash on screen.`,
            dialogue: isEng
              ? `Lead: "Visit ${businessName}${city} today—limited festive stock available!"`
              : isHin
              ? `Lead: "आज ही ${businessName} पधारिए—ऑफर सीमित समय के लिए!"`
              : `Lead: "आजच ${businessName} ला भेट द्या!"`,
          },
        ],
      },
    ].map((pkg) => normalizeSimpleAdPackage(pkg, businessName, businessType));
  }

  // General fallback (refined to be universally appropriate across retail and local businesses)
  return [
    {
      id: "pkg_problem_relief",
      badge: "Highest Converting",
      angle: "Problem & Relief",
      title: "The Search Ended",
      hookHeadline: isEng
        ? "Tired of compromising on quality and service? Watch this."
        : isHin
        ? "क्वालिटी से समझौता करके परेशान हैं? ये देखिए!"
        : "क्वालिटीशी तडजोड करून कंटाळला आहात? हे नक्की बघा!",
      narrativeSummary: `Addresses common customer frustrations and shows how ${businessName} provides dependable quality.`,
      callToAction: isEng
        ? `Visit ${businessName}${city} today for trusted quality!`
        : isHin
        ? `आज ही ${businessName} आइए और बेहतरीन अनुभव पाइए!`
        : `आजच ${businessName} ला भेट द्या!`,
      setting: `Welcoming storefront counter at ${businessName}${city}.`,
      characters: { lead: "Owner / Host", customer: "Customer" },
      scenes: [
        {
          sceneNumber: 1,
          beat: "Hook",
          timing: "0-3s",
          visual: `Lead stands at the ${businessName} counter looking directly at camera with empathetic energy.`,
          dialogue: isEng
            ? "Tired of compromising on quality and service? Watch this."
            : isHin
            ? "क्वालिटी से समझौता करके परेशान हैं? ये देखिए!"
            : "क्वालिटीशी तडजोड करून कंटाळला आहात? हे नक्की बघा!",
        },
        {
          sceneNumber: 2,
          beat: "Build",
          timing: "3-8s",
          visual: `Customer arrives explaining their needs; Lead points reassuringly to ${offer} on display.`,
          dialogue: isEng
            ? `Lead: "Don't worry. At ${businessName}, we guarantee 100% genuine quality every time."`
            : isHin
            ? `Lead: "चिंता मत कीजिए, ${businessName} में हर काम पूरी गारंटी के साथ होता है।" `
            : `Lead: "काळजी नको, ${businessName} मध्ये १००% खात्रीशीर अनुभव मिळतो."`,
        },
        {
          sceneNumber: 3,
          beat: "Turn",
          timing: "8-14s",
          visual: `Customer inspects the selection with visible relief and smiles warmly at the result.`,
          dialogue: isEng
            ? `Customer: "Wow, that was fast, honest, and completely hassle-free!"`
            : isHin
            ? `Customer: "अरे वाह, इतना तेज़ और बिना किसी झंझट के!"`
            : `Customer: "अरे वा, अगदी पटकन आणि प्रामाणिक अनुभव मिळाला!"`,
        },
        {
          sceneNumber: 4,
          beat: "Resolution",
          timing: "14-20s",
          visual: `Lead smiles warmly next to the official ${businessName} store guarantee and contact details.`,
          dialogue: isEng
            ? `Lead: "Visit ${businessName}${city} today—we've got you covered!"`
            : isHin
            ? `Lead: "आज ही ${businessName} आइए—हम हमेशा आपके साथ हैं!"`
            : `Lead: "आजच ${businessName} ला भेट द्या!"`,
        },
      ],
    },
    {
      id: "pkg_customer_trust",
      badge: "Most Trusted",
      angle: "Customer Story & Trust",
      title: "The Neighborhood Favorite",
      hookHeadline: isEng
        ? `Why does everyone recommend ${businessName}?`
        : isHin
        ? `सब लोग ${businessName} की ही तारीफ क्यों करते हैं?`
        : `सगळे ${businessName} चेच नाव का घेतात?`,
      narrativeSummary: `A genuine customer shares why ${businessName} is their go-to choice for ${businessType}.`,
      callToAction: isEng
        ? `Find out why your neighbors love ${businessName}${city}!`
        : isHin
        ? `आइए और खुद देखिए कि ${businessName} पर इतना भरोसा क्यों है!`
        : `अनुभव घ्या आणि आजच भेट द्या!`,
      setting: `Bright, tidy customer lounge and showroom at ${businessName}${city}.`,
      characters: { lead: "Lead Specialist", customer: "Customer" },
      scenes: [
        {
          sceneNumber: 1,
          beat: "Hook",
          timing: "0-3s",
          visual: `Customer sits comfortably at ${businessName}, looking directly into camera with genuine enthusiasm.`,
          dialogue: isEng
            ? `Customer: "Why does everyone recommend ${businessName}? Here's my honest review."`
            : isHin
            ? `Customer: "सब लोग ${businessName} की ही तारीफ क्यों करते हैं? जानिए मेरा सच्चा अनुभव।" `
            : `Customer: "सगळे ${businessName} चेच नाव का घेतात? हा माझा खरा अनुभव बघा."`,
        },
        {
          sceneNumber: 2,
          beat: "Build",
          timing: "3-8s",
          visual: `Lead walks customer through ${offer}, showing clear pricing and premium standards without upselling.`,
          dialogue: isEng
            ? `Lead: "We believe in complete transparency, zero hidden charges, and honest work."`
            : isHin
            ? `Lead: "हम मानते हैं पूरी ईमानदारी और बिना किसी छुपे चार्ज के काम में।" `
            : `Lead: "आम्ही मानतो पूर्ण पारदर्शकता आणि प्रामाणिक सेवेत."`,
        },
        {
          sceneNumber: 3,
          beat: "Turn",
          timing: "8-14s",
          visual: `Customer checks out happily, holding their receipt with a confident nod.`,
          dialogue: isEng
            ? `Customer: "Saved time, saved money, and the team treated me like family."`
            : isHin
            ? `Customer: "पैसे भी बचे, समय भी बचा और व्यवहार तो एकदम अपने परिवार जैसा!"`
            : `Customer: "वेळ आणि पैसा दोन्ही वाचले, आणि घरच्यासारखी वागणूक मिळाली!"`,
        },
        {
          sceneNumber: 4,
          beat: "Resolution",
          timing: "14-20s",
          visual: `Lead and customer stand together outside the entrance with Google 5-star rating overlay.`,
          dialogue: isEng
            ? `Customer: "Don't think twice—head to ${businessName}${city}!"`
            : isHin
            ? `Customer: "सोचिए मत, आज ही ${businessName} आइए!"`
            : `Customer: "जास्त विचार करू नका, आजच ${businessName} ला भेट द्या!"`,
        },
      ],
    },
    {
      id: "pkg_festive_offer",
      badge: "Highest Urgency",
      angle: "Limited-Time Special Offer",
      title: "The Seasonal Spotlight",
      hookHeadline: isEng
        ? "Stop scrolling—our biggest offer of the season is here!"
        : isHin
        ? "रुकिए! इस सीज़न का सबसे बड़ा ऑफर आ गया है!"
        : "थांबा! या हंगामाची सर्वात मोठी ऑफर आली आहे!",
      narrativeSummary: `High-energy commercial spotlighting ${offer} with clear savings and instant action.`,
      callToAction: isEng
        ? "Visit today—offer valid while stocks last!"
        : isHin
        ? "ऑफर सीमित समय के लिए है—आज ही आइए!"
        : "मर्यादित काळासाठी ऑफर—आजच भेट द्या!",
      setting: `Festive-decorated service counter at ${businessName}.`,
      characters: { lead: "Store Host", customer: "Delighted Customer" },
      scenes: [
        {
          sceneNumber: 1,
          beat: "Hook",
          timing: "0-3s",
          visual: "Host steps into frame with festive celebration energy, holding up the special announcement banner.",
          dialogue: isEng
            ? 'Lead: "Stop scrolling—our biggest offer of the season is here!"'
            : isHin
            ? 'Lead: "रुकिए! इस सीज़न का सबसे बड़ा ऑफर आ गया है!"'
            : 'Lead: "थांबा! या हंगामाची सर्वात मोठी ऑफर आली आहे!"',
        },
        {
          sceneNumber: 2,
          beat: "Build",
          timing: "3-8s",
          visual: `Host demonstrates ${offer} highlighting premium standards and genuine value.`,
          dialogue: isEng
            ? `Lead: "Get the complete ${offer} package at an unbeatable price this week."`
            : isHin
            ? `Lead: "इस हफ्ते पाइए पूरा ${offer} सबसे खास कीमत पर।" `
            : `Lead: "या आठवड्यात मिळवा संपूर्ण ${offer} अगदी विशेष दरात."`,
        },
        {
          sceneNumber: 3,
          beat: "Turn",
          timing: "8-14s",
          visual: "Customer smiles happily as host stamps the special discount coupon on their receipt.",
          dialogue: isEng
            ? 'Customer: "I saved money and got the best quality in town!"'
            : isHin
            ? 'Customer: "पैसे भी बचे और काम भी नंबर एक हुआ!"'
            : 'Customer: "पैसेही वाचले आणि उत्तम अनुभवही मिळाला!"',
        },
        {
          sceneNumber: 4,
          beat: "Resolution",
          timing: "14-20s",
          visual: "Delighted customer and host stand together as store contact details and location flash clearly.",
          dialogue: isEng
            ? `Lead: "Visit ${businessName}${city} today while offers last!"`
            : isHin
            ? `Lead: "आज ही ${businessName} आइए, ऑफर सीमित समय के लिए है!"`
            : `Lead: "आजच ${businessName} ला भेट द्या!"`,
        },
      ],
    },
  ].map((pkg) => normalizeSimpleAdPackage(pkg, businessName, businessType));
}

async function generateSimpleAdPackages({
  businessName,
  businessType = "Local Business",
  town = "",
  brief = "",
  targetAudience = "",
  language = "English",
  creativeStyle = "UGC / Creator-style",
}) {
  const brand = String(businessName || "My Business").trim();
  const bType = String(businessType || "Retail").trim();
  const city = String(town || "").trim();
  const offer = String(brief || `${bType} promotion`).trim();
  const audience = String(targetAudience || "Neighborhood customers").trim();
  const isEng = !language || /eng/i.test(language);

  let categoryGuidance = "";
  const catCheck = `${bType} ${offer}`.toLowerCase();
  if (/jewel|gold|diamond|ornament|silver|gem/i.test(catCheck)) {
    categoryGuidance = `
CATEGORY-SPECIFIC MANDATES FOR JEWELLERY & LUXURY:
- Setting: Plush, elegant jewellery showroom with velvet trays, jewelry spotlights, mirror counters, and bridal lounge.
- Characters: Jewellery Consultant / Stylist and Buyer / Bride / Family Member.
- Authenticity elements: 916 BIS Hallmark purity, certified natural/lab diamonds, karatage, transparent making charges, bridal heirlooms, old-gold exchange bonus.
- STRICT NEGATIVE RULES: NEVER mention "free consultation", "services", "repairs", "maintenance", "service card", "diagnostic", "fixing", "servicing", or "technician". Jewellery is an emotional, high-value luxury purchase, NOT a mechanical service or clinic consultation!`;
  } else if (/sweet|mithai|bakery|cake/i.test(catCheck)) {
    categoryGuidance = `
CATEGORY-SPECIFIC MANDATES FOR SWEETS & BAKERY:
- Setting: Bright, festive sweet shop with gleaming glass display cases, brass platters, and festive gift boxes.
- Authenticity elements: 100% pure desi ghee, fresh daily batches, authentic traditional recipes, festive gift hampers, melt-in-mouth taste.
- STRICT NEGATIVE RULES: NEVER mention "free consultation", "diagnostics", "repairs", "technicians", or "maintenance".`;
  } else if (/saree|apparel|clothing|fashion|boutique|garment/i.test(catCheck)) {
    categoryGuidance = `
CATEGORY-SPECIFIC MANDATES FOR FASHION & APPAREL:
- Setting: Chic boutique showroom with designer mannequins, silk shelves, and full-length mirrors.
- Authenticity elements: Pure handloom silks, bridal lehengas, trendy festive collection, fabric drape, curated designer wear.
- STRICT NEGATIVE RULES: NEVER mention "free consultation" (unless boutique styling advice), "repairs", "maintenance", or "diagnostics".`;
  }

  const langLower = String(language || "English").toLowerCase().trim();
  const isHinglish = langLower.includes("hinglish");
  const isHin = langLower === "hindi";
  const isMar = langLower === "marathi";
  const isKan = langLower === "kannada";
  const isTam = langLower === "tamil";
  const isTel = langLower === "telugu";

  const simpleLangInstruction = isEng
    ? "Natural conversational English. Absolutely NO Hindi, Devanagari, or Indic scripts."
    : isHinglish
    ? "Conversational Hinglish (Hindi with everyday English words) written strictly in Devanagari script (Rule M4). Under NO circumstances output in Kannada, Tamil, Telugu, or other South Indian languages based on brand headquarters."
    : isHin || isMar
    ? `Conversational ${language} written in Devanagari script.`
    : isKan
    ? "Conversational Kannada written in Kannada script (ಕನ್ನಡ ಲಿಪಿ)."
    : isTam
    ? "Conversational Tamil written in Tamil script (தமிழ்)."
    : isTel
    ? "Conversational Telugu written in Telugu script (తెలుగు)."
    : `Conversational dialogue written in authentic ${language} script.`;

  const system = `You are an elite short-form commercial video director creating high-converting ads for Indian local businesses and brands.
Generate exactly 3 complete, distinct, and realistic Ad Packages for this business.
Each Ad Package must have:
1. "Problem & Relief" angle (relatable pain-point, trusted fix).
2. "Customer Experience & Trust" angle (word-of-mouth, transparency, authentic satisfaction).
3. "Limited-Time Special Offer" angle (celebration / seasonal deal, urgency, clear savings).${categoryGuidance ? "\n" + categoryGuidance : ""}
Generate exactly 3 complete, distinct, and realistic Ad Packages for this business.
Each Ad Package must have:
1. "Problem & Relief" angle (relatable pain-point, trusted fix).
2. "Customer Experience & Trust" angle (word-of-mouth, transparency, authentic satisfaction).
3. "Limited-Time Special Offer" angle (celebration / seasonal deal, urgency, clear savings).

CRITICAL SCRIPT CONSTRAINTS:
- Language: ${language}. ${simpleLangInstruction}
- CRITICAL: Never infer or substitute a regional language based on brand headquarters city or location. The explicit language setting (${language}) is the sole authority.
- Exactly 4 scenes per package:
  Scene 1: Hook (0-3s, pattern interrupt)
  Scene 2: Build (3-8s, product/service demo in action)
  Scene 3: Turn (8-14s, proof / customer reaction)
  Scene 4: Resolution (14-20s, clear CTA with store visit or order link)
- Single continuous setting per ad package.
- Exactly 2 characters with natural interaction.

OUTPUT FORMAT:
Output strictly valid JSON between @@JSON@@ and @@END@@ markers:
@@JSON@@
{
  "packages": [
    {
      "id": "pkg_problem_relief",
      "badge": "Highest Converting",
      "angle": "Problem & Relief",
      "title": "Short Punchy Title",
      "hookHeadline": "Opening 3-second hook spoken line",
      "narrativeSummary": "1-sentence description of the ad story",
      "callToAction": "Clear final CTA line",
      "setting": "Setting description",
      "characters": { "lead": "Character 1", "customer": "Character 2" },
      "scenes": [
        {
          "sceneNumber": 1,
          "beat": "Hook",
          "timing": "0-3s",
          "visual": "Action description",
          "dialogue": "Lead: Spoken words"
        },
        {
          "sceneNumber": 2,
          "beat": "Build",
          "timing": "3-8s",
          "visual": "Action description",
          "dialogue": "Lead: Spoken words"
        },
        {
          "sceneNumber": 3,
          "beat": "Turn",
          "timing": "8-14s",
          "visual": "Action description",
          "dialogue": "Customer: Spoken words"
        },
        {
          "sceneNumber": 4,
          "beat": "Resolution",
          "timing": "14-20s",
          "visual": "Action description",
          "dialogue": "Lead: Spoken words"
        }
      ]
    }
  ]
}
@@END@@`;

  const content = `BUSINESS NAME: ${brand}
CATEGORY: ${bType}
LOCATION: ${city || "City"}
OFFER / PROMOTION: ${offer}
TARGET AUDIENCE: ${audience}
LANGUAGE: ${language}
STYLE: ${creativeStyle}

Create 3 distinct Ad Packages now:`;

  try {
    const raw = await callClaude({ system, content, maxTokens: 4000, thinking: false });
    const parsed = parseJSONBlock(raw);
    if (parsed && Array.isArray(parsed.packages) && parsed.packages.length === 3) {
      return parsed.packages.map((pkg, idx) =>
        normalizeSimpleAdPackage(
          {
            ...pkg,
            id: pkg.id || `pkg_${idx + 1}`,
          },
          brand,
          bType
        )
      );
    }
  } catch (e) {
    console.warn("[generateSimpleAdPackages] fallback to curated packages:", e.message);
  }

  return getFallbackAdPackages({ businessName: brand, businessType: bType, town: city, brief: offer, language });
}

/**
 * Normalizes a user-provided script into a structured 4-scene Annex-A production script.
 * Preserves user's creative intent, brand claims, language, dialogue, and CTA.
 * Avoids redundant AI calls if the script is already formatted and valid.
 */
async function normalizeUserScript({ rawScript, businessName, businessType, town, language, creativeStyle, brief }) {
  if (!rawScript || typeof rawScript !== "string" || !rawScript.trim()) {
    throw new Error("Script content is required.");
  }

  const brand = String(businessName || "My Business").trim();
  const bType = String(businessType || "Retail Business").trim();
  const city = String(town || "").trim();
  const lang = String(language || "English").trim();
  const style = String(creativeStyle || "UGC / Creator-style").trim();
  const userBrief = String(brief || "").trim();

  const form = {
    businessName: brand,
    businessType: bType,
    town: city,
    language: lang,
    creativeStyle: style,
    product: brand,
    brief: userBrief,
  };

  // 1. FAST PATH: Check if already structured and valid Annex-A script
  const parsed = parseOutput(rawScript);
  const scriptMode = lang === "Hindi" || lang === "Marathi" ? "devanagari" : "roman";
  if (parsed.scenes && parsed.scenes.length === 4 && parsed.character1 && parsed.setting) {
    const sanitized = sanitizeParsedScript(parsed, form, style, {}, "");
    const gateOpts = {
      scriptMode,
      approvedFormat: style,
    };
    let failures = [];
    try {
      failures = runGate(sanitized, form, gateOpts) || [];
    } catch {
      failures = [];
    }

    if (failures.length === 0) {
      const shotSpec = compileShotSpecification(sanitized, form);
      if (shotSpec) shotSpec.format = style;
      return {
        status: "success",
        passedGate: true,
        gatePassed: true,
        failures: [],
        scenes: sanitized.scenes,
        character1: sanitized.character1,
        character2: sanitized.character2,
        setting: sanitized.setting,
        shotSpec,
        fullScriptText: rawScript,
        totalScenes: 4,
        isAlreadyNormalized: true,
      };
    }
  }

  // 2. AI NORMALIZATION PATH: Transform raw user script into 4-scene Annex-A format
  const isEng = /english/i.test(lang);
  const system = `You are a commercial advertising director and script adapter for AI video production.
Your job is to adapt a user-provided script into a production-ready, 4-scene commercial script (Annex-A format) for video generation.

STRICT ADAPTATION RULES:
1. PRESERVE ORIGINAL CREATIVE INTENT & VERBATIM DETAILS:
   - Preserve all original brand names ("${brand}"), product claims, offers, pricing, key dialogue, and the call-to-action.
   - DO NOT invent fake features, unrelated claims, or arbitrary dialogue that contradicts the user's script.
   - Language: Spoken dialogue MUST be in ${lang}. ${isEng ? "Use natural conversational English." : "Use authentic " + lang + " phrasing."}
2. 4-BEAT SEQUENTIAL STRUCTURE:
   Organize the narrative into exactly 4 sequential scenes:
   - SCENE 1 – HOOK: Grabs attention immediately (first 2-3 seconds).
   - SCENE 2 – BUILD: Establishes context, problem, or product examination.
   - SCENE 3 – TURN: Core demonstration, surprise, or key breakthrough.
   - SCENE 4 – RESOLUTION: Clear call-to-action, reassuring smile, and brand payoff.
3. CONTINUOUS CAST & SINGLE ROOM:
   - Exactly ONE continuous room or environment where all 4 scenes take place (Rule M13b).
   - Exactly TWO characters throughout with consistent appearance and wardrobe:
     * Character 1: ${brand} Host, Specialist, or Owner.
     * Character 2: Customer, Companion, or Friend.
4. 9:16 VERTICAL VIDEO ACTIONS (Visual):
   - Every scene Visual MUST start with "Same setting: ".
   - Clear physical Cause -> Action -> Reaction staging suitable for 9:16 mobile feeds.
   - Eye-line rule: In every scene where characters speak to each other, the Visual MUST explicitly state that they look at each other (Rule M13d).
5. DIALOGUE:
   - Maximum 2 spoken dialogue lines per character per scene.
   - Format: Speaker: "Spoken line"
6. OUTPUT FORMAT:
   Return ONLY standard block markers:
   @@HEADER@@
   Business: ${brand}
   Format: ${style}
   Lens: 1, Everyday Relatability
   Hook: Script Hook
   Moment: Everyday
   @@CHARACTER1@@
   [Description of Character 1]
   @@CHARACTER2@@
   [Description of Character 2]
   @@SETTING@@
   [Single continuous room description]
   @@SCENE@@
   SCENE 1 – HOOK: [Title]
   Visual:
   Same setting: [Action]
   Animation Elements:
   • Camera: [Camera movement]
   • Text overlay: none
   • UI element: none
   • Transition: cut
   • Motion graphics: none
   Audio / Dialogue / Voiceover:
   [Speaker]: "[Dialogue]"
   Sound Design:
   Ambience: [Room tone]
   SFX: [Sound effect]
   Music mood note (for the edit step): [Mood]
   Editing Notes (edit step only):
   [Editing note]
   @@SCENE@@
   ... (for scenes 2, 3, 4)
   @@RECORD@@
   {"format":"${style}","characters":"Character 1 & Character 2","setting":"Single room setting"}`;

  const content = `BUSINESS NAME: ${brand}
BUSINESS TYPE: ${bType}
LOCATION: ${city}
LANGUAGE: ${lang}
STYLE: ${style}
USER'S ORIGINAL SCRIPT:
"""
${rawScript}
"""

Adapt this user script into the strict 4-scene Annex-A format now:`;

  try {
    const raw = await callClaude({ system, content, maxTokens: 4000, thinking: false });
    let adaptedParsed = parseOutput(raw);
    if (!adaptedParsed.scenes || adaptedParsed.scenes.length < 4) {
      console.warn("[normalizeUserScript] AI output had fewer than 4 scenes, using fallback");
      return fallbackNormalizeScript({ rawScript, form, brand, bType, lang, style });
    }
    adaptedParsed = sanitizeParsedScript(adaptedParsed, form, style, {}, "");

    let fails = [];
    try {
      fails = runGate(adaptedParsed, form, {
        scriptMode,
        approvedFormat: style,
      }) || [];
    } catch (gErr) {
      console.warn("[normalizeUserScript gate warning]", gErr.message);
    }

    const shotSpec = compileShotSpecification(adaptedParsed, form);
    if (shotSpec) shotSpec.format = style;

    return {
      status: "success",
      passedGate: fails.length === 0,
      gatePassed: fails.length === 0,
      failures: fails,
      scenes: adaptedParsed.scenes || [],
      character1: adaptedParsed.character1 || `${brand} Host`,
      character2: adaptedParsed.character2 || "Customer",
      setting: adaptedParsed.setting || `Clean, inviting shop / studio space at ${brand}`,
      shotSpec,
      fullScriptText: raw,
      totalScenes: adaptedParsed.scenes ? adaptedParsed.scenes.length : 0,
      isAlreadyNormalized: false,
    };
  } catch (err) {
    console.warn("[normalizeUserScript] AI normalization fallback:", err.message);
    // Deterministic fallback if AI call fails
    return fallbackNormalizeScript({ rawScript, form, brand, bType, lang, style });
  }
}

function fallbackNormalizeScript({ rawScript, form, brand, bType, lang, style }) {
  const trimmed = String(rawScript || "").trim();
  if (trimmed.length < 15) {
    throw new Error("Script content is too brief to adapt into a commercial video. Please provide your business offering, a key benefit, or a call-to-action.");
  }

  // Extract user's sentences or clean lines, stripping any raw block tags
  const userUnits = trimmed
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter((s) => s.length > 0 && !/^SCENE\s*\d+/i.test(s) && !/^ANNEX\s*A/i.test(s));

  if (userUnits.length === 0) {
    throw new Error("Could not extract meaningful dialogue or claims from the provided script.");
  }

  const beats = ["Scene 1 · Hook", "Scene 2 · Build", "Scene 3 · Turn", "Scene 4 · Resolution"];
  const char1 = `${brand} Host — confident, friendly presentation`;
  const char2 = "Customer — everyday shopper";
  const setting = `Well-lit ${bType} environment at ${brand}`;

  const scenes = [0, 1, 2, 3].map((i) => {
    let userLine = "";
    let visualAction = "";
    let cameraLine = "Camera: smooth motivated push-in";

    if (i === 0) {
      // Hook: use first user unit (hook / core message)
      userLine = userUnits[0] || "";
      visualAction = `Same setting: ${char1} welcomes ${char2} into the ${bType} space, presenting ${brand} offering. They look at each other with warm engagement.`;
      cameraLine = "Camera: medium close-up with gentle push-in";
    } else if (i === 1) {
      // Build: use second unit if 3+ units exist, else visual demonstration
      userLine = userUnits.length >= 3 ? userUnits[1] : "";
      visualAction = `Same setting: ${char1} demonstrates key product details while ${char2} inspects the quality closely. They look at each other with engaged interest.`;
      cameraLine = "Camera: eye-level two-shot";
    } else if (i === 2) {
      // Turn: use third unit if 4+ units exist, else customer reaction
      userLine = userUnits.length >= 4 ? userUnits[2] : "";
      visualAction = `Same setting: ${char2} experiences the benefit with clear relief and delight. ${char1} nods reassuringly. They look at each other with shared satisfaction.`;
      cameraLine = "Camera: close-up on product demonstration";
    } else {
      // Resolution / CTA: use last unit (or first unit if only 1 unit)
      userLine = userUnits.length >= 2 ? userUnits[userUnits.length - 1] : userUnits[0] || "";
      visualAction = `Same setting: Both ${char1} and ${char2} face camera with confident, welcoming smiles, presenting the final invitation for ${brand}.`;
      cameraLine = "Camera: medium wide shot holding on final brand payoff";
    }

    // Rule: NEVER generate placeholder spoken dialogue like "Scene 2 action for [brand]".
    // If no user dialogue is allocated to this beat, it is visual-led action with ambient sound.
    const dialogueBlock = userLine
      ? `${char1}: "${userLine.replace(/"/g, "'")}"`
      : "(None - visual demonstration with natural room tone)";

    return `ANNEX A\n${beats[i]}\nVisual:\n${visualAction}\nAnimation Elements:\n• ${cameraLine}\n• Text overlay: none\n• UI element: none\n• Transition: cut\n• Motion graphics: none\nAudio / Dialogue / Voiceover:\n${dialogueBlock}\nSound Design:\nAmbience: natural room tone.\nEditing Notes:\nDuration ~4s`;
  });

  const parsed = {
    scenes,
    character1: char1,
    character2: char2,
    setting,
    header: { business: brand, format: style },
  };
  const shotSpec = compileShotSpecification(parsed, form);
  if (shotSpec) shotSpec.format = style;

  return {
    status: "success",
    passedGate: true,
    gatePassed: true,
    failures: [],
    scenes,
    character1: char1,
    character2: char2,
    setting,
    shotSpec,
    fullScriptText: rawScript,
    totalScenes: 4,
    isAlreadyNormalized: false,
    isFallback: true,
  };
}

module.exports = {
  performAdaptiveResearch,
  generateDirections,
  generateHooks,
  generatePlots,
  generateStoryWorld,
  synthesizeMasterScript,
  rewriteScene,
  generateSimpleAdPackages,
  normalizeUserScript,
  validateHookLine,
  validateHooksList,
};
