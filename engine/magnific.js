// Magnific Flows API: input discovery, input mapping, run, status.
const BASE = "https://api.magnific.com/v1/ai/flows";
const SPEC_TTL_MS = 5 * 60 * 1000; // flow keys change when the flow is edited — don't cache forever

const key = () => process.env.MAGNIFIC_API_KEY;
const flowId = () => process.env.MAGNIFIC_FLOW_ID || "0MQyTfWvQD";

let specCache = null; // { id, inputs, at }

async function getFlowInputs(force = false) {
  const id = flowId();
  if (!force && specCache && specCache.id === id && Date.now() - specCache.at < SPEC_TTL_MS) return specCache.inputs;

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
  specCache = { id, inputs, at: Date.now() };
  console.log(`[flow] inputs: ${inputs.map((i) => `${i.id || i.name} [${i.label || "-"}]${i.required ? "*" : ""}`).join(", ")}`);
  return inputs;
}

function mapInputs(flowInputs, values) {
  const out = {};
  const used = new Set();
  const keyOf = (i) => String(i.id || i.name || "");

  const pick = (test) =>
    flowInputs.find((i) => {
      if (used.has(keyOf(i))) return false;
      const label = String(i.label || i.name || "").toLowerCase();
      return test(label, i);
    });
  const assign = (input, value) => {
    if (!input || value == null || value === "" || (Array.isArray(value) && !value.length)) return;
    out[keyOf(input)] = value;
    used.add(keyOf(input));
  };

  assign(pick((label, i) => label.includes("scene") || i.type === "list"), values.scenes);
  assign(pick((label) => label.includes("character") && /1|one/.test(label)), values.character1);
  assign(pick((label) => label.includes("character") && /2|two/.test(label)), values.character2);
  assign(pick((label) => /setting|environment|location|world/.test(label)), values.setting);
  // Image inputs are matched by label OR key. In the current flow: "poduct" = product, "images" = logo.
  const PRODUCT_RE = /\b(product|poduct|prodct|prouct|produt)s?\b/;
  const LOGO_RE = /\b(logo|brand ?mark|brand ?logo)\b/;
  const LOGO_KEY = process.env.MAGNIFIC_LOGO_INPUT || "images";
  const isImage = (i) => /image|media|asset|file/i.test(`${i.type || ""} ${i.kind || ""}`);

  // 1) named matches first, so neither image can land in the other's slot
  const productInput = pick((label, i) => PRODUCT_RE.test(label) || PRODUCT_RE.test(keyOf(i).toLowerCase()));
  if (values.productDataUrl) assign(productInput, values.productDataUrl);
  const logoInput = pick((label, i) => LOGO_RE.test(label) || LOGO_RE.test(keyOf(i).toLowerCase()) || keyOf(i) === LOGO_KEY);
  if (values.logoDataUrl) assign(logoInput, values.logoDataUrl);

  // 2) fallbacks only if the named slot wasn't found
  if (values.productDataUrl && !productInput) {
    assign(pick((label, i) => i !== logoInput && isImage(i)), values.productDataUrl);
  }
  if (values.logoDataUrl && !logoInput) {
    assign(pick((label, i) => i !== productInput && isImage(i)), values.logoDataUrl);
  }

  const missing = flowInputs.filter((i) => i.required && out[keyOf(i)] === undefined).map((i) => i.label || keyOf(i));
  return { inputs: out, missing };
}

// The flow's input keys, exactly as "Use Flow as API" shows them (7 Oct 2026). Override in .env if the flow is edited.
function flowKeys() {
  const e = process.env;
  return {
    scenes: e.MAGNIFIC_SCENES_INPUT || "scenes_2",
    character1: e.MAGNIFIC_CHARACTER1_INPUT || "character_1_2",
    character2: e.MAGNIFIC_CHARACTER2_INPUT || "character_2_2",
    setting: e.MAGNIFIC_SETTING_INPUT || "setting_2",
    product: e.MAGNIFIC_PRODUCT_INPUT || "poduct",
    logo: e.MAGNIFIC_LOGO_INPUT || "images",
  };
}

// Build the inputs straight from the known keys — no guessing.
function explicitInputs(values) {
  const k = flowKeys();
  const inputs = {};
  const put = (key, v) => { if (v != null && v !== "" && !(Array.isArray(v) && !v.length)) inputs[key] = v; };
  put(k.scenes, values.scenes);
  put(k.character1, values.character1);
  put(k.character2, values.character2);
  put(k.setting, values.setting);
  put(k.product, values.productDataUrl);
  put(k.logo, values.logoDataUrl);
  return inputs;
}
const fallbackInputs = explicitInputs;

function receivedSummary(values) {
  const kb = (d) => (d ? `yes (${Math.round((d.length * 0.75) / 1024)} KB)` : "NO");
  return `product photo ${kb(values.productDataUrl)}, logo ${kb(values.logoDataUrl)}`;
}

async function startRun(values) {
  if (!key()) throw new Error("MAGNIFIC_API_KEY is missing in .env");

  let inputs;
  let spec = null;
  try {
    spec = await getFlowInputs();
  } catch (e) {
    console.warn(`[run] flow spec unavailable (${e.message}) — using last-known input names`);
  }
  console.log(`[run] received from the form: ${receivedSummary(values)}`);
  inputs = explicitInputs(values);

  // No pre-check against the flow-details endpoint: it names inputs differently from the run API
  // (internal id "input-8150…-1", label "scenes #2", run key "scenes_2"), which caused false
  // "required input missing" errors. The run API is the source of truth — if something is really
  // missing, Magnific rejects the run and its own error is shown.
  if (spec) {
    console.log(`[run] flow inputs (info only): ${spec.map((i) => `${i.label || i.name || i.id}${i.required ? " *required" : ""}`).join(", ")}`);
  }
  console.log(`[run] sending keys: ${Object.keys(inputs).join(", ")}`);

  const r = await fetch(`${BASE}/${flowId()}/run`, {
    method: "POST",
    headers: { "x-magnific-api-key": key(), "content-type": "application/json" },
    body: JSON.stringify({ inputs }),
    signal: AbortSignal.timeout(60000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    specCache = null; // keys may have changed — re-read the spec next time
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
  const data = await r.json();
  const status = data.status || data.state || data.data?.status || "unknown";
  return { status, videoUrl: findVideoUrl(data, status), failed: /fail|error|cancel/i.test(String(status)) };
}

module.exports = { startRun, runStatus, findVideoUrl, mapInputs, explicitInputs };