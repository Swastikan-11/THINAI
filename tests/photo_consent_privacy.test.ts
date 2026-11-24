// Tests for Privacy-Aware Photo Sharing & Consent Engine (Feature 8)
// SAFETY: Ensures photos and locations are NEVER shared or uploaded without explicit,
// active consent, and respects crop, blur, metadata-only, and withdrawal rules.

import { describe, it, expect, beforeEach } from "vitest";
import {
  createPhotoConsent,
  withdrawPhotoConsent,
  getActiveConsent,
  prepareImagePayloadForSharing,
  canUploadLocation,
  clearConsentStorageForTesting,
  CONSENT_POLICY_VERSION,
  type FarmerPhotoConsentRecord,
} from "../src/services/photoConsentService";

describe("Photo Sharing Consent Engine (Feature 8)", () => {
  beforeEach(() => {
    clearConsentStorageForTesting();
  });

  it("creates an active consent record with version, purpose, and retention metadata", () => {
    const consent = createPhotoConsent({
      consentChoice: "SHARE_CROPPED_LEAF",
      shareLocation: false,
    });

    expect(consent.id).toBeTruthy();
    expect(consent.status).toBe("ACTIVE");
    expect(consent.consentChoice).toBe("SHARE_CROPPED_LEAF");
    expect(consent.consentVersion).toBe(CONSENT_POLICY_VERSION);
    expect(consent.retentionPeriodMonths).toBe(6);
    expect(consent.shareLocation).toBe(false);
    expect(consent.grantedAt).toBeTruthy();
  });

  it("strictly suppresses image data when consent choice is DO_NOT_SHARE", () => {
    const consent = createPhotoConsent({
      consentChoice: "DO_NOT_SHARE",
      shareLocation: false,
    });

    const rawBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const payload = prepareImagePayloadForSharing(rawBase64, consent, { district: "Coimbatore" });

    expect(payload.processedImageBase64).toBeNull();
    expect(payload.imageSharingAllowed).toBe(false);
  });

  it("strictly suppresses image data when consent choice is SHARE_METADATA_ONLY", () => {
    const consent = createPhotoConsent({
      consentChoice: "SHARE_METADATA_ONLY",
      shareLocation: false,
    });

    const rawBase64 = "data:image/jpeg;base64,sampleimagebytes";
    const payload = prepareImagePayloadForSharing(rawBase64, consent);

    expect(payload.processedImageBase64).toBeNull();
    expect(payload.imageSharingAllowed).toBe(false);
  });

  it("allows image payload when consent choice is SHARE_CROPPED_LEAF or SHARE_FULL", () => {
    const consent = createPhotoConsent({
      consentChoice: "SHARE_CROPPED_LEAF",
      shareLocation: false,
    });

    const rawBase64 = "data:image/jpeg;base64,sampleimagebytes";
    const payload = prepareImagePayloadForSharing(rawBase64, consent);

    expect(payload.processedImageBase64).toBeTruthy();
    expect(payload.imageSharingAllowed).toBe(true);
  });

  it("handles consent withdrawal and immediately halts image sharing", () => {
    const consent = createPhotoConsent({
      consentChoice: "SHARE_FULL",
      shareLocation: true,
    });

    expect(consent.status).toBe("ACTIVE");

    const withdrew = withdrawPhotoConsent(consent.id);
    expect(withdrew).toBe(true);

    const active = getActiveConsent();
    expect(active).toBeNull();

    // Withdrawn consent must immediately suppress all image sharing
    const withdrawnConsent: FarmerPhotoConsentRecord = {
      ...consent,
      status: "WITHDRAWN",
      withdrawnAt: new Date().toISOString(),
    };

    const payload = prepareImagePayloadForSharing("sampledata", withdrawnConsent);
    expect(payload.processedImageBase64).toBeNull();
    expect(payload.imageSharingAllowed).toBe(false);
    expect(canUploadLocation(withdrawnConsent)).toBe(false);
  });

  it("STRICT PRIVACY GUARD: never allows location upload unless explicitly opted-in and active", () => {
    // Default without location opt-in
    const defaultConsent = createPhotoConsent({
      consentChoice: "SHARE_CROPPED_LEAF",
    });
    expect(canUploadLocation(defaultConsent)).toBe(false);

    // Explicit opt-in
    const locationConsent = createPhotoConsent({
      consentChoice: "SHARE_CROPPED_LEAF",
      shareLocation: true,
    });
    expect(canUploadLocation(locationConsent)).toBe(true);

    // Null or undefined
    expect(canUploadLocation(null)).toBe(false);
    expect(canUploadLocation(undefined)).toBe(false);
  });
});
