import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Sliders, RefreshCw, CloudRain, Thermometer,
  TrendingDown, DollarSign, ShieldAlert, ShieldCheck,
  AlertCircle, Sparkles, Sprout, CheckCircle2, ChevronRight,
  TrendingUp, BarChart2, Layers
} from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { LocalField } from "../../services/db";
import { ARFI_CONFIG } from "../../config/arfiConfig";

interface WhatIfLabScreenProps {
  onBack: () => void;
  activeField: LocalField | null;
  farmerCrop?: string;
  farmerArea?: number;
}

interface WhatIfSimResult {
  original_crop: string;
  modified_crop: string;
  arfi_before: number;
  arfi_after: number;
  fragility_status: string;
  profit_impact_rs: number;
  risk_impact_summary: string;
  recommendation_changed: boolean;
  reason_changed: string;
}

export function WhatIfLabScreen({
  onBack,
  activeField,
  farmerCrop = "Paddy (Rice)",
  farmerArea = 2.0
}: WhatIfLabScreenProps) {
  // Slider states
  const [rainDelta, setRainDelta] = useState<number>(0);
  const [tempDelta, setTempDelta] = useState<number>(0);
  const [marketDelta, setMarketDelta] = useState<number>(0);
  const [costDelta, setCostDelta] = useState<number>(0);

  // Simulation outcome state
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<WhatIfSimResult>({
    original_crop: activeField?.currentCrop || farmerCrop,
    modified_crop: activeField?.currentCrop || farmerCrop,
    arfi_before: 0.28,
    arfi_after: 0.28,
    fragility_status: "Stable / Low Fragility",
    profit_impact_rs: 0,
    risk_impact_summary: "Baseline conditions. Optimal agronomic margin expected under current forecasts.",
    recommendation_changed: false,
    reason_changed: "Current crop choice remains robust across typical seasonal variations."
  });

  // Run simulation whenever sliders change (with 350ms debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 350);
    return () => clearTimeout(timer);
  }, [rainDelta, tempDelta, marketDelta, costDelta]);

  const runSimulation = async () => {
    setLoading(true);
    const fieldId = activeField?.id || "field-default";
    try {
      const resp = await apiClient.simulateWhatIf({
        field_id: fieldId,
        rainfall_delta_percent: rainDelta,
        temperature_delta_celsius: tempDelta,
        market_price_delta_percent: marketDelta,
        input_cost_delta_percent: costDelta
      });
      if (resp) {
        setResult(resp);
      }
    } catch (err) {
      // Local fallback calculation if offline or server is starting
      calculateLocalWhatIf();
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalWhatIf = () => {
    const baseArfi = 0.28;
    // Rainfall penalty
    const rainPenalty = Math.abs(rainDelta) * 0.005;
    // Temp penalty
    const tempPenalty = Math.max(0, tempDelta) * 0.06;
    // Market & Cost penalty
    const economicPenalty = (Math.max(0, -marketDelta) * 0.004) + (Math.max(0, costDelta) * 0.004);
    
    const arfiAfter = Math.min(0.95, Math.max(0.12, baseArfi + rainPenalty + tempPenalty + economicPenalty));
    
    let fragility = "Stable / Low Fragility";
    if (arfiAfter > 0.65) fragility = "Highly Fragile";
    else if (arfiAfter > 0.35) fragility = "Moderate Fragility";

    // Profit impact calculation
    const baseProfit = 32000 * farmerArea;
    const yieldImpactPct = (rainDelta * 0.4) - (tempDelta * 4);
    const priceImpactPct = marketDelta;
    const costImpactPct = costDelta * 0.3;
    const totalDeltaPct = (yieldImpactPct + priceImpactPct - costImpactPct) / 100;
    const profitImpact = Math.round(baseProfit * totalDeltaPct);

    let recChanged = false;
    let modCrop = activeField?.currentCrop || farmerCrop;
    let reason = "Current crop remains the highest-margin resilient option.";

    if (rainDelta <= -30 && tempDelta >= 2.5) {
      recChanged = true;
      modCrop = "Pearl Millet (Bajra)";
      reason = "Severe moisture deficit detected. Drought-hardy C4 millet minimizes irrigation failure risks.";
    } else if (rainDelta >= 35) {
      recChanged = true;
      modCrop = "Paddy (Flood-Tolerant Swarna-Sub1)";
      reason = "High monsoon inundation risk. Submergence-tolerant variety recommended.";
    }

    setResult({
      original_crop: activeField?.currentCrop || farmerCrop,
      modified_crop: modCrop,
      arfi_before: baseArfi,
      arfi_after: parseFloat(arfiAfter.toFixed(2)),
      fragility_status: fragility,
      profit_impact_rs: profitImpact,
      risk_impact_summary:
        arfiAfter > 0.6
          ? "High fragility alert: severe climate/cost shock reduces net margins and increases harvest uncertainty."
          : arfiAfter > 0.35
          ? "Moderate sensitivity: crop choice is stable but profit margins contract under negative price shocks."
          : "Resilient trajectory: recommendation maintains high stability with manageable risk bounds.",
      recommendation_changed: recChanged,
      reason_changed: reason
    });
  };

  const handleReset = () => {
    setRainDelta(0);
    setTempDelta(0);
    setMarketDelta(0);
    setCostDelta(0);
  };

  const applyPreset = (preset: { rain: number; temp: number; market: number; cost: number }) => {
    setRainDelta(preset.rain);
    setTempDelta(preset.temp);
    setMarketDelta(preset.market);
    setCostDelta(preset.cost);
  };

  const arfiDelta = result.arfi_after - result.arfi_before;
  const isHealthy = result.arfi_after < 0.35;
  const isFragile = result.arfi_after > 0.65;

  return (
    <div className="flex flex-col h-full bg-[#F4F7F4] select-none text-gray-800">
      
      {/* Header */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white/20 active:scale-90 flex items-center justify-center transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-base">What-If Simulation Lab</h1>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white">
                Live
              </span>
            </div>
            <p className="text-[10px] text-white/80">
              Plot: {activeField?.name || "Main Plot"} • {activeField?.currentCrop || farmerCrop}
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
          title="Reset to 0% Baseline"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 pb-8" style={{ scrollbarWidth: "none" }}>
        
        {/* Preset Chips */}
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
            Quick Stress Presets
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => applyPreset({ rain: 0, temp: 0, market: 0, cost: 0 })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                rainDelta === 0 && tempDelta === 0 && marketDelta === 0 && costDelta === 0
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Baseline (Normal)
            </button>
            <button
              onClick={() => applyPreset({ rain: -35, temp: 3.0, market: 0, cost: 10 })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                rainDelta === -35 && tempDelta === 3.0
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Severe Drought
            </button>
            <button
              onClick={() => applyPreset({ rain: 35, temp: -1.0, market: -10, cost: 0 })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                rainDelta === 35
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Excess Monsoon
            </button>
            <button
              onClick={() => applyPreset({ rain: 0, temp: 0, market: -30, cost: 10 })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                marketDelta === -30
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Market Crash (-30%)
            </button>
            <button
              onClick={() => applyPreset({ rain: -20, temp: 3.5, market: -15, cost: 20 })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all ${
                tempDelta === 3.5 && costDelta === 20
                  ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Heatwave & Inflation
            </button>
          </div>
        </div>

        {/* Sliders Container Card */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Agro-Climatic & Market Shocks
            </span>
            {loading && (
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" /> Simulating...
              </span>
            )}
          </div>

          {/* Slider 1: Rainfall Deviation */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-bold flex items-center gap-1.5 text-gray-700">
                <CloudRain size={15} className="text-blue-600" />
                Rainfall Deviation
              </span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                rainDelta === 0 ? "bg-gray-100 text-gray-600" : rainDelta > 0 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
              }`}>
                {rainDelta > 0 ? `+${rainDelta}%` : `${rainDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              step="5"
              value={rainDelta}
              onChange={(e) => setRainDelta(parseInt(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-400 mt-0.5 font-medium">
              <span>-40% (Drought)</span>
              <span>0% (Normal)</span>
              <span>+40% (Flood)</span>
            </div>
          </div>

          {/* Slider 2: Temperature Shift */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-bold flex items-center gap-1.5 text-gray-700">
                <Thermometer size={15} className="text-orange-500" />
                Temperature Shift
              </span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                tempDelta === 0 ? "bg-gray-100 text-gray-600" : tempDelta > 0 ? "bg-rose-50 text-rose-700" : "bg-cyan-50 text-cyan-700"
              }`}>
                {tempDelta > 0 ? `+${tempDelta}°C` : `${tempDelta}°C`}
              </span>
            </div>
            <input
              type="range"
              min="-2"
              max="5"
              step="0.5"
              value={tempDelta}
              onChange={(e) => setTempDelta(parseFloat(e.target.value))}
              className="w-full accent-orange-500 h-2 bg-gray-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-400 mt-0.5 font-medium">
              <span>-2.0°C (Cooling)</span>
              <span>0.0°C</span>
              <span>+5.0°C (Extreme Heat)</span>
            </div>
          </div>

          {/* Slider 3: Market Farmgate Price Shock */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-bold flex items-center gap-1.5 text-gray-700">
                <TrendingDown size={15} className="text-emerald-600" />
                Farmgate Price Shock
              </span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                marketDelta === 0 ? "bg-gray-100 text-gray-600" : marketDelta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}>
                {marketDelta > 0 ? `+${marketDelta}%` : `${marketDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="5"
              value={marketDelta}
              onChange={(e) => setMarketDelta(parseInt(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-400 mt-0.5 font-medium">
              <span>-30% (Glut / Crash)</span>
              <span>0% (MSP Level)</span>
              <span>+30% (Demand Spike)</span>
            </div>
          </div>

          {/* Slider 4: Input Cost Inflation */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-bold flex items-center gap-1.5 text-gray-700">
                <DollarSign size={15} className="text-amber-600" />
                Input Cost Inflation
              </span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                costDelta === 0 ? "bg-gray-100 text-gray-600" : costDelta > 0 ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-700"
              }`}>
                {costDelta > 0 ? `+${costDelta}%` : `${costDelta}%`}
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="30"
              step="5"
              value={costDelta}
              onChange={(e) => setCostDelta(parseInt(e.target.value))}
              className="w-full accent-amber-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-gray-400 mt-0.5 font-medium">
              <span>-10% (Subsidy)</span>
              <span>0%</span>
              <span>+30% (Fuel/Fertilizer Surge)</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Outcomes */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200 flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
              Resilience & Economic Impact
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              isHealthy ? "bg-emerald-50 text-emerald-800 border-emerald-300" : isFragile ? "bg-rose-50 text-rose-800 border-rose-300" : "bg-amber-50 text-amber-800 border-amber-300"
            }`}>
              {result.fragility_status}
            </span>
          </div>

          {/* ARFI Shift Meter */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-gray-500 font-semibold block">ARFI Fragility Score</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {ARFI_CONFIG.labelEn}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg font-bold text-gray-500">{(result.arfi_before * 100).toFixed(0)}%</span>
                <span className="text-xs text-gray-400">➔</span>
                <span className={`text-2xl font-black ${isHealthy ? "text-emerald-700" : isFragile ? "text-rose-700" : "text-amber-700"}`}>
                  {(result.arfi_after * 100).toFixed(0)}%
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                  arfiDelta <= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}>
                  {arfiDelta >= 0 ? `+${(arfiDelta * 100).toFixed(0)}%` : `${(arfiDelta * 100).toFixed(0)}%`}
                </span>
              </div>
            </div>

            {/* Visual Gauge Bar */}
            <div className="w-24 flex flex-col items-end">
              <span className="text-[9px] text-gray-400 mb-1">Tolerance Zone</span>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
                <div className="w-1/3 bg-emerald-400 h-full" />
                <div className="w-1/3 bg-amber-400 h-full" />
                <div className="w-1/3 bg-rose-400 h-full" />
              </div>
              <span className="text-[9px] font-bold text-gray-600 mt-1">
                {result.arfi_after < 0.35 ? "STABLE" : result.arfi_after < 0.65 ? "CAUTION" : "FRAGILE"}
              </span>
            </div>
          </div>

          {/* Profit Impact */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] text-gray-500 font-semibold block">Projected Profit Impact</span>
              <p className={`text-base font-black mt-0.5 ${
                result.profit_impact_rs >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}>
                {result.profit_impact_rs >= 0 ? `+₹${result.profit_impact_rs.toLocaleString()}` : `-₹${Math.abs(result.profit_impact_rs).toLocaleString()}`}
              </p>
              <span className="text-[9px] text-gray-400 block mt-0.5">Across {farmerArea} acres plot</span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] text-gray-500 font-semibold block">Crop Adaptation</span>
              <p className="text-xs font-bold text-gray-800 mt-1 truncate">
                {result.modified_crop}
              </p>
              <span className={`text-[9px] font-semibold block mt-0.5 ${
                result.recommendation_changed ? "text-amber-700" : "text-emerald-700"
              }`}>
                {result.recommendation_changed ? "⚠️ Switch Crop" : "✓ Retain Crop"}
              </span>
            </div>
          </div>

          {/* Reason & Risk Summary */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold mb-1">
              <Sparkles size={14} />
              <span>Algorithmic Insight</span>
            </div>
            <p className="text-[11px] text-gray-700 leading-relaxed mb-1.5">
              {result.risk_impact_summary}
            </p>
            {result.reason_changed && (
              <p className="text-[10px] text-emerald-800 font-medium bg-white/70 p-2 rounded-lg border border-emerald-200/50">
                {result.reason_changed}
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
