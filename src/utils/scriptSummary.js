/**
 * Live script import summary helper using existing scene markers and explicit/per-shot duration rules.
 * Never fabricates duration numbers for unformatted prose.
 */

function summarizeScriptImportInput(scriptText = '', targetDuration = '20s') {
  const raw = typeof scriptText === 'string' ? scriptText : '';
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      isEmpty: true,
      sceneCount: 0,
      hasExplicitScenes: false,
      sceneLabel: '0 scenes detected',
      estimatedSeconds: null,
      durationLabel: `No script yet (target: ${targetDuration || '20s'})`,
    };
  }

  // Match explicit scene headings (SCENE 1, Scene 2 - HOOK, etc.)
  const sceneMatches = trimmed.match(/(?:^|\n)\s*SCENE\s*\d+\b/gi) || [];
  const annexMatches = sceneMatches.length === 0 ? (trimmed.match(/(?:^|\n)\s*ANNEX\s*A\b/gi) || []) : [];
  const sceneCount = sceneMatches.length || annexMatches.length;
  const hasExplicitScenes = sceneCount > 0;

  // Check explicit per-scene duration annotations if provided (e.g. "Scene duration: ~4s" or "Duration ~4s")
  const explicitSceneDurations = [];
  const durRegex = /(?:scene\s+duration|duration)\s*[:~]?\s*~?\s*(\d{1,2})\s*s\b/gi;
  let match;
  while ((match = durRegex.exec(trimmed)) !== null) {
    const val = parseInt(match[1], 10);
    if (Number.isFinite(val) && val > 0 && val <= 60) {
      explicitSceneDurations.push(val);
    }
  }

  if (hasExplicitScenes && explicitSceneDurations.length >= sceneCount) {
    const totalExplicit = explicitSceneDurations.slice(0, sceneCount).reduce((sum, n) => sum + n, 0);
    return {
      isEmpty: false,
      sceneCount,
      hasExplicitScenes: true,
      sceneLabel: `${sceneCount} scene${sceneCount === 1 ? '' : 's'} detected`,
      estimatedSeconds: totalExplicit,
      durationLabel: `~${totalExplicit}s (${sceneCount} scene timings summed)`,
    };
  }

  if (hasExplicitScenes) {
    // Existing normalizer uses ~5s per shot for 3/4/6 structured scenes
    const totalFromShots = sceneCount * 5;
    return {
      isEmpty: false,
      sceneCount,
      hasExplicitScenes: true,
      sceneLabel: `${sceneCount} scene${sceneCount === 1 ? '' : 's'} detected`,
      estimatedSeconds: totalFromShots,
      durationLabel: `~${totalFromShots}s (${sceneCount} × ~5s per shot)`,
    };
  }

  return {
    isEmpty: false,
    sceneCount: 0,
    hasExplicitScenes: false,
    sceneLabel: 'Unformatted text (scene count resolved on verify)',
    estimatedSeconds: null,
    durationLabel: `Estimate unavailable until structured into scenes (target: ${targetDuration || '20s'})`,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    summarizeScriptImportInput,
  };
}
