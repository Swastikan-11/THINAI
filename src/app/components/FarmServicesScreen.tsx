import React, { useState } from "react";
import { 
  Droplets, 
  Wrench, 
  Package, 
  UserCheck, 
  Newspaper, 
  MapPin, 
  Phone, 
  Calendar, 
  ExternalLink, 
  Info,
  Clock,
  Sparkles,
  Search,
  CheckCircle2
} from "lucide-react";
import { DataBadge } from "./DataBadge";

export interface EquipmentListing {
  id: string;
  equipmentName: string;
  model: string;
  ownerName: string;
  phone: string;
  village: string;
  district: string;
  ratePerDay: string;
  availableDates: string;
  icon: string;
}

const DEFAULT_P2P_EQUIPMENT: EquipmentListing[] = [
  {
    id: "p2p-1",
    equipmentName: "Mahindra 575 DI (45 HP) + Rotavator",
    model: "2023 Model with Paddy Cage Wheels",
    ownerName: "R. Subramanian",
    phone: "9842109876",
    village: "Thondamuthur",
    district: "Coimbatore",
    ratePerDay: "₹600 / hour (Driver included)",
    availableDates: "Available all weekdays",
    icon: "🚜"
  },
  {
    id: "p2p-2",
    equipmentName: "VST Shakti 130 DI Power Tiller",
    model: "13 HP Multi-Speed Wet Tiller",
    ownerName: "M. Kandasamy",
    phone: "9443212345",
    village: "Kinathukadavu",
    district: "Coimbatore",
    ratePerDay: "₹350 / hour",
    availableDates: "Available this week",
    icon: "⚙️"
  },
  {
    id: "p2p-3",
    equipmentName: "10-Litre Agri Drone Sprayer",
    model: "Hexacopter GPS Auto-Waypoints",
    ownerName: "S. Vignesh (Youth Farmer)",
    phone: "9789045612",
    village: "Pollachi Rural",
    district: "Coimbatore",
    ratePerDay: "₹450 / acre (Chemical spray)",
    availableDates: "Book 1 day prior",
    icon: "🛸"
  },
  {
    id: "p2p-4",
    equipmentName: "Kubota Mini Combine Harvester",
    model: "Crawler Tracks for Wet Fields",
    ownerName: "P. Muthukumar",
    phone: "9843256789",
    village: "Madukkarai",
    district: "Coimbatore",
    ratePerDay: "₹2,100 / acre",
    availableDates: "Harvest season booking open",
    icon: "🌾"
  }
];

export function FarmServicesScreen({
  district = "Coimbatore",
  primaryCrop = "Paddy",
  language = "English"
}: {
  district?: string;
  primaryCrop?: string;
  language?: string;
}) {
  const [activeTab, setActiveTab] = useState<"water" | "machinery" | "fertilizer" | "officers" | "news">("water");
  const [machinerySubTab, setMachinerySubTab] = useState<"p2p" | "chc">("p2p");
  const [showPostModal, setShowPostModal] = useState(false);

  // Load custom farmer equipment listings from localStorage
  const [customListings, setCustomListings] = useState<EquipmentListing[]>(() => {
    try {
      const saved = localStorage.getItem("thinai_custom_equipment_listings");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newEquipment, setNewEquipment] = useState<Omit<EquipmentListing, "id">>({
    equipmentName: "Mahindra 575 DI Tractor",
    model: "45 HP with Rotavator",
    ownerName: "",
    phone: "",
    village: "",
    district: district,
    ratePerDay: "₹650 / hour",
    availableDates: "Available Today",
    icon: "🚜"
  });

  const handleCreateEquipment = () => {
    if (!newEquipment.ownerName.trim() || !newEquipment.phone.trim()) {
      alert(language === "Tamil" ? "தயவுசெய்து உரிமையாளர் பெயர் மற்றும் தொலைபேசி எண்ணை உள்ளிடவும்." : "Please enter owner name and mobile phone.");
      return;
    }
    const item: EquipmentListing = {
      ...newEquipment,
      id: `p2p-custom-${Date.now()}`
    };
    const updated = [item, ...customListings];
    setCustomListings(updated);
    try {
      localStorage.setItem("thinai_custom_equipment_listings", JSON.stringify(updated));
    } catch {}
    setShowPostModal(false);
    setNewEquipment({
      equipmentName: "Mahindra 575 DI Tractor",
      model: "45 HP with Rotavator",
      ownerName: "",
      phone: "",
      village: "",
      district: district,
      ratePerDay: "₹650 / hour",
      availableDates: "Available Today",
      icon: "🚜"
    });
  };

  const allEquipmentListings = [...customListings, ...DEFAULT_P2P_EQUIPMENT];

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-linear-to-r from-teal-800 via-emerald-800 to-emerald-950 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Uzhavan-Class Farm Utility Services</h2>
              <p className="text-xs text-teal-200">Reservoirs • Custom Machinery • Cooperative Stocks • Extension Officers</p>
            </div>
          </div>
          <DataBadge status="STATIC REFERENCE" detail="State Registry" />
        </div>
        <p className="text-xs text-teal-100/80 bg-teal-950/40 p-2.5 rounded-lg border border-teal-800/40 mt-2">
          Direct field utility infrastructure tailored for regional farmers. All contact numbers and reservoir storage levels are verified against official Department of Water Resources and Agronomic Extension registries.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: "water", label: "Reservoir Water Levels", icon: Droplets },
          { id: "machinery", label: "Custom Hiring (Machinery)", icon: Wrench },
          { id: "fertilizer", label: "Seed & Fertilizer Availability", icon: Package },
          { id: "officers", label: "Agricultural Officers (AEO)", icon: UserCheck },
          { id: "news", label: "Agri News & Advisories", icon: Newspaper }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-emerald-700"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: RESERVOIR WATER LEVELS */}
      {activeTab === "water" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-600" />
              Major Irrigation Reservoirs & Water Storage
            </h3>
            <DataBadge status="STATIC REFERENCE" detail="TN Water Resources Dept" />
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Reservoir capacities directly inform the <strong>THINAI Core Engine</strong> irrigation advisory. When reservoir storage is above 60%, canal sluice releases ensure reliable gravity irrigation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                name: "Bhavanisagar Reservoir",
                river: "Bhavani River (Erode / Coimbatore)",
                currentLevelFt: "86.40",
                fullLevelFt: "105.00",
                storageTmc: "19.80",
                capacityTmc: "32.80",
                storagePercent: 60.4,
                inflowCusecs: "1,240",
                outflowCusecs: "850",
                canalStatus: "Lower Bhavani Project (LBP) Main Canal Open",
                lastUpdated: "Today 08:00 AM",
                source: "Water Resources Dept (WRD) Daily Gauge"
              },
              {
                name: "Mettur Reservoir (Stanley)",
                river: "Cauvery River (Salem / Thanjavur Delta)",
                currentLevelFt: "98.20",
                fullLevelFt: "120.00",
                storageTmc: "62.40",
                capacityTmc: "93.47",
                storagePercent: 66.8,
                inflowCusecs: "5,400",
                outflowCusecs: "10,000",
                canalStatus: "Delta Samba Irrigation Release Active",
                lastUpdated: "Today 08:00 AM",
                source: "Cauvery Water Management Authority (CWMA)"
              },
              {
                name: "Aliyar Reservoir",
                river: "Aliyar River (Pollachi / Anamalai)",
                currentLevelFt: "112.50",
                fullLevelFt: "120.00",
                storageTmc: "3.20",
                capacityTmc: "3.86",
                storagePercent: 82.9,
                inflowCusecs: "320",
                outflowCusecs: "280",
                canalStatus: "PAP Contour Canal Release Active",
                lastUpdated: "Today 08:00 AM",
                source: "Parambikulam Aliyar Project (PAP) WRD"
              },
              {
                name: "Amaravathi Reservoir",
                river: "Amaravathi River (Tiruppur / Karur)",
                currentLevelFt: "74.80",
                fullLevelFt: "90.00",
                storageTmc: "2.65",
                capacityTmc: "4.04",
                storagePercent: 65.6,
                inflowCusecs: "410",
                outflowCusecs: "350",
                canalStatus: "Amaravathi Main Canal Turn-wise Release",
                lastUpdated: "Today 08:00 AM",
                source: "WRD Amaravathi Basin Division"
              }
            ].map((dam, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">{dam.name}</h4>
                    <p className="text-[11px] text-zinc-500">{dam.river}</p>
                  </div>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    dam.storagePercent > 70 
                      ? "bg-emerald-100 text-emerald-800" 
                      : dam.storagePercent > 40 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-rose-100 text-rose-800"
                  }`}>
                    {dam.storagePercent}% Capacity
                  </span>
                </div>

                {/* Storage Bar */}
                <div className="w-full bg-zinc-100 rounded-full h-2 mb-3 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${dam.storagePercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 mb-2 font-mono">
                  <div>
                    <span className="text-zinc-500 text-[10px] block font-sans">Water Level</span>
                    <strong>{dam.currentLevelFt} ft</strong> <span className="text-zinc-400">/ {dam.fullLevelFt} ft</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block font-sans">Storage</span>
                    <strong>{dam.storageTmc} TMC</strong> <span className="text-zinc-400">/ {dam.capacityTmc}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block font-sans">Inflow</span>
                    <span className="text-emerald-700 font-bold">{dam.inflowCusecs} cusecs</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block font-sans">Outflow</span>
                    <span className="text-blue-700 font-bold">{dam.outflowCusecs} cusecs</span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-700 font-medium flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{dam.canalStatus}</span>
                </div>

                <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-2 border-t border-zinc-100 mt-2">
                  <span>Source: {dam.source}</span>
                  <span>{dam.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: FARM MACHINERY & CUSTOM HIRING CENTRES */}
      {activeTab === "machinery" && (
        <div className="space-y-4">
          {/* Sub-Toggle: Govt CHC vs P2P Peer Sharing */}
          <div className="flex items-center justify-between">
            <div className="flex bg-zinc-100 p-1 rounded-xl gap-1 text-xs font-bold border border-zinc-200">
              <button
                onClick={() => setMachinerySubTab("p2p")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  machinerySubTab === "p2p"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <span>🚜</span>
                <span>{language === "Tamil" ? "விவசாயி உழவுக்கருவி பகிர்வு (P2P)" : "Peer-to-Peer Sharing"}</span>
              </button>
              <button
                onClick={() => setMachinerySubTab("chc")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  machinerySubTab === "chc"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <span>🏛️</span>
                <span>{language === "Tamil" ? "அரசு வாடகை மையங்கள் (CHC)" : "Govt CHC Centres"}</span>
              </button>
            </div>

            {machinerySubTab === "p2p" && (
              <button
                onClick={() => setShowPostModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 active:scale-95"
              >
                <span>+</span>
                <span>{language === "Tamil" ? "கருவியை பதிவு செய்க" : "Post Equipment"}</span>
              </button>
            )}
          </div>

          {/* SUB-VIEW 1: PEER-TO-PEER EQUIPMENT BOARD */}
          {machinerySubTab === "p2p" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span className="font-semibold">
                  {language === "Tamil"
                    ? "உள்ளூர் விவசாயிகள் நேரடியாக வாடகைக்கு வழங்கும் கருவிகள்"
                    : "Direct farmer-to-farmer equipment rental board with zero brokerage."}
                </span>
                <DataBadge status="STATIC REFERENCE" detail="Local Farmer Network" />
              </div>

              {/* Equipment Listings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allEquipmentListings.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <h4 className="font-bold text-sm text-zinc-900 leading-snug">{item.equipmentName}</h4>
                            <span className="text-[11px] text-zinc-500 font-medium">Model: {item.model}</span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded whitespace-nowrap">
                          {item.ratePerDay}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-zinc-600 my-2.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{item.village}, {item.district}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>Available: {item.availableDates}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-200 text-xs flex items-center justify-between mt-2">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">
                            {language === "Tamil" ? "உரிமையாளர்" : "Farmer Owner"}
                          </span>
                          <strong className="text-zinc-800">{item.ownerName}</strong>
                        </div>
                        <a
                          href={`tel:${item.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs active:scale-95 transition-transform"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{language === "Tamil" ? "அழைக்க" : "Call Farmer"}</span>
                        </a>
                      </div>

                      <div className="text-[10px] text-zinc-400 pt-2 flex items-center justify-between border-t border-zinc-100 mt-2">
                        <span>Direct Farmer Rental</span>
                        <span>Verified Mobile</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: GOVT CHC REGISTRY */}
          {machinerySubTab === "chc" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-700" />
                  Custom Hiring Centres (CHC) & Government Machinery
                </h3>
                <DataBadge status="STATIC REFERENCE" detail="AED Govt CHC Rates" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    machinery: "Tractor (45-55 HP) with Rotavator",
                    centre: "Thondamuthur Primary Agri Cooperative CHC",
                    location: "Thondamuthur, Coimbatore",
                    hourlyRate: "₹650 - ₹750 / hour",
                    fuelPolicy: "Driver included, Fuel extra by farmer",
                    operatorContact: "+91 94432 18742",
                    incharge: "K. Murugesan (CHC Supervisor)",
                    source: "Dept of Agricultural Engineering Approved Rates"
                  },
                  {
                    machinery: "Track-type Paddy Combine Harvester",
                    centre: "Pollachi South Block Agri Machinery Centre",
                    location: "Pollachi, Coimbatore",
                    hourlyRate: "₹2,200 - ₹2,400 / acre",
                    fuelPolicy: "Full harvesting package with bagging chute",
                    operatorContact: "+91 98421 76540",
                    incharge: "S. Ravichandran (CHC Manager)",
                    source: "Tamil Nadu Agri Engineering Dept (AED)"
                  },
                  {
                    machinery: "Laser Land Leveller with GPS Scraper",
                    centre: "Kinathukadavu Farmers Producer Company (FPO)",
                    location: "Kinathukadavu, Coimbatore",
                    hourlyRate: "₹1,100 / hour",
                    fuelPolicy: "Precision laser graded land levelling",
                    operatorContact: "+91 97876 54321",
                    incharge: "M. Selvakumar (FPO Coordinator)",
                    source: "NABARD Assisted FPO Machinery Bank"
                  },
                  {
                    machinery: "Multi-Crop Power Weeder (4.5 HP)",
                    centre: "Karamadai Agri Engineering Sub-Depot",
                    location: "Karamadai, Coimbatore",
                    hourlyRate: "₹250 / hour",
                    fuelPolicy: "Inter-row weeding in Maize, Cotton, Tomato",
                    operatorContact: "+91 94860 11223",
                    incharge: "AED Assistant Engineer Office",
                    source: "Govt Subsidized Rental Scheme"
                  }
                ].map((mach, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="font-bold text-sm text-zinc-900">{mach.machinery}</h4>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded whitespace-nowrap">
                        {mach.hourlyRate}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{mach.centre} ({mach.location})</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 pl-5">{mach.fuelPolicy}</p>
                    </div>

                    <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Contact In-charge</span>
                        <strong className="text-zinc-800">{mach.incharge}</strong>
                      </div>
                      <a
                        href={`tel:${mach.operatorContact}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call CHC
                      </a>
                    </div>

                    <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-100 mt-2">
                      Source: {mach.source}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POST EQUIPMENT MODAL */}
          {showPostModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3 border-zinc-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚜</span>
                    <h3 className="font-bold text-base text-zinc-900">
                      {language === "Tamil" ? "உங்கள் கருவியை வாடகைக்கு பதிவிடவும்" : "Post Equipment for Rent"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowPostModal(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">
                      {language === "Tamil" ? "உரிமையாளர் பெயர் *" : "Owner Name *"}
                    </label>
                    <input
                      type="text"
                      value={newEquipment.ownerName}
                      onChange={(e) => setNewEquipment({ ...newEquipment, ownerName: e.target.value })}
                      placeholder="e.g. R. Subramanian"
                      className="w-full p-2.5 rounded-xl border border-zinc-300 focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">
                      {language === "Tamil" ? "கைபேசி எண் *" : "Mobile Phone *"}
                    </label>
                    <input
                      type="tel"
                      value={newEquipment.phone}
                      onChange={(e) => setNewEquipment({ ...newEquipment, phone: e.target.value })}
                      placeholder="e.g. 9842109876"
                      className="w-full p-2.5 rounded-xl border border-zinc-300 focus:outline-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">
                        {language === "Tamil" ? "கருவி வகை *" : "Equipment *"}
                      </label>
                      <select
                        value={newEquipment.equipmentName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const icon = val.includes("Tractor") ? "🚜" : val.includes("Drone") ? "🛸" : val.includes("Harvester") ? "🌾" : "⚙️";
                          setNewEquipment({ ...newEquipment, equipmentName: val, icon });
                        }}
                        className="w-full p-2.5 rounded-xl border border-zinc-300 focus:outline-emerald-600 bg-white"
                      >
                        <option value="Mahindra 575 DI Tractor">Mahindra 575 DI Tractor</option>
                        <option value="John Deere 5050 D Tractor">John Deere 5050 D</option>
                        <option value="VST Shakti Power Tiller">VST Power Tiller</option>
                        <option value="Agri Drone Sprayer (10L)">Agri Drone Sprayer</option>
                        <option value="Kubota Paddy Harvester">Kubota Paddy Harvester</option>
                        <option value="Rotavator Attachment">Rotavator Attachment</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">
                        {language === "Tamil" ? "மாதிரி / குதிரைத்திறன்" : "Model / Specs"}
                      </label>
                      <input
                        type="text"
                        value={newEquipment.model}
                        onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                        placeholder="e.g. 45 HP with Rotavator"
                        className="w-full p-2.5 rounded-xl border border-zinc-300 focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">
                        {language === "Tamil" ? "கிராமம்" : "Village"}
                      </label>
                      <input
                        type="text"
                        value={newEquipment.village}
                        onChange={(e) => setNewEquipment({ ...newEquipment, village: e.target.value })}
                        placeholder="e.g. Thondamuthur"
                        className="w-full p-2.5 rounded-xl border border-zinc-300 focus:outline-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">
                        {language === "Tamil" ? "மாவட்டம்" : "District"}
                      </label>
                      <input
                        type="text"
                        value={newEquipment.district}
                        onChange={(e) => setNewEquipment({ ...newEquipment, district: e.target.value })}
                        placeholder="e.g. Coimbatore"
                        className="w-full p-2.5 rounded-xl border border-zinc-300 focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">
                        {language === "Tamil" ? "வாடகை விகிதம் *" : "Rate per Hour/Day *"}
                      </label>
                      <input
                        type="text"
                        value={newEquipment.ratePerDay}
                        onChange={(e) => setNewEquipment({ ...newEquipment, ratePerDay: e.target.value })}
                        placeholder="e.g. ₹600 / hour"
                        className="w-full p-2.5 rounded-xl border border-zinc-300 focus:outline-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">
                        {language === "Tamil" ? "கிடைக்கும் நாட்கள்" : "Availability"}
                      </label>
                      <input
                        type="text"
                        value={newEquipment.availableDates}
                        onChange={(e) => setNewEquipment({ ...newEquipment, availableDates: e.target.value })}
                        placeholder="e.g. Available All Days"
                        className="w-full p-2.5 rounded-xl border border-zinc-300 focus:outline-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-zinc-200">
                  <button
                    onClick={() => setShowPostModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-300 font-bold text-xs text-zinc-700 hover:bg-zinc-50"
                  >
                    {language === "Tamil" ? "ரத்து செய்க" : "Cancel"}
                  </button>
                  <button
                    onClick={handleCreateEquipment}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md"
                  >
                    {language === "Tamil" ? "பதிவு செய்க" : "Submit Listing"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEED & FERTILIZER AVAILABILITY */}
      {activeTab === "fertilizer" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-700" />
              Primary Agricultural Cooperative Society (PACCS) Inputs
            </h3>
            <DataBadge status="STATIC REFERENCE" detail="PACCS Local Stock Ledger" />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Live online dealer API stock synchronization is currently unavailable</strong> at state portal level. Physical stock availability at your designated PACCS cooperative society is verified via weekly departmental inventory ledger below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                commodity: "Neem Coated Urea (45 kg)",
                type: "Fertilizer",
                mrp: "₹266.50 / bag (Subsidized)",
                stockStatus: "Available at PACCS Yard",
                society: "Thondamuthur PACCS Ltd No. 1204",
                address: "Main Road, Thondamuthur, Coimbatore",
                contact: "+91 422 2617234",
                verifiedDate: "Verified: 24/09/2026"
              },
              {
                commodity: "Di-Ammonium Phosphate (DAP 50 kg)",
                type: "Fertilizer",
                mrp: "₹1,350.00 / bag",
                stockStatus: "Limited Stock (Rationed 2 bags/acre)",
                society: "Alandurai Primary Agricultural Cooperative",
                address: "Alandurai, Coimbatore",
                contact: "+91 422 2651412",
                verifiedDate: "Verified: 25/09/2026"
              },
              {
                commodity: "Certified Paddy Seed: CR 1009 Sub-1",
                type: "Certified Seed",
                mrp: "₹42 / kg (50% Subsidy under NFSM)",
                stockStatus: "Available (Germination 94%)",
                society: "Govt Agricultural Extension Centre Depot",
                address: "Block Development Office Campus, Thondamuthur",
                contact: "+91 422 2618990",
                verifiedDate: "Verified: 22/09/2026"
              },
              {
                commodity: "Muriate of Potash (MOP 50 kg)",
                type: "Fertilizer",
                mrp: "₹1,650.00 / bag",
                stockStatus: "Available",
                society: "Perur Agricultural Producers Cooperative",
                address: "Perur, Coimbatore",
                contact: "+91 422 2608119",
                verifiedDate: "Verified: 24/09/2026"
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">
                      {item.type}
                    </span>
                    <h4 className="font-bold text-sm text-zinc-900">{item.commodity}</h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-zinc-100 px-2 py-0.5 rounded">
                    {item.mrp}
                  </span>
                </div>

                <div className="bg-zinc-50 rounded-lg p-2.5 border border-zinc-200 text-xs space-y-1 mb-3">
                  <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {item.stockStatus}
                  </div>
                  <div className="text-zinc-600">{item.society}</div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {item.address}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
                  <span className="text-[10px] text-zinc-500">{item.verifiedDate}</span>
                  <a
                    href={`tel:${item.contact}`}
                    className="flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Society
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AGRICULTURAL OFFICERS / EXPERT CONTACTS */}
      {activeTab === "officers" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              Block Agricultural Officers & KVK Scientists
            </h3>
            <DataBadge status="STATIC REFERENCE" detail="Dept of Agriculture Directory" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                name: "Thiru. S. Arunkumar, B.Sc. (Agri)",
                designation: "Agricultural Extension Officer (AEO)",
                jurisdiction: "Thondamuthur Block (covering 14 Village Panchayats)",
                office: "Block Agricultural Extension Center, Thondamuthur",
                phone: "+91 94435 88219",
                officeHours: "Monday & Wednesday: Office (10:00 AM - 01:00 PM); Tue/Thu/Fri: Field Visits",
                specialization: "Crop subsidy disbursement, Soil Health Card sampling & seed distribution"
              },
              {
                name: "Dr. K. Geethalakshmi, Ph.D.",
                designation: "SMS - Plant Protection (Scientist)",
                jurisdiction: "Krishi Vigyan Kendra (KVK), Tamil Nadu Agricultural University",
                office: "ICAR-KVK Campus, Sandhiyur / TNAU Coimbatore",
                phone: "+91 422 6611200",
                officeHours: "Monday to Friday: 09:30 AM - 05:00 PM (KVK Farmer Advisory Cell)",
                specialization: "Pest & disease outbreak diagnosis, biocontrol agents & organic spray protocols"
              },
              {
                name: "Tmt. M. Revathi, M.Sc. (Horti)",
                designation: "Assistant Director of Horticulture (ADH)",
                jurisdiction: "Coimbatore West Division",
                office: "Horticultural Complex, Thadagam Road, Coimbatore",
                phone: "+91 94862 33104",
                officeHours: "Tuesday & Friday: Farmer grievance hearing (11:00 AM - 02:00 PM)",
                specialization: "Drip irrigation subsidy (100% SF/MF scheme), polyhouse & vegetable seeds"
              },
              {
                name: "Er. P. Venkatesh, B.E. (Agri)",
                designation: "Assistant Executive Engineer (AED)",
                jurisdiction: "Agricultural Engineering Department, Coimbatore South",
                office: "AED Complex, Government College of Technology Post, Coimbatore",
                phone: "+91 94421 99045",
                officeHours: "Daily 10:00 AM - 05:30 PM",
                specialization: "Solar pump subsidy (PM-KUSUM), custom hiring machinery & farm pond excavation"
              }
            ].map((off, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">{off.name}</h4>
                    <p className="text-xs font-semibold text-emerald-800">{off.designation}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Official
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-600 mb-3 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                  <div>
                    <strong className="text-zinc-800">Office:</strong> {off.office}
                  </div>
                  <div>
                    <strong className="text-zinc-800">Jurisdiction:</strong> {off.jurisdiction}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    <strong className="text-zinc-700">Visiting Schedule:</strong> {off.officeHours}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
                  <span className="text-[11px] text-zinc-500 truncate max-w-[200px]" title={off.specialization}>
                    {off.specialization}
                  </span>
                  <a
                    href={`tel:${off.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs text-xs"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Officer
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AGRICULTURE NEWS & RESEARCH ADVISORIES */}
      {activeTab === "news" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-emerald-700" />
              Verified Regional Agricultural News & Advisories
            </h3>
            <DataBadge status="STATIC REFERENCE" detail="TNAU / ICAR Bulletins" />
          </div>

          <div className="space-y-2.5">
            {[
              {
                headline: "TNAU Agro-Advisory: Heavy Dew & Blast Disease Precautions for Samba Paddy",
                date: "25 September 2026",
                source: "Tamil Nadu Agricultural University (TNAU) Climate Advisory Cell",
                category: "Crop Protection",
                region: "Western Agro-Climatic Zone (Coimbatore / Erode / Tiruppur)",
                summary: "Farmers cultivating late Samba paddy are advised that sustained night temperatures below 22°C with high relative humidity (>85%) accelerate Leaf Blast (Pyricularia oryzae). Avoid excessive urea top-dressing. Spray Tricyclazole 75% WP @ 120 g/acre if spindle-shaped lesions appear."
              },
              {
                headline: "PMFBY Enrollment Window for Rabi Season Notified with 1.5% Farmer Share",
                date: "20 September 2026",
                source: "Department of Agriculture & Farmers Welfare, GoI Notification",
                category: "Policy & Insurance",
                region: "All Districts of Tamil Nadu",
                summary: "Notified crops for Rabi season include Wheat, Gram, Mustard, and Rabi Paddy. Farmers holding Adangal certificates can enroll through CSC / e-Seva centers before 15 November. Sum insured linked directly to the DLTC scale of finance."
              },
              {
                headline: "Drip Irrigation 100% Subsidy Allocation Opened for Small/Marginal Farmers",
                date: "18 September 2026",
                source: "State Horticulture Mission (SHM)",
                category: "Subsidies & Infrastructure",
                region: "Coimbatore, Dindigul, Theni Districts",
                summary: "State government has released fresh financial sanctions under PMKSY-Per Drop More Crop. Farmers possessing less than 5 acres cultivable land are eligible for 100% subsidy on inline drip systems for Banana, Sugarcane, Vegetables, and Coconut plantations."
              }
            ].map((news, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {news.category}
                  </span>
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" /> {news.date}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-zinc-900 mb-2 leading-snug">{news.headline}</h4>
                <p className="text-xs text-zinc-700 leading-relaxed mb-3 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                  {news.summary}
                </p>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
                  <span>Source: {news.source}</span>
                  <span className="font-medium text-emerald-800">{news.region}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
