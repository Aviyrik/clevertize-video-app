const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'occasion-event-test-'));
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.MAGNIFIC_API_KEY = 'test-magnific-key';
process.env.FESTIVAL_LIVE = 'off';

const J = (o) => `@@JSON@@\n${JSON.stringify(o)}\n@@END@@`;
const GOOD_SCRIPT = fs.readFileSync(path.join(__dirname, 'fixtures/good-storytelling.txt'), 'utf8');

const realFetch = global.fetch;
let anthropicQueue = [];
let recordedAnthropicRequests = [];

global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
  if (u.startsWith('https://api.anthropic.com')) {
    if (opts.body) {
      try {
        recordedAnthropicRequests.push(JSON.parse(opts.body));
      } catch {}
    }
    const text = anthropicQueue.length ? anthropicQueue.shift() : '{}';
    return json({ content: [{ type: 'text', text }], stop_reason: 'end_turn' });
  }
  return realFetch(url, opts);
};

const { app } = require('../server');
const db = require('../engine/db');
const understandingSpine = require('../engine/understandingSpine');
const eventContextBackend = require('../engine/eventContext');
const eventContextClient = require('../src/utils/eventContext');
const { isUnderstandingOutdatedClient } = require('../src/utils/guardrails');
const { buildDraftProject, resumeTargetOf } = require('../src/utils/drafts');

let server;
let baseUrl;
let tokenA;
let userAId;

async function api(method, urlPath, body, token = tokenA) {
  const res = await realFetch(`${baseUrl}${urlPath}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, body: data };
}

before(async () => {
  const userA = await db.createUser({
    email: `occ-a-${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Occasion User',
  });
  userAId = userA.id;
  tokenA = await db.createSession(userA.id);

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  global.fetch = realFetch;
  if (server) await new Promise((r) => server.close(r));
});

test('1. Frontend UX & Data Model: Collapsed by default, zero preselected values, Subtly only after event selected', () => {
  const sectionSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/OccasionEventSection.jsx'), 'utf8');
  const guidedSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  const simpleSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/SimpleBusinessStudio.jsx'), 'utf8');

  // Exact collapsible title & helper copy
  assert.ok(sectionSrc.includes('useState(Boolean(defaultExpanded))'), 'Collapsed by default');
  assert.ok(sectionSrc.includes('Occasion &amp; Event'), 'Displays Occasion & Event title');
  assert.ok(
    sectionSrc.includes('Creating this campaign around a festival, occasion or special event?'),
    'Displays expected secondary description'
  );
  assert.ok(guidedSrc.includes('<OccasionEventSection'), 'Director Brief includes OccasionEventSection');
  assert.ok(simpleSrc.includes('<OccasionEventSection'), 'Simple Brief includes OccasionEventSection');

  // Categories match exact 4 required values
  assert.deepStrictEqual(
    eventContextClient.EVENT_CATEGORIES.map((c) => c.id),
    ['Festivals', 'Occasions', 'Sports & Events', 'Other']
  );
  assert.deepStrictEqual(
    eventContextClient.CREATIVE_INFLUENCE_OPTIONS.map((o) => o.id),
    ['Strongly', 'Subtly', 'Reference only']
  );

  // Empty by default — nothing preselected
  const empty = eventContextClient.createEmptyEventContext();
  assert.strictEqual(empty.category, '');
  assert.strictEqual(empty.name, '');
  assert.strictEqual(empty.timing, '');
  assert.strictEqual(empty.creativeInfluence, '');
  assert.strictEqual(empty.additionalContext, '');
  assert.strictEqual(eventContextClient.hasActiveClientEventContext(empty), false);

  // Setting category alone still leaves influence unset until user selects/enters an event name
  const catOnly = eventContextClient.updateClientEventField(empty, { category: 'Festivals' });
  assert.strictEqual(catOnly.category, 'Festivals');
  assert.strictEqual(catOnly.creativeInfluence, '');

  // Selecting/entering an event name defaults creativeInfluence to 'Subtly'
  const withEvent = eventContextClient.updateClientEventField(catOnly, { name: 'Diwali' });
  assert.strictEqual(withEvent.name, 'Diwali');
  assert.strictEqual(withEvent.creativeInfluence, 'Subtly');
  assert.strictEqual(eventContextClient.hasActiveClientEventContext(withEvent), true);

  // Clearing event name resets influence back to empty
  const cleared = eventContextClient.updateClientEventField(withEvent, { name: '' });
  assert.strictEqual(cleared.name, '');
  assert.strictEqual(cleared.creativeInfluence, '');

  // Searchable curated options
  const cricketMatches = eventContextClient.searchEventSuggestions('cricket', 'Sports & Events');
  assert.ok(cricketMatches.some((m) => /Cricket/i.test(m.name)));
});

test('2. Empty / Optional State & Anti-Hallucination Rules: Omitted from prompts when not provided', async () => {
  assert.strictEqual(eventContextBackend.hasActiveEventContext(null), false);
  assert.strictEqual(eventContextBackend.formatEventPromptBlock(null), '');
  assert.strictEqual(
    eventContextBackend.formatEventPromptBlock({ category: '', name: '', timing: '', creativeInfluence: '', additionalContext: '' }),
    ''
  );

  const prevKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const res = await understandingSpine.generateAiUnderstanding({
      businessName: 'Urban Bakehouse',
      businessType: 'Bakery',
      town: 'Pune',
      brief: 'Fresh sourdough bread baked every morning',
      eventContext: null,
    });
    assert.strictEqual(res.source_event, null);
    assert.ok(res.occasion_context.includes('No specific seasonal event or occasion specified'));
    assert.ok(!res.verified_facts.some((f) => f.startsWith('Occasion & Event:')));
  } finally {
    process.env.ANTHROPIC_API_KEY = prevKey;
  }

  // When active, formatEventPromptBlock enforces influence calibration & prohibits invented facts
  const formatted = eventContextBackend.formatEventPromptBlock({
    category: 'Sports & Events',
    name: 'Cricket Tournament Season',
    timing: 'Next month',
    creativeInfluence: 'Reference only',
    additionalContext: 'Friends gather to watch evening matches with snacks',
  });
  assert.ok(formatted.includes('Cricket Tournament Season'));
  assert.ok(formatted.includes('INFLUENCE LEVEL — REFERENCE ONLY'));
  assert.ok(formatted.includes('Do NOT invent or assume specific event dates, countdown days, match schedules/fixtures'));
});

test('3. Persistence & Model Separation: eventContext stored independently of creativeGuardrails & restored cleanly', async () => {
  const projId = `proj_occ_persist_${Date.now()}`;
  const eventPayload = {
    category: 'Festivals',
    name: 'Navratri',
    timing: 'Next week',
    creativeInfluence: 'Subtly',
    additionalContext: 'Highlight fasting snacks range cleanly',
  };
  const guardrailsPayload = {
    dos: [{ id: 'do_1', text: 'Show fresh foil seal packaging', priority: 'critical' }],
    donts: [{ id: 'dont_1', text: 'Avoid artificial sweeteners', priority: 'critical' }],
  };

  const saved = await db.saveProject(
    {
      id: projId,
      businessName: 'Gopal Namkeen',
      businessType: 'FMCG / Snacks',
      brief: 'Promote fasting snacks pack',
      creativeGuardrails: guardrailsPayload,
      eventContext: eventPayload,
      currentStage: 'brief',
    },
    userAId
  );

  assert.strictEqual(saved.eventContext.name, 'Navratri');
  assert.strictEqual(saved.eventContext.creativeInfluence, 'Subtly');
  assert.strictEqual(saved.creativeGuardrails.dos.length, 1);
  assert.strictEqual(saved.creativeGuardrails.dos[0].text, 'Show fresh foil seal packaging');

  // Draft helper preserves eventContext distinctly as well
  const draftProj = buildDraftProject({
    id: `proj_draft_occ_${Date.now()}`,
    businessName: 'Gopal Namkeen',
    studio: 'guided',
    guided: {
      currentStage: 'understanding',
      context: { brief: 'Promote fasting snacks pack', eventContext: eventPayload },
      eventContext: eventPayload,
    },
  });
  assert.strictEqual(draftProj.eventContext.name, 'Navratri');
  assert.strictEqual(resumeTargetOf(draftProj).stage, 'understanding');

  // Clearing eventContext on save persists null cleanly while keeping guardrails untouched
  const cleared = await db.saveProject({ ...saved, eventContext: null }, userAId);
  assert.strictEqual(cleared.eventContext, null);
  assert.strictEqual(cleared.creativeGuardrails.dos.length, 1);
});

test('4. Director Mode Propagation & Stale Invalidations + Simple Mode Silent Event Handling', async () => {
  const projId = `proj_occ_flow_${Date.now()}`;
  const brief = '20% off signature gift boxes for families';
  const initialEvent = {
    category: 'Occasions',
    name: 'Wedding Season',
    timing: 'This month',
    creativeInfluence: 'Subtly',
    additionalContext: 'Highlight family gifting warmth',
  };

  await db.saveProject(
    {
      id: projId,
      businessName: 'Meera Jewels',
      businessType: 'Jewellery Store',
      brief,
      eventContext: initialEvent,
    },
    userAId
  );

  // 1) AI Understanding receives eventContext and records source_event_hash
  process.env.MOCK_SPINE = 'true';
  const undRes = await api('POST', '/api/creative/ai-understanding', {
    businessName: 'Meera Jewels',
    businessType: 'Jewellery Store',
    brief,
    eventContext: initialEvent,
    projectId: projId,
  });
  delete process.env.MOCK_SPINE;
  assert.strictEqual(undRes.status, 200);
  assert.strictEqual(undRes.body.eventContext.name, 'Wedding Season');
  assert.strictEqual(undRes.body.understanding.source_event.name, 'Wedding Season');
  assert.ok(undRes.body.understanding.source_event_hash);

  // Approve understanding
  const putRes = await api('PUT', `/api/creative/ai-understanding/${projId}`, {
    understanding: undRes.body.understanding,
    approvalStatus: 'approved',
  });
  assert.strictEqual(putRes.status, 200);

  // 2) Client + server outdated detection when user changes event details
  const editedEvent = {
    ...initialEvent,
    creativeInfluence: 'Strongly',
    timing: 'Next weekend',
  };
  assert.strictEqual(
    isUnderstandingOutdatedClient(putRes.body.understanding, brief, null, null, editedEvent),
    true
  );

  // Backend blocks stale approval with 409 UNDERSTANDING_OUTDATED on /api/creative/directions
  const staleDirRes = await api('POST', '/api/creative/directions', {
    businessName: 'Meera Jewels',
    businessType: 'Jewellery Store',
    brief,
    eventContext: editedEvent,
    projectId: projId,
  });
  assert.strictEqual(staleDirRes.status, 409);
  assert.strictEqual(staleDirRes.body.code, 'UNDERSTANDING_OUTDATED');

  // Re-generate & re-approve with updated eventContext -> downstream directions/hooks receive DB eventContext automatically
  process.env.MOCK_SPINE = 'true';
  const und2 = await api('POST', '/api/creative/ai-understanding', {
    businessName: 'Meera Jewels',
    businessType: 'Jewellery Store',
    brief,
    eventContext: editedEvent,
    projectId: projId,
  });
  delete process.env.MOCK_SPINE;
  await api('PUT', `/api/creative/ai-understanding/${projId}`, {
    understanding: und2.body.understanding,
    approvalStatus: 'approved',
  });

  recordedAnthropicRequests = [];
  anthropicQueue.push(J([
    { id: 'd1', title: 'Heirloom Trust', description: 'Show bridal gifting warmth', angle: 'Family trust', recommended: true },
  ]));
  const okDirRes = await api('POST', '/api/creative/directions', {
    businessName: 'Meera Jewels',
    businessType: 'Jewellery Store',
    brief,
    projectId: projId, // omit eventContext in request body -> backend injects saved project eventContext!
  });
  assert.strictEqual(okDirRes.status, 200);
  const dirPrompt = recordedAnthropicRequests.at(-1).messages[0].content;
  assert.ok(dirPrompt.includes('OPTIONAL OCCASION & EVENT CONTEXT'));
  assert.ok(dirPrompt.includes('Wedding Season'));
  assert.ok(dirPrompt.includes('INFLUENCE LEVEL — STRONGLY'));

  // Hooks endpoint also receives project eventContext
  recordedAnthropicRequests = [];
  anthropicQueue.push(J([
    { id: 'h1', archetype: 'Story', hookLine: 'Moments families keep forever.', visualAction: 'Close-up heirloom tray', recommended: true },
  ]));
  const hookRes = await api('POST', '/api/creative/hooks', {
    businessName: 'Meera Jewels',
    businessType: 'Jewellery Store',
    brief,
    projectId: projId,
  });
  assert.strictEqual(hookRes.status, 200);
  assert.ok(recordedAnthropicRequests.at(-1).messages[0].content.includes('Wedding Season'));

  // 3) Simple Mode: silently preserves & refreshes eventContext with auto_approved (no user checkpoint)
  const simpleProjId = `proj_occ_simple_${Date.now()}`;
  await db.saveProject({ id: simpleProjId, businessName: 'Meera Jewels', businessType: 'Jewellery Store', brief }, userAId);
  recordedAnthropicRequests = [];
  process.env.MOCK_SPINE = 'true';
  anthropicQueue.push(J({
    packages: [1, 2, 3].map((i) => ({
      id: `pkg_${i}`,
      title: `Package ${i}`,
      angle: 'Offer',
      hookHeadline: 'Celebrate special moments cleanly',
      narrativeSummary: 'Gift showcase.',
      callToAction: 'Visit store',
      setting: 'Jewellery showroom',
      scenes: [1, 2, 3, 4].map((s) => ({
        sceneNumber: s,
        beat: 'Beat',
        timing: '0-5s',
        visual: 'Gift box showcase under warm showroom lighting.',
        dialogue: 'Lead: "Crafted for moments your family remembers."',
      })),
    })),
  }));
  const simpleRes = await api('POST', '/api/creative/simple-packages', {
    businessName: 'Meera Jewels',
    businessType: 'Jewellery Store',
    brief,
    eventContext: editedEvent,
    projectId: simpleProjId,
  });
  delete process.env.MOCK_SPINE;
  assert.strictEqual(simpleRes.status, 200);
  assert.strictEqual(simpleRes.body.aiUnderstanding.approval_status, 'auto_approved');
  assert.strictEqual(simpleRes.body.eventContext.name, 'Wedding Season');
  assert.ok(recordedAnthropicRequests.at(-1).messages[0].content.includes('Wedding Season'));
  const reloadedSimple = await db.getProjectById(simpleProjId, userAId);
  assert.strictEqual(reloadedSimple.eventContext.name, 'Wedding Season');
  assert.strictEqual(reloadedSimple.eventContext.creativeInfluence, 'Strongly');
});
