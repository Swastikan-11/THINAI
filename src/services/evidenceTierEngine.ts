// THINAI Evidence-Graded Advice Tier Engine
// Combines the crop evidence registry with model confidence to determine
// what advice tier a diagnosis result should receive.
//
// SAFETY-CRITICAL: This module gates what advice farmers see.
// Every path must be conservative — when in doubt, route to officer referral.

import cropEvidenceData from "../data/cropEvidenceRegistry.json";
import {
  ADVICE_POLICY,
  type CropEvidenceEntry,
  type EvidenceLevel,
  type AdviceTier,
} from "../config/advicePolicy";

// Type assertion: JSON import matches our interface
const evidenceRegistry: CropEvidenceEntry[] = cropEvidenceData as CropEvidenceEntry[];

/**
 * Looks up the evidence entry for a given disease class label.
 * Falls back to crop-level general entry, then null.
 */
export function getEvidenceEntry(diseaseLabel: string, crop?: string): CropEvidenceEntry | null {
  // 1. Exact match on disease label
  const exactMatch = evidenceRegistry.find(
    (e) => e.disease === diseaseLabel
  );
  if (exactMatch) return exactMatch;

  // 2. Try matching by crop prefix in disease label (e.g., "Tomato___Early_blight" → crop "Tomato")
  const cropFromLabel = diseaseLabel.split("___")[0]?.replace(",_bell", "").replace(",", "").trim();
  if (cropFromLabel) {
    const cropMatch = evidenceRegistry.find(
      (e) => e.disease === diseaseLabel || (
        e.crop.toLowerCase() === cropFromLabel.toLowerCase() &&
        e.disease.includes(diseaseLabel.split("___")[1] || "")
      )
    );
    if (cropMatch) return cropMatch;
  }

  // 3. Fall back to crop-level general entry
  if (crop) {
    const generalMatch = evidenceRegistry.find(
      (e) => e.crop.toLowerCase() === crop.toLowerCase() && e.disease.includes("General")
    );
    if (generalMatch) return generalMatch;
  }

  // 4. No entry found — treat as UNSUPPORTED
  return null;
}

/**
 * Returns the evidence level for a disease class.
 * Missing entries default to UNSUPPORTED (most conservative).
 */
export function getEvidenceLevel(diseaseLabel: string, crop?: string): EvidenceLevel {
  const entry = getEvidenceEntry(diseaseLabel, crop);
  return entry?.evidenceLevel ?? "UNSUPPORTED";
}

/**
 * Returns the maximum allowed advice tier based on the evidence registry.
 * This is the ceiling — model confidence can only lower this, never raise it.
 */
export function getMaxAllowedTier(diseaseLabel: string, crop?: string): AdviceTier {
  const entry = getEvidenceEntry(diseaseLabel, crop);
  if (!entry) return "TIER_3_INCONCLUSIVE";
  return entry.allowedAdviceTier;
}

export interface AdviceTierDecision {
  /** The final advice tier after combining evidence and confidence */
  tier: AdviceTier;
  /** The evidence level from the registry */
  evidenceLevel: EvidenceLevel;
  /** The maximum tier allowed by the registry */
  maxAllowedTier: AdviceTier;
  /** The tier that confidence alone would produce */
  confidenceTier: AdviceTier;
  /** Whether chemical advice is permitted */
  chemicalAdviceAllowed: boolean;
  /** Human-readable reason for the decision */
  reason: string;
  /** Whether the result was demoted from what confidence alone would give */
  wasDemoted: boolean;
}

/**
 * Core decision function: determines the advice tier by combining
 * model confidence with the evidence registry.
 *
 * SAFETY RULES:
 * 1. The final tier is ALWAYS the MORE CONSERVATIVE of confidence-tier and evidence-tier.
 * 2. UNSUPPORTED evidence → TIER_3 always, regardless of confidence.
 * 3. LAB_ONLY evidence → TIER_2 maximum, even if confidence is very high.
 * 4. Chemical advice requires: FIELD_VALIDATED + TIER_1 + ALLOW_CHEMICAL_ADVICE global flag.
 * 5. If ALLOW_CHEMICAL_ADVICE is false, chemical advice is never permitted.
 *
 * @param calibratedConfidence - Post-temperature-scaling confidence (0 to 1)
 * @param diseaseLabel - Model's predicted disease class label
 * @param crop - Farmer's selected crop (optional, for fallback lookup)
 */
export function determineAdviceTier(
  calibratedConfidence: number,
  diseaseLabel: string,
  crop?: string
): AdviceTierDecision {
  // Step 1: Get evidence-based ceiling
  const evidenceLevel = getEvidenceLevel(diseaseLabel, crop);
  const maxAllowedTier = getMaxAllowedTier(diseaseLabel, crop);

  // Step 2: Determine confidence-based tier
  let confidenceTier: AdviceTier;
  if (calibratedConfidence >= ADVICE_POLICY.CONFIDENCE_HIGH_THRESHOLD) {
    confidenceTier = "TIER_1_CONFIDENT";
  } else if (calibratedConfidence >= ADVICE_POLICY.CONFIDENCE_MEDIUM_THRESHOLD) {
    confidenceTier = "TIER_2_MODERATE";
  } else {
    confidenceTier = "TIER_3_INCONCLUSIVE";
  }

  // Step 3: Take the MORE CONSERVATIVE of the two
  // Tier ordering: TIER_3 < TIER_2 < TIER_1 (TIER_3 is most restrictive)
  const tierRank: Record<AdviceTier, number> = {
    "TIER_3_INCONCLUSIVE": 0,
    "TIER_2_MODERATE": 1,
    "TIER_1_CONFIDENT": 2,
  };

  const finalTierRank = Math.min(tierRank[confidenceTier], tierRank[maxAllowedTier]);
  const tier = (Object.entries(tierRank).find(([, rank]) => rank === finalTierRank)?.[0] ??
    "TIER_3_INCONCLUSIVE") as AdviceTier;

  const wasDemoted = tierRank[confidenceTier] > tierRank[tier];

  // Step 4: Determine if chemical advice is allowed
  // SAFETY: ALL conditions must be true
  const chemicalAdviceAllowed =
    ADVICE_POLICY.ALLOW_CHEMICAL_ADVICE &&
    evidenceLevel === "FIELD_VALIDATED" &&
    tier === "TIER_1_CONFIDENT";

  // Step 5: Build human-readable reason
  let reason: string;
  if (evidenceLevel === "UNSUPPORTED") {
    reason = "This crop-disease pair is not supported by the current model. Please consult an extension officer.";
  } else if (evidenceLevel === "LAB_ONLY") {
    if (tier === "TIER_2_MODERATE") {
      reason = wasDemoted
        ? "Model confidence is high, but this diagnosis is based on laboratory data only (not field-validated). Chemical advice is withheld as a safety measure."
        : "Moderate confidence. Lab-only validation. Cultural advice provided; chemical advice withheld.";
    } else {
      reason = "Low confidence on a lab-only validated disease. Officer referral recommended.";
    }
  } else if (evidenceLevel === "FIELD_VALIDATED") {
    if (tier === "TIER_1_CONFIDENT") {
      reason = chemicalAdviceAllowed
        ? "High confidence on a field-validated crop-disease pair. Full advisory including chemical options."
        : "High confidence on a field-validated pair, but global chemical advice is currently disabled pending approval.";
    } else if (tier === "TIER_2_MODERATE") {
      reason = "Moderate confidence on a field-validated pair. Cultural advice only.";
    } else {
      reason = "Low confidence. Officer referral recommended despite field validation.";
    }
  } else {
    reason = "Unknown evidence level. Defaulting to officer referral.";
  }

  return {
    tier,
    evidenceLevel,
    maxAllowedTier,
    confidenceTier,
    chemicalAdviceAllowed,
    reason,
    wasDemoted,
  };
}

/**
 * Returns all entries in the evidence registry.
 * Used by admin/officer views to display coverage status.
 */
export function getAllEvidenceEntries(): CropEvidenceEntry[] {
  return [...evidenceRegistry];
}

/**
 * Returns evidence entries filtered by evidence level.
 */
export function getEntriesByLevel(level: EvidenceLevel): CropEvidenceEntry[] {
  return evidenceRegistry.filter((e) => e.evidenceLevel === level);
}

/**
 * Returns a summary of the evidence registry.
 */
export function getRegistrySummary(): {
  total: number;
  fieldValidated: number;
  labOnly: number;
  unsupported: number;
} {
  return {
    total: evidenceRegistry.length,
    fieldValidated: evidenceRegistry.filter((e) => e.evidenceLevel === "FIELD_VALIDATED").length,
    labOnly: evidenceRegistry.filter((e) => e.evidenceLevel === "LAB_ONLY").length,
    unsupported: evidenceRegistry.filter((e) => e.evidenceLevel === "UNSUPPORTED").length,
  };
}
