import fs from "fs";

let code = fs.readFileSync("src/services/i18n.ts", "utf8");

const oldImports = `import enLocale from "../../locales/en.json";
import taLocale from "../../locales/ta.json";
import hiLocale from "../../locales/hi.json";
import urLocale from "../../locales/ur.json";`;

const newImports = `import asLocale from "../../locales/as.json";
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
import urLocale from "../../locales/ur.json";`;

const oldCache = `const LOCALE_CACHE: Record<string, any> = {
  en: enLocale,
  ta: taLocale,
  hi: hiLocale,
  ur: urLocale
};`;

const newCache = `const LOCALE_CACHE: Record<string, any> = {
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
};`;

const oldI18n = `export const I18N_STRINGS: Record<string, Record<string, string>> = {
  English: enLocale as any,
  Tamil: taLocale as any,
  Hindi: hiLocale as any,
  Urdu: urLocale as any
};`;

const newI18n = `export const I18N_STRINGS: Record<string, Record<string, string>> = {
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

// Normalize line breaks
code = code.replace(/\r\n/g, "\n");
code = code.replace(oldImports.replace(/\r\n/g, "\n"), newImports);
code = code.replace(oldCache.replace(/\r\n/g, "\n"), newCache);
code = code.replace(oldI18n.replace(/\r\n/g, "\n"), newI18n);

fs.writeFileSync("src/services/i18n.ts", code, "utf8");
console.log("Updated src/services/i18n.ts with all 23 locales!");
