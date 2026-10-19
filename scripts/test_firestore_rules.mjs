// THINAI Firestore Security Rules Verification Test Suite
// Executes against real Firestore Emulator Suite using @firebase/rules-unit-testing
// Run with: npx firebase emulators:exec --only firestore --project demo-thinai-test "node scripts/test_firestore_rules.mjs"

import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import fs from "node:fs";
import path from "node:path";

console.log("=================================================");
console.log("🔒 THINAI FIRESTORE SECURITY RULES REAL EMULATOR SUITE");
console.log("=================================================\n");

const rulesPath = path.resolve("firestore.rules");
if (!fs.existsSync(rulesPath)) {
  console.error("❌ firestore.rules not found at " + rulesPath);
  process.exit(1);
}
const rulesContent = fs.readFileSync(rulesPath, "utf-8");

import { execSync } from "node:child_process";

if (!process.env.FIRESTORE_EMULATOR_HOST && !process.env.THINAI_EMULATOR_CHILD) {
  console.log("FIRESTORE_EMULATOR_HOST not set. Launching Firebase Emulator Suite...");
  try {
    execSync('npx firebase emulators:exec --only firestore --project demo-thinai-test "node scripts/test_firestore_rules.mjs"', {
      stdio: "inherit",
      env: { ...process.env, THINAI_EMULATOR_CHILD: "1" }
    });
    process.exit(0);
  } catch (err) {
    process.exit(err.status || 1);
  }
}

const hostPort = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const [host, portStr] = hostPort.split(":");
const port = parseInt(portStr, 10) || 8080;

console.log(`Connecting to Firestore Emulator at ${host}:${port} with real firestore.rules...\n`);

const testEnv = await initializeTestEnvironment({
  projectId: "demo-thinai-test",
  firestore: {
    rules: rulesContent,
    host,
    port
  }
});

let passedCount = 0;
let failedCount = 0;

async function runTest(name, testFn) {
  try {
    await testFn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedCount++;
  }
}

try {
  // Pre-seed an extension officer in /officers collection using admin privileges (bypass rules)
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await setDoc(doc(adminDb, "officers", "officer_murugan"), {
      officerId: "officer_murugan",
      name: "Murugan AAO",
      district: "Coimbatore",
      active: true
    });
  });

  const unauthContext = testEnv.unauthenticatedContext();
  const unauthDb = unauthContext.firestore();

  const farmerContext = testEnv.authenticatedContext("farmer_selvam");
  const farmerDb = farmerContext.firestore();

  const otherFarmerContext = testEnv.authenticatedContext("farmer_kumar");
  const otherFarmerDb = otherFarmerContext.firestore();

  const officerContext = testEnv.authenticatedContext("officer_murugan");
  const officerDb = officerContext.firestore();

  console.log("📦 1. Equipment Listings Rules Tests");
  await runTest("Equipment: Unauthenticated read is DENIED", async () => {
    await assertFails(getDoc(doc(unauthDb, "equipment_listings", "eq_1")));
  });

  await runTest("Equipment: Signed-in farmer read is ALLOWED", async () => {
    await assertSucceeds(getDoc(doc(farmerDb, "equipment_listings", "eq_1")));
  });

  await runTest("Equipment: Create with matching userId and consent=true is ALLOWED", async () => {
    await assertSucceeds(setDoc(doc(farmerDb, "equipment_listings", "eq_selvam_1"), {
      userId: "farmer_selvam",
      equipmentName: "Power Tiller 14HP",
      village: "Pollachi",
      district: "Coimbatore",
      consentPhoneShare: true,
      phone: "+91 94444 11111"
    }));
  });

  await runTest("Equipment: Create spoofing another user's userId is DENIED", async () => {
    await assertFails(setDoc(doc(farmerDb, "equipment_listings", "eq_spoofed"), {
      userId: "farmer_kumar",
      equipmentName: "Tractor",
      village: "Pollachi",
      district: "Coimbatore",
      consentPhoneShare: false
    }));
  });

  await runTest("Equipment: Privacy rule: phone provided with consent=false is DENIED", async () => {
    await assertFails(setDoc(doc(farmerDb, "equipment_listings", "eq_selvam_leak"), {
      userId: "farmer_selvam",
      equipmentName: "Rotavator",
      village: "Pollachi",
      district: "Coimbatore",
      consentPhoneShare: false,
      phone: "+91 94444 11111"
    }));
  });

  await runTest("Equipment: Owner can delete their own listing", async () => {
    await assertSucceeds(deleteDoc(doc(farmerDb, "equipment_listings", "eq_selvam_1")));
  });

  await runTest("Equipment: Non-owner cannot delete another farmer's listing", async () => {
    // Re-create listing as selvam
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "equipment_listings", "eq_selvam_2"), {
        userId: "farmer_selvam",
        equipmentName: "Rotavator",
        village: "Pollachi",
        district: "Coimbatore",
        consentPhoneShare: true
      });
    });
    await assertFails(deleteDoc(doc(otherFarmerDb, "equipment_listings", "eq_selvam_2")));
  });

  console.log("\n📦 2. Profiles and Feedback Rules Tests");
  await runTest("Profiles: User can only update their own profile", async () => {
    await assertSucceeds(setDoc(doc(farmerDb, "profiles", "farmer_selvam"), {
      name: "Selvam Periasamy"
    }));
    await assertFails(setDoc(doc(farmerDb, "profiles", "farmer_kumar"), {
      name: "Spoofed Kumar"
    }));
  });

  await runTest("Feedbacks: Rating must be integer between 1 and 5", async () => {
    await assertSucceeds(setDoc(doc(farmerDb, "feedbacks", "fb_valid"), {
      userId: "farmer_selvam",
      recommendationId: "rec_101",
      rating: 5
    }));
    await assertFails(setDoc(doc(farmerDb, "feedbacks", "fb_invalid"), {
      userId: "farmer_selvam",
      recommendationId: "rec_101",
      rating: 6
    }));
  });

  console.log("\n📦 3. Farmer Verdicts Rules Tests");
  await runTest("Verdicts: Unauthenticated create is DENIED", async () => {
    await assertFails(setDoc(doc(unauthDb, "verdicts", "v_unauth"), {
      userId: "farmer_selvam",
      verdict: "YES",
      predictedClass: "Tomato___Early_blight",
      calibratedConfidence: 0.88,
      tier: "TIER_1_CONFIDENT"
    }));
  });

  await runTest("Verdicts: Signed-in user writing own verdict is ALLOWED", async () => {
    await assertSucceeds(setDoc(doc(farmerDb, "verdicts", "v_selvam_1"), {
      userId: "farmer_selvam",
      verdict: "YES",
      predictedClass: "Tomato___Early_blight",
      calibratedConfidence: 0.88,
      tier: "TIER_1_CONFIDENT"
    }));
  });

  await runTest("Verdicts: Signed-in user spoofing another farmer's userId is DENIED", async () => {
    await assertFails(setDoc(doc(farmerDb, "verdicts", "v_spoofed"), {
      userId: "farmer_kumar",
      verdict: "YES",
      predictedClass: "Tomato___Early_blight",
      calibratedConfidence: 0.88,
      tier: "TIER_1_CONFIDENT"
    }));
  });

  await runTest("Verdicts: Non-owner cannot delete another user's verdict", async () => {
    await assertFails(deleteDoc(doc(otherFarmerDb, "verdicts", "v_selvam_1")));
  });

  console.log("\n📦 4. Officers Collection Rules Tests");
  await runTest("Officers: User can read own officer verification document", async () => {
    await assertSucceeds(getDoc(doc(officerDb, "officers", "officer_murugan")));
  });

  await runTest("Officers: Normal farmer cannot write or spoof officer doc (Console only)", async () => {
    await assertFails(setDoc(doc(farmerDb, "officers", "farmer_selvam"), {
      officerId: "farmer_selvam",
      active: true
    }));
  });

  console.log("\n📦 5. Diagnoses & Compressed Thumbnail Rules Tests");
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "diagnoses", "diag_selvam_1"), {
      userId: "farmer_selvam",
      crop: "Tomato",
      predictedClass: "Tomato___Early_blight"
    });
  });

  await runTest("Diagnoses: Normal farmer can read their own diagnosis", async () => {
    await assertSucceeds(getDoc(doc(farmerDb, "diagnoses", "diag_selvam_1")));
  });

  await runTest("Diagnoses: Normal farmer CANNOT read another farmer's diagnosis", async () => {
    await assertFails(getDoc(doc(otherFarmerDb, "diagnoses", "diag_selvam_1")));
  });

  await runTest("Diagnoses: Verified extension officer CAN read farmer's diagnosis for triage", async () => {
    await assertSucceeds(getDoc(doc(officerDb, "diagnoses", "diag_selvam_1")));
  });

  await runTest("Diagnoses: Thumbnail with photoConsent=true and size <= 64KB is ALLOWED", async () => {
    const validBase64 = "A".repeat(30000); // 30 KB base64 string
    await assertSucceeds(setDoc(doc(farmerDb, "diagnoses", "diag_with_thumb"), {
      userId: "farmer_selvam",
      crop: "Tomato",
      predictedClass: "Tomato___Early_blight",
      photoConsent: true,
      thumbnailBase64: validBase64
    }));
  });

  await runTest("Diagnoses: Thumbnail exceeding 64KB size cap is DENIED", async () => {
    const oversizedBase64 = "A".repeat(70000); // 70 KB base64 string (> 65536)
    await assertFails(setDoc(doc(farmerDb, "diagnoses", "diag_oversized"), {
      userId: "farmer_selvam",
      crop: "Tomato",
      predictedClass: "Tomato___Early_blight",
      photoConsent: true,
      thumbnailBase64: oversizedBase64
    }));
  });

  await runTest("Diagnoses: Thumbnail uploaded without photoConsent is DENIED", async () => {
    const validBase64 = "A".repeat(10000);
    await assertFails(setDoc(doc(farmerDb, "diagnoses", "diag_no_consent"), {
      userId: "farmer_selvam",
      crop: "Tomato",
      predictedClass: "Tomato___Early_blight",
      photoConsent: false,
      thumbnailBase64: validBase64
    }));
  });

  console.log("\n📦 6. Expert Ground Truth Labels Rules Tests");
  await runTest("Expert Labels: Verified officer submitting expert label is ALLOWED", async () => {
    await assertSucceeds(setDoc(doc(officerDb, "expert_labels", "lbl_murugan_1"), {
      officerId: "officer_murugan",
      diagnosisId: "diag_selvam_1",
      verifiedPathogen: "Tomato___Early_blight"
    }));
  });

  await runTest("Expert Labels: Non-officer farmer attempting to create expert label is DENIED", async () => {
    await assertFails(setDoc(doc(farmerDb, "expert_labels", "lbl_spoofed"), {
      officerId: "farmer_selvam",
      diagnosisId: "diag_selvam_1",
      verifiedPathogen: "Tomato___Early_blight"
    }));
  });

} finally {
  await testEnv.cleanup();
}

console.log("\n=================================================");
console.log(`🏁 REAL FIRESTORE EMULATOR TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
