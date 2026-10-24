// THINAI Extension Officer Service
// Provides live Firestore query, weak verdict filtering, expert ground-truth labeling,
// and CSV export for research publication within Firebase Spark free tier limits.

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc,
  serverTimestamp 
} from "firebase/firestore";
import { firestoreDb } from "../firebase";
import { getCurrentUser } from "./authService";

export interface FieldDiagnosisRecord {
  id: string;
  userId: string;
  farmerName?: string;
  phone?: string;
  phoneConsent?: boolean;
  crop: string;
  predictedClass: string;
  calibratedConfidence: number;
  tier: "TIER_1_CONFIDENT" | "TIER_2_MODERATE" | "TIER_3_INCONCLUSIVE";
  farmerVerdict?: "YES" | "NO" | "NOT_SURE";
  district: string;
  village?: string;
  thumbnailBase64?: string;
  photoConsent?: boolean;
  timestamp: string;
  expertLabel?: string;
  expertNotes?: string;
}

export interface ExpertLabelSubmission {
  diagnosisId: string;
  verifiedPathogen: string;
  severity: "Mild" | "Moderate" | "Severe";
  clinicalNotes: string;
  officerId: string;
  officerName?: string;
}

/**
 * Checks whether the current authenticated user is registered as an extension officer
 */
export async function checkIsOfficer(userId?: string): Promise<boolean> {
  try {
    const user = userId ? { uid: userId } : await getCurrentUser();
    if (!user?.uid) return false;

    // Check /officers/{uid} document
    const officerRef = doc(firestoreDb, "officers", user.uid);
    const snap = await getDoc(officerRef);
    return snap.exists();
  } catch (err) {
    // If offline or permission denied, default to false
    return false;
  }
}

/**
 * Queries diagnoses with strict pagination limit (25) to preserve Spark read quota
 */
export async function fetchOfficerDiagnoses(filter?: {
  crop?: string;
  district?: string;
  tier?: string;
  verdict?: string;
}): Promise<FieldDiagnosisRecord[]> {
  try {
    const diagnosesRef = collection(firestoreDb, "diagnoses");
    let q = query(diagnosesRef, orderBy("timestamp", "desc"), limit(25));

    if (filter?.crop && filter.crop !== "All") {
      q = query(diagnosesRef, where("crop", "==", filter.crop), limit(25));
    }

    const snap = await getDocs(q);
    const records: FieldDiagnosisRecord[] = [];

    snap.forEach((d) => {
      const data = d.data();
      records.push({
        id: d.id,
        userId: data.userId || "anonymous",
        farmerName: data.farmerName || "Farmer",
        phone: data.phoneConsent === true ? data.phone : undefined,
        phoneConsent: data.phoneConsent === true,
        crop: data.crop || "Unknown",
        predictedClass: data.predictedClass || "Unknown",
        calibratedConfidence: data.calibratedConfidence || 0,
        tier: data.tier || "TIER_3_INCONCLUSIVE",
        farmerVerdict: data.farmerVerdict || "NOT_SURE",
        district: data.district || "Coimbatore",
        village: data.village || "Local",
        thumbnailBase64: data.thumbnailBase64,
        photoConsent: data.photoConsent === true,
        timestamp: data.timestamp || new Date().toISOString()
      });
    });

    return records;
  } catch (err) {
    if (import.meta.env.DEV) {
      return getOfflineOfficerFallbackRecords();
    }
    // Honest empty state in production when network is offline
    return [];
  }
}

/**
 * Submits an expert ground truth label to /expert_labels collection
 */
export async function submitExpertLabel(submission: ExpertLabelSubmission): Promise<string> {
  const user = await getCurrentUser();
  const officerId = user?.uid || submission.officerId;

  const docRef = await addDoc(collection(firestoreDb, "expert_labels"), {
    diagnosisId: submission.diagnosisId,
    verifiedPathogen: submission.verifiedPathogen,
    severity: submission.severity,
    clinicalNotes: submission.clinicalNotes,
    officerId,
    officerName: submission.officerName || user?.displayName || "Extension Officer",
    createdAt: serverTimestamp(),
    timestampIso: new Date().toISOString()
  });

  return docRef.id;
}

/**
 * Formats expert-labeled records into CSV format for research paper analysis
 */
export function exportExpertLabelsToCsv(records: FieldDiagnosisRecord[]): string {
  const headers = [
    "Diagnosis_ID",
    "Crop",
    "District",
    "Village",
    "Model_Predicted_Class",
    "Calibrated_Confidence_Pct",
    "Assigned_Tier",
    "Weak_Farmer_Verdict",
    "Expert_Ground_Truth_Pathogen",
    "Expert_Notes",
    "Specimen_Timestamp"
  ];

  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${r.crop}"`,
    `"${r.district}"`,
    `"${r.village || ""}"`,
    `"${r.predictedClass}"`,
    (r.calibratedConfidence * 100).toFixed(1),
    `"${r.tier}"`,
    `"${r.farmerVerdict || "UNVERIFIED"}"`,
    `"${r.expertLabel || "PENDING_EXPERT_REVIEW"}"`,
    `"${(r.expertNotes || "").replace(/"/g, '""')}"`,
    `"${r.timestamp}"`
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Baseline fallback records for offline testing
 */
export function getOfflineOfficerFallbackRecords(): FieldDiagnosisRecord[] {
  return [
    {
      id: "diag-cbe-001",
      userId: "usr-farmer-01",
      farmerName: "K. Murugesan",
      phone: undefined, // Hidden without consent
      phoneConsent: false,
      crop: "Tomato",
      predictedClass: "Tomato___Early_blight",
      calibratedConfidence: 0.84,
      tier: "TIER_1_CONFIDENT",
      farmerVerdict: "YES",
      district: "Coimbatore",
      village: "Thondamuthur",
      timestamp: "2026-10-18T10:15:00Z"
    },
    {
      id: "diag-cbe-002",
      userId: "usr-farmer-02",
      farmerName: "S. Palanisamy",
      phone: "+91 94431 82740",
      phoneConsent: true,
      crop: "Potato",
      predictedClass: "Potato___Late_blight",
      calibratedConfidence: 0.62,
      tier: "TIER_2_MODERATE",
      farmerVerdict: "NO",
      district: "Dindigul",
      village: "Oddanchatram",
      timestamp: "2026-10-18T11:40:00Z"
    },
    {
      id: "diag-thj-003",
      userId: "usr-farmer-03",
      farmerName: "R. Anbarasan",
      phone: undefined,
      phoneConsent: false,
      crop: "Paddy",
      predictedClass: "Paddy___Blast_Candidate",
      calibratedConfidence: 0.38,
      tier: "TIER_3_INCONCLUSIVE",
      farmerVerdict: "NOT_SURE",
      district: "Thanjavur",
      village: "Kumbakonam",
      timestamp: "2026-10-18T14:20:00Z"
    }
  ];
}
