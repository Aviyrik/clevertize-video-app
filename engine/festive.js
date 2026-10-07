// Festival-specific background decor (rule M13e). Used by the prompt (what to put in SETTING) and
// the quality gate (SETTING must show at least one of the keywords). Edit freely — add festivals here.
// Respect M24: decor and everyday festive moments only — no deities, idols or ritual close-ups.
const FESTIVE_DECOR = [
  { match: /diwali|deepavali|dhanteras|govardhan|padwa|bhai ?dooj|bhau ?beej|dev diwali|kartik purnima/i, name: "Diwali",
    decor: "warm string/fairy lights, lit clay diyas along the counter or shelf edges, marigold toran over the entrance, a small rangoli near the doorway, paper lanterns, gift boxes and sweet boxes on display",
    keywords: /diya|diyas|fairy light|string light|rangoli|lantern|toran|marigold/i },
  { match: /holi|dhulandi|rangwali/i, name: "Holi",
    decor: "bright gulal colour powders in bowls or packets on display, pichkaris (water guns) and water balloons, splashes of pink, green and yellow colour on the floor, walls and people's clothes, wet colour marks",
    keywords: /gulal|colou?r powder|pichkari|water balloon|colou?r splash|splashes of (pink|green|yellow|colou?r)|abir/i },
  { match: /navratri|garba|dandiya|durga puja|dussehra|dasara|vijayadashami/i, name: "Navratri / Durga Puja / Dussehra",
    decor: "marigold garlands and torans, small brass lamps, festive red-and-yellow cloth drapes, dandiya sticks or festive outfits on display, warm evening lights",
    keywords: /marigold|toran|garland|dandiya|brass lamp|festive (cloth|drape|light)/i },
  { match: /chhath/i, name: "Chhath",
    decor: "bamboo soop baskets, bunches of sugarcane, heaps of seasonal fruit and thekua on display, marigold garlands, warm lamps",
    keywords: /soop|sugarcane|thekua|bamboo basket|marigold/i },
  { match: /karva ?chauth/i, name: "Karva Chauth",
    decor: "red and gold festive decor, mehendi cones and bangles on display, glittering festive outfits, soft fairy lights",
    keywords: /mehendi|bangle|red and gold|fairy light|festive outfit/i },
  { match: /raksha ?bandhan|rakhi/i, name: "Raksha Bandhan",
    decor: "colourful rakhis displayed on a stand, gift-wrapped boxes, sweet boxes, bright festive ribbons",
    keywords: /rakhi|gift.?wrap|ribbon|sweet box/i },
  { match: /ganesh|ganpati|vinayaka/i, name: "Ganesh Chaturthi",
    decor: "marigold garlands, banana-leaf and flower decorations, plates of modak on display, festive lights (no idols, M24)",
    keywords: /marigold|modak|banana.?leaf|flower decoration|festive light/i },
  { match: /onam/i, name: "Onam",
    decor: "a pookalam flower rangoli on the floor, banana leaves, cream-and-gold kasavu fabrics, brass lamps",
    keywords: /pookalam|kasavu|banana lea|brass lamp|flower rangoli/i },
  { match: /pongal|sankranti|makar|lohri|bihu|uttarayan/i, name: "Harvest festival (Pongal / Sankranti / Lohri / Bihu)",
    decor: "bundles of sugarcane, colourful kites, a kolam or rangoli at the entrance, sesame and jaggery sweets on display",
    keywords: /sugarcane|kite|kolam|rangoli|til|jaggery/i },
  { match: /eid|ramzan|ramadan/i, name: "Eid",
    decor: "crescent-moon lanterns, warm fairy lights, dates and sevaiyan on display, green-and-gold festive drapes",
    keywords: /crescent|lantern|fairy light|sevaiyan|dates/i },
  { match: /christmas|xmas/i, name: "Christmas",
    decor: "a decorated Christmas tree, a paper star, red-and-green ribbons, warm fairy lights, plum cake on display",
    keywords: /christmas tree|star|fairy light|plum cake|red-and-green|tinsel/i },
  { match: /new year/i, name: "New Year",
    decor: "fairy lights, metallic balloons, streamers, a calm celebratory look",
    keywords: /fairy light|balloon|streamer/i },
  { match: /wedding/i, name: "Wedding season",
    decor: "marigold garlands, fairy lights, festive red-and-gold fabrics, gift and sweet boxes",
    keywords: /marigold|fairy light|red-and-gold|garland/i },
];

function festiveDecorFor(moment) {
  const m = String(moment || "");
  if (!m || /^(none|everyday|no festival)/i.test(m.trim())) return null;
  return FESTIVE_DECOR.find((d) => d.match.test(m)) || null;
}

module.exports = { FESTIVE_DECOR, festiveDecorFor };
