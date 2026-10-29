// Outbound fetch for user-supplied URLs (website scraping) with SSRF protection.
// Every hop is checked: the URL string, the IP the hostname resolves to (checked inside the
// socket's own DNS lookup, so the address we vet is the address we connect to), and each redirect.
const http = require("http");
const https = require("https");
const dns = require("dns");
const net = require("net");
const zlib = require("zlib");

// Private, loopback, link-local, metadata, CGNAT, multicast and reserved ranges.
// IPv4-mapped IPv6 (::ffff:a.b.c.d) is matched against the IPv4 rules by BlockList itself.
const BLOCKED = new net.BlockList();
for (const [addr, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16],
  ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
]) BLOCKED.addSubnet(addr, prefix, "ipv4");
for (const [addr, prefix] of [
  ["::", 128], ["::1", 128], ["64:ff9b::", 96], ["64:ff9b:1::", 48], ["100::", 64], ["2001:db8::", 32],
  ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["fec0::", 10], ["ff00::", 8],
]) BLOCKED.addSubnet(addr, prefix, "ipv6");

const blockedError = (msg) => Object.assign(new Error(msg), { code: "EBLOCKED" });

function isPrivateAddress(ip) {
  const addr = String(ip || "").replace(/^\[|\]$/g, "");
  const family = net.isIP(addr);
  if (!family) return true; // not an IP at all — never connect to it
  return BLOCKED.check(addr, family === 6 ? "ipv6" : "ipv4");
}

// Fast string-level check, run before any network access. Returns a user-facing reason, or null.
function isDisallowedUrl(urlString) {
  let parsed;
  try { parsed = new URL(urlString); } catch { return "Invalid URL format."; }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "Only HTTP and HTTPS protocols are permitted.";
  if (parsed.username || parsed.password) return "URLs with embedded credentials are not permitted.";
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return "Access to local or private hostnames is restricted.";
  }
  if (net.isIP(host) && isPrivateAddress(host)) return "Access to local, private or cloud metadata addresses is restricted.";
  return null;
}

// dns.lookup wrapper used as the socket's lookup: refuses to hand back a private address.
// Handles both callback shapes (single address, or an array when options.all is set).
function guardedLookup(hostname, options, callback) {
  if (typeof options === "function") { callback = options; options = {}; }
  dns.lookup(hostname, options, (err, address, family) => {
    if (err) return callback(err);
    const list = Array.isArray(address) ? address : [{ address, family }];
    const bad = list.find((a) => isPrivateAddress(a.address));
    if (bad) return callback(blockedError(`${hostname} resolves to a restricted address.`));
    callback(null, address, family);
  });
}

function decoderFor(encoding) {
  const e = String(encoding || "").toLowerCase().trim();
  if (e === "gzip" || e === "x-gzip") return zlib.createGunzip();
  if (e === "deflate") return zlib.createInflate();
  if (e === "br") return zlib.createBrotliDecompress();
  return null;
}

function requestOnce(url, { headers, deadline, maxBytes, truncate, lookup }) {
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return reject(new Error("Request timed out"));
    const client = url.protocol === "https:" ? https : http;
    const req = client.get(url, { headers: { "Accept-Encoding": "gzip, deflate, br", ...headers }, lookup, agent: false }, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        clearTimeout(timer);
        res.resume();
        return resolve({ status, headers: res.headers, redirect: res.headers.location });
      }
      const decoder = decoderFor(res.headers["content-encoding"]);
      const stream = decoder ? res.pipe(decoder) : res;
      const chunks = [];
      let size = 0, done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve({ status, ok: status >= 200 && status < 300, headers: res.headers, body: Buffer.concat(chunks) });
      };
      stream.on("data", (chunk) => {
        if (done) return;
        size += chunk.length;
        if (size > maxBytes) {
          if (!truncate) { done = true; clearTimeout(timer); req.destroy(); return reject(new Error("Response is too large")); }
          chunks.push(chunk.subarray(0, chunk.length - (size - maxBytes)));
          finish();
          return req.destroy();
        }
        chunks.push(chunk);
      });
      stream.on("end", finish);
      stream.on("error", (err) => { if (!done) { done = true; clearTimeout(timer); reject(err); } });
    });
    const timer = setTimeout(() => req.destroy(new Error("Request timed out")), remaining);
    req.on("error", (err) => { clearTimeout(timer); reject(err); });
  });
}

/**
 * GET a user-supplied URL safely.
 * opts: { headers, timeoutMs (whole request incl. redirects), maxBytes, truncate (keep the first
 * maxBytes instead of failing), maxRedirects, lookup (DNS hook — defaults to guardedLookup) }
 * Resolves { status, ok, headers, body: Buffer, url } — throws (code EBLOCKED) for restricted targets;
 * the error's `redirected` flag says whether it was a redirect hop (not the URL asked for) that was refused.
 */
async function safeFetch(urlString, { headers = {}, timeoutMs = 6000, maxBytes = 5 * 1024 * 1024, truncate = false, maxRedirects = 5, lookup = guardedLookup } = {}) {
  const deadline = Date.now() + timeoutMs;
  let current = urlString;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const mark = (err) => (err && err.code === "EBLOCKED" ? Object.assign(err, { url: current, redirected: hop > 0 }) : err);
    const problem = isDisallowedUrl(current);
    if (problem) throw mark(blockedError(problem));
    const url = new URL(current);
    let res;
    try {
      res = await requestOnce(url, { headers, deadline, maxBytes, truncate, lookup });
    } catch (err) {
      throw mark(err);
    }
    if (!res.redirect) return { ...res, url: url.href };
    current = new URL(res.redirect, url).href;
  }
  throw new Error("Too many redirects");
}

module.exports = { safeFetch, isDisallowedUrl, isPrivateAddress, guardedLookup };
