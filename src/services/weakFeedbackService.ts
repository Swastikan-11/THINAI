// THINAI Farmer Feedback Weak Signal Service
// Treats farmer yes/no responses strictly as noisy weak feedback on perceived utility,
// NEVER as ground-truth disease labels for neural model training.
//
// SAFETY RULE: Farmer feedback alone MUST NEVER update model weights or ground-truth registries.
// Only expert officer confirmations qualify as training labels.

import { auth, firestoreDb } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface FarmerWeakFeedback {
  id: string;
  farmerId: string; // User UID or anonymous identifier
  crop: string;
  modelPrediction: string;
  confidence: number; // Calibrated confidence percentage (0-100)
  language: string;
  adviceTierShown: "TIER_1_CONFIDENT" | "TIER_2_MODERATE" | "TIER_3_INCONCLUSIVE";
  farmerVerdict: "YES" | "NO" | "NOT_SURE";
  timestamp: string;
  officerOutcome?: "CONFIRMED" | "OVERRULED" | "UNUSABLE" | "PENDING";
  reliabilityScore: number; // Computed weak-signal weight (0.0 to 1.0)
  disclaimer: string;
  metadata?: {
    imageQualityScore?: number;
    hasPriorConfirmedFeedback?: boolean;
    district?: string;
  };
}

export const FARMER_FEEDBACK_DISCLAIMER_EN =
  "Your feedback helps agricultural officers prioritize field visits and improves advisory recommendations. It is a noisy weak signal and does not replace professional agronomic diagnosis.";

export const FARMER_FEEDBACK_DISCLAIMER_TA =
  "உங்கள் கருத்து வேளாண் அலுவலர்களின் கள ஆய்வுக்கு உதவுகிறது. இது நிபுணர் பரிசோதனைக்கு மாற்றாகாது.";

const STORAGE_KEY = "thinai_weak_feedback_history";

/**
 * Computes a reliability score [0.0, 1.0] for farmer feedback.
 * High reliability indicates the feedback is likely conscientious and valuable for triage.
 * Low reliability indicates possible misidentification, blurry input, or inconsistent feedback.
 */
export function computeFeedbackReliability(params: {
  confidence: number;
  farmerVerdict: "YES" | "NO" | "NOT_SURE";
  imageQualityCheck?: "PASSED" | "LOW_LIGHT" | "OVEREXPOSED" | "NON_VEGETATION" | "BLURRED";
  officerOutcome?: "CONFIRMED" | "OVERRULED" | "UNUSABLE" | "PENDING";
  priorFeedbackCount?: number;
  priorOfficerConfirmations?: number;
}): number {
  let score = 0.50; // Neutral baseline

  // 1. Image Quality Factor
  if (params.imageQualityCheck === "PASSED") {
    score += 0.10;
  } else if (params.imageQualityCheck === "BLURRED" || params.imageQualityCheck === "LOW_LIGHT") {
    score -= 0.15;
  } else if (params.imageQualityCheck === "NON_VEGETATION") {
    score -= 0.30;
  }

  // 2. Verdict Nature
  if (params.farmerVerdict === "NOT_SURE") {
    // Farmer honestly expresses uncertainty — useful signal for officer review, moderate reliability
    score += 0.05;
  }

  // 3. Officer Track Record
  if (params.priorOfficerConfirmations && params.priorOfficerConfirmations > 0) {
    const boost = Math.min(0.25, params.priorOfficerConfirmations * 0.05);
    score += boost;
  }

  // 4. If current record was already reviewed by an officer:
  if (params.officerOutcome === "CONFIRMED") {
    score = 0.95;
  } else if (params.officerOutcome === "OVERRULED") {
    score = 0.20;
  } else if (params.officerOutcome === "UNUSABLE") {
    score = 0.05;
  }

  // Clamp to [0.05, 0.95]
  return Math.min(0.95, Math.max(0.05, Math.round(score * 100) / 100));
}

/**
 * INVARIANT: Determines whether a feedback record can be used for model training.
 * Strictly returns TRUE ONLY IF an officer has formally verified the pathogen.
 */
export function canBeUsedForModelTraining(feedback: FarmerWeakFeedback): boolean {
  return feedback.officerOutcome === "CONFIRMED";
}

/**
 * Records a new weak feedback event into local storage and queues for Firestore sync.
 */
export async function recordWeakFeedback(params: {
  crop: string;
  modelPrediction: string;
  confidence: number;
  language: string;
  adviceTierShown: "TIER_1_CONFIDENT" | "TIER_2_MODERATE" | "TIER_3_INCONCLUSIVE";
  farmerVerdict: "YES" | "NO" | "NOT_SURE";
  imageQualityCheck?: "PASSED" | "LOW_LIGHT" | "OVEREXPOSED" | "NON_VEGETATION" | "BLURRED";
  district?: string;
}): Promise<FarmerWeakFeedback> {
  const user = auth.currentUser;
  const farmerId = user?.uid || `anon_${Date.now().toString(36)}`;
  const id = `wfb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = new Date().toISOString();

  const reliabilityScore = computeFeedbackReliability({
    confidence: params.confidence,
    farmerVerdict: params.farmerVerdict,
    imageQualityCheck: params.imageQualityCheck,
  });

  const feedbackRecord: FarmerWeakFeedback = {
    id,
    farmerId,
    crop: params.crop,
    modelPrediction: params.modelPrediction,
    confidence: params.confidence,
    language: params.language,
    adviceTierShown: params.adviceTierShown,
    farmerVerdict: params.farmerVerdict,
    timestamp,
    officerOutcome: "PENDING",
    reliabilityScore,
    disclaimer: params.language === "Tamil" ? FARMER_FEEDBACK_DISCLAIMER_TA : FARMER_FEEDBACK_DISCLAIMER_EN,
    metadata: {
      imageQualityScore: params.imageQualityCheck === "PASSED" ? 1.0 : 0.5,
      district: params.district,
    },
  };

  // 1. Store in localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: FarmerWeakFeedback[] = raw ? JSON.parse(raw) : [];
    const updated = [feedbackRecord, ...existing].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to persist weak feedback locally:", err);
  }

  // 2. Sync to Firestore if authenticated & online
  try {
    if (navigator.onLine && user?.uid) {
      await addDoc(collection(firestoreDb, "weak_feedbacks"), {
        ...feedbackRecord,
        createdAt: serverTimestamp(),
      });
    }
  } catch (syncErr) {
    // Offline resilience: silent fallback to local store
    console.info("Weak feedback queued locally (offline):", syncErr);
  }

  return feedbackRecord;
}

/**
 * Returns all local weak feedback history.
 */
export function getWeakFeedbackHistory(): FarmerWeakFeedback[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
