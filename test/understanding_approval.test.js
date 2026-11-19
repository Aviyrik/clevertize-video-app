// AI Understanding approval: the approval is checked against what the user actually edits (brief text, settings,
// Do's and Don'ts, uploads, the occasion), never against something that changes by itself, and the studio only
// shows "Approved" once the server has recorded it.
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'understanding-approval-test-'));
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.FESTIVAL_LIVE = 'off';

const realFetch = global.fetch;
global.fetch = async (url, opts = {}) => {
  if (String(url).startsWith('https://api.anthropic.com')) {
    return new Response(JSON.stringify({ content: [{ type: 'text', text: '{}' }], stop_reason: 'end_turn' }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return realFetch(url, opts);
};

const { app } = require('../server');
const db = require('../engine/db');
const understandingSpine = require('../engine/understandingSpine');
const { buildDraftProject } = require('../src/utils/drafts.js');
const {
  explainUnderstandingOutdatedClient,
  understandingApprovalState,
  describeOutdatedReasons,
} = require('../src/utils/guardrails.js');

const LOGO = 'data:image/png;base64,iVBORw0KGgo=';
let server;
let baseUrl;
let token;

before(async () => {
  const user = await db.createUser({ email: `approval-${Date.now()}@example.com`, password: 'password123', name: 'Owner' });
  token = await db.createSession(user.id);
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(() => server.close());

const api = async (method, route, body = null) => {
  const res = await realFetch(`${baseUrl}${route}`, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

// What the studio computes and sends (src/App.jsx getCurrentProductionSettings)
const studioSettings = (ctx) => {
  const dim = ctx.aspectRatio || ctx.dimension || '9:16';
  return {
    language: ctx.language || 'English',
    creativeStyle: ctx.creativeStyle || 'UGC / Creator-style',
    dimension: dim,
    aspectRatio: dim,
    duration: ctx.targetDuration || ctx.duration || '20s',
    targetDuration: ctx.targetDuration || ctx.duration || '20s',
    platform: ctx.platform || '',
    hasLogo: Boolean(ctx.videoLogo !== undefined ? ctx.videoLogo : ctx.logo),
    hasProductPhoto: false,
  };
};

// A draft autosave. withSettings=false is a studio from before drafts carried the settings.
const draftSave = (id, ctx, und, withSettings = true) => api('POST', '/api/projects', buildDraftProject({
  id,
  businessName: ctx.businessName,
  businessType: 'Electronics Store',
  town: 'Mumbai',
  studio: 'guided',
  ...(withSettings ? { productionSettings: studioSettings(ctx) } : {}),
  guided: {
    currentStage: 'understanding',
    completedStages: ['business', 'brief', 'settings'],
    context: {
      brief: ctx.brief, language: ctx.language, creativeStyle: ctx.creativeStyle, platform: ctx.platform,
      aspectRatio: ctx.aspectRatio, dimension: ctx.dimension, duration: ctx.duration, targetDuration: ctx.targetDuration,
      productPhoto: null, videoLogo: ctx.videoLogo, creativeGuardrails: ctx.creativeGuardrails || null, eventContext: ctx.eventContext || null,
    },
    aiUnderstanding: und,
    creativeGuardrails: ctx.creativeGuardrails || null,
    eventContext: ctx.eventContext || null,
  },
}));

const generate = async (id, ctx, previousUnderstanding = null) => {
  const s = studioSettings(ctx);
  process.env.MOCK_SPINE = 'true';
  const res = await api('POST', '/api/creative/ai-understanding', {
    businessName: ctx.businessName, businessType: 'Electronics Store', town: 'Mumbai', brief: ctx.brief,
    language: s.language, creativeStyle: s.creativeStyle, dimension: s.dimension, aspectRatio: s.aspectRatio,
    duration: s.duration, targetDuration: s.targetDuration, platform: s.platform, hasLogo: s.hasLogo, settings: s,
    projectId: id, creativeGuardrails: ctx.creativeGuardrails || null, eventContext: ctx.eventContext || null,
    ...(previousUnderstanding ? { previousUnderstanding, userCorrections: 'Mention free installation' } : {}),
  });
  delete process.env.MOCK_SPINE;
  assert.strictEqual(res.status, 200, JSON.stringify(res.body));
  return res.body.understanding;
};

const approve = (id, ctx, und) => api('PUT', `/api/creative/ai-understanding/${id}`, {
  understanding: { ...und, approval_status: 'approved', approved_at: new Date().toISOString() },
  approvalStatus: 'approved',
  brief: ctx.brief,
  productionSettings: studioSettings(ctx),
  creativeGuardrails: ctx.creativeGuardrails || null,
  eventContext: ctx.eventContext || null,
});

const ideas = (id, ctx) => {
  const s = studioSettings(ctx);
  return api('POST', '/api/creative/directions', {
    businessName: ctx.businessName, businessType: 'Electronics Store', brief: ctx.brief, format: s.creativeStyle, creativeStyle: s.creativeStyle,
    language: s.language, dimension: s.dimension, aspectRatio: s.aspectRatio, duration: s.duration, targetDuration: s.targetDuration,
    hasLogo: s.hasLogo, projectId: id, creativeGuardrails: ctx.creativeGuardrails || null, eventContext: ctx.eventContext || null,
  });
};

const storedUnderstanding = async (id) => (await api('GET', `/api/projects/${id}`)).body.project.aiUnderstanding;

const baseCtx = {
  businessName: 'Reliance Digital',
  brief: 'Diwali offer on smart TVs: up to 30% off and free installation this week.',
  language: 'English',
  creativeStyle: 'UGC / Creator-style',
  platform: 'Instagram Reels / 9:16',
  aspectRatio: '9:16',
  dimension: '9:16',
  duration: '20s',
  targetDuration: '20s',
  logo: null,
};

const withNextDay = async (fn) => {
  const realNow = Date.now;
  Date.now = () => realNow() + 24 * 60 * 60 * 1000;
  try {
    return await fn();
  } finally {
    Date.now = realNow;
  }
};

// Each of these read differently at approval and at autosave before the fix, so the approval was refused
// (the studio showed "Approved" anyway) and the next autosave stored it as outdated: seen the next day.
const DRIFT_CASES = [
  ['business-profile logo, no per-video choice', { logo: LOGO }],
  ['duration left at 15s under a 20s target', { duration: '15s', targetDuration: '20s' }],
  ['aspectRatio and dimension disagree', { aspectRatio: '9:16', dimension: '1:1' }],
  ['occasion with no influence picked', { eventContext: { category: 'Festivals', name: 'Diwali', timing: 'This week' } }],
  ["Do's and Don'ts", { creativeGuardrails: { dos: [{ id: 'd1', text: 'Show the price tag', priority: 'critical' }], donts: [], version: 1 } }],
];

for (const [name, extra] of DRIFT_CASES) {
  for (const withSettings of [true, false]) {
    test(`approval holds through autosave and the next day: ${name}${withSettings ? '' : ' (draft without settings)'}`, async () => {
      const ctx = { ...baseCtx, ...extra };
      const id = `proj_hold_${name.replace(/\W+/g, '_')}_${withSettings}`;
      await draftSave(id, ctx, null, withSettings);
      const und = await generate(id, ctx);
      await draftSave(id, ctx, und, withSettings);

      const put = await approve(id, ctx, und);
      assert.strictEqual(put.status, 200, JSON.stringify(put.body));
      assert.strictEqual(put.body.understanding.approval_status, 'approved');
      assert.notStrictEqual((await ideas(id, ctx)).status, 409, 'Ideas straight after approval');

      await draftSave(id, ctx, put.body.understanding, withSettings);
      assert.strictEqual((await storedUnderstanding(id)).approval_status, 'approved', 'autosave keeps the approval');

      await withNextDay(async () => {
        const reloaded = await storedUnderstanding(id);
        assert.strictEqual(reloaded.approval_status, 'approved', 'reloaded the next day');
        const res = await ideas(id, ctx);
        assert.notStrictEqual(res.status, 409, `next day Ideas: ${JSON.stringify(res.body)}`);
        // the studio, rebuilt from the project, agrees
        const state = understandingApprovalState(reloaded, ctx.brief, ctx.creativeGuardrails || null, studioSettings(ctx), ctx.eventContext || null);
        assert.deepStrictEqual(state, { status: 'approved', reasons: [] });
      });
    });
  }
}

test('a real settings change marks the approval outdated, names it, and changing it back restores the approval', async () => {
  const ctx = { ...baseCtx, logo: LOGO };
  const id = 'proj_genuine_change';
  await draftSave(id, ctx, null);
  const und = await generate(id, ctx);
  const put = await approve(id, ctx, und);
  assert.strictEqual(put.status, 200);

  const changed = { ...ctx, duration: '30s', targetDuration: '30s' };
  await draftSave(id, changed, put.body.understanding);
  assert.strictEqual((await storedUnderstanding(id)).approval_status, 'outdated');
  const res = await ideas(id, changed);
  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.code, 'UNDERSTANDING_OUTDATED');
  assert.deepStrictEqual(res.body.reasons.map((r) => r.part), ['settings.duration']);
  assert.match(res.body.detail, /duration \(20s → 30s\)/);
  const client = explainUnderstandingOutdatedClient(put.body.understanding, ctx.brief, null, studioSettings(changed), null);
  assert.deepStrictEqual(client.map((r) => r.part), ['settings.duration']);
  assert.match(describeOutdatedReasons(client), /duration \(20s → 30s\)/);

  // removing the logo is an upload change too
  const noLogo = { ...ctx, videoLogo: null };
  assert.deepStrictEqual(explainUnderstandingOutdatedClient(put.body.understanding, ctx.brief, null, studioSettings(noLogo), null).map((r) => r.part), ['settings.hasLogo']);

  await draftSave(id, ctx, await storedUnderstanding(id));
  assert.strictEqual((await storedUnderstanding(id)).approval_status, 'approved', 'back to the approved inputs');
  assert.notStrictEqual((await ideas(id, ctx)).status, 409);
});

test('approval is refused, with the reason, when the version was made from other inputs', async () => {
  const ctx = { ...baseCtx };
  const id = 'proj_refused';
  await draftSave(id, ctx, null);
  const und = await generate(id, ctx);
  const res = await approve(id, { ...ctx, language: 'Hindi' }, und);
  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.code, 'UNDERSTANDING_OUTDATED');
  assert.deepStrictEqual(res.body.reasons.map((r) => r.part), ['settings.language']);
  assert.match(res.body.detail, /language \(English → Hindi\)/);
  assert.strictEqual((await storedUnderstanding(id)).approval_status, 'pending');
});

test('a regenerated version starts unapproved, is reported as such, and can be approved', async () => {
  const ctx = { ...baseCtx, logo: LOGO };
  const id = 'proj_regen';
  await draftSave(id, ctx, null);
  const v1 = await generate(id, ctx);
  assert.strictEqual((await approve(id, ctx, v1)).status, 200);

  const v2 = await generate(id, ctx, { ...v1, approval_status: 'approved' });
  assert.strictEqual(v2.version, 2);
  assert.strictEqual(v2.approval_status, 'pending');
  const blocked = await ideas(id, ctx);
  assert.strictEqual(blocked.status, 409);
  assert.strictEqual(blocked.body.code, 'UNDERSTANDING_NOT_APPROVED');
  assert.strictEqual(blocked.body.approvalStatus, 'pending');
  assert.strictEqual(blocked.body.version, 2);
  assert.strictEqual(understandingApprovalState(v2, ctx.brief, null, studioSettings(ctx), null).status, 'pending');

  const put = await approve(id, ctx, v2);
  assert.strictEqual(put.status, 200, JSON.stringify(put.body));
  assert.notStrictEqual((await ideas(id, ctx)).status, 409);
});

test('an approval a save wrongly marked outdated is approved again once the inputs are compared properly', async () => {
  const ctx = { ...baseCtx, logo: LOGO };
  const id = 'proj_heal';
  await draftSave(id, ctx, null);
  const und = await generate(id, ctx);
  const put = await approve(id, ctx, und);
  // what the old save path stored: approved, then labelled outdated by a misread logo
  const mislabelled = { ...put.body.understanding, approval_status: 'outdated' };
  const state = understandingApprovalState(mislabelled, ctx.brief, null, studioSettings(ctx), null);
  assert.deepStrictEqual(state, { status: 'approved', reasons: [] });
  assert.strictEqual(understandingSpine.reconcileApproval(mislabelled, ctx.brief, null, studioSettings(ctx), null).approval_status, 'approved');
  assert.strictEqual(understandingSpine.reconcileApproval({ ...mislabelled, approved_at: null }, ctx.brief, null, studioSettings(ctx), null).approval_status, 'pending');
  await draftSave(id, ctx, mislabelled);
  assert.strictEqual((await storedUnderstanding(id)).approval_status, 'approved');
  assert.notStrictEqual((await ideas(id, ctx)).status, 409);
});

test('only user edits count: guardrail version counters and older style labels are not changes', () => {
  const settings = { language: 'English', creativeStyle: 'Product demo', dimension: '9:16', duration: '20s', hasLogo: false };
  const und = understandingSpine.createEmptyUnderstanding('Brief');
  und.source_settings = understandingSpine.normalizeUnderstandingSettings(settings);
  und.source_settings_hash = understandingSpine.hashSettings(settings);
  const g1 = { dos: [{ id: 'a', text: 'Show the price', priority: 'critical' }], donts: [], version: 1 };
  und.source_guardrails_version = 1;
  und.source_guardrails_hash = require('../engine/guardrails').hashGuardrails(g1);
  und.source_guardrails_signature = require('../engine/guardrails').guardrailsContentSignature(require('../engine/guardrails').normalizeCreativeGuardrails(g1));

  // same Do's after an add-then-remove (version 3), the stored legacy label shown as today's name
  const current = { ...settings, creativeStyle: 'VO-led' };
  const g3 = { ...g1, version: 3, dos: [{ id: 'b', text: 'Show the price', priority: 'critical' }] };
  assert.deepStrictEqual(understandingSpine.explainUnderstandingOutdated(und, 'Brief', g3, current, null), []);
  assert.deepStrictEqual(explainUnderstandingOutdatedClient(und, 'Brief', g3, current, null), []);

  // a real edit to the Do's is a change on both sides
  const edited = { ...g3, dos: [{ id: 'b', text: 'Show the price and EMI', priority: 'critical' }] };
  assert.deepStrictEqual(understandingSpine.explainUnderstandingOutdated(und, 'Brief', edited, current, null).map((r) => r.part), ['guardrails']);
  assert.deepStrictEqual(explainUnderstandingOutdatedClient(und, 'Brief', edited, current, null).map((r) => r.part), ['guardrails']);
});
