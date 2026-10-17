// THINAI Firestore Shared Backend Service (Firebase Spark Tier)
// Handles shared data collections: Equipment Listings, Community Posts, Feedbacks, and Diagnosis Confirmations.
// Syncs with Dexie offline cache and write queue when offline.

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { firestoreDb, auth } from "../firebase";
import { db, SyncQueueItem } from "./db";
import { syncManager } from "./syncService";

export interface FirestoreEquipmentListing {
  id: string;
  userId: string;
  equipmentName: string;
  model: string;
  ownerName: string;
  phone: string;
  village: string;
  district: string;
  ratePerDay: string;
  availableDates: string;
  icon: string;
  consentPhoneShare: boolean;
  createdAt: string;
}

export interface DiagnosisConfirmationRecord {
  id: string;
  userId: string;
  predictedDisease: string;
  crop: string;
  confidence: number;
  farmerVerdict: "CONFIRMED" | "REJECTED" | "UNCERTAIN";
  farmerComment?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface FirestoreFeedbackRecord {
  id: string;
  userId: string;
  recommendationId: string;
  recommendationTitle: string;
  category: string;
  actionTaken: "completed" | "skipped" | "in_progress";
  rating?: number;
  cropConditionObservation?: string;
  notes?: string;
  costSavedEstimate?: string;
  createdAt: string;
}

export interface FirestoreCommunityPost {
  id: string;
  userId: string;
  authorName: string;
  district: string;
  crop: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  createdAt: string;
}

// ─── 1. EQUIPMENT LISTINGS ───────────────────────────────────────────────────

export async function fetchEquipmentListings(): Promise<FirestoreEquipmentListing[]> {
  const currentUid = auth.currentUser?.uid;

  if (syncManager.isOfflineActive()) {
    return getOfflineEquipmentListings(currentUid);
  }

  try {
    const q = query(
      collection(firestoreDb, "equipment_listings"),
      limit(50)
    );
    const snap = await getDocs(q);
    const listings: FirestoreEquipmentListing[] = [];

    snap.forEach((d) => {
      const data = d.data() as FirestoreEquipmentListing;
      // Phone number privacy: visible only if signed-in AND farmer gave explicit consent
      const safePhone = (currentUid && data.consentPhoneShare) ? data.phone : "Contact via App";
      listings.push({
        ...data,
        id: d.id,
        phone: safePhone
      });
    });

    return listings;
  } catch (err) {
    console.warn("Could not fetch Firestore equipment listings, using offline cache:", err);
    return getOfflineEquipmentListings(currentUid);
  }
}

export async function postEquipmentListing(
  listing: Omit<FirestoreEquipmentListing, "id" | "userId" | "createdAt">
): Promise<FirestoreEquipmentListing> {
  const user = auth.currentUser;
  const uid = user?.uid || "anonymous_farmer";
  const id = `eq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const newListing: FirestoreEquipmentListing = {
    ...listing,
    id,
    userId: uid,
    createdAt: new Date().toISOString()
  };

  // If offline or Firestore fails, queue in Dexie
  if (syncManager.isOfflineActive() || !user) {
    await db.syncQueue.add({
      userId: uid,
      entity: "farm",
      action: "create",
      clientId: id,
      payload: newListing,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    });
    return newListing;
  }

  try {
    await setDoc(doc(firestoreDb, "equipment_listings", id), newListing);
    return newListing;
  } catch (err) {
    console.warn("Firestore write failed, queuing in Dexie sync queue:", err);
    await db.syncQueue.add({
      userId: uid,
      entity: "farm",
      action: "create",
      clientId: id,
      payload: newListing,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    });
    return newListing;
  }
}

async function getOfflineEquipmentListings(currentUid?: string): Promise<FirestoreEquipmentListing[]> {
  try {
    const queued = await db.syncQueue.where("entity").equals("farm").toArray();
    return queued
      .filter((q) => q.payload?.equipmentName)
      .map((q) => {
        const item = q.payload as FirestoreEquipmentListing;
        return {
          ...item,
          phone: (currentUid && item.consentPhoneShare) ? item.phone : "Contact via App"
        };
      });
  } catch {
    return [];
  }
}

// ─── 2. DIAGNOSIS CONFIRMATIONS (Retraining Data Loop) ───────────────────────

export async function recordDiagnosisConfirmation(record: Omit<DiagnosisConfirmationRecord, "id" | "userId" | "createdAt">): Promise<void> {
  const user = auth.currentUser;
  const uid = user?.uid || "anonymous_farmer";
  const id = `diag-${Date.now()}`;

  const payload: DiagnosisConfirmationRecord = {
    ...record,
    id,
    userId: uid,
    createdAt: new Date().toISOString()
  };

  if (syncManager.isOfflineActive() || !user) {
    await db.syncQueue.add({
      userId: uid,
      entity: "scan",
      action: "create",
      clientId: id,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    });
    return;
  }

  try {
    await setDoc(doc(firestoreDb, "diagnosis_confirmations", id), payload);
  } catch (err) {
    console.warn("Failed to write diagnosis confirmation to Firestore, queuing:", err);
    await db.syncQueue.add({
      userId: uid,
      entity: "scan",
      action: "create",
      clientId: id,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    });
  }
}

// ─── 3. FEEDBACK TO FIRESTORE ────────────────────────────────────────────────

export async function recordFeedbackToFirestore(record: Omit<FirestoreFeedbackRecord, "id" | "userId" | "createdAt">): Promise<void> {
  const user = auth.currentUser;
  const uid = user?.uid || "anonymous_farmer";
  const id = `fb-${Date.now()}`;

  const payload: FirestoreFeedbackRecord = {
    ...record,
    id,
    userId: uid,
    createdAt: new Date().toISOString()
  };

  if (syncManager.isOfflineActive() || !user) {
    await db.syncQueue.add({
      userId: uid,
      entity: "feedback",
      action: "create",
      clientId: id,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    });
    return;
  }

  try {
    await setDoc(doc(firestoreDb, "feedbacks", id), payload);
  } catch (err) {
    console.warn("Failed to sync feedback to Firestore, queueing:", err);
    await db.syncQueue.add({
      userId: uid,
      entity: "feedback",
      action: "create",
      clientId: id,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    });
  }
}

// ─── 4. OFFLINE SYNC PROCESSOR ───────────────────────────────────────────────

export async function flushDexieSyncQueueToFirestore(): Promise<{ synced: number; failed: number }> {
  if (syncManager.isOfflineActive() || !auth.currentUser) {
    return { synced: 0, failed: 0 };
  }

  const currentUid = auth.currentUser.uid;
  let synced = 0;
  let failed = 0;

  try {
    const pendingItems = await db.syncQueue.where("status").equals("pending").toArray();

    for (const item of pendingItems) {
      if (!item.id) continue;
      try {
        const payload = {
          ...item.payload,
          userId: item.payload?.userId && item.payload.userId !== "anonymous_farmer" && item.payload.userId !== "offline_farmer"
            ? item.payload.userId
            : currentUid
        };

        if (item.entity === "farm" && payload.equipmentName) {
          await setDoc(doc(firestoreDb, "equipment_listings", item.clientId), payload);
        } else if (item.entity === "scan" && payload.farmerVerdict) {
          await setDoc(doc(firestoreDb, "diagnosis_confirmations", item.clientId), payload);
        } else if (item.entity === "feedback") {
          await setDoc(doc(firestoreDb, "feedbacks", item.clientId), payload);
        } else if (item.entity === "post") {
          await setDoc(doc(firestoreDb, "community_posts", item.clientId), payload);
        } else if (item.entity === "verdict") {
          await setDoc(doc(firestoreDb, "verdicts", item.clientId), payload);
          try {
            await db.verdicts.update(item.clientId, { pendingSync: false, synced: true });
          } catch {}
        }
        await db.syncQueue.update(item.id, { status: "syncing" });
        await db.syncQueue.delete(item.id);
        synced++;
      } catch (err) {
        failed++;
        console.warn(`Failed syncing queue item ${item.id}:`, err);
        await db.syncQueue.update(item.id, { retryCount: (item.retryCount || 0) + 1 });
      }
    }
  } catch (queueErr) {
    console.warn("Could not flush Dexie sync queue:", queueErr);
  }

  return { synced, failed };
}
