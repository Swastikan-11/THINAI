// Tests for Officer Audit Service and Dashboard Integration (Feature 9)
// SAFETY: Validates audit event logging, CSV generation, privacy guarantees, and filtering.

import { describe, it, expect, beforeEach } from "vitest";
import {
  logAuditEvent,
  getAuditLogs,
  exportAuditLogsToCsv,
  clearAuditLogsForTesting,
  type AuditLogEntry,
} from "../src/services/officerAuditService";

describe("Officer & Advisory Audit Trail (Feature 9)", () => {
  beforeEach(() => {
    clearAuditLogsForTesting();
  });

  it("records immutable advisory and referral audit events", () => {
    const entry = logAuditEvent({
      eventType: "ADVICE_SHOWN",
      crop: "Tomato",
      disease: "Tomato___Early_blight",
      tier: "TIER_2_MODERATE",
      confidence: 76.5,
      uncertaintyScore: 0.28,
      evidenceLevel: "LAB_ONLY",
      reason: "Cultural advice provided; chemical advice withheld due to lab-only evidence.",
      district: "Coimbatore",
    });

    expect(entry.id).toBeTruthy();
    expect(entry.timestamp).toBeTruthy();
    expect(entry.eventType).toBe("ADVICE_SHOWN");

    const logs = getAuditLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].id).toBe(entry.id);
  });

  it("records officer decision events with ground truth pathogen and notes", () => {
    logAuditEvent({
      eventType: "OFFICER_DECISION_RECORDED",
      crop: "Potato",
      disease: "Potato___Late_blight",
      officerAction: "CONFIRM_DIAGNOSIS",
      officerId: "off-tamil-01",
      verifiedPathogen: "Phytophthora infestans",
      reason: "Concentric water-soaked sporulating lesion confirmed.",
      district: "Dindigul",
    });

    const logs = getAuditLogs({ eventType: "OFFICER_DECISION_RECORDED" });
    expect(logs.length).toBe(1);
    expect(logs[0].verifiedPathogen).toBe("Phytophthora infestans");
    expect(logs[0].officerAction).toBe("CONFIRM_DIAGNOSIS");
  });

  it("filters audit logs by eventType and crop", () => {
    logAuditEvent({
      eventType: "OFFICER_REFERRAL_MADE",
      crop: "Paddy",
      disease: "Paddy___Blast",
      tier: "TIER_3_INCONCLUSIVE",
      reason: "Unsupported crop redirected to extension officer.",
    });

    logAuditEvent({
      eventType: "ADVICE_SHOWN",
      crop: "Tomato",
      disease: "Tomato___Leaf_Mold",
      tier: "TIER_2_MODERATE",
    });

    const paddyLogs = getAuditLogs({ crop: "Paddy" });
    expect(paddyLogs.length).toBe(1);
    expect(paddyLogs[0].crop).toBe("Paddy");

    const referralLogs = getAuditLogs({ eventType: "OFFICER_REFERRAL_MADE" });
    expect(referralLogs.length).toBe(1);
    expect(referralLogs[0].crop).toBe("Paddy");
  });

  it("exports properly formatted and sanitized audit CSV", () => {
    const sampleLog: AuditLogEntry = {
      id: "log-101",
      eventType: "OFFICER_DECISION_RECORDED",
      crop: "Tomato",
      disease: "Tomato___Early_blight",
      tier: "TIER_2_MODERATE",
      confidence: 82.4,
      uncertaintyScore: 0.195,
      evidenceLevel: "LAB_ONLY",
      officerAction: "CORRECT_DIAGNOSIS",
      verifiedPathogen: "Tomato___Septoria_leaf_spot",
      district: "Salem",
      timestamp: "2026-11-24T12:00:00Z",
      reason: 'Small spot clusters with "gray" centres',
    };

    const csv = exportAuditLogsToCsv([sampleLog]);
    const lines = csv.trim().split("\n");

    expect(lines[0]).toBe(
      "Log_ID,Event_Type,Crop,Disease,Tier,Confidence_Pct,Uncertainty_Score,Evidence_Level,Officer_Action,Verified_Pathogen,District,Timestamp,Reason"
    );

    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('"log-101"');
    expect(lines[1]).toContain('"Tomato"');
    expect(lines[1]).toContain('"LAB_ONLY"');
    expect(lines[1]).toContain("82.4");
    expect(lines[1]).toContain("0.195");
    expect(lines[1]).toContain('""gray"" centres');
  });

  it("STRICT PRIVACY GUARD: audit records do not leak personal farmer names or phone numbers", () => {
    const log = logAuditEvent({
      eventType: "ADVICE_SHOWN",
      crop: "Tomato",
      district: "Madurai",
      reason: "Standard advisory query",
    });

    // PII fields must not be present in log payload
    expect((log as any).farmerName).toBeUndefined();
    expect((log as any).phone).toBeUndefined();
    expect((log as any).aadhaar).toBeUndefined();
  });
});
