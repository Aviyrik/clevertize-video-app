const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const {
  DISLIKE_REASONS,
  isProjectEligibleForRating,
  createFeedbackPayload,
} = require('../src/utils/videoFeedback.js');

test('Video Rating Eligibility: Only completed projects with videoUrl are eligible', () => {
  // 1. Completed projects with videoUrl are eligible
  const completedProj = {
    id: 'proj_101',
    title: 'Summer Launch Ad',
    status: 'video_ready',
    videoUrl: 'https://cdn.clevercut.tv/videos/proj_101.mp4',
  };
  assert.strictEqual(isProjectEligibleForRating(completedProj), true, 'Completed project with video is eligible');

  // 2. Draft projects must not show rating controls
  const draftProj = {
    id: 'proj_102',
    title: 'Draft Project',
    status: 'draft',
    videoUrl: 'https://cdn.clevercut.tv/videos/test.mp4',
  };
  assert.strictEqual(isProjectEligibleForRating(draftProj), false, 'Draft projects are not eligible');

  // 3. Incomplete / rendering / pending projects must not show rating controls
  const incompleteProj = {
    id: 'proj_103',
    title: 'Incomplete Project',
    status: 'incomplete',
    videoUrl: 'https://cdn.clevercut.tv/videos/test.mp4',
  };
  assert.strictEqual(isProjectEligibleForRating(incompleteProj), false, 'Incomplete projects are not eligible');

  const renderingProj = {
    id: 'proj_104',
    title: 'Rendering Project',
    status: 'rendering',
    videoUrl: 'https://cdn.clevercut.tv/videos/test.mp4',
  };
  assert.strictEqual(isProjectEligibleForRating(renderingProj), false, 'Rendering projects are not eligible');

  // 4. Projects with scripts/storyboards but no final video must not show rating controls
  const scriptOnlyProj = {
    id: 'proj_105',
    title: 'Script Only Project',
    status: 'script_ready',
    videoUrl: null,
    scenes: ['Scene 1', 'Scene 2', 'Scene 3', 'Scene 4'],
  };
  assert.strictEqual(isProjectEligibleForRating(scriptOnlyProj), false, 'Script-only projects are not eligible');

  const emptyVideoProj = {
    id: 'proj_106',
    title: 'Empty Video Url',
    status: 'completed',
    videoUrl: '   ',
  };
  assert.strictEqual(isProjectEligibleForRating(emptyVideoProj), false, 'Empty videoUrl projects are not eligible');

  // 5. Failed or cancelled generations must not show rating controls
  const failedProj = {
    id: 'proj_107',
    title: 'Failed Project',
    status: 'failed',
    videoUrl: 'https://cdn.clevercut.tv/videos/failed.mp4',
  };
  assert.strictEqual(isProjectEligibleForRating(failedProj), false, 'Failed projects are not eligible');

  const cancelledProj = {
    id: 'proj_108',
    title: 'Cancelled Project',
    status: 'cancelled',
    videoUrl: 'https://cdn.clevercut.tv/videos/cancelled.mp4',
  };
  assert.strictEqual(isProjectEligibleForRating(cancelledProj), false, 'Cancelled projects are not eligible');

  // Null/undefined checks
  assert.strictEqual(isProjectEligibleForRating(null), false);
  assert.strictEqual(isProjectEligibleForRating(undefined), false);
  assert.strictEqual(isProjectEligibleForRating({}), false);
});

test('Dislike Reasons: Canonical multi-select options match specification exactly', () => {
  const expectedReasons = [
    'Visuals or AI-generated scenes',
    'Script or dialogue',
    'Voiceover or audio',
    'Characters or consistency',
    'Product or brand representation',
    'Creative concept or storytelling',
    'Something else',
  ];

  assert.strictEqual(DISLIKE_REASONS.length, 7, 'Must have exactly 7 canonical dislike reasons');
  expectedReasons.forEach((r) => {
    assert.ok(DISLIKE_REASONS.includes(r), `Dislike reasons must include: "${r}"`);
  });
});

test('Feedback Payload: Structure matches Phase 1 specification and supports optional fields', () => {
  // Case A: Like submission (no reasons, no comment required)
  const likePayload = createFeedbackPayload({
    userId: 'user_123',
    brandId: 'brand_456',
    projectId: 'proj_789',
    generationId: 'run_abc',
    rating: 'like',
  });

  assert.strictEqual(likePayload.user_id, 'user_123');
  assert.strictEqual(likePayload.brand_id, 'brand_456');
  assert.strictEqual(likePayload.project_id, 'proj_789');
  assert.strictEqual(likePayload.generation_id, 'run_abc');
  assert.strictEqual(likePayload.rating, 'like');
  assert.deepStrictEqual(likePayload.reasons, []);
  assert.strictEqual(likePayload.comment, '');
  assert.ok(likePayload.created_at, 'created_at must be populated');
  assert.ok(likePayload.updated_at, 'updated_at must be populated');

  // Case B: Dislike submission with multi-select reasons and optional comment
  const dislikePayload = createFeedbackPayload({
    userId: 'user_123',
    brandId: 'brand_456',
    projectId: 'proj_789',
    generationId: 'run_abc',
    rating: 'dislike',
    reasons: ['Visuals or AI-generated scenes', 'Voiceover or audio'],
    comment: 'Pacing was slightly too fast in scene 2.',
  });

  assert.strictEqual(dislikePayload.rating, 'dislike');
  assert.deepStrictEqual(dislikePayload.reasons, [
    'Visuals or AI-generated scenes',
    'Voiceover or audio',
  ]);
  assert.strictEqual(dislikePayload.comment, 'Pacing was slightly too fast in scene 2.');

  // Case C: Dislike submission without reasons or comment is valid
  const bareDislike = createFeedbackPayload({
    projectId: 'proj_bare',
    rating: 'dislike',
  });
  assert.strictEqual(bareDislike.rating, 'dislike');
  assert.deepStrictEqual(bareDislike.reasons, []);
  assert.strictEqual(bareDislike.comment, '');
});

test('Rating Changeability: Feedback payload preserves created_at when rating is updated', () => {
  const initialTime = '2026-11-04T05:00:00.000Z';
  const updatedPayload = createFeedbackPayload({
    projectId: 'proj_789',
    rating: 'dislike',
    existingCreatedAt: initialTime,
  });

  assert.strictEqual(updatedPayload.created_at, initialTime, 'Original created_at is preserved');
  assert.notStrictEqual(updatedPayload.updated_at, initialTime, 'updated_at reflects update timestamp');
});

test('UI Integration: ScriptLibraryView incorporates ProjectRatingBar for eligible completed videos', () => {
  const filePath = path.resolve(__dirname, '../src/components/v2/ScriptLibraryView.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("import { ProjectRatingBar } from './VideoRatingControls.jsx'"), 'Imports ProjectRatingBar');
  assert.ok(code.includes('<ProjectRatingBar'), 'Mounts ProjectRatingBar component');
  assert.ok(code.includes('hasVideo && !videoExpired'), 'Guards ProjectRatingBar with video ready check');
});

test('UI Integration: SimpleBusinessStudio incorporates PostGenerationFeedbackPrompt', () => {
  const filePath = path.resolve(__dirname, '../src/components/v2/SimpleBusinessStudio.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("import { PostGenerationFeedbackPrompt } from './VideoRatingControls.jsx'"), 'Imports PostGenerationFeedbackPrompt');
  assert.ok(code.includes('<PostGenerationFeedbackPrompt'), 'Mounts PostGenerationFeedbackPrompt component');
  assert.ok(code.includes('videoUrl={producedVideoUrl}'), 'Passes producedVideoUrl');
});

test('UI Integration: GuidedStudio incorporates PostGenerationFeedbackPrompt in Screen08Video', () => {
  const filePath = path.resolve(__dirname, '../src/components/GuidedStudio.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  assert.ok(code.includes("import { PostGenerationFeedbackPrompt } from './v2/VideoRatingControls.jsx'"), 'Imports PostGenerationFeedbackPrompt');
  assert.ok(code.includes('<PostGenerationFeedbackPrompt'), 'Mounts PostGenerationFeedbackPrompt component');
  assert.ok(code.includes('!videoUnavailable'), 'Guards rating prompt against unavailable video');
});

test('UI Components: VideoRatingControls implements all required interactions and copy', () => {
  const filePath = path.resolve(__dirname, '../src/components/v2/VideoRatingControls.jsx');
  const code = fs.readFileSync(filePath, 'utf8');

  // Copy checks
  assert.ok(code.includes("What didn't you like about this video?"), 'Dislike heading present');
  assert.ok(code.includes('Tell us what could have been better...'), 'Comment placeholder present');
  assert.ok(code.includes('How did we do?'), 'Post-generation prompt heading present');
  assert.ok(code.includes('Your feedback helps CleverCut create better videos.'), 'Supporting copy present');
  assert.ok(code.includes('ThumbsUp'), 'ThumbsUp icon used');
  assert.ok(code.includes('ThumbsDown'), 'ThumbsDown icon used');
  assert.ok(code.includes('Saved locally'), 'Explicit local storage notice present');
});
