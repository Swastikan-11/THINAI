// THINAI Multilingual Architecture (Step 2)
// Supporting English (Default) and the 22 Scheduled Languages of India
// Enforces strict safety rules: chemical remedies displayed only in REVIEWED languages.

import statusData from "../../locales/status.json";
import glossaryData from "../../locales/glossary.json";
import asLocale from "../../locales/as.json";
import bnLocale from "../../locales/bn.json";
import brxLocale from "../../locales/brx.json";
import doiLocale from "../../locales/doi.json";
import enLocale from "../../locales/en.json";
import guLocale from "../../locales/gu.json";
import hiLocale from "../../locales/hi.json";
import knLocale from "../../locales/kn.json";
import kokLocale from "../../locales/kok.json";
import ksLocale from "../../locales/ks.json";
import maiLocale from "../../locales/mai.json";
import mlLocale from "../../locales/ml.json";
import mniLocale from "../../locales/mni.json";
import mrLocale from "../../locales/mr.json";
import neLocale from "../../locales/ne.json";
import orLocale from "../../locales/or.json";
import paLocale from "../../locales/pa.json";
import saLocale from "../../locales/sa.json";
import satLocale from "../../locales/sat.json";
import sdLocale from "../../locales/sd.json";
import taLocale from "../../locales/ta.json";
import teLocale from "../../locales/te.json";
import urLocale from "../../locales/ur.json";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firestoreDb } from "../firebase";
import { db } from "./db";

export type AppLanguage =
  | "English"
  | "Assamese"
  | "Bengali"
  | "Bodo"
  | "Dogri"
  | "Gujarati"
  | "Hindi"
  | "Kannada"
  | "Kashmiri"
  | "Konkani"
  | "Maithili"
  | "Malayalam"
  | "Manipuri"
  | "Marathi"
  | "Nepali"
  | "Odia"
  | "Punjabi"
  | "Sanskrit"
  | "Santali"
  | "Sindhi"
  | "Tamil"
  | "Telugu"
  | "Urdu";

export type LanguageCode =
  | "en"
  | "as"
  | "bn"
  | "brx"
  | "doi"
  | "gu"
  | "hi"
  | "kn"
  | "ks"
  | "kok"
  | "mai"
  | "ml"
  | "mni"
  | "mr"
  | "ne"
  | "or"
  | "pa"
  | "sa"
  | "sat"
  | "sd"
  | "ta"
  | "te"
  | "ur";

export interface LanguageOption {
  code: LanguageCode;
  name: AppLanguage;
  nativeName: string;
  script: string;
  rtl: boolean;
  speechLocale: string;
  speechSupported: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", script: "Latin", rtl: false, speechLocale: "en-IN", speechSupported: true },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া (Assamese)", script: "Bengali-Assamese", rtl: false, speechLocale: "as-IN", speechSupported: false },
  { code: "bn", name: "Bengali", nativeName: "বাংলা (Bengali)", script: "Bengali", rtl: false, speechLocale: "bn-IN", speechSupported: true },
  { code: "brx", name: "Bodo", nativeName: "बर' (Bodo)", script: "Devanagari", rtl: false, speechLocale: "brx-IN", speechSupported: false },
  { code: "doi", name: "Dogri", nativeName: "डोगरी (Dogri)", script: "Devanagari", rtl: false, speechLocale: "doi-IN", speechSupported: false },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી (Gujarati)", script: "Gujarati", rtl: false, speechLocale: "gu-IN", speechSupported: true },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी (Hindi)", script: "Devanagari", rtl: false, speechLocale: "hi-IN", speechSupported: true },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ (Kannada)", script: "Kannada", rtl: false, speechLocale: "kn-IN", speechSupported: true },
  { code: "ks", name: "Kashmiri", nativeName: "کٲشُر (Kashmiri)", script: "Perso-Arabic", rtl: true, speechLocale: "ks-IN", speechSupported: false },
  { code: "kok", name: "Konkani", nativeName: "कोंकणी (Konkani)", script: "Devanagari", rtl: false, speechLocale: "kok-IN", speechSupported: false },
  { code: "mai", name: "Maithili", nativeName: "मैथिली (Maithili)", script: "Devanagari", rtl: false, speechLocale: "mai-IN", speechSupported: false },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം (Malayalam)", script: "Malayalam", rtl: false, speechLocale: "ml-IN", speechSupported: true },
  { code: "mni", name: "Manipuri", nativeName: "মৈতৈলোন্ (Manipuri)", script: "Bengali", rtl: false, speechLocale: "mni-IN", speechSupported: false },
  { code: "mr", name: "Marathi", nativeName: "मराठी (Marathi)", script: "Devanagari", rtl: false, speechLocale: "mr-IN", speechSupported: true },
  { code: "ne", name: "Nepali", nativeName: "नेपाली (Nepali)", script: "Devanagari", rtl: false, speechLocale: "ne-IN", speechSupported: false },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ (Odia)", script: "Odia", rtl: false, speechLocale: "or-IN", speechSupported: false },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ (Punjabi)", script: "Gurmukhi", rtl: false, speechLocale: "pa-IN", speechSupported: true },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम् (Sanskrit)", script: "Devanagari", rtl: false, speechLocale: "sa-IN", speechSupported: false },
  { code: "sat", name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ (Santali)", script: "Ol Chiki", rtl: false, speechLocale: "sat-IN", speechSupported: false },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي (Sindhi)", script: "Perso-Arabic", rtl: true, speechLocale: "sd-IN", speechSupported: false },
  { code: "ta", name: "Tamil", nativeName: "தமிழ் (Tamil)", script: "Tamil", rtl: false, speechLocale: "ta-IN", speechSupported: true },
  { code: "te", name: "Telugu", nativeName: "తెలుగు (Telugu)", script: "Telugu", rtl: false, speechLocale: "te-IN", speechSupported: true },
  { code: "ur", name: "Urdu", nativeName: "اُردُو (Urdu)", script: "Perso-Arabic", rtl: true, speechLocale: "ur-IN", speechSupported: true }
];

export const UNREVIEWED_LANGUAGES: LanguageOption[] = SUPPORTED_LANGUAGES.filter(
  (l) => l.name !== "English"
);

export const RTL_LANGUAGE_CODES: LanguageCode[] = ["ur", "ks", "sd"];

const STORAGE_KEY = "thinai_selected_language";

// Memory cache for lazy-loaded locales
const LOCALE_CACHE: Record<string, any> = {
  as: asLocale,
  bn: bnLocale,
  brx: brxLocale,
  doi: doiLocale,
  en: enLocale,
  gu: guLocale,
  hi: hiLocale,
  kn: knLocale,
  kok: kokLocale,
  ks: ksLocale,
  mai: maiLocale,
  ml: mlLocale,
  mni: mniLocale,
  mr: mrLocale,
  ne: neLocale,
  or: orLocale,
  pa: paLocale,
  sa: saLocale,
  sat: satLocale,
  sd: sdLocale,
  ta: taLocale,
  te: teLocale,
  ur: urLocale
};

export function getLanguageCode(lang: AppLanguage): LanguageCode {
  const opt = SUPPORTED_LANGUAGES.find((l) => l.name === lang);
  return opt ? opt.code : "en";
}

export function getLanguageOption(lang: AppLanguage): LanguageOption {
  return SUPPORTED_LANGUAGES.find((l) => l.name === lang) || SUPPORTED_LANGUAGES[0];
}

/**
 * Gets currently persisted language or default "English"
 */
export function getPersistedLanguage(): AppLanguage {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.name === saved)) {
        return saved as AppLanguage;
      }
    }
  } catch {}
  return "English";
}

/**
 * Applies RTL/LTR direction and lang attribute to document HTML root
 */
export function applyLanguageDirection(lang: AppLanguage): void {
  if (typeof document === "undefined") return;
  const opt = getLanguageOption(lang);
  const isRtl = opt.rtl;
  document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", opt.code);
}

/**
 * Persists chosen language in local storage and updates document layout direction
 */
export function persistLanguage(lang: AppLanguage): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  } catch {}
  applyLanguageDirection(lang);
}

/**
 * Retrieves translation review status from locales/status.json
 */
export function getLanguageReviewStatus(lang: AppLanguage): {
  status: "REVIEWED" | "MACHINE-DRAFT" | "INCOMPLETE";
  reviewer: string | null;
  reviewDate: string | null;
} {
  const code = getLanguageCode(lang);
  const entry = (statusData as any)[code];
  if (entry) {
    return entry;
  }
  return { status: "MACHINE-DRAFT", reviewer: null, reviewDate: null };
}

/**
 * Returns true ONLY if the language has been reviewed by a named expert
 */
export function isLanguageReviewed(lang: AppLanguage): boolean {
  const { status } = getLanguageReviewStatus(lang);
  return status === "REVIEWED";
}

/**
 * SAFETY RULE: Remedy names, doses, spray intervals, and chemical advice
 * appear ONLY in languages with status REVIEWED. In other languages, show in English
 * with the mandatory unreviewed translation notice.
 */
export function getSafeRemedies(
  remedies: string[],
  lang: AppLanguage = "English"
): {
  treatments: string[];
  notice?: string;
  isEnglishFallback: boolean;
} {
  const reviewed = isLanguageReviewed(lang);
  if (reviewed) {
    return {
      treatments: remedies,
      isEnglishFallback: false
    };
  }

  return {
    treatments: remedies,
    isEnglishFallback: true,
    notice: t("safety.unreviewedAdviceNotice", lang)
  };
}

/**
 * Retrieves localized crop name from official glossary if available
 */
export function getLocalizedCropName(cropId: string, lang: AppLanguage = "English"): string {
  const code = getLanguageCode(lang);
  const glossary = (glossaryData as any).crops;
  const entry = glossary?.[cropId.toLowerCase()];
  if (entry && entry[code]) {
    return entry[code];
  }
  return entry?.en || cropId;
}

/**
 * Central Translation Function: resolves nested keys (e.g. "doctor.selectCropTitle")
 * or flat legacy keys with automatic fallback to English and parameter interpolation.
 */
export function t(key: string, language: AppLanguage = "English", params?: Record<string, any>): string {
  const code = getLanguageCode(language);
  const locale = LOCALE_CACHE[code] || LOCALE_CACHE.en || enLocale;

  let value: any = undefined;

  // 1. Nested namespace resolution (e.g. "doctor.takePhoto")
  if (key.includes(".")) {
    const parts = key.split(".");
    let curr = locale;
    for (const part of parts) {
      if (curr && typeof curr === "object" && part in curr) {
        curr = curr[part];
      } else {
        curr = undefined;
        break;
      }
    }
    value = curr;

    // Fallback to English nested
    if (value === undefined && code !== "en") {
      let currEn: any = LOCALE_CACHE.en;
      for (const part of parts) {
        if (currEn && typeof currEn === "object" && part in currEn) {
          currEn = currEn[part];
        } else {
          currEn = undefined;
          break;
        }
      }
      value = currEn;
    }
  }

  // 2. Flat key resolution fallback
  if (value === undefined) {
    value = locale[key];
    if (value === undefined && code !== "en") {
      value = LOCALE_CACHE.en[key];
    }
  }

  // 3. Fallback to key itself
  if (value === undefined || typeof value !== "string") {
    value = key;
  }

  // 4. Parameter interpolation (e.g. {{name}}, {{count}})
  if (params && typeof value === "string") {
    for (const paramKey of Object.keys(params)) {
      value = value.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, "g"), String(params[paramKey]));
    }
  }

  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTL NUMBER, CURRENCY, AND DATE FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, lang: AppLanguage = "English"): string {
  const opt = getLanguageOption(lang);
  try {
    return new Intl.NumberFormat(opt.code === "en" ? "en-IN" : `${opt.code}-IN`, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString()}`;
  }
}

export function formatNumber(num: number, lang: AppLanguage = "English"): string {
  const opt = getLanguageOption(lang);
  try {
    return new Intl.NumberFormat(opt.code === "en" ? "en-IN" : `${opt.code}-IN`).format(num);
  } catch {
    return num.toLocaleString();
  }
}

export function formatDate(date: string | Date, lang: AppLanguage = "English"): string {
  const opt = getLanguageOption(lang);
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(opt.code === "en" ? "en-IN" : `${opt.code}-IN`, {
      dateStyle: "medium"
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSLATION ERROR REPORTING PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

export interface TranslationErrorReport {
  screenKey: string;
  language: AppLanguage;
  currentText: string;
  suggestedCorrection: string;
  notes?: string;
  timestamp: string;
}

export async function submitTranslationErrorReport(report: Omit<TranslationErrorReport, "timestamp">): Promise<boolean> {
  const fullReport: TranslationErrorReport = {
    ...report,
    timestamp: new Date().toISOString()
  };

  try {
    // 1. Save to local Dexie queue
    await db.feedbacks.add({
      id: `trans-report-${Date.now()}`,
      userId: "local-user",
      recommendationId: report.screenKey,
      actionTaken: "modified",
      rating: 3,
      cropObservation: `Translation Error in ${report.language}: "${report.currentText}" -> "${report.suggestedCorrection}"`,
      notes: report.notes,
      recordedAt: fullReport.timestamp,
      pendingSync: true,
      synced: false
    });

    // 2. Save to Firestore if online
    try {
      const reportsRef = collection(firestoreDb, "translation_reports");
      await addDoc(reportsRef, {
        ...fullReport,
        serverTimestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore translation report save skipped/offline:", e);
    }

    return true;
  } catch (err) {
    console.error("Failed to submit translation report:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKWARD-COMPATIBILITY EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

function extractFlatStrings(locale: Record<string, any>): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [key, val] of Object.entries(locale)) {
    if (typeof val === "string") {
      flat[key] = val;
    }
  }
  return flat;
}

export const I18N_STRINGS: Record<string, Record<string, string>> = {
  English: extractFlatStrings(enLocale),
  Assamese: extractFlatStrings(asLocale),
  Bengali: extractFlatStrings(bnLocale),
  Bodo: extractFlatStrings(brxLocale),
  Dogri: extractFlatStrings(doiLocale),
  Gujarati: extractFlatStrings(guLocale),
  Hindi: extractFlatStrings(hiLocale),
  Kannada: extractFlatStrings(knLocale),
  Kashmiri: extractFlatStrings(ksLocale),
  Konkani: extractFlatStrings(kokLocale),
  Maithili: extractFlatStrings(maiLocale),
  Malayalam: extractFlatStrings(mlLocale),
  Manipuri: extractFlatStrings(mniLocale),
  Marathi: extractFlatStrings(mrLocale),
  Nepali: extractFlatStrings(neLocale),
  Odia: extractFlatStrings(orLocale),
  Punjabi: extractFlatStrings(paLocale),
  Sanskrit: extractFlatStrings(saLocale),
  Santali: extractFlatStrings(satLocale),
  Sindhi: extractFlatStrings(sdLocale),
  Tamil: extractFlatStrings(taLocale),
  Telugu: extractFlatStrings(teLocale),
  Urdu: extractFlatStrings(urLocale)
};
