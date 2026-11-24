// Tests for Language Safety Gating on Advisory Content
// SAFETY: Ensures chemical dosages, waiting periods, and PPE instructions are never
// displayed in machine-drafted languages without human verification and fallback.

import { describe, it, expect } from "vitest";
import {
  getLanguageReviewStatus,
  isSafetyContentVerified,
  gateSafetyCriticalContent,
  getLanguageSafetyBadge,
  getAllLanguageReviewEntries,
  UNVERIFIED_SAFETY_NOTICE,
} from "../src/services/languageSafetyService";
import languageRegistryData from "../src/data/languageReviewStatus.json";

describe("Language Review Registry Structure", () => {
  it("contains at least 23 official Indian languages", () => {
    const entries = getAllLanguageReviewEntries();
    expect(entries.length).toBeGreaterThanOrEqual(23);
  });

  it("English and Tamil are human-verified for safety content", () => {
    const en = getLanguageReviewStatus("English");
    const ta = getLanguageReviewStatus("Tamil");

    expect(en.safetyContentVerified).toBe(true);
    expect(en.translationStatus).toBe("HUMAN_VERIFIED");

    expect(ta.safetyContentVerified).toBe(true);
    expect(ta.translationStatus).toBe("HUMAN_VERIFIED");
  });

  it("machine-drafted languages have safetyContentVerified = false", () => {
    const unverifiedLangs = ["Hindi", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Punjabi"];
    for (const lang of unverifiedLangs) {
      const entry = getLanguageReviewStatus(lang);
      expect(entry.safetyContentVerified).toBe(false);
      expect(entry.translationStatus).toBe("MACHINE_DRAFT");
    }
  });

  it("handles language codes and names case-insensitively", () => {
    expect(getLanguageReviewStatus("ta").languageName).toBe("Tamil");
    expect(getLanguageReviewStatus("TAMIL").languageCode).toBe("ta");
    expect(getLanguageReviewStatus("EN").languageCode).toBe("en");
    expect(getLanguageReviewStatus("hi").languageName).toBe("Hindi");
  });

  it("unknown language defaults safely to MACHINE_DRAFT with English fallback", () => {
    const unknown = getLanguageReviewStatus("Klingon");
    expect(unknown.translationStatus).toBe("MACHINE_DRAFT");
    expect(unknown.safetyContentVerified).toBe(false);
    expect(unknown.fallbackLanguage).toBe("en");
  });
});

describe("gateSafetyCriticalContent", () => {
  const englishDosage = ["Apply Mancozeb 75% WP @ 2.0g per liter of water."];
  const hindiDraftDosage = ["पानी में 2.0 ग्राम मैंकोजेब 75% डब्ल्यूपी प्रति लीटर डालें।"]; // Unverified machine translation

  it("permits safety content in human-verified languages (English)", () => {
    const result = gateSafetyCriticalContent({
      content: englishDosage,
      fallbackContent: englishDosage,
      language: "English",
      contentType: "chemical_dosage",
    });

    expect(result.allowed).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    expect(result.content).toEqual(englishDosage);
    expect(result.notice).toBeNull();
    expect(result.badge.safetyVerified).toBe(true);
    expect(result.badge.color).toBe("green");
  });

  it("permits safety content in human-verified languages (Tamil)", () => {
    const tamilDosage = ["ஒரு லிட்டர் தண்ணீருக்கு மாங்கோசெப் 75% WP @ 2.0 கிராம் வீதம் கலக்கவும்."];
    const result = gateSafetyCriticalContent({
      content: tamilDosage,
      fallbackContent: englishDosage,
      language: "Tamil",
      contentType: "chemical_dosage",
    });

    expect(result.allowed).toBe(true);
    expect(result.fallbackUsed).toBe(false);
    expect(result.content).toEqual(tamilDosage);
    expect(result.badge.safetyVerified).toBe(true);
  });

  it("BLOCKS safety content in machine-drafted languages and falls back with warning", () => {
    const result = gateSafetyCriticalContent({
      content: hindiDraftDosage,
      fallbackContent: englishDosage,
      language: "Hindi",
      contentType: "chemical_dosage",
    });

    expect(result.allowed).toBe(false);
    expect(result.fallbackUsed).toBe(true);
    // Unverified machine translation must be replaced by verified fallback
    expect(result.content).toEqual(englishDosage);
    expect(result.notice).toContain(UNVERIFIED_SAFETY_NOTICE);
    expect(result.badge.safetyVerified).toBe(false);
    expect(result.badge.color).toBe("rose");
  });

  it("returns proper UI badge descriptor", () => {
    const enBadge = getLanguageSafetyBadge("English");
    expect(enBadge.isVerified).toBe(true);
    expect(enBadge.badgeClass).toContain("emerald");

    const teBadge = getLanguageSafetyBadge("Telugu");
    expect(teBadge.isVerified).toBe(false);
    expect(teBadge.badgeClass).toContain("amber");
  });
});
