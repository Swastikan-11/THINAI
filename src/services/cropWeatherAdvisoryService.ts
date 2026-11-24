// THINAI Crop-Specific Weather & Spray-Window Advisory Service (Feature 7)
// Integrates local weather observations with crop-specific microclimate thresholds.
//
// SAFETY INVARIANTS:
// 1. Weather data NEVER confirms pathogen presence. Weather indicates environmental favorability ONLY.
// 2. Pesticide doses are NEVER displayed unless the crop-disease pair is field-validated.
// 3. Transparent disclosure of the exact agronomic rule and threshold used.

import cropRulesData from "../data/cropWeatherRules.json";
import { WeatherData } from "./weatherService";

export type WeatherAdvisoryVerdict =
  | "High disease risk — inspect crop and consult officer"
  | "Monitor crop"
  | "Favourable spray window"
  | "Unsuitable spray window";

export interface CropWeatherAssessment {
  crop: string;
  diseaseRiskVerdict: "High disease risk — inspect crop and consult officer" | "Monitor crop";
  diseaseRiskScore: "HIGH" | "MODERATE" | "LOW";
  diseaseRiskDetails: string;
  highRiskPathogens: string[];
  sprayWindowVerdict: "Favourable spray window" | "Unsuitable spray window";
  isSpraySafe: boolean;
  sprayWindowDetails: string;
  idealHours: string;
  rulesTriggered: string[];
  dataFreshness: {
    status: "LIVE" | "CACHED" | "OFFLINE";
    cacheAgeText?: string;
    isOfflineData: boolean;
  };
  safetyDisclaimer: string;
}

export const WEATHER_DISEASE_DISCLAIMER =
  "Weather conditions indicate environmental pathogen favorability only. Weather data alone NEVER confirms disease infection.";

const rulesDb = (cropRulesData as any).rules;

/**
 * Returns crop-specific rules or defaults to Tomato.
 */
function getRulesForCrop(cropName: string) {
  const norm = (cropName || "Tomato").trim().toLowerCase();
  for (const [key, rules] of Object.entries(rulesDb)) {
    if (norm.includes(key.toLowerCase()) || key.toLowerCase().includes(norm)) {
      return rules as any;
    }
  }
  return rulesDb["Tomato"];
}

/**
 * Evaluates weather conditions against crop-specific agronomic rules.
 */
export function evaluateCropWeatherAdvisory(
  crop: string,
  weather: WeatherData
): CropWeatherAssessment {
  const rules = getRulesForCrop(crop);
  const dr = rules.diseaseRisk;
  const sw = rules.sprayWindow;

  const rulesTriggered: string[] = [];

  // 1. Check Data Freshness
  const isOfflineData = weather.status === "CACHED" || weather.status === "OFFLINE";
  const dataFreshness = {
    status: weather.status,
    cacheAgeText: weather.cacheAgeText || weather.lastUpdatedLabel,
    isOfflineData,
  };

  // 2. Disease Risk Evaluation
  let diseaseRiskScore: "HIGH" | "MODERATE" | "LOW" = "LOW";
  let diseaseRiskVerdict: "High disease risk — inspect crop and consult officer" | "Monitor crop" = "Monitor crop";
  let diseaseRiskDetails = dr.advisoryLowRisk;

  const humidityExceeded = weather.humidity >= dr.fungalHumidityThreshold;
  const tempInFungalRange = weather.temperature >= dr.fungalTempMin && weather.temperature <= dr.fungalTempMax;
  const rainExceeded = weather.rainfallMmExpected >= dr.rain48hThresholdMm || weather.rainProbability >= 60;

  if (humidityExceeded && tempInFungalRange && rainExceeded) {
    diseaseRiskScore = "HIGH";
    diseaseRiskVerdict = "High disease risk — inspect crop and consult officer";
    diseaseRiskDetails = dr.advisoryHighRisk;
    rulesTriggered.push(
      `Fungal Infection Index: High humidity (${weather.humidity}% >= ${dr.fungalHumidityThreshold}%), temperatures (${weather.temperature}°C within ${dr.fungalTempMin}-${dr.fungalTempMax}°C), and expected rain (${weather.rainfallMmExpected}mm >= ${dr.rain48hThresholdMm}mm).`
    );
  } else if (humidityExceeded || (tempInFungalRange && weather.rainProbability > 30)) {
    diseaseRiskScore = "MODERATE";
    diseaseRiskVerdict = "Monitor crop";
    diseaseRiskDetails = dr.advisoryModerateRisk;
    rulesTriggered.push("Moderate microclimate moisture: elevated relative humidity favorable for spore incubation.");
  } else {
    diseaseRiskScore = "LOW";
    diseaseRiskVerdict = "Monitor crop";
    diseaseRiskDetails = dr.advisoryLowRisk;
  }

  // 3. Spray Window Evaluation
  let isSpraySafe = true;
  let sprayUnsafeReason: string | null = null;

  if (!weather.isAvailable) {
    isSpraySafe = false;
    sprayUnsafeReason = "Weather data unavailable. Manual wind and sky inspection required before spraying.";
    rulesTriggered.push("Cold-start safety gate: Spraying unrecommended without live or cached weather observations.");
  } else if (weather.windSpeed > sw.maxWindSpeedKmh) {
    isSpraySafe = false;
    sprayUnsafeReason = `Wind speed (${weather.windSpeed} km/h) exceeds safe threshold (${sw.maxWindSpeedKmh} km/h). Severe droplet drift hazard.`;
    rulesTriggered.push(`CIBRC Drift Rule: Wind speed > ${sw.maxWindSpeedKmh} km/h.`);
  } else if (weather.rainProbability > sw.maxRainProbabilityPct || weather.rainfallMmExpected > sw.maxRainfallExpectedMm) {
    isSpraySafe = false;
    sprayUnsafeReason = `Imminent rain (${weather.rainProbability}% / ${weather.rainfallMmExpected}mm) will wash off applied spray within 4 hours.`;
    rulesTriggered.push(`TNAU Wash-off Rule: Rain probability > ${sw.maxRainProbabilityPct}% or rain > ${sw.maxRainfallExpectedMm}mm.`);
  } else if (weather.temperature > sw.maxTemperatureC) {
    isSpraySafe = false;
    sprayUnsafeReason = `High ambient temperature (${weather.temperature}°C > ${sw.maxTemperatureC}°C) causes rapid droplet volatilization and leaf scorch.`;
    rulesTriggered.push(`ICAR Volatilization Rule: Temperature > ${sw.maxTemperatureC}°C.`);
  } else if (weather.temperature < sw.minTemperatureC) {
    isSpraySafe = false;
    sprayUnsafeReason = `Low ambient temperature (${weather.temperature}°C < ${sw.minTemperatureC}°C) severely slows chemical absorption.`;
    rulesTriggered.push(`Low Temperature Rule: Temperature < ${sw.minTemperatureC}°C.`);
  }

  const sprayWindowVerdict: "Favourable spray window" | "Unsuitable spray window" = isSpraySafe
    ? "Favourable spray window"
    : "Unsuitable spray window";

  const sprayWindowDetails = isSpraySafe
    ? `Conditions favorable for application. ${sw.guidelines} Recommended spray hours: ${sw.idealSprayHours || sw.idealHours}.`
    : `Application not recommended: ${sprayUnsafeReason}`;

  return {
    crop: rules.crop,
    diseaseRiskVerdict,
    diseaseRiskScore,
    diseaseRiskDetails,
    highRiskPathogens: dr.highRiskDiseases || [],
    sprayWindowVerdict,
    isSpraySafe,
    sprayWindowDetails,
    idealHours: sw.idealSprayHours || sw.idealHours || "Morning / Late Afternoon",
    rulesTriggered,
    dataFreshness,
    safetyDisclaimer: WEATHER_DISEASE_DISCLAIMER,
  };
}
