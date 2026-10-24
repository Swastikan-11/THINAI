import { describe, it, expect, vi, beforeEach } from "vitest";
import cropRegistry from "../data/crop_registry.json";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { 
  getAllCrops, 
  getCropById, 
  isCropPackInstalled, 
  downloadCropPack, 
  computeSha256, 
  checkStorageCapacity 
} from "../src/services/cropPackService";
import { 
  STATUS_A_CROPS, 
  STATUS_B_CROPS, 
  STATUS_C_CROPS, 
  runNeuralDiseaseInference 
} from "../src/services/litertInferenceService";

describe("Phase 2B: Crop Coverage Registry & Gating Standards", () => {
  it("includes all required major Tamil Nadu crops in the registry", () => {
    const requiredCrops = [
      "paddy", "sugarcane", "groundnut", "cotton", "banana", "maize",
      "ragi", "cholam", "bajra", "black_gram", "green_gram", "red_gram",
      "coconut", "mango", "chilli", "tomato", "brinjal", "onion",
      "turmeric", "potato", "tapioca"
    ];

    const crops = getAllCrops();
    const registeredIds = crops.map(c => c.crop_id.toLowerCase());

    for (const req of requiredCrops) {
      expect(registeredIds).toContain(req);
    }
  });

  it("strictly enforces rule: Status A crops MUST have an existing validation evidence file", () => {
    const crops = getAllCrops();
    const statusACrops = crops.filter(c => c.model_status === "A");

    expect(statusACrops.length).toBeGreaterThanOrEqual(4);

    for (const crop of statusACrops) {
      expect(crop.validation_evidence_file).toBeTruthy();
      const evidencePath = path.resolve(crop.validation_evidence_file!);
      expect(fs.existsSync(evidencePath)).toBe(true);

      const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf-8"));
      expect(evidence.overall_accuracy).toBeDefined();
    }
  });

  it("strictly enforces rule: Status B crops must NOT claim Tamil Nadu field validation", () => {
    const crops = getAllCrops();
    const statusBCrops = crops.filter(c => c.model_status === "B");

    expect(statusBCrops.length).toBeGreaterThanOrEqual(6);

    for (const crop of statusBCrops) {
      // Must not have an active field validation evidence file
      expect(crop.validation_evidence_file).toBeNull();
      // Must have verified open licence
      expect(crop.dataset_license).toContain("CC BY");
    }
  });

  it("strictly enforces rule: Status C crops have no model and refer to AAO", () => {
    const crops = getAllCrops();
    const statusCCrops = crops.filter(c => c.model_status === "C");

    expect(statusCCrops.length).toBeGreaterThanOrEqual(5);

    for (const crop of statusCCrops) {
      expect(crop.pack_info).toBeNull();
      expect(crop.image_count).toBe(0);
      expect(crop.classes.length).toBe(0);
    }
  });

  it("verifies SHA-256 checksums and file sizes for all generated crop packs", () => {
    const crops = getAllCrops();
    const packedCrops = crops.filter(c => c.pack_info !== null);

    for (const crop of packedCrops) {
      const pack = crop.pack_info!;
      const relativeWeightsPath = pack.weights_file.replace(/^\//, "");
      const fullPath = path.resolve("public", relativeWeightsPath);

      expect(fs.existsSync(fullPath)).toBe(true);

      const buffer = fs.readFileSync(fullPath);
      expect(buffer.length).toBe(pack.size_bytes);

      const hash = crypto.createHash("sha256").update(buffer).digest("hex");
      expect(hash).toBe(pack.sha256);
    }
  });
});

describe("Phase 2B: On-Demand Pack Downloader & Storage Quota", () => {
  it("detects low device storage and returns a warning before downloading", async () => {
    // Mock navigator.storage.estimate with only 10MB free
    vi.stubGlobal("navigator", {
      storage: {
        estimate: vi.fn().mockResolvedValue({
          quota: 100 * 1024 * 1024,
          usage: 95 * 1024 * 1024 // 5MB available, below 15MB safety margin
        })
      }
    });

    const check = await checkStorageCapacity(25000);
    expect(check.sufficient).toBe(false);
    expect(check.warningMessage).toContain("Low device storage");

    vi.unstubAllGlobals();
  });

  it("allows download when storage capacity is ample", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        estimate: vi.fn().mockResolvedValue({
          quota: 1000 * 1024 * 1024,
          usage: 100 * 1024 * 1024 // 900MB available
        })
      }
    });

    const check = await checkStorageCapacity(25000);
    expect(check.sufficient).toBe(true);

    vi.unstubAllGlobals();
  });
});

describe("Phase 2B: Status-Specific Model Gating Invariants", () => {
  it("immediately returns AAO referral for Status C crops with zero chemical advice", async () => {
    // Create empty 224x224 ImageData
    const fakeData = {
      data: new Uint8ClampedArray(224 * 224 * 4),
      width: 224,
      height: 224
    } as ImageData;

    const result = await runNeuralDiseaseInference(fakeData, "Ragi");

    expect(result.source).toBe("UNSUPPORTED_CROP");
    expect(result.tier).toBe("TIER_3_INCONCLUSIVE");
    expect(result.isReliable).toBe(false);
    expect(result.chemicalTreatment.length).toBe(0);
    expect(result.immediateAction).toContain("Assistant Agricultural Officer");
  });

  it("strictly suppresses chemical treatments for Status B crops (Unverified Public Models)", async () => {
    // Simulated Cotton leaf image data
    const fakeData = {
      data: new Uint8ClampedArray(224 * 224 * 4).fill(120),
      width: 224,
      height: 224
    } as ImageData;

    const result = await runNeuralDiseaseInference(fakeData, "Cotton");

    // Must never produce Tier 1 for Status B
    expect(result.tier).not.toBe("TIER_1_CONFIDENT");
    expect(result.isReliable).toBe(false);
    // Chemical treatments must either be empty or state withheld
    for (const chem of result.chemicalTreatment) {
      expect(chem.toLowerCase()).toMatch(/withheld|no chemical/);
    }
  });

  it("allows 3-tier selective gating for Status A crops like Paddy", async () => {
    expect(STATUS_A_CROPS.map(c => c.toLowerCase())).toContain("paddy");
    expect(STATUS_A_CROPS.map(c => c.toLowerCase())).toContain("tomato");
  });
});
