import { describe, it, expect } from "vitest";
import { 
  getConfidenceGatedTier, 
  assignTierRemedies 
} from "../src/services/litertInferenceService";

describe("Confidence-Gated Selective Advisory Engine (Phase G)", () => {
  const TAU_HIGH = 0.78;
  const TAU_LOW = 0.45;

  it("assigns Tier 1 (Confident Diagnosis) when confidence >= tau_high", () => {
    expect(getConfidenceGatedTier(0.78, TAU_HIGH, TAU_LOW)).toBe("TIER_1_CONFIDENT");
    expect(getConfidenceGatedTier(0.85, TAU_HIGH, TAU_LOW)).toBe("TIER_1_CONFIDENT");
    expect(getConfidenceGatedTier(0.99, TAU_HIGH, TAU_LOW)).toBe("TIER_1_CONFIDENT");
  });

  it("assigns Tier 2 (Moderate Uncertainty) when tau_low <= confidence < tau_high", () => {
    expect(getConfidenceGatedTier(0.45, TAU_HIGH, TAU_LOW)).toBe("TIER_2_MODERATE");
    expect(getConfidenceGatedTier(0.60, TAU_HIGH, TAU_LOW)).toBe("TIER_2_MODERATE");
    expect(getConfidenceGatedTier(0.779, TAU_HIGH, TAU_LOW)).toBe("TIER_2_MODERATE");
  });

  it("assigns Tier 3 (Inconclusive) when confidence < tau_low", () => {
    expect(getConfidenceGatedTier(0.449, TAU_HIGH, TAU_LOW)).toBe("TIER_3_INCONCLUSIVE");
    expect(getConfidenceGatedTier(0.30, TAU_HIGH, TAU_LOW)).toBe("TIER_3_INCONCLUSIVE");
    expect(getConfidenceGatedTier(0.05, TAU_HIGH, TAU_LOW)).toBe("TIER_3_INCONCLUSIVE");
  });

  it("Tier 1 allows chemical treatment recommendations", () => {
    const rawChemicals = ["Mancozeb 75% WP @ 2g/L", "Copper Oxychloride @ 2.5g/L"];
    const rawOrganics = ["Neem cake @ 100kg/acre", "Trichoderma viride @ 2.5kg/ha"];
    
    const assigned = assignTierRemedies(
      "TIER_1_CONFIDENT",
      rawOrganics,
      rawChemicals,
      "Tomato Early Blight"
    );

    expect(assigned.chemicalTreatment.length).toBeGreaterThan(0);
    expect(assigned.chemicalTreatment).toEqual(rawChemicals);
    expect(assigned.organicTreatment).toEqual(rawOrganics);
  });

  it("Tier 2 strictly suppresses all chemical treatments while retaining cultural remedies", () => {
    const rawChemicals = ["Mancozeb 75% WP @ 2g/L", "Hexaconazole 5% EC @ 1ml/L"];
    const rawOrganics = ["Remove affected lower leaves", "Improve air circulation"];
    
    const assigned = assignTierRemedies(
      "TIER_2_MODERATE",
      rawOrganics,
      rawChemicals,
      "Tomato Early Blight"
    );

    expect(assigned.chemicalTreatment).toEqual([]);
    expect(assigned.organicTreatment.length).toBeGreaterThan(0);
    expect(assigned.tipsForRetake?.length).toBeGreaterThan(0);
  });

  it("Tier 3 completely suppresses chemical and organic disease claims", () => {
    const rawChemicals = ["Streptocycline 100ppm"];
    const rawOrganics = ["Pseudomonas fluorescens"];
    
    const assigned = assignTierRemedies(
      "TIER_3_INCONCLUSIVE",
      rawOrganics,
      rawChemicals,
      "Tomato Bacterial Spot"
    );

    expect(assigned.chemicalTreatment).toEqual([]);
    expect(assigned.organicTreatment).toEqual([]);
    expect(assigned.immediateAction).toContain("Extension Officer");
  });

  it("PROPERTY TEST: Across 200 pseudo-random inputs, NO chemical recommendation is ever produced when confidence < tau_high", () => {
    let rng = 123456789;
    function rand() {
      rng = (1103515245 * rng + 12345) & 0x7fffffff;
      return rng / 0x7fffffff;
    }

    const testChemicals = ["Chlorothalonil @ 2g/L", "Metalaxyl @ 2.5g/L"];
    const testOrganics = ["Mulch bare soil", "Avoid overhead sprinkler irrigation"];

    for (let trial = 0; trial < 200; trial++) {
      const conf = rand(); // [0, 1]
      const tier = getConfidenceGatedTier(conf, TAU_HIGH, TAU_LOW);
      const remedies = assignTierRemedies(tier, testOrganics, testChemicals, "Test Pathology");

      if (conf < TAU_HIGH) {
        expect(remedies.chemicalTreatment.length).toBe(0);
      } else {
        expect(remedies.chemicalTreatment.length).toBeGreaterThan(0);
      }
    }
  });

  it("disables Tier 1 when G4 field validation is not passed", () => {
    expect(getConfidenceGatedTier(0.95, TAU_HIGH, TAU_LOW, true)).toBe("TIER_2_MODERATE");
    expect(getConfidenceGatedTier(0.50, TAU_HIGH, TAU_LOW, true)).toBe("TIER_2_MODERATE");
    expect(getConfidenceGatedTier(0.20, TAU_HIGH, TAU_LOW, true)).toBe("TIER_3_INCONCLUSIVE");
  });
});
