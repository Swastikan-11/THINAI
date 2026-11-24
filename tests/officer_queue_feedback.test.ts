// Tests for Officer Review Queue Prioritization and Weak Farmer Feedback
// SAFETY: Validates priority scoring, officer labeling actions, and weak feedback constraints.

import { describe, it, expect } from "vitest";
import {
  calculateReviewPriority,
  sortQueueByPriority,
  applyOfficerReviewAction,
  DEFAULT_PRIORITY_WEIGHTS,
  type QueuedReviewCase,
  type OfficerReviewVerdict,
} from "../src/services/officerQueueService";
import {
  computeFeedbackReliability,
  canBeUsedForModelTraining,
  type FarmerWeakFeedback,
} from "../src/services/weakFeedbackService";

describe("Officer Review Queue Priority Scoring", () => {
  it("computes higher priority for uncertain cases with farmer disagreement", () => {
    const highUrgencyCase: QueuedReviewCase = {
      id: "case-001",
      userId: "u-1",
      crop: "Paddy",
      predictedClass: "Paddy___Blast",
      calibratedConfidence: 0.35,
      uncertaintyScore: 0.85,
      tier: "TIER_3_INCONCLUSIVE",
      farmerVerdict: "NO",
      district: "Thanjavur",
      timestamp: "2026-11-24T10:00:00Z",
      imageQualityCheck: "PASSED",
      isUrgentOutbreakRisk: true,
    };

    const lowUrgencyCase: QueuedReviewCase = {
      id: "case-002",
      userId: "u-2",
      crop: "Tomato",
      predictedClass: "Tomato___Early_blight",
      calibratedConfidence: 0.92,
      uncertaintyScore: 0.10,
      tier: "TIER_1_CONFIDENT",
      farmerVerdict: "YES",
      district: "Coimbatore",
      timestamp: "2026-11-24T10:00:00Z",
      imageQualityCheck: "PASSED",
      isUrgentOutbreakRisk: false,
    };

    const highP = calculateReviewPriority(highUrgencyCase);
    const lowP = calculateReviewPriority(lowUrgencyCase);

    expect(highP.priorityScore).toBeGreaterThan(0.65);
    expect(lowP.priorityScore).toBeLessThan(0.35);
    expect(highP.priorityScore).toBeGreaterThan(lowP.priorityScore);
  });

  it("respects custom priority weights", () => {
    const sampleCase: QueuedReviewCase = {
      id: "case-003",
      userId: "u-3",
      crop: "Tomato",
      predictedClass: "Tomato___Early_blight",
      calibratedConfidence: 0.50,
      uncertaintyScore: 0.90, // very high uncertainty
      tier: "TIER_2_MODERATE",
      farmerVerdict: "YES", // agreement
      district: "Madurai",
      timestamp: "2026-11-24T10:00:00Z",
    };

    // When uncertainty weight is heavily dominant
    const customWeights = {
      ...DEFAULT_PRIORITY_WEIGHTS,
      w1_modelUncertainty: 0.80,
      w2_farmerDisagreement: 0.05,
    };

    const pCustom = calculateReviewPriority(sampleCase, customWeights);
    const pDefault = calculateReviewPriority(sampleCase, DEFAULT_PRIORITY_WEIGHTS);

    expect(pCustom.priorityScore).toBeGreaterThan(pDefault.priorityScore);
  });

  it("sorts cases descending by priority score", () => {
    const cases: QueuedReviewCase[] = [
      {
        id: "low",
        userId: "u-1",
        crop: "Tomato",
        predictedClass: "Tomato___Early_blight",
        calibratedConfidence: 0.90,
        uncertaintyScore: 0.1,
        tier: "TIER_1_CONFIDENT",
        farmerVerdict: "YES",
        district: "Coimbatore",
        timestamp: "2026-11-24T10:00:00Z",
      },
      {
        id: "high",
        userId: "u-2",
        crop: "Paddy",
        predictedClass: "Paddy___Blast",
        calibratedConfidence: 0.30,
        uncertaintyScore: 0.85,
        tier: "TIER_3_INCONCLUSIVE",
        farmerVerdict: "NO",
        district: "Thanjavur",
        timestamp: "2026-11-24T10:00:00Z",
      },
      {
        id: "mid",
        userId: "u-3",
        crop: "Potato",
        predictedClass: "Potato___Late_blight",
        calibratedConfidence: 0.55,
        uncertaintyScore: 0.45,
        tier: "TIER_2_MODERATE",
        farmerVerdict: "NOT_SURE",
        district: "Dindigul",
        timestamp: "2026-11-24T10:00:00Z",
      },
    ];

    const sorted = sortQueueByPriority(cases);
    expect(sorted[0].id).toBe("high");
    expect(sorted[sorted.length - 1].id).toBe("low");
  });
});

describe("Officer Labeling Actions", () => {
  const baseCase: QueuedReviewCase = {
    id: "diag-101",
    userId: "usr-42",
    crop: "Tomato",
    predictedClass: "Tomato___Early_blight",
    calibratedConfidence: 0.70,
    tier: "TIER_2_MODERATE",
    district: "Salem",
    timestamp: "2026-11-24T12:00:00Z",
  };

  it("applies CONFIRM_DIAGNOSIS action", () => {
    const action: OfficerReviewVerdict = {
      diagnosisId: "diag-101",
      action: "CONFIRM_DIAGNOSIS",
      officerId: "off-9",
      officerName: "Dr. K. Raman",
      confirmedPathogen: "Tomato___Early_blight",
      notes: "Clear concentric target rings verified.",
      timestamp: "2026-11-24T12:30:00Z",
    };

    const updated = applyOfficerReviewAction(baseCase, action);
    expect(updated.expertLabel).toBe("Tomato___Early_blight");
    expect(updated.expertNotes).toBe("Clear concentric target rings verified.");
  });

  it("applies CORRECT_DIAGNOSIS action", () => {
    const action: OfficerReviewVerdict = {
      diagnosisId: "diag-101",
      action: "CORRECT_DIAGNOSIS",
      officerId: "off-9",
      officerName: "Dr. K. Raman",
      correctedPathogen: "Tomato___Septoria_leaf_spot",
      notes: "Small circular spots with dark margins, not early blight.",
      timestamp: "2026-11-24T12:30:00Z",
    };

    const updated = applyOfficerReviewAction(baseCase, action);
    expect(updated.expertLabel).toBe("Tomato___Septoria_leaf_spot");
  });

  it("applies MARK_UNUSABLE action", () => {
    const action: OfficerReviewVerdict = {
      diagnosisId: "diag-101",
      action: "MARK_UNUSABLE",
      officerId: "off-9",
      officerName: "Dr. K. Raman",
      unusableReason: "Heavy camera shake blur",
      timestamp: "2026-11-24T12:30:00Z",
    };

    const updated = applyOfficerReviewAction(baseCase, action);
    expect(updated.expertLabel).toContain("UNUSABLE");
    expect(updated.expertLabel).toContain("Heavy camera shake blur");
  });

  it("applies MARK_NEEDS_INFO action", () => {
    const action: OfficerReviewVerdict = {
      diagnosisId: "diag-101",
      action: "MARK_NEEDS_INFO",
      officerId: "off-9",
      officerName: "Dr. K. Raman",
      notes: "Need underside leaf view to check for sporulation.",
      timestamp: "2026-11-24T12:30:00Z",
    };

    const updated = applyOfficerReviewAction(baseCase, action);
    expect(updated.expertLabel).toBe("NEEDS_MORE_INFORMATION");
  });
});

describe("Farmer Feedback Weak Signal & Training Guards", () => {
  it("computes realistic reliability scores bounded between 0.05 and 0.95", () => {
    const normalScore = computeFeedbackReliability({
      confidence: 75,
      farmerVerdict: "YES",
      imageQualityCheck: "PASSED",
    });
    expect(normalScore).toBeGreaterThanOrEqual(0.05);
    expect(normalScore).toBeLessThanOrEqual(0.95);

    const badQualityScore = computeFeedbackReliability({
      confidence: 75,
      farmerVerdict: "YES",
      imageQualityCheck: "NON_VEGETATION",
    });
    expect(badQualityScore).toBeLessThan(normalScore);
  });

  it("STRICT SAFETY INVARIANT: Feedback cannot be used for model training unless confirmed by an officer", () => {
    const unreviewedFeedback: FarmerWeakFeedback = {
      id: "fb-1",
      farmerId: "f-123",
      crop: "Tomato",
      modelPrediction: "Tomato___Early_blight",
      confidence: 88,
      language: "English",
      adviceTierShown: "TIER_2_MODERATE",
      farmerVerdict: "YES",
      timestamp: "2026-11-24T12:00:00Z",
      officerOutcome: "PENDING",
      reliabilityScore: 0.60,
      disclaimer: "Weak signal notice",
    };

    // Farmer saying "YES" with 88% confidence must STILL NOT be usable for training
    expect(canBeUsedForModelTraining(unreviewedFeedback)).toBe(false);

    // Farmer saying "NO" must also NOT be used for training
    const overruledFeedback: FarmerWeakFeedback = {
      ...unreviewedFeedback,
      officerOutcome: "OVERRULED",
    };
    expect(canBeUsedForModelTraining(overruledFeedback)).toBe(false);

    // ONLY when an extension officer has independently confirmed it:
    const confirmedFeedback: FarmerWeakFeedback = {
      ...unreviewedFeedback,
      officerOutcome: "CONFIRMED",
    };
    expect(canBeUsedForModelTraining(confirmedFeedback)).toBe(true);
  });
});
