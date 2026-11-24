// THINAI Uncertainty Scoring Service
// Provides entropy-based and margin-based uncertainty measures
// to complement model confidence for safer diagnosis decisions.
//
// SAFETY: When uncertainty is high, the system routes to officer referral
// regardless of the top-1 confidence. This prevents overconfident misdiagnoses.

import { ADVICE_POLICY, type AdviceTier } from "../config/advicePolicy";

/**
 * Computes Shannon entropy of a probability distribution.
 * Higher entropy = more uncertain (predictions are spread across classes).
 * Returns a value in [0, 1] normalized by log(numClasses).
 */
export function computeNormalizedEntropy(probabilities: number[]): number {
  if (probabilities.length <= 1) return 0;

  const epsilon = 1e-12;
  const maxEntropy = Math.log(probabilities.length);
  if (maxEntropy === 0) return 0;

  let entropy = 0;
  for (const p of probabilities) {
    if (p > epsilon) {
      entropy -= p * Math.log(p);
    }
  }

  return Math.min(1, Math.max(0, entropy / maxEntropy));
}

/**
 * Computes margin-based uncertainty: 1 - (top1 - top2).
 * When top1 and top2 are close, uncertainty is high (close to 1).
 * When top1 dominates, uncertainty is low (close to 0).
 */
export function computeMarginUncertainty(probabilities: number[]): number {
  if (probabilities.length <= 1) return 0;

  const sorted = [...probabilities].sort((a, b) => b - a);
  const top1 = sorted[0] || 0;
  const top2 = sorted[1] || 0;
  const margin = top1 - top2;

  // Uncertainty = 1 - margin (high when gap is small)
  return Math.min(1, Math.max(0, 1 - margin));
}

/**
 * Combined uncertainty score using both entropy and margin.
 * Returns a score in [0, 1] where higher = more uncertain.
 */
export function computeCombinedUncertainty(
  probabilities: number[],
  options?: {
    useEntropy?: boolean;
    useMargin?: boolean;
    entropyWeight?: number;
    marginWeight?: number;
  }
): number {
  const useEntropy = options?.useEntropy ?? ADVICE_POLICY.USE_ENTROPY_UNCERTAINTY;
  const useMargin = options?.useMargin ?? ADVICE_POLICY.USE_MARGIN_UNCERTAINTY;
  const entropyWeight = options?.entropyWeight ?? 0.5;
  const marginWeight = options?.marginWeight ?? 0.5;

  if (!useEntropy && !useMargin) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  if (useEntropy) {
    weightedSum += entropyWeight * computeNormalizedEntropy(probabilities);
    totalWeight += entropyWeight;
  }

  if (useMargin) {
    weightedSum += marginWeight * computeMarginUncertainty(probabilities);
    totalWeight += marginWeight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export interface UncertaintyAssessment {
  /** Normalized Shannon entropy [0, 1] */
  entropy: number;
  /** Margin-based uncertainty [0, 1] */
  marginUncertainty: number;
  /** Combined uncertainty score [0, 1] */
  combinedScore: number;
  /** Whether the uncertainty exceeds the high threshold */
  isHighUncertainty: boolean;
  /** Top-3 predictions with probabilities */
  top3: { label: string; probability: number }[];
  /** Whether uncertainty should demote the tier */
  shouldDemoteTier: boolean;
  /** Human-readable uncertainty description */
  description: string;
}

/**
 * Performs a full uncertainty assessment on model output probabilities.
 *
 * @param probabilities - Full probability distribution from the model (all classes)
 * @param labels - Corresponding class labels
 * @param currentTier - The tier determined by confidence + evidence
 */
export function assessUncertainty(
  probabilities: number[],
  labels: string[],
  currentTier: AdviceTier
): UncertaintyAssessment {
  const entropy = computeNormalizedEntropy(probabilities);
  const marginUncertainty = computeMarginUncertainty(probabilities);
  const combinedScore = computeCombinedUncertainty(probabilities);

  const isHighUncertainty = combinedScore >= ADVICE_POLICY.UNCERTAINTY_HIGH_THRESHOLD;

  // Get top-3 predictions
  const indexed = probabilities.map((p, i) => ({ label: labels[i] || `class_${i}`, probability: p }));
  indexed.sort((a, b) => b.probability - a.probability);
  const top3 = indexed.slice(0, 3);

  // SAFETY: High uncertainty should demote to at least TIER_3
  // even if confidence is moderately high
  const shouldDemoteTier = isHighUncertainty && currentTier !== "TIER_3_INCONCLUSIVE";

  let description: string;
  if (combinedScore < 0.3) {
    description = "Low uncertainty — model predictions are concentrated on one class.";
  } else if (combinedScore < 0.5) {
    description = "Moderate uncertainty — consider confirming with additional observation.";
  } else if (combinedScore < 0.7) {
    description = "High uncertainty — multiple diseases have similar probability. Officer review recommended.";
  } else {
    description = "Very high uncertainty — model cannot reliably distinguish between classes. Officer referral required.";
  }

  return {
    entropy,
    marginUncertainty,
    combinedScore,
    isHighUncertainty,
    top3,
    shouldDemoteTier,
    description,
  };
}

/**
 * Applies uncertainty demotion to a tier.
 * If uncertainty is high, demotes to TIER_3 (officer referral).
 * This is a safety-critical function.
 */
export function applyUncertaintyDemotion(
  currentTier: AdviceTier,
  uncertaintyAssessment: UncertaintyAssessment
): {
  finalTier: AdviceTier;
  wasDemotedByUncertainty: boolean;
  reason: string;
} {
  if (uncertaintyAssessment.shouldDemoteTier) {
    return {
      finalTier: "TIER_3_INCONCLUSIVE",
      wasDemotedByUncertainty: true,
      reason: `Tier demoted from ${currentTier} to TIER_3 due to high uncertainty (score: ${(uncertaintyAssessment.combinedScore * 100).toFixed(1)}%). ${uncertaintyAssessment.description}`,
    };
  }

  return {
    finalTier: currentTier,
    wasDemotedByUncertainty: false,
    reason: `Uncertainty within acceptable range (score: ${(uncertaintyAssessment.combinedScore * 100).toFixed(1)}%).`,
  };
}
