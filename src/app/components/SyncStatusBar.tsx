import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, CloudOff, Clock } from "lucide-react";
import { syncManager, SyncStatusInfo } from "../../services/syncService";

interface SyncStatusProps {
  onOpenPendingSync?: () => void;
}

export function SyncStatusBar({ onOpenPendingSync }: SyncStatusProps) {
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
    if (onOpenPendingSync) {
      onOpenPendingSync();
      return;
    }
    if (!status.isManualOffline && status.state !== "SYNCING") {
      syncManager.triggerSync();
    }
  };

  const getBadgeStyle = () => {
    if (status.isManualOffline || status.state === "OFFLINE_MODE" || !navigator.onLine) {
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

  const isOffline = status.isManualOffline || !navigator.onLine || status.state === "OFFLINE_MODE" || status.state === "OFFLINE";

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Persistent Small Bilingual App Bar Badge */}
      <button
        onClick={handleToggleOffline}
        title={isOffline ? "Offline Mode (Click to Toggle) • ஆஃப்லைன் பயன்முறை" : "Online Mode (Click to Toggle) • ஆன்லைன் பயன்முறை"}
        className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer ${getBadgeStyle()}`}
      >
        {isOffline ? (
          <>
            <CloudOff size={12} className="text-amber-300" />
            <span>Offline • ஆஃப்லைன்</span>
          </>
        ) : status.state === "SYNCING" ? (
          <>
            <RefreshCw size={12} className="text-blue-300 animate-spin" />
            <span>Syncing • ஒத்திசைவு...</span>
          </>
        ) : status.state === "SYNCED" ? (
          <>
            <CheckCircle2 size={12} className="text-emerald-300" />
            <span>Synced • ஒத்திசைந்தது</span>
          </>
        ) : (
          <>
            <Wifi size={12} className="text-emerald-300" />
            <span>Online • இணைப்பில்</span>
          </>
        )}
      </button>

      {/* Clickable Pending Sync Pill */}
      {status.pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          title="Click to view pending offline changes"
          className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] text-amber-200 font-bold flex items-center gap-1 hover:bg-amber-500/30 cursor-pointer active:scale-95 transition-all"
        >
          <Clock size={10} className="text-amber-300" />
          <span>{status.pendingCount} pending • காத்திருக்கிறது</span>
        </button>
      )}
    </div>
  );
}

/**
 * Prominent, sticky banner shown across the app when Offline Mode or disconnected state is active.
 * Bilingual (English + Tamil), displays pending offline queue count, and provides 1-tap retry sync button.
 */
export function OfflineActiveBanner({ onOpenPendingSync }: SyncStatusProps) {
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
    <div className="sticky top-0 z-40 bg-amber-500 text-zinc-950 px-3.5 py-1.5 text-xs font-semibold shadow-md border-b border-amber-600/30 select-none">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {status.state === "SYNCING" ? (
            <RefreshCw className="w-3.5 h-3.5 text-zinc-950 animate-spin shrink-0" />
          ) : (
            <CloudOff className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
          )}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-black uppercase text-[11px] whitespace-nowrap">
              {status.state === "SYNCING" ? "Syncing • ஒத்திசைக்கப்படுகிறது" : "Offline • ஆஃப்லைன்"}
            </span>
            {status.pendingCount > 0 && (
              <button
                onClick={onOpenPendingSync}
                className="px-1.5 py-0.5 rounded bg-zinc-950/20 hover:bg-zinc-950/30 text-zinc-950 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-zinc-950/20"
                title="View and manage pending items"
              >
                <Clock size={10} />
                <span>{status.pendingCount} pending • காத்திருக்கிறது</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {status.pendingCount > 0 && onOpenPendingSync && (
            <button
              onClick={onOpenPendingSync}
              className="px-2 py-0.5 rounded bg-zinc-950/10 hover:bg-zinc-950/20 text-zinc-950 text-[10px] font-bold border border-zinc-950/20 cursor-pointer"
            >
              Queue • வரிசை
            </button>
          )}

          {status.isManualOffline ? (
            <button
              onClick={() => syncManager.toggleManualOffline(false)}
              className="px-2 py-0.5 rounded bg-zinc-950 text-amber-300 text-[10px] font-bold hover:bg-zinc-800 active:scale-95 transition-all uppercase whitespace-nowrap shadow-xs cursor-pointer"
            >
              Go Online
            </button>
          ) : (
            <button
              onClick={handleRetry}
              disabled={status.state === "SYNCING"}
              className="px-2 py-0.5 rounded bg-zinc-950 text-amber-300 text-[10px] font-bold hover:bg-zinc-800 active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={10} className={status.state === "SYNCING" ? "animate-spin" : ""} />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
