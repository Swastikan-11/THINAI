// THINAI Officer & Advisory Audit Service (Feature 9)
// Provides transparent audit logs for advice shown, referrals made, and officer decisions.
//
// PRIVACY & SAFETY:
// - Does NOT store PII (personal farmer names, unhashed phone numbers, exact GPS).
// - Logs decisions, evidence levels, uncertainty demotions, and officer ground-truth labels.
// - Works offline (local storage) and syncs to Firestore within free Spark limits.

export type AuditEventType =
  | "ADVICE_SHOWN"
  | "OFFICER_REFERRAL_MADE"
  | "OFFICER_DECISION_RECORDED"
  | "CONSENT_RECORDED"
  | "CONSENT_WITHDRAWN";

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  crop?: string;
  disease?: string;
  tier?: string;
  confidence?: number;
  uncertaintyScore?: number;
  evidenceLevel?: string;
  reason?: string;
  officerAction?: string;
  officerId?: string;
  verifiedPathogen?: string;
  language?: string;
  district?: string;
  timestamp: string;
}

const AUDIT_STORAGE_KEY = "thinai_advisory_audit_logs";
const memoryAuditStore: AuditLogEntry[] = [];

function safeGetAuditLogs(): AuditLogEntry[] {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return memoryAuditStore;
    }
  }
  return memoryAuditStore;
}

function safeSaveAuditLogs(logs: AuditLogEntry[]): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 200)));
      return;
    } catch {
      memoryAuditStore.length = 0;
      memoryAuditStore.push(...logs.slice(0, 200));
      return;
    }
  }
  memoryAuditStore.length = 0;
  memoryAuditStore.push(...logs.slice(0, 200));
}

export function clearAuditLogsForTesting(): void {
  memoryAuditStore.length = 0;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(AUDIT_STORAGE_KEY);
    } catch {}
  }
}

/**
 * Records an immutable audit event.
 */
export function logAuditEvent(params: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = new Date().toISOString();

  const entry: AuditLogEntry = {
    ...params,
    id,
    timestamp,
  };

  const existing = safeGetAuditLogs();
  safeSaveAuditLogs([entry, ...existing]);

  return entry;
}

/**
 * Queries audit logs with optional filtering.
 */
export function getAuditLogs(filter?: {
  eventType?: AuditEventType;
  crop?: string;
  limit?: number;
}): AuditLogEntry[] {
  let logs = safeGetAuditLogs();

  if (filter?.eventType) {
    logs = logs.filter((l) => l.eventType === filter.eventType);
  }
  if (filter?.crop && filter.crop !== "All") {
    logs = logs.filter((l) => l.crop?.toLowerCase() === filter.crop?.toLowerCase());
  }

  const max = filter?.limit || 50;
  return logs.slice(0, max);
}

/**
 * Exports audit log entries to standard CSV format.
 */
export function exportAuditLogsToCsv(logs: AuditLogEntry[]): string {
  const headers = [
    "Log_ID",
    "Event_Type",
    "Crop",
    "Disease",
    "Tier",
    "Confidence_Pct",
    "Uncertainty_Score",
    "Evidence_Level",
    "Officer_Action",
    "Verified_Pathogen",
    "District",
    "Timestamp",
    "Reason",
  ];

  const rows = logs.map((l) => [
    `"${l.id}"`,
    `"${l.eventType}"`,
    `"${l.crop || ""}"`,
    `"${l.disease || ""}"`,
    `"${l.tier || ""}"`,
    l.confidence !== undefined ? l.confidence.toFixed(1) : "",
    l.uncertaintyScore !== undefined ? l.uncertaintyScore.toFixed(3) : "",
    `"${l.evidenceLevel || ""}"`,
    `"${l.officerAction || ""}"`,
    `"${l.verifiedPathogen || ""}"`,
    `"${l.district || ""}"`,
    `"${l.timestamp}"`,
    `"${(l.reason || "").replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
