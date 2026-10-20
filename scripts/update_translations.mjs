import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// 1. UPDATE src/services/i18n.ts
// ─────────────────────────────────────────────────────────────────────────────
const i18nPath = path.resolve("src/services/i18n.ts");
let i18nContent = fs.readFileSync(i18nPath, "utf-8");

// Replace SUPPORTED_LANGUAGES array to include all 6 regional languages
const oldSupported = `export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", speechLocale: "en-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechLocale: "ta-IN" },
];

// Unreviewed languages - Hidden from normal users until agronomist review
export const UNREVIEWED_LANGUAGES: LanguageOption[] = [
  { code: "hi", name: "Hindi", nativeName: "Hindi", speechLocale: "hi-IN" },
  { code: "te", name: "Telugu", nativeName: "Telugu", speechLocale: "te-IN" },
  { code: "kn", name: "Kannada", nativeName: "Kannada", speechLocale: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "Malayalam", speechLocale: "ml-IN" }
];`;

const newSupported = `export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", speechLocale: "en-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechLocale: "ta-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechLocale: "hi-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechLocale: "te-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechLocale: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechLocale: "ml-IN" }
];

export const UNREVIEWED_LANGUAGES: LanguageOption[] = [];`;

if (i18nContent.includes(oldSupported)) {
  i18nContent = i18nContent.replace(oldSupported, newSupported);
  console.log("Updated SUPPORTED_LANGUAGES in src/services/i18n.ts");
}

fs.writeFileSync(i18nPath, i18nContent, "utf-8");
console.log("Saved i18n.ts");
