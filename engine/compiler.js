// Shot Specification & Prompt Compiler
// Implements requirements from Sections 7, 8, 9, 10, 11, 12, 13, 14:
// - Structured Shot Specification
// - Separates STATIC WORLD from MOTION
// - Global Continuity Lock (compact)
// - Fixes "subject too small in frame" via intentional composition/framing
// - Non-over-cinematized, performance-oriented short-form video prompts
// - One primary action per shot
// - Physics intelligence (body weight, foot grounding, natural object interaction)
// - Cause -> Action -> Reaction sequencing

const { dialogueOf } = require("./parse");

const FRAMING_HIERARCHY = {
  HOOK: "Medium close-up (subject and hero product prominent in vertical frame)",
  BUILD: "Medium shot (character interaction with clear waist-up framing)",
  TURN: "Medium close-up (focused on product demonstration and reaction)",
  RESOLUTION: "Medium shot held on reassuring smile and clear product visibility",
};

/**
 * Extracts clean visual action and camera details from an Annex-A scene string.
 */
function extractSceneParts(sceneText) {
  if (!sceneText || typeof sceneText !== "string") {
    return { visual: "", camera: "smooth subtle push-in", dialogue: "None" };
  }

  const visualMatch = sceneText.match(/Visual:\s*([\s\S]*?)(?:\n\s*Animation Elements:|$)/i);
  let visual = visualMatch ? visualMatch[1].trim() : "";
  // Strip "Same setting:" prefix for clean action parsing
  visual = visual.replace(/^Same setting:\s*/i, "").trim();
  if (!visual) {
    // Fallback for non-standard or edited scene text
    visual = sceneText.replace(/\n\s*Editing Notes[^\n]*:[\s\S]*$/i, "").split("\n")[0].trim();
  }

  const cameraMatch = sceneText.match(/•?\s*Camera:\s*([^\n]+)/i);
  const camera = cameraMatch ? cameraMatch[1].trim() : "smooth subtle push-in";

  const { lines } = dialogueOf(sceneText);
  let dialogue = lines.map((l) => `${l.speaker}: "${l.text}"`).join(" | ");
  if (!dialogue) {
    const diaMatch = sceneText.match(/(?:Audio\s*\/\s*Dialogue\s*\/\s*Voiceover|Audio|Dialogue|VO):\s*(.+)$/im);
    if (diaMatch && !/^\(?none\b/i.test(diaMatch[1].trim())) {
      dialogue = diaMatch[1].trim();
    }
  }

  return { visual, camera, dialogue: dialogue || "None" };
}

/**
 * Compiles a structured Shot Specification from parsed script data.
 */
function compileShotSpecification(parsedScript, form = {}) {
  const duration = form.targetDuration || form.duration || "15s";
  const aspectRatio = form.aspectRatio || (String(form.platform).includes("16:9") ? "16:9" : String(form.platform).includes("1:1") ? "1:1" : "9:16");
  const platform = form.platform || (aspectRatio === "16:9" ? "YouTube Landscape / 16:9" : aspectRatio === "1:1" ? "Feed Square / 1:1" : "Instagram Reels / 9:16 Mobile");
  const language = form.language || "English";
  const style = form.creativeStyle || "UGC / Creator-style";
  const businessType = form.businessType || form.customBusinessType || "";

  const continuityLock = [
    `GLOBAL CONTINUITY LOCK:`,
    `- Characters: Same 2 individuals with identical face, hair, and wardrobe in every shot.`,
    `- Setting: Identical single location, identical time of day, lighting, and ambient surfaces.`,
    `- Product: Exact product visual identity maintained without morphing or text alteration.`,
    `- Physics: Realistic weight, grounded posture, plausible hands, natural gravity on all props.`,
  ].join("\n");

  const shots = (parsedScript.scenes || []).map((sceneText, idx) => {
    const { visual, camera, dialogue } = extractSceneParts(sceneText);
    const shotNumber = idx + 1;
    const beatNames = ["HOOK", "BUILD", "TURN", "RESOLUTION"];
    const beat = beatNames[idx] || `SHOT ${shotNumber}`;

    // Framing decision tailored for 9:16 mobile feeds (Subject prominent, never tiny)
    const framing = FRAMING_HIERARCHY[beat] || "Medium close-up, subject occupying upper-center 9:16 frame";

    // Primary physical action with Cause -> Action -> Reaction
    const primaryAction = visual.split(".")[0] ? visual.split(".")[0].trim() + "." : visual;

    return {
      shotNumber,
      beat,
      framing,
      primaryAction,
      fullVisual: visual,
      cameraMovement: camera,
      dialogue: dialogue || "None",
    };
  });

  return {
    project: {
      aspectRatio: aspectRatio || "9:16",
      duration,
      platform,
      language,
      style,
      businessName: form.businessName,
      businessType,
      productOrService: form.specialty || form.product || businessType,
    },
    staticWorld: {
      setting: (parsedScript.setting || "").replace(/\s*UIs needed:\s*none\.?/i, "").trim(),
      characters: [parsedScript.character1, parsedScript.character2].filter(Boolean).join(" | "),
      businessType,
    },
    continuityLock,
    shots,
  };
}

/**
 * Compiles the production-ready prompt for a single shot to send to Magnific.
 * Separates STATIC WORLD from MOTION and enforces composition rules.
 */
function compileShotPrompt(shot, staticWorld, options = {}) {
  const totalDuration = options.duration || options.targetDuration || "15s";
  const totalSec = parseInt(totalDuration, 10) || 15;
  const shotCount = options.shotCount || 4;
  const perShotSec = (totalSec / shotCount).toFixed(1);
  const aspectRatio = options.aspectRatio || options.dimension || staticWorld.aspectRatio || (String(staticWorld.platform || options.platform).includes("16:9") ? "16:9" : String(staticWorld.platform || options.platform).includes("1:1") ? "1:1" : "9:16");

  // landscape (16:9) and square (1:1) shots must not still be described as "in vertical frame"
  const reframe = { "16:9": ["horizontal", "16:9"], "1:1": ["square", "1:1"] }[aspectRatio];
  const framing = reframe ? shot.framing.replace(/vertical/gi, reframe[0]).replace(/9:16/g, reframe[1]) : shot.framing;

  const framingDirective = aspectRatio === "16:9"
    ? "WIDESCREEN 16:9 COMPOSITION: Cinematic landscape horizontal framing. Wide horizontal depth with comfortable two-shot or medium wide staging, ample room context, and natural lateral camera tracking."
    : aspectRatio === "1:1"
    ? "SQUARE 1:1 COMPOSITION: Balanced square composition with centered subject framing, equal headroom and side margins, optimized for social feed grids."
    : "VERTICAL 9:16 COMPOSITION: Mobile-native vertical framing. Subject/character fills primary vertical 9:16 viewing area with clear head-and-chest or waist-up visibility.";

  const activeFormat = String(staticWorld.style || options.style || options.format || "").toLowerCase();
  const formatDirective = activeFormat.includes("story")
    ? "STRICT STORYTELLING CAM: Cinematic third-person perspective only. The camera observes the characters objectively. Actors DO NOT hold smartphones or film themselves."
    : activeFormat.includes("demo")
    ? "PRODUCT DEMO STAGING: Physical product front-and-center with tactile hands-on clarity, crisp texture visibility, and sensory visual proof."
    : (activeFormat.includes("conversational") || activeFormat.includes("dialogue"))
    ? "CONVERSATIONAL DIALOGUE STAGING: Natural over-the-shoulder and two-shot framing capturing authentic human dialogue, active listening, and responsive facial reactions."
    : activeFormat.includes("comedy")
    ? "COMEDIC TIMING & EXPRESSION: Clear two-shot framing capturing humorous facial expressions, comic timing, and witty character interaction."
    : `UGC / CREATOR STAGING: Mobile-native ${reframe ? "" : "vertical "}framing with authentic intimacy, natural handheld energy, and creator point-of-view.`;

  const productPhoto = options.productPhoto || staticWorld.productPhoto;
  const productVisualRef = productPhoto
    ? `PRODUCT VISUAL REFERENCE: Render physical product matching reference photo ("${productPhoto.name || 'product packaging'}"), with accurate brand packaging, colors, and label details.`
    : null;

  const lines = [
    // 1. Framing & Composition (Prevents "subject too small in frame")
    `COMPOSITION & FRAMING: ${framing}. ${framingDirective} Hero product/service is clearly discernible. ${formatDirective}`,

    productVisualRef,

    // 2. Static World (Environment, Lighting, Wardrobe consistency)
    `STATIC WORLD: Location: ${staticWorld.setting}. Characters: ${staticWorld.characters}.${staticWorld.businessType ? ` Business domain: ${staticWorld.businessType}.` : ""} Same lighting, color palette, and atmosphere throughout.`,

    // 3. Motion (Action, Camera, Physics & Physical Interaction)
    `MOTION & ACTION (Cause → Action → Reaction): ${shot.primaryAction} ${shot.fullVisual !== shot.primaryAction ? shot.fullVisual : ""}`,

    // 4. Camera (Subtle, motivated, not over-cinematized)
    `CAMERA MOTION: ${shot.cameraMovement}. Natural smooth motivated movement, eye-level or slight motivated angle, no disorienting whip pans or 360-degree spins.`,

    // 5. Physics & Human Reality
    `PHYSICALITY: Natural body weight distribution, feet firmly grounded on the floor, realistic hand grip on objects with physical contact and resistance. Natural eye contact between interacting characters.`,

    // 6. Timing & Spacing
    `TIMING: Shot duration ~${perShotSec}s (part of a ${totalDuration} commercial film). Fast, crisp, responsive pacing.`,

    // 7. Audio Delivery (Voiceover vs. On-Screen Spoken Acting)
    (() => {
      if (!shot.dialogue || shot.dialogue === "None" || /^\(?none\b/i.test(shot.dialogue)) return null;
      const isVo = /^(?:text\s*[\+&]\s*)?(?:vo|v\.o\.|v\/o|voiceover|voice[\s-]over|narrator|narration|off[\s-]screen|audio)\b/i.test(shot.dialogue);
      if (isVo) {
        return `AUDIO & NARRATION: Off-screen Voiceover narration (${shot.dialogue}). The on-screen actor does NOT lip-sync or speak to camera; character performs physical action and authentic expressions matching the narrative tone.`;
      }
      return `SPOKEN DIALOGUE & ACTING DELIVERY: ${shot.dialogue}. The character visibly speaks this line on camera with natural expressive mouth/lip movement, engaged facial expressions, and authentic conversational delivery.`;
    })(),
  ].filter(Boolean);

  return lines.join("\n\n");
}

module.exports = {
  extractSceneParts,
  compileShotSpecification,
  compileShotPrompt,
  FRAMING_HIERARCHY,
};
