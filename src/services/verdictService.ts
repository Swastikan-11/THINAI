// THINAI Farmer-Verdict Field Monitor Service (Phase D)
// Manages crowd-sourced farmer validation records ("noisy weak labels"),
// calculates Wilson 95% score intervals, reliability diagrams from verdicts,
// and detects calibration drift.

import { db, FarmerVerdictRecord } from "./db";
import { auth, firestoreDb } from "../firebase";
import { doc, setDoc, getDocs, collection, query, limit } from "firebase/firestore";
import { syncManager } from "./syncService";

export const MIN_VERDICTS_FOR_ESTIMATE = 10;
export const BASELINE_ECE = 0.0263; // 2.63% from Phase B calibration

export interface ClassAccuracyStat {
  className: string;
  totalVerdicts: number;
  yesCount: number;
  noCount: number;
  notSureCount: number;
  accuracy: number | null; // null if not enough data
  wilsonLower: number | null;
  wilsonUpper: number | null;
  hasEnoughData: boolean;
}

export interface VerdictReliabilityBin {
  binRange: string;
  binLower: number;
  binUpper: number;
  sampleCount: number;
  avgPredictedConfidence: number;
  empiricalAccuracy: number;
  calibrationGap: number;
}

export interface FieldAccuracySummary {
  totalVerdictsCount: number;
  retrainingCandidatesCount: number;
  classStats: Record<string, ClassAccuracyStat>;
  overallAccuracy: number | null;
  overallWilsonLower: number | null;
  overallWilsonUpper: number | null;
  hasEnoughOverallData: boolean;
  reliabilityBins: VerdictReliabilityBin[];
  verdictEce: number;
  baselineEce: number;
  driftDelta: number;
  driftDetected: boolean;
  driftSeverity: "NONE" | "MODERATE" | "HIGH";
  notice: string;
}

/**
 * Computes a fast cryptographic SHA-256 hash string for an image data URL
 */
export async function computePhotoHash(photoDataUrl: string): Promise<string> {
  try {
    if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      // Use head, tail and length of base64 to ensure high performance on mobile devices
      const sample = photoDataUrl.slice(0, 4000) + "_" + photoDataUrl.length + "_" + photoDataUrl.slice(-1000);
      const data = encoder.encode(sample);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
    }
  } catch (e) {
    console.warn("Crypto subtle hash failed, using fallback hash:", e);
  }
  // Fallback hash
  let h = 0;
  for (let i = 0; i < Math.min(photoDataUrl.length, 5000); i++) {
    h = (Math.imul(31, h) + photoDataUrl.charCodeAt(i)) | 0;
  }
  return "hash_" + Math.abs(h).toString(16);
}

/**
 * Computes Wilson Score 95% Confidence Interval
 * Center: (p + z^2 / 2n) / (1 + z^2 / n)
 */
export function calculateWilsonScore(
  positiveCount: number,
  totalCount: number,
  z: number = 1.96
): { lower: number; center: number; upper: number } {
  if (totalCount <= 0) {
    return { lower: 0, center: 0, upper: 0 };
  }
  const p = positiveCount / totalCount;
  const z2 = z * z;
  const denominator = 1 + z2 / totalCount;
  const center = (p + z2 / (2 * totalCount)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p) + z2 / (4 * totalCount)) / totalCount)) / denominator;

  return {
    lower: Math.max(0, center - margin),
    center,
    upper: Math.min(1, center + margin)
  };
}

/**
 * Records a farmer verdict into local Dexie IndexedDB and queues/syncs to Firestore
 */
export async function recordFarmerVerdict(params: {
  photoHash: string;
  predictedClass: string;
  calibratedConfidence: number;
  rawConfidence?: number;
  tier: "TIER_1_CONFIDENT" | "TIER_2_MODERATE" | "TIER_3_INCONCLUSIVE";
  verdict: "YES" | "NO" | "NOT_SURE";
  actualClassChoice?: string;
  model_version?: string;
}): Promise<FarmerVerdictRecord> {
  const user = auth.currentUser;
  const uid = user?.uid || "offline_farmer";
  const id = `verdict_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();
  const model_version = params.model_version || "thinai-mobilenetv2-calibrated-v1";

  const record: FarmerVerdictRecord = {
    id,
    userId: uid,
    photoHash: params.photoHash,
    predictedClass: params.predictedClass,
    calibratedConfidence: params.calibratedConfidence,
    rawConfidence: params.rawConfidence,
    tier: params.tier,
    verdict: params.verdict,
    actualClassChoice: params.actualClassChoice,
    model_version,
    timestamp,
    pendingSync: true,
    synced: false
  };

  // 1. Save locally to Dexie
  await db.verdicts.add(record);

  // 2. Sync to Firestore if online & authenticated
  if (!syncManager.isOfflineActive() && user) {
    try {
      await setDoc(doc(firestoreDb, "verdicts", id), {
        id,
        userId: uid,
        photoHash: params.photoHash,
        predictedClass: params.predictedClass,
        calibratedConfidence: params.calibratedConfidence,
        rawConfidence: params.rawConfidence || params.calibratedConfidence,
        tier: params.tier,
        verdict: params.verdict,
        actualClassChoice: params.actualClassChoice || null,
        model_version,
        timestamp
      });
      await db.verdicts.update(id, { pendingSync: false, synced: true });
    } catch (err) {
      console.warn("Direct Firestore verdict sync failed, queued to syncQueue:", err);
      await db.syncQueue.add({
        userId: uid,
        entity: "verdict",
        action: "create",
        clientId: id,
        payload: record,
        timestamp,
        retryCount: 0,
        status: "pending"
      });
    }
  } else {
    // Offline or guest: Enqueue for background sync
    await db.syncQueue.add({
      userId: uid,
      entity: "verdict",
      action: "create",
      clientId: id,
      payload: record,
      timestamp,
      retryCount: 0,
      status: "pending"
    });
  }

  return record;
}

/**
 * Retrieves all stored farmer verdicts from Dexie and Firestore
 */
export async function getAllVerdicts(): Promise<FarmerVerdictRecord[]> {
  try {
    const localVerdicts = await db.verdicts.toArray();
    // If online and authenticated, fetch latest community verdicts for robust calibration estimates
    if (!syncManager.isOfflineActive() && auth.currentUser) {
      try {
        const snap = await getDocs(query(collection(firestoreDb, "verdicts"), limit(200)));
        const remoteVerdicts: FarmerVerdictRecord[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          if (data && data.id) {
            remoteVerdicts.push({
              id: data.id,
              userId: data.userId || "anonymous",
              photoHash: data.photoHash || "",
              predictedClass: data.predictedClass || "Unknown",
              calibratedConfidence: data.calibratedConfidence || 50,
              rawConfidence: data.rawConfidence,
              tier: data.tier || "TIER_1_CONFIDENT",
              verdict: data.verdict || "NOT_SURE",
              actualClassChoice: data.actualClassChoice,
              model_version: data.model_version || "v1",
              timestamp: data.timestamp || new Date().toISOString(),
              pendingSync: false,
              synced: true
            });
          }
        });

        // Merge by id
        const map = new Map<string, FarmerVerdictRecord>();
        localVerdicts.forEach((v) => map.set(v.id, v));
        remoteVerdicts.forEach((v) => map.set(v.id, v));
        return Array.from(map.values());
      } catch (e) {
        console.warn("Failed fetching remote verdicts, falling back to local:", e);
      }
    }
    return localVerdicts;
  } catch (err) {
    console.error("Error loading verdicts:", err);
    return [];
  }
}

/**
 * Evaluates Field Accuracy Summary with Wilson 95% Intervals & Calibration Drift
 */
export function evaluateFieldAccuracy(verdicts: FarmerVerdictRecord[]): FieldAccuracySummary {
  const classStats: Record<string, ClassAccuracyStat> = {};
  let totalAnsweredAll = 0;
  let totalYesAll = 0;
  let retrainingCandidatesCount = 0;

  // 1. Per-Class Aggregation
  for (const v of verdicts) {
    const c = v.predictedClass || "General Crop Pathology";
    if (!classStats[c]) {
      classStats[c] = {
        className: c,
        totalVerdicts: 0,
        yesCount: 0,
        noCount: 0,
        notSureCount: 0,
        accuracy: null,
        wilsonLower: null,
        wilsonUpper: null,
        hasEnoughData: false
      };
    }

    const stat = classStats[c];
    stat.totalVerdicts++;

    if (v.verdict === "YES") {
      stat.yesCount++;
    } else if (v.verdict === "NO") {
      stat.noCount++;
      retrainingCandidatesCount++; // Model made error according to farmer
    } else {
      stat.notSureCount++;
      retrainingCandidatesCount++; // Ambiguous case needing expert review
    }

    if (v.tier === "TIER_3_INCONCLUSIVE" && v.verdict !== "NO" && v.verdict !== "NOT_SURE") {
      retrainingCandidatesCount++;
    }
  }

  // 2. Calculate Wilson Intervals per class
  for (const c of Object.keys(classStats)) {
    const s = classStats[c];
    const answeredCount = s.yesCount + s.noCount;
    totalAnsweredAll += answeredCount;
    totalYesAll += s.yesCount;

    if (s.totalVerdicts >= MIN_VERDICTS_FOR_ESTIMATE && answeredCount > 0) {
      s.hasEnoughData = true;
      s.accuracy = Math.round((s.yesCount / answeredCount) * 1000) / 10;
      const interval = calculateWilsonScore(s.yesCount, answeredCount);
      s.wilsonLower = Math.round(interval.lower * 1000) / 10;
      s.wilsonUpper = Math.round(interval.upper * 1000) / 10;
    } else {
      s.hasEnoughData = false;
      s.accuracy = null;
      s.wilsonLower = null;
      s.wilsonUpper = null;
    }
  }

  // 3. Overall Accuracy
  const hasEnoughOverallData = verdicts.length >= MIN_VERDICTS_FOR_ESTIMATE && totalAnsweredAll > 0;
  let overallAccuracy: number | null = null;
  let overallWilsonLower: number | null = null;
  let overallWilsonUpper: number | null = null;

  if (hasEnoughOverallData) {
    overallAccuracy = Math.round((totalYesAll / totalAnsweredAll) * 1000) / 10;
    const allInterval = calculateWilsonScore(totalYesAll, totalAnsweredAll);
    overallWilsonLower = Math.round(allInterval.lower * 1000) / 10;
    overallWilsonUpper = Math.round(allInterval.upper * 1000) / 10;
  }

  // 4. Verdict Reliability Diagram (Binned by Confidence)
  const binDefs = [
    { label: "45% - 65% (Tier 2 Low)", lower: 45, upper: 65 },
    { label: "65% - 78% (Tier 2 High)", lower: 65, upper: 78 },
    { label: "78% - 100% (Tier 1 Confident)", lower: 78, upper: 100 }
  ];

  const reliabilityBins: VerdictReliabilityBin[] = [];
  let weightedEceSum = 0;
  let totalEvaluatedInBins = 0;

  for (const b of binDefs) {
    const matching = verdicts.filter((v) => {
      const c = v.calibratedConfidence;
      return (
        c >= b.lower &&
        (b.upper === 100 ? c <= b.upper : c < b.upper) &&
        (v.verdict === "YES" || v.verdict === "NO")
      );
    });

    const count = matching.length;
    if (count > 0) {
      const avgConf = matching.reduce((s, it) => s + it.calibratedConfidence, 0) / count / 100;
      const yesCount = matching.filter((it) => it.verdict === "YES").length;
      const empAcc = yesCount / count;
      const gap = Math.abs(empAcc - avgConf);

      weightedEceSum += count * gap;
      totalEvaluatedInBins += count;

      reliabilityBins.push({
        binRange: b.label,
        binLower: b.lower,
        binUpper: b.upper,
        sampleCount: count,
        avgPredictedConfidence: Math.round(avgConf * 1000) / 10,
        empiricalAccuracy: Math.round(empAcc * 1000) / 10,
        calibrationGap: Math.round(gap * 1000) / 10
      });
    } else {
      reliabilityBins.push({
        binRange: b.label,
        binLower: b.lower,
        binUpper: b.upper,
        sampleCount: 0,
        avgPredictedConfidence: (b.lower + b.upper) / 2,
        empiricalAccuracy: 0,
        calibrationGap: 0
      });
    }
  }

  const verdictEce = totalEvaluatedInBins > 0 ? weightedEceSum / totalEvaluatedInBins : BASELINE_ECE;
  const driftDelta = verdictEce - BASELINE_ECE;
  const driftDetected = totalEvaluatedInBins >= MIN_VERDICTS_FOR_ESTIMATE && driftDelta >= 0.05;

  let driftSeverity: "NONE" | "MODERATE" | "HIGH" = "NONE";
  if (driftDetected) {
    driftSeverity = driftDelta >= 0.10 ? "HIGH" : "MODERATE";
  }

  return {
    totalVerdictsCount: verdicts.length,
    retrainingCandidatesCount,
    classStats,
    overallAccuracy,
    overallWilsonLower,
    overallWilsonUpper,
    hasEnoughOverallData,
    reliabilityBins,
    verdictEce: Math.round(verdictEce * 1000) / 1000,
    baselineEce: Math.round(BASELINE_ECE * 1000) / 1000,
    driftDelta: Math.round(driftDelta * 1000) / 1000,
    driftDetected,
    driftSeverity,
    notice:
      "Farmer verdicts are crowd-sourced field observations and serve as noisy weak labels. Farmers may mistake physiological nutrient deficiencies for fungal leaf spots or vice versa. Therefore, verdict-based metrics estimate deployment trends, not ground-truth laboratory accuracy."
  };
}
