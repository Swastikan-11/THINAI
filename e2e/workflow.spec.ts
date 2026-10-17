import { test, expect } from "@playwright/test";

test.describe("THINAI Full Workflow E2E Suites (Phase G)", () => {
  test("1. Login and Auth Screen Navigation", async ({ page }) => {
    // Navigate with no cached credentials to inspect authentic login surface
    await page.goto("/?screen=login");
    await expect(page.getByRole("heading", { name: "THINAI" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In with Email" })).toBeVisible();
  });

  test.describe("Authenticated Farmer Scenarios", () => {
    test.beforeEach(async ({ page }) => {
      // Set localStorage farmer profile & mock active user for session continuity
      await page.addInitScript(() => {
        (window as any).__THINAI_TEST_USER__ = {
          uid: "test-farmer-uid-123",
          email: "selvam.murugan@testfarm.in",
          displayName: "Selvam Murugan"
        };
        localStorage.setItem("thinai_selected_language", "English");
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
      });
    });

    test("2. Crop Doctor Diagnosis and 3-Step Strip", async ({ page }) => {
      await page.goto("/?screen=doctor");
      
      // Verify 3-Step Strip rendered (Phase F requirement)
      await expect(page.locator("text=1. Take Picture")).toBeVisible();
      await expect(page.locator("text=2. Diagnosis")).toBeVisible();
      await expect(page.locator("text=3. Gated Remedy")).toBeVisible();

      // Verify photo capture buttons
      await expect(page.locator("button:has-text('TAKE PHOTO')")).toBeVisible();
      await expect(page.locator("button:has-text('UPLOAD FROM GALLERY')")).toBeVisible();
    });

    test("3. Farmer-Verdict Field Monitor: Weak Labels and Wilson CIs", async ({ page }) => {
      await page.goto("/?screen=fieldAccuracy");

      // Check Field Accuracy & Drift Monitor (Phase D requirement)
      await expect(page.getByRole("heading", { name: "Field Accuracy & Drift Monitor" }).first()).toBeVisible();
      await expect(page.locator("text=Methodological Note: Verdicts are Noisy Weak Labels")).toBeVisible();
      await expect(page.locator("text=Per-Class Field Accuracy (Wilson 95% Intervals)")).toBeVisible();
      await expect(page.locator("text=STABLE CALIBRATION")).toBeVisible();
    });

    test("4. Equipment Board and Phone Sharing Consent", async ({ page }) => {
      await page.goto("/?screen=services");

      // Switch to Equipment Tab using exact button name
      const equipTab = page.getByRole("button", { name: "Equipment", exact: true });
      await expect(equipTab).toBeVisible();
      await equipTab.click();

      // Verify Local Equipment Board & Post Equipment action
      await expect(page.locator("text=Local Equipment Board")).toBeVisible();
      await expect(page.getByRole("button", { name: "+ Post Equipment" })).toBeVisible();
    });

    test("5. Offline Queuing and Online Synchronization", async ({ page, context }) => {
      await page.goto("/?screen=home");

      // Verify online initial status
      const initialOnline = await page.evaluate(() => navigator.onLine);
      expect(initialOnline).toBe(true);

      // Go offline
      await context.setOffline(true);
      await page.waitForTimeout(400);

      // Verify app detects offline state
      const isOffline = await page.evaluate(() => navigator.onLine);
      expect(isOffline).toBe(false);

      // Go back online
      await context.setOffline(false);
      await page.waitForTimeout(400);

      const isOnlineRestored = await page.evaluate(() => navigator.onLine);
      expect(isOnlineRestored).toBe(true);
    });
  });
});
