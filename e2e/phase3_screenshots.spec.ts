import { test, expect } from "@playwright/test";

test.describe("Phase 3 Screenshots at 360x800", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__THINAI_TEST_USER__ = {
        uid: "test-farmer-uid-123",
        email: "selvam.murugan@testfarm.in",
        displayName: "Selvam Murugan"
      };
      localStorage.setItem("thinai_selected_language", "English");
      localStorage.setItem("thinai_auth_mode", "authenticated");
      localStorage.setItem(
        "thinai_farmer_profile",
        JSON.stringify({
          name: "Selvam Murugan",
          phone: "9876543210",
          email: "selvam.murugan@testfarm.in",
          village: "Kavundampalayam",
          district: "Coimbatore",
          stateName: "Tamil Nadu",
          farmSize: "3.5",
          soilType: "Red Loamy Soil",
          soilMoistureStatus: "optimal",
          primaryCrop: "Tomato",
          cropVariety: "Shivam F1 Hybrid",
          cropStage: "Flowering & Fruiting",
          sowingDate: "2026-08-15",
          irrigationType: "Drip Irrigation",
          farmingMethod: "Precision Natural",
          waterSource: "Open Well & Borewell",
          mainCrops: "Tomato, Pepper, Potato",
          language: "English"
        })
      );
      // Seed a scan into localStorage fallback for immediate rendering
      localStorage.setItem(
        "thinai_disease_scan_history",
        JSON.stringify([
          {
            diseaseName: "Tomato Early Blight",
            scientificName: "Alternaria solani",
            crop: "Tomato",
            confidence: 86.4,
            isReliable: true,
            severity: "High",
            symptoms: ["Concentric target spots on lower leaves", "Yellow chlorotic halo"],
            immediateAction: "Prune affected bottom leaves to arrest fungal sporulation.",
            preventiveMeasures: ["Apply organic straw mulch", "Avoid overhead foliar sprinkler irrigation"],
            timestamp: new Date().toISOString()
          }
        ])
      );
    });
  });

  test("Feature 1: Capture Scan History & Disease Library at 360x800", async ({ page }) => {
    await page.goto("/?screen=doctor");
    await page.waitForTimeout(1000);

    // Switch to Scan History tab
    const historyTab = page.getByRole("button", { name: /Scan History|ஸ்கேன் வரலாறு/i });
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: "docs/screenshots/feature1_scan_history.png", fullPage: true });

    // Navigate to Disease Library
    await page.goto("/?screen=library");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "docs/screenshots/feature1_disease_library.png", fullPage: true });
  });
});
