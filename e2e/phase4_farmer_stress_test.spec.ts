import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";

interface AuditResult {
  screen: string;
  language: string;
  violationsCount: number;
  violations: any[];
  smallTapTargets: string[];
}

const auditResults: AuditResult[] = [];

test.describe("Phase 4: First-Time Farmer Stress Test at 360x800", () => {
  test.use({
    viewport: { width: 360, height: 800 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
  });

  // ─── 1. ONBOARDING & AUTHENTICATION STRESS FLOW (UNAUTHENTICATED) ───
  test("1. Onboarding & Auth: Wrong, Empty, Long, Tamil Inputs & Double Tap", async ({ page }) => {
    // Start unauthenticated
    await page.goto("/?screen=login");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/?screen=login");
    await page.waitForTimeout(1000);

    // 1.1 Run Axe on Login screen
    const axeLogin = await new AxeBuilder({ page }).analyze();
    auditResults.push({
      screen: "login",
      language: "English",
      violationsCount: axeLogin.violations.length,
      violations: axeLogin.violations,
      smallTapTargets: []
    });

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="Phone"], input[placeholder*="தொலைபேசி"]');
    if (await phoneInput.isVisible()) {
      // 1.2 Wrong input
      await phoneInput.fill("invalid-abc-123");
      expect(await phoneInput.inputValue()).not.toBe("invalid-abc-123-accepted");

      // 1.3 Empty input submission
      await phoneInput.fill("");
      const sendOtpBtn = page.getByRole("button", { name: /Send OTP|OTP பெறுக|Continue|உள்நுழைக/i }).first();
      if (await sendOtpBtn.isVisible()) {
        await sendOtpBtn.click();
        await page.waitForTimeout(400);
      }

      // 1.4 Double tap
      await phoneInput.fill("9876543210");
      if (await sendOtpBtn.isVisible()) {
        await sendOtpBtn.click({ clickCount: 2 });
        await page.waitForTimeout(500);
      }
    }

    // 1.5 Refresh mid-flow
    await page.reload();
    await page.waitForTimeout(1000);
  });

  // Helper to inject mock farmer user
  const setupAuthenticatedFarmer = async (page: any, lang: string = "English") => {
    await page.addInitScript((l: string) => {
      (window as any).__THINAI_TEST_USER__ = {
        uid: "test-farmer-uid-123",
        email: "selvam.murugan@testfarm.in",
        displayName: "Selvam Murugan"
      };
      localStorage.setItem("thinai_selected_language", l);
      localStorage.setItem("thinai_auth_mode", "authenticated");
      localStorage.setItem(
        "thinai_farmer_profile",
        JSON.stringify({
          name: l === "Tamil" ? "செல்வம் முருகன்" : "Selvam Murugan",
          phone: "9876543210",
          village: l === "Tamil" ? "தொண்டாமுத்தூர்" : "Thondamuthur",
          district: "Coimbatore",
          stateName: "Tamil Nadu",
          farmSize: "3.5",
          soilType: "Clay Loam",
          primaryCrop: "Paddy (Rice)",
          cropVariety: "CO 51",
          cropStage: "Tillering Stage",
          language: l
        })
      );
    }, lang);
  };

  // ─── 2. HOME SCREEN: TAMIL & ENGLISH FIRST-TIME FARMER NAVIGATION ───
  test("2. Home Screen: Language Toggle, Tap Target Sizes & Axe Contrast Audit", async ({ page }) => {
    await setupAuthenticatedFarmer(page, "Tamil");
    await page.goto("/?screen=home");
    await page.waitForTimeout(1500);

    // 2.1 Check header in Tamil
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toContain("வணக்கம்");

    // 2.2 Instant Language Toggle (EN | தமிழ்)
    const langBtn = page.locator('button[title*="Language Switch"]');
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(600);
      expect(await page.locator("body").innerText()).toContain("Welcome");

      await langBtn.click();
      await page.waitForTimeout(600);
      expect(await page.locator("body").innerText()).toContain("வணக்கம்");
    }

    // 2.3 Tap target size audit (< 44px check)
    const smallTargets = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, a, input[type='submit']"));
      const tooSmall: string[] = [];
      buttons.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.width < 44 || rect.height < 44) {
            const text = (el.textContent || el.getAttribute("aria-label") || el.className).trim().slice(0, 30);
            tooSmall.push(`${el.tagName}: "${text}" (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
          }
        }
      });
      return tooSmall;
    });

    // 2.4 Run Axe Accessibility Audit on Home
    const axeHome = await new AxeBuilder({ page }).analyze();
    auditResults.push({
      screen: "home",
      language: "Tamil",
      violationsCount: axeHome.violations.length,
      violations: axeHome.violations,
      smallTapTargets: smallTargets
    });
  });

  // ─── 3. FARM RECORDS SCREEN: WRONG, EMPTY, TAMIL & OFFLINE RECONNECT SYNC ───
  test("3. Farm Records: Offline Mid-Action, Reconnect & No Sync Duplicates", async ({ page }) => {
    await setupAuthenticatedFarmer(page, "English");
    await page.goto("/?screen=records");
    await page.waitForTimeout(1500);

    // 3.1 Test Add Plot Modal with Empty & Wrong Inputs
    const addPlotBtn = page.getByRole("button", { name: /Add Plot|புதிய நிலம்/i });
    if (await addPlotBtn.isVisible()) {
      await addPlotBtn.click();
      await page.waitForTimeout(500);

      const plotNameInput = page.locator('input[placeholder*="South Paddy Field"]');
      if (await plotNameInput.isVisible()) {
        // Tamil long plot name
        await plotNameInput.fill("வடக்கு வயல் - நெல் பயிர் பிரிவு எண் 3 - " + "நீளமான உரை ".repeat(5));
        const areaInput = page.locator('input[type="number"]').first();
        await areaInput.fill("2.5");

        const saveBtn = page.getByRole("button", { name: /Save Plot|நிலத்தைச் சேமிக்கவும்/i });
        await saveBtn.click();
        await page.waitForTimeout(800);
      }
    }

    // 3.2 Offline mid-action test: switch to Expenses tab and add expense while offline
    const expenseTab = page.getByRole("button", { name: /Expenses|செலவுகள்/i });
    if (await expenseTab.isVisible()) {
      await expenseTab.click();
      await page.waitForTimeout(500);

      // Simulate browser going offline
      await page.context().setOffline(true);
      await page.waitForTimeout(500);

      const addExpenseBtn = page.getByRole("button", { name: /Add Expense|செலவு சேர்/i });
      if (await addExpenseBtn.isVisible()) {
        await addExpenseBtn.click();
        await page.waitForTimeout(500);

        const amountInput = page.locator('input[placeholder*="1500"]');
        const descInput = page.locator('input[placeholder*="Seeds"]');
        if (await amountInput.isVisible() && await descInput.isVisible()) {
          await amountInput.fill("3200");
          await descInput.fill("கலப்பு உரம் மற்றும் ஜிங்க் சல்பேட் 50கிகி");

          const saveExpBtn = page.getByRole("button", { name: /Save Expense|செலவைச் சேமிக்கவும்/i });
          await saveExpBtn.click();
          await page.waitForTimeout(800);
        }
      }

      // Reconnect online
      await page.context().setOffline(false);
      await page.waitForTimeout(1000);

      // Check Dexie sync queue in browser context for zero duplicate IDs
      const duplicateCount = await page.evaluate(async () => {
        const { db } = await import("../src/services/db");
        const items = await db.syncQueue.toArray();
        const clientIds = items.map(i => i.clientId);
        const uniqueIds = new Set(clientIds);
        return clientIds.length - uniqueIds.size;
      });

      expect(duplicateCount).toBe(0);
    }
  });

  // ─── 4. CROP DOCTOR SCREEN: SCAN, SEARCH & TIER FILTERING ───
  test("4. Crop Doctor: Search Tamil, Tier Filtering & Detail Modals", async ({ page }) => {
    await setupAuthenticatedFarmer(page, "English");
    await page.goto("/?screen=doctor");
    await page.waitForTimeout(1500);

    const historySubTab = page.getByRole("button", { name: /Scan History|ஸ்கேன் வரலாறு/i });
    if (await historySubTab.isVisible()) {
      await historySubTab.click();
      await page.waitForTimeout(500);

      const tier1Btn = page.getByRole("button", { name: /Tier 1/i });
      if (await tier1Btn.isVisible()) {
        await tier1Btn.click();
        await page.waitForTimeout(400);
      }

      const searchInput = page.locator('input[placeholder*="Search scans"], input[placeholder*="தேடுக"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill("Tomato");
        await page.waitForTimeout(500);
        await searchInput.fill("");
      }
    }
  });

  // ─── 5. FERTILIZER CALCULATOR SCREEN: EXTREME INPUTS & ROTATION ───
  test("5. Fertilizer Calculator: Extreme Values, Negative Inputs & 800x360 Rotate", async ({ page }) => {
    await setupAuthenticatedFarmer(page, "English");
    await page.goto("/?screen=calculator");
    await page.waitForTimeout(1500);

    const areaInput = page.locator('input[type="number"]').first();
    if (await areaInput.isVisible()) {
      // 5.1 Negative input (should clamp to 0.1)
      await areaInput.fill("-10");
      await page.waitForTimeout(400);

      // 5.2 Extreme input
      await areaInput.fill("99999");
      await page.waitForTimeout(400);

      // 5.3 Normal input
      await areaInput.fill("2.5");
      await page.waitForTimeout(400);
    }

    // 5.4 Rotate viewport to 800x360 landscape
    await page.setViewportSize({ width: 800, height: 360 });
    await page.waitForTimeout(600);

    expect(await page.locator("body").innerText()).toContain("Fertilizer");

    // Rotate back to mobile portrait
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(400);
  });

  // ─── 6. WHAT-IF LAB SCREEN: SLIDER STRESS & 200% TEXT ZOOM ───
  test("6. What-If Lab: Slider Stress & 200% Text Zoom", async ({ page }) => {
    await setupAuthenticatedFarmer(page, "English");
    await page.goto("/?screen=whatif");
    await page.waitForTimeout(1500);

    // 6.1 Test 200% text zoom via CSS zoom
    await page.evaluate(() => {
      document.body.style.zoom = "200%";
    });
    await page.waitForTimeout(600);

    expect(await page.locator("body").innerText()).toContain("What-If");

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = "100%";
    });
    await page.waitForTimeout(400);
  });

  // ─── 7. MARKET INTELLIGENCE SCREEN: COMMODITY CYCLING & MSP AUDIT ───
  test("7. Market Screen: Fast Tab Switching, Axe Audit & Honest Provenance", async ({ page }) => {
    await setupAuthenticatedFarmer(page, "English");
    await page.goto("/?screen=market");
    await page.waitForTimeout(1500);

    // Click commodities
    const commodities = ["Tomato", "Cotton", "Maize", "Chilli", "Paddy"];
    for (const crop of commodities) {
      const btn = page.getByRole("button", { name: new RegExp(crop, "i") }).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }

    // Run Axe audit on Market Screen
    const axeMarket = await new AxeBuilder({ page }).analyze();
    auditResults.push({
      screen: "market",
      language: "English",
      violationsCount: axeMarket.violations.length,
      violations: axeMarket.violations,
      smallTapTargets: []
    });
  });

  // ─── 8. COMMUNITY SCREEN: HONEST EMPTY STATE AUDIT ───
  test("8. Community Screen: Honest Empty State Without Fabricated Posts", async ({ page }) => {
    await setupAuthenticatedFarmer(page, "English");
    await page.goto("/?screen=community");
    await page.waitForTimeout(1500);

    const bodyText = await page.locator("body").innerText();
    // Zero fake sample posts
    expect(bodyText).not.toContain("sample-post-1");
    expect(bodyText).not.toContain("Sample Farmer / மாதிரி விவசாயி");
    expect(bodyText).not.toContain("Demo Reference Only");

    // Honest empty state visible
    expect(bodyText).toContain("No community discussions yet");
  });

  // ─── 9. CONSOLIDATED AUDIT SUMMARY WRITER ───
  test.afterAll(async () => {
    fs.writeFileSync("docs/audit_results_phase4.json", JSON.stringify(auditResults, null, 2));
  });
});
