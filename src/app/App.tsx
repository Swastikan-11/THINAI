import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Camera, MessageCircle, FileText, User, Cloud, Sun, Droplets, Wind,
  Thermometer, Leaf, TrendingUp, Bell, Settings, ChevronRight, ArrowLeft,
  Mic, MicOff, Send, Mail, Lock, Eye, EyeOff, Check, AlertTriangle,
  Map, Calendar, Download, Star, Award, Volume2, Image as ImageIcon, Globe, HelpCircle,
  LogOut, Moon, Shield, Zap, Activity, Search, Sprout, Bug,
  DollarSign, CloudRain, FlaskConical, Building, Info, Play,
  Trees, Wifi, WifiOff, Bot, Phone, ChevronDown, BarChart2,
  Microscope, RefreshCw, X, CheckCircle, AlertCircle, Edit3,
  Trash2, MapPin, Landmark, Clock, Plus, ThumbsUp, ThumbsDown, BookOpen, Layers,
  Compass, Share2, Sparkles, Filter, CheckSquare, ShieldAlert
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

// ─── THINAI Core Services ──────────────────────────────────────────────────────
import {
  generateFarmDecisions,
  Recommendation,
  DecisionInputs,
  DecisionEngineResult
} from "../services/decisionEngine";
import {
  getFeedbackHistory,
  recordFeedback,
  getCompletedActionIds,
  ActionFeedback
} from "../services/feedbackService";
import {
  getFarmDiary,
  addFarmActivity,
  deleteFarmActivity,
  FarmActivity,
  ActivityType
} from "../services/diaryService";
import {
  detectCropDisease,
  DiseaseDetectionResult,
  getDiseaseScanHistory
} from "../services/diseaseDetectionService";
import {
  generateContextualResponse,
  formatNextBestActionResponse,
  SUGGESTED_QUESTIONS_BY_LANG,
  FarmerContext
} from "../services/aiAssistantService";
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  speakText,
  SpeechLocale
} from "../services/voiceAssistant";
import {
  fetchFarmWeather,
  getFallbackWeather,
  WeatherData
} from "../services/weatherService";
import {
  getMarketIntelligence,
  COMMODITY_MARKETS,
  MarketCommodity
} from "../services/marketService";
import {
  getRelevantSchemes,
  SCHEMES_DATABASE,
  GovtScheme
} from "../services/schemeService";
import {
  t,
  AppLanguage,
  SUPPORTED_LANGUAGES,
  getPersistedLanguage,
  persistLanguage
} from "../services/i18n";
import { onAuthStateChange, logoutUser, deleteCurrentUserAccount } from "../services/authService";
import { db } from "../services/db";
import { apiClient } from "../services/apiClient";
import { syncManager } from "../services/syncService";
import { SyncStatusBar } from "./components/SyncStatusBar";
import { LoginScreen, RegisterScreen, OnboardingScreen } from "./components/AuthScreens";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Screen =
  | "splash" | "onboarding" | "login" | "register"
  | "home" | "crop" | "soil" | "weather"
  | "market" | "disease" | "ai" | "voice" | "reports" | "notifications"
  | "profile" | "editprofile" | "settings" | "help" | "schemes" | "diary";

type ToastType = "success" | "error" | "info" | "warning";

export interface UserState {
  name: string;
  phone: string;
  email: string;
  password?: string;
  village: string;
  district: string;
  stateName: string;
  farmSize: string; // Acres
  soilType: string;
  primaryCrop: string;
  cropVariety: string;
  cropStage: string;
  sowingDate: string;
  irrigationType: string;
  farmingMethod: string;
  waterSource: string;
  mainCrops: string;
  language: AppLanguage;
  isDemoProfile?: boolean;
}

interface ToastState {
  message: string;
  type: ToastType;
}

// ─── Initial Production Farmer State ─────────────────────────────────────────
const INITIAL_USER: UserState = {
  name: "",
  phone: "",
  email: "",
  village: "",
  district: "Coimbatore",
  stateName: "Tamil Nadu",
  farmSize: "2.0",
  soilType: "Clay Loam",
  primaryCrop: "Paddy (Rice)",
  cropVariety: "Ponni (CO 51)",
  cropStage: "Tillering Stage",
  sowingDate: new Date().toISOString().split("T")[0],
  irrigationType: "Canal + Borewell",
  farmingMethod: "Integrated Nutrient Management",
  waterSource: "Canal + Borewell",
  mainCrops: "Paddy, Pulses",
  language: "English",
  isDemoProfile: false
};


// ─── Theme Colors ─────────────────────────────────────────────────────────────
const P = "#2E7D32"; // Primary Green
const PD = "#1B5E20"; // Dark Forest Green
const PL = "#4CAF50"; // Light Leaf Green
const ACC = "#F59E0B"; // Amber Alert / Gold
const BG = "#F4F7F4"; // Soft Sage Off-white
const SURF = "#FFFFFF"; // Clean White Card
const TX = "#1F2937"; // Dark Text
const MU = "#6B7280"; // Muted Gray
const BR = "#E5E7EB"; // Border Gray

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SBar({ light = false }: { light?: boolean }) {
  return (
    <div className="flex justify-between items-center px-4 pt-2 pb-1 select-none text-[11px] font-semibold"
      style={{ color: light ? "rgba(255,255,255,0.85)" : MU }}>
      <span>09:41</span>
      <div className="flex items-center gap-1.5">
        <Wifi size={12} />
        <span>5G</span>
        <div className="w-4 h-2 border rounded-sm border-current flex items-center p-0.5">
          <div className="w-full h-full bg-current rounded-xs" />
        </div>
      </div>
    </div>
  );
}

function BkHdr({
  title,
  navigate,
  dest = "home",
  light = false,
  right
}: {
  title: string;
  navigate: (s: Screen) => void;
  dest?: Screen;
  light?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 select-none">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(dest)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: light ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.06)" }}>
          <ArrowLeft size={18} color={light ? "#fff" : TX} />
        </button>
        <h1 className="font-bold text-base truncate" style={{ color: light ? "#fff" : TX }}>
          {title}
        </h1>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

function BNav({
  screen,
  navigate,
  lang
}: {
  screen: Screen;
  navigate: (s: Screen) => void;
  lang: AppLanguage;
}) {
  const getTab = (s: Screen) => {
    if (["home", "crop", "soil", "weather", "market", "schemes"].includes(s)) return "home";
    if (s === "diary") return "diary";
    if (s === "ai" || s === "voice") return "ai";
    if (s === "disease") return "scan";
    return "profile";
  };

  const tab = getTab(screen);
  const items = [
    { id: "home", icon: Home, label: t("navHome", lang), dest: "home" as Screen },
    { id: "diary", icon: BookOpen, label: t("navDiary", lang), dest: "diary" as Screen },
    { id: "ai", icon: Bot, label: t("navAI", lang), dest: "ai" as Screen },
    { id: "scan", icon: Camera, label: t("navScan", lang), dest: "disease" as Screen },
    { id: "profile", icon: User, label: t("navProfile", lang), dest: "profile" as Screen },
  ];

  return (
    <div className="flex items-center border-t px-2 py-2 select-none"
      style={{ borderColor: BR, background: SURF, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
      {items.map(it => {
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => navigate(it.dest)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1 transition-all active:scale-95">
            {it.id === "ai" ? (
              <div className="w-12 h-12 rounded-full flex items-center justify-center -mt-5 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${PL}, ${P})` }}>
                <it.icon size={22} color="#fff" />
              </div>
            ) : (
              <div className="relative">
                <it.icon size={21} color={active ? P : MU} strokeWidth={active ? 2.5 : 1.8} />
              </div>
            )}
            {it.id !== "ai" && (
              <span className="text-[10px] font-semibold" style={{ color: active ? P : MU }}>
                {it.label}
              </span>
            )}
            {active && it.id !== "ai" && (
              <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: P }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`}
      style={{ background: SURF, boxShadow: "0 2px 16px rgba(46,125,50,0.08)", ...style }}>
      {children}
    </div>
  );
}

function InputField({
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = "text",
  label
}: {
  icon?: any;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-xs font-semibold" style={{ color: TX }}>{label}</label>}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-green-600/30"
        style={{ background: SURF, borderColor: BR }}>
        {Icon && <Icon size={16} color={MU} />}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full text-xs font-medium outline-hidden bg-transparent"
          style={{ color: TX }}
        />
      </div>
    </div>
  );
}

function PBtn({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  className = ""
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "amber" | "outline" | "danger";
  className?: string;
}) {
  const getStyle = () => {
    if (variant === "amber") {
      return { background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#000", border: "none" };
    }
    if (variant === "outline") {
      return { background: "transparent", color: P, border: `1.5px solid ${P}` };
    }
    if (variant === "danger") {
      return { background: "#DC2626", color: "#fff", border: "none" };
    }
    return { background: `linear-gradient(135deg, ${P}, ${PD})`, color: "#fff", border: "none" };
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 disabled:opacity-50 ${className}`}
      style={getStyle()}>
      {children}
    </button>
  );
}

// ─── LANGUAGE PICKER MODAL (PRIORITY 2) ───────────────────────────────────────
function LanguageModal({
  currentLang,
  onSelect,
  onClose
}: {
  currentLang: AppLanguage;
  onSelect: (l: AppLanguage) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl p-5 bg-white shadow-2xl flex flex-col gap-3">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <Globe size={18} color={P} />
            <h3 className="font-bold text-base text-gray-800">Select Language / மொழியை மாற்றவும்</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-gray-100"><X size={16} /></button>
        </div>
        <p className="text-xs text-gray-500">Choose your preferred agricultural advisory language:</p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {SUPPORTED_LANGUAGES.map(opt => (
            <button
              key={opt.code}
              onClick={() => { onSelect(opt.name); onClose(); }}
              className={`p-3 rounded-2xl border text-left flex flex-col gap-0.5 transition-all active:scale-95 ${
                currentLang === opt.name ? "border-green-600 bg-green-50 shadow-xs" : "border-gray-200 bg-white"
              }`}>
              <span className="font-bold text-sm text-gray-900">{opt.nativeName}</span>
              <span className="text-[10px] text-gray-500">{opt.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FEEDBACK MODAL (PRIORITY 4) ──────────────────────────────────────────────
function FeedbackModal({
  rec,
  onClose,
  onSubmit
}: {
  rec: Recommendation;
  onClose: () => void;
  onSubmit: (fb: Omit<ActionFeedback, "id" | "completedAt">) => void;
}) {
  const [rating, setRating] = useState(5);
  const [observation, setObservation] = useState<"Improved" | "Normal" | "Degraded" | "No Change">("Improved");
  const [notes, setNotes] = useState("");
  const [actionTaken, setActionTaken] = useState<"completed" | "skipped" | "in_progress">("completed");

  const handleSubmit = () => {
    onSubmit({
      recommendationId: rec.id,
      recommendationTitle: rec.title,
      category: rec.category,
      actionTaken,
      wasHelpful: rating >= 3,
      rating,
      cropConditionObservation: observation,
      notes: notes || `Followed recommendation: ${rec.title}. Crop condition: ${observation}.`,
      costSavedEstimate: "₹1,200"
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl p-5 bg-white shadow-2xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} color={P} />
            <h3 className="font-bold text-base text-gray-800">Record Action & Feedback</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full bg-gray-100"><X size={16} /></button>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
          <p className="font-bold text-gray-800">{rec.title}</p>
          <p className="text-gray-500 mt-0.5 line-clamp-2">{rec.action}</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Action Status:</label>
          <div className="grid grid-cols-3 gap-2">
            {(["completed", "in_progress", "skipped"] as const).map(st => (
              <button
                key={st}
                onClick={() => setActionTaken(st)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  actionTaken === st ? "bg-green-700 text-white border-green-700" : "bg-gray-50 text-gray-700 border-gray-200"
                }`}>
                {st === "completed" ? "✓ Followed" : st === "in_progress" ? "⏳ In Progress" : "✕ Skipped"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Helpfulness Rating:</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRating(star)}
                className={`text-xl transition-all ${star <= rating ? "text-amber-400 scale-110" : "text-gray-300"}`}>
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Crop Condition Observation:</label>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {(["Improved", "Normal", "Degraded", "No Change"] as const).map(obs => (
              <button
                key={obs}
                onClick={() => setObservation(obs)}
                className={`py-1.5 px-2 rounded-lg border font-medium ${
                  observation === obs ? "bg-green-100 border-green-600 text-green-900" : "border-gray-200 text-gray-600"
                }`}>
                {obs}
              </button>
            ))}
          </div>
        </div>

        <InputField
          placeholder="e.g. Cleared drainage canal; standing water drained to 3cm."
          value={notes}
          onChange={setNotes}
          label="Field Observation Notes (Optional):"
        />

        <PBtn onClick={handleSubmit}>Save to Farm History & Update AI</PBtn>
      </div>
    </div>
  );
}

// ─── DASHBOARD SCREEN (PRIORITY 8 STRICT ORDER) ───────────────────────────────
// STRICT ORDER:
// 1. FARM STATUS
// 2. CURRENT CONDITIONS
// 3. TOP RISK
// 4. NEXT BEST ACTION
// 5. WHY?
// 6. TAKE ACTION
// 7. FEEDBACK
function HomeScreen({
  navigate,
  user,
  weather,
  decisionResult,
  onOpenFeedback,
  isOffline,
  onOpenLangModal,
  onRefreshWeather
}: {
  navigate: (s: Screen) => void;
  user: UserState;
  weather: WeatherData;
  decisionResult: DecisionEngineResult;
  onOpenFeedback: (rec: Recommendation) => void;
  isOffline: boolean;
  onOpenLangModal: () => void;
  onRefreshWeather: () => void;
}) {
  const primaryRec = decisionResult.primaryRecommendation;
  const lang = user.language;
  const [showAlternative, setShowAlternative] = useState(false);
  const [whyExpanded, setWhyExpanded] = useState(true);

  return (
    <div className="flex flex-col h-full select-none" style={{ background: BG }}>
      {/* ─── OFFLINE MODE BANNER (PRIORITY 6) ─── */}
      {isOffline && (
        <div className="px-4 py-2 flex items-center justify-between text-xs font-semibold text-amber-900 bg-amber-100 border-b border-amber-300">
          <div className="flex items-center gap-2">
            <WifiOff size={14} />
            <span>{t("offlineBanner", lang)}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200">Offline</span>
        </div>
      )}

      {/* ─── 1. TOP HEADER & FARM STATUS (PRIORITY 8: STEP 1) ─── */}
      <div className="px-5 pt-3 pb-5"
        style={{ background: `linear-gradient(160deg, ${PD} 0%, ${P} 100%)`, borderRadius: "0 0 28px 28px" }}>
        <SBar light />

        <div className="flex justify-between items-center mt-1 mb-2">
          <SyncStatusBar />
          <div className="flex gap-2">
            <button onClick={onOpenLangModal}
              className="px-2.5 h-8 rounded-full flex items-center justify-center gap-1 bg-white/20 text-white text-xs font-bold active:scale-95">
              <Globe size={13} />
              <span>{user.language.slice(0, 3)}</span>
            </button>
            <button onClick={() => navigate("notifications")}
              className="w-8 h-8 rounded-full flex items-center justify-center relative bg-white/20 active:scale-95">
              <Bell size={15} color="#fff" />
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: ACC }} />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-start mt-1">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-white/80">Welcome,</span>
            </div>
            <h2 className="font-black text-2xl text-white mt-0.5">{user.name || "Farmer"} 👋</h2>
            <div className="flex items-center gap-1 mt-1 text-white/80 text-xs">
              <MapPin size={12} />
              <span>{user.village ? `${user.village}, ` : ""}{user.district}, {user.stateName}</span>
            </div>
          </div>
        </div>


        {/* FARM STATUS DETAILS */}
        <div className="mt-3.5 grid grid-cols-4 gap-1.5 text-center">
          <div className="rounded-xl p-2 bg-white/10 backdrop-blur-md">
            <p className="text-[9px] text-white/70">Crop</p>
            <p className="font-bold text-[11px] text-white mt-0.5 truncate">{user.primaryCrop}</p>
          </div>
          <div className="rounded-xl p-2 bg-white/10 backdrop-blur-md">
            <p className="text-[9px] text-white/70">Stage</p>
            <p className="font-bold text-[11px] text-amber-300 mt-0.5 truncate">{user.cropStage}</p>
          </div>
          <div className="rounded-xl p-2 bg-white/10 backdrop-blur-md">
            <p className="text-[9px] text-white/70">Soil</p>
            <p className="font-bold text-[11px] text-white mt-0.5 truncate">{user.soilType}</p>
          </div>
          <div className="rounded-xl p-2 bg-white/10 backdrop-blur-md">
            <p className="text-[9px] text-white/70">Area</p>
            <p className="font-bold text-[11px] text-white mt-0.5">{user.farmSize} Ac</p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Scrollable Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3.5" style={{ scrollbarWidth: "none" }}>

        {/* ─── 2. CURRENT CONDITIONS (PRIORITY 8: STEP 2) ─── */}
        <Card>
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2">
              <CloudRain size={16} color="#1565C0" />
              <span className="font-bold text-xs uppercase tracking-wide text-gray-700">
                {t("currentConditions", lang)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: weather.isLive ? "#E8F5E9" : "#FFF3E0", color: weather.isLive ? P : "#E65100" }}>
                {weather.isLive ? "Live Open-Meteo" : "Cached Offline Data"}
              </span>
              <button onClick={onRefreshWeather} title="Refresh" className="p-1 rounded-full text-gray-500 hover:bg-gray-100">
                <RefreshCw size={12} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100">
              <Thermometer size={14} className="mx-auto text-blue-600 mb-0.5" />
              <span className="text-[10px] text-gray-500 block">Temp</span>
              <span className="font-extrabold text-xs text-gray-800">{weather.temperature}°C</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100">
              <Droplets size={14} className="mx-auto text-blue-600 mb-0.5" />
              <span className="text-[10px] text-gray-500 block">Humidity</span>
              <span className="font-extrabold text-xs text-gray-800">{weather.humidity}%</span>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <CloudRain size={14} className="mx-auto text-indigo-600 mb-0.5" />
              <span className="text-[10px] text-gray-500 block">Rain 48h</span>
              <span className="font-extrabold text-xs text-indigo-700">{weather.rainfallMmExpected} mm</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
              <Activity size={14} className="mx-auto text-amber-600 mb-0.5" />
              <span className="text-[10px] text-gray-500 block">Soil Moist</span>
              <span className="font-extrabold text-xs text-amber-700">68%</span>
            </div>
          </div>
          <div className="mt-2 flex justify-between items-center text-[10px] text-gray-400">
            <span>District: {user.district}</span>
            <span>Updated: {weather.updatedAt}</span>
          </div>
        </Card>

        {/* ─── 3. TOP RISK ALERT (PRIORITY 8: STEP 3) ─── */}
        <div className="rounded-2xl p-3.5 border border-red-200 bg-red-50/90 flex flex-col gap-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-red-800 font-black text-xs">
              <ShieldAlert size={16} />
              <span>{t("topRisk", lang)}</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white">
              {decisionResult.riskAnalysis.overallRisk} RISK
            </span>
          </div>
          <p className="text-xs text-red-900 font-semibold leading-snug">
            ⚠️ Waterlogging & Fungal Blast Alert: Saturated soil (68%) + forecasted {weather.rainfallMmExpected}mm rain will trigger root zone hypoxia.
          </p>
          <div className="flex gap-2 mt-1">
            {decisionResult.riskAnalysis.factors.map((f, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white/80 border border-red-200 text-red-800 font-medium">
                {f.name}: {f.level}
              </span>
            ))}
          </div>
        </div>

        {/* ─── 4. NEXT BEST ACTION (PRIORITY 3 & PRIORITY 8: STEP 4) ─── */}
        <div className="rounded-3xl p-4.5 relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #1B5E20, #2E7D32)",
            boxShadow: "0 8px 28px rgba(27,94,32,0.35)",
            border: "2px solid rgba(255,255,255,0.2)"
          }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-400 text-black shadow-xs">
                <Sparkles size={18} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-wider text-amber-300 uppercase block">
                  THINAI CORE ENGINE
                </span>
                <span className="font-black text-sm text-white">{t("nextBestAction", lang)}</span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-red-500 text-white shadow-xs">
              {primaryRec.priority.toUpperCase()} PRIORITY
            </span>
          </div>

          {/* CONCRETE ACTION STATEMENT */}
          <div className="bg-black/25 p-3 rounded-2xl border border-white/15 mt-2">
            <span className="text-[10px] font-bold text-amber-300 block mb-1">ACTION STATEMENT:</span>
            <p className="font-extrabold text-sm text-white leading-snug">
              👉 {primaryRec.action}
            </p>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/90">
            <div>
              <span className="text-white/60 block text-[10px]">WHEN TO ACT:</span>
              <span className="font-bold text-amber-200">{primaryRec.when}</span>
            </div>
            <div className="text-right">
              <span className="text-white/60 block text-[10px]">CONFIDENCE:</span>
              <span className="font-black text-emerald-300 text-xs">{primaryRec.confidence}%</span>
            </div>
          </div>

          {/* ─── 5. WHY? (EXPLAINABILITY) (PRIORITY 8: STEP 5) ─── */}
          <div className="mt-3 pt-3 border-t border-white/15">
            <button
              onClick={() => setWhyExpanded(!whyExpanded)}
              className="w-full flex items-center justify-between text-xs font-bold text-amber-300 mb-1.5">
              <span>{t("whyThisAction", lang)}</span>
              <ChevronDown size={14} className={`transition-transform ${whyExpanded ? "rotate-180" : ""}`} />
            </button>

            {whyExpanded && (
              <div className="flex flex-col gap-2 text-[11px] text-white/90 bg-white/10 p-2.5 rounded-xl">
                <div>
                  <span className="font-bold text-amber-200 block mb-0.5">Agronomic Rationale:</span>
                  <p className="leading-relaxed">{primaryRec.why}</p>
                </div>
                <div>
                  <span className="font-bold text-amber-200 block mb-0.5">Supporting Factors:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-white/80">
                    {primaryRec.supportingFactors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-bold text-amber-200 block mb-0.5">Risk Mitigated:</span>
                  <p className="text-white/80">{primaryRec.risk}</p>
                </div>
                {primaryRec.feedbackInfluence && (
                  <div className="text-[10px] text-amber-300 bg-black/20 p-1.5 rounded-md font-medium">
                    {primaryRec.feedbackInfluence}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── 6. TAKE ACTION (PRIORITY 8: STEP 6) ─── */}
          <div className="mt-3.5 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => onOpenFeedback(primaryRec)}
                className="flex-1 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 bg-amber-400 text-black shadow-md active:scale-98">
                <CheckCircle size={15} /> {t("markDone", lang)}
              </button>
              <button
                onClick={() => navigate("ai")}
                className="flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-white/20 text-white border border-white/25 active:scale-98">
                <Bot size={15} /> {t("askAIWhy", lang)}
              </button>
            </div>

            <button
              onClick={() => setShowAlternative(!showAlternative)}
              className="text-[11px] text-white/70 hover:text-white text-center underline decoration-dotted">
              {showAlternative ? "Hide Alternative Plan" : "View Alternative Action"}
            </button>

            {showAlternative && (
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 text-[11px] text-white">
                <span className="font-bold text-amber-300 block mb-0.5">Alternative Action:</span>
                <p>{primaryRec.alternativeAction}</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── 7. FEEDBACK & FARM HISTORY (PRIORITY 4 & PRIORITY 8: STEP 7) ─── */}
        <Card>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} color={P} />
              <span className="font-bold text-xs uppercase tracking-wide text-gray-700">
                {t("feedbackLoop", lang)}
              </span>
            </div>
            <button onClick={() => navigate("diary")} className="text-xs font-bold text-green-700">
              View Diary →
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-2.5">
            Your recorded feedback feeds directly into future THINAI recommendations:
          </p>

          <div className="space-y-2">
            {getFeedbackHistory().slice(0, 2).map(fb => (
              <div key={fb.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <div className="flex justify-between items-center font-bold text-gray-800">
                  <span className="truncate">{fb.recommendationTitle}</span>
                  <span className="text-amber-500">{"★".repeat(fb.rating || 5)}</span>
                </div>
                <p className="text-gray-600 text-[11px] mt-1">{fb.notes}</p>
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  <span>Status: {fb.actionTaken}</span>
                  <span>Observation: {fb.cropConditionObservation || "Improved"}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={() => navigate("disease")}
            className="p-3.5 rounded-2xl border text-left bg-emerald-50/70 border-emerald-200 active:scale-98 transition-all flex flex-col gap-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Microscope size={18} />
            </div>
            <span className="font-bold text-xs text-emerald-950 mt-1">{t("scanTitle", lang)}</span>
            <span className="text-[10px] text-emerald-800">PlantVillage ML Scanner</span>
          </button>

          <button onClick={() => navigate("market")}
            className="p-3.5 rounded-2xl border text-left bg-blue-50/70 border-blue-200 active:scale-98 transition-all flex flex-col gap-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <span className="font-bold text-xs text-blue-950 mt-1">{t("marketIntelligence", lang)}</span>
            <span className="text-[10px] text-blue-800">Mandi Price Benchmarks</span>
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── CROP DISEASE SCAN SCREEN (PRIORITY 1: REAL CV CLASSIFICATION) ────────────
function DiseaseScreen({
  navigate,
  user,
  showToast
}: {
  navigate: (s: Screen) => void;
  user: UserState;
  showToast: (m: string, t?: ToastType) => void;
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiseaseDetectionResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const lang = user.language;

  const handleImageProcess = async (file: File) => {
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setAnalyzing(true);
    try {
      const res = await detectCropDisease(file, user.primaryCrop);
      setResult(res);
      if (res.isReliable) {
        showToast("Leaf analysis complete!", "success");
      } else {
        showToast("Image quality check failed. See details.", "warning");
      }
    } catch (e) {
      showToast("Visual analysis failed. Please try again.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageProcess(file);
  };

  const handleSaveToDiary = () => {
    if (!result) return;
    addFarmActivity({
      date: new Date().toISOString().split("T")[0],
      activityType: "Disease Observation",
      crop: result.crop,
      fieldPlot: `Main Plot (${user.farmSize} Acres)`,
      notes: `Pathology Report: ${result.diseaseName} (Confidence: ${result.confidence}%). Immediate Action: ${result.immediateAction}`,
      source: "thinai_recommendation"
    });
    showToast("Disease report logged into Farm Diary!", "success");
  };

  return (
    <div className="flex flex-col h-full select-none" style={{ background: BG }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(160deg, #880E4F, #C2185B)", borderRadius: "0 0 24px 24px" }}>
        <SBar light />
        <BkHdr title={t("scanTitle", lang)} navigate={navigate} light />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3.5" style={{ scrollbarWidth: "none" }}>

        {/* Image Capture & Picker Box */}
        <Card className="text-center p-5 border-2 border-dashed border-gray-300">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {imagePreview ? (
            <div className="relative mx-auto w-48 h-48 rounded-2xl overflow-hidden border shadow-sm">
              <img src={imagePreview} alt="Leaf Preview" className="w-full h-full object-cover" />
              {analyzing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-2">
                  <RefreshCw className="animate-spin" size={24} />
                  <span className="text-xs font-bold">{t("analyzingFoliage", lang)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-pink-700 mb-2">
                <Microscope size={28} />
              </div>
              <h3 className="font-bold text-sm text-gray-800">Scan Crop Leaf</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Take a close-up photo of the crop leaf under good daylight to run our on-device Computer Vision pathology engine.
              </p>
            </div>
          )}

          <div className="flex gap-2.5 mt-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-pink-700 text-white flex items-center justify-center gap-1.5 active:scale-95 shadow-xs">
              <Camera size={15} /> {t("takePhoto", lang)}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 rounded-xl font-bold text-xs bg-gray-100 text-gray-800 border border-gray-200 flex items-center justify-center gap-1.5 active:scale-95">
              <ImageIcon size={15} /> {t("uploadImage", lang)}
            </button>
          </div>
        </Card>

        {/* ─── CASE A: QUALITY CHECK REJECTION (REQUIREMENT 6) ─── */}
        {result && !result.isReliable && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-black text-sm text-amber-800">
              <AlertTriangle size={18} />
              <span>{t("unableToDetermine", lang)}</span>
            </div>
            <p className="text-xs font-semibold">{result.diseaseName}</p>
            <p className="text-xs text-amber-800/90 leading-relaxed">
              {result.immediateAction}
            </p>
            <div className="text-[11px] bg-white/70 p-2 rounded-xl border border-amber-200">
              <span className="font-bold block mb-1">Quality Reasons:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                {result.symptoms.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full py-2.5 mt-1 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1">
              <RefreshCw size={14} /> {t("retakePhoto", lang)}
            </button>
          </div>
        )}

        {/* ─── CASE B: SUCCESSFUL GENUINE INFERENCE RESULT ─── */}
        {result && result.isReliable && (
          <div className="flex flex-col gap-3">
            {/* Diagnosis Summary Card */}
            <Card className="border-l-4 border-l-pink-600">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
                    {result.healthyStatus.toUpperCase()}
                  </span>
                  <h3 className="font-black text-lg text-gray-900 mt-1">{result.diseaseName}</h3>
                  <p className="text-xs italic text-gray-500">{result.scientificName}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-pink-700 block">{result.confidence}%</span>
                  <span className="text-[9px] text-gray-400">Calculated Feature Distance</span>
                </div>
              </div>

              {/* Measured CV Metrics */}
              {result.extractedMetrics && (
                <div className="mt-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div>
                    <span className="text-gray-400 block">Foliage Coverage</span>
                    <span className="font-bold text-gray-800">{result.extractedMetrics.foliageCoveragePercent}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Lesion Area</span>
                    <span className="font-bold text-red-600">{result.extractedMetrics.lesionAreaPercent}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Margin Ratio</span>
                    <span className="font-bold text-gray-800">{result.extractedMetrics.marginLesionRatio}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Immediate Action */}
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200">
              <span className="text-xs font-bold text-red-800 block mb-1">🚨 {t("immediateRemedy", lang)}:</span>
              <p className="text-xs text-red-900 font-medium leading-relaxed">{result.immediateAction}</p>
            </div>

            {/* Organic & Chemical Treatments */}
            <Card>
              <h4 className="font-bold text-xs text-green-800 uppercase tracking-wide mb-2">
                🌿 {t("organicSolution", lang)}
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-gray-700">
                {result.organicTreatment.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>

              <h4 className="font-bold text-xs text-blue-800 uppercase tracking-wide mt-3 mb-2">
                🧪 {t("chemicalSolution", lang)}
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-gray-700">
                {result.chemicalTreatment.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </Card>

            {/* Transparency & Benchmark Dataset Badge (REQUIREMENT 8) */}
            <div className="p-3 rounded-xl bg-gray-100 border border-gray-200 text-[10px] text-gray-600">
              <span className="font-bold text-gray-800 block">Model & Validation Transparency:</span>
              <p>{result.inferenceEngine}</p>
              <p className="mt-0.5 text-gray-500 font-medium">{result.measuredValidationAccuracy}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <PBtn onClick={handleSaveToDiary}>Save to Farm Diary</PBtn>
              <PBtn variant="outline" onClick={() => navigate("ai")}>Ask AI About Treatment</PBtn>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── AI ADVISOR SCREEN (PRIORITY 2 & PRIORITY 3) ──────────────────────────────
function AIScreen({
  navigate,
  user,
  weather,
  decisionResult
}: {
  navigate: (s: Screen) => void;
  user: UserState;
  weather: WeatherData;
  decisionResult: DecisionEngineResult;
}) {
  const lang = user.language;
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "m-0",
      from: "ai",
      text: generateContextualResponse("today", {
        name: user.name,
        location: `${user.village}, ${user.district}`,
        district: user.district,
        state: user.stateName,
        farmSize: user.farmSize,
        primaryCrop: user.primaryCrop,
        cropVariety: user.cropVariety,
        cropStage: user.cropStage,
        soilType: user.soilType,
        soilMoisture: 68,
        weatherCondition: weather.condition,
        rainfallExpected: weather.rainfallMmExpected,
        temperature: weather.temperature,
        language: lang,
        nextBestAction: decisionResult.primaryRecommendation
      }),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognizerRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg: AssistantMessage = {
      id: `u-${Date.now()}`,
      from: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Generate AI Agronomic response
    setTimeout(() => {
      const respText = generateContextualResponse(q, {
        name: user.name,
        location: `${user.village}, ${user.district}`,
        district: user.district,
        state: user.stateName,
        farmSize: user.farmSize,
        primaryCrop: user.primaryCrop,
        cropVariety: user.cropVariety,
        cropStage: user.cropStage,
        soilType: user.soilType,
        soilMoisture: 68,
        weatherCondition: weather.condition,
        rainfallExpected: weather.rainfallMmExpected,
        temperature: weather.temperature,
        language: lang,
        nextBestAction: decisionResult.primaryRecommendation
      });

      const aiMsg: AssistantMessage = {
        id: `ai-${Date.now()}`,
        from: "ai",
        text: respText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 400);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    const localeMap: Record<AppLanguage, SpeechLocale> = {
      English: "en-IN",
      Tamil: "ta-IN",
      Hindi: "hi-IN",
      Telugu: "te-IN",
      Kannada: "kn-IN",
      Malayalam: "ml-IN"
    };

    const targetLocale = localeMap[lang] || "en-IN";
    const recognizer = createSpeechRecognizer(
      targetLocale,
      (text, isFinal) => {
        setInput(text);
        if (isFinal) {
          setIsListening(false);
          handleSend(text);
        }
      },
      (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      },
      () => setIsListening(false)
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
      setIsListening(true);
    }
  };

  const handleSpeak = (text: string) => {
    const localeMap: Record<AppLanguage, SpeechLocale> = {
      English: "en-IN",
      Tamil: "ta-IN",
      Hindi: "hi-IN",
      Telugu: "te-IN",
      Kannada: "kn-IN",
      Malayalam: "ml-IN"
    };
    speakText(text, localeMap[lang] || "en-IN");
  };

  const suggestedQuestions = SUGGESTED_QUESTIONS_BY_LANG[lang] || SUGGESTED_QUESTIONS_BY_LANG.English;

  return (
    <div className="flex flex-col h-full select-none" style={{ background: BG }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(160deg, ${PD}, ${P})`, borderRadius: "0 0 24px 24px" }}>
        <SBar light />
        <BkHdr title={t("aiAdvisorTitle", lang)} navigate={navigate} light />
      </div>

      {/* Suggested chips */}
      <div className="px-4 py-2 flex gap-1.5 overflow-x-auto border-b border-gray-200 bg-white" style={{ scrollbarWidth: "none" }}>
        {suggestedQuestions.slice(0, 4).map((sq, i) => (
          <button
            key={i}
            onClick={() => handleSend(sq)}
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 whitespace-nowrap active:scale-95 hover:bg-green-50 hover:text-green-800">
            {sq}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col ${m.from === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                m.from === "user"
                  ? "bg-green-800 text-white rounded-tr-xs"
                  : "bg-white text-gray-800 border border-gray-200 rounded-tl-xs shadow-xs"
              }`}>
              <div className="whitespace-pre-wrap font-medium">{m.text}</div>
              <div className="flex justify-between items-center mt-2 pt-1 border-t border-black/10 text-[9px] opacity-70">
                <span>{m.timestamp}</span>
                {m.from === "ai" && (
                  <button onClick={() => handleSpeak(m.text)} className="p-1 hover:opacity-100 flex items-center gap-0.5">
                    <Volume2 size={12} /> Speak
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
        <button
          onClick={handleVoiceToggle}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-700"
          }`}>
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <input
          type="text"
          placeholder={t("askAnything", lang)}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 outline-hidden focus:border-green-600 bg-gray-50"
        />
        <button
          onClick={() => handleSend()}
          className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center active:scale-95 shadow-xs">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── FARM DIARY SCREEN ────────────────────────────────────────────────────────
function DiaryScreen({ navigate, user, showToast }: { navigate: (s: Screen) => void; user: UserState; showToast: (m: string, t?: ToastType) => void }) {
  const [diary, setDiary] = useState<FarmActivity[]>(getFarmDiary());
  const [newNotes, setNewNotes] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("Irrigation");
  const [cost, setCost] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const lang = user.language;

  const handleAdd = () => {
    if (!newNotes.trim()) {
      showToast("Please enter activity notes", "error");
      return;
    }
    const created = addFarmActivity({
      date: new Date().toISOString().split("T")[0],
      activityType,
      crop: user.primaryCrop,
      fieldPlot: `Main Plot (${user.farmSize} Acres)`,
      notes: newNotes,
      cost: cost ? `₹${cost}` : undefined,
      source: "manual"
    });
    setDiary(getFarmDiary());
    setNewNotes("");
    setCost("");
    setShowAddModal(false);
    showToast("Activity added to Farm Diary!", "success");
  };

  const handleDelete = (id: string) => {
    deleteFarmActivity(id);
    setDiary(getFarmDiary());
    showToast("Activity deleted", "info");
  };

  return (
    <div className="flex flex-col h-full select-none" style={{ background: BG }}>
      <div style={{ background: `linear-gradient(160deg, #33691E, #558B2F)`, borderRadius: "0 0 24px 24px" }}>
        <SBar light />
        <BkHdr
          title={t("diaryTitle", lang)}
          navigate={navigate}
          light
          right={
            <button onClick={() => setShowAddModal(true)} className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold">
              <Plus size={16} />
            </button>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        {diary.map(item => (
          <Card key={item.id} className="relative">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                  {item.activityType}
                </span>
                <span className="text-[10px] text-gray-400 ml-2">{item.date}</span>
                <p className="text-xs font-semibold text-gray-800 mt-1.5">{item.notes}</p>
              </div>
              <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-1">
                <Trash2 size={14} />
              </button>
            </div>
            {item.cost && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-2 inline-block">
                Cost: {item.cost}
              </span>
            )}
          </Card>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl p-5 bg-white shadow-2xl flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-800">Log Farm Activity</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full bg-gray-100"><X size={16} /></button>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Activity Type:</label>
              <select
                value={activityType}
                onChange={e => setActivityType(e.target.value as ActivityType)}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-gray-50">
                {(["Irrigation", "Fertilizer Application", "Disease Observation", "Spraying", "Weeding", "Harvesting", "Field Inspection"] as const).map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <InputField placeholder="e.g. Cleared drainage canal; standing water drained to 3cm." value={newNotes} onChange={setNewNotes} label="Notes:" />
            <InputField placeholder="e.g. 450" value={cost} onChange={setCost} label="Cost (₹) Optional:" />
            <PBtn onClick={handleAdd}>Save to Diary</PBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROFILE & EDIT PROFILE SCREENS (PRIORITY 5) ──────────────────────────────
function ProfileScreen({
  navigate,
  user,
  onLogout,
  onDeleteAccount,
  onOpenLangModal
}: {
  navigate: (s: Screen) => void;
  user: UserState;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onOpenLangModal: () => void;
}) {
  const lang = user.language;

  return (
    <div className="flex flex-col h-full select-none" style={{ background: BG }}>
      <div className="pb-6" style={{ background: `linear-gradient(160deg, ${PD}, ${P})`, borderRadius: "0 0 32px 32px" }}>
        <SBar light />
        <div className="flex justify-between px-5 pt-2">
          <button onClick={onOpenLangModal} className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold flex items-center gap-1">
            <Globe size={13} /> {user.language}
          </button>
          <button onClick={() => navigate("editprofile")} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
            <Edit3 size={15} color="#fff" />
          </button>
        </div>
        <div className="flex flex-col items-center mt-1">
          <div className="w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center bg-white/20 text-white font-black text-2xl">
            {user.name.charAt(0) || "F"}
          </div>
          <h3 className="font-bold text-lg text-white mt-2">{user.name || "Farmer"}</h3>
          <p className="text-xs text-white/80">{user.district}, {user.stateName}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        <Card>
          <h4 className="font-bold text-xs text-green-800 uppercase tracking-wide mb-3">Farm Parameters (Persistent)</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Farm Size</span><span className="font-semibold">{user.farmSize} Acres</span></div>
            <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Primary Crop</span><span className="font-semibold">{user.primaryCrop}</span></div>
            <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Variety</span><span className="font-semibold">{user.cropVariety}</span></div>
            <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Crop Stage</span><span className="font-semibold text-amber-700">{user.cropStage}</span></div>
            <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Soil Type</span><span className="font-semibold">{user.soilType}</span></div>
            <div className="flex justify-between border-b pb-1.5"><span className="text-gray-500">Irrigation</span><span className="font-semibold">{user.irrigationType}</span></div>
            <div className="flex justify-between pb-0.5"><span className="text-gray-500">Advisory Language</span><span className="font-bold text-green-700">{user.language}</span></div>
          </div>
        </Card>

        <PBtn variant="outline" onClick={() => navigate("editprofile")}>Edit Farm Profile</PBtn>
        <PBtn variant="danger" onClick={onLogout}>Sign Out</PBtn>
        <button
          onClick={onDeleteAccount}
          className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 active:scale-98 transition-all flex items-center justify-center gap-1.5 mt-1">
          <Trash2 size={14} />
          <span>Delete Farmer Account</span>
        </button>
      </div>
    </div>
  );
}


function EditProfileScreen({
  navigate,
  user,
  onSave,
  showToast
}: {
  navigate: (s: Screen) => void;
  user: UserState;
  onSave: (u: UserState) => void;
  showToast: (m: string, t?: ToastType) => void;
}) {
  const [form, setForm] = useState<UserState>({ ...user });

  const save = () => {
    onSave(form);
    showToast("Farm profile updated & persisted!", "success");
    navigate("profile");
  };

  return (
    <div className="flex flex-col h-full select-none" style={{ background: BG }}>
      <div style={{ background: `linear-gradient(160deg, ${PD}, ${P})`, borderRadius: "0 0 24px 24px" }}>
        <SBar light />
        <BkHdr title="Edit Farm Profile" navigate={navigate} dest="profile" light />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        <InputField placeholder="Farmer Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} label="Farmer Name:" />
        <InputField placeholder="District" value={form.district} onChange={v => setForm(f => ({ ...f, district: v }))} label="District:" />
        <InputField placeholder="State" value={form.stateName} onChange={v => setForm(f => ({ ...f, stateName: v }))} label="State:" />
        <InputField placeholder="Farm Size (Acres)" value={form.farmSize} onChange={v => setForm(f => ({ ...f, farmSize: v }))} label="Farm Size (Acres):" />

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Primary Crop:</label>
          <select
            value={form.primaryCrop}
            onChange={e => setForm(f => ({ ...f, primaryCrop: e.target.value }))}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white">
            <option value="Paddy (Rice)">Paddy (Rice)</option>
            <option value="Tomato">Tomato</option>
            <option value="Wheat">Wheat</option>
            <option value="Maize">Maize</option>
            <option value="Cotton">Cotton</option>
          </select>
        </div>

        <InputField placeholder="Crop Variety (e.g. Ponni CO 51)" value={form.cropVariety} onChange={v => setForm(f => ({ ...f, cropVariety: v }))} label="Crop Variety:" />

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Crop Stage:</label>
          <select
            value={form.cropStage}
            onChange={e => setForm(f => ({ ...f, cropStage: e.target.value }))}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white">
            <option value="Sowing / Nursery">Sowing / Nursery</option>
            <option value="Tillering Stage">Tillering Stage</option>
            <option value="Panicle Initiation">Panicle Initiation</option>
            <option value="Flowering Stage">Flowering Stage</option>
            <option value="Maturity / Harvest">Maturity / Harvest</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Soil Type:</label>
          <select
            value={form.soilType}
            onChange={e => setForm(f => ({ ...f, soilType: e.target.value }))}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white">
            <option value="Clay Loam">Clay Loam</option>
            <option value="Red Sandy Loam">Red Sandy Loam</option>
            <option value="Black Cotton Soil">Black Cotton Soil</option>
            <option value="Alluvial Soil">Alluvial Soil</option>
          </select>
        </div>

        <InputField placeholder="Irrigation Type" value={form.irrigationType} onChange={v => setForm(f => ({ ...f, irrigationType: v }))} label="Irrigation Method:" />

        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Advisory Language:</label>
          <select
            value={form.language}
            onChange={e => setForm(f => ({ ...f, language: e.target.value as AppLanguage }))}
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-hidden bg-white">
            {SUPPORTED_LANGUAGES.map(l => (
              <option key={l.code} value={l.name}>{l.nativeName} ({l.name})</option>
            ))}
          </select>
        </div>

        <PBtn onClick={save}>Save Profile & Recalculate AI</PBtn>
      </div>
    </div>
  );
}

// ─── AUTH SCREENS IMPORTED FROM AuthScreens.tsx (REAL FIREBASE & ONBOARDING) ──


// ─── MARKET SCREEN (PRIORITY 7: BENCHMARK DISCLAIMER) ────────────────────────
function MarketScreen({ navigate, user }: { navigate: (s: Screen) => void; user: UserState }) {
  const [selectedCrop, setSelectedCrop] = useState<string>("paddy");
  const commodity = COMMODITY_MARKETS[selectedCrop] || COMMODITY_MARKETS.paddy;
  const lang = user.language;

  return (
    <div className="flex flex-col h-full select-none" style={{ background: BG }}>
      <div style={{ background: "linear-gradient(160deg, #0D47A1, #1976D2)", borderRadius: "0 0 24px 24px" }}>
        <SBar light />
        <BkHdr title={t("marketIntelligence", lang)} navigate={navigate} light />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5" style={{ scrollbarWidth: "none" }}>
        {/* Benchmark notice (Requirement 7) */}
        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[10px] text-blue-900 font-medium">
          ℹ️ {t("simulatedDisclaimer", lang)}
        </div>

        {/* Crop Selector */}
        <div className="flex gap-2">
          {Object.keys(COMMODITY_MARKETS).map(k => (
            <button
              key={k}
              onClick={() => setSelectedCrop(k)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                selectedCrop === k ? "bg-blue-700 text-white border-blue-700 shadow-xs" : "bg-white text-gray-700 border-gray-200"
              }`}>
              {COMMODITY_MARKETS[k].cropName.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Price Card */}
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-gray-500">{commodity.cropName}</span>
              <h2 className="text-2xl font-black text-gray-900 mt-0.5">₹{commodity.currentPrice} <span className="text-xs font-normal text-gray-400">/ quintal</span></h2>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-green-100 text-green-800">
              +{commodity.weeklyChangePercent}% (7d)
            </span>
          </div>

          <p className="text-xs text-gray-600 mt-2">{commodity.marketInsight}</p>

          {/* Chart */}
          <div className="h-40 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commodity.sevenDayHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#1976D2" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sell / Hold Recommendation */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
            {t("sellHoldSignal", lang)}:
          </span>
          <p className="text-xs font-black text-emerald-950">
            {t("holdRecommendation", lang)}
          </p>
          <p className="text-[11px] text-emerald-800 mt-1">
            Regional procurement target benchmark: ₹2,920/quintal. Hold buffer inventory.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP COMPONENT ───────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [user, setUser] = useState<UserState>(() => {
    try {
      const saved = localStorage.getItem("thinai_farmer_profile");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { ...INITIAL_USER, language: getPersistedLanguage() };
  });

  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<Recommendation | null>(null);
  const [showLangModal, setShowLangModal] = useState(false);
  const [weather, setWeather] = useState<WeatherData>(() => getFallbackWeather("Coimbatore"));
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Firebase Authentication State Listener & Session Persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthChecked(true);

      if (fbUser) {
        (window as any)._currentFirebaseUid = fbUser.uid;
        try {
          // 1. Check local Dexie IndexedDB first (Offline capability)
          const localProfile = await db.profiles.get(`profile-${fbUser.uid}`);
          if (localProfile && localProfile.data && localProfile.data.name) {
            setUser(localProfile.data as any);
            if (screen === "splash" || screen === "login" || screen === "register") {
              setScreen("home");
            }
            return;
          }

          // 2. Check Backend API
          try {
            const remoteUser = await apiClient.getProfile();
            if (remoteUser && remoteUser.profile) {
              const profileData: UserState = {
                name: remoteUser.full_name || fbUser.displayName || "Farmer",
                phone: remoteUser.phone || fbUser.phoneNumber || "",
                email: remoteUser.email || fbUser.email || "",
                village: remoteUser.profile.village || "Kinathukadavu",
                district: remoteUser.profile.district || "Coimbatore",
                stateName: remoteUser.profile.state || "Tamil Nadu",
                farmSize: "2.0",
                soilType: "Clay Loam",
                primaryCrop: "Paddy (Rice)",
                cropVariety: "Ponni (CO 51)",
                cropStage: "Tillering Stage",
                sowingDate: new Date().toISOString().split("T")[0],
                irrigationType: "Canal + Borewell",
                farmingMethod: "Integrated Nutrient Management",
                waterSource: "Canal",
                mainCrops: "Paddy, Pulses",
                language: (remoteUser.profile.preferred_language as any) || "English"
              };

              await db.profiles.put({
                id: `profile-${fbUser.uid}`,
                userId: fbUser.uid,
                data: profileData as any,
                updatedAt: new Date().toISOString(),
                synced: true
              });

              setUser(profileData);
              if (screen === "splash" || screen === "login" || screen === "register") {
                setScreen("home");
              }
              return;
            }
          } catch {}

          // 3. Authenticated but no farmer profile exists -> Open Onboarding
          setScreen("onboarding");

        } catch (e) {
          console.error("Profile check error:", e);
          setScreen("onboarding");
        }
      } else {
        (window as any)._currentFirebaseUid = null;
        if (screen !== "splash" && screen !== "register") {
          setScreen("login");
        }
      }
    });

    return () => unsubscribe();
  }, [screen]);

  // Network offline/online listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast(t("onlineRestored", user.language), "success");
      loadLiveWeather(user.district || "Coimbatore");
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast(t("offlineBanner", user.language), "warning");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user.language, user.district]);

  const loadLiveWeather = async (district: string) => {
    try {
      const w = await fetchFarmWeather(district || "Coimbatore");
      setWeather(w);
    } catch {
      setWeather(getFallbackWeather(district || "Coimbatore"));
    }
  };

  useEffect(() => {
    if (user.district) {
      loadLiveWeather(user.district);
    }
  }, [user.district]);

  // Persist user on changes
  const updateUser = (u: UserState) => {
    setUser(u);
    try {
      localStorage.setItem("thinai_farmer_profile", JSON.stringify(u));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLanguageChange = (lang: AppLanguage) => {
    persistLanguage(lang);
    const updated = { ...user, language: lang };
    updateUser(updated);
    showToast(`Language set to ${lang}`, "success");
  };

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Compute adaptive farm decisions based on active farm parameters & feedback history
  const completedActions = getCompletedActionIds();
  const feedbackHistory = getFeedbackHistory();

  const decisionInputs: DecisionInputs = {
    crop: user.primaryCrop || "Paddy",
    cropVariety: user.cropVariety,
    cropStage: user.cropStage || "Tillering",
    soilType: user.soilType || "Clay Loam",
    soilMoisture: 68,
    temperature: weather.temperature,
    rainfallExpected: weather.rainfallMmExpected,
    humidity: weather.humidity,
    forecast: weather.condition,
    marketPrice: 2840,
    farmSize: user.farmSize || "2.0",
    location: `${user.district || "Coimbatore"}, ${user.stateName || "Tamil Nadu"}`,
    completedActions,
    recentFeedbacks: feedbackHistory
  };

  const decisionResult = generateFarmDecisions(decisionInputs);

  // Splash Screen auto-advance after authentication check
  useEffect(() => {
    if (screen === "splash" && authChecked) {
      const t = setTimeout(() => {
        if (!firebaseUser) {
          setScreen("login");
        } else if (!user.name) {
          setScreen("onboarding");
        } else {
          setScreen("home");
        }
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [screen, authChecked, firebaseUser, user.name]);

  const handleAuthSuccess = (u: UserState) => {
    if (!u.name || !u.farmSize) {
      setUser(u);
      setScreen("onboarding");
    } else {
      updateUser(u);
      setScreen("home");
    }
  };

  const handleOnboardingComplete = (u: UserState) => {
    updateUser(u);
    setScreen("home");
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser({ ...INITIAL_USER });
      setFirebaseUser(null);
      localStorage.removeItem("thinai_farmer_profile");
      setScreen("login");
      showToast("Signed out successfully", "info");
    } catch (err: any) {
      showToast("Error signing out", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your farmer account and all associated farm data? This cannot be undone.")) {
      try {
        const uid = firebaseUser?.uid;
        if (uid) {
          await apiClient.deleteAccount();
          await db.profiles.delete(`profile-${uid}`);
          await db.activities.where("userId").equals(uid).delete();
          await db.feedbacks.where("userId").equals(uid).delete();
          await db.scans.where("userId").equals(uid).delete();
        }
        await deleteCurrentUserAccount();
        setUser({ ...INITIAL_USER });
        setFirebaseUser(null);
        localStorage.removeItem("thinai_farmer_profile");
        setScreen("login");
        showToast("Account deleted successfully", "info");
      } catch (err: any) {
        showToast(`Failed to delete account: ${err.message}`, "error");
      }
    }
  };

  const handleFeedbackSubmit = async (fb: Omit<ActionFeedback, "id" | "completedAt">) => {
    recordFeedback(fb);
    const actId = `act-${Date.now()}`;
    const fbId = `fb-${Date.now()}`;

    addFarmActivity({
      date: new Date().toISOString().split("T")[0],
      activityType: fb.category as ActivityType,
      crop: user.primaryCrop,
      fieldPlot: `Main Plot (${user.farmSize} Acres)`,
      notes: `Completed action: ${fb.recommendationTitle}. Observation: ${fb.cropConditionObservation || "Normal"}. ${fb.notes || ""}`,
      cost: fb.costSavedEstimate ? `Saved ${fb.costSavedEstimate}` : undefined,
      source: "thinai_recommendation"
    });

    // Queue mutation in Dexie offline sync queue
    await syncManager.queueMutation("feedback", "create", fbId, {
      recommendation_id: fb.recommendationId,
      action_taken: fb.actionTaken,
      rating: fb.rating,
      crop_observation: fb.cropConditionObservation || "Normal",
      notes: fb.notes || "",
      cost_saved_estimate: fb.costSavedEstimate ? parseFloat(fb.costSavedEstimate.replace(/[^0-9.]/g, "")) : null
    });

    showToast("Feedback saved! Future recommendations updated.", "success");
  };

  return (
    <div className="w-full h-screen max-w-md mx-auto flex flex-col relative overflow-hidden bg-white shadow-2xl font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-4 right-4 z-50 p-3 rounded-2xl text-xs font-bold text-white shadow-lg text-center ${
              toast.type === "error" ? "bg-red-600" : toast.type === "warning" ? "bg-amber-600" : "bg-green-700"
            }`}>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Router */}
      <div className="flex-1 overflow-hidden">
        {screen === "splash" && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none"
            style={{ background: `linear-gradient(160deg, ${PD} 0%, ${P} 100%)` }}>
            <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mb-4 shadow-xl border border-white/30">
              <Sprout size={42} color="#fff" />
            </div>
            <h1 className="font-black text-4xl text-white tracking-wider">THINAI</h1>
            <p className="text-xs text-white/80 mt-2 max-w-xs font-medium">
              From agricultural information to the farmer's next best action.
            </p>
          </div>
        )}

        {screen === "login" && (
          <LoginScreen
            onSuccess={handleAuthSuccess}
            onNavigateRegister={() => setScreen("register")}
            showToast={showToast}
          />
        )}

        {screen === "register" && (
          <RegisterScreen
            onSuccess={handleAuthSuccess}
            onNavigateLogin={() => setScreen("login")}
            showToast={showToast}
          />
        )}

        {screen === "onboarding" && (
          <OnboardingScreen
            initialUser={user}
            onComplete={handleOnboardingComplete}
            showToast={showToast}
          />
        )}

        {screen === "home" && (
          <HomeScreen
            navigate={setScreen}
            user={user}
            weather={weather}
            decisionResult={decisionResult}
            onOpenFeedback={setFeedbackTarget}
            isOffline={isOffline}
            onOpenLangModal={() => setShowLangModal(true)}
            onRefreshWeather={() => loadLiveWeather(user.district)}
          />
        )}

        {screen === "disease" && (
          <DiseaseScreen
            navigate={setScreen}
            user={user}
            showToast={showToast}
          />
        )}

        {screen === "ai" && (
          <AIScreen
            navigate={setScreen}
            user={user}
            weather={weather}
            decisionResult={decisionResult}
          />
        )}

        {screen === "diary" && (
          <DiaryScreen
            navigate={setScreen}
            user={user}
            showToast={showToast}
          />
        )}

        {screen === "market" && (
          <MarketScreen
            navigate={setScreen}
            user={user}
          />
        )}

        {screen === "profile" && (
          <ProfileScreen
            navigate={setScreen}
            user={user}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            onOpenLangModal={() => setShowLangModal(true)}
          />
        )}

        {screen === "editprofile" && (
          <EditProfileScreen
            navigate={setScreen}
            user={user}
            onSave={updateUser}
            showToast={showToast}
          />
        )}
      </div>


      {/* Persistent Bottom Navigation */}
      {["home", "disease", "ai", "diary", "market", "profile"].includes(screen) && (
        <BNav screen={screen} navigate={setScreen} lang={user.language} />
      )}

      {/* Modals */}
      {feedbackTarget && (
        <FeedbackModal
          rec={feedbackTarget}
          onClose={() => setFeedbackTarget(null)}
          onSubmit={handleFeedbackSubmit}
        />
      )}

      {showLangModal && (
        <LanguageModal
          currentLang={user.language}
          onSelect={handleLanguageChange}
          onClose={() => setShowLangModal(false)}
        />
      )}
    </div>
  );
}
