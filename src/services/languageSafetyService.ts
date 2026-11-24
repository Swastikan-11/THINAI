// THINAI Language Safety Gating Service
// Enforces human verification gates on safety-critical agronomic content
// (chemical doses, waiting periods, PPE protocols, toxicological warnings).
//
// SAFETY RULE: Machine-translated chemical dosages are strictly prohibited.
// If a language's safety content is unverified, fallback to English/Tamil with prominent warnings.

import languageReviewData from "../data/languageReviewStatus.json";

export type TranslationStatus = "HUMAN_VERIFIED" | "MACHINE_DRAFT" | "PARTIALLY_VERIFIED";

export interface LanguageReviewEntry {
  languageCode: string;
  languageName: string;
  translationStatus: TranslationStatus;
  safetyContentVerified: boolean;
  reviewer: string | null;
  lastReviewedDate: string | null;
  fallbackLanguage: string;
}

const registry: LanguageReviewEntry[] = languageReviewData as LanguageReviewEntry[];

export const UNVERIFIED_SAFETY_NOTICE =
  "Safety-critical instructions are available in English/Tamil. Please contact an extension officer before using any pesticide.";

export const UNVERIFIED_SAFETY_NOTICE_TA =
  "பாதுகாப்பான மருந்தளவு வழிமுறைகள் ஆங்கிலம்/தமிழில் உள்ளன. பூச்சிக்கொல்லிகளைப் பயன்படுத்தும் முன் வேளாண் அலுவலரை அணுகவும்.";

/**
 * Normalizes language name or ISO code to a registry entry.
 */
export function getLanguageReviewStatus(langInput: string): LanguageReviewEntry {
  const normalized = (langInput || "en").trim().toLowerCase();
  
  const found = registry.find(
    (l) => l.languageCode.toLowerCase() === normalized || l.languageName.toLowerCase() === normalized
  );

  if (found) return found;

  // Unknown language defaults to machine draft with English fallback
  return {
    languageCode: normalized,
    languageName: langInput,
    translationStatus: "MACHINE_DRAFT",
    safetyContentVerified: false,
    reviewer: null,
    lastReviewedDate: null,
    fallbackLanguage: "en",
  };
}

/**
 * Checks whether safety content is verified for a given language.
 */
export function isSafetyContentVerified(langInput: string): boolean {
  return getLanguageReviewStatus(langInput).safetyContentVerified;
}

export interface SafetyGatedResult<T> {
  allowed: boolean;
  content: T;
  fallbackUsed: boolean;
  notice: string | null;
  badge: {
    status: TranslationStatus;
    label: string;
    safetyVerified: boolean;
    color: "green" | "amber" | "rose";
  };
}

/**
 * Gates safety-critical content (e.g. pesticide doses, PPE, emergency protocols).
 * If safety content is unverified for the selected language, the active content is replaced
 * with verified fallbackContent (typically English or Tamil), and a prominent warning is returned.
 */
export function gateSafetyCriticalContent<T>(params: {
  content: T;
  fallbackContent: T;
  language: string;
  contentType: "chemical_dosage" | "waiting_period" | "ppe_instruction" | "emergency_protocol";
}): SafetyGatedResult<T> {
  const status = getLanguageReviewStatus(params.language);
  const isVerified = status.safetyContentVerified;

  let badgeColor: "green" | "amber" | "rose" = "green";
  let badgeLabel = "Safety Verified";

  if (status.translationStatus === "HUMAN_VERIFIED" && isVerified) {
    badgeColor = "green";
    badgeLabel = "Human Verified (Safety Approved)";
  } else if (status.translationStatus === "PARTIALLY_VERIFIED") {
    badgeColor = "amber";
    badgeLabel = "Partially Verified (Caution)";
  } else {
    badgeColor = "rose";
    badgeLabel = "Machine Draft (Dose Unverified)";
  }

  if (isVerified) {
    return {
      allowed: true,
      content: params.content,
      fallbackUsed: false,
      notice: null,
      badge: {
        status: status.translationStatus,
        label: badgeLabel,
        safetyVerified: true,
        color: badgeColor,
      },
    };
  }

  // Safety content NOT verified for this language:
  // Must fallback to verified English/Tamil content and return warning notice.
  return {
    allowed: false,
    content: params.fallbackContent,
    fallbackUsed: true,
    notice: UNVERIFIED_SAFETY_NOTICE,
    badge: {
      status: status.translationStatus,
      label: badgeLabel,
      safetyVerified: false,
      color: badgeColor,
    },
  };
}

/**
 * Returns a safety badge descriptor for UI rendering.
 */
export function getLanguageSafetyBadge(language: string): {
  text: string;
  isVerified: boolean;
  status: TranslationStatus;
  badgeClass: string;
} {
  const status = getLanguageReviewStatus(language);
  if (status.safetyContentVerified) {
    return {
      text: `${status.languageName}: Verified Human Translation`,
      isVerified: true,
      status: status.translationStatus,
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    };
  }
  return {
    text: `${status.languageName}: Machine Draft (Safety Instructions Default to English/Tamil)`,
    isVerified: false,
    status: status.translationStatus,
    badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
  };
}

/**
 * Returns all languages in the registry.
 */
export function getAllLanguageReviewEntries(): LanguageReviewEntry[] {
  return [...registry];
}
