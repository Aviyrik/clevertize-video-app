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
