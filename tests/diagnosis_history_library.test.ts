import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { HEALTH_LIBRARY } from "../src/app/components/CropHealthLibrary";
import { db, LocalScan } from "../src/services/db";
import { getConfidenceGatedTier } from "../src/services/litertInferenceService";

describe("Phase 3 - Feature 1: Diagnosis History & Verified Disease Library Suite", () => {
  beforeEach(async () => {
    await db.scans.clear();
  });

  describe("1. Verified Disease Library Content & Bilingual Coverage", () => {
    it("contains verified plant pathology entries with complete English and Tamil names", () => {
      expect(HEALTH_LIBRARY.length).toBeGreaterThanOrEqual(8);
      HEALTH_LIBRARY.forEach(entry => {
        expect(entry.id).toBeTruthy();
        expect(entry.name).toBeTruthy();
        expect(entry.nameTa).toBeTruthy();
        expect(entry.scientificName).toBeTruthy();
        expect(entry.crops.length).toBeGreaterThan(0);
      });
    });

    it("verifies that all symptoms, prevention, and treatments have both English and Tamil translations", () => {
      HEALTH_LIBRARY.forEach(entry => {
        expect(entry.symptoms.length).toBeGreaterThan(0);
        expect(entry.symptomsTa.length).toBeGreaterThan(0);
        expect(entry.prevention.length).toBeGreaterThan(0);
        expect(entry.preventionTa.length).toBeGreaterThan(0);
        expect(entry.treatment).toBeTruthy();
        expect(entry.treatmentTa).toBeTruthy();
        expect(entry.identification).toBeTruthy();
        expect(entry.identificationTa).toBeTruthy();
        expect(entry.safetyGuidance).toBeTruthy();
        expect(entry.safetyGuidanceTa).toBeTruthy();
      });
    });

    it("enforces verified official sources (TNAU / ICAR / CIBRC) on every library entry", () => {
      const allowedSources = ["TNAU", "ICAR", "CIBRC", "Directorate of Rice Development"];
      HEALTH_LIBRARY.forEach(entry => {
        expect(entry.remedySource).toBeTruthy();
        const hasOfficialSource = allowedSources.some(src => 
          entry.remedySource.includes(src) || entry.reference.includes(src)
        );
        expect(hasOfficialSource).toBe(true);
        expect(entry.remedySourceUrl).toMatch(/^https?:\/\//);
      });
    });

    it("ensures every remedy is explicitly marked UNVERIFIED pending clinical sign-off", () => {
      HEALTH_LIBRARY.forEach(entry => {
        expect(entry.remedyStatus).toBe("UNVERIFIED");
        expect(entry.verificationNote).toContain("UNVERIFIED");
      });
    });
  });

  describe("2. Offline Dexie Scan History Storage & Search Querying", () => {
    it("stores multiple scans and retrieves them sorted by scannedAt descending", async () => {
      const scan1: LocalScan = {
        id: "scan-001",
        userId: "local-user",
        cropName: "Tomato",
        diseaseName: "Tomato Early Blight",
        scientificName: "Alternaria solani",
        confidence: 85.4,
        severity: "High",
        isReliable: true,
        immediateAction: "Prune affected bottom leaves",
        preventionAdvice: "Apply mulch; avoid overhead wetting",
        scannedAt: "2026-10-24T08:00:00.000Z",
        pendingSync: false,
        synced: true
      };

      const scan2: LocalScan = {
        id: "scan-002",
        userId: "local-user",
        cropName: "Potato",
        diseaseName: "Potato Late Blight",
        scientificName: "Phytophthora infestans",
        confidence: 62.0,
        severity: "High",
        isReliable: true,
        immediateAction: "Inspect tuber stems",
        preventionAdvice: "Improve field drainage",
        scannedAt: "2026-10-24T09:30:00.000Z",
        pendingSync: true,
        synced: false
      };

      await db.scans.put(scan1);
      await db.scans.put(scan2);

      const all = await db.scans.orderBy("scannedAt").reverse().toArray();
      expect(all.length).toBe(2);
      expect(all[0].id).toBe("scan-002"); // Most recent first
      expect(all[1].id).toBe("scan-001");
    });

    it("filters scan history by search query (crop or disease name)", async () => {
      await db.scans.bulkPut([
        {
          id: "scan-paddy-1",
          userId: "local-user",
          cropName: "Paddy",
          diseaseName: "Rice Blast",
          confidence: 81.0,
          severity: "High",
          isReliable: true,
          scannedAt: "2026-10-24T07:00:00.000Z",
          pendingSync: false,
          synced: true
        },
        {
          id: "scan-tomato-1",
          userId: "local-user",
          cropName: "Tomato",
          diseaseName: "Tomato Early Blight",
          confidence: 88.0,
          severity: "High",
          isReliable: true,
          scannedAt: "2026-10-24T07:15:00.000Z",
          pendingSync: false,
          synced: true
        }
      ]);

      const scans = await db.scans.toArray();
      const query = "paddy";
      const matched = scans.filter(s => 
        s.cropName.toLowerCase().includes(query) || s.diseaseName.toLowerCase().includes(query)
      );

      expect(matched.length).toBe(1);
      expect(matched[0].id).toBe("scan-paddy-1");
    });

    it("accurately categorizes historical scans into Tiers", () => {
      const tier1ScanConfidence = 85.0;
      const tier2ScanConfidence = 55.0;
      const tier3ScanConfidence = 30.0;

      expect(getConfidenceGatedTier(tier1ScanConfidence / 100, 0.78, 0.45)).toBe("TIER_1_CONFIDENT");
      expect(getConfidenceGatedTier(tier2ScanConfidence / 100, 0.78, 0.45)).toBe("TIER_2_MODERATE");
      expect(getConfidenceGatedTier(tier3ScanConfidence / 100, 0.78, 0.45)).toBe("TIER_3_INCONCLUSIVE");
    });
  });

  describe("3. Tier Logic Invariance", () => {
    it("preserves unchanged calibration thresholds: tau_high=0.78, tau_low=0.45", () => {
      expect(getConfidenceGatedTier(0.78, 0.78, 0.45)).toBe("TIER_1_CONFIDENT");
      expect(getConfidenceGatedTier(0.779, 0.78, 0.45)).toBe("TIER_2_MODERATE");
      expect(getConfidenceGatedTier(0.45, 0.78, 0.45)).toBe("TIER_2_MODERATE");
      expect(getConfidenceGatedTier(0.449, 0.78, 0.45)).toBe("TIER_3_INCONCLUSIVE");
    });
  });
});
