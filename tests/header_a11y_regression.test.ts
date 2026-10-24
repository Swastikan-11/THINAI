import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("BUG-08: Header & App Shell Accessibility Regression Tests", () => {
  const appPath = path.resolve(__dirname, "../src/app/App.tsx");
  const syncStatusPath = path.resolve(__dirname, "../src/app/components/SyncStatusBar.tsx");
  const appCode = fs.readFileSync(appPath, "utf-8");
  const syncStatusCode = fs.readFileSync(syncStatusPath, "utf-8");

  it("should ensure language switch button accessible name includes visible text (WCAG 2.5.3)", () => {
    expect(appCode).toContain('aria-label="EN | தமிழ் - Toggle language"');
    expect(appCode).toContain("min-h-[44px]");
  });

  it("should ensure notification bell button has discernible accessible name and >=44px tap target", () => {
    expect(appCode).toContain('aria-label={lang === "Tamil" ? "அறிவிப்புகள்" : "Notifications"}');
    expect(appCode).toContain("min-w-[44px] min-h-[44px]");
  });

  it("should provide an accessible h1 heading on the primary application view", () => {
    expect(appCode).toContain('<h1 className="sr-only">THINAI Agriculture Operating System</h1>');
  });

  it("should ensure SyncStatusBar offline toggle has >=44px tap target and accessible label", () => {
    expect(syncStatusCode).toContain('aria-label={`${isOffline ? "Offline • ஆஃப்லைன்" : "Online • இணைப்பில்"} - Click to toggle mode`}');
    expect(syncStatusCode).toContain("min-h-[44px]");
  });

  it("should ensure AI voice and send buttons have discernible aria-labels and >=44px targets", () => {
    expect(appCode).toContain('aria-label={isListening ? "Stop voice listening" : "Start voice listening"}');
    expect(appCode).toContain('aria-label="Send query"');
  });
});
