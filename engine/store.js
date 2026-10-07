// Script records per business (Product Spine [PREVIOUS_SCRIPTS]). Local JSON file.
// NOTE: on hosts with ephemeral disks (Render, Railway free tiers) this file is wiped on redeploy.
const fs = require("fs");
const path = require("path");

const FILE = path.join(process.env.DATA_DIR || path.join(__dirname, "..", "data"), "scripts.json");

const keyOf = (name, town) => `${String(name).trim().toLowerCase()}|${String(town).trim().toLowerCase()}`;

function readAll() {
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { return { scripts: [] }; }
}

function previousFor(name, town, limit = 3) {
  const k = keyOf(name, town);
  return readAll().scripts.filter((s) => s.key === k).slice(-limit).map((s) => s.record);
}

function save(name, town, record, header) {
  const all = readAll();
  all.scripts.push({ key: keyOf(name, town), savedAt: new Date().toISOString(), header, record });
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2));
}

module.exports = { previousFor, save };
