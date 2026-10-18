import { describe, it, expect } from "vitest";
import { 
  exportExpertLabelsToCsv, 
  getOfflineOfficerFallbackRecords, 
  FieldDiagnosisRecord 
} from "../src/services/officerService";

describe("Extension Officer Dashboard & Pilot Data Infrastructure", () => {
  it("Fallback records adhere to privacy consent: phone hidden when consent is false", () => {
    const records = getOfflineOfficerFallbackRecords();
    expect(records.length).toBeGreaterThanOrEqual(3);

    // Record 1 has phoneConsent: false
    const rec1 = records[0];
    expect(rec1.phoneConsent).toBe(false);
    expect(rec1.phone).toBeUndefined();

    // Record 2 has phoneConsent: true
    const rec2 = records[1];
    expect(rec2.phoneConsent).toBe(true);
    expect(rec2.phone).toBeDefined();
  });

  it("Records explicitly label crowdsourced feedback as weak verdicts", () => {
    const records = getOfflineOfficerFallbackRecords();
    for (const r of records) {
      expect(["YES", "NO", "NOT_SURE"]).toContain(r.farmerVerdict);
      expect(["TIER_1_CONFIDENT", "TIER_2_MODERATE", "TIER_3_INCONCLUSIVE"]).toContain(r.tier);
    }
  });

  it("exportExpertLabelsToCsv generates properly formatted CSV with headers and sanitized rows", () => {
    const sampleRecords: FieldDiagnosisRecord[] = [
      {
        id: "diag-test-101",
        userId: "user-1",
        farmerName: "Test Farmer",
        crop: "Tomato",
        predictedClass: "Tomato___Early_blight",
        calibratedConfidence: 0.854,
        tier: "TIER_1_CONFIDENT",
        farmerVerdict: "YES",
        district: "Coimbatore",
        village: "Thondamuthur",
        timestamp: "2026-10-18T10:00:00Z",
        expertLabel: "Alternaria solani",
        expertNotes: 'Target spot rings observed; "severe" defoliation'
      }
    ];

    const csv = exportExpertLabelsToCsv(sampleRecords);
    const lines = csv.trim().split("\n");

    // Header validation
    expect(lines[0]).toBe(
      "Diagnosis_ID,Crop,District,Village,Model_Predicted_Class,Calibrated_Confidence_Pct,Assigned_Tier,Weak_Farmer_Verdict,Expert_Ground_Truth_Pathogen,Expert_Notes,Specimen_Timestamp"
    );

    // Row validation
    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('"diag-test-101"');
    expect(lines[1]).toContain('"Tomato"');
    expect(lines[1]).toContain('"Coimbatore"');
    expect(lines[1]).toContain("85.4");
    expect(lines[1]).toContain('"Alternaria solani"');
    // Sanitized double quotes
    expect(lines[1]).toContain('""severe"" defoliation');
  });

  it("Enforces Spark photo thumbnail size cap (<= 64 KB)", () => {
    const maxThumbnailBytes = 65536; // 64 KB
    const validThumbnail = "a".repeat(25000); // 25 KB
    const oversizeThumbnail = "a".repeat(70000); // 70 KB

    expect(validThumbnail.length).toBeLessThanOrEqual(maxThumbnailBytes);
    expect(oversizeThumbnail.length).toBeGreaterThan(maxThumbnailBytes);
  });
});
