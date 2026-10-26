import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('WorkflowLoadingScreen: Exports all core and specialized workflow loaders', async () => {
  const filePath = path.resolve(process.cwd(), 'src/components/v2/WorkflowLoadingScreen.jsx');
  assert.ok(fs.existsSync(filePath), 'WorkflowLoadingScreen.jsx must exist');

  const fileContent = fs.readFileSync(filePath, 'utf8');

  // Verify core export
  assert.ok(fileContent.includes('export default function WorkflowLoadingScreen'), 'Must export default WorkflowLoadingScreen');

  // Verify specialized loader exports
  const expectedLoaders = [
    'BrandResearchLoader',
    'IdeaGenerationLoader',
    'HookGenerationLoader',
    'StoryGenerationLoader',
    'ScriptGenerationLoader',
    'UrlScannerLoader',
    'SimpleAdPackagesLoader',
    'SimpleVideoProductionLoader',
    'SceneRewriteLoader',
    'AuthSessionLoader',
  ];

  for (const loader of expectedLoaders) {
    assert.ok(
      fileContent.includes(`export function ${loader}`),
      `WorkflowLoadingScreen.jsx must export ${loader}`
    );
  }
});

test('WorkflowLoadingScreen: GuidedStudio integrates multi-stage loaders across all creation stages', async () => {
  const guidedStudioPath = path.resolve(process.cwd(), 'src/components/GuidedStudio.jsx');
  assert.ok(fs.existsSync(guidedStudioPath), 'GuidedStudio.jsx must exist');

  const content = fs.readFileSync(guidedStudioPath, 'utf8');

  // Check imports
  assert.ok(content.includes('BrandResearchLoader'), 'GuidedStudio must import BrandResearchLoader');
  assert.ok(content.includes('IdeaGenerationLoader'), 'GuidedStudio must import IdeaGenerationLoader');
  assert.ok(content.includes('HookGenerationLoader'), 'GuidedStudio must import HookGenerationLoader');
  assert.ok(content.includes('StoryGenerationLoader'), 'GuidedStudio must import StoryGenerationLoader');
  assert.ok(content.includes('ScriptGenerationLoader'), 'GuidedStudio must import ScriptGenerationLoader');

  // Check usage in Screen02Brief
  assert.ok(content.includes('<BrandResearchLoader'), 'Screen02Brief must render BrandResearchLoader when researching');

  // Check usage in Screen04Idea
  assert.ok(content.includes('<IdeaGenerationLoader'), 'Screen04Idea must render IdeaGenerationLoader when isLoadingDirections');

  // Check usage in Screen05Opening
  assert.ok(content.includes('<HookGenerationLoader'), 'Screen05Opening must render HookGenerationLoader when isLoadingHooks');

  // Check usage in Screen06Story
  assert.ok(content.includes('<StoryGenerationLoader'), 'Screen06Story must render StoryGenerationLoader when isLoadingStory');

  // Check usage in Screen07Script
  assert.ok(content.includes('<ScriptGenerationLoader'), 'Screen07Script must render ScriptGenerationLoader when isBusy');
});

test('WorkflowLoadingScreen: CreativeWorkspace integrates BrandResearchLoader, SceneRewriteLoader, and WorkflowLoadingScreen', async () => {
  const creativeWorkspacePath = path.resolve(process.cwd(), 'src/components/CreativeWorkspace.jsx');
  assert.ok(fs.existsSync(creativeWorkspacePath), 'CreativeWorkspace.jsx must exist');

  const content = fs.readFileSync(creativeWorkspacePath, 'utf8');

  assert.ok(content.includes('BrandResearchLoader'), 'CreativeWorkspace must import BrandResearchLoader');
  assert.ok(content.includes('SceneRewriteLoader'), 'CreativeWorkspace must import SceneRewriteLoader');
  assert.ok(content.includes('<BrandResearchLoader'), 'ResearchInsightsBanner must render BrandResearchLoader');
  assert.ok(content.includes('<SceneRewriteLoader'), 'SceneAIRewriteModal must render SceneRewriteLoader when isRewriting');
});

test('WorkflowLoadingScreen: UrlResearchModal integrates UrlScannerLoader', async () => {
  const urlModalPath = path.resolve(process.cwd(), 'src/components/v2/UrlResearchModal.jsx');
  assert.ok(fs.existsSync(urlModalPath), 'UrlResearchModal.jsx must exist');

  const content = fs.readFileSync(urlModalPath, 'utf8');

  assert.ok(content.includes('UrlScannerLoader'), 'UrlResearchModal must import UrlScannerLoader');
  assert.ok(content.includes('<UrlScannerLoader'), 'UrlResearchModal must render UrlScannerLoader when isScanning');
});

test('WorkflowLoadingScreen: SimpleBusinessStudio integrates SimpleAdPackagesLoader and SimpleVideoProductionLoader', async () => {
  const simpleStudioPath = path.resolve(process.cwd(), 'src/components/v2/SimpleBusinessStudio.jsx');
  assert.ok(fs.existsSync(simpleStudioPath), 'SimpleBusinessStudio.jsx must exist');

  const content = fs.readFileSync(simpleStudioPath, 'utf8');

  assert.ok(content.includes('SimpleAdPackagesLoader'), 'SimpleBusinessStudio must import SimpleAdPackagesLoader');
  assert.ok(content.includes('SimpleVideoProductionLoader'), 'SimpleBusinessStudio must import SimpleVideoProductionLoader');
  assert.ok(content.includes('<SimpleAdPackagesLoader'), 'SimpleBusinessStudio must render SimpleAdPackagesLoader when isLoadingPackages');
  assert.ok(content.includes('<SimpleVideoProductionLoader'), 'SimpleBusinessStudio must render SimpleVideoProductionLoader when isProducingVideo');
});

test('WorkflowLoadingScreen: App.jsx integrates AuthSessionLoader for initial session checking', async () => {
  const appPath = path.resolve(process.cwd(), 'src/App.jsx');
  assert.ok(fs.existsSync(appPath), 'App.jsx must exist');

  const content = fs.readFileSync(appPath, 'utf8');

  assert.ok(content.includes('AuthSessionLoader'), 'App.jsx must import AuthSessionLoader');
  assert.ok(content.includes('<AuthSessionLoader'), 'App.jsx must render AuthSessionLoader when isAuthChecking');
});
