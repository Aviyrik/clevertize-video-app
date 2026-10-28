// SSRF guard for user-supplied URLs: address checks, DNS-level blocking, redirect re-checks, size caps.
const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const zlib = require("zlib");
const { safeFetch, isDisallowedUrl, isPrivateAddress, guardedLookup } = require("../engine/netguard");

test("isPrivateAddress blocks private, loopback, metadata and mapped addresses", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0",
    "::1", "::", "fe80::1", "fd00::1", "::ffff:127.0.0.1", "::ffff:a9fe:a9fe", "[::ffff:7f00:1]", "not-an-ip"]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "142.250.183.14", "2606:4700:4700::1111"]) assert.equal(isPrivateAddress(ip), false, ip);
});

test("isDisallowedUrl catches bracketed IPv6, mapped IPv4, numeric hosts and non-http schemes", () => {
  for (const u of ["http://[::1]/", "http://[fe80::1]/", "http://[::ffff:127.0.0.1]/", "http://[::ffff:169.254.169.254]/",
    "http://2130706433/", "http://0x7f.1/", "http://169.254.169.254/latest/meta-data/", "http://localhost:3000/",
    "file:///etc/passwd", "ftp://example.com/", "http://user:pass@example.com/", "not a url"]) {
    assert.ok(isDisallowedUrl(u), u);
  }
  assert.equal(isDisallowedUrl("https://www.example.com/shop"), null);
});

test("guardedLookup refuses hostnames that resolve to private addresses", async () => {
  const run = (host, opts) => new Promise((resolve) => guardedLookup(host, opts, (err, addr) => resolve({ err, addr })));
  assert.equal((await run("127.0.0.1", {})).err.code, "EBLOCKED");
  assert.equal((await run("127.0.0.1", { all: true })).err.code, "EBLOCKED");
  assert.equal((await run("::1", {})).err.code, "EBLOCKED");
  assert.equal((await run("8.8.8.8", {})).addr, "8.8.8.8");
});

// A local server reached through fake public hostnames, so redirects and bodies can be tested offline.
// "site.test" is allowed to reach it; "inner.test" goes through the real guard (and resolves to loopback).
let server, port;
const lookup = (hostname, options, cb) => {
  if (hostname === "site.test") return options.all ? cb(null, [{ address: "127.0.0.1", family: 4 }]) : cb(null, "127.0.0.1", 4);
  return guardedLookup(hostname === "inner.test" ? "127.0.0.1" : hostname, options, cb);
};
test.before(async () => {
  server = http.createServer((req, res) => {
    if (req.url === "/to-metadata") return res.writeHead(302, { location: "http://169.254.169.254/latest/meta-data/" }).end();
    if (req.url === "/to-inner") return res.writeHead(302, { location: `http://inner.test:${port}/ok` }).end();
    if (req.url === "/hop") return res.writeHead(301, { location: "/ok" }).end();
    if (req.url === "/gzip") return res.writeHead(200, { "content-encoding": "gzip" }).end(zlib.gzipSync("hello gzip"));
    if (req.url === "/big") return res.writeHead(200).end("x".repeat(5000));
    res.writeHead(200, { "content-type": "text/plain" }).end("ok");
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  port = server.address().port;
});
test.after(() => server.close());

test("safeFetch follows safe redirects and decodes compressed bodies", async () => {
  const r = await safeFetch(`http://site.test:${port}/hop`, { lookup });
  assert.equal(r.status, 200);
  assert.equal(r.body.toString(), "ok");
  assert.equal(r.url, `http://site.test:${port}/ok`);
  assert.equal((await safeFetch(`http://site.test:${port}/gzip`, { lookup })).body.toString(), "hello gzip");
});

test("safeFetch blocks redirects to metadata IPs and to hostnames that resolve privately", async () => {
  await assert.rejects(safeFetch(`http://site.test:${port}/to-metadata`, { lookup }), { code: "EBLOCKED" });
  await assert.rejects(safeFetch(`http://site.test:${port}/to-inner`, { lookup }), { code: "EBLOCKED" });
  // the default guard never lets a request reach loopback at all
  await assert.rejects(safeFetch(`http://127.0.0.1:${port}/ok`), { code: "EBLOCKED" });
});

test("safeFetch enforces maxBytes (or truncates when asked)", async () => {
  await assert.rejects(safeFetch(`http://site.test:${port}/big`, { lookup, maxBytes: 1000 }), /too large/);
  const r = await safeFetch(`http://site.test:${port}/big`, { lookup, maxBytes: 1000, truncate: true });
  assert.equal(r.body.length, 1000);
});
