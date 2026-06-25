import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Camera, MessageCircle, FileText, User, Cloud, Sun, Droplets, Wind,
  Thermometer, Leaf, TrendingUp, Bell, Settings, ChevronRight, ArrowLeft,
  Mic, Send, Mail, Lock, Eye, EyeOff, Check, AlertTriangle,
  Map, Calendar, Download, Star, Award, Volume2, Image, Globe, HelpCircle,
  LogOut, Moon, Shield, Zap, Activity, Search, Sprout, Bug,
  DollarSign, CloudRain, FlaskConical, Building, Info, Play,
  Trees, Wifi, Bot, Phone, ChevronDown, BarChart2,
  Microscope, RefreshCw, X, CheckCircle, AlertCircle, Edit3,
  Trash2, MapPin, Landmark
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen =
  | "splash" | "onboarding" | "language" | "login" | "register"
  | "otp" | "forgot" | "home" | "crop" | "soil" | "weather"
  | "market" | "disease" | "ai" | "voice" | "reports" | "notifications"
  | "profile" | "editprofile" | "settings" | "help" | "schemes";

type ToastType = "success" | "error" | "info" | "warning";

interface UserState {
  name: string; phone: string; email: string; password: string;
  village: string; district: string; stateName: string;
  farmSize: string; soilType: string; mainCrops: string; waterSource: string;
  language: string;
}

interface SettingsState {
  darkMode: boolean; notifications: boolean; offlineMode: boolean;
  privacy: boolean; language: string; fontSize: "small" | "medium" | "large";
}

interface DialogCfg {
  title: string; message: string; confirmText: string;
  cancelText?: string; onConfirm: () => void; danger?: boolean;
}

interface ToastState { message: string; type: ToastType; }
interface ChatMsg { from: "ai" | "user"; text: string; ts: Date; }

// ─── Colors ───────────────────────────────────────────────────────────────────
const P = "#2E7D32"; const PL = "#4CAF50"; const PD = "#1B5E20";
const ACC = "#FFC107"; const BG = "#F7FAF5"; const SURF = "#FFFFFF";
const ERR = "#D32F2F"; const TX = "#1A2E1B"; const MU = "#6B7C6D";
const BR = "rgba(46,125,50,0.15)";

const DEMO_USER: UserState = {
  name: "Demo Farmer", phone: "9876543210", email: "demo@thinai.in",
  password: "farmer123", village: "Papanasam", district: "Thanjavur",
  stateName: "Tamil Nadu", farmSize: "4.5", soilType: "Clay Loam",
  mainCrops: "Rice, Banana, Groundnut", waterSource: "Canal + Borewell",
  language: "Tamil",
};

const STATES_DISTRICTS: Record<string, string[]> = {
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Thanjavur", "Tiruchirappalli", "Salem"],
  "Maharashtra": ["Pune", "Mumbai", "Nashik", "Aurangabad", "Nagpur", "Solapur"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Kakinada"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"],
  "Uttar Pradesh": ["Lucknow", "Agra", "Varanasi", "Kanpur", "Allahabad"],
  "Punjab": ["Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda"],
};

const mainScreens: Screen[] = [
  "home","crop","soil","weather","market","disease","ai","voice",
  "reports","notifications","profile","editprofile","settings","help","schemes",
];

const getTab = (s: Screen) => {
  if (["home","crop","soil","weather","market","schemes"].includes(s)) return "home";
  if (["disease","voice"].includes(s)) return "scan";
  if (s === "ai") return "ai";
  if (["reports","notifications"].includes(s)) return "reports";
  return "profile";
};

// ─── Agricultural AI ──────────────────────────────────────────────────────────
const agriDB: { k: string[]; r: string }[] = [
  { k: ["hello","hi","help","start","hey","வணக்கம்","नमस्ते"],
    r: "👋 Hello! I am THINAI AI Agricultural Assistant.\n\nI can help you with:\n🌾 Crop recommendations\n🦠 Disease diagnosis\n🌱 Soil & fertilizer advice\n⛅ Weather guidance\n📈 Market prices\n🏛️ Government schemes\n💧 Irrigation planning\n\nAsk me anything about farming!" },
  { k: ["rice","paddy","dhaan","நெல்","dhan"],
    r: "🌾 Rice Cultivation Guide:\n• Best varieties: Ponni, IR64, Sona Masuri\n• Season: Kharif (Jun-Nov), Rabi (Nov-Feb)\n• Seed rate: 20-25 kg/ha (transplanting)\n• NPK: 120:60:60 kg/ha\n• Water: 1,200-1,600mm total\n• Harvest: 120-145 days\n\n⚠️ Watch for: Blast, Brown spot, BLB\n\nFor Tamil Nadu: Kuruvai (Jun-Sep) season recommended." },
  { k: ["wheat","gehun","கோதுமை"],
    r: "🌾 Wheat Cultivation:\n• Season: Rabi (Oct-Nov sowing)\n• Varieties: HD-2967, PBW-343\n• Seed rate: 100-125 kg/ha\n• NPK: 120:60:40 kg/ha\n• Irrigations: 4-6 times\n• Harvest: 120-130 days\n• MSP 2025-26: ₹2,275/quintal" },
  { k: ["disease","pest","infection","fungus","blast","blight","spot","rot","wilt","रोग","நோய்"],
    r: "🦠 Crop Disease Management:\n\n🔴 Fungal:\n• Blast: Tricyclazole 75WP @ 0.6g/L\n• Brown spot: Mancozeb 75WP @ 2g/L\n• Wilt: Carbendazim 50WP @ 1g/L\n\n🟡 Bacterial:\n• BLB: Copper oxychloride 3g/L\n\n🟢 Organic:\n• Neem oil 3% spray every 7 days\n• Trichoderma viride biocontrol\n\n📸 Use THINAI Disease Detection for instant AI diagnosis!" },
  { k: ["soil","மண்","ph","nitrogen","npk","fertilizer","nutrient","organic"],
    r: "🌱 Soil Health Management:\n• Ideal pH: 6.5-7.5 for most crops\n• Add FYM: 10-15 tonnes/ha/year\n• Nitrogen (N): For vegetative growth\n• Phosphorus (P): Root & flower development\n• Potassium (K): Disease resistance\n• Test soil every 2 years\n\n🔬 Get a free soil test at nearest KVK!" },
  { k: ["weather","rain","monsoon","temperature","மழை","forecast"],
    r: "⛅ Weather Advisory:\n• Current: 28°C, Partly Cloudy\n• Rain expected Thursday (90mm)\n• Humidity: 72%\n\n📋 Recommendations:\n• Skip spraying Tue-Thu\n• Irrigate by Tuesday before rain\n• Apply fungicide after rain\n• Optimal transplanting: Friday morning" },
  { k: ["market","price","sell","mandi","விலை","rate","apmc"],
    r: "📈 Today's Market Prices:\n• Rice (Ponni): ₹2,840/q ▲2.4%\n• Wheat: ₹2,150/q ▼1.2%\n• Maize: ₹1,920/q ▲3.8%\n• Cotton: ₹6,720/q ▲1.5%\n• Tomato: ₹1,200/q ▲8%\n\n💡 Best to sell 30 days post-harvest\n📱 Use e-NAM for online selling" },
  { k: ["government","scheme","subsidy","yojana","insurance","loan","credit"],
    r: "🏛️ Key Government Schemes:\n\n1. PM-KISAN: ₹6,000/year\n2. PM Fasal Bima: Crop insurance\n3. Kisan Credit Card: 7% loans\n4. Soil Health Card: Free testing\n5. PM-KUSUM: 90% solar pump subsidy\n6. eNAM: Online market platform\n\n☎️ Kisan Helpline: 1800-180-1551" },
  { k: ["irrigation","water","drip","sprinkler","பாசனம்","watering"],
    r: "💧 Smart Irrigation Guide:\n• Drip saves 40-60% water\n• Best timing: 6-8am or after sunset\n• Rice: 5cm standing water\n• Sugarcane: 10-12 day interval\n• Test: Soil should clump when squeezed\n\n🌞 Subsidy: 90% SC/ST, 45% general" },
  { k: ["harvest","yield","income","profit","அறுவடை","reap"],
    r: "🌾 Harvest Planning:\n• Rice: Harvest at 80-85% golden panicle\n• Moisture at harvest: 20-24%\n• Combine harvester: ₹1,200-1,500/hr\n• Dry to 14% moisture for storage\n• Use metal bins to prevent 10-15% post-harvest loss\n\n📊 AI management: +15-20% yield improvement" },
  { k: ["banana","வாழை","kela"],
    r: "🍌 Banana Cultivation:\n• Varieties: Robusta, Grand Naine, Nendran\n• Spacing: 1.8×1.8m (tissue culture)\n• NPK: 200:60:300 g/plant/year\n• Duration: 11-13 months\n• Price: ₹800-1,200/bunch" },
  { k: ["sugarcane","கரும்பு","ganna"],
    r: "🎋 Sugarcane Cultivation:\n• Varieties: Co 86032, Co 0238\n• Planting: Oct-Nov or Jan-Feb\n• NPK: 250:60:120 kg/ha\n• Duration: 10-12 months\n• Yield: 80-120 tonnes/ha\n• FRP: ₹285-315/quintal" },
];

function getAgriResponse(query: string): string {
  const q = query.toLowerCase().trim();
  for (const entry of agriDB) {
    if (entry.k.some(k => q.includes(k))) return entry.r;
  }
  return `🤔 Regarding "${query}":\n\nAs your AI agricultural assistant, I can advise on:\n• Which crops to grow based on your soil\n• Identifying plant diseases from photos\n• Soil nutrition and fertilizer scheduling\n• Irrigation planning and water saving\n• Market prices and best time to sell\n• Government schemes you qualify for\n\nCould you share more details about your crop or problem? I will give you the most accurate advice! 🌾`;
}

// ─── Shared Components ────────────────────────────────────────────────────────
function SBar({ light = false }: { light?: boolean }) {
  const c = light ? "rgba(255,255,255,0.92)" : TX;
  return (
    <div className="flex justify-between items-center px-5 pt-3 pb-1 text-[11px] font-semibold select-none"
      style={{ color: c, fontFamily: "Poppins, sans-serif" }}>
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <span style={{ fontSize: 9, letterSpacing: 1 }}>●●●●</span>
        <Wifi size={11} /><span style={{ fontSize: 10 }}>▐▌</span>
      </div>
    </div>
  );
}

function BkHdr({ title, navigate, dest = "home", light = false, right }: {
  title: string; navigate: (s: Screen) => void; dest?: Screen;
  light?: boolean; right?: React.ReactNode;
}) {
  const c = light ? "#fff" : TX;
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button onClick={() => navigate(dest)}
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: light ? "rgba(255,255,255,0.2)" : "rgba(46,125,50,0.08)" }}>
        <ArrowLeft size={18} color={c} />
      </button>
      <span className="font-bold text-base" style={{ color: c }}>{title}</span>
      <div className="w-9 h-9 flex items-center justify-center">{right}</div>
    </div>
  );
}

function BNav({ screen, navigate, unread }: { screen: Screen; navigate: (s: Screen) => void; unread: number }) {
  const tab = getTab(screen);
  const items = [
    { id: "home", icon: Home, label: "Home", dest: "home" as Screen },
    { id: "scan", icon: Camera, label: "Scan", dest: "disease" as Screen },
    { id: "ai", icon: Bot, label: "AI", dest: "ai" as Screen },
    { id: "reports", icon: BarChart2, label: "Reports", dest: "reports" as Screen },
    { id: "profile", icon: User, label: "Profile", dest: "profile" as Screen },
  ];
  return (
    <div className="flex items-center border-t px-1 py-2"
      style={{ borderColor: BR, background: SURF, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
      {items.map(it => {
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => navigate(it.dest)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1">
            {it.id === "ai" ? (
              <div className="w-12 h-12 rounded-full flex items-center justify-center -mt-5 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${PL}, ${P})` }}>
                <it.icon size={22} color="#fff" />
              </div>
            ) : (
              <div className="relative">
                <it.icon size={22} color={active ? P : MU} strokeWidth={active ? 2.5 : 1.8} />
                {it.id === "reports" && unread > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: ERR }}>
                    <span className="text-white font-bold" style={{ fontSize: 8 }}>{unread}</span>
                  </div>
                )}
              </div>
            )}
            {it.id !== "ai" && (
              <span className="text-[10px] font-semibold" style={{ color: active ? P : MU }}>{it.label}</span>
            )}
            {active && it.id !== "ai" && <div className="w-1 h-1 rounded-full" style={{ background: P }} />}
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

function InputField({ icon: Icon, placeholder, type = "text", value, onChange, error, disabled = false }: {
  icon: React.ElementType; placeholder: string; type?: string;
  value: string; onChange: (v: string) => void; error?: string; disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
        style={{ background: disabled ? "#F5F5F5" : "#F0F7F0", border: `1.5px solid ${error ? ERR : BR}`, opacity: disabled ? 0.6 : 1 }}>
        <Icon size={18} color={error ? ERR : P} />
        <input className="flex-1 bg-transparent outline-none text-sm font-medium"
          style={{ color: TX, fontFamily: "Poppins, sans-serif" }}
          type={isPass && !show ? "password" : "text"}
          placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)} disabled={disabled} />
        {isPass && (
          <button onClick={() => setShow(!show)} type="button">
            {show ? <EyeOff size={16} color={MU} /> : <Eye size={16} color={MU} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs mt-1 ml-2 flex items-center gap-1" style={{ color: ERR }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

function PBtn({ children, onClick, small = false, outline = false, loading = false, disabled = false, color }: {
  children: React.ReactNode; onClick?: () => void; small?: boolean;
  outline?: boolean; loading?: boolean; disabled?: boolean; color?: string;
}) {
  const bg = color || `linear-gradient(135deg, ${PL}, ${P})`;
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={`w-full font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${small ? "py-2.5 text-sm" : "py-4 text-base"}`}
      style={{
        background: outline ? "transparent" : (disabled ? "#E0E0E0" : bg),
        color: outline ? P : (disabled ? MU : "#fff"),
        border: outline ? `2px solid ${P}` : "none",
        boxShadow: outline || disabled ? "none" : "0 4px 16px rgba(46,125,50,0.3)",
        fontFamily: "Poppins, sans-serif", cursor: disabled ? "not-allowed" : "pointer",
      }}>
      {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
      {children}
    </button>
  );
}

function ToastEl({ toast }: { toast: ToastState }) {
  const cfg = {
    success: { color: P, bg: "#E8F5E9", icon: CheckCircle },
    error: { color: ERR, bg: "#FFEBEE", icon: AlertCircle },
    info: { color: "#1565C0", bg: "#E3F2FD", icon: Info },
    warning: { color: "#E65100", bg: "#FFF3E0", icon: AlertTriangle },
  }[toast.type];
  return (
    <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-16 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl"
      style={{ background: cfg.bg, border: `1.5px solid ${cfg.color}30` }}>
      <cfg.icon size={18} color={cfg.color} />
      <p className="text-sm font-semibold flex-1" style={{ color: cfg.color }}>{toast.message}</p>
    </motion.div>
  );
}

function ConfirmDialog({ dialog, onClose }: { dialog: DialogCfg; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
        className="w-full rounded-t-3xl p-6 pb-8" style={{ background: SURF }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: BR }} />
        <h3 className="font-bold text-lg mb-2" style={{ color: TX }}>{dialog.title}</h3>
        <p className="text-sm leading-5 mb-6" style={{ color: MU }}>{dialog.message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl font-bold text-sm"
            style={{ background: "#F0F7F0", color: TX }}>{dialog.cancelText || "Cancel"}</button>
          <button onClick={() => { dialog.onConfirm(); onClose(); }}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white"
            style={{ background: dialog.danger ? ERR : P }}>{dialog.confirmText}</button>
        </div>
      </motion.div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4" style={{ background: SURF, boxShadow: "0 2px 16px rgba(46,125,50,0.08)" }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl animate-pulse" style={{ background: "#E8F5E9" }} />
        <div className="flex-1">
          <div className="h-3 w-24 rounded animate-pulse mb-1.5" style={{ background: "#E8F5E9" }} />
          <div className="h-2.5 w-16 rounded animate-pulse" style={{ background: "#E8F5E9" }} />
        </div>
      </div>
      <div className="h-2.5 w-full rounded animate-pulse mb-2" style={{ background: "#E8F5E9" }} />
      <div className="h-2.5 w-3/4 rounded animate-pulse" style={{ background: "#E8F5E9" }} />
    </div>
  );
}

// ─── Splash ───────────────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full"
      style={{ background: `linear-gradient(160deg, ${PD} 0%, ${P} 55%, ${PL} 100%)` }}>
      <SBar light />
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}>
          <div className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)" }}>
            <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#A5D6A7" /><stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
              <path d="M40 8 Q68 18 64 54 Q50 76 34 66 Q12 54 14 34 Q18 8 40 8Z" fill="url(#lg1)" opacity="0.95" />
              <circle cx="40" cy="28" r="3" fill={P} /><circle cx="54" cy="32" r="3" fill={P} />
              <circle cx="50" cy="46" r="3" fill={P} /><circle cx="34" cy="44" r="3" fill={P} />
              <circle cx="30" cy="30" r="3" fill={P} />
              <line x1="40" y1="28" x2="54" y2="32" stroke={P} strokeWidth="1.5" />
              <line x1="54" y1="32" x2="50" y2="46" stroke={P} strokeWidth="1.5" />
              <line x1="50" y1="46" x2="34" y2="44" stroke={P} strokeWidth="1.5" />
              <line x1="34" y1="44" x2="30" y2="30" stroke={P} strokeWidth="1.5" />
              <line x1="30" y1="30" x2="40" y2="28" stroke={P} strokeWidth="1.5" />
              <circle cx="40" cy="28" r="1.5" fill="#fff" /><circle cx="54" cy="32" r="1.5" fill="#fff" />
              <circle cx="50" cy="46" r="1.5" fill="#fff" />
            </svg>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-center">
          <h1 className="font-black text-5xl tracking-widest mb-1"
            style={{ color: "#fff", textShadow: "0 2px 20px rgba(0,0,0,0.2)", fontFamily: "Poppins, sans-serif" }}>
            THIN<span style={{ color: ACC }}>AI</span>
          </h1>
          <p className="text-xs font-medium tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>
            Technology · Holistic · Intelligence
          </p>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="text-center text-sm font-medium px-10 leading-6" style={{ color: "rgba(255,255,255,0.8)" }}>
          Empowering Farmers with<br />Intelligent Decisions
        </motion.p>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="pb-10 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin mx-auto mb-3" />
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>v2.1.0 · Powered by AI</p>
      </motion.div>
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
const slides = [
  { icon: Sprout, color: P, bg: "#E8F5E9", title: "AI Crop Recommendation", desc: "Get personalized crop suggestions based on your soil data, location, and weather patterns using advanced machine learning." },
  { icon: Microscope, color: "#B71C1C", bg: "#FFEBEE", title: "AI Disease Detection", desc: "Instantly detect 50+ crop diseases by capturing a photo. Get organic and chemical treatment recommendations immediately." },
  { icon: Bot, color: "#1565C0", bg: "#E3F2FD", title: "Smart Farming Assistant", desc: "Chat with your personal AI farming expert in Tamil, Hindi, Telugu and more — available 24/7 for all agricultural queries." },
];

function OnboardingScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [step, setStep] = useState(0);
  const s = slides[step];
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <SBar />
      <div className="flex justify-end px-5 pt-2">
        <button onClick={() => navigate("language")} className="text-sm font-semibold" style={{ color: MU }}>Skip</button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
          <div className="w-48 h-48 rounded-[40px] flex items-center justify-center"
            style={{ background: s.bg, boxShadow: `0 20px 60px ${s.color}30` }}>
            <s.icon size={80} color={s.color} strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-2xl mb-3" style={{ color: TX }}>{s.title}</h2>
            <p className="text-sm leading-6" style={{ color: MU }}>{s.desc}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="pb-10 px-8 flex flex-col gap-5">
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setStep(i)} className="rounded-full transition-all"
              style={{ width: i === step ? 24 : 8, height: 8, background: i === step ? P : "rgba(46,125,50,0.2)" }} />
          ))}
        </div>
        <PBtn onClick={() => step < 2 ? setStep(step + 1) : navigate("language")}>
          {step < 2 ? "Next" : "Get Started →"}
        </PBtn>
      </div>
    </div>
  );
}

// ─── Language ─────────────────────────────────────────────────────────────────
const langs = [
  { name: "English", native: "English", flag: "🇬🇧", color: "#1565C0" },
  { name: "Tamil", native: "தமிழ்", flag: "🇮🇳", color: "#880E4F" },
  { name: "Hindi", native: "हिन्दी", flag: "🇮🇳", color: "#E65100" },
  { name: "Telugu", native: "తెలుగు", flag: "🇮🇳", color: "#1A237E" },
  { name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳", color: "#BF360C" },
  { name: "Malayalam", native: "മലയാളം", flag: "🇮🇳", color: "#1B5E20" },
];

function LanguageScreen({ navigate, onLangSelect }: { navigate: (s: Screen) => void; onLangSelect: (l: string) => void }) {
  const [sel, setSel] = useState("English");
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <SBar /><div className="px-5 pt-4 pb-2">
        <h2 className="font-bold text-2xl" style={{ color: TX }}>Choose Language</h2>
        <p className="text-sm mt-1" style={{ color: MU }}>Select your preferred language</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3" style={{ scrollbarWidth: "none" }}>
        <div className="grid grid-cols-2 gap-3">
          {langs.map(l => (
            <motion.button key={l.name} whileTap={{ scale: 0.97 }} onClick={() => setSel(l.name)}
              className="rounded-2xl p-4 flex flex-col items-center gap-2"
              style={{ background: sel === l.name ? `${l.color}12` : SURF, border: `2px solid ${sel === l.name ? l.color : BR}`, boxShadow: sel === l.name ? `0 4px 20px ${l.color}25` : "0 2px 8px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 36 }}>{l.flag}</span>
              <span className="font-bold text-base" style={{ color: TX }}>{l.native}</span>
              <span className="text-xs font-medium" style={{ color: MU }}>{l.name}</span>
              {sel === l.name && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: l.color }}>
                  <Check size={12} color="#fff" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="px-5 pb-8 pt-4">
        <PBtn onClick={() => { onLangSelect(sel); navigate("login"); }}>Continue with {sel}</PBtn>
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ navigate, registeredUser, onLogin, showToast }: {
  navigate: (s: Screen) => void; registeredUser: UserState | null;
  onLogin: (u: UserState) => void; showToast: (m: string, t?: ToastType) => void;
}) {
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [errors, setErrors] = useState<{ email?: string; pass?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format";
    if (!pass.trim()) e.pass = "Password is required";
    else if (pass.length < 6) e.pass = "Minimum 6 characters";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true); await new Promise(r => setTimeout(r, 1200)); setLoading(false);
    if (email === "demo@thinai.in" && pass === "farmer123") { onLogin(DEMO_USER); navigate("home"); return; }
    if (registeredUser && email === registeredUser.email && pass === registeredUser.password) { onLogin(registeredUser); navigate("home"); return; }
    setErrors({ general: "Invalid credentials. Try demo@thinai.in / farmer123" });
    showToast("Login failed. Check your credentials.", "error");
  };

  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div className="h-52 flex flex-col justify-end px-6 pb-8"
        style={{ background: `linear-gradient(160deg, ${PD}, ${P} 80%)`, borderRadius: "0 0 32px 32px" }}>
        <SBar light />
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,0.15)" }}>
          <Leaf size={28} color="#fff" />
        </div>
        <h2 className="font-black text-3xl text-white">Welcome Back</h2>
        <p className="text-sm text-white/70 mt-1">Sign in to your THINAI account</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        {errors.general && (
          <div className="flex items-center gap-2 p-3 rounded-2xl" style={{ background: "#FFEBEE" }}>
            <AlertCircle size={16} color={ERR} />
            <p className="text-xs font-semibold" style={{ color: ERR }}>{errors.general}</p>
          </div>
        )}
        <InputField icon={Mail} placeholder="Email address" value={email} onChange={v => { setEmail(v); setErrors({}); }} error={errors.email} />
        <InputField icon={Lock} placeholder="Password" type="password" value={pass} onChange={v => { setPass(v); setErrors({}); }} error={errors.pass} />
        <button className="text-right text-sm font-semibold" style={{ color: P }} onClick={() => navigate("forgot")}>Forgot Password?</button>
        <PBtn onClick={handleLogin} loading={loading}>{loading ? "Signing In..." : "Sign In"}</PBtn>
        <div className="rounded-2xl p-3 text-center" style={{ background: "#E8F5E9" }}>
          <p className="text-xs" style={{ color: MU }}>Demo: <strong style={{ color: P }}>demo@thinai.in</strong> / <strong style={{ color: P }}>farmer123</strong></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: BR }} />
          <span className="text-xs" style={{ color: MU }}>or continue with</span>
          <div className="flex-1 h-px" style={{ background: BR }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => showToast("Google Sign-In requires backend integration", "info")}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm"
            style={{ border: `1.5px solid ${BR}`, background: SURF, color: TX }}>
            <Globe size={16} color="#4285F4" /> Google
          </button>
          <button onClick={() => navigate("otp")}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm"
            style={{ border: `1.5px solid ${BR}`, background: SURF, color: TX }}>
            <Phone size={16} color={P} /> Phone OTP
          </button>
        </div>
        <p className="text-center text-sm" style={{ color: MU }}>
          {"Don't have an account? "}
          <button className="font-bold" style={{ color: P }} onClick={() => navigate("register")}>Register</button>
        </p>
      </div>
    </div>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────
function RegisterScreen({ navigate, onRegister, showToast }: {
  navigate: (s: Screen) => void; onRegister: (u: UserState) => void;
  showToast: (m: string, t?: ToastType) => void;
}) {
  const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState(""); const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("Tamil Nadu"); const [locLoading, setLocLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const detectLocation = () => {
    setLocLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => { setStateName("Tamil Nadu"); setDistrict("Thanjavur"); setLocLoading(false); showToast("Location detected: Thanjavur, Tamil Nadu", "success"); },
        () => { setLocLoading(false); showToast("GPS unavailable. Select location manually.", "warning"); },
        { timeout: 5000 }
      );
    } else { setLocLoading(false); showToast("GPS not supported. Select manually.", "warning"); }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name required";
    if (!/^\d{10}$/.test(phone)) e.phone = "Enter valid 10-digit mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter valid email";
    if (pass.length < 6) e.pass = "Minimum 6 characters";
    if (pass !== confirm) e.confirm = "Passwords do not match";
    if (!district) e.district = "Select your district";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true); await new Promise(r => setTimeout(r, 1500)); setLoading(false);
    const u: UserState = { name, phone, email, password: pass, village: "", district, stateName, farmSize: "2", soilType: "Clay Loam", mainCrops: "Rice", waterSource: "Borewell", language: "English" };
    onRegister(u); navigate("otp");
  };

  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div className="h-44 flex flex-col justify-end px-6 pb-6"
        style={{ background: `linear-gradient(160deg, ${PD}, ${P})`, borderRadius: "0 0 32px 32px" }}>
        <SBar light />
        <button onClick={() => navigate("login")} className="flex items-center gap-2 mb-3">
          <ArrowLeft size={18} color="rgba(255,255,255,0.8)" /><span className="text-sm text-white/70">Back</span>
        </button>
        <h2 className="font-black text-2xl text-white">Create Account</h2>
        <p className="text-sm text-white/70">Join 2M+ smart farmers on THINAI</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 flex flex-col gap-3.5" style={{ scrollbarWidth: "none" }}>
        <InputField icon={User} placeholder="Full Name" value={name} onChange={setName} error={errors.name} />
        <InputField icon={Phone} placeholder="Mobile Number (10 digits)" value={phone} onChange={setPhone} error={errors.phone} />
        <InputField icon={Mail} placeholder="Email Address" value={email} onChange={setEmail} error={errors.email} />
        <InputField icon={Lock} placeholder="Password (min 6 chars)" type="password" value={pass} onChange={setPass} error={errors.pass} />
        <InputField icon={Shield} placeholder="Confirm Password" type="password" value={confirm} onChange={setConfirm} error={errors.confirm} />
        <div>
          <p className="text-xs font-semibold mb-2 ml-1" style={{ color: MU }}>Select State</p>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(STATES_DISTRICTS).slice(0, 4).map(s => (
              <button key={s} onClick={() => { setStateName(s); setDistrict(""); }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: stateName === s ? `${P}15` : "#F0F7F0", color: stateName === s ? P : MU, border: `1.5px solid ${stateName === s ? P : "transparent"}` }}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold mb-2 ml-1" style={{ color: MU }}>Select District</p>
          <div className="flex gap-2 flex-wrap">
            {(STATES_DISTRICTS[stateName] || []).map(d => (
              <button key={d} onClick={() => setDistrict(d)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: district === d ? `${P}15` : "#F0F7F0", color: district === d ? P : MU, border: `1.5px solid ${district === d ? P : "transparent"}` }}>{d}</button>
            ))}
          </div>
          {errors.district && <p className="text-xs mt-1" style={{ color: ERR }}>{errors.district}</p>}
        </div>
        <button onClick={detectLocation} disabled={locLoading}
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
          style={{ background: "#E8F5E9", border: `1.5px solid ${BR}` }}>
          {locLoading ? <div className="w-4 h-4 border-2 border-green-300 border-t-green-700 rounded-full animate-spin" /> : <MapPin size={18} color={P} />}
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold" style={{ color: TX }}>{district ? `${district}, ${stateName}` : "Auto-detect GPS Location"}</p>
            <p className="text-xs" style={{ color: MU }}>Tap to detect or select above</p>
          </div>
        </button>
        <PBtn onClick={handleRegister} loading={loading}>{loading ? "Creating Account..." : "Create Account"}</PBtn>
        <p className="text-center text-xs pb-2" style={{ color: MU }}>
          By registering, you agree to our <span style={{ color: P }} className="font-semibold">Terms</span> & <span style={{ color: P }} className="font-semibold">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}

// ─── OTP ──────────────────────────────────────────────────────────────────────
function OTPScreen({ navigate, phone, onVerify, showToast }: {
  navigate: (s: Screen) => void; phone: string;
  onVerify: () => void; showToast: (m: string, t?: ToastType) => void;
}) {
  const [otp, setOtp] = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);
  const [error, setError] = useState("");
  const r0 = useRef<HTMLInputElement>(null); const r1 = useRef<HTMLInputElement>(null);
  const r2 = useRef<HTMLInputElement>(null); const r3 = useRef<HTMLInputElement>(null);
  const r4 = useRef<HTMLInputElement>(null); const r5 = useRef<HTMLInputElement>(null);
  const refs = [r0, r1, r2, r3, r4, r5];

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer(n => n - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const update = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const n = [...otp]; n[i] = v; setOtp(n); setError("");
    if (v && i < 5) refs[i + 1].current?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) refs[i - 1].current?.focus();
  };

  const verify = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Enter all 6 digits"); return; }
    setLoading(true); await new Promise(r => setTimeout(r, 1200)); setLoading(false);
    showToast("Phone verified successfully!", "success");
    onVerify(); navigate("home");
  };

  return (
    <div className="flex flex-col h-full items-center justify-center px-6" style={{ background: BG }}>
      <SBar />
      <button onClick={() => navigate("register")} className="absolute top-14 left-5"><ArrowLeft size={20} color={P} /></button>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: "#E8F5E9" }}>
        <Shield size={32} color={P} />
      </div>
      <h2 className="font-bold text-2xl text-center mb-2" style={{ color: TX }}>OTP Verification</h2>
      <p className="text-sm text-center mb-8" style={{ color: MU }}>
        Enter the 6-digit code sent to<br /><strong style={{ color: TX }}>+91 {phone || "9876543210"}</strong>
      </p>
      <div className="flex gap-3 mb-2">
        {otp.map((d, i) => (
          <input key={i} ref={refs[i]}
            className="w-12 h-14 text-center font-bold text-xl rounded-2xl outline-none"
            style={{ background: d ? "#E8F5E9" : SURF, border: `2px solid ${error ? ERR : d ? P : BR}`, color: TX, fontFamily: "Poppins, sans-serif" }}
            maxLength={1} value={d}
            onChange={e => update(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)} />
        ))}
      </div>
      {error && <p className="text-xs mb-4 font-semibold" style={{ color: ERR }}>{error}</p>}
      <p className="text-xs mb-2" style={{ color: MU }}>Demo OTP: <strong style={{ color: P }}>any 6 digits</strong></p>
      <div className="w-full flex flex-col gap-3 mt-4">
        <PBtn onClick={verify} loading={loading}>{loading ? "Verifying..." : "Verify OTP"}</PBtn>
        <button className="text-center text-sm font-semibold" style={{ color: resendTimer > 0 ? MU : P }}
          onClick={() => { if (resendTimer === 0) { setResendTimer(45); showToast("OTP resent!", "success"); } }}
          disabled={resendTimer > 0}>
          {resendTimer > 0 ? `Resend OTP in 0:${String(resendTimer).padStart(2, "0")}` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
function ForgotScreen({ navigate, showToast }: { navigate: (s: Screen) => void; showToast: (m: string, t?: ToastType) => void }) {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  const send = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("Enter a valid email address"); return; }
    setLoading(true); await new Promise(r => setTimeout(r, 1500)); setLoading(false); setSent(true); showToast("Reset link sent!", "success");
  };
  return (
    <div className="flex flex-col h-full items-center justify-center px-6" style={{ background: BG }}>
      <SBar /><button onClick={() => navigate("login")} className="absolute top-14 left-5"><ArrowLeft size={20} color={P} /></button>
      {!sent ? (
        <>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: "#FFF8E1" }}><Lock size={32} color={ACC} /></div>
          <h2 className="font-bold text-2xl mb-2" style={{ color: TX }}>Forgot Password?</h2>
          <p className="text-sm text-center mb-8" style={{ color: MU }}>Enter your registered email. We will send a password reset link.</p>
          <div className="w-full flex flex-col gap-4">
            <InputField icon={Mail} placeholder="Email Address" value={email} onChange={v => { setEmail(v); setErr(""); }} error={err} />
            <PBtn onClick={send} loading={loading}>{loading ? "Sending..." : "Send Reset Link"}</PBtn>
            <PBtn outline onClick={() => navigate("login")}>Back to Login</PBtn>
          </div>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: "#E8F5E9" }}><CheckCircle size={32} color={P} /></div>
          <h2 className="font-bold text-2xl mb-2" style={{ color: TX }}>Link Sent!</h2>
          <p className="text-sm text-center mb-8" style={{ color: MU }}>Check <strong style={{ color: TX }}>{email}</strong> for your reset link. Valid for 30 minutes.</p>
          <PBtn onClick={() => navigate("login")}>Back to Login</PBtn>
        </>
      )}
    </div>
  );
}

// ─── Home Dashboard ───────────────────────────────────────────────────────────
const mktPrices = [
  { crop: "Rice", price: 2840, change: 2.4 }, { crop: "Wheat", price: 2150, change: -1.2 },
  { crop: "Maize", price: 1920, change: 3.8 }, { crop: "Cotton", price: 6720, change: 1.5 },
];

function HomeScreen({ navigate, user, unread }: { navigate: (s: Screen) => void; user: UserState; unread: number }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 1000); return () => clearTimeout(t); }, []);
  const refresh = async () => { setRefreshing(true); await new Promise(r => setTimeout(r, 1200)); setRefreshing(false); };
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div className="px-5 pt-3 pb-5" style={{ background: `linear-gradient(160deg, ${PD} 0%, ${P} 100%)`, borderRadius: "0 0 28px 28px" }}>
        <SBar light />
        <div className="flex justify-between items-start mt-1">
          <div>
            <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{greeting},</p>
            <h2 className="font-bold text-xl text-white">{user.name} 👋</h2>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} color="rgba(255,255,255,0.7)" />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{user.district || "Set location"}, {user.stateName}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("notifications")}
              className="w-9 h-9 rounded-full flex items-center justify-center relative"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <Bell size={16} color="#fff" />
              {unread > 0 && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full" style={{ background: ACC }} />}
            </button>
            <button onClick={() => navigate("profile")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <span className="font-black text-white text-sm">{user.name.charAt(0)}</span>
            </button>
          </div>
        </div>
        <div className="mt-4 rounded-2xl p-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}>
          <Sun size={28} color={ACC} />
          <div className="flex-1">
            <p className="font-bold text-white text-lg">28°C · Partly Cloudy</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>Humidity 72% · Wind 12 km/h · Rain Thu</p>
          </div>
          <button onClick={() => navigate("weather")} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>7-day</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        <button onClick={refresh} className="flex items-center gap-2 self-end text-xs font-semibold" style={{ color: P }}>
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
        {loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : (
          <>
            <div>
              <p className="text-sm font-bold mb-3" style={{ color: TX }}>Quick Actions</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: Sprout, label: "Crops", dest: "crop", color: P, bg: "#E8F5E9" },
                  { icon: FlaskConical, label: "Soil", dest: "soil", color: "#7B1FA2", bg: "#F3E5F5" },
                  { icon: CloudRain, label: "Weather", dest: "weather", color: "#1565C0", bg: "#E3F2FD" },
                  { icon: DollarSign, label: "Market", dest: "market", color: "#E65100", bg: "#FFF3E0" },
                  { icon: Landmark, label: "Schemes", dest: "schemes", color: "#00695C", bg: "#E0F2F1" },
                  { icon: Calendar, label: "Calendar", dest: "reports", color: "#6A1B9A", bg: "#F3E5F5" },
                  { icon: Bug, label: "Disease", dest: "disease", color: ERR, bg: "#FFEBEE" },
                  { icon: Bot, label: "AI Help", dest: "ai", color: "#1565C0", bg: "#E3F2FD" },
                ].map(q => (
                  <motion.button key={q.label} whileTap={{ scale: 0.95 }} onClick={() => navigate(q.dest as Screen)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl" style={{ background: q.bg }}>
                    <q.icon size={20} color={q.color} />
                    <span className="text-[10px] font-semibold" style={{ color: q.color }}>{q.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            <Card>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#F3E5F5" }}><Activity size={16} color="#7B1FA2" /></div>
                  <span className="font-bold text-sm" style={{ color: TX }}>Soil Health</span>
                </div>
                <button onClick={() => navigate("soil")} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "#E8F5E9", color: P }}>View</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{ label: "pH", value: "6.8", status: "Good", color: P }, { label: "Nitrogen", value: "42%", status: "Low", color: "#E65100" }, { label: "Potassium", value: "78%", status: "Good", color: "#1565C0" }].map(n => (
                  <div key={n.label} className="text-center p-2 rounded-xl" style={{ background: `${n.color}10` }}>
                    <p className="font-black text-lg" style={{ color: n.color }}>{n.value}</p>
                    <p className="text-xs font-semibold" style={{ color: TX }}>{n.label}</p>
                    <p className="text-[10px]" style={{ color: n.color }}>{n.status}</p>
                  </div>
                ))}
              </div>
            </Card>
            <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("crop")}>
              <Card style={{ background: `linear-gradient(135deg, ${P}, ${PL})` }} className="cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}><Sprout size={24} color="#fff" /></div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-base">AI Crop Recommendation</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>AI suggests: Rice, Sugarcane, Banana</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1.5 rounded-full flex-1" style={{ background: "rgba(255,255,255,0.25)" }}>
                        <div className="h-full rounded-full" style={{ width: "87%", background: ACC }} />
                      </div>
                      <span className="text-xs font-bold text-white">87%</span>
                    </div>
                  </div>
                  <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
                </div>
              </Card>
            </motion.div>
            <Card>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FFF3E0" }}><TrendingUp size={16} color="#E65100" /></div>
                  <span className="font-bold text-sm" style={{ color: TX }}>Market Prices</span>
                </div>
                <button onClick={() => navigate("market")} className="text-xs font-semibold" style={{ color: P }}>See all</button>
              </div>
              {mktPrices.map(m => (
                <div key={m.crop} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: BR }}>
                  <span className="text-sm font-semibold" style={{ color: TX }}>{m.crop}</span>
                  <span className="font-bold text-sm" style={{ color: TX }}>₹{m.price}/q</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: m.change > 0 ? P : ERR, background: m.change > 0 ? "#E8F5E9" : "#FFEBEE" }}>
                    {m.change > 0 ? "▲" : "▼"} {Math.abs(m.change)}%
                  </span>
                </div>
              ))}
            </Card>
            <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("disease")}>
              <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #B71C1C, #EF5350)", boxShadow: "0 4px 20px rgba(183,28,28,0.3)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}><Bug size={24} color="#fff" /></div>
                <div className="flex-1"><p className="font-bold text-white">Disease Detection</p><p className="text-xs text-white/80">Scan your crop for diseases instantly</p></div>
                <Camera size={20} color="rgba(255,255,255,0.8)" />
              </div>
            </motion.div>
            <motion.div whileTap={{ scale: 0.98 }} onClick={() => navigate("schemes")}>
              <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #004D40, #00695C)", boxShadow: "0 4px 20px rgba(0,77,64,0.3)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}><Landmark size={24} color="#fff" /></div>
                <div className="flex-1"><p className="font-bold text-white">Government Schemes</p><p className="text-xs text-white/80">PM-KISAN, Fasal Bima & 10+ schemes</p></div>
                <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
              </div>
            </motion.div>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FFF8E1" }}><Zap size={16} color={ACC} /></div>
                <span className="font-bold text-sm" style={{ color: TX }}>{"Today's Tips"}</span>
              </div>
              {["Apply neem-based pesticide early morning for best results", "Irrigate rice fields every 3 days in this weather", "Rain Thursday — postpone spraying tomorrow"].map((t, i) => (
                <div key={i} className="flex items-start gap-2 py-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0" style={{ background: "#E8F5E9" }}><Check size={10} color={P} /></div>
                  <p className="text-xs leading-5" style={{ color: MU }}>{t}</p>
                </div>
              ))}
            </Card>
            <div className="h-2" />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Crop Recommendation ──────────────────────────────────────────────────────
function CropScreen({ navigate, user }: { navigate: (s: Screen) => void; user: UserState }) {
  const [showing, setShowing] = useState(false);
  const [soil, setSoil] = useState(user.soilType || "Clay Loam");
  const [loading, setLoading] = useState(false);
  const analyze = async () => { setLoading(true); await new Promise(r => setTimeout(r, 2000)); setLoading(false); setShowing(true); };
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div style={{ background: `linear-gradient(160deg, ${PD}, ${P})`, borderRadius: "0 0 24px 24px" }}>
        <SBar light /><BkHdr title="Crop Recommendation" navigate={navigate} light />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 rounded-full border-4 animate-spin" style={{ borderColor: `${P}30`, borderTopColor: P }} />
              <div className="absolute inset-0 flex items-center justify-center"><Sprout size={24} color={P} /></div>
            </div>
            <p className="font-bold" style={{ color: TX }}>AI Analyzing Farm Data...</p>
            {["Reading soil parameters", "Checking weather patterns", "Analyzing market trends"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: P, animationDelay: `${i * 0.3}s` }} />
                <p className="text-xs" style={{ color: MU }}>{s}</p>
              </div>
            ))}
          </div>
        )}
        {!loading && !showing && (
          <>
            <Card>
              <p className="font-bold text-sm mb-3" style={{ color: TX }}>Farm Information</p>
              {[
                { label: "Location", value: `${user.district || "Thanjavur"}, ${user.stateName}`, icon: Map, color: "#1565C0" },
                { label: "Previous Crop", value: "Groundnut", icon: Sprout, color: P },
                { label: "Rainfall", value: "820 mm/yr", icon: CloudRain, color: "#1565C0" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: BR }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${f.color}15` }}><f.icon size={15} color={f.color} /></div>
                  <span className="flex-1 text-sm" style={{ color: MU }}>{f.label}</span>
                  <span className="font-semibold text-sm" style={{ color: TX }}>{f.value}</span>
                </div>
              ))}
            </Card>
            <Card>
              <p className="font-bold text-sm mb-3" style={{ color: TX }}>Soil Parameters</p>
              <p className="text-xs mb-2" style={{ color: MU }}>Soil Type</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {["Sandy", "Clay Loam", "Black"].map(s => (
                  <button key={s} onClick={() => setSoil(s)} className="py-2 rounded-xl text-xs font-semibold"
                    style={{ background: soil === s ? `${P}15` : "#F0F7F0", color: soil === s ? P : MU, border: `1.5px solid ${soil === s ? P : "transparent"}` }}>{s}</button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{ label: "pH Level", value: "6.8" }, { label: "Nitrogen", value: "42 kg/ha" }, { label: "Phosphorus", value: "38 kg/ha" }, { label: "Potassium", value: "61 kg/ha" }, { label: "Moisture", value: "68%" }, { label: "Organic C", value: "0.8%" }].map(p => (
                  <div key={p.label} className="p-2 rounded-xl text-center" style={{ background: "#F0F7F0" }}>
                    <p className="font-bold text-sm" style={{ color: TX }}>{p.value}</p>
                    <p style={{ fontSize: 9, color: MU }} className="font-medium mt-0.5">{p.label}</p>
                  </div>
                ))}
              </div>
            </Card>
            <PBtn onClick={analyze}>🤖 Get AI Recommendation</PBtn>
          </>
        )}
        {!loading && showing && (
          <>
            <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${P}, ${PL})` }}>
              <div className="flex items-center gap-2 mb-1">
                <Sprout size={20} color="#fff" /><span className="font-bold text-white">AI Recommendation</span>
                <div className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: ACC, color: TX }}>87% Match</div>
              </div>
              <h2 className="font-black text-3xl text-white">Rice (Ponni)</h2>
              <p className="text-xs text-white/80 mt-1">Best for your {soil} soil</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Expected Yield", value: "5.2 t/ha", icon: TrendingUp, color: P, bg: "#E8F5E9" },
                { label: "Expected Profit", value: "₹1.4L/ha", icon: DollarSign, color: "#E65100", bg: "#FFF3E0" },
                { label: "Sustainability", value: "92%", icon: Leaf, color: "#1565C0", bg: "#E3F2FD" },
                { label: "Grow Period", value: "130 days", icon: Calendar, color: "#7B1FA2", bg: "#F3E5F5" },
              ].map(m => (
                <Card key={m.label} className="!p-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1" style={{ background: m.bg }}><m.icon size={14} color={m.color} /></div>
                  <p className="font-black text-base" style={{ color: TX }}>{m.value}</p>
                  <p className="text-xs" style={{ color: MU }}>{m.label}</p>
                </Card>
              ))}
            </div>
            <Card>
              <p className="font-bold text-sm mb-3" style={{ color: TX }}>Recommended Fertilizer</p>
              {[{ name: "Urea (N)", qty: "90 kg/ha", time: "Basal + 2 splits" }, { name: "DAP (P)", qty: "60 kg/ha", time: "Basal application" }, { name: "MOP (K)", qty: "40 kg/ha", time: "At transplanting" }].map(f => (
                <div key={f.name} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: BR }}>
                  <div><p className="font-semibold text-xs" style={{ color: TX }}>{f.name}</p><p style={{ fontSize: 10, color: MU }}>{f.time}</p></div>
                  <span className="font-bold text-sm px-2 py-1 rounded-xl" style={{ background: "#E8F5E9", color: P }}>{f.qty}</span>
                </div>
              ))}
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <PBtn small>Save Report</PBtn>
              <PBtn small outline onClick={() => setShowing(false)}>Re-analyse</PBtn>
            </div>
          </>
        )}
        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── Soil Analysis ────────────────────────────────────────────────────────────
const soilRadar = [
  { subject: "Nitrogen", A: 42 }, { subject: "Phosphorus", A: 68 },
  { subject: "Potassium", A: 78 }, { subject: "pH", A: 80 },
  { subject: "Moisture", A: 65 }, { subject: "Org.C", A: 55 },
];

function SoilScreen({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div style={{ background: "linear-gradient(160deg, #4A148C, #7B1FA2)", borderRadius: "0 0 24px 24px" }}>
        <SBar light /><BkHdr title="Soil Analysis" navigate={navigate} light />
        <div className="px-5 pb-4 flex gap-6">
          {[{ label: "Health Score", value: "74%" }, { label: "Condition", value: "Good" }, { label: "Tested", value: "Today" }].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-black text-xl text-white">{s.value}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        <Card>
          <p className="font-bold text-sm mb-2" style={{ color: TX }}>Nutrient Profile Radar</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={soilRadar}>
              <PolarGrid stroke={BR} /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: MU }} />
              <Radar name="Soil" dataKey="A" stroke={P} fill={P} fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "pH Level", value: "6.8", pct: 80, color: P, status: "Optimal", ideal: "6.5-7.5" },
            { label: "Moisture", value: "65%", pct: 65, color: "#1565C0", status: "Good", ideal: "60-80%" },
            { label: "Org. Carbon", value: "0.8%", pct: 55, color: "#7B1FA2", status: "Low", ideal: ">1.0%" },
            { label: "Nitrogen", value: "42 kg/ha", pct: 42, color: "#E65100", status: "Deficient", ideal: "80-120" },
            { label: "Phosphorus", value: "38 kg/ha", pct: 68, color: "#C2185B", status: "Adequate", ideal: "20-50" },
            { label: "Potassium", value: "61 kg/ha", pct: 78, color: "#00838F", status: "Good", ideal: "50-100" },
          ].map(n => (
            <Card key={n.label} className="!p-3">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-semibold" style={{ color: MU }}>{n.label}</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${n.color}15`, color: n.color }}>{n.status}</span>
              </div>
              <p className="font-black text-lg mb-1" style={{ color: TX }}>{n.value}</p>
              <div className="h-2 rounded-full" style={{ background: `${n.color}20` }}>
                <div className="h-full rounded-full" style={{ width: `${n.pct}%`, background: n.color }} />
              </div>
              <p className="text-[10px] mt-1" style={{ color: MU }}>Ideal: {n.ideal}</p>
            </Card>
          ))}
        </div>
        <Card style={{ background: "linear-gradient(135deg, #E8F5E9, #F1F8E9)" }}>
          <div className="flex items-center gap-2 mb-2"><Zap size={16} color={ACC} /><p className="font-bold text-sm" style={{ color: TX }}>AI Recommendation</p></div>
          <p className="text-xs leading-5" style={{ color: MU }}>⚠️ Nitrogen critically low. Apply 20 kg/ha Urea immediately. Add 2 t/ha compost to improve carbon. pH optimal for rice. Next soil test in 6 months.</p>
        </Card>
        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── Weather ──────────────────────────────────────────────────────────────────
const hourlyTemp = [{ h: "6am", t: 24 }, { h: "9am", t: 26 }, { h: "12pm", t: 31 }, { h: "3pm", t: 33 }, { h: "6pm", t: 29 }, { h: "9pm", t: 26 }, { h: "12am", t: 23 }];
const weekForecast = [{ day: "Mon", icon: "☀️", hi: 33, lo: 24, rain: 5 }, { day: "Tue", icon: "🌤️", hi: 31, lo: 23, rain: 10 }, { day: "Wed", icon: "🌧️", hi: 28, lo: 22, rain: 75 }, { day: "Thu", icon: "⛈️", hi: 26, lo: 21, rain: 90 }, { day: "Fri", icon: "🌦️", hi: 29, lo: 23, rain: 40 }, { day: "Sat", icon: "🌤️", hi: 32, lo: 24, rain: 10 }, { day: "Sun", icon: "☀️", hi: 34, lo: 25, rain: 5 }];

function WeatherScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [activeDay, setActiveDay] = useState(0);
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div style={{ background: "linear-gradient(160deg, #0D47A1, #1565C0 60%, #1976D2)", borderRadius: "0 0 24px 24px" }}>
        <SBar light /><BkHdr title="Weather Intelligence" navigate={navigate} light />
        <div className="px-5 pb-5 text-center">
          <div style={{ fontSize: 56 }}>☀️</div>
          <p className="font-black text-5xl text-white">28°C</p>
          <p className="text-white/80 text-sm mt-1">Partly Cloudy · Feels like 31°C</p>
          <div className="flex justify-center gap-6 mt-4">
            {[{ icon: Droplets, label: "Humidity", value: "72%" }, { icon: Wind, label: "Wind", value: "12 km/h" }, { icon: CloudRain, label: "Rain", value: "18%" }].map(w => (
              <div key={w.label} className="text-center">
                <w.icon size={16} color="rgba(255,255,255,0.8)" className="mx-auto mb-1" />
                <p className="font-bold text-white text-sm">{w.value}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>{w.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        <Card>
          <p className="font-bold text-sm mb-3" style={{ color: TX }}>Hourly Temperature (°C)</p>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={hourlyTemp}>
              <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1565C0" stopOpacity={0.3} /><stop offset="95%" stopColor="#1565C0" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="h" tick={{ fontSize: 10, fill: MU }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 11 }} formatter={(v: number) => [`${v}°C`, "Temp"]} />
              <Area type="monotone" dataKey="t" stroke="#1565C0" fill="url(#tg)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <p className="font-bold text-sm mb-3" style={{ color: TX }}>7-Day Forecast</p>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {weekForecast.map((d, i) => (
              <button key={d.day} onClick={() => setActiveDay(i)}
                className="flex flex-col items-center gap-1 rounded-2xl px-3 py-3 flex-shrink-0 min-w-[56px]"
                style={{ background: i === activeDay ? "#1565C015" : "#F0F7F0", border: i === activeDay ? `1.5px solid #1565C0` : "none" }}>
                <p className="text-xs font-semibold" style={{ color: i === activeDay ? "#1565C0" : MU }}>{d.day}</p>
                <span style={{ fontSize: 22 }}>{d.icon}</span>
                <p className="font-bold text-xs" style={{ color: TX }}>{d.hi}°</p>
                <p className="text-xs" style={{ color: MU }}>{d.lo}°</p>
                <p className="text-[9px] font-medium" style={{ color: d.rain > 60 ? "#1565C0" : MU }}>{d.rain}%</p>
              </button>
            ))}
          </div>
        </Card>
        <Card style={{ background: "linear-gradient(135deg, #E3F2FD, #EDE7F6)" }}>
          <div className="flex items-center gap-2 mb-2"><Droplets size={16} color="#1565C0" /><p className="font-bold text-sm" style={{ color: TX }}>Irrigation Advisor</p></div>
          <p className="text-xs leading-5" style={{ color: MU }}>⚠️ Heavy rain Wed-Thu (90mm). Skip irrigation Mon-Thu. Resume Friday morning. Apply fungicide Saturday to prevent blast.</p>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          {[{ label: "UV Index", value: "7 High", color: "#E65100" }, { label: "Visibility", value: "12 km", color: P }, { label: "Dew Point", value: "21°C", color: "#1565C0" }, { label: "Pressure", value: "1013 hPa", color: "#7B1FA2" }].map(m => (
            <Card key={m.label} className="!p-3"><p className="text-xs" style={{ color: MU }}>{m.label}</p><p className="font-bold text-base mt-1" style={{ color: m.color }}>{m.value}</p></Card>
          ))}
        </div>
        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── Market ───────────────────────────────────────────────────────────────────
const priceData = [{ day: "Mon", rice: 2800, wheat: 2100 }, { day: "Tue", rice: 2820, wheat: 2090 }, { day: "Wed", rice: 2790, wheat: 2120 }, { day: "Thu", rice: 2840, wheat: 2150 }, { day: "Fri", rice: 2860, wheat: 2130 }, { day: "Sat", rice: 2855, wheat: 2140 }, { day: "Sun", rice: 2840, wheat: 2150 }];
const allCrops = [
  { crop: "Rice (Ponni)", price: "₹2,840", change: "+2.4%", demand: "High", mandi: "Thanjavur", pos: true },
  { crop: "Wheat (Sharbati)", price: "₹2,150", change: "-1.2%", demand: "Medium", mandi: "Madurai", pos: false },
  { crop: "Maize (Hybrid)", price: "₹1,920", change: "+3.8%", demand: "High", mandi: "Coimbatore", pos: true },
  { crop: "Cotton (Long)", price: "₹6,720", change: "+1.5%", demand: "Medium", mandi: "Tirupur", pos: true },
  { crop: "Tomato", price: "₹1,200", change: "+8.0%", demand: "Very High", mandi: "Hosur", pos: true },
  { crop: "Groundnut", price: "₹5,400", change: "-0.8%", demand: "Medium", mandi: "Thiruvannamalai", pos: false },
];

function MarketScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [search, setSearch] = useState("");
  const filtered = allCrops.filter(c => c.crop.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div style={{ background: "linear-gradient(160deg, #BF360C, #E64A19)", borderRadius: "0 0 24px 24px" }}>
        <SBar light /><BkHdr title="Market Intelligence" navigate={navigate} light />
        <div className="px-5 pb-4 flex gap-3">
          {[{ label: "Best Today", value: "Tomato +8%" }, { label: "MSP Rice", value: "₹2,183/q" }].map(m => (
            <div key={m.label} className="flex-1 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.15)" }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{m.label}</p>
              <p className="font-bold text-white text-sm">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: SURF, border: `1.5px solid ${BR}` }}>
          <Search size={16} color={MU} />
          <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: TX, fontFamily: "Poppins, sans-serif" }}
            placeholder="Search crops..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")}><X size={14} color={MU} /></button>}
        </div>
        <Card>
          <p className="font-bold text-sm mb-3" style={{ color: TX }}>Weekly Price Trend</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={BR} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: MU }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: MU }} axisLine={false} tickLine={false} width={38} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 11 }} />
              <Line type="monotone" dataKey="rice" stroke={P} strokeWidth={2.5} dot={false} name="Rice" />
              <Line type="monotone" dataKey="wheat" stroke={ACC} strokeWidth={2.5} dot={false} name="Wheat" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1"><div className="w-3 h-1 rounded" style={{ background: P }} /><span className="text-xs" style={{ color: MU }}>Rice</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-1 rounded" style={{ background: ACC }} /><span className="text-xs" style={{ color: MU }}>Wheat</span></div>
          </div>
        </Card>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3"><Search size={40} color={MU} /><p className="font-semibold" style={{ color: TX }}>No crops found</p></div>
        ) : filtered.map(c => (
          <Card key={c.crop} className="!p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-sm" style={{ color: TX }}>{c.crop}</p>
                <div className="flex items-center gap-1 mt-1"><Building size={11} color={MU} /><span className="text-xs" style={{ color: MU }}>{c.mandi} APMC</span></div>
              </div>
              <div className="text-right">
                <p className="font-black text-base" style={{ color: TX }}>{c.price}/q</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: c.pos ? P : ERR }}>{c.change}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: (c.demand === "High" || c.demand === "Very High") ? "#E8F5E9" : "#FFF3E0", color: (c.demand === "High" || c.demand === "Very High") ? P : "#E65100" }}>
                {c.demand} Demand
              </span>
            </div>
          </Card>
        ))}
        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── Disease Detection ────────────────────────────────────────────────────────
function DiseaseScreen({ navigate, showToast }: { navigate: (s: Screen) => void; showToast: (m: string, t?: ToastType) => void }) {
  const [step, setStep] = useState<"perm" | "scan" | "scanning" | "result">("perm");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (step === "scanning") { const t = setTimeout(() => setStep("result"), 2500); return () => clearTimeout(t); }
  }, [step]);
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setImagePreview(URL.createObjectURL(file)); setStep("scanning"); }
  };
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div style={{ background: "linear-gradient(160deg, #880E4F, #C2185B)", borderRadius: "0 0 24px 24px" }}>
        <SBar light /><BkHdr title="Disease Detection" navigate={navigate} light />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        {step === "perm" && (
          <div className="flex flex-col items-center py-8 gap-5">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "#FCE4EC" }}><Camera size={40} color="#C2185B" /></div>
            <h3 className="font-bold text-xl" style={{ color: TX }}>Camera Permission</h3>
            <p className="text-sm text-center leading-5" style={{ color: MU }}>THINAI needs camera access to photograph your crop. Images are processed securely and not stored without consent.</p>
            <div className="w-full flex flex-col gap-3">
              <PBtn onClick={() => setStep("scan")} color="linear-gradient(135deg, #C2185B, #880E4F)">Allow Camera Access</PBtn>
              <PBtn outline onClick={() => fileRef.current?.click()}>Upload from Gallery</PBtn>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
          </div>
        )}
        {step === "scan" && (
          <>
            <div className="rounded-3xl overflow-hidden relative" style={{ height: 220, background: "#1a1a1a" }}>
              {imagePreview ? <img src={imagePreview} alt="Crop" className="w-full h-full object-cover" /> : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"><Camera size={40} color="rgba(255,255,255,0.3)" /><p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Camera preview</p></div>
              )}
              <div className="absolute inset-4 border-2 border-white/30 rounded-2xl">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setStep("scanning")} className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #C2185B, #880E4F)" }}><Camera size={18} /> Take Photo</button>
              <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm" style={{ background: "#FCE4EC", color: "#C2185B" }}><Image size={18} /> Upload</button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
            <Card style={{ background: "#FCE4EC" }}>
              <p className="font-bold text-xs mb-1" style={{ color: "#880E4F" }}>📸 Tips for best results</p>
              <p className="text-xs leading-5" style={{ color: "#880E4F" }}>Photograph the diseased leaf in bright natural light. Capture only the affected area clearly.</p>
            </Card>
          </>
        )}
        {step === "scanning" && (
          <div className="flex flex-col items-center py-12 gap-6">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full border-4 animate-spin" style={{ borderColor: `${P}30`, borderTopColor: P }} />
              <div className="absolute inset-4 rounded-full border-4 animate-spin" style={{ borderColor: `${ACC}30`, borderTopColor: ACC, animationDirection: "reverse", animationDuration: "0.8s" }} />
              <div className="absolute inset-0 flex items-center justify-center"><Microscope size={36} color={P} /></div>
            </div>
            <div className="text-center"><p className="font-bold text-lg" style={{ color: TX }}>AI Analysing Crop...</p><p className="text-sm mt-1" style={{ color: MU }}>Scanning for 50+ disease patterns</p></div>
            <div className="w-full px-8">
              <div className="h-2 rounded-full" style={{ background: "#E8F5E9" }}>
                <motion.div className="h-full rounded-full" style={{ background: P }} initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.5 }} />
              </div>
            </div>
          </div>
        )}
        {step === "result" && (
          <>
            <div className="rounded-2xl p-4" style={{ background: "#FFEBEE" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#FFCDD2" }}><Bug size={24} color={ERR} /></div>
                <div className="flex-1"><p className="font-black text-lg" style={{ color: ERR }}>Blast Disease</p><p className="text-xs" style={{ color: MU }}>Pyricularia oryzae · Rice</p></div>
                <div className="text-right"><p className="font-black text-2xl" style={{ color: ERR }}>94%</p><p className="text-xs" style={{ color: MU }}>Confidence</p></div>
              </div>
              <div className="h-2 rounded-full" style={{ background: "#FFCDD2" }}><div className="h-full rounded-full" style={{ width: "94%", background: ERR }} /></div>
              <p className="text-xs mt-2 leading-4" style={{ color: MU }}>Diamond-shaped lesions on leaves. Spreads rapidly in humid conditions.</p>
            </div>
            <Card>
              <p className="font-bold text-sm mb-3" style={{ color: TX }}>🌿 Organic Treatment</p>
              {["Spray neem oil (3%) every 7 days for 3 weeks", "Apply Trichoderma viride (5g/L water)", "Remove and burn infected leaves immediately"].map(t => (
                <div key={t} className="flex items-start gap-2 py-1.5"><Check size={14} color={P} className="mt-0.5 flex-shrink-0" /><p className="text-xs leading-5" style={{ color: MU }}>{t}</p></div>
              ))}
            </Card>
            <Card>
              <p className="font-bold text-sm mb-3" style={{ color: TX }}>💊 Chemical Treatment</p>
              {["Tricyclazole 75 WP @ 0.6 g/L — spray 2× (7-day interval)", "Carbendazim 50 WP @ 1 g/L — post-infection spray"].map(t => (
                <div key={t} className="flex items-start gap-2 py-1.5"><div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#1565C0" }} /><p className="text-xs leading-5" style={{ color: MU }}>{t}</p></div>
              ))}
            </Card>
            <Card>
              <p className="font-bold text-sm mb-3" style={{ color: TX }}>🏥 Nearby Agricultural Centers</p>
              {[{ name: "KVK Thanjavur", dist: "4.2 km", phone: "04362-264555" }, { name: "Agri Dept. Office", dist: "2.8 km", phone: "04362-230100" }].map(c => (
                <div key={c.name} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: BR }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}><Building size={16} color={P} /></div>
                  <div className="flex-1"><p className="font-semibold text-sm" style={{ color: TX }}>{c.name}</p><p className="text-xs" style={{ color: MU }}>{c.dist} · {c.phone}</p></div>
                  <button onClick={() => showToast(`Calling ${c.name}...`, "info")} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}><Phone size={14} color={P} /></button>
                </div>
              ))}
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <PBtn small onClick={() => showToast("Report saved!", "success")}>Save Report</PBtn>
              <PBtn small outline onClick={() => setStep("perm")}>Scan Again</PBtn>
            </div>
          </>
        )}
        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── AI Assistant ─────────────────────────────────────────────────────────────
const initMsgs: ChatMsg[] = [
  { from: "ai", text: "👋 Hello! I am THINAI AI Assistant. How can I help with your farming today?\n\nTry: crop advice, disease help, soil tips, weather update, market prices, or govt schemes.", ts: new Date() },
];
const quickChips = ["Crop advice", "Disease help", "Soil tips", "Weather update", "Market prices", "Govt schemes", "Irrigation guide"];

function AIScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>(initMsgs);
  const [input, setInput] = useState(""); const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const send = useCallback((text?: string) => {
    const q = (text || input).trim(); if (!q) return;
    setMsgs(m => [...m, { from: "user", text: q, ts: new Date() }]);
    setInput(""); setIsTyping(true);
    setTimeout(() => { setIsTyping(false); setMsgs(m => [...m, { from: "ai", text: getAgriResponse(q), ts: new Date() }]); }, 1000 + Math.random() * 800);
  }, [input]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, isTyping]);

  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div style={{ background: `linear-gradient(160deg, ${PD}, ${P})` }}>
        <SBar light />
        <div className="px-4 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}><Bot size={22} color="#fff" /></div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">THINAI AI Assistant</p>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#69F0AE" }} /><p style={{ fontSize: 10, color: "rgba(255,255,255,0.75)" }}>Online · Agricultural Expert · 6 Languages</p></div>
          </div>
          <button onClick={() => navigate("voice")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}><Mic size={16} color="#fff" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        <div className="flex flex-wrap gap-2 pb-1">
          {quickChips.map(c => (
            <button key={c} onClick={() => send(c)} className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "#E8F5E9", color: P, border: `1px solid ${BR}` }}>{c}</button>
          ))}
        </div>
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {m.from === "ai" && <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ background: P }}><Bot size={14} color="#fff" /></div>}
            <div className="max-w-[78%]">
              <div className="rounded-2xl px-4 py-3"
                style={{ background: m.from === "user" ? P : SURF, color: m.from === "user" ? "#fff" : TX, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px" }}>
                <p className="text-xs leading-5 whitespace-pre-line">{m.text}</p>
              </div>
              <p className="text-[9px] mt-1 px-1" style={{ color: MU }}>{m.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: P }}><Bot size={14} color="#fff" /></div>
            <div className="rounded-2xl px-4 py-3 flex items-center gap-1" style={{ background: SURF }}>
              {[0,1,2].map(i => <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: MU }} animate={{ y: [0,-6,0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i*0.15 }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="px-4 pb-5 pt-2">
        <div className="flex items-center gap-2 rounded-2xl px-4 py-3" style={{ background: SURF, border: `1.5px solid ${BR}`, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <input className="flex-1 text-sm bg-transparent outline-none" style={{ color: TX, fontFamily: "Poppins, sans-serif" }}
            placeholder="Ask about farming..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
          <button className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FFF3E0" }}><Image size={15} color={ACC} /></button>
          <button onClick={() => send()} className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: input.trim() ? `linear-gradient(135deg, ${PL}, ${P})` : "#F0F7F0" }}>
            <Send size={15} color={input.trim() ? "#fff" : MU} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Voice Assistant ──────────────────────────────────────────────────────────
function VoiceScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const toggle = () => { setListening(l => { if (!l) setTranscript(""); return !l; }); };
  useEffect(() => {
    if (!listening) return;
    const t = setTimeout(() => { setTranscript("What crops should I plant this month?"); setListening(false); }, 3000);
    return () => clearTimeout(t);
  }, [listening]);
  return (
    <div className="flex flex-col h-full items-center justify-center" style={{ background: `linear-gradient(160deg, ${PD} 0%, ${P} 60%, ${PL} 100%)` }}>
      <SBar light />
      <button onClick={() => navigate("ai")} className="absolute top-14 left-5"><ArrowLeft size={20} color="rgba(255,255,255,0.8)" /></button>
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <p className="font-bold text-white/80 text-sm tracking-widest uppercase">Voice Assistant</p>
        <div className="relative">
          {listening && [1,2,3].map(r => (
            <motion.div key={r} className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(255,255,255,0.3)" }}
              animate={{ scale: [1, 1.5 + r*0.3], opacity: [0.5,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: r*0.3 }} />
          ))}
          <button onClick={toggle} className="w-28 h-28 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: listening ? "#fff" : "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.5)" }}>
            <Mic size={44} color={listening ? P : "#fff"} />
          </button>
        </div>
        <div className="text-center">
          <p className="font-bold text-white text-lg">{listening ? "Listening..." : "Tap to Speak"}</p>
          <p className="text-white/60 text-sm mt-1">{listening ? "Speak in any language" : "Ask about crops, weather, market"}</p>
        </div>
        {listening && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div key={i} className="w-1 rounded-full" style={{ background: "rgba(255,255,255,0.8)" }}
                animate={{ height: [8, Math.random()*32+8, 8] }} transition={{ repeat: Infinity, duration: 0.6, delay: i*0.05 }} />
            ))}
          </div>
        )}
        {transcript && (
          <div className="mx-6 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.15)" }}>
            <p className="text-white text-sm text-center">"{transcript}"</p>
            <button onClick={() => navigate("ai")} className="mt-3 w-full py-2 rounded-xl font-semibold text-sm" style={{ background: ACC, color: TX }}>Get AI Response</button>
          </div>
        )}
        <div className="flex gap-3">
          {["Tamil", "Hindi", "English"].map(l => (
            <div key={l} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function ReportsScreen({ navigate, showToast }: { navigate: (s: Screen) => void; showToast: (m: string, t?: ToastType) => void }) {
  const [search, setSearch] = useState("");
  const reports = [
    { title: "Crop Recommendation Report", date: "25 Jun 2026", icon: Sprout, color: P, bg: "#E8F5E9", pages: 4, tag: "Crop" },
    { title: "Soil Analysis Report", date: "24 Jun 2026", icon: FlaskConical, color: "#7B1FA2", bg: "#F3E5F5", pages: 6, tag: "Soil" },
    { title: "Weather Analysis Report", date: "23 Jun 2026", icon: CloudRain, color: "#1565C0", bg: "#E3F2FD", pages: 3, tag: "Weather" },
    { title: "Market Price Report", date: "22 Jun 2026", icon: TrendingUp, color: "#E65100", bg: "#FFF3E0", pages: 5, tag: "Market" },
    { title: "Disease Detection Log", date: "20 Jun 2026", icon: Bug, color: ERR, bg: "#FFEBEE", pages: 2, tag: "Disease" },
    { title: "Yield Prediction Report", date: "18 Jun 2026", icon: BarChart2, color: "#00695C", bg: "#E0F2F1", pages: 4, tag: "Crop" },
  ];
  const filtered = reports.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.tag.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div style={{ background: `linear-gradient(160deg, ${PD}, ${P})`, borderRadius: "0 0 24px 24px" }}>
        <SBar light />
        <div className="px-5 pb-4 pt-2 flex justify-between items-center">
          <div><h2 className="font-bold text-xl text-white">Reports</h2><p className="text-xs text-white/70">{reports.length} reports generated</p></div>
          <button onClick={() => showToast("Generating new report...", "info")} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>+ Generate</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: SURF, border: `1.5px solid ${BR}` }}>
          <Search size={16} color={MU} />
          <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: TX, fontFamily: "Poppins, sans-serif" }}
            placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")}><X size={14} color={MU} /></button>}
        </div>
        {filtered.map(r => (
          <Card key={r.title} className="!p-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: r.bg }}><r.icon size={22} color={r.color} /></div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: TX }}>{r.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: r.bg, color: r.color }}>{r.tag}</span>
                  <span className="text-xs" style={{ color: MU }}>{r.date} · {r.pages}pp</span>
                </div>
              </div>
              <button onClick={() => showToast(`Downloading ${r.tag} report...`, "success")}
                className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
                <Download size={16} color={P} />
              </button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <div className="flex flex-col items-center py-12 gap-3"><FileText size={40} color={MU} /><p className="font-semibold" style={{ color: TX }}>No reports found</p></div>}
        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────
function NotificationsScreen({ navigate, notifications, markAllRead }: {
  navigate: (s: Screen) => void;
  notifications: { id: number; icon: React.ElementType; color: string; bg: string; title: string; msg: string; time: string; unread: boolean }[];
  markAllRead: () => void;
}) {
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div style={{ background: `linear-gradient(160deg, ${PD}, ${P})`, borderRadius: "0 0 24px 24px" }}>
        <SBar light />
        <BkHdr title="Notifications" navigate={navigate} light right={<button onClick={markAllRead} className="text-[10px] text-white/70 font-semibold whitespace-nowrap">Mark all read</button>} />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        {notifications.map(n => (
          <motion.div key={n.id} layout className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: SURF, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", opacity: n.unread ? 1 : 0.75 }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: n.bg }}><n.icon size={18} color={n.color} /></div>
            <div className="flex-1">
              <div className="flex items-center gap-2"><p className="font-bold text-sm" style={{ color: TX }}>{n.title}</p>{n.unread && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: P }} />}</div>
              <p className="text-xs leading-4 mt-0.5" style={{ color: MU }}>{n.msg}</p>
              <p className="text-[10px] mt-1.5 font-medium" style={{ color: P }}>{n.time}</p>
            </div>
          </motion.div>
        ))}
        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfileScreen({ navigate, user, showDialog, showToast, onLogout }: {
  navigate: (s: Screen) => void; user: UserState; showDialog: (d: DialogCfg) => void;
  showToast: (m: string, t?: ToastType) => void; onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div className="pb-8" style={{ background: `linear-gradient(160deg, ${PD}, ${P})`, borderRadius: "0 0 32px 32px" }}>
        <SBar light />
        <div className="flex justify-end px-5 pt-2 gap-2">
          <button onClick={() => navigate("editprofile")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}><Edit3 size={16} color="#fff" /></button>
          <button onClick={() => navigate("settings")} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}><Settings size={16} color="#fff" /></button>
        </div>
        <div className="flex flex-col items-center mt-2">
          <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
            <span className="font-black text-3xl text-white">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <h2 className="font-bold text-xl text-white mt-3">{user.name}</h2>
          <p className="text-sm text-white/70">Progressive Farmer · {user.district || "India"}</p>
          <div className="flex gap-2 mt-3">
            <div className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: ACC, color: TX }}>Gold Farmer</div>
            <div className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>THINAI Member</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        <div className="grid grid-cols-3 gap-3">
          {[{ label: "Farm Area", value: `${user.farmSize || "2"} ha` }, { label: "Crops", value: "8" }, { label: "Reports", value: "6" }].map(s => (
            <Card key={s.label} className="!p-3 text-center"><p className="font-black text-xl" style={{ color: P }}>{s.value}</p><p className="text-xs" style={{ color: MU }}>{s.label}</p></Card>
          ))}
        </div>
        <Card>
          <p className="font-bold text-sm mb-3" style={{ color: TX }}>Farm Details</p>
          {[{ label: "Village", value: user.village || "—" }, { label: "District", value: user.district || "—" }, { label: "State", value: user.stateName }, { label: "Soil Type", value: user.soilType }, { label: "Water Source", value: user.waterSource }, { label: "Main Crops", value: user.mainCrops }, { label: "Phone", value: `+91 ${user.phone}` }, { label: "Email", value: user.email }].map(d => (
            <div key={d.label} className="flex justify-between py-2 border-b last:border-0" style={{ borderColor: BR }}>
              <span className="text-xs" style={{ color: MU }}>{d.label}</span>
              <span className="text-xs font-semibold text-right" style={{ color: TX, maxWidth: "55%" }}>{d.value}</span>
            </div>
          ))}
        </Card>
        {[
          { icon: Globe, label: "Language", value: user.language, dest: "language" },
          { icon: Landmark, label: "Government Schemes", value: "", dest: "schemes" },
          { icon: HelpCircle, label: "Help & Support", value: "", dest: "help" },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.dest as Screen)}
            className="w-full rounded-2xl p-4 flex items-center gap-3" style={{ background: SURF, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}><item.icon size={18} color={P} /></div>
            <span className="flex-1 text-sm font-semibold text-left" style={{ color: TX }}>{item.label}</span>
            {item.value && <span className="text-xs font-medium" style={{ color: MU }}>{item.value}</span>}
            <ChevronRight size={16} color={MU} />
          </button>
        ))}
        <button onClick={() => showDialog({ title: "Logout", message: "Are you sure you want to logout from THINAI? You will need to sign in again.", confirmText: "Logout", danger: true, onConfirm: onLogout })}
          className="w-full rounded-2xl p-4 flex items-center gap-3" style={{ background: "#FFEBEE" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FFCDD2" }}><LogOut size={18} color={ERR} /></div>
          <span className="flex-1 text-sm font-semibold text-left" style={{ color: ERR }}>Logout</span>
        </button>
        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── Edit Profile ─────────────────────────────────────────────────────────────
function EditProfileScreen({ navigate, user, onSave, showToast }: {
  navigate: (s: Screen) => void; user: UserState; onSave: (u: UserState) => void; showToast: (m: string, t?: ToastType) => void;
}) {
  const [form, setForm] = useState({ ...user });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof UserState) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    if (!form.name.trim()) { showToast("Name cannot be empty", "error"); return; }
    setLoading(true); await new Promise(r => setTimeout(r, 1000)); setLoading(false);
    onSave(form); showToast("Profile updated successfully!", "success"); navigate("profile");
  };
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div style={{ background: `linear-gradient(160deg, ${PD}, ${P})`, borderRadius: "0 0 24px 24px" }}>
        <SBar light /><BkHdr title="Edit Profile" navigate={navigate} dest="profile" light right={<button onClick={save} className="text-sm font-bold text-white">Save</button>} />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2" style={{ background: "#E8F5E9", border: `3px solid ${P}` }}>
            <span className="font-black text-3xl" style={{ color: P }}>{form.name.charAt(0).toUpperCase()}</span>
          </div>
          <button className="text-sm font-semibold" style={{ color: P }}>Change Photo</button>
        </div>
        <Card>
          <p className="font-bold text-xs mb-3 uppercase tracking-wider" style={{ color: MU }}>Personal Info</p>
          <div className="flex flex-col gap-3">
            <InputField icon={User} placeholder="Full Name" value={form.name} onChange={set("name")} />
            <InputField icon={Phone} placeholder="Mobile Number" value={form.phone} onChange={set("phone")} />
            <InputField icon={Mail} placeholder="Email" value={form.email} onChange={set("email")} />
          </div>
        </Card>
        <Card>
          <p className="font-bold text-xs mb-3 uppercase tracking-wider" style={{ color: MU }}>Farm Details</p>
          <div className="flex flex-col gap-3">
            <InputField icon={MapPin} placeholder="Village" value={form.village} onChange={set("village")} />
            <InputField icon={Map} placeholder="Farm Size (hectares)" value={form.farmSize} onChange={set("farmSize")} />
            <InputField icon={Sprout} placeholder="Main Crops" value={form.mainCrops} onChange={set("mainCrops")} />
            <InputField icon={Droplets} placeholder="Water Source" value={form.waterSource} onChange={set("waterSource")} />
          </div>
        </Card>
        <Card>
          <p className="font-bold text-xs mb-2 uppercase tracking-wider" style={{ color: MU }}>Soil Type</p>
          <div className="grid grid-cols-3 gap-2">
            {["Sandy", "Clay Loam", "Black", "Red", "Alluvial", "Laterite"].map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, soilType: s }))}
                className="py-2 rounded-xl text-xs font-semibold"
                style={{ background: form.soilType === s ? `${P}15` : "#F0F7F0", color: form.soilType === s ? P : MU, border: `1.5px solid ${form.soilType === s ? P : "transparent"}` }}>{s}</button>
            ))}
          </div>
        </Card>
        <PBtn onClick={save} loading={loading}>{loading ? "Saving..." : "Save Profile"}</PBtn>
        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsScreen({ navigate, settings, updateSettings, showDialog, showToast, onDeleteAccount }: {
  navigate: (s: Screen) => void; settings: SettingsState; updateSettings: (s: Partial<SettingsState>) => void;
  showDialog: (d: DialogCfg) => void; showToast: (m: string, t?: ToastType) => void; onDeleteAccount: () => void;
}) {
  const Toggle = ({ on, toggle }: { on: boolean; toggle: () => void }) => (
    <button onClick={toggle} className="w-12 h-6 rounded-full relative" style={{ background: on ? P : "#E0E0E0" }}>
      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: on ? "calc(100% - 22px)" : "2px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </button>
  );
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div style={{ background: `linear-gradient(160deg, ${PD}, ${P})`, borderRadius: "0 0 24px 24px" }}>
        <SBar light /><BkHdr title="Settings" navigate={navigate} dest="profile" light />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        <Card>
          <p className="font-bold text-xs mb-3 uppercase tracking-wider" style={{ color: MU }}>Appearance</p>
          <div className="flex items-center gap-3 py-3 border-b" style={{ borderColor: BR }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}><Moon size={17} color={P} /></div>
            <div className="flex-1"><p className="font-semibold text-sm" style={{ color: TX }}>Dark Mode</p><p className="text-xs" style={{ color: MU }}>Switch to dark theme</p></div>
            <Toggle on={settings.darkMode} toggle={() => updateSettings({ darkMode: !settings.darkMode })} />
          </div>
          <div className="pt-3">
            <p className="font-semibold text-sm mb-2" style={{ color: TX }}>Font Size</p>
            <div className="flex gap-2">
              {(["small","medium","large"] as const).map(f => (
                <button key={f} onClick={() => updateSettings({ fontSize: f })} className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize"
                  style={{ background: settings.fontSize === f ? `${P}15` : "#F0F7F0", color: settings.fontSize === f ? P : MU, border: `1.5px solid ${settings.fontSize === f ? P : "transparent"}` }}>{f}</button>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <p className="font-bold text-xs mb-3 uppercase tracking-wider" style={{ color: MU }}>Preferences</p>
          {[
            { label: "Notifications", desc: "Weather, market & disease alerts", key: "notifications" as const, icon: Bell },
            { label: "Offline Mode", desc: "Access without internet", key: "offlineMode" as const, icon: Wifi },
            { label: "Data Privacy", desc: "Share analytics to improve AI", key: "privacy" as const, icon: Shield },
          ].map(s => (
            <div key={s.key} className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: BR }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}><s.icon size={17} color={P} /></div>
              <div className="flex-1"><p className="font-semibold text-sm" style={{ color: TX }}>{s.label}</p><p className="text-xs" style={{ color: MU }}>{s.desc}</p></div>
              <Toggle on={settings[s.key]} toggle={() => updateSettings({ [s.key]: !settings[s.key] })} />
            </div>
          ))}
        </Card>
        <Card>
          <p className="font-bold text-xs mb-3 uppercase tracking-wider" style={{ color: MU }}>Language & Region</p>
          <button className="w-full flex items-center gap-3 py-2" onClick={() => navigate("language")}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}><Globe size={17} color={P} /></div>
            <div className="flex-1 text-left"><p className="font-semibold text-sm" style={{ color: TX }}>App Language</p><p className="text-xs" style={{ color: MU }}>{settings.language}</p></div>
            <ChevronRight size={16} color={MU} />
          </button>
        </Card>
        <Card>
          <p className="font-bold text-xs mb-3 uppercase tracking-wider" style={{ color: MU }}>Account</p>
          <button onClick={() => showToast("Password reset link sent to your email!", "success")}
            className="w-full flex items-center gap-3 py-3 border-b" style={{ borderColor: BR }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E8F5E9" }}><Lock size={17} color={P} /></div>
            <span className="flex-1 font-semibold text-sm text-left" style={{ color: TX }}>Change Password</span>
            <ChevronRight size={16} color={MU} />
          </button>
          <button onClick={() => showDialog({ title: "Delete Account", message: "This is permanent. All your farm data, reports, and history will be deleted and cannot be recovered.", confirmText: "Delete Account", danger: true, onConfirm: onDeleteAccount })}
            className="w-full flex items-center gap-3 py-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FFEBEE" }}><Trash2 size={17} color={ERR} /></div>
            <span className="flex-1 font-semibold text-sm text-left" style={{ color: ERR }}>Delete Account</span>
            <ChevronRight size={16} color={MU} />
          </button>
        </Card>
        <div className="rounded-2xl p-4 text-center" style={{ background: "#E8F5E9" }}>
          <p className="font-bold text-sm" style={{ color: P }}>THINAI v2.1.0</p>
          <p className="text-xs mt-1" style={{ color: MU }}>Build 2026.06 · Made with ❤️ for Indian Farmers</p>
        </div>
        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── Help & Support ───────────────────────────────────────────────────────────
function HelpScreen({ navigate, showToast }: { navigate: (s: Screen) => void; showToast: (m: string, t?: ToastType) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "How does AI crop recommendation work?", a: "Our AI analyses your soil NPK, pH, location, climate data, and market prices to suggest the most profitable crops. Trained on data from 10M+ Indian farms with 92% recommendation accuracy." },
    { q: "Can I use THINAI offline?", a: "Yes! Enable Offline Mode in Settings. Saved reports, soil analysis, and farming guides work without internet. AI features require connectivity." },
    { q: "How accurate is disease detection?", a: "Our deep learning model achieves 94% accuracy across 50+ crop diseases, trained on 500,000+ plant images. Always confirm with a local agronomist for critical decisions." },
    { q: "Which languages are supported?", a: "English, Tamil, Hindi, Telugu, Kannada, and Malayalam. Voice assistant supports all 6 languages with text-to-speech." },
    { q: "How do I apply for PM-KISAN?", a: "Visit your nearest CSC with Aadhaar and bank passbook, or apply at pmkisan.gov.in. THINAI Schemes section has step-by-step guidance." },
  ];
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div style={{ background: `linear-gradient(160deg, ${PD}, ${P})`, borderRadius: "0 0 24px 24px" }}>
        <SBar light /><BkHdr title="Help & Support" navigate={navigate} dest="profile" light />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Phone, label: "Kisan Helpline", value: "1800-180-1551", color: P, bg: "#E8F5E9" },
            { icon: Mail, label: "Email Support", value: "help@thinai.in", color: "#1565C0", bg: "#E3F2FD" },
          ].map(c => (
            <button key={c.label} onClick={() => showToast(`Connecting to ${c.label}...`, "info")}>
              <Card className="!p-3 text-left">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: c.bg }}><c.icon size={18} color={c.color} /></div>
                <p className="font-bold text-xs" style={{ color: TX }}>{c.label}</p>
                <p className="text-xs mt-0.5" style={{ color: c.color }}>{c.value}</p>
              </Card>
            </button>
          ))}
        </div>
        <Card>
          <p className="font-bold text-sm mb-3" style={{ color: TX }}>Frequently Asked Questions</p>
          {faqs.map((f, i) => (
            <div key={i} className="border-b last:border-0" style={{ borderColor: BR }}>
              <button className="w-full flex items-center justify-between py-3 text-left" onClick={() => setOpen(open === i ? null : i)}>
                <span className="font-semibold text-sm flex-1 pr-2" style={{ color: TX }}>{f.q}</span>
                <ChevronDown size={16} color={MU} style={{ transform: open === i ? "rotate(180deg)" : "none", transition: "0.2s", flexShrink: 0 }} />
              </button>
              {open === i && <p className="text-xs leading-5 pb-3" style={{ color: MU }}>{f.a}</p>}
            </div>
          ))}
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-3"><Play size={16} color={P} /><p className="font-bold text-sm" style={{ color: TX }}>Tutorial Videos</p></div>
          {["Getting Started with THINAI", "How to Use Crop Recommendation", "Disease Detection Guide", "Understanding Market Intelligence"].map(v => (
            <button key={v} onClick={() => showToast("Opening tutorial...", "info")} className="w-full flex items-center gap-3 py-2.5 border-b last:border-0 text-left" style={{ borderColor: BR }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5E9" }}><Play size={16} color={P} /></div>
              <span className="flex-1 text-xs font-semibold" style={{ color: TX }}>{v}</span>
              <ChevronRight size={14} color={MU} />
            </button>
          ))}
        </Card>
        <Card>
          <p className="font-bold text-sm mb-3" style={{ color: TX }}>Rate THINAI</p>
          <div className="flex gap-2 justify-center mb-3">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => showToast("Thank you for your rating! 🙏", "success")}>
                <Star size={28} color={s <= 4 ? ACC : MU} fill={s <= 4 ? ACC : "none"} />
              </button>
            ))}
          </div>
          <p className="text-xs text-center" style={{ color: MU }}>Your feedback helps improve THINAI for farmers</p>
        </Card>
        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── Government Schemes ───────────────────────────────────────────────────────
const schemesData = [
  { name: "PM-KISAN", desc: "₹6,000/year direct income support in 3 instalments of ₹2,000 each", icon: DollarSign, color: "#00695C", bg: "#E0F2F1", tag: "Income Support", apply: "pmkisan.gov.in" },
  { name: "PM Fasal Bima Yojana", desc: "Crop insurance at 1.5-2% premium for Kharif and Rabi crops", icon: Shield, color: "#1565C0", bg: "#E3F2FD", tag: "Insurance", apply: "pmfby.gov.in" },
  { name: "Kisan Credit Card", desc: "Short-term crop loans at 7% per annum with ₹3 lakh limit", icon: Award, color: "#E65100", bg: "#FFF3E0", tag: "Credit", apply: "Nearest Bank" },
  { name: "Soil Health Card", desc: "Free soil testing every 2 years with fertilizer recommendations", icon: FlaskConical, color: "#7B1FA2", bg: "#F3E5F5", tag: "Free Service", apply: "soilhealth.dac.gov.in" },
  { name: "PM-KUSUM Scheme", desc: "90% subsidy on solar pumps for SC/ST farmers, 45% for general", icon: Zap, color: "#F57F17", bg: "#FFF8E1", tag: "Solar Energy", apply: "mnre.gov.in" },
  { name: "eNAM Portal", desc: "Online trading platform connecting farmers to 1,000+ mandis nationally", icon: TrendingUp, color: P, bg: "#E8F5E9", tag: "Market Access", apply: "enam.gov.in" },
];

function SchemesScreen({ navigate, showToast }: { navigate: (s: Screen) => void; showToast: (m: string, t?: ToastType) => void }) {
  const [filter, setFilter] = useState("All");
  const tags = ["All", "Income Support", "Insurance", "Credit", "Free Service", "Solar Energy", "Market Access"];
  const filtered = filter === "All" ? schemesData : schemesData.filter(s => s.tag === filter);
  return (
    <div className="flex flex-col h-full" style={{ background: BG }}>
      <div style={{ background: "linear-gradient(160deg, #004D40, #00695C)", borderRadius: "0 0 24px 24px" }}>
        <SBar light /><BkHdr title="Government Schemes" navigate={navigate} light />
        <p className="px-5 pb-4 text-white/70 text-xs">6 schemes available · Updated 2025-26</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {tags.map(t => (
            <button key={t} onClick={() => setFilter(t)} className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ background: filter === t ? "#00695C" : SURF, color: filter === t ? "#fff" : MU, border: `1.5px solid ${filter === t ? "#00695C" : BR}` }}>{t}</button>
          ))}
        </div>
        {filtered.map(s => (
          <Card key={s.name} className="!p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}><s.icon size={22} color={s.color} /></div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-sm" style={{ color: TX }}>{s.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: s.bg, color: s.color }}>{s.tag}</span>
                </div>
                <p className="text-xs mt-1 leading-4" style={{ color: MU }}>{s.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1"><Globe size={11} color={MU} /><span className="text-xs" style={{ color: MU }}>{s.apply}</span></div>
              <button onClick={() => showToast(`Opening ${s.name} portal...`, "info")} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: s.bg, color: s.color }}>Apply Now</button>
            </div>
          </Card>
        ))}
        <Card style={{ background: "linear-gradient(135deg, #E0F2F1, #E8F5E9)" }}>
          <div className="flex items-center gap-2 mb-2"><Phone size={16} color="#00695C" /><p className="font-bold text-sm" style={{ color: TX }}>PM Kisan Helpline</p></div>
          <p className="font-black text-xl" style={{ color: "#00695C" }}>1800-180-1551</p>
          <p className="text-xs mt-1" style={{ color: MU }}>Free call · Mon-Sat 6am-10pm · All languages</p>
          <button onClick={() => showToast("Connecting to PM Kisan Helpline...", "info")} className="mt-3 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "#00695C", color: "#fff" }}>Call Helpline</button>
        </Card>
        <div className="h-2" />
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const defaultNotifs = [
  { id: 1, icon: CloudRain, color: "#1565C0", bg: "#E3F2FD", title: "Rain Alert", msg: "Heavy rain expected Thursday. Protect crops and postpone irrigation.", time: "2 min ago", unread: true },
  { id: 2, icon: TrendingUp, color: "#E65100", bg: "#FFF3E0", title: "Price Alert", msg: "Rice prices up 2.4% at Thanjavur APMC. Good time to sell!", time: "1 hr ago", unread: true },
  { id: 3, icon: Bug, color: ERR, bg: "#FFEBEE", title: "Disease Outbreak", msg: "Blast disease reported in nearby farms. Check your rice crop.", time: "3 hr ago", unread: false },
  { id: 4, icon: Award, color: "#7B1FA2", bg: "#F3E5F5", title: "PM-KISAN", msg: "Next installment (₹2,000) will be credited within 3 days.", time: "Yesterday", unread: false },
  { id: 5, icon: Zap, color: ACC, bg: "#FFF8E1", title: "Farming Tip", msg: "Apply micro-nutrients this week for better yield before monsoon.", time: "2 days ago", unread: false },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [user, setUser] = useState<UserState | null>(null);
  const [regData, setRegData] = useState<Partial<UserState>>({});
  const [settings, setSettings] = useState<SettingsState>({ darkMode: false, notifications: true, offlineMode: false, privacy: true, language: "English", fontSize: "medium" });
  const [toast, setToast] = useState<ToastState | null>(null);
  const [dialog, setDialog] = useState<DialogCfg | null>(null);
  const [notifications, setNotifications] = useState(defaultNotifs);

  useEffect(() => {
    if (screen === "splash") { const t = setTimeout(() => setScreen("onboarding"), 2800); return () => clearTimeout(t); }
  }, [screen]);

  const navigate = (s: Screen) => setScreen(s);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type }); setTimeout(() => setToast(null), 3500);
  }, []);

  const showDialog = useCallback((d: DialogCfg) => setDialog(d), []);
  const updateSettings = useCallback((s: Partial<SettingsState>) => setSettings(p => ({ ...p, ...s })), []);
  const onLogin = (u: UserState) => setUser(u);
  const onRegister = (u: UserState) => setRegData(u);
  const onLogout = () => { setUser(null); setRegData({}); setScreen("login"); };
  const onDeleteAccount = () => { setUser(null); setRegData({}); setScreen("onboarding"); };
  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, unread: false })));
  const unread = notifications.filter(n => n.unread).length;
  const showNav = mainScreens.includes(screen);
  const u = user || DEMO_USER;

  const renderScreen = () => {
    switch (screen) {
      case "splash":        return <SplashScreen />;
      case "onboarding":   return <OnboardingScreen navigate={navigate} />;
      case "language":     return <LanguageScreen navigate={navigate} onLangSelect={l => updateSettings({ language: l })} />;
      case "login":        return <LoginScreen navigate={navigate} registeredUser={regData as UserState | null} onLogin={onLogin} showToast={showToast} />;
      case "register":     return <RegisterScreen navigate={navigate} onRegister={onRegister} showToast={showToast} />;
      case "otp":          return <OTPScreen navigate={navigate} phone={regData.phone || ""} onVerify={() => onLogin(regData as UserState)} showToast={showToast} />;
      case "forgot":       return <ForgotScreen navigate={navigate} showToast={showToast} />;
      case "home":         return <HomeScreen navigate={navigate} user={u} unread={unread} />;
      case "crop":         return <CropScreen navigate={navigate} user={u} />;
      case "soil":         return <SoilScreen navigate={navigate} />;
      case "weather":      return <WeatherScreen navigate={navigate} />;
      case "market":       return <MarketScreen navigate={navigate} />;
      case "disease":      return <DiseaseScreen navigate={navigate} showToast={showToast} />;
      case "ai":           return <AIScreen navigate={navigate} />;
      case "voice":        return <VoiceScreen navigate={navigate} />;
      case "reports":      return <ReportsScreen navigate={navigate} showToast={showToast} />;
      case "notifications":return <NotificationsScreen navigate={navigate} notifications={notifications} markAllRead={markAllRead} />;
      case "profile":      return <ProfileScreen navigate={navigate} user={u} showDialog={showDialog} showToast={showToast} onLogout={onLogout} />;
      case "editprofile":  return <EditProfileScreen navigate={navigate} user={u} onSave={setUser} showToast={showToast} />;
      case "settings":     return <SettingsScreen navigate={navigate} settings={settings} updateSettings={updateSettings} showDialog={showDialog} showToast={showToast} onDeleteAccount={onDeleteAccount} />;
      case "help":         return <HelpScreen navigate={navigate} showToast={showToast} />;
      case "schemes":      return <SchemesScreen navigate={navigate} showToast={showToast} />;
      default:             return <HomeScreen navigate={navigate} user={u} unread={unread} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)", fontFamily: "Poppins, sans-serif" }}>
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: PL }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: ACC }} />
      </div>
      <div className="relative md:w-[390px] md:h-[844px] w-full h-screen">
        <div className="hidden md:block absolute -inset-[3px] bg-gray-900 rounded-[48px] shadow-2xl" />
        <div className="absolute inset-0 md:rounded-[44px] overflow-hidden flex flex-col" style={{ background: BG }}>
          <div className="hidden md:block absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[34px] bg-black rounded-full z-50" />
          <AnimatePresence mode="wait">
            <motion.div key={screen} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex flex-col flex-1 overflow-hidden">
              {showNav ? (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-hidden relative">{renderScreen()}</div>
                  <BNav screen={screen} navigate={navigate} unread={unread} />
                </div>
              ) : renderScreen()}
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>{toast && <ToastEl toast={toast} />}</AnimatePresence>
          <AnimatePresence>{dialog && <ConfirmDialog dialog={dialog} onClose={() => setDialog(null)} />}</AnimatePresence>
          <div className="hidden md:block absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 rounded-full" />
        </div>
      </div>
      <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-3 max-w-[160px]">
        <div><p className="font-black text-2xl" style={{ color: ACC }}>THIN<span className="text-white">AI</span></p><p className="text-xs text-white/60 mt-1">Smart Farming Platform</p></div>
        <div className="flex flex-col gap-2 mt-3">
          {[{ label: "Dynamic Auth", icon: Shield }, { label: "Agricultural AI", icon: Bot }, { label: "Disease Detection", icon: Bug }, { label: "Market Intelligence", icon: TrendingUp }, { label: "Govt. Schemes", icon: Landmark }, { label: "6 Languages", icon: Globe }].map(f => (
            <div key={f.label} className="flex items-center gap-2"><f.icon size={13} color={ACC} /><span className="text-white/70 text-xs">{f.label}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
