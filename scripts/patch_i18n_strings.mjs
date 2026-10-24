import fs from "fs";

let code = fs.readFileSync("src/services/i18n.ts", "utf8");
code = code.replace(/\r\n/g, "\n");

// Add UNREVIEWED_LANGUAGES export after SUPPORTED_LANGUAGES
const supportedTarget = `export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", script: "Latin", rtl: false, speechLocale: "en-IN", speechSupported: true },`;

const supportedReplacement = `export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", script: "Latin", rtl: false, speechLocale: "en-IN", speechSupported: true },`;

// Find where SUPPORTED_LANGUAGES array ends
const supportedEnd = `  { code: "ur", name: "Urdu", nativeName: "اُردُو (Urdu)", script: "Perso-Arabic", rtl: true, speechLocale: "ur-IN", speechSupported: true }
];`;

const supportedEndWithUnreviewed = `  { code: "ur", name: "Urdu", nativeName: "اُردُو (Urdu)", script: "Perso-Arabic", rtl: true, speechLocale: "ur-IN", speechSupported: true }
];

export const UNREVIEWED_LANGUAGES: LanguageOption[] = SUPPORTED_LANGUAGES.filter(
  (l) => l.name !== "English"
);`;

code = code.replace(supportedEnd, supportedEndWithUnreviewed);

// Update I18N_STRINGS to extract flat strings
const oldI18nBlock = `export const I18N_STRINGS: Record<string, Record<string, string>> = {
  English: enLocale as any,
  Assamese: asLocale as any,
  Bengali: bnLocale as any,
  Bodo: brxLocale as any,
  Dogri: doiLocale as any,
  Gujarati: guLocale as any,
  Hindi: hiLocale as any,
  Kannada: knLocale as any,
  Kashmiri: ksLocale as any,
  Konkani: kokLocale as any,
  Maithili: maiLocale as any,
  Malayalam: mlLocale as any,
  Manipuri: mniLocale as any,
  Marathi: mrLocale as any,
  Nepali: neLocale as any,
  Odia: orLocale as any,
  Punjabi: paLocale as any,
  Sanskrit: saLocale as any,
  Santali: satLocale as any,
  Sindhi: sdLocale as any,
  Tamil: taLocale as any,
  Telugu: teLocale as any,
  Urdu: urLocale as any
};`;

const newI18nBlock = `function extractFlatStrings(locale: Record<string, any>): Record<string, string> {
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
};`;

if (!code.includes(oldI18nBlock)) {
  console.error("Could not find oldI18nBlock in i18n.ts");
  process.exit(1);
}

code = code.replace(oldI18nBlock, newI18nBlock);

fs.writeFileSync("src/services/i18n.ts", code, "utf8");
console.log("src/services/i18n.ts patched successfully!");
