// Product Spine Section 8 quality gate — the checks that code can verify reliably.
// Claude also self-checks (M18); this is the backstop that can't be talked out of.
const { dialogueOf } = require("./parse");
const { festiveDecorFor } = require("./festive");

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

/**
 * parsed: output of parseOutput; f: validated form; opts: { scriptMode, previous }
 * Returns an array of failure strings (empty = pass).
 */
function runGate(parsed, f, { scriptMode = "devanagari", previous = [], approvedFormat = "", festival = "" } = {}) {
  const fails = [];
  const h = parsed.header;

  // header
  for (const k of ["business", "format", "lens", "hook", "moment"]) {
    if (!h[k]) fails.push(`Header is missing "${k[0].toUpperCase() + k.slice(1)}:".`);
  }
  const format = (h.format || "").toLowerCase();
  if (h.format && !/^(ugc|storytelling)\b/.test(format)) fails.push(`Format must be UGC or Storytelling (VO-led is switched off); got "${h.format}".`);
  if (approvedFormat && h.format && !format.startsWith(approvedFormat.toLowerCase())) fails.push(`Format "${h.format}" differs from the owner-approved format "${approvedFormat}" (Checkpoint 3).`);

  // context block
  for (const [k, v] of [["CHARACTER1", parsed.character1], ["CHARACTER2", parsed.character2]]) {
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
  if (n !== 4) fails.push(`Script has ${n} scenes; it must have exactly 4 (M6).`);

  const allowText = `${f.offer || ""} ${f.specialty || ""} ${f.contact || ""}`.toLowerCase();
  const offerDigits = (f.offer || "").replace(/[^\d]/g, " ").split(/\s+/).filter(Boolean);
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
    {
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
      if (/^vo$|voice\s*over|narrator/i.test(speaker)) fails.push(`${S} uses a VO/narrator — VO-led is switched off; dialogue must come from a character.`);
      else if (!speakerMatches(speaker, parsed.character1) && !speakerMatches(speaker, parsed.character2)) {
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
  parsed.scenes.forEach((sc, i) => {
    const title = (sc.split("\n")[0] || "");
    if (BEATS[i] && !new RegExp(`\\b${BEATS[i]}\\b`, "i").test(title)) fails.push(`Scene ${i + 1} title must be "SCENE ${i + 1} – ${BEATS[i]}: …" — the 4 scenes follow HOOK → BUILD → TURN → RESOLUTION (M27).`);
  });
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
    const ownerScenes = speakers.filter((s) => speakerMatches(s, parsed.character1)).reduce((a, s) => a + speakerScenes[s], 0);
    if (ownerScenes > 3) fails.push(`UGC: the owner speaks in ${ownerScenes} scenes; max 3 of the 4, the other is B-roll (Section 6).`);
  } else if (totalLines >= 3 && speakers.length < 2) {
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

  return [...new Set(fails)];
}

module.exports = { runGate, speakerMatches };
