// Spine-shaped model answers for tests: one per stage, picked by the stage's "RUN NOW" marker in the system prompt.
// Mirrors the output contracts in engine/spines/contracts.js (brief.json, concept.json, script.json).
const J = (o) => `@@JSON@@\n${JSON.stringify(o)}\n@@END@@`;
const brief = {
  business_problem: 'Evening shoppers do not know the shop delivers.',
  objective: { stage: 'Conversion', statement: 'Get nearby families to order on WhatsApp because delivery takes 30 minutes.' },
  kpis: [{ name: 'CTR', target: '1.2%', primary: true, benchmark: { range: 'no benchmark found', source: '', date: '', confidence: 'Low' } }],
  four_c: {
    client: { positioning: 'The neighbourhood kirana that delivers', assets: [], proof: ['30-minute delivery'], past_messaging: [], voice: 'warm' },
    competitors: [],
    consumer: { persona: { who: 'Home cooks' }, jobs: [], triggers: [], fears: ['Running out mid-cooking'], desires: ['No trip out'], objections: [], moments: ['Oil runs out mid-tadka'], own_words: [] },
    category: { norms: ['Price lists'], cliches: ['Smiling family'], trends: [], regulation: [], moment: 'everyday' },
    gap: 'Nobody shows the mid-cooking rescue',
  },
  smp: 'Your kitchen never runs out mid-cooking.',
  rtbs: [{ claim: '30-minute delivery', proof: 'Owner-stated delivery terms' }],
  occasion: { event: 'everyday', date: '', score: 0, fit: '', dos: [], donts: [] },
  polished_brief: { problem: 'Shoppers do not know about delivery', human_problem: 'Running out mid-cooking', think_feel_do: ['They deliver fast', 'Relief', 'Order on WhatsApp'], assumptions: ['Delivery radius 2 km'] },
  compliance_flags: [],
  field_status: { BUSINESS_PROBLEM: 'inferred' },
  dos_donts: [{ rule: 'Film format: Storytelling (wrongly re-added by the model)', type: 'Must include', strength: 'must', source: 'user', applies_to: ['idea'] }],
};
const insight = {
  lens: '2, Everyday Moments',
  lens_scan: { list_1_name: 'friction moments', list_1: ['a'], list_2_name: 'free moments', list_2: ['b'] },
  tensions: [
    { tension: 'The oil runs out mid-tadka', everyday_example: 'Pan hot, bottle empty', human_truth: 'She tilts the empty bottle twice', fear: 'Dinner ruined', desire: 'Keep cooking', confidence: 'High' },
    { tension: 'Guests arrive, no snacks', everyday_example: 'Doorbell rings', human_truth: 'Checks the tin', fear: 'Embarrassment', desire: 'Easy hosting', confidence: 'Med' },
    { tension: 'Rain, no trip out', everyday_example: 'Monsoon evening', human_truth: 'Looks at the umbrella', fear: 'Getting wet', desire: 'Stay home', confidence: 'Med' },
  ],
};
const hook = (n) => ({ pattern: 'Everyday crisis', library: 'TrueFan AI', pulled: '2026-10-05', line: n === 1 ? 'Oil khatam, tadka ready?' : 'Pan hot, bottle empty?', visual: 'She tilts an empty oil bottle over a hot pan', super: 'Oil ran out?', payoff: 'The tadka sizzles in the same pan' });
// every angle and concept names its two people (the app's two-character rule)
const CAST = ['Asha, 34, home cook (woman)', 'Ravi, 22, shop delivery boy (man)'];
const angles = { angles: [1, 2, 3, 4, 5].map((i) => ({ id: `a${i}`, name: `Mid-tadka rescue ${i}`, route: 'Problem → solution', plot: 'Oil runs out mid-tadka; one WhatsApp, the bottle arrives; the tadka sizzles.', hooks: [hook(1), hook(2)], format: 'X', mood: 'Light humour', rationale: 'Shows the 30-minute delivery that drives orders', score: 4.1, confidence: 'High', cast: CAST })) };
const concept = {
  concept: {
    core_idea: 'A home cook runs out of oil mid-tadka; the kirana delivers before the pan cools.',
    beats: ['Oil runs out', 'She tilts the bottle', 'WhatsApp, delivery at the door', 'The tadka sizzles'],
    hook: hook(1), ending_payoff: 'The same pan sizzles', mood: 'Light humour',
    visual_world: { time: 'evening', light: 'warm kitchen light', palette: 'turmeric yellow', setting: 'A small home kitchen' },
  },
  dos_donts_check: [{ rule: 'Film format', status: 'met' }],
  occasion_use: { event: '', how_shown: '', donts: [] },
  compliance_flags: [],
  cast: CAST,
};
const char = (ref, name, role) => ({ ref, name, role, age: '34', gender: 'female', skin_tone: 'wheatish', hair: 'long braid', build: 'medium', wardrobe: 'cotton salwar kameez', accessories: 'glass bangles' });

function scenesFor(format, n, script) {
  const hi = script === 'Devanagari';
  const visuals = [
    'Asha stands at the stove and tilts an empty oil bottle over a hot pan in the small kitchen.',
    'Asha picks up her phone from the counter and types a quick message to the shop.',
    'Ravi, the shop boy, hands a new oil bottle to Asha at the kitchen door.',
    'Asha pours the oil into the same pan and the cumin seeds start to sizzle.',
    'Asha smiles at the sizzling pan and stirs the tadka slowly with a steel ladle.',
    'Asha serves dal to her family at the small table near the kitchen window.',
  ];
  const lines = hi ? ['तेल खत्म हो गया!', 'भैया, एक बोतल भेजो।', 'लीजिए दीदी, तीस मिनट में।', 'अब तड़का पूरा होगा।', 'बस, डिनर तैयार।', 'खाना लग गया।']
    : ['The oil just ran out!', 'Bhaiya, one bottle please.', 'Here you go, in thirty minutes.', 'Now the tadka is perfect.', 'Dinner is ready.', 'Food is served.'];
  const speakers = ['Asha', 'Asha', 'Ravi', 'Asha', 'Ravi', 'Asha'];
  const vo = hi
    ? ['तड़का गरम है, पर तेल की बोतल अचानक खाली हो गई।', 'एक छोटा सा मैसेज, और दुकान से तुरंत बोतल चल पड़ी।', 'तीस मिनट में ताज़ी बोतल सीधे रसोई के दरवाज़े तक।', 'उसी कढ़ाई में तड़का फिर से खुशबू के साथ चटकने लगा।']
    : ['The pan is hot, but the oil bottle is suddenly empty tonight.', 'One quick message, and the shop sends a fresh bottle on its way.', 'In thirty minutes the new bottle reaches the kitchen door, still sealed.', 'In the same pan the tadka sizzles again with the cumin smell.'];
  return Array.from({ length: n }, (_, i) => ({
    visual: visuals[i], shot: 'medium', camera: i === 0 ? 'slow push-in' : 'handheld drift',
    dialogue: format === 'VO-led' ? [] : (format === 'UGC' && i === 2 ? [] : [{ speaker: format === 'UGC' ? 'Asha' : speakers[i], line: lines[i] }]),
    vo: format === 'VO-led' ? (vo[i] || vo[3]) : '',
    super: i === 0 ? 'Oil ran out?' : 'none',
    callout: i === 2 ? '30-minute delivery' : 'none',
    cta: i === n - 1 ? 'end card only' : 'none',
    disclaimer: 'none', ui_mockup: 'none', logo: 'none',
    ambience: 'kitchen hum', sfx: 'pan sizzle', music_mood: 'Playful, plucky',
    transition_out: i === n - 1 ? 'soft dissolve – to the end card' : 'match cut – the bottle',
    edit_notes: i === 2 ? 'Must include: show the offer. Hold on the bottle.' : 'Hold 1s.',
  }));
}

// Section 4 frame notes, one per scene (the app adds the rest of each frame description)
const FRAME_SUBJECTS = [
  'Asha tilts the empty bottle over the hot pan.',
  'Asha taps a message on her phone at the counter.',
  'Ravi holds out a new bottle. Asha takes it at the kitchen door.',
  'Asha pours the oil into the same pan.',
  'Asha stirs the tadka with a steel ladle.',
  'Asha sets a bowl of dal on the table by the window.',
];
const frameNote = (i) => ({
  scene: i + 1,
  camera_angle: 'eye level',
  composition: 'The steel counter fills the foreground; Asha stands centre-frame at the stove; the kitchen window sits behind her; the lower third stays clear for the super.',
  subject: FRAME_SUBJECTS[i] || FRAME_SUBJECTS[0],
  product: i === 1 ? 'not in frame' : 'the golden bottle in her right hand, label turned away from camera',
});

function scriptAnswer(system) {
  const format = (system.match(/FILM FORMAT: (UGC|VO-led|Storytelling)/) || [])[1] || 'UGC';
  const count = Number((system.match(/exactly (\d+) scenes/) || [])[1] || 4);
  const script = (system.match(/script (Devanagari|Latin)/) || [])[1] || 'Latin';
  // every film has exactly two characters (UGC: the creator is char_1)
  const chars = [char('char_1', 'Asha', format === 'UGC' ? 'creator, disclosed' : 'home cook'), { ...char('char_2', 'Ravi', 'shop delivery boy'), gender: 'male', age: '22' }];
  return J({
    context_block: {
      characters: chars,
      product: { ref: 'none', sku: 'Groundnut oil 1L', colour: 'golden', packaging: 'plain bottle', size_in_hand: 'one hand', label_side: 'away from camera', how_used: 'poured into pan' },
      setting: { location: 'small home kitchen', time_of_day: 'evening', light_source: 'tube light', surfaces: 'steel counter', background_activity: 'pressure cooker hiss', brand_colour_cues: 'yellow' },
      brand_elements: { logo_placement: 'end card', supers: 'Scene 1', callouts: 'Scene 3', cta: 'end card', disclaimers: 'none', captions: 'on' },
    },
    scenes: scenesFor(format, count, script),
    frames: Array.from({ length: count }, (_, i) => frameNote(i)),
    header_hints: { hook_pattern: 'Everyday crisis', ending: 'The tadka sizzles', mood: 'Light humour' },
  });
}

function answer({ system = '' }) {
  const sys = String(system);
  if (/You are running the Brief Spine above/.test(sys)) return J(brief);
  if (/Run Section 2 \(Prompt R1/.test(sys)) return J({ company_scan: { positioning: 'Neighbourhood kirana', praise: ['Fast'], complaints: ['Hard to reach'], sources: [] }, competitors: [{ name: 'Local supermarket', messages: ['Big range'] }], white_space: 'Nobody shows the mid-cooking rescue', unknown_required_fields: ['BUSINESS_PROBLEM'], question: null });
  if (/— Checkpoint 2 – Insight ===/.test(sys)) return J(insight);
  if (/— Section 4 – Framing ===/.test(sys)) return J({ framings: [{ framing: 'When the pan is hot and the bottle is empty', why: 'real' }, { framing: 'The 30-minute rescue', why: 'proof' }] });
  if (/— Checkpoint 3 – Angles ===/.test(sys)) return J(angles);
  if (/— Checkpoint 4 – Story & format ===/.test(sys)) return J(concept);
  if (/revise scene \d+ only/.test(sys)) {
    const full = JSON.parse(scriptAnswer(sys).replace(/^@@JSON@@\n|\n@@END@@$/g, ''));
    const s = full.scenes[1];
    s.visual = 'Asha grabs her phone from the steel counter and taps a quick message to the shop.';
    return J({ scene: s, frame: { ...frameNote(1), subject: 'Asha grabs her phone from the steel counter.' } });
  }
  if (/=== RUN NOW \(CleverCut app\) — (write the script|repair pass|import)/.test(sys)) return scriptAnswer(sys);
  return '{}';
}
// A script.json answer for a format / scene count / script, as the Script & Storyboard Spine would return it
const scriptFor = ({ format = 'Storytelling', count = 4, script = 'Devanagari' } = {}) => scriptAnswer(`FILM FORMAT: ${format} exactly ${count} scenes script ${script}`);
module.exports = { answer, J, brief, insight, angles, concept, scriptFor };
