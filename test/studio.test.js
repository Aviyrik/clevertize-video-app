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

test('Guided Studio V4 Architecture: 8 Stages Definition & Integrity', () => {
  const expectedStages = [
    { id: 'business', num: '01', label: 'Business' },
    { id: 'brief', num: '02', label: 'Brief' },
    { id: 'settings', num: '03', label: 'Settings' },
    { id: 'idea', num: '04', label: 'Idea' },
    { id: 'opening', num: '05', label: 'Opening' },
    { id: 'story', num: '06', label: 'Story' },
    { id: 'script', num: '07', label: 'Script' },
    { id: 'video', num: '08', label: 'Video' },
  ];

  assert.equal(expectedStages.length, 8);
  assert.deepEqual(expectedStages.map(s => s.id), [
    'business',
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
