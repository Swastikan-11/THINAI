// THINAI Extension-Officer Dashboard Screen (Phase 8 Upgrade)
// Provides:
// 1. Priority-sorted officer review queue with triage scoring
// 2. Multi-dimensional filtering (Crop, District, Tier, Verdict, Evidence Level, Uncertainty)
// 3. Officer ground-truth labeling actions (Confirm, Correct, Unusable, Needs Info)
// 4. Crop coverage & evidence registry view
// 5. Language review safety status view
// 6. Complete advisory & referral audit log with CSV export

import React, { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Eye, 
  FileSpreadsheet, 
  Lock, 
  UserCheck, 
  RefreshCw,
  Tag,
  Stethoscope,
  Info,
  Layers,
  Languages,
  History,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { 
  FieldDiagnosisRecord, 
  fetchOfficerDiagnoses, 
  submitExpertLabel, 
  exportExpertLabelsToCsv 
} from "../../services/officerService";
import { 
  QueuedReviewCase, 
  sortQueueByPriority, 
  OfficerReviewActionType, 
  applyOfficerReviewAction 
} from "../../services/officerQueueService";
import { 
  getAllEvidenceEntries, 
  getRegistrySummary,
  getEvidenceLevel 
} from "../../services/evidenceTierEngine";
import { 
  getAllLanguageReviewEntries 
} from "../../services/languageSafetyService";
import { 
  logAuditEvent, 
  getAuditLogs, 
  exportAuditLogsToCsv, 
  AuditLogEntry 
} from "../../services/officerAuditService";

interface OfficerDashboardScreenProps {
  onBack: () => void;
  language?: string;
  showToast?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

type DashboardTab = "queue" | "evidence" | "languages" | "audit";

export function OfficerDashboardScreen({
  onBack,
  language = "English",
  showToast
}: OfficerDashboardScreenProps) {
  const isTa = language === "Tamil";

  const [activeTab, setActiveTab] = useState<DashboardTab>("queue");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [diagnoses, setDiagnoses] = useState<QueuedReviewCase[]>([]);
  
  // Filters
  const [selectedCrop, setSelectedCrop] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedTier, setSelectedTier] = useState("All");
  const [selectedVerdict, setSelectedVerdict] = useState("All");
  const [selectedEvidence, setSelectedEvidence] = useState("All");
  const [selectedUncertainty, setSelectedUncertainty] = useState("All");

  // Officer Labeling Modal state
  const [selectedRecord, setSelectedRecord] = useState<QueuedReviewCase | null>(null);
  const [reviewAction, setReviewAction] = useState<OfficerReviewActionType>("CONFIRM_DIAGNOSIS");
  const [verifiedPathogen, setVerifiedPathogen] = useState("");
  const [unusableReason, setUnusableReason] = useState("Image optical blur / low lighting");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [submittingLabel, setSubmittingLabel] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchOfficerDiagnoses({
        crop: selectedCrop !== "All" ? selectedCrop : undefined,
        district: selectedDistrict !== "All" ? selectedDistrict : undefined,
        tier: selectedTier !== "All" ? selectedTier : undefined,
        verdict: selectedVerdict !== "All" ? selectedVerdict : undefined
      });

      // Enhance records with evidence level and mock uncertainty if missing
      const enhanced: QueuedReviewCase[] = data.map((d) => ({
        ...d,
        uncertaintyScore: Math.round((1 - (d.calibratedConfidence || 0.5)) * 100) / 100,
        imageQualityCheck: "PASSED",
      }));

      setDiagnoses(enhanced);
      setAuditLogs(getAuditLogs({ limit: 50 }));
    } catch (err) {
      console.error("Failed to load diagnoses for officer:", err);
      showToast?.(isTa ? "தரவு ஏற்றுவதில் பிழை" : "Error loading records", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCrop, selectedDistrict, selectedTier, selectedVerdict]);

  // Priority-Sorted and Filtered Queue
  const filteredSortedQueue = useMemo(() => {
    let list = [...diagnoses];

    if (selectedEvidence !== "All") {
      list = list.filter((item) => getEvidenceLevel(item.predictedClass, item.crop) === selectedEvidence);
    }

    if (selectedUncertainty === "HIGH") {
      list = list.filter((item) => (item.uncertaintyScore || 0) >= 0.60);
    }

    return sortQueueByPriority(list);
  }, [diagnoses, selectedEvidence, selectedUncertainty]);

  const handleExportCsv = () => {
    try {
      const csvContent = exportExpertLabelsToCsv(diagnoses);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `thinai_expert_validated_dataset_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast?.(isTa ? "CSV வெற்றிகரமாக பதிவிறக்கப்பட்டது" : "CSV exported successfully", "success");
    } catch (err) {
      console.error("CSV export error:", err);
      showToast?.(isTa ? "CSV பதிவிறக்க பிழை" : "CSV export failed", "error");
    }
  };

  const handleExportAuditCsv = () => {
    try {
      const csvContent = exportAuditLogsToCsv(auditLogs);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `thinai_advisory_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast?.(isTa ? "ஆடிட் CSV பதிவிறக்கப்பட்டது" : "Audit CSV exported", "success");
    } catch (err) {
      showToast?.("Audit export error", "error");
    }
  };

  const handleSaveOfficerAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      setSubmittingLabel(true);

      const targetPathogen = reviewAction === "CONFIRM_DIAGNOSIS"
        ? (verifiedPathogen.trim() || selectedRecord.predictedClass)
        : reviewAction === "CORRECT_DIAGNOSIS"
          ? verifiedPathogen.trim()
          : undefined;

      // 1. Submit expert label to Firestore
      await submitExpertLabel({
        diagnosisId: selectedRecord.id,
        verifiedPathogen: targetPathogen || reviewAction,
        severity: "Moderate",
        clinicalNotes: clinicalNotes.trim(),
        officerId: "officer-current"
      });

      // 2. Log immutable audit event
      logAuditEvent({
        eventType: "OFFICER_DECISION_RECORDED",
        crop: selectedRecord.crop,
        disease: selectedRecord.predictedClass,
        officerAction: reviewAction,
        verifiedPathogen: targetPathogen,
        officerId: "officer-current",
        district: selectedRecord.district,
        reason: clinicalNotes.trim() || reviewAction,
      });

      // 3. Update local state
      const updatedCase = applyOfficerReviewAction(selectedRecord, {
        diagnosisId: selectedRecord.id,
        action: reviewAction,
        officerId: "officer-current",
        officerName: "Extension Officer",
        confirmedPathogen: targetPathogen,
        correctedPathogen: targetPathogen,
        unusableReason: reviewAction === "MARK_UNUSABLE" ? unusableReason : undefined,
        notes: clinicalNotes.trim(),
        timestamp: new Date().toISOString(),
      });

      setDiagnoses((prev) =>
        prev.map((r) => (r.id === selectedRecord.id ? updatedCase : r))
      );

      setAuditLogs(getAuditLogs({ limit: 50 }));

      showToast?.(isTa ? "அலுவலர் ஆய்வு முடிவு பதிவு செய்யப்பட்டது!" : "Officer decision recorded!", "success");
      setSelectedRecord(null);
      setVerifiedPathogen("");
      setClinicalNotes("");
    } catch (err) {
      console.error("Error saving officer action:", err);
      showToast?.(isTa ? "சேமிப்பதில் பிழை" : "Error saving officer decision", "error");
    } finally {
      setSubmittingLabel(false);
    }
  };

  const evidenceSummary = getRegistrySummary();
  const allEvidence = getAllEvidenceEntries();
  const allLanguages = getAllLanguageReviewEntries();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Header */}
      <div className="bg-emerald-800 text-white p-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-1.5 bg-emerald-700/60 rounded-full hover:bg-emerald-700 transition"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-bold text-base flex items-center gap-1.5">
                <ShieldCheck size={18} className="text-emerald-300" />
                {isTa ? "வேளாண் அலுவலர் கட்டுப்பாட்டகம்" : "Extension Officer Dashboard"}
              </h1>
              <p className="text-[11px] text-emerald-200">
                {isTa ? "கள நோய் கண்காணிப்பு & தரவு சரிபார்ப்பு" : "Field Pathology Triage & Ground Truth Validation"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRefreshing(true);
                loadData();
              }}
              disabled={refreshing}
              className="p-1.5 bg-emerald-700 rounded-lg text-emerald-100 hover:text-white"
              title={isTa ? "புதுப்பி" : "Refresh"}
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={activeTab === "audit" ? handleExportAuditCsv : handleExportCsv}
              className="flex items-center gap-1 bg-white text-emerald-900 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-emerald-50"
            >
              <Download size={14} />
              <span>{activeTab === "audit" ? "Audit CSV" : (isTa ? "CSV ஏற்றுமதி" : "Export CSV")}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-emerald-700/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "queue" ? "bg-white text-emerald-900" : "bg-emerald-700/60 text-emerald-100 hover:bg-emerald-700"
            }`}
          >
            <Stethoscope size={14} />
            <span>Priority Queue ({filteredSortedQueue.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("evidence")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "evidence" ? "bg-white text-emerald-900" : "bg-emerald-700/60 text-emerald-100 hover:bg-emerald-700"
            }`}
          >
            <Layers size={14} />
            <span>Crop Coverage ({allEvidence.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("languages")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "languages" ? "bg-white text-emerald-900" : "bg-emerald-700/60 text-emerald-100 hover:bg-emerald-700"
            }`}
          >
            <Languages size={14} />
            <span>Languages (23)</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "audit" ? "bg-white text-emerald-900" : "bg-emerald-700/60 text-emerald-100 hover:bg-emerald-700"
            }`}
          >
            <History size={14} />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 1: PRIORITY REVIEW QUEUE                             */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === "queue" && (
        <>
          {/* Extended Filters */}
          <div className="bg-white border-b border-gray-200 p-3 sticky top-[138px] z-20 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
              <Filter size={14} className="text-emerald-700" />
              <span>Multi-Dimensional Triage Filters</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Crop</label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 font-medium"
                >
                  <option value="All">All Crops</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Potato">Potato</option>
                  <option value="Pepper">Chilli / Pepper</option>
                  <option value="Corn">Maize / Corn</option>
                  <option value="Paddy">Paddy (Candidate)</option>
                  <option value="Cotton">Cotton</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-0.5">District</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 font-medium"
                >
                  <option value="All">All Districts</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Dindigul">Dindigul</option>
                  <option value="Thanjavur">Thanjavur</option>
                  <option value="Madurai">Madurai</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Evidence Level</label>
                <select
                  value={selectedEvidence}
                  onChange={(e) => setSelectedEvidence(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 font-medium"
                >
                  <option value="All">All Levels</option>
                  <option value="FIELD_VALIDATED">Field Validated</option>
                  <option value="LAB_ONLY">Lab Only</option>
                  <option value="UNSUPPORTED">Unsupported</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Uncertainty</label>
                <select
                  value={selectedUncertainty}
                  onChange={(e) => setSelectedUncertainty(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 font-medium"
                >
                  <option value="All">All Uncertainty</option>
                  <option value="HIGH">High (&gt;60%)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Tier</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 font-medium"
                >
                  <option value="All">All Tiers</option>
                  <option value="TIER_1_CONFIDENT">Tier 1</option>
                  <option value="TIER_2_MODERATE">Tier 2</option>
                  <option value="TIER_3_INCONCLUSIVE">Tier 3 (Referral)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Farmer Verdict</label>
                <select
                  value={selectedVerdict}
                  onChange={(e) => setSelectedVerdict(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 font-medium"
                >
                  <option value="All">All Verdicts</option>
                  <option value="YES">YES</option>
                  <option value="NO">NO (Disagreement)</option>
                  <option value="NOT_SURE">NOT SURE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Queue List */}
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-2" size={28} />
                <p className="text-xs text-gray-500">Loading prioritized cases...</p>
              </div>
            ) : filteredSortedQueue.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <HelpCircle size={32} className="text-gray-400 mx-auto mb-2" />
                <h3 className="font-bold text-gray-800 text-sm">No Matching Review Cases</h3>
                <p className="text-xs text-gray-500 mt-1">Try broadening your filter criteria above.</p>
              </div>
            ) : (
              filteredSortedQueue.map((rec) => {
                const evidence = getEvidenceLevel(rec.predictedClass, rec.crop);
                const priority = rec.priorityScore || 0;

                return (
                  <div 
                    key={rec.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-xs p-3.5 transition hover:border-emerald-300"
                  >
                    {/* Header: ID, Priority, Date */}
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-700">ID: {rec.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          priority >= 0.70 ? "bg-rose-100 text-rose-800 border border-rose-300" :
                          priority >= 0.45 ? "bg-amber-100 text-amber-800 border border-amber-300" :
                          "bg-emerald-100 text-emerald-800"
                        }`}>
                          PRIORITY: {(priority * 100).toFixed(0)}%
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {new Date(rec.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>

                    {/* Metadata & Indicators */}
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                          <span>{rec.crop} — {rec.predictedClass.replace(/___/g, " - ")}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Location: {rec.village ? `${rec.village}, ` : ""}{rec.district} • Farmer: {rec.farmerName || "Anonymous"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono">
                          Conf: {((rec.calibratedConfidence || 0) * 100).toFixed(1)}%
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                          Uncertainty: {((rec.uncertaintyScore || 0) * 100).toFixed(0)}%
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          evidence === "FIELD_VALIDATED" ? "bg-emerald-100 text-emerald-800" :
                          evidence === "LAB_ONLY" ? "bg-amber-100 text-amber-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {evidence}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          rec.farmerVerdict === "YES" ? "bg-emerald-50 text-emerald-700" :
                          rec.farmerVerdict === "NO" ? "bg-rose-50 text-rose-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          Verdict: {rec.farmerVerdict || "Unanswered"}
                        </span>
                      </div>
                    </div>

                    {/* Officer Status / Action Row */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      {rec.expertLabel ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span className="font-bold">Verified: {rec.expertLabel}</span>
                          {rec.expertNotes && <span className="text-gray-500 text-[11px]">({rec.expertNotes})</span>}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-700 flex items-center gap-1">
                          <AlertCircle size={13} />
                          Pending Officer Review
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setVerifiedPathogen(rec.predictedClass);
                          setClinicalNotes(rec.expertNotes || "");
                          setReviewAction("CONFIRM_DIAGNOSIS");
                        }}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition"
                      >
                        {rec.expertLabel ? "Update Action" : "Review Case"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 2: CROP COVERAGE & EVIDENCE REGISTRY                  */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === "evidence" && (
        <div className="p-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-3 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-500 block">Total Diseases</span>
              <span className="text-lg font-black text-gray-800">{evidenceSummary.total}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-700 block">Field Validated</span>
              <span className="text-lg font-black text-emerald-700">{evidenceSummary.fieldValidated} (0%)</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200">
              <span className="text-[10px] text-amber-800 block">Lab Only (PV)</span>
              <span className="text-lg font-black text-amber-800">{evidenceSummary.labOnly}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-rose-200">
              <span className="text-[10px] text-rose-800 block">Unsupported</span>
              <span className="text-lg font-black text-rose-800">{evidenceSummary.unsupported}</span>
            </div>
          </div>

          {/* Registry Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-800">
              Official Pathology Coverage Registry (src/data/cropEvidenceRegistry.json)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-600 text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Crop</th>
                    <th className="p-2.5">Pathology Class</th>
                    <th className="p-2.5">Evidence Level</th>
                    <th className="p-2.5">Max Tier</th>
                    <th className="p-2.5">Dataset</th>
                    <th className="p-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allEvidence.map((e, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2.5 font-bold text-gray-800">{e.crop}</td>
                      <td className="p-2.5 font-mono text-[11px] text-gray-700">{e.disease}</td>
                      <td className="p-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          e.evidenceLevel === "FIELD_VALIDATED" ? "bg-emerald-100 text-emerald-800" :
                          e.evidenceLevel === "LAB_ONLY" ? "bg-amber-100 text-amber-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {e.evidenceLevel}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-gray-600">{e.allowedAdviceTier}</td>
                      <td className="p-2.5 text-gray-500 text-[11px]">{e.trainingDataset}</td>
                      <td className="p-2.5 text-gray-500 text-[11px] max-w-xs truncate">{e.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 3: LANGUAGE SAFETY STATUS                             */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === "languages" && (
        <div className="p-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
            <span className="font-bold block mb-1">Language Safety Mandate:</span>
            Chemical dosages and waiting periods are strictly displayed only in Human-Verified languages (English & Tamil).
            All other Indian languages automatically fallback to English/Tamil with visible warnings.
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-800">
              Language Review Status Registry (23 Scheduled Languages)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-600 text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Code</th>
                    <th className="p-2.5">Language</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Safety Verified</th>
                    <th className="p-2.5">Reviewer</th>
                    <th className="p-2.5">Fallback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allLanguages.map((l) => (
                    <tr key={l.languageCode} className="hover:bg-gray-50">
                      <td className="p-2.5 font-mono text-gray-600">{l.languageCode}</td>
                      <td className="p-2.5 font-bold text-gray-800">{l.languageName}</td>
                      <td className="p-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          l.translationStatus === "HUMAN_VERIFIED" ? "bg-emerald-100 text-emerald-800" :
                          l.translationStatus === "PARTIALLY_VERIFIED" ? "bg-amber-100 text-amber-800" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {l.translationStatus}
                        </span>
                      </td>
                      <td className="p-2.5">
                        {l.safetyContentVerified ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 size={12} /> Approved
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold flex items-center gap-1 w-fit">
                            <XCircle size={12} /> Unverified (English Fallback)
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-gray-500 text-[11px]">{l.reviewer || "None (Machine Draft)"}</td>
                      <td className="p-2.5 font-mono text-gray-600 text-[11px]">{l.fallbackLanguage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 4: ADVISORY AUDIT LOGS                                */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === "audit" && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Immutable Decision & Referral Audit Trail</span>
            <button
              onClick={handleExportAuditCsv}
              className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline"
            >
              <Download size={13} /> Download Audit CSV
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-800">
              Audit Event Log ({auditLogs.length} Events)
            </div>
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No audit events logged yet. Advisory actions and officer reviews will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">Event</th>
                      <th className="p-2.5">Crop</th>
                      <th className="p-2.5">Disease / Action</th>
                      <th className="p-2.5">Reason / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="p-2.5 font-mono text-[11px] text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="p-2.5 font-bold text-gray-700">
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-[10px]">
                            {log.eventType}
                          </span>
                        </td>
                        <td className="p-2.5 text-gray-800 font-medium">{log.crop || "—"}</td>
                        <td className="p-2.5 text-gray-700 font-mono text-[11px]">
                          {log.verifiedPathogen || log.officerAction || log.disease || "—"}
                        </td>
                        <td className="p-2.5 text-gray-500 text-[11px] max-w-xs truncate">{log.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* OFFICER ACTION MODAL                                      */}
      {/* ───────────────────────────────────────────────────────── */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-gray-900">Officer Ground-Truth Review</h3>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs bg-gray-50 p-2.5 rounded-lg space-y-1">
              <div><span className="text-gray-500">Specimen ID:</span> <span className="font-mono font-bold">{selectedRecord.id}</span></div>
              <div><span className="text-gray-500">Crop:</span> <span className="font-bold">{selectedRecord.crop}</span></div>
              <div><span className="text-gray-500">Model Predicted:</span> <span className="font-mono">{selectedRecord.predictedClass}</span></div>
              <div><span className="text-gray-500">Farmer Weak Verdict:</span> <span className="font-bold">{selectedRecord.farmerVerdict || "Unanswered"}</span></div>
            </div>

            <form onSubmit={handleSaveOfficerAction} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Officer Action</label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value as OfficerReviewActionType)}
                  className="w-full border rounded-lg p-2 bg-white"
                >
                  <option value="CONFIRM_DIAGNOSIS">Confirm Diagnosis</option>
                  <option value="CORRECT_DIAGNOSIS">Correct Diagnosis (Specify Pathogen)</option>
                  <option value="MARK_UNUSABLE">Mark Image Unusable (Optical Quality / Non-Plant)</option>
                  <option value="MARK_NEEDS_INFO">Needs More Information / Re-Scan</option>
                </select>
              </div>

              {(reviewAction === "CONFIRM_DIAGNOSIS" || reviewAction === "CORRECT_DIAGNOSIS") && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {reviewAction === "CONFIRM_DIAGNOSIS" ? "Confirmed Pathogen" : "Corrected Pathogen Name"}
                  </label>
                  <input
                    type="text"
                    value={verifiedPathogen}
                    onChange={(e) => setVerifiedPathogen(e.target.value)}
                    placeholder="e.g. Alternaria solani"
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              )}

              {reviewAction === "MARK_UNUSABLE" && (
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Unusable Reason</label>
                  <select
                    value={unusableReason}
                    onChange={(e) => setUnusableReason(e.target.value)}
                    className="w-full border rounded-lg p-2 bg-white"
                  >
                    <option value="Image optical blur / low lighting">Image optical blur / low lighting</option>
                    <option value="Non-foliage background clutter">Non-foliage background clutter</option>
                    <option value="Specimen too degraded to distinguish">Specimen too degraded to distinguish</option>
                    <option value="Mixed weed infestation">Mixed weed infestation</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1">Clinical Notes & Justification</label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Note lesion characteristics, spore patterns, or field history..."
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="flex-1 py-2.5 rounded-xl border text-gray-700 font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLabel}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  {submittingLabel ? "Recording..." : "Save Verdict"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
