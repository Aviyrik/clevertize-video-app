/**
 * Config-driven registry for CleverCut's First-Time Product Tour,
 * selective Contextual Help Tooltips, and Behavior-Responsive Feature Tips.
 */

const TOUR_STEPS = [
  {
    id: 'tour_create_start',
    targetSelector: '[data-tour="hub-entry-brief"]',
    title: 'Brief, Script, or Website',
    description:
      'Start from a short brief, paste a script, or scan your website.',
    placement: 'bottom',
    action: { label: 'Open Brief', type: 'go_brief' },
  },
  {
    id: 'tour_brand_context',
    targetSelector: '[data-tour="hub-brand-card"]',
    title: 'Your Active Brand',
    description:
      'Your business name, tone, and logo automatically guide generated scripts.',
    placement: 'bottom',
    action: { label: 'View Brand Profiles', type: 'go_businesses' },
  },
  {
    id: 'tour_modes',
    targetSelector: '[data-tour="mode-switcher"]',
    title: 'Simple & Director Modes',
    description:
      'Use Simple Mode for 3 fast steps, or Director Mode for step-by-step control.',
    placement: 'bottom',
    action: { label: 'Open Settings', type: 'go_settings' },
  },
  {
    id: 'tour_projects',
    targetSelector: '[data-tour="nav-projects"]',
    title: 'My Projects',
    description:
      'Resume drafts and download or share finished videos anytime.',
    placement: 'right',
    action: { label: 'Open My Projects', type: 'go_projects' },
  },
  {
    id: 'tour_replay',
    targetSelector: '[data-tour="tour-replay-trigger"]',
    title: 'Replay Anytime',
    description:
      'Pause, resume, or restart this tour anytime from the sidebar or Account Settings.',
    placement: 'top',
    action: { label: 'Open Account Settings', type: 'go_account' },
  },
];

const HELP_TOOLTIPS = {
  brief_input: {
    title: 'Writing a clear brief',
    body: 'Mention your offer, target customer, any timing deadline, and the action viewers should take.',
  },
  brief_audience: {
    title: 'Target audience',
    body: 'Specifying who the ad speaks to shapes the opening hook, vocabulary, and tone.',
  },
  brief_guardrails: {
    title: 'Creative Instructions',
    body: 'Add Must Follow rules or Must Avoid items applied across scripts and scenes.',
  },
  brief_occasion: {
    title: 'Occasion & Event',
    body: 'Tie your campaign to a festival, season, or launch and choose how strongly it guides the story.',
  },
  format_dimension: {
    title: 'Video dimension',
    body: '9:16 fits Reels & Shorts, 16:9 fits YouTube & websites, and 1:1 fits feed posts.',
  },
  format_duration: {
    title: 'Video length',
    body: '15s for punchy offers, 20s for problem and CTA, 30s for fuller dialogue and proof.',
  },
  understanding_review: {
    title: 'AI Understanding',
    body: 'Fix any wrong product or buyer assumptions before ideas and scripts generate.',
  },
  idea_selection: {
    title: 'Creative directions',
    body: 'Pick an AI direction or write your own idea below.',
  },
  script_editing: {
    title: 'Scene editing',
    body: 'Edit any scene manually, use Improve for AI rewrites, or adjust Cast & Setting above.',
  },
};

const CONTEXTUAL_TIPS = {
  tip_try_director: {
    id: 'tip_try_director',
    title: 'Want scene-by-scene control?',
    body: 'Switch to Director Mode above — your brief and settings carry right over.',
    actionLabel: 'Switch to Director Mode',
  },
  tip_ai_understanding: {
    id: 'tip_ai_understanding',
    title: 'Check before ideas generate',
    body: 'Edit any section below, then approve to generate creative directions.',
  },
  tip_script_customize: {
    id: 'tip_script_customize',
    title: 'Every scene is editable',
    body: 'Click Edit for manual changes or Improve for AI rewrites before rendering.',
  },
  tip_create_another_video: {
    id: 'tip_create_another_video',
    title: 'Try another angle',
    body: 'Click "Create another video" to test a new concept from this same brief.',
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TOUR_STEPS,
    HELP_TOOLTIPS,
    CONTEXTUAL_TIPS,
  };
}
