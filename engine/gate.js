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
const PHONE_UI = /\b(screen (shows|showing|displays)|app (interface|screen)|notification|whatsapp (chat|message) on screen|incoming call|call screen|caller id|video call screen)\b/i;
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
const storyboardLib = require("./spines/storyboard");

const SCRIPT_BEATS = ["Hook", "Real moment", "Turn", "Payoff"];
const BROCHURE = /\b(best quality|premium quality|best-in-class|100% natural|no\.?\s*1\b|number one|trusted by millions|world[- ]class|one-?stop shop|shop now!?$|download now!?$)\b|सर्वोत्तम गुणवत्ता|उत्तम गुणवत्ता|नंबर\s*(1|वन)/i;
const TESTIMONIAL = /\b(real customer|genuine review|customer review|testimonial|5[- ]star review)\b|असली ग्राहक/i;
const NAMED_TRACK = /\b(song|track)\s*[:"“]|"[^"]+"\s+by\s+[A-Z]|\bby (arijit|a\.?\s*r\.?\s*rahman|badshah|diljit)\b/i;
const FLAT_CUT = /^(hard\s+|flat\s+|straight\s+|plain\s+)?cut\.?$/i;
const SUPPORTED_SCRIPTS = { Devanagari: /[ऀ-ॿ]/, Tamil: /[஀-௿]/, Telugu: /[ఀ-౿]/, Kannada: /[ಀ-೿]/, Malayalam: /[ഀ-ൿ]/, Bengali: /[ঀ-৿]/, Gujarati: /[઀-૿]/, Gurmukhi: /[਀-੿]/ };
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean);
// a frame sentence about keeping space clear, or about what to avoid, isn't asking for that thing
// …and neither is a note on what Production adds later ("the callout will be placed by Production", "composited in post")
const FRAME_CAUTION = /\b(clear|free|empty|kept|keep|keeps|reserved|space for|room for|leave|leaves|left open|no|not|never|without|avoid|avoids|nothing|none|production|in post|composit\w*|placed by|will be placed|will sit|overlay zones?)\b/i;
const isNone = (s) => /^\s*(none|n\/a|-)?\s*$/i.test(String(s || ""));
const filled = (s) => String(s || "").trim().length > 0;
// "about 8 words (3 seconds) or fewer": one word of slack for "about"
const MAX_LINE_WORDS = 9;

// S-M5 (spine 2.1.0): the video model may draw writing and phone/app/website screens a scene needs, spelled out word
// for word in the scene's "UI / in-scene text" bullet (script.json ui_mockup): short, legible, in brief.language and
// consistent with brief.rtbs. Supers, callouts, CTA and disclaimers over the picture stay Production's, and logos are
// never generated.
const OVERLAY_TEXT = /\b(caption|captions|subtitle|subtitles|title card|on-?screen text|text overlay|overlay text|lower[- ]third (super|caption|graphic|title|text|banner))\b/i;
const WRITING_CUE = /\b(phone|app|website|web ?page|laptop|tablet|order|checkout|payment|cart)\s+(screen|page|display)\b|\bscreen\s+(shows|showing|displays|reads|lights up with)\b|\b(app (interface|screen)|chat|whatsapp|message|messages|notification|incoming call|call screen|caller id|order confirmation|signboard|signage|shop sign|sign reads|banner|poster|handwritten|note|notes|checklist|menu card|menu board|receipt|bill|invoice|price tag|placard|text reads|text says|written on)\b/i;
const NOT_SHOWN = /\b(dark|blank|black screen|turned off|switched off|screen off|face[- ]down|unreadable|not visible|no text|nothing on|out of focus)\b/i;
const IN_SCENE_MAX_WORDS = 12; // "short and legible": one piece of text read in a 5-second scene
/** Does this text show writing or a screen the viewer can read? */
const showsWriting = (text) => String(text || "").split(/(?<=[.;!?])\s+/).some((sn) => WRITING_CUE.test(sn) && !NOT_SHOWN.test(sn));
/** The exact words given for in-scene text: each piece in quotes. */
function quotedPieces(text) {
  const t = String(text || "");
  const out = [];
  for (const m of t.matchAll(/["“]([^"”]{1,240})["”]|‘([^’]{1,240})’|(?:^|[\s:(,—–-])'([^']{2,240})'(?=[\s.,;:)!?—–-]|$)/g)) out.push((m[1] || m[2] || m[3] || "").trim());
  return out.filter(Boolean);
}

function runScriptGate(script, { header = {}, brief = {}, concept = null, storyboard = null } = {}) {
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
  if (chars.length !== 2) cbProblems.push(`Context Block has ${chars.length} character${chars.length === 1 ? "" : "s"} — every film has exactly two, and the story plays out between them.`);
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
    // writing and screens in the scene are allowed (S-M5) and checked below; words laid over the picture are not
    if (OVERLAY_TEXT.test(sc.visual)) visProblems.push(`${S(sc, i)} Visual asks for a caption or headline over the picture — put those words in the Super or Callout bullet; Production adds them (S-M5).`);
    if (!filled(sc.shot) || !filled(sc.camera)) visProblems.push(`${S(sc, i)} is missing the shot size or camera move.`);
  });
  check("visual", "Visual fields are complete pictures, physical actions only, inside the safe zones", visProblems);

  // 4. On-screen elements filled for every scene; nothing asks the model to generate text, UI or logo
  const osProblems = [];
  scenes.forEach((sc, i) => {
    for (const k of ["super", "callout", "cta", "disclaimer", "ui_mockup", "logo"]) if (!filled(sc[k])) osProblems.push(`${S(sc, i)} on-screen element "${k === "ui_mockup" ? "UI / in-scene text" : k}" is empty — write it, or "none".`);
    if (!isNone(sc.super) && words(sc.super).length > 6) osProblems.push(`${S(sc, i)} super is longer than 6 words.`);
  });
  check("on_screen", "On-screen elements filled for every scene", osProblems);

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

  // Two characters, everywhere (the app's production rule): only the Context Block's two people speak or are
  // featured in a scene; anyone else in a visual is a third featured person (background activity excepted).
  const twoProblems = [];
  const castOf = chars.slice(0, 2);
  const castNames = castOf.map((c) => (c && typeof c === "object" ? c.name || c.role : String(c || "")) || "the character").join(" and ") || "the two characters";
  const isCast = (speaker) => castOf.some((c) => storyboardLib.mentions(speaker, c));
  scenes.forEach((sc, i) => {
    for (const d of (sc.dialogue || []).filter((x) => filled(x.line))) {
      const who = String(d.speaker || "").trim();
      if (/^(vo|v\.o\.|voiceover|narrator)$/i.test(who)) continue;
      if (castOf.length === 2 && !isCast(who)) twoProblems.push(`${S(sc, i)}: "${who}" speaks but isn't one of the two characters — the story plays out between them.`);
    }
    const extra = contracts.extraPeople(sc.visual, castOf);
    if (extra.length) twoProblems.push(`${S(sc, i)} features a third person (${extra.map((w) => `"${w}"`).join(", ")}) — rewrite the visual with only ${castNames} in it (or move anyone else to the unnamed, out-of-focus background).`);
  });
  // hands that belong to neither character ("two hands, no character named, tie the ribbon") are a third person:
  // the video model invents whose hands they are, and they don't match either character
  // Hands are stray when no sentence about hands says whose they are (a character's name, or "he/she/they/his/her/
  // their"); a later "both pairs of hands" refers back to hands already named. Anonymous wording ("anonymous hands",
  // "a pair of hands") is caught as a third person by contracts.extraPeople.
  const strayHands = (text) => {
    const withHands = String(text || "").split(/(?<=[.!?;])\s+/).filter((sn) => /\bhands?\b/i.test(sn));
    const owned = (sn) => /\b(he|she|they|his|her|their|him|them)\b/i.test(sn) || castOf.some((c) => storyboardLib.mentions(sn, c, { ruleOut: false }));
    return withHands.length > 0 && !withHands.some(owned);
  };
  scenes.forEach((sc, i) => {
    if (castOf.length === 2 && strayHands(sc.visual)) twoProblems.push(`${S(sc, i)} shows hands that belong to neither character — make them ${castOf.map((c) => `${(c && c.name) || "a character"}'s`).join(" or ")} (no third person, not even hands).`);
  });
  // both characters are seen: the story plays out between two people on screen, not one person and a voice
  castOf.forEach((c, i) => {
    const o = c && typeof c === "object" ? c : { description: String(c || "") };
    const desc = Object.values(o).filter((v) => typeof v === "string").join(" ");
    const who = o.name || o.role || `Character ${i + 1}`;
    if (/\b(not seen|unseen|never seen|voice[- ]only|only (a |as a )?voice|off-?screen|heard only|only heard)\b/i.test(desc)) twoProblems.push(`Context Block character ${i + 1} (${who}) is never seen — both characters appear on screen; the story plays out between them.`);
    else if (castOf.length === 2 && !scenes.some((sc) => storyboardLib.mentions(sc.visual, c))) twoProblems.push(`${who} doesn't appear in any scene's visual — both characters appear on screen.`);
  });
  check("two_characters", "Exactly two characters; no third featured person in any scene", twoProblems);

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

  // 4b. In-scene text and phone UI written out exactly; nothing asks the model to generate a logo (S-M5, Annex B).
  // A scene that shows writing or a screen gives its exact words in "UI / in-scene text", each piece in quotes:
  // short, legible, in brief.language, and with no figure the brief doesn't back.
  const inSceneProblems = [];
  const backedText = [...((brief.rtbs || []).map((r) => `${r.claim} ${r.proof}`)), brief.mandatories && brief.mandatories.offer, brief.company && brief.company.offer].filter(Boolean).join(" ").toLowerCase().replace(/\s+/g, "");
  const FIGURE = /(?:₹|rs\.?\s?|inr\s?)\s?\d[\d,]*|\d+(?:\.\d+)?\s?%|\d+\s?(?:%\s?)?off\b/gi;
  scenes.forEach((sc, i) => {
    const ui = String(sc.ui_mockup || "");
    const pieces = isNone(ui) ? [] : quotedPieces(ui);
    if (showsWriting(sc.visual) && !pieces.length) inSceneProblems.push(`${S(sc, i)} shows a screen or writing — give its exact words in "UI / in-scene text", each piece in quotes (S-M5).`);
    else if (!isNone(ui) && !pieces.length) inSceneProblems.push(`${S(sc, i)} "UI / in-scene text" doesn't give the exact words — put each piece of text in quotes, or write "none" (S-M5).`);
    if (/\b(logo|brand ?mark)\b/i.test(ui)) inSceneProblems.push(`${S(sc, i)} asks the model to draw a logo — Production adds the logo (S-M5).`);
    for (const p of pieces) {
      if (words(p).length > IN_SCENE_MAX_WORDS) inSceneProblems.push(`${S(sc, i)} in-scene text "${p.slice(0, 40)}…" is too long to read in a 5-second scene — ${IN_SCENE_MAX_WORDS} words at most per piece.`);
      const text = brandRe ? p.replace(brandRe, "") : p;
      const letters = text.replace(/[\d\s.,:;!?%₹₹+\-–—/()'"“”‘’@#&*]/g, "");
      if (letters) {
        if (scriptName === "Latin" && /[ऀ-ॿ஀-ൿঀ-੿]/.test(text)) inSceneProblems.push(`${S(sc, i)} in-scene text "${p.slice(0, 40)}" is not in ${(script.language && script.language.name) || "the film's language"} (Latin script).`);
        else if (SUPPORTED_SCRIPTS[scriptName] && !SUPPORTED_SCRIPTS[scriptName].test(text)) inSceneProblems.push(`${S(sc, i)} in-scene text "${p.slice(0, 40)}" is not in ${(script.language && script.language.name) || scriptName} (${scriptName}).`);
      }
      for (const fig of p.match(FIGURE) || []) {
        if (!backedText.includes(fig.toLowerCase().replace(/\s+/g, ""))) inSceneProblems.push(`${S(sc, i)} in-scene text shows "${fig.trim()}", which isn't in the brief's offer or proof points (S-M10).`);
      }
    }
  });
  check("in_scene_text", "In-scene text and phone UI written out exactly; nothing asks the model to generate a logo", inSceneProblems);

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
  // (a note about what Production adds or what is not generated — "the super is not in the generated frame" — isn't a
  // generation instruction; "generate with a zoom effect" is)
  const genInstruction = (notes) => String(notes || "").split(/(?<=[.;!?])\s+/).some((sn) => /\bgenerat/i.test(sn) && !FRAME_CAUTION.test(sn));
  check("edit_notes", "Editing Notes = edit-step cues only", scenes.filter((sc) => genInstruction(sc.edit_notes)).map((sc, i) => `${S(sc, i)} Editing Notes contain generation instructions (S-M9).`));

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
    // the writer is asked for 40–50 words per 20s; the spine says "about", so the check allows 10% either side
    if (voWords < Math.floor(r.min * 0.9) || voWords > Math.ceil(r.max * 1.1)) countProblems.push(`VO runs ${voWords} words; a ${plan.length_s}s VO-led film runs about ${r.min}–${r.max}.`);
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
  // Only the words to show are matched. An entry that is guidance about a disclaimer (a brief.json saved before the
  // Brief Spine kept these apart) is never matched word for word — it couldn't appear in any script: the words it
  // names are, and the guidance itself goes to the writer's self-check below.
  const { disclaimers: requiredDisclaimers, guidance: disclaimerGuidance } = contracts.splitDisclaimers((brief.mandatories && brief.mandatories.disclaimers) || []);
  for (const d of requiredDisclaimers) if (!disclaimersText.includes(String(d).toLowerCase().slice(0, 24))) claimProblems.push(`Required disclaimer missing: "${d}".`);
  check("claims", "Every claim and callout comes from brief.rtbs or the offer; all required disclaimers present", claimProblems);
  if (disclaimerGuidance.length) check("disclaimer_guidance", "Disclaimer guidance in the brief is followed (the writer's self-check: it is guidance, not words to show)", disclaimerGuidance, "self-check");

  // 16. No fake testimonial, no deities, no named competitors, no copied lines
  const safety = [];
  scenes.forEach((sc, i) => {
    if (DEITY.test(sc.visual)) safety.push(`${S(sc, i)} shows deities or idols.`);
    if (TESTIMONIAL.test(`${sc.visual} ${(sc.dialogue || []).map((d) => d.line).join(" ")} ${sc.vo}`)) safety.push(`${S(sc, i)} reads as a testimonial — acted people are acted.`);
  });
  check("safety", "No fake testimonial, no deities, no named competitors, no copied hook lines or taglines", safety);

  // 17. Frame check on every frame description (Section 4); locks saved
  const frameProblems = [];
  const frames = (storyboard && Array.isArray(storyboard.frames)) ? storyboard.frames : [];
  if (!frames.length) frameProblems.push("No frame descriptions were written (Section 4).");
  const prod = cb.product || {};
  for (const f of frames) {
    const F = `Frame ${f.scene}`;
    // only what the writer composed for this frame: the Context Block lines the app inserts word for word (a
    // product's own packaging can carry its logo) are the real product and people, not something asked for
    const subjectNote = String(f.subject || "").split(" As in the Context Block: ")[0];
    const productNote = String(f.product || "").includes(" — ") ? String(f.product).split(" — ").slice(1).join(" — ") : "";
    const written = [f.composition, subjectNote, productNote].join(" ");
    // the product is named and described exactly (shape, colour, label side)
    if (f.product !== "Not in frame." && !["colour", "packaging", "label_side"].every((k) => filled(prod[k]))) frameProblems.push(`${F}: the product isn't described exactly — the Context Block product needs colour, packaging and label side.`);
    // characters match the Context Block word for word
    // (who is in frame is read from the writer's note, as the frame builder reads it — the appended Context Block
    // lines can name the other character, e.g. "Priya's husband")
    for (const c of castOf) if (storyboardLib.mentions(subjectNote, c) && !String(f.subject).includes(storyboardLib.characterLine(c))) frameProblems.push(`${F}: ${c.name || "a character"} isn't described exactly as in the Context Block.`);
    // No logos asked for inside the frame, and no caption or headline laid over it (Production adds those); any
    // in-scene writing or phone UI is spelled out word for word — the frame carries the scene's "UI / in-scene text".
    // Sentences that keep a safe zone clear for a placeholder, or say what to avoid, aren't asking for anything.
    const asking = (text) => String(text || "").split(/(?<=[.;!?])\s+/).filter((sn) => !FRAME_CAUTION.test(sn)).join(" ");
    const asked = asking(written);
    if (/\b(logo|brand ?mark)\b[^.]{0,40}\b(on|in|across|printed|appears|visible)\b/i.test(asked)) frameProblems.push(`${F} asks for a logo inside the frame — Production adds the logo (S-M5).`);
    if (OVERLAY_TEXT.test(asked)) frameProblems.push(`${F} asks for a caption or headline over the picture — Production adds those (S-M5).`);
    const frameScene = scenes.find((sc) => Number(sc.n) === Number(f.scene)) || {};
    if (showsWriting(asked) && !quotedPieces(isNone(frameScene.ui_mockup) ? "" : frameScene.ui_mockup).length) frameProblems.push(`${F} shows a screen or writing without its exact words — spell them out in the scene's "UI / in-scene text" (S-M5).`);
    // nothing breaks safety (Do's and Don'ts are checked with the script below)
    if (DEITY.test(written) || TESTIMONIAL.test(written)) frameProblems.push(`${F} breaks safety (deities or a testimonial).`);
    // a composition is written (foreground, middle, background, where the subject sits); whether it fits the safe
    // zones is judgement (below) — the placeholder positions themselves are set inside the safe zones by the app
    if (words(f.composition).length < 8) frameProblems.push(`${F} has no composition — foreground, middle, background and where the subject sits.`);
    // two characters
    const extra = contracts.extraPeople(`${subjectNote} ${f.composition}`, castOf);
    if (extra.length) frameProblems.push(`${F} features a third person (${extra.join(", ")}).`);
    if (castOf.length === 2 && strayHands(subjectNote)) frameProblems.push(`${F} shows hands that belong to neither character — name whose hands they are.`);
  }
  const locks = (storyboard && storyboard.locks) || {};
  if (frames.length && (!Array.isArray(locks.characters) || locks.characters.length !== 2 || !filled(locks.product))) frameProblems.push("Consistency locks are incomplete — two character descriptions and the product description.");
  check("frames", "Frame check passed on every frame description; locks saved", frameProblems);
  // judgement items of the frame check: the setting looks real (S-M8) and each composition fits the safe zones
  check("frames_real_setting", "Every frame's setting looks real (S-M8)", [], "self-check");
  check("frames_safe_zones", "Every frame's composition fits the safe zones", [], "self-check");

  // 18. Do's and Don'ts that apply to the script
  const ddProblems = [];
  // the frame descriptions' written parts are checked too (Section 4: nothing breaks the Do's and Don'ts)
  const sceneText = [
    ...scenes.map((sc) => [sc.visual, (sc.dialogue || []).map((d) => d.line).join(" "), sc.vo, sc.super, sc.callout].join(" ")),
    ...frames.map((f) => [f.composition, f.subject, f.product].join(" ")),
  ].join("\n");
  const notes = scenes.map((sc) => String(sc.edit_notes || "").toLowerCase());
  const judgedDonts = [];
  for (const d of brief.dos_donts || []) {
    if (d.strength !== "must" || !(d.applies_to || []).includes("script") || contracts.FILM_FORMAT_RULE_RE.test(d.rule)) continue;
    const key = tokens(d.rule).filter((t) => !["must", "include", "never", "don't", "dont", "the", "and", "with"].includes(t));
    // Brand and category legal rules are claim limits and conditions ("omit 'pure' unless certified", "FSSAI number
    // if a quality claim is made"), not words to place: the writer self-checks them; their words to show are disclaimers.
    if (d.source !== "user" && /\b(legal|claims?|compliance|regulat\w*|disclaimers?)\b/i.test(d.type)) { judgedDonts.push(d.rule); continue; }
    if (/not include|never|don'?t/i.test(`${d.type} ${d.rule}`)) {
      // The word check is built for the user's own Don'ts ("Do not mention DiamondPlaza" → "DiamondPlaza"). Brand
      // and category Don'ts (B-M11) are sentences ("no health claims about sweet products"); matching their words
      // fails scripts that merely say "sweet". The writer self-checks those against brief.dos_donts (S-M11).
      if (d.source !== "user") { judgedDonts.push(d.rule); continue; }
      const v = validateOutputAgainstGuardrails({ outputText: sceneText, stage: "script", guardrails: { dos: [], donts: [{ id: "dd", text: d.rule, priority: "critical" }] } });
      if (v.hasCriticalViolation) ddProblems.push(`Don't broken: "${d.rule}" (${v.automatedChecks.criticalViolations[0].matchedFragment || ""}).`);
    } else if (!notes.some((n) => /must include/.test(n) && key.some((k) => n.includes(k)))) {
      ddProblems.push(`"Must include" not placed in a named scene's Editing Notes: "${d.rule}" (S-M13).`);
    }
  }
  check("dos_donts", "Every Do and Don't that applies to the script is met; each \"must include\" is placed in a named scene", ddProblems);
  if (judgedDonts.length) check("dos_donts_judged", "Brand and category Don'ts and legal rules are respected (the writer's self-check; a word match can't judge them)", judgedDonts, "self-check");

  // 19. Occasion as the concept specified — judgement
  check("occasion", "The occasion (if any) appears only as the concept specified, with its don'ts respected", [], "self-check");

  return { failures: [...new Set(fails)], checks, passed: !fails.length };
}

module.exports = { runGate, speakerMatches, formatMatches, runScriptGate, SCRIPT_BEATS, MAX_LINE_WORDS };
