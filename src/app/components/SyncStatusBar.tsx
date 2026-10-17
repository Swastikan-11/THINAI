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
 * Prominent, sticky banner shown across the app when Offline Mode or disconnected state is active.
 * Bilingual (English + Tamil), displays pending offline queue count, and provides 1-tap retry sync button.
 */
export function OfflineActiveBanner() {
  const [status, setStatus] = useState<SyncStatusInfo>(syncManager.getStatusInfo());

  useEffect(() => {
    return syncManager.subscribe(setStatus);
  }, []);

  const isOffline = status.isManualOffline || 
                    status.state === "OFFLINE_MODE" || 
                    status.state === "OFFLINE" || 
                    status.state === "FAILED" ||
                    !navigator.onLine;

  if (!isOffline && status.state !== "SYNCING") {
    return null;
  }

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status.isManualOffline) {
      syncManager.toggleManualOffline(false);
    } else {
      syncManager.triggerSync();
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-amber-500 text-zinc-950 px-3.5 py-2 text-xs font-semibold shadow-md border-b border-amber-600/30 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div className="flex items-start sm:items-center gap-2">
          {status.state === "SYNCING" ? (
            <RefreshCw className="w-4 h-4 text-zinc-950 animate-spin shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <CloudOff className="w-4 h-4 text-zinc-950 shrink-0 mt-0.5 sm:mt-0" />
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black uppercase tracking-tight">
                {status.state === "SYNCING" ? "Syncing • ஒத்திசைக்கப்படுகிறது" : "Offline Active • ஆஃப்லைன் பயன்முறை"}
              </span>
              {status.pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-zinc-950/20 text-zinc-950 font-mono text-[10px] font-bold">
                  {status.pendingCount} pending / காத்திருக்கிறது
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-zinc-900 leading-tight">
              Serving cached agricultural data. Live weather & market will refresh when connected.
            </span>
            <span className="text-[10px] font-medium text-zinc-800 leading-tight">
              உள்ளூர் தரவு காட்டப்படுகிறது. இணையம் வந்ததும் தானாக ஒத்திசைக்கப்படும்.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 mt-1 sm:mt-0">
          {status.isManualOffline ? (
            <button
              onClick={() => syncManager.toggleManualOffline(false)}
              className="px-2.5 py-1 rounded-md bg-zinc-950 text-amber-300 text-[10px] font-bold hover:bg-zinc-800 active:scale-95 transition-all uppercase whitespace-nowrap shadow-xs"
            >
              Go Online • ஆன்லைன் செல்
            </button>
          ) : (
            <button
              onClick={handleRetry}
              disabled={status.state === "SYNCING"}
              className="px-2.5 py-1 rounded-md bg-zinc-950 text-amber-300 text-[10px] font-bold hover:bg-zinc-800 active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={11} className={status.state === "SYNCING" ? "animate-spin" : ""} />
              <span>Retry • மீண்டும் முயற்சி</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
