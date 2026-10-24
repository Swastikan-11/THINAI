import { describe, it, expect, beforeEach } from "vitest";
import { generateFarmDecisions, DecisionInputs } from "../src/services/decisionEngine";
import { evaluateSpraySafety, WeatherData } from "../src/services/weatherService";
import { calculateWilsonScore, evaluateFieldAccuracy } from "../src/services/verdictService";
import { generateContextualResponse } from "../src/services/aiAssistantService";
import { t, I18N_DICTIONARY, AppLanguage } from "../src/services/i18n";
import { COMMODITY_KEYS, getDashboardMarketPrice } from "../src/services/marketService";
import { FarmerVerdictRecord } from "../src/services/db";
import { ARFI_CONFIG } from "../src/config/arfiConfig";

describe("Phase O2 — Offline Verification Test Matrix (S1, S2, S3, S4)", () => {
  const sampleDecisionInputs: DecisionInputs = {
    crop: "Paddy",
    cropVariety: "CR 1009",
    cropStage: "Tillering",
    soilType: "Clay Loam",
    soilMoistureStatus: "dry",
    soilMoisturePct: 25,
    rainfallExpectedMm: 0,
    temperatureC: 31,
    weatherCondition: "Sunny",
    farmSizeAcres: 2.5,
    location: "Coimbatore",
    mandiPricePerQuintal: 2840,
    mspPricePerQuintal: 2300,
    feedbackHistory: []
  };

  // ─── 1. DECISION ENGINE, FERTILIZER, ARFI & WHAT-IF LAB ───
  describe("Feature: Decision Engine, Fertilizer & ARFI (Fully Offline)", () => {
    it("S2/Offline: generates complete deterministic agronomic decisions without network access", () => {
      const result = generateFarmDecisions(sampleDecisionInputs);
      expect(result).toBeDefined();
      expect(result.primaryRecommendation).toBeDefined();
      expect(result.primaryRecommendation.action.toLowerCase()).toContain("irrigation");
      expect(result.primaryRecommendation.confidence).toBeGreaterThan(0);
      expect(result.riskAnalysis).toBeDefined();
      expect(result.riskAnalysis.factors.length).toBeGreaterThan(0);
      expect(["Safe", "Moderate", "High", "Critical"]).toContain(result.riskAnalysis.overallRisk);
      expect(ARFI_CONFIG.baselineScore).toBe(68);
      expect(["STABLE", "MODERATE", "FRAGILE"]).toContain(ARFI_CONFIG.baselineStability);
    });

    it("S3/Mid-use transition: handles rapid parameter variation in What-If stress test offline", () => {
      const dryInputs = { ...sampleDecisionInputs, soilMoistureStatus: "dry" as const, soilMoisturePct: 25, rainfallExpectedMm: 0 };
      const wetInputs = { ...sampleDecisionInputs, soilMoistureStatus: "wet" as const, soilMoisturePct: 85, rainfallExpectedMm: 50 };

      const dryDecision = generateFarmDecisions(dryInputs);
      const wetDecision = generateFarmDecisions(wetInputs);

      expect(dryDecision.primaryRecommendation.action).not.toBe(wetDecision.primaryRecommendation.action);
      expect(wetDecision.primaryRecommendation.action.toLowerCase()).toContain("drainage");
    });
  });

  // ─── 2. SPRAY ADVISORY RULES & WEATHER AGE ───
  describe("Feature: Spray Advisory Rules & Last Weather Age Display", () => {
    it("S2/Cold-start with no cached weather: safely denies spray green-light and states weather unavailable", () => {
      const unavailableWeather: WeatherData = {
        isAvailable: false,
        status: "OFFLINE",
        unavailableReason: "No weather observation cached offline for this location.",
        locationName: "Coimbatore",
        temperature: 0,
        condition: "Offline",
        conditionIcon: "☁️",
        feelsLike: 0,
        humidity: 0,
        windSpeed: 0,
        rainProbability: 0,
        rainfallMmExpected: 0,
        uvIndex: 0,
        hourly: [],
        forecast7Day: [],
        alerts: [],
        updatedAt: "--:--",
        lastUpdatedLabel: "Unavailable",
        source: "None"
      };

      const advisory = evaluateSpraySafety(unavailableWeather);
      expect(advisory.isSafe).toBe(false);
      expect(advisory.badgeColor).toBe("amber");
      expect(advisory.statusText).toContain("Weather Unavailable");
      expect(advisory.statusTextTamil).toContain("வானிலை தரவு இல்லை");
    });

    it("S1/Online or S2/Cached: alerts wash-off hazard when rainProbability > 40%", () => {
      const rainWeather: WeatherData = {
        isAvailable: true,
        status: "CACHED",
        temperature: 28,
        condition: "Rain",
        conditionIcon: "🌧️",
        feelsLike: 30,
        humidity: 85,
        windSpeed: 10,
        rainProbability: 75,
        rainfallMmExpected: 18,
        uvIndex: 3,
        hourly: [],
        forecast7Day: [],
        alerts: [],
        updatedAt: "10:30 AM",
        lastUpdatedLabel: "Cached: 42 minute(s) ago",
        source: "Open-Meteo (~11 km grid)"
      };

      const advisory = evaluateSpraySafety(rainWeather);
      expect(advisory.isSafe).toBe(false);
      expect(advisory.badgeColor).toBe("rose");
      expect(advisory.reason).toContain("wash off");
      expect(advisory.reasonTamil).toContain("கழுவிச் செல்லும்");
    });

    it("S1/Optimal: safely approves spraying when wind and rain are low", () => {
      const optimalWeather: WeatherData = {
        isAvailable: true,
        status: "LIVE",
        temperature: 26,
        condition: "Clear Sky",
        conditionIcon: "☀️",
        feelsLike: 27,
        humidity: 60,
        windSpeed: 8,
        rainProbability: 10,
        rainfallMmExpected: 0,
        uvIndex: 5,
        hourly: [],
        forecast7Day: [],
        alerts: [],
        updatedAt: "07:15 AM",
        lastUpdatedLabel: "Just now",
        source: "Open-Meteo (~11 km grid)"
      };

      const advisory = evaluateSpraySafety(optimalWeather);
      expect(advisory.isSafe).toBe(true);
      expect(advisory.badgeColor).toBe("emerald");
      expect(advisory.statusText).toContain("Good Spraying Conditions");
    });
  });

  // ─── 3. FIELD ACCURACY & DRIFT MONITOR (OFFLINE CALCULATIONS) ───
  describe("Feature: Field Accuracy & Wilson Intervals Offline", () => {
    it("S2/Offline: computes Wilson intervals and calibration drift correctly from local verdict array", () => {
      const mockVerdicts: FarmerVerdictRecord[] = [
        { id: "v1", userId: "u1", photoHash: "h1", predictedClass: "Tomato Early Blight", calibratedConfidence: 0.85, tier: "TIER_1_CONFIDENT", verdict: "YES", timestamp: new Date().toISOString() },
        { id: "v2", userId: "u1", photoHash: "h2", predictedClass: "Tomato Early Blight", calibratedConfidence: 0.82, tier: "TIER_1_CONFIDENT", verdict: "YES", timestamp: new Date().toISOString() },
        { id: "v3", userId: "u1", photoHash: "h3", predictedClass: "Tomato Early Blight", calibratedConfidence: 0.80, tier: "TIER_1_CONFIDENT", verdict: "YES", timestamp: new Date().toISOString() },
        { id: "v4", userId: "u1", photoHash: "h4", predictedClass: "Tomato Early Blight", calibratedConfidence: 0.88, tier: "TIER_1_CONFIDENT", verdict: "YES", timestamp: new Date().toISOString() },
        { id: "v5", userId: "u1", photoHash: "h5", predictedClass: "Tomato Early Blight", calibratedConfidence: 0.79, tier: "TIER_1_CONFIDENT", verdict: "YES", timestamp: new Date().toISOString() },
        { id: "v6", userId: "u1", photoHash: "h6", predictedClass: "Tomato Early Blight", calibratedConfidence: 0.81, tier: "TIER_1_CONFIDENT", verdict: "YES", timestamp: new Date().toISOString() },
        { id: "v7", userId: "u1", photoHash: "h7", predictedClass: "Tomato Early Blight", calibratedConfidence: 0.83, tier: "TIER_1_CONFIDENT", verdict: "YES", timestamp: new Date().toISOString() },
        { id: "v8", userId: "u1", photoHash: "h8", predictedClass: "Tomato Early Blight", calibratedConfidence: 0.84, tier: "TIER_1_CONFIDENT", verdict: "NO", actualClassChoice: "Tomato Late Blight", timestamp: new Date().toISOString() },
        { id: "v9", userId: "u1", photoHash: "h9", predictedClass: "Tomato Early Blight", calibratedConfidence: 0.78, tier: "TIER_1_CONFIDENT", verdict: "YES", timestamp: new Date().toISOString() },
        { id: "v10", userId: "u1", photoHash: "h10", predictedClass: "Tomato Early Blight", calibratedConfidence: 0.86, tier: "TIER_1_CONFIDENT", verdict: "YES", timestamp: new Date().toISOString() }
      ];

      const summary = evaluateFieldAccuracy(mockVerdicts);
      expect(summary.totalVerdictsCount).toBe(10);
      expect(summary.hasEnoughOverallData).toBe(true);
      expect(summary.overallAccuracy).toBe(90.0);
      expect(summary.overallWilsonLower).toBeGreaterThan(50.0);
      expect(summary.overallWilsonUpper).toBeLessThanOrEqual(100.0);
      expect(summary.retrainingCandidatesCount).toBe(1); // 1 "NO" verdict
    });

    it("S2/Offline: enforces 'not enough data' barrier below threshold (< 10 verdicts)", () => {
      const fewVerdicts: FarmerVerdictRecord[] = [
        { id: "v1", userId: "u1", photoHash: "h1", predictedClass: "Pepper Bell Bacterial Spot", calibratedConfidence: 0.90, tier: "TIER_1_CONFIDENT", verdict: "YES", timestamp: new Date().toISOString() }
      ];
      const summary = evaluateFieldAccuracy(fewVerdicts);
      expect(summary.totalVerdictsCount).toBe(1);
      expect(summary.hasEnoughOverallData).toBe(false);
      expect(summary.overallAccuracy).toBeNull();
      expect(summary.overallWilsonLower).toBeNull();
    });
  });

  // ─── 4. MARKET PRICES & HONEST PROVENANCE ───
  describe("Feature: Market Prices & Honest Provenance", () => {
    it("S2/Offline: provides commodity metadata without fabricated numbers", () => {
      const paddyKey = COMMODITY_KEYS.find(c => c.id === "paddy");
      expect(paddyKey).toBeDefined();
      expect(paddyKey?.agmarknetName).toBe("Paddy(Dhan)(Common)");
      expect(paddyKey?.labelTa).toBe("நெல்");
    });

    it("S2/Offline: dashboard price defaults to honest unavailable state without fake fallback", () => {
      const dashboard = getDashboardMarketPrice("Paddy", "Coimbatore");
      expect(dashboard).toBeDefined();
      expect(dashboard.isAvailable).toBe(false);
      expect(dashboard.pricePerQuintal).toBeUndefined();
      expect(dashboard.status).toBe("PRICE_UNAVAILABLE");
    });
  });

  // ─── 5. AI CHATBOT OFFLINE RULE-BASED FALLBACK ───
  describe("Feature: AI Chatbot Local Rule-Based Fallback", () => {
    it("S2/Offline: returns contextual Tamil next-best action response without network", () => {
      const response = generateContextualResponse("இன்று நான் என்ன செய்ய வேண்டும்?", {
        name: "செல்வம்",
        location: "தொண்டாமுத்தூர், கோயம்புத்தூர்",
        district: "Coimbatore",
        state: "Tamil Nadu",
        farmSize: "3",
        primaryCrop: "Paddy",
        cropVariety: "CR 1009",
        cropStage: "Tillering",
        soilType: "Clay Loam",
        soilMoisture: 25,
        weatherCondition: "Clear Sky",
        rainfallExpected: 0,
        temperature: 30,
        language: "Tamil",
        nextBestAction: {
          id: "rec-1",
          category: "Irrigation",
          title: "Light Evening Irrigation",
          action: "வடிகால் பாசனம் 2 மணி நேரம் செய்யவும்",
          when: "இன்று மாலை 5 மணி",
          why: "மண்ணின் ஈரப்பதம் 25% ஆக குறைந்துள்ளது",
          priority: "High",
          confidence: 88,
          confidenceLabel: "உயர் உறுதி",
          supportingFactors: ["மண் ஈரப்பதம் குறைவு"],
          risk: "பயிர் வாடல்",
          alternativeAction: "சொட்டு நீர் பாசனம்",
          impact: "பயிர் வளர்ச்சி சீராகும்"
        }
      });

      expect(response).toContain("அடுத்த சிறந்த நடவடிக்கை");
      expect(response).toContain("வடிகால் பாசனம்");
    });

    it("S2/Offline: returns contextual English leaf yellowing advisory locally", () => {
      const response = generateContextualResponse("Why is my leaf turning yellow?", {
        name: "Selvam",
        location: "Coimbatore",
        district: "Coimbatore",
        state: "Tamil Nadu",
        farmSize: "2.5",
        primaryCrop: "Paddy",
        cropVariety: "CR 1009",
        cropStage: "Tillering",
        soilType: "Clay Loam",
        soilMoisture: 75,
        weatherCondition: "Cloudy",
        rainfallExpected: 15,
        temperature: 28,
        language: "English"
      });

      expect(response).toContain("Leaf Yellowing");
      expect(response).toContain("surface water is completely drained");
    });
  });

  // ─── 6. LANGUAGE INSTANT OFFLINE SWITCH ───
  describe("Feature: Bilingual Instant Offline Switch", () => {
    it("S2/Offline: renders every critical navigation and advisory key in both English and Tamil", () => {
      const criticalKeys = [
        "navHome",
        "navCommunity",
        "navCrop",
        "navDoctor",
        "navWeather",
        "navMarket",
        "navServices",
        "navAI",
        "navProfile",
        "takePhoto",
        "uploadImage",
        "unableToDetermine",
        "retakePhoto",
        "nextBestAction",
        "whyThisAction",
        "takeAction"
      ];

      for (const k of criticalKeys) {
        const enVal = t(k, "English");
        const taVal = t(k, "Tamil");
        expect(enVal, `Missing English key: ${k}`).toBeTruthy();
        expect(taVal, `Missing Tamil key: ${k}`).toBeTruthy();
        expect(enVal).not.toBe(k); // not raw key fallback
        expect(taVal).not.toBe(k); // not raw key fallback
      }
    });
  });
});
