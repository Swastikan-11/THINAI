// Tests for Evidence Registry Validation and Advice Tier Engine
// SAFETY: These tests verify that the evidence registry correctly gates advice.

import { describe, it, expect } from "vitest";
import {
  ADVICE_POLICY,
  validateEvidenceEntry,
  validateRegistry,
  type CropEvidenceEntry,
} from "../src/config/advicePolicy";
import {
  determineAdviceTier,
  getEvidenceLevel,
  getMaxAllowedTier,
  getEvidenceEntry,
  getAllEvidenceEntries,
  getRegistrySummary,
} from "../src/services/evidenceTierEngine";
import registryData from "../src/data/cropEvidenceRegistry.json";

describe("Advice Policy Configuration", () => {
  it("has conservative default thresholds", () => {
    expect(ADVICE_POLICY.CONFIDENCE_HIGH_THRESHOLD).toBe(0.78);
    expect(ADVICE_POLICY.CONFIDENCE_MEDIUM_THRESHOLD).toBe(0.45);
    expect(ADVICE_POLICY.ALLOW_CHEMICAL_ADVICE).toBe(false);
    expect(ADVICE_POLICY.MINIMUM_FIELD_SAMPLE_COUNT).toBe(50);
    expect(ADVICE_POLICY.MAXIMUM_FIELD_ECE).toBe(0.15);
  });

  it("ALLOW_CHEMICAL_ADVICE is false (global safety flag)", () => {
    // SAFETY: This must be false until a crop-disease pair is field-validated
    expect(ADVICE_POLICY.ALLOW_CHEMICAL_ADVICE).toBe(false);
  });
});

describe("Evidence Registry Validation", () => {
  it("validates all entries in cropEvidenceRegistry.json", () => {
    const entries = registryData as CropEvidenceEntry[];
    const errors = validateRegistry(entries);
    const errorKeys = Object.keys(errors);
    expect(errorKeys).toEqual([]);
  });

  it("rejects invalid evidence level", () => {
    const invalid: CropEvidenceEntry = {
      crop: "Test",
      disease: "Test___disease",
      modelVersion: "v1",
      trainingDataset: "none",
      evidenceLevel: "MAGIC" as any,
      fieldSampleCount: 0,
      fieldAccuracy: null,
      fieldECE: null,
      allowedAdviceTier: "TIER_3_INCONCLUSIVE",
      lastReviewedDate: "2026-01-01",
      reviewStatus: "UNREVIEWED",
      notes: "",
    };
    const errors = validateEvidenceEntry(invalid);
    expect(errors.some((e) => e.includes("evidenceLevel"))).toBe(true);
  });

  it("rejects UNSUPPORTED evidence with non-TIER_3 advice tier", () => {
    const invalid: CropEvidenceEntry = {
      crop: "Test",
      disease: "Test___disease",
      modelVersion: "none",
      trainingDataset: "none",
      evidenceLevel: "UNSUPPORTED",
      fieldSampleCount: 0,
      fieldAccuracy: null,
      fieldECE: null,
      allowedAdviceTier: "TIER_2_MODERATE",
      lastReviewedDate: "2026-01-01",
      reviewStatus: "UNREVIEWED",
      notes: "",
    };
    const errors = validateEvidenceEntry(invalid);
    expect(errors.some((e) => e.includes("UNSUPPORTED"))).toBe(true);
  });

  it("rejects LAB_ONLY evidence with TIER_1 advice tier", () => {
    const invalid: CropEvidenceEntry = {
      crop: "Test",
      disease: "Test___disease",
      modelVersion: "v1",
      trainingDataset: "PlantVillage",
      evidenceLevel: "LAB_ONLY",
      fieldSampleCount: 0,
      fieldAccuracy: null,
      fieldECE: null,
      allowedAdviceTier: "TIER_1_CONFIDENT",
      lastReviewedDate: "2026-01-01",
      reviewStatus: "UNREVIEWED",
      notes: "",
    };
    const errors = validateEvidenceEntry(invalid);
    expect(errors.some((e) => e.includes("LAB_ONLY"))).toBe(true);
  });

  it("rejects FIELD_VALIDATED with insufficient sample count", () => {
    const invalid: CropEvidenceEntry = {
      crop: "Test",
      disease: "Test___disease",
      modelVersion: "v1",
      trainingDataset: "field",
      evidenceLevel: "FIELD_VALIDATED",
      fieldSampleCount: 10,
      fieldAccuracy: 0.90,
      fieldECE: 0.05,
      allowedAdviceTier: "TIER_1_CONFIDENT",
      lastReviewedDate: "2026-01-01",
      reviewStatus: "FIELD_REVIEWED",
      notes: "",
    };
    const errors = validateEvidenceEntry(invalid);
    expect(errors.some((e) => e.includes("fieldSampleCount"))).toBe(true);
  });

  it("rejects FIELD_VALIDATED with high ECE", () => {
    const invalid: CropEvidenceEntry = {
      crop: "Test",
      disease: "Test___disease",
      modelVersion: "v1",
      trainingDataset: "field",
      evidenceLevel: "FIELD_VALIDATED",
      fieldSampleCount: 100,
      fieldAccuracy: 0.90,
      fieldECE: 0.30,
      allowedAdviceTier: "TIER_1_CONFIDENT",
      lastReviewedDate: "2026-01-01",
      reviewStatus: "FIELD_REVIEWED",
      notes: "",
    };
    const errors = validateEvidenceEntry(invalid);
    expect(errors.some((e) => e.includes("fieldECE"))).toBe(true);
  });

  it("detects duplicate entries", () => {
    const duplicates: CropEvidenceEntry[] = [
      {
        crop: "Tomato",
        disease: "Tomato___Early_blight",
        modelVersion: "v1",
        trainingDataset: "PV",
        evidenceLevel: "LAB_ONLY",
        fieldSampleCount: 0,
        fieldAccuracy: null,
        fieldECE: null,
        allowedAdviceTier: "TIER_2_MODERATE",
        lastReviewedDate: "2026-01-01",
        reviewStatus: "UNREVIEWED",
        notes: "",
      },
      {
        crop: "Tomato",
        disease: "Tomato___Early_blight",
        modelVersion: "v1",
        trainingDataset: "PV",
        evidenceLevel: "LAB_ONLY",
        fieldSampleCount: 0,
        fieldAccuracy: null,
        fieldECE: null,
        allowedAdviceTier: "TIER_2_MODERATE",
        lastReviewedDate: "2026-01-01",
        reviewStatus: "UNREVIEWED",
        notes: "",
      },
    ];
    const errors = validateRegistry(duplicates);
    expect(Object.keys(errors).length).toBeGreaterThan(0);
  });
});

describe("Evidence Tier Engine — Lookup", () => {
  it("finds exact match for Tomato___Early_blight", () => {
    const entry = getEvidenceEntry("Tomato___Early_blight");
    expect(entry).not.toBeNull();
    expect(entry!.crop).toBe("Tomato");
    expect(entry!.evidenceLevel).toBe("LAB_ONLY");
  });

  it("returns UNSUPPORTED for unknown disease", () => {
    const level = getEvidenceLevel("FakeCrop___FakeDisease");
    expect(level).toBe("UNSUPPORTED");
  });

  it("returns TIER_3 max allowed tier for unsupported crop", () => {
    const tier = getMaxAllowedTier("FakeCrop___FakeDisease", "FakeCrop");
    expect(tier).toBe("TIER_3_INCONCLUSIVE");
  });

  it("returns TIER_3 max for Paddy (UNSUPPORTED in registry)", () => {
    const tier = getMaxAllowedTier("Paddy___Blast", "Paddy");
    expect(tier).toBe("TIER_3_INCONCLUSIVE");
  });

  it("returns registry summary", () => {
    const summary = getRegistrySummary();
    expect(summary.total).toBeGreaterThan(0);
    expect(summary.fieldValidated).toBe(0); // None field-validated at baseline
    expect(summary.labOnly).toBeGreaterThan(0);
    expect(summary.unsupported).toBeGreaterThan(0);
  });
});

describe("Evidence Tier Engine — Decision Logic", () => {
  it("LAB_ONLY + high confidence → TIER_2 (demoted, no chemicals)", () => {
    const decision = determineAdviceTier(0.95, "Tomato___Early_blight");
    expect(decision.tier).toBe("TIER_2_MODERATE");
    expect(decision.evidenceLevel).toBe("LAB_ONLY");
    expect(decision.wasDemoted).toBe(true);
    expect(decision.chemicalAdviceAllowed).toBe(false);
  });

  it("LAB_ONLY + medium confidence → TIER_2", () => {
    const decision = determineAdviceTier(0.60, "Tomato___Early_blight");
    expect(decision.tier).toBe("TIER_2_MODERATE");
    expect(decision.wasDemoted).toBe(false);
    expect(decision.chemicalAdviceAllowed).toBe(false);
  });

  it("LAB_ONLY + low confidence → TIER_3", () => {
    const decision = determineAdviceTier(0.30, "Tomato___Early_blight");
    expect(decision.tier).toBe("TIER_3_INCONCLUSIVE");
    expect(decision.chemicalAdviceAllowed).toBe(false);
  });

  it("UNSUPPORTED crop → always TIER_3 regardless of confidence", () => {
    const decision = determineAdviceTier(0.99, "Paddy___Blast", "Paddy");
    expect(decision.tier).toBe("TIER_3_INCONCLUSIVE");
    expect(decision.evidenceLevel).toBe("UNSUPPORTED");
    expect(decision.chemicalAdviceAllowed).toBe(false);
  });

  it("completely unknown disease → TIER_3", () => {
    const decision = determineAdviceTier(0.99, "MysteryPlant___MysteryDisease");
    expect(decision.tier).toBe("TIER_3_INCONCLUSIVE");
    expect(decision.evidenceLevel).toBe("UNSUPPORTED");
    expect(decision.chemicalAdviceAllowed).toBe(false);
  });

  it("chemical advice is never allowed when ALLOW_CHEMICAL_ADVICE is false", () => {
    // Even if we hypothetically had a FIELD_VALIDATED entry
    // The global flag prevents chemical advice
    const allEntries = getAllEvidenceEntries();
    for (const entry of allEntries) {
      const decision = determineAdviceTier(0.99, entry.disease, entry.crop);
      expect(decision.chemicalAdviceAllowed).toBe(false);
    }
  });

  it("decision includes human-readable reason", () => {
    const decision = determineAdviceTier(0.80, "Tomato___Late_blight");
    expect(decision.reason).toBeTruthy();
    expect(typeof decision.reason).toBe("string");
    expect(decision.reason.length).toBeGreaterThan(10);
  });

  it("confidence tier is calculated independently of evidence", () => {
    const decision = determineAdviceTier(0.90, "Tomato___Late_blight");
    expect(decision.confidenceTier).toBe("TIER_1_CONFIDENT");
    // But final tier is demoted due to LAB_ONLY
    expect(decision.tier).toBe("TIER_2_MODERATE");
  });
});
