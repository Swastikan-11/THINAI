import { describe, it, expect } from "vitest";
import fs from "fs";

describe("Regression Test: BUG-06 - Farm Records Plot & Expense Positive Numerical Validation", () => {
  const recordsSource = fs.readFileSync("src/app/components/FarmRecordsScreen.tsx", "utf8");

  it("should validate plot area is greater than 0 before saving", () => {
    expect(recordsSource).toContain("if (!newPlot.name.trim() || isNaN(area) || area <= 0)");
  });

  it("should validate expense amount is greater than 0 before saving", () => {
    expect(recordsSource).toContain("if (isNaN(amount) || amount <= 0)");
  });
});
