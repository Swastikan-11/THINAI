// THINAI Advice Policy Configuration
// Central configuration for confidence thresholds, uncertainty gating,
// and evidence-level-based advice tier decisions.
//
// SAFETY: These thresholds control what advice farmers see.
// Do NOT lower thresholds or enable chemical advice without field validation evidence.

/** Evidence levels for crop-disease pairs */
export type EvidenceLevel = "FIELD_VALIDATED" | "LAB_ONLY" | "UNSUPPORTED";

/** Advice tiers — determines what information is shown to the farmer */
export type AdviceTier = "TIER_1_CONFIDENT" | "TIER_2_MODERATE" | "TIER_3_INCONCLUSIVE";

/** Review statuses for evidence registry entries */
export type ReviewStatus =
  | "FIELD_REVIEWED"
  | "UNREVIEWED"
  | "CANDIDATE"
  | "NOT_STARTED"
  | "WITHDRAWN";

/**
 * Advice policy thresholds.
 * All values should be treated as immutable at runtime.
 * Changes require a code review and owner approval.
 */
export const ADVICE_POLICY = {
  /** Model confidence threshold for TIER_1 (specific diagnosis + all remedies) */
  CONFIDENCE_HIGH_THRESHOLD: 0.78,

  /** Model confidence threshold for TIER_2 (cultural advice only, no chemicals) */
  CONFIDENCE_MEDIUM_THRESHOLD: 0.45,

  /**
   * Uncertainty threshold above which the result is demoted to officer referral.
   * Computed as: 1 - (top1_prob - top2_prob), i.e. high when top predictions are close.
   */
  UNCERTAINTY_HIGH_THRESHOLD: 0.70,

  /**
   * Minimum field sample count for a crop-disease pair to qualify as FIELD_VALIDATED.
   * Below this, even if field accuracy is measured, evidence remains LAB_ONLY.
   */
  MINIMUM_FIELD_SAMPLE_COUNT: 50,

  /**
   * Maximum allowed ECE (Expected Calibration Error) for field-validated status.
   * Above this, the crop-disease pair must be recalibrated before FIELD_VALIDATED.
   */
  MAXIMUM_FIELD_ECE: 0.15,

  /**
   * Global flag: whether chemical advice is allowed for FIELD_VALIDATED + TIER_1 results.
   * SAFETY: Must be false until at least one crop-disease pair is field-validated.
   */
  ALLOW_CHEMICAL_ADVICE: false,

  /**
   * When true, entropy-based uncertainty scoring is used in addition to confidence.
   */
  USE_ENTROPY_UNCERTAINTY: true,

  /**
   * When true, margin-based uncertainty (top1 - top2 gap) is used.
   */
  USE_MARGIN_UNCERTAINTY: true,
} as const;

export type AdvicePolicyConfig = typeof ADVICE_POLICY;

/**
 * Crop evidence registry entry shape.
 * This matches the JSON schema in src/data/cropEvidenceRegistry.json.
 */
export interface CropEvidenceEntry {
  crop: string;
  disease: string;
  modelVersion: string;
  trainingDataset: string;
  evidenceLevel: EvidenceLevel;
  fieldSampleCount: number;
  fieldAccuracy: number | null;
  fieldECE: number | null;
  allowedAdviceTier: AdviceTier;
  lastReviewedDate: string;
  reviewStatus: ReviewStatus | string;
  notes: string;
}

/**
 * Validates a single crop evidence entry.
 * Returns an array of validation error messages (empty = valid).
 */
export function validateEvidenceEntry(entry: CropEvidenceEntry): string[] {
  const errors: string[] = [];

  if (!entry.crop || typeof entry.crop !== "string") {
    errors.push("crop is required and must be a string");
  }
  if (!entry.disease || typeof entry.disease !== "string") {
    errors.push("disease is required and must be a string");
  }

  const validEvidenceLevels: EvidenceLevel[] = ["FIELD_VALIDATED", "LAB_ONLY", "UNSUPPORTED"];
  if (!validEvidenceLevels.includes(entry.evidenceLevel)) {
    errors.push(`evidenceLevel must be one of: ${validEvidenceLevels.join(", ")}`);
  }

  const validTiers: AdviceTier[] = ["TIER_1_CONFIDENT", "TIER_2_MODERATE", "TIER_3_INCONCLUSIVE"];
  if (!validTiers.includes(entry.allowedAdviceTier)) {
    errors.push(`allowedAdviceTier must be one of: ${validTiers.join(", ")}`);
  }

  // SAFETY: UNSUPPORTED evidence must map to TIER_3
  if (entry.evidenceLevel === "UNSUPPORTED" && entry.allowedAdviceTier !== "TIER_3_INCONCLUSIVE") {
    errors.push("UNSUPPORTED evidence level must have allowedAdviceTier = TIER_3_INCONCLUSIVE");
  }

  // SAFETY: LAB_ONLY evidence must NOT allow TIER_1 (no chemical advice)
  if (entry.evidenceLevel === "LAB_ONLY" && entry.allowedAdviceTier === "TIER_1_CONFIDENT") {
    errors.push("LAB_ONLY evidence level must not allow TIER_1_CONFIDENT (would enable chemical advice)");
  }

  // SAFETY: FIELD_VALIDATED requires minimum sample count
  if (entry.evidenceLevel === "FIELD_VALIDATED") {
    if (entry.fieldSampleCount < ADVICE_POLICY.MINIMUM_FIELD_SAMPLE_COUNT) {
      errors.push(
        `FIELD_VALIDATED requires fieldSampleCount >= ${ADVICE_POLICY.MINIMUM_FIELD_SAMPLE_COUNT}, got ${entry.fieldSampleCount}`
      );
    }
    if (entry.fieldAccuracy === null) {
      errors.push("FIELD_VALIDATED requires a measured fieldAccuracy (not null)");
    }
    if (entry.fieldECE !== null && entry.fieldECE > ADVICE_POLICY.MAXIMUM_FIELD_ECE) {
      errors.push(
        `FIELD_VALIDATED requires fieldECE <= ${ADVICE_POLICY.MAXIMUM_FIELD_ECE}, got ${entry.fieldECE}`
      );
    }
  }

  if (typeof entry.fieldSampleCount !== "number" || entry.fieldSampleCount < 0) {
    errors.push("fieldSampleCount must be a non-negative number");
  }

  return errors;
}

/**
 * Validates the entire evidence registry.
 * Returns a map of { "crop/disease": errors[] } for entries with issues.
 */
export function validateRegistry(
  entries: CropEvidenceEntry[]
): Record<string, string[]> {
  const results: Record<string, string[]> = {};
  const seen = new Set<string>();

  for (const entry of entries) {
    const key = `${entry.crop}/${entry.disease}`;

    // Check for duplicates
    if (seen.has(key)) {
      results[key] = [...(results[key] || []), `Duplicate entry for ${key}`];
    }
    seen.add(key);

    const errors = validateEvidenceEntry(entry);
    if (errors.length > 0) {
      results[key] = [...(results[key] || []), ...errors];
    }
  }

  return results;
}
