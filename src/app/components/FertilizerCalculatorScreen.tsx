import React, { useState } from "react";
import { Calculator, Sparkles, ArrowRight, Info, CheckCircle2, DollarSign, Layers, Sprout } from "lucide-react";
import { DataBadge } from "./DataBadge";

interface FertilizerFormula {
  crop: string;
  recommendedN: number; // kg/acre
  recommendedP: number;
  recommendedK: number;
  yieldBenchmark: string;
}

const CROP_NUTRIENT_STANDARDS: Record<string, FertilizerFormula> = {
  paddy: {
    crop: "Paddy (Rice)",
    recommendedN: 50, // kg/acre
    recommendedP: 20,
    recommendedK: 20,
    yieldBenchmark: "25 - 28 quintals / acre"
  },
  maize: {
    crop: "Maize (Corn)",
    recommendedN: 60,
    recommendedP: 25,
    recommendedK: 20,
    yieldBenchmark: "30 - 35 quintals / acre"
  },
  cotton: {
    crop: "Cotton",
    recommendedN: 48,
    recommendedP: 24,
    recommendedK: 24,
    yieldBenchmark: "10 - 12 quintals / acre"
  },
  tomato: {
    crop: "Tomato (Hybrid)",
    recommendedN: 70,
    recommendedP: 40,
    recommendedK: 40,
    yieldBenchmark: "18 - 22 tons / acre"
  }
};

// Government Subsidized Price Reference (Official MRP per 50kg bag)
const FERTILIZER_PRICES = {
  urea: { name: "Neem Coated Urea (45 kg)", mrp: 266.50, nPercent: 46, pPercent: 0, kPercent: 0 },
  dap: { name: "Di-Ammonium Phosphate (DAP 50 kg)", mrp: 1350.00, nPercent: 18, pPercent: 46, kPercent: 0 },
  mop: { name: "Muriate of Potash (MOP 50 kg)", mrp: 1650.00, nPercent: 0, pPercent: 0, kPercent: 60 },
  complex: { name: "NPK Complex (20:20:0:13 50 kg)", mrp: 1200.00, nPercent: 20, pPercent: 20, kPercent: 0 }
};

export function FertilizerCalculatorScreen({
  primaryCrop = "Paddy",
  farmSize = "2.0"
}: {
  primaryCrop?: string;
  farmSize?: string;
}) {
  const [crop, setCrop] = useState<string>("paddy");
  const [area, setArea] = useState<number>(parseFloat(farmSize) || 2.0);
  const [cropStage, setCropStage] = useState<string>("tillering");
  const [soilStatus, setSoilStatus] = useState<"low" | "medium" | "high">("medium");
  const [soilReportProvided, setSoilReportProvided] = useState<boolean>(true);

  // Agronomic calibration factor based on Soil Health Card fertility test
  const soilMultiplier = soilStatus === "low" ? 1.25 : soilStatus === "high" ? 0.75 : 1.0;

  const standard = CROP_NUTRIENT_STANDARDS[crop] || CROP_NUTRIENT_STANDARDS.paddy;

  // Total nutrients needed for the farm plot (kg)
  const totalN_needed = Math.round(standard.recommendedN * area * soilMultiplier);
  const totalP_needed = Math.round(standard.recommendedP * area * soilMultiplier);
  const totalK_needed = Math.round(standard.recommendedK * area * soilMultiplier);

  // Fertilizer Quantities Calculation:
  // 1. DAP provides all P2O5 (46% P, 18% N)
  const dapBags = Math.ceil(totalP_needed / (50 * 0.46));
  const nFromDAP = dapBags * 50 * 0.18;

  // 2. Remaining Nitrogen provided by Neem Coated Urea (46% N in 45kg bag = 20.7 kg N/bag)
  const remainingN = Math.max(0, totalN_needed - nFromDAP);
  const ureaBags = Math.ceil(remainingN / (45 * 0.46));

  // 3. Potash provided by MOP (60% K in 50kg bag = 30 kg K/bag)
  const mopBags = Math.ceil(totalK_needed / (50 * 0.60));

  // Cost calculation
  const totalCost = (ureaBags * FERTILIZER_PRICES.urea.mrp) +
    (dapBags * FERTILIZER_PRICES.dap.mrp) +
    (mopBags * FERTILIZER_PRICES.mop.mrp);

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Fertilizer Requirement Calculator</h2>
              <p className="text-xs text-emerald-200">Transparent Nutrient Dosage & Split Application Protocol</p>
            </div>
          </div>
          <DataBadge status="MODEL GENERATED" detail="TNAU / ICAR Formulas" />
        </div>
        <p className="text-xs text-emerald-100/90 bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-800/40 mt-2">
          Scientific precision calculation translating crop nutritional removal into subsidized bag quantities without over-fertilization or fertilizer leaching waste.
        </p>
      </div>

      {/* 1. INPUTS SECTION */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <span className="text-xs font-bold text-zinc-700 uppercase tracking-wide flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-700" />
            1. Farmer Field Inputs
          </span>
          <DataBadge status="USER PROVIDED" size="sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-bold text-zinc-700 block mb-1">Target Crop</label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full p-2 rounded-lg border border-zinc-300 bg-white font-medium text-zinc-900"
            >
              <option value="paddy">Paddy (Rice)</option>
              <option value="maize">Maize (Corn)</option>
              <option value="cotton">Cotton</option>
              <option value="tomato">Tomato (Hybrid)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-zinc-700 block mb-1">Farm Plot Area (Acres)</label>
            <input
              type="number"
              step="0.5"
              min="0.25"
              max="50"
              value={area}
              onChange={(e) => setArea(parseFloat(e.target.value) || 1)}
              className="w-full p-2 rounded-lg border border-zinc-300 bg-white font-medium text-zinc-900"
            />
          </div>

          <div>
            <label className="font-bold text-zinc-700 block mb-1">Current Crop Stage</label>
            <select
              value={cropStage}
              onChange={(e) => setCropStage(e.target.value)}
              className="w-full p-2 rounded-lg border border-zinc-300 bg-white font-medium text-zinc-900"
            >
              <option value="basal">Basal (Land Preparation / Sowing)</option>
              <option value="tillering">Active Tillering / Vegetative</option>
              <option value="panicle">Panicle Initiation / Flowering</option>
            </select>
          </div>
        </div>

        {/* Soil Test Calibration */}
        <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-800">Soil Fertility Calibration (Soil Health Card)</span>
            <span className="text-[10px] text-zinc-500 font-mono">Multiplied based on soil test</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "low", label: "Low Fertility (+25% dosage)", factor: "1.25x" },
              { id: "medium", label: "Medium / Normal (100% dosage)", factor: "1.00x" },
              { id: "high", label: "High Organic (+25% reduction)", factor: "0.75x" }
            ].map(lvl => (
              <button
                key={lvl.id}
                onClick={() => setSoilStatus(lvl.id as any)}
                className={`p-2 rounded-lg border text-center transition-all ${
                  soilStatus === lvl.id
                    ? "bg-emerald-700 text-white border-emerald-800 font-bold shadow-xs"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                }`}
              >
                <div className="text-[11px]">{lvl.label.split(" (")[0]}</div>
                <div className="text-[10px] opacity-80 font-mono">{lvl.factor}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. TRANSPARENT CALCULATION FORMULA BREAKDOWN */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <span className="text-xs font-bold text-zinc-700 uppercase tracking-wide flex items-center gap-1.5">
            <ArrowRight className="w-4 h-4 text-emerald-700" />
            2. Transparent Agronomic Calculation
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">{area} Acres • {standard.crop}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <div className="text-[10px] font-bold text-emerald-800 uppercase">Nitrogen (N)</div>
            <div className="text-lg font-black text-emerald-900">{totalN_needed} kg</div>
            <div className="text-[10px] text-zinc-500 font-mono">{standard.recommendedN} kg/ac × {area} ac × {soilMultiplier}</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-[10px] font-bold text-blue-800 uppercase">Phosphorus (P2O5)</div>
            <div className="text-lg font-black text-blue-900">{totalP_needed} kg</div>
            <div className="text-[10px] text-zinc-500 font-mono">{standard.recommendedP} kg/ac × {area} ac × {soilMultiplier}</div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="text-[10px] font-bold text-amber-800 uppercase">Potash (K2O)</div>
            <div className="text-lg font-black text-amber-900">{totalK_needed} kg</div>
            <div className="text-[10px] text-zinc-500 font-mono">{standard.recommendedK} kg/ac × {area} ac × {soilMultiplier}</div>
          </div>
        </div>
      </div>

      {/* 3. FINAL FERTILIZER BAG RECOMMENDATION & SPLIT SCHEDULE */}
      <div className="bg-linear-to-br from-emerald-50 via-teal-50 to-emerald-100/40 rounded-2xl border-2 border-emerald-600/30 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
          <div>
            <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              3. Recommended Subsidized Fertilizer Bags
            </span>
            <p className="text-[11px] text-emerald-800">Total requirement for complete crop season across {area} acres</p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-zinc-600">Estimated Total Cost</div>
            <div className="text-base font-black text-emerald-900">₹{totalCost.toLocaleString("en-IN")}</div>
          </div>
        </div>

        {/* Bag quantities */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-zinc-900">Neem Coated Urea</span>
              <span className="text-[10px] text-emerald-700 font-mono">₹266.50/bag</span>
            </div>
            <div className="text-2xl font-black text-emerald-800 mb-1">{ureaBags} <span className="text-xs font-normal text-zinc-600">Bags (45 kg)</span></div>
            <div className="text-[10px] text-zinc-500">Provides {Math.round(ureaBags * 45 * 0.46)} kg Nitrogen</div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-zinc-900">DAP (18:46:0)</span>
              <span className="text-[10px] text-emerald-700 font-mono">₹1,350/bag</span>
            </div>
            <div className="text-2xl font-black text-blue-800 mb-1">{dapBags} <span className="text-xs font-normal text-zinc-600">Bags (50 kg)</span></div>
            <div className="text-[10px] text-zinc-500">Provides full P2O5 + starter N</div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-zinc-900">MOP (Muriate of Potash)</span>
              <span className="text-[10px] text-emerald-700 font-mono">₹1,650/bag</span>
            </div>
            <div className="text-2xl font-black text-amber-800 mb-1">{mopBags} <span className="text-xs font-normal text-zinc-600">Bags (50 kg)</span></div>
            <div className="text-[10px] text-zinc-500">Provides {Math.round(mopBags * 50 * 0.60)} kg Potash</div>
          </div>
        </div>

        {/* 4-Split Application Schedule */}
        <div className="bg-white rounded-xl p-4 border border-emerald-200 text-xs space-y-2">
          <strong className="text-zinc-900 block font-bold text-xs uppercase tracking-wide">
            Agronomic Split Application Protocol (Do Not Apply All At Once):
          </strong>
          
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-100">
              <span className="font-mono text-emerald-800 font-bold w-16 shrink-0">Basal:</span>
              <div className="text-zinc-700">
                Apply <strong>100% of DAP ({dapBags} bags)</strong> + <strong>25% of MOP ({Math.ceil(mopBags * 0.25)} bags)</strong> before transplanting/sowing.
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-100">
              <span className="font-mono text-emerald-800 font-bold w-16 shrink-0">Tillering:</span>
              <div className="text-zinc-700">
                Apply <strong>50% of Urea ({Math.ceil(ureaBags * 0.5)} bags)</strong> + <strong>25% of MOP</strong> at 25-30 days after transplanting (active tillering).
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50 border border-zinc-100">
              <span className="font-mono text-emerald-800 font-bold w-16 shrink-0">Panicle:</span>
              <div className="text-zinc-700">
                Apply remaining <strong>50% of Urea ({Math.floor(ureaBags * 0.5)} bags)</strong> + <strong>50% of MOP ({Math.ceil(mopBags * 0.5)} bags)</strong> at panicle initiation.
              </div>
            </div>
          </div>

          <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 pt-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Never top-dress urea on saturated or waterlogged soil just before heavy rainfall (prevents nitrogen leaching).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
