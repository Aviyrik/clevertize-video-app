# CLEVERTIZE V2 — MILESTONE 1 VERIFICATION REPORT
## ARCHITECTURE VERIFICATION AND REGRESSION PROTECTION

**Execution Date:** October 15, 2026  
**Milestone:** Milestone 1 (Architecture Verification & Regression Protection)  
**Status:** Completed & Verified  
**Active Git Branch:** `redesign-v2` (Tracking `origin/redesign-v2`)  
**Repository Working Directory:** `f:\Video App NEW\cleverdashboard`  
**Baseline Git Tag:** `v1-baseline` (`33bdfe64ef927e1323f51a3e86dcb5ac83138b39`) on branch `main`  
**Standalone Snapshot Backup:** `f:\Video App NEW\backups\cleverdashboard_baseline_20261015\`  

---

## 1. REPOSITORY AND BRANCH STATUS

| Parameter | Verified Status | Evidence |
| :--- | :--- | :--- |
| **Current Branch** | `redesign-v2` | `git branch`: `* redesign-v2` |
| **Remote Tracking** | `origin/redesign-v2` | Up to date with remote |
| **Working Tree State** | Clean (no untracked code files) | `git status`: only `docs/` untracked |
| **Fallback Branch** | `main` | Intact at commit `33bdfe6` |
| **Immutable Tag** | `v1-baseline` | Tagged at commit `33bdfe6` on both local and GitHub remote |
| **Application Code Changes** | **Zero** | Verified via `git diff --check` and `git status` |
| **Dependency Changes** | **Zero** | `package.json` unmodified |

---

## 2. TEST BASELINE

### 2.1 Execution Record
- **Exact Command Executed:** `cmd.exe /c npm test` (invoking `node --test test/engine.test.js test/server.test.js test/creative.test.js test/studio.test.js`)
- **Total Tests:** 117
- **Passed Tests:** 117
- **Failed Tests:** 0
- **Skipped Tests:** 0
- **Execution Duration:** ~430ms to 701ms
- **Environment Limitations Identified:** Direct PowerShell execution of `npm` is blocked on this system by Windows PowerShell script execution policy (`npm.ps1 cannot be loaded`); all testing must be executed via `cmd.exe /c npm test` or `node --test`.

### 2.2 Test Suite Breakdown by Module
1. `test/engine.test.js` (24 tests): Tests Annex-A regex parsing, festival calendar calculation, prompt substitutions, Section 8 gate rules (claims, time limits, Devanagari script), and compiler continuity locks.
2. `test/server.test.js` (14 tests): Tests Express endpoints (`/api/run`, `/api/status/:runId`, `/api/download`), input sanitization, rate limiting, and 1x1 transparent PNG fallback injection.
3. `test/creative.test.js` (15 tests): Tests Claude prompt chains, research synthesis, angle generation, hook archetypes, plot synthesis, and scene rewrites.
4. `test/studio.test.js` (64 tests): Tests Guided Studio state transitions, regression behaviors (Regressions 1–8), business bug typing protections (Tests 1–8), brief fallbacks (Tests 3–10), and custom entry shortcuts.

---

## 3. VERIFIED ARCHITECTURE MAP

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND LAYER                                                                         │
│ src/App.jsx (3,484 lines)                                                              │
│ • Holds 67 individual useState hooks at top level.                                     │
│ • Manages userContext (saved to localStorage key 'clevertize_user_context').           │
│ • Manages studioStage ('business' | 'brief' | 'settings' | 'idea' | 'opening' |       │
│   'story' | 'script' | 'video').                                                       │
│ • Imperative reset handler (handleExecuteNewProject) manually resets 35+ state setters.│
│                                                                                        │
│ src/components/GuidedStudio.jsx (3,830 lines)                                          │
│ • Monolithic file defining all 8 active studio screens:                                │
│   - Screen01Business (Stage 1: Business Profile & Logo)                                │
│   - Screen02Brief (Stage 2: Campaign Brief & Suggestion Chips)                         │
│   - Screen03Settings (Stage 3: Language, Style, Ratio, Duration)                       │
│   - Screen04Idea (Stage 4: Strategic Angles / Territories)                             │
│   - Screen05Opening (Stage 5: Viral Hook Archetypes)                                   │
│   - Screen06Story (Stage 6: Story World, 4 Beats, Characters, Location)                │
│   - Screen07Script (Stage 7: Annex-A Script, Inline Editing, Gate Failures)            │
│   - Screen08Video (Stage 8: Neural Pipeline Progress, Preview Player, Download)        │
│                                                                                        │
│ src/components/CreativeWorkspace.jsx (1,840 lines)                                     │
│ • Exports: ResearchInsightsBanner, CreativeDNABar, CreativePanelsWorkspace,            │
│   SceneAIRewriteModal, ProductionShotSpecView.                                         │
│ • Active Export: ONLY SceneAIRewriteModal (rendered at App.jsx:3312).                  │
│ • Test Dependency: test/studio.test.js:1156-1160 directly asserts that                 │
│   CreativeWorkspace.jsx contains SceneAIRewriteModal and keyboard shortcuts.          │
└────────────────────────────────────┬───────────────────────────────────────────────────┘
                                     │ HTTP REST (JSON with Base64 Images)
┌────────────────────────────────────▼───────────────────────────────────────────────────┐
│ BACKEND API LAYER (server.js: 646 lines)                                               │
│ • In-Memory Session Store: const sessions = new Map() (Line 31)                        │
│ • Single Password HTTP Basic Auth: checkAuth() via process.env.DASHBOARD_PASSWORD      │
│ • Endpoints:                                                                           │
│   - POST /api/creative/research       -> Calls performAdaptiveResearch                 │
│   - POST /api/creative/directions     -> Calls generateDirections                      │
│   - POST /api/creative/hooks          -> Calls generateHooks                           │
│   - POST /api/creative/plots          -> Calls generatePlots                           │
│   - POST /api/creative/storyworld     -> Calls generateStoryWorld                      │
│   - POST /api/creative/synthesize-script -> Calls synthesizeMasterScript & runGate     │
│   - POST /api/creative/rewrite-scene  -> Calls rewriteScene                            │
│   - POST /api/run                     -> Dispatches payload to Magnific Flows API      │
│   - GET  /api/status/:runId           -> Polls Magnific Flows run status               │
│   - GET  /api/download                -> Proxies final MP4 video file download         │
└───────────────────┬───────────────────────────────────────────────┬────────────────────┘
                    │                                               │
┌───────────────────▼──────────────────────────┐    ┌───────────────▼────────────────────┐
│ CREATIVE & SCRIPT INTELLIGENCE ENGINE        │    │ VIDEO GENERATION ENGINE            │
│ engine/creative.js (837 lines):              │    │ engine/magnific.js (274 lines):    │
│ • Prompt engineering for 5 stages.           │    │ • Flow ID: 0MQyTfWvQD              │
│ • Website URL passed as raw text (no crawl). │    │ • Inputs: scenes_2, character_1_2, │
│ engine/gate.js (235 lines):                  │    │   character_2_2, setting_2, poduct,│
│ • 18-point Section 8 Quality Gate rubric.    │    │   images, aspect_ratio.            │
│ engine/compiler.js (144 lines):              │    │ • 1x1 transparent PNG fallback     │
│ • Shot specification & camera continuity.    │    │   when logo or product is omitted. │
│ engine/claude.js (58 lines):                 │    │ • Polling timeout: 40 mins (160x15s│
│ • Messages API wrapper (claude-sonnet-4-6).  │    │ engine/store.js (27 lines):        │
│                                              │    │ • Flat file data/scripts.json      │
└──────────────────────────────────────────────┘    └────────────────────────────────────┘
```

---

## 4. CRITICAL USER JOURNEY ASSESSMENT (A THROUGH K)

| Workflow | Verified Working Behavior | Covered by Automated Tests | Exists but Not Adequately Tested | Known Bugs & Gaps | Unverified Assumptions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Start a New Film** | Navbar button opens in-app confirmation modal; confirming resets film state to Stage 1. | Covered by `Regression 6`, `Regression 7`, `Business Bug Test 6`, `Studio Reset`. | Edge-case where multiple modal dialogs overlap. | **Fixed in commit 33bdfe6**: ReferenceError on `setGeneratedScript` was previously thrown on confirmation click. | Assumes user always wants to keep brand profile on reset. |
| **B. Navigate Forward & Backward** | Forward button advances stage; back button decrements stage; progress bar reflects active stage. | Covered by `Guided Studio V4: 8 Stages Definition`, `Brief Transition Test 3-10`. | Navigating back from Stage 8 (Video) to Stage 7 (Script) while video is generating. | No explicit warning that navigating away from Stage 8 aborts visual polling (though backend run continues). | Assumes user will not use browser back/forward buttons (hash routing is not implemented). |
| **C. Change Earlier Decision** | User can click earlier stage tabs or back button to change Angle or Hook. | Covered by `Studio Stage 04 Idea: Changing Idea invalidates downstream`. | Changing Duration, Platform, or Aspect Ratio in Stage 3. | **Verified Bug**: Changing Language or Style in Stage 3 does NOT invalidate `directionsList` in Stage 4. | Assumes user understands that changing an idea invalidates downstream copy. |
| **D. Downstream Stale Warnings** | Modifying an idea after script generation displays amber warning banner and sets `hasStaleWarning(true)`. | Covered by `Studio Stale Warning: Modifying idea AFTER script shows warning`, `Regression 8`. | Changing characters or setting in Stage 6 after script generation. | Stale banner does not appear if user edits custom constraints in Stage 6 after script is synthesized. | Assumes user notices amber warning banner. |
| **E. Generate a Script** | Clicks Continue on Stage 6; fires `/api/creative/synthesize-script`; displays animated loading screen with tips; transitions to Stage 7 on success. | Covered by `synthesis pass #1: PASSED`, `Studio Stage 06 Story: Synthesis loading screen`. | Timeout handling if Anthropic API takes > 60 seconds (client has 290s backend timeout). | If Claude times out or fails 4 times on gate, returns 422 error; UI stays on Stage 6. | Assumes user has sufficient Anthropic API credits. |
| **F. Edit or Rewrite Script** | Inline editing on all 4 scenes; Scene AI Rewriter opens modal on specific scene with custom prompt and Ctrl+Enter shortcut. | Covered by `Studio Custom Inputs: Scene AI Rewrite supports shortcut`. | Direct multi-line paste into scene visual direction textarea. | Inline textarea resizing can cause horizontal layout overflow on screens < 1200px. | Assumes AI rewriter will preserve single-location continuity rule M13. |
| **G. Section 8 Quality Gate** | Audits Devanagari dialogue, claims ("100%", "best in town"), word speed, continuous setting, and eye-lines. | Covered by `Quality gate rejects Devanagari dialogue when English`, `engine.test.js`. | Auditing pre-written scripts from external files (Feature does not exist yet). | Gate runs exclusively as part of generation; no standalone test endpoint exists. | Assumes gate rules match all commercial industry standards. |
| **H. Compile Shot Specifications** | Deconstructs script into static world locks and camera movement parameters; passed to Magnific flow. | Covered by `Guided Studio V4: End-to-End Synthesis and Shot Spec Generation`. | Non-standard scene counts (e.g. 3 or 5 scenes). Currently hardcoded to 4 scenes. | If a custom script has < 4 scenes, compiler fills missing scenes with defaults. | Assumes video model understands camera motion prompts. |
| **I. Start Video Generation** | Clicks "Create Video Now" on Stage 8; calls `/api/run`; passes scenes, characters, setting, base64 images; receives `runId`; starts 15s polling. | Covered by `server.test.js: approve saves record; run strips notes`, `Magnific explicitInputs`. | Uploading very large images (> 8MB JPEG) causing HTTP payload rejection. | **Critical Risk**: Base64 data URLs inflate JSON payload size beyond 10MB, risking Node.js memory pressure. | Assumes Magnific Flow `0MQyTfWvQD` remains active and unchanged on remote server. |
| **J. Handle Video Failure & Retry** | If Magnific returns `failed: true` or polling times out (160 attempts), sets `errorMessage` and displays error banner; "Create Video Now" acts as retry. | Covered by `server.test.js: unknown session -> 404`. | Network disconnections during polling recovery. | If page is refreshed during video generation, polling state is lost because `runId` is not stored in localStorage. | Assumes user will wait up to 4 minutes without refreshing browser. |
| **K. Reset Project & Start Fresh** | In-app modal confirmation; on confirm, calls `handleExecuteNewProject(false)` resetting 35+ states and setting `studioStage = 'business'`. | Covered by `Studio Reset: New Film restarts process and opens editable Business stage`. | Resetting while video is actively generating in background. | Imperative reset requires maintaining 35+ state setters; high risk of missed state variables. | Assumes brand details in `clevertize_user_context` should survive project reset. |

---

## 5. EXISTING TEST COVERAGE ANALYSIS

### 5.1 Critical Behaviors Verified by Existing Tests
- ✅ **New Film Reset Integrity:** `Studio Reset` and `Regression 6` verify that explicit choices are wiped while brand profile survives.
- ✅ **Stage 01 Business Field Safety:** `Business Bug Tests 1–8` verify that typing single or multiple characters does NOT trigger navigation or collapse cards.
- ✅ **Brief Suggestions Fallbacks:** `Brief Transition Tests 3–10` verify that suggestions fail gracefully without crashing when network drops.
- ✅ **Downstream Invalidation on Idea Change:** `Studio Stage 04 Idea: Changing Idea invalidates downstream` verifies that selecting a new idea resets openings and downstream script states.
- ✅ **Quality Gate Enforcement:** `Quality gate rejects Devanagari dialogue when English` and 18-point rubric tests verify that invalid claims and language mismatches are blocked.
- ✅ **Magnific Fallback Safety:** `Magnific explicitInputs: Always satisfies logo requirement even when omitted` verifies that the 1x1 transparent PNG fallback prevents flow crashes.

### 5.2 Critical Behaviors LACKING Automated Test Coverage
- ❌ **Stage 3 Invalidation Gap:** No test verifies that changing Language in Stage 3 invalidates downstream directions in Stage 4.
- ❌ **Browser Reload Survival:** Zero tests verify whether active generation can resume after a browser page refresh.
- ❌ **Payload Size Limits:** Zero tests assert maximum allowable image file upload size before Base64 payload rejection.
- ❌ **Standalone Script Auditing (Journey B):** No test exists for auditing an imported user script outside of a full generation session.
- ❌ **URL Scraping (Journey C):** No tests exist for HTML parsing or Amazon product page scraping (feature not yet implemented).

---

## 6. PROPOSED REGRESSION TEST PLAN

These 6 additive tests will be implemented during upcoming milestones to lock down regression safety before structural refactoring:

| Priority | Test Name & Behavior | Why It Matters | Existing Similar Test | Target Test File | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1** | **`test('Studio Invalidation: Changing Stage 03 Language invalidates downstream directions')`** | Prevents the active bug where changing language to Hindi leaves old English creative directions in Stage 4. | `Studio Stage 04 Idea: Changing Idea invalidates downstream` | `test/studio.test.js` | None. Can be added immediately in Milestone 2. |
| **P2** | **`test('Studio Facade: GuidedStudio.jsx re-exports all modular screens without interface drift')`** | Ensures that modularizing screens into `src/features/studio/screens/` does not break file-read or export tests in `test/studio.test.js`. | `Guided Studio V4 Architecture: 8 Stages Definition` | `test/studio.test.js` | Milestone 2 component extraction. |
| **P3** | **`test('Studio Facade: CreativeWorkspace.jsx maintains SceneAIRewriteModal re-export')`** | Protects `test/studio.test.js:1156-1160` from failing when `CreativeWorkspace.jsx` is pruned of dead code. | `Studio Custom Inputs: Scene AI Rewrite supports shortcut` | `test/studio.test.js` | Milestone 2 modal extraction. |
| **P4** | **`test('Script Ingestion: Standalone runGate audits pre-written 4-scene screenplay')`** | Verifies that Journey B (Start with an Existing Script) can validate scripts without running a full LLM session. | `Quality gate rejects Devanagari dialogue` | `test/engine.test.js` | Milestone 6 backend route exposure. |
| **P5** | **`test('Video Dispatch: Sanitizer safely redacts Base64 image payloads in server logs')`** | Prevents mega-byte image strings from filling disk log files and leaking memory. | `server.test.js: run strips edit-only notes` | `test/server.test.js` | Milestone 5 S3 migration. |
| **P6** | **`test('State Machine: Atomic RESET_STUDIO action clears exactly all film-scoped fields')`** | Validates that the native React Context reducer cleanly resets all workflow fields without relying on 35 imperative setters. | `Studio Reset: New Film restarts process` | `test/studio.test.js` | Milestone 2 Context implementation. |

---

## 7. BACKUP AND RECOVERY VERIFICATION

### 7.1 Verified Recovery Artifacts
1. **Immutable Git Tag:**
   - Tag: `v1-baseline`
   - Commit: `33bdfe64ef927e1323f51a3e86dcb5ac83138b39`
   - Verification: Verified present in local Git ref store and on GitHub remote (`origin/v1-baseline`).
2. **Fallback Main Branch:**
   - Branch: `main` (clean working tree, tracking `origin/main`).
3. **Physical Standalone Directory Backup:**
   - Path: `F:\Video App NEW\backups\cleverdashboard_baseline_20261015\`
   - Size: 146.58 MB (15,711 files).
   - Critical Files Confirmed on Disk:
     - `server.js` (Verified: `True`)
     - `package.json` (Verified: `True`)
     - `.git/` directory (Verified: `True`)
     - `.env` (Verified: `True`)
     - `src/` and `engine/` source directories (Verified: `True`)

### 7.2 Recovery Limitations & Recovery Procedures
- **Limitation:** The backup directory is located on local drive `F:\`. If drive `F:\` experiences hardware failure, the secondary recovery source is the GitHub remote `v1-baseline` tag.
- **Rollback Procedure (Fastest):**
  ```powershell
  git checkout -f redesign-v2
  git reset --hard v1-baseline
  ```
- **Disaster Recovery (Full Disk Restore):**
  Copy `F:\Video App NEW\backups\cleverdashboard_baseline_20261015\` back into `F:\Video App NEW\cleverdashboard\`.

---

## 8. RISKS THAT MUST BE ADDRESSED BEFORE REFACTORING

1. **Test Harness String Coupling (Critical Risk):**
   - `test/studio.test.js` does NOT just mount React components; it reads the source text of `src/App.jsx`, `src/components/GuidedStudio.jsx`, and `src/components/CreativeWorkspace.jsx` using `fs.readFileSync` and asserts specific code strings exist (e.g. `workspaceSrc.includes('SceneAIRewriteModal')`).
   - *Mitigation Requirement:* When modularizing `GuidedStudio.jsx` and `CreativeWorkspace.jsx`, they must remain as facade re-exporters containing matching export names so file-read tests do not fail.
2. **State Desynchronization on Incomplete Resets (High Risk):**
   - Root `App.jsx` currently maintains 67 `useState` hooks. Resetting requires calling 35+ setters in sequence.
   - *Mitigation Requirement:* Milestone 2 must consolidate workflow state into a single reducer action (`RESET_STUDIO`) before any visual redesign begins.
3. **Base64 Memory Pressure (High Risk):**
   - Storing high-res product photos as Base64 strings in `userContext` and passing them through JSON causes heap pressure.
   - *Mitigation Requirement:* Retain current payload handling through Milestone 4; replace with presigned direct S3 uploads in Milestone 5.

---

## 9. EXPLICIT ACCEPTANCE CRITERIA FOR MILESTONE 2

Milestone 2 (Incremental Frontend Modularization & State Stabilization) will be approved only when all of the following conditions are satisfied:

1. **Native React 19 State Context (`StudioProvider`):**
   - Implemented via built-in `useReducer` and split Contexts (`StudioStateContext` and `StudioDispatchContext`) with **zero new npm dependencies**.
   - All 67 `useState` hooks are removed from `App.jsx`.
2. **Screen Extraction with Facade Compatibility:**
   - Screens 01 to 08 extracted to `src/features/studio/screens/Screen01Business.jsx` through `Screen08Video.jsx`.
   - `src/components/GuidedStudio.jsx` re-exports all 8 screens and helper bars.
   - `SceneAIRewriteModal` extracted to `src/features/studio/components/SceneAIRewriteModal.jsx`, and re-exported from `CreativeWorkspace.jsx`.
3. **Downstream Invalidation Bug Fixed:**
   - Changing Stage 3 Language or Style dispatches `INVALIDATE_DOWNSTREAM`, clearing downstream creative directions.
   - Changing Stage 4 Idea cleanly clears openings, plots, and script.
4. **Permanent New Film Reset:**
   - Dispatches `RESET_STUDIO`, resetting exactly all film-scoped state while strictly preserving saved brand profile.
5. **Testing Verification:**
   - `cmd.exe /c npm test` passes all 117 tests with 0 failures.
   - Zero console errors, zero syntax errors, and zero undeclared variables.

---

## 10. UNRESOLVED TECHNICAL QUESTIONS

1. **Test Suite Modernization:**
   - Should we modernize `test/studio.test.js` in a future milestone to use React component testing (e.g. React Testing Library) rather than AST/string inspection with `fs.readFileSync`?
   - *Recommendation:* Keep existing AST tests intact during Milestone 2 using facades; refactor test assertions in Milestone 4.
2. **Database Provisioning (Milestone 5):**
   - Will the team provide a cloud PostgreSQL connection string (Supabase / Neon / AWS RDS) for Milestone 5, or should local SQLite / Docker PostgreSQL be configured as a fallback?
3. **Image Upload Service (Milestone 5):**
   - Which S3-compatible service is preferred for direct presigned uploads: Cloudflare R2, AWS S3, or Supabase Storage?

---
*End of Milestone 1 Verification Report. Awaiting explicit authorization to proceed to Milestone 2.*
