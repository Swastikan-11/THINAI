import { db, SyncQueueItem } from "./db";
import { apiClient } from "./apiClient";
import { auth } from "../firebase";

export type SyncState = "ONLINE" | "OFFLINE_MODE" | "OFFLINE" | "SYNCING" | "SYNCED" | "FAILED";

export interface SyncStatusInfo {
  state: SyncState;
  pendingCount: number;
  lastSyncedAt: string | null;
  message: string;
  isManualOffline: boolean;
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
  private isManualOffline = false;

  constructor() {
    this.initListeners();
    this.updatePendingCount();
    this.checkReachability();
  }

  private initListeners() {
    window.addEventListener("online", () => {
      if (this.isManualOffline) return; // Respect explicit user offline choice
      this.checkReachability().then(isReachable => {
        if (isReachable) {
          this.setState("ONLINE", "Internet connection restored");
          this.triggerSync();
        }
      });
    });

    window.addEventListener("offline", () => {
      if (this.isManualOffline) return;
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
      message: this.getDisplayMessage(),
      isManualOffline: this.isManualOffline
    };
  }

  /**
   * Functional control: Farmer intentionally switches THINAI into offline mode or back online
   */
  public toggleManualOffline(forcedState?: boolean): boolean {
    const targetState = forcedState !== undefined ? forcedState : !this.isManualOffline;
    this.isManualOffline = targetState;

    if (this.isManualOffline) {
      this.setState("OFFLINE_MODE", "Offline Mode Active • Live data paused");
    } else {
      if (!navigator.onLine) {
        this.setState("OFFLINE", "No network connection detected");
      } else {
        this.setState("ONLINE", "Online • Syncing enabled");
        this.triggerSync();
      }
    }
    return this.isManualOffline;
  }

  public isOfflineActive(): boolean {
    return this.isManualOffline || !navigator.onLine || this.state === "OFFLINE" || this.state === "OFFLINE_MODE";
  }

  private getDisplayMessage(): string {
    switch (this.state) {
      case "OFFLINE_MODE":
        return "Offline Mode Active • Live weather and market data are temporarily unavailable";
      case "OFFLINE":
        return this.lastSyncedAt 
          ? `Offline • Saved data (Last: ${new Date(this.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
          : "Offline • Using locally saved farm data";
      case "SYNCING":
        return `Syncing ${this.pendingCount} update${this.pendingCount > 1 ? "s" : ""}...`;
      case "SYNCED":
        return "All data synchronized";
      case "FAILED":
        return "Sync retry in progress...";
      case "ONLINE":
      default:
        return "Online • Live Sync Active";
    }
  }

  private setState(newState: SyncState, customMsg?: string) {
    this.state = newState;
    const info = this.getStatusInfo();
    this.listeners.forEach(l => l(info));
  }

  public async checkReachability(): Promise<boolean> {
    if (this.isManualOffline) {
      return false;
    }
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
    entity: "profile" | "farm" | "field" | "soil" | "feedback" | "scan" | "recommendation",
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

    // If online and not in manual offline mode, trigger sync
    if (!this.isOfflineActive()) {
      this.triggerSync();
    }
  }

  /**
   * Pushes all pending queue items to FastAPI backend and confirms synchronization.
   */
  public async triggerSync(): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid || this.isSyncing || this.isManualOffline) return;

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
          // Remove successfully synced items from queue using IDs
          const idsToDelete = pendingItems.map(i => i.id!).filter(Boolean);
          await db.syncQueue.bulkDelete(idsToDelete);
        }
      }

      this.lastSyncedAt = new Date().toISOString();
      await this.updatePendingCount();
      this.setState("SYNCED");
      this.backoffDelayMs = 5000;

      setTimeout(() => {
        if (this.state === "SYNCED" && !this.isManualOffline) {
          this.setState("ONLINE");
        }
      }, 3000);

    } catch (err) {
      console.error("Sync failed:", err);
      this.setState("FAILED", "Sync failed. Will retry automatically.");
      
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
