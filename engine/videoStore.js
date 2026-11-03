// Permanent storage for finished videos. Magnific's video URLs carry an expiring token, so each finished
// video is copied into Supabase Storage and the permanent public URL is what gets saved in projects.video_url.
// Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (server only) and a *public* bucket (default "videos").
// Without them nothing is copied and the Magnific URL is kept, as before.
const crypto = require("crypto");
const netguard = require("./netguard");

const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
const TIMEOUT_MS = 120000;

function config() {
  return {
    url: String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, ""),
    key: String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim(),
    bucket: String(process.env.SUPABASE_VIDEO_BUCKET || "videos").trim(),
  };
}

function isConfigured() {
  const c = config();
  return Boolean(c.url && c.key && c.bucket);
}

function publicPrefix() {
  const c = config();
  return c.url ? `${c.url}/storage/v1/object/public/${encodeURIComponent(c.bucket)}/` : null;
}

// True for a URL this module produced (a permanent copy), false for Magnific's expiring URLs
function isStoredUrl(url) {
  const prefix = publicPrefix();
  return Boolean(prefix && typeof url === "string" && url.startsWith(prefix));
}

function storageHost() {
  try { return new URL(config().url).hostname.toLowerCase(); } catch { return null; }
}

const segment = (s) => String(s || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64) || "x";

// Download the finished video and upload it. Returns the permanent public URL, or null when storage
// isn't configured. The object name has a random part, so the public URL can't be guessed.
async function archiveVideo({ sourceUrl, userId, runId }) {
  if (!isConfigured()) return null;
  const c = config();

  // sourceUrl comes from Magnific's API, but it still goes through the SSRF guard
  const src = await netguard.safeFetch(sourceUrl, { timeoutMs: TIMEOUT_MS, maxBytes: MAX_VIDEO_BYTES, headers: { Accept: "video/*,*/*" } });
  if (!src.ok || !src.body.length) throw new Error(`could not download the finished video (HTTP ${src.status})`);
  const type = String(src.headers["content-type"] || "").split(";")[0].trim();
  const contentType = /^video\/[\w.+-]+$/.test(type) ? type : "video/mp4";

  const objectPath = `${segment(userId)}/${segment(runId)}-${crypto.randomBytes(8).toString("hex")}.mp4`;
  const r = await fetch(`${c.url}/storage/v1/object/${encodeURIComponent(c.bucket)}/${objectPath}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.key}`, apikey: c.key, "Content-Type": contentType, "x-upsert": "false" },
    body: src.body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) {
    const detail = (await r.text().catch(() => "")).slice(0, 200);
    throw new Error(`Supabase Storage upload failed (HTTP ${r.status}) ${detail}`);
  }
  return `${publicPrefix()}${objectPath}`;
}

module.exports = { archiveVideo, isConfigured, isStoredUrl, storageHost };
