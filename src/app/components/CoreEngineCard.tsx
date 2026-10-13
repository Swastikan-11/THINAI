import React from "react";
import { Cpu, ArrowRight, AlertTriangle, ShieldCheck, Activity, RefreshCw, SlidersHorizontal, Droplets, Thermometer, CloudRain, TrendingUp, Sparkles, HelpCircle } from "lucide-react";
import { DataBadge, DataStatus } from "./DataBadge";
import { DecisionEngineResult, DecisionInputs } from "../../services/decisionEngine";

interface CoreEngineCardProps {
  engineResult: DecisionEngineResult;
  inputs: DecisionInputs;
  weatherStatus: DataStatus;
  weatherSource: string;
  marketStatus: DataStatus;
  marketSource: string;
  isOfflineMode: boolean;
  onOpenWhatIfLab: () => void;
  onOpenARFIDrawer: () => void;
  onRefresh?: () => void;
  arfiScore?: number;
  arfiStability?: "STABLE" | "MODERATE" | "FRAGILE";
}

export function CoreEngineCard({
  engineResult,
  inputs,
  weatherStatus,
  weatherSource,
  marketStatus,
  marketSource,
  isOfflineMode,
  onOpenWhatIfLab,
  onOpenARFIDrawer,
  onRefresh,
  arfiScore = 68,
  arfiStability = "MODERATE"
}: CoreEngineCardProps) {
  const primary = engineResult.primaryRecommendation;
  const overallRisk = engineResult.riskAnalysis.overallRisk;

  const engineStateStatus: DataStatus = isOfflineMode 
    ? "OFFLINE" 
    : (weatherStatus === "CACHED" || marketStatus === "CACHED" ? "CACHED" : "LIVE");

  const getStabilityBadge = () => {
    switch (arfiStability) {
      case "STABLE":
        return { text: "STABLE", bg: "bg-emerald-100 text-emerald-800 border-emerald-300", desc: "Low sensitivity to rainfall/heat fluctuations" };
      case "FRAGILE":
        return { text: "FRAGILE", bg: "bg-rose-100 text-rose-800 border-rose-300", desc: "High sensitivity: Action alters under +/-15% rain" };
      case "MODERATE":
      default:
        return { text: "MODERATE", bg: "bg-amber-100 text-amber-800 border-amber-300", desc: "Moderate sensitivity to microclimate shifts" };
    }
  };

  const stabilityInfo = getStabilityBadge();

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-600/30 shadow-lg overflow-hidden my-4 transition-all">
      {/* 1. Header with Engine Identity & Live/Offline Status */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-wider uppercase">THINAI CORE ENGINE</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-200 border border-white/10 font-mono">v2.1</span>
              </div>
              <p className="text-[11px] text-emerald-200/80">Adaptive Agronomic Decision & Fragility Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DataBadge status={engineStateStatus} detail="Decision" />
            {onRefresh && (
              <button 
                onClick={onRefresh} 
                title="Recalculate Decision"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Farm Context Tagline */}
        <div className="flex items-center justify-between text-[11px] text-emerald-100/90 bg-emerald-950/60 rounded-lg px-3 py-1.5 border border-emerald-800/40">
          <span className="truncate">
            <strong className="text-white">{inputs.location || "Farm"}</strong> • {inputs.farmSize || "2.5"} Acres • <strong>{inputs.crop || "Paddy"}</strong> ({inputs.cropStage || "Vegetative"})
          </span>
          <span className="shrink-0 font-mono text-[10px] text-emerald-300/80">
            {new Date(engineResult.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 text-zinc-800">
        {/* 2. Farm Inputs Grid with Clear Provenance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Active Environmental & Agronomic Inputs
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">6 Factor Vector</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {/* Soil */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-zinc-500">Soil & Moisture</span>
                <DataBadge status="USER PROVIDED" size="sm" />
              </div>
              <div className="font-bold text-zinc-900">{inputs.soilType || "Clay Loam"}</div>
              <div className="text-[11px] text-emerald-700 font-semibold">{inputs.soilMoisture}% Saturation</div>
            </div>

            {/* Rainfall */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-zinc-500">Precipitation (48h)</span>
                <DataBadge status={weatherStatus} size="sm" />
              </div>
              <div className="font-bold text-zinc-900 flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                {inputs.rainfallExpected} mm expected
              </div>
              <div className="text-[10px] text-zinc-500 truncate" title={weatherSource}>{weatherSource}</div>
            </div>

            {/* Temperature & Humidity */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-zinc-500">Temp / Humidity</span>
                <DataBadge status={weatherStatus} size="sm" />
              </div>
              <div className="font-bold text-zinc-900 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                {inputs.temperature}°C • {inputs.humidity}% RH
              </div>
              <div className="text-[10px] text-zinc-500">Thermal Index</div>
            </div>

            {/* Market Price */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-zinc-500">Market Rate</span>
                <DataBadge status={marketStatus} size="sm" />
              </div>
              <div className="font-bold text-zinc-900 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                ₹{inputs.marketPrice || 2300} / q
              </div>
              <div className="text-[10px] text-zinc-500 truncate" title={marketSource}>{marketSource}</div>
            </div>

            {/* Crop Stage */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-zinc-500">Crop Stage</span>
                <DataBadge status="USER PROVIDED" size="sm" />
              </div>
              <div className="font-bold text-zinc-900">{inputs.cropStage || "Vegetative"}</div>
              <div className="text-[10px] text-zinc-500">{inputs.cropVariety || "Standard Variety"}</div>
            </div>

            {/* Disease Observation */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-zinc-500">Health Observation</span>
                <DataBadge status={inputs.diseaseStatus ? "MODEL GENERATED" : "STATIC REFERENCE"} size="sm" />
              </div>
              <div className="font-bold text-zinc-900 truncate">{inputs.diseaseStatus || "Healthy (No Blight)"}</div>
              <div className="text-[10px] text-zinc-500">Vision Scanner Status</div>
            </div>
          </div>
        </div>

        {/* 3. Engine Risk Assessment Summary */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Tri-Pillar Risk Synthesis
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              overallRisk === "High" ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}>
              Overall: {overallRisk} Risk
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/80 border border-amber-100 rounded-lg p-1.5">
              <div className="text-[10px] text-zinc-500">Water Risk</div>
              <div className="font-bold text-amber-700">Moderate</div>
              <div className="text-[9px] text-zinc-500">High Saturation</div>
            </div>
            <div className="bg-white/80 border border-amber-100 rounded-lg p-1.5">
              <div className="text-[10px] text-zinc-500">Disease Risk</div>
              <div className="font-bold text-rose-600">High</div>
              <div className="text-[9px] text-zinc-500">Spore Proliferation</div>
            </div>
            <div className="bg-white/80 border border-amber-100 rounded-lg p-1.5">
              <div className="text-[10px] text-zinc-500">Market Risk</div>
              <div className="font-bold text-emerald-700">Low</div>
              <div className="text-[9px] text-zinc-500">Above MSP</div>
            </div>
          </div>
        </div>

        {/* 4. NEXT-BEST ACTION (Primary Core Recommendation) */}
        <div className="bg-linear-to-br from-emerald-50 via-teal-50 to-emerald-100/50 border-2 border-emerald-500/40 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              NEXT-BEST ACTION
            </span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
              {primary.confidence}% Confidence
            </span>
          </div>

          <h4 className="text-base font-extrabold text-zinc-900 mb-1 leading-snug">
            {primary.action || primary.title}
          </h4>

          {/* Time Window */}
          <div className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1">
            <span>Execution Window:</span>
            <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-mono text-emerald-900">{primary.when}</span>
          </div>

          {/* WHY EXPLANATION */}
          <div className="bg-white/90 border border-emerald-200 rounded-lg p-2.5 text-xs text-zinc-700 space-y-1 mb-3">
            <div className="font-bold text-emerald-950 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              Agronomic Rationale (Why?):
            </div>
            <p className="text-zinc-800 leading-relaxed">{primary.why}</p>
            
            {primary.supportingFactors && primary.supportingFactors.length > 0 && (
              <div className="pt-1.5 border-t border-emerald-100 flex flex-wrap gap-1">
                {primary.supportingFactors.map((factor, idx) => (
                  <span key={idx} className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                    ✓ {factor}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Risk Averted & Alternative Recommendation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200/60">
            <div className="bg-white/70 p-2 rounded-lg border border-emerald-100">
              <span className="text-[10px] font-bold text-zinc-500 uppercase block">Risk Averted</span>
              <span className="text-zinc-800 font-medium">{primary.risk || "Prevents root asphyxiation & fungal spread"}</span>
            </div>
            <div className="bg-white/70 p-2 rounded-lg border border-emerald-100">
              <span className="text-[10px] font-bold text-zinc-500 uppercase block">Alternative Backup Action</span>
              <span className="text-zinc-800 font-medium">{primary.alternativeAction || "Apply foliar potassium spray (1%)"}</span>
            </div>
          </div>
        </div>

        {/* 5. ARFI Stability Indicator & What-If Stress Testing Bridge */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide">ARFI STABILITY:</span>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${stabilityInfo.bg}`}>
                {arfiScore}/100 • {stabilityInfo.text}
              </span>
            </div>
            <p className="text-[11px] text-zinc-600">{stabilityInfo.desc}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenARFIDrawer}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition-colors flex items-center gap-1"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-700" />
              ARFI Breakdown
            </button>
            <button
              onClick={onOpenWhatIfLab}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              What-If Stress Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
