import React, { useState, useEffect, useRef, useReducer } from 'react';
import {
  studioReducer,
  initialStudioState,
  createInitialStudioState,
  StudioActionTypes,
  isStaleResponse,
} from './context/studioReducer.js';
import {
  StudioStateContext,
  StudioDispatchContext,
  useStudioState,
  useStudioDispatch,
} from './context/studioState.jsx';
import AppShell from './components/v2/AppShell.jsx';
import CreationEntryHub from './components/v2/CreationEntryHub.jsx';
import SimpleBusinessStudio from './components/v2/SimpleBusinessStudio.jsx';
import ExistingScriptModal from './components/v2/ExistingScriptModal.jsx';
import UrlResearchModal from './components/v2/UrlResearchModal.jsx';
import AuthModal from './components/v2/AuthModal.jsx';
import AuthScreen from './components/v2/AuthScreen.jsx';
import BusinessOnboardingModal from './components/v2/BusinessOnboardingModal.jsx';
import ScriptLibraryView from './components/v2/ScriptLibraryView.jsx';
import BusinessProfileView from './components/v2/BusinessProfileView.jsx';
import AccountModal from './components/v2/AccountModal.jsx';
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
        <div style={{ padding: 24, backgroundColor: 'var(--bg-surface)', border: '1px solid #ef4444', borderRadius: 10, color: 'var(--text-primary)', textAlign: 'center' }}>
          <h3 style={{ color: '#ef4444', margin: '0 0 8px' }}>Error Loading Creative Options</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{this.state.error?.message || 'Unexpected render error'}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '8px 16px', backgroundColor: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
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
    duration: '15s',
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
  const [toastMessage, setToastMessage] = useState('');

  // General UI errors & modals
  const [errorMessage, setErrorMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [qualityFailures, setQualityFailures] = useState([]);

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

  const [activeAppView, setActiveAppViewState] = useState('hub');
  const setActiveAppView = (viewOrUpdater) => {
    setActiveAppViewState((prev) => {
      const nextView = typeof viewOrUpdater === 'function' ? viewOrUpdater(prev) : viewOrUpdater;
      // If user is currently on the creation hub and clicks 'studio' without active film progress, stay on 'hub'
      if ((prev === 'hub' || prev === 'home') && nextView === 'studio' && (!completedStages || completedStages.length === 0)) {
        return 'hub';
      }
      if (nextView === 'studio' && userContext.businessName && userContext.businessName.trim().length > 0 && studioStage === 'business') {
        markStageComplete('business');
        setStudioStage('brief');
      }
      return nextView;
    });
  };
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);

  const handleImportExistingScript = ({
    scenes: importedScenes,
    generatedScript: importedScript,
    character1: c1,
    character2: c2,
    setting: st,
    language: lang,
    creativeStyle: stl,
  }) => {
    if (c1) setCharacter1(c1);
    if (c2) setCharacter2(c2);
    if (st) setSetting(st);
    if (lang) updateUserContext('language', lang);
    if (stl) updateUserContext('creativeStyle', stl);

    setScenes(importedScenes);
    setGeneratedScript(importedScript);

    // Fast-track past stages 1-6 straight into Stage 7 (Script Studio)
    setCompletedStages(['business', 'brief', 'settings', 'idea', 'opening', 'story']);
    setStudioStage('script');
    setActiveAppView('studio');
    setToastMessage('Script validated and imported into Stage 07!');
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleApplyUrlData = ({
    websiteUrl: url,
    businessName: bName,
    businessType: bType,
    town: tw,
    brief: br,
  }) => {
    if (bName) updateUserContext('businessName', bName);
    if (bType) updateUserContext('businessType', bType);
    if (tw) updateUserContext('town', tw);
    if (url) updateUserContext('websiteUrl', url);
    if (br) updateUserContext('brief', br);

    markStageComplete('business');
    setStudioStage('brief');
    setActiveAppView('studio');
    setToastMessage('Website analyzed! Brief generated in Stage 02.');
    setTimeout(() => setToastMessage(''), 4000);
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
  const [userProjects, setUserProjects] = useState([]);
  const [userBusinesses, setUserBusinesses] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isCurrentProjectSaved, setIsCurrentProjectSaved] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

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
      }
      if (projRes.ok) {
        const pData = await projRes.json();
        setUserProjects(pData.projects || []);
      }
    } catch (err) {
      console.error('Failed to load user projects/businesses:', err);
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

  const handleAuthSuccess = (userDataOrUser, possibleToken, authMode) => {
    const user = userDataOrUser?.user || userDataOrUser;
    const token = possibleToken || userDataOrUser?.token;
    if (user) setCurrentUser(user);
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
      if (currentUser?.id) {
        localStorage.removeItem(`clevertize_user_context_${currentUser.id}`);
      }
    } catch {}
    setAuthToken(null);
    setCurrentUser(null);
    setUserProjects([]);
    setUserBusinesses([]);
    setActiveProjectId(null);
    setIsCurrentProjectSaved(false);
    setUserContext(createEmptyUserContext());
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
      if (currentUser?.id) {
        localStorage.removeItem(`clevertize_user_context_${currentUser.id}`);
      }
    } catch {}

    setAuthToken(null);
    setCurrentUser(null);
    setUserProjects([]);
    setUserBusinesses([]);
    setActiveProjectId(null);
    setIsCurrentProjectSaved(false);
    setUserContext(createEmptyUserContext());
    setActiveAppView('home');
    setStudioStage('business');

    setToastMessage('Your CleverCuts account has been permanently deleted.');
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
    if (!currentUser || !authToken) {
      setIsAuthModalOpen(true);
      setToastMessage('Please sign in or create an account to save your project.');
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    try {
      const title = userContext.businessName
        ? `${userContext.businessName} - ${userContext.occasion || userContext.selectedGoalId || 'Ad Film'}`
        : 'Untitled Script';

      const payload = {
        id: activeProjectId || undefined,
        title,
        businessName: userContext.businessName || '',
        businessType: userContext.businessType || '',
        town: userContext.town || '',
        language: userContext.language || 'English',
        creativeStyle: userContext.creativeStyle || 'UGC / Creator-style',
        status: videoUrl ? 'video_ready' : (scenes && scenes.length > 0 ? 'script_ready' : 'draft'),
        videoUrl: videoUrl || null,
        brief: userContext.brief || '',
        scenes: scenes || [],
        setting: setting || '',
        character1: character1 || '',
        character2: character2 || '',
        stages: {
          directionsList,
          selectedDirectionIndex,
          hookAngles,
          selectedHookIndex,
          storyWorlds,
          selectedStoryWorldIndex,
          generatedScript,
          completedStages,
        },
        brandContext: extractBrandProfile(userContext),
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && (data.success || data.project)) {
        setActiveProjectId(data.project.id);
        setIsCurrentProjectSaved(true);
        setUserProjects((prev) => {
          const idx = prev.findIndex((p) => p.id === data.project.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = data.project;
            return next;
          }
          return [data.project, ...prev];
        });
        setToastMessage('Script and project saved to your library!');
        setTimeout(() => setToastMessage(''), 4000);
      } else {
        setToastMessage(`Failed to save: ${data.error || 'Server error'}`);
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error saving project:', err);
      setToastMessage('Failed to save project. Check your connection.');
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  const handleOpenProject = (proj) => {
    if (!proj) return;
    setActiveProjectId(proj.id);
    setIsCurrentProjectSaved(true);

    if (proj.brandContext) {
      setUserContext((prev) => ({ ...prev, ...proj.brandContext }));
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

    if (proj.stages) {
      if (proj.stages.directionsList) setDirectionsList(proj.stages.directionsList);
      if (typeof proj.stages.selectedDirectionIndex === 'number') {
        setSelectedDirectionIndex(proj.stages.selectedDirectionIndex);
      }
      if (proj.stages.hookAngles) setHookAngles(proj.stages.hookAngles);
      if (typeof proj.stages.selectedHookIndex === 'number') {
        setSelectedHookIndex(proj.stages.selectedHookIndex);
      }
      if (proj.stages.storyWorlds) setStoryWorlds(proj.stages.storyWorlds);
      if (typeof proj.stages.selectedStoryWorldIndex === 'number') {
        setSelectedStoryWorldIndex(proj.stages.selectedStoryWorldIndex);
      }
      if (proj.stages.generatedScript) setGeneratedScript(proj.stages.generatedScript);
      if (proj.stages.completedStages) setCompletedStages(proj.stages.completedStages);
    } else {
      setCompletedStages(['business', 'brief', 'settings', 'idea', 'opening', 'story', 'script']);
    }

    if (proj.videoUrl) {
      setVideoUrl(proj.videoUrl);
      setStudioStage('video');
    } else {
      setVideoUrl('');
      setStudioStage('script');
    }
    setActiveAppView('studio');
    setToastMessage(`Loaded "${proj.title || 'Project'}" into Studio.`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleDeleteProject = async (projectId) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        setUserProjects((prev) => prev.filter((p) => p.id !== projectId));
        if (activeProjectId === projectId) {
          setActiveProjectId(null);
          setIsCurrentProjectSaved(false);
        }
        setToastMessage('Project removed from library.');
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    }
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

  const handleOnboardingComplete = async (onboardingData) => {
    setIsOnboardingModalOpen(false);
    setEditingBusiness(null);
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

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      baseSpeechTextRef.current = userContext.brief.trim();
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
    const targetDur = userContext.duration || '15s';
    const durNum = parseInt(targetDur, 10) || 15;
    const perSceneSec = (durNum / 4).toFixed(1);

    const specialtyParts = [
      userContext.specialty?.trim(),
      userContext.brief?.trim() ? `Creative Brief/Idea: ${userContext.brief.trim()}` : null,
      userContext.targetAudience?.trim() ? `Target Audience: ${userContext.targetAudience.trim()}` : null,
      activeGoal.objective ? `Ad Focus: ${activeGoal.objective}` : null,
      `Platform: ${userContext.platform || 'Instagram Reels / 9:16'}`,
      `Creative Style: ${userContext.creativeStyle || 'UGC / Creator-style'}`,
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
      platform: userContext.platform || 'Instagram Reels / 9:16',
      creativeStyle: userContext.creativeStyle || 'UGC / Creator-style',
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
      logo: userContext.logo ? { mime: userContext.logo.mime, data: userContext.logo.data } : null,
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
        headers: { 'Content-Type': 'application/json' },
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

  // 2. Fetching Creative Direction Territories
  const loadCreativeDirections = async (force = false) => {
    if (directionsList.length && !force) return;
    const brand = userContext.businessName.trim();
    const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
      ? userContext.customBusinessType.trim()
      : userContext.businessType;
    if (!brand) return;

    setIsLoadingDirections(true);
    try {
      const res = await fetch('/api/creative/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: brand,
          businessType: bType,
          town: userContext.town || '',
          brief: userContext.brief || '',
          targetAudience: userContext.targetAudience || '',
          research: researchData,
        }),
      });
      if (res.ok) {
        const list = await res.json();
        setDirectionsList(list);
        const rec = list.find((d) => d.recommended) || list[0];
        setSelectedDirection(rec);
        setCreativeDNA((prev) => ({ ...prev, direction: rec }));
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

  const loadHooks = async (force = false, overrideLang = null, overrideDirection = null) => {
    const brand = userContext.businessName.trim();
    const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
      ? userContext.customBusinessType.trim()
      : userContext.businessType;
    const lang = overrideLang || userContext.language || 'English';
    const activeDir = overrideDirection || selectedDirection || (customDirection ? { title: customDirection } : directionsList.find((d) => d.recommended) || directionsList[0] || { title: 'Everyday Relatable' });
    const activeKey = activeDir?.id || activeDir?.title || '';

    if (hooksList.length && !force) {
      if (loadedHooksDirectionKeyRef.current === activeKey) return;
    }

    setIsLoadingHooks(true);
    try {
      const res = await fetch('/api/creative/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: brand,
          businessType: bType,
          brief: userContext.brief || '',
          direction: activeDir,
          language: lang,
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: brand,
          businessType: bType,
          brief: userContext.brief || '',
          direction: selectedDirection || { title: customDirection || 'Everyday Relatable' },
          hook: selectedHook || { hookLine: customHook || '' },
          format: userContext.creativeStyle || 'Storytelling',
          language: lang,
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
    const activeDir = overrideDirection || selectedDirection || (customDirection ? { title: customDirection } : directionsList.find((d) => d.recommended) || directionsList[0] || { title: 'Everyday Relatable' });
    const activeHk = overrideHook || selectedHook || (customHook ? { hookLine: customHook } : hooksList.find((h) => h.recommended) || hooksList[0] || { hookLine: '' });

    setIsLoadingStory(true);
    try {
      const res = await fetch('/api/creative/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    const activeDNA = {
      direction: selectedDirection || (customDirection ? { title: customDirection } : directionsList.find((d) => d.recommended)),
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form,
          creativeDNA: activeDNA,
          constraints: constraintsList,
          avoid: avoidList,
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneText: scenes[rewriteTargetSceneIndex],
          sceneIndex: rewriteTargetSceneIndex,
          totalScenes: scenes.length,
          instruction,
          form: buildSessionPayload(),
          characters: `${character1} | ${character2}`,
          setting,
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const payload = buildSessionPayload();

    try {
      // 1. Run the entire automated Creative Intelligence pipeline
      const pipelineRes = await fetch('/api/pipeline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        logo: userContext.logo ? { mime: userContext.logo.mime, data: userContext.logo.data } : null,
        shotSpec: pipeData.shotSpec || null,
      };

      const runRes = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runPayload),
      });
      const runData = await runRes.json();

      if (!runRes.ok || runData.error) {
        throw new Error(runData.error || 'Failed to dispatch render job to Magnific.');
      }

      // 3. Poll Magnific status
      await pollRenderStatus(runData.runId);
    } catch (err) {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // 1. Record approved script to store.js
      if (sessionId) {
        await fetch(`/api/session/${sessionId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        logo: userContext.logo ? { mime: userContext.logo.mime, data: userContext.logo.data } : null,
        shotSpec: shotSpec || null,
      };

      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runPayload),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to dispatch render job to Magnific.');
      }

      setRenderStatusText('Rendering neural video frames…');
      await pollRenderStatus(data.runId);
    } catch (err) {
      stopTimer();
      setIsRendering(false);
      setErrorMessage(err.message || 'Error occurred while initiating video render.');
    }
  };

  // Poll /api/status/:runId
  const pollRenderStatus = async (runId) => {
    const maxAttempts = 160;
    for (let i = 1; i <= maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 15000));
      try {
        const res = await fetch(`/api/status/${encodeURIComponent(runId)}`);
        const data = await res.json();
        if (data.error) continue;

        if (data.videoUrl) {
          stopTimer();
          setVideoUrl(data.videoUrl);
          setIsRendering(false);
          setIsBusy(false);
          setFastStageIndex(4);
          setCurrentStep('render');

          // Auto-sync videoUrl into saved projects list if active project exists
          if (activeProjectId) {
            setUserProjects((prev) =>
              prev.map((p) =>
                p.id === activeProjectId ? { ...p, videoUrl: data.videoUrl, status: 'video_ready' } : p
              )
            );
          }
          return;
        }

        if (data.failed) {
          stopTimer();
          setIsRendering(false);
          setIsBusy(false);
          setCurrentStep('input');
          const detail = data.error || (data.status === 'completed_with_errors' ? 'The Magnific workflow ran into internal generation errors (such as missing/low-resolution images, node timeout, or content filters). Please check your product photo or try re-generating.' : `Rendering failed: ${data.status}`);
          setErrorMessage(detail);
          return;
        }

        const niceStatus = data.status && !/run|process|pending|queue|unknown/i.test(data.status)
          ? data.status
          : 'Synthesizing frames & audio in neural pipeline…';
        setRenderStatusText(niceStatus);
      } catch (pollErr) {
        // Keep waiting despite transient network drops
      }
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

  // Trigger New Film Flow: Open in-app confirmation modal (or execute if bypassed)
  const handleStartNewProject = (bypassConfirm = false) => {
    if (bypassConfirm === true) {
      handleExecuteNewProject(false);
      return;
    }
    setIsNewFilmConfirmOpen(true);
  };

  const handleExecuteNewProject = (clearBrand = false) => {
    try {
      setIsNewFilmConfirmOpen(false);
      setBrandResetKey((prev) => prev + 1);

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

      setSessionId(null);
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

      // Reset film-specific inputs while strictly preserving brand profile (or clearing if requested)
      setUserContext((prev) => {
        const brand = clearBrand ? {} : (typeof extractBrandProfile === 'function' ? extractBrandProfile(prev) : {});
        const next = {
          ...prev,
          ...(clearBrand ? { businessName: '', businessType: 'Retail Store', town: '', websiteUrl: '', logo: null } : brand),
          brief: '',
          productPhoto: null,
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
        };
        try {
          localStorage.setItem('clevertize_user_context', JSON.stringify(clearBrand ? {} : brand));
        } catch (err) {
          // ignore
        }
        return next;
      });

      setCompletedStages([]);
      setStudioStage('brief');
      setActiveAppView('hub');
      setCurrentStep('input');
      setCreationStep(1);
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }

      setToastMessage('✨ Fresh film project started!');
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

  // Safe Back Navigation to Previous Stage
  const handleGoBack = () => {
    setErrorMessage('');
    setQualityFailures([]);
    setIsChangeOpen(false);

    if (studioStage === 'video') setStudioStage('script');
    else if (studioStage === 'script') setStudioStage('story');
    else if (studioStage === 'story') setStudioStage('opening');
    else if (studioStage === 'opening') setStudioStage('idea');
    else if (studioStage === 'idea') setStudioStage('settings');
    else if (studioStage === 'settings') setStudioStage('brief');
    else if (studioStage === 'brief') {
      setActiveAppView('home');
      setStudioStage('entry');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Run Video Production Pipeline
  const handleRunVideoProduction = async (overrideParams = null) => {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
        ? userContext.customBusinessType.trim()
        : userContext.businessType;

      const runPayload = {
        scenes: targetScenes.map((s) => (typeof s === 'string' ? s : s.visual || s.text || '').trim()).filter(Boolean),
        character1: (character1 || '').trim(),
        character2: (character2 || '').trim(),
        setting: (setting || '').trim(),
        duration: userContext.duration || '15s',
        platform: userContext.platform || 'Instagram Reels / 9:16',
        product: userContext.specialty || userContext.offer || userContext.brief || bType || 'featured product',
        productName: userContext.specialty || bType || 'featured product',
        businessType: bType,
        businessName: userContext.businessName.trim(),
        specialty: userContext.specialty || '',
        brief: userContext.brief || '',
        productPhoto: userContext.productPhoto ? { mime: userContext.productPhoto.mime, data: userContext.productPhoto.data } : null,
        logo: userContext.logo ? { mime: userContext.logo.mime, data: userContext.logo.data } : null,
        shotSpec: shotSpec || null,
      };

      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runPayload),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to dispatch render job.');
      }

      setRenderStatusText('Creating scenes and putting everything together…');
      await pollRenderStatus(data.runId);
      markStageComplete('video');
    } catch (err) {
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

      setScenes(formattedScenes);
      setGeneratedScript(packageData.fullScriptText || null);
      if (packageData.brief) updateUserContext('brief', packageData.brief);
      if (packageData.language) updateUserContext('language', packageData.language);
      if (packageData.creativeStyle) updateUserContext('creativeStyle', packageData.creativeStyle);
      if (packageData.productPhoto) updateUserContext('productPhoto', packageData.productPhoto);

      await handleRunVideoProduction({
        scenes: formattedScenes,
        brief: packageData.brief || userContext.brief,
        productPhoto: packageData.productPhoto || userContext.productPhoto,
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
        border: file ? '1px solid var(--accent-primary)' : '1px dashed var(--border-default)',
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
              color: file ? 'var(--accent-primary)' : 'var(--text-tertiary)',
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
            <div style={{ fontSize: 11, color: file ? 'var(--success)' : 'var(--text-tertiary)', marginTop: 2 }}>
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
                fontSize: 11,
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
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Visual asset attached for AI rendering engine</span>
        </div>
      )}
    </div>
  );

  // 1. Initial auth token verification loading screen
  if (isAuthChecking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#0B0C0F',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          color: '#F5F7FA',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Clapperboard size={22} color="#FFFFFF" />
        </div>
        <div style={{ fontSize: 13, color: '#A6ACB8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} className="icon-spinner" style={{ color: '#6366F1' }} />
          <span>Starting CleverCuts...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated user: show full-screen AuthScreen
  if (!currentUser || !authToken) {
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <StudioStateContext.Provider value={studioState}>
      <StudioDispatchContext.Provider value={studioDispatch}>
        <AppShell
          activeView={activeAppView}
          onSelectView={setActiveAppView}
          studioMode={studioMode}
          onToggleStudioMode={() => handleSetStudioMode(studioMode === 'simple' ? 'advanced' : 'simple')}
          onSetStudioMode={handleSetStudioMode}
          currentStage={studioStage}
          completedStages={completedStages}
          onNavigateStage={handleNavigateStage}
          onStartNewFilm={() => {
            if (userBusinesses.length === 0 || !userContext.businessName) {
              setIsOnboardingModalOpen(true);
              return;
            }
            handleStartNewProject(false);
          }}
          businessName={userContext.businessName}
          businessType={userContext.businessType}
          town={userContext.town}
          brandLogo={userContext.brandLogo}
          activeBusiness={userContext}
          businesses={userBusinesses}
          onSelectBusiness={(biz) => {
            setUserContext((prev) => ({
              ...prev,
              businessId: biz.id,
              businessName: biz.name || biz.businessName,
              businessType: biz.category || biz.businessType,
              town: biz.town || '',
              area: biz.area || '',
              websiteUrl: biz.websiteUrl || '',
              targetAudience: biz.targetAudience || '',
              brandTone: biz.brandTone || prev.brandTone,
              brandLogo: biz.logo || biz.brandLogo || null,
              logo: biz.logo || biz.brandLogo || null,
            }));
            setToastMessage(`Switched active business to ${biz.name || biz.businessName}`);
            setTimeout(() => setToastMessage(''), 3000);
          }}
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
          onLogout={handleLogout}
          onOpenOnboarding={() => {
            setEditingBusiness(null);
            setIsOnboardingModalOpen(true);
          }}
          projectCount={userProjects.length}
        >
          {/* Offline Connectivity Notification Banner */}
          {!isOnline && (
            <div
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
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
                if (userBusinesses.length === 0 || !userContext.businessName) {
                  setIsOnboardingModalOpen(true);
                  return;
                }
                setActiveAppView('studio');
                setStudioStage('brief');
              }}
              onOpenScriptModal={() => {
                if (userBusinesses.length === 0 || !userContext.businessName) {
                  setIsOnboardingModalOpen(true);
                  return;
                }
                setIsScriptModalOpen(true);
              }}
              onOpenUrlModal={() => {
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
              recentProjects={userProjects}
              onOpenProject={handleOpenProject}
              currentUser={currentUser}
              onNavigateProjects={() => setActiveAppView('projects')}
            />
          ) : (activeAppView === 'projects' || activeAppView === 'library') ? (
            <ScriptLibraryView
              projects={userProjects}
              businesses={userBusinesses}
              currentProjectId={activeProjectId}
              onOpenProject={handleOpenProject}
              onDeleteProject={handleDeleteProject}
              onNewProject={() => {
                handleStartNewProject(false);
                setActiveAppView('studio');
              }}
              onSignIn={() => setIsAuthModalOpen(true)}
              currentUser={currentUser}
            />
          ) : (activeAppView === 'businesses' || activeAppView === 'business') ? (
            <BusinessProfileView
              businesses={userBusinesses}
              activeBusiness={userContext}
              onSelectBusiness={(biz) => {
                setUserContext((prev) => ({
                  ...prev,
                  businessId: biz.id,
                  businessName: biz.name || biz.businessName,
                  businessType: biz.category || biz.businessType,
                  town: biz.town || '',
                  area: biz.area || '',
                  websiteUrl: biz.websiteUrl || '',
                  targetAudience: biz.targetAudience || '',
                  brandTone: biz.brandTone || prev.brandTone,
                  brandLogo: biz.logo || biz.brandLogo || null,
                  logo: biz.logo || biz.brandLogo || null,
                }));
                setToastMessage(`Switched active business to ${biz.name || biz.businessName}`);
                setTimeout(() => setToastMessage(''), 3000);
              }}
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
          ) : studioMode === 'simple' ? (
            <SimpleBusinessStudio
              businessName={userContext.businessName}
              businessType={userContext.businessType}
              town={userContext.town}
              initialBrief={userContext.brief}
              initialLanguage={creativeDNA.language || 'English'}
              initialStyle={creativeDNA.creativeStyle || 'UGC / Creator-style'}
              brandLogo={userContext.brandLogo || userContext.logo}
              onSwitchToDirectorMode={() => handleSetStudioMode('advanced')}
              onProduceVideo={handleSimpleProduceVideo}
              isProducingVideo={isRendering}
              producedVideoUrl={videoUrl}
              videoRunError={errorMessage}
              onEditBrand={() => {
                setEditingBusiness(userContext);
                setIsOnboardingModalOpen(true);
              }}
            />
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
                <Building2 size={18} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
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
                    Town / City <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>(Optional)</span>
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
                    Area / Neighborhood <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>(Optional)</span>
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
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8 }}>
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
                    borderRadius: 6,
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
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
        {errorMessage && (
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
                    borderRadius: 6,
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
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
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
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
            onContinue={() => {
              if (!userContext.brief.trim() && !userContext.specialty.trim() && !userContext.offer.trim()) {
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
          />
        )}

        {studioStage === 'settings' && (
          <Screen03Settings
            userContext={userContext}
            updateUserContext={updateUserContext}
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
            onPlatformChange={(platLabel, platId) => {
              setExplicitChoices((prev) => ({ ...prev, platform: platLabel }));
              updateUserContext('platform', platId);
            }}
            onDurationChange={(dur) => {
              setExplicitChoices((prev) => ({ ...prev, duration: dur }));
              updateUserContext('targetDuration', dur);
              updateUserContext('duration', dur);
            }}
            onContinue={async () => {
              markStageComplete('settings');
              setStudioStage('idea');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              if (!directionsList.length) {
                await loadCreativeDirections();
              }
            }}
            onBack={() => {
              setStudioStage('brief');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {studioStage === 'idea' && (
          <Screen04Idea
            directionsList={directionsList}
            selectedDirection={selectedDirection}
            setSelectedDirection={(d) => {
              const prevKey = selectedDirection?.id || selectedDirection?.title || '';
              const newKey = d?.id || d?.title || '';
              const isDifferent = prevKey !== newKey;
              setSelectedDirection(d);
              setCreativeDNA((prev) => ({ ...prev, direction: d }));
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
              const activeD = selectedDirection || (customDirection ? { title: customDirection } : directionsList.find((d) => d.recommended) || directionsList[0]);
              if (activeD) {
                if (!selectedDirection) {
                  setSelectedDirection(activeD);
                  setCreativeDNA((prev) => ({ ...prev, direction: activeD }));
                }
                setExplicitChoices((prev) => ({ ...prev, idea: activeD.title || customDirection }));
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
              setStudioStage('settings');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {studioStage === 'opening' && (
          <Screen05Opening
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
              setStudioStage('story');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              await loadStoryWorld(true, null, null, activeH);
            }}
            onBack={() => {
              setStudioStage('idea');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {studioStage === 'story' && (
          <Screen06Story
            storyWorldData={storyWorldData}
            setStoryWorldData={(sw) => {
              const nextSw = typeof sw === 'function' ? sw(storyWorldData) : sw;
              setStoryWorldData(nextSw);
              setCreativeDNA((prev) => ({ ...prev, story: nextSw }));
              const hasDownstream = completedStages.includes('script') || completedStages.includes('video') || scenes.length > 0 || Boolean(generatedScript);
              if (hasDownstream) {
                setHasStaleWarning(true);
              }
            }}
            userContext={userContext}
            updateUserContext={updateUserContext}
            isLoadingStory={isLoadingStory}
            constraintsList={constraintsList}
            setConstraintsList={setConstraintsList}
            avoidList={avoidList}
            setAvoidList={setAvoidList}
            onAddConstraint={(c) => setConstraintsList((prev) => [...(prev || []), c])}
            onRemoveConstraint={(idx) => setConstraintsList((prev) => (prev || []).filter((_, i) => i !== idx))}
            onAddAvoid={(a) => setAvoidList((prev) => [...(prev || []), a])}
            onRemoveAvoid={(idx) => setAvoidList((prev) => (prev || []).filter((_, i) => i !== idx))}
            onUpdateCharacters={(c1, c2) => {
              if (c1) setCharacter1(typeof c1 === 'string' ? c1 : c1.name);
              if (c2) setCharacter2(typeof c2 === 'string' ? c2 : c2.name);
            }}
            onUpdateSetting={(s) => setSetting(s)}
            isBusy={isBusy}
            elapsedTime={elapsedTime}
            onContinue={async () => {
              markStageComplete('story');
              const ok = await handleSynthesizeMasterScript();
              if (ok) {
                setStudioStage('script');
                setHasStaleWarning(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            onBack={() => {
              setStudioStage('opening');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {studioStage === 'script' && (
          <Screen07Script
            scenes={scenes}
            setScenes={setScenes}
            setting={setting}
            character1={character1}
            character2={character2}
            userContext={userContext}
            isBusy={isBusy}
            elapsedTime={elapsedTime}
            onApproveScript={() => {
              markStageComplete('script');
              setStudioStage('video');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={() => {
              setStudioStage('story');
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
            onOpenScriptModal={() => setIsScriptModalOpen(true)}
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
            onCreateAnother={handleStartNewProject}
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

        {/* New Film Confirmation Modal */}
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
            onClick={() => setIsNewFilmConfirmOpen(false)}
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
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <RotateCcw size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Start a New Film?
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewFilmConfirmOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                <p style={{ margin: '0 0 10px 0' }}>
                  This will restart your creative flow from the beginning so you can create a fresh film with new ideas, hooks, and script.
                </p>
                {userContext.businessName ? (
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
                    <Store size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
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
                    setIsNewFilmConfirmOpen(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExecuteNewProject(false);
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px var(--accent-glow)',
                  }}
                >
                  <RotateCcw size={14} style={{ pointerEvents: 'none' }} />
                  <span style={{ pointerEvents: 'none' }}>Start New Film</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 9999,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--accent-primary)',
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
        </main>
          </>
        )}
      </AppShell>

      {/* Existing Script Modal (V2 Entry Point) */}
      <ExistingScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        onImportScript={handleImportExistingScript}
        businessName={userContext.businessName}
        businessType={userContext.businessType}
        language={userContext.language}
        creativeStyle={userContext.creativeStyle}
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
        projectCount={userProjects.length}
        businessCount={userBusinesses.length}
      />
    </StudioDispatchContext.Provider>
  </StudioStateContext.Provider>
  );
}
