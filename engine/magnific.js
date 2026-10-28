// Magnific Flows API: flow routing, input discovery, input mapping, run, status.
const BASE = "https://api.magnific.com/v1/ai/flows";
const SPEC_TTL_MS = 5 * 60 * 1000; // flow keys change when the flow is edited — don't cache forever

const key = () => process.env.MAGNIFIC_API_KEY;

// One flow per (aspect ratio, product image?, logo image?) — the flow is chosen from what the user
// actually uploaded, so no flow is ever fed a placeholder image. IDs come from the server env only.
const FLOWS = [
  { aspectRatio: "9:16", product: true, logo: true, env: "FLOW_916_PRODUCT_LOGO", id: "0MQyTfWvQD" },
  { aspectRatio: "9:16", product: true, logo: false, env: "FLOW_916_PRODUCT_NOLOGO", id: "rl5XxtcFH6" },
  { aspectRatio: "9:16", product: false, logo: true, env: "FLOW_916_NOPRODUCT_LOGO", id: "TeYJVNR8Ta" },
  { aspectRatio: "9:16", product: false, logo: false, env: "FLOW_916_NOPRODUCT_NOLOGO", id: "kLqd16BU1G" },
  { aspectRatio: "16:9", product: true, logo: true, env: "FLOW_169_PRODUCT_LOGO", id: "MXcPDCmYv9" },
  { aspectRatio: "16:9", product: true, logo: false, env: "FLOW_169_PRODUCT_NOLOGO", id: "Pi7b42C8Sz" },
  { aspectRatio: "16:9", product: false, logo: true, env: "FLOW_169_NOPRODUCT_LOGO", id: "wPlQ7EIQVN" },
  { aspectRatio: "16:9", product: false, logo: false, env: "FLOW_169_NOPRODUCT_NOLOGO", id: "jSkvLD0Vkf" },
];
const ASPECT_RATIOS = ["9:16", "16:9"];
const FLOW_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;

function selectFlow({ aspectRatio = "9:16", hasProduct, hasLogo }) {
  const flow = FLOWS.find((f) => f.aspectRatio === aspectRatio && f.product === Boolean(hasProduct) && f.logo === Boolean(hasLogo));
  if (!flow) throw Object.assign(new Error(`Unsupported aspect ratio "${aspectRatio}" — use ${ASPECT_RATIOS.join(" or ")}.`), { status: 400 });
  const id = String(process.env[flow.env] || "").trim() || flow.id;
  // never fall back to another combination's flow — a wrong flow wastes a render
  if (!FLOW_ID_RE.test(id)) {
    throw new Error(`Magnific flow for ${aspectRatio}, product=${hasProduct ? "yes" : "no"}, logo=${hasLogo ? "yes" : "no"} is not configured — set ${flow.env} in .env`);
  }
  return id;
}

const hasImage = (dataUrl) => typeof dataUrl === "string" && /^data:image\/[\w.+-]+;base64,\S/.test(dataUrl);

const specCache = new Map(); // flowId -> { inputs, at }

async function getFlowInputs(id, force = false) {
  const cached = specCache.get(id);
  if (!force && cached && Date.now() - cached.at < SPEC_TTL_MS) return cached.inputs;

  const r = await fetch(`${BASE}/${id}`, {
    headers: { "x-magnific-api-key": key() },
    signal: AbortSignal.timeout(20000),
  });
  const raw = await r.text();
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error(`Could not read flow spec (HTTP ${r.status}): ${raw.slice(0, 200)}`); }
  if (!r.ok || data.error) throw new Error(data.error?.message || `Flow spec HTTP ${r.status}`);

  const inputs = data.inputs || data.data?.inputs || [];
  if (!inputs.length) throw new Error("Flow spec returned no inputs");
  specCache.set(id, { inputs, at: Date.now() });
  console.log(`[flow ${id}] inputs: ${inputs.map((i) => `${i.id || i.name} [${i.label || "-"}]${i.required ? "*" : ""}`).join(", ")}`);
  return inputs;
}

// Each flow names its inputs differently (scenes_2 / scenes_7, poduct / product_2, images / logo_5),
// so inputs are matched against the flow's own spec — by label and by key, with "_" read as a space.
function mapInputs(flowInputs, values) {
  const out = {};
  const used = new Set();
  const keyOf = (i) => String(i.id || i.name || "");
  const textOf = (i) => `${i.label || ""} ${i.name || ""} ${keyOf(i)}`.toLowerCase().replace(/[_-]+/g, " ");

  const pick = (test) => flowInputs.find((i) => !used.has(keyOf(i)) && test(textOf(i), i));
  const assign = (input, value) => {
    if (!input || value == null || value === "" || (Array.isArray(value) && !value.length)) return null;
    out[keyOf(input)] = value;
    used.add(keyOf(input));
    return keyOf(input);
  };

  assign(pick((t, i) => /\bscenes?\b/.test(t) || i.type === "list"), values.scenes);
  assign(pick((t) => /\bcharacter\s*\(?\s*(1|one)\b/.test(t)), values.character1);
  assign(pick((t) => /\bcharacter\s*\(?\s*(2|two)\b/.test(t)), values.character2);
  assign(pick((t) => /\b(setting|environment|location|world)\b/.test(t)), values.setting);
  // "poduct" is a typo in the 0MQyTfWvQD flow; its logo slot is called "images"
  const PRODUCT_RE = /\b(product|poduct|prodct|prouct|produt)s?\b/;
  const LOGO_RE = /\b(logo|brand ?mark|brand ?logo)\b/;
  const LOGO_KEY_RE = /^images?(_\d+)?$/i;
  const isImage = (t, i) => /image|media|asset|file/i.test(`${i.type || ""} ${i.kind || ""}`) || /\b(image|photo|picture)s?\b/.test(t);

  // 1) named matches first, so neither image can land in the other's slot
  const productInput = pick((t) => PRODUCT_RE.test(t));
  let product = values.productDataUrl ? assign(productInput, values.productDataUrl) : null;
  const logoInput = pick((t, i) => LOGO_RE.test(t) || LOGO_KEY_RE.test(keyOf(i)));
  let logo = values.logoDataUrl ? assign(logoInput, values.logoDataUrl) : null;

  // 2) fallbacks only if the named slot wasn't found
  if (values.productDataUrl && !productInput) {
    product = assign(pick((t, i) => i !== logoInput && isImage(t, i)), values.productDataUrl);
  }
  if (values.logoDataUrl && !logoInput) {
    logo = assign(pick((t, i) => i !== productInput && isImage(t, i)), values.logoDataUrl);
  }

  const missing = flowInputs.filter((i) => i.required && out[keyOf(i)] === undefined).map((i) => i.label || keyOf(i));
  return { inputs: out, missing, placed: { product, logo } };
}

// Last-known input keys, used only when a flow's spec can't be fetched. Keyed by flow ID — never
// shared between flows. 0MQyTfWvQD: exactly as "Use Flow as API" shows them (7 Oct 2026).
const KNOWN_KEYS = {
  "0MQyTfWvQD": { scenes: "scenes_2", character1: "character_1_2", character2: "character_2_2", setting: "setting_2", product: "poduct", logo: "images" },
};

function keyedInputs(keys, values) {
  const inputs = {};
  const put = (k, v) => { if (k && v != null && v !== "" && !(Array.isArray(v) && !v.length)) inputs[k] = v; };
  put(keys.scenes, values.scenes);
  put(keys.character1, values.character1);
  put(keys.character2, values.character2);
  put(keys.setting, values.setting);
  put(keys.product, values.productDataUrl);
  put(keys.logo, values.logoDataUrl);
  return inputs;
}

function sanitizePayloadForLogging(payload) {
  const sanitized = {};
  for (const [k, v] of Object.entries(payload || {})) {
    if (typeof v === "string" && v.startsWith("data:image/")) {
      const mime = v.slice(5, v.indexOf(";")) || "image";
      sanitized[k] = `[${mime} data URL (${Math.round((v.length * 0.75) / 1024)} KB)]`;
    } else if (Array.isArray(v)) {
      sanitized[k] = `[Array(${v.length}) - 1st item: ${typeof v[0] === "string" ? JSON.stringify(v[0].slice(0, 80) + (v[0].length > 80 ? "..." : "")) : typeof v[0]}]`;
    } else if (typeof v === "string" && v.length > 100) {
      sanitized[k] = `${v.slice(0, 97)}...`;
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

/**
 * Pre-flight validation before expensive generation or render calls.
 * Ensures all required fields for Magnific execution are present and valid.
 * Throws a user-friendly Error (fail fast) if unresolvable.
 */
function validateMagnificRequest(values, options = {}) {
  const missing = [];

  // 1. Validate scenes
  if (!Array.isArray(values?.scenes) || values.scenes.length === 0) {
    missing.push("scenes (at least 1 scene is required)");
  } else {
    const emptyScene = values.scenes.findIndex((s) => !s || typeof s !== "string" || !s.trim());
    if (emptyScene !== -1) {
      missing.push(`scene ${emptyScene + 1} content`);
    }
  }

  // 2. Validate product/service representation
  const hasProductImage = Boolean(values?.productDataUrl);
  const hasProductText = Boolean(
    (typeof values?.product === "string" && values.product.trim()) ||
    (typeof values?.productName === "string" && values.productName.trim()) ||
    (typeof values?.specialty === "string" && values.specialty.trim()) ||
    (typeof values?.brief === "string" && values.brief.trim())
  );
  if (!hasProductImage && !hasProductText) {
    missing.push("product or service information (please tell us what you want to promote in your brief)");
  }

  // 3. Setting
  if (!values?.setting || (typeof values.setting === "string" && !values.setting.trim())) {
    missing.push("setting or location");
  }

  // 4. Character 1
  if (!values?.character1 || (typeof values.character1 === "string" && !values.character1.trim())) {
    missing.push("primary character");
  }

  if (missing.length > 0) {
    const userMessage = options.userFacing
      ? `We need a little more information before generating this video: ${missing.join(", ")}.`
      : `Pre-flight validation failed: missing ${missing.join(", ")}`;
    const err = new Error(userMessage);
    err.status = 400;
    err.missingFields = missing;
    throw err;
  }

  return true;
}

function receivedSummary(values) {
  const kb = (d) => (d ? `yes (${Math.round((d.length * 0.75) / 1024)} KB)` : "NO");
  const prodText = values.product || values.productName || "none";
  return `product text: "${prodText}", product photo: ${kb(values.productDataUrl)}, logo: ${kb(values.logoDataUrl)}`;
}

async function startRun(values) {
  if (!key()) throw new Error("MAGNIFIC_API_KEY is missing in .env");

  // Pre-flight check before API call
  validateMagnificRequest(values);

  // Route on what was really uploaded — an empty or malformed data URL counts as "no image"
  const aspectRatio = values.aspectRatio || "9:16";
  const hasProduct = hasImage(values.productDataUrl);
  const hasLogo = hasImage(values.logoDataUrl);
  const flowId = selectFlow({ aspectRatio, hasProduct, hasLogo });
  const routed = { ...values, productDataUrl: hasProduct ? values.productDataUrl : null, logoDataUrl: hasLogo ? values.logoDataUrl : null };
  console.log(`[run] flow=${flowId} (${aspectRatio}, product=${hasProduct ? "yes" : "no"}, logo=${hasLogo ? "yes" : "no"})`);
  console.log(`[run] received from the form: ${receivedSummary(values)}`);

  let inputs;
  try {
    const mapped = mapInputs(await getFlowInputs(flowId), routed);
    const unplaced = [hasProduct && !mapped.placed.product && "product image", hasLogo && !mapped.placed.logo && "logo image"].filter(Boolean);
    if (unplaced.length) throw Object.assign(new Error(`Magnific flow ${flowId} has no input for the ${unplaced.join(" or ")}`), { mapping: true });
    if (mapped.missing.length) throw Object.assign(new Error(`Magnific flow ${flowId} needs inputs we could not fill: ${mapped.missing.join(", ")}`), { mapping: true });
    inputs = mapped.inputs;
  } catch (e) {
    if (e.mapping) throw e;
    if (!KNOWN_KEYS[flowId]) throw new Error(`Could not read the input list for Magnific flow ${flowId}: ${e.message}`);
    console.warn(`[run] flow spec unavailable (${e.message}) — using last-known input names for ${flowId}`);
    inputs = keyedInputs(KNOWN_KEYS[flowId], routed);
  }

  // Safe server-side payload logging: redacts base64 images and displays clean key overview
  console.log(`[run] sending keys: ${Object.keys(inputs).join(", ")}`);
  console.log(`[run] sanitized payload:\n${JSON.stringify(sanitizePayloadForLogging(inputs), null, 2)}`);

  const r = await fetch(`${BASE}/${flowId}/run`, {
    method: "POST",
    headers: { "x-magnific-api-key": key(), "content-type": "application/json" },
    body: JSON.stringify({ inputs }),
    signal: AbortSignal.timeout(60000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    specCache.delete(flowId); // keys may have changed — re-read this flow's spec next time
    console.error(`[run] Magnific HTTP ${r.status} error response:`, JSON.stringify(data));
    throw new Error(`Magnific HTTP ${r.status}: ${JSON.stringify(data).slice(0, 400)}`);
  }
  const runId = data.workflow_run_identifier || data.id || data.run_id || data.runId || data.data?.id;
  if (!runId) throw new Error("No run id in Magnific response: " + JSON.stringify(data).slice(0, 400));
  return runId;
}

// Find the finished video. Strong match = a URL ending in a video extension.
// Weak match (only once the run reports done) = an http URL under a video/output-ish key that is not an image.
function findVideoUrl(obj, status) {
  const done = /complete|success|succeed|done|finish/i.test(String(status || ""));
  const IMAGE = /\.(png|jpe?g|webp|gif|svg)(\?|$)/i;
  let strong = "", weak = "";
  const walk = (v, k = "") => {
    if (strong) return;
    if (typeof v === "string") {
      if (/^https?:\/\/\S+\.(mp4|mov|webm|m3u8)(\?|$)/i.test(v)) strong = v;
      else if (!weak && done && /^https?:\/\//.test(v) && !IMAGE.test(v) && /video|output|result|final/i.test(k)) weak = v;
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, k));
    else if (v && typeof v === "object") Object.entries(v).forEach(([kk, x]) => walk(x, kk));
  };
  walk(obj);
  return strong || weak;
}

async function runStatus(runId) {
  const r = await fetch(`${BASE}/runs/${encodeURIComponent(runId)}`, {
    headers: { "x-magnific-api-key": key() },
    signal: AbortSignal.timeout(20000),
  });
  const data = await r.json().catch(() => ({}));
  const status = data.status || data.state || data.data?.status || "unknown";
  const failed = /fail|error|cancel/i.test(String(status));
  const videoUrl = findVideoUrl(data, status);

  let error = null;
  if (failed) {
    if (typeof data.error === 'string') error = data.error;
    else if (data.error?.message) error = data.error.message;
    else if (data.message) error = data.message;
    else if (data.details) error = typeof data.details === 'string' ? data.details : JSON.stringify(data.details);
    else if (status === 'completed_with_errors') {
      error = 'Magnific workflow finished with node execution errors (e.g. model timeout, input dimension issues, or depleted rendering credits).';
    } else {
      error = `Run failed with status: ${status}`;
    }
    console.warn(`[magnific status] Run ${runId} failed (${status}): ${error}`);
  }

  return { status, videoUrl, failed, error };
}

module.exports = {
  startRun,
  runStatus,
  findVideoUrl,
  mapInputs,
  selectFlow,
  getFlowInputs,
  FLOWS,
  KNOWN_KEYS,
  validateMagnificRequest,
  sanitizePayloadForLogging,
};