import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { syncManager, SyncStatusInfo } from "../../services/syncService";

export function SyncStatusBar() {
  const [status, setStatus] = useState<SyncStatusInfo>(syncManager.getStatusInfo());

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(newStatus => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = () => {
    if (status.state !== "OFFLINE" && status.state !== "SYNCING") {
      syncManager.triggerSync();
    }
  };

  const getBadgeStyle = () => {
    switch (status.state) {
      case "OFFLINE":
        return "bg-amber-500/15 text-amber-200 border-amber-400/30";
      case "SYNCING":
        return "bg-blue-500/20 text-blue-200 border-blue-400/30 animate-pulse";
      case "SYNCED":
        return "bg-emerald-500/20 text-emerald-200 border-emerald-400/30";
      case "FAILED":
        return "bg-red-500/20 text-red-200 border-red-400/30";
      case "ONLINE":
      default:
        return "bg-white/15 text-white/90 border-white/20";
    }
  };

  const getIcon = () => {
    switch (status.state) {
      case "OFFLINE":
        return <WifiOff size={11} className="text-amber-300" />;
      case "SYNCING":
        return <RefreshCw size={11} className="text-blue-300 animate-spin" />;
      case "SYNCED":
        return <CheckCircle2 size={11} className="text-emerald-300" />;
      case "FAILED":
        return <AlertCircle size={11} className="text-red-300" />;
      case "ONLINE":
      default:
        return <Wifi size={11} className="text-emerald-300" />;
    }
  };

  return (
    <button
      onClick={handleManualSync}
      title="Tap to synchronize agricultural data"
      className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${getBadgeStyle()}`}>
      {getIcon()}
      <span className="truncate max-w-[170px]">{status.message}</span>
    </button>
  );
}
