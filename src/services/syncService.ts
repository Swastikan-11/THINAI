import { db, SyncQueueItem } from "./db";
import { apiClient } from "./apiClient";
import { auth } from "../firebase";

export type SyncState = "ONLINE" | "OFFLINE" | "SYNCING" | "SYNCED" | "FAILED";

export interface SyncStatusInfo {
  state: SyncState;
  pendingCount: number;
  lastSyncedAt: string | null;
  message: string;
}

type SyncListener = (info: SyncStatusInfo) => void;

class OfflineSyncManager {
  private state: SyncState = navigator.onLine ? "ONLINE" : "OFFLINE";
  private lastSyncedAt: string | null = null;
  private pendingCount = 0;
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private retryTimer: any = null;
  private backoffDelayMs = 5000;

  constructor() {
    this.initListeners();
    this.updatePendingCount();
    // Check initial connectivity reachability
    this.checkReachability();
  }

  private initListeners() {
    window.addEventListener("online", () => {
      this.checkReachability().then(isReachable => {
        if (isReachable) {
          this.setState("ONLINE", "Internet connection restored");
          this.triggerSync();
        }
      });
    });

    window.addEventListener("offline", () => {
      this.setState("OFFLINE", "Offline — using local agricultural data");
    });
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatusInfo());
    return () => this.listeners.delete(listener);
  }

  public getStatusInfo(): SyncStatusInfo {
    return {
      state: this.state,
      pendingCount: this.pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      message: this.getDisplayMessage()
    };
  }

  private getDisplayMessage(): string {
    switch (this.state) {
      case "OFFLINE":
        return this.lastSyncedAt 
          ? `Offline • Saved data (Last: ${new Date(this.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
          : "Offline • Using saved farm data";
      case "SYNCING":
        return `Syncing ${this.pendingCount} update${this.pendingCount > 1 ? "s" : ""}...`;
      case "SYNCED":
        return "Synced • All data up to date";
      case "FAILED":
        return "Sync retry in progress...";
      case "ONLINE":
      default:
        return "Online";
    }
  }

  private setState(newState: SyncState, customMsg?: string) {
    this.state = newState;
    const info = this.getStatusInfo();
    this.listeners.forEach(l => l(info));
  }

  public async checkReachability(): Promise<boolean> {
    if (!navigator.onLine) {
      this.setState("OFFLINE");
      return false;
    }
    const isHealthy = await apiClient.checkHealth();
    if (!isHealthy) {
      this.setState("OFFLINE", "Backend unreachable");
      return false;
    }
    return true;
  }

  public async updatePendingCount(): Promise<number> {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      this.pendingCount = 0;
      return 0;
    }
    try {
      this.pendingCount = await db.syncQueue.where("userId").equals(uid).count();
      this.notify();
      return this.pendingCount;
    } catch {
      return 0;
    }
  }

  private notify() {
    const info = this.getStatusInfo();
    this.listeners.forEach(l => l(info));
  }

  /**
   * Enqueues an offline mutation and triggers sync if online.
   */
  public async queueMutation(
    entity: "profile" | "farm" | "field" | "activity" | "feedback" | "scan",
    action: "create" | "update" | "delete",
    clientId: string,
    payload: any
  ): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const item: SyncQueueItem = {
      userId: uid,
      entity,
      action,
      clientId,
      payload,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: "pending"
    };

    await db.syncQueue.add(item);
    await this.updatePendingCount();

    // If online, kick off sync
    if (this.state !== "OFFLINE") {
      this.triggerSync();
    }
  }

  /**
   * Pushes all pending queue items to FastAPI backend and pulls latest changes.
   */
  public async triggerSync(): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid || this.isSyncing) return;

    const isReachable = await this.checkReachability();
    if (!isReachable) return;

    this.isSyncing = true;
    this.setState("SYNCING");

    try {
      const pendingItems = await db.syncQueue
        .where("userId")
        .equals(uid)
        .toArray();

      if (pendingItems.length > 0) {
        const mutations = pendingItems.map(item => ({
          client_id: item.clientId,
          entity: item.entity,
          action: item.action,
          timestamp: item.timestamp,
          payload: item.payload
        }));

        const pushRes = await apiClient.pushSync(mutations);
        if (pushRes && pushRes.synced_count !== undefined) {
          // Remove successfully synced items from queue
          const idsToDelete = pendingItems.map(i => i.id!).filter(Boolean);
          await db.syncQueue.bulkDelete(idsToDelete);
        }
      }

      // Pull down latest server updates
      try {
        const pullRes = await apiClient.pullSync(this.lastSyncedAt || undefined);
        if (pullRes) {
          // Update local activities
          if (pullRes.activities && pullRes.activities.length > 0) {
            for (const act of pullRes.activities) {
              await db.activities.put({
                id: act.id,
                userId: uid,
                fieldId: act.field_id,
                activityType: act.activity_type,
                date: act.date,
                notes: act.notes,
                costRs: act.cost_rs,
                source: act.source,
                updatedAt: new Date().toISOString(),
                pendingSync: false,
                synced: true
              });
            }
          }
        }
      } catch (pullErr) {
        console.warn("Pull sync warning:", pullErr);
      }

      this.lastSyncedAt = new Date().toISOString();
      await this.updatePendingCount();
      this.setState("SYNCED");
      this.backoffDelayMs = 5000; // Reset backoff

      // Return to ONLINE state after 3 seconds
      setTimeout(() => {
        if (this.state === "SYNCED") {
          this.setState("ONLINE");
        }
      }, 3000);

    } catch (err) {
      console.error("Sync failed:", err);
      this.setState("FAILED", "Sync failed. Will retry automatically.");
      
      // Schedule exponential backoff retry
      clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => {
        this.backoffDelayMs = Math.min(this.backoffDelayMs * 2, 60000);
        this.triggerSync();
      }, this.backoffDelayMs);

    } finally {
      this.isSyncing = false;
      await this.updatePendingCount();
    }
  }
}

export const syncManager = new OfflineSyncManager();
