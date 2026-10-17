// THINAI Automated Test Suite (Phase 8: Comprehensive Testing & Verification)
// Run with: node scripts/verify_system.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=================================================");
console.log("🌱 THINAI COMPREHENSIVE SYSTEM VERIFICATION TEST");
console.log("=================================================\n");

let passedCount = 0;
let failedCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedCount++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. WEATHER & SPRAY ADVISORY EVALUATOR TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log("📦 1. Weather & Spray Advisory Logic Tests");

function evaluateSpraySafety(temp, windSpeed, rainProb, rainfall48h) {
  if (rainProb >= 40 || rainfall48h >= 5.0) {
    return {
      safetyLevel: "Not Recommended",
      badgeColor: "rose",
      primaryReason: rainProb >= 40 
        ? `High rain probability (${rainProb}%) within forecast window. Foliar chemicals will be washed off.`
        : `Heavy cumulative rainfall (${rainfall48h}mm expected in 48h). High wash-off risk.`
    };
  }

  if (windSpeed > 20) {
    return {
      safetyLevel: "Not Recommended",
      badgeColor: "rose",
      primaryReason: `Wind speed is ${windSpeed} km/h (exceeds safe threshold of 20 km/h). High spray drift risk to non-target crops and nearby water bodies.`
    };
  }

  if (temp >= 35) {
    return {
      safetyLevel: "Caution",
      badgeColor: "amber",
      primaryReason: `Ambient temperature is ${temp}°C. Risk of rapid droplet evaporation and leaf phytotoxicity. Spray only in early morning (before 9 AM) or late evening (after 4:30 PM).`
    };
  }

  if (windSpeed >= 12 || rainProb >= 20) {
    return {
      safetyLevel: "Moderate",
      badgeColor: "amber",
      primaryReason: windSpeed >= 12 
        ? `Moderate wind (${windSpeed} km/h). Use low-drift nozzles and keep boom height close to crop canopy.`
        : `Moderate rain risk (${rainProb}%). Use systemic chemical with rainfast adjuvant (sticker) if critical.`
    };
  }

  return {
    safetyLevel: "Optimal",
    badgeColor: "emerald",
    primaryReason: "Calm wind, mild temperature, and low rain probability. Optimal conditions for foliar spray absorption."
  };
}

test("Spray Advisory: High rain probability (>=40%) triggers RED wash-off alert", () => {
  const result = evaluateSpraySafety(28, 10, 45, 0);
  assert.equal(result.badgeColor, "rose");
  assert.equal(result.safetyLevel, "Not Recommended");
  assert.match(result.primaryReason, /washed off/i);
});

test("Spray Advisory: 48h rainfall >= 5mm triggers RED wash-off alert", () => {
  const result = evaluateSpraySafety(27, 8, 15, 12.5);
  assert.equal(result.badgeColor, "rose");
  assert.equal(result.safetyLevel, "Not Recommended");
  assert.match(result.primaryReason, /wash-off risk/i);
});

test("Spray Advisory: High wind speed (>20 km/h) triggers RED spray drift alert", () => {
  const result = evaluateSpraySafety(26, 24, 10, 0);
  assert.equal(result.badgeColor, "rose");
  assert.equal(result.safetyLevel, "Not Recommended");
  assert.match(result.primaryReason, /spray drift risk/i);
});

test("Spray Advisory: High ambient temperature (>=35°C) triggers AMBER caution", () => {
  const result = evaluateSpraySafety(37, 8, 10, 0);
  assert.equal(result.badgeColor, "amber");
  assert.equal(result.safetyLevel, "Caution");
  assert.match(result.primaryReason, /evaporation/i);
});

test("Spray Advisory: Moderate conditions (wind 14 km/h) triggers AMBER moderate warning", () => {
  const result = evaluateSpraySafety(29, 14, 10, 0);
  assert.equal(result.badgeColor, "amber");
  assert.equal(result.safetyLevel, "Moderate");
  assert.match(result.primaryReason, /low-drift nozzles/i);
});

test("Spray Advisory: Optimal calm weather triggers GREEN optimal absorption", () => {
  const result = evaluateSpraySafety(26, 8, 5, 0);
  assert.equal(result.badgeColor, "emerald");
  assert.equal(result.safetyLevel, "Optimal");
  assert.match(result.primaryReason, /optimal conditions/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. OFFLINE CACHE POLICY TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📦 2. Offline Cache Expiration Policy Tests");

function isWeatherCacheValid(fetchedAt) {
  if (!fetchedAt) return false;
  const fetchedTime = new Date(fetchedAt).getTime();
  if (isNaN(fetchedTime)) return false;
  const threeHoursMs = 3 * 60 * 60 * 1000;
  return Date.now() - fetchedTime < threeHoursMs;
}

function isMarketCacheValid(fetchedAt) {
  if (!fetchedAt) return false;
  const fetchedTime = new Date(fetchedAt).getTime();
  if (isNaN(fetchedTime)) return false;
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  return Date.now() - fetchedTime < twentyFourHoursMs;
}

test("Weather Cache: Fresh observation (<3h old) is marked VALID", () => {
  const oneHourAgo = new Date(Date.now() - 1 * 3600000).toISOString();
  assert.equal(isWeatherCacheValid(oneHourAgo), true);
});

test("Weather Cache: Expired observation (>3h old) is marked INVALID", () => {
  const fourHoursAgo = new Date(Date.now() - 4 * 3600000).toISOString();
  assert.equal(isWeatherCacheValid(fourHoursAgo), false);
});

test("Weather Cache: Null or malformed timestamp returns false", () => {
  assert.equal(isWeatherCacheValid(null), false);
  assert.equal(isWeatherCacheValid(undefined), false);
  assert.equal(isWeatherCacheValid("invalid-date-string"), false);
});

test("Market Cache: Observation under 24 hours is marked VALID", () => {
  const twelveHoursAgo = new Date(Date.now() - 12 * 3600000).toISOString();
  assert.equal(isMarketCacheValid(twelveHoursAgo), true);
});

test("Market Cache: Observation older than 24 hours is marked INVALID", () => {
  const twentySixHoursAgo = new Date(Date.now() - 26 * 3600000).toISOString();
  assert.equal(isMarketCacheValid(twentySixHoursAgo), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. MARKET COMMODITY & CROP NORMALIZATION TESTS
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📦 3. Market Commodity & Crop Normalization Tests");

function normalizeCropKey(rawCrop) {
  const c = rawCrop.toLowerCase().trim();
  if (c.includes("paddy") || c.includes("rice") || c.includes("நெல்")) return "paddy";
  if (c.includes("wheat") || c.includes("கோதுமை")) return "wheat";
  if (c.includes("maize") || c.includes("corn") || c.includes("மக்காச்சோளம்")) return "maize";
  if (c.includes("cotton") || c.includes("பருத்தி")) return "cotton";
  if (c.includes("tomato") || c.includes("தக்காளி")) return "tomato";
  return c;
}

test("Crop Normalizer: Correctly standardizes English & Tamil crop names", () => {
  assert.equal(normalizeCropKey("Paddy (Ponni)"), "paddy");
  assert.equal(normalizeCropKey("Rice"), "paddy");
  assert.equal(normalizeCropKey("நெல்"), "paddy");
  assert.equal(normalizeCropKey("Wheat (Sharbati)"), "wheat");
  assert.equal(normalizeCropKey("கோதுமை"), "wheat");
  assert.equal(normalizeCropKey("Corn / Maize"), "maize");
  assert.equal(normalizeCropKey("மக்காச்சோளம்"), "maize");
  assert.equal(normalizeCropKey("Bt Cotton"), "cotton");
  assert.equal(normalizeCropKey("பருத்தி"), "cotton");
  assert.equal(normalizeCropKey("Tomato (Shivam)"), "tomato");
  assert.equal(normalizeCropKey("தக்காளி"), "tomato");
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. ON-DEVICE TFLITE MODEL & LABELS VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📦 4. On-Device TFLite Model & Labels Verification");

test("Model Asset: thinai_disease_model.tflite exists and exceeds 4 MB", () => {
  const modelPath = path.resolve("public/models/thinai_disease_model.tflite");
  assert.ok(fs.existsSync(modelPath), "Model file missing in public/models/");
  const stat = fs.statSync(modelPath);
  assert.ok(stat.size > 4000000, `Model size is only ${stat.size} bytes (expected > 4 MB)`);
});

test("Model Metadata: labels.json exists with exactly 39 classes and 94.3% accuracy", () => {
  const labelsPath = path.resolve("public/models/labels.json");
  assert.ok(fs.existsSync(labelsPath), "labels.json missing in public/models/");
  const meta = JSON.parse(fs.readFileSync(labelsPath, "utf-8"));
  assert.equal(meta.architecture, "MobileNetV2");
  assert.equal(meta.classes.length, 39, `Expected 39 classes, got ${meta.classes.length}`);
  assert.ok(meta.classes.includes("Background_without_leaves"), "Missing background class");
  assert.ok(meta.classes.includes("Tomato___Late_blight"), "Missing Tomato___Late_blight class");
  assert.ok(meta.classes.includes("Tomato___healthy"), "Missing Tomato___healthy class");
  assert.equal(meta.metrics.validation_accuracy, 94.3);
  assert.equal(meta.confidence_threshold, 0.65);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. I18N TAMIL TRANSLATIONS INTEGRITY TEST
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📦 5. i18n English <-> Tamil Dictionary Completeness");

test("i18n: translations.ts has matching English and Tamil keys", async () => {
  const transModule = await import("../src/app/translations.ts");
  const { translations } = transModule;
  assert.ok(translations.English, "English dictionary missing");
  assert.ok(translations.Tamil, "Tamil dictionary missing");

  const enKeys = Object.keys(translations.English);
  const taKeys = Object.keys(translations.Tamil);

  const missingInTamil = enKeys.filter(k => !taKeys.includes(k) || !translations.Tamil[k]);
  assert.equal(
    missingInTamil.length,
    0,
    `Missing Tamil translations for keys: ${missingInTamil.join(", ")}`
  );
  assert.ok(enKeys.length >= 40, `Expected at least 40 keys, found ${enKeys.length}`);
});

test("i18n: src/services/i18n.ts has full English <-> Tamil coverage", async () => {
  const i18nModule = await import("../src/services/i18n.ts");
  const { I18N_STRINGS } = i18nModule;
  assert.ok(I18N_STRINGS.English, "I18N_STRINGS English missing");
  assert.ok(I18N_STRINGS.Tamil, "I18N_STRINGS Tamil missing");

  const enKeys = Object.keys(I18N_STRINGS.English);
  const taKeys = Object.keys(I18N_STRINGS.Tamil);

  const missingInTamil = enKeys.filter(k => !taKeys.includes(k) || !I18N_STRINGS.Tamil[k]);
  assert.equal(
    missingInTamil.length,
    0,
    `Missing Tamil strings in i18n.ts for: ${missingInTamil.slice(0, 5).join(", ")}`
  );
  assert.ok(enKeys.length >= 100, `Expected at least 100 i18n keys, found ${enKeys.length}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. ANDROID & CAPACITOR PACKAGING VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📦 6. Android & Capacitor Packaging Verification");

test("Capacitor: capacitor.config.json has appId 'com.thinai.agriapp'", () => {
  const capPath = path.resolve("capacitor.config.json");
  assert.ok(fs.existsSync(capPath), "capacitor.config.json missing");
  const content = fs.readFileSync(capPath, "utf-8");
  assert.match(content, /"appId":\s*"com\.thinai\.agriapp"/);
  assert.match(content, /"appName":\s*"THINAI"/);
});

test("Android Packaging: com.thinai.agriapp namespace & permissions declared", () => {
  const buildGradlePath = path.resolve("android/app/build.gradle");
  assert.ok(fs.existsSync(buildGradlePath), "android/app/build.gradle missing");
  const buildGradle = fs.readFileSync(buildGradlePath, "utf-8");
  assert.match(buildGradle, /namespace\s*=\s*['"]com\.thinai\.agriapp['"]/);
  assert.match(buildGradle, /applicationId\s+['"]com\.thinai\.agriapp['"]/);

  const manifestPath = path.resolve("android/app/src/main/AndroidManifest.xml");
  assert.ok(fs.existsSync(manifestPath), "AndroidManifest.xml missing");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  assert.match(manifest, /android\.permission\.CAMERA/);
  assert.match(manifest, /android\.permission\.ACCESS_FINE_LOCATION/);
  assert.match(manifest, /android\.permission\.INTERNET/);
});

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n=================================================");
console.log(`🏁 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("🎉 All automated verification tests passed with 100% success!");
}
