# CleverCut – Complete End-to-End User Flow & Specification Document

> **Document Type:** Comprehensive User Flow & Feature Specification  
> **Target Audience:** Product Managers, QA Engineers, Designers, and Developers  
> **Application:** CleverCut AI Video Studio (`v2.8 script-mvp`)  
> **Date:** November 2026  
> **Tone:** Clear, simple language, step-by-step nested numbering, fully grounded in the actual codebase.

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Account Creation & Authentication](#2-account-creation--authentication)
3. [First-Time Onboarding Experience](#3-first-time-onboarding-experience)
4. [Business & Brand Profile Management](#4-business--brand-profile-management)
5. [Video Creation — Simple Mode via Brief](#5-video-creation--simple-mode-via-brief)
6. [Video Creation — Simple Mode via Existing Script](#6-video-creation--simple-mode-via-existing-script)
7. [Video Creation — Simple Mode via Website / Product URL](#7-video-creation--simple-mode-via-website--product-url)
8. [Video Creation — Director Mode (Guided Studio 7 Stages)](#8-video-creation--director-mode-guided-studio-7-stages)
9. [Creative Direction & Research Engine](#9-creative-direction--research-engine)
10. [Script Generation, Scene Architecture & Editing](#10-script-generation-scene-architecture--editing)
11. [Storyboard & Shot Planning Stage](#11-storyboard--shot-planning-stage)
12. [Characters, Environment & Visual Consistency](#12-characters-environment--visual-consistency)
13. [Reference Images & Visual Assets (Product & Logo)](#13-reference-images--visual-assets-product--logo)
14. [Video Generation, Routing & Magnific Engine](#14-video-generation-routing--magnific-engine)
15. [Video Review, Post-Production & Download](#15-video-review-post-production--download)
16. [Project & Workspace Management](#16-project--workspace-management)
17. [User Settings, Profile & Account Deletion](#17-user-settings-profile--account-deletion)
18. [Additional Discovered Features & Helpers](#18-additional-discovered-features--helpers)
19. [Error Handling, Fallbacks & Offline Recovery](#19-error-handling-fallbacks--offline-recovery)
20. [Exhaustive Master Catalog of Options & Presets](#20-exhaustive-master-catalog-of-options--presets)
21. [Technical Implementation Appendix](#21-technical-implementation-appendix)
22. [Unclear, Missing or Unimplemented Behaviour](#22-unclear-missing-or-unimplemented-behaviour)

---

## 1. Application Overview

CleverCut is an AI-powered commercial video creation platform designed specifically for local and regional businesses in India. It automates commercial production from the initial pitch to the final render.

### 1.1 The Two Primary Studio Modes
The platform offers two distinct modes for creating videos:

1. **Simple Mode (`SimpleBusinessStudio`):**
   - A fast, streamlined 3-step wizard designed for non-technical business owners.
   - **Step 1:** Enter an offer, choose language, tone, duration, and format.
   - **Step 2:** Pick from 3 AI-generated ad packages (Script + Hook).
   - **Step 3:** Preview the production brief and trigger video generation.

2. **Director Mode (`GuidedStudio`):**
   - An in-depth, 7-stage professional workflow giving creators fine-grained control over every aspect of production:
     - Stage 1: Brief & Concept
     - Stage 2: Target Audience & Production Settings
     - Stage 3: Creative Directions (4 strategic angles)
     - Stage 4: Opening Hooks (4 psychological triggers)
     - Stage 5: Master Script (Multi-scene dialogue & visual actions)
     - Stage 6: Storyboard (Shot planning & Annex-A prompts)
     - Stage 7: Video Generation & Final Render

### 1.2 Core Data Hierarchy
- **User Account:** Holds login credentials, session tokens, and personal settings.
- **Business Profile:** Represents an individual brand or business (e.g., Practo, Chai Point, local saree shop) with name, category, city, target audience, tone, and brand logo.
- **Project (Film Project):** Belongs to a single business profile and contains briefs, selected creative directions, scripts, scenes, and generated video tasks.

---

## 2. Account Creation & Authentication

### 2.1 User Registration (Sign Up)
1. User opens the application in a web browser.
2. If no valid session token exists, the system displays the **Auth Modal / Auth Screen**.
3. User selects the **"Create an account"** tab.
4. User sees the registration form with the following fields:
   - **Full Name:** Text input (*Mandatory*).
   - **Email Address:** Email text input (*Mandatory*). Must contain an `@` symbol.
   - **Password:** Password input (*Mandatory*). Minimum 6 characters required.
5. User clicks the **"Sign Up"** button.
6. The system performs client-side validation:
   - Validates that email is non-empty and well-formed.
   - Checks that password is at least 6 characters long.
7. If validation fails, an inline error banner appears (e.g., `"Password must be at least 6 characters"`).
8. If validation succeeds, the frontend sends a `POST /api/auth/register` request containing `{ name, email, password }`.
9. The backend verifies whether the email is already registered:
   - If the email exists, the backend returns HTTP 409 Conflict with `"Email already registered"`.
   - If new, the backend hashes the password (via bcrypt/SHA-256), creates the user record in database/store, generates a signed JWT token, and returns user data with the token.
10. The frontend stores the JWT token in `localStorage` (`clevercut_token`) and user object in state.
11. The modal closes, and the system automatically opens the **Business Onboarding Wizard** for first-time setup.

### 2.2 User Login
1. User clicks the **"Log In"** tab on the Auth Screen or Auth Modal.
2. User provides:
   - **Email:** Registered email address (*Mandatory*).
   - **Password:** Account password (*Mandatory*).
3. User clicks **"Log In"**.
4. Frontend validates that neither field is empty.
5. System sends `POST /api/auth/login` with `{ email, password }`.
6. Backend evaluates credentials:
   - If email not found or password does not match, returns HTTP 401 Unauthorized (`"Invalid email or password"`).
   - If credentials match, generates a JWT session token and returns user details.
7. Frontend saves the token to `localStorage` and updates authentication state.
8. If the user already has at least one business saved, the app loads their last active business and opens the **Creative Studio**.
9. If the user has zero businesses, the **Business Onboarding Wizard** automatically opens.

### 2.3 Password Reset Flow (Forgot Password)
1. On the Login tab, user clicks the **"Forgot Password?"** link.
2. The form transforms to the password recovery view.
3. User enters their registered email address (*Mandatory*).
4. User clicks **"Send Reset Link"**.
5. The application displays an on-screen notice: `"Password reset instructions will be sent to your email address if an account exists."`
   > *Note: In the current MVP release, this is an informational UI step; direct external SMTP delivery is mocked.*
6. User clicks **"Back to Login"** to return to standard authentication.

### 2.4 User Logout
1. User clicks their user avatar/profile pill located at the bottom of the left sidebar.
2. In the modal that opens, user clicks the **"Sign Out"** button.
3. The frontend clears the session:
   - Removes `clevercut_token` from `localStorage`.
   - Clears active user profile state, active business state, and active project state.
4. The user is returned to the logged-out Auth Screen immediately.

### 2.5 Session Expiry & Token Invalidation
1. If an API request returns HTTP 401 Unauthorized (due to token expiration or invalid signature):
2. The frontend central request interceptor catches the 401 error.
3. The invalid token is stripped from `localStorage`.
4. A notification warns the user that their session has expired.
5. The Auth Modal opens automatically over the current screen, preserving unsaved form drafts in memory where possible.

---

## 3. First-Time Onboarding Experience

When a newly registered user logs in, they cannot create a video without establishing a brand context. The system routes them through a 4-step wizard.

### 3.1 Step 1: Category Selection
1. The modal title reads: **"Select your business category"**.
2. A subtitle explains: *"We tailor script frameworks, hooks, and tone to your industry."*
3. The user is presented with a 12-card grid displaying:
   1. *Saree, Clothing & Apparel*
   2. *Jewellery & Accessories*
   3. *Sweets, Bakery & Restaurant*
   4. *Kirana, Grocery & Supermarket*
   5. *Electronics, Mobile & Appliances*
   6. *Salon, Spa & Beauty*
   7. *Healthcare, Clinic & Pharmacy*
   8. *Real Estate & Home Decor*
   9. *Gym, Fitness & Yoga*
   10. *Education, Coaching & Tuition*
   11. *Automobile & Garage*
   12. *Other Local Business*
4. User clicks one card. The card highlights with a bright accent border and checkmark.
5. User clicks the **"Next"** button.

### 3.2 Step 2: Basic Business Information
1. The modal displays the business profile form:
   - **Business Name:** Text box (*Mandatory*). E.g., "Practo", "Sri Lakshmi Silks".
   - **City / Location:** Text box (*Mandatory*). E.g., "Bangalore", "Mumbai".
   - **Phone / WhatsApp Number:** Optional contact string for on-screen calls to action.
   - **Website / Social Handle:** Optional URL or handle.
2. User clicks **"Upload Logo"** (*Optional*):
   - Opens local file browser accepting image formats (`.png`, `.jpg`, `.jpeg`, `.webp`).
   - Selected file is converted into a base64 Data URL and displayed as a square preview thumbnail.
   - User can click the "X" button to remove the uploaded logo.
3. User clicks **"Next"**.

### 3.3 Step 3: Brand Tone & Voice
1. User chooses the primary communication style for future ad scripts:
   - **Warm & Authentic (Default):** Friendly, relatable, community-focused.
   - **Festive & Vibrant:** High energy, celebration-oriented, deal-focused.
   - **Premium & Elegant:** Sophisticated, quality-conscious, aspirational.
   - **Direct & Problem-Solving:** Clear pain-point resolution, urgency, clear offer.
2. User clicks on one tone card to select it.
3. User clicks **"Next"**.

### 3.4 Step 4: Target Audience Definition
1. The screen displays an audience description textarea prefilled with a smart default tailored to the category chosen in Step 1.
   - *Example for Healthcare:* "Patients and families looking for trusted doctors and quick care."
   - *Example for Saree/Apparel:* "Women looking for festive ethnic wear and traditional silks."
2. User can edit this text freely or keep the prefilled recommendation.
3. User clicks **"Complete Setup"**.
4. System action:
   - Sends `POST /api/businesses` with all gathered fields.
   - Receives created business record with a unique `id`.
   - Sets this new business as the globally active business in the sidebar.
   - Closes the onboarding modal.
   - Lands the user directly on the **Creative Studio (Simple Mode)** with their new business context loaded.

---

## 4. Business & Brand Profile Management

Users can operate multiple businesses or client brands under a single user account.

### 4.1 Viewing All Businesses
1. User clicks **"My Businesses"** in the left sidebar navigation.
2. The main pane switches to the Business Directory view.
3. Each business card shows:
   - Business logo thumbnail (or initial letter badge if no logo).
   - Business name and category tag.
   - City / location.
   - Count of film projects created under this business.
   - A button: **"Select & Open Studio"**.
   - An **"Edit"** pencil icon.

### 4.2 Creating a New Business Profile
1. User clicks the **"+ New Business"** button in the top right of the Business Directory or in the sidebar dropdown.
2. The Business Onboarding Wizard opens (Steps 1 through 4 as documented in Section 3).
3. Upon completion, the new business is appended to the user's business list.

### 4.3 Switching Active Business
1. User clicks the business profile pill located at the top of the left sidebar.
2. A dropdown menu opens listing all businesses owned by the user.
3. User clicks on the desired business.
4. The system updates the active business state:
   - The sidebar header updates to the new business name and category.
   - The studio automatically updates its quick ideas, brand assets, and audience context.
   - Any currently open project from the previous business is closed, returning to a fresh studio state.

### 4.4 Editing Business Details
1. User navigates to **"My Businesses"** and clicks the **"Edit"** icon on a business card.
2. An edit modal opens prefilled with the business's current details:
   - Name, Category, City, Tone, Audience description, and Logo.
3. User modifies any field.
4. User clicks **"Save Changes"**.
5. System sends `PUT /api/businesses/:id` with updated payload.
6. Local state updates, and an on-screen toast confirms `"Business profile updated successfully"`.

---

## 5. Video Creation — Simple Mode via Brief

Simple Mode (`SimpleBusinessStudio`) is the fastest path from idea to video, requiring only 3 steps.

### 5.1 Step 1: Defining the Offer & Settings
1. User lands on **Step 1: Your Offer**.
2. Top banner displays the active brand badge: `CREATING VIDEO FOR [Business Name] | [Category] · [City]`.
3. **Quick Ideas Section:**
   - The system displays 6 clickable pill buttons containing tailored campaign concepts based on the business category.
   - *Example:* `+ Book a verified specialist consultation in 2 minutes`.
   - Clicking any quick idea immediately populates the main prompt textarea.
4. **Main Offer Textarea (*Mandatory*):**
   - Placeholder reads: *"e.g. Show why patients trust Practo in Bangalore for verified doctor consultations, instant video appointments, and express medicine delivery..."*
   - User types their commercial pitch, discount, or promotion (minimum 10 characters).
   - A live character counter displays below the box.
5. **Ad Language Selector (*Mandatory*):**
   - User selects one of 10 languages:
     `English`, `Hindi`, `Hinglish`, `Marathi`, `Kannada`, `Tamil`, `Telugu`, `Gujarati`, `Bengali`, `Punjabi`.
   - Default is `English`.
6. **Video Format Selector (*Mandatory*):**
   - User selects one of 4 creative styles:
     - `Creator / UGC` (Default): Front-facing camera, relatable monologue.
     - `Product Showcase`: Focus on product aesthetics, features, and close-ups.
     - `Humorous & Fun`: Lighthearted situational comedy with a comedic twist.
     - `Heartwarming Story`: Emotional narrative touching on family and trust.
7. **Video Dimension Selector (*Mandatory*):**
   - User selects aspect ratio:
     - `9:16 Vertical` (Default): For Instagram Reels, YouTube Shorts, TikTok.
     - `16:9 Landscape`: For YouTube main feed, TV screens, websites.
     - `1:1 Square`: For Instagram/Facebook feed posts.
8. **Video Length Selector (*Mandatory*):**
   - User selects target runtime:
     - `15s Hook`: 3 scenes base (Fast punchy ad).
     - `20s Standard` (Default): 4 scenes base (Commercial pacing, most popular).
     - `30s Extended`: 6 scenes base (Full story with complete build-up).
   - An informational note clarifies: *Adding a logo in outro adds a final 5s scene.*
9. **Product or Store Photo (*Optional*):**
   - User clicks **"Attach a photo of your product or storefront"**.
   - User selects a local image (`.jpg`, `.png`, `.webp`).
   - Image displays in preview with a button to remove or replace.
10. User clicks **"Generate 3 Ad Scripts →"**.
11. System validation:
    - If textarea has fewer than 10 characters, button is disabled or alerts: `"Please enter at least 10 characters about your offer."`
12. Backend processing:
    - Frontend sends `POST /api/ai/simple-packages` containing `{ brief, category, language, format, duration, tone, businessName }`.
    - Backend executes `generateSimpleAdPackages()` via Anthropic Claude 3.5 Sonnet.
    - AI synthesizes 3 complete ad packages simultaneously:
      - Option 1: Direct Offer / Problem-Solution approach.
      - Option 2: Emotional / Storytelling angle.
      - Option 3: UGC / Customer Testimonial angle.
    - Each package contains: catchy title, target audience summary, opening hook line, and full scene-by-scene script breakdown with visual actions and dialogue.
13. Screen transitions to **Step 2: Choose Script**.

### 5.2 Step 2: Choosing & Customizing the Script
1. The user is presented with 3 distinct script package cards side-by-side or stacked.
2. Each package card displays:
   - Package Title and Style badge.
   - Opening Hook preview (highlighted in an accent box).
   - Scene breakdown accordion (Scene 1 Hook, Scene 2 Build, Scene 3 Climax, Scene 4 Call to Action).
   - Estimated duration tag (e.g., `20s · 4 Scenes`).
3. User selects their preferred package by clicking **"Select This Concept"**.
4. An editable drawer expands showing the complete script:
   - User can edit the voiceover / dialogue for any scene.
   - User can edit the visual action description.
   - Scene duration badges update dynamically.
5. User clicks **"Proceed to Video Production →"**.
6. System compiles the chosen script into the standardized 8-part commercial production schema (`Annex-A`).
7. Screen transitions to **Step 3: Produce Video**.

### 5.3 Step 3: Production Review & Render Dispatch
1. The user sees the final pre-production summary screen:
   - **Media Check:** Confirms aspect ratio (`9:16`, `16:9`, or `1:1`), detected product photo, and detected business logo.
   - **Scene Manifest:** Shows each scene's visual prompt, dialogue, and timing.
   - **Estimated Render Time:** Displays expected processing time (~2 to 3 minutes).
2. User clicks the high-visibility button: **"Render Commercial Video 🚀"**.
3. System action:
   - Frontend triggers `POST /api/generate-video`.
   - Backend evaluates the combination of Aspect Ratio (`9:16` vs `16:9` vs `1:1`), Product Photo (Present vs Absent), and Brand Logo (Present vs Absent).
   - Backend selects the exact Magnific Flow ID (one of 12 distinct pipeline flows).
   - Sends payload to Magnific API.
   - Backend receives `task_id` and registers the job in local database.
4. Screen switches to the live rendering monitor (documented in Section 14).

---

## 6. Video Creation — Simple Mode via Existing Script

If a user already has an approved script written by their copywriter, they can bypass AI script generation.

### 6.1 Step 1: Script Input & Normalization
1. On the Creative Studio homepage, user clicks the button: **"Start with an Existing Script"**.
2. The **Existing Script Modal (Step 1 of 2)** opens.
3. Top bar provides two one-click sample format buttons for quick testing:
   - `Kirana UGC (Hindi)`
   - `Chai Point Quick Rush (English)`
4. **Target Video Duration Selector:**
   - User picks `15s` (3–4 scenes), `20s` (4–5 scenes), or `30s` (5–6 scenes).
5. **Video Dimension Selector:**
   - User picks `9:16 Vertical`, `16:9 Landscape`, or `1:1 Square`.
6. **Script Content Textarea (*Mandatory*):**
   - User pastes their script text.
   - Supports various standard script formats:
     - Standard numbered scenes (`SCENE 1: ... Visual: ... Dialogue: ...`)
     - Plain text dialogue blocks with speaker names.
     - Audio-visual column style.
7. User clicks **"Verify Script & Gate"**.
8. System validation & engine processing:
   - Frontend validates minimum text presence.
   - Script is analyzed by the client-side parser and `POST /api/ai/normalize-script`.
   - The engine checks for audio style (Voiceover vs Dialogue) using regex heuristics (`detectScriptAudioMode`).
   - The engine validates scene count against target duration.
   - If scenes exceed or fall short of the duration thresholds, the system automatically segments or pads them to match the target runtime.
9. Modal transitions to **Step 2: Review Shots**.

### 6.2 Step 2: Shot Review & Production Prep
1. The screen displays the parsed scenes in distinct cards:
   - **Scene Header:** Shot number, timing (e.g., `Scene 1 (0-5s)`), and shot type (e.g., `Medium Close-up`).
   - **Visual Action:** The physical scene description for AI video rendering.
   - **Spoken Audio:** Spoken line in quotes, with speaker identity.
2. User can freely edit both the visual and dialogue fields.
3. User clicks **"Approve & Create Project"**.
4. System creates a new Film Project record, populates it with the normalized scenes, closes the modal, and routes the user directly to **Stage 7 (Video Generation)** ready to render.

---

## 7. Video Creation — Simple Mode via Website / Product URL

CleverCut can automatically analyze an existing website or Amazon product page to extract brand identity, selling propositions, and product imagery.

### 7.1 Step 1: Entering the URL
1. On the Creative Studio screen, user clicks **"Start with a Website URL"**.
2. The **URL Research Modal** opens.
3. User enters a URL into the input field:
   - E.g., `https://www.practo.com` or `https://www.amazon.in/dp/B08N5WRWNW`.
4. User clicks **"Scrape & Analyze"**.

### 7.2 Step 2: Security Validation & Web Scraping
1. The frontend calls `POST /api/research/url` with `{ url }`.
2. **SSRF Security Protection (`engine/netguard.js`):**
   - The backend validates the URL hostname against private IP ranges (`127.0.0.1`, `10.0.0.0/8`, `192.168.0.0/16`, AWS/GCP metadata endpoints).
   - Ensures no internal server resources can be attacked.
   - Blocks illegal redirect hops at connection time.
3. **Scraping Engine:**
   - Fetches the raw HTML.
   - Extracts page title, meta descriptions, OpenGraph tags, and main body text.
   - If an Amazon URL is detected, the scraper extracts product title, pricing, bullet points, and main product gallery images.
4. **Claude AI Brand Extraction:**
   - The raw text is passed to Claude 3.5 Sonnet to extract:
     - Core Value Proposition.
     - Key Product Features / Benefits.
     - Target Audience Persona.
     - Brand Tone and Recommended Colors.
     - Extracted Product Image URL.

### 7.3 Step 3: Reviewing Extracted Intelligence
1. The modal displays the research findings in an editable card:
   - **Extracted Business / Product Name:** Editable text input.
   - **Key Selling Hook:** Editable text input.
   - **Detailed Brief Summary:** Auto-generated pitch text ready for video scriptwriting.
   - **Detected Product Image:** Thumbnail preview.
2. User clicks **"Use This Information in Studio"**.
3. System transfers the extracted data directly into the Studio Offer textarea and pre-attaches the product image.
4. The modal closes, leaving the user on Step 1 of Simple Mode with all fields prefilled.

---

## 8. Video Creation — Director Mode (Guided Studio 7 Stages)

Director Mode is designed for commercial directors and agencies requiring complete oversight across 7 stages.

```
Stage 1: Brief  ──>  Stage 2: Settings  ──>  Stage 3: Idea  ──>  Stage 4: Opening  ──>  Stage 5: Script  ──>  [Stage 6: Story]*  ──>  Stage 7: Video
```
*\*Note: In the current UI build, Stage 6 Storyboard automatically hands off directly into Stage 7 Script/Video for streamlined production.*

### 8.1 Stage 1: Brief & Core Offer (`Screen02Brief`)
1. User clicks **"Director Mode"** in the top navigation toggle.
2. User lands on Stage 1.
3. Form fields:
   - **Campaign Objective:** Dropdown (*Brand Awareness, Direct Conversions, Festive Sale, Product Launch*).
   - **Core Offer & Pitch:** Detailed multi-line textarea describing the product, discount, or announcement.
   - **Target Customer Pain Point:** What problem is being solved for the customer.
4. User clicks **"Save & Continue to Settings →"**.
5. System auto-saves project state and advances to Stage 2.

### 8.2 Stage 2: Target Audience & Production Settings (`Screen03Settings`)
1. User configures production technical parameters:
   - **Ad Language:** 10 Indian languages dropdown.
   - **Target Duration:** `15s`, `20s`, or `30s`.
   - **Aspect Ratio:** `9:16 Vertical`, `16:9 Landscape`, `1:1 Square`.
   - **Brand Tone:** 4 tone options.
   - **Target Demographic Details:** Age group, location, gender focus.
   - **Per-Video Logo:** Option to use business profile logo or upload a campaign-specific logo.
2. User clicks **"Generate Creative Directions →"**.
3. System sends `POST /api/ai/directions`.
4. Advances to Stage 3.

### 8.3 Stage 3: Creative Directions & Angles (`Screen04Idea`)
1. The user is presented with 4 distinct strategic angles generated by AI:
   - **Angle 1:** High Relatability / Everyday Slice of Life.
   - **Angle 2:** Problem First / Dramatic Pain Point.
   - **Angle 3:** Benefit First / Direct Demonstration.
   - **Angle 4:** Social Proof / FOMO & Trend.
2. Each card shows: Angle Title, Strategic Premise, Why It Works for this Category.
3. User clicks on one card to select their strategic direction.
4. User clicks **"Generate Opening Hooks →"**.
5. System sends `POST /api/ai/hooks` with the selected direction ID.
6. Advances to Stage 4.

### 8.4 Stage 4: Opening Hooks (`Screen05Opening`)
1. The system displays 4 high-retention opening hook candidates designed to stop the user from scrolling in the first 3 seconds:
   - **Hook 1 (Curiosity Gap):** Provocative question or surprising statement.
   - **Hook 2 (Direct Challenge):** Calling out a bad habit or common frustration.
   - **Hook 3 (Visual Shock / High Energy):** Unexpected visual action.
   - **Hook 4 (Relatable Empathy):** Immediate shared pain point.
2. Each hook card includes: Spoken line, Visual hook action, and Retention Score badge (e.g., `94% Retention Index`).
3. User can edit the text of any hook directly.
4. User selects their favorite hook.
5. User clicks **"Develop Full Master Script →"**.
6. System calls `POST /api/ai/script` passing brief, settings, chosen direction, and chosen hook.
7. Advances to Stage 5.

### 8.5 Stage 5: Master Script Generation & Editing (`Screen07Script`)
1. The system renders the complete, multi-scene commercial script.
2. The scene count strictly matches the selected duration:
   - **15s:** 3 scenes (or 4 with logo outro).
   - **20s:** 4 scenes (or 5 with logo outro).
   - **30s:** 6 scenes (or 7 with logo outro).
3. Each scene card presents:
   - **Scene Number & Timing Banner:** E.g., `SCENE 2 (0:05 - 0:10) · BUILD`.
   - **Visual Action Prompt:** Cinematic prompt describing camera framing, lighting, actor movement, and environment.
   - **Spoken Dialogue / Voiceover:** Character dialogue in quotes or Voiceover (VO) tag.
   - **Audio / SFX Cue:** Background score cue or foley sound effect.
4. **Interactive Controls on Each Scene:**
   - **Inline Text Editing:** User can click and edit any prompt or dialogue line.
   - **Regenerate Scene Button (🔄):** Opens an AI rewrite prompt to re-roll only this single scene while maintaining continuity with surrounding scenes.
5. User clicks **"Proceed to Storyboard & Video →"**.
6. System advances to Stage 7.

### 8.6 Stage 6: Storyboard / Shot Planning Stage (`Screen06Story`)
1. Stage 6 displays visual shot breakdown cards, framing directives, and character continuity markers.
2. *System Navigation Handling:* To eliminate friction and unnecessary clicks during fast commercial production, Stage 6 seamlessly synchronizes with the Master Script and routes straight to Stage 7.

### 8.7 Stage 7: Video Generation & Final Render (`Screen08Video`)
1. Pre-render check pane shows:
   - Aspect ratio visualizer.
   - Total scene count and calculated duration.
   - Status of attached product photo and brand logo.
2. User clicks **"Initiate Video Render"**.
3. Magnific pipeline triggers, and the live status monitor takes over.

---

## 9. Creative Direction & Research Engine

The creative engine (`engine/creative.js`) is powered by Anthropic Claude 3.5 Sonnet. It enforces strict Indian advertising and commercial filmmaking principles.

### 9.1 Category-Specific Intelligence Rules
The engine injects deep domain context depending on the selected business category:
- **Saree & Apparel:** Emphasizes fabric feel, zari borders, drape fluidity, festive occasions, and authentic regional aesthetic.
- **Healthcare & Clinics:** Enforces strict trust signals, empathetic bedside manner, modern clinic hygiene, verified doctors, and clear reassurance.
- **Kirana & Grocery:** Focuses on fresh morning deliveries, authentic neighborhood warmth, fair pricing, and festival preparation.
- **Jewellery:** Emphasizes hallmarked purity, bridal craftsmanship, close-up reflections, and generational trust.

### 9.2 Hook Generation & Scoring Logic
- Every hook is generated using proven social video retention psychology.
- The engine calculates a retention confidence score based on:
  1. Opening word punchiness (< 7 words in the first 2 seconds).
  2. Conflict or curiosity introduction.
  3. Visual match with the business category.

---

## 10. Script Generation, Scene Architecture & Editing

### 10.1 Mathematical Scene Budgeting
The application uses a strict timing formula (`computeScenePlan`):
- **Average Scene Duration:** Exactly 5.0 seconds per scene.
- **15-Second Commercial:**
  - Standard: 3 scenes × 5s = 15 seconds.
  - With Logo Outro: 3 content scenes + 1 logo card scene (5s) = 20 seconds total.
- **20-Second Commercial:**
  - Standard: 4 scenes × 5s = 20 seconds.
  - With Logo Outro: 4 content scenes + 1 logo card scene (5s) = 25 seconds total.
- **30-Second Commercial:**
  - Standard: 6 scenes × 5s = 30 seconds.
  - With Logo Outro: 6 content scenes + 1 logo card scene (5s) = 35 seconds total.

### 10.2 Strict Multi-Language Integrity
To prevent language bleeding (e.g., Kannada content appearing when Hinglish was chosen):
1. The selected language is locked into the project state.
2. Every backend AI prompt explicitly instructs the LLM:
   - Output spoken dialogue strictly in the requested language/script.
   - Keep visual descriptions in English for the video generation model.
   - For Hinglish, use natural Hindi written in Roman English script.

### 10.3 Single-Scene Regeneration Workflow
1. User clicks the **"Regenerate"** icon on a specific scene card (e.g., Scene 3).
2. A small popover appears asking: *"What would you like to change?"*
   - Options: `Make it funnier`, `More dramatic`, `Focus more on product`, or custom instruction.
3. User selects or types instruction and clicks **"Rewrite Scene"**.
4. Frontend calls `POST /api/ai/rewrite-scene` with the full script context plus the change request.
5. The backend returns updated text for Scene 3 only.
6. The UI updates Scene 3 with a flash animation, preserving all other scenes intact.

---

## 11. Storyboard & Shot Planning Stage

1. **Shot Composition Enforcement:**
   - Every scene prompt is formatted according to professional cinematography rules:
     - Shot Framing (Wide establishing, Medium close-up, Macro detail).
     - Camera Movement (Slow push-in, subtle handheld pan, static lock-off).
     - Lighting & Atmosphere (Golden hour, soft morning natural light, vibrant festive illumination).
2. **Aspect Ratio Composition Directives:**
   - For `9:16 Vertical`: Prompts specify vertical framing, centered subject, avoiding critical action at top/bottom overlay zones.
   - For `16:9 Landscape`: Prompts specify cinematic widescreen composition with balanced horizontal staging.
   - For `1:1 Square`: Prompts specify square-balanced central framing.

---

## 12. Characters, Environment & Visual Consistency

1. **Character Anchoring:**
   - When the AI generates a script, it identifies the primary character (e.g., "Priya, a 28-year-old software engineer in Bangalore").
   - Character visual attributes (age, clothing, hair, demeanor) are included in every scene prompt to ensure visual continuity across cuts.
2. **Environment Consistency:**
   - The setting (e.g., "A modern, sunlit Bangalore apartment kitchen") is carried across all scenes belonging to that sequence.

---

## 13. Reference Images & Visual Assets (Product & Logo)

### 13.1 Product Reference Photo
1. Uploaded at the project or studio level.
2. Stored on the server in `uploads/` directory.
3. Automatically ingested into the Magnific image-to-video pipeline as an image conditioning input, ensuring the actual physical product appears in the rendered commercial.

### 13.2 Brand Logo Handling
1. Can be inherited from the Business Profile or uploaded specifically for the video.
2. When a logo is present:
   - It is routed to the Magnific logo overlay pipeline or generated as a branded 5-second outro scene card.
   - The UI clearly indicates: `+5s Logo Outro Included`.

---

## 14. Video Generation, Routing & Magnific Engine

### 14.1 The 12-Flow Decision Matrix
When the user clicks "Render Video", the backend (`engine/magnific.js`) maps the request to one of **12 distinct Magnific Flow pipelines** based on 3 input variables:

| Flow # | Aspect Ratio | Product Image Present? | Brand Logo Present? | Flow Routing Type |
|---|---|---|---|---|
| **1** | `9:16` Vertical | No | No | `FLOW_916_NOPRODUCT_NOLOGO` |
| **2** | `9:16` Vertical | Yes | No | `FLOW_916_PRODUCT_NOLOGO` |
| **3** | `9:16` Vertical | No | Yes | `FLOW_916_NOPRODUCT_LOGO` |
| **4** | `9:16` Vertical | Yes | Yes | `FLOW_916_PRODUCT_LOGO` |
| **5** | `16:9` Landscape | No | No | `FLOW_169_NOPRODUCT_NOLOGO` |
| **6** | `16:9` Landscape | Yes | No | `FLOW_169_PRODUCT_NOLOGO` |
| **7** | `16:9` Landscape | No | Yes | `FLOW_169_NOPRODUCT_LOGO` |
| **8** | `16:9` Landscape | Yes | Yes | `FLOW_169_PRODUCT_LOGO` |
| **9** | `1:1` Square | No | No | `FLOW_11_NOPRODUCT_NOLOGO` |
| **10** | `1:1` Square | Yes | No | `FLOW_11_PRODUCT_NOLOGO` |
| **11** | `1:1` Square | No | Yes | `FLOW_11_NOPRODUCT_LOGO` |
| **12** | `1:1` Square | Yes | Yes | `FLOW_11_PRODUCT_LOGO` |

### 14.2 Rendering Execution & Polling Loop
1. System dispatches generation request to Magnific API.
2. Backend receives `task_id` and initial status `queued`.
3. Frontend begins an automated polling cycle:
   - Requests `GET /api/video-status/:taskId` every 4,000 milliseconds.
4. **User Progress UI:**
   - User sees a animated progress ring and step-by-step progress cards:
     - `Queued in AI Cluster...`
     - `Rendering Scene Visuals...`
     - `Synthesizing Audio & Dialogue...`
     - `Assembling Final Video...`
   - Estimated time countdown displays remaining seconds.
5. Once Magnific completes rendering, backend receives final CDN video URL (`.mp4`).
6. Video player appears instantly on screen.

---

## 15. Video Review, Post-Production & Download

### 15.1 In-App Video Player
1. High-definition video player with play, pause, seek, volume, and fullscreen controls.
2. Displays video duration, aspect ratio badge, and campaign title.

### 15.2 Script Copying & Export
1. User clicks **"Copy Full Script"** button:
   - Complete script (all scenes, actions, dialogues, timestamps) is copied to system clipboard.
   - An on-screen toast confirms: `"Script copied to clipboard!"`

### 15.3 Video Download Flow
1. User clicks **"Download Video (MP4)"**.
2. Frontend calls `POST /api/download/ticket` to verify user authorization and obtain a secure download ticket.
3. System triggers direct browser download of the completed MP4 video file.

---

## 16. Project & Workspace Management

### 16.1 Viewing All Projects
1. User clicks **"My Projects"** in the left sidebar navigation.
2. Displays the Project Library:
   - Filter bar: Search by project name, filter by business, filter by status (*Draft*, *Ready*, *Rendering*, *Completed*).
   - Project cards show: Project thumbnail, title, business tag, creation date, scene count, and action buttons.

### 16.2 Reopening an Existing Project
1. User clicks on any project card in the library.
2. System loads the saved project state from database.
3. User is restored to the exact studio stage where they left off (e.g., reviewing script or playing completed video).

### 16.3 Deleting a Project
1. User clicks the **"Delete"** (trash can) icon on a project card.
2. A confirmation modal asks: *"Are you sure you want to delete this project? This action cannot be undone."*
3. User clicks **"Confirm Delete"**.
4. System sends `DELETE /api/projects/:id`.
5. Project is removed from database and disappears from the library view.

---

## 17. User Settings, Profile & Account Deletion

### 17.1 Account Settings Modal
1. User clicks their profile pill at the bottom of the sidebar.
2. User selects **"Account Settings"**.
3. **Editable Fields:**
   - User Display Name.
   - Email Address (Read-only for verification).
   - Avatar photo upload.
4. User clicks **"Save Profile"** to persist changes.

### 17.2 Account Deletion Flow
1. In the Account Settings modal, user scrolls to the **Danger Zone**.
2. User clicks the red button: **"Delete Account & Data"**.
3. A confirmation modal appears with a strong warning:
   - *"This will permanently delete your account, all created businesses, all film projects, scripts, and uploaded assets. This cannot be undone."*
4. User is required to type the word `DELETE` into a confirmation text box.
5. User clicks **"Permanently Delete My Account"**.
6. System sends `DELETE /api/auth/account`.
7. **Backend Cascading Deletion:**
   - Deletes all Film Projects belonging to the user.
   - Deletes all Business Profiles belonging to the user.
   - Deletes all uploaded media files associated with the user's projects.
   - Deletes the User record itself.
8. Session token is purged from client `localStorage`.
9. User is immediately redirected to the logged-out homepage.

---

## 18. Additional Discovered Features & Helpers

1. **Auto-Save Resilience:**
   - While editing in Director Mode or Simple Mode, the frontend automatically debounces and saves project drafts to the backend every 3 seconds, ensuring no loss of work if the browser is accidentally closed.
2. **Audio Mode Detection (`detectScriptAudioMode`):**
   - When importing raw scripts, the engine uses regex pattern matching to automatically determine whether lines represent character dialogues (e.g., `PRIYA:`) or a continuous Voiceover (`VO:` / `VOICEOVER:`).
3. **Direct Aspect Ratio Switching:**
   - Users can toggle between `9:16`, `16:9`, and `1:1` at any point prior to final rendering; the engine automatically reformats visual framing directives to match.

---

## 19. Error Handling, Fallbacks & Offline Recovery

1. **Network Disconnection:**
   - If an API call fails due to loss of internet connection, a persistent top notification banner warns: *"Network connection lost. Retrying..."*
   - Forms retain all entered data in memory.
2. **Web Scraping Failures:**
   - If a submitted website URL is behind a CAPTCHA, blocked by Cloudflare, or invalid:
   - The URL Research Modal displays: *"Unable to automatically scrape this website. Please enter your brief manually or paste product details."*
   - The user is not blocked; they can transition smoothly into standard Simple Mode.
3. **AI Generation Timeout / Failure:**
   - If the Anthropic API experiences rate limits or downtime:
   - The system displays a friendly error banner: *"AI generation took longer than expected. Please click Retry."*
   - A single-click **"Retry Generation"** button re-submits the request without requiring the user to re-type their brief.
4. **Magnific Render Failure:**
   - If the video rendering engine encounters a pipeline failure:
   - The status monitor changes to an error alert explaining the failure reason.
   - The user's project remains saved at Stage 7, allowing them to re-trigger the render or adjust settings without starting over.

---

## 20. Exhaustive Master Catalog of Options & Presets

### 20.1 Business Categories (12 Total)
1. `Saree, Clothing & Apparel`
2. `Jewellery & Accessories`
3. `Sweets, Bakery & Restaurant`
4. `Kirana, Grocery & Supermarket`
5. `Electronics, Mobile & Appliances`
6. `Salon, Spa & Beauty`
7. `Healthcare, Clinic & Pharmacy`
8. `Real Estate & Home Decor`
9. `Gym, Fitness & Yoga`
10. `Education, Coaching & Tuition`
11. `Automobile & Garage`
12. `Other Local Business`

### 20.2 Brand Tones (4 Total)
1. `Warm & Authentic` (Default)
2. `Festive & Vibrant`
3. `Premium & Elegant`
4. `Direct & Problem-Solving`

### 20.3 Supported Languages (10 Total)
1. `English` (Default)
2. `Hindi`
3. `Hinglish`
4. `Marathi`
5. `Kannada`
6. `Tamil`
7. `Telugu`
8. `Gujarati`
9. `Bengali`
10. `Punjabi`

### 20.4 Video Durations & Scene Breakdowns (3 Total)
1. **15s Hook:**
   - Base: 3 scenes (5s each = 15s).
   - With Logo Outro: 4 scenes (3 content + 1 logo outro = 20s).
2. **20s Standard (Default):**
   - Base: 4 scenes (5s each = 20s).
   - With Logo Outro: 5 scenes (4 content + 1 logo outro = 25s).
3. **30s Extended:**
   - Base: 6 scenes (5s each = 30s).
   - With Logo Outro: 7 scenes (6 content + 1 logo outro = 35s).

### 20.5 Video Dimensions & Aspect Ratios (3 Total)
1. `9:16 Vertical` (Default) — Optimized for Instagram Reels, YouTube Shorts, and TikTok.
2. `16:9 Landscape` — Optimized for YouTube, Desktop, and Television.
3. `1:1 Square` — Optimized for Instagram and Facebook Feed posts.

### 20.6 Video Formats & Creative Styles (4 Total)
1. `Creator / UGC` (Default) — Authentic, mobile-first creator testimonial.
2. `Product Showcase` — Cinematic focus on product features, texture, and elegance.
3. `Humorous & Fun` — Relatable situational comedy with an unexpected twist.
4. `Heartwarming Story` — Emotion-led narrative centered on family and relationships.

---

## 21. Technical Implementation Appendix

| Stage / Screen | Frontend Component | Primary Handler | API Endpoint | Backend Function / File | Data Persistence |
|---|---|---|---|---|---|
| **User Sign Up** | `AuthModal.jsx` / `AuthScreen.jsx` | `handleSignUp` | `POST /api/auth/register` | `server.js` | `users` store |
| **User Login** | `AuthModal.jsx` / `AuthScreen.jsx` | `handleLogin` | `POST /api/auth/login` | `server.js` | JWT token in `localStorage` |
| **Account Deletion** | `AccountModal.jsx` | `handleDeleteAccount` | `DELETE /api/auth/account` | `server.js` | Cascading purge |
| **Business Wizard** | `BusinessOnboardingModal.jsx` | `handleSaveBusiness` | `POST /api/businesses` | `server.js` | `businesses` store |
| **Edit Business** | `BusinessOnboardingModal.jsx` | `handleUpdateBusiness` | `PUT /api/businesses/:id` | `server.js` | `businesses` store |
| **Simple Studio** | `SimpleBusinessStudio.jsx` | `handleGeneratePackages` | `POST /api/ai/simple-packages` | `engine/creative.js` | Temporary in-memory state |
| **Script Normalizer**| `ExistingScriptModal.jsx` | `handleVerifyScript` | `POST /api/ai/normalize-script` | `engine/creative.js` | Active Project state |
| **URL Scraper** | `UrlResearchModal.jsx` | `handleScrapeUrl` | `POST /api/research/url` | `engine/netguard.js` & `server.js` | Transient research cache |
| **Director: Brief** | `GuidedStudio.jsx` (`Screen02Brief`) | `handleSaveBrief` | `POST /api/projects` | `server.js` | `projects` store |
| **Director: Directions**| `GuidedStudio.jsx` (`Screen04Idea`) | `handleGenerateDirections`| `POST /api/ai/directions` | `engine/creative.js` | `projects.creativeDirections` |
| **Director: Hooks** | `GuidedStudio.jsx` (`Screen05Opening`)| `handleGenerateHooks` | `POST /api/ai/hooks` | `engine/creative.js` | `projects.hooks` |
| **Director: Script** | `GuidedStudio.jsx` (`Screen07Script`)| `handleGenerateScript`| `POST /api/ai/script` | `engine/creative.js` | `projects.masterScript` |
| **Scene Rewrite** | `GuidedStudio.jsx` (`Screen07Script`)| `handleRewriteScene` | `POST /api/ai/rewrite-scene` | `engine/creative.js` | Scene object updated |
| **Video Render** | `GuidedStudio.jsx` / `SimpleBusinessStudio.jsx` | `handleRenderVideo` | `POST /api/generate-video` | `engine/magnific.js` | `projects.taskId` / `tasks` |
| **Video Status Poll**| `App.jsx` | `pollTaskStatus` | `GET /api/video-status/:taskId` | `engine/magnific.js` | `projects.videoUrl` |
| **Download Ticket** | `ScriptLibraryView.jsx` | `handleDownload` | `POST /api/download/ticket` | `server.js` | Single-use download ticket |

---

## 22. Unclear, Missing or Unimplemented Behaviour

1. **Individual Business Deletion Missing:**
   - While users can create and edit businesses, or delete their entire account (which cascades and deletes all businesses), there is currently **no standalone `DELETE /api/businesses/:id` endpoint** or button to delete a single business profile.
2. **Password Reset Email Dispatch is Mocked:**
   - The "Forgot Password" UI flow shows a confirmation message, but there is no integrated external SMTP email service (SendGrid, Postmark, AWS SES) or password reset token verification endpoint implemented.
3. **Director Mode Stage 6 (Storyboard) Direct Passthrough:**
   - In `GuidedStudio.jsx`, navigating to Stage 6 (`story`) immediately auto-forwards into Stage 7 (`script` / `video`). The 7-step header displays Stage 6, but it functions as a consolidated script-and-storyboard stage rather than an independent editing screen.
4. **Third-Party Video Storage Persistence:**
   - Generated video files reside on remote Magnific / CDN storage URLs. There is no automated permanent archiving to user Google Drive or private S3 buckets after download tickets expire.
