const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const onboarding = require('../src/utils/onboarding.js');
const modeTransfer = require('../src/utils/modeTransfer.js');
const { TOUR_STEPS, HELP_TOOLTIPS, CONTEXTUAL_TIPS } = require('../src/data/tourSteps.js');

test('1. Onboarding Schema & Welcome/Business Non-Overlap Gating', () => {
  const fresh = onboarding.createDefaultOnboardingState();
  assert.equal(fresh.welcomeSeen, false);
  assert.equal(fresh.tourCompleted, false);
  assert.equal(fresh.tourSkipped, false);
  assert.deepEqual(fresh.dismissedTips, []);

  // Brand-new user with 0 businesses or active BusinessOnboardingModal must NOT get Welcome modal simultaneously
  assert.equal(
    onboarding.shouldAutoTriggerWelcome(fresh, {
      isAuthenticated: true,
      isAuthChecking: false,
      isOnboardingModalOpen: false,
      businessCount: 0,
    }),
    false,
    'Welcome modal must wait until initial business setup exists'
  );
  assert.equal(
    onboarding.shouldAutoTriggerWelcome(fresh, {
      isAuthenticated: true,
      isAuthChecking: false,
      isOnboardingModalOpen: true,
      businessCount: 1,
    }),
    false,
    'Welcome modal must never overlap BusinessOnboardingModal'
  );

  // Once authenticated with business created and modal closed, brand-new user gets Welcome
  assert.equal(
    onboarding.shouldAutoTriggerWelcome(fresh, {
      isAuthenticated: true,
      isAuthChecking: false,
      isOnboardingModalOpen: false,
      businessCount: 1,
    }),
    true
  );

  // Returning users who skipped or completed the tour are never interrupted again
  const skipped = onboarding.mergeOnboardingState(fresh, { welcomeSeen: true, tourSkipped: true });
  assert.equal(
    onboarding.shouldAutoTriggerWelcome(skipped, {
      isAuthenticated: true,
      isAuthChecking: false,
      businessCount: 1,
    }),
    false
  );

  const completed = onboarding.mergeOnboardingState(fresh, { welcomeSeen: true, tourCompleted: true });
  assert.equal(
    onboarding.shouldAutoTriggerWelcome(completed, {
      isAuthenticated: true,
      isAuthChecking: false,
      businessCount: 1,
    }),
    false
  );
});

test('2. Behavior-Responsive Contextual Tips Gate on Usage & Dismissal', () => {
  const state = onboarding.createDefaultOnboardingState();

  // Brand-new user sees Simple -> Director discovery tip
  assert.equal(onboarding.shouldShowContextualTip('tip_try_director', state, { studioMode: 'simple' }), true);
  // Not shown when already in Director mode
  assert.equal(onboarding.shouldShowContextualTip('tip_try_director', state, { studioMode: 'advanced' }), false);

  // Retires automatically once user switches modes
  const switched = onboarding.recordBehaviorSignal(state, 'modeSwitchCount', 1);
  assert.equal(onboarding.shouldShowContextualTip('tip_try_director', switched, { studioMode: 'simple' }), false);

  // AI Understanding tip shows initially, retires after 2 approvals
  assert.equal(onboarding.shouldShowContextualTip('tip_ai_understanding', state), true);
  const approvedOnce = onboarding.recordBehaviorSignal(state, 'aiUnderstandingApprovedCount', 1);
  assert.equal(onboarding.shouldShowContextualTip('tip_ai_understanding', approvedOnce), true);
  const approvedTwice = onboarding.recordBehaviorSignal(approvedOnce, 'aiUnderstandingApprovedCount', 1);
  assert.equal(onboarding.shouldShowContextualTip('tip_ai_understanding', approvedTwice), false);

  // Script edit tip retires after user edits a scene
  assert.equal(onboarding.shouldShowContextualTip('tip_script_customize', state), true);
  const edited = onboarding.recordBehaviorSignal(state, 'editedScriptCount', 1);
  assert.equal(onboarding.shouldShowContextualTip('tip_script_customize', edited), false);

  // Create Another Video tip only shows when video exists and user hasn't used Create Another yet
  assert.equal(onboarding.shouldShowContextualTip('tip_create_another_video', state, { hasVideo: false }), false);
  assert.equal(onboarding.shouldShowContextualTip('tip_create_another_video', state, { hasVideo: true }), true);
  const createdAnother = onboarding.recordBehaviorSignal(state, 'createdAnotherCount', 1);
  assert.equal(onboarding.shouldShowContextualTip('tip_create_another_video', createdAnother, { hasVideo: true }), false);

  // Dismissed tips stay permanently dismissed
  const dismissed = onboarding.mergeOnboardingState(state, { dismissedTips: ['tip_try_director'] });
  assert.equal(onboarding.shouldShowContextualTip('tip_try_director', dismissed, { studioMode: 'simple' }), false);
});

test('3. Database Persistence: onboardingState saves, merges, and persists across logins', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-onb-'));
  const prevDataDir = process.env.DATA_DIR;
  process.env.DATA_DIR = tmpDir;
  delete require.cache[require.resolve('../engine/db.js')];
  const db = require('../engine/db.js');

  try {
    const created = await db.createUser({
      email: 'onboard@example.com',
      password: 'password123',
      name: 'Riya',
    });
    assert.equal(created.onboardingState.welcomeSeen, false);

    const updated = await db.updateUserOnboarding(created.id, {
      welcomeSeen: true,
      tourCompleted: true,
      preferredMode: 'advanced',
      dismissedTips: ['tip_try_director'],
      behaviors: { modeSwitchCount: 2, editedScriptCount: 1 },
    });
    assert.equal(updated.welcomeSeen, true);
    assert.equal(updated.tourCompleted, true);
    assert.equal(updated.preferredMode, 'advanced');
    assert.deepEqual(updated.dismissedTips, ['tip_try_director']);
    assert.equal(updated.behaviors.modeSwitchCount, 2);

    // Subsequent partial update preserves earlier fields
    const updated2 = await db.updateUserOnboarding(created.id, {
      dismissedTips: ['tip_script_customize'],
    });
    assert.equal(updated2.tourCompleted, true);
    assert.ok(updated2.dismissedTips.includes('tip_try_director'));
    assert.ok(updated2.dismissedTips.includes('tip_script_customize'));

    const token = await db.createSession(created.id);
    const sessionUser = await db.getUserBySessionToken(token);
    assert.equal(sessionUser.onboardingState.tourCompleted, true);
    assert.equal(sessionUser.onboardingState.preferredMode, 'advanced');
  } finally {
    delete require.cache[require.resolve('../engine/db.js')];
    if (prevDataDir === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = prevDataDir;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('4. Bidirectional Mode Transfer preserves compatible brief, settings, guardrails, eventContext & photo', () => {
  const guardrails = { dos: [{ id: 'd1', text: 'Show hallmark logo', priority: 'critical' }], donts: [], version: 1 };
  const eventCtx = { category: 'Festivals', name: 'Diwali', creativeInfluence: 'Subtly', version: 1 };
  const photo = { name: 'necklace.jpg', mime: 'image/jpeg', data: 'abc123' };

  // Simple -> Director
  const s2d = modeTransfer.transferSimpleToDirector({
    simpleState: {
      brief: '20% off Diwali diamond collection',
      language: 'Hindi',
      creativeStyle: 'Storytelling',
      duration: '30s',
      aspectRatio: '16:9',
      productPhoto: photo,
      creativeGuardrails: guardrails,
      eventContext: eventCtx,
      aiUnderstanding: { business_understanding: 'Gold & diamond festive offer', approval_status: 'auto_approved' },
    },
    currentUserContext: { businessName: 'Ratnam Jewellers', businessType: 'Jewellery' },
  });

  assert.equal(s2d.targetStage, 'settings', 'Brief already filled in Simple Mode should advance directly to Settings');
  assert.deepEqual(s2d.completedStages, ['brief']);
  assert.equal(s2d.userContext.brief, '20% off Diwali diamond collection');
  assert.equal(s2d.userContext.language, 'Hindi');
  assert.equal(s2d.userContext.targetDuration, '30s');
  assert.equal(s2d.userContext.aspectRatio, '16:9');
  assert.equal(s2d.userContext.platform, 'YouTube / 16:9');
  assert.deepEqual(s2d.userContext.creativeGuardrails, guardrails);
  assert.deepEqual(s2d.userContext.eventContext, eventCtx);
  assert.equal(s2d.userContext.productPhoto.name, 'necklace.jpg');
  assert.equal(s2d.explicitChoices.language, 'Hindi');
  assert.equal(s2d.explicitChoices.duration, '30s');
  assert.ok(s2d.preservedItems.length >= 5);

  // Director -> Simple
  const d2s = modeTransfer.transferDirectorToSimple({
    userContext: s2d.userContext,
    aiUnderstanding: s2d.aiUnderstanding,
  });

  assert.equal(d2s.simpleDraft.step, 1);
  assert.equal(d2s.simpleDraft.brief, '20% off Diwali diamond collection');
  assert.equal(d2s.simpleDraft.language, 'Hindi');
  assert.equal(d2s.simpleDraft.duration, '30s');
  assert.equal(d2s.simpleDraft.aspectRatio, '16:9');
  assert.deepEqual(d2s.simpleDraft.creativeGuardrails, guardrails);
  assert.deepEqual(d2s.simpleDraft.eventContext, eventCtx);
  assert.equal(d2s.simpleDraft.productPhoto.name, 'necklace.jpg');
  assert.equal(d2s.simpleDraft.aiUnderstanding.business_understanding, 'Gold & diamond festive offer');
});

test('5. Tour Config, Tooltips & Contextual Tips completeness and scope guard (no Help & Learning)', () => {
  assert.ok(Array.isArray(TOUR_STEPS) && TOUR_STEPS.length === 5, 'Tour should stay concise (5 essential steps)');
  for (const step of TOUR_STEPS) {
    assert.ok(step.id && step.targetSelector && step.title && step.description);
  }
  assert.ok(HELP_TOOLTIPS.brief_input && HELP_TOOLTIPS.format_dimension && HELP_TOOLTIPS.format_duration);
  assert.ok(CONTEXTUAL_TIPS.tip_try_director && CONTEXTUAL_TIPS.tip_create_another_video);

  const shellSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AppShell.jsx'), 'utf8');
  const accountSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AccountModal.jsx'), 'utf8');
  assert.ok(!shellSrc.includes('Help & Learning'), 'Help & Learning must remain out of scope');
  assert.ok(!accountSrc.includes('Help & Learning'), 'Help & Learning must remain out of scope');
  assert.ok(accountSrc.includes('Replay Tour'), 'Tour must be replayable from Account Settings');
  assert.ok(shellSrc.includes('data-tour="tour-replay-trigger"'), 'Tour must be replayable from sidebar footer');
});

test('6. Unified Mode Selection, Project Resumption Bypass, Mobile Mode Switcher & Proportional Format Cards', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  const shellSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AppShell.jsx'), 'utf8');
  const cssSrc = fs.readFileSync(path.join(__dirname, '../src/index.css'), 'utf8');
  const modeScreenSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ModeSelectionScreen.jsx'), 'utf8');
  const formatSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/VideoFormatFields.jsx'), 'utf8');
  const feedbackSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/FeedbackModal.jsx'), 'utf8');
  const serverSrc = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

  // Mode selection screen copy & CTAs
  assert.ok(modeScreenSrc.includes('Start with Simple Mode'));
  assert.ok(modeScreenSrc.includes('Start with Director Mode'));
  assert.ok(modeScreenSrc.includes('entrySource === \'script\''), 'Existing Script entry must have dedicated Mode Selection flow');

  // Existing projects & drafts bypass Mode Selection
  const openProjBlock = appSrc.slice(appSrc.indexOf('const handleOpenProject'), appSrc.indexOf('const handleDeleteProject'));
  assert.ok(openProjBlock.includes('setHasSelectedModeForProject(true)'), 'Resuming saved projects/drafts must bypass mode selection');
  assert.ok(openProjBlock.includes('setModeSelectionContext(null)'), 'Resuming saved projects/drafts must clear modeSelectionContext');

  // Existing Script & Website URL route into unified Mode Selection flow
  assert.ok(appSrc.includes("setModeSelectionContext({ source: 'script', scriptPayload: payload })"));
  assert.ok(appSrc.includes("setHasSelectedModeForProject(false)") && appSrc.includes("setSelectedCreationEntry('url')"));

  // Desktop + Mobile accessible mode switcher & dynamic sidebar badge
  assert.ok(shellSrc.includes('mobile-mode-switcher'), 'Mobile topbar & drawer must expose mode switcher');
  assert.ok(shellSrc.includes("studioMode === 'simple' ? '3 Steps' : '7 Stages'"), 'Sidebar badge must dynamically reflect active mode');
  assert.ok(cssSrc.includes('.mobile-mode-switcher'), 'CSS must show mobile mode switcher at max-width: 768px');

  // FeedbackModal checks studioMode === 'advanced'
  assert.ok(feedbackSrc.includes("studioMode === 'advanced'"), 'FeedbackModal must recognize advanced Director Mode');

  // Single-select proportional aspect ratio preview cards (no multi-format batching)
  assert.ok(formatSrc.includes('dim.frameWidth') && formatSrc.includes('dim.frameHeight'));
  assert.ok(!formatSrc.includes('checkbox') && !formatSrc.includes('Select multiple'), 'Must not introduce unsupported multi-format batch selection');

  // Server onboarding persistence endpoint exists
  assert.ok(serverSrc.includes('app.patch("/api/auth/onboarding"'));
});

test('7. ProductTourEngine Spotlight Overlay: High-contrast dim (~85%), cutout-only blur, glow ring & tooltip layering', () => {
  const tourSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ProductTourEngine.jsx'), 'utf8');
  assert.ok(tourSrc.includes('rgba(10, 10, 9, 0.85)'), 'Overlay fill must use high-contrast ~85% dark backdrop');
  assert.ok(tourSrc.includes("backdropFilter: 'blur(2.5px)'"), 'Backdrop outside spotlight must use subtle ~2.5px blur');
  assert.ok(tourSrc.includes('polygon(evenodd,'), 'Blur layer must exclude highlighted element via evenodd clip-path cutout');
  assert.ok(tourSrc.includes('const pad = 8;'), 'Spotlight cutout must maintain generous padding around target');
  assert.ok(tourSrc.includes("border: '2px solid var(--cc-action)'"), 'Spotlight ring must feature a crisp 2px signal (brand accent) border');
  assert.ok(tourSrc.includes('0 0 24px rgba(197, 239, 52, 0.18)'), 'Spotlight ring must include subtle outer glow');
  assert.ok(tourSrc.includes('zIndex: 9996'), 'Tooltip card must render cleanly above the spotlight overlay');
});

test('8. Onboarding Persistence Across Refresh, Logout/Login, Cross-Device & Manual Replay', async () => {
  // 1. Monotonic latch check: stale false values never erase seen/completed/skipped status
  const completedState = onboarding.mergeOnboardingState(
    { welcomeSeen: true, tourCompleted: true, dismissedTips: ['tip_try_director'] },
    { welcomeSeen: false, tourCompleted: false, tourSkipped: false }
  );
  assert.equal(completedState.welcomeSeen, true);
  assert.equal(completedState.tourCompleted, true);
  assert.equal(completedState.tourSkipped, false);

  const skippedState = onboarding.mergeOnboardingState(
    { welcomeSeen: true, tourSkipped: true },
    { welcomeSeen: false, tourSkipped: false }
  );
  assert.equal(skippedState.welcomeSeen, true);
  assert.equal(skippedState.tourSkipped, true);

  // 2. Real backend HTTP persistence (PATCH /api/auth/onboarding, GET /api/auth/me, POST /api/auth/login, verify/reset)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-onb-http-'));
  const prevDataDir = process.env.DATA_DIR;
  const prevEmailReq = process.env.REQUIRE_EMAIL_VERIFICATION;
  process.env.DATA_DIR = tmpDir;
  process.env.REQUIRE_EMAIL_VERIFICATION = 'false';

  delete require.cache[require.resolve('../engine/db.js')];
  delete require.cache[require.resolve('../engine/email.js')];
  delete require.cache[require.resolve('../server.js')];
  const db = require('../engine/db.js');
  const emailService = require('../engine/email.js');
  let capturedVerifyUrl = '';
  emailService.setCustomResendClient({
    emails: {
      send: async (msg) => {
        const match = String(msg?.html || msg?.text || '').match(/token=([a-zA-Z0-9_-]+)/);
        if (match) capturedVerifyUrl = match[1];
        return { data: { id: 'mock_onb_verify' }, error: null };
      },
    },
  });
  const { app } = require('../server.js');

  let server;
  try {
    await new Promise((resolve) => {
      server = app.listen(0, resolve);
    });
    const base = `http://127.0.0.1:${server.address().port}`;

    // First-time signup -> verify email -> login session with onboardingState
    const signupRes = await fetch(`${base}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'firsttime@example.com', password: 'password123', name: 'Asha' }),
    });
    assert.equal(signupRes.status, 200);
    assert.ok(capturedVerifyUrl, 'Signup should dispatch verification email token');

    const verifyRes = await fetch(`${base}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: decodeURIComponent(capturedVerifyUrl) }),
    });
    assert.equal(verifyRes.status, 200);
    const verifyJson = await verifyRes.json();
    assert.equal(verifyJson.user.onboardingState.welcomeSeen, false);
    assert.equal(
      onboarding.shouldAutoTriggerWelcome(verifyJson.user.onboardingState, {
        isAuthenticated: true,
        isAuthChecking: false,
        businessCount: 1,
      }),
      true
    );

    // Completing or skipping persists via PATCH /api/auth/onboarding
    const patchRes = await fetch(`${base}/api/auth/onboarding`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${verifyJson.token}`,
      },
      body: JSON.stringify({ welcomeSeen: true, tourSkipped: true }),
    });
    assert.equal(patchRes.status, 200);
    const patchJson = await patchRes.json();
    assert.equal(patchJson.onboardingState.welcomeSeen, true);
    assert.equal(patchJson.onboardingState.tourSkipped, true);

    // Simulating browser refresh (GET /api/auth/me)
    const meRes = await fetch(`${base}/api/auth/me`, {
      headers: { Authorization: `Bearer ${verifyJson.token}` },
    });
    assert.equal(meRes.status, 200);
    const meJson = await meRes.json();
    assert.equal(meJson.user.onboardingState.welcomeSeen, true);
    assert.equal(meJson.user.onboardingState.tourSkipped, true);
    assert.equal(
      onboarding.shouldAutoTriggerWelcome(meJson.user.onboardingState, {
        isAuthenticated: true,
        isAuthChecking: false,
        businessCount: 1,
      }),
      false,
      'Refreshing browser must not trigger Welcome again'
    );

    // Simulating logout + login from a brand-new device (POST /api/auth/login, empty localStorage)
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'firsttime@example.com', password: 'password123' }),
    });
    assert.equal(loginRes.status, 200);
    const loginJson = await loginRes.json();
    assert.equal(loginJson.user.onboardingState.welcomeSeen, true);
    assert.equal(loginJson.user.onboardingState.tourSkipped, true);
    assert.equal(
      onboarding.shouldAutoTriggerWelcome(loginJson.user.onboardingState, {
        isAuthenticated: true,
        isAuthChecking: false,
        businessCount: 1,
      }),
      false,
      'Logging in on same or different device must not trigger Welcome again'
    );

    // Password reset login also preserves onboardingState
    const resetTok = await db.createPasswordResetToken(verifyJson.user.id);
    const resetUser = await db.resetPasswordWithToken(resetTok.rawToken, 'newpassword123');
    assert.equal(resetUser.onboardingState.welcomeSeen, true);
    assert.equal(resetUser.onboardingState.tourSkipped, true);

    // App.jsx uses keepalive + manual replay keeps completion latches intact
    const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
    assert.ok(appSrc.includes('keepalive: true'), 'Onboarding persistence PATCH should survive immediate reload via keepalive');
    const replayBlock = appSrc.slice(appSrc.indexOf('const handleReplayTour'), appSrc.indexOf('const handleReplayTour') + 220);
    assert.ok(replayBlock.includes('setIsTourOpen(true)'), 'Manual Tour button opens interactive tour');
    assert.ok(!replayBlock.includes('tourCompleted: false'), 'Manual replay must not reset completion persistence');
  } finally {
    emailService.resetCustomResendClient();
    if (server) await new Promise((r) => server.close(r));
    delete require.cache[require.resolve('../server.js')];
    delete require.cache[require.resolve('../engine/email.js')];
    delete require.cache[require.resolve('../engine/db.js')];
    if (prevDataDir === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = prevDataDir;
    if (prevEmailReq === undefined) delete process.env.REQUIRE_EMAIL_VERIFICATION;
    else process.env.REQUIRE_EMAIL_VERIFICATION = prevEmailReq;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('9. P1 UX Improvements: Draft Autosave Status, Long AI Recovery, Unadded Guardrails Across Mode Switch, & Scannable Hub', () => {
  // 1. Draft and autosave feedback
  const appShellSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AppShell.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  assert.ok(appShellSrc.includes('data-testid="draft-autosave-status"'), 'AppShell renders draft status pill');
  assert.ok(appShellSrc.includes('role="status"') && appShellSrc.includes('aria-live="polite"'), 'Draft status is announced politely to screen readers');
  assert.ok(appShellSrc.includes('Saving…') && appShellSrc.includes('Creating draft') && appShellSrc.includes('Draft saved') && appShellSrc.includes('Save failed'));
  assert.ok(appShellSrc.includes('data-testid="draft-retry-btn"'), 'AppShell exposes manual Retry action on save failure');
  const persistIdx = appSrc.indexOf('const persistDraft = async');
  const scheduleIdx = appSrc.indexOf('const scheduleDraftSave =');
  const persistBlock = appSrc.slice(persistIdx, scheduleIdx);
  assert.ok(persistBlock.indexOf("state: 'saving'") < persistBlock.indexOf("fetch('/api/projects'"), 'Saving status must be set before persistence request');
  assert.ok(persistBlock.indexOf("if (!res.ok || !data || !data.project) throw") < persistBlock.indexOf("state: 'saved'"), 'Saved status must never appear before backend confirms persistence');
  assert.ok(persistBlock.includes('persistedDraftIdsRef.current.has(payload.id)'), 'isNewDraft relies on backend persistence confirmation, not optimistic ID');
  assert.ok(persistBlock.includes('draftEpochRef.current !== epoch'), 'Stale in-flight draft responses are ignored after reset/logout');
  assert.ok(appSrc.includes('handleRetryDraftSave'), 'Manual and bounded auto-retry exist for failed draft saves');

  // 2. Long-running AI operations: honest progress, overrun note, no fake %, duplicate guard & recovery
  const loaderSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/WorkflowLoadingScreen.jsx'), 'utf8');
  const understandingSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ScreenUnderstanding.jsx'), 'utf8');
  const scriptModalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ExistingScriptModal.jsx'), 'utf8');
  assert.ok(loaderSrc.includes('ScriptVerificationLoader') && loaderSrc.includes('AiUnderstandingLoader'));
  assert.ok(loaderSrc.includes('Taking longer than usual — still working'), 'Loader honestly reports exceeded estimate without fake ETA');
  assert.ok(loaderSrc.includes('isPotentiallyStalled') && loaderSrc.includes('onRetry') && loaderSrc.includes('onCancel'));
  assert.ok(loaderSrc.includes('aria-atomic="true"') && loaderSrc.includes('politeAnnouncement'), 'Screen-reader live region announces stage/threshold changes, not 1s ticks');
  assert.ok(understandingSrc.includes('<AiUnderstandingLoader'), 'ScreenUnderstanding uses AiUnderstandingLoader with steps & elapsed time');
  assert.ok(understandingSrc.includes('onRegenerate(undefined, true)'), 'AI Understanding retry safely preserves prior regeneration corrections');
  assert.ok(appSrc.includes('lastUnderstandingCorrectionsRef') && appSrc.includes('setAnalysisAttempt'), 'AI Understanding retry preserves corrections and resets loader timer cleanly');
  assert.ok(scriptModalSrc.includes('validateAbortRef') && scriptModalSrc.includes('if (isValidating && !forceRetry) return') && scriptModalSrc.includes('verifyAttempt'), 'ExistingScriptModal prevents duplicate verification calls, resets timer on retry, and supports abort/timeout recovery');
  assert.ok(appSrc.includes('aiUnderstandingAbortRef') && appSrc.includes('if (isAnalyzingBriefRef.current && !forceRetry) return'), 'App.jsx prevents duplicate AI Understanding requests and supports abort/timeout recovery');

  // 3. Unadded Do/Don't draft text preservation & categorized ModeSwitchModal summary
  const pendingDraft = { doText: 'Mention weekend warranty', dontText: 'Never show competitors' };
  const s2d = modeTransfer.transferSimpleToDirector({
    simpleState: {
      brief: 'Monsoon footwear sale in Pune',
      language: 'English',
      creativeStyle: 'UGC / Creator-style',
      duration: '15s',
      aspectRatio: '9:16',
      packages: [{ id: 'pkg-1', title: 'Rain Ready' }],
    },
    currentUserContext: {
      businessName: 'StepUp Shoes',
      creativeGuardrails: { dos: ['Show storefront'], donts: [] },
    },
    guardrailDraftInputs: pendingDraft,
  });
  assert.deepEqual(s2d.guardrailDraftInputs, pendingDraft, 'Simple -> Director carries pending unadded Do/Don’t text');
  assert.ok(s2d.savedItems.some((i) => i.includes('Saved creative instructions')), 'Saved guardrails listed in savedItems');
  assert.ok(s2d.pendingItems.some((i) => i.includes("Pending Do's text") && i.includes('Mention weekend warranty')), 'Pending Do text listed separately in pendingItems');
  assert.ok(s2d.pendingItems.some((i) => i.includes("Pending Don'ts text") && i.includes('Never show competitors')), 'Pending Don’t text listed separately in pendingItems');
  assert.ok(s2d.uncarriedItems.some((i) => i.includes('Generated 3-script previews')), 'Uncarried Simple packages disclosed honestly');

  const d2s = modeTransfer.transferDirectorToSimple({
    userContext: {
      brief: 'Diwali gold coin offer',
      language: 'Hindi',
      creativeStyle: 'Cinematic',
      duration: '15s',
      aspectRatio: '9:16',
      creativeGuardrails: { dos: [], donts: ['No price slash graphics'] },
    },
    guardrailDraftInputs: pendingDraft,
    hasDirectorDirectionOrHook: true,
    hasDirectorScenes: true,
  });
  assert.deepEqual(d2s.guardrailDraftInputs, pendingDraft, 'Director -> Simple carries pending unadded Do/Don’t text');
  assert.deepEqual(d2s.simpleDraft.guardrailDraftInputs, pendingDraft, 'Simple draft snapshot preserves guardrailDraftInputs');
  assert.ok(d2s.pendingItems.some((i) => i.includes('Mention weekend warranty')));
  assert.ok(d2s.uncarriedItems.some((i) => i.includes('Selected creative direction / opening hook')));
  assert.ok(d2s.uncarriedItems.some((i) => i.includes('Edited Director scene script')));

  const instructionsSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/CreativeInstructionsSection.jsx'), 'utf8');
  const modalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ModeSwitchModal.jsx'), 'utf8');
  const simpleSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/SimpleBusinessStudio.jsx'), 'utf8');
  const guidedSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(instructionsSrc.includes('draftInputs') && instructionsSrc.includes('onDraftChange'));
  assert.ok(simpleSrc.includes('const [guardrailDraftInputs, setGuardrailDraftInputs] = useState'), 'SimpleBusinessStudio declares guardrailDraftInputs state');
  assert.ok(simpleSrc.includes('draftState = () =>') && simpleSrc.slice(simpleSrc.indexOf('draftState = () =>'), simpleSrc.indexOf('const handleApplyTemplate')).includes('guardrailDraftInputs'), 'SimpleBusinessStudio includes guardrailDraftInputs in draftState & effect deps');
  assert.ok(guidedSrc.includes('guardrailDraftInputs'));
  assert.ok(modalSrc.includes('mode-switch-saved-items') && modalSrc.includes('mode-switch-pending-items') && modalSrc.includes('mode-switch-uncarried-items') && modalSrc.includes("e.key === 'Escape'"));

  // 4. Creation Hub scanability keeps all 3 routes & clarifying hierarchy
  const hubSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/CreationEntryHub.jsx'), 'utf8');
  assert.ok(hubSrc.includes('data-testid="hub-card-brief"') && hubSrc.includes('data-testid="hub-card-script"') && hubSrc.includes('data-testid="hub-card-url"'));
  assert.ok(hubSrc.includes('Start with a Brief') && hubSrc.includes('Start with an Existing Script') && hubSrc.includes('Start with a Website URL'));
  assert.ok(hubSrc.includes('Next step:') && hubSrc.includes('<button') && hubSrc.includes('Recommended') && hubSrc.includes('minmax(min(260px, 100%), 1fr)'));
});

test('Choices bar hides Settings specs carried from Simple Studio until the user reaches Settings', () => {
  const { filterReachedChoices } = require('../src/utils/choicesVisibility.js');
  const s2d = modeTransfer.transferSimpleToDirector({
    simpleState: { brief: '', language: 'English', creativeStyle: 'UGC / Creator-style', duration: '20s', aspectRatio: '9:16' },
    currentUserContext: { businessName: 'TEST' },
  });
  // Values are still carried (Settings will be prefilled)...
  assert.equal(s2d.targetStage, 'brief');
  assert.equal(s2d.explicitChoices.duration, '20s');

  const chips = [
    { type: 'style', stage: 'settings' },
    { type: 'language', stage: 'settings' },
    { type: 'duration', stage: 'settings' },
    { type: 'dimension', stage: 'settings' },
    { type: 'idea', stage: 'idea' },
  ];
  // ...but none show on Brief before Settings is reached.
  assert.deepEqual(filterReachedChoices(chips, 'brief', s2d.completedStages), []);
  // After Settings is completed they show on later stages, but not choices from stages still ahead.
  const onIdeaStageBeforeComplete = filterReachedChoices(chips, 'understanding', ['brief', 'settings']).map((c) => c.type);
  assert.deepEqual(onIdeaStageBeforeComplete, ['style', 'language', 'duration', 'dimension']);
  // Going back to Brief after completing Settings keeps the confirmed chips.
  assert.equal(filterReachedChoices(chips, 'brief', ['brief', 'settings']).length, 4);
  // Unknown stage: no filtering.
  assert.equal(filterReachedChoices(chips, null, []).length, 5);

  const guidedSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  assert.ok(guidedSrc.includes('filterReachedChoices(activeChoices, currentStage, completedStages)'));
  assert.ok(appSrc.includes('completedStages={completedStages}'));
});
