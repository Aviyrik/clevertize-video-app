// Product Spine Section 8 quality gate — the checks that code can verify reliably.
// Claude also self-checks (M18); this is the backstop that can't be talked out of.
const { dialogueOf } = require("./parse");
const { festiveDecorFor } = require("./festive");
const { hasActiveGuardrails, validateOutputAgainstGuardrails } = require("./guardrails");

const DEVANAGARI = /[ऀ-ॿ]/;
const LATIN = /[A-Za-z]/;

const CLAIM_TERMS = [
  /best in town/i, /best in the city/i, /lowest price/i, /cheapest/i, /\bno\.?\s*1\b/i, /\bnumber (one|1)\b/i, /#1\b/,
  /100\s*%/, /\bguarantee(d)?\b/i, /सबसे सस्ता/, /सबसे सस्ते/, /सबसे अच्छा/, /सबसे बढ़िया/, /नंबर\s*(1|वन)/, /गारंटी/,
];
const FREE_TERMS = [/\bfree\b/i, /फ्री/, /मुफ़्त/, /मुफ्त/];
const ONSCREEN_TEXT = /\b(caption|subtitle|title card|text (reads|says|appears)|on-?screen text|lower[- ]third|written on screen)\b/i;
const PHONE_UI = /\b(screen (shows|showing|displays)|app (interface|screen)|notification|whatsapp (chat|message) on screen)\b/i;
const DEITY = /\b(idol|idols|deity|deities|goddess|murti)\b/i;
const EMOTION_DIRECTION = /\b(feels?|feeling|felt)\s+(so\s+|very\s+)?(happy|sad|relieved|hopeful|proud|worried|nervous|confident|embarrassed|excited|anxious|grateful|satisfied|glad|upset|ashamed|shy|stressed|calm)\b/i;
const STARE_OFF = /\b(stares?|staring|gazes?|gazing|looks?|looking)\s+(off|away|out|blankly|into (the )?(distance|space|nothing)|past (him|her|them))\b|\binto the distance\b|\bthousand-yard\b/i;
const LOOK_AT = /\b(looks?|looking|glances?|glancing|smiles?|smiling|nods?|nodding)\s+(up\s+)?(at|towards|to)\b|\b(turns?|turning)\s+(to|towards)\b|\b(faces?|facing)\b|\beye contact\b|\bmeets? (his|her|their) (eyes|gaze)\b|\bover-the-shoulder\b/i;
const DOWNMARKET = /\b(run-?down|dilapidated|shabby|grimy|dingy|dirty|filthy|peeling (paint|plaster|walls?)|crumbling|slum|squalid|cluttered and dusty|rusty tin|cobwebs?)\b/i;
const LUXURY = /\b(luxur(y|ious)|opulent|chandeliers?|marble (floor|walls?|counter)|five-star|palatial|lavish|high-end boutique)\b/i;
const AD_SPEAK = /visit (us )?today|best quality|one-?stop shop|आज ही (आएँ|आइए|पधारें)|सर्वोत्तम गुणवत्ता|उत्तम गुणवत्ता|हमारी दुकान पर पधारें/i;
const TIME_WORDS = ["morning", "afternoon", "evening", "night", "dusk", "dawn", "sunset", "sunrise", "midday", "noon"];
const TIME_GROUP = { dusk: "evening", sunset: "evening", dawn: "morning", sunrise: "morning", midday: "afternoon", noon: "afternoon" };
const timesOf = (t) => [...new Set((String(t).toLowerCase().match(new RegExp(`\\b(${TIME_WORDS.join("|")})\\b`, "g")) || []).map((w) => TIME_GROUP[w] || w))];
const MULTI_LOCATION = /\b(two|2|three|3|multiple|several|both) (locations|settings|places|spaces)\b|\blocation\s*[ab12]\b|\(scenes?\s*\d+\s*[–-]/i;
const MULTI_PERSON = /\s(and|&)\s|\b(couple|family|group|friends|kids|children)\b/i;
const MUSIC_WORD = /\b(music|song|melody|bgm|soundtrack)\b/i;

function nameCore(charLine) {
  return String(charLine).split(/\s[—–-]\s|,|—/)[0].replace(/\(.*?\)/g, "").trim().toLowerCase();
}

function speakerMatches(speaker, charLine) {
  const s = speaker.toLowerCase().replace(/\(.*?\)/g, "").trim();
  const line = String(charLine).toLowerCase();
  const core = nameCore(charLine);
  return !!s && (line.includes(s) || (core && s.includes(core)));
}

function sectionOf(scene, label, next) {
  const re = new RegExp(`${label}\\s*:([\\s\\S]*?)(?:\\n\\s*(?:${next.join("|")})\\s*[:(]|$)`, "i");
  const m = scene.match(re);
  return m ? m[1] : "";
}

function formatMatches(hFormat, approved) {
  if (!approved || !hFormat) return true;
  const h = String(hFormat).toLowerCase().trim();
  const a = String(approved).toLowerCase().trim();
  if (h === a) return true;
  if ((h.includes("ugc") || h.includes("creator")) && (a.includes("ugc") || a.includes("creator"))) return true;
  if ((h.includes("story") || h.includes("storytelling")) && (a.includes("story") || a.includes("storytelling"))) return true;
  if (h.includes("demo") && a.includes("demo")) return true;
  if (h.includes("comedy") && a.includes("comedy")) return true;
  if ((h.includes("dialogue") || h.includes("conversational") || h.includes("drama")) && (a.includes("story") || a.includes("dialogue") || a.includes("conversational") || a.includes("drama"))) return true;
  if (h.includes("problem") && (a.includes("ugc") || a.includes("problem") || a.includes("story"))) return true;
  return h.startsWith(a) || a.startsWith(h);
}

/**
 * parsed: output of parseOutput; f: validated form; opts: { scriptMode, previous }
 * Returns an array of failure strings (empty = pass).
 */
function runGate(parsed, f, { scriptMode = "devanagari", previous = [], approvedFormat = "", festival = "", allowVo = false, audioDeliveryMode = "", targetDuration = "", allowSceneCount = null, creativeGuardrails = null } = {}) {
  const fails = [];
  const h = parsed.header;
  const isVoMode = Boolean(
    allowVo ||
    audioDeliveryMode === "voiceover" ||
    (h.format && /voiceover|vo\b/i.test(h.format)) ||
    (f.format && /voiceover|vo\b/i.test(f.format))
  );

  // header
  for (const k of ["business", "format", "lens", "hook", "moment"]) {
    if (!h[k]) fails.push(`Header is missing "${k[0].toUpperCase() + k.slice(1)}:".`);
  }
  const format = (h.format || "").toLowerCase();
  const isValidFormat = isVoMode || /^(ugc|storytelling|demo|product demo|comedy|situational comedy|conversational|dialogue|problem|voiceover|vo)\b/.test(format);
  if (h.format && !isValidFormat) fails.push(`Format must be UGC or Storytelling (VO-led is switched off); got "${h.format}".`);
  if (approvedFormat && h.format && !formatMatches(format, approvedFormat)) fails.push(`Format "${h.format}" differs from the owner-approved format "${approvedFormat}" (Checkpoint 3).`);

  // context block
  for (const [k, v] of [["CHARACTER1", parsed.character1], ["CHARACTER2", parsed.character2]]) {
    if (k === "CHARACTER2" && isVoMode) {
      continue;
    }
    if (!v || /^none\b/i.test(v)) fails.push(`${k} is empty — the Context Block needs exactly 2 characters.`);
    else if (v.length < 40) fails.push(`${k} is too thin — give age, gender, skin tone, hair, clothing, accessories.`);
  }
  if (!parsed.setting || parsed.setting.length < 60) fails.push("SETTING is missing or too thin — give location, time of day, light source, surfaces, background activity.");
  // M13-class: middle / upper-middle-class look
  if (DOWNMARKET.test(parsed.setting || "")) fails.push(`SETTING looks run-down ("${(parsed.setting.match(DOWNMARKET) || [""])[0]}") — keep a clean, well-kept middle-class / upper-middle-class look (M13-class).`);
  if (LUXURY.test(parsed.setting || "")) fails.push(`SETTING looks luxury ("${(parsed.setting.match(LUXURY) || [""])[0]}") — keep it middle-class / upper-middle-class, believable for a local business (M13-class).`);
  // M13e: festival decor in the SETTING (so it shows in every scene)
  const decor = festiveDecorFor(festival || parsed.header.moment);
  if (decor && !decor.keywords.test(parsed.setting || "")) fails.push(`SETTING has no ${decor.name} decor — add ${decor.decor} (M13e).`);
  if (MULTI_LOCATION.test(parsed.setting || "")) fails.push("SETTING describes more than one location — the whole film must happen in ONE setting (M13a).");
  for (const [k, v] of [["CHARACTER1", parsed.character1], ["CHARACTER2", parsed.character2]]) {
    if (MULTI_PERSON.test(nameCore(v || ""))) fails.push(`${k} describes more than one person — each character line is one person (M13a).`);
  }

  // scenes
  const n = parsed.scenes.length;
  const durationSec = parseInt(targetDuration || f.targetDuration || f.duration || "15s", 10) || 15;
  const hasDurationOverride = Boolean(targetDuration || f.targetDuration || allowSceneCount);

  if (hasDurationOverride) {
    let allowedCounts;
    if (allowSceneCount) {
      allowedCounts = Array.isArray(allowSceneCount) ? allowSceneCount : [allowSceneCount];
    } else {
      if (durationSec <= 15) allowedCounts = [3, 4];
      else if (durationSec <= 20) allowedCounts = [4, 5];
      else allowedCounts = [5, 6, 7];
    }
    if (!allowedCounts.includes(n)) {
      fails.push(`Script has ${n} scenes; for a ${durationSec}s video it must have ${allowedCounts.join(" or ")} scenes (M6).`);
    }
  } else {
    if (n !== 4) fails.push(`Script has ${n} scenes; it must have exactly 4 (M6).`);
  }

  const guardrailAllowText = hasActiveGuardrails(creativeGuardrails)
    ? (creativeGuardrails.dos || []).map((d) => d.text).join(" ").toLowerCase()
    : "";
  const allowText = `${f.offer || ""} ${f.specialty || ""} ${f.contact || ""} ${guardrailAllowText}`.toLowerCase();
  const offerDigits = `${f.offer || ""} ${guardrailAllowText}`.replace(/[^\d]/g, " ").split(/\s+/).filter(Boolean);
  const scriptDialogue = ["hindi", "hinglish", "marathi"].includes(String(f.language).toLowerCase());
  // M4: only names the owner typed (business, owner, brand/product names in the form) may stay in Roman letters
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const allowedLatin = [f.businessName, f.ownerName, ...`${f.specialty || ""} ${f.offer || ""}`.split(/[^A-Za-z0-9]+/)]
    .filter((w) => w && /[A-Za-z]/.test(w) && (w === f.businessName || w === f.ownerName || /[A-Z0-9]/.test(w)))
    .sort((a, b) => b.length - a.length);
  const nameRe = allowedLatin.length ? new RegExp(`(^|[^A-Za-z])(${allowedLatin.map(esc).join("|")})(?![A-Za-z])`, "gi") : /$^/;

  const speakerScenes = {}; // speaker -> number of scenes they speak in
  const spokenAll = []; // every dialogue line, for claim checks
  let totalLines = 0;

  parsed.scenes.forEach((scene, i) => {
    const S = `Scene ${i + 1}`;
    for (const label of ["Visual", "Animation Elements", "Audio / Dialogue / Voiceover", "Sound Design", "Editing Notes"]) {
      const re = new RegExp(label.replace(/\s*\/\s*/g, "\\s*\\/\\s*").replace(/ /g, "\\s+"), "i");
      if (!re.test(scene)) fails.push(`${S} is missing the "${label}" section.`);
    }
    for (const bullet of ["Camera", "Text overlay", "UI element", "Transition", "Motion graphics"]) {
      if (!new RegExp(`${bullet}\\s*:`, "i").test(scene)) fails.push(`${S} Animation Elements is missing the "${bullet}:" bullet.`);
    }
    if (!/Text overlay\s*:\s*none/i.test(scene)) fails.push(`${S}: "Text overlay" must be "none" (M8).`);
    if (!/UI element\s*:\s*none/i.test(scene)) fails.push(`${S}: "UI element" must be "none" (M11).`);
    if (!/Motion graphics\s*:\s*none/i.test(scene)) fails.push(`${S}: "Motion graphics" must be "none".`);

    const visual = sectionOf(scene, "Visual", ["Animation Elements"]);
    if (ONSCREEN_TEXT.test(visual)) fails.push(`${S} Visual describes on-screen text (M8).`);
    if (PHONE_UI.test(visual)) fails.push(`${S} Visual describes a phone/app screen (M8).`);
    if (DEITY.test(visual)) fails.push(`${S} Visual shows deities or idols (M24).`);
    if (/\blocation\s*[ab12]\b|\b(cut|cuts|cutaway) to (a|her|his|their|the) (home|house|street|kitchen|office)\b/i.test(visual)) fails.push(`${S} Visual moves to another location — every scene stays in the one setting (M13a).`);
    if (!/^\s*same setting\b/i.test(visual)) fails.push(`${S} Visual must start with "Same setting:" so every scene keeps the one setting (M13b).`);
    const settingTimes = timesOf(parsed.setting || "");
    const otherTime = timesOf(visual).find((t) => settingTimes.length && !settingTimes.includes(t));
    if (otherTime) fails.push(`${S} Visual changes the time of day to "${otherTime}" — keep SETTING's ${settingTimes.join("/")} in every scene (M13b).`);
    if (STARE_OFF.test(visual)) fails.push(`${S} Visual has a character staring off / looking away — characters look at each other when they talk (M13d).`);
    if (!isVoMode) {
      const d0 = dialogueOf(scene);
      const both = [parsed.character1, parsed.character2].every((c) => { const n = nameCore(c); return n && visual.toLowerCase().includes(n.split(" ")[0]); });
      if (d0.lines.length && both && !LOOK_AT.test(visual)) fails.push(`${S} has dialogue between the two characters but the Visual never says they look at each other (M13d).`);
    }
    if (EMOTION_DIRECTION.test(visual)) fails.push(`${S} Visual uses emotion as direction ("feels…") — write physical actions only (M9).`);

    const sound = sectionOf(scene, "Sound Design", ["Editing Notes"]);
    const soundNoMood = sound.split("\n").filter((l) => !/music mood note/i.test(l)).join("\n");
    if (MUSIC_WORD.test(soundNoMood)) fails.push(`${S} Sound Design mentions music outside the music mood note (M8, M12).`);
    const editing = (scene.match(/Editing Notes[^\n]*:([\s\S]*)$/i) || [, ""])[1];
    if (/\bgenerat/i.test(editing)) fails.push(`${S} Editing Notes contain generation instructions (M12).`);

    const d = dialogueOf(scene);
    if (d.stray.length) fails.push(`${S} has dialogue without a "Speaker: \\"line\\"" label: ${d.stray[0].slice(0, 60)}`);
    const perSpeaker = {};
    for (const { speaker, text } of d.lines) {
      totalLines++;
      spokenAll.push(text);
      const isVoSpeaker = /^(?:text\s*[\+&]\s*)?(?:vo|v\.o\.|v\/o|voiceover|voice[\s-]over|narrator|narration|off[\s-]screen|audio)$/i.test(speaker);
      if (isVoSpeaker) {
        if (!isVoMode) {
          fails.push(`${S} uses a VO/narrator — VO-led is switched off; dialogue must come from a character.`);
        }
      } else if (!speakerMatches(speaker, parsed.character1) && !speakerMatches(speaker, parsed.character2)) {
        fails.push(`${S} speaker "${speaker}" is not one of the two Context Block characters.`);
      }
      perSpeaker[speaker] = (perSpeaker[speaker] || 0) + 1;

      if (scriptDialogue) {
        const spoken = text.replace(nameRe, "$1");
        if (scriptMode === "devanagari") {
          if (LATIN.test(spoken)) fails.push(`${S} dialogue has Roman letters — Hindi/Hinglish/Marathi lines must be fully in Devanagari, including mixed-in English words (e.g. "डिलीवरी", not "delivery") (M4): "${text.slice(0, 50)}"`);
          else if (!DEVANAGARI.test(spoken)) fails.push(`${S} dialogue is not in Devanagari (M4): "${text.slice(0, 50)}"`);
        } else if (DEVANAGARI.test(text)) {
          fails.push(`${S} dialogue uses Devanagari but the romanized test mode is on: "${text.slice(0, 50)}"`);
        }
      } else {
        const isEng = !f.language || /eng/i.test(String(f.language).trim());
        if (isEng && DEVANAGARI.test(text)) {
          fails.push(`${S} dialogue contains Devanagari script — film language is English; dialogue must be written in English (Rule M4): "${text.slice(0, 50)}"`);
        }
      }
    }
    for (const [sp, count] of Object.entries(perSpeaker)) {
      if (count > 2) fails.push(`${S}: ${sp} has ${count} lines; max 2 per character per scene (M10).`);
      speakerScenes[sp] = (speakerScenes[sp] || 0) + 1;
    }
  });

  // story arc (M27): scene titles carry the beats in order
  const BEATS = ["HOOK", "BUILD", "TURN", "RESOLUTION"];
  const getSceneTitle = (sc) => ((sc || "").split("\n").find((l) => l.trim() && !/^ANNEX\s*A/i.test(l.trim())) || "").trim();
  const isLogoOutro = /outro|logo/i.test(getSceneTitle(parsed.scenes[n - 1]));
  if (n === 4 && !isLogoOutro && !hasDurationOverride) {
    parsed.scenes.forEach((sc, i) => {
      const title = getSceneTitle(sc);
      if (BEATS[i] && !new RegExp(`\\b${BEATS[i]}\\b`, "i").test(title)) fails.push(`Scene ${i + 1} title must be "SCENE ${i + 1} – ${BEATS[i]}: …" — the 4 scenes follow HOOK → BUILD → TURN → RESOLUTION (M27).`);
    });
  } else if (n > 0) {
    const firstTitle = getSceneTitle(parsed.scenes[0]);
    const lastTitle = getSceneTitle(parsed.scenes[n - 1]);
    if (!/HOOK/i.test(firstTitle)) fails.push(`Scene 1 title must contain "HOOK" (M27).`);
    if (!/RESOLUTION|PAYOFF|CTA|OUTRO|LOGO/i.test(lastTitle)) fails.push(`Scene ${n} title must contain "RESOLUTION", "PAYOFF", "CTA", or "OUTRO" (M27).`);
  }
  // ad-speak in dialogue (M26)
  const adSpeak = spokenAll.join(" ").match(AD_SPEAK);
  if (adSpeak) fails.push(`Dialogue uses ad-speak ("${adSpeak[0]}") — keep it punchy and natural, like a real person or creator (M26).`);

  // camera variety (M13c): at least 3 different camera setups, no two consecutive scenes identical
  const cams = parsed.scenes.map((sc) => ((sc.match(/Camera\s*:\s*([^\n]+)/i) || [, ""])[1]).trim().toLowerCase().replace(/[.\s]+$/, ""));
  if (cams.length === 4 && cams.every(Boolean)) {
    if (new Set(cams).size < 3) fails.push("Camera barely changes across scenes — use at least 3 different camera setups (shot size, angle, movement) (M13c).");
    cams.forEach((c, i) => { if (i && c === cams[i - 1]) fails.push(`Scenes ${i} and ${i + 1} use the same camera setup ("${c}") — vary shot size or angle (M13c).`); });
    if (cams.every((c) => /^static\b/.test(c))) fails.push("Every scene uses a static camera — add gentle motivated movement where it fits (M13c).");
  }

  // rotation
  const speakers = Object.keys(speakerScenes);
  if (format.startsWith("ugc")) {
    if (!isVoMode) {
      const ownerScenes = speakers.filter((s) => speakerMatches(s, parsed.character1)).reduce((a, s) => a + speakerScenes[s], 0);
      if (ownerScenes > 3) fails.push(`UGC: the owner speaks in ${ownerScenes} scenes; max 3 of the 4, the other is B-roll (Section 6).`);
    }
  } else if (format.includes("demo")) {
    // Product Demo: visual proof and product action leads. Single presenter or rotated dialogue both allowed.
  } else if (!isVoMode && totalLines >= 3 && speakers.length < 2) {
    fails.push("Storytelling: all dialogue comes from one character — rotate speakers (M10).");
  }

  // claims (M22) — spoken lines only (nothing is on screen); skip any term the owner wrote themselves
  const fullText = spokenAll.join("\n");
  for (const re of [...CLAIM_TERMS, ...FREE_TERMS]) {
    const m = fullText.match(re);
    if (m && !allowText.includes(m[0].toLowerCase())) fails.push(`Claim "${m[0]}" is not in the owner's form (M22).`);
  }
  const priceRe = /(?:₹|rs\.?|inr|rupees?|रुपये|रुपए|रु\.?)\s*([\d,]+)|([\d,]+)\s*(?:₹|rupees?|रुपये|रुपए|रु\b)/gi;
  let pm;
  while ((pm = priceRe.exec(fullText))) {
    const num = (pm[1] || pm[2] || "").replace(/,/g, "");
    if (num && !offerDigits.includes(num)) fails.push(`Price "${pm[0].trim()}" is not in the owner's offer (M22).`);
  }

  // freshness (M19)
  const last = previous[previous.length - 1];
  if (last && parsed.record) {
    const same = (a, b) => a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    if (same(parsed.record.hook_pattern, last.hook_pattern)) fails.push(`Hook pattern "${last.hook_pattern}" repeats the previous script (M19).`);
    if (same(parsed.record.tension, last.tension)) fails.push("Tension repeats the previous script (M19).");
  }

  // record
  if (!parsed.record) fails.push("The @@RECORD@@ JSON is missing or invalid.");

  // Creative Guardrails (critical Do's / Don'ts enforcement)
  if (hasActiveGuardrails(creativeGuardrails)) {
    const checkCorpus = [parsed.setting || "", parsed.character1 || "", parsed.character2 || "", ...(parsed.scenes || [])].join("\n");
    const report = validateOutputAgainstGuardrails({
      outputText: checkCorpus,
      stage: "script",
      guardrails: creativeGuardrails,
    });
    if (report.hasCriticalViolation) {
      for (const v of report.automatedChecks.criticalViolations) {
        if (v.type !== "conflicting_guardrails") {
          fails.push(`Creative Guardrail violation: ${v.explanation}`);
        }
      }
    }
  }

  return [...new Set(fails)];
}

// =====================================================================================================
// Script & Storyboard Spine — Section 5 quality gate (Annex B automated checklist) on script.json.
// runGate above is the legacy Product Spine v2 (Section 8, M1–M28) gate; only the two legacy endpoints
// with no UI caller (/api/session/*, /api/pipeline/generate) still use it.
// Checks the code can verify run here; the ones that need judgement (ending pays off the hook, human
// truth and emotional turn, mood held, occasion used as specified) are the writer's self-check (S-M11)
// and are reported as "self-check".
// =====================================================================================================
const contracts = require("./spines/contracts");

const SCRIPT_BEATS = ["Hook", "Real moment", "Turn", "Payoff"];
const BROCHURE = /\b(best quality|premium quality|best-in-class|100% natural|no\.?\s*1\b|number one|trusted by millions|world[- ]class|one-?stop shop|shop now!?$|download now!?$)\b|सर्वोत्तम गुणवत्ता|उत्तम गुणवत्ता|नंबर\s*(1|वन)/i;
const TESTIMONIAL = /\b(real customer|genuine review|customer review|testimonial|5[- ]star review)\b|असली ग्राहक/i;
const NAMED_TRACK = /\b(song|track)\s*[:"“]|"[^"]+"\s+by\s+[A-Z]|\bby (arijit|a\.?\s*r\.?\s*rahman|badshah|diljit)\b/i;
const FLAT_CUT = /^(hard\s+|flat\s+|straight\s+|plain\s+)?cut\.?$/i;
const SUPPORTED_SCRIPTS = { Devanagari: /[ऀ-ॿ]/, Tamil: /[஀-௿]/, Telugu: /[ఀ-౿]/, Kannada: /[ಀ-೿]/, Malayalam: /[ഀ-ൿ]/, Bengali: /[ঀ-৿]/, Gujarati: /[઀-૿]/, Gurmukhi: /[਀-੿]/ };
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean);
const isNone = (s) => /^\s*(none|n\/a|-)?\s*$/i.test(String(s || ""));
const filled = (s) => String(s || "").trim().length > 0;
// "about 8 words (3 seconds) or fewer": one word of slack for "about"
const MAX_LINE_WORDS = 9;

function runScriptGate(script, { header = {}, brief = {}, concept = null, storyboardStatus = "not_run" } = {}) {
  const fails = [];
  const checks = [];
  const check = (id, text, problems, status) => {
    const s = status || (problems.length ? "fail" : "pass");
    checks.push({ id, text, status: s, details: problems });
    if (s === "fail") fails.push(...problems);
  };
  const scenes = script.scenes || [];
  const format = script.format || "UGC";
  const rules = contracts.FORMAT_RULES[format] || contracts.FORMAT_RULES.UGC;
  const S = (sc, i) => `Scene ${sc.n || i + 1}`;

  // 1. Script header complete
  const headerFields = ["brand", "objective", "platform_format", "film_format", "angle", "lens", "hook", "ending", "mood", "moment", "language"];
  check("header", "Script header complete", headerFields.filter((k) => !filled(header[k])).map((k) => `Script header is missing "${k}" (it comes from brief.json / concept.json).`));

  // 2. Context Block fully filled, with product and character reference IDs
  const cb = script.context_block || {};
  const cbProblems = [];
  const chars = Array.isArray(cb.characters) ? cb.characters : [];
  if (!chars.length) cbProblems.push("Context Block has no characters.");
  chars.forEach((c, i) => {
    const o = c && typeof c === "object" ? c : { description: c };
    if (!filled(o.ref || o.reference || o.ref_id)) cbProblems.push(`Context Block character ${i + 1} has no reference image ID.`);
    const desc = Object.values(o).filter((v) => typeof v === "string").join(" ");
    if (words(desc).length < 6) cbProblems.push(`Context Block character ${i + 1} is too thin — give age, gender, skin tone, hair, build, wardrobe, accessories.`);
  });
  if (!cb.product || !Object.keys(cb.product).length) cbProblems.push("Context Block product is empty.");
  else if (!filled(cb.product.ref || cb.product.reference || cb.product.ref_id)) cbProblems.push("Context Block product has no reference image ID.");
  if (!cb.setting || !Object.keys(cb.setting).length) cbProblems.push("Context Block setting is empty.");
  if (!cb.brand_elements || !Object.keys(cb.brand_elements).length) cbProblems.push("Context Block brand elements are empty.");
  check("context_block", "Context Block fully filled, with product and character reference IDs", cbProblems);

  // 3. Visual fields: complete pictures, physical actions only
  const visProblems = [];
  scenes.forEach((sc, i) => {
    if (words(sc.visual).length < 8) visProblems.push(`${S(sc, i)} Visual is not a complete picture.`);
    if (EMOTION_DIRECTION.test(sc.visual)) visProblems.push(`${S(sc, i)} Visual uses emotion as direction ("${(sc.visual.match(EMOTION_DIRECTION) || [""])[0]}") — physical actions only (S-M6).`);
    if (ONSCREEN_TEXT.test(sc.visual) || PHONE_UI.test(sc.visual)) visProblems.push(`${S(sc, i)} Visual asks for text or a phone/app screen — those are on-screen elements rendered by Production (S-M5).`);
    if (!filled(sc.shot) || !filled(sc.camera)) visProblems.push(`${S(sc, i)} is missing the shot size or camera move.`);
  });
  check("visual", "Visual fields are complete pictures, physical actions only, inside the safe zones", visProblems);

  // 4. On-screen elements filled for every scene; nothing asks the model to generate text, UI or logo
  const osProblems = [];
  scenes.forEach((sc, i) => {
    for (const k of ["super", "callout", "cta", "disclaimer", "ui_mockup", "logo"]) if (!filled(sc[k])) osProblems.push(`${S(sc, i)} on-screen element "${k}" is empty — write it, or "none".`);
    if (!isNone(sc.super) && words(sc.super).length > 6) osProblems.push(`${S(sc, i)} super is longer than 6 words.`);
  });
  check("on_screen", "On-screen elements filled for every scene; nothing asks the model to generate text, UI or logo", osProblems);

  // 5. Dialogue rules (S-M7, per format)
  const dlgProblems = [];
  const speakerScenes = {};
  let totalLines = 0;
  scenes.forEach((sc, i) => {
    const lines = (sc.dialogue || []).filter((d) => filled(d.line));
    const per = {};
    for (const d of lines) {
      const who = String(d.speaker || "").trim() || "?";
      per[who] = (per[who] || 0) + 1;
      totalLines++;
      if (words(d.line).length > MAX_LINE_WORDS) dlgProblems.push(`${S(sc, i)}: ${who}'s line has ${words(d.line).length} words — keep it to about 8 (S-M7).`);
    }
    for (const [who, n] of Object.entries(per)) {
      if (n > 1) dlgProblems.push(`${S(sc, i)}: ${who} has ${n} lines — max 1 line per character per scene (S-M7).`);
      speakerScenes[who] = (speakerScenes[who] || 0) + 1;
    }
    if (rules.hasVo) {
      if (lines.length) dlgProblems.push(`${S(sc, i)} has on-screen dialogue — VO-led films use one voice; people act but don't speak.`);
      if (!filled(sc.vo)) dlgProblems.push(`${S(sc, i)} has no VO line — VO-led films have one crisp VO line per scene.`);
    }
  });
  if (rules.speakerSceneCap) {
    const cap = Math.max(1, scenes.length - 1);
    for (const [who, n] of Object.entries(speakerScenes)) if (n > cap) dlgProblems.push(`UGC: ${who} speaks in ${n} of ${scenes.length} scenes — at most ${cap}; the other beat is B-roll (S-M7, Section 6).`);
  }
  if (format === "Storytelling" && totalLines >= 3 && Object.keys(speakerScenes).length < 2) dlgProblems.push("Storytelling: every line comes from one character — rotate speakers across scenes (S-M7).");
  check("dialogue", "Dialogue ≤ 1 line per character per scene, about 8 words, spread across characters (UGC/Founder: speaker in ≤ 3 scenes)", dlgProblems);

  // 6. Dialogue in brief.language and its correct script
  const langProblems = [];
  const scriptName = (script.language && script.language.script) || "Latin";
  const brandWords = words((brief.company && brief.company.brand) || "").map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const brandRe = brandWords.length ? new RegExp(brandWords.join("|"), "gi") : null;
  const spoken = [];
  scenes.forEach((sc, i) => {
    for (const d of sc.dialogue || []) if (filled(d.line)) spoken.push([S(sc, i), d.line]);
    if (filled(sc.vo)) spoken.push([S(sc, i), sc.vo]);
  });
  for (const [where, line] of spoken) {
    const text = brandRe ? line.replace(brandRe, "") : line;
    if (scriptName === "Latin") {
      if (/[ऀ-ॿ஀-ൿঀ-੿]/.test(text)) langProblems.push(`${where}: "${line.slice(0, 40)}" is not in Latin script.`);
    } else if (SUPPORTED_SCRIPTS[scriptName]) {
      if (!SUPPORTED_SCRIPTS[scriptName].test(text)) langProblems.push(`${where}: "${line.slice(0, 40)}" is not in ${scriptName}.`);
      else if (scriptName === "Devanagari" && LATIN.test(text)) langProblems.push(`${where}: "${line.slice(0, 40)}" mixes Roman letters into a ${scriptName} line — write English words as spoken (S-M2).`);
    }
  }
  check("language", "Dialogue in brief.language and its correct script", langProblems);

  // 7. Sound Design = ambience + SFX + music mood note; no named tracks
  const sndProblems = [];
  scenes.forEach((sc, i) => {
    for (const k of ["ambience", "sfx", "music_mood"]) if (!filled(sc[k])) sndProblems.push(`${S(sc, i)} Sound Design is missing "${k}".`);
    if (NAMED_TRACK.test(`${sc.music_mood} ${sc.sfx}`)) sndProblems.push(`${S(sc, i)} names a song or track — use a music mood note only.`);
  });
  check("sound", "Sound Design = ambience + SFX + music mood note; no named tracks", sndProblems);

  // 8. Transition out for every scene; no flat hard cut after the hook
  const trProblems = [];
  scenes.forEach((sc, i) => {
    if (!filled(sc.transition_out)) trProblems.push(`${S(sc, i)} has no "Transition out".`);
    else if (i < scenes.length - 1 && FLAT_CUT.test(String(sc.transition_out).split(/[–—-]/)[0].trim())) trProblems.push(`${S(sc, i)} uses a flat hard cut — link the scenes with a match, motion, prop, sound or eye-line.`);
  });
  check("transitions", "Transition out written for every scene; no flat hard cut after the hook", trProblems);

  // 9. Editing Notes = edit-step cues only
  check("edit_notes", "Editing Notes = edit-step cues only", scenes.filter((sc) => /\bgenerat/i.test(sc.edit_notes || "")).map((sc, i) => `${S(sc, i)} Editing Notes contain generation instructions (S-M9).`));

  // 10. Scene count matches the length; VO-led within about 40–50 words per 20s
  const plan = contracts.scenePlan(script.length_s);
  const countProblems = [];
  if (scenes.length !== plan.count) countProblems.push(`The script has ${scenes.length} scenes; a ${plan.length_s}s film has ${plan.count} (S-M3).`);
  scenes.forEach((sc, i) => { if (!SCRIPT_BEATS.includes(sc.beat)) countProblems.push(`${S(sc, i)} beat "${sc.beat}" is not one of Hook, Real moment, Turn, Payoff.`); });
  if (scenes.length && scenes[0].beat !== "Hook") countProblems.push("Scene 1 must be the Hook.");
  if (scenes.length && scenes[scenes.length - 1].beat !== "Payoff") countProblems.push(`Scene ${scenes.length} must be the Payoff.`);
  if (rules.hasVo) {
    const voWords = scenes.reduce((n, sc) => n + words(sc.vo).length, 0);
    const r = contracts.voWordRange(plan.length_s);
    if (voWords < r.min || voWords > r.max) countProblems.push(`VO runs ${voWords} words; a ${plan.length_s}s VO-led film runs about ${r.min}–${r.max}.`);
  }
  check("scene_count", "Scene count matches the length; VO-led within about 40–50 words per 20s", countProblems);

  // 11–13. Judgement items: the writer's self-check (S-M11)
  check("ending_payoff", "The ending pays off the hook (same place, prop, line or question resolved)", [], "self-check");
  const moodProblems = [];
  if (!filled(header.mood)) moodProblems.push("No mood chosen.");
  scenes.forEach((sc, i) => { if (!filled(sc.music_mood)) moodProblems.push(`${S(sc, i)} has no music mood note.`); });
  check("mood", "One mood chosen and held across all scenes", moodProblems, moodProblems.length ? "fail" : "self-check");
  check("human_truth", "One human truth and one clear emotional turn (Scene 3 or 4)", [], "self-check");

  // 14. No brochure or slogan lines
  check("brochure", "No brochure or slogan lines; the last line or beat is specific to this brand", spoken.filter(([, l]) => BROCHURE.test(l)).map(([w, l]) => `${w}: "${l.slice(0, 40)}" is a brochure line — write how people actually talk.`));

  // 15. Claims and callouts from brief.rtbs or the offer; all required disclaimers present
  const claimProblems = [];
  const allowedClaims = [...((brief.rtbs || []).map((r) => `${r.claim} ${r.proof}`)), brief.mandatories && brief.mandatories.offer, brief.company && brief.company.offer].filter(Boolean).join(" ").toLowerCase();
  const tokens = (s) => String(s || "").toLowerCase().split(/[^\p{L}\p{N}%₹]+/u).filter((t) => t.length > 2);
  scenes.forEach((sc, i) => {
    if (!isNone(sc.callout)) {
      const t = tokens(sc.callout);
      if (!allowedClaims || (t.length && !t.some((w) => allowedClaims.includes(w)))) claimProblems.push(`${S(sc, i)} callout "${sc.callout}" is not from brief.rtbs or the offer (S-M10).`);
    }
  });
  const disclaimersText = scenes.map((sc) => sc.disclaimer).join(" ").toLowerCase();
  for (const d of (brief.mandatories && brief.mandatories.disclaimers) || []) if (d && !disclaimersText.includes(String(d).toLowerCase().slice(0, 24))) claimProblems.push(`Required disclaimer missing: "${d}".`);
  check("claims", "Every claim and callout comes from brief.rtbs or the offer; all required disclaimers present", claimProblems);

  // 16. No fake testimonial, no deities, no named competitors, no copied lines
  const safety = [];
  scenes.forEach((sc, i) => {
    if (DEITY.test(sc.visual)) safety.push(`${S(sc, i)} shows deities or idols.`);
    if (TESTIMONIAL.test(`${sc.visual} ${(sc.dialogue || []).map((d) => d.line).join(" ")} ${sc.vo}`)) safety.push(`${S(sc, i)} reads as a testimonial — acted people are acted.`);
  });
  check("safety", "No fake testimonial, no deities, no named competitors, no copied hook lines or taglines", safety);

  // 17. Storyboard frame check — the app has no image step yet (see engine/spines/storyboard.js)
  check("storyboard", "Storyboard frame check passed on every frame; locks saved", [], storyboardStatus);

  // 18. Do's and Don'ts that apply to the script
  const ddProblems = [];
  const sceneText = scenes.map((sc) => [sc.visual, (sc.dialogue || []).map((d) => d.line).join(" "), sc.vo, sc.super, sc.callout].join(" ")).join("\n");
  const notes = scenes.map((sc) => String(sc.edit_notes || "").toLowerCase());
  for (const d of brief.dos_donts || []) {
    if (d.strength !== "must" || !(d.applies_to || []).includes("script") || contracts.FILM_FORMAT_RULE_RE.test(d.rule)) continue;
    const key = tokens(d.rule).filter((t) => !["must", "include", "never", "don't", "dont", "the", "and", "with"].includes(t));
    if (/not include|never|don'?t/i.test(`${d.type} ${d.rule}`)) {
      const v = validateOutputAgainstGuardrails({ outputText: sceneText, stage: "script", guardrails: { dos: [], donts: [{ id: "dd", text: d.rule, priority: "critical" }] } });
      if (v.hasCriticalViolation) ddProblems.push(`Don't broken: "${d.rule}" (${v.automatedChecks.criticalViolations[0].matchedFragment || ""}).`);
    } else if (!notes.some((n) => /must include/.test(n) && key.some((k) => n.includes(k)))) {
      ddProblems.push(`"Must include" not placed in a named scene's Editing Notes: "${d.rule}" (S-M13).`);
    }
  }
  check("dos_donts", "Every Do and Don't that applies to the script is met; each \"must include\" is placed in a named scene", ddProblems);

  // 19. Occasion as the concept specified — judgement
  check("occasion", "The occasion (if any) appears only as the concept specified, with its don'ts respected", [], "self-check");

  return { failures: [...new Set(fails)], checks, passed: !fails.length };
}

module.exports = { runGate, speakerMatches, formatMatches, runScriptGate, SCRIPT_BEATS, MAX_LINE_WORDS };
