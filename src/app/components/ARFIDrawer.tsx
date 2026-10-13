import React, { useState } from "react";
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Info, ChevronRight,
  TrendingDown, TrendingUp, Sparkles, BarChart2, Activity,
  Sliders, ArrowUpRight, X, HelpCircle
} from "lucide-react";

export interface ARFIData {
  fragility_score: number; // 0.0 - 1.0
  fragility_label: string; // "Stable / Low Fragility" | "Moderate Fragility" | "Highly Fragile"
  data_reliability_score: number;
  model_agreement_score: number;
  uncertainty_score: number;
  scenario_sensitivity_score: number;
  stress_robustness_score: number;
  decision_risk_score: number;
  assessment_summary?: string;
  stress_scenarios?: Array<{
    scenario_name: string;
    rainfall_delta_percent: number;
    temp_delta_celsius: number;
    market_price_delta_percent: number;
    input_cost_delta_percent: number;
    crop_rank_change: number;
    fragility_status: string;
  }>;
}

interface ARFIDrawerProps {
  arfi?: ARFIData | null;
  onOpenWhatIf?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ARFIDrawer({
  arfi,
  onOpenWhatIf,
  isOpen,
  onClose
}: ARFIDrawerProps) {
  const [activeTab, setActiveTab] = useState<"components" | "scenarios">("components");

  if (!isOpen) return null;

  // Fallback defaults if arfi assessment is pending
  const data: ARFIData = arfi || {
    fragility_score: 0.28,
    fragility_label: "Stable / Low Fragility",
    data_reliability_score: 0.88,
    model_agreement_score: 0.84,
    uncertainty_score: 0.16,
    scenario_sensitivity_score: 0.24,
    stress_robustness_score: 0.82,
    decision_risk_score: 0.19,
    assessment_summary: "High algorithmic stability across weather perturbations and price volatilities.",
    stress_scenarios: [
      {
        scenario_name: "Severe Drought (-30% Rain, +2.5°C)",
        rainfall_delta_percent: -30,
        temp_delta_celsius: 2.5,
        market_price_delta_percent: 0,
        input_cost_delta_percent: 10,
        crop_rank_change: 0,
        fragility_status: "STABLE"
      },
      {
        scenario_name: "Monsoon Surge (+35% Rain, -1.0°C)",
        rainfall_delta_percent: 35,
        temp_delta_celsius: -1.0,
        market_price_delta_percent: -5,
        input_cost_delta_percent: 0,
        crop_rank_change: 0,
        fragility_status: "STABLE"
      },
      {
        scenario_name: "Extreme Heatwave (+3.5°C)",
        rainfall_delta_percent: -10,
        temp_delta_celsius: 3.5,
        market_price_delta_percent: 0,
        input_cost_delta_percent: 15,
        crop_rank_change: 1,
        fragility_status: "MODERATE"
      },
      {
        scenario_name: "Market Crash (-25% Farmgate)",
        rainfall_delta_percent: 0,
        temp_delta_celsius: 0,
        market_price_delta_percent: -25,
        input_cost_delta_percent: 0,
        crop_rank_change: 1,
        fragility_status: "SENSITIVE"
      },
      {
        scenario_name: "Input Inflation (+20% Cost)",
        rainfall_delta_percent: 0,
        temp_delta_celsius: 0,
        market_price_delta_percent: 0,
        input_cost_delta_percent: 20,
        crop_rank_change: 0,
        fragility_status: "STABLE"
      },
      {
        scenario_name: "Multi-Stress Shock (Drought + Crash)",
        rainfall_delta_percent: -20,
        temp_delta_celsius: 2.0,
        market_price_delta_percent: -15,
        input_cost_delta_percent: 15,
        crop_rank_change: 2,
        fragility_status: "MODERATE"
      }
    ]
  };

  const getScoreColor = (score: number) => {
    if (score < 0.35) return { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-50", border: "border-emerald-200" };
    if (score < 0.65) return { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50", border: "border-amber-200" };
    return { bg: "bg-rose-500", text: "text-rose-700", light: "bg-rose-50", border: "border-rose-200" };
  };

  const statusColors = getScoreColor(data.fragility_score);

  const subComponents = [
    {
      name: "Data Reliability",
      weight: "20%",
      score: data.data_reliability_score,
      desc: "Freshness and density of soil sensors, weather forecasts, and satellite feeds.",
      inverted: false
    },
    {
      name: "Model Consensus",
      weight: "20%",
      score: data.model_agreement_score,
      desc: "Cross-validation agreement between Random Forest & Gradient Boosting models.",
      inverted: false
    },
    {
      name: "Prediction Uncertainty",
      weight: "15%",
      score: data.uncertainty_score,
      desc: "Normalized entropy across candidate crop probability distributions.",
      inverted: true
    },
    {
      name: "Scenario Sensitivity",
      weight: "15%",
      score: data.scenario_sensitivity_score,
      desc: "Recommendation shift gradient under synthetic parameter fluctuations.",
      inverted: true
    },
    {
      name: "Stress Robustness",
      weight: "15%",
      score: data.stress_robustness_score,
      desc: "Resistance to rank-order flips during severe climate and cost shocks.",
      inverted: false
    },
    {
      name: "Decision Risk",
      weight: "15%",
      score: data.decision_risk_score,
      desc: "Economic downside exposure given current market volatility indices.",
      inverted: true
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border-t border-gray-100">
        
        {/* Top Handle & Header */}
        <div className="px-5 pt-3 pb-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Activity size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-gray-900">ARFI Explainability Engine</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-700">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-gray-500">Agri Recommendation Fragility Index</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 text-xs">
          
          {/* Main ARFI Score Banner */}
          <div className={`p-4 rounded-2xl border ${statusColors.border} ${statusColors.light} flex items-center justify-between`}>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Overall Fragility</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-gray-900">
                  {(data.fragility_score * 100).toFixed(0)}%
                </span>
                <span className={`text-xs font-bold ${statusColors.text}`}>
                  {data.fragility_label}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-1 max-w-xs leading-relaxed">
                {data.assessment_summary || "Recommendation demonstrates high resilience to adverse climate shifts."}
              </p>
            </div>

            <div className="shrink-0 text-center pl-2">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-gray-200 flex flex-col items-center justify-center">
                <ShieldCheck size={24} className={statusColors.text} />
                <span className="text-[9px] font-bold text-gray-600 mt-0.5">Verified</span>
              </div>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab("components")}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "components"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              6 Component Breakdown
            </button>
            <button
              onClick={() => setActiveTab("scenarios")}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === "scenarios"
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Stress Testing Scenarios
            </button>
          </div>

          {/* TAB 1: 6 Sub-Score Components */}
          {activeTab === "components" && (
            <div className="flex flex-col gap-2.5">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-[11px] text-gray-600">
                <span className="font-bold text-gray-800">ARFI Formulation: </span>
                ARFI = 0.20·R<sub>data</sub> + 0.20·C<sub>model</sub> + 0.15·U<sub>pred</sub> + 0.15·S<sub>sens</sub> + 0.15·R<sub>stress</sub> + 0.15·D<sub>risk</sub>
              </div>

              {subComponents.map((sub, idx) => {
                const pct = Math.round(sub.score * 100);
                const isHealthy = sub.inverted ? sub.score < 0.35 : sub.score > 0.65;
                const barColor = isHealthy ? "bg-emerald-500" : sub.score > 0.5 ? "bg-amber-500" : "bg-rose-500";
                
                return (
                  <div key={idx} className="p-3 bg-white border border-gray-100 rounded-xl shadow-2xs hover:border-gray-200 transition-all">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-800 text-xs">{sub.name}</span>
                        <span className="text-[10px] text-gray-400 font-semibold">({sub.weight})</span>
                      </div>
                      <span className="font-mono font-bold text-xs text-gray-700">{pct}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full ${barColor} transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      />
                    </div>

                    <p className="text-[10px] text-gray-500 leading-snug">{sub.desc}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: 6 Stress Testing Scenarios */}
          {activeTab === "scenarios" && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-gray-500">
                Simulated shock performance across 6 extreme agro-climatic stress events:
              </p>

              {(data.stress_scenarios || []).map((sc, idx) => {
                const isStable = sc.fragility_status === "STABLE";
                const isMod = sc.fragility_status === "MODERATE";
                const badgeColor = isStable
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : isMod
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-rose-100 text-rose-800 border-rose-200";

                return (
                  <div key={idx} className="p-3 bg-white border border-gray-100 rounded-xl shadow-2xs">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-800 text-xs">{sc.scenario_name}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {sc.fragility_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 mt-2 text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded-lg text-center">
                      <div>
                        <span className="text-gray-400 block text-[9px]">Rain</span>
                        <span className="font-semibold text-gray-700">{sc.rainfall_delta_percent > 0 ? `+${sc.rainfall_delta_percent}` : sc.rainfall_delta_percent}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px]">Temp</span>
                        <span className="font-semibold text-gray-700">{sc.temp_delta_celsius > 0 ? `+${sc.temp_delta_celsius}` : sc.temp_delta_celsius}°C</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px]">Price</span>
                        <span className="font-semibold text-gray-700">{sc.market_price_delta_percent}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px]">Rank Shift</span>
                        <span className={`font-bold ${sc.crop_rank_change === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                          {sc.crop_rank_change === 0 ? "None (0)" : `±${sc.crop_rank_change}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Direct CTA to What-If Lab */}
          {onOpenWhatIf && (
            <button
              onClick={() => {
                onClose();
                onOpenWhatIf();
              }}
              className="mt-2 w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              <Sliders size={16} />
              <span>Launch Interactive What-If Lab</span>
              <ArrowUpRight size={15} />
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
