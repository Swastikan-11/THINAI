// THINAI Officer Review Queue & Prioritization Service
// Prioritizes farmer-submitted cases for agricultural extension officers
// using uncertainty, disagreement, crop coverage, quality, and urgency factors.
//
// SAFETY RULE: Farmer feedback is a weak signal for prioritization only.
// It is NOT a ground-truth label until verified by an officer action.

import { FieldDiagnosisRecord } from "./officerService";
import { getEvidenceLevel } from "./evidenceTierEngine";

export interface ReviewPriorityWeights {
  w1_modelUncertainty: number;        // Weight for model prediction uncertainty
  w2_farmerDisagreement: number;     // Weight for farmer disagreement ("NO" / "NOT_SURE")
  w3_unsupportedCropPenalty: number; // Weight for unvalidated / unsupported crop
  w4_imageQualityPenalty: number;    // Weight for image quality issues (blurry, low light)
  w5_outbreakOrUrgencyScore: number; // Weight for high-threat epidemic pathogens
}

export const DEFAULT_PRIORITY_WEIGHTS: ReviewPriorityWeights = {
  w1_modelUncertainty: 0.30,
  w2_farmerDisagreement: 0.25,
  w3_unsupportedCropPenalty: 0.15,
  w4_imageQualityPenalty: 0.15,
  w5_outbreakOrUrgencyScore: 0.15,
};

export interface QueuedReviewCase extends FieldDiagnosisRecord {
  top3Predictions?: { label: string; confidence: number }[];
  uncertaintyScore?: number;
  imageQualityWarning?: string;
  imageQualityCheck?: "PASSED" | "LOW_LIGHT" | "OVEREXPOSED" | "NON_VEGETATION" | "BLURRED";
  language?: string;
  isUrgentOutbreakRisk?: boolean;
  priorityScore?: number;
  priorityBreakdown?: {
    uncertaintyTerm: number;
    disagreementTerm: number;
    cropCoverageTerm: number;
    qualityTerm: number;
    urgencyTerm: number;
  };
}

export type OfficerReviewActionType =
  | "CONFIRM_DIAGNOSIS"
  | "CORRECT_DIAGNOSIS"
  | "MARK_UNUSABLE"
  | "MARK_NEEDS_INFO";

export interface OfficerReviewVerdict {
  diagnosisId: string;
  action: OfficerReviewActionType;
  officerId: string;
  officerName: string;
  confirmedPathogen?: string;
  correctedPathogen?: string;
  unusableReason?: string;
  notes?: string;
  timestamp: string;
}

/** High-consequence epidemic diseases in Tamil Nadu agriculture */
const HIGH_URGENCY_PATHOGENS = [
  "blast",
  "late_blight",
  "bacterial_wilt",
  "tungro",
  "bacterial_leaf_blight",
  "fall_armyworm",
  "rust",
];

/**
 * Calculates the review priority score [0.0, 1.0] for a case.
 * Higher score = higher urgency in the officer's review queue.
 */
export function calculateReviewPriority(
  item: QueuedReviewCase,
  weights: ReviewPriorityWeights = DEFAULT_PRIORITY_WEIGHTS
): {
  priorityScore: number;
  breakdown: {
    uncertaintyTerm: number;
    disagreementTerm: number;
    cropCoverageTerm: number;
    qualityTerm: number;
    urgencyTerm: number;
  };
} {
  // 1. Model Uncertainty term [0, 1]
  const uncertainty = item.uncertaintyScore !== undefined
    ? Math.min(1, Math.max(0, item.uncertaintyScore))
    : Math.max(0, 1 - (item.calibratedConfidence || 0));

  // 2. Farmer Disagreement term [0, 1]
  let disagreement = 0;
  if (item.farmerVerdict === "NO") {
    disagreement = 1.0;
  } else if (item.farmerVerdict === "NOT_SURE") {
    disagreement = 0.5;
  } else if (item.farmerVerdict === "YES") {
    disagreement = 0.0;
  } else {
    disagreement = 0.3; // Unanswered
  }

  // 3. Unsupported Crop Penalty term [0, 1]
  const evidenceLevel = getEvidenceLevel(item.predictedClass, item.crop);
  let cropPenalty = 0;
  if (evidenceLevel === "UNSUPPORTED") {
    cropPenalty = 1.0;
  } else if (evidenceLevel === "LAB_ONLY") {
    cropPenalty = 0.5;
  } else {
    cropPenalty = 0.1; // FIELD_VALIDATED
  }

  // 4. Image Quality Penalty term [0, 1]
  let qualityPenalty = 0;
  if (item.imageQualityCheck === "BLURRED" || item.imageQualityCheck === "NON_VEGETATION") {
    qualityPenalty = 1.0;
  } else if (item.imageQualityCheck === "LOW_LIGHT" || item.imageQualityCheck === "OVEREXPOSED") {
    qualityPenalty = 0.5;
  } else {
    qualityPenalty = 0.0;
  }

  // 5. Outbreak or Urgency Score term [0, 1]
  const predLower = (item.predictedClass || "").toLowerCase();
  const isHighThreat = HIGH_URGENCY_PATHOGENS.some((p) => predLower.includes(p));
  const urgency = item.isUrgentOutbreakRisk || isHighThreat ? 1.0 : 0.2;

  // Weighted sum
  const uncertaintyTerm = weights.w1_modelUncertainty * uncertainty;
  const disagreementTerm = weights.w2_farmerDisagreement * disagreement;
  const cropCoverageTerm = weights.w3_unsupportedCropPenalty * cropPenalty;
  const qualityTerm = weights.w4_imageQualityPenalty * qualityPenalty;
  const urgencyTerm = weights.w5_outbreakOrUrgencyScore * urgency;

  const total = uncertaintyTerm + disagreementTerm + cropCoverageTerm + qualityTerm + urgencyTerm;
  const priorityScore = Math.min(1, Math.max(0, Math.round(total * 1000) / 1000));

  return {
    priorityScore,
    breakdown: {
      uncertaintyTerm: Math.round(uncertaintyTerm * 1000) / 1000,
      disagreementTerm: Math.round(disagreementTerm * 1000) / 1000,
      cropCoverageTerm: Math.round(cropCoverageTerm * 1000) / 1000,
      qualityTerm: Math.round(qualityTerm * 1000) / 1000,
      urgencyTerm: Math.round(urgencyTerm * 1000) / 1000,
    },
  };
}

/**
 * Sorts queued cases by priority score in descending order (highest priority first).
 */
export function sortQueueByPriority(
  cases: QueuedReviewCase[],
  weights: ReviewPriorityWeights = DEFAULT_PRIORITY_WEIGHTS
): QueuedReviewCase[] {
  return cases
    .map((c) => {
      const { priorityScore, breakdown } = calculateReviewPriority(c, weights);
      return {
        ...c,
        priorityScore,
        priorityBreakdown: breakdown,
      };
    })
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
}

/**
 * Applies an officer review verdict to a case.
 */
export function applyOfficerReviewAction(
  caseItem: QueuedReviewCase,
  action: OfficerReviewVerdict
): QueuedReviewCase {
  const updated: QueuedReviewCase = {
    ...caseItem,
    expertNotes: action.notes || caseItem.expertNotes,
  };

  if (action.action === "CONFIRM_DIAGNOSIS") {
    updated.expertLabel = action.confirmedPathogen || caseItem.predictedClass;
  } else if (action.action === "CORRECT_DIAGNOSIS") {
    updated.expertLabel = action.correctedPathogen || "Corrected By Officer";
  } else if (action.action === "MARK_UNUSABLE") {
    updated.expertLabel = `UNUSABLE: ${action.unusableReason || "Low Quality"}`;
  } else if (action.action === "MARK_NEEDS_INFO") {
    updated.expertLabel = "NEEDS_MORE_INFORMATION";
  }

  return updated;
}
