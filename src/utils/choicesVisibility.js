/**
 * Decides which Director Mode "Choices" chips may be shown on the current stage.
 *
 * A choice belongs to the stage where the user makes it (settings, idea, opening).
 * It is shown only once the user has reached that stage: it is the current stage,
 * an earlier one, or already completed. This stops values carried over from Simple
 * Studio (language, style, length, dimension) appearing on Brief before the user
 * has seen the Settings stage.
 */

const DIRECTOR_STAGE_ORDER = ['brief', 'settings', 'understanding', 'idea', 'opening', 'script', 'video'];

function filterReachedChoices(choices = [], currentStage = null, completedStages = []) {
  const list = Array.isArray(choices) ? choices : [];
  const currentIdx = DIRECTOR_STAGE_ORDER.indexOf(currentStage);
  if (currentIdx === -1) return list;
  const done = Array.isArray(completedStages) ? completedStages : [];
  return list.filter((c) => {
    const idx = DIRECTOR_STAGE_ORDER.indexOf(c && c.stage);
    return idx === -1 || idx <= currentIdx || done.includes(c.stage);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DIRECTOR_STAGE_ORDER, filterReachedChoices };
}
