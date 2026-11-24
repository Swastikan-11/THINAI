// Tests for Uncertainty Scoring and Referral Policy
// Verifies entropy-based, margin-based, and combined uncertainty calculations
// and ensures high uncertainty demotes advice tier to TIER_3_INCONCLUSIVE.

import { describe, it, expect } from "vitest";
import {
  computeNormalizedEntropy,
  computeMarginUncertainty,
  computeCombinedUncertainty,
  assessUncertainty,
  applyUncertaintyDemotion,
} from "../src/services/uncertaintyService";
import { ADVICE_POLICY } from "../src/config/advicePolicy";

describe("Normalized Shannon Entropy", () => {
  it("returns 0 for empty or single-element distribution", () => {
    expect(computeNormalizedEntropy([])).toBe(0);
    expect(computeNormalizedEntropy([1.0])).toBe(0);
  });

  it("returns 0 (or near 0) for a completely certain distribution (one-hot)", () => {
    const entropy = computeNormalizedEntropy([1.0, 0.0, 0.0, 0.0]);
    expect(entropy).toBeCloseTo(0, 4);
  });

  it("returns 1 for a uniform distribution (maximum uncertainty)", () => {
    const uniform4 = [0.25, 0.25, 0.25, 0.25];
    const entropy = computeNormalizedEntropy(uniform4);
    expect(entropy).toBeCloseTo(1, 4);

    const uniform10 = Array(10).fill(0.1);
    expect(computeNormalizedEntropy(uniform10)).toBeCloseTo(1, 4);
  });

  it("returns an intermediate value for skewed distributions", () => {
    const skewed = [0.8, 0.1, 0.05, 0.05];
    const entropy = computeNormalizedEntropy(skewed);
    expect(entropy).toBeGreaterThan(0);
    expect(entropy).toBeLessThan(0.7);
  });
});

describe("Margin Uncertainty (1 - (top1 - top2))", () => {
  it("returns near 0 when top1 heavily dominates", () => {
    const clearWinner = [0.95, 0.03, 0.01, 0.01];
    const marginUncertainty = computeMarginUncertainty(clearWinner);
    // margin = 0.95 - 0.03 = 0.92 -> uncertainty = 1 - 0.92 = 0.08
    expect(marginUncertainty).toBeCloseTo(0.08, 2);
  });

  it("returns near 1 when top1 and top2 are in a close tie", () => {
    const closeTie = [0.46, 0.44, 0.05, 0.05];
    const marginUncertainty = computeMarginUncertainty(closeTie);
    // margin = 0.46 - 0.44 = 0.02 -> uncertainty = 1 - 0.02 = 0.98
    expect(marginUncertainty).toBeCloseTo(0.98, 2);
  });

  it("handles edge cases gracefully", () => {
    expect(computeMarginUncertainty([])).toBe(0);
    expect(computeMarginUncertainty([0.5])).toBe(0);
  });
});

describe("Combined Uncertainty Score", () => {
  it("combines entropy and margin scores with configured weights", () => {
    const probs = [0.70, 0.20, 0.05, 0.05];
    const combined = computeCombinedUncertainty(probs, {
      entropyWeight: 0.5,
      marginWeight: 0.5,
    });
    const ent = computeNormalizedEntropy(probs);
    const mar = computeMarginUncertainty(probs);
    expect(combined).toBeCloseTo((ent * 0.5 + mar * 0.5), 4);
  });

  it("returns 0 when both entropy and margin are disabled", () => {
    const probs = [0.5, 0.5];
    const zero = computeCombinedUncertainty(probs, {
      useEntropy: false,
      useMargin: false,
    });
    expect(zero).toBe(0);
  });
});

describe("assessUncertainty & applyUncertaintyDemotion", () => {
  const classes = ["Early_blight", "Late_blight", "healthy", "Leaf_Mold"];

  it("detects high uncertainty in close multi-class predictions and flags for demotion", () => {
    // 40% vs 38% -> very uncertain
    const closeProbs = [0.40, 0.38, 0.12, 0.10];
    const assessment = assessUncertainty(closeProbs, classes, "TIER_2_MODERATE");

    expect(assessment.isHighUncertainty).toBe(true);
    expect(assessment.shouldDemoteTier).toBe(true);
    expect(assessment.top3.length).toBe(3);
    expect(assessment.top3[0].label).toBe("Early_blight");
    expect(assessment.top3[1].label).toBe("Late_blight");

    // Applying demotion
    const result = applyUncertaintyDemotion("TIER_2_MODERATE", assessment);
    expect(result.finalTier).toBe("TIER_3_INCONCLUSIVE");
    expect(result.wasDemotedByUncertainty).toBe(true);
    expect(result.reason).toContain("Tier demoted");
  });

  it("does not demote when model is decisive (low uncertainty)", () => {
    const decisiveProbs = [0.88, 0.06, 0.04, 0.02];
    const assessment = assessUncertainty(decisiveProbs, classes, "TIER_2_MODERATE");

    expect(assessment.isHighUncertainty).toBe(false);
    expect(assessment.shouldDemoteTier).toBe(false);

    const result = applyUncertaintyDemotion("TIER_2_MODERATE", assessment);
    expect(result.finalTier).toBe("TIER_2_MODERATE");
    expect(result.wasDemotedByUncertainty).toBe(false);
  });

  it("leaves TIER_3 as TIER_3 without false demotion flag", () => {
    const closeProbs = [0.35, 0.34, 0.20, 0.11];
    const assessment = assessUncertainty(closeProbs, classes, "TIER_3_INCONCLUSIVE");

    // shouldDemoteTier is false because it's already TIER_3
    expect(assessment.shouldDemoteTier).toBe(false);

    const result = applyUncertaintyDemotion("TIER_3_INCONCLUSIVE", assessment);
    expect(result.finalTier).toBe("TIER_3_INCONCLUSIVE");
    expect(result.wasDemotedByUncertainty).toBe(false);
  });
});
