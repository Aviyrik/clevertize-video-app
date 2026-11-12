const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const onboarding = require('../src/utils/onboarding.js');
const { TOUR_STEPS } = require('../src/data/tourSteps.js');

const ROOT = path.join(__dirname, '..');

test('P3.1A Business Setup: 4-step accessible progress, required cues, Back/Continue, dirty-close guard & validation ARIA', () => {
  const bizModalSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/BusinessOnboardingModal.jsx'), 'utf8');

  assert.ok(bizModalSrc.includes('role="progressbar"') && bizModalSrc.includes('aria-valuemax={4}') && bizModalSrc.includes('aria-valuenow={step}'));
  assert.ok(bizModalSrc.includes('Step {step} of 4') && bizModalSrc.includes('Identity') && bizModalSrc.includes('Location') && bizModalSrc.includes('Voice') && bizModalSrc.includes('Confirm'));
  assert.ok(bizModalSrc.includes('<span>Continue</span>') && bizModalSrc.includes('<span>Back</span>') && bizModalSrc.includes('<span>Save</span>'));
  assert.ok(bizModalSrc.includes('hasUnsavedChanges') && bizModalSrc.includes('showDiscardConfirm') && bizModalSrc.includes('Keep Editing'));
  assert.ok(bizModalSrc.includes('aria-required="true"') && bizModalSrc.includes('aria-invalid={nameError}') && bizModalSrc.includes('aria-invalid={townError}'));
  assert.ok(bizModalSrc.includes('role="alert"') && bizModalSrc.includes('previousFocusRef'));
  assert.ok(bizModalSrc.includes('role="group" aria-label="Brand Tone"') && !bizModalSrc.slice(bizModalSrc.indexOf('role="group" aria-label="Brand Tone"')).includes('<div\n                      key={t.id}'));
});

test('P3.1B Account Settings: grouped sections, Danger Zone differentiation, Escape & focus return on Delete confirmation', () => {
  const accountSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/AccountModal.jsx'), 'utf8');

  assert.ok(accountSrc.includes('Personal Information') && accountSrc.includes('Security &amp; Session') && accountSrc.includes('Danger Zone'));
  assert.ok(accountSrc.includes('data-testid="account-danger-zone"') && accountSrc.includes('role="alertdialog"'));
  assert.ok(accountSrc.includes('data-testid="delete-account-cancel-btn"') && accountSrc.includes('data-testid="delete-account-confirm-btn"'));
  assert.ok(accountSrc.includes('deleteTriggerRef') && accountSrc.includes('previousFocusRef'));
  assert.ok(accountSrc.includes("e.key === 'Escape'") && accountSrc.includes('handleCancelDeleteConfirm'));
});

test('P3.2 Guided Tour State: pause preserves step without forcing auto-restart, resume & replay work cleanly', () => {
  const initial = onboarding.createDefaultOnboardingState();
  assert.equal(onboarding.hasResumableTourProgress(initial, TOUR_STEPS.length), false);

  // User pauses midway at Step 3 (index 2)
  const pausedAtStep3 = onboarding.mergeOnboardingState(initial, {
    welcomeSeen: true,
    tourSkipped: true,
    tourPaused: true,
    lastTourStep: 2,
  });
  assert.equal(pausedAtStep3.tourPaused, true);
  assert.equal(pausedAtStep3.lastTourStep, 2);
  assert.equal(onboarding.hasResumableTourProgress(pausedAtStep3, TOUR_STEPS.length), true);
  assert.equal(
    onboarding.shouldAutoTriggerWelcome(pausedAtStep3, {
      isAuthenticated: true,
      isAuthChecking: false,
      businessCount: 1,
    }),
    false,
    'Paused tour must never auto-trigger Welcome or force tour on reload'
  );

  // Later user restarts and pauses earlier at Step 2 (index 1) -> lastTourStep updates cleanly to 1
  const pausedEarlier = onboarding.mergeOnboardingState(pausedAtStep3, {
    tourPaused: true,
    lastTourStep: 1,
  });
  assert.equal(pausedEarlier.lastTourStep, 1);

  // Completing clears paused state
  const completed = onboarding.mergeOnboardingState(pausedEarlier, {
    tourCompleted: true,
    tourPaused: false,
    lastTourStep: 0,
  });
  assert.equal(completed.tourCompleted, true);
  assert.equal(completed.tourPaused, false);
  assert.equal(onboarding.hasResumableTourProgress(completed, TOUR_STEPS.length), false);
});

test('P3.2 Guided Tour UI & Wiring: 5 steps with contextual destinations, step announcements, Pause/Resume/Restart & focus management', () => {
  assert.equal(TOUR_STEPS.length, 5);
  for (const step of TOUR_STEPS) {
    assert.ok(step.action && step.action.label && step.action.type, `Tour step ${step.id} should declare a real contextual action`);
  }

  const tourSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/ProductTourEngine.jsx'), 'utf8');
  const shellSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/AppShell.jsx'), 'utf8');
  const accountSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/AccountModal.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.jsx'), 'utf8');

  assert.ok(tourSrc.includes('Step {currentIndex + 1} of {steps.length}'));
  assert.ok(tourSrc.includes('aria-live="polite"') && tourSrc.includes('aria-atomic="true"'));
  assert.ok(tourSrc.includes('<span>Previous</span>') && tourSrc.includes('<span>Pause</span>') && tourSrc.includes('<span>Restart</span>'));
  assert.ok(tourSrc.includes('previousFocusRef') && tourSrc.includes('suppressFocusRestoreRef'));
  assert.ok(tourSrc.includes("e.key === 'Escape'") && tourSrc.includes("e.key === 'ArrowRight'") && tourSrc.includes("e.key === 'ArrowLeft'"));
  assert.ok(tourSrc.includes('data-testid={`tour-action-${activeStep.id}`}'));

  assert.ok(shellSrc.includes('data-testid="sidebar-resume-tour-btn"'));
  assert.ok(accountSrc.includes('data-testid="account-resume-tour-btn"'));
  assert.ok(appSrc.includes('handleTourPause') && appSrc.includes('handleResumeTour') && appSrc.includes('handleTourStepAction'));
});

test('Unified Product Photo: shared component, exact wording, controls, single state wiring & project/mode persistence', () => {
  const modeTransfer = require('../src/utils/modeTransfer.js');
  const drafts = require('../src/utils/drafts.js');

  const productPhotoSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/ProductPhotoSection.jsx'), 'utf8');
  const guidedSrc = fs.readFileSync(path.join(ROOT, 'src/components/GuidedStudio.jsx'), 'utf8');
  const simpleSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/SimpleBusinessStudio.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.jsx'), 'utf8');

  // 1. Exact terminology & shared UI controls in single shared component
  assert.ok(productPhotoSrc.includes("title: 'Product Photo'"));
  assert.ok(productPhotoSrc.includes("description: 'Upload a photo of your product or packaging to help guide the generated scenes.'"));
  assert.ok(productPhotoSrc.includes("uploadCta: 'Upload product photo'"));
  assert.ok(productPhotoSrc.includes('<OptionalFieldDisclosure'));
  assert.ok(productPhotoSrc.includes('defaultExpanded = false'));
  assert.ok(productPhotoSrc.includes('accept="image/*"'));
  assert.ok(productPhotoSrc.includes('<span>Replace</span>') && productPhotoSrc.includes('<span>Remove</span>'));
  assert.ok(productPhotoSrc.includes('aria-label="Replace product photo"') && productPhotoSrc.includes('aria-label="Remove product photo"'));
  assert.ok(productPhotoSrc.includes('e.target.value = \'\''), 'Resets input value so re-uploading same file after removal works');

  // 2. Both Simple Studio and Director Mode Brief use ProductPhotoSection inside Optional Details, with legacy duplicated wording removed
  assert.ok(guidedSrc.includes('<ProductPhotoSection') && guidedSrc.includes('expanded={Boolean(optExpanded.productPhoto)}'));
  assert.ok(simpleSrc.includes('<ProductPhotoSection') && simpleSrc.includes('expanded={Boolean(briefOptionalExpanded.productPhoto)}'));
  assert.ok(!simpleSrc.includes('Product or Store Photo'), 'Legacy Simple Studio title removed');
  assert.ok(!simpleSrc.includes('Attach a photo of your product or storefront'), 'Legacy Simple Studio CTA removed');
  assert.ok(!guidedSrc.includes('Product Image (Optional)'), 'Legacy Director Brief title removed');
  assert.ok(!guidedSrc.includes('Click to upload product photo (Optional)'), 'Legacy Director Brief CTA removed');

  // 3. Single shared product photo state & upload/removal callbacks wired from App.jsx
  assert.ok(appSrc.includes('productPhoto={userContext.productPhoto}'));
  assert.ok(appSrc.includes("onUploadProductPhoto={(file) => handleFileUpload(file, 'productPhoto')}"));
  assert.ok(appSrc.includes("onRemoveProductPhoto={() => updateUserContext('productPhoto', null)}"));
  assert.ok(simpleSrc.includes('hasProductPhoto: Boolean(productPhoto)'), 'Simple Studio sends hasProductPhoto to AI package endpoint');
  assert.ok(appSrc.includes("updateUserContext('productPhoto', restoredProductPhoto)"), 'Opening a project isolates productPhoto to that project');
  assert.ok(appSrc.includes("const resolvedPhoto = packageData.productPhoto !== undefined ? packageData.productPhoto : userContext.productPhoto;"), 'Video production respects removed product photo');

  // 4. Mode transfer & draft serialization preserve upload, replacement and removal cleanly
  const firstPhoto = { name: 'box-front.png', mime: 'image/png', data: 'AAAA' };
  const replacedPhoto = { name: 'box-angle.webp', mime: 'image/webp', data: 'BBBB' };
  const toDirector = modeTransfer.transferSimpleToDirector({
    simpleState: { brief: 'Festive box launch', productPhoto: firstPhoto },
    currentUserContext: { businessName: 'Kanti' },
  });
  assert.equal(toDirector.userContext.productPhoto.name, 'box-front.png');

  const backToSimple = modeTransfer.transferDirectorToSimple({
    userContext: { ...toDirector.userContext, productPhoto: replacedPhoto },
  });
  assert.equal(backToSimple.simpleDraft.productPhoto.name, 'box-angle.webp');

  const removedInDirector = modeTransfer.transferDirectorToSimple({
    userContext: { ...toDirector.userContext, productPhoto: null },
    existingSimpleDraft: { productPhoto: replacedPhoto },
  });
  assert.equal(removedInDirector.simpleDraft.productPhoto, null);

  const savedDraft = drafts.buildDraftProject({
    id: 'proj_photo_1',
    businessName: 'Kanti',
    studio: 'simple',
    simple: { step: 1, brief: 'Festive box launch', productPhoto: replacedPhoto },
  });
  assert.equal(savedDraft.creativeDNA.draft.simple.productPhoto.name, 'box-angle.webp');
});

test('Canonical Simple Studio Brief: Direct entry & Director switch share one Step 1 Brief UI without data loss', () => {
  const modeTransfer = require('../src/utils/modeTransfer.js');
  const drafts = require('../src/utils/drafts.js');
  const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.jsx'), 'utf8');
  const simpleSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/SimpleBusinessStudio.jsx'), 'utf8');

  // 1. Canonical render precedence: studioMode === 'simple' MUST precede Screen02Brief pre-mode branch
  const modeSelectionPos = appSrc.indexOf(') : modeSelectionContext ? (');
  const simpleBranchPos = appSrc.indexOf(") : studioMode === 'simple' ? (", modeSelectionPos);
  const preModeBriefPos = appSrc.indexOf(") : (activeAppView === 'studio' && !hasSelectedModeForProject && studioStage === 'brief') ? (", modeSelectionPos);
  assert.ok(modeSelectionPos > 0 && simpleBranchPos > modeSelectionPos, 'App.jsx checks studioMode === simple right after modeSelectionContext');
  assert.ok(preModeBriefPos > simpleBranchPos, 'Simple Studio must never fall back into Director Screen02Brief before studioMode === simple');

  // 2. Direct entry paths sync Simple Studio at Step 1
  assert.ok(
    appSrc.includes('onOpenScriptModal={() => setIsScriptModalOpen(true)}') &&
    appSrc.includes('onOpenUrlModal={() => setIsUrlModalOpen(true)}'),
    'App.jsx wires Paste Script and Scan URL actions into SimpleBusinessStudio'
  );
  assert.ok(
    appSrc.includes('setHasSelectedModeForProject(studioMode === \'simple\')'),
    'Direct entry actions (Start with Brief / Tour Brief) mark Simple mode active'
  );
  const urlBlock = appSrc.slice(appSrc.indexOf('const handleApplyUrlData'), appSrc.indexOf('const fetchUserData'));
  assert.ok(
    urlBlock.includes('setSimpleResumeDraft') && urlBlock.includes('step: 1') && urlBlock.includes('setSimpleStudioKey'),
    'URL extraction syncs Simple Studio at Step 1 with scanned brief and product photo'
  );

  // 3. Canonical SimpleBusinessStudio Step 1 includes all expected brief controls & actions
  assert.ok(simpleSrc.includes('data-testid="simple-brief-screen"'));
  assert.ok(simpleSrc.includes("{ num: '01', stepNum: 1, label: 'Your Offer' }"));
  assert.ok(simpleSrc.includes("{ num: '02', stepNum: 2, label: 'Choose Script' }"));
  assert.ok(simpleSrc.includes("{ num: '03', stepNum: 3, label: 'Produce Video' }"));
  assert.ok(simpleSrc.includes('<span>Paste Script</span>') && simpleSrc.includes('<span>Scan URL</span>'));
  assert.ok(simpleSrc.includes('Language') && simpleSrc.includes('Creative Style'));
  assert.ok(simpleSrc.includes('simple-language-select') && simpleSrc.includes('simple-duration-segmented'));
  assert.ok(simpleSrc.includes('simple-dimension-group') && simpleSrc.includes('simple-style-group'));
  assert.ok(simpleSrc.includes('Optional Details'));
  assert.ok(simpleSrc.includes('<TargetAudienceSection'));
  assert.ok(simpleSrc.includes('<CreativeInstructionsSection'));
  assert.ok(simpleSrc.includes('<OccasionEventSection'));
  assert.ok(simpleSrc.includes('<ProductPhotoSection'));

  // 4. Bidirectional mode switch initializes Simple at Step 1 and preserves brief, format, instructions, event, photo & audience
  const directorCtx = {
    businessName: 'Aura Boutique',
    brief: 'Festive silk saree collection at 25% off',
    targetAudience: 'Families shopping for weddings',
    language: 'Hindi',
    creativeStyle: 'Storytelling',
    targetDuration: '30s',
    aspectRatio: '16:9',
    creativeGuardrails: { dos: ['Show zari weaving close-up'], donts: ['No flash discounts'] },
    eventContext: { name: 'Diwali', category: 'festival', timing: 'Nov 2026' },
    productPhoto: { name: 'saree.jpg', mime: 'image/jpeg', data: 'XYZ' },
  };
  const d2s = modeTransfer.transferDirectorToSimple({
    userContext: directorCtx,
    guardrailDraftInputs: { doText: 'Add store location', dontText: 'Avoid stock music' },
  });
  assert.equal(d2s.simpleDraft.step, 1, 'Switching Director -> Simple opens Step 1 Brief');
  assert.equal(d2s.simpleDraft.brief, directorCtx.brief);
  assert.equal(d2s.simpleDraft.language, 'Hindi');
  assert.equal(d2s.simpleDraft.creativeStyle, 'Storytelling');
  assert.equal(d2s.simpleDraft.duration, '30s');
  assert.equal(d2s.simpleDraft.aspectRatio, '16:9');
  assert.deepEqual(d2s.simpleDraft.creativeGuardrails, directorCtx.creativeGuardrails);
  assert.deepEqual(d2s.simpleDraft.eventContext, directorCtx.eventContext);
  assert.equal(d2s.simpleDraft.productPhoto.name, 'saree.jpg');
  assert.deepEqual(d2s.guardrailDraftInputs, { doText: 'Add store location', dontText: 'Avoid stock music' });

  const s2d = modeTransfer.transferSimpleToDirector({
    simpleState: d2s.simpleDraft,
    currentUserContext: directorCtx,
    guardrailDraftInputs: d2s.guardrailDraftInputs,
  });
  assert.equal(s2d.userContext.brief, directorCtx.brief);
  assert.equal(s2d.userContext.targetAudience, directorCtx.targetAudience, 'Target audience stays intact across Simple <-> Director');
  assert.deepEqual(s2d.userContext.creativeGuardrails, directorCtx.creativeGuardrails);
  assert.deepEqual(s2d.userContext.eventContext, directorCtx.eventContext);
  assert.equal(s2d.userContext.productPhoto.name, 'saree.jpg');

  // 5. Resuming a Simple Studio draft restores its saved step without forcing Step 1 reset
  const step2Draft = drafts.buildDraftProject({
    id: 'proj_step2',
    businessName: 'Aura Boutique',
    studio: 'simple',
    simple: {
      step: 2,
      brief: directorCtx.brief,
      packages: [{ id: 'pkg_1', title: 'Silk Heritage' }],
      selectedPackageId: 'pkg_1',
    },
  });
  assert.equal(step2Draft.creativeDNA.draft.simple.step, 2);
});

test('Brief & Settings Cognitive Load Redesign: Progressive disclosure, cleaner hierarchy & full capability parity', () => {
  const simpleSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/SimpleBusinessStudio.jsx'), 'utf8');
  const guidedSrc = fs.readFileSync(path.join(ROOT, 'src/components/GuidedStudio.jsx'), 'utf8');
  const instructionsSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/CreativeInstructionsSection.jsx'), 'utf8');
  const occasionSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/OccasionEventSection.jsx'), 'utf8');
  const audienceSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/TargetAudienceSection.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.jsx'), 'utf8');
  const modeTransfer = require('../src/utils/modeTransfer.js');

  // 1. Simple Studio Brief hierarchy
  assert.ok(simpleSrc.includes('data-testid="simple-campaign-identity"') && !simpleSrc.includes('Creating Video For'), 'Compact single-row campaign identity replaces heavy card');
  assert.ok(simpleSrc.includes('What are you promoting?'), 'Primary heading is clear and action-focused');
  assert.ok(simpleSrc.includes('Sample ideas') && simpleSrc.includes('onToggleRecording'), 'Keeps Sample ideas and Dictate support');

  // Video Settings expanded by default, manually collapsible with summary shown when collapsed
  assert.ok(simpleSrc.includes('const [videoSettingsExpanded, setVideoSettingsExpanded] = useState(true);'));
  assert.ok(simpleSrc.includes('data-testid="simple-video-settings-toggle"') && simpleSrc.includes('aria-controls="simple-video-settings-panel"'));
  assert.ok(simpleSrc.includes('{!videoSettingsExpanded && (') && simpleSrc.includes('data-testid="simple-video-settings-summary"'));

  // Compact Language select, 4 compact Creative Style tiles, 3 compact Video Dimensions, and segmented Video Length
  assert.ok(simpleSrc.includes('<select') && simpleSrc.includes('data-testid="simple-language-select"'));
  for (const lang of ['English', 'Hindi', 'Hinglish', 'Marathi', 'Kannada', 'Tamil', 'Telugu', 'Gujarati', 'Bengali', 'Punjabi']) {
    assert.ok(simpleSrc.includes(`'${lang}'`), `Simple Studio retains supported language: ${lang}`);
  }
  assert.ok(simpleSrc.includes('9:16 Vertical') && simpleSrc.includes('16:9 Landscape') && simpleSrc.includes('1:1 Square'));
  assert.ok(simpleSrc.includes("const SIMPLE_DURATION_OPTIONS = ['15s', '20s', '30s'];"));
  assert.ok(simpleSrc.includes('data-testid="simple-duration-segmented"'));

  // Mode-specific UX guidance: Simple Studio uses conversational, plain-language guidance
  assert.ok(simpleSrc.includes('What language should your video use?') && simpleSrc.includes('Choose the language for spoken dialogue.'));
  assert.ok(simpleSrc.includes('Where will you share your video?') && simpleSrc.includes('Choose a format that fits your platform.'));
  assert.ok(simpleSrc.includes('How long should your video be?') && simpleSrc.includes('Short videos suit quick offers; longer videos allow more storytelling.'));
  assert.ok(simpleSrc.includes('What style would you like?') && simpleSrc.includes('Choose how your product or offer should be presented.'));
  assert.ok(simpleSrc.includes('A creator speaks naturally about your product.') && simpleSrc.includes('Humorous & Fun'));

  // Director Mode stays concise & technical without beginner-oriented explanations
  const dirSettings = guidedSrc.slice(guidedSrc.indexOf('export function Screen03Settings'), guidedSrc.indexOf('export function Screen04Idea'));
  assert.ok(!dirSettings.includes('What language should your video use?') && !dirSettings.includes('Where will you share your video?'));

  // Optional Details cleanly grouped with all 4 rows in order and no noisy subtitles on collapsed rows
  const optStart = simpleSrc.indexOf('data-testid="brief-optional-details"');
  const optEnd = simpleSrc.indexOf('Generate 3 Ad Scripts');
  const optBlock = simpleSrc.slice(optStart, optEnd);
  assert.ok(optBlock.includes('Optional Details'));
  assert.ok(
    optBlock.indexOf('<TargetAudienceSection') < optBlock.indexOf('<CreativeInstructionsSection') &&
    optBlock.indexOf('<CreativeInstructionsSection') < optBlock.indexOf('<OccasionEventSection') &&
    optBlock.indexOf('<OccasionEventSection') < optBlock.indexOf('<ProductPhotoSection'),
    'Simple Studio Optional Details includes Target Audience, Creative Instructions, Occasion & Event, and Product Photo in order'
  );
  assert.ok(!instructionsSrc.includes('Rules applied across scripts and scenes'), 'Removed collapsed row subtitle in Creative Instructions');
  const occasionHeader = occasionSrc.slice(0, occasionSrc.indexOf('id="occasion-event-panel"'));
  assert.ok(!occasionHeader.includes('Creating this campaign around a festival, occasion or special event?'), 'Removed collapsed row subtitle in Occasion & Event header');
  assert.ok(audienceSrc.includes('Who is this video for? (Target Audience)'));

  // 2. Director Mode Settings hierarchy
  const settingsBlock = guidedSrc.slice(guidedSrc.indexOf('export function Screen03Settings'), guidedSrc.indexOf('export function Screen04Idea'));
  assert.ok(!settingsBlock.includes('How should it feel?'), 'Renamed How should it feel? to Creative Style');
  assert.ok(settingsBlock.includes('Creative Style') && settingsBlock.includes('Conversational') && settingsBlock.includes('UGC') && settingsBlock.includes('Product Demo') && settingsBlock.includes('Story'));
  assert.ok(!settingsBlock.includes('"Two people in dialogue."') && !settingsBlock.includes('"Feels like a real person made it."'), 'Removed quoted descriptions from Creative Style cards');
  assert.ok(settingsBlock.includes('director-settings-product-asset') && settingsBlock.includes('director-settings-logo-asset'), 'Product Photo and Logo Image kept separate and secondary');

  // StudioChoicesBar avoids redundant Settings echo while editing Settings
  assert.ok(guidedSrc.includes("currentStage === 'settings' && !hasStaleWarning") && appSrc.includes('currentStage={studioStage}'));

  // 3. Target Audience & Dictate preserve seamlessly across Simple <-> Director
  const s2d = modeTransfer.transferSimpleToDirector({
    simpleState: {
      brief: 'Monsoon rainwear offer',
      targetAudience: 'Daily scooter commuters',
      language: 'English',
      creativeStyle: 'UGC / Creator-style',
      duration: '20s',
      aspectRatio: '9:16',
    },
    currentUserContext: { businessName: 'RideSafe Gear' },
  });
  assert.equal(s2d.userContext.targetAudience, 'Daily scooter commuters');
  const d2s = modeTransfer.transferDirectorToSimple({ userContext: s2d.userContext });
  assert.equal(d2s.simpleDraft.targetAudience, 'Daily scooter commuters');

  // 4. All Simple Studio languages, creative styles, dimensions & durations persist & switch without loss
  const drafts = require('../src/utils/drafts.js');
  const languages = ['English', 'Hindi', 'Hinglish', 'Marathi', 'Kannada', 'Tamil', 'Telugu', 'Gujarati', 'Bengali', 'Punjabi'];
  const styles = ['UGC / Creator-style', 'Product Demo', 'Situational Comedy', 'Storytelling'];
  const ratios = ['9:16', '16:9', '1:1'];
  const durations = ['15s', '20s', '30s'];
  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i];
    const st = styles[i % styles.length];
    const ratio = ratios[i % ratios.length];
    const dur = durations[i % durations.length];

    const built = drafts.buildDraftProject({
      id: `proj_matrix_${i}`,
      businessName: 'RideSafe Gear',
      studio: 'simple',
      simple: { step: 1, brief: 'Raincoat combo deal', language: lang, creativeStyle: st, aspectRatio: ratio, duration: dur },
    });
    const resumed = drafts.resumeTargetOf(built);
    assert.equal(resumed.studio, 'simple');
    assert.equal(resumed.simpleStep, 1);
    assert.equal(built.creativeDNA.draft.simple.language, lang);
    assert.equal(built.creativeDNA.draft.simple.creativeStyle, st);
    assert.equal(built.creativeDNA.draft.simple.aspectRatio, ratio);
    assert.equal(built.creativeDNA.draft.simple.duration, dur);

    const toDir = modeTransfer.transferSimpleToDirector({
      simpleState: built.creativeDNA.draft.simple,
      currentUserContext: { businessName: 'RideSafe Gear' },
    });
    assert.equal(toDir.userContext.language, lang);
    assert.equal(toDir.userContext.creativeStyle, st);
    assert.equal(toDir.userContext.aspectRatio, ratio);
    assert.equal(toDir.userContext.duration, dur);

    const backToSimple = modeTransfer.transferDirectorToSimple({ userContext: toDir.userContext });
    assert.equal(backToSimple.simpleDraft.language, lang);
    assert.equal(backToSimple.simpleDraft.creativeStyle, st);
    assert.equal(backToSimple.simpleDraft.aspectRatio, ratio);
    assert.equal(backToSimple.simpleDraft.duration, dur);
  }
});

test('Director Mode Compact Video Settings Redesign: dropdown language, compact dimensions, segmented duration & name-only styles', () => {
  const guidedSrc = fs.readFileSync(path.join(ROOT, 'src/components/GuidedStudio.jsx'), 'utf8');
  const simpleSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/SimpleBusinessStudio.jsx'), 'utf8');
  const modeTransfer = require('../src/utils/modeTransfer.js');
  const drafts = require('../src/utils/drafts.js');

  const dirSettings = guidedSrc.slice(guidedSrc.indexOf('export function Screen03Settings'), guidedSrc.indexOf('export function Screen04Idea'));

  // 1. Language dropdown with all 11 supported languages including Malayalam
  assert.ok(dirSettings.includes('<select') && dirSettings.includes('data-testid="director-language-select"'));
  for (const lang of ['English', 'Hindi', 'Hinglish', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi']) {
    assert.ok(dirSettings.includes(`'${lang}'`), `Director Mode supports ${lang}`);
  }

  // 2. Video Dimension: aspect-ratio visual frames + 3 compact labels only (no platform subtitles)
  assert.ok(dirSettings.includes('data-testid="director-dimension-group"'));
  assert.ok(dirSettings.includes('9:16 Vertical') && dirSettings.includes('16:9 Landscape') && dirSettings.includes('1:1 Square'));
  assert.ok(!dirSettings.includes('Reels · Shorts · TikTok') && !dirSettings.includes('YouTube · Website · TV'));

  // 3. Video Length: horizontal segmented control (15s, 20s Popular, 30s)
  assert.ok(dirSettings.includes('data-testid="director-duration-segmented"'));
  assert.ok(dirSettings.includes('director-duration-option-${dur.id}'));
  assert.ok(!dirSettings.includes('Punchy promo') && !dirSettings.includes('Balanced story') && !dirSettings.includes('Full story + product proof'));

  // 4. Creative Style: 4 compact tiles, names only, preserving exact internal IDs
  assert.ok(dirSettings.includes('data-testid="director-style-group"'));
  assert.ok(dirSettings.includes("id: 'Conversational / Dialogue', label: 'Conversational'"));
  assert.ok(dirSettings.includes("id: 'UGC / Creator-style', label: 'UGC'"));
  assert.ok(dirSettings.includes("id: 'Product Demo', label: 'Product Demo'"));
  assert.ok(dirSettings.includes("id: 'Storytelling', label: 'Story'"));
  assert.ok(!dirSettings.includes('Two-person banter') && !dirSettings.includes('Real-person creator style'));

  // 5. Optional Assets: Product Photo & Logo Image in compact two-column grid with Upload / Replace / Remove
  assert.ok(dirSettings.includes('director-settings-product-asset') && dirSettings.includes('director-settings-logo-asset'));
  assert.ok(dirSettings.includes('Upload product photo') && dirSettings.includes('Upload logo image'));
  assert.ok(dirSettings.includes('Replace') && dirSettings.includes('Remove'));

  // 6. Simple Studio guided presentation untouched
  assert.ok(simpleSrc.includes('What language should your video use?') && simpleSrc.includes('What style would you like?'));

  // 7. Malayalam & Conversational transfer + draft restoration
  const d2sMal = modeTransfer.transferDirectorToSimple({
    userContext: {
      brief: 'Onam silk showcase',
      language: 'Malayalam',
      creativeStyle: 'Conversational / Dialogue',
      aspectRatio: '16:9',
      targetDuration: '30s',
      productPhoto: { name: 'kasavu.jpg', mime: 'image/jpeg', data: 'ABC' },
    },
  });
  assert.equal(d2sMal.simpleDraft.language, 'Malayalam');
  assert.equal(d2sMal.simpleDraft.creativeStyle, 'Conversational / Dialogue');
  assert.equal(d2sMal.simpleDraft.aspectRatio, '16:9');
  assert.equal(d2sMal.simpleDraft.duration, '30s');

  const guidedDraft = drafts.buildDraftProject({
    id: 'proj_dir_1',
    businessName: 'Kasavu Looms',
    studio: 'guided',
    guided: {
      currentStage: 'settings',
      context: {
        brief: 'Onam silk showcase',
        language: 'Malayalam',
        creativeStyle: 'Conversational / Dialogue',
        aspectRatio: '16:9',
        targetDuration: '30s',
      },
    },
  });
  const resumedGuided = drafts.resumeTargetOf(guidedDraft);
  assert.equal(resumedGuided.studio, 'guided');
  assert.equal(resumedGuided.stage, 'settings');
  assert.equal(guidedDraft.creativeDNA.draft.guided.context.language, 'Malayalam');
  assert.equal(guidedDraft.creativeDNA.draft.guided.context.creativeStyle, 'Conversational / Dialogue');
});

test('My Projects Bulk Management & Business Grouping: grouping, sorting, pagination & UI contracts', () => {
  const projectLib = require('../src/utils/projectLibrary.js');
  const libSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/ScriptLibraryView.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.jsx'), 'utf8');

  // 1. Business grouping uses stored businessId & resolves names from live businesses; never infers from titles
  const businesses = [
    { id: 'biz_nike', businessName: 'Nike', businessType: 'Sportswear' },
    { id: 'biz_gaur', name: 'Gauraiyaa', category: 'Apparel' },
  ];
  const sampleProjects = [
    { id: 'p1', title: 'Air Max Launch', businessId: 'biz_nike', businessName: 'Old Nike Name', updatedAt: '2026-11-12T10:00:00Z', createdAt: '2026-11-01T10:00:00Z' },
    { id: 'p2', title: 'Pegasus Promo', businessId: 'biz_nike', updatedAt: '2026-11-11T10:00:00Z', createdAt: '2026-11-02T10:00:00Z' },
    { id: 'p3', title: 'Monsoon Kurta', businessId: 'biz_gaur', updatedAt: '2026-11-10T10:00:00Z', createdAt: '2026-11-03T10:00:00Z' },
    { id: 'p4', title: 'Nike should NOT match by title', businessId: null, updatedAt: '2026-11-09T10:00:00Z', createdAt: '2026-11-04T10:00:00Z' },
    { id: 'p5', title: 'Deleted Business Ref', businessId: 'biz_deleted_999', updatedAt: '2026-11-08T10:00:00Z', createdAt: '2026-11-05T10:00:00Z' },
  ];

  const groups = projectLib.groupProjectsByBusiness(sampleProjects, businesses);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].key, 'biz_nike');
  assert.equal(groups[0].name, 'Nike'); // resolved from live business profile, not stale project.businessName
  assert.equal(groups[0].projects.length, 2);
  assert.equal(groups[1].key, 'biz_gaur');
  assert.equal(groups[1].name, 'Gauraiyaa');
  assert.equal(groups[1].projects.length, 1);
  assert.equal(groups[2].key, '__other__');
  assert.equal(groups[2].name, 'Other Projects');
  assert.deepEqual(groups[2].projects.map((p) => p.id), ['p4', 'p5']);

  // 2. Sorting by Recently Updated vs Recently Created
  const byUpdated = projectLib.sortProjects(sampleProjects, 'updated');
  assert.deepEqual(byUpdated.map((p) => p.id), ['p1', 'p2', 'p3', 'p4', 'p5']);
  const byCreated = projectLib.sortProjects(sampleProjects, 'created');
  assert.deepEqual(byCreated.map((p) => p.id), ['p5', 'p4', 'p3', 'p2', 'p1']);

  // 3. Large project list (96 projects) pagination & grouping accuracy
  assert.equal(projectLib.PROJECTS_PAGE_SIZE, 24);
  const largeList = Array.from({ length: 96 }, (_, idx) => ({
    id: `proj_large_${idx + 1}`,
    title: `Campaign ${idx + 1}`,
    businessId: idx % 3 === 0 ? 'biz_nike' : idx % 3 === 1 ? 'biz_gaur' : null,
    updatedAt: new Date(Date.UTC(2026, 10, 12, 0, idx)).toISOString(),
    createdAt: new Date(Date.UTC(2026, 10, 1, 0, idx)).toISOString(),
  }));
  const largeGroups = projectLib.groupProjectsByBusiness(largeList, businesses);
  assert.equal(largeGroups.reduce((acc, g) => acc + g.projects.length, 0), 96);
  assert.equal(largeGroups.find((g) => g.key === 'biz_nike').projects.length, 32);
  assert.equal(largeGroups.find((g) => g.key === 'biz_gaur').projects.length, 32);
  assert.equal(largeGroups.find((g) => g.key === '__other__').projects.length, 32);

  // 4. UI & state contracts in ScriptLibraryView.jsx and App.jsx
  assert.ok(libSrc.includes('data-testid="projects-select-mode-btn"') && libSrc.includes('{isSelectionMode && ('));
  assert.ok(libSrc.includes('data-testid={`project-select-checkbox-${proj.id}`}') && libSrc.includes('if (isSelectionMode) {\n                  toggleProjectSelection(proj.id);\n                } else {\n                  onOpenProject(proj);\n                }'));
  assert.ok(libSrc.includes('data-testid="bulk-action-bar"') && libSrc.includes('data-testid="bulk-select-all-btn"') && libSrc.includes('data-testid="bulk-cancel-btn"') && libSrc.includes('data-testid="bulk-delete-open-btn"'));
  assert.ok(libSrc.includes('data-testid="bulk-delete-modal"') && libSrc.includes('This will permanently delete the selected projects and their associated generated content. Business profiles will not be affected.'));
  assert.ok(libSrc.includes('data-testid="projects-view-switch"') && libSrc.includes('By Business') && libSrc.includes('All Projects'));
  assert.ok(libSrc.includes('data-testid="projects-sort-select"') && libSrc.includes('Recently Updated') && libSrc.includes('Recently Created'));
  assert.ok(libSrc.includes('data-testid="projects-load-more-btn"') && libSrc.includes('Show more in {grp.name}'));
  assert.ok(libSrc.includes('}, [currentUser?.id])') && libSrc.includes('const validSet = new Set(filteredProjects.map((p) => p.id))'));
  assert.ok(libSrc.includes('handleCopyScript(e, proj)') && libSrc.includes('onDeleteProject(proj.id)') && libSrc.includes('Resume in Studio'));
  assert.ok(appSrc.includes('const handleBulkDeleteProjects = async') && appSrc.includes('onBulkDeleteProjects={handleBulkDeleteProjects}'));
});

test('My Projects Bulk Delete API: auth, ownership isolation, partial failures, persistence & intact businesses', async () => {
  const os = require('os');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-bulk-del-'));
  const prevDataDir = process.env.DATA_DIR;
  process.env.DATA_DIR = tmpDir;

  // Freshly require server & db with isolated temp DATA_DIR
  for (const mod of ['../engine/db.js', '../engine/email.js', '../server.js']) {
    try { delete require.cache[require.resolve(mod)]; } catch {}
  }

  let server;
  let emailService;
  let baseUrl = '';
  try {
    emailService = require('../engine/email.js');
    emailService.setCustomResendClient({
      emails: { send: async () => ({ data: { id: 'mock_bulk_msg_id' }, error: null }) },
    });
    const { app } = require('../server.js');
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const reqJson = async (method, urlPath, body, token) => {
      const res = await fetch(`${baseUrl}${urlPath}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      const json = await res.json().catch(() => ({}));
      return { status: res.status, body: json };
    };

    // 1. Unauthenticated request rejected with 401
    const unauth = await reqJson('POST', '/api/projects/bulk-delete', { projectIds: ['p1'] });
    assert.equal(unauth.status, 401);

    // 2. Register & log in User A & User B
    await reqJson('POST', '/api/auth/signup', { email: 'bulka@example.com', password: 'password123', name: 'Owner A' });
    await reqJson('POST', '/api/auth/signup', { email: 'bulkb@example.com', password: 'password123', name: 'Owner B' });
    const uA = await reqJson('POST', '/api/auth/login', { email: 'bulka@example.com', password: 'password123' });
    const uB = await reqJson('POST', '/api/auth/login', { email: 'bulkb@example.com', password: 'password123' });
    const tokenA = uA.body.token;
    const tokenB = uB.body.token;
    assert.ok(tokenA && tokenB);

    // 3. Invalid payload returns 400
    const badReq = await reqJson('POST', '/api/projects/bulk-delete', { projectIds: [] }, tokenA);
    assert.equal(badReq.status, 400);

    // 4. User A creates a business & 3 projects; User B creates 1 project
    const bizRes = await reqJson('POST', '/api/businesses', { id: 'biz_a1', businessName: 'Nike Studio', businessType: 'Retail' }, tokenA);
    assert.equal(bizRes.status, 200);

    await reqJson('POST', '/api/projects', { id: 'proj_a1', title: 'A1', businessId: 'biz_a1', businessName: 'Nike Studio' }, tokenA);
    await reqJson('POST', '/api/projects', { id: 'proj_a2', title: 'A2', businessId: 'biz_a1', businessName: 'Nike Studio' }, tokenA);
    await reqJson('POST', '/api/projects', { id: 'proj_a3', title: 'A3', businessId: 'biz_a1', businessName: 'Nike Studio' }, tokenA);
    await reqJson('POST', '/api/projects', { id: 'proj_b1', title: 'B1', businessName: 'Other Owner Brand' }, tokenB);

    // 5. Cross-tenant bulk delete reports partial success & leaves User B's project untouched
    const partialRes = await reqJson('POST', '/api/projects/bulk-delete', { projectIds: ['proj_a1', 'proj_a2', 'proj_b1'] }, tokenA);
    assert.equal(partialRes.status, 200);
    assert.equal(partialRes.body.status, 'partial');
    assert.deepEqual(partialRes.body.deletedIds, ['proj_a1', 'proj_a2']);
    assert.deepEqual(partialRes.body.notDeletedIds, ['proj_b1']);

    // 6. Reloading projects & businesses confirms deleted projects stay gone and business profile is untouched
    const listA = await reqJson('GET', '/api/projects', undefined, tokenA);
    assert.deepEqual(listA.body.projects.map((p) => p.id), ['proj_a3']);
    const listB = await reqJson('GET', '/api/projects', undefined, tokenB);
    assert.deepEqual(listB.body.projects.map((p) => p.id), ['proj_b1']);
    const bizA = await reqJson('GET', '/api/businesses', undefined, tokenA);
    assert.equal(bizA.body.businesses.length, 1);
    assert.equal(bizA.body.businesses[0].id, 'biz_a1');

    // 7. Full deletion returns success
    const fullRes = await reqJson('POST', '/api/projects/bulk-delete', { projectIds: ['proj_a3'] }, tokenA);
    assert.equal(fullRes.status, 200);
    assert.equal(fullRes.body.status, 'success');
    assert.deepEqual(fullRes.body.deletedIds, ['proj_a3']);

    // 8. Re-deleting missing/unowned IDs returns 404
    const noneRes = await reqJson('POST', '/api/projects/bulk-delete', { projectIds: ['proj_a3', 'proj_b1'] }, tokenA);
    assert.equal(noneRes.status, 404);
  } finally {
    if (emailService) emailService.resetCustomResendClient();
    if (server) await new Promise((resolve) => server.close(resolve));
    for (const mod of ['../engine/db.js', '../engine/email.js', '../server.js']) {
      try { delete require.cache[require.resolve(mod)]; } catch {}
    }
    if (prevDataDir === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = prevDataDir;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
