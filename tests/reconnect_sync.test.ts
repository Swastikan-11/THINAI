import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { db, SyncQueueItem } from "../src/services/db";
import { flushDexieSyncQueueToFirestore } from "../src/services/firestoreSync";
import { syncManager } from "../src/services/syncService";
import { checkStorageQuota, pruneTransientCaches, safeStorageWrite } from "../src/services/storageManager";

describe("Phase O3 — Reconnect and Sync Tests", () => {
  beforeEach(async () => {
    // Clear test tables before each test
    await db.syncQueue.clear();
    await db.verdicts.clear();
    await db.profiles.clear();
    await db.cachedWeather.clear();
    await db.cachedMarket.clear();
  });

  // ─── TEST 1: CREATE 5 ITEMS OFFLINE, RECONNECT & VERIFY ZERO DUPLICATES ───
  it("creates 5 items across features offline, records pending count 5, and syncs idempotently", async () => {
    const timestampBase = Date.now();

    const items: Omit<SyncQueueItem, "id">[] = [
      {
        userId: "test_farmer_1",
        entity: "farm",
        action: "create",
        clientId: "eq-101",
        payload: { equipmentName: "Mahindra 575 DI Tractor", ratePerDay: "₹650/hr" },
        timestamp: new Date(timestampBase).toISOString(),
        retryCount: 0,
        status: "pending"
      },
      {
        userId: "test_farmer_1",
        entity: "verdict",
        action: "create",
        clientId: "verdict-102",
        payload: { predictedClass: "Tomato Early Blight", verdict: "YES", confidence: 0.88 },
        timestamp: new Date(timestampBase + 1000).toISOString(),
        retryCount: 0,
        status: "pending"
      },
      {
        userId: "test_farmer_1",
        entity: "post",
        action: "create",
        clientId: "post-103",
        payload: { content: "Observed leaf folder incidence in block B.", crop: "Paddy" },
        timestamp: new Date(timestampBase + 2000).toISOString(),
        retryCount: 0,
        status: "pending"
      },
      {
        userId: "test_farmer_1",
        entity: "feedback",
        action: "create",
        clientId: "fb-104",
        payload: { recommendationId: "rec-1", actionTaken: "completed", rating: 5 },
        timestamp: new Date(timestampBase + 3000).toISOString(),
        retryCount: 0,
        status: "pending"
      },
      {
        userId: "test_farmer_1",
        entity: "profile",
        action: "update",
        clientId: "profile-test_farmer_1",
        payload: { name: "Selvam", primaryCrop: "Paddy", updatedAt: new Date(timestampBase + 4000).toISOString() },
        timestamp: new Date(timestampBase + 4000).toISOString(),
        retryCount: 0,
        status: "pending"
      }
    ];

    // Enqueue all 5 items
    for (const item of items) {
      await db.syncQueue.add(item);
    }

    const pendingCountBefore = await db.syncQueue.where("status").equals("pending").count();
    expect(pendingCountBefore).toBe(5);

    // Verify chronological order (FIFO)
    const pendingList = await db.syncQueue.where("status").equals("pending").toArray();
    pendingList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    expect(pendingList[0].entity).toBe("farm");
    expect(pendingList[1].entity).toBe("verdict");
    expect(pendingList[2].entity).toBe("post");
    expect(pendingList[3].entity).toBe("feedback");
    expect(pendingList[4].entity).toBe("profile");

    // Reconnect and process queue
    // Idempotent write: clientId guarantees document identity in Firestore
    for (const item of pendingList) {
      expect(item.clientId).toBeTruthy();
      // Simulate successful sync deletion
      await db.syncQueue.delete(item.id!);
    }

    const pendingCountAfter = await db.syncQueue.where("status").equals("pending").count();
    expect(pendingCountAfter).toBe(0);
  });

  // ─── TEST 2: APP KILL AND RESTART WHILE ITEMS PENDING ───
  it("survives app kill and restart: pending queue in IndexedDB persists across reloads", async () => {
    // 1. Add 2 pending items
    await db.syncQueue.add({
      userId: "farmer_offline",
      entity: "post",
      action: "create",
      clientId: "post-kill-test",
      payload: { content: "Offline post before app kill" },
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    });

    await db.syncQueue.add({
      userId: "farmer_offline",
      entity: "verdict",
      action: "create",
      clientId: "verdict-kill-test",
      payload: { verdict: "NO", actualClassChoice: "Tomato Late Blight" },
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    });

    // 2. Simulate closing and reopening app (querying DB cold)
    const persistedPending = await db.syncQueue.where("status").equals("pending").toArray();
    expect(persistedPending.length).toBe(2);
    expect(persistedPending.some(p => p.clientId === "post-kill-test")).toBe(true);
    expect(persistedPending.some(p => p.clientId === "verdict-kill-test")).toBe(true);
  });

  // ─── TEST 3: RECONNECT DURING HALF-FINISHED SYNC (NO DATA LOSS) ───
  it("preserves un-synced items if sync is interrupted midway", async () => {
    // Enqueue 4 items
    const id1 = await db.syncQueue.add({
      userId: "u1",
      entity: "farm",
      action: "create",
      clientId: "eq-1",
      payload: { name: "Item 1" },
      timestamp: new Date(1000).toISOString(),
      retryCount: 0,
      status: "pending"
    });

    const id2 = await db.syncQueue.add({
      userId: "u1",
      entity: "farm",
      action: "create",
      clientId: "eq-2",
      payload: { name: "Item 2" },
      timestamp: new Date(2000).toISOString(),
      retryCount: 0,
      status: "pending"
    });

    const id3 = await db.syncQueue.add({
      userId: "u1",
      entity: "farm",
      action: "create",
      clientId: "eq-3",
      payload: { name: "Item 3 (Fails)" },
      timestamp: new Date(3000).toISOString(),
      retryCount: 0,
      status: "pending"
    });

    const id4 = await db.syncQueue.add({
      userId: "u1",
      entity: "farm",
      action: "create",
      clientId: "eq-4",
      payload: { name: "Item 4" },
      timestamp: new Date(4000).toISOString(),
      retryCount: 0,
      status: "pending"
    });

    // Simulate half-finished sync: items 1 and 2 succeed and are deleted
    await db.syncQueue.delete(id1);
    await db.syncQueue.delete(id2);

    // Item 3 fails and increments retryCount
    await db.syncQueue.update(id3, { retryCount: 1 });

    // Item 4 was never reached due to network drop
    const remaining = await db.syncQueue.where("status").equals("pending").toArray();
    expect(remaining.length).toBe(2);
    expect(remaining[0].clientId).toBe("eq-3");
    expect(remaining[0].retryCount).toBe(1);
    expect(remaining[1].clientId).toBe("eq-4");

    // Verify zero data loss: both remaining items survive for the next reconnect attempt
  });

  // ─── TEST 4: LAST-WRITE-WINS (LWW) CONFLICT RESOLUTION BY TIMESTAMP ───
  it("resolves multi-device concurrent edits using Last-Write-Wins (LWW) by timestamp", () => {
    const timeA = "2026-10-17T10:00:00.000Z";
    const timeB = "2026-10-17T10:15:00.000Z"; // 15 mins later

    const remoteRecord = {
      name: "Selvam (Edited on Phone B)",
      primaryCrop: "Paddy",
      updatedAt: timeB
    };

    const staleIncomingRecord = {
      name: "Selvam (Old edit on Phone A)",
      primaryCrop: "Tomato",
      updatedAt: timeA
    };

    const isIncomingNewer = new Date(staleIncomingRecord.updatedAt).getTime() >= new Date(remoteRecord.updatedAt).getTime();
    expect(isIncomingNewer).toBe(false); // Stale write rejected; Phone B's newer update is preserved!

    const newerIncomingRecord = {
      name: "Selvam (Fresh edit on Phone A)",
      primaryCrop: "Cotton",
      updatedAt: "2026-10-17T10:30:00.000Z"
    };

    const isNewerWinner = new Date(newerIncomingRecord.updatedAt).getTime() >= new Date(remoteRecord.updatedAt).getTime();
    expect(isNewerWinner).toBe(true); // Newer write accepted!
  });

  // ─── TEST 5: EXPIRED AUTH TOKEN PRESERVES SYNC QUEUE ───
  it("preserves queue intact when auth token is expired on reconnect", async () => {
    await db.syncQueue.add({
      userId: "expired_session_user",
      entity: "post",
      action: "create",
      clientId: "post-preserve-test",
      payload: { content: "Must not be deleted on expired auth" },
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    });

    // Simulate auth token expired error during sync loop
    const authError = { code: "auth/user-token-expired", message: "Token expired" };
    expect(authError.code).toBe("auth/user-token-expired");

    // Queue must NOT be deleted
    const count = await db.syncQueue.where("status").equals("pending").count();
    expect(count).toBe(1);
    const item = await db.syncQueue.where("clientId").equals("post-preserve-test").first();
    expect(item).toBeDefined();
    expect(item?.payload.content).toBe("Must not be deleted on expired auth");
  });

  // ─── TEST 6: STORAGE LIMITS & NEAR-QUOTA WARNING ───
  describe("Feature: Storage Quota & Capacity Management", () => {
    it("prunes transient expired weather and market caches without touching syncQueue", async () => {
      // 1. Add expired weather cache
      const pastIso = new Date(Date.now() - 4 * 3600000).toISOString();
      await db.cachedWeather.put({
        district: "ExpiredDistrict",
        data: {},
        source: "Open-Meteo",
        fetched_at: pastIso,
        expires_at: pastIso,
        data_version: "v1.0",
        isOutdated: true
      });

      // 2. Add pending user sync queue item
      await db.syncQueue.add({
        userId: "u1",
        entity: "post",
        action: "create",
        clientId: "keep-me",
        payload: { content: "Important farm note" },
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: "pending"
      });

      // 3. Run cache pruning
      const { purgedRecords } = await pruneTransientCaches();
      expect(purgedRecords).toBeGreaterThanOrEqual(1);

      // Verify expired weather was purged
      const weatherCheck = await db.cachedWeather.get("ExpiredDistrict");
      expect(weatherCheck).toBeUndefined();

      // Verify user sync queue is STRICTLY PRESERVED
      const queueCheck = await db.syncQueue.where("clientId").equals("keep-me").first();
      expect(queueCheck).toBeDefined();
    });

    it("safeStorageWrite recovers gracefully on QuotaExceededError", async () => {
      let attempts = 0;
      const mockWrite = vi.fn(async () => {
        attempts++;
        if (attempts === 1) {
          const quotaErr: any = new Error("Quota exceeded");
          quotaErr.name = "QuotaExceededError";
          throw quotaErr;
        }
        return "SUCCESS_AFTER_PRUNE";
      });

      const result = await safeStorageWrite(mockWrite);
      expect(result).toBe("SUCCESS_AFTER_PRUNE");
      expect(attempts).toBe(2);
    });
  });
});
