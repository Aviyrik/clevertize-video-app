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
  Screen01Business,
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

// Dynamic Category & Brand-Aware Brief Suggestions and Placeholders
function getCategoryBriefSuggestions(businessType, businessName, town, offer) {
  const brand = (businessName && businessName.trim()) || 'your brand';
  const city = (town && town.trim()) || '';
  const citySuffix = city ? ` in ${city}` : '';
  const bType = (businessType || '').toLowerCase();

  if (bType.includes('saree') || bType.includes('ethnic') || bType.includes('bridal')) {
    return {
      placeholder: `e.g. Show why ${brand} is the top destination for wedding & festive sarees${citySuffix}. Highlight authentic handloom silks, intricate zardozi borders, and special bridal styling assistance...`,
      suggestions: [
        `Showcase our new pure Kanjivaram & Banarasi bridal saree collection for wedding season`,
        `Create a fun festive video highlighting special discount on designer partywear sarees`,
        `Show a daughter helping her mother choose the perfect silk saree at ${brand}`,
        `Highlight our handloom lightweight daily wear and office sarees with modern prints`,
      ],
    };
  }

  if (bType.includes('clothing') || bType.includes('apparel') || bType.includes('fashion')) {
    return {
      placeholder: `e.g. Launch our new seasonal clothing collection at ${brand}${citySuffix}. Highlight premium cotton fabrics, flattering fits, and trendsetting styles for every occasion...`,
      suggestions: [
        `Launch our new festive ethnic and western collection with trending outfits`,
        `Create a relatable Reel comparing online fitting disappointments vs perfect trial at ${brand}`,
        `Showcase Buy 2 Get 1 Free festive sale on trending outfits`,
        `Show college students finding stylish, budget-friendly everyday fits`,
      ],
    };
  }

  if (bType.includes('jewel') || bType.includes('gold') || bType.includes('ornament')) {
    return {
      placeholder: `e.g. Announce our festive gold and diamond collection at ${brand}${citySuffix}. Emphasize 100% BIS hallmark purity, exquisite craftsmanship, and 0% making charges offer...`,
      suggestions: [
        `Highlight hallmark 916 gold & diamond lightweight jewellery for festive occasions`,
        `Show a heartwarming story of a husband surprising his wife with a delicate necklace`,
        `Announce 0% making charges offer on antique temple jewellery this wedding season`,
        `Promote daily wear rose gold and silver ornaments that match every modern outfit`,
      ],
    };
  }

  if (bType.includes('sweet') || bType.includes('bakery') || bType.includes('mithai')) {
    return {
      placeholder: `e.g. Create a festive video for ${brand}${citySuffix} highlighting pure desi ghee sweets, fresh customized gift hampers, and guaranteed same-day delivery...`,
      suggestions: [
        `Show fresh pure desi ghee sweets being packed into premium festive gift hampers`,
        `Create a funny family video about sneaking the last piece of Kaju Katli from the box`,
        `Announce special festival gift boxes and same-day delivery for corporate orders`,
        `Highlight our famous signature sweets made fresh every morning with 100% purity`,
      ],
    };
  }

  if (bType.includes('restaurant') || bType.includes('cafe') || bType.includes('kitchen') || bType.includes('food')) {
    return {
      placeholder: `e.g. Show why food lovers visit ${brand}${citySuffix} for authentic flavors, warm cozy ambience, and unbeatable weekend dining specials...`,
      suggestions: [
        `Showcase our sizzling signature dishes and warm family dining ambience`,
        `Create a fun video of friends arguing over who gets the last bite of our special platter`,
        `Promote our weekend unlimited buffet and special discount on online orders`,
        `Highlight authentic regional recipes crafted with traditional slow-cooked spices`,
      ],
    };
  }

  if (bType.includes('kirana') || bType.includes('grocery') || bType.includes('supermarket')) {
    return {
      placeholder: `e.g. Show why local families trust ${brand}${citySuffix} for monthly grocery shopping, farm-fresh produce, and 30-minute free home delivery...`,
      suggestions: [
        `Show why neighbours trust ${brand} for monthly groceries with instant free delivery`,
        `Relatable video of a husband remembering forgotten grocery items via a quick WhatsApp list`,
        `Promote special festive discounts on cooking oil, staples, and dry fruit packs`,
        `Highlight fresh daily morning arrivals and better-than-online prices on essentials`,
      ],
    };
  }

  if (bType.includes('salon') || bType.includes('parlour') || bType.includes('spa') || bType.includes('beauty')) {
    return {
      placeholder: `e.g. Promote our festive makeover and bridal packages at ${brand}${citySuffix}. Highlight certified hair stylists, relaxing ambience, and glowing transformations...`,
      suggestions: [
        `Show a stunning bridal makeup and pre-wedding glow transformation at ${brand}`,
        `Highlight our festive head-to-toe beauty package at flat 40% discount`,
        `Relatable video on busy professionals taking a relaxing weekend pampering spa day`,
        `Promote advanced skin treatments and organic hair spa with expert stylists`,
      ],
    };
  }

  if (bType.includes('skin') || bType.includes('cosmetic') || bType.includes('wellness')) {
    return {
      placeholder: `e.g. Introduce our clean, chemical-free skincare formulas from ${brand}. Focus on natural glowing skin, visible transformation in 14 days, and dermatologist approval...`,
      suggestions: [
        `Demonstrate our gentle ayurvedic glow serum clearing dullness naturally`,
        `Customer testimonial Reel showing visible skin glow without harsh chemicals`,
        `Launch our festive skincare combo gift kit with exclusive limited-period gift`,
        `Highlight dermatologically tested, clean formulations crafted for Indian skin`,
      ],
    };
  }

  if (bType.includes('mobile') || bType.includes('laptop') || bType.includes('electronics')) {
    return {
      placeholder: `e.g. Show why purchasing gadgets at ${brand}${citySuffix} gives instant setup, best exchange bonus, and zero-cost EMI plans...`,
      suggestions: [
        `Show why buying phones offline at ${brand} beats online delivery with instant setup`,
        `Promote festive exchange bonanza with up to ₹10,000 off on 5G smartphones`,
        `Relatable story of upgrading parents to a smooth smartphone with friendly guidance`,
        `Highlight zero down-payment EMI offers and genuine manufacturer warranties`,
      ],
    };
  }

  if (bType.includes('decor') || bType.includes('furniture') || bType.includes('modular') || bType.includes('interior')) {
    return {
      placeholder: `e.g. Show why ${brand} is the smart choice for interior makeovers${citySuffix}. Highlight modular space-saving designs, premium materials, and 10-year warranty...`,
      suggestions: [
        `Show how our modular kitchen maximizes space for compact modern apartments`,
        `Highlight durable solid teakwood dining and living room sets with 10-year warranty`,
        `Create a cozy festive home makeover Reel with designer lighting and curtains`,
        `Promote free 3D design consultation and turnkey interior installation`,
      ],
    };
  }

  if (bType.includes('dental') || bType.includes('clinic') || bType.includes('health') || bType.includes('hospital')) {
    return {
      placeholder: `e.g. Encourage families to book a consultation at ${brand}${citySuffix}. Emphasize pain-free modern technology, gentle doctors, and warm patient care...`,
      suggestions: [
        `Convince patients to book a pain-free dental checkup or smile correction`,
        `Overcome doctor anxiety with gentle modern technology and caring specialists`,
        `Promote complete family preventive health checkup package with fast reports`,
        `Share a confidence transformation story after invisible aligners treatment`,
      ],
    };
  }

  if (bType.includes('gym') || bType.includes('fitness') || bType.includes('yoga')) {
    return {
      placeholder: `e.g. Inspire fitness enthusiasts to join ${brand}${citySuffix}. Highlight imported equipment, certified personal trainers, and motivating community culture...`,
      suggestions: [
        `Inspire people to start their transformation journey with expert certified trainers`,
        `Promote annual membership festive discount with free personalized diet plan`,
        `Show an energetic group workout session and welcoming community vibe`,
        `Highlight modern imported equipment, clean locker rooms, and flexible timings`,
      ],
    };
  }

  if (bType.includes('coaching') || bType.includes('tuition') || bType.includes('education')) {
    return {
      placeholder: `e.g. Showcase why parents and students trust ${brand}${citySuffix} for board and competitive exams. Emphasize experienced faculty and structured doubt clearing...`,
      suggestions: [
        `Showcase our top student rankers and proven structured learning methodology`,
        `Announce scholarship admission test for CBSE & competitive exam batches`,
        `Highlight small batch sizes with 1-on-1 mentor doubts clearance`,
        `Show relatable student turning from exam anxiety to confident mastery`,
      ],
    };
  }

  if (bType.includes('auto') || bType.includes('bike') || bType.includes('car')) {
    return {
      placeholder: `e.g. Highlight festive delivery offers at ${brand}${citySuffix}. Show express service turnaround, genuine spare parts, and exciting exchange bonuses...`,
      suggestions: [
        `Show a family joyfully taking delivery of their shiny new vehicle for the festival`,
        `Promote bumper-to-bumper car detailing, ceramic coating, and AC service package`,
        `Highlight easy exchange schemes and lowest interest EMI financing on two-wheelers`,
        `Showcase quick 60-minute express periodic servicing with genuine parts`,
      ],
    };
  }

  if (bType.includes('real estate') || bType.includes('builder') || bType.includes('property')) {
    return {
      placeholder: `e.g. Tour the luxury lifestyle and prime connectivity at ${brand}${citySuffix}. Showcase modern amenities, green surroundings, and attractive payment plans...`,
      suggestions: [
        `Show walkthrough of ready-to-move spacious apartments with scenic balconies`,
        `Highlight prime location with 5-minute connectivity to metro, schools, and tech parks`,
        `Promote festive booking offer with zero registration charges and modular kitchen`,
        `Showcase luxury gated community amenities with clubhouse, pool, and 24/7 security`,
      ],
    };
  }

  // Universal fallback tailored to brand name and city
  return {
    placeholder: `e.g. Show why customers choose ${brand}${citySuffix}. Highlight your specialty, unique craftsmanship, and special festive offer for new patrons...`,
    suggestions: [
      `Show why customers choose ${brand} for trusted quality and personalized service`,
      `Create a relatable commercial highlighting our special offer and fast delivery`,
      `Tell the authentic story behind our craft, dedication, and happy patrons`,
      `Demonstrate how ${brand} solves everyday customer dilemmas with ease and care`,
    ],
  };
}

// Resilient Brand & Category Brief Suggestions (Fail-safe wrapper)
export function getBriefSuggestions(businessType, businessName, town, offer) {
  try {
    return getCategoryBriefSuggestions(businessType, businessName, town, offer) || {
      placeholder: 'Tell us what you want to promote, explain, announce or show.',
      suggestions: [
        'Show why customers choose our brand for trusted quality and personalized service',
        'Create a relatable commercial highlighting our special offer and fast delivery',
        'Tell the authentic story behind our craft, dedication, and happy patrons',
        'Demonstrate how our brand solves everyday customer dilemmas with ease and care',
      ],
    };
  } catch (err) {
    console.warn('[getBriefSuggestions] fallback on error:', err);
    return {
      placeholder: 'Tell us what you want to promote, explain, announce or show.',
      suggestions: [
        'Show why customers choose our brand for trusted quality and personalized service',
        'Create a relatable commercial highlighting our special offer and fast delivery',
        'Tell the authentic story behind our craft, dedication, and happy patrons',
        'Demonstrate how our brand solves everyday customer dilemmas with ease and care',
      ],
    };
  }
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

  // Persistent User Context (Conceptually userContext: preserves all inputs across stages)
  const [userContext, setUserContext] = useState(() => {
    let base = {
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
    };
    try {
      const saved = localStorage.getItem('clevertize_user_context');
      if (saved) {
        const parsed = JSON.parse(saved);
        const brandProfile = extractBrandProfile(parsed);
        base = { ...base, ...brandProfile };
      }
    } catch {
      // fallback
    }
    return base;
  });

  const updateUserContext = (key, val) => {
    if (key === 'language') {
      try {
        localStorage.setItem('clevertize_lang_explicit', 'true');
      } catch {}
    }
    setUserContext((prev) => {
      const next = { ...prev, [key]: val };
      try {
        // Persist only clean Brand Profile to localStorage so film settings never bleed into new films
        const brandProfile = extractBrandProfile(next);
        localStorage.setItem('clevertize_user_context', JSON.stringify(brandProfile));
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
  const [studioStage, setStudioStage] = useState(() => {
    try {
      const savedContext = localStorage.getItem('clevertize_user_context');
      if (savedContext) {
        const parsed = JSON.parse(savedContext);
        if (parsed.businessName && parsed.businessName.trim().length > 0) {
          return 'brief';
        }
      }
    } catch {}
    return 'business';
  });

  const [completedStages, setCompletedStages] = useState(() => {
    try {
      const savedContext = localStorage.getItem('clevertize_user_context');
      if (savedContext) {
        const parsed = JSON.parse(savedContext);
        if (parsed.businessName && parsed.businessName.trim().length > 0) {
          return ['business'];
        }
      }
    } catch {}
    return [];
  });

  const [hasStaleWarning, setHasStaleWarning] = useState(false);
  const [brandResetKey, setBrandResetKey] = useState(0);

  // V4 Guided Studio: Explicit confirmed choices only (defaults are not choices!)
  const [explicitChoices, setExplicitChoices] = useState({
    style: null,
    language: null,
    platform: null,
    duration: null,
    idea: null,
    opening: null,
  });

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
  const [directionsList, setDirectionsList] = useState([]);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [customDirection, setCustomDirection] = useState('');
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);

  const [hooksList, setHooksList] = useState([]);
  const [selectedHook, setSelectedHook] = useState(null);
  const [customHook, setCustomHook] = useState('');
  const [isLoadingHooks, setIsLoadingHooks] = useState(false);

  const [plotsList, setPlotsList] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [customPlot, setCustomPlot] = useState('');
  const [isLoadingPlots, setIsLoadingPlots] = useState(false);

  const [storyWorldData, setStoryWorldData] = useState(null);
  const [isLoadingStory, setIsLoadingStory] = useState(false);

  const [constraintsList, setConstraintsList] = useState([]);
  const [avoidList, setAvoidList] = useState([]);
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
    if (hooksList.length > 0 || selectedHook) {
      setLanguageChangedNotice(`Language changed to ${newLang}. Regenerating creative copy and script...`);
      setTimeout(() => setLanguageChangedNotice(''), 5000);
      setPlotsList([]);
      setSelectedPlot(null);
      setStoryWorldData(null);
      loadHooks(true, newLang);
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
    updateUserContext('creativeStyle', newFormat);
    setCreativeDNA((prev) => ({
      ...prev,
      format: newFormat,
      story: prev?.story ? { ...prev.story, format: newFormat } : { format: newFormat },
    }));
    // Invalidate downstream script because format changed
    const hadDownstream = Boolean(generatedScript || scenes.length > 0 || completedStages.includes('script'));
    setGeneratedScript(null);
    if (hadDownstream) {
      setHasStaleWarning(true);
    }
    await loadStoryWorld(true, null, newFormat);
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

  // Clean Reset for New Ad Film Project (Restarts from Beginning)
  const handleStartNewProject = () => {
    const confirmed = window.confirm(
      'Start a new film from the beginning? This will restart the studio process.'
    );
    if (!confirmed) return;

    // Increment brandResetKey to force clean remount of Screen01Business
    setBrandResetKey((prev) => prev + 1);

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
    loadedHooksDirectionKeyRef.current = '';
    setSelectedHook(null);
    setCustomHook('');
    setPlotsList([]);
    setSelectedPlot(null);
    setCustomPlot('');
    setStoryWorldData(null);
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

    // Reset film-specific inputs while strictly preserving brand profile
    setUserContext((prev) => {
      const brand = extractBrandProfile(prev);
      const next = {
        ...prev,
        ...brand,
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
      };
      try {
        localStorage.setItem('clevertize_user_context', JSON.stringify(brand));
      } catch (err) {
        // ignore
      }
      return next;
    });

    setCompletedStages([]);
    setStudioStage('business');
    setCurrentStep('input');
    setCreationStep(1);
    window.scrollTo({ top: 0, behavior: 'instant' });
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
    else if (studioStage === 'brief') setStudioStage('business');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Run Video Production Pipeline
  const handleRunVideoProduction = async () => {
    if (!scenes || !scenes.length) {
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
        scenes: scenes.map((s) => (typeof s === 'string' ? s : s.visual || s.text || '').trim()).filter(Boolean),
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
    setStudioStage('business');
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
                  letterSpacing: '0.04em',
                }}
              >
                Video Intelligence
              </span>
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

        {/* 8 DEDICATED GUIDED STUDIO SCREENS */}
        {studioStage === 'business' && (
          <Screen01Business
            key={`screen-01-business-${brandResetKey}`}
            userContext={userContext}
            updateUserContext={updateUserContext}
            handleFileUpload={handleFileUpload}
            BUSINESS_TYPES={BUSINESS_TYPE_PRESETS}
            autoEdit={brandResetKey > 0}
            onContinue={() => {
              if (!userContext.businessName.trim()) {
                setValidationError('Please enter your business or brand name.');
                return;
              }
              setValidationError('');
              try {
                triggerAdaptiveResearch();
              } catch (err) {
                console.warn('[research] non-blocking research error:', err);
              }
              markStageComplete('business');
              setStudioStage('brief');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {studioStage === 'brief' && (
          <Screen02Brief
            userContext={userContext}
            updateUserContext={updateUserContext}
            handleFileUpload={handleFileUpload}
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
              setStudioStage('business');
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
              setStoryWorldData(sw);
              setCreativeDNA((prev) => ({ ...prev, story: sw }));
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
      </main>
    </div>
  );
}
