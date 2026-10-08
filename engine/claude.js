// Thin wrapper over the Anthropic Messages API (no SDK, Node 18+ fetch).
const API_URL = "https://api.anthropic.com/v1/messages";

function config() {
  return {
    key: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    thinkingBudget: parseInt(process.env.ANTHROPIC_THINKING_BUDGET || "0", 10),
  };
}

/**
 * Call Claude and return the joined text blocks.
 * opts: { system, content, maxTokens, thinking (bool), tools }
 * If the model rejects extended thinking, retries once without it.
 */
async function callClaude({ system, content, maxTokens = 16000, thinking = true, tools }) {
  const { key, model, thinkingBudget } = config();
  if (!key) throw new Error("ANTHROPIC_API_KEY is missing in .env");

  const body = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content }],
  };
  if (tools) body.tools = tools;
  if (thinking && thinkingBudget > 0) {
    body.thinking = { type: "enabled", budget_tokens: Math.min(thinkingBudget, maxTokens - 2000) };
  }

  const r = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(290000),
  });
  const data = await r.json().catch(() => ({ error: { message: `Anthropic HTTP ${r.status} (non-JSON response)` } }));

  if (data.error) {
    const msg = data.error.message || JSON.stringify(data.error);
    if (body.thinking && /thinking/i.test(msg)) {
      console.warn(`[claude] model rejected extended thinking (${msg}) — retrying without it`);
      return callClaude({ system, content, maxTokens, thinking: false, tools });
    }
    throw new Error(`Anthropic: ${msg}`);
  }
  if (data.stop_reason === "max_tokens") console.warn("[claude] hit max_tokens — output may be cut off");

  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

module.exports = { callClaude };
