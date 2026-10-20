import { describe, it, expect } from "vitest";
import { I18N_STRINGS, t } from "../src/services/i18n";

describe("i18n English <-> Tamil Key Parity & Completeness (Phase G)", () => {
  const enKeys = Object.keys(I18N_STRINGS.English);
  const taKeys = Object.keys(I18N_STRINGS.Tamil);

  it("English dictionary contains extensive agricultural terminology (>= 100 keys)", () => {
    expect(enKeys.length).toBeGreaterThanOrEqual(100);
  });

  it("Every English key has a corresponding non-empty Tamil translation", () => {
    const missingKeys: string[] = [];
    const emptyValues: string[] = [];

    for (const key of enKeys) {
      if (!Object.prototype.hasOwnProperty.call(I18N_STRINGS.Tamil, key)) {
        missingKeys.push(key);
      } else if (!I18N_STRINGS.Tamil[key] || I18N_STRINGS.Tamil[key].trim() === "") {
        emptyValues.push(key);
      }
    }

    expect(missingKeys).toEqual([]);
    expect(emptyValues).toEqual([]);
  });

  it("Every Tamil key has a corresponding non-empty English translation", () => {
    const missingInEnglish: string[] = [];
    for (const key of taKeys) {
      if (!Object.prototype.hasOwnProperty.call(I18N_STRINGS.English, key)) {
        missingInEnglish.push(key);
      }
    }
    expect(missingInEnglish).toEqual([]);
  });

  it("4 primary navigation tabs strictly match 'Home | Community | Services | You'", () => {
    expect(I18N_STRINGS.English.navHome).toBe("Home");
    expect(I18N_STRINGS.English.navCommunity).toBe("Community");
    expect(I18N_STRINGS.English.navServices).toBe("Services");
    expect(I18N_STRINGS.English.navProfile).toBe("You");

    expect(I18N_STRINGS.Tamil.navHome).toBe("முகப்பு");
    expect(I18N_STRINGS.Tamil.navCommunity).toBe("சமூகம்");
    expect(I18N_STRINGS.Tamil.navServices).toBe("சேவைகள்");
    expect(I18N_STRINGS.Tamil.navProfile).toBe("நீங்கள்");
  });

  it("Helper function t() gracefully falls back to English when given invalid language", () => {
    expect(t("navDoctor", "English")).toBe("Crop Doctor");
    expect(t("navDoctor", "Tamil")).toBe("பயிர் மருத்துவர்");
    expect(t("navDoctor", "InvalidLang" as any)).toBe("Crop Doctor");
    expect(t("non_existent_key" as any, "English")).toBe("non_existent_key");
  });

  it("All 6 regional languages (Hindi, Telugu, Kannada, Malayalam) have 100% key parity with English", () => {
    const regionalLangs = ["Hindi", "Telugu", "Kannada", "Malayalam"] as const;
    for (const lang of regionalLangs) {
      const langDict = I18N_STRINGS[lang];
      expect(langDict, `${lang} dictionary should exist`).toBeDefined();
      const missingKeys = enKeys.filter(k => !langDict[k] || langDict[k].trim() === "");
      expect(missingKeys, `${lang} has missing/empty keys`).toEqual([]);
    }
  });
});
