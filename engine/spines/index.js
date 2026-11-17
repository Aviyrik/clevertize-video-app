/**
 * engine/spines/index.js
 * Loads the three stage spines (brief.md, creative.md, script.md) — versioned prompt files that hold each
 * spine document as written. The rules live in those files, not in code: edit a file (and bump its version)
 * and the engine picks it up on the next request, no restart.
 *
 * Brief Spine → brief.json → Creative Spine → concept.json → Script & Storyboard Spine → script.json (+ storyboard.json)
 * There is no Production Spine: production stays as the app does it today.
 */

const fs = require('fs');
const path = require('path');

const SPINE_DIR = process.env.SPINES_DIR || __dirname;
const SPINES = ['brief', 'creative', 'script'];
const cache = new Map(); // name -> { mtimeMs, spine }

function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^\[.*\]$/.test(v) || /^".*"$/.test(v)) {
      try { v = JSON.parse(v); } catch (_) { /* keep raw */ }
    }
    meta[kv[1]] = v;
  }
  return { meta, body: raw.slice(m[0].length) };
}

/** Returns { name, version, title, source, owns, reads, output, text } for one spine. */
function loadSpine(name) {
  if (!SPINES.includes(name)) throw new Error(`Unknown spine "${name}"`);
  const file = path.join(SPINE_DIR, `${name}.md`);
  const { mtimeMs } = fs.statSync(file);
  const hit = cache.get(name);
  if (hit && hit.mtimeMs === mtimeMs) return hit.spine;
  const raw = fs.readFileSync(file, 'utf8');
  const { meta, body } = parseFrontMatter(raw);
  const spine = {
    name,
    version: String(meta.version || '0.0.0'),
    title: meta.title || name,
    source: meta.source || '',
    owns: Array.isArray(meta.owns) ? meta.owns : [],
    reads: Array.isArray(meta.reads) ? meta.reads : [],
    output: meta.output || '',
    text: body.replace(/<!--[\s\S]*?-->/g, '').trim(),
  };
  cache.set(name, { mtimeMs, spine });
  return spine;
}

function spineVersions() {
  return Object.fromEntries(SPINES.map((n) => [n, loadSpine(n).version]));
}

module.exports = { loadSpine, spineVersions, SPINES, SPINE_DIR, parseFrontMatter };
