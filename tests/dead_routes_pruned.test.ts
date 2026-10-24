import { describe, it, expect } from "vitest";
import fs from "fs";

describe("Phase 3 - Feature 6: Pruning Dead Screens, Buttons & Fabricated Data", () => {
  it("should confirm docs/REMOVED.md exists and documents pruned dead routes", () => {
    expect(fs.existsSync("docs/REMOVED.md")).toBe(true);
    const content = fs.readFileSync("docs/REMOVED.md", "utf8");
    expect(content).toContain("DEFAULT_P2P_EQUIPMENT");
    expect(content).toContain("notifications");
    expect(content).toContain('"reports"');
  });

  it("should ensure type Screen has no dead prototype routes (reports, settings, help, voice, weather)", () => {
    const appSource = fs.readFileSync("src/app/App.tsx", "utf8");
    const screenTypeMatch = appSource.match(/export type Screen =([\s\S]*?);/);
    expect(screenTypeMatch).toBeTruthy();
    const typeDef = screenTypeMatch![1];

    expect(typeDef).not.toContain('"reports"');
    expect(typeDef).not.toContain('"settings"');
    expect(typeDef).not.toContain('"help"');
    expect(typeDef).not.toContain('"voice"');
    expect(typeDef).not.toContain('"weather"');
  });

  it("should ensure the header notification bell does not navigate to undefined screen", () => {
    const appSource = fs.readFileSync("src/app/App.tsx", "utf8");
    expect(appSource).not.toContain('navigate("notifications")');
    expect(appSource).toContain("setShowNotifications(true)");
  });

  it("should confirm FarmServicesScreen has zero fake sample equipment listings", () => {
    const servicesSource = fs.readFileSync("src/app/components/FarmServicesScreen.tsx", "utf8");
    expect(servicesSource).not.toContain("sample-p2p-1");
    expect(servicesSource).not.toContain("Sample Owner / மாதிரி உரிமையாளர்");
    expect(servicesSource).not.toContain("Demo Reference Only");
  });
});
