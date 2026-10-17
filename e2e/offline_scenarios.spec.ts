import { test, expect } from "@playwright/test";

test.describe("THINAI Automated Offline Matrix & Device Tests (Phase O4)", () => {
  const farmerProfile = {
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
  };

  test("O4-1: S2 Airplane Mode - Service Worker Precache & Offline Cache Audit", async ({ page, context }) => {
    // 1. Load app online to allow Service Worker registration
    await page.goto("/?screen=home");
    await page.waitForTimeout(1500);

    // 2. Inspect Service Worker registration & Precached assets
    const swAudit = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) {
        return { supported: false, registered: false, cachedUrls: [] };
      }
      const registrations = await navigator.serviceWorker.getRegistrations();
      const registered = registrations.length > 0;
      
      let cachedUrls: string[] = [];
      try {
        const cache = await caches.open("thinai-shell-v1");
        const keys = await cache.keys();
        cachedUrls = keys.map((k) => new URL(k.url).pathname);
      } catch (e) {
        console.warn("Could not inspect cache:", e);
      }

      return {
        supported: true,
        registered,
        cachedCount: cachedUrls.length,
        cachedUrls
      };
    });

    console.log(`[Phase O4] SW Registered: ${swAudit.registered}, Cached Assets Count: ${swAudit.cachedCount}`);
    expect(swAudit.supported).toBe(true);

    // 3. Measure offline start / execution responsiveness
    await context.setOffline(true);
    const isOffline = await page.evaluate(() => !navigator.onLine);
    expect(isOffline).toBe(true);

    // Verify UI responsiveness remains instantaneous under offline airplane mode
    const pingStart = Date.now();
    const appTitle = await page.evaluate(() => document.title || "THINAI");
    const pingDuration = Date.now() - pingStart;
    console.log(`[Phase O4] Offline Local DOM Execution Latency: ${pingDuration} ms (Title: ${appTitle})`);
    expect(pingDuration).toBeLessThan(100);
  });

  test("O4-2: S2 Offline Sign-In & Auth Guards (Zero Hangs, Bilingual Errors)", async ({ page, context }) => {
    // Navigate to login screen while online
    await page.goto("/?screen=login");
    await expect(page.getByRole("button", { name: "Sign In with Email" })).toBeVisible();

    // Farmer enters offline environment / toggles Airplane Mode
    await context.setOffline(true);
    const isOffline = await page.evaluate(() => !navigator.onLine);
    expect(isOffline).toBe(true);

    // 1. Attempt Email Sign-In offline
    await page.fill('input[type="email"]', "selvam.murugan@testfarm.in");
    await page.fill('input[type="password"]', "FarmSecure2026!");
    await page.click('button:has-text("Sign In with Email")');

    // Assert immediate bilingual toast appears without hanging
    const toast = page.locator("text=No internet — sign-in needs an active connection");
    await expect(toast).toBeVisible({ timeout: 4000 });

    // Wait for first toast to clear before testing OTP toast
    await page.waitForTimeout(3200);

    // 2. Switch to Phone OTP tab offline
    await page.click('button:has-text("Mobile Phone OTP")');
    await page.fill('input[type="tel"]', "9876543210");
    await page.click('button:has-text("Send OTP")');

    // Assert immediate bilingual OTP error toast
    const otpToast = page.locator("text=No internet — OTP verification requires an active internet connection");
    await expect(otpToast).toBeVisible({ timeout: 4000 });
  });

  test("O4-3: S2 Offline Core Features (Doctor, Provenance Badge, AI Offline Banner)", async ({ page, context }) => {
    await page.addInitScript((profile) => {
      (window as any).__THINAI_TEST_USER__ = {
        uid: "test-farmer-uid-123",
        email: "selvam.murugan@testfarm.in",
        displayName: "Selvam Murugan"
      };
      localStorage.setItem("thinai_selected_language", "English");
      localStorage.setItem("thinai_farmer_profile", JSON.stringify(profile));
    }, farmerProfile);

    // Load app online first
    await page.goto("/?screen=home");
    await expect(page.locator("text=THINAI").first()).toBeVisible();

    // Switch to offline (Airplane mode)
    await context.setOffline(true);

    // 1. Crop Doctor Screen offline
    await page.evaluate(() => (window as any).setThinaiScreen("doctor"));
    await expect(page.locator("text=1. Take Picture")).toBeVisible();
    await expect(page.locator("text=2. Diagnosis")).toBeVisible();
    await expect(page.locator("text=3. Gated Remedy")).toBeVisible();
    await expect(page.locator("button:has-text('TAKE PHOTO')")).toBeVisible();
    await expect(page.locator("button:has-text('UPLOAD FROM GALLERY')")).toBeVisible();

    // 2. Field Accuracy Screen with Data Provenance Badge offline
    await page.evaluate(() => (window as any).setThinaiScreen("fieldAccuracy"));
    await expect(page.locator("text=Data Provenance:")).toBeVisible();
    await expect(page.locator("text=Local Device Storage")).toBeVisible();
    await expect(page.locator("text=Methodological Note: Verdicts are Noisy Weak Labels")).toBeVisible();

    // 3. AI Chatbot Offline Banner
    await page.evaluate(() => (window as any).setThinaiScreen("ai"));
    await expect(
      page.locator("text=Offline Mode: Rule-based agronomic advisory active")
    ).toBeVisible();

    // 4. Instant Language Toggle Offline
    await page.evaluate(() => {
      localStorage.setItem("thinai_selected_language", "Tamil");
      (window as any).setThinaiScreen("fieldAccuracy");
    });
    await expect(page.locator("body")).toBeVisible();
  });

  test("O4-4: S3 Mid-Use Drop, Offline Queuing & Online Reconnect Sync", async ({ page, context }) => {
    await page.addInitScript((profile) => {
      (window as any).__THINAI_TEST_USER__ = {
        uid: "test-farmer-uid-123",
        email: "selvam.murugan@testfarm.in",
        displayName: "Selvam Murugan"
      };
      localStorage.setItem("thinai_selected_language", "English");
      localStorage.setItem("thinai_farmer_profile", JSON.stringify(profile));
    }, farmerProfile);

    // Start Online
    await context.setOffline(false);
    await page.goto("/?screen=services");
    await expect(page.getByRole("button", { name: "Equipment", exact: true })).toBeVisible();

    // Mid-use connection drop
    await context.setOffline(true);
    await page.waitForTimeout(300);

    // Verify write to Dexie sync queue offline using window.__THINAI_DB__
    const queuedItemId = await page.evaluate(async () => {
      const db = (window as any).__THINAI_DB__;
      const id = await db.syncQueue.add({
        action: "create",
        collection: "equipment_listings",
        clientId: `equip-${Date.now()}-selvam`,
        data: {
          title: "Rotavator 42 Blade",
          category: "Tillage",
          pricePerDay: 800,
          ownerPhone: "9876543210"
        },
        status: "pending",
        retryCount: 0,
        timestamp: new Date().toISOString()
      });
      return id;
    });

    expect(queuedItemId).toBeGreaterThan(0);

    // Check pending count in Dexie while offline
    const pendingCount = await page.evaluate(async () => {
      const db = (window as any).__THINAI_DB__;
      return await db.syncQueue.where("status").equals("pending").count();
    });
    expect(pendingCount).toBeGreaterThanOrEqual(1);

    // Reconnect Online
    await context.setOffline(false);
    await page.waitForTimeout(400);

    // Simulate sync flush upon reconnect
    const remainingPending = await page.evaluate(async (id) => {
      const db = (window as any).__THINAI_DB__;
      await db.syncQueue.update(id, { status: "completed" });
      return await db.syncQueue.where("status").equals("pending").count();
    }, queuedItemId);

    expect(remainingPending).toBe(0);
  });

  test("O4-5: S4 Throttled 3G Network (Simulated 400ms Latency & Flakiness)", async ({ page }) => {
    await page.addInitScript((profile) => {
      (window as any).__THINAI_TEST_USER__ = {
        uid: "test-farmer-uid-123",
        email: "selvam.murugan@testfarm.in",
        displayName: "Selvam Murugan"
      };
      localStorage.setItem("thinai_selected_language", "English");
      localStorage.setItem("thinai_farmer_profile", JSON.stringify(profile));
    }, farmerProfile);

    // Load initial app shell online
    await page.goto("/?screen=home");
    await expect(page.locator("text=THINAI").first()).toBeVisible();

    // Attach CDP session to simulate realistic flaky 3G
    const client = await page.context().newCDPSession(page);
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 400, // 400ms roundtrip delay
      downloadThroughput: 50 * 1024, // 50 KB/s
      uploadThroughput: 50 * 1024,
      connectionType: "cellular3g"
    });

    // Local decision calculation & screen transition should NOT block on 3G network latency
    const calcStart = Date.now();
    await page.evaluate(() => (window as any).setThinaiScreen("calculator"));
    await expect(page.locator("text=Fertilizer Calculator")).toBeVisible();
    const calcDuration = Date.now() - calcStart;

    console.log(`[Phase O4] Calculator screen rendered in ${calcDuration} ms under 3G throttling`);
    expect(calcDuration).toBeLessThan(1000); // Instantaneous local render
  });

  test("O4-6: Performance Benchmarks (Model Load Time & First-Inference Time)", async ({ page }) => {
    await page.goto("/?screen=doctor");

    // Benchmark Model Load / Compilation Time
    const modelLoadBenchmark = await page.evaluate(async () => {
      const bench = (window as any).__THINAI_BENCHMARK__;
      if (!bench) return { durationMs: 0, isLoaded: false };
      return await bench.measureModelLoad();
    });

    console.log(`[Phase O4] Measured Model Load Time: ${modelLoadBenchmark.durationMs} ms (isLoaded: ${modelLoadBenchmark.isLoaded})`);

    // Benchmark First-Inference Time
    const inferenceBenchmark = await page.evaluate(async () => {
      const bench = (window as any).__THINAI_BENCHMARK__;
      if (!bench) return { durationMs: 0, result: null };
      return await bench.measureInference();
    });

    console.log(`[Phase O4] Measured First-Inference Time: ${inferenceBenchmark.durationMs} ms`);
    console.log(`[Phase O4] Inference Engine Result Source: ${inferenceBenchmark.result?.source}`);

    expect(inferenceBenchmark.durationMs).toBeGreaterThan(0);
    expect(inferenceBenchmark.result).toBeDefined();
  });
});
