// THINAI Storage Quota & Capacity Management Service
// Monitors IndexedDB and LocalStorage usage via HTML5 Storage API.
// Automatically evicts transient caches before quota exhaustion,
// while STRICTLY preserving the pending Dexie syncQueue and user scans.

import { db } from "./db";

export interface StorageEstimateResult {
  isNearQuota: boolean;
  usageBytes: number;
  quotaBytes: number;
  usageRatio: number; // 0.0 to 1.0
  usageMb: number;
  quotaMb: number;
  warningMessage?: string;
  warningMessageTamil?: string;
}

const QUOTA_WARNING_THRESHOLD = 0.85; // 85% full

/**
 * Checks available storage quota and determines if warning/cleanup is required
 */
export async function checkStorageQuota(): Promise<StorageEstimateResult> {
  if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 50 * 1024 * 1024; // Default 50MB fallback
      const ratio = quota > 0 ? usage / quota : 0;
      const usageMb = Math.round((usage / (1024 * 1024)) * 100) / 100;
      const quotaMb = Math.round((quota / (1024 * 1024)) * 100) / 100;
      const isNearQuota = ratio >= QUOTA_WARNING_THRESHOLD;

      return {
        isNearQuota,
        usageBytes: usage,
        quotaBytes: quota,
        usageRatio: ratio,
        usageMb,
        quotaMb,
        warningMessage: isNearQuota
          ? `Device storage is ${Math.round(ratio * 100)}% full (${usageMb}MB of ${quotaMb}MB used). Automatic cache trimming activated.`
          : undefined,
        warningMessageTamil: isNearQuota
          ? `சாதன சேமிப்பு ${Math.round(ratio * 100)}% நிறைந்துள்ளது (${usageMb}MB / ${quotaMb}MB). பழைய தற்காலிக நினைவகம் அழிக்கப்படுகிறது.`
          : undefined
      };
    } catch (e) {
      console.warn("Storage estimate failed:", e);
    }
  }

  // Fallback safe defaults if navigator.storage.estimate is unavailable
  return {
    isNearQuota: false,
    usageBytes: 0,
    quotaBytes: 50 * 1024 * 1024,
    usageRatio: 0,
    usageMb: 0,
    quotaMb: 50
  };
}

/**
 * Evicts transient caches (expired weather, expired market, old recommendations)
 * without ever touching pending sync records in db.syncQueue.
 */
export async function pruneTransientCaches(): Promise<{ purgedRecords: number }> {
  let purgedRecords = 0;
  try {
    // 1. Purge outdated weather caches
    const nowIso = new Date().toISOString();
    const expiredWeather = await db.cachedWeather.where("expires_at").below(nowIso).toArray();
    for (const w of expiredWeather) {
      await db.cachedWeather.delete(w.district);
      purgedRecords++;
    }

    // 2. Purge outdated mandi market caches
    const expiredMarket = await db.cachedMarket.where("expires_at").below(nowIso).toArray();
    for (const m of expiredMarket) {
      await db.cachedMarket.delete(m.commodity);
      purgedRecords++;
    }

    // 3. Purge oldest recommendations if more than 30 are stored
    const totalRecs = await db.cachedRecommendations.count();
    if (totalRecs > 30) {
      const excess = totalRecs - 30;
      const oldestRecs = await db.cachedRecommendations.orderBy("generatedAt").limit(excess).toArray();
      for (const r of oldestRecs) {
        await db.cachedRecommendations.delete(r.id);
        purgedRecords++;
      }
    }
  } catch (err) {
    console.warn("Cache pruning encountered an error:", err);
  }

  return { purgedRecords };
}

/**
 * Wraps local storage/IndexedDB writes with automatic recovery on QuotaExceededError
 */
export async function safeStorageWrite<T>(writeOperation: () => Promise<T>): Promise<T> {
  try {
    return await writeOperation();
  } catch (err: any) {
    // Check if error is QuotaExceededError
    const isQuotaError = 
      err?.name === "QuotaExceededError" || 
      err?.code === 22 || 
      err?.code === 1014 ||
      err?.message?.includes("quota");

    if (isQuotaError) {
      console.warn("QuotaExceededError detected during write operation! Executing emergency transient cache eviction...");
      await pruneTransientCaches();
      // Retry once after emergency pruning
      return await writeOperation();
    }
    throw err;
  }
}
