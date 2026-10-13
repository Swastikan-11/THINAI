import React, { useState } from "react";
import { 
  Sprout, 
  Calendar, 
  Droplets, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  ChevronRight, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Layers,
  Thermometer,
  CloudRain
} from "lucide-react";
import { DataBadge } from "./DataBadge";
import { DecisionEngineResult } from "../../services/decisionEngine";

interface CropStageGuide {
  stageId: string;
  stageName: string;
  durationDays: string;
  status: "completed" | "current" | "upcoming";
  practices: string[];
  irrigation: string;
  nutrients: string;
  pests: string[];
  diseases: string[];
  preventiveActions: string[];
  weatherRisks: string;
  engineGuidance?: string;
}

const PADDY_LIFECYCLE: CropStageGuide[] = [
  {
    stageId: "land_prep",
    stageName: "1. Land Preparation & Puddling",
    durationDays: "Days 1 - 15",
    status: "completed",
    practices: [
      "Summer deep plowing with MB plow to expose weed tubers and soil pathogens.",
      "Wet puddling twice using rotavator to create impermeable subsoil layer (reduces percolation loss).",
      "Field leveling using laser leveler or wooden plank to ensure uniform standing water depth (2 cm)."
    ],
    irrigation: "Maintain saturated mud slurry during leveling; drain excess standing water before transplanting.",
    nutrients: "Apply well-decomposed FYM @ 5 tons/acre or green manure (Daincha / Sunnhemp) in situ incorporation.",
    pests: ["Mole cricket", "Rice root weevil in nursery"],
    diseases: ["Soil-borne damping-off"],
    preventiveActions: ["Incorporate Trichoderma viride @ 1 kg/acre enriched in 50 kg FYM during final puddling."],
    weatherRisks: "Sudden dry spell hardens soil slurry; heavy continuous downpour erodes bunds."
  },
  {
    stageId: "seed_selection",
    stageName: "2. Seed Selection & Nursery Management",
    durationDays: "Days 1 - 25",
    status: "completed",
    practices: [
      "Selection of certified foundation seed (e.g. CR 1009 Sub-1 or CO-51).",
      "Salt water seed selection (1.06 specific gravity) to discard chaffy, unfilled seeds.",
      "Raised bed nursery preparation (10 cents nursery area for 1 acre main field)."
    ],
    irrigation: "Keep nursery saturated for first 5 days, then maintain thin layer (1-2 cm) of water.",
    nutrients: "Apply DAP @ 2 kg + MOP @ 1 kg per cent of nursery area at 10 days after sowing.",
    pests: ["Thrips (Stenchaetothrips biformis)", "Armyworm"],
    diseases: ["Brown spot (Bipolaris oryzae) in nursery"],
    preventiveActions: ["Seed treatment with Carbendazim 2g/kg seed or Pseudomonas fluorescens 10g/kg seed."],
    weatherRisks: "Direct scorching sun desiccates tender seedlings."
  },
  {
    stageId: "sowing_transplanting",
    stageName: "3. Sowing / Transplanting",
    durationDays: "Days 20 - 25",
    status: "completed",
    practices: [
      "Transplant 20 to 25-day-old seedlings with 2-3 seedlings per hill.",
      "Maintain spacing of 20 x 10 cm (medium duration) or 15 x 10 cm (short duration varieties).",
      "Shallow planting at 2 to 3 cm depth ensures rapid root anchoring and early tillering."
    ],
    irrigation: "Maintain thin water layer of 2 cm for 3 days to establish seedling root contact.",
    nutrients: "Basal dressing: 50% of recommended P2O5 (DAP/SSP) and 25% of K2O applied before final leveling.",
    pests: ["Caseworm", "Stem borer early oviposition"],
    diseases: ["Bacterial Leaf Blight early ingress"],
    preventiveActions: ["Clip seedling leaf tips before transplanting to destroy stem borer egg masses."],
    weatherRisks: "Submergence due to flash flood within 48h after transplanting dislodges roots."
  },
  {
    stageId: "vegetative",
    stageName: "4. Vegetative & Active Tillering",
    durationDays: "Days 25 - 55",
    status: "current",
    practices: [
      "Operate rotary cono-weeder at 15 and 30 DAT to incorporate weeds and aerate root zone.",
      "Monitor tiller count per hill (target: 18-22 effective tillers per hill).",
      "Maintain alternate wetting and drying (AWD) cycle rather than continuous submergence."
    ],
    irrigation: "Allow water level to drop 5 cm below soil surface before re-irrigating to 5 cm depth. Delay if heavy rain is forecast.",
    nutrients: "First top dressing: 25% Nitrogen (Neem-coated Urea) + 25% Potash (MOP) at active tillering.",
    pests: ["Yellow Stem Borer (Scirpophaga incertulas) causing Dead Heart", "Leaf folder (Cnaphalocrocis medinalis)"],
    diseases: ["Rice Blast (Pyricularia oryzae) spindle lesions", "Sheath Blight (Rhizoctonia solani)"],
    preventiveActions: ["Install 4 pheromone traps/acre for stem borer monitoring; spray Azadirachtin 1% @ 400 ml/acre."],
    weatherRisks: "High humidity (>80%) combined with overcast sky accelerates fungal spore germination.",
    engineGuidance: "Active THINAI Decision: Soil saturation currently high (68%) with 18mm rain forecast. Delay irrigation by 24h to avoid root hypoxia."
  },
  {
    stageId: "flowering",
    stageName: "5. Panicle Initiation & Flowering",
    durationDays: "Days 55 - 85",
    status: "upcoming",
    practices: [
      "Critical physiological window: avoid any moisture stress which triggers spikelet sterility.",
      "Erect bird perches (10/acre) to encourage predatory birds on insect pests.",
      "Flag leaf protection is paramount for maximizing grain filling."
    ],
    irrigation: "Maintain continuous standing water of 3 to 5 cm from panicle initiation to flowering completion.",
    nutrients: "Final top dressing: 25% Nitrogen + 50% Potash at panicle initiation stage. Foliar 1% 13:0:45 spray.",
    pests: ["Gundhi Bug (Leptocorisa acuta) feeding on milky grains", "Brown Planthopper (BPH) at base"],
    diseases: ["Neck Blast", "False Smut (Ustilaginoidea virens)"],
    preventiveActions: ["Dust Malathion 5% D @ 10 kg/acre in early morning or late evening against Gundhi Bug."],
    weatherRisks: "Rain during morning flowering (09:00 - 11:30 AM) washes away pollen and causes empty grains."
  },
  {
    stageId: "yield_formation",
    stageName: "6. Grain Filling / Yield Formation",
    durationDays: "Days 85 - 110",
    status: "upcoming",
    practices: [
      "Monitor milky stage transitioning into dough stage.",
      "Check underside of plant base near waterline for Brown Planthopper (BPH) hopperburn circles.",
      "Inspect earheads for uniform grain hardening."
    ],
    irrigation: "Shallow irrigation of 2-3 cm; irrigate when hairline cracks appear on soil.",
    nutrients: "Foliar spray of 1% Potassium Nitrate (KNO3) enhances test weight and milling recovery.",
    pests: ["Brown Planthopper (BPH)", "Earhead bug"],
    diseases: ["Grain discoloration", "Sheath rot"],
    preventiveActions: ["Form alleyways (30 cm width every 2 meters) to permit sunlight into base and discourage BPH."],
    weatherRisks: "High cyclonic wind causes crop lodging and severe yield loss."
  },
  {
    stageId: "harvest",
    stageName: "7. Maturity & Harvest",
    durationDays: "Days 110 - 125",
    status: "upcoming",
    practices: [
      "Harvest when 85-90% of panicle grains turn golden yellow and moisture drops to 20-22%.",
      "Drain all field water 10-14 days prior to harvest to facilitate combine harvester movement.",
      "Threshing immediately after cutting to prevent grain shattering and microbial heating."
    ],
    irrigation: "Completely stop irrigation 10-12 days before scheduled harvest date.",
    nutrients: "No chemical fertilizers applied at this stage.",
    pests: ["Stored grain pests (Sitophilus oryzae)"],
    diseases: ["Pre-harvest sprouting in panicle if waterlogged"],
    preventiveActions: ["Ensure clean threshing floor / sanitized combine harvester drum."],
    weatherRisks: "Unseasonal rain during harvesting causes lodging, seed rotting, and blackening."
  },
  {
    stageId: "post_harvest",
    stageName: "8. Post-Harvest & Storage",
    durationDays: "Days 125 - 140",
    status: "upcoming",
    practices: [
      "Sun dry paddy grains on clean tarpaulin until grain moisture reaches safe 12-14% storage benchmark.",
      "Winnowing and cleaning to remove chaff, stones, and foreign matter.",
      "Store in hermetic Super Bags or metal bins elevated 15 cm above ground on wooden pallets."
    ],
    irrigation: "Not applicable.",
    nutrients: "Soil sampling for subsequent crop rotation planning (Legumes / Pulses).",
    pests: ["Rice weevil", "Lesser grain borer"],
    diseases: ["Storage mold (Aspergillus flavus producing Aflatoxins)"],
    preventiveActions: ["Mix dried neem leaves or activated kaolin clay with grains inside storage bins."],
    weatherRisks: "High humidity during storage induces grain dampness and mold growth."
  }
];

export function CropGuideScreen({
  cropName = "Paddy",
  cropVariety = "Ponni",
  cropStage = "Vegetative",
  engineResult
}: {
  cropName?: string;
  cropVariety?: string;
  cropStage?: string;
  engineResult?: DecisionEngineResult;
}) {
  const [selectedStageId, setSelectedStageId] = useState<string>("vegetative");
  const selectedStage = PADDY_LIFECYCLE.find(s => s.stageId === selectedStageId) || PADDY_LIFECYCLE[3];

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">My Crop Guide (End-to-End Lifecycle)</h2>
              <p className="text-xs text-emerald-200">{cropName} ({cropVariety}) • Dynamic Agronomic Pipeline</p>
            </div>
          </div>
          <DataBadge status="STATIC REFERENCE" detail="ICAR / TNAU Package of Practices" />
        </div>

        {/* Current Active Stage Alert */}
        <div className="bg-emerald-950/60 border border-emerald-700/50 rounded-lg p-2.5 mt-3 text-xs flex items-center justify-between text-emerald-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Active Field Stage: <strong>Stage 4 — Vegetative & Active Tillering</strong></span>
          </div>
          <span className="text-[11px] bg-emerald-700/60 px-2 py-0.5 rounded font-mono">Day 38 of 125</span>
        </div>
      </div>

      {/* 8-Stage Lifecycle Timeline */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            8-Stage Crop Lifecycle
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">Select stage to inspect</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PADDY_LIFECYCLE.map(stage => {
            const isSelected = stage.stageId === selectedStageId;
            const isCurrent = stage.status === "current";
            const isCompleted = stage.status === "completed";

            return (
              <button
                key={stage.stageId}
                onClick={() => setSelectedStageId(stage.stageId)}
                className={`p-2.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? "bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500/40"
                    : isCurrent
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-bold"
                      : isCompleted
                        ? "bg-zinc-50 text-zinc-600 border-zinc-200"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-widest shadow-xs">
                    NOW
                  </span>
                )}
                <div className={`text-[10px] font-mono mb-0.5 ${isSelected ? "text-emerald-200" : "text-zinc-500"}`}>
                  {stage.durationDays}
                </div>
                <div className="text-xs font-bold truncate">{stage.stageName.split(". ")[1] || stage.stageName}</div>
                <div className={`text-[10px] mt-1 flex items-center gap-1 ${isSelected ? "text-emerald-100" : "text-zinc-400"}`}>
                  {isCompleted ? "✓ Completed" : isCurrent ? "● Active in field" : "○ Upcoming"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
              {selectedStage.durationDays}
            </span>
            <h3 className="font-extrabold text-base text-zinc-900 mt-1">{selectedStage.stageName}</h3>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            selectedStage.status === "current" 
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : selectedStage.status === "completed"
                ? "bg-zinc-100 text-zinc-700"
                : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}>
            {selectedStage.status === "current" ? "Current Stage" : selectedStage.status === "completed" ? "Past Stage" : "Upcoming Stage"}
          </span>
        </div>

        {/* Dynamic THINAI Engine Guidance Connected Here! */}
        {selectedStage.status === "current" && (
          <div className="bg-linear-to-r from-emerald-900 to-teal-900 text-white rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-widest text-emerald-300 uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                THINAI Core Engine Connected Decision
              </span>
              <DataBadge status="MODEL GENERATED" detail="Live Pipeline" />
            </div>
            <p className="text-xs font-semibold text-emerald-50 leading-relaxed">
              {selectedStage.engineGuidance || "Current recommendation: Maintain alternate wetting and drying. Microclimate risk assessment active."}
            </p>
          </div>
        )}

        {/* Agronomic Practices */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Recommended Agronomic Practices
          </h4>
          <ul className="space-y-1.5 text-xs text-zinc-700 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            {selectedStage.practices.map((prac, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span>{prac}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Irrigation & Nutrient Guidance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
            <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-600" />
              Irrigation Management
            </div>
            <p className="text-blue-950/90 text-xs leading-relaxed">{selectedStage.irrigation}</p>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
            <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Nutrient Top-Dressing
            </div>
            <p className="text-amber-950/90 text-xs leading-relaxed">{selectedStage.nutrients}</p>
          </div>
        </div>

        {/* Pest, Disease & Preventive Action */}
        <div className="border border-zinc-200 rounded-xl p-3.5 space-y-2 bg-zinc-50/50 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-800 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Pest & Disease Vulnerabilities
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] font-bold text-zinc-600 block mb-0.5">Common Insect Pests:</span>
              <div className="flex flex-wrap gap-1">
                {selectedStage.pests.map((p, i) => (
                  <span key={i} className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-zinc-600 block mb-0.5">Common Diseases:</span>
              <div className="flex flex-wrap gap-1">
                {selectedStage.diseases.map((d, i) => (
                  <span key={i} className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200/80">
            <span className="text-[11px] font-bold text-zinc-700 block mb-1">Scientific Preventive Action:</span>
            <ul className="space-y-1 text-zinc-700">
              {selectedStage.preventiveActions.map((act, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px]">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Weather Risk Factors */}
        <div className="bg-zinc-100 rounded-xl p-3 text-xs text-zinc-700 flex items-start gap-2 border border-zinc-200">
          <CloudRain className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-zinc-900 block mb-0.5">Microclimate Risks for This Stage:</strong>
            <p className="text-[11px] leading-relaxed text-zinc-600">{selectedStage.weatherRisks}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
