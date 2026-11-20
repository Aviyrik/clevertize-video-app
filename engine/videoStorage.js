// Video file storage: our own copy of every rendered video, so a project keeps its video after the render
// service's link expires. This is the only file that knows the storage is Cloudflare R2 (an S3-compatible API,
// signed with AWS Signature V4 here, no SDK). Moving to another account or provider means changing this file and
// the environment variables, nothing else.
//
// Interface (all the app uses):
//   isConfigured()                         → boolean
//   assertConfigured()                     → throws, naming the missing variables
//   videoKey(userId, projectId)            → the object key: videos/<userId>/<projectId>.mp4
//   storeVideo({ userId, projectId, body, contentType }) → { key, bytes }
//   signedVideoUrl(key, { expiresInSeconds, downloadName }) → a short-lived GET URL (the bucket stays private)
//   deleteVideo(key)                       → removes one object
//   checkStorage()                         → writes, reads back and deletes a test object (the credential check)
//
// Keys are built here from the session's user id and an owned project id; callers never pass a key from a request.

const crypto = require('crypto');

const REQUIRED_ENV = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];
const REGION = 'auto';
const SERVICE = 's3';
const MAX_SIGNED_SECONDS = 60 * 60; // a signed link never lives longer than an hour
const DEFAULT_SIGNED_SECONDS = 15 * 60;

function config() {
  return {
    accountId: String(process.env.R2_ACCOUNT_ID || '').trim(),
    accessKeyId: String(process.env.R2_ACCESS_KEY_ID || '').trim(),
    secretAccessKey: String(process.env.R2_SECRET_ACCESS_KEY || '').trim(),
    bucket: String(process.env.R2_BUCKET || '').trim(),
  };
}

const missingEnv = () => REQUIRED_ENV.filter((k) => !String(process.env[k] || '').trim());
const isConfigured = () => missingEnv().length === 0;

function assertConfigured() {
  const missing = missingEnv();
  if (missing.length) {
    throw new Error(`Video storage is not configured: set ${missing.join(', ')} (server-side environment variables).`);
  }
}

// ---------- keys ----------

// ids become one path segment each: letters, digits, "_" and "-" only, so no id can climb out of its folder
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;
function videoKey(userId, projectId) {
  const u = String(userId || '');
  const p = String(projectId || '');
  if (!SAFE_ID.test(u)) throw new Error('videoKey: invalid user id');
  if (!SAFE_ID.test(p)) throw new Error('videoKey: invalid project id');
  return `videos/${u}/${p}.mp4`;
}

/** Does this stored key belong to this user's folder? (a stored value is checked again before it is signed) */
function keyBelongsTo(key, userId) {
  const parts = String(key || '').split('/');
  return parts.length === 3 && parts[0] === 'videos' && parts[1] === String(userId) && SAFE_ID.test(parts[1]) && /^[A-Za-z0-9_-]{1,128}\.mp4$/.test(parts[2]);
}

// ---------- AWS Signature V4 ----------

const sha256Hex = (data) => crypto.createHash('sha256').update(data).digest('hex');
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
// RFC 3986 encoding, as SigV4 wants it
const rfc3986 = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const encodePath = (p) => p.split('/').map(rfc3986).join('/');

function stamps(now = new Date()) {
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // 20261119T101500Z
  return { amzDate, date: amzDate.slice(0, 8) };
}

function signingKey(secret, date) {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, date), REGION), SERVICE), 'aws4_request');
}

function endpointHost(c) {
  return `${c.accountId}.r2.cloudflarestorage.com`;
}

function canonicalQuery(params) {
  return Object.keys(params).sort().map((k) => `${rfc3986(k)}=${rfc3986(String(params[k]))}`).join('&');
}

/** A signed request (Authorization header) for one object operation. */
async function objectRequest(method, key, { body = null, contentType = null } = {}) {
  assertConfigured();
  const c = config();
  const host = endpointHost(c);
  const path = `/${c.bucket}/${encodePath(key)}`;
  const { amzDate, date } = stamps();
  const payloadHash = body ? sha256Hex(body) : sha256Hex('');
  const headers = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...(contentType ? { 'content-type': contentType } : {}),
  };
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers).sort().map((k) => `${k}:${String(headers[k]).trim()}\n`).join('');
  const canonicalRequest = [method, path, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${date}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n');
  const signature = crypto.createHmac('sha256', signingKey(c.secretAccessKey, date)).update(stringToSign).digest('hex');
  const auth = `AWS4-HMAC-SHA256 Credential=${c.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const { host: _h, ...sendHeaders } = headers;
  const res = await fetch(`https://${host}${path}`, { method, headers: { ...sendHeaders, authorization: auth }, body: body || undefined });
  return res;
}

async function failure(res, what) {
  const text = await res.text().catch(() => '');
  const code = (text.match(/<Code>([^<]+)<\/Code>/) || [])[1] || '';
  return new Error(`${what} failed: HTTP ${res.status}${code ? ` ${code}` : ''}`);
}

// ---------- the interface ----------

async function storeVideo({ userId, projectId, body, contentType = 'video/mp4' }) {
  const key = videoKey(userId, projectId);
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  if (!buf.length) throw new Error('storeVideo: empty file');
  const res = await objectRequest('PUT', key, { body: buf, contentType });
  if (!res.ok) throw await failure(res, 'Video upload');
  return { key, bytes: buf.length };
}

/** A short-lived signed GET URL. downloadName makes the browser save the file instead of playing it. */
function signedVideoUrl(key, { expiresInSeconds = DEFAULT_SIGNED_SECONDS, downloadName = null } = {}) {
  assertConfigured();
  const c = config();
  const host = endpointHost(c);
  const path = `/${c.bucket}/${encodePath(key)}`;
  const { amzDate, date } = stamps();
  const scope = `${date}/${REGION}/${SERVICE}/aws4_request`;
  const expires = Math.max(1, Math.min(MAX_SIGNED_SECONDS, Math.floor(Number(expiresInSeconds) || DEFAULT_SIGNED_SECONDS)));
  const params = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${c.accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expires),
    'X-Amz-SignedHeaders': 'host',
    ...(downloadName ? { 'response-content-disposition': `attachment; filename="${String(downloadName).replace(/[^A-Za-z0-9 ._-]/g, '_').slice(0, 120)}"` } : {}),
  };
  const query = canonicalQuery(params);
  const canonicalRequest = ['GET', path, query, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n');
  const signature = crypto.createHmac('sha256', signingKey(c.secretAccessKey, date)).update(stringToSign).digest('hex');
  return { url: `https://${host}${path}?${query}&X-Amz-Signature=${signature}`, expiresInSeconds: expires };
}

async function deleteVideo(key) {
  const res = await objectRequest('DELETE', key);
  if (!res.ok && res.status !== 404) throw await failure(res, 'Video delete');
}

/** The credential check: write a small object, read it back through a signed URL, delete it. */
async function checkStorage() {
  const key = `healthcheck/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.txt`;
  const body = Buffer.from(`clevercut storage check ${new Date().toISOString()}`);
  const put = await objectRequest('PUT', key, { body, contentType: 'text/plain' });
  if (!put.ok) throw await failure(put, 'Test write');
  const { url } = signedVideoUrl(key, { expiresInSeconds: 60 });
  const got = await fetch(url);
  const text = got.ok ? await got.text() : '';
  if (!got.ok || text !== body.toString()) throw new Error(`Test read through a signed URL failed: HTTP ${got.status}`);
  const anonymous = await fetch(`https://${endpointHost(config())}/${config().bucket}/${encodePath(key)}`);
  await deleteVideo(key);
  return { key, wrote: body.length, readBack: true, unsignedStatus: anonymous.status };
}

module.exports = {
  isConfigured,
  assertConfigured,
  videoKey,
  keyBelongsTo,
  storeVideo,
  signedVideoUrl,
  deleteVideo,
  checkStorage,
  REQUIRED_ENV,
};
