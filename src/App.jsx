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

// Pipeline Checklist for Checkpoint 4 Script Generation & Section 8 Quality Gate
const SCRIPT_GEN_STAGES = [
  {
    phase: 'STORY ARC COMPOSITION',
    title: 'Writing 4-scene narrative arc…',
    detail: 'Translating approved plot and hook into Hook → Build → Turn → Resolution scenes.',
  },
  {
    phase: 'CHARACTER & LOCATION CONTINUITY',
    title: 'Locking visual anchors & eye-lines…',
    detail: 'Enforcing single-location setting, 2-character casting, and dynamic camera angles.',
  },
  {
    phase: 'DIALOGUE & SCRIPT VALIDATION',
    title: 'Crafting natural spoken dialogue…',
    detail: 'Writing authentic lines in target language without superlatives or ad-speak.',
  },
  {
    phase: 'QUALITY GATE & REPAIR PASS',
    title: 'Running Product Spine Section 8 Quality Gate…',
    detail: 'Verifying 18+ strict rules, claim bounds, and zero on-screen text/UI.',
  },
];

// Dynamic Creative Insights during Script Generation
const SCRIPT_GEN_TIPS = [
  'Product Spine Rule M13: All 4 scenes share the same room and lighting so neural video models maintain continuity.',
  'Product Spine Rule M10: Maximum 2 dialogue lines per character per scene avoids audio drift.',
  'Product Spine Rule M4: Dialogue lines are rendered in Devanagari script for flawless speech pronunciation.',
  'Product Spine Rule M8: On-screen text, phone UIs, and background music are strictly excluded from generation.',
  'Product Spine Rule M28: Physical gestures, reactions, and eye contact create authentic commercial chemistry.',
];

// Pipeline Stages for Video GPU Rendering
const RENDER_STAGES = [
  {
    phase: 'SCENE INITIALIZATION',
    title: 'Allocating GPU render pipeline & staging scenes…',
    detail: 'Loading creative parameters, character visual anchors, and audio seeds.',
  },
  {
    phase: 'FRAME GENERATION',
    title: 'Generating high-definition neural video frames…',
    detail: 'Synthesizing scene visual direction, camera motion, and cinematic depth.',
  },
  {
    phase: 'CHARACTER CONTINUITY',
    title: 'Harmonizing character consistency & lighting…',
    detail: 'Preserving identity facial traits and spatial illumination across all cuts.',
  },
  {
    phase: 'COMPOSITING & AUDIO',
    title: 'Compositing voiceover dialogue & sound design…',
    detail: 'Synchronizing spoken speech, sound effects, ambience, and music layers.',
  },
  {
    phase: 'MASTERING 1080p',
    title: 'Encoding & packaging high-resolution master MP4…',
    detail: 'Finalizing frame rates, color grading, and compression for export.',
  },
];

const RENDER_TIPS = [
  'Color grading is matched across all scenes to ensure cinematic lighting continuity.',
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
    try {
      const saved = localStorage.getItem('clevertize_user_context');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      businessName: '',
      businessType: 'Sweet shop / bakery',
      customBusinessType: '',
      town: 'Bangalore',
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
    };
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

  // Workflow Stages:
  // 'input' -> Stage 1 form
  // 'cp1_direction' -> Checkpoint 1 (Customer Tension)
  // 'cp2_plot' -> Checkpoint 2 (Plot Line & Viral Hook)
  // 'cp3_story' -> Checkpoint 3 (Story Arc & Format)
  // 'storyboard' -> Checkpoint 4 (Script Review & Storyboard Studio)
  // 'render' -> Video Rendering & Delivery
  const [currentStep, setCurrentStep] = useState('input');

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
  const [activeCheckpointName, setActiveCheckpointName] = useState('');
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

  // Ticker during Script Generation & Quality Gate Repair Loop
  useEffect(() => {
    let stepTimer = null;
    let tipTimer = null;

    if (isBusy && currentStep === 'cp3_story') {
      setScriptGenStep(0);
      setScriptTipIndex(Math.floor(Math.random() * SCRIPT_GEN_TIPS.length));

      stepTimer = setInterval(() => {
        setScriptGenStep((prev) => (prev < SCRIPT_GEN_STAGES.length - 1 ? prev + 1 : prev));
      }, 3500);

      tipTimer = setInterval(() => {
        setScriptTipIndex((prev) => (prev + 1) % SCRIPT_GEN_TIPS.length);
      }, 4500);
    } else {
      setScriptGenStep(0);
    }

    return () => {
      if (stepTimer) clearInterval(stepTimer);
      if (tipTimer) clearInterval(tipTimer);
    };
  }, [isBusy, currentStep]);

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

  // Build the Form Payload for POST /api/session
  const buildSessionPayload = () => {
    const activeGoal = AD_GOAL_PRESETS.find((g) => g.id === userContext.selectedGoalId) || AD_GOAL_PRESETS[0];
    const bType = userContext.businessType === 'Other' && userContext.customBusinessType.trim()
      ? userContext.customBusinessType.trim()
      : userContext.businessType;

    // Enrich specialty with all user inputs so Claude receives the entire creative brief
    const specialtyParts = [
      userContext.specialty?.trim(),
      userContext.brief?.trim() ? `Creative Brief/Idea: ${userContext.brief.trim()}` : null,
      activeGoal.objective ? `Ad Focus: ${activeGoal.objective}` : null,
      userContext.leadCharacter?.trim() ? `Lead Character: ${userContext.leadCharacter.trim()}` : null,
      userContext.supportingCharacter?.trim() ? `Supporting Character: ${userContext.supportingCharacter.trim()}` : null,
      userContext.environment?.trim() ? `Setting/Environment: ${userContext.environment.trim()}` : null,
      userContext.websiteUrl?.trim() ? `Website: ${userContext.websiteUrl.trim()}` : null,
    ].filter(Boolean);

    return {
      businessName: userContext.businessName.trim(),
      businessType: bType || 'Retail Store',
      town: userContext.town.trim() || 'Metro',
      language: userContext.language || 'Hindi',
      area: userContext.area?.trim() || '',
      specialty: specialtyParts.join(' | '),
      offer: userContext.offer?.trim() || '',
      occasion: userContext.occasion?.trim() || '',
      contact: userContext.contact?.trim() || '',
      ownerName: userContext.ownerName?.trim() || userContext.leadCharacter?.trim() || '',
      scriptMode: userContext.scriptMode === 'roman' ? 'roman' : 'devanagari',
      shopPhoto: userContext.shopPhoto ? { mime: userContext.shopPhoto.mime, data: userContext.shopPhoto.data } : null,
      productPhoto: userContext.productPhoto ? { mime: userContext.productPhoto.mime, data: userContext.productPhoto.data } : null,
    };
  };

  // START: POST /api/session -> CHECKPOINT 1 (DIRECTION)
  const handleStartCreativeEngine = async () => {
    if (!userContext.businessName.trim()) {
      setValidationError('Please enter your business or brand name.');
      return;
    }
    if (!userContext.town.trim()) {
      setValidationError('Please enter your town or city (e.g. Bangalore, Indore, Mumbai).');
      return;
    }
    if (!userContext.brief.trim() && !userContext.specialty.trim()) {
      setValidationError('Please tell us about your video idea or what your business sells.');
      return;
    }

    setValidationError('');
    setErrorMessage('');
    setQualityFailures([]);
    setIsBusy(true);
    setActiveCheckpointName('Checkpoint 1 · Creative Direction & Tensions');
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
    setIsBusy(true);
    setErrorMessage('');
    setActiveCheckpointName('Checkpoint 2 · Plot Line & Viral Hooks');
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
    setIsBusy(true);
    setErrorMessage('');
    setActiveCheckpointName('Checkpoint 3 · Story Arc & Production Format');
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
    setIsBusy(true);
    setErrorMessage('');
    setQualityFailures([]);
    setActiveCheckpointName('Checkpoint 4 · Script Writing & Section 8 Quality Gate');
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

      const storyTag = `${storyData?.format || 'Film'} · 4 Scenes`;
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

      // 2. Start Magnific Run with stripped edit notes and consistent characters
      const runPayload = {
        scenes: scenes.map((s) => s.trim()).filter(Boolean),
        character1: character1.trim(),
        character2: character2.trim(),
        setting: setting.trim(),
        productPhoto: userContext.productPhoto ? { mime: userContext.productPhoto.mime, data: userContext.productPhoto.data } : null,
        logo: userContext.logo ? { mime: userContext.logo.mime, data: userContext.logo.data } : null,
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
          return;
        }

        if (data.failed) {
          stopTimer();
          setIsRendering(false);
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
    setSessionId(null);
    setDirectionData(null);
    setPlotData(null);
    setStoryData(null);
    setScriptPayloadData(null);
    setScenes([]);
    setVideoUrl('');
    setApprovedSummary([]);
    setErrorMessage('');
    setQualityFailures([]);
    updateUserContext('brief', '');
    updateUserContext('productPhoto', null);
    setCurrentStep('input');
    setBrandFlowState(userContext.businessName ? 'create' : 'setup');
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
      town: 'Bangalore',
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
              >
                <Store size={14} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{userContext.businessName}</span>
                {userContext.town && <span style={{ color: 'var(--text-tertiary)' }}>· {userContext.town}</span>}
                <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>· Manage</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCurrentStep('input');
                  setBrandFlowState('setup');
                }}
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
            >
              <RotateCcw size={13} />
              <span>New Film</span>
            </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE BREADCRUMB / CHECKPOINT PROGRESS TRACKER */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)', padding: '10px 24px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ fontWeight: currentStep === 'input' ? 700 : 500, color: currentStep === 'input' ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
              1. Brief & Context
            </span>
            <span style={{ color: 'var(--border-strong)' }}>→</span>
            <span style={{ fontWeight: currentStep === 'cp1_direction' ? 700 : 500, color: currentStep === 'cp1_direction' ? 'var(--accent-primary)' : approvedSummary.some((a) => a.stage === 'Direction') ? 'var(--success)' : 'var(--text-tertiary)' }}>
              2. Direction
            </span>
            <span style={{ color: 'var(--border-strong)' }}>→</span>
            <span style={{ fontWeight: currentStep === 'cp2_plot' ? 700 : 500, color: currentStep === 'cp2_plot' ? 'var(--accent-primary)' : approvedSummary.some((a) => a.stage === 'Plot') ? 'var(--success)' : 'var(--text-tertiary)' }}>
              3. Plot Line
            </span>
            <span style={{ color: 'var(--border-strong)' }}>→</span>
            <span style={{ fontWeight: currentStep === 'cp3_story' ? 700 : 500, color: currentStep === 'cp3_story' ? 'var(--accent-primary)' : approvedSummary.some((a) => a.stage === 'Story') ? 'var(--success)' : 'var(--text-tertiary)' }}>
              4. Story Arc
            </span>
            <span style={{ color: 'var(--border-strong)' }}>→</span>
            <span style={{ fontWeight: currentStep === 'storyboard' ? 700 : 500, color: currentStep === 'storyboard' ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
              5. Storyboard & Quality Gate
            </span>
            <span style={{ color: 'var(--border-strong)' }}>→</span>
            <span style={{ fontWeight: currentStep === 'render' ? 700 : 500, color: currentStep === 'render' ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
              6. Video Render
            </span>
          </div>

          {elapsedTime !== '00:00' && isBusy && (
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Town / City
                  </label>
                  <input
                    type="text"
                    value={userContext.town}
                    onChange={(e) => updateUserContext('town', e.target.value)}
                    placeholder="e.g. Bangalore, Indore, Mumbai"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Area / Neighborhood
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
      <main style={{ flex: 1, maxWidth: currentStep === 'storyboard' ? 1240 : 860, width: '100%', margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* GLOBAL ERROR BANNER */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--error-subtle)',
              border: '1px solid var(--error)',
              borderRadius: 8,
              color: 'var(--error)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{errorMessage}</div>
              {qualityFailures.length > 0 && (
                <ul style={{ margin: '8px 0 0', paddingLeft: 16, fontSize: 12, lineHeight: 1.5 }}>
                  {qualityFailures.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 1: BRAND SETUP -> CONFIRMATION -> VIDEO BRIEF WORKSPACE
            ======================================================== */}
        {currentStep === 'input' && (
          <div>
            {/* 1A. BRAND SETUP SCREEN (First-time or Switch Brand) */}
            {brandFlowState === 'setup' && (
              <div
                style={{
                  maxWidth: 580,
                  margin: '24px auto',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 12,
                  padding: '32px 36px',
                }}
              >
                <div style={{ marginBottom: 24, textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      padding: 12,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)',
                      marginBottom: 12,
                    }}
                  >
                    <Building2 size={24} />
                  </div>
                  <h1
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: 'var(--text-primary)',
                      margin: '0 0 6px',
                    }}
                  >
                    Set up your brand
                  </h1>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Tell us a little about your business. We'll use this context to create more consistent videos.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label
                      htmlFor="setupBrandName"
                      style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}
                    >
                      Brand / Business Name <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <input
                      id="setupBrandName"
                      type="text"
                      autoFocus
                      value={userContext.businessName}
                      onChange={(e) => {
                        updateUserContext('businessName', e.target.value);
                        setValidationError('');
                      }}
                      placeholder="e.g. Kanti Sweets, Sharma General Store"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: 13,
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: validationError && !userContext.businessName.trim() ? 'var(--error)' : 'var(--border-default)',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="setupWebsite"
                      style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}
                    >
                      Website <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)' }}>(Optional)</span>
                    </label>
                    <input
                      id="setupWebsite"
                      type="text"
                      value={userContext.websiteUrl}
                      onChange={(e) => updateUserContext('websiteUrl', e.target.value)}
                      placeholder="e.g. kantisweets.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: 13,
                        backgroundColor: 'var(--bg-elevated)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div>
                      <label
                        htmlFor="setupTown"
                        style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}
                      >
                        Town / City <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <input
                        id="setupTown"
                        type="text"
                        value={userContext.town}
                        onChange={(e) => {
                          updateUserContext('town', e.target.value);
                          setValidationError('');
                        }}
                        placeholder="e.g. Bangalore, Indore, Mumbai"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: 13,
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: validationError && !userContext.town.trim() ? 'var(--error)' : 'var(--border-default)',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="setupArea"
                        style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}
                      >
                        Area / Neighborhood <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>(Optional)</span>
                      </label>
                      <input
                        id="setupArea"
                        type="text"
                        value={userContext.area}
                        onChange={(e) => updateUserContext('area', e.target.value)}
                        placeholder="e.g. Indiranagar, Palasia"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: 13,
                          backgroundColor: 'var(--bg-elevated)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="setupBusinessType"
                      style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}
                    >
                      Business Category <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <select
                      id="setupBusinessType"
                      value={userContext.businessType}
                      onChange={(e) => updateUserContext('businessType', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: 13,
                        backgroundColor: 'var(--bg-elevated)',
                      }}
                    >
                      {BUSINESS_TYPE_PRESETS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {userContext.businessType === 'Other' && (
                    <div>
                      <label
                        style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}
                      >
                        Specify Business Category <span style={{ color: 'var(--error)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={userContext.customBusinessType}
                        onChange={(e) => updateUserContext('customBusinessType', e.target.value)}
                        placeholder="e.g. Luxury Handloom Store"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: 13,
                          backgroundColor: 'var(--bg-elevated)',
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--text-tertiary)',
                        marginBottom: 10,
                        marginTop: 4,
                      }}
                    >
                      Brand Assets <span style={{ fontSize: 10, fontWeight: 400 }}>(Optional)</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <UploadTile
                        id="setupBrandDoc"
                        label="Brand Guidelines"
                        hint="PDF or DOCX document"
                        accept=".pdf,.doc,.docx"
                        file={userContext.brandFile}
                        onChange={(f) => handleFileUpload(f, 'brandFile')}
                        icon={FileText}
                      />
                      <UploadTile
                        id="setupShopPhoto"
                        label="Business / Store Photos"
                        hint="Storefront, signboard, or interior"
                        accept="image/*"
                        capture="environment"
                        file={userContext.shopPhoto}
                        onChange={(f) => handleFileUpload(f, 'shopPhoto')}
                        icon={ImageIcon}
                      />
                      <UploadTile
                        id="setupLogo"
                        label="Brand Logo"
                        hint="High-resolution PNG or JPG"
                        accept="image/*"
                        file={userContext.logo}
                        onChange={(f) => handleFileUpload(f, 'logo')}
                        icon={Building2}
                      />
                    </div>
                  </div>

                  {validationError && (
                    <div
                      role="alert"
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--error-subtle)',
                        border: '1px solid var(--error)',
                        borderRadius: 6,
                        color: 'var(--error)',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <AlertCircle size={14} />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!userContext.businessName.trim()) {
                          setValidationError('Please enter your brand or business name.');
                          return;
                        }
                        if (!userContext.town.trim()) {
                          setValidationError('Please enter your town or city.');
                          return;
                        }
                        setValidationError('');
                        setBrandFlowState('confirmation');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        backgroundColor: 'var(--accent-primary)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 2px 8px var(--accent-glow)',
                      }}
                    >
                      <span>Continue</span>
                      <ArrowRight size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setValidationError('');
                        setBrandFlowState('create');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 12,
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      Skip brand setup for now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 1B. BRAND CONFIRMATION SUMMARY */}
            {brandFlowState === 'confirmation' && (
              <div
                style={{
                  maxWidth: 540,
                  margin: '32px auto',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 12,
                  padding: '32px 36px',
                }}
              >
                <div style={{ marginBottom: 24, textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      padding: 12,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      color: 'var(--success)',
                      marginBottom: 12,
                    }}
                  >
                    <Check size={24} strokeWidth={2.5} />
                  </div>
                  <h1
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: 'var(--text-primary)',
                      margin: '0 0 6px',
                    }}
                  >
                    Brand setup complete
                  </h1>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Your business context is saved and ready for commercial video production.
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginBottom: 24,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Brand Name</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{userContext.businessName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Category</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {userContext.businessType === 'Other' && userContext.customBusinessType ? userContext.customBusinessType : userContext.businessType}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Location</span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {userContext.town}{userContext.area ? `, ${userContext.area}` : ''}
                    </span>
                  </div>
                  {userContext.websiteUrl && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Website</span>
                      <span style={{ color: 'var(--text-primary)' }}>{userContext.websiteUrl}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Brand Guidelines</span>
                    <span style={{ color: userContext.brandFile ? 'var(--success)' : 'var(--text-tertiary)', fontWeight: userContext.brandFile ? 600 : 400 }}>
                      {userContext.brandFile ? `✓ Added (${userContext.brandFile.name})` : 'Not added'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Business Photos</span>
                    <span style={{ color: userContext.shopPhoto ? 'var(--success)' : 'var(--text-tertiary)', fontWeight: userContext.shopPhoto ? 600 : 400 }}>
                      {userContext.shopPhoto ? `✓ Added (${userContext.shopPhoto.name})` : 'Not added'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Brand Logo</span>
                    <span style={{ color: userContext.logo ? 'var(--success)' : 'var(--text-tertiary)', fontWeight: userContext.logo ? 600 : 400 }}>
                      {userContext.logo ? `✓ Added (${userContext.logo.name})` : 'Not added'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFlowState('setup');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Edit Brand
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBrandFlowState('create');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      flex: 2,
                      padding: '12px 20px',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 2px 8px var(--accent-glow)',
                    }}
                  >
                    <span>Create Video</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* 1C. STREAMLINED VIDEO BRIEF WORKSPACE */}
            {brandFlowState === 'create' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Brand Context Banner */}
                {userContext.businessName ? (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 10,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260, flex: 1 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 8,
                          backgroundColor: 'var(--accent-subtle)',
                          color: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Store size={20} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                            Creating for: {userContext.businessName}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            · {userContext.town}{userContext.area ? `, ${userContext.area}` : ''}
                          </span>
                          {userContext.websiteUrl && (
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                              · {userContext.websiteUrl}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          <span>
                            Guidelines: {userContext.brandFile ? <strong style={{ color: 'var(--success)' }}>✓ Added</strong> : 'Not added'}
                          </span>
                          <span>·</span>
                          <span>
                            Photos: {userContext.shopPhoto ? <strong style={{ color: 'var(--success)' }}>✓ Added</strong> : 'Not added'}
                          </span>
                          <span>·</span>
                          <span>
                            Logo: {userContext.logo ? <strong style={{ color: 'var(--success)' }}>✓ Added</strong> : 'Not added'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBrandFlowState('setup');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Edit Brand</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px dashed var(--accent-primary)',
                      borderRadius: 10,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 260, flex: 1 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          backgroundColor: 'var(--accent-subtle)',
                          color: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Building2 size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          Brand setup skipped (Generic Commercial)
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          Want your business name spoken in dialogue and styled with your storefront colors?
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBrandFlowState('setup');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: 'var(--accent-primary)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 1px 4px var(--accent-glow)',
                      }}
                    >
                      <Building2 size={13} />
                      <span>Set Up Brand Now</span>
                    </button>
                  </div>
                )}

                {/* 1. Video Idea / Campaign Brief Card */}
                <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label htmlFor="briefInput" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                      1. Video Idea / Campaign Brief <span style={{ color: 'var(--error)' }}>*</span>
                    </label>

                    {micSupported && (
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: isListening ? '1px solid var(--error)' : '1px solid var(--border-default)',
                          backgroundColor: isListening ? 'var(--error-subtle)' : 'var(--bg-elevated)',
                          color: isListening ? 'var(--error)' : 'var(--text-secondary)',
                        }}
                      >
                        {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                        <span>{isListening ? 'Stop' : 'Dictate'}</span>
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 10px' }}>
                    Describe your promotion, hero product, festive offer, or relatable customer situation.
                  </p>

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
                    placeholder="e.g. Announce a festive Diwali gift sweet box with 50% discount and assorted dry fruits. Highlight fresh quality over boring generic gift boxes..."
                    style={{ width: '100%', padding: '12px 14px', fontSize: 14, lineHeight: 1.6, resize: 'vertical' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {userContext.brief.length} characters
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        Special Offer / Discount <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={userContext.offer}
                        onChange={(e) => updateUserContext('offer', e.target.value)}
                        placeholder="e.g. 50% off on gift boxes till Sunday"
                        style={{ width: '100%', padding: '8px 10px', fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        Specific Occasion / Festival <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={userContext.occasion}
                        onChange={(e) => updateUserContext('occasion', e.target.value)}
                        placeholder="e.g. Diwali (leave blank to auto-detect calendar)"
                        style={{ width: '100%', padding: '8px 10px', fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Ad Focus & Angle Presets */}
                <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                      2. Commercial Angle & CTA Focus
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      Shapes narrative arc & final voiceover line
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    {AD_GOAL_PRESETS.map((preset) => {
                      const Icon = preset.icon;
                      const isSelected = userContext.selectedGoalId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => updateUserContext('selectedGoalId', preset.id)}
                          style={{
                            padding: '12px 10px',
                            borderRadius: 8,
                            border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                            backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            textAlign: 'center',
                          }}
                        >
                          <Icon size={16} style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-tertiary)' }} />
                          <span style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Hero Product Photo */}
                <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 22 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 8 }}>
                    3. Hero Product Photo <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)' }}>(Recommended)</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 14px' }}>
                    Upload a clear photo of the specific product being showcased. It will directly guide neural video generation and end frames.
                  </p>

                  <UploadTile
                    id="productPhotoInput"
                    label="Hero Product Photo"
                    hint="Attached to video render and Claude vision"
                    accept="image/*"
                    file={userContext.productPhoto}
                    onChange={(f) => handleFileUpload(f, 'productPhoto')}
                    icon={ImageIcon}
                  />
                </div>

                {/* 4. Creative Casting & Setting Preferences */}
                <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 22 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 6 }}>
                    4. Creative Casting & Setting Preferences <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)' }}>(Optional)</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 14px' }}>
                    Specify characters or locations to guide the story. The AI ensures strict visual continuity across all scenes.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        Lead Character / Speaker
                      </label>
                      <input
                        type="text"
                        value={userContext.leadCharacter}
                        onChange={(e) => updateUserContext('leadCharacter', e.target.value)}
                        placeholder="e.g. Young female architect in her 30s"
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
                        placeholder="e.g. Her husband, or smiling shop owner"
                        style={{ width: '100%', padding: '8px 10px', fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        Storefront / Interior Setting
                      </label>
                      <input
                        type="text"
                        value={userContext.environment}
                        onChange={(e) => updateUserContext('environment', e.target.value)}
                        placeholder="e.g. Bright contemporary sweet boutique counter"
                        style={{ width: '100%', padding: '8px 10px', fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Dialogue Language & Script Mode */}
                <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 10, padding: 22 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: 14 }}>
                    5. Dialogue Language & Mode
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Dialogue Language
                      </label>
                      <div className="tab-group">
                        {['Hindi', 'Hinglish', 'English', 'Marathi'].map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => updateUserContext('language', lang)}
                            className={`tab-pill ${userContext.language === lang ? 'active-accent' : ''}`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Dialogue Script Mode
                      </label>
                      <div className="tab-group">
                        <button
                          type="button"
                          onClick={() => updateUserContext('scriptMode', 'devanagari')}
                          className={`tab-pill ${userContext.scriptMode === 'devanagari' ? 'active-accent' : ''}`}
                        >
                          Devanagari (Standard)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateUserContext('scriptMode', 'roman')}
                          className={`tab-pill ${userContext.scriptMode === 'roman' ? 'active-accent' : ''}`}
                        >
                          Romanized (Test)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Launch CTA */}
                {validationError && (
                  <div style={{ padding: '10px 14px', backgroundColor: 'var(--error-subtle)', border: '1px solid var(--error)', borderRadius: 8, color: 'var(--error)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={15} />
                    <span>{validationError}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleStartCreativeEngine}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: isBusy ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    boxShadow: '0 2px 10px var(--accent-glow)',
                  }}
                >
                  <span>Explore Creative Directions & Hooks</span>
                  <Sparkles size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            INTERACTIVE PROGRESS OVERLAY DURING CHECKPOINT TRANSITIONS
            ======================================================== */}
        {isBusy && (
          <div
            style={{
              maxWidth: 600,
              margin: '40px auto',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              padding: '36px 32px',
              textAlign: 'center',
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: 14,
                borderRadius: '50%',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                marginBottom: 16,
              }}
            >
              <Sparkles size={24} className="progress-indeterminate" />
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
              {activeCheckpointName}
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
              {currentStep === 'cp3_story'
                ? SCRIPT_GEN_STAGES[scriptGenStep]?.title || 'Writing Script…'
                : 'Formulating Creative Intelligence…'}
            </h2>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
              {currentStep === 'cp3_story'
                ? SCRIPT_GEN_STAGES[scriptGenStep]?.detail || 'Evaluating continuity and Section 8 gate rules.'
                : 'Evaluating customer frictions, hook patterns, and local brand voice.'}
            </p>

            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-elevated)', borderRadius: 8, border: '1px dashed var(--border-default)', textAlign: 'left', display: 'flex', gap: 10 }}>
              <Sparkle size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                  Creative Director Rule
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {SCRIPT_GEN_TIPS[scriptTipIndex]}
                </div>
              </div>
            </div>
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

            {/* Confirm & Next Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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

            {/* Confirm & Next Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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

            {/* Confirm & Next Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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
                    Stage 02 · Storyboard Studio
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
                    Section 8 Quality Gate Passed {scriptPayloadData?.meta?.attempts > 1 ? `(${scriptPayloadData.meta.attempts} passes)` : ''}
                  </span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Review & Approve Storyboard Script
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Review character consistency, camera staging, and spoken dialogue. You can edit any section before rendering.
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

            {/* APPROVE SCRIPT & SEND TO PRODUCTION BUTTON */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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
                  boxShadow: '0 2px 10px var(--accent-glow)',
                }}
              >
                <span>Approve Script & Send to Production</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 3: PRODUCTION & VIDEO RENDERING
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
                <div
                  style={{
                    display: 'inline-flex',
                    padding: 14,
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-subtle)',
                    color: 'var(--accent-primary)',
                    marginBottom: 16,
                  }}
                >
                  <Film size={26} className="progress-indeterminate" />
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
                  Phase 0{renderStep + 1} of 05 · {RENDER_STAGES[renderStep]?.phase}
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

                <div style={{ marginTop: 20, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-tertiary)' }}>
                  Elapsed GPU Time: {elapsedTime}
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
                    Mastered in broadcast-ready 1080p resolution, optimized for 9:16 mobile feeds.
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
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
