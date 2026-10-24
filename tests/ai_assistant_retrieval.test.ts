import { describe, it, expect } from "vitest";
import { 
  generateContextualResponse, 
  CURATED_KNOWLEDGE_BASE, 
  UNVERIFIED_FALLBACK_EN, 
  UNVERIFIED_FALLBACK_TA,
  FarmerContext
} from "../src/services/aiAssistantService";
import { SUPPORTED_LANGUAGES, UNREVIEWED_LANGUAGES } from "../src/services/i18n";

describe("Phase 3 - Feature 2: Curated Retrieval AI Assistant & Language Restriction", () => {
  const mockContextEn: FarmerContext = {
    name: "Selvam Murugan",
    location: "Coimbatore",
    district: "Coimbatore",
    state: "Tamil Nadu",
    farmSize: "3.5",
    primaryCrop: "Tomato",
    cropVariety: "Shivam F1",
    cropStage: "Flowering & Fruiting",
    soilType: "Red Loam",
    soilMoisture: 58,
    weatherCondition: "Overcast",
    rainfallExpected: 18,
    temperature: 28,
    language: "English"
  };

  const mockContextTa: FarmerContext = {
    ...mockContextEn,
    language: "Tamil"
  };

  describe("1. Curated Sourced Knowledge Base Integrity", () => {
    it("has curated entries from verified sources (TNAU / ICAR / CIBRC) only", () => {
      expect(CURATED_KNOWLEDGE_BASE.length).toBeGreaterThanOrEqual(6);
      const allowedSources = ["TNAU", "ICAR", "CIBRC", "Directorate of Rice Development"];

      CURATED_KNOWLEDGE_BASE.forEach(entry => {
        expect(entry.id).toBeTruthy();
        expect(entry.answerEn).toBeTruthy();
        expect(entry.answerTa).toBeTruthy();
        expect(entry.sourceUrl).toMatch(/^https?:\/\//);

        const hasSource = allowedSources.some(src => entry.citation.includes(src));
        expect(hasSource, `Entry ${entry.id} citation must reference TNAU/ICAR/CIBRC`).toBe(true);
      });
    });
  });

  describe("2. Retrieval Engine with Citation Enforcement", () => {
    it("retrieves verified irrigation advice with TNAU citation for water delay queries", () => {
      const response = generateContextualResponse("Why should I delay irrigation?", mockContextEn);
      expect(response).toContain("Irrigation Scheduling & Drainage Advisory");
      expect(response).toContain("TNAU Agritech Portal");
      expect(response).toContain("https://agritech.tnau.ac.in");
    });

    it("retrieves verified Tamil leaf chlorosis advice with TNAU citation", () => {
      const response = generateContextualResponse("இலைகள் ஏன் மஞ்சள் நிறமாகின்றன?", mockContextTa);
      expect(response).toContain("இலைகள் மஞ்சள் நிறமாதல்");
      expect(response).toContain("TNAU Department of Soil Science");
      expect(response).toContain("https://agritech.tnau.ac.in");
    });

    it("retrieves rice blast management with ICAR-NRRI citation", () => {
      const response = generateContextualResponse("How to manage rice blast?", mockContextEn);
      expect(response).toContain("Rice Blast Disease Management Protocol");
      expect(response).toContain("ICAR-National Rice Research Institute");
    });

    it("retrieves pesticide safety and drift rules with CIBRC citation", () => {
      const response = generateContextualResponse("What are safe spraying rules?", mockContextEn);
      expect(response).toContain("Pesticide Spray Safety & Drift Guardrails");
      expect(response).toContain("Central Insecticides Board & Registration Committee (CIBRC)");
    });
  });

  describe("3. Uncovered Questions Fallback Enforcement", () => {
    it("returns strict honest fallback in English when question is not in knowledge base", () => {
      const ungroundedQuestions = [
        "How do I fix my tractor battery?",
        "Who is the chief minister?",
        "Will crypto prices go up?",
        "Tell me a joke about farmers"
      ];

      for (const q of ungroundedQuestions) {
        const response = generateContextualResponse(q, mockContextEn);
        expect(response).toBe(UNVERIFIED_FALLBACK_EN);
        expect(response).toBe("I don't have verified information; ask your extension officer.");
      }
    });

    it("returns strict honest fallback in Tamil when question is not in knowledge base", () => {
      const response = generateContextualResponse("டிராக்டர் பேட்டரியை எப்படி மாற்றுவது?", mockContextTa);
      expect(response).toBe(UNVERIFIED_FALLBACK_TA);
      expect(response).toBe("என்னிடம் சரிபார்க்கப்பட்ட தகவல் இல்லை; உங்கள் வேளாண் விரிவாக்க அலுவலரிடம் கேளுங்கள்.");
    });
  });

  describe("4. Multilingual Scope & Review Status", () => {
    it("supports English plus the 22 scheduled languages of India in SUPPORTED_LANGUAGES", () => {
      const supportedNames = SUPPORTED_LANGUAGES.map(l => l.name);
      expect(supportedNames.length).toBe(23);
      expect(supportedNames).toContain("English");
      expect(supportedNames).toContain("Tamil");
      expect(supportedNames).toContain("Hindi");
      expect(supportedNames).toContain("Urdu");
      expect(supportedNames).toContain("Bengali");
    });

    it("places all unreviewed languages in UNREVIEWED_LANGUAGES with status MACHINE-DRAFT", () => {
      const unreviewedNames = UNREVIEWED_LANGUAGES.map(l => l.name);
      expect(unreviewedNames).toContain("Hindi");
      expect(unreviewedNames).toContain("Telugu");
      expect(unreviewedNames).toContain("Kannada");
      expect(unreviewedNames).toContain("Malayalam");
      expect(unreviewedNames).toContain("Urdu");
      expect(unreviewedNames.length).toBe(22);
    });
  });
});
