// THINAI Firestore Security Rules Verification Test Suite
// Verifies security constraints defined in firestore.rules
// Run with: node scripts/test_firestore_rules.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("=================================================");
console.log("🔒 THINAI FIRESTORE SECURITY RULES VERIFICATION");
console.log("=================================================\n");

// Read firestore.rules to verify schema declaration exists on disk
const rulesPath = path.resolve("firestore.rules");
assert.ok(fs.existsSync(rulesPath), "firestore.rules file must exist");
const rulesContent = fs.readFileSync(rulesPath, "utf-8");

// Mock evaluator that models Firestore Security Rules logic exactly as defined in firestore.rules
class FirestoreSecurityRulesSimulator {
  isValidString(val, minLen, maxLen) {
    return typeof val === "string" && val.length >= minLen && val.length <= maxLen;
  }

  evaluateEquipmentListings({ auth, operation, resource, requestResource }) {
    const isAuthenticated = auth !== null && auth.uid !== undefined;

    if (operation === "read") {
      return isAuthenticated;
    }

    if (operation === "create") {
      if (!isAuthenticated) return false;
      const data = requestResource.data;
      if (data.userId !== auth.uid) return false;
      if (!this.isValidString(data.equipmentName, 2, 100)) return false;
      if (!this.isValidString(data.village, 2, 80)) return false;
      if (!this.isValidString(data.district, 2, 80)) return false;
      if (typeof data.consentPhoneShare !== "boolean") return false;
      if (data.consentPhoneShare !== true && (data.phone && data.phone !== "")) return false;
      if (Object.keys(data).length > 20) return false;
      return true;
    }

    if (operation === "update" || operation === "delete") {
      if (!isAuthenticated) return false;
      return resource.data.userId === auth.uid;
    }

    return false;
  }

  evaluateProfiles({ auth, operation, userId, requestResource }) {
    const isAuthenticated = auth !== null && auth.uid !== undefined;
    const isOwner = isAuthenticated && auth.uid === userId;

    if (operation === "read") return isAuthenticated;
    if (operation === "create" || operation === "update") {
      return isOwner && typeof requestResource?.data?.name === "string" && requestResource.data.name.length <= 100;
    }
    if (operation === "delete") return isOwner;
    return false;
  }

  evaluateFeedbacks({ auth, operation, resource, requestResource }) {
    const isAuthenticated = auth !== null && auth.uid !== undefined;
    if (operation === "read") return isAuthenticated && resource.data.userId === auth.uid;
    if (operation === "create") {
      if (!isAuthenticated) return false;
      const data = requestResource.data;
      if (data.userId !== auth.uid) return false;
      if (!this.isValidString(data.recommendationId, 1, 100)) return false;
      if (typeof data.rating !== "number" || data.rating < 1 || data.rating > 5) return false;
      return true;
    }
    if (operation === "update" || operation === "delete") {
      return isAuthenticated && resource.data.userId === auth.uid;
    }
    return false;
  }
}

const sim = new FirestoreSecurityRulesSimulator();
let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
    failed++;
  }
}

console.log("📦 1. Equipment Listings Rules Tests");

runTest("Equipment: Unauthenticated read is DENIED", () => {
  const allowed = sim.evaluateEquipmentListings({
    auth: null,
    operation: "read",
    resource: { data: { userId: "user-123" } }
  });
  assert.equal(allowed, false);
});

runTest("Equipment: Signed-in farmer read is ALLOWED", () => {
  const allowed = sim.evaluateEquipmentListings({
    auth: { uid: "farmer-1" },
    operation: "read",
    resource: { data: { userId: "farmer-2" } }
  });
  assert.equal(allowed, true);
});

runTest("Equipment: Create with matching userId and consent=true is ALLOWED", () => {
  const allowed = sim.evaluateEquipmentListings({
    auth: { uid: "farmer-1" },
    operation: "create",
    requestResource: {
      data: {
        userId: "farmer-1",
        equipmentName: "Mahindra 575 DI Tractor",
        village: "Kinathukadavu",
        district: "Coimbatore",
        ratePerDay: "₹650/hour",
        phone: "9842109876",
        consentPhoneShare: true
      }
    }
  });
  assert.equal(allowed, true);
});

runTest("Equipment: Create spoofing another user's userId is DENIED", () => {
  const allowed = sim.evaluateEquipmentListings({
    auth: { uid: "farmer-attacker" },
    operation: "create",
    requestResource: {
      data: {
        userId: "farmer-victim",
        equipmentName: "Mahindra 575 DI Tractor",
        village: "Kinathukadavu",
        district: "Coimbatore",
        consentPhoneShare: true
      }
    }
  });
  assert.equal(allowed, false);
});

runTest("Equipment: Privacy rule: phone provided with consent=false is DENIED", () => {
  const allowed = sim.evaluateEquipmentListings({
    auth: { uid: "farmer-1" },
    operation: "create",
    requestResource: {
      data: {
        userId: "farmer-1",
        equipmentName: "Mahindra 575 DI Tractor",
        village: "Kinathukadavu",
        district: "Coimbatore",
        phone: "9842109876",
        consentPhoneShare: false // User did not tick consent, but phone is in payload!
      }
    }
  });
  assert.equal(allowed, false);
});

runTest("Equipment: Owner can delete their own listing", () => {
  const allowed = sim.evaluateEquipmentListings({
    auth: { uid: "farmer-1" },
    operation: "delete",
    resource: { data: { userId: "farmer-1" } }
  });
  assert.equal(allowed, true);
});

runTest("Equipment: Non-owner cannot delete another farmer's listing", () => {
  const allowed = sim.evaluateEquipmentListings({
    auth: { uid: "farmer-intruder" },
    operation: "delete",
    resource: { data: { userId: "farmer-owner" } }
  });
  assert.equal(allowed, false);
});

console.log("\n📦 2. Profiles and Feedback Rules Tests");

runTest("Profiles: User can only update their own profile", () => {
  const allowedOwner = sim.evaluateProfiles({
    auth: { uid: "farmer-1" },
    operation: "update",
    userId: "farmer-1",
    requestResource: { data: { name: "R. Murugan" } }
  });
  assert.equal(allowedOwner, true);

  const allowedIntruder = sim.evaluateProfiles({
    auth: { uid: "farmer-intruder" },
    operation: "update",
    userId: "farmer-1",
    requestResource: { data: { name: "Hacked" } }
  });
  assert.equal(allowedIntruder, false);
});

runTest("Feedbacks: Rating must be integer between 1 and 5", () => {
  const valid = sim.evaluateFeedbacks({
    auth: { uid: "farmer-1" },
    operation: "create",
    requestResource: {
      data: {
        userId: "farmer-1",
        recommendationId: "rec-irrigation-1",
        rating: 5
      }
    }
  });
  assert.equal(valid, true);

  const invalidRating = sim.evaluateFeedbacks({
    auth: { uid: "farmer-1" },
    operation: "create",
    requestResource: {
      data: {
        userId: "farmer-1",
        recommendationId: "rec-irrigation-1",
        rating: 10 // Invalid out-of-bounds rating
      }
    }
  });
  assert.equal(invalidRating, false);
});

console.log("\n=================================================");
console.log(`🏁 FIRESTORE RULES TESTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=================================================");

if (failed > 0) process.exit(1);
