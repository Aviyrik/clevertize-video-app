// Builds the system prompt (spine.md) and the user message for one Generate.
const fs = require("fs");
const path = require("path");
const HOOKS = require("./hooks.json");
const { festiveDecorFor } = require("./festive");

const SPINE_FILE = path.join(__dirname, "spine.md");
const STAGE_FALLBACK = "Now write the film (Stage 4). Return only the OUTPUT markers.";

const SCRIPT_RULES = {
  devanagari:
    "DIALOGUE SCRIPT RULE (critical for pronunciation): when LANGUAGE is Hindi or Hinglish, EVERY spoken line is written fully in Devanagari — including the English words people mix in when they speak Hinglish, transliterated as they are pronounced: \"भैया, ये फ़ोन ऑनलाइन से सस्ता है?\", \"होम डिलीवरी फ़्री है, बस एक कॉल कीजिए।\", \"ऑफ़र सिर्फ़ दिवाली तक।\" Never write \"bhaiya\", \"phone\", \"online\", \"delivery\" or \"offer\" in Roman letters inside a Hindi/Hinglish line. Hinglish means natural Hindi with English words mixed in — the words are mixed, the script is always Devanagari. Marathi is also written in Devanagari; any other Indian language in its own script. English dialogue stays in English. Only the business name, the owner's name and brand/product names exactly as the owner typed them in the form may stay in Roman letters. Write numbers as digits (40%, ₹199) so they are read correctly.",
  roman:
    "TEST MODE: write Hindi/Hinglish/Marathi dialogue in Roman letters (romanized transliteration), NOT Devanagari, spelling hard words phonetically as they sound (\"doo-kaan\"). Keep each word's spelling identical across all scenes. This overrides the Devanagari rule.",
};

function buildSystem(scriptMode = "devanagari") {
  const spine = fs.readFileSync(SPINE_FILE, "utf8").replace(/<!--[\s\S]*?-->/g, "");
  return spine.replace("{{SCRIPT_RULE}}", SCRIPT_RULES[scriptMode] || SCRIPT_RULES.devanagari);
}

function hookLibraryText() {
  const lines = [`HOOK LIBRARY (pulled ${HOOKS.pulled})`];
  for (const lib of HOOKS.libraries) {
    lines.push(`\nLibrary: ${lib.id}`);
    for (const p of lib.patterns.filter((x) => x.usable)) {
      lines.push(`- ${p.category ? `[${p.category}] ` : ""}${p.name}: ${p.structure} (reference only: "${p.reference}")${p.rule ? ` RULE: ${p.rule}` : ""}`);
    }
  }
  lines.push(`\nLocal versions of library patterns (count as library "TrueFan AI"):`);
  for (const p of HOOKS.local_versions.patterns) lines.push(`- ${p.name}: ${p.line} — use with: ${p.use_with}`);
  lines.push(`\nAnnex C fallback patterns (library "Annex C"):`);
  for (const p of HOOKS.annex_c) lines.push(`- ${p.name}: ${p.structure}`);
  return lines.join("\n");
}

function festivalText(fest) {
  if (!fest.moments.length) return `FESTIVAL CALENDAR (source: ${fest.source}): no moments found in the next 30 days — write an everyday film unless OCCASION is filled.`;
  const rows = fest.moments.map((m) =>
    `- ${m.name}: ${m.start}${m.end && m.end !== m.start ? ` to ${m.end}` : ""} | days_until: ${m.days_until}${m.ongoing ? " (ongoing)" : ""} | where: ${m.where || m.states || "?"} | ${m.activities || ""}${m.note ? ` | note: ${m.note}` : ""}`
  );
  return `FESTIVAL CALENDAR (source: ${fest.source}, checked ${fest.checked}):\n${rows.join("\n")}`;
}

/**
 * f: validated form. Returns the Messages API `content` array.
 * Images go first, each preceded by a text label so Claude knows which is which.
 */
function buildUserContent(f, fest, previous, today, stageText = STAGE_FALLBACK) {
  const content = [];
  const imageBlock = (img) => ({
    type: "image",
    source: { type: "base64", media_type: img.mime, data: img.data },
  });

  if (f.shopPhoto) {
    content.push({ type: "text", text: "SHOP PHOTO (the real shop and/or owner — match the setting and the owner's look to it; never reproduce signboard text or logos on screen):" });
    content.push(imageBlock(f.shopPhoto));
  }
  if (f.productPhoto) {
    content.push({ type: "text", text: "PRODUCT PHOTO (a real product this business sells — show it accurately in at least one scene, no readable label text):" });
    content.push(imageBlock(f.productPhoto));
  }

  const v = (x, d) => (x && String(x).trim()) || d;
  const form = [
    `BUSINESS_NAME: ${f.businessName}`,
    `BUSINESS_TYPE: ${f.businessType}`,
    `TOWN: ${f.town}`,
    `LANGUAGE: ${f.language}`,
    `AREA: ${v(f.area, "(blank — use the default)")}`,
    `SPECIALTY: ${v(f.specialty, "(blank — use the default)")}`,
    `OFFER: ${v(f.offer, "(blank — no offer; sell the business itself)")}`,
    `OCCASION: ${v(f.occasion, "(blank — decide via the festival section)")}`,
    `CONTACT: ${v(f.contact, "(blank — visit-the-shop ending)")}`,
    `OWNER_NAME: ${v(f.ownerName, "(blank — unnamed UGC speaker)")}`,
    `SHOP PHOTO: ${f.shopPhoto ? "attached above" : "none"}`,
    `PRODUCT PHOTO: ${f.productPhoto ? "attached above" : "none"}`,
  ].join("\n");

  const prev = previous.length
    ? `PREVIOUS SCRIPTS for this business (oldest first; the LAST one is the previous script):\n${previous.map((r) => JSON.stringify(r)).join("\n")}`
    : "PREVIOUS SCRIPTS: none — this is the first script for this business.";

  content.push({
    type: "text",
    text: `TODAY: ${today}

FORM
${form}

${festivalText(fest)}

${hookLibraryText()}

${prev}

${stageText}`,
  });
  return content;
}

// ---- checkpoint stages (Product Spine v2) ----

// Checkpoint text is always plain English (the dashboard's language). LANGUAGE is only for the film's dialogue.
const ownerLang = () => "plain, simple English";
const dialogueLang = (f) =>
  `${f.language}${/hindi|hinglish|marathi/i.test(f.language) ? ", written fully in Devanagari (M4)" : ""}`;

const SHAPES = {
  direction: (f) => `{"lens": "#, name",
 "tensions": [
   {"owner": "one short line in ${ownerLang(f)}, with the everyday example"},
   {"owner": "..."},
   {"owner": "..."}
 ],
 "festival": {"use": true or false, "name": "moment name or everyday", "owner": "one line in ${ownerLang(f)}: will / won't use it and why"}}`,
  plot: (f) => `{"framing": "the winning framing, 2 lines, English",
 "plots": [
   {"owner": "THE ONE-LINE PLOT ITSELF, in ${ownerLang(f)} — this key must be named exactly \"owner\"", "hook_pattern": "pattern name from the HOOK LIBRARY", "hook_library": "Indian Instagram creators | TrueFan AI | GoFaceless | Annex C"},
   {"owner": "the second plot", "hook_pattern": "...", "hook_library": "..."},
   {"owner": "the third plot", "hook_pattern": "...", "hook_library": "..."}
 ]}`,
  story: (f) => `{"format": "UGC or Storytelling",
 "format_owner": "one line in ${ownerLang(f)}: your film will be <format> because ...",
 "core_idea": "2 lines, English",
 "through_line": "English: the question, object or running joke that carries from Scene 1 to Scene 4 (M27)",
 "location": "English: the ONE place all 4 scenes happen — clean, well-kept middle-class / upper-middle-class look (M13-class), with the festival's decor if festival-led (M13e)",
 "characters": ["character 1 role, English", "character 2 role, English"],
 "scenes": [
   {"beat": "HOOK", "owner": "Scene 1 in one line, ${ownerLang(f)} — the scroll-stopping hook and the customer's problem"},
   {"beat": "BUILD", "owner": "Scene 2 — the problem gets real, the business enters"},
   {"beat": "TURN", "owner": "Scene 3 — the business solves it: surprise, relief or proof"},
   {"beat": "RESOLUTION", "owner": "Scene 4 — emotional payoff with a callback to the hook"}
 ],
 "hook_line": "the opening spoken line exactly as it will be said in the film, in ${dialogueLang(f)}", "hook_pattern": "pattern name", "hook_library": "Indian Instagram creators | TrueFan AI | GoFaceless | Annex C",
 "visual_world": "English: time of day, light, colours, the look of the shop",
 "ending": "English: how it ends so the end card follows"}`,
};

const STAGE_TASK = {
  direction: "STAGE 1 → Checkpoint 1 (Direction). Run Sections 1–5 internally: profile, festival decision, lens, tension ranking (top 3), hook shortlist. Return the top 3 customer tensions, recommended first, and the festival decision.",
  plot: "STAGE 2 → Checkpoint 2 (Plot line). Run 7.1 Framing (keep the best, internal) and 7.2: 3 one-line plots, recommended first, each opening with a different hook pattern from the HOOK LIBRARY. Every plot plays out in ONE location (normally the business itself) with exactly 2 characters (M13a) — no cutaways to a home or street. Each plot is a mini-story in one line — hook, then what goes wrong, then how the business resolves it (M27) — opening with a creator-style viral hook (M26), preferably from the Indian Instagram creators library. Make the plots fun, upbeat and real — a situation people laugh at or instantly relate to (M28).",
  story: "STAGE 3 → Checkpoint 3 (Story and format). Score the format (Section 6; UGC or Storytelling only) and build the 7.3 concept for the chosen plot: the ONE location and the 2 characters (M13a), a 4-scene outline with every scene in that same location, the opening hook, the visual world and the ending. The 4 scenes follow the arc HOOK → BUILD → TURN → RESOLUTION as one cohesive story with a through-line and a callback to the hook in Scene 4 (M27); the hook line sounds like a real Indian Instagram creator (M26).",
};

function approvedText(s) {
  const lines = [];
  if (s.direction && s.direction.choice != null) {
    const t = s.direction.out.tensions[s.direction.choice];
    lines.push(`Checkpoint 1 approved — lens: ${s.direction.out.lens}; customer tension: ${t.owner || t.en}; festival: ${s.direction.out.festival.use ? s.direction.out.festival.name : "none — everyday film"} (${s.direction.out.festival.owner || s.direction.out.festival.en || ""}).`);
  }
  if (s.plot && s.plot.choice != null) {
    const pl = s.plot.out.plots[s.plot.choice];
    lines.push(`Checkpoint 2 approved — framing: ${s.plot.out.framing}; plot: ${pl.owner || pl.en}; hook pattern: ${pl.hook_pattern} (${pl.hook_library}).`);
  }
  if (s.story && s.story.approved) {
    const st = s.story.out;
    lines.push(`Checkpoint 3 approved — format: ${st.format}; core idea: ${st.core_idea}; one location for every scene: ${st.location || "the business itself"}; the only 2 characters: ${(st.characters || []).join(" and ") || "as in the outline"}; scenes: ${st.scenes.map((x, i) => `${i + 1}) ${x.owner || x.en}`).join(" ")}; opening hook: ${st.hook_line || st.hook_owner} [${st.hook_pattern} – ${st.hook_library}]; visual world: ${st.visual_world}; through-line: ${st.through_line || "(keep one)"}; ending: ${st.ending}.`);
  }
  return lines.length ? `OWNER-APPROVED SO FAR (follow exactly):\n${lines.join("\n")}` : "OWNER-APPROVED SO FAR: nothing yet.";
}

function changeText(change) {
  if (!change) return "";
  return `\n\nThe owner asked for a CHANGE at this checkpoint: "${change.note}"\nYour previous answer for this checkpoint was:\n${change.previous}\nRevise it to honour the request (M18a). Keep what they did not ask to change.`;
}

// The festival the approved direction uses (or the owner's OCCASION), for M13e decor
function festivalOf(session) {
  const fz = session.direction && session.direction.out && session.direction.out.festival;
  if (fz && fz.use && fz.name) return fz.name;
  return session.form.occasion || "";
}

function lookText(session) {
  const lines = ["SETTING LOOK (M13-class): clean, well-kept, organised middle-class / upper-middle-class look — good light, neat displays, modern touches; not run-down, not luxury."];
  const fest = festivalOf(session);
  const d = festiveDecorFor(fest);
  if (d) lines.push(`FESTIVE LOOK (M13e) — this film is set around ${fest}: the SETTING must visibly include ${d.decor}. Put it in the SETTING paragraph so it appears in every scene. Decor only — no deities, idols or ritual close-ups (M24).`);
  else if (fest) lines.push(`FESTIVE LOOK (M13e) — this film is set around ${fest}: the SETTING must visibly include that festival's real, recognisable decor, in the SETTING paragraph so it appears in every scene. Decor only — no deities, idols or ritual close-ups (M24).`);
  return lines.join("\n");
}

/** Instruction text for stage 1–3 (JSON) or 4 (script). */
function stageInstruction(stage, session, change) {
  const f = session.form;
  if (stage === "script") {
    return `${approvedText(session)}

${lookText(session)}

STAGE 4 → write the script now. Dialogue language: ${dialogueLang(f)}. Everything else in the script is English. Write it exactly following the approved story, format and hook: exactly 4 scenes, ONE setting used by every scene (the approved location — never a second location) and exactly 2 characters on screen (M13a); scenes titled SCENE 1 – HOOK / SCENE 2 – BUILD / SCENE 3 – TURN / SCENE 4 – RESOLUTION forming one cohesive story where each scene picks up exactly where the last ended, with the approved through-line and a callback to the hook in Scene 4 (M27); the opening line is the approved creator-style hook and all dialogue is punchy and natural, no ad-speak (M26); make it fun, upbeat and realistic — banter with real reactions, specific local details, at least one laugh or delight beat, a quotable payoff in Scene 4, and motion with expressive physical reactions in every scene (M28); every Visual starts with "Same setting:" and never changes the room, light or time of day (M13b); vary the camera from scene to scene — shot size, angle and gentle movement, no two consecutive scenes alike (M13c); when characters talk to each other, write that they look at each other, never staring off (M13d), at most 2 lines per character per scene. Run the quality gate yourself, then return only the OUTPUT markers.${changeText(change)}`;
  }
  return `${approvedText(session)}
${stage === "story" ? `\n${lookText(session)}\n` : ""}
${STAGE_TASK[stage]}
Return ONLY this JSON (valid JSON, no comments) between the markers:
@@JSON@@
${SHAPES[stage](f)}
@@END@@${changeText(change)}`;
}

function buildRepairContent(originalUserContent, previousOutput, failures) {
  return [
    ...originalUserContent,
    {
      type: "text",
      text: `Your previous script (below) failed the quality gate. Fix ONLY what fails, keep everything else the same — including the owner-approved story, format and hook — and return the complete output again with the same markers.

FAILED CHECKS:
${failures.map((x) => `- ${x}`).join("\n")}

PREVIOUS OUTPUT:
${previousOutput}`,
    },
  ];
}

module.exports = { buildSystem, buildUserContent, stageInstruction, buildRepairContent, festivalOf, HOOKS_PULLED: HOOKS.pulled };
