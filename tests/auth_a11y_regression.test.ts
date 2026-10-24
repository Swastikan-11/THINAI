import { describe, it, expect } from "vitest";
import fs from "fs";

describe("Regression Test: BUG-01 & BUG-02 - AuthScreens Accessibility & Contrast", () => {
  const authSource = fs.readFileSync("src/app/components/AuthScreens.tsx", "utf8");

  it("should have aria-label and min 44px touch target on password toggle button", () => {
    expect(authSource).toContain('aria-label={showPassword ? "Hide password" : "Show password"}');
    expect(authSource).toContain("min-w-[44px]");
    expect(authSource).toContain("min-h-[44px]");
  });

  it("should not have low-contrast text-gray-400 for orContinueWith divider", () => {
    // text-gray-400 on light bg fails WCAG AA (2.41:1). Must be text-gray-700 or darker.
    expect(authSource).not.toContain('text-[11px] font-medium text-gray-400 uppercase');
    expect(authSource).toContain('text-[11px] font-semibold text-gray-700 uppercase');
  });

  it("should have min 44px touch target on register and sign-in footer navigation links", () => {
    expect(authSource).toContain('min-h-[44px] inline-flex items-center');
  });
});
