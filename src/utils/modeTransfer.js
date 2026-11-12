/**
 * Bidirectional state preservation helpers for switching between Simple Mode ('simple')
 * and Director Mode ('advanced') without losing compatible campaign context or unadded drafts.
 */

function platformForAspectRatio(aspectRatio) {
  if (aspectRatio === '16:9') return 'YouTube / 16:9';
  if (aspectRatio === '1:1') return 'Social Feed / 1:1';
  return 'Instagram Reels / 9:16';
}

function aspectRatioFromContext(userContext = {}) {
  if (userContext.aspectRatio === '16:9' || userContext.aspectRatio === '1:1' || userContext.aspectRatio === '9:16') {
    return userContext.aspectRatio;
  }
  if (userContext.dimension === '16:9' || userContext.dimension === '1:1' || userContext.dimension === '9:16') {
    return userContext.dimension;
  }
  const plat = String(userContext.platform || '');
  if (plat.includes('16:9')) return '16:9';
  if (plat.includes('1:1')) return '1:1';
  return '9:16';
}

function dimensionLabelForRatio(ratio) {
  if (ratio === '16:9') return '16:9 Landscape';
  if (ratio === '1:1') return '1:1 Square';
  return '9:16 Vertical';
}

function normalizeStyleLabel(style = '') {
  const s = String(style || '');
  if (s.includes('UGC')) return 'UGC';
  if (s.includes('Demo')) return 'Product Demo';
  if (s.includes('Comedy')) return 'Funny';
  if (s.includes('Conversational')) return 'Conversational';
  if (s.includes('Story')) return 'Story';
  return s || 'UGC';
}

function normalizeDraftInputs(draft = null) {
  return {
    doText: typeof draft?.doText === 'string' ? draft.doText : '',
    dontText: typeof draft?.dontText === 'string' ? draft.dontText : '',
  };
}

function truncatePreview(text, max = 48) {
  const clean = String(text || '').trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function summarizeTransferDetails(ctx = {}, aiUnderstanding = null, guardrailDraftInputs = null, extra = {}) {
  const savedItems = [];
  const pendingItems = [];
  const uncarriedItems = [];

  if (String(ctx.brief || '').trim()) savedItems.push('Campaign brief');
  if (ctx.targetAudience && String(ctx.targetAudience).trim()) savedItems.push('Target audience');
  if (ctx.language) savedItems.push(`Language (${ctx.language})`);
  if (ctx.aspectRatio || ctx.dimension) savedItems.push(`Format (${ctx.aspectRatio || ctx.dimension})`);
  if (ctx.targetDuration || ctx.duration) savedItems.push(`Length (${ctx.targetDuration || ctx.duration})`);
  if (ctx.productPhoto) savedItems.push('Product photo');

  const dosCount = ctx.creativeGuardrails?.dos?.length || 0;
  const dontsCount = ctx.creativeGuardrails?.donts?.length || 0;
  if (dosCount > 0 || dontsCount > 0) {
    const parts = [
      dosCount > 0 ? `${dosCount} Do${dosCount > 1 ? "'s" : ''}` : null,
      dontsCount > 0 ? `${dontsCount} Don't${dontsCount > 1 ? 's' : ''}` : null,
    ].filter(Boolean);
    savedItems.push(`Saved creative instructions (${parts.join(' · ')})`);
  }

  if (ctx.eventContext && (ctx.eventContext.name || ctx.eventContext.eventName || ctx.eventContext.category)) {
    savedItems.push('Occasion & event context');
  }
  if (aiUnderstanding && aiUnderstanding.business_understanding) {
    savedItems.push('AI Understanding context');
  }

  const doDraft = truncatePreview(guardrailDraftInputs?.doText);
  const dontDraft = truncatePreview(guardrailDraftInputs?.dontText);
  if (doDraft) pendingItems.push(`Pending Do's text: "${doDraft}"`);
  if (dontDraft) pendingItems.push(`Pending Don'ts text: "${dontDraft}"`);

  if (extra.hasSimplePackages) {
    uncarriedItems.push('Generated 3-script previews (Director Mode builds new concepts from your brief)');
  }
  if (extra.hasDirectorDirectionOrHook) {
    uncarriedItems.push('Selected creative direction / opening hook (Simple Studio generates 3 script options)');
  }
  if (extra.hasDirectorScenes) {
    uncarriedItems.push('Edited Director scene script (not loaded into Simple Studio Step 1)');
  }

  return {
    savedItems,
    pendingItems,
    uncarriedItems,
    preservedItems: [...savedItems, ...pendingItems],
  };
}

function summarizePreservedItems(ctx = {}, aiUnderstanding = null, guardrailDraftInputs = null) {
  return summarizeTransferDetails(ctx, aiUnderstanding, guardrailDraftInputs).preservedItems;
}

/**
 * Extracts compatible campaign context when switching Simple Studio -> Director Mode.
 */
function transferSimpleToDirector({
  simpleState = null,
  currentUserContext = {},
  currentExplicitChoices = {},
  currentAiUnderstanding = null,
  guardrailDraftInputs = null,
} = {}) {
  const src = simpleState && typeof simpleState === 'object' ? simpleState : {};
  const brief = typeof src.brief === 'string' ? src.brief : (currentUserContext.brief || '');
  const language = src.language || currentUserContext.language || 'English';
  const creativeStyle = src.creativeStyle || currentUserContext.creativeStyle || 'UGC / Creator-style';
  const duration = src.duration || currentUserContext.targetDuration || currentUserContext.duration || '20s';
  const aspectRatio = src.aspectRatio || aspectRatioFromContext(currentUserContext);
  const platform = platformForAspectRatio(aspectRatio);
  const productPhoto = src.productPhoto !== undefined ? src.productPhoto : (currentUserContext.productPhoto || null);
  const targetAudience = typeof src.targetAudience === 'string' ? src.targetAudience : (currentUserContext.targetAudience || '');
  const creativeGuardrails = src.creativeGuardrails !== undefined ? src.creativeGuardrails : (currentUserContext.creativeGuardrails || null);
  const eventContext = src.eventContext !== undefined ? src.eventContext : (currentUserContext.eventContext || null);
  const aiUnderstanding = src.aiUnderstanding || currentAiUnderstanding || null;
  const resolvedDraftInputs = normalizeDraftInputs(src.guardrailDraftInputs || guardrailDraftInputs);

  const hasBrief = Boolean(String(brief || '').trim());
  const nextUserContext = {
    ...currentUserContext,
    brief,
    targetAudience,
    language,
    creativeStyle,
    duration,
    targetDuration: duration,
    aspectRatio,
    dimension: aspectRatio,
    platform,
    productPhoto,
    creativeGuardrails,
    eventContext,
  };

  const nextExplicitChoices = {
    ...currentExplicitChoices,
    ...(src.language ? { language } : {}),
    ...(src.creativeStyle ? { style: normalizeStyleLabel(creativeStyle) } : {}),
    ...(src.duration ? { duration } : {}),
    ...(src.aspectRatio ? { dimension: dimensionLabelForRatio(aspectRatio), platform: dimensionLabelForRatio(aspectRatio) } : {}),
  };

  // If user already entered a brief in Simple Mode, advance straight to Settings so they don't re-enter Brief.
  const targetStage = hasBrief ? 'settings' : 'brief';
  const completedStages = hasBrief ? ['brief'] : [];
  const summary = summarizeTransferDetails(nextUserContext, aiUnderstanding, resolvedDraftInputs, {
    hasSimplePackages: Array.isArray(src.packages) && src.packages.length > 0,
  });

  return {
    userContext: nextUserContext,
    explicitChoices: nextExplicitChoices,
    aiUnderstanding,
    guardrailDraftInputs: resolvedDraftInputs,
    targetStage,
    completedStages,
    ...summary,
  };
}

/**
 * Extracts compatible campaign context when switching Director Mode -> Simple Studio.
 */
function transferDirectorToSimple({
  userContext = {},
  aiUnderstanding = null,
  existingSimpleDraft = null,
  importedPackage = null,
  guardrailDraftInputs = null,
  hasDirectorDirectionOrHook = false,
  hasDirectorScenes = false,
} = {}) {
  const aspectRatio = aspectRatioFromContext(userContext);
  const duration = userContext.targetDuration || userContext.duration || '20s';
  const language = userContext.language || 'English';
  const creativeStyle = userContext.creativeStyle || 'UGC / Creator-style';
  const resolvedDraftInputs = normalizeDraftInputs(guardrailDraftInputs || existingSimpleDraft?.guardrailDraftInputs);

  const basePackages = importedPackage
    ? [importedPackage]
    : Array.isArray(existingSimpleDraft?.packages)
      ? existingSimpleDraft.packages
      : [];

  const nextDraft = {
    step: importedPackage ? 2 : 1,
    brief: userContext.brief || existingSimpleDraft?.brief || '',
    targetAudience: typeof userContext.targetAudience === 'string' ? userContext.targetAudience : (existingSimpleDraft?.targetAudience || ''),
    language,
    creativeStyle,
    duration,
    aspectRatio,
    productPhoto: userContext.productPhoto || null,
    creativeGuardrails: userContext.creativeGuardrails || null,
    guardrailDraftInputs: resolvedDraftInputs,
    eventContext: userContext.eventContext || null,
    aiUnderstanding: aiUnderstanding || null,
    packages: basePackages,
    selectedPackageId: importedPackage ? importedPackage.id : (existingSimpleDraft?.selectedPackageId ?? null),
  };

  const summary = summarizeTransferDetails(
    { ...userContext, duration, aspectRatio, language, creativeStyle },
    aiUnderstanding,
    resolvedDraftInputs,
    {
      hasDirectorDirectionOrHook,
      hasDirectorScenes,
    }
  );

  return {
    simpleDraft: nextDraft,
    guardrailDraftInputs: resolvedDraftInputs,
    ...summary,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    platformForAspectRatio,
    aspectRatioFromContext,
    dimensionLabelForRatio,
    normalizeDraftInputs,
    transferSimpleToDirector,
    transferDirectorToSimple,
    summarizePreservedItems,
    summarizeTransferDetails,
  };
}
