// THINAI Extension-Officer Dashboard Screen (Phase 4)
// Allows Agricultural Extension Officers (AAO/KVK) to review recent field diagnoses,
// inspect crowdsourced weak farmer verdicts, submit expert ground-truth labels,
// and export analysis-ready CSVs within Firebase Spark free tier quotas.

import React, { useState, useEffect } from "react";
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
  Info
} from "lucide-react";
import { 
  FieldDiagnosisRecord, 
  fetchOfficerDiagnoses, 
  submitExpertLabel, 
  exportExpertLabelsToCsv 
} from "../../services/officerService";

interface OfficerDashboardScreenProps {
  onBack: () => void;
  language?: string;
  showToast?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function OfficerDashboardScreen({
  onBack,
  language = "English",
  showToast
}: OfficerDashboardScreenProps) {
  const isTa = language === "Tamil";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [diagnoses, setDiagnoses] = useState<FieldDiagnosisRecord[]>([]);
  
  // Filters
  const [selectedCrop, setSelectedCrop] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedTier, setSelectedTier] = useState("All");
  const [selectedVerdict, setSelectedVerdict] = useState("All");

  // Expert Labeling Form Modal state
  const [selectedRecord, setSelectedRecord] = useState<FieldDiagnosisRecord | null>(null);
  const [expertPathogen, setExpertPathogen] = useState("");
  const [expertSeverity, setExpertSeverity] = useState<"Mild" | "Moderate" | "Severe">("Moderate");
  const [expertNotes, setExpertNotes] = useState("");
  const [submittingLabel, setSubmittingLabel] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchOfficerDiagnoses({
        crop: selectedCrop !== "All" ? selectedCrop : undefined,
        district: selectedDistrict !== "All" ? selectedDistrict : undefined,
        tier: selectedTier !== "All" ? selectedTier : undefined,
        verdict: selectedVerdict !== "All" ? selectedVerdict : undefined
      });
      setDiagnoses(data);
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

  const handleSaveExpertLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !expertPathogen.trim()) return;

    try {
      setSubmittingLabel(true);
      await submitExpertLabel({
        diagnosisId: selectedRecord.id,
        verifiedPathogen: expertPathogen.trim(),
        severity: expertSeverity,
        clinicalNotes: expertNotes.trim(),
        officerId: "officer-current"
      });

      // Update local state
      setDiagnoses((prev) =>
        prev.map((r) =>
          r.id === selectedRecord.id
            ? { ...r, expertLabel: expertPathogen.trim(), expertNotes: expertNotes.trim() }
            : r
        )
      );

      showToast?.(isTa ? "வல்லுநர் மதிப்பீடு சேமிக்கப்பட்டது!" : "Expert ground-truth label recorded!", "success");
      setSelectedRecord(null);
      setExpertPathogen("");
      setExpertNotes("");
    } catch (err) {
      console.error("Error saving expert label:", err);
      showToast?.(isTa ? "சேமிப்பதில் பிழை ஏற்பட்டது" : "Error saving expert label", "error");
    } finally {
      setSubmittingLabel(false);
    }
  };

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
              onClick={handleExportCsv}
              className="flex items-center gap-1 bg-white text-emerald-900 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-emerald-50"
            >
              <Download size={14} />
              <span>{isTa ? "CSV ஏற்றுமதி" : "Export CSV"}</span>
            </button>
          </div>
        </div>

        {/* Spark Read-Quota Notice */}
        <div className="mt-3 bg-emerald-900/60 border border-emerald-700/50 rounded-lg p-2 text-[10px] text-emerald-200 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Info size={13} className="text-emerald-400" />
            {isTa 
              ? "Firebase Spark இலவச வரம்பு: பக்கம் 25 பதிவுகளுக்கு வரம்பிடப்பட்டுள்ளது." 
              : "Firebase Spark Free Quota Guard: Query capped at 25 records (~25 reads)."}
          </span>
          <span className="font-mono font-bold text-emerald-300">
            {diagnoses.length} {isTa ? "பதிவுகள்" : "records"}
          </span>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white border-b border-gray-200 p-3 sticky top-[102px] z-20 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
          <Filter size={14} className="text-emerald-700" />
          <span>{isTa ? "வடிகட்டிகள் (Filters)" : "Record Filters"}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <label className="text-[10px] text-gray-500 font-medium block mb-0.5">{isTa ? "பயிர்" : "Crop"}</label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 font-medium"
            >
              <option value="All">{isTa ? "அனைத்து பயிர்கள்" : "All Crops"}</option>
              <option value="Tomato">Tomato (தக்காளி)</option>
              <option value="Potato">Potato (உருளை)</option>
              <option value="Pepper">Chilli / Pepper (மிளகாய்)</option>
              <option value="Paddy">Paddy (நெல் - Tier 3)</option>
              <option value="Cotton">Cotton (பருத்தி - Tier 3)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-medium block mb-0.5">{isTa ? "மாவட்டம்" : "District"}</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 font-medium"
            >
              <option value="All">{isTa ? "அனைத்து மாவட்டங்கள்" : "All Districts"}</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Dindigul">Dindigul</option>
              <option value="Thanjavur">Thanjavur</option>
              <option value="Madurai">Madurai</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-medium block mb-0.5">{isTa ? "அறிவுரை நிலை" : "Tier"}</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 font-medium"
            >
              <option value="All">{isTa ? "அனைத்து நிலைகள்" : "All Tiers"}</option>
              <option value="TIER_1_CONFIDENT">Tier 1: High (Chemical)</option>
              <option value="TIER_2_MODERATE">Tier 2: Cultural Only</option>
              <option value="TIER_3_INCONCLUSIVE">Tier 3: Inconclusive / Expert</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-medium block mb-0.5">{isTa ? "விவசாயி கருத்து" : "Farmer Verdict"}</label>
            <select
              value={selectedVerdict}
              onChange={(e) => setSelectedVerdict(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 font-medium"
            >
              <option value="All">{isTa ? "அனைத்து முடிவுகள்" : "All Verdicts"}</option>
              <option value="YES">YES (Agree)</option>
              <option value="NO">NO (Disagree)</option>
              <option value="NOT_SURE">NOT SURE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="animate-spin text-emerald-600 mx-auto mb-2" size={28} />
            <p className="text-xs text-gray-500">{isTa ? "பதிவுகள் ஏற்றப்படுகின்றன..." : "Loading field records..."}</p>
          </div>
        ) : diagnoses.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <HelpCircle size={32} className="text-gray-400 mx-auto mb-2" />
            <h3 className="font-bold text-gray-800 text-sm">{isTa ? "பதிவுகள் எதுவும் இல்லை" : "No Records Found"}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {isTa ? "தேர்ந்தெடுக்கப்பட்ட வடிகட்டிகளுக்கு பதிவுகள் கிடைக்கவில்லை." : "Try adjusting the filters above to inspect other crops or districts."}
            </p>
          </div>
        ) : (
          diagnoses.map((rec) => {
            const isTier1 = rec.tier === "TIER_1_CONFIDENT";
            const isTier2 = rec.tier === "TIER_2_MODERATE";

            return (
              <div 
                key={rec.id}
                className="bg-white rounded-xl border border-gray-200 shadow-xs p-3.5 transition hover:border-emerald-300"
              >
                {/* Header Row: Specimen ID & Date */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 pb-2 border-b border-gray-100">
                  <span className="font-mono font-bold text-gray-700">ID: {rec.id}</span>
                  <span>{new Date(rec.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>

                {/* Farmer & Location Info */}
                <div className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-800">{rec.farmerName}</span>
                    <span className="text-gray-500 text-[11px] block">
                      {rec.village ? `${rec.village}, ` : ""}{rec.district}
                    </span>
                  </div>

                  {/* Privacy Guarded Phone Display */}
                  <div className="text-right">
                    {rec.phoneConsent && rec.phone ? (
                      <span className="font-mono text-emerald-800 text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {rec.phone}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                        <Lock size={10} />
                        {isTa ? "எண் மறைக்கப்பட்டுள்ளது" : "Phone Withheld"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Weak Farmer Verdict Banner (Prominent Amber Pill) */}
                <div className="my-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-amber-700 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                        {isTa ? "விவசாயி கருத்து (சரிபார்க்கப்படாதது)" : "Weak Farmer Verdict (Unverified)"}
                      </span>
                      <span className="text-xs font-semibold text-gray-800">
                        {isTa ? "விவசாயி முடிவு: " : "Farmer Response: "}
                        <strong className={rec.farmerVerdict === "YES" ? "text-emerald-700" : rec.farmerVerdict === "NO" ? "text-rose-700" : "text-amber-700"}>
                          {rec.farmerVerdict || "NOT_SURE"}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-amber-200/60 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                    Noise $\eta \in [10\%, 25\%]$
                  </span>
                </div>

                {/* Model Prediction Details */}
                <div className="grid grid-cols-2 gap-2 text-xs py-1.5 bg-gray-50 rounded-lg p-2 my-2 border border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-500 block">{isTa ? "மாதிரி கணிப்பு" : "Model Prediction"}</span>
                    <span className="font-semibold text-gray-800">{rec.predictedClass.replace(/_/g, " ")}</span>
                    <span className="text-[10px] text-emerald-700 block font-bold">{rec.crop}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">{isTa ? "நம்பகத்தன்மை & நிலை" : "Confidence & Tier"}</span>
                    <span className="font-mono font-bold text-gray-800">
                      {(rec.calibratedConfidence * 100).toFixed(1)}% (T=1.28)
                    </span>
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                      isTier1 
                        ? "bg-emerald-100 text-emerald-800" 
                        : isTier2 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      {rec.tier}
                    </span>
                  </div>
                </div>

                {/* Ground Truth Status & Action Button */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  {rec.expertLabel ? (
                    <div className="text-xs">
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {isTa ? "வல்லுநர் சரிபார்ப்பு:" : "Expert Validated:"}
                      </span>
                      <span className="font-bold text-gray-900">{rec.expertLabel}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">
                      {isTa ? "வல்லுநர் ஆய்வு நிலுவையில் உள்ளது" : "Pending dual-agronomist review"}
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setSelectedRecord(rec);
                      setExpertPathogen(rec.expertLabel || "");
                      setExpertNotes(rec.expertNotes || "");
                    }}
                    className="flex items-center gap-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
                  >
                    <Stethoscope size={13} />
                    <span>{rec.expertLabel ? (isTa ? "மாற்று" : "Edit Label") : (isTa ? "வல்லுநர் மதிப்பீடு" : "Add Expert Label")}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expert Ground Truth Modal Dialog */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Stethoscope size={17} className="text-emerald-700" />
                {isTa ? "வல்லுநர் கள சரிபார்ப்பு" : "Expert Ground-Truth Validation"}
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpertLabel} className="space-y-3 mt-3 text-xs">
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <p className="text-[11px] text-gray-600">
                  <strong>{isTa ? "மாதிரி கணிப்பு: " : "Model Predicted: "}</strong>
                  {selectedRecord.predictedClass} ({(selectedRecord.calibratedConfidence * 100).toFixed(1)}%)
                </p>
                <p className="text-[11px] text-gray-600">
                  <strong>{isTa ? "விவசாயி கருத்து: " : "Farmer Weak Verdict: "}</strong>
                  <span className="font-bold text-amber-800">{selectedRecord.farmerVerdict || "NOT_SURE"}</span>
                </p>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {isTa ? "உண்மையான நோய் / குறியீடு (Verified Pathogen) *" : "Ground-Truth Pathogen / Class *"}
                </label>
                <input
                  type="text"
                  required
                  value={expertPathogen}
                  onChange={(e) => setExpertPathogen(e.target.value)}
                  placeholder="e.g. Alternaria solani (Early Blight)"
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {isTa ? "தீவிரம் (Severity Rating)" : "Severity Rating"}
                </label>
                <div className="flex gap-2">
                  {(["Mild", "Moderate", "Severe"] as const).map((sev) => (
                    <button
                      type="button"
                      key={sev}
                      onClick={() => setExpertSeverity(sev)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${
                        expertSeverity === sev 
                          ? "bg-emerald-700 text-white border-emerald-700" 
                          : "bg-gray-50 text-gray-700 border-gray-300"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {isTa ? "களக் குறிப்புகள் (Clinical Notes)" : "Clinical Inspection Notes"}
                </label>
                <textarea
                  rows={3}
                  value={expertNotes}
                  onChange={(e) => setExpertNotes(e.target.value)}
                  placeholder={isTa ? "இலைப்புள்ளி அமைவு, நிறமாற்றம், தண்டு கருகல் விபரம்..." : "Concentric rings confirmed on lower foliage, no sporulation on abaxial surface..."}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100"
                >
                  {isTa ? "ரத்து செய்" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submittingLabel || !expertPathogen.trim()}
                  className="flex-1 py-2 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 disabled:opacity-50"
                >
                  {submittingLabel ? (isTa ? "சேமிக்கிறது..." : "Saving...") : (isTa ? "சேமி" : "Save Ground Truth")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
