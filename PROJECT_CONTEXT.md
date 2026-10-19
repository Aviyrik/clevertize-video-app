# CleverCuts (Clevertize Video Studio) — Project Context & Handoff Guide

> **Quick Start for Antigravity on a New System (Desktop / Laptop):**
> When starting a new session on your laptop or any other machine, tell Antigravity:
> *"Read `PROJECT_CONTEXT.md` to get complete context on the project architecture, recent progress, and setup."*

---

## 1. Repository & Git Information

- **GitHub Repository**: [https://github.com/Aviyrik/clevertize-video-app.git](https://github.com/Aviyrik/clevertize-video-app.git)
- **Active Git Branches**:
  - `main`: Primary production branch (always tested and deployable).
  - `redesign-v2`: V2 feature branch (kept strictly in sync with `main`).
- **Clone / Setup on New Machine**:
  ```bash
  git clone https://github.com/Aviyrik/clevertize-video-app.git
  cd clevertize-video-app
  npm install
  npm run build
  npm test
  npm start
  ```

---

## 2. Hosting & Deployment

The application is a full-stack Node.js + Express backend serving a Vite React frontend.

- **Recommended Host**: **Render.com** (via `render.yaml` blueprint).
  - Deploy URL / Web Service: Connected to `https://github.com/Aviyrik/clevertize-video-app`.
  - Automatic deployment triggers on every `git push origin main`.
- **Alternative Host**: **Railway.app** or **Docker**:
  - `Dockerfile` is included in the project root.
  - Port: `3000`.

---

## 3. Environment Variables & Credentials (`.env`)

> ⚠️ **Security Rule**: Real API keys and database credentials must **never** be committed to GitHub. They live in your local `.env` file (which is git-ignored).

### `.env` File Structure
Create a `.env` file in the root folder with the following variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# AI Intelligence Provider (Claude Sonnet)
# Get from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-6

# Video Rendering Engine (Magnific AI)
# Get from: https://magnific.ai/
MAGNIFIC_API_KEY=your_magnific_api_key_here
MAGNIFIC_FLOW_ID=0MQyTfWvQD

# Database Storage (PostgreSQL - Optional)
# Neon, Supabase, Render, Railway, or local PostgreSQL.
# If left blank, the app safely falls back to local atomic JSON files.
DATABASE_URL=
```

---

## 4. Architecture & Key Codebase Paths

- **Backend Entry**: [`server.js`](file:///f:/Video%20App%20NEW/cleverdashboard/server.js)
  - Express server handling API routes: `/api/generate`, `/api/run`, `/api/status/:runId`, `/api/businesses`, `/api/projects`, `/api/auth`.
  - Serves static assets from `dist/` with `no-cache` headers on `index.html` to eliminate browser stale caching.
- **Frontend Entry**: [`src/main.jsx`](file:///f:/Video%20App%20NEW/cleverdashboard/src/main.jsx) & [`src/App.jsx`](file:///f:/Video%20App%20NEW/cleverdashboard/src/App.jsx)
  - Application shell and state orchestration.
- **V2 Creation Entry Hub**: [`src/components/v2/CreationEntryHub.jsx`](file:///f:/Video%20App%20NEW/cleverdashboard/src/components/v2/CreationEntryHub.jsx)
  - The starting dashboard presenting exactly **3 entry points**:
    1. **Start with a Brief** (Guided 8-stage studio workflow, recommended).
    2. **Start with an Existing Script** (Fast track direct to Script Studio Stage 07).
    3. **Start with a Website URL** (Automated intelligence store extraction).
  - Displays the active brand confirmation bar (`Active Brand: [Name] · [Category] · [Town]`) with `Edit Brand Details` action.
- **Business Onboarding Modal**: [`src/components/v2/BusinessOnboardingModal.jsx`](file:///f:/Video%20App%20NEW/cleverdashboard/src/components/v2/BusinessOnboardingModal.jsx)
  - 4-step wizard:
    - Step 1: Business Identity (text input for Brand Name + 12 rich visual category cards with verified imagery).
    - Step 2: Location & Audience (category-specific customer personas, town input, mandatory field validation).
    - Step 3: Brand Assets (compact, inviting logo dropzone, brand tone pills, website URL).
    - Step 4: Confirmation & Summary.
- **Guided Studio & Stages**: [`src/components/GuidedStudio.jsx`](file:///f:/Video%20App%20NEW/cleverdashboard/src/components/GuidedStudio.jsx)
  - 8-stage creative production pipeline:
    - `01 Business`: Automatically bypassed for configured brands; displays confirmed brand profile.
    - `02 Brief`: Shows active brand confirmation header (`Creating Video For: [Name]`) and returns to Creation Hub on Back.
    - `03 Settings`: Style, Language, Duration, Platform.
    - `04 Idea`: Ranked consumer tensions and creative concepts.
    - `05 Opening`: Creator hooks and visual scroll-stoppers.
    - `06 Story`: 4-scene narrative arc and world building.
    - `07 Script`: 18-point Section 8 Quality Gate, dialogue verification, copy/save script.
    - `08 Video`: Magnific AI GPU video production, scene preview, share/download.
- **Database Adapter**: [`src/db/index.js`](file:///f:/Video%20App%20NEW/cleverdashboard/src/db/index.js)
  - Handles PostgreSQL persistence with automatic fallback to local JSON file persistence.
- **Automated Tests**: [`test/studio.test.js`](file:///f:/Video%20App%20NEW/cleverdashboard/test/studio.test.js)
  - Comprehensive suite with **152 passing automated tests**. Run with `npm test`.

---

## 5. Recent Fixes & Milestones Completed

1. **Eliminated Redundant 4th Entry Point**: Removed the competing `"Open Studio for {businessName}"` button from the Creation Hub. The 3 cards are now the exclusive starting points.
2. **Bypassed Redundant Stage 01 ("Tell us about your business")**: Users who completed business onboarding are taken directly to **Stage 02 (Brief)** when starting a film.
3. **Active Brand Confirmation**: Added clear brand context pills on both the Creation Hub and the Brief screen (`Creating Video For: Viki Garage · Automobile & Garage · Bangalore`).
4. **Category Imagery & Audience Personas**: Step 1 features 12 visual cards with verified Unsplash images (fixed Automobile & Garage 404). Step 2 features category-matched target audiences.
5. **Mandatory Step Validation**: Business Onboarding strictly enforces required fields before allowing users to advance to the next step.
6. **No-Cache Server Headers**: Express delivers `Cache-Control: no-cache, no-store, must-revalidate` for `index.html` to prevent stale UI screens across browsers.
7. **Google Authentication Activated**: "Continue with Google" is fully active across `AuthScreen` and `AuthModal`. Supports Google Identity Services (via `GOOGLE_CLIENT_ID` in `.env`) as well as instant one-click Google Sign-In with persistent database user profiles and session tokens.

---

## 6. Daily Commands Cheat-Sheet

| Task | Command |
|---|---|
| Run tests | `npm test` |
| Build production frontend | `npm run build` |
| Start full-stack server | `npm start` |
| Start Vite dev server | `npm run dev` |
| Check git status | `git status` |
| Sync to GitHub | `git push origin main && git push origin redesign-v2` |
