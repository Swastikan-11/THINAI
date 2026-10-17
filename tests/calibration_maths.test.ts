import { describe, it, expect } from "vitest";
import { 
  applyTemperatureScaling, 
  computeEce 
} from "../src/services/litertInferenceService";

describe("Calibration Mathematics (Temperature Scaling & ECE)", () => {
  it("Temperature scaling with T=1.0 preserves exact probabilities", () => {
    const rawProbs = [0.70, 0.20, 0.10];
    const scaled = applyTemperatureScaling(rawProbs, 1.0);
    expect(scaled[0]).toBeCloseTo(0.70, 3);
    expect(scaled[1]).toBeCloseTo(0.20, 3);
    expect(scaled[2]).toBeCloseTo(0.10, 3);
  });

  it("Temperature scaling with T > 1.0 softens peak confidence while preserving top-1 rank", () => {
    const rawProbs = [0.90, 0.07, 0.03];
    const scaled = applyTemperatureScaling(rawProbs, 1.28);

    // Peak probability is reduced
    expect(scaled[0]).toBeLessThan(rawProbs[0]);
    expect(scaled[0]).toBeGreaterThan(0.70);

    // Rank order is strictly preserved
    expect(scaled[0]).toBeGreaterThan(scaled[1]);
    expect(scaled[1]).toBeGreaterThan(scaled[2]);

    // Sum of probabilities remains 1.0
    const sum = scaled.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("Handles degenerate/edge temperature values gracefully", () => {
    const rawProbs = [0.8, 0.2];
    expect(applyTemperatureScaling(rawProbs, 0)).toEqual(rawProbs);
    expect(applyTemperatureScaling(rawProbs, -1.5)).toEqual(rawProbs);
    expect(applyTemperatureScaling([], 1.28)).toEqual([]);
  });

  it("computeEce returns 0 on empty input", () => {
    expect(computeEce([])).toBe(0);
  });

  it("computeEce evaluates to 0 for a perfectly calibrated predictor", () => {
    // 10 items with confidence 0.8 where exactly 8 are correct (accuracy = 0.8)
    const items = [
      { confidence: 0.8, isCorrect: true },
      { confidence: 0.8, isCorrect: true },
      { confidence: 0.8, isCorrect: true },
      { confidence: 0.8, isCorrect: true },
      { confidence: 0.8, isCorrect: true },
      { confidence: 0.8, isCorrect: true },
      { confidence: 0.8, isCorrect: true },
      { confidence: 0.8, isCorrect: true },
      { confidence: 0.8, isCorrect: false },
      { confidence: 0.8, isCorrect: false }
    ];

    const ece = computeEce(items, 10);
    expect(ece).toBeCloseTo(0.0, 3);
  });

  it("computeEce correctly penalizes overconfidence", () => {
    // 10 items with confidence 0.95 where only 5 are correct (accuracy = 0.50)
    // Absolute calibration gap = |0.50 - 0.95| = 0.45
    const items = Array.from({ length: 10 }, (_, i) => ({
      confidence: 0.95,
      isCorrect: i < 5
    }));

    const ece = computeEce(items, 10);
    expect(ece).toBeCloseTo(0.45, 2);
  });
});
