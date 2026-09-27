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
    onError(event.error);
  };

  recognition.onend = () => {
    onEnd();
  };

  return {
    start: () => {
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
