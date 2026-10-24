import React, { useState, useEffect, useCallback } from "react";
import {
  Sprout,
  Calendar,
  Droplets,
  DollarSign,
  Plus,
  Trash2,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  Info,
  ChevronRight,
  X,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import {
  LocalPlot,
  LocalSprayLog,
  LocalFarmExpense
} from "../../services/db";
import {
  getPlots,
  savePlot,
  deletePlot,
  getSprayLogs,
  saveSprayLog,
  deleteSprayLog,
  getFarmExpenses,
  saveFarmExpense,
  deleteFarmExpense,
  getFarmSummary,
  FarmSummary,
  getDaysAfterSowing,
  initializeDefaultPlotIfEmpty
} from "../../services/farmRecordService";
import { syncManager } from "../../services/syncService";
import { AppLanguage } from "../../services/i18n";

interface FarmRecordsScreenProps {
  userId: string;
  farmerName: string;
  language: AppLanguage;
  primaryCrop?: string;
  cropVariety?: string;
  farmSize?: string;
  soilType?: string;
  onBack?: () => void;
}

type TabType = "plots" | "sprays" | "expenses" | "overview";

export function FarmRecordsScreen({
  userId,
  farmerName,
  language,
  primaryCrop = "Paddy",
  cropVariety = "CO 51",
  farmSize = "2.0",
  soilType = "Clay Loam",
  onBack
}: FarmRecordsScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>("plots");
  const [plots, setPlots] = useState<LocalPlot[]>([]);
  const [sprays, setSprays] = useState<LocalSprayLog[]>([]);
  const [expenses, setExpenses] = useState<LocalFarmExpense[]>([]);
  const [summary, setSummary] = useState<FarmSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [showPlotModal, setShowPlotModal] = useState<boolean>(false);
  const [showSprayModal, setShowSprayModal] = useState<boolean>(false);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);

  // Form states
  const [newPlot, setNewPlot] = useState({
    name: "",
    areaAcres: "1.0",
    soilType: "Clay Loam",
    currentCrop: "Paddy",
    cropVariety: "CO 51",
    sowingDate: new Date().toISOString().split("T")[0],
    cropStage: "Vegetative"
  });

  const [newSpray, setNewSpray] = useState({
    plotId: "",
    date: new Date().toISOString().split("T")[0],
    sprayType: "BIO_INPUT" as const,
    productName: "Neem Oil 1500ppm",
    dosage: "3 ml/L of water",
    targetPestDisease: "Preventive sucking pest protection",
    notes: ""
  });

  const [newExpense, setNewExpense] = useState({
    plotId: "",
    date: new Date().toISOString().split("T")[0],
    category: "SEEDS" as const,
    amountRs: "",
    description: ""
  });

  const isTa = language === "Tamil";

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await initializeDefaultPlotIfEmpty(
        userId,
        farmerName,
        primaryCrop,
        cropVariety,
        farmSize,
        soilType
      );
      const [plotList, sprayList, expenseList, sum] = await Promise.all([
        getPlots(userId),
        getSprayLogs(userId),
        getFarmExpenses(userId),
        getFarmSummary(userId)
      ]);
      setPlots(plotList);
      setSprays(sprayList);
      setExpenses(expenseList);
      setSummary(sum);

      if (plotList.length > 0 && !newSpray.plotId) {
        setNewSpray(prev => ({ ...prev, plotId: plotList[0].id }));
      }
      if (plotList.length > 0 && !newExpense.plotId) {
        setNewExpense(prev => ({ ...prev, plotId: plotList[0].id }));
      }
    } catch (e) {
      console.error("Error loading farm records:", e);
    } finally {
      setIsLoading(false);
    }
  }, [userId, farmerName, primaryCrop, cropVariety, farmSize, soilType, newSpray.plotId, newExpense.plotId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handlers
  const handleCreatePlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlot.name.trim()) return;

    await savePlot({
      userId,
      farmId: `farm-${userId}`,
      name: newPlot.name.trim(),
      areaAcres: parseFloat(newPlot.areaAcres) || 1.0,
      soilType: newPlot.soilType,
      currentCrop: newPlot.currentCrop,
      cropVariety: newPlot.cropVariety,
      sowingDate: newPlot.sowingDate,
      cropStage: newPlot.cropStage,
      status: "ACTIVE"
    });

    setShowPlotModal(false);
    setNewPlot({
      name: "",
      areaAcres: "1.0",
      soilType: "Clay Loam",
      currentCrop: "Paddy",
      cropVariety: "CO 51",
      sowingDate: new Date().toISOString().split("T")[0],
      cropStage: "Vegetative"
    });
    refreshData();
  };

  const handleDeletePlot = async (plotId: string) => {
    if (confirm(isTa ? "இந்த நிலப் பதிவை நீக்க விரும்புகிறீர்களா?" : "Delete this plot record?")) {
      await deletePlot(plotId, userId);
      refreshData();
    }
  };

  const handleCreateSpray = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpray.productName.trim()) return;

    const selectedPlot = plots.find(p => p.id === newSpray.plotId) || plots[0];

    await saveSprayLog({
      userId,
      plotId: selectedPlot?.id || "default",
      plotName: selectedPlot?.name || "Main Plot",
      date: newSpray.date,
      sprayType: newSpray.sprayType,
      productName: newSpray.productName.trim(),
      dosage: newSpray.dosage.trim(),
      targetPestDisease: newSpray.targetPestDisease.trim(),
      notes: newSpray.notes.trim()
    });

    setShowSprayModal(false);
    setNewSpray({
      plotId: plots[0]?.id || "",
      date: new Date().toISOString().split("T")[0],
      sprayType: "BIO_INPUT",
      productName: "Neem Oil 1500ppm",
      dosage: "3 ml/L of water",
      targetPestDisease: "Preventive sucking pest protection",
      notes: ""
    });
    refreshData();
  };

  const handleDeleteSpray = async (sprayId: string) => {
    if (confirm(isTa ? "இந்த தெளிப்புப் பதிவை நீக்க விரும்புகிறீர்களா?" : "Delete this spray log record?")) {
      await deleteSprayLog(sprayId, userId);
      refreshData();
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newExpense.amountRs);
    if (isNaN(amount) || amount <= 0) return;

    const selectedPlot = plots.find(p => p.id === newExpense.plotId) || plots[0];

    await saveFarmExpense({
      userId,
      plotId: selectedPlot?.id,
      plotName: selectedPlot?.name,
      date: newExpense.date,
      category: newExpense.category,
      amountRs: amount,
      description: newExpense.description.trim() || `${newExpense.category} expense`
    });

    setShowExpenseModal(false);
    setNewExpense({
      plotId: plots[0]?.id || "",
      date: new Date().toISOString().split("T")[0],
      category: "SEEDS",
      amountRs: "",
      description: ""
    });
    refreshData();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm(isTa ? "இந்த செலவுப் பதிவை நீக்க விரும்புகிறீர்களா?" : "Delete this expense record?")) {
      await deleteFarmExpense(expenseId, userId);
      refreshData();
    }
  };

  const isOffline = syncManager.isOfflineActive();

  return (
    <div className="flex flex-col h-full select-none bg-slate-50">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 rounded-b-2xl shadow-sm shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold">
                {isTa ? "பண்ணை பதிவேடு" : "Farm Records"}
              </h1>
              <p className="text-[11px] text-emerald-200">
                {isTa ? "நிலங்கள் • விதைப்பு • தெளிப்பு • செலவுகள்" : "Plots • Sowing • Spray Log • Expenses"}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-400/30 text-emerald-200">
            {isOffline ? "💾 DEXIE OFFLINE" : "🟢 DEXIE SYNC"}
          </span>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex gap-1.5 mt-3 bg-emerald-950/40 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("plots")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "plots" ? "bg-white text-emerald-950 shadow-xs" : "text-emerald-100 hover:bg-white/10"
            }`}>
            {isTa ? "நிலங்கள்" : "Plots"} ({plots.length})
          </button>
          <button
            onClick={() => setActiveTab("sprays")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "sprays" ? "bg-white text-emerald-950 shadow-xs" : "text-emerald-100 hover:bg-white/10"
            }`}>
            {isTa ? "தெளிப்பு" : "Sprays"} ({sprays.length})
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "expenses" ? "bg-white text-emerald-950 shadow-xs" : "text-emerald-100 hover:bg-white/10"
            }`}>
            {isTa ? "செலவுகள்" : "Expenses"}
          </button>
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "overview" ? "bg-white text-emerald-950 shadow-xs" : "text-emerald-100 hover:bg-white/10"
            }`}>
            {isTa ? "சுருக்கம்" : "Summary"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "none" }}>
        
        {/* TAB 1: PLOTS & SOWING DATES */}
        {activeTab === "plots" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  {isTa ? "பண்ணை நிலப் பிரிவுகள்" : "Cultivated Farm Plots"}
                </h2>
                <p className="text-[11px] text-gray-500">
                  {isTa ? "விதைப்பு தேதி மற்றும் நில பரப்பு பதிவு" : "Sowing dates, crops & acreage tracking"}
                </p>
              </div>
              <button
                onClick={() => setShowPlotModal(true)}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs">
                <Plus size={14} />
                {isTa ? "புதிய நிலம்" : "Add Plot"}
              </button>
            </div>

            {plots.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-gray-200 text-center space-y-2">
                <Sprout className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-xs text-gray-600">
                  {isTa ? "நிலங்கள் எதுவும் சேர்க்கப்படவில்லை" : "No plots recorded yet"}
                </p>
              </div>
            ) : (
              plots.map(plot => {
                const das = getDaysAfterSowing(plot.sowingDate);
                return (
                  <div key={plot.id} className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900">{plot.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            {plot.currentCrop} {plot.cropVariety ? `(${plot.cropVariety})` : ""}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {plot.areaAcres} {isTa ? "ஏக்கர்" : "Acres"} • {plot.soilType}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePlot(plot.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Delete Plot">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 flex items-center gap-1.5">
                        <Calendar size={13} className="text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-[10px] text-gray-500 block">{isTa ? "விதைப்பு தேதி" : "Sowing Date"}</span>
                          <strong className="text-gray-800 text-[11px] font-mono">{plot.sowingDate || "Not recorded"}</strong>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 flex items-center gap-1.5">
                        <Clock size={13} className="text-teal-600 shrink-0" />
                        <div>
                          <span className="text-[10px] text-gray-500 block">{isTa ? "விதைத்த நாட்கள் (DAS)" : "Days After Sowing"}</span>
                          <strong className="text-teal-800 text-[11px] font-bold">
                            {das !== null ? `${das} ${isTa ? "நாட்கள்" : "Days"}` : "—"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: SPRAY LOGS */}
        {activeTab === "sprays" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  {isTa ? "மருந்து தெளிப்பு பதிவேடு" : "Spray Application Log"}
                </h2>
                <p className="text-[11px] text-gray-500">
                  {isTa ? "பூச்சிக்கொல்லி & உர தெளிப்பு விவரங்கள்" : "Chronological pesticide, fungicide & nutrient log"}
                </p>
              </div>
              <button
                onClick={() => setShowSprayModal(true)}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs">
                <Plus size={14} />
                {isTa ? "தெளிப்பு பதிவு" : "Log Spray"}
              </button>
            </div>

            {sprays.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-gray-200 text-center space-y-2">
                <Droplets className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-xs text-gray-600">
                  {isTa ? "தெளிப்பு விவரங்கள் எதுவும் பதிவு செய்யப்படவில்லை" : "No spray logs recorded yet"}
                </p>
                <button
                  onClick={() => setShowSprayModal(true)}
                  className="text-xs font-bold text-emerald-700 underline">
                  {isTa ? "முதல் தெளிப்பை பதிவு செய்க" : "Log your first spray"}
                </button>
              </div>
            ) : (
              sprays.map(spray => (
                <div key={spray.id} className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{spray.productName}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          spray.sprayType === "BIO_INPUT" ? "bg-emerald-100 text-emerald-800" :
                          spray.sprayType === "FERTILIZER" ? "bg-blue-100 text-blue-800" :
                          spray.sprayType === "FUNGICIDE" ? "bg-amber-100 text-amber-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {spray.sprayType.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 mt-0.5 block">
                        Plot: <strong>{spray.plotName}</strong> • {spray.date}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteSpray(spray.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Delete Spray Record">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{isTa ? "அளவு / மருந்தளவு:" : "Dosage:"}</span>
                      <strong className="text-gray-800">{spray.dosage}</strong>
                    </div>
                    {spray.targetPestDisease && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">{isTa ? "இலக்கு நோய் / பூச்சி:" : "Target:"}</span>
                        <span className="text-gray-800">{spray.targetPestDisease}</span>
                      </div>
                    )}
                    {spray.notes && (
                      <div className="text-[11px] text-gray-600 pt-1 border-t border-slate-200">
                        {spray.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: EXPENSES LEDGER */}
        {activeTab === "expenses" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  {isTa ? "பண்ணை செலவு கணக்கு" : "Farm Expense Ledger"}
                </h2>
                <p className="text-[11px] text-gray-500">
                  {isTa ? "விதை, உரம், ஆட்கள் கூலி, இயந்திர செலவுகள்" : "Seeds, inputs, labor & machinery expenses"}
                </p>
              </div>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs">
                <Plus size={14} />
                {isTa ? "செலவு சேர்" : "Add Expense"}
              </button>
            </div>

            {/* Total Expense Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                  {isTa ? "மொத்த பண்ணை செலவுகள்" : "Total Cultivation Expenses"}
                </span>
                <h3 className="text-2xl font-black text-emerald-950 font-mono mt-0.5">
                  ₹{summary?.totalExpensesRs.toLocaleString("en-IN") || "0"}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                ₹
              </div>
            </div>

            {expenses.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-gray-200 text-center space-y-2">
                <DollarSign className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-xs text-gray-600">
                  {isTa ? "செலவுகள் எதுவும் பதிவு செய்யப்படவில்லை" : "No expenses recorded yet"}
                </p>
              </div>
            ) : (
              expenses.map(expense => (
                <div key={expense.id} className="p-3 rounded-2xl bg-white border border-gray-200 shadow-2xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{expense.description}</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {expense.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 block">
                      {expense.date} {expense.plotName ? `• ${expense.plotName}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 font-mono">
                      ₹{expense.amountRs.toLocaleString("en-IN")}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Delete Expense">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: FARM OVERVIEW SUMMARY */}
        {activeTab === "overview" && summary && (
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {isTa ? "பண்ணை மேலோட்டம்" : "Farm Overview & Analytics"}
              </h2>
              <p className="text-[11px] text-gray-500">
                {isTa ? "முக்கிய அளவீடுகள் மற்றும் செலவு பகுப்பாய்வு" : "Key farm health, land and financial metrics"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-white border border-gray-200 shadow-2xs">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">{isTa ? "மொத்த நிலப்பரப்பு" : "Total Acreage"}</span>
                <span className="text-lg font-black text-gray-900 mt-1 block">
                  {summary.totalAreaAcres} <span className="text-xs font-normal text-gray-400">{isTa ? "ஏக்கர்" : "Acres"}</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">{summary.activePlotsCount} Active Plots</span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-gray-200 shadow-2xs">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">{isTa ? "மொத்த செலவு" : "Total Input Cost"}</span>
                <span className="text-lg font-black text-emerald-950 font-mono mt-1 block">
                  ₹{summary.totalExpensesRs.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-gray-500">{expenses.length} Logged Entries</span>
              </div>
            </div>

            {/* Expenses by Category Breakdown */}
            <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-2">
              <span className="text-xs font-bold text-gray-900 block">
                {isTa ? "செலவு பிரிவு பகுப்பாய்வு" : "Expense Breakdown by Input"}
              </span>
              {Object.keys(summary.expensesByCategory).length === 0 ? (
                <p className="text-xs text-gray-500">{isTa ? "செலவு தரவு இல்லை" : "No expense data logged"}</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(summary.expensesByCategory).map(([cat, amt]) => {
                    const pct = summary.totalExpensesRs > 0 ? Math.round((amt / summary.totalExpensesRs) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-700 font-semibold">{cat}</span>
                          <span className="font-mono text-gray-900 font-bold">₹{amt.toLocaleString("en-IN")} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Crops in Farm */}
            <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1.5">
              <span className="text-xs font-bold text-gray-900 block">
                {isTa ? "பயிரிடப்படும் பயிர்கள்" : "Currently Cultivated Crops"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {summary.cropsList.map(c => (
                  <span key={c} className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    🌱 {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: ADD PLOT ─── */}
      {showPlotModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-gray-900">
                {isTa ? "புதிய நிலப்பிரிவு சேர்க்க" : "Add Cultivation Plot"}
              </h3>
              <button
                onClick={() => setShowPlotModal(false)}
                aria-label="Close plot modal"
                className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePlot} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Plot Name / நிலத்தின் பெயர்</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Paddy Field"
                  value={newPlot.name}
                  onChange={e => setNewPlot({ ...newPlot, name: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Area / பரப்பு (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={newPlot.areaAcres}
                    onChange={e => setNewPlot({ ...newPlot, areaAcres: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Soil Type / மண் வகை</label>
                  <select
                    value={newPlot.soilType}
                    onChange={e => setNewPlot({ ...newPlot, soilType: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-slate-50">
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Red Soil">Red Loam</option>
                    <option value="Black Cotton Soil">Black Cotton Soil</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Crop / பயிர்</label>
                  <select
                    value={newPlot.currentCrop}
                    onChange={e => setNewPlot({ ...newPlot, currentCrop: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-slate-50">
                    <option value="Paddy">Paddy (Rice)</option>
                    <option value="Tomato">Tomato</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Chilli">Chilli</option>
                    <option value="Maize">Maize</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Variety / ரகம்</label>
                  <input
                    type="text"
                    placeholder="e.g. CO 51, Shivam F1"
                    value={newPlot.cropVariety}
                    onChange={e => setNewPlot({ ...newPlot, cropVariety: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Sowing Date / விதைப்பு தேதி</label>
                <input
                  type="date"
                  required
                  value={newPlot.sowingDate}
                  onChange={e => setNewPlot({ ...newPlot, sowingDate: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs mt-2">
                {isTa ? "நிலத்தைச் சேமிக்கவும்" : "Save Plot to Dexie"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD SPRAY LOG ─── */}
      {showSprayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-gray-900">
                {isTa ? "தெளிப்பு விவரம் பதிவு செய்ய" : "Log Spray Application"}
              </h3>
              <button
                onClick={() => setShowSprayModal(false)}
                aria-label="Close spray modal"
                className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSpray} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Target Plot / நிலம்</label>
                <select
                  value={newSpray.plotId}
                  onChange={e => setNewSpray({ ...newSpray, plotId: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs bg-slate-50">
                  {plots.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.currentCrop})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Date / தேதி</label>
                  <input
                    type="date"
                    required
                    value={newSpray.date}
                    onChange={e => setNewSpray({ ...newSpray, date: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Spray Type / வகை</label>
                  <select
                    value={newSpray.sprayType}
                    onChange={e => setNewSpray({ ...newSpray, sprayType: e.target.value as any })}
                    className="w-full p-2 border rounded-xl text-xs bg-slate-50">
                    <option value="BIO_INPUT">Bio-Input (இயற்கை)</option>
                    <option value="FERTILIZER">Fertilizer (உரம்)</option>
                    <option value="FUNGICIDE">Fungicide (பூஞ்சான்க்கொல்லி)</option>
                    <option value="PESTICIDE">Pesticide (பூச்சிக்கொல்லி)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Product Name / மருந்து பெயர்</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neem Oil 1500ppm, Pseudomonas"
                  value={newSpray.productName}
                  onChange={e => setNewSpray({ ...newSpray, productName: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Dosage / மருந்தளவு</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3 ml/L or 500g/acre"
                  value={newSpray.dosage}
                  onChange={e => setNewSpray({ ...newSpray, dosage: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Target Pest / இலக்கு</label>
                <input
                  type="text"
                  placeholder="e.g. Sucking pests, Blast prevention"
                  value={newSpray.targetPestDisease}
                  onChange={e => setNewSpray({ ...newSpray, targetPestDisease: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs mt-2">
                {isTa ? "தெளிப்பைப் பதிவு செய்க" : "Save Spray Log to Dexie"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ADD EXPENSE ─── */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-gray-900">
                {isTa ? "செலவைச் சேர்க்க" : "Add Farm Expense"}
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                aria-label="Close expense modal"
                className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Category / பிரிவு</label>
                  <select
                    value={newExpense.category}
                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value as any })}
                    className="w-full p-2 border rounded-xl text-xs bg-slate-50">
                    <option value="SEEDS">Seeds (விதை)</option>
                    <option value="FERTILIZER">Fertilizer (உரம்)</option>
                    <option value="PESTICIDE">Pesticide (மருந்து)</option>
                    <option value="LABOR">Labor (கூலி)</option>
                    <option value="MACHINERY">Machinery (இயந்திரம்)</option>
                    <option value="IRRIGATION">Irrigation (பாசனம்)</option>
                    <option value="OTHER">Other (இதர)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Amount / தொகை (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 1500"
                    value={newExpense.amountRs}
                    onChange={e => setNewExpense({ ...newExpense, amountRs: e.target.value })}
                    className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Description / விளக்கம்</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 25kg Paddy Seeds CO 51"
                  value={newExpense.description}
                  onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Date / தேதி</label>
                <input
                  type="date"
                  required
                  value={newExpense.date}
                  onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs mt-2">
                {isTa ? "செலவைச் சேமிக்கவும்" : "Save Expense to Dexie"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
