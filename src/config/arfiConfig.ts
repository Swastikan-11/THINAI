// THINAI ARFI (Agricultural Resilience & Fragility Index) Configuration
// Ground Rule: Heuristic index (not trained on yield data).
// Weights and scoring parameters are centralized here.

export interface ArfiWeights {
  dataReliability: number;     // R_data: Weight for input freshness and provenance
  modelConfidence: number;     // C_model: Weight for rule/decision engine confidence
  predictionUncertainty: number; // U_pred: Weight for microclimate variability
  sensitivityShift: number;    // S_sens: Weight for stress test deviation
  weatherStress: number;       // R_stress: Weight for rainfall/temp stress
  economicRisk: number;        // D_risk: Weight for market price volatility
}

export const ARFI_CONFIG = {
  version: "1.0-heuristic",
  labelEn: "Heuristic Index (not trained on yield data)",
  labelTa: "கருதுகோள் குறியீடு (விளைச்சல் தரவுகளில் பயிற்றுவிக்கப்படவில்லை)",
  descriptionEn: "Mathematical sensitivity index measuring decision robustness against weather and economic shifts. Not calibrated on historical harvest yield datasets.",
  descriptionTa: "வானிலை மற்றும் பொருளாதார மாற்றங்களுக்கு எதிரான முடிவுகளின் ஸ்திரத்தன்மையை மதிப்பிடும் கணக்கீட்டுக் குறியீடு. இது கள விளைச்சல் தரவுகளால் பயிற்றுவிக்கப்பட்ட மாதிரி அல்ல.",

  // Formulation weights: Sum to 1.00
  weights: {
    dataReliability: 0.20,
    modelConfidence: 0.20,
    predictionUncertainty: 0.15,
    sensitivityShift: 0.15,
    weatherStress: 0.15,
    economicRisk: 0.15,
  } as ArfiWeights,

  // Benchmark baseline score
  baselineScore: 68,
  baselineStability: "MODERATE" as "STABLE" | "MODERATE" | "FRAGILE",

  // Fragility classification thresholds
  thresholds: {
    stableMax: 0.35,      // Fragility <= 0.35 -> STABLE
    moderateMax: 0.65,    // Fragility <= 0.65 -> MODERATE
    fragileMin: 0.65,     // Fragility > 0.65  -> FRAGILE
  }
};
