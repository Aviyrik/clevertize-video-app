import React, { useState, useEffect, useRef } from 'react';
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
  Play
} from 'lucide-react';

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

// Common Indian Retail & Business Categories
const BUSINESS_TYPE_PRESETS = [
  'Sweet shop / bakery',
  'Kirana / general store',
  'Restaurant / cafe',
  'Salon / beauty parlour',
  'Jewellery / ornaments',
  'Tailor / boutique',
  'Gym / fitness centre',
  'Mobile repair / electronics',
  'Pharmacy / medical store',
  'Coaching / tuition centre',
  'Hardware / home decor',
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
    title: 'Verifying script quality…',
    detail: 'Running continuity checks, natural dialogue timing, and story completion.',
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

  // Persistent User Context (Conceptually userContext: preserves all inputs across stages)
  const [userContext, setUserContext] = useState(() => {
    let base = {
      businessName: '',
      businessType: 'Sweet shop / bakery',
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
      language: 'Hindi',
      scriptMode: 'devanagari',
      selectedGoalId: 'offer',
      shopPhoto: null,
      productPhoto: null,
      logo: null,
      brandFile: null,
    };
    try {
      const saved = localStorage.getItem('clevertize_user_context');
      if (saved) {
        const parsed = JSON.parse(saved);
        base = { ...base, ...parsed };
      }
    } catch {
      // fallback
    }
    return base;
  });

  const updateUserContext = (key, val) => {
    setUserContext((prev) => {
      const next = { ...prev, [key]: val };
      try {
        // Strip heavy base64 data from localStorage to stay well under browser 5MB storage limit
        const { shopPhoto, productPhoto, logo, brandFile, ...meta } = next;
        localStorage.setItem('clevertize_user_context', JSON.stringify(meta));
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
  const [currentStep, setCurrentStep] = useState('input');

  // Progressive Disclosure Creation Steps:
  // 1 = Business Details, 2 = Brief, 3 = Production Options + Advanced
  const [creationStep, setCreationStep] = useState(() => {
    try {
      const savedContext = localStorage.getItem('clevertize_user_context');
      if (savedContext) {
        const parsed = JSON.parse(savedContext);
        if (parsed.businessName && parsed.businessName.trim().length > 0) {
          return 2;
        }
      }
    } catch {
      // fallback
    }
    return 1;
  });

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
  const [scenes, setScenes] = useState([]);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
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

  // General UI errors & modals
  const [errorMessage, setErrorMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [qualityFailures, setQualityFailures] = useState([]);

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
      }, 4500);

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
      language: userContext.language || 'Hindi',
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
      const runPayload = {
        scenes: (pipeData.scenes || []).map((s) => s.trim()).filter(Boolean),
        character1: (pipeData.character1 || '').trim(),
        character2: (pipeData.character2 || '').trim(),
        setting: (pipeData.setting || '').trim(),
        duration: userContext.duration || '15s',
        platform: userContext.platform || 'Instagram Reels / 9:16',
        product: pipeData.product || userContext.specialty || userContext.offer || userContext.brief || userContext.businessType || 'featured product',
        productName: pipeData.productName || pipeData.product || userContext.specialty || userContext.businessType || 'featured product',
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

      // 2. Start Magnific Run with compiled shot specification & consistent characters
      const runPayload = {
        scenes: scenes.map((s) => s.trim()).filter(Boolean),
        character1: character1.trim(),
        character2: character2.trim(),
        setting: setting.trim(),
        duration: userContext.duration || '15s',
        platform: userContext.platform || 'Instagram Reels / 9:16',
        product: userContext.specialty || userContext.offer || userContext.brief || userContext.businessType || 'featured product',
        productName: userContext.specialty || userContext.businessType || 'featured product',
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
          return;
        }

        if (data.failed) {
          stopTimer();
          setIsRendering(false);
          setIsBusy(false);
          setCurrentStep('input');
          setErrorMessage(`Rendering failed: ${data.status}`);
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

  // Clean Reset for New Ad Film Project (Preserves Brand Profile)
  const handleStartNewProject = () => {
    const hasWorkInProgress = Boolean(
      (userContext.brief && userContext.brief.trim().length > 0) ||
      scenes.length > 0 ||
      videoUrl
    );

    if (hasWorkInProgress) {
      const confirmed = window.confirm(
        'Start a new film? Your current brand profile will remain saved.'
      );
      if (!confirmed) return;
    }

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

    // Reset film-specific inputs while preserving brand profile
    setUserContext((prev) => {
      const next = {
        ...prev,
        brief: '',
        productPhoto: null,
        leadCharacter: '',
        supportingCharacter: '',
        environment: '',
        selectedGoalId: 'offer',
      };
      try {
        const { shopPhoto, productPhoto, logo, brandFile, ...meta } = next;
        localStorage.setItem('clevertize_user_context', JSON.stringify(meta));
      } catch (err) {
        // ignore
      }
      return next;
    });

    setCurrentStep('input');
    setCreationStep(userContext.businessName && userContext.businessName.trim().length > 0 ? 2 : 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Safe Back Navigation to Previous Stage
  const handleGoBack = () => {
    setErrorMessage('');
    setQualityFailures([]);
    setIsChangeOpen(false);

    if (currentStep === 'render') {
      setCurrentStep('storyboard');
    } else if (currentStep === 'storyboard') {
      setCurrentStep('input');
      setCreationStep(3);
    } else if (currentStep === 'input') {
      if (creationStep === 3) {
        setCreationStep(2);
      } else if (creationStep === 2) {
        setCreationStep(1);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Full Brand Reset (Allows Adding a Brand New Business)
  const handleResetBrandProfile = () => {
    try {
      localStorage.removeItem('clevertize_user_context');
      localStorage.removeItem('clevertize_brand_name');
      localStorage.removeItem('clevertize_website_url');
    } catch (e) {
      console.warn('Storage unavailable', e);
    }
    setUserContext({
      businessName: '',
      businessType: 'Sweet shop / bakery',
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
      language: 'Hindi',
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
    setVideoUrl('');
    setApprovedSummary([]);
    setIsBrandModalOpen(false);
    setCurrentStep('input');
    setBrandFlowState('setup');
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
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
            zIndex: 9999,
          }}
        >
          <WifiOff size={16} />
          <span>You're offline. Your progress is safe. Reconnect to continue.</span>
        </div>
      )}

      {/* TOP APPLICATION HEADER */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(11, 12, 15, 0.92)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '12px 24px',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #06B6D4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)',
              }}
            >
              <Clapperboard size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  Clevertize
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--accent-primary)',
                    backgroundColor: 'var(--accent-subtle)',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  Creative Intelligence v2
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                Product Spine Engine · 4-Checkpoint Production Workspace
              </div>
            </div>
          </div>

          {/* Right Action: Active Brand Summary Pill & Profile Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {userContext.businessName ? (
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                }}
                title="Manage reusable brand profile"
              >
                <Store size={14} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{userContext.businessName}</span>
                {userContext.town && <span style={{ color: 'var(--text-tertiary)' }}>· {userContext.town}</span>}
                <span style={{ color: 'var(--accent-primary)', fontSize: 11, fontWeight: 500 }}>· Brand Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  backgroundColor: 'var(--accent-subtle)',
                  border: '1px solid var(--accent-primary)',
                  color: 'var(--accent-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Configure reusable brand profile"
              >
                <Building2 size={13} />
                <span>+ Set up brand</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleStartNewProject}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                backgroundColor: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              title="Start a fresh film project"
            >
              <RotateCcw size={13} />
              <span>New Film</span>
            </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE BREADCRUMB / 5-STEP LINEAR PROGRESS TRACKER */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)', padding: '10px 24px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Contextual Back Button */}
            {((currentStep !== 'input' || creationStep > 1) && !isBusy && !isRendering) && (
              <button
                type="button"
                onClick={handleGoBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 11px',
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                title="Go back to previous stage"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, whiteSpace: 'nowrap' }}>
              {/* 1. Brand */}
              <span
                onClick={() => {
                  if (!isBusy && !isRendering) {
                    setCurrentStep('input');
                    setCreationStep(1);
                    setErrorMessage('');
                  }
                }}
                style={{
                  fontWeight: currentStep === 'input' && creationStep === 1 ? 700 : 500,
                  color: currentStep === 'input' && creationStep === 1
                    ? 'var(--accent-primary)'
                    : userContext.businessName
                    ? 'var(--success)'
                    : 'var(--text-secondary)',
                  cursor: !isBusy && !isRendering ? 'pointer' : 'default',
                  textDecoration: currentStep === 'input' && creationStep === 1 ? 'none' : 'underline',
                  textUnderlineOffset: 3,
                }}
                title="Step 1: Business Details"
              >
                1. Brand
              </span>
              <span style={{ color: 'var(--border-strong)' }}>→</span>

              {/* 2. Brief */}
              <span
                onClick={() => {
                  if (!isBusy && !isRendering && userContext.businessName) {
                    setCurrentStep('input');
                    setCreationStep(2);
                    setErrorMessage('');
                  }
                }}
                style={{
                  fontWeight: currentStep === 'input' && creationStep === 2 ? 700 : 500,
                  color: currentStep === 'input' && creationStep === 2
                    ? 'var(--accent-primary)'
                    : userContext.brief
                    ? 'var(--success)'
                    : 'var(--text-tertiary)',
                  cursor: !isBusy && !isRendering && userContext.businessName ? 'pointer' : 'default',
                  textDecoration: currentStep === 'input' && creationStep === 2 ? 'none' : userContext.businessName ? 'underline' : 'none',
                  textUnderlineOffset: 3,
                }}
                title="Step 2: Video Brief"
              >
                2. Brief
              </span>
              <span style={{ color: 'var(--border-strong)' }}>→</span>

              {/* 3. Production */}
              <span
                onClick={() => {
                  if (!isBusy && !isRendering && userContext.businessName && userContext.brief) {
                    setCurrentStep('input');
                    setCreationStep(3);
                    setErrorMessage('');
                  }
                }}
                style={{
                  fontWeight: currentStep === 'input' && creationStep === 3 ? 700 : 500,
                  color: currentStep === 'input' && creationStep === 3
                    ? 'var(--accent-primary)'
                    : currentStep === 'storyboard' || currentStep === 'render'
                    ? 'var(--success)'
                    : 'var(--text-tertiary)',
                  cursor: !isBusy && !isRendering && userContext.businessName && userContext.brief ? 'pointer' : 'default',
                  textDecoration: currentStep === 'input' && creationStep === 3 ? 'none' : (userContext.businessName && userContext.brief) ? 'underline' : 'none',
                  textUnderlineOffset: 3,
                }}
                title="Step 3: Production Options & Assets"
              >
                3. Production
              </span>
              <span style={{ color: 'var(--border-strong)' }}>→</span>

              {/* 4. Script Review */}
              <span
                onClick={() => {
                  if (!isBusy && !isRendering && scenes.length > 0) {
                    setCurrentStep('storyboard');
                    setErrorMessage('');
                  }
                }}
                style={{
                  fontWeight: currentStep === 'storyboard' || currentStep === 'generating' ? 700 : 500,
                  color: currentStep === 'storyboard' || currentStep === 'generating'
                    ? 'var(--accent-primary)'
                    : videoUrl
                    ? 'var(--success)'
                    : 'var(--text-tertiary)',
                  cursor: !isBusy && !isRendering && scenes.length > 0 ? 'pointer' : 'default',
                  textDecoration: currentStep === 'storyboard' ? 'none' : scenes.length > 0 ? 'underline' : 'none',
                  textUnderlineOffset: 3,
                }}
                title="Step 4: Script Review & Storyboard"
              >
                4. Script Review
              </span>
              <span style={{ color: 'var(--border-strong)' }}>→</span>

              {/* 5. Video Production */}
              <span
                onClick={() => {
                  if (!isBusy && (isRendering || videoUrl)) {
                    setCurrentStep('render');
                    setErrorMessage('');
                  }
                }}
                style={{
                  fontWeight: currentStep === 'render' ? 700 : 500,
                  color: currentStep === 'render'
                    ? 'var(--accent-primary)'
                    : videoUrl
                    ? 'var(--success)'
                    : 'var(--text-tertiary)',
                  cursor: !isBusy && (isRendering || videoUrl) ? 'pointer' : 'default',
                  textDecoration: currentStep === 'render' ? 'none' : videoUrl ? 'underline' : 'none',
                  textUnderlineOffset: 3,
                }}
                title="Step 5: Video Production & Master MP4"
              >
                5. Video Production
              </span>
            </div>
          </div>

          {elapsedTime !== '00:00' && (isBusy || currentStep === 'generating' || isRendering) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent-primary)' }}>
              <Clock size={12} />
              <span>{elapsedTime}</span>
            </div>
          )}
        </div>
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
                  placeholder="e.g. Sharma General Store, Kanti Sweets"
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
                  placeholder="e.g. kantisweets.com"
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
      <main style={{ flex: 1, maxWidth: currentStep === 'storyboard' && !isBusy ? 1240 : 860, width: '100%', margin: '0 auto', padding: '32px 20px 80px' }}>
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
              {/* Quick Recovery Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('input');
                    setCreationStep(2);
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
                    setCurrentStep('input');
                    setCreationStep(1);
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
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={13} />
                  <span>Edit Brand Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleStartNewProject();
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 6,
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Start Fresh Film</span>
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

        {/* DEDICATED FULL-SCREEN GENERATION WORKSPACE DURING FAST PIPELINE OR CHECKPOINT TRANSITIONS */}
        {currentStep === 'generating' ? (
          <div
            style={{
              maxWidth: 620,
              margin: '36px auto',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              padding: '36px 32px',
              textAlign: 'center',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Spinning icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 18px var(--accent-glow)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                }}
              >
                <Sparkles size={26} className="icon-spinner" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-primary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: 'var(--bg-elevated)',
                  padding: '4px 14px',
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {FAST_PIPELINE_STAGES[fastStageIndex]?.phase || 'STEP 1'}
              </div>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              {FAST_PIPELINE_STAGES[fastStageIndex]?.title || 'Understanding your brief…'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
              {FAST_PIPELINE_STAGES[fastStageIndex]?.detail || 'Evaluating customer tensions, narrative options, and local market voice.'}
            </p>

            {/* Multi-step progress bar */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${FAST_PIPELINE_STAGES.length}, 1fr)`,
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                {FAST_PIPELINE_STAGES.map((st, i) => {
                  const isDone = i < fastStageIndex;
                  const isCurrent = i === fastStageIndex;
                  return (
                    <div
                      key={i}
                      style={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: isDone
                          ? 'var(--success)'
                          : isCurrent
                          ? 'var(--accent-primary)'
                          : 'var(--bg-elevated)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Live Pipeline Checklist */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 20,
                textAlign: 'left',
              }}
            >
              {FAST_PIPELINE_STAGES.map((st, i) => {
                const isDone = i < fastStageIndex;
                const isCurrent = i === fastStageIndex;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: isCurrent
                        ? 'var(--text-primary)'
                        : isDone
                        ? 'var(--text-secondary)'
                        : 'var(--text-tertiary)',
                      fontWeight: isCurrent ? 600 : 400,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontFamily: "'JetBrains Mono', monospace",
                          backgroundColor: isDone
                            ? 'rgba(34, 197, 94, 0.15)'
                            : isCurrent
                            ? 'var(--accent-subtle)'
                            : 'var(--bg-surface)',
                          color: isDone
                            ? 'var(--success)'
                            : isCurrent
                            ? 'var(--accent-primary)'
                            : 'var(--text-tertiary)',
                          border: isCurrent ? '1px solid var(--accent-primary)' : '1px solid transparent',
                        }}
                      >
                        {isDone ? '✓' : i + 1}
                      </span>
                      <span>{st.title.replace('…', '')}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: isDone ? 'var(--success)' : isCurrent ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                      }}
                    >
                      {isDone ? 'Complete' : isCurrent ? 'In Progress' : 'Queued'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Creative Intelligence Insight Tip */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px dashed var(--border-default)',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                textAlign: 'left',
              }}
            >
              <Sparkle size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-tertiary)',
                    marginBottom: 2,
                  }}
                >
                  Creative Intelligence Insight
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {FAST_PIPELINE_TIPS[busyTipIndex] || FAST_PIPELINE_TIPS[0]}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)' }}>
                Elapsed Time: {elapsedTime}
              </span>
              <button
                type="button"
                onClick={() => {
                  stopTimer();
                  setIsBusy(false);
                  setCurrentStep('input');
                  setCreationStep(3);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ArrowLeft size={13} />
                <span>Cancel & Return to Editor</span>
              </button>
            </div>
          </div>
        ) : isBusy ? (
          <div
            style={{
              maxWidth: 620,
              margin: '36px auto',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              padding: '36px 32px',
              textAlign: 'center',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Header with spinning icon on top and active phase badge below */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-subtle)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px var(--accent-glow)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                  }}
                >
                  <Sparkles size={24} className="icon-spinner" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-primary)',
                    fontFamily: "'JetBrains Mono', monospace",
                    backgroundColor: 'var(--bg-elevated)',
                    padding: '4px 12px',
                    borderRadius: 12,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {(CHECKPOINT_PIPELINES[activeCheckpointKey] || CHECKPOINT_PIPELINES.direction).badge} · Phase {busyStep + 1} of {(CHECKPOINT_PIPELINES[activeCheckpointKey] || CHECKPOINT_PIPELINES.direction).stages.length}
                </div>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                {(CHECKPOINT_PIPELINES[activeCheckpointKey] || CHECKPOINT_PIPELINES.direction).stages[busyStep]?.title || 'Formulating Creative Intelligence…'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {(CHECKPOINT_PIPELINES[activeCheckpointKey] || CHECKPOINT_PIPELINES.direction).stages[busyStep]?.detail || 'Evaluating customer tensions, narrative options, and local market voice.'}
              </p>
            </div>

            {/* Multi-step progress bar */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${(CHECKPOINT_PIPELINES[activeCheckpointKey] || CHECKPOINT_PIPELINES.direction).stages.length}, 1fr)`,
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                {(CHECKPOINT_PIPELINES[activeCheckpointKey] || CHECKPOINT_PIPELINES.direction).stages.map((st, i) => {
                  const isDone = i < busyStep;
                  const isCurrent = i === busyStep;
                  return (
                    <div
                      key={i}
                      style={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: isDone
                          ? 'var(--success)'
                          : isCurrent
                          ? 'var(--accent-primary)'
                          : 'var(--bg-elevated)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Live Pipeline Checklist */}
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 20,
                textAlign: 'left',
              }}
            >
              {(CHECKPOINT_PIPELINES[activeCheckpointKey] || CHECKPOINT_PIPELINES.direction).stages.map((st, i) => {
                const isDone = i < busyStep;
                const isCurrent = i === busyStep;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: isCurrent
                        ? 'var(--text-primary)'
                        : isDone
                        ? 'var(--text-secondary)'
                        : 'var(--text-tertiary)',
                      fontWeight: isCurrent ? 600 : 400,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontFamily: "'JetBrains Mono', monospace",
                          backgroundColor: isDone
                            ? 'rgba(34, 197, 94, 0.15)'
                            : isCurrent
                            ? 'var(--accent-subtle)'
                            : 'var(--bg-surface)',
                          color: isDone
                            ? 'var(--success)'
                            : isCurrent
                            ? 'var(--accent-primary)'
                            : 'var(--text-tertiary)',
                          border: isCurrent ? '1px solid var(--accent-primary)' : '1px solid transparent',
                        }}
                      >
                        {isDone ? '✓' : i + 1}
                      </span>
                      <span>{st.phase}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: isDone ? 'var(--success)' : isCurrent ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                      }}
                    >
                      {isDone ? 'Complete' : isCurrent ? 'Formulating…' : 'Queued'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Engaging Product Spine Filmmaking Rule Ticker */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px dashed var(--border-default)',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                textAlign: 'left',
              }}
            >
              <Sparkle size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-tertiary)',
                    marginBottom: 2,
                  }}
                >
                  Product Spine Filmmaking Rule
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {(CHECKPOINT_PIPELINES[activeCheckpointKey] || CHECKPOINT_PIPELINES.direction).tips[busyTipIndex] ||
                    (CHECKPOINT_PIPELINES[activeCheckpointKey] || CHECKPOINT_PIPELINES.direction).tips[0]}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ========================================================
                STREAMLINED CREATION WORKSPACE (~20s Brand -> Brief -> Options -> Generate)
                ======================================================== */}
            {currentStep === 'input' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Title */}
                <div>
                  <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Create Your Ad Film
                  </h1>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Fast, AI-powered commercial creation. Describe your message, configure production options, and generate your video script.
                  </p>
                </div>

                {/* ========================================================
                    STEP 1: ABOUT YOUR BRAND
                    ======================================================== */}
                {creationStep === 1 ? (
                  /* Expanded Brand Input Form */
                  <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={15} style={{ color: 'var(--accent-primary)' }} />
                        <span>1. Tell Us About Your Brand</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Saved to your reusable brand profile</span>
                    </div>

                    {/* Row 1: Mandatory Core Brand Information */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: userContext.businessType === 'Other' ? 10 : 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Brand / Business Name <span style={{ color: 'var(--error)' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={userContext.businessName}
                          onChange={(e) => {
                            updateUserContext('businessName', e.target.value);
                            setValidationError('');
                          }}
                          placeholder="e.g. Kanti Sweets, Livspace, Studio Kitchens"
                          style={{ width: '100%', padding: '10px 12px', fontSize: 13, backgroundColor: 'var(--bg-elevated)' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                          Product / Service Category <span style={{ color: 'var(--error)' }}>*</span>
                        </label>
                        <select
                          value={userContext.businessType}
                          onChange={(e) => updateUserContext('businessType', e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', fontSize: 13, backgroundColor: 'var(--bg-elevated)' }}
                        >
                          {BUSINESS_TYPE_PRESETS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {userContext.businessType === 'Other' && (
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          Custom Category / Business Type
                        </label>
                        <input
                          type="text"
                          value={userContext.customBusinessType}
                          onChange={(e) => updateUserContext('customBusinessType', e.target.value)}
                          placeholder="e.g. Handmade Ceramic Pottery, Drone Photography"
                          style={{ width: '100%', padding: '10px 12px', fontSize: 13, backgroundColor: 'var(--bg-elevated)' }}
                        />
                      </div>
                    )}

                    {/* Row 2: Location Information (Optional) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          Town / City <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={userContext.town}
                          onChange={(e) => {
                            updateUserContext('town', e.target.value);
                            setValidationError('');
                          }}
                          placeholder="e.g. Bangalore, Mumbai (leave blank if global/national)"
                          style={{ width: '100%', padding: '10px 12px', fontSize: 13, backgroundColor: 'var(--bg-elevated)' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          Area / Neighborhood <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={userContext.area}
                          onChange={(e) => updateUserContext('area', e.target.value)}
                          placeholder="e.g. Indiranagar, Palasia"
                          style={{ width: '100%', padding: '10px 12px', fontSize: 13, backgroundColor: 'var(--bg-elevated)' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          Website <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={userContext.websiteUrl}
                          onChange={(e) => updateUserContext('websiteUrl', e.target.value)}
                          placeholder="e.g. kantisweets.com"
                          style={{ width: '100%', padding: '10px 12px', fontSize: 13, backgroundColor: 'var(--bg-elevated)' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          Key Offer / USP <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={userContext.offer}
                          onChange={(e) => updateUserContext('offer', e.target.value)}
                          placeholder="e.g. 50% festive discount or 20-min delivery"
                          style={{ width: '100%', padding: '10px 12px', fontSize: 13, backgroundColor: 'var(--bg-elevated)' }}
                        />
                      </div>
                    </div>

                    {validationError && (
                      <div style={{ padding: '8px 12px', backgroundColor: 'var(--error-subtle)', border: '1px solid var(--error)', borderRadius: 6, color: 'var(--error)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
                        <AlertCircle size={14} />
                        <span>{validationError}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!userContext.businessName.trim()) {
                            setValidationError('Please enter your business or brand name.');
                            return;
                          }
                          setValidationError('');
                          setCreationStep(2);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '12px 24px',
                          borderRadius: 8,
                          backgroundColor: 'var(--accent-primary)',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px var(--accent-glow)',
                        }}
                      >
                        <span>Continue to Brief</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Compact Collapsed Brand Summary Card */
                  <div
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 10,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260, flex: 1 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          color: 'var(--success)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-primary)' }}>
                            STEP 1 · BRAND
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {userContext.businessName}
                          </span>
                          {(userContext.town || userContext.area) && (
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              · {[userContext.town, userContext.area].filter(Boolean).join(', ')}
                            </span>
                          )}
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, backgroundColor: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}>
                            {userContext.businessType === 'Other' && userContext.customBusinessType ? userContext.customBusinessType : userContext.businessType}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, flexWrap: 'wrap' }}>
                          {userContext.websiteUrl && <span>Website: {userContext.websiteUrl} · </span>}
                          {userContext.offer && <span>USP: {userContext.offer} · </span>}
                          <span>Logo: {userContext.logo ? <strong style={{ color: 'var(--success)' }}>✓ Added</strong> : 'None'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCreationStep(1)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 6,
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Edit Brand</span>
                    </button>
                  </div>
                )}

                {/* ========================================================
                    STEP 2: YOUR BRIEF (Hero Prominence)
                    ======================================================== */}
                {creationStep === 2 ? (
                  /* Expanded Brief Input */
                  <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--accent-primary)', borderRadius: 12, padding: 24, boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 2 }}>
                          STEP 2 · THE BRIEF
                        </div>
                        <label htmlFor="briefInput" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                          What do you want this video to communicate? <span style={{ color: 'var(--error)' }}>*</span>
                        </label>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                          Write naturally. Describe your campaign goal, special offer, hero product, or customer problem.
                        </p>
                      </div>

                      {micSupported && (
                        <button
                          type="button"
                          onClick={toggleVoiceInput}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: isListening ? '1px solid var(--error)' : '1px solid var(--border-default)',
                            backgroundColor: isListening ? 'var(--error-subtle)' : 'var(--bg-elevated)',
                            color: isListening ? 'var(--error)' : 'var(--text-secondary)',
                          }}
                        >
                          {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                          <span>{isListening ? 'Stop' : 'Dictate'}</span>
                        </button>
                      )}
                    </div>

                    {/* Inspiring Example Chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '10px 0 12px' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>Try an example:</span>
                      {[
                        'Show why our modular kitchens are perfect for small Bangalore homes',
                        'Create a funny Diwali offer video with 50% discount on sweets',
                        'Convince people to book a free dental consultation',
                        'Launch our new premium skincare product with authentic glow',
                      ].map((sample, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            updateUserContext('brief', sample);
                            setValidationError('');
                          }}
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 4,
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          "{sample.slice(0, 36)}…"
                        </button>
                      ))}
                    </div>

                    {micHint && (
                      <div style={{ fontSize: 12, color: 'var(--accent-primary)', padding: '6px 10px', backgroundColor: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 10 }}>
                        {micHint}
                      </div>
                    )}

                    <textarea
                      id="briefInput"
                      rows={4}
                      value={userContext.brief}
                      onChange={(e) => {
                        updateUserContext('brief', e.target.value);
                        setValidationError('');
                      }}
                      placeholder="e.g. Show why our modular kitchens are perfect for small Bangalore homes. Highlight smart storage, modern aesthetic, and hassle-free 48-hour installation..."
                      style={{ width: '100%', padding: '14px 16px', fontSize: 14, lineHeight: 1.6, resize: 'vertical' }}
                    />

                    {validationError && (
                      <div style={{ padding: '8px 12px', backgroundColor: 'var(--error-subtle)', border: '1px solid var(--error)', borderRadius: 6, color: 'var(--error)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                        <AlertCircle size={14} />
                        <span>{validationError}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setCreationStep(1)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 6,
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-secondary)',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <ArrowLeft size={13} />
                        <span>Back to Brand</span>
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 11, color: userContext.brief.trim().length >= 15 ? 'var(--success)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {userContext.brief.trim().length >= 15 && <span>✓ Sufficient detail ·</span>}
                          {userContext.brief.length} characters
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!userContext.brief.trim() && !userContext.specialty.trim() && !userContext.offer.trim()) {
                              setValidationError('Please enter what you want this video to communicate.');
                              return;
                            }
                            setValidationError('');
                            setCreationStep(3);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '12px 24px',
                            borderRadius: 8,
                            backgroundColor: 'var(--accent-primary)',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px var(--accent-glow)',
                          }}
                        >
                          <span>Continue to Production Options</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : creationStep > 2 ? (
                  /* Compact Collapsed Brief Summary Card */
                  <div
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 10,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260, flex: 1 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          color: 'var(--success)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircle2 size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-primary)', display: 'block', marginBottom: 2 }}>
                          STEP 2 · BRIEF
                        </span>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          "{userContext.brief.length > 90 ? userContext.brief.slice(0, 90) + '…' : userContext.brief}"
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCreationStep(2)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 6,
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Edit Brief</span>
                    </button>
                  </div>
                ) : null}

                {/* ========================================================
                    STEP 3: PRODUCTION OPTIONS + ASSETS + ADVANCED
                    ======================================================== */}
                {creationStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Production Options */}
                    <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 22 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 16 }}>
                        3. Production Options
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Row 1: Platform & Duration */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                          {/* Platform */}
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                              Platform
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
                              {PLATFORM_PRESETS.map((p) => {
                                const isSelected = (userContext.platform || 'Instagram Reels / 9:16') === p.id;
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => updateUserContext('platform', p.id)}
                                    style={{
                                      padding: '8px 10px',
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: isSelected ? 700 : 500,
                                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                                      cursor: 'pointer',
                                      textAlign: 'center',
                                    }}
                                  >
                                    <div>{p.label}</div>
                                    <div style={{ fontSize: 10, opacity: isSelected ? 0.9 : 0.65 }}>{p.sub}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Duration */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 4 }}>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Duration
                              </label>
                              <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace", backgroundColor: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                                4 scenes · ~{(parseInt(userContext.duration || '15', 10) / 4).toFixed(1)}s per scene
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                              {[
                                { id: '10s', label: '10 sec', sub: 'Snappy' },
                                { id: '15s', label: '15 sec', sub: 'Standard' },
                                { id: '20s', label: '20 sec', sub: 'Extended' },
                                { id: '25s', label: '25 sec', sub: 'Story' },
                              ].map((d) => {
                                const isSelected = (userContext.duration || '15s') === d.id;
                                return (
                                  <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => updateUserContext('duration', d.id)}
                                    style={{
                                      padding: '8px 6px',
                                      borderRadius: 6,
                                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                                      cursor: 'pointer',
                                      textAlign: 'center',
                                    }}
                                  >
                                    <div style={{ fontSize: 12, fontWeight: 700 }}>{d.label}</div>
                                    <div style={{ fontSize: 10, opacity: isSelected ? 0.9 : 0.65 }}>({d.sub})</div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Language & Creative Style */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                          {/* Language */}
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                              Language
                            </label>
                            <div className="tab-group" style={{ width: '100%' }}>
                              {['Hindi', 'Hinglish', 'English', 'Marathi'].map((lang) => (
                                <button
                                  key={lang}
                                  type="button"
                                  onClick={() => updateUserContext('language', lang)}
                                  className={`tab-pill ${userContext.language === lang ? 'active-accent' : ''}`}
                                  style={{ fontSize: 12, padding: '8px 10px' }}
                                >
                                  {lang}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Creative Format / Style */}
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                              Creative Style / Format
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                              {CREATIVE_STYLE_PRESETS.map((st) => {
                                const isSelected = (userContext.creativeStyle || 'UGC / Creator-style') === st.id;
                                return (
                                  <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => updateUserContext('creativeStyle', st.id)}
                                    style={{
                                      padding: '8px 10px',
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: isSelected ? 700 : 500,
                                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                    }}
                                    title={st.desc}
                                  >
                                    {st.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assets (Optional) */}
                    <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 22 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 4 }}>
                        Brand & Product Assets <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)' }}>(Optional)</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 14px' }}>
                        Uploaded assets guide video scenes and end frame branding.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
                        <UploadTile
                          id="productPhotoInput"
                          label="Hero Product Photo"
                          hint="Guides video product appearance"
                          accept="image/*"
                          file={userContext.productPhoto}
                          onChange={(f) => handleFileUpload(f, 'productPhoto')}
                          icon={ImageIcon}
                        />
                        <UploadTile
                          id="brandLogoInput"
                          label="Brand Logo"
                          hint="PNG or JPG for end frame card"
                          accept="image/*"
                          file={userContext.logo}
                          onChange={(f) => handleFileUpload(f, 'logo')}
                          icon={Building2}
                        />
                        <UploadTile
                          id="shopPhotoInput"
                          label="Business / Store Photos"
                          hint="Signboard, interior, storefront"
                          accept="image/*"
                          capture="environment"
                          file={userContext.shopPhoto}
                          onChange={(f) => handleFileUpload(f, 'shopPhoto')}
                          icon={Store}
                        />
                      </div>
                    </div>

                    {/* Advanced Creative Options (Collapsible) */}
                    <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        style={{
                          width: '100%',
                          padding: '16px 22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            Advanced Creative Options <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)' }}>(Optional)</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            Casting characters, single-room setting, commercial angle, and script dialect.
                          </div>
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {isAdvancedOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </button>

                      {isAdvancedOpen && (
                        <div style={{ padding: '0 22px 22px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
                          {/* Casting & Location */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                Lead Character / Speaker
                              </label>
                              <input
                                type="text"
                                value={userContext.leadCharacter}
                                onChange={(e) => updateUserContext('leadCharacter', e.target.value)}
                                placeholder="e.g. Relatable working mother in her 30s"
                                style={{ width: '100%', padding: '8px 10px', fontSize: 12 }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                Supporting Character
                              </label>
                              <input
                                type="text"
                                value={userContext.supportingCharacter}
                                onChange={(e) => updateUserContext('supportingCharacter', e.target.value)}
                                placeholder="e.g. Smiling shop assistant, or spouse"
                                style={{ width: '100%', padding: '8px 10px', fontSize: 12 }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                Setting / Environment
                              </label>
                              <input
                                type="text"
                                value={userContext.environment}
                                onChange={(e) => updateUserContext('environment', e.target.value)}
                                placeholder="e.g. Modern kitchen with warm daylight"
                                style={{ width: '100%', padding: '8px 10px', fontSize: 12 }}
                              />
                            </div>
                          </div>

                          {/* Ad Focus Goal & Script Mode */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                Commercial Goal & CTA Angle
                              </label>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                                {AD_GOAL_PRESETS.map((g) => {
                                  const isSelected = userContext.selectedGoalId === g.id;
                                  return (
                                    <button
                                      key={g.id}
                                      type="button"
                                      onClick={() => updateUserContext('selectedGoalId', g.id)}
                                      style={{
                                        padding: '6px 8px',
                                        borderRadius: 6,
                                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                                        backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                        fontSize: 11,
                                        fontWeight: isSelected ? 700 : 500,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                      }}
                                    >
                                      {g.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                Dialogue Script Mode
                              </label>
                              <div className="tab-group" style={{ width: '100%' }}>
                                <button
                                  type="button"
                                  onClick={() => updateUserContext('scriptMode', 'devanagari')}
                                  className={`tab-pill ${userContext.scriptMode === 'devanagari' ? 'active-accent' : ''}`}
                                  style={{ fontSize: 11, padding: '6px 8px' }}
                                >
                                  Devanagari (Standard)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateUserContext('scriptMode', 'roman')}
                                  className={`tab-pill ${userContext.scriptMode === 'roman' ? 'active-accent' : ''}`}
                                  style={{ fontSize: 11, padding: '6px 8px' }}
                                >
                                  Romanized (Test)
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 3 Actions: Back & Generate Script CTA */}
                    {validationError && (
                      <div style={{ padding: '10px 14px', backgroundColor: 'var(--error-subtle)', border: '1px solid var(--error)', borderRadius: 8, color: 'var(--error)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={15} />
                        <span>{validationError}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => setCreationStep(2)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '12px 18px',
                          borderRadius: 8,
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-secondary)',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <ArrowLeft size={14} />
                        <span>Back to Brief</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleGenerateVideo({ previewOnly: true })}
                        style={{
                          padding: '16px 32px',
                          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 10,
                          fontSize: 16,
                          fontWeight: 700,
                          cursor: isBusy ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Sparkles size={18} />
                        <span>Generate Script</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', marginTop: -6 }}>
                      ~20-second setup · Clevertize creates your story, scenes, and spoken dialogue for review
                    </div>
                  </div>
                )}
              </div>
            )}

        {/* ========================================================
            CHECKPOINT 1: CREATIVE DIRECTION & CUSTOMER TENSIONS
            ======================================================== */}
        {currentStep === 'cp1_direction' && !isBusy && directionData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
                  Checkpoint 01 · Creative Direction
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Customer Tension & Occasion
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  The AI evaluated 8 insight lenses for <strong style={{ color: 'var(--text-primary)' }}>{userContext.businessName}</strong>. Select the customer worry or friction your film will address.
                </p>
              </div>

              {checkpointSeconds && (
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)' }}>
                  Formulated in {checkpointSeconds}s
                </span>
              )}
            </div>

            {/* Festival Calendar Context Card */}
            {directionData.festival && (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 10,
                  backgroundColor: directionData.festival.use ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-elevated)',
                  border: directionData.festival.use ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <Sparkles size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {directionData.festival.use ? `Festival Context: ${directionData.festival.name}` : 'Everyday Commercial Setting'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {directionData.festival.owner}
                  </div>
                </div>
              </div>
            )}

            {/* Tension Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                Top 3 Customer Tensions (Ranked by Emotional Engagement):
              </div>

              {directionData.tensions.map((t, idx) => {
                const isSelected = selectedDirectionIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDirectionIdx(idx)}
                    style={{
                      padding: '18px 20px',
                      borderRadius: 10,
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: isSelected ? '6px solid var(--accent-primary)' : '2px solid var(--border-default)',
                        backgroundColor: '#ffffff',
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Option 0{idx + 1}
                        </span>
                        {idx === 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                            Recommended
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        "{t.owner}"
                      </div>
                      {t.en && t.en !== t.owner && (
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                          {t.en}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Change Something Expandable */}
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Is this the right direction, or would you like to modify it?
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangeOpen(!isChangeOpen)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {isChangeOpen ? 'Cancel' : 'Change Something'}
                </button>
              </div>

              {isChangeOpen && (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    rows={2}
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    placeholder="e.g. Focus on quality and freshness instead of pricing..."
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                  />
                  {changeError && <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>{changeError}</div>}
                  <button
                    type="button"
                    onClick={() => handleSendChangeRequest('direction')}
                    style={{ marginTop: 8, padding: '8px 16px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Submit Revision
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleGoBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Brief</span>
              </button>

              <button
                type="button"
                onClick={handleApproveDirection}
                style={{
                  padding: '14px 28px',
                  borderRadius: 8,
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>Approve Direction & Proceed to Plot (Option 0{selectedDirectionIdx + 1})</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            CHECKPOINT 2: PLOT LINE & VIRAL HOOKS
            ======================================================== */}
        {currentStep === 'cp2_plot' && !isBusy && plotData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    Checkpoint 02 · Plot Line
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={12} /> Direction Approved
                  </span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Choose Your Story Plot & Hook
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Each plot line establishes a complete one-line mini-story (Hook → Conflict → Resolution) paired with a high-retention creator hook pattern.
                </p>
              </div>

              {checkpointSeconds && (
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)' }}>
                  Formulated in {checkpointSeconds}s
                </span>
              )}
            </div>

            {/* 3 Plot Option Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {plotData.plots.map((p, idx) => {
                const isSelected = selectedPlotIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPlotIdx(idx)}
                    style={{
                      padding: '20px',
                      borderRadius: 10,
                      backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                      border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Plot Option 0{idx + 1}
                        </span>
                        {idx === 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
                            Recommended
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4 }}>
                          Hook: {p.hook_pattern}
                        </span>
                      </div>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: isSelected ? '5px solid var(--accent-primary)' : '2px solid var(--border-default)',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      "{p.owner}"
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
                      <span>Library: {p.hook_library || 'Indian Instagram Creators'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Change Something Expandable */}
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Would you like to adjust these plot angles?
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangeOpen(!isChangeOpen)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {isChangeOpen ? 'Cancel' : 'Change Something'}
                </button>
              </div>

              {isChangeOpen && (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    rows={2}
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    placeholder="e.g. Make it about unboxing the sweets rather than visiting the store..."
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                  />
                  {changeError && <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>{changeError}</div>}
                  <button
                    type="button"
                    onClick={() => handleSendChangeRequest('plot')}
                    style={{ marginTop: 8, padding: '8px 16px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Submit Revision
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleGoBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Direction</span>
              </button>

              <button
                type="button"
                onClick={handleApprovePlot}
                style={{
                  padding: '14px 28px',
                  borderRadius: 8,
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>Approve Plot & Build Story Arc (Option 0{selectedPlotIdx + 1})</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            CHECKPOINT 3: STORY ARC & FORMAT
            ======================================================== */}
        {currentStep === 'cp3_story' && !isBusy && storyData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    Checkpoint 03 · Story Arc & Format
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={12} /> Direction & Plot Approved
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                    ⏱ {userContext.duration || '15s'} (~{(parseInt(userContext.duration || '15', 10) / 4).toFixed(1)}s/scene)
                  </span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Review 4-Scene Story Progression
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  The AI has structured your film into the {storyData.format} format across one continuous setting.
                </p>
              </div>

              {checkpointSeconds && (
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)' }}>
                  Formulated in {checkpointSeconds}s
                </span>
              )}
            </div>

            {/* Format & Narrative Anchors Card */}
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)', padding: '3px 8px', borderRadius: 4 }}>
                  Format: {storyData.format}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {storyData.format_owner || storyData.format_reason}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                    📍 Single Location
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {storyData.location || 'The business storefront'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                    👥 Characters
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {(storyData.characters || []).join(' · ') || '2 characters'}
                  </div>
                </div>

                {storyData.through_line && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                      🧵 Story Through-Line
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {storyData.through_line}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Opening Spoken Hook Line */}
            {storyData.hook_line && (
              <div style={{ padding: '14px 18px', borderRadius: 8, backgroundColor: 'var(--bg-elevated)', borderLeft: '3px solid var(--accent-primary)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                  Opening Spoken Hook Line (Scene 1)
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  "{storyData.hook_line}"
                </div>
              </div>
            )}

            {/* 4 Scene Beat Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                4-Scene Progression Roadmap:
              </div>

              {storyData.scenes.map((sc, i) => (
                <div
                  key={i}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace",
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--accent-primary)',
                      marginTop: 2,
                    }}
                  >
                    0{i + 1} {sc.beat}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {sc.owner}
                    </div>
                    {sc.en && sc.en !== sc.owner && (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {sc.en}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Change Something Expandable */}
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Would you like to adjust this story progression?
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangeOpen(!isChangeOpen)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {isChangeOpen ? 'Cancel' : 'Change Something'}
                </button>
              </div>

              {isChangeOpen && (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    rows={2}
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    placeholder="e.g. End with a callback to the sweet box in Scene 4..."
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                  />
                  {changeError && <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>{changeError}</div>}
                  <button
                    type="button"
                    onClick={() => handleSendChangeRequest('story')}
                    style={{ marginTop: 8, padding: '8px 16px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Submit Revision
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleGoBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Plot</span>
              </button>

              <button
                type="button"
                onClick={handleApproveStory}
                style={{
                  padding: '14px 28px',
                  borderRadius: 8,
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>Approve Story & Write Production Script</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 2: STORYBOARD STUDIO (SCRIPT REVIEW & APPROVAL)
            ======================================================== */}
        {currentStep === 'storyboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header with Gate Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    Step 04 · Script Review
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 999,
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      color: 'var(--success)',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <ShieldCheck size={12} />
                    Quality Gate Passed {scriptPayloadData?.meta?.attempts > 1 ? `(${scriptPayloadData.meta.attempts} passes)` : ''}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                    ⏱ {userContext.duration || '15s'} · {scenes.length || 4} Scenes (~{(parseInt(userContext.duration || '15', 10) / (scenes.length || 4)).toFixed(1)}s/scene)
                  </span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Your video story is ready
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Review the idea and script before we start production.
                </p>
              </div>

              {/* View Switcher: Structured vs Raw Script */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsRawScriptMode(!isRawScriptMode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 6,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <FileCode2 size={13} />
                  <span>{isRawScriptMode ? 'Storyboard View' : 'Raw Script'}</span>
                </button>
              </div>
            </div>

            {/* CREATIVE FOUNDATION: CHARACTERS & SETTING */}
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>
                    Creative Foundation Anchors
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFoundationCollapsed(!isFoundationCollapsed)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}
                >
                  {isFoundationCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>

              {!isFoundationCollapsed && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {/* Character 1 */}
                  <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 6 }}>
                      Character 1 (Lead Speaker)
                    </div>
                    {isEditingCharacters ? (
                      <textarea
                        rows={3}
                        value={char1Draft}
                        onChange={(e) => setChar1Draft(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                      />
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {character1 || 'None'}
                      </div>
                    )}
                  </div>

                  {/* Character 2 */}
                  <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 6 }}>
                      Character 2 (Supporting / Customer)
                    </div>
                    {isEditingCharacters ? (
                      <textarea
                        rows={3}
                        value={char2Draft}
                        onChange={(e) => setChar2Draft(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                      />
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {character2 || 'None'}
                      </div>
                    )}
                  </div>

                  {/* Setting */}
                  <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 14, gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 6 }}>
                      Setting (Locked Single Location Across All Scenes)
                    </div>
                    {isEditingSetting ? (
                      <textarea
                        rows={3}
                        value={settingDraft}
                        onChange={(e) => setSettingDraft(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
                      />
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {setting || 'None'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RAW SCRIPT MODE */}
            {isRawScriptMode ? (
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                  Full Raw ANNEX A Script
                </div>
                <textarea
                  rows={20}
                  value={scenes.join('\n\n')}
                  onChange={(e) => setScenes(e.target.value.split(/\n\s*\n/).filter(Boolean))}
                  style={{ width: '100%', padding: 12, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}
                />
              </div>
            ) : (
              /* STRUCTURED 4-SCENE STORYBOARD WORKSPACE */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Scene Tabs (1-4) */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                  {scenes.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveSceneIndex(i)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: activeSceneIndex === i ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                        backgroundColor: activeSceneIndex === i ? 'var(--bg-active)' : 'var(--bg-surface)',
                        color: activeSceneIndex === i ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontSize: 12,
                        fontWeight: activeSceneIndex === i ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>Scene 0{i + 1}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                        ({i === 0 ? 'HOOK' : i === 1 ? 'BUILD' : i === 2 ? 'TURN' : 'RESOLUTION'})
                      </span>
                    </button>
                  ))}
                </div>

                {/* Active Scene Card */}
                {scenes[activeSceneIndex] && (() => {
                  const sc = parseScene(scenes[activeSceneIndex], activeSceneIndex);
                  return (
                    <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', pb: 12 }}>
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                            {sc.title} · {sc.purpose}
                          </span>
                          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                            {activeSceneIndex === 0 ? 'Scroll-Stopping Hook (0–3s)' : activeSceneIndex === 1 ? 'Problem & Conflict Escalation' : activeSceneIndex === 2 ? 'Business Solution & Proof' : 'Payoff & Callback Resolution'}
                          </h2>
                        </div>
                      </div>

                      {/* Visual Description */}
                      <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 6 }}>
                          <Camera size={13} />
                          <span>Visual Staging & Physical Action</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          {sc.visual}
                        </div>
                      </div>

                      {/* Spoken Dialogue Section */}
                      <div style={{ backgroundColor: 'var(--bg-elevated)', borderLeft: '3px solid var(--accent-primary)', borderRadius: '0 8px 8px 0', padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 6 }}>
                          <Quote size={13} />
                          <span>Spoken Dialogue ({userContext.language})</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {sc.dialogue || '(Physical action beat — no dialogue)'}
                        </div>
                      </div>

                      {/* Camera & Sound Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                        <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                            Animation & Camera Direction
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {sc.camera}
                          </div>
                        </div>

                        <div style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                            Sound Design & Atmosphere
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {sc.audio}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* BRANDED END FRAME COMPOSITING CARD */}
            {scriptPayloadData?.endFrame && (
              <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>
                      End Frame Card (Composited after video generation)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const ef = scriptPayloadData.endFrame;
                      const text = [ef.businessName, ef.address, ef.contact, ef.offer].filter(Boolean).join('\n');
                      try {
                        await navigator.clipboard.writeText(text);
                        alert('End frame copied to clipboard!');
                      } catch {}
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Copy End Card
                  </button>
                </div>

                <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-elevated)', borderRadius: 8, fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  <div><strong>{scriptPayloadData.endFrame.businessName}</strong></div>
                  {scriptPayloadData.endFrame.address && <div>{scriptPayloadData.endFrame.address}</div>}
                  {scriptPayloadData.endFrame.contact && <div>Contact: {scriptPayloadData.endFrame.contact}</div>}
                  {scriptPayloadData.endFrame.offer && <div style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{scriptPayloadData.endFrame.offer}</div>}
                </div>
              </div>
            )}

            {/* REVISE SCRIPT VIA CHANGE LOOP */}
            <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Want the AI Creative Director to rewrite any part of this script?
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangeOpen(!isChangeOpen)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {isChangeOpen ? 'Cancel' : 'Request Script Rewrite'}
                </button>
              </div>

              {isChangeOpen && (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    rows={2}
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    placeholder="e.g. Make Scene 2 faster and punchier, and add a reaction beat to the product..."
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                  />
                  {changeError && <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>{changeError}</div>}
                  <button
                    type="button"
                    onClick={() => handleSendChangeRequest('script')}
                    style={{ marginTop: 8, padding: '8px 16px', borderRadius: 6, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Submit Script Revision
                  </button>
                </div>
              )}
            </div>

            {/* STEP 4 ACTIONS: Primary: Start Production →, Secondary: Edit Script, Tertiary: Regenerate Script */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('input');
                    setCreationStep(3);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 18px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Options</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoBack}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 18px',
                    borderRadius: 8,
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Options</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRawScriptMode(!isRawScriptMode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 18px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={14} />
                  <span>{isRawScriptMode ? 'View Storyboard' : 'Edit Script'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsChangeOpen(!isChangeOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 18px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--accent-primary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>{isChangeOpen ? 'Cancel' : 'Regenerate Script'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleApproveScriptAndRender}
                style={{
                  padding: '16px 32px',
                  borderRadius: 8,
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 4px 16px var(--accent-glow)',
                }}
              >
                <span>Start Production</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 5: VIDEO PRODUCTION & DELIVERY
            ======================================================== */}
        {currentStep === 'render' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {isRendering ? (
              /* RENDERING ACTIVE STATE */
              <div
                style={{
                  maxWidth: 640,
                  margin: '40px auto',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 14,
                  padding: '36px 32px',
                  textAlign: 'center',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px var(--accent-glow)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    <Film size={26} className="icon-spinner" />
                  </div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
                  Step 05 · Phase 0{renderStep + 1} of 05 · {RENDER_STAGES[renderStep]?.phase}
                </div>

                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                  {RENDER_STAGES[renderStep]?.title || 'Rendering Video…'}
                </h2>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
                  {renderStatusText}
                </p>

                {/* Progress bar */}
                <div style={{ height: 4, backgroundColor: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden', marginBottom: 24 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${((renderStep + 1) / RENDER_STAGES.length) * 100}%`,
                      backgroundColor: 'var(--accent-primary)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                {/* Production Tips */}
                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-elevated)', borderRadius: 8, border: '1px dashed var(--border-default)', textAlign: 'left', display: 'flex', gap: 10 }}>
                  <Sparkle size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                      Video Production Insight
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {RENDER_TIPS[renderTipIndex]}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)' }}>
                    Elapsed GPU Time: {elapsedTime}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      stopTimer();
                      setIsRendering(false);
                      setCurrentStep('storyboard');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ArrowLeft size={13} />
                    <span>Return to Script Review</span>
                  </button>
                </div>
              </div>
            ) : videoUrl ? (
              /* COMPLETED VIDEO DELIVERY */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      padding: 10,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      color: 'var(--success)',
                      marginBottom: 12,
                    }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                    Your Commercial Video is Ready!
                  </h1>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                    Mastered in broadcast-ready 1080p resolution ({userContext.duration || '15s'} duration), optimized for 9:16 mobile feeds.
                  </p>
                </div>

                {/* Video Player */}
                <div
                  style={{
                    maxWidth: 420,
                    margin: '0 auto',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                    backgroundColor: '#000000',
                  }}
                >
                  <video
                    src={videoUrl}
                    controls
                    playsInline
                    style={{ width: '100%', display: 'block', maxHeight: 680 }}
                  />
                </div>

                {/* CTAs */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => window.open(`/api/download?url=${encodeURIComponent(videoUrl)}`, '_blank')}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 8,
                      backgroundColor: 'var(--accent-primary)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Download size={16} />
                    <span>Download MP4</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareVideo}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Share2 size={16} />
                    <span>{shareStatus || 'Share Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartNewProject}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 8,
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <RotateCcw size={16} />
                    <span>Create New Video</span>
                  </button>
                </div>

                {/* Optional Script & Scene Breakdown Accordion */}
                {scenes.length > 0 && (
                  <div style={{ maxWidth: 720, width: '100%', margin: '20px auto 0', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setIsScriptExpanded(!isScriptExpanded)}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          View Script & Storyboard Breakdown ({scenes.length} Scenes)
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {isScriptExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {isScriptExpanded && (
                      <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 14 }}>
                        {/* Cast & Setting summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 12 }}>
                          {character1 && (
                            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 6 }}>
                              <strong style={{ color: 'var(--accent-primary)' }}>Character 1:</strong> {character1}
                            </div>
                          )}
                          {character2 && (
                            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 6 }}>
                              <strong style={{ color: 'var(--accent-primary)' }}>Character 2:</strong> {character2}
                            </div>
                          )}
                          {setting && (
                            <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '8px 12px', borderRadius: 6, gridColumn: '1 / -1' }}>
                              <strong style={{ color: 'var(--accent-primary)' }}>Setting:</strong> {setting}
                            </div>
                          )}
                        </div>

                        {/* Scenes list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {scenes.map((rawSc, sIdx) => {
                            const sc = parseScene(rawSc, sIdx);
                            return (
                              <div key={sIdx} style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                                    {sc.title} · {sc.purpose}
                                  </span>
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>
                                  <strong>Visual:</strong> {sc.visual}
                                </div>
                                {sc.dialogue && (
                                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: 4 }}>
                                    <strong>Dialogue:</strong> "{sc.dialogue}"
                                  </div>
                                )}
                                {sc.camera && (
                                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                    <strong>Camera:</strong> {sc.camera}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* End frame preview */}
                        {scriptPayloadData?.endFrame && (
                          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 4 }}>
                              Composited End Frame
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                              <strong>{scriptPayloadData.endFrame.businessName}</strong>
                              {scriptPayloadData.endFrame.address && <span> · {scriptPayloadData.endFrame.address}</span>}
                              {scriptPayloadData.endFrame.offer && <span style={{ color: 'var(--accent-primary)' }}> · {scriptPayloadData.endFrame.offer}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* EMPTY RENDER STATE / RECOVERY */
              <div
                style={{
                  maxWidth: 580,
                  margin: '40px auto',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 14,
                  padding: '36px 28px',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)', marginBottom: 14 }}>
                  <Film size={26} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                  Ready to Produce Video
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
                  {scenes.length > 0
                    ? `Your ${scenes.length}-scene storyboard is approved and ready for GPU production.`
                    : 'Start by providing your brand and creative brief to generate your film script.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {scenes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep('storyboard')}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 8,
                        backgroundColor: 'var(--accent-primary)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <ArrowLeft size={14} />
                      <span>Review Script & Storyboard</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep('input');
                      setCreationStep(scenes.length > 0 ? 3 : 2);
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{scenes.length > 0 ? 'Edit Options' : 'Go to Brief'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        </>
      )}
      </main>
    </div>
  );
}
