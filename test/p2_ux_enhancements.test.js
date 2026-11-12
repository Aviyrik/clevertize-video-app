const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { summarizeScriptImportInput } = require('../src/utils/scriptSummary.js');
const {
  classifyProjectStatus,
  computeProjectFilterCounts,
  formatProjectUpdatedAt,
} = require('../src/utils/projectLibrary.js');

const ROOT = path.join(__dirname, '..');

test('P2.1 Brief Optional Details: discoverable grouping, collapsed defaults, state preservation & accessible indicators', () => {
  const optionalSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/OptionalFieldDisclosure.jsx'), 'utf8');
  const instructionsSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/CreativeInstructionsSection.jsx'), 'utf8');
  const occasionSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/OccasionEventSection.jsx'), 'utf8');
  const guidedSrc = fs.readFileSync(path.join(ROOT, 'src/components/GuidedStudio.jsx'), 'utf8');
  const simpleSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/SimpleBusinessStudio.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.jsx'), 'utf8');

  assert.ok(optionalSrc.includes('aria-expanded={isExpanded}') && optionalSrc.includes('aria-controls={panelId}'));
  assert.ok(optionalSrc.includes('Optional · Not added') && optionalSrc.includes('populatedLabel'));

  assert.ok(instructionsSrc.includes('aria-controls="creative-instructions-panel"') && instructionsSrc.includes('Optional · Not added'));
  assert.ok(occasionSrc.includes('aria-controls="occasion-event-panel"') && occasionSrc.includes('Optional · Not added'));

  assert.ok(guidedSrc.includes('data-testid="brief-optional-details"') && guidedSrc.includes('Optional Details'));
  assert.ok(simpleSrc.includes('data-testid="brief-optional-details"') && simpleSrc.includes('Optional Details'));
  assert.ok(simpleSrc.includes('briefOptionalExpanded') && appSrc.includes('briefOptionalExpanded'));
});

test('P2.2 Format & Duration Settings: accessible selection state & keyboard controls across both modes', () => {
  const formatSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/VideoFormatFields.jsx'), 'utf8');
  const guidedSrc = fs.readFileSync(path.join(ROOT, 'src/components/GuidedStudio.jsx'), 'utf8');
  const simpleSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/SimpleBusinessStudio.jsx'), 'utf8');

  assert.ok(formatSrc.includes('aria-pressed={isSelected}'));
  assert.ok(formatSrc.includes('9:16 Vertical') && formatSrc.includes('20s Standard'));
  assert.ok(formatSrc.includes('<Check '), 'Selected format cards show non-color Check indicator');

  assert.ok(guidedSrc.includes('aria-label="Creative Style"'));
  const styleBlock = guidedSrc.slice(guidedSrc.indexOf('aria-label="Creative Style"'), guidedSrc.indexOf('Optional Assets'));
  assert.ok(!styleBlock.includes('<div\n                  key={st.id}'), 'Style options in Screen03Settings are keyboard-accessible buttons rather than plain clickable divs');
  assert.ok(simpleSrc.includes('aria-label="Creative Style"') && simpleSrc.includes('{st.label}'));
});

test('P2.3 Script Editor: scene nav strip, collapsible cards, distinct labels, no silent loss & explicit save statuses', () => {
  const guidedSrc = fs.readFileSync(path.join(ROOT, 'src/components/GuidedStudio.jsx'), 'utf8');
  const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.jsx'), 'utf8');

  assert.ok(guidedSrc.includes('data-testid="scene-nav-strip"') && guidedSrc.includes('aria-label="Scene navigation"'));
  assert.ok(guidedSrc.includes('Expand all') && guidedSrc.includes('Collapse all'));
  assert.ok(guidedSrc.includes('Showing / Doing') && guidedSrc.includes('Saying (spoken dialogue)') && guidedSrc.includes('Purpose: {s.beatRole}'));
  assert.ok(guidedSrc.includes('commitSceneEdit(editingSceneIdx, editSceneText, false)'), 'Switching to edit another scene commits active scene edits rather than dropping them');
  assert.ok(guidedSrc.includes('data-testid="script-save-status"') && guidedSrc.includes('Unsaved changes') && guidedSrc.includes('Saving…') && guidedSrc.includes('Save failed') && guidedSrc.includes('data-testid="script-retry-save-btn"'));
  assert.ok(appSrc.includes('scriptSaveError') && appSrc.includes('onRetrySave={handleSaveCurrentProject}'));
});

test('P2.4 Existing-Script Import: example banner, one-click Clear, and honest live script summary without fake durations', () => {
  const empty = summarizeScriptImportInput('', '20s');
  assert.equal(empty.isEmpty, true);
  assert.equal(empty.sceneCount, 0);
  assert.equal(empty.estimatedSeconds, null);

  const prose = summarizeScriptImportInput('Come visit our store this weekend for fresh festive sweets and great discounts.', '15s');
  assert.equal(prose.hasExplicitScenes, false);
  assert.equal(prose.estimatedSeconds, null);
  assert.ok(prose.durationLabel.includes('Estimate unavailable'));

  const annotated = summarizeScriptImportInput(
    'SCENE 1\nVisual: A\nScene duration: ~4s\nSCENE 2\nVisual: B\nScene duration: ~4s\nSCENE 3\nVisual: C\nScene duration: ~4s',
    '15s'
  );
  assert.equal(annotated.sceneCount, 3);
  assert.equal(annotated.estimatedSeconds, 12);

  const structuredNoDur = summarizeScriptImportInput('SCENE 1\nVisual: Open\nSCENE 2\nVisual: Mid\nSCENE 3\nVisual: Close', '15s');
  assert.equal(structuredNoDur.sceneCount, 3);
  assert.equal(structuredNoDur.estimatedSeconds, 15);

  const modalSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/ExistingScriptModal.jsx'), 'utf8');
  assert.ok(modalSrc.includes('Example: {s.name}') && modalSrc.includes('data-testid="sample-script-banner"'));
  assert.ok(modalSrc.includes('data-testid="clear-script-btn"') && modalSrc.includes('data-testid="script-import-summary"'));
});

test('P2.5 My Projects: honest status classification, filter counts, time formatting & accessible card actions', () => {
  const expiredUrl = 'https://cdn.example.com/v.mp4?token=exp=1700000000~hmac=abc';
  const liveUrl = 'https://cdn.example.com/permanent/v.mp4';

  const sampleProjects = [
    { id: 'p1', title: 'Draft One', currentStage: 'brief', updatedAt: '2026-11-11T10:15:00.000Z' },
    { id: 'p2', title: 'Video Done', videoUrl: liveUrl, scenes: ['s1', 's2', 's3', 's4'], updatedAt: '2026-11-11T09:00:00.000Z' },
    { id: 'p3', title: 'Old Render', videoUrl: expiredUrl, updatedAt: '2025-05-01T10:00:00.000Z' },
  ];

  const c1 = classifyProjectStatus(sampleProjects[0]);
  const c2 = classifyProjectStatus(sampleProjects[1]);
  const c3 = classifyProjectStatus(sampleProjects[2]);

  assert.equal(c1.group, 'in_progress');
  assert.ok(c1.label.includes('In Progress') && c1.label.includes('Brief'));
  assert.equal(c2.group, 'completed');
  assert.equal(c2.label, 'Completed · Video Ready');
  assert.equal(c3.group, 'attention');
  assert.ok(c3.label.includes('Needs Attention'));

  const counts = computeProjectFilterCounts(sampleProjects);
  assert.deepEqual(counts, { all: 3, in_progress: 1, completed: 1, attention: 1 });

  const formattedSameDay = formatProjectUpdatedAt('2026-11-11T10:15:00.000Z', Date.parse('2026-11-11T12:00:00.000Z'));
  assert.ok(formattedSameDay.startsWith('Today, '), `Expected time-stamped Today label, got ${formattedSameDay}`);

  const libSrc = fs.readFileSync(path.join(ROOT, 'src/components/v2/ScriptLibraryView.jsx'), 'utf8');
  assert.ok(libSrc.includes('data-testid="project-status-filters"') && libSrc.includes('data-testid="projects-loading-state"'));
  assert.ok(libSrc.includes('Reset filters') && libSrc.includes('Resume in Studio'));
  assert.ok(libSrc.includes('aria-label={`${inProgress ? \'Resume\' : \'Open\'} ${projectLabel} in Studio`}'));
});
