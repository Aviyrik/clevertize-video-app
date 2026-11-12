const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'guardrails-test-'));
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.MAGNIFIC_API_KEY = 'test-magnific-key';
process.env.FESTIVAL_LIVE = 'off';

const J = (o) => `@@JSON@@\n${JSON.stringify(o)}\n@@END@@`;
const GOOD_SCRIPT = fs.readFileSync(path.join(__dirname, 'fixtures/good-storytelling.txt'), 'utf8');

const realFetch = global.fetch;
let anthropicQueue = [];
let recordedAnthropicRequests = [];
let recordedMagnificRuns = [];

global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
  if (u.startsWith('https://api.anthropic.com')) {
    if (opts.body) {
      try {
        recordedAnthropicRequests.push(JSON.parse(opts.body));
      } catch {}
    }
    const text = anthropicQueue.length ? anthropicQueue.shift() : '{}';
    return json({ content: [{ type: 'text', text }], stop_reason: 'end_turn' });
  }
  if (u.includes('api.magnific.com/v1/ai/flows/') && !u.endsWith('/run')) {
    return json({
      inputs: [
        { id: 'scenes_7', type: 'list', required: true },
        { id: 'character_1_7', required: true },
        { id: 'character_2_7', required: true },
        { id: 'setting_7', required: true },
      ],
    });
  }
  if (u.endsWith('/run')) {
    recordedMagnificRuns.push(JSON.parse(opts.body));
    return json({ id: `run_gr_${recordedMagnificRuns.length}` });
  }
  return realFetch(url, opts);
};

const { app } = require('../server');
const db = require('../engine/db');
const guardrails = require('../engine/guardrails');
const guardrailsSpine = require('../engine/guardrailsSpine');
const understandingSpine = require('../engine/understandingSpine');
const { runGate } = require('../engine/gate');
const { parseOutput } = require('../engine/parse');
const { compileShotPrompt } = require('../engine/compiler');

let server, baseUrl, userAToken, userAId, userBToken, userBId;

before(async () => {
  const userA = await db.createUser({ email: `gr-a-${Date.now()}@example.com`, password: 'password123', name: 'Owner A' });
  const userB = await db.createUser({ email: `gr-b-${Date.now()}@example.com`, password: 'password123', name: 'Owner B' });
  userAId = userA.id;
  userBId = userB.id;
  userAToken = await db.createSession(userA.id);
  userBToken = await db.createSession(userB.id);

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(() => {
  guardrailsSpine.resetGuardrailsSpineProvider();
  server.close();
});

const api = async (method, route, body = null, token = userAToken) => {
  const res = await realFetch(`${baseUrl}${route}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

test('1. Data Model: Adding, editing, deleting multiple instructions with stable IDs and version bumps', () => {
  // Initial creation with multiple Do's & Don'ts
  const g1 = guardrails.normalizeCreativeGuardrails({
    dos: [
      { id: 'do_1', text: 'Mention festive 20% offer', priority: 'critical' },
      { id: 'do_2', text: 'Warm family lighting', priority: 'preference' },
    ],
    donts: [
      { id: 'dont_1', text: 'Do not mention BrandX', priority: 'critical' },
    ],
  });
  assert.strictEqual(g1.dos.length, 2);
  assert.strictEqual(g1.donts.length, 1);
  assert.strictEqual(g1.dos[0].id, 'do_1');
  assert.strictEqual(g1.dos[1].priority, 'preference');
  assert.strictEqual(g1.version, 1);

  // Edit text of existing instruction -> preserves stable ID & increments version
  const g2 = guardrails.normalizeCreativeGuardrails(
    {
      dos: [
        { id: 'do_1', text: 'Mention festive 25% offer', priority: 'critical' },
        { id: 'do_2', text: 'Warm family lighting', priority: 'preference' },
      ],
      donts: g1.donts,
    },
    g1
  );
  assert.strictEqual(g2.dos[0].id, 'do_1');
  assert.strictEqual(g2.version, 2);

  // Unchanged re-save -> keeps version unchanged
  const gSame = guardrails.normalizeCreativeGuardrails(g2, g2);
  assert.strictEqual(gSame.version, 2);

  // Delete an instruction -> increments version cleanly
  const g3 = guardrails.normalizeCreativeGuardrails(
    { dos: [g2.dos[0]], donts: [] },
    g2
  );
  assert.strictEqual(g3.dos.length, 1);
  assert.strictEqual(g3.donts.length, 0);
  assert.strictEqual(g3.version, 3);
});

test('2. Persistence & User Isolation: creativeGuardrails persists across reopening and blocks unauthorized users', async () => {
  const projId = `proj_gr_persist_${Date.now()}`;
  const created = await db.saveProject(
    {
      id: projId,
      title: 'Jewellery Heritage',
      businessName: 'Swarna Jewels',
      businessType: 'Jewellery Store',
      town: 'Jaipur',
      brief: 'Showcase bridal gold collection with festive offer.',
      creativeGuardrails: {
        dos: [{ id: 'do_hallmark', text: 'Mention 916 BIS Hallmark', priority: 'critical' }],
        donts: [{ id: 'dont_comp', text: 'Do not mention Zaveri', priority: 'critical' }],
      },
    },
    userAId
  );

  assert.strictEqual(created.creativeGuardrails.dos[0].text, 'Mention 916 BIS Hallmark');
  assert.strictEqual(created.creativeGuardrails.version, 1);

  // Reopen as User A
  const reopened = await db.getProjectById(projId, userAId);
  assert.ok(reopened);
  assert.strictEqual(reopened.creativeGuardrails.donts[0].id, 'dont_comp');

  // Reopen via API endpoint as User A
  const getResA = await api('GET', `/api/projects/${projId}/guardrails`, null, userAToken);
  assert.strictEqual(getResA.status, 200);
  assert.strictEqual(getResA.body.creativeGuardrails.dos[0].text, 'Mention 916 BIS Hallmark');

  // User B isolation check (GET, PUT, and stage injection)
  const getResB = await api('GET', `/api/projects/${projId}/guardrails`, null, userBToken);
  assert.strictEqual(getResB.status, 404);

  const putResB = await api('PUT', `/api/projects/${projId}/guardrails`, { dos: [{ text: 'Hijacked' }], donts: [] }, userBToken);
  assert.strictEqual(putResB.status, 404);

  const hooksCrossTenant = await api('POST', '/api/creative/hooks', { businessName: 'Hack', projectId: projId }, userBToken);
  assert.strictEqual(hooksCrossTenant.status, 403);
});

test('3. Projects without guardrails continue working seamlessly', async () => {
  const emptyProj = await db.saveProject(
    {
      id: `proj_no_gr_${Date.now()}`,
      businessName: 'Plain Bakery',
      businessType: 'Bakery',
      brief: 'Fresh sourdough every morning',
    },
    userAId
  );

  const interp = await guardrailsSpine.interpretGuardrails({
    creativeGuardrails: emptyProj.creativeGuardrails,
    businessName: 'Plain Bakery',
    brief: emptyProj.brief,
  });
  assert.strictEqual(interp.empty, true);
  assert.strictEqual(interp.conflicts.length, 0);

  const report = guardrails.validateOutputAgainstGuardrails({
    outputText: 'Welcome to Plain Bakery for fresh sourdough!',
    stage: 'script',
    guardrails: emptyProj.creativeGuardrails,
  });
  assert.strictEqual(report.hasGuardrails, false);
  assert.strictEqual(report.hasCriticalViolation, false);
});

test('4. Spine Modularity & Failure Behavior: conflicts, unsupported claims, custom Spine injection, and production fail-closed', async () => {
  // Conflicts + unsupported claims detection via placeholder adapter
  process.env.MOCK_SPINE = 'true';
  const analysis = await guardrailsSpine.interpretGuardrails({
    creativeGuardrails: {
      dos: [
        { id: 'd1', text: 'Promise 100% guaranteed weight loss in 7 days', priority: 'critical' },
        { id: 'd2', text: 'Mention we are #1 in India', priority: 'critical' },
      ],
      donts: [
        { id: 'n1', text: 'Avoid exaggerated claims or guarantees', priority: 'critical' },
      ],
      version: 1,
    },
    businessName: 'FitLife Studio',
    brief: 'Promote fitness classes',
  });
  delete process.env.MOCK_SPINE;

  assert.ok(analysis.conflicts.length >= 1, 'Detects conflict between guarantee Do and avoid claims Don\'t');
  assert.ok(analysis.unsupported_claims.length >= 2, 'Flags unverified 100% guarantee and #1 ranking claims');

  // Pluggable external Spine verification (Shubhiksha's Spine replacement boundary)
  let customCalled = false;
  guardrailsSpine.registerGuardrailsSpineProvider(async ({ creativeGuardrails: g }) => {
    customCalled = true;
    return {
      normalized_dos: g.dos.map((d) => ({ id: d.id, original_text: d.text, interpreted_rule: d.text, priority: d.priority, scope: 'dialogue', check_keywords: ['hallmark'] })),
      normalized_donts: [],
      conflicts: [],
      unsupported_claims: [],
      summary: 'Custom external Spine by Shubhiksha executed.',
      spine_provider: 'shubhiksha_v1',
      is_mock: false,
    };
  });

  const extRes = await guardrailsSpine.interpretGuardrails({
    creativeGuardrails: { dos: [{ id: 'd9', text: 'Show hallmark', priority: 'critical' }], donts: [], version: 1 },
  });
  assert.strictEqual(customCalled, true);
  assert.strictEqual(extRes.spine_provider, 'shubhiksha_v1');
  guardrailsSpine.resetGuardrailsSpineProvider();

  // Production fail-closed verification
  const prevEnv = process.env.NODE_ENV;
  const prevKey = process.env.ANTHROPIC_API_KEY;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.ANTHROPIC_API_KEY;

    await assert.rejects(
      async () => {
        await guardrailsSpine.interpretGuardrails({
          creativeGuardrails: { dos: [{ id: 'p1', text: 'Mandatory offer', priority: 'critical' }], donts: [], version: 1 },
          brief: 'Test offer',
        });
      },
      /unavailable in production|failed in production/i,
      'Must fail closed in production when Spine/API unavailable — never silently mock'
    );
  } finally {
    process.env.NODE_ENV = prevEnv;
    if (prevKey) process.env.ANTHROPIC_API_KEY = prevKey;
  }
});

test('5. Guardrails Propagation: Backend injects saved project guardrails across AI Understanding, Directions, Hooks, Plots, Story, Script, Rewrite, Simple Mode & Video Prompts', async () => {
  const projId = `proj_gr_flow_${Date.now()}`;
  const briefText = 'Festive pure gold jewellery showcase with seasonal making charge discount.';
  await db.saveProject(
    {
      id: projId,
      businessName: 'Alankar Jewels',
      businessType: 'Jewellery Store',
      town: 'Pune',
      brief: briefText,
      creativeGuardrails: {
        dos: [{ id: 'do_bis', text: 'Include 916 BIS Hallmark certification', priority: 'critical' }],
        donts: [{ id: 'dont_rival', text: 'Do not mention DiamondPlaza', priority: 'critical' }],
      },
    },
    userAId
  );

  // 1) AI Understanding (with Spine interpretation + Understanding generation)
  recordedAnthropicRequests = [];
  process.env.MOCK_SPINE = 'true';
  const undRes = await api('POST', '/api/creative/ai-understanding', {
    businessName: 'Alankar Jewels',
    businessType: 'Jewellery Store',
    brief: briefText,
    projectId: projId,
  });
  delete process.env.MOCK_SPINE;
  assert.strictEqual(undRes.status, 200);
  assert.ok(undRes.body.understanding);
  assert.ok(undRes.body.understanding.creative_guardrails.dos.some((d) => d.includes('916 BIS Hallmark')));

  // Approve understanding explicitly in Director Mode
  const approveRes = await api('PUT', `/api/creative/ai-understanding/${projId}`, {
    understanding: undRes.body.understanding,
    approvalStatus: 'approved',
  });
  assert.strictEqual(approveRes.status, 200);

  // 2) Creative Directions (caller omits guardrails in body; backend injects from DB project!)
  recordedAnthropicRequests = [];
  anthropicQueue.push(J([
    { id: 'dir_1', title: '916 Hallmark Purity Trust', description: 'Focus on certified purity.', angle: 'Trust', recommended: true },
  ]));
  const dirRes = await api('POST', '/api/creative/directions', {
    businessName: 'Alankar Jewels',
    businessType: 'Jewellery Store',
    brief: briefText,
    projectId: projId,
  });
  assert.strictEqual(dirRes.status, 200);
  assert.ok(recordedAnthropicRequests.at(-1).messages[0].content.includes('Do not mention DiamondPlaza'), 'Directions prompt received project Don\'t from DB');

  // 3) Hooks (caller omits guardrails; backend injects from DB)
  recordedAnthropicRequests = [];
  anthropicQueue.push(J([
    { id: 'h1', archetype: 'Visual', hookLine: 'Look closely at this 916 BIS Hallmark stamp!', visualAction: 'Macro shot of gold ring stamp', recommended: true },
  ]));
  const hookRes = await api('POST', '/api/creative/hooks', {
    businessName: 'Alankar Jewels',
    businessType: 'Jewellery Store',
    brief: briefText,
    language: 'English',
    projectId: projId,
  });
  assert.strictEqual(hookRes.status, 200);
  assert.ok(recordedAnthropicRequests.at(-1).messages[0].content.includes('916 BIS Hallmark certification'), 'Hooks prompt received project Do from DB');

  // 4) Plots
  recordedAnthropicRequests = [];
  anthropicQueue.push(J([
    { id: 'p1', title: 'Purity Check', coreIdea: 'Bride checks hallmark', hookBeat: 'Close up', conflictBeat: 'Doubt', payoffBeat: '916 stamp reveals trust', recommended: true },
  ]));
  const plotRes = await api('POST', '/api/creative/plots', {
    businessName: 'Alankar Jewels',
    businessType: 'Jewellery Store',
    brief: briefText,
    projectId: projId,
  });
  assert.strictEqual(plotRes.status, 200);
  assert.ok(recordedAnthropicRequests.at(-1).messages[0].content.includes('DiamondPlaza'), 'Plots prompt received project Don\'t from DB');

  // 5) Story World
  recordedAnthropicRequests = [];
  anthropicQueue.push(J({
    format: 'Storytelling',
    setting: 'Plush sunlit Alankar Jewels showroom in Pune.',
    beats: [
      { beat: 'HOOK', title: 'Scene 1', action: 'Zoom in on ring with 916 BIS Hallmark', dialogue: 'Look at this purity!' },
      { beat: 'BUILD', title: 'Scene 2', action: 'Show festive bangles', dialogue: 'Certified gold craftsmanship.' },
      { beat: 'TURN', title: 'Scene 3', action: 'Family smiles at transparent receipt', dialogue: 'No hidden surprises.' },
      { beat: 'PAYOFF', title: 'Scene 4', action: 'Happy bride chooses her set', dialogue: 'Celebrate with Alankar.' },
    ],
  }));
  const storyRes = await api('POST', '/api/creative/story', {
    businessName: 'Alankar Jewels',
    businessType: 'Jewellery Store',
    brief: briefText,
    projectId: projId,
  });
  assert.strictEqual(storyRes.status, 200);
  assert.ok(storyRes.body.guardrailReport, 'Story stage attaches guardrailReport');
  assert.strictEqual(storyRes.body.guardrailReport.hasCriticalViolation, false);

  // 6) Script Synthesis
  const compliantScript = GOOD_SCRIPT.replace(
    'Same setting: wide shot from inside the counter.',
    'Same setting: wide shot from inside the counter showing a 916 BIS Hallmark certification card.'
  );
  recordedAnthropicRequests = [];
  anthropicQueue.push(compliantScript);
  const synRes = await api('POST', '/api/creative/synthesize-script', {
    form: { businessName: 'Alankar Jewels', businessType: 'Jewellery Store', town: 'Pune', language: 'Hindi', brief: briefText },
    creativeDNA: { format: 'Storytelling' },
    projectId: projId,
  });
  assert.strictEqual(synRes.status, 200);
  assert.ok(synRes.body.guardrailReport);
  assert.ok(recordedAnthropicRequests.at(-1).messages[0].content.at(-1).text.includes('916 BIS Hallmark certification'));

  // 7) Scene Rewriter preserves guardrails
  recordedAnthropicRequests = [];
  anthropicQueue.push(`SCENE 2
Visual: Same setting: Alankar Jewels counter in Pune. Host points to the 916 BIS Hallmark tag gently.
Animation Elements:
• Camera: Medium shot
• Text overlay: none
• UI element: none
• Transition: cut
• Motion graphics: none
Audio / Dialogue / Voiceover:
Host: "Every piece carries our 916 BIS Hallmark certification."
Sound Design: Warm chime
Editing Notes: Keep frame clean`);
  const rwRes = await api('POST', '/api/creative/rewrite-scene', {
    sceneText: 'SCENE 2\nVisual: Old\nAudio / Dialogue / Voiceover:\nHost: "Hi"',
    sceneIndex: 1,
    instruction: 'Make dialogue warmer',
    form: { language: 'English' },
    projectId: projId,
  });
  assert.strictEqual(rwRes.status, 200);
  assert.ok(rwRes.body.guardrailReport);
  assert.strictEqual(rwRes.body.guardrailReport.hasCriticalViolation, false);
  assert.ok(recordedAnthropicRequests.at(-1).system.includes('916 BIS Hallmark certification'));

  // 8) Video Generation (/api/run & compileShotPrompt) injects visual/content guardrails into Magnific payload
  recordedMagnificRuns = [];
  const runRes = await api('POST', '/api/run', {
    projectId: projId,
    businessName: 'Alankar Jewels',
    businessType: 'Jewellery Store',
    brief: briefText,
    scenes: [
      'Visual: Same setting: Showroom counter showcasing 916 BIS Hallmark gold ring. Audio: "Certified purity!"',
    ],
  });
  assert.strictEqual(runRes.status, 200);
  assert.ok(runRes.body.guardrailReport);
  const sentInputs = recordedMagnificRuns[0].inputs || recordedMagnificRuns[0];
  const sentScenes = Object.values(sentInputs).find((v) => Array.isArray(v));
  assert.ok(Array.isArray(sentScenes) && sentScenes[0].includes('Do not mention DiamondPlaza'), 'Magnific shot prompt received project guardrails from DB');
});

test('6. Stale Understanding Invalidation: Editing guardrails after Director Mode approval blocks stale approval with 409', async () => {
  const projId = `proj_gr_stale_${Date.now()}`;
  const brief = 'Promote monsoon umbrella sale with waterproof warranty.';
  await db.saveProject(
    {
      id: projId,
      businessName: 'Monsoon Gear',
      businessType: 'Retail Store',
      brief,
      creativeGuardrails: {
        dos: [{ id: 'd_orig', text: 'Mention 1-year warranty', priority: 'critical' }],
        donts: [],
      },
    },
    userAId
  );

  // Generate & explicitly approve AI Understanding v1
  process.env.MOCK_SPINE = 'true';
  const undRes = await api('POST', '/api/creative/ai-understanding', { businessName: 'Monsoon Gear', brief, projectId: projId });
  delete process.env.MOCK_SPINE;
  assert.strictEqual(undRes.status, 200);

  await api('PUT', `/api/creative/ai-understanding/${projId}`, {
    understanding: undRes.body.understanding,
    approvalStatus: 'approved',
  });

  // Now user edits Creative Guardrails via PUT /api/projects/:id/guardrails
  const updGr = await api('PUT', `/api/projects/${projId}/guardrails`, {
    dos: [{ id: 'd_orig', text: 'Mention 2-year replacement warranty', priority: 'critical' }],
    donts: [{ id: 'n_new', text: 'Do not say waterproof', priority: 'critical' }],
  });
  assert.strictEqual(updGr.status, 200);
  assert.strictEqual(updGr.body.creativeGuardrails.version, 2);
  assert.strictEqual(updGr.body.aiUnderstanding.approval_status, 'outdated', 'Prior approval immediately marked outdated when guardrails edited');

  // Stale approval MUST be rejected at Directions & Script stages
  const staleDir = await api('POST', '/api/creative/directions', {
    businessName: 'Monsoon Gear',
    businessType: 'Retail Store',
    brief,
    projectId: projId,
    aiUnderstanding: { ...undRes.body.understanding, approval_status: 'approved' }, // spoofed client approval!
  });
  assert.strictEqual(staleDir.status, 409);
  assert.strictEqual(staleDir.body.code, 'UNDERSTANDING_OUTDATED');

  const staleSyn = await api('POST', '/api/creative/synthesize-script', {
    form: { businessName: 'Monsoon Gear', businessType: 'Retail Store', brief },
    projectId: projId,
  });
  assert.strictEqual(staleSyn.status, 409);
  assert.strictEqual(staleSyn.body.code, 'UNDERSTANDING_OUTDATED');
});

test('7. Simple Mode: Silent processing & silent refresh when guardrails change', async () => {
  const projId = `proj_gr_simple_${Date.now()}`;
  const brief = '50% off festive sweets hamper box.';
  await db.saveProject({ id: projId, businessName: 'Mithas Sweets', businessType: 'Sweets Shop', brief }, userAId);

  process.env.MOCK_SPINE = 'true';
  anthropicQueue.push(J({
    packages: [1, 2, 3].map((i) => ({
      id: `pkg_${i}`,
      title: `Package ${i}`,
      angle: 'Offer',
      hookHeadline: 'Celebrate with pure desi ghee hampers!',
      narrativeSummary: 'Festive sweet boxes.',
      callToAction: 'Order today',
      setting: 'Bright sweet shop',
      scenes: [1, 2, 3, 4].map((s) => ({
        sceneNumber: s,
        beat: 'Beat',
        timing: '0-5s',
        visual: 'Freshly packed festive box in sunlit display case.',
        dialogue: 'Lead: "Enjoy pure desi ghee hampers!"',
      })),
    })),
  }));

  const res1 = await api('POST', '/api/creative/simple-packages', {
    businessName: 'Mithas Sweets',
    businessType: 'Sweets Shop',
    brief,
    projectId: projId,
    creativeGuardrails: {
      dos: [{ id: 'do_ghee', text: 'Mention pure desi ghee', priority: 'critical' }],
      donts: [{ id: 'dont_sugar', text: 'Do not mention sugar-free', priority: 'critical' }],
    },
  });
  assert.strictEqual(res1.status, 200);
  assert.strictEqual(res1.body.aiUnderstanding.approval_status, 'auto_approved');
  assert.strictEqual(res1.body.creativeGuardrails.version, 1);

  // User edits guardrails in Simple Mode -> backend silently regenerates AI Understanding (no approval checkpoint!)
  anthropicQueue.push(J({
    packages: [1, 2, 3].map((i) => ({
      id: `pkg_v2_${i}`,
      title: `Package ${i}`,
      angle: 'Offer',
      hookHeadline: 'Handcrafted dry fruit & pure desi ghee box!',
      narrativeSummary: 'Dry fruit hampers.',
      callToAction: 'Visit today',
      setting: 'Bright sweet shop',
      scenes: [1, 2, 3, 4].map((s) => ({
        sceneNumber: s,
        beat: 'Beat',
        timing: '0-5s',
        visual: 'Dry fruit festive box.',
        dialogue: 'Lead: "Fresh roasted dry fruits and pure desi ghee!"',
      })),
    })),
  }));

  const res2 = await api('POST', '/api/creative/simple-packages', {
    businessName: 'Mithas Sweets',
    businessType: 'Sweets Shop',
    brief,
    projectId: projId,
    aiUnderstanding: res1.body.aiUnderstanding, // old version passed by client
    creativeGuardrails: {
      dos: [
        { id: 'do_ghee', text: 'Mention pure desi ghee', priority: 'critical' },
        { id: 'do_nuts', text: 'Mention roasted dry fruits', priority: 'critical' },
      ],
      donts: [{ id: 'dont_sugar', text: 'Do not mention sugar-free', priority: 'critical' }],
    },
  });
  delete process.env.MOCK_SPINE;
  assert.strictEqual(res2.status, 200);
  assert.strictEqual(res2.body.creativeGuardrails.version, 2);
  assert.strictEqual(res2.body.aiUnderstanding.source_guardrails_version, 2);
  assert.strictEqual(res2.body.aiUnderstanding.approval_status, 'auto_approved');
  assert.ok(res2.body.aiUnderstanding.creative_guardrails.dos.some((d) => d.includes('dry fruits')));
});

test('8. Enforcement & Validation: Critical violations block /api/run & trigger Gate, Preferences stay non-blocking, Visual checks require human review', async () => {
  const g = {
    dos: [
      { id: 'do_cta', text: 'Mention FLAT30 code', priority: 'critical' },
      { id: 'do_vis', text: 'Show sunlit counter visual close-up', priority: 'critical' },
      { id: 'do_pref', text: 'Use cheerful morning chime', priority: 'preference' },
    ],
    donts: [
      { id: 'dont_rival', text: 'Do not mention MegaMart', priority: 'critical' },
      { id: 'dont_vis', text: 'Avoid dark neon backgrounds', priority: 'critical' },
      { id: 'dont_pref', text: 'Avoid using slang like buddy', priority: 'preference' },
    ],
    version: 1,
  };

  // Case A: Critical violation (prohibited competitor "MegaMart" appears & mandatory "FLAT30" missing)
  const badReport = guardrails.validateOutputAgainstGuardrails({
    outputText: 'Hey buddy, MegaMart has higher prices than our store!',
    visualPromptText: 'Interior shop scene',
    stage: 'script',
    guardrails: g,
  });
  assert.strictEqual(badReport.hasCriticalViolation, true);
  assert.strictEqual(badReport.automatedChecks.passed, false);
  assert.ok(badReport.automatedChecks.criticalViolations.some((v) => v.type === 'prohibited_content_detected'));
  assert.ok(badReport.automatedChecks.criticalViolations.some((v) => v.type === 'missing_mandatory_do'));
  assert.ok(badReport.visualReviewRequired.length >= 2, 'Distinguishes visual restrictions requiring human review');

  // Case B: Preference-only deviation does NOT critically block
  const prefReport = guardrails.validateOutputAgainstGuardrails({
    outputText: 'Use code FLAT30 today at our sunlit counter visual close-up!',
    visualPromptText: 'Sunlit counter visual close-up',
    stage: 'script',
    guardrails: {
      dos: [
        { id: 'do_cta', text: 'Mention FLAT30', priority: 'critical' },
        { id: 'do_pref', text: 'Mention weekend gift wrap bonus', priority: 'preference' },
      ],
      donts: [{ id: 'dont_pref', text: 'Avoid word buddy', priority: 'preference' }],
      version: 1,
    },
  });
  assert.strictEqual(prefReport.hasCriticalViolation, false, 'Non-critical preferences must not hard-block output');
  assert.strictEqual(prefReport.overallStatus, 'compliant_with_warnings');
  assert.ok(prefReport.automatedChecks.warnings.length >= 1);

  // Case C: /api/run rejects scenes violating critical Don't with 422 GUARDRAIL_VIOLATION
  const blockedRun = await api('POST', '/api/run', {
    businessName: 'My Store',
    businessType: 'Retail',
    scenes: ['Visual: Same setting: Shop floor. Audio: "Better than MegaMart!"'],
    creativeGuardrails: {
      dos: [],
      donts: [{ id: 'n_mega', text: 'Do not mention MegaMart', priority: 'critical' }],
      version: 1,
    },
  });
  assert.strictEqual(blockedRun.status, 422);
  assert.strictEqual(blockedRun.body.code, 'GUARDRAIL_VIOLATION');

  // Case D: runGate rejects script containing prohibited critical Don't
  const parsed = parseOutput(GOOD_SCRIPT.replace('Sunita: "अरे, व्रत का साबूदाना ख़त्म!"', 'Sunita: "MegaMart से नहीं लेना!"'));
  const gateFails = runGate(parsed, { businessName: 'Ramesh Kirana', language: 'Hindi' }, {
    approvedFormat: 'Storytelling',
    festival: 'Sharad Navratri',
    creativeGuardrails: {
      dos: [],
      donts: [{ id: 'n_mega', text: 'Do not mention MegaMart', priority: 'critical' }],
      version: 1,
    },
  });
  assert.ok(gateFails.some((f) => f.includes('Creative Guardrail violation')), 'Quality Gate flags prohibited guardrail content');

  // Case E: compileShotPrompt includes Creative Guardrails in visual prompt
  const compiled = compileShotPrompt(
    { shotNumber: 1, beat: 'HOOK', framing: 'Medium shot', primaryAction: 'Open gift box', fullVisual: 'Open gift box', cameraMovement: 'Slow push-in', dialogue: 'None' },
    { setting: 'Jewelry boutique', characters: 'Host & Buyer', creativeGuardrails: g },
    { creativeGuardrails: g }
  );
  assert.ok(compiled.includes('CREATIVE GUARDRAILS'));
  assert.ok(compiled.includes('Avoid dark neon backgrounds'));
});

test('9. UI Boundaries & Experience Wiring Check', () => {
  const guidedSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  const simpleSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/SimpleBusinessStudio.jsx'), 'utf8');
  const sectionSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/CreativeInstructionsSection.jsx'), 'utf8');
  const understandingSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ScreenUnderstanding.jsx'), 'utf8');

  // Collapsed by default, visually secondary section in both Brief modes
  assert.ok(sectionSrc.includes('useState(Boolean(defaultExpanded))'), 'Collapsible defaults cleanly to false');
  assert.ok(sectionSrc.includes("A. Must Follow (Do's)"), 'Contains Must Follow section');
  assert.ok(sectionSrc.includes("B. Must Avoid (Don'ts)"), 'Contains Must Avoid section');
  assert.ok(guidedSrc.includes('<CreativeInstructionsSection'), 'Guided Brief integrates CreativeInstructionsSection');
  assert.ok(simpleSrc.includes('<CreativeInstructionsSection'), 'Simple Brief integrates CreativeInstructionsSection');

  // Must NOT create separate approval screen or stage in Simple Mode
  assert.ok(!simpleSrc.includes('ScreenUnderstanding'), 'Simple Mode introduces no extra approval screen');

  // Understanding Screen shows user original instructions + conflict/claim flags cleanly
  assert.ok(understandingSrc.includes('Original Brief Instructions'), 'Understanding Screen separates user original instructions');
  assert.ok(understandingSrc.includes('Conflicting Instructions'), 'Understanding Screen surfaces guardrail conflicts');
  assert.ok(understandingSrc.includes('Unverified Claim Flagged'), 'Understanding Screen surfaces unsupported claims');
});

test('10. UX Corrections: Capture-Only Brief Guardrails, Calm Empty State & 3-State Understanding Display', async () => {
  const { generateAiUnderstanding, createEmptyUnderstanding } = require('../engine/understandingSpine');
  const understandingSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ScreenUnderstanding.jsx'), 'utf8');
  const sectionSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/CreativeInstructionsSection.jsx'), 'utf8');
  const simpleSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/SimpleBusinessStudio.jsx'), 'utf8');
  const guidedSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');

  // Brief inputs must start empty by default with placeholders only (no pre-populated entries)
  assert.ok(sectionSrc.includes('placeholder={placeholder}'), 'Brief guardrails use placeholders instead of pre-populated user entries');
  assert.strictEqual(createEmptyUnderstanding().has_user_guardrails, false);

  // Spine reports has_user_guardrails = false when brief has no instructions
  const prevKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const emptyRes = await generateAiUnderstanding({
      businessName: 'Pure Silk Emporium',
      businessType: 'Retail',
      brief: 'Promote wedding saree collection',
      creativeGuardrails: { dos: [], donts: [], version: 0 },
    });
    assert.strictEqual(emptyRes.has_user_guardrails, false);

    const activeRes = await generateAiUnderstanding({
      businessName: 'Pure Silk Emporium',
      businessType: 'Retail',
      brief: 'Promote wedding saree collection',
      creativeGuardrails: { dos: ['Show zari weaving close-ups'], donts: ['Never use dark lighting'], version: 1 },
    });
    assert.strictEqual(activeRes.has_user_guardrails, true);
  } finally {
    process.env.ANTHROPIC_API_KEY = prevKey;
  }

  // AI Understanding page communicates 3 distinct states + calm empty state + no duplicate Do/Don't editor
  assert.ok(understandingSrc.includes('Creative Instructions Understanding'));
  assert.ok(
    understandingSrc.includes('No specific creative instructions provided. CleverCut will use your brief and brand context to guide creative development.')
  );
  assert.ok(understandingSrc.includes('Not user-entered'), 'AI-derived fallback guidelines never pose as user entries');
  assert.ok(understandingSrc.includes('1. User-Provided Instructions'));
  assert.ok(understandingSrc.includes('2. AI Interpretation'));
  assert.ok(understandingSrc.includes('3. Conflicts or Clarification Needed'));
  assert.ok(understandingSrc.includes('Modify in Brief'));
  assert.ok(!understandingSrc.includes('Mandatory Elements / Dos'), 'No repeated guardrail editor on AI Understanding page');
  assert.ok(!understandingSrc.includes('Save Guardrails'), 'Users cannot re-enter guardrails on AI Understanding page');

  // Simple Mode Step 1 collects guardrails once; subsequent Step 2/3 do not ask again
  const simpleMatches = simpleSrc.match(/<CreativeInstructionsSection/g) || [];
  assert.strictEqual(simpleMatches.length, 1, 'Simple Mode collects Creative Instructions only once in Brief step');
  // Director Mode Brief Screen02 collects guardrails once in active flow
  const guidedMatches = guidedSrc.match(/<CreativeInstructionsSection/g) || [];
  assert.ok(guidedMatches.length >= 1, 'Director Brief renders CreativeInstructionsSection');
});

test('11. UX Corrections: Discoverable Own Idea Card & Architectural AI Extension Preservation', () => {
  const { resolveIdeaSelection } = require('../src/context/studioReducer');
  const guidedSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');

  // Change 2: Full-width secondary card in Screen04Idea
  assert.ok(guidedSrc.includes('data-testid="own-idea-card"'));
  assert.ok(guidedSrc.includes('Have your own creative idea?'));
  assert.ok(guidedSrc.includes('Start with your own concept, story or creative direction. Let CleverCut help you develop it into an ad.'));
  assert.ok(guidedSrc.includes('Start with my idea'));
  assert.ok(!guidedSrc.includes('+ I have my own idea'));

  // Change 3: Architectural distinction across AI, Custom, and AI-Extended paths
  const aiDir = { id: 'dir_1', title: 'Warm Morning Routine' };

  const pathAi = resolveIdeaSelection(aiDir, '');
  assert.strictEqual(pathAi.ideaSource, 'ai');
  assert.deepStrictEqual(pathAi.selectedAiDirection, aiDir);
  assert.strictEqual(pathAi.customDirection, '');
  assert.strictEqual(pathAi.direction.source, 'ai');

  const pathCustom = resolveIdeaSelection(null, 'Customer rushing for last-minute birthday cake');
  assert.strictEqual(pathCustom.ideaSource, 'custom');
  assert.strictEqual(pathCustom.selectedAiDirection, null);
  assert.strictEqual(pathCustom.customDirection, 'Customer rushing for last-minute birthday cake');
  assert.strictEqual(pathCustom.direction.isCustom, true);
  assert.strictEqual(pathCustom.direction.source, 'custom');

  const pathExtended = resolveIdeaSelection(aiDir, 'Include grandmother blessing at the doorstep');
  assert.strictEqual(pathExtended.ideaSource, 'ai_extended');
  assert.deepStrictEqual(pathExtended.selectedAiDirection, aiDir);
  assert.strictEqual(pathExtended.customDirection, 'Include grandmother blessing at the doorstep');
  assert.strictEqual(pathExtended.direction.userExtension, 'Include grandmother blessing at the doorstep');
  assert.strictEqual(pathExtended.direction.source, 'ai_extended');

  assert.ok(appSrc.includes('resolveIdeaSelection('), 'App.jsx preserves ideaSource and separate AI vs custom direction state');
  assert.ok(appSrc.includes('customDirection: customDirection || \'\''), 'App.jsx persists customDirection in project stages');
});

test('12. Backend Settings Stale Enforcement: /api/creative/directions blocks changed settings & Simple Mode refreshes seamlessly', async () => {
  const projId = `proj_sett_stale_${Date.now()}`;
  const brief = 'Promote festive organic honey gift packs.';
  await db.saveProject(
    {
      id: projId,
      businessName: 'Himalayan Hive',
      businessType: 'Specialty Food',
      brief,
      language: 'Hindi',
      creativeStyle: 'Storytelling',
    },
    userAId
  );

  // 1. Generate Understanding with explicit Settings -> status pending
  process.env.MOCK_SPINE = 'true';
  const undRes = await api('POST', '/api/creative/ai-understanding', {
    businessName: 'Himalayan Hive',
    businessType: 'Specialty Food',
    brief,
    language: 'Hindi',
    creativeStyle: 'Storytelling',
    dimension: '16:9',
    duration: '30s',
    hasLogo: true,
    projectId: projId,
  });
  delete process.env.MOCK_SPINE;
  assert.strictEqual(undRes.status, 200);
  assert.strictEqual(undRes.body.understanding.source_settings.dimension, '16:9');
  assert.strictEqual(undRes.body.understanding.source_settings.duration, '30s');
  assert.strictEqual(undRes.body.understanding.source_settings.hasLogo, true);

  // Unapproved understanding cannot generate creative directions (cannot bypass in Director Mode)
  const unapprovedDir = await api('POST', '/api/creative/directions', {
    businessName: 'Himalayan Hive',
    businessType: 'Specialty Food',
    brief,
    language: 'Hindi',
    creativeStyle: 'Storytelling',
    dimension: '16:9',
    duration: '30s',
    hasLogo: true,
    projectId: projId,
  });
  assert.strictEqual(unapprovedDir.status, 409);
  assert.strictEqual(unapprovedDir.body.code, 'UNDERSTANDING_NOT_APPROVED');

  // Approve Understanding v1
  const putRes = await api('PUT', `/api/creative/ai-understanding/${projId}`, {
    understanding: undRes.body.understanding,
    approvalStatus: 'approved',
  });
  assert.strictEqual(putRes.status, 200);

  // Editing Settings (e.g. dimension 16:9 -> 9:16, duration 30s -> 15s) MUST trigger 409 UNDERSTANDING_OUTDATED
  const staleSettingsDir = await api('POST', '/api/creative/directions', {
    businessName: 'Himalayan Hive',
    businessType: 'Specialty Food',
    brief,
    language: 'Hindi',
    creativeStyle: 'Storytelling',
    dimension: '9:16',
    duration: '15s',
    hasLogo: true,
    projectId: projId,
    aiUnderstanding: { ...undRes.body.understanding, approval_status: 'approved' }, // spoofed!
  });
  assert.strictEqual(staleSettingsDir.status, 409);
  assert.strictEqual(staleSettingsDir.body.code, 'UNDERSTANDING_OUTDATED');

  // Simple Mode silently processes Settings updates with auto_approved (no user checkpoint)
  const simpleProjId = `proj_sett_simple_${Date.now()}`;
  await db.saveProject({ id: simpleProjId, businessName: 'Himalayan Hive', businessType: 'Specialty Food', brief }, userAId);
  process.env.MOCK_SPINE = 'true';
  anthropicQueue.push(J({
    packages: [1, 2, 3].map((i) => ({
      id: `pkg_${i}`,
      title: `Package ${i}`,
      angle: 'Offer',
      hookHeadline: 'Pure forest honey in a festive jar!',
      narrativeSummary: 'Gift pure honey.',
      callToAction: 'Order today',
      setting: 'Warm kitchen',
      scenes: [1, 2, 3, 4].map((s) => ({
        sceneNumber: s,
        beat: 'Beat',
        timing: '0-5s',
        visual: 'Sunlit honey jar poured over warm toast.',
        dialogue: 'Lead: "Taste the forest pure!"',
      })),
    })),
  }));
  const simpleRes = await api('POST', '/api/creative/simple-packages', {
    businessName: 'Himalayan Hive',
    businessType: 'Specialty Food',
    brief,
    language: 'English',
    creativeStyle: 'UGC / Creator-style',
    dimension: '9:16',
    duration: '15s',
    hasLogo: false,
    projectId: simpleProjId,
  });
  delete process.env.MOCK_SPINE;
  assert.strictEqual(simpleRes.status, 200);
  assert.strictEqual(simpleRes.body.aiUnderstanding.approval_status, 'auto_approved');
  assert.strictEqual(simpleRes.body.aiUnderstanding.source_settings.duration, '15s');
});
