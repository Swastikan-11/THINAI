import React, { useState, useEffect } from "react";
import { 
  X, RefreshCw, Trash2, Clock, CheckCircle2, CloudOff, 
  Wifi, AlertCircle, Wrench, MessageSquare, Microscope, FileText, User 
} from "lucide-react";
import { db, SyncQueueItem } from "../../services/db";
import { syncManager } from "../../services/syncService";
import { AppLanguage } from "../../services/i18n";

interface PendingSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: AppLanguage;
  showToast?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function PendingSyncModal({
  isOpen,
  onClose,
  language = "English",
  showToast
}: PendingSyncModalProps) {
  const [items, setItems] = useState<SyncQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const isTa = language === "Tamil";
  const isOnline = typeof navigator !== "undefined" && navigator.onLine;

  const loadQueue = async () => {
    setLoading(true);
    try {
      const allItems = await db.syncQueue
        .where("status")
        .anyOf(["pending", "syncing", "failed"])
        .toArray();
      // Sort newest first
      allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setItems(allItems);
    } catch (err) {
      console.warn("Failed to load sync queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadQueue();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteItem = async (id?: number) => {
    if (!id) return;
    try {
      await db.syncQueue.delete(id);
      await loadQueue();
      await syncManager.updatePendingCount();
      showToast?.(
        isTa ? "நிலுவை உருப்படி நீக்கப்பட்டது" : "Queued item deleted from local storage",
        "info"
      );
    } catch (err) {
      console.error("Failed to delete queued sync item:", err);
      showToast?.(
        isTa ? "உருப்படியை நீக்குவதில் தோல்வி" : "Failed to delete item",
        "error"
      );
    }
  };

  const handleClearAll = async () => {
    if (items.length === 0) return;
    try {
      const ids = items.map((it) => it.id).filter((id): id is number => typeof id === "number");
      await db.syncQueue.bulkDelete(ids);
      await loadQueue();
      await syncManager.updatePendingCount();
      showToast?.(
        isTa ? "அனைத்து நிலுவை உருப்படிகளும் நீக்கப்பட்டன" : "All pending sync items cleared",
        "info"
      );
    } catch (err) {
      console.error("Failed to clear queue:", err);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      showToast?.(
        isTa ? "இணைய இணைப்பு இல்லை — ஒத்திசைக்க இணையம் தேவை" : "No internet — synchronization requires an active connection",
        "warning"
      );
      return;
    }
    setSyncing(true);
    try {
      await syncManager.triggerSync();
      await loadQueue();
      showToast?.(
        isTa ? "ஒத்திசைவு வெற்றிகரமாக முடிந்தது!" : "Synchronization completed successfully!",
        "success"
      );
    } catch (err) {
      showToast?.(
        isTa ? "ஒத்திசைவில் பிழை ஏற்பட்டது" : "Sync encounter error",
        "error"
      );
    } finally {
      setSyncing(false);
    }
  };

  const getCollectionMeta = (rawEntity: string, data: any) => {
    const entity = rawEntity.toLowerCase();
    if (entity.includes("equipment") || entity === "equipment_listings") {
      return {
        icon: <Wrench size={14} className="text-blue-600" />,
        title: isTa ? "உபகரண பதிவு" : "Equipment Listing",
        summary: data?.title ? `${data.title} (₹${data.pricePerDay || 0}/day)` : "Equipment post"
      };
    }
    if (entity.includes("community") || entity === "post" || entity === "community_posts") {
      return {
        icon: <MessageSquare size={14} className="text-emerald-600" />,
        title: isTa ? "சமூக பதிவு" : "Community Post",
        summary: data?.content ? `${data.content.slice(0, 50)}...` : "Discussion post"
      };
    }
    if (entity.includes("verdict") || entity === "farmer_verdicts") {
      return {
        icon: <Microscope size={14} className="text-purple-600" />,
        title: isTa ? "நோய் கண்டறிதல் தீர்ப்பு" : "Diagnosis Verdict",
        summary: data?.diseaseName ? `${data.crop || "Crop"}: ${data.diseaseName} (${data.verdict})` : "Field diagnosis label"
      };
    }
    if (entity.includes("feedback")) {
      return {
        icon: <FileText size={14} className="text-amber-600" />,
        title: isTa ? "பரிந்துரை கருத்து" : "Advisory Feedback",
        summary: data?.recommendationTitle || "Recommendation feedback"
      };
    }
    if (entity.includes("profile")) {
      return {
        icon: <User size={14} className="text-teal-600" />,
        title: isTa ? "சுயவிவர மாற்றம்" : "Profile Update",
        summary: data?.name ? `Profile update for ${data.name}` : "Farmer details update"
      };
    }
    return {
      icon: <Clock size={14} className="text-zinc-500" />,
      title: rawEntity,
      summary: "Local record update"
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">
                {isTa ? "நிலுவை ஒத்திசைவு வரிசை" : "Pending Sync Queue"}
              </h3>
              <p className="text-[11px] text-white/80">
                {isTa ? "உள்ளூர் சேமிப்பில் காத்திருக்கும் உருப்படிகள்" : "Local changes waiting for network"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Network Status & Quick Action Bar */}
        <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="text-xs font-semibold text-zinc-700">
              {isOnline 
                ? (isTa ? "இணையத்தில் உள்ளது (Online)" : "Online • Ready to sync") 
                : (isTa ? "ஆஃப்லைனில் உள்ளது (Offline)" : "Offline • Will sync when connected")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-2 py-1 rounded-lg text-[10px] font-bold text-red-700 hover:bg-red-50 transition-all border border-red-200 cursor-pointer"
              >
                {isTa ? "அனைத்தையும் நீக்கு" : "Clear All"}
              </button>
            )}
            <button
              onClick={handleManualSync}
              disabled={syncing || !isOnline || items.length === 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                !isOnline || items.length === 0
                  ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                  : "bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95 cursor-pointer"
              }`}
              title={!isOnline ? "Requires internet connection • இணைய இணைப்பு தேவை" : ""}
            >
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
              <span>{isTa ? "இப்போது ஒத்திசை" : "Sync Now"}</span>
            </button>
          </div>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
              <RefreshCw size={24} className="animate-spin text-emerald-700" />
              <p className="text-xs font-medium">{isTa ? "ஏற்றுகிறது..." : "Loading queue..."}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="font-bold text-sm text-zinc-800">
                {isTa ? "நிலுவையில் உருப்படிகள் இல்லை" : "All Data Synchronized"}
              </h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                {isTa 
                  ? "இந்த சாதனத்தில் செய்யப்பட்ட அனைத்து மாற்றங்களும் சேவையகத்துடன் முழுமையாக ஒத்திசைக்கப்பட்டுள்ளன." 
                  : "Zero pending offline items. Every equipment post, feedback, and verdict is up to date."}
              </p>
            </div>
          ) : (
            items.map((item) => {
              const meta = getCollectionMeta(item.entity || (item as any).collection || "", item.payload || (item as any).data);
              const formattedDate = new Date(item.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div 
                  key={item.id}
                  className="p-3 bg-white rounded-2xl border border-zinc-200 shadow-2xs hover:border-emerald-300 transition-all flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-zinc-900 leading-none">
                          {meta.title}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          item.status === "failed" 
                            ? "bg-red-100 text-red-800" 
                            : item.status === "syncing"
                            ? "bg-blue-100 text-blue-800 animate-pulse"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {item.status === "failed" ? (isTa ? "தோல்வி" : "Failed") : (isTa ? "காத்திருக்கிறது" : "Pending")}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600 truncate mt-1">
                        {meta.summary}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formattedDate}
                        </span>
                        {item.retryCount > 0 && (
                          <span className="text-amber-700 font-mono">
                            {isTa ? `மீண்டும் முயன்றது: ${item.retryCount}` : `Retried: ${item.retryCount}x`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all shrink-0 cursor-pointer"
                    title={isTa ? "நீக்கு" : "Delete queued write"}
                    aria-label="Delete queued item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-center">
          <p className="text-[11px] text-zinc-500">
            {isTa 
              ? "ஒத்திசைவு தானாகவே பின்னணியில் மீண்டும் முயற்சிக்கப்படும்." 
              : "Sync resumes automatically in the background upon reconnection."}
          </p>
        </div>
      </div>
    </div>
  );
}
