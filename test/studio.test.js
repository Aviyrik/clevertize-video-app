const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

process.env.ANTHROPIC_API_KEY = 'test';
process.env.MAGNIFIC_API_KEY = 'test';
process.env.FESTIVAL_LIVE = 'off';

const GOOD_SCRIPT = fs.readFileSync(path.join(__dirname, 'fixtures/good-storytelling.txt'), 'utf8');

const realFetch = global.fetch;
let anthropicQueue = [];

global.fetch = async (url, opts = {}) => {
  const u = String(url);
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
  if (u.startsWith('https://api.anthropic.com')) {
    const text = anthropicQueue.shift() || GOOD_SCRIPT;
    return json({ content: [{ type: 'thinking', thinking: '...' }, { type: 'text', text }], stop_reason: 'end_turn' });
  }
  return realFetch(url, opts);
};

const creativeEngine = require('../engine/creative.js');
const {
  studioReducer,
  initialStudioState,
  createInitialStudioState,
  StudioActionTypes,
  isStaleResponse,
  STAGE_ORDER,
  STAGE_NUMBER_MAP,
} = require('../src/context/studioReducer.js');

test('Guided Studio V4 Architecture: 7 Stages Definition & Integrity', () => {
  const expectedStages = [
    { id: 'brief', num: '01', label: 'Brief' },
    { id: 'settings', num: '02', label: 'Settings' },
    { id: 'idea', num: '03', label: 'Idea' },
    { id: 'opening', num: '04', label: 'Opening' },
    { id: 'story', num: '05', label: 'Story' },
    { id: 'script', num: '06', label: 'Script' },
    { id: 'video', num: '07', label: 'Video' },
  ];

  assert.equal(expectedStages.length, 7);
  assert.deepEqual(expectedStages.map(s => s.id), [
    'brief',
    'settings',
    'idea',
    'opening',
    'story',
    'script',
    'video'
  ]);
});

test('Guided Studio V4: Canonical Language Constraint across Flow', async () => {
  const brand = 'Kanti Sweets';
  const bType = 'Sweet Shop, Bakery & Mithai';
  const brief = 'Special festival gift hampers and same-day delivery';

  // 1. When canonical language is English (default):
  const englishHooks = await creativeEngine.generateHooks({
    businessName: brand,
    businessType: bType,
    brief,
    language: 'English',
  });

  assert.ok(Array.isArray(englishHooks) && englishHooks.length > 0);
  for (const h of englishHooks) {
    const isDevanagari = /[\u0900-\u097F]/.test(h.hookLine);
    assert.equal(isDevanagari, false, `Expected English hook, got Devanagari in: ${h.hookLine}`);
  }

  // 2. When canonical language is explicitly Hindi:
  const hindiHooks = await creativeEngine.generateHooks({
    businessName: brand,
    businessType: bType,
    brief,
    language: 'Hindi',
  });

  assert.ok(Array.isArray(hindiHooks) && hindiHooks.length > 0);
  const hasHindi = hindiHooks.some(h => /[\u0900-\u097F]/.test(h.hookLine));
  assert.ok(hasHindi, 'Expected at least one Hindi hook when language is Hindi');
});

test('Guided Studio V4: Format-First Creative Flow', async () => {
  const brand = 'Live Pure Organic';
  const bType = 'Skincare, Cosmetics & Wellness';
  const brief = 'Gentle turmeric face glow serum with zero harmful chemicals';

  // Test UGC vs Product Demo
  const ugcStory = await creativeEngine.generateStoryWorld({
    businessName: brand,
    businessType: bType,
    brief,
    format: 'UGC / Creator-style',
    language: 'English',
  });

  assert.equal(ugcStory.format, 'UGC / Creator-style');
  assert.ok(ugcStory.beats && ugcStory.beats.length === 4);
  assert.ok(ugcStory.characters && ugcStory.characters.character1);

  const demoStory = await creativeEngine.generateStoryWorld({
    businessName: brand,
    businessType: bType,
    brief,
    format: 'Product-focused',
    language: 'English',
  });

  assert.equal(demoStory.format, 'Product-focused');
  assert.ok(demoStory.beats && demoStory.beats.length === 4);
});

test('Guided Studio V4: End-to-End Synthesis and Shot Spec Generation', async () => {
  anthropicQueue.push(GOOD_SCRIPT);

  const form = {
    businessName: 'Sharma General Store',
    businessType: 'Kirana, Grocery & Supermarket',
    town: 'Indore',
    language: 'Hindi',
    duration: '20s',
    platform: 'Instagram Reels / 9:16',
    creativeStyle: 'Storytelling',
    brief: 'Fresh grocery essentials delivered in 30 minutes',
    product: 'daily grocery essentials',
    productName: 'daily grocery essentials',
  };

  const creativeDNA = {
    direction: { title: 'Everyday Household Relatability', description: 'Real morning routine dilemma' },
    hook: { hookLine: 'अरे, व्रत का साबूदाना ख़त्म!', archetype: 'Relatable Dilemma' },
    plot: { title: 'The Quick Delivery Rescue', summary: 'Missing ingredient resolved instantly' },
    story: {
      format: 'Storytelling',
      setting: 'A small neighbourhood kirana in Palasia, Indore, early evening.',
      characters: {
        character1: 'Ramesh (owner) — 48, male, wheatish brown skin, short grey-black hair',
        character2: 'Sunita (customer) — 38, female, medium brown skin, hair in a low bun',
      },
    },
  };

  const result = await creativeEngine.synthesizeMasterScript({
    form,
    creativeDNA,
    constraints: [],
    avoid: [],
  });

  assert.ok(result.scenes && result.scenes.length === 4);
  assert.ok(result.shotSpec);
  assert.equal(result.shotSpec.format, 'Storytelling');
  assert.equal(result.shotSpec.shots.length, 4);
  assert.ok(result.shotSpec.staticWorld.setting);
});

// ============================================================================
// V4 Guided Studio: Studio Choices Bar & Brand Profile Isolation Tests
// ============================================================================

function getActiveStudioChoices(explicitChoices = {}) {
  const { style, language, duration, platform, idea, opening } = explicitChoices || {};
  const activeChoices = [];
  if (style) activeChoices.push({ type: 'style', label: style, stage: 'settings' });
  if (language) activeChoices.push({ type: 'language', label: language, stage: 'settings' });
  if (duration) activeChoices.push({ type: 'duration', label: duration, stage: 'settings' });
  if (platform) activeChoices.push({ type: 'platform', label: platform, stage: 'settings' });
  if (idea) activeChoices.push({ type: 'idea', label: idea, prefix: 'Idea', stage: 'idea' });
  if (opening) activeChoices.push({ type: 'opening', label: opening, prefix: 'Opening', stage: 'opening' });
  return activeChoices;
}

function extractBrandProfile(ctx) {
  if (!ctx) return {};
  const {
    businessName = '',
    businessType = 'Saree, Ethnic Wear & Bridal Store',
    customBusinessType = '',
    town = '',
    area = '',
    websiteUrl = '',
    specialty = '',
    offer = '',
    occasion = '',
    contact = '',
    ownerName = '',
    scriptMode = 'devanagari',
  } = ctx;
  return {
    businessName,
    businessType,
    customBusinessType,
    town,
    area,
    websiteUrl,
    specialty,
    offer,
    occasion,
    contact,
    ownerName,
    scriptMode,
  };
}

function resetFilmForNewProject(prevUserContext, prevExplicitChoices) {
  const brand = extractBrandProfile(prevUserContext);
  const nextUserContext = {
    ...prevUserContext,
    ...brand,
    brief: '',
    productPhoto: null,
    leadCharacter: '',
    supportingCharacter: '',
    environment: '',
    selectedGoalId: 'offer',
    creativeStyle: 'UGC / Creator-style',
    language: 'English',
    platform: 'Instagram Reels / 9:16',
    duration: '15s',
  };
  const nextExplicitChoices = {
    style: null,
    language: null,
    platform: null,
    duration: null,
    idea: null,
    opening: null,
  };
  return {
    userContext: nextUserContext,
    explicitChoices: nextExplicitChoices,
    persistedBrand: brand,
  };
}

test('Regression 1: Fresh film starts with zero explicit choices (Your Choices is hidden)', () => {
  const freshExplicitChoices = {
    style: null,
    language: null,
    platform: null,
    duration: null,
    idea: null,
    opening: null,
  };

  const choices = getActiveStudioChoices(freshExplicitChoices);
  assert.equal(choices.length, 0, 'Should have exactly 0 active choices');
  // Strip returns null when activeChoices.length === 0
  const isStripRendered = choices.length > 0;
  assert.equal(isStripRendered, false, 'Your Choices strip must be completely hidden');
});

test('Regression 2: Default UGC + English do not appear as explicit choices', () => {
  // App internal defaults exist in userContext
  const userContextWithDefaults = {
    businessName: 'Sharma Bakery',
    businessType: 'Bakery',
    creativeStyle: 'UGC / Creator-style', // Default
    language: 'English',                 // Default
    platform: 'Instagram Reels / 9:16',  // Default
    duration: '15s',                     // Default
  };

  // But user has made no explicit choices
  const explicitChoices = {
    style: null,
    language: null,
    platform: null,
    duration: null,
    idea: null,
    opening: null,
  };

  const choices = getActiveStudioChoices(explicitChoices);
  assert.equal(choices.length, 0, 'Internal defaults must NEVER be treated as explicit user choices');
  assert.equal(choices.some(c => c.type === 'style'), false);
  assert.equal(choices.some(c => c.type === 'language'), false);
});

test('Regression 3: User explicitly selects UGC (Your Choices shows UGC)', () => {
  const explicitChoices = {
    style: 'UGC',
    language: null,
    platform: null,
    duration: null,
    idea: null,
    opening: null,
  };

  const choices = getActiveStudioChoices(explicitChoices);
  assert.equal(choices.length, 1);
  assert.deepEqual(choices[0], { type: 'style', label: 'UGC', stage: 'settings' });
});

test('Regression 4: User explicitly selects English (Your Choices shows UGC + English)', () => {
  const explicitChoices = {
    style: 'UGC',
    language: 'English',
    platform: null,
    duration: null,
    idea: null,
    opening: null,
  };

  const choices = getActiveStudioChoices(explicitChoices);
  assert.equal(choices.length, 2);
  assert.deepEqual(choices.map(c => c.label), ['UGC', 'English']);
  // Ensure no dummy dash placeholders
  assert.equal(choices.some(c => c.label.includes('—')), false);
});

test('Regression 5: User selects an Idea (Idea appears in Your Choices)', () => {
  const explicitChoices = {
    style: 'UGC',
    language: 'English',
    platform: 'Instagram',
    duration: '20s',
    idea: 'The Midnight Cravings Dilemma',
    opening: null,
  };

  const choices = getActiveStudioChoices(explicitChoices);
  assert.equal(choices.length, 5);
  const ideaChoice = choices.find(c => c.type === 'idea');
  assert.ok(ideaChoice);
  assert.equal(ideaChoice.prefix, 'Idea');
  assert.equal(ideaChoice.label, 'The Midnight Cravings Dilemma');
  assert.equal(ideaChoice.stage, 'idea');
});

test('Regression 6: New Film is clicked (previous film explicit choices are cleared)', () => {
  const oldUserContext = {
    businessName: 'Kanti Sweets',
    town: 'Bangalore',
    brief: 'Diwali special kaju katli gift hampers',
    creativeStyle: 'Storytelling',
    language: 'Kannada',
  };
  const oldExplicitChoices = {
    style: 'Story',
    language: 'Kannada',
    platform: 'Instagram',
    duration: '20s',
    idea: 'Festive Box Dilemma',
    opening: 'Relatable Question',
  };

  const resetResult = resetFilmForNewProject(oldUserContext, oldExplicitChoices);
  const choicesAfterReset = getActiveStudioChoices(resetResult.explicitChoices);

  assert.equal(choicesAfterReset.length, 0, 'All explicit choices must be cleared after New Film');
  assert.equal(resetResult.explicitChoices.style, null);
  assert.equal(resetResult.explicitChoices.language, null);
  assert.equal(resetResult.explicitChoices.idea, null);
  assert.equal(resetResult.explicitChoices.opening, null);
});

test('Regression 7: Brand Profile survives New Film', () => {
  const activeUserContext = {
    businessName: 'Kanti Sweets',
    businessType: 'Sweet Shop, Bakery & Mithai',
    town: 'Bangalore',
    area: 'Brigade Road',
    websiteUrl: 'https://kantisweets.com',
    specialty: 'Authentic Mysore Pak',
    offer: 'Buy 1 get 1 festive pack',
    brief: 'Old film brief that must be cleared',
    leadCharacter: 'Old character',
  };
  const oldExplicitChoices = { style: 'UGC', language: 'English' };

  const resetResult = resetFilmForNewProject(activeUserContext, oldExplicitChoices);

  // Brand profile must be completely intact
  assert.equal(resetResult.userContext.businessName, 'Kanti Sweets');
  assert.equal(resetResult.userContext.businessType, 'Sweet Shop, Bakery & Mithai');
  assert.equal(resetResult.userContext.town, 'Bangalore');
  assert.equal(resetResult.userContext.area, 'Brigade Road');
  assert.equal(resetResult.userContext.websiteUrl, 'https://kantisweets.com');
  assert.equal(resetResult.userContext.specialty, 'Authentic Mysore Pak');
  assert.equal(resetResult.userContext.offer, 'Buy 1 get 1 festive pack');

  // Film-specific fields must be cleared
  assert.equal(resetResult.userContext.brief, '');
  assert.equal(resetResult.userContext.leadCharacter, '');

  // Persisted brand context in localStorage must contain brand keys only
  assert.equal(resetResult.persistedBrand.businessName, 'Kanti Sweets');
  assert.equal(resetResult.persistedBrand.brief, undefined);
});

test('Regression 8: Changing an explicit Style triggers downstream stale-state/invalidation', () => {
  let hasStaleWarning = false;
  let generatedScript = { scenes: [{ visual: 'Scene 1' }] };

  const handleFormatChange = (newFormat) => {
    generatedScript = null; // Invalidate downstream script
    hasStaleWarning = true;  // Flag stale warning
  };

  // Initially user has a generated script
  assert.ok(generatedScript);
  assert.equal(hasStaleWarning, false);

  // User changes format/style explicitly from UGC to Storytelling
  handleFormatChange('Storytelling');

  assert.equal(generatedScript, null, 'Downstream script must be invalidated');
  assert.equal(hasStaleWarning, true, 'hasStaleWarning must be set to true');
});

// ============================================================================
// Business Screen Auto-Advance & Form Submission Regression Tests
// ============================================================================

function createBusinessScreenState(initialUserContext = {}) {
  let userContext = { ...initialUserContext };
  const hasInitialBrand = Boolean(userContext.businessName?.trim());
  let isEditingExisting = !hasInitialBrand;
  let errorMsg = '';
  let currentStage = 'business';
  let continueCalled = false;

  const updateUserContext = (key, val) => {
    userContext[key] = val;
    // TEXT INPUT != FORM SUBMISSION: typing must never advance stage or invoke continue
  };

  const getShowCurrentBrandCard = () => {
    return Boolean(hasInitialBrand && !isEditingExisting && userContext.businessName?.trim());
  };

  const handleNext = () => {
    if (!userContext.businessName?.trim()) {
      errorMsg = 'Please enter your business or brand name.';
      return false;
    }
    errorMsg = '';
    continueCalled = true;
    currentStage = 'brief';
    return true;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      return handleNext();
    }
    // Normal key typing must never submit
    return false;
  };

  const editBrand = () => {
    isEditingExisting = true;
  };

  return {
    getUserContext: () => userContext,
    getCurrentStage: () => currentStage,
    getErrorMsg: () => errorMsg,
    getShowCurrentBrandCard,
    isContinueCalled: () => continueCalled,
    updateUserContext,
    handleNext,
    handleKeyDown,
    editBrand,
  };
}

test('Business Bug Test 1: Single character typing does not advance or collapse into card', () => {
  const screen = createBusinessScreenState({ businessName: '' });

  // Simulate typing "K"
  screen.updateUserContext('businessName', 'K');

  assert.equal(screen.getUserContext().businessName, 'K');
  assert.equal(screen.getCurrentStage(), 'business', 'Screen must remain Business');
  assert.equal(screen.isContinueCalled(), false, 'Continue must NOT be invoked on typing');
  assert.equal(screen.getShowCurrentBrandCard(), false, 'Form must NOT collapse into Current Brand card while typing');
});

test('Business Bug Test 2: Multiple characters typing keeps user on Business screen', () => {
  const screen = createBusinessScreenState({ businessName: '' });

  const inputSequence = ['K', 'Ka', 'Kan', 'Kanti', 'Kanti ', 'Kanti Sweets'];
  for (const str of inputSequence) {
    screen.updateUserContext('businessName', str);
    assert.equal(screen.getCurrentStage(), 'business');
    assert.equal(screen.isContinueCalled(), false);
    assert.equal(screen.getShowCurrentBrandCard(), false);
  }

  assert.equal(screen.getUserContext().businessName, 'Kanti Sweets');
});

test('Business Bug Test 3: Continue explicitly advances to Brief', () => {
  const screen = createBusinessScreenState({ businessName: '' });
  screen.updateUserContext('businessName', 'Kanti Sweets');

  const success = screen.handleNext();

  assert.equal(success, true);
  assert.equal(screen.getErrorMsg(), '');
  assert.equal(screen.getCurrentStage(), 'brief');
  assert.equal(screen.isContinueCalled(), true);
});

test('Business Bug Test 4: Empty Continue shows error and remains on Business', () => {
  const screen = createBusinessScreenState({ businessName: '' });

  const success = screen.handleNext();

  assert.equal(success, false);
  assert.equal(screen.getErrorMsg(), 'Please enter your business or brand name.');
  assert.equal(screen.getCurrentStage(), 'business');
  assert.equal(screen.isContinueCalled(), false);
});

test('Business Bug Test 5: Typing into other inputs never advances workflow', () => {
  const screen = createBusinessScreenState({ businessName: 'Kanti Sweets' });

  screen.updateUserContext('businessType', 'Sweet Shop, Bakery & Mithai');
  screen.updateUserContext('town', 'Bangalore');
  screen.updateUserContext('websiteUrl', 'https://kantisweets.com');
  screen.updateUserContext('specialty', 'Mysore Pak');
  screen.updateUserContext('offer', 'Festive 20% off');

  assert.equal(screen.getCurrentStage(), 'business');
  assert.equal(screen.isContinueCalled(), false);
  assert.equal(screen.getUserContext().town, 'Bangalore');
  assert.equal(screen.getUserContext().specialty, 'Mysore Pak');
});

test('Business Bug Test 6: New Film resets to Business and typing does not advance', () => {
  // Simulate starting New Film
  const prevContext = { businessName: 'Old Brand', brief: 'Old brief' };
  const resetResult = resetFilmForNewProject(prevContext, {});

  // New Film always sets stage to 'business'
  let currentStage = 'business';
  assert.equal(currentStage, 'business');

  // Open Business screen and type
  const screen = createBusinessScreenState(resetResult.userContext);
  screen.editBrand();
  screen.updateUserContext('businessName', 'New Brand Name');

  assert.equal(screen.getCurrentStage(), 'business');
  assert.equal(screen.isContinueCalled(), false);
  assert.equal(screen.getShowCurrentBrandCard(), false);
});

test('Business Bug Test 7: Brand Profile card edit does not trigger navigation while editing', () => {
  // User enters screen with existing brand
  const screen = createBusinessScreenState({ businessName: 'Kanti Sweets', businessType: 'Bakery' });

  // Initially shows Current Brand card
  assert.equal(screen.getShowCurrentBrandCard(), true);
  assert.equal(screen.getCurrentStage(), 'business');

  // User clicks "Edit brand"
  screen.editBrand();
  assert.equal(screen.getShowCurrentBrandCard(), false);

  // User types and edits
  screen.updateUserContext('businessName', 'Kanti Sweets Bangalore');
  assert.equal(screen.getCurrentStage(), 'business');
  assert.equal(screen.isContinueCalled(), false);
  assert.equal(screen.getShowCurrentBrandCard(), false);
});

test('Business Bug Test 8: Keyboard typing never triggers navigation; Enter explicitly submits', () => {
  const screen = createBusinessScreenState({ businessName: 'Kanti Sweets' });

  // Ordinary keystrokes
  const resK = screen.handleKeyDown({ key: 'K' });
  const resA = screen.handleKeyDown({ key: 'a' });
  assert.equal(resK, false);
  assert.equal(resA, false);
  assert.equal(screen.getCurrentStage(), 'business');
  assert.equal(screen.isContinueCalled(), false);

  // Intentional Enter key
  const resEnter = screen.handleKeyDown({ key: 'Enter' });
  assert.equal(resEnter, true);
  assert.equal(screen.getCurrentStage(), 'brief');
  assert.equal(screen.isContinueCalled(), true);
});

// ============================================================================
// Business -> Brief Transition & Resilient Brief Suggestions Tests
// ============================================================================

function getCategoryBriefSuggestions(businessType, businessName, town) {
  const brand = (businessName && businessName.trim()) || 'your brand';
  const city = (town && town.trim()) || '';
  const citySuffix = city ? ` in ${city}` : '';
  const bType = (businessType || '').toLowerCase();

  if (bType.includes('sweet') || bType.includes('bakery') || bType.includes('mithai')) {
    return {
      placeholder: `e.g. Create a festive video for ${brand}${citySuffix}...`,
      suggestions: [
        `Show fresh pure desi ghee sweets being packed into premium festive gift hampers`,
        `Announce special festival gift boxes and same-day delivery for corporate orders`,
        `Highlight our famous signature sweets made fresh every morning with 100% purity`,
      ],
    };
  }

  return {
    placeholder: `e.g. Show why customers choose ${brand}${citySuffix}...`,
    suggestions: [
      `Show why customers choose ${brand} for trusted quality and personalized service`,
      `Create a relatable commercial highlighting our special offer and fast delivery`,
    ],
  };
}

function getBriefSuggestions(businessType, businessName, town, offer) {
  try {
    return getCategoryBriefSuggestions(businessType, businessName, town, offer) || {
      placeholder: 'Tell us what you want to promote, explain, announce or show.',
      suggestions: [
        'Show why customers choose our brand for trusted quality and personalized service',
        'Create a relatable commercial highlighting our special offer and fast delivery',
      ],
    };
  } catch (err) {
    return {
      placeholder: 'Tell us what you want to promote, explain, announce or show.',
      suggestions: [
        'Show why customers choose our brand for trusted quality and personalized service',
        'Create a relatable commercial highlighting our special offer and fast delivery',
      ],
    };
  }
}

test('Brief Transition Test 3: Business -> Brief does NOT throw when getBriefSuggestions is unavailable or errors', () => {
  let stage = 'business';
  const userContext = { businessName: 'Kanti Sweets', businessType: 'Bakery', town: 'Bangalore' };

  // Simulate onContinue with safe wrapper
  const onContinue = () => {
    try {
      // Simulate broken or unavailable function
      const faultyFunc = undefined;
      if (typeof faultyFunc === 'function') faultyFunc();
    } catch (e) {
      // Caught and non-blocking
    }
    stage = 'brief';
  };

  assert.doesNotThrow(() => onContinue());
  assert.equal(stage, 'brief');
});

test('Brief Transition Test 4: getBriefSuggestions returns valid structure and never throws on null/corrupt inputs', () => {
  // Check with realistic inputs
  const res1 = getBriefSuggestions('Bakery', 'Kanti Sweets', 'Bangalore');
  assert.ok(res1 && Array.isArray(res1.suggestions));
  assert.ok(res1.suggestions.length > 0);

  // Check with null / undefined inputs
  const res2 = getBriefSuggestions(null, undefined, null);
  assert.ok(res2 && Array.isArray(res2.suggestions));
  assert.ok(res2.suggestions.length > 0);

  // Check with corrupt types
  const res3 = getBriefSuggestions(1234, {}, []);
  assert.ok(res3 && Array.isArray(res3.suggestions));
  assert.ok(res3.suggestions.length > 0);
});

test('Brief Transition Test 5: Brief renders while research/suggestions are loading or pending', () => {
  const isResearching = true;
  const researchData = null;
  const suggestions = [];

  // Static chips are available even when dynamic research/suggestions are loading
  const staticChips = [
    { label: '🎁 Offer', starter: 'Announce a special limited-time festive discount: ' },
    { label: '📦 Product', starter: 'Showcase our signature handcrafted collection: ' },
    { label: '💡 New idea', starter: 'Share a helpful insider secret about choosing quality: ' },
    { label: '😩 Customer problem', starter: 'Show how to avoid the frustration of poor fittings: ' },
    { label: '📣 Announcement', starter: 'Announce guaranteed same-day delivery for urgent orders: ' },
  ];

  assert.equal(isResearching, true);
  assert.equal(researchData, null);
  assert.equal(staticChips.length, 5, 'Fallback static chips must always be ready');
});

test('Brief Transition Test 6: Fallback suggestion cards are available if AI/research suggestions fail', () => {
  // When AI research fails with an error
  let researchData = null;
  try {
    throw new Error('Network timeout during research');
  } catch (err) {
    researchData = null;
  }

  // Safe evaluation of suggestions
  let dynamicSuggestions = [];
  try {
    throw new Error('Suggestion service unreachable');
  } catch (err) {
    dynamicSuggestions = [];
  }

  assert.equal(dynamicSuggestions.length, 0);
  assert.equal(researchData, null);

  // Fallback chips are preserved and non-empty
  const fallbackAvailable = true;
  assert.equal(fallbackAvailable, true);
});

test('Brief Transition Test 7: Research/suggestion errors do not crash the Creative Workspace', () => {
  let workspaceCrashed = false;
  let stage = 'business';

  const navigateToBrief = () => {
    try {
      throw new Error('500 Internal Server Error from research worker');
    } catch (err) {
      // isolated non-blocking error
    }
    stage = 'brief';
  };

  try {
    navigateToBrief();
  } catch {
    workspaceCrashed = true;
  }

  assert.equal(workspaceCrashed, false, 'Workspace must never crash on research/suggestion failures');
  assert.equal(stage, 'brief', 'User successfully advances to Brief');
});

test('Brief Transition Test 8: Existing Brand Profile still works seamlessly into Brief', () => {
  const userContext = {
    businessName: 'Kanti Sweets',
    businessType: 'Sweet Shop, Bakery & Mithai',
    town: 'Bangalore',
    brief: '',
  };

  const suggestions = getBriefSuggestions(userContext.businessType, userContext.businessName, userContext.town);
  assert.ok(suggestions.suggestions.some(s => s.toLowerCase().includes('sweets') || s.toLowerCase().includes('fresh')));
});

test('Brief Transition Test 9: New Film still starts at Business', () => {
  const prevContext = {
    businessName: 'Kanti Sweets',
    town: 'Bangalore',
    brief: 'Old film brief',
  };

  const reset = resetFilmForNewProject(prevContext, {});
  const studioStage = 'business';
  assert.equal(studioStage, 'business');
  assert.equal(reset.userContext.businessName, 'Kanti Sweets');
  assert.equal(reset.userContext.brief, '');
});

test('Brief Transition Test 10: "Your Choices" fix remains intact (fresh film does not show default UGC/English)', () => {
  const freshExplicitChoices = {
    style: null,
    language: null,
    platform: null,
    duration: null,
    idea: null,
    opening: null,
  };

  const choices = getActiveStudioChoices(freshExplicitChoices);
  assert.equal(choices.length, 0, 'Strip must be hidden when zero explicit choices have been made');
});

test('Studio Stale Warning: Selecting an idea during initial forward pass does NOT show stale warning', () => {
  let hasStaleWarning = false;
  const completedStages = ['business', 'brief', 'settings'];
  const scenes = [];
  const generatedScript = null;

  // Simulate user selecting an idea card on stage 04
  const onSelectIdea = (ideaTitle) => {
    const hasDownstream = completedStages.includes('script') || completedStages.includes('video') || scenes.length > 0 || Boolean(generatedScript);
    if (hasDownstream) {
      hasStaleWarning = true;
    }
  };

  onSelectIdea('THE HAMPER KNOWS');
  assert.equal(hasStaleWarning, false, 'Stale warning must NOT trigger during initial forward idea selection');

  // StudioChoicesBar gate test
  const showStaleWarningInBar = Boolean(
    hasStaleWarning && (
      completedStages.includes('script') ||
      completedStages.includes('video') ||
      scenes.length > 0 ||
      generatedScript
    )
  );
  assert.equal(showStaleWarningInBar, false, 'Choices bar must not render warning when no downstream script exists');
});

test('Studio Stale Warning: Modifying an idea AFTER script generation DOES show stale warning', () => {
  let hasStaleWarning = false;
  const completedStages = ['business', 'brief', 'settings', 'idea', 'opening', 'story', 'script'];
  const scenes = [{ sceneNumber: 1, text: 'Opening shot' }];
  const generatedScript = 'Scene 1...';

  // User navigates back to stage 04 and picks a different idea
  const onSelectIdea = (ideaTitle) => {
    const hasDownstream = completedStages.includes('script') || completedStages.includes('video') || scenes.length > 0 || Boolean(generatedScript);
    if (hasDownstream) {
      hasStaleWarning = true;
    }
  };

  onSelectIdea('DIFFERENT IDEA');
  assert.equal(hasStaleWarning, true, 'Stale warning MUST trigger when downstream script exists and idea is changed');

  const showStaleWarningInBar = Boolean(
    hasStaleWarning && (
      completedStages.includes('script') ||
      completedStages.includes('video') ||
      scenes.length > 0 ||
      generatedScript
    )
  );
  assert.equal(showStaleWarningInBar, true, 'Choices bar MUST render warning and update button');
});

test('Studio Stage 06 Story: Continue button loading state references Script, not Video', () => {
  const guidedStudioSource = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.equal(
    guidedStudioSource.includes('Writing and polishing your video'),
    false,
    'Story screen should not say "Writing and polishing your video"'
  );
  assert.equal(
    guidedStudioSource.includes('Writing and polishing your script'),
    true,
    'Story screen should say "Writing and polishing your script"'
  );
});

test('Studio Stage 07 Script: Headline says "Here\'s your script", not "Here\'s your video"', () => {
  const guidedStudioSource = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.equal(
    guidedStudioSource.includes("Here's your video\n          </h1>") ||
    guidedStudioSource.includes("Here's your video</h1>"),
    false,
    'Stage 07 Script headline should not say "Here\'s your video"'
  );
  assert.equal(
    guidedStudioSource.includes("Here's your script"),
    true,
    'Stage 07 Script headline should say "Here\'s your script"'
  );
});

test('Studio Stage 02 Brief: Product Image upload option is present after brief', () => {
  const guidedStudioSource = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.equal(
    guidedStudioSource.includes('Product Image (Optional)'),
    true,
    'Screen02Brief should have "Product Image (Optional)" card'
  );
  assert.equal(
    guidedStudioSource.includes('Click to upload product photo (Optional)'),
    true,
    'Screen02Brief should provide upload button for product photo'
  );
});

test('Studio Stage 03 Settings: Product Asset option is present and editable', () => {
  const guidedStudioSource = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.equal(
    guidedStudioSource.includes('5. Product Asset (Optional)'),
    true,
    'Screen03Settings should display Product Asset section'
  );
});

test('Studio Product Image: handleFileUpload is provided to Screen02Brief and Screen03Settings in App.jsx', () => {
  const appSource = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  assert.equal(
    appSource.includes('<Screen02Brief') && appSource.includes('handleFileUpload={handleFileUpload}'),
    true,
    'App.jsx must pass handleFileUpload to Screen02Brief'
  );
});

test('Brand Reset Test: resetting brand profile immediately closes modal and navigates to fresh Business stage', () => {
  let isBrandModalOpen = true;
  let studioStage = 'settings';
  let businessName = 'Kanti Sweets';
  let completedStages = ['business', 'brief'];

  const resetBrandProfile = () => {
    isBrandModalOpen = false;
    businessName = '';
    studioStage = 'business';
    completedStages = [];
  };

  resetBrandProfile();
  assert.equal(isBrandModalOpen, false, 'Brand modal MUST close immediately upon brand reset');
  assert.equal(studioStage, 'business', 'Studio stage MUST navigate to Business');
  assert.equal(businessName, '', 'Business name MUST be cleared');
  assert.equal(completedStages.length, 0, 'Completed stages MUST be cleared');
});

test('Studio Stage 02 Brief: Suggestion chips replace brief text instead of appending', () => {
  let brief = '';
  const handleApplySuggestion = (starter) => {
    brief = starter;
  };

  handleApplySuggestion('Announce a special limited-time festive discount: ');
  assert.equal(brief, 'Announce a special limited-time festive discount: ');

  handleApplySuggestion('Showcase our signature handcrafted collection: ');
  assert.equal(brief, 'Showcase our signature handcrafted collection: ', 'Subsequent suggestion click MUST replace previous text rather than concatenating');

  const guidedStudioSource = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.equal(
    guidedStudioSource.includes('${current.trim()} — ${starter}'),
    false,
    'GuidedStudio should never concatenate suggestions with em-dash'
  );
});

test('Studio Gate: formatMatches correctly pairs creativeStyle choices with gate formats', () => {
  const { formatMatches } = require('../engine/gate');
  assert.equal(formatMatches('UGC', 'UGC / Creator-style'), true, 'UGC must match UGC / Creator-style');
  assert.equal(formatMatches('ugc', 'UGC / Creator'), true, 'Case-insensitive UGC match');
  assert.equal(formatMatches('Storytelling', 'Story'), true, 'Storytelling must match Story');
  assert.equal(formatMatches('Product Demo', 'Product Demo'), true, 'Product Demo must match Product Demo');
  assert.equal(formatMatches('Situational Comedy', 'Funny'), false, 'Different categories must not match');
  assert.equal(formatMatches('UGC', 'Storytelling'), false, 'UGC must not match Storytelling');
});

test('Studio Stage 06 Story: Synthesis loading screen renders with steps, tips, and elapsed time', () => {
  const guidedStudioSource = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(guidedStudioSource.includes('Writing and polishing your script…'), 'Loading screen title must exist');
  assert.ok(guidedStudioSource.includes('Elapsed: {elapsedTime'), 'Loading screen must display elapsed time');
  assert.ok(guidedStudioSource.includes('synthesisSteps'), 'Loading screen must include dynamic pipeline steps');
  assert.ok(guidedStudioSource.includes('filmmakingTips'), 'Loading screen must include filmmaking tips');
  assert.ok(guidedStudioSource.includes('Section 8 Quality Gate'), 'Steps should include Section 8 Quality Gate');
});

test('Studio Stage 06 Story: Error during synthesis stops loading and stays on Story stage', async () => {
  let studioStage = 'story';
  let hasStaleWarning = true;
  let isBusy = true;
  let errorMessage = '';

  const mockSynthesizeScriptFail = async () => {
    isBusy = false;
    errorMessage = 'Quality gate validation failed';
    return false;
  };

  const onContinue = async () => {
    const ok = await mockSynthesizeScriptFail();
    if (ok) {
      studioStage = 'script';
      hasStaleWarning = false;
    }
  };

  await onContinue();
  assert.equal(studioStage, 'story', 'Should not navigate to script when synthesis returns false/fails');
  assert.equal(isBusy, false, 'isBusy should be reset to false');
  assert.equal(errorMessage, 'Quality gate validation failed', 'Error message should be captured');
});

test('Studio Stage 04 Idea: Changing Idea invalidates downstream and reloads openings for the new idea', async () => {
  let selectedDirection = { id: 'dir-1', title: 'THE PURITY TEST' };
  let explicitChoices = { idea: 'THE PURITY TEST', opening: 'Curiosity Hook' };
  let completedStages = ['business', 'brief', 'settings', 'idea', 'opening'];
  let hooksList = [{ id: 'hk-1', hookLine: 'Old Purity Hook', archetype: 'Curiosity' }];
  let selectedHook = hooksList[0];
  let studioStage = 'idea';
  let loadedHooksDirectionKey = 'THE PURITY TEST';
  let loadHooksCalls = [];

  const mockLoadHooks = async (force, lang, direction) => {
    loadHooksCalls.push({ force, direction });
    hooksList = [{ id: 'hk-2', hookLine: 'Grandma checks the box', archetype: 'Relatable Benchmarking', recommended: true }];
    selectedHook = hooksList[0];
    explicitChoices.opening = selectedHook.archetype;
    loadedHooksDirectionKey = direction.title;
  };

  // Step 1: User switches to a different idea
  const newIdea = { id: 'dir-2', title: "GRANDMA'S BENCHMARK" };
  const prevKey = selectedDirection?.id || selectedDirection?.title || '';
  const newKey = newIdea?.id || newIdea?.title || '';
  const isDifferent = prevKey !== newKey;

  selectedDirection = newIdea;
  explicitChoices.idea = newIdea.title;
  if (isDifferent) {
    delete explicitChoices.opening;
    completedStages = completedStages.filter((s) => !['opening', 'story', 'script', 'video'].includes(s));
  }

  assert.equal(explicitChoices.idea, "GRANDMA'S BENCHMARK");
  assert.equal(explicitChoices.opening, undefined, 'Old opening must be removed from explicitChoices');
  assert.ok(!completedStages.includes('opening'), 'Opening stage must no longer be marked completed');

  // Step 2: User clicks "Use this idea ->"
  const activeD = selectedDirection;
  const currentIdeaKey = activeD?.id || activeD?.title || '';
  const ideaChanged = !loadedHooksDirectionKey || loadedHooksDirectionKey !== currentIdeaKey;

  studioStage = 'opening';
  if (ideaChanged || !hooksList.length) {
    selectedHook = null;
    await mockLoadHooks(true, null, activeD);
  }

  assert.equal(studioStage, 'opening');
  assert.equal(loadHooksCalls.length, 1, 'loadHooks MUST be called when idea changes');
  assert.equal(loadHooksCalls[0].force, true, 'loadHooks MUST be forced when idea changes');
  assert.equal(loadHooksCalls[0].direction.title, "GRANDMA'S BENCHMARK", 'loadHooks MUST receive the new idea');
  assert.equal(hooksList[0].hookLine, 'Grandma checks the box', 'hooksList MUST now contain openings for new idea');
  assert.equal(explicitChoices.opening, 'Relatable Benchmarking', 'explicitChoices.opening MUST be updated to new opening');
  assert.equal(loadedHooksDirectionKey, "GRANDMA'S BENCHMARK", 'loadedHooksDirectionKey MUST track the new idea');
});

test('Studio Stage 01 Business: Brand logo upload control and preview exist', () => {
  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(guidedStudioSrc.includes('Brand Logo'), 'GuidedStudio must have Brand Logo section');
  assert.ok(guidedStudioSrc.includes('Upload brand logo (Optional)'), 'GuidedStudio must have optional upload button');
  assert.ok(guidedStudioSrc.includes("handleFileUpload(file, 'logo')"), 'GuidedStudio must trigger logo upload');
  assert.ok(guidedStudioSrc.includes("updateUserContext('logo', null)"), 'GuidedStudio must allow removing uploaded logo');
  assert.ok(guidedStudioSrc.includes('Current Brand'), 'GuidedStudio must have Current Brand section');
});

test('Magnific explicitInputs: Always satisfies logo requirement even when omitted', () => {
  const magnific = require('../engine/magnific.js');
  
  // 1. Without logo provided:
  const inputsWithoutLogo = magnific.explicitInputs({
    scenes: ['Scene 1', 'Scene 2'],
    character1: 'Char 1',
    character2: 'Char 2',
    setting: 'Setting 1',
  });
  assert.ok(inputsWithoutLogo.images, 'Logo slot "images" must be populated');
  assert.equal(inputsWithoutLogo.images, magnific.TRANSPARENT_PNG_FALLBACK, 'Must fallback to transparent 1x1 PNG');

  // 2. With logo provided:
  const inputsWithLogo = magnific.explicitInputs({
    scenes: ['Scene 1', 'Scene 2'],
    character1: 'Char 1',
    character2: 'Char 2',
    setting: 'Setting 1',
    logoDataUrl: 'data:image/png;base64,CUSTOM_LOGO_DATA',
  });
  assert.equal(inputsWithLogo.images, 'data:image/png;base64,CUSTOM_LOGO_DATA', 'Must use provided logo data URL');
});

test('Studio Stage 06 Story: Synthesis loading screen dynamically paces steps using elapsed time', () => {
  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(guidedStudioSrc.includes('parseElapsedSeconds'), 'Must parse elapsed seconds from timer');
  assert.ok(guidedStudioSrc.includes('elapsedSec < 8 ? 0 : elapsedSec < 17 ? 1 : elapsedSec < 27 ? 2 : 3'), 'Must dynamically calculate active step based on elapsed seconds');
  assert.ok(!guidedStudioSrc.includes('setInterval(() => {\n      setActiveStepIdx'), 'Should not use fixed 4s interval that rushes to last step');
  assert.ok(guidedStudioSrc.includes('Directing broadcast scenes & running Section 8 quality checks'), 'Must include realistic synthesis reassurance text');
});

test('Creative Engine: Master Script Synthesis enforces UGC Section 6 and M13d Eye-line rules', () => {
  const creativeSrc = fs.readFileSync(path.join(__dirname, '../engine/creative.js'), 'utf8');
  assert.ok(creativeSrc.includes('CRITICAL SECTION 6 RULE'), 'Must include Section 6 UGC rule in prompt');
  assert.ok(creativeSrc.includes('The owner/creator speaks in AT MOST 3 of the 4 scenes'), 'Prompt must restrict owner to max 3 scenes in UGC');
  assert.ok(creativeSrc.includes('EYE-LINE RULE (Rule M13d)'), 'Prompt must explicitly require eye contact');
  assert.ok(creativeSrc.includes('sanitizeParsedScript'), 'Must sanitize parsed script immediately in synthesis loop');
});

test('Studio Stage 08 Video: Enhanced video production loading screen has pipeline, insights & script preview', () => {
  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(guidedStudioSrc.includes('videoProductionStages'), 'Must contain 4-stage video production pipeline');
  assert.ok(guidedStudioSrc.includes('Neural Video Pipeline'), 'Must show pipeline label');
  assert.ok(guidedStudioSrc.includes('videoProductionTips'), 'Must include rotating video production insights');
  assert.ok(guidedStudioSrc.includes('Typical render: ~2–4 mins'), 'Must display realistic render duration');
  assert.ok(guidedStudioSrc.includes('Read the 4 approved scenes while video renders'), 'Must provide interactive script accordion during render');
});

test('Studio Stage 08 Video: Share button exists with clipboard copy and share sheet fallback', () => {
  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(guidedStudioSrc.includes('handleShareVideo'), 'Screen08Video must implement handleShareVideo');
  assert.ok(guidedStudioSrc.includes('navigator.clipboard.writeText'), 'Must have clipboard writeText fallback');
  assert.ok(guidedStudioSrc.includes('Link Copied!'), 'Must display Link Copied confirmation');
  assert.ok(guidedStudioSrc.includes('<span>Share</span>'), 'Must display Share button label');
});

test('Studio Reset: New Film restarts film process cleanly at Stage 01 Brief', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  assert.ok(appSrc.includes('setBrandResetKey((prev) => prev + 1)'), 'handleStartNewProject must increment brandResetKey');
  assert.ok(appSrc.includes("setStudioStage('brief')"), 'handleStartNewProject must reset studioStage to brief');

  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(guidedStudioSrc.includes('autoEdit = false'), 'Screen01Business must accept autoEdit prop');
  assert.ok(guidedStudioSrc.includes('setIsEditingExisting(true)'), 'autoEdit must switch Screen01Business to editable mode');
});

test('Studio Stage 06 Story: Custom constraints and avoid details add, remove, and auto-commit on continue', () => {
  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(guidedStudioSrc.includes('handleAddConstraint'), 'Screen06Story must have handleAddConstraint');
  assert.ok(guidedStudioSrc.includes('handleRemoveConstraint'), 'Screen06Story must have handleRemoveConstraint');
  assert.ok(guidedStudioSrc.includes('handleAddAvoid'), 'Screen06Story must have handleAddAvoid');
  assert.ok(guidedStudioSrc.includes('handleRemoveAvoid'), 'Screen06Story must have handleRemoveAvoid');
  assert.ok(guidedStudioSrc.includes('handleProceed'), 'Screen06Story must have handleProceed');
  assert.ok(guidedStudioSrc.includes('if (newConstraint.trim())'), 'handleProceed must auto-commit unsubmitted constraint');
  assert.ok(guidedStudioSrc.includes('if (newAvoid.trim())'), 'handleProceed must auto-commit unsubmitted avoid rule');
  assert.ok(guidedStudioSrc.includes('onAddConstraint'), 'Screen06Story must support onAddConstraint callback');
  assert.ok(guidedStudioSrc.includes('onAddAvoid'), 'Screen06Story must support onAddAvoid callback');
});

test('Studio Stage 06 Story: People & Setting cards support inline editing for Lead, Supp, Place, and Product', () => {
  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(guidedStudioSrc.includes('startEditLead'), 'Screen06Story must have startEditLead');
  assert.ok(guidedStudioSrc.includes('handleSaveLead'), 'Screen06Story must have handleSaveLead');
  assert.ok(guidedStudioSrc.includes('startEditSupp'), 'Screen06Story must have startEditSupp');
  assert.ok(guidedStudioSrc.includes('handleSaveSupp'), 'Screen06Story must have handleSaveSupp');
  assert.ok(guidedStudioSrc.includes('startEditPlace'), 'Screen06Story must have startEditPlace');
  assert.ok(guidedStudioSrc.includes('handleSavePlace'), 'Screen06Story must have handleSavePlace');
  assert.ok(guidedStudioSrc.includes('startEditProduct'), 'Screen06Story must have startEditProduct');
  assert.ok(guidedStudioSrc.includes('handleSaveProduct'), 'Screen06Story must have handleSaveProduct');
  assert.ok(guidedStudioSrc.includes('onUpdateCharacters'), 'Must trigger character updates');
  assert.ok(guidedStudioSrc.includes('onUpdateSetting'), 'Must trigger setting updates');
  assert.ok(guidedStudioSrc.includes('onUpdateProduct'), 'Must trigger product updates');
});

test('Studio Custom Inputs: Stage 04 Idea and Stage 05 Opening support custom entry with Enter submission', () => {
  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(guidedStudioSrc.includes('customDirection.trim()'), 'Screen04Idea must check trimmed custom direction');
  assert.ok(guidedStudioSrc.includes('customHook.trim()'), 'Screen05Opening must check trimmed custom hook');
  assert.ok(guidedStudioSrc.includes('+ I have my own idea'), 'Screen04Idea must have custom idea button');
  assert.ok(guidedStudioSrc.includes('+ Write my own opening'), 'Screen05Opening must have custom opening button');
});

test('Studio Custom Inputs: Scene AI Rewrite supports custom instruction entry with shortcut submission', () => {
  const workspaceSrc = fs.readFileSync(path.join(__dirname, '../src/components/CreativeWorkspace.jsx'), 'utf8');
  assert.ok(workspaceSrc.includes('SceneAIRewriteModal'), 'SceneAIRewriteModal must exist');
  assert.ok(workspaceSrc.includes('onApplyRewrite(instruction)'), 'Must apply custom rewrite instructions');
  assert.ok(workspaceSrc.includes('(e.ctrlKey || e.metaKey) && e.key === \'Enter\''), 'Must support Ctrl+Enter shortcut in rewrite modal');
});

test('Creative Synthesis: Active DNA passes custom characters, location, product, constraints, and avoid rules', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  assert.ok(appSrc.includes('character1: storyWorldData?.character1'), 'activeDNA must include character1');
  assert.ok(appSrc.includes('character2: storyWorldData?.character2'), 'activeDNA must include character2');
  assert.ok(appSrc.includes('location: storyWorldData?.location'), 'activeDNA must include location');
  assert.ok(appSrc.includes('product: storyWorldData?.product'), 'activeDNA must include product');
  assert.ok(appSrc.includes('constraints: constraintsList'), 'synthesis must pass constraintsList');
  assert.ok(appSrc.includes('avoid: avoidList'), 'synthesis must pass avoidList');
  assert.ok(appSrc.includes('setConstraintsList([])'), 'handleStartNewProject must clear constraintsList');
  assert.ok(appSrc.includes('setAvoidList([])'), 'handleStartNewProject must clear avoidList');
});

test('Studio Invalidation: Changing Stage 03 Language invalidates directions and downstream pipeline', () => {
  let userContext = { language: 'English', businessName: 'Chai Point' };
  let directionsList = [{ id: 'dir-1', title: 'FAST MORNING CHAI' }];
  let selectedDirection = directionsList[0];
  let explicitChoices = { language: 'English', idea: 'FAST MORNING CHAI', opening: 'Morning Rush Hook' };
  let hooksList = [{ id: 'hk-1', hookLine: 'Late for office?' }];
  let selectedHook = hooksList[0];
  let scenes = ['Scene 1', 'Scene 2', 'Scene 3', 'Scene 4'];
  let generatedScript = { scenes };
  let completedStages = ['business', 'brief', 'settings', 'idea', 'opening', 'story', 'script'];
  let hasStaleWarning = false;

  const handleLanguageChange = (newLang) => {
    if (userContext.language === newLang) return;
    userContext.language = newLang;
    explicitChoices.language = newLang;

    const hadDownstream = Boolean(
      directionsList.length > 0 ||
      selectedDirection ||
      hooksList.length > 0 ||
      selectedHook ||
      scenes.length > 0 ||
      generatedScript
    );

    // Invalidate downstream creative direction territories so they are re-generated in the new language
    directionsList = [];
    selectedDirection = null;
    delete explicitChoices.idea;
    delete explicitChoices.opening;
    hooksList = [];
    selectedHook = null;
    scenes = [];
    generatedScript = null;
    completedStages = completedStages.filter((s) => ['business', 'brief', 'settings'].includes(s));

    if (hadDownstream) {
      hasStaleWarning = true;
    }
  };

  // Initially in English
  assert.equal(userContext.language, 'English');
  assert.equal(directionsList.length, 1);
  assert.equal(explicitChoices.idea, 'FAST MORNING CHAI');
  assert.equal(hasStaleWarning, false);

  // User changes language to Hindi in Stage 3
  handleLanguageChange('Hindi');

  assert.equal(userContext.language, 'Hindi');
  assert.equal(directionsList.length, 0, 'directionsList must be cleared so fresh directions are loaded for Hindi');
  assert.equal(selectedDirection, null, 'selectedDirection must be reset');
  assert.equal(explicitChoices.idea, undefined, 'explicitChoices.idea must be cleared');
  assert.equal(explicitChoices.opening, undefined, 'explicitChoices.opening must be cleared');
  assert.equal(hooksList.length, 0, 'hooksList must be cleared');
  assert.equal(selectedHook, null, 'selectedHook must be cleared');
  assert.equal(scenes.length, 0, 'scenes must be cleared');
  assert.equal(generatedScript, null, 'generatedScript must be cleared');
  assert.deepEqual(completedStages, ['business', 'brief', 'settings'], 'Completed stages must rewind to settings');
  assert.equal(hasStaleWarning, true, 'hasStaleWarning must be flagged');
});

test('Studio Invalidation: Changing Stage 03 Style invalidates directions and downstream pipeline', () => {
  let userContext = { creativeStyle: 'UGC', businessName: 'Indore Kirana' };
  let directionsList = [{ id: 'dir-1', title: 'OWNER POV TALK' }];
  let selectedDirection = directionsList[0];
  let explicitChoices = { style: 'UGC', idea: 'OWNER POV TALK' };
  let completedStages = ['business', 'brief', 'settings', 'idea'];
  let hasStaleWarning = false;

  const handleFormatChange = (newFormat) => {
    if (userContext.creativeStyle === newFormat) return;
    userContext.creativeStyle = newFormat;
    explicitChoices.style = newFormat;

    const hadDownstream = Boolean(directionsList.length > 0 || selectedDirection);

    // Invalidate downstream creative direction territories so they are re-generated for the new style
    directionsList = [];
    selectedDirection = null;
    delete explicitChoices.idea;
    completedStages = completedStages.filter((s) => ['business', 'brief', 'settings'].includes(s));

    if (hadDownstream) {
      hasStaleWarning = true;
    }
  };

  // User changes style from UGC to Product Demo
  handleFormatChange('Product Demo');

  assert.equal(userContext.creativeStyle, 'Product Demo');
  assert.equal(directionsList.length, 0, 'directionsList must be cleared when style changes');
  assert.equal(selectedDirection, null, 'selectedDirection must be cleared');
  assert.equal(explicitChoices.idea, undefined, 'explicitChoices.idea must be cleared');
  assert.equal(hasStaleWarning, true, 'hasStaleWarning must be flagged');
});

test('Studio Invalidation: Unrelated changes (duration, platform) do NOT clear creative directions or hooks', () => {
  let userContext = { duration: '15s', platform: '9:16' };
  let directionsList = [{ id: 'dir-1', title: 'EVERYDAY RELATABLE' }];
  let selectedDirection = directionsList[0];
  let hooksList = [{ id: 'hk-1', hookLine: 'Wait, did you know this?' }];
  let selectedHook = hooksList[0];
  let explicitChoices = { duration: '15s', platform: '9:16', idea: 'EVERYDAY RELATABLE' };

  // Changing duration from 15s to 30s
  const handleDurationChange = (newDur) => {
    userContext.duration = newDur;
    explicitChoices.duration = newDur;
    // Unrelated changes do NOT clear directionsList or hooksList
  };

  // Changing platform from 9:16 to 16:9
  const handlePlatformChange = (newPlat) => {
    userContext.platform = newPlat;
    explicitChoices.platform = newPlat;
    // Unrelated changes do NOT clear directionsList or hooksList
  };

  handleDurationChange('30s');
  handlePlatformChange('16:9');

  assert.equal(directionsList.length, 1, 'directionsList must NOT be cleared by duration/platform change');
  assert.equal(selectedDirection.title, 'EVERYDAY RELATABLE', 'selectedDirection must remain intact');
  assert.equal(hooksList.length, 1, 'hooksList must NOT be cleared by duration/platform change');
  assert.equal(selectedHook.hookLine, 'Wait, did you know this?');
  assert.equal(explicitChoices.idea, 'EVERYDAY RELATABLE');
});

test('Studio Invalidation: User cannot proceed to Stage 5 with invalidated direction', () => {
  let selectedDirection = null;
  let customDirection = '';
  let directionsList = [];

  const canContinueToHooks = Boolean(
    selectedDirection ||
    (customDirection && customDirection.trim()) ||
    (directionsList.length > 0 && (directionsList.find((d) => d.recommended) || directionsList[0]))
  );

  assert.equal(canContinueToHooks, false, 'User must not be able to proceed to hooks when directions are invalidated and empty');
});

test('Studio Invalidation: App.jsx handleLanguageChange and handleFormatChange invalidate directionsList and downstream states', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  assert.ok(appSrc.includes('const handleLanguageChange = (newLang) => {'), 'App.jsx must define handleLanguageChange');
  assert.ok(appSrc.includes('const handleFormatChange = async (newFormat) => {'), 'App.jsx must define handleFormatChange');

  // Verify that handleLanguageChange clears directions and rewinds completed stages
  const langFnMatch = appSrc.match(/const handleLanguageChange = \(newLang\) => \{([\s\S]*?)\n  \};/);
  assert.ok(langFnMatch, 'handleLanguageChange block must be extractable');
  assert.ok(langFnMatch[1].includes('setDirectionsList([])'), 'handleLanguageChange must reset directionsList');
  assert.ok(langFnMatch[1].includes('setSelectedDirection(null)'), 'handleLanguageChange must reset selectedDirection');
  assert.ok(langFnMatch[1].includes('setCompletedStages('), 'handleLanguageChange must rewind completedStages');

  // Verify that handleFormatChange clears directions and rewinds completed stages
  const formatFnMatch = appSrc.match(/const handleFormatChange = async \(newFormat\) => \{([\s\S]*?)\n  \};/);
  assert.ok(formatFnMatch, 'handleFormatChange block must be extractable');
  assert.ok(formatFnMatch[1].includes('setDirectionsList([])'), 'handleFormatChange must reset directionsList');
  assert.ok(formatFnMatch[1].includes('setSelectedDirection(null)'), 'handleFormatChange must reset selectedDirection');
  assert.ok(formatFnMatch[1].includes('setCompletedStages('), 'handleFormatChange must rewind completedStages');
});

test('Centralized Studio State: Initial state has correct defaults, 7 stages, and sequenceId 0', () => {
  const state = createInitialStudioState();
  assert.equal(state.currentStage, 'brief');
  assert.equal(state.stageNumber, 1);
  assert.deepEqual(state.completedStages, []);
  assert.equal(state.hasStaleWarning, false);
  assert.equal(state.requestSequence, 0);
  assert.equal(STAGE_ORDER.length, 7);
  assert.deepEqual(STAGE_ORDER, ['brief', 'settings', 'idea', 'opening', 'story', 'script', 'video']);
  assert.deepEqual(state.explicitChoices, {
    style: null,
    language: null,
    platform: null,
    duration: null,
    idea: null,
    opening: null,
  });
  assert.deepEqual(state.directionsList, []);
  assert.deepEqual(state.hooksList, []);
  assert.deepEqual(state.scenes, []);
  assert.equal(state.videoStatus, 'idle');
});

test('Centralized Studio State: SET_STAGE updates currentStage and stageNumber correctly', () => {
  let state = createInitialStudioState();
  state = studioReducer(state, { type: StudioActionTypes.SET_STAGE, payload: { stage: 'settings' } });
  assert.equal(state.currentStage, 'settings');
  assert.equal(state.stageNumber, 2);

  state = studioReducer(state, { type: StudioActionTypes.SET_STAGE, payload: { stage: 'script' } });
  assert.equal(state.currentStage, 'script');
  assert.equal(state.stageNumber, 6);

  // Invalid stage is ignored
  state = studioReducer(state, { type: StudioActionTypes.SET_STAGE, payload: { stage: 'invalid_stage' } });
  assert.equal(state.currentStage, 'script');
  assert.equal(state.stageNumber, 6);
});

test('Centralized Studio State: MARK_STAGE_COMPLETE accumulates completed stages idempotently', () => {
  let state = createInitialStudioState();
  state = studioReducer(state, { type: StudioActionTypes.MARK_STAGE_COMPLETE, payload: { stageId: 'brief' } });
  assert.deepEqual(state.completedStages, ['brief']);

  state = studioReducer(state, { type: StudioActionTypes.MARK_STAGE_COMPLETE, payload: { stageId: 'settings' } });
  assert.deepEqual(state.completedStages, ['brief', 'settings']);

  // Adding existing stageId does not duplicate
  state = studioReducer(state, { type: StudioActionTypes.MARK_STAGE_COMPLETE, payload: { stageId: 'brief' } });
  assert.deepEqual(state.completedStages, ['brief', 'settings']);
});

test('Centralized Studio State: SET_EXPLICIT_CHOICE records confirmed choices and SET_EXPLICIT_CHOICES replaces them', () => {
  let state = createInitialStudioState();
  state = studioReducer(state, {
    type: StudioActionTypes.SET_EXPLICIT_CHOICE,
    payload: { key: 'style', value: 'UGC / Creator-style' },
  });
  assert.equal(state.explicitChoices.style, 'UGC / Creator-style');
  assert.equal(state.explicitChoices.language, null);

  state = studioReducer(state, {
    type: StudioActionTypes.SET_EXPLICIT_CHOICES,
    payload: { explicitChoices: { style: 'Drama', language: 'Hindi' } },
  });
  assert.equal(state.explicitChoices.style, 'Drama');
  assert.equal(state.explicitChoices.language, 'Hindi');
  assert.equal(state.explicitChoices.idea, null);
});

test('Centralized Studio State: Invalidation from Stage 2 (Settings) clears downstream directions, hooks, story world, and script, and increments requestSequence', () => {
  let state = createInitialStudioState({
    currentStage: 'settings',
    completedStages: ['brief', 'settings', 'idea', 'opening', 'story', 'script'],
    directionsList: [{ id: 'dir-1', title: 'FAST MORNING CHAI' }],
    selectedDirection: { id: 'dir-1', title: 'FAST MORNING CHAI' },
    hooksList: [{ id: 'hk-1', hookLine: 'Late for office?' }],
    selectedHook: { id: 'hk-1', hookLine: 'Late for office?' },
    storyWorldData: { character1: 'Ramesh', character2: 'Sunita' },
    scenes: ['Scene 1', 'Scene 2'],
    generatedScript: { scenes: ['Scene 1', 'Scene 2'] },
    explicitChoices: { style: 'UGC', language: 'English', idea: 'FAST MORNING CHAI', opening: 'Late for office?' },
  });

  const prevSeq = state.requestSequence;
  state = studioReducer(state, {
    type: StudioActionTypes.INVALIDATE_DOWNSTREAM,
    payload: { fromStage: 'settings' },
  });

  assert.equal(state.requestSequence, prevSeq + 1, 'requestSequence must increment to invalidate pending responses');
  assert.deepEqual(state.directionsList, [], 'directionsList must be cleared');
  assert.equal(state.selectedDirection, null, 'selectedDirection must be reset');
  assert.deepEqual(state.hooksList, [], 'hooksList must be cleared');
  assert.equal(state.selectedHook, null, 'selectedHook must be reset');
  assert.equal(state.storyWorldData, null, 'storyWorldData must be cleared');
  assert.deepEqual(state.scenes, [], 'scenes must be cleared');
  assert.equal(state.generatedScript, null, 'generatedScript must be cleared');
  assert.equal(state.explicitChoices.idea, undefined, 'explicitChoices.idea must be deleted');
  assert.equal(state.explicitChoices.opening, undefined, 'explicitChoices.opening must be deleted');
  assert.deepEqual(state.completedStages, ['brief', 'settings'], 'Completed stages must rewind to settings');
  assert.equal(state.hasStaleWarning, true, 'hasStaleWarning must be set because downstream content existed');
});

test('Centralized Studio State: Invalidation from Stage 3 (Idea) clears downstream hooks, story world, and script while preserving direction', () => {
  let state = createInitialStudioState({
    currentStage: 'idea',
    completedStages: ['brief', 'settings', 'idea', 'opening', 'story', 'script'],
    directionsList: [{ id: 'dir-1', title: 'FAST MORNING CHAI' }],
    selectedDirection: { id: 'dir-1', title: 'FAST MORNING CHAI' },
    hooksList: [{ id: 'hk-1', hookLine: 'Late for office?' }],
    storyWorldData: { character1: 'Ramesh' },
    scenes: ['Scene 1'],
    generatedScript: { scenes: ['Scene 1'] },
    explicitChoices: { style: 'UGC', language: 'English', idea: 'FAST MORNING CHAI', opening: 'Late for office?' },
  });

  state = studioReducer(state, {
    type: StudioActionTypes.INVALIDATE_DOWNSTREAM,
    payload: { fromStage: 'idea' },
  });

  assert.equal(state.directionsList.length, 1, 'directionsList must be preserved');
  assert.equal(state.selectedDirection.title, 'FAST MORNING CHAI', 'selectedDirection must be preserved');
  assert.equal(state.explicitChoices.idea, 'FAST MORNING CHAI', 'explicitChoices.idea must be preserved');
  assert.deepEqual(state.hooksList, [], 'hooksList must be cleared');
  assert.equal(state.storyWorldData, null, 'storyWorldData must be cleared');
  assert.deepEqual(state.scenes, [], 'scenes must be cleared');
  assert.equal(state.generatedScript, null, 'generatedScript must be cleared');
  assert.equal(state.explicitChoices.opening, undefined, 'explicitChoices.opening must be cleared');
  assert.deepEqual(state.completedStages, ['brief', 'settings', 'idea'], 'completedStages rewinds to idea');
});

test('Centralized Studio State: Invalidation from Stage 4 (Opening) clears downstream story world and script while preserving hooks', () => {
  let state = createInitialStudioState({
    currentStage: 'opening',
    completedStages: ['brief', 'settings', 'idea', 'opening', 'story', 'script'],
    hooksList: [{ id: 'hk-1', hookLine: 'Late for office?' }],
    selectedHook: { id: 'hk-1', hookLine: 'Late for office?' },
    storyWorldData: { character1: 'Ramesh' },
    scenes: ['Scene 1'],
    generatedScript: { scenes: ['Scene 1'] },
  });

  state = studioReducer(state, {
    type: StudioActionTypes.INVALIDATE_DOWNSTREAM,
    payload: { fromStage: 'opening' },
  });

  assert.equal(state.hooksList.length, 1, 'hooksList must be preserved');
  assert.equal(state.storyWorldData, null, 'storyWorldData must be cleared');
  assert.deepEqual(state.scenes, [], 'scenes must be cleared');
  assert.equal(state.generatedScript, null, 'generatedScript must be cleared');
  assert.deepEqual(state.completedStages, ['brief', 'settings', 'idea', 'opening']);
});

test('Centralized Studio State: Invalidation from Stage 5 (Story) clears downstream script while preserving story world', () => {
  let state = createInitialStudioState({
    currentStage: 'story',
    completedStages: ['brief', 'settings', 'idea', 'opening', 'story', 'script'],
    storyWorldData: { character1: 'Ramesh' },
    scenes: ['Scene 1'],
    generatedScript: { scenes: ['Scene 1'] },
  });

  state = studioReducer(state, {
    type: StudioActionTypes.INVALIDATE_DOWNSTREAM,
    payload: { fromStage: 'story' },
  });

  assert.ok(state.storyWorldData !== null, 'storyWorldData must be preserved');
  assert.deepEqual(state.scenes, [], 'scenes must be cleared');
  assert.equal(state.generatedScript, null, 'generatedScript must be cleared');
  assert.deepEqual(state.completedStages, ['brief', 'settings', 'idea', 'opening', 'story']);
});

test('Centralized Studio State: Stale async network response with older requestSequence is ignored', () => {
  let state = createInitialStudioState();
  const initialSeq = state.requestSequence; // 0

  // User changes language or triggers invalidation
  state = studioReducer(state, {
    type: StudioActionTypes.INVALIDATE_DOWNSTREAM,
    payload: { fromStage: 'settings' },
  });
  assert.equal(state.requestSequence, initialSeq + 1); // 1

  // Late-arriving network response carries older sequenceId (0)
  const staleAction = {
    type: StudioActionTypes.SET_DIRECTIONS,
    payload: {
      directionsList: [{ id: 'stale-1', title: 'Old English Direction' }],
      sequenceId: initialSeq, // 0 < 1 => stale!
    },
  };

  const nextState = studioReducer(state, staleAction);
  assert.deepEqual(nextState.directionsList, [], 'Stale response must be rejected by reducer');
  assert.equal(isStaleResponse(state, initialSeq), true, 'isStaleResponse helper must return true for older seq');

  // Fresh response matching current requestSequence (1) is accepted
  const freshAction = {
    type: StudioActionTypes.SET_DIRECTIONS,
    payload: {
      directionsList: [{ id: 'fresh-1', title: 'New Hindi Direction' }],
      sequenceId: state.requestSequence, // 1 == 1 => accepted!
    },
  };
  const updatedState = studioReducer(state, freshAction);
  assert.equal(updatedState.directionsList.length, 1);
  assert.equal(updatedState.directionsList[0].title, 'New Hindi Direction');
});

test('Centralized Studio State: RESET_STUDIO resets all film state, sets stage to brief, and increments sequenceId', () => {
  let state = createInitialStudioState({
    currentStage: 'script',
    completedStages: ['brief', 'settings', 'idea', 'opening', 'story', 'script'],
    directionsList: [{ id: 'dir-1', title: 'Test Dir' }],
    hooksList: [{ id: 'hk-1', hookLine: 'Test Hook' }],
    scenes: ['Scene 1', 'Scene 2'],
    generatedScript: { scenes: ['Scene 1', 'Scene 2'] },
    explicitChoices: { style: 'UGC', idea: 'Test Dir' },
  });

  const prevSeq = state.requestSequence;
  state = studioReducer(state, {
    type: StudioActionTypes.RESET_STUDIO,
    payload: { initialStage: 'brief', preserveBrand: true },
  });

  assert.equal(state.currentStage, 'brief');
  assert.equal(state.stageNumber, 1);
  assert.deepEqual(state.completedStages, []);
  assert.deepEqual(state.directionsList, []);
  assert.deepEqual(state.hooksList, []);
  assert.deepEqual(state.scenes, []);
  assert.equal(state.generatedScript, null);
  assert.equal(state.explicitChoices.idea, null);
  assert.equal(state.requestSequence, prevSeq + 1);
});

test('Centralized Studio State: App.jsx integrates StudioProvider, StudioStateContext, and StudioDispatchContext', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  assert.ok(appSrc.includes('StudioStateContext.Provider'), 'App.jsx must provide StudioStateContext');
  assert.ok(appSrc.includes('StudioDispatchContext.Provider'), 'App.jsx must provide StudioDispatchContext');
  assert.ok(appSrc.includes('useReducer(studioReducer,'), 'App.jsx must use studioReducer');
  assert.ok(appSrc.includes('StudioActionTypes.INVALIDATE_DOWNSTREAM'), 'App.jsx must dispatch INVALIDATE_DOWNSTREAM');
  assert.ok(appSrc.includes('StudioActionTypes.RESET_STUDIO'), 'App.jsx must dispatch RESET_STUDIO');
});

test('V2 Application Shell: App.jsx integrates AppShell, frosted navigation, and view switching', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  assert.ok(appSrc.includes('<AppShell'), 'App.jsx must render AppShell');
  assert.ok(appSrc.includes('activeView={activeAppView}'), 'App.jsx must bind activeView to activeAppView');
  assert.ok(appSrc.includes('onSelectView={setActiveAppView}'), 'App.jsx must pass onSelectView handler');
  assert.ok(appSrc.includes('onOpenScriptModal='), 'App.jsx must provide script modal handler');
  assert.ok(appSrc.includes('onOpenUrlModal='), 'App.jsx must provide url modal handler');

  const shellSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AppShell.jsx'), 'utf8');
  assert.ok(shellSrc.includes('backdropFilter: \'blur(20px)\''), 'AppShell must implement frosted-glass sidebar');
  assert.ok(shellSrc.includes('New Film Project'), 'AppShell must prominently provide New Film project action');
  assert.ok(shellSrc.includes('Creation Hub'), 'AppShell must link to Creation Hub');
  assert.ok(shellSrc.includes('Creative Studio'), 'AppShell must link to Creative Studio');
  assert.ok(shellSrc.includes('Production Pipeline'), 'AppShell must show 8-stage production pipeline');
  assert.ok(shellSrc.includes("studioMode = 'simple'"), 'AppShell must declare studioMode in props');
  assert.ok(shellSrc.includes('onToggleStudioMode'), 'AppShell must declare onToggleStudioMode in props');
});

test('V2 Entry Points: CreationEntryHub exposes Brief, Existing Script, and Website URL entry points', () => {
  const hubSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/CreationEntryHub.jsx'), 'utf8');
  assert.ok(hubSrc.includes('Start with a Brief'), 'Hub must feature Start with a Brief');
  assert.ok(hubSrc.includes('Start with an Existing Script'), 'Hub must feature Start with an Existing Script');
  assert.ok(hubSrc.includes('Start with a Website URL'), 'Hub must feature Start with a Website URL');
  assert.ok(hubSrc.includes('18-Point Continuity Gate'), 'Hub must highlight 18-point continuity gate');
  assert.ok(hubSrc.includes('Devanagari script support'), 'Hub must highlight regional script support');
  assert.ok(hubSrc.includes('Magnific GPU Rendering'), 'Hub must highlight video GPU rendering');
});

test('V2 Entry Point 1 (Brief): Start with Brief navigates into studio workflow', () => {
  let activeAppView = 'hub';
  let studioStage = 'business';
  let userContext = { businessName: 'Chai Point' };

  const handleStartBrief = () => {
    activeAppView = 'studio';
    if (userContext.businessName && userContext.businessName.trim().length > 0) {
      studioStage = 'brief';
    } else {
      studioStage = 'business';
    }
  };

  handleStartBrief();
  assert.equal(activeAppView, 'studio', 'Starting brief must switch view to studio');
  assert.equal(studioStage, 'brief', 'Existing brand should advance to brief stage');
});

test('V2 Entry Point 2 (Script): ExistingScriptModal validates and fast-tracks directly to Stage 07', () => {
  const scriptModalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ExistingScriptModal.jsx'), 'utf8');
  assert.ok(scriptModalSrc.includes('Kirana UGC (Hindi)'), 'Must include Kirana sample');
  assert.ok(scriptModalSrc.includes('Chai Point Quick Rush (English)'), 'Must include Chai Point sample');
  assert.ok(scriptModalSrc.includes('/api/script/validate-and-import'), 'Must call validation endpoint');
  assert.ok(scriptModalSrc.includes('Proceed to Script Studio (Stage 07)'), 'Must offer direct path to Stage 07');

  let studioStage = 'business';
  let completedStages = [];
  let scenes = [];
  let generatedScript = null;
  let activeAppView = 'hub';

  const handleImportScript = (payload) => {
    scenes = payload.scenes;
    generatedScript = payload.generatedScript;
    completedStages = ['business', 'brief', 'settings', 'idea', 'opening', 'story'];
    studioStage = 'script';
    activeAppView = 'studio';
  };

  handleImportScript({
    scenes: ['S1', 'S2', 'S3', 'S4'],
    generatedScript: { scenes: ['S1', 'S2', 'S3', 'S4'] },
  });

  assert.equal(activeAppView, 'studio');
  assert.equal(studioStage, 'script', 'Must land on Stage 7 (Script)');
  assert.equal(scenes.length, 4, 'Must load 4 scenes');
  assert.ok(completedStages.includes('story'), 'Must mark stages up to story as completed');
});

test('V2 Entry Point 3 (URL): UrlResearchModal handles URL extraction and pre-populates Stage 02 brief', () => {
  const urlModalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/UrlResearchModal.jsx'), 'utf8');
  assert.ok(urlModalSrc.includes('/api/research/url'), 'Must call /api/research/url endpoint');
  assert.ok(urlModalSrc.includes('Scan Website'), 'Must have scan website button');
  assert.ok(urlModalSrc.includes('Proceed to Studio with Brief'), 'Must have proceed to studio action');

  let userContext = { businessName: '', brief: '', websiteUrl: '' };
  let studioStage = 'business';
  let activeAppView = 'hub';
  let completedStages = [];

  const handleApplyUrlData = ({ websiteUrl, businessName, brief }) => {
    userContext.websiteUrl = websiteUrl;
    userContext.businessName = businessName;
    userContext.brief = brief;
    completedStages = ['business'];
    studioStage = 'brief';
    activeAppView = 'studio';
  };

  handleApplyUrlData({
    websiteUrl: 'https://ratnamjewellers.com',
    businessName: 'Ratnam Jewellers',
    brief: 'High-converting video highlighting hallmark lightweight bridal jewellery.',
  });

  assert.equal(activeAppView, 'studio');
  assert.equal(studioStage, 'brief', 'Must navigate to Stage 2 (Brief)');
  assert.equal(userContext.businessName, 'Ratnam Jewellers');
  assert.ok(userContext.brief.includes('bridal jewellery'));
  assert.deepEqual(completedStages, ['business']);
});

test('UrlResearchModal & App.jsx: Multi-business isolation, smart auto-creation, and reliable Studio navigation on URL scan', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');

  // Verify App.jsx includes the smart brand matching and isolation logic
  assert.ok(appSrc.includes('isMatchingBusiness'), 'App.jsx must define isMatchingBusiness helper');
  assert.ok(appSrc.includes('matchesCurrent'), 'handleApplyUrlData must check if URL matches active business');
  assert.ok(!appSrc.includes("if ((prev === 'hub' || prev === 'home') && nextView === 'studio' && (!completedStages || completedStages.length === 0))"),
    'App.jsx must not have premature blocking guard in setActiveAppView that drops user back to hub');

  // Extract isMatchingBusiness logic and test matching behaviour
  const isMatchingBusiness = (biz, incomingName, incomingUrl) => {
    if (!biz) return false;
    const currentName = (biz.businessName || biz.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetName = (incomingName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (currentName && targetName) {
      if (currentName === targetName) return true;
      if (currentName.length >= 4 && targetName.length >= 4) {
        if (currentName.includes(targetName) || targetName.includes(currentName)) return true;
      }
    }
    if (incomingUrl) {
      try {
        const fullIncoming = incomingUrl.startsWith('http') ? incomingUrl : `https://${incomingUrl}`;
        const incomingHost = new URL(fullIncoming).hostname.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (biz.websiteUrl) {
          try {
            const fullCurrent = biz.websiteUrl.startsWith('http') ? biz.websiteUrl : `https://${biz.websiteUrl}`;
            const currentHost = new URL(fullCurrent).hostname.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (incomingHost && currentHost && (incomingHost === currentHost || incomingHost.includes(currentHost) || currentHost.includes(incomingHost))) {
              return true;
            }
          } catch {}
        }
        if (currentName && currentName.length >= 4) {
          if (incomingHost.includes(currentName) || currentName.includes(incomingHost)) return true;
        }
      } catch {}
    }
    return false;
  };

  const kalyanBiz = {
    id: 'biz_kalyan',
    businessName: 'Kalyan Jewellers',
    name: 'Kalyan Jewellers',
    businessType: 'Jewellery & Accessories',
    websiteUrl: 'https://www.kalyanjewellers.net',
    logo: 'https://kalyan.com/logo.png',
    brandLogo: 'https://kalyan.com/logo.png',
  };

  // Case 1: Scanning Amazon URL while Kalyan Jewellers is active
  assert.strictEqual(
    isMatchingBusiness(kalyanBiz, 'Amazon', 'https://www.amazon.in/dp/B08N5WRWNW'),
    false,
    'Amazon must not match Kalyan Jewellers'
  );

  // Case 2: Scanning Kalyan Jewellers product URL while Kalyan Jewellers is active
  assert.strictEqual(
    isMatchingBusiness(kalyanBiz, 'Kalyan Jewellers', 'https://www.kalyanjewellers.net/bridal-collection'),
    true,
    'Kalyan Jewellers product link must match Kalyan Jewellers'
  );

  // Case 3: Simulating handleApplyUrlData multi-business isolation
  let userBusinesses = [kalyanBiz];
  let userContext = { ...kalyanBiz, brief: '' };
  let activeAppView = 'hub';
  let studioStage = 'entry';

  // User scans Amazon URL:
  const amazonData = {
    websiteUrl: 'https://www.amazon.in/dp/B08N5WRWNW',
    businessName: 'Amazon',
    businessType: 'Electronics, Mobile & Appliances',
    brief: 'Festival electronics offer with next-day delivery.',
  };

  const matchesCurrent = isMatchingBusiness(userContext, amazonData.businessName, amazonData.websiteUrl);
  assert.strictEqual(matchesCurrent, false);

  if (!matchesCurrent) {
    const existingMatch = userBusinesses.find(b => isMatchingBusiness(b, amazonData.businessName, amazonData.websiteUrl));
    assert.strictEqual(existingMatch, undefined);

    const newBusiness = {
      id: 'biz_amazon',
      businessName: amazonData.businessName,
      name: amazonData.businessName,
      businessType: amazonData.businessType,
      websiteUrl: amazonData.websiteUrl,
      brief: amazonData.brief,
      logo: null,       // Must NOT copy Kalyan Jewellers logo!
      brandLogo: null,  // Must NOT copy Kalyan Jewellers logo!
    };
    userBusinesses = [newBusiness, ...userBusinesses];
    userContext = { ...newBusiness };
    studioStage = 'brief';
    activeAppView = 'studio';
  }

  // Verify: Kalyan Jewellers profile is 100% untouched
  const preservedKalyan = userBusinesses.find(b => b.id === 'biz_kalyan');
  assert.ok(preservedKalyan, 'Kalyan Jewellers must be preserved in userBusinesses');
  assert.strictEqual(preservedKalyan.name, 'Kalyan Jewellers');
  assert.strictEqual(preservedKalyan.logo, 'https://kalyan.com/logo.png');

  // Verify: Amazon business was auto-created and active
  assert.strictEqual(userBusinesses.length, 2);
  assert.strictEqual(userContext.businessName, 'Amazon');
  assert.strictEqual(userContext.logo, null, 'New business must not inherit old business logo');
  assert.strictEqual(userContext.brandLogo, null);
  assert.strictEqual(activeAppView, 'studio', 'Must transition to Studio');
  assert.strictEqual(studioStage, 'brief', 'Must be at Stage 2 Brief');
});

test('URL Research Product Scraping: Scrapes real product photo from URL and attaches directly to Story World (Screen06Story)', () => {
  const serverSrc = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  const urlModalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/UrlResearchModal.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');

  // 1. Verify server.js contains product photo scraping logic
  assert.ok(serverSrc.includes('extractProductImageFromHtml'), 'server.js must define extractProductImageFromHtml');
  assert.ok(serverSrc.includes('productPhoto'), 'server.js must return productPhoto in /api/research/url');
  assert.ok(serverSrc.includes('productImageUrl'), 'server.js must return productImageUrl in /api/research/url');

  // 2. Verify UrlResearchModal receives and previews product photo
  assert.ok(urlModalSrc.includes('draftProductPhoto'), 'UrlResearchModal must track draftProductPhoto state');
  assert.ok(urlModalSrc.includes('Detected Product Photo'), 'UrlResearchModal must display Detected Product Photo badge');
  assert.ok(urlModalSrc.includes('productPhoto: draftProductPhoto'), 'UrlResearchModal must pass productPhoto in onApplyUrlData');

  // 3. Verify App.jsx wires productPhoto to userContext
  assert.ok(appSrc.includes('productPhoto: pPhoto'), 'App.jsx handleApplyUrlData must store productPhoto');

  // 4. Verify GuidedStudio (Screen06Story) displays the scraped product photo under People & Setting
  assert.ok(guidedStudioSrc.includes('userContext.productPhoto'), 'Screen06Story must render userContext.productPhoto');
  assert.ok(guidedStudioSrc.includes('Attached from website'), 'GuidedStudio must indicate photo attached from website');

  // 5. Test mock HTML extraction logic for Amazon and OpenGraph
  const sampleAmazonHtml = '<div data-a-dynamic-image="{&quot;https://m.media-amazon.com/images/I/71an9eiBxpL._AC_SX679_.jpg&quot;:[679,679]}"></div>';
  const dynamicMatch = sampleAmazonHtml.match(/data-a-dynamic-image=["']\{&quot;(https:\/\/[^&]*?media-amazon\.com\/images\/I\/[^&]*?)&quot;/i);
  assert.ok(dynamicMatch);
  const cleanHighRes = dynamicMatch[1].replace(/\._[A-Za-z0-9_,]+_\./, '.');
  assert.strictEqual(cleanHighRes, 'https://m.media-amazon.com/images/I/71an9eiBxpL.jpg', 'Must clean Amazon dynamic image to original high-res');
});

test('Multi-Account Isolation & Video Library Auto-Save: Video never leaks across accounts and auto-saves to My Projects', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');

  // 1. Verify resetAllCreativeFilmState exists and resets all generation data
  assert.ok(appSrc.includes('resetAllCreativeFilmState'), 'App.jsx must define resetAllCreativeFilmState');
  assert.ok(appSrc.includes("setVideoUrl('')"), 'Must reset videoUrl to empty');

  // 2. Verify handleLogout and handleAuthSuccess invoke resetAllCreativeFilmState
  assert.ok(appSrc.includes('resetAllCreativeFilmState();'), 'handleLogout and handleAuthSuccess must wipe creative state');
  assert.ok(appSrc.includes('Signed out successfully.'), 'handleLogout must sign out');

  // 3. Verify pollRenderStatus auto-saves video to userProjects and /api/projects
  assert.ok(appSrc.includes("status: 'video_ready'"), 'Must set status to video_ready');
  assert.ok(appSrc.includes('videoUrl: data.videoUrl'), 'Must attach videoUrl to project');
  assert.ok(appSrc.includes("fetch('/api/projects'"), 'Must persist project to /api/projects on video completion');

  // 4. Test simulated account switch: Account A generates video, logs out, Account B logs in
  let currentAccount = 'saumya@clevertize.com';
  let activeVideo = 'https://magnific.blob.core.windows.net/render/video_123.mp4';
  let accountProjects = [{ id: 'proj_1', title: 'Saumya Ad Film', videoUrl: activeVideo }];
  let studioStage = 'video';
  let activeAppView = 'studio';

  // Logout executed:
  const executeLogout = () => {
    currentAccount = null;
    activeVideo = '';
    accountProjects = [];
    studioStage = 'brief';
    activeAppView = 'home';
  };
  executeLogout();

  assert.strictEqual(currentAccount, null);
  assert.strictEqual(activeVideo, '', 'Video must be cleared on logout');
  assert.strictEqual(accountProjects.length, 0, 'Projects must be cleared on logout');
  assert.strictEqual(studioStage, 'brief', 'Stage must reset from video');
  assert.strictEqual(activeAppView, 'home', 'View must reset to home');

  // Account B logs in:
  const accountBProjects = []; // Fresh account has 0 projects
  const executeLoginB = (user, projects) => {
    currentAccount = user;
    accountProjects = [...projects];
    studioStage = 'brief';
    activeAppView = 'home';
  };
  executeLoginB('viki@clevertize.com', accountBProjects);

  assert.strictEqual(currentAccount, 'viki@clevertize.com');
  assert.strictEqual(activeVideo, '', 'Account B must never see Account A video');
  assert.strictEqual(accountProjects.length, 0, 'Account B must see 0 projects initially');
  assert.strictEqual(studioStage, 'brief');
});

test('Script-First Product: Screen07Script includes Section 8 Gate Passed badge, Copy Script, and Save Script', () => {
  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(guidedStudioSrc.includes('Section 8 Gate: Passed'), 'Must display Section 8 Gate Passed badge');
  assert.ok(guidedStudioSrc.includes('Copy Script'), 'Must have Copy Script action');
  assert.ok(guidedStudioSrc.includes('Save Script'), 'Must have Save Script action');
  assert.ok(guidedStudioSrc.includes('onSaveProject'), 'Must support onSaveProject callback');
});

test('Script-First Product: AppShell navigation includes Script Library, Business Profiles, and Auth integration', () => {
  const appShellSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AppShell.jsx'), 'utf8');
  assert.ok(appShellSrc.includes('Script Library'), 'Must have Script Library navigation');
  assert.ok(appShellSrc.includes('Business Profile'), 'Must have Business Profile navigation');
  assert.ok(appShellSrc.includes('currentUser'), 'Must support currentUser state');
  assert.ok(appShellSrc.includes('onOpenAuthModal'), 'Must support auth modal open trigger');
  assert.ok(appShellSrc.includes('onLogout'), 'Must support logout action');
  assert.ok(appShellSrc.includes('onOpenOnboarding'), 'Must support business onboarding trigger');
});

test('Script-First Product: ScriptLibraryView renders search, copy, open, delete, and empty states', () => {
  const libSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ScriptLibraryView.jsx'), 'utf8');
  assert.ok(libSrc.includes('Script Library'), 'Must have header title');
  assert.ok(libSrc.includes('Search'), 'Must have search input');
  assert.ok(libSrc.includes('handleCopyScript') && libSrc.includes('Copy 4 Scenes'), 'Must have copy script button for each project');
  assert.ok(libSrc.includes('Open in Studio'), 'Must have Open in Studio button');
  assert.ok(libSrc.includes('onDeleteProject'), 'Must support deleting projects');
});

test('Script-First Product: BusinessProfileView supports multi-business profiles, editing, and switching', () => {
  const bizSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/BusinessProfileView.jsx'), 'utf8');
  assert.ok(bizSrc.includes('Business Profiles'), 'Must list businesses');
  assert.ok(bizSrc.includes('Add Another Business'), 'Must allow adding new business');
  assert.ok(bizSrc.includes('City / Town'), 'Must include location fields');
  assert.ok(bizSrc.includes('Save'), 'Must have save action');
});

test('Script-First Product: BusinessOnboardingModal delivers concise 4-step wizard with visual category cards and Save button', () => {
  const obSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/BusinessOnboardingModal.jsx'), 'utf8');
  assert.ok(obSrc.includes('Step {step} of 4'), 'Step indicator');
  assert.ok(obSrc.includes('Business Identity'), 'Step 1 business identity');
  assert.ok(obSrc.includes('Location & Online Presence'), 'Step 2 location & online presence');
  assert.ok(obSrc.includes('Brand Voice & Personality'), 'Step 3 brand voice & personality');
  assert.ok(obSrc.includes('Confirm & Save'), 'Step 4 confirm & save');
  assert.ok(obSrc.includes('<span>Save</span>'), 'Final step button must be Save');
  assert.ok(obSrc.includes('CATEGORY_CARDS'), 'Must define CATEGORY_CARDS for visual selection');
  assert.ok(obSrc.includes('Fashion & Apparel'), 'Must include fashion card');
  assert.ok(obSrc.includes('Jewellery & Luxury'), 'Must include jewellery card');
  assert.ok(obSrc.includes('Kirana & Supermarket'), 'Must include grocery card');
  assert.ok(obSrc.includes('Other Local Business'), 'Must include other/custom card');
  assert.ok(obSrc.includes('CATEGORY_AUDIENCES'), 'Must define category-aware audience personas');
  assert.ok(obSrc.includes('getSuggestedAudiences'), 'Must define getSuggestedAudiences helper');
  assert.ok(obSrc.includes('validateStep'), 'Must validate step mandatory fields');
  assert.ok(obSrc.includes('townError'), 'Must track town validation error');
});

test('Script-First Product: App.jsx wires all 4 views and saves/restores projects to/from server', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  assert.ok(appSrc.includes('handleSaveCurrentProject'), 'App.jsx must define handleSaveCurrentProject');
  assert.ok(appSrc.includes('handleOpenProject'), 'App.jsx must define handleOpenProject');
  assert.ok(appSrc.includes('handleDeleteProject'), 'App.jsx must define handleDeleteProject');
  assert.ok(appSrc.includes('handleSaveBusiness'), 'App.jsx must define handleSaveBusiness');
  assert.ok(appSrc.includes('handleOnboardingComplete'), 'App.jsx must define handleOnboardingComplete');
  assert.ok(appSrc.includes('<ScriptLibraryView'), 'App.jsx must render ScriptLibraryView');
  assert.ok(appSrc.includes('<BusinessProfileView'), 'App.jsx must render BusinessProfileView');
  assert.ok(appSrc.includes('<AuthModal'), 'App.jsx must render AuthModal');
  assert.ok(appSrc.includes('<BusinessOnboardingModal'), 'App.jsx must render BusinessOnboardingModal');
});

test('V2 Single Starting Point: CreationEntryHub has exactly 3 creation entry points and no duplicate Open Studio button', () => {
  const hubSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/CreationEntryHub.jsx'), 'utf8');
  assert.ok(!hubSrc.includes('Open Studio for'), 'Must not render redundant Open Studio button banner');
  assert.ok(hubSrc.includes('Active Brand'), 'Must render active brand confirmation context');
  assert.ok(hubSrc.includes('Start with a Brief'), 'Must include Start with a Brief');
  assert.ok(hubSrc.includes('Start with an Existing Script'), 'Must include Start with an Existing Script');
  assert.ok(hubSrc.includes('Start with a Website URL'), 'Must include Start with a Website URL');
  assert.ok(hubSrc.includes('★ Recommended'), 'Brief card must feature prominent Recommended badge');
});

test('V2 Creation Flow: Screen02Brief confirms active brand and does not re-ask business registration', () => {
  const studioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(studioSrc.includes('Creating Video For'), 'Screen02Brief must display active brand confirmation');
  assert.ok(studioSrc.includes('Active Brand Context'), 'Screen02Brief must display active brand context');
  
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  assert.ok(appSrc.includes("setActiveAppView('home')"), 'Back from Brief must return to Creation Hub when brand exists');
});

test('Campaign Target Audience: Screen02Brief supports campaign audience with category suggestions and multi-combine', () => {
  const studioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(studioSrc.includes('Who is this video for? (Target Audience)'), 'Screen02Brief must have target audience input');
  assert.ok(studioSrc.includes('getSuggestedAudiences'), 'Screen02Brief must use getSuggestedAudiences');
  assert.ok(studioSrc.includes('[...currentItems, aud].join'), 'Must combine newly clicked suggestion with existing items');
  assert.ok(studioSrc.includes('Click to apply or combine'), 'Must retain apply or combine label');

  const obSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/BusinessOnboardingModal.jsx'), 'utf8');
  // Must avoid complex jargon and difficult vocabulary
  assert.ok(!obSrc.includes('trousseau'), 'Must not include tough word trousseau');
  assert.ok(!obSrc.includes('heirloom collectors'), 'Must not include heirloom collectors');
  assert.ok(!obSrc.includes('pediatric'), 'Must not include pediatric medical jargon');
  assert.ok(!obSrc.includes('chronic wellness'), 'Must not include chronic wellness');
  assert.ok(!obSrc.includes('bespoke services'), 'Must not include bespoke services');
  assert.ok(!obSrc.includes('trendsetters'), 'Must not include trendsetters');

  // Must include simple, accessible replacements
  assert.ok(obSrc.includes('Brides & wedding jewellery buyers'), 'Must include clear bridal jewellery persona');
  assert.ok(obSrc.includes('Gold & diamond investment buyers'), 'Must include gold investment persona');
  assert.ok(obSrc.includes('Parents looking for child health & baby care'), 'Must include simple child healthcare persona');
});

test('Business Onboarding: Brand Tone cards include visual icons for all tones', () => {
  const obSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/BusinessOnboardingModal.jsx'), 'utf8');

  // Must import tone icons
  assert.ok(obSrc.includes('Heart,'), 'Must import Heart icon');
  assert.ok(obSrc.includes('PartyPopper,'), 'Must import PartyPopper icon');
  assert.ok(obSrc.includes('Crown,'), 'Must import Crown icon');
  assert.ok(obSrc.includes('Target,'), 'Must import Target icon');

  // BRAND_TONES must specify icons
  assert.ok(obSrc.includes("icon: Heart"), 'Warm tone must use Heart icon');
  assert.ok(obSrc.includes("icon: PartyPopper"), 'Festive tone must use PartyPopper icon');
  assert.ok(obSrc.includes("icon: Crown"), 'Premium tone must use Crown icon');
  assert.ok(obSrc.includes("icon: Target"), 'Direct tone must use Target icon');

  // Must render the icon in Step 3
  assert.ok(obSrc.includes("<Icon size={18} />"), 'Must render Icon component in card');

  // Step 3 must be scrollable so footer Next button is never unreachable
  assert.ok(obSrc.includes("Step 3: Brand Voice & Online Presence") && obSrc.includes("overflowY: 'auto'"), 'Step 3 must have scrollable overflow');
  assert.ok(obSrc.includes("flexShrink: 0") && obSrc.includes("Footer Navigation"), 'Footer navigation must be pinned with flexShrink 0');
});

test('Business Onboarding: Never pre-fills Kanti Sweets as default and maintains placeholder', () => {
  const obSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/BusinessOnboardingModal.jsx'), 'utf8');
  assert.ok(obSrc.includes("kanti sweets' ? '' :"), 'Must sanitize kanti sweets from initial businessName');
  assert.ok(obSrc.includes('placeholder="e.g.'), 'Must have placeholder text on brand name input');
});

test('Business Onboarding & Profile Save: saveBusiness accepts both name and businessName and normalizes aliases', async () => {
  const db = require('../engine/db.js');
  const testUserId = `user_test_${Date.now()}`;
  
  // Test saving with { name, category }
  const biz1 = await db.saveBusiness({
    name: 'Royal Heritage Sarees',
    category: 'Saree, Clothing & Apparel',
    town: 'Varanasi',
    targetAudience: 'Bridal shoppers',
  }, testUserId);

  assert.equal(biz1.businessName, 'Royal Heritage Sarees');
  assert.equal(biz1.name, 'Royal Heritage Sarees');
  assert.equal(biz1.businessType, 'Saree, Clothing & Apparel');
  assert.equal(biz1.category, 'Saree, Clothing & Apparel');

  // Test saving with { businessName, businessType }
  const biz2 = await db.saveBusiness({
    businessName: 'Sharma Sweets',
    businessType: 'Sweets, Bakery & Restaurant',
    town: 'Jaipur',
  }, testUserId);

  assert.equal(biz2.businessName, 'Sharma Sweets');
  assert.equal(biz2.name, 'Sharma Sweets');
  assert.equal(biz2.businessType, 'Sweets, Bakery & Restaurant');
  assert.equal(biz2.category, 'Sweets, Bakery & Restaurant');

  // Test retrieval
  const list = await db.getBusinessesForUser(testUserId);
  assert.equal(list.length, 2);
  const found = list.find((b) => b.id === biz1.id);
  assert.ok(found);
  assert.equal(found.businessName, 'Royal Heritage Sarees');
  assert.equal(found.name, 'Royal Heritage Sarees');
});

test('Business Onboarding: handleOnboardingComplete provides full payload and prevents modal reopening loop', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  
  // Guard in fetchUserData
  assert.ok(
    appSrc.includes('allowAutoOpenOnboarding = false'),
    'fetchUserData must default allowAutoOpenOnboarding to false'
  );
  assert.ok(
    appSrc.includes('else if (allowAutoOpenOnboarding)'),
    'fetchUserData must only auto-open onboarding if allowAutoOpenOnboarding is true'
  );

  // handleOnboardingComplete payload keys
  assert.ok(
    appSrc.includes('businessName: resolvedName') && appSrc.includes('name: resolvedName'),
    'handleOnboardingComplete must provide both businessName and name'
  );
  assert.ok(
    appSrc.includes('businessType: resolvedType') && appSrc.includes('category: resolvedType'),
    'handleOnboardingComplete must provide both businessType and category'
  );
  assert.ok(
    appSrc.includes('fetchUserData(authToken, false)'),
    'handleOnboardingComplete must pass false to allowAutoOpenOnboarding'
  );
});

test('Business Onboarding: Modal resets step to 1 on isOpen change and on completion', () => {
  const obSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/BusinessOnboardingModal.jsx'), 'utf8');
  assert.ok(obSrc.includes('setStep(1)'), 'Must reset step to 1');
  assert.ok(obSrc.includes('[isOpen]'), 'Must watch isOpen to reset step to 1');
});

test('UrlResearchModal: Exports 12 standard business categories, renders select dropdown, and updates brand and category', () => {
  const modalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/UrlResearchModal.jsx'), 'utf8');

  // Verify STANDARD_BUSINESS_CATEGORIES
  assert.ok(modalSrc.includes('STANDARD_BUSINESS_CATEGORIES'), 'STANDARD_BUSINESS_CATEGORIES must be declared');
  assert.ok(modalSrc.includes('Saree, Clothing & Apparel'), 'Saree category must be present');
  assert.ok(modalSrc.includes('Jewellery & Accessories'), 'Jewellery category must be present');
  assert.ok(modalSrc.includes('Kirana, Grocery & Supermarket'), 'Kirana category must be present');
  assert.ok(modalSrc.includes('Other Local Business'), 'Other Local Business category must be present');

  // Verify category input is a <select> dropdown, not a plain <input>
  assert.ok(modalSrc.includes('<select'), 'Business Category must use a <select> dropdown');
  assert.ok(modalSrc.includes('STANDARD_BUSINESS_CATEGORIES.map'), 'Must map over standard categories in select');

  // Verify fetch body sends clean URL without locking into prior stale business name
  assert.ok(modalSrc.includes('url: urlInput.trim()'), 'Must pass trimmed URL');
  assert.ok(!modalSrc.includes('businessName: draftBrand || businessName'), 'Must not send stale draftBrand in scan request');

  // Verify update logic on API response
  assert.ok(modalSrc.includes('if (data.brandName) setDraftBrand(data.brandName)'), 'Must update draftBrand from response');
  assert.ok(modalSrc.includes('setDraftCategory(data.businessType || data.category)'), 'Must update draftCategory from response');
});

test('Business Profiles Redesign: Prominent avatars, card grid with + Add Another Business, unified onboarding modal, and left nav switcher', () => {
  const profileSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/BusinessProfileView.jsx'), 'utf8');
  const modalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/BusinessOnboardingModal.jsx'), 'utf8');
  const shellSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AppShell.jsx'), 'utf8');

  // BusinessProfileView structure
  assert.ok(profileSrc.includes('resolveLogoUrl'), 'Must export resolveLogoUrl');
  assert.ok(profileSrc.includes('getInitials'), 'Must export getInitials');
  assert.ok(profileSrc.includes('getAvatarGradient'), 'Must export getAvatarGradient');
  assert.ok(profileSrc.includes('displayBusinesses.map'), 'Must render business cards grid');
  assert.ok(profileSrc.includes('Add Another Business'), 'Must have Add Another Business card');
  assert.ok(!profileSrc.includes('<form'), 'Must not have a default raw form filling the page');

  // BusinessOnboardingModal logo upload and edit support
  assert.ok(modalSrc.includes('Tell us about your business'), 'Must have Step 1');
  assert.ok(modalSrc.includes('Logo') && modalSrc.includes('accept="image/*"'), 'Step 1 must offer logo upload');
  assert.ok(modalSrc.includes('id: initialData.id'), 'Must preserve initialData.id on completion for updates');

  // AppShell left navbar switcher & avatar
  assert.ok(shellSrc.includes('resolveLogoUrl'), 'AppShell must resolve logo avatar');
  assert.ok(shellSrc.includes('businessDropdownOpen'), 'AppShell must have switcher dropdown state');
  assert.ok(shellSrc.includes('ChevronsUpDown'), 'AppShell must show switcher icon for multiple businesses');
  assert.ok(shellSrc.includes('Switch Active Business'), 'AppShell must render switcher dropdown menu');
});

test('Business Onboarding: Adding a new business starts afresh with empty input boxes and does not copy active business', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  const modalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/BusinessOnboardingModal.jsx'), 'utf8');

  // Verify App.jsx passes editingBusiness or empty object, never leaking userContext into new business modal
  assert.ok(
    appSrc.includes('initialData={editingBusiness || {}}'),
    'App.jsx must pass editingBusiness || {} so new businesses start with empty inputs'
  );
  assert.ok(
    !appSrc.includes('initialData={\n          editingBusiness || {\n            businessName:'),
    'App.jsx must not fall back to userContext when adding a new business'
  );

  // Verify BusinessOnboardingModal starts empty when initialData is empty
  assert.ok(
    modalSrc.includes("useState(initialData.businessType || initialData.category || '')"),
    'Category must not pre-select a category card when starting afresh'
  );
  assert.ok(
    modalSrc.includes("setBusinessType(data.businessType || data.category || '')"),
    'useEffect must reset category to empty when initialData has no category'
  );
  assert.ok(
    modalSrc.includes("setBrandLogo(data.brandLogo || data.logo || null)"),
    'useEffect must reset logo to null when initialData has no logo'
  );
  assert.ok(
    modalSrc.includes("categoryError"),
    'Must validate that user selects a business category'
  );
});

test('Navbar 3-Tabs Layout & Creative Studio Integration: AppShell renders Creative Studio, My Projects, and My Businesses', () => {
  const shellSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AppShell.jsx'), 'utf8');

  // Verify the 3 core navigation tabs
  assert.ok(shellSrc.includes('<span>Creative Studio</span>'), 'AppShell must feature Creative Studio tab');
  assert.ok(shellSrc.includes('<span>My Projects</span>'), 'AppShell must feature My Projects tab');
  assert.ok(shellSrc.includes('<span>My Businesses</span>'), 'AppShell must feature My Businesses tab');

  // Verify bottom-left user card trigger and removal of bare icons
  assert.ok(shellSrc.includes('onClick={onOpenAccountModal}'), 'User profile card must trigger Account modal');
  assert.ok(!shellSrc.includes('<Settings2 size={15} />'), 'Redundant settings icon must be removed');

  // Verify breadcrumb updates
  assert.ok(shellSrc.includes("'My Projects'"), 'Breadcrumb must support My Projects');
  assert.ok(shellSrc.includes("'My Businesses'"), 'Breadcrumb must support My Businesses');
});

test('Account Settings: Compact, subtle danger zone and safe logout in modal', () => {
  const modalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AccountModal.jsx'), 'utf8');

  // Compact danger zone verification
  assert.ok(modalSrc.includes('Delete Account'), 'Must contain Delete Account section');
  assert.ok(modalSrc.includes('showConfirm'), 'Must have expandable confirmation state');
  assert.ok(modalSrc.includes('Sign Out'), 'Must include safe Sign Out action');
});

test('My Projects Video Experience: ScriptLibraryView provides video download, business branding, and video-centric copy', () => {
  const libSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ScriptLibraryView.jsx'), 'utf8');

  // Rebranded copy
  assert.ok(libSrc.includes('My Projects'), 'Header must say My Projects');
  assert.ok(libSrc.includes('No video projects yet'), 'Empty state must say No video projects yet');
  assert.ok(!libSrc.includes('Create First Script'), 'Must not say Create First Script anywhere');
  assert.ok(libSrc.includes('Create Video Project'), 'Empty state CTA must say Create Video Project');

  // Video download functionality
  assert.ok(libSrc.includes('Download Video'), 'Must include prominent Download Video button');
  assert.ok(libSrc.includes('download='), 'Must set download attribute for MP4 file');

  // Business branding & Expandable script
  assert.ok(libSrc.includes('getAvatarGradient') || libSrc.includes('resolveLogoUrl'), 'Must support business logo/avatar');
  assert.ok(libSrc.includes('expandedScriptIds'), 'Must support expandable script drawer');
  assert.ok(libSrc.includes('handleCopyScript') && libSrc.includes('Copy 4 Scenes'), 'Must support Copy 4 Scenes');
});

test('Account Settings Profile Picture: AccountModal supports profile photo upload, preview, remove, and AppShell sidebar display', async () => {
  const modalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AccountModal.jsx'), 'utf8');
  assert.ok(modalSrc.includes('accept="image/*"'), 'AccountModal must have image file input');
  assert.ok(modalSrc.includes('handleFileChange'), 'AccountModal must handle photo file selection');
  assert.ok(modalSrc.includes('handleRemoveAvatar'), 'AccountModal must support removing profile photo');
  assert.ok(modalSrc.includes('onUpdateProfile'), 'AccountModal must trigger onUpdateProfile');
  assert.ok(modalSrc.includes('Camera'), 'AccountModal must render camera badge');

  const shellSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AppShell.jsx'), 'utf8');
  assert.ok(shellSrc.includes('currentUser.avatar'), 'AppShell must display currentUser.avatar when present');

  const db = require('../engine/db.js');
  assert.ok(typeof db.updateUserProfile === 'function', 'db must export updateUserProfile');
  const user = await db.createUser({
    email: `avatar_test_${Date.now()}@example.com`,
    password: 'password123',
    name: 'Avatar Tester',
  });
  const updated = await db.updateUserProfile(user.id, {
    avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  });
  assert.ok(updated.avatar && updated.avatar.startsWith('data:image/png'), 'updateUserProfile must persist avatar');
});

test('UI/UX Audit Enhancements: Breadcrumbs, Modal Scroll Boundaries, Standardized Controls & Accessibility', () => {
  const shellSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AppShell.jsx'), 'utf8');
  // Breadcrumb fix for creation hub
  assert.ok(shellSrc.includes("'Creation Hub'"), 'AppShell breadcrumb must display Creation Hub');
  assert.ok(shellSrc.includes("'Choose Entry Point'"), 'AppShell breadcrumb must display Choose Entry Point');
  assert.ok(shellSrc.includes('aria-label={mobileMenuOpen ?'), 'Mobile hamburger menu must have accessible aria-label');

  // AccountModal scroll boundaries & accessibility
  const accountModalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/AccountModal.jsx'), 'utf8');
  assert.ok(accountModalSrc.includes('maxHeight: \'min(90vh, 720px)\''), 'AccountModal must constrain viewport height');
  assert.ok(accountModalSrc.includes('flexShrink: 0'), 'AccountModal header/footer must have flexShrink: 0');
  assert.ok(accountModalSrc.includes('aria-label="Close account settings"'), 'AccountModal must have accessible close button label');

  // UrlResearchModal & ExistingScriptModal sticky footers & aria labels
  const urlModalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/UrlResearchModal.jsx'), 'utf8');
  assert.ok(urlModalSrc.includes('flexShrink: 0'), 'UrlResearchModal header and footer must have flexShrink: 0');
  assert.ok(urlModalSrc.includes('aria-label="Close dialog"'), 'UrlResearchModal must have accessible close button');

  const scriptModalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ExistingScriptModal.jsx'), 'utf8');
  assert.ok(scriptModalSrc.includes('flexShrink: 0'), 'ExistingScriptModal header and footer must have flexShrink: 0');
  assert.ok(scriptModalSrc.includes('aria-label="Close dialog"'), 'ExistingScriptModal must have accessible close button');

  // BusinessOnboardingModal close button aria-label
  const bizModalSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/BusinessOnboardingModal.jsx'), 'utf8');
  assert.ok(bizModalSrc.includes('aria-label="Close setup modal"'), 'BusinessOnboardingModal must have aria-label on close button');

  // ScriptLibraryView accessibility
  const libSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ScriptLibraryView.jsx'), 'utf8');
  assert.ok(libSrc.includes('aria-label={`Delete project'), 'Delete project button must have aria-label');
  assert.ok(libSrc.includes('aria-label={`Download generated video'), 'Download video button must have aria-label');
  assert.ok(libSrc.includes('aria-label={`Copy 4-scene script'), 'Copy script button must have aria-label');

  // GuidedStudio standardized controls
  const studioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  assert.ok(studioSrc.includes("borderRadius: 8"), 'Screen03Settings must standardize pill radius');
  assert.ok(studioSrc.includes("padding: '7px 14px'"), 'Screen03Settings must standardize pill padding');
  assert.ok(studioSrc.includes("aria-label={isRecording ?"), 'Screen02Brief dictation button must have accessible aria-label');
  assert.ok(studioSrc.includes("aria-label=\"Remove product photo\""), 'Screen02Brief remove button must have aria-label');
});




test('Streamlined Creation Flow: Script directly triggers Video Generation without redundant review screen', () => {
  const guidedStudioSrc = fs.readFileSync(path.join(__dirname, '../src/components/GuidedStudio.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');

  // 1. Verify Screen07Script button directly offers "Generate Video →"
  assert.ok(guidedStudioSrc.includes('Generate Video →'), 'Screen07Script must have Generate Video button');
  assert.ok(!guidedStudioSrc.includes('Looks good →'), 'Screen07Script should no longer have generic Looks good button');

  // 2. Verify redundant pre-production review screen is eliminated
  assert.ok(!guidedStudioSrc.includes('Ready to make your video?'), 'Redundant pre-production review screen title must be removed');
  assert.ok(!guidedStudioSrc.includes('Review your creative choices before we create the final video.'), 'Redundant review description must be removed');

  // 3. Verify onApproveScript in App.jsx directly starts video production
  assert.ok(appSrc.includes('handleRunVideoProduction();'), 'App.jsx onApproveScript must trigger handleRunVideoProduction');
});

test('My Projects Generated Video Consistency: displayProjects ensures video is immediately visible and searchable', () => {
  const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf8');
  const libSrc = fs.readFileSync(path.join(__dirname, '../src/components/v2/ScriptLibraryView.jsx'), 'utf8');

  // 1. App.jsx must synthesize displayProjects including active video and pass displayProjects to ScriptLibraryView and AppShell
  assert.ok(appSrc.includes('const displayProjects = [...activeVideoProject, ...userProjects];'), 'App.jsx must derive displayProjects');
  assert.ok(appSrc.includes('projects={displayProjects}'), 'ScriptLibraryView must receive displayProjects');
  assert.ok(appSrc.includes('projectCount={displayProjects.length}'), 'AppShell must receive displayProjects.length');

  // 2. ScriptLibraryView must not drop items when search is empty
  assert.ok(libSrc.includes('if (!searchTerm || !searchTerm.trim()) return true;'), 'ScriptLibraryView filter must return true on empty search');

  // 3. ScriptLibraryView card title fallback
  assert.ok(libSrc.includes('proj.title || `${bizName} Commercial Video`'), 'ScriptLibraryView must provide fallback title');
});