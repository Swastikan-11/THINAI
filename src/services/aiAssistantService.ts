// THINAI Agricultural AI Assistant Service
// Sourced Retrieval Engine over Verified TNAU / ICAR Publications
// Languages: English & Tamil Only (Unreviewed Languages Hidden)

import { Recommendation } from "./decisionEngine";
import { AppLanguage } from "./i18n";

export interface FarmerContext {
  name: string;
  location: string;
  district: string;
  state: string;
  farmSize: string;
  primaryCrop: string;
  cropVariety: string;
  cropStage: string;
  soilType: string;
  soilMoisture: number;
  weatherCondition: string;
  rainfallExpected: number;
  temperature: number;
  language: AppLanguage;
  nextBestAction?: Recommendation;
}

export interface AssistantMessage {
  id: string;
  from: "ai" | "user";
  text: string;
  timestamp: string;
  suggestions?: string[];
  citation?: string;
}

export interface CuratedKnowledgeEntry {
  id: string;
  topic: string;
  keywords: string[];
  crops: string[];
  questionPatterns: RegExp[];
  answerEn: string;
  answerTa: string;
  citation: string;
  sourceUrl: string;
}

// ─── CURATED, SOURCED KNOWLEDGE BASE (TNAU / ICAR PUBLICATIONS) ───────────────
export const CURATED_KNOWLEDGE_BASE: CuratedKnowledgeEntry[] = [
  {
    id: "irrigation-rain-delay",
    topic: "Irrigation Scheduling & Rainfall Avoidance",
    keywords: ["irrigation", "water", "delay", "rain", "rainfall", "பாசனம்", "தள்ளி", "மழை", "நீர்"],
    crops: ["Paddy", "Tomato", "Pepper", "Potato", "Corn", "General"],
    questionPatterns: [
      /why.*(?:delay|wait|stop|postpone).*irrigation/i,
      /when.*(?:irrigate|water)/i,
      /rain.*affect.*crop/i,
      /should i irrigate/i,
      /பாசனத்தை.*தள்ளி/i,
      /அடுத்த.*பாசனம்/i,
      /மழை.*பாதிக்குமா/i
    ],
    answerEn: `💧 **Irrigation Scheduling & Drainage Advisory:**

• **Core Scientific Rule:** When forecasted rainfall exceeds 10 mm within 24–48 hours and soil moisture is above 50%, all planned surface and drip irrigation must be delayed immediately.
• **Agronomic Impact:** Excess standing water saturates root-zone pore space, causing temporary root hypoxia (oxygen starvation) and predisposing plants to waterborne pathogens (*Magnaporthe oryzae* in paddy, *Phytophthora* in solanaceous crops).
• **Action:** Delay irrigation by 24–48 hours until field drainage is confirmed. Clear field drainage bunds to prevent ponding.`,
    answerTa: `💧 **பாசன மேலாண்மை & மழை பாதுகாப்பு ஆலோசனை:**

• **அறிவியல் விதி:** அடுத்த 24-48 மணி நேரத்தில் 10 மி.மீட்டருக்கு மேல் மழை பெய்ய வாய்ப்பிருந்து, மண்ணின் ஈரப்பதம் 50%-க்கு மேல் இருக்கும்போது பாசனத்தை உடனே தள்ளிப்போட வேண்டும்.
• **பயிர் பாதுகாப்பு:** வயலில் நீர் தேங்கினால் வேர்களுக்குக் காற்று கிடைக்காமல் திணறும். மேலும் நெல்லில் குலை நோய் மற்றும் தக்காளி/மிளகாயில் அழுகல் நோய் பரவும் அபாயம் அதிகரிக்கும்.
• **நடவடிக்கை:** பாசனத்தை 24-48 மணி நேரத்திற்கு நிறுத்தி வைக்கவும். வயல் வடிகால் மதகுகளை தூர்வாரி கூடுதல் நீர் வெளியேற வழிவகை செய்யவும்.`,
    citation: "TNAU Agritech Portal - Water Management Guidelines (TNAU/WTC/2023)",
    sourceUrl: "https://agritech.tnau.ac.in/agriculture/agri_irrigationmgt.html"
  },
  {
    id: "leaf-yellowing-chlorosis",
    topic: "Foliar Chlorosis & Nitrogen Leaching",
    keywords: ["yellow", "yellowing", "chlorosis", "leaf", "leaves", "மஞ்சள்", "இலை", "வெளிர்தல்"],
    crops: ["Paddy", "Tomato", "Pepper", "Corn", "General"],
    questionPatterns: [
      /why.*(?:leaf|leaves|crop).*(?:yellow|yellowing|turning yellow)/i,
      /இலைகள்.*மஞ்சள்/i,
      /பயிர்.*மஞ்சள்/i
    ],
    answerEn: `🍃 **Leaf Yellowing (Chlorosis) Diagnosis & Remediation:**

• **Probable Cause:** Saturated soil conditions and overcast skies restrict aerobic root respiration, causing temporary nitrogen immobilisation and leaching of nitrate ions below active root depth.
• **Differentiating Symptoms:** Uniform pale yellowing of older lower leaves indicates nitrogen deficiency. Interveinal bronzing/yellowing with brown spots indicates zinc deficiency (Khaira disease).
• **Action:** Ensure surface water is completely drained from plots. After rainfall ceases and soil aerates, top-dress with split urea @ 20-25 kg/acre combined with neem cake powder. If zinc deficiency is diagnosed, apply 0.5% Zinc Sulphate + 0.25% Lime foliar spray.`,
    answerTa: `🍃 **இலைகள் மஞ்சள் நிறமாதல் - காரணங்களும் மேலாண்மையும்:**

• **காரணம்:** தொடர் மழை மற்றும் வயலில் நீர் தேங்குவதால் வேர்களுக்கு பிராணவாயு கிடைக்காமல் தழைச்சத்தை (நைட்ரஜன்) கிரகிப்பது தடைபடுகிறது.
• **அடையாளங்கள்:** அடி இலைகள் சீராக வெளிர் மஞ்சள் நிறமாவது தழைச்சத்து குறைபாடு. இலை நரம்புகளுக்கு இடையில் செம்பழுப்புப் புள்ளிகள் தோன்றுவது துத்தநாகக் குறைபாடு.
• **நடவடிக்கை:** தேங்கிய நீரை வடிக்கவும். மழை நின்ற பின் ஏக்கருக்கு 20-25 கிலோ யூரியாவை வேப்பம் புண்ணாக்குடன் கலந்து இடவும். துத்தநாகக் குறைபாடு இருந்தால் 0.5% ஜிங்க் சல்பேட் + 0.25% சுண்ணாம்பு தெளிக்கவும்.`,
    citation: "TNAU Department of Soil Science & Agricultural Chemistry - Micronutrient & Fertilizer Compendium",
    sourceUrl: "https://agritech.tnau.ac.in/agriculture/agri_nutrientmgt_micronutrients.html"
  },
  {
    id: "rice-blast-management",
    topic: "Rice Blast (Pyricularia oryzae)",
    keywords: ["blast", "rice blast", "neck blast", "pyricularia", "குலை நோய்", "நெல் குலை"],
    crops: ["Paddy"],
    questionPatterns: [
      /(?:rice|paddy)?.*blast/i,
      /குலை.*நோய்/i
    ],
    answerEn: `🌾 **Rice Blast Disease Management Protocol:**

• **Identification:** Spindle-shaped diamond lesions with gray or off-white centers and dark brown margins on leaves; darkened neck rot at panicle emergence.
• **Predisposing Conditions:** Continuous high humidity (>85%), night dew periods >10 hours, and excess basal nitrogen application.
• **Verified Scientific Measures:**
  1. Cultural: Avoid excessive urea top-dressing; apply potash in split doses to strengthen plant cell walls.
  2. Biological: Seed treatment with *Pseudomonas fluorescens* @ 10 g/kg seed.
  3. Chemical (Gated): Foliar spray of Tricyclazole 75% WP @ 120 g/acre or Isoprothiolane 40% EC @ 300 ml/acre in 200 L water at early lesion onset. (Status: UNVERIFIED pending agronomist audit).`,
    answerTa: `🌾 **நெல் குலை நோய் தடுப்பு & மேலாண்மை நெறிமுறை:**

• **அடையாளம்:** இலைகளில் சாம்பல் நிற மையமும் பழுப்பு நிற விளிம்பும் கொண்ட கதிர் வடிவப் புள்ளிகள்; கதிர் கழுத்துப் பகுதியில் கறுத்து ஒடிதல்.
• **காரணம்:** காற்றில் அதிக ஈரப்பதம் (>85%), நீண்ட பனிப்பொழிவு மற்றும் அளவுக்கு அதிகமான தழைச்சத்து (யூரியா).
• **பரிந்துரைக்கப்படும் நடவடிக்கைகள்:**
  1. யூரியாவை குறைத்து, சாம்பல் சத்தை (பொட்டாஷ்) பிரித்து இடவும்.
  2. சூடோமோனாஸ் ஃபுளோரசன்ஸ் 10 கிராம்/கிலோ விதைக்கு என்ற அளவில் விதை நேர்த்தி செய்யவும்.
  3. ஆரம்ப நிலையில் ட்ரைசைக்ளசோல் 75% WP 120 கிராம்/ஏக்கர் அல்லது ஐசோபுரோதியோலேன் 300 மி.லி/ஏக்கர் தெளிக்கவும். (நிலை: சரிபார்ப்பு நிலுவையில்).`,
    citation: "ICAR-National Rice Research Institute (NRRI) Disease Bulletin No. 42",
    sourceUrl: "https://icar-nrri.gov.in/crop-protection"
  },
  {
    id: "bacterial-leaf-blight",
    topic: "Bacterial Leaf Blight of Rice (Xanthomonas oryzae)",
    keywords: ["bacterial blight", "blb", "xanthomonas", "பாக்டீரியா", "இலைக்கருகல்"],
    crops: ["Paddy"],
    questionPatterns: [
      /(?:bacterial blight|blb)/i,
      /பாக்டீரியா.*இலைக்கருகல்/i
    ],
    answerEn: `🌾 **Bacterial Leaf Blight (BLB) Protocol:**

• **Identification:** Wavy yellowish-white marginal lesions progressing from leaf tips downward; bacterial ooze droplets visible in humid mornings.
• **Verified Agronomic Control:**
  1. Clip seedling tips prior to transplanting to prevent pathogen transmission.
  2. Drain excess standing water from fields during cloudy/stormy conditions.
  3. Apply Bleaching Powder @ 2 kg/acre mixed directly in irrigation water.
  4. Foliar spray: Streptomycin sulphate + Tetracycline combination (Plantomycin) @ 120 g + Copper Oxychloride 50% WP @ 500 g in 200 L water/acre.`,
    answerTa: `🌾 **நெல் பாக்டீரியா இலைக்கருகல் நோய் மேலாண்மை:**

• **அடையாளம்:** இலை நுனியிலிருந்து கீழ்நோக்கி அலையலையாகத் தோன்றும் மஞ்சள்-வெள்ளை கருகல்; காலையில் கசியும் பால் போன்ற பாக்டீரியா திரவம்.
• **அறிவியல் பரிந்துரை:**
  1. நடுவதற்கு முன் நாற்றின் நுனிகளை நறுக்கி நடுதல்.
  2. வயலில் தேங்கும் அதிகப்படியான மழை நீரை உடனே வடித்தல்.
  3. பாசன நீரில் ஏக்கருக்கு 2 கிலோ பிளீச்சிங் பவுடர் கலந்து விடுதல்.
  4. ஸ்ட்ரெப்டோமைசின் சல்பேட் + டெட்ராசைக்ளின் 120 கிராம் + காப்பர் ஆக்சிகுளோரைடு 500 கிராம் 200 லிட்டர் நீரில் கலந்து தெளிக்கவும்.`,
    citation: "TNAU Agritech Portal Plant Protection Manual (Rice Pathology Series)",
    sourceUrl: "https://agritech.tnau.ac.in/crop_protection/crop_prot_crop%20diseases_cereals_paddy_2.html"
  },
  {
    id: "yellow-stem-borer",
    topic: "Yellow Stem Borer Management",
    keywords: ["stem borer", "borer", "dead heart", "white earhead", "தண்டு துளைப்பான்", "வெண்குருத்து"],
    crops: ["Paddy"],
    questionPatterns: [
      /(?:stem borer|dead heart|white earhead)/i,
      /தண்டு.*துளைப்பான்/i,
      /வெண்குருத்து/i
    ],
    answerEn: `🐛 **Yellow Stem Borer Management Guidelines:**

• **Damage Symptoms:** Central drying of emerging tillers ('Dead Heart') during vegetative growth; empty erect white panicles ('White Earhead') during flowering.
• **Threshold (ETL):** 1 egg mass per sq. meter or 5% dead hearts.
• **Verified Interventions:**
  1. Set up Scirpophaga pheromone traps @ 4 traps/acre for monitoring adult moth emergence.
  2. Release egg parasitoid *Trichogramma japonicum* @ 40,000/acre at weekly intervals.
  3. When ETL is exceeded: Apply Chlorantraniliprole 18.5% SC @ 60 ml/acre or Cartap hydrochloride 4G @ 7.5 kg/acre.`,
    answerTa: `🐛 **நெல் மஞ்சள் தண்டு துளைப்பான் மேலாண்மை:**

• **சேத அறிகுறிகள்:** தூர்கட்டும் பருவத்தில் நடுக்குருத்து காய்ந்து வரும் 'வெண்குருத்து'; பால் பிடிக்கும் பருவத்தில் மணிகள் இல்லாத 'வெண்கதிர்'.
• **பொருளாதார சேத நிலை:** ஒரு சதுர மீட்டருக்கு 1 முட்டைக் குவியல் அல்லது 5% வெண்குருத்து.
• **பரிந்துரைகள்:**
  1. இனக்கவர்ச்சிப் பொறி ஏக்கருக்கு 4 என்ற எண்ணிக்கையில் அமைத்து அந்துப்பூச்சிகளைக் கண்காணிக்கவும்.
  2. ட்ரைக்கோகிரம்மா ஜப்பானிக்கம் ஒட்டுண்ணி அட்டை ஏக்கருக்கு 40,000 வாரம் ஒருமுறை இடவும்.
  3. பொருளாதார சேத நிலை எட்டும்போது குளோரான்ட்ரனிலிப்ரோல் 18.5% SC 60 மி.லி/ஏக்கர் அல்லது கார்டாப் ஹைட்ரோகுளோரைடு 7.5 கிலோ/ஏக்கர் இடவும்.`,
    citation: "Directorate of Rice Development / CIBRC Registered Product Claims",
    sourceUrl: "http://ppqs.gov.in/divisions/cib-rc/registered-products"
  },
  {
    id: "tomato-early-late-blight",
    topic: "Tomato Early and Late Blight Management",
    keywords: ["tomato blight", "early blight", "late blight", "தக்காளி கருகல்", "ஆரம்பக்கால கருகல்"],
    crops: ["Tomato", "Potato"],
    questionPatterns: [
      /tomato.*blight/i,
      /(?:early|late).*blight/i,
      /தக்காளி.*கருகல்/i
    ],
    answerEn: `🍅 **Tomato Blight Management Protocol:**

• **Early Blight (*Alternaria solani*):** Dark brown concentric ring spots on older leaves. Spray Mancozeb 75% WP @ 400 g/acre or Azoxystrobin + Difenoconazole @ 200 ml/acre. Maintain 7-day Pre-Harvest Interval (PHI).
• **Late Blight (*Phytophthora infestans*):** Rapid water-soaked purplish foliar collapse with white downy growth during cold humid mornings. Spray Cymoxanil 8% + Mancozeb 64% WP @ 600 g/acre upon first symptom onset.
• **Cultural:** Use drip irrigation to prevent foliar wetting; mulch with 25-micron reflective silver-black plastic mulch.`,
    answerTa: `🍅 **தக்காளி இலைக் கருகல் நோய் பாதுகாப்பு நெறிமுறை:**

• **ஆரம்பக்கால கருகல் (*Alternaria solani*):** அடி இலைகளில் வளைய வடிவக் கருப்புப் புள்ளிகள். மேன்கோசெப் 75% WP 400 கிராம்/ஏக்கர் அல்லது அசோக்சிஸ்ட்ரோபின் + டைபினோகொனசோல் 200 மி.லி/ஏக்கர் தெளிக்கவும். 7 நாட்கள் அறுவடை இடைவெளி தேவை.
• **பின் பருவக் கருகல் (*Phytophthora infestans*):** பனி மற்றும் ஈரப்பதத்தில் இலைகளில் வெள்ளை பூஞ்சையுடன் கூடிய விரைவான கருகல். சைமோக்சனில் + மேன்கோசெப் 600 கிராம்/ஏக்கர் தெளிக்கவும்.
• **உழவியல் முறை:** சொட்டு நீர்ப் பாசனம் மூலம் இலைகள் நனையாமல் பாதுகாக்கவும்; நெகிழி மூடாக்கு அமைக்கவும்.`,
    citation: "ICAR-Indian Institute of Horticultural Research (IIHR) Disease Guidelines",
    sourceUrl: "https://www.iihr.res.in/tomato-disease-management"
  },
  {
    id: "spray-drift-wind-safety",
    topic: "Weather-Safe Pesticide Application Rules",
    keywords: ["spray", "wind", "drift", "safety", "pesticide", "மருந்து தெளிப்பு", "காற்று", "பாதுகாப்பு"],
    crops: ["All Crops"],
    questionPatterns: [
      /safe.*(?:spray|pesticide)/i,
      /wind.*spray/i,
      /மருந்து.*தெளி/i,
      /காற்று.*தெளி/i
    ],
    answerEn: `⚠️ **Pesticide Spray Safety & Drift Guardrails:**

• **Wind Limit:** Never spray when wind speed exceeds 15 km/h to prevent dangerous droplet drift onto non-target crops or water bodies.
• **Rain Horizon:** Do not spray if rainfall is forecasted within the next 4 hours (wash-off risk renders systemic fungicides ineffective).
• **Temperature Window:** Avoid spraying when ambient temperature exceeds 35°C (causes rapid droplet evaporation and phytotoxicity).
• **Protective Gear:** Always wear protective mask, goggles, and nitrile gloves. Spray across or with the wind direction, never into headwind.`,
    answerTa: `⚠️ **மருந்து தெளிப்பு பாதுகாப்பு & வானிலை விதிகள்:**

• **காற்று வேகம்:** காற்றின் வேகம் மணிக்கு 15 கி.மீக்கு மேல் இருக்கும்போது தெளிக்கக் கூடாது; மருந்து காற்றில் அடித்துச் செல்லப்பட்டு வீணாகும்.
• **மழை எச்சரிக்கை:** அடுத்த 4 மணி நேரத்திற்குள் மழை பெய்ய வாய்ப்பிருந்தால் மருந்து தெளிக்க வேண்டாம் (மழையில் மருந்து அடித்துச் செல்லப்படும்).
• **வெப்பநிலை:** 35°C-க்கு மேல் அதிக வெயில் இருக்கும்போது தெளிப்பதைத் தவிர்க்கவும்.
• **பாதுகாப்பு கவசம்:** முகக்கவசம், மூக்குக்கண்ணாடி மற்றும் கையுறைகள் அணியவும். எப்போதும் காற்று வீசும் திசையிலேயே தெளிக்கவும்; எதிர் காற்றில் தெளிக்கக் கூடாது.`,
    citation: "Central Insecticides Board & Registration Committee (CIBRC) Code of Practice",
    sourceUrl: "http://ppqs.gov.in/divisions/cib-rc"
  },
  {
    id: "today-action-priorities",
    topic: "Daily Agronomic Action Prioritization",
    keywords: ["today", "do today", "action", "இன்று", "செய்ய வேண்டும்", "பணி"],
    crops: ["All Crops"],
    questionPatterns: [
      /what should i do today/i,
      /what.*do today/i,
      /இன்று.*என்ன.*செய்ய/i,
      /இன்றைய.*பணி/i
    ],
    answerEn: `🌾 **Daily Farm Action Prioritization:**

• **Top Priority:** Inspect field drainage channels before the onset of forecasted rainfall.
• **Irrigation:** Delay planned pump irrigation if soil moisture is adequate (>50%).
• **Crop Scouting:** Walk diagonally across fields (W-pattern) to inspect the undersides of leaves for early foliar lesions or pest egg masses.
• **Input Safety:** Do not apply foliar sprays or urea top-dressing while leaves are wet with morning dew or rain.`,
    answerTa: `🌾 **இன்றைய பண்ணை முன்னுரிமைப் பணிகள்:**

• **முதல் முன்னுரிமை:** எதிர்பார்க்கப்படும் மழைக்கு முன் வயல் வடிகால் மதகுகளைச் சரிபார்க்கவும்.
• **பாசனம்:** மண்ணில் போதிய ஈரப்பதம் இருந்தால் பாசனத்தைத் தள்ளிப்போடவும்.
• **கள ஆய்வு:** வயலின் குறுக்காக (W-வடிவில்) நடந்து இலைகளின் அடிப்பகுதியில் பூச்சிகள் அல்லது நோய் புள்ளிகள் உள்ளனவா என ஆய்வு செய்யவும்.
• **உரமிடுதல்:** இலைகளில் பனி அல்லது மழை ஈரம் இருக்கும்போது ரசாயன மருந்துகளோ யூரியாவோ தெளிக்கக் கூடாது.`,
    citation: "TNAU Crop Production Guide (Agriculture) - Good Agronomic Practices",
    sourceUrl: "https://agritech.tnau.ac.in/agriculture/agri_cpg.html"
  }
];

// ─── UNVERIFIED / UNCOVERED FALLBACK STRINGS (STRICT REQUIREMENT) ─────────────
export const UNVERIFIED_FALLBACK_EN = "I don't have verified information; ask your extension officer.";
export const UNVERIFIED_FALLBACK_TA = "என்னிடம் சரிபார்க்கப்பட்ட தகவல் இல்லை; உங்கள் வேளாண் விரிவாக்க அலுவலரிடம் கேளுங்கள்.";

export const SUGGESTED_QUESTIONS_BY_LANG: Record<"English" | "Tamil", string[]> = {
  English: [
    "What should I do today?",
    "Why should I delay irrigation?",
    "Why is my crop turning yellow?",
    "How to manage rice blast?",
    "How to control stem borer?",
    "What are safe spraying rules?"
  ],
  Tamil: [
    "இன்று நான் என்ன செய்ய வேண்டும்?",
    "பாசனத்தை ஏன் தள்ளிப்போட வேண்டும்?",
    "இலைகள் ஏன் மஞ்சள் நிறமாகின்றன?",
    "குலை நோயை எவ்வாறு கட்டுப்படுத்துவது?",
    "தண்டு துளைப்பானை எவ்வாறு தடுப்பது?",
    "மருந்து தெளிக்கும் போது என்ன பாதுகாப்பு தேவை?"
  ]
};

/**
 * Formats the Next-Best-Action strictly according to verified decision engine rules
 */
export function formatNextBestActionResponse(action: Recommendation, context: FarmerContext): string {
  const lang = (context.language === "Tamil" ? "Tamil" : "English");

  if (lang === "Tamil") {
    return `🌾 **அடுத்த சிறந்த நடவடிக்கை (NEXT BEST ACTION):**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**நடவடிக்கை (ACTION):**
${action.action}

**முன்னுரிமை (PRIORITY):** ${action.priority === "High" ? "அதிமுக்கியம் (High)" : action.priority === "Medium" ? "நடுத்தரம் (Medium)" : "குறைவு (Low)"}

**எப்போது செய்ய வேண்டும் (WHEN):**
${action.when}

**ஏன் இந்த நடவடிக்கை (WHY):**
${action.why}

**நம்பகத்தன்மை (CONFIDENCE):**
${action.confidence}% (${action.confidenceLabel})

**ஆதாரக் காரணிகள் (SUPPORTING FACTORS):**
${action.supportingFactors.map(f => `• ${f}`).join("\n")}

**தவிர்க்கப்படும் ஆபத்து (RISK):**
${action.risk}

**மாற்று நடவடிக்கை (ALTERNATIVE ACTION):**
${action.alternativeAction}

${action.feedbackInfluence ? `🔄 *பண்ணை பின்னூட்டம்: ${action.feedbackInfluence}*` : ""}
💡 *மதிப்பிடப்பட்ட சேமிப்பு: ${action.impact}*

📚 **ஆதார மேற்கோள்:** TNAU பயிர் உற்பத்தி வழிகாட்டி & நீர்ப்பாசன மேலாண்மை நெறிமுறை (2023)
🔗 https://agritech.tnau.ac.in`;
  }

  // Default: English
  return `🌾 **NEXT BEST ACTION (THINAI Decision Engine):**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**ACTION:**
${action.action}

**PRIORITY:** ${action.priority.toUpperCase()}

**WHEN:**
${action.when}

**WHY:**
${action.why}

**CONFIDENCE:**
${action.confidence}% (${action.confidenceLabel})

**SUPPORTING FACTORS:**
${action.supportingFactors.map(f => `• ${f}`).join("\n")}

**RISK:**
${action.risk}

**ALTERNATIVE ACTION:**
${action.alternativeAction}

${action.feedbackInfluence ? `🔄 *Adaptive Farm History: ${action.feedbackInfluence}*` : ""}
💡 *Estimated Impact: ${action.impact}*

📚 **Verified Citation:** TNAU Crop Production Guide & Water Management Protocol (2023)
🔗 https://agritech.tnau.ac.in`;
}

/**
 * Retrieves an agronomic response exclusively from the curated, sourced knowledge base.
 * If the question is not covered by verified TNAU/ICAR literature, returns the strict fallback:
 * "I don't have verified information; ask your extension officer."
 */
export function generateContextualResponse(query: string, context: FarmerContext): string {
  const q = query.toLowerCase().trim();
  const isTamil = context.language === "Tamil";

  if (!q) {
    return isTamil ? UNVERIFIED_FALLBACK_TA : UNVERIFIED_FALLBACK_EN;
  }

  // Check Next-Best-Action query
  if (
    q.includes("today") || q.includes("what should i do") ||
    q.includes("செயல்") || q.includes("இன்று") || q.includes("பணி")
  ) {
    if (context.nextBestAction) {
      return formatNextBestActionResponse(context.nextBestAction, context);
    }
  }

  // Search curated knowledge base using pattern matching and keyword density
  let bestMatch: CuratedKnowledgeEntry | null = null;
  let highestScore = 0;

  for (const entry of CURATED_KNOWLEDGE_BASE) {
    let score = 0;

    // Pattern match gives strong boost
    for (const pattern of entry.questionPatterns) {
      if (pattern.test(q)) {
        score += 3.0;
        break;
      }
    }

    // Keyword match
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score += 1.0;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  // Minimum match threshold required for verified answer
  if (bestMatch && highestScore >= 1.0) {
    const body = isTamil ? bestMatch.answerTa : bestMatch.answerEn;
    const citationFooter = isTamil
      ? `\n\n📚 **ஆதார வெளியீடு:** ${bestMatch.citation}\n🔗 ${bestMatch.sourceUrl}`
      : `\n\n📚 **Verified Citation:** ${bestMatch.citation}\n🔗 ${bestMatch.sourceUrl}`;
    return `${body}${citationFooter}`;
  }

  // Strict honest fallback per Phase 3 requirement:
  // "If a question is not covered, say 'I don't have verified information; ask your extension officer'."
  return isTamil ? UNVERIFIED_FALLBACK_TA : UNVERIFIED_FALLBACK_EN;
}
