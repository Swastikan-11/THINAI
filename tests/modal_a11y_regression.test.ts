import { describe, it, expect } from "vitest";
import fs from "fs";

describe("Regression Test: BUG-03 - Modal Close Buttons Accessible Name & 44px Touch Target", () => {
  it("should enforce aria-label and min 44px touch targets on FarmRecordsScreen modal close buttons", () => {
    const recordsSource = fs.readFileSync("src/app/components/FarmRecordsScreen.tsx", "utf8");
    expect(recordsSource).toContain('aria-label="Close plot modal"');
    expect(recordsSource).toContain('aria-label="Close spray modal"');
    expect(recordsSource).toContain('aria-label="Close expense modal"');
    expect(recordsSource).toContain("min-w-[44px] min-h-[44px]");
  });

  it("should enforce aria-label and min 44px touch target on App.tsx notification modal close button", () => {
    const appSource = fs.readFileSync("src/app/App.tsx", "utf8");
    expect(appSource).toContain('aria-label="Close notifications modal"');
    expect(appSource).toContain("min-w-[44px] min-h-[44px]");
  });
});
