import React, { useState } from 'react';
import {
  X,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Film,
  Check,
  Clock,
  Layers,
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

export default function ExistingScriptModal({
  isOpen,
  onClose,
  onImportScript,
  businessName = '',
  businessType = '',
  language = 'English',
  creativeStyle = 'UGC / Creator-style',
}) {
  const [scriptText, setScriptText] = useState('');
  const [selectedLang, setSelectedLang] = useState(language || 'English');
  const [selectedStyle, setSelectedStyle] = useState(creativeStyle || 'UGC / Creator-style');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLoadSample = (sample) => {
    setScriptText(sample.text);
    setSelectedLang(sample.lang);
    setSelectedStyle(sample.style);
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
          language: selectedLang,
          creativeStyle: selectedStyle,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to validate script.');
      }

      const data = await res.json();
      setValidationResult(data);
    } catch (err) {
      console.warn('[validate-and-import] validation notice:', err.message);
      // If server returned a business or validation error, display actionable error directly
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('fetch')) {
        setErrorMsg(err.message);
        setValidationResult(null);
        return;
      }

      if (scriptText.trim().length < 15) {
        setErrorMsg('Script content is too brief to adapt. Please provide your business offering, a key benefit, or a call-to-action.');
        setValidationResult(null);
        return;
      }

      // Safe client-side fallback if server endpoint is truly unreachable (offline network)
      const rawSentences = scriptText.trim()
        .split(/(?<=[.!?])\s+|\n+/)
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter((s) => s.length > 0 && !/^SCENE\s*\d+/i.test(s) && !/^ANNEX\s*A/i.test(s));

      const beats = ['Scene 1 · Hook', 'Scene 2 · Build', 'Scene 3 · Turn', 'Scene 4 · Resolution'];
      const char1 = `${businessName || 'Brand'} Host`;
      const char2 = 'Customer';
      const scenes = [0, 1, 2, 3].map((i) => {
        let userLine = '';
        if (i === 0) userLine = rawSentences[0] || '';
        else if (i === 1) userLine = rawSentences.length >= 3 ? rawSentences[1] : '';
        else if (i === 2) userLine = rawSentences.length >= 4 ? rawSentences[2] : '';
        else userLine = rawSentences.length >= 2 ? rawSentences[rawSentences.length - 1] : rawSentences[0] || '';

        // Never generate fake spoken dialogue
        const dialogueContent = userLine
          ? `${char1}: "${userLine.replace(/"/g, "'")}"`
          : '(None - visual demonstration with natural room tone)';

        const beatVisuals = [
          `Same setting: ${char1} introduces the hook with clear product focus in studio setting. Characters look at each other with warm engagement.`,
          `Same setting: ${char1} demonstrates key product features while ${char2} examines the quality. Characters look at each other with engaged interest.`,
          `Same setting: ${char2} experiences the benefit with clear relief and delight. Characters look at each other with shared satisfaction.`,
          `Same setting: Both characters face camera with confident, welcoming smiles, presenting the final invitation for ${businessName || 'Brand'}.`
        ];

        return `ANNEX A\n${beats[i]}\nVisual:\n${beatVisuals[i]}\nAnimation Elements:\n• Camera: smooth motivated push-in\n• Text overlay: none\n• UI element: none\n• Transition: cut\n• Motion graphics: none\nAudio / Dialogue / Voiceover:\n${dialogueContent}\nSound Design:\nAmbience: natural room tone.\nEditing Notes:\nDuration ~4s`;
      });

      setValidationResult({
        status: 'warning',
        passedGate: false,
        gatePassed: false,
        failures: ['Parsed offline without server AI verification. Please verify scene timings and dialogue before rendering.'],
        scenes,
        character1: char1,
        character2: char2,
        setting: `${businessName || 'Brand'} Studio Environment`,
        fullScriptText: scriptText,
        totalScenes: 4,
        shotSpec: null,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleProceedToStudio = () => {
    if (!validationResult || !validationResult.scenes) return;

    onImportScript({
      scenes: validationResult.scenes,
      generatedScript: {
        raw: validationResult.fullScriptText || scriptText,
        scenes: validationResult.scenes,
        character1: validationResult.character1,
        character2: validationResult.character2,
        setting: validationResult.setting,
      },
      character1: validationResult.character1,
      character2: validationResult.character2,
      setting: validationResult.setting,
      language: selectedLang,
      creativeStyle: selectedStyle,
      shotSpec: validationResult.shotSpec || null,
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
          maxWidth: 780,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
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
              <FileCode2 size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                Start with an Existing Script
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                Paste your 4-scene script. We'll run the 18-point Section 8 Quality Gate and prep for video.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Quick Sample Presets */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
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

          {/* Script Input Textarea */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                Script Content (4 Scenes)
              </label>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                Supports standard ANNEX A scene format or freeform 4 beats
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
                minHeight: 180,
                maxHeight: 260,
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

          {/* Configuration Options (Language & Format) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Spoken Language
              </label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                }}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (Devanagari)</option>
                <option value="Hinglish">Hinglish</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Kannada">Kannada</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Production Format
              </label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                }}
              >
                <option value="UGC / Creator-style">UGC / Creator-style</option>
                <option value="Storytelling">Conversational Storytelling</option>
                <option value="Dialogue-led drama">Dialogue-led Drama</option>
                <option value="Problem / Solution">Problem / Solution</option>
              </select>
            </div>
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

          {/* Validation & Gate Results Banner */}
          {validationResult && (
            <div
              style={{
                backgroundColor: validationResult.passedGate ? 'var(--success-subtle)' : 'var(--warning-subtle)',
                border: `1px solid ${validationResult.passedGate ? 'var(--success)' : 'var(--warning)'}`,
                borderRadius: 8,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {validationResult.passedGate ? (
                    <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                  ) : (
                    <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
                  )}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: validationResult.passedGate ? 'var(--success)' : 'var(--warning)',
                    }}
                  >
                    {validationResult.passedGate
                      ? 'Script Verified: Passed Section 8 Quality Gate!'
                      : 'Script Imported: Ready with advisory notes'}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {validationResult.scenes?.length || 4} Production Scenes Ready
                </span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Detected Characters: <strong style={{ color: 'var(--text-primary)' }}>{validationResult.character1}</strong> & <strong style={{ color: 'var(--text-primary)' }}>{validationResult.character2}</strong> | Setting: <strong style={{ color: 'var(--text-primary)' }}>{validationResult.setting}</strong>
              </div>

              {validationResult.failures && validationResult.failures.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', padding: 8, borderRadius: 6 }}>
                  Advisory notes: {validationResult.failures.slice(0, 2).join('; ')}
                </div>
              )}
            </div>
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

          <div style={{ display: 'flex', gap: 10 }}>
            {!validationResult ? (
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
                    <span>Validating Script…</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Verify Script & Gate</span>
                  </>
                )}
              </button>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
