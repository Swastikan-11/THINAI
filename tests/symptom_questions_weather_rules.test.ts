// Tests for Symptom Questions Flow and Crop Weather Advisory Rule Engine
// SAFETY: Validates 3-question limit, offline availability, disease risk rules,
// spray window safety gates, and ensures weather NEVER claims to confirm disease.

import { describe, it, expect } from "vitest";
import {
  getSymptomQuestionsForCrop,
  evaluateSymptomAnswers,
} from "../src/services/symptomQuestionService";
import {
  evaluateCropWeatherAdvisory,
  WEATHER_DISEASE_DISCLAIMER,
} from "../src/services/cropWeatherAdvisoryService";
import { WeatherData } from "../src/services/weatherService";

describe("Symptom Question Flow (Feature 6)", () => {
  it("strictly returns at most 3 questions per crop", () => {
    const crops = ["Tomato", "Potato", "Pepper", "Corn", "Paddy"];
    for (const crop of crops) {
      const questions = getSymptomQuestionsForCrop(crop);
      expect(questions.length).toBeLessThanOrEqual(3);
      expect(questions.length).toBeGreaterThan(0);
    }
  });

  it("all questions and options provide both English and Tamil strings", () => {
    const questions = getSymptomQuestionsForCrop("Tomato");
    for (const q of questions) {
      expect(q.questionEn).toBeTruthy();
      expect(q.questionTa).toBeTruthy();
      for (const opt of q.options) {
        expect(opt.labelEn).toBeTruthy();
        expect(opt.labelTa).toBeTruthy();
        expect(Array.isArray(opt.supports)).toBe(true);
      }
    }
  });

  it("reduces uncertainty when symptom answers strongly align with model prediction", () => {
    const answers = {
      q1_plant_part: "leaves_lower",
      q2_lesion_appearance: "target_rings",
      q3_onset_weather: "warm_humid",
    };

    const evaluation = evaluateSymptomAnswers({
      crop: "Tomato",
      modelPrediction: "Tomato___Early_blight",
      answers,
      baselineUncertainty: 0.50,
    });

    expect(evaluation.agreementScore).toBe(1.0);
    expect(evaluation.updatedUncertainty).toBeLessThan(0.50);
    expect(evaluation.routeToOfficer).toBe(false);
  });

  it("increases uncertainty and routes to officer when symptoms contradict prediction", () => {
    const contradictoryAnswers = {
      q1_plant_part: "whole_plant", // Collapsed plant
      q2_lesion_appearance: "yellow_curling", // Virus curl
      q3_onset_weather: "after_flooding", // Flooding
    };

    const evaluation = evaluateSymptomAnswers({
      crop: "Tomato",
      modelPrediction: "Tomato___Early_blight", // Model thought it was early blight
      answers: contradictoryAnswers,
      baselineUncertainty: 0.45,
    });

    expect(evaluation.agreementScore).toBeLessThan(0.40);
    expect(evaluation.updatedUncertainty).toBeGreaterThan(0.45);
    expect(evaluation.routeToOfficer).toBe(true);
    expect(evaluation.recommendation).toContain("extension officer");
  });
});

describe("Crop Weather & Spray Window Advisory (Feature 7)", () => {
  const idealWeather: WeatherData = {
    isAvailable: true,
    status: "LIVE",
    temperature: 25,
    condition: "Clear",
    conditionIcon: "☀️",
    feelsLike: 26,
    humidity: 55,
    windSpeed: 8,
    rainProbability: 5,
    rainfallMmExpected: 0,
    uvIndex: 4,
    hourly: [],
    forecast7Day: [],
    alerts: [],
    updatedAt: "08:00 AM",
    lastUpdatedLabel: "Just now",
    source: "Open-Meteo",
  };

  it("detects favorable spray window under safe microclimate", () => {
    const advisory = evaluateCropWeatherAdvisory("Tomato", idealWeather);
    expect(advisory.sprayWindowVerdict).toBe("Favourable spray window");
    expect(advisory.isSpraySafe).toBe(true);
    expect(advisory.idealHours).toBeTruthy();
  });

  it("detects high disease risk when humidity, temperature, and rain align for fungal spread", () => {
    const blightWeather: WeatherData = {
      ...idealWeather,
      temperature: 22, // Fungal incubation range
      humidity: 88,    // > 80% threshold
      rainfallMmExpected: 12, // > 5mm threshold
      rainProbability: 75,
    };

    const advisory = evaluateCropWeatherAdvisory("Potato", blightWeather);
    expect(advisory.diseaseRiskVerdict).toBe("High disease risk — inspect crop and consult officer");
    expect(advisory.diseaseRiskScore).toBe("HIGH");
    expect(advisory.highRiskPathogens.some((p) => p.includes("Late Blight"))).toBe(true);
  });

  it("flags unsuitable spray window if wind exceeds safe threshold (drift risk)", () => {
    const windyWeather: WeatherData = {
      ...idealWeather,
      windSpeed: 22, // > 15 km/h safe limit
    };

    const advisory = evaluateCropWeatherAdvisory("Tomato", windyWeather);
    expect(advisory.sprayWindowVerdict).toBe("Unsuitable spray window");
    expect(advisory.isSpraySafe).toBe(false);
    expect(advisory.rulesTriggered.some((r) => r.includes("CIBRC Drift Rule"))).toBe(true);
  });

  it("flags unsuitable spray window if temperature exceeds volatilization threshold", () => {
    const scorchingWeather: WeatherData = {
      ...idealWeather,
      temperature: 38, // > 35°C limit
    };

    const advisory = evaluateCropWeatherAdvisory("Pepper", scorchingWeather);
    expect(advisory.sprayWindowVerdict).toBe("Unsuitable spray window");
    expect(advisory.isSpraySafe).toBe(false);
    expect(advisory.rulesTriggered.some((r) => r.includes("ICAR Volatilization Rule"))).toBe(true);
  });

  it("CRITICAL SAFETY INVARIANT: always includes explicit non-confirmation disclaimer", () => {
    const advisory = evaluateCropWeatherAdvisory("Paddy", idealWeather);
    expect(advisory.safetyDisclaimer).toBe(WEATHER_DISEASE_DISCLAIMER);
    expect(advisory.safetyDisclaimer).toContain("NEVER confirms disease");
  });

  it("preserves offline data status and cache age information", () => {
    const cachedWeather: WeatherData = {
      ...idealWeather,
      status: "CACHED",
      isOfflineCached: true,
      cacheAgeText: "45 minute(s) ago",
    };

    const advisory = evaluateCropWeatherAdvisory("Corn", cachedWeather);
    expect(advisory.dataFreshness.isOfflineData).toBe(true);
    expect(advisory.dataFreshness.cacheAgeText).toBe("45 minute(s) ago");
  });
});
