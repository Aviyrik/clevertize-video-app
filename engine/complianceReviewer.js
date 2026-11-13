/**
 * engine/complianceReviewer.js
 * Second, independent LLM pass: a compliance reviewer that sees ONLY the generated script and the category
 * module (universal + category rules, and which proof fields are on file). It never sees the brief, the
 * writer's prompt or the business form, so it cannot be talked round by them.
 *
 * The deterministic scanner (engine/categoryGuardrails.js) catches listed words and visuals; this pass catches
 * what word lists can't - implied claims, testimonials, stereotypes, mocking, mood, unsafe acts described in
 * other words, celebrity look-alikes - and reports each with a quote and a fix.
 *
 * Disabled with COMPLIANCE_REVIEWER=off. Fails soft (status "unavailable") when the model is unreachable.
 */

const { callClaude } = require("./claude");
const { parseJSONBlock } = require("./parse");
const cg = require("./categoryGuardrails");

const SYSTEM = `You are an independent advertising-compliance reviewer for short local video ads in India.
You did not write the script and you have no stake in it. You check it ONLY against the CATEGORY MODULE you are given:
the universal rules, then the category rules (when two rules conflict, the stricter rule wins).

How to review:
- Read every scene's dialogue, voiceover and visual description (Roman and Devanagari; Hinglish mixes both).
- Report a violation only when a specific rule in the module is broken. Quote the exact words from the script.
- A claim gated on a proof field is allowed only when the module says that proof is ON FILE.
- You cannot see the owner's form. For factual details the module says must "come from the form" (prices, offers,
  years, services, distances), report them with severity "review" so a human can check them - not "reject" -
  unless the module marks the needed proof NOT ON FILE.
- Check the mood against the module's enforced mood.
- Do not invent rules, soften rules or extend them. Do not comment on creative quality.

Answer with JSON only, between @@JSON@@ and @@END@@:
@@JSON@@
{"verdict": "pass" | "fail",
 "violations": [
   {"rule": "rule id or short name from the module", "severity": "reject" | "review",
    "scene": <scene number or null>, "field": "dialogue" | "voiceover" | "visual",
    "quote": "exact words from the script", "why": "which rule and why", "fix": "the smallest change that complies"}
 ],
 "mood_ok": true | false}
@@END@@
verdict is "fail" when any violation has severity "reject".`;

function enabled() {
  return String(process.env.COMPLIANCE_REVIEWER || "on").toLowerCase() !== "off";
}

/** The module as the reviewer sees it: rules + proof status, no business details. */
function moduleDocument(ctx) {
  const rules = cg.loadRules();
  const proofStatus = ctx.proofFields.map((f) => `- ${f.label}: ${ctx.proof[f.id] != null ? "ON FILE" : "NOT ON FILE"}`).join("\n");
  return [
    cg.formatPromptBlock(ctx, "compliance review"),
    "",
    "PROOF FIELDS:",
    proofStatus,
    "",
    `HUMAN REVIEW RULE: ${ctx.category ? ctx.category.human_review_rule.label : "none"}.`,
    `QUALITY GATE CHECKLIST: ${rules.quality_gate.checklist.map((c) => c.text).join(" | ")}`,
  ].join("\n");
}

function scriptDocument(script) {
  const segs = cg.extractSegments(script);
  return segs.map((s) => `${s.scene ? `SCENE ${s.scene}` : (s.part || "CONTEXT").toUpperCase()} [${s.field}]${s.speaker ? ` ${s.speaker}:` : ""} ${String(s.text).replace(/\s+/g, " ").trim()}`).join("\n");
}

function cleanViolation(v) {
  if (!v || typeof v !== "object") return null;
  const severity = v.severity === "review" ? "review" : "reject";
  const field = ["dialogue", "voiceover", "visual"].includes(v.field) ? v.field : "visual";
  const quote = String(v.quote || "").slice(0, 300);
  const why = String(v.why || "").slice(0, 400);
  if (!quote && !why) return null;
  const scene = Number.isFinite(Number(v.scene)) && v.scene !== null ? Number(v.scene) : null;
  return { rule: String(v.rule || "").slice(0, 80), severity, scene, field, quote, why, fix: String(v.fix || "").slice(0, 400) };
}

/**
 * Returns { status: "reviewed" | "skipped" | "unavailable", verdict, violations, moodOk, reviewedAt }.
 * call is injectable for tests.
 */
async function reviewScript({ ctx, script, call = callClaude } = {}) {
  if (!cg.isComplianceContext(ctx)) return { status: "skipped", reason: "No compliance context." };
  if (!enabled()) return { status: "skipped", reason: "COMPLIANCE_REVIEWER is off." };
  const scriptText = scriptDocument(script);
  if (!scriptText.trim()) return { status: "skipped", reason: "Empty script." };
  try {
    const raw = await call({
      system: SYSTEM,
      content: `CATEGORY MODULE:\n${moduleDocument(ctx)}\n\nSCRIPT TO REVIEW:\n${scriptText}`,
      maxTokens: 3000,
      thinking: false,
    });
    const parsed = parseJSONBlock(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.violations)) throw new Error("reviewer answer had no violations list");
    const violations = parsed.violations.map(cleanViolation).filter(Boolean);
    const verdict = violations.some((v) => v.severity === "reject") ? "fail" : "pass";
    return { status: "reviewed", verdict, violations, moodOk: parsed.mood_ok !== false, reviewedAt: new Date().toISOString() };
  } catch (e) {
    console.warn(`[compliance-review] unavailable: ${e.message}`);
    return { status: "unavailable", reason: "The compliance reviewer could not run; the rule scanner still ran.", reviewedAt: new Date().toISOString() };
  }
}

/** Reviewer rejects as quality-gate failure strings, so the writer's repair loop can fix them. */
function reviewerFailures(review) {
  if (!review || review.status !== "reviewed") return [];
  return review.violations
    .filter((v) => v.severity === "reject")
    .map((v) => `Compliance reviewer${v.rule ? ` (${v.rule})` : ""}: "${v.quote}"${v.scene ? ` in Scene ${v.scene}` : ""} ${v.field} - ${v.why}${v.fix ? ` Fix: ${v.fix}` : ""}`);
}

module.exports = { reviewScript, reviewerFailures, moduleDocument, scriptDocument, enabled, SYSTEM };
