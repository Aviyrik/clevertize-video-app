/**
 * engine/spines/storyboard.js — the seam for the 4-grid storyboard (Script & Storyboard Spine, Section 4).
 *
 * The app has no image-generation step today, so frames are planned but not drawn: each frame gets the
 * keyframe prompt built from the scene's Visual field plus the Context Block, and its reference IDs.
 * When an image provider is registered (registerStoryboardImageProvider), generateFrames() draws each frame,
 * runs the frame check and fills storyboard.json. Until then the frame check is reported as "not_run",
 * not as a pass.
 */

const contracts = require('./contracts');

let imageProvider = null; // async ({ prompt, refs, aspectRatio, seed }) => { image_url, seed }
let frameChecker = null;  // async ({ image_url, frame, script }) => { passed, problems: [] }

function registerStoryboardImageProvider(fn, checker = null) {
  if (typeof fn !== 'function') throw new Error('Storyboard image provider must be a function.');
  imageProvider = fn;
  frameChecker = typeof checker === 'function' ? checker : null;
}
function resetStoryboardImageProvider() { imageProvider = null; frameChecker = null; }
const hasImageProvider = () => Boolean(imageProvider);

function describe(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return Object.entries(obj).filter(([k, v]) => k !== 'ref' && v && typeof v !== 'object').map(([, v]) => String(v)).join(', ');
}

/** storyboard.json (Section 7 contract) planned from script.json: one keyframe per scene. */
function planStoryboard(script, { aspectRatio = '9:16', palette = '' } = {}) {
  const cb = script.context_block || {};
  const charRefs = (cb.characters || []).map((c) => (c && typeof c === 'object' ? c.ref || c.id : '')).filter(Boolean);
  const productRefs = cb.product && cb.product.ref && cb.product.ref !== 'none' ? [cb.product.ref] : [];
  const frames = (script.scenes || []).map((sc) => ({
    scene: sc.n,
    image_url: '',
    prompt: [
      `Keyframe, ${aspectRatio}, ${sc.shot || 'medium'} shot.`,
      sc.visual,
      `Characters: ${(cb.characters || []).map(describe).join(' | ')}.`,
      `Product: ${describe(cb.product)}.`,
      `Setting: ${describe(cb.setting)}.`,
      'No text, no logos, no phone or app UI in the image (S-M5).',
    ].join(' '),
    refs: [...charRefs, ...productRefs],
    seed: '',
    approved: false,
  }));
  return contracts.normalizeStoryboard({
    frames,
    locks: { character_refs: charRefs, product_refs: productRefs, seed: '', style: { aspect_ratio: aspectRatio }, palette: palette ? [palette] : [] },
  });
}

/** Draws every frame with the registered provider (up to 2 retries per failing frame), then flags failures. */
async function generateFrames(storyboard, script) {
  if (!imageProvider) return { storyboard, status: 'not_run', flagged: [] };
  const flagged = [];
  for (const frame of storyboard.frames) {
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      const out = await imageProvider({ prompt: frame.prompt, refs: frame.refs, aspectRatio: storyboard.locks.style.aspect_ratio, seed: storyboard.locks.seed });
      frame.image_url = (out && out.image_url) || '';
      frame.seed = (out && out.seed) || frame.seed;
      const check = frameChecker ? await frameChecker({ image_url: frame.image_url, frame, script }) : { passed: Boolean(frame.image_url), problems: [] };
      ok = Boolean(check && check.passed);
      if (!ok && attempt === 2) flagged.push({ scene: frame.scene, problems: (check && check.problems) || ['frame check failed'] });
    }
  }
  return { storyboard, status: flagged.length ? 'fail' : 'pass', flagged };
}

module.exports = { planStoryboard, generateFrames, registerStoryboardImageProvider, resetStoryboardImageProvider, hasImageProvider, describe };
