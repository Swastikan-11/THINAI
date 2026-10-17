import { describe, it, expect } from "vitest";
import { wilsonScoreInterval } from "../src/services/litertInferenceService";
import { calculateWilsonScore } from "../src/services/verdictService";

describe("Wilson Score 95% Confidence Interval Tests (Phase G)", () => {
  it("Handles zero total samples without division by zero", () => {
    const res1 = wilsonScoreInterval(0, 0);
    expect(res1.lower).toBe(0);
    expect(res1.center).toBe(0);
    expect(res1.upper).toBe(0);

    const res2 = calculateWilsonScore(0, 0);
    expect(res2.lower).toBe(0);
    expect(res2.center).toBe(0);
    expect(res2.upper).toBe(0);
  });

  it("Satisfies mathematical property: 0 <= lower <= center <= upper <= 1", () => {
    const cases = [
      { k: 1, n: 10 },
      { k: 8, n: 10 },
      { k: 19, n: 20 },
      { k: 50, n: 100 },
      { k: 95, n: 100 }
    ];

    for (const { k, n } of cases) {
      const w = wilsonScoreInterval(k, n, 1.96);
      expect(w.lower).toBeGreaterThanOrEqual(0);
      expect(w.lower).toBeLessThanOrEqual(w.center);
      expect(w.center).toBeLessThanOrEqual(w.upper);
      expect(w.upper).toBeLessThanOrEqual(1);

      const w2 = calculateWilsonScore(k, n, 1.96);
      expect(w2.lower).toBeCloseTo(w.lower, 4);
      expect(w2.center).toBeCloseTo(w.center, 4);
      expect(w2.upper).toBeCloseTo(w.upper, 4);
    }
  });

  it("Computes accurate interval for 8 successes in 10 verdicts (80% empirical)", () => {
    const res = calculateWilsonScore(8, 10, 1.96);
    // Wilson center with z=1.96: (0.8 + 1.96^2 / 20) / (1 + 1.96^2 / 10) = 0.99208 / 1.38416 = 0.7167
    expect(res.center).toBeCloseTo(0.7167, 2);
    expect(res.lower).toBeGreaterThan(0.44);
    expect(res.upper).toBeLessThan(0.97);
  });

  it("As sample size n approaches infinity, center approaches empirical proportion p", () => {
    const n = 10000;
    const k = 8000; // p = 0.80
    const res = calculateWilsonScore(k, n, 1.96);
    expect(res.center).toBeCloseTo(0.80, 3);
    // Margin shrinks to ~0.0078
    expect(res.upper - res.lower).toBeLessThan(0.02);
  });
});
