// THINAI Voice Assistant Service
// Speech-to-Text (STT) and Text-to-Speech (TTS) supporting Tamil (ta-IN) & English (en-IN)

// Browser SpeechRecognition interface declaration
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export type SpeechLocale = "en-IN" | "ta-IN" | "hi-IN" | "te-IN" | "kn-IN" | "ml-IN";

export function createSpeechRecognizer(
  lang: SpeechLocale,
  onResult: (text: string, isFinal: boolean) => void,
  onError: (err: string) => void,
  onEnd: () => void
): { start: () => void; stop: () => void } | null {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechConstructor) return null;

  const recognition = new SpeechConstructor();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = lang;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let transcript = "";
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        isFinal = true;
      }
    }
    onResult(transcript, isFinal);
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === "network") {
      onError("Voice input requires internet or offline speech pack. Please type your question. • குரல் உள்ளீட்டிற்கு இணையம் தேவை. தட்டச்சு செய்யவும்.");
    } else {
      onError(event.error);
    }
  };

  recognition.onend = () => {
    onEnd();
  };

  return {
    start: () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        onError("Voice recognition requires internet or offline speech model. Please type your question. • குரல் அறிதலுக்கு இணைய இணைப்பு தேவை. தட்டச்சு செய்யவும்.");
        onEnd();
        return;
      }
      try {
        recognition.start();
      } catch (e) {
        console.warn("Speech recognition start warning:", e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (e) {
        console.warn("Speech recognition stop warning:", e);
      }
    }
  };
}

export function speakText(text: string, lang: SpeechLocale = "en-IN"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  // Clean markdown tags before speaking
  const clean = text.replace(/[*#_~`]/g, "");
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = lang;
  utterance.rate = 0.95; // Slightly slower for clarity
  utterance.pitch = 1.0;

  // Stop any ongoing speech
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// ─────────────────────────────────────────────────────────────────────────────
// APPROVED SAFETY SPEECH TEMPLATES (Phase 9 Localisation & Low-Literacy Support)
// Safety Rule: Safety-critical voice instructions MUST come strictly from
// human-verified templates. Unverified languages fall back to English/Tamil.
// ─────────────────────────────────────────────────────────────────────────────

export interface SafetySpeechTemplateParams {
  crop?: string;
  disease?: string;
  action?: string;
}

export const APPROVED_SAFETY_SPEECH_TEMPLATES = {
  TIER_1_CONFIDENT: {
    en: (p: SafetySpeechTemplateParams) =>
      `Tier 1: High confidence diagnosis. Crop: ${p.crop || "crop"}. Diagnosis: ${p.disease || "detected condition"}. Recommended Action: ${p.action || "cultural field sanitation"}. Follow cultural practices and monitor crop.`,
    ta: (p: SafetySpeechTemplateParams) =>
      `நிலை 1: உறுதியான நோய் கண்டறிதல். பயிர்: ${p.crop || "பயிர்"}. கண்டறியப்பட்ட நோய்: ${p.disease || "நோய்"}. பரிந்துரைக்கப்பட்ட நடவடிக்கை: ${p.action || "வயல் தூய்மை"}. இயற்கை உத்திகளைப் பின்பற்றி கண்காணிக்கவும்.`
  },
  TIER_2_MODERATE: {
    en: (p: SafetySpeechTemplateParams) =>
      `Tier 2: Moderate confidence diagnosis. Chemical treatments are withheld. Crop: ${p.crop || "crop"}. Suspected condition: ${p.disease || "condition"}. Recommended action: ${p.action || "monitor crop and use cultural sanitation"}.`,
    ta: (p: SafetySpeechTemplateParams) =>
      `நிலை 2: சாத்தியமான நோய், உறுதிப்படுத்தப்படவில்லை. ரசாயன மருந்துகள் தவிர்க்கவும். பயிர்: ${p.crop || "பயிர்"}. அறிகுறி: ${p.disease || "நோய்"}. இயற்கை உத்திகளைப் பின்பற்றவும்.`
  },
  TIER_3_INCONCLUSIVE: {
    en: (p: SafetySpeechTemplateParams) =>
      `Tier 3: Inconclusive scan for ${p.crop || "crop"}. Treatment cannot be recommended safely. Please consult your local extension officer or call 1800-180-1551.`,
    ta: (p: SafetySpeechTemplateParams) =>
      `நிலை 3: ${p.crop || "பயிர்"} பயிரில் தெளிவற்ற முடிவு. சிகிச்சை பரிந்துரைக்க முடியாது. வேளாண் அலுவலரை அணுகவும் அல்லது 1800-180-1551 என்ற எண்ணை அழைக்கவும்.`
  },
  UNVERIFIED_SAFETY_NOTICE: {
    en: () =>
      "Safety-critical instructions are available in English and Tamil. Please contact an extension officer before using any pesticide.",
    ta: () =>
      "பாதுகாப்பான மருந்தளவு வழிமுறைகள் ஆங்கிலம் மற்றும் தமிழில் உள்ளன. பூச்சிக்கொல்லிகளைப் பயன்படுத்தும் முன் வேளாண் அலுவலரை அணுகவும்."
  },
  WEATHER_HIGH_RISK: {
    en: (p: SafetySpeechTemplateParams) =>
      `High disease risk forecast for ${p.crop || "crop"}. Inspect field and consult officer. Do not spray during high winds.`,
    ta: (p: SafetySpeechTemplateParams) =>
      `${p.crop || "பயிர்"} பயிரில் அதிக நோய் அபாயம் கணிக்கப்பட்டுள்ளது. வயலை ஆய்வு செய்து அலுவலரை அணுகவும். பலத்த காற்றில் மருந்து தெளிக்க வேண்டாம்.`
  }
} as const;

export type SafetySpeechTemplateKey = keyof typeof APPROVED_SAFETY_SPEECH_TEMPLATES;

/**
 * Speaks an approved safety prompt. Only human-verified Tamil ('ta-IN') and English ('en-IN')
 * speech templates are used. Unverified languages safely fall back to English with clear logging.
 */
export function speakApprovedSafetyPrompt(
  templateKey: SafetySpeechTemplateKey,
  params: SafetySpeechTemplateParams = {},
  language: string = "English"
): { spokenText: string; languageUsed: "ta-IN" | "en-IN"; fallbackUsed: boolean } {
  const isTamil = language.trim().toLowerCase() === "tamil" || language.trim().toLowerCase() === "ta";
  const speechLang: "ta-IN" | "en-IN" = isTamil ? "ta-IN" : "en-IN";
  const fallbackUsed = !isTamil && language.trim().toLowerCase() !== "english" && language.trim().toLowerCase() !== "en";

  const templateObj = APPROVED_SAFETY_SPEECH_TEMPLATES[templateKey];
  const textGenerator = isTamil ? templateObj.ta : templateObj.en;
  const spokenText = textGenerator(params);

  speakText(spokenText, speechLang);

  return {
    spokenText,
    languageUsed: speechLang,
    fallbackUsed
  };
}
