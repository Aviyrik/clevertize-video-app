const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const understandingSpine = require('../engine/understandingSpine');
const db = require('../engine/db');

test('Schema contract: validateUnderstandingSchema verifies all Section 6 & 2 required fields', () => {
  const empty = understandingSpine.createEmptyUnderstanding('Promote 20% off jewellery');
  assert.ok(understandingSpine.validateUnderstandingSchema(empty), 'Empty factory conforms to schema');

  const valid = {
    business_understanding: 'Premium jewellery store in Bangalore specializing in hallmark gold.',
    campaign_objective: 'Drive festive showroom footfall for Akshaya Tritiya.',
    target_audience: 'Families and brides looking for certified hallmark jewellery.',
    core_communication: 'Transparent making charges and zero-loss gold exchange.',
    occasion_context: 'Akshaya Tritiya festival shopping window.',
    creative_guardrails: {
      dos: ['Feature 916 BIS Hallmark purity stamp', 'Include location in Bangalore'],
      donts: ['Do not use terms like medical or consultation', 'Avoid generic discounts'],
    },
    creative_opportunity: 'Father-daughter emotional heirloom gifting moment.',
    assumptions: ['Assumed showroom has physical presence in Bangalore'],
    missing_information: ['Exact promotional end date not specified'],
  };
  assert.ok(understandingSpine.validateUnderstandingSchema(valid), 'Complete object passes validation');

  assert.strictEqual(
    understandingSpine.validateUnderstandingSchema({ ...valid, creative_guardrails: null }),
    false,
    'Fails when creative_guardrails is missing'
  );
  assert.strictEqual(
    understandingSpine.validateUnderstandingSchema({ ...valid, business_understanding: 123 }),
    false,
    'Fails when field types do not match'
  );
});

test('Spine Execution: generateAiUnderstanding produces structured, clearly-labelled output', async () => {
  const result = await understandingSpine.generateAiUnderstanding({
    businessName: 'Kalyan Jewellers',
    businessType: 'Jewellery Store',
    town: 'Bangalore',
    brief: 'Special flat 25% off on making charges for wedding collection this weekend only.',
    language: 'English',
    brandTone: 'Warm & Authentic',
    occasion: 'Wedding Season',
  });

  assert.ok(result, 'Returns a valid understanding result');
  assert.ok(understandingSpine.validateUnderstandingSchema(result), 'Result matches schema contract');
  assert.ok(result.business_understanding.length > 0, 'Populates business_understanding');
  assert.ok(result.campaign_objective.length > 0, 'Populates campaign_objective');
  assert.ok(result.target_audience.length > 0, 'Populates target_audience');
  assert.ok(result.core_communication.length > 0, 'Populates core_communication');
  assert.ok(result.creative_guardrails.dos.length > 0, 'Populates guardrail dos');
  assert.ok(result.creative_guardrails.donts.length > 0, 'Populates guardrail donts');
  assert.ok(result.creative_opportunity.length > 0, 'Populates creative_opportunity');
  assert.ok(Array.isArray(result.assumptions), 'Populates assumptions array');
  assert.ok(Array.isArray(result.missing_information), 'Populates missing_information array');
  assert.strictEqual(result.approval_status, 'pending', 'Defaults to pending approval status');
  assert.ok(result.source_brief_hash, 'Records source brief hash for change tracking');
});

test('Outdated state detection: isUnderstandingOutdated detects when original brief has been modified', () => {
  const briefA = '20% off on all items this Saturday';
  const und = understandingSpine.createEmptyUnderstanding(briefA);
  assert.strictEqual(understandingSpine.isUnderstandingOutdated(und, briefA), false, 'Matches current brief');

  const briefB = '50% off on premium collection next month';
  assert.strictEqual(understandingSpine.isUnderstandingOutdated(und, briefB), true, 'Detects modified brief as outdated');
});

test('Database persistence: saveProject & mapProjectRow preserve and restore aiUnderstanding with user isolation', async () => {
  const testUserId = `test_user_${Date.now()}`;
  const testProjectId = `proj_test_understanding_${Date.now()}`;

  const understandingData = {
    business_understanding: 'Artisan coffee roastery and cafe.',
    campaign_objective: 'Promote freshly roasted seasonal cold brew.',
    target_audience: 'Coffee enthusiasts and urban professionals.',
    core_communication: 'Single origin beans roasted fresh daily.',
    occasion_context: 'Summer heatwave special.',
    creative_guardrails: {
      dos: ['Show the roasting process', 'State origin'],
      donts: ['Do not use artificial syrups'],
    },
    creative_opportunity: 'Barista craft sensory sound design.',
    assumptions: ['Assumed cafe offers cold brew on tap'],
    missing_information: ['Delivery availability not stated'],
    approval_status: 'approved',
    approved_at: new Date().toISOString(),
  };

  const projectPayload = {
    id: testProjectId,
    title: 'Cold Brew Campaign',
    businessName: 'Third Wave Roasters',
    businessType: 'Cafe',
    town: 'Indiranagar',
    brief: 'Fresh cold brew promotion',
    aiUnderstanding: understandingData,
  };

  const saved = await db.saveProject(projectPayload, testUserId);
  assert.ok(saved, 'Project saved successfully');
  assert.ok(saved.aiUnderstanding, 'Saved project has aiUnderstanding property');
  assert.strictEqual(saved.aiUnderstanding.business_understanding, 'Artisan coffee roastery and cafe.');
  assert.strictEqual(saved.aiUnderstanding.approval_status, 'approved');

  // Verify retrieval
  const retrieved = await db.getProjectById(testProjectId, testUserId);
  assert.ok(retrieved, 'Retrieved project');
  assert.ok(retrieved.aiUnderstanding, 'Retrieved project includes aiUnderstanding');
  assert.strictEqual(retrieved.aiUnderstanding.campaign_objective, 'Promote freshly roasted seasonal cold brew.');
  assert.strictEqual(retrieved.aiUnderstanding.creative_guardrails.dos[0], 'Show the roasting process');

  // Verify user isolation: another user cannot access this project
  const otherUser = `other_user_${Date.now()}`;
  const isolated = await db.getProjectById(testProjectId, otherUser);
  assert.strictEqual(isolated, null, 'User isolation prevents unauthorized retrieval');
});

test('Director Mode: App.jsx and GuidedStudio.jsx UI wiring & checkpoint integration', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  const understandingScreenSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ScreenUnderstanding.jsx'), 'utf8');

  // 1. ScreenUnderstanding component renders all 8 sections defined in Section 2
  assert.ok(understandingScreenSrc.includes('A. Business Understanding'), 'Renders Section A');
  assert.ok(understandingScreenSrc.includes('B. Campaign Objective'), 'Renders Section B');
  assert.ok(understandingScreenSrc.includes('C. Target Audience'), 'Renders Section C');
  assert.ok(understandingScreenSrc.includes('D. Core Communication'), 'Renders Section D');
  assert.ok(understandingScreenSrc.includes('E. Occasion & Context'), 'Renders Section E');
  assert.ok(understandingScreenSrc.includes('F. Creative Guardrails'), 'Renders Section F');
  assert.ok(understandingScreenSrc.includes('G. Creative Opportunity'), 'Renders Section G');
  assert.ok(understandingScreenSrc.includes('H. Assumptions & Missing Information'), 'Renders Section H');

  // 2. Clear distinction of assumptions vs verified facts
  assert.ok(understandingScreenSrc.includes('INFERRED ASSUMPTIONS'), 'Visually distinguishes inferred assumptions');
  assert.ok(understandingScreenSrc.includes('MISSING INFORMATION'), 'Clearly lists missing information');

  // 3. Edit individual sections and regenerate controls
  assert.ok(understandingScreenSrc.includes('handleSaveSection'), 'Supports editing individual sections');
  assert.ok(understandingScreenSrc.includes('Regenerate AI Understanding'), 'Supports regeneration with guidance');
  assert.ok(understandingScreenSrc.includes('Back to Brief') || understandingScreenSrc.includes('onBackToBrief'), 'Allows returning to original brief');
  assert.ok(understandingScreenSrc.includes('Approve & Continue to Ideas') || understandingScreenSrc.includes('onApproveAndContinue'), 'Has explicit Approve & Continue CTA');

  // 4. App.jsx wires intermediate stage
  assert.ok(appSrc.includes("studioStage === 'understanding'"), 'App.jsx renders understanding stage');
  assert.ok(appSrc.includes('handleGenerateAiUnderstanding'), 'App.jsx defines brief understanding generator');
  assert.ok(appSrc.includes('handleApproveUnderstanding'), 'App.jsx defines explicit approval handler');

  // 5. Only approved understanding passed to creative directions
  assert.ok(appSrc.includes("aiUnderstanding: aiUnderstanding && aiUnderstanding.approval_status === 'approved' ? aiUnderstanding : null"),
    'Only the approved interpretation is passed to Creative Idea Generation');
});

test('Simple Mode: Backend-only execution in SimpleBusinessStudio and /api/creative/simple-packages', () => {
  const simpleStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/SimpleBusinessStudio.jsx'), 'utf8');
  const serverSrc = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

  // 1. SimpleBusinessStudio does NOT render the AI Understanding screen or approval modal
  assert.ok(!simpleStudioSrc.includes('ScreenUnderstanding'), 'Simple Mode must not import or display ScreenUnderstanding');
  assert.ok(!simpleStudioSrc.includes('Approve & Continue to Ideas'), 'Simple Mode must not show the approval step');

  // 2. Server automatically executes AI understanding internally in /api/creative/simple-packages
  assert.ok(serverSrc.includes('// Simple Mode: AI Understanding executes internally on the backend'),
    'Server must internally invoke AI Understanding for Simple Mode');
  assert.ok(serverSrc.includes('internalUnderstanding.approval_status = "auto_approved"'),
    'Server marks internal understanding with distinct auto_approved status for Simple Mode');
  assert.ok(serverSrc.includes('aiUnderstanding: internalUnderstanding'),
    'Server passes structured understanding to generateSimpleAdPackages');
});

test('Review Point 1: Spine ownership and placeholder prompt isolation', () => {
  assert.ok(understandingSpine.TEMPORARY_SPINE_SYSTEM_PROMPT, 'Exposes temporary spine system prompt for swappability');
  assert.ok(understandingSpine.TEMPORARY_SPINE_SYSTEM_PROMPT.includes('You are the CleverCut AI Understanding Spine'),
    'Contains creative strategy prompt instructions');
});

test('Review Point 2: Production mock fallback guard prevents silent mock data in production', async () => {
  const originalEnv = process.env.NODE_ENV;
  const originalKey = process.env.ANTHROPIC_API_KEY;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.ANTHROPIC_API_KEY;

    await assert.rejects(
      async () => {
        await understandingSpine.generateAiUnderstanding({
          businessName: 'Prod Test',
          brief: 'Promote 50% discount in production without API key',
        });
      },
      /AI Understanding service unavailable in production/i,
      'Must throw error in production when API key is missing, never returning silent mock data'
    );
  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
  }
});

test('Review Point 3: Backend enforces saved approval status & project ownership in /api/creative/directions', () => {
  const serverSrc = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

  // Backend must verify project ownership in DB
  assert.ok(serverSrc.includes('const project = await db.getProjectById(projectId, req.user.id)'),
    'Backend must fetch project using authenticated user ID');
  assert.ok(serverSrc.includes('Project not found or not owned by authenticated user'),
    'Backend must reject projects not owned by authenticated user');
  // Backend must check saved approval_status from DB record
  assert.ok(serverSrc.includes('saved.approval_status === "approved" || saved.approval_status === "auto_approved"'),
    'Backend must check saved approval status from DB record');
  // Backend must check for outdated state
  assert.ok(serverSrc.includes('understandingSpine.isUnderstandingOutdated(saved, currentBrief)'),
    'Backend must verify saved understanding is not outdated before passing downstream');
});

test('Review Point 4: Simple Mode uses distinct auto_approved internal status', () => {
  assert.ok(understandingSpine.VALID_APPROVAL_STATUSES.includes('auto_approved'),
    'VALID_APPROVAL_STATUSES includes auto_approved');
  assert.ok(understandingSpine.VALID_APPROVAL_STATUSES.includes('approved'),
    'VALID_APPROVAL_STATUSES includes approved');

  const serverSrc = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  assert.ok(serverSrc.includes('internalUnderstanding.approval_status = "auto_approved"'),
    'Server sets auto_approved for Simple Mode');
});

test('Workflow Reorder: Progress indicator shows 01 Brief -> 02 Settings -> 03 Understanding -> 04 Ideas -> 05 Opening -> 06 Script -> 07 Video', () => {
  const { STAGE_ORDER, STAGE_NUMBER_MAP } = require('../src/context/studioReducer.js');
  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  const understandingSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ScreenUnderstanding.jsx'), 'utf8');

  assert.ok(guidedStudioSrc.includes("{ id: 'brief', num: '01', label: 'Brief' }"));
  assert.ok(guidedStudioSrc.includes("{ id: 'settings', num: '02', label: 'Settings' }"));
  assert.ok(guidedStudioSrc.includes("{ id: 'understanding', num: '03', label: 'Understanding' }"));
  assert.ok(guidedStudioSrc.includes("{ id: 'idea', num: '04', label: 'Ideas' }"));
  assert.ok(guidedStudioSrc.includes("{ id: 'opening', num: '05', label: 'Opening' }"));
  assert.ok(guidedStudioSrc.includes("{ id: 'script', num: '06', label: 'Script' }"));
  assert.ok(guidedStudioSrc.includes("{ id: 'video', num: '07', label: 'Video' }"));
  assert.deepStrictEqual(STAGE_ORDER, ['brief', 'settings', 'understanding', 'idea', 'opening', 'script', 'video']);
  assert.strictEqual(STAGE_NUMBER_MAP.brief, 1);
  assert.strictEqual(STAGE_NUMBER_MAP.settings, 2);
  assert.strictEqual(STAGE_NUMBER_MAP.understanding, 3);
  assert.strictEqual(STAGE_NUMBER_MAP.idea, 4);

  // Brief -> Settings (does NOT invoke AI Understanding directly), Settings -> Understanding, Understanding -> Idea
  assert.ok(appSrc.includes("markStageComplete('brief');\n              setStudioStage('settings');"));
  assert.ok(appSrc.includes("markStageComplete('understanding');\n      scheduleDraftSave(true);\n      setStudioStage('idea');"));

  // Back navigation from every stage + Edit Settings shortcut on ScreenUnderstanding
  assert.ok(appSrc.includes("else if (studioStage === 'idea') setStudioStage('understanding');"));
  assert.ok(appSrc.includes("else if (studioStage === 'understanding') setStudioStage('settings');"));
  assert.ok(appSrc.includes("else if (studioStage === 'settings') setStudioStage('brief');"));
  assert.ok(understandingSrc.includes('Edit Settings'));
  assert.ok(understandingSrc.includes('Edit Original Brief'));
  assert.ok(understandingSrc.includes('Back to Settings'));
  assert.ok(understandingSrc.includes('VERIFIED USER INPUTS (CONFIRMED)'));
});

test('Workflow Reorder: Settings included in AI Understanding, Section H avoids false missing items, and settings change invalidates approval', async () => {
  const result = await understandingSpine.generateAiUnderstanding({
    businessName: 'Pure Silk Emporium',
    businessType: 'Boutique',
    town: 'Jaipur',
    brief: 'Flat 20% off wedding sarees this weekend',
    language: 'Hindi',
    creativeStyle: 'Storytelling',
    dimension: '16:9',
    duration: '30s',
    hasLogo: true,
    creativeGuardrails: {
      dos: ['Show zari weaving border'],
      donts: ['Avoid dark lighting'],
      version: 1,
    },
  });

  // Settings are captured and hashed alongside brief and guardrails
  assert.strictEqual(result.source_settings.language, 'Hindi');
  assert.strictEqual(result.source_settings.creativeStyle, 'Storytelling');
  assert.strictEqual(result.source_settings.dimension, '16:9');
  assert.strictEqual(result.source_settings.duration, '30s');
  assert.strictEqual(result.source_settings.hasLogo, true);
  assert.ok(result.source_settings_hash);

  // Verified facts are separated from assumptions
  assert.ok(Array.isArray(result.verified_facts) && result.verified_facts.length >= 3);
  assert.ok(result.verified_facts.some((f) => f.includes('Hindi') && f.includes('30s') && f.includes('16:9')));

  // Sanitizer removes false-positive missing info already supplied in Settings/Profile
  const sanitized = understandingSpine.sanitizeMissingInformation(
    [
      'Video language not selected',
      'Aspect ratio or dimensions missing',
      'Video duration unknown',
      'Brand logo availability unspecified',
      'Exact showroom street landmark — matters for viewers visiting in person',
    ],
    {
      businessName: 'Pure Silk Emporium',
      town: 'Jaipur',
      settings: result.source_settings,
      cleanBrief: 'Flat 20% off wedding sarees this weekend',
    }
  );
  assert.deepStrictEqual(sanitized, ['Exact showroom street landmark — matters for viewers visiting in person']);

  // Outdated detection triggers when any production setting changes after approval
  const approved = { ...result, approval_status: 'approved' };
  assert.strictEqual(
    understandingSpine.isUnderstandingOutdated(approved, 'Flat 20% off wedding sarees this weekend', null, {
      language: 'Hindi',
      creativeStyle: 'Storytelling',
      dimension: '16:9',
      duration: '30s',
      hasLogo: true,
    }),
    false
  );
  assert.strictEqual(
    understandingSpine.isUnderstandingOutdated(approved, 'Flat 20% off wedding sarees this weekend', null, {
      language: 'English',
      creativeStyle: 'Storytelling',
      dimension: '16:9',
      duration: '30s',
      hasLogo: true,
    }),
    true,
    'Changing language must mark understanding outdated'
  );
  assert.strictEqual(
    understandingSpine.isUnderstandingOutdated(approved, 'Flat 20% off wedding sarees this weekend', null, {
      language: 'Hindi',
      creativeStyle: 'Storytelling',
      dimension: '9:16',
      duration: '30s',
      hasLogo: true,
    }),
    true,
    'Changing video dimension must mark understanding outdated'
  );
  assert.strictEqual(
    understandingSpine.isUnderstandingOutdated(approved, 'Flat 20% off wedding sarees this weekend', null, {
      language: 'Hindi',
      creativeStyle: 'Storytelling',
      dimension: '16:9',
      duration: '15s',
      hasLogo: true,
    }),
    true,
    'Changing video duration must mark understanding outdated'
  );

  // Client stale helper detects settings edits too
  const { isUnderstandingOutdatedClient } = require('../src/utils/guardrails.js');
  assert.strictEqual(
    isUnderstandingOutdatedClient(approved, 'Flat 20% off wedding sarees this weekend', { dos: ['Show zari weaving border'], donts: ['Avoid dark lighting'], version: 1 }, {
      language: 'Tamil',
      creativeStyle: 'Storytelling',
      dimension: '16:9',
      duration: '30s',
      hasLogo: true,
    }),
    true
  );

  // DB saveProject & draft restoration preserve understanding stage & productionSettings and invalidate when settings change
  const { buildDraftProject, resumeTargetOf } = require('../src/utils/drafts.js');
  const projId = `proj_reorder_${Date.now()}`;
  const uid = `user_reorder_${Date.now()}`;
  const draftPayload = buildDraftProject({
    id: projId,
    businessName: 'Pure Silk Emporium',
    businessType: 'Boutique',
    town: 'Jaipur',
    studio: 'guided',
    guided: {
      currentStage: 'understanding',
      completedStages: ['brief', 'settings'],
      context: {
        brief: 'Flat 20% off wedding sarees this weekend',
        language: 'Hindi',
        creativeStyle: 'Storytelling',
        dimension: '16:9',
        duration: '30s',
      },
      aiUnderstanding: approved,
    },
  });
  const saved = await db.saveProject(draftPayload, uid);
  assert.strictEqual(saved.currentStage, 'understanding');
  assert.strictEqual(saved.creativeDNA.productionSettings.dimension, '16:9');
  assert.strictEqual(resumeTargetOf(saved).stage, 'understanding');

  // Changing settings during saveProject automatically invalidates prior approval
  const afterSettingsEdit = await db.saveProject(
    {
      ...saved,
      language: 'English',
      productionSettings: {
        language: 'English',
        creativeStyle: 'Storytelling',
        dimension: '16:9',
        duration: '30s',
        hasLogo: false,
      },
    },
    uid
  );
  assert.strictEqual(afterSettingsEdit.aiUnderstanding.approval_status, 'outdated');
});
