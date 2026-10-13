import React, { useState } from "react";
import { BookOpen, Search, Filter, ShieldAlert, AlertTriangle, Bug, Sparkles, CheckCircle2, Info, ChevronRight } from "lucide-react";
import { DataBadge } from "./DataBadge";

export interface CropHealthEntry {
  id: string;
  name: string;
  scientificName: string;
  type: "disease" | "pest" | "deficiency";
  crops: string[];
  pathogenType?: "Fungal" | "Bacterial" | "Viral" | "Insect" | "Nutrient";
  affectedStages: string[];
  severity: "High" | "Moderate" | "Critical";
  symptoms: string[];
  causes: string[];
  identification: string;
  prevention: string[];
  treatment: string;
  safetyGuidance: string;
  reference: string;
}

const HEALTH_LIBRARY: CropHealthEntry[] = [
  {
    id: "rice-blast",
    name: "Rice Blast (Leaf / Neck Blast)",
    scientificName: "Pyricularia oryzae (Magnaporthe oryzae)",
    type: "disease",
    crops: ["Paddy"],
    pathogenType: "Fungal",
    affectedStages: ["Tillering", "Panicle Initiation", "Flowering"],
    severity: "Critical",
    symptoms: [
      "Spindle-shaped diamond lesions with gray/white center and brown/reddish-brown margin on leaf blades.",
      "Neck rot causing broken panicles and completely unfilled, chaffy white grains.",
      "Rapid coalescing of leaf spots leading to total foliar scorching under cloudy conditions."
    ],
    causes: [
      "Prolonged leaf wetness (> 10-12 hours) due to dew or light rain.",
      "High relative humidity (> 85%) and ambient temperature around 20-26°C.",
      "Excessive nitrogenous fertilizer (Urea) application without adequate potash."
    ],
    identification: "Classic eye-shaped diamond spots with tapered points along leaf veins.",
    prevention: [
      "Cultivate blast-resistant varieties (e.g., ADT-45, CO-51, CR-1009 Sub-1).",
      "Avoid excess nitrogen top-dressing; split urea into 3-4 split applications.",
      "Seed treatment with Pseudomonas fluorescens @ 10 g/kg seed."
    ],
    treatment: "Foliar spray of Tricyclazole 75% WP @ 120 g/acre or Isoprothiolane 40% EC @ 300 ml/acre in 200 liters of water at early lesion onset.",
    safetyGuidance: "Wear protective respirator and gloves. Observe mandatory 14-day pre-harvest interval (PHI) before grain harvesting.",
    reference: "ICAR-National Rice Research Institute (NRRI) Disease Compendium"
  },
  {
    id: "bacterial-leaf-blight",
    name: "Bacterial Leaf Blight (BLB)",
    scientificName: "Xanthomonas oryzae pv. oryzae",
    type: "disease",
    crops: ["Paddy"],
    pathogenType: "Bacterial",
    affectedStages: ["Tillering", "Flowering"],
    severity: "High",
    symptoms: [
      "Water-soaked translucent stripes along leaf margins expanding into wavy yellowish lesions.",
      "Infected leaves turn straw-yellow and roll inward (Kresek phase in young plants causes wilting).",
      "Milky bacterial ooze drops visible on young lesions in humid morning hours."
    ],
    causes: [
      "Bacterial ingress through natural hydathodes or wounds caused by wind/handling.",
      "Warm temperatures (25-34°C) with continuous wet rainy weather.",
      "Submergence in flood water carrying inoculum from adjacent infected fields."
    ],
    identification: "Wavy margin chlorosis starting from leaf tip progressing downward; bacterial ooze test in clear water.",
    prevention: [
      "Clip seedling leaf tips before transplanting to prevent pathogen transmission.",
      "Drain excess field standing water during storm periods.",
      "Apply Bleaching Powder @ 2 kg/acre mixed in irrigation water."
    ],
    treatment: "Spray Streptomycin sulphate + Tetracycline combination (Plantomycin) @ 120 g + Copper Oxychloride 50% WP @ 500 g in 200 liters water/acre.",
    safetyGuidance: "Do not spray against the wind. Wash spray equipment thoroughly after application.",
    reference: "TNAU Agritech Portal Plant Protection Manual"
  },
  {
    id: "yellow-stem-borer",
    name: "Yellow Stem Borer",
    scientificName: "Scirpophaga incertulas",
    type: "pest",
    crops: ["Paddy"],
    pathogenType: "Insect",
    affectedStages: ["Vegetative", "Panicle Initiation", "Flowering"],
    severity: "High",
    symptoms: [
      "Dead Heart symptom: Central drying and death of the emerging shoot in tillering stage; easily pulls out.",
      "White Earhead symptom: Empty, erect white panicles devoid of grain during reproductive stage.",
      "Tiny entry pin-holes visible near the base of the rice culm."
    ],
    causes: [
      "Nocturnal moths laying egg masses covered with buff-colored hairs on upper leaf tips.",
      "Continuous non-synchronized planting in neighboring fields.",
      "Dense canopy with high plant population sheltering larvae."
    ],
    identification: "Dry central shoot pulls out effortlessly with chewed frayed base smelling putrid.",
    prevention: [
      "Install sex pheromone traps (Scirpo-lure) @ 4 traps/acre for adult moth monitoring.",
      "Release egg parasitoid Trichogramma japonicum @ 40,000/acre at weekly intervals.",
      "Maintain 30 cm alleyways every 2 meters for light penetration."
    ],
    treatment: "Apply Chlorantraniliprole 18.5% SC @ 60 ml/acre or Cartap hydrochloride 4G @ 7.5 kg/acre when ETL (1 egg mass/sq.m or 5% dead hearts) is reached.",
    safetyGuidance: "Do not apply during active honeybee foraging hours (08:00 - 11:00 AM). Store chemicals away from domestic cattle.",
    reference: "Directorate of Rice Development, Ministry of Agriculture"
  },
  {
    id: "tomato-early-blight",
    name: "Early Blight of Tomato",
    scientificName: "Alternaria solani",
    type: "disease",
    crops: ["Tomato"],
    pathogenType: "Fungal",
    affectedStages: ["Vegetative", "Flowering", "Fruiting"],
    severity: "High",
    symptoms: [
      "Concentric circular target-board ring spots on older lower leaves.",
      "Yellow chlorotic halo surrounding brown leathery lesions.",
      "Defoliation starting from base moving upward; dark sunken spots on fruit stem end."
    ],
    causes: [
      "Splashing rain or overhead sprinkler irrigation carrying soil-borne spores to foliage.",
      "Warm temperatures (24-29°C) with alternating wet and dry periods.",
      "Stressed plants due to poor nutrition or heavy fruit load."
    ],
    identification: "Concentric target-board rings visible clearly inside dark brown circular spots.",
    prevention: [
      "Drip irrigation to avoid wetting foliage.",
      "Mulch soil surface with 25-micron silver-black plastic mulch.",
      "Crop rotation with non-solanaceous crops (Paddy, Maize, Pulses) for 2 years."
    ],
    treatment: "Spray Mancozeb 75% WP @ 400 g/acre or Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 200 ml/acre at initial symptom appearance.",
    safetyGuidance: "Maintain 7-day pre-harvest interval for table tomatoes. Do not consume unwashed fruits.",
    reference: "Indian Institute of Horticultural Research (IIHR)"
  },
  {
    id: "zinc-deficiency",
    name: "Zinc Deficiency (Khaira Disease)",
    scientificName: "Micro-Nutrient Stress (Zn)",
    type: "deficiency",
    crops: ["Paddy", "Maize"],
    pathogenType: "Nutrient",
    affectedStages: ["Tillering", "Vegetative"],
    severity: "Moderate",
    symptoms: [
      "Rusty bronze or reddish-brown pigment pigmentation between veins on lower third leaves.",
      "Stunted uneven plant growth with delayed tillering.",
      "Interveinal chlorosis near the base of young leaves."
    ],
    causes: [
      "High soil pH (> 7.8) or calcareous soils precipitating zinc into insoluble carbonates.",
      "Prolonged anaerobic submergence reducing zinc availability to root hairs.",
      "Heavy application of phosphatic fertilizers (DAP) causing Zn-P antagonism."
    ],
    identification: "Bronze discoloration appearing 2-3 weeks after transplanting in patches across field.",
    prevention: [
      "Soil application of Zinc Sulphate (Heptahydrate 21%) @ 10 kg/acre as basal dressing.",
      "Allow periodic soil aeration (alternate wetting and drying)."
    ],
    treatment: "Foliar spray of 0.5% Zinc Sulphate (5 g/L) + 0.25% Lime (2.5 g/L) or Chelated Zinc EDTA (12%) @ 1 g/L water twice at 10-day intervals.",
    safetyGuidance: "Always neutralize Zinc Sulphate with unslaked lime to prevent acidic foliar burn.",
    reference: "TNAU Department of Soil Science & Agricultural Chemistry"
  }
];

export function CropHealthLibrary() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<CropHealthEntry | null>(null);

  const filtered = HEALTH_LIBRARY.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.scientificName.toLowerCase().includes(search.toLowerCase()) ||
      item.crops.some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchType = selectedType === "all" || item.type === selectedType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Crop Health & Diagnostic Library</h2>
              <p className="text-xs text-emerald-200">Scientific Pest, Disease & Nutrient Deficiency Compendium</p>
            </div>
          </div>
          <DataBadge status="STATIC REFERENCE" detail="ICAR / TNAU Registry" />
        </div>

        {/* Search Bar */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by pest, disease, symptom, or crop (e.g. Blast, Stem borer, Paddy)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/95 text-zinc-900 text-xs placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { id: "all", label: "All Diagnoses" },
          { id: "disease", label: "Fungal / Bacterial Diseases" },
          { id: "pest", label: "Insect Pests" },
          { id: "deficiency", label: "Nutrient Deficiencies" }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedType(cat.id)}
            className={`px-3 py-1.5 rounded-full font-bold transition-colors border ${
              selectedType === cat.id
                ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(entry => (
          <div
            key={entry.id}
            onClick={() => setSelectedEntry(entry)}
            className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs hover:border-emerald-500 transition-all cursor-pointer space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block mb-1 ${
                  entry.type === "disease"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : entry.type === "pest"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  {entry.pathogenType || entry.type.toUpperCase()} • {entry.crops.join(", ")}
                </span>
                <h3 className="font-bold text-sm text-zinc-900 leading-snug">{entry.name}</h3>
                <p className="text-[11px] text-zinc-500 italic">{entry.scientificName}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                entry.severity === "Critical" 
                  ? "bg-rose-100 text-rose-800" 
                  : entry.severity === "High" 
                    ? "bg-amber-100 text-amber-800" 
                    : "bg-blue-100 text-blue-800"
              }`}>
                {entry.severity}
              </span>
            </div>

            <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 text-xs text-zinc-700 space-y-1">
              <strong className="text-zinc-900 block text-[11px]">Primary Identification:</strong>
              <p className="line-clamp-2 text-[11px] leading-relaxed">{entry.identification}</p>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
              <span className="text-[11px] text-zinc-500">Stages: {entry.affectedStages.join(", ")}</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                View Protocol <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedEntry.type.toUpperCase()} • {selectedEntry.crops.join(", ")}
                </span>
                <h3 className="font-extrabold text-base text-zinc-900 mt-1">{selectedEntry.name}</h3>
                <p className="text-zinc-500 italic">{selectedEntry.scientificName}</p>
              </div>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="text-zinc-400 hover:text-zinc-700 text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Diagnostic Symptoms */}
            <div className="space-y-1.5">
              <strong className="text-zinc-800 uppercase tracking-wide block flex items-center gap-1.5 text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Symptoms & Field Damage Indicators
              </strong>
              <ul className="space-y-1 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                {selectedEntry.symptoms.map((sym, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>{sym}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Causes */}
            <div className="space-y-1.5">
              <strong className="text-zinc-800 uppercase tracking-wide block text-xs">Predisposing Environmental Conditions:</strong>
              <ul className="space-y-1 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                {selectedEntry.causes.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preventive & Treatment */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2">
              <strong className="text-emerald-950 uppercase tracking-wide block flex items-center gap-1.5 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Scientific Treatment & Dosage
              </strong>
              <p className="text-zinc-800 leading-relaxed font-medium bg-white p-2 rounded-lg border border-emerald-100">
                {selectedEntry.treatment}
              </p>

              <div className="pt-1">
                <strong className="text-emerald-900 block text-[11px] mb-1">Preventive Agronomic Measures:</strong>
                <ul className="space-y-1 text-zinc-700">
                  {selectedEntry.prevention.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px]">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Chemical Safety Guidance */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Chemical Safety & Pre-Harvest Interval (PHI)
              </div>
              <p>{selectedEntry.safetyGuidance}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[10px] text-zinc-500">
              <span>Source: {selectedEntry.reference}</span>
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-900 text-white font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
