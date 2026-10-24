import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const ALL_23_LANGUAGES = [
  { code: "en", name: "English", rtl: false },
  { code: "as", name: "Assamese", rtl: false },
  { code: "bn", name: "Bengali", rtl: false },
  { code: "brx", name: "Bodo", rtl: false },
  { code: "doi", name: "Dogri", rtl: false },
  { code: "gu", name: "Gujarati", rtl: false },
  { code: "hi", name: "Hindi", rtl: false },
  { code: "kn", name: "Kannada", rtl: false },
  { code: "ks", name: "Kashmiri", rtl: true },
  { code: "kok", name: "Konkani", rtl: false },
  { code: "mai", name: "Maithili", rtl: false },
  { code: "ml", name: "Malayalam", rtl: false },
  { code: "mni", name: "Manipuri", rtl: false },
  { code: "mr", name: "Marathi", rtl: false },
  { code: "ne", name: "Nepali", rtl: false },
  { code: "or", name: "Odia", rtl: false },
  { code: "pa", name: "Punjabi", rtl: false },
  { code: "sa", name: "Sanskrit", rtl: false },
  { code: "sat", name: "Santali", rtl: false },
  { code: "sd", name: "Sindhi", rtl: true },
  { code: "ta", name: "Tamil", rtl: false },
  { code: "te", name: "Telugu", rtl: false },
  { code: "ur", name: "Urdu", rtl: true }
];

test.describe("Step 2.5: Multilingual E2E Switch & Quality Audit (All 23 Languages)", () => {
  test.use({
    viewport: { width: 360, height: 800 }
  });

  const screenshotsDir = path.resolve(process.cwd(), "docs/screenshots/multilingual");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__THINAI_TEST_USER__ = {
        uid: "farmer-multi-123",
        email: "farmer@multilingual.thinai.org",
        displayName: "Ramesh Patel"
      };
      localStorage.setItem("thinai_selected_language", "English");
      localStorage.setItem(
        "thinai_farmer_profile",
        JSON.stringify({
          name: "Ramesh Patel",
          phone: "9876543210",
          email: "farmer@multilingual.thinai.org",
          village: "Dharapuram",
          district: "Tiruppur",
          stateName: "Tamil Nadu",
          farmSize: "4.0",
          soilType: "Red Sandy Loam",
          soilMoistureStatus: "optimal",
          primaryCrop: "Tomato",
          cropVariety: "Shivam F1 Hybrid",
          cropStage: "Vegetative Growth",
          sowingDate: "2026-09-01",
          irrigationType: "Drip Irrigation",
          farmingMethod: "Precision Natural",
          waterSource: "Open Well",
          mainCrops: "Tomato, Chilli",
          language: "English"
        })
      );
    });
  });

  test("cycles through all 23 languages, verifying RTL, no missing keys {{, no tofu chars", async ({ page }) => {
    await page.goto("/?screen=home");
    await page.waitForSelector("main");

    for (const lang of ALL_23_LANGUAGES) {
      // 1. Switch language dynamically via in-app API
      await page.evaluate((lName) => {
        if ((window as any).setThinaiLanguage) {
          (window as any).setThinaiLanguage(lName);
        }
      }, lang.name);

      await page.waitForFunction(
        (code) => document.documentElement.getAttribute("lang") === code,
        lang.code,
        { timeout: 4000 }
      );

      // 2. Verify <html> dir and lang attributes
      const htmlDir = await page.getAttribute("html", "dir");
      const htmlLang = await page.getAttribute("html", "lang");

      if (lang.rtl) {
        expect(htmlDir, `Language ${lang.name} should have dir="rtl"`).toBe("rtl");
      } else {
        expect(htmlDir, `Language ${lang.name} should have dir="ltr"`).toBe("ltr");
      }
      expect(htmlLang, `Language ${lang.name} html lang attribute`).toBe(lang.code);

      // 3. Text inspection: check absence of un-interpolated {{ placeholders
      const pageText = await page.innerText("body");
      expect(pageText).not.toMatch(/{{\s*[a-zA-Z0-9_]+\s*}}/);

      // 4. Tofu inspection: check absence of replacement character \uFFFD or unicode box
      expect(pageText).not.toContain("\uFFFD");
      expect(pageText).not.toContain("□");

      // 5. Capture Home screen screenshot for representative scripts
      if (["en", "ta", "hi", "ur", "bn"].includes(lang.code)) {
        await page.screenshot({
          path: path.join(screenshotsDir, `home_${lang.code}_360x800.png`),
          fullPage: false
        });
      }
    }

    // Capture representative screenshots on Crop Doctor screen
    for (const lang of ALL_23_LANGUAGES.filter(l => ["en", "ta", "hi", "ur", "bn"].includes(l.code))) {
      await page.evaluate((lName) => (window as any).setThinaiLanguage?.(lName), lang.name);
      await page.goto("/?screen=doctor");
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(screenshotsDir, `doctor_${lang.code}_360x800.png`),
        fullPage: false
      });
    }

    // Capture representative screenshots on Profile/Settings screen
    for (const lang of ALL_23_LANGUAGES.filter(l => ["en", "ta", "hi", "ur", "bn"].includes(l.code))) {
      await page.evaluate((lName) => (window as any).setThinaiLanguage?.(lName), lang.name);
      await page.goto("/?screen=profile");
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(screenshotsDir, `profile_${lang.code}_360x800.png`),
        fullPage: false
      });
    }
  });

  test("tests translation error reporting flow", async ({ page }) => {
    await page.goto("/?screen=home");
    const langBtn = page.locator('button[aria-label*="Toggle language"], button[title*="language"]');
    if (await langBtn.count() > 0) {
      await langBtn.first().click();
      await page.waitForTimeout(300);

      const reportLink = page.getByRole("button", { name: /Report a translation issue/i });
      if (await reportLink.count() > 0) {
        await reportLink.first().click();
        await page.waitForTimeout(300);

        // Verify translation report modal is visible
        await expect(page.getByRole("dialog")).toBeVisible();
        await expect(page.getByText("Report a Translation Error")).toBeVisible();

        // Fill suggestion
        const inputs = page.locator("textarea, input[type='text']");
        if (await inputs.count() >= 2) {
          await inputs.nth(1).fill("Corrected terminology suggestion");
        }
      }
    }
  });
});
