// Festival calendar: one live web-search check per day (cached), Annex C seed as fallback.
const fs = require("fs");
const path = require("path");
const { callClaude } = require("./claude");

const CACHE_FILE = path.join(process.env.DATA_DIR || path.join(__dirname, "..", "data"), "festivals-cache.json");
const SEED = require("./festivals-seed.json");
const WINDOW_DAYS = 30;

// "today" in India, as YYYY-MM-DD
function todayIST(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}

function daysBetween(a, b) {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

// add days_until computed in code (models are bad at date maths) and keep the 30-day window
function withDaysUntil(moments, today) {
  return moments
    .map((m) => {
      const start = m.start, end = m.end || m.start;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start || "")) return null;
      const toStart = daysBetween(today, start);
      const toEnd = daysBetween(today, end);
      if (toEnd < 0) return null; // already over
      return { ...m, end, days_until: Math.max(0, toStart), ongoing: toStart <= 0 && toEnd >= 0 };
    })
    .filter((m) => m && m.days_until <= WINDOW_DAYS)
    .sort((a, b) => a.days_until - b.days_until);
}

function readCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); } catch { return null; }
}
function writeCache(obj) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2));
}

async function fetchLive(today) {
  const text = await callClaude({
    system: "You are a careful research assistant. Use web search. Answer only with the requested JSON between the markers.",
    content: [{
      type: "text",
      text: `Today is ${today}. Search for Indian festivals and local moments in the next ${WINDOW_DAYS} days.
Confirm each date with two sources that agree (prefer a Drik Panchang-based calendar plus a news source); where sources differ by a day, say so in "note".
For each, give: name, start and end date (YYYY-MM-DD), the Indian states where it is celebrated most, and what people typically buy or do in the week before.
Include non-religious moments too: wedding season, exams and results, school reopening, monsoon, New Year, big sale days.

Return ONLY this, nothing else:
@@JSON@@
[{"name": "...", "start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "where": "states", "activities": "...", "sources": ["url", "url"], "note": ""}]
@@END@@`,
    }],
    maxTokens: 6000,
    thinking: false,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
  });
  const m = text.match(/@@JSON@@([\s\S]*?)@@END@@/);
  const list = JSON.parse((m ? m[1] : text).trim());
  if (!Array.isArray(list) || !list.length) throw new Error("live festival check returned no moments");
  return list;
}

/**
 * Returns { source: "live" | "cache" | "seed", checked: date, moments: [...] }.
 * Live check runs at most once per IST day unless FESTIVAL_LIVE=off.
 */
async function getFestivals() {
  const today = todayIST();
  const cache = readCache();
  if (cache && cache.date === today && Array.isArray(cache.moments)) {
    return { source: "cache", checked: cache.checkedAt, moments: withDaysUntil(cache.moments, today) };
  }

  if (process.env.FESTIVAL_LIVE !== "off" && process.env.ANTHROPIC_API_KEY) {
    try {
      const moments = await fetchLive(today);
      writeCache({ date: today, checkedAt: new Date().toISOString(), moments });
      console.log(`[festivals] live check ok — ${moments.length} moments`);
      return { source: "live", checked: today, moments: withDaysUntil(moments, today) };
    } catch (e) {
      console.warn(`[festivals] live check failed (${e.message}) — using Annex C seed`);
    }
  }

  const moments = withDaysUntil(SEED.moments, today);
  if (!moments.length) console.warn("[festivals] seed calendar has nothing in the next 30 days — extend engine/festivals-seed.json");
  return { source: "seed", checked: today, moments };
}

module.exports = { getFestivals, todayIST, withDaysUntil };
