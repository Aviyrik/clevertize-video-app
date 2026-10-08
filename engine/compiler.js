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
  const visualMatch = sceneText.match(/Visual:\s*([\s\S]*?)(?:\n\s*Animation Elements:|$)/i);
  let visual = visualMatch ? visualMatch[1].trim() : "";
  // Strip "Same setting:" prefix for clean action parsing
  visual = visual.replace(/^Same setting:\s*/i, "").trim();

  const cameraMatch = sceneText.match(/•\s*Camera:\s*([^\n]+)/i);
  const camera = cameraMatch ? cameraMatch[1].trim() : "smooth subtle push-in";

  const { lines } = dialogueOf(sceneText);
  const dialogue = lines.map((l) => `${l.speaker}: "${l.text}"`).join(" | ");

  return { visual, camera, dialogue };
}

/**
 * Compiles a structured Shot Specification from parsed script data.
 */
function compileShotSpecification(parsedScript, form = {}) {
  const duration = form.duration || "15s";
  const platform = form.platform || "Instagram Reels / 9:16 Mobile";
  const language = form.language || "Hindi";
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
      aspectRatio: "9:16",
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
  const totalDuration = options.duration || "15s";
  const totalSec = parseInt(totalDuration, 10) || 15;
  const shotCount = options.shotCount || 4;
  const perShotSec = (totalSec / shotCount).toFixed(1);

  const lines = [
    // 1. Framing & Composition (Prevents "subject too small in frame")
    `COMPOSITION & FRAMING: ${shot.framing}. Subject/character fills primary vertical 9:16 viewing area with clear head-and-chest or waist-up visibility. Hero product is clearly discernible and never obscured.`,

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

    // 7. Spoken Dialogue & Visible Acting Delivery
    shot.dialogue && shot.dialogue !== "None"
      ? `SPOKEN DIALOGUE & ACTING DELIVERY: ${shot.dialogue}. The character visibly speaks this line on camera with natural expressive mouth/lip movement, engaged facial expressions, and authentic conversational delivery.`
      : null,
  ].filter(Boolean);

  return lines.join("\n\n");
}

module.exports = {
  compileShotSpecification,
  compileShotPrompt,
  FRAMING_HIERARCHY,
};
