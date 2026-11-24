import { describe, it, expect, vi, beforeEach } from "vitest";
import { translations, t } from "../src/app/translations";
import { 
  APPROVED_SAFETY_SPEECH_TEMPLATES, 
  speakApprovedSafetyPrompt 
} from "../src/services/voiceAssistant";
import fs from "fs";
import path from "path";

describe("Phase 9: Localisation and Low-Literacy Support", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("verifies translations dictionary has complete key parity across all 6 regional languages", () => {
    const requiredKeys = [
      "safetyVerified",
      "machineDraftNotice",
      "unverifiedSafetyNotice",
      "symptomQuestionsTitle",
      "symptomQuestionsSubtitle",
      "symptomQuestionsSubmit",
      "symptomSkipQuestions",
      "consentTitle",
      "consentSubtitle",
      "consentShareFull",
      "consentShareCropped",
      "consentShareBlurred",
      "consentMetadataOnly",
      "consentDoNotShare",
      "consentWithdraw",
      "consentGpsPrompt",
      "weatherAdvisoryTitle",
      "sprayWindowFavourable",
      "sprayWindowUnsuitable",
      "diseaseRiskHigh",
      "diseaseRiskMonitor",
      "offlineDataNotice",
      "auditLogsTitle",
      "cropCoverageTitle",
      "officerQueueTitle",
      "farmerFeedbackHelpText",
      "lowLiteracyAudioGuide",
      "largeButtonHelp"
    ];

    const targetLangs = ["English", "Tamil", "Hindi", "Telugu", "Kannada", "Malayalam"] as const;

    for (const lang of targetLangs) {
      const dict = translations[lang];
      for (const key of requiredKeys) {
        expect(dict[key as keyof typeof dict], `Missing key ${key} in ${lang}`).toBeDefined();
        expect(typeof dict[key as keyof typeof dict]).toBe("string");
        expect((dict[key as keyof typeof dict] as string).trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("verifies t() helper falls back safely to English for unrecognised language", () => {
    const result = t("safetyVerified", "French");
    expect(result).toBe("Safety Verified");
  });

  it("verifies Tamil translation returns human-verified Tamil text", () => {
    const taNotice = t("unverifiedSafetyNotice", "Tamil");
    expect(taNotice).toContain("வேளாண் அலுவலரை");
  });

  it("verifies all 23 locale JSON files have _translationMeta indicating human or machine draft", () => {
    const localesDir = path.resolve(__dirname, "../locales");
    const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json") && f !== "status.json" && f !== "glossary.json");

    expect(files.length).toBe(23);

    for (const file of files) {
      const filePath = path.join(localesDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      expect(data._translationMeta, `File ${file} missing _translationMeta`).toBeDefined();
      expect(data._translationMeta.status).toMatch(/HUMAN_VERIFIED|MACHINE_DRAFT/);
      expect(data._translationMeta.safetyVerified).toMatch(/true|false/);

      if (file === "en.json" || file === "ta.json") {
        expect(data._translationMeta.status).toBe("HUMAN_VERIFIED");
        expect(data._translationMeta.safetyVerified).toBe("true");
      } else {
        expect(data._translationMeta.status).toBe("MACHINE_DRAFT");
        expect(data._translationMeta.safetyVerified).toBe("false");
      }
    }
  });

  it("verifies speakApprovedSafetyPrompt uses approved templates and safe English/Tamil locales", () => {
    // Mock window.speechSynthesis
    const cancelMock = vi.fn();
    const speakMock = vi.fn();

    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      constructor(text: string) {
        this.text = text;
      }
    }

    // @ts-ignore
    global.window = {
      speechSynthesis: {
        cancel: cancelMock,
        speak: speakMock
      }
    };
    // @ts-ignore
    global.SpeechSynthesisUtterance = MockUtterance;

    // 1. English Tier 1
    const resEn = speakApprovedSafetyPrompt("TIER_1_CONFIDENT", {
      crop: "Tomato",
      disease: "Early Blight",
      action: "Remove lower leaves"
    }, "English");

    expect(resEn.languageUsed).toBe("en-IN");
    expect(resEn.fallbackUsed).toBe(false);
    expect(resEn.spokenText).toContain("Tier 1: High confidence diagnosis");
    expect(resEn.spokenText).toContain("Tomato");
    expect(resEn.spokenText).toContain("Early Blight");

    // 2. Tamil Tier 2
    const resTa = speakApprovedSafetyPrompt("TIER_2_MODERATE", {
      crop: "தக்காளி",
      disease: "இலைப்புள்ளி",
      action: "கள தூய்மை"
    }, "Tamil");

    expect(resTa.languageUsed).toBe("ta-IN");
    expect(resTa.fallbackUsed).toBe(false);
    expect(resTa.spokenText).toContain("நிலை 2");
    expect(resTa.spokenText).toContain("ரசாயன மருந்துகள் தவிர்க்கவும்");

    // 3. Unverified language (e.g. Hindi) safely falls back to English approved template
    const resHi = speakApprovedSafetyPrompt("TIER_3_INCONCLUSIVE", {
      crop: "Potato"
    }, "Hindi");

    expect(resHi.languageUsed).toBe("en-IN");
    expect(resHi.fallbackUsed).toBe(true);
    expect(resHi.spokenText).toContain("Tier 3: Inconclusive scan");
  });

  it("verifies template safety: cannot generate unapproved pesticide dosages via voice templates", () => {
    const unverifiedNotice = APPROVED_SAFETY_SPEECH_TEMPLATES.UNVERIFIED_SAFETY_NOTICE.en();
    expect(unverifiedNotice).toContain("contact an extension officer");
    expect(unverifiedNotice).not.toContain("g/L");
    expect(unverifiedNotice).not.toContain("ml/L");
  });
});
