import React, { useState } from "react";
import { Award, ShieldAlert, ExternalLink, CheckCircle, FileText, Calendar, Filter, ChevronRight, AlertCircle, Info } from "lucide-react";
import { DataBadge } from "./DataBadge";

interface Scheme {
  id: string;
  name: string;
  department: string;
  category: "subsidy" | "insurance" | "irrigation" | "inputs" | "machinery";
  eligibility: string;
  benefit: string;
  documents: string[];
  portalUrl: string;
  verifiedDate: string;
  maxSubsidy: string;
  isInsurance?: boolean;
}

const SCHEMES_DATA: Scheme[] = [
  {
    id: "pmfby-insurance",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    department: "Ministry of Agriculture & Farmers Welfare, GoI",
    category: "insurance",
    eligibility: "Farmers growing notified crops in notified areas (both loanee and non-loanee farmers).",
    benefit: "Comprehensive insurance against non-preventable natural risks (drought, flood, pest/disease attack). Premium: 2% for Kharif, 1.5% for Rabi crops.",
    documents: ["Aadhaar Card", "Land Possession Certificate / Patta Chitta", "Bank Passbook with IFSC", "Sowing Certificate / Adangal"],
    portalUrl: "https://pmfby.gov.in/",
    verifiedDate: "15/06/2024",
    maxSubsidy: "Sum insured based on District Level Technical Committee (DLTC) scale of finance",
    isInsurance: true
  },
  {
    id: "pm-kisan",
    name: "PM-KISAN Samman Nidhi",
    department: "Department of Agriculture & Farmers Welfare, GoI",
    category: "subsidy",
    eligibility: "All landholding farmer families having cultivable landholding in their names.",
    benefit: "Direct financial support of ₹6,000 per year transferred in three equal four-monthly installments of ₹2,000 directly into Aadhaar-seeded bank accounts.",
    documents: ["Aadhaar Card", "Land Ownership Documents (Patta Chitta)", "Aadhaar Linked Bank Account"],
    portalUrl: "https://pmkisan.gov.in/",
    verifiedDate: "01/02/2025",
    maxSubsidy: "₹6,000 / year"
  },
  {
    id: "tn-micro-irrigation",
    name: "Tamil Nadu Micro Irrigation Subsidy Scheme (PMKSY-PDMC)",
    department: "Department of Horticulture & Plantation Crops, Tamil Nadu",
    category: "irrigation",
    eligibility: "Small and marginal farmers holding agricultural land with assured irrigation water source.",
    benefit: "100% subsidy for Small & Marginal farmers (up to 5 acres); 75% subsidy for other category farmers for installing Drip and Sprinkler irrigation systems.",
    documents: ["Patta Chitta", "FMB Sketch", "Soil & Water Test Certificate", "Aadhaar Card", "Bank Passbook", "Small/Marginal Farmer Certificate"],
    portalUrl: "https://tnhorticulture.tn.gov.in/microscheme",
    verifiedDate: "10/01/2025",
    maxSubsidy: "100% subsidy for SF/MF (Max ₹1.2 Lakh/ha)"
  },
  {
    id: "smam-machinery",
    name: "Sub-Mission on Agricultural Mechanization (SMAM)",
    department: "Agricultural Engineering Department",
    category: "machinery",
    eligibility: "Individual farmers, Farmer Groups, and Primary Agricultural Cooperative Societies.",
    benefit: "40% to 50% subsidy on purchase of agricultural machinery (Tractors, Power Tillers, Combine Harvesters, Rotavators).",
    documents: ["Aadhaar Card", "Land Patta", "Community Certificate", "Bank Account Details", "Quotation from Authorized Dealer"],
    portalUrl: "https://agrimachinery.nic.in/",
    verifiedDate: "20/11/2024",
    maxSubsidy: "40% - 50% of machine invoice value"
  },
  {
    id: "soil-health-card",
    name: "Soil Health Card Scheme",
    department: "Department of Agriculture, GoI",
    category: "inputs",
    eligibility: "Every registered farmer having farm plot.",
    benefit: "Free testing of 12 soil nutrient parameters (N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, OC) and customized dosage recommendations every 2 years.",
    documents: ["Farmer ID / Aadhaar", "Field Survey Number / Plot Coordinates"],
    portalUrl: "https://soilhealth.dac.gov.in/",
    verifiedDate: "05/01/2025",
    maxSubsidy: "100% Free Testing & Advisory"
  }
];

export function SchemesScreen({ 
  primaryCrop = "Paddy", 
  farmSize = "2.0" 
}: { 
  primaryCrop?: string; 
  farmSize?: string;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  const filteredSchemes = filter === "all" 
    ? SCHEMES_DATA 
    : SCHEMES_DATA.filter(s => s.category === filter);

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-900 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Government Schemes & Crop Insurance</h2>
              <p className="text-xs text-emerald-200">Central & State Agricultural Support Programs</p>
            </div>
          </div>
          <DataBadge status="STATIC REFERENCE" detail="Verified Portals" />
        </div>

        {/* Disclaimer */}
        <div className="bg-emerald-950/60 border border-emerald-700/50 rounded-lg p-2.5 mt-3 text-xs flex items-start gap-2 text-emerald-100">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            Eligibility indicators below denote <strong>Potentially Eligible</strong> based on your profile ({farmSize} acres • {primaryCrop}). Official approval is granted solely by the respective government authority upon physical document verification.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: "all", label: "All Programs" },
          { id: "insurance", label: "Crop Insurance (PMFBY)" },
          { id: "subsidy", label: "Direct Income Support" },
          { id: "irrigation", label: "Micro Irrigation" },
          { id: "machinery", label: "Farm Machinery" },
          { id: "inputs", label: "Soil & Inputs" }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors border ${
              filter === cat.id
                ? "bg-emerald-700 text-white border-emerald-800"
                : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Schemes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredSchemes.map(scheme => (
          <div 
            key={scheme.id}
            className={`bg-white rounded-xl border p-4 shadow-xs hover:border-emerald-500 transition-all cursor-pointer ${
              scheme.isInsurance ? "border-amber-300 bg-amber-50/20" : "border-zinc-200"
            }`}
            onClick={() => setSelectedScheme(scheme)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block mb-1">
                  {scheme.category.toUpperCase()}
                </span>
                <h3 className="font-bold text-sm text-zinc-900 leading-snug">{scheme.name}</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
                Potentially Eligible
              </span>
            </div>

            <p className="text-xs text-zinc-600 line-clamp-2 mb-3">{scheme.benefit}</p>

            <div className="bg-zinc-50 rounded-lg p-2 text-xs border border-zinc-100 space-y-1 mb-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500 font-medium">Max Benefit / Subsidy:</span>
                <span className="font-bold text-emerald-800">{scheme.maxSubsidy}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>Verified: {scheme.verifiedDate}</span>
                <span>{scheme.department.slice(0, 30)}...</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                View Requirements <ChevronRight className="w-3.5 h-3.5" />
              </span>
              <a
                href={scheme.portalUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-emerald-700 underline"
              >
                Official Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedScheme.category.toUpperCase()}
                </span>
                <h3 className="font-bold text-base text-zinc-900 mt-1">{selectedScheme.name}</h3>
                <p className="text-xs text-zinc-500">{selectedScheme.department}</p>
              </div>
              <button 
                onClick={() => setSelectedScheme(null)}
                className="text-zinc-400 hover:text-zinc-700 text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs">
              <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-700" />
                Status: Potentially Eligible
              </div>
              <p className="text-blue-950/80 leading-relaxed">{selectedScheme.eligibility}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Key Scheme Benefits</span>
              <p className="text-xs text-zinc-800 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 leading-relaxed">
                {selectedScheme.benefit}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wide flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Mandatory Documentation Required
              </span>
              <ul className="text-xs space-y-1.5 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                {selectedScheme.documents.map((doc, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-zinc-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                Official Application Protocol
              </div>
              <p>
                Applications must be submitted through the official government portal or via the nearest Block Agricultural Extension Center (e-Seva Center).
              </p>
              <div className="text-[10px] text-zinc-500 pt-1">
                Static Reference Data • Last Verified: {selectedScheme.verifiedDate}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => setSelectedScheme(null)}
                className="px-4 py-2 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Close
              </button>
              <a
                href={selectedScheme.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                Open Official Portal <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
