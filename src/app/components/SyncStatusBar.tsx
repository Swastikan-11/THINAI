import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, CloudOff, Power } from "lucide-react";
import { syncManager, SyncStatusInfo } from "../../services/syncService";

export function SyncStatusBar() {
  const [status, setStatus] = useState<SyncStatusInfo>(syncManager.getStatusInfo());

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(newStatus => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const handleToggleOffline = () => {
    syncManager.toggleManualOffline();
  };

  const handleManualSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!status.isManualOffline && status.state !== "SYNCING") {
      syncManager.triggerSync();
    }
  };

  const getBadgeStyle = () => {
    if (status.isManualOffline || status.state === "OFFLINE_MODE") {
      return "bg-amber-500/20 text-amber-200 border-amber-400/40 ring-1 ring-amber-400/30";
    }
    switch (status.state) {
      case "OFFLINE":
        return "bg-zinc-700/50 text-zinc-200 border-zinc-500/40";
      case "SYNCING":
        return "bg-blue-500/20 text-blue-200 border-blue-400/30 animate-pulse";
      case "SYNCED":
        return "bg-emerald-500/20 text-emerald-200 border-emerald-400/30";
      case "FAILED":
        return "bg-red-500/20 text-red-200 border-red-400/30";
      case "ONLINE":
      default:
        return "bg-emerald-950/60 text-emerald-200 border-emerald-500/30";
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Offline Mode Toggle Button */}
      <button
        onClick={handleToggleOffline}
        title={status.isManualOffline ? "Switch to Online Mode" : "Switch to Offline Mode"}
        className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs ${getBadgeStyle()}`}
      >
        {status.isManualOffline ? (
          <>
            <CloudOff size={12} className="text-amber-300" />
            <span>OFFLINE MODE</span>
          </>
        ) : status.state === "SYNCING" ? (
          <>
            <RefreshCw size={12} className="text-blue-300 animate-spin" />
            <span>SYNCING...</span>
          </>
        ) : status.state === "SYNCED" ? (
          <>
            <CheckCircle2 size={12} className="text-emerald-300" />
            <span>SYNCED</span>
          </>
        ) : (
          <>
            <Wifi size={12} className="text-emerald-300" />
            <span>ONLINE</span>
          </>
        )}
      </button>

      {/* Sync trigger if pending items exist */}
      {status.pendingCount > 0 && !status.isManualOffline && (
        <button
          onClick={handleManualSync}
          title="Pending updates waiting to sync"
          className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[10px] text-blue-200 font-mono font-bold flex items-center gap-1 hover:bg-blue-500/30"
        >
          <RefreshCw size={10} className="animate-spin" />
          <span>{status.pendingCount} pending</span>
        </button>
      )}
    </div>
  );
}

/**
 * Prominent banner shown across the app when Offline Mode is active
 */
export function OfflineActiveBanner() {
  const [status, setStatus] = useState<SyncStatusInfo>(syncManager.getStatusInfo());

  useEffect(() => {
    return syncManager.subscribe(setStatus);
  }, []);

  if (!status.isManualOffline && status.state !== "OFFLINE_MODE" && status.state !== "OFFLINE") {
    return null;
  }

  return (
    <div className="bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2">
        <CloudOff className="w-4 h-4 text-zinc-950 shrink-0" />
        <span>
          <strong>OFFLINE MODE ACTIVE:</strong> Live weather and market data are temporarily unavailable. Serving locally cached data.
        </span>
      </div>
      <button
        onClick={() => syncManager.toggleManualOffline(false)}
        className="px-2.5 py-1 rounded-md bg-zinc-950 text-amber-300 text-[10px] font-bold hover:bg-zinc-800 transition-colors uppercase whitespace-nowrap ml-2"
      >
        Go Online
      </button>
    </div>
  );
}
