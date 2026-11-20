// The stage bar at the top of the studio is a progress indicator only. Clicking a stage used to jump
// straight there and skip the state the pipeline expects, so no stage — finished or not — may be a
// button, a link, focusable, or styled as if it could be clicked. Back and each screen's forward
// action are the only way to move between stages.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8').replace(/\r\n/g, '\n');
const guided = read('src/components/GuidedStudio.jsx');
const simple = read('src/components/v2/SimpleBusinessStudio.jsx');
const app = read('src/App.jsx');
const css = read('src/index.css');

const directorBar = guided.slice(guided.indexOf('export function StudioProgressHeader'), guided.indexOf('export function StudioChoicesBar'));
const simpleBar = simple.slice(simple.indexOf('{/* 3-STEP GUIDED PROGRESS HEADER'), simple.indexOf('{/* COMPACT CAMPAIGN IDENTITY'));

const NOT_INTERACTIVE = [
  [/<button\b/, 'a button'],
  [/<a\b/, 'a link'],
  [/\bonClick=/, 'a click handler'],
  [/\bonKey(Down|Up|Press)=/, 'a key handler'],
  [/\btabIndex=/, 'a tab stop'],
  [/role="(button|link|tab)"/, 'an interactive role'],
  [/cursor: 'pointer'/, 'a pointer cursor'],
  [/onMouse(Enter|Over|Leave)=/, 'hover styling'],
  [/Back to \$\{/, 'a "Back to …" tooltip'],
];

for (const [name, bar] of [['Director', directorBar], ['Simple Studio', simpleBar]]) {
  test(`${name} stage bar is display only`, () => {
    assert.ok(bar.length > 200, `found the ${name} bar`);
    for (const [re, what] of NOT_INTERACTIVE) {
      assert.doesNotMatch(bar, re, `${name} bar has no ${what}`);
    }
    assert.match(bar, /<ol\b/, 'the stages are an ordered list');
    assert.match(bar, /aria-current=\{isCurrent \? 'step' : undefined\}/, 'the current stage is announced');
    assert.match(bar, /isCompleted && !isCurrent \? <Check/, 'finished stages still show their tick');
  });
}

test('the Director bar takes no navigation callback and App passes none', () => {
  assert.doesNotMatch(directorBar, /onNavigateStage/);
  const use = app.slice(app.indexOf('<StudioProgressHeader'), app.indexOf('/>', app.indexOf('<StudioProgressHeader')));
  assert.ok(use.includes('currentStage={studioStage}') && use.includes('completedStages={completedStages}'));
  assert.doesNotMatch(use, /onNavigateStage/);
});

test('the Simple Studio bar never changes the step', () => {
  assert.doesNotMatch(simpleBar, /setStep\(/);
});

test('no stylesheet rule makes the bar look clickable', () => {
  assert.doesNotMatch(css, /\.studio-progress[^{]*>\s*button/, 'phone rules target the stage items, not buttons');
  assert.doesNotMatch(css, /\.studio-progress[^{]*:(hover|focus)/, 'no hover or focus styling on the bar');
  assert.ok(css.includes('.studio-progress > .studio-progress-sep { display: none; }'), 'phones still drop the arrows');
});
