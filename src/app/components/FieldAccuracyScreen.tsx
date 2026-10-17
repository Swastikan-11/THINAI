// THINAI Field Accuracy & Calibration Drift Screen (Phase D)
// Displays crowd-sourced verdict statistics, Wilson 95% confidence intervals,
// verdict reliability diagram, calibration drift alert, and retraining candidates.

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  Database, 
  ShieldCheck, 
  TrendingUp,
  Layers,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { 
  getAllVerdicts, 
  evaluateFieldAccuracy, 
  FieldAccuracySummary, 
  MIN_VERDICTS_FOR_ESTIMATE 
} from "../../services/verdictService";
import { flushDexieSyncQueueToFirestore } from "../../services/firestoreSync";
import { FarmerVerdictRecord } from "../../services/db";

interface FieldAccuracyScreenProps {
  onBack: () => void;
  language?: string;
  showToast?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function FieldAccuracyScreen({
  onBack,
  language = "English",
  showToast
}: FieldAccuracyScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<FieldAccuracySummary | null>(null);
  const [rawVerdicts, setRawVerdicts] = useState<FarmerVerdictRecord[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const verdicts = await getAllVerdicts();
      setRawVerdicts(verdicts);
      const evaluated = evaluateFieldAccuracy(verdicts);
      setSummary(evaluated);
    } catch (err) {
      console.error("Failed to load field accuracy data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncNow = async () => {
    setRefreshing(true);
    try {
      const res = await flushDexieSyncQueueToFirestore();
      await loadData();
      if (showToast) {
        showToast(
          language === "Tamil"
            ? `தரவு புதுப்பிக்கப்பட்டது: ${res.synced} ஒத்திசைக்கப்பட்டது.`
            : `Sync complete: ${res.synced} verdicts pushed to cloud.`,
          "success"
        );
      }
    } catch (e) {
      console.warn("Manual sync error:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const isTa = language === "Tamil";

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-700 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-zinc-900 leading-tight">
              {isTa ? "கள மாதிரி துல்லிய கண்காணிப்பு" : "Field Accuracy & Drift Monitor"}
            </h1>
            <p className="text-[10px] text-zinc-500 font-medium">
              {isTa ? "விவசாயி சரிபார்ப்பு கள கண்காணிப்பு (மாதிரி ஆய்வு)" : "Farmer-Verdict Field Monitoring (Proposed Approach)"}
            </p>
          </div>
        </div>

        <button
          onClick={handleSyncNow}
          disabled={refreshing}
          className="p-1.5 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 flex items-center gap-1 text-xs active:scale-95 transition-all"
          title="Refresh & Sync"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-700" : ""}`} />
          <span className="hidden sm:inline font-bold text-[11px]">{isTa ? "புதுப்பி" : "Sync"}</span>
        </button>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {/* DATA SOURCE PROVENANCE BADGE */}
        <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-zinc-200 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold text-zinc-800">
              {isTa ? "தரவு ஆதாரம்:" : "Data Provenance:"}
            </span>
            <span className="text-zinc-600">
              {typeof navigator !== "undefined" && !navigator.onLine
                ? (isTa ? "உள்ளூர் சாதன சேமிப்பு (ஆஃப்லைன் - Dexie IndexedDB)" : "Local Device Storage (Offline - Dexie IndexedDB)")
                : (isTa ? "கிளவுட் ஃபயர்ஸ்டோர் & உள்ளூர் சேமிப்பு" : "Cloud Firestore & Local Storage")}
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
            typeof navigator !== "undefined" && !navigator.onLine
              ? "bg-amber-100 text-amber-800 border border-amber-300"
              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
          }`}>
            {typeof navigator !== "undefined" && !navigator.onLine ? "OFFLINE" : "SYNCED"}
          </span>
        </div>

        {/* NOISY WEAK LABELS MANDATORY NOTICE */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-extrabold text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{isTa ? "முக்கிய குறிப்பு: விவசாயி சரிபார்ப்புகள் பலவீனமான லேபிள்கள்" : "Methodological Note: Verdicts are Noisy Weak Labels"}</span>
          </div>
          <p className="text-[11px] text-zinc-700 leading-relaxed">
            {isTa
              ? "விவசாயிகளின் கள முடிவுகள் கூட்ட நெரிசலான அவதானிப்புகள் மற்றும் 'சத்தமான பலவீனமான லேபிள்களாக' (noisy weak labels) செயல்படுகின்றன. விவசாயிகள் ஊட்டச்சத்து குறைபாட்டை பூஞ்சை நோய் என தவறாகக் கருதலாம். எனவே, இந்த அளவீடுகள் களப் போக்குகள் மற்றும் அளவுத்திருத்த விலகலை மதிப்பிட மட்டுமே பயன்படுகிறது, ஆய்வக உண்மையை அல்ல."
              : "Farmer verdicts are crowd-sourced field observations and serve as noisy weak labels. Farmers may mistake physiological nutrient deficiencies for fungal leaf spots or vice versa. Therefore, verdict-based metrics estimate deployment trends and calibration drift, not ground-truth laboratory accuracy."}
          </p>
        </div>

        {/* 3 STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Total Verdicts */}
          <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              {isTa ? "மொத்த கள சரிபார்ப்புகள்" : "Field Verdicts"}
            </span>
            <div className="text-xl font-black text-zinc-900">
              {summary ? summary.totalVerdictsCount : 0}
            </div>
            <p className="text-[10px] text-zinc-500">
              {summary && summary.totalVerdictsCount < MIN_VERDICTS_FOR_ESTIMATE
                ? (isTa ? `குறைந்தது ${MIN_VERDICTS_FOR_ESTIMATE} சரிபார்ப்புகள் தேவை (${summary.totalVerdictsCount}/${MIN_VERDICTS_FOR_ESTIMATE})` : `Min ${MIN_VERDICTS_FOR_ESTIMATE} required for estimate (${summary.totalVerdictsCount}/${MIN_VERDICTS_FOR_ESTIMATE})`)
                : (isTa ? "செயலில் உள்ள கள தரவு" : "Active field dataset")}
            </p>
          </div>

          {/* Card 2: Retraining Candidates */}
          <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              {isTa ? "மறுபயிற்சி மாதிரிகள்" : "Retraining Candidates"}
            </span>
            <div className="text-xl font-black text-blue-700">
              {summary ? summary.retrainingCandidatesCount : 0}
            </div>
            <p className="text-[10px] text-zinc-500">
              {isTa ? "தவறான / தெளிவற்ற பதிவுகள் (ஆய்வுக்கு வரிசைப்படுத்தப்பட்டது)" : "Ambiguous or rejected cases queued for expert review"}
            </p>
          </div>

          {/* Card 3: Calibration Drift Status */}
          <div className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              {isTa ? "அளவுத்திருத்த நிலை" : "Calibration Status"}
            </span>
            <div>
              {summary?.driftDetected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertTriangle className="w-3 h-3" /> DRIFT DETECTED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3" /> STABLE CALIBRATION
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">
              Baseline ECE: {summary ? (summary.baselineEce * 100).toFixed(2) : "2.63"}% | Recent: {summary ? (summary.verdictEce * 100).toFixed(2) : "2.63"}%
            </p>
          </div>
        </div>

        {/* DRIFT ALERT BANNER (IF DETECTED) */}
        {summary?.driftDetected && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-1 shadow-xs">
            <div className="font-extrabold text-xs flex items-center gap-2 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{isTa ? "கள மாதிரி அளவுத்திருத்த விலகல் கண்டறியப்பட்டது!" : "Field Calibration Drift Detected (+5% ECE Threshold Crossed)"}</span>
            </div>
            <p className="text-[11px] text-rose-900/90 leading-relaxed">
              {isTa
                ? `சமீபத்திய கள பிழை (+${(summary.driftDelta * 100).toFixed(1)}%) பாதுகாப்பான வரம்பை விட அதிகமாக உள்ளது. நிழல் அல்லது கள விளக்குகள் காரணமாக மாடலின் கணிப்புகள் அதிக நம்பிக்கையுடன் இருக்கலாம். செயலில் உள்ள மறுபயிற்சி பரிந்துரைக்கப்படுகிறது.`
                : `Recent verdict calibration error rose by +${(summary.driftDelta * 100).toFixed(1)}% above baseline. Deployed predictions may be overconfident under field lighting. Retraining candidate queue export advised.`}
            </p>
          </div>
        )}

        {/* PER-CLASS VERDICT ACCURACY TABLE (WITH WILSON INTERVALS & NOT ENOUGH DATA GUARD) */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                {isTa ? "பயிர் வாரியான துல்லிய மதிப்பீடு (வில்சன் 95% இடைவெளி)" : "Per-Class Field Accuracy (Wilson 95% Intervals)"}
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-500">
              Min {MIN_VERDICTS_FOR_ESTIMATE} verdicts / class
            </span>
          </div>

          <div className="divide-y divide-zinc-100 text-xs">
            {summary && Object.keys(summary.classStats).length > 0 ? (
              Object.values(summary.classStats).map((stat) => (
                <div key={stat.className} className="p-3.5 space-y-2 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-zinc-900 text-xs">
                        {stat.className.replace(/___/g, " — ").replace(/_/g, " ")}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                        <span>Total: <strong>{stat.totalVerdicts}</strong></span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">Yes: {stat.yesCount}</span>
                        <span>•</span>
                        <span className="text-rose-700 font-bold">No: {stat.noCount}</span>
                        <span>•</span>
                        <span className="text-amber-700 font-bold">Not sure: {stat.notSureCount}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {stat.hasEnoughData ? (
                        <div>
                          <div className="text-base font-black text-emerald-800">
                            {stat.accuracy}%
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500">
                            95% CI: [{stat.wilsonLower}% - {stat.wilsonUpper}%]
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold border border-zinc-200">
                            {isTa ? "குறைந்த தரவு" : "Not enough data"}
                          </span>
                          <div className="text-[9px] text-zinc-400 mt-0.5 font-mono">
                            {stat.totalVerdicts}/{MIN_VERDICTS_FOR_ESTIMATE} verdicts
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar towards minimum threshold */}
                  {!stat.hasEnoughData && (
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (stat.totalVerdicts / MIN_VERDICTS_FOR_ESTIMATE) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-500 space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-xs font-semibold">
                  {isTa ? "இன்னும் கள சரிபார்ப்புகள் எதுவும் பதிவு செய்யப்படவில்லை." : "No field verdicts recorded yet."}
                </p>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  {isTa 
                    ? "பயிர் ஸ்கேன் செய்த பிறகு உங்கள் சரிபார்ப்பை (ஆம் / இல்லை / தெரியவில்லை) சமர்ப்பிக்கவும். அவை தானாகவே இங்கே ஒருங்கிணைக்கப்படும்." 
                    : "Diagnose a crop leaf and tap 'Yes', 'No', or 'Not Sure' to populate live deployment monitoring."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* VERDICT-BASED RELIABILITY DIAGRAM (CALIBRATION BINS) */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                {isTa ? "கள முடிவு நம்பகத்தன்மை வரைபடம்" : "Verdict-Based Reliability Diagram"}
              </h2>
            </div>
            <span className="text-[10px] text-zinc-500">
              Confidence Bins vs Observed Accuracy
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {summary?.reliabilityBins.map((bin) => (
              <div key={bin.binRange} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-800 text-[11px]">{bin.binRange}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {bin.sampleCount > 0 ? `${bin.sampleCount} verdicts` : "0 samples"}
                  </span>
                </div>

                {bin.sampleCount > 0 ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Mean Predicted Conf:</span>
                      <strong className="text-zinc-900 font-mono">{bin.avgPredictedConfidence}%</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Observed Field Accuracy:</span>
                      <strong className="text-emerald-700 font-mono">{bin.empiricalAccuracy}%</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-400 italic">
                    {isTa ? "இந்த நம்பிக்கை வரம்பில் தரவு இல்லை" : "No verdicts in this confidence range yet"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVE LEARNING CANDIDATES QUEUE */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-700" />
            {isTa ? "செயலில் உள்ள மறுபயிற்சி வரிசை (ஆக்டிவ் லேர்னிங்)" : "Active Retraining Queue & Expert Review"}
          </h2>
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            {isTa
              ? "விவசாயிகளால் 'இல்லை' அல்லது 'தெரியவில்லை' என குறிக்கப்பட்ட படங்கள் மற்றும் நிலை 3 தெளிவற்ற முடிவுகள் தானாகவே மறுபயிற்சி வரிசையில் சேர்க்கப்படுகின்றன. இவை வேளாண் விஞ்ஞானிகளால் சரிபார்க்கப்பட்டு அடுத்த தலைமுறை மாடலை செம்மைப்படுத்தப் பயன்படும்."
              : "Cases rejected by farmers ('No'), flagged as ambiguous ('Not Sure'), or categorized as Tier 3 are queued with photo hashes. Extension officers and agronomists can inspect these cases to produce high-value fine-tuning splits."}
          </p>
        </div>
      </div>
    </div>
  );
}
