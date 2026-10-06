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
  Trash2
} from 'lucide-react';

// Script-relevant Ad Angle Presets
// Derived directly from how Claude constructs the story arc, scene pacing, and ending voiceover CTA
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
    cta: 'Experience the authentic fresh taste today',
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

// Production Generation Stages for engaging live progress
const SCRIPT_STAGES = [
  {
    phase: 'CREATIVE DIRECTION',
    title: 'Deconstructing video brief & marketing angle…',
    detail: 'Analyzing brand positioning, target hooks, and commercial narrative arc.',
  },
  {
    phase: 'CHARACTER DESIGN',
    title: 'Casting lead & supporting characters…',
    detail: 'Specifying expressive traits, styling, demographic fit, and visual anchors.',
  },
  {
    phase: 'WORLD BUILDING',
    title: 'Scouting lighting, atmosphere & setting…',
    detail: 'Crafting the color palette, interior ambience, and cinematographic world.',
  },
  {
    phase: 'STORYBOARD & DIALOGUE',
    title: 'Writing scene beats & spoken dialogue…',
    detail: 'Composing punchy hook lines, narrative progression, and natural phrasing.',
  },
  {
    phase: 'PRODUCTION NOTES',
    title: 'Finalizing camera motion & sound design…',
    detail: 'Directing camera angles, cinematic transitions, ambient foley, and music cues.',
  },
];

// Dynamic Creative Insights & Filmmaking Tips displayed during script generation
const SCRIPT_TIPS = [
  'Did you know? The first 3 seconds of a social video drive over 70% of viewer retention.',
  'Natural dialogue in the native tongue boosts viewer emotional trust by up to 2.4×.',
  'Establishing consistent character anchors before scene generation ensures flawless visual continuity.',
  'Every scene follows strict 1080p production framing ready for AI video rendering engines.',
  'Pacing rule: 15-second spots hit the hook instantly; 25-second spots allow deeper character connection.',
  'Clear environmental lighting notes keep consecutive scenes looking like they belong in the same film shoot.',
];

// Hook Generation Pipeline Stages (Product Spine Section 3 & 4)
const HOOK_STAGES = [
  {
    phase: 'INSIGHT ENGINE',
    title: 'Scanning customer tension & desire lenses…',
    detail: 'Evaluating 8 insight lenses to pinpoint authentic local consumer frictions.',
  },
  {
    phase: 'HOOK ARCHETYPES',
    title: 'Cross-referencing high-retention hook libraries…',
    detail: 'Consulting TrueFan AI and GoFaceless libraries for 3-second pattern interrupts.',
  },
  {
    phase: 'CREATIVE FORMULATION',
    title: 'Crafting 3 distinct opening hook angles…',
    detail: 'Formulating spoken lines in native tongue and scroll-stopping physical opening actions.',
  },
];

const HOOK_TIPS = [
  'Product Spine Rule M16: Borrow hook patterns and psychological triggers, never copy generic lines.',
  'A powerful 3-second hook does not need on-screen text — a physical action and clear line do the work.',
  'Area shoutout hooks create instant local relevance ("Bangalore waalon, suno!").',
  'Everyday crisis hooks connect immediately by showing relatable household urgency.',
];

// Production Pipeline Stages for the Video Rendering Engine
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

// Engaging Video Production & Marketing Insights during Video Render
const RENDER_TIPS = [
  'Color grading is matched across all scenes to ensure cinematic lighting continuity.',
  'Videos with front-loaded value propositions retain up to 3× higher engagement on mobile feeds.',
  'Our engine renders in broadcast-ready 1080p resolution, optimized for Instagram Reels and Shorts.',
  'Seamless scene transitions keep pacing snappy without causing visual jarring for the viewer.',
  'High-contrast focal points in the first frame drastically improve click-through and watch time.',
  'Voiceover cadence and background audio volume are dynamically balanced for vocal clarity.',
];

// Helper to parse ANNEX A scene scripts for structured editing
function parseScene(rawText, sceneIndex) {
  if (!rawText) {
    return {
      title: `SCENE ${String(sceneIndex + 1).padStart(2, '0')}`,
      purpose: '',
      visual: '',
      dialogue: '',
      camera: '',
      audio: '',
      notes: '',
      raw: '',
    };
  }

  let title = `SCENE ${String(sceneIndex + 1).padStart(2, '0')}`;
  let purpose = '';

  const titleMatch = rawText.match(/SCENE\s*(\d+)\s*(?:[–-—]\s*([^\n\r]+))?/i);
  if (titleMatch) {
    title = `SCENE ${String(titleMatch[1]).padStart(2, '0')}`;
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
    purpose: purpose || (sceneIndex === 0 ? 'HOOK' : sceneIndex === 1 ? 'PROBLEM' : sceneIndex === 2 ? 'SOLUTION' : 'CTA'),
    visual: visual || rawText,
    dialogue: dialogue || '',
    camera: camera || '',
    audio: audio || '',
    notes: notes || '',
    raw: rawText,
  };
}

// Reconstruct ANNEX A scene text when structured sections are edited
function rebuildScene({ title, purpose, visual, dialogue, camera, audio, notes, raw }) {
  if (!dialogue && !camera && !audio) {
    return raw || visual;
  }
  return `ANNEX A\n${title}${purpose ? ` – ${purpose}` : ''}\nVisual:\n${visual || 'None (per rules)'}\nAnimation Elements:\n${camera || 'None (per rules)'}\nAudio / Dialogue / Voiceover:\n${dialogue || 'None (per rules)'}\nSound Design / Music:\n${audio || 'None (per rules)'}\nEditing Notes (Optional):\n${notes || 'Output resolution: 1080p'}`;
}

export default function App() {
  // Brand Profile State (Conceptual persistent brand layer)
  const [brandName, setBrandName] = useState(() => {
    try {
      return localStorage.getItem('clevertize_brand_name') || '';
    } catch {
      return '';
    }
  });
  const [websiteUrl, setWebsiteUrl] = useState(() => {
    try {
      return localStorage.getItem('clevertize_website_url') || '';
    } catch {
      return '';
    }
  });
  const [brandFile, setBrandFile] = useState(null); // guidelines { name, mime, data }
  const [shopPhoto, setShopPhoto] = useState(null); // business photos { name, mime, data, previewUrl }

  // First-time vs Returning session state
  const [brandFlowState, setBrandFlowState] = useState(() => {
    try {
      return localStorage.getItem('clevertize_brand_name') ? 'create' : 'setup';
    } catch {
      return 'setup';
    }
  });

  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // Workflow Stages: 1 = Brief (Create Video), 2 = Creative Review, 3 = Render
  const [currentStage, setCurrentStage] = useState(1);

  // Video Specific Information
  const [brief, setBrief] = useState('');
  const [language, setLanguage] = useState('English'); // Tab selection: English vs Hindi
  const [duration, setDuration] = useState('15s'); // Tab selection: 10s, 15s, 20s, 25s
  const [selectedGoalId, setSelectedGoalId] = useState('offer'); // Tab selection: 4 focused ad angles
  const [productImage, setProductImage] = useState(null); // Optional hero product image

  // Hook Generation States (Product Spine Step 4)
  const [hooks, setHooks] = useState([]);
  const [selectedHook, setSelectedHook] = useState(null);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [hookGenStep, setHookGenStep] = useState(0);
  const [hookTipIndex, setHookTipIndex] = useState(0);
  const [isEditingHookLine, setIsEditingHookLine] = useState(false);
  const [customHookLine, setCustomHookLine] = useState('');

  // Stage 2 Generated Creative Data
  const [character1, setCharacter1] = useState('');
  const [character2, setCharacter2] = useState('');
  const [setting, setSetting] = useState('');
  const [scenes, setScenes] = useState([]);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isRawScriptMode, setIsRawScriptMode] = useState(false);
  const [isFoundationCollapsed, setIsFoundationCollapsed] = useState(false);

  // Creative Foundation Draft States
  const [isEditingCharacters, setIsEditingCharacters] = useState(false);
  const [char1Draft, setChar1Draft] = useState('');
  const [char2Draft, setChar2Draft] = useState('');

  const [isEditingSetting, setIsEditingSetting] = useState(false);
  const [settingDraft, setSettingDraft] = useState('');

  // Storyboard Section Edit Mode (visual | dialogue | camera | audio)
  const [editingSection, setEditingSection] = useState(null);
  const [sectionDraft, setSectionDraft] = useState('');

  // Stage 3 Rendering & Delivery
  const [videoUrl, setVideoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptGenStep, setScriptGenStep] = useState(0);
  const [scriptTipIndex, setScriptTipIndex] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderStep, setRenderStep] = useState(0);
  const [renderTipIndex, setRenderTipIndex] = useState(0);
  const [renderStatusText, setRenderStatusText] = useState('Initializing video render pipeline…');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [shareStatus, setShareStatus] = useState('');

  const handleShareVideo = async () => {
    if (!videoUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${brandName || 'AI Generated'} Video`,
          text: `Check out our video generated on Clevertize!`,
          url: videoUrl,
        });
        setShareStatus('Shared successfully!');
        setTimeout(() => setShareStatus(''), 3000);
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          // fallback to clipboard
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(videoUrl);
      setShareStatus('Link copied to clipboard!');
      setTimeout(() => setShareStatus(''), 3000);
    } catch {
      setShareStatus('Video link ready to copy.');
      setTimeout(() => setShareStatus(''), 3000);
    }
  };

  // Dynamic progress and insights ticker during hook generation
  useEffect(() => {
    let stepTimer = null;
    let tipTimer = null;

    if (isGeneratingHooks) {
      setHookGenStep(0);
      setHookTipIndex(Math.floor(Math.random() * HOOK_TIPS.length));

      stepTimer = setInterval(() => {
        setHookGenStep((prev) => (prev < HOOK_STAGES.length - 1 ? prev + 1 : prev));
      }, 2500);

      tipTimer = setInterval(() => {
        setHookTipIndex((prev) => (prev + 1) % HOOK_TIPS.length);
      }, 3500);
    } else {
      setHookGenStep(0);
    }

    return () => {
      if (stepTimer) clearInterval(stepTimer);
      if (tipTimer) clearInterval(tipTimer);
    };
  }, [isGeneratingHooks]);

  // Dynamic progress and insights ticker during script generation
  useEffect(() => {
    let stepTimer = null;
    let tipTimer = null;

    if (isGenerating) {
      setScriptGenStep(0);
      setScriptTipIndex(Math.floor(Math.random() * SCRIPT_TIPS.length));

      // Advance through generation phases realistically
      stepTimer = setInterval(() => {
        setScriptGenStep((prev) => (prev < SCRIPT_STAGES.length - 1 ? prev + 1 : prev));
      }, 3500);

      // Rotate engaging creative tips every 4.5 seconds
      tipTimer = setInterval(() => {
        setScriptTipIndex((prev) => (prev + 1) % SCRIPT_TIPS.length);
      }, 4500);
    } else {
      setScriptGenStep(0);
    }

    return () => {
      if (stepTimer) clearInterval(stepTimer);
      if (tipTimer) clearInterval(tipTimer);
    };
  }, [isGenerating]);

  // Dynamic progress and insights ticker during video rendering
  useEffect(() => {
    let stepTimer = null;
    let tipTimer = null;

    if (isRendering) {
      setRenderStep(0);
      setRenderTipIndex(Math.floor(Math.random() * RENDER_TIPS.length));

      // Advance through render phases over typical 2-3 minute lifecycle
      stepTimer = setInterval(() => {
        setRenderStep((prev) => (prev < RENDER_STAGES.length - 1 ? prev + 1 : prev));
      }, 25000);

      // Rotate production insights every 5.5 seconds
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

  // Stopwatch Timer
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const timerStartRef = useRef(0);
  const timerIntervalRef = useRef(null);

  // Web Speech API
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
        setMicHint('Listening… Speak your idea clearly.');
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
        setBrief(updated);
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
      baseSpeechTextRef.current = brief.trim();
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech recognition error:', err);
      }
    }
  };

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

  const handleFileChange = (file, setter) => {
    if (!file) {
      setter(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setter({
        name: file.name,
        mime: file.type,
        data: reader.result.split(',')[1],
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      });
    };
    reader.readAsDataURL(file);
  };

  const saveBrandToStorage = (name, url) => {
    try {
      if (name.trim()) localStorage.setItem('clevertize_brand_name', name.trim());
      else localStorage.removeItem('clevertize_brand_name');
      if (url.trim()) localStorage.setItem('clevertize_website_url', url.trim());
      else localStorage.removeItem('clevertize_website_url');
    } catch (e) {
      console.warn('Storage unavailable', e);
    }
  };

  const handleResetBrandProfile = () => {
    try {
      localStorage.removeItem('clevertize_brand_name');
      localStorage.removeItem('clevertize_website_url');
    } catch (e) {
      console.warn('Storage unavailable', e);
    }
    setBrandName('');
    setWebsiteUrl('');
    setBrandFile(null);
    setShopPhoto(null);
    setIsBrandModalOpen(false);
    setCurrentStage(1);
    setBrandFlowState('setup');
  };

  const isFormValid = brief.trim().length > 0;

  // STAGE 1 -> HOOKS GENERATION: Get 3 distinct creative hook choices from Claude (/api/hooks)
  const handleGenerateHooks = async () => {
    if (!isFormValid) {
      setValidationError('Please tell us what video you want to create.');
      return;
    }

    setValidationError('');
    setErrorMessage('');
    setIsGeneratingHooks(true);

    const activeGoal = AD_GOAL_PRESETS.find((g) => g.id === selectedGoalId) || AD_GOAL_PRESETS[0];

    const payload = {
      brief: brief.trim(),
      brandName: brandName.trim(),
      language: language.trim(),
      duration: duration.trim(),
      targetCustomers: activeGoal.targetCustomers,
      cta: activeGoal.cta,
      objective: activeGoal.objective,
    };

    try {
      const res = await fetch('/api/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (!data.hooks || data.hooks.length === 0) {
        throw new Error('No hook options returned. Please try again.');
      }

      setHooks(data.hooks);
      const initial = data.hooks[0];
      setSelectedHook(initial);
      setCustomHookLine(initial.hookLine);
      setIsEditingHookLine(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate hook options. Please try again.');
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  // HOOK SELECTION -> STAGE 2: Generate Full Storyboard & Script (/api/generate)
  const handleGenerateScriptWithHook = async (hookToUse) => {
    setValidationError('');
    setErrorMessage('');
    setIsGenerating(true);

    const activeGoal = AD_GOAL_PRESETS.find((g) => g.id === selectedGoalId) || AD_GOAL_PRESETS[0];
    const finalHook = hookToUse || selectedHook;

    const payload = {
      brief: brief.trim(),
      brandName: brandName.trim(),
      language: language.trim(),
      duration: duration.trim(),
      resolution: '1080p',
      businessLocation: '',
      targetCustomers: activeGoal.targetCustomers,
      cta: activeGoal.cta,
      objective: activeGoal.objective,
      geo: 'Metro & Tier 1',
      platform: 'Instagram Reels',
      websiteUrl: websiteUrl.trim(),
      brandFile: brandFile ? { name: brandFile.name, mime: brandFile.mime, data: brandFile.data } : null,
      shopPhoto: shopPhoto ? { name: shopPhoto.name, mime: shopPhoto.mime, data: shopPhoto.data } : null,
      productImage: productImage ? { name: productImage.name, mime: productImage.mime, data: productImage.data } : null,
      selectedHook: finalHook
        ? {
            id: finalHook.id,
            archetype: finalHook.archetype,
            angle: finalHook.angle,
            hookLine: customHookLine.trim() || finalHook.hookLine,
            visualAction: finalHook.visualAction,
          }
        : null,
    };

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCharacter1(data.character1 || '');
      setCharacter2(data.character2 || '');
      setSetting(data.setting || '');
      setScenes(data.scenes || []);
      setActiveSceneIndex(0);

      setCurrentStage(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // STAGE 2 -> STAGE 3: Render Video (/api/run)
  const handleRenderVideo = async () => {
    if (!scenes.length) {
      alert('No scenes found to render.');
      return;
    }

    setErrorMessage('');
    setIsRendering(true);
    setCurrentStage(3);
    setRenderStatusText('Initializing video render pipeline…');
    startTimer();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const payload = {
      scenes: scenes.map((s) => s.trim()).filter(Boolean),
      character1: character1.trim(),
      character2: character2.trim(),
      setting: setting.trim(),
      productImage: productImage ? { name: productImage.name, mime: productImage.mime, data: productImage.data } : null,
    };

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setRenderStatusText('Rendering video frames…');
      await pollStatus(data.runId);
    } catch (err) {
      stopTimer();
      setIsRendering(false);
      setErrorMessage(err.message || 'Failed to start video rendering.');
    }
  };

  // Poll /api/status/:runId
  const pollStatus = async (runId) => {
    const maxAttempts = 160;
    for (let i = 1; i <= maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 15000));
      try {
        const res = await fetch(`/api/status/${runId}`);
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

        const isRawOrGeneric = !data.status || /run|process|pending|queue|unknown|null|undefined/i.test(String(data.status));
        const niceStatus = !isRawOrGeneric
          ? String(data.status).replace(/^_+|_+$/g, '').replace(/_/g, ' ')
          : 'Generating and compositing video scenes…';
        setRenderStatusText(niceStatus);
      } catch (e) {
        // Quiet poll
      }
    }

    stopTimer();
    setIsRendering(false);
    setRenderStatusText('Still processing in background.');
  };

  // Structured scene updater
  const updateActiveSceneSection = (key, value) => {
    const activeText = scenes[activeSceneIndex] || '';
    const parsed = parseScene(activeText, activeSceneIndex);
    parsed[key] = value;
    const newSceneText = rebuildScene(parsed);
    const updated = [...scenes];
    updated[activeSceneIndex] = newSceneText;
    setScenes(updated);
  };

  // Creative Foundation Handlers
  const handleStartEditCharacters = () => {
    setChar1Draft(character1);
    setChar2Draft(character2);
    setIsEditingCharacters(true);
  };

  const handleSaveCharacters = () => {
    setCharacter1(char1Draft);
    setCharacter2(char2Draft);
    setIsEditingCharacters(false);
  };

  const handleCancelCharacters = () => {
    setChar1Draft(character1);
    setChar2Draft(character2);
    setIsEditingCharacters(false);
  };

  const handleStartEditSetting = () => {
    setSettingDraft(setting);
    setIsEditingSetting(true);
  };

  const handleSaveSetting = () => {
    setSetting(settingDraft);
    setIsEditingSetting(false);
  };

  const handleCancelSetting = () => {
    setSettingDraft(setting);
    setIsEditingSetting(false);
  };

  // Storyboard Section Handlers
  const handleStartEditSection = (section, initialVal) => {
    setEditingSection(section);
    setSectionDraft(initialVal || '');
  };

  const handleSaveEditSection = () => {
    if (editingSection) {
      updateActiveSceneSection(editingSection, sectionDraft);
      setEditingSection(null);
      setSectionDraft('');
    }
  };

  const handleCancelEditSection = () => {
    setEditingSection(null);
    setSectionDraft('');
  };

  // Upload Tile Component
  const UploadTile = ({ id, label, hint, accept, file, onChange, capture, icon: Icon = Upload }) => {
    const inputRef = useRef(null);
    return (
      <div
        style={{
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          padding: '10px 12px',
          backgroundColor: file ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          {file && file.previewUrl ? (
            <img
              src={file.previewUrl}
              alt={file.name}
              style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                backgroundColor: file ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: file ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                flexShrink: 0,
              }}
            >
              {file ? <Check size={16} strokeWidth={2.5} /> : <Icon size={14} />}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
            <div
              style={{
                fontSize: 11,
                color: file ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {file ? file.name : hint}
            </div>
          </div>
        </div>

        <div>
          {file ? (
            <button
              type="button"
              aria-label={`Remove ${label}`}
              onClick={() => onChange(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--error)',
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              id={id}
              onClick={() => inputRef.current?.click()}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            capture={capture}
            style={{ display: 'none' }}
            onChange={(e) => handleFileChange(e.target.files[0], onChange)}
          />
        </div>
      </div>
    );
  };

  const currentParsedScene = parseScene(scenes[activeSceneIndex] || '', activeSceneIndex);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ========================================================
          TOP APPLICATION HEADER
         ======================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backgroundColor: 'rgba(16, 18, 23, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Logo / Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Film size={14} strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
              }}
            >
              CLEVERTIZE
            </span>
          </div>

          {/* Workflow Stepper: 01 Brief  02 Creative  03 Render */}
          <nav aria-label="Stages" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => {
                if (!isGenerating && !isRendering) {
                  setCurrentStage(1);
                  setBrandFlowState('create');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                cursor: isGenerating || isRendering ? 'default' : 'pointer',
                padding: '4px 6px',
                color: currentStage === 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  color:
                    currentStage === 1
                      ? 'var(--accent-primary)'
                      : currentStage > 1
                      ? 'var(--success)'
                      : 'var(--text-tertiary)',
                }}
              >
                01 {currentStage > 1 ? '✓' : currentStage === 1 ? '•' : 'o'}
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: currentStage === 1 ? 600 : 500 }}>
                Brief
              </span>
            </button>

            <span style={{ color: 'var(--border-default)', fontSize: 11 }}>—</span>

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => scenes.length > 0 && !isRendering && setCurrentStage(2)}
              disabled={scenes.length === 0 || isRendering}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                cursor: scenes.length > 0 && !isRendering ? 'pointer' : 'default',
                opacity: scenes.length === 0 ? 0.35 : 1,
                padding: '4px 6px',
                color: currentStage === 2 ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  color:
                    currentStage === 2
                      ? 'var(--accent-primary)'
                      : currentStage > 2
                      ? 'var(--success)'
                      : 'var(--text-tertiary)',
                }}
              >
                02 {currentStage > 2 ? '✓' : currentStage === 2 ? '•' : 'o'}
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: currentStage === 2 ? 600 : 500 }}>
                Creative
              </span>
            </button>

            <span style={{ color: 'var(--border-default)', fontSize: 11 }}>—</span>

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => (videoUrl || isRendering) && setCurrentStage(3)}
              disabled={!videoUrl && !isRendering}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                cursor: videoUrl || isRendering ? 'pointer' : 'default',
                opacity: !videoUrl && !isRendering ? 0.35 : 1,
                padding: '4px 6px',
                color: currentStage === 3 ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  color:
                    currentStage === 3
                      ? 'var(--accent-primary)'
                      : videoUrl
                      ? 'var(--success)'
                      : 'var(--text-tertiary)',
                }}
              >
                03 {videoUrl ? '✓' : currentStage === 3 ? '•' : 'o'}
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: currentStage === 3 ? 600 : 500 }}>
                Render
              </span>
            </button>
          </nav>

          {/* Right Brand Action / Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {brandName ? (
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 6,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Building2 size={13} color="var(--accent-primary)" />
                <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {brandName}
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>· Manage</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCurrentStage(1);
                  setBrandFlowState('setup');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
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
          </div>
        </div>
      </header>

      {/* ========================================================
          BRAND MANAGEMENT MODAL (DRAWER / MODAL)
         ======================================================== */}
      {isBrandModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsBrandModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Brand Profile
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  Set once for all videos created in this session.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Brand / Business Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Kanti Sweets"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, backgroundColor: 'var(--bg-elevated)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Website
                </label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="e.g. kantisweets.com"
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, backgroundColor: 'var(--bg-elevated)' }}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                  Brand Assets
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <UploadTile
                    id="modalBrandGuidelines"
                    label="Brand Guidelines"
                    hint="PDF or DOCX document"
                    accept=".pdf,.doc,.docx"
                    file={brandFile}
                    onChange={setBrandFile}
                    icon={FileText}
                  />
                  <UploadTile
                    id="modalShopPhoto"
                    label="Business Photos"
                    hint="Storefront, signboard, or interior"
                    accept="image/*"
                    capture="environment"
                    file={shopPhoto}
                    onChange={setShopPhoto}
                    icon={ImageIcon}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Trash2 size={13} />
                  <span>Add New Brand / Reset</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveBrandToStorage(brandName, websiteUrl);
                    setIsBrandModalOpen(false);
                  }}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
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

      {/* ========================================================
          MAIN WORKSPACE
         ======================================================== */}
      <main
        style={{
          flex: 1,
          maxWidth: currentStage === 2 ? 1240 : 820,
          width: '100%',
          margin: '0 auto',
          padding: currentStage === 2 ? '32px 24px 104px' : '36px 20px 64px',
          transition: 'max-width 0.2s ease',
        }}
      >
        {/* ========================================================
            STAGE 1: STREAMLINED CREATE VIDEO SCREEN
           ======================================================== */}
        {currentStage === 1 && (
          <div>
            {/* Loading / Generating Hooks State (Product Spine Section 3 & 4) */}
            {isGeneratingHooks ? (
              <div
                style={{
                  maxWidth: 600,
                  margin: '48px auto',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '36px 32px',
                  borderRadius: 14,
                  border: '1px solid var(--border-default)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                }}
              >
                {/* Header with active icon and phase badge */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      padding: 14,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)',
                      marginBottom: 14,
                      position: 'relative',
                    }}
                  >
                    <Sparkles size={24} className="progress-indeterminate" />
                  </div>

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
                      padding: '3px 10px',
                      borderRadius: 12,
                      border: '1px solid var(--border-subtle)',
                      marginBottom: 10,
                    }}
                  >
                    Phase {hookGenStep + 1} of {HOOK_STAGES.length} · {HOOK_STAGES[hookGenStep].phase}
                  </div>

                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                    {HOOK_STAGES[hookGenStep].title}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {HOOK_STAGES[hookGenStep].detail}
                  </p>
                </div>

                {/* Multi-step progress bar */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${HOOK_STAGES.length}, 1fr)`, gap: 6, marginBottom: 8 }}>
                    {HOOK_STAGES.map((st, i) => {
                      const isDone = i < hookGenStep;
                      const isCurrent = i === hookGenStep;
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
                  }}
                >
                  {HOOK_STAGES.map((st, i) => {
                    const isDone = i < hookGenStep;
                    const isCurrent = i === hookGenStep;
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

                {/* Engaging Hook Insight Ticker */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px dashed var(--border-default)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <Sparkle size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                      Product Spine Rule
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {HOOK_TIPS[hookTipIndex]}
                    </div>
                  </div>
                </div>
              </div>
            ) : isGenerating ? (
              <div
                style={{
                  maxWidth: 600,
                  margin: '48px auto',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '36px 32px',
                  borderRadius: 14,
                  border: '1px solid var(--border-default)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                }}
              >
                {/* Header with active icon and phase badge */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      padding: 14,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)',
                      marginBottom: 14,
                      position: 'relative',
                    }}
                  >
                    <Sparkles size={24} className="progress-indeterminate" />
                  </div>

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
                      padding: '3px 10px',
                      borderRadius: 12,
                      border: '1px solid var(--border-subtle)',
                      marginBottom: 10,
                    }}
                  >
                    Phase {scriptGenStep + 1} of {SCRIPT_STAGES.length} · {SCRIPT_STAGES[scriptGenStep].phase}
                  </div>

                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                    {SCRIPT_STAGES[scriptGenStep].title}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {SCRIPT_STAGES[scriptGenStep].detail}
                  </p>
                </div>

                {/* Multi-step progress bar */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SCRIPT_STAGES.length}, 1fr)`, gap: 6, marginBottom: 8 }}>
                    {SCRIPT_STAGES.map((st, i) => {
                      const isDone = i < scriptGenStep;
                      const isCurrent = i === scriptGenStep;
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
                  }}
                >
                  {SCRIPT_STAGES.map((st, i) => {
                    const isDone = i < scriptGenStep;
                    const isCurrent = i === scriptGenStep;
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
                          {isDone ? 'Complete' : isCurrent ? 'Generating…' : 'Queued'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Engaging Filmmaking & Creative Insight Ticker */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px dashed var(--border-default)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <Sparkle size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                      Creative Insight
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {SCRIPT_TIPS[scriptTipIndex]}
                    </div>
                  </div>
                </div>
              </div>
            ) : brandFlowState === 'setup' ? (
              /* ========================================================
                 FIRST-TIME EXPERIENCE: SET UP YOUR BRAND
                 ======================================================== */
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
                      padding: 10,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)',
                      marginBottom: 12,
                    }}
                  >
                    <Building2 size={22} />
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div>
                    <label
                      htmlFor="setupBrandName"
                      style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}
                    >
                      Brand Name <span style={{ color: 'var(--error)' }}>*</span>
                    </label>
                    <input
                      id="setupBrandName"
                      type="text"
                      autoFocus
                      value={brandName}
                      onChange={(e) => {
                        setBrandName(e.target.value);
                        setValidationError('');
                      }}
                      placeholder="e.g. Kanti Sweets"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: 14,
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: validationError && !brandName.trim() ? 'var(--error)' : 'var(--border-default)',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="setupWebsite"
                      style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}
                    >
                      Website
                    </label>
                    <input
                      id="setupWebsite"
                      type="text"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="e.g. kantisweets.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: 14,
                        backgroundColor: 'var(--bg-elevated)',
                      }}
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--text-tertiary)',
                        marginBottom: 10,
                      }}
                    >
                      Brand Assets
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <UploadTile
                          id="setupBrandDoc"
                          label="Brand Guidelines"
                          hint="PDF or DOCX document"
                          accept=".pdf,.doc,.docx"
                          file={brandFile}
                          onChange={setBrandFile}
                          icon={FileText}
                        />
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, paddingLeft: 4 }}>
                          Optional. Upload your brand guidelines so the AI can follow your visual identity.
                        </div>
                      </div>

                      <div>
                        <UploadTile
                          id="setupShopPhoto"
                          label="Business Photos"
                          hint="Storefront, signboard, or interior"
                          accept="image/*"
                          capture="environment"
                          file={shopPhoto}
                          onChange={setShopPhoto}
                          icon={ImageIcon}
                        />
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, paddingLeft: 4 }}>
                          Optional. Help the AI understand your store, workspace or physical environment.
                        </div>
                      </div>
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
                        if (!brandName.trim()) {
                          setValidationError('Please enter your brand or business name.');
                          return;
                        }
                        saveBrandToStorage(brandName, websiteUrl);
                        setValidationError('');
                        setBrandFlowState('confirmation');
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
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        fontSize: 13,
                        cursor: 'pointer',
                        padding: '6px',
                        textAlign: 'center',
                      }}
                    >
                      {brandName.trim() ? 'Cancel & back to video' : 'Skip for now'}
                    </button>
                  </div>
                </div>
              </div>
            ) : brandFlowState === 'confirmation' ? (
              /* ========================================================
                 TRANSITION: BRAND READY CONFIRMATION
                 ======================================================== */
              <div
                style={{
                  maxWidth: 500,
                  margin: '48px auto',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 12,
                  padding: '36px 32px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    padding: 12,
                    borderRadius: '50%',
                    backgroundColor: 'var(--success-subtle)',
                    color: 'var(--success)',
                    marginBottom: 16,
                  }}
                >
                  <Check size={24} strokeWidth={2.5} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--success)', marginBottom: 4 }}>
                  Brand Ready
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                  {brandName || 'Your Brand'}
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: 1.5 }}>
                  Brand profile saved for this session. You can now create your video.
                </p>

                {/* Status List */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    textAlign: 'left',
                    marginBottom: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Website</span>
                    <span style={{ color: websiteUrl ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: websiteUrl ? 600 : 400 }}>
                      {websiteUrl ? `Connected (${websiteUrl})` : 'Not added'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Brand guidelines</span>
                    <span style={{ color: brandFile ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: brandFile ? 600 : 400 }}>
                      {brandFile ? `Added (${brandFile.name})` : 'Not added'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Business photos</span>
                    <span style={{ color: shopPhoto ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: shopPhoto ? 600 : 400 }}>
                      {shopPhoto ? `Added (${shopPhoto.name})` : 'Not added'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setBrandFlowState('setup')}
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
                    onClick={() => setBrandFlowState('create')}
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
                    }}
                  >
                    <span>Create Video</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ) : hooks && hooks.length === 0 ? (
              /* ========================================================
                 STREAMLINED CREATE VIDEO WORKSPACE (TAB-BASED SELECTIONS)
                 ======================================================== */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {/* 1. BRAND CONTEXT BANNER */}
                {!brandName.trim() ? (
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
                          width: 34,
                          height: 34,
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
                          Brand setup skipped (Generic Creative)
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          Want your business name spoken in dialogue and styled with your storefront colors?
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBrandFlowState('setup')}
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
                        flexShrink: 0,
                        boxShadow: '0 1px 4px var(--accent-glow)',
                      }}
                    >
                      <Building2 size={13} />
                      <span>Set Up Brand Now</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 10,
                      padding: '12px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                        Creating for
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 12px' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {brandName}
                        </span>
                        {websiteUrl && (
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            · {websiteUrl}
                          </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
                          <span>
                            Guidelines: {brandFile ? <strong style={{ color: 'var(--success)' }}>✓ Added</strong> : 'Not added'}
                          </span>
                          <span>·</span>
                          <span>
                            Photos: {shopPhoto ? <strong style={{ color: 'var(--success)' }}>✓ Added</strong> : 'Not added'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => setIsBrandModalOpen(true)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        Manage Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Switch brand profile? You can enter a new brand name, website, and assets.')) {
                            handleResetBrandProfile();
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-tertiary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Plus size={13} />
                        <span>Add New Brand</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. THE SCRIPT IDEA (DOMINANT BRIEF) */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 10,
                    padding: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label htmlFor="briefInput" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                      What is your video idea? <span style={{ color: 'var(--error)' }}>*</span>
                    </label>

                    {micSupported && (
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        className={isListening ? 'mic-recording' : ''}
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
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                        <span>{isListening ? 'Stop' : 'Dictate'}</span>
                      </button>
                    )}
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 12px' }}>
                    Describe your product, discount offer, or celebration in 1–2 sentences.
                  </p>

                  {micHint && (
                    <div
                      style={{
                        fontSize: 12,
                        color: isListening ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                        padding: '6px 10px',
                        backgroundColor: 'var(--bg-elevated)',
                        borderRadius: 6,
                        marginBottom: 10,
                      }}
                    >
                      {micHint}
                    </div>
                  )}

                  <textarea
                    id="briefInput"
                    rows={4}
                    value={brief}
                    onChange={(e) => {
                      setBrief(e.target.value);
                      setValidationError('');
                    }}
                    placeholder="e.g. Need a festive Diwali video for our sweets gift box, announcing 50% discount and fresh assorted sweets..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: validationError && !brief.trim() ? '1px solid var(--error)' : '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      resize: 'vertical',
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {brief.length} characters
                  </div>
                </div>

                {/* 3. SCRIPT OPTIONS AS ONE-CLICK TABS */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 10,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                  }}
                >
                  {/* Row: Language and Duration side-by-side tabs */}
                  <div className="responsive-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Language Tab */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Spoken Language
                      </div>
                      <div className="tab-group">
                        <button
                          type="button"
                          onClick={() => setLanguage('English')}
                          className={`tab-pill ${language === 'English' ? 'active-accent' : ''}`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage('Hindi')}
                          className={`tab-pill ${language === 'Hindi' ? 'active-accent' : ''}`}
                        >
                          Hindi (Romanized)
                        </button>
                      </div>
                    </div>

                    {/* Duration Tab */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Duration & Scenes
                      </div>
                      <div className="tab-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        <button
                          type="button"
                          onClick={() => setDuration('10s')}
                          className={`tab-pill ${duration === '10s' ? 'active-accent' : ''}`}
                          style={{ padding: '8px 4px', fontSize: 12 }}
                        >
                          <span>10 sec</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuration('15s')}
                          className={`tab-pill ${duration === '15s' ? 'active-accent' : ''}`}
                          style={{ padding: '8px 4px', fontSize: 12 }}
                        >
                          <span>15 sec</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuration('20s')}
                          className={`tab-pill ${duration === '20s' ? 'active-accent' : ''}`}
                          style={{ padding: '8px 4px', fontSize: 12 }}
                        >
                          <span>20 sec</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuration('25s')}
                          className={`tab-pill ${duration === '25s' ? 'active-accent' : ''}`}
                          style={{ padding: '8px 4px', fontSize: 12 }}
                        >
                          <span>25 sec</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ad Angle / Purpose Tabs */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        Ad Focus & Call-To-Action
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        Shapes story arc & final voiceover line
                      </span>
                    </div>

                    <div className="responsive-cols-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {AD_GOAL_PRESETS.map((preset) => {
                        const Icon = preset.icon;
                        const isSelected = selectedGoalId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSelectedGoalId(preset.id)}
                            style={{
                              padding: '12px 10px',
                              borderRadius: 8,
                              border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                              backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              textAlign: 'center',
                              gap: 6,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div
                              style={{
                                color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Icon size={16} />
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                              }}
                            >
                              {preset.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Product Photo Upload */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      Product Photo <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)', textTransform: 'none' }}>(Optional)</span>
                    </div>
                    <UploadTile
                      id="streamlinedProductUpload"
                      label="Product Photo"
                      hint="Upload product to feature in video scenes"
                      accept="image/*"
                      file={productImage}
                      onChange={setProductImage}
                      icon={ImageIcon}
                    />
                  </div>
                </div>

                {/* 4. VALIDATION & GENERATE CTA */}
                <div>
                  {validationError && (
                    <div
                      role="alert"
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--error-subtle)',
                        border: '1px solid var(--error)',
                        borderRadius: 8,
                        color: 'var(--error)',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <AlertCircle size={15} />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div
                      role="alert"
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--error-subtle)',
                        border: '1px solid var(--error)',
                        borderRadius: 8,
                        color: 'var(--error)',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <AlertCircle size={15} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateHooks}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 2px 8px var(--accent-glow)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <span>Generate Creative Hooks</span>
                    <Sparkles size={16} />
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================
                 STAGE 1.5: CHOOSE CREATIVE HOOK (PRODUCT SPINE SECTION 4)
                 ======================================================== */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Header with back action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--accent-primary)',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        Step 2 · Creative Hook
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
                        <Check size={11} strokeWidth={2.5} />
                        3 Hooks Ready
                      </span>
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Choose Your Story Opening
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                      The first 3 seconds determine viewer retention. Select the angle that fits your campaign best.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setHooks([])}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
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
                    <ArrowLeft size={13} />
                    <span>Edit Brief</span>
                  </button>
                </div>

                {/* 3 Hook Cards Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {hooks.map((h, idx) => {
                    const isSelected = selectedHook?.id === h.id;
                    return (
                      <div
                        key={h.id || idx}
                        onClick={() => {
                          setSelectedHook(h);
                          setCustomHookLine(h.hookLine);
                          setIsEditingHookLine(false);
                        }}
                        style={{
                          padding: '18px 20px',
                          borderRadius: 10,
                          backgroundColor: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-default)',
                          boxShadow: isSelected ? '0 4px 16px var(--accent-glow)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        {/* Top row: Archetype and Selection radio */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontWeight: 700,
                                backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                              }}
                            >
                              0{idx + 1}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {h.archetype}
                            </span>
                            {h.angle && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: 'var(--text-tertiary)',
                                  backgroundColor: 'var(--bg-elevated)',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                }}
                              >
                                {h.angle}
                              </span>
                            )}
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

                        {/* Spoken Hook Line */}
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: 6,
                            backgroundColor: 'var(--bg-elevated)',
                            borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                            Spoken Opening Line ({language})
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            "{isSelected && customHookLine ? customHookLine : h.hookLine}"
                          </div>
                        </div>

                        {/* Physical Visual Action */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          <Camera size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <strong style={{ color: 'var(--text-primary)' }}>Opening Action: </strong>
                            {h.visualAction}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Edit selected hook option */}
                {selectedHook && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      padding: '12px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Customize Selected Hook Line (Optional)
                      </span>
                      {!isEditingHookLine ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingHookLine(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-primary)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Edit2 size={12} />
                          <span>Edit Line</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingHookLine(false)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--success)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Done
                        </button>
                      )}
                    </div>

                    {isEditingHookLine ? (
                      <textarea
                        rows={2}
                        value={customHookLine}
                        onChange={(e) => setCustomHookLine(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          fontSize: 13,
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--accent-primary)',
                          borderRadius: 6,
                          color: 'var(--text-primary)',
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        Click "Edit Line" if you want to tweak the exact words spoken in the opening scene.
                      </div>
                    )}
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div
                    role="alert"
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--error-subtle)',
                      border: '1px solid var(--error)',
                      borderRadius: 8,
                      color: 'var(--error)',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <AlertCircle size={15} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Confirm & Continue to Storyboard CTA */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => handleGenerateHooks()}
                    style={{
                      flex: 1,
                      padding: '13px 18px',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Regenerate Hooks</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateScriptWithHook(selectedHook)}
                    style={{
                      flex: 2,
                      padding: '14px 24px',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 2px 8px var(--accent-glow)',
                    }}
                  >
                    <span>Build Storyboard Script</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            STAGE 2: CREATIVE REVIEW (EDITORIAL AI STORYBOARD WORKSPACE)
           ======================================================== */}
        {currentStage === 2 && (
          <div>
            {/* STAGE HEADER WITH CONTEXT PILLS */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--accent-primary)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    02 · Storyboard Studio
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '2px 8px',
                      borderRadius: 999,
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      color: 'var(--success)',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <Check size={11} strokeWidth={2.5} />
                    Creative Ready for Review
                  </span>
                </div>

                {/* Orientation metadata tags */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {brandName && (
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 5,
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {brandName}
                    </span>
                  )}
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 5,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {duration} ({scenes.length} Scenes)
                  </span>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 5,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {language}
                  </span>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 5,
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {AD_GOAL_PRESETS.find((g) => g.id === selectedGoalId)?.title || 'Offer Promo'}
                  </span>
                  {selectedHook && (
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 5,
                        backgroundColor: 'var(--accent-subtle)',
                        border: '1px solid var(--accent-primary)',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--accent-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Sparkles size={11} />
                      Hook: {selectedHook.archetype}
                    </span>
                  )}
                </div>
              </div>

              <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Review AI Storyboard
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Review characters, environment world-building, and scene-by-scene direction. Click <strong style={{ color: 'var(--text-primary)' }}>Edit</strong> on any section to customize before rendering.
              </p>
            </div>

            {/* ========================================================
                SECTION 01: CREATIVE FOUNDATION (CHARACTERS & SETTING)
               ======================================================== */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 12,
                marginBottom: 28,
                overflow: 'hidden',
              }}
            >
              {/* Foundation Accordion Header */}
              <button
                type="button"
                onClick={() => setIsFoundationCollapsed(!isFoundationCollapsed)}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderBottom: isFoundationCollapsed ? 'none' : '1px solid var(--border-subtle)',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--accent-primary)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    01 · Creative Foundation
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {isFoundationCollapsed ? '— Cast & Environment (Click to expand)' : '— Visual continuity anchors for all scenes'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)', fontSize: 12, fontWeight: 500 }}>
                  <span>{isFoundationCollapsed ? 'Expand' : 'Collapse'}</span>
                  {isFoundationCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                </div>
              </button>

              {!isFoundationCollapsed && (
                <div style={{ padding: 20 }}>
                  <div className="responsive-cols-2" style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 20 }}>
                    {/* CHARACTERS CARD */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 10,
                        padding: 18,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                backgroundColor: 'var(--accent-subtle)',
                                color: 'var(--accent-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <User size={14} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>
                              Cast & Characters
                            </span>
                          </div>

                          {!isEditingCharacters ? (
                            <button
                              type="button"
                              onClick={handleStartEditCharacters}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 6,
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-secondary)',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Edit2 size={11} />
                              <span>Edit</span>
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={handleCancelCharacters}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 5,
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--border-default)',
                                  color: 'var(--text-tertiary)',
                                  fontSize: 11,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveCharacters}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 5,
                                  backgroundColor: 'var(--accent-primary)',
                                  border: 'none',
                                  color: '#ffffff',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Review Mode vs Edit Mode */}
                        {!isEditingCharacters ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                                Lead Character
                              </div>
                              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: character1 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                {character1 || 'No lead character specified.'}
                              </p>
                            </div>

                            {character2 && (
                              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                                  Supporting Cast
                                </div>
                                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-primary)' }}>
                                  {character2}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                              <label htmlFor="char1Input" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                Lead Character Description
                              </label>
                              <textarea
                                id="char1Input"
                                rows={3}
                                value={char1Draft}
                                onChange={(e) => setChar1Draft(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  fontSize: 12,
                                  lineHeight: 1.5,
                                  backgroundColor: 'var(--bg-surface)',
                                  border: '1px solid var(--border-focus)',
                                  borderRadius: 6,
                                  color: 'var(--text-primary)',
                                }}
                              />
                            </div>
                            <div>
                              <label htmlFor="char2Input" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                Supporting Cast (Optional)
                              </label>
                              <textarea
                                id="char2Input"
                                rows={2}
                                value={char2Draft}
                                onChange={(e) => setChar2Draft(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  fontSize: 12,
                                  lineHeight: 1.5,
                                  backgroundColor: 'var(--bg-surface)',
                                  border: '1px solid var(--border-default)',
                                  borderRadius: 6,
                                  color: 'var(--text-primary)',
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SETTING & WORLD CARD */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 10,
                        padding: 18,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 6,
                                backgroundColor: 'var(--accent-subtle)',
                                color: 'var(--accent-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <MapPin size={14} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>
                              Setting & World
                            </span>
                          </div>

                          {!isEditingSetting ? (
                            <button
                              type="button"
                              onClick={handleStartEditSetting}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 6,
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-secondary)',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Edit2 size={11} />
                              <span>Edit</span>
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={handleCancelSetting}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 5,
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--border-default)',
                                  color: 'var(--text-tertiary)',
                                  fontSize: 11,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveSetting}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 5,
                                  backgroundColor: 'var(--accent-primary)',
                                  border: 'none',
                                  color: '#ffffff',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </div>

                        {!isEditingSetting ? (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                              Environment & Lighting
                            </div>
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: setting ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                              {setting || 'No environment specified.'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <label htmlFor="settingInput" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                              Environment Description
                            </label>
                            <textarea
                              id="settingInput"
                              rows={5}
                              value={settingDraft}
                              onChange={(e) => setSettingDraft(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                fontSize: 12,
                                lineHeight: 1.5,
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-focus)',
                                borderRadius: 6,
                                color: 'var(--text-primary)',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================
                SECTION 02: STORYBOARD WORKSPACE (SCENE NAV + EDITOR)
               ======================================================== */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--accent-primary)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    02 · Storyboard Scenes
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    ({scenes.length} Scenes · Select a scene to inspect)
                  </span>
                </div>

                {/* Raw Script View Toggle */}
                <button
                  type="button"
                  onClick={() => setIsRawScriptMode(!isRawScriptMode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'none',
                    border: '1px solid var(--border-default)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: isRawScriptMode ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {isRawScriptMode ? <Edit3 size={12} /> : <FileCode2 size={12} />}
                  <span>{isRawScriptMode ? 'Back to Storyboard' : 'Raw Script View'}</span>
                </button>
              </div>

              {/* TWO-COLUMN STORYBOARD STUDIO */}
              <div
                className="storyboard-layout"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '260px minmax(0, 1fr)',
                  gap: 20,
                  alignItems: 'start',
                }}
              >
                {/* LEFT COLUMN: SCENE NAVIGATOR */}
                <div
                  className="storyboard-nav-container"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 12,
                    padding: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {scenes.map((s, idx) => {
                    const parsed = parseScene(s, idx);
                    const isActive = activeSceneIndex === idx;
                    const previewText = parsed.dialogue || parsed.visual || '';
                    const cleanSnippet = previewText.replace(/^["'\s]+|["'\s]+$/g, '').slice(0, 52);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (editingSection) {
                            handleCancelEditSection();
                          }
                          setActiveSceneIndex(idx);
                        }}
                        className={`scene-nav-item ${isActive ? 'active' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                              color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                            }}
                          >
                            SCENE {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 4,
                              backgroundColor: isActive ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                              color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {parsed.purpose || (idx === 0 ? 'HOOK' : idx === 1 ? 'PROBLEM' : idx === 2 ? 'SOLUTION' : 'CTA')}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: isActive ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textAlign: 'left',
                            width: '100%',
                            marginTop: 2,
                          }}
                        >
                          {cleanSnippet ? `"${cleanSnippet}…"` : parsed.title}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* RIGHT COLUMN: SELECTED SCENE WORKSPACE */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 12,
                    padding: 24,
                  }}
                >
                  {/* Scene Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 22,
                      borderBottom: '1px solid var(--border-subtle)',
                      paddingBottom: 14,
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: 'var(--accent-primary)',
                          }}
                        >
                          SCENE {String(activeSceneIndex + 1).padStart(2, '0')}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                            backgroundColor: 'var(--accent-subtle)',
                            color: 'var(--accent-primary)',
                          }}
                        >
                          {currentParsedScene.purpose || `Scene ${activeSceneIndex + 1}`}
                        </span>
                      </div>
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '6px 0 0', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                        {currentParsedScene.title}
                      </h2>
                    </div>

                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {activeSceneIndex + 1} of {scenes.length} Scenes
                    </span>
                  </div>

                  {isRawScriptMode ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Direct Scene Script (ANNEX A Format)
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          Direct changes update the production payload immediately
                        </span>
                      </div>
                      <textarea
                        rows={16}
                        value={scenes[activeSceneIndex] || ''}
                        onChange={(e) => {
                          const updated = [...scenes];
                          updated[activeSceneIndex] = e.target.value;
                          setScenes(updated);
                        }}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          fontSize: 13,
                          lineHeight: 1.6,
                          fontFamily: "'JetBrains Mono', monospace",
                          backgroundColor: 'var(--bg-active)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 8,
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {/* 1. VISUAL DIRECTION (Hero Block) */}
                      <div
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 10,
                          padding: 18,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-primary)' }}>
                            Visual Direction
                          </span>

                          {editingSection !== 'visual' ? (
                            <button
                              type="button"
                              onClick={() => handleStartEditSection('visual', currentParsedScene.visual)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 5,
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-secondary)',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Edit2 size={11} />
                              <span>Edit</span>
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={handleCancelEditSection}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--border-default)',
                                  color: 'var(--text-tertiary)',
                                  fontSize: 11,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveEditSection}
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: 4,
                                  backgroundColor: 'var(--accent-primary)',
                                  border: 'none',
                                  color: '#ffffff',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </div>

                        {editingSection !== 'visual' ? (
                          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-primary)' }}>
                            {currentParsedScene.visual || 'No visual description available.'}
                          </p>
                        ) : (
                          <textarea
                            rows={4}
                            value={sectionDraft}
                            onChange={(e) => setSectionDraft(e.target.value)}
                            placeholder="Describe everything visible in the scene…"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: 13,
                              lineHeight: 1.55,
                              backgroundColor: 'var(--bg-surface)',
                              border: '1px solid var(--border-focus)',
                              borderRadius: 6,
                              color: 'var(--text-primary)',
                            }}
                          />
                        )}
                      </div>

                      {/* 2. SPOKEN DIALOGUE (Quotation block) */}
                      <div
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 10,
                          padding: 18,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-primary)' }}>
                              Spoken Dialogue
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 4,
                                backgroundColor: 'var(--accent-subtle)',
                                color: 'var(--accent-primary)',
                              }}
                            >
                              {language}
                            </span>
                          </div>

                          {editingSection !== 'dialogue' ? (
                            <button
                              type="button"
                              onClick={() => handleStartEditSection('dialogue', currentParsedScene.dialogue)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 5,
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-secondary)',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Edit2 size={11} />
                              <span>Edit</span>
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={handleCancelEditSection}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--border-default)',
                                  color: 'var(--text-tertiary)',
                                  fontSize: 11,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveEditSection}
                                style={{
                                  padding: '3px 10px',
                                  borderRadius: 4,
                                  backgroundColor: 'var(--accent-primary)',
                                  border: 'none',
                                  color: '#ffffff',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </div>

                        {editingSection !== 'dialogue' ? (
                          <div className="quote-block">
                            {currentParsedScene.dialogue ? (
                              `"${currentParsedScene.dialogue.replace(/^["']|["']$/g, '')}"`
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No spoken dialogue in this scene.</span>
                            )}
                          </div>
                        ) : (
                          <textarea
                            rows={3}
                            value={sectionDraft}
                            onChange={(e) => setSectionDraft(e.target.value)}
                            placeholder='Dialogue line in target language (romanized)'
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: 13,
                              lineHeight: 1.55,
                              backgroundColor: 'var(--bg-surface)',
                              border: '1px solid var(--border-focus)',
                              borderRadius: 6,
                              color: 'var(--text-primary)',
                            }}
                          />
                        )}
                      </div>

                      {/* 3 & 4. CAMERA & SOUND DESIGN (Production Details) */}
                      <div className="responsive-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {/* CAMERA & ANIMATION */}
                        <div
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 10,
                            padding: 16,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Camera size={13} style={{ color: 'var(--text-tertiary)' }} />
                              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                                Camera & Movement
                              </span>
                            </div>

                            {editingSection !== 'camera' ? (
                              <button
                                type="button"
                                onClick={() => handleStartEditSection('camera', currentParsedScene.camera)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--border-default)',
                                  color: 'var(--text-tertiary)',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Edit2 size={10} />
                                <span>Edit</span>
                              </button>
                            ) : (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  type="button"
                                  onClick={handleCancelEditSection}
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    backgroundColor: 'transparent',
                                    border: '1px solid var(--border-default)',
                                    color: 'var(--text-tertiary)',
                                    fontSize: 10,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveEditSection}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    backgroundColor: 'var(--accent-primary)',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: 10,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </div>

                          {editingSection !== 'camera' ? (
                            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: currentParsedScene.camera ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                              {currentParsedScene.camera || 'Standard framing.'}
                            </p>
                          ) : (
                            <textarea
                              rows={3}
                              value={sectionDraft}
                              onChange={(e) => setSectionDraft(e.target.value)}
                              placeholder="Camera movement / animation…"
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                fontSize: 12,
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-focus)',
                                borderRadius: 6,
                                color: 'var(--text-primary)',
                              }}
                            />
                          )}
                        </div>

                        {/* SOUND DESIGN & SFX */}
                        <div
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 10,
                            padding: 16,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Volume2 size={13} style={{ color: 'var(--text-tertiary)' }} />
                              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                                Sound Design & SFX
                              </span>
                            </div>

                            {editingSection !== 'audio' ? (
                              <button
                                type="button"
                                onClick={() => handleStartEditSection('audio', currentParsedScene.audio)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--border-default)',
                                  color: 'var(--text-tertiary)',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Edit2 size={10} />
                                <span>Edit</span>
                              </button>
                            ) : (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  type="button"
                                  onClick={handleCancelEditSection}
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    backgroundColor: 'transparent',
                                    border: '1px solid var(--border-default)',
                                    color: 'var(--text-tertiary)',
                                    fontSize: 10,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveEditSection}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    backgroundColor: 'var(--accent-primary)',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: 10,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </div>

                          {editingSection !== 'audio' ? (
                            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: currentParsedScene.audio ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                              {currentParsedScene.audio || 'Ambient audio & background music.'}
                            </p>
                          ) : (
                            <textarea
                              rows={3}
                              value={sectionDraft}
                              onChange={(e) => setSectionDraft(e.target.value)}
                              placeholder="Ambience / SFX / music…"
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                fontSize: 12,
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-focus)',
                                borderRadius: 6,
                                color: 'var(--text-primary)',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================
                SECTION 03: STICKY BOTTOM ACTION BAR
               ======================================================== */}
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(16, 18, 23, 0.95)',
                backdropFilter: 'blur(12px)',
                borderTop: '1px solid var(--border-subtle)',
                padding: '12px 24px',
                zIndex: 40,
              }}
            >
              <div
                style={{
                  maxWidth: 1240,
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => setCurrentStage(1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'none',
                    border: '1px solid var(--border-default)',
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>← Back to Brief</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>READY TO RENDER</span>
                    <span>·</span>
                    <span>{duration}</span>
                    <span>·</span>
                    <span>{language}</span>
                    <span>·</span>
                    <span>{scenes.length} Scenes</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRenderVideo}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      backgroundColor: 'var(--accent-primary)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '11px 24px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px var(--accent-glow)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <span>Render Video</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 3: RENDER & WATCH
           ======================================================== */}
        {currentStage === 3 && (
          <div style={{ maxWidth: 760, margin: '20px auto 0' }}>
            {/* In Progress */}
            {isRendering && (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 14,
                  border: '1px solid var(--border-default)',
                  padding: '36px 32px',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                }}
              >
                {/* Header with active icon and phase badge */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      padding: 14,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)',
                      marginBottom: 14,
                    }}
                  >
                    <Film size={26} className="progress-indeterminate" />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
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
                        padding: '3px 10px',
                        borderRadius: 12,
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      Stage {renderStep + 1} of {RENDER_STAGES.length} · {RENDER_STAGES[renderStep].phase}
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 10px',
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <Clock size={12} color="var(--accent-primary)" />
                      <span>{elapsedTime}</span>
                    </div>
                  </div>

                  <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    {RENDER_STAGES[renderStep].title}
                  </h1>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {RENDER_STAGES[renderStep].detail}
                  </p>
                </div>

                {/* Multi-step progress bar */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${RENDER_STAGES.length}, 1fr)`, gap: 6, marginBottom: 8 }}>
                    {RENDER_STAGES.map((st, i) => {
                      const isDone = i < renderStep;
                      const isCurrent = i === renderStep;
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

                {/* Live Render Engine Pipeline Checklist */}
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
                  }}
                >
                  {RENDER_STAGES.map((st, i) => {
                    const isDone = i < renderStep;
                    const isCurrent = i === renderStep;
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
                          {isDone ? 'Complete' : isCurrent ? 'Rendering…' : 'Queued'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Engaging Video Production & Creative Insight Ticker */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px dashed var(--border-default)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <Sparkle size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 2 }}>
                      Production Insight
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {RENDER_TIPS[renderTipIndex]}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {errorMessage && !isRendering && (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 12,
                  border: '1px solid var(--border-default)',
                  padding: 36,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: 'var(--error-subtle)',
                    color: 'var(--error)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                  }}
                >
                  <AlertCircle size={22} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                  Rendering failed
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 24px' }}>
                  {errorMessage}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStage(2)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Back to Creative
                  </button>
                  <button
                    type="button"
                    onClick={handleRenderVideo}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Try Rendering Again
                  </button>
                </div>
              </div>
            )}

            {/* Video Complete / Ready */}
            {videoUrl && !isRendering && (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 12,
                  border: '1px solid var(--border-default)',
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Your video is ready
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                      Review your final video, share the preview link, or download the master file.
                    </p>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 16,
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      color: 'var(--success)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <Check size={13} strokeWidth={2.5} />
                    <span>Render Complete · 1080p</span>
                  </span>
                </div>

                {/* Video Player Frame */}
                <div
                  style={{
                    borderRadius: 10,
                    overflow: 'hidden',
                    backgroundColor: '#000000',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: 20,
                  }}
                >
                  <video
                    src={videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    style={{
                      width: '100%',
                      maxHeight: 480,
                      display: 'block',
                    }}
                  />
                </div>

                {/* Primary Action Bar: Share & Download */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: 16,
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoUrl('');
                        setCurrentStage(1);
                        setBrief('');
                        setScenes([]);
                        setCharacter1('');
                        setCharacter2('');
                        setSetting('');
                        setProductImage(null);
                        setErrorMessage('');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'transparent',
                        border: '1px solid var(--border-default)',
                        padding: '9px 15px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Plus size={14} />
                      <span>Create New Video</span>
                    </button>

                    {shareStatus && (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--success)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Check size={14} strokeWidth={2.5} />
                        <span>{shareStatus}</span>
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Share CTA */}
                    <button
                      type="button"
                      onClick={handleShareVideo}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '10px 18px',
                        borderRadius: 8,
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Share2 size={14} />
                      <span>Share</span>
                    </button>

                    {/* Download CTA */}
                    <button
                      type="button"
                      onClick={() =>
                        window.open(`/api/download?url=${encodeURIComponent(videoUrl)}`, '_blank')
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        backgroundColor: 'var(--accent-primary)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px var(--accent-glow)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
