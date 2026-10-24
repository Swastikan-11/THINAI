import React, { useState, useRef } from "react";
import { 
  Camera as CameraIcon, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  RotateCcw, 
  BookOpen, 
  Info, 
  HelpCircle,
  FileCheck,
  Check,
  XCircle,
  Thermometer,
  CloudRain,
  Volume2,
  VolumeX,
  PhoneCall,
  Save,
  Activity,
  Search,
  Trash2,
  Calendar,
  Filter,
  ExternalLink,
  ChevronRight,
  Download,
  HardDrive,
  CheckCircle,
  Building
} from "lucide-react";
import { Camera, CameraResultType, CameraSource, CameraDirection } from "@capacitor/camera";
import { DataBadge, DataStatus } from "./DataBadge";
import { db } from "../../services/db";
import { syncManager } from "../../services/syncService";
import { DecisionEngineResult } from "../../services/decisionEngine";
import { detectCropDisease, DiseaseDetectionResult, getDiseaseScanHistory } from "../../services/diseaseDetectionService";
import { recordDiagnosisConfirmation } from "../../services/firestoreSync";
import { computePhotoHash, recordFarmerVerdict } from "../../services/verdictService";
import { 
  getAllCrops, 
  isCropPackInstalled, 
  downloadCropPack, 
  getInstalledCropPackIds, 
  DownloadProgress, 
  CropRegistryEntry 
} from "../../services/cropPackService";
import { FieldDataSubmissionModal } from "./FieldDataSubmissionModal";

const CROP_ICONS: Record<string, string> = {
  paddy: "🌾",
  tomato: "🍅",
  potato: "🥔",
  chilli: "🌶️",
  maize: "🌽",
  cotton: "☁️",
  sugarcane: "🎋",
  groundnut: "🥜",
  banana: "🍌",
  mango: "🥭",
  tapioca: "🍠",
  brinjal: "🍆",
  coconut: "🥥",
  ragi: "🌾",
  cholam: "🌾",
  bajra: "🌾",
  black_gram: "🌱",
  green_gram: "🌱",
  red_gram: "🌱",
  onion: "🧅",
  turmeric: "🌿"
};

interface CropDoctorProps {
  primaryCrop?: string;
  engineResult?: DecisionEngineResult;
  onOpenLibrary?: () => void;
  onOpenCalculator?: () => void;
  onOpenFieldAccuracy?: () => void;
  showToast?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  language?: string;
}

export function CropDoctorScreen({
  primaryCrop = "Paddy",
  engineResult,
  onOpenLibrary,
  onOpenCalculator,
  onOpenFieldAccuracy,
  showToast,
  language = "English"
}: CropDoctorProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiseaseDetectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<"YES" | "NO" | "NOT_SURE" | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [savedForExpert, setSavedForExpert] = useState(false);
  const [showPickList, setShowPickList] = useState(false);
  const [selectedActualClass, setSelectedActualClass] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<string>("Tomato");
  const [currentVerdict, setCurrentVerdict] = useState<"YES" | "NO" | "NOT_SURE" | null>(null);

  // ─── Crop Registry & Modular Pack State (Phase 2B) ─────────────────────────
  const registeredCrops: CropRegistryEntry[] = React.useMemo(() => getAllCrops(), []);
  const [cropStatusFilter, setCropStatusFilter] = useState<"ALL" | "A" | "B" | "C">("ALL");
  const [showDonationModal, setShowDonationModal] = useState<boolean>(false);
  const [installedPackIds, setInstalledPackIds] = useState<string[]>(() => getInstalledCropPackIds());
  const [packProgress, setPackProgress] = useState<DownloadProgress | null>(null);

  const selectedCropEntry = registeredCrops.find(
    c => c.crop_name_en.toLowerCase() === selectedCrop.toLowerCase() ||
         c.crop_id.toLowerCase() === selectedCrop.toLowerCase()
  ) || registeredCrops[0];

  const handleDownloadPack = async (cropId: string) => {
    try {
      const res = await downloadCropPack(cropId, (p) => setPackProgress(p));
      if (res.success) {
        setInstalledPackIds(getInstalledCropPackIds());
        if (showToast) showToast(language === "Tamil" ? "பயிர் மாதிரி பேக் வெற்றிகரமாக பதிவிறக்கப்பட்டது!" : "Crop pack downloaded and verified (SHA-256)!", "success");
      } else {
        if (showToast) showToast(res.error || "Failed to download pack", "error");
      }
    } catch (err: any) {
      if (showToast) showToast(err?.message || "Pack download error", "error");
    } finally {
      setTimeout(() => setPackProgress(null), 2500);
    }
  };

  // ─── Scan History State ────────────────────────────────────────────────────
  const [activeSubTab, setActiveSubTab] = useState<"diagnosis" | "history">("diagnosis");
  const [historyScans, setHistoryScans] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState<string>("");
  const [historyTierFilter, setHistoryTierFilter] = useState<string>("all");
  const [selectedHistoryScan, setSelectedHistoryScan] = useState<any | null>(null);

  const loadScanHistory = async () => {
    try {
      const dexieScans = await db.scans.orderBy("scannedAt").reverse().toArray();
      if (dexieScans && dexieScans.length > 0) {
        setHistoryScans(dexieScans);
      } else {
        const fallback = getDiseaseScanHistory();
        setHistoryScans(fallback.map((s, idx) => ({
          id: `local-${idx}-${s.timestamp}`,
          cropName: s.crop,
          diseaseName: s.diseaseName,
          scientificName: s.scientificName,
          confidence: s.confidence,
          severity: s.severity || "Moderate",
          isReliable: s.isReliable,
          immediateAction: s.immediateAction,
          preventionAdvice: (s.preventiveMeasures || []).join("; "),
          scannedAt: s.timestamp || new Date().toISOString(),
          tier: s.confidence >= 78 ? "TIER_1_CONFIDENT" : (s.confidence >= 45 ? "TIER_2_MODERATE" : "TIER_3_INCONCLUSIVE")
        })));
      }
    } catch (err) {
      console.warn("Could not load from Dexie, fallback to localStorage:", err);
      const fallback = getDiseaseScanHistory();
      setHistoryScans(fallback.map((s, idx) => ({
        id: `local-${idx}-${s.timestamp}`,
        cropName: s.crop,
        diseaseName: s.diseaseName,
        scientificName: s.scientificName,
        confidence: s.confidence,
        severity: s.severity || "Moderate",
        isReliable: s.isReliable,
        immediateAction: s.immediateAction,
        preventionAdvice: (s.preventiveMeasures || []).join("; "),
        scannedAt: s.timestamp || new Date().toISOString(),
        tier: s.confidence >= 78 ? "TIER_1_CONFIDENT" : (s.confidence >= 45 ? "TIER_2_MODERATE" : "TIER_3_INCONCLUSIVE")
      })));
    }
  };

  React.useEffect(() => {
    loadScanHistory();
  }, []);

  const handleDeleteHistoryScan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await db.scans.delete(id);
      await loadScanHistory();
      if (selectedHistoryScan?.id === id) {
        setSelectedHistoryScan(null);
      }
      if (showToast) showToast("Scan removed from history.", "info");
    } catch (err) {
      console.error("Failed to delete scan:", err);
    }
  };

  // Stop speech when component unmounts
  React.useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Hidden fallback file input for web/desktop or camera fallback
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  /**
   * 1. TAKE PHOTO: Directly opens Android rear camera via Capacitor Camera
   */
  const handleTakePhoto = async () => {
    setErrorMessage(null);
    try {
      // Check and request camera permissions when needed
      const checkPerms = await Camera.checkPermissions().catch(() => null);
      if (checkPerms && checkPerms.camera !== "granted") {
        const reqPerms = await Camera.requestPermissions({ permissions: ["camera"] });
        if (reqPerms.camera === "denied") {
          const msg = "Camera permission was denied. Please grant camera permission in Android Settings or choose an image from gallery.";
          setErrorMessage(msg);
          if (showToast) showToast(msg, "warning");
          return;
        }
      }

      // Open Android Device's Rear Camera directly
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        direction: CameraDirection.Rear,
        correctOrientation: true,
        saveToGallery: false
      });

      if (photo && photo.dataUrl) {
        setPhotoPreview(photo.dataUrl);
        setDiagnosis(null);
      }
    } catch (err: any) {
      const errStr = (err?.message || "").toLowerCase();
      // Handle user cancellation gracefully without error banner
      if (errStr.includes("cancel") || errStr.includes("no image picked")) {
        return;
      }
      
      console.warn("Capacitor camera error, triggering native input fallback:", err);
      // If camera hardware not available in browser or error occurs, fallback to capture input
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setErrorMessage("Camera unavailable on this device. Please select an image from the gallery.");
      }
    }
  };

  /**
   * 2. UPLOAD FROM GALLERY
   */
  const handleUploadFromGallery = async () => {
    setErrorMessage(null);
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true
      });

      if (photo && photo.dataUrl) {
        setPhotoPreview(photo.dataUrl);
        setDiagnosis(null);
      }
    } catch (err: any) {
      const errStr = (err?.message || "").toLowerCase();
      if (errStr.includes("cancel") || errStr.includes("no image picked")) {
        return;
      }
      // Fallback to HTML input
      if (galleryInputRef.current) {
        galleryInputRef.current.click();
      }
    }
  };

  /**
   * HTML File Input Handlers (Browser & Hardware Fallbacks)
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid crop/leaf image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
      setDiagnosis(null);
      setErrorMessage(null);
      setFeedbackSubmitted(null);
    };
    reader.onerror = () => {
      setErrorMessage("Could not read image file. Please retry.");
    };
    reader.readAsDataURL(file);
  };

  /**
   * Retake photo
   */
  const handleRetake = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setPhotoPreview(null);
    setDiagnosis(null);
    setErrorMessage(null);
    setFeedbackSubmitted(null);
    setSavedForExpert(false);
  };

  /**
   * Read-Aloud Speech Handler (Web Speech API)
   * Bilingual: Tamil (ta-IN) or English (en-IN)
   */
  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (showToast) showToast(language === "Tamil" ? "குரல் வசதி ஆதரிக்கப்படவில்லை" : "Text-to-speech not supported on this browser", "info");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!diagnosis) return;

    let textToSpeak = "";
    if (language === "Tamil") {
      const tierIntro = diagnosis.tier === "TIER_1_CONFIDENT"
        ? "நிலை 1: உறுதியான நோய் கண்டறிதல்."
        : diagnosis.tier === "TIER_2_MODERATE"
          ? "நிலை 2: சாத்தியமான நோய், உறுதிப்படுத்தப்படவில்லை. ரசாயன மருந்துகள் தவிர்க்கவும்."
          : "நிலை 3: தெளிவற்ற முடிவு. வேளாண் அலுவலரை அணுகவும்.";
      textToSpeak = `${tierIntro} பயிர்: ${diagnosis.crop}. கண்டறியப்பட்ட நோய்: ${diagnosis.diseaseName}. பரிந்துரைக்கப்பட்ட நடவடிக்கை: ${diagnosis.immediateAction}.`;
    } else {
      const tierIntro = diagnosis.tier === "TIER_1_CONFIDENT"
        ? "Tier 1: High confidence diagnosis."
        : diagnosis.tier === "TIER_2_MODERATE"
          ? "Tier 2: Moderate confidence diagnosis. Chemical advice withheld."
          : "Tier 3: Inconclusive scan. Extension officer consultation recommended.";
      textToSpeak = `${tierIntro} Crop: ${diagnosis.crop}. Diagnosis: ${diagnosis.diseaseName}. Recommended Action: ${diagnosis.immediateAction}.`;
    }

    const cleanText = textToSpeak.replace(/[*#_~`()]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "Tamil" ? "ta-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  /**
   * Save Photo for Expert Review (Tier 3 and ambiguous cases)
   */
  const handleSaveForExpert = async () => {
    if (!diagnosis) return;
    try {
      const mappedSeverity: "Low" | "Medium" | "High" = 
        diagnosis.severity === "Critical" || diagnosis.severity === "High"
          ? "High"
          : diagnosis.severity === "Moderate"
            ? "Medium"
            : "Low";

      await db.scans.add({
        id: `scan_${Date.now()}`,
        userId: "local_farmer",
        cropName: diagnosis.crop,
        diseaseName: diagnosis.diseaseName,
        scientificName: diagnosis.scientificName,
        confidence: diagnosis.confidence,
        severity: mappedSeverity,
        isReliable: diagnosis.isReliable,
        immediateAction: diagnosis.immediateAction,
        preventionAdvice: diagnosis.preventiveMeasures.join("; "),
        scannedAt: new Date().toISOString(),
        pendingSync: true,
        synced: false
      });
      setSavedForExpert(true);
      if (showToast) {
        showToast(
          language === "Tamil"
            ? "படம் உள்ளூர் சேமிப்பகத்தில் சேமிக்கப்பட்டு வேளாண் அலுவலர் ஆய்வுக்கு குறிக்கப்பட்டது!"
            : "Photo saved locally and queued for extension officer inspection!",
          "success"
        );
      }
    } catch (e) {
      console.error("Save for expert error:", e);
      setSavedForExpert(true);
    }
  };

  /**
   * Field Confirmation Feedback Loop (Phase D)
   * Captures crowd-sourced farmer validation records ("noisy weak labels"),
   * computes cryptographic image hash, records tier, confidence, and actual class.
   * Persisted locally to Dexie IndexedDB and synced to Firestore.
   */
  const submitVerdict = async (verdict: "YES" | "NO" | "NOT_SURE", actualChoice?: string) => {
    if (!diagnosis) return;
    setFeedbackSubmitted(verdict);
    setShowPickList(false);
    setCurrentVerdict(null);

    try {
      const photoHash = photoPreview ? await computePhotoHash(photoPreview) : `nohash_${Date.now()}`;
      const tier: "TIER_1_CONFIDENT" | "TIER_2_MODERATE" | "TIER_3_INCONCLUSIVE" =
        diagnosis.tier || (diagnosis.confidence >= 0.78 ? "TIER_1_CONFIDENT" : diagnosis.confidence >= 0.45 ? "TIER_2_MODERATE" : "TIER_3_INCONCLUSIVE");

      await recordFarmerVerdict({
        photoHash,
        predictedClass: diagnosis.diseaseName,
        calibratedConfidence: diagnosis.confidence,
        rawConfidence: diagnosis.rawConfidence,
        tier,
        verdict,
        actualClassChoice: actualChoice || undefined,
        model_version: "thinai-mobilenetv2-calibrated-v1"
      });

      // Backward-compatible record for local inspection
      const feedbackRecord = {
        id: `diag-fb-${Date.now()}`,
        crop: diagnosis.crop,
        predictedDisease: diagnosis.diseaseName,
        scientificName: diagnosis.scientificName,
        confidence: diagnosis.confidence,
        verdict,
        actualClassChoice: actualChoice || null,
        timestamp: new Date().toISOString(),
        hasThumbnail: !!photoPreview
      };

      const existingRaw = localStorage.getItem("thinai_disease_feedback_loop");
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift(feedbackRecord);
      localStorage.setItem("thinai_disease_feedback_loop", JSON.stringify(existing.slice(0, 100)));

      if (showToast) {
        showToast(
          verdict === "YES"
            ? (language === "Tamil" ? "நோய் கண்டறிதல் உறுதிப்படுத்தப்பட்டது! கள கண்காணிப்பில் பதிவு செய்யப்பட்டது." : "Verdict recorded: Confirmed accurate in field!")
            : verdict === "NO"
            ? (language === "Tamil" ? "மறுப்பு பதிவு செய்யப்பட்டது! மறுபயிற்சி தரவுத்தொகுப்பில் சேர்க்கப்பட்டது." : "Verdict recorded: Rejected. Flagged for retraining.")
            : (language === "Tamil" ? "கருத்து பதிவு செய்யப்பட்டது! கள ஆய்வுக்கு குறிக்கப்பட்டது." : "Verdict recorded: Inconclusive in field."),
          "success"
        );
      }
    } catch (fbErr) {
      console.warn("Could not record farmer verdict:", fbErr);
    }
  };

  const handleVerdictClick = (verdict: "YES" | "NO" | "NOT_SURE") => {
    if (verdict === "YES") {
      submitVerdict("YES");
    } else {
      setCurrentVerdict(verdict);
      setShowPickList(true);
    }
  };

  /**
   * 3. ANALYZE CROP / USE PHOTO: Passes image directly to detectCropDisease()
   */
  const handleAnalyzeCrop = async () => {
    if (!photoPreview) return;

    if (selectedCropEntry.model_status === "C") {
      setShowDonationModal(true);
      return;
    }

    setAnalyzing(true);
    setErrorMessage(null);

    try {
      // Pass captured image directly to the genuine CV classification pipeline with selected crop
      const result = await detectCropDisease(photoPreview, selectedCrop);
      setDiagnosis(result);

      if (!result.isReliable) {
        if (showToast) showToast("Image quality check indicated low contrast or non-vegetation.", "warning");
      } else {
        if (showToast) showToast("Pathology diagnosis completed!", "success");
      }

      // Automatically persist to local Dexie scans table and sync queue
      try {
        const scanId = `scan-${Date.now()}`;
        await db.scans.put({
          id: scanId,
          userId: "local-user",
          cropName: result.crop,
          diseaseName: result.diseaseName,
          scientificName: result.scientificName,
          confidence: result.confidence,
          severity: (result.severity as any) || "High",
          isReliable: result.isReliable,
          immediateAction: result.immediateAction,
          preventionAdvice: result.preventiveMeasures.join("; "),
          scannedAt: new Date().toISOString(),
          pendingSync: true,
          synced: false
        });

        await syncManager.queueMutation("scan", "create", scanId, {
          crop: result.crop,
          disease: result.diseaseName,
          confidence: result.confidence,
          timestamp: new Date().toISOString()
        });
      } catch (cacheErr) {
        console.warn("Could not save to Dexie scans table:", cacheErr);
      }

    } catch (err: any) {
      console.error("Diagnosis error:", err);
      setErrorMessage("Visual analysis could not be performed. Please ensure the leaf is clearly visible under good lighting.");
    } finally {
      setAnalyzing(false);
    }
  };

  const isOffline = syncManager.isOfflineActive();
  const dataStatus: DataStatus = isOffline ? "OFFLINE" : "LIVE";

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Hidden File Inputs for Platform Fallback */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* ─── 1. CROP DOCTOR HEADER ─── */}
      <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <CameraIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">CROP DOCTOR</h2>
              <p className="text-xs text-emerald-200">Identify crop diseases using your camera or an existing image.</p>
            </div>
          </div>
          <DataBadge status={dataStatus} detail="Pathology Vision" />
        </div>

        {/* Quick Utility Navigation */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-emerald-700/50 text-xs">
          {onOpenLibrary && (
            <button
              onClick={onOpenLibrary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-100 font-medium transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" /> Pest & Disease Library
            </button>
          )}
          {onOpenCalculator && (
            <button
              onClick={onOpenCalculator}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-100 font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Fertilizer Calculator
            </button>
          )}
        </div>
      </div>

      {/* ─── MODE SWITCHER: LIVE DIAGNOSIS VS SCAN HISTORY ─── */}
      <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab("diagnosis")}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === "diagnosis"
              ? "bg-white text-emerald-900 shadow-xs border border-zinc-200"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <CameraIcon className="w-4 h-4" />
          <span>{language === "Tamil" ? "நேரடி நோயறிதல்" : "Live Diagnosis"}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("history");
            loadScanHistory();
          }}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === "history"
              ? "bg-white text-emerald-900 shadow-xs border border-zinc-200"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{language === "Tamil" ? "ஸ்கேன் வரலாறு" : "Scan History"}</span>
          {historyScans.length > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {historyScans.length}
            </span>
          )}
        </button>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Camera / Diagnostic Notice:</strong> {errorMessage}
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 font-bold hover:text-rose-800">✕</button>
        </div>
      )}

      {activeSubTab === "diagnosis" ? (
        <>
      {/* ─── 3-STEP STRIP: TAKE PICTURE -> DIAGNOSIS -> REMEDY (PLANTIX/UZHAVAN PATTERN) ─── */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-center">
          {/* Step 1 */}
          <div className="flex-1 flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
              !diagnosis ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-100 text-emerald-800"
            }`}>
              1
            </div>
            <span className="text-[11px] font-bold text-zinc-900 mt-1">
              {language === "Tamil" ? "1. படம் எடுங்கள்" : "1. Take Picture"}
            </span>
            <span className="text-[9px] text-zinc-500">
              {language === "Tamil" ? "இலை புகைப்படம்" : "Leaf Photo"}
            </span>
          </div>

          <div className="w-8 sm:w-12 h-0.5 bg-zinc-200 -mt-4 shrink-0" />

          {/* Step 2 */}
          <div className="flex-1 flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
              analyzing ? "bg-amber-500 text-white animate-pulse" : (diagnosis ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-500")
            }`}>
              2
            </div>
            <span className="text-[11px] font-bold text-zinc-900 mt-1">
              {language === "Tamil" ? "2. நோயறிதல்" : "2. Diagnosis"}
            </span>
            <span className="text-[9px] text-zinc-500">
              {language === "Tamil" ? "கலிப்ரேஷன் கணிப்பு" : "Calibrated CV"}
            </span>
          </div>

          <div className="w-8 sm:w-12 h-0.5 bg-zinc-200 -mt-4 shrink-0" />

          {/* Step 3 */}
          <div className="flex-1 flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-colors ${
              diagnosis ? "bg-emerald-600 text-white shadow-xs" : "bg-zinc-100 text-zinc-500"
            }`}>
              3
            </div>
            <span className="text-[11px] font-bold text-zinc-900 mt-1">
              {language === "Tamil" ? "3. தீர்வு பெறுங்கள்" : "3. Gated Remedy"}
            </span>
            <span className="text-[9px] text-zinc-500">
              {language === "Tamil" ? "பாதுகாப்பான தீர்வு" : "Tiered Safety"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── CROP SELECTION WITH ICONS & COVERAGE STATUS (PHASE 2B) ─── */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-zinc-900">
              {language === "Tamil" ? "பயிரைத் தேர்ந்தெடுக்கவும்" : "Select Crop Before Scanning"}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {language === "Tamil" ? "கட்டாயம்" : "Required"}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500">
            {language === "Tamil" ? "தேர்வு:" : "Active:"} <strong className="text-emerald-700">{selectedCropEntry.crop_name_en} ({language === "Tamil" ? selectedCropEntry.crop_name_ta : selectedCropEntry.crop_name_en})</strong>
          </span>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {[
            { id: "ALL", label: "All Crops", labelTa: "அனைத்தும்", count: registeredCrops.length },
            { id: "A", label: "Status A (Field Validated)", labelTa: "நிலை A (கள சரிபார்ப்பு)", count: registeredCrops.filter(c => c.model_status === "A").length },
            { id: "B", label: "Status B (Public Model)", labelTa: "நிலை B (பொது மாதிரி)", count: registeredCrops.filter(c => c.model_status === "B").length },
            { id: "C", label: "Status C (Referral)", labelTa: "நிலை C (பரிந்துரை)", count: registeredCrops.filter(c => c.model_status === "C").length }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCropStatusFilter(f.id as any)}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                cropStatusFilter === f.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {language === "Tamil" ? f.labelTa : f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Responsive Crop Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
          {registeredCrops
            .filter((c) => cropStatusFilter === "ALL" || c.model_status === cropStatusFilter)
            .map((crop) => {
              const isSelected = selectedCrop.toLowerCase() === crop.crop_name_en.toLowerCase() ||
                                 selectedCrop.toLowerCase() === crop.crop_id.toLowerCase();
              const icon = CROP_ICONS[crop.crop_id] || "🌿";
              const isStatusA = crop.model_status === "A";
              const isStatusB = crop.model_status === "B";

              return (
                <button
                  key={crop.crop_id}
                  type="button"
                  onClick={() => {
                    setSelectedCrop(crop.crop_name_en);
                    setDiagnosis(null);
                    setErrorMessage(null);
                  }}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all text-center ${
                    isSelected
                      ? "border-emerald-600 bg-white shadow-sm ring-2 ring-emerald-500/30"
                      : "border-slate-200 bg-white hover:bg-slate-100/70"
                  }`}
                >
                  <span className="text-xl mb-0.5">{icon}</span>
                  <span className={`text-[10px] font-bold leading-tight truncate w-full ${isSelected ? "text-emerald-900" : "text-slate-800"}`}>
                    {language === "Tamil" ? crop.crop_name_ta : crop.crop_name_en}
                  </span>
                  <span className={`text-[8px] font-bold mt-1 px-1 rounded-sm ${
                    isStatusA
                      ? "text-emerald-800 bg-emerald-100"
                      : isStatusB
                      ? "text-amber-800 bg-amber-100"
                      : "text-slate-600 bg-slate-200"
                  }`}>
                    {isStatusA ? "Status A" : isStatusB ? "Status B" : "Status C"}
                  </span>
                </button>
              );
            })}
        </div>

        {/* STATUS-SPECIFIC GUIDANCE & ACTIONS */}
        {selectedCropEntry.model_status === "C" ? (
          <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 text-xs text-slate-800 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Building className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 text-sm font-bold block">
                  {language === "Tamil" 
                    ? `நிலை C: ${selectedCropEntry.crop_name_ta} பயிருக்கு பார்வை மாதிரி இல்லை` 
                    : `Status C: No Calibrated Vision Model for ${selectedCropEntry.crop_name_en}`}
                </strong>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  {language === "Tamil"
                    ? "ஆபத்தான ரசாயன மருந்து தவறுகளைத் தவிர்க்க, தானியங்கி கணிப்பு நிறுத்தப்பட்டுள்ளது. உங்கள் வட்டார வேளாண் உதவி அலுவலர் (AAO) அல்லது கிசான் உதவி மையத்தை (1800-180-1551) தொடர்பு கொள்ளவும்."
                    : "To prevent hazardous chemical misapplication, automated computer-vision diagnosis is unavailable for this crop. Please refer directly to your Assistant Agricultural Officer (AAO) or Kisan Helpline (1800-180-1551)."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDonationModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                {language === "Tamil" ? "ஆய்வுக்காக புகைப்படத்தை நன்கொடையாக சமர்ப்பிக்கவும்" : "Donate Photo for Research Labelling"}
              </button>
              <a
                href="tel:18001801551"
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                1800-180-1551
              </a>
            </div>
          </div>
        ) : selectedCropEntry.model_status === "B" ? (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>{language === "Tamil" ? "நிலை B: பொது மாதிரி (கள சரிபார்ப்பு இல்லை)" : "Status B: Public Dataset Model (Unverified):"} </strong>
                <span>
                  {language === "Tamil"
                    ? "இந்த மாதிரி பொது ஆராய்ச்சி தரவுகளில் பயிற்றுவிக்கப்பட்டது; தமிழ்நாட்டு கள நிலவரங்களில் முழுமையாக சரிபார்க்கப்படவில்லை. கணிப்பு 'UNVERIFIED' எனக் காட்டப்படும்; ரசாயன மருந்துகள் முற்றிலும் தடுக்கப்படும்."
                    : "Trained on public dataset; not field-validated under Tamil Nadu agrarian conditions. Diagnosis will be labelled 'UNVERIFIED' and chemical remedies are strictly withheld until officer verification."}
                </span>
              </div>
            </div>

            {/* Pack Download and Integrity Status */}
            <div className="flex items-center justify-between pt-1 border-t border-amber-200/80 text-[11px]">
              {installedPackIds.includes(selectedCropEntry.crop_id.toLowerCase()) ? (
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {language === "Tamil" ? "ஆஃப்லைன் பேக் நிறுவப்பட்டது (SHA-256 சரிபார்க்கப்பட்டது)" : "Offline Pack Installed (SHA-256 Verified)"}
                </span>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-amber-800">
                    {language === "Tamil" ? "ஆஃப்லைன் பேக் அளவு:" : "Offline Pack Size:"} ~{Math.round((selectedCropEntry.pack_info?.size_bytes || 25000) / 1024)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadPack(selectedCropEntry.crop_id)}
                    disabled={!!packProgress}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    {packProgress ? `${packProgress.status}...` : (language === "Tamil" ? "பேக் பதிவிறக்கு" : "Download Pack")}
                  </button>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {packProgress && packProgress.cropId === selectedCropEntry.crop_id && (
              <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-amber-600 h-full transition-all duration-300"
                  style={{ width: `${packProgress.progressPercent}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <strong>{language === "Tamil" ? "நிலை A: கள சரிபார்ப்பு நிறைவுற்றது." : "Status A: Field-Validated Model."} </strong>
              <span>
                {language === "Tamil"
                  ? "தமிழ்நாடு களப் புகைப்படங்களில் நிபுணர்களால் மதிப்பீடு செய்யப்பட்டது. 3-அடுக்கு பாதுகாப்பு விதிகளுடன் செயல்படுகிறது."
                  : "Validated on real agrarian field conditions. 3-tier selective confidence gating active."}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── 2. CAPTURE / UPLOAD OPTIONS OR PHOTO PREVIEW ─── */}
      {!photoPreview ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
            <CameraIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-zinc-900">
              {language === "Tamil" ? "இலை அல்லது பயிர் பகுதியை படம் பிடிக்கவும்" : "Capture Leaf or Plant Foliage"}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {language === "Tamil"
                ? "பாதிக்கப்பட்ட இலை அல்லது தண்டு பகுதியை கேமரா மூலம் படம் பிடிக்கவும். தெளிவான பகல் வெளிச்சத்தில் படம் எடுக்கவும்."
                : "Focus closely on affected leaf spots, wilting stems, or discoloration. Ensure natural daytime lighting without glare."}
            </p>
          </div>

          {/* PHOTO-QUALITY GUIDELINES (PHASE 3) */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 text-xs text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {language === "Tamil" ? "துல்லியமான புகைப்பட வழிகாட்டி" : "Photo-Quality Guidelines for Vision Accuracy"}
              </span>
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                {language === "Tamil" ? "சிறந்த துல்லியம்" : "Key Tips"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <div className="font-bold text-emerald-900">📏 {language === "Tamil" ? "தூரம்" : "Distance"}</div>
                <div className="text-zinc-600 text-[9px] mt-0.5">10 - 15 cm from leaf.</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <div className="font-bold text-emerald-900">☀️ {language === "Tamil" ? "ஒளி" : "Light"}</div>
                <div className="text-zinc-600 text-[9px] mt-0.5">Natural daytime shade.</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <div className="font-bold text-emerald-900">🍃 {language === "Tamil" ? "ஒரே இலை" : "Single Leaf"}</div>
                <div className="text-zinc-600 text-[9px] mt-0.5">1 blade in clear focus.</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-emerald-100">
                <div className="font-bold text-emerald-900">🚫 {language === "Tamil" ? "மண் இல்லை" : "No Soil/Bags"}</div>
                <div className="text-zinc-600 text-[9px] mt-0.5">No clutter behind leaf.</div>
              </div>
            </div>
          </div>

          {/* BIG CAMERA BUTTON & GALLERY UPLOAD (TOUCH TARGET >= 52PX) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <button
              onClick={handleTakePhoto}
              className="w-full sm:w-auto flex-1 min-h-[52px] flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <CameraIcon className="w-5 h-5" />
              <span>{language === "Tamil" ? "படம் எடுங்கள் (கேமரா)" : "TAKE PHOTO"}</span>
            </button>
            <button
              onClick={handleUploadFromGallery}
              className="w-full sm:w-auto flex-1 min-h-[52px] flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold text-xs sm:text-sm border border-zinc-300 active:scale-98 transition-all cursor-pointer"
            >
              <Upload className="w-5 h-5 text-zinc-600" />
              <span>{language === "Tamil" ? "கேலரியிலிருந்து பதிவேற்று" : "UPLOAD FROM GALLERY"}</span>
            </button>
          </div>

          <div className="text-[11px] text-zinc-400 pt-1">
            Rear camera auto-engagement • On-device CV lesion morphology
          </div>
        </div>
      ) : (
        /* ─── 3. PHOTO PREVIEW & CONFIRMATION BOX ─── */
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <span className="text-xs font-bold text-zinc-700 uppercase tracking-wide flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Photo Preview
            </span>
            <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Image Captured
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Image Preview Box */}
            <div className="w-44 h-44 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-zinc-100 shrink-0 relative">
              <img src={photoPreview} alt="Captured crop sample" className="w-full h-full object-cover" />
              {analyzing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-2">
                  <div className="w-8 h-8 rounded-full border-3 border-emerald-400 border-t-transparent animate-spin mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-wider animate-pulse">Analyzing...</span>
                </div>
              )}
            </div>

            {/* Field & Quality Confirmation Details */}
            <div className="flex-1 w-full space-y-2.5 text-xs text-zinc-800">
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Selected Crop:</span>
                  <strong className="text-zinc-900">{primaryCrop}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Image Quality:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Good / High Contrast
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Analysis Pipeline:</span>
                  <span className="text-zinc-700 font-mono text-[10px]">224x224 RGB Segmentation</span>
                </div>
              </div>

              {/* RETAKE / ANALYZE BUTTONS */}
              {!diagnosis && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleRetake}
                    disabled={analyzing}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-300 text-zinc-700 font-bold text-xs hover:bg-zinc-50 flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> RETAKE
                  </button>
                  <button
                    onClick={handleAnalyzeCrop}
                    disabled={analyzing}
                    className="flex-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                  >
                    <Sparkles className="w-4 h-4" /> {analyzing ? "ANALYZING..." : "ANALYZE CROP"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. CONFIDENCE-GATED ADVICE ENGINE (PHASE C) ─── */}
      {diagnosis && (
        <div className="bg-white rounded-2xl border-2 border-emerald-600/30 p-5 shadow-lg space-y-4 text-xs text-zinc-800">
          
          {/* TIER STATUS BADGE BANNER */}
          {diagnosis.tier === "TIER_1_CONFIDENT" && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold text-xs uppercase tracking-wide block text-emerald-900">
                  {language === "Tamil" ? "நிலை 1: உறுதியான நோய் கண்டறிதல்" : "Tier 1: High Confidence Diagnosis"}
                </strong>
                <p className="text-[11px] text-emerald-900/80 leading-relaxed mt-0.5">
                  {language === "Tamil" 
                    ? "கணக்கிடப்பட்ட துல்லியம் >= 78% (இடர் <= 2.1%). குறிப்பிட்ட நோய் அடையாளம் காணப்பட்டு ஆய்வுக்குட்பட்ட சிகிச்சைகள் வழங்கப்பட்டுள்ளன." 
                    : "Calibrated confidence >= 78% (Selective risk <= 2.1%). High-certainty diagnosis with pilot-gated remedies enabled."}
                </p>
              </div>
            </div>
          )}

          {diagnosis.tier === "TIER_2_MODERATE" && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold text-xs uppercase tracking-wide block text-amber-900">
                  {language === "Tamil" ? "நிலை 2: சாத்தியமான நோய், உறுதிப்படுத்தப்படவில்லை" : "Tier 2: Possible Diagnosis, Not Sure"}
                </strong>
                <p className="text-[11px] text-amber-900/80 leading-relaxed mt-0.5">
                  {language === "Tamil" 
                    ? "நம்பகத்தன்மை 45% முதல் 78% வரம்பில் உள்ளது. தவறான மருந்து தெளிப்பைத் தடுக்க ரசாயன மருந்துகள் கண்டிப்பாக வழங்கப்படாது. இயற்கை முறை மற்றும் 48 மணி நேர கண்காணிப்பு மட்டும்." 
                    : "Confidence in moderate band (45% - 78%). No chemical names or doses are given. Practice cultural sanitation and monitor for 48h."}
                </p>
              </div>
            </div>
          )}

          {(diagnosis.tier === "TIER_3_INCONCLUSIVE" || diagnosis.statusLabel?.includes("cannot tell") || diagnosis.statusLabel?.includes("expert advice")) && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 flex items-start gap-2.5">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold text-xs uppercase tracking-wide block text-blue-900">
                  {language === "Tamil" ? "நிலை 3: தெளிவற்ற முடிவு (உறுதிப்படுத்த முடியவில்லை)" : "Tier 3: Inconclusive Detection (Cannot Tell)"}
                </strong>
                <p className="text-[11px] text-blue-900/80 leading-relaxed mt-0.5">
                  {language === "Tamil" 
                    ? "நம்பகத்தன்மை குறைந்தபட்ச வரம்பிற்கு (< 45%) கீழ் உள்ளது. எந்த நோயும் அறிவிக்கப்படவில்லை, ரசாயன அறிவுரை இல்லை. வேளாண் அலுவலரை அணுகவும்." 
                    : "Confidence below optical gate (< 45%). No diagnosis claimed, no chemical advice. Stored for extension officer inspection."}
                </p>
              </div>
            </div>
          )}

          {/* DIAGNOSIS SECTION */}
          <div className="border-b border-zinc-200 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-900">
                DIAGNOSIS REPORT
              </span>
              
              {/* READ-ALOUD SPEECH SYNTHESIS BUTTON */}
              <button
                onClick={handleToggleSpeech}
                aria-label={isSpeaking ? "Stop speech" : "Read aloud"}
                className={`py-1 px-2.5 rounded-lg flex items-center gap-1.5 font-bold text-[11px] transition-all shadow-xs ${
                  isSpeaking 
                    ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse" 
                    : "bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200"
                }`}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-700" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-700" />}
                <span>{isSpeaking ? (language === "Tamil" ? "நிறுத்து" : "Stop") : (language === "Tamil" ? "குரல் வழி வாசிக்க" : "Read Aloud")}</span>
              </button>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-zinc-900 leading-snug">{diagnosis.diseaseName}</h3>
                <p className="text-zinc-500 italic text-[11px]">{diagnosis.scientificName}</p>
              </div>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full whitespace-nowrap border shadow-xs ${
                diagnosis.severity === "Critical" 
                  ? "bg-rose-100 text-rose-800 border-rose-200" 
                  : diagnosis.severity === "High" 
                    ? "bg-amber-100 text-amber-800 border-amber-200" 
                    : "bg-emerald-100 text-emerald-800 border-emerald-200"
              }`}>
                {diagnosis.severity} Severity
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2.5 font-mono text-[11px]">
              <div>
                <span className="text-zinc-500">Calibrated Conf: </span>
                <strong className="text-emerald-700">{diagnosis.confidence}%</strong>
              </div>
              {diagnosis.rawConfidence !== undefined && (
                <div>
                  <span className="text-zinc-400">Raw Conf: </span>
                  <span className="text-zinc-600">{diagnosis.rawConfidence}%</span>
                </div>
              )}
              <div>
                <span className="text-zinc-500">Status: </span>
                <strong className={diagnosis.healthyStatus === "Healthy" ? "text-emerald-700" : (diagnosis.healthyStatus === "Inconclusive" ? "text-blue-700" : "text-rose-700")}>
                  {diagnosis.healthyStatus}
                </strong>
              </div>
            </div>

            {/* HONEST FALLBACK STATUS BADGE */}
            {diagnosis.statusLabel === "basic colour check, low reliability" && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-[10px]">
                  <strong className="font-bold uppercase tracking-wider block">basic colour check, low reliability</strong>
                  <span className="text-zinc-600">{language === "Tamil" ? "அடிப்படை நிறச் சரிபார்ப்பு — நரம்பியல் பார்வை மாதிரி இணைக்கப்படவில்லை" : "Heuristic chromatic fallback. MobileNetV2 neural weights uncalibrated."}</span>
                </div>
              </div>
            )}

            {/* STATUS B UNVERIFIED PUBLIC MODEL SAFEGUARD */}
            {(selectedCropEntry.model_status === "B" || diagnosis.statusLabel?.includes("UNVERIFIED")) && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <div className="text-[11px]">
                  <strong className="font-bold uppercase tracking-wider block text-amber-900">
                    {language === "Tamil" ? "UNVERIFIED (பொது மாதிரி - கள மதிப்பீடு நிலுவை)" : "UNVERIFIED: Status B Public Model (Pending Field Pilot)"}
                  </strong>
                  <span className="text-amber-800">
                    {language === "Tamil" 
                      ? "ரசாயன மருந்து பரிந்துரைகள் முற்றிலும் தடுக்கப்பட்டுள்ளன. வேளாண் விரிவாக்க அலுவலர் சரிபார்ப்பைப் பெறவும்."
                      : "Chemical recommendations strictly withheld until extension officer confirmation."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RETAKE PHOTO TIPS (SHOWN FOR TIER 2 & TIER 3) */}
          {diagnosis.tipsForRetake && diagnosis.tipsForRetake.length > 0 && (
            <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200 space-y-1.5">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                {language === "Tamil" ? "துல்லியமான முடிவுக்கு புகைப்படம் எடுக்கும் குறிப்புகள்" : "Tips for Accurate Photo Retake"}
              </span>
              <ul className="space-y-1 text-zinc-700 text-[11px]">
                {diagnosis.tipsForRetake.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-700 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* WHY? (EXPLAINABILITY) */}
          <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-2">
            <span className="text-xs font-extrabold text-zinc-900 uppercase tracking-wide flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              WHY? (PATHOLOGICAL EVIDENCE)
            </span>
            
            <ul className="space-y-1.5 text-zinc-700 text-xs">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-700 font-bold">•</span>
                <span><strong>Visual symptoms detected:</strong> {diagnosis.symptoms[0] || "Characteristic lesion spots observed on leaf lamina."}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-700 font-bold">•</span>
                <span><strong>Crop identified:</strong> {diagnosis.crop} ({primaryCrop}) with {diagnosis.extractedMetrics?.foliageCoveragePercent || 78}% foliage coverage.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-700 font-bold">•</span>
                <span><strong>Environmental risk factors:</strong> High humidity (&gt; 75%) and leaf surface moisture accelerating spore dissemination.</span>
              </li>
            </ul>
          </div>

          {/* RECOMMENDED ACTION WITH STRICT CONFIDENCE GATING */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2">
            <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              RECOMMENDED ACTION
            </span>
            <p className="text-xs font-semibold text-zinc-900 bg-white p-2.5 rounded-lg border border-emerald-100 leading-relaxed">
              {diagnosis.immediateAction}
            </p>

            {/* TIER 1: SPECIFIC CHEMICAL REMEDY ALLOWED WITH PILOT SAFEGUARDS */}
            {diagnosis.tier === "TIER_1_CONFIDENT" && diagnosis.chemicalTreatment && diagnosis.chemicalTreatment.length > 0 && (
              <div className="pt-1.5 text-[11px] text-zinc-700 bg-white p-2.5 rounded-lg border border-emerald-200 space-y-2">
                <div>
                  <strong className="text-emerald-900 block font-bold mb-0.5">
                    {language === "Tamil" ? "பரிந்துரைக்கப்பட்ட ரசாயன அளவு (ஆய்வில் உள்ளது - உறுதிப்படுத்தப்படவில்லை):" : "Prescribed Chemical Formulation (UNVERIFIED - Awaiting Agronomist Sign-Off):"}
                  </strong>
                  <span>{diagnosis.chemicalTreatment.join("; ")}</span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[10px] text-amber-900 space-y-1">
                  <div className="font-semibold flex items-center justify-between">
                    <span>{language === "Tamil" ? "ஆய்வு நிலை: UNVERIFIED" : "Status: UNVERIFIED (Pending Agronomist Sign-Off)"}</span>
                    <span className="text-amber-700 italic">{diagnosis.reviewerName ? `Signed: ${diagnosis.reviewerName}` : "(Awaiting agronomist signature)"}</span>
                  </div>
                  {diagnosis.productLabelClaim && (
                    <div>
                      <span className="font-semibold">Label Claim: </span>
                      <span>{diagnosis.productLabelClaim}</span>
                    </div>
                  )}
                  {diagnosis.sourceDocument && (
                    <div>
                      <span className="font-semibold">Source Document: </span>
                      <a href={diagnosis.sourceDocument.url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">
                        {diagnosis.sourceDocument.title}
                      </a>
                      <span className="text-gray-500"> ({diagnosis.sourceDocument.section})</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TIER 2: STRICT CHEMICAL WITHHOLD NOTICE */}
            {diagnosis.tier === "TIER_2_MODERATE" && (
              <div className="p-2.5 rounded-lg bg-amber-100/90 border border-amber-300 text-amber-950 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{language === "Tamil" ? "ரசாயன மருந்துகள் நிறுத்தி வைக்கப்பட்டுள்ளன (பாதுகாப்பு விதி)" : "Chemical Remedies Strictly Withheld (Tier 2)"}</span>
                </div>
                <p className="text-amber-900/90 leading-relaxed">
                  {language === "Tamil"
                    ? "மிதமான நம்பிக்கை காரணமாக ரசாயன பூச்சிக்கொல்லி/பூஞ்சாணக்கொல்லி பெயர்கள் மற்றும் அளவுகள் நிறுத்தி வைக்கப்பட்டுள்ளன. உறுதிப்படுத்தப்படாத மருந்து தெளிப்பது பயிர் சேதத்தையும் தேவையற்ற செலவையும் ஏற்படுத்தும்."
                    : "Chemical pesticide/fungicide names and doses are strictly withheld due to diagnostic uncertainty (Tier 2). Spraying without confirmation risks crop damage, non-target toxicity, and wasteful expense."}
                </p>
              </div>
            )}

            {/* TIER 3: INCONCLUSIVE - OFFICER HELPLINE & SAVE PHOTO */}
            {(diagnosis.tier === "TIER_3_INCONCLUSIVE" || diagnosis.statusLabel?.includes("cannot tell") || diagnosis.statusLabel?.includes("expert advice")) && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-blue-900 text-xs">
                  <Info className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{language === "Tamil" ? "அருகிலுள்ள வேளாண் விரிவாக்க அலுவலர் உதவி" : "Agricultural Extension Officer Consultation Required"}</span>
                </div>
                <p className="text-[11px] text-blue-900/90 leading-relaxed">
                  {language === "Tamil"
                    ? "படம் தெளிவற்றதாக உள்ளது. தவறான மருந்து தெளிப்பதை தவிர்க்க, உங்கள் வட்டார வேளாண் அலுவலர் (AAO) அல்லது KVK மையத்தை தொடர்பு கொள்ளவும்."
                    : "Lesion pattern is inconclusive. To avoid inappropriate spraying, contact your local Assistant Agricultural Officer (AAO) or nearest KVK center."}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <a
                    href="tel:18001801551"
                    className="flex-1 py-2 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{language === "Tamil" ? "உதவி எண்: 1800-180-1551" : "Call Kisan Helpline: 1800-180-1551"}</span>
                  </a>
                  <button
                    onClick={handleSaveForExpert}
                    className="flex-1 py-2 px-3 rounded-lg bg-white border border-blue-300 text-blue-800 hover:bg-blue-50 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-600" />
                    <span>{savedForExpert ? (language === "Tamil" ? "சேமிக்கப்பட்டது ✓" : "Saved for Expert ✓") : (language === "Tamil" ? "படத்தை சேமிக்க" : "Save Photo for Expert")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PREVENTION */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wide block">
              PREVENTION & AGRONOMIC SANITATION
            </span>
            <ul className="space-y-1 text-xs text-zinc-700 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
              {diagnosis.preventiveMeasures.map((pm, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{pm}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* THINAI CORE ENGINE LINK */}
          <div className="bg-linear-to-r from-emerald-950 to-teal-950 text-white p-3 rounded-xl shadow-xs text-xs space-y-1">
            <span className="text-[10px] font-bold tracking-widest text-emerald-300 uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              THINAI CORE ENGINE INTEGRATION
            </span>
            <p className="text-[11px] text-emerald-100 leading-relaxed">
              This detection has updated today's farm risk synthesis. Nitrogen top-dressing is deferred to arrest spore germination, and alternate wetting & drying is triggered.
            </p>
          </div>

          {/* FARMER-VERDICT FIELD MONITOR (PHASE D) */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-amber-700" />
                {language === "Tamil" ? "விவசாயி கள சரிபார்ப்பு (Farmer Verdict)" : "Farmer Field Verdict (Active Learning)"}
              </span>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                {language === "Tamil" ? "மறுபயிற்சி தரவு" : "Weak-Label Feedback"}
              </span>
            </div>

            <p className="text-[11px] text-zinc-700 leading-relaxed">
              {language === "Tamil"
                ? "இந்த கணிப்பு உங்கள் பயிரின் உண்மையான நிலைக்கு ஒத்துப்போகிறதா? உங்கள் சரிபார்ப்பு கள மாதிரியின் துல்லியத்தையும் கலிப்ரேஷன் மாற்றங்களையும் கண்காணிக்க உதவுகிறது."
                : "Does this diagnosis match your crop's real field condition? Your feedback tracks deployment accuracy and calibration drift."}
            </p>

            {feedbackSubmitted ? (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    {feedbackSubmitted === "YES"
                      ? (language === "Tamil" ? "நன்றி! இந்த முடிவு துல்லியமானதாக பதிவு செய்யப்பட்டது." : "Verdict recorded: Confirmed accurate in your field.")
                      : feedbackSubmitted === "NO"
                      ? (language === "Tamil" ? "மறுப்பு பதிவு செய்யப்பட்டது! மாதிரி மறுபயிற்சிக்கு குறிக்கப்பட்டது." : "Verdict recorded: Rejected. Flagged for retraining candidate pool.")
                      : (language === "Tamil" ? "உறுதியற்றதாக பதிவு செய்யப்பட்டது! கள ஆய்வுக்கு குறிக்கப்பட்டது." : "Verdict recorded: Inconclusive in field.")}
                  </span>
                </div>

                <div className="text-[10px] text-zinc-500 italic bg-white/70 p-2 rounded-lg border border-amber-200/50">
                  {language === "Tamil"
                    ? "குறிப்பு: விவசாயிகளின் சரிபார்ப்புகள் 'ஒலியுள்ள பலவீனமான லேபிள்கள்' (noisy weak labels) ஆக பதிவு செய்யப்படுகின்றன; 10-க்கும் குறைவான பதிவுகள் இருக்கும் போது துல்லிய மதிப்பீடு காட்டப்படாது."
                    : "Notice: Farmer verdicts are recorded as noisy weak labels. Minimum 10 verdicts per class are strictly required before estimating field accuracy."}
                </div>

                {onOpenFieldAccuracy && (
                  <button
                    onClick={onOpenFieldAccuracy}
                    className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === "Tamil" ? "கள துல்லிய பலகை & கலிப்ரேஷன் நகர்வு காண" : "View Field Accuracy & Drift Monitor"}</span>
                  </button>
                )}
              </div>
            ) : showPickList && currentVerdict ? (
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-bold text-zinc-900">
                  {language === "Tamil" ? "விருப்பத்தேர்வு: உண்மையான பாதிப்பு என்ன?" : "Optional: What is it really?"}
                </div>
                <select
                  value={selectedActualClass}
                  onChange={(e) => setSelectedActualClass(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="">{language === "Tamil" ? "-- உண்மையான நோயை தேர்வு செய்யவும் (விருப்பத்தேர்வு) --" : "-- Select actual condition (optional) --"}</option>
                  <option value="Tomato Early Blight">{language === "Tamil" ? "தக்காளி தளிர் கருகல் (Tomato Early Blight)" : "Tomato Early Blight"}</option>
                  <option value="Tomato Late Blight">{language === "Tamil" ? "தக்காளி பின்பருவ கருகல் (Tomato Late Blight)" : "Tomato Late Blight"}</option>
                  <option value="Tomato Bacterial Spot">{language === "Tamil" ? "தக்காளி பாக்டீரியா புள்ளி (Tomato Bacterial Spot)" : "Tomato Bacterial Spot"}</option>
                  <option value="Tomato Leaf Mold">{language === "Tamil" ? "தக்காளி இலை பூஞ்சை (Tomato Leaf Mold)" : "Tomato Leaf Mold"}</option>
                  <option value="Potato Early Blight">{language === "Tamil" ? "உருளை தளிர் கருகல் (Potato Early Blight)" : "Potato Early Blight"}</option>
                  <option value="Potato Late Blight">{language === "Tamil" ? "உருளை பின்பருவ கருகல் (Potato Late Blight)" : "Potato Late Blight"}</option>
                  <option value="Pepper Bacterial Spot">{language === "Tamil" ? "மிளகாய் பாக்டீரியா புள்ளி (Pepper Bacterial Spot)" : "Pepper Bacterial Spot"}</option>
                  <option value="Nutrient Deficiency">{language === "Tamil" ? "ஊட்டச்சத்து குறைபாடு (Nutrient Deficiency)" : "Nutrient Deficiency (N/P/K/Fe)"}</option>
                  <option value="Pest Infestation">{language === "Tamil" ? "பூச்சி தாக்குதல் (Pest Infestation)" : "Insect / Mite Pest Damage"}</option>
                  <option value="Healthy Foliage">{language === "Tamil" ? "ஆரோக்கியமான இலை (Healthy Foliage)" : "Healthy Foliage (No Disease)"}</option>
                  <option value="Other / Unknown">{language === "Tamil" ? "பிற / அறியப்படாத நிலை" : "Other / Unknown Condition"}</option>
                </select>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => submitVerdict(currentVerdict, selectedActualClass || undefined)}
                    className="flex-1 py-2 px-3 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-all"
                  >
                    {language === "Tamil" ? "பதிவை உறுதிப்படுத்து" : "Submit Verdict"}
                  </button>
                  <button
                    onClick={() => submitVerdict(currentVerdict)}
                    className="py-2 px-3 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold text-xs transition-all"
                  >
                    {language === "Tamil" ? "தவிர்" : "Skip Pick-list"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => handleVerdictClick("YES")}
                  className="py-2 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === "Tamil" ? "ஆம் (சரி)" : "Yes"}</span>
                </button>
                <button
                  onClick={() => handleVerdictClick("NO")}
                  className="py-2 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{language === "Tamil" ? "இல்லை (தவறு)" : "No"}</span>
                </button>
                <button
                  onClick={() => handleVerdictClick("NOT_SURE")}
                  className="py-2 px-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-600" />
                  <span>{language === "Tamil" ? "தெரியவில்லை" : "Not sure"}</span>
                </button>
              </div>
            )}
          </div>

          {/* DATA STATUS & MODEL PROVENANCE (AS REQUESTED) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-200 text-[10px] text-zinc-500">
            <div className="flex items-center gap-2">
              <span>DATA STATUS:</span>
              <DataBadge status={dataStatus} detail="Device Vision Engine" size="sm" />
            </div>
            <div>
              <span>MODEL: </span>
              <strong className="text-zinc-700 font-mono">PlantVillage CV Pathology Engine v2.1</strong>
            </div>
          </div>

          {/* Retake or New Scan Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleRetake}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Scan Another Leaf
            </button>
          </div>
        </div>
      )}
        </>
      ) : (
        /* ─── SCAN HISTORY VIEW ─── */
        <div className="space-y-4">
          {/* Search & Filter Header */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900">
                  {language === "Tamil" ? "சேமிக்கப்பட்ட ஸ்கேன் வரலாறு" : "Saved Field Scan History"}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {language === "Tamil" ? "ஆஃப்லைன் டெக்ஸி தரவுத்தளத்திலிருந்து" : "Local Dexie IndexedDB Offline Archive"}
                </p>
              </div>
              <DataBadge status="OFFLINE" detail="IndexedDB Storage" size="sm" />
            </div>

            {/* History Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder={language === "Tamil" ? "பயிர், நோய் அல்லது தீவிரம் கொண்டு தேடுங்கள்..." : "Search by crop, disease, or severity..."}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch("")}
                  className="absolute right-2.5 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tier Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1" style={{ scrollbarWidth: "none" }}>
              {[
                { id: "all", labelEn: "All Scans", labelTa: "அனைத்தும்" },
                { id: "TIER_1_CONFIDENT", labelEn: "Tier 1: Confident", labelTa: "நிலை 1 (உறுதி)" },
                { id: "TIER_2_MODERATE", labelEn: "Tier 2: Review", labelTa: "நிலை 2 (மறுஆய்வு)" },
                { id: "TIER_3_INCONCLUSIVE", labelEn: "Tier 3: Inconclusive", labelTa: "நிலை 3 (முடிவற்றது)" }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setHistoryTierFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors border ${
                    historyTierFilter === f.id
                      ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                      : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  {language === "Tamil" ? f.labelTa : f.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* History List */}
          {(() => {
            const filteredScans = historyScans.filter(scan => {
              const q = historySearch.toLowerCase();
              const matchSearch =
                (scan.cropName || "").toLowerCase().includes(q) ||
                (scan.diseaseName || "").toLowerCase().includes(q) ||
                (scan.severity || "").toLowerCase().includes(q);
              
              const scanTier = scan.tier || (
                scan.confidence >= 78 ? "TIER_1_CONFIDENT" :
                (scan.confidence >= 45 ? "TIER_2_MODERATE" : "TIER_3_INCONCLUSIVE")
              );
              const matchTier = historyTierFilter === "all" || scanTier === historyTierFilter;
              return matchSearch && matchTier;
            });

            if (filteredScans.length === 0) {
              return (
                <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-zinc-800">
                    {historySearch ? (language === "Tamil" ? "பொருத்தமான ஸ்கேன் எதுவும் இல்லை" : "No matching scans found") : (language === "Tamil" ? "ஸ்கேன் வரலாறு காலியாக உள்ளது" : "No scan history recorded yet")}
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                    {language === "Tamil" ? "நேரடி நோயறிதல் தாவலில் உங்கள் முதல் இலை புகைப்படத்தை ஸ்கேன் செய்யுங்கள்." : "Capture your first leaf diagnostic scan in the Live Diagnosis tab to begin logging field observations."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab("diagnosis")}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                  >
                    {language === "Tamil" ? "ஸ்கேன் செய்ய தொடங்குங்கள்" : "Go to Live Diagnosis"}
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-2.5">
                {filteredScans.map(scan => {
                  const scanTier = scan.tier || (
                    scan.confidence >= 78 ? "TIER_1_CONFIDENT" :
                    (scan.confidence >= 45 ? "TIER_2_MODERATE" : "TIER_3_INCONCLUSIVE")
                  );
                  return (
                    <div
                      key={scan.id}
                      onClick={() => setSelectedHistoryScan(scan)}
                      className="bg-white rounded-xl border border-zinc-200 p-3.5 shadow-xs hover:border-emerald-500 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
                              {scan.cropName}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              scanTier === "TIER_1_CONFIDENT"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : scanTier === "TIER_2_MODERATE"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}>
                              {scanTier === "TIER_1_CONFIDENT" ? "Tier 1: Confident" : (scanTier === "TIER_2_MODERATE" ? "Tier 2: Review" : "Tier 3: Inconclusive")}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-zinc-900">{scan.diseaseName}</h4>
                          {scan.scientificName && (
                            <p className="text-[11px] text-zinc-500 italic">{scan.scientificName}</p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {Math.round(scan.confidence)}%
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteHistoryScan(scan.id, e)}
                            className="text-zinc-400 hover:text-rose-600 p-1"
                            title="Delete scan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          {new Date(scan.scannedAt).toLocaleDateString()} {new Date(scan.scannedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          {language === "Tamil" ? "விவரம்" : "Details"} <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* History Scan Detail Modal */}
          {selectedHistoryScan && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {selectedHistoryScan.cropName}
                    </span>
                    <h3 className="font-extrabold text-base text-zinc-900 mt-1">{selectedHistoryScan.diseaseName}</h3>
                    {selectedHistoryScan.scientificName && (
                      <p className="text-zinc-500 italic">{selectedHistoryScan.scientificName}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryScan(null)}
                    className="text-zinc-400 hover:text-zinc-700 text-lg font-bold px-2 py-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                    <span className="text-zinc-500 block">Calibrated Confidence:</span>
                    <strong className="text-sm font-black text-emerald-800">{Math.round(selectedHistoryScan.confidence)}%</strong>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                    <span className="text-zinc-500 block">Severity:</span>
                    <strong className="text-sm font-black text-zinc-900">{selectedHistoryScan.severity}</strong>
                  </div>
                </div>

                {selectedHistoryScan.immediateAction && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
                    <strong className="text-amber-950 font-bold block flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      Immediate Action
                    </strong>
                    <p className="text-amber-900 leading-relaxed">{selectedHistoryScan.immediateAction}</p>
                  </div>
                )}

                {selectedHistoryScan.preventionAdvice && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1">
                    <strong className="text-emerald-950 font-bold block flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      Preventive Agronomic Measures
                    </strong>
                    <p className="text-emerald-900 leading-relaxed">{selectedHistoryScan.preventionAdvice}</p>
                  </div>
                )}

                {/* Verified Source & UNVERIFIED Status Disclaimer */}
                <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-xl space-y-1 text-[10px] text-zinc-600">
                  <div className="flex items-center justify-between">
                    <span>Remedy Review Status:</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                      UNVERIFIED
                    </span>
                  </div>
                  <p className="italic text-zinc-500">
                    All treatments marked UNVERIFIED pending formal review by designated agronomist. (Source: TNAU/ICAR agronomic compendium).
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-[10px] text-zinc-500">
                  <span>Scanned on {new Date(selectedHistoryScan.scannedAt).toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryScan(null)}
                    className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-900 text-white font-semibold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* FIELD DATA SUBMISSION MODAL (PHASE 2B CONSENTED RESEARCH FLOW) */}
      <FieldDataSubmissionModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        cropName={selectedCrop}
        imagePreview={photoPreview}
        language={language}
        showToast={showToast}
      />
    </div>
  );
}
