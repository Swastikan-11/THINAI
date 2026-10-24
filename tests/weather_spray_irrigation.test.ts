import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { 
  evaluateSpraySafety, 
  evaluateIrrigationAdvice, 
  WeatherData, 
  getLiveWeather 
} from "../src/services/weatherService";
import { db } from "../src/services/db";
import { syncManager } from "../src/services/syncService";

describe("Phase 3 - Feature 3: Open-Meteo Weather with Real Spray/Irrigation Rules & Cache Age", () => {
  const baseWeather: WeatherData = {
    isAvailable: true,
    status: "LIVE",
    temperature: 28,
    condition: "Partly Cloudy",
    conditionIcon: "🌤️",
    feelsLike: 29,
    humidity: 65,
    windSpeed: 10,
    rainProbability: 15,
    rainfallMmExpected: 0,
    uvIndex: 5,
    hourly: [],
    forecast7Day: [],
    alerts: [],
    updatedAt: "10:30 AM",
    lastUpdatedLabel: "Just now",
    source: "Open-Meteo (~11 km grid)"
  };

  describe("1. Spray Safety Rules & Explicit Rule Disclosure", () => {
    it("triggers CIBRC Drift Rule when wind speed > 15 km/h", () => {
      const highWind = { ...baseWeather, windSpeed: 18 };
      const advisory = evaluateSpraySafety(highWind);

      expect(advisory.isSafe).toBe(false);
      expect(advisory.badgeColor).toBe("amber");
      expect(advisory.ruleUsed).toContain("CIBRC Drift Rule");
      expect(advisory.ruleUsed).toContain("15 km/h");
      expect(advisory.ruleUsedTamil).toContain("CIBRC விதி");
    });

    it("triggers TNAU Wash-off Rule when rain probability > 40% or rainfall > 2mm", () => {
      const rainHazard = { ...baseWeather, rainProbability: 60, rainfallMmExpected: 8 };
      const advisory = evaluateSpraySafety(rainHazard);

      expect(advisory.isSafe).toBe(false);
      expect(advisory.badgeColor).toBe("rose");
      expect(advisory.ruleUsed).toContain("TNAU Wash-off Rule");
      expect(advisory.ruleUsed).toContain("40%");
      expect(advisory.ruleUsedTamil).toContain("TNAU விதி");
    });

    it("triggers ICAR Volatilization Rule when ambient temp > 35°C", () => {
      const heatHazard = { ...baseWeather, temperature: 38 };
      const advisory = evaluateSpraySafety(heatHazard);

      expect(advisory.isSafe).toBe(false);
      expect(advisory.badgeColor).toBe("amber");
      expect(advisory.ruleUsed).toContain("ICAR Volatilization Rule");
      expect(advisory.ruleUsed).toContain("35°C");
      expect(advisory.ruleUsedTamil).toContain("ICAR விதி");
    });

    it("triggers Optimal Canopy Window rule when weather parameters are within safe bounds", () => {
      const safeWeather = { ...baseWeather, windSpeed: 8, rainProbability: 10, temperature: 27, rainfallMmExpected: 0 };
      const advisory = evaluateSpraySafety(safeWeather);

      expect(advisory.isSafe).toBe(true);
      expect(advisory.badgeColor).toBe("emerald");
      expect(advisory.ruleUsed).toContain("Optimal Window");
      expect(advisory.ruleUsedTamil).toContain("பாதுகாப்பான தெளிப்பு சூழல்");
    });
  });

  describe("2. Irrigation Advice Rules & Explicit Rule Disclosure", () => {
    it("suspends irrigation when forecasted 48h rainfall >= 15 mm", () => {
      const heavyRain = { ...baseWeather, rainfallMmExpected: 22 };
      const advisory = evaluateIrrigationAdvice(heavyRain, "optimal");

      expect(advisory.action).toBe("SUSPEND");
      expect(advisory.badgeColor).toBe("rose");
      expect(advisory.ruleUsed).toContain("TNAU Water Tech Rule 1");
      expect(advisory.ruleUsed).toContain(">= 15 mm");
      expect(advisory.ruleUsedTamil).toContain("TNAU விதி 1");
    });

    it("delays irrigation by 24h when rain probability > 50% or rainfall >= 5 mm", () => {
      const moderateRain = { ...baseWeather, rainfallMmExpected: 8, rainProbability: 55 };
      const advisory = evaluateIrrigationAdvice(moderateRain, "optimal");

      expect(advisory.action).toBe("DELAY");
      expect(advisory.badgeColor).toBe("amber");
      expect(advisory.ruleUsed).toContain("TNAU Water Tech Rule 2");
      expect(advisory.ruleUsedTamil).toContain("TNAU விதி 2");
    });

    it("delays irrigation when soil is already saturated (wet)", () => {
      const dryWeather = { ...baseWeather, rainfallMmExpected: 0, rainProbability: 10 };
      const advisory = evaluateIrrigationAdvice(dryWeather, "wet");

      expect(advisory.action).toBe("DELAY");
      expect(advisory.ruleUsed).toContain("ICAR Soil Aeration Rule");
      expect(advisory.ruleUsedTamil).toContain("ICAR விதி");
    });

    it("recommends immediate irrigation when soil is dry and weather window is clear", () => {
      const dryWeather = { ...baseWeather, rainfallMmExpected: 0, rainProbability: 5 };
      const advisory = evaluateIrrigationAdvice(dryWeather, "dry");

      expect(advisory.action).toBe("IRRIGATE_NOW");
      expect(advisory.isRecommended).toBe(true);
      expect(advisory.badgeColor).toBe("blue");
      expect(advisory.ruleUsed).toContain("TNAU Crop Water Requirement Rule");
      expect(advisory.ruleUsedTamil).toContain("TNAU விதி");
    });

    it("maintains routine watering schedule under balanced moisture and calm skies", () => {
      const calmWeather = { ...baseWeather, rainfallMmExpected: 0, rainProbability: 10 };
      const advisory = evaluateIrrigationAdvice(calmWeather, "optimal");

      expect(advisory.action).toBe("MAINTAIN");
      expect(advisory.isRecommended).toBe(false);
      expect(advisory.ruleUsed).toContain("TNAU Maintenance Rule");
    });
  });

  describe("3. Offline Cached Forecast & Cache Age Calculation", () => {
    beforeEach(async () => {
      await db.cachedWeather.clear();
    });

    it("returns cached forecast with exact calculated age when in offline mode", async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
      await db.cachedWeather.put({
        district: "Coimbatore",
        data: baseWeather,
        source: "Open-Meteo (~11 km grid, Coimbatore)",
        fetched_at: twoHoursAgo,
        expires_at: new Date(Date.now() + 1 * 3600000).toISOString(),
        data_version: "v1.0",
        location: "Coimbatore",
        isOutdated: false
      });

      // Enable offline mode
      syncManager.toggleManualOffline(true);
      const result = await getLiveWeather("Coimbatore");
      syncManager.toggleManualOffline(false);

      expect(result.status).toBe("CACHED");
      expect(result.isOfflineCached).toBe(true);
      expect(result.cacheAgeMinutes).toBeGreaterThanOrEqual(119);
      expect(result.cacheAgeText).toContain("2h");
      expect(result.lastUpdatedLabel).toContain("Cached:");
    });
  });
});
