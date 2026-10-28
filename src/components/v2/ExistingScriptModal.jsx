import React, { useState } from 'react';
import { ScriptVerificationLoader } from './WorkflowLoadingScreen.jsx';
import {
  X,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Film,
  Check,
  Lock,
  Camera,
  MessageSquare,
  Layers,
  ChevronRight,
  Package,
  Upload,
  Trash2,
} from 'lucide-react';

const SAMPLE_SCRIPTS = [
  {
    name: 'Kirana UGC (Hindi)',
    lang: 'Hindi',
    style: 'UGC / Creator-style',
    text: `ANNEX A
SCENE 1 – HOOK
Visual:
Medium shot of Sunita in her kitchen, looking stressed into an empty tea canister. Natural late-morning kitchen sunlight.
Animation Elements:
Camera: smooth slow push-in.
Text overlay: none
UI element: none
Transition: cut
Motion graphics: none
Audio / Dialogue / Voiceover:
Sunita: "अरे, सुबह की चाय की पत्ती खत्म! अब 10 मिनट में मेहमान आने वाले हैं!"
Sound Design:
Kitchen utensil clatter, ambient room tone.
Editing Notes:
Scene duration: ~4s | Output: 1080p

ANNEX A
SCENE 2 – BUILD
Visual:
Same setting. Sunita opens her phone, smiling as she quickly taps the Palasia Kirana WhatsApp delivery button.
Animation Elements:
Camera: static balanced medium shot.
Text overlay: none
UI element: none
Transition: cut
Motion graphics: none
Audio / Dialogue / Voiceover:
Sunita: "शुक्र है पलासिया किराना सिर्फ 15 मिनट में ताज़ा सामान घर पहुंचा देता है।"
Sound Design:
Soft phone notification chime, ambient room tone.
Editing Notes:
Scene duration: ~4s | Output: 1080p

ANNEX A
SCENE 3 – TURN
Visual:
Ramesh, the smiling kirana store owner, hands over a fresh brown paper package at the doorway with a warm greeting.
Animation Elements:
Camera: slight motivated pan following delivery handoff.
Text overlay: none
UI element: none
Transition: cut
Motion graphics: none
Audio / Dialogue / Voiceover:
Ramesh: "नमस्ते भाभीजी! शुद्ध चायपत्ती और ताज़ा नाश्ता, एकदम सही वक़्त पर।"
Sound Design:
Doorway rustle, warm neighborhood outdoor ambience.
Editing Notes:
Scene duration: ~4s | Output: 1080p

ANNEX A
SCENE 4 – RESOLUTION
Visual:
Sunita pours steaming fragrant hot tea into glass cups, completely relaxed and relieved.
Animation Elements:
Camera: slow gentle pull-out to hold.
Text overlay: none
UI element: none
Transition: cut
Motion graphics: none
Audio / Dialogue / Voiceover:
Sunita: "पलासिया किराना — आपके घर की ज़रूरत, सिर्फ एक कॉल दूर।"
Sound Design:
Liquid pouring sound, satisfied room ambience.
Editing Notes:
Scene duration: ~4s | Output: 1080p`,
  },
  {
    name: 'Chai Point Quick Rush (English)',
    lang: 'English',
    style: 'UGC / Creator-style',
    text: `ANNEX A
SCENE 1 – HOOK
Visual:
Arjun sitting at his work desk looking exhausted before a morning standup meeting. Room has clean modern morning lighting.
Animation Elements:
Camera: smooth direct push-in.
Text overlay: none
UI element: none
Transition: cut
Motion graphics: none
Audio / Dialogue / Voiceover:
Arjun: "9 AM client review, and zero caffeine in my system. Today is going to hurt."
Sound Design:
Keyboard clicks, quiet modern office background hum.
Editing Notes:
Scene duration: ~4s | Output: 1080p

ANNEX A
SCENE 2 – BUILD
Visual:
Same setting. Colleague Priya walks in with a steaming insulated Chai Point flask and fresh snacks.
Animation Elements:
Camera: steady medium two-shot.
Text overlay: none
UI element: none
Transition: cut
Motion graphics: none
Audio / Dialogue / Voiceover:
Priya: "Stop stressing! Fresh ginger chai and hot samosas just arrived from Chai Point."
Sound Design:
Paper bag rustle, hot beverage pour.
Editing Notes:
Scene duration: ~4s | Output: 1080p

ANNEX A
SCENE 3 – TURN
Visual:
Arjun takes his first hot sip, instant relief and energy visible on his face.
Animation Elements:
Camera: close medium shot with gentle camera motion.
Text overlay: none
UI element: none
Transition: cut
Motion graphics: none
Audio / Dialogue / Voiceover:
Arjun: "Real brewed ginger tea, not machine powder. Okay, I can handle this meeting now."
Sound Design:
Warm steam sound, cheerful morning ambience.
Editing Notes:
Scene duration: ~4s | Output: 1080p

ANNEX A
SCENE 4 – RESOLUTION
Visual:
Both colleagues raising their tea glasses in a quick toast with the Chai Point cup clearly in focus.
Animation Elements:
Camera: slow gentle pull-out to hold.
Text overlay: none
UI element: none
Transition: cut
Motion graphics: none
Audio / Dialogue / Voiceover:
Priya: "Chai Point — freshly brewed real chai, delivered in 15 minutes."
Sound Design:
Glass clink, upbeat ambient tone.
Editing Notes:
Scene duration: ~4s | Output: 1080p`,
  },
];

function parseSceneParts(rawText, idx) {
  const beats = [
    'Hook / Pattern Interrupt',
    'Problem & Relatability',
    'Discovery & Climax',
    'Call to Action & Offer',
  ];
  const beatTitles = [
    'SCENE 1 – HOOK',
    'SCENE 2 – BUILD',
    'SCENE 3 – TURN',
    'SCENE 4 – RESOLUTION',
  ];
  const timings = ['0–3s', '3–8s', '8–14s', '14–20s'];
  const beatRole = beats[idx] || `Scene ${idx + 1}`;
  const timing = timings[idx] || '~4s';

  let visual = '';
  const visMatch = rawText.match(
    /(?:^|\n)\s*(?:Visual|Action)\s*:\s*([\s\S]*?)(?=(?:^|\n)\s*(?:Animation\s+Elements|Camera|Shot|Audio|Dialogue|Voiceover|Sound|Editing|$))/i
  );
  if (visMatch) {
    visual = visMatch[1].trim();
  } else {
    visual = rawText
      .split('\n')
      .filter((l) => !/^(?:ANNEX|SCENE)/i.test(l.trim()))[0] || rawText;
  }

  // Strip leading "Same setting: " from visual text so user can edit pure action
  const cleanVisual = visual.replace(/^Same setting:\s*/i, '').trim();

  let camera = 'smooth slow push-in';
  const camMatch = rawText.match(/(?:•\s*Camera|Camera|Shot)\s*:\s*([^\n]+)/i);
  if (camMatch) {
    camera = camMatch[1].trim().replace(/\.$/, '');
  }

  let dialogue = '';
  const diaMatch = rawText.match(
    /(?:Audio\s*\/\s*Dialogue\s*\/\s*Voiceover|Audio\s*\/\s*Dialogue|Audio|Dialogue|Voiceover)\s*:\s*([\s\S]*?)(?=(?:^|\n)\s*(?:Sound|Editing|$))/i
  );
  if (diaMatch) {
    dialogue = diaMatch[1].trim();
  }

  let sound = 'Ambient room tone.';
  const sndMatch = rawText.match(
    /(?:Sound\s+Design|Sound|SFX|Music)\s*:\s*([\s\S]*?)(?=(?:^|\n)\s*(?:Editing|$))/i
  );
  if (sndMatch) {
    sound = sndMatch[1].trim();
  }

  return {
    title: `SCENE ${idx + 1}`,
    beatTitle: beatTitles[idx] || `SCENE ${idx + 1}`,
    timing,
    beatRole,
    visual: cleanVisual,
    camera,
    dialogue,
    sound,
  };
}

const VO_TERM_REGEX = /(?:^|\n)\s*(?:(?:TEXT\s*[\+&]\s*)?(?:VO|V\.O\.|V\/O|Voiceover|Voice[\s-]over|Narrator|Narration|Off[\s-]screen|Audio))\s*:\s*["']?/gi;
const DIALOGUE_SPEAKER_REGEX = /(?:^|\n)\s*(?!VO\b|Voiceover\b|Voice[\s-]over\b|Narrator\b|Visual\b|Camera\b|Action\b|Audio\b|Sound\b|Editing\b)[A-Z][A-Za-z0-9\s]{1,18}\s*:\s*["']/g;

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const TAMIL_REGEX = /[\u0B80-\u0BFF]/;
const TELUGU_REGEX = /[\u0C00-\u0C7F]/;
const KANNADA_REGEX = /[\u0C80-\u0CFF]/;
const MALAYALAM_REGEX = /[\u0D00-\u0D7F]/;

function detectScriptLanguage(scriptText, fallback = 'English') {
  if (!scriptText || typeof scriptText !== 'string') return fallback;
  if (TAMIL_REGEX.test(scriptText)) return 'Tamil';
  if (TELUGU_REGEX.test(scriptText)) return 'Telugu';
  if (KANNADA_REGEX.test(scriptText)) return 'Kannada';
  if (MALAYALAM_REGEX.test(scriptText)) return 'Malayalam';
  if (DEVANAGARI_REGEX.test(scriptText)) {
    if (/(?:आहे|नाही|कसा|बघा|कशी|झाला|झाली|खूप|नक्की)/.test(scriptText)) return "Marathi";
    if (/[a-zA-Z]{3,}/.test(scriptText)) return "Hinglish";
    return "Hindi";
  }
  if (/\b(?:kya|hai|nahi|karo|dekho|apna|bhaiya|bhai|yaar|acha|theek|chahiye|pe|wala|wali|dost)\b/i.test(scriptText)) {
    return 'Hinglish';
  }
  return fallback || 'English';
}

function detectScriptFormat(scriptText, fallback = 'Conversational / Dialogue') {
  if (!scriptText || typeof scriptText !== 'string') return fallback;
  const lower = scriptText.toLowerCase();

  const demoMarkers = /\b(?:product|demo|demonstrat|unbox|features|walkthrough|tutorial|screen|interface|pack|bottle|box|device|taps|swipes|shows the|showcases|holding the product|close-up on product)\b/i;
  const ugcMarkers = /\b(?:ugc|pov\b|selfie|vlog|hey guys|talking to camera|direct to camera|creator|front camera)\b/i;
  const storyMarkers = /\b(?:story|narrator|cinematic|dilemma|realisation|realization|journey|suddenly|meanwhile|emotional|character arc)\b/i;

  const demoScore = (lower.match(demoMarkers) || []).length;
  const ugcScore = (lower.match(ugcMarkers) || []).length;
  const storyScore = (lower.match(storyMarkers) || []).length;

  if (demoScore > 0 && demoScore >= ugcScore && demoScore >= storyScore) return 'Product Demo';
  if (ugcScore > 0 && ugcScore >= storyScore) return 'UGC / Creator-style';
  if (storyScore > 0) return 'Storytelling';

  const audioMode = detectScriptAudioMode(scriptText);
  if (audioMode === 'voiceover') {
    return lower.includes('doctor') || lower.includes('app') || lower.includes('service') || lower.includes('product')
      ? 'Product Demo'
      : 'Storytelling';
  }

  return 'Conversational / Dialogue';
}

function detectScriptAudioMode(scriptText) {
  if (!scriptText || typeof scriptText !== 'string') return 'dialogue';
  const clean = scriptText.replace(/ANNEX\s*A/gi, '').replace(/SCENE\s*\d+/gi, '');
  const voMatches = (clean.match(VO_TERM_REGEX) || []).length;
  const dialogueMatches = (clean.match(DIALOGUE_SPEAKER_REGEX) || []).length;

  if (voMatches >= 2 || (voMatches > 0 && dialogueMatches === 0)) {
    return 'voiceover';
  }
  return 'dialogue';
}

function compileStructuredScene(scene, idx, totalScenes = 4) {
  const header = `ANNEX A\n${scene.beatTitle || `SCENE ${idx + 1}`}`;
  let visualText = (scene.visual || '').trim();
  if (idx > 0 && !/^Same setting/i.test(visualText)) {
    visualText = `Same setting: ${visualText}`;
  }

  const cameraLine = scene.camera?.trim()
    ? `• Camera: ${scene.camera.trim()}`
    : `• Camera: smooth slow push-in`;
  const dialogueLine = scene.dialogue?.trim()
    ? scene.dialogue.trim()
    : `(None - visual demonstration with natural room tone)`;
  const soundLine = scene.sound?.trim()
    ? scene.sound.trim()
    : `Ambience: natural room tone.`;

  return `${header}\nVisual:\n${visualText}\nAnimation Elements:\n${cameraLine}\n• Text overlay: none\n• UI element: none\n• Transition: cut\n• Motion graphics: none\nAudio / Dialogue / Voiceover:\n${dialogueLine}\nSound Design:\n${soundLine}\nEditing Notes:\nScene duration: ~4s | Output: 1080p`;
}

export default function ExistingScriptModal({
  isOpen,
  onClose,
  onImportScript,
  businessName = '',
  businessType = '',
  language = 'English',
  creativeStyle = 'Conversational / Dialogue',
  brandTone = 'Warm & Authentic',
  targetDuration = '20s',
  aspectRatio = '9:16',
}) {
  const [modalStep, setModalStep] = useState(1); // 1 = Input & Options, 2 = Review & Edit Scenes
  const [scriptText, setScriptText] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(targetDuration || '20s');
  const [selectedAspect, setSelectedAspect] = useState(aspectRatio || '9:16');
  const [selectedLang, setSelectedLang] = useState(language || 'English');
  const [selectedStyle, setSelectedStyle] = useState(creativeStyle || 'Conversational / Dialogue');
  const [productPhoto, setProductPhoto] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 2 Editable Fields
  const [editChar1, setEditChar1] = useState('');
  const [editChar2, setEditChar2] = useState('');
  const [editSetting, setEditSetting] = useState('');
  const [scenesData, setScenesData] = useState([]);

  if (!isOpen) return null;

  const handlePhotoUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setProductPhoto({
        name: file.name,
        previewUrl: e.target.result,
        data: e.target.result.split(',')[1],
        mime: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSample = (sample) => {
    setScriptText(sample.text);
    const sLang = sample.lang || detectScriptLanguage(sample.text);
    const sStyle = sample.style || detectScriptFormat(sample.text);
    setSelectedLang(sLang);
    setSelectedStyle(sStyle);
    setValidationResult(null);
    setErrorMsg('');
  };

  const handleValidateScript = async () => {
    if (!scriptText.trim()) {
      setErrorMsg('Please paste or write your script first.');
      return;
    }

    setIsValidating(true);
    setErrorMsg('');

    try {
      const detectedL = detectScriptLanguage(scriptText, language || 'English');
      const detectedF = detectScriptFormat(scriptText, creativeStyle || 'Conversational / Dialogue');

      const token = localStorage.getItem('clevertize_token');
      const res = await fetch('/api/script/validate-and-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rawScript: scriptText,
          businessName: businessName || 'My Business',
          businessType: businessType || 'Retail Business',
          language: detectedL,
          creativeStyle: detectedF,
          brandTone,
          targetDuration: selectedDuration,
          duration: selectedDuration,
          aspectRatio: selectedAspect,
          platform: selectedAspect === '16:9' ? 'YouTube / 16:9' : selectedAspect === '1:1' ? 'Feed / 1:1' : 'Instagram Reels / 9:16',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to validate script.');
      }

      const data = await res.json();
      setValidationResult(data);

      const isVo = data.audioDeliveryMode === 'voiceover' || detectScriptAudioMode(scriptText) === 'voiceover';
      const parsedScenes = (data.scenes || []).map((s, idx) => parseSceneParts(s, idx));
      setScenesData(parsedScenes);
      setEditChar1(data.character1 || (isVo ? `${businessName || 'Brand'} On-Screen Subject` : `${businessName || 'Brand'} Host`));
      setEditChar2(isVo ? 'None — Solo Subject / Voiceover B-Roll' : (data.character2 || 'Customer'));
      setEditSetting(data.setting || `${businessName || 'Brand'} Studio Environment`);

      const finalLang = data.detectedLanguage || detectedL;
      const finalStyle = data.detectedFormat || data.shotSpec?.format || detectedF;
      setSelectedLang(finalLang);
      setSelectedStyle(finalStyle);

      // Advance directly to Step 2 (Review & Edit Scenes)
      setModalStep(2);
    } catch (err) {
      console.warn('[validate-and-import] validation notice:', err.message);
      // If server returned a business or validation error, display actionable error directly
      if (
        err.message &&
        !err.message.includes('Failed to fetch') &&
        !err.message.includes('NetworkError') &&
        !err.message.includes('fetch')
      ) {
        setErrorMsg(err.message);
        setValidationResult(null);
        return;
      }

      if (scriptText.trim().length < 15) {
        setErrorMsg(
          'Script content is too brief to adapt. Please provide your business offering, a key benefit, or a call-to-action.'
        );
        setValidationResult(null);
        return;
      }

      // Safe client-side fallback if server endpoint is truly unreachable (offline network)
      const rawSentences = scriptText
        .trim()
        .split(/(?<=[.!?])\s+|\n+/)
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter((s) => s.length > 0 && !/^SCENE\s*\d+/i.test(s) && !/^ANNEX\s*A/i.test(s));

      const isVo = detectScriptAudioMode(scriptText) === 'voiceover';
      const beats = ['Scene 1 · Hook', 'Scene 2 · Build', 'Scene 3 · Turn', 'Scene 4 · Resolution'];
      const char1 = isVo ? `${businessName || 'Brand'} On-Screen Subject` : `${businessName || 'Brand'} Host`;
      const char2 = isVo ? 'None — Solo Subject / Voiceover B-Roll' : 'Customer';
      const setting = `${businessName || 'Brand'} Studio Environment`;

      const scenes = [0, 1, 2, 3].map((i) => {
        let userLine = '';
        if (i === 0) userLine = rawSentences[0] || '';
        else if (i === 1) userLine = rawSentences.length >= 3 ? rawSentences[1] : '';
        else if (i === 2) userLine = rawSentences.length >= 4 ? rawSentences[2] : '';
        else userLine = rawSentences.length >= 2 ? rawSentences[rawSentences.length - 1] : rawSentences[0] || '';

        const speakerPrefix = isVo ? 'VO' : char1;
        const dialogueContent = userLine
          ? `${speakerPrefix}: "${userLine.replace(/"/g, "'")}"`
          : '(None - visual demonstration with natural room tone)';

        const beatVisuals = isVo
          ? [
              `Same setting: ${char1} experiences the opening dilemma with relatable expression, demonstrating the core situation.`,
              `Same setting: ${char1} deals with the everyday struggle in the environment, physical action matching the narration.`,
              `Same setting: ${char1} discovers the solution from ${businessName || 'Brand'} with visible relief and comfort.`,
              `Same setting: ${char1} comfortably enjoys the final result, relaxed and completely reassured.`
            ]
          : [
              `Same setting: ${char1} introduces the hook with clear product focus in studio setting. Characters look at each other with warm engagement.`,
              `Same setting: ${char1} demonstrates key product features while ${char2} examines the quality. Characters look at each other with engaged interest.`,
              `Same setting: ${char2} experiences the benefit with clear relief and delight. Characters look at each other with shared satisfaction.`,
              `Same setting: Both characters face camera with confident, welcoming smiles, presenting the final invitation for ${businessName || 'Brand'}.`,
            ];

        return `ANNEX A\n${beats[i]}\nVisual:\n${beatVisuals[i]}\nAnimation Elements:\n• Camera: smooth motivated push-in\n• Text overlay: none\n• UI element: none\n• Transition: cut\n• Motion graphics: none\nAudio / Dialogue / Voiceover:\n${dialogueContent}\nSound Design:\nAmbience: natural room tone.\nEditing Notes:\nDuration ~4s`;
      });

      const fallbackData = {
        status: 'warning',
        passedGate: false,
        gatePassed: false,
        failures: [
          'Parsed offline without server AI verification. Please verify scene timings and dialogue before rendering.',
        ],
        scenes,
        character1: char1,
        character2: char2,
        setting,
        audioDeliveryMode: isVo ? 'voiceover' : 'dialogue',
        fullScriptText: scriptText,
        totalScenes: 4,
        shotSpec: null,
      };

      setValidationResult(fallbackData);
      setScenesData(scenes.map((s, idx) => parseSceneParts(s, idx)));
      setEditChar1(char1);
      setEditChar2(char2);
      setEditSetting(setting);
      setModalStep(2);
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpdateScene = (idx, field, value) => {
    setScenesData((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleProceedToStudio = () => {
    if (!scenesData || scenesData.length === 0) return;

    // 1. Recompile scenes into standard Annex-A strings
    const recompiledScenes = scenesData.map((s, idx) =>
      compileStructuredScene(s, idx, scenesData.length)
    );

    // 2. Prepare or synchronize shotSpec for downstream Magnific generation
    let updatedShotSpec = validationResult?.shotSpec
      ? JSON.parse(JSON.stringify(validationResult.shotSpec))
      : null;

    if (updatedShotSpec) {
      if (!updatedShotSpec.staticWorld) updatedShotSpec.staticWorld = {};
      updatedShotSpec.staticWorld.setting = editSetting;
      updatedShotSpec.staticWorld.location = editSetting;
      updatedShotSpec.staticWorld.characters = [editChar1, editChar2].filter(Boolean).join(' | ');

      if (Array.isArray(updatedShotSpec.shots)) {
        updatedShotSpec.shots = updatedShotSpec.shots.map((shot, idx) => {
          const s = scenesData[idx] || {};
          const visual = s.visual || shot.fullVisual || shot.primaryAction || '';
          const primaryAction = visual.split('.')[0] ? visual.split('.')[0].trim() + '.' : visual;
          return {
            ...shot,
            fullVisual: visual,
            primaryAction,
            cameraMovement: s.camera || shot.cameraMovement || 'smooth slow push-in',
            dialogue: s.dialogue || shot.dialogue || 'None',
          };
        });
      }
    } else {
      const beatNames = ['HOOK', 'BUILD', 'TURN', 'RESOLUTION'];
      const framings = [
        'Medium close-up (subject and hero product prominent in vertical frame)',
        'Medium shot (character interaction with clear waist-up framing)',
        'Medium close-up (focused on product demonstration and reaction)',
        'Medium shot held on reassuring smile and clear product visibility',
      ];
      updatedShotSpec = {
        project: {
          aspectRatio: '9:16',
          duration: '15s',
          platform: 'Instagram Reels / 9:16 Mobile',
          language: selectedLang,
          style: selectedStyle,
          businessName: businessName || 'My Business',
          businessType: businessType || 'Retail Business',
        },
        staticWorld: {
          setting: editSetting,
          location: editSetting,
          characters: [editChar1, editChar2].filter(Boolean).join(' | '),
          businessType: businessType || '',
        },
        continuityLock:
          'GLOBAL CONTINUITY LOCK:\n- Characters: Same 2 individuals with identical face, hair, and wardrobe in every shot.\n- Setting: Identical single location, identical time of day, lighting, and ambient surfaces.\n- Product: Exact product visual identity maintained without morphing or text alteration.',
        shots: scenesData.map((s, idx) => {
          const beat = beatNames[idx] || `SHOT ${idx + 1}`;
          const visual = s.visual || '';
          const primaryAction = visual.split('.')[0] ? visual.split('.')[0].trim() + '.' : visual;
          return {
            shotNumber: idx + 1,
            beat,
            framing: framings[idx] || 'Medium shot',
            primaryAction,
            fullVisual: visual,
            cameraMovement: s.camera || 'smooth slow push-in',
            dialogue: s.dialogue || 'None',
          };
        }),
      };
    }

    onImportScript({
      scenes: recompiledScenes,
      generatedScript: {
        raw: validationResult?.fullScriptText || scriptText,
        scenes: recompiledScenes,
        character1: editChar1,
        character2: editChar2,
        setting: editSetting,
      },
      character1: editChar1,
      character2: editChar2,
      setting: editSetting,
      language: selectedLang,
      creativeStyle: selectedStyle,
      targetDuration: selectedDuration,
      duration: selectedDuration,
      aspectRatio: selectedAspect,
      platform: selectedAspect === '16:9' ? 'YouTube Landscape / 16:9' : selectedAspect === '1:1' ? 'Feed Square / 1:1' : 'Instagram Reels / 9:16 Mobile',
      shotSpec: updatedShotSpec,
      productPhoto,
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          width: '100%',
          maxWidth: modalStep === 2 ? 880 : 780,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          transition: 'max-width 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-elevated)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              }}
            >
              {modalStep === 2 ? <Film size={20} /> : <FileCode2 size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {modalStep === 2 ? 'Review & Edit Production Script' : 'Start with an Existing Script'}
                </h3>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {isValidating ? 'Verifying Script…' : `Step ${modalStep} of 2`}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                {isValidating
                  ? 'Running 18-point Section 8 Quality Gate & extracting continuity anchors…'
                  : modalStep === 2
                  ? 'Confirm cast continuity, single setting, and camera actions for AI video production.'
                  : "Paste your 4-scene script. We'll run the 18-point Section 8 Quality Gate and prep for video."}
              </p>
            </div>
          </div>

          {/* Stepper Navigation Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                padding: '3px 8px',
                borderRadius: 20,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (!isValidating) setModalStep(1);
                }}
                disabled={isValidating}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: isValidating ? 'not-allowed' : 'pointer',
                  fontSize: 11,
                  fontWeight: modalStep === 1 ? 700 : 500,
                  color: modalStep === 1 ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                }}
              >
                <span>1. Input</span>
              </button>
              <ChevronRight size={12} style={{ color: 'var(--text-tertiary)' }} />
              <button
                type="button"
                onClick={() => {
                  if (validationResult && !isValidating) setModalStep(2);
                }}
                disabled={!validationResult || isValidating}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: validationResult && !isValidating ? 'pointer' : 'not-allowed',
                  fontSize: 11,
                  fontWeight: modalStep === 2 ? 700 : 500,
                  color: modalStep === 2 ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                  opacity: validationResult && !isValidating ? 1 : 0.5,
                }}
              >
                <span>2. Review Shots</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isValidating}
              aria-label="Close dialog"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: isValidating ? 'not-allowed' : 'pointer',
                opacity: isValidating ? 0.5 : 1,
                padding: 6,
                borderRadius: 6,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {isValidating ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 340,
                padding: '12px 0',
              }}
            >
              <ScriptVerificationLoader businessName={businessName} compact={true} />
            </div>
          ) : modalStep === 1 ? (
            /* ==================== STEP 1: SCRIPT INPUT ==================== */
            <>
              {/* Quick Sample Presets */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Need an example format?
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SAMPLE_SCRIPTS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLoadSample(s)}
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Sparkles size={12} style={{ color: 'var(--accent-primary)' }} />
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upfront Video Specs: Duration & Aspect Ratio */}
              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  {/* 1. Target Duration */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                        ⏱️ Target Video Duration
                      </label>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                        {selectedDuration === '15s' ? '3–4 scenes (~4s per shot)' : selectedDuration === '30s' ? '5–6 scenes (~5s per shot)' : '4–5 scenes (~4s per shot)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[
                        { id: '15s', label: '15s', subtitle: '3–4 scenes' },
                        { id: '20s', label: '20s', subtitle: '4–5 scenes (Standard)' },
                        { id: '30s', label: '30s', subtitle: '5–6 scenes' },
                      ].map((d) => {
                        const isSel = selectedDuration === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setSelectedDuration(d.id)}
                            style={{
                              flex: 1,
                              padding: '7px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: isSel ? 700 : 500,
                              backgroundColor: isSel ? 'var(--accent-primary)' : 'var(--bg-surface)',
                              color: isSel ? '#ffffff' : 'var(--text-secondary)',
                              border: isSel ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 2,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>{d.label}</span>
                            <span style={{ fontSize: 9.5, opacity: isSel ? 0.9 : 0.65 }}>{d.subtitle}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Aspect Ratio / Dimension */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                        📐 Video Dimension
                      </label>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                        {selectedAspect === '16:9' ? 'YouTube / TV' : selectedAspect === '1:1' ? 'Social Feed' : 'Reels / Shorts'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[
                        { id: '9:16', label: '📱 9:16', subtitle: 'Vertical' },
                        { id: '16:9', label: '🖥️ 16:9', subtitle: 'Landscape' },
                        { id: '1:1', label: '⏹️ 1:1', subtitle: 'Square' },
                      ].map((a) => {
                        const isSel = selectedAspect === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setSelectedAspect(a.id)}
                            style={{
                              flex: 1,
                              padding: '7px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: isSel ? 700 : 500,
                              backgroundColor: isSel ? 'var(--accent-primary)' : 'var(--bg-surface)',
                              color: isSel ? '#ffffff' : 'var(--text-secondary)',
                              border: isSel ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 2,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>{a.label}</span>
                            <span style={{ fontSize: 9.5, opacity: isSel ? 0.9 : 0.65 }}>{a.subtitle}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Script Input Textarea */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Script Content ({selectedDuration === '15s' ? '3–4 Scenes' : selectedDuration === '30s' ? '5–6 Scenes' : '4–5 Scenes'})
                  </label>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {selectedDuration === '15s'
                      ? 'Target: 3–4 scenes (~4s per shot) for a 15s commercial'
                      : selectedDuration === '30s'
                      ? 'Target: 5–6 scenes (~5s per shot) for a 30s commercial'
                      : 'Target: 4–5 scenes (~4s per shot) for a 20s commercial'}
                  </span>
                </div>
                <textarea
                  value={scriptText}
                  onChange={(e) => {
                    setScriptText(e.target.value);
                    if (validationResult) setValidationResult(null);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder={`Paste your script here, for example:\n\nSCENE 1 (Hook):\nVisual: Shop owner welcomes early morning customer.\nDialogue: "Are you ready for festive season?"\n\nSCENE 2 (Build)...\nSCENE 3 (Turn)...\nSCENE 4 (Resolution)...`}
                  style={{
                    width: '100%',
                    minHeight: 220,
                    maxHeight: 320,
                    padding: '12px 14px',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    lineHeight: 1.5,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div
                  style={{
                    backgroundColor: 'var(--error-subtle)',
                    border: '1px solid var(--error)',
                    borderRadius: 6,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: 'var(--error)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </>
          ) : (
            /* ==================== STEP 2: REVIEW & EDIT SCENES ==================== */
            <>
              {/* Quality Gate / Advisory Banner */}
              <div
                style={{
                  backgroundColor: validationResult?.passedGate
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${
                    validationResult?.passedGate ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'
                  }`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {validationResult?.passedGate ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                    ) : (
                      <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: validationResult?.passedGate ? 'var(--success)' : 'var(--warning)',
                      }}
                    >
                      {validationResult?.passedGate
                        ? 'Section 8 Quality Gate Passed — Script Ready for Video'
                        : 'Script Imported with Formatting Adjustments'}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-surface)',
                      padding: '2px 8px',
                      borderRadius: 12,
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {scenesData.length} Shots Detected
                  </span>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {validationResult?.passedGate
                    ? `All ${scenesData.length} scenes adhere to single-setting continuity, visual casting, and camera framing guidelines.`
                    : validationResult?.failures?.length > 0
                    ? `Advisory notes: ${validationResult.failures
                        .slice(0, 2)
                        .map((f) => f.replace(/\s*\([A-Z]\d+[a-z]?(-[a-z]+)?\)/gi, '').replace(/\\"/g, '"').trim())
                        .join('; ')}`
                    : 'Script structured and ready for review.'}
                </div>
              </div>

              {/* Script Intelligence & Format Bar (Auto-detected from script) */}
              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {/* Spoken Language */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Language:
                    </span>
                    <select
                      value={selectedLang}
                      onChange={(e) => setSelectedLang(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (Devanagari)</option>
                      <option value="Hinglish">Hinglish</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Kannada">Kannada</option>
                      <option value="Marathi">Marathi</option>
                    </select>
                  </div>

                  {/* Production Format */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Format:
                    </span>
                    <select
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="Conversational / Dialogue">Conversational / Dialogue</option>
                      <option value="Product Demo">Product Demo (Showcase in Action)</option>
                      <option value="UGC / Creator-style">UGC / Creator-style</option>
                      <option value="Storytelling">Storytelling (Cinematic Narrative)</option>
                    </select>
                  </div>

                  {/* Dimension Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Dimension:
                    </span>
                    <select
                      value={selectedAspect}
                      onChange={(e) => setSelectedAspect(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="9:16">📱 9:16 Vertical</option>
                      <option value="16:9">🖥️ 16:9 Landscape</option>
                      <option value="1:1">⏹️ 1:1 Square</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Duration Badge */}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      backgroundColor: 'var(--accent-subtle)',
                      padding: '4px 8px',
                      borderRadius: 6,
                    }}
                  >
                    ⏱️ {selectedDuration} ({scenesData.length} Shots)
                  </span>

                  {/* Delivery Mode Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      color: detectScriptAudioMode(scriptText) === 'voiceover' || validationResult?.audioDeliveryMode === 'voiceover'
                        ? 'var(--accent-primary)'
                        : 'var(--text-secondary)',
                      backgroundColor: detectScriptAudioMode(scriptText) === 'voiceover' || validationResult?.audioDeliveryMode === 'voiceover'
                        ? 'var(--accent-subtle)'
                        : 'var(--bg-surface)',
                      padding: '4px 10px',
                      borderRadius: 12,
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {detectScriptAudioMode(scriptText) === 'voiceover' || validationResult?.audioDeliveryMode === 'voiceover'
                      ? '🎙️ Voiceover-led (VO)'
                      : '💬 Character Dialogue'}
                  </div>
                </div>
              </div>

              {/* Product Demo Upload Card (Contextual helper when format is Product Demo) */}
              {selectedStyle.includes('Demo') && (
                <div
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.06)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: 10,
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Package size={17} style={{ color: 'var(--accent-primary)' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Product Demo Detected — Attach Product Photo
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--accent-primary)',
                          padding: '2px 8px',
                          borderRadius: 10,
                        }}
                      >
                        Visual Clarity Boost
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      Renders exact packaging & label details
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Since this is a product demonstration, uploading a clear photo of your product or packaging allows the camera to accurately showcase your real branding, packaging shape, and colors.
                  </div>

                  {productPhoto ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={productPhoto.previewUrl || `data:${productPhoto.mime || 'image/jpeg'};base64,${productPhoto.data}`}
                          alt="Product preview"
                          style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-subtle)' }}
                        />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {productPhoto.name || 'Product photo'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={12} /> Ready for video generation
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '5px 10px',
                            borderRadius: 6,
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          Change
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload(file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setProductPhoto(null)}
                          style={{
                            fontSize: 11,
                            padding: '5px 8px',
                            borderRadius: 6,
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--error)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '12px 16px',
                          border: '2px dashed var(--border-default)',
                          borderRadius: 8,
                          backgroundColor: 'var(--bg-surface)',
                          cursor: 'pointer',
                          color: 'var(--accent-primary)',
                          fontSize: 12,
                          fontWeight: 600,
                          transition: 'border-color 0.15s ease',
                        }}
                      >
                        <Upload size={15} />
                        <span>Click or drag to upload a clear product or packaging photo (Optional)</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(file);
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 1: World Continuity Lock (Editable) */}
              <div
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Lock size={15} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      World Continuity Lock
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        backgroundColor: 'var(--accent-subtle)',
                        color: 'var(--accent-primary)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      AI Consistency Anchor
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    Holds faces & background identical across all shots
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 12,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: 4,
                      }}
                    >
                      🏠 Single Setting / Environment
                    </label>
                    <input
                      type="text"
                      value={editSetting}
                      onChange={(e) => setEditSetting(e.target.value)}
                      placeholder="e.g. Modern kitchen with warm morning daylight"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: 12,
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, display: 'block' }}>
                      Locked across all 4 shots so setting never shifts.
                    </span>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: 4,
                      }}
                    >
                      {detectScriptAudioMode(scriptText) === 'voiceover' || validationResult?.audioDeliveryMode === 'voiceover'
                        ? '👤 On-Screen Visual Subject (Solo Actor)'
                        : '👩 Character 1 (Lead Host / Actor)'}
                    </label>
                    <input
                      type="text"
                      value={editChar1}
                      onChange={(e) => setEditChar1(e.target.value)}
                      placeholder={
                        detectScriptAudioMode(scriptText) === 'voiceover' || validationResult?.audioDeliveryMode === 'voiceover'
                          ? 'e.g. Patient lying in bed with a fever'
                          : 'e.g. Sunita - 38-year-old homemaker in casual cotton saree'
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: 12,
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 6,
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, display: 'block' }}>
                      {detectScriptAudioMode(scriptText) === 'voiceover' || validationResult?.audioDeliveryMode === 'voiceover'
                        ? 'Actor performing physical actions on camera (visual only, no spoken lines).'
                        : 'Face, skin tone, and clothing consistent in every shot.'}
                    </span>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          detectScriptAudioMode(scriptText) === 'voiceover' || validationResult?.audioDeliveryMode === 'voiceover'
                            ? 'var(--accent-primary)'
                            : 'var(--text-secondary)',
                        marginBottom: 4,
                      }}
                    >
                      {detectScriptAudioMode(scriptText) === 'voiceover' || validationResult?.audioDeliveryMode === 'voiceover'
                        ? '🎙️ Audio Delivery Mode'
                        : '👨 Character 2 (Supporting / Customer)'}
                    </label>
                    {detectScriptAudioMode(scriptText) === 'voiceover' || validationResult?.audioDeliveryMode === 'voiceover' ? (
                      <div>
                        <div
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 12,
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--accent-subtle)',
                            borderRadius: 6,
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span style={{ color: 'var(--accent-primary)' }}>●</span>
                          <span>Voiceover (VO) — Off-Screen Narrator</span>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, display: 'block' }}>
                          Narration plays over visual scene action. No secondary character or lip-sync needed.
                        </span>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={editChar2}
                          onChange={(e) => setEditChar2(e.target.value)}
                          placeholder="e.g. Ramesh - 42-year-old kirana store owner in apron"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: 12,
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 6,
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, display: 'block' }}>
                          Secondary character or customer interaction.
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: 4 Production Scenes (Editable) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Film size={15} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Production Shots (Compiled for Video Generation)
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    Edit visual staging or dialogue directly
                  </span>
                </div>

                {scenesData.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 10,
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {/* Scene Card Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: 4,
                            backgroundColor: 'rgba(99, 102, 241, 0.14)',
                            color: 'var(--accent-primary)',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {s.title} · {s.timing}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'var(--text-tertiary)',
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            padding: '2px 8px',
                            borderRadius: 12,
                          }}
                        >
                          {s.beatRole}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--text-tertiary)',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}
                        >
                          Shot {idx + 1} of 4
                        </span>
                      </div>
                    </div>

                    {/* Scene Visual & Camera Staging */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <label
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Camera size={13} style={{ color: 'var(--accent-primary)' }} />
                          <span>Visual Staging & Physical Action (Camera Prompt)</span>
                        </label>
                      </div>
                      <textarea
                        rows={2}
                        value={s.visual}
                        onChange={(e) => handleUpdateScene(idx, 'visual', e.target.value)}
                        placeholder="Describe character motion, camera angle, and scene actions..."
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: 12,
                          lineHeight: 1.5,
                          borderRadius: 6,
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          backgroundColor: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 6,
                          padding: '4px 10px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: 'var(--text-tertiary)',
                            flexShrink: 0,
                          }}
                        >
                          Camera Movement:
                        </span>
                        <input
                          type="text"
                          value={s.camera}
                          onChange={(e) => handleUpdateScene(idx, 'camera', e.target.value)}
                          placeholder="e.g. smooth slow push-in, steady two-shot"
                          style={{
                            flex: 1,
                            fontSize: 11,
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Scene Spoken Dialogue / Voiceover */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <MessageSquare size={13} style={{ color: 'var(--accent-primary)' }} />
                          <span>
                            {/^(?:text\s*[\+&]\s*)?(?:vo|v\.o\.|v\/o|voiceover|voice[\s-]over|narrator|narration|off[\s-]screen|audio)\b/i.test(
                              s.dialogue || ''
                            ) || detectScriptAudioMode(scriptText) === 'voiceover'
                              ? 'Voiceover Line (Off-screen narrator)'
                              : 'Spoken Dialogue / Character Line'}
                          </span>
                        </label>

                        {/* Speaker Delivery Toggle */}
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => {
                              const cleanText = (s.dialogue || '').replace(/^[^:]+:\s*["']?/, '').replace(/["']$/, '');
                              handleUpdateScene(idx, 'dialogue', `VO: "${cleanText || '...'}"`);
                            }}
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: /^(?:text\s*[\+&]\s*)?(?:vo|v\.o\.|v\/o|voiceover|voice[\s-]over|narrator|narration|off[\s-]screen|audio)\b/i.test(
                                s.dialogue || ''
                              )
                                ? '1px solid var(--accent-primary)'
                                : '1px solid var(--border-subtle)',
                              backgroundColor: /^(?:text\s*[\+&]\s*)?(?:vo|v\.o\.|v\/o|voiceover|voice[\s-]over|narrator|narration|off[\s-]screen|audio)\b/i.test(
                                s.dialogue || ''
                              )
                                ? 'var(--accent-subtle)'
                                : 'var(--bg-elevated)',
                              color: /^(?:text\s*[\+&]\s*)?(?:vo|v\.o\.|v\/o|voiceover|voice[\s-]over|narrator|narration|off[\s-]screen|audio)\b/i.test(
                                s.dialogue || ''
                              )
                                ? 'var(--accent-primary)'
                                : 'var(--text-tertiary)',
                            }}
                          >
                            🎙️ VO (Voiceover)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const cleanText = (s.dialogue || '').replace(/^[^:]+:\s*["']?/, '').replace(/["']$/, '');
                              const actorName = (editChar1 || 'Host').split('—')[0].split('-')[0].trim();
                              handleUpdateScene(idx, 'dialogue', `${actorName}: "${cleanText || '...'}"`);
                            }}
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: !/^(?:text\s*[\+&]\s*)?(?:vo|v\.o\.|v\/o|voiceover|voice[\s-]over|narrator|narration|off[\s-]screen|audio)\b/i.test(
                                s.dialogue || ''
                              )
                                ? '1px solid var(--accent-primary)'
                                : '1px solid var(--border-subtle)',
                              backgroundColor: !/^(?:text\s*[\+&]\s*)?(?:vo|v\.o\.|v\/o|voiceover|voice[\s-]over|narrator|narration|off[\s-]screen|audio)\b/i.test(
                                s.dialogue || ''
                              )
                                ? 'var(--accent-subtle)'
                                : 'var(--bg-elevated)',
                              color: !/^(?:text\s*[\+&]\s*)?(?:vo|v\.o\.|v\/o|voiceover|voice[\s-]over|narrator|narration|off[\s-]screen|audio)\b/i.test(
                                s.dialogue || ''
                              )
                                ? 'var(--accent-primary)'
                                : 'var(--text-tertiary)',
                            }}
                          >
                            💬 On-Screen Actor
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={s.dialogue}
                        onChange={(e) => handleUpdateScene(idx, 'dialogue', e.target.value)}
                        placeholder='e.g. VO: "102 fever. And the doctor wants me to GET UP?!"'
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: 12,
                          borderRadius: 6,
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-elevated)',
            flexShrink: 0,
          }}
        >
          {modalStep === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleValidateScript}
                disabled={isValidating || !scriptText.trim()}
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: isValidating || !scriptText.trim() ? 'not-allowed' : 'pointer',
                  opacity: isValidating || !scriptText.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {isValidating ? (
                  <>
                    <RotateCcw size={14} className="spin" />
                    <span>Verifying Script…</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Verify Script & Gate</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setModalStep(1)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ArrowLeft size={14} />
                <span>Back to Script Input</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-default)',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleProceedToStudio}
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '9px 20px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 10px var(--accent-glow)',
                  }}
                >
                  <span>Proceed to Script Studio (Stage 07)</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
