import React, { useState, useEffect } from "react";
import { Layers, Plus, Check, ChevronDown, MapPin, Sprout, X } from "lucide-react";
import { db, LocalField } from "../../services/db";
import { apiClient } from "../../services/apiClient";
import { getCurrentUserId } from "../../services/authService";

interface FieldSelectorProps {
  currentField: LocalField | null;
  onSelectField: (field: LocalField) => void;
  primaryCrop?: string;
  farmSize?: string;
  soilType?: string;
}

export function FieldSelector({
  currentField,
  onSelectField,
  primaryCrop = "Paddy (Rice)",
  farmSize = "2.0",
  soilType = "Clay Loam"
}: FieldSelectorProps) {
  const [fields, setFields] = useState<LocalField[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New field form state
  const [name, setName] = useState("");
  const [area, setArea] = useState("1.0");
  const [crop, setCrop] = useState("Tomato");
  const [soil, setSoil] = useState("Red Soil");
  const [variety, setVariety] = useState("PKM-1");
  const [stage, setStage] = useState("Vegetative");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const uid = getCurrentUserId() || "local-user";
      let localList = await db.fields.where("userId").equals(uid).toArray();

      // If no fields yet exist in db, initialize with default primary field from profile
      if (localList.length === 0) {
        const defaultField: LocalField = {
          id: `field-${uid}-main`,
          farmId: `farm-${uid}-1`,
          userId: uid,
          name: "Main Plot - North",
          areaAcres: parseFloat(farmSize) || 2.0,
          soilType: soilType || "Clay Loam",
          currentCrop: primaryCrop || "Paddy (Rice)",
          cropVariety: "CO 51",
          cropStage: "Tillering Stage",
          updatedAt: new Date().toISOString(),
          synced: false
        };
        await db.fields.put(defaultField);
        localList = [defaultField];
      }

      setFields(localList);
      if (!currentField && localList.length > 0) {
        onSelectField(localList[0]);
      }
    } catch (e) {
      console.warn("Could not load local fields:", e);
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const uid = getCurrentUserId() || "local-user";
      const newField: LocalField = {
        id: `field-${uid}-${Date.now()}`,
        farmId: `farm-${uid}-1`,
        userId: uid,
        name: name.trim(),
        areaAcres: parseFloat(area) || 1.0,
        soilType: soil,
        currentCrop: crop,
        cropVariety: variety,
        cropStage: stage,
        updatedAt: new Date().toISOString(),
        synced: false
      };

      await db.fields.put(newField);
      
      // Attempt backend creation asynchronously if online
      try {
        await apiClient.createField(`farm-${uid}-1`, {
          farm_id: `farm-${uid}-1`,
          name: newField.name,
          area_acres: newField.areaAcres,
          soil_type: newField.soilType,
          current_crop: newField.currentCrop,
          crop_variety: newField.cropVariety,
          crop_stage: newField.cropStage
        });
        await db.fields.update(newField.id, { synced: true });
      } catch (err) {
        // Offline / fallback - will be synced by syncService
      }

      const updated = await db.fields.where("userId").equals(uid).toArray();
      setFields(updated);
      onSelectField(newField);
      setShowAddModal(false);
      setName("");
    } catch (err) {
      console.error("Error creating field:", err);
    } finally {
      setSaving(false);
    }
  };

  const activeField = currentField || fields[0] || null;

  return (
    <div className="relative z-30">
      {/* Field Pill / Selector Trigger */}
      <div className="flex items-center justify-between bg-white/15 backdrop-blur-md rounded-xl p-2 px-3 text-white border border-white/20 shadow-xs">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left flex-1 truncate active:opacity-80"
        >
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <Layers size={14} className="text-white" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-white tracking-wide truncate">
                {activeField ? activeField.name : "Plot 1 - Main"}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-700/70 border border-emerald-400/40 rounded-full font-semibold">
                {activeField?.areaAcres || farmSize} Ac
              </span>
            </div>
            <p className="text-[10px] text-white/80 truncate">
              {activeField ? `${activeField.currentCrop} (${activeField.cropStage})` : primaryCrop}
            </p>
          </div>
          <ChevronDown size={14} className={`text-white/80 transition-transform ml-auto mr-1 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 flex items-center justify-center text-white shrink-0 ml-1.5 shadow-sm"
          title="Add New Field / Plot"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Field Dropdown Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2.5 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Your Plots & Fields</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {fields.length} {fields.length === 1 ? "Plot" : "Plots"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 py-1">
              {fields.map((f) => {
                const isSelected = activeField?.id === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      onSelectField(f);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-emerald-50 border border-emerald-300 text-emerald-950 font-medium"
                        : "hover:bg-gray-50 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                        <Sprout size={16} />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold truncate">{f.name}</p>
                          <span className="text-[10px] text-gray-500 font-normal">({f.areaAcres} Acres)</span>
                        </div>
                        <p className="text-[11px] text-gray-600 truncate">
                          {f.currentCrop} • <span className="text-gray-400">{f.soilType}</span>
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-emerald-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                setShowAddModal(true);
              }}
              className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 active:scale-98 transition-all"
            >
              <Plus size={14} />
              <span>Add Another Field / Plot</span>
            </button>
          </div>
        </>
      )}

      {/* Add Field Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Add New Plot / Field</h3>
                  <p className="text-[11px] text-gray-500">Configure secondary farm plot</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddField} className="flex flex-col gap-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Plot Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Paddy Field / Garden 2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Soil Type</label>
                  <select
                    value={soil}
                    onChange={(e) => setSoil(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                  >
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Red Sandy Loam">Red Sandy Loam</option>
                    <option value="Black Cotton Soil">Black Cotton Soil</option>
                    <option value="Alluvial Soil">Alluvial Soil</option>
                    <option value="Sandy Soil">Sandy Soil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Current Crop</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tomato"
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Crop Variety</label>
                  <input
                    type="text"
                    placeholder="e.g. Hybrid / PKM-1"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Crop Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                >
                  <option value="Sowing / Germination">Sowing / Germination</option>
                  <option value="Vegetative Stage">Vegetative Stage</option>
                  <option value="Tillering Stage">Tillering Stage</option>
                  <option value="Flowering Stage">Flowering Stage</option>
                  <option value="Fruit Formation">Fruit Formation</option>
                  <option value="Maturity / Harvest">Maturity / Harvest</option>
                </select>
              </div>

              <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create Plot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
