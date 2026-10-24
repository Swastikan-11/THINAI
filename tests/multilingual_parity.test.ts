import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { 
  SUPPORTED_LANGUAGES, 
  RTL_LANGUAGE_CODES, 
  getSafeRemedies, 
  isLanguageReviewed, 
  t 
} from "../src/services/i18n";
import statusData from "../locales/status.json";

describe("Step 2: Multilingual Parity & Safety Invariants (All 23 Scheduled Languages)", () => {
  const localesDir = path.resolve(__dirname, "../locales");
  const enJson = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf-8"));
  
  function getAllKeysAndPlaceholders(obj: Record<string, any>, prefix = ""): Record<string, string[]> {
    let result: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "string") {
        const matches = value.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) || [];
        result[fullKey] = matches.map(m => m.replace(/[{}]/g, "").trim()).sort();
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(result, getAllKeysAndPlaceholders(value, fullKey));
      }
    }
    return result;
  }

  const enSchema = getAllKeysAndPlaceholders(enJson);
  const enKeyList = Object.keys(enSchema);

  it("registers exactly 23 languages (English + 22 Eighth Schedule languages)", () => {
    expect(SUPPORTED_LANGUAGES.length).toBe(23);
    const codes = SUPPORTED_LANGUAGES.map(l => l.code);
    expect(codes).toContain("en");
    expect(codes).toContain("ta");
    expect(codes).toContain("hi");
    expect(codes).toContain("bn");
    expect(codes).toContain("te");
    expect(codes).toContain("mr");
    expect(codes).toContain("ur");
    expect(codes).toContain("gu");
    expect(codes).toContain("kn");
    expect(codes).toContain("ml");
    expect(codes).toContain("pa");
    expect(codes).toContain("or");
    expect(codes).toContain("as");
    expect(codes).toContain("mai");
    expect(codes).toContain("sat");
    expect(codes).toContain("ks");
    expect(codes).toContain("ne");
    expect(codes).toContain("sd");
    expect(codes).toContain("kok");
    expect(codes).toContain("doi");
    expect(codes).toContain("mni");
    expect(codes).toContain("brx");
    expect(codes).toContain("sa");
  });

  it("verifies RTL languages are explicitly identified as Urdu, Kashmiri, Sindhi", () => {
    expect(RTL_LANGUAGE_CODES).toEqual(["ur", "ks", "sd"]);
    const rtlFromList = SUPPORTED_LANGUAGES.filter(l => l.rtl).map(l => l.code);
    expect(rtlFromList.sort()).toEqual(["ks", "sd", "ur"].sort());
  });

  it("verifies all 23 locale JSON files exist on disk and parse cleanly", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(localesDir, `${lang.code}.json`);
      expect(fs.existsSync(filePath), `Missing locale file: ${filePath}`).toBe(true);
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      expect(typeof parsed).toBe("object");
    }
  });

  it("verifies all 23 locale JSON files have key schema parity and identical interpolation placeholders", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(localesDir, `${lang.code}.json`);
      const targetJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const targetSchema = getAllKeysAndPlaceholders(targetJson);

      // Check all critical keys exist
      for (const enKey of enKeyList) {
        expect(
          targetSchema[enKey],
          `Locale ${lang.code} is missing key: ${enKey}`
        ).toBeDefined();

        // Check placeholders match
        expect(
          targetSchema[enKey],
          `Locale ${lang.code} has mismatching interpolation placeholders in key: ${enKey}`
        ).toEqual(enSchema[enKey]);
      }
    }
  });

  it("enforces strict remedy safety invariants: unreviewed languages fall back to English with notice", () => {
    const rawRemedies = [
      "Spray Mancozeb 75 WP @ 2g/litre",
      "Apply Pseudomonas fluorescens 0.5% at 10-day intervals",
      "Destroy and burn severely infected crop debris"
    ];

    // English is REVIEWED
    const enResult = getSafeRemedies(rawRemedies, "English");
    expect(enResult.isEnglishFallback).toBe(false);
    expect(enResult.treatments).toEqual(rawRemedies);
    expect(enResult.notice).toBeUndefined();

    // Hindi is MACHINE-DRAFT
    const hiResult = getSafeRemedies(rawRemedies, "Hindi");
    expect(hiResult.isEnglishFallback).toBe(true);
    expect(hiResult.treatments).toEqual(rawRemedies); // remedies remain in English
    expect(hiResult.notice).toBeDefined();
    expect(hiResult.notice).toContain("सलाह");
    expect(t("safety.unreviewedAdviceNotice", "English")).toContain("checked the translation");

    // Urdu (RTL) is MACHINE-DRAFT
    const urResult = getSafeRemedies(rawRemedies, "Urdu");
    expect(urResult.isEnglishFallback).toBe(true);
    expect(urResult.treatments).toEqual(rawRemedies);
    expect(urResult.notice).toBeDefined();
  });

  it("verifies status.json has English as REVIEWED and all other 22 as MACHINE-DRAFT", () => {
    const statusMap = statusData as Record<string, { status: string }>;
    expect(statusMap.en.status).toBe("REVIEWED");

    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang.code !== "en") {
        expect(
          statusMap[lang.code]?.status,
          `Expected language ${lang.code} to have status MACHINE-DRAFT`
        ).toBe("MACHINE-DRAFT");
      }
    }
  });
});
