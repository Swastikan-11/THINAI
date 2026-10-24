import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("BUG-09: Weather Card Accessibility & Contrast Regression Tests", () => {
  const appPath = path.resolve(__dirname, "../src/app/App.tsx");
  const appCode = fs.readFileSync(appPath, "utf-8");

  it("should use accessible high-contrast text styling for advisory headers", () => {
    expect(appCode).toContain("text-[10px] font-extrabold uppercase tracking-wider text-gray-700");
  });

  it("should use text-gray-700 font-semibold for weather metrics to pass WCAG AA contrast", () => {
    expect(appCode).toContain("text-[10px] font-semibold text-gray-700");
  });

  it("should ensure weather refresh button has >=44px tap target and accessible label", () => {
    expect(appCode).toContain('aria-label="Refresh live weather forecast"');
    expect(appCode).toContain("min-h-[44px]");
  });
});
