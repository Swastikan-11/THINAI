import { describe, it, expect } from "vitest";
import fs from "fs";

describe("Regression Test: BUG-05 - Main Landmark WCAG Accessibility", () => {
  it("should contain role='main' landmark wrapping the primary screen router", () => {
    const appSource = fs.readFileSync("src/app/App.tsx", "utf8");
    expect(appSource).toContain('<main className="flex-1 overflow-hidden" role="main">');
    expect(appSource).toContain("</main>");
  });
});
