import React, { useState, useEffect, useRef, useReducer } from 'react';
import {
  studioReducer,
  initialStudioState,
  createInitialStudioState,
  StudioActionTypes,
  isStaleResponse,
  resolveIdeaSelection,
} from './context/studioReducer.js';
import { videoLogoPayload } from './utils/videoLogo.js';
import { newProjectId, projectIdForRender, projectIdForVideoUrl, hasProjectForVideo } from './utils/projectIds.js';
import { draftOf, resumeTargetOf, sortProjectsForLibrary, buildDraftProject, briefSnippet } from './utils/drafts.js';
import { businessContextOf, findProjectBusiness } from './utils/businessContext.js';
import { isUnderstandingOutdatedClient } from './utils/guardrails.js';
import { hasActiveClientEventContext } from './utils/eventContext.js';
import {
  createDefaultOnboardingState,
  normalizeOnboardingState,
  mergeOnboardingState,
  recordBehaviorSignal,
  shouldAutoTriggerWelcome,
  hasResumableTourProgress,
  loadLocalOnboardingState,
  saveLocalOnboardingState,
} from './utils/onboarding.js';
import {
  transferSimpleToDirector,
  transferDirectorToSimple,
} from './utils/modeTransfer.js';
import { TOUR_STEPS } from './data/tourSteps.js';
import {
  StudioStateContext,
  StudioDispatchContext,
  useStudioState,
  useStudioDispatch,
} from './context/studioState.jsx';
import AppShell from './components/v2/AppShell.jsx';
import CreationEntryHub from './components/v2/CreationEntryHub.jsx';
import SimpleBusinessStudio from './components/v2/SimpleBusinessStudio.jsx';
import ScreenUnderstanding from './components/v2/ScreenUnderstanding.jsx';
import ExistingScriptModal from './components/v2/ExistingScriptModal.jsx';
import UrlResearchModal from './components/v2/UrlResearchModal.jsx';
import AuthModal from './components/v2/AuthModal.jsx';
import AuthScreen from './components/v2/AuthScreen.jsx';
import EmailVerificationScreen from './components/v2/EmailVerificationScreen.jsx';
import ResetPasswordScreen from './components/v2/ResetPasswordScreen.jsx';
import BusinessOnboardingModal from './components/v2/BusinessOnboardingModal.jsx';
import ScriptLibraryView from './components/v2/ScriptLibraryView.jsx';
import BusinessProfileView from './components/v2/BusinessProfileView.jsx';
import AccountModal from './components/v2/AccountModal.jsx';
import FeedbackModal from './components/v2/FeedbackModal.jsx';
import ModeSelectionScreen from './components/v2/ModeSelectionScreen.jsx';
import ModeSwitchModal from './components/v2/ModeSwitchModal.jsx';
import WelcomeOnboardingModal from './components/v2/WelcomeOnboardingModal.jsx';
import ProductTourEngine from './components/v2/ProductTourEngine.jsx';
import {
  Mic,
  MicOff,
  Download,
  Check,
  Upload,
  AlertCircle,
  Film,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Clock,
  Sparkles,
  User,
  MapPin,
  FileCode2,
  X,
  Building2,
  FileText,
  Image as ImageIcon,
  Edit3,
  Store,
  Tag,
  Sparkle,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Camera,
  Volume2,
  Quote,
  Edit2,
  Share2,
  Plus,
  Trash2,
  HelpCircle,
  RefreshCw,
  WifiOff,
  Award,
  Layers,
  Clapperboard,
  ShieldCheck,
  CheckCircle2,
  Play,
  Zap,
  Sliders,
} from 'lucide-react';

import {
  ResearchInsightsBanner,
  CreativeDNABar,
  CreativePanelsWorkspace,
  SceneAIRewriteModal,
  ProductionShotSpecView,
} from './components/CreativeWorkspace';

import {
  STUDIO_STAGES,
  StudioProgressHeader,
  StudioChoicesBar,
  Screen02Brief,
  Screen03Settings,
  Screen04Idea,
  Screen05Opening,
  Screen06Story,
  Screen07Script,
  Screen08Video,
} from './components/GuidedStudio';
import { AuthSessionLoader } from './components/v2/WorkflowLoadingScreen.jsx';

class WorkspaceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('WorkspaceErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--cc-danger)', borderRadius: 10, color: 'var(--text-primary)', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--cc-danger)', margin: '0 0 8px' }}>Error Loading Creative Options</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{this.state.error?.message || 'Unexpected render error'}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '8px 16px', backgroundColor: 'var(--cc-action)', color: 'var(--cc-on-action)', border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            Retry Creative Stage
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Ad Focus Goal Presets — defines creative objectives & CTA angles
const AD_GOAL_PRESETS = [
  {
    id: 'offer',
    label: 'Special Offer',
    icon: Tag,
    objective: 'Promote special festive discount & value offer',
    cta: 'Order today and claim your special festive discount',
    targetCustomers: 'Shoppers looking for great festive deals and gifts',
  },
  {
    id: 'store_visit',
    label: 'Store Visit',
    icon: Store,
    objective: 'Drive physical store visits & walk-ins',
    cta: 'Visit our store today and celebrate together',
    targetCustomers: 'Local neighborhood families and shoppers nearby',
  },
  {
    id: 'product',
    label: 'Product Spotlight',
    icon: Sparkle,
    objective: 'Showcase product craftsmanship & premium quality',
    cta: 'Experience the authentic fresh quality today',
    targetCustomers: 'Discerning buyers seeking authentic quality',
  },
  {
    id: 'brand',
    label: 'Brand Story',
    icon: Bookmark,
    objective: 'Brand awareness & authentic heritage',
    cta: 'Celebrate every moment with authentic traditions',
    targetCustomers: 'New and returning patrons',
  },
];

// Comprehensive Business & Product/Service Categories
const BUSINESS_TYPE_PRESETS = [
  'Saree, Ethnic Wear & Bridal Store',
  'Clothing, Fashion & Apparel Store',
  'Jewellery, Gold & Ornaments',
  'Sweet Shop, Bakery & Mithai',
  'Restaurant, Cafe & Cloud Kitchen',
  'Kirana, Grocery & Supermarket',
  'Beauty Salon, Spa & Parlour',
  'Skincare, Cosmetics & Wellness',
  'Mobile, Laptop & Electronics Store',
  'Home Decor, Furniture & Modular Kitchen',
  'Hardware, Electrical & Sanitaryware',
  'Pharmacy, Medical Store & Diagnostics',
  'Dental Clinic & Healthcare Centre',
  'Gym, Fitness & Yoga Studio',
  'Coaching Institute & Tuition Centre',
  'Footwear, Bags & Leather Goods',
  'Optical, Eyewear & Sunglasses',
  'Automobile, Bike Showroom & Car Care',
  'Real Estate, Builder & Interior Designer',
  'Gifts, Toys, Books & Stationery',
  'Photography, Events & Wedding Services',
  'Dry Fruits, Organic & Gourmet Food',
  'Tailor, Boutique & Alterations',
  'Pet Care, Clinic & Pet Shop',
  'Professional, Legal & Business Services',
  'Other',
];

// Render aspect ratio: the Settings dimension choice, else read from the platform ("… / 16:9", "… / 1:1"), else vertical
const aspectRatioOf = (ctx = {}) => ctx.aspectRatio || ctx.dimension || (/16:9/.test(ctx.platform || '') ? '16:9' : /1:1/.test(ctx.platform || '') ? '1:1' : '9:16');

// Production Platform Options
const PLATFORM_PRESETS = [
  { id: 'Instagram Reels / 9:16', label: 'Instagram Reels', sub: '9:16 Vertical' },
  { id: 'YouTube Shorts / 9:16', label: 'YouTube Shorts', sub: '9:16 Vertical' },
  { id: 'WhatsApp Status / 9:16', label: 'WhatsApp', sub: '9:16 Status' },
  { id: 'Facebook Video', label: 'Facebook', sub: 'Social Feed' },
  { id: 'Multi-platform', label: 'Multi-platform', sub: 'Universal' },
];

// Creative Format & Style Options
const CREATIVE_STYLE_PRESETS = [
  {
    id: 'UGC / Creator-style',
    label: 'UGC / Creator-style',
    desc: 'Relatable phone camera, conversational spoken hook & authentic reactions',
  },
  {
    id: 'Storytelling',
    label: 'Storytelling',
    desc: 'Engaging mini-drama with everyday dilemma, conflict & emotional resolution',
  },
  {
    id: 'Product-focused',
    label: 'Product-focused',
    desc: 'Sensory close-ups, craftsmanship, textures & fresh quality proof',
  },
  {
    id: 'Offer / Promotion',
    label: 'Offer / Promotion',
    desc: 'High-urgency festive discount, value proposition & clear store CTA',
  },
];

// Set in this browser once someone has logged in; picks Log in over Sign up on the auth screen
const RETURNING_USER_KEY = 'clevertize_returning_user';

// Fast Generation Pipeline Stages (Script & Storyboard preparation)
const FAST_PIPELINE_STAGES = [
  {
    phase: 'STEP 1 · BRIEF ANALYSIS',
    title: 'Understanding your brief…',
    detail: 'Analyzing brand personality, key message, and audience context.',
  },
  {
    phase: 'STEP 2 · STORY CONCEPT',
    title: 'Developing the creative story…',
    detail: 'Crafting the hook, narrative progression, and commercial angle.',
  },
  {
    phase: 'STEP 3 · SCENE PREPARATION',
    title: 'Building the scenes…',
    detail: 'Structuring camera pacing, scene continuity, and script dialogue.',
  },
  {
    phase: 'STEP 4 · QUALITY VERIFICATION',
    title: 'Writing & verifying script…',
    detail: 'Composing dialogue, running continuity checks, and compiling shot specifications (~30–45s).',
  },
];

const FAST_PIPELINE_TIPS = [
  'Clear, relatable hooks in the first 3 seconds dramatically boost audience retention.',
  'Consistent single-location settings create strong visual continuity across cuts.',
  '9:16 vertical framing ensures subjects naturally capture mobile screen attention.',
  'Natural spoken dialogue keeps pacing snappy and easy to understand.',
  'Clean end cards with clear brand name and offer give viewers an immediate next step.',
];

// Rich Multi-Stage Pipelines for Each Checkpoint Transition
const CHECKPOINT_PIPELINES = {
  direction: {
    badge: 'Checkpoint 1 · Creative Direction & Tensions',
    stages: [
      {
        phase: 'INSIGHT ENGINE',
        title: 'Scanning customer tension & desire lenses…',
        detail: 'Evaluating 8 authentic psychological lenses to uncover relatable local consumer frictions.',
      },
      {
        phase: 'FESTIVAL & OCCASION INTELLIGENCE',
        title: 'Evaluating calendar moments & local atmosphere…',
        detail: 'Cross-referencing upcoming festivals and neighborhood consumer context for authentic relevance.',
      },
      {
        phase: 'CREATIVE FORMULATION',
        title: 'Synthesizing 3 distinct creative tension angles…',
        detail: 'Formulating ranked customer tensions rooted in everyday emotional life for your selection.',
      },
    ],
    tips: [
      'Product Spine Principle: The customer tension is the engine of the story. Without real friction, there is no ad.',
      'Festival moments connect best when woven naturally into the dilemma, never as forced holiday greetings.',
      'Local neighborhood grounding creates instant relatability and emotional resonance.',
      'Rule M16: Focus on relatable human problems first—the product is introduced as the earned relief.',
    ],
  },
  plot: {
    badge: 'Checkpoint 2 · Plot Line & Viral Hooks',
    stages: [
      {
        phase: 'VIRAL HOOK PATTERNS',
        title: 'Querying high-retention creator hook patterns…',
        detail: 'Cross-referencing Indian Instagram creator formats and scroll-stopping pattern interrupts.',
      },
      {
        phase: 'MINI-STORY ARCS',
        title: 'Drafting 3 distinct narrative plot lines…',
        detail: 'Constructing relatable problem-to-relief arcs around your brand and featured products.',
      },
      {
        phase: 'COMMERCIAL FRAMING',
        title: 'Balancing comedic/emotional hook with brand payoff…',
        detail: 'Ensuring the plot builds towards an earned, organic brand reveal without feeling like an ad.',
      },
    ],
    tips: [
      'Product Spine Rule M16: Borrow hook patterns and psychological triggers, never copy generic lines.',
      'The first 3 seconds require physical action and a clear spoken line to stop the scroll.',
      'Everyday crisis hooks connect immediately by showing relatable household urgency.',
      'A great plot gives both characters something clear to want or solve.',
    ],
  },
  story: {
    badge: 'Checkpoint 3 · Story Arc & Production Format',
    stages: [
      {
        phase: 'PRODUCTION FORMAT',
        title: 'Selecting optimal storytelling format…',
        detail: 'Evaluating UGC creator style, conversational dialogue, or dramatic slice-of-life.',
      },
      {
        phase: '4-SCENE PACING',
        title: 'Choreographing 4-scene narrative beats…',
        detail: 'Structuring Hook (Scene 1) → Build (Scene 2) → Turn (Scene 3) → Resolution (Scene 4).',
      },
      {
        phase: 'VISUAL ANCHORS',
        title: 'Locking characters & single-room environment…',
        detail: 'Enforcing continuous room lighting, camera eye-lines, and casting constraints for AI video stability.',
      },
    ],
    tips: [
      'Product Spine Rule M13: All 4 scenes share the same room so video models maintain perfect visual continuity.',
      'Product Spine Rule M28: Physical gestures, reactions, and eye contact create authentic commercial chemistry.',
      'Clear environmental lighting notes keep consecutive scenes looking like they belong in the same film shoot.',
      'Rule M8: No on-screen text or artificial UI overlays—visual and spoken storytelling only.',
    ],
  },
  script: {
    badge: 'Checkpoint 4 · Script Writing & Section 8 Gate',
    stages: [
      {
        phase: 'DIALOGUE WRITING',
        title: 'Writing natural spoken dialogue in native tongue…',
        detail: 'Composing authentic lines with strict 2-line maximum per character per scene to prevent audio drift.',
      },
      {
        phase: 'QUALITY GATE VERIFICATION',
        title: 'Running 18-point Section 8 Quality Gate…',
        detail: 'Validating single location, zero on-screen text, Devanagari script, and strict claim boundaries.',
      },
      {
        phase: 'AUTO-REPAIR PASS',
        title: 'Finalizing production camera prompts & sound cues…',
        detail: 'Locking camera cuts, eye-line continuity, and audio notes ready for Storyboard Studio review.',
      },
    ],
    tips: [
      'Product Spine Rule M10: Maximum 2 dialogue lines per character per scene avoids audio drift.',
      'Product Spine Rule M4: Dialogue lines are rendered in Devanagari script for flawless speech pronunciation.',
      'Product Spine Rule M8: On-screen text, phone UIs, and background music are strictly excluded from generation.',
      'Section 8 Gate ensures continuity across characters, wardrobe, lighting, and audio.',
    ],
  },
};

// Fallback arrays for backward compatibility
const SCRIPT_GEN_STAGES = CHECKPOINT_PIPELINES.script.stages;
const SCRIPT_GEN_TIPS = CHECKPOINT_PIPELINES.script.tips;

// Pipeline Stages for Video GPU Rendering
const RENDER_STAGES = [
  {
    phase: 'SCENE INITIALIZATION',
    title: 'Preparing scene assets & storyboard…',
    detail: 'Staging visual prompts, character anchors, and duration settings.',
  },
  {
    phase: 'VIDEO GENERATION',
    title: 'Generating video scenes…',
    detail: 'Creating scene visuals, motion pacing, and camera movements.',
  },
  {
    phase: 'CONTINUITY CHECK',
    title: 'Balancing character & visual consistency…',
    detail: 'Ensuring consistent appearance, lighting, and transitions across scenes.',
  },
  {
    phase: 'AUDIO & COMPOSITING',
    title: 'Aligning voiceover & sound cues…',
    detail: 'Synchronizing dialogue timing, audio pacing, and end frame elements.',
  },
  {
    phase: 'FINAL MASTERING',
    title: 'Mastering final 1080p video…',
    detail: 'Encoding broadcast-quality video formatted for mobile feeds.',
  },
];

const RENDER_TIPS = [
  'Consistent lighting across all scenes ensures a unified visual style.',
  'Commercials with front-loaded value propositions retain up to 3× higher engagement on mobile feeds.',
  'Our engine renders in broadcast-ready 1080p resolution, optimized for 9:16 mobile feeds.',
  'Seamless scene transitions keep pacing snappy without causing visual jarring for the viewer.',
  'Voiceover cadence and background audio volume are dynamically balanced for vocal clarity.',
];

// Helper to parse scene texts for structured editing
function parseScene(rawText, sceneIndex) {
  if (!rawText) {
    return {
      title: `SCENE ${sceneIndex + 1}`,
      purpose: '',
      visual: '',
      camera: '',
      dialogue: '',
      audio: '',
      notes: '',
      raw: '',
    };
  }

  let title = `SCENE ${sceneIndex + 1}`;
  let purpose = '';

  const titleMatch = rawText.match(/SCENE\s*(\d+)\s*(?:[–-—]\s*([^\n\r]+))?/i);
  if (titleMatch) {
    title = `SCENE ${titleMatch[1]}`;
    purpose = (titleMatch[2] || '').trim();
  }

  const getSection = (startHeader, nextHeaders) => {
    const startIdx = rawText.search(new RegExp(`^\\s*${startHeader}[:\\s]*`, 'im'));
    if (startIdx === -1) return '';
    const afterHeader = rawText.slice(startIdx).replace(new RegExp(`^\\s*${startHeader}[:\\s]*`, 'im'), '');
    let minEnd = afterHeader.length;
    for (const nextH of nextHeaders) {
      const endMatch = afterHeader.search(new RegExp(`^\\s*${nextH}[:\\s]*`, 'im'));
      if (endMatch !== -1 && endMatch < minEnd) {
        minEnd = endMatch;
      }
    }
    return afterHeader.slice(0, minEnd).trim();
  };

  const visual = getSection('Visual', ['Animation Elements', 'Audio', 'Sound Design', 'Editing Notes']);
  const camera = getSection('Animation Elements', ['Audio', 'Sound Design', 'Editing Notes']);
  const dialogue = getSection('(?:Audio\\s*\\/\\s*Dialogue\\s*\\/\\s*Voiceover|Audio\\s*\\/\\s*Dialogue|Audio|Dialogue)', ['Sound Design', 'Editing Notes']);
  const audio = getSection('(?:Sound Design\\s*\\/\\s*Music|Sound Design|Sound)', ['Editing Notes']);
  const notes = getSection('(?:Editing Notes\\s*\\(Optional\\)|Editing Notes)', []);

  return {
    title,
    purpose: purpose || (sceneIndex === 0 ? 'HOOK' : sceneIndex === 1 ? 'BUILD' : sceneIndex === 2 ? 'TURN' : 'RESOLUTION'),
    visual: visual || rawText,
    camera: camera || '',
    dialogue: dialogue || '',
    audio: audio || '',
    notes: notes || '',
    raw: rawText,
  };
}

// Helper to rebuild scene text after structured section edits
function rebuildScene({ title, purpose, visual, camera, dialogue, audio, notes, raw }) {
  if (!camera && !dialogue && !audio) {
    return raw || visual;
  }
  return `ANNEX A\n${title}${purpose ? ` – ${purpose}` : ''}\nVisual:\n${visual || 'Same setting: balanced medium shot.'}\nAnimation Elements:\n${camera || 'Camera: smooth motivated push-in.\nText overlay: none\nUI element: none\nTransition: cut\nMotion graphics: none'}\nAudio / Dialogue / Voiceover:\n${dialogue || 'None'}\nSound Design:\n${audio || 'Natural ambient room tone. Music mood note: warm and upbeat.'}\nEditing Notes:\n${notes || 'Scene duration: ~5s | Output: 1080p'}`;
}

// Dynamic Category & Brand-Aware Brief Suggestions and Placeholders (Shared utility)
import {
  getCategoryBriefSuggestions,
  getBriefSuggestions,
} from './utils/categorySuggestions.js';
export { getCategoryBriefSuggestions, getBriefSuggestions };

export default function App() {
  // Network connectivity status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Helper to isolate brand profile from film-specific ephemeral settings
  const extractBrandProfile = (ctx) => {
    if (!ctx) return {};
    const {
      businessName = '',
      businessType = 'Saree, Ethnic Wear & Bridal Store',
      customBusinessType = '',
      town = '',
      area = '',
      websiteUrl = '',
      specialty = '',
      offer = '',
      occasion = '',
      contact = '',
      ownerName = '',
      scriptMode = 'devanagari',
    } = ctx;
    return {
      businessName,
      businessType,
      customBusinessType,
      town,
      area,
      websiteUrl,
      specialty,
      offer,
      occasion,
      contact,
      ownerName,
      scriptMode,
    };
  };

  // Helper to create an isolated, empty brand context for new users
  const createEmptyUserContext = () => ({
    businessId: null,
    businessName: '',
    businessType: 'Retail Store',
    customBusinessType: '',
    town: '',
    area: '',
    brief: '',
    specialty: '',
    offer: '',
    occasion: '',
    contact: '',
    ownerName: '',
    leadCharacter: '',
    supportingCharacter: '',
    environment: '',
    websiteUrl: '',
    duration: '20s',
    targetDuration: '20s',
    aspectRatio: '9:16',
    dimension: '9:16',
    platform: 'Instagram Reels / 9:16',
    creativeStyle: 'UGC / Creator-style',
    language: 'English',
    scriptMode: 'devanagari',
    selectedGoalId: 'offer',
    targetAudience: '',
    brandTone: 'Relatable & Trustworthy',
    brandLogo: null,
    shopPhoto: null,
    productPhoto: null,
    logo: null,
    brandFile: null,
    creativeGuardrails: null,
    eventContext: null,
  });

  // Persistent User Context (Conceptually userContext: preserves all inputs across stages)
  // Initializes cleanly empty — user businesses are always loaded from their authenticated database profile
  const [userContext, setUserContext] = useState(() => createEmptyUserContext());

  const updateUserContext = (key, val) => {
    if (key === 'language') {
      try {
        localStorage.setItem('clevertize_lang_explicit', 'true');
      } catch {}
    }
    setUserContext((prev) => {
      const next = { ...prev, [key]: val };
      try {
        if (currentUser?.id) {
          const brandProfile = extractBrandProfile(next);
          localStorage.setItem(`clevertize_user_context_${currentUser.id}`, JSON.stringify(brandProfile));
        }
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }
      return next;
    });
  };

  // Fast Creation Pipeline State
  const [shotSpec, setShotSpec] = useState(null);
  const [fastStageIndex, setFastStageIndex] = useState(0);
  const [isScriptExpanded, setIsScriptExpanded] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isEditingBrandInline, setIsEditingBrandInline] = useState(false);

  // Workflow Stages:
  // 'input' -> Stage 1 form
  // 'cp1_direction' -> Checkpoint 1 (Customer Tension)
  // 'cp2_plot' -> Checkpoint 2 (Plot Line & Viral Hook)
  // 'cp3_story' -> Checkpoint 3 (Story Arc & Format)
  // 'storyboard' -> Checkpoint 4 (Script Review & Storyboard Studio)
  // 'render' -> Video Rendering & Delivery
  // V4 Guided Creative Studio Stage:
  // 'business' | 'brief' | 'settings' | 'idea' | 'opening' | 'story' | 'script' | 'video'
  // Centralized Studio State via Reducer (Milestone 2B)
  const [studioState, studioDispatch] = useReducer(studioReducer, initialStudioState, () => {
    let savedStage = 'brief';
    let savedCompleted = [];
    try {
      const savedContext = localStorage.getItem('clevertize_user_context');
      if (savedContext) {
        const parsed = JSON.parse(savedContext);
        if (parsed.businessName && parsed.businessName.trim().length > 0) {
          savedStage = 'brief';
          savedCompleted = [];
        }
      }
    } catch {}
    return createInitialStudioState({
      currentStage: savedStage,
      completedStages: savedCompleted,
    });
  });

  const studioStage = studioState.currentStage;
  const setStudioStage = (stage) =>
    studioDispatch({
      type: StudioActionTypes.SET_STAGE,
      payload: { stage: typeof stage === 'function' ? stage(studioState.currentStage) : stage },
    });

  const completedStages = studioState.completedStages;
  const setCompletedStages = (updater) => {
    const nextVal = typeof updater === 'function' ? updater(studioState.completedStages) : updater;
    studioDispatch({
      type: StudioActionTypes.SET_COMPLETED_STAGES,
      payload: { completedStages: nextVal },
    });
  };

  const hasStaleWarning = studioState.hasStaleWarning;
  const setHasStaleWarning = (val) =>
    studioDispatch({
      type: StudioActionTypes.SET_STALE_WARNING,
      payload: { hasStaleWarning: typeof val === 'function' ? val(studioState.hasStaleWarning) : val },
    });

  const [brandResetKey, setBrandResetKey] = useState(0);

  // V4 Guided Studio: Explicit confirmed choices only (defaults are not choices!)
  const explicitChoices = studioState.explicitChoices;
  const setExplicitChoices = (updater) => {
    const nextVal = typeof updater === 'function' ? updater(studioState.explicitChoices) : updater;
    studioDispatch({
      type: StudioActionTypes.SET_EXPLICIT_CHOICES,
      payload: { explicitChoices: nextVal },
    });
  };

  const markStageComplete = (stageId) => {
    setCompletedStages((prev) => (prev.includes(stageId) ? prev : [...prev, stageId]));
  };

  const handleNavigateStage = (targetStage) => {
    if (['idea', 'opening', 'story', 'script', 'video'].includes(targetStage) && aiUnderstanding) {
      const cleanBrief = userContext.brief || userContext.specialty || userContext.offer || '';
      const dim = userContext.aspectRatio || userContext.dimension || '9:16';
      const staleOrUnapproved =
        aiUnderstanding.approval_status !== 'approved' ||
        isUnderstandingOutdatedClient(aiUnderstanding, cleanBrief, userContext.creativeGuardrails, {
          language: userContext.language || 'English',
          creativeStyle: userContext.creativeStyle || 'UGC / Creator-style',
          dimension: dim,
          duration: userContext.targetDuration || userContext.duration || '20s',
          hasLogo: Boolean(userContext.videoLogo !== undefined ? userContext.videoLogo : userContext.logo),
        }, hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null);
      if (staleOrUnapproved) {
        setStudioStage('understanding');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    setStudioStage(targetStage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyUpdate = async () => {
    setHasStaleWarning(false);
    await loadStoryWorld(true);
    await handleSynthesizeMasterScript();
    setStudioStage('script');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Legacy compatibility states
  const [currentStep, setCurrentStep] = useState('input');
  const [creationStep, setCreationStep] = useState(1);

  // Brand Flow State: 'setup' -> 'confirmation' -> 'create'
  const [brandFlowState, setBrandFlowState] = useState(() => {
    try {
      const savedContext = localStorage.getItem('clevertize_user_context');
      if (savedContext) {
        const parsed = JSON.parse(savedContext);
        if (parsed.businessName && parsed.businessName.trim().length > 0) {
          return 'create';
        }
      }
      const legacyBrand = localStorage.getItem('clevertize_brand_name');
      if (legacyBrand && legacyBrand.trim().length > 0) {
        return 'create';
      }
    } catch {
      // fallback
    }
    return 'setup';
  });

  // Creative Intelligence Workspace V2 State
  const [researchData, setResearchData] = useState(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchDismissed, setResearchDismissed] = useState(false);
  const [selectedGapOption, setSelectedGapOption] = useState('');
  const [customGapAnswer, setCustomGapAnswer] = useState('');
  const lastResearchedBrandRef = useRef('');
  const loadedHooksDirectionKeyRef = useRef('');
  const loadedDirectionsFormatRef = useRef('');

  // Creative Decision Panels: 'direction' | 'hook' | 'plot' | 'story' | 'constraints'
  const [creativePanel, setCreativePanel] = useState('direction');
  const directionsList = studioState.directionsList;
  const setDirectionsList = (val) =>
    studioDispatch({
      type: StudioActionTypes.SET_DIRECTIONS,
      payload: { directionsList: typeof val === 'function' ? val(studioState.directionsList) : val },
    });

  const selectedDirection = studioState.selectedDirection;
  const setSelectedDirection = (val) =>
    studioDispatch({
      type: StudioActionTypes.SELECT_DIRECTION,
      payload: { direction: typeof val === 'function' ? val(studioState.selectedDirection) : val },
    });

  const customDirection = studioState.customDirection;
  const setCustomDirection = (val) =>
    studioDispatch({
      type: StudioActionTypes.SET_CUSTOM_DIRECTION,
      payload: { customDirection: typeof val === 'function' ? val(studioState.customDirection) : val },
    });

  const [isLoadingDirections, setIsLoadingDirections] = useState(false);

  const hooksList = studioState.hooksList;
  const setHooksList = (val) =>
    studioDispatch({
      type: StudioActionTypes.SET_HOOKS,
      payload: { hooksList: typeof val === 'function' ? val(studioState.hooksList) : val },
    });

  const selectedHook = studioState.selectedHook;
  const setSelectedHook = (val) =>
    studioDispatch({
      type: StudioActionTypes.SELECT_HOOK,
      payload: { hook: typeof val === 'function' ? val(studioState.selectedHook) : val },
    });

  const customHook = studioState.customHook;
  const setCustomHook = (val) =>
    studioDispatch({
      type: StudioActionTypes.SET_CUSTOM_HOOK,
      payload: { customHook: typeof val === 'function' ? val(studioState.customHook) : val },
    });

  const [isLoadingHooks, setIsLoadingHooks] = useState(false);

  const [plotsList, setPlotsList] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [customPlot, setCustomPlot] = useState('');
  const [isLoadingPlots, setIsLoadingPlots] = useState(false);

  const storyWorldData = studioState.storyWorldData;
  const setStoryWorldData = (val) =>
    studioDispatch({
      type: StudioActionTypes.SET_STORY_WORLD,
      payload: { storyWorldData: typeof val === 'function' ? val(studioState.storyWorldData) : val },
    });

  const [isLoadingStory, setIsLoadingStory] = useState(false);

  const constraintsList = studioState.customConstraints;
  const setConstraintsList = (val) =>
    studioDispatch({
      type: StudioActionTypes.SET_CONSTRAINTS,
      payload: { constraints: typeof val === 'function' ? val(studioState.customConstraints) : val },
    });

  const avoidList = studioState.customAvoidDetails;
  const setAvoidList = (val) =>
    studioDispatch({
      type: StudioActionTypes.SET_AVOID_DETAILS,
      payload: { avoidDetails: typeof val === 'function' ? val(studioState.customAvoidDetails) : val },
    });
  const [newConstraintInput, setNewConstraintInput] = useState('');
  const [newAvoidInput, setNewAvoidInput] = useState('');

  const [creativeDNA, setCreativeDNA] = useState({
    direction: null,
    hook: null,
    plot: null,
    story: null,
  });

  const [isSceneRewriteOpen, setIsSceneRewriteOpen] = useState(false);
  const [rewriteTargetSceneIndex, setRewriteTargetSceneIndex] = useState(0);
  const [isRewritingScene, setIsRewritingScene] = useState(false);
  const [scriptReviewMode, setScriptReviewMode] = useState('creative'); // 'creative' | 'production'

  // Backend Checkpoint Session State
  const [sessionId, setSessionId] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [activeCheckpointKey, setActiveCheckpointKey] = useState('direction');
  const [busyStep, setBusyStep] = useState(0);
  const [busyTipIndex, setBusyTipIndex] = useState(0);
  const [checkpointSeconds, setCheckpointSeconds] = useState(null);

  // Checkpoint Data from Backend
  const [directionData, setDirectionData] = useState(null); // { tensions: [{ owner, en }], festival: { use, name, owner }, lens }
  const [selectedDirectionIdx, setSelectedDirectionIdx] = useState(0);

  const [plotData, setPlotData] = useState(null); // { plots: [{ owner, en, hook_pattern, hook_library }], framing }
  const [selectedPlotIdx, setSelectedPlotIdx] = useState(0);

  const [storyData, setStoryData] = useState(null); // { format, format_owner, core_idea, through_line, location, characters, scenes, hook_line, visual_world, ending }

  const [scriptPayloadData, setScriptPayloadData] = useState(null); // { header, character1, character2, setting, scenes, record, endFrame, meta }
  const generatedScript = studioState.generatedScript;
  const setGeneratedScript = (val) =>
    studioDispatch({
      type: StudioActionTypes.SET_GENERATED_SCRIPT,
      payload: { script: typeof val === 'function' ? val(studioState.generatedScript) : val },
    });

  // Approved Summary History for breadcrumb context
  const [approvedSummary, setApprovedSummary] = useState([]);

  // Inline "Change Something" State
  const [isChangeOpen, setIsChangeOpen] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [changeError, setChangeError] = useState('');

  // Script & Storyboard Editor State (Stage 2)
  const [character1, setCharacter1] = useState('');
  const [character2, setCharacter2] = useState('');
  const [setting, setSetting] = useState('');
  const scenes = studioState.scenes;
  const setScenes = (val) =>
    studioDispatch({
      type: StudioActionTypes.SET_SCENES,
      payload: { scenes: typeof val === 'function' ? val(studioState.scenes) : val },
    });
  const activeSceneIndex = studioState.activeSceneIndex;
  const setActiveSceneIndex = (val) =>
    studioDispatch({
      type: StudioActionTypes.SET_ACTIVE_SCENE_INDEX,
      payload: { index: typeof val === 'function' ? val(studioState.activeSceneIndex) : val },
    });
  const [isRawScriptMode, setIsRawScriptMode] = useState(false);
  const [isFoundationCollapsed, setIsFoundationCollapsed] = useState(false);

  // Editing Foundation Details
  const [isEditingCharacters, setIsEditingCharacters] = useState(false);
  const [char1Draft, setChar1Draft] = useState('');
  const [char2Draft, setChar2Draft] = useState('');

  const [isEditingSetting, setIsEditingSetting] = useState(false);
  const [settingDraft, setSettingDraft] = useState('');

  // Storyboard Section Edit Mode (visual | camera | dialogue | audio | notes)
  const [editingSection, setEditingSection] = useState(null);
  const [sectionDraft, setSectionDraft] = useState('');

  // Script Generation Progress & Tips Ticker
  const [scriptGenStep, setScriptGenStep] = useState(0);
  const [scriptTipIndex, setScriptTipIndex] = useState(0);

  // Render & Video State
  const [videoUrl, setVideoUrl] = useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [renderStep, setRenderStep] = useState(0);
  const [renderTipIndex, setRenderTipIndex] = useState(0);
  const [renderStatusText, setRenderStatusText] = useState('Initializing video render pipeline…');
  const [shareStatus, setShareStatus] = useState('');
  const [isNewFilmConfirmOpen, setIsNewFilmConfirmOpen] = useState(false);
  const [isSavingNewFilm, setIsSavingNewFilm] = useState(false);
  const [newFilmSaveError, setNewFilmSaveError] = useState('');
  const [newFilmAction, setNewFilmAction] = useState('new');
  const [selectedCreationEntry, setSelectedCreationEntry] = useState(null);
  const [aiUnderstanding, setAiUnderstanding] = useState(null);
  const [isAnalyzingBrief, setIsAnalyzingBrief] = useState(false);
  const [understandingError, setUnderstandingError] = useState('');
  const [scriptGuardrailReport, setScriptGuardrailReport] = useState(null);
  // A business the user picked while a film was in progress: the confirm modal asks before switching to it
  const [pendingBusinessSwitch, setPendingBusinessSwitch] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // General UI errors & modals
  const [errorMessageRaw, setErrorMessageRaw] = useState('');
  const setErrorMessage = (val) => {
    if (!val) {
      setErrorMessageRaw('');
      return;
    }
    const str = typeof val === 'string' ? val : val.message || String(val);
    if (str.includes("Unexpected token '<'") || str.includes('is not valid JSON') || str.includes('<html>')) {
      setErrorMessageRaw('The video production service returned an unexpected HTML response. The server may be restarting or temporarily busy. Please retry in a moment.');
      return;
    }
    setErrorMessageRaw(str);
  };
  const errorMessage = errorMessageRaw;
  const [validationError, setValidationError] = useState('');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [qualityFailures, setQualityFailures] = useState([]);

  const activeVideoUrlRef = useRef(videoUrl);
  const activeRunIdRef = useRef(null);
  // Bumped whenever the studio starts over (new film, business switch). Work that began under an
  // older session — a render, a script request — must not write into the new one.
  const studioSessionRef = useRef(0);
  useEffect(() => {
    activeVideoUrlRef.current = videoUrl;
    if (videoUrl && errorMessage && errorMessage.includes('Render taking longer')) {
      setErrorMessage('');
    }
  }, [videoUrl, errorMessage]);

  // Clevertize V2 Application Shell & Entry Point State
  const [studioMode, setStudioMode] = useState(() => {
    try {
      return localStorage.getItem('clevertize_studio_mode') || 'simple';
    } catch {
      return 'simple';
    }
  });

  const handleSetStudioMode = (mode) => {
    setStudioMode(mode);
    try {
      localStorage.setItem('clevertize_studio_mode', mode);
    } catch (e) {
      console.warn('Storage unavailable', e);
    }
  };

  // Onboarding, tour & behavior-responsive contextual guidance state
  const [onboardingState, setOnboardingState] = useState(() => createDefaultOnboardingState());
  const onboardingStateRef = useRef(onboardingState);
  onboardingStateRef.current = onboardingState;
  const [businessesLoaded, setBusinessesLoaded] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [scriptSaveError, setScriptSaveError] = useState('');
  const [briefOptionalExpanded, setBriefOptionalExpanded] = useState({
    inspiration: false,
    audience: false,
    instructions: false,
    occasion: false,
    productPhoto: false,
  });
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  // Brief -> Mode Selection -> Workflow state & mid-project mode switch modal
  const [modeSelectionContext, setModeSelectionContext] = useState(null);
  const [hasSelectedModeForProject, setHasSelectedModeForProject] = useState(false);
  const [pendingModeSwitch, setPendingModeSwitch] = useState(null);
  const [guardrailDraftInputs, setGuardrailDraftInputs] = useState({ doText: '', dontText: '' });
  const [draftStatus, setDraftStatus] = useState({ state: 'idle', isNewDraft: false, detail: '' });
  const draftTriggerDetailRef = useRef('');
  const persistedDraftIdsRef = useRef(new Set());
  const draftEpochRef = useRef(0);
  const draftRetryTimerRef = useRef(null);
  const draftRetryCountRef = useRef(0);
  const isAnalyzingBriefRef = useRef(false);
  const aiUnderstandingAbortRef = useRef(null);
  const aiUnderstandingSeqRef = useRef(0);
  const lastUnderstandingCorrectionsRef = useRef('');
  const [analysisAttempt, setAnalysisAttempt] = useState(0);

  const persistOnboardingPatch = (patchOrNext) => {
    const prev = onboardingStateRef.current || createDefaultOnboardingState();
    const next = typeof patchOrNext === 'function'
      ? normalizeOnboardingState(patchOrNext(prev))
      : mergeOnboardingState(prev, patchOrNext);
    onboardingStateRef.current = next;
    setOnboardingState(next);

    const uid = currentUser?.id;
    if (uid) saveLocalOnboardingState(uid, next);
    const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('clevertize_token') : null);
    if (token) {
      fetch('/api/auth/onboarding', {
        method: 'PATCH',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(next),
      }).catch(() => {});
    }
  };

  const handleBehaviorEvent = (signalName) => {
    persistOnboardingPatch((prev) => recordBehaviorSignal(prev, signalName, 1));
  };

  const handleDismissTip = (tipId) => {
    if (!tipId) return;
    persistOnboardingPatch((prev) => mergeOnboardingState(prev, { dismissedTips: [tipId] }));
  };

  const handleWelcomeStartTour = () => {
    setIsWelcomeOpen(false);
    setActiveAppViewState('hub');
    setTourStepIndex(0);
    setIsTourOpen(true);
    persistOnboardingPatch({ welcomeSeen: true });
  };

  const handleWelcomeSkip = () => {
    setIsWelcomeOpen(false);
    persistOnboardingPatch({ welcomeSeen: true, tourSkipped: true });
  };

  const handleTourComplete = () => {
    setIsTourOpen(false);
    persistOnboardingPatch({
      welcomeSeen: true,
      tourCompleted: true,
      tourPaused: false,
      lastTourStep: 0,
    });
  };

  const handleTourPause = (stepIdx) => {
    const safeStep = typeof stepIdx === 'number'
      ? Math.max(0, Math.min(stepIdx, TOUR_STEPS.length - 1))
      : Math.max(0, Math.min(tourStepIndex, TOUR_STEPS.length - 1));
    setIsTourOpen(false);
    persistOnboardingPatch({
      welcomeSeen: true,
      tourSkipped: true,
      tourPaused: true,
      lastTourStep: safeStep,
    });
  };

  const handleTourSkip = handleTourPause;

  const handleResumeTour = () => {
    const rawStep = onboardingStateRef.current?.lastTourStep ?? onboardingState?.lastTourStep ?? 0;
    const targetStep = Math.max(0, Math.min(Number(rawStep) || 0, TOUR_STEPS.length - 1));
    setIsWelcomeOpen(false);
    if (targetStep <= 1) {
      setActiveAppViewState('hub');
    }
    setTourStepIndex(targetStep);
    setIsTourOpen(true);
  };

  const handleReplayTour = () => {
    setIsWelcomeOpen(false);
    setActiveAppViewState('hub');
    setTourStepIndex(0);
    setIsTourOpen(true);
  };

  const handleTourStepAction = (action, stepIdx) => {
    if (!action || !action.type) return;
    handleTourPause(stepIdx);

    if (action.type === 'go_brief') {
      if (userBusinesses.length === 0 || !userContext.businessName) {
        setIsOnboardingModalOpen(true);
        return;
      }
      setModeSelectionContext(null);
      setHasSelectedModeForProject(studioMode === 'simple');
      setStudioStage('brief');
      setActiveAppView('studio');
      if (studioMode === 'simple' && simpleDraftRef.current && simpleDraftRef.current.step !== 1) {
        setSimpleResumeDraft((prev) => ({ ...(simpleDraftRef.current || prev || {}), step: 1 }));
        setSimpleStudioKey((k) => k + 1);
      }
      return;
    }

    if (action.type === 'go_businesses') {
      setActiveAppView('businesses');
      return;
    }

    if (action.type === 'go_settings') {
      if (userBusinesses.length === 0 || !userContext.businessName) {
        setIsOnboardingModalOpen(true);
        return;
      }
      setModeSelectionContext(null);
      if (studioMode !== 'simple') {
        setHasSelectedModeForProject(true);
        setStudioStage('settings');
      } else {
        setHasSelectedModeForProject(true);
      }
      setActiveAppView('studio');
      return;
    }

    if (action.type === 'go_projects') {
      setActiveAppView('projects');
      return;
    }

    if (action.type === 'go_account') {
      setIsAccountModalOpen(true);
    }
  };

  const [activeAppView, setActiveAppViewState] = useState('hub');
  const setActiveAppView = (viewOrUpdater) => {
    setActiveAppViewState((prev) => {
      const nextView = typeof viewOrUpdater === 'function' ? viewOrUpdater(prev) : viewOrUpdater;
      if (nextView === 'studio' && userContext.businessName && userContext.businessName.trim().length > 0 && studioStage === 'business') {
        markStageComplete('business');
        setStudioStage('brief');
      }
      return nextView;
    });
  };
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);

  const applyImportedScriptPayload = (payload, targetMode = 'advanced') => {
    if (!payload) return;
    const {
      scenes: importedScenes,
      generatedScript: importedScript,
      character1: c1,
      character2: c2,
      setting: st,
      language: lang,
      creativeStyle: stl,
      targetDuration: dur,
      aspectRatio: ratio,
      platform: plt,
      shotSpec: sp,
      productPhoto: pPhoto,
    } = payload;

    const nextCtx = {
      ...userContext,
      ...(pPhoto ? { productPhoto: pPhoto } : {}),
      ...(lang ? { language: lang } : {}),
      ...(dur ? { targetDuration: dur, duration: dur } : {}),
      ...(ratio ? { aspectRatio: ratio, dimension: ratio } : {}),
      ...(plt ? { platform: plt } : {}),
      ...(stl ? { creativeStyle: stl } : {}),
    };

    if (c1) setCharacter1(c1);
    if (c2) setCharacter2(c2);
    if (st) setSetting(st);
    setUserContext(nextCtx);
    if (stl) {
      setCreativeDNA((prev) => ({ ...prev, format: stl }));
    }
    if (sp) setShotSpec(sp);

    setScenes(importedScenes || []);
    setGeneratedScript(importedScript || null);
    setSelectedCreationEntry('script');
    setHasSelectedModeForProject(true);
    setModeSelectionContext(null);

    if (targetMode === 'simple') {
      const compiledText = Array.isArray(importedScenes)
        ? importedScenes.map((s, i) => `=== SCENE ${i + 1} ===\n${s}`).join('\n\n')
        : '';
      const importedPackage = {
        id: `imported_${Date.now()}`,
        badge: 'Imported Script',
        angle: 'Verified Script',
        title: `${nextCtx.businessName || 'Brand'} · Verified Script`,
        hookHeadline: importedScenes?.[0] ? String(importedScenes[0]).slice(0, 120) : 'Custom Script Opening',
        narrativeSummary: `Verified ${Array.isArray(importedScenes) ? importedScenes.length : 4}-scene script imported for fast video production.`,
        duration: dur || nextCtx.targetDuration || '20s',
        aspectRatio: ratio || nextCtx.aspectRatio || '9:16',
        setting: st || '',
        character1: c1 || '',
        character2: c2 || '',
        fullScriptText: compiledText,
        scenes: (importedScenes || []).map((raw, idx) => ({
          sceneNumber: idx + 1,
          beat: `Scene ${idx + 1}`,
          timing: `${idx * 5}-${(idx + 1) * 5}s`,
          visual: String(raw),
          dialogue: '',
        })),
      };
      const transferred = transferDirectorToSimple({
        userContext: nextCtx,
        aiUnderstanding,
        importedPackage,
      });
      setSimpleResumeDraft(transferred.simpleDraft);
      setSimpleStudioKey((k) => k + 1);
      handleSetStudioMode('simple');
      setActiveAppView('studio');
      setToastMessage('Script loaded into Simple Studio — review and click Produce Video!');
    } else {
      handleSetStudioMode('advanced');
      setCompletedStages(['business', 'brief', 'settings', 'understanding', 'idea', 'opening', 'story']);
      setStudioStage('script');
      setActiveAppView('studio');
      setToastMessage(pPhoto ? 'Script & product image attached into Stage 06!' : 'Script validated and imported into Stage 06!');
    }
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleImportExistingScript = (payload) => {
    // If replacing scenes while already working inside Director Script Studio, import directly
    if (
      activeAppView === 'studio' &&
      studioMode === 'advanced' &&
      studioStage === 'script' &&
      hasSelectedModeForProject
    ) {
      applyImportedScriptPayload(payload, 'advanced');
      return;
    }
    // Otherwise route through Mode Selection so the user picks Quick Produce (Simple) or Director Script Studio
    setSelectedCreationEntry('script');
    setHasSelectedModeForProject(false);
    setModeSelectionContext({ source: 'script', scriptPayload: payload });
    setActiveAppView('studio');
  };


  // Email Verification Route State (/verify-email?token=...)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.startsWith('/verify-email') ||
      (new URLSearchParams(window.location.search).has('token') && !window.location.pathname.startsWith('/reset-password'))
    );
  });
  // Password reset route (/reset-password?token=...), opened from the reset email
  const [isResettingPassword, setIsResettingPassword] = useState(
    () => typeof window !== 'undefined' && window.location.pathname.startsWith('/reset-password')
  );
  // Returning visitors (this browser has been logged in before) land on Log in; new visitors on Sign up
  const [authInitialMode, setAuthInitialMode] = useState(() => {
    try {
      return localStorage.getItem(RETURNING_USER_KEY) || localStorage.getItem('clevertize_remember_email')
        ? 'signin'
        : 'signup';
    } catch {
      return 'signup';
    }
  });

  const handleReturnFromVerification = (targetMode = 'signin') => {
    setIsVerifyingEmail(false);
    setAuthInitialMode(targetMode || 'signin');
    try {
      window.history.replaceState({}, document.title, '/');
    } catch {}
  };

  // Clevertize V2 Authentication & Server Persistence State
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => {
    try {
      return localStorage.getItem('clevertize_token') || null;
    } catch {
      return null;
    }
  });
  const [isAuthChecking, setIsAuthChecking] = useState(() => {
    try {
      return Boolean(localStorage.getItem('clevertize_token'));
    } catch {
      return false;
    }
  });
  const [userProjects, setUserProjects] = useState(() => {
    try {
      const rawUser = localStorage.getItem('clevertize_user');
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (user && user.id) {
        const userSaved = localStorage.getItem(`clevertize_local_projects_${user.id}`);
        if (userSaved) return JSON.parse(userSaved);
      }
      return [];
    } catch {
      return [];
    }
  });
  const [userBusinesses, setUserBusinesses] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isCurrentProjectSaved, setIsCurrentProjectSaved] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const isSavingProjectRef = useRef(false);
  const currentSavingProjectIdRef = useRef(null);
  // The project the current render is saved under — chosen when the render starts, so a new video never
  // inherits (and overwrites) the previous video's project. videoUrl is filled in once it finishes.
  const renderTargetRef = useRef({ id: null, videoUrl: null });
  // Drafts: the video being made is autosaved as an in-progress project, resumable from My Projects
  const draftIdRef = useRef(null); // this film's draft project id
  const draftRenderRef = useRef(null); // { runId, projectId, startedAt } while a render runs
  const draftSaveTimerRef = useRef(null);
  const draftSavePendingRef = useRef(false);
  const draftSavePromiseRef = useRef(null);
  const suppressAutosaveUntilRef = useRef(0); // quiet period while a resumed draft's state is being restored
  const simpleDraftRef = useRef(null); // Simple Studio's latest reported state
  // Simple Studio reloads only when this changes (a project opened, a new film), not on activeProjectId
  const [simpleStudioKey, setSimpleStudioKey] = useState(0);
  const [simpleResumeDraft, setSimpleResumeDraft] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const getAuthHeaders = (extra = {}) => {
    const token = authToken || localStorage.getItem('clevertize_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
  };

  // Helper to check whether incoming URL research data matches a given business
  const isMatchingBusiness = (biz, incomingName, incomingUrl) => {
    if (!biz) return false;
    const currentName = (biz.businessName || biz.name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetName = (incomingName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Direct name match or substring match (for names >= 4 characters)
    if (currentName && targetName) {
      if (currentName === targetName) return true;
      if (currentName.length >= 4 && targetName.length >= 4) {
        if (currentName.includes(targetName) || targetName.includes(currentName)) {
          return true;
        }
      }
    }

    // 2. Compare URL hostnames
    if (incomingUrl) {
      try {
        const fullIncoming = incomingUrl.startsWith('http') ? incomingUrl : `https://${incomingUrl}`;
        const incomingHost = new URL(fullIncoming).hostname.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (biz.websiteUrl) {
          try {
            const fullCurrent = biz.websiteUrl.startsWith('http') ? biz.websiteUrl : `https://${biz.websiteUrl}`;
            const currentHost = new URL(fullCurrent).hostname.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (incomingHost && currentHost && (incomingHost === currentHost || incomingHost.includes(currentHost) || currentHost.includes(incomingHost))) {
              return true;
            }
          } catch {}
        }

        if (currentName && currentName.length >= 4) {
          if (incomingHost.includes(currentName) || currentName.includes(incomingHost)) {
            return true;
          }
        }
      } catch {}
    }

    return false;
  };

  const handleApplyUrlData = ({
    websiteUrl: url,
    businessName: bName,
    businessType: bType,
    town: tw,
    brief: br,
    productPhoto: pPhoto,
  }) => {
    const rawIncomingName = (bName || '').trim();
    const rawIncomingUrl = (url || '').trim();
    const currentBizName = (userContext.businessName || '').trim();

    // Check if the scanned URL or extracted brand matches the currently selected business
    const matchesCurrent = Boolean(
      !currentBizName ||
      isMatchingBusiness(userContext, rawIncomingName, rawIncomingUrl)
    );

    if (matchesCurrent) {
      // SAME BUSINESS: Update brief & URL on current business without creating duplicates or overwriting brand identity
      if (rawIncomingUrl) updateUserContext('websiteUrl', rawIncomingUrl);
      if (br) updateUserContext('brief', br);
      if (tw && !userContext.town) updateUserContext('town', tw);
      if (rawIncomingName && !currentBizName) updateUserContext('businessName', rawIncomingName);
      if (bType && (!userContext.businessType || userContext.businessType === 'Retail Store')) {
        updateUserContext('businessType', bType);
      }
      if (pPhoto) {
        updateUserContext('productPhoto', pPhoto);
      }
      setToastMessage(`Website analyzed! Brief updated for ${currentBizName || rawIncomingName || 'your business'}.`);
    } else {
      // DIFFERENT BUSINESS / BRAND:
      // Keep active business (e.g. Kalyan Jewellers) untouched in userBusinesses!
      // Check if userBusinesses already contains a business matching the scanned brand:
      const existingMatch = userBusinesses.find((b) =>
        isMatchingBusiness(b, rawIncomingName, rawIncomingUrl)
      );

      if (existingMatch) {
        // Switch to the existing matching business profile
        setUserContext((prev) => ({
          ...prev,
          businessId: existingMatch.id,
          businessName: existingMatch.businessName || existingMatch.name,
          businessType: existingMatch.businessType || existingMatch.category || bType || 'Retail Store',
          town: existingMatch.town || tw || '',
          area: existingMatch.area || '',
          websiteUrl: rawIncomingUrl || existingMatch.websiteUrl || '',
          brief: br || '',
          targetAudience: existingMatch.targetAudience || '',
          brandTone: existingMatch.brandTone || 'Warm & Authentic',
          brandLogo: existingMatch.brandLogo || existingMatch.logo || null,
          logo: existingMatch.brandLogo || existingMatch.logo || null,
          productImages: existingMatch.productImages || [],
          productPhoto: pPhoto || null,
        }));
        setToastMessage(`Switched to existing brand profile "${existingMatch.businessName || existingMatch.name}" with extracted brief!`);
      } else {
        // Automatically create a BRAND NEW business profile
        const newBizId = `biz_${Date.now()}`;
        const resolvedName = rawIncomingName || 'New Brand';
        const resolvedType = bType || 'Retail Store';
        const resolvedTown = tw || '';

        const newBusiness = {
          id: newBizId,
          businessName: resolvedName,
          name: resolvedName,
          businessType: resolvedType,
          category: resolvedType,
          town: resolvedTown,
          area: '',
          websiteUrl: rawIncomingUrl,
          brief: br || '',
          targetAudience: '',
          brandTone: 'Warm & Authentic',
          logo: null,       // Crucial: Brand new profile does not inherit the previous brand's logo!
          brandLogo: null,
          productImages: [],
          createdAt: new Date().toISOString(),
        };

        // Add to userBusinesses without mutating previous businesses
        setUserBusinesses((prev) => [newBusiness, ...prev]);

        // Switch userContext to the newly created business
        setUserContext((prev) => ({
          ...prev,
          businessId: newBizId,
          businessName: resolvedName,
          businessType: resolvedType,
          town: resolvedTown,
          area: '',
          websiteUrl: rawIncomingUrl,
          brief: br || '',
          targetAudience: '',
          brandTone: 'Warm & Authentic',
          brandLogo: null,
          logo: null,
          productImages: [],
          productPhoto: pPhoto || null,
        }));

        // Persist to database if authenticated
        if (currentUser && authToken) {
          fetch('/api/businesses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(newBusiness),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.business) {
                setUserBusinesses((prev) => [
                  data.business,
                  ...prev.filter((b) => b.id !== newBizId && b.id !== data.business.id),
                ]);
              }
            })
            .catch((err) => console.error('Failed to auto-save new business profile:', err));
        }

        setToastMessage(`Created new business profile for "${resolvedName}"!`);
      }
    }

    // Reset downstream film selections from prior runs so new brief starts clean
    setDirectionsList([]);
    setSelectedDirection(null);
    setCustomDirection('');
    setHooksList([]);
    setSelectedHook(null);
    setCustomHook('');
    setPlotsList([]);
    setSelectedPlot(null);
    setCustomPlot('');
    setStoryWorldData(null);
    setGeneratedScript(null);
    setScenes([]);
    setVideoUrl('');

    // Sync Simple Studio draft at Step 1 so Simple mode renders the canonical Step 1 Brief pre-filled from URL
    setSimpleResumeDraft((prev) => ({
      ...(simpleDraftRef.current || prev || {}),
      step: 1,
      brief: br || simpleDraftRef.current?.brief || '',
      ...(pPhoto ? { productPhoto: pPhoto } : {}),
    }));
    setSimpleStudioKey((k) => k + 1);

    // Advance directly to Brief entry (Simple Studio Step 1 in Simple mode; unified Brief -> Mode Selection otherwise)
    markStageComplete('business');
    setCompletedStages((prev) => Array.from(new Set([...(prev || []), 'business'])));
    setHasSelectedModeForProject(false);
    setModeSelectionContext(null);
    setStudioStage('brief');
    setActiveAppView('studio');
    setSelectedCreationEntry('url');
    setTimeout(() => setToastMessage(''), 4500);
  };

  const fetchUserData = async (token, allowAutoOpenOnboarding = false) => {
    if (!token) return;
    try {
      const [bizRes, projRes] = await Promise.all([
        fetch('/api/businesses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (bizRes.ok) {
        const bData = await bizRes.json();
        const bizList = bData.businesses || [];
        setUserBusinesses(bizList);
        if (bizList.length > 0) {
          const primaryBiz = bizList[0];
          setUserContext((prev) => ({
            ...prev,
            businessId: primaryBiz.id,
            businessName: primaryBiz.businessName || primaryBiz.name || '',
            businessType: primaryBiz.businessType || primaryBiz.category || 'Retail Store',
            town: primaryBiz.town || '',
            targetAudience: primaryBiz.targetAudience || '',
            websiteUrl: primaryBiz.websiteUrl || '',
            brandTone: primaryBiz.brandTone || 'Relatable & Trustworthy',
            brandLogo: primaryBiz.logo || primaryBiz.brandLogo || null,
          }));
        } else if (allowAutoOpenOnboarding) {
          setUserContext(createEmptyUserContext());
          setIsOnboardingModalOpen(true);
        } else {
          setUserContext(createEmptyUserContext());
        }
        setBusinessesLoaded(true);
      }
      if (projRes.ok) {
        const pData = await projRes.json();
        const serverProjects = pData.projects || [];
        setUserProjects((prev) => {
          const merged = [...serverProjects];
          for (const lp of prev) {
            if (!merged.some((mp) => mp.id === lp.id || (mp.videoUrl && mp.videoUrl === lp.videoUrl))) {
              merged.push(lp);
            }
          }
          try {
            localStorage.setItem('clevertize_local_projects', JSON.stringify(merged));
            const cUser = currentUser || JSON.parse(localStorage.getItem('clevertize_user') || 'null');
            if (cUser?.id) {
              localStorage.setItem(`clevertize_local_projects_${cUser.id}`, JSON.stringify(merged));
            }
          } catch {}
          return merged;
        });
      }
    } catch (err) {
      console.error('Failed to load user projects/businesses:', err);
    } finally {
      setProjectsLoaded(true);
    }
  };

  useEffect(() => {
    // Purge legacy global un-scoped context so stale brands never bleed across sessions
    try {
      localStorage.removeItem('clevertize_user_context');
    } catch {}

    const token = localStorage.getItem('clevertize_token');
    if (token) {
      setIsAuthChecking(true);
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Session invalid');
          return res.json();
        })
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
            const hydratedOnboarding = mergeOnboardingState(
              loadLocalOnboardingState(data.user.id),
              data.user.onboardingState
            );
            setOnboardingState(hydratedOnboarding);
            saveLocalOnboardingState(data.user.id, hydratedOnboarding);
            setAuthToken(token);
            fetchUserData(token, true);
          } else {
            throw new Error('No user data');
          }
        })
        .catch(() => {
          localStorage.removeItem('clevertize_token');
          setAuthToken(null);
          setCurrentUser(null);
          setUserBusinesses([]);
          setUserContext(createEmptyUserContext());
        })
        .finally(() => {
          setIsAuthChecking(false);
        });
    } else {
      setIsAuthChecking(false);
    }
  }, []);

  // Deep wipe of all film, script, and video state (prevents data bleeding across accounts)
  const resetAllCreativeFilmState = () => {
    setVideoUrl('');
    updateUserContext('productPhoto', null);
    updateUserContext('videoLogo', undefined);
    setScenes([]);
    setGeneratedScript(null);
    setShotSpec(null);
    setSessionId(null);
    setActiveProjectId(null);
    persistedDraftIdsRef.current.clear();
    currentSavingProjectIdRef.current = null;
    isSavingProjectRef.current = false;
    setIsCurrentProjectSaved(false);
    setScriptSaveError('');
    setGuardrailDraftInputs({ doText: '', dontText: '' });
    setBriefOptionalExpanded({ inspiration: false, audience: false, instructions: false, occasion: false, productPhoto: false });
    forgetDraft();

    setDirectionsList([]);
    setSelectedDirection(null);
    setCustomDirection('');
    setHooksList([]);
    setSelectedHook(null);
    setCustomHook('');
    setPlotsList([]);
    setSelectedPlot(null);
    setCustomPlot('');
    setStoryWorldData(null);
    setDirectionData(null);
    setPlotData(null);
    setStoryData(null);
    setScriptPayloadData(null);
    setExplicitChoices({
      style: null,
      language: null,
      platform: null,
      duration: null,
      idea: null,
      opening: null,
    });
    setCreativeDNA({ direction: null, hook: null, plot: null, story: null });

    setApprovedSummary([]);
    setErrorMessage('');
    setValidationError('');
    setQualityFailures([]);
    setIsRendering(false);
    setIsBusy(false);
    setFastStageIndex(0);
    setCurrentStep('input');
    stopTimer();

    studioDispatch({
      type: StudioActionTypes.RESET_STUDIO,
      payload: { initialStage: 'brief', preserveBrand: false },
    });

    setCompletedStages([]);
    setStudioStage('brief');
    setActiveAppView('home');
  };

  // Once anyone is logged in, remember it in this browser (kept on logout) so the
  // auth screen opens on Log in after a logout or an expired session.
  useEffect(() => {
    if (!currentUser || !authToken) return;
    try {
      localStorage.setItem(RETURNING_USER_KEY, '1');
    } catch {}
    setAuthInitialMode('signin');
  }, [currentUser, authToken]);

  const handleAuthSuccess = (userDataOrUser, possibleToken, authMode) => {
    const user = userDataOrUser?.user || userDataOrUser;
    const token = possibleToken || userDataOrUser?.token;
    if (user) {
      setCurrentUser(user);
      const hydratedOnboarding = mergeOnboardingState(
        loadLocalOnboardingState(user.id),
        user.onboardingState
      );
      setOnboardingState(hydratedOnboarding);
      saveLocalOnboardingState(user.id, hydratedOnboarding);
      try {
        const userSaved = localStorage.getItem(`clevertize_local_projects_${user.id}`);
        if (userSaved) {
          const parsedList = JSON.parse(userSaved);
          setUserProjects(parsedList);
          localStorage.setItem('clevertize_local_projects', userSaved);
        } else {
          setUserProjects([]);
          localStorage.removeItem('clevertize_local_projects');
        }
      } catch (e) {
        console.warn('Error restoring user projects from cache:', e);
        setUserProjects([]);
      }
    }

    // Deep clean any lingering film & video state from prior sessions
    resetAllCreativeFilmState();

    if (token) {
      setAuthToken(token);
      try {
        localStorage.setItem('clevertize_token', token);
      } catch {}
      fetchUserData(token, true);
    }
    setToastMessage(`Welcome, ${user?.fullName || user?.name || user?.email || 'User'}!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleLogout = async () => {
    await flushDraftSave(); // an edit still waiting for autosave is saved before the session ends
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {}
    }
    try {
      localStorage.removeItem('clevertize_token');
      localStorage.removeItem('clevertize_user');
      localStorage.removeItem('clevertize_user_context');
      localStorage.removeItem('clevertize_local_projects');
      if (currentUser?.id) {
        localStorage.removeItem(`clevertize_user_context_${currentUser.id}`);
        localStorage.removeItem(`clevertize_local_projects_${currentUser.id}`);
      }
      localStorage.removeItem('clevertize_brand_name');
    } catch {}
    setAuthToken(null);
    setCurrentUser(null);
    setBusinessesLoaded(false);
    setProjectsLoaded(false);
    setIsWelcomeOpen(false);
    setIsTourOpen(false);
    setOnboardingState(createDefaultOnboardingState());
    setModeSelectionContext(null);
    setHasSelectedModeForProject(false);
    setPendingModeSwitch(null);
    setUserProjects([]);
    setUserBusinesses([]);
    setActiveProjectId(null);
    persistedDraftIdsRef.current.clear();
    currentSavingProjectIdRef.current = null;
    renderTargetRef.current = { id: null, videoUrl: null };
    setIsCurrentProjectSaved(false);
    setUserContext(createEmptyUserContext());
    resetAllCreativeFilmState();
    setToastMessage('Signed out successfully.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleDeleteAccount = async () => {
    if (!authToken) return;
    const res = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete account.');
    }

    try {
      localStorage.removeItem('clevertize_token');
      localStorage.removeItem('clevertize_user');
      localStorage.removeItem('clevertize_user_context');
      localStorage.removeItem('clevertize_local_projects');
      if (currentUser?.id) {
        localStorage.removeItem(`clevertize_user_context_${currentUser.id}`);
        localStorage.removeItem(`clevertize_local_projects_${currentUser.id}`);
      }
      localStorage.removeItem('clevertize_brand_name');
    } catch {}

    setAuthToken(null);
    setCurrentUser(null);
    setBusinessesLoaded(false);
    setProjectsLoaded(false);
    setIsWelcomeOpen(false);
    setIsTourOpen(false);
    setOnboardingState(createDefaultOnboardingState());
    setModeSelectionContext(null);
    setHasSelectedModeForProject(false);
    setPendingModeSwitch(null);
    setUserProjects([]);
    setUserBusinesses([]);
    setActiveProjectId(null);
    persistedDraftIdsRef.current.clear();
    currentSavingProjectIdRef.current = null;
    renderTargetRef.current = { id: null, videoUrl: null };
    setIsCurrentProjectSaved(false);
    setUserContext(createEmptyUserContext());
    resetAllCreativeFilmState();

    setToastMessage('Your CleverCut account has been permanently deleted.');
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleUpdateProfile = async (updates) => {
    try {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : prev));
      if (authToken) {
        const res = await fetch('/api/auth/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
          }
        }
      }
      setToastMessage('Profile updated successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleSaveCurrentProject = async () => {
    // 1. Synchronous in-flight guard: blocks rapid concurrent invocations before React state updates
    if (isSavingProjectRef.current || isSavingProject) {
      console.warn('[saveProject] Concurrent save blocked by synchronous guard');
      return;
    }
    isSavingProjectRef.current = true;
    setIsSavingProject(true);
    setScriptSaveError('');

    if (!currentUser || !authToken) {
      isSavingProjectRef.current = false;
      setIsSavingProject(false);
      setIsAuthModalOpen(true);
      setToastMessage('Please sign in or create an account to save your project.');
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    // 2. Stable project ID for this logical save operation
    if (!currentSavingProjectIdRef.current) {
      currentSavingProjectIdRef.current = activeProjectId || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }
    const resolvedProjectId = currentSavingProjectIdRef.current;
    setActiveProjectId(resolvedProjectId);

    try {
      const title = userContext.businessName
        ? `${userContext.businessName} - ${userContext.occasion || userContext.selectedGoalId || 'Ad Film'}`
        : 'Untitled Script';

      const payload = {
        id: resolvedProjectId,
        title,
        businessName: userContext.businessName || '',
        businessType: userContext.businessType || '',
        town: userContext.town || '',
        language: userContext.language || 'English',
        creativeStyle: userContext.creativeStyle || 'UGC / Creator-style',
        status: videoUrl ? 'video_ready' : (scenes && scenes.length > 0 ? 'script_ready' : 'draft'),
        videoUrl: videoUrl || null,
        brief: userContext.brief || '',
        productionSettings: {
          language: userContext.language || 'English',
          creativeStyle: userContext.creativeStyle || 'UGC / Creator-style',
          dimension: userContext.aspectRatio || userContext.dimension || '9:16',
          duration: userContext.targetDuration || userContext.duration || '20s',
          hasLogo: Boolean(userContext.videoLogo !== undefined ? userContext.videoLogo : userContext.logo),
        },
        creativeGuardrails: userContext.creativeGuardrails || null,
        eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        scenes: scenes || [],
        setting: setting || '',
        character1: character1 || '',
        character2: character2 || '',
        shotSpec: shotSpec || null,
        stages: {
          directionsList: directionsList || [],
          selectedDirection: selectedDirection || null,
          customDirection: customDirection || '',
          selectedDirectionIndex: typeof selectedDirectionIdx === 'number' ? selectedDirectionIdx : 0,
          hooksList: hooksList || [],
          selectedHook: selectedHook || null,
          storyWorldData: storyWorldData || null,
          generatedScript: generatedScript || null,
          completedStages: completedStages || [],
          shotSpec: shotSpec || null,
        },
        creativeDNA: {
          ...(creativeDNA || {}),
          shotSpec: shotSpec || null,
          // an unfinished video keeps its draft snapshot, so a manual save stays resumable
          ...(!videoUrl && buildCurrentDraftRef.current ? { draft: (buildCurrentDraftRef.current() || {}).creativeDNA?.draft } : {}),
        },
        brandContext: extractBrandProfile(userContext),
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && (data.success || data.project)) {
        const savedId = data.project.id || resolvedProjectId;
        setActiveProjectId(savedId);
        currentSavingProjectIdRef.current = savedId;
        setIsCurrentProjectSaved(true);
        setUserProjects((prev) => {
          const idx = prev.findIndex((p) => p.id === savedId);
          let next;
          if (idx >= 0) {
            next = [...prev];
            next[idx] = data.project;
          } else {
            next = [data.project, ...prev];
          }
          try {
            localStorage.setItem('clevertize_local_projects', JSON.stringify(next));
            if (currentUser?.id) {
              localStorage.setItem(`clevertize_local_projects_${currentUser.id}`, JSON.stringify(next));
            }
          } catch {}
          return next;
        });
        setToastMessage('Script and project saved to your library!');
        setTimeout(() => setToastMessage(''), 4000);
      } else {
        const msg = `Failed to save: ${data?.error || 'Server error'}`;
        setScriptSaveError(msg);
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error saving project:', err);
      const msg = 'Failed to save project. Check your connection.';
      setScriptSaveError(msg);
      setToastMessage(msg);
      setTimeout(() => setToastMessage(''), 4000);
    } finally {
      isSavingProjectRef.current = false;
      setIsSavingProject(false);
    }
  };

  const handleOpenProject = (proj) => {
    if (!proj) return;
    // A draft resumes where it was left: its studio, its stage, and a render that was still running
    const resume = resumeTargetOf(proj);
    const draft = draftOf(proj);
    clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = null;
    draftIdRef.current = resume ? proj.id : null;
    draftRenderRef.current = null;
    simpleDraftRef.current = null;
    if (resume) suppressAutosaveUntilRef.current = Date.now() + 2000; // don't save while restoring
    setSimpleResumeDraft(resume && resume.studio === 'simple' && draft.simple
      ? { ...draft.simple, step: resume.runId ? 3 : resume.simpleStep }
      : null);
    setSimpleStudioKey((k) => k + 1);
    const restoredDraftInputs = (draft && draft.simple && draft.simple.guardrailDraftInputs)
      || (draft && draft.guided && draft.guided.guardrailDraftInputs)
      || { doText: '', dontText: '' };
    setGuardrailDraftInputs(restoredDraftInputs);
    if (resume && proj.id) persistedDraftIdsRef.current.add(proj.id);
    draftEpochRef.current += 1;
    clearTimeout(draftRetryTimerRef.current);
    draftRetryTimerRef.current = null;
    draftRetryCountRef.current = 0;
    draftTriggerDetailRef.current = '';
    setDraftStatus(resume ? { state: 'saved', isNewDraft: false, detail: 'Draft loaded' } : { state: 'idle', isNewDraft: false, detail: '' });

    setActiveProjectId(proj.id);
    currentSavingProjectIdRef.current = proj.id;
    isSavingProjectRef.current = false;
    setIsCurrentProjectSaved(true);

    // The project's own business (its logo, id, profile) — not whichever business was active before
    const projBusiness = findProjectBusiness(proj, userBusinesses);

    if (proj.brandContext) {
      setUserContext((prev) => ({ ...prev, ...(projBusiness ? businessContextOf(projBusiness, prev) : {}), ...proj.brandContext }));
    } else if (projBusiness) {
      setUserContext((prev) => ({ ...prev, ...businessContextOf(projBusiness, prev) }));
      if (proj.language) updateUserContext('language', proj.language);
      if (proj.creativeStyle) updateUserContext('creativeStyle', proj.creativeStyle);
      if (proj.brief) updateUserContext('brief', proj.brief);
    } else {
      if (proj.businessName) updateUserContext('businessName', proj.businessName);
      if (proj.businessType) updateUserContext('businessType', proj.businessType);
      if (proj.town) updateUserContext('town', proj.town);
      if (proj.language) updateUserContext('language', proj.language);
      if (proj.creativeStyle) updateUserContext('creativeStyle', proj.creativeStyle);
      if (proj.brief) updateUserContext('brief', proj.brief);
    }

    if (proj.scenes && Array.isArray(proj.scenes) && proj.scenes.length > 0) {
      setScenes(proj.scenes);
    }
    if (proj.setting) setSetting(proj.setting);
    if (proj.character1) setCharacter1(proj.character1);
    if (proj.character2) setCharacter2(proj.character2);

    const restoredShotSpec = proj.shotSpec || proj.stages?.shotSpec || proj.creativeDNA?.shotSpec || null;
    if (restoredShotSpec && Array.isArray(restoredShotSpec.shots)) {
      setShotSpec(restoredShotSpec);
    } else {
      setShotSpec(null);
    }

    // stages sit in creativeDNA when the project came from the local file store
    if (!proj.stages && proj.creativeDNA && proj.creativeDNA.stages) proj = { ...proj, stages: proj.creativeDNA.stages };
    if (proj.stages) {
      if (proj.stages.directionsList) setDirectionsList(proj.stages.directionsList);
      if (proj.stages.selectedDirection) setSelectedDirection(proj.stages.selectedDirection);
      if (typeof proj.stages.customDirection === 'string') setCustomDirection(proj.stages.customDirection);
      if (typeof proj.stages.selectedDirectionIndex === 'number') {
        setSelectedDirectionIdx(proj.stages.selectedDirectionIndex);
      }
      if (proj.stages.hooksList) {
        setHooksList(proj.stages.hooksList);
      } else if (proj.stages.hookAngles) {
        setHooksList(proj.stages.hookAngles);
      }
      if (proj.stages.selectedHook) setSelectedHook(proj.stages.selectedHook);
      if (proj.stages.storyWorldData) {
        setStoryWorldData(proj.stages.storyWorldData);
      } else if (proj.stages.storyWorlds) {
        setStoryWorldData(proj.stages.storyWorlds);
      }
      if (proj.stages.generatedScript) setGeneratedScript(proj.stages.generatedScript);
      if (proj.stages.completedStages) setCompletedStages(proj.stages.completedStages);
    } else {
      setCompletedStages(['business', 'brief', 'settings', 'understanding', 'idea', 'opening', 'story', 'script']);
    }

    if (proj.videoUrl) {
      setVideoUrl(proj.videoUrl);
      setStudioStage('video');
      handleSetStudioMode((proj.studio === 'simple' || proj.creativeDNA?.studio === 'simple') ? 'simple' : 'advanced');
    } else if (resume) {
      setVideoUrl('');
      const guided = draft.guided;
      if (resume.studio === 'guided' && guided) {
        if (guided.context) setUserContext((prev) => ({ ...prev, ...guided.context }));
        if (guided.explicitChoices) setExplicitChoices(guided.explicitChoices);
        if (guided.appCreativeDNA) setCreativeDNA(guided.appCreativeDNA);
        if (Array.isArray(guided.completedStages)) setCompletedStages(guided.completedStages);
        if (typeof (guided.stages && guided.stages.selectedDirectionIndex) === 'number') setSelectedDirectionIdx(guided.stages.selectedDirectionIndex);
      }
      setStudioStage(resume.studio === 'guided' ? resume.stage : 'brief');
      handleSetStudioMode(resume.studio === 'simple' ? 'simple' : 'advanced');
    } else {
      setVideoUrl('');
      setStudioStage('script');
      handleSetStudioMode('advanced');
    }
    const restoredProductPhoto = resume
      ? (resume.studio === 'simple'
          ? (draft?.simple?.productPhoto || null)
          : (draft?.guided?.context?.productPhoto || null))
      : (proj.productPhoto || proj.creativeDNA?.productPhoto || null);
    updateUserContext('productPhoto', restoredProductPhoto);
    setHasSelectedModeForProject(true);
    setModeSelectionContext(null);
    const restoredUnderstanding = proj.aiUnderstanding || proj.stages?.aiUnderstanding || proj.creativeDNA?.aiUnderstanding || (draft && draft.guided && draft.guided.aiUnderstanding) || null;
    setAiUnderstanding(restoredUnderstanding);
    const restoredGuardrails = proj.creativeGuardrails || proj.creativeDNA?.creativeGuardrails || proj.stages?.creativeGuardrails || (draft && draft.guided && draft.guided.creativeGuardrails) || null;
    updateUserContext('creativeGuardrails', restoredGuardrails);
    const restoredEventContext = proj.eventContext || proj.creativeDNA?.eventContext || proj.stages?.eventContext || (draft && draft.guided && draft.guided.eventContext) || null;
    updateUserContext('eventContext', restoredEventContext);
    setScriptGuardrailReport(null);
    setActiveAppView('studio');
    setToastMessage(resume ? `Resumed "${proj.title || 'your video'}" where you left off.` : `Loaded "${proj.title || 'Project'}" into Studio.`);
    setTimeout(() => setToastMessage(''), 3500);
    if (resume && resume.runId) resumeRender(resume.runId, proj.id, draft.render && draft.render.startedAt);
  };

  const handleDeleteProject = async (projectId) => {
    setUserProjects((prev) => {
      const next = prev.filter((p) => p.id !== projectId);
      try {
        localStorage.setItem('clevertize_local_projects', JSON.stringify(next));
        if (currentUser?.id) {
          localStorage.setItem(`clevertize_local_projects_${currentUser.id}`, JSON.stringify(next));
        }
      } catch {}
      return next;
    });
    if (activeProjectId === projectId || draftIdRef.current === projectId) {
      forgetDraft(); // don't autosave the deleted draft back into existence
      setActiveProjectId(null);
      currentSavingProjectIdRef.current = null;
      setIsCurrentProjectSaved(false);
      setVideoUrl('');
    }
    if (authToken) {
      try {
        await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (err) {
        console.error('Error deleting project from server:', err);
      }
    }
    setToastMessage('Project removed from library.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleBulkDeleteProjects = async (projectIds = []) => {
    const cleanIds = Array.from(new Set((projectIds || []).filter(Boolean)));
    if (cleanIds.length === 0) {
      return { deletedIds: [], notDeletedIds: [] };
    }

    let deletedIds = cleanIds;
    let notDeletedIds = [];
    let errorMessage = '';

    if (authToken) {
      try {
        const res = await fetch('/api/projects/bulk-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ projectIds: cleanIds }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds : [],
            notDeletedIds: Array.isArray(data.notDeletedIds) ? data.notDeletedIds : cleanIds,
            error: data.error || 'Could not delete selected projects.',
          };
        }
        deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : cleanIds;
        notDeletedIds = Array.isArray(data.notDeletedIds) ? data.notDeletedIds : [];
      } catch (err) {
        console.error('Error bulk deleting projects from server:', err);
        return {
          deletedIds: [],
          notDeletedIds: cleanIds,
          error: 'Network error while deleting projects. Please try again.',
        };
      }
    }

    if (deletedIds.length > 0) {
      const deletedSet = new Set(deletedIds);
      setUserProjects((prev) => {
        const next = prev.filter((p) => !deletedSet.has(p.id));
        try {
          localStorage.setItem('clevertize_local_projects', JSON.stringify(next));
          if (currentUser?.id) {
            localStorage.setItem(`clevertize_local_projects_${currentUser.id}`, JSON.stringify(next));
          }
        } catch {}
        return next;
      });
      if (deletedSet.has(activeProjectId) || deletedSet.has(draftIdRef.current)) {
        forgetDraft();
        setActiveProjectId(null);
        currentSavingProjectIdRef.current = null;
        setIsCurrentProjectSaved(false);
        setVideoUrl('');
      }
      setToastMessage(
        notDeletedIds.length > 0
          ? `Deleted ${deletedIds.length} projects; ${notDeletedIds.length} could not be deleted.`
          : `Deleted ${deletedIds.length} ${deletedIds.length === 1 ? 'project' : 'projects'}.`
      );
      setTimeout(() => setToastMessage(''), 3500);
    }

    return { deletedIds, notDeletedIds, error: errorMessage };
  };

  const handleSaveBusiness = async (bizData) => {
    if (!currentUser || !authToken) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(bizData),
      });
      const data = await res.json();
      if (res.ok && (data.success || data.business)) {
        setUserBusinesses((prev) => {
          const idx = prev.findIndex((b) => b.id === data.business.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = data.business;
            return next;
          }
          return [data.business, ...prev];
        });
        setUserContext((prev) => ({
          ...prev,
          businessName: data.business.name || prev.businessName,
          businessType: data.business.category || prev.businessType,
          town: data.business.town || prev.town,
          area: data.business.area || prev.area,
          websiteUrl: data.business.websiteUrl || prev.websiteUrl,
          specialty: data.business.specialty || prev.specialty,
        }));
        setToastMessage('Business profile saved.');
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error saving business:', err);
    }
  };

  useEffect(() => {
    if (!businessesLoaded) return;
    const shouldShow = shouldAutoTriggerWelcome(onboardingState, {
      isAuthenticated: Boolean(currentUser && authToken),
      isAuthChecking,
      isOnboardingModalOpen,
      isAuthModalOpen,
      businessCount: userBusinesses.length,
      isTourActive: isTourOpen,
    });
    if (shouldShow && !isWelcomeOpen) {
      setIsWelcomeOpen(true);
    }
  }, [
    businessesLoaded,
    onboardingState,
    currentUser,
    authToken,
    isAuthChecking,
    isOnboardingModalOpen,
    isAuthModalOpen,
    userBusinesses.length,
    isTourOpen,
    isWelcomeOpen,
  ]);

  const handleOnboardingComplete = async (onboardingData) => {
    setIsOnboardingModalOpen(false);
    setEditingBusiness(null);
    setBusinessesLoaded(true);
    const resolvedName = onboardingData.businessName || 'My Business';
    const resolvedType = onboardingData.businessType || 'Retail Store';

    setUserContext((prev) => ({
      ...prev,
      businessId: onboardingData.id || prev.businessId,
      businessName: resolvedName,
      businessType: resolvedType,
      town: onboardingData.town || '',
      targetAudience: onboardingData.targetAudience || '',
      websiteUrl: onboardingData.websiteUrl || prev.websiteUrl,
      brandTone: onboardingData.brandTone || prev.brandTone,
      brandLogo: onboardingData.brandLogo || onboardingData.logo || prev.brandLogo,
    }));

    if (currentUser && authToken) {
      try {
        const res = await fetch('/api/businesses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            id: onboardingData.id || undefined,
            businessName: resolvedName,
            name: resolvedName,
            businessType: resolvedType,
            category: resolvedType,
            town: onboardingData.town || '',
            targetAudience: onboardingData.targetAudience || '',
            websiteUrl: onboardingData.websiteUrl || '',
            brandTone: onboardingData.brandTone || 'Relatable & Trustworthy',
            logo: onboardingData.brandLogo || onboardingData.logo || null,
            brandLogo: onboardingData.brandLogo || onboardingData.logo || null,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const saved = data.business;
          if (saved) {
            setUserBusinesses((prev) => {
              const idx = prev.findIndex((b) => b.id === saved.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
              }
              return [saved, ...prev];
            });
          }
        }
        await fetchUserData(authToken, false);
      } catch (err) {
        console.error('Error auto-saving onboarded business:', err);
      }
    } else {
      // Local fallback for guest / unauthenticated session
      const localBiz = {
        id: onboardingData.id || `biz_${Date.now()}`,
        businessName: resolvedName,
        name: resolvedName,
        businessType: resolvedType,
        category: resolvedType,
        town: onboardingData.town || '',
        targetAudience: onboardingData.targetAudience || '',
        websiteUrl: onboardingData.websiteUrl || '',
        brandTone: onboardingData.brandTone || 'Warm & Authentic',
        logo: onboardingData.brandLogo || onboardingData.logo || null,
        brandLogo: onboardingData.brandLogo || onboardingData.logo || null,
      };
      setUserBusinesses((prev) => {
        const idx = prev.findIndex((b) => b.id === localBiz.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = localBiz;
          return next;
        }
        return [localBiz, ...prev];
      });
    }

    markStageComplete('business');
    if (activeAppView !== 'businesses' && activeAppView !== 'business') {
      setActiveAppView('home');
    }
    setToastMessage(`Brand profile for "${resolvedName}" saved!`);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Stopwatch Timer
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const timerStartRef = useRef(0);
  const timerIntervalRef = useRef(null);

  const startTimer = () => {
    timerStartRef.current = Date.now();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - timerStartRef.current) / 1000);
      const m = Math.floor(s / 60);
      const sec = s % 60;
      setElapsedTime(String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0'));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  // Web Speech API for voice dictation
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [micHint, setMicHint] = useState('');
  const [dictatedBriefSync, setDictatedBriefSync] = useState({ text: '', seq: 0 });
  const recognitionRef = useRef(null);
  const baseSpeechTextRef = useRef('');

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      setMicSupported(true);
      const rec = new SpeechRec();
      rec.lang = 'en-IN';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onstart = () => {
        setIsListening(true);
        setMicHint('Listening… Speak your video idea clearly.');
      };

      rec.onend = () => {
        setIsListening(false);
        setMicHint('');
      };

      rec.onresult = (e) => {
        let finalText = '';
        let interimText = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t;
          else interimText += t;
        }
        if (finalText) {
          baseSpeechTextRef.current = (
            (baseSpeechTextRef.current ? baseSpeechTextRef.current + ' ' : '') + finalText.trim()
          ).trim();
        }
        const updated = (baseSpeechTextRef.current + (interimText ? ' ' + interimText : '')).trim();
        updateUserContext('brief', updated);
        setDictatedBriefSync((prev) => ({ text: updated, seq: prev.seq + 1 }));
        setValidationError('');
      };

      rec.onerror = (e) => {
        setIsListening(false);
        setMicHint(
          e.error === 'not-allowed'
            ? 'Microphone access denied.'
            : e.error === 'no-speech'
            ? 'No speech detected.'
            : 'Voice input error.'
        );
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceInput = (initialSeed) => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      baseSpeechTextRef.current = typeof initialSeed === 'string'
        ? initialSeed.trim()
        : (userContext.brief || '').trim();
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

  // Dynamic Progress Ticker during all Checkpoint Generation Transitions
  useEffect(() => {
    let stepTimer = null;
    let tipTimer = null;

    if (isBusy) {
      setBusyStep(0);
      const pipeline = CHECKPOINT_PIPELINES[activeCheckpointKey] || CHECKPOINT_PIPELINES.direction;
      const totalSteps = pipeline.stages.length;
      const totalTips = pipeline.tips.length;

      setBusyTipIndex(Math.floor(Math.random() * totalTips));

      // Advance through sub-stages every 2.8 seconds
      stepTimer = setInterval(() => {
        setBusyStep((prev) => (prev < totalSteps - 1 ? prev + 1 : prev));
      }, 2800);

      // Rotate engaging filmmaker tips every 3.8 seconds
      tipTimer = setInterval(() => {
        setBusyTipIndex((prev) => (prev + 1) % totalTips);
      }, 3800);
    } else {
      setBusyStep(0);
    }

    return () => {
      if (stepTimer) clearInterval(stepTimer);
      if (tipTimer) clearInterval(tipTimer);
    };
  }, [isBusy, activeCheckpointKey]);

  // Ticker during GPU Video Render
  useEffect(() => {
    let stepTimer = null;
    let tipTimer = null;

    if (isRendering) {
      setRenderStep(0);
      setRenderTipIndex(Math.floor(Math.random() * RENDER_TIPS.length));

      stepTimer = setInterval(() => {
        setRenderStep((prev) => (prev < RENDER_STAGES.length - 1 ? prev + 1 : prev));
      }, 24000);

      tipTimer = setInterval(() => {
        setRenderTipIndex((prev) => (prev + 1) % RENDER_TIPS.length);
      }, 5500);
    } else {
      setRenderStep(0);
    }

    return () => {
      if (stepTimer) clearInterval(stepTimer);
      if (tipTimer) clearInterval(tipTimer);
    };
  }, [isRendering]);

  // Dynamic Ticker during Fast Pipeline Generation
  useEffect(() => {
    let fastStageTimer = null;
    let tipTimer = null;

    if (currentStep === 'generating') {
      setFastStageIndex(0);
      fastStageTimer = setInterval(() => {
        setFastStageIndex((prev) => (prev < 3 ? prev + 1 : prev));
      }, 9000);

      tipTimer = setInterval(() => {
        setBusyTipIndex((prev) => (prev + 1) % FAST_PIPELINE_TIPS.length);
      }, 4000);
    }

    return () => {
      if (fastStageTimer) clearInterval(fastStageTimer);
      if (tipTimer) clearInterval(tipTimer);
    };
  }, [currentStep]);

  // File Upload Helper
  const handleFileUpload = (file, key) => {
    if (!file) {
      updateUserContext(key, null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateUserContext(key, {
        name: file.name,
        mime: file.type,
        data: reader.result.split(',')[1],
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      });
    };
    reader.readAsDataURL(file);
  };

  // Build the Form Payload for POST /api/session & /api/pipeline/generate
  const buildSessionPayload = () => {
    const activeGoal = AD_GOAL_PRESETS.find((g) => g.id === userContext.selectedGoalId) || AD_GOAL_PRESETS[0];
    const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
      ? userContext.customBusinessType.trim()
      : userContext.businessType;

    // Enrich specialty with all user inputs so Claude receives the entire creative brief
    const targetDur = userContext.targetDuration || userContext.duration || '30s';
    const durNum = parseInt(targetDur, 10) || 30;
    const perSceneSec = (durNum / 4).toFixed(1);
    const targetRatio = userContext.aspectRatio || userContext.dimension || (userContext.platform && userContext.platform.includes('16:9') ? '16:9' : userContext.platform && userContext.platform.includes('1:1') ? '1:1' : '9:16');
    const ratioLabel = targetRatio === '16:9' ? '16:9 Landscape' : targetRatio === '1:1' ? '1:1 Square' : '9:16 Vertical';

    const specialtyParts = [
      userContext.specialty?.trim(),
      userContext.brief?.trim() ? `Creative Brief/Idea: ${userContext.brief.trim()}` : null,
      userContext.targetAudience?.trim() ? `Target Audience: ${userContext.targetAudience.trim()}` : null,
      activeGoal.objective ? `Ad Focus: ${activeGoal.objective}` : null,
      `Video Dimension: ${targetRatio} (${ratioLabel})`,
      `Platform: ${userContext.platform || ratioLabel}`,
      `Creative Style: ${userContext.creativeStyle || 'UGC / Creator-style'}`,
      userContext.brandTone?.trim() ? `Brand Tone/Voice: ${userContext.brandTone.trim()}` : null,
      `Target Duration: ${targetDur} (~${perSceneSec}s per scene across 4 scenes)`,
      userContext.offer?.trim() ? `Offer/USP: ${userContext.offer.trim()}` : null,
      userContext.leadCharacter?.trim() ? `Lead Character: ${userContext.leadCharacter.trim()}` : null,
      userContext.supportingCharacter?.trim() ? `Supporting Character: ${userContext.supportingCharacter.trim()}` : null,
      userContext.environment?.trim() ? `Setting/Environment: ${userContext.environment.trim()}` : null,
      userContext.websiteUrl?.trim() ? `Website: ${userContext.websiteUrl.trim()}` : null,
    ].filter(Boolean);

    return {
      businessName: userContext.businessName.trim(),
      businessType: bType || 'Retail Store',
      town: userContext.town?.trim() || '',
      targetAudience: userContext.targetAudience?.trim() || '',
      language: userContext.language || 'English',
      duration: targetDur,
      targetDuration: targetDur,
      aspectRatio: targetRatio,
      dimension: targetRatio,
      platform: userContext.platform || (targetRatio === '16:9' ? 'YouTube / 16:9' : targetRatio === '1:1' ? 'Social Feed / 1:1' : 'Instagram Reels / 9:16'),
      creativeStyle: userContext.creativeStyle || 'UGC / Creator-style',
      brandTone: userContext.brandTone?.trim() || 'Warm & Authentic',
      area: userContext.area?.trim() || '',
      specialty: specialtyParts.join(' | '),
      offer: userContext.offer?.trim() || '',
      occasion: userContext.occasion?.trim() || '',
      contact: userContext.contact?.trim() || '',
      ownerName: userContext.ownerName?.trim() || userContext.leadCharacter?.trim() || '',
      scriptMode: userContext.scriptMode === 'roman' ? 'roman' : 'devanagari',
      product: userContext.specialty?.trim() || userContext.offer?.trim() || userContext.brief?.trim() || bType || 'featured product',
      productName: userContext.specialty?.trim() || bType || 'featured product',
      brief: userContext.brief?.trim() || '',
      shopPhoto: userContext.shopPhoto ? { mime: userContext.shopPhoto.mime, data: userContext.shopPhoto.data } : null,
      productPhoto: userContext.productPhoto ? { mime: userContext.productPhoto.mime, data: userContext.productPhoto.data } : null,
      logo: videoLogoPayload(userContext),
      creativeGuardrails: userContext.creativeGuardrails || null,
    };
  };

  // 1. Adaptive Public Web Research (Non-blocking background runner)
  const triggerAdaptiveResearch = async (force = false) => {
    const brand = userContext.businessName.trim();
    const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
      ? userContext.customBusinessType.trim()
      : userContext.businessType;
    if (!brand || !bType) return;

    const brandKey = `${brand}_${bType}_${userContext.town || ''}_${userContext.websiteUrl || ''}`;
    if (!force && lastResearchedBrandRef.current === brandKey) return;
    lastResearchedBrandRef.current = brandKey;

    setIsResearching(true);
    setResearchDismissed(false);
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          businessName: brand,
          businessType: bType,
          town: userContext.town || '',
          area: userContext.area || '',
          websiteUrl: userContext.websiteUrl || '',
          brief: userContext.brief || '',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResearchData(data);
      }
    } catch (err) {
      console.warn('[research] background research error:', err);
    } finally {
      setIsResearching(false);
    }
  };

  const handleApplyResearchInsights = () => {
    if (!researchData) return;
    const additions = [];
    if (researchData.audienceInsight) additions.push(`Target audience: ${researchData.audienceInsight}`);
    if (researchData.creativeOpportunity) additions.push(`Opportunity: ${researchData.creativeOpportunity}`);
    if (selectedGapOption) {
      const ans = selectedGapOption === 'Other' ? customGapAnswer : selectedGapOption;
      if (ans) additions.push(`Audience focus: ${ans}`);
    }

    if (additions.length) {
      const current = userContext.brief ? userContext.brief.trim() + '\n\n' : '';
      updateUserContext('brief', current + additions.join('\n'));
    }
    setResearchDismissed(true);
  };

  // 1b. AI Understanding / Polished Brief Generation & Approval
  const getCurrentProductionSettings = () => {
    const dim = userContext.aspectRatio || userContext.dimension || (
      userContext.platform && userContext.platform.includes('16:9')
        ? '16:9'
        : userContext.platform && userContext.platform.includes('1:1')
        ? '1:1'
        : '9:16'
    );
    return {
      language: userContext.language || 'English',
      creativeStyle: userContext.creativeStyle || 'UGC / Creator-style',
      dimension: dim,
      aspectRatio: dim,
      duration: userContext.targetDuration || userContext.duration || '20s',
      targetDuration: userContext.targetDuration || userContext.duration || '20s',
      platform: userContext.platform || '',
      hasLogo: Boolean(userContext.videoLogo !== undefined ? userContext.videoLogo : userContext.logo),
      hasProductPhoto: Boolean(userContext.productPhoto),
    };
  };

  const handleCancelAiUnderstanding = () => {
    if (aiUnderstandingAbortRef.current) {
      aiUnderstandingAbortRef.current.abort();
      aiUnderstandingAbortRef.current = null;
    }
    aiUnderstandingSeqRef.current += 1;
    isAnalyzingBriefRef.current = false;
    setIsAnalyzingBrief(false);
    setUnderstandingError('');
    setStudioStage(hasSelectedModeForProject ? 'settings' : 'brief');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateAiUnderstanding = async (userCorrections = '', forceRetry = false) => {
    if (isAnalyzingBriefRef.current && !forceRetry) return;
    if (aiUnderstandingAbortRef.current) {
      aiUnderstandingAbortRef.current.abort();
    }
    const effectiveCorrections =
      userCorrections === undefined || (forceRetry && userCorrections === '')
        ? (lastUnderstandingCorrectionsRef.current || '')
        : (typeof userCorrections === 'string' ? userCorrections : '');
    lastUnderstandingCorrectionsRef.current = effectiveCorrections;
    setAnalysisAttempt((c) => c + 1);

    const seq = ++aiUnderstandingSeqRef.current;
    const controller = new AbortController();
    aiUnderstandingAbortRef.current = controller;
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 65000);

    isAnalyzingBriefRef.current = true;
    setIsAnalyzingBrief(true);
    setUnderstandingError('');
    setStudioStage('understanding');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const cleanBrief = userContext.brief || userContext.specialty || userContext.offer || '';
      const prodSettings = getCurrentProductionSettings();
      const targetProjId = activeProjectId || currentSavingProjectIdRef.current || draftIdRef.current || null;
      const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('clevertize_token') : null);
      const res = await fetch('/api/creative/ai-understanding', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          businessName: userContext.businessName,
          businessType: userContext.businessType,
          town: userContext.town,
          brief: cleanBrief.trim(),
          language: prodSettings.language,
          creativeStyle: prodSettings.creativeStyle,
          dimension: prodSettings.dimension,
          aspectRatio: prodSettings.aspectRatio,
          duration: prodSettings.duration,
          targetDuration: prodSettings.targetDuration,
          platform: prodSettings.platform,
          hasLogo: prodSettings.hasLogo,
          hasProductPhoto: prodSettings.hasProductPhoto,
          settings: prodSettings,
          brandTone: userContext.brandTone,
          occasion: userContext.occasion,
          websiteUrl: userContext.websiteUrl,
          projectId: targetProjId,
          userCorrections: effectiveCorrections,
          previousUnderstanding: aiUnderstanding,
          creativeGuardrails: userContext.creativeGuardrails || null,
          eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (seq !== aiUnderstandingSeqRef.current) return;
      if (!res.ok || !data || !data.understanding) {
        throw new Error(data?.error || 'Failed to analyze brief.');
      }

      if (data.creativeGuardrails) {
        updateUserContext('creativeGuardrails', data.creativeGuardrails);
      }
      setAiUnderstanding(data.understanding);
      setCreativeDNA((prev) => ({
        ...prev,
        aiUnderstanding: data.understanding,
        productionSettings: prodSettings,
      }));
      scheduleDraftSave(true);
    } catch (err) {
      if (seq !== aiUnderstandingSeqRef.current) return;
      if (err?.name === 'AbortError' && !timedOut) return;
      console.error('[AIUnderstanding] generation error:', err);
      setUnderstandingError(
        timedOut
          ? 'AI Understanding timed out after 65s while reviewing your brief. Your brief and settings are intact — click Retry or go back.'
          : (err.message || 'Failed to analyze brief. You can try again or edit manually.')
      );
    } finally {
      clearTimeout(timeoutId);
      if (aiUnderstandingAbortRef.current === controller) {
        aiUnderstandingAbortRef.current = null;
      }
      if (seq === aiUnderstandingSeqRef.current) {
        isAnalyzingBriefRef.current = false;
        setIsAnalyzingBrief(false);
      }
    }
  };

  const handleApproveUnderstanding = async (approvedData) => {
    try {
      const updated = {
        ...approvedData,
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
      };
      setAiUnderstanding(updated);
      setCreativeDNA((prev) => ({ ...prev, aiUnderstanding: updated }));

      let targetProjId = activeProjectId || currentSavingProjectIdRef.current || draftIdRef.current;
      if (!targetProjId && authToken) {
        await persistDraft(true);
        targetProjId = activeProjectId || currentSavingProjectIdRef.current || draftIdRef.current;
      }
      if (targetProjId) {
        const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('clevertize_token') : null);
        await fetch(`/api/creative/ai-understanding/${encodeURIComponent(targetProjId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ understanding: updated, approvalStatus: 'approved' }),
        }).catch((err) => console.warn('[AIUnderstanding] backend save warning:', err));
      }

      handleBehaviorEvent('aiUnderstandingApprovedCount');
      markStageComplete('understanding');
      scheduleDraftSave(true);
      setStudioStage('idea');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const currentFormat = userContext.creativeStyle || 'UGC / Creator-style';
      const currentLang = userContext.language || 'English';
      const activeKey = `${currentFormat}_${currentLang}`;
      if (!directionsList.length || loadedDirectionsFormatRef.current !== activeKey) {
        await loadCreativeDirections(true, currentFormat, currentLang);
      }
    } catch (err) {
      console.error('[AIUnderstanding] approval error:', err);
    }
  };

  const handleUpdateUnderstanding = (updated) => {
    setAiUnderstanding(updated);
    setCreativeDNA((prev) => ({ ...prev, aiUnderstanding: updated }));
    scheduleDraftSave(false);
  };

  // 2. Fetching Creative Direction Territories
  const loadCreativeDirections = async (force = false, overrideFormat = null, overrideLang = null) => {
    const activeFormat = overrideFormat || userContext.creativeStyle || 'UGC / Creator-style';
    const activeLang = overrideLang || userContext.language || 'English';
    const activeKey = `${activeFormat}_${activeLang}`;
    if (directionsList.length && !force && loadedDirectionsFormatRef.current === activeKey) return;
    const brand = userContext.businessName.trim();
    const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
      ? userContext.customBusinessType.trim()
      : userContext.businessType;
    if (!brand) return;

    setIsLoadingDirections(true);
    try {
      const prodSettings = getCurrentProductionSettings();
      const res = await fetch('/api/creative/directions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          businessName: brand,
          businessType: bType,
          town: userContext.town || '',
          brief: userContext.brief || '',
          targetAudience: userContext.targetAudience || (aiUnderstanding?.target_audience) || '',
          language: activeLang,
          brandTone: userContext.brandTone || 'Warm & Authentic',
          research: researchData,
          format: activeFormat,
          creativeStyle: activeFormat,
          dimension: prodSettings.dimension,
          aspectRatio: prodSettings.aspectRatio,
          duration: prodSettings.duration,
          targetDuration: prodSettings.targetDuration,
          hasLogo: prodSettings.hasLogo,
          projectId: activeProjectId,
          creativeGuardrails: userContext.creativeGuardrails || null,
          eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
          aiUnderstanding: aiUnderstanding && aiUnderstanding.approval_status === 'approved' ? aiUnderstanding : null,
        }),
      });
      if (res.ok) {
        const list = await res.json();
        setDirectionsList(list);
        const rec = list.find((d) => d.recommended) || list[0];
        setSelectedDirection(rec);
        setCreativeDNA((prev) => ({ ...prev, direction: rec, format: activeFormat, language: activeLang }));
        loadedDirectionsFormatRef.current = activeKey;
      } else if (res.status === 409) {
        const errData = await res.json().catch(() => null);
        if (errData?.code === 'UNDERSTANDING_OUTDATED' || errData?.code === 'UNDERSTANDING_NOT_APPROVED') {
          setErrorMessage(errData.error || 'Please review and approve AI Understanding first.');
          setStudioStage('understanding');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } catch (e) {
      console.warn('[directions] load error:', e);
    } finally {
      setIsLoadingDirections(false);
    }
  };

  // 3. Fetching Hooks
  const [languageChangedNotice, setLanguageChangedNotice] = useState('');

  const handleLanguageChange = (newLang) => {
    if (userContext.language === newLang) return;
    updateUserContext('language', newLang);

    const hadDownstream = Boolean(
      directionsList.length > 0 ||
      selectedDirection ||
      hooksList.length > 0 ||
      selectedHook ||
      scenes.length > 0 ||
      generatedScript ||
      completedStages.includes('idea') ||
      completedStages.includes('script')
    );

    // Invalidate creative directions so fresh ones are loaded for the new language
    setDirectionsList([]);
    setSelectedDirection(null);
    setCustomDirection('');
    setExplicitChoices((prev) => {
      const next = { ...prev };
      delete next.idea;
      delete next.opening;
      return next;
    });

    if (loadedHooksDirectionKeyRef) loadedHooksDirectionKeyRef.current = '';
    if (loadedDirectionsFormatRef) loadedDirectionsFormatRef.current = '';
    setHooksList([]);
    setSelectedHook(null);
    setCustomHook('');
    setPlotsList([]);
    setSelectedPlot(null);
    setCustomPlot('');
    setStoryWorldData(null);
    setScenes([]);
    setScriptPayloadData(null);
    setGeneratedScript(null);
    setShotSpec(null);
    setVideoUrl('');

    // Rewind completed stages downstream of settings
    setCompletedStages((prev) => prev.filter((s) => ['business', 'brief', 'settings'].includes(s)));
    studioDispatch({ type: StudioActionTypes.INVALIDATE_DOWNSTREAM, payload: { fromStage: 'settings' } });

    if (hadDownstream) {
      setHasStaleWarning(true);
      setLanguageChangedNotice(`Language changed to ${newLang}. Creative copy and directions will refresh.`);
      setTimeout(() => setLanguageChangedNotice(''), 5000);
    }
  };

  const loadHooks = async (force = false, overrideLang = null, overrideDirection = null, overrideFormat = null) => {
    const brand = userContext.businessName.trim();
    const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
      ? userContext.customBusinessType.trim()
      : userContext.businessType;
    const lang = overrideLang || userContext.language || 'English';
    const activeFormat = overrideFormat || userContext.creativeStyle || 'UGC / Creator-style';
    const ideaSel = resolveIdeaSelection(
      overrideDirection || selectedDirection,
      overrideDirection ? '' : customDirection,
      directionsList.find((d) => d.recommended) || directionsList[0] || { title: 'Everyday Relatable' }
    );
    const activeDir = ideaSel.direction;
    const activeKey = `${activeDir?.id || activeDir?.title || ''}_${activeFormat}_${lang}`;

    if (hooksList.length && !force) {
      if (loadedHooksDirectionKeyRef.current === activeKey) return;
    }

    setIsLoadingHooks(true);
    try {
      const res = await fetch('/api/creative/hooks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          businessName: brand,
          businessType: bType,
          brief: userContext.brief || '',
          direction: activeDir,
          language: lang,
          brandTone: userContext.brandTone || 'Warm & Authentic',
          format: activeFormat,
          creativeStyle: activeFormat,
          projectId: activeProjectId,
          creativeGuardrails: userContext.creativeGuardrails || null,
          eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        }),
      });
      if (res.ok) {
        const list = await res.json();
        setHooksList(list);
        const rec = list.find((h) => h.recommended) || list[0];
        setSelectedHook(rec);
        setCreativeDNA((prev) => ({ ...prev, direction: activeDir, hook: rec }));
        if (rec) {
          const hookLabel = rec.archetype || rec.hookLine;
          if (hookLabel) {
            setExplicitChoices((prev) => ({ ...prev, opening: hookLabel }));
          }
        }
        loadedHooksDirectionKeyRef.current = activeKey;
      }
    } catch (e) {
      console.warn('[hooks] load error:', e);
    } finally {
      setIsLoadingHooks(false);
    }
  };

  // 4. Fetching Plots
  const loadPlots = async (force = false, overrideLang = null) => {
    if (plotsList.length && !force) return;
    const brand = userContext.businessName.trim();
    const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
      ? userContext.customBusinessType.trim()
      : userContext.businessType;
    const lang = overrideLang || userContext.language || 'English';

    setIsLoadingPlots(true);
    try {
      const res = await fetch('/api/creative/plots', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          businessName: brand,
          businessType: bType,
          brief: userContext.brief || '',
          direction: selectedDirection || { title: customDirection || 'Everyday Relatable' },
          hook: selectedHook || { hookLine: customHook || '' },
          format: userContext.creativeStyle || 'Storytelling',
          language: lang,
          brandTone: userContext.brandTone || 'Warm & Authentic',
          projectId: activeProjectId,
          creativeGuardrails: userContext.creativeGuardrails || null,
          eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        }),
      });
      if (res.ok) {
        const list = await res.json();
        setPlotsList(list);
        const rec = list.find((p) => p.recommended) || list[0];
        setSelectedPlot(rec);
        setCreativeDNA((prev) => ({ ...prev, plot: rec }));
      }
    } catch (e) {
      console.warn('[plots] load error:', e);
    } finally {
      setIsLoadingPlots(false);
    }
  };

  // 5. Fetching Story & World
  const loadStoryWorld = async (force = false, overrideLang = null, overrideFormat = null, overrideHook = null, overrideDirection = null) => {
    if (storyWorldData && !force && !overrideFormat) return;
    const brand = userContext.businessName.trim();
    const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
      ? userContext.customBusinessType.trim()
      : userContext.businessType;
    const lang = overrideLang || userContext.language || 'English';
    const activeFormat = overrideFormat || userContext.creativeStyle || creativeDNA?.format || 'UGC / Creator-style';
    const ideaSel = resolveIdeaSelection(
      overrideDirection || selectedDirection,
      overrideDirection ? '' : customDirection,
      directionsList.find((d) => d.recommended) || directionsList[0] || { title: 'Everyday Relatable' }
    );
    const activeDir = ideaSel.direction;
    const activeHk = overrideHook || selectedHook || (customHook ? { hookLine: customHook } : hooksList.find((h) => h.recommended) || hooksList[0] || { hookLine: '' });

    setIsLoadingStory(true);
    try {
      const res = await fetch('/api/creative/story', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          businessName: brand,
          businessType: bType,
          town: userContext.town || '',
          brief: userContext.brief || '',
          direction: activeDir,
          hook: activeHk,
          plot: selectedPlot || { title: customPlot || 'The Timely Rescue' },
          format: activeFormat,
          language: lang,
          brandTone: userContext.brandTone || 'Warm & Authentic',
          projectId: activeProjectId,
          creativeGuardrails: userContext.creativeGuardrails || null,
          eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStoryWorldData(data);
        setCreativeDNA((prev) => ({ ...prev, story: data, format: data.format || activeFormat }));
        if (data.characters?.character1 && !userContext.leadCharacter) {
          updateUserContext('leadCharacter', data.characters.character1);
        }
        if (data.characters?.character2 && !userContext.supportingCharacter) {
          updateUserContext('supportingCharacter', data.characters.character2);
        }
        if (data.setting && !userContext.environment) {
          updateUserContext('environment', data.setting);
        }
      }
    } catch (e) {
      console.warn('[story] load error:', e);
    } finally {
      setIsLoadingStory(false);
    }
  };

  const handleFormatChange = async (newFormat) => {
    if (userContext.creativeStyle === newFormat) return;
    updateUserContext('creativeStyle', newFormat);
    setCreativeDNA((prev) => ({
      ...prev,
      format: newFormat,
      story: prev?.story ? { ...prev.story, format: newFormat } : { format: newFormat },
    }));

    const hadDownstream = Boolean(
      directionsList.length > 0 ||
      selectedDirection ||
      hooksList.length > 0 ||
      selectedHook ||
      scenes.length > 0 ||
      generatedScript ||
      completedStages.includes('idea') ||
      completedStages.includes('script')
    );

    // Invalidate downstream creative direction territories so they are tailored to the new format
    setDirectionsList([]);
    setSelectedDirection(null);
    setCustomDirection('');
    setExplicitChoices((prev) => {
      const next = { ...prev };
      delete next.idea;
      delete next.opening;
      return next;
    });

    if (loadedHooksDirectionKeyRef) loadedHooksDirectionKeyRef.current = '';
    setHooksList([]);
    setSelectedHook(null);
    setCustomHook('');
    setPlotsList([]);
    setSelectedPlot(null);
    setCustomPlot('');
    setStoryWorldData(null);
    setScenes([]);
    setScriptPayloadData(null);
    setGeneratedScript(null);
    setShotSpec(null);
    setVideoUrl('');

    // Rewind completed stages downstream of settings
    setCompletedStages((prev) => prev.filter((s) => ['business', 'brief', 'settings'].includes(s)));
    studioDispatch({ type: StudioActionTypes.INVALIDATE_DOWNSTREAM, payload: { fromStage: 'settings' } });

    if (hadDownstream) {
      setHasStaleWarning(true);
    }
  };

  // 6. Master Script Synthesis via /api/creative/synthesize-script
  const handleSynthesizeMasterScript = async () => {
    if (!userContext.businessName.trim()) {
      setValidationError('Please enter your business or brand name.');
      return;
    }

    setValidationError('');
    setErrorMessage('');
    setQualityFailures([]);
    setIsBusy(true);
    startTimer();
    setCurrentStep('generating');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const form = buildSessionPayload();
    const ideaSel = resolveIdeaSelection(
      selectedDirection,
      customDirection,
      directionsList.find((d) => d.recommended)
    );
    const activeDNA = {
      direction: ideaSel.direction,
      ideaSource: ideaSel.ideaSource,
      selectedAiDirection: ideaSel.selectedAiDirection,
      customDirection: ideaSel.customDirection,
      hook: selectedHook || (customHook ? { hookLine: customHook } : hooksList.find((h) => h.recommended)),
      plot: selectedPlot || (customPlot ? { title: customPlot } : plotsList.find((p) => p.recommended)),
      story: storyWorldData || { format: userContext.creativeStyle || 'Storytelling' },
      character1: storyWorldData?.character1 || userContext.leadCharacter || undefined,
      character2: storyWorldData?.character2 || userContext.supportingCharacter || undefined,
      location: storyWorldData?.location || (storyWorldData?.setting ? { name: storyWorldData.setting } : undefined),
      product: storyWorldData?.product || userContext.specialty || userContext.brief || undefined,
    };

    try {
      const res = await fetch('/api/creative/synthesize-script', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          form,
          creativeDNA: activeDNA,
          constraints: constraintsList,
          avoid: avoidList,
          projectId: activeProjectId,
          creativeGuardrails: userContext.creativeGuardrails || null,
          eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        if (res.status === 422 && data.failures) {
          setQualityFailures(data.failures);
        }
        throw new Error(data.error || 'Quality gate validation failed on synthesis.');
      }

      setScriptPayloadData(data);
      setGeneratedScript(data);
      setScriptGuardrailReport(data.guardrailReport || null);
      setCharacter1(data.character1 || '');
      setCharacter2(data.character2 || '');
      setSetting(data.setting || '');
      setScenes(data.scenes || []);
      setShotSpec(data.shotSpec || null);
      setCreativeDNA(activeDNA);
      setHasStaleWarning(false);

      stopTimer();
      setIsBusy(false);
      setCurrentStep('storyboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    } catch (err) {
      stopTimer();
      setIsBusy(false);
      setCurrentStep('input');
      setCreationStep(3);
      setErrorMessage(err.message || 'Error occurred while synthesizing master script.');
      return false;
    }
  };

  // 7. Targeted Scene-Level AI Rewriter via /api/creative/rewrite-scene
  const handleApplySceneRewrite = async (instruction) => {
    if (!scenes[rewriteTargetSceneIndex] || !instruction) return;
    setIsRewritingScene(true);
    try {
      const res = await fetch('/api/creative/rewrite-scene', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sceneText: scenes[rewriteTargetSceneIndex],
          sceneIndex: rewriteTargetSceneIndex,
          totalScenes: scenes.length,
          instruction,
          form: buildSessionPayload(),
          characters: `${character1} | ${character2}`,
          setting,
          projectId: activeProjectId,
          creativeGuardrails: userContext.creativeGuardrails || null,
          eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to rewrite scene.');
      }
      if (data.scene) {
        const updated = [...scenes];
        updated[rewriteTargetSceneIndex] = data.scene;
        setScenes(updated);
        if (data.guardrailReport !== undefined) {
          setScriptGuardrailReport(data.guardrailReport);
        }
        if (shotSpec && Array.isArray(shotSpec.shots)) {
          setShotSpec((prev) => {
            if (!prev || !Array.isArray(prev.shots)) return prev;
            return {
              ...prev,
              staticWorld: {
                ...(prev.staticWorld || {}),
                setting,
                characters: [character1, character2].filter(Boolean).join(' | '),
              },
            };
          });
        }
        setIsSceneRewriteOpen(false);
      }
    } catch (err) {
      alert(err.message || 'Scene rewrite error.');
    } finally {
      setIsRewritingScene(false);
    }
  };

  // Auto-trigger options loading based on creativePanel
  useEffect(() => {
    if (creationStep === 4) {
      if (creativePanel === 'direction') loadCreativeDirections();
      else if (creativePanel === 'hook') loadHooks();
      else if (creativePanel === 'plot') loadPlots();
      else if (creativePanel === 'story') loadStoryWorld();
    }
  }, [creationStep, creativePanel]);

  // Auto-sync completed video into projects whenever videoUrl is generated
  useEffect(() => {
    if (!videoUrl) return;
    setUserProjects((prev) => {
      // Dedupe on the video itself; the old "or the active project id" clause blocked new videos
      if (hasProjectForVideo(prev, videoUrl)) return prev;

      const resolvedTitle = userContext.businessName
        ? `${userContext.businessName} - ${userContext.occasion || userContext.selectedGoalId || (userContext.brief ? briefSnippet(userContext.brief, 30) : 'Commercial Film')}`
        : (userContext.brief ? briefSnippet(userContext.brief, 40) : 'Commercial Film');

      // Never the active project id: that may be the previous video's project
      const projectId = renderTargetRef.current.videoUrl === videoUrl ? renderTargetRef.current.id : newProjectId();
      const completedProject = {
        id: projectId,
        businessId: userContext.businessId || null,
        title: resolvedTitle,
        businessName: userContext.businessName || '',
        businessType: userContext.businessType || '',
        town: userContext.town || '',
        language: userContext.language || 'English',
        creativeStyle: userContext.creativeStyle || 'UGC / Creator-style',
        status: 'video_ready',
        videoUrl: videoUrl,
        brief: userContext.brief || '',
        scenes: scenes || [],
        setting: setting || '',
        character1: character1 || '',
        character2: character2 || '',
        stages: {
          directionsList: directionsList || [],
          selectedDirection: selectedDirection || null,
          customDirection: customDirection || '',
          selectedDirectionIndex: typeof selectedDirectionIdx === 'number' ? selectedDirectionIdx : 0,
          hooksList: hooksList || [],
          selectedHook: selectedHook || null,
          storyWorldData: storyWorldData || null,
          generatedScript: generatedScript || null,
          completedStages: ['brief', 'settings', 'idea', 'opening', 'story', 'script', 'video'],
        },
        completedStages: ['brief', 'settings', 'idea', 'opening', 'story', 'script', 'video'],
        brandContext: typeof extractBrandProfile === 'function' ? extractBrandProfile(userContext) : {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = [completedProject, ...prev];
      try {
        localStorage.setItem('clevertize_local_projects', JSON.stringify(updated));
        if (currentUser?.id) {
          localStorage.setItem(`clevertize_local_projects_${currentUser.id}`, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('[projects] localStorage sync warning:', err);
      }

      if (authToken) {
        fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(completedProject),
        }).catch((err) => console.error('[projects] Failed auto-syncing video project:', err));
      }

      return updated;
    });
  }, [videoUrl]);

  // START: POST /api/session -> CHECKPOINT 1 (DIRECTION)
  const handleStartCreativeEngine = async () => {
    if (!userContext.businessName.trim()) {
      setValidationError('Please enter your business or brand name.');
      return;
    }
    if (!userContext.brief.trim() && !userContext.specialty.trim()) {
      setValidationError('Please tell us about your video idea or what your business sells.');
      return;
    }

    setValidationError('');
    setErrorMessage('');
    setQualityFailures([]);
    setActiveCheckpointKey('direction');
    setIsBusy(true);
    startTimer();

    const payload = buildSessionPayload();

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      stopTimer();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to start creative intelligence session.');
      }

      setSessionId(data.sessionId);
      setDirectionData(data.data);
      setSelectedDirectionIdx(0);
      setCheckpointSeconds(data.seconds);
      setApprovedSummary([]);
      setCurrentStep('cp1_direction');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      stopTimer();
      setErrorMessage(err.message || 'Error connecting to Creative Engine.');
    } finally {
      setIsBusy(false);
    }
  };

  // APPROVE CHECKPOINT 1 -> POST /api/session/:id/next -> CHECKPOINT 2 (PLOT)
  const handleApproveDirection = async () => {
    if (!sessionId) return;
    setActiveCheckpointKey('plot');
    setIsBusy(true);
    setErrorMessage('');
    startTimer();

    const chosenTension = directionData?.tensions?.[selectedDirectionIdx]?.owner || 'Approved Direction';
    const festivalTag = directionData?.festival?.use ? ` · ${directionData.festival.name}` : '';

    try {
      const res = await fetch(`/api/session/${sessionId}/next`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          checkpoint: 'direction',
          choice: selectedDirectionIdx,
        }),
      });
      const data = await res.json();
      stopTimer();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to advance to Plot stage.');
      }

      setPlotData(data.data);
      setSelectedPlotIdx(0);
      setCheckpointSeconds(data.seconds);
      setApprovedSummary((prev) => [
        ...prev.filter((item) => item.stage !== 'Direction'),
        { stage: 'Direction', text: chosenTension + festivalTag },
      ]);
      setCurrentStep('cp2_plot');
      setIsChangeOpen(false);
      setChangeNote('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      stopTimer();
      setErrorMessage(err.message || 'Error formulating plot options.');
    } finally {
      setIsBusy(false);
    }
  };

  // APPROVE CHECKPOINT 2 -> POST /api/session/:id/next -> CHECKPOINT 3 (STORY & FORMAT)
  const handleApprovePlot = async () => {
    if (!sessionId) return;
    setActiveCheckpointKey('story');
    setIsBusy(true);
    setErrorMessage('');
    startTimer();

    const chosenPlot = plotData?.plots?.[selectedPlotIdx]?.owner || 'Approved Plot';

    try {
      const res = await fetch(`/api/session/${sessionId}/next`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          checkpoint: 'plot',
          choice: selectedPlotIdx,
        }),
      });
      const data = await res.json();
      stopTimer();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to advance to Story stage.');
      }

      setStoryData(data.data);
      setCheckpointSeconds(data.seconds);
      setApprovedSummary((prev) => [
        ...prev.filter((item) => item.stage !== 'Plot'),
        { stage: 'Plot', text: chosenPlot },
      ]);
      setCurrentStep('cp3_story');
      setIsChangeOpen(false);
      setChangeNote('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      stopTimer();
      setErrorMessage(err.message || 'Error developing story arc.');
    } finally {
      setIsBusy(false);
    }
  };

  // APPROVE CHECKPOINT 3 -> POST /api/session/:id/next -> CHECKPOINT 4 (SCRIPT + QUALITY GATE)
  const handleApproveStory = async () => {
    if (!sessionId) return;
    setActiveCheckpointKey('script');
    setIsBusy(true);
    setErrorMessage('');
    setQualityFailures([]);
    startTimer();

    try {
      const res = await fetch(`/api/session/${sessionId}/next`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          checkpoint: 'story',
        }),
      });
      const data = await res.json();
      stopTimer();

      if (!res.ok || data.error) {
        if (res.status === 422 && data.failures) {
          setQualityFailures(data.failures);
          throw new Error('The script required adjustments against quality guidelines. You can ask for a change below or retry.');
        }
        throw new Error(data.error || 'Failed to generate passing script.');
      }

      const p = data.data;
      setScriptPayloadData(p);
      setCharacter1(p.character1 || '');
      setCharacter2(p.character2 || '');
      setSetting(p.setting || '');
      setScenes(p.scenes || []);
      setActiveSceneIndex(0);
      setCheckpointSeconds(data.seconds);

      const storyTag = `${storyData?.format || 'Film'} · ${userContext.duration || '15s'} · 4 Scenes`;
      setApprovedSummary((prev) => [
        ...prev.filter((item) => item.stage !== 'Story'),
        { stage: 'Story', text: storyTag },
      ]);

      setCurrentStep('storyboard');
      setIsChangeOpen(false);
      setChangeNote('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      stopTimer();
      setErrorMessage(err.message || 'Error running script quality gate.');
    } finally {
      setIsBusy(false);
    }
  };

  // REVISION REQUEST: POST /api/session/:id/change
  const handleSendChangeRequest = async (targetCheckpoint) => {
    if (!sessionId) return;
    const note = changeNote.trim();
    if (!note) {
      setChangeError('Please describe what you would like modified.');
      return;
    }

    setChangeError('');
    setActiveCheckpointKey(targetCheckpoint);
    setIsBusy(true);
    setErrorMessage('');
    startTimer();

    try {
      const res = await fetch(`/api/session/${sessionId}/change`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          checkpoint: targetCheckpoint,
          note,
        }),
      });
      const data = await res.json();
      stopTimer();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to apply creative change.');
      }

      setCheckpointSeconds(data.seconds);
      setIsChangeOpen(false);
      setChangeNote('');

      if (targetCheckpoint === 'direction') {
        setDirectionData(data.data);
        setSelectedDirectionIdx(0);
        setCurrentStep('cp1_direction');
      } else if (targetCheckpoint === 'plot') {
        setPlotData(data.data);
        setSelectedPlotIdx(0);
        setCurrentStep('cp2_plot');
      } else if (targetCheckpoint === 'story') {
        setStoryData(data.data);
        setCurrentStep('cp3_story');
      } else if (targetCheckpoint === 'script') {
        const p = data.data;
        setScriptPayloadData(p);
        setCharacter1(p.character1 || '');
        setCharacter2(p.character2 || '');
        setSetting(p.setting || '');
        setScenes(p.scenes || []);
        setCurrentStep('storyboard');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      stopTimer();
      setErrorMessage(err.message || 'Could not revise stage with requested change.');
    } finally {
      setIsBusy(false);
    }
  };

  /**
   * Safe API Call Wrapper
   * Protects against unhandled HTML error pages (e.g., 502/504 gateway timeouts or 413 payload too large)
   * preventing cryptic "Unexpected token '<', <html> is not valid JSON" parser exceptions.
   */
  const safeApiCall = async (fetchPromise, defaultErrorMsg = 'Failed to dispatch render job.') => {
    const res = await fetchPromise;
    const contentType = res.headers.get('content-type') || '';
    let data = null;
    let rawText = '';

    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (e) {
        // ignore parse error if response is not valid JSON
      }
    }

    if (!data) {
      try {
        rawText = await res.text();
      } catch (e) {
        // ignore text read error
      }
    }

    if (!res.ok) {
      if (data && data.error) {
        throw new Error(data.error);
      }
      if (res.status === 413) {
        throw new Error('Uploaded files are too large. Please use a smaller product photo or logo image (under 5MB).');
      }
      if (res.status === 502 || res.status === 504) {
        throw new Error(`Video production service is busy or timed out (HTTP ${res.status}). Please retry in a few moments.`);
      }
      if (res.status === 404) {
        throw new Error(`API endpoint not found (HTTP 404). Please ensure the backend server is running.`);
      }
      if (rawText && !rawText.includes('<html') && rawText.length < 240) {
        throw new Error(rawText);
      }
      throw new Error(`${defaultErrorMsg} (HTTP ${res.status})`);
    }

    if (!data) {
      if (rawText && rawText.includes('<html')) {
        throw new Error('Received an unexpected HTML page from server instead of JSON. The service may be starting up or restarting.');
      }
      throw new Error(`${defaultErrorMsg} (Malformed response)`);
    }

    return data;
  };

  // FAST SINGLE-CLICK PIPELINE: Brand -> Brief -> Options -> Direct GPU Video Render in ~20s
  const handleGenerateVideo = async (options = { previewOnly: false }) => {
    if (!userContext.businessName.trim()) {
      setValidationError('Please enter your business or brand name.');
      return;
    }
    if (!userContext.brief.trim() && !userContext.specialty.trim() && !userContext.offer.trim()) {
      setValidationError('Please tell us what you want this video to communicate.');
      return;
    }

    setValidationError('');
    setErrorMessage('');
    setQualityFailures([]);
    setIsBusy(true);
    setFastStageIndex(0);
    startTimer();
    setCurrentStep('generating');
    const session = studioSessionRef.current;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const payload = buildSessionPayload();

    try {
      // 1. Run the entire automated Creative Intelligence pipeline
      const pipelineRes = await fetch('/api/pipeline/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const pipeData = await pipelineRes.json();

      if (!pipelineRes.ok || pipeData.error) {
        if (pipelineRes.status === 422 && pipeData.failures) {
          setQualityFailures(pipeData.failures);
        }
        throw new Error(pipeData.error || 'Failed to complete creative intelligence generation.');
      }

      setSessionId(pipeData.sessionId);
      setScriptPayloadData(pipeData.script || pipeData);
      setCharacter1(pipeData.character1 || '');
      setCharacter2(pipeData.character2 || '');
      setSetting(pipeData.setting || '');
      setScenes(pipeData.scenes || []);
      setShotSpec(pipeData.shotSpec || null);

      if (options.previewOnly) {
        stopTimer();
        setIsBusy(false);
        setCurrentStep('storyboard');
        return;
      }

      // 2. Transition straight to video GPU rendering with compiled Shot Specification!
      setFastStageIndex(3); // Generating your video...
      const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
        ? userContext.customBusinessType.trim()
        : userContext.businessType;

      const runPayload = {
        scenes: (pipeData.scenes || []).map((s) => s.trim()).filter(Boolean),
        character1: (pipeData.character1 || '').trim(),
        character2: (pipeData.character2 || '').trim(),
        setting: (pipeData.setting || '').trim(),
        duration: userContext.duration || '15s',
        platform: userContext.platform || 'Instagram Reels / 9:16',
        product: pipeData.product || userContext.specialty || userContext.offer || userContext.brief || bType || 'featured product',
        productName: pipeData.productName || pipeData.product || userContext.specialty || bType || 'featured product',
        businessType: bType,
        businessName: userContext.businessName.trim(),
        specialty: userContext.specialty || '',
        brief: userContext.brief || '',
        productPhoto: userContext.productPhoto ? { mime: userContext.productPhoto.mime, data: userContext.productPhoto.data } : null,
        // the logo chosen for this video (prefilled from the profile) — decides logo vs no-logo flow
        logo: videoLogoPayload(userContext),
        projectId: activeProjectId,
        creativeGuardrails: overrideParams?.creativeGuardrails || userContext.creativeGuardrails || null,
        shotSpec: pipeData.shotSpec || null,
        aspectRatio: aspectRatioOf(userContext),
      };

      const runData = await safeApiCall(fetch('/api/run', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(runPayload),
      }), 'Failed to dispatch render job to Magnific.');

      // 3. Poll Magnific status
      await pollRenderStatus(runData.runId, { session });
    } catch (err) {
      if (studioSessionRef.current !== session) return; // the studio moved on: don't show this error there
      stopTimer();
      setIsBusy(false);
      setCurrentStep('input');
      setErrorMessage(err.message || 'Error occurred while generating video.');
    }
  };

  // STAGE 2 APPROVE SCRIPT -> POST /api/session/:id/approve & POST /api/run -> STAGE 3 RENDER
  const handleApproveScriptAndRender = async () => {
    if (!scenes.length) {
      alert('No scenes found in the storyboard to render.');
      return;
    }

    setErrorMessage('');
    setIsRendering(true);
    setCurrentStep('render');
    setRenderStatusText('Saving script record and staging GPU render pipeline…');
    startTimer();
    const session = studioSessionRef.current;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // 1. Record approved script to store.js
      if (sessionId) {
        await fetch(`/api/session/${sessionId}/approve`, {
          method: 'POST',
          headers: getAuthHeaders(),
        }).catch((e) => console.warn('Approve save call failed:', e));
      }

      const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
        ? userContext.customBusinessType.trim()
        : userContext.businessType;

      // 2. Start Magnific Run with compiled shot specification & consistent characters
      const runPayload = {
        scenes: scenes.map((s) => s.trim()).filter(Boolean),
        character1: character1.trim(),
        character2: character2.trim(),
        setting: setting.trim(),
        duration: userContext.duration || '15s',
        platform: userContext.platform || 'Instagram Reels / 9:16',
        product: userContext.specialty || userContext.offer || userContext.brief || bType || 'featured product',
        productName: userContext.specialty || bType || 'featured product',
        businessType: bType,
        businessName: userContext.businessName.trim(),
        specialty: userContext.specialty || '',
        brief: userContext.brief || '',
        productPhoto: userContext.productPhoto ? { mime: userContext.productPhoto.mime, data: userContext.productPhoto.data } : null,
        // the logo chosen for this video (prefilled from the profile) — decides logo vs no-logo flow
        logo: videoLogoPayload(userContext),
        projectId: activeProjectId,
        creativeGuardrails: overrideParams?.creativeGuardrails || userContext.creativeGuardrails || null,
        shotSpec: shotSpec ? {
          ...shotSpec,
          staticWorld: {
            ...(shotSpec.staticWorld || {}),
            setting: effectiveSetting,
            characters: [effectiveChar1, effectiveChar2].filter(Boolean).join(' | '),
          },
        } : null,
        aspectRatio: aspectRatioOf(userContext),
      };

      const data = await safeApiCall(fetch('/api/run', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(runPayload),
      }), 'Failed to dispatch render job to Magnific.');

      setRenderStatusText('Rendering neural video frames…');
      await pollRenderStatus(data.runId, { session });
    } catch (err) {
      if (studioSessionRef.current !== session) return;
      stopTimer();
      setIsRendering(false);
      setErrorMessage(err.message || 'Error occurred while initiating video render.');
    }
  };

  // ---- Drafts: autosave the video being made, so a closed tab, dropped connection or logout loses nothing ----
  const DRAFT_SAVE_DEBOUNCE_MS = 1500;

  // The draft's project id: the render's project while one runs, else the open project if it has no video
  // yet, else one fresh id for this film
  const draftProjectId = () => {
    if (draftRenderRef.current && draftRenderRef.current.projectId) return draftRenderRef.current.projectId;
    if (activeProjectId && !(userProjects.find((p) => p.id === activeProjectId) || {}).videoUrl) return activeProjectId;
    if (!draftIdRef.current) draftIdRef.current = newProjectId();
    return draftIdRef.current;
  };

  // Rebuilt every render, so a debounced save always sends the latest state. Null = nothing to save.
  const buildCurrentDraftRef = useRef(null);
  buildCurrentDraftRef.current = (allowOutsideStudio = false) => {
    if (!currentUser || !authToken || (!allowOutsideStudio && activeAppView !== 'studio')) return null;
    if (videoUrl && !draftRenderRef.current) return null; // a finished video is a project, not a draft
    const base = {
      id: draftProjectId(),
      businessId: userContext.businessId || null,
      businessName: userContext.businessName || '',
      businessType: userContext.businessType || '',
      town: userContext.town || '',
      brandContext: extractBrandProfile(userContext),
      render: draftRenderRef.current,
    };
    if (studioMode === 'simple') {
      const simple = simpleDraftRef.current;
      if (!simple || (!String(simple.brief || '').trim() && !(simple.packages || []).length)) return null;
      return buildDraftProject({ ...base, studio: 'simple', simple });
    }
    if (!String(userContext.brief || '').trim() && !(scenes || []).length) return null;
    return buildDraftProject({
      ...base,
      studio: 'guided',
      guided: {
        currentStage: studioStage,
        completedStages,
        context: {
          brief: userContext.brief,
          specialty: userContext.specialty,
          offer: userContext.offer,
          occasion: userContext.occasion,
          selectedGoalId: userContext.selectedGoalId,
          language: userContext.language,
          creativeStyle: userContext.creativeStyle,
          platform: userContext.platform,
          aspectRatio: userContext.aspectRatio,
          dimension: userContext.dimension,
          duration: userContext.duration,
          targetDuration: userContext.targetDuration,
          productPhoto: userContext.productPhoto,
          videoLogo: userContext.videoLogo,
          creativeGuardrails: userContext.creativeGuardrails || null,
          eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        },
        stages: {
          directionsList: directionsList || [],
          selectedDirection: selectedDirection || null,
          customDirection: customDirection || '',
          selectedDirectionIndex: typeof selectedDirectionIdx === 'number' ? selectedDirectionIdx : 0,
          hooksList: hooksList || [],
          selectedHook: selectedHook || null,
          storyWorldData: storyWorldData || null,
          generatedScript: generatedScript || null,
          completedStages: completedStages || [],
          shotSpec: shotSpec || null,
          aiUnderstanding: aiUnderstanding || null,
          creativeGuardrails: userContext.creativeGuardrails || null,
          eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        },
        explicitChoices,
        appCreativeDNA: {
          ...creativeDNA,
          aiUnderstanding: aiUnderstanding || null,
          creativeGuardrails: userContext.creativeGuardrails || null,
          eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        },
        aiUnderstanding: aiUnderstanding || null,
        creativeGuardrails: userContext.creativeGuardrails || null,
        eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
        guardrailDraftInputs: {
          doText: String(guardrailDraftInputs?.doText || ''),
          dontText: String(guardrailDraftInputs?.dontText || ''),
        },
        scenes: scenes || [],
        character1,
        character2,
        setting,
        shotSpec,
      },
    });
  };

  // Save the draft now. Saves never overlap: one arriving mid-save runs again once that save finishes.
  const persistDraft = async (allowOutsideStudio = false) => {
    if (draftSavePromiseRef.current) {
      draftSavePendingRef.current = true;
      const currentResult = await draftSavePromiseRef.current;
      if (!draftSavePendingRef.current) return currentResult;
      draftSavePendingRef.current = false;
      return persistDraft(allowOutsideStudio);
    }
    const payload = buildCurrentDraftRef.current && buildCurrentDraftRef.current(allowOutsideStudio);
    if (!payload) {
      if (!(videoUrl && !draftRenderRef.current)) {
        setDraftStatus({ state: 'idle', isNewDraft: false, detail: '' });
      }
      return !allowOutsideStudio || Boolean(videoUrl && !draftRenderRef.current);
    }
    const isNewDraft = !persistedDraftIdsRef.current.has(payload.id);
    const epoch = draftEpochRef.current;
    clearTimeout(draftRetryTimerRef.current);
    draftRetryTimerRef.current = null;
    const inferTriggerDetail = () => {
      if (draftTriggerDetailRef.current) return draftTriggerDetailRef.current;
      if (studioMode === 'simple') {
        return (simpleDraftRef.current?.packages || []).length > 0
          ? 'Scripts generated'
          : 'Brief entered';
      }
      return (scenes || []).length > 0 ? 'Script imported' : 'Brief entered';
    };
    const triggerDetail = isNewDraft ? inferTriggerDetail() : '';
    setDraftStatus({ state: 'saving', isNewDraft, detail: triggerDetail });

    // This draft is the project being worked on: manual saves and the next render reuse its id
    setActiveProjectId(payload.id);
    currentSavingProjectIdRef.current = payload.id;
    const local = { ...payload, updatedAt: new Date().toISOString() };
    const upsert = (prev, item) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx >= 0 && prev[idx].videoUrl) return prev; // never turn a finished video back into a draft
      return idx >= 0 ? prev.map((p, i) => (i === idx ? { ...p, ...item } : p)) : [{ ...item, createdAt: item.updatedAt }, ...prev];
    };
    setUserProjects((prev) => upsert(prev, local));
    const savePromise = (async () => {
      let succeeded = false;
      try {
        const res = await fetch('/api/projects', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || !data.project) throw new Error(data?.error || 'Project save failed. Please try again.');
        if (draftEpochRef.current !== epoch) return false;
        persistedDraftIdsRef.current.add(payload.id);
        if (data.project.id) persistedDraftIdsRef.current.add(data.project.id);
        setUserProjects((prev) => upsert(prev, data.project));
        succeeded = true;
        draftRetryCountRef.current = 0;
        draftTriggerDetailRef.current = '';
        setDraftStatus({
          state: 'saved',
          isNewDraft,
          detail: isNewDraft ? `${triggerDetail} — new draft created` : '',
        });
      } catch (err) {
        if (draftEpochRef.current !== epoch) return false;
        console.warn('[draft] autosave failed:', err.message);
        const canAutoRetry = draftRetryCountRef.current < 2 && (typeof navigator === 'undefined' || navigator.onLine !== false);
        if (canAutoRetry) {
          draftRetryCountRef.current += 1;
          const retryDelayMs = 4000 * draftRetryCountRef.current;
          setDraftStatus({ state: 'error', isNewDraft, detail: 'retrying' });
          draftRetryTimerRef.current = setTimeout(() => {
            draftRetryTimerRef.current = null;
            if (draftEpochRef.current === epoch) persistDraft(allowOutsideStudio);
          }, retryDelayMs);
        } else {
          setDraftStatus({ state: 'error', isNewDraft, detail: 'manual' });
        }
      } finally {
        draftSavePromiseRef.current = null;
      }
      return succeeded;
    })();
    draftSavePromiseRef.current = savePromise;
    return savePromise;
  };

  const handleRetryDraftSave = () => {
    clearTimeout(draftRetryTimerRef.current);
    draftRetryTimerRef.current = null;
    draftRetryCountRef.current = 0;
    persistDraft(false);
  };

  // Debounced autosave for edits; flush=true saves at once (a stage was completed)
  const scheduleDraftSave = (flush = false) => {
    if (Date.now() < suppressAutosaveUntilRef.current) return;
    clearTimeout(draftRetryTimerRef.current);
    draftRetryTimerRef.current = null;
    draftRetryCountRef.current = 0;
    const hasDraftContent = Boolean(
      studioMode === 'simple'
        ? (simpleDraftRef.current && (String(simpleDraftRef.current.brief || '').trim() || (simpleDraftRef.current.packages || []).length))
        : (String(userContext.brief || '').trim() || (scenes || []).length)
    );
    if (currentUser && authToken && activeAppView === 'studio' && !(videoUrl && !draftRenderRef.current)) {
      if (hasDraftContent) {
        const currentId = (draftRenderRef.current && draftRenderRef.current.projectId) || activeProjectId || draftIdRef.current;
        const isPendingNew = !currentId || !persistedDraftIdsRef.current.has(currentId);
        const pendingDetail = draftTriggerDetailRef.current || (isPendingNew
          ? (studioMode === 'simple'
              ? ((simpleDraftRef.current?.packages || []).length > 0 ? 'Scripts generated' : 'Brief entered')
              : ((scenes || []).length > 0 ? 'Script imported' : 'Brief entered'))
          : '');
        setDraftStatus({ state: 'saving', isNewDraft: isPendingNew, detail: pendingDetail });
      } else if (!activeProjectId || !persistedDraftIdsRef.current.has(activeProjectId)) {
        setDraftStatus({ state: 'idle', isNewDraft: false, detail: '' });
      }
    }
    clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = setTimeout(() => {
      draftSaveTimerRef.current = null;
      persistDraft();
    }, flush ? 0 : DRAFT_SAVE_DEBOUNCE_MS);
  };

  // Save a pending edit right away (before logout)
  const flushDraftSave = async () => {
    if (!draftSaveTimerRef.current) return;
    clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = null;
    await persistDraft();
  };

  // Start the next film without the current draft's id, render or Simple Studio state
  const forgetDraft = () => {
    clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = null;
    clearTimeout(draftRetryTimerRef.current);
    draftRetryTimerRef.current = null;
    draftRetryCountRef.current = 0;
    draftEpochRef.current += 1;
    draftIdRef.current = null;
    draftRenderRef.current = null;
    simpleDraftRef.current = null;
    draftTriggerDetailRef.current = '';
    lastUnderstandingCorrectionsRef.current = '';
    setDraftStatus({ state: 'idle', isNewDraft: false, detail: '' });
    setSimpleResumeDraft(null);
    setSimpleStudioKey((k) => k + 1);
  };

  // Simple Studio reports its state here; moving to another step saves at once
  const handleSimpleDraftChange = (state, { flush = false } = {}) => {
    const prevStep = simpleDraftRef.current && simpleDraftRef.current.step;
    simpleDraftRef.current = state;
    scheduleDraftSave(flush || (prevStep != null && prevStep !== state.step));
  };

  // Guided Studio: save when a stage changes, debounced while editing within a stage
  const lastDraftStageRef = useRef(studioStage);
  useEffect(() => {
    if (studioMode === 'simple') return;
    const stageChanged = lastDraftStageRef.current !== studioStage;
    lastDraftStageRef.current = studioStage;
    scheduleDraftSave(stageChanged);
  }, [studioMode, activeAppView, studioStage, completedStages, userContext.brief, userContext.creativeGuardrails, userContext.eventContext, userContext.productPhoto, guardrailDraftInputs, userContext.language, userContext.creativeStyle, userContext.aspectRatio, userContext.dimension, userContext.targetDuration, userContext.duration, userContext.videoLogo, aiUnderstanding, directionsList, selectedDirection, hooksList, selectedHook, storyWorldData, generatedScript, scenes, character1, character2, setting, shotSpec]);

  // Closing the tab: send a pending edit if it fits in a keepalive request (product photos usually don't)
  useEffect(() => {
    const onPageHide = () => {
      if (!draftSaveTimerRef.current || !authToken) return;
      const payload = buildCurrentDraftRef.current && buildCurrentDraftRef.current();
      if (!payload) return;
      const body = JSON.stringify(payload);
      if (body.length > 60000) return;
      try {
        fetch('/api/projects', { method: 'POST', headers: getAuthHeaders(), body, keepalive: true });
      } catch {}
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [authToken]);

  // Reopened a draft whose render was still running: poll that same run — never start (and pay for) a new one
  const resumeRender = (runId, projectId, startedAt) => {
    draftRenderRef.current = { runId, projectId, startedAt: startedAt || new Date().toISOString() };
    renderTargetRef.current = { id: projectId, videoUrl: null };
    activeVideoUrlRef.current = '';
    setErrorMessage('');
    setIsRendering(true);
    setRenderStatusText('Picking up your video render where it left off…');
    startTimer();
    pollRenderStatus(runId, { projectId, immediate: true });
  };

  // Poll /api/status/:runId
  // `session` is the studio session the render was started in. If the user starts a new film or switches
  // business while it runs, the render is detached: it keeps polling and still saves its video to its own
  // project (with the business, brief and scenes it was started with), but no longer touches the studio.
  const pollRenderStatus = async (runId, { projectId = null, immediate = false, session = studioSessionRef.current } = {}) => {
    const isLive = () => studioSessionRef.current === session;
    // A new render gets a new project — unless the open project has no video yet (a draft, or a saved
    // script), in which case this render is its first video. A resumed render passes its draft's id.
    const renderProjectId = projectId || projectIdForRender(activeProjectId, userProjects);
    if (isLive()) {
      activeRunIdRef.current = runId;
      renderTargetRef.current = { id: renderProjectId, videoUrl: null };
      currentSavingProjectIdRef.current = renderProjectId; // a manual save during the render updates the same project
      // Record the run in the draft at once: if the tab closes now, reopening the draft polls this run
      const sameRun = draftRenderRef.current && draftRenderRef.current.runId === runId;
      draftRenderRef.current = { runId, projectId: renderProjectId, startedAt: sameRun ? draftRenderRef.current.startedAt : new Date().toISOString() };
      scheduleDraftSave(true);
    }
    const maxAttempts = 160;
    for (let i = 1; i <= maxAttempts; i++) {
      // a resumed render may already be finished — check straight away
      if (!(immediate && i === 1)) await new Promise((r) => setTimeout(r, 15000));
      // Abort immediately if a newer render job in this same session superseded this polling loop.
      // A detached render keeps going: nothing else will save its video.
      if (isLive() && activeRunIdRef.current !== runId) {
        return;
      }
      try {
        const res = await fetch(`/api/status/${encodeURIComponent(runId)}`, { headers: getAuthHeaders() });
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          continue; // Gateway response / proxy page during polling, keep waiting
        }
        const data = await res.json().catch(() => null);
        if (!data || data.error) continue;

        if (isLive() && activeRunIdRef.current !== runId) {
          return;
        }

        if (data.videoUrl) {
          const live = isLive();
          if (live) {
            stopTimer();
            setErrorMessage('');
            setVideoUrl(data.videoUrl);
            activeVideoUrlRef.current = data.videoUrl;
            setIsRendering(false);
            setIsBusy(false);
            setFastStageIndex(4);
            setCurrentStep('render');
          }

          // Auto-save & sync video into My Projects library
          const resolvedTitle = userContext.businessName
            ? `${userContext.businessName} - ${userContext.occasion || userContext.selectedGoalId || (userContext.brief ? briefSnippet(userContext.brief, 30) : 'Commercial Film')}`
            : (userContext.brief ? briefSnippet(userContext.brief, 40) : 'Commercial Film');

          const projectId = renderProjectId;
          if (live) {
            renderTargetRef.current = { id: projectId, videoUrl: data.videoUrl };
            // The draft becomes a finished video (status video_ready, same id): stop autosaving it
            clearTimeout(draftSaveTimerRef.current);
            draftSaveTimerRef.current = null;
            draftRenderRef.current = null;
            draftIdRef.current = null;
          }
          const completedProject = {
            id: projectId,
            businessId: userContext.businessId || null,
            title: resolvedTitle,
            businessName: userContext.businessName || '',
            businessType: userContext.businessType || '',
            town: userContext.town || '',
            language: userContext.language || 'English',
            creativeStyle: userContext.creativeStyle || 'UGC / Creator-style',
            status: 'video_ready',
            videoUrl: data.videoUrl,
            brief: userContext.brief || '',
            productionSettings: getCurrentProductionSettings(),
            creativeGuardrails: userContext.creativeGuardrails || null,
            eventContext: hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null,
            aiUnderstanding: aiUnderstanding || null,
            parentProjectId: activeProjectId && activeProjectId !== projectId ? activeProjectId : (creativeDNA?.parentProjectId || null),
            scenes: scenes || [],
            setting: setting || '',
            character1: character1 || '',
            character2: character2 || '',
            stages: {
              directionsList: directionsList || [],
              selectedDirection: selectedDirection || null,
              customDirection: customDirection || '',
              selectedDirectionIndex: typeof selectedDirectionIdx === 'number' ? selectedDirectionIdx : 0,
              hooksList: hooksList || [],
              selectedHook: selectedHook || null,
              storyWorldData: storyWorldData || null,
              generatedScript: generatedScript || null,
              completedStages: ['brief', 'settings', 'understanding', 'idea', 'opening', 'script', 'video'],
            },
            completedStages: ['brief', 'settings', 'understanding', 'idea', 'opening', 'script', 'video'],
            brandContext: typeof extractBrandProfile === 'function' ? extractBrandProfile(userContext) : {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          if (live) {
            // From here on, edits and re-saves of this video update its own project
            setActiveProjectId(projectId);
            currentSavingProjectIdRef.current = projectId;
            setIsCurrentProjectSaved(true);
          } else {
            setToastMessage(`Your ${completedProject.businessName || 'earlier'} video is ready — it's saved in My Projects.`);
            setTimeout(() => setToastMessage(''), 5000);
          }

          // Instantly add to My Projects in state & localStorage so the sidebar counter updates immediately
          setUserProjects((prev) => {
            const idx = prev.findIndex((p) => p.id === projectId || (p.videoUrl && p.videoUrl === data.videoUrl));
            let next;
            if (idx >= 0) {
              next = [...prev];
              next[idx] = { ...next[idx], ...completedProject };
            } else {
              next = [completedProject, ...prev];
            }
            try {
              localStorage.setItem('clevertize_local_projects', JSON.stringify(next));
              if (currentUser?.id) {
                localStorage.setItem(`clevertize_local_projects_${currentUser.id}`, JSON.stringify(next));
              }
            } catch (err) {
              console.warn('[projects] localStorage sync warning:', err);
            }
            return next;
          });

          // Persist directly to database for the logged-in user
          if (currentUser && authToken) {
            fetch('/api/projects', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify(completedProject),
            })
              .then((res) => (res.ok ? res.json() : null))
              .then((savedData) => {
                if (savedData?.project) {
                  setUserProjects((prev) => {
                    const idx = prev.findIndex((p) => p.id === savedData.project.id || p.id === projectId);
                    if (idx >= 0) {
                      const next = [...prev];
                      next[idx] = savedData.project;
                      return next;
                    }
                    return [savedData.project, ...prev];
                  });
                  if (isLive()) setActiveProjectId(savedData.project.id);
                }
              })
              .catch((err) => console.error('Failed to auto-save completed video to user projects:', err));
          }

          return;
        }

        if (data.failed) {
          if (!isLive()) return; // a detached render failed: its draft still lets the user retry from My Projects
          // If a video is already rendered and ready, never show failure from a stale/secondary run
          if (activeVideoUrlRef.current || videoUrl) {
            stopTimer();
            setIsRendering(false);
            setIsBusy(false);
            return;
          }
          stopTimer();
          setIsRendering(false);
          setIsBusy(false);
          setCurrentStep('input');
          const detail = data.error || (data.status === 'completed_with_errors' ? 'The Magnific workflow ran into internal generation errors (such as missing/low-resolution images, node timeout, or content filters). Please check your product photo or try re-generating.' : `Rendering failed: ${data.status}`);
          setErrorMessage(detail);
          // The run is over: the draft forgets it, so reopening the draft lets the user render again
          draftRenderRef.current = null;
          scheduleDraftSave(true);
          return;
        }

        const niceStatus = data.status && !/run|process|pending|queue|unknown/i.test(data.status)
          ? data.status
          : 'Synthesizing frames & audio in neural pipeline…';
        if (isLive()) setRenderStatusText(niceStatus);
      } catch (pollErr) {
        // Keep waiting despite transient network drops
      }
    }
    // Polling attempts exhausted:
    // If run was superseded or video was already generated successfully, never show timeout error!
    if (!isLive() || activeRunIdRef.current !== runId) {
      return;
    }
    if (activeVideoUrlRef.current || videoUrl) {
      stopTimer();
      setIsRendering(false);
      setIsBusy(false);
      return;
    }
    stopTimer();
    setIsRendering(false);
    setIsBusy(false);
    setCurrentStep('input');
    setErrorMessage('Render taking longer than expected. Please verify your Magnific workspace.');
  };

  // Video Share Action
  const handleShareVideo = async () => {
    if (!videoUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userContext.businessName || 'Clevertize'} Commercial Video`,
          text: `Watch our new ad film created on Clevertize!`,
          url: videoUrl,
        });
        setShareStatus('Shared successfully!');
        setTimeout(() => setShareStatus(''), 3000);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(videoUrl);
      setShareStatus('Video link copied to clipboard!');
      setTimeout(() => setShareStatus(''), 3000);
    } catch {
      setShareStatus('Video link ready to copy.');
      setTimeout(() => setShareStatus(''), 3000);
    }
  };

  // Is there a film in progress that starting over would clear? (Guided or Simple Studio, or a running job)
  const hasActiveFilmWork = () => {
    const simple = simpleDraftRef.current;
    return Boolean(
      (scenes && scenes.length > 0) ||
      generatedScript ||
      videoUrl ||
      isRendering ||
      isBusy ||
      (userContext.brief && userContext.brief.trim().length > 0) ||
      ((userContext.creativeGuardrails?.dos?.length || 0) > 0 || (userContext.creativeGuardrails?.donts?.length || 0) > 0) ||
      (simple && (String(simple.brief || '').trim() || (simple.packages || []).length || (simple.creativeGuardrails?.dos?.length || 0) > 0 || (simple.creativeGuardrails?.donts?.length || 0) > 0)) ||
      (studioStage !== 'brief' && studioStage !== 'entry' && completedStages && completedStages.length > 0)
    );
  };

  // Trigger New Film Flow: Open in-app confirmation modal (or execute if bypassed)
  const handleStartNewProject = (bypassConfirm = false) => {
    setPendingBusinessSwitch(null);
    setNewFilmAction('new');
    setNewFilmSaveError('');
    if (bypassConfirm === true || !hasActiveFilmWork()) {
      handleExecuteNewProject(false);
      return;
    }
    setIsNewFilmConfirmOpen(true);
  };

  // Switching business starts a new film for that business — after asking, if a film is in progress
  const handleSelectBusiness = (biz) => {
    if (!biz) return;
    if (biz.id && biz.id === userContext.businessId) return; // already the active business
    if (hasActiveFilmWork()) {
      setNewFilmAction('new');
      setPendingBusinessSwitch(biz);
      setIsNewFilmConfirmOpen(true);
      return;
    }
    handleExecuteNewProject(false, { business: biz });
  };

  const handleRestartFilm = () => {
    setPendingBusinessSwitch(null);
    setNewFilmAction('restart');
    setNewFilmSaveError('');
    if (!hasActiveFilmWork()) {
      handleExecuteNewProject(false, { destination: 'restart' });
      return;
    }
    setIsNewFilmConfirmOpen(true);
  };

  const handleCancelNewFilm = () => {
    if (isSavingNewFilm) return;
    setIsNewFilmConfirmOpen(false);
    setPendingBusinessSwitch(null);
  };

  const handleConfirmNewFilm = async () => {
    if (isSavingNewFilm) return;
    setIsSavingNewFilm(true);
    setNewFilmSaveError('');
    try {
      const activeWork = hasActiveFilmWork();
      const alreadyFinished = Boolean(videoUrl && !draftRenderRef.current);
      if (activeWork && !alreadyFinished) {
        if (draftSaveTimerRef.current) {
          clearTimeout(draftSaveTimerRef.current);
          draftSaveTimerRef.current = null;
        }
        const saved = await persistDraft(true);
        if (!saved) throw new Error('Your project could not be saved. Please sign in and try again.');
      }
      if (pendingBusinessSwitch) handleExecuteNewProject(false, { business: pendingBusinessSwitch });
      else handleExecuteNewProject(false, { destination: newFilmAction === 'restart' ? 'restart' : 'hub' });
    } catch (err) {
      setNewFilmSaveError(err?.message || 'Your project could not be saved. Please try again.');
    } finally {
      setIsSavingNewFilm(false);
    }
  };

  // Start a fresh film. With `business`, the fresh film is for that business (a business switch).
  const handleExecuteNewProject = (clearBrand = false, { business = null, destination = 'hub' } = {}) => {
    try {
      setIsNewFilmConfirmOpen(false);
      setPendingBusinessSwitch(null);
      setBrandResetKey((prev) => prev + 1);

      // Anything still running (a render, a script request) belongs to the film being left: detach it so it
      // finishes into its own project instead of this new one.
      studioSessionRef.current += 1;
      activeRunIdRef.current = null;
      activeVideoUrlRef.current = '';
      renderTargetRef.current = { id: null, videoUrl: null };
      stopTimer();

      // Reset studio centralized state via atomic action
      studioDispatch({
        type: StudioActionTypes.RESET_STUDIO,
        payload: { initialStage: 'business', preserveBrand: !clearBrand },
      });

      // Reset film-specific explicit choices & creative pipeline
      setExplicitChoices({
        style: null,
        language: null,
        platform: null,
        duration: null,
        idea: null,
        opening: null,
      });
      setDirectionsList([]);
      setSelectedDirection(null);
      setCustomDirection('');
      setHooksList([]);
      if (loadedHooksDirectionKeyRef) loadedHooksDirectionKeyRef.current = '';
      setSelectedHook(null);
      setCustomHook('');
      setPlotsList([]);
      setSelectedPlot(null);
      setCustomPlot('');
      setStoryWorldData(null);
      setConstraintsList([]);
      setAvoidList([]);
      setGeneratedScript(null);
      setCreativeDNA({ direction: null, hook: null, plot: null, story: null });
      setAiUnderstanding(null);
      setIsAnalyzingBrief(false);
      setUnderstandingError('');
      setScriptGuardrailReport(null);

      setSessionId(null);
      setActiveProjectId(null);
      currentSavingProjectIdRef.current = null;
      isSavingProjectRef.current = false;
      setIsCurrentProjectSaved(false);
      forgetDraft();
      setDirectionData(null);
      setPlotData(null);
      setStoryData(null);
      setScriptPayloadData(null);
      setScenes([]);
      setShotSpec(null);
      setVideoUrl('');
      setApprovedSummary([]);
      setErrorMessage('');
      setValidationError('');
      setQualityFailures([]);
      setIsRendering(false);
      setIsBusy(false);
      setIsEditingBrandInline(false);
      setHasStaleWarning(false);

      // Reset film-specific inputs while strictly preserving brand profile (or clearing if requested).
      // A business switch loads the new business's profile in place of the current one.
      setUserContext((current) => {
        const prev = business ? { ...current, ...businessContextOf(business, current) } : current;
        const brand = clearBrand ? {} : (typeof extractBrandProfile === 'function' ? extractBrandProfile(prev) : {});
        const next = {
          ...prev,
          ...(clearBrand ? { businessName: '', businessType: 'Retail Store', town: '', websiteUrl: '', logo: null } : brand),
          brief: '',
          productPhoto: null,
          videoLogo: undefined,
          leadCharacter: '',
          supportingCharacter: '',
          environment: '',
          selectedGoalId: 'offer',
          creativeStyle: 'UGC / Creator-style',
          language: 'English',
          platform: 'Instagram Reels / 9:16',
          duration: '15s',
          specialty: '',
          offer: '',
          creativeGuardrails: null,
          eventContext: null,
        };
        try {
          localStorage.setItem('clevertize_user_context', JSON.stringify(clearBrand ? {} : brand));
        } catch (err) {
          // ignore
        }
        return next;
      });

      setCompletedStages([]);
      setIsScriptModalOpen(false);
      setIsUrlModalOpen(false);
      setModeSelectionContext(null);
      setPendingModeSwitch(null);
      setGuardrailDraftInputs({ doText: '', dontText: '' });
      setBriefOptionalExpanded({ inspiration: false, audience: false, instructions: false, occasion: false, productPhoto: false });
      setScriptSaveError('');
      setHasSelectedModeForProject(studioMode === 'simple' && !business && (destination === 'brief' || destination === 'restart'));
      if (!business && destination === 'brief') {
        setSelectedCreationEntry('brief');
        setStudioStage('brief');
        setActiveAppView('studio');
      } else if (!business && destination === 'restart') {
        setSelectedCreationEntry((entry) => entry || 'brief');
        const restartEntry = selectedCreationEntry || 'brief';
        if (restartEntry === 'brief') {
          setStudioStage('brief');
          setActiveAppView('studio');
        } else {
          setStudioStage('entry');
          setActiveAppView('hub');
          if (restartEntry === 'script') setIsScriptModalOpen(true);
          if (restartEntry === 'url') setIsUrlModalOpen(true);
        }
      } else {
        setSelectedCreationEntry(null);
        setStudioStage('entry');
        if (!business) setActiveAppView('hub'); // New Film Project always opens the three-option entry hub
      }
      setCurrentStep('input');
      setCreationStep(1);
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }

      setToastMessage(business
        ? `Switched active business to ${business.name || business.businessName}`
        : 'Fresh film project started');
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      console.error('[NewFilm] Error in handleExecuteNewProject:', err);
      setIsNewFilmConfirmOpen(false);
      setStudioStage('brief');
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    }
  };

  // Tertiary post-generation action: start a genuinely fresh project with an empty brief
  const handleStartNewBrief = () => {
    handleExecuteNewProject(false, { destination: 'brief' });
  };

  // Mode selection completion (Brief / URL / Existing Script -> Simple or Director Mode)
  const handleCompleteModeSelection = (chosenMode) => {
    const targetMode = chosenMode === 'simple' ? 'simple' : 'advanced';
    const ctx = modeSelectionContext || { source: 'brief' };

    persistOnboardingPatch((prev) => ({
      ...prev,
      preferredMode: targetMode,
      modeChosenCount: (prev.modeChosenCount || 0) + 1,
    }));

    if (ctx.source === 'script' && ctx.scriptPayload) {
      applyImportedScriptPayload(ctx.scriptPayload, targetMode);
      return;
    }

    setModeSelectionContext(null);
    setHasSelectedModeForProject(true);
    handleSetStudioMode(targetMode);

    if (targetMode === 'simple') {
      const transferred = transferDirectorToSimple({
        userContext,
        aiUnderstanding,
        existingSimpleDraft: simpleDraftRef.current,
        guardrailDraftInputs,
      });
      if (transferred.guardrailDraftInputs) setGuardrailDraftInputs(transferred.guardrailDraftInputs);
      setSimpleResumeDraft(transferred.simpleDraft);
      setSimpleStudioKey((k) => k + 1);
      setActiveAppView('studio');
      handleBehaviorEvent('simpleRunsCount');
    } else {
      markStageComplete('brief');
      setStudioStage('settings');
      setActiveAppView('studio');
      handleBehaviorEvent('directorRunsCount');
    }

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  // Bidirectional persistent mode switching (Desktop topbar & Mobile header/drawer)
  const executeModeSwitch = (targetMode) => {
    const cleanTarget = targetMode === 'simple' ? 'simple' : 'advanced';
    if (cleanTarget === studioMode) return;

    if (activeAppView !== 'studio') {
      handleSetStudioMode(cleanTarget);
      persistOnboardingPatch({ preferredMode: cleanTarget });
      return;
    }

    const hasDirectorDirectionOrHook = Boolean(
      selectedDirection || customDirection || selectedHook || customHook || (directionsList || []).length || (hooksList || []).length
    );
    const hasDirectorScenes = Boolean((scenes || []).length || generatedScript);

    if (cleanTarget === 'advanced') {
      const transferred = transferSimpleToDirector({
        simpleState: simpleDraftRef.current,
        currentUserContext: userContext,
        currentExplicitChoices: explicitChoices,
        currentAiUnderstanding: aiUnderstanding,
        guardrailDraftInputs,
      });
      setUserContext(transferred.userContext);
      setExplicitChoices(transferred.explicitChoices);
      if (transferred.guardrailDraftInputs) setGuardrailDraftInputs(transferred.guardrailDraftInputs);
      if (transferred.aiUnderstanding) setAiUnderstanding(transferred.aiUnderstanding);
      setCompletedStages(transferred.completedStages);
      setStudioStage(transferred.targetStage);
      setHasSelectedModeForProject(true);
      setModeSelectionContext(null);
      handleSetStudioMode('advanced');
      handleBehaviorEvent('modeSwitchCount');
      handleBehaviorEvent('directorRunsCount');
      setToastMessage('Switched to Director Mode — your brief, settings, and draft instructions are preserved.');
    } else {
      const transferred = transferDirectorToSimple({
        userContext,
        aiUnderstanding,
        existingSimpleDraft: simpleDraftRef.current,
        guardrailDraftInputs,
        hasDirectorDirectionOrHook,
        hasDirectorScenes,
      });
      if (transferred.guardrailDraftInputs) setGuardrailDraftInputs(transferred.guardrailDraftInputs);
      setSimpleResumeDraft(transferred.simpleDraft);
      setSimpleStudioKey((k) => k + 1);
      setHasSelectedModeForProject(true);
      setModeSelectionContext(null);
      handleSetStudioMode('simple');
      handleBehaviorEvent('modeSwitchCount');
      handleBehaviorEvent('simpleRunsCount');
      setToastMessage('Switched to Simple Studio — your brief, format choices, and draft instructions are preserved.');
    }
    setTimeout(() => setToastMessage(''), 3500);
  };

  const requestModeSwitch = (targetMode) => {
    const cleanTarget = targetMode === 'simple' ? 'simple' : 'advanced';
    if (cleanTarget === studioMode) return;

    if (activeAppView !== 'studio' || modeSelectionContext || (!hasSelectedModeForProject && studioMode !== 'simple')) {
      if (modeSelectionContext) {
        handleCompleteModeSelection(cleanTarget);
        return;
      }
      executeModeSwitch(cleanTarget);
      return;
    }

    const hasDirectorDirectionOrHook = Boolean(
      selectedDirection || customDirection || selectedHook || customHook || (directionsList || []).length || (hooksList || []).length
    );
    const hasDirectorScenes = Boolean((scenes || []).length || generatedScript);

    const preview = cleanTarget === 'advanced'
      ? transferSimpleToDirector({
          simpleState: simpleDraftRef.current,
          currentUserContext: userContext,
          currentExplicitChoices: explicitChoices,
          currentAiUnderstanding: aiUnderstanding,
          guardrailDraftInputs,
        })
      : transferDirectorToSimple({
          userContext,
          aiUnderstanding,
          existingSimpleDraft: simpleDraftRef.current,
          guardrailDraftInputs,
          hasDirectorDirectionOrHook,
          hasDirectorScenes,
        });

    if (!hasActiveFilmWork() && preview.preservedItems.length === 0) {
      executeModeSwitch(cleanTarget);
      return;
    }

    setPendingModeSwitch({
      targetMode: cleanTarget,
      savedItems: preview.savedItems || preview.preservedItems || [],
      pendingItems: preview.pendingItems || [],
      uncarriedItems: preview.uncarriedItems || [],
      preservedItems: preview.preservedItems || [],
    });
  };

  const handleConfirmModeSwitch = () => {
    if (!pendingModeSwitch) return;
    const target = pendingModeSwitch.targetMode;
    setPendingModeSwitch(null);
    executeModeSwitch(target);
  };

  const handleCancelModeSwitch = () => {
    setPendingModeSwitch(null);
  };

  // Primary post-generation action: explore another creative direction using the same brief
  // without overwriting the previously generated script or video.
  const handleCreateAnotherFromBrief = async () => {
    handleBehaviorEvent('createdAnotherCount');
    setHasSelectedModeForProject(true);
    setModeSelectionContext(null);
    setErrorMessage('');
    setQualityFailures([]);
    setValidationError('');
    setHasStaleWarning(false);

    // Detach any earlier completed render target and isolate future draft saves from the completed project
    studioSessionRef.current += 1;
    activeRunIdRef.current = null;
    activeVideoUrlRef.current = '';
    renderTargetRef.current = { id: null, videoUrl: null };
    draftRenderRef.current = null;
    draftIdRef.current = newProjectId();
    currentSavingProjectIdRef.current = null;
    draftTriggerDetailRef.current = 'New project started from same brief';
    setDraftStatus({ state: 'idle', isNewDraft: false, detail: 'New project started from same brief' });
    setIsCurrentProjectSaved(false);
    setIsRendering(false);
    stopTimer();

    // Clear creative run choices & generated output while keeping brief, business, settings, guardrails, event & understanding
    setVideoUrl('');
    setGeneratedScript(null);
    setScenes([]);
    setSetting('');
    setCharacter1('');
    setCharacter2('');
    setShotSpec(null);
    setScriptPayloadData(null);
    setScriptGuardrailReport(null);
    setDirectionData(null);
    setPlotData(null);
    setStoryData(null);
    setDirectionsList([]);
    setSelectedDirection(null);
    setCustomDirection('');
    if (loadedDirectionsFormatRef) loadedDirectionsFormatRef.current = '';
    setHooksList([]);
    if (loadedHooksDirectionKeyRef) loadedHooksDirectionKeyRef.current = '';
    setSelectedHook(null);
    setCustomHook('');
    setPlotsList([]);
    setSelectedPlot(null);
    setCustomPlot('');
    setStoryWorldData(null);

    const prodSettings = getCurrentProductionSettings();
    const cleanBrief = userContext.brief || userContext.specialty || userContext.offer || '';
    const eventCtx = hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null;
    const understandingIsCurrent = Boolean(
      aiUnderstanding &&
      aiUnderstanding.approval_status === 'approved' &&
      !isUnderstandingOutdatedClient(aiUnderstanding, cleanBrief, userContext.creativeGuardrails, prodSettings, eventCtx)
    );

    setCreativeDNA((prev) => ({
      ...(prev || {}),
      parentProjectId: activeProjectId || prev?.parentProjectId || null,
      direction: null,
      selectedAiDirection: null,
      customDirection: '',
      ideaSource: null,
      hook: null,
      plot: null,
      story: null,
      aiUnderstanding: understandingIsCurrent ? aiUnderstanding : aiUnderstanding || null,
      productionSettings: prodSettings,
    }));

    setExplicitChoices((prev) => {
      const next = { ...prev };
      delete next.idea;
      delete next.opening;
      return next;
    });

    if (understandingIsCurrent) {
      setCompletedStages(['brief', 'settings', 'understanding']);
      setStudioStage('idea');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await loadCreativeDirections(true, prodSettings.creativeStyle, prodSettings.language);
    } else {
      setCompletedStages(['brief', 'settings']);
      await handleGenerateAiUnderstanding();
    }
  };

  // Secondary post-generation action: regenerate video for the currently completed script without
  // clearing the script or starting a new creative direction.
  const handleRegenerateCurrentVideo = async () => {
    setErrorMessage('');
    setQualityFailures([]);
    activeVideoUrlRef.current = '';
    setVideoUrl('');
    await handleRunVideoProduction();
  };

  // Safe Back Navigation to Previous Stage
  const handleGoBack = () => {
    setErrorMessage('');
    setQualityFailures([]);
    setIsChangeOpen(false);

    if (studioStage === 'video') setStudioStage('script');
    else if (studioStage === 'script') setStudioStage('opening');
    else if (studioStage === 'opening') setStudioStage('idea');
    else if (studioStage === 'idea') setStudioStage('understanding');
    else if (studioStage === 'understanding') setStudioStage('settings');
    else if (studioStage === 'settings') setStudioStage('brief');
    else if (studioStage === 'brief') {
      setActiveAppView('home');
      setStudioStage('entry');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Run Video Production Pipeline
  const handleRunVideoProduction = async (overrideParams = null) => {
    if (isRendering) {
      console.warn('[VideoProduction] Video render already in progress; ignoring duplicate trigger.');
      return;
    }
    const targetScenes = overrideParams?.scenes || scenes;
    if (!targetScenes || !targetScenes.length) {
      setErrorMessage('No script scenes found. Please complete the script stage first.');
      return;
    }

    setErrorMessage('');
    setIsRendering(true);
    setRenderStep(0);
    setRenderStatusText('Preparing your video…');
    startTimer();
    const session = studioSessionRef.current;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
        ? userContext.customBusinessType.trim()
        : userContext.businessType;

      const effectiveSetting = (
        overrideParams?.setting ||
        setting ||
        `Modern, well-lit ${bType || 'store'} environment at ${userContext.businessName || 'the business'}`
      ).trim();

      const effectiveChar1 = (
        overrideParams?.character1 ||
        character1 ||
        `${userContext.businessName || 'Store'} Specialist / Lead Presenter`
      ).trim();

      const effectiveChar2 = (
        overrideParams?.character2 ||
        character2 ||
        'Customer'
      ).trim();

      const runPayload = {
        scenes: targetScenes.map((s) => (typeof s === 'string' ? s : s.visual || s.text || '').trim()).filter(Boolean),
        character1: effectiveChar1,
        character2: effectiveChar2,
        setting: effectiveSetting,
        duration: overrideParams?.duration || userContext.duration || userContext.targetDuration || '15s',
        platform: overrideParams?.platform || (overrideParams?.aspectRatio === '16:9' ? 'YouTube / 16:9' : overrideParams?.aspectRatio === '1:1' ? 'Feed / 1:1' : overrideParams?.dimension) || userContext.platform || 'Instagram Reels / 9:16',
        aspectRatio: overrideParams?.aspectRatio || overrideParams?.dimension || (userContext.platform && userContext.platform.includes('16:9') ? '16:9' : userContext.platform && userContext.platform.includes('1:1') ? '1:1' : '9:16'),
        product: userContext.specialty || userContext.offer || userContext.brief || bType || 'featured product',
        productName: userContext.specialty || bType || 'featured product',
        businessType: bType,
        businessName: userContext.businessName.trim(),
        specialty: userContext.specialty || '',
        brief: userContext.brief || '',
        productPhoto: userContext.productPhoto ? { mime: userContext.productPhoto.mime, data: userContext.productPhoto.data } : null,
        // the logo chosen for this video (prefilled from the profile) — decides logo vs no-logo flow
        logo: videoLogoPayload(userContext),
        projectId: activeProjectId,
        creativeGuardrails: overrideParams?.creativeGuardrails || userContext.creativeGuardrails || null,
        shotSpec: shotSpec ? {
          ...shotSpec,
          staticWorld: {
            ...(shotSpec.staticWorld || {}),
            setting: effectiveSetting,
            characters: [effectiveChar1, effectiveChar2].filter(Boolean).join(' | '),
          },
        } : null,
      };

      const data = await safeApiCall(fetch('/api/run', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(runPayload),
      }), 'Failed to dispatch render job.');

      setRenderStatusText('Creating scenes and putting everything together…');
      await pollRenderStatus(data.runId, { session });
      if (studioSessionRef.current === session) markStageComplete('video');
    } catch (err) {
      if (studioSessionRef.current !== session) return;
      stopTimer();
      setIsRendering(false);
      setErrorMessage(err.message || 'Error occurred while initiating video render.');
    }
  };

  const handleSimpleProduceVideo = async (packageData) => {
    try {
      const formattedScenes = (packageData.scenes || []).map((s) => {
        if (typeof s === 'string') return s;
        const parts = [];
        if (s.visual) parts.push(s.visual);
        if (s.dialogue) parts.push(`Audio: "${s.dialogue}"`);
        if (s.onScreenText) parts.push(`Text: ${s.onScreenText}`);
        return parts.join(' | ') || s.visual || s.text || '';
      });

      const bType = userContext.businessType || 'business';
      const bName = userContext.businessName || 'the store';

      const packageSetting = (
        packageData.setting ||
        `Modern, well-lit ${bType} environment at ${bName}`
      ).trim();

      const packageChar1 = (
        packageData.character1 ||
        packageData.characters?.lead ||
        packageData.characters?.character1 ||
        (typeof packageData.characters === 'string' ? packageData.characters : '') ||
        `${bName} Specialist / Host`
      ).trim();

      const packageChar2 = (
        packageData.character2 ||
        packageData.characters?.customer ||
        packageData.characters?.character2 ||
        'Customer'
      ).trim();

      setScenes(formattedScenes);
      setSetting(packageSetting);
      setCharacter1(packageChar1);
      setCharacter2(packageChar2);
      setGeneratedScript(packageData.fullScriptText || null);
      if (packageData.brief) updateUserContext('brief', packageData.brief);
      if (packageData.language) updateUserContext('language', packageData.language);
      const resolvedPhoto = packageData.productPhoto !== undefined ? packageData.productPhoto : userContext.productPhoto;
      if (packageData.creativeStyle) updateUserContext('creativeStyle', packageData.creativeStyle);
      updateUserContext('productPhoto', resolvedPhoto || null);
      if (packageData.duration) {
        updateUserContext('duration', packageData.duration);
        updateUserContext('targetDuration', packageData.duration);
      }
      if (packageData.aspectRatio || packageData.dimension || packageData.platform) {
        const plat = packageData.platform || (packageData.aspectRatio === '16:9' ? 'YouTube / 16:9' : packageData.aspectRatio === '1:1' ? 'Feed / 1:1' : 'Instagram Reels / 9:16');
        updateUserContext('platform', plat);
      }

      await handleRunVideoProduction({
        scenes: formattedScenes,
        setting: packageSetting,
        character1: packageChar1,
        character2: packageChar2,
        brief: packageData.brief || userContext.brief,
        productPhoto: resolvedPhoto || null,
        duration: packageData.duration || userContext.duration || userContext.targetDuration || '30s',
        platform: packageData.platform || (packageData.aspectRatio === '16:9' ? 'YouTube / 16:9' : packageData.aspectRatio === '1:1' ? 'Feed / 1:1' : 'Instagram Reels / 9:16'),
        aspectRatio: packageData.aspectRatio || packageData.dimension || '9:16',
        dimension: packageData.aspectRatio || packageData.dimension || '9:16',
      });
    } catch (err) {
      console.error('[SimpleStudio] video run error:', err);
      setErrorMessage(err.message || 'Failed to start video production.');
    }
  };

  // Full Brand Reset (Allows Adding a Brand New Business)
  const handleResetBrandProfile = () => {
    setIsBrandModalOpen(false);
    setBrandResetKey((prev) => prev + 1);
    try {
      localStorage.removeItem('clevertize_user_context');
      localStorage.removeItem('clevertize_brand_name');
      localStorage.removeItem('clevertize_website_url');
      localStorage.removeItem('clevertize_lang_explicit');
    } catch (e) {
      console.warn('Storage unavailable', e);
    }
    setExplicitChoices({
      style: null,
      language: null,
      platform: null,
      duration: null,
      idea: null,
      opening: null,
    });
    setDirectionsList([]);
    setSelectedDirection(null);
    setCustomDirection('');
    setHooksList([]);
    loadedHooksDirectionKeyRef.current = '';
    setSelectedHook(null);
    setCustomHook('');
    setPlotsList([]);
    setSelectedPlot(null);
    setCustomPlot('');
    setStoryWorldData(null);
    setGeneratedScript(null);
    setCreativeDNA({ direction: null, hook: null, plot: null, story: null });

    setUserContext({
      businessName: '',
      businessType: 'Saree, Ethnic Wear & Bridal Store',
      customBusinessType: '',
      town: '',
      area: '',
      brief: '',
      specialty: '',
      offer: '',
      occasion: '',
      contact: '',
      ownerName: '',
      leadCharacter: '',
      supportingCharacter: '',
      environment: '',
      websiteUrl: '',
      duration: '15s',
      platform: 'Instagram Reels / 9:16',
      creativeStyle: 'UGC / Creator-style',
      language: 'English',
      scriptMode: 'devanagari',
      selectedGoalId: 'offer',
      shopPhoto: null,
      productPhoto: null,
      logo: null,
      brandFile: null,
    });
    setSessionId(null);
    setDirectionData(null);
    setPlotData(null);
    setStoryData(null);
    setScriptPayloadData(null);
    setScenes([]);
    setShotSpec(null);
    setVideoUrl('');
    setApprovedSummary([]);
    setIsBrandModalOpen(false);
    setCurrentStep('input');
    setCreationStep(1);
    setBrandFlowState('setup');
    setValidationError('');
    setErrorMessage('');
    setCompletedStages([]);
    setStudioStage('brief');
    setHasStaleWarning(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reusable Upload Tile Component
  const UploadTile = ({ id, label, hint, accept, file, onChange, icon: Icon, capture }) => (
    <div
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: file ? '1px solid var(--cc-selected-line)' : '1px dashed var(--border-default)',
        borderRadius: 8,
        padding: '12px 14px',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 6,
              backgroundColor: file ? 'var(--accent-subtle)' : 'var(--bg-surface)',
              color: file ? 'var(--cc-emphasis)' : 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {file ? file.name : label}
            </div>
            <div style={{ fontSize: 12, color: file ? 'var(--success)' : 'var(--text-tertiary)', marginTop: 2 }}>
              {file ? `${Math.round((file.data?.length * 0.75) / 1024) || 0} KB · Ready` : hint}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {file ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              style={{
                padding: '5px 10px',
                borderRadius: 4,
                fontSize: 12,
                color: 'var(--error)',
                backgroundColor: 'transparent',
                border: '1px solid var(--error-subtle)',
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          ) : (
            <label
              htmlFor={id}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Upload size={13} />
              <span>Upload</span>
            </label>
          )}
          <input
            id={id}
            type="file"
            accept={accept}
            capture={capture}
            onChange={(e) => onChange(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      {file && file.previewUrl && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={file.previewUrl}
            alt="Preview"
            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border-subtle)' }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Visual asset attached for AI rendering engine</span>
        </div>
      )}
    </div>
  );

  // 0. Password reset link (/reset-password?token=...)
  if (isResettingPassword) {
    return (
      <ResetPasswordScreen
        onReturnToLogin={(targetMode) => {
          setIsResettingPassword(false);
          handleReturnFromVerification(targetMode || 'signin');
        }}
        onResetSuccess={(authData) => {
          setIsResettingPassword(false);
          try {
            window.history.replaceState({}, document.title, '/');
          } catch {}
          handleAuthSuccess(authData);
        }}
      />
    );
  }

  // 0. Email verification URL handling (/verify-email?token=...)
  if (isVerifyingEmail) {
    return (
      <EmailVerificationScreen
        onReturnToLogin={(targetMode) => handleReturnFromVerification(targetMode || 'signin')}
        onVerificationSuccess={(authData) => {
          setIsVerifyingEmail(false);
          try {
            window.history.replaceState({}, document.title, '/');
          } catch {}
          handleAuthSuccess(authData);
        }}
      />
    );
  }

  // 1. Initial auth token verification loading screen
  if (isAuthChecking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#121211',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          boxSizing: 'border-box',
          color: 'var(--cc-text-1)',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <AuthSessionLoader />
      </div>
    );
  }

  // 2. Unauthenticated user: show full-screen AuthScreen
  if (!currentUser || !authToken) {
    return (
      <AuthScreen
        initialMode={authInitialMode}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // Instantaneous fallback guaranteeing that any generated video in current session appears in My Projects
  const activeVideoProject = (videoUrl && !hasProjectForVideo(userProjects, videoUrl)) ? [{
    // the id this render is being saved under, else one derived from the video — never a shared literal
    id: renderTargetRef.current.videoUrl === videoUrl ? renderTargetRef.current.id : projectIdForVideoUrl(videoUrl),
    businessId: userContext.businessId || null,
    title: userContext.businessName
      ? `${userContext.businessName} - ${userContext.occasion || userContext.selectedGoalId || (userContext.brief ? briefSnippet(userContext.brief, 30) : 'Commercial Film')}`
      : (userContext.brief ? briefSnippet(userContext.brief, 40) : 'Commercial Film'),
    businessName: userContext.businessName || 'Brand',
    businessType: userContext.businessType || '',
    town: userContext.town || '',
    language: userContext.language || 'English',
    creativeStyle: userContext.creativeStyle || 'UGC / Creator-style',
    status: 'video_ready',
    videoUrl: videoUrl,
    brief: userContext.brief || '',
    scenes: scenes || [],
    setting: setting || '',
    character1: character1 || '',
    character2: character2 || '',
    stages: {
      directionsList: directionsList || [],
      selectedDirection: selectedDirection || null,
      selectedDirectionIndex: typeof selectedDirectionIdx === 'number' ? selectedDirectionIdx : 0,
      hooksList: hooksList || [],
      selectedHook: selectedHook || null,
      storyWorldData: storyWorldData || null,
      generatedScript: generatedScript || null,
      completedStages: ['brief', 'settings', 'idea', 'opening', 'story', 'script', 'video'],
    },
    completedStages: ['brief', 'settings', 'idea', 'opening', 'story', 'script', 'video'],
    brandContext: typeof extractBrandProfile === 'function' ? extractBrandProfile(userContext) : {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }] : [];

  // In-progress drafts first, then finished videos and saved scripts
  const displayProjects = sortProjectsForLibrary([...activeVideoProject, ...userProjects]);

  return (
    <StudioStateContext.Provider value={studioState}>
      <StudioDispatchContext.Provider value={studioDispatch}>
        <AppShell
          activeView={activeAppView}
          onSelectView={setActiveAppView}
          studioMode={studioMode}
          onToggleStudioMode={() => requestModeSwitch(studioMode === 'simple' ? 'advanced' : 'simple')}
          onSetStudioMode={requestModeSwitch}
          onReplayTour={handleReplayTour}
          onResumeTour={handleResumeTour}
          hasPausedTour={hasResumableTourProgress(onboardingState, TOUR_STEPS.length)}
          pausedTourStep={onboardingState?.lastTourStep || 0}
          totalTourSteps={TOUR_STEPS.length}
          currentStage={studioStage}
          completedStages={completedStages}
          onNavigateStage={handleNavigateStage}
          onStartNewFilm={() => handleStartNewProject(false)}
          onRestartFilm={handleRestartFilm}
          businessName={userContext.businessName}
          businessType={userContext.businessType}
          town={userContext.town}
          brandLogo={userContext.brandLogo}
          activeBusiness={userContext}
          businesses={userBusinesses}
          onSelectBusiness={handleSelectBusiness}
          onAddNewBusiness={() => {
            setEditingBusiness(null);
            setIsOnboardingModalOpen(true);
          }}
          onEditBrand={() => {
            setEditingBusiness(userContext);
            setIsOnboardingModalOpen(true);
          }}
          onOpenScriptModal={() => setIsScriptModalOpen(true)}
          onOpenUrlModal={() => setIsUrlModalOpen(true)}
          isOnline={isOnline}
          hasStaleWarning={hasStaleWarning}
          onApplyUpdate={handleApplyUpdate}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
          onLogout={handleLogout}
          onOpenOnboarding={() => {
            setEditingBusiness(null);
            setIsOnboardingModalOpen(true);
          }}
          projectCount={displayProjects.length}
          draftStatus={draftStatus}
          onRetryDraftSave={handleRetryDraftSave}
        >
          {/* Offline Connectivity Notification Banner */}
          {!isOnline && (
            <div
              style={{
                backgroundColor: 'var(--cc-danger)',
                color: '#1A0703',
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <WifiOff size={16} />
              <span>You're offline. Your progress is safe. Reconnect to continue.</span>
            </div>
          )}

          {(activeAppView === 'home' || activeAppView === 'hub' || (activeAppView === 'studio' && studioStage === 'entry')) ? (
            <CreationEntryHub
              onStartBrief={() => {
                setSelectedCreationEntry('brief');
                if (userBusinesses.length === 0 || !userContext.businessName) {
                  setIsOnboardingModalOpen(true);
                  return;
                }
                setHasSelectedModeForProject(studioMode === 'simple');
                setModeSelectionContext(null);
                setActiveAppView('studio');
                setStudioStage('brief');
                if (studioMode === 'simple' && simpleDraftRef.current && simpleDraftRef.current.step !== 1) {
                  setSimpleResumeDraft((prev) => ({ ...(simpleDraftRef.current || prev || {}), step: 1 }));
                  setSimpleStudioKey((k) => k + 1);
                }
              }}
              onOpenScriptModal={() => {
                setSelectedCreationEntry('script');
                if (userBusinesses.length === 0 || !userContext.businessName) {
                  setIsOnboardingModalOpen(true);
                  return;
                }
                setIsScriptModalOpen(true);
              }}
              onOpenUrlModal={() => {
                setSelectedCreationEntry('url');
                if (userBusinesses.length === 0 || !userContext.businessName) {
                  setIsOnboardingModalOpen(true);
                  return;
                }
                setIsUrlModalOpen(true);
              }}
              businessName={userContext.businessName}
              businessType={userContext.businessType}
              town={userContext.town}
              hasActiveScript={Boolean(scenes.length > 0 || generatedScript)}
              onContinueActiveProject={() => {
                setActiveAppView('studio');
                setStudioStage(studioStage === 'entry' ? 'brief' : studioStage);
              }}
              onEditBrand={() => {
                if (userBusinesses.length === 0 || !userContext.businessName) {
                  setEditingBusiness(null);
                } else {
                  setEditingBusiness(userContext);
                }
                setIsOnboardingModalOpen(true);
              }}
              recentProjects={displayProjects}
              onOpenProject={handleOpenProject}
              currentUser={currentUser}
              onNavigateProjects={() => setActiveAppView('projects')}
            />
          ) : (activeAppView === 'projects' || activeAppView === 'library') ? (
            <ScriptLibraryView
              projects={displayProjects}
              businesses={userBusinesses}
              currentProjectId={activeProjectId}
              onOpenProject={handleOpenProject}
              onDeleteProject={handleDeleteProject}
              onBulkDeleteProjects={handleBulkDeleteProjects}
              onNewProject={() => {
                handleStartNewProject(false);
              }}
              onSignIn={() => setIsAuthModalOpen(true)}
              currentUser={currentUser}
              isLoadingProjects={Boolean(authToken && !projectsLoaded)}
            />
          ) : (activeAppView === 'businesses' || activeAppView === 'business') ? (
            <BusinessProfileView
              businesses={userBusinesses}
              activeBusiness={userContext}
              onSelectBusiness={handleSelectBusiness}
              onEditBusiness={(biz) => {
                setEditingBusiness(biz);
                setIsOnboardingModalOpen(true);
              }}
              onAddNewBusiness={() => {
                setEditingBusiness(null);
                setIsOnboardingModalOpen(true);
              }}
              onSaveBusiness={handleSaveBusiness}
              currentUser={currentUser}
              onSignIn={() => setIsAuthModalOpen(true)}
            />
          ) : modeSelectionContext ? (
            <ModeSelectionScreen
              entrySource={modeSelectionContext.source}
              briefText={userContext.brief}
              businessName={userContext.businessName}
              preferredMode={onboardingState.preferredMode}
              onSelectMode={handleCompleteModeSelection}
              onBack={() => {
                if (modeSelectionContext.source === 'script') {
                  setModeSelectionContext(null);
                  setActiveAppView('hub');
                  setIsScriptModalOpen(true);
                } else {
                  setModeSelectionContext(null);
                  setStudioStage('brief');
                }
              }}
            />
          ) : studioMode === 'simple' ? (
            <SimpleBusinessStudio
              key={`simple-studio-${brandResetKey}-${simpleStudioKey}`}
              initialDraft={simpleResumeDraft}
              onDraftChange={handleSimpleDraftChange}
              businessName={userContext.businessName}
              businessType={userContext.businessType}
              town={userContext.town}
              initialBrief={userContext.brief}
              initialTargetAudience={userContext.targetAudience || ''}
              initialLanguage={creativeDNA.language || userContext.language || 'English'}
              initialStyle={creativeDNA.creativeStyle || userContext.creativeStyle || 'UGC / Creator-style'}
              initialDuration={userContext.duration || userContext.targetDuration || '20s'}
              initialAspectRatio={userContext.platform && userContext.platform.includes('16:9') ? '16:9' : userContext.platform && userContext.platform.includes('1:1') ? '1:1' : '9:16'}
              brandTone={userContext.brandTone || 'Warm & Authentic'}
              brandLogo={userContext.brandLogo || userContext.logo}
              productPhoto={userContext.productPhoto}
              onUploadProductPhoto={(file) => handleFileUpload(file, 'productPhoto')}
              onRemoveProductPhoto={() => updateUserContext('productPhoto', null)}
              onOpenScriptModal={() => setIsScriptModalOpen(true)}
              onOpenUrlModal={() => setIsUrlModalOpen(true)}
              isRecording={isListening}
              onToggleRecording={micSupported ? toggleVoiceInput : null}
              dictatedBriefSync={dictatedBriefSync}
              onSwitchToDirectorMode={() => requestModeSwitch('advanced')}
              onProduceVideo={handleSimpleProduceVideo}
              onSaveProject={handleSaveCurrentProject}
              isSavingProject={isSavingProject}
              isProjectSaved={isCurrentProjectSaved}
              isProducingVideo={isRendering}
              producedVideoUrl={videoUrl}
              videoRunError={errorMessage}
              projectId={activeProjectId}
              userId={currentUser?.id}
              onboardingState={onboardingState}
              onDismissTip={handleDismissTip}
              onBehaviorEvent={handleBehaviorEvent}
              onEditBrand={() => {
                setEditingBusiness(userContext);
                setIsOnboardingModalOpen(true);
              }}
              onStartNewBrief={handleStartNewBrief}
            />
          ) : (activeAppView === 'studio' && !hasSelectedModeForProject && studioStage === 'brief') ? (
            <div style={{ maxWidth: 860, margin: '24px auto 0', width: '100%', padding: '0 20px 80px' }}>
              <Screen02Brief
                userContext={userContext}
                updateUserContext={updateUserContext}
                handleFileUpload={handleFileUpload}
                onOpenScriptModal={() => setIsScriptModalOpen(true)}
                onOpenUrlModal={() => setIsUrlModalOpen(true)}
                onEditBrand={() => {
                  setEditingBusiness(userContext);
                  setIsOnboardingModalOpen(true);
                }}
                onContinue={async () => {
                  const cleanBrief = userContext.brief || userContext.specialty || userContext.offer || '';
                  if (!cleanBrief.trim()) {
                    setValidationError('Please tell us what you want this video to say.');
                    return;
                  }
                  setValidationError('');
                  handleBehaviorEvent('briefSubmittedCount');
                  markStageComplete('brief');
                  setModeSelectionContext({ source: selectedCreationEntry === 'url' ? 'url' : 'brief' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onBack={() => {
                  setModeSelectionContext(null);
                  setActiveAppView('hub');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isRecording={isListening}
                toggleRecording={toggleVoiceInput}
                briefSuggestions={(() => {
                  try {
                    const res = getBriefSuggestions(userContext.businessType, userContext.businessName, userContext.town);
                    return (res && Array.isArray(res.suggestions)) ? res.suggestions : [];
                  } catch {
                    return [];
                  }
                })()}
                researchData={researchData}
                isResearching={isResearching}
                guardrailDraftInputs={guardrailDraftInputs}
                onGuardrailDraftChange={setGuardrailDraftInputs}
                optionalExpanded={briefOptionalExpanded}
                onOptionalExpandedChange={setBriefOptionalExpanded}
              />
            </div>
          ) : (
            <>
      {/* V4 GUIDED STUDIO PROGRESS HEADER & YOUR CHOICES */}
      <div style={{ maxWidth: 860, margin: '16px auto 0', width: '100%', padding: '0 20px' }}>
        <StudioProgressHeader
          currentStage={studioStage}
          completedStages={completedStages}
          onNavigateStage={handleNavigateStage}
        />
        <StudioChoicesBar
          currentStage={studioStage}
          explicitChoices={explicitChoices}
          onNavigateStage={handleNavigateStage}
          hasStaleWarning={Boolean(
            hasStaleWarning && (
              completedStages.includes('script') ||
              completedStages.includes('video') ||
              scenes.length > 0 ||
              generatedScript
            )
          )}
          onApplyUpdate={handleApplyUpdate}
        />
      </div>

      {/* BRAND MODAL (MANAGE / RESET) */}
      {isBrandModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setIsBrandModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              maxWidth: 540,
              width: '100%',
              padding: 24,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={18} style={{ color: 'var(--cc-emphasis)' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Manage Brand & Business Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Business / Brand Name
                </label>
                <input
                  type="text"
                  value={userContext.businessName}
                  onChange={(e) => updateUserContext('businessName', e.target.value)}
                  placeholder="e.g. Sharma General Store, Zari Silks, Metro Dental"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Business Category
                </label>
                <select
                  value={userContext.businessType}
                  onChange={(e) => updateUserContext('businessType', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                >
                  {BUSINESS_TYPE_PRESETS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {userContext.businessType === 'Other' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Custom Category
                  </label>
                  <input
                    type="text"
                    value={userContext.customBusinessType}
                    onChange={(e) => updateUserContext('customBusinessType', e.target.value)}
                    placeholder="e.g. Handmade Ceramic Pottery"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Town / City <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={userContext.town}
                    onChange={(e) => updateUserContext('town', e.target.value)}
                    placeholder="e.g. Bangalore, Mumbai (leave blank if global)"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Area / Neighborhood <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={userContext.area}
                    onChange={(e) => updateUserContext('area', e.target.value)}
                    placeholder="e.g. Indiranagar, Palasia"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Website (Optional)
                </label>
                <input
                  type="text"
                  value={userContext.websiteUrl}
                  onChange={(e) => updateUserContext('websiteUrl', e.target.value)}
                  placeholder="e.g. https://mybrand.com"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Default Offer / USP (Optional)
                </label>
                <input
                  type="text"
                  value={userContext.offer}
                  onChange={(e) => updateUserContext('offer', e.target.value)}
                  placeholder="e.g. 50% festive discount or 20-min delivery"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.005em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  Brand Assets
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <UploadTile
                    id="modalBrandDoc"
                    label="Brand Guidelines"
                    hint="PDF or DOCX document"
                    accept=".pdf,.doc,.docx"
                    file={userContext.brandFile}
                    onChange={(f) => handleFileUpload(f, 'brandFile')}
                    icon={FileText}
                  />
                  <UploadTile
                    id="modalShopPhoto"
                    label="Business Photos"
                    hint="Storefront, signboard, or interior"
                    accept="image/*"
                    capture="environment"
                    file={userContext.shopPhoto}
                    onChange={(f) => handleFileUpload(f, 'shopPhoto')}
                    icon={ImageIcon}
                  />
                  <UploadTile
                    id="modalLogo"
                    label="Brand Logo"
                    hint="PNG or JPG format"
                    accept="image/*"
                    file={userContext.logo}
                    onChange={(f) => handleFileUpload(f, 'logo')}
                    icon={Building2}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset this brand profile and add a new brand?')) {
                    handleResetBrandProfile();
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--error)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: 0,
                }}
              >
                <Trash2 size={13} />
                <span>Add New Brand / Reset</span>
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsBrandModalOpen(false);
                    setBrandFlowState('create');
                    if (userContext.businessName.trim() && creationStep === 1) {
                      setCreationStep(2);
                    }
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 999,
                    backgroundColor: 'var(--cc-action)',
                    color: 'var(--cc-on-action)',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px var(--accent-glow)',
                  }}
                >
                  Save & Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW CONTAINER */}
      <main style={{ flex: 1, maxWidth: 860, width: '100%', margin: '0 auto', padding: '16px 20px 80px' }}>
        {/* GLOBAL ERROR BANNER */}
        {errorMessage && !videoUrl && (
          <div
            role="alert"
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--error-subtle)',
              border: '1px solid var(--error)',
              borderRadius: 8,
              color: 'var(--error)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{errorMessage}</div>
              {qualityFailures.length > 0 && (
                <ul style={{ margin: '8px 0 0', paddingLeft: 16, fontSize: 12, lineHeight: 1.5 }}>
                  {qualityFailures.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setStudioStage('brief');
                    setErrorMessage('');
                    setQualityFailures([]);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 999,
                    backgroundColor: 'var(--cc-action)',
                    color: 'var(--cc-on-action)',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={13} />
                  <span>Return to Video Brief</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setQualityFailures([]);
                  }}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 6,
                    backgroundColor: 'transparent',
                    color: 'var(--text-tertiary)',
                    border: 'none',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VALIDATION ERROR BANNER */}
        {validationError && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 122, 107, 0.12)',
              border: '1px solid var(--error)',
              borderRadius: 8,
              color: 'var(--error)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={16} />
              <span>{validationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationError('')}
              style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 7 DEDICATED GUIDED STUDIO SCREENS */}
        {studioStage === 'brief' && (
          <Screen02Brief
            userContext={userContext}
            updateUserContext={updateUserContext}
            handleFileUpload={handleFileUpload}
            onOpenScriptModal={() => setIsScriptModalOpen(true)}
            onOpenUrlModal={() => setIsUrlModalOpen(true)}
            onEditBrand={() => {
              setEditingBusiness(userContext);
              setIsOnboardingModalOpen(true);
            }}
            onContinue={async () => {
              const cleanBrief = userContext.brief || userContext.specialty || userContext.offer || '';
              if (!cleanBrief.trim()) {
                setValidationError('Please tell us what you want this video to say.');
                return;
              }
              setValidationError('');
              markStageComplete('brief');
              setStudioStage('settings');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={() => {
              setActiveAppView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isRecording={isListening}
            toggleRecording={toggleVoiceInput}
            briefSuggestions={(() => {
              try {
                const res = getBriefSuggestions(userContext.businessType, userContext.businessName, userContext.town);
                return (res && Array.isArray(res.suggestions)) ? res.suggestions : [];
              } catch (err) {
                console.warn('[Screen02Brief] suggestions error:', err);
                return [];
              }
            })()}
            researchData={researchData}
            isResearching={isResearching}
            guardrailDraftInputs={guardrailDraftInputs}
            onGuardrailDraftChange={setGuardrailDraftInputs}
            optionalExpanded={briefOptionalExpanded}
            onOptionalExpandedChange={setBriefOptionalExpanded}
          />
        )}

        {studioStage === 'settings' && (
          <Screen03Settings
            userContext={userContext}
            updateUserContext={(field, value) => {
              updateUserContext(field, value);
              if (field === 'videoLogo') {
                setCompletedStages((prev) => prev.filter((s) => ['business', 'brief', 'settings'].includes(s)));
              }
            }}
            handleFileUpload={handleFileUpload}
            onLanguageChange={(lang) => {
              setExplicitChoices((prev) => ({ ...prev, language: lang }));
              handleLanguageChange(lang);
            }}
            onStyleChange={(stId, stLabel) => {
              const cleanLabel = stLabel || (stId.includes('UGC') ? 'UGC' : stId.includes('Story') ? 'Story' : stId.includes('Demo') ? 'Product Demo' : 'Funny');
              setExplicitChoices((prev) => ({ ...prev, style: cleanLabel }));
              handleFormatChange(stId);
            }}
            onDimensionChange={(dimId, dimLabel) => {
              const label = dimLabel || (dimId === '16:9' ? '16:9 Landscape' : dimId === '1:1' ? '1:1 Square' : '9:16 Vertical');
              setExplicitChoices((prev) => ({ ...prev, dimension: label, platform: label }));
              updateUserContext('aspectRatio', dimId);
              updateUserContext('dimension', dimId);
              const platFallback = dimId === '16:9' ? 'YouTube / 16:9' : dimId === '1:1' ? 'Social Feed / 1:1' : 'Instagram Reels / 9:16';
              updateUserContext('platform', platFallback);
              setCompletedStages((prev) => prev.filter((s) => ['business', 'brief', 'settings'].includes(s)));
            }}
            onPlatformChange={(platLabel, platId) => {
              setExplicitChoices((prev) => ({ ...prev, platform: platLabel, dimension: platLabel }));
              updateUserContext('platform', platId);
              const ar = platId.includes('16:9') ? '16:9' : platId.includes('1:1') ? '1:1' : '9:16';
              updateUserContext('aspectRatio', ar);
              updateUserContext('dimension', ar);
              setCompletedStages((prev) => prev.filter((s) => ['business', 'brief', 'settings'].includes(s)));
            }}
            onDurationChange={(dur) => {
              setExplicitChoices((prev) => ({ ...prev, duration: dur }));
              updateUserContext('targetDuration', dur);
              updateUserContext('duration', dur);
              setCompletedStages((prev) => prev.filter((s) => ['business', 'brief', 'settings'].includes(s)));
            }}
            onContinue={async () => {
              markStageComplete('settings');
              const cleanBrief = userContext.brief || userContext.specialty || userContext.offer || '';
              const prodSettings = getCurrentProductionSettings();
              const isOutdated = isUnderstandingOutdatedClient(
                aiUnderstanding,
                cleanBrief,
                userContext.creativeGuardrails,
                prodSettings,
                hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null
              );
              scheduleDraftSave(true);

              if (!aiUnderstanding || isOutdated) {
                await handleGenerateAiUnderstanding();
              } else {
                setStudioStage('understanding');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            onBack={() => {
              setStudioStage('brief');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {studioStage === 'understanding' && (
          <ScreenUnderstanding
            understanding={aiUnderstanding}
            onUpdateUnderstanding={handleUpdateUnderstanding}
            onApproveAndContinue={handleApproveUnderstanding}
            onBackToBrief={() => {
              setStudioStage('brief');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onEditSettings={() => {
              setStudioStage('settings');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            settingsContext={getCurrentProductionSettings()}
            onRegenerate={handleGenerateAiUnderstanding}
            isRegenerating={isAnalyzingBrief}
            isSaving={isSavingProject}
            originalBrief={userContext.brief || userContext.specialty || userContext.offer || ''}
            businessName={userContext.businessName}
            businessType={userContext.businessType}
            town={userContext.town}
            isOutdated={isUnderstandingOutdatedClient(
              aiUnderstanding,
              userContext.brief || userContext.specialty || userContext.offer || '',
              userContext.creativeGuardrails,
              getCurrentProductionSettings(),
              hasActiveClientEventContext(userContext.eventContext) ? userContext.eventContext : null
            )}
            userGuardrails={userContext.creativeGuardrails}
            userEventContext={userContext.eventContext}
            onboardingState={onboardingState}
            onDismissTip={handleDismissTip}
            error={understandingError}
            onCancelAnalysis={handleCancelAiUnderstanding}
            attemptKey={analysisAttempt}
          />
        )}

        {studioStage === 'idea' && (
          <Screen04Idea
            userContext={userContext}
            creativeDNA={creativeDNA}
            briefData={userContext}
            directionsList={directionsList}
            selectedDirection={selectedDirection}
            setSelectedDirection={(d) => {
              const prevKey = selectedDirection?.id || selectedDirection?.title || '';
              const newKey = d?.id || d?.title || '';
              const isDifferent = prevKey !== newKey;
              setSelectedDirection(d);
              const ideaSel = resolveIdeaSelection(d, customDirection);
              setCreativeDNA((prev) => ({
                ...prev,
                direction: ideaSel.direction,
                ideaSource: ideaSel.ideaSource,
                selectedAiDirection: ideaSel.selectedAiDirection,
                customDirection: ideaSel.customDirection,
              }));
              if (d?.title) {
                setExplicitChoices((prev) => {
                  const next = { ...prev, idea: d.title };
                  if (isDifferent) {
                    delete next.opening;
                  }
                  return next;
                });
              }
              if (isDifferent) {
                setCompletedStages((prev) => prev.filter((s) => !['opening', 'story', 'script', 'video'].includes(s)));
              }
              const hasDownstream = completedStages.includes('script') || completedStages.includes('video') || scenes.length > 0 || Boolean(generatedScript);
              if (hasDownstream) {
                setHasStaleWarning(true);
              }
            }}
            customDirection={customDirection}
            setCustomDirection={(cd) => {
              setCustomDirection(cd);
              const ideaSel = resolveIdeaSelection(selectedDirection, cd);
              setCreativeDNA((prev) => ({
                ...prev,
                direction: ideaSel.direction,
                ideaSource: ideaSel.ideaSource,
                selectedAiDirection: ideaSel.selectedAiDirection,
                customDirection: ideaSel.customDirection,
              }));
              if (cd && cd.trim()) {
                setExplicitChoices((prev) => {
                  const next = { ...prev, idea: cd.trim() };
                  delete next.opening;
                  return next;
                });
                setCompletedStages((prev) => prev.filter((s) => !['opening', 'story', 'script', 'video'].includes(s)));
              }
            }}
            isLoadingDirections={isLoadingDirections}
            onContinue={async () => {
              const ideaSel = resolveIdeaSelection(
                selectedDirection,
                customDirection,
                directionsList.find((d) => d.recommended) || directionsList[0]
              );
              const activeD = ideaSel.direction;
              if (activeD) {
                // Only backfill selectedDirection when falling back to recommended AI idea;
                // never collapse a custom user idea into selectedDirection.
                if (!selectedDirection && ideaSel.ideaSource === 'ai') {
                  setSelectedDirection(ideaSel.selectedAiDirection);
                }
                setCreativeDNA((prev) => ({
                  ...prev,
                  direction: ideaSel.direction,
                  ideaSource: ideaSel.ideaSource,
                  selectedAiDirection: ideaSel.selectedAiDirection,
                  customDirection: ideaSel.customDirection,
                }));
                setExplicitChoices((prev) => ({ ...prev, idea: ideaSel.label }));
              }

              const currentIdeaKey = activeD?.id || activeD?.title || '';
              const ideaChanged = !loadedHooksDirectionKeyRef.current || loadedHooksDirectionKeyRef.current !== currentIdeaKey;

              markStageComplete('idea');
              setStudioStage('opening');
              window.scrollTo({ top: 0, behavior: 'smooth' });

              if (ideaChanged || !hooksList.length) {
                // Clear downstream stale state when the idea has changed
                setSelectedHook(null);
                setCustomHook('');
                setPlotsList([]);
                setSelectedPlot(null);
                setCustomPlot('');
                setStoryWorldData(null);
                setScenes([]);
                setScriptPayloadData(null);
                setHasStaleWarning(false);
                setCompletedStages((prev) => prev.filter((s) => !['opening', 'story', 'script', 'video'].includes(s)));
                setExplicitChoices((prev) => {
                  const next = { ...prev };
                  delete next.opening;
                  return next;
                });

                await loadHooks(true, null, activeD);
              }
            }}
            onBack={() => {
              setStudioStage('understanding');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {studioStage === 'opening' && (
          <Screen05Opening
            userContext={userContext}
            selectedDirection={selectedDirection}
            hooksList={hooksList}
            selectedHook={selectedHook}
            setSelectedHook={(h) => {
              setSelectedHook(h);
              setCreativeDNA((prev) => ({ ...prev, hook: h }));
              const hookLabel = h?.archetype || h?.hookLine;
              if (hookLabel) {
                setExplicitChoices((prev) => ({ ...prev, opening: hookLabel }));
              }
              const hasDownstream = completedStages.includes('script') || completedStages.includes('video') || scenes.length > 0 || Boolean(generatedScript);
              if (hasDownstream) {
                setHasStaleWarning(true);
              }
            }}
            customHook={customHook}
            setCustomHook={setCustomHook}
            isLoadingHooks={isLoadingHooks}
            onContinue={async () => {
              const activeH = selectedHook || (customHook ? { hookLine: customHook, archetype: 'Custom Hook' } : hooksList.find((h) => h.recommended) || hooksList[0]);
              if (activeH) {
                if (!selectedHook) {
                  setSelectedHook(activeH);
                  setCreativeDNA((prev) => ({ ...prev, hook: activeH }));
                }
                setExplicitChoices((prev) => ({ ...prev, opening: activeH.archetype || activeH.hookLine || customHook }));
              }
              markStageComplete('opening');
              setIsBusy(true);
              startTimer();
              setStudioStage('script');
              window.scrollTo({ top: 0, behavior: 'smooth' });

              // Automatically ensure story world exists in background, then synthesize master script
              try {
                if (!storyWorldData) {
                  await loadStoryWorld(true, null, null, activeH);
                }
                await handleSynthesizeMasterScript();
              } catch (err) {
                setIsBusy(false);
                stopTimer();
                setErrorMessage(err.message || 'Failed to synthesize master script. You can retry from the opening hook.');
              }
            }}
            onBack={() => {
              setStudioStage('idea');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {studioStage === 'story' && (() => {
          setTimeout(() => setStudioStage('script'), 0);
          return null;
        })()}

        {studioStage === 'script' && (
          <Screen07Script
            scenes={scenes}
            setScenes={setScenes}
            setting={setting}
            setSetting={setSetting}
            character1={character1}
            character2={character2}
            onUpdateCharacters={(c1, c2) => {
              if (c1) setCharacter1(typeof c1 === 'string' ? c1 : c1.name);
              if (c2) setCharacter2(typeof c2 === 'string' ? c2 : c2.name);
            }}
            onUpdateSetting={(s) => setSetting(s)}
            userContext={userContext}
            isBusy={isBusy}
            elapsedTime={elapsedTime}
            onApproveScript={() => {
              markStageComplete('script');
              setStudioStage('video');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              handleRunVideoProduction();
            }}
            onBack={() => {
              setStudioStage('opening');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onTryAnotherVersion={() => {
              handleSynthesizeMasterScript();
            }}
            onOpenRewriteModal={(idx) => {
              setRewriteTargetSceneIndex(idx);
              setIsSceneRewriteOpen(true);
            }}
            onSaveProject={handleSaveCurrentProject}
            isProjectSaved={isCurrentProjectSaved}
            isSavingProject={isSavingProject}
            onOpenScriptModal={() => setIsScriptModalOpen(true)}
            guardrailReport={scriptGuardrailReport}
            onboardingState={onboardingState}
            onDismissTip={handleDismissTip}
            onBehaviorEvent={handleBehaviorEvent}
            draftStatus={draftStatus}
            scriptSaveError={scriptSaveError}
            onRetrySave={handleSaveCurrentProject}
            onMarkUnsaved={() => {
              setIsCurrentProjectSaved(false);
              setScriptSaveError('');
            }}
          />
        )}

        {studioStage === 'video' && (
          <Screen08Video
            userContext={userContext}
            creativeDNA={creativeDNA}
            scenes={scenes}
            onMakeVideo={handleRunVideoProduction}
            onBack={() => {
              setStudioStage('script');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isRendering={isRendering}
            renderStatusText={renderStatusText}
            elapsedTime={elapsedTime}
            videoUrl={videoUrl}
            projectId={activeProjectId}
            userId={currentUser?.id}
            onboardingState={onboardingState}
            onDismissTip={handleDismissTip}
            onCreateAnother={handleCreateAnotherFromBrief}
            onRegenerateVideo={handleRegenerateCurrentVideo}
            onStartNewBrief={handleStartNewBrief}
            errorMessage={errorMessage}
          />
        )}

        {/* Scene-Level AI Rewrite Modal */}
        <SceneAIRewriteModal
          isOpen={isSceneRewriteOpen}
          onClose={() => setIsSceneRewriteOpen(false)}
          sceneIndex={rewriteTargetSceneIndex}
          currentSceneText={scenes[rewriteTargetSceneIndex]}
          onApplyRewrite={handleApplySceneRewrite}
          isRewriting={isRewritingScene}
        />
        </main>
          </>
        )}
      </AppShell>

      {/* New Film Confirmation Modal (Global across Simple Studio, Director Mode, and Views) */}
      {isNewFilmConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => { if (!isSavingNewFilm) handleCancelNewFilm(); }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              maxWidth: 480,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: 'var(--accent-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--cc-emphasis)',
                  }}
                >
                  <RotateCcw size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {pendingBusinessSwitch
                    ? `Switch to ${pendingBusinessSwitch.name || pendingBusinessSwitch.businessName}?`
                    : newFilmAction === 'restart' ? 'Restart This Film?' : 'Start a New Film?'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancelNewFilm}
                disabled={isSavingNewFilm}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              <p style={{ margin: '0 0 10px 0' }}>
                {pendingBusinessSwitch
                  ? `Your current project will be saved under My Projects, then a fresh film will start for ${pendingBusinessSwitch.name || pendingBusinessSwitch.businessName}.`
                  : newFilmAction === 'restart'
                    ? 'Your progress will be saved under My Projects, then this film will restart from the starting point you chose.'
                  : 'Your progress will be saved under My Projects, where you can return to it later. Then you’ll start a new film from the page with the three starting options.'}
              </p>
              {pendingBusinessSwitch && isRendering ? (
                <p style={{ margin: '0 0 10px 0' }}>
                  The video that's rendering keeps going and will be saved to {userContext.businessName ? <strong>{userContext.businessName}</strong> : 'its project'} in My Projects.
                </p>
              ) : null}
              {newFilmSaveError ? (
                <p role="alert" style={{ margin: '12px 0 0', color: 'var(--status-error, var(--cc-danger))' }}>{newFilmSaveError}</p>
              ) : null}
              {userContext.businessName && !pendingBusinessSwitch ? (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Store size={14} style={{ color: 'var(--cc-emphasis)', flexShrink: 0 }} />
                  <span>
                    Your brand profile for <strong>{userContext.businessName}</strong> will stay saved.
                  </span>
                </div>
              ) : null}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelNewFilm();
                }}
                disabled={isSavingNewFilm}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isSavingNewFilm ? 'wait' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleConfirmNewFilm();
                }}
                disabled={isSavingNewFilm}
                style={{
                  padding: '8px 18px',
                  borderRadius: 999,
                  backgroundColor: 'var(--cc-action)',
                  color: 'var(--cc-on-action)',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isSavingNewFilm ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px var(--accent-glow)',
                }}
              >
                <RotateCcw size={14} style={{ pointerEvents: 'none' }} />
                <span style={{ pointerEvents: 'none' }}>{isSavingNewFilm ? 'Saving…' : pendingBusinessSwitch ? 'Save & Switch Business' : newFilmAction === 'restart' ? 'Save & Restart Film' : 'Save & Start New Film'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification (Global across all views) */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--cc-selected-line)',
            color: 'var(--text-primary)',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Existing Script Modal (V2 Entry Point) */}
      <ExistingScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        onImportScript={handleImportExistingScript}
        businessName={userContext.businessName}
        businessType={userContext.businessType}
        language={userContext.language}
        creativeStyle={userContext.creativeStyle}
        targetDuration={userContext.targetDuration || '20s'}
        aspectRatio={userContext.aspectRatio || (userContext.platform?.includes('16:9') ? '16:9' : userContext.platform?.includes('1:1') ? '1:1' : '9:16')}
        brandTone={userContext.brandTone || 'Warm & Authentic'}
      />

      {/* URL Research Modal (V2 Entry Point) */}
      <UrlResearchModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onApplyUrlData={handleApplyUrlData}
        initialUrl={userContext.websiteUrl}
        businessName={userContext.businessName}
        businessType={userContext.businessType}
        town={userContext.town}
      />

      {/* Auth Modal (Sign in / Sign up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Business Onboarding Wizard Modal */}
      <BusinessOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => {
          setIsOnboardingModalOpen(false);
          setEditingBusiness(null);
        }}
        onComplete={handleOnboardingComplete}
        initialData={editingBusiness || {}}
      />

      {/* Account Settings & Delete Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
        onUpdateProfile={handleUpdateProfile}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onReplayTour={handleReplayTour}
        onResumeTour={handleResumeTour}
        hasPausedTour={hasResumableTourProgress(onboardingState, TOUR_STEPS.length)}
        pausedTourStep={onboardingState?.lastTourStep || 0}
        totalTourSteps={TOUR_STEPS.length}
        projectCount={displayProjects.length}
        businessCount={userBusinesses.length}
      />

      {/* Mid-Project Mode Switch Explanation & Confirmation Modal */}
      <ModeSwitchModal
        isOpen={Boolean(pendingModeSwitch)}
        targetMode={pendingModeSwitch?.targetMode || 'advanced'}
        savedItems={pendingModeSwitch?.savedItems || []}
        pendingItems={pendingModeSwitch?.pendingItems || []}
        uncarriedItems={pendingModeSwitch?.uncarriedItems || []}
        preservedItems={pendingModeSwitch?.preservedItems || []}
        onConfirm={handleConfirmModeSwitch}
        onCancel={handleCancelModeSwitch}
      />

      {/* First-Time Welcome Modal (never overlaps BusinessOnboardingModal) */}
      <WelcomeOnboardingModal
        isOpen={Boolean(isWelcomeOpen && !isOnboardingModalOpen && !isAuthModalOpen)}
        onStartTour={handleWelcomeStartTour}
        onSkip={handleWelcomeSkip}
      />

      {/* Config-Driven Interactive Product Tour */}
      <ProductTourEngine
        isOpen={isTourOpen}
        steps={TOUR_STEPS}
        currentIndex={tourStepIndex}
        onStepChange={setTourStepIndex}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
        onPause={handleTourPause}
        onRestart={handleReplayTour}
        onStepAction={handleTourStepAction}
      />

      {/* Feedback & Issue Reporting Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        currentUser={currentUser}
        activeBusiness={userContext}
        activeProject={userProjects.find((p) => p.id === activeProjectId) || null}
        activeProjectId={activeProjectId}
        studioMode={studioMode}
        studioStage={studioStage}
        activeView={activeAppView}
        generationId={activeRunIdRef?.current || null}
        getAuthHeaders={getAuthHeaders}
      />
    </StudioDispatchContext.Provider>
  </StudioStateContext.Provider>
  );
}
