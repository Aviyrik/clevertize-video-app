// Our own copy of every finished video (engine/videoStorage.js, Cloudflare R2): copied when the project is saved,
// stored under the session user's and the project's ids, served only through short-lived signed links after the
// ownership check, never reachable by another user, and never the reason a finished video is lost.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "video-storage-"));
process.env.ANTHROPIC_API_KEY = "test";
process.env.MAGNIFIC_API_KEY = "test";
process.env.FESTIVAL_LIVE = "off";
process.env.R2_ACCOUNT_ID = "0123456789abcdef0123456789abcdef";
process.env.R2_ACCESS_KEY_ID = "AKIDTEST0000000000000000000000AA";
process.env.R2_SECRET_ACCESS_KEY = "secret-test-key-not-real";
process.env.R2_BUCKET = "test-videos";
const R2_HOST = `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const r2 = { puts: [], deletes: [], failPuts: false };
const realFetch = global.fetch;
global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
  if (u.startsWith(`https://${R2_HOST}/`)) {
    const key = decodeURIComponent(new URL(u).pathname.replace(`/${process.env.R2_BUCKET}/`, ""));
    if (opts.method === "PUT") {
      if (r2.failPuts) return new Response("<Error><Code>InternalError</Code></Error>", { status: 500 });
      r2.puts.push({ key, bytes: Buffer.from(opts.body), headers: opts.headers });
      return new Response("", { status: 200 });
    }
    if (opts.method === "DELETE") { r2.deletes.push(key); return new Response("", { status: 204 }); }
  }
  if (u.includes("/flows/runs/")) {
    const id = u.split("/flows/runs/")[1];
    return json({ status: "COMPLETED", result: { video: `https://cdn.example.com/${id}.mp4?token=exp=1990000000~hmac=abc` } });
  }
  return realFetch(url, opts);
};

const netguard = require("../engine/netguard");
netguard.safeFetch = async () => ({ ok: true, status: 200, headers: { "content-type": "video/mp4" }, body: Buffer.from("finished mp4 bytes") });

const { app } = require("../server");
const db = require("../engine/db");
const storage = require("../engine/videoStorage");

let base, server, alice, bob, aliceToken, bobToken;
test.before(async () => {
  alice = await db.createUser({ email: "alice-storage@example.com", password: "password123", name: "Alice" });
  bob = await db.createUser({ email: "bob-storage@example.com", password: "password123", name: "Bob" });
  aliceToken = await db.createSession(alice.id);
  bobToken = await db.createSession(bob.id);
  await new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); });
});
test.after(() => server.close());

const call = async (method, p, { token, body } = {}) => {
  const res = await realFetch(base + p, { method, headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const until = async (check, ms = 3000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { const v = await check(); if (v) return v; await new Promise((r) => setTimeout(r, 25)); }
  return check();
};

// a render finishes for this user and the studio saves it to the project, as it does after /api/status
async function renderAndSave(token, user, runId, projectId) {
  await db.saveVideoRun(runId, user.id, { status: "PENDING" });
  const status = await call("GET", `/api/status/${runId}`, { token });
  assert.equal(status.status, 200);
  const saved = await call("POST", "/api/projects", { token, body: { id: projectId, title: "Diwali hamper", businessName: "Kanti Sweets", brief: "x", status: "video_ready", videoUrl: status.body.videoUrl } });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  return status.body.videoUrl;
}

test("keys come from ids only: one folder per user, nothing can climb out of it", () => {
  assert.equal(storage.videoKey("usr_1", "proj_2"), "videos/usr_1/proj_2.mp4");
  for (const bad of ["../usr_2", "usr_1/../usr_2", "a b", "", "usr_1\\x", "%2e%2e"]) {
    assert.throws(() => storage.videoKey(bad, "proj_1"), `user id ${JSON.stringify(bad)}`);
    assert.throws(() => storage.videoKey("usr_1", bad), `project id ${JSON.stringify(bad)}`);
  }
  assert.ok(storage.keyBelongsTo("videos/usr_1/proj_2.mp4", "usr_1"));
  assert.ok(!storage.keyBelongsTo("videos/usr_1/proj_2.mp4", "usr_2"));
  assert.ok(!storage.keyBelongsTo("videos/usr_1/../usr_2/proj_2.mp4", "usr_1"));
  const { url, expiresInSeconds } = storage.signedVideoUrl("videos/usr_1/proj_2.mp4", { expiresInSeconds: 999999 });
  assert.equal(expiresInSeconds, 3600, "a signed link never lives longer than an hour");
  assert.match(url, new RegExp(`^https://${R2_HOST}/test-videos/videos/usr_1/proj_2\\.mp4\\?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=`));
  assert.match(url, /X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=[0-9a-f]{64}$/);
  assert.ok(!url.includes(process.env.R2_SECRET_ACCESS_KEY));
});

test("a saved finished video is copied to the user's folder; the render link stays as it was; playback and download use signed links", async () => {
  const renderUrl = await renderAndSave(aliceToken, alice, "run_alice_1", "proj_alice_1");
  const stored = await until(async () => (await call("GET", "/api/projects/proj_alice_1", { token: aliceToken })).body.project.videoStored);
  assert.equal(stored, true);
  assert.deepEqual(r2.puts.map((p) => p.key), [`videos/${alice.id}/proj_alice_1.mp4`]);
  assert.equal(r2.puts[0].bytes.toString(), "finished mp4 bytes");
  assert.match(r2.puts[0].headers.authorization, /^AWS4-HMAC-SHA256 Credential=AKIDTEST0000000000000000000000AA\/\d{8}\/auto\/s3\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);

  const project = (await call("GET", "/api/projects/proj_alice_1", { token: aliceToken })).body.project;
  assert.equal(project.videoUrl, renderUrl, "the render link is kept, untouched");
  assert.equal(project.videoStorageKey, undefined, "the browser never sees where the file is");
  const listed = (await call("GET", "/api/projects", { token: aliceToken })).body.projects.find((p) => p.id === "proj_alice_1");
  assert.equal(listed.videoStored, true);
  assert.equal(listed.videoStorageKey, undefined);

  const play = await call("GET", "/api/projects/proj_alice_1/video", { token: aliceToken });
  assert.equal(play.status, 200);
  assert.equal(play.body.source, "storage");
  assert.equal(play.body.expiresInSeconds, 900);
  assert.ok(play.body.url.startsWith(`https://${R2_HOST}/test-videos/videos/${alice.id}/proj_alice_1.mp4?`));
  assert.ok(!/response-content-disposition/.test(play.body.url));
  const dl = await call("GET", "/api/projects/proj_alice_1/video?download=1", { token: aliceToken });
  assert.equal(dl.body.expiresInSeconds, 120);
  assert.match(decodeURIComponent(dl.body.url), /response-content-disposition=attachment; filename="Diwali_hamper\.mp4"/);

  // later saves (draft autosaves) keep the copy and don't upload again
  await call("POST", "/api/projects", { token: aliceToken, body: { id: "proj_alice_1", title: "Diwali hamper (renamed)", videoUrl: renderUrl } });
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(r2.puts.length, 1);
  assert.equal((await call("GET", "/api/projects/proj_alice_1", { token: aliceToken })).body.project.videoStored, true);
});

test("a second user can't reach the first user's file — not through the app, not directly", async () => {
  // through the app: the project isn't Bob's
  const theirs = await call("GET", "/api/projects/proj_alice_1/video", { token: bobToken });
  assert.equal(theirs.status, 404);
  assert.ok(!JSON.stringify(theirs.body).includes(alice.id));
  // no session at all
  assert.equal((await call("GET", "/api/projects/proj_alice_1/video")).status, 401);
  // naming a key, a path or a bucket in the request changes nothing: the key is never read from a request
  for (const q of [`?key=videos/${alice.id}/proj_alice_1.mp4`, `?path=videos/${alice.id}/proj_alice_1.mp4`, "?bucket=test-videos", `?userId=${alice.id}`]) {
    assert.equal((await call("GET", `/api/projects/proj_alice_1/video${q}`, { token: bobToken })).status, 404, q);
  }
  for (const id of [`..%2F..%2Fvideos%2F${alice.id}%2Fproj_alice_1`, "proj_alice_1.mp4", "%2e%2e"]) {
    assert.equal((await call("GET", `/api/projects/${id}/video`, { token: bobToken })).status, 404, id);
  }
  // taking over Alice's project id is refused by the existing ownership check
  assert.equal((await call("POST", "/api/projects", { token: bobToken, body: { id: "proj_alice_1", title: "mine now", videoUrl: "https://cdn.example.com/x.mp4" } })).status, 403);
  // Bob saving Alice's render link into his own project: no copy (it isn't his render), nothing to sign
  const aliceProject = (await call("GET", "/api/projects/proj_alice_1", { token: aliceToken })).body.project;
  const puts = r2.puts.length;
  await call("POST", "/api/projects", { token: bobToken, body: { id: "proj_bob_steal", title: "x", videoUrl: aliceProject.videoUrl } });
  await new Promise((r) => setTimeout(r, 150));
  assert.equal(r2.puts.length, puts);
  assert.equal((await call("GET", "/api/projects/proj_bob_steal/video", { token: bobToken })).status, 404);
  // a forged storage key in a save is ignored: only the server records where a copy went
  await call("POST", "/api/projects", { token: bobToken, body: { id: "proj_bob_forged", title: "x", videoStorageKey: `videos/${alice.id}/proj_alice_1.mp4` } });
  assert.equal((await call("GET", "/api/projects/proj_bob_forged/video", { token: bobToken })).status, 404);
  assert.equal((await call("GET", "/api/projects/proj_bob_forged", { token: bobToken })).body.project.videoStored, false);

  // directly: the bucket's objects aren't readable without a signature (checked live against R2 in the report)
  const signed = (await call("GET", "/api/projects/proj_alice_1/video", { token: aliceToken })).body.url;
  assert.ok(/X-Amz-Signature=/.test(signed) && /X-Amz-Expires=900/.test(signed), "Alice's link is signed and short-lived");
});

test("a storage failure never loses the video: the render link stays, the save succeeds, the next save tries again", async () => {
  r2.failPuts = true;
  const errors = [];
  const origError = console.error;
  console.error = (...a) => { errors.push(a.join(" ")); };
  try {
    const renderUrl = await renderAndSave(aliceToken, alice, "run_alice_2", "proj_alice_2");
    await until(() => errors.some((e) => /\[video copy\] project proj_alice_2: Video upload failed: HTTP 500 InternalError — keeping the render link/.test(e)));
    const p = (await call("GET", "/api/projects/proj_alice_2", { token: aliceToken })).body.project;
    assert.equal(p.videoUrl, renderUrl);
    assert.equal(p.videoStored, false);
    assert.equal((await call("GET", "/api/projects/proj_alice_2/video", { token: aliceToken })).body.code, "NO_STORED_COPY");
  } finally {
    console.error = origError;
    r2.failPuts = false;
  }
  await call("POST", "/api/projects", { token: aliceToken, body: { id: "proj_alice_2", title: "again", videoUrl: (await db.getVideoRun("run_alice_2")).videoUrl } });
  assert.equal(await until(async () => (await call("GET", "/api/projects/proj_alice_2", { token: aliceToken })).body.project.videoStored), true);
});

test("deleting a project deletes its stored copy", async () => {
  await renderAndSave(aliceToken, alice, "run_alice_3", "proj_alice_3");
  await until(async () => (await call("GET", "/api/projects/proj_alice_3", { token: aliceToken })).body.project.videoStored);
  assert.equal((await call("DELETE", "/api/projects/proj_alice_3", { token: aliceToken })).status, 200);
  assert.ok(await until(() => r2.deletes.includes(`videos/${alice.id}/proj_alice_3.mp4`)));
});

test("the server refuses to start without the storage variables, naming them", () => {
  const env = { ...process.env, PORT: "0", DATA_DIR: fs.mkdtempSync(path.join(os.tmpdir(), "video-storage-start-")) };
  delete env.R2_SECRET_ACCESS_KEY;
  delete env.R2_BUCKET;
  const r = spawnSync(process.execPath, [path.join(__dirname, "..", "server.js")], { env, cwd: fs.mkdtempSync(path.join(os.tmpdir(), "no-dotenv-")), encoding: "utf8", timeout: 20000 });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /Video storage is not configured: set R2_SECRET_ACCESS_KEY, R2_BUCKET/);
});
