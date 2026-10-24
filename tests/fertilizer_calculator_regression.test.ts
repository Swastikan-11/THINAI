import { describe, it, expect } from "vitest";
import fs from "fs";

describe("Regression Test: BUG-04 - Fertilizer Calculator Input Safety & Positive Clamping", () => {
  const calcSource = fs.readFileSync("src/app/components/FertilizerCalculatorScreen.tsx", "utf8");

  it("should clamp acreage calculation to safe positive values", () => {
    expect(calcSource).toContain("safeArea");
    expect(calcSource).toContain("Math.max(0.1,");
  });

  it("should clamp onChange input values to positive minimum 0.1", () => {
    expect(calcSource).toContain("setArea(isNaN(val) ? 0.1 : Math.max(0.1, val))");
  });
});
