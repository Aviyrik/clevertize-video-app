// Per-video logo: chosen on the Settings screen, prefilled from the business profile, and the only
// logo that reaches /api/run (so it alone decides logo vs no-logo flow routing).
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { toImageFile, videoLogoOf, videoLogoPayload } = require("../src/utils/videoLogo.js");

const PNG_B64 = Buffer.from("logo-bytes").toString("base64");

test("toImageFile reads every stored logo shape and rejects what the server can't render", () => {
  // business onboarding stores a data-URL string — the shape that used to be dropped silently
  assert.deepEqual(toImageFile(`data:image/png;base64,${PNG_B64}`), { name: "Brand logo", mime: "image/png", data: PNG_B64 });
  // uploads store { name, mime, data, previewUrl }
  assert.deepEqual(toImageFile({ name: "acme.jpg", mime: "image/jpeg", data: PNG_B64, previewUrl: "blob:x" }), { name: "acme.jpg", mime: "image/jpeg", data: PNG_B64 });
  // a profile object saved to Postgres comes back as JSON text
  assert.deepEqual(toImageFile(JSON.stringify({ name: "acme.webp", mime: "image/webp", data: PNG_B64 })), { name: "acme.webp", mime: "image/webp", data: PNG_B64 });
  for (const bad of [null, "", "https://example.com/logo.png", `data:image/svg+xml;base64,${PNG_B64}`, { mime: "image/png" }, { mime: "image/png", data: "" }, "{not json"]) {
    assert.equal(toImageFile(bad), null, JSON.stringify(bad));
  }
});

test("videoLogoOf: prefilled from the profile until the owner replaces or removes it for this video", () => {
  const profile = { logo: `data:image/png;base64,${PNG_B64}` };
  assert.equal(videoLogoOf(profile).data, PNG_B64, "undefined videoLogo -> profile logo prefill");
  assert.equal(videoLogoOf({ ...profile, videoLogo: null }), null, "removed for this video -> no logo");
  const replaced = videoLogoOf({ ...profile, videoLogo: { name: "new.png", mime: "image/png", data: "TkVX" } });
  assert.deepEqual(replaced, { name: "new.png", mime: "image/png", data: "TkVX" });
  assert.equal(videoLogoOf({ videoLogo: undefined }), null, "no profile logo and nothing uploaded -> no logo");
  assert.equal(videoLogoOf({ brandLogo: `data:image/jpeg;base64,${PNG_B64}` }).mime, "image/jpeg");
});

test("videoLogoPayload sends { mime, data } or null — never an empty object", () => {
  assert.deepEqual(videoLogoPayload({ logo: `data:image/png;base64,${PNG_B64}` }), { mime: "image/png", data: PNG_B64 });
  assert.equal(videoLogoPayload({ logo: `data:image/png;base64,${PNG_B64}`, videoLogo: null }), null);
  assert.equal(videoLogoPayload({}), null);
});

test("Settings screen has the per-video logo field next to platform and product image", () => {
  const src = fs.readFileSync(path.join(__dirname, "../src/components/GuidedStudio.jsx"), "utf8");
  const settings = src.slice(src.indexOf("export function Screen03Settings"), src.indexOf("export function Screen04Idea"));
  assert.ok(settings.includes("Logo Image (Optional)"), "logo field label");
  assert.ok(settings.includes("handleFileUpload(file, 'videoLogo')"), "upload reads into videoLogo like the product photo");
  assert.ok(settings.includes("updateUserContext('videoLogo', null)"), "remove for this video");
  assert.ok(settings.includes("videoLogoOf(userContext)"), "prefilled from the business profile logo");
  assert.ok(settings.indexOf("2. Video Dimension") < settings.indexOf("Product Asset") && settings.indexOf("Product Asset") < settings.indexOf("Logo Image (Optional)"), "grouped with the dimension selector and product image");
});

test("every render and pipeline request sends the per-video logo, not userContext.logo", () => {
  const app = fs.readFileSync(path.join(__dirname, "../src/App.jsx"), "utf8");
  assert.ok(!app.includes("userContext.logo.mime"), "no silent userContext.logo pass-through left");
  assert.equal((app.match(/logo: videoLogoPayload\(userContext\)/g) || []).length, 4, "3 /api/run payloads + the pipeline payload");
});
