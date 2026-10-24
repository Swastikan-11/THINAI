// THINAI Consented Field Data Submission Modal (Phase 2B)
// Allows farmers to donate uncalibrated crop leaf images to the Tamil Nadu Extension Officer
// ground-truth research pipeline with explicit DPDP Act compliant consent.

import React, { useState } from "react";
import { ShieldCheck, Upload, AlertCircle, CheckCircle2, X, Lock, Building, MapPin } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firestoreDb } from "../../firebase";
import { db } from "../../services/db";

interface FieldDataSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropName: string;
  imagePreview: string | null;
  language?: string;
  showToast?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function FieldDataSubmissionModal({
  isOpen,
  onClose,
  cropName,
  imagePreview,
  language = "English",
  showToast
}: FieldDataSubmissionModalProps) {
  const isTa = language === "Tamil";

  const [hasConsented, setHasConsented] = useState(false);
  const [district, setDistrict] = useState("Thanjavur");
  const [village, setVillage] = useState("");
  const [symptomNotes, setSymptomNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConsented) {
      if (showToast) showToast(isTa ? "தயவுசெய்து ஒப்புதல் பெட்டியைத் தேர்ந்தெடுக்கவும்" : "Please check the consent box to proceed", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const record = {
        userId: "anonymous-farmer-donation",
        crop: cropName,
        predictedClass: "UNLABELLED_FIELD_DONATION",
        calibratedConfidence: 0,
        tier: "TIER_3_INCONCLUSIVE" as const,
        district,
        village: village.trim() || undefined,
        symptomNotes: symptomNotes.trim() || undefined,
        thumbnailBase64: imagePreview || undefined,
        photoConsent: true,
        source: "FIELD_RESEARCH_DONATION",
        timestamp: new Date().toISOString()
      };

      // 1. Save to local Dexie queue
      try {
        await db.scans.add({
          id: `field-donation-${Date.now()}`,
          userId: "anonymous-farmer-donation",
          cropName: cropName,
          diseaseName: isTa ? "கள ஆய்வுக்காக சேமிக்கப்பட்டது" : "Submitted for Field Research",
          confidence: 0,
          severity: "Low",
          isReliable: false,
          scannedAt: new Date().toISOString(),
          pendingSync: true,
          synced: false
        } as any);
      } catch (localErr) {
        console.warn("Could not save donation locally:", localErr);
      }

      // 2. Save to Firestore if online
      try {
        const diagnosesRef = collection(firestoreDb, "diagnoses");
        await addDoc(diagnosesRef, {
          ...record,
          serverCreated: serverTimestamp()
        });
      } catch (cloudErr) {
        console.warn("Firestore donation write offline/skipped:", cloudErr);
      }

      setSubmitted(true);
      if (showToast) {
        showToast(
          isTa 
            ? "புகைப்படம் வேளாண் விரிவாக்க ஆய்வுக்கு வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!" 
            : "Photo successfully submitted for extension officer research labelling!",
          "success"
        );
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      if (showToast) showToast(err?.message || "Submission failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="donation-modal-title">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 id="donation-modal-title" className="text-lg font-bold text-slate-900">
                {isTa ? "கள ஆய்வுக்கான புகைப்படப் பங்களிப்பு" : "Field Research Photo Donation"}
              </h2>
              <p className="text-xs text-slate-500">
                {isTa ? "தமிழ்நாடு வேளாண் விரிவாக்க அலுவலர் மதிப்பீட்டிற்கு" : "For Tamil Nadu Extension Officer ground-truth labelling"}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label={isTa ? "மூடு" : "Close"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {isTa ? "பங்களிப்புக்கு நன்றி!" : "Thank You for Contributing!"}
            </h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              {isTa 
                ? "உங்கள் புகைப்படம் தமிழ்நாடு வேளாண் ஆய்வாளர்களின் தரவுத்தொகுப்பில் சேர்க்கப்பட்டு, மாதிரி துல்லியத்தை மேம்படுத்த உதவும்."
                : `Your photo of ${cropName} has been queued for expert agronomist annotation. This directly helps extend model validation to Tamil Nadu farmers.`}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
            >
              {isTa ? "சரி, திரும்பு" : "Done"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-44 flex items-center justify-center">
                <img src={imagePreview} alt="Crop specimen preview" className="object-cover max-h-44 w-full" />
                <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-white flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  {cropName}
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 text-xs text-amber-900 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {isTa
                  ? "இந்த பயிருக்கு இன்னும் கள சரிபார்ப்பு மாதிரி இல்லை. உங்கள் மாதிரி தமிழ்நாடு வேளாண் பல்கலைக்கழகம் (TNAU) / KVK ஆய்வாளர்களால் சரிபார்க்கப்படும்."
                  : `Currently, THINAI has no verified vision model for ${cropName}. Donating this sample directly supports extension officers in building field validation sets.`}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isTa ? "மாவட்டம்" : "District"}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Thanjavur">Thanjavur (தஞ்சாவூர்)</option>
                <option value="Coimbatore">Coimbatore (கோயம்புத்தூர்)</option>
                <option value="Madurai">Madurai (மதுரை)</option>
                <option value="Tirunelveli">Tirunelveli (திருநெல்வேலி)</option>
                <option value="Salem">Salem (சேலம்)</option>
                <option value="Dindigul">Dindigul (திண்டுக்கல்)</option>
                <option value="Erode">Erode (ஈரோடு)</option>
                <option value="Tiruchirappalli">Tiruchirappalli (திருச்சிராப்பள்ளி)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isTa ? "கிராமம் / ஊர் (விரும்பினால்)" : "Village / Town (Optional)"}
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder={isTa ? "எ.கா. வல்லம்" : "e.g. Vallam"}
                className="w-full text-sm rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isTa ? "கண்டறிந்த அறிகுறிகள் (விரும்பினால்)" : "Observed Symptoms (Optional)"}
              </label>
              <textarea
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
                rows={2}
                placeholder={isTa ? "எ.கா. இலை நுனி கருகல், மஞ்சள் புள்ளிகள்..." : "e.g. Yellow lesions spreading from leaf margin..."}
                className="w-full text-sm rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* DPDP Act Compliant Consent Checkbox */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 leading-normal">
                <input
                  type="checkbox"
                  checked={hasConsented}
                  onChange={(e) => setHasConsented(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="font-medium text-slate-800">
                  {isTa
                    ? "டிஜிட்டல் தனிநபர் தரவுப் பாதுகாப்பு (DPDP) சட்டத்தின் கீழ், இந்த அநாமதேய இலை புகைப்படத்தை வேளாண் ஆராய்ச்சி மற்றும் மாதிரி சரிபார்ப்புக்காகப் பயன்படுத்த நான் மனப்பூர்வமாக ஒப்புதல் அளிக்கிறேன்."
                    : "In accordance with the Digital Personal Data Protection (DPDP) Act, I explicitly consent to donating this anonymous crop leaf photograph to the extension officer pathology research dataset."}
                </span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>{isTa ? "அடையாளம் அல்லது தனிப்பட்ட தகவல்கள் பகிரப்படாது." : "No facial or identifying personal data is stored."}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
              >
                {isTa ? "ரத்துசெய்" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={!hasConsented || submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isTa ? "அனுப்புகிறது..." : "Submitting..."}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{isTa ? "சமர்ப்பிக்கவும்" : "Submit Photo"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
