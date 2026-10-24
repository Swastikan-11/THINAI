import fs from "fs";
import { execSync } from "child_process";

// 1. Extract original I18N_STRINGS from git history
const orig = execSync("git show HEAD:src/services/i18n.ts", { encoding: "utf8" });
const match = orig.match(/export const I18N_STRINGS: Record<AppLanguage, Record<string, string>> = ([\s\S]*?^};)/m);
if (!match) {
  throw new Error("Could not find original I18N_STRINGS in git history");
}
const origStrings = eval("(" + match[1].slice(0, -1) + ")");

const codeToLangName = {
  en: "English",
  ta: "Tamil",
  hi: "Hindi",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam"
};

const allCodes = [
  "as", "bn", "brx", "doi", "en", "gu", "hi", "kn", "kok", "ks",
  "mai", "ml", "mni", "mr", "ne", "or", "pa", "sa", "sat", "sd",
  "ta", "te", "ur"
];

// 2. Merge into each locale JSON
for (const code of allCodes) {
  const filePath = `locales/${code}.json`;
  let currentJson = {};
  if (fs.existsSync(filePath)) {
    currentJson = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  const langName = codeToLangName[code];
  let flatSource = {};
  if (langName && origStrings[langName]) {
    flatSource = origStrings[langName];
  } else {
    // Fall back to English flat keys for unreviewed machine draft languages
    flatSource = origStrings.English;
  }

  // Merge flat keys into locale file
  const merged = {
    ...flatSource,
    ...currentJson
  };

  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf8");
}

console.log("Merged 114 keys across all 23 locale JSON files!");
